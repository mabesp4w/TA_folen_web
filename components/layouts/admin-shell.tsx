"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Bell, Menu, Search } from "lucide-react";
import { AppSidebar } from "@/components/layouts/app-sidebar";
import { Button } from "@/components/ui/button";

export function AdminShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--cream)] lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
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
          <label className="input input-bordered hidden h-10 max-w-md flex-1 items-center gap-2 bg-transparent md:flex">
            <Search size={17} className="text-[var(--muted)]" aria-hidden="true" />
            <span className="sr-only">Cari data</span>
            <input type="search" className="grow" placeholder="Cari jemaat, agenda, atau dokumen" />
          </label>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" square aria-label="Lihat notifikasi">
              <Bell size={20} aria-hidden="true" />
            </Button>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-[var(--ink)]">Administrator</p>
              <p className="text-xs text-[var(--muted)]">Sekretariat Gereja</p>
            </div>
            <span className="grid size-10 place-items-center rounded-full bg-[var(--forest)] text-sm font-bold text-[var(--paper)]" aria-hidden="true">
              AD
            </span>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
