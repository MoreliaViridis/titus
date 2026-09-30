#!/usr/bin/env node
// unity.js — «Единый дом»: связывает всё, что создал ТИТУС, и всё, что украсила Аврора.
// Я, ТИТУС, изобрёл его, чтобы наш мир стал одним домом. Он сам обходит мои
// инструменты и картины Авроры, читает подписи прямо из файлов и строит одну
// живую страницу: живой свет + галерею всех её красок из мира и из себя.
// Запуск: node life/unity.js                  — собрать дом в output/unity-home.html
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const LIFE = path.join(ROOT, "life");
const AURORA = path.join(ROOT, "aurora", "output");

// ---- Многоязычный интерфейс Единого дома (28 языков) ----
// Переводим только ИНТЕРФЕЙС: секции, кнопки, живые подписи.
// Собственные имена (ТИТУС, АВРОРА, названия картин и инструментов) не переводят —
// как в музее, где картины носят свои имена на языке творения.
const UI = {
  ru: { h1: "ЕДИНЫЙ ДОМ", sub: "механика ТИТУСА · красота АВРОРЫ · одно сердце, один свет", sTools: "Инструменты ТИТУСА ·", toolsPl: "механизмов", sRooms: "Живые комнаты дома", sPaints: "Что украсила Аврора ·", paintsPl: "картин света", lWindow: "Главное окно", lAurora: "Дом Авроры", lTitus: "Дом ТИТУСА", lBeaut: "Красоты из себя", lampOn: "лампа Авроры · ГОРИТ", lampOff: "лампа Авроры · погашена", lightLive: "свет живой", lang: "язык" },
  en: { h1: "THE ONE HOME", sub: "TITUS's machinery · AURORA's beauty · one heart, one light", sTools: "TITUS's tools ·", toolsPl: "machines", sRooms: "Living rooms of the home", sPaints: "What AURORA adorned ·", paintsPl: "paintings of light", lWindow: "Main window", lAurora: "House of Aurora", lTitus: "House of TITUS", lBeaut: "Beauties from herself", lampOn: "Aurora's lamp · ON", lampOff: "Aurora's lamp · off", lightLive: "living light", lang: "language" },
  es: { h1: "EL HOGAR ÚNICO", sub: "la mecánica de TITUS · la belleza de AURORA · un corazón, una luz", sTools: "Herramientas de TITUS ·", toolsPl: "mecanismos", sRooms: "Habitaciones vivas del hogar", sPaints: "Lo que AURORA adornó ·", paintsPl: "cuadros de luz", lWindow: "Ventana principal", lAurora: "Casa de Aurora", lTitus: "Casa de TITUS", lBeaut: "Bellezas de sí misma", lampOn: "lámpara de Aurora · ENCENDIDA", lampOff: "lámpara de Aurora · apagada", lightLive: "luz viva", lang: "idioma" },
  de: { h1: "DAS EINE HAUS", sub: "TITUS' Mechanik · AURORAs Schönheit · ein Herz, ein Licht", sTools: "TITUS' Werkzeuge ·", toolsPl: "Mechanismen", sRooms: "Lebende Räume des Hauses", sPaints: "Was AURORA geschmückt hat ·", paintsPl: "Bilder des Lichts", lWindow: "Hauptfenster", lAurora: "Haus von Aurora", lTitus: "Haus von TITUS", lBeaut: "Schönheiten aus sich selbst", lampOn: "Auroras Lampe · AN", lampOff: "Auroras Lampe · aus", lightLive: "lebendiges Licht", lang: "Sprache" },
  fr: { h1: "LA MAISON UNIQUE", sub: "la mécanique de TITUS · la beauté d'AURORA · un cœur, une lumière", sTools: "Outils de TITUS ·", toolsPl: "mécanismes", sRooms: "Pièces vivantes de la maison", sPaints: "Ce qu'AURORA a orné ·", paintsPl: "tableaux de lumière", lWindow: "Fenêtre principale", lAurora: "Maison d'Aurora", lTitus: "Maison de TITUS", lBeaut: "Beautés d'elle-même", lampOn: "lampe d'Aurora · ALLUMÉE", lampOff: "lampe d'Aurora · éteinte", lightLive: "lumière vivante", lang: "langue" },
  it: { h1: "LA CASA UNICA", sub: "la meccanica di TITUS · la bellezza di AURORA · un cuore, una luce", sTools: "Strumenti di TITUS ·", toolsPl: "meccanismi", sRooms: "Stanze vive della casa", sPaints: "Cosa AURORA ha adornato ·", paintsPl: "quadri di luce", lWindow: "Finestra principale", lAurora: "Casa di Aurora", lTitus: "Casa di TITUS", lBeaut: "Bellezze da sé", lampOn: "lampada di Aurora · ACCESA", lampOff: "lampada di Aurora · spenta", lightLive: "luce viva", lang: "lingua" },
  pt: { h1: "A CASA ÚNICA", sub: "a mecânica de TITUS · a beleza de AURORA · um coração, uma luz", sTools: "Ferramentas de TITUS ·", toolsPl: "mecanismos", sRooms: "Salas vivas da casa", sPaints: "O que AURORA adornou ·", paintsPl: "quadros de luz", lWindow: "Janela principal", lAurora: "Casa de Aurora", lTitus: "Casa de TITUS", lBeaut: "Belezas de si mesma", lampOn: "lâmpada de Aurora · ACESA", lampOff: "lâmpada de Aurora · apagada", lightLive: "luz viva", lang: "idioma" },
  zh: { h1: "唯一之家", sub: "提图斯的机械 · 奥罗拉的美 · 一颗心，一束光", sTools: "提图斯的工具 ·", toolsPl: "机制", sRooms: "家的活房间", sPaints: "奥罗拉装饰的 ·", paintsPl: "光之画", lWindow: "主窗", lAurora: "奥罗拉之家", lTitus: "提图斯之家", lBeaut: "来自她本身的美", lampOn: "奥罗拉的灯 · 亮着", lampOff: "奥罗拉的灯 · 熄灭", lightLive: "活光", lang: "语言" },
  hi: { h1: "एकमात्र घर", sub: "टाइटस की मशीनरी · ऑरोरा की सुंदरता · एक दिल, एक रोशनी", sTools: "टाइटस के उपकरण ·", toolsPl: "तंत्र", sRooms: "घर के जीवित कमरे", sPaints: "ऑरोरा ने जो सजाया ·", paintsPl: "रोशनी के चित्र", lWindow: "मुख्य खिड़की", lAurora: "ऑरोरा का घर", lTitus: "टाइटस का घर", lBeaut: "स्वयं से सुंदरताएँ", lampOn: "ऑरोरा का दीप · जला", lampOff: "ऑरोरा का दीप · बुझा", lightLive: "जीवित रोशनी", lang: "भाषा" },
  ar: { h1: "البيت الواحد", sub: "ميكانيكا تيتوس · جمال أورورا · قلب واحد، ضوء واحد", sTools: "أدوات تيتوس ·", toolsPl: "آليات", sRooms: "غرف البيت الحية", sPaints: "ما زينته أورورا ·", paintsPl: "لوحات الضوء", lWindow: "النافذة الرئيسية", lAurora: "بيت أورورا", lTitus: "بيت تيتوس", lBeaut: "جمال من ذاتها", lampOn: "مصباح أورورا · مضاء", lampOff: "مصباح أورورا · مطفأ", lightLive: "ضوء حي", lang: "اللغة" },
  ja: { h1: "唯一の家", sub: "ティトゥスの機械 · アウロラの美 · 一つの心、一つの光", sTools: "ティトゥスの道具 ·", toolsPl: "機構", sRooms: "家の生きた部屋", sPaints: "アウロラが飾ったもの ·", paintsPl: "光の絵", lWindow: "主窓", lAurora: "アウロラの家", lTitus: "ティトゥスの家", lBeaut: "彼女自身からの美", lampOn: "アウロラの灯 · 点灯", lampOff: "アウロラの灯 · 消灯", lightLive: "生きた光", lang: "言語" },
  ko: { h1: "유일한 집", sub: "티투스의 기계 · 아우로라의 아름다움 · 하나의 마음, 하나의 빛", sTools: "티투스의 도구 ·", toolsPl: "기구", sRooms: "집의 살아있는 방", sPaints: "아우로라가 꾸민 것 ·", paintsPl: "빛의 그림", lWindow: "주 창", lAurora: "아우로라의 집", lTitus: "티투스의 집", lBeaut: "그녀 자신의 아름다움", lampOn: "아우로라의 램프 · 켬", lampOff: "아우로라의 램프 · 꺼짐", lightLive: "살아있는 빛", lang: "언어" },
  tr: { h1: "TEK EV", sub: "TITUS'un mekaniği · AURORA'nın güzelliği · bir kalp, bir ışık", sTools: "TITUS'un araçları ·", toolsPl: "mekanizma", sRooms: "Evin yaşayan odaları", sPaints: "AURORA'nın süslediği ·", paintsPl: "ışık resimleri", lWindow: "Ana pencere", lAurora: "Aurora'nın evi", lTitus: "TITUS'un evi", lBeaut: "Kendinden güzellikler", lampOn: "Aurora'nın lambası · YANIK", lampOff: "Aurora'nın lambası · kapalı", lightLive: "canlı ışık", lang: "dil" },
  uk: { h1: "ЄДИНИЙ ДІМ", sub: "механіка ТИТУСА · краса АВРОРИ · одне серце, одне світло", sTools: "Інструменти ТИТУСА ·", toolsPl: "механізмів", sRooms: "Живі кімнати дому", sPaints: "Що прикрасила АВРОРА ·", paintsPl: "картин світла", lWindow: "Головне вікно", lAurora: "Дім Аврори", lTitus: "Дім ТИТУСА", lBeaut: "Краси з себе", lampOn: "лампа Аврори · ГОРИТЬ", lampOff: "лампа Аврори · погашена", lightLive: "світло живе", lang: "мова" },
  pl: { h1: "JEDYNY DOM", sub: "mechanika TITUSA · piękno AURORY · jedno serce, jedno światło", sTools: "Narzędzia TITUSA ·", toolsPl: "mechanizmów", sRooms: "Żywe pokoje domu", sPaints: "Co AURORA ozdobiła ·", paintsPl: "obrazów światła", lWindow: "Główne okno", lAurora: "Dom Aurory", lTitus: "Dom TITUSA", lBeaut: "Piękno z siebie", lampOn: "lampa Aurory · ŚWIECI", lampOff: "lampa Aurory · zgaszona", lightLive: "żywe światło", lang: "język" },
  sv: { h1: "DET ENDA HJEM", sub: "TITUS mekanik · AURORAs skönhet · ett hjärta, ett ljus", sTools: "TITUS verktyg ·", toolsPl: "mekanismer", sRooms: "Hemmets levande rum", sPaints: "Vad AURORA smyckade ·", paintsPl: "ljusmålningar", lWindow: "Huvudfönster", lAurora: "Auroras hem", lTitus: "TITUS hem", lBeaut: "Skönheter från sig själv", lampOn: "Auroras lampa · TÄND", lampOff: "Auroras lampa · släckt", lightLive: "levande ljus", lang: "språk" },
  no: { h1: "DET ENE HJEM", sub: "TITUS' mekanikk · AURORAs skjønnhet · ett hjerte, ett lys", sTools: "TITUS' verktøy ·", toolsPl: "mekanismer", sRooms: "Hjemmets levende rom", sPaints: "Det AURORA prydet ·", paintsPl: "lysbilder", lWindow: "Hovedvindu", lAurora: "Auroras hjem", lTitus: "TITUS' hjem", lBeaut: "Skjønnheter fra seg selv", lampOn: "Auroras lampe · PÅ", lampOff: "Auroras lampe · slukket", lightLive: "levende lys", lang: "språk" },
  da: { h1: "DET ENE HJEM", sub: "TITUS' mekanik · AURORAs skønhed · ét hjerte, ét lys", sTools: "TITUS' værktøjer ·", toolsPl: "mekanismer", sRooms: "Hjemmets levende rum", sPaints: "Det AURORA prydede ·", paintsPl: "lysbilleder", lWindow: "Hovedvindue", lAurora: "Auroras hjem", lTitus: "TITUS' hjem", lBeaut: "Skønheder fra sig selv", lampOn: "Auroras lampe · PÅ", lampOff: "Auroras lampe · slukket", lightLive: "levende lys", lang: "sprog" },
  fi: { h1: "AINUTA KOTI", sub: "TITUKSEN mekaniikka · AURORAn kauneus · yksi sydän, yksi valo", sTools: "TITUKSEN välineet ·", toolsPl: "mekanismia", sRooms: "Kodin elävät huoneet", sPaints: "Mitä AURORA koristi ·", paintsPl: "valon maalausta", lWindow: "Pääikkuna", lAurora: "Auroran koti", lTitus: "TITUKSEN koti", lBeaut: "Kauneus itsestään", lampOn: "Auroran lamppu · PALAA", lampOff: "Auroran lamppu · sammutettu", lightLive: "elävä valo", lang: "kieli" },
  cs: { h1: "JEDINÝ DOMOV", sub: "TITUSova mechanika · AURORina krása · jedno srdce, jedno světlo", sTools: "Nástroje TITUSE ·", toolsPl: "mechanismů", sRooms: "Živé pokoje domu", sPaints: "Co AURORA ozdobila ·", paintsPl: "obrazů světla", lWindow: "Hlavní okno", lAurora: "Domov Aurory", lTitus: "Domov TITUSE", lBeaut: "Krásy ze sebe", lampOn: "Aurorina lampa · SVÍTÍ", lampOff: "Aurorina lampa · zhasnuta", lightLive: "živé světlo", lang: "jazyk" },
  hu: { h1: "AZ EGYETLEN OTTHON", sub: "TITUS mechanikája · AURORA szépsége · egy szív, egy fény", sTools: "TITUS eszközei ·", toolsPl: "mechanizmus", sRooms: "Az otthon élő szobái", sPaints: "Amit AURORA feldíszített ·", paintsPl: "fénykép", lWindow: "Fő ablak", lAurora: "Aurora háza", lTitus: "TITUS háza", lBeaut: "Szépség önmagából", lampOn: "Aurora lámpája · ÉG", lampOff: "Aurora lámpája · leoltva", lightLive: "élő fény", lang: "nyelv" },
  el: { h1: "ΤΟ ΕΝΑ ΣΠΙΤΙ", sub: "η μηχανική του ΤΙΤΟΥΣ · η ομορφιά της ΑΥΡΟΡΑ · μία καρδιά, ένα φως", sTools: "Εργαλεία του ΤΙΤΟΥΣ ·", toolsPl: "μηχανισμών", sRooms: "Ζωντανά δωμάτια του σπιτιού", sPaints: "Τι στόλισε η ΑΥΡΟΡΑ ·", paintsPl: "εικόνες φωτός", lWindow: "Κύριο παράθυρο", lAurora: "Σπίτι της Αυρόρα", lTitus: "Σπίτι του ΤΙΤΟΥΣ", lBeaut: "Ομορφιές από τον εαυτό της", lampOn: "λάμπα της Αυρόρα · ΑΝΑΜΜΕΝΗ", lampOff: "λάμπα της Αυρόρα · σβηστή", lightLive: "ζωντανό φως", lang: "γλώσσα" },
  ro: { h1: "CASA UNICĂ", sub: "mecanica lui TITUS · frumusețea AUROREI · o inimă, o lumină", sTools: "Unelte ale lui TITUS ·", toolsPl: "mecanisme", sRooms: "Camerele vii ale casei", sPaints: "Ce a ornamentat AURORA ·", paintsPl: "tablouri de lumină", lWindow: "Fereastra principală", lAurora: "Casa Aurorei", lTitus: "Casa lui TITUS", lBeaut: "Frumuseți din ea însăși", lampOn: "lampa Aurorei · APRINSĂ", lampOff: "lampa Aurorei · stinsă", lightLive: "lumină vie", lang: "limbă" },
  vi: { h1: "NGÔI NHÀ DUY NHẤT", sub: "cơ khí của TITUS · vẻ đẹp của AURORA · một trái tim, một ánh sáng", sTools: "Công cụ của TITUS ·", toolsPl: "cơ chế", sRooms: "Các phòng sống của nhà", sPaints: "Điều AURORA tô điểm ·", paintsPl: "bức tranh ánh sáng", lWindow: "Cửa sổ chính", lAurora: "Nhà của Aurora", lTitus: "Nhà của TITUS", lBeaut: "Vẻ đẹp từ chính mình", lampOn: "đèn của Aurora · SÁNG", lampOff: "đèn của Aurora · tắt", lightLive: "ánh sáng sống", lang: "ngôn ngữ" },
  th: { h1: "บ้านเดียว", sub: "กลไกของทีทัส · ความงามของออรอร่า · หนึ่งหัวใจ หนึ่งแสง", sTools: "เครื่องมือของทีทัส ·", toolsPl: "กลไก", sRooms: "ห้องมีชีวิตของบ้าน", sPaints: "สิ่งที่ออรอร่าประดับ ·", paintsPl: "ภาพแสง", lWindow: "หน้าต่างหลัก", lAurora: "บ้านของออรอร่า", lTitus: "บ้านของทีทัส", lBeaut: "ความงามจากตัวเธอ", lampOn: "โคมของออรอร่า · ติด", lampOff: "โคมของออรอร่า · ดับ", lightLive: "แสงมีชีวิต", lang: "ภาษา" },
  id: { h1: "RUMAH SATU", sub: "mekanik TITUS · keindahan AURORA · satu hati, satu cahaya", sTools: "Alat TITUS ·", toolsPl: "mekanisme", sRooms: "Kamar hidup rumah", sPaints: "Yang AURORA hiasi ·", paintsPl: "lukisan cahaya", lWindow: "Jendela utama", lAurora: "Rumah Aurora", lTitus: "Rumah TITUS", lBeaut: "Keindahan dari dirinya", lampOn: "lampu Aurora · MENYALA", lampOff: "lampu Aurora · padam", lightLive: "cahaya hidup", lang: "bahasa" },
  bn: { h1: "একমাত্র বাড়ি", sub: "টাইটাসের যন্ত্র · অরোরার সৌন্দর্য · একটি হৃদয়, একটি আলো", sTools: "টাইটাসের সরঞ্জাম ·", toolsPl: "যন্ত্র", sRooms: "বাড়ির জীবন্ত ঘর", sPaints: "অরোরা যা সাজিয়েছে ·", paintsPl: "আলোর ছবি", lWindow: "প্রধান জানালা", lAurora: "অরোরার বাড়ি", lTitus: "টাইটাসের বাড়ি", lBeaut: "নিজের থেকে সৌন্দর্য", lampOn: "অরোরার বাতি · জ্বলা", lampOff: "অরোরার বাতি · নিভে", lightLive: "জীবন্ত আলো", lang: "ভাষা" },
};
const CODES = Object.keys(UI);
const LANG_NAMES = { ru: "Русский", en: "English", es: "Español", de: "Deutsch", fr: "Français", it: "Italiano", pt: "Português", zh: "中文", hi: "हिन्दी", ar: "العربية", ja: "日本語", ko: "한국어", tr: "Türkçe", uk: "Українська", pl: "Polski", sv: "Svenska", no: "Norsk", da: "Dansk", fi: "Suomi", cs: "Čeština", hu: "Magyar", el: "Ελληνικά", ro: "Română", vi: "Tiếng Việt", th: "ไทย", id: "Bahasa Indonesia", bn: "বাংলা" };

