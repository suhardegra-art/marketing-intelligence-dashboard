import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get("mi_session")?.value;

  const isAuthenticated = await verifySessionToken(
    token,
    process.env.SESSION_SECRET
  );

  const isProtectedDashboard =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/tiktok") ||
    pathname.startsWith("/youtube") ||
    pathname.startsWith("/auto-reply-comment");

  if (isProtectedDashboard && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/login" && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/tiktok/:path*",
    "/youtube/:path*",
    "/auto-reply-comment/:path*",
    "/login"
  ]
};
