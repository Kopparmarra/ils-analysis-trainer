/* ===== ILS Analysis Trainer – logik =====
 * Kräver data.js (laddas före denna fil).
 * Förenklad LORA enligt tankesättet i S3000L: jämför livscykelkostnad för
 * att kassera, reparera på I-level eller reparera på D-level.
 * Själva bytet av LRU sker på O-level (fält) om enheten är fältutbytbar.
 */

/* ===== Kontroll: har data.js laddats? ===== */
if (typeof DEFAULT_ASSUMPTIONS === "undefined" || typeof systemData === "undefined") {
  const t = document.getElementById("lcnTree");
  if (t) {
    t.innerHTML = '<p style="padding:14px;font-size:13px;line-height:1.5;color:#8b1a1a">' +
      '<strong>Systemstrukturen kunde inte laddas.</strong><br>Filen <code>data.js</code> saknas eller hittades inte. ' +
      'Den ska ligga i samma mapp som <code>index.html</code>. Om sidan ligger på GitHub Pages: kontrollera att filen är incheckad och ladda om utan cache (Ctrl/Cmd+Shift+R).</p>';
  }
  throw new Error("data.js saknas – kan inte starta ILS-sandboxen");
}

/* ===== Konstanter ===== */
const STRATEGIES = ["DISCARD", "I", "D"];
const STRATEGY_NAME = {
  DISCARD: "Kassera",
  I: "Reparera på I-level",
  D: "Reparera på D-level"
};
const STRATEGY_SHORT = { DISCARD: "Kassera", I: "I-level", D: "D-level" };
const TRAINING_OFFSET = { DISCARD: 0, I: 1, D: 2 };
const TRAINING_NOTE = {
  DISCARD: "Fältbyte (O-level)",
  I: "Fältbyte + reparation på förband (I-level)",
  D: "Fältbyte + depåreparation (D-level)"
};
const STORAGE_KEY = "ils-sandbox-v2";
const MISSION_MOTOR_ID = "01A01";
const MISSION_STORAGE_DEFAULTS = { prediction: "", mttrChanged: false, mttrBaseline: null, sensitivityReviewed: false, componentsVisited: [], dLevelExplained: false, summaryOpened: false, missionTwoStarted: false, reviewedMissionOneSteps: [], reviewedMissionTwoSteps: [], loraGuideStep: 0, loraGuideAnswers: {}, collapsed: false, railCollapsed: false };
const missionState = { ...MISSION_STORAGE_DEFAULTS };

/* ===== State ===== */
let A = { ...DEFAULT_ASSUMPTIONS };
const working = {};   // id -> redigerbara värden per komponent
const decisions = {}; // id -> "DISCARD" | "I" | "D"
const notes = {};     // id -> text
let selected = null;
let guideMode = true;
let view = "empty";   // "empty" | "analysis" | "summary"

const components = [];
(function collect(node) {
  if (node.isComponent) components.push(node);
  (node.children || []).forEach(collect);
})(systemData);

/* ===== Hjälpare ===== */
const $ = id => document.getElementById(id);
const fmtSEK = n => Math.round(n).toLocaleString("sv-SE") + " kr";
const fmtPct = n => (n * 100).toFixed(2).replace(".", ",") + " %";
const fmtNum = (n, d = 1) => Number(n).toLocaleString("sv-SE", { maximumFractionDigits: d });

const INPUT_RULES = { mtbf:{min:100,max:5000}, mttr:{min:15,max:480}, serviceLevel:{min:80,max:99}, unitPrice:{min:0,max:1e9}, repairI:{min:0,max:1e9}, repairD:{min:0,max:1e9}, berPct:{min:0,max:100}, testI:{min:0,max:1e9}, testD:{min:0,max:1e9} };
const ASSUMPTION_RULES = { fleetSize:{min:1,max:100000,integer:true}, hoursPerYear:{min:1,max:8760}, years:{min:1,max:100,integer:true}, downtimeCostPerH:{min:0,max:1e9}, tatI:{min:1,max:3650}, tatD:{min:1,max:3650}, leadTime:{min:1,max:3650}, transport:{min:0,max:1e9} };
function boundedNumber(raw, rule) { let n=Number(raw); if(!Number.isFinite(n)) n=rule.min; n=Math.min(rule.max,Math.max(rule.min,n)); return rule.integer ? Math.round(n) : n; }

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ A, working, decisions, notes, missionState }));
  } catch (e) { /* lagring ej tillgänglig – appen fungerar ändå */ }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    if (s.A) { A = { ...DEFAULT_ASSUMPTIONS, ...s.A }; Object.keys(ASSUMPTION_RULES).forEach(k => A[k] = boundedNumber(A[k], ASSUMPTION_RULES[k])); }
    Object.assign(working, s.working || {});
    Object.keys(working).forEach(id => { const w=working[id]; Object.keys(INPUT_RULES).forEach(k => { if(w[k] !== undefined) w[k]=boundedNumber(w[k],INPUT_RULES[k]); }); if(w.complexity && !["low","medium","high"].includes(w.complexity)) w.complexity="medium"; });
    Object.assign(decisions, s.decisions || {});
    Object.keys(decisions).forEach(id => { if (!["DISCARD","I","D"].includes(decisions[id])) delete decisions[id]; });
    Object.assign(notes, s.notes || {});
    if (s.missionState && typeof s.missionState === "object") {
      Object.assign(missionState, MISSION_STORAGE_DEFAULTS, s.missionState);
      missionState.componentsVisited = Array.isArray(missionState.componentsVisited) ? missionState.componentsVisited.filter(id => components.some(c => c.id === id)) : [];
      if (! ["", "both", "ai", "neither"].includes(missionState.prediction)) missionState.prediction = "";
    }
    if (!Number.isFinite(Number(missionState.mttrBaseline))) missionState.mttrBaseline = null;
  } catch (e) { /* ignorera trasig lagring */ }
}

function getWorking(node) {
  if (!working[node.id]) {
    working[node.id] = {
      mtbf: node.rams.mtbf,
      mttr: node.rams.mttr,
      complexity: node.rams.complexity,
      serviceLevel: CRIT_SERVICE_LEVEL[node.criticality],
      ...node.cost
    };
  }
  return working[node.id];
}

