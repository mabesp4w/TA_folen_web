import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

// Helper bersama untuk API publik (dikonsumsi App Android).
// - Autentikasi memakai header `x-api-key` yang dicocokkan dengan env `PUBLIC_API_KEY`.
// - Respons memakai amplop konsisten { success, data, meta? } / { success, error }.
// - Header CORS permisif disertakan agar bisa juga dipakai klien web bila perlu.

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key",
  "Access-Control-Max-Age": "86400",
};

export type PageMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function jsonOk<T>(data: T, meta?: PageMeta, status = 200): NextResponse {
  return NextResponse.json(
    meta ? { success: true, data, meta } : { success: true, data },
    { status, headers: CORS_HEADERS },
  );
}

export function jsonError(error: string, status = 400): NextResponse {
  return NextResponse.json({ success: false, error }, { status, headers: CORS_HEADERS });
}

// Respons untuk preflight OPTIONS.
export function corsPreflight(): NextResponse {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// Memeriksa API key. Mengembalikan NextResponse error bila gagal, atau null bila lolos.
export function requireApiKey(request: Request): NextResponse | null {
  const expected = process.env.PUBLIC_API_KEY;
  if (!expected) {
    // Jangan pernah membuka akses secara diam-diam bila kunci belum diset.
    return jsonError("API publik belum dikonfigurasi di server.", 503);
  }
  const provided = request.headers.get("x-api-key") ?? "";
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return jsonError("Kunci API tidak valid atau tidak disertakan.", 401);
  }
  return null;
}

// Membaca parameter paginasi dari query string dengan batas aman.
export function parsePagination(
  request: Request,
  { defaultLimit = 20, maxLimit = 100 }: { defaultLimit?: number; maxLimit?: number } = {},
): { page: number; limit: number; skip: number } {
  const params = new URL(request.url).searchParams;
  const rawPage = Number.parseInt(params.get("page") ?? "1", 10);
  const rawLimit = Number.parseInt(params.get("limit") ?? String(defaultLimit), 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, maxLimit) : defaultLimit;
  return { page, limit, skip: (page - 1) * limit };
}

export function buildMeta(page: number, limit: number, total: number): PageMeta {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

// Mengubah path berkas relatif (mis. "/uploads/galeri/x.webp") menjadi URL absolut
// agar dapat langsung dimuat oleh App Android.
export function toAbsoluteUrl(request: Request, path: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin).replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

// Format tanggal (kolom @db.Date) menjadi "YYYY-MM-DD".
export function formatDate(value: Date | null | undefined): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}

// Format jam (kolom @db.Time) menjadi "HH:mm".
export function formatTime(value: Date | null | undefined): string | null {
  return value ? value.toISOString().slice(11, 16) : null;
}

// Membaca tanggal batas (YYYY-MM-DD) dari query menjadi Date UTC, atau null bila kosong/invalid.
export function parseDateParam(request: Request, key: string): Date | null {
  const raw = new URL(request.url).searchParams.get(key);
  if (!raw) return null;
  const match = /^\d{4}-\d{2}-\d{2}$/.test(raw);
  if (!match) return null;
  const date = new Date(`${raw}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

// Tanggal hari ini pada tengah malam UTC (untuk default jadwal mendatang).
export function todayUtc(): Date {
  return new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);
}
