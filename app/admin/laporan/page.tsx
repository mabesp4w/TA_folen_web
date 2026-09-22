import type { Metadata } from "next";
import {
  LaporanManager,
  type FilterOption,
  type KehadiranReport,
  type KeuanganReport,
  type LaporanTab,
  type StatistikReport,
  type UlangTahunReport,
} from "@/components/admin/laporan";
import {
  KATEGORI_KEUANGAN,
  LABEL_KATEGORI_KEUANGAN,
} from "@/components/admin/keuangan/schema";
import { requireResourceView } from "@/lib/permissions-server";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Laporan" };

const VALID_TABS: LaporanTab[] = ["keuangan", "kehadiran", "statistik", "ulang-tahun"];

type SearchParams = Promise<{
  tab?: string;
  year?: string;
  month?: string;
  kategori?: string;
  rayon?: string;
}>;

// Kelompok usia untuk statistik jemaat.
function kelompokUsia(umur: number): string {
  if (umur <= 12) return "Anak (0-12)";
  if (umur <= 17) return "Remaja (13-17)";
  if (umur <= 30) return "Pemuda (18-30)";
  if (umur <= 50) return "Dewasa (31-50)";
  return "Lansia (51+)";
}

function hitungUmur(lahir: Date, ref: Date): number {
  let umur = ref.getFullYear() - lahir.getFullYear();
  const belumUlangTahun =
    ref.getMonth() < lahir.getMonth() ||
    (ref.getMonth() === lahir.getMonth() && ref.getDate() < lahir.getDate());
  if (belumUlangTahun) umur -= 1;
  return Math.max(0, umur);
}

// Label ringkas untuk sebuah ibadah (dipakai pada rincian kehadiran).
const ibadahDateFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
function ibadahLabel(i: {
  tgl: Date;
  nm_ibadah: string | null;
  unsur: { nm_unsur: string } | null;
  jemaat: { nm_lengkap: string } | null;
  tempat: string | null;
}): string {
  const nama =
    i.nm_ibadah ??
    i.unsur?.nm_unsur ??
    (i.jemaat ? `Kel. ${i.jemaat.nm_lengkap}` : i.tempat) ??
    "Ibadah";
  return `${ibadahDateFmt.format(i.tgl)} — ${nama}`;
}

async function buildKeuangan(year: number, kategori: string | null): Promise<KeuanganReport> {
  const rows = await prisma.keuangan.findMany({
    where: {
      created_at: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) },
      ...(kategori ? { kategori } : {}),
    },
    select: { kategori: true, jumlah: true, created_at: true },
  });

  const totalKategori = new Map<string, number>();
  const totalBulan = new Array(12).fill(0);
  let grandTotal = 0;

  for (const row of rows) {
    totalKategori.set(row.kategori, (totalKategori.get(row.kategori) ?? 0) + row.jumlah);
    totalBulan[row.created_at.getMonth()] += row.jumlah;
    grandTotal += row.jumlah;
  }

  const kategoriKeys = kategori ? [kategori] : (KATEGORI_KEUANGAN as readonly string[]);
  const perKategori = kategoriKeys
    .map((key) => {
      const total = totalKategori.get(key) ?? 0;
      return {
        key,
        label: LABEL_KATEGORI_KEUANGAN[key as keyof typeof LABEL_KATEGORI_KEUANGAN] ?? key,
        total,
        percent: grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0,
      };
    })
    .sort((a, b) => b.total - a.total);

  return {
    year,
    kategori,
    perKategori,
    perBulan: totalBulan.map((total, month) => ({ month, total })),
    grandTotal,
    count: rows.length,
  };
}

async function buildKehadiran(year: number, month: number | null): Promise<KehadiranReport> {
  const rows = await prisma.kehadiran.findMany({
    where: { ibadah: { tgl: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) } } },
    select: {
      laki_laki: true,
      perempuan: true,
      anak: true,
      total: true,
      ibadah: {
        select: {
          tgl: true,
          nm_ibadah: true,
          tempat: true,
          unsur: { select: { nm_unsur: true } },
          jemaat: { select: { nm_lengkap: true } },
        },
      },
    },
  });

  const bulan = Array.from({ length: 12 }, (_, m) => ({
    month: m,
    services: 0,
    total: 0,
    avg: 0,
    laki: 0,
    perempuan: 0,
    anak: 0,
  }));

  let totalHadir = 0;
  for (const row of rows) {
    const m = row.ibadah.tgl.getMonth();
    bulan[m].services += 1;
    bulan[m].total += row.total;
    bulan[m].laki += row.laki_laki;
    bulan[m].perempuan += row.perempuan;
    bulan[m].anak += row.anak;
    totalHadir += row.total;
  }
  for (const b of bulan) b.avg = b.services > 0 ? Math.round(b.total / b.services) : 0;

  // Rincian per-ibadah bila bulan tertentu dipilih.
  const detail =
    month != null
      ? rows
          .filter((r) => r.ibadah.tgl.getMonth() === month)
          .sort((a, b) => a.ibadah.tgl.getDate() - b.ibadah.tgl.getDate())
          .map((r) => ({
            ibadah: ibadahLabel(r.ibadah),
            laki: r.laki_laki,
            perempuan: r.perempuan,
            anak: r.anak,
            total: r.total,
          }))
      : null;

  const totalServices = rows.length;
  return {
    year,
    month,
    perBulan: bulan,
    detail,
    totalHadir,
    totalServices,
    avgPerService: totalServices > 0 ? Math.round(totalHadir / totalServices) : 0,
  };
}

