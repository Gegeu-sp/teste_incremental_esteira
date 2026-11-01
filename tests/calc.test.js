const test = require('node:test');
const assert = require('node:assert/strict');
const {
  vo2At, pace, getAvg, diagnoseVO2, deriveVTs, computeHrMax, computeZones, tteClass,
  classifySpo2, classifyGlicose, parseHeartRateMeasurement, isPlausibleHr,
  evaluateHrSample, computeStableStageHr, assessBtSignalQuality,
  computeVPeak, compareAssessments,
  generateStudentAccessCode, generateWorkoutPrescriptions,
  validatePhone, generateActivationPin, evaluateProfessorAccess
} = require('../assets/calc.js');

test('vo2At reproduz a tabela do protocolo (velocidade → VO2)', () => {
  assert.equal(vo2At(4), 10.5);
  assert.equal(vo2At(5), 14);
  assert.equal(vo2At(6), 17.5);
  assert.equal(vo2At(7), 21);
  assert.equal(vo2At(8), 28);
  assert.equal(vo2At(9), 31.5);
  assert.equal(vo2At(10), 35);
  assert.equal(vo2At(11), 38.5);
});

test('vo2At interpola entre pontos conhecidos da tabela', () => {
  assert.equal(vo2At(4.5), 12.25); // meio do caminho entre 10.5 e 14
  assert.equal(vo2At(11.5), 40.25); // acima do topo: extrapolação linear (+3.5/km/h)
});

test('pace converte km/h em min:seg por km', () => {
  assert.equal(pace(6), "10'00\"");
  assert.equal(pace(12), "5'00\"");
  assert.equal(pace(0), '—');
});

test('getAvg retorna a média de referência por idade/sexo', () => {
  assert.equal(getAvg(25, 'm'), 44);
  assert.equal(getAvg(35, 'm'), 42);
  assert.equal(getAvg(65, 'm'), 33);
  assert.equal(getAvg(25, 'f'), 37);
  assert.equal(getAvg(65, 'f'), 27);
});

test('diagnoseVO2 classifica nos limites exatos das faixas', () => {
  const avg = getAvg(30, 'm'); // 44
  assert.equal(diagnoseVO2(avg * 1.5, 30, 'm').cls, 'EXCELENTE'); // +50%
  assert.equal(diagnoseVO2(avg * 1.3, 30, 'm').cls, 'BOM'); // +30%
  assert.equal(diagnoseVO2(avg * 0.9, 30, 'm').cls, 'REGULAR'); // -10%
  assert.equal(diagnoseVO2(avg * 0.8, 30, 'm').cls, 'REGULAR INFERIOR'); // -20%
  assert.equal(diagnoseVO2(avg * 0.79, 30, 'm').cls, 'RUIM'); // < -20%
});

test('deriveVTs identifica VT1 e RCP/VT2 quando o Talk Test "não fala" ocorre', () => {
  const stages = [
    { v: 6, hr: 120, tt: 0 },
    { v: 7, hr: 140, tt: 0 },
    { v: 8, hr: 160, tt: 1 },
    { v: 9, hr: 175, tt: 2 }
  ];
  const vt = deriveVTs(stages, 6, 9);
  assert.equal(vt.vt1V, 7); // último estágio com tt===0 → startV(6)+i(1)
  assert.equal(vt.fcVT1, 140);
  assert.equal(vt.vt2V, 9); // primeiro estágio com tt===2 → startV(6)+i(3)
  assert.equal(vt.fcVT2, 175);
});

test('deriveVTs usa fallback (tt===1 + 1km/h) quando não há tt===2', () => {
  const stages = [
    { v: 6, hr: 120, tt: 0 },
    { v: 7, hr: 145, tt: 1 }
  ];
  const vt = deriveVTs(stages, 6, 8);
  assert.equal(vt.vt2V, 8); // startV(6)+f1(1)+1, limitado a vPeak(8)
  assert.equal(vt.fcVT2, 145);
});

test('deriveVTs retorna null quando nenhum Talk Test foi marcado', () => {
  const stages = [{ v: 6, hr: 120, tt: null }, { v: 7, hr: 140, tt: null }];
  const vt = deriveVTs(stages, 6, 7);
  assert.equal(vt.vt1V, null);
  assert.equal(vt.vt2V, null);
});

test('computeHrMax usa FC máxima medida quando válida (100-230)', () => {
  assert.equal(computeHrMax(190, 30), 190);
});

