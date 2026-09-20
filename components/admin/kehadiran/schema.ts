import { z } from "zod";

const count = (label: string) =>
  z.coerce
    .number({ message: `${label} harus berupa angka.` })
    .int(`${label} harus bilangan bulat.`)
    .min(0, `${label} tidak boleh negatif.`)
    .max(100_000, `${label} terlalu besar.`);

export const kehadiranSchema = z.object({
  id_ibadah: z.string().min(1, "Pilih ibadah."),
  laki_laki: count("Jumlah laki-laki"),
  perempuan: count("Jumlah perempuan"),
  anak: count("Jumlah anak"),
});

export type KehadiranInput = z.infer<typeof kehadiranSchema>;

export type KehadiranActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Partial<Record<keyof KehadiranInput, string[]>>;
};

export const initialKehadiranActionState: KehadiranActionState = { status: "idle" };
