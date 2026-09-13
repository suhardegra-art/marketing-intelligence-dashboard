type Props = {
  sessions:any[];
  leads:any[];
};


export default function TikTokLiveAIRecommendation({
  sessions,
  leads,
}:Props){


  const bestSession =
    [...sessions]
      .sort(
        (a,b)=>
          Number(b.views || 0) -
          Number(a.views || 0)
      )[0];


  const productCount =
    leads.reduce(
      (acc:any,item:any)=>{

        const model =
          item.interested_model || "Unknown";

        acc[model] =
          (acc[model] || 0)+1;

        return acc;

      },
      {}
    );


  const topProduct =
    Object.entries(productCount)
      .sort(
        (a:any,b:any)=>b[1]-a[1]
      )[0];


  const recommendations = [];


  if(bestSession){

    recommendations.push(
      `Maintain the successful live format from ${bestSession.live_date} because it generated ${Number(bestSession.views).toLocaleString()} views.`
    );

  }


  if(topProduct){

    recommendations.push(
      `Focus product promotion on ${topProduct[0]} because it has the highest customer interest.`
    );

  }


  if(leads.length > 0){

    recommendations.push(
      "Improve CTA placement during live session to increase lead conversion."
    );

  }


  return (

    <section
      className="panel"
      style={{
        marginTop:16
      }}
    >

      <h3>
        🤖 AI Marketing Recommendation
      </h3>


      <p>
        Action recommendation based on
        live performance data.
      </p>


      <div
        style={{
          marginTop:16,
          lineHeight:1.8
        }}
      >

        {
          recommendations.map(
            (item,index)=>(

              <p key={index}>
                💡 {item}
              </p>

            )
          )
        }


      </div>


    </section>

  );

}