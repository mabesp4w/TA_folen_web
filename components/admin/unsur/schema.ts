import { z } from "zod";

export const unsurSchema = z.object({
  name: z.string().trim().min(2, "Nama unsur minimal 2 karakter.").max(100),
});

export type UnsurInput = z.infer<typeof unsurSchema>;

export type UnsurActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Partial<Record<keyof UnsurInput, string[]>>;
};

export const initialUnsurActionState: UnsurActionState = { status: "idle" };
