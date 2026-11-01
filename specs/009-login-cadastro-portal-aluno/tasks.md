---

description: "Task list for Sistema de Login (Professor e Aluno), Central Profissional de Alunos e Portal de Treinos na Esteira"
---

# Tasks: Sistema de Login (Professor e Aluno), Central Profissional de Alunos e Portal de Treinos na Esteira

**Input**: Design documents from `/specs/009-login-cadastro-portal-aluno/`  
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/auth-portal-prescriptions.md, quickstart.md  
**Tests**: Obrigatórios conforme `spec.md` (`SC-003`) e Constitution v2.0.0 (Princípio IV — Precisão Numérica Testável).  
**Organization**: Tarefas agrupadas por fase e User Story (`US1`, `US2`, `US3`) para permitir implementação e validação incremental independente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode ser executada em paralelo (arquivos distintos, sem dependências de tarefas incompletas)
- **[Story]**: Rótulo da User Story correspondente (`[US1]`, `[US2]`, `[US3]`)
- Caminhos exatos de arquivo incluídos em todas as tarefas (`assets/calc.js`, `tests/calc.test.js`, `index.html`, `firestore.rules`, `firebase.json`)

---

## Phase 1: Setup (Shared Infrastructure & Cloud Firestore Provisioning)

**Purpose**: Configurar regras de segurança para a nova coleção `professors` e para os novos campos da coleção `athletes` no Cloud Firestore (`teste-incremental-56aeb`).

- [x] T001 Executar a suíte de testes atual (`node --test tests/*.test.js`) para validar a linha de base antes das alterações em `tests/calc.test.js`
- [x] T002 [P] Atualizar as regras de segurança em `firestore.rules` adicionando permissões para a coleção `professors` (validando `name` com mín. 3 caracteres, `emailLower` com mín. 3 caracteres e `passwordHash` com 64 caracteres hexadecimais) e expandindo a validação de `athletes` para suportar `accessCode`, `pin` e `professorId`

---

## Phase 2: Foundational (Blocking Prerequisites — Algoritmos Puros de Treino e Acesso)

**Purpose**: Implementar e exportar as funções determinísticas `generateWorkoutPrescriptions` e `generateStudentAccessCode` em `assets/calc.js`, que servem de alicerce para a geração das fichas de treino (`US3`) e cadastro de credenciais do aluno (`US1`/`US2`).

**⚠️ CRITICAL**: Nenhuma integração de UI das User Stories deve começar antes da conclusão e teste desta fase.

- [x] T003 [P] Implementar a função utilitária pura `generateStudentAccessCode(studentName, saltSeed)` em `assets/calc.js` para converter o nome do aluno em código alfanumérico limpo em caixa alta (ex: `"CARLOS-742"`) e sugerir PIN numérico de 4 dígitos
- [x] T004 Implementar a função pura `generateWorkoutPrescriptions(assessment)` em `assets/calc.js` obedecendo aos contratos de `contracts/auth-portal-prescriptions.md`: converter limiares fisiológicos ($v\text{Pico}$, $VO_2\text{máx}$, VT1, RCP/VT2, $t_{\text{lim}}$, FC máx e repouso) em 6 fichas de treino na esteira (`rec-z1`, `base-z2`, `tempo-z3`, `hiit-vo2-z4`, `hiit-short`, `speed-z5`), calculando `mainSpeedKmh` (arredondado a 1 casa), `mainPaceStr` (`"M:SS"`), `mainHrRangeStr`, `mainHrMin`, `mainHrMax`, descrições Borg/Talk Test e array estruturado de passos (`warmup`, `main`/`interval`, `recovery`, `cooldown`)
- [x] T005 Exportar `generateWorkoutPrescriptions` e `generateStudentAccessCode` no bloco `module.exports` de `assets/calc.js`
- [x] T006 [P] Adicionar testes unitários em `tests/calc.test.js` cobrindo: (a) geração de códigos de acesso e PINs, (b) cálculo exato de velocidades na esteira e paces para cada uma das 6 modalidades de treino a partir de $v\text{Pico}$, (c) faixas de BPM esperadas com e sem FC máx conhecida, (d) geração de etapas com durações e instruções estruturadas, e (e) tratamento defensivo para avaliações incompletas ou nulas

**Checkpoint**: Funções puras prontas, exportadas e 100% cobertas por testes automatizados em `tests/calc.test.js`.

---

