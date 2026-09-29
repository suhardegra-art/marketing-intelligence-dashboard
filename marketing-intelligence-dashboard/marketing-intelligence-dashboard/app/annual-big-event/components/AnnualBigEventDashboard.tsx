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



type SortDirection = "asc" | "desc";

type EventSortKey =
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
  | "budget";

type SortKind = "text" | "date" | "number" | "area";

const EVENTS_PER_PAGE = 10;

function defaultDirection(kind: SortKind): SortDirection {
  return kind === "number" || kind === "area" ? "desc" : "asc";
}

function compareText(
  a: string | null | undefined,
  b: string | null | undefined,
  direction: SortDirection
) {
  const result = String(a || "").localeCompare(
    String(b || ""),
    undefined,
    {
      sensitivity: "base",
      numeric: true
    }
  );

  return direction === "asc" ? result : -result;
}

function compareNumber(
  a: number,
  b: number,
  direction: SortDirection
) {
  const result = Number(a || 0) - Number(b || 0);
  return direction === "asc" ? result : -result;
}

function dateValue(value: string) {
  if (!value) return 0;

  const iso = value.slice(0, 10);
  const time = Date.parse(`${iso}T00:00:00Z`);

  return Number.isFinite(time) ? time : 0;
}

function compareDate(
  a: string,
  b: string,
  direction: SortDirection
) {
  const result = dateValue(a) - dateValue(b);
  return direction === "asc" ? result : -result;
}

function areaValue(value: string) {
  const match = String(value || "")
    .replace(/,/g, ".")
    .match(/-?\d+(?:\.\d+)?/);

  return match ? Number(match[0]) : Number.NaN;
}

function compareArea(
  a: string,
  b: string,
  direction: SortDirection
) {
  const aNumber = areaValue(a);
  const bNumber = areaValue(b);

  if (
    Number.isFinite(aNumber) &&
    Number.isFinite(bNumber)
  ) {
    const result = aNumber - bNumber;
    return direction === "asc" ? result : -result;
  }

  return compareText(a, b, direction);
}

function sortOptionLabels(kind: SortKind) {
  if (kind === "text") {
    return {
      asc: "A → Z",
      desc: "Z → A"
    };
  }

  if (kind === "date") {
    return {
      asc: "Oldest → Newest",
      desc: "Newest → Oldest"
    };
  }

  return {
    asc: "Lowest → Highest",
    desc: "Highest → Lowest"
  };
}

