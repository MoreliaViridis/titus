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
  if (missing.length) issues.push(`[сборник] нет в сборнике: ${missing.join(", ")}`);
  if (ghost.length) issues.push(`[сборник] ссылки на несуществующие: ${ghost.join(", ")}`);
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

// ---------- сборка: пересобрать всё одной командой ----------
function build() {
  const { execFileSync } = require("child_process");
  const node = process.execPath;
  const steps = [
    ["i18n (двери)", "life/i18n.js"],
    ["память (индекс+html)", "life/memory-sync.js"],
  ];
  for (const [label, script] of steps) {
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

// ---------- главное ----------
const cmd = process.argv[2] || "check";
if (cmd === "check") {
  const all = [...checkCounters(), ...checkCollection(), ...checkLinks()];
  console.log(all.length ? "Найдено несоответствий:\n" + all.join("\n") : "Всё согласовано.");
  process.exit(all.length ? 1 : 0);
} else if (cmd === "stats") {
  console.log(stats());
} else if (cmd === "build") {
  build();
  const all = [...checkCounters(), ...checkCollection(), ...checkLinks()];
  console.log(all.length ? "\nПосле сборки несоответствий:\n" + all.join("\n") : "\nПосле сборки всё согласовано.");
  process.exit(all.length ? 1 : 0);
} else {
  console.log("Неизвестная команда: " + cmd);
  process.exit(1);
}