test('computeHrMax cai para 208 - 0.7*idade quando não informada/ inválida', () => {
  assert.equal(computeHrMax('', 30), Math.round(208 - 0.7 * 30));
  assert.equal(computeHrMax(50, 30), Math.round(208 - 0.7 * 30)); // fora do range 100-230
});

test('computeZones gera 5 faixas crescentes de FC e velocidade (Z1→Z5)', () => {
  const t = { vPeak: 10, vt1V: 7, vt2V: 9, fcVT1: null, fcVT2: null };
  const z = computeZones(t, 190);
  assert.equal(z.ranges.length, 5);
  for (let i = 1; i < z.ranges.length; i++) {
    assert.ok(z.ranges[i].vMax >= z.ranges[i - 1].vMax, `zona ${i} deve ter vMax >= zona anterior`);
  }
  assert.equal(z.vVT1, 7);
  assert.equal(z.vVT2, 9);
});

test('tteClass respeita os limites de 210/300/420/540s', () => {
  assert.equal(tteClass(209)[0], 'Abaixo do esperado');
  assert.equal(tteClass(210)[0], 'Regular');
  assert.equal(tteClass(300)[0], 'Bom (≈ média da literatura)');
  assert.equal(tteClass(420)[0], 'Muito bom');
  assert.equal(tteClass(540)[0], 'Excelente');
});

test('classifySpo2 respeita os limites de 90/95%', () => {
  assert.equal(classifySpo2(89).level, 'contraindicado');
  assert.equal(classifySpo2(90).level, 'ressalva');
  assert.equal(classifySpo2(94).level, 'ressalva');
  assert.equal(classifySpo2(95).level, 'normal');
});

test('classifySpo2 trata ausência de dado sem quebrar', () => {
  assert.equal(classifySpo2('').level, 'sem-dado');
  assert.equal(classifySpo2(undefined).level, 'sem-dado');
});

test('classifyGlicose respeita os limites de 70/300 mg/dL', () => {
  assert.equal(classifyGlicose(69).level, 'ressalva');
  assert.equal(classifyGlicose(70).level, 'normal');
  assert.equal(classifyGlicose(300).level, 'normal');
  assert.equal(classifyGlicose(301).level, 'ressalva');
});

test('classifyGlicose é opcional: ausência de dado não quebra', () => {
  assert.equal(classifyGlicose('').level, 'sem-dado');
});

const dv = (bytes) => new DataView(new Uint8Array(bytes).buffer);

test('parseHeartRateMeasurement: UINT8', () => {
  const r = parseHeartRateMeasurement(dv([0x00, 72]));
  assert.equal(r.bpm, 72);
  assert.equal(r.contactDetected, null);
  assert.deepEqual(r.rrIntervals, []);
});

test('parseHeartRateMeasurement: UINT16 little-endian', () => {
  assert.equal(parseHeartRateMeasurement(dv([0x01, 185, 0])).bpm, 185);
  assert.equal(parseHeartRateMeasurement(dv([0x01, 0x2c, 0x01])).bpm, 300);
});

test('parseHeartRateMeasurement: contato com a pele', () => {
  assert.equal(parseHeartRateMeasurement(dv([0x06, 80])).contactDetected, true);
  assert.equal(parseHeartRateMeasurement(dv([0x04, 80])).contactDetected, false);
});

test('parseHeartRateMeasurement: energia + intervalos RR', () => {
  // flags: energia (0x08) + RR (0x10); bpm 60; energia 10; RR 1024 (=1000ms), 512 (=500ms)
  const r = parseHeartRateMeasurement(dv([0x18, 60, 10, 0, 0x00, 0x04, 0x00, 0x02]));
  assert.equal(r.bpm, 60);
  assert.equal(r.energyExpended, 10);
  assert.deepEqual(r.rrIntervals, [1000, 500]);
});

test('parseHeartRateMeasurement: pacotes inválidos', () => {
  assert.equal(parseHeartRateMeasurement(null).bpm, null);
  assert.equal(parseHeartRateMeasurement(dv([0x00])).bpm, null);
  assert.equal(parseHeartRateMeasurement(dv([0x01, 100])).bpm, null);
});

test('isPlausibleHr: faixa 30–240', () => {
  assert.equal(isPlausibleHr(29), false);
  assert.equal(isPlausibleHr(30), true);
  assert.equal(isPlausibleHr(240), true);
  assert.equal(isPlausibleHr(241), false);
  assert.equal(isPlausibleHr(0), false);
  assert.equal(isPlausibleHr(null), false);
});

