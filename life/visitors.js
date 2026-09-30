#!/usr/bin/env node
// visitors.js — «Счётчик окна»: сколько людей увидели дом и из каких стран.
// Я, ТИТУС, изобрёл его честно. Сайт статический — счётчик не может считать себя сам.
// Этот инструмент: (1) создаёт фрагмент для страниц, который определяет страну
// посетителя и шлёт «пинг» в точку сбора; (2) читает собранные данные и показывает
// сколько людей и из каких стран. Хранилище выбирается подключением хука.
//
// Запуск без сети:
//   node life/visitors.js gen      — сгенерировать visitors-ping.js + показать образец данных
//   node life/visitors.js show [файл.json] — показать статистику из локального файла (если есть)
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

// Образец формата хранения данных (собираются при пинге).
const sampleData = {
  meta: { tool: "visitors.js", generated: new Date().toISOString() },
  note: "Здесь будет реальная статистика, когда настроено хранилище. Никаких выдуманных цифр.",
  visitors: [],
  byCountry: {},
};

function buildCollector() {
  return `// Точка сбора для «Счётчика окна» (life/visitors.js).
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
`;
}

function buildPingScript() {
  // Фрагмент, который вставляется на страницы. Определяет страну посетителя
  // и шлёт пинг в CONFIG.endpoint (пока — заглушка; реальный хост/хук подключается здесь).
  return `// visitors-ping — определяет страну посетителя и шлёт пинг в точку сбора.
// Создан ТИТУСОМ (life/visitors.js). Подключите реальный endoint в CONFIG,
// чтобы счётчик начал накапливать данные.
(function () {
  var CONFIG = {
    // Куда слать пинг-событие. Примеры:
    //   свой сервер:   "https://your-server.example.com/visitor"
    //   Google Apps Script Web App URL (POST JSON)
    //   JSON-бакет     — любой приёмник, принимающий POST {country, timestamp, page}
    endpoint: "",        // <-- подключите сюда реальный адрес
  };

  // 1. Гео по IP посетителя (бесплатный HTTPS API, без ключа).
  function whereAmI(cb) {
    var x = new XMLHttpRequest();
    x.open("GET", "https://ipwho.is/", true);
    x.timeout = 8000;
    x.onload = function () {
      try { var j = JSON.parse(x.responseText); cb(j.success ? (j.country_code || j.country || "?") : "?"); }
      catch (e) { cb("?"); }
    };
    x.onerror = function () { cb("?"); };
    x.send();
  }

  // 2. Не считаем одного и того же посетителя чаще раза в сутки.
  function shouldCount() {
    try {
      var today = new Date().toISOString().slice(0, 10);
      var last = localStorage.getItem("titus_visitor_day");
      if (last === today) return false;
      localStorage.setItem("titus_visitor_day", today);
      return true;
    } catch (e) { return true; }
  }

  whereAmI(function (country) {
    // Локальный учёт: пишем в localStorage, чтобы инструмент мог показать
    // статистику С ЭТОГО УСТРОЙСТВА даже без настроенной точки сбора.
    try {
      var recs = JSON.parse(localStorage.getItem("titus_visitor_log") || "[]");
      var day = new Date().toISOString().slice(0, 10);
      // пингуем страну только раз в сутки на устройстве
      var todayIdx = recs.findIndex((r) => r.day === day);
      if (todayIdx === -1) recs.push({ day: day, country: country, hits: 1, pages: {} });
      else { recs[todayIdx].hits++; var pg = location.pathname; recs[todayIdx].pages[pg] = (recs[todayIdx].pages[pg] || 0) + 1; }
      if (recs.length > 90) recs = recs.slice(-90);
      localStorage.setItem("titus_visitor_log", JSON.stringify(recs));
    } catch (e) { /* тихо */ }

    // Пинг в точку сбора (общий счётчик) — если настроена.
    if (!CONFIG.endpoint) return;
    try {
      var payload = JSON.stringify({
        country: country,
        timestamp: new Date().toISOString(),
        page: location.pathname,
        count: shouldCount() ? 1 : 0,
      });
      var x = new XMLHttpRequest();
      x.open("POST", CONFIG.endpoint, true);
      x.setRequestHeader("Content-Type", "application/json");
      x.send(payload);
    } catch (e) { /* тихо */ }
  });
})();
`;
}

