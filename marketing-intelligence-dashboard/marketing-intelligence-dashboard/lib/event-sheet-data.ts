import type {
  AnnualBigEvent,
  AnnualBigEventData,
  AnnualEventBudgetItem,
  AnnualEventSpkItem
} from "@/lib/annual-big-event";

type SheetPayload = {
  ok?: boolean;
  spreadsheetName?: string;
  sheetName?: string;
  fetchedAt?: string;
  dataVersion?: string;
  values?: unknown[][];
  error?: string;
};

const MONTHS: Record<string, number> = {
  januari: 1,
  january: 1,
  februari: 2,
  february: 2,
  maret: 3,
  march: 3,
  april: 4,
  mei: 5,
  may: 5,
  juni: 6,
  june: 6,
  juli: 7,
  july: 7,
  agustus: 8,
  august: 8,
  september: 9,
  oktober: 10,
  october: 10,
  november: 11,
  desember: 12,
  december: 12
};

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

  const match = raw.replace(/\./g, "").replace(/,/g, ".").match(/-?\d+(?:\.\d+)?/);
  if (!match) return 0;

  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseCurrency(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const raw = String(value ?? "").trim();
  if (!raw) return 0;

  const digits = raw.replace(/[^\d-]/g, "");
  const parsed = Number(digits);
  return Number.isFinite(parsed) ? parsed : 0;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function isoDate(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function monthNumber(value: string) {
  return MONTHS[value.trim().toLowerCase()] || 0;
}

function parseDateRange(value: unknown) {
  const raw = safeString(value);
  if (!raw) return { startDate: "", endDate: "" };

  const normalized = raw
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  // Example: 19 Maret - 6 April 2025
  let match = normalized.match(
    /(\d{1,2})\s+([A-Za-z]+)\s*-\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i
  );

  if (match) {
    const startMonth = monthNumber(match[2]);
    const endMonth = monthNumber(match[4]);
    const year = Number(match[5]);

    if (startMonth && endMonth) {
      return {
        startDate: isoDate(year, startMonth, Number(match[1])),
        endDate: isoDate(year, endMonth, Number(match[3]))
      };
    }
  }

  // Examples: 5-17 Mei 2026 / 13 - 23 February 2025
  match = normalized.match(
    /(\d{1,2})\s*-\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i
  );

  if (match) {
    const month = monthNumber(match[3]);
    const year = Number(match[4]);

    if (month) {
      return {
        startDate: isoDate(year, month, Number(match[1])),
        endDate: isoDate(year, month, Number(match[2]))
      };
    }
  }

  // Example: 6 Februari 2025
  match = normalized.match(
    /(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i
  );

  if (match) {
    const month = monthNumber(match[2]);
    const year = Number(match[3]);

    if (month) {
      const date = isoDate(year, month, Number(match[1]));
      return { startDate: date, endDate: date };
    }
  }

  const fallback = new Date(raw);
  if (!Number.isNaN(fallback.getTime())) {
    const date = fallback.toISOString().slice(0, 10);
    return { startDate: date, endDate: date };
  }

  return { startDate: "", endDate: "" };
}

function yearFromDate(value: string) {
  const match = value.match(/^(\d{4})-/);
  return match ? Number(match[1]) : null;
}

function eventStatus(startDate: string, endDate: string) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());

  if (endDate && endDate < today) return "Completed";
  if (startDate && startDate > today) return "Upcoming";
  return "Ongoing";
}

function pct(numerator: number, denominator: number) {
  return denominator ? (numerator / denominator) * 100 : 0;
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

function findHeaderIndex(headers: string[], candidates: string[]) {
  for (const candidate of candidates) {
    const exact = headers.indexOf(candidate);
    if (exact >= 0) return exact;
  }

  for (let i = 0; i < headers.length; i += 1) {
    if (candidates.some((candidate) => headers[i].includes(candidate))) {
      return i;
    }
  }

  return -1;
}

function cleanSpkLabel(header: string) {
  return header
    .replace(/^spk\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanBudgetLabel(header: string) {
  return header
    .replace(/^budget\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function inferCity(eventName: string, location: string) {
  const regional = eventName.match(/^Regional Launching\s+(.+)$/i);
  if (regional) return regional[1].trim();

  const knownCities = [
    "Jakarta",
    "Bandung",
    "Surabaya",
    "Medan",
    "Solo",
    "Makassar",
    "Bali",
    "Semarang",
    "Padang",
    "Balikpapan",
    "Yogyakarta",
    "Palembang",
    "BSD",
    "Tangerang"
  ];

  const haystack = `${eventName} ${location}`.toLowerCase();
  const city = knownCities.find((name) =>
    haystack.includes(name.toLowerCase())
  );

  return city || "";
}

function emptyData(sheetName: string, error?: string): AnnualBigEventData {
  return {
    connected: false,
    sourceName: "Marketing Event Detail Report",
    sheetName,
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
    error
  };
}

export function normalizeWideEventRows(
  rows: unknown[][],
  meta: {
    sourceName?: string;
    sheetName: string;
    fetchedAt?: string;
    dataVersion?: string;
  }
): AnnualBigEventData {
  const safeRows = Array.isArray(rows) ? rows : [];

  const headerRowIndex = safeRows.findIndex((row) =>
    (row || []).some((cell) => {
      const header = normalizeHeader(cell);
      return header === "event name" || header === "nama event";
    })
  );

  if (headerRowIndex < 0) {
    throw new Error(
      `Header "Event Name" was not found in sheet "${meta.sheetName}".`
    );
  }

  const rawHeaders = (safeRows[headerRowIndex] || []).map((value) =>
    safeString(value).replace(/\s+/g, " ").trim()
  );
  const headers = rawHeaders.map(normalizeHeader);

  const ix = {
    eventName: findHeaderIndex(headers, ["event name", "nama event"]),
    location: findHeaderIndex(headers, ["location", "lokasi"]),
    date: findHeaderIndex(headers, ["date", "tanggal"]),
    activity: findHeaderIndex(headers, ["activity", "aktivitas"]),
    area: findHeaderIndex(headers, ["luas lahan", "area"]),
    mediaPosting: findHeaderIndex(headers, [
      "total media invitation / posting",
      "media invitation / posting",
      "media posting"
    ]),
    footTraffic: findHeaderIndex(headers, ["foot traffic"]),
    testRide: findHeaderIndex(headers, ["test ride"]),
    totalSpk: findHeaderIndex(headers, ["total spk"]),
    totalBudget: findHeaderIndex(headers, [
      "keseluruhan budget",
      "total budget"
    ]),
    sppLink: findHeaderIndex(headers, ["spp link"]),
    quotation: findHeaderIndex(headers, ["quotation"])
  };

  if (ix.eventName < 0) {
    throw new Error(
      `Required Event Name column was not found in sheet "${meta.sheetName}".`
    );
  }

  const spkColumns = headers
    .map((header, index) => ({ header, index }))
    .filter(
      (item) =>
        item.header.startsWith("spk ") &&
        item.header !== "total spk"
    );

  const budgetColumns = headers
    .map((header, index) => ({ header, index }))
    .filter(
      (item) =>
        item.header.startsWith("budget ") &&
        item.header !== "total budget"
    );

  const events: AnnualBigEvent[] = [];

  for (
    let rowIndex = headerRowIndex + 1;
    rowIndex < safeRows.length;
    rowIndex += 1
  ) {
    const row = safeRows[rowIndex] || [];
    const eventName = safeString(row[ix.eventName]);

    if (!eventName) continue;

    const location =
      ix.location >= 0 ? safeString(row[ix.location]) : "";
    const dateValue = ix.date >= 0 ? row[ix.date] : "";
    const { startDate, endDate } = parseDateRange(dateValue);

    const spkBreakdown: AnnualEventSpkItem[] = spkColumns
      .map(({ index }) => ({
        model: cleanSpkLabel(rawHeaders[index]),
        qty: parseNumber(row[index])
      }))
      .filter((item) => item.model && item.qty !== 0);

    const spkBreakdownTotal = spkBreakdown.reduce(
      (sum, item) => sum + item.qty,
      0
    );

    const explicitTotalSpk =
      ix.totalSpk >= 0 ? parseNumber(row[ix.totalSpk]) : 0;
    const totalSpk =
      ix.totalSpk >= 0 ? explicitTotalSpk : spkBreakdownTotal;

    let budgetBreakdown: AnnualEventBudgetItem[] = budgetColumns
      .map(({ index }) => ({
        category: cleanBudgetLabel(rawHeaders[index]),
        amount: parseCurrency(row[index])
      }))
      .filter((item) => item.category && item.amount !== 0);

    let budgetBreakdownTotal = budgetBreakdown.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    const explicitTotalBudget =
      ix.totalBudget >= 0 ? parseCurrency(row[ix.totalBudget]) : 0;

    const totalBudget =
      ix.totalBudget >= 0 ? explicitTotalBudget : budgetBreakdownTotal;

    // Some launching rows only contain the declared overall budget.
    // Preserve that value as a one-line breakdown so the composition chart
    // and detail validation remain useful.
    if (
      totalBudget > 0 &&
      budgetBreakdown.length === 0
    ) {
      budgetBreakdown = [
        {
          category: "Existing Total Budget",
          amount: totalBudget
        }
      ];
      budgetBreakdownTotal = totalBudget;
    }

    const footTraffic =
      ix.footTraffic >= 0 ? parseNumber(row[ix.footTraffic]) : 0;
    const testRide =
      ix.testRide >= 0 ? parseNumber(row[ix.testRide]) : 0;
    const mediaPosting =
      ix.mediaPosting >= 0 ? parseNumber(row[ix.mediaPosting]) : 0;

    const event: AnnualBigEvent = {
      id: `${slugify(eventName)}-${startDate || rowIndex}`,
      startDate,
      endDate,
      eventName,
      city: inferCity(eventName, location),
      location,
      activity:
        ix.activity >= 0 ? safeString(row[ix.activity]) : "",
      area:
        ix.area >= 0 ? safeString(row[ix.area]) : "",
      mediaPosting,
      footTraffic,
      testRide,
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
      spkBreakdown,
      budgetBreakdown,
      spkBreakdownTotal,
      budgetBreakdownTotal,
      testRideToSpk: pct(totalSpk, testRide),
      trafficToTestRide: pct(testRide, footTraffic),
      costPerSpk: totalSpk ? totalBudget / totalSpk : 0,
      costPerTestRide: testRide ? totalBudget / testRide : 0,
      status: eventStatus(startDate, endDate),
      year: yearFromDate(startDate),
      dataQuality: {
        spkMatches:
          ix.totalSpk < 0 || spkBreakdownTotal === totalSpk,
        budgetMatches:
          ix.totalBudget < 0 || budgetBreakdownTotal === totalBudget,
        spkGap:
          ix.totalSpk < 0 ? 0 : spkBreakdownTotal - totalSpk,
        budgetGap:
          ix.totalBudget < 0 ? 0 : budgetBreakdownTotal - totalBudget
      }
    };

    events.push(event);
  }

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

  return {
    connected: true,
    sourceName:
      meta.sourceName || "Marketing Event Detail Report",
    sheetName: meta.sheetName,
    fetchedAt: meta.fetchedAt || new Date().toISOString(),
    dataVersion:
      meta.dataVersion || hashString(JSON.stringify(safeRows)),
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

export async function getEventSheetData(
  sheetName: string
): Promise<AnnualBigEventData> {
  const apiUrl = process.env.ANNUAL_EVENT_SHEET_API_URL;
  const secret = process.env.ANNUAL_EVENT_SHEET_API_SECRET;

  if (!apiUrl || !secret) {
    return emptyData(
      sheetName,
      "ANNUAL_EVENT_SHEET_API_URL and ANNUAL_EVENT_SHEET_API_SECRET are not configured."
    );
  }

  try {
    const url = new URL(apiUrl);
    url.searchParams.set("key", secret);
    url.searchParams.set("sheet", sheetName);
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

    return normalizeWideEventRows(payload.values || [], {
      sourceName:
        payload.spreadsheetName || "Marketing Event Detail Report",
      sheetName: payload.sheetName || sheetName,
      fetchedAt: payload.fetchedAt || new Date().toISOString(),
      dataVersion: payload.dataVersion
    });
  } catch (error) {
    return emptyData(
      sheetName,
      error instanceof Error
        ? error.message
        : `Unable to load ${sheetName} data.`
    );
  }
}
