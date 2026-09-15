import { CircleDollarSign, ImagePlus, UserPlus } from "lucide-react";

const activities = [
  { title: "Data jemaat baru ditambahkan", detail: "Keluarga Yikwa, Rayon Betlehem", time: "12 menit lalu", icon: UserPlus },
  { title: "Laporan persembahan diperbarui", detail: "Ibadah Minggu, 13 September 2026", time: "1 jam lalu", icon: CircleDollarSign },
  { title: "Dokumentasi kegiatan diterbitkan", detail: "Persekutuan Pemuda Jemaat", time: "Kemarin, 19.40", icon: ImagePlus },
];

export function RecentActivities() {
  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper)]" aria-labelledby="activity-title">
      <header className="border-b border-[var(--line)] px-5 py-4 sm:px-6">
        <h2 id="activity-title" className="font-bold text-[var(--ink)]">Aktivitas terbaru</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">Pembaruan terakhir dari ruang administrasi</p>
      </header>
      <div className="divide-y divide-[var(--line)] px-5 sm:px-6">
        {activities.map(({ title, detail, time, icon: Icon }) => (
          <article key={title} className="flex gap-4 py-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--cream)] text-[var(--forest)]">
              <Icon size={19} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-[var(--ink)]">{title}</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">{detail}</p>
            </div>
            <time className="hidden shrink-0 text-xs text-[var(--muted)] sm:block">{time}</time>
          </article>
        ))}
      </div>
    </section>
  );
}
