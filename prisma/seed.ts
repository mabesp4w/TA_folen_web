// prisma/seed.ts
//
// Seeder untuk akun admin awal.
// Jalankan dengan: `yarn db:seed` (atau `prisma db seed`).
//
// Password di-hash dengan scrypt (lihat lib/auth.ts) sebelum disimpan, jadi
// isi kolom `password` di database tidak dapat dibaca kembali.

import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../lib/generated/prisma/client";
import { waktuToDate } from "../lib/utils";
import { sanitizeRichText } from "../lib/html";

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

// --- Master data untuk dropdown jadwal (rayon, unsur, contoh jemaat) ---

const RAYON = [
  "Galilea",
  "Yerikho",
  "Bethel",
  "Elim",
  "Kana",
  "Hermon",
  "Bukit Zaitun",
];

const UNSUR = ["PKB", "PW", "PAM", "Remaja", "Tunas Anak"];

// Contoh jemaat agar dropdown "Tuan Rumah" & "Pelayan Firman" tidak kosong.
const JEMAAT_CONTOH: Array<{
  nm_lengkap: string;
  tgl_lahir: string; // yyyy-mm-dd
  jenkel: "L" | "P";
  stat_keluarga: string;
  alamat_blok: string;
  rayon: string;
}> = [
  { nm_lengkap: "Alex Siahaan", tgl_lahir: "1968-04-12", jenkel: "L", stat_keluarga: "KK", alamat_blok: "G. 16", rayon: "Hermon" },
  { nm_lengkap: "Maria Tobing", tgl_lahir: "1975-09-03", jenkel: "P", stat_keluarga: "KK", alamat_blok: "H. 04", rayon: "Galilea" },
  { nm_lengkap: "Yohanes Manalu", tgl_lahir: "1962-01-27", jenkel: "L", stat_keluarga: "KK", alamat_blok: "B. 58", rayon: "Bethel" },
  { nm_lengkap: "Ruth Simanjuntak", tgl_lahir: "1980-11-15", jenkel: "P", stat_keluarga: "KK", alamat_blok: "C. 96", rayon: "Elim" },
  { nm_lengkap: "Petrus Siahaan", tgl_lahir: "1971-06-08", jenkel: "L", stat_keluarga: "KK", alamat_blok: "B. 33", rayon: "Hermon" },
  { nm_lengkap: "Debora Panjaitan", tgl_lahir: "1985-02-20", jenkel: "P", stat_keluarga: "KK", alamat_blok: "K. 12", rayon: "Kana" },
];

async function seedMasterData() {
  // Rayon & Unsur punya kolom unik → aman di-upsert berulang.
  for (const nm_rayon of RAYON) {
    await prisma.rayon.upsert({
      where: { nm_rayon },
      update: {},
      create: { nm_rayon },
    });
  }
  for (const nm_unsur of UNSUR) {
    await prisma.unsur.upsert({
      where: { nm_unsur },
      update: {},
      create: { nm_unsur },
    });
  }
  console.log(`✓ ${RAYON.length} rayon & ${UNSUR.length} unsur tersedia.`);

  // Jemaat tidak punya kunci natural unik → isi contoh hanya bila tabel kosong.
  const jumlahJemaat = await prisma.jemaat.count();
  if (jumlahJemaat === 0) {
    const rayonMap = new Map(
      (await prisma.rayon.findMany()).map((r) => [r.nm_rayon, r.id]),
    );
    for (const j of JEMAAT_CONTOH) {
      await prisma.jemaat.create({
        data: {
          nm_lengkap: j.nm_lengkap,
          tgl_lahir: new Date(`${j.tgl_lahir}T12:00:00`),
          jenkel: j.jenkel,
          stat_keluarga: j.stat_keluarga,
          alamat_blok: j.alamat_blok,
          id_rayon: rayonMap.get(j.rayon) ?? null,
        },
      });
    }
    console.log(`✓ ${JEMAAT_CONTOH.length} contoh jemaat dibuat.`);
  } else {
    console.log(`✓ Tabel jemaat sudah berisi ${jumlahJemaat} data — dilewati.`);
  }
}

