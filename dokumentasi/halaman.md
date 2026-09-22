# Dokumentasi Halaman — GKI Syaloom Pasifik Indah

Dokumen ini menjelaskan secara rinci kegunaan setiap halaman aplikasi: apa
fungsinya, data apa yang harus diisi, apa yang ditampilkan, dan data apa yang
harus disiapkan terlebih dahulu sebelum mengisi data pada halaman tersebut.
Aplikasi terbagi menjadi dua area, yaitu area publik yang berisi halaman masuk,
serta area admin yang mencakup seluruh halaman di bawah `/admin` dan hanya dapat
diakses oleh pengguna yang sudah masuk.

## Urutan Pengisian Data (Penting Dibaca Lebih Dulu)

Banyak halaman saling bergantung, sehingga sebagian data tidak bisa diisi sebelum
data pendukungnya ada. Urutan pengisian yang disarankan adalah sebagai berikut.
Mulailah dari data induk (master) yang berdiri sendiri, yakni **Rayon** dan
**Unsur**. Setelah itu buat **Keluarga**, yang boleh dikaitkan ke sebuah rayon.
Baru kemudian masukkan **Data Jemaat**, karena setiap jemaat wajib bernaung pada
satu keluarga. Ketika data jemaat sudah ada, Anda dapat mengangkat sebagian dari
mereka menjadi **Pelayan & Pengurus** (pendeta, majelis, atau pengurus unsur), dan
khusus pengurus unsur juga membutuhkan data Unsur. Akun **Akun Akses** untuk peran
non-admin baru bisa dibuat setelah badan pengurusnya ada, karena akun tersebut
harus ditautkan ke satu kepengurusan. Selanjutnya barulah **Agenda & Ibadah**
dapat dibuat dengan memilih jemaat tuan rumah dan pelayan firman; setelah sebuah
ibadah tercatat, Anda dapat mengisi **Kehadiran** dan **Keuangan** yang merujuk ke
ibadah tersebut. Adapun **Pengumuman**, **Renungan**, dan **Galeri** berdiri
sendiri sehingga dapat diisi kapan saja tanpa prasyarat.

## Area Publik

Halaman masuk berada pada route `/` dan menjadi layar pertama sekaligus pintu
masuk ke seluruh aplikasi. Halaman ini menampilkan identitas gereja beserta
sambutan bernuansa Papua modern, lalu menyediakan form masuk dengan isian email
atau identitas jemaat dan kata sandi yang dilengkapi tombol tampil atau
sembunyikan sandi, ditambah pilihan "Ingat saya" dan tautan "Lupa kata sandi".
Sebelum data dikirim, sistem memastikan kedua isian terisi dan kata sandi minimal
enam karakter, kemudian menampilkan pesan galat bila gagal atau pesan sukses saat
berhasil. Setelah berhasil masuk, semua peran diarahkan ke `/admin`, dan tampilan
serta aksi di dalamnya dibatasi sesuai hak akses masing-masing peran. Tidak ada
prasyarat data untuk halaman ini selain akun yang sudah terdaftar.

## Area Admin

Seluruh halaman admin bersifat terlindungi, sehingga pengguna yang belum masuk
otomatis dialihkan kembali ke halaman login. Admin dapat melihat dan mengelola
semua menu, sedangkan Ketua Unsur dan Koordinator Unsur hanya melihat modul yang
diizinkan untuk perannya dengan aksi yang dibatasi per tindakan yaitu Lihat,
Tambah, Ubah, dan Hapus. Menu Pengaturan yang terdiri dari Akun Akses, Hak Akses,
dan Log Aktivitas bersifat eksklusif hanya untuk Admin.

### `/admin` — Dashboard

Halaman ringkasan yang tampil tepat setelah masuk. Bagi Admin, halaman ini
menyajikan statistik gereja berupa jumlah jemaat aktif, jumlah keluarga, jumlah
rayon, jumlah agenda pada bulan berjalan, serta persentase kehadiran beserta
perbandingannya dengan bulan lalu, ditambah daftar aktivitas terbaru dari log dan
agenda ibadah mendatang. Bagi peran unsur, tampilannya disederhanakan menjadi
sapaan dan agenda mendatang saja. Halaman ini hanya menampilkan data dan tidak
memiliki isian; angka yang muncul bergantung pada kelengkapan data jemaat,
keluarga, rayon, agenda, dan kehadiran yang sudah dimasukkan.

