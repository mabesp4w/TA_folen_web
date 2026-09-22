"use client";

import { useEffect, useMemo, useRef, useState, useActionState } from "react";
import { Eye, Info, Save, ShieldCheck } from "lucide-react";
import { gooeyToast } from "goey-toast";
import { Button } from "@/components/ui/button";
import {
  ACTION_LABELS,
  AUTHORIZABLE_RESOURCES,
  MANAGED_ROLES,
  PERMISSION_ACTIONS,
  ROLE_LABELS,
  isViewOnlyResource,
  type AuthorizableResource,
  type ManagedRole,
  type PermissionAction,
  type PermissionMatrix,
} from "@/lib/permissions";
import { savePermissionsAction } from "./actions";
import { initialOtorisasiActionState } from "./schema";

type RoleMatrices = Record<ManagedRole, PermissionMatrix>;

// Aksi tulis (selain "view") — dipakai untuk aturan ketergantungan view.
const WRITE_ACTIONS = PERMISSION_ACTIONS.filter((a) => a !== "view") as Exclude<
  PermissionAction,
  "view"
>[];

// Terapkan aturan integritas pada satu sel resource:
// - Mengaktifkan aksi tulis memaksa "view" ikut aktif.
// - Menonaktifkan "view" mematikan seluruh aksi tulis.
function applyDependency(
  perm: Record<PermissionAction, boolean>,
  action: PermissionAction,
  value: boolean,
): Record<PermissionAction, boolean> {
  const next = { ...perm, [action]: value };
  if (action === "view" && !value) {
    for (const w of WRITE_ACTIONS) next[w] = false;
  }
  if (action !== "view" && value) {
    next.view = true;
  }
  return next;
}

function activeCount(matrix: PermissionMatrix): number {
  return Object.values(matrix).reduce(
    (sum, perm) => sum + PERMISSION_ACTIONS.filter((a) => perm[a]).length,
    0,
  );
}

// Kelompokkan resource sesuai grup sidebar untuk keterbacaan tabel.
const RESOURCE_GROUPS: { group: string; items: AuthorizableResource[] }[] = [];
for (const resource of AUTHORIZABLE_RESOURCES) {
  const last = RESOURCE_GROUPS[RESOURCE_GROUPS.length - 1];
  if (last && last.group === resource.group) {
    last.items.push(resource);
  } else {
    RESOURCE_GROUPS.push({ group: resource.group, items: [resource] });
  }
}

