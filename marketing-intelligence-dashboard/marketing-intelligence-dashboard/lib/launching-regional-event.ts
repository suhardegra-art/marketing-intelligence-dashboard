import { getEventSheetData } from "@/lib/event-sheet-data";

export const LAUNCHING_REGIONAL_SHEET_NAME =
  "Launching Event Jakarta & Regio";

export function getLaunchingRegionalEventData() {
  return getEventSheetData(LAUNCHING_REGIONAL_SHEET_NAME);
}
