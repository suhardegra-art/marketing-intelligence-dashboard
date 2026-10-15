import { NextRequest, NextResponse } from "next/server";
import { runMetaDailySync } from "@/lib/meta-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ ok: false, error: "CRON_SECRET is not configured." }, { status: 500 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }
  const results = await runMetaDailySync();
  return NextResponse.json({ ...results, scheduledTime: "08:00 WIB", executedAt: new Date().toISOString() },
    { status: results.ok ? 200 : 500 });
}
