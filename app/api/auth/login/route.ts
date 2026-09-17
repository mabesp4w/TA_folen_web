import { NextResponse } from "next/server";
import { verifyPassword, setSessionCookie, type SafeUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identity, password } = body;

    // Validasi input
    if (!identity || !password) {
      return NextResponse.json(
        { error: "Identitas dan kata sandi harus diisi." },
        { status: 400 }
      );
    }

    // Cari user berdasarkan username
    const user = await prisma.user.findUnique({
      where: {
        username: identity,
      },
      select: {
        id: true,
        username: true,
        password: true,
        role: true,
        badan_pengurus: {
          select: {
            unsur: {
              select: {
                nm_unsur: true,
              },
            },
          },
        },
      },
    });

    // Jika user tidak ditemukan atau password salah
    if (!user || !verifyPassword(password, user.password)) {
      return NextResponse.json(
        { error: "Username atau kata sandi salah." },
        { status: 401 }
      );
    }

    // Buat session data (tanpa password)
    const safeUser: SafeUser = {
      id: user.id,
      username: user.username,
      role: user.role,
      badan_pengurus:
        user.badan_pengurus?.unsur.nm_unsur.toLowerCase().replaceAll(" ", "-") ?? null,
    };

    // Buat response dengan session cookie
    const response = NextResponse.json({
      success: true,
      user: safeUser,
    });

    // Set session cookie
    setSessionCookie(response, safeUser);

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat login. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
