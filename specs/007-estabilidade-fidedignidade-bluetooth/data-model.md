# Data Model: Isolamento de Conexão e Fidedignidade das Leituras Bluetooth de FC

**Feature**: `specs/007-estabilidade-fidedignidade-bluetooth`  
**Date**: 2026-11-01

## Entidades e Estruturas de Dados

### 1. DeviceSessionLock (Vínculo Exclusivo do Sensor na Sessão)
Representa o travamento de sessão ao dispositivo Bluetooth selecionado pelo avaliador, garantindo que reconexões automáticas ocorram exclusivamente com o mesmo equipamento.

```typescript
interface DeviceSessionLock {
  boundDeviceId: string | null;     // Identificador único de sessão do BluetoothDevice (device.id)
  boundDeviceName: string | null;   // Nome amigável anunciado pelo cinto (ex: "Polar H10 9A3F")
  boundShortTag: string | null;     // Sufixo curto identificador para exibição na UI (ex: "#9A3F")
  isLocked: boolean;                // True enquanto vinculado à sessão atual do aluno
  autoReconnectAttempts: number;    // Contador de tentativas automáticas consecutivas (0..MAX_RETRIES)
  maxReconnectAttempts: number;     // Limite de tentativas automáticas silenciosas (padrão: 3)
  lastDisconnectReason: 'none' | 'manual' | 'signal-drop' | 'unsupported-device';
}
```

### 2. ValidatedHrSample (Amostra de FC Avaliada pelo Filtro Fisiológico)
Representa uma leitura individual decodificada do cinto (`0x2A37`) após avaliação pelos critérios de contato com a pele, faixa fisiológica e taxa máxima de variação instantânea.

```typescript
interface ValidatedHrSample {
  bpm: number | null;               // Valor bruto decodificado (bpm)
  contactDetected: boolean | null;  // True = contato OK, False = sem contato, Null = sensor não reporta
  rrIntervals: number[];            // Intervalos R-R em ms (se presentes)
  timestamp: number;                // Timestamp em ms da chegada do pacote
  accepted: boolean;                // Se a amostra foi aprovada para o buffer de leituras válidas
  reason: 'ok' | 'no-contact' | 'out-of-range' | 'spike' | 'confirmed-transition';
}
```

### 3. RollingHrWindow (Janela Deslizante de Amostras de FC)
Mantém o histórico recente em memória (últimos 20 segundos) para cálculo de suavização visual e fechamento estabilizado de estágio de 2 minutos.

```typescript
interface RollingHrWindow {
  validSamples: Array<{
    bpm: number;
    timestamp: number;
    rrIntervals?: number[];
  }>;                               // Buffer podado aos últimos 20s (máx. ~30 amostras)
  pendingSpikes: Array<{
    bpm: number;
    timestamp: number;
  }>;                               // Buffer curto (últimos 6s) para confirmar transições reais sustentadas
  rejectedCountWindow: number;      // Quantidade de amostras rejeitadas por spike/mau contato nos últimos 10s
  lastContactDetected: boolean | null; // Último estado conhecido de contato com a pele
}
```

### 4. StageStabilizedHrResult (Resultado Consolidado de FC para o Estágio)
Saída da função pura `computeStableStageHr` utilizada ao encerrar cada estágio de 2 minutos ou acionar a captura rápida.

```typescript
interface StageStabilizedHrResult {
  bpm: number | null;               // FC estabilizada (inteiro arredondado) ou null se sem dados fidedignos
  sampleCount: number;              // Número de amostras válidas utilizadas na janela (últimos 15s)
  method: 'trimmed-mean' | 'median' | 'recent-mean' | 'stale' | 'none';
  spreadBpm: number | null;         // Amplitude (max - min) das amostras consideradas na janela
}
```

### 5. SignalQualityDiagnosis (Diagnóstico de Qualidade e Confiabilidade do Sinal)
Estado consolidado da fidedignidade do sinal Bluetooth para exibição na interface e controle de captura automática.

