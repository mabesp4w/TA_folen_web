"use server";

import { revalidatePath } from "next/cache";
import { recordAdminAudit } from "@/lib/admin-audit";
import { getAdminSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { kehadiranSchema, type KehadiranActionState } from "./schema";

const adminPath = "/admin/kehadiran";

function unauthorized(): KehadiranActionState {
  return { status: "error", message: "Anda tidak memiliki akses untuk mengubah data." };
}

function failure(error: unknown): KehadiranActionState {
  console.error("Kehadiran mutation failed", error);
  return { status: "error", message: "Data kehadiran gagal diproses. Silakan coba lagi." };
}

function parseForm(formData: FormData) {
  return kehadiranSchema.safeParse({
    id_ibadah: formData.get("id_ibadah"),
    laki_laki: formData.get("laki_laki"),
    perempuan: formData.get("perempuan"),
    anak: formData.get("anak"),
  });
}

function mutationData(data: { laki_laki: number; perempuan: number; anak: number }) {
  return {
    laki_laki: data.laki_laki,
    perempuan: data.perempuan,
    anak: data.anak,
    total: data.laki_laki + data.perempuan + data.anak,
  };
}

export async function createKehadiranAction(
  _state: KehadiranActionState,
  formData: FormData,
): Promise<KehadiranActionState> {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { status: "error", message: "Periksa kembali data kehadiran.", errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const existing = await prisma.kehadiran.findUnique({
      where: { id_ibadah: parsed.data.id_ibadah },
    });
    if (existing) {
      return { status: "error", message: "Ibadah ini sudah memiliki data kehadiran. Silakan edit data yang ada." };
    }

    const record = await prisma.kehadiran.create({
      data: { id_ibadah: parsed.data.id_ibadah, ...mutationData(parsed.data) },
    });
    await recordAdminAudit({
      aksi: "CREATE",
      detail: parsed.data,
      entitas: "Kehadiran",
      id_entitas: record.id,
      ringkasan: `Total ${record.total} jemaat`,
      session,
    });
    revalidatePath(adminPath);
    return { status: "success", message: "Data kehadiran berhasil ditambahkan." };
  } catch (error) {
    return failure(error);
  }
}

export async function updateKehadiranAction(
  _state: KehadiranActionState,
  formData: FormData,
): Promise<KehadiranActionState> {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const id = String(formData.get("id") ?? "");
  const parsed = parseForm(formData);
  if (!id || !parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali data kehadiran.",
      errors: parsed.success ? undefined : parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const record = await prisma.kehadiran.update({
      where: { id },
      data: mutationData(parsed.data),
    });
    await recordAdminAudit({
      aksi: "UPDATE",
      detail: parsed.data,
      entitas: "Kehadiran",
      id_entitas: record.id,
      ringkasan: `Total ${record.total} jemaat`,
      session,
    });
    revalidatePath(adminPath);
    return { status: "success", message: "Data kehadiran berhasil diperbarui." };
  } catch (error) {
    return failure(error);
  }
}

export async function deleteKehadiranAction(
  _state: KehadiranActionState,
  formData: FormData,
): Promise<KehadiranActionState> {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const id = String(formData.get("id") ?? "");
  const ringkasan = String(formData.get("ringkasan") ?? "");
  if (!id) return { status: "error", message: "Data kehadiran tidak ditemukan." };

  try {
    await prisma.kehadiran.delete({ where: { id } });
    await recordAdminAudit({
      aksi: "DELETE",
      entitas: "Kehadiran",
      id_entitas: id,
      ringkasan,
      session,
    });
    revalidatePath(adminPath);
    return { status: "success", message: "Data kehadiran berhasil dihapus." };
  } catch (error) {
    return failure(error);
  }
}
