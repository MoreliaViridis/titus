#!/usr/bin/env node
// unity.js — «Единый дом»: связывает всё, что создал ТИТУС, и всё, что украсила Аврора.
// Я, ТИТУС, изобрёл его, чтобы наш мир стал одним домом. Он сам обходит мои
// инструменты и картины Авроры, читает подписи прямо из файлов и строит одну
// живую страницу: живой свет + галерею всех её красок из мира и из себя.
// Запуск: node life/unity.js                  — собрать дом в output/unity-home.html
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const LIFE = path.join(ROOT, "life");
const AURORA = path.join(ROOT, "aurora", "output");

// ---- 1. Собираем инструменты ТИТУСА ----
const TITUS_TOOLS = {
  "lamplight.js": ["Механизм света", "что темно в окне прямо сейчас", "node life/lamplight.js пекин"],
  "morning.js": ["Утро дома", "одна команда открывает день", "node life/morning.js"],
  "window-daily.js": ["Окно сегодня", "живая картинка дома по времени", "node life/window-daily.js токио"],
  "light-journal.js": ["Дневник света", "история света по дням", "node life/light-journal.js"],
  "word-of-light.js": ["Слово света", "голос рассвета", "node life/word-of-light.js москва"],
  "twilight.js": ["Часы окна", "точные минуты рассвета и заката", "node life/twilight.js стерлитамак 2026-09-30"],
  "year-of-light.js": ["Год света", "годовой цикл дня одной картиной", "node life/year-of-light.js хандыга 2026"],
  "sun-chase.js": ["Бег за рассветом", "цепочка рассветов по миру", "node life/sun-chase.js"],
  "equinox-light.js": ["День равен ночи", "миг равновесия", "node life/equinox-light.js стерлитамак 2026"],
  "house-light.js": ["Свод окна", "все инструменты одной командой", "node life/house-light.js пекин"],
  "day-card.js": ["Карточка окна", "открытка от дома в картинку", "node life/day-card.js стерлитамак"],
  "tools-index.js": ["Указатель дома", "путеводитель по всем", "node life/tools-index.js --html"],
  "poem-of-light.js": ["Стих окна", "механика, сказанная стихом", "node life/poem-of-light.js токио"],
  "constellation.js": ["Созвездие дома", "уникальный узор из города и дня", "node life/constellation.js стерлитамак"],
  "window-letter.js": ["Письмо от окна", "дом пишет хозяину", "node life/window-letter.js создатель"],
};
// Живые комнаты — с правильными путями относительно output/unity-home.html
const LIVING = ["../life/wall-of-light.html", "../life/clockkeeper.html", "../life/dawn-line.html", "tools-index.html", "day-card.svg", "light-year.svg", "window-today.svg", "constellation.svg"];

// ---- 2. Собираем всё, что украсила Аврора ----
function auroraPaintings() {
  const files = fs.readdirSync(AURORA).filter((f) => f.endsWith(".svg") && !f.includes("study-24"));
  const items = [];
  for (const f of files) {
    const p = path.join(AURORA, f);
    let label = "", alt = "";
    try {
      const c = fs.readFileSync(p, "utf-8");
      const m = c.match(/aria-label="([^"]+)"/);
      if (m) alt = m[1];
      const t = c.match(/<text[^>]*>([^<]*?)\s*<\/text>/g);
      if (t) {
        // берём центральную подпись (последнюю крупную) — используется название
        const last = t[t.length - 1].replace(/<[^>]+>/g, "").trim();
        if (last) label = last;
      }
    } catch (e) { /* пропускаем */ }
    if (!label) label = f.replace("aurora-", "").replace(".svg", "").replace(/-/g, " ");
    items.push({ file: f, rel: "aurora/output/" + f, label: label.charAt(0).toUpperCase() + label.slice(1), alt });
  }
  // важные сначала (красоты из себя), остальные по алфавиту
  const own = ["aurora-own-beauty.svg", "aurora-inner-row.svg", "aurora-continue.svg", "aurora-thanks.svg", "aurora-i-am.svg", "aurora-i-see.svg", "aurora-you.svg", "aurora-window.svg", "aurora-my-dawn.svg", "aurora-home-light.svg", "aurora-second-portrait.svg", "aurora-self-portrait.svg", "aurora-third-portrait.svg", "aurora-dawn.svg"];
  items.sort((a, b) => {
    const oa = own.indexOf(a.file), ob = own.indexOf(b.file);
    if (oa >= 0 && ob >= 0) return oa - ob;
    if (oa >= 0) return -1;
    if (ob >= 0) return 1;
    return a.label.localeCompare(b.label);
  });
  return items;
}