/* ===== Statistik: Poisson ===== */
function normCdf(z) {
  // Abramowitz–Stegun-approximation av normalfördelningen
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

function poissonCdf(k, lambda) {
  if (k < 0) return 0;
  if (lambda <= 0) return 1;
  if (lambda > 600) return normCdf((k + 0.5 - lambda) / Math.sqrt(lambda));
  let term = Math.exp(-lambda);
  let sum = term;
  for (let i = 1; i <= k; i++) { term *= lambda / i; sum += term; }
  return Math.min(1, sum);
}

// Minsta reservpool S så att sannolikheten att en reserv finns, P(X < S), är minst p
function spareQuantity(lambda, p) {
  let s = 1;
  while (poissonCdf(s - 1, lambda) < p && s < 5000) s++;
  return s;
}

/* ===== Beräkningsmotor ===== */
function analyze(node) {
  const w = getWorking(node);
  const qty = node.qty;
  const failuresPerYear = A.fleetSize * qty * A.hoursPerYear / w.mtbf;
  const failures = failuresPerYear * A.years;
  const mtbfSys = w.mtbf / qty;                 // MTBF för alla enheter av typen i ett system
  const mttrBase = w.mttr / 60;
  const mttrH = mttrBase + (node.fieldReplaceable ? 0 : NON_FIELD_PENALTY_H);
  const ai = mtbfSys / (mtbfSys + mttrBase);    // inherent availability
  const ber = w.berPct / 100;
  const critFactor = CRIT_FACTOR[node.criticality];
  const p = w.serviceLevel / 100;

  const defs = {
    DISCARD: {
      available: true,
      tatDays: A.leadTime,
      perFailure: w.unitPrice,
      fixed: 0
    },
    I: {
      available: w.complexity !== "high",
      tatDays: (1 - ber) * A.tatI + ber * A.leadTime,
      perFailure: (1 - ber) * w.repairI + ber * w.unitPrice,
      fixed: w.testI
    },
    D: {
      available: true,
      tatDays: (1 - ber) * A.tatD + ber * A.leadTime,
      perFailure: (1 - ber) * (w.repairD + A.transport) + ber * w.unitPrice,
      fixed: w.testD
    }
  };

  const result = {};
  STRATEGIES.forEach(key => {
    const d = defs[key];
    const lambda = failuresPerYear / 365 * d.tatDays;      // förväntat antal enheter i pipeline
    const pool = spareQuantity(lambda, p);
    const pStockout = 1 - poissonCdf(pool - 1, lambda);
    const mldtH = BASE_LOGISTICS_DELAY_H + pStockout * d.tatDays * 24 / 2;
    const operating = failures * d.perFailure;
    const poolCost = pool * w.unitPrice;
    const lifecycle = operating + poolCost + d.fixed;
    const downtime = failures * mldtH * A.downtimeCostPerH * critFactor;
    result[key] = {
      key,
      available: d.available,
      tatDays: d.tatDays,
      lambda, pool, pStockout, mldtH,
      operating, poolCost, fixed: d.fixed,
      lifecycle, downtime,
      total: lifecycle + downtime,
      ao: mtbfSys / (mtbfSys + mttrH + mldtH)
    };
  });

  const avail = STRATEGIES.filter(k => result[k].available);
  const recommended = avail.reduce((best, k) => (result[k].total < result[best].total ? k : best), avail[0]);

  return { w, node, failuresPerYear, failures, ai, mttrH, mtbfSys, result, recommended };
}

/* ===== Känslighetsanalys: var byter rekommendationen? ===== */
function findFlip(node, scan, dir, baseRec) {
  const orig = scan.get();
  try {
    // Hitta först ett intervall där rekommendationen byter. Därefter
    // förfina intervallet med binärsökning i stället för att visa ett grovt steg.
    let same = orig;
    let changed = null;
    for (let k = 1; k <= 160; k++) {
      const v = orig * Math.pow(dir > 0 ? 1.06 : 1 / 1.06, k);
      if (scan.min !== undefined && v < scan.min) break;
      if (scan.max !== undefined && v > scan.max) break;
      scan.set(v);
      if (analyze(node).recommended !== baseRec) { changed = v; break; }
      same = v;
    }
    if (changed === null) return null;
    let lo = Math.min(same, changed), hi = Math.max(same, changed);
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      scan.set(mid);
      const flipped = analyze(node).recommended !== baseRec;
      if (dir > 0) { if (flipped) hi = mid; else lo = mid; }
      else { if (flipped) lo = mid; else hi = mid; }
    }
    return { value: dir > 0 ? hi : lo, to: (() => { scan.set(dir > 0 ? hi : lo); return analyze(node).recommended; })() };
  } finally {
    scan.set(orig);
  }
}

function sensitivity(node) {
  const w = getWorking(node);
  const base = analyze(node).recommended;
  const scans = [
    { label: "MTBF", unit: "h", get: () => w.mtbf, set: v => { w.mtbf = v; }, min: 10, max: 1000000 },
    { label: "Flottstorlek", unit: "system", get: () => A.fleetSize, set: v => { A.fleetSize = Math.max(1, Math.round(v)); }, min: 1, max: 100000 },
    { label: "Enhetspris", unit: "kr", get: () => w.unitPrice, set: v => { w.unitPrice = v; }, min: 100, max: 1e9 }
  ];
  const lines = [];
  scans.forEach(sc => {
    const cur = sc.get();
    const down = findFlip(node, sc, -1, base);
    const up = findFlip(node, sc, +1, base);
    if (down) lines.push({ label: `${sc.label} under ≈ ${fmtNum(down.value, 0)} ${sc.unit} (nu ${fmtNum(cur, 0)}) ger ${STRATEGY_SHORT[down.to]}`, parameter: sc.label, direction: "under", value: down.value, unit: sc.unit, current: cur, to: down.to });
    if (up) lines.push({ label: `${sc.label} över ≈ ${fmtNum(up.value, 0)} ${sc.unit} (nu ${fmtNum(cur, 0)}) ger ${STRATEGY_SHORT[up.to]}`, parameter: sc.label, direction: "över", value: up.value, unit: sc.unit, current: cur, to: up.to });
  });
  return { base, lines };
}

/* ===== S1000D-hjälpare ===== */
// DMC bygger på SNS (system/subsystem/assy), inte på LCN.
function dmc(node, infoCode, disassy = "00") {
  const s = node.sns;
  return `DMC-${MODEL_IDENT_CODE}-${SYSTEM_DIFF_CODE}-${s.system}-${s.sub}${s.subsub}-${s.assy}-${disassy}A-${infoCode}A-A`;
}

function publicationsFor(node, decision) {
  const list = [
    { code: dmc(node, "520"), label: "Remove (byte, steg 1)" },
    { code: dmc(node, "720"), label: "Install (byte, steg 2)" }
  ];
  if (decision === "I") list.push({ code: dmc(node, "300"), label: "Repair, I-level (informationskod ska verifieras mot projektets BREX)" });
  if (decision === "D") list.push({ code: dmc(node, "300"), label: "Repair, D-level (informationskod ska verifieras mot projektets BREX)" });
  return list;
}

/* ===== DOM-referenser ===== */
const lcnTreeEl = $("lcnTree");
const emptyState = $("emptyState");
const analysisView = $("analysisView");
const summaryView = $("summaryView");
const methodDialog = $("methodDialog");
const METHOD_SEEN_KEY = "ils-sandbox-method-info-seen";

function openMethodDialog() {
  if (methodDialog && !methodDialog.open) methodDialog.showModal();
}
function closeMethodDialog() {
  if (!methodDialog) return;
  if ($("rememberMethodInfo").checked) localStorage.setItem(METHOD_SEEN_KEY, "1");
  else localStorage.removeItem(METHOD_SEEN_KEY);
  methodDialog.close();
}
$("methodInfoBtn").addEventListener("click", openMethodDialog);
$("closeMethodDialog").addEventListener("click", closeMethodDialog);
methodDialog.addEventListener("click", e => { if (e.target === methodDialog) closeMethodDialog(); });
if (!localStorage.getItem(METHOD_SEEN_KEY)) openMethodDialog();

