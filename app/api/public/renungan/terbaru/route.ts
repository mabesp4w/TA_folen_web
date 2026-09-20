import {
  corsPreflight,
  formatDate,
  jsonError,
  jsonOk,
  requireApiKey,
} from "@/lib/api-public";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/public/renungan/terbaru — satu renungan terbaru (untuk beranda app).
export async function GET(request: Request) {
  const denied = requireApiKey(request);
  if (denied) return denied;

  try {
    const r = await prisma.renungan.findFirst({
      orderBy: [{ tgl_publish: "desc" }, { created_at: "desc" }],
    });
    if (!r) return jsonError("Belum ada renungan.", 404);

    return jsonOk({
      id: r.id,
      judul: r.judul,
      bacaan: r.bacaan,
      kutipan: r.kutipan,
      isi: r.isi,
      sumber: r.sumber,
      tgl_publish: formatDate(r.tgl_publish),
    });
  } catch (error) {
    console.error("API renungan terbaru error:", error);
    return jsonError("Gagal memuat renungan terbaru.", 500);
  }
}

export async function OPTIONS() {
  return corsPreflight();
}
