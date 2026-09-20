"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Images, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { gooeyToast } from "goey-toast";
import Resizer from "react-image-file-resizer";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { Button } from "@/components/ui/button";
import { InputText } from "@/components/ui/input-text";
import {
  createAlbumAction,
  deleteAlbumAction,
  deletePhotoAction,
  updateAlbumAction,
} from "./actions";
import { initialGaleriActionState } from "./schema";

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
};

type DialogMode = "create" | "edit" | "delete" | null;

type PendingPhoto = { id: string; file: File; preview: string };

const MAX_PHOTOS = 30;

// Skala turun agar sisi terpanjang maksimal 1920px dengan mempertahankan rasio,
// lalu konversi ke WebP di sisi klien (konsisten dengan pengelolaan slide).
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

export function GaleriManager({ rows }: GaleriManagerProps) {
  const router = useRouter();
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [selected, setSelected] = useState<GaleriAlbumRow | null>(null);
  const [lightbox, setLightbox] = useState<{ album: GaleriAlbumRow; index: number } | null>(null);
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
    setSelected(null);
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

  // Setelah refresh data, samakan album terpilih dengan baris terbaru agar daftar
  // foto pada dialog edit ikut ter-update ketika ada foto yang dihapus.
  useEffect(() => {
    setSelected((current) => (current ? rows.find((row) => row.id === current.id) ?? current : current));
  }, [rows]);

  function openDialog(mode: DialogMode, album: GaleriAlbumRow | null = null) {
    resetPhotos();
    setSelected(album);
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
        <Button type="button" onClick={() => openDialog("create")}>
          <Plus aria-hidden="true" size={18} />
          Tambah album
        </Button>
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
              <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-base-200 pt-4">
                <Button type="button" variant="ghost" onClick={() => openDialog("edit", album)}>
                  <Pencil aria-hidden="true" size={17} />
                  Edit
                </Button>
                <Button type="button" variant="ghost" onClick={() => openDialog("delete", album)}>
                  <Trash2 aria-hidden="true" size={17} />
                  Hapus
                </Button>
              </div>
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

            {/* Foto tersimpan pada mode edit — form hapus terpisah agar tidak
                bersarang di dalam form utama. */}
            {dialog === "edit" && existingFoto.length > 0 ? (
              <div className="mt-6">
                <p className="mb-2 text-sm font-medium text-base-content">
                  Foto tersimpan ({existingFoto.length})
                </p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {existingFoto.map((foto, index) => (
                    <div className="group relative aspect-square overflow-hidden rounded-xl bg-base-200" key={foto.id}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt={foto.caption ?? `Foto ${index + 1}`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        src={foto.url}
                      />
                      <form action={deletePhotoFormAction} className="absolute right-1 top-1">
                        <input name="id" type="hidden" value={foto.id} />
                        <button
                          aria-label={`Hapus foto ${index + 1}`}
                          className="btn btn-circle btn-xs btn-error focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                          type="submit"
                        >
                          <X aria-hidden="true" size={14} />
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <form action={formAction} className="mt-6 space-y-5" onSubmit={handleSubmit}>
              {selected ? <input name="id" type="hidden" value={selected.id} /> : null}
              {dialog === "delete" ? (
                <div className="rounded-xl border border-error/30 bg-error/10 p-4 text-sm">
                  Hapus album <strong>{selected?.judul}</strong> beserta {selected?.foto.length ?? 0} foto?
                </div>
              ) : (
                <>
                  <InputText
                    defaultValue={selected?.judul ?? ""}
                    error={state.errors?.judul?.[0]}
                    label="Judul album"
                    name="judul"
                    placeholder="Contoh: Ibadah Natal 2026"
                    required
                  />
                  <div className="grid gap-5 sm:grid-cols-2">
                    <InputText
                      defaultValue={selected?.kategori ?? ""}
                      error={state.errors?.kategori?.[0]}
                      label="Kategori"
                      name="kategori"
                      placeholder="Contoh: Ibadah"
                    />
                    <InputText
                      defaultValue={String(selected?.order ?? rows.length)}
                      error={state.errors?.order?.[0]}
                      label="Urutan"
                      min="0"
                      name="order"
                      type="number"
                    />
                  </div>
                  <label className="form-control w-full">
                    <span className="label-text mb-2 font-medium">Tanggal kegiatan</span>
                    <input
                      aria-describedby={state.errors?.tgl?.[0] ? "tgl-error" : undefined}
                      aria-invalid={Boolean(state.errors?.tgl?.[0])}
                      className="input input-bordered w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pacific)]"
                      defaultValue={selected?.tgl ?? ""}
                      name="tgl"
                      type="date"
                    />
                    {state.errors?.tgl?.[0] ? (
                      <span className="mt-1 text-sm text-error" id="tgl-error">
                        {state.errors.tgl[0]}
                      </span>
                    ) : null}
                  </label>
                  <label className="form-control w-full">
                    <span className="label-text mb-2 font-medium">Keterangan</span>
                    <textarea
                      className="textarea textarea-bordered min-h-28 w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pacific)]"
                      defaultValue={selected?.keterangan ?? ""}
                      name="keterangan"
                      placeholder="Deskripsi singkat album"
                    />
                    {state.errors?.keterangan?.[0] ? (
                      <span className="mt-1 text-sm text-error">{state.errors.keterangan[0]}</span>
                    ) : null}
                  </label>
                  <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-base-300 px-4 py-3">
                    <input
                      className="checkbox checkbox-primary"
                      defaultChecked={selected?.status ?? true}
                      name="status"
                      type="checkbox"
                    />
                    <span>
                      <span className="block font-medium">Tampilkan album</span>
                      <span className="block text-sm text-base-content/60">Album dapat ditampilkan pada galeri publik.</span>
                    </span>
                  </label>

                  <div>
                    <span className="label-text mb-2 block font-medium">
                      {dialog === "create" ? "Foto album" : "Tambah foto"}
                    </span>
                    <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-base-300 p-5 text-center focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--pacific)]">
                      <Upload aria-hidden="true" className="text-[var(--pacific)]" size={26} />
                      <span className="text-sm text-base-content/70">
                        {converting
                          ? "Memproses gambar..."
                          : "Klik untuk memilih foto (bisa banyak, otomatis dikonversi ke WebP)"}
                      </span>
                      <span className="text-xs text-base-content/50">Maksimal {MAX_PHOTOS} foto per unggahan.</span>
                      <input
                        accept="image/*"
                        className="hidden"
                        disabled={converting}
                        multiple
                        onChange={handlePhotosChange}
                        type="file"
                      />
                    </label>
                    {/* Berkas terkonversi disisipkan ke input ini saat submit. */}
                    <input aria-hidden="true" className="hidden" name="photos" tabIndex={-1} type="file" multiple />

                    {photos.length > 0 ? (
                      <div className="mt-3">
                        <p className="mb-2 text-sm text-base-content/70">
                          {photos.length} foto siap diunggah
                        </p>
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                          {photos.map((photo, index) => (
                            <div className="group relative aspect-square overflow-hidden rounded-xl bg-base-200" key={photo.id}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                alt={`Pratinjau foto ${index + 1}`}
                                className="h-full w-full object-cover"
                                src={photo.preview}
                              />
                              <button
                                aria-label={`Hapus pilihan foto ${index + 1}`}
                                className="btn btn-circle btn-xs btn-error absolute right-1 top-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                                type="button"
                                onClick={() => removePhoto(photo.id)}
                              >
                                <X aria-hidden="true" size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="mt-3 flex items-center gap-2 text-xs text-base-content/50">
                        <ImagePlus aria-hidden="true" size={15} />
                        Belum ada foto dipilih.
                      </p>
                    )}
                  </div>
                </>
              )}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="ghost" onClick={closeDialog}>
                  Batal
                </Button>
                <Button
                  className={dialog === "delete" ? "btn-error" : ""}
                  disabled={pending || converting}
                  loading={pending}
                  type="submit"
                >
                  {pending ? "Memproses..." : dialog === "delete" ? "Hapus album" : "Simpan album"}
                </Button>
              </div>
            </form>
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
