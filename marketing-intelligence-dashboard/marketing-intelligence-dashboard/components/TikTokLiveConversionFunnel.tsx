type Props = {
  views: number;
  leads: number;
  qualified: number;
  spk: number;

  previousViews?: number;
  previousLeads?: number;
  previousQualified?: number;
  previousSpk?: number;
};


function formatNumber(value:number){

  return new Intl.NumberFormat("en-US")
    .format(value);

}



function GrowthBadge({
  current,
  previous
}:{
  current:number;
  previous?:number;
}){


  if(!previous || previous === 0){
    return null;
  }


  const growth =
    ((current - previous) / previous) * 100;


  return (

    <small
      style={{
        color:
          growth >= 0
          ? "#16a34a"
          : "#dc2626",
        fontWeight:600
      }}
    >

      {growth >= 0 ? "↑" : "↓"}
      {" "}
      {Math.abs(growth).toFixed(1)}%

    </small>

  );

}



export default function TikTokLiveConversionFunnel({

  views,
  leads,
  qualified,
  spk,

  previousViews,
  previousLeads,
  previousQualified,
  previousSpk,

}:Props){



  const leadRate =
    views > 0
      ? (leads / views) * 100
      : 0;



  const qualifiedRate =
    leads > 0
      ? (qualified / leads) * 100
      : 0;



  const spkRate =
    qualified > 0
      ? (spk / qualified) * 100
      : 0;



  const previousLeadRate =
    previousViews && previousViews > 0
      ? (previousLeads || 0) / previousViews * 100
      : 0;



  const previousQualifiedRate =
    previousLeads && previousLeads > 0
      ? (previousQualified || 0) / previousLeads * 100
      : 0;



  const previousSpkRate =
    previousQualified && previousQualified > 0
      ? (previousSpk || 0) / previousQualified * 100
      : 0;



  const stages = [

    {
      label:"Live Viewers",
      value:views,
      previous:previousViews
    },

    {
      label:"Leads",
      value:leads,
      previous:previousLeads
    },

    {
      label:"Qualified",
      value:qualified,
      previous:previousQualified
    },

    {
      label:"SPK",
      value:spk,
      previous:previousSpk
    }

  ];



  return (

    <section
      className="panel"
      style={{
        marginTop:16
      }}
    >


      <h3>
        Live Conversion Funnel
      </h3>


      <p>
        Audience to sales conversion performance
      </p>



      <div
        style={{
          display:"grid",
          gridTemplateColumns:"repeat(4,1fr)",
          gap:12,
          marginTop:20
        }}
      >

        {
          stages.map((item)=>(

            <div
              key={item.label}
              className="kpi-card"
            >

              <p>
                {item.label}
              </p>


              <strong>
                {formatNumber(item.value)}
              </strong>


              <GrowthBadge
                current={item.value}
                previous={item.previous}
              />

            </div>

          ))
        }

      </div>



      <div
        style={{
          marginTop:20,
          fontSize:13
        }}
      >

        <p>
          Viewer → Lead:
          {" "}
          <b>
            {leadRate.toFixed(2)}%
          </b>

          {" "}

          <GrowthBadge
            current={leadRate}
            previous={previousLeadRate}
          />

        </p>



        <p>
          Lead → Qualified:
          {" "}
          <b>
            {qualifiedRate.toFixed(2)}%
          </b>

          {" "}

          <GrowthBadge
            current={qualifiedRate}
            previous={previousQualifiedRate}
          />

        </p>



        <p>
          Qualified → SPK:
          {" "}
          <b>
            {spkRate.toFixed(2)}%
          </b>

          {" "}

          <GrowthBadge
            current={spkRate}
            previous={previousSpkRate}
          />

        </p>


      </div>


    </section>

  );

}