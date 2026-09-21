import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardHeader() {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--pacific)]">Pusat administrasi</p>
        <h1 className="mt-1 text-2xl font-bold text-[var(--ink)] sm:text-3xl">Selamat datang, Administrator</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Pantau pelayanan, data jemaat, dan agenda gereja dari satu ruang kerja.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/agenda"
          className="btn btn-outline border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] shadow-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <CalendarDays size={18} aria-hidden="true" /> Lihat kalender
        </Link>
        <Button>
          <Plus size={18} aria-hidden="true" /> Tambah data
        </Button>
      </div>
    </header>
  );
}
