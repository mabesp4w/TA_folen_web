import type { Metadata } from "next";
import {
  UserManager,
  type PengurusOption,
  type UserRow,
} from "@/components/admin/pengaturan";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { USER_ROLES } from "@/components/admin/pengaturan/schema";

export const metadata: Metadata = { title: "Akun Akses" };

const dateFmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });

function pengurusLabel(p: {
  jemaat: { nm_lengkap: string };
  unsur: { nm_unsur: string };
  jabatan: string;
  sektor: number | null;
}) {
  // Sertakan sektor bila ada (mis. "Budi — Ketua PW Sektor 2").
  const sektor = p.sektor ? ` Sektor ${p.sektor}` : "";
  return `${p.jemaat.nm_lengkap} — ${p.jabatan} ${p.unsur.nm_unsur}${sektor}`;
}

export default async function PengaturanPage() {
  // Akun Akses eksklusif ADMIN — peran unsur dialihkan kembali ke dashboard.
  const session = await getAdminSession();
  if (!session) redirect("/admin");

  // PENTING: kolom password tidak pernah di-select agar hash tak keluar ke klien.
  const [users, availablePengurus] = await Promise.all([
    prisma.user.findMany({
      // Akun Administrator disembunyikan dari daftar — dikelola lewat seed/skrip,
      // bukan melalui UI ini.
      where: { role: { not: "ADMIN" } },
      select: {
        id: true,
        username: true,
        role: true,
        created_at: true,
        badan_pengurus: {
          select: {
            id: true,
            jabatan: true,
            sektor: true,
            jemaat: { select: { nm_lengkap: true } },
            unsur: { select: { nm_unsur: true } },
          },
        },
      },
      orderBy: { created_at: "asc" },
    }),
    prisma.badanPengurus.findMany({
      where: { user_id: null },
      select: {
        id: true,
        jabatan: true,
        sektor: true,
        jemaat: { select: { nm_lengkap: true } },
        unsur: { select: { nm_unsur: true } },
      },
      orderBy: [{ unsur: { nm_unsur: "asc" } }, { jabatan: "asc" }],
    }),
  ]);

  const rows: UserRow[] = users.map((user) => ({
    id: user.id,
    username: user.username,
    role: (USER_ROLES as readonly string[]).includes(user.role)
      ? (user.role as UserRow["role"])
      : "KETUA_UNSUR",
    createdAt: dateFmt.format(user.created_at),
    pengurus: user.badan_pengurus ? pengurusLabel(user.badan_pengurus) : null,
    pengurusId: user.badan_pengurus?.id ?? null,
  }));

  // Gabungkan pengurus yang belum berakun dengan pengurus yang sudah tertaut ke
  // akun mana pun, agar opsi tetap muncul saat mengedit akun bersangkutan.
  const linked = users
    .map((user) => user.badan_pengurus)
    .filter((p): p is NonNullable<typeof p> => p != null);
  const pengurusOptions: PengurusOption[] = [...availablePengurus, ...linked].map((p) => ({
    id: p.id,
    label: pengurusLabel(p),
    jabatan: p.jabatan,
  }));

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <UserManager
        currentUserId={session?.id ?? ""}
        pengurusOptions={pengurusOptions}
        rows={rows}
      />
    </main>
  );
}
