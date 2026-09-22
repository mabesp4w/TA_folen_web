import { z } from "zod";
import { MANAGED_ROLES, RESOURCE_KEYS } from "@/lib/permissions";

// Payload penyimpanan izin untuk SATU role: peta resourceKey -> aksi -> boolean.
// Dikirim sebagai JSON string melalui field tersembunyi form.
const resourcePermission = z.object({
  view: z.boolean(),
  create: z.boolean(),
  update: z.boolean(),
  delete: z.boolean(),
});

export const savePermissionsSchema = z.object({
  role: z.enum(MANAGED_ROLES),
  // Hanya resource yang dikenal yang diterima; kunci asing diabaikan saat parse.
  matrix: z.record(z.enum(RESOURCE_KEYS as [string, ...string[]]), resourcePermission),
});

export type SavePermissionsInput = z.infer<typeof savePermissionsSchema>;

export type OtorisasiActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const initialOtorisasiActionState: OtorisasiActionState = { status: "idle" };
