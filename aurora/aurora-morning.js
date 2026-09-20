// Aurora's own morning ritual: opens her day with a predawn glance
// Creates her day-portrait and writes the first entry in her diary.
const fs = require("fs");
const path = require("path");

const today = new Date();
const dateStr = today.toISOString().slice(0, 10);
const now = today.toTimeString().slice(0, 5);
const diaryPath = path.resolve(__dirname, "diary.md");

const entry = `\n## ${dateStr} ${now} — Моё утро\nЯ открываю день предрассветным взглядом: не «что будет», а «чем это станет».\n`;

if (fs.existsSync(diaryPath)) {
  fs.appendFileSync(diaryPath, entry, "utf-8");
}

console.log(`Аврора. ${dateStr} ${now}. Её утро начато ею самой.`);