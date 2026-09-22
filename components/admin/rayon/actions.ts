"use server";

import { revalidatePath } from "next/cache";
import { recordAdminAudit } from "@/lib/admin-audit";
import { authorizeAction } from "@/lib/permissions-server";
import { prisma } from "@/lib/prisma";
import { rayonSchema, type RayonActionState } from "./schema";

// Resource Hak Akses untuk modul ini.
const RESOURCE = "rayon";

function unauthorized(): RayonActionState {
  return { status: "error", message: "Anda tidak memiliki akses untuk mengubah data." };
}

function parseForm(formData: FormData) {
  return rayonSchema.safeParse({
    name: formData.get("name"),
  });
}

function failure(error: unknown): RayonActionState {
  console.error("Rayon mutation failed", error);
  return {
    status: "error",
    message: "Perubahan tidak dapat disimpan. Pastikan nama belum digunakan.",
  };
}

export async function createRayonAction(
  _state: RayonActionState,
  formData: FormData,
): Promise<RayonActionState> {
  const session = await authorizeAction(RESOURCE, "create");
  if (!session) return unauthorized();

  const parsed = parseForm(formData);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali data yang diisi.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const rayon = await prisma.rayon.create({
      data: { nm_rayon: parsed.data.name },
    });
    await recordAdminAudit({
      aksi: "CREATE",
      detail: parsed.data,
      entitas: "Rayon",
      id_entitas: rayon.id,
      ringkasan: rayon.nm_rayon,
      session,
    });
    revalidatePath("/admin/rayon");
    return { status: "success", message: "Data rayon berhasil ditambahkan." };
  } catch (error) {
    return failure(error);
  }
}

export async function updateRayonAction(
  _state: RayonActionState,
  formData: FormData,
): Promise<RayonActionState> {
  const session = await authorizeAction(RESOURCE, "update");
  if (!session) return unauthorized();

  const id = String(formData.get("id") ?? "");
  const parsed = parseForm(formData);

  if (!id || !parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali data yang diisi.",
      errors: parsed.success ? undefined : parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const rayon = await prisma.rayon.update({
      where: { id },
      data: { nm_rayon: parsed.data.name },
    });
    await recordAdminAudit({
      aksi: "UPDATE",
      detail: parsed.data,
      entitas: "Rayon",
      id_entitas: rayon.id,
      ringkasan: rayon.nm_rayon,
      session,
    });
    revalidatePath("/admin/rayon");
    return { status: "success", message: "Data rayon berhasil diperbarui." };
  } catch (error) {
    return failure(error);
  }
}

export async function deleteRayonAction(
  _state: RayonActionState,
  formData: FormData,
): Promise<RayonActionState> {
  const session = await authorizeAction(RESOURCE, "delete");
  if (!session) return unauthorized();

  const id = String(formData.get("id") ?? "");

  if (!id) {
    return { status: "error", message: "Data rayon tidak ditemukan." };
  }

  try {
    const rayon = await prisma.rayon.delete({ where: { id } });
    await recordAdminAudit({
      aksi: "DELETE",
      entitas: "Rayon",
      id_entitas: rayon.id,
      ringkasan: rayon.nm_rayon,
      session,
    });
    revalidatePath("/admin/rayon");
    return { status: "success", message: "Data rayon berhasil dihapus." };
  } catch (error) {
    return failure(error);
  }
}
