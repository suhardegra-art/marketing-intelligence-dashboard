export type AnnualEventSpkItem = {
  model: string;
  qty: number;
};

export type AnnualEventBudgetItem = {
  category: string;
  amount: number;
};

export type AnnualBigEvent = {
  id: string;
  startDate: string;
  endDate: string;
  eventName: string;
  city: string;
  location: string;
  activity: string;
  area: string;
  mediaPosting: number;
  footTraffic: number;
  testRide: number;
  totalSpk: number;
  totalBudget: number;
  sppLink: string | null;
  quotationLink: string | null;
  spkBreakdown: AnnualEventSpkItem[];
  budgetBreakdown: AnnualEventBudgetItem[];
  spkBreakdownTotal: number;
  budgetBreakdownTotal: number;
  testRideToSpk: number;
  trafficToTestRide: number;
  costPerSpk: number;
  costPerTestRide: number;
  status: string;
  year: number | null;
  dataQuality: {
    spkMatches: boolean;
    budgetMatches: boolean;
    spkGap: number;
    budgetGap: number;
  };
};

export type AnnualBigEventData = {
  connected: boolean;
  sourceName: string;
  sheetName: string;
  fetchedAt: string;
  dataVersion: string;
  events: AnnualBigEvent[];
  summary: {
    totalEvents: number;
    totalBudget: number;
    totalSpk: number;
    totalTestRide: number;
    totalFootTraffic: number;
    totalMediaPosting: number;
    trafficToTestRide: number;
    testRideToSpk: number;
    costPerSpk: number;
    costPerTestRide: number;
  };
  error?: string;
};

type SheetPayload = {
  ok?: boolean;
  spreadsheetName?: string;
  sheetName?: string;
  fetchedAt?: string;
  dataVersion?: string;
  values?: unknown[][];
  error?: string;
};

const DEFAULT_SHEET_NAME = "Anual Big Event";

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function safeString(value: unknown) {
  return String(value ?? "").trim();
}

