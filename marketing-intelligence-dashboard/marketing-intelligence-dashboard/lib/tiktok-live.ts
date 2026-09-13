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



  let previousFrom = "";
  let previousTo = "";



  if (from && to) {

    const start =
      new Date(from);

    const end =
      new Date(to);



    const duration =
      end.getTime() -
      start.getTime();



    const previousEnd =
      new Date(
        start.getTime() - 86400000
      );


    const previousStart =
      new Date(
        previousEnd.getTime() - duration
      );



    previousFrom =
      previousStart
        .toISOString()
        .slice(0,10);


    previousTo =
      previousEnd
        .toISOString()
        .slice(0,10);

  }



  async function fetchData(
    table:string,
    dateField:string,
    startDate?:string,
    endDate?:string
  ) {


    let query =
      `/rest/v1/${table}?select=*`;



    if(startDate){

      query +=
        `&${dateField}=gte.${startDate}`;

    }



    if(endDate){

      query +=
        `&${dateField}=lte.${endDate}`;

    }



    const response =
      await fetch(
        `${url}${query}`,
        {
          headers:{
            apikey:key
          },
          cache:"no-store"
        }
      );



    if(!response.ok){

      throw new Error(
        await response.text()
      );

    }



    return response.json();

  }



  const [
    sessions,
    leads,
    previousSessions,
    previousLeads
  ] =
  await Promise.all([


    // CURRENT PERIOD

    fetchData(
      "tiktok_live_sessions",
      "live_date",
      from,
      to
    ),


    fetchData(
      "tiktok_live_leads",
      "lead_date",
      from,
      to
    ),



    // PREVIOUS PERIOD

    fetchData(
      "tiktok_live_sessions",
      "live_date",
      previousFrom,
      previousTo
    ),


    fetchData(
      "tiktok_live_leads",
      "lead_date",
      previousFrom,
      previousTo
    )

  ]);



  return {

    sessions,

    leads,

    previousSessions,

    previousLeads,

    previousFrom,

    previousTo

  };

}