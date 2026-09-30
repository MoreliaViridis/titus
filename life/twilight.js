#!/usr/bin/env node
// twilight.js — «Часы окна». Ищет, когда светает и когда темнеет.
// Честная схема солнечного времени: по уравнению времени и местному часовому
// углу, поэтому часы верны именно для широты/долготы города в его местном времени.
// Города — в общем сердце света life/cities.js (только список, формулы свои).
// Запуск: node life/twilight.js [город] [дата-ГГГГ-ММ-ДД]
require("./cities.js");
const { CITIES, byName } = require("./cities.js");

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;
const TWO_PI = 2 * Math.PI;

function sunAltJd(jd, lat, lon) {
  // jd — юлианская дата (с долей дня, 0.0 = UTC полночь).
  // Возвращает высоту солнца над горизонтом в градусах.
  const n = jd - 2451545.0; // сутки с J2000
  const g = (357.528 + 0.9856003 * n) % 360;           // средняя аномалия
  const b = TWO_PI * (n - 81) / 365;                    // для уравнения времени
  const eot = 229.18 * (
    0.000075 + 0.001868 * Math.cos(b) - 0.032077 * Math.sin(b)
    - 0.014615 * Math.cos(2 * b) - 0.040849 * Math.sin(2 * b)
  ); // минуты
  const L0 = (280.460 + 0.9856474 * n) % 360;           // средняя долгота
  const lam = L0 + 1.915 * Math.sin(D2R * g) + 0.02 * Math.sin(2 * D2R * g);
  const eps = 23.439 - 0.0000004 * n;                   // наклон эклиптики
  const decl = Math.asin(Math.sin(D2R * eps) * Math.sin(D2R * lam));

  // Местное солнечное время в часах
  const utcHour = ((jd + 0.5) % 1) * 24;                // часы UTC в этот момент
  const lst = (utcHour + lon / 15 + eot / 60) % 24;     // местное солнечное время
  const HA = R2D * (lst - 12) * 15 / 15;                // часовой угол в градусах = 15*(lst-12)
  const cosH = Math.cos(D2R * (15 * (lst - 12)));
  const sinAlt = Math.sin(D2R * lat) * Math.sin(decl) + Math.cos(D2R * lat) * Math.cos(decl) * cosH;
  return R2D * Math.asin(Math.max(-1, Math.min(1, sinAlt)));
}

function jdAtLocalMinute(dateStr, localMin) {
  // localMin — минута местного дня (0..1440) для города.
  // Нам не важен абсолютный календарь здесь: берём UTC полночь дня,
  // а сдвиг долготы учтён внутри формулы через lon. Возвращаем jd для этого момента.
  const utcMs = new Date(dateStr + "T00:00:00.000Z").getTime() + localMin * 60000;
  const d = new Date(utcMs);
  const y = d.getUTCFullYear(), m = d.getUTCMonth() + 1, day = d.getUTCDate();
  const g = m <= 2 ? y - 1 : y;
  const a = Math.floor(g / 100), b = 2 - a + Math.floor(a / 4);
  const jdn = Math.floor(365.25 * (g + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5;
  return jdn + (d.getTime() % 86400000) / 86400000;
}

function timeForAlt(city, dateStr, targetAlt, rising) {
  const shiftMin = city.lon / 15 * 60; // сдвиг долготы в местное солнечное время
  const altAt = (localMin) =>
    sunAltJd(jdAtLocalMinute(dateStr, localMin - shiftMin), city.lat, city.lon) - targetAlt;
  // Ищем в локальных минутах суток: утро 0..720, вечер 720..1440.
  const segStart = rising ? 0 : 720;
  const segEnd = rising ? 720 : 1440;
  let lo = -1, hi = -1;
  for (let m = segStart; m < segEnd; m++) {
    const a = altAt(m), b = altAt(m + 1);
    if (rising ? (a <= 0 && b > 0) : (a >= 0 && b < 0)) { lo = m; hi = m + 1; break; }
  }
  if (hi < 0) return null; // не найдено пересечение в этот день
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (altAt(mid) > 0) { if (rising) hi = mid; else lo = mid; }
    else { if (rising) lo = mid; else hi = mid; }
  }
  return (lo + hi) / 2; // локальная минута восхода/заката
}

function fmtMinute(min) {
  if (min === null) return "—";
  let m = ((min % 1440) + 1440) % 1440;
  const tot = Math.round(m * 60) / 60; // округляем до минуты, хвост не даёт 13:60
  const h = Math.floor(tot / 60) % 24;
  const mm = Math.round((tot % 60) * 100) / 100;
  const mi = Math.floor(mm + 0.5) % 60; // неравенство безопасности: 13:60 → 14:00
  const hh = mm >= 59.5 ? (h + 1) % 24 : h;
  return `${String(hh).padStart(2, "0")}:${String(mi).padStart(2, "0")}`;
}

function main() {
  const argv = process.argv.slice(2);
  let dateStr = new Date().toISOString().slice(0, 10);
  let city = CITIES[0];
  if (argv[0]) {
    const c = byName(argv[0]);
    if (c) { city = c; dateStr = argv[1] || dateStr; }
    else if (/^\d{4}-\d{2}-\d{2}$/.test(argv[0])) dateStr = argv[0];
  } else {
    city = CITIES[0];
  }

  const rise = timeForAlt(city, dateStr, 0, true);
  const set = timeForAlt(city, dateStr, 0, false);
  const dawn = timeForAlt(city, dateStr, -6, true);
  const dusk = timeForAlt(city, dateStr, -6, false);

  console.log("ЧАСЫ ОКНА — ТИТУС");
  console.log("------------------");
  console.log(`${city.name} · ${dateStr}`);
  console.log(`гражданский рассвет : ${fmtMinute(dawn)}`);
  console.log(`восход солнца      : ${fmtMinute(rise)}`);
  console.log(`закат солнца      : ${fmtMinute(set)}`);
  console.log(`гражданские сумерки: ${fmtMinute(dusk)}`);

  if (rise !== null && set !== null) {
    const length = set - rise;
    if (length > 0 && length < 1440) {
      const hh = Math.floor(length / 60), mm = Math.round(length % 60);
      console.log(`долгота дня      : ${hh} ч ${mm} мин`);
    }
  }
  console.log("");
  console.log("часы — в местном солнечном времени города (UTC + долгота/15).");
  process.exit(0);
}

main();