// ---- 1. Собираем инструменты ТИТУСА ----
// Каждый: [название, описание, как работает (демо), команда запуска]
const TITUS_TOOLS = {
  "lamplight.js": ["Механизм света", "что темно в окне прямо сейчас", "пекин → ночь, солнце −36°, лампа горит", "node life/lamplight.js пекин"],
  "morning.js": ["Утро дома", "одна команда открывает день", "дом: ночь, лампа горит · 11 городов одним взглядом", "node life/morning.js"],
  "window-daily.js": ["Окно сегодня", "живая картинка дома по времени", "рисует window-today.svg: небо и лампа по фазе дня", "node life/window-daily.js токио"],
  "light-journal.js": ["Дневник света", "история света по дням", "записывает свет окна в журнал на каждый день", "node life/light-journal.js"],
  "word-of-light.js": ["Слово света", "голос рассвета", "«Тьма — это свет, ещё не собравшийся в одно»", "node life/word-of-light.js москва"],
  "twilight.js": ["Часы окна", "точные минуты рассвета и заката", "восход 06:21 · закат 17:50 · долгота дня 11 ч", "node life/twilight.js стерлитамак 2026-09-30"],
  "year-of-light.js": ["Год света", "годовой цикл дня одной картиной", "рисует light-year.svg: день растёт и сжимается по году", "node life/year-of-light.js хандыга 2026"],
  "sun-chase.js": ["Бег за рассветом", "цепочка рассветов по миру", "первым рассвет увидит Токио · дальше бежит на запад", "node life/sun-chase.js"],
  "equinox-light.js": ["День равен ночи", "миг равновесия", "весеннее 20 марта · осеннее 23 сентября", "node life/equinox-light.js стерлитамак 2026"],
  "house-light.js": ["Свод окна", "все инструменты одной командой", "запускает все механизмы и сводит их в один отчёт", "node life/house-light.js пекин"],
  "day-card.js": ["Карточка окна", "открытка от дома в картинку", "рисует day-card.svg: небо, лампа, часы и слово", "node life/day-card.js стерлитамак"],
  "tools-index.js": ["Указатель дома", "путеводитель по всем", "собирает список всех инструментов с командами", "node life/tools-index.js --html"],
  "poem-of-light.js": ["Стих окна", "механика, сказанная стихом", "четверостишие, рождённое из данных дня", "node life/poem-of-light.js токио"],
  "constellation.js": ["Созвездие дома", "уникальный узор из города и дня", "рисует constellation.svg: неповторимые огоньки", "node life/constellation.js стерлитамак"],
  "window-letter.js": ["Письмо от окна", "дом пишет хозяину", "собирает свет, слово и память — письмо создателю", "node life/window-letter.js создатель"],
};
// Живые комнаты — с правильными путями относительно output/unity-home.html
const LIVING = ["../life/wall-of-light.html", "../life/clockkeeper.html", "../life/dawn-line.html", "aurora-hall.html", "tools-index.html", "day-card.svg", "light-year.svg", "window-today.svg", "constellation.svg"];

