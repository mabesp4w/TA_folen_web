"use client";

import { useCallback, useEffect, useRef, useState, useActionState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { gooeyToast } from "goey-toast";
import { Button } from "@/components/ui/button";
import { InputText } from "@/components/ui/input-text";
import {
  createRayonAction,
  deleteRayonAction,
  updateRayonAction,
} from "./actions";
import { initialRayonActionState } from "./schema";
import { RayonForm } from "./rayon-form";

export type RayonRow = {
  id: string;
  nm_rayon: string;
  _count: { keluarga: number; jemaat: number };
};

type DialogMode = "create" | "edit" | "delete" | null;

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

export function RayonManager({
  rayons,
  query,
}: {
  rayons: RayonRow[];
  query: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<DialogMode>(null);
  const [selected, setSelected] = useState<RayonRow | null>(null);
  const [formResetKey, setFormResetKey] = useState(0);
  const mutationAction = mode === "edit" ? updateRayonAction : createRayonAction;
  const [formState, formAction, formPending] = useActionState(
    mutationAction,
    initialRayonActionState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteRayonAction,
    initialRayonActionState,
  );
  const handledStateRef = useRef<typeof initialRayonActionState | null>(null);

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

  function edit(row: RayonRow) {
    handledStateRef.current = formState;
    setSelected(row);
    setMode("edit");
  }

  function remove(row: RayonRow) {
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
          <h1 className="mt-1 text-3xl font-bold text-[var(--ink)]">Data Rayon</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Kelola nama rayon dan lihat jumlah jemaat di setiap rayon.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            handledStateRef.current = formState;
            setSelected(null);
            setMode("create");
          }}
        >
          <Plus size={18} aria-hidden="true" />
          Tambah rayon
        </Button>
      </header>

      <form
        className="mb-5 grid gap-3 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-4 md:grid-cols-[minmax(220px,1fr)] md:items-end"
        onSubmit={(e) => e.preventDefault()}
        aria-label="Cari data rayon"
      >
        <InputText
          defaultValue={query}
          icon={<Search size={17} aria-hidden="true" />}
          label="Pencarian"
          name="q"
          placeholder="Nama rayon"
          type="search"
          onChange={(e) => debouncedSearch(e.currentTarget.value)}
        />
      </form>

      {rayons.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--paper)] p-10 text-center text-[var(--muted)]">
          Tidak ada data rayon yang sesuai dengan pencarian.
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--paper)] md:block">
            <table className="table">
              <thead>
                <tr>
                  <th>Nama Rayon</th>
                  <th>Jumlah Keluarga</th>
                  <th>Jumlah Jemaat</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rayons.map((row) => (
                  <tr key={row.id}>
                    <td className="font-semibold">{row.nm_rayon}</td>
                    <td>{row._count.keluarga} keluarga</td>
                    <td>{row._count.jemaat} jemaat</td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          square
                          type="button"
                          aria-label={`Edit ${row.nm_rayon}`}
                          onClick={() => edit(row)}
                        >
                          <Pencil size={16} aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          square
                          className="text-error"
                          type="button"
                          aria-label={`Hapus ${row.nm_rayon}`}
                          onClick={() => remove(row)}
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:hidden">
            {rayons.map((row) => (
              <article
                className="min-w-0 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-4"
                key={row.id}
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="break-words font-bold text-[var(--ink)]">{row.nm_rayon}</h2>
                    <p className="break-words text-sm text-[var(--muted)]">
                      {row._count.keluarga} keluarga · {row._count.jemaat} jemaat
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" type="button" onClick={() => edit(row)}>
                    <Pencil size={15} aria-hidden="true" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" className="btn-error flex-1" type="button" onClick={() => remove(row)}>
                    <Trash2 size={15} aria-hidden="true" /> Hapus
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {mode && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/40 sm:place-items-center sm:p-6">
          <section
            className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-[var(--paper)] p-5 shadow-2xl sm:max-w-lg sm:rounded-2xl sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rayon-dialog-title"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold" id="rayon-dialog-title">
                  {mode === "create" ? "Tambah rayon" : mode === "edit" ? "Edit rayon" : "Hapus rayon"}
                </h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {mode === "delete"
                    ? `Data ${selected?.nm_rayon} akan dihapus permanen.`
                    : "Masukkan nama rayon yang valid."}
                </p>
              </div>
              <Button variant="ghost" size="sm" square type="button" aria-label="Tutup dialog" onClick={closeDialog}>
                <X size={20} aria-hidden="true" />
              </Button>
            </div>

            {mode === "delete" ? (
              <form action={deleteAction}>
                <input name="id" type="hidden" value={selected?.id ?? ""} />
                <input name="resource" type="hidden" value="rayon" />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" type="button" onClick={closeDialog}>Batal</Button>
                  <Button variant="danger" disabled={deletePending} loading={deletePending} type="submit">
                    {deletePending ? "Menghapus..." : "Hapus permanen"}
                  </Button>
                </div>
              </form>
            ) : (
              <RayonForm
                key={formResetKey}
                formAction={formAction}
                mode={mode}
                pending={formPending}
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
