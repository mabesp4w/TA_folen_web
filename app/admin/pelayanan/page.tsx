import type { Metadata } from "next";
import {
  PelayananManager,
  type PelayananRow,
} from "@/components/admin/pelayanan/pelayanan-manager";
import { PELAYANAN_TYPES } from "@/components/admin/pelayanan/schema";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Pelayan & Pengurus" };

type SearchParams = Promise<{
  q?: string;
  status?: string;
  type?: string;
}>;

export default async function PelayananPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const query = params.q?.trim().toLowerCase() ?? "";
  const type = PELAYANAN_TYPES.includes(
    params.type as (typeof PELAYANAN_TYPES)[number],
  )
    ? params.type!
    : "";
  const status = ["aktif", "nonaktif"].includes(params.status ?? "")
    ? params.status!
    : "";
  const aktif = status ? status === "aktif" : undefined;

  const [pendeta, majelis, pengurus, jemaat, unsur] = await Promise.all([
    type && type !== "PENDETA"
      ? Promise.resolve([])
      : prisma.pendeta.findMany({
          where: aktif === undefined ? undefined : { aktif },
          include: {
            jemaat: { include: { rayon: { select: { nm_rayon: true } } } },
          },
        }),
    type && type !== "MAJELIS"
      ? Promise.resolve([])
      : prisma.majelis.findMany({
          where: aktif === undefined ? undefined : { aktif },
          include: {
            jemaat: { include: { rayon: { select: { nm_rayon: true } } } },
          },
        }),
    type && type !== "PENGURUS"
      ? Promise.resolve([])
      : prisma.badanPengurus.findMany({
          where: aktif === undefined ? undefined : { aktif },
          include: {
            jemaat: { include: { rayon: { select: { nm_rayon: true } } } },
            unsur: { select: { nm_unsur: true } },
          },
        }),
    prisma.jemaat.findMany({
      select: { id: true, nm_lengkap: true },
      orderBy: { nm_lengkap: "asc" },
    }),
    prisma.unsur.findMany({
      select: { id: true, nm_unsur: true },
      orderBy: { nm_unsur: "asc" },
    }),
  ]);

  const rows: PelayananRow[] = [
    ...pendeta.map((row) => ({
      id: row.id,
      type: "PENDETA" as const,
      id_jemaat: row.id_jemaat,
      name: row.jemaat.nm_lengkap,
      rayon: row.jemaat.rayon?.nm_rayon ?? null,
      gelar: row.gelar,
      jabatan: null,
      id_unsur: null,
      unsur: null,
      sektor: null,
      tgl_mulai: row.tgl_mulai.toISOString(),
      tgl_selesai: row.tgl_selesai?.toISOString() ?? null,
      aktif: row.aktif,
    })),
    ...majelis.map((row) => ({
      id: row.id,
      type: "MAJELIS" as const,
      id_jemaat: row.id_jemaat,
      name: row.jemaat.nm_lengkap,
      rayon: row.jemaat.rayon?.nm_rayon ?? null,
      gelar: null,
      jabatan: row.jabatan,
      id_unsur: null,
      unsur: null,
      sektor: null,
      tgl_mulai: row.tgl_mulai.toISOString(),
      tgl_selesai: row.tgl_selesai?.toISOString() ?? null,
      aktif: row.aktif,
    })),
    ...pengurus.map((row) => ({
      id: row.id,
      type: "PENGURUS" as const,
      id_jemaat: row.id_jemaat,
      name: row.jemaat.nm_lengkap,
      rayon: row.jemaat.rayon?.nm_rayon ?? null,
      gelar: null,
      jabatan: row.jabatan,
      id_unsur: row.id_unsur,
      unsur: row.unsur.nm_unsur,
      sektor: row.sektor,
      tgl_mulai: row.tgl_mulai.toISOString(),
      tgl_selesai: row.tgl_selesai?.toISOString() ?? null,
      aktif: row.aktif,
    })),
  ]
    .filter((row) => {
      if (!query) return true;
      return [row.name, row.rayon, row.gelar, row.jabatan, row.unsur]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query));
    })
    .sort((a, b) => a.name.localeCompare(b.name, "id"));

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <PelayananManager
        jemaat={jemaat.map((item) => ({ id: item.id, name: item.nm_lengkap }))}
        query={params.q?.trim() ?? ""}
        rows={rows}
        status={status}
        type={type}
        unsur={unsur.map((item) => ({ id: item.id, name: item.nm_unsur }))}
      />
    </main>
  );
}
