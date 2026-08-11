# Tasks: Fase 2B — Relatório Completo em PDF

**Input**: Design documents from `/specs/004-fase2b-relatorio-pdf/`

**Prerequisites**: plan.md, spec.md

**Tests**: Sem cálculo numérico novo — verificação manual/Playwright (Phase 3).

## Phase 1: Estrutura e CSS

- [ ] T001 [P] Em `index.html`, adicionar `<div id="reportView" class="hidden">`
  dentro de `<main>` (após a última seção de aba).
- [ ] T002 [P] Adicionar regra CSS: em `@media print`, quando `body` tem
  `report-mode`, esconder `main>section.tab-panel` e mostrar `#reportView`.
- [ ] T003 Adicionar botão "📄 Gerar Relatório Completo (PDF)" ao lado do
  `#btnPrint` existente na aba Plano.

## Phase 2: Composição do relatório (User Story 1)

- [ ] T004 [US1] Criar `renderReport()` em `index.html`: monta o HTML de
  `#reportView` a partir de `state.profile`, `state.screen`
  (+`classifySpo2`/`classifyGlicose`), `state.test`+`diagnose()`,
  `state.tte` (se existir), `zonesData()`+`ZMETA`, `planSessions()`+
  `DAYS_BY_N`.
- [ ] T005 [US1] Tratar ausência de `state.test`: relatório exibe mensagem
  simples ("conclua o teste incremental") em vez de quebrar.
- [ ] T006 [US1] Handler do novo botão: chama `renderReport()`, adiciona
  `report-mode` ao `<body>`, chama `window.print()`, remove a classe em
  seguida.

**Checkpoint**: Clicar no botão a partir de qualquer aba produz o mesmo
relatório completo no diálogo de impressão.

## Phase 3: Verificação

- [ ] T007 `npm test` — confirmar 16/16 (nenhuma fórmula mudou).
- [ ] T008 Verificação manual no navegador (Playwright): gerar dados
  completos (perfil, triagem, teste, tolerância, plano), clicar no botão a
  partir de uma aba diferente de Plano, e inspecionar `#reportView` para
  confirmar que todas as seções aparecem com os dados corretos; confirmar
  que o fluxo normal de abas e o `#btnPrint` original continuam
  funcionando.

## Dependencies

- Phase 2 depende da estrutura da Phase 1.
- Phase 3 depende de ambas.
