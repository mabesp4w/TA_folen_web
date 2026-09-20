import {
  buildMeta,
  corsPreflight,
  formatDate,
  jsonError,
  jsonOk,
  parsePagination,
  requireApiKey,
  toAbsoluteUrl,
} from "@/lib/api-public";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/public/galeri — daftar album galeri yang tampil, beserta jumlah & foto sampul.
// Query: page, limit.
export async function GET(request: Request) {
  const denied = requireApiKey(request);
  if (denied) return denied;

  try {
    const { page, limit, skip } = parsePagination(request);
    const where = { status: true };

    const [total, rows] = await Promise.all([
      prisma.galeriAlbum.count({ where }),
      prisma.galeriAlbum.findMany({
        where,
        orderBy: [{ order: "asc" }, { created_at: "desc" }],
        skip,
        take: limit,
        include: {
          _count: { select: { foto: true } },
          foto: {
            orderBy: [{ order: "asc" }, { created_at: "asc" }],
            take: 1,
            select: { url: true },
          },
        },
      }),
    ]);

    const data = rows.map((a) => ({
      id: a.id,
      judul: a.judul,
      keterangan: a.keterangan,
      kategori: a.kategori,
      tgl: formatDate(a.tgl),
      jumlah_foto: a._count.foto,
      sampul: toAbsoluteUrl(request, a.foto[0]?.url ?? null),
    }));

    return jsonOk(data, buildMeta(page, limit, total));
  } catch (error) {
    console.error("API galeri error:", error);
    return jsonError("Gagal memuat data galeri.", 500);
  }
}

export async function OPTIONS() {
  return corsPreflight();
}