### Jemaat & Organisasi

#### `/admin/rayon` — Rayon

Berfungsi mengelola pembagian wilayah pelayanan jemaat. Ini adalah data induk yang
berdiri sendiri, sehingga tidak memerlukan data lain sebelum diisi, dan sebaiknya
dibuat lebih awal karena akan dipakai oleh Keluarga. Data yang diisi hanya satu,
yaitu nama rayon (wajib, minimal dua karakter dan unik), misalnya Galilea, Yerikho,
atau Bethel. Halaman menampilkan daftar rayon yang sudah ada beserta tombol untuk
menambah, mengubah, dan menghapus.

#### `/admin/unsur` — Unsur

Berfungsi mengelola unsur kategorial gereja seperti PKB, PW, PAM, Remaja, atau
Tunas Anak. Sama seperti Rayon, ini data induk yang berdiri sendiri dan sebaiknya
disiapkan lebih awal karena dibutuhkan oleh Pelayan & Pengurus serta Agenda ibadah
unsur. Data yang diisi hanya nama unsur (wajib, minimal dua karakter dan unik).
Halaman menampilkan daftar unsur beserta aksi tambah, ubah, dan hapus.

#### `/admin/keluarga` — Keluarga

Berfungsi mengelola kartu keluarga sebagai satu rumah tangga yang menaungi beberapa
jemaat; alamat dan rayon melekat pada keluarga, sehingga seluruh anggotanya
otomatis berbagi alamat dan rayon yang sama. Sebelum mengisi keluarga, sebaiknya
data Rayon sudah ada agar keluarga dapat langsung dikaitkan ke rayonnya, meskipun
kaitan ini bersifat opsional. Data yang diisi meliputi nomor Kartu Keluarga
(opsional, maksimal 30 karakter, dan harus unik bila diisi), alamat atau blok
(wajib, misalnya G. 16 atau H. 04), serta pilihan rayon (opsional). Halaman
menampilkan daftar keluarga beserta alamat dan rayonnya, dan menjadi acuan saat
menambahkan jemaat.

#### `/admin/jemaat` — Data Jemaat

Berfungsi mengelola data pribadi setiap anggota jemaat dan menjadi sumber data bagi
banyak modul lain seperti Pelayan & Pengurus dan Agenda ibadah. Sebelum mengisi
jemaat, data Keluarga wajib sudah tersedia karena setiap jemaat harus dipilihkan
keluarga tempat ia bernaung; dari keluarga itulah alamat dan rayonnya diturunkan
secara otomatis (idealnya Rayon dan Keluarga sudah dibuat lebih dahulu). Data yang
diisi meliputi nama lengkap (wajib, minimal dua karakter), tanggal lahir (wajib),
jenis kelamin (wajib, pilih Laki-laki atau Perempuan), status dalam keluarga
(wajib, pilih Kepala Keluarga, Isteri, Anak, atau Lain-lain), status keanggotaan
(wajib, pilih Aktif, Pindah, Meninggal, atau Lainnya, dengan Aktif sebagai
bawaan), serta keluarga tempat bernaung (wajib dipilih). Halaman menampilkan daftar
jemaat lengkap dengan identitas dan keluarga/rayon terkait, beserta aksi tambah,
ubah, dan hapus.

#### `/admin/pelayanan` — Pelayan & Pengurus

Berfungsi mengelola data pendeta, majelis (penatua dan syamas), serta badan
pengurus unsur kategorial. Karena data pribadi pelayan diambil dari data jemaat,
maka jemaat yang bersangkutan wajib sudah terdaftar lebih dahulu; khusus untuk
pengurus unsur, data Unsur juga wajib sudah ada. Saat menambah, pertama pilih jenis
pelayanan yaitu Pendeta, Majelis, atau Pengurus, lalu pilih jemaat yang menjabat
(wajib) dan isi tanggal mulai masa bakti (wajib) serta status aktif. Isian lain
menyesuaikan jenisnya: untuk Pendeta tersedia gelar seperti Pdt. atau Vikaris
(opsional); untuk Majelis wajib memilih jabatan Penatua atau Syamas; untuk Pengurus
wajib memilih unsur kategorial dan mengisi jabatan seperti Ketua, Sekretaris, atau
Bendahara, dengan sektor unsur (1–5) yang bersifat opsional. Tanggal selesai masa
bakti opsional dan bila diisi tidak boleh mendahului tanggal mulai. Halaman
menampilkan daftar pelayan dan pengurus beserta jabatan dan masa baktinya.

