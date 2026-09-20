import {
  corsPreflight,
  jsonError,
  jsonOk,
  requireApiKey,
} from "@/lib/api-public";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/public/unsur — daftar unsur kategorial (PKB, PW, PAM, dll).
export async function GET(request: Request) {
  const denied = requireApiKey(request);
  if (denied) return denied;

  try {
    const rows = await prisma.unsur.findMany({ orderBy: { nm_unsur: "asc" } });
    const data = rows.map((u) => ({ id: u.id, nm_unsur: u.nm_unsur }));
    return jsonOk(data);
  } catch (error) {
    console.error("API unsur error:", error);
    return jsonError("Gagal memuat data unsur.", 500);
  }
}

export async function OPTIONS() {
  return corsPreflight();
}
