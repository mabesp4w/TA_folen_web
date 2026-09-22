import type { Metadata } from "next";
import { UnsurManager, type UnsurRow } from "@/components/admin/unsur";
import { requireResourceView } from "@/lib/permissions-server";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Data Unsur" };

type SearchParams = Promise<{
  q?: string;
}>;

export default async function UnsurPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { permission } = await requireResourceView("unsur");
  const params = await searchParams;
  const query = params.q?.trim() ?? "";

  const rows = await prisma.unsur.findMany({
    where: {
      ...(query ? { nm_unsur: { contains: query } } : {}),
    },
    include: { _count: { select: { ibadah: true, badan_pengurus: true } } },
    orderBy: { nm_unsur: "asc" },
  });

  const unsurs: UnsurRow[] = rows.map((row) => ({
    id: row.id,
    nm_unsur: row.nm_unsur,
    _count: row._count,
  }));

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <UnsurManager
        unsurs={unsurs}
        query={query}
        permission={permission}
      />
    </main>
  );
}
