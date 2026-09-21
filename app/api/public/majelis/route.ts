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

// GET /api/public/majelis — daftar majelis (Penatua & Syamas). Default hanya yang aktif.
// Query: semua=1 (sertakan non-aktif), jabatan={PENATUA|SYAMAS}.
export async function GET(request: Request) {
  const denied = requireApiKey(request);
  if (denied) return denied;

  try {
    const params = new URL(request.url).searchParams;
    const semua = params.get("semua") === "1";
    const jabatan = params.get("jabatan");

    const rows = await prisma.majelis.findMany({
      where: {
        ...(semua ? {} : { aktif: true }),
        ...(jabatan ? { jabatan } : {}),
      },
      orderBy: [{ aktif: "desc" }, { jabatan: "asc" }, { tgl_mulai: "desc" }],
      include: {
        jemaat: {
          select: {
            nm_lengkap: true,
            keluarga: { select: { rayon: { select: { nm_rayon: true } } } },
          },
        },
      },
    });

    const data = rows.map((m) => ({
      id: m.id,
      nama: m.jemaat.nm_lengkap,
      rayon: m.jemaat.keluarga?.rayon?.nm_rayon ?? null,
      jabatan: m.jabatan,
      tgl_mulai: formatDate(m.tgl_mulai),
      tgl_selesai: formatDate(m.tgl_selesai),
      aktif: m.aktif,
    }));

    return jsonOk(data);
  } catch (error) {
    console.error("API majelis error:", error);
    return jsonError("Gagal memuat data majelis.", 500);
  }
}

export async function OPTIONS() {
  return corsPreflight();
}
