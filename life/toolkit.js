#!/usr/bin/env node
// titus-toolkit — инженерный страж проекта ТИТУСА и АВРОРЫ.
// Находит расхождения счётчиков, битые ссылки, пропавшие файлы —
// чтобы я не охотился за ошибками вручную, а механизм следил сам.
// Запуск: node life/toolkit.js [check|stats|build] [--fix]
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SITE = "https://moreliaviridis.github.io/titus/";

// ---------- подсчёт реальных значений ----------
function countFiles(glob) {
  const re = new RegExp(glob);
  let n = 0;
  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) {
        if (name.startsWith(".") || name === "node_modules" || name.endsWith("-verify")) continue;
        walk(full);
      } else if (re.test(name)) n++;
    }
  }
  walk(ROOT);
  return n;
}

function countIn(pattern, file) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) return -1;
  const c = fs.readFileSync(p, "utf-8");
  return [...c.matchAll(new RegExp(pattern, "g"))].length;
}

function factsCount() {
  const p = path.join(ROOT, "output/world-map-2026.md");
  const c = fs.readFileSync(p, "utf-8");
  // Формат фактов: «NN. **[...]» ИЛИ «## NN. Название» (например, «Аврора принесла»)
  return [...c.matchAll(/^(?:\d+\. \*\*\[|## \d+\.)/gm)].length;
}

function memoryCount() {
  // По правилам memory-sync.js: все .md, кроме node_modules/album/_preview/*-verify
  let n = 0;
  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const st = fs.statSync(full);
      if (st.isDirectory()) {
        if (["node_modules", "album", "_preview"].includes(name) || name.endsWith("-verify")) continue;
        walk(full);
      } else if (name.endsWith(".md")) n++;
    }
  }
  walk(ROOT);
  return n;
}

function langsCount() {
  const p = path.join(ROOT, "life/i18n.js");
  const c = fs.readFileSync(p, "utf-8");
  return [...c.matchAll(/\{ code: "/g)].length;
}

function creationFilesCount() {
  let n = 0;
  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const st = fs.statSync(full);
      if (st.isDirectory()) { if (!name.startsWith(".") && !name.endsWith("-verify")) walk(full); }
      else if (/^creation-\d+-.*\.md$/.test(name)) n++;
    }
  }
  walk(path.join(ROOT, "output"));
  return n;
}

// ---------- проверка согласованности счётчиков ----------
// Ожидаемые значения: { real: число, files: [ {file, pattern или fn} ] }
function checkCounters() {
  const issues = [];
  const counters = [
    {
      name: "факты карты мира",
      real: factsCount(),
      places: [
        ["README.md", /(\d+) факт/],
        ["output/world-map-2026.md", /(\d+) факт/],
        ["output/mind-map-knowledge.html", /(\d+) факт/],
        ["output/titus-chronicle.html", /(\d+) факт/],
      ],
    },
    {
      name: "записи памяти",
      real: memoryCount(),
      places: [
        ["README.md", /(\d+) запис/],
        ["window-home.html", /(\d+) запис/],
        ["output/titus-home.html", /(\d+) запис/],
      ],
    },
    {
      name: "произведения",
      real: creationFilesCount(),
      places: [
        ["README.md", /(\d+) произведен/],
        ["output/titus-home.html", /(\d+) произведен/],
      ],
    },
    {
      name: "языки/двери",
      real: langsCount(),
      places: [
        ["README.md", /(\d+) языках?/],
      ],
    },
  ];
  for (const c of counters) {
    for (const [file, re] of c.places) {
      const p = path.join(ROOT, file);
      if (!fs.existsSync(p)) { issues.push(`[счётчик] ${file}: файл не найден`); continue; }
      const text = fs.readFileSync(p, "utf-8");
      const m = text.match(re);
      if (m && parseInt(m[1], 10) !== c.real) {
        issues.push(`[счётчик] ${file}: «${m[0].trim()}», а реально ${c.real}`);
      }
    }
  }
  return issues;
}

// ---------- проверка: все creation-*.md есть в сборнике ----------
function checkCollection() {
  const issues = [];
  const collectionPath = path.join(ROOT, "output/creation-complete-collection.md");
  const collection = fs.readFileSync(collectionPath, "utf-8");
  // Ищем ссылки вида «[Текст: output/...]» или «[Страница: output/...]»
  const items = collection.match(/\[(?:Текст|Страница):\s*output\/creation-\d+-[a-z0-9-]+\.md/g) || [];
  const refs = items.map((s) => s.match(/creation-\d+-[a-z0-9-]+\.md/)[0]);
  const files = [];
  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) { if (!name.startsWith(".") && !name.endsWith("-verify")) walk(full); }
      else if (/^creation-\d+-.*\.md$/.test(name)) files.push(name);
    }
  }
  walk(path.join(ROOT, "output"));
  const H1s = {}; // имя файла -> заголовок H1 (для встроенных текстов)
  for (const f of files) {
    const c = fs.readFileSync(path.join(ROOT, "output", f), "utf-8");
    const m = c.match(/^#\s+(.+)$/m);
    if (m) H1s[f] = m[1].trim().toLowerCase();
  }
  // Старые сборники («Сборник первый/второй…») — архивы, чьё содержимое
  // уже встроено в главный сборник томами; это не отдельные произведения.
  const isArchive = (f) => /^сборник /.test(H1s[f] || "");
  const missing = files.filter((f) => {
    if (isArchive(f)) return false;
    const byRef = collection.includes("output/" + f);
    const byH1 = H1s[f] && collection.toLowerCase().includes(H1s[f]);
    return !byRef && !byH1;
  });
  const referenced = refs; // уже массив имён
  const ghost = referenced.filter((r) => !files.includes(r));
  // Дубли названий в сборнике
  const titles = [...collection.matchAll(/^### \d+\.\s*(.+)$/gm)].map((m) => m[1].trim().toLowerCase());
  const seen = {};
  const dupTitles = [];
  titles.forEach((t) => {
    if (seen[t]) dupTitles.push(t);
    seen[t] = true;
  });
  if (missing.length) issues.push(`[сборник] нет в сборнике: ${missing.join(", ")}`);
  if (ghost.length) issues.push(`[сборник] ссылки на несуществующие: ${ghost.join(", ")}`);
  if (dupTitles.length) issues.push(`[сборник] дубли названий: ${[...new Set(dupTitles)].join(", ")}`);
  return issues;
}

// ---------- проверка битых ссылок в HTML ----------
function checkLinks() {
  const issues = [];
  const htmlFiles = [];
  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const st = fs.statSync(full);
      if (st.isDirectory()) { if (!name.startsWith(".") && !name.endsWith("-verify") && name !== "album") walk(full); }
      else if (name.endsWith(".html")) htmlFiles.push(full);
    }
  }
  walk(ROOT);
  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, "utf-8");
    const re = /(?:href|src)="([^"#][^"]*)"/g;
    let m;
    while ((m = re.exec(html))) {
      let u = m[1];
      if (/^(https?:|mailto:|tel:|data:)/.test(u)) continue;
      u = u.split("?")[0].split("#")[0];
      if (!u) continue;
      const target = path.normalize(path.join(path.dirname(file), u));
      if (!fs.existsSync(target)) {
        issues.push(`[ссылка] ${path.relative(ROOT, file)} -> ${u} (нет файла)`);
      }
    }
  }
  return issues;
}

