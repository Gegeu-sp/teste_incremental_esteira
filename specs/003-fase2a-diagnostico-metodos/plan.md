# Implementation Plan: Fase 2A — Diagnóstico/Interpretação e Biblioteca de Métodos

**Branch**: `claude/speckit-analysis-implementation-fdvell` | **Date**: 2026-08-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-fase2a-diagnostico-metodos/spec.md`

## Summary

Adiciona conteúdo educacional/de apoio à decisão na aba Zonas e reorganiza a
geração de sessões da Prescrição em torno de métodos de treino nomeados e
parametrizados pela apostila de referência do usuário. Puramente
aditivo/composição — reaproveita `diagnose()`, `zonesData()`/`computeZones()`,
`zTarget()` e `sessionCard()` já existentes, sem alterar nenhuma fórmula.

## Technical Context

**Language/Version**: Igual ao já estabelecido (HTML/CSS/JS vanilla, sem
build).

**Primary Dependencies**: Nenhuma nova.

**Storage**: `localStorage`, mesma estrutura — nenhum campo novo de estado
(a única leitura nova é `state.profile.level`, já existente, para gating de
RST/SIT).

**Testing**: `node --test tests/*.test.js` (já configurado). Esta fase não
adiciona cálculo numérico novo, então não são esperados novos testes em
`assets/calc.js` — a verificação principal é manual/Playwright (conteúdo e
regras de exibição condicional).

**Target Platform**: Igual ao existente.

**Project Type**: App web estático single-page.

**Constraints**: Aditivo — nenhum valor numérico já calculado pode mudar
para os mesmos dados de entrada (SC-003 do spec).

## Constitution Check

| Principle | Gate | Status |
|---|---|---|
| I. Zero-Backend & Privacidade | Nenhum dado novo, nenhuma chamada de rede | PASS |
| II. Simplicidade | Sem dependências novas | PASS |
| III. Segurança Clínica | RST/SIT (esforços quase-máximos) gated a objetivo=Performance + fase=Específico + nível≠Iniciante, mesmo padrão já usado para a sessão de alta intensidade existente | PASS |
| IV. Precisão Numérica Testável | Não há fórmula numérica nova nesta fase (conteúdo/composição de texto) — N/A | PASS |
| V. pt-BR / mobile-first em campo | Novo conteúdo segue mesmo idioma/padrão visual | PASS |

Sem violações.

## Project Structure

### Documentation (this feature)

```text
specs/003-fase2a-diagnostico-metodos/
├── plan.md
├── tasks.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
index.html   # renderZones() (+5 cards); planSessions() (+métodos nomeados,
             # gating por fase/objetivo/nível)
```

**Structure Decision**: Mesma estrutura das fases anteriores — extensão dos
arquivos existentes, sem novos diretórios de projeto.

## Complexity Tracking

Nenhuma violação de constitution — seção não aplicável.