async function buildStatistik(rayonId: string | null): Promise<StatistikReport> {
  const now = new Date();
  const [jemaat, totalKeluarga, totalRayon] = await Promise.all([
    prisma.jemaat.findMany({
      select: {
        status: true,
        jenkel: true,
        tgl_lahir: true,
        keluarga: { select: { id_rayon: true, rayon: { select: { nm_rayon: true } } } },
      },
    }),
    prisma.keluarga.count(),
    prisma.rayon.count(),
  ]);

  const perStatus = new Map<string, number>();
  const perGender = new Map<string, number>();
  const perRayon = new Map<string, number>();
  const perUsia = new Map<string, number>();
  let totalAktif = 0;

  for (const j of jemaat) {
    // Filter rayon (bila dipilih) hanya memengaruhi hitung selain status total.
    const cocokRayon = !rayonId || j.keluarga?.id_rayon === rayonId;

    if (cocokRayon) perStatus.set(j.status, (perStatus.get(j.status) ?? 0) + 1);
    if (j.status !== "AKTIF" || !cocokRayon) continue;

    totalAktif += 1;
    const gender = j.jenkel === "L" ? "Laki-laki" : j.jenkel === "P" ? "Perempuan" : "Lainnya";
    perGender.set(gender, (perGender.get(gender) ?? 0) + 1);

    const rayon = j.keluarga?.rayon?.nm_rayon ?? "Tanpa Rayon";
    perRayon.set(rayon, (perRayon.get(rayon) ?? 0) + 1);

    perUsia.set(kelompokUsia(hitungUmur(j.tgl_lahir, now)), (perUsia.get(kelompokUsia(hitungUmur(j.tgl_lahir, now))) ?? 0) + 1);
  }

  const toSorted = (map: Map<string, number>) =>
    [...map.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);

  const usiaOrder = ["Anak (0-12)", "Remaja (13-17)", "Pemuda (18-30)", "Dewasa (31-50)", "Lansia (51+)"];

  return {
    rayon: rayonId,
    totalAktif,
    totalKeluarga,
    totalRayon,
    perStatus: toSorted(perStatus),
    perGender: toSorted(perGender),
    perRayon: toSorted(perRayon),
    perUsia: usiaOrder
      .filter((label) => perUsia.has(label))
      .map((label) => ({ label, count: perUsia.get(label) ?? 0 })),
  };
}

async function buildUlangTahun(month: number, rayonId: string | null): Promise<UlangTahunReport> {
  const now = new Date();
  const jemaat = await prisma.jemaat.findMany({
    where: {
      status: "AKTIF",
      ...(rayonId ? { keluarga: { id_rayon: rayonId } } : {}),
    },
    select: {
      id: true,
      nm_lengkap: true,
      tgl_lahir: true,
      jenkel: true,
      keluarga: { select: { rayon: { select: { nm_rayon: true } } } },
    },
  });

  const items = jemaat
    .filter((j) => j.tgl_lahir.getMonth() === month)
    .map((j) => ({
      id: j.id,
      nama: j.nm_lengkap,
      tanggal: j.tgl_lahir.toISOString(),
      usia: now.getFullYear() - j.tgl_lahir.getFullYear(),
      rayon: j.keluarga?.rayon?.nm_rayon ?? null,
      jenkel: j.jenkel,
    }))
    .sort((a, b) => new Date(a.tanggal).getDate() - new Date(b.tanggal).getDate());

  return { month, rayon: rayonId, items };
}

export default async function LaporanPage({ searchParams }: { searchParams: SearchParams }) {
  await requireResourceView("laporan");

  const params = await searchParams;
  const now = new Date();

  const tab: LaporanTab = VALID_TABS.includes(params.tab as LaporanTab)
    ? (params.tab as LaporanTab)
    : "keuangan";
  const year = Number(params.year) || now.getFullYear();

  // Bulan: kosong = semua (keuangan/kehadiran). Ulang tahun default bulan berjalan.
  const monthNum = Number(params.month);
  const monthValid = params.month != null && params.month !== "" && monthNum >= 0 && monthNum <= 11;
  const monthFilter = monthValid ? monthNum : null;

  const kategori =
    params.kategori && (KATEGORI_KEUANGAN as readonly string[]).includes(params.kategori)
      ? params.kategori
      : null;
  const rayon = params.rayon || null;

  // Opsi filter rayon (untuk statistik & ulang tahun).
  const rayonList = await prisma.rayon.findMany({
    select: { id: true, nm_rayon: true },
    orderBy: { nm_rayon: "asc" },
  });
  const rayonOptions: FilterOption[] = rayonList.map((r) => ({ value: r.id, label: r.nm_rayon }));
  const kategoriOptions: FilterOption[] = KATEGORI_KEUANGAN.map((value) => ({
    value,
    label: LABEL_KATEGORI_KEUANGAN[value],
  }));

  const keuangan = tab === "keuangan" ? await buildKeuangan(year, kategori) : null;
  const kehadiran = tab === "kehadiran" ? await buildKehadiran(year, monthFilter) : null;
  const statistik = tab === "statistik" ? await buildStatistik(rayon) : null;
  const ulangTahun =
    tab === "ulang-tahun" ? await buildUlangTahun(monthValid ? monthNum : now.getMonth(), rayon) : null;

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <LaporanManager
        tab={tab}
        year={year}
        month={monthFilter}
        kategori={kategori}
        rayon={rayon}
        rayonOptions={rayonOptions}
        kategoriOptions={kategoriOptions}
        keuangan={keuangan}
        kehadiran={kehadiran}
        statistik={statistik}
        ulangTahun={ulangTahun}
      />
    </main>
  );
}