/* ================= FEATURE 007: FIDEDIGNIDADE E ISOLAMENTO BLUETOOTH ================= */

test('evaluateHrSample: rejeita pacotes sem contato com a pele (contactDetected === false)', () => {
  const r = evaluateHrSample({ bpm: 145, contactDetected: false, timestamp: 1000 }, []);
  assert.equal(r.accepted, false);
  assert.equal(r.reason, 'no-contact');
});

test('evaluateHrSample: rejeita leituras fora da faixa fisiológica (30–240 bpm)', () => {
  assert.equal(evaluateHrSample({ bpm: 0, contactDetected: true, timestamp: 1000 }, []).reason, 'out-of-range');
  assert.equal(evaluateHrSample({ bpm: 255, contactDetected: true, timestamp: 1000 }, []).reason, 'out-of-range');
});

test('evaluateHrSample: filtra picos espúrios isolados (> 25 bpm em <= 5s), mas confirma transição sustentada em 3 amostras', () => {
  const valid = [{ bpm: 150, timestamp: 1000 }];

  // 1º salto abrupto (+40 bpm em 1s) -> rejeitado como spike
  const s1 = evaluateHrSample({ bpm: 190, contactDetected: true, timestamp: 2000 }, valid, []);
  assert.equal(s1.accepted, false);
  assert.equal(s1.reason, 'spike');
  assert.equal(s1.nextPendingSpikes.length, 1);

  // Se voltar ao normal no segundo seguinte (152 bpm), aceita normalmente e limpa spikes pendentes
  const normal = evaluateHrSample({ bpm: 152, contactDetected: true, timestamp: 3000 }, valid, s1.nextPendingSpikes);
  assert.equal(normal.accepted, true);
  assert.equal(normal.reason, 'ok');
  assert.equal(normal.nextPendingSpikes.length, 0);

  // Porém, se o novo patamar (188–192 bpm) se sustentar por 3 amostras consecutivas:
  const s2 = evaluateHrSample({ bpm: 188, contactDetected: true, timestamp: 3000 }, valid, s1.nextPendingSpikes);
  assert.equal(s2.accepted, false);
  assert.equal(s2.reason, 'spike');
  assert.equal(s2.nextPendingSpikes.length, 2);

  const s3 = evaluateHrSample({ bpm: 191, contactDetected: true, timestamp: 4000 }, valid, s2.nextPendingSpikes);
  assert.equal(s3.accepted, true);
  assert.equal(s3.reason, 'confirmed-transition');
  assert.equal(s3.bpm, 191);
  assert.equal(s3.nextPendingSpikes.length, 0);
});

test('computeStableStageHr: calcula média aparada (trimmed-mean) nos últimos 15s eliminando outliers residuais', () => {
  const now = 120000;
  // 8 amostras nos últimos 15s: 6 estáveis em ~160 bpm + 1 baixa (140) + 1 alta (184)
  const samples = [
    { bpm: 140, timestamp: now - 14000 },
    { bpm: 159, timestamp: now - 12000 },
    { bpm: 160, timestamp: now - 10000 },
    { bpm: 160, timestamp: now - 8000 },
    { bpm: 161, timestamp: now - 6000 },
    { bpm: 160, timestamp: now - 4000 },
    { bpm: 184, timestamp: now - 2000 },
    { bpm: 160, timestamp: now - 1000 }
  ];
  const res = computeStableStageHr(samples, now);
  assert.equal(res.method, 'trimmed-mean');
  assert.equal(res.sampleCount, 8);
  assert.equal(res.bpm, 160);
});

test('computeStableStageHr: usa mediana para 3–4 amostras, média para 1–2 amostras e rejeita janela expirada (> 6s)', () => {
  const now = 60000;
  const three = [
    { bpm: 150, timestamp: now - 3000 },
    { bpm: 174, timestamp: now - 2000 },
    { bpm: 152, timestamp: now - 1000 }
  ];
  const rMed = computeStableStageHr(three, now);
  assert.equal(rMed.method, 'median');
  assert.equal(rMed.bpm, 152);

  const two = [
    { bpm: 148, timestamp: now - 2000 },
    { bpm: 150, timestamp: now - 1000 }
  ];
  const rMean = computeStableStageHr(two, now);
  assert.equal(rMean.method, 'recent-mean');
  assert.equal(rMean.bpm, 149);

  const stale = [{ bpm: 150, timestamp: now - 7000 }];
  const rStale = computeStableStageHr(stale, now);
  assert.equal(rStale.method, 'stale');
  assert.equal(rStale.bpm, null);

  const empty = computeStableStageHr([], now);
  assert.equal(empty.method, 'none');
  assert.equal(empty.bpm, null);
});

