/** Server-side READ-ONLY bridge: Supabase → Marketing Dashboard.
 * No Meta Graph API requests or token access in this module.
 */
import { NextRequest, NextResponse } from "next/server";
import { metaConfig } from "@/lib/meta-graph";
import {
  readMetaProfile, readMetaContentPage, readMetaAccountInsights, readMetaAudience,
  type MetaPlatform, type MetaStoredContent
} from "@/lib/meta-store";

function publishTimestamp(row: MetaStoredContent): string | null {
  if (row.published_at) return row.published_at;
  return row.published_on ? `${row.published_on}T00:00:00+07:00` : null;
}
function original(row: MetaStoredContent): Record<string, any> {
  // Keep only normalized permitted fields; DO NOT forward raw_meta/raw_insights
  // because raw responses and error diagnostics belong on the server.
  const timestamp=publishTimestamp(row);
  const source=row.source_edge||"";
  if(row.platform==="instagram"){
    return {
      id:row.content_id,caption:row.caption,permalink:row.permalink,timestamp,
      media_type:row.content_type==="Carousel"?"CAROUSEL_ALBUM":"IMAGE",
      media_product_type:row.content_type==="Reel"?"REELS":row.content_type==="Story"?"STORY":"FEED",
      like_count:row.likes,comments_count:row.comments,
      thumbnail_url:row.thumbnail_url||null,
      insights:{views:row.media_views,reach:row.reach,likes:row.likes,comments:row.comments,
        shares:row.shares,saves:row.saves}
    };
  }
  return {
    id:row.content_id,message:row.caption,created_time:timestamp,
    permalink_url:row.permalink,
    content_type:row.content_type,
    source_edge:source,
    reactions:row.reactions,comments:row.comments,shares:row.shares,
    insights:{mediaViews:row.media_views,uniqueViewers:row.unique_media_viewers,
      clicks:row.clicks}
  };
}
function parseOffset(value:string|null):number{
  if(!value)return 0;
  const match=/^db:(0|[1-9][0-9]{0,6})$/.exec(value);
  if(!match)throw new Error("Invalid Supabase pagination cursor.");
  const offset=Number(match[1]);
  if(offset>1_000_000)throw new Error("Pagination offset exceeds safety limit.");
  return offset;
}
function cacheHeaders(){return {"Cache-Control":"private, no-store"};}

export async function readMetaDashboard(request:NextRequest,platform:MetaPlatform){
  let offset:number;
  try{offset=parseOffset(request.nextUrl.searchParams.get("after"));}
  catch(error){return NextResponse.json({ok:false,error:error instanceof Error?error.message:"Invalid cursor"},{status:400,headers:cacheHeaders()});}
  const input=Number(request.nextUrl.searchParams.get("limit")||"50");
  const limit=Number.isFinite(input)?Math.max(1,Math.min(50,Math.floor(input))):50;
  try{
    const config=metaConfig();
    const accountId=platform==="instagram"?config.instagramUserId:config.facebookPageId;
    const profile=await readMetaProfile(platform,accountId);
    if(!profile){
      return NextResponse.json({ok:false,source:"supabase",syncPending:true,
        error:`No ${platform} account has been synced to Supabase yet. Run the secured Meta daily sync once to initialize.`},
        {status:503,headers:cacheHeaders()});
    }
    const [{rows,hasNext}, insightRows, audienceRows]=await Promise.all([
      readMetaContentPage(platform,accountId,offset,limit),
      offset===0?readMetaAccountInsights(platform,accountId):Promise.resolve([]),
      offset===0?readMetaAudience(platform,accountId):Promise.resolve([])
    ]);
    const account={
      id:profile.account_id,name:profile.name,username:profile.username,
      followers_count:profile.followers,fan_count:profile.followers,media_count:profile.media_count,
      profile_picture_url:profile.profile_picture_url,link:profile.profile_url
    };
    const data=rows.map(original);
    const audience:Record<string,any[]>={};
    for(const item of audienceRows){
      if(audience[item.breakdown])continue; // newest per breakdown
      audience[item.breakdown] = item.status==="ok" && Array.isArray(item.raw_response?.data)
        ? item.raw_response.data : [];
    }
    const latestMetrics=new Set<string>();
    const accountInsights:Record<string,any>[]=[];
    for(const item of insightRows){
      const key=`${item.metric}:${item.period}`;
      if(latestMetrics.has(key))continue;
      latestMetrics.add(key);
      if(item.status==="ok"&&Array.isArray(item.raw_response?.data))accountInsights.push(...item.raw_response.data);
    }
    const paging={cursors:{after:hasNext?`db:${offset+data.length}`:null},hasNext,hasPrevious:offset>0};
    return NextResponse.json({ok:true,source:"supabase",syncedAt:profile.captured_at,
      ...(platform==="instagram"?{account,accountInsights:{data:accountInsights},audience,media:data}:{page:account,posts:data}),paging},
      {headers:cacheHeaders()});
  }catch(error){
    return NextResponse.json({ok:false,source:"supabase",
      error:error instanceof Error?error.message:"Unable to read stored Meta data."},
      {status:503,headers:cacheHeaders()});
  }
}
