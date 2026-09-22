import type { Metadata } from "next";
import { RenunganManager, type RenunganRow } from "@/components/admin/renungan";
import { requireResourceView } from "@/lib/permissions-server";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Renungan" };

export default async function RenunganPage() {
  const { permission } = await requireResourceView("renungan");
  const renungan = await prisma.renungan.findMany({
    orderBy: { tgl_publish: "desc" },
  });
  const rows: RenunganRow[] = renungan.map((row) => ({
    id: row.id,
    judul: row.judul,
    bacaan: row.bacaan,
    kutipan: row.kutipan,
    isi: row.isi,
    sumber: row.sumber,
    tanggal: row.tgl_publish.toISOString().slice(0, 10),
    tanggalLabel: new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(
      row.tgl_publish,
    ),
  }));

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <RenunganManager
        rows={rows}
        tinyApiKey={process.env.API_TINY ?? ""}
        permission={permission}
      />
    </main>
  );
}
