const agendas = [
  { day: "18", month: "SEP", title: "Rapat Majelis Jemaat", time: "18.00 WIT", place: "Ruang Konsistori" },
  { day: "20", month: "SEP", title: "Ibadah Minggu", time: "08.00 WIT", place: "Gedung Gereja" },
  { day: "23", month: "SEP", title: "Persekutuan Kaum Ibu", time: "16.00 WIT", place: "Rayon Sion" },
];

export function UpcomingAgenda() {
  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper)]" aria-labelledby="agenda-title">
      <header className="border-b border-[var(--line)] px-5 py-4">
        <h2 id="agenda-title" className="font-bold text-[var(--ink)]">Agenda mendatang</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">Jadwal pelayanan terdekat</p>
      </header>
      <div className="space-y-1 p-3">
        {agendas.map((agenda) => (
          <article key={`${agenda.day}-${agenda.title}`} className="flex gap-4 rounded-xl p-3 hover:bg-[var(--cream)]">
            <time className="grid size-12 shrink-0 place-content-center rounded-xl bg-[var(--forest)] text-center text-[var(--paper)]">
              <strong className="text-lg leading-none">{agenda.day}</strong>
              <span className="mt-1 text-[0.58rem] font-bold tracking-wider">{agenda.month}</span>
            </time>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-[var(--ink)]">{agenda.title}</h3>
              <p className="mt-1 text-xs text-[var(--muted)]">{agenda.time} · {agenda.place}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
