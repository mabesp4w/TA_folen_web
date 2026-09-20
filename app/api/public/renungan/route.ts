import {
  buildMeta,
  corsPreflight,
  formatDate,
  jsonError,
  jsonOk,
  parseDateParam,
  parsePagination,
  requireApiKey,
} from "@/lib/api-public";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/public/renungan — daftar renungan harian (terbaru dulu).
// Query: page, limit, tgl=YYYY-MM-DD (opsional, memfilter tanggal terbit tertentu).
export async function GET(request: Request) {
  const denied = requireApiKey(request);
  if (denied) return denied;

  try {
    const { page, limit, skip } = parsePagination(request);
    const tgl = parseDateParam(request, "tgl");
    const where = tgl ? { tgl_publish: tgl } : {};

    const [total, rows] = await Promise.all([
      prisma.renungan.count({ where }),
      prisma.renungan.findMany({
        where,
        orderBy: [{ tgl_publish: "desc" }, { created_at: "desc" }],
        skip,
        take: limit,
      }),
    ]);

    const data = rows.map((r) => ({
      id: r.id,
      judul: r.judul,
      bacaan: r.bacaan,
      kutipan: r.kutipan,
      isi: r.isi,
      sumber: r.sumber,
      tgl_publish: formatDate(r.tgl_publish),
    }));

    return jsonOk(data, buildMeta(page, limit, total));
  } catch (error) {
    console.error("API renungan error:", error);
    return jsonError("Gagal memuat data renungan.", 500);
  }
}

export async function OPTIONS() {
  return corsPreflight();
}
