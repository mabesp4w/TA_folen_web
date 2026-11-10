import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/toaster";
import "goey-toast/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sistem Informasi Jemaat | GKI Syaloom Pasifik Indah",
  description:
    "Sistem informasi manajemen jemaat dan pelayanan GKI Syaloom Pasifik Indah Pasir II Jayapura.",
  icons: {
    icon: [
      { url: "/logo-gki.svg", type: "image/svg+xml" },
      { url: "/logo-gki.png", type: "image/png", sizes: "400x400" },
    ],
    shortcut: "/logo-gki.png",
    apple: [{ url: "/logo-gki.png", type: "image/png", sizes: "400x400" }],
  },
};

export const viewport: Viewport = {
  colorScheme: "only light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
