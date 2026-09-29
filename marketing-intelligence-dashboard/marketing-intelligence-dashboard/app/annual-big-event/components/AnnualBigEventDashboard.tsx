"use client";



import {

  Fragment,

  useEffect,

  useMemo,

  useState

} from "react";

import type { CSSProperties, ReactNode } from "react";



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




type LinkAvailability = "ALL" | "AVAILABLE" | "MISSING";

type ColumnFilterKey =
  | "startDate"
  | "eventName"
  | "status"
  | "city"
  | "location"
  | "endDate"
  | "activity"
  | "area"
  | "mediaPosting"
  | "footTraffic"
  | "testRide"
  | "spk"
  | "budget"
  | "spp"
  | "quotation";

type ColumnFilters = {
  startDateFrom: string;
  startDateTo: string;
  eventName: string;
  location: string;
  endDateFrom: string;
  endDateTo: string;
  activity: string;
  area: string;
  mediaPostingMin: string;
  mediaPostingMax: string;
  footTrafficMin: string;
  footTrafficMax: string;
  testRideMin: string;
  testRideMax: string;
  spkMin: string;
  spkMax: string;
  budgetMin: string;
  budgetMax: string;
  spp: LinkAvailability;
  quotation: LinkAvailability;
};

const EMPTY_COLUMN_FILTERS: ColumnFilters = {
  startDateFrom: "",
  startDateTo: "",
  eventName: "",
  location: "",
  endDateFrom: "",
  endDateTo: "",
  activity: "",
  area: "",
  mediaPostingMin: "",
  mediaPostingMax: "",
  footTrafficMin: "",
  footTrafficMax: "",
  testRideMin: "",
  testRideMax: "",
  spkMin: "",
  spkMax: "",
  budgetMin: "",
  budgetMax: "",
  spp: "ALL",
  quotation: "ALL"
};

const filterInputStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  height: 30,
  boxSizing: "border-box",
  border: "1px solid #dbe2ef",
  borderRadius: 7,
  background: "#ffffff",
  color: "#1c2742",
  fontSize: 11,
  fontWeight: 500,
  padding: "0 8px",
  outline: "none"
};

const filterClearStyle: CSSProperties = {
  width: "100%",
  height: 27,
  marginTop: 6,
  border: "1px solid #dbe2ef",
  borderRadius: 7,
  background: "#f8faff",
  color: "#5f6c87",
  fontSize: 10,
  fontWeight: 700,
  cursor: "pointer"
};

function FilterHeader({
  label,
  active,
  open,
  onToggle,
  children,
  minWidth = 110
}: {
  label: string;
  active: boolean;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  minWidth?: number;
}) {
  return (
    <th
      style={{
        minWidth,
        verticalAlign: "top",
        whiteSpace: "normal"
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6
        }}
      >
        <span>{label}</span>

        <button
          type="button"
          onClick={onToggle}
          aria-label={`Filter ${label}`}
          aria-expanded={open}
          title={`Filter ${label}`}
          style={{
            width: 23,
            height: 23,
            flex: "0 0 23px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            border: active
              ? "1px solid #b8c7ff"
              : "1px solid transparent",
            borderRadius: 6,
            background: active ? "#eaf0ff" : "transparent",
            color: active ? "#3159d7" : "#8b96ad",
            fontSize: 12,
            fontWeight: 900,
            cursor: "pointer",
            lineHeight: 1
          }}
        >
          ▾
        </button>
      </div>

      {open ? (
        <div
          style={{
            width: 178,
            marginTop: 7,
            padding: 8,
            boxSizing: "border-box",
            border: "1px solid #dfe5f1",
            borderRadius: 9,
            background: "#ffffff",
            boxShadow: "0 8px 22px rgba(33, 48, 81, 0.10)"
          }}
        >
          {children}
        </div>
      ) : null}
    </th>
  );
}

function TextFilterControl({
  value,
  onChange,
  onClear,
  placeholder
}: {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder: string;
}) {
  return (
    <div>
      <input
        style={filterInputStyle}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
      <button
        type="button"
        style={filterClearStyle}
        onClick={onClear}
        disabled={!value}
      >
        Clear
      </button>
    </div>
  );
}

function DateRangeFilterControl({
  from,
  to,
  onFromChange,
  onToChange,
  onClear
}: {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <div>
      <div style={{ display: "grid", gap: 6 }}>
        <input
          style={filterInputStyle}
          type="date"
          value={from}
          onChange={(event) => onFromChange(event.target.value)}
          aria-label="From date"
        />
        <input
          style={filterInputStyle}
          type="date"
          value={to}
          onChange={(event) => onToChange(event.target.value)}
          aria-label="To date"
        />
      </div>

      <button
        type="button"
        style={filterClearStyle}
        onClick={onClear}
        disabled={!from && !to}
      >
        Clear
      </button>
    </div>
  );
}

