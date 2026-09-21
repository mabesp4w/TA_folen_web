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

// GET /api/public/jemaat/{id} — detail satu jemaat.
export async function GET(request: Request, ctx: RouteContext<"/api/public/jemaat/[id]">) {
  const denied = requireApiKey(request);
  if (denied) return denied;

  try {
    const { id } = await ctx.params;
    const j = await prisma.jemaat.findUnique({
      where: { id },
      include: {
        keluarga: {
          select: {
            no_kk: true,
            alamat_blok: true,
            id_rayon: true,
            rayon: { select: { nm_rayon: true } },
          },
        },
      },
    });
    if (!j) return jsonError("Jemaat tidak ditemukan.", 404);

    return jsonOk({
      id: j.id,
      nm_lengkap: j.nm_lengkap,
      tgl_lahir: formatDate(j.tgl_lahir),
      jenkel: j.jenkel,
      stat_keluarga: j.stat_keluarga,
      id_keluarga: j.id_keluarga,
      no_kk: j.keluarga?.no_kk ?? null,
      alamat_blok: j.keluarga?.alamat_blok ?? null,
      status: j.status,
      rayon: j.keluarga?.rayon?.nm_rayon ?? null,
      id_rayon: j.keluarga?.id_rayon ?? null,
    });
  } catch (error) {
    console.error("API jemaat detail error:", error);
    return jsonError("Gagal memuat detail jemaat.", 500);
  }
}

export async function OPTIONS() {
  return corsPreflight();
}
