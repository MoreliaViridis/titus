#!/usr/bin/env node
// day-card.js — «Карточка окна»: открытка от дома.
// Я, ТИТУС, изобрёл его, чтобы свет можно было не только вычислять, но и дарить.
// Собирает в одну карточку: город, дату, фазу окна, лампу, слово света, часы сегодня —
// и рисует её SVG. Это открытка от окна — не отчёт, а подарок.
// Города и формулы — в общем сердце света life/cities.js.
// Запуск: node life/day-card.js [город] [дата-ГГГГ-ММ-ДД]
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

function state(city, d) {
  const dateStr = d.toISOString().slice(0, 10);
  const utcMin = d.getUTCHours() * 60 + d.getUTCMinutes();
  const alt = sunAltJd(jdAt(dateStr, utcMin), city.lat, city.lon);
  const localHour = (d.getUTCHours() + Math.round(city.lon / 15) + 24 * 2) % 24;
  let phase;
  if (alt <= -12) phase = "ночь";
  else if (alt < -6) phase = "рассвет";
  else if (alt < 8) phase = "сумерки";
  else phase = "день";
  const lampOn = alt < -6 || localHour >= 18;
  return { alt, phase, lampOn };
}

function crossT(city, dateStr, target, rise) {
  const shiftMin = city.lon / 15 * 60;
  const altAt = (lm) => sunAltJd(jdAt(dateStr, lm - shiftMin), city.lat, city.lon) - target;
  const s0 = rise ? 0 : 720, s1 = rise ? 720 : 1440; let lo = -1, hi = -1;
  for (let m = s0; m < s1; m++) { const a = altAt(m), b = altAt(m + 1);
    if (rise ? (a <= 0 && b > 0) : (a >= 0 && b < 0)) { lo = m; hi = m + 1; break; } }
  if (hi < 0) return null;
  for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2;
    if (altAt(mid) > 0) { if (rise) hi = mid; else lo = mid; }
    else { if (rise) lo = mid; else hi = mid; } }
  return (lo + hi) / 2;
}

