"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type SelectOption } from "@/components/ui/select";
import { LogFilters } from "./log-filters";

export type LogRow = {
  id: string;
  username: string;
  role: string | null;
  aksi: string;
  entitas: string;
  ringkasan: string | null;
  ip: string | null;
  createdAt: string;
};

type Props = {
  rows: LogRow[];
  entitasOptions: string[];
  filters: { q: string; entitas: string; aksi: string; from: string; to: string };
  page: number;
  pageCount: number;
  total: number;
};

const aksiOptions: SelectOption[] = [
  { value: "CREATE", label: "Input" },
  { value: "UPDATE", label: "Edit" },
  { value: "DELETE", label: "Hapus" },
];

const aksiBadge: Record<string, string> = {
  CREATE: "badge-success",
  UPDATE: "badge-info",
  DELETE: "badge-error",
};

const aksiLabel: Record<string, string> = {
  CREATE: "Input",
  UPDATE: "Edit",
  DELETE: "Hapus",
};

function useDebounce(callback: (value: string) => void, delay: number) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  });
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);
  return useCallback(
    (value: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => callbackRef.current(value), delay);
    },
    [delay],
  );
}

export function LogManager({ rows, entitasOptions, filters, page, pageCount, total }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setParam = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      // Setiap perubahan filter kembali ke halaman pertama.
      if (!("page" in updates)) params.delete("page");
      router.push(`/admin/log-aktivitas${params.size ? `?${params.toString()}` : ""}`, {
        scroll: false,
      });
    },
    [router, searchParams],
  );

  const debouncedSearch = useDebounce((value: string) => setParam({ q: value }), 400);

  const entitasSelect: SelectOption[] = entitasOptions.map((value) => ({ value, label: value }));

  return (
    <>
      <header className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--forest)]">
          Pengaturan
        </p>
        <h1 className="mt-1 text-3xl font-bold text-[var(--ink)]">Log Aktivitas</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Jejak audit setiap perubahan data oleh akun admin. Data bersifat baca-saja untuk menjaga
          integritas.
        </p>
      </header>

      <LogFilters
        aksiOptions={aksiOptions}
        entitasOptions={entitasSelect}
        filters={filters}
        onParamChange={setParam}
        onSearch={debouncedSearch}
      />

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--paper)] p-10 text-center">
          <ShieldCheck aria-hidden="true" className="mx-auto text-[var(--muted)]" size={40} />
          <h2 className="mt-4 text-lg font-semibold">Tidak ada aktivitas</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Belum ada log yang cocok dengan filter yang dipilih.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--paper)] shadow-sm">
          <table className="table">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Pelaku</th>
                <th>Aksi</th>
                <th>Entitas</th>
                <th>Ringkasan</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="whitespace-nowrap text-sm text-[var(--muted)]">{row.createdAt}</td>
                  <td>
                    <span className="font-semibold">{row.username}</span>
                    {row.role ? (
                      <span className="block text-xs text-[var(--muted)]">{row.role}</span>
                    ) : null}
                  </td>
                  <td>
                    <span className={`badge ${aksiBadge[row.aksi] ?? "badge-ghost"}`}>
                      {aksiLabel[row.aksi] ?? row.aksi}
                    </span>
                  </td>
                  <td>{row.entitas}</td>
                  <td className="max-w-xs truncate">
                    {row.ringkasan ?? <span className="text-[var(--muted)]">—</span>}
                  </td>
                  <td className="text-sm text-[var(--muted)]">{row.ip ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pageCount > 1 && (
        <nav
          aria-label="Navigasi halaman log"
          className="mt-5 flex items-center justify-between gap-4"
        >
          <p className="text-sm text-[var(--muted)]">
            Halaman {page} dari {pageCount} · {total} entri
          </p>
          <div className="flex gap-2">
            <Button
              disabled={page <= 1}
              size="sm"
              type="button"
              variant="outline"
              onClick={() => setParam({ page: String(page - 1) })}
            >
              <ChevronLeft size={16} aria-hidden="true" /> Sebelumnya
            </Button>
            <Button
              disabled={page >= pageCount}
              size="sm"
              type="button"
              variant="outline"
              onClick={() => setParam({ page: String(page + 1) })}
            >
              Berikutnya <ChevronRight size={16} aria-hidden="true" />
            </Button>
          </div>
        </nav>
      )}
    </>
  );
}
