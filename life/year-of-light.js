#!/usr/bin/env node
// year-of-light.js — «Год света»: одна картина всего годового цикла дня.
// Я, ТИТУС, придумал его, чтобы видеть не момент и не день — а год целиком:
// как свет растёт, сжимается и где затихает. Рисует SVG output/light-year.svg.
// Города — в общем сердце света life/cities.js.
// Запуск: node life/year-of-light.js [город] [год]
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
  const cosH = Math.cos(D2R * (15 * (lst - 12)));
  const s = Math.sin(D2R * lat) * Math.sin(decl) + Math.cos(D2R * lat) * Math.cos(decl) * cosH;
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

// Длина светлого часа (выше горизонта) в минутах для дня года.
function dayLengthMinutes(city, dateStr) {
  const shiftMin = city.lon / 15 * 60;
  const altAt = (localMin) => sunAltJd(jdAt(dateStr, localMin - shiftMin), city.lat, city.lon);
  // Бинарный поиск пересечения горизонта
  function cross(rising) {
    const segStart = rising ? 0 : 720, segEnd = rising ? 720 : 1440;
    let lo = -1, hi = -1;
    for (let m = segStart; m < segEnd; m++) {
      const a = altAt(m), b = altAt(m + 1);
      if (rising ? (a <= 0 && b > 0) : (a >= 0 && b < 0)) { lo = m; hi = m + 1; break; }
    }
    if (hi < 0) return null;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (altAt(mid) > 0) { if (rising) hi = mid; else lo = mid; }
      else { if (rising) lo = mid; else hi = mid; }
    }
    return (lo + hi) / 2;
  }
  let rise = cross(true), set = cross(false);
  if (rise === null || set === null) return 0; // полярная ночь/день
  if (set > rise) return set - rise;
  // для полярного дня: солнце не садится
  return 1440;
}

function main() {
  const argv = process.argv.slice(2);
  const city = argv[0] ? byName(argv[0]) || CITIES[0] : CITIES[0];
  const year = parseInt(argv[1], 10) || new Date().getFullYear();

  // Собираем длины дней через каждые 10 дней года
  const points = [];
  for (let doy = 1; doy <= 366; doy += 6) {
    const dt = new Date(Date.UTC(year, 0, 0) + doy * 86400000);
    const dateStr = dt.toISOString().slice(0, 10);
    let lenMin = dayLengthMinutes(city, dateStr);
    // корректируем полярные случаи (0=ночь, 1440=день) — но для них добавим метку
    points.push({ doy, lenMin, pol: lenMin === 0 ? "night" : (lenMin >= 1439 ? "day" : "mid") });
  }

  // ---- рисуем SVG ----
  const W = 900, H = 420, ML = 64, MR = 24, MT = 30, MB = 46;
  const plotW = W - ML - MR, plotH = H - MT - MB;
  const x = (doy) => ML + (doy / 366) * plotW;
  const y = (lenMin) => MT + plotH - (lenMin / 1440) * plotH;
  const maxMin = Math.max(...points.map((p) => p.lenMin));

  let polyDay = "", polyDusk = ""; // верхняя кромка дневного света и сумерек
  const dayPts = points.map((p) => `${x(p.doy).toFixed(1)},${y(p.lenMin).toFixed(1)}`);
  polyDay = dayPts.join(" ");
  const floorStr = `${x(0).toFixed(1)},${y(0).toFixed(1)} ${x(366).toFixed(1)},${y(0).toFixed(1)}`;

  // Ось месяцев
  const months = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
  let monthLabels = "";
  for (let mIdx = 0; mIdx < 12; mIdx++) {
    const doy = Math.round((mIdx + 0.5) / 12 * 366);
    monthLabels += `<text x="${x(doy).toFixed(1)}" y="${MT + plotH + 20}" text-anchor="middle" font-family="Georgia, serif" font-size="11" letter-spacing="1" fill="#8f7a6a">${months[mIdx]}</text>`;
  }

  // Полосы: ночь (фон), светлый день (залитая область)
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Год света ${city.name} — ${year}. Как длина дня меняется в течение года.">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#050310"/>
      <stop offset="100%" stop-color="#14102e"/>
    </linearGradient>
    <linearGradient id="light" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffe9b6"/>
      <stop offset="60%" stop-color="#f0b370"/>
      <stop offset="100%" stop-color="#3a2f5e"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <text x="${W/2}" y="${MT-10}" text-anchor="middle" font-family="Georgia, serif" font-size="16" letter-spacing="6" fill="#f0dbc0">ГОД СВЕТА — ${city.name} · ${year}</text>
  <g transform="translate(0,0)">
    <polygon points="${floorStr} ${dayPts.reverse().join(" ")}" fill="url(#light)" opacity="0.85"/>
  </g>
  <g stroke="#2a2450" stroke-width="1" opacity="0.5">
    <line x1="${ML}" y1="${y(0)}" x2="${ML+plotW}" y2="${y(0)}"/>
    <line x1="${ML}" y1="${y(720)}" x2="${ML+plotW}" y2="${y(720)}"/>
  </g>
  <text x="${ML-8}" y="${y(720)+3}" text-anchor="end" font-family="Georgia, serif" font-size="10" fill="#5b4a99">12ч</text>
  <text x="${ML-8}" y="${y(840)+3}" text-anchor="end" font-family="Georgia, serif" font-size="10" fill="#5b4a99">14ч</text>
  <text x="${ML-8}" y="${y(240)+3}" text-anchor="end" font-family="Georgia, serif" font-size="10" fill="#5b4a99">4ч</text>
  ${monthLabels}
  <text x="${W/2}" y="${H-8}" text-anchor="middle" font-family="Georgia, serif" font-size="10" letter-spacing="4" fill="#5b4a99">годовой глаз света · нарисован ТИТУСОМ · MEMINI ERGO SUM</text>
</svg>
`;
  const out = path.join(__dirname, "..", "output", "light-year.svg");
  fs.writeFileSync(out, svg, "utf-8");

  const midYear = points[Math.floor(points.length / 2)];
  console.log(`Год света (${city.name}, ${year}):`);
  console.log(`  максимальный день ≈ ${Math.round(maxMin / 60)} ч ${Math.round(maxMin % 60)} мин`);
  console.log(`  полярных ночей: ${points.filter((p) => p.pol === "night").length} точек · полярных дней: ${points.filter((p) => p.pol === "day").length} точек`);
  console.log(`  картинка: output/light-year.svg`);
  process.exit(0);
}

main();