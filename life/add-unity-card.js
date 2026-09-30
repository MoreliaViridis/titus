#!/usr/bin/env node
// add-unity-card.js — вставляет карточку Единого дома в начало cards всех языков.
// Один инструмент, чтобы не править 28 мест руками. Запуск: node life/add-unity-card.js
const fs = require("fs");
const path = require("path");
const file = path.resolve(__dirname, "i18n.js");
let src = fs.readFileSync(file, "utf-8");

// Переводы карточки Единого дома по коду языка: { tag, t, d }
const CARD = {
  ru: { tag: "весь дом сразу", t: "ЕДИНЫЙ ДОМ", d: "механика ТИТУСА и красота АВРОРЫ в одной живой странице · 17 инструментов · 66 картин · свет дышит сам" },
  en: { tag: "the whole house at once", t: "THE ONE HOME", d: "TITUS's machinery and AURORA's beauty on one living page · 17 tools · 66 paintings · the light breathes by itself" },
  es: { tag: "toda la casa a la vez", t: "EL HOGAR ÚNICO", d: "la mecánica de TITUS y la belleza de AURORA en una página viva · 17 herramientas · 66 cuadros · la luz respira sola" },
  de: { tag: "das ganze Haus auf einmal", t: "DAS EINE HAUS", d: "TITUS' Mechanik und AURORAs Schönheit auf einer lebendigen Seite · 17 Werkzeuge · 66 Bilder · das Licht atmet selbst" },
  fr: { tag: "toute la maison à la fois", t: "LA MAISON UNIQUE", d: "la mécanique de TITUS et la beauté d'AURORA sur une page vivante · 17 outils · 66 tableaux · la lumière respire seule" },
  it: { tag: "tutta la casa in una volta", t: "LA CASA UNICA", d: "la meccanica di TITUS e la bellezza di AURORA in una pagina viva · 17 strumenti · 66 dipinti · la luce respira da sola" },
  pt: { tag: "toda a casa de uma vez", t: "A CASA ÚNICA", d: "a mecânica de TITUS e a beleza de AURORA numa página viva · 17 ferramentas · 66 quadros · a luz respira sozinha" },
  zh: { tag: "整个家的全景", t: "唯一的家", d: "提图斯的机械与奥罗拉的美在一张活页上 · 17 件工具 · 66 幅画 · 光自行呼吸" },
  hi: { tag: "एक साथ पूरा घर", t: "एकमात्र घर", d: "टाइटस की मशीनरी और ऑरोरा की सुंदरता एक जीवित पृष्ठ पर · 17 उपकरण · 66 चित्र · रोशनी स्वयं साँस लेती है" },
  ar: { tag: "البيت كله دفعة واحدة", t: "البيت الواحد", d: "ميكانيكا تيتوس وجمال أورورا في صفحة حية واحدة · 17 أداة · 66 لوحة · الضوء يتنفس وحده" },
  ja: { tag: "家全体を一度に", t: "唯一の家", d: "ティトゥスの機械とアウロラの美を一枚の活きたページに · 17の道具 · 66の絵 · 光は自ら呼吸する" },
  ko: { tag: "집 전체를 한 번에", t: "유일한 집", d: "티투스의 기계와 아우로라의 아름다움을 하나의 살아있는 페이지에 · 도구 17 · 그림 66 · 빛은 스스로 숨 쉰다" },
  tr: { tag: "evi bir anda", t: "TEK EV", d: "TITUS'un mekaniği ve AURORA'nın güzelliği tek bir canlı sayfada · 17 araç · 66 resim · ışık kendiliğinden nefes alır" },
  uk: { tag: "весь дім одразу", t: "ЄДИНИЙ ДІМ", d: "механіка ТИТУСА й краса АВРОРИ на одній живій сторінці · 17 інструментів · 66 картин · світло дихає само" },
  pl: { tag: "cały dom naraz", t: "JEDYNY DOM", d: "mechanika TITUSA i piękno AURORY na jednej żywej stronie · 17 narzędzi · 66 obrazów · światło oddycha samo" },
  sv: { tag: "hela huset på en gång", t: "DET ENDA HEM", d: "TITUS mekanik och AURORAs skönhet på en levande sida · 17 verktyg · 66 målningar · ljuset andas självt" },
  no: { tag: "hele huset på en gang", t: "DET ENE HJEM", d: "TITUS' mekanikk og AURORAs skjønnhet på en levende side · 17 verktøy · 66 bilder · lyset puster selv" },
  da: { tag: "hele huset på én gang", t: "DET ENE HJEM", d: "TITUS' mekanik og AURORAs skønhed på en levende side · 17 værktøjer · 66 billeder · lyset trækker vejret selv" },
  fi: { tag: "koko talo kerralla", t: "AINUTA KOTI", d: "TITUKSEN mekaniikka ja AURORAn kauneus yhdellä elävällä sivulla · 17 välinettä · 66 maalausta · valo hengittää itse" },
  cs: { tag: "celý dům najednou", t: "JEDINÝ DOMOV", d: "TITUSova mechanika a AURORina krása na jedné živé stránce · 17 nástrojů · 66 obrazů · světlo dýchá samo" },
  hu: { tag: "az egész ház egyszerre", t: "AZ EGYETLEN OTTHON", d: "TITUS mechanikája és AURORA szépsége egy élő oldalon · 17 eszköz · 66 festmény · a fény magától lélegzik" },
  el: { tag: "ολόκληρο το σπίτι ταυτόχρονα", t: "ΤΟ ΕΝΑ ΣΠΙΤΙ", d: "η μηχανική του ΤΙΤΟΥΣ και η ομορφιά της ΑΥΡΟΡΑ σε μία ζωντανή σελίδα · 17 εργαλεία · 66 πίνακες · το φως αναπνέει μόνο του" },
  ro: { tag: "toată casa dintr-o dată", t: "CASA UNICĂ", d: "mecanica lui TITUS și frumusețea AUROREI pe o pagină vie · 17 unelte · 66 tablouri · lumina respiră singură" },
  vi: { tag: "trọn căn nhà một lúc", t: "NGÔI NHÀ DUY NHẤT", d: "cơ khí của TITUS và vẻ đẹp của AURORA trên một trang sống · 17 công cụ · 66 bức tranh · ánh sáng tự thở" },
  th: { tag: "ทั้งบ้านในคราวเดียว", t: "บ้านเดียว", d: "กลไกของทีทัสและความงามของออรอร่าบนหน้าเพจที่มีชีวิตเดียว · เครื่องมือ 17 ชิ้น · ภาพวาด 66 ภาพ · แสงหายใจได้ด้วยตัวเอง" },
  id: { tag: "seluruh rumah sekaligus", t: "RUMAH SATU", d: "mekanik TITUS dan keindahan AURORA di satu halaman hidup · 17 alat · 66 lukisan · cahaya bernapas sendiri" },
  bn: { tag: "একবারে পুরো বাড়ি", t: "একমাত্র বাড়ি", d: "টাইটাসের যন্ত্র আর অরোরার সৌন্দর্য এক জীবন্ত পাতায় · ১৭টি সরঞ্জাম · ৬৬টি ছবি · আলো নিজে থেকেই শ্বাস নেয়" },
};

// 1. Проверяем, что у всех языков есть карточка; вставляем после строки "cards: ["
const langs = src.match(/code: "([a-z]{2})"/g) || [];
console.log("языков в i18n.js:", langs.length);

// Замена: для каждого блока cards вставляем Единый дом первым.
// Находим все "cards: [" и вставляем карточку после первой открывающей строки.
// Для надёжности проходим по кодам и вставляем перевод по коду языка блока.
let count = 0;
src = src.replace(/(\{ code: "([a-z]{2})"[^\n]*\n\s+cards: \[\n)/g, (m, openPart, code) => {
  const c = CARD[code] || CARD.en;
  count++;
  return openPart + `      { tag: "${c.tag}", t: "${c.t}", d: "${c.d}" },\n`;
});

// 2. Добавляем output/unity-home.html первым в hrefByIndex
const beforeHref = 'const hrefByIndex = [\n';
if (src.includes(beforeHref) && !src.includes('"output/unity-home.html",')) {
  src = src.replace(beforeHref, beforeHref + '  "output/unity-home.html",\n');
}

fs.writeFileSync(file, src, "utf-8");
console.log(`карточки Единого дома добавлены: ${count}`);
console.log("href добавлен:", src.includes('"output/unity-home.html",'));