"use client";

import { useCallback, useEffect, useRef, useState, useActionState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { gooeyToast } from "goey-toast";
import { Button } from "@/components/ui/button";
import { InputText } from "@/components/ui/input-text";
import { Select } from "@/components/ui/select";
import {
  createJemaatAction,
  deleteJemaatAction,
  updateJemaatAction,
} from "./actions";
import { JemaatForm } from "./jemaat-form";
import { initialActionState, JEMAAT_STATUSES } from "./schema";
import type { ResourcePermission } from "@/lib/permissions";

// Izin default penuh — dipakai bila prop tidak diberikan (mis. ADMIN).
const FULL_PERMISSION: ResourcePermission = {
  view: true,
  create: true,
  update: true,
  delete: true,
};

export type JemaatRow = {
  id: string;
  nm_lengkap: string;
  tgl_lahir: string;
  jenkel: string;
  stat_keluarga: string;
  status: string;
  id_keluarga: string | null;
  keluarga:
    | {
        no_kk: string | null;
        alamat_blok: string;
        rayon: { nm_rayon: string } | null;
      }
    | null;
};

export type RayonOption = { id: string; nm_rayon: string };
export type KeluargaOption = { value: string; label: string };
type DialogMode = "create" | "edit" | "delete" | null;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(value));
}

function useDebounce(callback: (value: string) => void, delay: number) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return useCallback((value: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => callbackRef.current(value), delay);
  }, [delay]);
}

