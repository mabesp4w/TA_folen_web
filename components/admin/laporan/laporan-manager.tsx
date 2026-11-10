"use client";

import { useCallback, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CakeSlice,
  CalendarCheck2,
  FileBarChart,
  FileSpreadsheet,
  FileText,
  Printer,
  Users,
  Wallet,
} from "lucide-react";
import { gooeyToast } from "goey-toast";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { exportExcel, exportPdf, type ExportBlock, type ExportModel } from "./export";

export type LaporanTab = "keuangan" | "kehadiran" | "statistik" | "ulang-tahun";

export type FilterOption = { value: string; label: string };

export type KeuanganReport = {
  year: number;
  kategori: string | null;
  perKategori: { key: string; label: string; total: number; percent: number }[];
  perBulan: { month: number; total: number }[];
  grandTotal: number;
  count: number;
};

export type KehadiranReport = {
  year: number;
  month: number | null;
  perBulan: {
    month: number;
    services: number;
    total: number;
    avg: number;
    laki: number;
    perempuan: number;
    anak: number;
  }[];
  detail: { ibadah: string; laki: number; perempuan: number; anak: number; total: number }[] | null;
  totalHadir: number;
  totalServices: number;
  avgPerService: number;
};

export type StatistikReport = {
  rayon: string | null;
  totalAktif: number;
  totalKeluarga: number;
  totalRayon: number;
  perStatus: { label: string; count: number }[];
  perGender: { label: string; count: number }[];
  perRayon: { label: string; count: number }[];
  perUsia: { label: string; count: number }[];
};

export type UlangTahunReport = {
  month: number;
  rayon: string | null;
  items: {
    id: string;
    nama: string;
    tanggal: string;
    usia: number;
    rayon: string | null;
    jenkel: string;
  }[];
};

const BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const TABS: { key: LaporanTab; label: string; icon: typeof Wallet }[] = [
  { key: "keuangan", label: "Keuangan", icon: Wallet },
  { key: "kehadiran", label: "Kehadiran", icon: CalendarCheck2 },
  { key: "statistik", label: "Statistik Jemaat", icon: Users },
  { key: "ulang-tahun", label: "Ulang Tahun", icon: CakeSlice },
];

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const tanggalFmt = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long" });

const monthOptions: FilterOption[] = BULAN.map((label, index) => ({ value: String(index), label }));

type LaporanManagerProps = {
  tab: LaporanTab;
  year: number;
  month: number | null;
  kategori: string | null;
  rayon: string | null;
  rayonOptions: FilterOption[];
  kategoriOptions: FilterOption[];
  keuangan: KeuanganReport | null;
  kehadiran: KehadiranReport | null;
  statistik: StatistikReport | null;
  ulangTahun: UlangTahunReport | null;
};

