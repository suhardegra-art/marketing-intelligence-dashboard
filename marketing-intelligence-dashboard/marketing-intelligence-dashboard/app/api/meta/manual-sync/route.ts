import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/session";
import { metaRows } from "@/lib/meta-store";
import { runMetaManualSync } from "@/lib/meta-sync";
import type { MetaPlatform } from "@/lib/meta-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const headers = { "Cache-Control": "no-store" };

export async function POST(request: NextRequest) {
  // No CRON_SECRET or Meta tokens are ever sent to the browser.
  const authenticated = await verifySessionToken(
    request.cookies.get("mi_session")?.value,
    process.env.SESSION_SECRET
  );
  if (!authenticated) {
    return NextResponse.json({ ok: false, error: "Login is required to run Meta sync." }, { status: 401, headers });
  }

  // Prevent a cross-site form or script from triggering paid/rate-limited Graph API calls.
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json({ ok: false, error: "Invalid request origin." }, { status: 403, headers });
  }

  const body: unknown = await request.json().catch(() => null);
  const candidate = body && typeof body === "object" && "platform" in body
    ? (body as { platform?: unknown }).platform : null;
  if (candidate !== "instagram" && candidate !== "facebook") {
    return NextResponse.json({ ok: false, error: "Choose Instagram or Facebook." }, { status: 400, headers });
  }
  const platform: MetaPlatform = candidate;

  try {
    // Protect against accidental repeated clicks and clashes with daily cron.
    const recent = await metaRows<{ status: string; started_at: string }>(
      `meta_sync_runs?platform=eq.${platform}&select=status,started_at&order=started_at.desc&limit=1`
    );
    const latest = recent[0];
    const age = latest ? Date.now() - Date.parse(latest.started_at) : Number.POSITIVE_INFINITY;
    if (latest?.status === "running" && Number.isFinite(age) && age >= 0 && age < 5 * 60_000) {
      return NextResponse.json({
        ok: false, error: `A ${platform} sync is already running. Please wait for it to finish.`
      }, { status: 409, headers });
    }

    const result = await runMetaManualSync(platform);
    if (!result.ok) {
      return NextResponse.json({ ok: false, platform, error: result.error || "Meta sync failed." },
        { status: 502, headers });
    }
    return NextResponse.json({
      ok: true, platform, partial: Boolean(result.partial), posts: result.posts,
      pages: result.pages, completedAt: new Date().toISOString()
    }, { headers });
  } catch (error) {
    console.error("Manual Meta sync failed", platform, error);
    return NextResponse.json({
      ok: false, error: "Manual sync could not complete. Check Vercel Function Logs."
    }, { status: 500, headers });
  }
}
