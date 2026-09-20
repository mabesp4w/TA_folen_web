import {
  corsPreflight,
  jsonError,
  jsonOk,
  requireApiKey,
  toAbsoluteUrl,
} from "@/lib/api-public";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/public/slide — slide/banner beranda yang tampil, terurut.
export async function GET(request: Request) {
  const denied = requireApiKey(request);
  if (denied) return denied;

  try {
    const rows = await prisma.slide.findMany({
      where: { status: true },
      orderBy: { order: "asc" },
    });

    const data = rows.map((s) => ({
      id: s.id,
      order: s.order,
      url: toAbsoluteUrl(request, s.url),
      judul: s.judul,
      teks: s.teks,
      link_url: s.link_url,
      link_teks: s.link_teks,
    }));

    return jsonOk(data);
  } catch (error) {
    console.error("API slide error:", error);
    return jsonError("Gagal memuat data slide.", 500);
  }
}

export async function OPTIONS() {
  return corsPreflight();
}
