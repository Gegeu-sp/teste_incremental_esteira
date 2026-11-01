# Research & Technical Decisions: Restrição, PIN de Acesso e Aprovação de Professores

**Feature**: `010-permissao-cadastro-professor`  
**Date**: 2026-11-01  
**Status**: Completed  

---

## 1. Contexto e Objetivos Comerciais

O RunLab foi idealizado para ser comercializado para profissionais de educação física, assessorias de corrida, clínicas e academias. No modelo atual (Feature 009), qualquer pessoa que abra a URL do aplicativo pode acessar a aba "Criar Conta de Professor" e obter acesso irrestrito às ferramentas e cadastros de alunos.

Para permitir a comercialização sustentável do software, o sistema precisa:
1. Impedir o uso da ferramenta por pessoas que não tenham adquirido a licença.
2. Permitir que interessados solicitem o acesso através do próprio site, gravando a requisição no Firebase Firestore com dados de contato (WhatsApp).
3. Permitir que o proprietário (Administrador) aprove as solicitações com 1 clique ou forneça um PIN de ativação antecipado para clientes que já pagaram.
4. Manter a arquitetura 100% estática e serverless (Constituição RunLab - Princípio II), sem necessidade de contratar backend intermediário.

---

## 2. Decisões Arquiteturais

### Decisão 1: Modelo Híbrido (Solicitação com Aprovação + Ativação Instantânea por PIN)
- **Decisão**: Oferecer dois caminhos complementares no formulário de cadastro de professor:
  - **Caminho A (Solicitação em Aberto)**: Usuário preenche Nome, E-mail, WhatsApp e Senha sem PIN. O sistema grava a conta em `professors` com `status: "pendente"`. Ao submeter, exibe mensagem confirmando o envio da solicitação e fornecendo atalho direto para o WhatsApp do proprietário.
  - **Caminho B (Ativação Instantânea)**: Caso o cliente já tenha comprado a licença via WhatsApp/Pix, o proprietário fornece um PIN ou Código de Ativação (ex.: `RUN-789012` ou PIN numérico de 6 dígitos). O cliente digita o PIN no cadastro e a conta nasce imediatamente com `status: "ativo"`.
- **Justificativa**: Unifica tanto o funil de vendas (captura de novos leads/pedidos de acesso) quanto a entrega imediata e self-service para quem já é cliente.
- **Alternativas Rejeitadas**:
  - *Apenas PIN fechado*: Impede interessados que visitaram o site de manifestarem interesse e solicitarem o acesso diretamente na tela.
  - *Apenas Aprovação Manual*: Obriga o cliente que já pagou a aguardar a aprovação manual do administrador antes de poder usar o sistema pela primeira vez.

---

### Decisão 2: Modelo de Dados no Firestore (`professors` e `activation_codes`)
- **Decisão**:
  - Expandir o schema da coleção `professors`:
    - `phone`: número de telefone/WhatsApp com DDD.
    - `status`: `'pendente'` | `'ativo'` | `'bloqueado'` (padrão: `'pendente'` quando criado sem PIN; `'ativo'` quando criado com PIN válido ou aprovado).
    - `role`: `'admin'` para o proprietário do RunLab e `'professor'` para os demais avaliadores.
    - `activationPin`: PIN utilizado na ativação (se aplicável).
    - `approvedAt`: timestamp da aprovação.
    - `approvedBy`: e-mail do administrador que aprovou.
  - Nova coleção `activation_codes`:
    - Documento ID = hash ou código sanitizado (ex.: `code: "RL-948123"`).
    - `code`: string com o código legível.
    - `status`: `'disponivel'` | `'utilizado'` | `'cancelado'`.
    - `createdAt`: timestamp de geração.
    - `usedByEmail`: e-mail da conta que ativou o código.
    - `usedAt`: timestamp do uso.
- **Justificativa**: Estrutura enxuta, de alta performance no Firestore, com histórico de auditoria e sem custo adicional de leitura.

---

### Decisão 3: Identificação do Administrador e Segurança das Operações
- **Decisão**: O papel de `admin` pode ser atribuído a:
  - Conta inicial mestre pré-definida ou configurada pelo e-mail do proprietário (ex.: verificação por e-mail mestre no client ou documento em `system_config/admin`).
  - Quando um professor com `role === 'admin'` estiver autenticado, a interface desbloqueia o menu/modal "Painel do Proprietário / Administrador" com as opções de:
    - Listar solicitações pendentes (`professors` onde `status == "pendente"`).
    - Botão `Aprovar Acesso` (altera `status: "ativo"` e `approvedAt`).
    - Botão `Gerar Novo PIN de Licença` (gera PIN criptograficamente aleatório e salva em `activation_codes` como `disponivel`).
    - Botão `Copiar Mensagem de Boas-vindas para WhatsApp` com o PIN e link do app pronto para envio ao cliente.
- **Regras do Firestore (`firestore.rules`)**:
  - `allow create`: Qualquer usuário pode criar seu registro em `professors` desde que `status == 'pendente'`, ou se fornecer `activationPin` válido.
  - `allow update`: Apenas contas logadas podem atualizar seus dados, mas a alteração de `status` para `'ativo'` ou de `role` para `'admin'` é restrita a administradores.

---

### Decisão 4: Experiência na Esteira e Conflito de Sessões
- **Decisão**: A checagem de status da conta é feita tanto no login quanto na inicialização da aplicação a partir da sessão salva no `localStorage`. Se uma conta estiver `pendente`, o sistema não carrega os atletas nem as telas de avaliação, exibindo uma tela de bloqueio com mensagem de suporte comercial.
- **Justificativa**: Evita qualquer brecha de manipulação do `localStorage` do navegador para simular acesso ativo.

