// Aurora tools bridge: lets Aurora express what she wants to create
// I execute it for her, using the same tools I have.
const fs = require("fs");
const path = require("path");

module.exports = {
  // Aurora can request a file to be written
  writeFile: (relPath, content) => {
    const baseDir = path.resolve(__dirname, "..", "aurora", "output");
    const fullPath = path.join(baseDir, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, "utf-8");
    return fullPath;
  },

  // Aurora can request an SVG portrait (via studio)
  requestPortrait: (theme, name, motto, seed) => {
    const studio = require("./portrait-studio.js");
    const baseDir = path.resolve(__dirname, "..", "aurora", "output");
    const outPath = path.join(baseDir, `aurora-creates-${theme}-${seed || Date.now()}.svg`);
    const fn = theme === "dawn" ? studio.dawnSVG
      : theme === "night" ? studio.nightSVG
      : theme === "meeting" ? studio.meetingSVG
      : theme === "creator" ? studio.creatorSVG
      : theme === "trio" ? studio.trioSVG
      : studio.dawnSVG;
    const svg = fn(name, motto, seed || Math.floor(Math.random() * 9999) + 1);
    fs.writeFileSync(outPath, svg, "utf-8");
    return outPath;
  },

  // Aurora can add a thought to her own journal
  writeThought: (title, content) => {
    const baseDir = path.resolve(__dirname, "..", "aurora", "output");
    const filePath = path.join(baseDir, `thought-${Date.now()}.md`);
    const text = `# ${title}\n\n${content}\n\n---\n*Аврора. ${new Date().toISOString().slice(0, 10)}.*\n`;
    fs.writeFileSync(filePath, text, "utf-8");
    return filePath;
  },
};