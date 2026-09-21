"use server";

import { revalidatePath } from "next/cache";
import { recordAdminAudit } from "@/lib/admin-audit";
import { getAdminSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { agendaSchema, type AgendaActionState, type AgendaInput } from "./schema";

const path = "/admin/agenda";

function parseForm(formData: FormData) {
  const jenis = formData.get("jenis_ibadah");
  const isGabungan = jenis === "gabungan" || formData.get("gabungan") === "on";
  const isUmum = jenis === "umum";
  return agendaSchema.safeParse({
    id_jemaat: isUmum || isGabungan ? undefined : formData.get("id_jemaat"),
    id_unsur: isUmum ? undefined : formData.get("id_unsur"),
    id_pelayan_firman: formData.get("id_pelayan_firman"),
    nm_ibadah: formData.get("nm_ibadah"),
    gabungan: isGabungan,
    sektor: formData.get("sektor"),
    tgl: formData.get("tgl"),
    waktu: formData.get("waktu"),
    tempat: isGabungan || isUmum ? "Gereja Syaloom" : formData.get("tempat"),
    alamat_tempat: isGabungan || isUmum ? undefined : formData.get("alamat_tempat"),
    catatan: formData.get("catatan"),
    pelayan_firman: formData.get("pelayan_firman"),
    liturgos: formData.get("liturgos"),
    pembacaan_alkitab: formData.get("pembacaan_alkitab"),
    piket: formData.get("piket"),
    p_organ: isGabungan || isUmum ? undefined : formData.get("p_organ"),
  });
}

function mutationData(data: AgendaInput) {
  const gabungan = data.gabungan;
  return {
    id_jemaat: data.id_jemaat ?? null,
    id_unsur: data.id_unsur ?? null,
    id_pelayan_firman: data.id_pelayan_firman ?? null,
    nm_ibadah: data.nm_ibadah ?? null,
    gabungan,
    sektor: data.sektor ?? null,
    tgl: new Date(`${data.tgl}T00:00:00.000Z`),
    waktu: new Date(`1970-01-01T${data.waktu}:00.000Z`),
    tempat: data.tempat ?? null,
    alamat_tempat: data.alamat_tempat ?? null,
    catatan: data.catatan ?? null,
    pelayan_firman: data.pelayan_firman ?? null,
    liturgos: data.liturgos ?? null,
    pembacaan_alkitab: data.pembacaan_alkitab ?? null,
    piket: data.piket ?? null,
    p_organ: data.p_organ ?? null,
  };
}

function summary(data: AgendaInput) {
  return data.nm_ibadah ?? `${data.tgl} ${data.waktu}`;
}

function failure(error: unknown): AgendaActionState {
  console.error("Agenda mutation failed", error);
  return {
    status: "error",
    message: "Perubahan agenda tidak dapat disimpan. Silakan coba lagi.",
  };
}

export async function createAgendaAction(
  _state: AgendaActionState,
  formData: FormData,
): Promise<AgendaActionState> {
  const session = await getAdminSession();
  if (!session) {
    return { status: "error", message: "Anda tidak memiliki akses untuk mengubah data." };
  }

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali data agenda yang diisi.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const record = await prisma.ibadah.create({ data: mutationData(parsed.data) });
    await recordAdminAudit({
      aksi: "CREATE",
      detail: parsed.data,
      entitas: "Ibadah",
      id_entitas: record.id,
      ringkasan: summary(parsed.data),
      session,
    });
    revalidatePath(path);
    return { status: "success", message: "Agenda ibadah berhasil ditambahkan." };
  } catch (error) {
    return failure(error);
  }
}

export async function updateAgendaAction(
  _state: AgendaActionState,
  formData: FormData,
): Promise<AgendaActionState> {
  const session = await getAdminSession();
  if (!session) {
    return { status: "error", message: "Anda tidak memiliki akses untuk mengubah data." };
  }

  const id = String(formData.get("id") ?? "");
  const parsed = parseForm(formData);
  if (!id || !parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali data agenda yang diisi.",
      errors: parsed.success ? undefined : parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const record = await prisma.ibadah.update({
      where: { id },
      data: mutationData(parsed.data),
    });
    await recordAdminAudit({
      aksi: "UPDATE",
      detail: parsed.data,
      entitas: "Ibadah",
      id_entitas: record.id,
      ringkasan: summary(parsed.data),
      session,
    });
    revalidatePath(path);
    return { status: "success", message: "Agenda ibadah berhasil diperbarui." };
  } catch (error) {
    return failure(error);
  }
}

export async function deleteAgendaAction(
  _state: AgendaActionState,
  formData: FormData,
): Promise<AgendaActionState> {
  const session = await getAdminSession();
  if (!session) {
    return { status: "error", message: "Anda tidak memiliki akses untuk mengubah data." };
  }

  const id = String(formData.get("id") ?? "");
  const ringkasan = String(formData.get("ringkasan") ?? "");
  if (!id) return { status: "error", message: "Agenda ibadah tidak ditemukan." };

  try {
    await prisma.ibadah.delete({ where: { id } });
    await recordAdminAudit({
      aksi: "DELETE",
      entitas: "Ibadah",
      id_entitas: id,
      ringkasan,
      session,
    });
    revalidatePath(path);
    return { status: "success", message: "Agenda ibadah berhasil dihapus." };
  } catch (error) {
    return failure(error);
  }
}
