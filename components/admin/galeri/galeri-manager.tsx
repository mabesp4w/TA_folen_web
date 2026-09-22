"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Images, Pencil, Plus, Trash2, X } from "lucide-react";
import { gooeyToast } from "goey-toast";
import Resizer from "react-image-file-resizer";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { Button } from "@/components/ui/button";
import {
  createAlbumAction,
  deleteAlbumAction,
  deletePhotoAction,
  updateAlbumAction,
} from "./actions";
import { GaleriForm } from "./galeri-form";
import { initialGaleriActionState } from "./schema";
import type { ResourcePermission } from "@/lib/permissions";

// Izin default penuh — dipakai bila prop tidak diberikan (mis. ADMIN).
const FULL_PERMISSION: ResourcePermission = {
  view: true,
  create: true,
  update: true,
  delete: true,
};

export type GaleriFotoRow = {
  id: string;
  url: string;
  caption: string | null;
  order: number;
};

export type GaleriAlbumRow = {
  id: string;
  judul: string;
  keterangan: string | null;
  kategori: string | null;
  tgl: string | null;
  status: boolean;
  order: number;
  foto: GaleriFotoRow[];
};

type GaleriManagerProps = {
  rows: GaleriAlbumRow[];
  permission?: ResourcePermission;
};

type DialogMode = "create" | "edit" | "delete" | null;

export type PendingPhoto = { id: string; file: File; preview: string };

const MAX_PHOTOS = 30;

// Skala turun agar sisi terpanjang maksimal 1920px dengan mempertahankan rasio,
// lalu konversi ke WebP di sisi klien.
function resizeToWebp(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    Resizer.imageFileResizer(
      file,
      1920,
      1920,
      "WEBP",
      82,
      0,
      (value) => {
        if (value instanceof File) resolve(value);
        else if (value instanceof Blob) resolve(new File([value], "foto.webp", { type: "image/webp" }));
        else reject(new Error("Gagal mengonversi gambar."));
      },
      "file",
    );
  });
}

