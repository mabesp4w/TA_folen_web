"use server";

import { revalidatePath } from "next/cache";
import { recordAdminAudit } from "@/lib/admin-audit";
import { getAdminSession } from "@/lib/auth-server";
import { sanitizeRichText } from "@/lib/html";
import { prisma } from "@/lib/prisma";
import { pengumumanSchema, type PengumumanActionState } from "./schema";

const path = "/admin/pengumuman";

function parseForm(formData: FormData) {
  return pengumumanSchema.safeParse({
    judul: formData.get("judul"),
    isi: sanitizeRichText(String(formData.get("isi") ?? "")),
    diterbitkan: formData.get("diterbitkan") === "on",
  });
}

function mutationData(data: { judul: string; isi: string; diterbitkan: boolean }) {
  return {
    judul: data.judul,
    isi: data.isi,
    status: data.diterbitkan,
  };
}

function failure(error: unknown): PengumumanActionState {
  console.error(error);
  return { status: "error", message: "Pengumuman gagal diproses. Silakan coba lagi." };
}

export async function createPengumumanAction(_state: PengumumanActionState, formData: FormData): Promise<PengumumanActionState> {
  const session = await getAdminSession();
  if (!session) return { status: "error", message: "Anda tidak memiliki akses untuk mengubah data." };
  const parsed = parseForm(formData);
  if (!parsed.success) return { status: "error", message: "Periksa kembali data pengumuman.", errors: parsed.error.flatten().fieldErrors };

  try {
    const record = await prisma.pengumuman.create({ data: mutationData(parsed.data) });
    await recordAdminAudit({ aksi: "CREATE", detail: parsed.data, entitas: "Pengumuman", id_entitas: record.id, ringkasan: parsed.data.judul, session });
    revalidatePath(path);
    return { status: "success", message: "Pengumuman berhasil ditambahkan." };
  } catch (error) {
    return failure(error);
  }
}

export async function updatePengumumanAction(_state: PengumumanActionState, formData: FormData): Promise<PengumumanActionState> {
  const session = await getAdminSession();
  if (!session) return { status: "error", message: "Anda tidak memiliki akses untuk mengubah data." };
  const id = String(formData.get("id") ?? "");
  const parsed = parseForm(formData);
  if (!id || !parsed.success) return { status: "error", message: "Periksa kembali data pengumuman.", errors: parsed.success ? undefined : parsed.error.flatten().fieldErrors };

  try {
    const record = await prisma.pengumuman.update({
      where: { id },
      data: mutationData(parsed.data),
    });
    await recordAdminAudit({ aksi: "UPDATE", detail: parsed.data, entitas: "Pengumuman", id_entitas: record.id, ringkasan: parsed.data.judul, session });
    revalidatePath(path);
    return { status: "success", message: "Pengumuman berhasil diperbarui." };
  } catch (error) {
    return failure(error);
  }
}

export async function deletePengumumanAction(_state: PengumumanActionState, formData: FormData): Promise<PengumumanActionState> {
  const session = await getAdminSession();
  if (!session) return { status: "error", message: "Anda tidak memiliki akses untuk mengubah data." };
  const id = String(formData.get("id") ?? "");
  const ringkasan = String(formData.get("ringkasan") ?? "");
  if (!id) return { status: "error", message: "Pengumuman tidak ditemukan." };

  try {
    await prisma.pengumuman.delete({ where: { id } });
    await recordAdminAudit({ aksi: "DELETE", entitas: "Pengumuman", id_entitas: id, ringkasan, session });
    revalidatePath(path);
    return { status: "success", message: "Pengumuman berhasil dihapus." };
  } catch (error) {
    return failure(error);
  }
}
