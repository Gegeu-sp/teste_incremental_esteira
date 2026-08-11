# Tasks: Progresso do Teste + Velocidade no Plano

**Input**: Design documents from `/specs/006-progresso-teste-velocidade-plano/`

**Prerequisites**: plan.md, spec.md

**Tests**: Sem cálculo numérico novo — verificação manual/Playwright (Phase 4).

## Phase 1: User Story 2 - Estágio nasce no início (Priority: P1, bloqueia US1)

- [ ] T001 [US2] Em `index.html`, `btnStart`: empurrar a entrada do
  estágio 1 em `tmr.stages` ao iniciar; chamar `renderStageRows()`.
- [ ] T002 [US2] Em `loop()`: inverter a ordem — `tmr.stage++` antes de
  empurrar a nova entrada (representa o estágio que está começando);
  remover/inline `completeStage()`.
- [ ] T003 [US2] Confirmar que `finishTest()` inclui o estágio em
  andamento no momento da exaustão em `state.test.stages` (deve já
  funcionar por consequência de T001/T002 — validar, não deveria exigir
  mudança de código).

**Checkpoint**: `#stHrNow`/tabela editáveis desde o estágio 1; estágio
final (exaustão no meio) aparece no resultado.

## Phase 2: User Story 1 - Progresso persistente (Priority: P1)

- [ ] T004 [US1] Adicionar `state.liveTest` ao objeto de estado inicial e
  à restauração do `localStorage` (mesmo padrão de `state.screen`/
  `state.tteVitals`).
- [ ] T005 [US1] Criar `saveLiveTest()`: monta snapshot
  `{stage,stageMs,totalMs,stages,tStart}` de `tmr` em `state.liveTest` e
  chama `save()`. Chamar em: conclusão de estágio (dentro do `loop()`),
  toggle de pausa (`btnPause`), edições de FC/RPE/Talk Test (tabela e
  `#stHrNow`).
- [ ] T006 [US1] Ao carregar a página: se `state.liveTest` existir e não
  houver `state.test` mais recente para ele (teste não finalizado),
  restaurar `tmr` a partir do snapshot com `paused=true`, chamar
  `updTimerUI()`/`renderStageRows()`/`drawChart()`/`syncStHrNow()`, e
  exibir um aviso curto (ex. banner acima do timer) indicando a
  restauração.
- [ ] T007 [US1] Limpar `state.liveTest` (`=null`, `save()`) em
  `finishTest()` e no handler de `btnRedo`.

**Checkpoint**: reload no meio do teste preserva estágios e FC; teste
restaura em pausa com aviso; "Retomar" volta a contar.

## Phase 3: User Story 3 - Velocidade em cada trecho (Priority: P2)

- [ ] T008 [P] [US3] Em `planSessions()`: adicionar velocidade aos passos
  de `rod`, `longao`, `rec` (mono-zona, usando o `zTarget` já usado no
  card).
- [ ] T009 [P] [US3] Em `fartlek`: velocidade no aquecimento (Z2), nos
  blocos alternados (Z4/Z1) e na volta à calma.
- [ ] T010 [P] [US3] Em `ritmoLivre`: adicionar faixa de referência solta
  (Z1–Z2) sem travar a velocidade.
- [ ] T011 [P] [US3] Em `intervaladoZ4`, `hiitLongoRCP`, `hiitCurto`,
  `tempo` (fallback): velocidade no aquecimento (Z2) e na volta à calma
  (Z1) — bloco principal já tem.
- [ ] T012 [P] [US3] Em `rst`, `sit`: adicionar zona+velocidade no
  aquecimento (Z2) e na volta à calma (Z1).

**Checkpoint**: todo passo de todo método mostra velocidade quando
referencia uma zona.

## Phase 4: Verificação

- [ ] T013 `npm test` — confirmar 16/16.
- [ ] T014 Playwright: cenário completo de US1+US2 (iniciar, completar 2
  estágios com FC, reload, restaurar, retomar, encerrar no meio de um
  estágio) e cenário de US3 (velocidade em pelo menos 3 métodos
  diferentes).

## Dependencies

- Phase 1 bloqueia Phase 2 (o snapshot de `tmr.stages` só faz sentido
  completo com o novo ciclo de vida de estágio).
- Phase 3 é independente das demais.
- Phase 4 depende de todas.
