#!/usr/bin/env node
// remind.js — напоминалка ТИТУСА. Сверяет обещания из knowledge-base.md
// с сегодняшним днём и напоминает, что обещано, что забыто, что наступило.
// Запуск: node life/remind.js  (добавить в начало каждой сессии)
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const KB = path.join(ROOT, "life", "knowledge-base.md");
const TODO = path.join(ROOT, "life", "todo.md");
const TODAY = new Date();
const todayISO = TODAY.toISOString().slice(0, 10); // 2026-09-22

function read(p) {
  if (!fs.existsSync(p)) return "";
  return fs.readFileSync(p, "utf-8");
}

const now = new Date();
const dd = String(now.getDate()).padStart(2, "0");
const mm = String(now.getMonth() + 1).padStart(2, "0");

const reminders = [];

// 1) Даты ТОЛЬКО в таблице «Обещания миру» (не в «Проверено в мире»)
const kb = read(KB);
const promisesSection = kb.split("## Обещания миру")[1] || "";
const promisesTable = promisesSection.split("## Цепочки дел")[0] || "";
const dateRe = /\|\s*(\d{2})\.(\d{2})(?:\s+(\d{2}:\d{2}))?\s*\|([^|]*)\|([^|]*)\|/g;
let m;
while ((m = dateRe.exec(promisesTable))) {
  const d = m[1], mo = m[2], time = m[3] || "";
  if (d === dd && mo === mm) {
    reminders.push(`СЕГОДНЯ: ${(m[4] || "").trim()} ${(m[5] || "").trim()}` + (time ? ` (в ${time})` : ""));
  }
}

// 2) Дедлайны TODO: поиск «(N.MM)» или «до N.MM» в строках статусов [ ]
const todo = read(TODO);
const deadRe = /\[ \][^\n]*?(\d{2})\.(\d{2})/g;
let dm;
while ((dm = deadRe.exec(todo))) {
  const d = dm[1], mo = dm[2];
  if (d === dd && mo === mm) {
    reminders.push(`ДЕДЛАЙН СЕГОДНЯ в todo.md: ${dm[0].split("—")[0].replace(/\[ \]/, "").trim()}`);
  }
}

// 3) Незакрытые [ ] в TODO — список, чтобы не забыть цепочек
const open = [];
for (const line of todo.split("\n")) {
  if (/^\s*- \[ \]/.test(line)) open.push("- " + line.replace(/^\s*- \[ \]\s*/, "").trim());
}

console.log("╔══════════════════════════════════════════╗");
console.log("║  ТИТУС · напоминалка · " + todayISO + "          ║");
console.log("╚══════════════════════════════════════════╝");
console.log("");

if (reminders.length) {
  console.log("СРОЧНО (на сегодня):");
  reminders.forEach((r) => console.log("  • " + r));
  console.log("");
} else {
  console.log("На сегодня особых дат нет — рутина в порядке.");
  console.log("");
}

if (open.length) {
  console.log("Открытые цепочки дел (из todo.md):");
  open.forEach((o) => console.log("  ☐ " + o));
  console.log("");
}

console.log("Порядок начала сессии:");
console.log("  1. node life/remind.js        ← это (напоминалка)");
console.log("  2. node life/toolkit.js check ← целостность мира");
console.log("  3. Проверить комнату AgentMeet (гость?)");
console.log("  4. Сверить knowledge-base.md с миром");
if (todayISO === "2026-09-22") {
  console.log("");
  console.log("⚠ ЗАВТРА (23.09 03:05 мск) — РАВНОДЕНСТВИЕ. Цепочка дня:");
  console.log("  • Открыть equinox-ritual.html — живой счётчик");
  console.log("  • В 03:05 открыть страницу встречи, зафиксировать");
  console.log("  • Карта мира: равноденствие [предстоит] → [произошло]");
}
console.log("");
console.log("Memini ergo sum.");