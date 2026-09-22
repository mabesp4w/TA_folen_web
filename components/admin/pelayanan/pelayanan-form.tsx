"use client";

import { type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { InputText } from "@/components/ui/input-text";
import { Select } from "@/components/ui/select";
import type { PelayananRow } from "./pelayanan-manager";
import {
  JABATAN_PENGURUS,
  MAJELIS_POSITIONS,
  PELAYANAN_TYPES,
  SEKTOR_OPTIONS,
  type PelayananActionState,
} from "./schema";

type Option = { id: string; name: string };

const typeLabels = {
  PENDETA: "Pendeta",
  MAJELIS: "Majelis",
  PENGURUS: "Pengurus unsur",
} as const;

type PelayananFormProps = {
  formAction: (payload: FormData) => void;
  formType: (typeof PELAYANAN_TYPES)[number];
  jemaat: Option[];
  mode: "create" | "edit";
  pending: boolean;
  selected: PelayananRow | null;
  state: PelayananActionState;
  unsur: Option[];
  onCancel: () => void;
  onTypeChange: (value: (typeof PELAYANAN_TYPES)[number]) => void;
};

export function PelayananForm({
  formAction,
  formType,
  jemaat,
  mode,
  pending,
  selected,
  state,
  unsur,
  onCancel,
  onTypeChange,
}: PelayananFormProps) {
  return (
    <form action={formAction} className="space-y-5">
      {selected && <input name="id" type="hidden" value={selected.id} />}
      <div className="grid grid-cols-8 gap-x-6 gap-y-4">
        <div className="col-span-8 sm:col-span-4">
          <Select
            defaultValue={formType}
            disabled={mode === "edit"}
            error={state.errors?.type?.[0]}
            label="Jenis pelayanan"
            name={mode === "edit" ? "type-display" : "type"}
            options={PELAYANAN_TYPES.map((value) => ({ value, label: typeLabels[value] }))}
            required
            onChange={(event: ChangeEvent<HTMLSelectElement>) => onTypeChange(event.target.value as (typeof PELAYANAN_TYPES)[number])}
          />
          {mode === "edit" && <input name="type" type="hidden" value={formType} />}
        </div>
        <div className="col-span-8 sm:col-span-4">
          <Select
            defaultValue={selected
              ? { value: selected.id_jemaat, label: selected.name }
              : null}
            disabled={pending}
            error={state.errors?.id_jemaat?.[0]}
            label="Jemaat"
            name="id_jemaat"
            options={jemaat.map((item) => ({ value: item.id, label: item.name }))}
            placeholder="Pilih jemaat"
            required
            variant="react-select"
          />
        </div>
        {formType === "PENDETA" && (
          <div className="col-span-8 sm:col-span-4">
            <InputText defaultValue={selected?.gelar ?? ""} error={state.errors?.gelar?.[0]} label="Gelar pelayanan" name="gelar" placeholder="Contoh: Pdt. atau Vikaris" />
          </div>
        )}
        {formType === "MAJELIS" && (
          <div className="col-span-8 sm:col-span-4">
            <Select
              defaultValue={selected?.jabatan ?? ""}
              error={state.errors?.jabatan?.[0]}
              label="Jabatan majelis"
              name="jabatan"
              options={MAJELIS_POSITIONS.map((value) => ({ value, label: value === "PENATUA" ? "Penatua" : "Syamas" }))}
              placeholder="Pilih jabatan"
              required
            />
          </div>
        )}
        {formType === "PENGURUS" && (
          <>
            <div className="col-span-8 sm:col-span-4">
              <Select
                defaultValue={selected?.jabatan ?? ""}
                error={state.errors?.jabatan?.[0]}
                label="Jabatan pengurus"
                name="jabatan"
                options={[
                  // Sertakan nilai lama yang tak ada di daftar agar tetap terpilih saat edit.
                  ...(selected?.jabatan && !(JABATAN_PENGURUS as readonly string[]).includes(selected.jabatan)
                    ? [{ value: selected.jabatan, label: selected.jabatan }]
                    : []),
                  ...JABATAN_PENGURUS.map((value) => ({ value, label: value })),
                ]}
                placeholder="Pilih jabatan"
                required
              />
            </div>
            <div className="col-span-8 sm:col-span-4">
              <Select
                defaultValue={selected?.sektor?.toString() ?? ""}
                error={state.errors?.sektor?.[0]}
                helpText="Kosongkan bila kepengurusan tingkat unsur (bukan per-sektor)."
                label="Sektor"
                name="sektor"
                options={[
                  { value: "", label: "Tanpa sektor" },
                  ...SEKTOR_OPTIONS.map((n) => ({ value: String(n), label: `Sektor ${n}` })),
                ]}
              />
            </div>
            <div className="col-span-8">
              <Select
                defaultValue={(() => {
                  const match = unsur.find((item) => item.id === selected?.id_unsur);
                  return match ? { value: match.id, label: match.name } : null;
                })()}
                error={state.errors?.id_unsur?.[0]}
                label="Unsur kategorial"
                name="id_unsur"
                options={unsur.map((item) => ({ value: item.id, label: item.name }))}
                placeholder="Pilih unsur"
                required
                variant="react-select"
              />
            </div>
          </>
        )}
        <div className="col-span-8 sm:col-span-4">
          <DatePicker defaultValue={selected?.tgl_mulai} error={state.errors?.tgl_mulai?.[0]} label="Tanggal mulai" name="tgl_mulai" required />
        </div>
        <div className="col-span-8 sm:col-span-4">
          <DatePicker defaultValue={selected?.tgl_selesai ?? undefined} error={state.errors?.tgl_selesai?.[0]} label="Tanggal selesai" name="tgl_selesai" />
        </div>
        <div className="col-span-8">
          <Checkbox defaultChecked={selected?.aktif ?? true} label="Pelayanan masih aktif" name="aktif" />
        </div>
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onCancel}>Batal</Button>
        <Button disabled={pending} loading={pending} type="submit">
          {pending ? "Memproses..." : "Simpan"}
        </Button>
      </div>
    </form>
  );
}
