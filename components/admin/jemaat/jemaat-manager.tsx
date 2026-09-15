"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { InputText } from "@/components/ui/input-text";
import { Select } from "@/components/ui/select";
import {
  createJemaatAction,
  deleteJemaatAction,
  updateJemaatAction,
} from "./actions";
import {
  FAMILY_STATUSES,
  initialActionState,
  JEMAAT_GENDERS,
  JEMAAT_STATUSES,
} from "./schema";

export type JemaatRow = {
  id: string;
  nm_lengkap: string;
  tgl_lahir: string;
  jenkel: string;
  stat_keluarga: string;
  alamat_blok: string;
  status: string;
  id_rayon: string | null;
  rayon: { nm_rayon: string } | null;
};

type RayonOption = { id: string; nm_rayon: string };
type DialogMode = "create" | "edit" | "delete" | null;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function JemaatManager({
  jemaat,
  rayons,
  query,
  rayon,
  status,
}: {
  jemaat: JemaatRow[];
  rayons: RayonOption[];
  query: string;
  rayon: string;
  status: string;
}) {
  const [mode, setMode] = useState<DialogMode>(null);
  const [selected, setSelected] = useState<JemaatRow | null>(null);
  const mutationAction = mode === "edit" ? updateJemaatAction : createJemaatAction;
  const [formState, formAction, formPending] = useActionState(
    mutationAction,
    initialActionState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteJemaatAction,
    initialActionState,
  );

  useEffect(() => {
    const state = mode === "delete" ? deleteState : formState;
    if (state.status !== "success") return;

    const timer = window.setTimeout(() => {
      setMode(null);
      setSelected(null);
    }, 800);

    return () => window.clearTimeout(timer);
  }, [deleteState, formState, mode]);

  function closeDialog() {
    setMode(null);
    setSelected(null);
  }

  function edit(row: JemaatRow) {
    setSelected(row);
    setMode("edit");
  }

  function remove(row: JemaatRow) {
    setSelected(row);
    setMode("delete");
  }

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Administrasi
          </p>
          <h1 className="mt-1 text-3xl font-bold text-[var(--ink)]">Data Jemaat</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Kelola identitas, rayon, dan status keanggotaan jemaat.
          </p>
        </div>
        <button
          className="btn border-0 bg-[var(--forest)] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          type="button"
          onClick={() => {
            setSelected(null);
            setMode("create");
          }}
        >
          <Plus size={18} aria-hidden="true" />
          Tambah jemaat
        </button>
      </header>

      <form
        className="mb-5 grid gap-3 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-4 md:grid-cols-[minmax(220px,1fr)_220px_180px_auto] md:items-end"
        method="get"
        aria-label="Cari dan filter data jemaat"
      >
        <InputText
          defaultValue={query}
          icon={<Search size={17} aria-hidden="true" />}
          label="Pencarian"
          name="q"
          placeholder="Nama atau alamat blok"
          type="search"
        />
        <Select
          defaultValue={rayon}
          label="Rayon"
          name="rayon"
          options={[
            { value: "", label: "Semua rayon" },
            ...rayons.map((item) => ({ value: item.id, label: item.nm_rayon })),
          ]}
        />
        <Select
          defaultValue={status}
          label="Status"
          name="status"
          options={[
            { value: "", label: "Semua status" },
            ...JEMAAT_STATUSES.map((item) => ({ value: item, label: item })),
          ]}
        />
        <button className="btn btn-outline" type="submit">
          Terapkan
        </button>
      </form>

      {jemaat.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--paper)] p-10 text-center text-[var(--muted)]">
          Tidak ada data jemaat yang sesuai dengan pencarian dan filter.
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--paper)] md:block">
            <table className="table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Rayon</th>
                  <th>Tanggal lahir</th>
                  <th>Keluarga</th>
                  <th>Status</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {jemaat.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.nm_lengkap}</strong>
                      <div className="text-xs text-[var(--muted)]">
                        {row.jenkel === "L" ? "Laki-laki" : "Perempuan"} · {row.alamat_blok}
                      </div>
                    </td>
                    <td>{row.rayon?.nm_rayon ?? "Belum ditentukan"}</td>
                    <td>{formatDate(row.tgl_lahir)}</td>
                    <td>{row.stat_keluarga.replace("_", " ")}</td>
                    <td><span className="badge badge-outline">{row.status}</span></td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <button
                          className="btn btn-ghost btn-sm"
                          type="button"
                          aria-label={`Edit ${row.nm_lengkap}`}
                          onClick={() => edit(row)}
                        >
                          <Pencil size={16} aria-hidden="true" />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm text-error"
                          type="button"
                          aria-label={`Hapus ${row.nm_lengkap}`}
                          onClick={() => remove(row)}
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:hidden">
            {jemaat.map((row) => (
              <article
                className="min-w-0 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-4"
                key={row.id}
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="break-words font-bold text-[var(--ink)]">{row.nm_lengkap}</h2>
                    <p className="break-words text-sm text-[var(--muted)]">
                      {row.rayon?.nm_rayon ?? "Tanpa rayon"} · {row.alamat_blok}
                    </p>
                  </div>
                  <span className="badge badge-outline shrink-0">{row.status}</span>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-[var(--muted)]">Tanggal lahir</dt>
                    <dd>{formatDate(row.tgl_lahir)}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--muted)]">Status keluarga</dt>
                    <dd>{row.stat_keluarga.replace("_", " ")}</dd>
                  </div>
                </dl>
                <div className="mt-4 flex gap-2">
                  <button className="btn btn-outline btn-sm flex-1" type="button" onClick={() => edit(row)}>
                    <Pencil size={15} aria-hidden="true" /> Edit
                  </button>
                  <button className="btn btn-outline btn-error btn-sm flex-1" type="button" onClick={() => remove(row)}>
                    <Trash2 size={15} aria-hidden="true" /> Hapus
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {mode && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/40 sm:place-items-center sm:p-6">
          <section
            className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-[var(--paper)] p-5 shadow-2xl sm:max-w-2xl sm:rounded-2xl sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="jemaat-dialog-title"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold" id="jemaat-dialog-title">
                  {mode === "create" ? "Tambah jemaat" : mode === "edit" ? "Edit jemaat" : "Hapus jemaat"}
                </h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {mode === "delete"
                    ? `Data ${selected?.nm_lengkap} akan dihapus permanen.`
                    : "Lengkapi seluruh data wajib di bawah ini."}
                </p>
              </div>
              <button className="btn btn-ghost btn-square btn-sm" type="button" aria-label="Tutup dialog" onClick={closeDialog}>
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            {mode === "delete" ? (
              <form action={deleteAction}>
                <input name="id" type="hidden" value={selected?.id ?? ""} />
                {deleteState.message && (
                  <div className={`alert mb-4 ${deleteState.status === "error" ? "alert-error" : "alert-success"}`} role="status">
                    {deleteState.message}
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <button className="btn btn-ghost" type="button" onClick={closeDialog}>Batal</button>
                  <button className="btn btn-error" disabled={deletePending} type="submit">
                    {deletePending ? "Menghapus..." : "Hapus permanen"}
                  </button>
                </div>
              </form>
            ) : (
              <form action={formAction} className="grid gap-4 sm:grid-cols-2">
                <input name="id" type="hidden" value={selected?.id ?? ""} />
                {formState.message && (
                  <div className={`alert sm:col-span-2 ${formState.status === "error" ? "alert-error" : "alert-success"}`} role="status">
                    {formState.message}
                  </div>
                )}
                <InputText className="w-full" defaultValue={selected?.nm_lengkap} error={formState.errors?.nm_lengkap?.[0]} label="Nama lengkap" name="nm_lengkap" required />
                <div>
                  <label className="mb-2 block text-sm font-medium" htmlFor="tgl_lahir">Tanggal lahir <span aria-hidden="true">*</span></label>
                  <input className="input input-bordered w-full" defaultValue={selected?.tgl_lahir.slice(0, 10)} id="tgl_lahir" name="tgl_lahir" required type="date" aria-invalid={Boolean(formState.errors?.tgl_lahir)} aria-describedby={formState.errors?.tgl_lahir ? "tgl_lahir-error" : undefined} />
                  {formState.errors?.tgl_lahir?.[0] && <p className="mt-1 text-sm text-error" id="tgl_lahir-error">{formState.errors.tgl_lahir[0]}</p>}
                </div>
                <fieldset aria-describedby={formState.errors?.jenkel ? "jenkel-error" : undefined}>
                  <legend className="mb-2 text-sm font-medium">
                    Jenis kelamin <span aria-hidden="true">*</span>
                  </legend>
                  <div className="flex min-h-12 items-center gap-6 rounded-lg border border-base-300 px-4">
                    {JEMAAT_GENDERS.map((item) => (
                      <label className="flex cursor-pointer items-center gap-2" key={item}>
                        <input
                          className="radio radio-sm"
                          defaultChecked={selected?.jenkel === item}
                          name="jenkel"
                          required
                          type="radio"
                          value={item}
                        />
                        <span>{item === "L" ? "Laki-laki" : "Perempuan"}</span>
                      </label>
                    ))}
                  </div>
                  {formState.errors?.jenkel?.[0] && (
                    <p className="mt-1 text-sm text-error" id="jenkel-error">
                      {formState.errors.jenkel[0]}
                    </p>
                  )}
                </fieldset>
                <Select defaultValue={selected?.stat_keluarga ?? ""} error={formState.errors?.stat_keluarga?.[0]} label="Status keluarga" name="stat_keluarga" options={FAMILY_STATUSES.map((item) => ({ value: item, label: item.replace("_", " ") }))} placeholder="Pilih status keluarga" required />
                <InputText className="w-full" defaultValue={selected?.alamat_blok} error={formState.errors?.alamat_blok?.[0]} label="Alamat blok" name="alamat_blok" required />
                <Select defaultValue={selected?.id_rayon ?? ""} error={formState.errors?.id_rayon?.[0]} label="Rayon" name="id_rayon" options={rayons.map((item) => ({ value: item.id, label: item.nm_rayon }))} placeholder="Belum ditentukan" />
                <Select defaultValue={selected?.status ?? "AKTIF"} error={formState.errors?.status?.[0]} label="Status jemaat" name="status" options={JEMAAT_STATUSES.map((item) => ({ value: item, label: item }))} required />
                <div className="flex items-end justify-end gap-2">
                  <button className="btn btn-ghost" type="button" onClick={closeDialog}>Batal</button>
                  <button className="btn border-0 bg-[var(--forest)] text-white" disabled={formPending} type="submit">
                    {formPending ? "Menyimpan..." : mode === "edit" ? "Simpan perubahan" : "Tambah jemaat"}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </>
  );
}