export function GaleriManager({
  rows,
  permission = FULL_PERMISSION,
}: GaleriManagerProps) {
  const router = useRouter();
  const canModify = permission.update || permission.delete;
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ album: GaleriAlbumRow; index: number } | null>(null);

  // Album terpilih diturunkan dari `rows` berdasarkan id, sehingga otomatis
  // tersinkron dengan data terbaru (mis. setelah foto dihapus) tanpa efek.
  const selected = selectedId
    ? rows.find((row) => row.id === selectedId) ?? null
    : null;
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [converting, setConverting] = useState(false);

  const action =
    dialog === "edit"
      ? updateAlbumAction
      : dialog === "delete"
        ? deleteAlbumAction
        : createAlbumAction;
  const [state, formAction, pending] = useActionState(action, initialGaleriActionState);
  const [deleteState, deletePhotoFormAction] = useActionState(
    deletePhotoAction,
    initialGaleriActionState,
  );

  function resetPhotos() {
    setPhotos((current) => {
      current.forEach((photo) => URL.revokeObjectURL(photo.preview));
      return [];
    });
    setConverting(false);
  }

  function closeDialog() {
    setDialog(null);
    setSelectedId(null);
    resetPhotos();
  }

  useEffect(() => {
    if (state.status === "success") {
      gooeyToast.success(state.message ?? "Data galeri berhasil disimpan.");
      queueMicrotask(() => closeDialog());
      router.refresh();
    } else if (state.status === "error") {
      gooeyToast.error(state.message ?? "Data galeri gagal diproses.");
    }
    // closeDialog identitasnya stabil untuk keperluan efek ini.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, state]);

  useEffect(() => {
    if (deleteState.status === "success") {
      gooeyToast.success(deleteState.message ?? "Foto berhasil dihapus.");
      router.refresh();
    } else if (deleteState.status === "error" && deleteState.message) {
      gooeyToast.error(deleteState.message);
    }
  }, [router, deleteState]);

  function openDialog(mode: DialogMode, album: GaleriAlbumRow | null = null) {
    resetPhotos();
    setSelectedId(album?.id ?? null);
    setDialog(mode);
  }

  async function handlePhotosChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;
    setConverting(true);
    try {
      const converted: PendingPhoto[] = [];
      for (const file of files) {
        if (!file.type.startsWith("image/")) continue;
        const webp = await resizeToWebp(file);
        converted.push({
          id: crypto.randomUUID(),
          file: webp,
          preview: URL.createObjectURL(webp),
        });
      }
      if (converted.length === 0) {
        gooeyToast.error("Tidak ada gambar yang valid dipilih.");
        return;
      }
      setPhotos((current) => {
        const merged = [...current, ...converted];
        if (merged.length > MAX_PHOTOS) {
          gooeyToast.error(`Maksimal ${MAX_PHOTOS} foto per unggahan.`);
          merged.slice(MAX_PHOTOS).forEach((photo) => URL.revokeObjectURL(photo.preview));
          return merged.slice(0, MAX_PHOTOS);
        }
        return merged;
      });
    } catch {
      gooeyToast.error("Gagal memproses sebagian gambar. Coba berkas lain.");
    } finally {
      setConverting(false);
    }
  }

  function removePhoto(id: string) {
    setPhotos((current) => {
      const found = current.find((photo) => photo.id === id);
      if (found) URL.revokeObjectURL(found.preview);
      return current.filter((photo) => photo.id !== id);
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (dialog === "delete") return;
    const form = event.currentTarget;
    const transfer = new DataTransfer();
    photos.forEach((photo) => transfer.items.add(photo.file));
    const input = form.elements.namedItem("photos") as HTMLInputElement | null;
    if (input) input.files = transfer.files;
  }

  const existingFoto = dialog === "edit" ? selected?.foto ?? [] : [];

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--pacific)]">Media gereja</p>
          <h1 className="mt-1 text-2xl font-bold text-base-content sm:text-3xl">Galeri</h1>
          <p className="mt-2 max-w-2xl text-sm text-base-content/65">
            Kelola album dan dokumentasi kegiatan gereja.
          </p>
        </div>
        {permission.create && (
          <Button type="button" onClick={() => openDialog("create")}>
            <Plus aria-hidden="true" size={18} />
            Tambah album
          </Button>
        )}
      </header>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-base-300 bg-base-100 px-6 py-16 text-center shadow-sm">
          <Images aria-hidden="true" className="mx-auto text-base-content/35" size={42} />
          <h2 className="mt-4 text-lg font-semibold text-base-content">Belum ada album</h2>
          <p className="mt-2 text-sm text-base-content/60">
            Tambahkan album pertama untuk mulai mengelola dokumentasi kegiatan.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((album) => (
            <article
              className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm"
              key={album.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-base-content">
                    {album.judul}
                  </h2>
                  <p className="mt-1 text-sm text-base-content/60">
                    {album.foto.length} foto
                  </p>
                </div>
                <span className={`badge ${album.status ? "badge-success" : "badge-ghost"}`}>
                  {album.status ? "Tampil" : "Disembunyikan"}
                </span>
              </div>
              {album.keterangan ? (
                <p className="mt-4 line-clamp-3 text-sm leading-6 text-base-content/70">
                  {album.keterangan}
                </p>
              ) : null}
              {album.foto.length > 0 ? (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {album.foto.slice(0, 6).map((foto, index) => (
                    <button
                      aria-label={`Lihat foto ${index + 1} dari album ${album.judul}`}
                      className="relative aspect-square overflow-hidden rounded-xl bg-base-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pacific)]"
                      key={foto.id}
                      type="button"
                      onClick={() => setLightbox({ album, index })}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt={foto.caption ?? `Foto ${index + 1} album ${album.judul}`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        src={foto.url}
                      />
                      {index === 5 && album.foto.length > 6 ? (
                        <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-sm font-semibold text-white">
                          +{album.foto.length - 6}
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              ) : null}
              {canModify && (
                <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-base-200 pt-4">
                  {permission.update && (
                    <Button type="button" variant="ghost" onClick={() => openDialog("edit", album)}>
                      <Pencil aria-hidden="true" size={17} />
                      Edit
                    </Button>
                  )}
                  {permission.delete && (
                    <Button type="button" variant="ghost" onClick={() => openDialog("delete", album)}>
                      <Trash2 aria-hidden="true" size={17} />
                      Hapus
                    </Button>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {dialog ? (
        <div className="modal modal-open" role="dialog" aria-modal="true" aria-labelledby="galeri-dialog-title">
          <div className="modal-box max-h-[90dvh] max-w-2xl overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold" id="galeri-dialog-title">
                  {dialog === "create" ? "Tambah album" : dialog === "edit" ? "Edit album" : "Hapus album"}
                </h2>
                <p className="mt-1 text-sm text-base-content/60">
                  {dialog === "delete"
                    ? "Album dan seluruh foto di dalamnya akan dihapus permanen."
                    : "Lengkapi informasi album dan tambahkan foto dokumentasi."}
                </p>
              </div>
              <Button aria-label="Tutup dialog" type="button" variant="ghost" onClick={closeDialog}>
                <X aria-hidden="true" size={19} />
              </Button>
            </div>

            <GaleriForm
              converting={converting}
              deletePhotoFormAction={deletePhotoFormAction}
              dialog={dialog}
              existingFoto={existingFoto}
              formAction={formAction}
              maxPhotos={MAX_PHOTOS}
              pending={pending}
              permission={permission}
              photos={photos}
              rows={rows}
              selected={selected}
              state={state}
              onClose={closeDialog}
              onPhotosChange={handlePhotosChange}
              onRemovePhoto={removePhoto}
              onSubmit={handleSubmit}
            />
          </div>
          <button aria-label="Tutup dialog" className="modal-backdrop" type="button" onClick={closeDialog} />
        </div>
      ) : null}

      <Lightbox
        close={() => setLightbox(null)}
        index={lightbox?.index ?? 0}
        open={Boolean(lightbox)}
        slides={(lightbox?.album.foto ?? []).map((foto) => ({
          src: foto.url,
          alt: foto.caption ?? lightbox?.album.judul,
          title: foto.caption ?? undefined,
        }))}
      />
    </section>
  );
}
