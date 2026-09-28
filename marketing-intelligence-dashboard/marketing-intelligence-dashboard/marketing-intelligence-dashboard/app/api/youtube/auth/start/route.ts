import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { buildYouTubeAuthorizationUrl } from "@/lib/youtube-oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const state = randomUUID();
    const cookieStore = await cookies();

    cookieStore.set("youtube_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60
    });

    return NextResponse.redirect(buildYouTubeAuthorizationUrl(state));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start YouTube OAuth.";
    const base = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    return NextResponse.redirect(
      new URL(`/youtube?youtube_error=${encodeURIComponent(message)}`, base)
    );
  }
}
