"use server";

import { revalidatePath } from "next/cache";
import { recordAdminAudit } from "@/lib/admin-audit";
import { authorizeAction } from "@/lib/permissions-server";
import { prisma } from "@/lib/prisma";
import { unsurSchema, type UnsurActionState } from "./schema";

const RESOURCE = "unsur";

function unauthorized(): UnsurActionState {
  return { status: "error", message: "Anda tidak memiliki akses untuk mengubah data." };
}

function parseForm(formData: FormData) {
  return unsurSchema.safeParse({
    name: formData.get("name"),
  });
}

function failure(error: unknown): UnsurActionState {
  console.error("Unsur mutation failed", error);
  return {
    status: "error",
    message: "Perubahan tidak dapat disimpan. Pastikan nama belum digunakan.",
  };
}

export async function createUnsurAction(
  _state: UnsurActionState,
  formData: FormData,
): Promise<UnsurActionState> {
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
    const unsur = await prisma.unsur.create({
      data: { nm_unsur: parsed.data.name },
    });
    await recordAdminAudit({
      aksi: "CREATE",
      detail: parsed.data,
      entitas: "Unsur",
      id_entitas: unsur.id,
      ringkasan: unsur.nm_unsur,
      session,
    });
    revalidatePath("/admin/unsur");
    return { status: "success", message: "Data unsur berhasil ditambahkan." };
  } catch (error) {
    return failure(error);
  }
}

export async function updateUnsurAction(
  _state: UnsurActionState,
  formData: FormData,
): Promise<UnsurActionState> {
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
    const unsur = await prisma.unsur.update({
      where: { id },
      data: { nm_unsur: parsed.data.name },
    });
    await recordAdminAudit({
      aksi: "UPDATE",
      detail: parsed.data,
      entitas: "Unsur",
      id_entitas: unsur.id,
      ringkasan: unsur.nm_unsur,
      session,
    });
    revalidatePath("/admin/unsur");
    return { status: "success", message: "Data unsur berhasil diperbarui." };
  } catch (error) {
    return failure(error);
  }
}

export async function deleteUnsurAction(
  _state: UnsurActionState,
  formData: FormData,
): Promise<UnsurActionState> {
  const session = await authorizeAction(RESOURCE, "delete");
  if (!session) return unauthorized();

  const id = String(formData.get("id") ?? "");

  if (!id) {
    return { status: "error", message: "Data unsur tidak ditemukan." };
  }

  try {
    const unsur = await prisma.unsur.delete({ where: { id } });
    await recordAdminAudit({
      aksi: "DELETE",
      entitas: "Unsur",
      id_entitas: unsur.id,
      ringkasan: unsur.nm_unsur,
      session,
    });
    revalidatePath("/admin/unsur");
    return { status: "success", message: "Data unsur berhasil dihapus." };
  } catch (error) {
    return failure(error);
  }
}
