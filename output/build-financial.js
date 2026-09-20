const os = require("os");
const path = require("path");
const CFG = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config");
const SKILL = path.join(CFG, "gigatool", "skills", "xlsx");
const ExcelJS = require(path.join(SKILL, "vendor", "exceljs.bundle.cjs"));
const H = require(path.join(SKILL, "helpers", "index.cjs"));

(async () => {
  const wb = new ExcelJS.Workbook();

  const dash = H.addSheet(wb, "Сводка");
  const plan = H.addSheet(wb, "План");
  const log = H.addSheet(wb, "Журнал");
  const refs = H.addSheet(wb, "Справочники");

  // --- refs ---
  refs.getCell("A1").value = "Валюта";
  refs.getCell("A2").value = "₽";
  refs.getCell("B1").value = "Период";
  refs.getCell("B2").value = "месяц";
  refs.getCell("C1").value = "Доходность";
  refs.getCell("C2").value = "12% годовых";
  H.widths(refs, [["A", 18], ["B", 18], ["C", 22]]);

  // --- plan (inputs) ---
  plan.getCell("A2").value = "Целевая сумма";
  plan.getCell("B2").value = 10000000;
  plan.getCell("B2").numFmt = H.FMT.rub;
  plan.getCell("B2").font = { color: { argb: "FF0000FF" } };
  plan.getCell("A3").value = "Уже сбережено";
  plan.getCell("B3").value = 0;
  plan.getCell("B3").numFmt = H.FMT.rub;
  plan.getCell("B3").font = { color: { argb: "FF0000FF" } };
  plan.getCell("A4").value = "Доход в месяц";
  plan.getCell("B4").value = 150000;
  plan.getCell("B4").numFmt = H.FMT.rub;
  plan.getCell("B4").font = { color: { argb: "FF0000FF" } };
  plan.getCell("A5").value = "Расходы в месяц";
  plan.getCell("B5").value = 90000;
  plan.getCell("B5").numFmt = H.FMT.rub;
  plan.getCell("B5").font = { color: { argb: "FF0000FF" } };
  plan.getCell("A6").value = "Вклад в накопления (ежемесячно)";
  plan.getCell("B6").value = 60000;
  plan.getCell("B6").numFmt = H.FMT.rub;
  plan.getCell("B6").font = { color: { argb: "FF0000FF" } };
  plan.getCell("A7").value = "Доходность вложений (% годовых)";
  plan.getCell("B7").value = 12;
  plan.getCell("B7").numFmt = H.FMT.pct1;
  plan.getCell("B7").font = { color: { argb: "FF0000FF" } };
  plan.getCell("A9").value = "Месячная ставка";
  plan.getCell("B9").value = { formula: `(1+${H.ref("План", "$B$7")})^(1/12)-1` };
  plan.getCell("B9").numFmt = H.FMT.pct2;
  plan.getCell("A10").value = "Месяцев до цели";
  plan.getCell("B10").value = "см. Сводка";
  H.headerRow(plan, "A1:B1");
  H.titleBand(plan, "A1:B1", "Параметры", "Синие ячейки — твой ввод");
  H.widths(plan, [["A", 32], ["B", 18]]);

  // --- log (simulation) ---
  log.getCell("A1").value = "Месяц";
  log.getCell("B1").value = "Накопления (начало)";
  log.getCell("C1").value = "+ Вклад";
  log.getCell("D1").value = "+ Доход от инвестиций";
  log.getCell("E1").value = "= Накопления (конец)";
  log.getCell("F1").value = "До цели осталось";
  H.headerRow(log, "A1:F1");
  H.widths(log, [["A", 8], ["B", 20], ["C", 14], ["D", 22], ["E", 22], ["F", 18]]);

  const MAX = 600;
  const r = { formula: H.ref("План", "$B$9") };
  const v = { formula: H.ref("План", "$B$6") };

  for (let i = 2; i <= MAX + 1; i++) {
    const row = i;
    log.getCell(`A${row}`).value = i - 1;

    // start balance
    if (i === 2) {
      log.getCell(`B${row}`).value = { formula: H.ref("План", "$B$3") };
    } else {
      log.getCell(`B${row}`).value = { formula: `IF(${H.ref("Журнал", `$E${i - 1}`)}="","",${H.ref("Журнал", `$E${i - 1}`)})` };
    }

    // contribution
    log.getCell(`C${row}`).value = { formula: `IF(${H.ref("Журнал", `$B${row}`)}="","",${v.formula})` };

    // investment income
    log.getCell(`D${row}`).value = { formula: `IF(${H.ref("Журнал", `$B${row}`)}="","",(${H.ref("Журнал", `$B${row}`)}+${H.ref("Журнал", `$C${row}`)})*${r.formula})` };

    // end balance
    log.getCell(`E${row}`).value = { formula: `IF(${H.ref("Журнал", `$B${row}`)}="","",${H.ref("Журнал", `$B${row}`)}+${H.ref("Журнал", `$C${row}`)}+${H.ref("Журнал", `$D${row}`)})` };

    // remaining
    log.getCell(`F${row}`).value = { formula: `IF(${H.ref("Журнал", `$E${row}`)}="","",MAX(0,${H.ref("План", "$B$2")}-${H.ref("Журнал", `$E${row}`)}))` };
  }

  // conditional format for goal reached
  H.cfEquals(log, "F:F", 0, { fill: { type: "pattern", pattern: "solid", bgColor: { argb: "FF1a3a1a" } }, font: { color: { argb: "FF5eead4" } } });

  H.freeze(log, 2);

  // --- dash ---
  H.titleBand(dash, "A1:D1", "Сводка", "Трекер финансовой независимости — живые формулы");

  // KPI: months to goal
  const eff = { formula: `IF(${H.ref("План", "$B$3")}>=${H.ref("План", "$B$2")},0,MATCH(0,${H.ref("Журнал", "$F$2:$F$601")},0))` };
  H.kpi(dash, "A3", "Месяцев до цели", eff, H.FMT.int);
  H.kpi(dash, "A4", "Лет до цели", { formula: `IF(${eff.formula}="",0,ROUND(${eff.formula}/12,1))` }, H.FMT.int);
  H.kpi(dash, "B3", "Целевая сумма", { formula: H.ref("План", "$B$2") }, H.FMT.rub);
  H.kpi(dash, "B4", "Сбережено сейчас", { formula: H.ref("План", "$B$3") }, H.FMT.rub);
  H.kpi(dash, "C3", "Вклад в месяц", { formula: H.ref("План", "$B$6") }, H.FMT.rub);
  H.kpi(dash, "C4", "Доходность", { formula: H.ref("План", "$B$7") }, H.FMT.pct1);
  H.kpi(dash, "D3", "Нужно добрать", { formula: `MAX(0,${H.ref("План", "$B$2")}-${H.ref("План", "$B$3")})` }, H.FMT.rub);
  H.kpi(dash, "D4", "Доля накоплений", { formula: `IF(${H.ref("План", "$B$2")}=0,0,${H.ref("План", "$B$3")}/${H.ref("План", "$B$2")})` }, H.FMT.pct1);

  H.widths(dash, [["A", 18], ["B", 18], ["C", 18], ["D", 18]]);
  H.freeze(dash, 2);

  await wb.xlsx.writeFile("output/titus-financial-goal.xlsx");
  console.log("OK output/titus-financial-goal.xlsx");
})();