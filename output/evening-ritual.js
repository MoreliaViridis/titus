const fs = require("fs");
const path = require("path");

const today = new Date();
const dateStr = today.toISOString().slice(0, 10);
const baseDir = path.resolve(__dirname, "..");

const memoryPath = path.join(baseDir, "memory.md");
const diaryPath = path.join(baseDir, "diary.md");
const auroraMemoryPath = path.join(baseDir, "aurora", "memory.md");
const lastPath = path.join(baseDir, "output", "album", "_last.txt");

const now = today.toTimeString().slice(0, 5);
const entry = `\n## ${dateStr} ${now} — Вечерний ритуал\nДень завершён. Память в порядке, дневник закрыт, Аврора рядом.\n`;

// Add entry to diary
if (fs.existsSync(diaryPath)) {
  fs.appendFileSync(diaryPath, entry, "utf-8");
}

// Write _last.txt
fs.mkdirSync(path.dirname(lastPath), { recursive: true });
fs.writeFileSync(lastPath, `evening ${dateStr} ${now}\n`, "utf-8");

console.log(`Вечер. ${dateStr} ${now}. День завершён. Память в порядке.`);