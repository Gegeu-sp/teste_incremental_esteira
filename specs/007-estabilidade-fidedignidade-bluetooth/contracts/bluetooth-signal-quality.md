# Contract: Filtragem de Sinal, Estabilização de Estágio e Vínculo Exclusivo Bluetooth

**Feature**: `specs/007-estabilidade-fidedignidade-bluetooth`  
**Date**: 2026-11-01

## 1. Pure Signal Filter & Stage Stabilization Contract (`assets/calc.js`)

Todas as funções de avaliação de amostras, rejeição de outliers fisiológicos, cálculo de FC estabilizada de estágio e diagnóstico de qualidade do sinal são implementadas como funções puras em `assets/calc.js` e exportadas em `module.exports` para execução em `tests/calc.test.js` (Princípio IV).

### 1.1 `evaluateHrSample(sample, recentValidSamples, pendingSpikes, options)`

Avalia se uma leitura recebida do sensor Bluetooth é fisiologicamente fidedigna ou se deve ser descartada por falta de contato com a pele, valor fora da faixa humana ou salto espúrio isolado (spike).

```javascript
/**
 * @param {{ bpm: number|null, contactDetected?: boolean|null, timestamp: number, rrIntervals?: number[] }} sample
 * @param {Array<{ bpm: number, timestamp: number }>} recentValidSamples
 * @param {Array<{ bpm: number, timestamp: number }>} [pendingSpikes=[]]
 * @param {{ maxDeltaBpm?: number, spikeWindowMs?: number, confirmWindowMs?: number, minConfirmations?: number, confirmToleranceBpm?: number }} [options]
 * @returns {{
 *   accepted: boolean,
 *   reason: 'ok' | 'no-contact' | 'out-of-range' | 'spike' | 'confirmed-transition',
 *   bpm: number | null,
 *   nextPendingSpikes: Array<{ bpm: number, timestamp: number }>
 * }}
 */
function evaluateHrSample(sample, recentValidSamples, pendingSpikes, options)
```

**Comportamento contratual**:
- Valores padrão de `options`: `maxDeltaBpm = 25`, `spikeWindowMs = 5000`, `confirmWindowMs = 6000`, `minConfirmations = 3`, `confirmToleranceBpm = 15`.
- Se `!sample` ou `sample.contactDetected === false`: retorna `{ accepted: false, reason: 'no-contact', bpm: sample?.bpm ?? null, nextPendingSpikes }`.
- Se `!isPlausibleHr(sample.bpm)` (`< 30` ou `> 240`): retorna `{ accepted: false, reason: 'out-of-range', bpm: sample.bpm, nextPendingSpikes }`.
- Se existir amostra válida anterior em `recentValidSamples` com `sample.timestamp - lastValid.timestamp <= spikeWindowMs` e `Math.abs(sample.bpm - lastValid.bpm) > maxDeltaBpm`:
  - Filtra `pendingSpikes` recentes (`sample.timestamp - p.timestamp <= confirmWindowMs`) que estejam próximas do novo patamar (`Math.abs(sample.bpm - p.bpm) <= confirmToleranceBpm`).
  - Se `matchingSpikes.length + 1 >= minConfirmations`: retorna `{ accepted: true, reason: 'confirmed-transition', bpm: sample.bpm, nextPendingSpikes: [] }`.
  - Caso contrário: retorna `{ accepted: false, reason: 'spike', bpm: sample.bpm, nextPendingSpikes: [...matchingSpikes, { bpm: sample.bpm, timestamp: sample.timestamp }] }`.
- Caso contrário (variação normal `<= maxDeltaBpm` ou primeira leitura): retorna `{ accepted: true, reason: 'ok', bpm: sample.bpm, nextPendingSpikes: [] }`.

---

### 1.2 `computeStableStageHr(validSamples, nowMs, options)`

Calcula a frequência cardíaca consolidada e fidedigna para fechamento de estágio (janela padrão dos últimos 15 segundos) ou exibição suavizada.

