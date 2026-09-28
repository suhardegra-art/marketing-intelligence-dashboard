type Props = {
  total:number;
  qualified:number;
  spk:number;

  previousTotal?:number;
  previousQualified?:number;
  previousSpk?:number;
};


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

      <span
        style={{
          color:"#9ca3af",
          marginLeft:5,
          fontWeight:400
        }}
      >
        vs previous period
      </span>

    </small>

  );

}



export default function TikTokLiveLeadKpi({
  total,
  qualified,
  spk,
  previousTotal,
  previousQualified,
  previousSpk,
}:Props){


  const cards = [

    {
      title:"Total Leads",
      value:total,
      previous:previousTotal
    },

    {
      title:"Qualified Leads",
      value:qualified,
      previous:previousQualified
    },

    {
      title:"SPK Generated",
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
        TikTok Lead Generation Performance
      </h3>


      <div
        style={{
          display:"grid",
          gridTemplateColumns:
            "repeat(3,minmax(0,1fr))",
          gap:12
        }}
      >

        {
          cards.map(
            (item)=>(

              <div
                className="kpi-card"
                key={item.title}
              >

                <p>
                  {item.title}
                </p>


                <strong>
                  {item.value.toLocaleString()}
                </strong>


                <GrowthBadge
                  current={item.value}
                  previous={item.previous}
                />

              </div>

            )
          )
        }

      </div>


    </section>

  );

}