export async function getTikTokLiveData(
  from?: string,
  to?: string
) {

  const url =
    process.env.SUPABASE_URL?.replace(/\/$/, "");

  const key =
    process.env.SUPABASE_SECRET_KEY;


  if (!url || !key) {
    throw new Error("Supabase missing");
  }


  let sessionQuery =
    "/rest/v1/tiktok_live_sessions?select=*";


  let leadQuery =
    "/rest/v1/tiktok_live_leads?select=*";


  if (from) {
    sessionQuery +=
      `&live_date=gte.${from}`;

    leadQuery +=
      `&lead_date=gte.${from}`;
  }


  if (to) {
    sessionQuery +=
      `&live_date=lte.${to}`;

    leadQuery +=
      `&lead_date=lte.${to}`;
  }


  const [sessionsRes, leadsRes] =
    await Promise.all([

      fetch(
        `${url}${sessionQuery}`,
        {
          headers:{
            apikey:key
          },
          cache:"no-store"
        }
      ),


      fetch(
        `${url}${leadQuery}`,
        {
          headers:{
            apikey:key
          },
          cache:"no-store"
        }
      )

    ]);


  if(!sessionsRes.ok){
    throw new Error(
      await sessionsRes.text()
    );
  }


  if(!leadsRes.ok){
    throw new Error(
      await leadsRes.text()
    );
  }


  return {
    sessions:
      await sessionsRes.json(),

    leads:
      await leadsRes.json()
  };

}