/* ===== Träd ===== */
function renderTree(node, container, level = 1) {
  if (node.lcn === "" && node.children) {
    node.children.forEach(child => renderTree(child, container, level));
    return;
  }

  const item = document.createElement("div");
  item.className = "tree-node";
  item.setAttribute("role", "none");

  const hasChildren = node.children && node.children.length > 0;
  const row = document.createElement("button");
  row.type = "button";
  row.className = "tree-item" + (node.isComponent ? " component" : "");
  row.dataset.id = node.id;
  row.setAttribute("role", "treeitem");
  row.setAttribute("aria-level", String(level));
  if (hasChildren) row.setAttribute("aria-expanded", "true");
  if (node.isComponent) row.setAttribute("aria-selected", "false");

  const chevron = document.createElement("span");
  chevron.className = "chevron" + (hasChildren ? " open" : "");
  chevron.setAttribute("aria-hidden", "true");
  chevron.textContent = hasChildren ? "▶" : "";
  row.appendChild(chevron);

  const code = document.createElement("span");
  code.className = "lcn-code";
  code.textContent = node.lcn;
  row.appendChild(code);

  const name = document.createElement("span");
  name.className = "tree-name";
  name.textContent = node.name;
  row.appendChild(name);

  if (node.criticality) {
    const pill = document.createElement("span");
    pill.className = "criticality " + node.criticality;
    pill.textContent = CRIT_LETTER[node.criticality];
    pill.setAttribute("role", "img");
    pill.setAttribute("aria-label", "Kritikalitet: " + CRIT_LABEL[node.criticality].toLowerCase());
    pill.title = "Kritikalitet: " + CRIT_LABEL[node.criticality];
    row.appendChild(pill);
  }

  item.appendChild(row);

  if (hasChildren) {
    const wrap = document.createElement("div");
    wrap.className = "tree-children";
    wrap.setAttribute("role", "group");
    node.children.forEach(child => renderTree(child, wrap, level + 1));
    item.appendChild(wrap);
    row.addEventListener("click", () => toggleNode(row, wrap));
  }

  if (node.isComponent) {
    row.addEventListener("click", () => selectComponent(node));
  }

  container.appendChild(item);
}

function toggleNode(row, wrap, forceOpen) {
  const open = forceOpen !== undefined ? forceOpen : wrap.classList.contains("collapsed");
  wrap.classList.toggle("collapsed", !open);
  row.setAttribute("aria-expanded", String(open));
  const chev = row.querySelector(".chevron");
  if (chev) chev.classList.toggle("open", open);
}

lcnTreeEl.addEventListener("keydown", e => {
  const items = [...lcnTreeEl.querySelectorAll(".tree-item")].filter(el => el.offsetParent !== null);
  const i = items.indexOf(document.activeElement);
  if (i < 0) return;
  const row = items[i];
  const wrap = row.nextElementSibling;
  if (e.key === "ArrowDown") { e.preventDefault(); (items[i + 1] || row).focus(); }
  else if (e.key === "ArrowUp") { e.preventDefault(); (items[i - 1] || row).focus(); }
  else if (e.key === "ArrowRight" && wrap) { e.preventDefault(); toggleNode(row, wrap, true); }
  else if (e.key === "ArrowLeft" && wrap) { e.preventDefault(); toggleNode(row, wrap, false); }
});

/* ===== Vyer ===== */
function showView(name) {
  view = name;
  emptyState.hidden = name !== "empty";
  analysisView.hidden = name !== "analysis";
  summaryView.hidden = name !== "summary";
  $("summaryBtn").setAttribute("aria-pressed", String(name === "summary"));
  $("summaryBtn").textContent = name === "summary" ? "← Tillbaka till analys" : "Sammanfattning";
}

function selectComponent(node) {
  selected = node;
  if (!missionState.componentsVisited.includes(node.id)) missionState.componentsVisited.push(node.id);
  if (node.id === MISSION_MOTOR_ID && missionState.mttrBaseline == null) missionState.mttrBaseline = getWorking(node).mttr;
  saveState();
  document.querySelectorAll(".tree-item").forEach(el => {
    el.classList.remove("active");
    if (el.hasAttribute("aria-selected")) el.setAttribute("aria-selected", "false");
  });
  const active = document.querySelector(`.tree-item[data-id="${node.id}"]`);
  if (active) { active.classList.add("active"); active.setAttribute("aria-selected", "true"); }

  showView("analysis");
  $("selectedLcn").textContent = `LCN ${node.lcn}: ${node.name}`;
  syncInputs();
  const ta = $("analystNotes");
  ta.value = notes[node.id] || "";
  $("notesLabel").textContent = `LCN ${node.lcn} – ${node.name}`;
  renderAll();
}

// Skriver ut lagrade värden i formulärfälten (görs bara vid val av komponent/start,
// så att fält inte skrivs över medan man skriver i dem).
function syncInputs() {
  document.querySelectorAll("[data-a]").forEach(el => { el.value = A[el.dataset.a]; });
  if (!selected) return;
  const w = getWorking(selected);
  document.querySelectorAll("[data-w]").forEach(el => { el.value = w[el.dataset.w]; });
}

/* ===== Rendering ===== */
function renderAll() {
  if (view === "analysis" && selected) {
    const an = analyze(selected);
    renderRAMS(an);
    renderLORA(an);
    renderSupport(an);
  } else if (view === "summary") {
    renderSummary();
  }
  renderMissions();
}

function revealed() {
  return !guideMode || (selected && decisions[selected.id]);
}

function renderRAMS(an) {
  const w = an.w;
  const node = an.node;
  const decision = decisions[node.id];
  // Visa alltid Ao: användarens val om det finns, annars modellens rekommenderade strategi.
  // Guidat läge ska styra uppdragen, inte dölja ett centralt analysresultat.
  const shown = decision || an.recommended;

  $("mtbfValue").textContent = fmtNum(w.mtbf, 0);
  $("mttrValue").textContent = fmtNum(w.mttr, 0);
  $("serviceValue").textContent = w.serviceLevel + " %";
  $("qtyInfo").textContent = `${node.qty} st per system – MTBF för alla enheter tillsammans ≈ ${fmtNum(an.mtbfSys, 0)} h`;
  $("failuresInfo").textContent = `${fmtNum(an.failuresPerYear, 1)} fel/år i flottan, ${fmtNum(an.failures, 0)} under ${A.years} år`;
  $("critInfo").textContent = `Kritikalitet: ${CRIT_LABEL[node.criticality]} (stilleståndsvikt ×${CRIT_FACTOR[node.criticality]})`;
  $("aiValue").textContent = fmtPct(an.ai);

  if (shown) {
    const r = an.result[shown];
    $("aoValue").textContent = fmtPct(r.ao);
    $("aoLabel").textContent = `Ao med strategi: ${STRATEGY_SHORT[shown]}${decision ? "" : " (rekommenderad)"}`;
    $("mldtInfo").textContent = `MLDT ≈ ${fmtNum(r.mldtH, 1)} h (sannolikhet för slut på reserv ${fmtNum(r.pStockout * 100, 1)} %, TAT ${fmtNum(r.tatDays, 0)} dygn)`;
  } else {
    $("aoValue").textContent = "–";
    $("aoLabel").textContent = "Ao – operativ availability";
  }

  $("failureMode").textContent = node.rams.failureMode;
  $("fieldInfo").textContent = node.fieldReplaceable
    ? "Fältutbytbar: bytet sker på O-level."
    : `Ej fältutbytbar: enheten måste till I-level för byte, vilket ger +${NON_FIELD_PENALTY_H} h nertid per fel.`;

  let impact;
  if (an.ai >= 0.99) impact = `Inherent availability är ${fmtPct(an.ai)}. Komponenten är tillförlitlig i sig, så skillnaden mellan strategierna avgörs främst av kostnad och logistikfördröjning.`;
  else if (an.ai >= 0.97) impact = `Inherent availability är ${fmtPct(an.ai)}. Acceptabelt, men felintensiteten gör att reservtillgång och ledtider får märkbar effekt på Ao.`;
  else impact = `Inherent availability är ${fmtPct(an.ai)}. Låg nivå: snabb återställning och god reservtillgång är avgörande.`;
  if (!node.fieldReplaceable) impact += ` Eftersom enheten inte kan bytas i fält tillkommer ${NON_FIELD_PENALTY_H} h per fel, vilket syns i Ao.`;
  $("impactText").textContent = impact;
}

