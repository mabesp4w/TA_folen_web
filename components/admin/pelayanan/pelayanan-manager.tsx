"use client";

import { useActionState, useEffect, useState, type ChangeEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { gooeyToast } from "goey-toast";
import { Button } from "@/components/ui/button";
import { InputText } from "@/components/ui/input-text";
import { Select } from "@/components/ui/select";
import {
  createPelayananAction,
  deletePelayananAction,
  updatePelayananAction,
} from "./actions";
import { PelayananForm } from "./pelayanan-form";
import {
  initialPelayananActionState,
  JABATAN_PENGURUS,
  MAJELIS_POSITIONS,
  PELAYANAN_TYPES,
} from "./schema";
import type { ResourcePermission } from "@/lib/permissions";

// Label jabatan majelis (nilai tersimpan huruf besar).
const MAJELIS_LABELS: Record<(typeof MAJELIS_POSITIONS)[number], string> = {
  PENATUA: "Penatua",
  SYAMAS: "Syamas",
};

// Opsi filter jabatan sesuai jenis pelayanan terpilih (selain pendeta).
function jabatanOptions(type: string): { value: string; label: string }[] {
  const majelis = MAJELIS_POSITIONS.map((value) => ({ value, label: MAJELIS_LABELS[value] }));
  const pengurus = JABATAN_PENGURUS.map((value) => ({ value, label: value }));
  if (type === "MAJELIS") return majelis;
  if (type === "PENGURUS") return pengurus;
  // "Semua jenis" (tetap bukan pendeta): gabungkan keduanya.
  return [...majelis, ...pengurus];
}

// Izin default penuh — dipakai bila prop tidak diberikan (mis. ADMIN).
const FULL_PERMISSION: ResourcePermission = {
  view: true,
  create: true,
  update: true,
  delete: true,
};

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
  jabatan: string;
  permission?: ResourcePermission;
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

export function PelayananManager({ rows, jemaat, unsur, query, type, status, jabatan, permission = FULL_PERMISSION }: Props) {
  const router = useRouter();
  const canModify = permission.update || permission.delete;
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
    // Mengganti jenis pelayanan me-reset filter jabatan (opsinya berbeda).
    if (name === "type") params.delete("jabatan");
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
          {permission.create && (
            <Button onClick={() => openDialog("create")}>
              <Plus aria-hidden="true" size={18} /> Tambah pelayanan
            </Button>
          )}
        </header>

        <div className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
            {/* Filter jabatan hanya muncul bila jenis pelayanan bukan pendeta. */}
            {type !== "PENDETA" && (
              <Select
                key={type || "all"}
                defaultValue={jabatan}
                label="Jabatan"
                name="jabatan-filter"
                options={jabatanOptions(type)}
                placeholder="Semua jabatan"
                onChange={(event: ChangeEvent<HTMLSelectElement>) => updateFilter("jabatan", event.target.value)}
              />
            )}
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
                  {canModify && (
                    <div className="flex shrink-0 gap-1">
                      {permission.update && (
                        <Button aria-label={`Edit ${row.name}`} square variant="ghost" onClick={() => openDialog("edit", row)}>
                          <Pencil aria-hidden="true" size={17} />
                        </Button>
                      )}
                      {permission.delete && (
                        <Button aria-label={`Hapus ${row.name}`} square variant="ghost" onClick={() => openDialog("delete", row)}>
                          <Trash2 aria-hidden="true" size={17} />
                        </Button>
                      )}
                    </div>
                  )}
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

            {mode === "delete" ? (
              <form action={formAction} className="space-y-5">
                {selected && <input name="id" type="hidden" value={selected.id} />}
                <input name="type" type="hidden" value={selected?.type ?? ""} />
                <input name="ringkasan" type="hidden" value={selected?.name ?? ""} />
                <p>Hapus data pelayanan <strong>{selected?.name}</strong>?</p>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="ghost" onClick={() => openDialog(null)}>Batal</Button>
                  <Button className="btn-error" disabled={pending} loading={pending} type="submit">
                    {pending ? "Memproses..." : "Hapus"}
                  </Button>
                </div>
              </form>
            ) : (
              <PelayananForm
                formAction={formAction}
                formType={formType}
                jemaat={jemaat}
                mode={mode}
                pending={pending}
                selected={selected}
                state={state}
                unsur={unsur}
                onCancel={() => openDialog(null)}
                onTypeChange={setFormType}
              />
            )}
          </div>
          <button className="modal-backdrop" type="button" aria-label="Tutup dialog" onClick={() => openDialog(null)} />
        </div>
      )}
    </>
  );
}