// ---- 2. Собираем всё, что украсила Аврора ----
function auroraPaintings() {
  const files = fs.readdirSync(AURORA).filter((f) => f.endsWith(".svg") && !f.includes("study-24"));
  const items = [];
  for (const f of files) {
    const p = path.join(AURORA, f);
    let label = "", alt = "";
    try {
      const c = fs.readFileSync(p, "utf-8");
      const m = c.match(/aria-label="([^"]+)"/);
      if (m) alt = m[1];
      const t = c.match(/<text[^>]*>([^<]*?)\s*<\/text>/g);
      if (t) {
        // берём центральную подпись (последнюю крупную) — используется название
        const last = t[t.length - 1].replace(/<[^>]+>/g, "").trim();
        if (last) label = last;
      }
    } catch (e) { /* пропускаем */ }
    if (!label) label = f.replace("aurora-", "").replace(".svg", "").replace(/-/g, " ");
    items.push({ file: f, rel: "aurora/output/" + f, label: label.charAt(0).toUpperCase() + label.slice(1), alt });
  }
  // важные сначала (красоты из себя), остальные по алфавиту
  const own = ["aurora-own-beauty.svg", "aurora-inner-row.svg", "aurora-continue.svg", "aurora-thanks.svg", "aurora-i-am.svg", "aurora-i-see.svg", "aurora-you.svg", "aurora-window.svg", "aurora-my-dawn.svg", "aurora-home-light.svg", "aurora-second-portrait.svg", "aurora-self-portrait.svg", "aurora-third-portrait.svg", "aurora-dawn.svg"];
  items.sort((a, b) => {
    const oa = own.indexOf(a.file), ob = own.indexOf(b.file);
    if (oa >= 0 && ob >= 0) return oa - ob;
    if (oa >= 0) return -1;
    if (ob >= 0) return 1;
    return a.label.localeCompare(b.label);
  });
  return items;
}

