import { NextRequest, NextResponse } from "next/server";

function esc(v: unknown) {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}

async function getData(path: string) {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new Error("Supabase missing");
  }

  const res = await fetch(`${url}${path}`, {
    headers: {
      apikey: key
    },
    cache: "no-store"
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

function chunkArray<T>(array: T[], size: number) {
  const chunks: T[][] = [];

  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }

  return chunks;
}

export async function GET(req: NextRequest) {
  const params = new URL(req.url).searchParams;

  const type = params.get("type") || "filtered";
  const from = params.get("from");
  const to = params.get("to");

  try {
    // Get TikTok account
    const accounts = await getData(
      "/rest/v1/social_accounts?platform=eq.tiktok&select=id&limit=1"
    );

    const accountId = accounts[0]?.id;

    if (!accountId) {
      return NextResponse.json(
        {
          error: "TikTok account not found"
        },
        {
          status: 404
        }
      );
    }


    // Get content
    let filter =
      `/rest/v1/social_content?account_id=eq.${accountId}` +
      "&select=id,title,caption,published_at,permalink" +
      "&order=published_at.desc" +
      "&limit=10000";


    if (type === "filtered" && from) {
      filter += `&published_at=gte.${from}T00:00:00`;
    }

    if (type === "filtered" && to) {
      filter += `&published_at=lte.${to}T23:59:59`;
    }


    const content = await getData(filter);


    console.log("TikTok export:", {
      type,
      from,
      to,
      totalContent: content.length
    });


    // Get metrics in batches
    const ids = content.map((item: any) => item.id);

    let metrics: any[] = [];

    const batches = chunkArray(ids, 100);


    for (const batch of batches) {

      const idQuery = batch
        .map((id) => `"${id}"`)
        .join(",");


      const batchMetrics = await getData(
        `/rest/v1/social_content_metrics` +
        `?content_id=in.(${encodeURIComponent(idQuery)})` +
        "&order=snapshot_date.desc" +
        "&select=content_id,views,likes,comments,shares,snapshot_date"
      );


      metrics = [
        ...metrics,
        ...batchMetrics
      ];
    }


    console.log("Metrics loaded:", metrics.length);



    // Get latest metric per content
    const latest = new Map();


    metrics.forEach((item: any) => {

      if (!latest.has(item.content_id)) {
        latest.set(item.content_id, item);
      }

    });



    const rows = [
      [
        "Date",
        "Content",
        "Views",
        "Likes",
        "Comments",
        "Shares",
        "ER",
        "Link"
      ],

      ...content.map((item: any) => {

        const metric = latest.get(item.id) || {};

        const views = Number(metric.views || 0);
        const likes = Number(metric.likes || 0);
        const comments = Number(metric.comments || 0);
        const shares = Number(metric.shares || 0);


        const er = views
          ? (((likes + comments + shares) / views) * 100)
              .toFixed(2) + "%"
          : "0%";


        return [
          item.published_at?.slice(0,10) || "",
          item.title || item.caption || "",
          views,
          likes,
          comments,
          shares,
          er,
          item.permalink || ""
        ];

      })
    ];



    const csv = rows
      .map((row) =>
        row.map(esc).join(",")
      )
      .join("\n");



    const filename =
      type === "all"
        ? "tiktok-content-all.csv"
        : `tiktok-content-${from || "all"}-to-${to || "all"}.csv`;



    return new NextResponse(csv, {

      headers: {

        "Content-Type":
          "text/csv; charset=utf-8",

        "Content-Disposition":
          `attachment; filename="${filename}"`

      }

    });


  } catch (error: any) {

    console.error(
      "TikTok export error:",
      error
    );


    return NextResponse.json(
      {
        error: error.message
      },
      {
        status: 500
      }
    );

  }
}