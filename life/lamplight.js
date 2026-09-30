#!/usr/bin/env node
// lamplight.js — механизм света для окна ТИТУСА и АВРОРЫ.
// Сам знает, когда в окне темно, когда светает и когда лампа должна гореть.
// Города и формулы — в общем сердце света life/cities.js.
// Запуск: node life/lamplight.js [город | lat [lon]] [дата]
const { CITIES, byName, resolve, state } = require("./cities.js");

function fmt(v, cityLabel) {
  const lines = [
    "МЕХАНИЗМ СВЕТА ОКНА — ТИТУС",
    "---------------------------",
    `город           : ${cityLabel}`,
    `момент          : ${v.iso}`,
    `широта/долгота  : ${v.lat} / ${v.lon}`,
    `солнце выше гор : ${v.sunAlt}°`,
    `фаза окна       : ${v.phase}`,
    `лампа Авроры    : ${v.lampOn ? "ГОРИТ" : "погашена"}`,
  ];
  return lines.join("\n");
}

const argv = process.argv.slice(2);
let city;
let date;
let label;
let latName, lonName;

// Пытаемся распознать аргументы: [город] ИЛИ [lat lon] ИЛИ [дата]
const first = argv[0];
const second = argv[1];
if (first && isNaN(parseFloat(first))) {
  // первый — имя города
  city = byName(first) || CITIES[0];
  label = city.name;
  argv.shift();
} else if (first !== undefined && second !== undefined && !isNaN(parseFloat(first)) && !isNaN(parseFloat(second))) {
  // первые два — координаты
  city = { name: `${first}, ${second}`, lat: parseFloat(first), lon: parseFloat(second) };
  label = city.name;
  argv.shift(); argv.shift();
} else {
  city = CITIES[0];
  label = city.name;
}

date = new Date(); // живой момент, а не полдень
const s = state(city, date);
const v = {
  iso: date.toISOString(),
  lat: city.lat,
  lon: city.lon,
  sunAlt: Math.round(s.alt * 100) / 100,
  phase: s.phase,
  lampOn: s.lampOn,
};
console.log(fmt(v, label));
process.exit(0);