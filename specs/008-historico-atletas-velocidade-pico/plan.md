# Implementation Plan: Banco de Dados de Atletas (Firestore), Comparação de Evolução e Regra de Estágio Completo no vPico

**Branch**: `specs/008-historico-atletas-velocidade-pico` | **Date**: 2026-11-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/008-historico-atletas-velocidade-pico/spec.md`

## Summary

Implementa duas evoluções centrais no RunLab:
1. **Regra de Estágio Completo no `vPico` (`US1`)**: altera o fechamento do teste incremental (`finishTest()` em `index.html` apoiado pela função pura `computeVPeak(startV, completedStages)` em `assets/calc.js`) para que, quando o teste for interrompido antes de concluir os 2 minutos do estágio atual, a velocidade considerada como `vPico / vVO₂max` seja estritamente a velocidade do **estágio anterior concluído**, sem somar o estágio incompleto nem fração temporal.
2. **Banco de Dados de Atletas Exclusivamente em Nuvem via Firebase Firestore e Comparação de Evolução (`US2` & `US3`)**: integra o Cloud Firestore do projeto (`teste-incremental-56aeb`) via CDN para salvar perfis de atletas e todo o histórico de avaliações na coleção `athletes`, adicionando a aba **`8 · Atletas & Evolução`** e botão rápido de salvamento na nuvem no topo da aplicação, além do motor puro `compareAssessments(baseRec, currRec)` em `assets/calc.js` para comparar lado a lado a evolução de `vPico`, `VO₂máx`, `VT1`, `VT2`, `tlim`, `peso`, `FC repouso` e FC por velocidade submáxima (`km/h`).

## Technical Context

**Language/Version**: HTML5 / CSS3 (Tailwind via CDN) / JavaScript vanilla (ES2020+); testes automatizados com runner nativo de Node.js (`node --test`).

**Primary Dependencies**: Firebase JS SDK (App + Cloud Firestore carregados via CDN gstatic oficial, sem bundler).

**Storage**: **Exclusivamente em Nuvem via Firebase Firestore** (projeto `teste-incremental-56aeb`, coleção `athletes`) para persistência e histórico multi-atleta; estado de trabalho da sessão atual mantido em memória/`localStorage` durante o preenchimento.

**Testing**: `node --test tests/*.test.js` cobrindo `computeVPeak` (interrupção em qualquer ponto do estágio) e `compareAssessments` (deltas cardiorrespiratórios e pareamento de FC por velocidade).

**Target Platform**: Qualquer navegador moderno conectado à internet (Desktop e Mobile).

**Project Type**: Single-page application estática client-side (SPA sem bundler) integrada ao Firebase Hosting e Cloud Firestore (`teste-incremental-56aeb`).

**Performance Goals**: Listagem e salvamento de atletas no Firestore em `< 1,5 s`; cálculo de `computeVPeak` e `compareAssessments` instantâneo (`< 1 ms`).

**Constraints**:
- Princípio I (Constitution v2.0.0): Persistência de atletas e avaliações exclusivamente no Firebase Firestore do próprio projeto (`teste-incremental-56aeb`).
- Princípio II: Único artefato estático sem etapa de build (Firebase SDK carregado via CDN).
- Princípio III: Segurança clínica preservada em todas as avaliações reabertas.
- Princípio IV: Funções puras `computeVPeak` e `compareAssessments` em `assets/calc.js` 100% testadas em `tests/calc.test.js`.
- Princípio V: Interface 100% em pt-BR e responsiva para operação ao lado da esteira.

**Scale/Scope**: Suporta centenas de atletas e dezenas de avaliações históricas por atleta na coleção `athletes` do Firestore; adiciona `firestore.rules` e atualiza `firebase.json` para deploy conjunto de Hosting + Firestore Rules.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Gate | Pre-Research | Post-Design |
|---|---|---|---|
| I. Persistência em Nuvem via Firestore & Privacidade | Dados de atletas e avaliações salvos exclusivamente no Firestore do projeto (`teste-incremental-56aeb`), sem analytics de terceiros | PASS (Constitution v2.0.0) | PASS |
| II. Simplicidade — Um Único Artefato | Firebase SDK importado via CDN; zero bundlers ou etapas de build obrigatórias | PASS | PASS |
| III. Segurança Clínica Antes de Tudo | Dados completos de triagem e alertas preservados ao salvar e reabrir qualquer avaliação | PASS | PASS |
| IV. Precisão Numérica Testável | `computeVPeak` e `compareAssessments` isoladas em `assets/calc.js` com cobertura em `tests/calc.test.js` | PASS | PASS |
| V. Interface em pt-BR e Mobile-First | Aba `Atletas & Evolução` e botões de salvamento em nuvem responsivos e em português claro | PASS | PASS |

Sem violações identificadas.

## Project Structure

### Documentation (this feature)

```text
specs/008-historico-atletas-velocidade-pico/
├── spec.md                                      # Especificação da feature
├── plan.md                                      # Este plano técnico de implementação
├── research.md                                  # Phase 0: Pesquisa e decisões técnicas
├── data-model.md                                # Phase 1: Entidades Firestore e modelos comparativos
├── quickstart.md                                # Phase 1: Guia de validação automatizada e manual
├── contracts/
│   └── athletes-firestore-and-vpeak.md          # Phase 1: Contratos de funções puras e Firestore
└── checklists/
    └── requirements.md                          # Checklist de qualidade da especificação (16/16 PASS)
```

### Source Code (repository root)

```text
index.html          # Atualização de finishTest() usando computeVPeak();
                    # Módulo AthleteCloudDB conectado ao Firebase Firestore (teste-incremental-56aeb);
                    # Botão "☁ Salvar na Nuvem" e Aba "8 · Atletas & Evolução" (busca, histórico,
                    # reabertura de avaliação, nova avaliação para atleta e comparativo de evolução).
assets/calc.js      # + computeVPeak(startV, completedStages)
                    # + compareAssessments(baseAssessment, currentAssessment)
tests/calc.test.js  # + Testes unitários para computeVPeak e compareAssessments
firestore.rules     # Regras de acesso do Cloud Firestore para a coleção athletes
firebase.json       # Configuração de Hosting + Firestore Rules
```

**Structure Decision**: Mantida a arquitetura de artefato estático do RunLab (`index.html` + `assets/calc.js` + `tests/calc.test.js`), adicionando `firestore.rules` para provisionamento das regras do banco em nuvem no projeto Firebase `teste-incremental-56aeb`.

## Complexity Tracking

Nenhuma violação da Constitution v2.0.0 — seção não aplicável.