// --- Konten publik: renungan, pengumuman, jadwal ibadah ---

// Isi renungan/pengumuman berupa HTML (dari rich editor). Di sini ditulis
// dengan tag yang diizinkan sanitizeRichText lalu tetap disanitasi ulang agar
// konsisten dengan jalur input aplikasi.
const RENUNGAN: Array<{
  judul: string;
  bacaan?: string;
  kutipan?: string;
  isi: string;
  sumber?: string;
  tgl_publish: string; // yyyy-mm-dd
}> = [
  {
    judul: "Kebangkitan Bukan Konspirasi",
    bacaan: "Matius 28:1-15",
    kutipan:
      "Ia tidak ada di sini, sebab Ia telah bangkit, sama seperti yang telah dikatakan-Nya.",
    isi: "<p>Para prajurit disuap untuk menyebarkan cerita bahwa murid-murid mencuri tubuh Yesus. Sejak semula, kebangkitan berusaha ditutupi dengan kabar palsu. Namun kubur yang kosong itu bukan hasil rekayasa manusia, melainkan karya Allah yang menang atas maut.</p><h3>Iman yang berdiri di atas fakta</h3><p>Perempuan-perempuan itu datang membawa duka, tetapi pulang membawa berita sukacita. Perjumpaan dengan Yang Bangkit mengubah ketakutan menjadi keberanian.</p><blockquote>Jika Kristus tidak dibangkitkan, sia-sialah kepercayaan kamu. Tetapi Ia telah bangkit — itulah dasar pengharapan kita.</blockquote>",
    sumber: "HT/www.renunganharian.net",
    tgl_publish: "2026-08-24",
  },
  {
    judul: "Berakar dalam Kasih",
    bacaan: "Efesus 3:14-21",
    kutipan: "Supaya kamu berakar serta berdasar di dalam kasih.",
    isi: "<p>Pohon yang berakar dalam tidak mudah roboh diterpa angin. Demikian pula iman yang berakar dalam kasih Kristus. Paulus berdoa agar jemaat dikuatkan oleh Roh di dalam batin.</p><p>Kasih Allah itu <strong>lebar, panjang, tinggi, dan dalam</strong> — melampaui segala pengetahuan. Semakin kita mengenalnya, semakin kokoh hidup kita.</p>",
    sumber: "Renungan Jemaat GKI Kanaan",
    tgl_publish: "2026-08-17",
  },
  {
    judul: "Damai yang Melampaui Akal",
    bacaan: "Filipi 4:4-7",
    kutipan: "Damai sejahtera Allah akan memelihara hati dan pikiranmu.",
    isi: "<p>Kekuatiran adalah beban yang tidak dirancang untuk kita pikul sendiri. Firman mengajak kita menyerahkannya kepada Tuhan melalui doa dan ucapan syukur.</p><ul><li>Bersukacita senantiasa dalam Tuhan.</li><li>Nyatakan keinginan dalam doa dan permohonan.</li><li>Sertai dengan ucapan syukur.</li></ul><p>Maka damai sejahtera-Nya menjadi penjaga hati kita.</p>",
    sumber: "Renungan Jemaat GKI Kanaan",
    tgl_publish: "2026-08-10",
  },
  {
    judul: "Terang bagi Dunia",
    bacaan: "Matius 5:13-16",
    kutipan: "Hendaklah terangmu bercahaya di depan orang.",
    isi: "<p>Terang tidak menyala untuk dirinya sendiri. Yesus memanggil kita menjadi garam dan terang — kehadiran yang memberi rasa dan menerangi sekitar.</p><p>Perbuatan baik yang lahir dari iman bukan untuk memuliakan diri, melainkan <em>memuliakan Bapa</em> yang di surga.</p>",
    sumber: "HT/www.renunganharian.net",
    tgl_publish: "2026-08-03",
  },
];

