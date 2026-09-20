import {
  buildMeta,
  corsPreflight,
  formatDate,
  formatTime,
  jsonError,
  jsonOk,
  parsePagination,
  requireApiKey,
} from "@/lib/api-public";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/public/kehadiran — statistik kehadiran per ibadah (terbaru dulu).
// Query: page, limit.
export async function GET(request: Request) {
  const denied = requireApiKey(request);
  if (denied) return denied;

  try {
    const { page, limit, skip } = parsePagination(request);

    const [total, rows] = await Promise.all([
      prisma.kehadiran.count(),
      prisma.kehadiran.findMany({
        orderBy: { ibadah: { tgl: "desc" } },
        skip,
        take: limit,
        include: {
          ibadah: { select: { tgl: true, waktu: true, nm_ibadah: true } },
        },
      }),
    ]);

    const data = rows.map((k) => ({
      id: k.id,
      laki_laki: k.laki_laki,
      perempuan: k.perempuan,
      anak: k.anak,
      total: k.total,
      ibadah: {
        nm_ibadah: k.ibadah.nm_ibadah,
        tgl: formatDate(k.ibadah.tgl),
        waktu: formatTime(k.ibadah.waktu),
      },
    }));

    return jsonOk(data, buildMeta(page, limit, total));
  } catch (error) {
    console.error("API kehadiran error:", error);
    return jsonError("Gagal memuat data kehadiran.", 500);
  }
}

export async function OPTIONS() {
  return corsPreflight();
}
