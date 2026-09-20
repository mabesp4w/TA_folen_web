"use client";

import { useActionState, useEffect, useState, type ChangeEvent } from "react";
import { CircleDollarSign, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { gooeyToast } from "goey-toast";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { InputText } from "@/components/ui/input-text";
import { Select, type SelectOption } from "@/components/ui/select";
import {
  createKeuanganAction,
  deleteKeuanganAction,
  updateKeuanganAction,
} from "./actions";
import {
  initialKeuanganActionState,
  KATEGORI_KEUANGAN,
  LABEL_KATEGORI_KEUANGAN,
} from "./schema";

export type KeuanganRow = {
  id: string;
  id_ibadah: string | null;
  ibadah: string | null;
  tanggalIbadah: string | null;
  kategori: string;
  nm_pemberi: string | null;
  jumlah: number;
  keterangan: string | null;
  createdAt: string;
};

export type IbadahOption = { id: string; label: string };
type DialogMode = "create" | "edit" | "delete" | null;

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});
const tanggal = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });

function categoryLabel(value: string) {
  return LABEL_KATEGORI_KEUANGAN[
    value as keyof typeof LABEL_KATEGORI_KEUANGAN
  ] ?? value;
}

export function KeuanganManager({
  rows,
  ibadah,
}: {
  rows: KeuanganRow[];
  ibadah: IbadahOption[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<DialogMode>(null);
  const [selected, setSelected] = useState<KeuanganRow | null>(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const action =
    mode === "create"
      ? createKeuanganAction
      : mode === "edit"
        ? updateKeuanganAction
        : deleteKeuanganAction;
  const [state, formAction, pending] = useActionState(
    action,
    initialKeuanganActionState,
  );

  useEffect(() => {
    if (state.status === "success") {
      gooeyToast.success(state.message ?? "Data berhasil diproses.");
      queueMicrotask(() => {
        setMode(null);
        setSelected(null);
        router.refresh();
      });
    } else if (state.status === "error" && state.message) {
      gooeyToast.error(state.message);
    }
  }, [router, state]);

  function openDialog(nextMode: DialogMode, row: KeuanganRow | null = null) {
    if (pending) return;
    setSelected(row);
    setMode(nextMode);
  }

  const normalizedQuery = query.trim().toLocaleLowerCase("id-ID");
  const filteredRows = rows.filter((row) => {
    const matchesCategory = !categoryFilter || row.kategori === categoryFilter;
    const haystack = [
      row.nm_pemberi,
      row.ibadah,
      categoryLabel(row.kategori),
      row.keterangan,
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("id-ID");
    return matchesCategory && (!normalizedQuery || haystack.includes(normalizedQuery));
  });
  const total = filteredRows.reduce((sum, row) => sum + row.jumlah, 0);
  const ibadahOptions = ibadah.map((item) => ({ value: item.id, label: item.label }));
  const selectedIbadah: SelectOption | null = selected?.id_ibadah
    ? ibadahOptions.find((item) => item.value === selected.id_ibadah) ?? null
    : null;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-sm font-semibold text-[var(--forest)]">Administrasi gereja</p>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--ink)]">Keuangan</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
            Kelola penerimaan persembahan dan hubungkan dengan ibadah bila tersedia.
          </p>
        </div>
        <Button type="button" onClick={() => openDialog("create")}>
          <Plus aria-hidden="true" size={18} /> Tambah penerimaan
        </Button>
      </header>

      <section
        aria-label="Ringkasan penerimaan"
        className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 shadow-sm"
      >
        <div className="flex items-center gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[var(--forest)] text-[var(--paper)]">
            <CircleDollarSign aria-hidden="true" size={24} />
          </span>
          <div className="min-w-0">
            <p className="text-sm text-[var(--muted)]">Total penerimaan ditampilkan</p>
            <p className="break-words text-2xl font-bold text-[var(--ink)]">{rupiah.format(total)}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {filteredRows.length} dari {rows.length} catatan
            </p>
          </div>
        </div>
      </section>

      <section
        aria-label="Filter penerimaan"
        className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(220px,280px)]"
      >
        <InputText
          icon={<Search aria-hidden="true" size={17} />}
          label="Cari penerimaan"
          name="keuangan-search"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Nama pemberi, ibadah, atau keterangan"
          type="search"
          value={query}
        />
        <Select
          label="Filter kategori"
          name="keuangan-category-filter"
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            setCategoryFilter(event.target.value)
          }
          options={KATEGORI_KEUANGAN.map((value) => ({
            value,
            label: LABEL_KATEGORI_KEUANGAN[value],
          }))}
          placeholder="Semua kategori"
          value={categoryFilter}
        />
      </section>

      {filteredRows.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--paper)] px-6 py-14 text-center">
          <CircleDollarSign aria-hidden="true" className="mx-auto text-[var(--muted)]" size={34} />
          <h2 className="mt-4 text-lg font-bold text-[var(--ink)]">
            {rows.length ? "Penerimaan tidak ditemukan" : "Belum ada penerimaan"}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
            {rows.length
              ? "Coba ubah kata pencarian atau filter kategori."
              : "Tambahkan penerimaan pertama untuk mulai mencatat persembahan."}
          </p>
        </section>
      ) : (
        <section aria-label="Daftar penerimaan" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredRows.map((row) => (
            <article
              className="flex min-w-0 flex-col rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 shadow-sm"
              key={row.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="badge badge-outline mb-2">{categoryLabel(row.kategori)}</span>
                  <h2 className="break-words font-bold text-[var(--ink)]">
                    {row.nm_pemberi ?? "Pemberi tidak disebutkan"}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {row.ibadah ?? "Tidak terkait ibadah"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    aria-label={`Edit penerimaan ${row.nm_pemberi ?? "tanpa nama"}`}
                    square
                    type="button"
                    variant="ghost"
                    onClick={() => openDialog("edit", row)}
                  >
                    <Pencil aria-hidden="true" size={17} />
                  </Button>
                  <Button
                    aria-label={`Hapus penerimaan ${row.nm_pemberi ?? "tanpa nama"}`}
                    square
                    type="button"
                    variant="ghost"
                    onClick={() => openDialog("delete", row)}
                  >
                    <Trash2 aria-hidden="true" size={17} />
                  </Button>
                </div>
              </div>
              <p className="mt-5 break-words text-xl font-bold text-[var(--forest)]">
                {rupiah.format(row.jumlah)}
              </p>
              {row.keterangan && (
                <p className="mt-3 line-clamp-3 break-words text-sm text-[var(--muted)]">
                  {row.keterangan}
                </p>
              )}
              <p className="mt-auto pt-5 text-xs text-[var(--muted)]">
                {row.tanggalIbadah
                  ? `Ibadah ${tanggal.format(new Date(row.tanggalIbadah))}`
                  : `Dicatat ${tanggal.format(new Date(row.createdAt))}`}
              </p>
            </article>
          ))}
        </section>
      )}

      {mode && (
        <div
          aria-labelledby="keuangan-dialog-title"
          aria-modal="true"
          className="modal modal-open"
          role="dialog"
        >
          <div className="modal-box max-h-[90dvh] max-w-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold" id="keuangan-dialog-title">
                  {mode === "create"
                    ? "Tambah penerimaan"
                    : mode === "edit"
                      ? "Edit penerimaan"
                      : "Hapus penerimaan"}
                </h2>
                {mode === "delete" && (
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Tindakan ini tidak dapat dibatalkan.
                  </p>
                )}
              </div>
              <Button
                aria-label="Tutup dialog"
                disabled={pending}
                square
                type="button"
                variant="ghost"
                onClick={() => openDialog(null)}
              >
                <X aria-hidden="true" size={18} />
              </Button>
            </div>

            <form action={formAction} className="space-y-5">
              {selected && <input name="id" type="hidden" value={selected.id} />}
              {mode === "delete" ? (
                <>
                  <input
                    name="ringkasan"
                    type="hidden"
                    value={`${selected?.kategori ?? "Penerimaan"} - ${selected?.nm_pemberi ?? "Tanpa nama"}`}
                  />
                  <p>
                    Hapus penerimaan <strong>{selected ? rupiah.format(selected.jumlah) : ""}</strong>{" "}
                    dari <strong>{selected?.nm_pemberi ?? "pemberi tidak disebutkan"}</strong>?
                  </p>
                </>
              ) : (
                <>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Select
                      defaultValue={selectedIbadah}
                      error={state.errors?.id_ibadah?.[0]}
                      helpText="Opsional, pilih ibadah tempat persembahan diterima."
                      label="Ibadah"
                      name="id_ibadah"
                      options={ibadahOptions}
                      placeholder="Tidak terkait ibadah"
                      variant="react-select"
                    />
                    <Select
                      defaultValue={selected?.kategori ?? ""}
                      error={state.errors?.kategori?.[0]}
                      label="Kategori"
                      name="kategori"
                      options={KATEGORI_KEUANGAN.map((value) => ({
                        value,
                        label: LABEL_KATEGORI_KEUANGAN[value],
                      }))}
                      placeholder="Pilih kategori"
                      required
                    />
                    <InputText
                      defaultValue={selected?.nm_pemberi ?? ""}
                      error={state.errors?.nm_pemberi?.[0]}
                      label="Nama pemberi"
                      name="nm_pemberi"
                      placeholder="Contoh: Kel. Victor Pekpekay"
                    />
                    <InputText
                      defaultValue={selected?.jumlah.toString() ?? ""}
                      error={state.errors?.jumlah?.[0]}
                      helpText="Masukkan Rupiah tanpa titik, koma, atau simbol mata uang."
                      inputMode="numeric"
                      label="Jumlah (Rp)"
                      max="2147483647"
                      min="1"
                      name="jumlah"
                      placeholder="Contoh: 250000"
                      required
                      step="1"
                      type="number"
                    />
                  </div>
                  <FormField
                    error={state.errors?.keterangan?.[0]}
                    id="keterangan"
                    label="Keterangan"
                  >
                    <textarea
                      aria-invalid={Boolean(state.errors?.keterangan?.[0])}
                      className={`textarea textarea-bordered min-h-28 w-full ${state.errors?.keterangan?.[0] ? "textarea-error" : ""}`}
                      defaultValue={selected?.keterangan ?? ""}
                      id="keterangan"
                      maxLength={5000}
                      name="keterangan"
                      placeholder="Keterangan penerimaan atau ucapan syukur"
                    />
                  </FormField>
                </>
              )}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  disabled={pending}
                  type="button"
                  variant="ghost"
                  onClick={() => openDialog(null)}
                >
                  Batal
                </Button>
                <Button
                  className={mode === "delete" ? "btn-error" : ""}
                  disabled={pending}
                  loading={pending}
                  type="submit"
                >
                  {pending ? "Memproses..." : mode === "delete" ? "Hapus" : "Simpan"}
                </Button>
              </div>
            </form>
          </div>
          <button
            aria-label="Tutup dialog"
            className="modal-backdrop"
            disabled={pending}
            type="button"
            onClick={() => openDialog(null)}
          />
        </div>
      )}
    </div>
  );
}
