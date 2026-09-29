export async function getTikTokAnalyticsData(
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


  const supabaseKey: string = key;



  async function fetchTable(
    table: string
  ) {

    const response =
      await fetch(
        `${url}/rest/v1/${table}?select=*`,
        {
          headers: {
            apikey: supabaseKey
          },
          cache: "no-store"
        }
      );


    if (!response.ok) {

      throw new Error(
        await response.text()
      );

    }


    return response.json();

  }



  const [
    contents,
    metrics,
    accountMetrics
  ] =
    await Promise.all([

      fetchTable(
        "social_content"
      ),

      fetchTable(
        "social_content_metrics"
      ),

      fetchTable(
        "social_account_metrics"
      )

    ]);



  /*
   * DEFAULT PERIOD
   *
   * Jika user belum memilih tanggal,
   * gunakan 30 hari terakhir.
   */

  const today =
    new Date();


  const defaultTo =
    today
      .toISOString()
      .slice(0, 10);


  const defaultFromDate =
    new Date();


  defaultFromDate.setDate(
    defaultFromDate.getDate() - 29
  );


  const defaultFrom =
    defaultFromDate
      .toISOString()
      .slice(0, 10);


  const currentFrom =
    from || defaultFrom;


  const currentTo =
    to || defaultTo;



  /*
   * PREVIOUS PERIOD
   *
   * Panjang periode sama dengan
   * current period.
   */

  const currentStart =
    new Date(currentFrom);


  const currentEnd =
    new Date(currentTo);


  const periodLength =
    Math.floor(
      (
        currentEnd.getTime() -
        currentStart.getTime()
      ) /
      86400000
    ) + 1;



  const previousEnd =
    new Date(
      currentStart.getTime() -
      86400000
    );


  const previousStart =
    new Date(
      previousEnd.getTime() -
      (
        periodLength - 1
      ) *
      86400000
    );



  const previousFrom =
    previousStart
      .toISOString()
      .slice(0, 10);


  const previousTo =
    previousEnd
      .toISOString()
      .slice(0, 10);



  /*
   * DATE FILTER
   */

  function filterByDate(
    data: any[],
    field: string,
    start: string,
    end: string
  ) {

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
      (item: any) => {

        if (!item[field]) {
          return false;
        }


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



  /*
   * CURRENT DATA
   */

  const currentMetrics =
    filterByDate(
      metrics,
      "snapshot_date",
      currentFrom,
      currentTo
    );


  const currentAccountMetrics =
    filterByDate(
      accountMetrics,
      "metric_date",
      currentFrom,
      currentTo
    );



  /*
   * PREVIOUS DATA
   */

  const previousMetrics =
    filterByDate(
      metrics,
      "snapshot_date",
      previousFrom,
      previousTo
    );


  const previousAccountMetrics =
    filterByDate(
      accountMetrics,
      "metric_date",
      previousFrom,
      previousTo
    );



  /*
   * GROUP METRICS BY DATE
   */

  function groupMetricsByDate(
    rows: any[]
  ) {

    const grouped:
      Record<string, {
        views: number;
        likes: number;
        comments: number;
        shares: number;
      }> = {};


    rows.forEach(
      (row: any) => {

        const date =
          row.snapshot_date;


        if (!date) {
          return;
        }


        if (!grouped[date]) {

          grouped[date] = {
            views: 0,
            likes: 0,
            comments: 0,
            shares: 0
          };

        }


        grouped[date].views +=
          Number(row.views || 0);


        grouped[date].likes +=
          Number(row.likes || 0);


        grouped[date].comments +=
          Number(row.comments || 0);


        grouped[date].shares +=
          Number(row.shares || 0);

      }
    );


    return grouped;

  }



  const currentDaily =
    groupMetricsByDate(
      currentMetrics
    );


  const previousDaily =
    groupMetricsByDate(
      previousMetrics
    );



  /*
   * ACCOUNT / FOLLOWER DATA
   */

  function groupFollowersByDate(
    rows: any[]
  ) {

    const grouped:
      Record<string, number> = {};


    rows.forEach(
      (row: any) => {

        const date =
          row.metric_date;


        if (!date) {
          return;
        }


        grouped[date] =
          Number(
            row.followers || 0
          );

      }
    );


    return grouped;

  }



  const currentFollowers =
    groupFollowersByDate(
      currentAccountMetrics
    );


  const previousFollowers =
    groupFollowersByDate(
      previousAccountMetrics
    );



  /*
   * RETURN DATA
   */

  return {

    contents,

    metrics: currentMetrics,

    accountMetrics:
      currentAccountMetrics,

    previousMetrics,

    previousAccountMetrics,

    currentDaily,

    previousDaily,

    currentFollowers,

    previousFollowers,

    from: currentFrom,

    to: currentTo,

    previousFrom,

    previousTo

  };

}