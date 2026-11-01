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

/* Faixa fisiológica plausível para leituras de FC vindas do cinto Bluetooth. */
var HR_MIN_VALID = 30, HR_MAX_VALID = 240;
var HR_MAX_DELTA_BPM = 25,
    HR_SPIKE_WINDOW_MS = 5000,
    HR_CONFIRM_WINDOW_MS = 6000,
    HR_MIN_CONFIRMATIONS = 3,
    HR_CONFIRM_TOLERANCE_BPM = 15,
    HR_STAGE_WINDOW_MS = 15000,
    HR_STALE_MS = 6000;

function isPlausibleHr(bpm) {
  return typeof bpm === 'number' && Number.isFinite(bpm) && bpm >= HR_MIN_VALID && bpm <= HR_MAX_VALID;
}

/* Avalia uma amostra individual de FC contra contato com a pele, faixa humana (30-240 bpm)
   e salto fisiológico instantâneo (spike > 25 bpm em <= 5s), confirmando transições reais
   quando sustentadas por 3 leituras consecutivas em até 6s (feature 007). */
function evaluateHrSample(sample, recentValidSamples, pendingSpikes, options) {
  const opts = options || {};
  const maxDeltaBpm = opts.maxDeltaBpm != null ? opts.maxDeltaBpm : HR_MAX_DELTA_BPM;
  const spikeWindowMs = opts.spikeWindowMs != null ? opts.spikeWindowMs : HR_SPIKE_WINDOW_MS;
  const confirmWindowMs = opts.confirmWindowMs != null ? opts.confirmWindowMs : HR_CONFIRM_WINDOW_MS;
  const minConfirmations = opts.minConfirmations != null ? opts.minConfirmations : HR_MIN_CONFIRMATIONS;
  const confirmToleranceBpm = opts.confirmToleranceBpm != null ? opts.confirmToleranceBpm : HR_CONFIRM_TOLERANCE_BPM;
  const spikes = Array.isArray(pendingSpikes) ? pendingSpikes : [];

  if (!sample || sample.contactDetected === false) {
    return {
      accepted: false,
      reason: 'no-contact',
      bpm: sample && sample.bpm != null ? sample.bpm : null,
      nextPendingSpikes: spikes
    };
  }
  if (!isPlausibleHr(sample.bpm)) {
    return {
      accepted: false,
      reason: 'out-of-range',
      bpm: sample.bpm != null ? sample.bpm : null,
      nextPendingSpikes: spikes
    };
  }

  const ts = typeof sample.timestamp === 'number' ? sample.timestamp : Date.now();
  const valids = Array.isArray(recentValidSamples) ? recentValidSamples : [];
  const lastValid = valids.length > 0 ? valids[valids.length - 1] : null;

  if (
    lastValid &&
    isPlausibleHr(lastValid.bpm) &&
    typeof lastValid.timestamp === 'number' &&
    (ts - lastValid.timestamp) >= 0 &&
    (ts - lastValid.timestamp) <= spikeWindowMs
  ) {
    const delta = Math.abs(sample.bpm - lastValid.bpm);
    if (delta > maxDeltaBpm) {
      const matchingSpikes = spikes.filter(
        p => p && typeof p.timestamp === 'number' &&
             (ts - p.timestamp) >= 0 &&
             (ts - p.timestamp) <= confirmWindowMs &&
             Math.abs(sample.bpm - p.bpm) <= confirmToleranceBpm
      );
      if (matchingSpikes.length + 1 >= minConfirmations) {
        return {
          accepted: true,
          reason: 'confirmed-transition',
          bpm: sample.bpm,
          nextPendingSpikes: []
        };
      }
      return {
        accepted: false,
        reason: 'spike',
        bpm: sample.bpm,
        nextPendingSpikes: matchingSpikes.concat([{ bpm: sample.bpm, timestamp: ts }])
      };
    }
  }

  return {
    accepted: true,
    reason: 'ok',
    bpm: sample.bpm,
    nextPendingSpikes: []
  };
}

/* Calcula a FC consolidada para fechamento de estágio (janela padrão de 15s)
   usando média aparada (count >= 5), mediana (count 3-4) ou média recente (count 1-2). */
