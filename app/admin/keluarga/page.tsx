import type { Metadata } from "next";
import { KeluargaManager, type KeluargaRow } from "@/components/admin/keluarga";
import { requireResourceView } from "@/lib/permissions-server";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Data Keluarga" };

type SearchParams = Promise<{
  q?: string;
  rayon?: string;
}>;

export default async function KeluargaPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { permission } = await requireResourceView("keluarga");
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const rayon = params.rayon ?? "";

  const [rows, rayons] = await Promise.all([
    prisma.keluarga.findMany({
      where: {
        ...(query
          ? {
              OR: [
                { no_kk: { contains: query } },
                { alamat_blok: { contains: query } },
              ],
            }
          : {}),
        ...(rayon ? { id_rayon: rayon } : {}),
      },
      include: {
        rayon: { select: { nm_rayon: true } },
        _count: { select: { anggota: true } },
      },
      orderBy: [{ alamat_blok: "asc" }],
    }),
    prisma.rayon.findMany({
      select: { id: true, nm_rayon: true },
      orderBy: { nm_rayon: "asc" },
    }),
  ]);

  const keluarga: KeluargaRow[] = rows.map((row) => ({
    id: row.id,
    no_kk: row.no_kk,
    alamat_blok: row.alamat_blok,
    id_rayon: row.id_rayon,
    rayon: row.rayon,
    _count: row._count,
  }));

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <KeluargaManager
        keluarga={keluarga}
        permission={permission}
        query={query}
        rayon={rayon}
        rayons={rayons}
      />
    </main>
  );
}
