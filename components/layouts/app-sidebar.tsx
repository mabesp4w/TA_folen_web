"use client";

import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  Church,
  CircleDollarSign,
  FileText,
  Images,
  LayoutDashboard,
  Megaphone,
  Settings,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createElement } from "react";
import { Button } from "@/components/ui/button";

export type SidebarItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const adminItems: SidebarItem[] = [
  { label: "Dashboard", href: "/app/admin", icon: LayoutDashboard },
  { label: "Data Jemaat", href: "/app/admin/jemaat", icon: Users },
  { label: "Agenda & Ibadah", href: "/app/admin/agenda", icon: CalendarDays },
  { label: "Pengumuman", href: "/app/admin/pengumuman", icon: Megaphone },
  { label: "Keuangan", href: "/app/admin/keuangan", icon: CircleDollarSign },
  { label: "Galeri", href: "/app/admin/galeri", icon: Images },
  { label: "Laporan", href: "/app/admin/laporan", icon: FileText },
];

type AppSidebarProps = {
  items?: SidebarItem[];
  open?: boolean;
  onClose?: () => void;
};

export function AppSidebar({
  items = adminItems,
  open = false,
  onClose,
}: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {open && (
        <Button
          type="button"
          variant="ghost"
          className="fixed inset-0 z-30 h-auto min-h-0 w-auto rounded-none border-0 bg-[var(--forest-deep)]/45 p-0 lg:hidden"
          aria-label="Tutup menu navigasi"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[272px] flex-col bg-[var(--forest-deep)] text-[var(--paper)] transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Navigasi utama"
      >
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-5">
          <span className="grid size-11 place-items-center rounded-xl bg-[var(--gold)] text-[var(--forest-deep)]">
            <Church size={25} aria-hidden="true" />
          </span>
          <div>
            <p className="font-semibold">GKI Syaloom</p>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/60">
              Pasifik Indah
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            square
            className="ml-auto text-white lg:hidden"
            aria-label="Tutup menu"
            onClick={onClose}
          >
            <X size={20} aria-hidden="true" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <p className="px-3 pb-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/45">
            Menu utama
          </p>
          <ul className="menu gap-1 p-0">
            {items.map(({ label, href, icon: Icon }) => {
              const active =
                href === "/app/admin" ? pathname === href : pathname.startsWith(href);

              return (
                <li key={href}>
                  {createElement(
                    Link,
                    {
                      href,
                      onClick: onClose,
                      "aria-current": active ? "page" : undefined,
                      className: `flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                        active
                          ? "bg-white/10 font-semibold text-white ring-1 ring-inset ring-white/10"
                          : "text-white/70 hover:bg-white/10 hover:text-white"
                      }`,
                    },
                    <Icon size={19} aria-hidden="true" />,
                    label,
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-white/10 p-3">
          {createElement(
            Link,
            {
              href: "/app/admin/pengaturan",
              onClick: onClose,
              className:
                "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white",
            },
            <Settings size={19} aria-hidden="true" />,
            "Pengaturan",
          )}
        </div>
      </aside>
    </>
  );
}