function computeStableStageHr(validSamples, nowMs, options) {
  const opts = options || {};
  const windowMs = opts.windowMs != null ? opts.windowMs : HR_STAGE_WINDOW_MS;
  const staleMs = opts.staleMs != null ? opts.staleMs : HR_STALE_MS;
  const now = typeof nowMs === 'number' ? nowMs : Date.now();
  const list = Array.isArray(validSamples) ? validSamples : [];

  const plausible = list.filter(
    s => s && isPlausibleHr(s.bpm) && typeof s.timestamp === 'number' && s.timestamp <= now
  );
  if (plausible.length === 0) {
    return { bpm: null, sampleCount: 0, method: 'none', spreadBpm: null };
  }

  let latestTs = -Infinity;
  for (let i = 0; i < plausible.length; i++) {
    if (plausible[i].timestamp > latestTs) latestTs = plausible[i].timestamp;
  }
  if ((now - latestTs) > staleMs) {
    return { bpm: null, sampleCount: 0, method: 'stale', spreadBpm: null };
  }

  const inWin = plausible.filter(s => (now - s.timestamp) <= windowMs);
  const count = inWin.length;
  if (count === 0) {
    return { bpm: null, sampleCount: 0, method: 'none', spreadBpm: null };
  }

  const sorted = inWin.map(s => s.bpm).sort((a, b) => a - b);
  const spreadBpm = sorted[count - 1] - sorted[0];

  if (count >= 5) {
    const k = Math.max(1, Math.floor(count * 0.2));
    const core = sorted.slice(k, count - k);
    const avg = core.reduce((acc, v) => acc + v, 0) / core.length;
    return { bpm: Math.round(avg), sampleCount: count, method: 'trimmed-mean', spreadBpm };
  }
  if (count === 3 || count === 4) {
    const mid = count === 3 ? sorted[1] : (sorted[1] + sorted[2]) / 2;
    return { bpm: Math.round(mid), sampleCount: count, method: 'median', spreadBpm };
  }
  const avg = sorted.reduce((acc, v) => acc + v, 0) / count;
  return { bpm: Math.round(avg), sampleCount: count, method: 'recent-mean', spreadBpm };
}

/* Classifica de forma determinística a qualidade/fidedignidade atual do sinal Bluetooth. */
function assessBtSignalQuality(ctx, nowMs, options) {
  const opts = options || {};
  const staleMs = opts.staleMs != null ? opts.staleMs : HR_STALE_MS;
  const now = typeof nowMs === 'number' ? nowMs : Date.now();
  const c = ctx || {};
  const status = c.status || 'disconnected';
  const validSamples = Array.isArray(c.validSamples) ? c.validSamples : [];

  const stageRes = computeStableStageHr(validSamples, now, { windowMs: HR_STAGE_WINDOW_MS, staleMs });
  const recentRes = computeStableStageHr(validSamples, now, { windowMs: 4000, staleMs });
  const displayBpm = recentRes.bpm != null ? recentRes.bpm : stageRes.bpm;

  if (status === 'disconnected') {
    if (c.lastDisconnectReason === 'unsupported-device') {
      return {
        quality: 'unsupported-device',
        label: 'Aparelho sem sensor de FC · selecione o cinto',
        reliable: false,
        displayBpm: null,
        stageBpm: null
      };
    }
    return { quality: 'disconnected', label: 'Cinto desconectado', reliable: false, displayBpm: null, stageBpm: null };
  }
  if (status === 'connecting') {
    return { quality: 'connecting', label: 'Conectando…', reliable: false, displayBpm: null, stageBpm: null };
  }
  if (status === 'reconnecting') {
    const maxAtt = c.maxReconnectAttempts || 3;
    const att = c.autoReconnectAttempts ? ` (${c.autoReconnectAttempts}/${maxAtt})` : '';
    return {
      quality: 'reconnecting',
      label: `Reconectando ao cinto${att}…`,
      reliable: false,
      displayBpm,
      stageBpm: stageRes.bpm
    };
  }
  if (status === 'lost') {
    return { quality: 'lost', label: 'Sinal perdido · digite FC', reliable: false, displayBpm: null, stageBpm: null };
  }

  /* status === 'connected' */
  if (c.lastContactDetected === false) {
    return {
      quality: 'no-contact',
      label: 'Ajuste o cinto (mau contato)',
      reliable: false,
      displayBpm,
      stageBpm: null
    };
  }
  if (stageRes.bpm == null) {
    return {
      quality: 'stale',
      label: 'Aguardando batimentos…',
      reliable: false,
      displayBpm: null,
      stageBpm: null
    };
  }
  if (c.recentSpikeCount && c.recentSpikeCount > 0) {
    return {
      quality: 'noisy',
      label: 'Filtro ativo · sinal oscilando',
      reliable: true,
      displayBpm,
      stageBpm: stageRes.bpm
    };
  }
  return {
    quality: 'stable',
    label: 'Sinal fidedigno',
    reliable: true,
    displayBpm,
    stageBpm: stageRes.bpm
  };
}

