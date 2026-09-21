"use client";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { InputText } from "@/components/ui/input-text";
import { Select } from "@/components/ui/select";
import type { JemaatRow, KeluargaOption } from "./jemaat-manager";
import {
  FAMILY_STATUSES,
  JEMAAT_GENDERS,
  JEMAAT_STATUSES,
  type ActionState,
} from "./schema";

type JemaatFormProps = {
  formAction: (payload: FormData) => void;
  mode: "create" | "edit";
  pending: boolean;
  keluargaOptions: KeluargaOption[];
  selected: JemaatRow | null;
  state: ActionState;
  onCancel: () => void;
};

function keluargaLabel(row: JemaatRow): string {
  if (!row.keluarga) return "";
  const parts = [
    row.keluarga.no_kk,
    row.keluarga.alamat_blok,
    row.keluarga.rayon?.nm_rayon,
  ].filter(Boolean);
  return parts.join(" · ");
}

export function JemaatForm({
  formAction,
  mode,
  pending,
  keluargaOptions,
  selected,
  state,
  onCancel,
}: JemaatFormProps) {
  return (
    <form action={formAction} className="space-y-5">
      <input name="id" type="hidden" value={selected?.id ?? ""} />
      <div className="grid grid-cols-8 gap-x-6 gap-y-4">
        <div className="col-span-8 sm:col-span-4">
          <InputText className="w-full" defaultValue={selected?.nm_lengkap} error={state.errors?.nm_lengkap?.[0]} label="Nama lengkap" name="nm_lengkap" required />
        </div>
        <div className="col-span-8 sm:col-span-4">
          <DatePicker
            defaultValue={selected?.tgl_lahir.slice(0, 10)}
            error={state.errors?.tgl_lahir?.[0]}
            label="Tanggal lahir"
            name="tgl_lahir"
            required
          />
        </div>
        <div className="col-span-8 sm:col-span-4">
          <fieldset aria-describedby={state.errors?.jenkel ? "jenkel-error" : undefined}>
            <legend className="mb-2 text-sm font-medium">
              Jenis kelamin <span aria-hidden="true">*</span>
            </legend>
            <div className="flex min-h-12 items-center gap-6 rounded-lg border border-base-300 px-4">
              {JEMAAT_GENDERS.map((item) => (
                <label className="flex cursor-pointer items-center gap-2" key={item}>
                  <input
                    className="radio radio-sm"
                    defaultChecked={selected?.jenkel === item}
                    name="jenkel"
                    required
                    type="radio"
                    value={item}
                  />
                  <span>{item === "L" ? "Laki-laki" : "Perempuan"}</span>
                </label>
              ))}
            </div>
            {state.errors?.jenkel?.[0] && (
              <p className="mt-1 text-sm text-error" id="jenkel-error">
                {state.errors.jenkel[0]}
              </p>
            )}
          </fieldset>
        </div>
        <div className="col-span-8 sm:col-span-4">
          <Select defaultValue={selected?.stat_keluarga ?? ""} error={state.errors?.stat_keluarga?.[0]} label="Status keluarga" name="stat_keluarga" options={FAMILY_STATUSES.map((item) => ({ value: item, label: item.replace("_", " ") }))} placeholder="Pilih status keluarga" required />
        </div>
        <div className="col-span-8 sm:col-span-4">
          <Select
            defaultValue={
              selected?.id_keluarga
                ? {
                    value: selected.id_keluarga,
                    label:
                      keluargaOptions.find(
                        (item) => item.value === selected.id_keluarga,
                      )?.label ?? keluargaLabel(selected),
                  }
                : null
            }
            error={state.errors?.id_keluarga?.[0]}
            helpText="Alamat & rayon mengikuti data keluarga."
            label="Keluarga"
            name="id_keluarga"
            options={keluargaOptions}
            placeholder="Pilih keluarga"
            required
            variant="react-select"
          />
        </div>
        <div className="col-span-8 sm:col-span-4">
          <Select defaultValue={selected?.status ?? "AKTIF"} error={state.errors?.status?.[0]} label="Status jemaat" name="status" options={JEMAAT_STATUSES.map((item) => ({ value: item, label: item }))} required />
        </div>
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" type="button" onClick={onCancel}>Batal</Button>
        <Button disabled={pending} loading={pending} type="submit">
          {pending ? "Menyimpan..." : mode === "edit" ? "Simpan perubahan" : "Tambah jemaat"}
        </Button>
      </div>
    </form>
  );
}
