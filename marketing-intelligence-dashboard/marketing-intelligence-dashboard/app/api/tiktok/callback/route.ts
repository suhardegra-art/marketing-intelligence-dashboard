import { NextRequest, NextResponse } from "next/server";
import {
  exchangeTikTokCode,
  fetchTikTokUser,
  fetchTikTokVideos
} from "@/lib/tiktok";
import { saveTikTokInitialData } from "@/lib/supabase-admin";

function redirectWithStatus(request: NextRequest, status: string) {
  const response = NextResponse.redirect(
    new URL(`/dashboard?tiktok=${encodeURIComponent(status)}`, request.url)
  );

  response.cookies.set("tiktok_oauth_state", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });

  return response;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");
  const expectedState = request.cookies.get("tiktok_oauth_state")?.value;

  if (error) {
    console.error("TikTok authorization declined", error, errorDescription);
    return redirectWithStatus(request, "authorization_denied");
  }

  if (!code) {
    return redirectWithStatus(request, "missing_code");
  }

  if (!returnedState || !expectedState || returnedState !== expectedState) {
    return redirectWithStatus(request, "invalid_state");
  }

  try {
    const token = await exchangeTikTokCode(code);
    const user = await fetchTikTokUser(token.access_token);

    // Initial Sandbox sync: latest 20 public videos.
    // We can add full pagination + scheduled refresh after this connection test works.
    const videos = await fetchTikTokVideos(token.access_token, 1);

    await saveTikTokInitialData(token, user, videos);

    return redirectWithStatus(request, "connected");
  } catch (syncError) {
    console.error("TikTok callback/sync error", syncError);
    return redirectWithStatus(request, "sync_error");
  }
}
