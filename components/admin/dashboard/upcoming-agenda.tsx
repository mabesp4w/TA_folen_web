type AgendaItem = {
  id: string;
  nmIbadah: string;
  tgl: Date;
  waktu: Date;
  tempat: string | null;
  rayon: string | null;
};

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MEI", "JUN", "JUL", "AGU", "SEP", "OKT", "NOV", "DES"];

function fmtDay(d: Date): string {
  return String(d.getDate()).padStart(2, "0");
}

function fmtMonth(d: Date): string {
  return MONTHS[d.getMonth()] ?? "";
}

function fmtTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}.${String(d.getMinutes()).padStart(2, "0")} WIT`;
}

export function UpcomingAgenda({ agenda }: { agenda: AgendaItem[] }) {
  const isEmpty = agenda.length === 0;
  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper)]" aria-labelledby="agenda-title">
      <header className="border-b border-[var(--line)] px-5 py-4">
        <h2 id="agenda-title" className="font-bold text-[var(--ink)]">Agenda mendatang</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">Jadwal pelayanan terdekat</p>
      </header>
      <div className="space-y-1 p-3">
        {isEmpty && (
          <p className="py-8 text-center text-sm text-[var(--muted)]">Tidak ada jadwal mendatang.</p>
        )}
        {agenda.map((a) => (
          <article key={a.id} className="flex gap-4 rounded-xl p-3 hover:bg-[var(--cream)]">
            <time className="grid size-12 shrink-0 place-content-center rounded-xl bg-[var(--forest)] text-center text-[var(--paper)]">
              <strong className="text-lg leading-none">{fmtDay(a.tgl)}</strong>
              <span className="mt-1 text-[0.58rem] font-bold tracking-wider">{fmtMonth(a.tgl)}</span>
            </time>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-[var(--ink)]">{a.nmIbadah}</h3>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {fmtTime(a.waktu)}
                {a.tempat ? ` · ${a.tempat}` : ""}
                {a.rayon ? ` · Rayon ${a.rayon}` : ""}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
