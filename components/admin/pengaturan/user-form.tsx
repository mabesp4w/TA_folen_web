"use client";

import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputPassword } from "@/components/ui/input-password";
import { InputText } from "@/components/ui/input-text";
import { Select, type SelectOption } from "@/components/ui/select";
import type { PengurusOption, UserRow } from "./user-manager";
import { USER_ROLES, type UserActionState } from "./schema";

const roleLabels: Record<(typeof USER_ROLES)[number], string> = {
  ADMIN: "Administrator",
  KETUA_UNSUR: "Ketua Unsur",
};

const roleOptions: SelectOption[] = USER_ROLES.map((value) => ({
  value,
  label: roleLabels[value],
}));

type UserFormProps = {
  formAction: (payload: FormData) => void;
  mode: "create" | "edit";
  pending: boolean;
  pengurusOptions: PengurusOption[];
  role: (typeof USER_ROLES)[number];
  selected: UserRow | null;
  state: UserActionState;
  onCancel: () => void;
  onRoleChange: (value: (typeof USER_ROLES)[number]) => void;
};

export function UserForm({
  formAction,
  mode,
  pending,
  pengurusOptions,
  role,
  selected,
  state,
  onCancel,
  onRoleChange,
}: UserFormProps) {
  // Pengurus yang bisa dipilih: yang belum berakun + pengurus milik akun ini (saat edit).
  const pengurusChoices: SelectOption[] = pengurusOptions
    .filter((option) => option.id !== "__none__")
    .map((option) => ({ value: option.id, label: option.label }));

  return (
    <form action={formAction} className="space-y-5">
      {selected && <input name="id" type="hidden" value={selected.id} />}

      <div className="grid grid-cols-8 gap-x-6 gap-y-4">
        <div className="col-span-8 sm:col-span-4">
          <InputText
            autoComplete="username"
            defaultValue={selected?.username ?? ""}
            error={state.errors?.username?.[0]}
            label="Username"
            name="username"
            required
          />
        </div>
        <div className="col-span-8 sm:col-span-4">
          <Select
            error={state.errors?.role?.[0]}
            label="Peran"
            name="role"
            options={roleOptions}
            value={role}
            variant="native"
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              onRoleChange(e.currentTarget.value as (typeof USER_ROLES)[number])
            }
          />
        </div>
        {role === "KETUA_UNSUR" && (
          <div className="col-span-8 sm:col-span-4">
            <Select
              defaultValue={
                pengurusChoices.find((option) => option.value === selected?.pengurusId) ?? null
              }
              error={state.errors?.badan_pengurus_id?.[0]}
              helpText="Tautkan akun ini ke satu kepengurusan unsur."
              label="Badan pengurus tertaut"
              name="badan_pengurus_id"
              options={pengurusChoices}
              placeholder="Pilih badan pengurus (opsional)"
              variant="react-select"
            />
          </div>
        )}
        <div className="col-span-8">
          <InputPassword
            autoComplete="new-password"
            error={state.errors?.password?.[0]}
            helpText={
              mode === "edit"
                ? "Kosongkan bila tidak ingin mengubah kata sandi."
                : "Minimal 8 karakter."
            }
            icon={<KeyRound aria-hidden="true" size={18} />}
            label="Kata sandi"
            name="password"
            required={mode === "create"}
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
