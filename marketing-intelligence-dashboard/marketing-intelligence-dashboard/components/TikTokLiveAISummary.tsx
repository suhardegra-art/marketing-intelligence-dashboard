type Props = {
  sessions: any[];
  leads: any[];
};


export default function TikTokLiveAISummary({
  sessions,
  leads,
}: Props) {


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
          (acc[model] || 0) + 1;

        return acc;

      },
      {}
    );


  const topProduct =
    Object.entries(productCount)
      .sort(
        (a:any,b:any)=>b[1]-a[1]
      )[0];


  return (

    <section
      className="panel"
      style={{
        marginTop:16
      }}
    >

      <h3>
        🤖 AI Performance Summary
      </h3>


      <p>
        Based on TikTok Live performance,
        engagement, leads, and product interest.
      </p>


      <div
        style={{
          marginTop:16,
          lineHeight:1.8
        }}
      >

        {
          bestSession && (

            <p>
              📈 Best Live Performance:
              {" "}
              <b>
                {bestSession.live_date}
              </b>
              {" "}
              generated
              {" "}
              <b>
                {Number(bestSession.views).toLocaleString()}
              </b>
              {" "}
              views.
            </p>

          )
        }


        {
          topProduct && (

            <p>
              🏆 Highest Product Interest:
              {" "}
              <b>
                {topProduct[0]}
              </b>
              {" "}
              with
              {" "}
              <b>
                {topProduct[1]}
              </b>
              {" "}
              leads.
            </p>

          )
        }


        <p>
          💡 Recommendation:
          Improve product CTA and repeat
          the content approach from the
          highest performing live session.
        </p>


      </div>


    </section>

  );

}