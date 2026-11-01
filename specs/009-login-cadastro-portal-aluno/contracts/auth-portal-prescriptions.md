# Contracts: Autenticação, Prescrição de Treinos e Portal do Aluno

**Feature**: `009-login-cadastro-portal-aluno`  
**Date**: 2026-11-01  
**Spec Reference**: [spec.md](../spec.md)

---

## 1. Contratos de Funções Puras (`assets/calc.js`)

### 1.1 `generateWorkoutPrescriptions(assessment)`

Gera deterministicamente a lista de fichas de treino para esteira a partir dos dados consolidados de uma avaliação.

- **Entrada (`assessment: object`)**:
  - `vPeak: number` (obrigatório, > 0)
  - `vo2max?: number`
  - `hrMax?: number` (ou calculado via Tanaka se ausente)
  - `restHr?: number`
  - `vt1V?: number`
  - `vt2V?: number`
  - `fcVT1?: number`
  - `fcVT2?: number`
  - `tlimSec?: number`
  - `zones?: Array<{ id: string, name: string, minV: number, maxV: number, hrMin: number, hrMax: number }>`
- **Saída (`WorkoutPrescriptionCard[]`)**:
  - Array com exatamente 6 fichas de treino estruturadas:
    1. `rec-z1`: Regenerativo Z1 (55–65% de $v\text{Pico}$)
    2. `base-z2`: Rodagem Aeróbia Contínua Z2 (65–75% de $v\text{Pico}$, abaixo do VT1)
    3. `tempo-z3`: Tempo Run / Limiar Z3 (78–88% de $v\text{Pico}$, entre VT1 e VT2)
    4. `hiit-vo2-z4`: Intervalado Longo $VO_2\text{máx}$ Z4 (95–100% de $v\text{Pico}$)
    5. `hiit-short`: HIIT Curto na Esteira (100–105% de $v\text{Pico}$)
    6. `speed-z5`: Tiros de Economia de Corrida Z5 (105–112% de $v\text{Pico}$)
- **Comportamento com Dados Incompletos / Limites**:
  - Se `assessment` for nulo ou `vPeak <= 0`: retorna lista vazia `[]`.
  - Se `vt1V` ou `vt2V` não tiverem sido identificados: calcula estimativas fisiológicas padrão (VT1 = $0.70 \times v\text{Pico}$, VT2 = $0.85 \times v\text{Pico}$).
  - Todos os valores de velocidade são arredondados para 1 casa decimal (padrão de painéis de esteiras comerciais, ex.: `8.5`, `10.0`, `12.5`).
  - Todos os paces são formatados como strings `"M:SS"` (ex.: `"5:00"`, `"6:15"`).

---

### 1.2 `generateStudentAccessCode(studentName, saltSeed)`

Gera um código alfanumérico amigável e legível para o aluno acessar a plataforma.

- **Entrada**:
  - `studentName: string` (ex.: `"Carlos Eduardo Silva"`)
  - `saltSeed?: number` (ex.: número aleatório de 3 dígitos)
- **Saída (`string`)**:
  - String maiúscula sem acentos nem caracteres especiais no formato `PREFIX-NNN` (ex.: `"CARLOS-742"`).

---

### 1.3 `hashPassword(plainTextPassword)`

Gera o hash SHA-256 de uma senha ou PIN utilizando a Web Crypto API no navegador ou fallback limpo.

- **Entrada**: `plainTextPassword: string`
- **Saída**: `Promise<string>` contendo a representação hexadecimal de 64 caracteres.

---

## 2. Contratos de Autenticação e Dados no Firebase Firestore

### 2.1 Coleção `professors`

- **Criar Conta de Professor**:
  - Operação: `setDoc(doc(db, "professors", professorId), { name, email, emailLower, cref, passwordHash, createdAt, updatedAt })`
  - Restrição: `emailLower` deve ser único.
- **Login de Professor**:
  - Operação: consulta por `emailLower == inputEmail.toLowerCase()`. Se encontrado, compara `passwordHash` gerado no cliente com o hash salvo no documento.
  - Sucesso: armazena sessão em `localStorage` e inicializa a interface do professor.

### 2.2 Coleção `athletes`

- **Login de Aluno**:
  - Operação: consulta por `accessCodeLower == inputCode.toLowerCase()` OU `nameLower == inputName.toLowerCase()`.
  - Se encontrado, valida o `pin` cadastrado na ficha do aluno.
  - Sucesso: armazena sessão `role: 'student'` e renderiza o Portal do Aluno com seus dados e treinos.
- **Busca em Tempo Real no Cadastro Inicial**:
  - Permite ao professor buscar alunos por prefixo ou termo digitado (`nameLower >= query && nameLower <= query + '\uf8ff'`), ou filtragem no cache em memória dos atletas já carregados.

