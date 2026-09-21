"use client";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { InputRupiah } from "@/components/ui/input-rupiah";
import { InputText } from "@/components/ui/input-text";
import { Select, type SelectOption } from "@/components/ui/select";
import type { IbadahOption, KeuanganRow } from "./keuangan-manager";
import {
  KATEGORI_KEUANGAN,
  LABEL_KATEGORI_KEUANGAN,
  type KeuanganActionState,
} from "./schema";

type KeuanganFormProps = {
  formAction: (payload: FormData) => void;
  ibadah: IbadahOption[];
  pending: boolean;
  selected: KeuanganRow | null;
  state: KeuanganActionState;
  onCancel: () => void;
};

export function KeuanganForm({
  formAction,
  ibadah,
  pending,
  selected,
  state,
  onCancel,
}: KeuanganFormProps) {
  const ibadahOptions = ibadah.map((item) => ({ value: item.id, label: item.label }));
  const selectedIbadah: SelectOption | null = selected?.id_ibadah
    ? ibadahOptions.find((item) => item.value === selected.id_ibadah) ?? null
    : null;

  return (
    <form action={formAction} className="space-y-5">
      <input name="intent" type="hidden" value={selected ? "update" : "create"} />
      {selected && <input name="id" type="hidden" value={selected.id} />}
      <div className="grid grid-cols-8 gap-x-6 gap-y-4">
        <div className="col-span-8 sm:col-span-4">
          <Select
            defaultValue={selectedIbadah}
            error={state.errors?.id_ibadah?.[0]}
            helpText="Opsional, pilih ibadah tempat persembahan diterima."
            label="Ibadah"
            name="id_ibadah"
            options={ibadahOptions}
            placeholder="Tidak terkait ibadah"
            variant="react-select"
          />
        </div>
        <div className="col-span-8 sm:col-span-4">
          <Select
            defaultValue={selected?.kategori ?? ""}
            error={state.errors?.kategori?.[0]}
            label="Kategori"
            name="kategori"
            options={KATEGORI_KEUANGAN.map((value) => ({
              value,
              label: LABEL_KATEGORI_KEUANGAN[value],
            }))}
            placeholder="Pilih kategori"
            required
          />
        </div>
        <div className="col-span-8 sm:col-span-4">
          <InputText
            defaultValue={selected?.nm_pemberi ?? ""}
            error={state.errors?.nm_pemberi?.[0]}
            label="Nama pemberi"
            name="nm_pemberi"
            placeholder="Contoh: Kel. Victor Pekpekay"
          />
        </div>
        <div className="col-span-8 sm:col-span-4">
          <InputRupiah
            defaultValue={selected?.jumlah ?? ""}
            error={state.errors?.jumlah?.[0]}
            helpText="Titik ribuan otomatis. Cukup ketik angkanya."
            label="Jumlah"
            name="jumlah"
            placeholder="250.000"
            required
          />
        </div>
        <div className="col-span-8">
          <FormField
            error={state.errors?.keterangan?.[0]}
            id="keterangan"
            label="Keterangan"
          >
            <textarea
              aria-invalid={Boolean(state.errors?.keterangan?.[0])}
              className={`textarea textarea-bordered min-h-28 w-full ${state.errors?.keterangan?.[0] ? "textarea-error" : ""}`}
              defaultValue={selected?.keterangan ?? ""}
              id="keterangan"
              maxLength={5000}
              name="keterangan"
              placeholder="Keterangan penerimaan atau ucapan syukur"
            />
          </FormField>
        </div>
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button disabled={pending} type="button" variant="ghost" onClick={onCancel}>
          Batal
        </Button>
        <Button disabled={pending} loading={pending} type="submit">
          {pending ? "Memproses..." : "Simpan"}
        </Button>
      </div>
    </form>
  );
}