```typescript
interface SignalQualityDiagnosis {
  quality: 'disconnected' | 'connecting' | 'reconnecting' | 'stable' | 'noisy' | 'no-contact' | 'stale' | 'lost' | 'unsupported-device';
  label: string;                    // Rótulo curto em pt-BR para o badge (ex: "Sinal fidedigno", "Mau contato")
  reliable: boolean;                // True quando há leitura recente válida apta para preenchimento automático
  displayBpm: number | null;        // Valor suavizado (média das últimas 3 leituras válidas) para o mostrador ao vivo
  stageBpm: number | null;          // Valor consolidado (janela de 15s) pronto para registro de estágio
}
```

---

## Regras de Validação e Transições de Estado

### 1. Regras do Filtro Fisiológico (`evaluateHrSample`)
1. **Contato com a pele**: Se `contactDetected === false` → `accepted = false`, `reason = 'no-contact'`.
2. **Faixa fisiológica humana**: Se `!isPlausibleHr(bpm)` (`< 30` ou `> 240` bpm) → `accepted = false`, `reason = 'out-of-range'`.
3. **Filtro contra picos/quedas isoladas (`spike`)**:
   - Se existir uma amostra válida anterior recente (`timestamp - lastValid.timestamp <= 5000 ms`) e `Math.abs(bpm - lastValid.bpm) > 25`:
     - Verifica se já existem pelo menos `2` leituras pendentes consecutivas em `pendingSpikes` (nos últimos `6000 ms`) próximas ao novo valor (`Math.abs(bpm - p.bpm) <= 15`).
     - Caso **não** haja confirmação suficiente: `accepted = false`, `reason = 'spike'`, e a leitura é adicionada a `pendingSpikes`.
     - Caso esta seja a **3ª leitura consecutiva** confirmando o novo patamar: `accepted = true`, `reason = 'confirmed-transition'`, e `pendingSpikes` é limpo.
   - Se a variação for `<= 25 bpm` (ou se não houver leitura válida nos últimos `5000 ms`): `accepted = true`, `reason = 'ok'`, e `pendingSpikes` é limpo.

### 2. Regras de Estabilização de Estágio (`computeStableStageHr`)
1. Filtra `validSamples` com `nowMs - s.timestamp <= 15000` (janela final de 15 segundos do estágio) e `isPlausibleHr(s.bpm)`.
2. Verifica se a amostra mais recente da janela foi recebida há no máximo `6000 ms` (`staleMs`). Se a mais recente for mais antiga que `6000 ms`, retorna `{ bpm: null, sampleCount: 0, method: 'stale', spreadBpm: null }`.
3. Se `count >= 5`: ordena os BPMs em ordem crescente, descarta `k = Math.max(1, Math.floor(count * 0.2))` amostras de cada extremidade (menor e maior) e retorna a média arredondada (`method = 'trimmed-mean'`).
4. Se `count === 3` ou `4`: ordena os BPMs e retorna a mediana arredondada (`method = 'median'`).
5. Se `count === 1` ou `2`: retorna a média aritmética arredondada (`method = 'recent-mean'`).

### 3. Ciclo de Vida do Vínculo e Reconexão (`DeviceSessionLock`)
- `disconnected` → `connecting`: Avaliador clica em "Conectar cinto".
- `connecting` → `connected` (`isLocked = true`, `boundDeviceId = device.id`): Serviço `0x180D` validado com sucesso.
- `connecting` → `disconnected` (`lastDisconnectReason = 'unsupported-device'`): Aparelho selecionado não possui serviço `0x180D`; desconecta GATT imediatamente e exibe aviso.
- `connected` → `reconnecting` (`autoReconnectAttempts = 1..3`): Evento `gattserverdisconnected` involuntário; tenta reconectar exclusivamente ao `device` já vinculado (`boundDeviceId`) sem abrir janela de seleção.
- `reconnecting` → `connected` (`autoReconnectAttempts = 0`): Reconexão bem-sucedida ao mesmo sensor.
- `reconnecting` → `lost`: Esgotadas as 3 tentativas automáticas (~7–8s); libera botão "Reconectar ao mesmo cinto" ou "Trocar sensor" e mantém digitação manual livre.
- Qualquer estado → `disconnected` (`isLocked = false`, `boundDeviceId = null`): Avaliador clica em "Desconectar / Trocar sensor".

