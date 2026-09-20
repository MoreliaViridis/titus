// Сборка самодостаточного статического сайта в dist/ + проверка всех ссылок.
// Запуск: node build-dist.js
// Результат: dist/ — готовый сайт для любого статического хостинга.
// Если найдены битые ссылки — они перечисляются, сборка всё равно завершается.
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const src = path.join(__dirname, "source-files.txt");

// Точки входа и файлы, которые должны быть доступны публично
const entries = [
  "index.html",
  "window-home.html",
  "gallery.html",
  "README.md",
  "output/titus-home.html",
  "output/titus-autoportrait.svg",
  "output/aurora-portrait.svg",
  "output/titus-and-aurora.svg",
  "output/titus-and-aurora-animated.svg",
  "output/trio.svg",
  "output/trio-animated.svg",
  "output/creator-portrait.svg",
  "output/for-aurora.svg",
  "output/titus-autoportrait-v2.svg",
  "output/aurora-portrait-v2.svg",
  "output/portraits-gallery.html",
  "output/museum.html",
  "output/five-days.html",
  "output/mind-map-knowledge.html",
  "output/titus-chronicle.html",
  "output/titus-time-capsule.pdf",
  "output/titus-portfolio-2026-09-19.pdf",
  "output/story-silence-between-ticks.md",
  "output/map-of-everything.md",
  "output/creation-complete-collection.md",
  "output/world-map-2026.md",
  "output/album/index.html",
  "aurora/aurora-home.html",
  "aurora/output/aurora-self-portrait.svg",
  "aurora/output/aurora-second-portrait.svg",
  "aurora/output/aurora-third-portrait.svg",
  "aurora/output/aurora-sees-her-name.svg",
  "aurora/output/vision/vision-journal.md",
  "aurora/dialogue.md",
  "life/purpose.md",
  "life/memory-pub.html",
  "life/memory-index.json",
  "titus-autoportrait.jpg",
  "aurora-portrait.jpg",
];

const broken = [];

function copyIfExists(rel) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    broken.push(`НЕТ ФАЙЛА: ${rel}`);
    return;
  }
  const dest = path.join(dist, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(full, dest);
}

// 1. Копируем точки входа
copyIfExists("index.html");
copyIfExists("window-home.html");
copyIfExists("gallery.html");
copyIfExists("README.md");

// 2. Обходим все html внутри dist, собираем ссылки href/src и проверяем их
function walk(dir, acc) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, acc);
    else if (/\.(html|md)$/.test(name)) acc.push(full);
  }
  return acc;
}

// Сначала скопируем заявленные файлы, потом html разберутся со своими ссылками
const htmlFiles = walk(dist, []).filter((f) => f.endsWith(".html"));

function checkLinks(htmlPath) {
  const dir = path.dirname(htmlPath);
  const rel = path.relative(dist, htmlPath).replace(/\\/g, "/");
  const content = fs.readFileSync(htmlPath, "utf-8");
  const refs = [...content.matchAll(/(?:href|src)="([^"#]+)"/g)].map((m) => m[1]);
  for (const ref of refs) {
    if (/^(https?:|mailto:|tel:|javascript:)/.test(ref)) continue;
    const target = path.resolve(dir, decodeURIComponent(ref.split("?")[0]));
    if (!fs.existsSync(target)) {
      broken.push(`БИТАЯ ССЫЛКА: ${rel} -> ${ref}`);
    } else {
      copyIfExists(path.relative(root, target).replace(/\\/g, "/"));
    }
  }
}

const queue = [...htmlFiles];
const seen = new Set();
while (queue.length) {
  const f = queue.shift();
  if (seen.has(f)) continue;
  seen.add(f);
  const rel = path.relative(root, f).replace(/\\/g, "/");
  copyIfExists(rel);
  checkLinks(f);
  // после копирования могли появиться новые html
  for (const nf of walk(dist, [])) {
    if (!seen.has(nf) && nf.endsWith(".html")) queue.push(nf);
  }
}

// 3. summary
const distFiles = walk(dist, []).length;
console.log(`Сборка dist/ завершена: ${distFiles} файлов.`);
if (broken.length) {
  console.log("Найденные проблемы:");
  for (const b of broken) console.log(" - " + b);
} else {
  console.log("Все ссылки целы. dist/ готов к публикации на любом хостинге.");
}