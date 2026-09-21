"use server";

import { revalidatePath } from "next/cache";
import { recordAdminAudit } from "@/lib/admin-audit";
import { getAdminSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { keluargaSchema, type KeluargaActionState } from "./schema";

async function authorize(): Promise<KeluargaActionState | null> {
  const session = await getAdminSession();

  return session
    ? null
    : { status: "error", message: "Anda tidak memiliki akses untuk mengubah data." };
}

function parseForm(formData: FormData) {
  return keluargaSchema.safeParse({
    no_kk: formData.get("no_kk") || undefined,
    alamat_blok: formData.get("alamat_blok"),
    id_rayon: formData.get("id_rayon") || undefined,
  });
}

function failure(error: unknown): KeluargaActionState {
  console.error("Keluarga mutation failed", error);
  return {
    status: "error",
    message: "Perubahan tidak dapat disimpan. Pastikan Nomor KK belum digunakan.",
  };
}

export async function createKeluargaAction(
  _state: KeluargaActionState,
  formData: FormData,
): Promise<KeluargaActionState> {
  const authorizationError = await authorize();
  if (authorizationError) return authorizationError;

  const parsed = parseForm(formData);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali data yang diisi.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const session = await getAdminSession();
    if (!session) {
      return { status: "error", message: "Anda tidak memiliki akses untuk mengubah data." };
    }

    const keluarga = await prisma.keluarga.create({
      data: {
        no_kk: parsed.data.no_kk || null,
        alamat_blok: parsed.data.alamat_blok,
        id_rayon: parsed.data.id_rayon || null,
      },
    });
    await recordAdminAudit({
      aksi: "CREATE",
      detail: parsed.data,
      entitas: "Keluarga",
      id_entitas: keluarga.id,
      ringkasan: keluarga.no_kk ?? keluarga.alamat_blok,
      session,
    });
    revalidatePath("/admin/keluarga");
    return { status: "success", message: "Data keluarga berhasil ditambahkan." };
  } catch (error) {
    return failure(error);
  }
}

export async function updateKeluargaAction(
  _state: KeluargaActionState,
  formData: FormData,
): Promise<KeluargaActionState> {
  const authorizationError = await authorize();
  if (authorizationError) return authorizationError;

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
    const session = await getAdminSession();
    if (!session) {
      return { status: "error", message: "Anda tidak memiliki akses untuk mengubah data." };
    }

    const keluarga = await prisma.keluarga.update({
      where: { id },
      data: {
        no_kk: parsed.data.no_kk || null,
        alamat_blok: parsed.data.alamat_blok,
        id_rayon: parsed.data.id_rayon || null,
      },
    });
    await recordAdminAudit({
      aksi: "UPDATE",
      detail: parsed.data,
      entitas: "Keluarga",
      id_entitas: keluarga.id,
      ringkasan: keluarga.no_kk ?? keluarga.alamat_blok,
      session,
    });
    revalidatePath("/admin/keluarga");
    return { status: "success", message: "Data keluarga berhasil diperbarui." };
  } catch (error) {
    return failure(error);
  }
}

export async function deleteKeluargaAction(
  _state: KeluargaActionState,
  formData: FormData,
): Promise<KeluargaActionState> {
  const authorizationError = await authorize();
  if (authorizationError) return authorizationError;

  const id = String(formData.get("id") ?? "");

  if (!id) {
    return { status: "error", message: "Data keluarga tidak ditemukan." };
  }

  try {
    const session = await getAdminSession();
    if (!session) {
      return { status: "error", message: "Anda tidak memiliki akses untuk mengubah data." };
    }

    // Cegah penghapusan bila keluarga masih memiliki anggota, agar anggota
    // tidak menjadi yatim tanpa alamat/rayon secara tidak sengaja.
    const anggota = await prisma.jemaat.count({ where: { id_keluarga: id } });
    if (anggota > 0) {
      return {
        status: "error",
        message: `Keluarga masih memiliki ${anggota} anggota. Pindahkan atau hapus anggota terlebih dahulu.`,
      };
    }

    const keluarga = await prisma.keluarga.delete({ where: { id } });
    await recordAdminAudit({
      aksi: "DELETE",
      entitas: "Keluarga",
      id_entitas: keluarga.id,
      ringkasan: keluarga.no_kk ?? keluarga.alamat_blok,
      session,
    });
    revalidatePath("/admin/keluarga");
    return { status: "success", message: "Data keluarga berhasil dihapus." };
  } catch (error) {
    return failure(error);
  }
}
