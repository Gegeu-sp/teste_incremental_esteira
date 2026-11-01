# Quickstart & Guia de Validação: Banco de Dados em Nuvem (Firestore), Comparação e Regra de vPico

**Feature**: `specs/008-historico-atletas-velocidade-pico`  
**Date**: 2026-11-01

## 1. Pré-requisitos
- Node.js (v18+) para execução dos testes automatizados (`npm test`).
- Conexão com a internet para leitura/gravação no Firebase Firestore (`teste-incremental-56aeb`).
- Regras do Cloud Firestore publicadas no projeto `teste-incremental-56aeb` permitindo leitura e escrita na coleção `athletes`.

---

## 2. Validação Automatizada de Unidade (`assets/calc.js`)

Executar a suíte de testes a partir do diretório do repositório (`teste_incremental_esteira`):

```bash
npm test
# ou:
node --test tests/*.test.js
```

**Cenários validados automaticamente**:
1. **`computeVPeak` — Interrupção no meio do estágio (US1)**:
   - Início em `8 km/h`, concluídos Estágio 1 (`8 km/h`) e Estágio 2 (`9 km/h`), interrompido durante o Estágio 3 (`10 km/h`) → `vPeak` retorna exatamente `9.0 km/h` (o estágio anterior concluído), ignorando o estágio em andamento.
   - Interrupção antes de concluir o 1º estágio (`completedStages = []`) → retorna `startV` com `fallbackToStart: true`.
2. **`compareAssessments` — Evolução entre dois testes (US3)**:
   - Calcula deltas exatos (`Δ vPeak`, `Δ vo2max`, `Δ vt1V`, `Δ vt2V`, `Δ tteSec`, `Δ weight`, `Δ restHr`).
   - Emparelha estágios de mesma velocidade (`km/h`) e calcula `deltaHr` (ex.: `165 bpm → 156 bpm` a `10 km/h` = `-9 bpm`).

---

## 3. Validação Manual Ponta a Ponta (End-to-End)

### Cenário A: Interrupção de Estágio Considerando o km/h Anterior (US1)
1. Abrir o RunLab, configurar velocidade inicial em `8 km/h` e iniciar o Teste Incremental.
2. Após concluir pelo menos um estágio e entrar no estágio seguinte (ex.: correndo a `9 km/h` com `01:15` restantes no cronômetro do estágio), clicar em **"⏹ Encerrar"**.
3. **Resultado esperado**:
   - O `vPico / vVO₂max` registrado nos resultados é **`8.0 km/h`** (velocidade do estágio anterior concluído), e não `9.0 km/h` nem `8.38 km/h`.

### Cenário B: Salvar e Reabrir Atleta no Firebase Firestore (US2)
1. Preencher os dados de perfil de um atleta (ex.: `"Carlos Silva"`, 32 anos, 75 kg), triagem e teste.
2. Clicar em **"☁ Salvar no Banco (Nuvem)"**.
3. Clicar em **"Zerar dados"** ou iniciar uma avaliação para outro atleta (`"Marina Souza"`).
4. Abrir a aba **`8 · Atletas & Evolução`**, localizar `"Carlos Silva"` na lista carregada do Firebase Firestore e clicar em **"Reabrir"** na avaliação salva.
5. **Resultado esperado**:
   - Todos os dados do perfil, triagem, teste incremental, zonas e plano de `"Carlos Silva"` são restaurados na interface.

### Cenário C: Comparar Evolução de um Atleta (US3)
1. Na aba **`8 · Atletas & Evolução`**, clicar em **"Nova avaliação"** para um atleta já cadastrado.
2. Realizar/registrar um segundo teste com evolução (ex.: `vPico` maior ou menor FC nos mesmos estágios) e clicar em **"☁ Salvar no Banco (Nuvem)"**.
3. Clicar em **"Comparar evolução"** no card do atleta.
4. **Resultado esperado**:
   - Exibição lado a lado da Avaliação Anterior vs. Avaliação Atual com os deltas (`Δ vPico`, `Δ VO₂máx`, `Δ Limiares`, `Δ tlim`, `Δ Peso`) e a tabela comparativa de FC por velocidade (`km/h`).

