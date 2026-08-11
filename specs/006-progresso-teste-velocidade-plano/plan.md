# Implementation Plan: Progresso do Teste + Velocidade no Plano

**Branch**: `claude/speckit-analysis-implementation-fdvell` | **Date**: 2026-08-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-progresso-teste-velocidade-plano/spec.md`

## Summary

Persiste o progresso do teste incremental em `state.liveTest` (mesmo
mecanismo `save()`/`localStorage` já usado no resto do app), restaurando
em pausa após reload; muda o ciclo de vida dos estágios para nascerem no
início (não na conclusão), habilitando edição imediata e capturando o
estágio final em caso de exaustão no meio dele; e enriquece os passos de
`planSessions()` com a velocidade de cada zona mencionada, reaproveitando
`zTarget()`/`z.vVT2` já existentes.

## Technical Context

**Language/Version**: Igual ao já estabelecido (HTML/CSS/JS vanilla).

**Primary Dependencies**: Nenhuma nova.

**Storage**: Novo campo `state.liveTest` (mesma chave `runlab_state_v2`),
limpo ao finalizar/refazer o teste.

**Testing**: `node --test tests/*.test.js` continua cobrindo as fórmulas
existentes (nenhuma nova — mudanças são de ciclo de vida de estado e
composição de texto). Verificação principal é manual/Playwright, incluindo
simulação de `page.reload()`.

**Target Platform**: Igual ao existente.

**Project Type**: App web estático single-page.

**Constraints**: Aditivo — nenhum valor numérico já calculado pode mudar
(SC-004 do spec); `deriveVTs` e demais fórmulas mantêm o mesmo contrato de
entrada/saída.

## Constitution Check

| Principle | Gate | Status |
|---|---|---|
| I. Zero-Backend & Privacidade | `state.liveTest` fica só em `localStorage`, nenhuma chamada de rede | PASS |
| II. Simplicidade | Reusa `save()`/`localStorage` e `zTarget()` já existentes, zero dependências novas | PASS |
| III. Segurança Clínica | Restauração conservadora (sempre em pausa, sem auto-avançar tempo) evita dados incorretos | PASS |
| IV. Precisão Numérica Testável | Sem fórmula nova — mudanças de ciclo de vida de estado e texto | PASS |
| V. pt-BR / mobile-first em campo | Resolve diretamente um problema relatado em uso mobile real | PASS |

Sem violações.

## Project Structure

### Documentation (this feature)

```text
specs/006-progresso-teste-velocidade-plano/
├── plan.md
├── tasks.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
index.html   # btnStart/loop/finishTest/btnRedo (liveTest + ciclo de
             # estágio); planSessions() (velocidade em cada passo)
```

**Structure Decision**: Extensão do arquivo único existente, mesma
estrutura das fases anteriores.

## Complexity Tracking

Nenhuma violação de constitution — seção não aplicável.