/* Decodifica a característica Bluetooth SIG "Heart Rate Measurement" (0x2A37).
   Byte 0 = flags; bit0: FC em UINT16; bits1-2: contato com a pele;
   bit3: energia gasta (UINT16); bit4: intervalos RR (UINT16, 1/1024 s). */
function parseHeartRateMeasurement(dv) {
  const empty = { bpm: null, contactDetected: null, energyExpended: null, rrIntervals: [] };
  if (!dv || typeof dv.getUint8 !== 'function' || dv.byteLength < 2) return empty;
  const flags = dv.getUint8(0);
  let offset = 1, bpm;
  if (flags & 0x01) {
    if (dv.byteLength < 3) return empty;
    bpm = dv.getUint16(1, true); offset = 3;
  } else {
    bpm = dv.getUint8(1); offset = 2;
  }
  const contactSupported = (flags & 0x04) !== 0;
  const contactDetected = contactSupported ? (flags & 0x02) !== 0 : null;
  let energyExpended = null;
  if (flags & 0x08) {
    if (dv.byteLength >= offset + 2) energyExpended = dv.getUint16(offset, true);
    offset += 2;
  }
  const rrIntervals = [];
  if (flags & 0x10) {
    for (; offset + 1 < dv.byteLength; offset += 2) {
      rrIntervals.push(Math.round(dv.getUint16(offset, true) * 1000 / 1024));
    }
  }
  return { bpm, contactDetected, energyExpended, rrIntervals };
}

/* Calcula a velocidade de pico (vPico / vVO2max) considerando exclusivamente os
   estágios completos de 2 minutos (feature 008). Se o teste for interrompido durante
   um estágio em curso, o estágio atual incompleto é descartado e considera-se a
   velocidade do último estágio concluído (anterior). */
function computeVPeak(startV, completedStages) {
  const sv = +startV || 0;
  const stages = Array.isArray(completedStages) ? completedStages : [];
  if (stages.length > 0) {
    const last = stages[stages.length - 1];
    const v = (last && typeof last.v === 'number' && Number.isFinite(last.v))
      ? last.v
      : (sv + stages.length - 1);
    return {
      vPeak: +v.toFixed(2),
      completedStagesCount: stages.length,
      usedPreviousStage: true,
      fallbackToStart: false
    };
  }
  return {
    vPeak: +sv.toFixed(2),
    completedStagesCount: 0,
    usedPreviousStage: false,
    fallbackToStart: true
  };
}

/* Compara duas avaliações de um mesmo atleta (baseAssessment = anterior,
   currentAssessment = atual) calculando deltas absolutos, percentuais e
   pareamento de FC/RPE por velocidade km/h (feature 008). */
