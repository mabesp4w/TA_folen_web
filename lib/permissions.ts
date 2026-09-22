// ---------------------------------------------------------------------------
// Hak Akses (Authorization) — sumber kebenaran untuk daftar resource, aksi,
// role yang diatur, dan tipe/ helper murni.
//
// File ini AMAN untuk klien (tanpa impor prisma). Fungsi yang menyentuh
// database ada di lib/permissions-server.ts, mengikuti pola auth/auth-server.
//
// Role ADMIN SELALU berakses penuh dan tidak pernah disimpan sebagai baris izin.
// Hanya KETUA_UNSUR & KOORDINATOR_UNSUR yang izinnya dapat dikelola dari UI.
// ---------------------------------------------------------------------------

// Role yang izinnya dapat diatur (ADMIN sengaja dikecualikan).
export const MANAGED_ROLES = ["KOORDINATOR_UNSUR", "KETUA_UNSUR"] as const;
export type ManagedRole = (typeof MANAGED_ROLES)[number];

export const ROLE_LABELS: Record<ManagedRole, string> = {
  KOORDINATOR_UNSUR: "Koordinator Unsur",
  KETUA_UNSUR: "Ketua Unsur",
};

export function isManagedRole(value: string): value is ManagedRole {
  return (MANAGED_ROLES as readonly string[]).includes(value);
}

// Empat aksi CRUD yang dapat diizinkan per resource.
export const PERMISSION_ACTIONS = ["view", "create", "update", "delete"] as const;
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

export const ACTION_LABELS: Record<PermissionAction, string> = {
  view: "Lihat",
  create: "Tambah",
  update: "Ubah",
  delete: "Hapus",
};

// Kolom boolean di tabel RolePermission untuk tiap aksi.
export const ACTION_COLUMN: Record<PermissionAction, "can_view" | "can_create" | "can_update" | "can_delete"> = {
  view: "can_view",
  create: "can_create",
  update: "can_update",
  delete: "can_delete",
};

// ---------------------------------------------------------------------------
// Daftar resource/modul yang dapat diberi izin. `key` dipakai sebagai nilai
// stabil di database (tahan rename label), `href` untuk navigasi terkait.
// Modul khusus admin (Akun Akses, Log Aktivitas, Otorisasi) sengaja TIDAK
// dimasukkan karena tetap eksklusif untuk ADMIN.
// ---------------------------------------------------------------------------
export type AuthorizableResource = {
  key: string;
  label: string;
  description: string;
  href: string;
  group: string;
  // Resource hanya-lihat (mis. Laporan): aksi tambah/ubah/hapus tidak berlaku,
  // jadi di matriks Otorisasi hanya kolom "Lihat" yang aktif.
  viewOnly?: boolean;
};

export const AUTHORIZABLE_RESOURCES: readonly AuthorizableResource[] = [
  {
    key: "jemaat",
    label: "Data Jemaat",
    description: "Data pribadi anggota jemaat.",
    href: "/admin/jemaat",
    group: "Jemaat & Organisasi",
  },
  {
    key: "keluarga",
    label: "Keluarga",
    description: "Kartu keluarga & alamat.",
    href: "/admin/keluarga",
    group: "Jemaat & Organisasi",
  },
  {
    key: "rayon",
    label: "Rayon",
    description: "Pembagian wilayah rayon.",
    href: "/admin/rayon",
    group: "Jemaat & Organisasi",
  },
  {
    key: "unsur",
    label: "Unsur",
    description: "Unsur kategorial (PKB, PW, dll).",
    href: "/admin/unsur",
    group: "Jemaat & Organisasi",
  },
  {
    key: "pelayanan",
    label: "Pelayan & Pengurus",
    description: "Pendeta, majelis, & badan pengurus.",
    href: "/admin/pelayanan",
    group: "Jemaat & Organisasi",
  },
  {
    key: "agenda",
    label: "Agenda & Ibadah",
    description: "Jadwal ibadah & agenda pelayanan.",
    href: "/admin/agenda",
    group: "Ibadah & Informasi",
  },
  {
    key: "kehadiran",
    label: "Kehadiran",
    description: "Statistik kehadiran ibadah.",
    href: "/admin/kehadiran",
    group: "Ibadah & Informasi",
  },
  {
    key: "pengumuman",
    label: "Pengumuman",
    description: "Warta & pengumuman jemaat.",
    href: "/admin/pengumuman",
    group: "Ibadah & Informasi",
  },
  {
    key: "renungan",
    label: "Renungan",
    description: "Renungan harian.",
    href: "/admin/renungan",
    group: "Ibadah & Informasi",
  },
  {
    key: "keuangan",
    label: "Keuangan",
    description: "Penerimaan & persembahan.",
    href: "/admin/keuangan",
    group: "Keuangan",
  },
  {
    key: "galeri",
    label: "Galeri",
    description: "Album & foto kegiatan.",
    href: "/admin/galeri",
    group: "Galeri",
  },
  {
    key: "laporan",
    label: "Laporan",
    description: "Rekap keuangan, kehadiran, statistik jemaat, & ulang tahun.",
    href: "/admin/laporan",
    group: "Laporan",
    viewOnly: true,
  },
] as const;

// Kunci resource yang hanya-lihat (tanpa aksi tulis).
export const VIEW_ONLY_RESOURCE_KEYS = AUTHORIZABLE_RESOURCES.filter(
  (r) => r.viewOnly,
).map((r) => r.key);

export function isViewOnlyResource(key: string): boolean {
  return VIEW_ONLY_RESOURCE_KEYS.includes(key);
}

export const RESOURCE_KEYS = AUTHORIZABLE_RESOURCES.map((r) => r.key);

export function isAuthorizableResource(key: string): boolean {
  return RESOURCE_KEYS.includes(key);
}

// ---------------------------------------------------------------------------
// Bentuk data izin yang dipakai UI & helper.
// ---------------------------------------------------------------------------
export type ResourcePermission = Record<PermissionAction, boolean>;

// Matriks: resourceKey -> { view, create, update, delete }
export type PermissionMatrix = Record<string, ResourcePermission>;

const NO_ACCESS: ResourcePermission = {
  view: false,
  create: false,
  update: false,
  delete: false,
};

// Izin default saat sebuah baris belum ada di database: tidak berakses.
// Admin harus secara eksplisit memberi izin lewat halaman Otorisasi.
export function defaultResourcePermission(): ResourcePermission {
  return { ...NO_ACCESS };
}

// Bangun matriks lengkap (semua resource terisi) dari baris database untuk satu
// role. Resource yang belum punya baris akan bernilai default (tanpa akses).
export function buildMatrix(
  rows: Array<{
    resource: string;
    can_view: boolean;
    can_create: boolean;
    can_update: boolean;
    can_delete: boolean;
  }>,
): PermissionMatrix {
  const byResource = new Map(rows.map((row) => [row.resource, row]));
  const matrix: PermissionMatrix = {};

  for (const resource of AUTHORIZABLE_RESOURCES) {
    const row = byResource.get(resource.key);
    matrix[resource.key] = row
      ? {
          view: row.can_view,
          create: row.can_create,
          update: row.can_update,
          delete: row.can_delete,
        }
      : defaultResourcePermission();
  }

  return matrix;
}

// Fungsi yang menyentuh database (getRoleMatrix, getAllMatrices, can) berada di
// lib/permissions-server.ts agar file ini tetap aman diimpor dari komponen klien.
