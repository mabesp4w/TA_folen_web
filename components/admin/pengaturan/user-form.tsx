"use client";

import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputPassword } from "@/components/ui/input-password";
import { InputText } from "@/components/ui/input-text";
import { Select, type SelectOption } from "@/components/ui/select";
import type { PengurusOption, UserRow } from "./user-manager";
import { ASSIGNABLE_ROLES, USER_ROLES, type UserActionState } from "./schema";

const roleLabels: Record<(typeof USER_ROLES)[number], string> = {
  ADMIN: "Administrator",
  KETUA_UNSUR: "Ketua Unsur",
  KOORDINATOR_UNSUR: "Koordinator Unsur",
};

// Peran menentukan jabatan pengurus yang boleh ditautkan:
// Ketua Unsur → pengurus berjabatan "Ketua"; Koordinator Unsur → "Koordinator".
const ROLE_JABATAN: Partial<Record<(typeof USER_ROLES)[number], string>> = {
  KETUA_UNSUR: "Ketua",
  KOORDINATOR_UNSUR: "Koordinator",
};

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
  // Pilihan pengurus mengikuti Peran: hanya jabatan yang sesuai (Ketua/Koordinator).
  // Saat mengedit akun dengan peran yang belum diubah, pengurus yang sudah tertaut
  // tetap disertakan meski jabatannya berbeda (data lama), agar tidak hilang.
  const wantedJabatan = ROLE_JABATAN[role];
  const keepCurrent = selected != null && role === selected.role;
  const pengurusChoices: SelectOption[] = pengurusOptions
    .filter((option) => option.id !== "__none__")
    .filter(
      (option) =>
        !wantedJabatan ||
        option.jabatan === wantedJabatan ||
        (keepCurrent && option.id === selected?.pengurusId),
    )
    .map((option) => ({ value: option.id, label: option.label }));

  // Pilihan peran: hanya Ketua Unsur & Koordinator Unsur. "Administrator" tidak
  // ditawarkan, kecuali saat mengedit akun yang memang sudah Administrator
  // (agar perannya tidak terpaksa turun).
  const roleOptions: SelectOption[] = (
    selected?.role === "ADMIN" ? USER_ROLES : ASSIGNABLE_ROLES
  ).map((value) => ({ value, label: roleLabels[value] }));

  return (
    <form action={formAction} className="space-y-5">
      {selected && <input name="id" type="hidden" value={selected.id} />}

      <div className="grid grid-cols-8 gap-x-6 gap-y-4">
        <div className="col-span-8 sm:col-span-4">
          <InputText
            autoComplete="off"
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
        {role !== "ADMIN" && (
          <div className="col-span-8">
            <Select
              // key=role → reset pilihan saat peran diganti (opsi ikut berubah).
              key={role}
              defaultValue={
                keepCurrent
                  ? pengurusChoices.find((option) => option.value === selected?.pengurusId) ?? null
                  : null
              }
              error={state.errors?.badan_pengurus_id?.[0]}
              helpText={
                wantedJabatan
                  ? `Hanya pengurus berjabatan ${wantedJabatan} yang dapat ditautkan ke peran ini.`
                  : "Tautkan akun ini ke satu kepengurusan unsur."
              }
              label="Badan pengurus tertaut"
              name="badan_pengurus_id"
              options={pengurusChoices}
              placeholder="Pilih badan pengurus"
              required
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
