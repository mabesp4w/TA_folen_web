"use server";

import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { recordAdminAudit } from "@/lib/admin-audit";
import { getAdminSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import {
  galeriAlbumSchema,
  galeriFotoSchema,
  type GaleriActionState,
} from "./schema";

const adminPath = "/admin/galeri";
const publicPrefix = "/uploads/galeri/";
const uploadRoot = path.resolve(process.cwd(), "public/uploads/galeri");
const maxFileSize = 10 * 1024 * 1024;

function unauthorized(): GaleriActionState {
  return { status: "error", message: "Anda tidak memiliki akses untuk mengubah data." };
}

function failure(error: unknown): GaleriActionState {
  console.error(error);
  return { status: "error", message: "Data galeri gagal diproses. Silakan coba lagi." };
}

function parseAlbum(formData: FormData) {
  return galeriAlbumSchema.safeParse({
    judul: formData.get("judul"),
    keterangan: formData.get("keterangan"),
    kategori: formData.get("kategori"),
    tgl: formData.get("tgl"),
    status: formData.get("status") === "on",
    order: formData.get("order"),
  });
}

function albumData(data: {
  judul: string;
  keterangan: string | null;
  kategori: string | null;
  tgl: string | null;
  status: boolean;
  order: number;
}) {
  return {
    judul: data.judul,
    keterangan: data.keterangan,
    kategori: data.kategori,
    tgl: data.tgl ? new Date(`${data.tgl}T00:00:00.000Z`) : null,
    status: data.status,
    order: data.order,
  };
}

function safeDiskPath(url: string): string | null {
  if (!url.startsWith(publicPrefix) || url.includes("\\") || url.includes("..")) return null;
  const relative = url.slice(publicPrefix.length);
  if (!relative || relative.includes("/")) return null;
  const resolved = path.resolve(uploadRoot, relative);
  return resolved.startsWith(`${uploadRoot}${path.sep}`) ? resolved : null;
}

async function removeStoredFile(url: string) {
  const diskPath = safeDiskPath(url);
  if (!diskPath) return;
  try {
    await unlink(diskPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

async function savePhoto(file: File) {
  if (file.type !== "image/webp") throw new Error("Berkas foto harus berformat WebP.");
  if (file.size <= 0 || file.size > maxFileSize) throw new Error("Ukuran foto tidak valid.");
  await mkdir(uploadRoot, { recursive: true });
  const filename = `${randomUUID()}.webp`;
  const diskPath = path.resolve(uploadRoot, filename);
  if (!diskPath.startsWith(`${uploadRoot}${path.sep}`)) throw new Error("Lokasi berkas tidak valid.");
  await writeFile(diskPath, Buffer.from(await file.arrayBuffer()));
  return `${publicPrefix}${filename}`;
}

const maxPhotosPerUpload = 30;

function extractPhotos(formData: FormData): File[] {
  return formData
    .getAll("photos")
    .filter((value): value is File => value instanceof File && value.size > 0);
}

// Menyimpan berkas foto lalu membuat baris GaleriFoto berurutan. Bila salah satu
// gagal, seluruh berkas yang sudah tersimpan dihapus kembali agar tidak ada sisa.
async function persistPhotos(idAlbum: string, files: File[], startOrder: number) {
  const saved: string[] = [];
  try {
    for (const [index, file] of files.entries()) {
      const url = await savePhoto(file);
      saved.push(url);
      await prisma.galeriFoto.create({
        data: { id_album: idAlbum, url, order: startOrder + index },
      });
    }
  } catch (error) {
    await Promise.all(saved.map(removeStoredFile));
    throw error;
  }
}

export async function createAlbumAction(
  _state: GaleriActionState,
  formData: FormData,
): Promise<GaleriActionState> {
  const session = await getAdminSession();
  if (!session) return unauthorized();
  const parsed = parseAlbum(formData);
  if (!parsed.success) {
    return { status: "error", message: "Periksa kembali data album.", errors: parsed.error.flatten().fieldErrors };
  }
  const photos = extractPhotos(formData);
  if (photos.length > maxPhotosPerUpload) {
    return { status: "error", message: `Maksimal ${maxPhotosPerUpload} foto per unggahan.` };
  }
  let albumId: string | null = null;
  try {
    const album = await prisma.galeriAlbum.create({ data: albumData(parsed.data) });
    albumId = album.id;
    if (photos.length > 0) await persistPhotos(album.id, photos, 0);
    await recordAdminAudit({ aksi: "CREATE", entitas: "GaleriAlbum", id_entitas: album.id, ringkasan: album.judul, detail: parsed.data, session });
    revalidatePath(adminPath);
    return {
      status: "success",
      message:
        photos.length > 0
          ? `Album berhasil ditambahkan dengan ${photos.length} foto.`
          : "Album berhasil ditambahkan.",
    };
  } catch (error) {
    // Batalkan album yang sudah terbuat bila penyimpanan foto gagal.
    if (albumId) await prisma.galeriAlbum.delete({ where: { id: albumId } }).catch(() => {});
    return failure(error);
  }
}

export async function updateAlbumAction(
  _state: GaleriActionState,
  formData: FormData,
): Promise<GaleriActionState> {
  const session = await getAdminSession();
  if (!session) return unauthorized();
  const id = String(formData.get("id") ?? "");
  const parsed = parseAlbum(formData);
  if (!id || !parsed.success) {
    return { status: "error", message: "Periksa kembali data album.", errors: parsed.success ? undefined : parsed.error.flatten().fieldErrors };
  }
  const photos = extractPhotos(formData);
  if (photos.length > maxPhotosPerUpload) {
    return { status: "error", message: `Maksimal ${maxPhotosPerUpload} foto per unggahan.` };
  }
  try {
    const album = await prisma.galeriAlbum.update({ where: { id }, data: albumData(parsed.data) });
    if (photos.length > 0) {
      const last = await prisma.galeriFoto.aggregate({ where: { id_album: id }, _max: { order: true } });
      await persistPhotos(id, photos, (last._max.order ?? -1) + 1);
    }
    await recordAdminAudit({ aksi: "UPDATE", entitas: "GaleriAlbum", id_entitas: album.id, ringkasan: album.judul, detail: parsed.data, session });
    revalidatePath(adminPath);
    return {
      status: "success",
      message:
        photos.length > 0
          ? `Album diperbarui dan ${photos.length} foto ditambahkan.`
          : "Album berhasil diperbarui.",
    };
  } catch (error) {
    return failure(error);
  }
}

export async function deleteAlbumAction(
  _state: GaleriActionState,
  formData: FormData,
): Promise<GaleriActionState> {
  const session = await getAdminSession();
  if (!session) return unauthorized();
  const id = String(formData.get("id") ?? "");
  if (!id) return { status: "error", message: "Album tidak ditemukan." };
  try {
    const album = await prisma.galeriAlbum.findUnique({ where: { id }, include: { foto: true } });
    if (!album) return { status: "error", message: "Album tidak ditemukan." };
    await prisma.galeriAlbum.delete({ where: { id } });
    await Promise.all(album.foto.map((foto) => removeStoredFile(foto.url)));
    await recordAdminAudit({ aksi: "DELETE", entitas: "GaleriAlbum", id_entitas: id, ringkasan: album.judul, session });
    revalidatePath(adminPath);
    return { status: "success", message: "Album dan seluruh fotonya berhasil dihapus." };
  } catch (error) {
    return failure(error);
  }
}

export async function addPhotosAction(
  _state: GaleriActionState,
  formData: FormData,
): Promise<GaleriActionState> {
  const session = await getAdminSession();
  if (!session) return unauthorized();
  const idAlbum = String(formData.get("id_album") ?? "");
  const files = formData.getAll("photos").filter((value): value is File => value instanceof File && value.size > 0);
  const parsed = galeriFotoSchema.pick({ id_album: true }).safeParse({ id_album: idAlbum });
  if (!parsed.success || files.length === 0 || files.length > 30) {
    return { status: "error", message: "Pilih 1 sampai 30 foto WebP yang valid." };
  }
  const saved: string[] = [];
  try {
    const album = await prisma.galeriAlbum.findUnique({ where: { id: idAlbum } });
    if (!album) return { status: "error", message: "Album tidak ditemukan." };
    const last = await prisma.galeriFoto.aggregate({ where: { id_album: idAlbum }, _max: { order: true } });
    for (const [index, file] of files.entries()) {
      const url = await savePhoto(file);
      saved.push(url);
      await prisma.galeriFoto.create({ data: { id_album: idAlbum, url, order: (last._max.order ?? -1) + index + 1 } });
    }
    await recordAdminAudit({ aksi: "CREATE", entitas: "GaleriFoto", id_entitas: idAlbum, ringkasan: `${files.length} foto untuk ${album.judul}`, session });
    revalidatePath(adminPath);
    return { status: "success", message: `${files.length} foto berhasil ditambahkan.` };
  } catch (error) {
    await Promise.all(saved.map(removeStoredFile));
    return failure(error);
  }
}

export async function updatePhotoAction(
  _state: GaleriActionState,
  formData: FormData,
): Promise<GaleriActionState> {
  const session = await getAdminSession();
  if (!session) return unauthorized();
  const id = String(formData.get("id") ?? "");
  const parsed = galeriFotoSchema.safeParse({ id_album: formData.get("id_album"), caption: formData.get("caption"), order: formData.get("order") });
  if (!id || !parsed.success) {
    return { status: "error", message: "Periksa caption dan urutan foto.", errors: parsed.success ? undefined : parsed.error.flatten().fieldErrors };
  }
  try {
    const foto = await prisma.galeriFoto.update({ where: { id, id_album: parsed.data.id_album }, data: { caption: parsed.data.caption, order: parsed.data.order } });
    await recordAdminAudit({ aksi: "UPDATE", entitas: "GaleriFoto", id_entitas: foto.id, ringkasan: foto.caption ?? "Foto galeri", detail: parsed.data, session });
    revalidatePath(adminPath);
    return { status: "success", message: "Foto berhasil diperbarui." };
  } catch (error) {
    return failure(error);
  }
}

export async function deletePhotoAction(
  _state: GaleriActionState,
  formData: FormData,
): Promise<GaleriActionState> {
  const session = await getAdminSession();
  if (!session) return unauthorized();
  const id = String(formData.get("id") ?? "");
  if (!id) return { status: "error", message: "Foto tidak ditemukan." };
  try {
    const foto = await prisma.galeriFoto.findUnique({ where: { id } });
    if (!foto) return { status: "error", message: "Foto tidak ditemukan." };
    await prisma.galeriFoto.delete({ where: { id } });
    await removeStoredFile(foto.url);
    await recordAdminAudit({ aksi: "DELETE", entitas: "GaleriFoto", id_entitas: id, ringkasan: foto.caption ?? "Foto galeri", session });
    revalidatePath(adminPath);
    return { status: "success", message: "Foto berhasil dihapus." };
  } catch (error) {
    return failure(error);
  }
}