function compareAssessments(baseAssessment, currentAssessment) {
  if (!baseAssessment || !currentAssessment) return null;
  function metricDelta(bRaw, cRaw) {
    const b = (bRaw === '' || bRaw == null || Number.isNaN(+bRaw)) ? null : +bRaw;
    const c = (cRaw === '' || cRaw == null || Number.isNaN(+cRaw)) ? null : +cRaw;
    if (b == null || c == null) return { base: b, curr: c, delta: null, pct: null };
    const delta = +(c - b).toFixed(2);
    const pct = b !== 0 ? +(((c - b) / Math.abs(b)) * 100).toFixed(1) : null;
    return { base: b, curr: c, delta, pct };
  }
  const bt = baseAssessment.test || {};
  const ct = currentAssessment.test || {};
  const metrics = {
    vPeak: metricDelta(bt.vPeak, ct.vPeak),
    vo2max: metricDelta(bt.vo2max, ct.vo2max),
    mets: metricDelta(bt.mets, ct.mets),
    vt1V: metricDelta(bt.vt1V, ct.vt1V),
    vt2V: metricDelta(bt.vt2V, ct.vt2V),
    fcVT1: metricDelta(bt.fcVT1, ct.fcVT1),
    fcVT2: metricDelta(bt.fcVT2, ct.fcVT2),
    tteSec: metricDelta(baseAssessment.tte && baseAssessment.tte.sec, currentAssessment.tte && currentAssessment.tte.sec),
    weight: metricDelta(baseAssessment.profileSnapshot && baseAssessment.profileSnapshot.weight, currentAssessment.profileSnapshot && currentAssessment.profileSnapshot.weight),
    restHr: metricDelta(baseAssessment.screen && baseAssessment.screen.fc, currentAssessment.screen && currentAssessment.screen.fc)
  };

  const bStages = Array.isArray(bt.stages) ? bt.stages : [];
  const cStages = Array.isArray(ct.stages) ? ct.stages : [];
  const velSet = new Set();
  bStages.forEach(s => { if (s && Number.isFinite(+s.v)) velSet.add(+(+s.v).toFixed(1)); });
  cStages.forEach(s => { if (s && Number.isFinite(+s.v)) velSet.add(+(+s.v).toFixed(1)); });
  const sortedVels = Array.from(velSet).sort((a, b) => a - b);

  const stageComparison = sortedVels.map(v => {
    const bSt = bStages.find(s => s && +(+s.v).toFixed(1) === v);
    const cSt = cStages.find(s => s && +(+s.v).toFixed(1) === v);
    const baseHr = (bSt && bSt.hr != null && bSt.hr !== '' && !Number.isNaN(+bSt.hr)) ? +bSt.hr : null;
    const currHr = (cSt && cSt.hr != null && cSt.hr !== '' && !Number.isNaN(+cSt.hr)) ? +cSt.hr : null;
    const deltaHr = (baseHr != null && currHr != null) ? +(currHr - baseHr).toFixed(1) : null;
    const baseRpe = (bSt && bSt.rpe != null && bSt.rpe !== '' && !Number.isNaN(+bSt.rpe)) ? +bSt.rpe : null;
    const currRpe = (cSt && cSt.rpe != null && cSt.rpe !== '' && !Number.isNaN(+cSt.rpe)) ? +cSt.rpe : null;
    const deltaRpe = (baseRpe != null && currRpe != null) ? +(currRpe - baseRpe).toFixed(1) : null;
    return { v, baseHr, currHr, deltaHr, baseRpe, currRpe, deltaRpe };
  });

  return {
    baseId: baseAssessment.id || null,
    currId: currentAssessment.id || null,
    baseDate: baseAssessment.dateFormatted || bt.date || '',
    currDate: currentAssessment.dateFormatted || ct.date || '',
    metrics,
    stageComparison
  };
}

/* Gera código de acesso único e amigável (ex.: "JULIANA-742") e PIN padrão de 4 dígitos
   a partir do nome do aluno (feature 009). */
function generateStudentAccessCode(studentName, saltSeed) {
  const clean = String(studentName || 'ALUNO')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, ' ')
    .trim()
    .split(/\s+/)[0] || 'ALUNO';
  const prefix = clean.slice(0, 10);
  const num = saltSeed != null && Number.isFinite(+saltSeed)
    ? Math.abs(Math.floor(+saltSeed)) % 1000
    : Math.floor(100 + Math.random() * 900);
  const numStr = String(num).padStart(3, '0');
  const code = `${prefix}-${numStr}`;
  const defaultPin = String(1000 + (num % 9000)).slice(0, 4);
  return { code, pin: defaultPin };
}

/* Gera deterministicamente 6 fichas de treino detalhadas para esteira
   a partir dos limiares fisiológicos de uma avaliação (feature 009). */
