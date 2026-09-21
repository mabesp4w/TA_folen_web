"use client";

import { Button } from "@/components/ui/button";
import { InputText } from "@/components/ui/input-text";
import { Select } from "@/components/ui/select";
import type { KeluargaRow, RayonOption } from "./keluarga-manager";
import type { KeluargaActionState } from "./schema";

type KeluargaFormProps = {
  formAction: (payload: FormData) => void;
  mode: "create" | "edit";
  pending: boolean;
  rayons: RayonOption[];
  selected: KeluargaRow | null;
  state: KeluargaActionState;
  onCancel: () => void;
};

export function KeluargaForm({
  formAction,
  mode,
  pending,
  rayons,
  selected,
  state,
  onCancel,
}: KeluargaFormProps) {
  return (
    <form action={formAction} className="space-y-5">
      <input name="id" type="hidden" value={selected?.id ?? ""} />
      <div className="grid grid-cols-8 gap-x-6 gap-y-4">
        <div className="col-span-8 sm:col-span-4">
          <InputText
            className="w-full"
            defaultValue={selected?.no_kk ?? ""}
            error={state.errors?.no_kk?.[0]}
            helpText="Opsional. Kosongkan bila belum ada."
            label="Nomor Kartu Keluarga"
            name="no_kk"
          />
        </div>
        <div className="col-span-8 sm:col-span-4">
          <InputText
            className="w-full"
            defaultValue={selected?.alamat_blok}
            error={state.errors?.alamat_blok?.[0]}
            label="Alamat blok"
            name="alamat_blok"
            required
          />
        </div>
        <div className="col-span-8 sm:col-span-4">
          <Select
            defaultValue={
              selected?.id_rayon
                ? {
                    value: selected.id_rayon,
                    label:
                      rayons.find((item) => item.id === selected.id_rayon)
                        ?.nm_rayon ?? selected.rayon?.nm_rayon ?? "",
                  }
                : null
            }
            error={state.errors?.id_rayon?.[0]}
            label="Rayon"
            name="id_rayon"
            options={rayons.map((item) => ({
              value: item.id,
              label: item.nm_rayon,
            }))}
            placeholder="Belum ditentukan"
            variant="react-select"
          />
        </div>
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" type="button" onClick={onCancel}>Batal</Button>
        <Button disabled={pending} loading={pending} type="submit">
          {pending ? "Menyimpan..." : mode === "edit" ? "Simpan perubahan" : "Tambah keluarga"}
        </Button>
      </div>
    </form>
  );
}