export function LaporanManager({
  tab,
  year,
  month,
  kategori,
  rayon,
  rayonOptions,
  kategoriOptions,
  keuangan,
  kehadiran,
  statistik,
  ulangTahun,
}: LaporanManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);

  const activeTab = TABS.find((t) => t.key === tab) ?? TABS[0];

  // Ubah searchParams; nilai kosong menghapus param bersangkutan.
  const navigate = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === "") params.delete(key);
        else params.set(key, value);
      }
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const years = Array.from({ length: 6 }, (_, i) => year + 2 - i).filter((y) => y >= 2020);
  if (!years.includes(year)) years.push(year);
  years.sort((a, b) => b - a);
  const yearOptions: FilterOption[] = years.map((y) => ({ value: String(y), label: String(y) }));

  const rayonLabel = rayon ? rayonOptions.find((o) => o.value === rayon)?.label ?? null : null;

  function buildExportModel(): ExportModel | null {
    const subtitle = "GKI Syaloom Pasifik Indah";

    if (tab === "keuangan" && keuangan && keuangan.count > 0) {
      const suffix = keuangan.kategori
        ? ` (${kategoriOptions.find((o) => o.value === keuangan.kategori)?.label ?? keuangan.kategori})`
        : "";
      const kategoriBlock: ExportBlock = {
        title: "Per Kategori",
        head: ["Kategori", "Jumlah (Rp)", "%"],
        rows: [
          ...keuangan.perKategori.map((k) => [k.label, k.total, k.percent] as (string | number)[]),
          ["Total", keuangan.grandTotal, 100],
        ],
      };
      const bulanBlock: ExportBlock = {
        title: "Per Bulan",
        head: ["Bulan", "Jumlah (Rp)"],
        rows: keuangan.perBulan.map((b) => [BULAN[b.month], b.total]),
      };
      return {
        fileBase: `laporan-keuangan-${keuangan.year}`,
        docTitle: `Laporan Keuangan — ${keuangan.year}${suffix}`,
        subtitle,
        blocks: [kategoriBlock, bulanBlock],
      };
    }

    if (tab === "kehadiran" && kehadiran && kehadiran.totalServices > 0) {
      const blocks: ExportBlock[] = [
        {
          title: "Rekap Kehadiran per Bulan",
          head: ["Bulan", "Ibadah", "Total Hadir", "Rata-rata", "L", "P", "Anak"],
          rows: kehadiran.perBulan.map((b) => [BULAN[b.month], b.services, b.total, b.avg, b.laki, b.perempuan, b.anak]),
        },
      ];
      if (kehadiran.detail && kehadiran.detail.length > 0) {
        blocks.push({
          title: `Rincian ${BULAN[kehadiran.month ?? 0]}`,
          head: ["Ibadah", "L", "P", "Anak", "Total"],
          rows: kehadiran.detail.map((d) => [d.ibadah, d.laki, d.perempuan, d.anak, d.total]),
        });
      }
      return {
        fileBase: `laporan-kehadiran-${kehadiran.year}`,
        docTitle: `Laporan Kehadiran — ${kehadiran.year}`,
        subtitle,
        blocks,
      };
    }

    if (tab === "statistik" && statistik) {
      const dist = (title: string, rows: { label: string; count: number }[], total: number): ExportBlock => ({
        title,
        head: ["Kategori", "Jumlah", "%"],
        rows: rows.map((r) => [r.label, r.count, total > 0 ? Math.round((r.count / total) * 100) : 0]),
      });
      const statusTotal = statistik.perStatus.reduce((s, r) => s + r.count, 0);
      return {
        fileBase: "statistik-jemaat",
        docTitle: `Statistik Jemaat${rayonLabel ? ` — Rayon ${rayonLabel}` : ""}`,
        subtitle,
        blocks: [
          dist("Menurut Jenis Kelamin", statistik.perGender, statistik.totalAktif),
          dist("Menurut Kelompok Usia", statistik.perUsia, statistik.totalAktif),
          dist("Menurut Rayon", statistik.perRayon, statistik.totalAktif),
          dist("Menurut Status", statistik.perStatus, statusTotal),
        ],
      };
    }

    if (tab === "ulang-tahun" && ulangTahun && ulangTahun.items.length > 0) {
      return {
        fileBase: `ulang-tahun-${BULAN[ulangTahun.month].toLowerCase()}`,
        docTitle: `Ulang Tahun — ${BULAN[ulangTahun.month]}${rayonLabel ? ` (Rayon ${rayonLabel})` : ""}`,
        subtitle,
        blocks: [
          {
            title: `Ulang Tahun ${BULAN[ulangTahun.month]}`,
            head: ["Tanggal", "Nama", "Jenis Kelamin", "Usia ke-", "Rayon"],
            rows: ulangTahun.items.map((j) => [
              tanggalFmt.format(new Date(j.tanggal)),
              j.nama,
              j.jenkel === "L" ? "Laki-laki" : j.jenkel === "P" ? "Perempuan" : "-",
              j.usia,
              j.rayon ?? "-",
            ]),
          },
        ],
      };
    }

    return null;
  }

  async function handleExport(format: "excel" | "pdf") {
    const model = buildExportModel();
    if (!model) {
      gooeyToast.error("Tidak ada data untuk diekspor.");
      return;
    }
    setExporting(format);
    try {
      if (format === "excel") await exportExcel(model);
      else await exportPdf(model);
    } catch (error) {
      console.error("Export laporan gagal", error);
      gooeyToast.error("Gagal membuat berkas. Silakan coba lagi.");
    } finally {
      setExporting(null);
    }
  }

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Administrasi
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-3xl font-bold text-[var(--ink)]">
            <FileBarChart size={28} className="text-[var(--forest)]" aria-hidden="true" />
            Laporan
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Rekap keuangan, kehadiran, statistik jemaat, dan daftar ulang tahun.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleExport("excel")}
            disabled={exporting !== null}
            loading={exporting === "excel"}
          >
            <FileSpreadsheet size={17} aria-hidden="true" />
            Excel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleExport("pdf")}
            disabled={exporting !== null}
            loading={exporting === "pdf"}
          >
            <FileText size={17} aria-hidden="true" />
            PDF
          </Button>
          <Button type="button" variant="outline" onClick={() => window.print()}>
            <Printer size={17} aria-hidden="true" />
            Cetak
          </Button>
        </div>
      </header>

      {/* Tab laporan */}
      <div role="tablist" aria-label="Jenis laporan" className="mb-5 flex flex-wrap gap-2 print:hidden">
        {TABS.map((t) => {
          const selected = t.key === tab;
          const Icon = t.icon;
          return (
            <Button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={selected}
              size="sm"
              variant={selected ? "primary" : "outline"}
              onClick={() => navigate({ tab: t.key })}
            >
              <Icon size={16} aria-hidden="true" />
              {t.label}
            </Button>
          );
        })}
      </div>

      {/* Filter per tab (memakai komponen Select bersama) */}
      <div className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-4 print:hidden">
        {(tab === "keuangan" || tab === "kehadiran") && (
          <div className="w-40">
            <Select
              label="Tahun"
              name="year"
              variant="native"
              value={String(year)}
              options={yearOptions}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => navigate({ year: e.currentTarget.value })}
            />
          </div>
        )}

        {tab === "keuangan" && (
          <div className="w-56">
            <Select
              label="Kategori"
              name="kategori"
              variant="native"
              value={kategori ?? ""}
              options={[{ value: "", label: "Semua kategori" }, ...kategoriOptions]}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => navigate({ kategori: e.currentTarget.value })}
            />
          </div>
        )}

        {tab === "kehadiran" && (
          <div className="w-48">
            <Select
              label="Bulan"
              name="month"
              variant="native"
              value={month != null ? String(month) : ""}
              options={[{ value: "", label: "Semua bulan" }, ...monthOptions]}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => navigate({ month: e.currentTarget.value })}
            />
          </div>
        )}

        {tab === "ulang-tahun" && (
          <div className="w-48">
            <Select
              label="Bulan"
              name="month"
              variant="native"
              value={String(ulangTahun?.month ?? new Date().getMonth())}
              options={monthOptions}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => navigate({ month: e.currentTarget.value })}
            />
          </div>
        )}

        {(tab === "statistik" || tab === "ulang-tahun") && (
          <div className="w-56">
            <Select
              label="Rayon"
              name="rayon"
              variant="native"
              value={rayon ?? ""}
              options={[{ value: "", label: "Semua rayon" }, ...rayonOptions]}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => navigate({ rayon: e.currentTarget.value })}
            />
          </div>
        )}
      </div>

      {/* Judul cetak */}
      <div className="mb-4 hidden items-center gap-3 print:flex">
        <Image
          src="/logo-gki.png"
          alt=""
          width={44}
          height={44}
          className="shrink-0"
          unoptimized
        />
        <div>
          <h2 className="text-lg font-bold">
            Laporan {activeTab.label}
            {(tab === "keuangan" || tab === "kehadiran") ? ` — ${year}` : ""}
            {tab === "ulang-tahun" ? ` — ${BULAN[ulangTahun?.month ?? 0]}` : ""}
            {rayonLabel ? ` · Rayon ${rayonLabel}` : ""}
          </h2>
          <p className="text-sm text-[var(--muted)]">GKI Syaloom Pasifik Indah</p>
        </div>
      </div>

      {tab === "keuangan" && keuangan && <KeuanganSection data={keuangan} />}
      {tab === "kehadiran" && kehadiran && <KehadiranSection data={kehadiran} />}
      {tab === "statistik" && statistik && <StatistikSection data={statistik} />}
      {tab === "ulang-tahun" && ulangTahun && <UlangTahunSection data={ulangTahun} />}
    </>
  );
}