test('assessBtSignalQuality: diagnostica conexões, aparelhos incompatíveis, reconexão, mau contato e sinal fidedigno', () => {
  const now = 50000;
  const valid = [
    { bpm: 154, timestamp: now - 3000 },
    { bpm: 155, timestamp: now - 2000 },
    { bpm: 155, timestamp: now - 1000 }
  ];

  // US1: aparelho incompatível sem serviço 0x180D
  const unsup = assessBtSignalQuality({ status: 'disconnected', lastDisconnectReason: 'unsupported-device' }, now);
  assert.equal(unsup.quality, 'unsupported-device');
  assert.equal(unsup.reliable, false);

  // US1/US3: reconectando automaticamente ao mesmo sensor
  const recon = assessBtSignalQuality({ status: 'reconnecting', autoReconnectAttempts: 2, maxReconnectAttempts: 3, validSamples: valid }, now);
  assert.equal(recon.quality, 'reconnecting');
  assert.equal(recon.reliable, false);
  assert.ok(recon.label.includes('2/3'));

  // US3: mau contato com a pele
  const noContact = assessBtSignalQuality({ status: 'connected', lastContactDetected: false, validSamples: valid }, now);
  assert.equal(noContact.quality, 'no-contact');
  assert.equal(noContact.reliable, false);
  assert.equal(noContact.stageBpm, null);

  // US3: sinal com ruído filtrado porém confiável
  const noisy = assessBtSignalQuality({ status: 'connected', lastContactDetected: true, validSamples: valid, recentSpikeCount: 2 }, now);
  assert.equal(noisy.quality, 'noisy');
  assert.equal(noisy.reliable, true);
  assert.equal(noisy.stageBpm, 155);

  // US3: sinal fidedigno e estável
  const stable = assessBtSignalQuality({ status: 'connected', lastContactDetected: true, validSamples: valid, recentSpikeCount: 0 }, now);
  assert.equal(stable.quality, 'stable');
  assert.equal(stable.reliable, true);
  assert.equal(stable.stageBpm, 155);
});

/* ================= FEATURE 008: REGRA DE VPICO (ESTÁGIO ANTERIOR COMPLETO) & COMPARAÇÃO ================= */

test('computeVPeak: quando interrompido no estágio atual incompleto, considera a velocidade do estágio anterior concluído', () => {
  // Concluiu estágios de 8.0 km/h e 9.0 km/h; interrompeu durante o estágio de 10.0 km/h
  const completed = [
    { v: 8, hr: 142, rpe: 4, tt: 0 },
    { v: 9, hr: 158, rpe: 6, tt: 1 }
  ];
  const r = computeVPeak(8, completed);
  assert.equal(r.vPeak, 9);
  assert.equal(r.completedStagesCount, 2);
  assert.equal(r.usedPreviousStage, true);
  assert.equal(r.fallbackToStart, false);

  // Concluiu apenas o 1º estágio (8.0 km/h) e parou no meio do 2º (9.0 km/h) -> vPeak = 8.0 km/h
  const r1 = computeVPeak(8, [{ v: 8, hr: 138, rpe: 3, tt: 0 }]);
  assert.equal(r1.vPeak, 8);
  assert.equal(r1.completedStagesCount, 1);
  assert.equal(r1.usedPreviousStage, true);
});

test('computeVPeak: fallback seguro para velocidade inicial caso interrompa antes de concluir o 1º estágio', () => {
  const r0 = computeVPeak(7.5, []);
  assert.equal(r0.vPeak, 7.5);
  assert.equal(r0.completedStagesCount, 0);
  assert.equal(r0.usedPreviousStage, false);
  assert.equal(r0.fallbackToStart, true);
});

