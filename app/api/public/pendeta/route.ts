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

// GET /api/public/pendeta — daftar pendeta. Default hanya yang aktif.
// Query: semua=1 untuk menyertakan yang sudah tidak menjabat.
export async function GET(request: Request) {
  const denied = requireApiKey(request);
  if (denied) return denied;

  try {
    const semua = new URL(request.url).searchParams.get("semua") === "1";
    const rows = await prisma.pendeta.findMany({
      where: semua ? {} : { aktif: true },
      orderBy: [{ aktif: "desc" }, { tgl_mulai: "desc" }],
      include: {
        jemaat: {
          select: {
            nm_lengkap: true,
            keluarga: { select: { rayon: { select: { nm_rayon: true } } } },
          },
        },
      },
    });

    const data = rows.map((p) => ({
      id: p.id,
      nama: p.jemaat.nm_lengkap,
      rayon: p.jemaat.keluarga?.rayon?.nm_rayon ?? null,
      gelar: p.gelar,
      tgl_mulai: formatDate(p.tgl_mulai),
      tgl_selesai: formatDate(p.tgl_selesai),
      aktif: p.aktif,
    }));

    return jsonOk(data);
  } catch (error) {
    console.error("API pendeta error:", error);
    return jsonError("Gagal memuat data pendeta.", 500);
  }
}

export async function OPTIONS() {
  return corsPreflight();
}
