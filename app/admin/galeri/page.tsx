import type { Metadata } from "next";
import { GaleriManager, type GaleriAlbumRow } from "@/components/admin/galeri";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Galeri" };

export default async function GaleriPage() {
  const albums = await prisma.galeriAlbum.findMany({
    include: { foto: { orderBy: [{ order: "asc" }, { created_at: "asc" }] } },
    orderBy: [{ order: "asc" }, { created_at: "desc" }],
  });

  const rows: GaleriAlbumRow[] = albums.map((album) => ({
    id: album.id,
    judul: album.judul,
    keterangan: album.keterangan,
    kategori: album.kategori,
    tgl: album.tgl?.toISOString().slice(0, 10) ?? null,
    status: album.status,
    order: album.order,
    foto: album.foto.map((foto) => ({
      id: foto.id,
      url: foto.url,
      caption: foto.caption,
      order: foto.order,
    })),
  }));

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <GaleriManager rows={rows} />
    </main>
  );
}
