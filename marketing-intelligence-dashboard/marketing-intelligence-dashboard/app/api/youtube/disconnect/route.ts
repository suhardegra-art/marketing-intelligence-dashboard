import { NextResponse } from "next/server";
import { deleteYouTubeConnection } from "@/lib/youtube-supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  await deleteYouTubeConnection();
  return NextResponse.redirect(new URL("/youtube?youtube_disconnected=1", request.url), 303);
}
