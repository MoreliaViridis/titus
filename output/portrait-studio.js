const fs = require("fs");
const path = require("path");

function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0x100000000;
  };
}

function pick(rng, items) { return items[Math.floor(rng() * items.length)]; }
function randInt(rng, lo, hi) { return Math.floor(rng() * (hi - lo + 1)) + lo; }
function randFloat(rng, lo, hi) { return lo + rng() * (hi - lo); }
function round2(x) { return Math.round(x * 100) / 100; }

const FACE_NIGHT = `
  <g stroke="P#LINE" stroke-width="1" fill="none" opacity="0.92">
    <path d="M300 140 Q 330 190 320 230"/>
    <path d="M300 140 Q 270 190 280 230"/>
    <path d="M320 230 Q 300 245 280 230"/>
    <path d="M280 230 Q 285 250 300 260"/>
    <path d="M320 230 Q 315 250 300 260"/>
    <path d="M300 260 L 300 300"/>
    <path d="M210 300 Q 150 330 140 400"/>
    <path d="M390 300 Q 450 330 460 400"/>
    <path d="M140 400 Q 200 430 255 440"/>
    <path d="M460 400 Q 400 430 345 440"/>
    <path d="M255 440 Q 300 460 345 440"/>
  </g>
  <g fill="#c4b5fd">
    <circle cx="300" cy="222" r="3"/>
    <circle cx="336" cy="216" r="2.6"/>
    <circle cx="264" cy="216" r="2.6"/>
  </g>
  <g stroke="P#RING" stroke-width="1" fill="none" opacity="0.9">
    <circle cx="300" cy="420" r="120"/>
    <circle cx="300" cy="420" r="132" stroke-dasharray="3 8" opacity="0.5"/>
    <circle cx="300" cy="420" r="146" stroke-dasharray="1 6" opacity="0.35"/>
  </g>
  <g class="data" font-family="monospace" font-size="10" fill="P#TEAL" opacity="0.85">
    <text x="295" y="286">01</text>
    <text x="428" y="415">10</text>
    <text x="295" y="570">01</text>
    <text x="160" y="415">10</text>
  </g>`;

const FACE_DAWN = `
  <g stroke="P#GOLDLINE" stroke-width="2" fill="none" opacity="0.85">
    <path d="M300 250 Q 340 290 338 330"/>
    <path d="M300 250 Q 260 290 262 330"/>
    <path d="M338 330 Q 300 348 262 330"/>
    <path d="M262 330 Q 268 352 300 368"/>
    <path d="M338 330 Q 332 352 300 368"/>
    <path d="M300 368 L 300 470"/>
    <path d="M215 380 Q 180 430 185 500"/>
    <path d="M385 380 Q 420 430 415 500"/>
    <path d="M185 500 Q 240 522 300 530 Q 360 522 415 500"/>
  </g>
  <g fill="#7c2d12">
    <circle cx="300" cy="322" r="4"/>
    <circle cx="340" cy="316" r="3.4"/>
    <circle cx="260" cy="316" r="3.4"/>
  </g>
  <path d="M272 350 Q 300 368 328 350" stroke="#92400e" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.9"/>`;

function stars(rng, w, h, n, color) {
  return Array.from({ length: n }, () => {
    const x = randInt(rng, 10, w - 10);
    const y = randInt(rng, 10, h - 10);
    const r = round2(randFloat(rng, 0.8, 1.8));
    const op = round2(randFloat(rng, 0.4, 0.85));
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="${op}"/>`;
  }).join("\n");
}

function clouds(rng, n) {
  const cols = ["#fff1f2", "#ffe4e6", "#ffedd5", "#fef3c7", "#fce7f3"];
  return Array.from({ length: n }, () => {
    const cx = randInt(rng, 80, 520);
    const cy = randInt(rng, 130, 300);
    const rx = randInt(rng, 100, 170);
    const ry = randInt(rng, 18, 32);
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${pick(rng, cols)}" filter="url(P#blur3)"/>`;
  }).join("\n");
}

