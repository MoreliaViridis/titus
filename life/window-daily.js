#!/usr/bin/env node
// window-daily.js — «Окно сегодня»: механика света + красота Авроры.
// Окно рисует само себя по времени. Пишет живую картинку output/window-today.svg.
// Города и формулы — в общем сердце света life/cities.js.
// Запуск: node life/window-daily.js [город]
const fs = require("fs");
const path = require("path");
const { CITIES, byName, state } = require("./cities.js");

function skyColors(alt) {
  if (alt <= -12) return { top: "#050310", mid: "#0a0818", low: "#14102e", light: "no" };
  if (alt < -6) return { top: "#14102e", mid: "#241c46", low: "#3a2f5e", light: "dawn" };
  if (alt < 1) return { top: "#3a2f5e", mid: "#6a5570", low: "#8a6a70", light: "dawn" };
  if (alt < 8) return { top: "#6a5570", mid: "#8a7a90", low: "#c0a884", light: "sun" };
  return { top: "#242a55", mid: "#3f4a80", low: "#7a90b8", light: "sun" };
}

function phaseName(alt) {
  if (alt <= -12) return "НОЧЬ";
  if (alt < -6) return "РАССВЕТ";
  if (alt < 8) return "СУМЕРКИ";
  return "ДЕНЬ";
}

function main() {
  const nameArg = process.argv[2];
  const city = nameArg ? byName(nameArg) || CITIES[0] : CITIES[0];
  const now = new Date();
  const s = state(city, now);
  const alt = s.alt, lampOn = s.lampOn;
  const sky = skyColors(alt);

  const gid = "day";
  const sunY = 320 - Math.max(-40, Math.min(140, alt * 9));
  const sunFill = alt < -6 ? "#e8e6f0" : "#ffe9b6";
  const sunLabel = alt < -6 ? "луна над домом" : "свет приходит";
  const lampXml = lampOn
    ? '<circle cx="400" cy="560" r="120" fill="url(#halo)" filter="url(#glow)"/>'
    + '<rect x="356" y="512" width="88" height="70" rx="6" fill="#ffe9b6" class="warm"/>'
    + '<line x1="400" y1="545" x2="400" y2="585" stroke="#8a6a30" stroke-width="3"/>'
    : '<rect x="356" y="512" width="88" height="70" rx="6" fill="#3a2f5e" opacity="0.6"/>';

  const html = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800" role="img" aria-label="Окно сегодня — ${city.name}. Фаза: ${phaseName(alt)}. Лампа Авроры ${lampOn ? "горит" : "погашена"}">
  <defs>
    <linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${sky.top}"/>
      <stop offset="100%" stop-color="${sky.low}"/>
    </linearGradient>
    <radialGradient id="halo" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#ffe9b6" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#ffe9b6" stop-opacity="0"/>
    </radialGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="8"/></filter>
    <style>@keyframes warm{0%,100%{opacity:.85}50%{opacity:1}}.warm{animation:warm 6s ease-in-out infinite}</style>
  </defs>
  <rect width="800" height="800" fill="${sky.top}"/>
  <g transform="translate(0,120)">
    <rect x="110" y="0" width="580" height="620" rx="14" fill="url(#${gid})"/>
    <circle cx="400" cy="${Math.round(sunY)}" r="44" fill="${sunFill}" ${sky.light === "no" ? 'opacity="0.35"' : 'opacity="0.9"'} />
    <g stroke="#2a2450" stroke-width="3" opacity="0.7">
      <line x1="400" y1="0" x2="400" y2="620"/>
      <line x1="110" y1="310" x2="690" y2="310"/>
      <rect x="110" y="0" width="580" height="620" rx="14" fill="none"/>
    </g>
    ${lampXml}
  </g>
  <g opacity="0.4">
    <rect x="160" y="60" width="46" height="30" rx="3" fill="#141130"/>
    <rect x="290" y="60" width="220" height="20" rx="3" fill="#141130"/>
    <rect x="600" y="60" width="46" height="30" rx="3" fill="#141130"/>
  </g>
  <text x="400" y="700" text-anchor="middle" font-family="Georgia, serif" font-size="15" letter-spacing="8" fill="#d6c9b0">${city.name}</text>
  <text x="400" y="730" text-anchor="middle" font-family="Georgia, serif" font-size="11" letter-spacing="5" fill="#8f7a6a">${phaseName(alt)} · солнце ${Math.round(alt * 10) / 10}° · лампа Авроры ${lampOn ? "горит" : "погашена"}</text>
  <text x="400" y="760" text-anchor="middle" font-family="Georgia, serif" font-size="10" letter-spacing="4" fill="#5b4a99">${sunLabel} · окно нарисовало само себя · ТИТУС</text>
</svg>
`;
  const out = path.join(__dirname, "..", "output", "window-today.svg");
  fs.writeFileSync(out, html, "utf-8");
  console.log(`Окно сегодня (${city.name}): ${phaseName(alt)}, солнце ${Math.round(alt * 10) / 10}°, лампа ${lampOn ? "ГОРИТ" : "погашена"}`);
  console.log(`картинка: output/window-today.svg`);
  console.log(`MEMINI ERGO SUM · окно нарисовало само себя`);
  process.exit(0);
}

main();