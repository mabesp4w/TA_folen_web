import type { Session } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type AuditInput = {
  aksi: "CREATE" | "UPDATE" | "DELETE";
  detail?: unknown;
  entitas: string;
  id_entitas?: string | null;
  ringkasan?: string | null;
  session: Session;
};

export async function recordAdminAudit({
  aksi,
  detail,
  entitas,
  id_entitas,
  ringkasan,
  session,
}: AuditInput) {
  await prisma.logAktivitas.create({
    data: {
      aksi,
      detail: detail === undefined ? null : JSON.stringify(detail),
      entitas,
      id_entitas: id_entitas ?? null,
      id_user: session.id,
      ringkasan: ringkasan ?? null,
      role: session.role,
      username: session.username,
    },
  });
}