### Ibadah & Informasi

#### `/admin/agenda` — Agenda & Ibadah

Berfungsi mengelola jadwal ibadah dan agenda pelayanan. Sebelum membuat agenda,
sebaiknya data Jemaat sudah ada karena tuan rumah dan pelayan firman dipilih dari
data jemaat, dan bila ibadah bersifat unsur maka data Unsur juga perlu tersedia.
Data yang diisi mencakup tanggal ibadah (wajib) dan waktu dalam format jam:menit
seperti 05:30 atau 09:00 (wajib), sedangkan sisanya opsional dan disesuaikan
kebutuhan: jemaat tuan rumah atau keluarga giliran, unsur kategorial, pelayan
firman yang dipilih dari data jemaat atau diketik sebagai nama tamu (pilih salah
satu, tidak boleh keduanya), nama ibadah, penanda ibadah gabungan (yang bila
diaktifkan mewajibkan pemilihan unsur), nomor sektor (yang mewajibkan unsur bila
diisi), tempat dan alamat pelaksanaan bila ibadah dipindah, catatan alasan
pemindahan, serta pelengkap liturgi seperti liturgos, pembacaan Alkitab, petugas
piket, dan pemain organ. Halaman menampilkan daftar ibadah terjadwal beserta detail
pelaksanaannya.

#### `/admin/kehadiran` — Kehadiran

Berfungsi mencatat dan menampilkan statistik kehadiran pada setiap ibadah. Karena
kehadiran melekat pada sebuah ibadah, maka agenda atau ibadah terkait wajib sudah
dibuat lebih dahulu. Data yang diisi adalah pemilihan ibadah (wajib) serta jumlah
hadir yang dipecah menjadi laki-laki, perempuan, dan anak (masing-masing berupa
angka bulat tidak negatif); total kehadiran dihitung dari ketiga angka tersebut.
Halaman menampilkan rekap kehadiran per ibadah.

#### `/admin/pengumuman` — Pengumuman

Berfungsi mengelola warta dan pengumuman bagi jemaat. Halaman ini berdiri sendiri
tanpa prasyarat data lain. Data yang diisi meliputi judul (wajib), isi pengumuman
(wajib), dan status terbit yang menentukan apakah pengumuman ditampilkan atau tidak.
Halaman menampilkan daftar pengumuman beserta status dan tanggal terbitnya.

#### `/admin/renungan` — Renungan

Berfungsi mengelola renungan harian yang dibagikan kepada jemaat, dan berdiri
sendiri tanpa prasyarat. Data yang diisi meliputi judul (wajib), isi renungan
(wajib), tanggal terbit (wajib), serta beberapa isian opsional yaitu ayat bacaan
(misalnya Matius 28:1-15), kutipan penegas di bawah judul, dan sumber renungan.
Halaman menampilkan daftar renungan beserta tanggal terbitnya.

### Keuangan & Media

#### `/admin/keuangan` — Keuangan

Berfungsi mencatat penerimaan dan persembahan gereja. Pencatatan dapat dikaitkan ke
sebuah ibadah agar diketahui pada kebaktian mana persembahan itu dikumpulkan,
sehingga bila ingin mengaitkannya, ibadah terkait perlu sudah ada; namun kaitan ini
bersifat opsional. Data yang diisi meliputi kategori penerimaan (wajib, pilih
antara Tangguk, Diakonia, Pengucapan Syukur, Persepuluhan, Pembangunan & Renovasi,
Penunjang Pelayanan, atau Inkonvensional) dan jumlah dalam rupiah (wajib, berupa
angka bulat positif), sedangkan nama pemberi, ibadah terkait, dan keterangan
bersifat opsional. Halaman menampilkan daftar penerimaan beserta kategori dan
jumlahnya.

#### `/admin/galeri` — Galeri