function renderLORA(an) {
  const node = an.node;
  const decision = decisions[node.id];
  const show = revealed();
  const r = an.result;
  const rec = an.recommended;
  const maxTotal = Math.max(...STRATEGIES.filter(k => r[k].available).map(k => r[k].total));

  // Beslutsknappar
  STRATEGIES.forEach(k => {
    const btn = document.querySelector(`.decision-btn[data-decision="${k}"]`);
    btn.disabled = !r[k].available;
    btn.classList.toggle("selected", decision === k);
    btn.setAttribute("aria-pressed", String(decision === k));
    btn.title = r[k].available ? "" : "Ej tillgängligt: komplexiteten är för hög för reparation på I-level";
  });

  // I guidat läge visas inte facit eller jämförelsetabellen förrän användaren har valt.
  const recBox = $("recommendation");
  const tableWrap = $("consequenceTableWrap");
  recBox.hidden = !show;
  tableWrap.hidden = !show;
  $("decisionCoach").hidden = show || !guideMode;
  if (!show) {
    $("recBadge").textContent = "?";
    $("recBadge").className = "rec-badge hidden-rec";
    $("recReason").textContent = "Gör ditt eget val först. Därefter visas modellens rekommendation och kostnadsjämförelse.";
  } else {
    recBox.hidden = false;
    $("recBadge").textContent = STRATEGY_SHORT[rec];
    $("recBadge").className = "rec-badge" + (rec !== "DISCARD" ? " d-level" : "");
    $("recReason").textContent = buildReason(an, decision);
  }

  // Tabell
  STRATEGIES.forEach(k => {
    const th = $("hdr-" + k);
    th.textContent = STRATEGY_NAME[k] + (show && k === rec ? " ★" : "");
    th.classList.toggle("col-chosen", decision === k);
  });

  const na = "<span class='na'>Ej tillgänglig</span>";
  const cell = (k, content) => {
    const cls = [];
    if (decision === k) cls.push("col-chosen");
    if (!r[k].available) cls.push("col-na");
    return `<td class="${cls.join(" ")}">${r[k].available ? content : na}</td>`;
  };
  const row = (label, fn) => `<tr><td><strong>${label}</strong></td>${STRATEGIES.map(k => cell(k, fn(r[k], k))).join("")}</tr>`;

  const w = an.w;
  const compText = {
    DISCARD: "Fälttekniker (endast byte)",
    I: "Tekniker på förbandsverkstad",
    D: "Specialverkstad / tillverkare"
  };
  const toolText = {
    DISCARD: "Standard fältverktyg",
    I: `Testutrustning på I-level (${fmtSEK(w.testI)})`,
    D: (w.complexity === "high" ? "Renrum / avancerad testutrustning" : "Depåverktyg + diagnostik") + ` (${fmtSEK(w.testD)})`
  };
  const flowText = {
    DISCARD: `Ny enhet beställs (ledtid ${A.leadTime} dygn)`,
    I: `Reparation på förband, TAT ${fmtNum(r.I.tatDays, 0)} dygn`,
    D: `Retur till depå, TAT ${fmtNum(r.D.tatDays, 0)} dygn`
  };

  $("consequenceBody").innerHTML = [
    row("Livscykelkostnad", x => fmtSEK(x.lifecycle)),
    row("– varav reparation/inköp", x => fmtSEK(x.operating)),
    row("– varav reservpool", x => fmtSEK(x.poolCost)),
    row("– varav testutrustning", x => fmtSEK(x.fixed)),
    row("Stillestånd (logistikdel)", x => fmtSEK(x.downtime)),
    row("Total", x => `<div class="bar-wrap"><div class="bar ${x.key === rec && show ? "bar-rec" : ""}" style="width:${Math.max(4, x.total / maxTotal * 100)}%"></div></div><strong>${fmtSEK(x.total)}</strong>`),
    row("Reservpool", x => `${x.pool} st`),
    row("MLDT", x => `${fmtNum(x.mldtH, 1)} h`),
    row("Ao", x => fmtPct(x.ao)),
    row("Logistikflöde", (x, k) => flowText[k]),
    row("Kompetens", (x, k) => compText[k]),
    row("Verktyg & miljö", (x, k) => toolText[k])
  ].join("");

  // Känslighetsanalys
  const sens = $("sensitivityBody");
  if (!show) {
    sens.innerHTML = "<p class='def'>Känslighetsanalysen visas efter ditt beslut.</p>";
  } else {
    const s = sensitivity(node);
    sens.innerHTML = (s.lines.length
      ? `<p>Rekommendationen <strong>${STRATEGY_SHORT[s.base]}</strong> ändras om:</p><ul>${s.lines.map(l => `<li>${l.label}</li>`).join("")}</ul><details class="sensitivity-explain"><summary>Hur räknas brytpunkten fram?</summary><p>Modellen ändrar en indata i taget och räknar om total kostnad för varje tillgängligt alternativ. Brytpunkten är det ungefärliga värde där alternativet med lägst beräknad total kostnad ändras från <strong>${STRATEGY_SHORT[s.base]}</strong> till ett annat alternativ.</p><p>För MTBF betyder ett högre värde färre förväntade fel under analysperioden. Modellen räknar om reparations-/inköpskostnad, reservpool och modellerad stilleståndskostnad utifrån de antaganden som visas i analysen. Värdet är alltså inte en universell gräns.</p><p><strong>Så kan du kontrollera:</strong> ändra MTBF i RAMS-indata och se hur rekommendationen och kostnadsposterna förändras. Resultatet gäller bara dessa indata och denna förenklade modell.</p></details>`
      : `<p>Rekommendationen <strong>${STRATEGY_SHORT[s.base]}</strong> är stabil inom det intervall som modellen undersökt för MTBF, flottstorlek och enhetspris.</p><details class="sensitivity-explain"><summary>Hur kontrolleras det?</summary><p>Modellen varierar en indata i taget och räknar om total kostnad för tillgängliga alternativ. Ingen brytpunkt hittades inom det undersökta intervallet; det betyder inte att rekommendationen aldrig kan ändras.</p></details>`) + `<button class="header-btn dark sensitivity-review-btn" id="missionReviewSensitivity" type="button">${missionState.sensitivityReviewed ? "Känslighetsanalys granskad ✓" : "Granska analysen och markera klar"}</button>`;
  }
}

function buildReason(an, decision) {
  const r = an.result;
  const rec = an.recommended;
  const others = STRATEGIES.filter(k => k !== rec && r[k].available).sort((a, b) => r[a].total - r[b].total);
  const parts = [];
  parts.push(`${STRATEGY_NAME[rec]} ger lägst total kostnad över ${A.years} år (${fmtSEK(r[rec].total)}).`);
  if (others.length) {
    const o = others[0];
    const diff = (r[o].total - r[rec].total) / r[rec].total * 100;
    parts.push(`Näst bäst är ${STRATEGY_SHORT[o]}, ${fmtNum(diff, 0)} % dyrare.`);
  }
  if (an.w.complexity === "high") parts.push("Hög komplexitet utesluter reparation på I-level.");
  if (an.w.berPct >= 40) parts.push(`${an.w.berPct} % av enheterna går inte att reparera ekonomiskt, vilket gynnar kassering.`);
  if (decision) {
    if (decision === rec) parts.push("Ditt val stämmer med rekommendationen.");
    else {
      const extra = r[decision].total - r[rec].total;
      parts.push(`Ditt val (${STRATEGY_SHORT[decision]}) kostar ${fmtSEK(extra)} mer än rekommendationen. Det kan ändå vara rätt om du har krav som modellen inte fångar, och då bör det stå i dina anteckningar.`);
    }
  }
  return parts.join(" ");
}