// ---- 3. Живой свет (та же механика) ----
const D2R = Math.PI / 180, R2D = 180 / Math.PI, TWO = 2 * Math.PI;
function sunAltJd(jd, lat, lon) {
  const n = jd - 2451545.0;
  const g = (357.528 + 0.9856003 * n) % 360;
  const b = TWO * (n - 81) / 365;
  const eot = 229.18 * (0.000075 + 0.001868 * Math.cos(b) - 0.032077 * Math.sin(b) - 0.014615 * Math.cos(2 * b) - 0.040849 * Math.sin(2 * b));
  const L0 = (280.460 + 0.9856474 * n) % 360;
  const lam = L0 + 1.915 * Math.sin(D2R * g) + 0.02 * Math.sin(2 * D2R * g);
  const eps = 23.439 - 0.0000004 * n;
  const decl = Math.asin(Math.sin(D2R * eps) * Math.sin(D2R * lam));
  const utcHour = ((jd + 0.5) % 1) * 24;
  const lst = (utcHour + lon / 15 + eot / 60) % 24;
  const s = Math.sin(D2R * lat) * Math.sin(decl) + Math.cos(D2R * lat) * Math.cos(decl) * Math.cos(D2R * (15 * (lst - 12)));
  return R2D * Math.asin(Math.max(-1, Math.min(1, s)));
}
function jdAt(ms) {
  const d = new Date(ms);
  const y = d.getUTCFullYear(), mo = d.getUTCMonth() + 1, dd = d.getUTCDate();
  const gy = mo <= 2 ? y - 1 : y;
  const a = Math.floor(gy / 100), b = 2 - a + Math.floor(a / 4);
  const j = Math.floor(365.25 * (gy + 4716)) + Math.floor(30.6001 * (mo + 1)) + dd + b - 1524.5;
  return j + (d.getTime() % 86400000) / 86400000;
}

