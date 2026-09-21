"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  GalleryHorizontalEnd,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { gooeyToast } from "goey-toast";
import Resizer from "react-image-file-resizer";
import { Button } from "@/components/ui/button";
import {
  createSlideAction,
  deleteSlideAction,
  moveSlideAction,
  updateSlideAction,
} from "./actions";
import { SlideForm } from "./slide-form";
import { initialSlideActionState } from "./schema";

export type SlideRow = {
  id: string;
  order: number;
  url: string;
  judul: string | null;
  teks: string | null;
  link_url: string | null;
  link_teks: string | null;
  status: boolean;
};

type DialogMode = "create" | "edit" | "delete" | null;

type Props = {
  rows: SlideRow[];
};

function resizeToWebp(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    Resizer.imageFileResizer(
      file,
      1920,
      1080,
      "WEBP",
      82,
      0,
      (value) => {
        if (value instanceof File) resolve(value);
        else if (value instanceof Blob) resolve(new File([value], "slide.webp", { type: "image/webp" }));
        else reject(new Error("Gagal mengonversi gambar."));
      },
      "file",
    );
  });
}

export function SlideManager({ rows }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<DialogMode>(null);
  const [selected, setSelected] = useState<SlideRow | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const webpRef = useRef<File | null>(null);

  const action =
    mode === "edit"
      ? updateSlideAction
      : mode === "delete"
        ? deleteSlideAction
        : createSlideAction;
  const [state, formAction, pending] = useActionState(action, initialSlideActionState);
  const [moveState, moveAction] = useActionState(moveSlideAction, initialSlideActionState);

  useEffect(() => {
    if (state.status === "success") {
      gooeyToast.success(state.message ?? "Data slide berhasil disimpan.");
      queueMicrotask(() => closeDialog());
      router.refresh();
    } else if (state.status === "error" && state.message) {
      gooeyToast.error(state.message);
    }
  }, [router, state]);

  useEffect(() => {
    if (moveState.status === "success") {
      gooeyToast.success(moveState.message ?? "Urutan diperbarui.");
      router.refresh();
    } else if (moveState.status === "error" && moveState.message) {
      gooeyToast.error(moveState.message);
    }
  }, [router, moveState]);

  function closeDialog() {
    setMode(null);
    setSelected(null);
    setPreview(null);
    setConverting(false);
    webpRef.current = null;
  }

  function openDialog(nextMode: DialogMode, row: SlideRow | null = null) {
    setSelected(row);
    setPreview(row?.url ?? null);
    webpRef.current = null;
    setMode(nextMode);
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      gooeyToast.error("Berkas harus berupa gambar.");
      event.target.value = "";
      return;
    }
    setConverting(true);
    try {
      const webp = await resizeToWebp(file);
      webpRef.current = webp;
      setPreview((current) => {
        if (current?.startsWith("blob:")) URL.revokeObjectURL(current);
        return URL.createObjectURL(webp);
      });
    } catch {
      gooeyToast.error("Gagal memproses gambar. Coba berkas lain.");
    } finally {
      setConverting(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (mode === "delete") return;
    if (mode === "create" && !webpRef.current) {
      event.preventDefault();
      gooeyToast.error("Gambar slide wajib diunggah.");
      return;
    }
    const form = event.currentTarget;
    const dt = new DataTransfer();
    if (webpRef.current) dt.items.add(webpRef.current);
    const input = form.elements.namedItem("image") as HTMLInputElement | null;
    if (input) input.files = dt.files;
  }

  function move(row: SlideRow, direction: "up" | "down") {
    const fd = new FormData();
    fd.set("id", row.id);
    fd.set("direction", direction);
    moveAction(fd);
  }

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--forest)]">
            Publikasi
          </p>
          <h1 className="mt-1 text-3xl font-bold text-[var(--ink)]">Slide Beranda</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
            Kelola gambar carousel beranda beserta judul, teks, dan tombol tautannya.
          </p>
        </div>
        <Button type="button" onClick={() => openDialog("create")}>
          <Plus size={18} aria-hidden="true" />
          Tambah slide
        </Button>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--paper)] p-10 text-center">
          <GalleryHorizontalEnd aria-hidden="true" className="mx-auto text-[var(--muted)]" size={40} />
          <h2 className="mt-4 text-lg font-semibold">Belum ada slide</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Tambahkan slide pertama untuk mengisi carousel beranda.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((row, index) => (
            <article
              className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper)] shadow-sm"
              key={row.id}
            >
              <div className="relative aspect-video bg-base-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={row.judul ?? `Slide ${row.order}`}
                  className="h-full w-full object-cover"
                  src={row.url}
                />
                <span className="absolute left-3 top-3 badge badge-neutral">#{row.order}</span>
                <span
                  className={`absolute right-3 top-3 badge ${row.status ? "badge-success" : "badge-ghost"}`}
                >
                  {row.status ? "Tampil" : "Disembunyikan"}
                </span>
              </div>
              <div className="p-5">
                <h2 className="truncate font-bold text-[var(--ink)]">
                  {row.judul ?? <span className="text-[var(--muted)]">Tanpa judul</span>}
                </h2>
                {row.teks ? (
                  <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">{row.teks}</p>
                ) : null}
                {row.link_teks ? (
                  <p className="mt-2 text-xs text-[var(--pacific)]">
                    Tombol: {row.link_teks} → {row.link_url ?? "-"}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] pt-4">
                  <div className="flex gap-1">
                    <Button
                      aria-label={`Naikkan urutan slide ${row.order}`}
                      disabled={index === 0}
                      size="sm"
                      square
                      type="button"
                      variant="ghost"
                      onClick={() => move(row, "up")}
                    >
                      <ArrowUp size={16} aria-hidden="true" />
                    </Button>
                    <Button
                      aria-label={`Turunkan urutan slide ${row.order}`}
                      disabled={index === rows.length - 1}
                      size="sm"
                      square
                      type="button"
                      variant="ghost"
                      onClick={() => move(row, "down")}
                    >
                      <ArrowDown size={16} aria-hidden="true" />
                    </Button>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      aria-label={`Edit slide ${row.order}`}
                      size="sm"
                      square
                      type="button"
                      variant="ghost"
                      onClick={() => openDialog("edit", row)}
                    >
                      <Pencil size={16} aria-hidden="true" />
                    </Button>
                    <Button
                      aria-label={`Hapus slide ${row.order}`}
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
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {mode && (
        <div
          aria-labelledby="slide-dialog-title"
          aria-modal="true"
          className="modal modal-open"
          role="dialog"
        >
          <div className="modal-box max-h-[90dvh] w-11/12 max-w-2xl overflow-y-auto bg-[var(--paper)]">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl font-bold" id="slide-dialog-title">
                {mode === "create" ? "Tambah slide" : mode === "edit" ? "Edit slide" : "Hapus slide"}
              </h2>
              <Button aria-label="Tutup dialog" size="sm" square type="button" variant="ghost" onClick={closeDialog}>
                <X size={18} aria-hidden="true" />
              </Button>
            </div>

            {mode === "delete" ? (
              <form action={formAction} className="mt-6 space-y-5" onSubmit={handleSubmit}>
                {selected && <input name="id" type="hidden" value={selected.id} />}
                <div className="rounded-xl border border-error/30 bg-error/10 p-4 text-sm">
                  Hapus slide <strong>#{selected?.order}</strong>
                  {selected?.judul ? ` (${selected.judul})` : ""}? Urutan slide setelahnya akan digeser
                  otomatis.
                </div>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="ghost" onClick={closeDialog}>
                    Batal
                  </Button>
                  <Button
                    className="btn-error"
                    disabled={pending || converting}
                    loading={pending}
                    type="submit"
                  >
                    {pending ? "Memproses..." : "Hapus slide"}
                  </Button>
                </div>
              </form>
            ) : (
              <SlideForm
                converting={converting}
                formAction={formAction}
                mode={mode}
                pending={pending}
                preview={preview}
                selected={selected}
                state={state}
                onCancel={closeDialog}
                onFileChange={handleFileChange}
                onSubmit={handleSubmit}
              />
            )}
          </div>
          <button aria-label="Tutup dialog" className="modal-backdrop" type="button" onClick={closeDialog} />
        </div>
      )}
    </>
  );
}