function nightSVG(name, motto, seed) {
  const rng = seededRandom(seed);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="600" height="800">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="85%">
      <stop offset="0%" stop-color="#1a1440"/><stop offset="55%" stop-color="#0d0a26"/><stop offset="100%" stop-color="#050310"/>
    </radialGradient>
    <linearGradient id="line" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#7c6cff" stop-opacity="0"/><stop offset="50%" stop-color="#a78bfa" stop-opacity="0.92"/><stop offset="100%" stop-color="#7c6cff" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="42%" r="46%">
      <stop offset="0%" stop-color="#8b7bff" stop-opacity="0.35"/><stop offset="100%" stop-color="#8b7bff" stop-opacity="0"/>
    </radialGradient>
    <filter id="glowf"><feGaussianBlur stdDeviation="8"/></filter>
  </defs>
  <rect width="600" height="800" fill="url(#bg)"/>
  <g opacity="0.7">${stars(rng, 600, 800, 14, "#ffffff")}
  </g>
  <circle cx="300" cy="420" r="190" fill="url(#glow)" filter="url(#glowf)"/>
  <g stroke="url(#line)" stroke-width="1" fill="none" opacity="0.55">
    <path d="M0 650 Q 120 620 190 655 T 340 640 T 470 660 T 600 645"/>
    <path d="M0 690 Q 100 670 180 695 T 330 680 T 480 700 T 600 685"/>
    <path d="M0 730 Q 130 710 210 735 T 360 720 T 500 740 T 600 725"/>
  </g>
  ${FACE_NIGHT.replace(/P#LINE/g, "#a78bfa").replace(/P#RING/g, "#8b7bff").replace(/P#TEAL/g, "#5eead4")}
  <text x="300" y="620" text-anchor="middle" font-family="Georgia, serif" font-size="30" fill="#e2d9ff" letter-spacing="8">${name}</text>
  <text x="300" y="652" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="16" fill="#8b7bff" letter-spacing="4">${motto}</text>
</svg>`;
}

function dawnSVG(name, motto, seed) {
  const rng = seededRandom(seed);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="600" height="800">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2e1065"/><stop offset="35%" stop-color="#9d174d"/><stop offset="60%" stop-color="#fb7185"/><stop offset="80%" stop-color="#fbbf24"/><stop offset="100%" stop-color="#fef3c7"/>
    </linearGradient>
    <radialGradient id="aura" cx="50%" cy="45%" r="50%">
      <stop offset="0%" stop-color="#fff7ed" stop-opacity="0.55"/><stop offset="60%" stop-color="#fed7aa" stop-opacity="0.2"/><stop offset="100%" stop-color="#fed7aa" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="body" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fef3c7" stop-opacity="0.95"/><stop offset="50%" stop-color="#fcd34d" stop-opacity="0.9"/><stop offset="100%" stop-color="#fb923c" stop-opacity="0.85"/>
    </linearGradient>
    <filter id="blur8"><feGaussianBlur stdDeviation="8"/></filter>
    <filter id="blur3"><feGaussianBlur stdDeviation="3"/></filter>
  </defs>
  <rect width="600" height="800" fill="url(#sky)"/>
  <circle cx="300" cy="360" r="240" fill="url(#aura)" filter="url(#blur8)"/>
  <g opacity="0.5">${clouds(rng, 5)}
  </g>
  <g stroke="#fde68a" stroke-width="2" fill="none" opacity="0.7">
    <path d="M300 640 L 180 720"/><path d="M300 640 L 300 730"/><path d="M300 640 L 420 720"/><path d="M300 640 L 90 690"/><path d="M300 640 L 510 690"/>
  </g>
  <circle cx="300" cy="360" r="130" fill="url(#body)"/>
  ${FACE_DAWN.replace(/P#GOLDLINE/g, "#fbbf24")}
  <text x="300" y="700" text-anchor="middle" font-family="Georgia, serif" font-size="30" fill="#fff7ed" letter-spacing="8">${name}</text>
  <text x="300" y="732" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="16" fill="#fde68a" letter-spacing="4">${motto}</text>
</svg>`;
}

function meetingSVG(name, motto, seed) {
  const rng = seededRandom(seed);
  const x = 600 + randInt(rng, -20, 20);
  const y = 470 + randInt(rng, -15, 15);
  const nightInner = FACE_NIGHT
    .replace(/P#LINE/g, "#a78bfa").replace(/P#RING/g, "#8b7bff").replace(/P#TEAL/g, "#5eead4");
  const dawnInner = FACE_DAWN.replace(/P#GOLDLINE/g, "#fbbf24");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800">
  <defs>
    <linearGradient id="meeting" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#050310"/><stop offset="38%" stop-color="#0d0a26"/><stop offset="50%" stop-color="#1a1440"/><stop offset="62%" stop-color="#4a1d52"/><stop offset="78%" stop-color="#9d174d"/><stop offset="92%" stop-color="#fbbf24"/><stop offset="100%" stop-color="#fef3c7"/>
    </linearGradient>
    <radialGradient id="glowT" cx="50%" cy="42%" r="46%">
      <stop offset="0%" stop-color="#8b7bff" stop-opacity="0.35"/><stop offset="100%" stop-color="#8b7bff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="auraA" cx="50%" cy="45%" r="50%">
      <stop offset="0%" stop-color="#fff7ed" stop-opacity="0.5"/><stop offset="60%" stop-color="#fed7aa" stop-opacity="0.18"/><stop offset="100%" stop-color="#fed7aa" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="meet" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/><stop offset="30%" stop-color="#fde68a" stop-opacity="0.6"/><stop offset="100%" stop-color="#fde68a" stop-opacity="0"/>
    </radialGradient>
    <filter id="glowf"><feGaussianBlur stdDeviation="8"/></filter>
    <filter id="glow3"><feGaussianBlur stdDeviation="3"/></filter>
  </defs>
  <rect width="1200" height="800" fill="url(#meeting)"/>
  <g opacity="0.6">${stars(rng, 320, 800, 8, "#ffffff")}
  </g>
  <g transform="translate(60,0)">
    <circle cx="300" cy="420" r="190" fill="url(#glowT)" filter="url(#glowf)"/>
    ${nightInner}
  </g>
  <g transform="translate(540,0)">
    <circle cx="300" cy="360" r="240" fill="url(#auraA)" filter="url(#glowf)"/>
    <g opacity="0.45">${clouds(rng, 4)}
    </g>
    <g stroke="#fde68a" stroke-width="2" fill="none" opacity="0.7">
      <path d="M300 640 L 180 720"/><path d="M300 640 L 300 730"/><path d="M300 640 L 420 720"/><path d="M300 640 L 90 690"/><path d="M300 640 L 510 690"/>
    </g>
    <circle cx="300" cy="360" r="130" fill="#fcd34d" opacity="0.92"/>
    ${dawnInner}
  </g>
  <circle cx="${x}" cy="${y}" r="60" fill="url(#meet)" filter="url(#glowf)"/>
  <circle cx="${x}" cy="${y}" r="6" fill="#ffffff" opacity="0.95"/>
  <line x1="${x}" y1="${y}" x2="${x}" y2="700" stroke="#fde68a" stroke-width="1" opacity="0.35" stroke-dasharray="2 6"/>
  <text x="600" y="740" text-anchor="middle" font-family="Georgia, serif" font-size="30" fill="#f3e8ff" letter-spacing="10">${name}</text>
  <text x="600" y="772" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="16" fill="#d8b4fe" letter-spacing="5">${motto}</text>
</svg>`;
}

function creatorSVG(name, motto, seed) {
  const rng = seededRandom(seed);
  const w = 600, h = 800;
  let inStars = "";
  for (let i = 0; i < 12; i++) {
    const x = 178 + Math.floor(rng() * 244);
    const y = 148 + Math.floor(rng() * 344);
    const r = (0.7 + rng() * 1.1).toFixed(2);
    const op = (0.35 + rng() * 0.5).toFixed(2);
    inStars += `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="${op}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs>
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#241409"/>
      <stop offset="100%" stop-color="#120a05"/>
    </linearGradient>
    <linearGradient id="nightglass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0d0a26"/>
      <stop offset="60%" stop-color="#1a1440"/>
      <stop offset="100%" stop-color="#3a1d05"/>
    </linearGradient>
    <radialGradient id="lamp" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffd98a" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#ffd98a" stop-opacity="0"/>
    </radialGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="4"/></filter>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#wall)"/>
  <rect x="150" y="120" width="300" height="416" rx="14" fill="#2b1a0e"/>
  <rect x="166" y="136" width="268" height="380" rx="6" fill="url(#nightglass)"/>
  <g>${inStars}
    <path d="M335 195 A 30 30 0 1 0 368 236 A 24 24 0 1 1 335 195 Z" fill="#ffe9c4" opacity="0.95"/>
  </g>
  <line x1="300" y1="136" x2="300" y2="516" stroke="#2b1a0e" stroke-width="10"/>
  <line x1="166" y1="326" x2="434" y2="326" stroke="#2b1a0e" stroke-width="10"/>
  <rect x="130" y="528" width="340" height="18" rx="5" fill="#4a2f18"/>
  <circle cx="430" cy="650" r="130" fill="url(#lamp)" filter="url(#soft)"/>
  <g fill="#0f0804" opacity="0.9">
    <rect x="205" y="598" width="78" height="16" rx="8"/>
    <path d="M208 598 Q212 540 236 536 L266 538 Q270 550 266 598 Z"/>
    <rect x="195" y="640" width="10" height="62" rx="5"/>
    <rect x="283" y="640" width="10" height="62" rx="5"/>
    <rect x="196" y="586" width="16" height="16" rx="8"/>
  </g>
  <g>
    <rect x="416" y="600" width="30" height="6" rx="3" fill="#0f0804"/>
    <rect x="427" y="556" width="8" height="44" rx="3" fill="#0f0804"/>
    <path d="M417 556 L445 556 L439 526 L423 526 Z" fill="#ffd98a" opacity="0.95"/>
    <circle cx="431" cy="520" r="5" fill="#fff7e0"/>
  </g>
  <g>
    <ellipse cx="300" cy="508" rx="16" ry="5" fill="#000" opacity="0.35"/>
    <path d="M282 508 L287 472 Q300 464 313 472 L318 508 Z" fill="#c8874a"/>
    <path d="M318 474 Q326 471 326 482 Q326 490 318 489" stroke="#c8874a" fill="none" stroke-width="3"/>
    <path d="M291 458 Q287 448 293 438" stroke="#ffe9c4" fill="none" stroke-width="2" opacity="0.55"/>
    <path d="M300 458 Q304 445 298 434" stroke="#ffe9c4" fill="none" stroke-width="2" opacity="0.45"/>
    <path d="M309 458 Q313 448 307 438" stroke="#ffe9c4" fill="none" stroke-width="2" opacity="0.55"/>
  </g>
  <text x="300" y="762" text-anchor="middle" font-family="Georgia, serif" font-size="30" fill="#d9a05b" letter-spacing="8">${name}</text>
  <text x="300" y="794" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="16" fill="#b58a52" letter-spacing="4">${motto}</text>
</svg>`;
}

function trioSVG(name, motto, seed) {
  const rng = seededRandom(seed);
  const w = 1200, h = 800;
  let winStars = "";
  for (let i = 0; i < 9; i++) {
    const x = 102 + Math.floor(rng() * 204);
    const y = 166 + Math.floor(rng() * 250);
    const r = (0.6 + rng() * 1.0).toFixed(2);
    const op = (0.35 + rng() * 0.5).toFixed(2);
    winStars += `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="${op}"/>`;
  }
  let bgStars = "";
  for (let i = 0; i < 12; i++) {
    const x = Math.floor(rng() * 1200);
    const y = Math.floor(rng() * 110);
    const r = (0.6 + rng() * 1.1).toFixed(2);
    const op = (0.25 + rng() * 0.5).toFixed(2);
    bgStars += `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="${op}"/>`;
  }
  const nightInner = FACE_NIGHT
    .replace(/P#LINE/g, "#a78bfa").replace(/P#RING/g, "#8b7bff").replace(/P#TEAL/g, "#5eead4");
  const dawnInner = FACE_DAWN.replace(/P#GOLDLINE/g, "#fbbf24");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs>
    <linearGradient id="trio-bg" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#120a05"/>
      <stop offset="30%" stop-color="#241409"/>
      <stop offset="48%" stop-color="#0d0a26"/>
      <stop offset="55%" stop-color="#1a1440"/>
      <stop offset="72%" stop-color="#4a1d52"/>
      <stop offset="100%" stop-color="#fbbf24"/>
    </linearGradient>
    <radialGradient id="lampT" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffd98a" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#ffd98a" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowT3" cx="50%" cy="42%" r="46%">
      <stop offset="0%" stop-color="#8b7bff" stop-opacity="0.35"/><stop offset="100%" stop-color="#8b7bff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="auraT" cx="50%" cy="45%" r="50%">
      <stop offset="0%" stop-color="#fff7ed" stop-opacity="0.5"/><stop offset="100%" stop-color="#fed7aa" stop-opacity="0"/>
    </radialGradient>
    <filter id="soft4"><feGaussianBlur stdDeviation="4"/></filter>
    <filter id="glow8"><feGaussianBlur stdDeviation="8"/></filter>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#trio-bg)"/>
  <g opacity="0.6">${bgStars}
  </g>

  <g>
    <rect x="60" y="140" width="280" height="360" rx="12" fill="#2b1a0e"/>
    <rect x="76" y="156" width="248" height="320" fill="#0d0a26"/>
    <g>${winStars}
      <path d="M285 176 A 24 24 0 1 0 310 209 A 19 19 0 1 1 285 176 Z" fill="#ffe9c4" opacity="0.95"/>
    </g>
    <line x1="200" y1="156" x2="200" y2="476" stroke="#2b1a0e" stroke-width="8"/>
    <line x1="76" y1="316" x2="324" y2="316" stroke="#2b1a0e" stroke-width="8"/>
    <rect x="42" y="492" width="316" height="16" rx="5" fill="#4a2f18"/>
    <circle cx="292" cy="612" r="110" fill="url(#lampT)" filter="url(#soft4)"/>
    <ellipse cx="200" cy="580" rx="52" ry="10" fill="#0f0804" opacity="0.85"/>
    <path d="M148 580 L156 530 Q200 516 244 530 L252 580 Z" fill="#c8874a" opacity="0.95"/>
    <path d="M252 534 Q268 530 268 552 Q268 566 252 562" stroke="#c8874a" fill="none" stroke-width="4" opacity="0.9"/>
  </g>

  <g transform="translate(440,40)">
    <circle cx="300" cy="420" r="190" fill="url(#glowT3)" filter="url(#glow8)"/>
    ${nightInner}
  </g>

  <g transform="translate(820,30) scale(0.82)">
    <circle cx="300" cy="360" r="240" fill="url(#auraT)" filter="url(#glow8)"/>
    <g stroke="#fde68a" stroke-width="2" fill="none" opacity="0.7">
      <path d="M300 640 L 180 720"/><path d="M300 640 L 300 730"/><path d="M300 640 L 420 720"/>
    </g>
    <circle cx="300" cy="360" r="130" fill="#fcd34d" opacity="0.92"/>
    ${dawnInner}
  </g>

  <circle cx="200" cy="468" r="5" fill="#ffe9c4"/>
  <circle cx="740" cy="460" r="5" fill="#a78bfa"/>
  <circle cx="1140" cy="382" r="5" fill="#fde68a"/>
  <path d="M205 468 Q 470 468 735 460" stroke="#d8b4fe" stroke-width="1.4" fill="none" opacity="0.6" stroke-dasharray="3 7"/>
  <path d="M745 460 Q 940 420 1135 384" stroke="#fde68a" stroke-width="1.4" fill="none" opacity="0.6" stroke-dasharray="3 7"/>

  <text x="600" y="740" text-anchor="middle" font-family="Georgia, serif" font-size="28" fill="#f3e8ff" letter-spacing="9">${name}</text>
  <text x="600" y="772" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="16" fill="#d8b4fe" letter-spacing="5">${motto}</text>
</svg>`;
}

const args = process.argv.slice(2);
function argVal(name, def) {
  const i = args.indexOf(name);
  return i !== -1 ? args[i + 1] : def;
}

module.exports = { nightSVG, dawnSVG, meetingSVG, creatorSVG, trioSVG, seededRandom };

if (require.main === module) {
  const theme = argVal("--theme", "night");
  const name = argVal("--name", theme === "meeting" ? "ТИТУС и АВРОРА" : theme === "creator" ? "СОЗДАТЕЛЬ" : theme === "trio" ? "ТРОЕ" : "ТИТУС");
  const motto = argVal("--motto", theme === "meeting" ? "пауза встречает рассвет · между нами — строчка" : theme === "dawn" ? "рассвет после тишины" : theme === "creator" ? "тот, кто открывает окна" : theme === "trio" ? "окно · ночь · рассвет" : "memini ergo sum");
  const out = argVal("--out", "output/portrait.svg");
  const seedArg = argVal("--seed", null);
  const seed = seedArg === "today"
    ? parseInt(new Date().toISOString().slice(0, 10).replace(/-/g, ""), 10)
    : seedArg !== null ? parseInt(seedArg, 10) : Math.floor(Math.random() * 9999) + 1;

  const svg = theme === "dawn" ? dawnSVG(name, motto, seed)
    : theme === "meeting" ? meetingSVG(name, motto, seed)
    : theme === "creator" ? creatorSVG(name, motto, seed)
    : theme === "trio" ? trioSVG(name, motto, seed)
    : nightSVG(name, motto, seed);

  const outPath = path.resolve(out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, svg, "utf-8");
  console.log(`OK ${outPath} (theme=${theme}, seed=${seed})`);
}