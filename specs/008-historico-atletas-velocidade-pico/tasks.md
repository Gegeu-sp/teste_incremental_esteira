---

description: "Task list for Banco de Dados de Atletas (Firestore), Comparação de Evolução e Regra de Estágio Completo no vPico"
---

# Tasks: Banco de Dados de Atletas (Firestore), Comparação de Evolução e Regra de Estágio Completo no vPico

**Input**: Design documents from `/specs/008-historico-atletas-velocidade-pico/`  
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/athletes-firestore-and-vpeak.md, quickstart.md  
**Tests**: Obrigatórios conforme `spec.md` (`FR-002`, `SC-004`) e Constitution v2.0.0 (Princípio IV — Precisão Numérica Testável).  
**Organization**: Tarefas agrupadas por fase e User Story (`US1`, `US2`, `US3`) para permitir implementação e validação incremental independente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode ser executada em paralelo (arquivos distintos, sem dependências de tarefas incompletas)
- **[Story]**: Rótulo da User Story correspondente (`[US1]`, `[US2]`, `[US3]`)
- Caminhos exatos de arquivo incluídos em todas as tarefas (`assets/calc.js`, `tests/calc.test.js`, `index.html`, `firestore.rules`, `firebase.json`)

---

## Phase 1: Setup (Shared Infrastructure & Firebase Firestore Provisioning)

**Purpose**: Configurar as regras de segurança e o mapeamento do Cloud Firestore no projeto `teste-incremental-56aeb`.

