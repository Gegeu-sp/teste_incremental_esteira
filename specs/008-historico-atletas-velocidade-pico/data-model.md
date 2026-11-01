# Data Model: Banco de Dados de Atletas (Firestore), Comparação e vPico por Estágio Completo

**Feature**: `specs/008-historico-atletas-velocidade-pico`  
**Date**: 2026-11-01

## Entidades e Estruturas de Dados

### 1. VPeakCalculationResult (Resultado do Cálculo de Velocidade de Pico)
Retornado pela função pura `computeVPeak(startV, completedStages)` em `assets/calc.js`.

```typescript
interface VPeakCalculationResult {
  vPeak: number;                // Velocidade do último estágio completo de 2 min (km/h), ex: 9.0
  completedStagesCount: number; // Quantidade de estágios de 2 min efetivamente concluídos
  usedPreviousStage: boolean;   // True quando havia estágios concluídos e o estágio em curso foi descartado
  fallbackToStart: boolean;     // True apenas se o teste foi interrompido antes de concluir o 1º estágio
}
```

### 2. AthleteDocument (Documento na Coleção `athletes` do Firebase Firestore)
Representa o cadastro persistente do atleta na nuvem (`athletes/{athleteId}`) e a coleção cronológica de suas avaliações.

```typescript
interface AthleteDocument {
  id: string;                   // ID único do documento no Firestore
  name: string;                 // Nome completo do atleta (obrigatório, min 2 caracteres)
  nameLower: string;            // Nome normalizado (minúsculas/sem acentos) para busca e ordenação
  profile: {
    name: string;
    age: number | string;
    sex: 'm' | 'f';
    weight: number | string;
    height: number | string;
    level: 'ini' | 'int' | 'ava';
    goal: string;
    hrMax: number | string;
  };
  assessments: AssessmentSnapshot[]; // Histórico de avaliações do atleta (ordenado por createdAtMs desc)
  createdAtMs: number;          // Timestamp epoch (ms) de criação do atleta
  updatedAtMs: number;          // Timestamp epoch (ms) da última atualização/avaliação
}
```

### 3. AssessmentSnapshot (Registro de Avaliação Completa do Atleta)
Representa uma sessão completa de avaliação salva no histórico do atleta no Firestore.

```typescript
interface AssessmentSnapshot {
  id: string;                   // ID único da avaliação (ex: "asmt_1730460000000_x8k2")
  createdAtMs: number;          // Timestamp epoch (ms)
  dateFormatted: string;        // Data legível pt-BR (ex: "01/11/2026")
  label?: string;               // Rótulo opcional (ex: "Avaliação Inicial", "Reavaliação 12 sem")
  profileSnapshot: {            // Foto dos dados antropométricos no dia do teste
    age: number | string;
    sex: 'm' | 'f';
    weight: number | string;
    height: number | string;
    level: string;
    hrMax: number | string;
  };
  screen: {                     // Dados da Triagem Pré-Participação
    pas: number | string;
    pad: number | string;
    fc: number | string;
    spo2: number | string;
    glicose: number | string;
    sym: boolean[];
    parq: boolean[];
    hist: boolean[];
    meds: string;
    notes: string;
  };
  test: {                       // Resultado do Teste Incremental de Esteira
    vPeak: number;              // Velocidade do último estágio completo de 2 min (km/h)
    vo2max: number;             // VO2máx estimado (ml/kg·min)
    mets: number;               // METs de pico
    totalSec: number;           // Tempo total corrido (segundos)
    startV: number;             // Velocidade inicial (km/h)
    hrMaxUsed: number;          // FC máxima utilizada para zonas (bpm)
    vt1V: number | null;        // Velocidade do VT1 (km/h)
    vt2V: number | null;        // Velocidade do RCP/VT2 (km/h)
    fcVT1: number | null;       // FC no VT1 (bpm)
    fcVT2: number | null;       // FC no RCP/VT2 (bpm)
    date: string;
    stages: Array<{
      v: number;                // Velocidade do estágio concluído (km/h)
      hr: number | null;        // FC ao final do estágio (bpm)
      rpe: number | null;       // RPE Borg 0-10
      tt: number | null;        // Talk Test (0, 1, 2)
      hrSrc?: string;
    }>;
  } | null;
  tte: {                        // Resultado do Teste de Tolerância (tlim @ vPico)
    sec: number;
    fcAntes?: number | string;
    fcDepois?: number | string;
    rpeDepois?: number | string;
  } | null;
  plan: {                       // Configuração da Prescrição Semanal
    freq: number;
    goal: 'cond' | 'cardio' | 'perf';
    phase: 'base' | 'construcao' | 'especifico' | 'transicao';
  };
}
```

### 4. AssessmentComparisonResult (Resultado Comparativo de Evolução)
Retornado pela função pura `compareAssessments(baseAssessment, currentAssessment)` em `assets/calc.js`.

```typescript
interface MetricDelta {
  base: number | null;
  curr: number | null;
  delta: number | null;         // curr - base (arredondado a 2 casas)
  pct: number | null;           // ((curr - base) / base) * 100 (arredondado a 1 casa)
}

interface StageComparisonRow {
  v: number;                    // Velocidade em comum ou da união dos estágios (km/h)
  baseHr: number | null;
  currHr: number | null;
  deltaHr: number | null;       // currHr - baseHr (negativo = menor FC para mesma velocidade = melhora!)
  baseRpe: number | null;
  currRpe: number | null;
  deltaRpe: number | null;
}

interface AssessmentComparisonResult {
  baseId: string;
  currId: string;
  baseDate: string;
  currDate: string;
  metrics: {
    vPeak: MetricDelta;
    vo2max: MetricDelta;
    mets: MetricDelta;
    vt1V: MetricDelta;
    vt2V: MetricDelta;
    fcVT1: MetricDelta;
    fcVT2: MetricDelta;
    tteSec: MetricDelta;
    weight: MetricDelta;
    restHr: MetricDelta;
  };
  stageComparison: StageComparisonRow[]; // Ordenado por velocidade v crescente
}
```

---

## Regras de Validação

1. **Cálculo de `vPeak` (`computeVPeak`)**:
   - Se `completedStages` tiver 1 ou mais estágios concluídos: `vPeak` DEVE ser igual a `+completedStages[completedStages.length - 1].v` (ou `+(startV + completedStages.length - 1)` se `.v` ausente). O estágio em curso interrompido antes de completar `120.000 ms` NUNCA é somado ao `vPeak`.
   - Se `completedStages` estiver vazio (`0` estágios completos): `vPeak` assume `+startV` com `fallbackToStart: true`.
2. **Persistência no Firestore**:
   - Exige `profile.name` preenchido (mínimo de 2 caracteres após `trim()`).
   - Ao salvar uma avaliação para um atleta já selecionado (`currentAthleteId`), adiciona/atualiza o `AssessmentSnapshot` no array `assessments` do documento `athletes/{currentAthleteId}` e atualiza `profile` e `updatedAtMs`.
   - Ao salvar sem `currentAthleteId` ativo, verifica se já existe atleta com mesmo `nameLower`; se existir, vincula ao atleta existente (ou cria novo documento em `athletes` se for um novo nome).

