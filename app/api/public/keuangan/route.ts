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

// GET /api/public/keuangan — rincian penerimaan/persembahan per pemberi.
// Query: page, limit, kategori={TANGGUK|DIAKONIA|...}.
export async function GET(request: Request) {
  const denied = requireApiKey(request);
  if (denied) return denied;

  try {
    const { page, limit, skip } = parsePagination(request);
    const kategori = new URL(request.url).searchParams.get("kategori");
    const where = kategori ? { kategori } : {};

    const [total, rows] = await Promise.all([
      prisma.keuangan.count({ where }),
      prisma.keuangan.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
        include: {
          ibadah: { select: { tgl: true, waktu: true, nm_ibadah: true } },
        },
      }),
    ]);

    const data = rows.map((k) => ({
      id: k.id,
      kategori: k.kategori,
      nm_pemberi: k.nm_pemberi,
      jumlah: k.jumlah,
      keterangan: k.keterangan,
      created_at: k.created_at.toISOString(),
      ibadah: k.ibadah
        ? {
            nm_ibadah: k.ibadah.nm_ibadah,
            tgl: formatDate(k.ibadah.tgl),
            waktu: formatTime(k.ibadah.waktu),
          }
        : null,
    }));

    return jsonOk(data, buildMeta(page, limit, total));
  } catch (error) {
    console.error("API keuangan error:", error);
    return jsonError("Gagal memuat data keuangan.", 500);
  }
}

export async function OPTIONS() {
  return corsPreflight();
}
