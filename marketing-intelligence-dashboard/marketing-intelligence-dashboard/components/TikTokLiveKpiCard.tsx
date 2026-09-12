type Props = {
  title: string;
  value: string | number;
  icon?: string;
};

export default function TikTokLiveKpiCard({
  title,
  value,
  icon = "●",
}: Props) {
  return (
    <article className="kpi-card">
      <p>
        {icon} {title}
      </p>

      <strong>
        {Number(value).toLocaleString("en-US")}
      </strong>

      <small style={{ color: "#16a34a" }}>
        ↑ Live Performance
      </small>
    </article>
  );
}