- [x] T001 Executar a suíte de testes atual (`node --test tests/*.test.js`) para validar a linha de base antes das alterações em `tests/calc.test.js`
- [x] T002 [P] Criar o arquivo de regras do Cloud Firestore para a coleção `athletes` (validando `name` obrigatório com mínimo de 2 caracteres e estrutura de documento `AthleteDocument`) em `firestore.rules`
- [x] T003 Atualizar a configuração do Firebase para incluir `"firestore": { "rules": "firestore.rules" }` e adicionar `"firestore.rules"` à lista `hosting.ignore` em `firebase.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implementar e exportar as funções puras determinísticas `computeVPeak` e `compareAssessments` em `assets/calc.js`, que servem de alicerce para o fechamento do teste incremental (`US1`) e para o comparativo de evolução (`US3`).

**⚠️ CRITICAL**: Nenhuma integração de User Story em `index.html` deve começar antes da conclusão desta fase.

- [x] T004 Implementar a função pura `computeVPeak(startV, completedStages)` em `assets/calc.js` obedecendo às regras de `data-model.md`: (1) se `completedStages` tiver 1 ou mais estágios concluídos, `vPeak` DEVE ser igual a `+completedStages[completedStages.length - 1].v` (ou `+(startV + completedStages.length - 1)` se `.v` ausente), retornando `{ vPeak, completedStagesCount: completedStages.length, usedPreviousStage: true, fallbackToStart: false }` sem jamás somar o estágio em curso interrompido antes de completar `120.000 ms`; (2) se `completedStages` estiver vazio (`0` estágios completos), retornar `{ vPeak: +(+startV || 0).toFixed(2), completedStagesCount: 0, usedPreviousStage: false, fallbackToStart: true }`
- [x] T005 Implementar a função pura `compareAssessments(baseAssessment, currentAssessment)` em `assets/calc.js` obedecendo a `data-model.md`: retornar `null` se `!baseAssessment` ou `!currentAssessment`; calcular `MetricDelta` (`{ base, curr, delta: curr - base (arredondado a 2 casas), pct: ((curr - base) / base) * 100 (arredondado a 1 casa) }`) para `vPeak`, `vo2max`, `mets`, `vt1V`, `vt2V`, `fcVT1`, `fcVT2`, `tteSec`, `weight` e `restHr`; gerar `stageComparison` ordenado por velocidade `v` crescente com `{ v, baseHr, currHr, deltaHr, baseRpe, currRpe, deltaRpe }`
- [x] T006 Exportar `computeVPeak` e `compareAssessments` no bloco `module.exports` de `assets/calc.js`

**Checkpoint**: Funções puras `computeVPeak` e `compareAssessments` prontas e exportadas em `assets/calc.js`.

---

## Phase 3: User Story 1 - Considerar Apenas o Último Estágio Concluído quando o Teste é Interrompido (Priority: P1) 🎯 MVP

**Goal**: Garantir que, quando o teste incremental for interrompido/encerrado antes de o atleta concluir os 2 minutos do estágio atual, a velocidade de pico (`vPico / vVO₂max`) seja exatamente a velocidade do estágio anterior concluído, sem somar o estágio incompleto nem fração proporcional.

**Independent Test**: Executar `node --test tests/calc.test.js` e iniciar um teste incremental em `index.html` a `8,0 km/h`, avançar/concluir os estágios de `8,0 km/h` e `9,0 km/h`, e clicar em "⏹ Encerrar" durante o estágio de `10,0 km/h`, verificando que `vPico` registra exatamente `9,0 km/h`.

### Tests for User Story 1 ⚠️

- [x] T007 [P] [US1] Adicionar testes unitários em `tests/calc.test.js` para `computeVPeak` cobrindo: (a) teste interrompido no meio do 3º estágio (`10 km/h`) após concluir os estágios de `8 km/h` e `9 km/h` → retorna `vPeak: 9` (`usedPreviousStage: true`), (b) teste interrompido após concluir apenas o 1º estágio (`8 km/h`) enquanto corria a `9 km/h` → retorna `vPeak: 8`, (c) teste interrompido antes de concluir o 1º estágio (`completedStages = []`) → retorna `vPeak: startV` (`fallbackToStart: true`), e (d) integração de `vPeak` com `vo2At`, `deriveVTs` e `computeZones`

### Implementation for User Story 1

- [x] T008 [US1] Atualizar `finishTest()` em `index.html` para substituir o cálculo fracionário antigo (`startV + tmr.stage + frac`) por `computeVPeak(startV, tmr.stages)`, alertando o avaliador caso nenhum estágio de 2 minutos tenha sido concluído (`tmr.stages.length === 0`) e exibindo nos resultados a indicação clara de que o `vPico` corresponde ao último estágio completo de 2 minutos

**Checkpoint**: User Story 1 concluída e validada — `vPico` respeita estritamente o último estágio completo de 2 minutos.

---

## Phase 4: User Story 2 - Salvar, Buscar e Reabrir Perfis e Avaliações de Atletas no Banco de Dados (Priority: P1)

**Goal**: Persistir exclusivamente em nuvem no Firebase Firestore (`teste-incremental-56aeb`, coleção `athletes`) o cadastro dos atletas e o histórico completo de suas avaliações, permitindo salvar, buscar pelo nome, iniciar uma nova avaliação para um atleta existente ou reabrir qualquer avaliação passada em todas as abas do RunLab.

**Independent Test**: Preencher e salvar um atleta na nuvem em `index.html`, limpar a tela ou criar um segundo atleta, abrir a aba `8 · Atletas & Evolução`, buscar o primeiro atleta no Firestore e clicar em "Reabrir" (restaurando todas as abas) ou "Nova avaliação" (mantendo apenas o perfil cadastral).

### Implementation for User Story 2

- [x] T009 [US2] Adicionar o carregamento do Firebase JS SDK (App + Cloud Firestore via CDN gstatic) e implementar o módulo `AthleteCloudDB` (`init`, `listAthletes`, `saveCurrentAssessment`, `startNewAssessmentForAthlete`, `loadAssessment`, `deleteAssessment`, `deleteAthlete`, `exportBackupJson`, `importBackupJson`) em `index.html` obedecendo às regras de `data-model.md` (`profile.name` obrigatório com mínimo de 2 caracteres após `trim()`, normalização `nameLower`, `AthleteDocument` e `AssessmentSnapshot`)
- [x] T010 [US2] Adicionar o botão global `"☁ Salvar na Nuvem"` (`#btnSaveCloud`) e indicador do atleta ativo no cabeçalho de `index.html`, além do botão de navegação para a nova aba **`8 · Atletas & Evolução`** (`data-tab="atletas"`)
- [x] T011 [US2] Criar a seção `#tab-atletas` em `index.html` contendo: busca de atletas por nome (`#athSearchInput`), botão de salvar avaliação atual com rótulo opcional (`#btnSaveCurrentToCloud`), listagem de atletas do Firestore (`#athListContainer`) com histórico expansível de avaliações datadas, botões **"Nova avaliação"**, **"Reabrir avaliação"** e **"Excluir"**, mais ações de exportar/importar backup JSON

**Checkpoint**: User Story 2 concluída — banco de dados em nuvem no Firebase Firestore salvando, listando e reabrindo perfis e avaliações de múltiplos atletas.

---

## Phase 5: User Story 3 - Comparar Avaliações de um Mesmo Atleta (Evolução Temporal) (Priority: P2)

