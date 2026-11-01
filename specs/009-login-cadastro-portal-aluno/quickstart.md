# Quickstart & Guia de Validação: Login, Central de Alunos e Portal do Aluno

**Feature**: `009-login-cadastro-portal-aluno`  
**Date**: 2026-11-01  
**Spec Reference**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

---

## 1. Validação Automatizada de Testes Unitários

Execute a suíte de testes no terminal do projeto para validar os algoritmos de geração de prescrições de treino e formatação de acessos:

```bash
cd teste_incremental_esteira
node --test tests/*.test.js
```

**Critério de Sucesso**:
- Todos os testes de cálculo de prescrições (`generateWorkoutPrescriptions`), códigos de acesso (`generateStudentAccessCode`) e compatibilidade com avaliações passam com 0 falhas.

---

## 2. Roteiro de Validação Manual Passo a Passo (End-to-End)

### Cenário 1: Cadastro e Login de Professor
1. Acesse o RunLab no navegador (`http://localhost:5000` ou `https://teste-incremental-56aeb.web.app`).
2. Na tela de boas-vindas, selecione **"Sou Professor" → "Criar Conta"**.
3. Preencha:
   - **Nome**: `Prof. Marcelo Treinador`
   - **E-mail**: `marcelo@runlab.com`
   - **CREF**: `098765-G/SP`
   - **Senha**: `senha1234`
4. Clique em **"Cadastrar e Acessar"**.
5. **Resultado Esperado**: O sistema cria a conta no Firestore, autentica a sessão e exibe o painel do professor com a saudação `👨‍🏫 Prof. Marcelo Treinador` no topo e botão de logout.

---

### Cenário 2: Central de Alunos na Tela Inicial (`1 · Aluno & Perfil`)
1. Com a conta de professor ativa, observe a aba inicial `1 · Aluno & Perfil`.
2. Clique no botão **"+ Novo Aluno"**.
3. Observe que o sistema sugere automaticamente um **Código de Acesso** (ex.: `ALUNO-582`) e um **PIN** (ex.: `1234`).
4. Preencha os dados do aluno:
   - **Nome**: `Juliana Costa`
   - **Idade**: `32` | **Sexo**: `F` | **Peso**: `60 kg` | **Altura**: `168 cm`
   - **Objetivo**: `Completar Meia Maratona (21k)`
   - **Nível**: `Recreacional`
   - **FC Repouso**: `58 bpm`
5. Clique em **"💾 Salvar Aluno & Iniciar Avaliação"**.
6. **Resultado Esperado**: O aluno é cadastrado no Firestore. No topo da tela aparece o badge indicando o aluno ativo `🏃 Juliana Costa`. O formulário do teste já está pré-configurado com os dados dela.
7. Teste a busca: no campo de busca de alunos, digite `Juliana`. O sistema exibe o card da Juliana com botão de seleção imediata.

---

### Cenário 3: Execução/Registro da Avaliação e "Ver como Aluno"
1. Conclua uma avaliação para a aluna (ou utilize uma avaliação de teste com $v\text{Pico} = 13,0\text{ km/h}$).
2. Salve a avaliação na nuvem clicando em **"☁ Salvar na Nuvem"**.
3. No cabeçalho do professor ou na aba de Alunos, clique no botão **"👀 Ver Treinos do Aluno"**.
4. **Resultado Esperado**: A interface alterna para a visão do **Portal do Aluno**:
   - Resumo claro: $v\text{Pico}$ de `13,0 km/h`, Pace `4:37 min/km`, $VO_2\text{máx}$ e limiares;
   - As 5 Zonas de Treinamento com cores destacadas;
   - Os 6 cards detalhados de treino na esteira (Regenerativo Z1, Rodagem Z2, Tempo Run Z3, HIIT Longo Z4, HIIT Curto, Tiros Z5), cada um com **velocidade exata em km/h**, **pace em min/km**, **faixa de bpm** e roteiro detalhado de aquecimento, estímulo e volta à calma.
5. Clique em **"← Voltar ao Painel do Professor"** para retornar ao ambiente de avaliação.

---

### Cenário 4: Login Independente do Aluno
1. No cabeçalho do professor, clique em **"Sair (Logout)"**.
2. A tela volta para a recepção de autenticação.
3. Clique na aba **"Sou Aluno"**.
4. Informe:
   - **Código de Acesso ou Nome**: `Juliana Costa` (ou o código `JULIANA-...`)
   - **PIN / Senha**: `1234`
5. Clique em **"Acessar Meus Treinos"**.
6. **Resultado Esperado**:
   - O aluno é autenticado com sucesso e entra diretamente no **Portal do Aluno** em modo somente-leitura de alta legibilidade.
   - Os botões clínicos do professor (iniciar teste incremental, calibração, exclusão de dados) estão ocultos.
   - O aluno pode consultar seus treinos diretamente no celular enquanto corre na esteira da academia.

