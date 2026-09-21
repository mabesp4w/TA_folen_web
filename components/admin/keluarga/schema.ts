import { z } from "zod";

export const keluargaSchema = z.object({
  no_kk: z
    .string()
    .trim()
    .max(30, "Nomor KK maksimal 30 karakter.")
    .optional(),
  alamat_blok: z.string().trim().min(1, "Alamat blok wajib diisi.").max(100),
  id_rayon: z.string().trim().optional(),
});

export type KeluargaInput = z.infer<typeof keluargaSchema>;

export type KeluargaActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Partial<Record<keyof KeluargaInput, string[]>>;
};

export const initialKeluargaActionState: KeluargaActionState = { status: "idle" };
