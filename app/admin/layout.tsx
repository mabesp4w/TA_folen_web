import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/layouts/admin-shell";
import { getManagedSession } from "@/lib/auth-server";
import { isManagedRole } from "@/lib/permissions";
import { getRoleMatrix } from "@/lib/permissions-server";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getManagedSession();

  if (!session) redirect("/");

  // ADMIN melihat semua menu (allowedResources = null). Peran unsur hanya
  // melihat modul yang boleh dilihatnya sesuai Hak Akses.
  let allowedResources: string[] | null = null;
  if (isManagedRole(session.role)) {
    const matrix = await getRoleMatrix(session.role);
    allowedResources = Object.entries(matrix)
      .filter(([, perm]) => perm.view)
      .map(([key]) => key);
  }

  return (
    <AdminShell
      role={session.role}
      username={session.username}
      allowedResources={allowedResources}
    >
      {children}
    </AdminShell>
  );
}
