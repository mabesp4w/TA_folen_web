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

// Contoh keluarga + anggota. Alamat & rayon melekat pada keluarga; anggota
// satu keluarga otomatis berbagi keduanya. Sebagian keluarga sengaja memiliki
// lebih dari satu anggota untuk mendemonstrasikan tautan ke satu Kartu Keluarga.
const KELUARGA_CONTOH: Array<{
  no_kk?: string;
  alamat_blok: string;
  rayon: string;
  anggota: Array<{
    nm_lengkap: string;
    tgl_lahir: string; // yyyy-mm-dd
    jenkel: "L" | "P";
    stat_keluarga: string; // "KK" | "Isteri" | "Anak" | "Lain_Lain"
  }>;
}> = [
  {
    no_kk: "9271010001",
    alamat_blok: "G. 16",
    rayon: "Hermon",
    anggota: [
      { nm_lengkap: "Alex Siahaan", tgl_lahir: "1968-04-12", jenkel: "L", stat_keluarga: "KK" },
      { nm_lengkap: "Yohana Siahaan", tgl_lahir: "1972-07-30", jenkel: "P", stat_keluarga: "Isteri" },
      { nm_lengkap: "Kevin Siahaan", tgl_lahir: "2001-03-18", jenkel: "L", stat_keluarga: "Anak" },
    ],
  },
  {
    no_kk: "9271010002",
    alamat_blok: "H. 04",
    rayon: "Galilea",
    anggota: [
      { nm_lengkap: "Maria Tobing", tgl_lahir: "1975-09-03", jenkel: "P", stat_keluarga: "KK" },
    ],
  },
  {
    no_kk: "9271010003",
    alamat_blok: "B. 58",
    rayon: "Bethel",
    anggota: [
      { nm_lengkap: "Yohanes Manalu", tgl_lahir: "1962-01-27", jenkel: "L", stat_keluarga: "KK" },
      { nm_lengkap: "Sarah Manalu", tgl_lahir: "1965-05-22", jenkel: "P", stat_keluarga: "Isteri" },
    ],
  },
  {
    no_kk: "9271010004",
    alamat_blok: "C. 96",
    rayon: "Elim",
    anggota: [
      { nm_lengkap: "Ruth Simanjuntak", tgl_lahir: "1980-11-15", jenkel: "P", stat_keluarga: "KK" },
    ],
  },
  {
    no_kk: "9271010005",
    alamat_blok: "B. 33",
    rayon: "Hermon",
    anggota: [
      { nm_lengkap: "Petrus Siahaan", tgl_lahir: "1971-06-08", jenkel: "L", stat_keluarga: "KK" },
    ],
  },
  {
    no_kk: "9271010006",
    alamat_blok: "K. 12",
    rayon: "Kana",
    anggota: [
      { nm_lengkap: "Debora Panjaitan", tgl_lahir: "1985-02-20", jenkel: "P", stat_keluarga: "KK" },
    ],
  },
];