const PENGUMUMAN: Array<{
  order: number;
  judul: string;
  isi: string;
  status: boolean;
  tgl_publish: string; // yyyy-mm-dd
}> = [
  {
    order: 1,
    judul: "Sakramen Baptisan Kudus",
    isi: "<p>Sakramen Baptisan Kudus akan dilayankan pada <strong>Minggu, 6 September 2026</strong> dalam Ibadah Pagi. Keluarga yang hendak membaptiskan putra-putrinya dimohon mendaftar ke Majelis paling lambat 30 Agustus 2026.</p><p>Katekisasi persiapan diadakan setiap Sabtu pukul 17.00 di ruang konsistori.</p>",
    status: true,
    tgl_publish: "2026-08-20",
  },
  {
    order: 2,
    judul: "Ibadah Syukur HUT Kemerdekaan RI",
    isi: "<p>Dalam rangka HUT ke-81 Kemerdekaan Republik Indonesia, jemaat mengadakan <strong>Ibadah Syukur Kebangsaan</strong> yang dilanjutkan ramah tamah bersama. Mari hadir mengenakan busana merah putih atau pakaian daerah.</p>",
    status: true,
    tgl_publish: "2026-08-14",
  },
  {
    order: 3,
    judul: "Pelatihan Pelayan Musik & Multimedia",
    isi: "<p>Terbuka bagi pemuda-pemudi yang terbeban melayani di bidang musik dan multimedia. Pendaftaran melalui sekretariat gereja.</p><ul><li>Kelas dasar keyboard & vokal</li><li>Pengoperasian tata suara dan proyeksi</li></ul>",
    status: true,
    tgl_publish: "2026-08-10",
  },
  {
    order: 4,
    judul: "Bakti Sosial & Donor Darah",
    isi: "<p>Kegiatan bakti sosial dan donor darah bekerja sama dengan PMI telah terlaksana dengan baik. Terima kasih atas partisipasi seluruh jemaat.</p>",
    status: false,
    tgl_publish: "2026-07-27",
  },
];

// Jadwal ibadah mendatang. `hostJemaat`/`pelayanJemaat`/`unsur` dirujuk lewat
// nama; id-nya dicari saat seeding. Label ibadah diturunkan otomatis (lihat
// lib/data/jadwal) dari unsur/rayon/waktu bila `nmIbadah` kosong.
const JADWAL: Array<{
  nmIbadah?: string;
  gabungan?: boolean;
  sektor?: number;
  tgl: string; // yyyy-mm-dd
  waktu: string; // "HH.mm" → kolom TIME
  hostJemaat?: string; // tuan rumah (nm_lengkap)
  unsur?: string; // nm_unsur
  pelayanJemaat?: string; // pelayan firman dari jemaat (nm_lengkap)
  pelayanFirman?: string; // teks cadangan (pengkhotbah tamu)
  pembacaanAlkitab?: string;
}> = [
  // Ibadah Minggu (tanpa unsur/tuan rumah → di Gereja Kanaan)
  { tgl: "2026-08-30", waktu: "05.30", pelayanJemaat: "Yohanes Manalu", pembacaanAlkitab: "Mazmur 63:1-9" },
  { tgl: "2026-08-30", waktu: "09.00", pelayanFirman: "Pdt. Samuel Hutagalung", pembacaanAlkitab: "Yohanes 15:1-8" },
  // Ibadah unsur PKB di rumah jemaat
  { unsur: "PKB", tgl: "2026-08-28", waktu: "19.00", hostJemaat: "Petrus Siahaan", pelayanFirman: "Pnt. Alex Siahaan", pembacaanAlkitab: "Amsal 3:5-6" },
  // Ibadah PW gabungan di Gereja Kanaan
  { unsur: "PW", gabungan: true, tgl: "2026-09-03", waktu: "16.00", pelayanFirman: "Pdt. Diana Simatupang", pembacaanAlkitab: "Amsal 31:10-31" },
  // Ibadah Rayon (label diturunkan dari rayon tuan rumah: Hermon)
  { tgl: "2026-09-04", waktu: "19.00", hostJemaat: "Alex Siahaan", pelayanFirman: "Pnt. Debora Panjaitan", pembacaanAlkitab: "Roma 12:9-21" },
  // Ibadah Minggu dengan nama eksplisit
  { nmIbadah: "Ibadah Minggu & Perjamuan Kudus", tgl: "2026-09-06", waktu: "09.00", pelayanFirman: "Pdt. Samuel Hutagalung", pembacaanAlkitab: "1 Korintus 11:23-29" },
  // Ibadah unsur PKB per-sektor (contoh field sektor)
  { unsur: "PKB", sektor: 1, tgl: "2026-09-11", waktu: "19.30", hostJemaat: "Maria Tobing", pelayanFirman: "Pnt. Yohanes Manalu", pembacaanAlkitab: "Filipi 2:1-11" },
];

