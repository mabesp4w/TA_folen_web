import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sistem Informasi Jemaat | GKI Syaloom Pasifik Indah",
  description:
    "Sistem informasi manajemen jemaat dan pelayanan GKI Syaloom Pasifik Indah Pasir II Jayapura.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
