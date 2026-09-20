import { z } from "zod";

const optionalText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().trim().max(max).nullable(),
  );

export const galeriAlbumSchema = z.object({
  judul: z.string().trim().min(1, "Judul album wajib diisi.").max(255),
  keterangan: optionalText(10_000),
  kategori: optionalText(100),
  tgl: z.preprocess(
    (value) => (value === "" ? null : value),
    z.string().date("Tanggal kegiatan tidak valid.").nullable(),
  ),
  status: z.boolean(),
  order: z.coerce.number().int().min(0, "Urutan minimal 0.").max(999_999),
});

export const galeriFotoSchema = z.object({
  id_album: z.string().cuid("Album tidak valid."),
  caption: optionalText(500),
  order: z.coerce.number().int().min(0, "Urutan minimal 0.").max(999_999),
});

export type GaleriAlbumInput = z.infer<typeof galeriAlbumSchema>;
export type GaleriFotoInput = z.infer<typeof galeriFotoSchema>;

export type GaleriActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

export const initialGaleriActionState: GaleriActionState = { status: "idle" };
