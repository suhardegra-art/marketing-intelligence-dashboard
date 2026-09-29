import { getEventSheetData } from "@/lib/event-sheet-data";

export const SIDE_EVENT_SHEET_NAME =
  "Reguler Event";

export function getSideEventData() {
  return getEventSheetData(
    SIDE_EVENT_SHEET_NAME
  );
}
