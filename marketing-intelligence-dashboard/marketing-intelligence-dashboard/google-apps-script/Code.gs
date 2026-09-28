const DEFAULT_SHEET_NAME = "Anual Big Event";

const ALLOWED_SHEET_NAMES = [
  "Anual Big Event",
  "Launching Event Jakarta & Regio",
  "Side Event"
];

function doGet(e) {
  try {
    const expectedKey =
      PropertiesService.getScriptProperties().getProperty("API_SECRET");

    const providedKey =
      e && e.parameter ? String(e.parameter.key || "") : "";

    if (!expectedKey || providedKey !== expectedKey) {
      return jsonResponse({
        ok: false,
        error: "Unauthorized"
      });
    }

    const requestedSheet =
      e && e.parameter ? String(e.parameter.sheet || "") : "";

    const sheetName =
      requestedSheet &&
      ALLOWED_SHEET_NAMES.indexOf(requestedSheet) >= 0
        ? requestedSheet
        : DEFAULT_SHEET_NAME;

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(sheetName);

    if (!sheet) {
      return jsonResponse({
        ok: false,
        error: `Sheet "${sheetName}" was not found.`
      });
    }

    const values = sheet.getDataRange().getDisplayValues();

    const dataString = JSON.stringify(values);

    const digest = Utilities.computeDigest(
      Utilities.DigestAlgorithm.MD5,
      dataString,
      Utilities.Charset.UTF_8
    );

    const dataVersion = digest
      .map(function(byte) {
        return ("0" + ((byte + 256) % 256).toString(16)).slice(-2);
      })
      .join("");

    return jsonResponse({
      ok: true,
      spreadsheetName: spreadsheet.getName(),
      sheetName: sheetName,
      fetchedAt: new Date().toISOString(),
      dataVersion: dataVersion,
      values: values
    });
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: error && error.message
        ? error.message
        : String(error)
    });
  }
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
