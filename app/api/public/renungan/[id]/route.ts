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

// GET /api/public/renungan/{id} — detail satu renungan.
export async function GET(request: Request, ctx: RouteContext<"/api/public/renungan/[id]">) {
  const denied = requireApiKey(request);
  if (denied) return denied;

  try {
    const { id } = await ctx.params;
    const r = await prisma.renungan.findUnique({ where: { id } });
    if (!r) return jsonError("Renungan tidak ditemukan.", 404);

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
    console.error("API renungan detail error:", error);
    return jsonError("Gagal memuat detail renungan.", 500);
  }
}

export async function OPTIONS() {
  return corsPreflight();
}
