"use client";

import { Button } from "@/components/ui/button";
import { InputText } from "@/components/ui/input-text";
import type { RayonRow } from "./rayon-manager";
import type { RayonActionState } from "./schema";

type RayonFormProps = {
  formAction: (payload: FormData) => void;
  mode: "create" | "edit";
  pending: boolean;
  selected: RayonRow | null;
  state: RayonActionState;
  onCancel: () => void;
};

export function RayonForm({
  formAction,
  mode,
  pending,
  selected,
  state,
  onCancel,
}: RayonFormProps) {
  return (
    <form action={formAction} className="space-y-5">
      <input name="resource" type="hidden" value="rayon" />
      {selected && <input name="id" type="hidden" value={selected.id} />}
      <div className="grid grid-cols-8 gap-x-6 gap-y-4">
        <div className="col-span-8">
          <InputText
            autoFocus
            defaultValue={selected?.nm_rayon ?? ""}
            error={state.errors?.name?.[0]}
            label="Nama rayon"
            name="name"
            required
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" type="button" onClick={onCancel}>Batal</Button>
        <Button disabled={pending} loading={pending} type="submit">
          {pending ? "Menyimpan..." : mode === "edit" ? "Simpan perubahan" : "Tambah rayon"}
        </Button>
      </div>
    </form>
  );
}
