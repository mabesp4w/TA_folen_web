"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import { gooeyToast } from "goey-toast";
import { Button } from "@/components/ui/button";
import {
  createUserAction,
  deleteUserAction,
  updateUserAction,
} from "./actions";
import { UserForm } from "./user-form";
import { initialUserActionState, USER_ROLES } from "./schema";

export type PengurusOption = {
  id: string;
  label: string;
  // Jabatan pengurus (mis. "Ketua", "Koordinator") — dipakai menyaring opsi per peran.
  jabatan: string;
};

export type UserRow = {
  id: string;
  username: string;
  role: (typeof USER_ROLES)[number];
  createdAt: string;
  pengurus: string | null;
  pengurusId: string | null;
};

type DialogMode = "create" | "edit" | "delete" | null;

type Props = {
  rows: UserRow[];
  pengurusOptions: PengurusOption[];
  currentUserId: string;
};

const roleLabels: Record<(typeof USER_ROLES)[number], string> = {
  ADMIN: "Administrator",
  KETUA_UNSUR: "Ketua Unsur",
  KOORDINATOR_UNSUR: "Koordinator Unsur",
};

export function UserManager({ rows, pengurusOptions, currentUserId }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<DialogMode>(null);
  const [selected, setSelected] = useState<UserRow | null>(null);
  // Default peran untuk akun baru: Ketua Unsur (Administrator tidak dibuat lewat UI).
  const [role, setRole] = useState<(typeof USER_ROLES)[number]>("KETUA_UNSUR");

  const action =
    mode === "edit"
      ? updateUserAction
      : mode === "delete"
        ? deleteUserAction
        : createUserAction;
  const [state, formAction, pending] = useActionState(action, initialUserActionState);

  useEffect(() => {
    if (state.status === "success") {
      gooeyToast.success(state.message ?? "Data akun berhasil disimpan.");
      queueMicrotask(closeDialog);
      router.refresh();
    } else if (state.status === "error" && state.message) {
      gooeyToast.error(state.message);
    }
  }, [router, state]);

  function closeDialog() {
    setMode(null);
    setSelected(null);
  }

  function openDialog(nextMode: DialogMode, row: UserRow | null = null) {
    setSelected(row);
    setRole(row?.role ?? "KETUA_UNSUR");
    setMode(nextMode);
  }

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--forest)]">
            Pengaturan
          </p>
          <h1 className="mt-1 text-3xl font-bold text-[var(--ink)]">Akun Akses</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
            Kelola akun login administrator dan ketua unsur beserta perannya.
          </p>
        </div>
        <Button type="button" onClick={() => openDialog("create")}>
          <Plus size={18} aria-hidden="true" />
          Tambah akun
        </Button>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--paper)] p-10 text-center">
          <ShieldCheck aria-hidden="true" className="mx-auto text-[var(--muted)]" size={40} />
          <h2 className="mt-4 text-lg font-semibold">Belum ada akun</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">Tambahkan akun pertama untuk akses admin.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--paper)] shadow-sm">
          <table className="table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Peran</th>
                <th>Pengurus tertaut</th>
                <th>Dibuat</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="font-semibold">
                    {row.username}
                    {row.id === currentUserId && (
                      <span className="ml-2 badge badge-sm badge-neutral">Anda</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${row.role === "ADMIN" ? "badge-success" : "badge-ghost"}`}>
                      {roleLabels[row.role]}
                    </span>
                  </td>
                  <td>{row.pengurus ?? <span className="text-[var(--muted)]">—</span>}</td>
                  <td className="text-sm text-[var(--muted)]">{row.createdAt}</td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <Button
                        aria-label={`Edit akun ${row.username}`}
                        size="sm"
                        square
                        type="button"
                        variant="ghost"
                        onClick={() => openDialog("edit", row)}
                      >
                        <Pencil size={16} aria-hidden="true" />
                      </Button>
                      <Button
                        aria-label={`Hapus akun ${row.username}`}
                        className="text-error"
                        disabled={row.id === currentUserId}
                        size="sm"
                        square
                        type="button"
                        variant="ghost"
                        onClick={() => openDialog("delete", row)}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {mode && (
        <div
          aria-labelledby="user-dialog-title"
          aria-modal="true"
          className="modal modal-open"
          role="dialog"
        >
          <div className="modal-box max-w-lg bg-[var(--paper)]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <h2 className="text-xl font-bold" id="user-dialog-title">
                {mode === "create" ? "Tambah akun" : mode === "edit" ? "Edit akun" : "Hapus akun"}
              </h2>
              <Button aria-label="Tutup dialog" size="sm" square type="button" variant="ghost" onClick={closeDialog}>
                <X size={18} aria-hidden="true" />
              </Button>
            </div>

            {mode === "delete" ? (
              <form action={formAction} className="space-y-5">
                {selected && <input name="id" type="hidden" value={selected.id} />}
                <input name="ringkasan" type="hidden" value={selected?.username ?? ""} />
                <div className="rounded-xl border border-error/30 bg-error/10 p-4 text-sm">
                  Hapus akun <strong>{selected?.username}</strong>? Jejak log aktivitasnya tetap tersimpan,
                  namun akun tidak dapat login lagi.
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={closeDialog}>
                    Batal
                  </Button>
                  <Button
                    className="btn-error"
                    disabled={pending}
                    loading={pending}
                    type="submit"
                  >
                    {pending ? "Memproses..." : "Hapus"}
                  </Button>
                </div>
              </form>
            ) : (
              <UserForm
                formAction={formAction}
                mode={mode}
                pending={pending}
                pengurusOptions={pengurusOptions}
                role={role}
                selected={selected}
                state={state}
                onCancel={closeDialog}
                onRoleChange={setRole}
              />
            )}
          </div>
          <button aria-label="Tutup dialog" className="modal-backdrop" type="button" onClick={closeDialog} />
        </div>
      )}
    </>
  );
}
