# Tasks: Fase 2A — Diagnóstico/Interpretação e Biblioteca de Métodos

**Input**: Design documents from `/specs/003-fase2a-diagnostico-metodos/`

**Prerequisites**: plan.md, spec.md

**Tests**: Sem cálculo numérico novo nesta fase — verificação é manual/Playwright (ver Phase 3).

## Phase 1: User Story 1 - Zonas: diagnóstico e interpretação (Priority: P2)

- [ ] T001 [P] [US1] Em `index.html`, `renderZones()`: adicionar card de
  diagnóstico do VO₂máx reutilizando `diagnose(state.test.vo2max)`.
- [ ] T002 [P] [US1] Expandir os cards de VT1/RCP já existentes com explicação
  do mecanismo fisiológico (acidose metabólica / alcalose respiratória).
- [ ] T003 [P] [US1] Adicionar card "Comportamento da PA e FC no Treinamento"
  (conteúdo estático, grounded na apostila).
- [ ] T004 [P] [US1] Adicionar card "Testes para Avaliar o VO₂máx
  (referência)" listando Balke esteira/bicicleta, Cooper 12min, Caminhada 6min.
- [ ] T005 [P] [US1] Adicionar card "Importância da Avaliação Diagnóstica
  Clínica e Funcional".

**Checkpoint**: Aba Zonas com os 5 novos cards, visualmente consistentes com
o resto do app.

## Phase 2: User Story 2 - Prescrição: biblioteca de métodos (Priority: P2)

- [ ] T006 [US2] Em `index.html`, `planSessions()`: criar
  `metodoIntervaladoZ4(z, ph)` e usar na fase Construção no lugar da atual
  "Intervalos de VO₂máx".
- [ ] T007 [US2] Criar `metodoHiitLongoRCP(z, tlim)` (4min ~85% FCmáx/próximo
  ao RCP, recuperação 3min ~10% abaixo do RCP).
- [ ] T008 [US2] Criar `metodoHiitCurto(z, vPeak)` (20seg próximo à
  vPeak/vVO₂máx, recuperação 40seg ~10% abaixo do RCP).
- [ ] T009 [US2] Fase Específico: alternar a sessão de qualidade entre
  `metodoHiitLongoRCP` e `metodoHiitCurto` (por exemplo, por paridade da
  semana/posição na lista de sessões).
- [ ] T010 [US2] Criar `metodoRST()` e `metodoSIT()`.
- [ ] T011 [US2] Gating: `metodoRST`/`metodoSIT` só entram na lista de sessões
  quando `state.plan.goal==='perf' && state.plan.phase==='especifico' &&
  state.profile.level!=='ini'`, como sessão extra quando a frequência
  semanal permite (n ≥ 5).
- [ ] T012 [US2] Relabelar as sessões "Rodagem aeróbia"/"Longão" existentes
  como variantes do "Método Contínuo" e a sessão de fase `base` como
  "Fartlek", ajustando só os textos/títulos (sem mudar duração/zona-alvo já
  calculada).

**Checkpoint**: Planos gerados para as combinações do spec (US2, cenários
1–5) mostram os métodos corretos.

## Phase 3: Verificação

- [ ] T013 `npm test` — confirmar 16/16 (nenhuma fórmula mudou).
- [ ] T014 Verificação manual no navegador (Playwright): abrir Zonas após um
  teste concluído e conferir os 5 cards; gerar planos variando
  fase/objetivo/nível e conferir os métodos exibidos, incluindo a ausência de
  RST/SIT fora das condições do FR-004.

## Dependencies

- Phase 1 e Phase 2 são independentes entre si (arquivos/áreas diferentes da
  mesma tela).
- Phase 3 depende de ambas.
