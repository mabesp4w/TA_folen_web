import {
  corsPreflight,
  jsonError,
  jsonOk,
  requireApiKey,
} from "@/lib/api-public";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/public/rayon — daftar rayon beserta jumlah jemaat.
export async function GET(request: Request) {
  const denied = requireApiKey(request);
  if (denied) return denied;

  try {
    const rows = await prisma.rayon.findMany({
      orderBy: { nm_rayon: "asc" },
      include: { _count: { select: { jemaat: true } } },
    });

    const data = rows.map((r) => ({
      id: r.id,
      nm_rayon: r.nm_rayon,
      jumlah_jemaat: r._count.jemaat,
    }));

    return jsonOk(data);
  } catch (error) {
    console.error("API rayon error:", error);
    return jsonError("Gagal memuat data rayon.", 500);
  }
}

export async function OPTIONS() {
  return corsPreflight();
}
