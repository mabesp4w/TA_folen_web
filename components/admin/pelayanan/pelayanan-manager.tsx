"use client";

import { useActionState, useEffect, useState, type ChangeEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { gooeyToast } from "goey-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { InputText } from "@/components/ui/input-text";
import { Select } from "@/components/ui/select";
import {
  createPelayananAction,
  deletePelayananAction,
  updatePelayananAction,
} from "./actions";
import {
  initialPelayananActionState,
  MAJELIS_POSITIONS,
  PELAYANAN_TYPES,
} from "./schema";

export type PelayananRow = {
  id: string;
  type: (typeof PELAYANAN_TYPES)[number];
  id_jemaat: string;
  name: string;
  rayon: string | null;
  gelar: string | null;
  jabatan: string | null;
  id_unsur: string | null;
  unsur: string | null;
  sektor: number | null;
  tgl_mulai: string;
  tgl_selesai: string | null;
  aktif: boolean;
};

type Option = { id: string; name: string };
type DialogMode = "create" | "edit" | "delete" | null;

type Props = {
  rows: PelayananRow[];
  jemaat: Option[];
  unsur: Option[];
  query: string;
  type: string;
  status: string;
};

const typeLabels = {
  PENDETA: "Pendeta",
  MAJELIS: "Majelis",
  PENGURUS: "Pengurus unsur",
} as const;

function formatDate(value: string | null) {
  if (!value) return "Belum ditentukan";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function PelayananManager({ rows, jemaat, unsur, query, type, status }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<DialogMode>(null);
  const [selected, setSelected] = useState<PelayananRow | null>(null);
  const [formType, setFormType] = useState<(typeof PELAYANAN_TYPES)[number]>("PENDETA");
  const action = mode === "edit"
    ? updatePelayananAction
    : mode === "delete"
      ? deletePelayananAction
      : createPelayananAction;
  const [state, formAction, pending] = useActionState(action, initialPelayananActionState);

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

  function updateFilter(name: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(name, value);
    else params.delete(name);
    router.replace(`/admin/pelayanan${params.size ? `?${params.toString()}` : ""}`);
  }

  function openDialog(nextMode: DialogMode, row: PelayananRow | null = null) {
    setMode(nextMode);
    setSelected(row);
    setFormType(row?.type ?? "PENDETA");
  }

  return (
    <>
      <section className="space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Data pelayanan</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Pelayan &amp; Pengurus</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Kelola masa bakti pendeta, majelis, dan pengurus unsur kategorial.
            </p>
          </div>
          <Button onClick={() => openDialog("create")}>
            <Plus aria-hidden="true" size={18} /> Tambah pelayanan
          </Button>
        </header>

        <div className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_14rem_12rem]">
            <InputText
              defaultValue={query}
              label="Cari pelayan"
              name="q"
              placeholder="Nama, jabatan, rayon, atau unsur"
              icon={<Search aria-hidden="true" size={18} />}
              onChange={(event) => updateFilter("q", event.target.value)}
            />
            <Select
              defaultValue={type}
              label="Jenis pelayanan"
              name="type-filter"
              options={PELAYANAN_TYPES.map((value) => ({ value, label: typeLabels[value] }))}
              placeholder="Semua jenis"
              onChange={(event: ChangeEvent<HTMLSelectElement>) => updateFilter("type", event.target.value)}
            />
            <Select
              defaultValue={status}
              label="Status"
              name="status-filter"
              options={[
                { value: "aktif", label: "Aktif" },
                { value: "nonaktif", label: "Tidak aktif" },
              ]}
              placeholder="Semua status"
              onChange={(event: ChangeEvent<HTMLSelectElement>) => updateFilter("status", event.target.value)}
            />
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-base-300 bg-base-100 p-10 text-center">
            <h2 className="font-semibold">Data pelayanan belum ditemukan</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">Ubah filter atau tambahkan data pelayanan baru.</p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {rows.map((row) => (
              <article key={`${row.type}-${row.id}`} className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="badge badge-outline">{typeLabels[row.type]}</span>
                      <span className={`badge ${row.aktif ? "badge-success" : "badge-ghost"}`}>
                        {row.aktif ? "Aktif" : "Tidak aktif"}
                      </span>
                    </div>
                    <h2 className="mt-3 truncate text-lg font-bold">{row.name}</h2>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {row.type === "PENDETA"
                        ? row.gelar || "Pendeta"
                        : row.type === "MAJELIS"
                          ? row.jabatan
                          : `${row.jabatan} · ${row.unsur}${row.sektor ? ` sektor ${row.sektor}` : ""}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button aria-label={`Edit ${row.name}`} square variant="ghost" onClick={() => openDialog("edit", row)}>
                      <Pencil aria-hidden="true" size={17} />
                    </Button>
                    <Button aria-label={`Hapus ${row.name}`} square variant="ghost" onClick={() => openDialog("delete", row)}>
                      <Trash2 aria-hidden="true" size={17} />
                    </Button>
                  </div>
                </div>
                <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-base-200 pt-4 text-sm">
                  <div>
                    <dt className="text-[var(--muted)]">Mulai</dt>
                    <dd className="mt-1 font-medium">{formatDate(row.tgl_mulai)}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--muted)]">Selesai</dt>
                    <dd className="mt-1 font-medium">{formatDate(row.tgl_selesai)}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-[var(--muted)]">Rayon</dt>
                    <dd className="mt-1 font-medium">{row.rayon ?? "Belum ditentukan"}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </section>

      {mode && (
        <div className="modal modal-open" role="dialog" aria-modal="true" aria-labelledby="pelayanan-dialog-title">
          <div className="modal-box max-h-[90dvh] max-w-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="pelayanan-dialog-title" className="text-xl font-bold">
                  {mode === "create" ? "Tambah pelayanan" : mode === "edit" ? "Edit pelayanan" : "Hapus pelayanan"}
                </h2>
                {mode === "delete" && <p className="mt-2 text-sm text-[var(--muted)]">Tindakan ini tidak dapat dibatalkan.</p>}
              </div>
              <Button aria-label="Tutup dialog" square type="button" variant="ghost" onClick={() => openDialog(null)}>
                <X aria-hidden="true" size={18} />
              </Button>
            </div>

            <form action={formAction} className="space-y-5">
              {selected && <input name="id" type="hidden" value={selected.id} />}
              {mode === "delete" ? (
                <>
                  <input name="type" type="hidden" value={selected?.type ?? ""} />
                  <input name="ringkasan" type="hidden" value={selected?.name ?? ""} />
                  <p>Hapus data pelayanan <strong>{selected?.name}</strong>?</p>
                </>
              ) : (
                <>
                  <Select
                    defaultValue={formType}
                    disabled={mode === "edit"}
                    error={state.errors?.type?.[0]}
                    label="Jenis pelayanan"
                    name={mode === "edit" ? "type-display" : "type"}
                    options={PELAYANAN_TYPES.map((value) => ({ value, label: typeLabels[value] }))}
                    required
                    onChange={(event: ChangeEvent<HTMLSelectElement>) => setFormType(event.target.value as (typeof PELAYANAN_TYPES)[number])}
                  />
                  {mode === "edit" && <input name="type" type="hidden" value={formType} />}
                  <Select
                    defaultValue={selected
                      ? { value: selected.id_jemaat, label: selected.name }
                      : null}
                    disabled={pending}
                    error={state.errors?.id_jemaat?.[0]}
                    label="Jemaat"
                    name="id_jemaat"
                    options={jemaat.map((item) => ({ value: item.id, label: item.name }))}
                    placeholder="Pilih jemaat"
                    required
                    variant="react-select"
                  />
                  {formType === "PENDETA" && (
                    <InputText defaultValue={selected?.gelar ?? ""} error={state.errors?.gelar?.[0]} label="Gelar pelayanan" name="gelar" placeholder="Contoh: Pdt. atau Vikaris" />
                  )}
                  {formType === "MAJELIS" && (
                    <Select
                      defaultValue={selected?.jabatan ?? ""}
                      error={state.errors?.jabatan?.[0]}
                      label="Jabatan majelis"
                      name="jabatan"
                      options={MAJELIS_POSITIONS.map((value) => ({ value, label: value === "PENATUA" ? "Penatua" : "Syamas" }))}
                      placeholder="Pilih jabatan"
                      required
                    />
                  )}
                  {formType === "PENGURUS" && (
                    <div className="grid gap-5 sm:grid-cols-2">
                      <InputText defaultValue={selected?.jabatan ?? ""} error={state.errors?.jabatan?.[0]} label="Jabatan pengurus" name="jabatan" required />
                      <InputText defaultValue={selected?.sektor?.toString() ?? ""} error={state.errors?.sektor?.[0]} label="Sektor" min="1" max="99" name="sektor" type="number" />
                      <div className="sm:col-span-2">
                        <Select
                          defaultValue={selected?.id_unsur ?? ""}
                          error={state.errors?.id_unsur?.[0]}
                          label="Unsur kategorial"
                          name="id_unsur"
                          options={unsur.map((item) => ({ value: item.id, label: item.name }))}
                          placeholder="Pilih unsur"
                          required
                        />
                      </div>
                    </div>
                  )}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <DatePicker defaultValue={selected?.tgl_mulai} error={state.errors?.tgl_mulai?.[0]} label="Tanggal mulai" name="tgl_mulai" required />
                    <DatePicker defaultValue={selected?.tgl_selesai ?? undefined} error={state.errors?.tgl_selesai?.[0]} label="Tanggal selesai" name="tgl_selesai" />
                  </div>
                  <Checkbox defaultChecked={selected?.aktif ?? true} label="Pelayanan masih aktif" name="aktif" />
                </>
              )}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="ghost" onClick={() => openDialog(null)}>Batal</Button>
                <Button className={mode === "delete" ? "btn-error" : ""} disabled={pending} loading={pending} type="submit">
                  {pending ? "Memproses..." : mode === "delete" ? "Hapus" : "Simpan"}
                </Button>
              </div>
            </form>
          </div>
          <button className="modal-backdrop" type="button" aria-label="Tutup dialog" onClick={() => openDialog(null)} />
        </div>
      )}
    </>
  );
}
