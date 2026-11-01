# Feature Specification: Restrição, PIN de Acesso e Aprovação de Cadastro de Professores

**Feature Branch**: `010-permissao-cadastro-professor`

**Created**: 2026-11-01

**Status**: Ready for Planning

**Input**: User description: "na area de login precisa colocar uma premissão para evitar que qualquer pessoa faça o cadastra. para ele concluir o cadastra ele precisa de uma acesso ou pin para concluir, vamos pensar que eu irei comercializar este produto ir a requisição para o firebase para eu aceitar o acesso, entendeu?"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Solicitação de Cadastro de Professor e Envio ao Firebase (Priority: P1)

Como potencial cliente ou novo professor avaliador que deseja utilizar a plataforma comercial RunLab, quero preencher meu formulário de cadastro (Nome Completo, E-mail, WhatsApp/Telefone para contato comercial e Senha) e enviar uma requisição de acesso ao Firebase, para que o proprietário/administrador da plataforma possa avaliar, aprovar minha assinatura e liberar meu PIN ou acesso.

**Why this priority**: Estabelece o fluxo de captação de clientes/professores no modelo comercial, impedindo que contas ativas sejam criadas indiscriminadamente sem autorização comercial do proprietário.

**Independent Test**: Pode ser testado preenchendo o formulário de cadastro sem um PIN prévio; o sistema salva a solicitação com status `pendente` no Firebase e exibe tela amigável informando que a solicitação foi enviada para aprovação do administrador.

**Acceptance Scenarios**:

1. **Given** que o usuário acessa a aba "Sou Professor > Criar Conta", **When** preenche Nome, E-mail, WhatsApp/Telefone e Senha, **Then** o sistema registra a requisição no Firebase com status `pendente` e orienta o usuário que o acesso será liberado após confirmação do administrador.
2. **Given** que o usuário tenta cadastrar um e-mail que já possui solicitação pendente ou aprovada, **When** clica em cadastrar, **Then** o sistema identifica a existência prévia e informa o status atual (ex.: "Solicitação já recebida em análise" ou "Conta já existente, realize login").

---

### User Story 2 - Conclusão e Ativação Imediata via PIN/Código de Acesso (Priority: P1)

Como novo professor que já comprou o produto comercialmente e recebeu um PIN ou Código de Ativação do proprietário, quero poder informar esse PIN/Código diretamente no formulário de cadastro para ter minha conta ativada de imediato sem aguardar fila de aprovação manual.

**Why this priority**: Permite que o proprietário venda licenças do produto e entregue um PIN/Código ao cliente para ativação instantânea e sem atrito.

**Independent Test**: Pode ser testado preenchendo o cadastro acompanhado de um PIN/Código de licença válido; o sistema ativa a conta na hora com status `ativo` e loga o professor no sistema.

**Acceptance Scenarios**:

1. **Given** que o professor possui um PIN/Código de ativação válido fornecido pelo administrador, **When** preenche o formulário informando esse PIN, **Then** a conta é criada com status `ativo` e a sessão é iniciada imediatamente.
2. **Given** que o usuário insere um PIN/Código incorreto ou inexistente, **When** tenta concluir, **Then** o sistema recusa a ativação instantânea, alerta sobre a chave inválida e oferece a opção de enviar a solicitação para aprovação do administrador.

---

### User Story 3 - Bloqueio de Acesso para Contas Pendentes ou Não Autorizadas (Priority: P1)

Como administrador do produto comercial, quero que qualquer tentativa de login de uma conta de professor que ainda não foi aprovada (status `pendente` ou `bloqueado`) seja impedida, para que apenas assinantes/professores autorizados acessem a ferramenta de testes e os dados dos alunos.

**Why this priority**: Garante que o modelo de negócio comercial seja protegido e que ninguém utilize o produto sem autorização ativa.

**Independent Test**: Pode ser testado tentando fazer login com as credenciais de uma conta pendente; o sistema bloqueia o acesso e exibe a mensagem de pendência.

**Acceptance Scenarios**:

1. **Given** uma conta com status `pendente`, **When** o usuário tenta fazer login com e-mail e senha corretos, **Then** o sistema não permite o acesso e exibe a mensagem: "Sua solicitação de acesso está em análise pelo administrador. Você receberá a liberação em breve."
2. **Given** uma conta com status `rejeitado` ou `bloqueado`, **When** o usuário tenta fazer login, **Then** o sistema bloqueia o acesso com mensagem informativa sobre o contato comercial.

---

### User Story 4 - Painel do Administrador para Aprovação de Professores e Emissão de PINs (Priority: P2)

Como administrador/proprietário da plataforma (logado como administrador), quero visualizar a lista de solicitações pendentes recebidas no Firebase, aprovar ou recusar solicitações com um clique, e gerar novos PINs de acesso para entregar aos compradores do produto.

**Why this priority**: Dá ao proprietário autonomia completa para gerenciar seus clientes, aceitar solicitações e monetizar o produto diretamente pela interface web.

**Independent Test**: Pode ser testado fazendo login com credenciais de administrador, abrindo o painel de solicitações, clicando em "Aprovar" em uma solicitação pendente e verificando que a conta do professor passa imediatamente para `ativo`.

**Acceptance Scenarios**:

1. **Given** o administrador logado na plataforma, **When** abre a seção de "Solicitações de Acesso", **Then** visualiza todos os professores pendentes com Nome, E-mail, WhatsApp e data da solicitação.
2. **Given** uma solicitação pendente, **When** o administrador clica em "Aprovar Acesso", **Then** o status da conta é atualizado para `ativo` no Firebase e o professor passa a conseguir fazer login normalmente.
3. **Given** que o administrador deseja gerar um PIN de ativação antecipado para venda direta, **When** gera o PIN no painel, **Then** o PIN é salvo como código de licença disponível no Firebase.

---

### Edge Cases

- O que acontece se o primeiro professor/administrador precisar se registrar no sistema antes de existir qualquer aprovação? O sistema deve reconhecer o e-mail master do proprietário ou uma Chave Mestre de Instalação/Fundador para conceder privilégios de administrador automaticamente ao proprietário.
- O que acontece se um professor esquecer seu PIN de ativação ou não receber retorno imediato? O formulário deve disponibilizar um link direto para o WhatsApp do administrador/suporte comercial ("Falar com o Administrador no WhatsApp").
- O que acontece se um usuário tentar cadastrar múltiplos e-mails falsos repetidamente? O sistema deve validar formato de e-mail, formato de telefone/WhatsApp e aplicar validação de unicidade de e-mail no Firebase.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O formulário de criação de conta de professor MUST incluir campos para Nome Completo, E-mail, WhatsApp/Telefone para contato, Senha e um campo opcional/alternativo para "PIN ou Código de Ativação".
- **FR-002**: Se o usuário fornecer um PIN/Código de Ativação válido previamente gerado pelo administrador, o sistema MUST criar a conta com status `ativo` e realizar o login imediato.
- **FR-003**: Se o usuário não possuir um PIN, o sistema MUST salvar a requisição de cadastro no Firebase com status `pendente` e registrar a data/hora e dados de contato.
- **FR-004**: O sistema MUST exibir uma mensagem clara em português após o envio da solicitação pendente, orientando o usuário sobre o processo de análise e disponibilizando um botão de contato direto via WhatsApp comercial do proprietário.
- **FR-005**: A tentativa de login na aba "Sou Professor > Entrar" MUST verificar o status da conta no Firebase; contas com status `pendente` MUST ser impedidas de entrar com mensagem explicativa de aprovação pendente.
- **FR-006**: O sistema MUST disponibilizar ao administrador uma interface de gestão para visualizar as requisições pendentes, com ações de "Aprovar", "Recusar" e visualização rápida do contato de WhatsApp do solicitante.
- **FR-007**: O sistema MUST permitir ao administrador gerar novos PINs/Códigos de ativação para liberação comercial avulsa de novos professores.
- **FR-008**: As regras de segurança do Cloud Firestore (`firestore.rules`) MUST permitir a criação de solicitações com status `pendente`, mas restringir a transição de status para `ativo` e a leitura dos dados sensíveis aos professores devidamente autenticados e aprovados.

### Key Entities *(include if feature involves data)*

- **Conta de Professor / Solicitação de Acesso (`professors`)**:
  - `name`: Nome completo do professor.
  - `emailLower`: E-mail padronizado em minúsculas (chave única lógica).
  - `phone`: Telefone/WhatsApp de contato comercial.
  - `passwordHash`: Hash seguro SHA-256 da senha.
  - `status`: Estado da conta (`pendente`, `ativo`, `bloqueado`).
  - `role`: Papel na plataforma (`admin` para o proprietário comercial, `professor` para avaliadores).
  - `activationPin`: PIN ou código utilizado na ativação (se aplicável).
  - `createdAt`: Timestamp de submissão da solicitação.
  - `approvedAt`: Timestamp da aprovação pelo administrador (se aprovado).
- **Código / PIN de Licença de Acesso (`activation_codes`)**:
  - `code`: Código alfanumérico ou PIN de 6 dígitos gerado pelo administrador.
  - `status`: Estado do código (`disponivel`, `utilizado`, `expirado`).
  - `usedByEmail`: E-mail do professor que utilizou o código para ativação instantânea.
  - `createdAt`: Timestamp de criação do código.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 0% de acesso indevido por usuários sem aprovação ou sem PIN válido às funcionalidades de avaliação e dados de atletas.
- **SC-002**: O tempo para submeter uma solicitação de cadastro pelo professor é inferior a 1 minuto em dispositivos móveis ou desktop.
- **SC-003**: O administrador consegue aprovar ou reprovar uma solicitação com no máximo 2 cliques na interface.
- **SC-004**: O professor com PIN válido em mãos conclui o cadastro e acessa a plataforma em menos de 30 segundos.
- **SC-005**: 100% das solicitações pendentes ficam registradas no Firebase Firestore com dados de contato para prospecção comercial.

## Assumptions

- O proprietário utilizará o aplicativo comercialmente, compartilhando o link do app com profissionais e vendendo o acesso/assinatura diretamente ou por contato de WhatsApp.
- O proprietário possui uma conta com perfil `admin` (definida via e-mail mestre ou chave de fundador) para moderar as solicitações recebidas.
- A aplicação permanece como artefato estático (HTML + JS vanilla + Firebase SDK via CDN) em estrita conformidade com a Constituição do RunLab.