export function JemaatManager({
  jemaat,
  rayons,
  keluargaOptions,
  query,
  rayon,
  status,
  permission = FULL_PERMISSION,
}: {
  jemaat: JemaatRow[];
  rayons: RayonOption[];
  keluargaOptions: KeluargaOption[];
  query: string;
  rayon: string;
  status: string;
  permission?: ResourcePermission;
}) {
  const router = useRouter();
  const canModify = permission.update || permission.delete;
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<DialogMode>(null);
  const [selected, setSelected] = useState<JemaatRow | null>(null);
  const [formResetKey, setFormResetKey] = useState(0);
  const mutationAction = mode === "edit" ? updateJemaatAction : createJemaatAction;
  const [formState, formAction, formPending] = useActionState(
    mutationAction,
    initialActionState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteJemaatAction,
    initialActionState,
  );
  const handledStateRef = useRef<typeof initialActionState | null>(null);

  function applyFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`, { scroll: false });
  }

  const debouncedSearch = useDebounce(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("q", value);
      } else {
        params.delete("q");
      }
      router.push(`?${params.toString()}`, { scroll: false });
    },
    400,
  );

  useEffect(() => {
    if (!mode) return;

    const state = mode === "delete" ? deleteState : formState;
    if (!state.message || handledStateRef.current === state) {
      return;
    }

    handledStateRef.current = state;

    if (state.status === "error") {
      gooeyToast.error(state.message);
      return;
    }

    if (state.status !== "success") return;

    gooeyToast.success(state.message);

    if (mode === "create") {
      const timer = window.setTimeout(() => {
        setSelected(null);
        setFormResetKey((key) => key + 1);
      }, 0);

      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => {
      setMode(null);
      setSelected(null);
    }, 800);

    return () => window.clearTimeout(timer);
  }, [deleteState, formState, mode]);

  function closeDialog() {
    setMode(null);
    setSelected(null);
  }

  function edit(row: JemaatRow) {
    handledStateRef.current = formState;
    setSelected(row);
    setMode("edit");
  }

  function remove(row: JemaatRow) {
    handledStateRef.current = deleteState;
    setSelected(row);
    setMode("delete");
  }

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Administrasi
          </p>
          <h1 className="mt-1 text-3xl font-bold text-[var(--ink)]">Data Jemaat</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Kelola identitas, rayon, dan status keanggotaan jemaat.
          </p>
        </div>
        {permission.create && (
          <Button
            type="button"
            onClick={() => {
              handledStateRef.current = formState;
              setSelected(null);
              setMode("create");
            }}
          >
            <Plus size={18} aria-hidden="true" />
            Tambah jemaat
          </Button>
        )}
      </header>

      <form
        className="mb-5 grid gap-3 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-4 md:grid-cols-[minmax(220px,1fr)_220px_180px] md:items-end"
        onSubmit={(e) => e.preventDefault()}
        aria-label="Cari dan filter data jemaat"
      >
        <InputText
          defaultValue={query}
          icon={<Search size={17} aria-hidden="true" />}
          label="Pencarian"
          name="q"
          placeholder="Nama atau alamat blok"
          type="search"
          onChange={(e) => debouncedSearch(e.currentTarget.value)}
        />
        <Select
          defaultValue={
            rayon
              ? { value: rayon, label: rayons.find((r) => r.id === rayon)?.nm_rayon ?? "" }
              : undefined
          }
          label="Rayon"
          name="rayon"
          options={[
            { value: "", label: "Semua rayon" },
            ...rayons.map((item) => ({ value: item.id, label: item.nm_rayon })),
          ]}
          placeholder="Semua rayon"
          variant="react-select"
          onChange={(value: { value: string } | null) => applyFilter("rayon", value?.value ?? "")}
        />
        <Select
          defaultValue={status}
          label="Status"
          name="status"
          options={[
            { value: "", label: "Semua status" },
            ...JEMAAT_STATUSES.map((item) => ({ value: item, label: item })),
          ]}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => applyFilter("status", e.currentTarget.value)}
        />
      </form>

      {jemaat.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--paper)] p-10 text-center text-[var(--muted)]">
          Tidak ada data jemaat yang sesuai dengan pencarian dan filter.
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--paper)] md:block">
            <table className="table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Rayon</th>
                  <th>Tanggal lahir</th>
                  <th>Keluarga</th>
                  <th>Status</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {jemaat.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.nm_lengkap}</strong>
                      <div className="text-xs text-[var(--muted)]">
                        {row.jenkel === "L" ? "Laki-laki" : "Perempuan"} · {row.keluarga?.alamat_blok ?? "Tanpa alamat"}
                      </div>
                    </td>
                    <td>{row.keluarga?.rayon?.nm_rayon ?? "Belum ditentukan"}</td>
                    <td>{formatDate(row.tgl_lahir)}</td>
                    <td>{row.stat_keluarga.replace("_", " ")}</td>
                    <td><span className="badge badge-outline">{row.status}</span></td>
                    <td>
                      <div className="flex justify-end gap-1">
                        {permission.update && (
                          <Button
                            variant="ghost"
                            size="sm"
                            square
                            type="button"
                            aria-label={`Edit ${row.nm_lengkap}`}
                            onClick={() => edit(row)}
                          >
                            <Pencil size={16} aria-hidden="true" />
                          </Button>
                        )}
                        {permission.delete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            square
                            className="text-error"
                            type="button"
                            aria-label={`Hapus ${row.nm_lengkap}`}
                            onClick={() => remove(row)}
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </Button>
                        )}
                        {!canModify && (
                          <span className="text-xs text-[var(--muted)]">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:hidden">
            {jemaat.map((row) => (
              <article
                className="min-w-0 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-4"
                key={row.id}
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="break-words font-bold text-[var(--ink)]">{row.nm_lengkap}</h2>
                    <p className="break-words text-sm text-[var(--muted)]">
                      {row.keluarga?.rayon?.nm_rayon ?? "Tanpa rayon"} · {row.keluarga?.alamat_blok ?? "Tanpa alamat"}
                    </p>
                  </div>
                  <span className="badge badge-outline shrink-0">{row.status}</span>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-[var(--muted)]">Tanggal lahir</dt>
                    <dd>{formatDate(row.tgl_lahir)}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--muted)]">Status keluarga</dt>
                    <dd>{row.stat_keluarga.replace("_", " ")}</dd>
                  </div>
                </dl>
                {canModify && (
                  <div className="mt-4 flex gap-2">
                    {permission.update && (
                      <Button variant="outline" size="sm" className="flex-1" type="button" onClick={() => edit(row)}>
                        <Pencil size={15} aria-hidden="true" /> Edit
                      </Button>
                    )}
                    {permission.delete && (
                      <Button variant="outline" size="sm" className="btn-error flex-1" type="button" onClick={() => remove(row)}>
                        <Trash2 size={15} aria-hidden="true" /> Hapus
                      </Button>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        </>
      )}

      {mode && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/40 sm:place-items-center sm:p-6">
          <section
            className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-[var(--paper)] p-5 shadow-2xl sm:max-w-2xl sm:rounded-2xl sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="jemaat-dialog-title"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold" id="jemaat-dialog-title">
                  {mode === "create" ? "Tambah jemaat" : mode === "edit" ? "Edit jemaat" : "Hapus jemaat"}
                </h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {mode === "delete"
                    ? `Data ${selected?.nm_lengkap} akan dihapus permanen.`
                    : "Lengkapi seluruh data wajib di bawah ini."}
                </p>
              </div>
              <Button variant="ghost" size="sm" square type="button" aria-label="Tutup dialog" onClick={closeDialog}>
                <X size={20} aria-hidden="true" />
              </Button>
            </div>

            {mode === "delete" ? (
              <form action={deleteAction}>
                <input name="id" type="hidden" value={selected?.id ?? ""} />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" type="button" onClick={closeDialog}>Batal</Button>
                  <Button variant="danger" disabled={deletePending} loading={deletePending} type="submit">
                    {deletePending ? "Menghapus..." : "Hapus permanen"}
                  </Button>
                </div>
              </form>
            ) : (
              <JemaatForm
                key={formResetKey}
                formAction={formAction}
                mode={mode}
                pending={formPending}
                keluargaOptions={keluargaOptions}
                selected={selected}
                state={formState}
                onCancel={closeDialog}
              />
            )}
          </section>
        </div>
      )}
    </>
  );
}
