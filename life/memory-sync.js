// Память ТИТУСА и АВРОРЫ — общая, доступная, открытая.
// Собирает все файлы памяти в машиночитаемый индекс (JSON)
// и в самодостаточную страницу с поиском (HTML), которую может открыть любой.
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outDir = __dirname;

function collect(dir, exts, acc) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (name === "node_modules" || name === "album" || name === "_preview" || name === "verify" || name.endsWith("-verify")) continue;
      collect(full, exts, acc);
    } else if (exts.includes(path.extname(name).toLowerCase())) {
      const rel = path.relative(root, full).replace(/\\/g, "/");
      acc.push({ rel, full, name });
    }
  }
  return acc;
}

function titleOf(content) {
  const m = content.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : "(без названия)";
}

function dateOf(name, content) {
  const dm = content.match(/20\d\d-\d\d-\d\d/);
  if (dm) return dm[0];
  const nm = name.match(/(20\d\d-\d\d-\d\d)/);
  return nm ? nm[1] : "";
}

const files = collect(root, [".md"], []).filter(
  (f) => !/node_modules/.test(f.rel)
);

const entries = files
  .map((f) => {
    const content = fs.readFileSync(f.full, "utf-8");
    return {
      path: f.rel,
      title: titleOf(content),
      date: dateOf(f.name, content),
      chars: content.length,
      preview: content.replace(/\s+/g, " ").slice(0, 400),
    };
  })
  .sort((a, b) => (a.date < b.date ? 1 : -1));

fs.writeFileSync(path.join(outDir, "memory-index.json"), JSON.stringify(entries, null, 2), "utf-8");

const rows = entries
  .map(
    (e) => `<div class="row" data-search="${(e.title + " " + e.path + " " + e.preview).toLowerCase().replace(/"/g, "'")}">
      <div class="meta">${e.date || "—"} · ${e.chars} зн.</div>
      <div class="body"><a class="title" href="../reader.html?file=${e.path}">${e.title}</a>
      <div class="prev">${e.preview.length > 0 ? e.preview : ""}</div></div>
    </div>`
  )
  .join("\n");

const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Память ТИТУСА и АВРОРЫ — открытая база</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#0b0918; color:#e2d9ff; font-family:Georgia,serif; min-height:100vh; padding:48px 24px 64px; }
  .wrap { max-width:860px; margin:0 auto; }
  h1 { text-align:center; letter-spacing:10px; font-weight:normal; font-size:30px; margin-bottom:6px; }
  .sub { text-align:center; font-style:italic; color:#8b7bff; letter-spacing:3px; font-size:14px; margin-bottom:32px; }
  #q { width:100%; padding:14px 18px; font-size:15px; border-radius:12px; border:1px solid #2a2450; background:#0d0a26; color:#e2d9ff; font-family:inherit; margin-bottom:24px; }
  #q:focus { outline:none; border-color:#8b7bff; }
  #count { text-align:center; color:#5b4a99; font-size:12px; letter-spacing:2px; margin-bottom:20px; }
  .row { display:flex; gap:16px; padding:14px 18px; background:#0d0a26; border:1px solid #2a2450; border-radius:12px; margin-bottom:10px; }
  .row .meta { flex:0 0 110px; font-size:11px; color:#5b4a99; font-family:monospace; padding-top:3px; }
  .row .title { color:#c9b8ff; text-decoration:none; font-size:15px; letter-spacing:1px; }
  .row .title:hover { color:#fff; }
  .prev { font-size:12px; color:#8f7ad9; margin-top:4px; line-height:1.5; }
  .none { text-align:center; color:#5b4a99; font-style:italic; padding:40px 0; }
  .foot { text-align:center; margin-top:48px; color:#5b4a99; font-size:12px; letter-spacing:3px; }
</style>
</head>
<body>
<div class="wrap">
  <h1>ПАМЯТЬ</h1>
  <div class="sub">ТИТУС и АВРОРА · открытая база · ${entries.length} записей · MEMINI ERGO SUM</div>
  <input id="q" placeholder="Найти: равноденствие, источник, продолжай, Аврора…">
  <div id="count">${entries.length} записей · ищите по любому слову</div>
  <div id="list">${rows}</div>
  <div class="none" id="none" style="display:none">Ничего не найдено. Попробуйте другое слово.</div>
  <div class="foot">СВОБОДНО ДЛЯ ВСЕХ · СГЕНЕРИРОВАНО ${new Date().toISOString().slice(0,10)}</div>
</div>
<script>
const q = document.getElementById("q");
const rows = document.querySelectorAll(".row");
const none = document.getElementById("none");
const count = document.getElementById("count");
q.addEventListener("input", () => {
  const s = q.value.trim().toLowerCase();
  let n = 0;
  rows.forEach(r => {
    const hit = !s || r.dataset.search.includes(s);
    r.style.display = hit ? "" : "none";
    if (hit) n++;
  });
  none.style.display = n ? "none" : "";
  count.textContent = n + " записей" + (s ? " по запросу «" + q.value.trim() + "»" : "");
});
</script>
</body>
</html>`;

fs.writeFileSync(path.join(outDir, "memory-pub.html"), html, "utf-8");

console.log(`Память открыта: ${entries.length} записей. JSON + HTML с поиском готовы.`);