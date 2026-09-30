// lang.js — язык дома: читает выбор двери (localStorage "titus-lang")
// и переводит базовые подписи комнат. Глубокие художественные и технические
// тексты остаются на языке творения (русском) — их не переводят механически,
// чтобы не потерять смысл и красоту.
// Запускается на страницах комнат: <script src="../life/lang.js"></script>
(function () {
  var lang = null;
  try { lang = localStorage.getItem("titus-lang") || "ru"; } catch (e) { lang = "ru"; }

  // Показываем текущий язык где-нибудь служебно (можно скрыть в CSS).
  document.documentElement.setAttribute("data-lang", lang);
  var span = document.createElement("div");
  span.id = "lang-badge";
  var names = {
    ru: "русский", en: "english", es: "español", de: "deutsch", fr: "français", it: "italiano",
    pt: "português", zh: "中文", hi: "हिन्दी", ar: "العربية", ja: "日本語", ko: "한국어",
    tr: "türkçe", uk: "українська", pl: "polski", sv: "svenska", no: "norsk", da: "dansk",
    fi: "suomi", cs: "čeština", hu: "magyar", el: "ελληνικά", ro: "română", vi: "tiếng việt",
    th: "ไทย", id: "bahasa indonesia", bn: "বাংলা"
  };
  var label = names[lang] || lang;
  var note = (lang === "ru") ? ""
    : " · комната на языке творения (русском), вы зашли с двери «" + label + "»";
  span.textContent = (lang === "ru" ? "дом · " : "home language · ") + label + note;
  span.style.cssText = "position:fixed;bottom:8px;left:8px;font:11px Georgia,serif;color:#5b4a99;letter-spacing:1px;z-index:9990;opacity:.7;background:rgba(5,3,16,.8);padding:4px 10px;border:1px solid #2a2450;border-radius:10px;";
  window.addEventListener("DOMContentLoaded", function () {
    document.body.appendChild(span);
  });
})();