function renderSupport(an) {
  const node = an.node;
  const decision = decisions[node.id];
  const grid = $("supportGrid");
  if (!decision) {
    $("supportNote").textContent = "";
    grid.innerHTML = `<div class="support-placeholder">Fatta ditt LORA-beslut (steg 3) för att generera Product Support Package.</div>`;
    return;
  }
  const r = an.result[decision];
  const s = node.support;
  const level = Math.min(3, s.training.level + TRAINING_OFFSET[decision]);
  $("supportNote").textContent = `Genererat för beslutet: ${STRATEGY_NAME[decision]}`;

  const poolKind = decision === "DISCARD" ? "förbrukningslager (ersätts med nyinköp)" : "rotables-pool (repareras och återanvänds)";
  const equipment = [s.tools + " (byte på O-level)"];
  if (decision === "I") equipment.push(`Testutrustning på I-level, investering ${fmtSEK(an.w.testI)}`);
  if (decision === "D") equipment.push(`${an.w.complexity === "high" ? "Renrum/avancerad test" : "Depåverktyg + diagnostik"} på depå, investering ${fmtSEK(an.w.testD)}`);

  const pubs = publicationsFor(node, decision);

  grid.innerHTML = `
    <div class="support-card">
      <h3><span class="icon" aria-hidden="true">📦</span> Spares (Reservdelar)</h3>
      <div class="detail">P/N: ${s.pn} – ${s.spareDesc}</div>
      <div class="detail">Reservpool: <strong>${r.pool} st</strong> som ${poolKind}</div>
      <div class="why">Varför? Förväntat antal enheter i pipeline under ${fmtNum(r.tatDays, 0)} dygn är λ = ${fmtNum(r.lambda, 2)}. Poissonfördelningen ger en pool på ${r.pool} st vid ${an.w.serviceLevel} % servicegrad. Flottan har ${A.fleetSize} system × ${node.qty} st = ${A.fleetSize * node.qty} enheter, MTBF ${fmtNum(an.w.mtbf, 0)} h.</div>
    </div>
    <div class="support-card">
      <h3><span class="icon" aria-hidden="true">🔧</span> Support Equipment</h3>
      ${equipment.map(e => `<div class="detail">${e}</div>`).join("")}
      <div class="why">Varför? Verktygskraven styrs av var arbetet utförs och av komponentens komplexitet. Fel verktyg ger längre MTTR eller skador.</div>
    </div>
    <div class="support-card">
      <h3><span class="icon" aria-hidden="true">📄</span> Technical Publication</h3>
      ${pubs.map(p => `<div class="detail mono">${p.code}<br><span class="sub">${p.label}</span></div>`).join("")}
      <div class="why">Varför? S1000D-datamodulens kod bygger på SNS (här ${node.sns.system}-${node.sns.sub}${node.sns.subsub}-${node.sns.assy}, fiktiv), inte på LCN (${node.lcn}). Ett byte kräver både Remove och Install, och reparation har egna moduler. Exempelkoderna ska kontrolleras mot projektets BREX.</div>
    </div>
    <div class="support-card">
      <h3><span class="icon" aria-hidden="true">🎓</span> Training</h3>
      <div class="detail">Kurs: ${s.training.course} nivå ${level}</div>
      <div class="detail">Omfattning: ${TRAINING_NOTE[decision]}</div>
      <div class="why">Varför? Personalen måste vara utbildad för den valda underhållsnivån. Reparation kräver högre nivå än rent byte, och fel kompetensnivå ökar risken för följdfel.</div>
    </div>
  `;
}

/* ===== Sammanfattning ===== */
function summaryRows() {
  return components.map(node => {
    const an = analyze(node);
    const dec = decisions[node.id];
    const chosen = dec ? an.result[dec] : null;
    return {
      node, an, dec,
      rec: an.recommended,
      chosen,
      deviation: dec ? an.result[dec].total - an.result[an.recommended].total : null
    };
  });
}

function renderSummary() {
  const rows = summaryRows();
  let sumChosen = 0, sumRec = 0, decided = 0;
  $("summaryBody").innerHTML = rows.map(r => {
    const recR = r.an.result[r.rec];
    if (r.dec) { sumChosen += r.chosen.total; sumRec += recR.total; decided++; }
    const dev = r.dec === null || r.dec === undefined
      ? "<span class='na'>Ej beslutat</span>"
      : (r.dec === r.rec ? "<span class='ok'>✓ Samma</span>" : `<span class='warn'>Avviker: +${fmtSEK(r.deviation)}</span>`);
    return `<tr>
      <td><strong>${r.node.lcn}</strong> ${r.node.name}</td>
      <td>${fmtNum(r.an.w.mtbf, 0)} h</td>
      <td>${fmtNum(r.an.w.mttr, 0)} min</td>
      <td>${fmtPct(r.an.ai)}</td>
      <td>${r.dec ? STRATEGY_SHORT[r.dec] : "–"}</td>
      <td>${STRATEGY_SHORT[r.rec]}</td>
      <td>${r.dec ? fmtPct(r.chosen.ao) : "–"}</td>
      <td>${r.dec ? fmtSEK(r.chosen.total) : "–"}</td>
      <td>${dev}</td>
    </tr>`;
  }).join("");
  $("summaryFoot").innerHTML = decided
    ? `<strong>${decided} av ${rows.length} komponenter beslutade.</strong> Total kostnad för dina val: ${fmtSEK(sumChosen)}. Samma komponenter med rekommenderade val: ${fmtSEK(sumRec)}. Skillnad: ${fmtSEK(sumChosen - sumRec)}.<p class="method-note">Modellresultat, inte verifierad prognos. Testutrustning räknas som engångskostnad per analyserad komponent; se metodnoterna för övriga antaganden.</p>`
    : "Inga beslut har fattats än. Välj en komponent i trädet och fatta ett LORA-beslut.";
}

function exportCsv() {
  const head = ["LCN", "Komponent", "MTBF (h)", "MTTR (min)", "Ai (%)", "Ditt val", "Rekommendation", "Ao (%)", "Livscykelkostnad (kr)", "Stilleståndskostnad (kr)", "Total kostnad (kr)", "Avvikelse (kr)", "Flotta", "Drifttimmar/system/år", "Analysperiod (år)", "Stilleståndsvärde (kr/h)", "TAT I (dygn)", "TAT D (dygn)", "Ledtid ny enhet (dygn)", "Transport (kr)"];
  const csvCell = value => { const str = String(value ?? ""); return /[;"\n\r]/.test(str) ? '"' + str.replace(/"/g, '""') + '"' : str; };
  const lines = [head.map(csvCell).join(";")];
  summaryRows().forEach(r => {
    lines.push([
      r.node.lcn, r.node.name, Math.round(r.an.w.mtbf), Math.round(r.an.w.mttr),
      (r.an.ai * 100).toFixed(2),
      r.dec ? STRATEGY_SHORT[r.dec] : "",
      STRATEGY_SHORT[r.rec],
      r.dec ? (r.chosen.ao * 100).toFixed(2) : "",
      r.dec ? Math.round(r.chosen.lifecycle) : "",
      r.dec ? Math.round(r.chosen.downtime) : "",
      r.dec ? Math.round(r.chosen.total) : "",
      r.dec ? Math.round(r.deviation) : "",
      A.fleetSize, A.hoursPerYear, A.years, A.downtimeCostPerH, A.tatI, A.tatD, A.leadTime, A.transport
    ].map(csvCell).join(";"));
  });
  const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ils-lora-sammanfattning.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ===== Händelser ===== */
document.querySelectorAll("[data-w]").forEach(el => {
  const update = () => {
    if (!selected) return;
    const w = getWorking(selected), k = el.dataset.w;
    if (el.tagName === "SELECT") {
      w[k] = el.value;
      if (k === "complexity" && w.complexity === "high" && decisions[selected.id] === "I") delete decisions[selected.id];
    } else {
      const rule = INPUT_RULES[k] || { min: el.min !== "" ? Number(el.min) : 0, max: el.max !== "" ? Number(el.max) : 1e9 };
      w[k] = boundedNumber(el.value, rule);
      if (selected.id === MISSION_MOTOR_ID && k === "mttr" && missionState.prediction && Math.abs(w[k] - Number(missionState.mttrBaseline ?? selected.rams.mttr)) > 0.01) missionState.mttrChanged = true;
      if (el.type !== "range") el.value = w[k];
    }
    saveState(); renderAll();
  };
  el.addEventListener(el.type === "range" ? "input" : "change", update);
});

document.querySelectorAll("[data-a]").forEach(el => {
  el.addEventListener("change", () => {
    const k = el.dataset.a, rule = ASSUMPTION_RULES[k] || { min: 0, max: 1e9 };
    A[k] = boundedNumber(el.value, rule); el.value = A[k]; saveState(); renderAll();
  });
});

document.querySelectorAll(".decision-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    if (!selected || btn.disabled) return;
    decisions[selected.id] = btn.dataset.decision;
    saveState();
    renderAll();
  });
});

