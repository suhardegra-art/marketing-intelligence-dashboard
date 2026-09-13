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


  const supabaseKey:string = key;



  async function fetchAll(
    table:string
  ) {

    const response =
      await fetch(
        `${url}/rest/v1/${table}?select=*`,
        {
          headers:{
            apikey:supabaseKey
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
    allSessions,
    allLeads
  ] =
    await Promise.all([

      fetchAll(
        "tiktok_live_sessions"
      ),

      fetchAll(
        "tiktok_live_leads"
      )

    ]);



  function filterByDate(
    data:any[],
    field:string,
    start?:string,
    end?:string
  ){

    if(!start || !end){
      return data;
    }


    const startDate =
      new Date(start);


    const endDate =
      new Date(end);


    endDate.setHours(
      23,
      59,
      59,
      999
    );


    return data.filter(
      (item:any)=>{

        const itemDate =
          new Date(
            item[field]
          );


        return (
          itemDate >= startDate &&
          itemDate <= endDate
        );

      }
    );

  }



  let previousFrom = "";
  let previousTo = "";



  if(from && to){

    const start =
      new Date(from);


    const end =
      new Date(to);


    const duration =
      end.getTime() -
      start.getTime();



    const previousEnd =
      new Date(
        start.getTime() -
        86400000
      );


    const previousStart =
      new Date(
        previousEnd.getTime()
        -
        duration
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



  const sessions =
    filterByDate(
      allSessions,
      "live_date",
      from,
      to
    );


  const leads =
    filterByDate(
      allLeads,
      "lead_date",
      from,
      to
    );



  const previousSessions =
    filterByDate(
      allSessions,
      "live_date",
      previousFrom,
      previousTo
    );


  const previousLeads =
    filterByDate(
      allLeads,
      "lead_date",
      previousFrom,
      previousTo
    );



  return {

    sessions,

    leads,

    previousSessions,

    previousLeads,

    previousFrom,

    previousTo

  };

}