// --- Komponen ringkasan ---
function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--paper)] p-4">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[var(--ink)]">{value}</p>
      {hint && <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p>}
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--paper)] p-10 text-center text-[var(--muted)]">
      {children}
    </div>
  );
}

function TableCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--paper)]">
      <div className="border-b border-[var(--line)] px-4 py-3">
        <h3 className="font-semibold text-[var(--ink)]">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// --- Keuangan ---
function KeuanganSection({ data }: { data: KeuanganReport }) {
  if (data.count === 0) {
    return <EmptyState>Belum ada penerimaan keuangan yang cocok dengan filter pada tahun {data.year}.</EmptyState>;
  }
  const tertinggi = data.perKategori[0];
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label={`Total penerimaan ${data.year}`} value={rupiah.format(data.grandTotal)} />
        <StatTile label="Jumlah transaksi" value={`${data.count}`} />
        <StatTile
          label="Kategori tertinggi"
          value={tertinggi?.label ?? "-"}
          hint={tertinggi ? `${rupiah.format(tertinggi.total)} · ${tertinggi.percent}%` : undefined}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <TableCard title="Per Kategori">
          <table className="table">
            <thead>
              <tr>
                <th>Kategori</th>
                <th className="text-right">Jumlah</th>
                <th className="text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {data.perKategori.map((k) => (
                <tr key={k.key}>
                  <td className="font-medium">{k.label}</td>
                  <td className="text-right">{rupiah.format(k.total)}</td>
                  <td className="text-right text-[var(--muted)]">{k.percent}%</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <td>Total</td>
                <td className="text-right">{rupiah.format(data.grandTotal)}</td>
                <td className="text-right">100%</td>
              </tr>
            </tfoot>
          </table>
        </TableCard>

        <TableCard title="Per Bulan">
          <table className="table">
            <thead>
              <tr>
                <th>Bulan</th>
                <th className="text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {data.perBulan.map((b) => (
                <tr key={b.month}>
                  <td>{BULAN[b.month]}</td>
                  <td className="text-right">{rupiah.format(b.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      </div>
    </div>
  );
}

// --- Kehadiran ---
function KehadiranSection({ data }: { data: KehadiranReport }) {
  if (data.totalServices === 0) {
    return <EmptyState>Belum ada data kehadiran ibadah pada tahun {data.year}.</EmptyState>;
  }
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label={`Total kehadiran ${data.year}`} value={data.totalHadir.toLocaleString("id-ID")} hint="akumulasi jiwa hadir" />
        <StatTile label="Ibadah tercatat" value={`${data.totalServices}`} />
        <StatTile label="Rata-rata / ibadah" value={`${data.avgPerService}`} hint="jiwa" />
      </div>

      <TableCard title="Rekap Kehadiran per Bulan">
        <table className="table">
          <thead>
            <tr>
              <th>Bulan</th>
              <th className="text-right">Ibadah</th>
              <th className="text-right">Total Hadir</th>
              <th className="text-right">Rata-rata</th>
              <th className="text-right">L</th>
              <th className="text-right">P</th>
              <th className="text-right">Anak</th>
            </tr>
          </thead>
          <tbody>
            {data.perBulan.map((b) => (
              <tr
                key={b.month}
                className={
                  b.services === 0
                    ? "text-[var(--muted)]"
                    : data.month === b.month
                      ? "bg-[var(--cream)] font-medium"
                      : undefined
                }
              >
                <td>{BULAN[b.month]}</td>
                <td className="text-right">{b.services}</td>
                <td className="text-right">{b.total.toLocaleString("id-ID")}</td>
                <td className="text-right">{b.avg}</td>
                <td className="text-right">{b.laki}</td>
                <td className="text-right">{b.perempuan}</td>
                <td className="text-right">{b.anak}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>

      {data.detail && (
        <TableCard title={`Rincian Ibadah — ${BULAN[data.month ?? 0]}`}>
          {data.detail.length === 0 ? (
            <p className="p-6 text-center text-sm text-[var(--muted)]">
              Tidak ada ibadah tercatat pada bulan ini.
            </p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Ibadah</th>
                  <th className="text-right">L</th>
                  <th className="text-right">P</th>
                  <th className="text-right">Anak</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.detail.map((d, i) => (
                  <tr key={i}>
                    <td className="font-medium">{d.ibadah}</td>
                    <td className="text-right">{d.laki}</td>
                    <td className="text-right">{d.perempuan}</td>
                    <td className="text-right">{d.anak}</td>
                    <td className="text-right font-bold">{d.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </TableCard>
      )}
    </div>
  );
}

// --- Statistik Jemaat ---
function DistribusiCard({
  title,
  rows,
  total,
}: {
  title: string;
  rows: { label: string; count: number }[];
  total: number;
}) {
  return (
    <TableCard title={title}>
      {rows.length === 0 ? (
        <p className="p-6 text-center text-sm text-[var(--muted)]">Tidak ada data.</p>
      ) : (
        <table className="table">
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <td className="font-medium">{r.label}</td>
                <td className="text-right">{r.count}</td>
                <td className="w-16 text-right text-[var(--muted)]">
                  {total > 0 ? Math.round((r.count / total) * 100) : 0}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </TableCard>
  );
}

function StatistikSection({ data }: { data: StatistikReport }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Jemaat aktif" value={data.totalAktif.toLocaleString("id-ID")} hint={data.rayon ? "pada rayon terpilih" : undefined} />
        <StatTile label="Keluarga" value={data.totalKeluarga.toLocaleString("id-ID")} />
        <StatTile label="Rayon" value={`${data.totalRayon}`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <DistribusiCard title="Menurut Jenis Kelamin" rows={data.perGender} total={data.totalAktif} />
        <DistribusiCard title="Menurut Kelompok Usia" rows={data.perUsia} total={data.totalAktif} />
        <DistribusiCard title="Menurut Rayon" rows={data.perRayon} total={data.totalAktif} />
        <DistribusiCard
          title="Menurut Status Keanggotaan"
          rows={data.perStatus}
          total={data.perStatus.reduce((s, r) => s + r.count, 0)}
        />
      </div>
    </div>
  );
}

// --- Ulang Tahun ---
function UlangTahunSection({ data }: { data: UlangTahunReport }) {
  if (data.items.length === 0) {
    return <EmptyState>Tidak ada jemaat yang berulang tahun pada bulan {BULAN[data.month]}.</EmptyState>;
  }
  return (
    <TableCard title={`Ulang Tahun Bulan ${BULAN[data.month]} (${data.items.length} jemaat)`}>
      <table className="table">
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Nama</th>
            <th className="text-right">Usia ke-</th>
            <th>Rayon</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((j) => (
            <tr key={j.id}>
              <td className="whitespace-nowrap">{tanggalFmt.format(new Date(j.tanggal))}</td>
              <td className="font-medium">
                {j.nama}
                <span className="ml-1 text-xs text-[var(--muted)]">
                  ({j.jenkel === "L" ? "L" : j.jenkel === "P" ? "P" : "-"})
                </span>
              </td>
              <td className="text-right">{j.usia}</td>
              <td>{j.rayon ?? <span className="text-[var(--muted)]">—</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableCard>
  );
}