$("analystNotes").addEventListener("input", e => {
  if (!selected) return;
  notes[selected.id] = e.target.value;
  saveState();
  renderMissions();
});

$("lcnInfoBtn").addEventListener("click", () => {
  const box = $("lcnInfoBox");
  box.hidden = !box.hidden;
  $("lcnInfoBtn").setAttribute("aria-expanded", String(!box.hidden));
});

$("guideMode").addEventListener("change", e => {
  guideMode = e.target.checked;
  document.body.classList.toggle("guide-off", !guideMode);
  renderAll();
});

$("summaryBtn").addEventListener("click", () => {
  if (view === "summary") showView(selected ? "analysis" : "empty");
  else { showView("summary"); missionState.summaryOpened = true; saveState(); }
  renderAll();
});

$("exportCsv").addEventListener("click", exportCsv);

$("resetBtn").addEventListener("click", () => {
  if (!confirm("Nollställa alla ändringar, beslut och anteckningar?")) return;
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignorera */ }
  A = { ...DEFAULT_ASSUMPTIONS };
  [working, decisions, notes].forEach(o => Object.keys(o).forEach(k => delete o[k]));
  Object.assign(missionState, MISSION_STORAGE_DEFAULTS);
  missionState.mttrBaseline = null;
  syncInputs();
  if ($("analystNotes")) $("analystNotes").value = "";
  saveState();
  renderAll();
});

/* ===== Lärandeuppdrag ===== */
function missionOneChecks() {
  const motor = components.find(c => c.id === MISSION_MOTOR_ID);
  const note = (notes[MISSION_MOTOR_ID] || "").trim();
  const motorDecision = decisions[MISSION_MOTOR_ID];
  const an = motor ? analyze(motor) : null;
  return [
    { done: selected?.id === MISSION_MOTOR_ID, title: "Välj Elmotor", learn: "Börja med en avgränsad komponent så att du kan koppla indata till konsekvenser.", action: "Välj Elmotor i LCN-trädet." },
    { done: missionState.prediction !== "" && missionState.mttrChanged, title: "Förutsäg och ändra MTTR", learn: "Ai bygger på reparations-/återställningstid i den här förenklade modellen. Ao påverkas dessutom av logistisk fördröjning, så effekten behöver inte bli lika stor.", action: "Välj förutsägelse nedan och ändra sedan MTTR-reglaget i analysen." },
    { done: Boolean(motorDecision), title: "Fatta ett LORA-beslut", learn: "Ett beslut väger kostnad och logistik mot var reparation kan utföras. Modellens rekommendation är ett jämförelseunderlag, inte ett universellt facit.", action: "Välj kassera, I-level eller D-level." },
    { done: note.length >= 20, title: "Motivera beslutet", learn: "En spårbar analys behöver visa vilka antaganden och avvägningar som ligger bakom valet.", action: "Skriv minst 20 tecken i Analyst Notes för Elmotor." },
    { done: missionState.sensitivityReviewed, title: "Undersök vad som kan ändra beslutet", learn: "Känslighetsanalys visar vilka indata som kan flytta modellens rekommendation – och var beslutet är känsligt.", action: "Granska känslighetsanalysen och markera den som granskad." }
  ];
}

function missionTwoChecks() {
  const dComponents = components.filter(c => analyze(c).recommended === "D");
  const dWithExplanation = dComponents.some(c => (notes[c.id] || "").trim().length >= 20);
  return [
    { done: missionState.componentsVisited.filter(id => decisions[id]).length >= 3, title: "Fatta beslut för tre komponenter", learn: "Olika MTBF, komplexitet, reparationskostnader och kritikalitet kan ge olika utfall.", action: "Välj minst tre komponenter och fatta beslut för var och en." },
    { done: dComponents.length > 0 && dComponents.some(c => decisions[c.id] === "D"), title: "Hitta en komponent där du väljer D-level", learn: "D-level kan vara motiverat när reparationsmöjligheter, kompetens och ekonomi talar för depåreparation.", action: dComponents.length ? `Välj D-level för en komponent där modellen rekommenderar D-level (${dComponents.map(c => c.name).join(", ")}).` : "Med nuvarande antaganden finns ingen D-level-rekommendation. Ändra scenarioantaganden eller återkom senare.", unavailable: dComponents.length === 0 },
    { done: dWithExplanation, title: "Förklara varför i Analyst Notes", learn: "Ett beslut blir begripligt när du kopplar det till konkreta data och redovisar vad modellen inte fångar.", action: "Skriv minst 20 tecken i anteckningarna för en D-level-rekommenderad komponent." },
    { done: missionState.summaryOpened, title: "Öppna sammanfattningen", learn: "Sammanfattningen hjälper dig att jämföra konsekvenserna mellan komponenter i stället för att bedöma varje beslut isolerat.", action: "Öppna Sammanfattning i sidhuvudet." }
  ];
}