function NumberRangeFilterControl({
  min,
  max,
  onMinChange,
  onMaxChange,
  onClear
}: {
  min: string;
  max: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <input
          style={filterInputStyle}
          type="number"
          min="0"
          inputMode="numeric"
          value={min}
          onChange={(event) => onMinChange(event.target.value)}
          placeholder="Min"
          aria-label="Minimum value"
        />
        <input
          style={filterInputStyle}
          type="number"
          min="0"
          inputMode="numeric"
          value={max}
          onChange={(event) => onMaxChange(event.target.value)}
          placeholder="Max"
          aria-label="Maximum value"
        />
      </div>

      <button
        type="button"
        style={filterClearStyle}
        onClick={onClear}
        disabled={!min && !max}
      >
        Clear
      </button>
    </div>
  );
}

function SelectFilterControl({
  value,
  onChange,
  options,
  allLabel = "All"
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  allLabel?: string;
}) {
  return (
    <select
      style={filterInputStyle}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="ALL">{allLabel}</option>
      {options.map((option) => (
        <option value={option.value} key={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function matchesText(value: string | number | null | undefined, filter: string) {
  const query = filter.trim().toLowerCase();
  if (!query) return true;

  return String(value ?? "")
    .toLowerCase()
    .includes(query);
}

function matchesDateRange(value: string, from: string, to: string) {
  if (!from && !to) return true;

  const date = value?.slice(0, 10) || "";
  if (!date) return false;
  if (from && date < from) return false;
  if (to && date > to) return false;

  return true;
}

function matchesNumberRange(value: number, min: string, max: string) {
  const normalized = Number(value || 0);
  const minValue = min === "" ? null : Number(min);
  const maxValue = max === "" ? null : Number(max);

  if (minValue !== null && Number.isFinite(minValue) && normalized < minValue) {
    return false;
  }

  if (maxValue !== null && Number.isFinite(maxValue) && normalized > maxValue) {
    return false;
  }

  return true;
}

function matchesAvailability(
  value: string | null | undefined,
  filter: LinkAvailability
) {
  if (filter === "ALL") return true;

  const available = Boolean(String(value || "").trim());

  return filter === "AVAILABLE" ? available : !available;
}

function formatNumber(value: number) {

  return new Intl.NumberFormat("en-US").format(Math.round(value));

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



function exportCsv(events: AnnualBigEvent[], fileName = "annual-big-event-data.csv") {

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

  anchor.download = fileName;

  document.body.appendChild(anchor);

  anchor.click();

  anchor.remove();

  URL.revokeObjectURL(url);

}



function buildModelData(events: AnnualBigEvent[]) {

  const map = new Map<string, number>();



  events.forEach((event) => {

    event.spkBreakdown.forEach((item) => {

      map.set(item.model, (map.get(item.model) || 0) + item.qty);

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



function statusClass(status: string) {

  const normalized = status.toLowerCase();



  if (normalized.includes("complete")) return styles.completed;

  if (

    normalized.includes("ongoing") ||

    normalized.includes("on going")

  ) {

    return styles.ongoing;

  }



  return styles.upcoming;

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

  initialData,
  pageTitle = "Annual Big Event",
  dataApiPath = "/api/annual-big-event/data",
  aiApiPath = "/api/annual-big-event/ai",
  csvFileName = "annual-big-event-data.csv"

}: {

  initialData: AnnualBigEventData;
  pageTitle?: string;
  dataApiPath?: string;
  aiApiPath?: string;
  csvFileName?: string;

}) {

  const router = useRouter();



  const [view, setView] = useState<ViewKey>("data");

  const [syncing, setSyncing] = useState(false);

  const [syncError, setSyncError] = useState("");

  const [search, setSearch] = useState("");

  const [year, setYear] = useState("ALL");

  const [city, setCity] = useState("ALL");

  const [status, setStatus] = useState("ALL");

  const [columnFilters, setColumnFilters] = useState<ColumnFilters>(() => ({
    ...EMPTY_COLUMN_FILTERS
  }));

  const [openColumnFilter, setOpenColumnFilter] =
    useState<ColumnFilterKey | null>(null);

  function updateColumnFilter<K extends keyof ColumnFilters>(
    key: K,
    value: ColumnFilters[K]
  ) {
    setColumnFilters((current) => ({
      ...current,
      [key]: value
    }));
  }

  function toggleColumnFilter(key: ColumnFilterKey) {
    setOpenColumnFilter((current) => (current === key ? null : key));
  }




  const [expandedEventIds, setExpandedEventIds] =

    useState<Set<string>>(new Set());



  const [ai, setAi] = useState<AIAnalysis | null>(null);

  const [aiLoading, setAiLoading] = useState(false);

  const [aiError, setAiError] = useState("");

  const [aiVersion, setAiVersion] = useState("");



  function toggleEventDetail(eventId: string) {

    setExpandedEventIds((current) => {

      const next = new Set(current);



      if (next.has(eventId)) {

        next.delete(eventId);

      } else {

        next.add(eventId);

      }



      return next;

    });

  }



  useEffect(() => {

    if (!initialData.connected || !initialData.dataVersion) return;



    let cancelled = false;



    const timer = window.setInterval(async () => {

      try {

        const response = await fetch(

          dataApiPath,

          { cache: "no-store" }

        );



        if (!response.ok) return;



        const latest =

          (await response.json()) as AnnualBigEventData;



        if (

          !cancelled &&

          latest.dataVersion &&

          latest.dataVersion !== initialData.dataVersion

        ) {

          router.refresh();

        }

      } catch {

        // Background auto-check should never interrupt the page.

      }

    }, 60_000);



    return () => {

      cancelled = true;

      window.clearInterval(timer);

    };

  }, [

    initialData.connected,

    initialData.dataVersion,

    router,

    dataApiPath

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
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query)
        );

      const matchesYear =
        year === "ALL" || String(event.year) === year;

      const matchesCity =
        city === "ALL" || event.city === city;

      const matchesStatus =
        status === "ALL" || event.status === status;

      const matchesColumnFilters =
        matchesDateRange(
          event.startDate,
          columnFilters.startDateFrom,
          columnFilters.startDateTo
        ) &&
        matchesText(event.eventName, columnFilters.eventName) &&
        matchesText(event.location, columnFilters.location) &&
        matchesDateRange(
          event.endDate,
          columnFilters.endDateFrom,
          columnFilters.endDateTo
        ) &&
        matchesText(event.activity, columnFilters.activity) &&
        matchesText(event.area, columnFilters.area) &&
        matchesNumberRange(
          event.mediaPosting,
          columnFilters.mediaPostingMin,
          columnFilters.mediaPostingMax
        ) &&
        matchesNumberRange(
          event.footTraffic,
          columnFilters.footTrafficMin,
          columnFilters.footTrafficMax
        ) &&
        matchesNumberRange(
          event.testRide,
          columnFilters.testRideMin,
          columnFilters.testRideMax
        ) &&
        matchesNumberRange(
          event.totalSpk,
          columnFilters.spkMin,
          columnFilters.spkMax
        ) &&
        matchesNumberRange(
          event.totalBudget,
          columnFilters.budgetMin,
          columnFilters.budgetMax
        ) &&
        matchesAvailability(event.sppLink, columnFilters.spp) &&
        matchesAvailability(
          event.quotationLink,
          columnFilters.quotation
        );

      return (
        matchesSearch &&
        matchesYear &&
        matchesCity &&
        matchesStatus &&
        matchesColumnFilters
      );
    });
  }, [
    initialData.events,
    search,
    year,
    city,
    status,
    columnFilters
  ]);

  function columnFilterIsActive(key: ColumnFilterKey) {
    switch (key) {
      case "startDate":
        return Boolean(
          columnFilters.startDateFrom ||
          columnFilters.startDateTo
        );
      case "eventName":
        return Boolean(columnFilters.eventName);
      case "status":
        return status !== "ALL";
      case "city":
        return city !== "ALL";
      case "location":
        return Boolean(columnFilters.location);
      case "endDate":
        return Boolean(
          columnFilters.endDateFrom ||
          columnFilters.endDateTo
        );
      case "activity":
        return Boolean(columnFilters.activity);
      case "area":
        return Boolean(columnFilters.area);
      case "mediaPosting":
        return Boolean(
          columnFilters.mediaPostingMin ||
          columnFilters.mediaPostingMax
        );
      case "footTraffic":
        return Boolean(
          columnFilters.footTrafficMin ||
          columnFilters.footTrafficMax
        );
      case "testRide":
        return Boolean(
          columnFilters.testRideMin ||
          columnFilters.testRideMax
        );
      case "spk":
        return Boolean(
          columnFilters.spkMin ||
          columnFilters.spkMax
        );
      case "budget":
        return Boolean(
          columnFilters.budgetMin ||
          columnFilters.budgetMax
        );
      case "spp":
        return columnFilters.spp !== "ALL";
      case "quotation":
        return columnFilters.quotation !== "ALL";
      default:
        return false;
    }
  }

  const modelData = useMemo(

    () => buildModelData(filteredEvents),

    [filteredEvents]

  );



  const budgetData = useMemo(

    () => buildBudgetData(filteredEvents),

    [filteredEvents]

  );



  const modelDataTotal = useMemo(

    () => modelData.reduce((sum, row) => sum + row.value, 0),

    [modelData]

  );



  const budgetDataTotal = useMemo(

    () => budgetData.reduce((sum, row) => sum + row.value, 0),

    [budgetData]

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

      const response = await fetch(

        dataApiPath,

        { cache: "no-store" }

      );



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

      const response = await fetch(

        aiApiPath,

        { method: "POST" }

      );



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

      note: `Conversion ${pct(

        filteredSummary.testRideToSpk

      )}`

    },

    {

      label: "Total Test Ride",

      value: formatNumber(filteredSummary.totalTestRide),

      note: `${pct(

        filteredSummary.trafficToTestRide

      )} of foot traffic`

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

          <h1>{pageTitle}</h1>

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

                  Klik tanda panah pada Nama Event untuk melihat detail

                  SPK dan Budget dari baris kuning Google Sheet.

                </p>

              </div>



              <button

                className={styles.reset}

                type="button"

                onClick={() => exportCsv(filteredEvents, csvFileName)}

              >

                ↓ Export CSV

              </button>

            </div>



            <div className={styles.filters}>

              <input

                className={styles.input}

                value={search}

                onChange={(event) =>

                  setSearch(event.target.value)

                }

                placeholder="Search event, city, location, activity..."

              />



              <select

                className={styles.select}

                value={year}

                onChange={(event) =>

                  setYear(event.target.value)

                }

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

                onChange={(event) =>

                  setCity(event.target.value)

                }

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

                onChange={(event) =>

                  setStatus(event.target.value)

                }

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
                  setColumnFilters({
                    ...EMPTY_COLUMN_FILTERS
                  });
                  setOpenColumnFilter(null);
                }}

              >

                Reset

              </button>

            </div>



            <div className={styles.tableWrap}>

              <table className={styles.table}>

                <thead>
                <tr>
                  <FilterHeader
                    label="Tanggal"
                    active={columnFilterIsActive("startDate")}
                    open={openColumnFilter === "startDate"}
                    onToggle={() => toggleColumnFilter("startDate")}
                    minWidth={138}
                  >
                    <DateRangeFilterControl
                      from={columnFilters.startDateFrom}
                      to={columnFilters.startDateTo}
                      onFromChange={(value) =>
                        updateColumnFilter("startDateFrom", value)
                      }
                      onToChange={(value) =>
                        updateColumnFilter("startDateTo", value)
                      }
                      onClear={() => {
                        updateColumnFilter("startDateFrom", "");
                        updateColumnFilter("startDateTo", "");
                      }}
                    />
                  </FilterHeader>

                  <FilterHeader
                    label="Nama Event"
                    active={columnFilterIsActive("eventName")}
                    open={openColumnFilter === "eventName"}
                    onToggle={() => toggleColumnFilter("eventName")}
                    minWidth={190}
                  >
                    <TextFilterControl
                      value={columnFilters.eventName}
                      onChange={(value) =>
                        updateColumnFilter("eventName", value)
                      }
                      onClear={() =>
                        updateColumnFilter("eventName", "")
                      }
                      placeholder="Search event..."
                    />
                  </FilterHeader>

                  <FilterHeader
                    label="Status"
                    active={columnFilterIsActive("status")}
                    open={openColumnFilter === "status"}
                    onToggle={() => toggleColumnFilter("status")}
                    minWidth={118}
                  >
                    <SelectFilterControl
                      value={status}
                      onChange={setStatus}
                      allLabel="All Status"
                      options={statuses.map((value) => ({
                        value,
                        label: value
                      }))}
                    />
                  </FilterHeader>

                  <FilterHeader
                    label="Kota"
                    active={columnFilterIsActive("city")}
                    open={openColumnFilter === "city"}
                    onToggle={() => toggleColumnFilter("city")}
                    minWidth={122}
                  >
                    <SelectFilterControl
                      value={city}
                      onChange={setCity}
                      allLabel="All Cities"
                      options={cities.map((value) => ({
                        value,
                        label: value
                      }))}
                    />
                  </FilterHeader>

                  <FilterHeader
                    label="Location"
                    active={columnFilterIsActive("location")}
                    open={openColumnFilter === "location"}
                    onToggle={() => toggleColumnFilter("location")}
                    minWidth={175}
                  >
                    <TextFilterControl
                      value={columnFilters.location}
                      onChange={(value) =>
                        updateColumnFilter("location", value)
                      }
                      onClear={() =>
                        updateColumnFilter("location", "")
                      }
                      placeholder="Search location..."
                    />
                  </FilterHeader>

                  <FilterHeader
                    label="Finished Event"
                    active={columnFilterIsActive("endDate")}
                    open={openColumnFilter === "endDate"}
                    onToggle={() => toggleColumnFilter("endDate")}
                    minWidth={145}
                  >
                    <DateRangeFilterControl
                      from={columnFilters.endDateFrom}
                      to={columnFilters.endDateTo}
                      onFromChange={(value) =>
                        updateColumnFilter("endDateFrom", value)
                      }
                      onToChange={(value) =>
                        updateColumnFilter("endDateTo", value)
                      }
                      onClear={() => {
                        updateColumnFilter("endDateFrom", "");
                        updateColumnFilter("endDateTo", "");
                      }}
                    />
                  </FilterHeader>

                  <FilterHeader
                    label="Activity"
                    active={columnFilterIsActive("activity")}
                    open={openColumnFilter === "activity"}
                    onToggle={() => toggleColumnFilter("activity")}
                    minWidth={210}
                  >
                    <TextFilterControl
                      value={columnFilters.activity}
                      onChange={(value) =>
                        updateColumnFilter("activity", value)
                      }
                      onClear={() =>
                        updateColumnFilter("activity", "")
                      }
                      placeholder="Search activity..."
                    />
                  </FilterHeader>

                  <FilterHeader
                    label="Luas Lahan"
                    active={columnFilterIsActive("area")}
                    open={openColumnFilter === "area"}
                    onToggle={() => toggleColumnFilter("area")}
                    minWidth={120}
                  >
                    <TextFilterControl
                      value={columnFilters.area}
                      onChange={(value) =>
                        updateColumnFilter("area", value)
                      }
                      onClear={() =>
                        updateColumnFilter("area", "")
                      }
                      placeholder="Search area..."
                    />
                  </FilterHeader>

                  <FilterHeader
                    label="Media Posting"
                    active={columnFilterIsActive("mediaPosting")}
                    open={openColumnFilter === "mediaPosting"}
                    onToggle={() => toggleColumnFilter("mediaPosting")}
                    minWidth={128}
                  >
                    <NumberRangeFilterControl
                      min={columnFilters.mediaPostingMin}
                      max={columnFilters.mediaPostingMax}
                      onMinChange={(value) =>
                        updateColumnFilter("mediaPostingMin", value)
                      }
                      onMaxChange={(value) =>
                        updateColumnFilter("mediaPostingMax", value)
                      }
                      onClear={() => {
                        updateColumnFilter("mediaPostingMin", "");
                        updateColumnFilter("mediaPostingMax", "");
                      }}
                    />
                  </FilterHeader>

                  <FilterHeader
                    label="Foot Traffic"
                    active={columnFilterIsActive("footTraffic")}
                    open={openColumnFilter === "footTraffic"}
                    onToggle={() => toggleColumnFilter("footTraffic")}
                    minWidth={126}
                  >
                    <NumberRangeFilterControl
                      min={columnFilters.footTrafficMin}
                      max={columnFilters.footTrafficMax}
                      onMinChange={(value) =>
                        updateColumnFilter("footTrafficMin", value)
                      }
                      onMaxChange={(value) =>
                        updateColumnFilter("footTrafficMax", value)
                      }
                      onClear={() => {
                        updateColumnFilter("footTrafficMin", "");
                        updateColumnFilter("footTrafficMax", "");
                      }}
                    />
                  </FilterHeader>

                  <FilterHeader
                    label="Test Ride"
                    active={columnFilterIsActive("testRide")}
                    open={openColumnFilter === "testRide"}
                    onToggle={() => toggleColumnFilter("testRide")}
                    minWidth={116}
                  >
                    <NumberRangeFilterControl
                      min={columnFilters.testRideMin}
                      max={columnFilters.testRideMax}
                      onMinChange={(value) =>
                        updateColumnFilter("testRideMin", value)
                      }
                      onMaxChange={(value) =>
                        updateColumnFilter("testRideMax", value)
                      }
                      onClear={() => {
                        updateColumnFilter("testRideMin", "");
                        updateColumnFilter("testRideMax", "");
                      }}
                    />
                  </FilterHeader>

                  <FilterHeader
                    label="SPK"
                    active={columnFilterIsActive("spk")}
                    open={openColumnFilter === "spk"}
                    onToggle={() => toggleColumnFilter("spk")}
                    minWidth={102}
                  >
                    <NumberRangeFilterControl
                      min={columnFilters.spkMin}
                      max={columnFilters.spkMax}
                      onMinChange={(value) =>
                        updateColumnFilter("spkMin", value)
                      }
                      onMaxChange={(value) =>
                        updateColumnFilter("spkMax", value)
                      }
                      onClear={() => {
                        updateColumnFilter("spkMin", "");
                        updateColumnFilter("spkMax", "");
                      }}
                    />
                  </FilterHeader>

                  <FilterHeader
                    label="Budget"
                    active={columnFilterIsActive("budget")}
                    open={openColumnFilter === "budget"}
                    onToggle={() => toggleColumnFilter("budget")}
                    minWidth={140}
                  >
                    <NumberRangeFilterControl
                      min={columnFilters.budgetMin}
                      max={columnFilters.budgetMax}
                      onMinChange={(value) =>
                        updateColumnFilter("budgetMin", value)
                      }
                      onMaxChange={(value) =>
                        updateColumnFilter("budgetMax", value)
                      }
                      onClear={() => {
                        updateColumnFilter("budgetMin", "");
                        updateColumnFilter("budgetMax", "");
                      }}
                    />
                  </FilterHeader>

                  <FilterHeader
                    label="SPP Link"
                    active={columnFilterIsActive("spp")}
                    open={openColumnFilter === "spp"}
                    onToggle={() => toggleColumnFilter("spp")}
                    minWidth={112}
                  >
                    <SelectFilterControl
                      value={columnFilters.spp}
                      onChange={(value) =>
                        updateColumnFilter(
                          "spp",
                          value as LinkAvailability
                        )
                      }
                      allLabel="All"
                      options={[
                        {
                          value: "AVAILABLE",
                          label: "Available"
                        },
                        {
                          value: "MISSING",
                          label: "Not Available"
                        }
                      ]}
                    />
                  </FilterHeader>

                  <FilterHeader
                    label="Quotation"
                    active={columnFilterIsActive("quotation")}
                    open={openColumnFilter === "quotation"}
                    onToggle={() => toggleColumnFilter("quotation")}
                    minWidth={118}
                  >
                    <SelectFilterControl
                      value={columnFilters.quotation}
                      onChange={(value) =>
                        updateColumnFilter(
                          "quotation",
                          value as LinkAvailability
                        )
                      }
                      allLabel="All"
                      options={[
                        {
                          value: "AVAILABLE",
                          label: "Available"
                        },
                        {
                          value: "MISSING",
                          label: "Not Available"
                        }
                      ]}
                    />
                  </FilterHeader>
                </tr>
              </thead>



                <tbody>

                  {filteredEvents.length === 0 ? (

                    <tr>

                      <td colSpan={15}>

                        No event data found.

                      </td>

                    </tr>

                  ) : (

                    filteredEvents.map((event) => {

                      const expanded =

                        expandedEventIds.has(event.id);



                      return (

                        <Fragment key={event.id}>

                          <tr

                            className={

                              expanded

                                ? styles.expandedMainRow

                                : undefined

                            }

                          >

                            <td>

                              {formatDate(event.startDate)}

                            </td>



                            <td className={styles.eventName}>

                              <div className={styles.eventNameWrap}>

                                <button

                                  type="button"

                                  className={styles.expandButton}

                                  onClick={() =>

                                    toggleEventDetail(event.id)

                                  }

                                  aria-expanded={expanded}

                                  title={

                                    expanded

                                      ? "Hide detail"

                                      : "Show SPK & Budget detail"

                                  }

                                >

                                  {expanded ? "▾" : "›"}

                                </button>



                                <button

                                  type="button"

                                  className={styles.eventNameButton}

                                  onClick={() =>

                                    toggleEventDetail(event.id)

                                  }

                                  aria-expanded={expanded}

                                >

                                  {event.eventName}

                                </button>

                              </div>

                            </td>



                            <td>

                              <span

                                className={statusClass(

                                  event.status || ""

                                )}

                              >

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



                            <td>

                              {formatNumber(event.mediaPosting)}

                            </td>



                            <td>

                              {formatNumber(event.footTraffic)}

                            </td>



                            <td>

                              {formatNumber(event.testRide)}

                            </td>



                            <td>

                              <strong>

                                {formatNumber(event.totalSpk)}

                              </strong>

                            </td>



                            <td>

                              <strong>

                                {formatCurrency(event.totalBudget)}

                              </strong>

                            </td>



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



                          {expanded ? (

                            <tr className={styles.detailTableRow}>

                              <td colSpan={15}>

                                <div className={styles.inlineDetail}>

                                  <div className={styles.inlineDetailHeader}>

                                    <div>

                                      <strong>

                                        Detail · {event.eventName}

                                      </strong>

                                      <span>

                                        Data detail mengikuti baris kuning

                                        pada Google Sheet.

                                      </span>

                                    </div>



                                    <button

                                      type="button"

                                      onClick={() =>

                                        toggleEventDetail(event.id)

                                      }

                                    >

                                      Close

                                    </button>

                                  </div>



                                  <div className={styles.inlineDetailGrid}>

                                    <section className={styles.detailYellowCard}>

                                      <div className={styles.detailCardHead}>

                                        <div>

                                          <span>SPK BREAKDOWN</span>

                                          <strong>

                                            {formatNumber(event.totalSpk)}

                                          </strong>

                                        </div>



                                        <small>

                                          Declared Total SPK

                                        </small>

                                      </div>



                                      <div className={styles.breakdownList}>

                                        {event.spkBreakdown.length ? (

                                          event.spkBreakdown.map((item) => (

                                            <div

                                              className={styles.breakdownRow}

                                              key={item.model}

                                            >

                                              <span>{item.model}</span>

                                              <strong>

                                                {formatNumber(item.qty)}

                                              </strong>

                                            </div>

                                          ))

                                        ) : (

                                          <div className={styles.breakdownEmpty}>

                                            No SPK breakdown.

                                          </div>

                                        )}

                                      </div>



                                      <div className={styles.breakdownTotal}>

                                        <span>Breakdown Total</span>

                                        <strong>

                                          {formatNumber(

                                            event.spkBreakdownTotal

                                          )}

                                        </strong>

                                      </div>

                                    </section>



                                    <section className={styles.detailYellowCard}>

                                      <div className={styles.detailCardHead}>

                                        <div>

                                          <span>BUDGET BREAKDOWN</span>

                                          <strong>

                                            {formatCurrency(

                                              event.totalBudget

                                            )}

                                          </strong>

                                        </div>



                                        <small>

                                          Declared Total Budget

                                        </small>

                                      </div>



                                      <div className={styles.breakdownList}>

                                        {event.budgetBreakdown.length ? (

                                          event.budgetBreakdown.map(

                                            (item) => (

                                              <div

                                                className={

                                                  styles.breakdownRow

                                                }

                                                key={item.category}

                                              >

                                                <span>

                                                  {item.category}

                                                </span>

                                                <strong>

                                                  {formatCurrency(

                                                    item.amount

                                                  )}

                                                </strong>

                                              </div>

                                            )

                                          )

                                        ) : (

                                          <div

                                            className={

                                              styles.breakdownEmpty

                                            }

                                          >

                                            No budget breakdown.

                                          </div>

                                        )}

                                      </div>



                                      <div className={styles.breakdownTotal}>

                                        <span>Breakdown Total</span>

                                        <strong>

                                          {formatCurrency(

                                            event.budgetBreakdownTotal

                                          )}

                                        </strong>

                                      </div>

                                    </section>

                                  </div>



                                  <div className={styles.inlineDetailFooter}>

                                    <span>

                                      Test Ride → SPK{" "}

                                      <strong>

                                        {pct(event.testRideToSpk)}

                                      </strong>

                                    </span>



                                    <span>

                                      Cost / SPK{" "}

                                      <strong>

                                        {formatCurrency(

                                          event.costPerSpk

                                        )}

                                      </strong>

                                    </span>



                                    <span

                                      className={

                                        event.dataQuality.spkMatches &&

                                        event.dataQuality.budgetMatches

                                          ? styles.dataOk

                                          : styles.dataWarn

                                      }

                                    >

                                      {event.dataQuality.spkMatches &&

                                      event.dataQuality.budgetMatches

                                        ? "✓ Detail totals match"

                                        : "⚠ Detail total mismatch"}

                                    </span>

                                  </div>

                                </div>

                              </td>

                            </tr>

                          ) : null}

                        </Fragment>

                      );

                    })

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

              <article

                className={styles.kpi}

                key={item.label}

              >

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

                : aiError ||

                  "AI analysis is ready to generate."}

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



              <div className={styles.funnelWrap}>

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

                    className={styles.funnelBar}

                    key={item.label}

                    style={{ width: item.width }}

                  >

                    <span>{item.label}</span>

                    <strong>

                      {formatNumber(item.value)}

                    </strong>

                  </div>

                ))}



                <div className={styles.funnelMeta}>

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

                  <p>

                    Dynamic model mix from detail rows.

                  </p>

                </div>

              </div>



              <div
                className={styles.chartBox}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(150px, 0.9fr) minmax(180px, 1.1fr)",
                  gap: 16,
                  alignItems: "center"
                }}
              >
                <div style={{ width: "100%", height: 205 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={modelData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={52}
                        outerRadius={78}
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
                        formatter={(value: number | string) => [
                          formatNumber(Number(value)),
                          "SPK"
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                      gap: 12,
                      paddingBottom: 8,
                      marginBottom: 6,
                      borderBottom: "1px solid #eef1f6"
                    }}
                  >
                    <span style={{ fontSize: 11, color: "#7f89a1" }}>Total SPK</span>
                    <strong style={{ fontSize: 15, color: "#1d2942" }}>
                      {formatNumber(modelDataTotal)}
                    </strong>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gap: 7,
                      maxHeight: 170,
                      overflowY: "auto",
                      paddingRight: 4
                    }}
                  >
                    {modelData.length ? (
                      modelData.map((row, index) => {
                        const share = modelDataTotal
                          ? (row.value / modelDataTotal) * 100
                          : 0;

                        return (
                          <div
                            key={row.name}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "10px minmax(0, 1fr) auto",
                              gap: 7,
                              alignItems: "center"
                            }}
                          >
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: PIE_COLORS[index % PIE_COLORS.length]
                              }}
                            />
                            <span
                              title={row.name}
                              style={{
                                minWidth: 0,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                fontSize: 10.5,
                                color: "#59637b"
                              }}
                            >
                              {row.name}
                            </span>
                            <span
                              style={{
                                textAlign: "right",
                                fontSize: 10.5,
                                color: "#26324b",
                                whiteSpace: "nowrap"
                              }}
                            >
                              <strong>{formatNumber(row.value)}</strong>{" "}
                              <span style={{ color: "#8c95aa" }}>
                                ({share.toFixed(1)}%)
                              </span>
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <span style={{ fontSize: 11, color: "#8c95aa" }}>
                        No SPK breakdown data.
                      </span>
                    )}
                  </div>
                </div>
              </div>

            </article>



            <article className={styles.chartPanel}>

              <div className={styles.panelHead}>

                <div>

                  <h3>Budget Composition</h3>

                  <p>

                    Dynamic budget categories from detail rows.

                  </p>

                </div>

              </div>



              <div
                className={styles.chartBox}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(150px, 0.9fr) minmax(190px, 1.1fr)",
                  gap: 16,
                  alignItems: "center"
                }}
              >
                <div style={{ width: "100%", height: 205 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={budgetData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={52}
                        outerRadius={78}
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
                        formatter={(value: number | string) => [
                          formatCurrency(Number(value)),
                          "Budget"
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                      gap: 12,
                      paddingBottom: 8,
                      marginBottom: 6,
                      borderBottom: "1px solid #eef1f6"
                    }}
                  >
                    <span style={{ fontSize: 11, color: "#7f89a1" }}>Total Budget</span>
                    <strong style={{ fontSize: 13, color: "#1d2942", textAlign: "right" }}>
                      {formatCurrency(budgetDataTotal)}
                    </strong>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gap: 7,
                      maxHeight: 170,
                      overflowY: "auto",
                      paddingRight: 4
                    }}
                  >
                    {budgetData.length ? (
                      budgetData.map((row, index) => {
                        const share = budgetDataTotal
                          ? (row.value / budgetDataTotal) * 100
                          : 0;

                        return (
                          <div
                            key={row.name}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "10px minmax(0, 1fr) auto",
                              gap: 7,
                              alignItems: "center"
                            }}
                          >
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: PIE_COLORS[index % PIE_COLORS.length]
                              }}
                            />
                            <span
                              title={row.name}
                              style={{
                                minWidth: 0,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                fontSize: 10,
                                color: "#59637b"
                              }}
                            >
                              {row.name}
                            </span>
                            <span
                              style={{
                                textAlign: "right",
                                fontSize: 9.5,
                                color: "#26324b",
                                whiteSpace: "nowrap"
                              }}
                            >
                              <strong>{formatCompact(row.value)}</strong>{" "}
                              <span style={{ color: "#8c95aa" }}>
                                ({share.toFixed(1)}%)
                              </span>
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <span style={{ fontSize: 11, color: "#8c95aa" }}>
                        No budget breakdown data.
                      </span>
                    )}
                  </div>
                </div>
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

                <ResponsiveContainer

                  width="100%"

                  height="100%"

                >

                  <ComposedChart data={performanceData}>

                    <CartesianGrid

                      strokeDasharray="4 4"

                      vertical={false}

                      stroke="#e9edf5"

                    />



                    <XAxis

                      dataKey="name"

                      tick={{

                        fontSize: 8,

                        fill: "#7f89a1"

                      }}

                      axisLine={false}

                      tickLine={false}

                    />



                    <YAxis

                      yAxisId="left"

                      tick={{

                        fontSize: 8,

                        fill: "#7f89a1"

                      }}

                      axisLine={false}

                      tickLine={false}

                    />



                    <YAxis

                      yAxisId="right"

                      orientation="right"

                      tickFormatter={(value) =>

                        formatCompact(Number(value))

                      }

                      tick={{

                        fontSize: 8,

                        fill: "#7f89a1"

                      }}

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

                <ResponsiveContainer

                  width="100%"

                  height="100%"

                >

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

                      tick={{

                        fontSize: 8,

                        fill: "#7f89a1"

                      }}

                    />



                    <YAxis

                      type="category"

                      dataKey="name"

                      axisLine={false}

                      tickLine={false}

                      width={95}

                      tick={{

                        fontSize: 8,

                        fill: "#59637b"

                      }}

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

                <ResponsiveContainer

                  width="100%"

                  height="100%"

                >

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

                      tick={{

                        fontSize: 8,

                        fill: "#7f89a1"

                      }}

                    />



                    <YAxis

                      axisLine={false}

                      tickLine={false}

                      tick={{

                        fontSize: 8,

                        fill: "#7f89a1"

                      }}

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



              <div className={styles.efficiencyList}>

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

                    className={styles.efficiencyRow}

                    key={label}

                  >

                    <span>{label}</span>

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

                  <p>

                    AI interpretation of the current source data.

                  </p>

                </div>

              </div>



              {ai?.key_insights?.length ? (

                ai.key_insights.map((item, index) => (

                  <div

                    className={styles.insightItem}

                    key={`${item.title}-${index}`}

                  >

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

                <p className={styles.aiMuted}>

                  {aiLoading

                    ? "Analyzing..."

                    : "No AI insights yet."}

                </p>

              )}

            </article>



            <div className={styles.aiSideStack}>

              <article className={styles.recommendations}>

                <div className={styles.panelHead}>

                  <div>

                    <h3>AI Recommendations</h3>

                    <p>

                      Prioritized planning actions.

                    </p>

                  </div>

                </div>



                <ul>

                  {(ai?.recommendations || []).map(

                    (item, index) => (

                      <li key={index}>

                        <span>✓</span>

                        <div>{item}</div>

                      </li>

                    )

                  )}

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

                  {(ai?.data_quality || []).map(

                    (item, index) => (

                      <li key={index}>

                        <span>!</span>

                        <div>{item}</div>

                      </li>

                    )

                  )}



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

    </div>

  );

}