## Phase 3: User Story 2 - Tela de Login e Cadastro de Professor e Login de Aluno (Priority: P1)

**Goal**: Apresentar na abertura da aplicação a tela de autenticação com suporte a dois perfis de acesso: **Sou Professor / Avaliador** (com cadastro e login via e-mail e senha hash SHA-256) e **Sou Aluno / Atleta** (com login via nome/código + PIN), com persistência de sessão em `localStorage` e opção de logout.

**Independent Test**: Criar uma conta de professor, fazer login e verificar a abertura do painel completo de testes; clicar em Sair e entrar na aba "Sou Aluno" com código e PIN de um aluno para verificar o direcionamento exclusivo para o Portal do Aluno.

### Implementation for User Story 2

- [x] T007 [US2] Implementar em `index.html` o módulo `ProfessorAuthDB` (com métodos `registerProfessor`, `loginProfessor`, hashing nativo via `crypto.subtle.digest('SHA-256')`) e o gerenciador de sessão `AuthSessionManager` para persistir e restaurar o estado da sessão autenticada em `localStorage` (`runlab_auth_session`)
- [x] T008 [US2] Criar a tela de recepção e autenticação (`#view-auth`) em `index.html` com design profissional, apresentando os seletores de perfil **"Sou Professor"** (formulário de Login com E-mail/Senha e formulário de Criar Conta com Nome, E-mail, CREF opcional e Senha) e **"Sou Aluno"** (formulário de Acesso com Nome/Código de Acesso e PIN/Senha)
- [x] T009 [US2] Implementar o controlador de visualização principal em `index.html`: rotear entre `#view-auth`, `#view-professor` (painel de testes) e `#view-portal-aluno`, adicionando a barra superior do professor com saudação (`👨‍🏫 Prof. [Nome]`), indicador do aluno ativo e botão de **"Sair (Logout)"**

**Checkpoint**: User Story 2 concluída — autenticação dupla de professor e aluno funcionando com persistência de sessão e logout seguro.

---

## Phase 4: User Story 1 - Central Profissional de Busca e Cadastro Prévio de Alunos na Tela Inicial (Priority: P1) 🎯 MVP

**Goal**: Transformar a aba inicial `1 · Aluno & Perfil` (`#tab-perfil`) do ambiente do professor em uma Central Profissional de Alunos, onde o avaliador pode buscar instantaneamente qualquer aluno existente ou cadastrar um novo aluno com ficha completa e credenciais de acesso antes de iniciar a triagem e o teste.

**Independent Test**: Digitar o nome de um aluno no campo de busca da tela inicial e ver seu card com $v\text{Pico}$, $VO_2\text{máx}$ e botão de seleção imediata; ou clicar em "+ Novo Aluno", preencher a ficha completa com código/PIN gerados e salvar, verificando o vínculo imediato com a sessão de avaliação.

### Implementation for User Story 1

- [x] T010 [US1] Refatorar a aba `1 · Aluno & Perfil` (`#tab-perfil`) em `index.html` para incorporar o painel da Central Profissional de Alunos, adicionando a barra de busca em tempo real (`#athHubSearchInput`) e lista de cards de resultados com resumo da última avaliação ($v\text{Pico}$, $VO_2\text{máx}$, data) e botões **"Selecionar p/ Nova Avaliação"** e **"Ver Treinos"**
- [x] T011 [US1] Adicionar na Central de Alunos de `index.html` o formulário profissional de cadastro/edição de aluno contendo: Nome completo, Código de Acesso (`accessCode`), PIN de Acesso (`pin`), E-mail, Telefone, Idade, Sexo, Peso (`kg`), Altura (`cm`), Nível de treino, Objetivo principal, FC de repouso, FC máxima conhecida e Observações Clínicas
- [x] T012 [US1] Integrar o cadastro e seleção da Central de Alunos com `AthleteCloudDB` em `index.html`, salvando os dados no Firestore, ativando o aluno no badge do cabeçalho, pré-preenchendo todos os parâmetros fisiológicos da avaliação e habilitando o botão **"Avançar para 2 · Triagem"**

**Checkpoint**: User Story 1 concluída — o professor busca, cadastra e seleciona alunos profissionalmente logo na tela inicial.

---

## Phase 5: User Story 3 - Portal do Aluno com Fichas de Treino Detalhadas para Esteira (Priority: P1)