function renderLoraMiniGuide() {
  const step = Number(missionState.loraGuideStep || 0);
  const answers = missionState.loraGuideAnswers || {};
  const questions = [
    { title: "1. Jämför kostnaden per reparation", prompt: "I-level kostar 900 kr per reparation och D-level 700 kr. Hur mycket billigare är D-level per reparation?", options: ["100 kr billigare", "200 kr billigare", "200 kr dyrare"], correct: 1, explain: "900 − 700 = 200 kr. D-level sparar alltså 200 kr varje gång enheten repareras där i stället för på I-level." },
    { title: "2. Jämför investeringarna", prompt: "Testutrustning kostar 40 000 kr på I-level och 120 000 kr på D-level. Hur mycket större är D-level-investeringen?", options: ["40 000 kr", "80 000 kr", "160 000 kr"], correct: 1, explain: "120 000 − 40 000 = 80 000 kr i extra investering för D-level." },
    { title: "3. Hitta den förenklade brytpunkten", prompt: "D-level sparar 200 kr per reparation men kräver 80 000 kr extra i utrustning. Ungefär hur många reparationer behövs för att besparingen ska motsvara investeringen?", options: ["40 reparationer", "400 reparationer", "4 000 reparationer"], correct: 1, explain: "80 000 ÷ 200 = 400 reparationer. Det är en förenklad brytpunkt: den tar inte med exempelvis diskontering, BER-effekt, transport, väntetid eller andra kostnader." },
    { title: "4. Jämför med att kassera", prompt: "En ny enhet kostar 4 200 kr. Om den gamla enheten går att reparera, vad är billigast sett enbart till den direkta kostnaden per enhet?", options: ["Kassera och köpa ny: 4 200 kr", "I-level-reparation: 900 kr", "D-level-reparation: 700 kr"], correct: 2, explain: "I de angivna direkta kostnaderna är D-level-reparation billigast (700 kr), därefter I-level (900 kr) och sist ny enhet (4 200 kr). Men detta är inte hela beslutet: enheten kanske inte går att reparera, BER kan gälla och väntetid, transport, utrustning och tillförlitlighet kan ändra jämförelsen." },
    { title: "5. När är Kassera rimligt?", prompt: "Vilket fall talar starkast för att kassera enheten i stället för att reparera den?", options: ["D-level kostar 200 kr mindre per reparation", "Enheten bedöms inte vara ekonomiskt reparerbar eller kan inte repareras tekniskt", "Det finns testutrustning på depån"], correct: 1, explain: "Kassera kan vara rimligt om enheten inte går att reparera tekniskt eller om reparationen bedöms olönsam enligt de antaganden som används. BER betyder Beyond Economic Repair. Det är ett bedömningsunderlag, inte en automatisk regel om att en viss andel alltid ska kasseras." }
  ];
  if (step >= questions.length) return `<div class="mission-current-learn"><strong>Vad betyder det för beslutet?</strong><p>Du har jämfört direkta reparationskostnader, investeringar, en förenklad brytpunkt och kostnaden för en ny enhet. Jämför nu kalkylen med förväntad reparationsvolym och väg in teknisk reparerbarhet, BER, väntetid, kompetens, transport och operativa krav.</p><p><strong>Nästa steg:</strong> välj Kassera, I-level eller D-level i analysen och jämför ditt val med modellens rekommendation. Modellen är ett jämförelseunderlag, inte ett automatiskt facit.</p></div>`;
  const q = questions[step];
  const answered = answers[step] !== undefined;
  const correct = answered && Number(answers[step]) === q.correct;
  return `<section class="lora-mini-guide"><p class="eyebrow">LORA-GUIDE · DEL ${step + 1} AV ${questions.length}</p><h4>${q.title}</h4><p>${q.prompt}</p><div class="lora-mini-options">${q.options.map((opt,i)=>`<button type="button" class="lora-mini-option ${answered && i === Number(answers[step]) ? (correct ? "is-correct" : "is-wrong") : ""}" data-lora-answer="${i}" ${answered ? "disabled" : ""}>${opt}</button>`).join("")}</div>${answered ? `<div class="mission-current-learn"><strong>${correct ? "Rätt resonemang" : "Så kan du tänka"}</strong><p>${q.explain}</p></div><button type="button" class="header-btn dark" data-lora-next>${step < questions.length - 1 ? "Nästa del →" : "Visa slutsats →"}</button>` : `<p class="mission-feedback">Välj det svar du tycker stämmer. Du får se resonemanget efteråt.</p>`}</section>`;
}

function renderMissionSteps(containerId, checks) {
  const container = $(containerId);
  if (!container) return;
  const isMissionTwo = containerId === "missionTwoSteps";
  const reviewed = isMissionTwo ? missionState.reviewedMissionTwoSteps : missionState.reviewedMissionOneSteps;
  const reviewIndex = checks.findIndex((step, i) => step.done && !step.unavailable && !reviewed.includes(i));
  const activeIndex = checks.findIndex((step, i) => !step.done && !step.unavailable);
  const active = activeIndex >= 0 ? checks[activeIndex] : null;
  const completed = checks.map((step, i) => ({...step, i})).filter(step => step.done && step.title !== "Välj Elmotor");
  const compactDone = completed.map(step => `<div class="mission-step is-done mission-step-compact"><span class="mission-check" aria-hidden="true">✓</span><div><strong>${step.title}</strong><span>Klart</span></div></div>`).join("");
  const isMttrTask = active?.title === "Förutsäg och ändra MTTR";
  const mttrDone = isMttrTask && missionState.prediction !== "" && missionState.mttrChanged;
  let mainCard = "";
  if (reviewIndex >= 0) {
    const justDone = checks[reviewIndex];
    const nextExists = checks.some((step, i) => !step.done && !step.unavailable && i > reviewIndex);
    const nextLabel = nextExists ? "Nästa uppgift →" : (isMissionTwo ? "Avsluta uppdrag →" : "Uppdraget klart →");
    mainCard = `<section class="mission-current-step mission-review-step"><p class="eyebrow">UPPGIFT KLAR · STEG ${reviewIndex + 1}</p><h3>${justDone.title}</h3><div class="mission-current-learn"><strong>Varför spelar det roll?</strong><p>${justDone.learn}</p></div><button class="header-btn dark mission-next-step" data-review-mission="${isMissionTwo ? "two" : "one"}" data-review-index="${reviewIndex}" type="button">${nextLabel}</button></section>`;
  } else if (active) {
    mainCard = `<section class="mission-current-step"><p class="eyebrow">AKTUELL UPPGIFT · STEG ${activeIndex + 1}</p><h3>${active.title}</h3><p class="mission-current-action">${active.action}</p>${active.title === "Fatta ett LORA-beslut" ? renderLoraMiniGuide() : (!isMttrTask || mttrDone ? `<div class="mission-current-learn"><strong>Tips</strong> ${active.learn}</div>` : "")}</section>`;
  } else {
    mainCard = `<section class="mission-current-step is-finished"><h3>Uppdraget klart</h3><p>Du har genomfört alla steg. Jämför dina beslut med modellens resultat och antaganden. Du kan fortsätta experimentera fritt eller starta nästa uppdrag.</p>${!isMissionTwo ? `<button class="header-btn dark" id="startMissionTwo" type="button">Starta uppdrag 2 →</button>` : ""}</section>`;
  }
  container.innerHTML = compactDone + mainCard;
  container.dataset.activeStep = reviewIndex >= 0 ? `review-${reviewIndex + 1}` : (activeIndex >= 0 ? String(activeIndex + 1) : "done");
}