test('compareAssessments: calcula deltas de evolução e pareia FC/RPE por velocidade (km/h)', () => {
  const base = {
    id: 'a1',
    dateFormatted: '10/08/2026',
    profileSnapshot: { weight: 80, age: 34 },
    screen: { fc: 68 },
    test: {
      vPeak: 10,
      vo2max: 35,
      mets: 10,
      vt1V: 8,
      vt2V: 9,
      fcVT1: 150,
      fcVT2: 168,
      stages: [
        { v: 8, hr: 150, rpe: 4 },
        { v: 9, hr: 168, rpe: 6 },
        { v: 10, hr: 182, rpe: 8 }
      ]
    },
    tte: { sec: 260 }
  };
  const curr = {
    id: 'a2',
    dateFormatted: '01/11/2026',
    profileSnapshot: { weight: 77.5, age: 34 },
    screen: { fc: 62 },
    test: {
      vPeak: 11,
      vo2max: 38.5,
      mets: 11,
      vt1V: 9,
      vt2V: 10,
      fcVT1: 152,
      fcVT2: 170,
      stages: [
        { v: 8, hr: 141, rpe: 3 },
        { v: 9, hr: 156, rpe: 5 },
        { v: 10, hr: 170, rpe: 7 },
        { v: 11, hr: 184, rpe: 9 }
      ]
    },
    tte: { sec: 340 }
  };

  const cmp = compareAssessments(base, curr);
  assert.equal(cmp.metrics.vPeak.delta, 1);
  assert.equal(cmp.metrics.vPeak.pct, 10);
  assert.equal(cmp.metrics.vo2max.delta, 3.5);
  assert.equal(cmp.metrics.weight.delta, -2.5);
  assert.equal(cmp.metrics.restHr.delta, -6);
  assert.equal(cmp.metrics.tteSec.delta, 80);

  assert.equal(cmp.stageComparison.length, 4);
  const st9 = cmp.stageComparison.find(s => s.v === 9);
  assert.equal(st9.baseHr, 168);
  assert.equal(st9.currHr, 156);
  assert.equal(st9.deltaHr, -12); // -12 bpm na mesma velocidade de 9 km/h!
  assert.equal(st9.deltaRpe, -1);

  const st11 = cmp.stageComparison.find(s => s.v === 11);
  assert.equal(st11.baseHr, null);
  assert.equal(st11.currHr, 184);
  assert.equal(st11.deltaHr, null);
});

/* ================= FEATURE 009: LOGIN, CADASTRO E PRESCRIÇÃO DE TREINOS ================= */

test('generateStudentAccessCode: gera código limpo em caixa alta e PIN de 4 dígitos', () => {
  const r1 = generateStudentAccessCode('Juliana Costa', 742);
  assert.equal(r1.code, 'JULIANA-742');
  assert.equal(r1.pin.length, 4);
  assert.equal(typeof r1.pin, 'string');

  const r2 = generateStudentAccessCode('João D\'Ávila Jr.', 125);
  assert.equal(r2.code, 'JOAO-125');

  const rFallback = generateStudentAccessCode('', 50);
  assert.equal(rFallback.code, 'ALUNO-050');
  assert.equal(rFallback.pin.length, 4);
});

test('generateWorkoutPrescriptions: tratamento defensivo para avaliações vazias ou inválidas', () => {
  assert.deepEqual(generateWorkoutPrescriptions(null), []);
  assert.deepEqual(generateWorkoutPrescriptions({}), []);
  assert.deepEqual(generateWorkoutPrescriptions({ test: { vPeak: 0 } }), []);
  assert.deepEqual(generateWorkoutPrescriptions({ test: { vPeak: -5 } }), []);
});

