import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OtorisasiManager } from "@/components/admin/otorisasi";
import { getAdminSession } from "@/lib/auth-server";
import { getAllMatrices } from "@/lib/permissions-server";

export const metadata: Metadata = { title: "Hak Akses" };

export default async function OtorisasiPage() {
  // Hanya ADMIN yang boleh mengelola hak akses.
  const session = await getAdminSession();
  if (!session) redirect("/admin");

  const initialMatrices = await getAllMatrices();

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <OtorisasiManager initialMatrices={initialMatrices} />
    </main>
  );
}
