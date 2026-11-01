# Tasks: Restrição, PIN de Acesso e Aprovação de Professores

**Input**: Design documents from `/specs/010-permissao-cadastro-professor/`  
**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/auth-approval-contract.md](contracts/auth-approval-contract.md), [quickstart.md](quickstart.md)

**Tests**: Testes automatizados unitários em `tests/calc.test.js` para as funções puras de validação, PIN e avaliação de acesso.

**Organization**: Tarefas organizadas por história de usuário (US1 a US4) para entrega incremental e teste independente.

---

## Phase 1: Setup & Data Infrastructure

**Purpose**: Configuração de segurança e permissões no Cloud Firestore

- [x] T001 Atualizar regras em `firestore.rules` para proteger a coleção `activation_codes` e permitir criação de `professors` com `status: 'pendente'`

---

## Phase 2: Foundational Logic & Pure Functions

**Purpose**: Funções puras reutilizáveis para manipulação de telefone, PINs de ativação e regras de acesso

- [x] T002 [P] Implementar funções puras `validatePhone`, `generateActivationPin` e `evaluateProfessorAccess` em `assets/calc.js`
- [x] T003 [P] Implementar testes unitários para `validatePhone`, `generateActivationPin` e `evaluateProfessorAccess` em `tests/calc.test.js`

**Checkpoint**: Camada de lógica pura testada e validada antes de qualquer integração na UI.

---

## Phase 3: User Story 1 - Solicitação de Cadastro e Envio ao Firebase (Priority: P1) 🎯 MVP

**Goal**: Permitir que novos professores solicitem cadastro informando WhatsApp, salvando a requisição no Firebase com status `pendente` e orientando sobre a aprovação comercial.

**Independent Test**: Preencher o cadastro sem PIN e confirmar que a conta é gravada no Firestore com `status: 'pendente'` e a mensagem de espera com botão para WhatsApp é exibida.

- [x] T004 [US1] Atualizar formulário de cadastro em `index.html` para incluir campo obrigatório de WhatsApp e campo opcional de PIN
- [x] T005 [US1] Atualizar `ProfessorAuthDB.register` em `index.html` para persistir o novo professor com `status: 'pendente'`, `phone` e `role: 'professor'`
- [x] T006 [US1] Implementar tela/notificação visual de confirmação de envio em `index.html` com link direto para o WhatsApp do administrador

**Checkpoint**: MVP funcional para captação comercial de solicitações de novos professores.

---

## Phase 4: User Story 2 - Conclusão e Ativação Imediata via PIN/Código de Acesso (Priority: P1)

**Goal**: Permitir que compradores que já receberam um PIN/Código ativem a conta instantaneamente com status `ativo`.

**Independent Test**: Cadastrar um novo professor informando um PIN válido existente em `activation_codes` e verificar que a conta passa diretamente para `ativo` e loga no sistema.

- [x] T007 [US2] Implementar método `verifyAndRedeemPin(pinCode, email)` em `ProfessorAuthDB` no arquivo `index.html`
- [x] T008 [US2] Integrar o fluxo de registro em `index.html` para validar o PIN na coleção `activation_codes`, marcar como utilizado e criar a conta com `status: 'ativo'`

**Checkpoint**: Ativação imediata para clientes pagantes concluída com sucesso.

---

## Phase 5: User Story 3 - Bloqueio de Acesso para Contas Pendentes (Priority: P1)

**Goal**: Impedir login e uso da plataforma por contas cujo status seja `pendente` ou `bloqueado`.

**Independent Test**: Tentar logar com credenciais de uma conta pendente e verificar o bloqueio com exibição do botão de contato WhatsApp.

- [x] T009 [US3] Atualizar `ProfessorAuthDB.login` em `index.html` para invocar `evaluateProfessorAccess` antes de conceder acesso
- [x] T010 [US3] Implementar alerta visual na aba "Sou Professor > Entrar" em `index.html` com aviso de pendência e atalho WhatsApp
- [x] T011 [US3] Atualizar verificação de sessão em `AuthSessionManager.init` em `index.html` para barrar sessões antigas que estejam pendentes ou bloqueadas no Firebase

**Checkpoint**: Proteção total contra acessos não autorizados ativa.

---

## Phase 6: User Story 4 - Painel do Administrador para Aprovação e Gestão de PINs (Priority: P2)

**Goal**: Permitir que o proprietário da plataforma visualize solicitações pendentes, aprove acessos e gere novos PINs de ativação para venda.

**Independent Test**: Logar como administrador, aprovar um professor na lista de solicitações pendentes e gerar um novo PIN na aba de licenças.

- [x] T012 [US4] Configurar identificação de conta de Administrador do proprietário no `AuthSessionManager` em `index.html`
- [x] T013 [US4] Criar modal do Painel do Administrador em `index.html` com listagem de solicitações pendentes e botão de aprovação rápida
- [x] T014 [US4] Implementar gerador de PINs de licença no Painel do Administrador em `index.html`, gravando na coleção `activation_codes`
- [x] T015 [US4] Adicionar recurso de copiar mensagem com PIN e link do RunLab formatada para envio no WhatsApp do cliente em `index.html`

**Checkpoint**: Painel de controle e monetização comercial completo e operacional.

---

## Phase 7: Polish & Validation

**Purpose**: Testes integrados, validação de sintaxe e verificação final

- [x] T016 Executar bateria completa de testes unitários com `node --test tests/*.test.js`
- [x] T017 Validar sintaxe de todos os blocos de script em `index.html` com `vm.Script`
- [x] T018 Executar roteiro do `quickstart.md` para homologação de todos os fluxos

---

## Dependencies & Execution Order

```text
Phase 1 (Rules) ──► Phase 2 (Calc.js & Testes)
                          │
                          ▼
            Phase 3 (US1: Cadastro Pendente) 🎯 MVP
                          │
                          ▼
            Phase 4 (US2: Ativação por PIN)
                          │
                          ▼
            Phase 5 (US3: Bloqueio de Pendentes)
                          │
                          ▼
            Phase 6 (US4: Painel do Administrador)
                          │
                          ▼
            Phase 7 (Polish & Validation)
```

