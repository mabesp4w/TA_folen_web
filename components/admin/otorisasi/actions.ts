"use server";

import { revalidatePath } from "next/cache";
import { recordAdminAudit } from "@/lib/admin-audit";
import { getAdminSession } from "@/lib/auth-server";
import {
  ACTION_COLUMN,
  ROLE_LABELS,
  type ManagedRole,
  type PermissionAction,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  savePermissionsSchema,
  type OtorisasiActionState,
} from "./schema";

const adminPath = "/admin/otorisasi";

function unauthorized(): OtorisasiActionState {
  return { status: "error", message: "Anda tidak memiliki akses untuk mengubah data." };
}

function failure(error: unknown): OtorisasiActionState {
  console.error("Permission mutation failed", error);
  return { status: "error", message: "Hak akses gagal disimpan. Silakan coba lagi." };
}

const ACTIONS: PermissionAction[] = ["view", "create", "update", "delete"];

// Simpan seluruh matriks izin untuk satu role sekaligus (upsert per resource).
// Aksi non-view otomatis membutuhkan view: tanpa bisa melihat modul, izin
// tambah/ubah/hapus tidak bermakna, jadi kita paksa view=true bila salah satunya aktif.
export async function savePermissionsAction(
  _state: OtorisasiActionState,
  formData: FormData,
): Promise<OtorisasiActionState> {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  let rawMatrix: unknown;
  try {
    rawMatrix = JSON.parse(String(formData.get("matrix") ?? "{}"));
  } catch {
    return { status: "error", message: "Data hak akses tidak valid." };
  }

  const parsed = savePermissionsSchema.safeParse({
    role: formData.get("role"),
    matrix: rawMatrix,
  });
  if (!parsed.success) {
    return { status: "error", message: "Periksa kembali data hak akses." };
  }

  const role = parsed.data.role as ManagedRole;
  const matrix = parsed.data.matrix;

  try {
    await prisma.$transaction(
      Object.entries(matrix).map(([resource, perm]) => {
        // Turunan integritas: bila ada aksi tulis, pastikan view ikut aktif.
        const view = perm.view || perm.create || perm.update || perm.delete;
        const data = {
          [ACTION_COLUMN.view]: view,
          [ACTION_COLUMN.create]: perm.create,
          [ACTION_COLUMN.update]: perm.update,
          [ACTION_COLUMN.delete]: perm.delete,
        };

        return prisma.rolePermission.upsert({
          where: { role_resource: { role, resource } },
          create: { role, resource, ...data },
          update: data,
        });
      }),
    );

    // Ringkas jumlah izin aktif agar log terbaca.
    const activeCount = Object.values(matrix).reduce(
      (sum, perm) => sum + ACTIONS.filter((a) => perm[a]).length,
      0,
    );

    await recordAdminAudit({
      aksi: "UPDATE",
      detail: { role, matrix },
      entitas: "RolePermission",
      ringkasan: `${ROLE_LABELS[role]} — ${activeCount} izin aktif`,
      session,
    });

    revalidatePath(adminPath);
    return { status: "success", message: `Hak akses ${ROLE_LABELS[role]} berhasil disimpan.` };
  } catch (error) {
    return failure(error);
  }
}
