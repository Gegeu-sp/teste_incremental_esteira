# Implementation Plan: RunLab — App Publicável de Triagem, Teste Incremental e Prescrição

**Branch**: `claude/speckit-analysis-implementation-fdvell` | **Date**: 2026-08-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-runlab-app-publicavel/spec.md`

## Summary

O comportamento completo (triagem, teste incremental, tolerância, zonas, plano) já
existe implementado em `html.index` como um SPA vanilla JS/Tailwind (CDN)
auto-contido. O trabalho desta feature é: (1) tornar o app publicável movendo-o para
`index.html` na raiz; (2) extrair as fórmulas fisiológicas puras (VO₂/METs, derivação
de VT1/RCP, zonas, diagnóstico, classificação de tolerância) para um módulo
compartilhado testável em Node, sem introduzir build step; (3) cobrir essas fórmulas
com testes automatizados (Principle IV); (4) documentar como abrir/publicar/testar o
projeto. Nenhuma regra clínica ou numérica existente é alterada — apenas
reorganizada para ser testável.

## Technical Context

**Language/Version**: HTML5, CSS3 (Tailwind via CDN), JavaScript ES2020+ (vanilla,
navegador); testes em Node.js ≥ 18 (built-in test runner, sem dependências extras)

**Primary Dependencies**: Nenhuma em produção além dos `<link>`/`<script>` de CDN
(Fontsource, Tailwind Play CDN) já usados pela página. Nenhuma dependência de
build/bundler.

**Storage**: `localStorage` do navegador (chave `runlab_state_v2`). N/A no servidor.

**Testing**: `node --test` (built-in, Node ≥ 18) sobre o módulo `assets/calc.js`
compartilhado entre navegador e Node.

**Target Platform**: Navegador (desktop e mobile), hospedagem estática (GitHub
Pages ou qualquer servidor de arquivos estáticos), também deve abrir via `file://`.

**Project Type**: Aplicação web estática single-page, sem backend.

**Performance Goals**: Interação instantânea (< 100ms) para toda a UI — não há
chamadas de rede após o carregamento inicial dos assets estáticos.

**Constraints**: Zero build step para rodar em produção (Principle II); zero envio
de dados pessoais a servidores (Principle I); interface em pt-BR (Principle V).

**Scale/Scope**: Uso individual por sessão de avaliação (1 profissional + 1 aluno
por vez); sem necessidade de escala multiusuário.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|---|---|---|
| I. Zero-Backend & Privacidade | Nenhuma chamada de rede para persistência é introduzida | PASS |
| II. Simplicidade | Sem bundler/framework novo; `assets/calc.js` é um `<script>` simples, também `require`-ável pelo Node via `module.exports` condicional | PASS |
| III. Segurança Clínica | Critérios de triagem/contraindicação não são alterados, apenas movidos de lugar | PASS |
| IV. Precisão Numérica Testável | Fórmulas extraídas para módulo dedicado e cobertas por `node --test` | PASS (é o objetivo desta feature) |
| V. pt-BR / Mobile-first em campo | Nenhuma string de UI é traduzida ou reestruturada | PASS |

Nenhuma violação — sem necessidade de Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/001-runlab-app-publicavel/
├── plan.md              # This file
├── tasks.md             # Phase 2 output (/speckit-tasks)
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
index.html                 # Entry point publicável (renomeado de html.index)
assets/
└── calc.js                # Fórmulas puras: vo2At, pace, diagnose, deriveVTs,
                            # zonesData, tteClass — usado pelo <script> do
                            # index.html E por `require()`/`import` nos testes
tests/
└── calc.test.mjs           # node --test cobrindo as fórmulas acima
package.json                # apenas `scripts.test`; sem dependências de runtime
README.md                   # como abrir, publicar e testar
protocolo                   # mantido como fonte de verdade do protocolo original
```

**Structure Decision**: Opção "single project" simplificada para site estático —
sem diretório `src/` separado porque a aplicação inteira é um único HTML servido
diretamente; `assets/calc.js` isola apenas a lógica que precisa ser testável fora do
navegador, mantendo o restante (DOM, event handlers, render) dentro de
`index.html` como já está.

## Complexity Tracking

Nenhuma violação de constitution — seção não aplicável.