function parseNumber(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const raw = String(value ?? "").trim();
  if (!raw) return 0;

  const cleaned = raw
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(/,(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseCurrency(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return 0;

  const digits = raw.replace(/[^\d-]/g, "");
  const parsed = Number(digits);

  return Number.isFinite(parsed) ? parsed : 0;
}

function toIsoDate(value: unknown) {
  const raw = safeString(value);
  if (!raw) return "";

  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) {
    return direct.toISOString().slice(0, 10);
  }

  return raw;
}

function yearFromDate(value: string) {
  const match = value.match(/^(\d{4})-/);
  return match ? Number(match[1]) : null;
}

function eventStatus(startDate: string, endDate: string) {
  const today = new Date();
  const todayKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(today);

  if (endDate && endDate < todayKey) return "Completed" as const;
  if (startDate && startDate > todayKey) return "Upcoming" as const;
  return "Ongoing" as const;
}

function pct(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return (numerator / denominator) * 100;
}

function hashString(input: string) {
  let hash = 2166136261;

  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function headerIndex(headers: string[], names: string[]) {
  for (const name of names) {
    const index = headers.indexOf(name);
    if (index >= 0) return index;
  }
  return -1;
}

export function normalizeAnnualBigEventRows(
  rows: unknown[][],
  meta?: {
    sourceName?: string;
    sheetName?: string;
    fetchedAt?: string;
    dataVersion?: string;
  }
): AnnualBigEventData {
  const safeRows = Array.isArray(rows) ? rows : [];
  const headerRow = (safeRows[0] || []).map(normalizeHeader);

  const ix = {
    startDate: headerIndex(headerRow, ["tanggal", "date", "start date"]),
    eventName: headerIndex(headerRow, ["nama event", "event name"]),
    status: headerIndex(headerRow, ["status"]),
    city: headerIndex(headerRow, ["kota", "city"]),
    location: headerIndex(headerRow, ["location", "lokasi"]),
    endDate: headerIndex(headerRow, ["finished event", "end date", "tanggal selesai"]),
    activity: headerIndex(headerRow, ["activity", "aktivitas"]),
    area: headerIndex(headerRow, ["luas lahan", "area"]),
    mediaPosting: headerIndex(headerRow, ["media posting"]),
    footTraffic: headerIndex(headerRow, ["foot traffic"]),
    testRide: headerIndex(headerRow, ["test ride"]),
    spkLabel: headerIndex(headerRow, ["spk"]),
    budgetLabel: headerIndex(headerRow, ["budget"]),
    sppLink: headerIndex(headerRow, ["spp link"]),
    quotation: headerIndex(headerRow, ["quotation"])
  };

  const required = [ix.eventName, ix.spkLabel, ix.budgetLabel];

  if (required.some((index) => index < 0)) {
    throw new Error(
      "Required headers were not found. Expected at least: Nama Event, SPK, and Budget."
    );
  }

  const spkQtyIndex = ix.spkLabel + 1;
  const budgetAmountIndex = ix.budgetLabel + 1;

  const events: AnnualBigEvent[] = [];
  let current: AnnualBigEvent | null = null;

  const pushCurrent = () => {
    if (!current) return;

    current.spkBreakdownTotal = current.spkBreakdown.reduce(
      (sum, item) => sum + item.qty,
      0
    );

    current.budgetBreakdownTotal = current.budgetBreakdown.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    current.testRideToSpk = pct(current.totalSpk, current.testRide);
    current.trafficToTestRide = pct(current.testRide, current.footTraffic);
    current.costPerSpk = current.totalSpk
      ? current.totalBudget / current.totalSpk
      : 0;
    current.costPerTestRide = current.testRide
      ? current.totalBudget / current.testRide
      : 0;

    current.dataQuality = {
      spkMatches: current.spkBreakdownTotal === current.totalSpk,
      budgetMatches:
        current.budgetBreakdownTotal === current.totalBudget,
      spkGap: current.spkBreakdownTotal - current.totalSpk,
      budgetGap: current.budgetBreakdownTotal - current.totalBudget
    };

    events.push(current);
    current = null;
  };

  for (let rowIndex = 1; rowIndex < safeRows.length; rowIndex += 1) {
    const row = safeRows[rowIndex] || [];
    const eventName = safeString(row[ix.eventName]);

    if (eventName) {
      pushCurrent();

      const startDate = toIsoDate(
        ix.startDate >= 0 ? row[ix.startDate] : ""
      );
      const endDate = toIsoDate(ix.endDate >= 0 ? row[ix.endDate] : "");

      const totalSpk =
        normalizeHeader(row[ix.spkLabel]) === "total spk"
          ? parseNumber(row[spkQtyIndex])
          : parseNumber(row[spkQtyIndex]);

      const totalBudget =
        normalizeHeader(row[ix.budgetLabel]) === "total budget"
          ? parseCurrency(row[budgetAmountIndex])
          : parseCurrency(row[budgetAmountIndex]);

      current = {
        id: `${slugify(eventName)}-${startDate || rowIndex}`,
        startDate,
        endDate,
        eventName,
        city: safeString(ix.city >= 0 ? row[ix.city] : ""),
        location: safeString(ix.location >= 0 ? row[ix.location] : ""),
        activity: safeString(ix.activity >= 0 ? row[ix.activity] : ""),
        area: safeString(ix.area >= 0 ? row[ix.area] : ""),
        mediaPosting: parseNumber(
          ix.mediaPosting >= 0 ? row[ix.mediaPosting] : 0
        ),
        footTraffic: parseNumber(
          ix.footTraffic >= 0 ? row[ix.footTraffic] : 0
        ),
        testRide: parseNumber(ix.testRide >= 0 ? row[ix.testRide] : 0),
        totalSpk,
        totalBudget,
        sppLink:
          ix.sppLink >= 0 && safeString(row[ix.sppLink])
            ? safeString(row[ix.sppLink])
            : null,
        quotationLink:
          ix.quotation >= 0 && safeString(row[ix.quotation])
            ? safeString(row[ix.quotation])
            : null,
        spkBreakdown: [],
        budgetBreakdown: [],
        spkBreakdownTotal: 0,
        budgetBreakdownTotal: 0,
        testRideToSpk: 0,
        trafficToTestRide: 0,
        costPerSpk: 0,
        costPerTestRide: 0,
        status:
          ix.status >= 0 && safeString(row[ix.status])
            ? safeString(row[ix.status])
            : eventStatus(startDate, endDate),
        year: yearFromDate(startDate),
        dataQuality: {
          spkMatches: true,
          budgetMatches: true,
          spkGap: 0,
          budgetGap: 0
        }
      };

      continue;
    }

    if (!current) continue;

    const spkLabel = safeString(row[ix.spkLabel]);
    const spkQty = parseNumber(row[spkQtyIndex]);

    if (
      spkLabel &&
      normalizeHeader(spkLabel) !== "total spk" &&
      spkQty !== 0
    ) {
      current.spkBreakdown.push({
        model: spkLabel,
        qty: spkQty
      });
    }

    const budgetLabel = safeString(row[ix.budgetLabel]);
    const budgetAmount = parseCurrency(row[budgetAmountIndex]);

    if (
      budgetLabel &&
      normalizeHeader(budgetLabel) !== "total budget" &&
      budgetAmount !== 0
    ) {
      current.budgetBreakdown.push({
        category: budgetLabel,
        amount: budgetAmount
      });
    }
  }

  pushCurrent();

  const totalBudget = events.reduce(
    (sum, event) => sum + event.totalBudget,
    0
  );
  const totalSpk = events.reduce(
    (sum, event) => sum + event.totalSpk,
    0
  );
  const totalTestRide = events.reduce(
    (sum, event) => sum + event.testRide,
    0
  );
  const totalFootTraffic = events.reduce(
    (sum, event) => sum + event.footTraffic,
    0
  );
  const totalMediaPosting = events.reduce(
    (sum, event) => sum + event.mediaPosting,
    0
  );

  const version =
    meta?.dataVersion ||
    hashString(JSON.stringify(safeRows));

  return {
    connected: true,
    sourceName: meta?.sourceName || "Marketing Event Detail Report",
    sheetName: meta?.sheetName || DEFAULT_SHEET_NAME,
    fetchedAt: meta?.fetchedAt || new Date().toISOString(),
    dataVersion: version,
    events,
    summary: {
      totalEvents: events.length,
      totalBudget,
      totalSpk,
      totalTestRide,
      totalFootTraffic,
      totalMediaPosting,
      trafficToTestRide: pct(totalTestRide, totalFootTraffic),
      testRideToSpk: pct(totalSpk, totalTestRide),
      costPerSpk: totalSpk ? totalBudget / totalSpk : 0,
      costPerTestRide: totalTestRide
        ? totalBudget / totalTestRide
        : 0
    }
  };
}

export async function getAnnualBigEventData(): Promise<AnnualBigEventData> {
  const apiUrl = process.env.ANNUAL_EVENT_SHEET_API_URL;
  const secret = process.env.ANNUAL_EVENT_SHEET_API_SECRET;

  if (!apiUrl || !secret) {
    return {
      connected: false,
      sourceName: "Marketing Event Detail Report",
      sheetName: DEFAULT_SHEET_NAME,
      fetchedAt: new Date().toISOString(),
      dataVersion: "",
      events: [],
      summary: {
        totalEvents: 0,
        totalBudget: 0,
        totalSpk: 0,
        totalTestRide: 0,
        totalFootTraffic: 0,
        totalMediaPosting: 0,
        trafficToTestRide: 0,
        testRideToSpk: 0,
        costPerSpk: 0,
        costPerTestRide: 0
      },
      error:
        "ANNUAL_EVENT_SHEET_API_URL and ANNUAL_EVENT_SHEET_API_SECRET are not configured."
    };
  }

  try {
    const url = new URL(apiUrl);
    url.searchParams.set("key", secret);
    url.searchParams.set("_t", String(Date.now()));

    const response = await fetch(url.toString(), {
      cache: "no-store",
      headers: {
        Accept: "application/json"
      }
    });

    const text = await response.text();

    let payload: SheetPayload;

    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(
        `Google Sheet API returned non-JSON response (${response.status}).`
      );
    }

    if (!response.ok || payload.ok === false) {
      throw new Error(
        payload.error ||
          `Google Sheet API returned HTTP ${response.status}.`
      );
    }

    return normalizeAnnualBigEventRows(payload.values || [], {
      sourceName: payload.spreadsheetName || "Marketing Event Detail Report",
      sheetName: payload.sheetName || DEFAULT_SHEET_NAME,
      fetchedAt: payload.fetchedAt || new Date().toISOString(),
      dataVersion: payload.dataVersion
    });
  } catch (error) {
    return {
      connected: false,
      sourceName: "Marketing Event Detail Report",
      sheetName: DEFAULT_SHEET_NAME,
      fetchedAt: new Date().toISOString(),
      dataVersion: "",
      events: [],
      summary: {
        totalEvents: 0,
        totalBudget: 0,
        totalSpk: 0,
        totalTestRide: 0,
        totalFootTraffic: 0,
        totalMediaPosting: 0,
        trafficToTestRide: 0,
        testRideToSpk: 0,
        costPerSpk: 0,
        costPerTestRide: 0
      },
      error:
        error instanceof Error
          ? error.message
          : "Unable to load Annual Big Event data."
    };
  }
}