```javascript
/**
 * @param {Array<{ bpm: number, timestamp: number }>} validSamples
 * @param {number} nowMs
 * @param {{ windowMs?: number, staleMs?: number }} [options]
 * @returns {{
 *   bpm: number | null,
 *   sampleCount: number,
 *   method: 'trimmed-mean' | 'median' | 'recent-mean' | 'stale' | 'none',
 *   spreadBpm: number | null
 * }}
 */
function computeStableStageHr(validSamples, nowMs, options)
```

**Comportamento contratual**:
- Valores padrão: `windowMs = 15000` (15s), `staleMs = 6000` (6s).
- Se `validSamples` estiver vazio ou sem itens plausíveis dentro de `[nowMs - windowMs, nowMs]`: retorna `{ bpm: null, sampleCount: 0, method: 'none', spreadBpm: null }`.
- Se a amostra mais recente da janela tiver `nowMs - latestTimestamp > staleMs`: retorna `{ bpm: null, sampleCount: 0, method: 'stale', spreadBpm: null }`.
- Calcula `spreadBpm = maxBpm - minBpm` das amostras na janela.
- Se `n >= 5`: ordena os BPMs, remove `k = Math.max(1, Math.floor(n * 0.2))` menores e `k` maiores, e retorna a média arredondada (`Math.round`) com `method: 'trimmed-mean'`.
- Se `n === 3` ou `n === 4`: ordena os BPMs e retorna a mediana arredondada com `method: 'median'`.
- Se `n === 1` ou `n === 2`: retorna a média arredondada com `method: 'recent-mean'`.

---

### 1.3 `assessBtSignalQuality(ctx, nowMs, options)`

Classifica de forma determinística a qualidade/fidedignidade atual do sinal Bluetooth para orientação visual do avaliador.

```javascript
/**
 * @param {{
 *   status: 'disconnected'|'connecting'|'reconnecting'|'connected'|'lost',
 *   lastDisconnectReason?: string,
 *   lastContactDetected?: boolean|null,
 *   validSamples?: Array<{ bpm: number, timestamp: number }>,
 *   recentSpikeCount?: number
 * }} ctx
 * @param {number} nowMs
 * @param {{ staleMs?: number }} [options]
 * @returns {{
 *   quality: 'disconnected'|'connecting'|'reconnecting'|'stable'|'noisy'|'no-contact'|'stale'|'lost'|'unsupported-device',
 *   label: string,
 *   reliable: boolean,
 *   displayBpm: number | null,
 *   stageBpm: number | null
 * }}
 */
function assessBtSignalQuality(ctx, nowMs, options)
```

---

## 2. UI & Session Lock Contract (`index.html`)

### 2.1 Extensão da API `BluetoothHR`
```javascript
const BluetoothHR = {
  isSupported(): boolean,
  connect(wideScan?: boolean): Promise<void>,
  disconnect(forgetDevice?: boolean): void,
  reconnect(): Promise<void>,
  getState(): {
    status: 'disconnected' | 'connecting' | 'reconnecting' | 'connected' | 'lost',
    quality: string,
    qualityLabel: string,
    reliable: boolean,
    deviceName: string | null,
    boundDeviceId: string | null,
    currentBpm: number | null,     // BPM suavizado (últimos 3s)
    stageBpm: number | null        // BPM estabilizado (janela de 15s para estágio)
  },
  stageHr(): number | null,        // Retorna stageBpm fidedigno (nunca amostra única bruta)
  subscribe(callback): () => void,
  render(): void
};
```

### 2.2 Elementos de Interface e Indicadores Visuais
- `#btWidget`: Suporta `data-st="disconnected|connecting|reconnecting|connected|lost"` e `data-quality="stable|noisy|no-contact|stale"`.
- `#btQualityBadge` / `#btStatusBadge`: Exibe o nome do cinto vinculado com sufixo identificador e o diagnóstico de qualidade (`"Sinal fidedigno"`, `"Mau contato"`, `"Reconectando (1/3)…"`).
- `#btnBtForget`: Botão discreto (`"Trocar"`) visível quando há um sensor travado na sessão em estado `lost` ou `connected`, permitindo limpar o vínculo caso o avaliador realmente queira conectar outro cinto.

