type KpiCardProps = {
  label: string;
  value: string;
  change: string;
  positive?: boolean;
  accent?: string;
};

export default function KpiCard({ label, value, change, positive = true, accent = "blue" }: KpiCardProps) {
  return (
    <article className={`kpi-card kpi-${accent}`}>
      <p>{label}</p>
      <strong>{value}</strong>
      <span className={positive ? "positive" : "negative"}>{positive ? "↑" : "↓"} {change}</span>
    </article>
  );
}
