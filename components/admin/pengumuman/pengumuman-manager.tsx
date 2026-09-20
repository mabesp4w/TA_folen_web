"use client";

import { useActionState, useEffect, useState } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { Megaphone, Pencil, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { gooeyToast } from "goey-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { InputText } from "@/components/ui/input-text";
import {
  createPengumumanAction,
  deletePengumumanAction,
  updatePengumumanAction,
} from "./actions";
import { initialPengumumanActionState } from "./schema";

export type PengumumanRow = {
  id: string;
  judul: string;
  isi: string;
  diterbitkan: boolean;
  updatedAt: string;
};

type DialogMode = "create" | "edit" | "delete" | null;

type Props = {
  rows: PengumumanRow[];
  tinyApiKey: string;
};

export function PengumumanManager({ rows, tinyApiKey }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<DialogMode>(null);
  const [selected, setSelected] = useState<PengumumanRow | null>(null);
  const [content, setContent] = useState("");
  const action =
    mode === "edit"
      ? updatePengumumanAction
      : mode === "delete"
        ? deletePengumumanAction
        : createPengumumanAction;
  const [state, formAction, pending] = useActionState(
    action,
    initialPengumumanActionState,
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

  function openDialog(nextMode: DialogMode, row: PengumumanRow | null = null) {
    setSelected(row);
    setContent(row?.isi ?? "");
    setMode(nextMode);
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pengumuman</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
            Kelola informasi yang akan disampaikan kepada jemaat.
          </p>
        </div>
        <Button onClick={() => openDialog("create")}>
          <Plus aria-hidden="true" size={18} /> Tambah pengumuman
        </Button>
      </div>

      {rows.length === 0 ? (
        <section className="mt-6 rounded-2xl border border-dashed border-[var(--line)] bg-[var(--paper)] p-10 text-center">
          <Megaphone
            aria-hidden="true"
            className="mx-auto text-[var(--muted)]"
          />
          <h2 className="mt-4 text-lg font-semibold">Belum ada pengumuman</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Tambahkan pengumuman pertama untuk mulai mengelola informasi jemaat.
          </p>
        </section>
      ) : (
        <section
          aria-label="Daftar pengumuman"
          className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {rows.map((row) => (
            <article
              className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 shadow-sm"
              key={row.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span
                    className={`badge ${row.diterbitkan ? "badge-success" : "badge-ghost"}`}
                  >
                    {row.diterbitkan ? "Diterbitkan" : "Draf"}
                  </span>
                  <h2 className="mt-3 break-words text-lg font-bold">
                    {row.judul}
                  </h2>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Diperbarui {row.updatedAt}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    aria-label={`Edit ${row.judul}`}
                    size="sm"
                    square
                    variant="ghost"
                    onClick={() => openDialog("edit", row)}
                  >
                    <Pencil aria-hidden="true" size={17} />
                  </Button>
                  <Button
                    aria-label={`Hapus ${row.judul}`}
                    size="sm"
                    square
                    variant="ghost"
                    onClick={() => openDialog("delete", row)}
                  >
                    <Trash2 aria-hidden="true" size={17} />
                  </Button>
                </div>
              </div>
              <div
                className="prose prose-sm mt-4 line-clamp-5 max-w-none text-[var(--muted)]"
                dangerouslySetInnerHTML={{ __html: row.isi }}
              />
            </article>
          ))}
        </section>
      )}

      {mode && (
        <div
          aria-labelledby="pengumuman-dialog-title"
          aria-modal="true"
          className="modal modal-open"
          role="dialog"
        >
          <div className="modal-box max-h-[90dvh] w-11/12 max-w-4xl overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl font-bold" id="pengumuman-dialog-title">
                {mode === "create"
                  ? "Tambah pengumuman"
                  : mode === "edit"
                    ? "Edit pengumuman"
                    : "Hapus pengumuman"}
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

            <form action={formAction} className="mt-6 space-y-5">
              {selected && <input name="id" type="hidden" value={selected.id} />}

              {mode === "delete" ? (
                <>
                  <input
                    name="ringkasan"
                    type="hidden"
                    value={selected?.judul ?? ""}
                  />
                  <p>
                    Hapus pengumuman <strong>{selected?.judul}</strong>? Tindakan
                    ini tidak dapat dibatalkan.
                  </p>
                </>
              ) : (
                <>
                  <InputText
                    defaultValue={selected?.judul ?? ""}
                    error={state.errors?.judul?.[0]}
                    label="Judul"
                    name="judul"
                    required
                  />
                  <FormField
                    error={state.errors?.isi?.[0]}
                    id="isi"
                    label="Isi pengumuman"
                  >
                    <input name="isi" type="hidden" value={content} />
                    <div className="overflow-hidden rounded-xl border border-[var(--line)] focus-within:ring-2 focus-within:ring-[var(--pacific)]">
                      <Editor
                        apiKey={tinyApiKey}
                        value={content}
                        onEditorChange={setContent}
                        init={{
                          content_style:
                            "body { font-family: system-ui, sans-serif; font-size: 14px; }",
                          height: 360,
                          menubar: false,
                          plugins: "autolink link lists",
                          toolbar:
                            "undo redo | blocks | bold italic underline strikethrough | bullist numlist blockquote | link | removeformat",
                        }}
                      />
                    </div>
                  </FormField>
                  <Checkbox
                    defaultChecked={selected?.diterbitkan ?? false}
                    label="Terbitkan pengumuman"
                    name="diterbitkan"
                  />
                </>
              )}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => openDialog(null)}
                >
                  Batal
                </Button>
                <Button
                  className={mode === "delete" ? "btn-error" : ""}
                  disabled={pending}
                  loading={pending}
                  type="submit"
                >
                  {pending
                    ? "Memproses..."
                    : mode === "delete"
                      ? "Hapus"
                      : "Simpan"}
                </Button>
              </div>
            </form>
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
