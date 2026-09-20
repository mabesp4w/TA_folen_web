import type { Metadata } from "next";
import { SlideManager, type SlideRow } from "@/components/admin/slide";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Slide Beranda" };

export default async function SlidePage() {
  const slides = await prisma.slide.findMany({ orderBy: { order: "asc" } });

  const rows: SlideRow[] = slides.map((slide) => ({
    id: slide.id,
    order: slide.order,
    url: slide.url,
    judul: slide.judul,
    teks: slide.teks,
    link_url: slide.link_url,
    link_teks: slide.link_teks,
    status: slide.status,
  }));

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <SlideManager rows={rows} />
    </main>
  );
}
