"use client";

import { Button } from "@/components/ui/button";
import { InputText } from "@/components/ui/input-text";
import type { MasterDataRow } from "./master-data-manager";
import type { MasterDataActionState } from "./schema";

type MasterDataFormProps = {
  formAction: (payload: FormData) => void;
  pending: boolean;
  resource: "rayon" | "unsur";
  selected: MasterDataRow | null;
  state: MasterDataActionState;
  title: string;
  onCancel: () => void;
};

export function MasterDataForm({
  formAction,
  pending,
  resource,
  selected,
  state,
  title,
  onCancel,
}: MasterDataFormProps) {
  return (
    <form action={formAction} className="space-y-5">
      <input name="resource" type="hidden" value={resource} />
      {selected && <input name="id" type="hidden" value={selected.id} />}
      <div className="grid grid-cols-8 gap-x-6 gap-y-4">
        <div className="col-span-8">
          <InputText
            autoFocus
            defaultValue={selected?.name ?? ""}
            error={state.errors?.name?.[0]}
            label={`Nama ${title.toLowerCase()}`}
            name="name"
            required
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Batal
        </Button>
        <Button disabled={pending} loading={pending} type="submit">
          {pending ? "Memproses..." : "Simpan"}
        </Button>
      </div>
    </form>
  );
}
