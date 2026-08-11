# Implementation Plan: Fase 2B — Relatório Completo em PDF

**Branch**: `claude/speckit-analysis-implementation-fdvell` | **Date**: 2026-08-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-fase2b-relatorio-pdf/spec.md`

## Summary

Adiciona um modo de impressão consolidado (`report-mode`) que monta, sob
demanda, uma view única com Perfil + Triagem + Diagnóstico + Zonas + Plano,
reaproveitando os dados e funções já existentes (`diagnose`, `zonesData`,
`planSessions`, `classifySpo2`/`classifyGlicose`). O usuário salva como PDF
pelo diálogo nativo de impressão do navegador — sem biblioteca nova.

## Technical Context

**Language/Version**: Igual ao já estabelecido (HTML/CSS/JS vanilla).

**Primary Dependencies**: Nenhuma nova — reusa `window.print()` já usado por
`btnPrint`.

**Storage**: Nenhum campo novo de estado — a feature só lê `state`.

**Testing**: `node --test tests/*.test.js` continua cobrindo as fórmulas
existentes (nenhuma nova). Verificação desta feature é majoritariamente
manual/Playwright (composição de HTML e regras de CSS de impressão).

**Target Platform**: Igual ao existente.

**Project Type**: App web estático single-page.

**Constraints**: Aditivo — nenhum valor numérico já calculado pode mudar.

## Constitution Check

| Principle | Gate | Status |
|---|---|---|
| I. Zero-Backend & Privacidade | PDF gerado localmente pelo navegador, nada sai do dispositivo | PASS |
| II. Simplicidade | Reusa `window.print()`, zero dependências novas | PASS |
| III. Segurança Clínica | Relatório só reexibe dados já validados nas fases anteriores | PASS |
| IV. Precisão Numérica Testável | Sem fórmula nova — N/A | PASS |
| V. pt-BR / mobile-first em campo | Relatório em pt-BR, mesmo padrão visual | PASS |

Sem violações.

## Project Structure

### Documentation (this feature)

```text
specs/004-fase2b-relatorio-pdf/
├── plan.md
├── tasks.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
index.html   # #reportView (novo), botão "Gerar Relatório Completo",
             # CSS de report-mode, função renderReport()
```

**Structure Decision**: Extensão do único arquivo existente, mesma
estrutura das fases anteriores.

## Complexity Tracking

Nenhuma violação de constitution — seção não aplicável.
