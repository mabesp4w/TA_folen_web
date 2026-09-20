"use server";

import { mkdir, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { recordAdminAudit } from "@/lib/admin-audit";
import { getAdminSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { slideSchema, type SlideActionState } from "./schema";

const adminPath = "/admin/slide";
const publicPrefix = "/uploads/slide/";
const uploadRoot = path.resolve(process.cwd(), "public/uploads/slide");
const maxFileSize = 10 * 1024 * 1024;

function unauthorized(): SlideActionState {
  return { status: "error", message: "Anda tidak memiliki akses untuk mengubah data." };
}

function failure(error: unknown): SlideActionState {
  console.error("Slide mutation failed", error);
  return { status: "error", message: "Data slide gagal diproses. Silakan coba lagi." };
}

function parseForm(formData: FormData) {
  return slideSchema.safeParse({
    judul: formData.get("judul"),
    teks: formData.get("teks"),
    link_url: formData.get("link_url"),
    link_teks: formData.get("link_teks"),
    status: formData.get("status") === "on",
  });
}

function fileFor(order: number) {
  return path.resolve(uploadRoot, `${order}.webp`);
}

function urlFor(order: number) {
  return `${publicPrefix}${order}.webp`;
}

async function writeImage(order: number, file: File) {
  if (file.type !== "image/webp") throw new Error("Berkas gambar harus berformat WebP.");
  if (file.size <= 0 || file.size > maxFileSize) throw new Error("Ukuran gambar tidak valid.");
  await mkdir(uploadRoot, { recursive: true });
  await writeFile(fileFor(order), Buffer.from(await file.arrayBuffer()));
}

async function moveImage(fromOrder: number, toOrder: number) {
  try {
    await rename(fileFor(fromOrder), fileFor(toOrder));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

async function removeImage(order: number) {
  try {
    await unlink(fileFor(order));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

export async function createSlideAction(
  _state: SlideActionState,
  formData: FormData,
): Promise<SlideActionState> {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const parsed = parseForm(formData);
  const file = formData.get("image");
  if (!parsed.success) {
    return { status: "error", message: "Periksa kembali data slide.", errors: parsed.error.flatten().fieldErrors };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Gambar slide wajib diunggah." };
  }

  try {
    const last = await prisma.slide.aggregate({ _max: { order: true } });
    const order = (last._max.order ?? 0) + 1;
    await writeImage(order, file);
    try {
      const slide = await prisma.slide.create({
        data: { ...parsed.data, order, url: urlFor(order) },
      });
      await recordAdminAudit({
        aksi: "CREATE",
        detail: parsed.data,
        entitas: "Slide",
        id_entitas: slide.id,
        ringkasan: slide.judul ?? `Slide #${order}`,
        session,
      });
    } catch (dbError) {
      await removeImage(order);
      throw dbError;
    }
    revalidatePath(adminPath);
    return { status: "success", message: "Slide berhasil ditambahkan." };
  } catch (error) {
    return failure(error);
  }
}

export async function updateSlideAction(
  _state: SlideActionState,
  formData: FormData,
): Promise<SlideActionState> {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const id = String(formData.get("id") ?? "");
  const parsed = parseForm(formData);
  const file = formData.get("image");
  if (!id || !parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali data slide.",
      errors: parsed.success ? undefined : parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const existing = await prisma.slide.findUnique({ where: { id } });
    if (!existing) return { status: "error", message: "Slide tidak ditemukan." };

    // Ganti gambar hanya bila berkas baru diunggah; nama berkas tetap mengikuti order.
    if (file instanceof File && file.size > 0) {
      await writeImage(existing.order, file);
    }

    const slide = await prisma.slide.update({
      where: { id },
      data: { ...parsed.data, url: urlFor(existing.order) },
    });
    await recordAdminAudit({
      aksi: "UPDATE",
      detail: parsed.data,
      entitas: "Slide",
      id_entitas: slide.id,
      ringkasan: slide.judul ?? `Slide #${existing.order}`,
      session,
    });
    revalidatePath(adminPath);
    return { status: "success", message: "Slide berhasil diperbarui." };
  } catch (error) {
    return failure(error);
  }
}

export async function deleteSlideAction(
  _state: SlideActionState,
  formData: FormData,
): Promise<SlideActionState> {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const id = String(formData.get("id") ?? "");
  if (!id) return { status: "error", message: "Slide tidak ditemukan." };

  try {
    const target = await prisma.slide.findUnique({ where: { id } });
    if (!target) return { status: "error", message: "Slide tidak ditemukan." };

    // Slide dengan order lebih besar dari target, urut naik agar setiap slot
    // yang dikosongkan selalu terisi sebelum slot berikutnya butuh diisi.
    const following = await prisma.slide.findMany({
      where: { order: { gt: target.order } },
      orderBy: { order: "asc" },
    });

    await prisma.$transaction(async (tx) => {
      await tx.slide.delete({ where: { id } });
      for (const slide of following) {
        const nextOrder = slide.order - 1;
        await tx.slide.update({
          where: { id: slide.id },
          data: { order: nextOrder, url: urlFor(nextOrder) },
        });
      }
    });

    // Sinkronkan berkas: hapus milik target, lalu geser berkas pengikutnya turun.
    await removeImage(target.order);
    for (const slide of following) {
      await moveImage(slide.order, slide.order - 1);
    }

    await recordAdminAudit({
      aksi: "DELETE",
      entitas: "Slide",
      id_entitas: id,
      ringkasan: target.judul ?? `Slide #${target.order}`,
      session,
    });
    revalidatePath(adminPath);
    return { status: "success", message: "Slide berhasil dihapus." };
  } catch (error) {
    return failure(error);
  }
}

export async function moveSlideAction(
  _state: SlideActionState,
  formData: FormData,
): Promise<SlideActionState> {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const id = String(formData.get("id") ?? "");
  const direction = String(formData.get("direction") ?? "");
  if (!id || (direction !== "up" && direction !== "down")) {
    return { status: "error", message: "Permintaan pemindahan tidak valid." };
  }

  try {
    const current = await prisma.slide.findUnique({ where: { id } });
    if (!current) return { status: "error", message: "Slide tidak ditemukan." };

    const neighbor = await prisma.slide.findFirst({
      where:
        direction === "up"
          ? { order: { lt: current.order } }
          : { order: { gt: current.order } },
      orderBy: { order: direction === "up" ? "desc" : "asc" },
    });
    if (!neighbor) {
      return { status: "success", message: "Slide sudah berada di ujung urutan." };
    }

    // Tukar order via nilai sementara (0) agar tidak melanggar keunikan order.
    await prisma.$transaction(async (tx) => {
      await tx.slide.update({ where: { id: current.id }, data: { order: 0, url: urlFor(0) } });
      await tx.slide.update({
        where: { id: neighbor.id },
        data: { order: current.order, url: urlFor(current.order) },
      });
      await tx.slide.update({
        where: { id: current.id },
        data: { order: neighbor.order, url: urlFor(neighbor.order) },
      });
    });

    // Tukar berkas gambar melalui nama sementara (0.webp).
    await moveImage(current.order, 0);
    await moveImage(neighbor.order, current.order);
    await moveImage(0, neighbor.order);

    revalidatePath(adminPath);
    return { status: "success", message: "Urutan slide diperbarui." };
  } catch (error) {
    return failure(error);
  }
}
