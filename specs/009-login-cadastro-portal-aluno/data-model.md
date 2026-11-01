# Phase 1 Data Model: Sistema de Login, Central de Alunos e Fichas de Treino

**Feature**: `009-login-cadastro-portal-aluno`  
**Date**: 2026-11-01  
**Spec Reference**: [spec.md](./spec.md)

---

## 1. Entidades de Persistência no Cloud Firestore (`teste-incremental-56aeb`)

### 1.1 Coleção `professors` (Contas de Professores / Avaliadores)

Representa os profissionais cadastrados que possuem acesso administrativo e clínico para conduzir testes, gerenciar cadastros de alunos e prescrever treinos.

```typescript
interface ProfessorAccount {
  /** Identificador único do documento (gerado pelo Firestore ou hash do e-mail) */
  id: string;

  /** Nome completo do profissional (obrigatório, mín. 3 caracteres) */
  name: string;

  /** E-mail ou usuário de acesso (obrigatório, normalizado em minúsculas) */
  email: string;
  emailLower: string;

  /** Registro profissional opcional (ex.: CREF 123456-G/SP) */
  cref?: string;

  /** Hash SHA-256 da senha gerado no cliente via Web Crypto API */
  passwordHash: string;

  /** Data/Hora ISO 8601 de criação da conta */
  createdAt: string;

  /** Data/Hora ISO 8601 da última atualização */
  updatedAt: string;
}
```

**Regras de Validação no Cliente e Firestore**:
- `name`: string não vazia (`name.trim().length >= 3`).
- `email`: formato válido de e-mail ou identificador alfanumérico sem espaços (`emailLower.trim().length >= 3`).
- `passwordHash`: string hexadecimal com 64 caracteres (SHA-256).

---

### 1.2 Coleção `athletes` (Perfis Profissionais de Alunos com Credenciais)

Evolução do documento de atleta existente no Firestore. Mantém compatibilidade total com as avaliações já salvas da feature 008, adicionando credenciais de acesso ao Portal do Aluno, dados antropométricos adicionais e vínculo com o professor.

```typescript
interface AthleteDocument {
  /** ID único do documento no Firestore */
  id: string;

  /** Dados cadastrais e credenciais do aluno */
  profile: {
    /** Nome completo do atleta (obrigatório) */
    name: string;
    /** Nome em minúsculas para buscas eficientes */
    nameLower: string;

    /** Código alfanumérico de acesso do aluno (ex.: "CARLOS-842") */
    accessCode: string;
    accessCodeLower: string;

    /** PIN numérico de acesso do aluno (ex.: "1234" ou hash SHA-256) */
    pin: string;

    /** E-mail e/ou telefone do aluno (opcional) */
    email?: string;
    phone?: string;

    /** Dados biológicos e antropométricos */
    age?: number;
    sex?: 'M' | 'F' | 'outro';
    weight?: number;    // kg
    heightCm?: number;  // cm

    /** Parâmetros fisiológicos e de treino */
    trainingLevel?: 'sedentario' | 'recreacional' | 'treinado' | 'atleta';
    goal?: string;      // Objetivo principal do aluno
    restHr?: number;    // FC repouso (bpm)
    hrMax?: number;     // FC máxima conhecida (bpm)
    initialSpeed?: number; // km/h sugerido

    /** Anotações clínicas do professor */
    clinicalNotes?: string;

    /** ID do professor responsável pelo cadastro */
    professorId?: string;
    professorName?: string;
  };

  /** Histórico completo de avaliações (AssessmentSnapshot[]) */
  assessments: AssessmentSnapshot[];

  /** Timestamp da última atualização */
  updatedAt: string;
}
```

---

## 2. Modelos de Domínio e Prescrição de Treino (`assets/calc.js`)

### 2.1 Modelo da Ficha de Treino (`WorkoutPrescriptionCard`)

Estrutura retornada pela função determinística `generateWorkoutPrescriptions(assessment)`:

```typescript
interface WorkoutPrescriptionCard {
  /** Identificador único do tipo de treino (ex: 'rec-z1', 'base-z2', 'tempo-z3', 'hiit-long-z4', 'hiit-short', 'speed-z5') */
  id: string;

  /** Categoria do treino: 'continuo' | 'tempo' | 'intervalado' | 'regenerativo' */
  category: 'continuo' | 'tempo' | 'intervalado' | 'regenerativo';

  /** Nome do treino em destaque (ex.: "Rodagem de Base Aeróbia", "HIIT Longo VO2máx") */
  title: string;

  /** Zona alvo correspondente (ex.: "Z2", "Z3", "Z4", "Z5", "Z1") */
  targetZone: string;

  /** Cor visual associada da zona ('blue' | 'green' | 'amber' | 'orange' | 'rose') */
  colorTheme: string;

  /** Descrição clara do objetivo fisiológico para o aluno */
  goalDescription: string;

  /** Velocidade principal prescrita para a esteira em km/h (arredondada a 1 casa decimal) */
  mainSpeedKmh: number;

  /** Pace equivalente em min/km (formato "M:SS") */
  mainPaceStr: string;

  /** Faixa de BPM esperada (ex: "142 – 156 bpm") */
  mainHrRangeStr: string;
  mainHrMin: number;
  mainHrMax: number;

  /** Percepção de esforço esperada (Escala Borg / RPE) */
  rpeDescription: string;

  /** Critério de respiração / Talk Test */
  talkTest: string;

  /** Duração total recomendada da sessão (ex: 45) */
  totalDurationMin: number;

  /** Velocidade de recuperação em km/h (para intervalados) */
  recoverySpeedKmh?: number;
  recoveryPaceStr?: string;

  /** Etapas detalhadas passo a passo para execução na esteira */
  steps: WorkoutStep[];
}

interface WorkoutStep {
  /** Fase: 'warmup' (aquecimento), 'main' (estímulo), 'recovery' (recuperação), 'cooldown' (volta à calma) */
  phase: 'warmup' | 'main' | 'recovery' | 'cooldown';

  /** Rótulo da etapa (ex: "Aquecimento", "Tiro 1 de 4", "Recuperação Ativa", "Desaquecimento") */
  label: string;

  /** Duração em minutos ou segundos */
  durationStr: string;

  /** Velocidade da esteira nesta etapa */
  speedKmh: number;

  /** Pace equivalente */
  paceStr: string;

  /** Orientação prática para o aluno */
  instruction: string;
}
```

---

## 3. Modelo de Sessão de Autenticação no Navegador (`localStorage`)

```typescript
interface AuthSession {
  /** Papel do usuário logado */
  role: 'professor' | 'student';

  /** ID do usuário (professor ID ou athlete ID) */
  userId: string;

  /** Nome de exibição */
  displayName: string;

  /** E-mail ou código de acesso */
  loginIdentifier: string;

  /** Timestamp de quando o login foi realizado */
  loginAt: number;

  /** Dados adicionais em cache do atleta (quando role === 'student') */
  studentSnapshot?: {
    athleteId: string;
    accessCode: string;
    latestAssessment?: AssessmentSnapshot;
  };
}
```

