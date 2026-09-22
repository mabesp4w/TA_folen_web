"use client";

import { ImagePlus, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputText } from "@/components/ui/input-text";
import type {
  GaleriAlbumRow,
  GaleriFotoRow,
  PendingPhoto,
} from "./galeri-manager";
import type { GaleriActionState } from "./schema";
import type { ResourcePermission } from "@/lib/permissions";

// Izin default penuh — dipakai bila prop tidak diberikan (mis. ADMIN).
const FULL_PERMISSION: ResourcePermission = {
  view: true,
  create: true,
  update: true,
  delete: true,
};

type GaleriFormProps = {
  converting: boolean;
  deletePhotoFormAction: (payload: FormData) => void;
  dialog: "create" | "edit" | "delete";
  existingFoto: GaleriFotoRow[];
  formAction: (payload: FormData) => void;
  maxPhotos: number;
  pending: boolean;
  permission?: ResourcePermission;
  photos: PendingPhoto[];
  rows: GaleriAlbumRow[];
  selected: GaleriAlbumRow | null;
  state: GaleriActionState;
  onClose: () => void;
  onPhotosChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: (id: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export function GaleriForm({
  converting,
  deletePhotoFormAction,
  dialog,
  existingFoto,
  formAction,
  maxPhotos,
  pending,
  permission = FULL_PERMISSION,
  photos,
  rows,
  selected,
  state,
  onClose,
  onPhotosChange,
  onRemovePhoto,
  onSubmit,
}: GaleriFormProps) {
  return (
    <>
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
                {permission.delete && (
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
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <form action={formAction} className="mt-6 space-y-5" onSubmit={onSubmit}>
        {selected ? <input name="id" type="hidden" value={selected.id} /> : null}
        {dialog === "delete" ? (
          <div className="rounded-xl border border-error/30 bg-error/10 p-4 text-sm">
            Hapus album <strong>{selected?.judul}</strong> beserta {selected?.foto.length ?? 0} foto?
          </div>
        ) : (
          <div className="grid grid-cols-8 gap-x-6 gap-y-4">
            <div className="col-span-8">
              <InputText
                defaultValue={selected?.judul ?? ""}
                error={state.errors?.judul?.[0]}
                label="Judul album"
                name="judul"
                placeholder="Contoh: Ibadah Natal 2026"
                required
              />
            </div>
            <div className="col-span-8 sm:col-span-4">
              <InputText
                defaultValue={selected?.kategori ?? ""}
                error={state.errors?.kategori?.[0]}
                label="Kategori"
                name="kategori"
                placeholder="Contoh: Ibadah"
              />
            </div>
            <div className="col-span-8 sm:col-span-4">
              <InputText
                defaultValue={String(selected?.order ?? rows.length)}
                error={state.errors?.order?.[0]}
                label="Urutan"
                min="0"
                name="order"
                type="number"
              />
            </div>
            <label className="form-control col-span-8 w-full">
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
            <label className="form-control col-span-8 w-full">
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
            <label className="col-span-8 flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-base-300 px-4 py-3">
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

            {permission.create && (
              <div className="col-span-8">
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
                  <span className="text-xs text-base-content/50">Maksimal {maxPhotos} foto per unggahan.</span>
                  <input
                    accept="image/*"
                    className="hidden"
                    disabled={converting}
                    multiple
                    onChange={onPhotosChange}
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
                            onClick={() => onRemovePhoto(photo.id)}
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
            )}
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
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
    </>
  );
}
