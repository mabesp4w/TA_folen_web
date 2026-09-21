import { CalendarCheck, HeartHandshake, TrendingUp, Users } from "lucide-react";
import type { ComponentType } from "react";

type StatsData = {
  totalJemaat: number;
  jemaatBulanIni: number;
  totalKeluarga: number;
  totalRayon: number;
  agendaBulanIni: number;
  agendaDekat: number;
  kehadiranPersen: number;
  kehadiranDelta: number;
};

type StatCard = {
  label: string;
  value: string;
  detail: string;
  icon: ComponentType<{ size?: number; "aria-hidden"?: boolean | "true" | "false" }>;
};

function buildCards(s: StatsData): StatCard[] {
  const delta = s.kehadiranDelta;
  const deltaLabel =
    delta > 0 ? `+${delta}% dari bulan lalu` : delta < 0 ? `${delta}% dari bulan lalu` : "Stabil dari bulan lalu";
  return [
    {
      label: "Total jemaat",
      value: s.totalJemaat.toLocaleString("id-ID"),
      detail: s.jemaatBulanIni > 0 ? `+${s.jemaatBulanIni} bulan ini` : "Tidak ada tambahan bulan ini",
      icon: Users,
    },
    {
      label: "Keluarga aktif",
      value: s.totalKeluarga.toLocaleString("id-ID"),
      detail: `${s.totalRayon} rayon`,
      icon: HeartHandshake,
    },
    {
      label: "Agenda bulan ini",
      value: String(s.agendaBulanIni),
      detail: `${s.agendaDekat} agenda terdekat`,
      icon: CalendarCheck,
    },
    {
      label: "Kehadiran ibadah",
      value: `${s.kehadiranPersen}%`,
      detail: deltaLabel,
      icon: TrendingUp,
    },
  ];
}

export function OverviewStats({ stats }: { stats: StatsData }) {
  const cards = buildCards(stats);
  return (
    <section className="mt-7" aria-labelledby="overview-title">
      <h2 id="overview-title" className="sr-only">Ringkasan data gereja</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, detail, icon: Icon }) => (
          <article key={label} className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 shadow-[0_8px_28px_rgb(23_49_40/0.05)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-[var(--muted)]">{label}</p>
                <p className="mt-2 text-3xl font-bold text-[var(--ink)]">{value}</p>
              </div>
              <span className="grid size-11 place-items-center rounded-xl bg-[var(--cream)] text-[var(--forest)]">
                <Icon size={22} aria-hidden="true" />
              </span>
            </div>
            <p className="mt-4 border-t border-[var(--line)] pt-3 text-xs text-[var(--muted)]">{detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