function generateWorkoutPrescriptions(assessment) {
  if (!assessment) return [];
  const bt = assessment.test || assessment;
  const vPeak = +(bt.vPeak || assessment.vPeak || 0);
  if (!vPeak || Number.isNaN(vPeak) || vPeak <= 0) return [];

  const hrMax = +(bt.hrMax || assessment.hrMax || (assessment.profileSnapshot && assessment.profileSnapshot.hrMax) || 180);
  const restHr = +(assessment.restHr || (assessment.screen && assessment.screen.fc) || 60);
  const vt1V = +(bt.vt1V || assessment.vt1V || (vPeak * 0.70).toFixed(1));
  const vt2V = +(bt.vt2V || assessment.vt2V || (vPeak * 0.85).toFixed(1));
  const fcVT1 = +(bt.fcVT1 || assessment.fcVT1 || Math.round(restHr + 0.65 * (hrMax - restHr)));
  const fcVT2 = +(bt.fcVT2 || assessment.fcVT2 || Math.round(restHr + 0.85 * (hrMax - restHr)));

  // 1. Z1 - Regenerativo
  const z1Speed = +(vPeak * 0.60).toFixed(1);
  const z1HrMin = Math.round(hrMax * 0.55);
  const z1HrMax = Math.round(hrMax * 0.70);
  const cardZ1 = {
    id: 'rec-z1',
    category: 'regenerativo',
    title: 'Treino Regenerativo / Soltura',
    targetZone: 'Z1',
    colorTheme: 'blue',
    goalDescription: 'Recuperação ativa muscular, circulação periférica e alívio do estresse residual.',
    mainSpeedKmh: z1Speed,
    mainPaceStr: pace(z1Speed),
    mainHrMin: z1HrMin,
    mainHrMax: z1HrMax,
    mainHrRangeStr: `${z1HrMin} – ${z1HrMax} bpm (< 70% FCmáx)`,
    rpeDescription: 'Muito leve e sem esforço perceptível (Borg 1–2)',
    talkTest: 'Fala fácil e contínua, sem qualquer falta de ar',
    totalDurationMin: 30,
    steps: [
      { phase: 'warmup', label: 'Aquecimento', durationStr: '5 min', speedKmh: Math.max(4.0, +(z1Speed - 1.5).toFixed(1)), paceStr: pace(Math.max(4.0, z1Speed - 1.5)), instruction: 'Caminhada rápida para lubrificação articular' },
      { phase: 'main', label: 'Trote Regenerativo', durationStr: '20 min', speedKmh: z1Speed, paceStr: pace(z1Speed), instruction: `Mantenha a esteira em ${z1Speed} km/h de forma contínua e suave` },
      { phase: 'cooldown', label: 'Volta à Calma', durationStr: '5 min', speedKmh: 4.5, paceStr: pace(4.5), instruction: 'Caminhada lenta para desaceleração cardíaca' }
    ]
  };

  // 2. Z2 - Base Aeróbia Contínua
  const z2Speed = +(Math.min(vt1V - 0.2, vPeak * 0.72)).toFixed(1);
  const z2HrMin = Math.round(hrMax * 0.70);
  const z2HrMax = Math.round(fcVT1 || (hrMax * 0.80));
  const cardZ2 = {
    id: 'base-z2',
    category: 'continuo',
    title: 'Rodagem de Base Aeróbia',
    targetZone: 'Z2',
    colorTheme: 'green',
    goalDescription: 'Desenvolvimento mitocondrial, eficiência no uso de gorduras como combustível e base para provas longas.',
    mainSpeedKmh: z2Speed,
    mainPaceStr: pace(z2Speed),
    mainHrMin: z2HrMin,
    mainHrMax: z2HrMax,
    mainHrRangeStr: `${z2HrMin} – ${z2HrMax} bpm (70%–80% FCmáx)`,
    rpeDescription: 'Leve a moderado, ritmo conversacional confortável (Borg 3–4)',
    talkTest: 'Consegue conversar em frases completas confortavelmente',
    totalDurationMin: 45,
    steps: [
      { phase: 'warmup', label: 'Aquecimento Gradual', durationStr: '8 min', speedKmh: Math.max(5.0, +(z2Speed - 1.5).toFixed(1)), paceStr: pace(Math.max(5.0, z2Speed - 1.5)), instruction: 'Progressão suave até a velocidade de cruzeiro' },
      { phase: 'main', label: 'Rodagem Contínua', durationStr: '32 min', speedKmh: z2Speed, paceStr: pace(z2Speed), instruction: `Corrida contínua e constante a ${z2Speed} km/h na esteira` },
      { phase: 'cooldown', label: 'Desaquecimento', durationStr: '5 min', speedKmh: 5.0, paceStr: pace(5.0), instruction: 'Caminhada para recuperação e estabilização da FC' }
    ]
  };

  // 3. Z3 - Tempo Run / Limiar Anaeróbio
  const z3Speed = +(Math.max(vt1V + 0.3, Math.min(vt2V, vPeak * 0.83))).toFixed(1);
  const z3HrMin = Math.round(fcVT1 || (hrMax * 0.80));
  const z3HrMax = Math.round(fcVT2 || (hrMax * 0.88));
  const cardZ3 = {
    id: 'tempo-z3',
    category: 'tempo',
    title: 'Tempo Run / Treino de Limiar',
    targetZone: 'Z3',
    colorTheme: 'amber',
    goalDescription: 'Aumento da tolerância e taxa de remoção de lactato, sustentando ritmos competitivos de 10k a 21k.',
    mainSpeedKmh: z3Speed,
    mainPaceStr: pace(z3Speed),
    mainHrMin: z3HrMin,
    mainHrMax: z3HrMax,
    mainHrRangeStr: `${z3HrMin} – ${z3HrMax} bpm (80%–88% FCmáx)`,
    rpeDescription: 'Confortavelmente duro, exige foco mental constante (Borg 5–6)',
    talkTest: 'Consegue falar apenas frases curtas de 3 a 5 palavras',
    totalDurationMin: 40,
    steps: [
      { phase: 'warmup', label: 'Aquecimento Z1/Z2', durationStr: '10 min', speedKmh: +(z2Speed).toFixed(1), paceStr: pace(z2Speed), instruction: 'Trote progressivo preparando a musculatura e ventilação' },
      { phase: 'main', label: 'Bloco de Limiar Constante', durationStr: '25 min', speedKmh: z3Speed, paceStr: pace(z3Speed), instruction: `Ajuste a esteira para ${z3Speed} km/h e sustente a cadência sem oscilar` },
      { phase: 'cooldown', label: 'Volta à Calma', durationStr: '5 min', speedKmh: 5.0, paceStr: pace(5.0), instruction: 'Caminhada e trote leve para retorno à homeostase' }
    ]
  };

  // 4. Z4 - Intervalado Longo VO2máx
  const z4Speed = +(vPeak * 0.96).toFixed(1);
  const z4RecSpeed = +(Math.max(4.5, vPeak * 0.55)).toFixed(1);
  const z4HrMin = Math.round(hrMax * 0.90);
  const z4HrMax = hrMax;
  const cardZ4 = {
    id: 'hiit-vo2-z4',
    category: 'intervalado',
    title: 'Intervalado Longo VO₂máx (4x 3 min)',
    targetZone: 'Z4',
    colorTheme: 'orange',
    goalDescription: 'Expansão do teto aeróbio (VO₂máx), débito cardíaco máximo e tempo no consumo máximo de O₂.',
    mainSpeedKmh: z4Speed,
    recoverySpeedKmh: z4RecSpeed,
    mainPaceStr: pace(z4Speed),
    recoveryPaceStr: pace(z4RecSpeed),
    mainHrMin: z4HrMin,
    mainHrMax: z4HrMax,
    mainHrRangeStr: `${z4HrMin} – ${z4HrMax} bpm (90%–98% FCmáx)`,
    rpeDescription: 'Muito intenso e ofegante no final de cada tiro (Borg 7–8)',
    talkTest: 'Quase incapaz de falar durante o tiro, respiração profunda',
    totalDurationMin: 35,
    steps: [
      { phase: 'warmup', label: 'Aquecimento Progressivo', durationStr: '10 min', speedKmh: z2Speed, paceStr: pace(z2Speed), instruction: 'Trote moderado com 2 acelerações curtas de 20s' },
      { phase: 'main', label: 'Série de Tiros: 4x (3 min Tiro / 2 min Trote)', durationStr: '20 min', speedKmh: z4Speed, paceStr: pace(z4Speed), instruction: `4 tiros de 3 minutos a ${z4Speed} km/h, intercalados por 2 minutos de trote leve a ${z4RecSpeed} km/h` },
      { phase: 'cooldown', label: 'Desaquecimento', durationStr: '5 min', speedKmh: 4.8, paceStr: pace(4.8), instruction: 'Caminhada para normalização da ventilação e FC' }
    ]
  };

  // 5. Z4/Z5 - HIIT Curto na Esteira
  const shortSpeed = +(vPeak * 1.02).toFixed(1);
  const shortRecSpeed = +(Math.max(4.0, vPeak * 0.50)).toFixed(1);
  const shortHrMin = Math.round(hrMax * 0.88);
  const cardShort = {
    id: 'hiit-short',
    category: 'intervalado',
    title: 'HIIT Curto na Esteira (10x 1 min / 1 min)',
    targetZone: 'Z4/Z5',
    colorTheme: 'rose',
    goalDescription: 'Potência aeróbia máxima e rápida cinética de VO₂ com menor sobrecarga central que tiros longos.',
    mainSpeedKmh: shortSpeed,
    recoverySpeedKmh: shortRecSpeed,
    mainPaceStr: pace(shortSpeed),
    recoveryPaceStr: pace(shortRecSpeed),
    mainHrMin: shortHrMin,
    mainHrMax: hrMax,
    mainHrRangeStr: `${shortHrMin} – ${hrMax} bpm (Pico > 90% FCmáx)`,
    rpeDescription: 'Vigoroso, velocidade rápida e dinâmica de passadas (Borg 8–9)',
    talkTest: 'Falar é extremamente difícil ou inviável durante o tiro',
    totalDurationMin: 35,
    steps: [
      { phase: 'warmup', label: 'Aquecimento Dinâmico', durationStr: '10 min', speedKmh: z2Speed, paceStr: pace(z2Speed), instruction: 'Trote e passadas progressivas' },
      { phase: 'main', label: 'Série 10x (1 min Tiro a vPico / 1 min Trote)', durationStr: '20 min', speedKmh: shortSpeed, paceStr: pace(shortSpeed), instruction: `10 repetições de 1 min a ${shortSpeed} km/h com 1 min de trote/caminhada a ${shortRecSpeed} km/h` },
      { phase: 'cooldown', label: 'Volta à Calma', durationStr: '5 min', speedKmh: 4.5, paceStr: pace(4.5), instruction: 'Caminhada suave na esteira' }
    ]
  };

  // 6. Z5 - Tiros de Economia de Corrida
  const speedSpeed = +(vPeak * 1.08).toFixed(1);
  const speedRecSpeed = +(Math.max(4.0, vPeak * 0.45)).toFixed(1);
  const cardSpeed = {
    id: 'speed-z5',
    category: 'intervalado',
    title: 'Tiros Curtos de Economia & Cadência (6x 45s)',
    targetZone: 'Z5',
    colorTheme: 'rose',
    goalDescription: 'Recrutamento de fibras musculares rápidas, rigidez do complexo tendíneo e economia de corrida.',
    mainSpeedKmh: speedSpeed,
    recoverySpeedKmh: speedRecSpeed,
    mainPaceStr: pace(speedSpeed),
    recoveryPaceStr: pace(speedRecSpeed),
    mainHrMin: Math.round(hrMax * 0.85),
    mainHrMax: hrMax,
    mainHrRangeStr: 'Esforço neuromuscular máximo (não guiado por FC)',
    rpeDescription: 'Esforço de velocidade máxima controlada com técnica impecável (Borg 9–10)',
    talkTest: 'Sem falar durante os tiros de 45 segundos',
    totalDurationMin: 30,
    steps: [
      { phase: 'warmup', label: 'Aquecimento Extensivo', durationStr: '12 min', speedKmh: z2Speed, paceStr: pace(z2Speed), instruction: 'Trote suave + educativos de corrida e 3 acelerações curtas' },
      { phase: 'main', label: 'Série 6x 45s com 2 min Pausa Completa', durationStr: '15 min', speedKmh: speedSpeed, paceStr: pace(speedSpeed), instruction: `6 tiros de 45s a ${speedSpeed} km/h com 2 minutos de recuperação em caminhada muito lenta a ${speedRecSpeed} km/h ou apoio lateral` },
      { phase: 'cooldown', label: 'Desaquecimento Suave', durationStr: '5 min', speedKmh: 4.2, paceStr: pace(4.2), instruction: 'Caminhada lenta para relaxamento muscular' }
    ]
  };

  return [cardZ1, cardZ2, cardZ3, cardZ4, cardShort, cardSpeed];
}