function renderMissions() {
  const panel = $("missionPanel");
  if (!panel) return;
  panel.hidden = !guideMode;
  $("freeExploreNote").hidden = guideMode;
  const rail = $("missionRail");
  rail.classList.toggle("is-rail-collapsed", missionState.railCollapsed && guideMode);
  $("missionRailToggle").textContent = missionState.railCollapsed ? "Visa panel" : "Dölj panel";
  $("missionRailToggle").setAttribute("aria-expanded", String(!missionState.railCollapsed));
  panel.classList.toggle("is-collapsed", missionState.collapsed);
  $("missionBody").hidden = missionState.collapsed;
  $("missionCollapse").textContent = missionState.collapsed ? "Visa uppdrag" : "Fäll ihop";
  $("missionCollapse").setAttribute("aria-expanded", String(!missionState.collapsed));
  const intro = $("missionIntro");
  const one = missionOneChecks();
  const oneDone = one.filter(x => x.done).length;
  const oneComplete = oneDone === one.length;
  $("missionProgress").textContent = missionState.missionTwoStarted ? `${missionTwoChecks().filter(x => x.done).length} av ${missionTwoChecks().length}` : `${oneDone} av ${one.length}`;
  $("missionSteps").setAttribute("aria-label", "Steg i uppdrag 1");
  $("missionSteps").hidden = missionState.missionTwoStarted;
  renderMissionSteps("missionSteps", one);
  if (intro) intro.hidden = missionState.missionTwoStarted || selected?.id !== MISSION_MOTOR_ID || $("missionSteps").dataset.activeStep !== "1";
  const predictionBox = $("predictionBox");
  const currentStep = $("missionSteps").querySelector(".mission-current-step");
  // Keep the prediction widget outside the element whose innerHTML is rebuilt on each render.
  // This preserves the select and its selected value when the user chooses an answer.
  const missionBody = $("missionBody");
  if (predictionBox.parentElement !== missionBody) missionBody.appendChild(predictionBox);
  const predictionStep = $("missionSteps").dataset.activeStep;
  const showPrediction = selected?.id === MISSION_MOTOR_ID &&
    !missionState.missionTwoStarted &&
    (predictionStep === "2" || predictionStep === "review-2");
  predictionBox.hidden = !showPrediction;
  const predictionLabel = predictionBox.querySelector("label");
  if (predictionLabel) predictionLabel.innerHTML = "<strong>Förutsägelse:</strong> vad tror du händer när MTTR sänks?";
  $("missionComplete").hidden = !oneComplete || missionState.missionTwoStarted;
  $("missionTwo").hidden = !missionState.missionTwoStarted;
  $("missionTitle").textContent = missionState.missionTwoStarted ? "Uppdrag 2 · Utforska LORA" : (oneComplete ? "Uppdrag 1 · Klart" : "Uppdrag 1 · Förstå sambanden");
  $("predictionSelect").value = missionState.prediction;
  const changed = missionState.mttrChanged;
  const feedback = $("predictionFeedback");
  if (!missionState.prediction) { feedback.textContent = "Välj en förutsägelse innan du ändrar MTTR."; feedback.className = "mission-feedback"; }
  else if (!changed) { feedback.textContent = "Bra – nu ändrar du MTTR och jämför med resultatet."; feedback.className = "mission-feedback"; }
  else {
    const predictionText = { both: "Du förutsåg att Ai och Ao skulle förbättras ungefär lika mycket.", ai: "Du förutsåg att Ai skulle förbättras tydligare än Ao.", neither: "Du förutsåg att ingen av indikatorerna skulle påverkas nämnvärt." }[missionState.prediction];
    feedback.textContent = `${predictionText} Jämför värdena som visas nu. I modellen påverkas Ai direkt av MTTR, medan Ao även innehåller MLDT/logistikfördröjning.`;
    feedback.className = "mission-feedback has-result";
  }
if (oneComplete) {
    const two = missionTwoChecks();
    const twoDone = two.filter(x => x.done).length;
    $("missionTwoProgress").textContent = `${twoDone} av ${two.length}`;
    renderMissionSteps("missionTwoSteps", two);
const allDone = two.every(x => x.done);
    $("missionFinish").hidden = !allDone;
    if (allDone) renderMissionFinish();
  } else {
    $("missionFinish").hidden = true;
  }
} 

function renderMissionFinish() {
  const rows = summaryRows().filter(r => r.dec);
  const same = rows.filter(r => r.dec === r.rec).length;
  const notesCount = Object.values(notes).filter(n => String(n || "").trim()).length;
  const deviations = rows.filter(r => r.dec !== r.rec).map(r => `<li><strong>${r.node.name}:</strong> ditt val ${STRATEGY_SHORT[r.dec]}, modell ${STRATEGY_SHORT[r.rec]} (skillnad ${fmtSEK(r.deviation)}).</li>`).join("");
  $("missionFinishBody").innerHTML = `<p>Du har fattat beslut för <strong>${rows.length}</strong> komponenter. <strong>${same}</strong> följer modellens rekommendation${same === 1 ? "" : "er"}; <strong>${rows.length - same}</strong> avviker. Du har skrivit anteckningar för ${notesCount} komponenter.</p>` + (deviations ? `<h3>Beslut som avviker från modellen</h3><ul>${deviations}</ul>` : `<p>Alla beslutade komponenter följer modellens rekommendation. Det är fortfarande viktigt att kontrollera antaganden och operativa begränsningar.</p>`) + `<p class="method-note">Resultatet är en övningssammanfattning, inte ett facit eller en verifierad LORA.</p>`;
}

$("predictionSelect").addEventListener("change", e => {
  missionState.prediction = e.target.value;
  if (missionState.prediction && selected?.id === MISSION_MOTOR_ID) {
    const currentMttr = getWorking(selected).mttr;
    if (missionState.mttrBaseline == null) missionState.mttrBaseline = currentMttr;
    missionState.mttrChanged = Math.abs(currentMttr - Number(missionState.mttrBaseline)) > 0.01;
  }
  saveState();
  renderMissions();
});
document.addEventListener("click", e => {
  const loraAnswer = e.target.closest("[data-lora-answer]");
  if (loraAnswer) {
    missionState.loraGuideAnswers = missionState.loraGuideAnswers || {};
    const guideStep = Number(missionState.loraGuideStep || 0);
    if (missionState.loraGuideAnswers[guideStep] === undefined) {
      missionState.loraGuideAnswers[guideStep] = Number(loraAnswer.dataset.loraAnswer);
      saveState();
      renderMissions();
    }
    return;
  }
  if (e.target.closest("[data-lora-next]")) {
    missionState.loraGuideStep = Math.min(5, Number(missionState.loraGuideStep || 0) + 1);
    saveState();
    renderMissions();
    return;
  }
  const nextStep = e.target.closest("[data-review-mission]");
  if (nextStep) {
    const list = nextStep.dataset.reviewMission === "two" ? missionState.reviewedMissionTwoSteps : missionState.reviewedMissionOneSteps;
    const idx = Number(nextStep.dataset.reviewIndex);
    if (!list.includes(idx)) list.push(idx);
    saveState();
    renderMissions();
    return;
  }
  if (e.target.closest("#startMissionTwo")) {
    missionState.missionTwoStarted = true;
    missionState.collapsed = false;
    saveState();
    renderMissions();
  }
});
$("missionRailToggle").addEventListener("click", () => {
  missionState.railCollapsed = !missionState.railCollapsed; saveState(); renderMissions();
});
$("finishExportCsv").addEventListener("click", exportCsv);
$("missionCollapse").addEventListener("click", () => {
  missionState.collapsed = !missionState.collapsed; saveState(); renderMissions();
});
$("missionReset").addEventListener("click", () => {
  Object.assign(missionState, MISSION_STORAGE_DEFAULTS);
  missionState.mttrBaseline = selected?.id === MISSION_MOTOR_ID ? getWorking(selected).mttr : null;
  saveState(); renderMissions();
});
document.addEventListener("click", e => {
  if (e.target.closest("#missionReviewSensitivity")) { missionState.sensitivityReviewed = true; saveState(); renderAll(); }
});

/* ===== Init ===== */
loadState();
renderTree(systemData, lcnTreeEl);
syncInputs();
showView("empty");
renderMissions();


// Minimal begreppsordlista: öppnas endast när användaren ber om den.
(() => {
  const dialog = document.getElementById("termsDialog");
  const open = document.getElementById("termsBtn");
  const closeButtons = ["closeTerms", "closeTermsTop"].map(id => document.getElementById(id)).filter(Boolean);
  if (open && dialog) open.addEventListener("click", () => dialog.showModal());
  closeButtons.forEach(btn => btn.addEventListener("click", () => dialog.close()));
  if (dialog) dialog.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
  });
})();
