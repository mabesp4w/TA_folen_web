// prisma/create-user.ts
//
// Membuat (atau memperbarui) akun user dari command line.
//
// Pemakaian:
//   yarn user:create <username> <password> [role]
//
// Contoh:
//   yarn user:create smart 1122334455
//   yarn user:create budi rahasia123 KETUA_UNSUR
//
// Alternatif tanpa menaruh password di argumen (lebih aman — tidak masuk
// riwayat shell): set lewat env.
//   USER_NAME=smart USER_PASSWORD=1122334455 yarn user:create
//   USER_ROLE=KETUA_UNSUR yarn user:create
//
// Password di-hash dengan scrypt (lihat lib/auth.ts) sebelum disimpan.

import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../lib/generated/prisma/client";
import { hashPassword } from "../lib/auth";

const ALLOWED_ROLES = ["ADMIN", "KETUA_UNSUR"] as const;
type Role = (typeof ALLOWED_ROLES)[number];

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

function fail(msg: string): never {
  console.error(`✗ ${msg}\n`);
  console.error(
    "Pemakaian: yarn user:create <username> <password> [role]",
  );
  console.error("Contoh   : yarn user:create smart 1122334455");
  console.error("           yarn user:create budi rahasia123 KETUA_UNSUR");
  console.error(`Role valid: ${ALLOWED_ROLES.join(", ")} (default: ADMIN)`);
  process.exit(1);
}

async function main() {
  const [argUser, argPass, argRole] = process.argv.slice(2);

  const username = (argUser ?? process.env.USER_NAME)?.trim();
  const password = argPass ?? process.env.USER_PASSWORD;
  const role = (argRole ?? process.env.USER_ROLE ?? "ADMIN").trim() as Role;

  if (!username) fail("Username wajib diisi.");
  if (!password) fail("Password wajib diisi.");
  if (password.length < 6) fail("Password minimal 6 karakter.");
  if (!ALLOWED_ROLES.includes(role)) {
    fail(`Role "${role}" tidak dikenal.`);
  }

  const hashed = hashPassword(password);

  // Upsert: buat baru bila belum ada, atau perbarui password dan role.
  const existing = await prisma.user.findUnique({ where: { username } });

  const user = await prisma.user.upsert({
    where: { username },
    update: { password: hashed, role },
    create: { username, password: hashed, role },
  });

  const aksi = existing ? "diperbarui" : "dibuat";
  console.log(
    `✓ User "${user.username}" (role: ${user.role}) berhasil ${aksi}.`,
  );
}

main()
  .catch((err) => {
    console.error("Gagal membuat user:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
