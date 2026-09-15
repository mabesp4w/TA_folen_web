import { CalendarCheck, HeartHandshake, TrendingUp, Users } from "lucide-react";

const stats = [
  { label: "Total jemaat", value: "1.248", detail: "+18 bulan ini", icon: Users },
  { label: "Keluarga aktif", value: "386", detail: "12 rayon", icon: HeartHandshake },
  { label: "Agenda bulan ini", value: "24", detail: "6 agenda terdekat", icon: CalendarCheck },
  { label: "Kehadiran ibadah", value: "82%", detail: "+4% dari bulan lalu", icon: TrendingUp },
];

export function OverviewStats() {
  return (
    <section className="mt-7" aria-labelledby="overview-title">
      <h2 id="overview-title" className="sr-only">Ringkasan data gereja</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, detail, icon: Icon }) => (
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
