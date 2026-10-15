import { NextRequest, NextResponse } from "next/server";
import { runMetaBackfillSync } from "@/lib/meta-sync";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
/** Background historical scan and cyclic lifetime-metric refresh. */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ok:false,error:"CRON_SECRET is not configured."},{status:500});
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ok:false,error:"Unauthorized."},{status:401});
  }
  try {
    const result = await runMetaBackfillSync();
    return NextResponse.json({...result,mode:"supabase_ingestion_backfill",executedAt:new Date().toISOString()},
      {status:result.ok?200:500});
  } catch (error) {
    return NextResponse.json({ok:false,error:error instanceof Error?error.message:"Meta backfill failed"},
      {status:500});
  }
}