// Keluarga pendeta — sumber data pribadi untuk model Pendeta. Dipisah dari
// KELUARGA_CONTOH agar bisa dipastikan ada saat seedPelayanan, tanpa bergantung
// pada kondisi "tabel jemaat kosong" (lihat ensurePendetaJemaat).
const KELUARGA_PENDETA: {
  no_kk: string;
  alamat_blok: string;
  rayon: string;
  anggota: Array<{
    nm_lengkap: string;
    tgl_lahir: string;
    jenkel: "L" | "P";
    stat_keluarga: string;
  }>;
} = {
  no_kk: "9271010007",
  alamat_blok: "A. 01",
  rayon: "Bukit Zaitun",
  anggota: [
    { nm_lengkap: "Samuel Hutagalung", tgl_lahir: "1970-10-05", jenkel: "L", stat_keluarga: "KK" },
    { nm_lengkap: "Grace Hutagalung", tgl_lahir: "1974-12-19", jenkel: "P", stat_keluarga: "Isteri" },
  ],
};

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

  // Keluarga & jemaat tidak punya kunci natural unik → isi contoh hanya bila
  // tabel jemaat kosong. Keluarga dibuat lebih dulu, lalu anggotanya ditautkan.
  const jumlahJemaat = await prisma.jemaat.count();
  if (jumlahJemaat === 0) {
    const rayonMap = new Map(
      (await prisma.rayon.findMany()).map((r) => [r.nm_rayon, r.id]),
    );
    let totalAnggota = 0;
    for (const k of KELUARGA_CONTOH) {
      const keluarga = await prisma.keluarga.create({
        data: {
          no_kk: k.no_kk ?? null,
          alamat_blok: k.alamat_blok,
          id_rayon: rayonMap.get(k.rayon) ?? null,
        },
      });
      for (const a of k.anggota) {
        await prisma.jemaat.create({
          data: {
            nm_lengkap: a.nm_lengkap,
            tgl_lahir: new Date(`${a.tgl_lahir}T12:00:00`),
            jenkel: a.jenkel,
            stat_keluarga: a.stat_keluarga,
            id_keluarga: keluarga.id,
          },
        });
        totalAnggota += 1;
      }
    }
    console.log(
      `✓ ${KELUARGA_CONTOH.length} keluarga & ${totalAnggota} jemaat contoh dibuat.`,
    );
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

// --- Statistik kehadiran per ibadah ---

// Perkiraan kehadiran per baris JADWAL (indeks selaras dengan array JADWAL).
// Ibadah Minggu ramai; ibadah unsur/rayon lebih kecil.
const KEHADIRAN: Array<{ laki_laki: number; perempuan: number; anak: number }> = [
  { laki_laki: 42, perempuan: 58, anak: 15 }, // Minggu 05.30
  { laki_laki: 96, perempuan: 121, anak: 34 }, // Minggu 09.00
  { laki_laki: 28, perempuan: 4, anak: 0 }, // PKB (bapak)
  { laki_laki: 6, perempuan: 74, anak: 8 }, // PW gabungan
  { laki_laki: 19, perempuan: 27, anak: 6 }, // Rayon Hermon
  { laki_laki: 88, perempuan: 110, anak: 29 }, // Minggu & Perjamuan Kudus
  { laki_laki: 22, perempuan: 3, anak: 0 }, // PKB sektor 1
];

async function seedKehadiran() {
  const jumlah = await prisma.kehadiran.count();
  if (jumlah > 0) {
    console.log(`✓ Tabel kehadiran sudah berisi ${jumlah} data — dilewati.`);
    return;
  }
  // Ambil ibadah terurut sama seperti saat dibuat (created_at asc) agar cocok
  // dengan urutan array KEHADIRAN.
  const ibadah = await prisma.ibadah.findMany({ orderBy: { created_at: "asc" } });
  if (ibadah.length === 0) {
    console.log("✓ Belum ada ibadah — kehadiran dilewati.");
    return;
  }
  let dibuat = 0;
  for (let i = 0; i < ibadah.length; i++) {
    const k = KEHADIRAN[i] ?? { laki_laki: 20, perempuan: 25, anak: 5 };
    await prisma.kehadiran.create({
      data: {
        id_ibadah: ibadah[i].id,
        laki_laki: k.laki_laki,
        perempuan: k.perempuan,
        anak: k.anak,
        total: k.laki_laki + k.perempuan + k.anak,
      },
    });
    dibuat += 1;
  }
  console.log(`✓ ${dibuat} data kehadiran dibuat.`);
}

// --- Penerimaan keuangan / persembahan ---

// Persembahan yang tertaut ke ibadah (dikaitkan lewat indeks baris JADWAL).
const KEUANGAN_IBADAH: Array<{
  ibadahIndex: number;
  kategori: string;
  nm_pemberi?: string;
  jumlah: number;
  keterangan?: string;
}> = [
  { ibadahIndex: 0, kategori: "TANGGUK", jumlah: 1_250_000 },
  { ibadahIndex: 1, kategori: "TANGGUK", jumlah: 4_870_000 },
  {
    ibadahIndex: 1,
    kategori: "PENGUCAPAN_SYUKUR",
    nm_pemberi: "Kel. Alex Siahaan",
    jumlah: 2_000_000,
    keterangan: "Atas ulang tahun pernikahan yang ke-30.",
  },
  {
    ibadahIndex: 1,
    kategori: "DIAKONIA",
    nm_pemberi: "Yang tidak menyebut nama",
    jumlah: 500_000,
  },
  { ibadahIndex: 3, kategori: "TANGGUK", jumlah: 1_640_000 },
  {
    ibadahIndex: 5,
    kategori: "PERSEPULUHAN",
    nm_pemberi: "Kel. Yohanes Manalu",
    jumlah: 3_500_000,
  },
  {
    ibadahIndex: 5,
    kategori: "PEMBANGUNAN_RENOVASI",
    nm_pemberi: "Kel. Maria Tobing",
    jumlah: 1_000_000,
    keterangan: "Dukungan renovasi atap gedung gereja.",
  },
];

// Persembahan tanpa ibadah tertentu (mis. transfer / titipan sekretariat).
const KEUANGAN_LEPAS: Array<{
  kategori: string;
  nm_pemberi?: string;
  jumlah: number;
  keterangan?: string;
}> = [
  {
    kategori: "PERSEPULUHAN",
    nm_pemberi: "Kel. Petrus Siahaan",
    jumlah: 2_750_000,
  },
  {
    kategori: "PENUNJANG_PELAYANAN",
    nm_pemberi: "Kel. Ruth Simanjuntak",
    jumlah: 850_000,
    keterangan: "Untuk operasional pelayanan unsur PW.",
  },
  {
    kategori: "INKONVENSIONAL",
    nm_pemberi: "Yang tidak menyebut nama",
    jumlah: 300_000,
    keterangan: "Titipan melalui sekretariat gereja.",
  },
];

async function seedKeuangan() {
  const jumlah = await prisma.keuangan.count();
  if (jumlah > 0) {
    console.log(`✓ Tabel keuangan sudah berisi ${jumlah} data — dilewati.`);
    return;
  }
  const ibadah = await prisma.ibadah.findMany({ orderBy: { created_at: "asc" } });
  let dibuat = 0;
  for (const k of KEUANGAN_IBADAH) {
    const target = ibadah[k.ibadahIndex];
    if (!target) continue; // ibadah rujukan tidak ada → lewati
    await prisma.keuangan.create({
      data: {
        id_ibadah: target.id,
        kategori: k.kategori,
        nm_pemberi: k.nm_pemberi ?? null,
        jumlah: k.jumlah,
        keterangan: k.keterangan ?? null,
      },
    });
    dibuat += 1;
  }
  for (const k of KEUANGAN_LEPAS) {
    await prisma.keuangan.create({
      data: {
        id_ibadah: null,
        kategori: k.kategori,
        nm_pemberi: k.nm_pemberi ?? null,
        jumlah: k.jumlah,
        keterangan: k.keterangan ?? null,
      },
    });
    dibuat += 1;
  }
  console.log(`✓ ${dibuat} data keuangan dibuat.`);
}

// --- Pelayanan: Pendeta, Majelis, Badan Pengurus ---

const PENDETA: Array<{
  jemaat: string; // nm_lengkap
  gelar?: string;
  tgl_mulai: string;
  tgl_selesai?: string;
  aktif?: boolean;
}> = [
  { jemaat: "Samuel Hutagalung", gelar: "Pdt.", tgl_mulai: "2019-01-13", aktif: true },
  { jemaat: "Grace Hutagalung", gelar: "Vikaris", tgl_mulai: "2023-07-01", aktif: true },
];

const MAJELIS: Array<{
  jemaat: string;
  jabatan: "PENATUA" | "SYAMAS";
  tgl_mulai: string;
  tgl_selesai?: string;
  aktif?: boolean;
}> = [
  { jemaat: "Alex Siahaan", jabatan: "PENATUA", tgl_mulai: "2022-08-01", aktif: true },
  { jemaat: "Yohanes Manalu", jabatan: "PENATUA", tgl_mulai: "2022-08-01", aktif: true },
  { jemaat: "Ruth Simanjuntak", jabatan: "SYAMAS", tgl_mulai: "2022-08-01", aktif: true },
  { jemaat: "Petrus Siahaan", jabatan: "SYAMAS", tgl_mulai: "2019-08-01", tgl_selesai: "2022-07-31", aktif: false },
];

const BADAN_PENGURUS: Array<{
  jemaat: string;
  unsur: string; // nm_unsur
  jabatan: string;
  sektor?: number;
  username?: string; // akun akses (opsional, one-to-one)
  tgl_mulai: string;
  tgl_selesai?: string;
  aktif?: boolean;
}> = [
  { jemaat: "Petrus Siahaan", unsur: "PKB", jabatan: "Ketua", username: "ketua_pkb", tgl_mulai: "2023-01-01", aktif: true },
  { jemaat: "Yohanes Manalu", unsur: "PKB", jabatan: "Sekretaris", tgl_mulai: "2023-01-01", aktif: true },
  { jemaat: "Maria Tobing", unsur: "PW", jabatan: "Ketua", username: "ketua_pw", tgl_mulai: "2023-01-01", aktif: true },
  { jemaat: "Debora Panjaitan", unsur: "PW", jabatan: "Bendahara", tgl_mulai: "2023-01-01", aktif: true },
  { jemaat: "Kevin Siahaan", unsur: "Remaja", jabatan: "Ketua", tgl_mulai: "2024-02-01", aktif: true },
];

// Pastikan keluarga & anggota pendeta ada (idempoten). Diperlukan karena
// KELUARGA_CONTOH hanya dibuat saat tabel jemaat kosong, sehingga pada database
// yang sudah terisi keluarga pendeta bisa belum tercipta.
async function ensurePendetaJemaat() {
  const anggotaAda = await prisma.jemaat.findFirst({
    where: { nm_lengkap: KELUARGA_PENDETA.anggota[0].nm_lengkap },
    select: { id: true },
  });
  if (anggotaAda) return;

  const rayon = await prisma.rayon.findUnique({
    where: { nm_rayon: KELUARGA_PENDETA.rayon },
  });
  const keluarga = await prisma.keluarga.create({
    data: {
      no_kk: KELUARGA_PENDETA.no_kk,
      alamat_blok: KELUARGA_PENDETA.alamat_blok,
      id_rayon: rayon?.id ?? null,
    },
  });
  for (const a of KELUARGA_PENDETA.anggota) {
    await prisma.jemaat.create({
      data: {
        nm_lengkap: a.nm_lengkap,
        tgl_lahir: tglSiang(a.tgl_lahir),
        jenkel: a.jenkel,
        stat_keluarga: a.stat_keluarga,
        id_keluarga: keluarga.id,
      },
    });
  }
  console.log(`✓ Keluarga pendeta (${KELUARGA_PENDETA.anggota.length} anggota) dipastikan ada.`);
}

async function seedPelayanan() {
  await ensurePendetaJemaat();

  const jemaatMap = new Map(
    (await prisma.jemaat.findMany()).map((j) => [j.nm_lengkap, j.id]),
  );
  const unsurMap = new Map(
    (await prisma.unsur.findMany()).map((u) => [u.nm_unsur, u.id]),
  );
  const userMap = new Map(
    (await prisma.user.findMany()).map((u) => [u.username, u.id]),
  );

  // Pendeta
  if ((await prisma.pendeta.count()) === 0) {
    let dibuat = 0;
    for (const p of PENDETA) {
      const id_jemaat = jemaatMap.get(p.jemaat);
      if (!id_jemaat) {
        console.warn(`  ! Jemaat "${p.jemaat}" tidak ditemukan — pendeta dilewati.`);
        continue;
      }
      await prisma.pendeta.create({
        data: {
          id_jemaat,
          gelar: p.gelar ?? null,
          tgl_mulai: tglSiang(p.tgl_mulai),
          tgl_selesai: p.tgl_selesai ? tglSiang(p.tgl_selesai) : null,
          aktif: p.aktif ?? true,
        },
      });
      dibuat += 1;
    }
    console.log(`✓ ${dibuat} pendeta dibuat.`);
  } else {
    console.log("✓ Tabel pendeta sudah berisi data — dilewati.");
  }

  // Majelis
  if ((await prisma.majelis.count()) === 0) {
    let dibuat = 0;
    for (const m of MAJELIS) {
      const id_jemaat = jemaatMap.get(m.jemaat);
      if (!id_jemaat) {
        console.warn(`  ! Jemaat "${m.jemaat}" tidak ditemukan — majelis dilewati.`);
        continue;
      }
      await prisma.majelis.create({
        data: {
          id_jemaat,
          jabatan: m.jabatan,
          tgl_mulai: tglSiang(m.tgl_mulai),
          tgl_selesai: m.tgl_selesai ? tglSiang(m.tgl_selesai) : null,
          aktif: m.aktif ?? true,
        },
      });
      dibuat += 1;
    }
    console.log(`✓ ${dibuat} majelis dibuat.`);
  } else {
    console.log("✓ Tabel majelis sudah berisi data — dilewati.");
  }

  // Badan Pengurus
  if ((await prisma.badanPengurus.count()) === 0) {
    let dibuat = 0;
    for (const b of BADAN_PENGURUS) {
      const id_jemaat = jemaatMap.get(b.jemaat);
      const id_unsur = unsurMap.get(b.unsur);
      if (!id_jemaat || !id_unsur) {
        console.warn(
          `  ! Jemaat/unsur untuk "${b.jemaat} @ ${b.unsur}" tidak ditemukan — pengurus dilewati.`,
        );
        continue;
      }
      await prisma.badanPengurus.create({
        data: {
          id_jemaat,
          id_unsur,
          jabatan: b.jabatan,
          sektor: b.sektor ?? null,
          user_id: b.username ? userMap.get(b.username) ?? null : null,
          tgl_mulai: tglSiang(b.tgl_mulai),
          tgl_selesai: b.tgl_selesai ? tglSiang(b.tgl_selesai) : null,
          aktif: b.aktif ?? true,
        },
      });
      dibuat += 1;
    }
    console.log(`✓ ${dibuat} badan pengurus dibuat.`);
  } else {
    console.log("✓ Tabel badan pengurus sudah berisi data — dilewati.");
  }
}

// --- Galeri album & foto ---

// Dua berkas foto yang sudah tersedia di public/uploads/galeri dipakai ulang
// sebagai contoh isi album.
const FOTO_TERSEDIA = [
  "/uploads/galeri/1fbd819e-0c8f-4a42-ba30-50e92e4d0865.webp",
  "/uploads/galeri/45bc66c2-a713-4251-9f92-ccee2d67f8a5.webp",
];

const GALERI: Array<{
  order: number;
  judul: string;
  keterangan?: string;
  kategori?: string;
  tgl?: string;
  status?: boolean;
  foto: Array<{ url: string; caption?: string }>;
}> = [
  {
    order: 1,
    judul: "Ibadah Natal 2025",
    keterangan: "<p>Dokumentasi Ibadah Malam Natal bersama seluruh jemaat.</p>",
    kategori: "Natal",
    tgl: "2025-12-24",
    status: true,
    foto: [
      { url: FOTO_TERSEDIA[0], caption: "Prosesi lilin pembuka ibadah." },
      { url: FOTO_TERSEDIA[1], caption: "Paduan suara gabungan unsur." },
    ],
  },
  {
    order: 2,
    judul: "Baptisan Kudus Paskah 2026",
    keterangan: "<p>Pelayanan Sakramen Baptisan Kudus pada rangkaian Paskah.</p>",
    kategori: "Baptisan",
    tgl: "2026-04-05",
    status: true,
    foto: [{ url: FOTO_TERSEDIA[0], caption: "Pelayanan baptisan oleh pendeta." }],
  },
];

async function seedGaleri() {
  const jumlah = await prisma.galeriAlbum.count();
  if (jumlah > 0) {
    console.log(`✓ Tabel galeri sudah berisi ${jumlah} album — dilewati.`);
    return;
  }
  let totalFoto = 0;
  for (const g of GALERI) {
    const album = await prisma.galeriAlbum.create({
      data: {
        order: g.order,
        judul: g.judul,
        keterangan: g.keterangan ? sanitizeRichText(g.keterangan) : null,
        kategori: g.kategori ?? null,
        tgl: g.tgl ? tglSiang(g.tgl) : null,
        status: g.status ?? true,
      },
    });
    for (let i = 0; i < g.foto.length; i++) {
      await prisma.galeriFoto.create({
        data: {
          id_album: album.id,
          url: g.foto[i].url,
          caption: g.foto[i].caption ?? null,
          order: i + 1,
        },
      });
      totalFoto += 1;
    }
  }
  console.log(`✓ ${GALERI.length} album galeri & ${totalFoto} foto dibuat.`);
}

// --- Log aktivitas (audit trail) ---

async function seedLogAktivitas() {
  const jumlah = await prisma.logAktivitas.count();
  if (jumlah > 0) {
    console.log(`✓ Tabel log aktivitas sudah berisi ${jumlah} data — dilewati.`);
    return;
  }
  const admin = await prisma.user.findUnique({ where: { username: "admin" } });
  if (!admin) {
    console.log("✓ Akun admin belum ada — log aktivitas dilewati.");
    return;
  }

  // Ambil beberapa baris nyata agar id_entitas & ringkasan konsisten.
  const [renungan, pengumuman, ibadah] = await Promise.all([
    prisma.renungan.findFirst({ orderBy: { created_at: "desc" } }),
    prisma.pengumuman.findFirst({ orderBy: { tgl_publish: "desc" } }),
    prisma.ibadah.findFirst({ orderBy: { created_at: "desc" } }),
  ]);

  const LOG: Array<{
    aksi: "CREATE" | "UPDATE" | "DELETE";
    entitas: string;
    id_entitas?: string | null;
    ringkasan?: string | null;
  }> = [
    { aksi: "CREATE", entitas: "Renungan", id_entitas: renungan?.id ?? null, ringkasan: renungan?.judul ?? "Renungan baru" },
    { aksi: "CREATE", entitas: "Pengumuman", id_entitas: pengumuman?.id ?? null, ringkasan: pengumuman?.judul ?? "Pengumuman baru" },
    { aksi: "CREATE", entitas: "Ibadah", id_entitas: ibadah?.id ?? null, ringkasan: ibadah?.nm_ibadah ?? "Jadwal ibadah baru" },
    { aksi: "UPDATE", entitas: "Pengumuman", id_entitas: pengumuman?.id ?? null, ringkasan: pengumuman?.judul ?? "Perbarui pengumuman" },
  ];

  for (const l of LOG) {
    await prisma.logAktivitas.create({
      data: {
        id_user: admin.id,
        username: admin.username,
        role: admin.role,
        aksi: l.aksi,
        entitas: l.entitas,
        id_entitas: l.id_entitas ?? null,
        ringkasan: l.ringkasan ?? null,
        ip: "127.0.0.1",
      },
    });
  }
  console.log(`✓ ${LOG.length} log aktivitas dibuat.`);
}


async function main() {
  // Urutan penting: master → user → jadwal & turunannya → pelayanan → konten.
  await seedMasterData();
  await seedRenungan();
  await seedPengumuman();
  await seedJadwalIbadah();
  await seedKehadiran();
  await seedKeuangan();
  await seedPelayanan();
  await seedGaleri();
  await seedLogAktivitas();
}

main()
  .catch((err) => {
    console.error("Seed gagal:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
