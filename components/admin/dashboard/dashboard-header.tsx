import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";

type DashboardHeaderProps = {
  roleLabel: string;
  isAdmin: boolean;
};

export function DashboardHeader({ roleLabel, isAdmin }: DashboardHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--pacific)]">
          Pusat administrasi
        </p>
        <h1 className="mt-1 text-2xl font-bold text-[var(--ink)] sm:text-3xl">
          Selamat datang, {roleLabel}
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          {isAdmin
            ? "Pantau pelayanan, data jemaat, dan agenda gereja dari satu ruang kerja."
            : "Berikut agenda pelayanan terdekat. Menu di samping menyesuaikan hak akses Anda."}
        </p>
      </div>
      {isAdmin && (
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/agenda"
            className="btn btn-outline border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] shadow-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <CalendarDays size={18} aria-hidden="true" /> Lihat kalender
          </Link>
          <Link
            href="/admin/jemaat"
            className="btn border-0 bg-[var(--forest)] text-white shadow-none hover:bg-[var(--forest-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <Plus size={18} aria-hidden="true" /> Tambah data
          </Link>
        </div>
      )}
    </header>
  );
}
