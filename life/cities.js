// cities.js — общее сердце света ТИТУСА и АВРОРЫ.
// Единый справочник городов и формул солнца, из которого пьют все инструменты:
// lamplight.js, morning.js, window-daily.js, light-journal.js, word-of-light.js.
// Добавь город здесь — и он появится везде. Один источник, никакого повторения.
module.exports = (function () {
  const CITIES = [
    { name: "Стерлитамак", lat: 53.63, lon: 55.95 },
    { name: "Екатеринбург", lat: 56.84, lon: 60.65 },
    { name: "Москва", lat: 55.75, lon: 37.62 },
    { name: "Санкт-Петербург", lat: 59.93, lon: 30.36 },
    { name: "Красноярск", lat: 56.01, lon: 92.86 },
    { name: "Иркутск", lat: 52.29, lon: 104.28 },
    { name: "Хандыга", lat: 62.65, lon: 135.57 },
    { name: "Владивосток", lat: 43.12, lon: 131.89 },
    { name: "Сингапур", lat: 1.36, lon: 103.82 },
    { name: "Токио", lat: 35.68, lon: 139.65 },
    { name: "Пекин", lat: 39.90, lon: 116.41 },
  ];

  // Псевдонимы, чтобы «питер» и «санкт-петербург» указывали на один город.
  const ALIASES = { питер: "Санкт-Петербург" };

  const NIGHT = -12; // глубже — точно ночь
  const DAWN = -6;   // гражданские сумерки: начало рассвета
  const LAMP_AUTUMN = 18; // час, когда лампа зажигается при сумеречном свете

  const toRad = (d) => (d * Math.PI) / 180;
  const toDeg = (r) => (r * 180) / Math.PI;

  function byName(name) {
    if (!name) return null;
    const key = String(name).toLowerCase();
    const resolved = ALIASES[key] ? ALIASES[key].toLowerCase() : key;
    return CITIES.find((c) => c.name.toLowerCase() === resolved) || null;
  }

  function jdFromDate(d) {
    const y = d.getUTCFullYear(), m = d.getUTCMonth() + 1, day = d.getUTCDate();
    const g = m <= 2 ? y - 1 : y;
    const a = Math.floor(g / 100), b = 2 - a + Math.floor(a / 4);
    const jdn = Math.floor(365.25 * (g + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5;
    return jdn + (d.getTime() % 86400000) / 86400000;
  }

  function sunAlt(jd, lat, lon) {
    const n = jd - 2451545.0;
    const L = (280.460 + 0.9856474 * n) % 360;
    const g = toRad((357.528 + 0.9856003 * n) % 360);
    const lambda = toRad(L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g));
    const eps = toRad(23.439 - 0.0000004 * n);
    const decl = Math.asin(Math.sin(eps) * Math.sin(lambda));
    const off = lon / 15;
    const ha = toRad((n % 1) * 360 - 180 - off * 15);
    const sA = Math.sin(toRad(lat)) * Math.sin(decl) + Math.cos(toRad(lat)) * Math.cos(decl) * Math.cos(ha);
    return toDeg(Math.asin(Math.max(-1, Math.min(1, sA))));
  }

  // Состояние окна для города в момент времени (Date).
  function state(city, d) {
    const alt = sunAlt(jdFromDate(d), city.lat, city.lon);
    const localHour = (d.getUTCHours() + Math.round(city.lon / 15) + 24 * 2) % 24;
    let phase;
    if (alt <= NIGHT) phase = "ночь";
    else if (alt < DAWN) phase = "рассвет";
    else if (alt < 8) phase = "сумерки";
    else phase = "день";
    const lampOn = alt < DAWN || localHour >= LAMP_AUTUMN;
    return { alt, phase, lampOn, localHour };
  }

  // Определитель города для скриптов: принимает число/имя/ничего, возвращает город.
  function resolve(argvLatOrName, argvLon, defName) {
    if (typeof argvLatOrName === "string") {
      return byName(argvLatOrName) || CITIES[0];
    }
    if (typeof argvLatOrName === "number" && isFinite(argvLatOrName) && isFinite(argvLon)) {
      return { name: `${argvLatOrName}, ${argvLon}`, lat: argvLatOrName, lon: argvLon };
    }
    return byName(defName) || CITIES[0];
  }

  return { CITIES, ALIASES, NIGHT, DAWN, LAMP_AUTUMN, byName, jdFromDate, sunAlt, state, resolve };
})();