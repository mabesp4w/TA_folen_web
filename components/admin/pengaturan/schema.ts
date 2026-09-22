import { z } from "zod";

export const USER_ROLES = ["ADMIN", "KETUA_UNSUR", "KOORDINATOR_UNSUR"] as const;

// Peran yang bisa dipilih saat membuat akun baru lewat UI. "ADMIN" sengaja
// dikecualikan — akun administrator hanya dibuat lewat seed/skrip, bukan form.
export const ASSIGNABLE_ROLES = USER_ROLES.filter(
  (value) => value !== "ADMIN",
) as Exclude<(typeof USER_ROLES)[number], "ADMIN">[];

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

// Badan pengurus wajib untuk peran non-admin (Ketua Unsur & Koordinator Unsur),
// karena akun tersebut harus tertaut ke satu kepengurusan. Akun Administrator
// tidak ditautkan, jadi dikecualikan.
function requirePengurusForUnsur(
  data: { role: string; badan_pengurus_id: string | null },
  ctx: z.RefinementCtx,
) {
  if (data.role !== "ADMIN" && !data.badan_pengurus_id) {
    ctx.addIssue({
      code: "custom",
      path: ["badan_pengurus_id"],
      message: "Pilih badan pengurus untuk akun ini.",
    });
  }
}

// Password wajib saat membuat akun baru.
export const createUserSchema = z
  .object({
    username,
    role,
    password: z.string().min(8, "Kata sandi minimal 8 karakter.").max(200),
    badan_pengurus_id: optionalPengurus,
  })
  .superRefine(requirePengurusForUnsur);

// Password opsional saat memperbarui (kosong = tidak diubah).
export const updateUserSchema = z
  .object({
    username,
    role,
    password: z.preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
      z.string().min(8, "Kata sandi minimal 8 karakter.").max(200).optional(),
    ),
    badan_pengurus_id: optionalPengurus,
  })
  .superRefine(requirePengurusForUnsur);

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export type UserActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

export const initialUserActionState: UserActionState = { status: "idle" };
