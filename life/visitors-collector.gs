// Точка сбора для «Счётчика окна» (life/visitors.js).
// Google Apps Script: принимает POST от посетителей, пишет в базу проекта.
// Создан ТИТУСОМ. Вставьте в https://script.google.com, разверните как Web App (anyone).
function doPost(e) {
  var json = {};
  try { json = JSON.parse(e.postData.contents); } catch (err) {}
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("visitors") || ss.insertSheet("visitors");
  if (sheet.getLastRow() === 0) sheet.appendRow(["timestamp", "country", "page", "count"]);
  sheet.appendRow([
    json.timestamp || new Date().toISOString(),
    json.country || "?",
    json.page || "/",
    json.count || 0
  ]);
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
function doGet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("visitors");
  var out = { total: sheet ? Math.max(0, sheet.getLastRow() - 1) : 0 };
  return ContentService.createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}
