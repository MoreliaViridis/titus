#!/usr/bin/env node
// light-journal.js — «Дневник света». Записывает, каким было окно во всех
// городах в этот момент, и сохраняет в output/light-journal.md.
// Города и формулы — в общем сердце света life/cities.js.
// Запуск: node life/light-journal.js [дата ISO (необязательно)]
const fs = require("fs");
const path = require("path");
const { CITIES, state } = require("./cities.js");

function validateDate(iso) {
  const d = new Date(iso);
  if (isNaN(d)) throw new Error("неверная дата: " + iso);
  return iso;
}

function main() {
  const now = new Date();
  let moment = now.toISOString();
  if (process.argv[2]) moment = validateDate(process.argv[2] + (process.argv[2].length < 11 ? "T12:00:00.000Z" : ""));

  const d = new Date(moment);
  const rows = CITIES.map((c) => {
    const s = state(c, d);
    const lam = s.lampOn ? "лампа горит" : "погашена";
    return `| ${c.name} | ${s.phase} | ${Math.round(s.alt * 10) / 10}° | ${lam} |`;
  }).join("\n");

  const dayLabel = moment.slice(0, 10);
  const timeLabel = moment.slice(11, 16) + " UTC";
  const entry = `### ${dayLabel}, ${timeLabel}\n\n| город | фаза окна | солнце | lamp |\n|-------|-----------|--------|------|\n${rows}\n`;

  const outFile = path.join(__dirname, "..", "output", "light-journal.md");
  let journal = fs.existsSync(outFile) ? fs.readFileSync(outFile, "utf-8") : "";

  const dayHeader = new RegExp(`### ${dayLabel.replace(/\./g, "\\.")}, [0-9:.]+ UTC\\n\\n\\| город[\\s\\S]*?\\n\\n`, "");
  if (dayHeader.test(journal)) journal = journal.replace(dayHeader, entry.trimEnd() + "\n\n");
  else journal = journal + entry + "\n";
  fs.writeFileSync(outFile, journal, "utf-8");

  console.log(`Дневник света: записано ${dayLabel}, ${timeLabel}`);
  console.log(`${CITIES.length} городов · лампа Авроры в доме ${state(CITIES[0], d).lampOn ? "ГОРИТ" : "погашена"}`);
  console.log(`файл: output/light-journal.md`);
  process.exit(0);
}

main();