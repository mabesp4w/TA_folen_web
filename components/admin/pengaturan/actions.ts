"use server";

import { revalidatePath } from "next/cache";
import { recordAdminAudit } from "@/lib/admin-audit";
import { hashPassword } from "@/lib/auth";
import { getAdminSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import {
  createUserSchema,
  updateUserSchema,
  type UserActionState,
} from "./schema";

const adminPath = "/admin/pengaturan";

function unauthorized(): UserActionState {
  return { status: "error", message: "Anda tidak memiliki akses untuk mengubah data." };
}

function failure(error: unknown): UserActionState {
  console.error("User mutation failed", error);
  return {
    status: "error",
    message: "Data akun gagal diproses. Pastikan username belum digunakan, lalu coba lagi.",
  };
}

// Tautkan akun ke satu Badan Pengurus (relasi 1-1). Lepas tautan lama milik akun
// ini terlebih dahulu, lalu pasang tautan baru bila dipilih. Hanya untuk KETUA_UNSUR.
async function syncPengurusLink(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  userId: string,
  role: string,
  pengurusId: string | null,
) {
  await tx.badanPengurus.updateMany({
    where: { user_id: userId },
    data: { user_id: null },
  });

  if (role === "KETUA_UNSUR" && pengurusId) {
    await tx.badanPengurus.update({
      where: { id: pengurusId },
      data: { user_id: userId },
    });
  }
}

export async function createUserAction(
  _state: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const parsed = createUserSchema.safeParse({
    username: formData.get("username"),
    role: formData.get("role"),
    password: formData.get("password"),
    badan_pengurus_id: formData.get("badan_pengurus_id"),
  });
  if (!parsed.success) {
    return { status: "error", message: "Periksa kembali data akun.", errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: parsed.data.username,
          password: hashPassword(parsed.data.password),
          role: parsed.data.role,
        },
      });
      await syncPengurusLink(tx, user.id, parsed.data.role, parsed.data.badan_pengurus_id);
      return user;
    });

    await recordAdminAudit({
      aksi: "CREATE",
      detail: { username: parsed.data.username, role: parsed.data.role },
      entitas: "User",
      id_entitas: created.id,
      ringkasan: parsed.data.username,
      session,
    });
    revalidatePath(adminPath);
    return { status: "success", message: "Akun berhasil ditambahkan." };
  } catch (error) {
    return failure(error);
  }
}

export async function updateUserAction(
  _state: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const id = String(formData.get("id") ?? "");
  const parsed = updateUserSchema.safeParse({
    username: formData.get("username"),
    role: formData.get("role"),
    password: formData.get("password"),
    badan_pengurus_id: formData.get("badan_pengurus_id"),
  });
  if (!id || !parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali data akun.",
      errors: parsed.success ? undefined : parsed.error.flatten().fieldErrors,
    };
  }

  // Cegah admin menurunkan perannya sendiri sehingga kehilangan akses.
  if (id === session.id && parsed.data.role !== "ADMIN") {
    return { status: "error", message: "Anda tidak dapat mengubah peran akun sendiri." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          username: parsed.data.username,
          role: parsed.data.role,
          ...(parsed.data.password ? { password: hashPassword(parsed.data.password) } : {}),
        },
      });
      await syncPengurusLink(tx, id, parsed.data.role, parsed.data.badan_pengurus_id);
    });

    await recordAdminAudit({
      aksi: "UPDATE",
      detail: {
        username: parsed.data.username,
        role: parsed.data.role,
        password_changed: Boolean(parsed.data.password),
      },
      entitas: "User",
      id_entitas: id,
      ringkasan: parsed.data.username,
      session,
    });
    revalidatePath(adminPath);
    return { status: "success", message: "Akun berhasil diperbarui." };
  } catch (error) {
    return failure(error);
  }
}

export async function deleteUserAction(
  _state: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const id = String(formData.get("id") ?? "");
  const ringkasan = String(formData.get("ringkasan") ?? "");
  if (!id) return { status: "error", message: "Akun tidak ditemukan." };

  if (id === session.id) {
    return { status: "error", message: "Anda tidak dapat menghapus akun yang sedang digunakan." };
  }

  try {
    // Cegah menghapus admin terakhir agar sistem tidak terkunci.
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return { status: "error", message: "Akun tidak ditemukan." };
    if (target.role === "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        return { status: "error", message: "Tidak dapat menghapus admin terakhir." };
      }
    }

    // Relasi BadanPengurus.user_id & LogAktivitas.id_user otomatis di-set NULL.
    await prisma.user.delete({ where: { id } });
    await recordAdminAudit({
      aksi: "DELETE",
      entitas: "User",
      id_entitas: id,
      ringkasan: ringkasan || target.username,
      session,
    });
    revalidatePath(adminPath);
    return { status: "success", message: "Akun berhasil dihapus." };
  } catch (error) {
    return failure(error);
  }
}
