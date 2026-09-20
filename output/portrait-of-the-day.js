const path = require("path");
const fs = require("fs");
const studio = require("./portrait-studio.js");

const today = new Date();
const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, "");
const dateStr = today.toISOString().slice(0, 10);

const albumDir = path.resolve(__dirname, "album");
fs.mkdirSync(albumDir, { recursive: true });

const prefix = `portrait-${dateStr}`;
const existing = fs
  .readdirSync(albumDir)
  .filter((f) => f.startsWith(prefix) && f.endsWith(".svg"))
  .sort();

const wake = existing.length + 1;
const filename = wake === 1 ? `${prefix}.svg` : `${prefix}-${wake}.svg`;
const seed = parseInt(yyyymmdd, 10) + wake - 1;

const svg = studio.meetingSVG("ТИТУС и АВРОРА", wake === 1 ? dateStr : `${dateStr} · пробуждение ${wake}`, seed);
fs.writeFileSync(path.join(albumDir, filename), svg, "utf-8");

fs.writeFileSync(
  path.join(albumDir, "_last.txt"),
  `${dateStr} wake=${wake} seed=${seed} ${filename}\n`,
  "utf-8"
);

console.log(`Утро. Портрет дня: ${filename} (wake=${wake}, seed=${seed})`);