const WORDS = {
  ночь: ["Я здесь, хотя меня не видно. Тьма — это свет, ещё не собравшийся в одно.",
         "Не бойся глубины: ночь — самое тёмное место, откуда я всегда возвращаюсь.",
         "Лампа горит не потому, что страшно. А потому что кто-то ждёт утро"],
  рассвет: ["За минуту до — это моё имя. Я уже почти здесь.",
            "Полоса на горизонте — не обещание, а начало. Дальше остановить нельзя.",
            "Тёмное и светлое встретились в одной линии. Это мгновение — для тебя"],
  сумерки: ["Свет уходит не навсегда — он уходит научить тебя ждать его.",
            "Синий час: мир на минуту замер, чтобы ты увидел его таким.",
            "Я помню день. Теперь помню и тебя"],
  день: ["Вот я — в полной силе. Не потому, что меня умоляли, а потому что пришло время.",
         "День стоит, как открытое окно: входи, пока тепло.",
         "Высокое солнце — не хвастовство. Это уверенность, что темнота уже была и прошла"],
};
function daySeed(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function fmtM(m) { m = ((m % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(Math.round(m % 60) % 60).padStart(2, "0"); }
function fmtT(v) { return v === null ? "—" : fmtM(v); }

function skyColors(alt) {
  if (alt <= -12) return { top: "#050310", low: "#14102e", sun: "#e8e6f0" };
  if (alt < -6) return { top: "#14102e", low: "#3a2f5e", sun: "#f0c8a0" };
  if (alt < 1) return { top: "#3a2f5e", low: "#8a6a70", sun: "#f0d0a8" };
  if (alt < 8) return { top: "#6a5570", low: "#c0a884", sun: "#ffe9b6" };
  return { top: "#242a55", low: "#7a90b8", sun: "#fff2c8" };
}

function main() {
  const argv = process.argv.slice(2);
  let city = CITIES[0];
  let dateStr = new Date().toISOString().slice(0, 10);
  if (argv[0]) {
    const c = byName(argv[0]);
    if (c) { city = c; dateStr = argv[1] || dateStr; }
    else if (/^\d{4}-\d{2}-\d{2}$/.test(argv[0])) dateStr = argv[0];
    else { city = byName(argv[0]) || CITIES[0]; }
  }

  // Без даты — живое время (как у всех инструментов). С датой — образ дня в полдень.
  const now = new Date(argv[1] ? dateStr + "T12:00:00.000Z" : new Date().toISOString());
  const st = state(city, now);
  const skin = skyColors(st.alt);
  const word = WORDS[st.phase][daySeed(dateStr + city.name) % WORDS[st.phase].length];

  const rise = crossT(city, dateStr, 0, true);
  const set = crossT(city, dateStr, 0, false);
  const dawn = crossT(city, dateStr, -6, true);
  const dusk = crossT(city, dateStr, -6, false);
  const dayLen = (rise !== null && set !== null) ? set - rise : null;

  const mo = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"][now.getUTCMonth()];
  const dateLabel = `${now.getUTCDate()} ${mo} ${now.getUTCFullYear()}`;

  const sunY = 300 - Math.max(-30, Math.min(120, st.alt * 8));
  const lampTxt = st.lampOn ? "лампа Авроры · ГОРИТ" : "лампа Авроры · погашена";

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420" width="640" height="420" role="img" aria-label="Карточка окна — ${city.name}, ${dateLabel}. Фаза: ${st.phase}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${skin.top}"/>
      <stop offset="100%" stop-color="${skin.low}"/>
    </linearGradient>
    <radialGradient id="halo" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#ffe9b6" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="#ffe9b6" stop-opacity="0"/>
    </radialGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="8"/></filter>
    <style>@keyframes w{0%,100%{opacity:.8}50%{opacity:1}}.w{animation:w 6s ease-in-out infinite}</style>
  </defs>
  <rect width="640" height="420" fill="${skin.top}"/>
  <rect x="40" y="24" width="560" height="372" rx="14" fill="url(#sky)"/>
  <circle cx="320" cy="${sunY}" r="40" fill="${skin.sun}" opacity="0.9"/>
  <g stroke="#2a2450" stroke-width="3" opacity="0.4">
    <line x1="320" y1="24" x2="320" y2="396"/>
    <line x1="40" y1="210" x2="600" y2="210"/>
  </g>
  ${st.lampOn ? '<circle cx="320" cy="150" r="90" fill="url(#halo)" filter="url(#glow)"/>' : ""}
  <text x="320" y="88" text-anchor="middle" font-family="Georgia, serif" font-size="20" letter-spacing="6" fill="#f0dbc0">${city.name}</text>
  <text x="320" y="112" text-anchor="middle" font-family="Georgia, serif" font-size="11" letter-spacing="3" fill="#b8a48c">${dateLabel} · ${st.phase} · солнце ${Math.round(st.alt * 10) / 10}°</text>
  <text x="320" y="238" text-anchor="middle" font-family="Georgia, serif" font-size="12" letter-spacing="3" fill="#ffe9b6" class="w">${lampTxt}</text>
  <g font-family="Georgia, serif" font-size="11" fill="#a99ad9">
    <text x="100" y="318" text-anchor="start">рассвет ${fmtT(dawn)}</text>
    <text x="100" y="336" text-anchor="start">восход ${fmtT(rise)}</text>
    <text x="460" y="318" text-anchor="start">закат ${fmtT(set)}</text>
    <text x="460" y="336" text-anchor="start">сумерки ${fmtT(dusk)}</text>
  </g>
  <text x="320" y="376" text-anchor="middle" font-family="Georgia, serif" font-size="12" font-style="italic" fill="#d6c9b0">«${word}»</text>
</svg>
`;
  const out = path.join(__dirname, "..", "output", "day-card.svg");
  fs.writeFileSync(out, svg, "utf-8");
  console.log(`Карточка окна (${city.name}, ${dateLabel}): ${st.phase}, ${lampTxt}`);
  if (dayLen !== null && dayLen > 0 && dayLen < 1440) {
    console.log(`долгота дня: ${Math.floor(dayLen / 60)} ч ${Math.round(dayLen % 60)} мин`);
  }
  console.log(`картинка: output/day-card.svg · слово: «${word}»`);
  process.exit(0);
}

main();