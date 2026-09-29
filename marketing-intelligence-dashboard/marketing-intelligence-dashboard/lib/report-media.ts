export type ReportMediaPosting = {
  name: string;
  url: string | null;
};

export type ReportMediaEvent = {
  id: string;
  date: string;
  year: number | null;
  eventName: string;
  status: string;
  blastMedia: string[];
  totalBlast: number;
  mediaPosting: ReportMediaPosting[];
  totalPosting: number;
};

export type ReportMediaData = {
  connected: boolean;
  sourceName: string;
  sheetName: string;
  fetchedAt: string;
  dataVersion: string;
  events: ReportMediaEvent[];
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

const SHEET_NAME = "Report Media";

function safeString(value: unknown) {
  return String(value ?? "").trim();
}

function parseNumber(value: unknown) {
  const raw = safeString(value);
  if (!raw) return 0;

  const parsed = Number(
    raw.replace(/[^\d.-]/g, "")
  );

  return Number.isFinite(parsed) ? parsed : 0;
}

function yearFromDate(value: string) {
  const match = value.match(/\b(20\d{2})\b/);
  return match ? Number(match[1]) : null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function hashString(input: string) {
  let hash = 2166136261;

  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0)
    .toString(16)
    .padStart(8, "0");
}

export function normalizeReportMediaRows(
  rows: unknown[][],
  meta?: {
    sourceName?: string;
    sheetName?: string;
    fetchedAt?: string;
    dataVersion?: string;
  }
): ReportMediaData {
  const safeRows = Array.isArray(rows) ? rows : [];
  const events: ReportMediaEvent[] = [];

  let current: ReportMediaEvent | null = null;

  const pushCurrent = () => {
    if (!current) return;
    events.push(current);
    current = null;
  };

  for (
    let rowIndex = 1;
    rowIndex < safeRows.length;
    rowIndex += 1
  ) {
    const row = safeRows[rowIndex] || [];

    const date = safeString(row[0]);
    const eventName = safeString(row[1]);
    const status = safeString(row[2]);

    if (eventName) {
      pushCurrent();

      current = {
        id: `${slugify(eventName)}-${slugify(date)}-${rowIndex}`,
        date,
        year: yearFromDate(date),
        eventName,
        status,
        blastMedia: [],
        totalBlast: parseNumber(row[4]),
        mediaPosting: [],
        totalPosting: parseNumber(row[6])
      };

      continue;
    }

    if (!current) continue;

    const blastName = safeString(row[3]);

    if (
      blastName &&
      blastName.toLowerCase() !== "total blast media"
    ) {
      current.blastMedia.push(blastName);
    }

    const postingName = safeString(row[5]);
    const postingUrl = safeString(row[6]);

    if (
      postingName &&
      postingName.toLowerCase() !== "total media posting"
    ) {
      current.mediaPosting.push({
        name: postingName,
        url:
          /^https?:\/\//i.test(postingUrl)
            ? postingUrl
            : null
      });
    }
  }

  pushCurrent();

  return {
    connected: true,
    sourceName:
      meta?.sourceName ||
      "Marketing Event Detail Report",
    sheetName:
      meta?.sheetName ||
      SHEET_NAME,
    fetchedAt:
      meta?.fetchedAt ||
      new Date().toISOString(),
    dataVersion:
      meta?.dataVersion ||
      hashString(JSON.stringify(safeRows)),
    events
  };
}

function emptyData(error?: string): ReportMediaData {
  return {
    connected: false,
    sourceName: "Marketing Event Detail Report",
    sheetName: SHEET_NAME,
    fetchedAt: new Date().toISOString(),
    dataVersion: "",
    events: [],
    error
  };
}

export async function getReportMediaData(): Promise<ReportMediaData> {
  const apiUrl =
    process.env.MARKETING_EVENT_DETAIL_API_URL;

  const secret =
    process.env.MARKETING_EVENT_DETAIL_API_SECRET;

  if (!apiUrl || !secret) {
    return emptyData(
      "MARKETING_EVENT_DETAIL_API_URL and MARKETING_EVENT_DETAIL_API_SECRET are not configured."
    );
  }

  try {
    const url = new URL(apiUrl);

    url.searchParams.set("key", secret);
    url.searchParams.set("sheet", SHEET_NAME);
    url.searchParams.set("_t", String(Date.now()));

    const response = await fetch(
      url.toString(),
      {
        cache: "no-store",
        headers: {
          Accept: "application/json"
        }
      }
    );

    const text = await response.text();

    let payload: SheetPayload;

    try {
      payload = text
        ? JSON.parse(text)
        : {};
    } catch {
      throw new Error(
        `Marketing Event Detail API returned non-JSON response (${response.status}).`
      );
    }

    if (
      !response.ok ||
      payload.ok === false
    ) {
      throw new Error(
        payload.error ||
          `Marketing Event Detail API returned HTTP ${response.status}.`
      );
    }

    return normalizeReportMediaRows(
      payload.values || [],
      {
        sourceName:
          payload.spreadsheetName ||
          "Marketing Event Detail Report",
        sheetName:
          payload.sheetName ||
          SHEET_NAME,
        fetchedAt:
          payload.fetchedAt ||
          new Date().toISOString(),
        dataVersion:
          payload.dataVersion
      }
    );
  } catch (error) {
    return emptyData(
      error instanceof Error
        ? error.message
        : "Unable to load Report Media data."
    );
  }
}
