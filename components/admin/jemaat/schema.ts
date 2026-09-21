import { z } from "zod";

export const JEMAAT_STATUSES = ["AKTIF", "PINDAH", "MENINGGAL", "LAINNYA"] as const;
export const JEMAAT_GENDERS = ["L", "P"] as const;
export const FAMILY_STATUSES = ["KK", "Isteri", "Anak", "Lain_Lain"] as const;

export const jemaatSchema = z.object({
  nm_lengkap: z.string().trim().min(2, "Nama lengkap minimal 2 karakter.").max(150),
  tgl_lahir: z.string().date("Tanggal lahir tidak valid."),
  jenkel: z.enum(JEMAAT_GENDERS, { message: "Pilih jenis kelamin." }),
  stat_keluarga: z.enum(FAMILY_STATUSES, { message: "Pilih status keluarga." }),
  status: z.enum(JEMAAT_STATUSES, { message: "Pilih status jemaat." }),
  // Keluarga (Kartu Keluarga) tempat jemaat ini bernaung. Alamat & rayon
  // diturunkan dari keluarga, sehingga anggota satu keluarga selalu seragam.
  id_keluarga: z.string().trim().min(1, "Pilih keluarga."),
});

export type JemaatInput = z.infer<typeof jemaatSchema>;

export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Partial<Record<keyof JemaatInput, string[]>>;
};

export const initialActionState: ActionState = { status: "idle" };
