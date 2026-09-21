"use client";

import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { InputText } from "@/components/ui/input-text";
import type { SlideRow } from "./slide-manager";
import type { SlideActionState } from "./schema";

type SlideFormProps = {
  converting: boolean;
  formAction: (payload: FormData) => void;
  mode: "create" | "edit";
  pending: boolean;
  preview: string | null;
  selected: SlideRow | null;
  state: SlideActionState;
  onCancel: () => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export function SlideForm({
  converting,
  formAction,
  mode,
  pending,
  preview,
  selected,
  state,
  onCancel,
  onFileChange,
  onSubmit,
}: SlideFormProps) {
  return (
    <form action={formAction} className="mt-6 space-y-5" onSubmit={onSubmit}>
      {selected && <input name="id" type="hidden" value={selected.id} />}

      <div className="grid grid-cols-8 gap-x-6 gap-y-4">
        <div className="col-span-8">
          <span className="label-text mb-2 block font-medium">
            Gambar slide {mode === "create" && <span aria-hidden="true">*</span>}
          </span>
          <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-dashed border-[var(--line)] p-4 text-center focus-within:ring-2 focus-within:ring-[var(--pacific)]">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="Pratinjau slide" className="max-h-48 rounded-lg object-contain" src={preview} />
            ) : (
              <Upload aria-hidden="true" className="text-[var(--pacific)]" size={28} />
            )}
            <span className="text-sm text-[var(--muted)]">
              {converting
                ? "Memproses gambar..."
                : preview
                  ? "Klik untuk mengganti gambar"
                  : "Klik untuk memilih gambar (otomatis dikonversi ke WebP)"}
            </span>
            <input
              accept="image/*"
              className="hidden"
              onChange={onFileChange}
              type="file"
            />
          </label>
          <input name="image" type="file" className="hidden" tabIndex={-1} aria-hidden="true" />
          {mode === "edit" && (
            <p className="mt-1 text-xs text-[var(--muted)]">
              Kosongkan bila tidak ingin mengganti gambar.
            </p>
          )}
        </div>

        <div className="col-span-8">
          <InputText
            defaultValue={selected?.judul ?? ""}
            error={state.errors?.judul?.[0]}
            helpText="Opsional. Kosongkan untuk slide gambar saja."
            label="Judul overlay"
            name="judul"
          />
        </div>
        <div className="col-span-8">
          <label className="form-control w-full">
            <span className="label-text mb-2 font-medium">Teks</span>
            <textarea
              className="textarea textarea-bordered min-h-24 w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pacific)]"
              defaultValue={selected?.teks ?? ""}
              name="teks"
              placeholder="Teks singkat di bawah judul (opsional)"
            />
            {state.errors?.teks?.[0] ? (
              <span className="mt-1 text-sm text-error">{state.errors.teks[0]}</span>
            ) : null}
          </label>
        </div>
        <div className="col-span-8 sm:col-span-4">
          <InputText
            defaultValue={selected?.link_teks ?? ""}
            error={state.errors?.link_teks?.[0]}
            label="Label tombol"
            name="link_teks"
            placeholder="Contoh: Lihat Jadwal"
          />
        </div>
        <div className="col-span-8 sm:col-span-4">
          <InputText
            defaultValue={selected?.link_url ?? ""}
            error={state.errors?.link_url?.[0]}
            label="Tujuan tombol"
            name="link_url"
            placeholder="Contoh: /jadwal"
          />
        </div>
        <div className="col-span-8">
          <Checkbox
            defaultChecked={selected?.status ?? true}
            label="Tampilkan slide di beranda"
            name="status"
          />
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Batal
        </Button>
        <Button
          disabled={pending || converting}
          loading={pending}
          type="submit"
        >
          {pending ? "Memproses..." : "Simpan slide"}
        </Button>
      </div>
    </form>
  );
}
