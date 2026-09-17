"use server";

import { revalidatePath } from "next/cache";
import { recordAdminAudit } from "@/lib/admin-audit";
import { getAdminSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { masterDataSchema, type MasterDataActionState } from "./schema";

type Resource = "rayon" | "unsur";

const config = {
  rayon: {
    entity: "Rayon",
    field: "nm_rayon",
    path: "/admin/rayon",
  },
  unsur: {
    entity: "Unsur",
    field: "nm_unsur",
    path: "/admin/unsur",
  },
} as const;

async function authorize() {
  const session = await getAdminSession();
  if (!session) {
    return {
      error: {
        status: "error",
        message: "Anda tidak memiliki akses untuk mengubah data.",
      } satisfies MasterDataActionState,
      session: null,
    };
  }

  return { error: null, session };
}

function parseResource(formData: FormData): Resource | null {
  const value = formData.get("resource");
  return value === "rayon" || value === "unsur" ? value : null;
}

function failure(error: unknown): MasterDataActionState {
  console.error("Master data mutation failed", error);
  return {
    status: "error",
    message: "Perubahan tidak dapat disimpan. Pastikan nama belum digunakan dan data tidak sedang dipakai.",
  };
}

export async function createMasterDataAction(
  _state: MasterDataActionState,
  formData: FormData,
): Promise<MasterDataActionState> {
  const { error, session } = await authorize();
  if (error || !session) return error!;

  const resource = parseResource(formData);
  const parsed = masterDataSchema.safeParse({ name: formData.get("name") });
  if (!resource || !parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali data yang diisi.",
      errors: parsed.success ? undefined : parsed.error.flatten().fieldErrors,
    };
  }

  const itemConfig = config[resource];

  try {
    const item = resource === "rayon"
      ? await prisma.rayon.create({ data: { nm_rayon: parsed.data.name } })
      : await prisma.unsur.create({ data: { nm_unsur: parsed.data.name } });

    await recordAdminAudit({
      aksi: "CREATE",
      detail: parsed.data,
      entitas: itemConfig.entity,
      id_entitas: item.id,
      ringkasan: parsed.data.name,
      session,
    });
    revalidatePath(itemConfig.path);
    return { status: "success", message: `${itemConfig.entity} berhasil ditambahkan.` };
  } catch (mutationError) {
    return failure(mutationError);
  }
}

export async function updateMasterDataAction(
  _state: MasterDataActionState,
  formData: FormData,
): Promise<MasterDataActionState> {
  const { error, session } = await authorize();
  if (error || !session) return error!;

  const id = String(formData.get("id") ?? "");
  const resource = parseResource(formData);
  const parsed = masterDataSchema.safeParse({ name: formData.get("name") });
  if (!id || !resource || !parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali data yang diisi.",
      errors: parsed.success ? undefined : parsed.error.flatten().fieldErrors,
    };
  }

  const itemConfig = config[resource];

  try {
    const item = resource === "rayon"
      ? await prisma.rayon.update({ where: { id }, data: { nm_rayon: parsed.data.name } })
      : await prisma.unsur.update({ where: { id }, data: { nm_unsur: parsed.data.name } });

    await recordAdminAudit({
      aksi: "UPDATE",
      detail: parsed.data,
      entitas: itemConfig.entity,
      id_entitas: item.id,
      ringkasan: parsed.data.name,
      session,
    });
    revalidatePath(itemConfig.path);
    return { status: "success", message: `${itemConfig.entity} berhasil diperbarui.` };
  } catch (mutationError) {
    return failure(mutationError);
  }
}

export async function deleteMasterDataAction(
  _state: MasterDataActionState,
  formData: FormData,
): Promise<MasterDataActionState> {
  const { error, session } = await authorize();
  if (error || !session) return error!;

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "");
  const resource = parseResource(formData);
  if (!id || !resource) {
    return { status: "error", message: "Data tidak ditemukan." };
  }

  const itemConfig = config[resource];

  try {
    if (resource === "rayon") {
      await prisma.rayon.delete({ where: { id } });
    } else {
      await prisma.unsur.delete({ where: { id } });
    }

    await recordAdminAudit({
      aksi: "DELETE",
      entitas: itemConfig.entity,
      id_entitas: id,
      ringkasan: name,
      session,
    });
    revalidatePath(itemConfig.path);
    return { status: "success", message: `${itemConfig.entity} berhasil dihapus.` };
  } catch (mutationError) {
    return failure(mutationError);
  }
}