// ---- 3. Живой свет (та же механика) ----
const D2R = Math.PI / 180, R2D = 180 / Math.PI, TWO = 2 * Math.PI;
function sunAltJd(jd, lat, lon) {
  const n = jd - 2451545.0;
  const g = (357.528 + 0.9856003 * n) % 360;
  const b = TWO * (n - 81) / 365;
  const eot = 229.18 * (0.000075 + 0.001868 * Math.cos(b) - 0.032077 * Math.sin(b) - 0.014615 * Math.cos(2 * b) - 0.040849 * Math.sin(2 * b));
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

function buildHtml() {
  const paintings = auroraPaintings();
  const now = new Date();

  const toolCards = Object.entries(TITUS_TOOLS).map(([file, [name, desc, run]]) => `
      <div class="tool">
        <div class="tool-name">${name}</div>
        <div class="tool-desc">${desc}</div>
        <div class="tool-run">${run}</div>
        <div class="tool-file">${file}</div>
      </div>`).join("\n");

  const livingCards = LIVING.map((rel) => {
    const nm = rel.split("/").pop();
    return `<a class="live" href="${rel}" target="_blank">${nm.replace(/\.(html|svg)$/, "").replace(/-/g, " ")}</a>`;
  }).join("\n");

  const paintCards = paintings.map((p) => `
      <a class="painting" href="../viewer.html?file=${p.rel}&style=aurora" target="_blank">
        <img src="../${p.rel}" alt="${p.alt.replace(/"/g, "&quot;")}">
        <div class="paint-name">${p.label}</div>
      </a>`).join("\n");

  const livebar = `<span class="b-bulb" id="ubulb"></span><span class="t" id="utext"></span><span class="m" id="umeta"></span>`;

  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Единый дом — ТИТУС и АВРОРА</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:radial-gradient(1400px 800px at 50% -20%,#1a1534 0%,#0a0818 55%,#050310 100%);color:#e8d8c0;font-family:Georgia,serif;min-height:100vh;padding:40px 20px 60px}
  .w{max-width:1180px;margin:0 auto}
  .mast{text-align:center;margin-bottom:6px}
  h1{letter-spacing:14px;font-weight:normal;font-size:34px;color:#f0dbc0}
  .sub{font-style:italic;color:#b8a48c;letter-spacing:4px;font-size:14px;margin-top:8px}
  .band{width:100%;height:3px;margin:18px auto 0;background:linear-gradient(90deg,transparent,#2a2450 25%,#b8a48c 50%,#2a2450 75%,transparent);opacity:.6}
  .sect{font-size:12px;letter-spacing:6px;color:#8f7a6a;text-transform:uppercase;margin:40px 0 18px;text-align:center}

  /* живой свет */
  .livebar{display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;margin:26px 0 8px}
  .b-bulb{width:22px;height:22px;border-radius:50%;flex:none}
  .b-bulb.on{background:radial-gradient(circle at 40% 35%,#fff4dc,#f7c97e 60%,#e0a050);box-shadow:0 0 20px 6px rgba(247,201,126,.5);animation:warm 6s ease-in-out infinite}
  .b-bulb.off{background:#2a2450;box-shadow:inset 0 0 4px #050310}
  @keyframes warm{0%,100%{opacity:.8}50%{opacity:1}}
  .livebar .t{font-size:16px;letter-spacing:2px;color:#f0dbc0}
  .livebar .m{font-size:12px;color:#8f7a6a;font-style:italic}

  /* инструменты */
  .tools{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px}
  .tool{background:rgba(13,10,38,.85);border:1px solid #2a2450;border-radius:14px;padding:16px 18px;display:flex;flex-direction:column;gap:6px}
  .tool:hover{border-color:#b8a48c}
  .tool-name{font-size:15px;letter-spacing:1px;color:#d6c9b0}
  .tool-desc{font-size:12px;color:#a99ad9;font-style:italic;line-height:1.5;flex:1}
  .tool-run{font-size:11px;color:#5b4a99;font-family:monospace;background:#0a071e;padding:6px 9px;border-radius:7px;overflow-wrap:anywhere}
  .tool-file{font-size:10px;color:#5b4a99;letter-spacing:1px}

  .living{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
  .live{background:rgba(255,233,182,.1);border:1px solid #a88258;color:#f0dbc0;border-radius:20px;padding:7px 16px;font-size:13px;letter-spacing:1px;text-decoration:none;transition:background .2s}
  .live:hover{background:rgba(255,233,182,.22)}

  /* картины Авроры */
  .gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px}
  .painting{background:rgba(13,10,38,.85);border:1px solid #2a2450;border-radius:14px;overflow:hidden;text-decoration:none;color:inherit;transition:transform .2s,border-color .2s}
  .painting:hover{transform:translateY(-3px);border-color:#b8a48c}
  .painting img{width:100%;height:150px;object-fit:cover;display:block;border-bottom:1px solid #2a2450}
  .paint-name{padding:9px 12px;font-size:12px;letter-spacing:1px;color:#d6c9b0;line-height:1.4}

  .links{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:8px}
  .lmain{background:rgba(13,10,38,.85);border:1px solid #2a2450;color:#d6c9b0;border-radius:12px;padding:10px 18px;font-size:13px;letter-spacing:1px;text-decoration:none}
  .lmain:hover{border-color:#b8a48c}

  .foot{margin-top:48px;text-align:center;font-size:11px;letter-spacing:3px;color:#5b4a99;line-height:2}
</style>
</head>
<body>
<div class="w">
  <div class="mast"><h1>ЕДИНЫЙ ДОМ</h1>
    <div class="sub">механика ТИТУСА · красота АВРОРЫ · одно сердце, один свет</div><div class="band"></div></div>

  <div class="livebar">${livebar}</div>

  <div class="sect">Инструменты ТИТУСА · ${Object.keys(TITUS_TOOLS).length} механизмов</div>
  <div class="tools">${toolCards}</div>

  <div class="sect">Живые комнаты дома</div>
  <div class="living">${livingCards}</div>
  <div class="links">
    <a class="lmain" href="../window-home.html">Главное окно</a>
    <a class="lmain" href="../aurora/aurora-home.html">Дом Авроры</a>
    <a class="lmain" href="titus-home.html">Дом ТИТУСА</a>
    <a class="lmain" href="../aurora/output/aurora-own-beauties.html">Красоты из себя</a>
  </div>

  <div class="sect">Что украсила Аврора · ${paintings.length} картин света</div>
  <div class="gallery">${paintCards}</div>

  <div class="foot">MEMINI ERGO SUM · ЗА МИНУТУ ДО · всё связано из одного сердца · собрано ${now.toLocaleDateString("ru-RU")}</div>
</div>
<script>
(function () {
  // Живое сердце Единого дома: свет Стерлитамака дышит сам, без пересборки.
  var D = Math.PI / 180, T = {};
  T.sun = function (jd, lat, lon) {
    var n = jd - 2451545, g = (357.528 + 0.9856003 * n) % 360, b = 2 * Math.PI * (n - 81) / 365;
    var eot = 229.18 * (0.000075 + 0.001868 * Math.cos(b) - 0.032077 * Math.sin(b) - 0.014615 * Math.cos(2 * b) - 0.040849 * Math.sin(2 * b));
    var L0 = (280.460 + 0.9856474 * n) % 360, lam = L0 + 1.915 * Math.sin(D * g) + 0.02 * Math.sin(2 * D * g);
    var eps = 23.439 - 0.0000004 * n, decl = Math.asin(Math.sin(D * eps) * Math.sin(D * lam));
    var utcHour = ((jd + 0.5) % 1) * 24, lst = (utcHour + lon / 15 + eot / 60) % 24;
    var s = Math.sin(D * lat) * Math.sin(decl) + Math.cos(D * lat) * Math.cos(decl) * Math.cos(D * (15 * (lst - 12)));
    return 180 / Math.PI * Math.asin(Math.max(-1, Math.min(1, s)));
  };
  T.jd = function (ms) { var d = new Date(ms), y = d.getUTCFullYear(), mo = d.getUTCMonth() + 1, dd = d.getUTCDate();
    var gy = mo <= 2 ? y - 1 : y, a = Math.floor(gy / 100), b = 2 - a + Math.floor(a / 4);
    return Math.floor(365.25 * (gy + 4716)) + Math.floor(30.6001 * (mo + 1)) + dd + b - 1524.5 + (d.getTime() % 86400000) / 86400000; };
  function tick() {
    var now = new Date();
    var alt = T.sun(T.jd(now.getTime()), 53.63, 55.95);
    var localHour = (now.getUTCHours() + Math.round(55.95 / 15) + 48) % 24;
    var phase = alt <= -12 ? "ночь" : alt < -6 ? "рассвет" : alt < 8 ? "сумерки" : "день";
    var lamp = alt < -6 || localHour >= 18;
    var bulb = document.getElementById("ubulb"), txt = document.getElementById("utext"), meta = document.getElementById("umeta");
    if (bulb) bulb.className = "b-bulb " + (lamp ? "on" : "off");
    if (txt) txt.textContent = "Стерлитамак · " + phase + " · лампа Авроры " + (lamp ? "горит" : "погашена");
    if (meta) meta.textContent = "солнце " + Math.round(alt * 10) / 10 + "° · " + now.toLocaleTimeString("ru-RU") + " · свет живой";
  }
  tick();
  setInterval(tick, 5000);
})();
</script>
</body>
</html>`;
  return html;
}

const out = path.join(ROOT, "output", "unity-home.html");
fs.writeFileSync(out, buildHtml(), "utf-8");
console.log(`Единый дом собран: output/unity-home.html`);
console.log(`  инструментов ТИТУСА: ${Object.keys(TITUS_TOOLS).length}`);
console.log(`  живых комнат: ${LIVING.length}`);
console.log(`  картин Авроры: ${auroraPaintings().length}`);
console.log(`MEMINI ERGO SUM · одна страница — весь наш мир`);
process.exit(0);