import type { Metadata } from "next";
import { AgendaManager, type AgendaRow } from "@/components/admin/agenda/agenda-manager";
import { requireResourceView } from "@/lib/permissions-server";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Agenda & Ibadah" };

export default async function AgendaPage() {
  const { permission } = await requireResourceView("agenda");
  const [ibadah, jemaat, unsur] = await Promise.all([
    prisma.ibadah.findMany({
      include: { jemaat: true, pelayan: true, unsur: true },
      orderBy: [{ tgl: "desc" }, { waktu: "asc" }],
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

  const rows: AgendaRow[] = ibadah.map((row) => ({
    id: row.id,
    id_jemaat: row.id_jemaat,
    jemaat: row.jemaat?.nm_lengkap ?? null,
    id_unsur: row.id_unsur,
    unsur: row.unsur?.nm_unsur ?? null,
    id_pelayan_firman: row.id_pelayan_firman,
    pelayan: row.pelayan?.nm_lengkap ?? null,
    nm_ibadah: row.nm_ibadah,
    gabungan: row.gabungan,
    sektor: row.sektor,
    tgl: row.tgl.toISOString().slice(0, 10),
    waktu: row.waktu.toISOString().slice(11, 16),
    tempat: row.tempat,
    alamat_tempat: row.alamat_tempat,
    catatan: row.catatan,
    pelayan_firman: row.pelayan_firman,
    liturgos: row.liturgos,
    pembacaan_alkitab: row.pembacaan_alkitab,
    piket: row.piket,
    p_organ: row.p_organ,
  }));

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <AgendaManager
        jemaat={jemaat.map((item) => ({ id: item.id, name: item.nm_lengkap }))}
        rows={rows}
        unsur={unsur.map((item) => ({ id: item.id, name: item.nm_unsur }))}
        permission={permission}
      />
    </main>
  );
}
