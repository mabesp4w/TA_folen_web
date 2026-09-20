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

// GET /api/public/badan-pengurus — kepengurusan tiap unsur kategorial. Default hanya aktif.
// Query: semua=1 (sertakan non-aktif), unsur={id_unsur}.
export async function GET(request: Request) {
  const denied = requireApiKey(request);
  if (denied) return denied;

  try {
    const params = new URL(request.url).searchParams;
    const semua = params.get("semua") === "1";
    const unsur = params.get("unsur");

    const rows = await prisma.badanPengurus.findMany({
      where: {
        ...(semua ? {} : { aktif: true }),
        ...(unsur ? { id_unsur: unsur } : {}),
      },
      orderBy: [{ aktif: "desc" }, { tgl_mulai: "desc" }],
      include: {
        jemaat: { select: { nm_lengkap: true, rayon: { select: { nm_rayon: true } } } },
        unsur: { select: { nm_unsur: true } },
      },
    });

    const data = rows.map((b) => ({
      id: b.id,
      nama: b.jemaat.nm_lengkap,
      rayon: b.jemaat.rayon?.nm_rayon ?? null,
      unsur: b.unsur.nm_unsur,
      sektor: b.sektor,
      jabatan: b.jabatan,
      tgl_mulai: formatDate(b.tgl_mulai),
      tgl_selesai: formatDate(b.tgl_selesai),
      aktif: b.aktif,
    }));

    return jsonOk(data);
  } catch (error) {
    console.error("API badan pengurus error:", error);
    return jsonError("Gagal memuat data badan pengurus.", 500);
  }
}

export async function OPTIONS() {
  return corsPreflight();
}