/** Tanggal kalender pada siang lokal (hindari geser TZ untuk kolom @db.Date). */
function tglSiang(v: string): Date {
  return new Date(`${v}T12:00:00`);
}

async function seedRenungan() {
  // Tanpa kunci natural unik → isi hanya bila tabel kosong (idempoten).
  const jumlah = await prisma.renungan.count();
  if (jumlah > 0) {
    console.log(`✓ Tabel renungan sudah berisi ${jumlah} data — dilewati.`);
    return;
  }
  for (const r of RENUNGAN) {
    await prisma.renungan.create({
      data: {
        judul: r.judul,
        bacaan: r.bacaan ?? null,
        kutipan: r.kutipan ?? null,
        isi: sanitizeRichText(r.isi),
        sumber: r.sumber ?? null,
        tgl_publish: tglSiang(r.tgl_publish),
      },
    });
  }
  console.log(`✓ ${RENUNGAN.length} renungan dibuat.`);
}

async function seedPengumuman() {
  const jumlah = await prisma.pengumuman.count();
  if (jumlah > 0) {
    console.log(`✓ Tabel pengumuman sudah berisi ${jumlah} data — dilewati.`);
    return;
  }
  for (const p of PENGUMUMAN) {
    await prisma.pengumuman.create({
      data: {
        order: p.order,
        judul: p.judul,
        isi: sanitizeRichText(p.isi),
        status: p.status,
        tgl_publish: tglSiang(p.tgl_publish),
      },
    });
  }
  console.log(`✓ ${PENGUMUMAN.length} pengumuman dibuat.`);
}

async function seedJadwalIbadah() {
  const jumlah = await prisma.ibadah.count();
  if (jumlah > 0) {
    console.log(`✓ Tabel ibadah sudah berisi ${jumlah} data — dilewati.`);
    return;
  }
  // Rujukan nama → id (jemaat & unsur sudah tersedia dari seedMasterData).
  const jemaatMap = new Map(
    (await prisma.jemaat.findMany()).map((j) => [j.nm_lengkap, j.id]),
  );
  const unsurMap = new Map(
    (await prisma.unsur.findMany()).map((u) => [u.nm_unsur, u.id]),
  );
  for (const it of JADWAL) {
    const idPelayan = it.pelayanJemaat
      ? jemaatMap.get(it.pelayanJemaat) ?? null
      : null;
    await prisma.ibadah.create({
      data: {
        nm_ibadah: it.nmIbadah ?? null,
        gabungan: it.gabungan ?? false,
        sektor: it.sektor ?? null,
        tgl: tglSiang(it.tgl),
        waktu: waktuToDate(it.waktu)!, // "HH.mm" → kolom TIME (komponen UTC)
        id_jemaat: it.hostJemaat ? jemaatMap.get(it.hostJemaat) ?? null : null,
        id_unsur: it.unsur ? unsurMap.get(it.unsur) ?? null : null,
        id_pelayan_firman: idPelayan,
        // Teks cadangan hanya dipakai bila pelayan tidak diambil dari jemaat.
        pelayan_firman: idPelayan ? null : it.pelayanFirman ?? null,
        pembacaan_alkitab: it.pembacaanAlkitab ?? null,
      },
    });
  }
  console.log(`✓ ${JADWAL.length} jadwal ibadah dibuat.`);
}


async function main() {
  await seedMasterData();
  await seedRenungan();
  await seedPengumuman();
  await seedJadwalIbadah();
}

main()
  .catch((err) => {
    console.error("Seed gagal:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