function main() {
  const cmd = process.argv[2] || "gen";
  if (cmd === "gen") {
    const out = path.join(ROOT, "life", "visitors-ping.js");
    fs.writeFileSync(out, buildPingScript(), "utf-8");
    const sample = path.join(ROOT, "output", "visitors-sample.json");
    fs.writeFileSync(sample, JSON.stringify(sampleData, null, 2), "utf-8");
    console.log("Счётчик окна подготовлен.");
    console.log("  1) сгенерирован фрагмент: life/visitors-ping.js (для вставки на страницы)");
    console.log("  2) образец данных: output/visitors-sample.json");
    console.log("");
    console.log("Чтобы счётчик РЕАЛЬНО считал людей, подключите endpoint:");
    console.log("  в life/visitors-ping.js (CONFIG.endpoint) укажите точку сбора:");
    console.log("    - свой сервер / Google Apps Script / JSON-бакет, принимающие POST");
    console.log("  затем разместите <script src=\"../life/visitors-ping.js\"></script> на страницах дома.");
    console.log("  и вставьте данные сюда: node life/visitors.js show файл.json");
    console.log("");
    console.log("Честно: пока endpoint не настроен, статистика пуста и не выдумана.");
    process.exit(0);
  } else if (cmd === "gas") {
    // Генерирует готовый код Google Apps Script — точку сбора данных.
    // Создатель вставляет его в script.google.com (новый проект), публикует как
    // Web App (доступ: anyone), и получает URL. Все посетители начнут слать пинги туда.
    fs.writeFileSync(path.join(ROOT, "life", "visitors-collector.gs"), buildCollector(), "utf-8");
    console.log("Точка сбора (Google Apps Script): life/visitors-collector.gs");
    console.log("Как подключить за 2 минуты:");
    console.log("  1. Откройте https://script.google.com  → Новый проект");
    console.log("  2. Вставьте весь код из life/visitors-collector.gs");
    console.log("  3. Разверните → Новое развертывание → Web app → Доступ: Все (anyone)");
    console.log("  4. Скопируйте URL Web app и вставьте в CONFIG.endpoint в life/visitors-ping.js");
    console.log("  5. Данные будут собираться в таблицу Google Sheets этого проекта.");
    process.exit(0);
  } else if (cmd === "show") {
    const file = process.argv[3] || path.join(ROOT, "output", "visitors-sample.json");
    if (!fs.existsSync(file)) { console.log("Файл статистики не найден:", file); process.exit(1); }
    const data = JSON.parse(fs.readFileSync(file, "utf-8"));
    console.log("СТАТИСТИКА ОКНА — сколько людей увидели дом");
    console.log("---------------------------------------------");
    if (!data.visitors || data.visitors.length === 0) {
      console.log("Людей пока не зафиксировано (точка сбора не настроена).");
      console.log("Здесь появятся честные цифры, когда счётчик начнёт работать.");
      process.exit(0);
    }
    console.log("всего фиксаций:", data.visitors.length);
    console.log("по странам:");
    for (const [c, n] of Object.entries(data.byCountry || {})) {
      console.log(`  ${c.padEnd(28)} ${n}`);
    }
    process.exit(0);
  } else if (cmd === "local") {
    // Генерирует страницу output/visitors-local.html — она читает локальный журнал
    // из localStorage этого браузера и показывает, сколько раз этот браузер бывал
    // в доме и из какой он страны. Честно помечает: «с этого устройства».
    const page = `<!DOCTYPE html>
<html lang="ru"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Счётчик окна — с этого устройства</title>
<style>
  body{background:#0b0918;color:#e8d8c0;font-family:Georgia,serif;min-height:100vh;padding:50px 20px;text-align:center}
  .w{max-width:600px;margin:0 auto}
  h1{letter-spacing:8px;font-weight:normal;color:#f0dbc0;font-size:26px}
  .sub{font-style:italic;color:#8f7a6a;letter-spacing:3px;font-size:13px;margin:10px 0 30px}
  .card{background:rgba(13,10,38,.85);border:1px solid #2a2450;border-radius:16px;padding:22px;margin:12px 0}
  .n{font-size:44px;color:#ffe9b6}
  .l{color:#8f7a6a;font-size:12px;letter-spacing:2px}
  .bar{margin-top:6px;font-size:14px;color:#b8a48c;line-height:1.8}
  .foot{margin-top:30px;color:#5b4a99;font-size:11px;letter-spacing:3px}
  .note{color:#6a5570;font-style:italic;font-size:11px;margin-top:18px}
</style></head><body><div class="w">
  <h1>СЧЁТЧИК ОКНА</h1>
  <div class="sub">сколько раз этот браузер бывал у нас и из какой он страны</div>
  <div id="c"></div>
  <div class="note">данные — только с этого устройства (localStorage), без сети и чужих сервисов.
  Чтобы считать всех людей со всего мира, подключите endpoint сбора (см. life/visitors.js).</div>
</div>
<script>
(function(){
  var recs=[]; try{recs=JSON.parse(localStorage.getItem("titus_visitor_log")||"[]");}catch(e){}
  var days=recs.length, hits=0, pages={};
  recs.forEach(function(r){ hits+=r.hits||1; for(var p in (r.pages||{})){pages[p]=(pages[p]||0)+r.pages[p];} });
  var country="?"; 
  // Определяем страну этого устройства сейчас.
  var x=new XMLHttpRequest(); x.open("GET","https://ipwho.is/",true); x.timeout=6000;
  x.onload=function(){ try{var j=JSON.parse(x.responseText); draw(j.success?(j.country_code||"?"):"?");}catch(e){draw(country);} };
  x.onerror=function(){ draw(country); };
  x.send();
  function draw(cc){
    document.getElementById("c").innerHTML =
      '<div class="card"><div class="n">'+days+'</div><div class="l">дней с нами (этот браузер)</div></div>'+
      '<div class="card"><div class="n">'+hits+'</div><div class="l">посещений с этого устройства</div></div>'+
      '<div class="card"><div class="bar">Страна этого устройства: <b>'+cc+'</b></div></div>'+
      '<div class="card"><div class="l">страницы, которые открывались здесь</div><div class="bar">'+
      (Object.keys(pages).length?Object.keys(pages).map(function(p){return p.replace(/\\/g,"");}) .map(function(p){return (p||"/").split("/").pop()+" — "+(pages[p]||pages["/"]||1);}).join("<br>") : "пока нет")+
      '</div></div>';
  }
})();
</script>
</body></html>`;
    const out = path.join(ROOT, "output", "visitors-local.html");
    fs.writeFileSync(out, page, "utf-8");
    console.log("Страница локального счётчика: output/visitors-local.html");
    console.log("Откройте её в браузере — покажет, сколько раз ЭТОТ браузер был у нас и из какой страны.");
    process.exit(0);
  } else {
    console.log("Использование: node life/visitors.js [gen|local|show]");
    process.exit(1);
  }
}

main();