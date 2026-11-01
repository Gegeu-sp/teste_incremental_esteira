# Contracts & Interface Specifications: Aprovação e PIN de Acesso

**Feature**: `010-permissao-cadastro-professor`  
**Date**: 2026-11-01  
**Status**: Completed  

---

## 1. Funções Puras do Módulo de Autenticação & Licenças (`calc.js`)

As funções abaixo são puras, testáveis via `node --test tests/*.test.js` e não dependem do DOM ou SDK externo.

### 1.1 `generateActivationPin(seedString, length = 6)`
Gera um PIN de ativação alfanumérico ou numérico em caixa alta, seguro e de fácil leitura para digitação em teclados de celular e envio via WhatsApp.

- **Entrada**:
  - `seedString` *(string/number, opcional)*: Semente ou timestamp aleatório.
  - `length` *(number, padrão: 6)*: Quantidade de caracteres do código (ex.: `"RL-829140"` ou `"940182"`).
- **Saída**:
  - String padronizada em caixa alta sem caracteres ambíguos (ex.: exclui `0`, `O`, `1`, `I` se alfanumérico ou numérico puro).
- **Exemplo**:
  ```js
  generateActivationPin() // Retorna ex.: "RL-784192"
  ```

### 1.2 `validatePhone(phoneString)`
Higieniza e valida o formato de telefone/WhatsApp brasileiro para contato comercial.

- **Entrada**:
  - `phoneString` *(string)*: Telefone com DDD (ex.: `"(11) 98765-4321"` ou `"11987654321"`).
- **Saída**:
  - `{ valid: boolean, sanitized: string, error?: string }`
  - Se válido, `sanitized` contém apenas números (10 ou 11 dígitos).

### 1.3 `evaluateProfessorAccess(professorRecord)`
Avalia se um registro de professor tem permissão ativa de login na plataforma.

- **Entrada**:
  - `professorRecord`: Objeto com os campos `{ status, role, approvedAt, ... }`.
- **Saída**:
  - `{ allowed: boolean, reason: 'active' | 'pending_approval' | 'blocked' | 'invalid_record', messagePtBr: string }`
- **Exemplo**:
  ```js
  evaluateProfessorAccess({ status: 'pendente' })
  // Retorna { allowed: false, reason: 'pending_approval', messagePtBr: 'Sua solicitação de cadastro está em análise pelo administrador...' }
  ```

---

## 2. Interface com Firestore (`ProfessorAuthDB`)

### 2.1 `registerProfessorRequest({ name, email, phone, password, pinCode })`
- **Fluxo**:
  1. Higieniza `emailLower` e `phone`.
  2. Gera `passwordHash` usando Web Crypto API SHA-256.
  3. Se `pinCode` for fornecido:
     - Verifica se o PIN existe na coleção `activation_codes` com `status == 'disponivel'`.
     - Se válido: marca o código como `utilizado`, grava o professor com `status: 'ativo'` e inicia a sessão.
     - Se inválido: lança erro "Código ou PIN de ativação inválido ou já utilizado".
  4. Se `pinCode` NÃO for fornecido:
     - Grava o professor na coleção `professors` com `status: 'pendente'`.
     - Retorna `{ success: true, pendingApproval: true, message: 'Solicitação enviada com sucesso!' }`.

### 2.2 `authenticateProfessor({ email, password })`
- **Fluxo**:
  1. Busca o documento em `professors` pelo `emailLower`.
  2. Compara o hash da senha informada com o `passwordHash`.
  3. Executa `evaluateProfessorAccess(professorData)`.
  4. Se `status === 'pendente'`, bloqueia o login e devolve `{ error: 'pending_approval', phone: adminPhone }`.
  5. Se `status === 'bloqueado'`, bloqueia o login e devolve `{ error: 'blocked' }`.
  6. Se `status === 'ativo'`, cria a sessão local e redireciona para a tela inicial.

### 2.3 `approveProfessorRequest(professorId, adminUser)` (Apenas Admin)
- **Fluxo**:
  - Atualiza o documento em `professors` para `status: 'ativo'`, `approvedAt: new Date().toISOString()`, `approvedBy: adminUser.email`.

### 2.4 `createActivationCode(adminUser, customCode = null)` (Apenas Admin)
- **Fluxo**:
  - Gera novo PIN e salva na coleção `activation_codes` com `status: 'disponivel'`, `createdBy: adminUser.email`.

---

## 3. Contrato de Notificação Visual & Suporte WhatsApp
- Link gerado para contato comercial:
  `https://wa.me/55${ADMIN_WHATSAPP}?text=Olá,%20acabei%20de%20solicitar%20meu%20cadastro%20no%20RunLab%20(E-mail:%20${email})%20e%20gostaria%20de%20liberar%20meu%20acesso.`

