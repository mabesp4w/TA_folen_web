"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { InputText } from "@/components/ui/input-text";
import { Select, type SelectOption } from "@/components/ui/select";
import type { KehadiranRow } from "./kehadiran-manager";
import type { KehadiranActionState } from "./schema";

type KehadiranFormProps = {
  formAction: (payload: FormData) => void;
  availableOptions: SelectOption[];
  mode: "create" | "edit";
  pending: boolean;
  selected: KehadiranRow | null;
  state: KehadiranActionState;
  onCancel: () => void;
};

export function KehadiranForm({
  formAction,
  availableOptions,
  mode,
  pending,
  selected,
  state,
  onCancel,
}: KehadiranFormProps) {
  const [counts, setCounts] = useState({
    laki_laki: selected?.laki_laki ?? 0,
    perempuan: selected?.perempuan ?? 0,
    anak: selected?.anak ?? 0,
  });

  const total = counts.laki_laki + counts.perempuan + counts.anak;

  return (
    <form action={formAction} className="space-y-5">
      {selected && <input name="id" type="hidden" value={selected.id} />}

      <div className="grid grid-cols-8 gap-x-6 gap-y-4">
        {mode === "edit" ? (
          <div className="col-span-8">
            <input name="id_ibadah" type="hidden" value={selected?.id_ibadah ?? ""} />
            <div className="rounded-xl border border-[var(--line)] bg-base-200/50 p-3 text-sm">
              <span className="text-[var(--muted)]">Ibadah:</span>{" "}
              <span className="font-semibold">{selected?.ibadah}</span>
            </div>
          </div>
        ) : (
          <div className="col-span-8">
            <Select
              error={state.errors?.id_ibadah?.[0]}
              label="Ibadah"
              name="id_ibadah"
              options={availableOptions}
              placeholder="Pilih ibadah"
              required
              variant="react-select"
              
            />
          </div>
        )}

        <div className="col-span-8 sm:col-span-2">
          <InputText
            defaultValue={String(selected?.laki_laki ?? 0)}
            error={state.errors?.laki_laki?.[0]}
            label="Laki-laki"
            min="0"
            name="laki_laki"
            type="number"
            onChange={(e) =>
              setCounts((c) => ({ ...c, laki_laki: Number(e.currentTarget.value) || 0 }))
            }
          />
        </div>
        <div className="col-span-8 sm:col-span-2">
          <InputText
            defaultValue={String(selected?.perempuan ?? 0)}
            error={state.errors?.perempuan?.[0]}
            label="Perempuan"
            min="0"
            name="perempuan"
            type="number"
            onChange={(e) =>
              setCounts((c) => ({ ...c, perempuan: Number(e.currentTarget.value) || 0 }))
            }
          />
        </div>
        <div className="col-span-8 sm:col-span-2">
          <InputText
            defaultValue={String(selected?.anak ?? 0)}
            error={state.errors?.anak?.[0]}
            label="Anak"
            min="0"
            name="anak"
            type="number"
            onChange={(e) =>
              setCounts((c) => ({ ...c, anak: Number(e.currentTarget.value) || 0 }))
            }
          />
        </div>
        <div className="col-span-8">
          <div className="rounded-xl border border-[var(--line)] bg-base-200/50 p-3 text-sm">
            Total kehadiran: <strong className="text-lg">{total}</strong> jemaat
          </div>
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
