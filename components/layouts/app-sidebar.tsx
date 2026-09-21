"use client";

import type { LucideIcon } from "lucide-react";
import {
  BookOpenText,
  CalendarDays,
  Church,
  CircleDollarSign,
  ClipboardList,
  GalleryHorizontalEnd,
  Home,
  Images,
  LayoutDashboard,
  MapPinned,
  Megaphone,
  Newspaper,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  UserCog,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export type SidebarLink = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type SidebarGroup = {
  label: string;
  icon: LucideIcon;
  children: SidebarLink[];
};

export type SidebarItem = SidebarLink | SidebarGroup;

function isSidebarGroup(item: SidebarItem): item is SidebarGroup {
  return "children" in item;
}

function isActiveHref(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname.startsWith(href);
}

function isGroupActive(pathname: string, group: SidebarGroup) {
  return group.children.some((child) => isActiveHref(pathname, child.href));
}

function getOpenGroups(pathname: string, items: SidebarItem[]) {
  return Object.fromEntries(
    items
      .filter(isSidebarGroup)
      .filter((group) => isGroupActive(pathname, group))
      .map((group) => [group.label, true]),
  );
}

const adminItems: SidebarItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  {
    label: "Jemaat & Organisasi",
    icon: Users,
    children: [
      { label: "Data Jemaat", href: "/admin/jemaat", icon: Users },
      { label: "Keluarga", href: "/admin/keluarga", icon: Home },
      { label: "Rayon", href: "/admin/rayon", icon: MapPinned },
      { label: "Unsur", href: "/admin/unsur", icon: UsersRound },
      { label: "Pelayan & Pengurus", href: "/admin/pelayanan", icon: UserCog },
    ],
  },
  {
    label: "Ibadah & Informasi",
    icon: Newspaper,
    children: [
      { label: "Agenda & Ibadah", href: "/admin/agenda", icon: CalendarDays },
      { label: "Kehadiran", href: "/admin/kehadiran", icon: ClipboardList },
      { label: "Pengumuman", href: "/admin/pengumuman", icon: Megaphone },
      { label: "Renungan", href: "/admin/renungan", icon: BookOpenText },
    ],
  },
  { label: "Keuangan", href: "/admin/keuangan", icon: CircleDollarSign },
  {
    label: "Publikasi",
    icon: Images,
    children: [
      { label: "Galeri", href: "/admin/galeri", icon: Images },
      { label: "Slide Beranda", href: "/admin/slide", icon: GalleryHorizontalEnd },
    ],
  },
  {
    label: "Pengaturan",
    icon: Settings2,
    children: [
      { label: "Akun Akses", href: "/admin/pengaturan", icon: SlidersHorizontal },
      { label: "Log Aktivitas", href: "/admin/log-aktivitas", icon: ShieldCheck },
    ],
  },
];

const navLinkClassName = (active: boolean, nested = false) =>
  `flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 whitespace-normal transition-colors ${
    nested ? "text-[0.92rem]" : ""
  } ${
    active
      ? "bg-white/10 font-semibold text-white ring-1 ring-inset ring-white/10"
      : "text-white/70 hover:bg-white/10 hover:text-white"
  }`;

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
  const [openGroups, setOpenGroups] = useState(() => getOpenGroups(pathname, items));
  const [seenPathname, setSeenPathname] = useState(pathname);

  if (pathname !== seenPathname) {
    setSeenPathname(pathname);
    const autoOpen = getOpenGroups(pathname, items);
    const shouldUpdate = Object.keys(autoOpen).some((label) => !openGroups[label]);
    if (shouldUpdate) {
      setOpenGroups({ ...openGroups, ...autoOpen });
    }
  }

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
          <ul className="menu w-full gap-1 p-0">
            {items.map((item) => {
              if (!isSidebarGroup(item)) {
                const active = isActiveHref(pathname, item.href);
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      aria-current={active ? "page" : undefined}
                      className={navLinkClassName(active)}
                    >
                      <Icon size={19} aria-hidden="true" />
                      {item.label}
                    </Link>
                  </li>
                );
              }

              const groupActive = isGroupActive(pathname, item);
              const GroupIcon = item.icon;

              return (
                <li key={item.label}>
                  <details
                    open={Boolean(openGroups[item.label])}
                    onToggle={(event) => {
                      const nextOpen = event.currentTarget.open;
                      setOpenGroups((current) =>
                        current[item.label] === nextOpen
                          ? current
                          : { ...current, [item.label]: nextOpen },
                      );
                    }}
                  >
                    <summary
                      className={`min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 whitespace-normal transition-colors marker:content-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pacific)] ${
                        groupActive
                          ? "bg-white/5 font-semibold text-white"
                          : "text-white/70 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <GroupIcon size={19} aria-hidden="true" />
                      {item.label}
                    </summary>
                    <ul className="mt-1 whitespace-normal before:!bg-white/25">
                      {item.children.map((child) => {
                        const active = isActiveHref(pathname, child.href);
                        const ChildIcon = child.icon;

                        return (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              onClick={onClose}
                              aria-current={active ? "page" : undefined}
                              className={navLinkClassName(active, true)}
                            >
                              <ChildIcon size={17} aria-hidden="true" />
                              {child.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
