import type { Metadata } from "next";
import { PengumumanManager, type PengumumanRow } from "@/components/admin/pengumuman";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Pengumuman" };

export default async function PengumumanPage() {
  const pengumuman = await prisma.pengumuman.findMany({
    orderBy: [{ order: "asc" }, { tgl_publish: "desc" }],
  });
  const rows: PengumumanRow[] = pengumuman.map((row) => ({
    id: row.id,
    judul: row.judul,
    isi: row.isi,
    diterbitkan: row.status,
    updatedAt: new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(
      row.tgl_publish,
    ),
  }));

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <PengumumanManager rows={rows} tinyApiKey={process.env.API_TINY ?? ""} />
    </main>
  );
}
