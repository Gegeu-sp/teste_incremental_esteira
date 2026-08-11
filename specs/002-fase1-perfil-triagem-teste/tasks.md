# Tasks: Fase 1 — Perfil, Triagem, Teste Incremental e Tolerância

**Input**: Design documents from `/specs/002-fase1-perfil-triagem-teste/`

**Prerequisites**: plan.md, spec.md

**Tests**: Solicitados pela Constitution (Princípio IV) — incluídos.

## Phase 1: Foundational — funções puras em calc.js (bloqueia US2)

- [ ] T001 Adicionar `classifySpo2(pct)` em `assets/calc.js`: retorna
  `{level, label}` com `level` em `'contraindicado' | 'ressalva' | 'normal'`
  (< 90 → contraindicado; 90–94 → ressalva; ≥ 95 → normal; vazio/NaN →
  `'sem-dado'`).
- [ ] T002 Adicionar `classifyGlicose(mgdl)` em `assets/calc.js`: retorna
  `{level, label}` (< 70 ou > 300 → ressalva com nota de conduta; 70–300 →
  normal; vazio → `'sem-dado'`, já que é opcional).
- [ ] T003 Exportar as duas novas funções no bloco `module.exports` existente.

## Phase 2: User Story 1 - Perfil (Priority: P2)

- [ ] T004 [US1] Em `index.html`, remover `#pHrMax` e seu `<label>` do
  `#tab-perfil`.
- [ ] T005 [US1] Adicionar campo `#pHeight` (Altura, cm) no mesmo grid.
- [ ] T006 [US1] Atualizar `pFields` (remover `pHrMax:'hrMax'`, adicionar
  `pHeight:'height'`).

**Checkpoint**: Perfil sem FC máxima, com Altura, persistindo em localStorage.

## Phase 3: User Story 2 - Triagem com SpO₂/glicose (Priority: P1) 🎯

### Tests (Princípio IV)

- [ ] T007 [P] [US2] `tests/calc.test.js` — `classifySpo2`: 89/90/94/95 e
  vazio.
- [ ] T008 [P] [US2] `tests/calc.test.js` — `classifyGlicose`: 69/70/300/301 e
  vazio.

### Implementation

- [ ] T009 [US2] Em `index.html`, adicionar campos `#sSpo2` e `#sGlicose` no
  grid de repouso da Triagem (depende de T001/T002).
- [ ] T010 [US2] Estender `renderScreen()` para exibir a leitura de
  SpO₂/glicose (mesmo padrão das linhas de PA/FC existentes).
- [ ] T011 [US2] Estender a lógica do `verdict` em `renderScreen()` para
  incorporar `classifySpo2`/`classifyGlicose` nos três níveis já existentes
  (contraindicado / ressalvas / liberado), sem alterar os critérios de PA e
  sintomas já implementados.

**Checkpoint**: Parecer da Triagem reage a SpO₂/glicose conforme os cenários
do spec (US2).

## Phase 4: User Story 3 - Resposta hemodinâmica + tabela de METs (Priority: P2)

- [ ] T012 [P] [US3] Em `index.html`, adicionar card de referência de repouso
  (PA/FC/SpO₂ da Triagem) no topo do `#tab-teste`.
- [ ] T013 [P] [US3] Estender `METS_TBL` com linhas adicionais (12–16 km/h)
  calculadas via `vo2At()`.
- [ ] T014 [US3] Em `renderResults()`, adicionar card "Resposta Hemodinâmica"
  (FC repouso → FC pico do último estágio, com delta).

**Checkpoint**: Resultado do Teste Incremental mostra comparação repouso→pico;
tabela cobre velocidades > 11 km/h.

## Phase 5: User Story 4 - Vitais antes/depois da Tolerância (Priority: P2)

- [ ] T015 [US4] Em `index.html`, adicionar campos de PA/FC/SpO₂ "antes"
  (pré-preenchidos da Triagem, editáveis) no `#tab-tolerancia`.
- [ ] T016 [US4] Adicionar captura de PA/FC/SpO₂ "depois" no momento de
  "Parei — registrar" (`btnTteStop`).
- [ ] T017 [US4] Persistir `preVitals`/`postVitals` em `state.tte` e exibir
  ambos em `showTteResult()`.

**Checkpoint**: Resultado da Tolerância mostra vitais antes/depois lado a lado.

## Phase 6: Polish

- [ ] T018 Rodar `npm test` (todos os testes, existentes + novos).
- [ ] T019 Verificação manual no navegador (Playwright) cobrindo os 4
  cenários de aceitação do spec (US1–US4), incluindo revisão visual do
  `drawChart()` com um teste de vários estágios.

## Dependencies

- Phase 1 bloqueia Phase 3 (US2 usa `classifySpo2`/`classifyGlicose`).
- Phase 2, 4 e 5 são independentes entre si e de Phase 3 (podem ser feitas em
  qualquer ordem depois da Phase 1, mas seguimos a ordem de prioridade do
  spec: US2 (P1) primeiro, depois US1/US3/US4 (P2)).
- Phase 6 depende de todas as anteriores.
