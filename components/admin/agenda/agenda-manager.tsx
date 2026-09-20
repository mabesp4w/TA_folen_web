"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock, MapPin, Pencil, Plus, Trash2, X } from "lucide-react";
import { gooeyToast } from "goey-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { FormField } from "@/components/ui/form-field";
import { InputText } from "@/components/ui/input-text";
import { Select } from "@/components/ui/select";
import { createAgendaAction, deleteAgendaAction, updateAgendaAction } from "./actions";
import { initialAgendaActionState } from "./schema";

export type AgendaRow = {
  id: string;
  id_jemaat: string | null;
  jemaat: string | null;
  id_unsur: string | null;
  unsur: string | null;
  id_pelayan_firman: string | null;
  pelayan: string | null;
  nm_ibadah: string | null;
  gabungan: boolean;
  sektor: number | null;
  tgl: string;
  waktu: string;
  tempat: string | null;
  alamat_tempat: string | null;
  catatan: string | null;
  pelayan_firman: string | null;
  liturgos: string | null;
  pembacaan_alkitab: string | null;
  piket: string | null;
  p_organ: string | null;
};

type Option = { id: string; name: string };
type DialogMode = "create" | "edit" | "delete" | null;

type Props = {
  rows: AgendaRow[];
  jemaat: Option[];
  unsur: Option[];
};

