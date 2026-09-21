"use client";

import { Button } from "@/components/ui/button";
import { InputText } from "@/components/ui/input-text";
import type { UnsurRow } from "./unsur-manager";
import type { UnsurActionState } from "./schema";

type UnsurFormProps = {
  formAction: (payload: FormData) => void;
  mode: "create" | "edit";
  pending: boolean;
  selected: UnsurRow | null;
  state: UnsurActionState;
  onCancel: () => void;
};

export function UnsurForm({
  formAction,
  mode,
  pending,
  selected,
  state,
  onCancel,
}: UnsurFormProps) {
  return (
    <form action={formAction} className="space-y-5">
      {selected && <input name="id" type="hidden" value={selected.id} />}
      <div className="grid grid-cols-8 gap-x-6 gap-y-4">
        <div className="col-span-8">
          <InputText
            autoFocus
            defaultValue={selected?.nm_unsur ?? ""}
            error={state.errors?.name?.[0]}
            label="Nama unsur"
            name="name"
            required
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" type="button" onClick={onCancel}>
          Batal
        </Button>
        <Button disabled={pending} loading={pending} type="submit">
          {pending ? "Menyimpan..." : mode === "edit" ? "Simpan perubahan" : "Tambah unsur"}
        </Button>
      </div>
    </form>
  );
}
