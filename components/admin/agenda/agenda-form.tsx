"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { FormField } from "@/components/ui/form-field";
import { InputText } from "@/components/ui/input-text";
import { Select, type SelectOption } from "@/components/ui/select";
import type { AgendaRow } from "./agenda-manager";
import type { AgendaActionState } from "./schema";

type Option = { id: string; name: string };

type AgendaFormProps = {
  formAction: (payload: FormData) => void;
  jemaat: Option[];
  mode: "create" | "edit";
  pending: boolean;
  selected: AgendaRow | null;
  state: AgendaActionState;
  unsur: Option[];
  onCancel: () => void;
};

function option(items: Option[], id: string | null) {
  const item = items.find((candidate) => candidate.id === id);
  return item ? { value: item.id, label: item.name } : null;
}

function deriveJenis(row: AgendaRow | null): "unsur" | "gabungan" | "umum" {
  if (!row) return "unsur";
  if (row.gabungan) return "gabungan";
  if (!row.id_unsur && !row.id_jemaat) return "umum";
  return "unsur";
}

export function AgendaForm({
  formAction,
  jemaat,
  mode,
  pending,
  selected,
  state,
  unsur,
  onCancel,
}: AgendaFormProps) {
  const [jenisIbadah, setJenisIbadah] = useState<"unsur" | "gabungan" | "umum">(
    deriveJenis(selected),
  );

  return (
    <form action={formAction} className="space-y-5">
      {selected && <input name="id" type="hidden" value={selected.id} />}

      <div className="grid grid-cols-8 gap-x-6 gap-y-4">
        <div className="col-span-8 sm:col-span-4">
          <Select
            defaultValue={{
              value: jenisIbadah,
              label:
                jenisIbadah === "gabungan"
                  ? "Ibadah Gabungan"
                  : jenisIbadah === "umum"
                    ? "Ibadah Umum"
                    : "Ibadah Unsur",
            }}
            label="Jenis ibadah"
            name="jenis_ibadah"
            onChange={(opt: SelectOption | null) =>
              setJenisIbadah(
                (opt?.value as "unsur" | "gabungan" | "umum") ?? "unsur",
              )
            }
            options={[
              { value: "unsur", label: "Ibadah Unsur" },
              { value: "gabungan", label: "Ibadah Gabungan" },
              { value: "umum", label: "Ibadah Umum" },
            ]}
            required
            variant="react-select"
          />
        </div>

        {jenisIbadah === "gabungan" && (
          <input name="gabungan" type="hidden" value="on" />
        )}
        {(jenisIbadah === "gabungan" || jenisIbadah === "umum") && (
          <input name="tempat" type="hidden" value="Gereja Syaloom" />
        )}

        <div className="col-span-8 sm:col-span-4">
          <InputText
            defaultValue={selected?.nm_ibadah ?? ""}
            error={state.errors?.nm_ibadah?.[0]}
            label="Nama ibadah"
            name="nm_ibadah"
            placeholder="Contoh: Ibadah Minggu"
          />
        </div>
        <div className="col-span-8 sm:col-span-4">
          <InputText
            defaultValue={selected?.sektor?.toString() ?? ""}
            error={state.errors?.sektor?.[0]}
            label="Sektor"
            max="99"
            min="1"
            name="sektor"
            type="number"
          />
        </div>
        <div className="col-span-8 sm:col-span-4">
          <DatePicker
            defaultValue={selected?.tgl}
            error={state.errors?.tgl?.[0]}
            label="Tanggal"
            name="tgl"
            required
          />
        </div>
        <div className="col-span-8 sm:col-span-4">
          <FormField
            error={state.errors?.waktu?.[0]}
            id="waktu"
            label="Waktu"
            required
          >
            <label
              className={`input input-bordered login-input ${state.errors?.waktu?.[0] ? "input-error" : ""}`}
            >
              <input
                aria-describedby={
                  state.errors?.waktu?.[0] ? "waktu-error" : undefined
                }
                aria-invalid={Boolean(state.errors?.waktu?.[0])}
                defaultValue={selected?.waktu ?? ""}
                id="waktu"
                name="waktu"
                required
                type="time"
              />
            </label>
          </FormField>
        </div>

        {jenisIbadah !== "umum" && (
          <div className="col-span-8 sm:col-span-4">
            <Select
              defaultValue={option(unsur, selected?.id_unsur ?? null)}
              error={state.errors?.id_unsur?.[0]}
              label="Unsur kategorial"
              name="id_unsur"
              options={unsur.map((item) => ({
                value: item.id,
                label: item.name,
              }))}
              placeholder="Pilih unsur"
              required={jenisIbadah === "gabungan"}
              variant="react-select"
            />
          </div>
        )}

        {jenisIbadah === "unsur" && (
          <>
            <div className="col-span-8 sm:col-span-4">
              <Select
                defaultValue={option(jemaat, selected?.id_jemaat ?? null)}
                error={state.errors?.id_jemaat?.[0]}
                label="Tuan rumah"
                name="id_jemaat"
                options={jemaat.map((item) => ({
                  value: item.id,
                  label: item.name,
                }))}
                placeholder="Pilih jemaat"
                variant="react-select"
              />
            </div>
            <div className="col-span-8 sm:col-span-4">
              <InputText
                defaultValue={selected?.tempat ?? ""}
                error={state.errors?.tempat?.[0]}
                label="Tempat"
                name="tempat"
                placeholder="Contoh: Gereja Kanaan"
              />
            </div>
            <div className="col-span-8 sm:col-span-4">
              <InputText
                defaultValue={selected?.alamat_tempat ?? ""}
                error={state.errors?.alamat_tempat?.[0]}
                label="Alamat tempat"
                name="alamat_tempat"
              />
            </div>
          </>
        )}

        <div className="col-span-8 sm:col-span-4">
          <Select
            defaultValue={option(jemaat, selected?.id_pelayan_firman ?? null)}
            error={state.errors?.id_pelayan_firman?.[0]}
            label="Pelayan firman dari jemaat"
            name="id_pelayan_firman"
            options={jemaat.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
            placeholder="Pilih pelayan"
            variant="react-select"
          />
        </div>
        <div className="col-span-8 sm:col-span-4">
          <InputText
            defaultValue={selected?.pelayan_firman ?? ""}
            error={state.errors?.pelayan_firman?.[0]}
            helpText="Isi hanya untuk pelayan tamu yang tidak tercatat sebagai jemaat."
            label="Pelayan firman tamu"
            name="pelayan_firman"
          />
        </div>
        <div className="col-span-8 sm:col-span-4">
          <InputText
            defaultValue={selected?.liturgos ?? ""}
            error={state.errors?.liturgos?.[0]}
            label="Liturgos"
            name="liturgos"
          />
        </div>
        <div className="col-span-8 sm:col-span-4">
          <InputText
            defaultValue={selected?.pembacaan_alkitab ?? ""}
            error={state.errors?.pembacaan_alkitab?.[0]}
            label="Pembacaan Alkitab"
            name="pembacaan_alkitab"
            placeholder="Contoh: Markus 16:1-8"
          />
        </div>
        <div className="col-span-8 sm:col-span-4">
          <InputText
            defaultValue={selected?.piket ?? ""}
            error={state.errors?.piket?.[0]}
            label="Piket"
            name="piket"
          />
        </div>
        {jenisIbadah === "unsur" && (
          <div className="col-span-8 sm:col-span-4">
            <InputText
              defaultValue={selected?.p_organ ?? ""}
              error={state.errors?.p_organ?.[0]}
              label="Pemain organ"
              name="p_organ"
            />
          </div>
        )}
        <div className="col-span-8 sm:col-span-4">
          <InputText
            defaultValue={selected?.catatan ?? ""}
            error={state.errors?.catatan?.[0]}
            label="Catatan"
            name="catatan"
          />
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Batal
        </Button>
        <Button disabled={pending} loading={pending} type="submit">
          {pending ? "Memproses..." : mode === "edit" ? "Perbarui" : "Simpan"}
        </Button>
      </div>
    </form>
  );
}
