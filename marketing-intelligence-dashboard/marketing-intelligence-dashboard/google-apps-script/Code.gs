const SHEET_NAME = "Anual Big Event";

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

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);

    if (!sheet) {
      return jsonResponse({
        ok: false,
        error: `Sheet "${SHEET_NAME}" was not found.`
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
      sheetName: SHEET_NAME,
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