export function OtorisasiManager({ initialMatrices }: { initialMatrices: RoleMatrices }) {
  const [activeRole, setActiveRole] = useState<ManagedRole>(MANAGED_ROLES[0]);
  const [matrices, setMatrices] = useState<RoleMatrices>(initialMatrices);
  // Baseline tersimpan untuk mendeteksi perubahan yang belum disimpan.
  const [baseline, setBaseline] = useState<RoleMatrices>(initialMatrices);

  const [state, formAction, pending] = useActionState(
    savePermissionsAction,
    initialOtorisasiActionState,
  );
  const handledStateRef = useRef<typeof initialOtorisasiActionState | null>(null);

  const current = matrices[activeRole];
  const currentJson = useMemo(() => JSON.stringify(current), [current]);
  const isDirty = currentJson !== JSON.stringify(baseline[activeRole]);

  useEffect(() => {
    if (!state.message || handledStateRef.current === state) return;
    handledStateRef.current = state;

    if (state.status === "error") {
      gooeyToast.error(state.message);
      return;
    }

    if (state.status !== "success") return;

    gooeyToast.success(state.message);
    // Segarkan baseline role aktif agar tombol simpan kembali nonaktif.
    // Ditunda agar tidak memanggil setState sinkron di dalam efek.
    const timer = window.setTimeout(() => {
      setBaseline((prev) => ({ ...prev, [activeRole]: matrices[activeRole] }));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [state, activeRole, matrices]);

  function setCell(resource: string, action: PermissionAction, value: boolean) {
    setMatrices((prev) => ({
      ...prev,
      [activeRole]: {
        ...prev[activeRole],
        [resource]: applyDependency(prev[activeRole][resource], action, value),
      },
    }));
  }

  function setRow(resource: string, value: boolean) {
    // Resource hanya-lihat: hanya "view" yang berlaku.
    const next = isViewOnlyResource(resource)
      ? { view: value, create: false, update: false, delete: false }
      : { view: value, create: value, update: value, delete: value };
    setMatrices((prev) => ({
      ...prev,
      [activeRole]: { ...prev[activeRole], [resource]: next },
    }));
  }

  function setColumn(action: PermissionAction, value: boolean) {
    setMatrices((prev) => {
      const roleMatrix = prev[activeRole];
      const nextRole: PermissionMatrix = {};
      for (const key of Object.keys(roleMatrix)) {
        // Aksi tulis tidak berlaku untuk resource hanya-lihat.
        if (action !== "view" && isViewOnlyResource(key)) {
          nextRole[key] = roleMatrix[key];
          continue;
        }
        nextRole[key] = applyDependency(roleMatrix[key], action, value);
      }
      return { ...prev, [activeRole]: nextRole };
    });
  }

  function resetChanges() {
    setMatrices((prev) => ({ ...prev, [activeRole]: baseline[activeRole] }));
  }

  // Resource hanya-lihat dianggap "semua" cukup dengan view.
  const rowAllChecked = (resource: string) =>
    isViewOnlyResource(resource)
      ? current[resource].view
      : PERMISSION_ACTIONS.every((a) => current[resource][a]);
  // Kolom aksi tulis mengabaikan resource hanya-lihat saat menghitung "semua".
  const colAllChecked = (action: PermissionAction) =>
    AUTHORIZABLE_RESOURCES.filter(
      (r) => action === "view" || !r.viewOnly,
    ).every((r) => current[r.key][action]);

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Pengaturan
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-3xl font-bold text-[var(--ink)]">
            <ShieldCheck size={28} className="text-[var(--forest)]" aria-hidden="true" />
            Hak Akses
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
            Atur apa yang boleh dilihat, ditambah, diubah, atau dihapus oleh setiap
            peran. Administrator selalu memiliki akses penuh.
          </p>
        </div>
      </header>

      <div className="mb-4 flex items-start gap-2 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3 text-sm text-[var(--muted)]">
        <Info size={17} className="mt-0.5 shrink-0 text-[var(--pacific)]" aria-hidden="true" />
        <p>
          Aksi <strong>Tambah</strong>, <strong>Ubah</strong>, atau{" "}
          <strong>Hapus</strong> otomatis mengaktifkan <strong>Lihat</strong> —
          sebuah peran tidak dapat mengubah data pada modul yang tidak boleh
          dilihatnya.
        </p>
      </div>

      {/* Tab per role */}
      <div role="tablist" aria-label="Pilih peran" className="tabs tabs-boxed mb-5 w-fit bg-[var(--paper)] p-1">
        {MANAGED_ROLES.map((role) => {
          const selected = role === activeRole;
          const dirty = JSON.stringify(matrices[role]) !== JSON.stringify(baseline[role]);
          return (
            <button
              key={role}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveRole(role)}
              className={`tab gap-2 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pacific)] ${
                selected ? "tab-active !bg-[var(--forest)] !text-white" : "text-[var(--ink)]"
              }`}
            >
              {ROLE_LABELS[role]}
              <span
                className={`badge badge-sm ${selected ? "badge-ghost" : "badge-outline"}`}
                aria-label={`${activeCount(matrices[role])} izin aktif`}
              >
                {activeCount(matrices[role])}
              </span>
              {dirty && (
                <span
                  className="size-2 rounded-full bg-[var(--gold)]"
                  aria-label="Ada perubahan belum disimpan"
                />
              )}
            </button>
          );
        })}
      </div>

      <form action={formAction}>
        <input type="hidden" name="role" value={activeRole} />
        <input type="hidden" name="matrix" value={currentJson} />

        {/* Tabel matriks — desktop */}
        <div className="hidden overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--paper)] lg:block">
          <table className="table">
            <thead>
              <tr>
                <th className="w-[38%]">Modul</th>
                {PERMISSION_ACTIONS.map((action) => (
                  <th key={action} className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="inline-flex items-center gap-1">
                        {action === "view" && <Eye size={14} aria-hidden="true" />}
                        {ACTION_LABELS[action]}
                      </span>
                      <input
                        type="checkbox"
                        className="checkbox checkbox-xs"
                        aria-label={`Aktifkan ${ACTION_LABELS[action]} untuk semua modul`}
                        checked={colAllChecked(action)}
                        onChange={(e) => setColumn(action, e.currentTarget.checked)}
                      />
                    </div>
                  </th>
                ))}
                <th className="text-center">Semua</th>
              </tr>
            </thead>
            <tbody>
              {RESOURCE_GROUPS.map((group) => (
                <GroupRows key={group.group} label={group.group}>
                  {group.items.map((resource) => (
                    <tr key={resource.key}>
                      <td>
                        <p className="font-semibold text-[var(--ink)]">{resource.label}</p>
                        <p className="text-xs text-[var(--muted)]">{resource.description}</p>
                      </td>
                      {PERMISSION_ACTIONS.map((action) =>
                        resource.viewOnly && action !== "view" ? (
                          <td key={action} className="text-center text-[var(--muted)]" aria-label="Tidak berlaku">
                            —
                          </td>
                        ) : (
                          <td key={action} className="text-center">
                            <input
                              type="checkbox"
                              className="checkbox checkbox-sm"
                              aria-label={`${ACTION_LABELS[action]} ${resource.label} untuk ${ROLE_LABELS[activeRole]}`}
                              checked={current[resource.key][action]}
                              onChange={(e) => setCell(resource.key, action, e.currentTarget.checked)}
                            />
                          </td>
                        ),
                      )}
                      <td className="text-center">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm checkbox-success"
                          aria-label={`Pilih semua izin ${resource.label}`}
                          checked={rowAllChecked(resource.key)}
                          onChange={(e) => setRow(resource.key, e.currentTarget.checked)}
                        />
                      </td>
                    </tr>
                  ))}
                </GroupRows>
              ))}
            </tbody>
          </table>
        </div>

        {/* Kartu matriks — mobile & tablet */}
        <div className="grid gap-3 lg:hidden">
          {AUTHORIZABLE_RESOURCES.map((resource) => (
            <article
              key={resource.key}
              className="rounded-xl border border-[var(--line)] bg-[var(--paper)] p-4"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="break-words font-bold text-[var(--ink)]">{resource.label}</h3>
                  <p className="break-words text-xs text-[var(--muted)]">{resource.description}</p>
                </div>
                <label className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-[var(--muted)]">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-xs checkbox-success"
                    aria-label={`Pilih semua izin ${resource.label}`}
                    checked={rowAllChecked(resource.key)}
                    onChange={(e) => setRow(resource.key, e.currentTarget.checked)}
                  />
                  Semua
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(resource.viewOnly ? (["view"] as PermissionAction[]) : PERMISSION_ACTIONS).map((action) => (
                  <label
                    key={action}
                    className="flex min-h-11 items-center gap-2 rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      aria-label={`${ACTION_LABELS[action]} ${resource.label} untuk ${ROLE_LABELS[activeRole]}`}
                      checked={current[resource.key][action]}
                      onChange={(e) => setCell(resource.key, action, e.currentTarget.checked)}
                    />
                    <span className="inline-flex items-center gap-1">
                      {action === "view" && <Eye size={14} aria-hidden="true" />}
                      {ACTION_LABELS[action]}
                    </span>
                  </label>
                ))}
              </div>
            </article>
          ))}
        </div>

        {/* Bilah aksi simpan */}
        <div className="sticky bottom-0 z-10 mt-5 flex flex-col gap-3 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-4 shadow-[0_-4px_16px_-12px_rgba(0,0,0,0.3)] sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--muted)]">
            {isDirty ? (
              <span className="font-medium text-[var(--ink)]">
                Ada perubahan pada peran {ROLE_LABELS[activeRole]} yang belum disimpan.
              </span>
            ) : (
              `Hak akses ${ROLE_LABELS[activeRole]} tersimpan.`
            )}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={!isDirty || pending}
              onClick={resetChanges}
            >
              Batalkan perubahan
            </Button>
            <Button type="submit" disabled={!isDirty || pending} loading={pending}>
              <Save size={17} aria-hidden="true" />
              {pending ? "Menyimpan..." : "Simpan hak akses"}
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}

// Baris judul kelompok + baris-baris resource di bawahnya.
function GroupRows({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <tr className="bg-[var(--cream)]">
        <th
          colSpan={PERMISSION_ACTIONS.length + 2}
          className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]"
        >
          {label}
        </th>
      </tr>
      {children}
    </>
  );
}
