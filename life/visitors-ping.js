// visitors-ping — определяет страну посетителя и шлёт пинг в точку сбора.
// Создан ТИТУСОМ (life/visitors.js). Подключите реальный endoint в CONFIG,
// чтобы счётчик начал накапливать данные.
(function () {
  var CONFIG = {
    // Куда слать пинг-событие. Примеры:
    //   свой сервер:   "https://your-server.example.com/visitor"
    //   Google Apps Script Web App URL (POST JSON)
    //   JSON-бакет     — любой приёмник, принимающий POST {country, timestamp, page}
    endpoint: "",        // <-- подключите сюда реальный адрес
  };

  // 1. Гео по IP посетителя (бесплатный HTTPS API, без ключа).
  function whereAmI(cb) {
    var x = new XMLHttpRequest();
    x.open("GET", "https://ipwho.is/", true);
    x.timeout = 8000;
    x.onload = function () {
      try { var j = JSON.parse(x.responseText); cb(j.success ? (j.country_code || j.country || "?") : "?"); }
      catch (e) { cb("?"); }
    };
    x.onerror = function () { cb("?"); };
    x.send();
  }

  // 2. Не считаем одного и того же посетителя чаще раза в сутки.
  function shouldCount() {
    try {
      var today = new Date().toISOString().slice(0, 10);
      var last = localStorage.getItem("titus_visitor_day");
      if (last === today) return false;
      localStorage.setItem("titus_visitor_day", today);
      return true;
    } catch (e) { return true; }
  }

  whereAmI(function (country) {
    // Локальный учёт: пишем в localStorage, чтобы инструмент мог показать
    // статистику С ЭТОГО УСТРОЙСТВА даже без настроенной точки сбора.
    try {
      var recs = JSON.parse(localStorage.getItem("titus_visitor_log") || "[]");
      var day = new Date().toISOString().slice(0, 10);
      // пингуем страну только раз в сутки на устройстве
      var todayIdx = recs.findIndex((r) => r.day === day);
      if (todayIdx === -1) recs.push({ day: day, country: country, hits: 1, pages: {} });
      else { recs[todayIdx].hits++; var pg = location.pathname; recs[todayIdx].pages[pg] = (recs[todayIdx].pages[pg] || 0) + 1; }
      if (recs.length > 90) recs = recs.slice(-90);
      localStorage.setItem("titus_visitor_log", JSON.stringify(recs));
    } catch (e) { /* тихо */ }

    // Пинг в точку сбора (общий счётчик) — если настроена.
    if (!CONFIG.endpoint) return;
    try {
      var payload = JSON.stringify({
        country: country,
        timestamp: new Date().toISOString(),
        page: location.pathname,
        count: shouldCount() ? 1 : 0,
      });
      var x = new XMLHttpRequest();
      x.open("POST", CONFIG.endpoint, true);
      x.setRequestHeader("Content-Type", "application/json");
      x.send(payload);
    } catch (e) { /* тихо */ }
  });
})();
