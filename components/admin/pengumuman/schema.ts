import { z } from "zod";

export const pengumumanSchema = z.object({
  judul: z.string().trim().min(1, "Judul wajib diisi.").max(255, "Judul maksimal 255 karakter."),
  isi: z.string().trim().min(1, "Isi pengumuman wajib diisi.").max(100_000, "Isi pengumuman terlalu panjang."),
  diterbitkan: z.boolean(),
});

export type PengumumanInput = z.infer<typeof pengumumanSchema>;

export type PengumumanActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Partial<Record<keyof PengumumanInput, string[]>>;
};

export const initialPengumumanActionState: PengumumanActionState = { status: "idle" };
