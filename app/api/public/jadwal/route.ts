import {
  buildMeta,
  corsPreflight,
  formatDate,
  formatTime,
  jsonError,
  jsonOk,
  parseDateParam,
  parsePagination,
  requireApiKey,
  todayUtc,
} from "@/lib/api-public";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/public/jadwal — jadwal ibadah beserta tempat & pelayan.
// Query: dari=YYYY-MM-DD, sampai=YYYY-MM-DD (opsional; default: hari ini ke depan), page, limit.
export async function GET(request: Request) {
  const denied = requireApiKey(request);
  if (denied) return denied;

  try {
    const { page, limit, skip } = parsePagination(request);
    const dari = parseDateParam(request, "dari");
    const sampai = parseDateParam(request, "sampai");

    // Default: tampilkan jadwal mulai hari ini ke depan.
    const tglFilter = dari || sampai ? {} : { gte: todayUtc() };
    const where = {
      tgl: {
        ...tglFilter,
        ...(dari ? { gte: dari } : {}),
        ...(sampai ? { lte: sampai } : {}),
      },
    };

    const [total, rows] = await Promise.all([
      prisma.ibadah.count({ where }),
      prisma.ibadah.findMany({
        where,
        orderBy: [{ tgl: "asc" }, { waktu: "asc" }],
        skip,
        take: limit,
        include: {
          unsur: { select: { nm_unsur: true } },
          jemaat: { select: { nm_lengkap: true, alamat_blok: true, rayon: { select: { nm_rayon: true } } } },
          pelayan: { select: { nm_lengkap: true } },
        },
      }),
    ]);

    const data = rows.map((i) => ({
      id: i.id,
      nm_ibadah: i.nm_ibadah,
      unsur: i.unsur?.nm_unsur ?? null,
      gabungan: i.gabungan,
      sektor: i.sektor,
      tgl: formatDate(i.tgl),
      waktu: formatTime(i.waktu),
      // Lokasi: pakai override bila ada, jika tidak turunkan dari rumah tuan rumah.
      tempat: i.tempat ?? (i.jemaat ? `Kel. ${i.jemaat.nm_lengkap}` : null),
      alamat_tempat: i.alamat_tempat ?? i.jemaat?.alamat_blok ?? null,
      rayon: i.jemaat?.rayon?.nm_rayon ?? null,
      tuan_rumah: i.jemaat?.nm_lengkap ?? null,
      // Pelayan firman: jemaat terkait, atau teks cadangan.
      pelayan_firman: i.pelayan?.nm_lengkap ?? i.pelayan_firman ?? null,
      liturgos: i.liturgos,
      pembacaan_alkitab: i.pembacaan_alkitab,
      piket: i.piket,
      p_organ: i.p_organ,
      catatan: i.catatan,
    }));

    return jsonOk(data, buildMeta(page, limit, total));
  } catch (error) {
    console.error("API jadwal error:", error);
    return jsonError("Gagal memuat jadwal ibadah.", 500);
  }
}

export async function OPTIONS() {
  return corsPreflight();
}