function SortHeader({
  label,
  sortKey,
  kind,
  activeKey,
  direction,
  onSort,
  minWidth = 110
}: {
  label: string;
  sortKey: EventSortKey;
  kind: SortKind;
  activeKey: EventSortKey;
  direction: SortDirection;
  onSort: (
    key: EventSortKey,
    direction: SortDirection
  ) => void;
  minWidth?: number;
}) {
  const active = activeKey === sortKey;
  const labels = sortOptionLabels(kind);

  return (
    <th
      style={{
        minWidth,
        verticalAlign: "middle",
        whiteSpace: "nowrap"
      }}
    >
      <span>{label}</span>

      <select
        value={active ? direction : ""}
        onChange={(event) => {
          const value = event.target.value;

          if (
            value === "asc" ||
            value === "desc"
          ) {
            onSort(
              sortKey,
              value as SortDirection
            );
          }
        }}
        aria-label={`Sort ${label}`}
        title="Sort column"
        style={{
          marginLeft: 6,
          height: 24,
          maxWidth: 30,
          border: "1px solid #dce1ef",
          borderRadius: 6,
          background: "#fff",
          color: "#59617a",
          fontSize: 10,
          cursor: "pointer",
          verticalAlign: "middle",
          padding: "0 2px"
        }}
      >
        <option value="">Sort</option>
        <option value="asc">
          {labels.asc}
        </option>
        <option value="desc">
          {labels.desc}
        </option>
      </select>
    </th>
  );
}



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
  | "quotation"
  | "documentation";

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
  documentation: LinkAvailability;
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
  quotation: "ALL",
  documentation: "ALL"
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

    "Quotation",

    "Dokumentasi"

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

    event.quotationLink || "",

    event.documentationLink || ""

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

  const [sortKey, setSortKey] =
    useState<EventSortKey>("startDate");

  const [sortDirection, setSortDirection] =
    useState<SortDirection>("desc");

  const [currentPage, setCurrentPage] =
    useState(1);

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
          event.activity,
          event.area
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

  function handleSort(
    key: EventSortKey,
    direction: SortDirection
  ) {
    setCurrentPage(1);
    setSortKey(key);
    setSortDirection(direction);
  }

  const sortedEvents = useMemo(() => {
    const rows = [...filteredEvents];

    rows.sort((a, b) => {
      switch (sortKey) {
        case "startDate":
          return compareDate(
            a.startDate,
            b.startDate,
            sortDirection
          );

        case "eventName":
          return compareText(
            a.eventName,
            b.eventName,
            sortDirection
          );

        case "status":
          return compareText(
            a.status,
            b.status,
            sortDirection
          );

        case "city":
          return compareText(
            a.city,
            b.city,
            sortDirection
          );

        case "location":
          return compareText(
            a.location,
            b.location,
            sortDirection
          );

        case "endDate":
          return compareDate(
            a.endDate,
            b.endDate,
            sortDirection
          );

        case "activity":
          return compareText(
            a.activity,
            b.activity,
            sortDirection
          );

        case "area":
          return compareArea(
            a.area,
            b.area,
            sortDirection
          );

        case "mediaPosting":
          return compareNumber(
            a.mediaPosting,
            b.mediaPosting,
            sortDirection
          );

        case "footTraffic":
          return compareNumber(
            a.footTraffic,
            b.footTraffic,
            sortDirection
          );

        case "testRide":
          return compareNumber(
            a.testRide,
            b.testRide,
            sortDirection
          );

        case "spk":
          return compareNumber(
            a.totalSpk,
            b.totalSpk,
            sortDirection
          );

        case "budget":
          return compareNumber(
            a.totalBudget,
            b.totalBudget,
            sortDirection
          );

        default:
          return 0;
      }
    });

    return rows;
  }, [
    filteredEvents,
    sortKey,
    sortDirection
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      sortedEvents.length /
        EVENTS_PER_PAGE
    )
  );

  const pagedEvents = useMemo(() => {
    const start =
      (currentPage - 1) *
      EVENTS_PER_PAGE;

    return sortedEvents.slice(
      start,
      start + EVENTS_PER_PAGE
    );
  }, [
    sortedEvents,
    currentPage
  ]);

  const pageNumbers = useMemo(() => {
    const maxVisible = 6;

    if (totalPages <= maxVisible) {
      return Array.from(
        { length: totalPages },
        (_, index) => index + 1
      );
    }

    let start = Math.max(
      1,
      currentPage - 2
    );

    let end = start + maxVisible - 1;

    if (end > totalPages) {
      end = totalPages;
      start = end - maxVisible + 1;
    }

    return Array.from(
      { length: end - start + 1 },
      (_, index) => start + index
    );
  }, [
    currentPage,
    totalPages
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    year,
    city,
    status
  ]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [
    currentPage,
    totalPages
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
      case "documentation":
        return columnFilters.documentation !== "ALL";
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

                onClick={() => exportCsv(sortedEvents, csvFileName)}

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
                  setSortKey("startDate");
                  setSortDirection("desc");
                  setCurrentPage(1);
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
                    <SortHeader
                      label="Tanggal"
                      sortKey="startDate"
                      kind="date"
                      activeKey={sortKey}
                      direction={sortDirection}
                      onSort={handleSort}
                      minWidth={138}
                    />

                    <SortHeader
                      label="Nama Event"
                      sortKey="eventName"
                      kind="text"
                      activeKey={sortKey}
                      direction={sortDirection}
                      onSort={handleSort}
                      minWidth={190}
                    />

                    <SortHeader
                      label="Status"
                      sortKey="status"
                      kind="text"
                      activeKey={sortKey}
                      direction={sortDirection}
                      onSort={handleSort}
                      minWidth={118}
                    />

                    <SortHeader
                      label="Kota"
                      sortKey="city"
                      kind="text"
                      activeKey={sortKey}
                      direction={sortDirection}
                      onSort={handleSort}
                      minWidth={122}
                    />

                    <SortHeader
                      label="Location"
                      sortKey="location"
                      kind="text"
                      activeKey={sortKey}
                      direction={sortDirection}
                      onSort={handleSort}
                      minWidth={175}
                    />

                    <SortHeader
                      label="Finished Event"
                      sortKey="endDate"
                      kind="date"
                      activeKey={sortKey}
                      direction={sortDirection}
                      onSort={handleSort}
                      minWidth={145}
                    />

                    <SortHeader
                      label="Activity"
                      sortKey="activity"
                      kind="text"
                      activeKey={sortKey}
                      direction={sortDirection}
                      onSort={handleSort}
                      minWidth={210}
                    />

                    <SortHeader
                      label="Luas Lahan"
                      sortKey="area"
                      kind="area"
                      activeKey={sortKey}
                      direction={sortDirection}
                      onSort={handleSort}
                      minWidth={120}
                    />

                    <SortHeader
                      label="Media Posting"
                      sortKey="mediaPosting"
                      kind="number"
                      activeKey={sortKey}
                      direction={sortDirection}
                      onSort={handleSort}
                      minWidth={128}
                    />

                    <SortHeader
                      label="Foot Traffic"
                      sortKey="footTraffic"
                      kind="number"
                      activeKey={sortKey}
                      direction={sortDirection}
                      onSort={handleSort}
                      minWidth={126}
                    />

                    <SortHeader
                      label="Test Ride"
                      sortKey="testRide"
                      kind="number"
                      activeKey={sortKey}
                      direction={sortDirection}
                      onSort={handleSort}
                      minWidth={116}
                    />

                    <SortHeader
                      label="SPK"
                      sortKey="spk"
                      kind="number"
                      activeKey={sortKey}
                      direction={sortDirection}
                      onSort={handleSort}
                      minWidth={102}
                    />

                    <SortHeader
                      label="Budget"
                      sortKey="budget"
                      kind="number"
                      activeKey={sortKey}
                      direction={sortDirection}
                      onSort={handleSort}
                      minWidth={140}
                    />

                    <th style={{ minWidth: 104 }}>
                      SPP LINK
                    </th>

                    <th style={{ minWidth: 110 }}>
                      QUOTATION
                    </th>

                    <th style={{ minWidth: 118 }}>
                      DOKUMENTASI
                    </th>
                  </tr>
                </thead>



                <tbody>

                  {sortedEvents.length === 0 ? (

                    <tr>

                      <td colSpan={16}>

                        No event data found.

                      </td>

                    </tr>

                  ) : (

                    pagedEvents.map((event) => {

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
                            <td>

                              {event.documentationLink ? (

                                <a

                                  className={styles.tableLink}

                                  href={event.documentationLink}

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

                              <td colSpan={16}>

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

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                flexWrap: "wrap",
                marginTop: 16,
                paddingTop: 14,
                borderTop: "1px solid #edf0f5"
              }}
            >
              <span
                style={{
                  color: "#8a93a9",
                  fontSize: 9,
                  fontWeight: 700
                }}
              >
                {sortedEvents.length
                  ? `Showing ${
                      (currentPage - 1) * EVENTS_PER_PAGE + 1
                    }–${Math.min(
                      currentPage * EVENTS_PER_PAGE,
                      sortedEvents.length
                    )} of ${sortedEvents.length} events`
                  : "Showing 0 events"}
              </span>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  flexWrap: "wrap"
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((current) =>
                      Math.max(1, current - 1)
                    )
                  }
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    border: "1px solid #d6deed",
                    background:
                      currentPage === 1
                        ? "#f4f6fa"
                        : "#ffffff",
                    color:
                      currentPage === 1
                        ? "#b7bfd0"
                        : "#1f2942",
                    fontSize: 18,
                    fontWeight: 900,
                    cursor:
                      currentPage === 1
                        ? "not-allowed"
                        : "pointer"
                  }}
                >
                  ‹
                </button>

                {pageNumbers.map((page) => (
                  <button
                    type="button"
                    key={page}
                    onClick={() =>
                      setCurrentPage(page)
                    }
                    aria-current={
                      currentPage === page
                        ? "page"
                        : undefined
                    }
                    style={{
                      minWidth: 34,
                      height: 34,
                      padding: "0 10px",
                      borderRadius: 999,
                      border:
                        currentPage === page
                          ? "1px solid #4963e6"
                          : "1px solid #d6deed",
                      background:
                        currentPage === page
                          ? "#4963e6"
                          : "#ffffff",
                      color:
                        currentPage === page
                          ? "#ffffff"
                          : "#1f2942",
                      fontSize: 11,
                      fontWeight: 900,
                      cursor: "pointer"
                    }}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((current) =>
                      Math.min(
                        totalPages,
                        current + 1
                      )
                    )
                  }
                  disabled={
                    currentPage === totalPages
                  }
                  aria-label="Next page"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    border: "1px solid #d6deed",
                    background:
                      currentPage === totalPages
                        ? "#f4f6fa"
                        : "#ffffff",
                    color:
                      currentPage === totalPages
                        ? "#b7bfd0"
                        : "#1f2942",
                    fontSize: 18,
                    fontWeight: 900,
                    cursor:
                      currentPage === totalPages
                        ? "not-allowed"
                        : "pointer"
                  }}
                >
                  ›
                </button>
              </div>
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
