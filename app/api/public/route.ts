import { corsPreflight, jsonOk } from "@/lib/api-public";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Indeks API publik — daftar endpoint yang tersedia untuk App Android.
// Tidak memerlukan API key agar mudah ditemukan; semua endpoint data memerlukannya.
export async function GET() {
  return jsonOk({
    name: "API Publik GKI Syaloom Pasifik Indah",
    version: "1.0",
    auth: {
      type: "api-key",
      header: "x-api-key",
      note: "Sertakan header x-api-key pada setiap permintaan ke endpoint data.",
    },
    endpoints: {
      renungan: "/api/public/renungan?page=1&limit=20&tgl=YYYY-MM-DD",
      renungan_terbaru: "/api/public/renungan/terbaru",
      renungan_detail: "/api/public/renungan/{id}",
      pengumuman: "/api/public/pengumuman?page=1&limit=20",
      jadwal: "/api/public/jadwal?dari=YYYY-MM-DD&sampai=YYYY-MM-DD&page=1&limit=20",
      galeri: "/api/public/galeri?page=1&limit=20",
      galeri_detail: "/api/public/galeri/{id}",
      rayon: "/api/public/rayon",
      unsur: "/api/public/unsur",
      jemaat: "/api/public/jemaat?page=1&limit=20&rayon={id}&status=AKTIF&q={nama}",
      jemaat_detail: "/api/public/jemaat/{id}",
      keuangan: "/api/public/keuangan?page=1&limit=20&kategori={kategori}",
      kehadiran: "/api/public/kehadiran?page=1&limit=20",
      pendeta: "/api/public/pendeta?semua=1",
      majelis: "/api/public/majelis?semua=1&jabatan={PENATUA|SYAMAS}",
      badan_pengurus: "/api/public/badan-pengurus?semua=1&unsur={id}",
    },
  });
}

export async function OPTIONS() {
  return corsPreflight();
}
