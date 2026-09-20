"use server";

import { revalidatePath } from "next/cache";
import { recordAdminAudit } from "@/lib/admin-audit";
import { getAdminSession } from "@/lib/auth-server";
import { sanitizeRichText } from "@/lib/html";
import { prisma } from "@/lib/prisma";
import { renunganSchema, type RenunganActionState } from "./schema";

const path = "/admin/renungan";

function parseForm(formData: FormData) {
  return renunganSchema.safeParse({
    judul: formData.get("judul"),
    bacaan: String(formData.get("bacaan") ?? ""),
    kutipan: String(formData.get("kutipan") ?? ""),
    isi: sanitizeRichText(String(formData.get("isi") ?? "")),
    sumber: String(formData.get("sumber") ?? ""),
    tgl_publish: formData.get("tgl_publish"),
  });
}

function mutationData(data: {
  judul: string;
  bacaan?: string;
  kutipan?: string;
  isi: string;
  sumber?: string;
  tgl_publish: string;
}) {
  return {
    judul: data.judul,
    bacaan: data.bacaan || null,
    kutipan: data.kutipan || null,
    isi: data.isi,
    sumber: data.sumber || null,
    tgl_publish: new Date(`${data.tgl_publish}T00:00:00.000Z`),
  };
}

function failure(error: unknown): RenunganActionState {
  console.error(error);
  return { status: "error", message: "Renungan gagal diproses. Silakan coba lagi." };
}

export async function createRenunganAction(
  _state: RenunganActionState,
  formData: FormData,
): Promise<RenunganActionState> {
  const session = await getAdminSession();
  if (!session) return { status: "error", message: "Anda tidak memiliki akses untuk mengubah data." };
  const parsed = parseForm(formData);
  if (!parsed.success) return { status: "error", message: "Periksa kembali data renungan.", errors: parsed.error.flatten().fieldErrors };

  try {
    const record = await prisma.renungan.create({ data: mutationData(parsed.data) });
    await recordAdminAudit({ aksi: "CREATE", detail: parsed.data, entitas: "Renungan", id_entitas: record.id, ringkasan: parsed.data.judul, session });
    revalidatePath(path);
    return { status: "success", message: "Renungan berhasil ditambahkan." };
  } catch (error) {
    return failure(error);
  }
}

export async function updateRenunganAction(
  _state: RenunganActionState,
  formData: FormData,
): Promise<RenunganActionState> {
  const session = await getAdminSession();
  if (!session) return { status: "error", message: "Anda tidak memiliki akses untuk mengubah data." };
  const id = String(formData.get("id") ?? "");
  const parsed = parseForm(formData);
  if (!id || !parsed.success) return { status: "error", message: "Periksa kembali data renungan.", errors: parsed.success ? undefined : parsed.error.flatten().fieldErrors };

  try {
    const record = await prisma.renungan.update({ where: { id }, data: mutationData(parsed.data) });
    await recordAdminAudit({ aksi: "UPDATE", detail: parsed.data, entitas: "Renungan", id_entitas: record.id, ringkasan: parsed.data.judul, session });
    revalidatePath(path);
    return { status: "success", message: "Renungan berhasil diperbarui." };
  } catch (error) {
    return failure(error);
  }
}

export async function deleteRenunganAction(
  _state: RenunganActionState,
  formData: FormData,
): Promise<RenunganActionState> {
  const session = await getAdminSession();
  if (!session) return { status: "error", message: "Anda tidak memiliki akses untuk mengubah data." };
  const id = String(formData.get("id") ?? "");
  const ringkasan = String(formData.get("ringkasan") ?? "");
  if (!id) return { status: "error", message: "Renungan tidak ditemukan." };

  try {
    await prisma.renungan.delete({ where: { id } });
    await recordAdminAudit({ aksi: "DELETE", entitas: "Renungan", id_entitas: id, ringkasan, session });
    revalidatePath(path);
    return { status: "success", message: "Renungan berhasil dihapus." };
  } catch (error) {
    return failure(error);
  }
}
