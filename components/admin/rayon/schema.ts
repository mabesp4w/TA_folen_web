import { z } from "zod";

export const rayonSchema = z.object({
  name: z.string().trim().min(2, "Nama rayon minimal 2 karakter.").max(100),
});

export type RayonInput = z.infer<typeof rayonSchema>;

export type RayonActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Partial<Record<keyof RayonInput, string[]>>;
};

export const initialRayonActionState: RayonActionState = { status: "idle" };
