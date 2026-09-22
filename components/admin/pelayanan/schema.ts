import { z } from "zod";

export const PELAYANAN_TYPES = ["PENDETA", "MAJELIS", "PENGURUS"] as const;
export const MAJELIS_POSITIONS = ["PENATUA", "SYAMAS"] as const;

// Pilihan jabatan untuk pengurus badan/unsur.
export const JABATAN_PENGURUS = [
  "Ketua",
  "Wakil Ketua",
  "Koordinator",
  "Sekretaris",
  "Wakil Sekretaris",
  "Bendahara",
  "Wakil Bendahara",
  "Anggota",
] as const;

// Sektor unsur yang tersedia (1-5).
export const SEKTOR_OPTIONS = [1, 2, 3, 4, 5] as const;

const optionalText = z.preprocess(
  (value) => (value == null || (typeof value === "string" && value.trim() === "") ? undefined : value),
  z.string().trim().max(100).optional(),
);

const optionalDate = z.preprocess(
  (value) => (value == null || (typeof value === "string" && value.trim() === "") ? undefined : value),
  z.string().date("Tanggal selesai tidak valid.").optional(),
);

const optionalSector = z.preprocess(
  (value) => (value == null || (typeof value === "string" && value.trim() === "") ? undefined : value),
  z.coerce.number().int().min(1, "Sektor minimal 1.").max(5, "Sektor maksimal 5.").optional(),
);

export const pelayananSchema = z
  .object({
    type: z.enum(PELAYANAN_TYPES, { message: "Pilih jenis pelayanan." }),
    id_jemaat: z.string().trim().min(1, "Pilih jemaat."),
    gelar: optionalText,
    jabatan: optionalText,
    id_unsur: optionalText,
    sektor: optionalSector,
    tgl_mulai: z.string().date("Tanggal mulai tidak valid."),
    tgl_selesai: optionalDate,
    aktif: z.boolean(),
  })
  .superRefine((data, context) => {
    if (data.tgl_selesai && data.tgl_selesai < data.tgl_mulai) {
      context.addIssue({
        code: "custom",
        message: "Tanggal selesai tidak boleh mendahului tanggal mulai.",
        path: ["tgl_selesai"],
      });
    }

    if (data.type === "MAJELIS" && !MAJELIS_POSITIONS.includes(data.jabatan as (typeof MAJELIS_POSITIONS)[number])) {
      context.addIssue({
        code: "custom",
        message: "Pilih jabatan majelis.",
        path: ["jabatan"],
      });
    }

    if (data.type === "PENGURUS" && !data.jabatan) {
      context.addIssue({
        code: "custom",
        message: "Jabatan pengurus wajib diisi.",
        path: ["jabatan"],
      });
    }

    if (data.type === "PENGURUS" && !data.id_unsur) {
      context.addIssue({
        code: "custom",
        message: "Pilih unsur kategorial.",
        path: ["id_unsur"],
      });
    }
  });

export type PelayananInput = z.infer<typeof pelayananSchema>;

export type PelayananActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Partial<Record<keyof PelayananInput, string[]>>;
};

export const initialPelayananActionState: PelayananActionState = { status: "idle" };
