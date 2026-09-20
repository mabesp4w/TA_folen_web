"use client";

import { useActionState, useEffect, useState } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { BookOpenText, Pencil, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { gooeyToast } from "goey-toast";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { FormField } from "@/components/ui/form-field";
import { InputText } from "@/components/ui/input-text";
import {
  createRenunganAction,
  deleteRenunganAction,
  updateRenunganAction,
} from "./actions";
import { initialRenunganActionState } from "./schema";

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

type DialogMode = "create" | "edit" | "delete" | null;

type Props = {
  rows: RenunganRow[];
  tinyApiKey: string;
};

export function RenunganManager({ rows, tinyApiKey }: Props) {
  const router = useRouter();
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
        <Button onClick={() => openDialog("create")}>
          <Plus aria-hidden="true" size={18} /> Tambah renungan
        </Button>
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
                    Hapus renungan <strong>{selected?.judul}</strong>? Tindakan ini
                    tidak dapat dibatalkan.
                  </p>
                </>
              ) : (
                <>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <InputText
                      defaultValue={selected?.judul ?? ""}
                      error={state.errors?.judul?.[0]}
                      label="Judul"
                      name="judul"
                      required
                    />
                    <DatePicker
                      defaultValue={selected?.tanggal ?? new Date().toISOString().slice(0, 10)}
                      error={state.errors?.tgl_publish?.[0]}
                      label="Tanggal terbit"
                      name="tgl_publish"
                      required
                    />
                    <InputText
                      defaultValue={selected?.bacaan ?? ""}
                      error={state.errors?.bacaan?.[0]}
                      label="Bacaan Alkitab"
                      name="bacaan"
                    />
                    <InputText
                      defaultValue={selected?.sumber ?? ""}
                      error={state.errors?.sumber?.[0]}
                      label="Sumber"
                      name="sumber"
                    />
                  </div>
                  <FormField
                    error={state.errors?.kutipan?.[0]}
                    id="kutipan"
                    label="Kutipan"
                  >
                    <textarea
                      className="textarea textarea-bordered min-h-24 w-full"
                      defaultValue={selected?.kutipan ?? ""}
                      id="kutipan"
                      name="kutipan"
                    />
                  </FormField>
                  <FormField
                    error={state.errors?.isi?.[0]}
                    id="isi"
                    label="Isi renungan"
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
                </>
              )}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
