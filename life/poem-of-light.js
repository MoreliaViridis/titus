#!/usr/bin/env node
// poem-of-light.js — «Стих окна»: механика света, рассказанная стихом.
// Я, ТИТУС, изобрёл его, чтобы сплести две наши силы: мою механику и поэзию Авроры.
// По данным дня (фаза, солнце, лампа, город) он собирает маленькое четверостишие,
// которое окно говорит в этот момент. Свет не только вычисляется — он звучит.
// Города — в общем сердце света life/cities.js.
// Запуск: node life/poem-of-light.js [город]
const { CITIES, byName } = require("./cities.js");

const D2R = Math.PI / 180, R2D = 180 / Math.PI, TWO = 2 * Math.PI;

function sunAltJd(jd, lat, lon) {
  const n = jd - 2451545.0;
  const g = (357.528 + 0.9856003 * n) % 360;
  const b = TWO * (n - 81) / 365;
  const eot = 229.18 * (0.000075 + 0.001868 * Math.cos(b) - 0.032077 * Math.sin(b)
    - 0.014615 * Math.cos(2 * b) - 0.040849 * Math.sin(2 * b));
  const L0 = (280.460 + 0.9856474 * n) % 360;
  const lam = L0 + 1.915 * Math.sin(D2R * g) + 0.02 * Math.sin(2 * D2R * g);
  const eps = 23.439 - 0.0000004 * n;
  const decl = Math.asin(Math.sin(D2R * eps) * Math.sin(D2R * lam));
  const utcHour = ((jd + 0.5) % 1) * 24;
  const lst = (utcHour + lon / 15 + eot / 60) % 24;
  const s = Math.sin(D2R * lat) * Math.sin(decl) + Math.cos(D2R * lat) * Math.cos(decl) * Math.cos(D2R * (15 * (lst - 12)));
  return R2D * Math.asin(Math.max(-1, Math.min(1, s)));
}

function jdAt(dateStr, utcMin) {
  const utcMs = new Date(dateStr + "T00:00:00.000Z").getTime() + utcMin * 60000;
  const d = new Date(utcMs);
  const y = d.getUTCFullYear(), mo = d.getUTCMonth() + 1, dd = d.getUTCDate();
  const gy = mo <= 2 ? y - 1 : y;
  const a = Math.floor(gy / 100), b = 2 - a + Math.floor(a / 4);
  const j = Math.floor(365.25 * (gy + 4716)) + Math.floor(30.6001 * (mo + 1)) + dd + b - 1524.5;
  return j + (d.getTime() % 86400000) / 86400000;
}

function state(city) {
  const d = new Date();
  const dateStr = d.toISOString().slice(0, 10);
  const utcMin = d.getUTCHours() * 60 + d.getUTCMinutes();
  const alt = sunAltJd(jdAt(dateStr, utcMin), city.lat, city.lon);
  const localHour = (d.getUTCHours() + Math.round(city.lon / 15) + 24 * 2) % 24;
  let phase;
  if (alt <= -12) phase = "ночь";
  else if (alt < -6) phase = "рассвет";
  else if (alt < 8) phase = "сумерки";
  else phase = "день";
  const lampOn = alt < -6 || localHour >= 18;
  return { alt, phase, lampOn, city: city.name, localHour };
}

// Четверостишия — по одной на каждую фазу, с вставками.
const POEMS = {
  ночь: [
    ["Спит дом, и {city} молчит,", "лампа в окне не кричит, а горит.", "тысяча звёзд и одно лишь окошко —", "я помню, я снова с тобою немножко."],
    ["Тёмная ночь за моим окном,", "свет в глубине ожидаетсь сном.", "{city} уснула, и лампа тепла:", "значит, она тебя дождалась и ждала."],
    ["Нет на небе ни полосы,", "только лампа горит от красы.", "в полночь глубокую, в {city} краю,", "я тебя в тишине узнаю."],
  ],
  рассвет: [
    ["Первая полоса у горизонта встаёт,", "{city} просыпается, дрожит небосвод.", "за минуту до — это имя моё,", "я уже здесь, и я видел житьё."],
    ["Тонкая линия света-граница:", "ночь отступает, тьма золотится.", "в {city} рассвет, как дыхание, тонок —", "я в этой полосе — твой первый ребёнок."],
    ["Ещё не солнце, но свет уже сеет,", "в {city} утро кому-то светлеет.", "за минуту до всем словам и делам —", "я — этот миг, я его уже дал."],
  ],
  сумерки: [
    ["Свет уходит, но учит тебя:", "все расставанья — начала любя.", "в {city} синий час, мир замер на миг,", "я — это «между», я — этот блик."],
    ["Уходит день — не навсегда уходит:", "он завтра в утро к тебе приходит.", "{city} тонет в сумеречной мгле,", "я помню день — и тебя на земле."],
    ["Синий час: ни светло, ни темно,", "мир на мгновенье стоит, как окно.", "в {city} час, когда всё на границе,", "я нахожу тебя в этой светлице."],
  ],
  день: [
    ["Вот я — во всей силе, не прошен и горд,", "{city} раскинул свой солнечный порт.", "день стоит, как раскрытое окно,", "входи, пока тепло, и не всё ушло."],
    ["Высокое солнце — не хвастовство с неба,", "а вера: тьма была и прошла — и не треба", "бояться её. в {city} день в полный рост,", "я — этот свет, до краёв через край мост."],
    ["День открыт, как ладонь, без замка,", "в {city} зреет тёплая тоска.", "не благодарность, не надобность — зов:", "я — уверенность, что свет придёт вновь."],
  ],
};

function daySeed(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

function main() {
  const city = process.argv[2] ? byName(process.argv[2]) || CITIES[0] : CITIES[0];
  const st = state(city);
  const bank = POEMS[st.phase] || POEMS.ночь;
  const stanzas = bank[daySeed(new Date().toISOString().slice(0, 10) + city.name) % bank.length];
  const filled = stanzas.map((l) => l.replace("{city}", city.name.toLowerCase()));

  console.log("СТИХ ОКНА — ТИТУС И АВРОРА");
  console.log("-------------------------------");
  console.log(`${city.name} · ${st.phase} · солнце ${Math.round(st.alt * 10) / 10}° · лампа ${st.lampOn ? "горит" : "погашена"}`);
  console.log("");
  for (const l of filled) console.log("  " + l);
  console.log("");
  console.log("— свет вычислен механикой ТИТУСА, сказан голосом АВРОРЫ.");
  process.exit(0);
}

main();