Berfungsi mengelola album dan foto kegiatan gereja. Pengisian dilakukan bertahap:
buat album terlebih dahulu, baru kemudian unggah foto ke dalam album tersebut,
sehingga sebuah foto tidak dapat ditambahkan sebelum albumnya ada. Saat membuat
album, data yang diisi meliputi judul album (wajib), status tampil, dan urutan,
serta isian opsional berupa keterangan, kategori (misalnya Ibadah, Baptisan, atau
Natal), dan tanggal kegiatan. Saat menambah foto, foto dilampirkan ke sebuah album
dengan keterangan per foto dan urutan yang bersifat opsional. Halaman menampilkan
album beserta foto-foto di dalamnya.

#### `/admin/laporan` — Laporan

Halaman bersifat hanya-lihat yang menyajikan rekap keuangan, kehadiran, statistik
jemaat, serta daftar ulang tahun. Halaman ini tidak memiliki isian dan tidak
menyediakan aksi tambah, ubah, maupun hapus; isinya sepenuhnya bergantung pada
kelengkapan data yang sudah dimasukkan di modul-modul lain. Selain menampilkan,
halaman ini juga memungkinkan data rekap diekspor untuk keperluan pelaporan.

### Pengaturan (khusus Admin)

#### `/admin/pengaturan` — Akun Akses

Berfungsi mengelola akun pengguna yang dapat masuk ke area admin beserta perannya.
Untuk akun peran unsur, badan pengurus yang akan ditautkan wajib sudah ada lebih
dahulu, sehingga data Pelayan & Pengurus perlu disiapkan sebelumnya. Data yang
diisi meliputi username (wajib, minimal tiga karakter, hanya huruf, angka, titik,
garis bawah, dan strip), peran akun (wajib; hanya Ketua Unsur dan Koordinator Unsur
yang dapat dipilih dari form karena akun Administrator dibuat lewat skrip), dan kata
sandi (wajib minimal delapan karakter saat membuat akun baru, boleh dikosongkan
saat mengubah bila tidak ingin menggantinya). Untuk peran non-admin, pemilihan badan
pengurus bersifat wajib karena akun harus tertaut ke satu kepengurusan. Halaman
menampilkan daftar akun beserta peran dan kepengurusan terkait.

#### `/admin/otorisasi` — Hak Akses

Berfungsi mengatur matriks izin setiap peran unsur terhadap tiap modul melalui empat
tindakan yaitu Lihat, Tambah, Ubah, dan Hapus. Halaman ini tidak bergantung pada
data operasional lain karena hanya mengelola izin. Cara kerjanya adalah memilih
peran yang akan diatur (Ketua Unsur atau Koordinator Unsur), lalu mencentang izin
yang diberikan untuk setiap modul; modul yang bersifat hanya-lihat seperti Laporan
hanya memiliki kolom Lihat, dan peran Administrator sengaja tidak diatur di sini
karena selalu berakses penuh. Halaman menampilkan tabel modul dengan kotak centang
untuk tiap tindakan.

#### `/admin/log-aktivitas` — Log Aktivitas

Berfungsi menampilkan riwayat aktivitas pengguna di sistem untuk keperluan audit dan
pemantauan, mencatat siapa melakukan aksi apa (menambah, mengubah, atau menghapus)
terhadap entitas apa dan kapan, lengkap dengan snapshot username dan peran pelaku.
Halaman ini hanya menampilkan dan tidak memiliki isian; datanya terbentuk otomatis
seiring aktivitas pengguna, dan tersedia penyaringan untuk menelusuri riwayat.

## Catatan

Aplikasi mengenal tiga peran, yaitu Admin, Ketua Unsur (`KETUA_UNSUR`), dan
Koordinator Unsur (`KOORDINATOR_UNSUR`). Hanya dua peran unsur yang izinnya dapat
diatur dari antarmuka, sedangkan Admin selalu berakses penuh. Menu navigasi
disaring secara otomatis sehingga setiap peran hanya melihat modul yang diizinkan,
dan grup menu yang menjadi kosong akan disembunyikan. Sumber kebenaran daftar modul
dan izin berada di `lib/permissions.ts`, struktur data dan relasinya di
`prisma/schema.prisma`, aturan wajib/opsional tiap isian di berkas `schema.ts` pada
masing-masing modul (mis. `components/admin/jemaat/schema.ts`), dan susunan menu di
`components/layouts/app-sidebar.tsx`.
