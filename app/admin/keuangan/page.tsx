import type { Metadata } from "next";
import {
  KeuanganManager,
  type KeuanganRow,
} from "@/components/admin/keuangan";
import { requireResourceView } from "@/lib/permissions-server";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Keuangan" };

export default async function KeuanganPage() {
  const { permission } = await requireResourceView("keuangan");
  const [keuangan, ibadah] = await Promise.all([
    prisma.keuangan.findMany({
      include: { ibadah: true },
      orderBy: { created_at: "desc" },
    }),
    prisma.ibadah.findMany({
      select: {
        id: true,
        nm_ibadah: true,
        tgl: true,
      },
      orderBy: [{ tgl: "desc" }, { waktu: "asc" }],
    }),
  ]);

  const dateFormatter = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  });
  const rows: KeuanganRow[] = keuangan.map((row) => ({
    id: row.id,
    id_ibadah: row.id_ibadah,
    ibadah: row.ibadah?.nm_ibadah ?? null,
    tanggalIbadah: row.ibadah?.tgl.toISOString() ?? null,
    kategori: row.kategori,
    nm_pemberi: row.nm_pemberi,
    jumlah: row.jumlah,
    keterangan: row.keterangan,
    createdAt: row.created_at.toISOString(),
  }));

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <KeuanganManager
        ibadah={ibadah.map((item) => ({
          id: item.id,
          label: `${item.nm_ibadah ?? "Ibadah"} - ${dateFormatter.format(item.tgl)}`,
        }))}
        permission={permission}
        rows={rows}
      />
    </main>
  );
}
