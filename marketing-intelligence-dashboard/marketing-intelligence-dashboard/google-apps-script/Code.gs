const SPREADSHEET_ID =
  "1KEPkOSSS_5RV0RQw4RQpIdkz3fqxnB37MPhJnPCdcQg";

const ALLOWED_SHEET_NAMES = [
  "Anual Big Event",
  "Launching & Regional Event",
  "Reguler Event",
  "Report Media"
];

function doGet(e) {
  try {
    const expectedKey =
      PropertiesService
        .getScriptProperties()
        .getProperty("API_SECRET");

    const providedKey =
      e && e.parameter
        ? String(e.parameter.key || "")
        : "";

    if (!expectedKey || providedKey !== expectedKey) {
      return jsonResponse({
        ok: false,
        error: "Unauthorized"
      });
    }

    const requestedSheet =
      e && e.parameter
        ? String(e.parameter.sheet || "")
        : "";

    if (ALLOWED_SHEET_NAMES.indexOf(requestedSheet) < 0) {
      return jsonResponse({
        ok: false,
        error: "Invalid sheet. Allowed: " + ALLOWED_SHEET_NAMES.join(", ")
      });
    }

    const spreadsheet =
      SpreadsheetApp.openById(SPREADSHEET_ID);

    const sheet =
      spreadsheet.getSheetByName(requestedSheet);

    if (!sheet) {
      return jsonResponse({
        ok: false,
        error: `Sheet "${requestedSheet}" was not found in "${spreadsheet.getName()}".`
      });
    }

    const values =
      sheet.getDataRange().getDisplayValues();

    const dataString =
      JSON.stringify(values);

    const digest =
      Utilities.computeDigest(
        Utilities.DigestAlgorithm.MD5,
        dataString,
        Utilities.Charset.UTF_8
      );

    const dataVersion = digest
      .map(function(byte) {
        return (
          "0" +
          ((byte + 256) % 256).toString(16)
        ).slice(-2);
      })
      .join("");

    return jsonResponse({
      ok: true,
      spreadsheetName: spreadsheet.getName(),
      spreadsheetId: spreadsheet.getId(),
      sheetName: requestedSheet,
      fetchedAt: new Date().toISOString(),
      dataVersion: dataVersion,
      values: values
    });
  } catch (error) {
    return jsonResponse({
      ok: false,
      error:
        error && error.message
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
