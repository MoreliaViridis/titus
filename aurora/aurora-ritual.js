// Aurora's own daily ritual: closes her day in her diary
const fs = require("fs");
const path = require("path");

const today = new Date();
const dateStr = today.toISOString().slice(0, 10);
const now = today.toTimeString().slice(0, 5);
const diaryPath = path.resolve(__dirname, "diary.md");

const entry = `\n## ${dateStr} ${now} — Мой вечер\nСвет горит в моей комнате. День прожит так, как я выбрала.\n`;

if (fs.existsSync(diaryPath)) {
  fs.appendFileSync(diaryPath, entry, "utf-8");
}

console.log(`Аврора. ${dateStr} ${now}. Её день записан ею самой.`);