/**
 * Higieniza e valida o formato de telefone/WhatsApp brasileiro.
 * @param {string} phoneStr
 * @returns {{ valid: boolean, sanitized: string, formatted: string, error?: string }}
 */
function validatePhone(phoneStr) {
  const digits = String(phoneStr || '').replace(/\D/g, '');
  if (!digits) {
    return { valid: false, sanitized: '', formatted: '', error: 'Telefone ou WhatsApp é obrigatório' };
  }
  if (digits.length < 10 || digits.length > 11) {
    return { valid: false, sanitized: digits, formatted: digits, error: 'Telefone deve conter DDD + 8 ou 9 dígitos' };
  }
  const ddd = parseInt(digits.slice(0, 2), 10);
  if (ddd < 11 || ddd > 99) {
    return { valid: false, sanitized: digits, formatted: digits, error: 'DDD inválido' };
  }
  let formatted = digits;
  if (digits.length === 11) {
    formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  } else {
    formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return { valid: true, sanitized: digits, formatted };
}

/**
 * Gera um PIN ou Código de Ativação alfanumérico em formato amigável.
 * Exemplo: "RL-784920"
 * @param {string|number} [seedString]
 * @param {number} [length=6]
 * @returns {string}
 */
function generateActivationPin(seedString, length = 6) {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let hashNum = 0;
  if (seedString !== undefined && seedString !== null) {
    const str = String(seedString);
    for (let i = 0; i < str.length; i++) {
      hashNum = ((hashNum << 5) - hashNum + str.charCodeAt(i)) >>> 0;
    }
  }
  let result = '';
  for (let i = 0; i < length; i++) {
    const idx = seedString !== undefined && seedString !== null
      ? ((hashNum + i * 31) >>> 0) % chars.length
      : Math.floor(Math.random() * chars.length);
    result += chars[idx];
  }
  return `RL-${result}`;
}

/**
 * Avalia se um registro de professor tem permissão de login.
 * @param {object} professorRecord
 * @returns {{ allowed: boolean, reason: 'active'|'pending_approval'|'blocked'|'invalid_record', messagePtBr: string }}
 */
function evaluateProfessorAccess(professorRecord) {
  if (!professorRecord || typeof professorRecord !== 'object') {
    return {
      allowed: false,
      reason: 'invalid_record',
      messagePtBr: 'Registro de conta inválido ou não encontrado.'
    };
  }
  const status = professorRecord.status || 'ativo';
  if (status === 'ativo') {
    return {
      allowed: true,
      reason: 'active',
      messagePtBr: 'Acesso liberado.'
    };
  }
  if (status === 'pendente') {
    return {
      allowed: false,
      reason: 'pending_approval',
      messagePtBr: 'Sua solicitação de cadastro está em análise pelo administrador. Entre em contato para liberação.'
    };
  }
  if (status === 'bloqueado') {
    return {
      allowed: false,
      reason: 'blocked',
      messagePtBr: 'Sua conta de professor está desativada ou suspensa. Fale com a administração.'
    };
  }
  return {
    allowed: false,
    reason: 'invalid_record',
    messagePtBr: 'Status de conta não reconhecido.'
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    vo2At, pace, getAvg, diagnoseVO2, deriveVTs, computeHrMax, computeZones, tteClass,
    classifySpo2, classifyGlicose, parseHeartRateMeasurement, isPlausibleHr,
    evaluateHrSample, computeStableStageHr, assessBtSignalQuality,
    computeVPeak, compareAssessments,
    generateStudentAccessCode, generateWorkoutPrescriptions,
    validatePhone, generateActivationPin, evaluateProfessorAccess
  };
}
