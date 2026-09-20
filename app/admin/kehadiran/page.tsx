import type { Metadata } from "next";
import {
  KehadiranManager,
  type IbadahOption,
  type KehadiranRow,
} from "@/components/admin/kehadiran";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Kehadiran Jemaat" };

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function ibadahLabel(ibadah: {
  tgl: Date;
  waktu: Date;
  nm_ibadah: string | null;
  jemaat: { nm_lengkap: string } | null;
  unsur: { nm_unsur: string } | null;
  tempat: string | null;
}) {
  const tgl = dateFmt.format(ibadah.tgl);
  const waktu = ibadah.waktu.toISOString().slice(11, 16);
  const nama =
    ibadah.nm_ibadah ??
    ibadah.unsur?.nm_unsur ??
    (ibadah.jemaat ? `Kel. ${ibadah.jemaat.nm_lengkap}` : ibadah.tempat) ??
    "Ibadah";
  return `${tgl} ${waktu} — ${nama}`;
}

export default async function KehadiranPage() {
  const [kehadiran, ibadah] = await Promise.all([
    prisma.kehadiran.findMany({
      include: {
        ibadah: {
          include: { jemaat: true, unsur: true },
        },
      },
      orderBy: { ibadah: { tgl: "desc" } },
    }),
    prisma.ibadah.findMany({
      include: { jemaat: true, unsur: true },
      orderBy: [{ tgl: "desc" }, { waktu: "asc" }],
    }),
  ]);

  const rows: KehadiranRow[] = kehadiran.map((row) => ({
    id: row.id,
    id_ibadah: row.id_ibadah,
    ibadah: ibadahLabel(row.ibadah),
    laki_laki: row.laki_laki,
    perempuan: row.perempuan,
    anak: row.anak,
    total: row.total,
  }));

  const ibadahOptions: IbadahOption[] = ibadah.map((row) => ({
    id: row.id,
    label: ibadahLabel(row),
  }));

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <KehadiranManager ibadahOptions={ibadahOptions} rows={rows} />
    </main>
  );
}
