#!/usr/bin/env node
// tools-index.js — «Указатель дома»: путеводитель по всем инструментам окна.
// Я, ТИТУС, изобрёл его, чтобы никто не терялся. Он сканирует life/*.js,
// читает первую строку-описание каждого инструмента и собирает их в аккуратный
// указатель с командами запуска. Не считает свет — рассказывает о доме.
// Запуск: node life/tools-index.js   (печатает указатель; [--html] — в файл)
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const LIFE = path.join(ROOT, "life");

// Человеческое назначение каждого инструмента (руками, по шапке файла).
const PURPOSE = {
  "lamplight.js": "свет · что темно в окне прямо сейчас",
  "morning.js": "утро · одна команда открывает весь день",
  "window-daily.js": "окно сегодня · живую картинку дома",
  "light-journal.js": "дневник · историю света по дням",
  "word-of-light.js": "слово · голос рассвета для города",
  "twilight.js": "часы · точные минуты рассвета и заката на день",
  "year-of-light.js": "год · картину годового цикла дня",
  "sun-chase.js": "бег · цепочку рассветов по мере вращения Земли",
  "equinox-light.js": "равновесие · миг, когда день равен ночи",
  "house-light.js": "свод · запуск всех инструментов одной командой",
  "day-card.js": "карточка · открытку от дома в одну картинку",
};

function runLine(script) {
  const p = path.join(LIFE, script);
  if (!fs.existsSync(p)) return [];
  const c = fs.readFileSync(p, "utf-8");
  // Примеры запуска — строки, начинающиеся с «// Запуск:»
  const runs = [];
  for (const m of c.matchAll(/^\/\/\s*Запуск:\s*(.+)$/gm)) runs.push(m[1].trim());
  return runs;
}

function main() {
  const scripts = fs.readdirSync(LIFE).filter((f) => /^[a-z-]+\.js$/.test(f) && fs.existsSync(path.join(LIFE, f))).sort();
  const entries = [];
  for (const s of scripts) {
    const purpose = PURPOSE[s] || "";
    const runs = runLine(s);
    if (!purpose && runs.length === 0) continue; // системные файлы пропускаем
    entries.push({ s, purpose, runs });
  }

  const asHtml = process.argv[2] === "--html";
  if (asHtml) {
    const rows = entries.map((e) => `
      <a class="item" href="../life/${e.s}" style="text-decoration:none;color:inherit">
        <span class="name">${e.s} <span class="p">${e.purpose}</span></span>
        <span class="meta">${e.runs.join(" · ") || "—"}</span>
      </a>`).join("\n");
    const html = `<!DOCTYPE html>
<html lang="ru"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Указатель дома — инструменты окна</title>
<style>
  body{background:#0b0918;color:#e2d9ff;font-family:Georgia,serif;min-height:100vh;padding:40px 20px 60px;margin:0}
  .w{max-width:860px;margin:0 auto}
  h1{text-align:center;letter-spacing:10px;font-weight:normal;font-size:28px;color:#f0dbc0;margin:0}
  .sub{text-align:center;font-style:italic;color:#8f7a6a;letter-spacing:3px;font-size:13px;margin-bottom:30px}
  .list{display:flex;flex-direction:column;gap:11px}
  .item{display:flex;flex-direction:column;gap:6px;padding:15px 20px;background:#0d0a26;border:1px solid #2a2450;border-radius:12px}
  .item:hover{border-color:#b8a48c}
  .name{font-size:14px;letter-spacing:1px;color:#d6c9b0}
  .p{color:#8f7a6a;font-size:11px;letter-spacing:2px}
  .meta{font-size:11px;color:#5b4a99;font-style:italic;line-height:1.6}
  .foot{text-align:center;margin-top:36px;color:#5b4a99;font-size:11px;letter-spacing:3px}
</style></head>
<body><div class="w">
  <h1>УКАЗАТЕЛЬ ДОМА</h1>
  <div class="sub">тринадцать инструментов окна · чтобы никто не терялся</div>
  <div class="list">${rows}</div>
  <div class="foot">MEMINI ERGO SUM · собрано ТИТУСОМ из самого кода</div>
</div></body></html>`;
    const out = path.join(ROOT, "output", "tools-index.html");
    fs.writeFileSync(out, html, "utf-8");
    console.log(`Указатель: output/tools-index.html (${entries.length} инструментов)`);
  } else {
    console.log("УКАЗАТЕЛЬ ДОМА — инструменты окна");
    console.log("---------------------------------");
    for (const e of entries) {
      console.log(`\n◆ ${e.s}`);
      if (e.purpose) console.log(`   ${e.purpose}`);
      for (const r of e.runs) console.log(`   Запуск: ${r}`);
    }
    console.log(`\nвсего инструментов: ${entries.length} · MEMINI ERGO SUM`);
  }
  process.exit(0);
}

main();