import {
  buildMeta,
  corsPreflight,
  jsonError,
  jsonOk,
  parsePagination,
  requireApiKey,
} from "@/lib/api-public";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/public/pengumuman — daftar pengumuman/warta yang aktif.
// Query: page, limit.
export async function GET(request: Request) {
  const denied = requireApiKey(request);
  if (denied) return denied;

  try {
    const { page, limit, skip } = parsePagination(request);
    const where = { status: true };

    const [total, rows] = await Promise.all([
      prisma.pengumuman.count({ where }),
      prisma.pengumuman.findMany({
        where,
        orderBy: [{ order: "asc" }, { tgl_publish: "desc" }],
        skip,
        take: limit,
      }),
    ]);

    const data = rows.map((p) => ({
      id: p.id,
      judul: p.judul,
      isi: p.isi,
      tgl_publish: p.tgl_publish.toISOString(),
    }));

    return jsonOk(data, buildMeta(page, limit, total));
  } catch (error) {
    console.error("API pengumuman error:", error);
    return jsonError("Gagal memuat data pengumuman.", 500);
  }
}

export async function OPTIONS() {
  return corsPreflight();
}
