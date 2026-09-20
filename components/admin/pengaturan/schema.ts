import { z } from "zod";

export const USER_ROLES = ["ADMIN", "KETUA_UNSUR"] as const;

const username = z
  .string()
  .trim()
  .min(3, "Username minimal 3 karakter.")
  .max(50, "Username maksimal 50 karakter.")
  .regex(/^[a-zA-Z0-9._-]+$/, "Username hanya boleh huruf, angka, titik, garis bawah, dan strip.");

const role = z.enum(USER_ROLES, { message: "Pilih peran akun." });

const optionalPengurus = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z.string().nullable(),
);

// Password wajib saat membuat akun baru.
export const createUserSchema = z.object({
  username,
  role,
  password: z.string().min(8, "Kata sandi minimal 8 karakter.").max(200),
  badan_pengurus_id: optionalPengurus,
});

// Password opsional saat memperbarui (kosong = tidak diubah).
export const updateUserSchema = z.object({
  username,
  role,
  password: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().min(8, "Kata sandi minimal 8 karakter.").max(200).optional(),
  ),
  badan_pengurus_id: optionalPengurus,
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export type UserActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

export const initialUserActionState: UserActionState = { status: "idle" };
