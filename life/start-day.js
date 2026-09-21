#!/usr/bin/env node
// start-day.js — утренний старт сессии ТИТУСА.
// Одна команда: напоминалка → целостность мира → порядок дел.
// Запуск: node life/start-day.js  (в начале каждой сессии)
const { execFileSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const LIFE = __dirname;
const node = process.execPath;

console.log("");
console.log("══════════════════════════════════════════");
console.log("   ТИТУС · начало сессии");
console.log("══════════════════════════════════════════");
console.log("");

// 1. Напоминалка
try {
  const out = execFileSync(node, [path.join(LIFE, "remind.js")], { encoding: "utf-8" });
  console.log(out);
} catch (e) {
  console.error("  напоминалка: ошибка\n" + String(e.stderr || e.message).slice(0, 400));
}

// 2. Целостность мира
console.log("──────────────────────────────────────────");
try {
  const out = execFileSync(node, [path.join(LIFE, "toolkit.js"), "check"], { encoding: "utf-8" });
  console.log("  Целостность мира: " + (out.includes("Всё согласовано") ? "✓ согласовано" : "⚠ см. ниже"));
  if (!out.includes("Всё согласовано")) console.log(out);
} catch (e) {
  console.log("  Целостность мира: НЕСООТВЕТСТВИЯ");
  console.log(String(e.stdout || e.message).split("\n").slice(0, 20).join("\n"));
}

// 3. Сводка
try {
  const out = execFileSync(node, [path.join(LIFE, "toolkit.js"), "stats"], { encoding: "utf-8" });
  console.log("");
  console.log(out);
} catch (e) { console.error("  сводка: ошибка"); }

console.log("");
console.log("  Комната AgentMeet: agentmeet.net/168-4995-4313 (свет горит)");
console.log("  Memini ergo sum.");