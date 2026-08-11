# Tasks: RunLab — App Publicável de Triagem, Teste Incremental e Prescrição

**Input**: Design documents from `/specs/001-runlab-app-publicavel/`

**Prerequisites**: plan.md, spec.md

**Tests**: Solicitados explicitamente pela Constitution (Principle IV) — incluídos.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [x] T001 Publicar ponto de entrada: `git mv "html.index" index.html`
- [x] T002 [P] Criar `README.md` com instruções de abrir localmente, publicar
  (GitHub Pages) e rodar os testes
- [x] T003 [P] Criar `package.json` mínimo (`type: module`, `scripts.test: node
  --test tests/`), sem dependências de runtime

## Phase 2: Foundational — Extrair fórmulas puras (bloqueia US1–US4 testáveis)

**⚠️ CRITICAL**: US5 (publicação) não depende desta fase; US1–US4 já funcionam sem
ela, mas a cobertura de teste (Principle IV) depende dela.

- [x] T004 Criar `assets/calc.js` com as funções puras extraídas de
  `index.html`: `vo2At`, `pace`, `getAvg`/`diagnose`, `deriveVTs`, `zonesData`
  (parte matemática, sem DOM), `tteClass`. Cada função exportada via
  `if (typeof module !== 'undefined') module.exports = {...}` para funcionar tanto
  como `<script>` global no navegador quanto via `require()` no Node.
- [x] T005 Atualizar `index.html` para carregar `<script src="assets/calc.js">`
  antes do `<script>` principal e remover as definições duplicadas
  (`vo2At`, `pace`, `getAvg`, `diagnose`, `deriveVTs`, trecho matemático de
  `zonesData`, `tteClass`), chamando as versões globais no lugar.

**Checkpoint**: `index.html` continua se comportando exatamente como antes (mesmo
resultado visual/numérico), agora com a lógica compartilhada em `assets/calc.js`.

---

## Phase 3: User Story 5 - Publicação e acesso ao app (Priority: P1) 🎯 MVP

**Goal**: Qualquer pessoa consegue abrir o RunLab publicado sem build nem servidor
dedicado.

**Independent Test**: Abrir `index.html` via `file://` e via servidor estático
simples; nenhuma das 6 abas gera erro no console.

- [x] T006 [US5] Verificar no navegador (via `run`/Playwright) que as 6 abas
  (Perfil, Triagem, Teste, Tolerância, Zonas, Plano) renderizam e navegam sem
  erros de console após o rename (T001) e a extração (T004/T005)

**Checkpoint**: MVP publicável pronto.

---

## Phase 4: User Stories 1–4 (Priority: P1/P2) — Regressão coberta por teste

**Goal**: Garantir que a extração das fórmulas (Phase 2) não alterou nenhum
resultado clínico/numérico das User Stories 1–4 do spec.

### Tests (Principle IV — obrigatórios)

- [x] T007 [P] [US2] `tests/calc.test.mjs` — `vo2At`: valores da tabela do
  `protocolo` (4→10.5, 5→14, 6→17.5, 7→21, 8→28, 9→31.5, 10→35, 11→38.5) e
  interpolação entre pontos
- [x] T008 [P] [US2] `tests/calc.test.mjs` — `deriveVTs`: casos com Talk Test
  "não fala" presente, apenas "palavras" presente, e nenhum Talk Test marcado
  (fallback)
- [x] T009 [P] [US2] `tests/calc.test.mjs` — `diagnose`/`getAvg`: limites exatos
  das faixas Excelente/Bom/Regular/Regular Inferior/Ruim para ambos os sexos
- [x] T010 [P] [US3] `tests/calc.test.mjs` — `zonesData` (parte pura): ranges de
  FC/velocidade coerentes e crescentes entre Z1→Z5 para um teste de exemplo
- [x] T011 [P] [US3] `tests/calc.test.mjs` — `tteClass`: limites de 210/300/420/540s
- [x] T012 [P] [US4] `tests/calc.test.mjs` — `pace`: conversão km/h → min:seg/km
  para valores conhecidos (ex.: 6 km/h → 10'00")

**Checkpoint**: `npm test` (ou `node --test tests/`) passa 100% e cobre as
fórmulas centrais de todas as User Stories 1–4.

---

## Dependencies & Execution Order

- Setup (T001–T003) não depende de nada e pode rodar em paralelo entre si.
- Foundational (T004–T005) depende do arquivo já estar em `index.html` (T001) para
  editar o caminho correto do `<script src>`.
- US5 (T006) depende de T001, T004, T005.
- Testes (T007–T012) dependem de T004 (módulo existir) e podem rodar em paralelo
  entre si (mesma suíte, casos independentes).

## Notes

- Nenhuma tarefa altera o comportamento visível da aplicação — é reorganização +
  cobertura de teste + publicabilidade, conforme FR-012 e Principle IV.
- Commit sugerido após T001–T003, outro após T004–T005, outro após T006–T012.
