"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Menu, Search } from "lucide-react";
import { AppSidebar } from "@/components/layouts/app-sidebar";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS, isManagedRole } from "@/lib/permissions";

type AdminShellProps = {
  children: ReactNode;
  role: string;
  username: string;
  // null = ADMIN (semua menu). Selain itu daftar kunci resource yang boleh dilihat.
  allowedResources: string[] | null;
};

function roleLabel(role: string): string {
  return isManagedRole(role) ? ROLE_LABELS[role] : "Administrator";
}

function roleSubtitle(role: string): string {
  return role === "ADMIN" ? "Sekretariat Gereja" : "Pengurus Unsur";
}

function initials(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) return "AD";
  const parts = cleaned.split(/[\s._-]+/).filter(Boolean);
  const chars = parts.length >= 2 ? parts[0][0] + parts[1][0] : cleaned.slice(0, 2);
  return chars.toUpperCase();
}

export function AdminShell({ children, role, username, allowedResources }: AdminShellProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = searchQuery.trim();
    // Arahkan ke pencarian data jemaat (halaman /admin/jemaat membaca ?q=).
    router.push(query ? `/admin/jemaat?q=${encodeURIComponent(query)}` : "/admin/jemaat");
  }

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Gagal keluar");

      router.replace("/");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--cream)] lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
      <AppSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        role={role}
        allowedResources={allowedResources}
      />
      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-[var(--line)] bg-[var(--paper)] px-4 sm:px-6 lg:px-8">
          <Button
            type="button"
            variant="ghost"
            square
            className="lg:hidden"
            aria-label="Buka menu navigasi"
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} aria-hidden="true" />
          </Button>
          <form
            role="search"
            onSubmit={handleSearch}
            className="hidden h-10 max-w-md flex-1 md:block"
          >
            <label className="input input-bordered flex h-10 items-center gap-2 bg-transparent">
              <Search size={17} className="text-[var(--muted)]" aria-hidden="true" />
              <span className="sr-only">Cari jemaat</span>
              <input
                type="search"
                name="q"
                className="grow"
                placeholder="Cari nama jemaat, alamat, atau no. KK"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.currentTarget.value)}
              />
            </label>
          </form>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" square aria-label="Lihat notifikasi">
              <Bell size={20} aria-hidden="true" />
            </Button>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-[var(--ink)]">{roleLabel(role)}</p>
              <p className="text-xs text-[var(--muted)]">{roleSubtitle(role)}</p>
            </div>
            <span
              className="grid size-10 place-items-center rounded-full bg-[var(--forest)] text-sm font-bold text-[var(--paper)]"
              aria-hidden="true"
            >
              {initials(username)}
            </span>
            <Button
              type="button"
              variant="ghost"
              square
              aria-label="Keluar dari akun"
              title="Keluar"
              disabled={isLoggingOut}
              onClick={handleLogout}
            >
              <LogOut size={20} aria-hidden="true" />
            </Button>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
