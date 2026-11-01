---

description: "Task list for Isolamento de Conexão e Fidedignidade das Leituras Bluetooth de FC"
---

# Tasks: Isolamento de Conexão e Fidedignidade das Leituras Bluetooth de FC

**Input**: Design documents from `/specs/007-estabilidade-fidedignidade-bluetooth/`  
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/bluetooth-signal-quality.md, quickstart.md  
**Tests**: Obrigatórios conforme `spec.md` (`FR-009`, `SC-005`) e Constitution (Princípio IV — Precisão Numérica Testável).  
**Organization**: Tarefas agrupadas por fase e User Story (`US1`, `US2`, `US3`) para permitir implementação e validação incremental independente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode ser executada em paralelo (arquivos distintos, sem dependências de tarefas incompletas)
- **[Story]**: Rótulo da User Story correspondente (`[US1]`, `[US2]`, `[US3]`)
- Caminhos exatos de arquivo incluídos em todas as tarefas (`assets/calc.js`, `tests/calc.test.js`, `index.html`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verificação da linha de base existente do projeto e preparação das constantes e exportações compartilhadas.

- [x] T001 Executar a suíte de testes atual (`node --test tests/*.test.js`) para confirmar linha de base íntegra antes das alterações em `tests/calc.test.js`
- [x] T002 Definir constantes de configuração de filtragem fisiológica e janelas temporais (`HR_MAX_DELTA_BPM = 25`, `HR_SPIKE_WINDOW_MS = 5000`, `HR_CONFIRM_WINDOW_MS = 6000`, `HR_MIN_CONFIRMATIONS = 3`, `HR_CONFIRM_TOLERANCE_BPM = 15`, `HR_STAGE_WINDOW_MS = 15000`, `HR_STALE_MS = 6000`) em `assets/calc.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implementar e exportar as funções puras de filtragem fisiológica, estabilização estatística de estágio e diagnóstico de qualidade do sinal em `assets/calc.js`, que servem de alicerce para as histórias de usuário na interface.

**⚠️ CRITICAL**: Nenhuma integração de User Story em `index.html` deve começar antes da conclusão desta fase.

- [x] T003 Implementar a função pura `evaluateHrSample(sample, recentValidSamples, pendingSpikes, options)` em `assets/calc.js` obedecendo às regras de `data-model.md`: (1) `contactDetected === false` → `accepted = false, reason = 'no-contact'`; (2) `!isPlausibleHr(bpm)` (`< 30` ou `> 240` bpm) → `accepted = false, reason = 'out-of-range'`; (3) variação `Math.abs(bpm - lastValid.bpm) > 25` em `<= 5000 ms` sem confirmação prévia → `accepted = false, reason = 'spike'` e adição a `pendingSpikes`; (4) `3ª leitura consecutiva` nos últimos `6000 ms` dentro de `<= 15 bpm` → `accepted = true, reason = 'confirmed-transition'` e limpeza de `pendingSpikes`; (5) variação `<= 25 bpm` → `accepted = true, reason = 'ok'`
- [x] T004 Implementar a função pura `computeStableStageHr(validSamples, nowMs, options)` em `assets/calc.js` obedecendo às regras de `data-model.md`: filtrar `validSamples` em `nowMs - s.timestamp <= 15000`; retornar `{ bpm: null, sampleCount: 0, method: 'none', spreadBpm: null }` se vazia ou `{ bpm: null, sampleCount: 0, method: 'stale', spreadBpm: null }` se a amostra mais recente tiver `nowMs - latest.timestamp > 6000 ms`; para `count >= 5`, descartar `k = Math.max(1, Math.floor(count * 0.2))` amostras de cada extremidade e retornar média arredondada (`method = 'trimmed-mean'`); para `count === 3` ou `4`, retornar mediana arredondada (`method = 'median'`); para `count === 1` ou `2`, retornar média arredondada (`method = 'recent-mean'`)
- [x] T005 Implementar a função pura `assessBtSignalQuality(ctx, nowMs, options)` em `assets/calc.js` retornando `{ quality, label, reliable, displayBpm, stageBpm }` para os estados `'disconnected' | 'connecting' | 'reconnecting' | 'stable' | 'noisy' | 'no-contact' | 'stale' | 'lost' | 'unsupported-device'` conforme contrato em `specs/007-estabilidade-fidedignidade-bluetooth/contracts/bluetooth-signal-quality.md`
- [x] T006 Exportar `evaluateHrSample`, `computeStableStageHr` e `assessBtSignalQuality` no bloco `module.exports` de `assets/calc.js`

**Checkpoint**: Funções puras fundamentais prontas e exportadas em `assets/calc.js`.

---

## Phase 3: User Story 1 - Isolamento do Sensor e Prevenção de Colisão entre Dispositivos Próximos (Priority: P1) 🎯 MVP

**Goal**: Garantir que o pareamento padrão priorize apenas sensores cardíacos legítimos, valide imediatamente a presença do serviço GATT `0x180D` (rejeitando periféricos incompatíveis selecionados por engano) e trave a sessão exclusivamente no `boundDeviceId` do cinto conectado.

**Independent Test**: Em ambiente com múltiplos dispositivos Bluetooth, acionar a conexão em `index.html`, validar que periféricos sem serviço `heart_rate` são rejeitados com mensagem clara (`unsupported-device`), que o cinto válido conectado fica vinculado por `boundDeviceId` com exibição de identificação na tela, e que o botão de trocar/esquecer sensor limpa o vínculo apenas sob comando explícito.

### Tests for User Story 1 ⚠️

- [x] T007 [P] [US1] Adicionar testes unitários em `tests/calc.test.js` para `assessBtSignalQuality` cobrindo os estados de conexão e isolamento (`disconnected`, `connecting`, `unsupported-device` com `lastDisconnectReason: 'unsupported-device'`, `reconnecting` e `lost`)

### Implementation for User Story 1

- [x] T008 [US1] Refinar os filtros de descoberta BLE em `BluetoothHR.connect()` dentro de `index.html` para priorizar o serviço padrão `heart_rate` (`0x180D`) e prefixos dedicados de monitores cardíacos (`Polar`, `Garmin`, `Wahoo`, `Magene`, `CooSpo`, `Decathlon`, `Kalenji`, `Geonaute`, `H64`, `H303`, `TICKR`, `HRM`), removendo prefixos ambíguos curtos que colidem com outros aparelhos
- [x] T009 [US1] Implementar a entidade `DeviceSessionLock` (`boundDeviceId`, `boundDeviceName`, `boundShortTag`, `isLocked`, `autoReconnectAttempts`, `maxReconnectAttempts = 3`, `lastDisconnectReason`) e a validação pós-conexão do serviço `heart_rate` em `BluetoothHR.attach()` dentro de `index.html`, desconectando imediatamente o GATT e definindo `lastDisconnectReason = 'unsupported-device'` caso o aparelho selecionado não exponha `0x180D`
- [x] T010 [US1] Adicionar controle explícito de destravamento/troca de sensor (`#btnBtForget` / `disconnect(true)`) e exibição do identificador curto do dispositivo vinculado (`boundShortTag`) no widget `#btWidget` em `index.html`

**Checkpoint**: User Story 1 concluída — pareamento isolado contra colisões, validação de serviço `0x180D` e trava de sessão `DeviceSessionLock` funcionais como MVP.

---

## Phase 4: User Story 2 - Filtragem de Artefatos e Cálculo Fidedigno da FC de Estágio (Priority: P2)

**Goal**: Descartar leituras sem contato com a pele (`contactDetected === false`) e picos/quedas espúrias isoladas (`> 25 bpm` em `< 5s`), mantendo uma janela deslizante (`RollingHrWindow`) para registrar automaticamente ao fim de cada estágio de 2 minutos a FC estabilizada dos últimos 15 segundos (`computeStableStageHr`).

**Independent Test**: Executar `node --test tests/calc.test.js` e simular no teste incremental de `index.html` uma sequência de batimentos com pico isolado (ex.: `155, 156, 215, 157 bpm`) ou pacote com `contactDetected = false`, verificando que o estágio registra `~156 bpm` e ignora o artefato.

### Tests for User Story 2 ⚠️

- [x] T011 [P] [US2] Adicionar testes unitários em `tests/calc.test.js` para `evaluateHrSample` cobrindo: (a) rejeição de `contactDetected === false` (`reason: 'no-contact'`), (b) rejeição fora de `30–240 bpm` (`reason: 'out-of-range'`), (c) rejeição de pico isolado de 1 ou 2 amostras `> 25 bpm` em `<= 5000 ms` (`reason: 'spike'`), e (d) aceitação na 3ª leitura consecutiva dentro de `6000 ms` e tolerância `<= 15 bpm` (`reason: 'confirmed-transition'`)
- [x] T012 [P] [US2] Adicionar testes unitários em `tests/calc.test.js` para `computeStableStageHr` cobrindo: (a) média aparada (`trimmed-mean`) com `count >= 5` na janela de `15000 ms` contendo até 20% de ruído residual, (b) mediana (`median`) para `count === 3` ou `4`, (c) média recente (`recent-mean`) para `count === 1` ou `2`, e (d) rejeição de janela expirada (`stale` > `6000 ms`) ou vazia (`none`) retornando `bpm: null`

### Implementation for User Story 2

- [x] T013 [US2] Integrar `RollingHrWindow` (`validSamples` podado aos últimos `20000 ms`, `pendingSpikes` podado aos últimos `6000 ms`, `rejectedCountWindow`, `lastContactDetected`) e `evaluateHrSample` no handler `onValue` de `BluetoothHR` em `index.html`
- [x] T014 [US2] Atualizar `BluetoothHR.stageHr()` e `BluetoothHR.getState()` em `index.html` para retornar a FC estabilizada via `computeStableStageHr` (para fechamento de estágio em `#stHrNow` e tabela de estágios) e o `displayBpm` suavizado (média das últimas 3 amostras válidas recentes), bloqueando o preenchimento automático quando `reliable === false`

**Checkpoint**: User Stories 1 e 2 concluídas — filtragem fisiológica e fechamento estabilizado de estágio de 15 segundos ativos e testados.

---

## Phase 5: User Story 3 - Indicador de Qualidade do Sinal e Reconexão Silenciosa Resiliente (Priority: P3)

**Goal**: Exibir em tempo real o nível de confiabilidade do sinal Bluetooth (`Sinal fidedigno`, `Filtro ativo`, `Mau contato`, `Reconectando…`) e executar reconexão automática silenciosa com backoff progressivo exclusivamente ao dispositivo vinculado (`boundDeviceId`) em microquedas de sinal.

**Independent Test**: Com um cinto conectado em `index.html`, simular desconexão involuntária (`gattserverdisconnected`) ou pacote sem contato, verificando que o sistema tenta até 3 reconexões automáticas espaçadas ao mesmo `boundDeviceId` exibindo o estado `'reconnecting'` sem travar o cronômetro da esteira.

### Tests for User Story 3 ⚠️

- [x] T015 [P] [US3] Adicionar testes unitários em `tests/calc.test.js` para `assessBtSignalQuality` cobrindo os diagnósticos de sinal conectado: `'stable'` (`reliable: true`), `'noisy'` quando `recentSpikeCount > 0` (`reliable: true`), `'no-contact'` quando `lastContactDetected === false` (`reliable: false`), e `'stale'` quando sem amostras válidas há mais de `6000 ms` (`reliable: false`)

### Implementation for User Story 3

- [x] T016 [US3] Implementar reconexão automática silenciosa com backoff progressivo (`800 ms`, `2000 ms`, `4500 ms`, até `maxReconnectAttempts = 3`) em `onDisconnected` dentro de `index.html`, reconectando exclusivamente à instância `device` correspondente a `boundDeviceId` antes de transicionar para `'lost'`
- [x] T017 [US3] Atualizar `BluetoothHR.render()` e os estilos de `#btWidget`, `#btStatusBadge`, `#stBtChip` e botões `.bt-fill` em `index.html` para refletir o diagnóstico de `assessBtSignalQuality` (`data-quality`, cores de alerta de mau contato/oscilação e desabilitação de `.bt-fill` quando `!reliable`)

**Checkpoint**: Todas as User Stories (`US1`, `US2`, `US3`) implementadas e independentemente verificáveis.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validação final ponta a ponta, regressão de testes automatizados e verificação de usabilidade mobile-first.

- [x] T018 Executar a suíte completa `npm test` (`node --test tests/*.test.js`) e confirmar 100% de aprovação sem regressões nas fórmulas fisiológicas existentes em `tests/calc.test.js`
- [x] T019 Verificar layout responsivo mobile-first e estados visuais de `#btWidget` em `index.html` seguindo os cenários do guia `specs/007-estabilidade-fidedignidade-bluetooth/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Inicia imediatamente (`T001` → `T002`).
- **Foundational (Phase 2)**: Depende de `T002` — bloqueia o início das fases de User Story (`T003`, `T004`, `T005`, `T006`).
- **User Story 1 (Phase 3 - P1 🎯 MVP)**: Depende da Phase 2 (`T007` → `T008` → `T009` → `T010`).
- **User Story 2 (Phase 4 - P2)**: Depende da Phase 2 (`T011`, `T012` em paralelo → `T013` → `T014`).
- **User Story 3 (Phase 5 - P3)**: Depende da Phase 2 e integra-se com o vínculo de sessão da US1 e janela de amostras da US2 (`T015` → `T016` → `T017`).
- **Polish (Phase 6)**: Depende da conclusão das Fases 3, 4 e 5 (`T018` → `T019`).

### Parallel Opportunities

- Os testes unitários de cada User Story (`T007` [US1], `T011` [US2], `T012` [US2], `T015` [US3]) em `tests/calc.test.js` podem ser desenvolvidos em paralelo às alterações de UI em `index.html` assim que a Phase 2 (`assets/calc.js`) estiver concluída.

---

## Parallel Example: User Story 2

```bash
# Após concluir Phase 2 (assets/calc.js), executar em paralelo:
Task T011: "Adicionar testes unitários em tests/calc.test.js para evaluateHrSample"
Task T012: "Adicionar testes unitários em tests/calc.test.js para computeStableStageHr"
Task T013: "Integrar RollingHrWindow e evaluateHrSample no handler onValue em index.html"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Concluir Phase 1 (Setup) e Phase 2 (Foundational em `assets/calc.js`).
2. Concluir Phase 3 (User Story 1 — Isolamento do sensor, validação de serviço `0x180D` e trava de sessão `DeviceSessionLock`).
3. **STOP & VALIDATE**: Confirmar pareamento limpo e bloqueio de colisão/dispositivos incompatíveis.

### Incremental Delivery

1. **Foundation (`T001–T006`)**: Funções puras determinísticas prontas em `assets/calc.js`.
2. **Incremento 1 (`T007–T010` - US1)**: Isolamento de conexão e vínculo exclusivo de sessão.
3. **Incremento 2 (`T011–T014` - US2)**: Filtragem de mau contato/spikes e média aparada dos últimos 15s por estágio.
4. **Incremento 3 (`T015–T017` - US3)**: Reconexão silenciosa automática com backoff e diagnóstico visual de qualidade do sinal.
5. **Polish (`T018–T019`)**: Validação automatizada completa e revisão mobile-first.

