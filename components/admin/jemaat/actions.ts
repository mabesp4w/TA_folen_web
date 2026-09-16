"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { jemaatSchema, type ActionState } from "./schema";

function parseForm(formData: FormData) {
  return jemaatSchema.safeParse({
    nm_lengkap: formData.get("nm_lengkap"),
    tgl_lahir: formData.get("tgl_lahir"),
    jenkel: formData.get("jenkel"),
    stat_keluarga: formData.get("stat_keluarga"),
    alamat_blok: formData.get("alamat_blok"),
    status: formData.get("status"),
    id_rayon: formData.get("id_rayon") || undefined,
  });
}

function failure(error: unknown): ActionState {
  console.error("Jemaat mutation failed", error);
  return {
    status: "error",
    message: "Perubahan tidak dapat disimpan. Silakan coba lagi.",
  };
}

export async function createJemaatAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseForm(formData);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali data yang diisi.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await prisma.jemaat.create({
      data: {
        ...parsed.data,
        id_rayon: parsed.data.id_rayon || null,
        tgl_lahir: new Date(`${parsed.data.tgl_lahir}T00:00:00.000Z`),
      },
    });
    revalidatePath("/app/admin/jemaat");
    return { status: "success", message: "Data jemaat berhasil ditambahkan." };
  } catch (error) {
    return failure(error);
  }
}

export async function updateJemaatAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
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
    await prisma.jemaat.update({
      where: { id },
      data: {
        ...parsed.data,
        id_rayon: parsed.data.id_rayon || null,
        tgl_lahir: new Date(`${parsed.data.tgl_lahir}T00:00:00.000Z`),
      },
    });
    revalidatePath("/app/admin/jemaat");
    return { status: "success", message: "Data jemaat berhasil diperbarui." };
  } catch (error) {
    return failure(error);
  }
}

export async function deleteJemaatAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return { status: "error", message: "Data jemaat tidak ditemukan." };
  }

  try {
    await prisma.jemaat.delete({ where: { id } });
    revalidatePath("/app/admin/jemaat");
    return { status: "success", message: "Data jemaat berhasil dihapus." };
  } catch (error) {
    return failure(error);
  }
}
