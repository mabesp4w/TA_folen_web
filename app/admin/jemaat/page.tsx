import type { Metadata } from "next";
import { JemaatManager, type JemaatRow } from "@/components/admin/jemaat";
import { JEMAAT_STATUSES } from "@/components/admin/jemaat/schema";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Data Jemaat" };

type SearchParams = Promise<{
  q?: string;
  rayon?: string;
  status?: string;
}>;

export default async function JemaatPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const rayon = params.rayon ?? "";
  const status = JEMAAT_STATUSES.includes(
    params.status as (typeof JEMAAT_STATUSES)[number],
  )
    ? params.status!
    : "";

  const [rows, rayons, keluargaList] = await Promise.all([
    prisma.jemaat.findMany({
      where: {
        ...(query
          ? {
              OR: [
                { nm_lengkap: { contains: query } },
                { keluarga: { alamat_blok: { contains: query } } },
                { keluarga: { no_kk: { contains: query } } },
              ],
            }
          : {}),
        ...(rayon ? { keluarga: { id_rayon: rayon } } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        keluarga: {
          select: {
            no_kk: true,
            alamat_blok: true,
            rayon: { select: { nm_rayon: true } },
          },
        },
      },
      orderBy: { nm_lengkap: "asc" },
    }),
    prisma.rayon.findMany({
      select: { id: true, nm_rayon: true },
      orderBy: { nm_rayon: "asc" },
    }),
    prisma.keluarga.findMany({
      select: {
        id: true,
        no_kk: true,
        alamat_blok: true,
        rayon: { select: { nm_rayon: true } },
      },
      orderBy: { alamat_blok: "asc" },
    }),
  ]);

  const jemaat: JemaatRow[] = rows.map((row) => ({
    id: row.id,
    nm_lengkap: row.nm_lengkap,
    tgl_lahir: row.tgl_lahir.toISOString(),
    jenkel: row.jenkel,
    stat_keluarga: row.stat_keluarga,
    status: row.status,
    id_keluarga: row.id_keluarga,
    keluarga: row.keluarga,
  }));

  const keluargaOptions = keluargaList.map((k) => ({
    value: k.id,
    label: [k.no_kk, k.alamat_blok, k.rayon?.nm_rayon]
      .filter(Boolean)
      .join(" · "),
  }));

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <JemaatManager
        jemaat={jemaat}
        keluargaOptions={keluargaOptions}
        query={query}
        rayon={rayon}
        rayons={rayons}
        status={status}
      />
    </main>
  );
}