**Goal**: Disponibilizar o Portal do Aluno (`#view-portal-aluno`) com layout mobile-first de alta legibilidade para leitura na esteira, apresentando resumo do teste, Zonas Z1 a Z5 e 6 fichas detalhadas de treino contendo velocidade exata na esteira (`km/h`), pace (`min/km`), BPM esperado e roteiro passo a passo da sessão.

**Independent Test**: Fazer login como aluno (ou clicar em "Ver como Aluno" pelo professor) e verificar a renderização responsiva dos 6 cards de treino na esteira com velocidades em destaque grande, paces e faixas de batimentos cardíacos coerentes com os limiares.

### Implementation for User Story 3

- [x] T013 [US3] Construir o layout do Portal do Aluno (`#view-portal-aluno`) em `index.html` contendo: cabeçalho exclusivo do aluno com saudação personalizada e botão de sair, card de resumo fisiológico ($v\text{Pico}$, Pace de Pico, $VO_2\text{máx}$, VT1 e VT2) e tabela/cards das 5 Zonas de Treino (Z1 a Z5) com cores padronizadas
- [x] T014 [US3] Implementar a seção **"Meus Treinos na Esteira"** no Portal do Aluno em `index.html`: invocar `generateWorkoutPrescriptions(latestAssessment)` e renderizar os 6 cards de treino detalhados com tipografia em destaque para velocidade (`km/h`), pace (`min/km`), BPM alvo (`bpm` e `%FCmáx`), percepção Borg e estrutura completa (Aquecimento, Série Principal/Tiros e Desaquecimento)
- [x] T015 [US3] Implementar o botão **"👀 Ver como Aluno"** no cabeçalho do professor em `index.html`, permitindo ao avaliador alternar instantaneamente para o Portal do Aluno com os dados do aluno ativo e retornar com 1 clique através de **"← Voltar ao Painel do Professor"**

**Checkpoint**: User Story 3 concluída — Portal do Aluno e visão do professor perfeitamente sincronizados com fichas de esteira ultra legíveis.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validação automatizada de testes, sintaxe de scripts e testes manuais dos cenários end-to-end.

- [x] T016 Executar a suíte completa de testes automatizados (`npm test` / `node --test tests/*.test.js`) e verificar 100% de aprovação sem regressões em `tests/calc.test.js`
- [x] T017 Validar a sintaxe de todos os scripts inline em `index.html` através de teste sintático com Node `vm.Script`
- [x] T018 Executar o roteiro de validação end-to-end descrito em `specs/009-login-cadastro-portal-aluno/quickstart.md` cobrindo criação de professor, cadastro de aluno na tela inicial, execução de teste e login independente do aluno

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Inicia imediatamente (`T001`, `T002`).
- **Foundational (Phase 2)**: Depende de `T001` — bloqueia o início das interfaces das User Stories (`T003`–`T006`).
- **User Story 2 (Phase 3)**: Depende da Phase 1 e Phase 2 — constrói a infraestrutura de login/sessão que ancora as telas (`T007`–`T009`).
- **User Story 1 (Phase 4)**: Depende da Phase 3 — refatora a aba inicial do professor com a Central de Alunos (`T010`–`T012`).
- **User Story 3 (Phase 5)**: Depende da Phase 2 e Phase 3 — monta o Portal do Aluno com as prescrições geradas (`T013`–`T015`).
- **Polish (Phase 6)**: Depende da conclusão de todas as fases anteriores (`T016`–`T018`).

### Parallel Opportunities

- `T002` (`firestore.rules`) pode rodar em paralelo a `T001`.
- Na Phase 2, `T003` (`generateStudentAccessCode`) e `T004` (`generateWorkoutPrescriptions`) podem ser implementadas em paralelo antes dos testes `T006`.
- Após a Phase 3 (Auth & Sessões), `US1` (Central de Alunos na aba 1) e `US3` (Portal do Aluno) operam em componentes distintos e podem avançar independentemente.

---

## Implementation Strategy

### MVP First

1. Concluir Phase 1 (Setup Firestore Rules) e Phase 2 (Foundational em `assets/calc.js` com testes).
2. Concluir Phase 3 (Auth de Professor e Aluno).
3. Concluir Phase 4 (Central Profissional de Alunos na Tela Inicial).
4. Concluir Phase 5 (Portal do Aluno com Fichas de Treino para Esteira).
5. Concluir Phase 6 (Validação e Polish).

