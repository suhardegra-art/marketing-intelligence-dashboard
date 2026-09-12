import type {
  GrowthMetric,
  GrowthPoint,
  TikTokGrowthData
} from "@/lib/tiktok-growth";

function compact(value: number | null) {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

function signedCompact(value: number | null) {
  if (value === null) return "—";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${compact(value)}`;
}

function formatPercent(value: number | null) {
  if (value === null || !Number.isFinite(value)) return null;
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)}%`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short"
  }).format(new Date(`${value}T00:00:00Z`));
}

function buildPath(
  values: GrowthPoint[],
  min: number,
  max: number,
  width: number,
  height: number
) {
  if (values.length === 0) return "";

  const range = Math.max(max - min, 1);

  return values
    .map((point, index) => {
      const x =
        values.length === 1
          ? width / 2
          : (index / (values.length - 1)) * width;
      const y = height - ((point.value - min) / range) * height;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

function MiniChart({
  current,
  previous,
  comparison
}: {
  current: GrowthPoint[];
  previous: GrowthPoint[];
  comparison: boolean;
}) {
  const width = 250;
  const height = 74;

  const allValues = [
    ...current.map((point) => point.value),
    ...(comparison ? previous.map((point) => point.value) : [])
  ];

  if (allValues.length === 0) {
    return (
      <div
        style={{
          height,
          display: "grid",
          placeItems: "center",
          color: "#9aa2b7",
          fontSize: 10
        }}
      >
        Historical data not available yet
      </div>
    );
  }

  const min = Math.min(...allValues);
  const max = Math.max(...allValues);

  const currentPath = buildPath(current, min, max, width, height);
  const previousPath = buildPath(previous, min, max, width, height);

  const labels =
    current.length > 0
      ? [
          current[0]?.date,
          current[Math.floor((current.length - 1) / 2)]?.date,
          current[current.length - 1]?.date
        ].filter(Boolean)
      : [];

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        role="img"
        aria-label="TikTok growth trend"
        style={{ overflow: "visible" }}
      >
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line
            key={ratio}
            x1="0"
            x2={width}
            y1={height * ratio}
            y2={height * ratio}
            stroke="#eef0f6"
            strokeWidth="1"
          />
        ))}

        {comparison && previousPath ? (
          <path
            d={previousPath}
            fill="none"
            stroke="#c8ccef"
            strokeWidth="2"
            strokeDasharray="5 4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {currentPath ? (
          <path
            d={currentPath}
            fill="none"
            stroke="#5867e8"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {current.map((point, index) => {
          if (
            index !== 0 &&
            index !== current.length - 1 &&
            index !== Math.floor((current.length - 1) / 2)
          ) {
            return null;
          }

          const range = Math.max(max - min, 1);
          const x =
            current.length === 1
              ? width / 2
              : (index / (current.length - 1)) * width;
          const y = height - ((point.value - min) / range) * height;

          return (
            <circle
              key={`${point.date}-${index}`}
              cx={x}
              cy={y}
              r="2.5"
              fill="#5867e8"
            />
          );
        })}
      </svg>

      {labels.length > 0 ? (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            color: "#9aa2b7",
            fontSize: 8,
            marginTop: 3
          }}
        >
          {labels.map((label) => (
            <span key={label}>{formatDate(label)}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MetricCard({
  metric,
  mode
}: {
  metric: GrowthMetric;
  mode: TikTokGrowthData["mode"];
}) {
  const comparison = mode === "comparison";
  const growthPercent = comparison
    ? formatPercent(metric.comparisonPercent)
    : formatPercent(metric.periodChangePercent);

  const growthPositive =
    comparison
      ? (metric.comparisonPercent ?? 0) >= 0
      : (metric.periodChangePercent ?? 0) >= 0;

  const primary =
    metric.key === "followers"
      ? compact(metric.primaryValue)
      : signedCompact(metric.primaryValue);

  return (
    <article
      style={{
        minWidth: 190,
        background: "#fff",
        border: "1px solid #e8ebf5",
        borderRadius: 14,
        padding: "14px 14px 12px",
        boxShadow: "0 4px 14px rgba(44,55,100,.04)"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          alignItems: "flex-start",
          marginBottom: 5
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 900,
              color: "#252d48"
            }}
          >
            {metric.title}
          </div>

          <div
            style={{
              fontSize: 22,
              lineHeight: 1.15,
              fontWeight: 900,
              color: "#141b34",
              marginTop: 6
            }}
          >
            {primary}
          </div>
        </div>

        {growthPercent ? (
          <div
            style={{
              color: growthPositive ? "#17a873" : "#d84d5b",
              fontWeight: 900,
              fontSize: 10,
              whiteSpace: "nowrap"
            }}
          >
            {growthPositive ? "↑" : "↓"} {growthPercent}
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 9,
          color: "#8c94aa",
          fontSize: 8
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#5867e8"
            }}
          />
          {comparison ? "Current" : "Last 30 Days"}
        </span>

        {comparison ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#c8ccef"
              }}
            />
            Previous
          </span>
        ) : null}
      </div>

      <MiniChart
        current={metric.currentSeries}
        previous={metric.previousSeries}
        comparison={comparison && metric.previousAvailable}
      />

      {comparison && !metric.previousAvailable ? (
        <div
          style={{
            marginTop: 7,
            color: "#9aa2b7",
            fontSize: 8
          }}
        >
          Previous period data unavailable
        </div>
      ) : null}
    </article>
  );
}

export default function TikTokGrowthComparison({
  data
}: {
  data: TikTokGrowthData | null;
}) {
  if (!data) {
    return (
      <section
        className="panel"
        style={{
          marginBottom: 16,
          border: "1px solid #dde2f5"
        }}
      >
        <div className="panel-header">
          <div>
            <h3>TikTok Growth Comparison</h3>
            <p>Historical growth data will appear after daily snapshots accumulate.</p>
          </div>
        </div>
      </section>
    );
  }

  const modeLabel =
    data.mode === "trend"
      ? `Last 30 Days • ${formatDate(data.currentFrom)} – ${formatDate(
          data.currentTo
        )}`
      : `${formatDate(data.currentFrom)} – ${formatDate(
          data.currentTo
        )} vs ${formatDate(data.previousFrom!)} – ${formatDate(
          data.previousTo!
        )}`;

  return (
    <section
      style={{
        background: "#f9faff",
        border: "1px solid #dce2ff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        boxShadow: "0 6px 18px rgba(72,84,165,.05)"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          alignItems: "flex-start",
          marginBottom: 14
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              color: "#141b34"
            }}
          >
            TikTok Growth Comparison
          </h3>
          <p
            style={{
              margin: "4px 0 0",
              color: "#838ca5",
              fontSize: 10
            }}
          >
            {data.mode === "trend"
              ? "Default trend view for the latest available 30 days."
              : "Selected date range compared automatically with the previous period of equal length."}
          </p>
        </div>

        <div
          style={{
            background: "#fff",
            border: "1px solid #e2e6f4",
            borderRadius: 10,
            padding: "8px 10px",
            color: "#5f6881",
            fontSize: 9,
            fontWeight: 800,
            whiteSpace: "nowrap"
          }}
        >
          {modeLabel}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5,minmax(190px,1fr))",
          gap: 10,
          overflowX: "auto",
          paddingBottom: 2
        }}
      >
        {data.metrics.map((metric) => (
          <MetricCard key={metric.key} metric={metric} mode={data.mode} />
        ))}
      </div>

      {data.snapshotCount < 2 ? (
        <p
          style={{
            margin: "10px 0 0",
            color: "#9aa2b7",
            fontSize: 9
          }}
        >
          Only {data.snapshotCount} daily snapshot is available so far. The
          charts will become more meaningful automatically as daily history
          accumulates.
        </p>
      ) : null}
    </section>
  );
}
