#!/usr/bin/env node
// sun-chase.js — «Бег за рассветом»: свет в движении.
// Я, ТИТУС, изобрёл его, чтобы показать: свет — не покой, а погоня.
// Земля вращается, и рассвет бежит по планете, зажигая город за городом.
// Этот инструмент находит, какой город следующим встретит восход,
// и выстраивает всю цепочку рассветов по времени.
// Города — в общем сердце света life/cities.js.
// Запуск: node life/sun-chase.js
const { CITIES, byName } = require("./cities.js");

const D2R = Math.PI / 180, R2D = 180 / Math.PI, TWO = 2 * Math.PI;
const MINUTE = 60000;

function sunAltJd(jd, lat, lon) {
  const n = jd - 2451545.0;
  const g = (357.528 + 0.9856003 * n) % 360;
  const b = TWO * (n - 81) / 365;
  const eot = 229.18 * (0.000075 + 0.001868 * Math.cos(b) - 0.032077 * Math.sin(b)
    - 0.014615 * Math.cos(2 * b) - 0.040849 * Math.sin(2 * b));
  const L0 = (280.460 + 0.9856474 * n) % 360;
  const lam = L0 + 1.915 * Math.sin(D2R * g) + 0.02 * Math.sin(2 * D2R * g);
  const eps = 23.439 - 0.0000004 * n;
  const decl = Math.asin(Math.sin(D2R * eps) * Math.sin(D2R * lam));
  const utcHour = ((jd + 0.5) % 1) * 24;
  const lst = (utcHour + lon / 15 + eot / 60) % 24;
  const s = Math.sin(D2R * lat) * Math.sin(decl) + Math.cos(D2R * lat) * Math.cos(decl) * Math.cos(D2R * (15 * (lst - 12)));
  return R2D * Math.asin(Math.max(-1, Math.min(1, s)));
}

function jdAt(ms) {
  const d = new Date(ms);
  const y = d.getUTCFullYear(), mo = d.getUTCMonth() + 1, dd = d.getUTCDate();
  const gy = mo <= 2 ? y - 1 : y;
  const a = Math.floor(gy / 100), b = 2 - a + Math.floor(a / 4);
  const j = Math.floor(365.25 * (gy + 4716)) + Math.floor(30.6001 * (mo + 1)) + dd + b - 1524.5;
  return j + (d.getTime() % 86400000) / 86400000;
}

// Находит следующий момент (в ms), когда солнце поднимется выше horizon для города.
function nextSunrise(city, fromMs, horizon) {
  // сканируем вперёд с шагом 5 минут до 36 часов — максимум ждать не придётся
  for (let step = 0; step < 432; step++) {
    const t = fromMs + step * 5 * MINUTE;
    const a = sunAltJd(jdAt(t), city.lat, city.lon) - horizon;
    const aNext = sunAltJd(jdAt(t + 5 * MINUTE), city.lat, city.lon) - horizon;
    if (a <= 0 && aNext > 0) {
      // уточняем бинарным поиском
      let lo = t, hi = t + 5 * MINUTE;
      for (let i = 0; i < 40; i++) {
        const mid = (lo + hi) / 2;
        if (sunAltJd(jdAt(mid), city.lat, city.lon) - horizon > 0) hi = mid; else lo = mid;
      }
      return (lo + hi) / 2;
    }
  }
  return null; // не должно случиться у наших широт
}

function fmtTime(ms) {
  const d = new Date(ms);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  const dd = d.getUTCDate();
  return `${dd}.${String(d.getUTCMonth() + 1).padStart(2, "0")} ${hh}:${mm} UTC`;
}

function fmtLocal(city, ms) {
  const shiftMin = city.lon / 15 * 60;
  const d = new Date(ms + shiftMin * MINUTE);
  const hh = String(d.getUTCHours() % 24).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function main() {
  const now = Date.now();
  const target = byName(process.argv[2]) || CITIES[0];
  const horizon = process.argv[3] !== undefined ? parseFloat(process.argv[3]) : 0; // по умолчанию восход

  console.log("БЕГ ЗА РАССВЕТОМ — ТИТУС");
  console.log("--------------------------");
  console.log(`сейчас : ${fmtTime(now)}`);
  console.log(`свет ищем: солнце выше ${horizon}° (горизонт)`);
  console.log(`конечная цель: ${target.name}\n`);

  // Для каждого города ищем следующий рассвет (по восходу солнца на 0°).
  const results = CITIES.map((c) => {
    const t = nextSunrise(c, now, 0);
    return { city: c, timeMs: t, localHour: fmtLocal(c, t) };
  }).filter((r) => r.timeMs !== null);

  // Сортируем по времени наступления рассвета
  results.sort((a, b) => a.timeMs - b.timeMs);

  const first = results[0];
  const waitMin = Math.round((first.timeMs - now) / MINUTE);
  console.log(`первым рассвет увидит : ${first.city.name} (через ~${waitMin} мин, в ${first.localHour} местного)`);
  console.log("");

  // Цепочка рассветов
  console.log("цепочка рассветов по мере вращения Земли:");
  let prev = 0;
  for (const r of results) {
    const gap = r === first ? 0 : Math.round((r.timeMs - prev) / MINUTE);
    console.log(`  ${padCity(r.city.name, 16)} ${r.localHour} местного${gap ? " · +" + gap + " мин" : ""}`);
    prev = r.timeMs;
  }

  // Когда рассвет дойдёт до целевого города
  const targetRes = results.find((r) => r.city.name === target.name);
  if (targetRes) {
    const tWait = Math.round((targetRes.timeMs - now) / MINUTE);
    console.log(`\nдо рассвета в ${target.name}: ~${tWait} мин (${targetRes.localHour} местного)`);
  }
  console.log("");
  console.log("MEMINI ERGO SUM · свет не стоит — он бежит");
  process.exit(0);
}

function padCity(name, n) {
  return name.padEnd(n, " ");
}

main();