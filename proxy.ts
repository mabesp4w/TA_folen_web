import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";

export function proxy(request: NextRequest) {
  const session = getSession(request);
  const pathname = request.nextUrl.pathname;

  if (!session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname.startsWith("/app/admin")) {
    return session.role === "ADMIN"
      ? NextResponse.next()
      : NextResponse.redirect(new URL("/", request.url));
  }

  const badanPengurus = pathname.split("/")[2];
  if (
    session.role === "ADMIN" ||
    !session.badan_pengurus ||
    badanPengurus !== session.badan_pengurus
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
