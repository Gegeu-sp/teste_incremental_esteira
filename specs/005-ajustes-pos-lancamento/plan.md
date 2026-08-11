# Implementation Plan: Ajustes pós-lançamento — Capacidade, Mobile e Registro de FC

**Branch**: `claude/speckit-analysis-implementation-fdvell` | **Date**: 2026-08-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-ajustes-pos-lancamento/spec.md`

## Summary

Três correções pós-lançamento independentes no mesmo arquivo: (1) a
geração do plano passa a respeitar `state.test.totalSec` como teto de
duração das sessões contínuas; (2) o grid de resultado do Teste Incremental
ganha `text-center`/`break-words`/coluna única no mobile; (3) um campo de
FC em destaque é adicionado perto do cronômetro, sincronizado com a tabela
de estágios já existente.

## Technical Context

**Language/Version**: Igual ao já estabelecido (HTML/CSS/JS vanilla).

**Primary Dependencies**: Nenhuma nova.

**Storage**: Nenhum campo novo de estado — usa `state.test.totalSec` e
`state.test.stages` já existentes.

**Testing**: `node --test tests/*.test.js` continua cobrindo as fórmulas
existentes (nenhuma nova — `capacityCapMin`/`fmtDur` são composição de
texto de sessão, mesmo tratamento dado às funções de método da Fase 2A).
Verificação principal é manual/Playwright.

**Target Platform**: Igual ao existente; esta feature testa explicitamente
viewport mobile (360–412px).

**Project Type**: App web estático single-page.

**Constraints**: Aditivo — nenhum valor numérico já calculado pode mudar
(SC-004 do spec).

## Constitution Check

| Principle | Gate | Status |
|---|---|---|
| I. Zero-Backend & Privacidade | Nenhum dado novo, nenhuma chamada de rede | PASS |
| II. Simplicidade | Sem dependências novas | PASS |
| III. Segurança Clínica | Ajuste de duração é conservador (reduz volume para capacidade baixa, nunca aumenta) e visível ao profissional (aviso) | PASS |
| IV. Precisão Numérica Testável | Sem fórmula fisiológica nova — N/A (mesmo raciocínio da Fase 2A para composição de sessão) | PASS |
| V. pt-BR / mobile-first em campo | Esta feature É a correção mobile — reforça o princípio diretamente | PASS |

Sem violações.

## Project Structure

### Documentation (this feature)

```text
specs/005-ajustes-pos-lancamento/
├── plan.md
├── tasks.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
index.html   # planSessions()+renderPlan() (capacidade); renderResults()
             # (#resGrid mobile); #runArea + JS (novo #stHrNow)
```

**Structure Decision**: Extensão do arquivo único existente, mesma
estrutura das fases anteriores.

## Complexity Tracking

Nenhuma violação de constitution — seção não aplicável.
