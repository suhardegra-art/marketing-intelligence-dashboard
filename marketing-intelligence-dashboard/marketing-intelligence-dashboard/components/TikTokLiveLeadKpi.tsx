type Props = {
  total: number;
  qualified: number;
  spk: number;
};

export default function TikTokLiveLeadKpi({
  total,
  qualified,
  spk,
}: Props) {

  const cards = [
    {
      title: "Total Leads",
      value: total
    },
    {
      title: "Qualified Leads",
      value: qualified
    },
    {
      title: "SPK Generated",
      value: spk
    }
  ];

  return (
    <section
      style={{
        display:"grid",
        gridTemplateColumns:"repeat(3,minmax(0,1fr))",
        gap:12,
        marginTop:16
      }}
    >
      {cards.map((item)=>(
        <article
          className="kpi-card"
          key={item.title}
        >
          <p>{item.title}</p>

          <strong>
            {item.value.toLocaleString("en-US")}
          </strong>
        </article>
      ))}
    </section>
  );
}