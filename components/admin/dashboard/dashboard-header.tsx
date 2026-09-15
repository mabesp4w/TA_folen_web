import { CalendarDays, Plus } from "lucide-react";

export function DashboardHeader() {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--pacific)]">Pusat administrasi</p>
        <h1 className="mt-1 text-2xl font-bold text-[var(--ink)] sm:text-3xl">Selamat datang, Administrator</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Pantau pelayanan, data jemaat, dan agenda gereja dari satu ruang kerja.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] shadow-none">
          <CalendarDays size={18} aria-hidden="true" /> Lihat kalender
        </button>
        <button type="button" className="btn border-0 bg-[var(--forest)] text-[var(--paper)] shadow-none hover:bg-[var(--forest-deep)]">
          <Plus size={18} aria-hidden="true" /> Tambah data
        </button>
      </div>
    </header>
  );
}
