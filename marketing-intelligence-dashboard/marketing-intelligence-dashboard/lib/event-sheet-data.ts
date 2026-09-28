import type { AnnualBigEventData } from "@/lib/annual-big-event";
import { normalizeAnnualBigEventRows } from "@/lib/annual-big-event";

type SheetPayload = {
  ok?: boolean;
  spreadsheetName?: string;
  sheetName?: string;
  fetchedAt?: string;
  dataVersion?: string;
  values?: unknown[][];
  error?: string;
};

const MONTH_INDEX: Record<string, number> = {
  januari: 1,
  january: 1,
  jan: 1,
  februari: 2,
  february: 2,
  feb: 2,
  maret: 3,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  mei: 5,
  may: 5,
  juni: 6,
  june: 6,
  jun: 6,
  juli: 7,
  july: 7,
  jul: 7,
  agustus: 8,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  oktober: 10,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  desember: 12,
  december: 12,
  dec: 12
};

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function toIsoEventDate(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  // Excel / Sheets serial date if the API ever returns it as text.
  if (/^\d{5}(?:\.\d+)?$/.test(raw)) {
    const serial = Number(raw);

    if (Number.isFinite(serial)) {
      const epoch = Date.UTC(1899, 11, 30);
      return new Date(
        epoch + serial * 24 * 60 * 60 * 1000
      )
        .toISOString()
        .slice(0, 10);
    }
  }

  // Supports Indonesian and English month names:
  // 6 Februari 2025, 19 Maret 2025, 13 February 2025.
  const match = raw.match(
    /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/i
  );

  if (match) {
    const day = Number(match[1]);
    const month =
      MONTH_INDEX[match[2].toLowerCase()];
    const year = Number(match[3]);

    if (month) {
      return [
        String(year).padStart(4, "0"),
        String(month).padStart(2, "0"),
        String(day).padStart(2, "0")
      ].join("-");
    }
  }

  const direct = new Date(raw);

  if (!Number.isNaN(direct.getTime())) {
    return direct.toISOString().slice(0, 10);
  }

  return raw;
}

function normalizeEventDateCells(
  rows: unknown[][]
): unknown[][] {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [];
  }

  const cloned = rows.map((row) =>
    Array.isArray(row) ? [...row] : []
  );

  const headers = (cloned[0] || []).map(
    normalizeHeader
  );

  const startDateIndex = headers.findIndex(
    (header) =>
      header === "tanggal" ||
      header === "date" ||
      header === "start date"
  );

  const endDateIndex = headers.findIndex(
    (header) =>
      header === "finished event" ||
      header === "end date" ||
      header === "tanggal selesai"
  );

  for (let rowIndex = 1; rowIndex < cloned.length; rowIndex += 1) {
    const row = cloned[rowIndex];

    if (startDateIndex >= 0 && row[startDateIndex] != null) {
      row[startDateIndex] =
        toIsoEventDate(row[startDateIndex]);
    }

    if (endDateIndex >= 0 && row[endDateIndex] != null) {
      row[endDateIndex] =
        toIsoEventDate(row[endDateIndex]);
    }
  }

  return cloned;
}

function emptyData(
  sheetName: string,
  error?: string
): AnnualBigEventData {
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

    const normalizedRows =
      normalizeEventDateCells(payload.values || []);

    return normalizeAnnualBigEventRows(
      normalizedRows,
      {
        sourceName:
          payload.spreadsheetName ||
          "Marketing Event Detail Report",
        sheetName:
          payload.sheetName || sheetName,
        fetchedAt:
          payload.fetchedAt ||
          new Date().toISOString(),
        dataVersion: payload.dataVersion
      }
    );
  } catch (error) {
    return emptyData(
      sheetName,
      error instanceof Error
        ? error.message
        : `Unable to load ${sheetName} data.`
    );
  }
}
