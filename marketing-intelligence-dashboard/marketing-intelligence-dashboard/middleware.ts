import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get("mi_session")?.value;
  const isAuthenticated = await verifySessionToken(token, process.env.SESSION_SECRET);

  const isMetaApi = pathname.startsWith("/api/meta/");
  const isProtectedDashboard =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/tiktok") ||
    pathname.startsWith("/youtube") ||
    pathname.startsWith("/instagram") ||
    pathname.startsWith("/facebook") ||
    pathname.startsWith("/auto-reply-comment");

  if (isMetaApi && !isAuthenticated) {
    return NextResponse.json({ok:false,error:"Login is required to read stored Meta analytics."},{status:401});
  }
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
    "/dashboard/:path*", "/tiktok/:path*", "/youtube/:path*",
    "/instagram/:path*", "/facebook/:path*", "/api/meta/:path*",
    "/auto-reply-comment/:path*", "/login"
  ]
};
