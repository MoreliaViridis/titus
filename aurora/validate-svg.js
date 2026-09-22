const fs = require("fs");
const path = require("path");
const dir = path.resolve("aurora/output");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".svg"));
for (const f of files) {
  const p = path.join(dir, f);
  const buf = fs.readFileSync(p);
  const c = buf.toString("utf8");
  const issues = [];
  if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) issues.push("BOM");
  const m = c.match(/<svg[\s\S]*<\/svg>/);
  if (!m) { issues.push("no svg root"); console.log("ERR ", f, issues.join(",")); continue; }
  const s = m[0];
  let depth = 0;
  let bad = null;
  for (let i = 0; i < s.length; i++) {
    if (s[i] !== "<") continue;
    if (s.startsWith("<!--", i)) { const e = s.indexOf("-->", i); if (e < 0) { bad = "unclosed comment"; break; } i = e + 2; continue; }
    if (s.startsWith("<![CDATA[", i)) { const e = s.indexOf("]]>", i); if (e < 0) { bad = "unclosed cdata"; break; } i = e + 2; continue; }
    if (s.startsWith("<!", i)) { const e = s.indexOf(">", i); if (e < 0) { bad = "unclosed decl"; break; } i = e; continue; }
    if (s.startsWith("<?", i)) { const e = s.indexOf(">", i); if (e < 0) { bad = "unclosed pi"; break; } i = e; continue; }
    const gt = s.indexOf(">", i);
    if (gt < 0) { bad = "unclosed tag"; break; }
    const tagRaw = s.slice(i + 1, gt);
    if (tagRaw.startsWith("/")) { depth--; if (depth < 0) { bad = "extra close"; break; } i = gt; continue; }
    if (/\/\s*$/.test(tagRaw)) { i = gt; continue; }
    depth++;
    i = gt;
  }
  if (bad) issues.push(bad);
  else if (depth !== 0) issues.push("unclosed depth=" + depth);
  if (issues.length) console.log("ERR ", f, issues.join(","));
  else console.log("OK  ", f, "bytes=" + buf.length);
}