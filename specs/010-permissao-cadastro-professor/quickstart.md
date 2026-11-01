# Quickstart & Validation Guide: Restrição, PIN de Acesso e Aprovação de Professores

**Feature**: `010-permissao-cadastro-professor`  
**Date**: 2026-11-01  
**Status**: Completed  

---

## 1. Pré-Requisitos e Ambiente

- Repositório local: `teste_incremental_esteira`
- Execução dos testes automatizados: Node.js (`node --test tests/*.test.js`)
- Execução da aplicação web: Navegador estático abrindo `index.html` ou servido via `npx serve .` / Firebase Hosting (`https://teste-incremental-56aeb.web.app`)

---

## 2. Roteiro de Validação Passo a Passo

### Cenário 1: Solicitação de Cadastro Sem PIN (Lead Comercial)
1. Abra o RunLab no navegador.
2. Certifique-se de estar deslogado (tela de autenticação visível).
3. Selecione a aba **"Sou Professor"** e clique no sub-botão **"Criar Conta"**.
4. Preencha:
   - Nome: `Prof. Roberto Teste`
   - E-mail: `roberto.teste@exemplo.com`
   - WhatsApp: `(11) 98888-7777`
   - Senha: `senhaSegura123`
   - Confirmação de Senha: `senhaSegura123`
   - Deixe o campo "PIN de Ativação" em branco.
5. Clique em **"Enviar Solicitação de Cadastro"**.
6. **Resultado Esperado**:
   - Uma mensagem em destaque verde/azul é exibida:
     *"✅ Solicitação enviada com sucesso! Seu acesso está aguardando liberação do administrador."*
   - É exibido um botão direto: *"Falar com o Administrador no WhatsApp"*.
   - A conta NÃO loga automaticamente na tela de avaliação de alunos.

---

### Cenário 2: Tentativa de Login de Conta com Aprovação Pendente
1. Na tela de login ("Sou Professor > Entrar"), insira:
   - E-mail: `roberto.teste@exemplo.com`
   - Senha: `senhaSegura123`
2. Clique em **"Entrar"**.
3. **Resultado Esperado**:
   - O login é bloqueado.
   - É exibido o aviso: *"Sua solicitação de acesso está em análise pelo administrador. Entre em contato pelo WhatsApp para liberação imediata."*

---

### Cenário 3: Painel do Administrador (Aprovação de Solicitação)
1. Faça login com a conta de Administrador (proprietário).
2. Observe que no cabeçalho ou menu aparece o botão **"👑 Painel Admin"** com indicador numérico de solicitações pendentes.
3. Clique em **"Painel Admin"** para abrir o modal de gestão.
4. Na lista de solicitações pendentes, localize `Prof. Roberto Teste`.
5. Clique no botão **"✅ Aprovar Acesso"**.
6. **Resultado Esperado**:
   - O status do professor passa para `ativo` no Firestore.
   - Ao deslogar e tentar entrar com `roberto.teste@exemplo.com`, o login é efetuado com sucesso e o professor ganha acesso completo às ferramentas.

---

### Cenário 4: Geração de PIN e Ativação Instantânea
1. No Painel Admin, acesse a aba **"Códigos de Ativação / Licenças"**.
2. Clique em **"➕ Gerar Novo PIN de Ativação"**.
3. Copie o código gerado (ex.: `RL-849201`).
4. Abra uma janela anônima e vá em "Sou Professor > Criar Conta".
5. Preencha novo cadastro inserindo o código `RL-849201` no campo de PIN.
6. Clique em **"Cadastrar e Ativar Agora"**.
7. **Resultado Esperado**:
   - A conta é ativada imediatamente e o professor é logado sem precisar de aprovação manual posterior.
   - O PIN é marcado como `utilizado` no Firebase.

---

## 3. Validação Automatizada de Código & Testes

```powershell
# Executar suíte de testes unitários
cd teste_incremental_esteira
node --test tests/*.test.js
```

