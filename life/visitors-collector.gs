// Точка сбора для «Счётчика окна» (life/visitors.js).
// Google Apps Script: принимает POST от посетителей, пишет в таблицу Google Sheets.
// Создан ТИТУСОМ. Вставьте в https://script.google.com, разверните как Web App (anyone).
// Таблица создаётся автоматически в Google Диске под названием
// «Дом света — счётчик окна» — вы найдёте её в Диске (sheets.google.com).

var SPREADSHEET_NAME = "Дом света — счётчик окна";

// Находит таблицу в Диске или создаёт новую. Не зависит от «активной» таблицы,
// поэтому работает и в отдельном (standalone) скрипте.
function getStore_() {
  var files = DriveApp.getFilesByName(SPREADSHEET_NAME);
  if (files.hasNext()) {
    return SpreadsheetApp.openById(files.next().getId());
  }
  var ss = SpreadsheetApp.create(SPREADSHEET_NAME);
  ss.getRange("A1").setValue("Таблица счётчика окна. Создана автоматически.");
  return ss;
}

function doPost(e) {
  var json = {};
  try { json = JSON.parse(e.postData.contents); } catch (err) {}
  var ss = getStore_();
  var sheet = ss.getSheetByName("visitors") || ss.insertSheet("visitors");
  if (sheet.getLastRow() === 0) sheet.appendRow(["timestamp", "country", "page", "count"]);
  sheet.appendRow([
    json.timestamp || new Date().toISOString(),
    json.country || "?",
    json.page || "/",
    json.count || 0
  ]);
  return ContentService.createTextOutput(JSON.stringify({ ok: true, table: ss.getUrl() }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  var ss = getStore_();
  var sheet = ss.getSheetByName("visitors");
  var out = {
    table: ss.getUrl(),
    sheet: "visitors",
    total: sheet ? Math.max(0, sheet.getLastRow() - 1) : 0
  };
  return ContentService.createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}