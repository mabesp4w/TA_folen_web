"use server";

import { revalidatePath } from "next/cache";
import { recordAdminAudit } from "@/lib/admin-audit";
import { authorizeAction } from "@/lib/permissions-server";
import { prisma } from "@/lib/prisma";
import {
  keuanganSchema,
  type KeuanganActionState,
  type KeuanganInput,
} from "./schema";

const path = "/admin/keuangan";

// Resource Hak Akses untuk modul ini.
const RESOURCE = "keuangan";

function unauthorized(): KeuanganActionState {
  return {
    status: "error",
    message: "Anda tidak memiliki akses untuk mengubah data.",
  };
}

function parseForm(formData: FormData) {
  return keuanganSchema.safeParse({
    id_ibadah: formData.get("id_ibadah"),
    kategori: formData.get("kategori"),
    nm_pemberi: formData.get("nm_pemberi"),
    jumlah: formData.get("jumlah"),
    keterangan: formData.get("keterangan"),
  });
}

function mutationData(data: KeuanganInput) {
  return {
    id_ibadah: data.id_ibadah,
    kategori: data.kategori,
    nm_pemberi: data.nm_pemberi,
    jumlah: data.jumlah,
    keterangan: data.keterangan,
  };
}

function ringkasan(data: KeuanganInput) {
  return `${data.kategori} - ${data.nm_pemberi ?? "Tanpa nama"}`;
}

function failure(error: unknown): KeuanganActionState {
  console.error(error);
  return {
    status: "error",
    message: "Data penerimaan gagal diproses. Silakan coba lagi.",
  };
}

export async function createKeuanganAction(
  _state: KeuanganActionState,
  formData: FormData,
): Promise<KeuanganActionState> {
  const session = await authorizeAction(RESOURCE, "create");
  if (!session) return unauthorized();

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali data penerimaan.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const record = await prisma.keuangan.create({
      data: mutationData(parsed.data),
    });
    await recordAdminAudit({
      aksi: "CREATE",
      detail: parsed.data,
      entitas: "Keuangan",
      id_entitas: record.id,
      ringkasan: ringkasan(parsed.data),
      session,
    });
    revalidatePath(path);
    return {
      status: "success",
      message: "Penerimaan berhasil ditambahkan.",
    };
  } catch (error) {
    return failure(error);
  }
}

export async function updateKeuanganAction(
  _state: KeuanganActionState,
  formData: FormData,
): Promise<KeuanganActionState> {
  const session = await authorizeAction(RESOURCE, "update");
  if (!session) return unauthorized();

  const id = String(formData.get("id") ?? "");
  const parsed = parseForm(formData);
  if (!id || !parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali data penerimaan.",
      errors: parsed.success ? undefined : parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const record = await prisma.keuangan.update({
      where: { id },
      data: mutationData(parsed.data),
    });
    await recordAdminAudit({
      aksi: "UPDATE",
      detail: parsed.data,
      entitas: "Keuangan",
      id_entitas: record.id,
      ringkasan: ringkasan(parsed.data),
      session,
    });
    revalidatePath(path);
    return {
      status: "success",
      message: "Penerimaan berhasil diperbarui.",
    };
  } catch (error) {
    return failure(error);
  }
}

/**
 * Satu action stabil untuk useActionState. Operasi ditentukan lewat field
 * tersembunyi `intent`, bukan dengan menukar fungsi action antar-render
 * (yang membuat form hapus keliru divalidasi sebagai create/update).
 */
export async function keuanganAction(
  state: KeuanganActionState,
  formData: FormData,
): Promise<KeuanganActionState> {
  const intent = String(formData.get("intent") ?? "create");
  if (intent === "delete") return deleteKeuanganAction(state, formData);
  if (intent === "update") return updateKeuanganAction(state, formData);
  return createKeuanganAction(state, formData);
}

export async function deleteKeuanganAction(
  _state: KeuanganActionState,
  formData: FormData,
): Promise<KeuanganActionState> {
  const session = await authorizeAction(RESOURCE, "delete");
  if (!session) return unauthorized();

  const id = String(formData.get("id") ?? "");
  const summary = String(formData.get("ringkasan") ?? "");
  if (!id) {
    return { status: "error", message: "Data penerimaan tidak ditemukan." };
  }

  try {
    await prisma.keuangan.delete({ where: { id } });
    await recordAdminAudit({
      aksi: "DELETE",
      entitas: "Keuangan",
      id_entitas: id,
      ringkasan: summary,
      session,
    });
    revalidatePath(path);
    return {
      status: "success",
      message: "Penerimaan berhasil dihapus.",
    };
  } catch (error) {
    return failure(error);
  }
}
