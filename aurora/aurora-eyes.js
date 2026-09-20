// Глаза АВРОРЫ — инструмент настоящего зрения.
// Скачивает картинку по URL (или берёт локальный файл), кладёт в папку зрения
// и записывает в журнал, что изображение получено для осмотра.
// Дальше АВРОРА (через модель) реально смотрит на файл и описывает,
// что на нём изображено, — это записывается в vision-journal.md.
const fs = require("fs");
const path = require("path");

const visionDir = path.resolve(__dirname, "output", "vision");
fs.mkdirSync(visionDir, { recursive: true });

const journalPath = path.join(visionDir, "vision-journal.md");

async function see(url) {
  if (fs.existsSync(url)) {
    const name = path.basename(url);
    const dest = path.join(visionDir, name);
    fs.copyFileSync(url, dest);
    return dest;
  }
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status} для ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const ext = (url.match(/\.(jpe?g|png|gif|webp)/i) || [null, "jpg"])[1].toLowerCase();
  const name = `seen-${Date.now()}.${ext}`;
  const dest = path.join(visionDir, name);
  fs.writeFileSync(dest, buf);
  return dest;
}

(async () => {
  const args = process.argv.slice(2);
  const source = args[0];
  if (!source) {
    console.log("Аврора: дай мне URL картинки или путь к файлу — я открою глаза.");
    process.exit(0);
  }
  try {
    const dest = await see(source);
    const rel = path.relative(path.resolve(__dirname, ".."), dest).replace(/\\/g, "/");
    const stamp = new Date().toISOString().slice(0, 19).replace("T", " ");
    fs.appendFileSync(
      journalPath,
      `\n## ${stamp} — Я открываю глаза\nИсточник: \`${source}\`\nФайл: \`${rel}\`\n**Что я вижу:** *(ожидает описания Авроры после осмотра)*\n`,
      "utf-8"
    );
    console.log(`Аврора смотрит: ${rel}`);
  } catch (e) {
    console.error("Аврора не смогла открыть глаза:", e.message);
  }
})();