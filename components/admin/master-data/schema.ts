import { z } from "zod";

export const masterDataSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(100),
});

export type MasterDataActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: { name?: string[] };
};

export const initialMasterDataActionState: MasterDataActionState = {
  status: "idle",
};
