import {
  DashboardHeader,
  OverviewStats,
  RecentActivities,
  UpcomingAgenda,
} from "@/components/admin/dashboard";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    totalJemaat,
    jemaatBulanIni,
    totalKeluarga,
    totalRayon,
    agendaBulanIni,
    kehadiranStats,
    kehadiranBulanLalu,
    jadwalMendatang,
    logTerbaru,
  ] = await Promise.all([
    prisma.jemaat.count({ where: { status: "AKTIF" } }),
    prisma.jemaat.count({
      where: { status: "AKTIF", created_at: { gte: firstOfMonth } },
    }),
    prisma.keluarga.count(),
    prisma.rayon.count(),
    prisma.ibadah.count({
      where: {
        tgl: {
          gte: firstOfMonth,
          lt: new Date(today.getFullYear(), today.getMonth() + 1, 1),
        },
      },
    }),
    prisma.kehadiran.aggregate({
      _avg: { total: true },
      _sum: { total: true },
      _count: true,
      where: {
        ibadah: {
          tgl: {
            gte: firstOfMonth,
            lt: new Date(today.getFullYear(), today.getMonth() + 1, 1),
          },
        },
      },
    }),
    prisma.kehadiran.aggregate({
      _avg: { total: true },
      where: {
        ibadah: {
          tgl: {
            gte: new Date(today.getFullYear(), today.getMonth() - 1, 1),
            lt: firstOfMonth,
          },
        },
      },
    }),
    prisma.ibadah.findMany({
      where: { tgl: { gte: today } },
      orderBy: [{ tgl: "asc" }, { waktu: "asc" }],
      take: 5,
      include: {
        jemaat: {
          select: {
            nm_lengkap: true,
            keluarga: { select: { rayon: { select: { nm_rayon: true } } } },
          },
        },
        unsur: { select: { nm_unsur: true } },
      },
    }),
    prisma.logAktivitas.findMany({
      orderBy: { created_at: "desc" },
      take: 8,
      select: {
        id: true,
        aksi: true,
        entitas: true,
        ringkasan: true,
        username: true,
        created_at: true,
      },
    }),
  ]);

  const avgBulanIni = kehadiranStats._avg.total ?? 0;
  const avgBulanLalu = kehadiranBulanLalu._avg.total ?? 0;
  const kehadiranPersen =
    totalJemaat > 0 ? Math.round((avgBulanIni / totalJemaat) * 100) : 0;
  const kehadiranDelta =
    avgBulanLalu > 0
      ? Math.round(((avgBulanIni - avgBulanLalu) / avgBulanLalu) * 100)
      : 0;

  const agendaDekat = jadwalMendatang.length;

  const stats = {
    totalJemaat,
    jemaatBulanIni,
    totalKeluarga,
    totalRayon,
    agendaBulanIni,
    agendaDekat,
    kehadiranPersen,
    kehadiranDelta,
  };

  const agenda = jadwalMendatang.map((i) => ({
    id: i.id,
    nmIbadah: i.nm_ibadah ?? i.unsur?.nm_unsur ?? "Ibadah",
    tgl: i.tgl,
    waktu: i.waktu,
    tempat: i.tempat ?? (i.jemaat ? `Kel. ${i.jemaat.nm_lengkap}` : null),
    rayon: i.jemaat?.keluarga?.rayon?.nm_rayon ?? null,
  }));

  const activities = logTerbaru.map((l) => ({
    id: l.id,
    aksi: l.aksi,
    entitas: l.entitas,
    ringkasan: l.ringkasan,
    username: l.username,
    createdAt: l.created_at.toISOString(),
  }));

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <DashboardHeader />
      <OverviewStats stats={stats} />
      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
        <RecentActivities activities={activities} />
        <UpcomingAgenda agenda={agenda} />
      </div>
    </main>
  );
}
