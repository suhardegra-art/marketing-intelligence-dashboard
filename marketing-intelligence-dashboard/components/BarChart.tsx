type Bar = { label: string; value: number; display: string };

export default function BarChart({ data, max = 100 }: { data: Bar[]; max?: number }) {
  return (
    <div className="bar-chart">
      {data.map((item) => (
        <div className="bar-row" key={item.label}>
          <span className="bar-label">{item.label}</span>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.min((item.value / max) * 100, 100)}%` }} /></div>
          <strong>{item.display}</strong>
        </div>
      ))}
    </div>
  );
}
