# Implementation Plan: Fase 1 — Perfil, Triagem, Teste Incremental e Tolerância

**Branch**: `claude/speckit-analysis-implementation-fdvell` | **Date**: 2026-08-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-fase1-perfil-triagem-teste/spec.md`

## Summary

Adiciona campos e regras aditivas às 4 primeiras abas do RunLab (Perfil,
Triagem, Teste Incremental, Tolerância), sem alterar nenhuma fórmula
pré-existente. As duas novas classificações clínicas (SpO₂, glicose) entram
em `assets/calc.js` como funções puras testáveis, seguindo o mesmo padrão já
usado para `vo2At`/`diagnoseVO2`/etc. Tudo continua client-side, sem build,
sem backend.

## Technical Context

**Language/Version**: HTML5/CSS3 (Tailwind CDN) + JS vanilla; testes em Node
`--test`, mesmo setup do projeto.

**Primary Dependencies**: Nenhuma nova.

**Storage**: `localStorage`, mesmas chaves (`runlab_state_v2`), com novos
campos aditivos em `profile`, `screen` e `tte`.

**Testing**: `node --test tests/*.test.js` (já configurado).

**Target Platform**: Igual ao existente (navegador, hospedagem estática).

**Project Type**: App web estático single-page.

**Constraints**: Aditivo — não pode mudar nenhum valor numérico já calculado
para os mesmos dados de entrada (SC-003 do spec).

## Constitution Check

| Principle | Gate | Status |
|---|---|---|
| I. Zero-Backend & Privacidade | Nenhum dado novo sai do navegador | PASS |
| II. Simplicidade | Sem novas dependências/build | PASS |
| III. Segurança Clínica | Novos critérios de SpO₂/glicose são conservadores, documentados, com fonte (ACSM) e constantes nomeadas | PASS |
| IV. Precisão Numérica Testável | `classifySpo2`/`classifyGlicose` viram funções puras com testes nos limites exatos | PASS |
| V. pt-BR / mobile-first em campo | Novos campos seguem o mesmo padrão visual/idioma | PASS |

Sem violações.

## Project Structure

### Documentation (this feature)

```text
specs/002-fase1-perfil-triagem-teste/
├── plan.md
├── tasks.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
index.html          # campos/UI novas nas 4 abas; renderScreen/renderResults/showTteResult estendidos
assets/calc.js       # + classifySpo2(v), classifyGlicose(v)
tests/calc.test.js   # + casos de teste para as duas funções novas
```

**Structure Decision**: Mesma estrutura já estabelecida na feature 001 —
sem novos diretórios de projeto, só extensão dos três arquivos existentes.

## Complexity Tracking

Nenhuma violação de constitution — seção não aplicável.
