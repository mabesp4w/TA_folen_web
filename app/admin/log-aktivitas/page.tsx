import type { Metadata } from "next";
import type { Prisma } from "@/lib/generated/prisma/client";
import { LogManager, type LogRow } from "@/components/admin/log-aktivitas";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Log Aktivitas" };

const PAGE_SIZE = 25;

// Daftar entitas yang bisa muncul di log (untuk opsi filter).
const ENTITAS = [
  "Rayon",
  "Unsur",
  "Jemaat",
  "Pendeta",
  "Majelis",
  "BadanPengurus",
  "Ibadah",
  "Kehadiran",
  "Keuangan",
  "Pengumuman",
  "Renungan",
  "GaleriAlbum",
  "GaleriFoto",
  "Slide",
  "User",
];

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

type SearchParams = Promise<{
  q?: string;
  entitas?: string;
  aksi?: string;
  from?: string;
  to?: string;
  page?: string;
}>;

function parseDate(value: string | undefined, endOfDay = false) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export default async function LogAktivitasPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const entitas = params.entitas?.trim() ?? "";
  const aksi = ["CREATE", "UPDATE", "DELETE"].includes(params.aksi ?? "") ? params.aksi! : "";
  const from = params.from ?? "";
  const to = params.to ?? "";
  const page = Math.max(1, Number(params.page) || 1);

  const createdAt: Prisma.DateTimeFilter = {};
  const fromDate = parseDate(from);
  const toDate = parseDate(to, true);
  if (fromDate) createdAt.gte = fromDate;
  if (toDate) createdAt.lte = toDate;

  const where: Prisma.LogAktivitasWhereInput = {
    ...(entitas ? { entitas } : {}),
    ...(aksi ? { aksi } : {}),
    ...(fromDate || toDate ? { created_at: createdAt } : {}),
    ...(q
      ? {
          OR: [
            { username: { contains: q } },
            { ringkasan: { contains: q } },
          ],
        }
      : {}),
  };

  const [total, logs] = await Promise.all([
    prisma.logAktivitas.count({ where }),
    prisma.logAktivitas.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const rows: LogRow[] = logs.map((log) => ({
    id: log.id,
    username: log.username,
    role: log.role,
    aksi: log.aksi,
    entitas: log.entitas,
    ringkasan: log.ringkasan,
    ip: log.ip,
    createdAt: dateFmt.format(log.created_at),
  }));

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <LogManager
        entitasOptions={ENTITAS}
        filters={{ q, entitas, aksi, from, to }}
        page={page}
        pageCount={pageCount}
        rows={rows}
        total={total}
      />
    </main>
  );
}
