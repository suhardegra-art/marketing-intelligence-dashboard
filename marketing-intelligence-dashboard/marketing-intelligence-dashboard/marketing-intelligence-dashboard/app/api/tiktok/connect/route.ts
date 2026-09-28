import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/session";
import { buildTikTokAuthorizeUrl } from "@/lib/tiktok";

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get("mi_session")?.value;
  const isAuthenticated = await verifySessionToken(
    sessionToken,
    process.env.SESSION_SECRET
  );

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const state = `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, "");
    const authorizeUrl = buildTikTokAuthorizeUrl(state);

    const response = NextResponse.redirect(authorizeUrl);
    response.cookies.set("tiktok_oauth_state", state, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10
    });

    return response;
  } catch (error) {
    console.error("TikTok connect error", error);
    return NextResponse.redirect(
      new URL("/dashboard?tiktok=config_error", request.url)
    );
  }
}
