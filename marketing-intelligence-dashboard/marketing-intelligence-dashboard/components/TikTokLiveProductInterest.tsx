type Lead = {
  interested_model: string;
};


function formatNumber(value:number){
  return new Intl.NumberFormat("en-US")
    .format(value);
}


export default function TikTokLiveProductInterest({
  leads,
}:{
  leads:Lead[];
}){


  const productCount =
    leads.reduce(
      (acc:any, item)=>{

        const model =
          item.interested_model || "Unknown";

        acc[model] =
          (acc[model] || 0) + 1;

        return acc;

      },
      {}
    );


  const total =
    leads.length || 1;


  const products =
    Object.entries(productCount)
      .map(([name,value])=>({
        name,
        value:value as number,
        percentage:
          ((value as number)/total)*100
      }))
      .sort(
        (a,b)=>b.value-a.value
      );


  const topProduct =
    products[0];


  return (

    <section
      className="panel"
      style={{
        marginTop:16
      }}
    >

      <div className="panel-header">

        <div>

          <h3>
            Product Interest Analysis
          </h3>

          <p>
            Customer interest based on TikTok Lead Form
          </p>

        </div>

      </div>


      {
        topProduct && (

          <div
            style={{
              padding:16,
              background:"#f5f7ff",
              borderRadius:12,
              marginBottom:20
            }}
          >

            🥇 Top Interest Product:

            <strong>
              {" "}
              {topProduct.name}
            </strong>

            <br />

            <small>
              {topProduct.percentage.toFixed(1)}%
              {" "}
              of total leads
            </small>

          </div>

        )
      }


      {
        products.map((item)=>(

          <div
            key={item.name}
            style={{
              marginBottom:16
            }}
          >

            <div
              style={{
                display:"flex",
                justifyContent:"space-between",
                marginBottom:6
              }}
            >

              <span>
                {item.name}
              </span>


              <strong>
                {formatNumber(item.value)}
                {" "}
                Leads
              </strong>

            </div>


            <div
              style={{
                height:12,
                background:"#edf0f7",
                borderRadius:999
              }}
            >

              <div
                style={{
                  width:`${item.percentage}%`,
                  height:"100%",
                  background:
                    "linear-gradient(90deg,#4059d7,#8b5cf6)",
                  borderRadius:999
                }}
              />

            </div>


          </div>

        ))
      }


    </section>

  );

}