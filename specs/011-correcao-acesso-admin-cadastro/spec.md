# Feature Specification: Correção do Painel do Administrador e Cadastro de Professor

**Feature Branch**: `011-correcao-acesso-admin-cadastro`

**Created**: 2026-11-01

**Status**: Ready for Verification / Complete

**Input**: User description: "verificar pois o 👑 Acesso do Administrador / Fundador nao esta abrindo e nao estou conseguindo cadastra professor, verificar e arrumar"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Abertura e Desbloqueio Confiável do Painel Admin (Priority: P1)

Como proprietário/administrador da plataforma, quero clicar em "👑 Acesso do Administrador / Fundador" na tela inicial e ter o modal administrativo aberto diretamente no centro da tela sem depender de `window.prompt()` do navegador e sem ficar oculto por containers pais invisíveis, para que eu possa inserir minha Chave Mestra e gerenciar o sistema em qualquer navegador ou celular.

**Why this priority**: O modal estava inserido dentro da tag `<main id="view-professor">` que possui a classe `hidden` durante o login, impedindo sua visualização na tela de login.

**Acceptance Scenarios**:

1. **Given** que o usuário está na tela de autenticação inicial (`#view-auth`), **When** clica no link "👑 Acesso do Administrador / Fundador", **Then** o modal `#modalAdminPanel` abre de imediato no centro da tela, exibindo a tela de desbloqueio com campo de Chave Mestra.
2. **Given** que o administrador insere a chave `RUNLAB-ADMIN-2026` e clica em Desbloquear (ou pressiona Enter), **Then** o painel desbloqueia, revela as abas de solicitações pendentes e gerador de PINs e permite aprovar professores.

---

### User Story 2 - Cadastro Imediato de Professor com Chave Mestra ou Formatação Flexível (Priority: P1)

Como professor ou proprietário realizando o cadastro, quero que a inserção da Chave Mestra (`RUNLAB-ADMIN-2026`) no campo "PIN / Código de Ativação" ative a conta imediatamente com privilégios de administrador, e que a validação de telefone aceite formatos comuns (com DDD, com DDI 55 ou números padrão), para que o cadastro nunca fique travado por rigidez de formatação.

**Why this priority**: Evita bloqueios acidentais e permite ao proprietário criar sua própria conta de professor já ativada como admin de forma imediata.

**Acceptance Scenarios**:

1. **Given** o formulário de cadastro de professor, **When** o usuário preenche seus dados informando a chave `RUNLAB-ADMIN-2026` no campo PIN, **Then** a conta é ativada imediatamente com `status: 'ativo'` e `role: 'admin'`, logando o usuário direto na plataforma.
2. **Given** um número de WhatsApp digitado com DDI (ex.: `55 11 98888-7777`) ou sem espaços, **When** o formulário é enviado, **Then** o sistema higieniza corretamente sem disparar erro de comprimento.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O elemento `#modalAdminPanel` MUST ser posicionado no nível raiz do `<body>`, fora de `<main id="view-professor">`, garantindo visibilidade independente do estado de login.
- **FR-002**: O modal MUST conter uma tela nativa de desbloqueio com input de Chave Mestra (`#inpAdminMasterKey`) e botão de submissão, sem depender de `window.prompt()`.
- **FR-003**: O método `registerProfessor` MUST reconhecer a chave `RUNLAB-ADMIN-2026` no campo `pinCode` para ativação instantânea com privilégios administrativos.
- **FR-004**: A função `validatePhone` MUST aceitar números com prefixo `55` (12 a 13 dígitos) e números a partir de 8 dígitos, higienizando-os com segurança.

## Success Criteria *(mandatory)*

- **SC-001**: O clique em "👑 Acesso do Administrador / Fundador" abre o modal em menos de 100ms em 100% dos testes.
- **SC-002**: 100% dos testes unitários da suíte (`node --test tests/*.test.js`) continuam passando.
- **SC-003**: 0 erros de sintaxe nos scripts inline da aplicação.