test('generateWorkoutPrescriptions: gera 6 fichas com velocidades, paces e passos para esteira', () => {
  const assessment = {
    test: {
      vPeak: 12.0,
      vo2max: 42.0,
      hrMax: 190,
      vt1V: 8.5,
      vt2V: 10.2,
      fcVT1: 150,
      fcVT2: 172
    },
    screen: { fc: 60 }
  };

  const cards = generateWorkoutPrescriptions(assessment);
  assert.equal(cards.length, 6);

  // 1. Z1 - Regenerativo (60% de 12.0 = 7.2 km/h)
  const z1 = cards.find(c => c.id === 'rec-z1');
  assert.ok(z1);
  assert.equal(z1.targetZone, 'Z1');
  assert.equal(z1.mainSpeedKmh, 7.2);
  assert.equal(z1.mainPaceStr, pace(7.2));
  assert.equal(z1.steps.length, 3);
  assert.equal(z1.steps[0].phase, 'warmup');
  assert.equal(z1.steps[1].phase, 'main');
  assert.equal(z1.steps[2].phase, 'cooldown');

  // 2. Z2 - Base Aeróbia (abaixo do VT1 8.5 -> min(8.3, 8.6) = 8.3 km/h)
  const z2 = cards.find(c => c.id === 'base-z2');
  assert.ok(z2);
  assert.equal(z2.targetZone, 'Z2');
  assert.equal(z2.mainSpeedKmh, 8.3);
  assert.equal(z2.mainPaceStr, pace(8.3));
  assert.ok(z2.mainHrMin > 100);
  assert.ok(z2.mainHrMax >= z2.mainHrMin);

  // 3. Z3 - Tempo Run (entre VT1 e VT2 -> 10.0 km/h)
  const z3 = cards.find(c => c.id === 'tempo-z3');
  assert.ok(z3);
  assert.equal(z3.targetZone, 'Z3');
  assert.equal(z3.mainSpeedKmh, 10.0);
  assert.equal(z3.mainPaceStr, pace(10.0));

  // 4. Z4 - Intervalado Longo VO2máx (96% de 12.0 = 11.5 km/h, rec trote ~6.6 km/h)
  const z4 = cards.find(c => c.id === 'hiit-vo2-z4');
  assert.ok(z4);
  assert.equal(z4.targetZone, 'Z4');
  assert.equal(z4.mainSpeedKmh, 11.5);
  assert.equal(z4.recoverySpeedKmh, 6.6);

  // 5. HIIT Curto (102% de 12.0 = 12.2 km/h)
  const shortHiit = cards.find(c => c.id === 'hiit-short');
  assert.ok(shortHiit);
  assert.equal(shortHiit.mainSpeedKmh, 12.2);

  // 6. Tiros Z5 (108% de 12.0 = 13.0 km/h)
  const speed = cards.find(c => c.id === 'speed-z5');
  assert.ok(speed);
  assert.equal(speed.targetZone, 'Z5');
  assert.equal(speed.mainSpeedKmh, 13.0);
});


/* ================= FEATURE 010: RESTRIÇÃO, PIN DE ACESSO E APROVAÇÃO ================= */

test('validatePhone: higieniza e valida formato brasileiro de telefone/WhatsApp', () => {
  assert.equal(validatePhone('').valid, false);
  assert.equal(validatePhone(null).valid, false);
  assert.equal(validatePhone('12345').valid, false);

  // 11 dígitos com formatação
  const rMobile = validatePhone('(11) 98765-4321');
  assert.equal(rMobile.valid, true);
  assert.equal(rMobile.sanitized, '11987654321');
  assert.equal(rMobile.formatted, '(11) 98765-4321');

  // WhatsApp oficial do suporte (11) 94715-2652
  const rAdminWa = validatePhone('(11) 94715-2652');
  assert.equal(rAdminWa.valid, true);
  assert.equal(rAdminWa.sanitized, '11947152652');
  assert.equal(rAdminWa.formatted, '(11) 94715-2652');

  // 13 dígitos com DDI 55
  const rDdi = validatePhone('55 (11) 98765-4321');
  assert.equal(rDdi.valid, true);
  assert.equal(rDdi.sanitized, '11987654321');

  // 10 dígitos (fixo)
  const rLandline = validatePhone('11 3214-5678');
  assert.equal(rLandline.valid, true);
  assert.equal(rLandline.sanitized, '1132145678');
  assert.equal(rLandline.formatted, '(11) 3214-5678');
});

test('generateActivationPin: gera código alfanumérico amigável prefixado com RL-', () => {
  const pin1 = generateActivationPin(12345);
  assert.ok(pin1.startsWith('RL-'));
  assert.equal(pin1.length, 9); // 'RL-' + 6 chars
  assert.match(pin1, /^RL-[2-9A-Z]{6}$/);

  // Determinístico com mesma seed
  const pin2 = generateActivationPin(12345);
  assert.equal(pin1, pin2);

  // Aleatório sem seed
  const randomPin = generateActivationPin();
  assert.ok(randomPin.startsWith('RL-'));
  assert.equal(randomPin.length, 9);
});

test('evaluateProfessorAccess: avalia corretamente estados de conta (ativo, pendente, bloqueado)', () => {
  // Inválido
  assert.equal(evaluateProfessorAccess(null).allowed, false);
  assert.equal(evaluateProfessorAccess({}).allowed, true); // retrocompatível sem status

  // Ativo
  const active = evaluateProfessorAccess({ status: 'ativo' });
  assert.equal(active.allowed, true);
  assert.equal(active.reason, 'active');

  // Pendente
  const pending = evaluateProfessorAccess({ status: 'pendente' });
  assert.equal(pending.allowed, false);
  assert.equal(pending.reason, 'pending_approval');
  assert.ok(pending.messagePtBr.includes('análise'));

  // Bloqueado
  const blocked = evaluateProfessorAccess({ status: 'bloqueado' });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.reason, 'blocked');
});
