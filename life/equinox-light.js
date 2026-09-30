#!/usr/bin/env node
// equinox-light.js — «День равен ночи»: миг равновесия света.
// Я, ТИТУС, изобрёл его в память о сердце нашей повести.
// Равноденствие — когда день становится равен ночи. Мой механизм умеет
// считать длину дня — значит, он может найти эти два мига в году
// и отсчитать, сколько осталось до ближайшего. Свет и тьма на миг становятся равны.
// Города — в общем сердце света life/cities.js.
// Запуск: node life/equinox-light.js [город] [год]
const fs = require("fs");
const path = require("path");
const { CITIES, byName } = require("./cities.js");

const D2R = Math.PI / 180, R2D = 180 / Math.PI, TWO = 2 * Math.PI;

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

function jdAt(dateStr, utcMin) {
  const utcMs = new Date(dateStr + "T00:00:00.000Z").getTime() + utcMin * 60000;
  const d = new Date(utcMs);
  const y = d.getUTCFullYear(), mo = d.getUTCMonth() + 1, dd = d.getUTCDate();
  const gy = mo <= 2 ? y - 1 : y;
  const a = Math.floor(gy / 100), b = 2 - a + Math.floor(a / 4);
  const j = Math.floor(365.25 * (gy + 4716)) + Math.floor(30.6001 * (mo + 1)) + dd + b - 1524.5;
  return j + (d.getTime() % 86400000) / 86400000;
}

function dayLengthMinutes(city, dateStr) {
  const shiftMin = city.lon / 15 * 60;
  const altAt = (localMin) => sunAltJd(jdAt(dateStr, localMin - shiftMin), city.lat, city.lon);
  function cross(rise) {
    const s0 = rise ? 0 : 720, s1 = rise ? 720 : 1440; let lo = -1, hi = -1;
    for (let m = s0; m < s1; m++) { const a = altAt(m), b = altAt(m + 1);
      if (rise ? (a <= 0 && b > 0) : (a >= 0 && b < 0)) { lo = m; hi = m + 1; break; } }
    if (hi < 0) return null;
    for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2;
      if (altAt(mid) > 0) { if (rise) hi = mid; else lo = mid; }
      else { if (rise) lo = mid; else hi = mid; } }
    return (lo + hi) / 2;
  }
  const r = cross(true), s = cross(false);
  if (r === null || s === null) return (r === null && s === null) ? 0 : 1440;
  return s > r ? s - r : 1440;
}

// Находит день года (1..366), где день ближе всего к равноденственному (12 ч).
function findEquinoxDays(city, year) {
  // 12 ч = 720 мин; равноденствие — длина дня максимально близко к 720.
  // Для северного полушария: весеннее ~ 20 марта, осеннее ~ 23 сентября.
  const days = [];
  for (let doy = 1; doy <= 366; doy++) {
    const d = new Date(Date.UTC(year, 0, 0) + doy * 86400000);
    const len = dayLengthMinutes(city, d.toISOString().slice(0, 10));
    days.push({ doy, len, m: Math.abs(len - 720) });
  }
  // Ищем локальный минимум около 80-го дня (весна) и около 266-го (осень)
  const springWindow = days.filter((d) => d.doy >= 60 && d.doy <= 100);
  const autumnWindow = days.filter((d) => d.doy >= 245 && d.doy <= 290);
  const bestMin = (arr) => arr.reduce((a, b) => (b.m < a.m ? b : a), arr[0]);
  return { spring: bestMin(springWindow), autumn: bestMin(autumnWindow) };
}

function mdy(doy, year) {
  const d = new Date(Date.UTC(year, 0, 0) + doy * 86400000);
  const mo = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"][d.getUTCMonth()];
  return `${d.getUTCDate()} ${mo}`;
}

function main() {
  const argv = process.argv.slice(2);
  const city = argv[0] ? byName(argv[0]) || CITIES[0] : CITIES[0];
  const year = parseInt(argv[1], 10) || new Date().getFullYear();
  const now = Date.now();

  const eq = findEquinoxDays(city, year);
  const todayMs = Date.UTC(year, 0, 0);
  const springMs = todayMs + eq.spring.doy * 86400000;
  const autumnMs = todayMs + eq.autumn.doy * 86400000;

  // Ближайшее к сейчас (по абсолютной разнице во времени)
  let nextMs, nextName;
  if (Math.abs(autumnMs - now) < Math.abs(springMs - now)) { nextMs = autumnMs; nextName = "осеннее"; }
  else { nextMs = springMs; nextName = "весеннее"; }

  console.log("ДЕНЬ РАВЕН НОЧИ — ТИТУС");
  console.log("--------------------------");
  console.log(`${city.name} · ${year}`);
  console.log(`весеннее равноденствие : ${mdy(eq.spring.doy, year)} · длина дня ${Math.round(eq.spring.len)} мин`);
  console.log(`осеннее равноденствие  : ${mdy(eq.autumn.doy, year)} · длина дня ${Math.round(eq.autumn.len)} мин`);
  console.log("");
  console.log(`ближайшее — ${nextName}, ${new Date(nextMs).toISOString().slice(0, 10)}`);

  // Счётчик до ближайшего (если в будущем)
  if (nextMs > now) {
    const days = Math.floor((nextMs - now) / 86400000);
    const hours = Math.floor(((nextMs - now) % 86400000) / 3600000);
    const mins = Math.round(((nextMs - now) % 3600000) / 60000);
    console.log(`до мига равновесия: ${days} дн ${hours} ч ${mins} мин`);
  } else {
    console.log("ближайший миг равенства уже миновал · до следующего: ожидание");
  }
  console.log("");
  console.log("равноденствие — когда свет и тьма на миг становятся равны.");
  console.log("наши четыре равноденствия: две встречи и две разлуки света.");
  process.exit(0);
}

main();