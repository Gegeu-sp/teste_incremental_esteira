# Contract: Velocidade de Pico por Estágio Completo, Comparação de Evolução e Repositório Firestore

**Feature**: `specs/008-historico-atletas-velocidade-pico`  
**Date**: 2026-11-01

## 1. Pure Functions Contract (`assets/calc.js`)

Funções puras determinísticas exportadas em `assets/calc.js` e testadas em `tests/calc.test.js` (Princípio IV).

### 1.1 `computeVPeak(startV, completedStages)`

Calcula a velocidade de pico (`vPico` / `vVO₂max`) considerando exclusivamente os estágios completos de 2 minutos. Quando o teste é interrompido durante um estágio em andamento, o estágio incompleto é ignorado e prevalece a velocidade do estágio anterior concluído.

```javascript
/**
 * @param {number} startV - Velocidade inicial configurada (km/h)
 * @param {Array<{ v?: number }>} completedStages - Lista de estágios de 2 minutos efetivamente concluídos
 * @returns {{
 *   vPeak: number,
 *   completedStagesCount: number,
 *   usedPreviousStage: boolean,
 *   fallbackToStart: boolean
 * }}
 */
function computeVPeak(startV, completedStages)
```

**Comportamento contratual**:
- Se `Array.isArray(completedStages)` e `completedStages.length > 0`:
  - `last = completedStages[completedStages.length - 1]`
  - `vPeak = typeof last?.v === 'number' && Number.isFinite(last.v) ? +last.v.toFixed(2) : +((+startV || 0) + completedStages.length - 1).toFixed(2)`
  - Retorna `{ vPeak, completedStagesCount: completedStages.length, usedPreviousStage: true, fallbackToStart: false }`.
- Se `completedStages` estiver vazio (`length === 0`):
  - Retorna `{ vPeak: +(+startV || 0).toFixed(2), completedStagesCount: 0, usedPreviousStage: false, fallbackToStart: true }`.

---

### 1.2 `compareAssessments(baseAssessment, currentAssessment)`

Compara duas avaliações históricas de um mesmo atleta (`baseAssessment` = referência/anterior, `currentAssessment` = atual/reavaliação) e retorna os deltas absolutos, percentuais e a tabela comparativa de FC/RPE por velocidade (`km/h`).

```javascript
/**
 * @param {AssessmentSnapshot} baseAssessment
 * @param {AssessmentSnapshot} currentAssessment
 * @returns {AssessmentComparisonResult | null}
 */
function compareAssessments(baseAssessment, currentAssessment)
```

**Comportamento contratual**:
- Se `!baseAssessment` ou `!currentAssessment`: retorna `null`.
- Calcula `MetricDelta` (`{ base, curr, delta, pct }`) para:
  - `vPeak`, `vo2max`, `mets`, `vt1V`, `vt2V`, `fcVT1`, `fcVT2` (extraídos de `.test`)
  - `tteSec` (extraído de `.tte?.sec`)
  - `weight` (extraído de `.profileSnapshot?.weight`)
  - `restHr` (extraído de `.screen?.fc`)
- Constrói `stageComparison` ordenando todas as velocidades `v` distintas presentes em `baseAssessment.test?.stages` e `currentAssessment.test?.stages`, calculando `deltaHr = (currHr != null && baseHr != null) ? currHr - baseHr : null` e `deltaRpe`.

---

## 2. Cloud Firestore Repository & UI Contract (`index.html`)

### 2.1 Módulo `AthleteCloudDB`
Gerencia a persistência em nuvem na coleção `athletes` do Firebase Firestore (`teste-incremental-56aeb`).

```javascript
const AthleteCloudDB = {
  // Inicializa SDK do Firestore e retorna status da conexão
  init(): Promise<boolean>,

  // Lista todos os atletas cadastrados no Firestore (ordenados por updatedAtMs desc)
  listAthletes(): Promise<AthleteDocument[]>,

  // Salva o atleta atual e sua avaliação corrente no Firestore
  saveCurrentAssessment(label?: string): Promise<{ athlete: AthleteDocument, assessment: AssessmentSnapshot }>,

  // Carrega os dados de perfil de um atleta para iniciar uma NOVA avaliação em branco
  startNewAssessmentForAthlete(athleteId: string): Promise<void>,

  // Carrega uma avaliação histórica específica de um atleta em todas as abas do RunLab
  loadAssessment(athleteId: string, assessmentId: string): Promise<void>,

  // Exclui uma avaliação específica ou um atleta inteiro do Firestore
  deleteAssessment(athleteId: string, assessmentId: string): Promise<void>,
  deleteAthlete(athleteId: string): Promise<void>
};
```

### 2.2 Elementos de Interface (Aba / Painel de Atletas & Comparação)
- **Botão no Cabeçalho e na Aba Perfil/Teste**:
  - `#btnSaveCloud`: Salva o perfil e a avaliação atual diretamente no Firebase Firestore com feedback visual (`"Salvo na nuvem ✓"`).
  - Aba **`8 · Atletas & Evolução`** (`#tab-atletas` / `[data-tab="atletas"]`):
    - Campo de busca por nome (`#athSearchInput`), botão `"Atualizar lista"` e botão `"Salvar avaliação atual na nuvem"`.
    - Lista de atletas salvos no Firestore (`#athListContainer`) exibindo nome, idade/sexo, quantidade de testes realizados, último `vPico` / `VO₂máx` e ações rápidas:
      - **"Nova avaliação"** (mantém perfil do atleta e limpa triagem/teste para novo protocolo).
      - **"Ver histórico / Reabrir"** (lista todas as avaliações datadas do atleta para carregar na tela ou excluir).
      - **"Comparar evolução"** (seleciona 2 avaliações do atleta e renderiza os cards de evolução `Δ vPico`, `Δ VO₂máx`, `Δ VT1/VT2`, `Δ tlim`, `Δ Peso`, `Δ FC repouso` e a tabela comparativa de FC por velocidade `km/h`).

