# Tasks: Ajustes pós-lançamento — Capacidade, Mobile e Registro de FC

**Input**: Design documents from `/specs/005-ajustes-pos-lancamento/`

**Prerequisites**: plan.md, spec.md

**Tests**: Sem cálculo numérico novo — verificação manual/Playwright (Phase 4).

## Phase 1: User Story 1 - Capacidade demonstrada no plano (Priority: P1)

- [ ] T001 [US1] Em `index.html`, `planSessions()`: criar
  `capacityCapMin(totalSec)` (retorna 15/25/40/null pelos degraus do spec).
- [ ] T002 [US1] Criar `fmtDur(min,max,cap)` para formatar duração
  respeitando o teto (piso de 15 min).
- [ ] T003 [US1] Aplicar `fmtDur` em `rod`, `longao`, `rec`, `fartlek`,
  `intervaladoZ4`, `hiitLongoRCP`, `hiitCurto`, `tempo` (fallback).
- [ ] T004 [US1] Em `renderPlan()`, exibir aviso quando o teto estiver
  ativo (duração reduzida em relação ao padrão da fase).

**Checkpoint**: Teste curto (<6min) → nenhuma sessão contínua > 15min +
aviso; teste dentro do ideal (10-15min) → comportamento igual ao atual.

## Phase 2: User Story 2 - Mobile sem overflow (Priority: P2)

- [ ] T005 [P] [US2] Em `renderResults()`, `#resGrid`: grid
  `grid-cols-1 sm:grid-cols-2 md:grid-cols-4`, cards com `text-center`,
  valor com `break-words` e `text-lg` (em vez de `text-xl`).

**Checkpoint**: Screenshot em viewport 390px confirma texto contido.

## Phase 3: User Story 3 - Campo de FC em destaque (Priority: P1)

- [ ] T006 [US3] Em `index.html`, `#runArea`: adicionar `#stHrNow` (input
  grande) perto do `#tTime`.
- [ ] T007 [US3] Handler: escreve em
  `tmr.stages[tmr.stages.length-1].hr`, chama `renderStageRows()` e
  `drawChart()`.
- [ ] T008 [US3] Sincronizar no sentido contrário: editar a FC na tabela
  de estágios (já existente) também atualiza `#stHrNow` quando for o
  último estágio.

**Checkpoint**: Digitar em qualquer um dos dois campos atualiza o outro.

## Phase 4: Verificação

- [ ] T009 `npm test` — confirmar 16/16.
- [ ] T010 Playwright: cenários de capacidade (US1), overflow mobile
  (US2, viewport 390×844) e sincronização de FC (US3).

## Dependencies

- Phases 1–3 são independentes entre si (áreas diferentes do mesmo
  arquivo).
- Phase 4 depende de todas.
