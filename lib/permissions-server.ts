import { redirect } from "next/navigation";
import type { Session } from "@/lib/auth";
import { getManagedSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import {
  ACTION_COLUMN,
  MANAGED_ROLES,
  buildMatrix,
  defaultResourcePermission,
  isAuthorizableResource,
  isManagedRole,
  type ManagedRole,
  type PermissionAction,
  type PermissionMatrix,
  type ResourcePermission,
} from "@/lib/permissions";

// ---------------------------------------------------------------------------
// Bagian server-only dari sistem Hak Akses — semua akses database ada di sini.
// Jangan impor file ini dari komponen klien.
// ---------------------------------------------------------------------------

// Ambil matriks izin untuk satu role dari database.
export async function getRoleMatrix(role: ManagedRole): Promise<PermissionMatrix> {
  const rows = await prisma.rolePermission.findMany({
    where: { role },
    select: {
      resource: true,
      can_view: true,
      can_create: true,
      can_update: true,
      can_delete: true,
    },
  });
  return buildMatrix(rows);
}

// Ambil matriks izin untuk SEMUA role yang dikelola sekaligus.
export async function getAllMatrices(): Promise<Record<ManagedRole, PermissionMatrix>> {
  const rows = await prisma.rolePermission.findMany({
    where: { role: { in: MANAGED_ROLES as unknown as string[] } },
    select: {
      role: true,
      resource: true,
      can_view: true,
      can_create: true,
      can_update: true,
      can_delete: true,
    },
  });

  const result = {} as Record<ManagedRole, PermissionMatrix>;
  for (const role of MANAGED_ROLES) {
    result[role] = buildMatrix(rows.filter((row) => row.role === role));
  }
  return result;
}

// Helper penegakan izin (siap dipakai di layout / server action area role saat
// area non-admin dibangun). ADMIN selalu true.
export async function can(
  role: string,
  resource: string,
  action: PermissionAction,
): Promise<boolean> {
  if (role === "ADMIN") return true;
  if (!isManagedRole(role) || !isAuthorizableResource(resource)) return false;

  const row = await prisma.rolePermission.findUnique({
    where: { role_resource: { role, resource } },
    select: {
      can_view: true,
      can_create: true,
      can_update: true,
      can_delete: true,
    },
  });

  return Boolean(row?.[ACTION_COLUMN[action]]);
}

// Ambil keempat izin (view/create/update/delete) satu resource untuk satu role
// dalam satu query. ADMIN selalu penuh.
export async function getResourcePermission(
  role: string,
  resource: string,
): Promise<ResourcePermission> {
  if (role === "ADMIN") {
    return { view: true, create: true, update: true, delete: true };
  }
  if (!isManagedRole(role) || !isAuthorizableResource(resource)) {
    return defaultResourcePermission();
  }

  const row = await prisma.rolePermission.findUnique({
    where: { role_resource: { role, resource } },
    select: {
      can_view: true,
      can_create: true,
      can_update: true,
      can_delete: true,
    },
  });

  return row
    ? {
        view: row.can_view,
        create: row.can_create,
        update: row.can_update,
        delete: row.can_delete,
      }
    : defaultResourcePermission();
}

// Untuk HALAMAN modul: pastikan pengguna boleh melihat resource ini. Bila tidak
// login → ke "/", bila tak berizin lihat → kembali ke "/admin". Mengembalikan
// sesi + izin lengkap resource agar halaman dapat menyembunyikan kontrol tulis.
export async function requireResourceView(
  resource: string,
): Promise<{ session: Session; permission: ResourcePermission }> {
  const session = await getManagedSession();
  if (!session) redirect("/");

  const permission = await getResourcePermission(session.role, resource);
  if (!permission.view) redirect("/admin");

  return { session, permission };
}

// Untuk SERVER ACTION: kembalikan sesi bila boleh melakukan aksi pada resource,
// selain itu null (pemanggil membalas "tidak berwenang").
export async function authorizeAction(
  resource: string,
  action: PermissionAction,
): Promise<Session | null> {
  const session = await getManagedSession();
  if (!session) return null;
  return (await can(session.role, resource, action)) ? session : null;
}
