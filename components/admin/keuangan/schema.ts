import { z } from "zod";

export const KATEGORI_KEUANGAN = [
  "TANGGUK",
  "DIAKONIA",
  "PENGUCAPAN_SYUKUR",
  "PERSEPULUHAN",
  "PEMBANGUNAN_RENOVASI",
  "PENUNJANG_PELAYANAN",
  "INKONVENSIONAL",
] as const;

export const LABEL_KATEGORI_KEUANGAN: Record<
  (typeof KATEGORI_KEUANGAN)[number],
  string
> = {
  TANGGUK: "Tangguk",
  DIAKONIA: "Diakonia",
  PENGUCAPAN_SYUKUR: "Pengucapan Syukur",
  PERSEPULUHAN: "Persepuluhan",
  PEMBANGUNAN_RENOVASI: "Pembangunan & Renovasi",
  PENUNJANG_PELAYANAN: "Penunjang Pelayanan",
  INKONVENSIONAL: "Inkonvensional",
};

const optionalText = (max = 255) =>
  z.preprocess(
    (value) =>
      value == null || (typeof value === "string" && value.trim() === "")
        ? undefined
        : value,
    z.string().trim().max(max).optional(),
  );

const jumlahSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;

    const normalized = value.trim();
    if (!/^\d+$/.test(normalized)) return value;

    return Number(normalized);
  },
  z
    .number({ error: "Jumlah harus berupa angka bulat." })
    .int("Jumlah harus berupa angka bulat.")
    .positive("Jumlah harus lebih dari Rp0.")
    .max(2_147_483_647, "Jumlah melebihi batas yang dapat disimpan."),
);

export const keuanganSchema = z.object({
  id_ibadah: optionalText(100),
  kategori: z.enum(KATEGORI_KEUANGAN, {
    error: "Pilih kategori penerimaan.",
  }),
  nm_pemberi: optionalText(),
  jumlah: jumlahSchema,
  keterangan: optionalText(5_000),
});

export type KeuanganInput = z.infer<typeof keuanganSchema>;

export type KeuanganActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Partial<Record<keyof KeuanganInput, string[]>>;
};

export const initialKeuanganActionState: KeuanganActionState = {
  status: "idle",
};
