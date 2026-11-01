# Technical Research: Banco de Dados em Nuvem (Firebase Firestore), Comparação de Evolução e Regra de Estágio Completo no vPico

**Feature**: `specs/008-historico-atletas-velocidade-pico`  
**Date**: 2026-11-01

## 1. Regra de Velocidade de Pico (`vPico` / `vVO₂max`) em Testes Interrompidos

### Contexto
No protocolo incremental de 2 minutos por estágio do RunLab (`+1,0 km/h` a cada 2 minutos completos), o código anterior em `finishTest()` (`index.html`) calculava:
```javascript
const frac = Math.min(1, tmr.stageMs / STAGE_MS);
const vPeak = +(startV + tmr.stage + frac).toFixed(2);
```
Isso gerava um erro fisiológico e de protocolo:
- Quando o Estágio 1 (`8,0 km/h`) terminava aos 2:00, `completeStage()` gravava `{ v: 8.0 }` em `tmr.stages` e incrementava `tmr.stage` para `1` (iniciando o Estágio 2 a `9,0 km/h`).
- Se o atleta interrompesse o teste aos 30 segundos do Estágio 2 (`9,0 km/h`, não concluído), a fórmula antiga calculava `8 + 1 + 0.25 = 9.25 km/h` — atribuindo ao atleta a velocidade do estágio `9,0 km/h` (que ele **não** completou) mais uma fração!
- Conforme especificado pelo usuário: **"quando o teste é interrompido e não concluído o estágio atual, o km/h a se considerar é o anterior"** (o último estágio completo de 2 minutos).

### Decisões Técnicas

#### Decisão 1: Função Pura `computeVPeak(startV, completedStages)` em `assets/calc.js`
- **Decisão**: Isolar o cálculo da velocidade de pico na função pura `computeVPeak(startV, completedStages)`:
  - Cada item em `completedStages` (`tmr.stages`) representa exclusivamente um estágio que completou os 2 minutos (`120.000 ms`) regulamentares.
  - Se `completedStages.length >= 1`: o `vPeak` é exatamente a velocidade do último estágio concluído (`completedStages[completedStages.length - 1].v`, equivalente a `startV + completedStages.length - 1`). Qualquer tempo parcial (`tmr.stageMs < STAGE_MS`) corrido no estágio atual interrompido é ignorado no cálculo de `vPeak` (sendo contabilizado apenas em `totalSec` para registro da duração total do esforço).
  - Se `completedStages.length === 0` (caso de borda: interrupção antes de concluir o 1º estágio de 2 minutos): retorna `startV` como piso mínimo de segurança com flag `{ vPeak: +startV, completedCount: 0, fallbackToStart: true }`.
- **Rationale**: Garante precisão fisiológica exata e 100% de cobertura por testes unitários em `tests/calc.test.js` (Princípio IV da Constitution).

---

## 2. Persistência Exclusivamente em Nuvem via Firebase Firestore

### Contexto
O projeto já está hospedado no Firebase (`teste-incremental-56aeb`). O usuário definiu que o banco de dados de atletas e histórico de avaliações deve operar **exclusivamente em nuvem via Firebase Firestore**, permitindo salvar os atletas que já fizeram o teste, acessar novamente seus dados de qualquer dispositivo e comparar evoluções.

### Decisões Técnicas

#### Decisão 2: Integração via Firebase JS SDK Modular (CDN ESM / Compat) e Auto-Configuração do Firebase Hosting
- **Decisão**: Carregar o SDK oficial do Firebase Firestore via CDN (sem bundler, respeitando o Princípio II da Constitution) e inicializar a conexão com o projeto `teste-incremental-56aeb` (suportando tanto a auto-configuração `/__/firebase/init.json` do Firebase Hosting quanto o objeto `firebaseConfig` explícito no `index.html` para funcionar também ao abrir localmente em desenvolvimento).
- **Estrutura de Coleções no Firestore**:
  - Coleção `athletes`: cada documento (`athleteId`) armazena os dados cadastrais atuais do atleta (`name`, `nameLower` para busca rápida, `age`, `sex`, `weight`, `height`, `level`, `goal`, `hrMax`, `updatedAt`, `createdAt`, `lastAssessmentSummary`) e o array ordenado de avaliações `assessments` (ou subcoleção/documento consolidado).
  - **Por que armazenar `assessments` dentro do documento do atleta (`athletes/{athleteId}`)**:
    - Cada avaliação tem ~1,5 KB de JSON. Mesmo que um atleta faça 50 avaliações ao longo de 10 anos, o documento terá < 75 KB (muito abaixo do limite de 1 MB por documento do Firestore).
    - Ler um atleta traz instantaneamente todo o seu histórico em **1 única leitura do Firestore**, tornando a abertura do perfil e a comparação entre testes imediata e sem custos extras de queries compostas ou índices complexos!
- **Rationale**: Simplicidade operacional, zero índices compostos obrigatórios, carregamento instantâneo do histórico completo do atleta e total aderência aos Princípios I e II da Constitution v2.0.0.

---

## 3. Motor de Comparação Longitudinal entre Avaliações (`compareAssessments`)

### Decisões Técnicas

#### Decisão 3: Função Pura `compareAssessments(baseRec, currRec)` em `assets/calc.js`
- **Decisão**: Implementar em `assets/calc.js` a função pura `compareAssessments(baseRec, currRec)` que recebe duas avaliações (`baseRec` = teste anterior/referência, `currRec` = teste mais recente/atual) e calcula deterministicamente:
  - **Deltas Globais** (`curr - base` e variação percentual `%`):
    - `weight`: Peso corporal (`kg`)
    - `restHr`: FC de repouso na triagem (`bpm`)
    - `vPeak`: Velocidade de pico validada (`km/h`) e pace correspondente
    - `vo2max`: VO₂máx estimado (`ml/kg·min`) e `mets`
    - `vt1V` e `fcVT1`: Velocidade e FC do 1º limiar ventilatório (`VT1`)
    - `vt2V` e `fcVT2`: Velocidade e FC do 2º limiar / RCP (`VT2`)
    - `tteSec`: Tempo limite no teste de tolerância (`segundos`)
  - **Comparativo Pareado por Estágio de Velocidade (`stageComparison`)**:
    - Une todas as velocidades (`v` em `km/h`) presentes em `baseRec.test.stages` e `currRec.test.stages`.
    - Para cada velocidade `v`, apresenta `{ v, baseHr, currHr, deltaHr, baseRpe, currRpe, deltaRpe }`.
    - Uma redução de FC (`deltaHr < 0`) na mesma velocidade submáxima indica **melhora na economia de corrida / adaptação cardiorrespiratória**.
- **Rationale**: Isola toda a matemática comparativa em `assets/calc.js` com testes automatizados em `tests/calc.test.js` (Princípio IV).

