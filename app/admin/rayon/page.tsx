import type { Metadata } from "next";
import { MasterDataManager } from "@/components/admin/master-data";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Rayon" };

export default async function RayonPage() {
  const rows = await prisma.rayon.findMany({
    include: { _count: { select: { jemaat: true } } },
    orderBy: { nm_rayon: "asc" },
  });

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <MasterDataManager
        description="Kelola pembagian wilayah pelayanan yang digunakan pada data jemaat."
        emptyMessage="Belum ada rayon yang tercatat."
        items={rows.map((row) => ({ id: row.id, name: row.nm_rayon, usageCount: row._count.jemaat }))}
        resource="rayon"
        title="Rayon"
      />
    </main>
  );
}
