import type { Metadata } from "next";
import { MasterDataManager } from "@/components/admin/master-data";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Unsur" };

export default async function UnsurPage() {
  const rows = await prisma.unsur.findMany({
    include: { _count: { select: { ibadah: true, badan_pengurus: true } } },
    orderBy: { nm_unsur: "asc" },
  });

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <MasterDataManager
        description="Kelola unsur kategorial yang digunakan pada ibadah dan kepengurusan."
        emptyMessage="Belum ada unsur kategorial yang tercatat."
        items={rows.map((row) => ({
          id: row.id,
          name: row.nm_unsur,
          usageCount: row._count.ibadah + row._count.badan_pengurus,
        }))}
        resource="unsur"
        title="Unsur"
      />
    </main>
  );
}
