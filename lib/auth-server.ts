import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken, type Session } from "@/lib/auth";

// Semua role yang boleh masuk ke area /admin. ADMIN penuh; KETUA_UNSUR &
// KOORDINATOR_UNSUR masuk dengan akses yang dibatasi Hak Akses (lihat
// lib/permissions-server.ts).
const ADMIN_AREA_ROLES = ["ADMIN", "KETUA_UNSUR", "KOORDINATOR_UNSUR"];

// Sesi khusus ADMIN — dipakai halaman/aksi yang eksklusif administrator
// (Akun Akses, Hak Akses, Log Aktivitas).
export async function getAdminSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);

  return session?.role === "ADMIN" ? session : null;
}

// Sesi untuk siapa pun yang boleh masuk area /admin (ADMIN + peran unsur).
// Penegakan izin per-modul dilakukan terpisah lewat helper permissions-server.
export async function getManagedSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);

  return session && ADMIN_AREA_ROLES.includes(session.role) ? session : null;
}
