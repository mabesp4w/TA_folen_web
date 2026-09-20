import { z } from "zod";

const optionalText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().trim().max(max).nullable(),
  );

export const slideSchema = z.object({
  judul: optionalText(255),
  teks: optionalText(1_000),
  link_url: optionalText(500),
  link_teks: optionalText(100),
  status: z.boolean(),
});

export type SlideInput = z.infer<typeof slideSchema>;

export type SlideActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Partial<Record<keyof SlideInput, string[]>>;
};

export const initialSlideActionState: SlideActionState = { status: "idle" };
