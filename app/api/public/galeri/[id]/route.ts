import {
  corsPreflight,
  formatDate,
  jsonError,
  jsonOk,
  requireApiKey,
  toAbsoluteUrl,
} from "@/lib/api-public";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/public/galeri/{id} — detail album beserta seluruh fotonya.
export async function GET(request: Request, ctx: RouteContext<"/api/public/galeri/[id]">) {
  const denied = requireApiKey(request);
  if (denied) return denied;

  try {
    const { id } = await ctx.params;
    const a = await prisma.galeriAlbum.findFirst({
      where: { id, status: true },
      include: {
        foto: { orderBy: [{ order: "asc" }, { created_at: "asc" }] },
      },
    });
    if (!a) return jsonError("Album tidak ditemukan.", 404);

    return jsonOk({
      id: a.id,
      judul: a.judul,
      keterangan: a.keterangan,
      kategori: a.kategori,
      tgl: formatDate(a.tgl),
      foto: a.foto.map((f) => ({
        id: f.id,
        url: toAbsoluteUrl(request, f.url),
        caption: f.caption,
      })),
    });
  } catch (error) {
    console.error("API galeri detail error:", error);
    return jsonError("Gagal memuat detail album.", 500);
  }
}

export async function OPTIONS() {
  return corsPreflight();
}
