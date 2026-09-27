"use client";

import {
  useEffect,
  useMemo,
  useState
} from "react";

import { useRouter } from "next/navigation";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import type {
  AnnualBigEvent,
  AnnualBigEventData
} from "@/lib/annual-big-event";

import styles from "../AnnualBigEvent.module.css";

type ViewKey = "data" | "ai";

type AIAnalysis = {
  executive_summary: string;
  key_insights: Array<{
    title: string;
    detail: string;
  }>;
  recommendations: string[];
  data_quality: string[];
  confidence_note: string;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(
    Math.round(value)
  );
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Math.round(value));
}

function formatDate(value: string) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta"
  }).format(new Date(value));
}

function pct(value: number) {
  return `${value.toFixed(1)}%`;
}

function csvEscape(value: string | number) {
  const raw = String(value ?? "");
  return /[",\n]/.test(raw)
    ? `"${raw.replace(/"/g, '""')}"`
    : raw;
}

function exportCsv(events: AnnualBigEvent[]) {
  const header = [
    "Tanggal",
    "Nama Event",
    "Status",
    "Kota",
    "Location",
    "Finished event",
    "Activity",
    "Luas Lahan",
    "Media Posting",
    "Foot Traffic",
    "Test Ride",
    "SPK",
    "Budget",
    "SPP Link",
    "Quotation"
  ];

  const body = events.map((event) => [
    event.startDate,
    event.eventName,
    event.status,
    event.city,
    event.location,
    event.endDate,
    event.activity,
    event.area,
    event.mediaPosting,
    event.footTraffic,
    event.testRide,
    event.totalSpk,
    event.totalBudget,
    event.sppLink || "",
    event.quotationLink || ""
  ]);

  const csv = [header, ...body]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");

  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8"
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "annual-big-event-data.csv";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function buildModelData(events: AnnualBigEvent[]) {
  const map = new Map<string, number>();

  events.forEach((event) => {
    event.spkBreakdown.forEach((item) => {
      map.set(
        item.model,
        (map.get(item.model) || 0) + item.qty
      );
    });
  });

  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function buildBudgetData(events: AnnualBigEvent[]) {
  const map = new Map<string, number>();

  events.forEach((event) => {
    event.budgetBreakdown.forEach((item) => {
      map.set(
        item.category,
        (map.get(item.category) || 0) + item.amount
      );
    });
  });

  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function buildCityData(events: AnnualBigEvent[]) {
  const map = new Map<string, number>();

  events.forEach((event) => {
    const city = event.city || "Unknown";
    map.set(city, (map.get(city) || 0) + event.totalSpk);
  });

  return [...map.entries()]
    .map(([city, spk]) => ({ city, spk }))
    .sort((a, b) => b.spk - a.spk);
}

const PIE_COLORS = [
  "#4f6ee8",
  "#34b8b3",
  "#8e78e8",
  "#f46a5e",
  "#6b9df5",
  "#c965d3",
  "#f3a64a",
  "#7cc787",
  "#7f8aa8",
  "#4059d7"
];

export default function AnnualBigEventDashboard({
  initialData
}: {
  initialData: AnnualBigEventData;
}) {
  const router = useRouter();

  const [view, setView] = useState<ViewKey>("data");
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("ALL");
  const [city, setCity] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [selected, setSelected] =
    useState<AnnualBigEvent | null>(null);

  const [ai, setAi] = useState<AIAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiVersion, setAiVersion] = useState("");

  useEffect(() => {
    if (!initialData.connected || !initialData.dataVersion) return;

    let cancelled = false;

    const timer = window.setInterval(async () => {
      try {
        const response = await fetch("/api/annual-big-event/data", {
          cache: "no-store"
        });

        if (!response.ok) return;

        const latest = (await response.json()) as AnnualBigEventData;

        if (
          !cancelled &&
          latest.dataVersion &&
          latest.dataVersion !== initialData.dataVersion
        ) {
          router.refresh();
        }
      } catch {
        // Silent: auto-check must not interrupt the page.
      }
    }, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [
    initialData.connected,
    initialData.dataVersion,
    router
  ]);

  const years = useMemo(
    () =>
      Array.from(
        new Set(
          initialData.events
            .map((event) => event.year)
            .filter((value): value is number => Boolean(value))
        )
      ).sort((a, b) => b - a),
    [initialData.events]
  );

  const cities = useMemo(
    () =>
      Array.from(
        new Set(
          initialData.events
            .map((event) => event.city)
            .filter(Boolean)
        )
      ).sort(),
    [initialData.events]
  );

  const statuses = useMemo(
    () =>
      Array.from(
        new Set(
          initialData.events
            .map((event) => event.status)
            .filter(Boolean)
        )
      ).sort(),
    [initialData.events]
  );

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return initialData.events.filter((event) => {
      const matchesSearch =
        !query ||
        [
          event.eventName,
          event.city,
          event.location,
          event.activity
        ].some((value) => value.toLowerCase().includes(query));

      const matchesYear =
        year === "ALL" || String(event.year) === year;

      const matchesCity =
        city === "ALL" || event.city === city;

      const matchesStatus =
        status === "ALL" || event.status === status;

      return (
        matchesSearch &&
        matchesYear &&
        matchesCity &&
        matchesStatus
      );
    });
  }, [
    initialData.events,
    search,
    year,
    city,
    status
  ]);

  const modelData = useMemo(
    () => buildModelData(filteredEvents),
    [filteredEvents]
  );

  const budgetData = useMemo(
    () => buildBudgetData(filteredEvents),
    [filteredEvents]
  );

  const cityData = useMemo(
    () => buildCityData(filteredEvents),
    [filteredEvents]
  );

  const performanceData = useMemo(
    () =>
      filteredEvents.map((event) => ({
        name: event.eventName,
        spk: event.totalSpk,
        budget: event.totalBudget
      })),
    [filteredEvents]
  );

  const topEvents = useMemo(
    () =>
      [...filteredEvents]
        .sort((a, b) => b.totalSpk - a.totalSpk)
        .slice(0, 5)
        .map((event) => ({
          name: event.eventName,
          spk: event.totalSpk
        })),
    [filteredEvents]
  );

  const filteredSummary = useMemo(() => {
    const totalBudget = filteredEvents.reduce(
      (sum, event) => sum + event.totalBudget,
      0
    );
    const totalSpk = filteredEvents.reduce(
      (sum, event) => sum + event.totalSpk,
      0
    );
    const totalTestRide = filteredEvents.reduce(
      (sum, event) => sum + event.testRide,
      0
    );
    const totalFootTraffic = filteredEvents.reduce(
      (sum, event) => sum + event.footTraffic,
      0
    );

    return {
      totalEvents: filteredEvents.length,
      totalBudget,
      totalSpk,
      totalTestRide,
      totalFootTraffic,
      trafficToTestRide: totalFootTraffic
        ? (totalTestRide / totalFootTraffic) * 100
        : 0,
      testRideToSpk: totalTestRide
        ? (totalSpk / totalTestRide) * 100
        : 0
    };
  }, [filteredEvents]);

  async function syncNow() {
    if (syncing) return;

    setSyncing(true);
    setSyncError("");

    try {
      const response = await fetch("/api/annual-big-event/data", {
        cache: "no-store"
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.error ||
            "Unable to sync Google Sheet."
        );
      }

      router.refresh();
    } catch (error) {
      setSyncError(
        error instanceof Error
          ? error.message
          : "Unable to sync Google Sheet."
      );
    } finally {
      setSyncing(false);
    }
  }

  async function generateAi() {
    if (aiLoading) return;

    setAiLoading(true);
    setAiError("");

    try {
      const response = await fetch("/api/annual-big-event/ai", {
        method: "POST"
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.error ||
            "Unable to generate AI analysis."
        );
      }

      setAi(payload.analysis);
      setAiVersion(payload.sourceVersion || "");
    } catch (error) {
      setAiError(
        error instanceof Error
          ? error.message
          : "Unable to generate AI analysis."
      );
    } finally {
      setAiLoading(false);
    }
  }

  useEffect(() => {
    if (
      view === "ai" &&
      initialData.connected &&
      (!ai || aiVersion !== initialData.dataVersion)
    ) {
      generateAi();
    }
    // Intentional: generate on entering AI tab or when source version changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, initialData.dataVersion]);

  const kpis = [
    {
      label: "Total Events",
      value: formatNumber(filteredSummary.totalEvents),
      note: "events in selected filter"
    },
    {
      label: "Total Budget",
      value: formatCurrency(filteredSummary.totalBudget),
      note: "declared event budget"
    },
    {
      label: "Total SPK",
      value: formatNumber(filteredSummary.totalSpk),
      note: `Conversion ${pct(filteredSummary.testRideToSpk)}`
    },
    {
      label: "Total Test Ride",
      value: formatNumber(filteredSummary.totalTestRide),
      note: `${pct(filteredSummary.trafficToTestRide)} of foot traffic`
    },
    {
      label: "Foot Traffic",
      value: formatNumber(filteredSummary.totalFootTraffic),
      note: "total recorded visitors"
    }
  ];

  return (
    <div>
      <header className={styles.topbar}>
        <div className={styles.title}>
          <h1>Annual Big Event</h1>
          <p>
            Data synced from {initialData.sourceName} ·{" "}
            {initialData.sheetName}
          </p>
        </div>

        <div className={styles.topActions}>
          <div className={styles.syncStatus}>
            <strong>
              <span
                className={
                  initialData.connected
                    ? styles.dot
                    : styles.dotOff
                }
              />
              {initialData.connected
                ? "Google Sheet Connected"
                : "Google Sheet Not Connected"}
            </strong>

            <p>
              Auto-check every 60 sec · Last Sync{" "}
              {formatDateTime(initialData.fetchedAt)}
            </p>
          </div>

          <button
            className={styles.syncButton}
            type="button"
            onClick={syncNow}
            disabled={syncing || !initialData.connected}
          >
            {syncing ? "Syncing..." : "↻ Sync Now"}
          </button>
        </div>
      </header>

      {syncError ? (
        <div className={styles.alert}>{syncError}</div>
      ) : null}

      {!initialData.connected ? (
        <div className={styles.alert}>
          {initialData.error ||
            "Google Sheet source is not connected yet."}
        </div>
      ) : null}

      <div className={styles.tabs}>
        <button
          type="button"
          className={
            view === "data"
              ? styles.tabActive
              : styles.tab
          }
          onClick={() => setView("data")}
        >
          ▦ Event Data
        </button>

        <button
          type="button"
          className={
            view === "ai"
              ? styles.tabActive
              : styles.tab
          }
          onClick={() => setView("ai")}
        >
          ✦ AI Analysis
        </button>
      </div>

      {view === "data" ? (
        <>
          <section className={styles.kpiGrid}>
            {kpis.map((item) => (
              <article className={styles.kpi} key={item.label}>
                <p>{item.label}</p>
                <strong>{item.value}</strong>
                <small>{item.note}</small>
              </article>
            ))}
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <div>
                <h2>Event Data</h2>
                <p>
                  Flexible event rows, SPK model breakdown, and budget
                  categories from Google Sheet.
                </p>
              </div>

              <button
                className={styles.reset}
                type="button"
                onClick={() => exportCsv(filteredEvents)}
              >
                ↓ Export CSV
              </button>
            </div>

            <div className={styles.filters}>
              <input
                className={styles.input}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search event, city, location, activity..."
              />

              <select
                className={styles.select}
                value={year}
                onChange={(event) => setYear(event.target.value)}
              >
                <option value="ALL">All Years</option>
                {years.map((value) => (
                  <option value={value} key={value}>
                    {value}
                  </option>
                ))}
              </select>

              <select
                className={styles.select}
                value={city}
                onChange={(event) => setCity(event.target.value)}
              >
                <option value="ALL">All Cities</option>
                {cities.map((value) => (
                  <option value={value} key={value}>
                    {value}
                  </option>
                ))}
              </select>

              <select
                className={styles.select}
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="ALL">All Status</option>
                {statuses.map((value) => (
                  <option value={value} key={value}>
                    {value}
                  </option>
                ))}
              </select>

              <button
                className={styles.reset}
                type="button"
                onClick={() => {
                  setSearch("");
                  setYear("ALL");
                  setCity("ALL");
                  setStatus("ALL");
                }}
              >
                Reset
              </button>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Nama Event</th>
                    <th>Status</th>
                    <th>Kota</th>
                    <th>Location</th>
                    <th>Finished Event</th>
                    <th>Activity</th>
                    <th>Luas Lahan</th>
                    <th>Media Posting</th>
                    <th>Foot Traffic</th>
                    <th>Test Ride</th>
                    <th>SPK</th>
                    <th>Budget</th>
                    <th>SPP Link</th>
                    <th>Quotation</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredEvents.length === 0 ? (
                    <tr>
                      <td colSpan={15}>No event data found.</td>
                    </tr>
                  ) : (
                    filteredEvents.map((event) => (
                      <tr key={event.id}>
                        <td>{formatDate(event.startDate)}</td>
                        <td className={styles.eventName}>
                          <button
                            type="button"
                            className={styles.eventNameButton}
                            onClick={() => setSelected(event)}
                            title="Open event detail"
                          >
                            {event.eventName}
                          </button>
                        </td>
                        <td>
                          <span className={styles.status}>
                            {event.status || "—"}
                          </span>
                        </td>
                        <td>{event.city || "—"}</td>
                        <td>{event.location || "—"}</td>
                        <td>{formatDate(event.endDate)}</td>
                        <td className={styles.activityCell}>
                          {event.activity || "—"}
                        </td>
                        <td>{event.area || "—"}</td>
                        <td>{formatNumber(event.mediaPosting)}</td>
                        <td>{formatNumber(event.footTraffic)}</td>
                        <td>{formatNumber(event.testRide)}</td>
                        <td>{formatNumber(event.totalSpk)}</td>
                        <td>{formatCurrency(event.totalBudget)}</td>
                        <td>
                          {event.sppLink ? (
                            <a
                              className={styles.tableLink}
                              href={event.sppLink}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open ↗
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>
                          {event.quotationLink ? (
                            <a
                              className={styles.tableLink}
                              href={event.quotationLink}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open ↗
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <>
          <section className={styles.kpiGrid}>
            {kpis.map((item) => (
              <article className={styles.kpi} key={item.label}>
                <p>{item.label}</p>
                <strong>{item.value}</strong>
                <small>{item.note}</small>
              </article>
            ))}
          </section>

          {ai ? (
            <section className={styles.aiSummary}>
              <div className={styles.panelHead}>
                <div>
                  <h2>✦ AI Executive Summary</h2>
                  <p>
                    Evidence-based analysis from the latest event
                    dataset.
                  </p>
                </div>

                <button
                  className={styles.aiButton}
                  type="button"
                  onClick={generateAi}
                  disabled={aiLoading}
                >
                  {aiLoading ? "Analyzing..." : "Refresh AI"}
                </button>
              </div>

              <p>{ai.executive_summary}</p>
            </section>
          ) : (
            <section className={styles.emptyAi}>
              {aiLoading
                ? "Generating AI analysis..."
                : aiError || "AI analysis is ready to generate."}
            </section>
          )}

          {aiError ? (
            <div className={styles.alert}>{aiError}</div>
          ) : null}

          <section className={styles.chartGrid}>
            <article className={styles.chartPanel}>
              <div className={styles.panelHead}>
                <div>
                  <h3>Conversion Funnel</h3>
                  <p>Foot Traffic → Test Ride → SPK</p>
                </div>
              </div>

              <div style={{ display: "grid", gap: 14, marginTop: 26 }}>
                {[
                  {
                    label: "Foot Traffic",
                    value: filteredSummary.totalFootTraffic,
                    width: "100%"
                  },
                  {
                    label: "Test Ride",
                    value: filteredSummary.totalTestRide,
                    width: "70%"
                  },
                  {
                    label: "SPK",
                    value: filteredSummary.totalSpk,
                    width: "40%"
                  }
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      margin: "0 auto",
                      width: item.width,
                      borderRadius: 10,
                      padding: "14px 16px",
                      background:
                        "linear-gradient(90deg,#4b6ee8,#6d9cf1)",
                      color: "white",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      fontSize: 10,
                      fontWeight: 900
                    }}
                  >
                    <span>{item.label}</span>
                    <strong>{formatNumber(item.value)}</strong>
                  </div>
                ))}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 24,
                    color: "#67728b",
                    fontSize: 9
                  }}
                >
                  <span>
                    Traffic → Test Ride{" "}
                    <strong>
                      {pct(filteredSummary.trafficToTestRide)}
                    </strong>
                  </span>
                  <span>
                    Test Ride → SPK{" "}
                    <strong>
                      {pct(filteredSummary.testRideToSpk)}
                    </strong>
                  </span>
                </div>
              </div>
            </article>

            <article className={styles.chartPanel}>
              <div className={styles.panelHead}>
                <div>
                  <h3>SPK by Model</h3>
                  <p>Dynamic model mix from detail rows.</p>
                </div>
              </div>

              <div className={styles.chartBox}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={modelData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={54}
                      outerRadius={82}
                      paddingAngle={2}
                    >
                      {modelData.map((row, index) => (
                        <Cell
                          key={row.name}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number | string) =>
                        formatNumber(Number(value))
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className={styles.chartPanel}>
              <div className={styles.panelHead}>
                <div>
                  <h3>Budget Composition</h3>
                  <p>Dynamic budget categories from detail rows.</p>
                </div>
              </div>

              <div className={styles.chartBox}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={budgetData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={54}
                      outerRadius={82}
                      paddingAngle={2}
                    >
                      {budgetData.map((row, index) => (
                        <Cell
                          key={row.name}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number | string) =>
                        formatCurrency(Number(value))
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </article>
          </section>

          <section className={styles.wideGrid}>
            <article className={styles.wideChart}>
              <div className={styles.panelHead}>
                <div>
                  <h3>Event Performance</h3>
                  <p>SPK versus declared budget.</p>
                </div>
              </div>

              <div className={styles.chartBox}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={performanceData}>
                    <CartesianGrid
                      strokeDasharray="4 4"
                      vertical={false}
                      stroke="#e9edf5"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 8, fill: "#7f89a1" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 8, fill: "#7f89a1" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tickFormatter={(value) => formatCompact(Number(value))}
                      tick={{ fontSize: 8, fill: "#7f89a1" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip />
                    <Bar
                      yAxisId="left"
                      dataKey="spk"
                      fill="#4f6ee8"
                      radius={[5, 5, 0, 0]}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="budget"
                      stroke="#7d65d9"
                      strokeWidth={2.2}
                      dot={{ r: 3 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className={styles.wideChart}>
              <div className={styles.panelHead}>
                <div>
                  <h3>Top Performing Events</h3>
                  <p>Ranked by total SPK.</p>
                </div>
              </div>

              <div className={styles.chartBox}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topEvents}
                    layout="vertical"
                    margin={{ left: 18 }}
                  >
                    <CartesianGrid
                      strokeDasharray="4 4"
                      horizontal={false}
                      stroke="#edf0f5"
                    />
                    <XAxis
                      type="number"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 8, fill: "#7f89a1" }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      width={95}
                      tick={{ fontSize: 8, fill: "#59637b" }}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="spk"
                      fill="#5d94ed"
                      radius={[0, 6, 6, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>
          </section>

          <section className={styles.wideGrid}>
            <article className={styles.panel}>
              <div className={styles.panelHead}>
                <div>
                  <h3>Performance by City</h3>
                  <p>Total SPK aggregated by city.</p>
                </div>
              </div>

              <div className={styles.chartBox}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cityData}>
                    <CartesianGrid
                      strokeDasharray="4 4"
                      vertical={false}
                      stroke="#edf0f5"
                    />
                    <XAxis
                      dataKey="city"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 8, fill: "#7f89a1" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 8, fill: "#7f89a1" }}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="spk"
                      fill="#4f8ce9"
                      radius={[5, 5, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className={styles.panel}>
              <div className={styles.panelHead}>
                <div>
                  <h3>Portfolio Efficiency</h3>
                  <p>Current filtered portfolio.</p>
                </div>
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                {[
                  [
                    "Traffic → Test Ride",
                    pct(filteredSummary.trafficToTestRide)
                  ],
                  [
                    "Test Ride → SPK",
                    pct(filteredSummary.testRideToSpk)
                  ],
                  [
                    "Cost / SPK",
                    formatCurrency(
                      filteredSummary.totalSpk
                        ? filteredSummary.totalBudget /
                            filteredSummary.totalSpk
                        : 0
                    )
                  ],
                  [
                    "Cost / Test Ride",
                    formatCurrency(
                      filteredSummary.totalTestRide
                        ? filteredSummary.totalBudget /
                            filteredSummary.totalTestRide
                        : 0
                    )
                  ]
                ].map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      borderBottom: "1px solid #edf0f5",
                      padding: "10px 0",
                      fontSize: 10
                    }}
                  >
                    <span style={{ color: "#778198" }}>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className={styles.aiGrid}>
            <article className={styles.insights}>
              <div className={styles.panelHead}>
                <div>
                  <h3>Key Insights</h3>
                  <p>AI interpretation of the current source data.</p>
                </div>
              </div>

              {ai?.key_insights?.length ? (
                ai.key_insights.map((item, index) => (
                  <div className={styles.insightItem} key={`${item.title}-${index}`}>
                    <span className={styles.insightNumber}>
                      {index + 1}
                    </span>

                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.detail}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: "#8a92a8", fontSize: 10 }}>
                  {aiLoading
                    ? "Analyzing..."
                    : "No AI insights yet."}
                </p>
              )}
            </article>

            <div style={{ display: "grid", gap: 14 }}>
              <article className={styles.recommendations}>
                <div className={styles.panelHead}>
                  <div>
                    <h3>AI Recommendations</h3>
                    <p>Prioritized planning actions.</p>
                  </div>
                </div>

                <ul>
                  {(ai?.recommendations || []).map((item, index) => (
                    <li key={index}>
                      <span>✓</span>
                      <div>{item}</div>
                    </li>
                  ))}
                </ul>
              </article>

              <article className={styles.recommendations}>
                <div className={styles.panelHead}>
                  <div>
                    <h3>Data Quality</h3>
                    <p>
                      Validation of SPK and budget breakdown totals.
                    </p>
                  </div>
                </div>

                <ul className={styles.qualityList}>
                  {(ai?.data_quality || []).map((item, index) => (
                    <li key={index}>
                      <span>!</span>
                      <div>{item}</div>
                    </li>
                  ))}

                  {ai?.confidence_note ? (
                    <li>
                      <span>i</span>
                      <div>{ai.confidence_note}</div>
                    </li>
                  ) : null}
                </ul>
              </article>
            </div>
          </section>
        </>
      )}

      {selected ? (
        <div
          className={styles.modalBackdrop}
          onClick={() => setSelected(null)}
        >
          <div
            className={styles.modal}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHead}>
              <div>
                <h3>{selected.eventName}</h3>
                <p>
                  {formatDate(selected.startDate)}
                  {selected.endDate
                    ? ` – ${formatDate(selected.endDate)}`
                    : ""}{" "}
                  · {selected.city}
                </p>
              </div>

              <button
                className={styles.close}
                type="button"
                onClick={() => setSelected(null)}
              >
                ×
              </button>
            </div>

            <div className={styles.detailGrid}>
              <div className={styles.detailBox}>
                <h4>SPK Breakdown</h4>

                {selected.spkBreakdown.map((item) => (
                  <div className={styles.detailRow} key={item.model}>
                    <span>{item.model}</span>
                    <strong>{formatNumber(item.qty)}</strong>
                  </div>
                ))}

                <div className={styles.detailRow}>
                  <span>Breakdown Total</span>
                  <strong>{formatNumber(selected.spkBreakdownTotal)}</strong>
                </div>

                <div className={styles.detailRow}>
                  <span>Declared Total SPK</span>
                  <strong>{formatNumber(selected.totalSpk)}</strong>
                </div>
              </div>

              <div className={styles.detailBox}>
                <h4>Budget Breakdown</h4>

                {selected.budgetBreakdown.map((item) => (
                  <div className={styles.detailRow} key={item.category}>
                    <span>{item.category}</span>
                    <strong>{formatCurrency(item.amount)}</strong>
                  </div>
                ))}

                <div className={styles.detailRow}>
                  <span>Breakdown Total</span>
                  <strong>
                    {formatCurrency(selected.budgetBreakdownTotal)}
                  </strong>
                </div>

                <div className={styles.detailRow}>
                  <span>Declared Total Budget</span>
                  <strong>{formatCurrency(selected.totalBudget)}</strong>
                </div>
              </div>
            </div>

            <div className={styles.detailGrid} style={{ marginTop: 14 }}>
              <div className={styles.detailBox}>
                <h4>Event Information</h4>

                {[
                  ["Location", selected.location || "—"],
                  ["Activity", selected.activity || "—"],
                  ["Area", selected.area || "—"],
                  [
                    "Media Posting",
                    formatNumber(selected.mediaPosting)
                  ],
                  [
                    "Foot Traffic",
                    formatNumber(selected.footTraffic)
                  ],
                  ["Test Ride", formatNumber(selected.testRide)]
                ].map(([label, value]) => (
                  <div className={styles.detailRow} key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>

              <div className={styles.detailBox}>
                <h4>Efficiency</h4>

                {[
                  [
                    "Traffic → Test Ride",
                    pct(selected.trafficToTestRide)
                  ],
                  [
                    "Test Ride → SPK",
                    pct(selected.testRideToSpk)
                  ],
                  [
                    "Cost / SPK",
                    formatCurrency(selected.costPerSpk)
                  ],
                  [
                    "Cost / Test Ride",
                    formatCurrency(selected.costPerTestRide)
                  ]
                ].map(([label, value]) => (
                  <div className={styles.detailRow} key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.links}>
              {selected.sppLink ? (
                <a
                  href={selected.sppLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open SPP ↗
                </a>
              ) : null}

              {selected.quotationLink ? (
                <a
                  href={selected.quotationLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Quotation ↗
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