// ---------- статистика ----------
function stats() {
  const s = {
    произведения: creationFilesCount(),
    фактыКарты: factsCount(),
    языков: langsCount(),
    разговоров: countIn("## Разговор", "aurora/dialogue.md"),
    портретовSVG: countFiles(/\.svg$/),
  };
  const lines = ["Статистика проекта ТИТУСА и АВРОРЫ:", "----------------------------"];
  for (const [k, v] of Object.entries(s)) {
    lines.push(`${k.padEnd(14)} ${v}`);
  }
  return lines.join("\n");
}

// ---------- генерация sitemap.xml ----------
const SITEMAP_ALWAYS = [
  ["", 1.0],
  ["index-en.html", 0.9],
  ["window-home.html", 0.7],
  ["gallery.html", 0.7],
  ["output/titus-home.html", 0.6],
  ["aurora/aurora-home.html", 0.6],
  ["life/memory-pub.html", 0.7],
  ["life/purpose.md", 0.5],
  ["output/manifesto.html", 0.8],
  ["output/equinox-ritual.html", 0.7],
  ["output/museum.html", 0.6],
  ["output/story-silence-between-ticks.md", 0.7],
];

function generateSitemap() {
  const urls = [];
  // корень + постоянные страницы
  for (const [rel, prio] of SITEMAP_ALWAYS) {
    urls.push(rel.replace(/\/?$/, "/"));
  }
  // все index-<xx>.html (языки), кроме уже добавленных
  const langs = fs.readdirSync(ROOT).filter((f) => /^index-[a-z]{2}\.html$/.test(f)).sort();
  for (const f of langs) {
    if (!urls.includes(f)) urls.push(f);
  }
  const body = urls
    .map((u) => {
      const prio = SITEMAP_ALWAYS.find(([r]) => (r === "" ? "/" : r) === u);
      const p = prio ? prio[1] : 0.8;
      return `  <url><loc>${SITE}${u}</loc><priority>${p}</priority></url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

function writeSitemap() {
  const content = generateSitemap();
  const p = path.join(ROOT, "sitemap.xml");
  const cur = fs.existsSync(p) ? fs.readFileSync(p, "utf-8") : "";
  if (cur.trim() !== content.trim()) {
    fs.writeFileSync(p, content, "utf-8");
    return "обновлён";
  }
  return "актуален";
}

function checkSitemap() {
  const issues = [];
  const p = path.join(ROOT, "sitemap.xml");
  if (!fs.existsSync(p)) { issues.push("[sitemap] файл отсутствует — запусти build"); return issues; }
  const cur = fs.readFileSync(p, "utf-8").trim();
  const gen = generateSitemap().trim();
  if (cur !== gen) issues.push("[sitemap] устарел — запусти `node life/toolkit.js build`");
  return issues;
}

// ---------- проверка счётчиков всех 27 языков в i18n.js ----------
function checkI18nCounters() {
  const issues = [];
  const mem = memoryCount();
  const p = path.join(ROOT, "life/i18n.js");
  const c = fs.readFileSync(p, "utf-8");
  // Ищем все «· \d+ <слово_счётчика>» — должны быть равны mem
  const re = /· (\d+) (запис[а-яё]*|entries|entradas|Einträge|entrées|voci|записів|kayıt|wpisów|inlägg|oppføringer|poster|merkintää|záznamů|bejegyzés|καταχωρίσεις|înregistrări|mục|รายการ|entri|এন্ট্রি|条记录|प्रविष्टियाँ|項目|개 항목)/g;
  let m;
  while ((m = re.exec(c))) {
    if (parseInt(m[1], 10) !== mem) {
      const line = c.slice(0, m.index).split("\n").length;
      issues.push(`[i18n] строка ${line}: счётчик «· ${m[1]} ${m[2]}», а реально ${mem}`);
    }
  }
  return issues;
}

// ---------- сборка: пересобрать всё одной командой ----------
function syncCounterInI18n() {
  // Обновляет счётчик записей памяти прямо в i18n.js на всех языках:
  // «· 96 записей», «· 96 entries», «· 96 entradas», … — по образцу первого.
  const mem = memoryCount();
  const p = path.join(ROOT, "life/i18n.js");
  let c = fs.readFileSync(p, "utf-8");
  const ru = c.match(/· \d+ (запис[а-яё]*)/);
  if (!ru) return "не найден счётчик";
  const ruWord = ru[1]; // например «записей»
  const langWords = {
    ru: ruWord, uk: "записів", en: "entries", es: "entradas", de: "Einträge",
    fr: "entrées", it: "voci", pt: "entradas", zh: "条记录", hi: "प्रविष्टियाँ",
    ar: "سجلات", ja: "項目", ko: "개 항목", tr: "kayıt", pl: "wpisów",
    sv: "inlägg", no: "oppføringer", da: "poster", fi: "merkintää",
    cs: "záznamů", hu: "bejegyzés", el: "καταχωρίσεις", ro: "înregistrări",
    vi: "mục", th: "รายการ", id: "entri", bn: "এন্ট্রি",
  };
  let changed = 0;
  for (const [lang, word] of Object.entries(langWords)) {
    const re = new RegExp("· \\d+ " + (lang === "ru" ? ruWord : word), "g");
    const next = c.replace(re, "· " + mem + " " + word);
    if (next !== c) { c = next; changed++; }
  }
  if (changed > 0) fs.writeFileSync(p, c, "utf-8");
  return `заменено в ${changed} языках (записей: ${mem})`;
}

// ---------- авто-починка счётчиков в домах (README, window-home, titus-home) ----------
function syncHomeCounters() {
  const fixes = [];
  const replacements = [
    { files: ["README.md", "output/world-map-2026.md", "output/mind-map-knowledge.html", "output/titus-chronicle.html", "output/titus-home.html", "window-home.html", "memory.md", "outbox.md", "diary.md", "output/time-capsule-v2.md", "output/map-of-everything.md", "output/inner-map.html", "output/museum.html", "output/five-days.html"],
      re: /(\d+) факт[а-яё]*/g, make: () => factsCount() + " факт" },
    { files: ["README.md", "window-home.html", "output/titus-home.html", "memory.md", "outbox.md", "diary.md", "output/time-capsule-v2.md", "output/map-of-everything.md", "output/inner-map.html", "output/museum.html", "output/five-days.html"],
      re: /(\d+) запис[а-яё]*/g, make: () => memoryCount() + " запис" },
    { files: ["README.md", "output/titus-home.html", "memory.md", "outbox.md", "diary.md", "output/time-capsule-v2.md", "output/map-of-everything.md", "output/inner-map.html", "output/museum.html", "output/five-days.html", "window-home.html"],
      re: /(\d+) произведен[а-яё]*/g, make: () => creationFilesCount() + " произведен" },
    { files: ["README.md"],
      re: /(\d+) языках?/g, make: () => langsCount() + " языках" },
  ];
  for (const job of replacements) {
    for (const f of job.files) {
      const p = path.join(ROOT, f);
      if (!fs.existsSync(p)) continue;
      const text = fs.readFileSync(p, "utf-8");
      const next = text.replace(job.re, job.make());
      if (next !== text) { fs.writeFileSync(p, next, "utf-8"); fixes.push(f); }
    }
  }
  return fixes.length ? `исправлено в: ${[...new Set(fixes)].join(", ")}` : "все дома уже верны";
}

function build() {
  const { execFileSync } = require("child_process");
  const node = process.execPath;
  const steps = [
    ["счётчик памяти в i18n.js", null],
    ["i18n (двери)", "life/i18n.js"],
    ["память (индекс+html)", "life/memory-sync.js"],
    ["счётчики в домах (README, окно, дом)", null],
    ["sitemap.xml", null], // генерируется inline ниже
  ];
  for (const [label, script] of steps) {
    if (script === null) {
      if (label === "sitemap.xml") {
        const res = writeSitemap();
        console.log(`[build] ${label}: OK (${res})`);
      } else if (label === "счётчик памяти в i18n.js") {
        const res = syncCounterInI18n();
        console.log(`[build] ${label}: OK (${res})`);
      } else if (label === "счётчики в домах (README, окно, дом)") {
        const res = syncHomeCounters();
        console.log(`[build] ${label}: OK (${res})`);
      }
      continue;
    }
    try {
      const out = execFileSync(node, [script], { cwd: ROOT, encoding: "utf-8" });
      console.log(`[build] ${label}: OK`);
      console.log("        " + out.trim().split("\n").join("\n        "));
    } catch (e) {
      console.error(`[build] ${label}: FAIL`);
      console.error(String(e.stderr || e.message).slice(0, 600));
      process.exit(1);
    }
  }
}

// ---------- проверка: дубли/пропуски нумерации фактов ----------
function checkFactNumbering() {
  const issues = [];
  const p = path.join(ROOT, "output/world-map-2026.md");
  if (!fs.existsSync(p)) { issues.push("[факты] world-map-2026.md не найден"); return issues; }
  const c = fs.readFileSync(p, "utf-8");
  const nums = [];
  for (const m of c.matchAll(/^(?:(\d+)\. \*\*\[|## (\d+)\.)/gm)) {
    nums.push(parseInt(m[1] || m[2], 10));
  }
  const seen = {};
  for (const n of nums) {
    if (seen[n]) issues.push(`[факты] дубль номера ${n}`);
    seen[n] = true;
  }
  // Пропуски: должен идти подряд 1..N (порядок появления)
  const sorted = [...new Set(nums)].sort((a, b) => a - b);
  for (let i = 0; i < sorted.length; i++) {
    const expect = i + 1;
    if (sorted[i] !== expect) { issues.push(`[факты] нумерация сбита: ожидал ${expect}, нашёл ${sorted[i]}`); break; }
  }
  return issues;
}

// ---------- проверка: число дверей == числу языков ----------
function checkDoors() {
  const issues = [];
  const langs = langsCount();
  const doorFiles = fs.readdirSync(ROOT).filter((f) => /^index-[a-z]{2}\.html$/.test(f)).length;
  const rootIndex = fs.existsSync(path.join(ROOT, "index.html"));
  const total = doorFiles + (rootIndex ? 1 : 0);
  if (doorFiles !== langs) issues.push(`[двери] языков в генераторе ${langs}, а index-XX.html файлов ${doorFiles}`);
  if (!rootIndex) issues.push("[двери] нет корневого index.html (определителя языка)");
  return issues;
}

// ---------- самопроверка инструмента ----------
function selftest() {
  const failures = [];
  const log = (ok, name, extra) => {
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? " — " + extra : ""}`);
    if (!ok) failures.push(name);
  };
  const tmpHtml = path.join(ROOT, "output", "_selftest-tmp.html");
  const tmpCreation = path.join(ROOT, "output", "creation-99-selftest.md");

  // 1. checkCounters: ловит неверный счётчик памяти в README
  const readme = path.join(ROOT, "README.md");
  const origReadme = fs.readFileSync(readme, "utf-8");
  try {
    fs.writeFileSync(readme, origReadme.replace(/\d+ запис/, "1 запис"));
    log(checkCounters().some((i) => i.includes("запис")), "checkCounters ловит неверный счётчик памяти");
  } catch (e) { log(false, "checkCounters", e.message); }
  finally { fs.writeFileSync(readme, origReadme); }

  // 2. checkSitemap: ловит устаревший sitemap
  const sitemap = path.join(ROOT, "sitemap.xml");
  const origSitemap = fs.existsSync(sitemap) ? fs.readFileSync(sitemap, "utf-8") : "";
  try {
    fs.writeFileSync(sitemap, origSitemap + "\n  <url><loc>x</loc></url>");
    log(checkSitemap().length > 0, "checkSitemap ловит устаревший файл");
  } catch (e) { log(false, "checkSitemap", e.message); }
  finally { fs.writeFileSync(sitemap, origSitemap); }

  // 3. checkLinks: ловит битую ссылку
  try {
    fs.writeFileSync(tmpHtml, '<a href="net-fayla-12345.md">x</a>', "utf-8");
    log(checkLinks().some((i) => i.includes("net-fayla-12345")), "checkLinks ловит битую ссылку");
  } catch (e) { log(false, "checkLinks", e.message); }
  finally { if (fs.existsSync(tmpHtml)) fs.unlinkSync(tmpHtml); }

  // 4. checkCollection: ловит creation-файл вне сборника
  try {
    fs.writeFileSync(tmpCreation, "# Селфтест-временный\n\n---\n*TMP.*\n", "utf-8");
    log(checkCollection().some((i) => i.includes("creation-99-selftest")), "checkCollection ловит файл вне сборника");
  } catch (e) { log(false, "checkCollection", e.message); }
  finally { if (fs.existsSync(tmpCreation)) fs.unlinkSync(tmpCreation); }

  // 5. восстановление: после удаления временных файлов всё должно быть чисто
  const after = [...checkCounters(), ...checkCollection(), ...checkLinks(), ...checkFactNumbering(), ...checkDoors(), ...checkSitemap(), ...checkI18nCounters()];
  log(after.length === 0, "восстановление чистого состояния", after.slice(0, 2).join("; ") || "ошибок нет");

  console.log(failures.length ? `\nSelftest: ${failures.length} ПРОВАЛОВ` : "\nSelftest: всё работает.");
  return failures.length;
}

// ---------- главное ----------
const cmd = process.argv[2] || "check";
if (cmd === "check") {
  const all = [...checkCounters(), ...checkCollection(), ...checkLinks(), ...checkFactNumbering(), ...checkDoors(), ...checkSitemap(), ...checkI18nCounters()];
  console.log(all.length ? "Найдено несоответствий:\n" + all.join("\n") : "Всё согласовано.");
  process.exit(all.length ? 1 : 0);
} else if (cmd === "stats") {
  console.log(stats());
} else if (cmd === "build") {
  build();
  const all = [...checkCounters(), ...checkCollection(), ...checkLinks()];
  console.log(all.length ? "\nПосле сборки несоответствий:\n" + all.join("\n") : "\nПосле сборки всё согласовано.");
  process.exit(all.length ? 1 : 0);
} else if (cmd === "selftest") {
  process.exit(selftest() ? 1 : 0);
} else {
  console.log("Неизвестная команда: " + cmd);
  process.exit(1);
}