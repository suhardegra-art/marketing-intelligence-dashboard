import { NextRequest, NextResponse } from "next/server";
import { metaConfig } from "@/lib/meta-graph";
import {
  readMetaHistory, readMetaAllTimeTop, readMetaCoverage, metaRows,
  type MetaIngestCursor, type MetaPlatform
} from "@/lib/meta-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const input=request.nextUrl.searchParams.get("platform");
  if(input!=="instagram"&&input!=="facebook") return NextResponse.json({ok:false,error:"Choose instagram or facebook."},{status:400});
  const platform:MetaPlatform=input;
  try{
    const config=metaConfig();
    const accountId=platform==="instagram"?config.instagramUserId:config.facebookPageId;
    const [history,top,count,edges]=await Promise.all([
      readMetaHistory(platform,accountId),readMetaAllTimeTop(platform,accountId),
      readMetaCoverage(platform,accountId),
      metaRows<MetaIngestCursor>(`meta_ingest_cursors?platform=eq.${platform}&account_id=eq.${encodeURIComponent(accountId)}&select=*&order=edge.asc`)
    ]);
    const expected=platform==="instagram"?["media"]:["posts","videos","photos"];
    const complete=expected.every(edge=>edges.find(state=>state.edge===edge)?.initial_complete);
    const failure=edges.find(row=>row.last_error);
    const lastSync=edges.map(row=>row.last_synced_at).filter((s):s is string=>Boolean(s)).sort().at(-1)||null;
    return NextResponse.json({ok:true,source:"supabase",platform,history,top,
      coverage:{scanned:count,complete,lastSync,lastError:failure?.last_error||null,
        sources:expected.map(edge=>({edge,complete:Boolean(edges.find(row=>row.edge===edge)?.initial_complete),
          lastError:edges.find(row=>row.edge===edge)?.last_error||null}))}},
      {headers:{"Cache-Control":"private, no-store"}});
  }catch(error){return NextResponse.json({ok:false,source:"supabase",
    error:error instanceof Error?error.message:"Unable to read Meta snapshots."},
    {status:503,headers:{"Cache-Control":"private, no-store"}});}
}
