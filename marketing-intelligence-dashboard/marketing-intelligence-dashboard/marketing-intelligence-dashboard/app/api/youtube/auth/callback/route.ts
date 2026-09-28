import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { exchangeYouTubeCode } from "@/lib/youtube-oauth";
import { getMyYouTubeChannel } from "@/lib/youtube-google";
import {
  saveYouTubeChannelSnapshot,
  saveYouTubeConnection
} from "@/lib/youtube-supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const fallbackBase = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

  try {
    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    const oauthError = request.nextUrl.searchParams.get("error");
    const cookieStore = await cookies();
    const expectedState = cookieStore.get("youtube_oauth_state")?.value;

    if (oauthError) throw new Error(`Google OAuth error: ${oauthError}`);
    if (!code) throw new Error("Google OAuth did not return an authorization code.");
    if (!state || !expectedState || state !== expectedState) {
      throw new Error("YouTube OAuth state verification failed.");
    }

    const token = await exchangeYouTubeCode(code);
    const channel = await getMyYouTubeChannel(token.access_token);

    await saveYouTubeConnection({
      externalAccountId: channel.id,
      accessToken: token.access_token,
      refreshToken: token.refresh_token ?? null,
      expiresIn: token.expires_in ?? null,
      scopes: token.scope ? token.scope.split(" ").filter(Boolean) : [],
      tokenType: token.token_type ?? "Bearer"
    });

    await saveYouTubeChannelSnapshot({
      channelId: channel.id,
      channelName: channel.title,
      handle: channel.handle,
      channelUrl: channel.channelUrl,
      subscribers: channel.subscribers,
      totalViews: channel.totalViews,
      totalVideos: channel.totalVideos
    });

    cookieStore.delete("youtube_oauth_state");

    return NextResponse.redirect(new URL("/youtube?youtube_connected=1", fallbackBase));
  } catch (error) {
    const message = error instanceof Error ? error.message : "YouTube OAuth callback failed.";
    return NextResponse.redirect(
      new URL(`/youtube?youtube_error=${encodeURIComponent(message)}`, fallbackBase)
    );
  }
}
