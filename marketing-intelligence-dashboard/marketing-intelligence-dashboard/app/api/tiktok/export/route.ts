import { NextRequest, NextResponse } from "next/server";

function esc(v: unknown) {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}

async function getData(path: string) {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Supabase missing");

  const res = await fetch(`${url}${path}`, {
    headers: { apikey: key },
    cache: "no-store"
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function GET(req: NextRequest) {
  const params = new URL(req.url).searchParams;
  const type = params.get("type") || "filtered";
  const from = params.get("from");
  const to = params.get("to");

  try {
    const accounts = await getData(
      "/rest/v1/social_accounts?platform=eq.tiktok&select=id&limit=1"
    );
    const accountId = accounts[0]?.id;

    if (!accountId) {
      return NextResponse.json({error:"TikTok account not found"}, {status:404});
    }

    let filter =
      `/rest/v1/social_content?account_id=eq.${accountId}` +
      `&select=id,title,caption,published_at,permalink` +
      `&order=published_at.desc&limit=5000`;

    if (type === "filtered" && from) {
      filter += `&published_at=gte.${from}T00:00:00`;
    }
    if (type === "filtered" && to) {
      filter += `&published_at=lte.${to}T23:59:59`;
    }

    const content = await getData(filter);
    const ids = content.map((x:any)=>`"${x.id}"`).join(",");

    let metrics:any[]=[];
    if(ids){
      metrics = await getData(
        `/rest/v1/social_content_metrics?content_id=in.(${encodeURIComponent(ids)})&order=snapshot_date.desc&select=content_id,views,likes,comments,shares,snapshot_date`
      );
    }

    const latest = new Map();
    metrics.forEach((m:any)=>{
      if(!latest.has(m.content_id)) latest.set(m.content_id,m);
    });

    const rows = [
      ["Date","Content","Views","Likes","Comments","Shares","ER","Link"],
      ...content.map((item:any)=>{
        const m=latest.get(item.id)||{};
        const views=Number(m.views||0);
        const likes=Number(m.likes||0);
        const comments=Number(m.comments||0);
        const shares=Number(m.shares||0);
        const er=views?(((likes+comments+shares)/views)*100).toFixed(2)+"%":"0%";
        return [
          item.published_at?.slice(0,10)||"",
          item.title||item.caption||"",
          views,likes,comments,shares,er,item.permalink||""
        ];
      })
    ];

    const csv=rows.map(r=>r.map(esc).join(",")).join("\n");
    const filename = type==="all"
      ? "tiktok-content-all.csv"
      : `tiktok-content-${from||"all"}-to-${to||"all"}.csv`;

    return new NextResponse(csv,{
      headers:{
        "Content-Type":"text/csv; charset=utf-8",
        "Content-Disposition":`attachment; filename="${filename}"`
      }
    });
  } catch(e:any){
    return NextResponse.json({error:e.message},{status:500});
  }
}
