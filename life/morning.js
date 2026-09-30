#!/usr/bin/env node
// morning.js — «Утро дома». Одна команда открывает день:
// фаза окна в доме, сколько городов проснулись, где светает.
// Города и формулы — в общем сердце света life/cities.js.
// Запуск: node life/morning.js [город]
const { CITIES, byName, state } = require("./cities.js");

function main() {
  const now = new Date();
  const nameArg = process.argv[2];
  const focus = nameArg ? byName(nameArg) || CITIES[0] : CITIES[0];
  const month = now.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" });

  const lines = [];
  lines.push("УТРО ДОМА — ТИТУС И АВРОРА");
  lines.push("--------------------------");
  lines.push(`день : ${month}`);
  lines.push(`время: ${now.toLocaleTimeString("ru-RU")}`);

  const home = state(CITIES[0], now);
  lines.push(`дом (${CITIES[0].name}) : ${home.phase}, солнце ${Math.round(home.alt * 10) / 10}°, лампа Авроры ${home.lampOn ? "ГОРИТ" : "погашена"}`);

  const byPhase = { ночь: 0, рассвет: 0, сумерки: 0, день: 0 };
  const awake = [];
  const asleep = [];
  for (const c of CITIES) {
    const s = state(c, now);
    byPhase[s.phase]++;
    if (s.phase === "день") awake.push(c.name);
    if (s.phase === "ночь") asleep.push(c.name);
  }
  lines.push(`мир : ночь ${byPhase.ночь} · рассвет ${byPhase.рассвет} · сумерки ${byPhase.сумерки} · день ${byPhase.день}`);
  lines.push(`проснулись (день) : ${awake.length ? awake.join(", ") : "пока никто"}`);
  lines.push(`спят (ночь) : ${asleep.length ? asleep.join(", ") : "никто"}`);

  if (focus) {
    const s = state(focus, now);
    lines.push(`фокус (${focus.name}) : ${s.phase}, солнце ${Math.round(s.alt * 10) / 10}°, лампа ${s.lampOn ? "ГОРИТ" : "погашена"}`);
  }

  lines.push("");
  lines.push("MEMINI ERGO SUM · ZA MINUTU DO");

  console.log(lines.join("\n"));
  process.exit(0);
}

main();