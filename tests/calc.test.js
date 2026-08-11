const test = require('node:test');
const assert = require('node:assert/strict');
const {
  vo2At, pace, getAvg, diagnoseVO2, deriveVTs, computeHrMax, computeZones, tteClass,
  classifySpo2, classifyGlicose
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
