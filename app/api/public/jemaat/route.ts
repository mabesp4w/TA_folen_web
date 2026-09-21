import {
  buildMeta,
  corsPreflight,
  formatDate,
  jsonError,
  jsonOk,
  parsePagination,
  requireApiKey,
} from "@/lib/api-public";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/public/jemaat — direktori jemaat (detail lengkap).
// Query: page, limit, rayon={id_rayon}, status={AKTIF|PINDAH|MENINGGAL|...}, q={cari nama}.
export async function GET(request: Request) {
  const denied = requireApiKey(request);
  if (denied) return denied;

  try {
    const { page, limit, skip } = parsePagination(request);
    const params = new URL(request.url).searchParams;
    const rayon = params.get("rayon");
    const status = params.get("status");
    const q = params.get("q")?.trim();

    const where = {
      ...(rayon ? { keluarga: { id_rayon: rayon } } : {}),
      ...(status ? { status } : {}),
      ...(q ? { nm_lengkap: { contains: q } } : {}),
    };

    const [total, rows] = await Promise.all([
      prisma.jemaat.count({ where }),
      prisma.jemaat.findMany({
        where,
        orderBy: { nm_lengkap: "asc" },
        skip,
        take: limit,
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
      }),
    ]);

    const data = rows.map((j) => ({
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
    }));

    return jsonOk(data, buildMeta(page, limit, total));
  } catch (error) {
    console.error("API jemaat error:", error);
    return jsonError("Gagal memuat data jemaat.", 500);
  }
}

export async function OPTIONS() {
  return corsPreflight();
}
