"use client";

import { useActionState, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputText } from "@/components/ui/input-text";
import {
  createMasterDataAction,
  deleteMasterDataAction,
  updateMasterDataAction,
} from "./actions";
import {
  initialMasterDataActionState,
  type MasterDataActionState,
} from "./schema";

export type MasterDataRow = {
  id: string;
  name: string;
  usageCount: number;
};

type MasterDataManagerProps = {
  description: string;
  emptyMessage: string;
  items: MasterDataRow[];
  resource: "rayon" | "unsur";
  title: string;
};

type DialogMode = "create" | "edit" | "delete" | null;

export function MasterDataManager({
  description,
  emptyMessage,
  items,
  resource,
  title,
}: MasterDataManagerProps) {
  const [mode, setMode] = useState<DialogMode>(null);
  const [selected, setSelected] = useState<MasterDataRow | null>(null);
  const action = mode === "edit"
    ? updateMasterDataAction
    : mode === "delete"
      ? deleteMasterDataAction
      : createMasterDataAction;
  const [state, formAction, pending] = useActionState(async (
    previousState: MasterDataActionState,
    formData: FormData,
  ) => {
    const nextState = await action(previousState, formData);

    if (nextState.status === "success") {
      setMode(null);
      setSelected(null);
    }

    return nextState;
  }, initialMasterDataActionState);

  function openDialog(nextMode: DialogMode, item: MasterDataRow | null = null) {
    setSelected(item);
    setMode(nextMode);
  }

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--forest)]">
            Data master
          </p>
          <h1 className="mt-1 text-3xl font-bold text-[var(--ink)]">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">{description}</p>
        </div>
        <Button type="button" onClick={() => openDialog("create")}>
          <Plus size={18} aria-hidden="true" />
          Tambah {title}
        </Button>
      </header>

      {state.status === "error" && (
        <div className="alert alert-error mb-4" role="alert">
          <span>{state.message}</span>
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--paper)] p-10 text-center text-[var(--muted)]">
          {emptyMessage}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--paper)] shadow-sm">
          <table className="table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Data terkait</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="font-semibold">{item.name}</td>
                  <td>{item.usageCount}</td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <Button
                        aria-label={`Edit ${item.name}`}
                        size="sm"
                        square
                        type="button"
                        variant="ghost"
                        onClick={() => openDialog("edit", item)}
                      >
                        <Pencil size={16} aria-hidden="true" />
                      </Button>
                      <Button
                        aria-label={`Hapus ${item.name}`}
                        className="text-error"
                        size="sm"
                        square
                        type="button"
                        variant="ghost"
                        onClick={() => openDialog("delete", item)}
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
        <div className="modal modal-open" role="dialog" aria-modal="true" aria-labelledby="master-data-dialog-title">
          <div className="modal-box max-w-lg bg-[var(--paper)]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold" id="master-data-dialog-title">
                  {mode === "create" ? `Tambah ${title}` : mode === "edit" ? `Edit ${title}` : `Hapus ${title}`}
                </h2>
                {mode === "delete" && (
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Data yang masih digunakan tidak dapat dihapus.
                  </p>
                )}
              </div>
              <Button
                aria-label="Tutup dialog"
                square
                type="button"
                variant="ghost"
                onClick={() => openDialog(null)}
              >
                <X size={18} aria-hidden="true" />
              </Button>
            </div>

            <form action={formAction} className="space-y-5">
              <input name="resource" type="hidden" value={resource} />
              {selected && <input name="id" type="hidden" value={selected.id} />}
              {mode === "delete" ? (
                <>
                  <input name="name" type="hidden" value={selected?.name ?? ""} />
                  <p>
                    Hapus <strong>{selected?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
                  </p>
                </>
              ) : (
                <InputText
                  autoFocus
                  defaultValue={selected?.name ?? ""}
                  error={state.errors?.name?.[0]}
                  label={`Nama ${title.toLowerCase()}`}
                  name="name"
                  required
                />
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => openDialog(null)}>
                  Batal
                </Button>
                <Button
                  className={mode === "delete" ? "btn-error" : ""}
                  disabled={pending}
                  loading={pending}
                  type="submit"
                >
                  {pending ? "Memproses..." : mode === "delete" ? "Hapus" : "Simpan"}
                </Button>
              </div>
            </form>
          </div>
          <button className="modal-backdrop" type="button" aria-label="Tutup dialog" onClick={() => openDialog(null)} />
        </div>
      )}
    </>
  );
}