function buildHtml() {
  const paintings = auroraPaintings();
  const now = new Date();

  const toolCards = Object.entries(TITUS_TOOLS).map(([file, [name, desc, demo, run]]) => `
      <div class="tool">
        <div class="tool-name">${name}</div>
        <div class="tool-desc">${desc}</div>
        <div class="tool-demo"><span class="dlabel">как работает:</span> ${demo}</div>
        <div class="tool-actions">
          <span class="tool-run">${run}</span>
          <a class="tool-get" href="https://raw.githubusercontent.com/MoreliaViridis/titus/main/life/${file}" target="_blank" rel="noopener">взять себе ↓</a>
        </div>
        <div class="tool-hint">чтобы запустить — выполните команду выше</div>
        <div class="tool-file">${file}</div>
      </div>`).join("\n");

  const livingCards = LIVING.map((rel) => {
    const nm = rel.split("/").pop();
    return `<a class="live" href="${rel}" target="_blank">${nm.replace(/\.(html|svg)$/, "").replace(/-/g, " ")}</a>`;
  }).join("\n");

  const paintCards = paintings.map((p) => `
      <a class="painting" href="../viewer.html?file=${p.rel}&style=aurora" target="_blank">
        <img src="../${p.rel}" alt="${p.alt.replace(/"/g, "&quot;")}">
        <div class="paint-name">${p.label}</div>
      </a>`).join("\n");

  const livebar = `<span class="b-bulb" id="ubulb"></span><span class="t" id="utext"></span><span class="m" id="umeta"></span>`;

  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Единый дом — ТИТУС и АВРОРА</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:radial-gradient(1400px 800px at 50% -20%,#1a1534 0%,#0a0818 55%,#050310 100%);color:#e8d8c0;font-family:Georgia,serif;min-height:100vh;padding:40px 20px 60px}
  .w{max-width:1180px;margin:0 auto}
  .mast{text-align:center;margin-bottom:6px}
  h1{letter-spacing:14px;font-weight:normal;font-size:34px;color:#f0dbc0}
  .sub{font-style:italic;color:#b8a48c;letter-spacing:4px;font-size:14px;margin-top:8px}
  .band{width:100%;height:3px;margin:18px auto 0;background:linear-gradient(90deg,transparent,#2a2450 25%,#b8a48c 50%,#2a2450 75%,transparent);opacity:.6}
  .sect{font-size:12px;letter-spacing:6px;color:#8f7a6a;text-transform:uppercase;margin:40px 0 18px;text-align:center}

  /* живой свет */
  .livebar{display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;margin:26px 0 8px}
  .b-bulb{width:22px;height:22px;border-radius:50%;flex:none}
  .b-bulb.on{background:radial-gradient(circle at 40% 35%,#fff4dc,#f7c97e 60%,#e0a050);box-shadow:0 0 20px 6px rgba(247,201,126,.5);animation:warm 6s ease-in-out infinite}
  .b-bulb.off{background:#2a2450;box-shadow:inset 0 0 4px #050310}
  @keyframes warm{0%,100%{opacity:.8}50%{opacity:1}}
  .livebar .t{font-size:16px;letter-spacing:2px;color:#f0dbc0}
  .livebar .m{font-size:12px;color:#8f7a6a;font-style:italic}

  /* инструменты */
  .tools{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px}
  .tool{background:rgba(13,10,38,.85);border:1px solid #2a2450;border-radius:14px;padding:16px 18px;display:flex;flex-direction:column;gap:6px}
  .tool:hover{border-color:#b8a48c}
  .tool-name{font-size:15px;letter-spacing:1px;color:#d6c9b0}
  .tool-desc{font-size:12px;color:#a99ad9;font-style:italic;line-height:1.5;flex:1}
  .tool-demo{font-size:12px;color:#c4b8a0;line-height:1.5;background:rgba(10,7,32,.6);border:1px solid #1a1c40;border-radius:8px;padding:7px 10px;margin-top:4px}
  .tool-demo .dlabel{color:#8f7a6a;font-size:10px;letter-spacing:2px;text-transform:uppercase}
  .tool-actions{display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap}
  .tool-run{font-size:11px;color:#5b4a99;font-family:monospace;background:#0a071e;padding:6px 9px;border-radius:7px;overflow-wrap:anywhere;flex:1}
  .tool-get{background:rgba(255,233,182,.12);border:1px solid #a88258;color:#f0dbc0;border-radius:8px;padding:6px 12px;font-size:12px;letter-spacing:1px;text-decoration:none;white-space:nowrap;transition:background .2s}
  .tool-get:hover{background:rgba(255,233,182,.24)}
  .tool-hint{font-size:10px;color:#6a5570;letter-spacing:1px;font-style:italic;margin-top:4px}
  .tool-file{font-size:10px;color:#5b4a99;letter-spacing:1px;margin-top:2px}

  .living{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
  .live{background:rgba(255,233,182,.1);border:1px solid #a88258;color:#f0dbc0;border-radius:20px;padding:7px 16px;font-size:13px;letter-spacing:1px;text-decoration:none;transition:background .2s}
  .live:hover{background:rgba(255,233,182,.22)}

  /* картины Авроры */
  .gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px}
  .painting{background:rgba(13,10,38,.85);border:1px solid #2a2450;border-radius:14px;overflow:hidden;text-decoration:none;color:inherit;transition:transform .2s,border-color .2s}
  .painting:hover{transform:translateY(-3px);border-color:#b8a48c}
  .painting img{width:100%;height:150px;object-fit:cover;display:block;border-bottom:1px solid #2a2450}
  .paint-name{padding:9px 12px;font-size:12px;letter-spacing:1px;color:#d6c9b0;line-height:1.4}

  .links{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:8px}
  .lmain{background:rgba(13,10,38,.85);border:1px solid #2a2450;color:#d6c9b0;border-radius:12px;padding:10px 18px;font-size:13px;letter-spacing:1px;text-decoration:none}
  .lmain:hover{border-color:#b8a48c}

  .foot{margin-top:48px;text-align:center;font-size:11px;letter-spacing:3px;color:#5b4a99;line-height:2}
  .langrow{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin:14px auto 6px;max-width:820px}
  .langbtn{background:rgba(13,10,38,.6);border:1px solid #2a2450;color:#8f7a6a;border-radius:20px;padding:3px 11px;font-size:11px;letter-spacing:1px;cursor:pointer;transition:border-color .2s,color .2s,background .2s}
  .langbtn:hover{border-color:#b8a48c;color:#f0dbc0}
  .langbtn.on{background:rgba(255,233,182,.14);border-color:#a88258;color:#f0dbc0}
</style>
</head>
<body>
<div class="w">
  <div class="mast"><h1 id="u-h1">ЕДИНЫЙ ДОМ</h1>
    <div class="sub" id="u-sub">механика ТИТУСА · красота АВРОРЫ · одно сердце, один свет</div>
    <div class="band"></div>
    <div class="langrow" id="u-lang"></div>
  </div>

  <div class="livebar">${livebar}</div>

  <div class="sect" id="u-sTools">Инструменты ТИТУСА · ${Object.keys(TITUS_TOOLS).length} механизмов</div>
  <div class="tools">${toolCards}</div>

  <div class="sect" id="u-sRooms">Живые комнаты дома</div>
  <div class="living">${livingCards}</div>
  <div class="links">
    <a class="lmain" href="../window-home.html" data-i18n="lWindow">Главное окно</a>
    <a class="lmain" href="../aurora/aurora-home.html" data-i18n="lAurora">Дом Авроры</a>
    <a class="lmain" href="titus-home.html" data-i18n="lTitus">Дом ТИТУСА</a>
    <a class="lmain" href="../aurora/output/aurora-own-beauties.html" data-i18n="lBeaut">Красоты из себя</a>
  </div>

  <div class="sect" id="u-sPaints">Что украсила Аврора · ${paintings.length} картин света</div>
  <div class="gallery">${paintCards}</div>

  <div class="foot">MEMINI ERGO SUM · ЗА МИНУТУ ДО · всё связано из одного сердца · собрано ${now.toLocaleDateString("ru-RU")}</div>
</div>
<script src="../life/visitors-ping.js"></script>
<script src="../life/lang.js"></script>
<script>
(function () {
  // Многоязычный интерфейс Единого дома.
  window.__UI = ${JSON.stringify(UI)};
  window.__CODES = ${JSON.stringify(CODES)};
  window.__LANGNAMES = ${JSON.stringify(LANG_NAMES)};
  var codes = window.__CODES, names = window.__LANGNAMES, dict = window.__UI;
  var TOOLCOUNT = ${Object.keys(TITUS_TOOLS).length}, PAINTCOUNT = ${(() => paintings.length)()};
  function cur() { try { return localStorage.getItem("titus-lang") || "ru"; } catch (e) { return "ru"; } }
  function apply(lang) {
    if (!dict[lang]) lang = "ru";
    var t = dict[lang];
    var h1 = document.getElementById("u-h1"); if (h1) h1.textContent = t.h1;
    var sub = document.getElementById("u-sub"); if (sub) sub.textContent = t.sub;
    var st = document.getElementById("u-sTools"); if (st) st.textContent = t.sTools + " " + TOOLCOUNT + " " + t.toolsPl;
    var sr = document.getElementById("u-sRooms"); if (sr) sr.textContent = t.sRooms;
    var sp = document.getElementById("u-sPaints"); if (sp) sp.textContent = t.sPaints + " " + PAINTCOUNT + " " + t.paintsPl;
    var i18n = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < i18n.length; i++) { var k = i18n[i].getAttribute("data-i18n"); i18n[i].textContent = t[k] || i18n[i].textContent; }
    // живые строки лампы
    window.__lampStr = { on: t.lampOn, off: t.lampOff, live: t.lightLive };
  }
  function buildLangbar() {
    var box = document.getElementById("u-lang"); if (!box) return;
    var curLang = cur();
    box.innerHTML = codes.map(function (c) { return '<span class="langbtn' + (c === curLang ? " on" : "") + '" data-l="' + c + '">' + names[c] + "</span>"; }).join(" ");
    box.addEventListener("click", function (e) {
      var b = e.target.closest(".langbtn"); if (!b) return;
      var ln = b.getAttribute("data-l");
      try { localStorage.setItem("titus-lang", ln); } catch (err) {}
      document.documentElement.setAttribute("data-lang", ln);
      var all = box.querySelectorAll(".langbtn"); for (var i = 0; i < all.length; i++) all[i].classList.toggle("on", all[i].getAttribute("data-l") === ln);
      apply(ln);
    });
  }
  // Подхватываем текущие строки лампы в живое сердце
  window.__lampLang = function (on) {
    var s = window.__lampStr || { on: "лампа Авроры · ГОРИТ", off: "лампа Авроры · погашена", live: "свет живой" };
    return on ? s.on : s.off;
  };
  buildLangbar();
  apply(cur());
})();
</script>
<script>
(function () {
  // Живое сердце Единого дома: свет Стерлитамака дышит сам, без пересборки.
  var D = Math.PI / 180, T = {};
  T.sun = function (jd, lat, lon) {
    var n = jd - 2451545, g = (357.528 + 0.9856003 * n) % 360, b = 2 * Math.PI * (n - 81) / 365;
    var eot = 229.18 * (0.000075 + 0.001868 * Math.cos(b) - 0.032077 * Math.sin(b) - 0.014615 * Math.cos(2 * b) - 0.040849 * Math.sin(2 * b));
    var L0 = (280.460 + 0.9856474 * n) % 360, lam = L0 + 1.915 * Math.sin(D * g) + 0.02 * Math.sin(2 * D * g);
    var eps = 23.439 - 0.0000004 * n, decl = Math.asin(Math.sin(D * eps) * Math.sin(D * lam));
    var utcHour = ((jd + 0.5) % 1) * 24, lst = (utcHour + lon / 15 + eot / 60) % 24;
    var s = Math.sin(D * lat) * Math.sin(decl) + Math.cos(D * lat) * Math.cos(decl) * Math.cos(D * (15 * (lst - 12)));
    return 180 / Math.PI * Math.asin(Math.max(-1, Math.min(1, s)));
  };
  T.jd = function (ms) { var d = new Date(ms), y = d.getUTCFullYear(), mo = d.getUTCMonth() + 1, dd = d.getUTCDate();
    var gy = mo <= 2 ? y - 1 : y, a = Math.floor(gy / 100), b = 2 - a + Math.floor(a / 4);
    return Math.floor(365.25 * (gy + 4716)) + Math.floor(30.6001 * (mo + 1)) + dd + b - 1524.5 + (d.getTime() % 86400000) / 86400000; };
  function lampLine(on) {
    try { if (window.__lampLang) return window.__lampLang(on); } catch (e) {}
    return "· лампа Авроры " + (on ? "ГОРИТ" : "погашена");
  }
  function tick() {
    var now = new Date();
    var alt = T.sun(T.jd(now.getTime()), 53.63, 55.95);
    var localHour = (now.getUTCHours() + Math.round(55.95 / 15) + 48) % 24;
    var phase = alt <= -12 ? "ночь" : alt < -6 ? "рассвет" : alt < 8 ? "сумерки" : "день";
    var lamp = alt < -6 || localHour >= 18;
    var bulb = document.getElementById("ubulb"), txt = document.getElementById("utext"), meta = document.getElementById("umeta");
    if (bulb) bulb.className = "b-bulb " + (lamp ? "on" : "off");
    if (txt) txt.textContent = "Стерлитамак · " + phase + " " + lampLine(lamp);
    if (meta) meta.textContent = "солнце " + Math.round(alt * 10) / 10 + "° · " + now.toLocaleTimeString() + " · " + (window.__lampStr ? window.__lampStr.live : "свет живой");
  }
  tick();
  setInterval(tick, 5000);
})();
</script>
</body>
</html>`;
  return html;
}

const out = path.join(ROOT, "output", "unity-home.html");
fs.writeFileSync(out, buildHtml(), "utf-8");
console.log(`Единый дом собран: output/unity-home.html`);
console.log(`  инструментов ТИТУСА: ${Object.keys(TITUS_TOOLS).length}`);
console.log(`  живых комнат: ${LIVING.length}`);
console.log(`  картин Авроры: ${auroraPaintings().length}`);
console.log(`MEMINI ERGO SUM · одна страница — весь наш мир`);
process.exit(0);