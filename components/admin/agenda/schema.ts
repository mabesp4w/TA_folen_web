import { z } from "zod";

const optionalText = (max = 255) =>
  z.preprocess(
    (value) =>
      value == null || (typeof value === "string" && value.trim() === "")
        ? undefined
        : value,
    z.string().trim().max(max).optional(),
  );

const optionalId = optionalText(100);

const optionalSector = z.preprocess(
  (value) =>
    value == null || (typeof value === "string" && value.trim() === "")
      ? undefined
      : value,
  z.coerce
    .number()
    .int()
    .min(1, "Sektor minimal 1.")
    .max(99, "Sektor maksimal 99.")
    .optional(),
);

export const agendaSchema = z
  .object({
    id_jemaat: optionalId,
    id_unsur: optionalId,
    id_pelayan_firman: optionalId,
    nm_ibadah: optionalText(),
    gabungan: z.boolean(),
    sektor: optionalSector,
    tgl: z.string().date("Tanggal ibadah tidak valid."),
    waktu: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Waktu ibadah tidak valid."),
    tempat: optionalText(),
    alamat_tempat: optionalText(),
    catatan: optionalText(),
    pelayan_firman: optionalText(),
    liturgos: optionalText(),
    pembacaan_alkitab: optionalText(),
    piket: optionalText(),
    p_organ: optionalText(),
  })
  .superRefine((data, context) => {
    if (data.gabungan && !data.id_unsur) {
      context.addIssue({
        code: "custom",
        message: "Pilih unsur untuk ibadah gabungan.",
        path: ["id_unsur"],
      });
    }

    if (data.sektor && !data.id_unsur) {
      context.addIssue({
        code: "custom",
        message: "Pilih unsur sebelum mengisi sektor.",
        path: ["id_unsur"],
      });
    }

    if (data.id_pelayan_firman && data.pelayan_firman) {
      context.addIssue({
        code: "custom",
        message: "Pilih pelayan dari data jemaat atau isi nama tamu, bukan keduanya.",
        path: ["pelayan_firman"],
      });
    }
  });

export type AgendaInput = z.infer<typeof agendaSchema>;

export type AgendaActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Partial<Record<keyof AgendaInput, string[]>>;
};

export const initialAgendaActionState: AgendaActionState = { status: "idle" };
