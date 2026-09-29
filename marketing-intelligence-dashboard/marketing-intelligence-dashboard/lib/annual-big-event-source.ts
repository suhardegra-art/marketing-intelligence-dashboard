import { getEventSheetData } from "@/lib/event-sheet-data";

export const ANNUAL_BIG_EVENT_SHEET_NAME =
  "Annual Big Event";

export function getAnnualBigEventData() {
  return getEventSheetData(
    ANNUAL_BIG_EVENT_SHEET_NAME
  );
}
