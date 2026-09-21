import {
  CircleDollarSign,
  FilePlus,
  Pencil,
  Trash2,
  type LucideIcon,
} from "lucide-react";

type Activity = {
  id: string;
  aksi: string;
  entitas: string;
  ringkasan: string | null;
  username: string;
  createdAt: string;
};

const aksiIcon: Record<string, LucideIcon> = {
  CREATE: FilePlus,
  UPDATE: Pencil,
  DELETE: Trash2,
};

const aksiLabel: Record<string, string> = {
  CREATE: "menambahkan",
  UPDATE: "memperbarui",
  DELETE: "menghapus",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Kemarin";
  return `${days} hari lalu`;
}

export function RecentActivities({ activities }: { activities: Activity[] }) {
  const isEmpty = activities.length === 0;
  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper)]" aria-labelledby="activity-title">
      <header className="border-b border-[var(--line)] px-5 py-4 sm:px-6">
        <h2 id="activity-title" className="font-bold text-[var(--ink)]">Aktivitas terbaru</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">Pembaruan terakhir dari ruang administrasi</p>
      </header>
      <div className="divide-y divide-[var(--line)] px-5 sm:px-6">
        {isEmpty && (
          <p className="py-8 text-center text-sm text-[var(--muted)]">Belum ada aktivitas tercatat.</p>
        )}
        {activities.map((a) => {
          const Icon = aksiIcon[a.aksi] ?? CircleDollarSign;
          const verb = aksiLabel[a.aksi] ?? a.aksi.toLowerCase();
          return (
            <article key={a.id} className="flex gap-4 py-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--cream)] text-[var(--forest)]">
                <Icon size={19} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-[var(--ink)]">
                  {a.username} {verb} {a.entitas}
                </h3>
                {a.ringkasan && (
                  <p className="mt-1 text-sm text-[var(--muted)]">{a.ringkasan}</p>
                )}
              </div>
              <time className="hidden shrink-0 text-xs text-[var(--muted)] sm:block">
                {timeAgo(a.createdAt)}
              </time>
            </article>
          );
        })}
      </div>
    </section>
  );
}
