import type { Metadata } from "next";
import { RayonManager, type RayonRow } from "@/components/admin/rayon";
import { requireResourceView } from "@/lib/permissions-server";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Data Rayon" };

type SearchParams = Promise<{
  q?: string;
}>;

export default async function RayonPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { permission } = await requireResourceView("rayon");
  const params = await searchParams;
  const query = params.q?.trim() ?? "";

  const rows = await prisma.rayon.findMany({
    where: {
      ...(query ? { nm_rayon: { contains: query } } : {}),
    },
    include: {
      _count: { select: { keluarga: true } },
      keluarga: { select: { _count: { select: { anggota: true } } } },
    },
    orderBy: { nm_rayon: "asc" },
  });

  const rayons: RayonRow[] = rows.map((row) => ({
    id: row.id,
    nm_rayon: row.nm_rayon,
    _count: {
      keluarga: row._count.keluarga,
      jemaat: row.keluarga.reduce((sum, k) => sum + k._count.anggota, 0),
    },
  }));

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <RayonManager
        rayons={rayons}
        query={query}
        permission={permission}
      />
    </main>
  );
}