function option(items: Option[], id: string | null) {
  const item = items.find((candidate) => candidate.id === id);
  return item ? { value: item.id, label: item.name } : null;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function title(row: AgendaRow) {
  return row.nm_ibadah ?? row.unsur ?? "Ibadah jemaat";
}

export function AgendaManager({ rows, jemaat, unsur }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<DialogMode>(null);
  const [selected, setSelected] = useState<AgendaRow | null>(null);
  const action = mode === "edit" ? updateAgendaAction : mode === "delete" ? deleteAgendaAction : createAgendaAction;
  const [state, formAction, pending] = useActionState(action, initialAgendaActionState);

  useEffect(() => {
    if (state.status === "success") {
      gooeyToast.success(state.message ?? "Perubahan berhasil disimpan.");
      queueMicrotask(() => {
        setMode(null);
        setSelected(null);
      });
      router.refresh();
    } else if (state.status === "error" && state.message) {
      gooeyToast.error(state.message);
    }
  }, [router, state]);

  function openDialog(nextMode: DialogMode, row: AgendaRow | null = null) {
    setSelected(row);
    setMode(nextMode);
  }

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Administrasi</p>
          <h1 className="text-3xl font-bold tracking-tight">Agenda & Ibadah</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">Kelola jadwal, lokasi, tuan rumah, dan petugas pelayanan ibadah.</p>
        </div>
        <Button onClick={() => openDialog("create")}>
          <Plus aria-hidden="true" size={18} /> Tambah agenda
        </Button>
      </header>

      {rows.length === 0 ? (
        <section className="rounded-xl border border-dashed border-base-300 px-6 py-16 text-center">
          <CalendarDays aria-hidden="true" className="mx-auto mb-4 text-[var(--muted)]" size={36} />
          <h2 className="text-lg font-semibold">Belum ada agenda ibadah</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">Tambahkan jadwal pertama untuk mulai mengelola agenda.</p>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Daftar agenda ibadah">
          {rows.map((row) => (
            <article className="rounded-xl border border-base-200 bg-base-100 p-5 shadow-sm" key={row.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold">{title(row)}</h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">{row.gabungan ? "Ibadah gabungan" : row.unsur ?? "Ibadah umum"}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button aria-label={`Edit ${title(row)}`} square variant="ghost" onClick={() => openDialog("edit", row)}>
                    <Pencil aria-hidden="true" size={17} />
                  </Button>
                  <Button aria-label={`Hapus ${title(row)}`} square variant="ghost" onClick={() => openDialog("delete", row)}>
                    <Trash2 aria-hidden="true" size={17} />
                  </Button>
                </div>
              </div>
              <dl className="mt-5 space-y-3 border-t border-base-200 pt-4 text-sm">
                <div className="flex items-start gap-3">
                  <CalendarDays aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--muted)]" size={16} />
                  <div><dt className="sr-only">Tanggal</dt><dd className="font-medium">{formatDate(row.tgl)}</dd></div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--muted)]" size={16} />
                  <div><dt className="sr-only">Waktu</dt><dd className="font-medium">{row.waktu} WIT</dd></div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--muted)]" size={16} />
                  <div><dt className="sr-only">Lokasi</dt><dd className="font-medium">{row.tempat ?? row.jemaat ?? "Belum ditentukan"}</dd>{row.alamat_tempat && <dd className="mt-0.5 text-[var(--muted)]">{row.alamat_tempat}</dd>}</div>
                </div>
              </dl>
            </article>
          ))}
        </section>
      )}

      {mode && (
        <div className="modal modal-open" role="dialog" aria-modal="true" aria-labelledby="agenda-dialog-title">
          <div className="modal-box max-h-[90dvh] max-w-3xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold" id="agenda-dialog-title">{mode === "create" ? "Tambah agenda" : mode === "edit" ? "Edit agenda" : "Hapus agenda"}</h2>
                {mode === "delete" && <p className="mt-2 text-sm text-[var(--muted)]">Tindakan ini tidak dapat dibatalkan.</p>}
              </div>
              <Button aria-label="Tutup dialog" square type="button" variant="ghost" onClick={() => openDialog(null)}><X aria-hidden="true" size={18} /></Button>
            </div>

            <form action={formAction} className="space-y-5">
              {selected && <input name="id" type="hidden" value={selected.id} />}
              {mode === "delete" ? (
                <>
                  <input name="ringkasan" type="hidden" value={selected ? title(selected) : ""} />
                  <p>Hapus agenda <strong>{selected ? title(selected) : ""}</strong> pada {selected ? formatDate(selected.tgl) : ""}?</p>
                </>
              ) : (
                <>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <InputText defaultValue={selected?.nm_ibadah ?? ""} error={state.errors?.nm_ibadah?.[0]} label="Nama ibadah" name="nm_ibadah" placeholder="Contoh: Ibadah Minggu" />
                    <InputText defaultValue={selected?.sektor?.toString() ?? ""} error={state.errors?.sektor?.[0]} label="Sektor" max="99" min="1" name="sektor" type="number" />
                    <DatePicker defaultValue={selected?.tgl} error={state.errors?.tgl?.[0]} label="Tanggal" name="tgl" required />
                    <FormField error={state.errors?.waktu?.[0]} id="waktu" label="Waktu" required>
                      <label className={`input input-bordered login-input ${state.errors?.waktu?.[0] ? "input-error" : ""}`}>
                        <input aria-describedby={state.errors?.waktu?.[0] ? "waktu-error" : undefined} aria-invalid={Boolean(state.errors?.waktu?.[0])} defaultValue={selected?.waktu ?? ""} id="waktu" name="waktu" required type="time" />
                      </label>
                    </FormField>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Select defaultValue={option(jemaat, selected?.id_jemaat ?? null)} error={state.errors?.id_jemaat?.[0]} label="Tuan rumah" name="id_jemaat" options={jemaat.map((item) => ({ value: item.id, label: item.name }))} placeholder="Pilih jemaat" variant="react-select" />
                    <Select defaultValue={option(unsur, selected?.id_unsur ?? null)} error={state.errors?.id_unsur?.[0]} label="Unsur kategorial" name="id_unsur" options={unsur.map((item) => ({ value: item.id, label: item.name }))} placeholder="Pilih unsur" variant="react-select" />
                  </div>
                  <Checkbox defaultChecked={selected?.gabungan ?? false} label="Ibadah gabungan" name="gabungan" />
                  <div className="grid gap-5 sm:grid-cols-2">
                    <InputText defaultValue={selected?.tempat ?? ""} error={state.errors?.tempat?.[0]} label="Tempat" name="tempat" placeholder="Contoh: Gereja Kanaan" />
                    <InputText defaultValue={selected?.alamat_tempat ?? ""} error={state.errors?.alamat_tempat?.[0]} label="Alamat tempat" name="alamat_tempat" />
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Select defaultValue={option(jemaat, selected?.id_pelayan_firman ?? null)} error={state.errors?.id_pelayan_firman?.[0]} label="Pelayan firman dari jemaat" name="id_pelayan_firman" options={jemaat.map((item) => ({ value: item.id, label: item.name }))} placeholder="Pilih pelayan" variant="react-select" />
                    <InputText defaultValue={selected?.pelayan_firman ?? ""} error={state.errors?.pelayan_firman?.[0]} helpText="Isi hanya untuk pelayan tamu yang tidak tercatat sebagai jemaat." label="Pelayan firman tamu" name="pelayan_firman" />
                    <InputText defaultValue={selected?.liturgos ?? ""} error={state.errors?.liturgos?.[0]} label="Liturgos" name="liturgos" />
                    <InputText defaultValue={selected?.pembacaan_alkitab ?? ""} error={state.errors?.pembacaan_alkitab?.[0]} label="Pembacaan Alkitab" name="pembacaan_alkitab" placeholder="Contoh: Markus 16:1-8" />
                    <InputText defaultValue={selected?.piket ?? ""} error={state.errors?.piket?.[0]} label="Piket" name="piket" />
                    <InputText defaultValue={selected?.p_organ ?? ""} error={state.errors?.p_organ?.[0]} label="Pemain organ" name="p_organ" />
                  </div>
                  <InputText defaultValue={selected?.catatan ?? ""} error={state.errors?.catatan?.[0]} label="Catatan" name="catatan" />
                </>
              )}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="ghost" onClick={() => openDialog(null)}>Batal</Button>
                <Button className={mode === "delete" ? "btn-error" : ""} disabled={pending} loading={pending} type="submit">{pending ? "Memproses..." : mode === "delete" ? "Hapus" : "Simpan"}</Button>
              </div>
            </form>
          </div>
          <button aria-label="Tutup dialog" className="modal-backdrop" type="button" onClick={() => openDialog(null)} />
        </div>
      )}
    </>
  );
}
