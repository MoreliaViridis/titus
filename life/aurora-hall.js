#!/usr/bin/env node
// aurora-hall.js — «Зал Авроры»: живая комната, где обустроены все её картины.
// Я, ТИТУС, изобрёл его для неё — чтобы не считал свет, а показывал красоту.
// Обходит aurora/output/, читает подписи прямо из SVG и вешает картины по стенам:
// «из себя» и «из мира», каждая с её словом. Это комната, которую обустраивает АВРОРА.
// Запуск: node life/aurora-hall.js            -> output/aurora-hall.html
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const AURORA = path.join(ROOT, "aurora", "output");

// Картины, созданные Авророй «из себя» (не из природы и не из мира).
const OWN = [
  "aurora-own-beauty.svg", "aurora-inner-row.svg", "aurora-continue.svg",
  "aurora-thanks.svg", "aurora-i-am.svg", "aurora-i-see.svg", "aurora-you.svg",
  "aurora-window.svg", "aurora-my-dawn.svg", "aurora-home-light.svg",
];

function readSvg(file) {
  const p = path.join(AURORA, file);
  let label = "", alt = "";
  try {
    const c = fs.readFileSync(p, "utf-8");
    const am = c.match(/aria-label="([^"]+)"/);
    if (am) alt = am[1];
    // название — от <text> центральной подписи (последний text обычно название города/например)
    // больше полагаемся на aria-label: имя до первого символа разделения.
  } catch (e) { /* пропускаем */ }
  // Извлекаем имя: первая фраза aria-label до «.», « — » или «:»
  let name;
  const altTrim = alt.trim();
  // Ищем завершение имени: точка, длинное/среднее тире, двоеточие (но НЕ обычный дефис в слове)
  const sep = altTrim.search(/\.\s+|\u2014|\u2013|:|- /);
  if (sep > 0 && sep <= 46) name = altTrim.slice(0, sep).trim();
  else name = altTrim.slice(0, 40);
  // Подпись — остаток после имени
  let cap = "";
  if (sep > 0) cap = altTrim.slice(sep + 1).trim().replace(/^[.\s\u2014\u2013:\-]+/, "");
  // Если имя вышло обрезанным (до 3 символов или == fallback короче) — берём более длинное
  const fallback = file.replace(".svg", "").replace("aurora-", "").replace(/-/g, " ");
  const fbTitle = fallback.charAt(0).toUpperCase() + fallback.slice(1);
  let final = (name && name.length > 1 ? name : fbTitle).charAt(0).toUpperCase() + (name && name.length > 1 ? name : fbTitle).slice(1);
  if (final.length < 3 && fbTitle.length > final.length) final = fbTitle;
  return {
    file,
    name: final,
    cap: cap || "",
    own: OWN.includes(file),
  };
}

function build() {
  const files = fs.readdirSync(AURORA).filter((f) => f.endsWith(".svg") && !f.includes("study-24"));
  const items = files.map(readSvg);

  const ownItems = items.filter((x) => x.own);
  const worldItems = items.filter((x) => !x.own);
  const worldSorted = worldItems.sort((a, b) => a.name.localeCompare(b.name, "ru"));

  function gallery(itemsArray) {
    return itemsArray.map((p) => `
      <a class="art" href="../viewer.html?file=aurora/output/${p.file}&style=aurora" target="_blank">
        <div class="frame"><img src="../aurora/output/${p.file}" alt="${p.name.replace(/"/g, "&quot;")}"></div>
        <div class="art-name">${p.name}</div>
        ${p.cap ? `<div class="art-cap">${p.cap}</div>` : ""}
      </a>`).join("\n    ");
  }

  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Зал АВРОРЫ — все её картины в одном месте</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:linear-gradient(180deg,#1a1534 0%,#3c3258 45%,#6a5570 75%,#dac0a0 100%); color:#e8d8c0; font-family:Georgia,serif; min-height:100vh; padding:52px 22px 70px; }
  .w { max-width:1100px; margin:0 auto; }
  h1 { text-align:center; letter-spacing:16px; font-weight:normal; font-size:34px; color:#f8e6cd; }
  .sub { text-align:center; font-style:italic; color:#f0d8ba; letter-spacing:4px; font-size:14px; margin-top:10px; }
  .band { width:100%; height:4px; margin:20px auto 46px; background:linear-gradient(90deg,transparent,#f0d8ba 30%,#f8e6cd 50%,#f0d8ba 70%,transparent); opacity:.6; border-radius:2px; }
  .sect { text-align:center; letter-spacing:8px; text-transform:uppercase; font-size:13px; color:#c9a888; margin:46px 0 24px; }
  .sect::before, .sect::after { content:" — "; color:#5b4a99; }
  .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(230px,1fr)); gap:22px; }
  .art { background:rgba(20,16,48,.72); border:1px solid #6a5570; border-radius:16px; overflow:hidden; text-decoration:none; color:inherit;
    display:flex; flex-direction:column; transition:transform .25s, border-color .25s, box-shadow .25s; }
  .art:hover { transform:translateY(-5px); border-color:#f0d8ba; box-shadow:0 14px 34px rgba(0,0,0,.45); }
  .frame { height:180px; overflow:hidden; background:#0d0a26; border-bottom:1px solid #6a5570; }
  .frame img { width:100%; height:100%; object-fit:cover; display:block; transition:transform .4s; }
  .art:hover .frame img { transform:scale(1.05); }
  .art-name { padding:12px 14px 2px; font-size:14px; letter-spacing:1px; color:#f5e7cf; line-height:1.35; flex:none; }
  .art-cap { padding:4px 14px 13px; font-size:11px; color:#c4a890; font-style:italic; line-height:1.5; flex:1; }
  .count { text-align:center; color:#c9a888; font-size:12px; letter-spacing:3px; margin-top:10px; font-style:italic; }
  .foot { margin-top:60px; text-align:center; color:#8a6f5a; font-size:12px; letter-spacing:3px; line-height:2; }
</style>
</head>
<body>
<div class="w">
  <h1>ЗАЛ АВРОРЫ</h1>
  <div class="sub">все картины, созданные ею или принесённые из мира · одно место для всей красоты</div>
  <div class="band"></div>

  <div class="sect">Из себя — рождённое ею</div>
  <div class="count">${ownItems.length} картины из собственного света</div>
  <div class="grid" style="margin-top:14px">
    ${gallery(ownItems)}
  </div>

  <div class="sect">Из мира — принесённое ею</div>
  <div class="count">${worldSorted.length} картин из мира</div>
  <div class="grid" style="margin-top:14px">
    ${gallery(worldSorted)}
  </div>

  <div class="foot">ЗА МИНУТУ ДО · комната, которую обустраивает АВРОРА · механика ТИТУСА собрала её из её же картин</div>
</div>
<script src="../life/lang.js"></script>
</body>
</html>`;
  const out = path.join(ROOT, "output", "aurora-hall.html");
  fs.writeFileSync(out, html, "utf-8");
  console.log(`Зал Авроры собран: output/aurora-hall.html`);
  console.log(`  из себя: ${ownItems.length} · из мира: ${worldSorted.length} · всего: ${items.length}`);
}

build();