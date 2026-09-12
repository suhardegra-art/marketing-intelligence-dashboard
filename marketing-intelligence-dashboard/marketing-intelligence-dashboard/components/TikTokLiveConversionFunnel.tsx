type Props = {
  views: number;
  leads: number;
  qualified: number;
  spk: number;
};


function formatNumber(value:number){
  return new Intl.NumberFormat("en-US")
    .format(value);
}


export default function TikTokLiveConversionFunnel({
  views,
  leads,
  qualified,
  spk,
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


  const stages = [
    {
      label:"Live Viewers",
      value:views
    },
    {
      label:"Leads",
      value:leads
    },
    {
      label:"Qualified",
      value:qualified
    },
    {
      label:"SPK",
      value:spk
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

        {stages.map((item,index)=>(

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

          </div>

        ))}

      </div>


      <div
        style={{
          marginTop:20,
          fontSize:13
        }}
      >

        <p>
          Viewer → Lead:
          <b>
            {" "}
            {leadRate.toFixed(2)}%
          </b>
        </p>


        <p>
          Lead → Qualified:
          <b>
            {" "}
            {qualifiedRate.toFixed(2)}%
          </b>
        </p>


        <p>
          Qualified → SPK:
          <b>
            {" "}
            {spkRate.toFixed(2)}%
          </b>
        </p>


      </div>

    </section>
  );
}