**Goal**: Permitir selecionar duas avaliações históricas de um mesmo atleta salvo no Firestore (ex.: Avaliação Anterior vs. Avaliação Atual) e visualizar lado a lado os deltas absolutos/percentuais (`Δ vPico`, `Δ VO₂máx`, `Δ METs`, `Δ VT1`, `Δ VT2`, `Δ tlim`, `Δ Peso`, `Δ FC repouso`) e a tabela comparativa de FC e RPE por velocidade (`km/h`).

**Independent Test**: Executar `node --test tests/calc.test.js` e selecionar duas avaliações de um atleta na aba `8 · Atletas & Evolução` de `index.html`, verificando a exibição exata dos campos de evolução e da tabela pareada de FC por estágio de velocidade.

### Tests for User Story 3 ⚠️

- [x] T012 [P] [US3] Adicionar testes unitários em `tests/calc.test.js` para `compareAssessments` cobrindo: (a) cálculo de deltas positivos e negativos (`vPeak`, `vo2max`, `mets`, `vt1V`, `vt2V`, `fcVT1`, `fcVT2`, `tteSec`, `weight`, `restHr`), (b) pareamento de estágios por velocidade `v` (`km/h`) com cálculo de `deltaHr` (redução de FC na mesma velocidade) e `deltaRpe`, e (c) tratamento defensivo quando uma das avaliações não possui `tte` ou `vt1V`

### Implementation for User Story 3

- [x] T013 [US3] Implementar o painel visual de Comparação de Evolução (`#athComparePanel`) dentro de `#tab-atletas` em `index.html`, com seletores de Avaliação Base (Anterior) e Avaliação Atual, cards de evolução com indicadores visuais de melhora (`Δ vPico`, `Δ VO₂máx`, `Δ VT1`, `Δ RCP/VT2`, `Δ tlim`, `Δ Peso`, `Δ FC repouso`) e tabela pareada de frequência cardíaca e RPE por velocidade (`km/h`)

**Checkpoint**: Todas as User Stories (`US1`, `US2`, `US3`) concluídas e integradas.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validação final de testes automatizados, sintaxe de scripts e documentação.

- [x] T014 Executar a suíte completa de testes automatizados (`npm test` / `node --test tests/*.test.js`) e verificar 100% de aprovação sem regressões em `tests/calc.test.js`
- [x] T015 Validar sintaxe de todos os scripts inline e responsividade mobile-first da aba `8 · Atletas & Evolução` em `index.html`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Inicia imediatamente (`T001`, `T002`, `T003`).
- **Foundational (Phase 2)**: Depende de `T001` — bloqueia o início das fases de User Story (`T004`, `T005`, `T006` em `assets/calc.js`).
- **User Story 1 (Phase 3 - P1 🎯 MVP)**: Depende da Phase 2 (`T007` → `T008`).
- **User Story 2 (Phase 4 - P1)**: Depende da Phase 1 (`T002`, `T003`) e Phase 2 (`T009` → `T010` → `T011`).
- **User Story 3 (Phase 5 - P2)**: Depende da Phase 2 (`T005`) e da estrutura da aba de atletas da US2 (`T012` → `T013`).
- **Polish (Phase 6)**: Depende da conclusão das Fases 3, 4 e 5 (`T014` → `T015`).

### Parallel Opportunities

- `T002` (`firestore.rules`) pode rodar em paralelo a `T001`.
- Após a Phase 2 (`assets/calc.js`), as tarefas de testes unitários `T007` (`[US1]`) e `T012` (`[US3]`) em `tests/calc.test.js` podem ser executadas em paralelo à implementação de UI/Firestore em `index.html` (`T008`–`T011`).

---

## Parallel Example: User Stories 1 & 3 Tests

```bash
# Após concluir Phase 2 (assets/calc.js), executar em paralelo:
Task T007: "Adicionar testes unitários em tests/calc.test.js para computeVPeak"
Task T012: "Adicionar testes unitários em tests/calc.test.js para compareAssessments"
Task T009: "Implementar o módulo AthleteCloudDB em index.html"
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2)

1. Concluir Phase 1 (Setup Firestore Rules) e Phase 2 (Foundational em `assets/calc.js`).
2. Concluir Phase 3 (`US1` — Regra de `vPico` considerando apenas o último estágio completo de 2 minutos).
3. Concluir Phase 4 (`US2` — Persistência em nuvem de atletas e avaliações no Firebase Firestore).
4. Adicionar Phase 5 (`US3` — Comparação longitudinal de evolução entre avaliações) e Phase 6 (Validação final).

