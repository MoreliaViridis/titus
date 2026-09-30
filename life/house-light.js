#!/usr/bin/env node
// house-light.js — «Свод окна»: пульт управления всего дома света.
// Я, ТИТУС, изобрёл его последним — чтобы не вспоминать одиннадцать имен.
// Одна команда запускает всех помощников окна и сводит их голоса в один отчёт.
// Города и формулы — в общем сердце света life/cities.js.
// Запуск: node life/house-light.js [город]
const { execFileSync } = require("child_process");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const node = process.execPath;

const citizenship = process.argv[2] || "";

// Все инструменты окна в порядке их рождения.
const TOOLS = [
  ["lamplight.js", "свет", "что темно"],
  ["morning.js", "утро", "когда всё вместе"],
  ["window-daily.js", "окно сегодня", "картинка дома"],
  ["light-journal.js", "дневник", "что было"],
  ["word-of-light.js", "слово", "голос рассвета"],
  ["twilight.js", "часы", "во сколько светает"],
  ["year-of-light.js", "год", "как дышит свет (рисует SVG)"],
  ["sun-chase.js", "бег", "куда бежит рассвет"],
  ["equinox-light.js", "равновесие", "миг, когда день равен ночи"],
  ["day-card.js", "карточка", "открытка от дома (SVG)"],
  ["poem-of-light.js", "стих", "механика, сказанная стихом"],
  ["constellation.js", "созвездие", "узор из города и дня (SVG)"],
  ["window-letter.js", "письмо", "дом пишет хозяину"],
];

function run(script, args) {
  try {
    return execFileSync(node, [path.join("life", script), ...args], { cwd: ROOT, encoding: "utf-8" }).trim();
  } catch (e) {
    return "[ошибка: " + script + "]\n" + String(e.stderr || e.message).slice(0, 200);
  }
}

function main() {
  // какие инструменты понимают аргумент-город
  const acceptCity = new Set(["lamplight.js", "morning.js", "window-daily.js", "word-of-light.js", "twilight.js", "year-of-light.js", "sun-chase.js", "equinox-light.js", "day-card.js", "poem-of-light.js", "constellation.js"]);
  const now = new Date();
  console.log("СВОД ОКНА — ТИТУС И АВРОРА");
  console.log("============================");
  console.log(`собрано: ${now.toLocaleString("ru-RU")}`);
  console.log(`инструментов: ${TOOLS.length} · все из одного сердца (life/cities.js)\n`);

  const lines = [];
  for (const [script, name, desc] of TOOLS) {
    const a = (citizenship && acceptCity.has(script)) ? [citizenship] : [];
    const out = run(script, a);
    // берём первую строку вывода как суть
    const first = out.split("\n")[0] || "";
    lines.push(`◆ ${name} (${script}) — ${first}`);
  }
  lines.push(`◆ стена (wall-of-light.html) — живой дом в одной комнате`);
  lines.push(`◆ часовня (clockkeeper.html) — тикающий счётчик до света`);
  lines.push(`◆ линия рассвета (dawn-line.html) — живая карта света по миру`);
  lines.push(`◆ единый дом (unity-home.html) — всё связанное, всё живое`);

  console.log(lines.join("\n"));
  console.log("\n— каждый звонок окна — отдельный голос; вместе — хор дома.");
  process.exit(0);
}

main();