"use client";

import { useActionState, useEffect, useState } from "react";
import { BookOpenText, Pencil, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { gooeyToast } from "goey-toast";
import { Button } from "@/components/ui/button";
import {
  createRenunganAction,
  deleteRenunganAction,
  updateRenunganAction,
} from "./actions";
import { RenunganForm } from "./renungan-form";
import { initialRenunganActionState } from "./schema";
import type { ResourcePermission } from "@/lib/permissions";

export type RenunganRow = {
  id: string;
  judul: string;
  bacaan: string | null;
  kutipan: string | null;
  isi: string;
  sumber: string | null;
  tanggal: string;
  tanggalLabel: string;
};

const FULL_PERMISSION: ResourcePermission = {
  view: true,
  create: true,
  update: true,
  delete: true,
};

type DialogMode = "create" | "edit" | "delete" | null;

type Props = {
  rows: RenunganRow[];
  tinyApiKey: string;
  permission?: ResourcePermission;
};

export function RenunganManager({ rows, tinyApiKey, permission = FULL_PERMISSION }: Props) {
  const router = useRouter();
  const canModify = permission.update || permission.delete;
  const [mode, setMode] = useState<DialogMode>(null);
  const [selected, setSelected] = useState<RenunganRow | null>(null);
  const [content, setContent] = useState("");
  const action =
    mode === "edit"
      ? updateRenunganAction
      : mode === "delete"
        ? deleteRenunganAction
        : createRenunganAction;
  const [state, formAction, pending] = useActionState(
    action,
    initialRenunganActionState,
  );

  useEffect(() => {
    if (state.status === "success") {
      gooeyToast.success(state.message ?? "Data berhasil disimpan.");
      queueMicrotask(() => setMode(null));
      router.refresh();
    } else if (state.status === "error" && state.message) {
      gooeyToast.error(state.message);
    }
  }, [router, state]);

  function openDialog(nextMode: DialogMode, row: RenunganRow | null = null) {
    setSelected(row);
    setContent(row?.isi ?? "");
    setMode(nextMode);
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Renungan</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
            Kelola renungan harian yang disampaikan kepada jemaat.
          </p>
        </div>
        {permission.create && (
          <Button onClick={() => openDialog("create")}>
            <Plus aria-hidden="true" size={18} /> Tambah renungan
          </Button>
        )}
      </div>

      {rows.length === 0 ? (
        <section className="mt-6 rounded-2xl border border-dashed border-[var(--line)] bg-[var(--paper)] p-10 text-center">
          <BookOpenText aria-hidden="true" className="mx-auto text-[var(--muted)]" />
          <h2 className="mt-4 text-lg font-semibold">Belum ada renungan</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Tambahkan renungan pertama untuk mulai mengelola bacaan harian.
          </p>
        </section>
      ) : (
        <section
          aria-label="Daftar renungan"
          className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {rows.map((row) => (
            <article
              className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 shadow-sm"
              key={row.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                    {row.tanggalLabel}
                  </p>
                  <h2 className="mt-2 break-words text-lg font-bold">{row.judul}</h2>
                  {row.bacaan && (
                    <p className="mt-1 text-sm font-medium text-[var(--forest)]">
                      {row.bacaan}
                    </p>
                  )}
                </div>
                {canModify && (
                  <div className="flex shrink-0 gap-1">
                    {permission.update && (
                      <Button
                        aria-label={`Edit ${row.judul}`}
                        size="sm"
                        square
                        variant="ghost"
                        onClick={() => openDialog("edit", row)}
                      >
                        <Pencil aria-hidden="true" size={17} />
                      </Button>
                    )}
                    {permission.delete && (
                      <Button
                        aria-label={`Hapus ${row.judul}`}
                        size="sm"
                        square
                        variant="ghost"
                        onClick={() => openDialog("delete", row)}
                      >
                        <Trash2 aria-hidden="true" size={17} />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {row.kutipan && (
                <blockquote className="mt-4 border-l-2 border-[var(--gold)] pl-3 text-sm italic text-[var(--muted)]">
                  {row.kutipan}
                </blockquote>
              )}
              <div
                className="prose prose-sm mt-4 line-clamp-5 max-w-none text-[var(--muted)]"
                dangerouslySetInnerHTML={{ __html: row.isi }}
              />
              {row.sumber && (
                <p className="mt-4 text-xs text-[var(--muted)]">Sumber: {row.sumber}</p>
              )}
            </article>
          ))}
        </section>
      )}

      {mode && (
        <div
          aria-labelledby="renungan-dialog-title"
          aria-modal="true"
          className="modal modal-open"
          role="dialog"
        >
          <div className="modal-box max-h-[90dvh] w-11/12 max-w-4xl overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl font-bold" id="renungan-dialog-title">
                {mode === "create"
                  ? "Tambah renungan"
                  : mode === "edit"
                    ? "Edit renungan"
                    : "Hapus renungan"}
              </h2>
              <Button
                aria-label="Tutup dialog"
                size="sm"
                square
                type="button"
                variant="ghost"
                onClick={() => openDialog(null)}
              >
                <X aria-hidden="true" size={18} />
              </Button>
            </div>

            {mode === "delete" ? (
              <form action={formAction} className="mt-6 space-y-5">
                {selected && <input name="id" type="hidden" value={selected.id} />}
                <input
                  name="ringkasan"
                  type="hidden"
                  value={selected?.judul ?? ""}
                />
                <p>
                  Hapus renungan <strong>{selected?.judul}</strong>? Tindakan ini
                  tidak dapat dibatalkan.
                </p>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="ghost" onClick={() => openDialog(null)}>
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
              <RenunganForm
                content={content}
                formAction={formAction}
                pending={pending}
                selected={selected}
                state={state}
                tinyApiKey={tinyApiKey}
                onCancel={() => openDialog(null)}
                onContentChange={setContent}
              />
            )}
          </div>
          <button
            aria-label="Tutup dialog"
            className="modal-backdrop"
            type="button"
            onClick={() => openDialog(null)}
          />
        </div>
      )}
    </>
  );
}
