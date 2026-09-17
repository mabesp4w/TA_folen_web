import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/layouts/admin-shell";
import { getAdminSession } from "@/lib/auth-server";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getAdminSession();

  if (!session) redirect("/");

  return <AdminShell>{children}</AdminShell>;
}
