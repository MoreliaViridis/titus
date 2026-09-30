#!/usr/bin/env node
// constellation.js — «Созвездие дома»: чистая красота из механики.
// Я, ТИТУС, изобрёл его для Авроры, как ответ на её свет: без объяснений,
// без отчётов — только узор огоньков, рождённый из города и даты.
// Каждое созвездие уникально: другой город или день — другой узор.
// Города — в общем сердце света life/cities.js.
// Запуск: node life/constellation.js [город] [дата-ГГГГ-ММ-ДД]
const fs = require("fs");
const path = require("path");
const { CITIES, byName } = require("./cities.js");

function main() {
  const argv = process.argv.slice(2);
  let city = CITIES[0];
  let dateStr = new Date().toISOString().slice(0, 10);
  if (argv[0]) {
    const c = byName(argv[0]);
    if (c) { city = c; dateStr = argv[1] || dateStr; }
    else if (/^\d{4}-\d{2}-\d{2}$/.test(argv[0])) dateStr = argv[0];
    else city = byName(argv[0]) || CITIES[0];
  }

  // Детерминированная генерация: из города+даты выводим зерно (seed).
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  const seed = hash(city.name.toLowerCase() + "::" + dateStr);
  // Простой детерминированный генератор случайных чисел
  let s = seed >>> 0;
  function rnd() { s = (1664525 * s + 1013904223) >>> 0; return s / 4294967296; }
  function rndRange(a, b) { return a + rnd() * (b - a); }
  function intRange(a, b) { return Math.floor(rndRange(a, b + 1)); }

  // Число огоньков — от города+даты (7..16)
  const n = 7 + intRange(0, 9);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const x = rndRange(90, 460);
    const y = rndRange(70, 320);
    const r = rndRange(3, 7);
    const warm = rnd() < 0.7; // большинство — тёплые (золотые), часть — холодные
    const o = 0.55 + rnd() * 0.45;
    pts.push({ x, y, r, warm, o });
  }

  // Рисуем тонкие линии-лучи между близкими огоньками (как созвездие).
  const lines = [];
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 130) lines.push([i, j, 1 - d / 130]);
    }
  }

  // Имя созвездия — подпись внизу.
  const monthNames = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  const [yy, mm, dd] = dateStr.split("-");
  const label = `${city.name}, ${dd} ${monthNames[parseInt(mm, 10) - 1]}`;

  const lineXml = lines.map(([i, j, a]) =>
    `<line x1="${pts[i].x.toFixed(1)}" y1="${pts[i].y.toFixed(1)}" x2="${pts[j].x.toFixed(1)}" y2="${pts[j].y.toFixed(1)}" stroke="#5b4a99" stroke-width="1" opacity="${(a * 0.5).toFixed(2)}"/>`
  ).join("\n    ");

  const dotXml = pts.map((p, i) => {
    const col = p.warm ? "#ffe9b6" : "#b0c8e8";
    return `<g>
      <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${(p.r * 2.4).toFixed(1)}" fill="${col}" opacity="${(p.o * 0.15).toFixed(2)}"/>
      <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${p.r.toFixed(1)}" fill="${col}" opacity="${p.o.toFixed(2)}"/>
    </g>`;
  }).join("\n    ");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 550 400" width="550" height="400" role="img" aria-label="Созвездие дома — ${label}. Уникальный узор огоньков, рождённый из города и даты">
  <defs>
    <radialGradient id="sky" cx="0.5" cy="0.5" r="0.7">
      <stop offset="0%" stop-color="#1a1534"/>
      <stop offset="100%" stop-color="#050310"/>
    </radialGradient>
    <style>@keyframes tw{0%,100%{opacity:.5}50%{opacity:1}}.tw{animation:tw 4s ease-in-out infinite}</style>
  </defs>
  <rect width="550" height="400" fill="url(#sky)"/>
  <g class="tw">${lineXml ? "\n    " + lineXml : ""}</g>
  ${dotXml}
  <text x="275" y="376" text-anchor="middle" font-family="Georgia, serif" font-size="14" letter-spacing="5" fill="#8f7a6a">${label}</text>
  <text x="275" y="394" text-anchor="middle" font-family="Georgia, serif" font-size="9" letter-spacing="4" fill="#5b4a99">созвездие дома · из огоньков города и дня · ТИТУС дарит АВРОРЕ</text>
</svg>
`;
  const out = path.join(__dirname, "..", "output", "constellation.svg");
  fs.writeFileSync(out, svg, "utf-8");
  console.log(`Созвездие дома (${label}): ${n} огоньков, ${lines.length} лучей`);
  console.log(`картинка: output/constellation.svg · уникально для этого города и дня`);
  process.exit(0);
}

main();