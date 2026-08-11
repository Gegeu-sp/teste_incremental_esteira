/* RunLab — fórmulas fisiológicas puras, compartilhadas entre index.html
   (carregado como <script> global) e os testes em Node (via require()).
   Nenhuma dependência de DOM ou de estado global do app. */

var MET_PTS = [[4, 10.5], [5, 14], [6, 17.5], [7, 21], [8, 28], [9, 31.5], [10, 35], [11, 38.5]];

function vo2At(v) {
  if (v <= MET_PTS[0][0]) return Math.max(3.5, MET_PTS[0][1] - 3.5 * (MET_PTS[0][0] - v));
  for (let i = 0; i < MET_PTS.length - 1; i++) {
    const [x1, y1] = MET_PTS[i], [x2, y2] = MET_PTS[i + 1];
    if (v >= x1 && v <= x2) return y1 + (y2 - y1) * (v - x1) / (x2 - x1);
  }
  return 38.5 + 3.5 * (v - 11);
}

function pace(v) {
  if (v <= 0) return '—';
  const p = 60 / v;
  const m = Math.floor(p);
  const s = Math.round((p - m) * 60);
  return m + "'" + String(s).padStart(2, '0') + '"';
}

var AVG = { m: [[30, 44], [40, 42], [50, 40], [60, 37], [200, 33]], f: [[30, 37], [40, 35], [50, 34], [60, 31], [200, 27]] };

function getAvg(age, sex) {
  const t = AVG[sex === 'f' ? 'f' : 'm'];
  for (const [lim, v] of t) if (age < lim) return v;
  return t[t.length - 1][1];
}

function diagnoseVO2(vo2, age, sex) {
  const avg = getAvg(age, sex);
  const pct = (vo2 - avg) / avg * 100;
  let cls, style;
  if (pct >= 50) { cls = 'EXCELENTE'; style = 'text-lime border-lime/50 bg-lime/10'; }
  else if (pct >= 30) { cls = 'BOM'; style = 'text-emerald-300 border-emerald-400/50 bg-emerald-400/10'; }
  else if (pct >= -10) { cls = 'REGULAR'; style = 'text-sky-300 border-sky-400/50 bg-sky-400/10'; }
  else if (pct >= -20) { cls = 'REGULAR INFERIOR'; style = 'text-amber-300 border-amber-400/50 bg-amber-400/10'; }
  else { cls = 'RUIM'; style = 'text-rose-300 border-rose-400/50 bg-rose-400/10'; }
  return { avg, pct, cls, style };
}

function deriveVTs(stages, startV, vPeak) {
  let vt1V = null, vt2V = null, fcVT1 = null, fcVT2 = null;
  for (let i = stages.length - 1; i >= 0; i--) {
    if (stages[i].tt === 0) { vt1V = startV + i; if (stages[i].hr) fcVT1 = stages[i].hr; break; }
  }
  const f2 = stages.findIndex(s => s.tt === 2);
  if (f2 >= 0) { vt2V = startV + f2; fcVT2 = stages[f2].hr || null; }
  else {
    const f1 = stages.findIndex(s => s.tt === 1);
    if (f1 >= 0) { vt2V = Math.min(vPeak, startV + f1 + 1); fcVT2 = stages[f1]?.hr || null; }
  }
  if (vt1V != null) vt1V = Math.min(vt1V, vPeak);
  if (vt2V != null) vt2V = Math.min(vt2V, vPeak);
  return { vt1V, vt2V, fcVT1, fcVT2 };
}

function computeHrMax(hrMaxInput, age) {
  const h = +hrMaxInput;
  return (h >= 100 && h <= 230) ? h : Math.round(208 - 0.7 * (+age || 30));
}

function computeZones(t, hrm) {
  const vVT1 = t.vt1V != null ? +t.vt1V : +(t.vPeak * 0.78).toFixed(1);
  const vVT2 = t.vt2V != null ? +t.vt2V : +(t.vPeak * 0.90).toFixed(1);
  let fcVT1 = t.fcVT1 || Math.round(hrm * 0.78);
  let fcVT2 = t.fcVT2 || Math.round(hrm * 0.90);
  fcVT1 = Math.min(fcVT1, fcVT2 - 3);
  fcVT2 = Math.min(fcVT2, hrm - 3);
  const r1 = Math.round(fcVT1 * 0.90);
  const ranges = [
    { fc: `< ${r1}`, vMin: 3.5, vMax: +(vVT1 * 0.85).toFixed(1) },
    { fc: `${r1} – ${fcVT1}`, vMin: +(vVT1 * 0.85).toFixed(1), vMax: vVT1 },
    { fc: `${fcVT1} – ${fcVT2}`, vMin: vVT1, vMax: vVT2 },
    { fc: `${fcVT2} – ${Math.round(fcVT2 * 1.03)}`, vMin: vVT2, vMax: t.vPeak },
    { fc: `> ${Math.round(fcVT2 * 1.03)}`, vMin: t.vPeak, vMax: +(t.vPeak * 1.10).toFixed(1) }
  ];
  return { hrm, fcVT1, fcVT2, vVT1, vVT2, ranges };
}

function tteClass(sec) {
  if (sec < 210) return ['Abaixo do esperado', 'text-rose-300'];
  if (sec < 300) return ['Regular', 'text-amber-300'];
  if (sec < 420) return ['Bom (≈ média da literatura)', 'text-sky-300'];
  if (sec < 540) return ['Muito bom', 'text-lime'];
  return ['Excelente', 'text-lime'];
}

/* Limites conservadores de prescrição de exercício (referência ACSM):
   SpO2 < 90% e glicose fora de 70–300 mg/dL entram como fator de ressalva
   ou contraindicação no parecer da Triagem (Princípio III da constitution). */
function classifySpo2(pct) {
  const v = +pct;
  if (pct === '' || pct == null || Number.isNaN(v)) return { level: 'sem-dado', label: 'Não registrada' };
  if (v < 90) return { level: 'contraindicado', label: 'SpO₂ < 90% — risco de hipoxemia, contraindica o teste' };
  if (v < 95) return { level: 'ressalva', label: 'SpO₂ 90–94% — abaixo do ideal, liberar com ressalvas' };
  return { level: 'normal', label: 'SpO₂ normal' };
}

function classifyGlicose(mgdl) {
  const v = +mgdl;
  if (mgdl === '' || mgdl == null || Number.isNaN(v)) return { level: 'sem-dado', label: 'Não registrada' };
  if (v < 70) return { level: 'ressalva', label: 'Hipoglicemia — oriente ingestão de carboidrato antes do esforço' };
  if (v > 300) return { level: 'ressalva', label: 'Hiperglicemia — avalie sintomas antes de esforço vigoroso' };
  return { level: 'normal', label: 'Glicose normal' };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { vo2At, pace, getAvg, diagnoseVO2, deriveVTs, computeHrMax, computeZones, tteClass, classifySpo2, classifyGlicose };
}
