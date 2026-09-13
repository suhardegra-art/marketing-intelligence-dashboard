type Props = {
  title: string;
  value: number;
  icon: string;
  current?: number;
  previous?: number;
};


export default function TikTokLiveKpiCard({
  title,
  value,
  icon,
  current,
  previous,
}: Props) {


  const hasComparison =
    previous !== undefined &&
    previous !== 0;


  const growth =
    hasComparison
      ? (
          ((current ?? value) - previous!)
          /
          previous!
        ) * 100
      : 0;



  return (

    <article className="kpi-card">

      <p>
        {icon} {title}
      </p>


      <strong>
        {value.toLocaleString("en-US")}
      </strong>


      {
        hasComparison && (

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

        )
      }


    </article>

  );

}