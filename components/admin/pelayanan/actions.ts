"use server";

import { revalidatePath } from "next/cache";
import { recordAdminAudit } from "@/lib/admin-audit";
import { getAdminSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import {
  pelayananSchema,
  type PelayananActionState,
  type PelayananInput,
} from "./schema";

const path = "/admin/pelayanan";

function parseForm(formData: FormData) {
  return pelayananSchema.safeParse({
    type: formData.get("type"),
    id_jemaat: formData.get("id_jemaat"),
    gelar: formData.get("gelar"),
    jabatan: formData.get("jabatan"),
    id_unsur: formData.get("id_unsur"),
    sektor: formData.get("sektor"),
    tgl_mulai: formData.get("tgl_mulai"),
    tgl_selesai: formData.get("tgl_selesai"),
    aktif: formData.get("aktif") === "on",
  });
}

function toDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function mutationData(data: PelayananInput) {
  return {
    aktif: data.aktif,
    id_jemaat: data.id_jemaat,
    tgl_mulai: toDate(data.tgl_mulai),
    tgl_selesai: data.tgl_selesai ? toDate(data.tgl_selesai) : null,
  };
}

function entityName(type: PelayananInput["type"]) {
  return type === "PENGURUS" ? "BadanPengurus" : type === "MAJELIS" ? "Majelis" : "Pendeta";
}

function failure(error: unknown): PelayananActionState {
  console.error("Pelayanan mutation failed", error);
  return {
    status: "error",
    message: "Perubahan tidak dapat disimpan. Silakan coba lagi.",
  };
}

export async function createPelayananAction(
  _state: PelayananActionState,
  formData: FormData,
): Promise<PelayananActionState> {
  const session = await getAdminSession();
  if (!session) return { status: "error", message: "Anda tidak memiliki akses untuk mengubah data." };

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali data yang diisi.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const common = mutationData(parsed.data);
    const record = parsed.data.type === "PENDETA"
      ? await prisma.pendeta.create({ data: { ...common, gelar: parsed.data.gelar ?? null } })
      : parsed.data.type === "MAJELIS"
        ? await prisma.majelis.create({ data: { ...common, jabatan: parsed.data.jabatan! } })
        : await prisma.badanPengurus.create({
            data: {
              ...common,
              id_unsur: parsed.data.id_unsur!,
              jabatan: parsed.data.jabatan!,
              sektor: parsed.data.sektor ?? null,
            },
          });

    const jemaat = await prisma.jemaat.findUnique({
      where: { id: parsed.data.id_jemaat },
      select: { nm_lengkap: true },
    });
    await recordAdminAudit({
      aksi: "CREATE",
      detail: parsed.data,
      entitas: entityName(parsed.data.type),
      id_entitas: record.id,
      ringkasan: jemaat?.nm_lengkap,
      session,
    });
    revalidatePath(path);
    return { status: "success", message: "Data pelayanan berhasil ditambahkan." };
  } catch (error) {
    return failure(error);
  }
}

export async function updatePelayananAction(
  _state: PelayananActionState,
  formData: FormData,
): Promise<PelayananActionState> {
  const session = await getAdminSession();
  if (!session) return { status: "error", message: "Anda tidak memiliki akses untuk mengubah data." };

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
    const common = mutationData(parsed.data);
    const record = parsed.data.type === "PENDETA"
      ? await prisma.pendeta.update({ where: { id }, data: { ...common, gelar: parsed.data.gelar ?? null } })
      : parsed.data.type === "MAJELIS"
        ? await prisma.majelis.update({ where: { id }, data: { ...common, jabatan: parsed.data.jabatan! } })
        : await prisma.badanPengurus.update({
            where: { id },
            data: {
              ...common,
              id_unsur: parsed.data.id_unsur!,
              jabatan: parsed.data.jabatan!,
              sektor: parsed.data.sektor ?? null,
            },
          });

    const jemaat = await prisma.jemaat.findUnique({
      where: { id: parsed.data.id_jemaat },
      select: { nm_lengkap: true },
    });
    await recordAdminAudit({
      aksi: "UPDATE",
      detail: parsed.data,
      entitas: entityName(parsed.data.type),
      id_entitas: record.id,
      ringkasan: jemaat?.nm_lengkap,
      session,
    });
    revalidatePath(path);
    return { status: "success", message: "Data pelayanan berhasil diperbarui." };
  } catch (error) {
    return failure(error);
  }
}

export async function deletePelayananAction(
  _state: PelayananActionState,
  formData: FormData,
): Promise<PelayananActionState> {
  const session = await getAdminSession();
  if (!session) return { status: "error", message: "Anda tidak memiliki akses untuk mengubah data." };

  const id = String(formData.get("id") ?? "");
  const type = String(formData.get("type") ?? "") as PelayananInput["type"];
  const ringkasan = String(formData.get("ringkasan") ?? "");
  if (!id || !["PENDETA", "MAJELIS", "PENGURUS"].includes(type)) {
    return { status: "error", message: "Data pelayanan tidak ditemukan." };
  }

  try {
    if (type === "PENDETA") await prisma.pendeta.delete({ where: { id } });
    else if (type === "MAJELIS") await prisma.majelis.delete({ where: { id } });
    else await prisma.badanPengurus.delete({ where: { id } });

    await recordAdminAudit({
      aksi: "DELETE",
      entitas: entityName(type),
      id_entitas: id,
      ringkasan,
      session,
    });
    revalidatePath(path);
    return { status: "success", message: "Data pelayanan berhasil dihapus." };
  } catch (error) {
    return failure(error);
  }
}
