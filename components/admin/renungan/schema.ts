import { z } from "zod";

export const renunganSchema = z.object({
  judul: z.string().trim().min(1, "Judul wajib diisi.").max(255, "Judul maksimal 255 karakter."),
  bacaan: z.string().trim().max(255, "Bacaan maksimal 255 karakter.").optional(),
  kutipan: z.string().trim().max(10_000, "Kutipan terlalu panjang.").optional(),
  isi: z.string().trim().min(1, "Isi renungan wajib diisi.").max(100_000, "Isi renungan terlalu panjang."),
  sumber: z.string().trim().max(255, "Sumber maksimal 255 karakter.").optional(),
  tgl_publish: z.string().date("Tanggal terbit wajib diisi."),
});

export type RenunganInput = z.infer<typeof renunganSchema>;

export type RenunganActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Partial<Record<keyof RenunganInput, string[]>>;
};

export const initialRenunganActionState: RenunganActionState = { status: "idle" };
