"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Pencil, Plus, Trash2, X } from "lucide-react";
import { gooeyToast } from "goey-toast";
import { Button } from "@/components/ui/button";
import { type SelectOption } from "@/components/ui/select";
import {
  createKehadiranAction,
  deleteKehadiranAction,
  updateKehadiranAction,
} from "./actions";
import { KehadiranForm } from "./kehadiran-form";
import { initialKehadiranActionState } from "./schema";

export type IbadahOption = {
  id: string;
  label: string;
};

export type KehadiranRow = {
  id: string;
  id_ibadah: string;
  ibadah: string;
  laki_laki: number;
  perempuan: number;
  anak: number;
  total: number;
};

type DialogMode = "create" | "edit" | "delete" | null;

type Props = {
  rows: KehadiranRow[];
  ibadahOptions: IbadahOption[];
};

export function KehadiranManager({ rows, ibadahOptions }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<DialogMode>(null);
  const [selected, setSelected] = useState<KehadiranRow | null>(null);

  const action =
    mode === "edit"
      ? updateKehadiranAction
      : mode === "delete"
        ? deleteKehadiranAction
        : createKehadiranAction;
  const [state, formAction, pending] = useActionState(action, initialKehadiranActionState);

  // Ibadah yang belum punya data kehadiran (untuk mode create).
  const usedIbadah = useMemo(() => new Set(rows.map((row) => row.id_ibadah)), [rows]);
  const availableOptions: SelectOption[] = useMemo(
    () =>
      ibadahOptions
        .filter((option) => !usedIbadah.has(option.id))
        .map((option) => ({ value: option.id, label: option.label })),
    [ibadahOptions, usedIbadah],
  );

  useEffect(() => {
    if (state.status === "success") {
      gooeyToast.success(state.message ?? "Data kehadiran berhasil disimpan.");
      queueMicrotask(closeDialog);
      router.refresh();
    } else if (state.status === "error" && state.message) {
      gooeyToast.error(state.message);
    }
  }, [router, state]);

  function closeDialog() {
    setMode(null);
    setSelected(null);
  }

  function openDialog(nextMode: DialogMode, row: KehadiranRow | null = null) {
    setSelected(row);
    setMode(nextMode);
  }

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--forest)]">
            Ibadah &amp; informasi
          </p>
          <h1 className="mt-1 text-3xl font-bold text-[var(--ink)]">Kehadiran Jemaat</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
            Catat statistik kehadiran (laki-laki, perempuan, anak) untuk setiap ibadah.
          </p>
        </div>
        <Button
          type="button"
          disabled={availableOptions.length === 0}
          onClick={() => openDialog("create")}
        >
          <Plus size={18} aria-hidden="true" />
          Tambah kehadiran
        </Button>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--paper)] p-10 text-center">
          <ClipboardList aria-hidden="true" className="mx-auto text-[var(--muted)]" size={40} />
          <h2 className="mt-4 text-lg font-semibold">Belum ada data kehadiran</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {ibadahOptions.length === 0
              ? "Tambahkan ibadah terlebih dahulu di menu Agenda & Ibadah."
              : "Tambahkan data kehadiran pertama untuk salah satu ibadah."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--paper)] shadow-sm">
          <table className="table">
            <thead>
              <tr>
                <th>Ibadah</th>
                <th className="text-right">Laki-laki</th>
                <th className="text-right">Perempuan</th>
                <th className="text-right">Anak</th>
                <th className="text-right">Total</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="font-semibold">{row.ibadah}</td>
                  <td className="text-right">{row.laki_laki}</td>
                  <td className="text-right">{row.perempuan}</td>
                  <td className="text-right">{row.anak}</td>
                  <td className="text-right font-bold">{row.total}</td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <Button
                        aria-label={`Edit kehadiran ${row.ibadah}`}
                        size="sm"
                        square
                        type="button"
                        variant="ghost"
                        onClick={() => openDialog("edit", row)}
                      >
                        <Pencil size={16} aria-hidden="true" />
                      </Button>
                      <Button
                        aria-label={`Hapus kehadiran ${row.ibadah}`}
                        className="text-error"
                        size="sm"
                        square
                        type="button"
                        variant="ghost"
                        onClick={() => openDialog("delete", row)}
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
      )}

      {mode && (
        <div
          aria-labelledby="kehadiran-dialog-title"
          aria-modal="true"
          className="modal modal-open"
          role="dialog"
        >
          <div className="modal-box max-w-lg bg-[var(--paper)]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <h2 className="text-xl font-bold" id="kehadiran-dialog-title">
                {mode === "create"
                  ? "Tambah kehadiran"
                  : mode === "edit"
                    ? "Edit kehadiran"
                    : "Hapus kehadiran"}
              </h2>
              <Button aria-label="Tutup dialog" size="sm" square type="button" variant="ghost" onClick={closeDialog}>
                <X size={18} aria-hidden="true" />
              </Button>
            </div>

            {mode === "delete" ? (
              <form action={formAction} className="space-y-5">
                {selected && <input name="id" type="hidden" value={selected.id} />}
                <input name="ringkasan" type="hidden" value={`Total ${selected?.total} jemaat`} />
                <p>
                  Hapus data kehadiran untuk <strong>{selected?.ibadah}</strong>? Tindakan ini tidak
                  dapat dibatalkan.
                </p>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={closeDialog}>
                    Batal
                  </Button>
                  <Button
                    className="btn-error"
                    disabled={pending}
                    loading={pending}
                    type="submit"
                  >
                    {pending ? "Memproses..." : "Hapus"}
                  </Button>
                </div>
              </form>
            ) : (
              <KehadiranForm
                formAction={formAction}
                availableOptions={availableOptions}
                mode={mode}
                pending={pending}
                selected={selected}
                state={state}
                onCancel={closeDialog}
              />
            )}
          </div>
          <button aria-label="Tutup dialog" className="modal-backdrop" type="button" onClick={closeDialog} />
        </div>
      )}
    </>
  );
}
