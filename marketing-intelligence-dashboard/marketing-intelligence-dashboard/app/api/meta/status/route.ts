import { NextResponse } from "next/server";
import { metaConfig } from "@/lib/meta-graph";
import { readMetaProfile, metaRows, type MetaIngestCursor } from "@/lib/meta-store";
export const dynamic="force-dynamic";
export const runtime="nodejs";
// Supabase status: "connected" means STORED DATA exists, not Graph-token validity.
export async function GET(){
  try{
    const {version,instagramUserId,facebookPageId}=metaConfig();
    const [instagram,facebook,igEdges,fbEdges]=await Promise.all([
      readMetaProfile("instagram",instagramUserId),readMetaProfile("facebook",facebookPageId),
      metaRows<MetaIngestCursor>(`meta_ingest_cursors?platform=eq.instagram&account_id=eq.${encodeURIComponent(instagramUserId)}&select=*`),
      metaRows<MetaIngestCursor>(`meta_ingest_cursors?platform=eq.facebook&account_id=eq.${encodeURIComponent(facebookPageId)}&select=*`)
    ]);
    const allComplete=(edges:MetaIngestCursor[],expected:string[])=>expected.every(edge=>edges.find(r=>r.edge===edge)?.initial_complete);
    return NextResponse.json({ok:Boolean(instagram&&facebook),source:"supabase",graphVersion:version,
      instagram:{connected:Boolean(instagram),id:instagramUserId,username:instagram?.username||null,
        followers:instagram?.followers??null,lastSyncedAt:instagram?.captured_at||null,historyComplete:allComplete(igEdges,["media"])},
      facebook:{connected:Boolean(facebook),id:facebookPageId,name:facebook?.name||null,
        followers:facebook?.followers??null,lastSyncedAt:facebook?.captured_at||null,historyComplete:allComplete(fbEdges,["posts","videos","photos"])}},
      {headers:{"Cache-Control":"private, no-store"}});
  }catch(error){return NextResponse.json({ok:false,source:"supabase",
    error:error instanceof Error?error.message:"DB sync not configured"},
    {status:503,headers:{"Cache-Control":"private, no-store"}});}
}
