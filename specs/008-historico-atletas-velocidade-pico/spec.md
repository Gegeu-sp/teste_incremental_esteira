# Feature Specification: Banco de Dados de Atletas, Comparação de Evolução e Regra de Estágio Completo no vPico

**Feature Branch**: `specs/008-historico-atletas-velocidade-pico`

**Created**: 2026-11-01

**Status**: Draft

**Input**: User description: "precisa criar um banco de dados para salvar os dados e perifl dos atletas que ja fizeram o teste. para fim de comparar e acessar novamente os dados. alem disso, quando o teste é interrompido e nao concluido o estagio atual o km a se considerar é o anterior,"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Considerar Apenas o Último Estágio Concluído quando o Teste é Interrompido (Priority: P1)

Como avaliador físico conduzindo o teste incremental de 2 minutos por estágio, desejo que, quando o teste for encerrado/interrompido antes de o atleta concluir os 2 minutos do estágio atual, a velocidade de pico (`vPico` / `vVO₂max`) considerada para diagnóstico, VO₂máx, limiares e zonas de treino seja a velocidade do **estágio anterior efetivamente concluído** (sem somar o estágio atual incompleto nem fração dele), garantindo rigor fisiológico na prescrição.

**Why this priority**: É uma regra fisiológica central do protocolo que afeta diretamente o cálculo de `vPico`, `VO₂máx`, `METs`, limiares (`VT1`/`VT2`) e todas as 5 zonas de treinamento (Princípio IV — Precisão Numérica Testável).

**Independent Test**: Iniciar um teste em `8,0 km/h`, concluir o Estágio 1 (`8,0 km/h`) e o Estágio 2 (`9,0 km/h`), e interromper o teste aos 45 segundos do Estágio 3 (`10,0 km/h`). Verificar que o resultado final registra `vPico = 9,0 km/h` (o estágio anterior concluído), e não `10,0 km/h` nem `10,38 km/h`.

**Acceptance Scenarios**:

1. **Given** um atleta que completou pelo menos um estágio de 2 minutos (ex.: concluiu `8,0 km/h` e `9,0 km/h`) e está correndo no estágio seguinte (`10,0 km/h`), **When** o avaliador interrompe/finaliza o teste antes de o cronômetro do estágio atual (`10,0 km/h`) completar os 2 minutos, **Then** o sistema define `vPico` exatamente como a velocidade do último estágio concluído (`9,0 km/h`) e calcula `VO₂máx`, `METs` e zonas de treino sobre esse valor.
2. **Given** o encerramento do teste durante um estágio incompleto, **When** o relatório de resultados é exibido, **Then** a tabela e o resumo mostram os estágios concluídos como base oficial do `vPico` (podendo exibir o tempo total acumulado de corrida apenas como informação complementar de duração).
3. **Given** uma interrupção precoce ainda durante o 1º estágio (antes de completar os primeiros 2 minutos, sem estágio anterior concluído), **When** o avaliador encerra o teste, **Then** o sistema utiliza a velocidade inicial (`startV`) como piso mínimo de segurança ou alerta que nenhum estágio completo de 2 minutos foi fechado.

---

### User Story 2 - Salvar, Buscar e Reabrir Perfis e Avaliações de Atletas no Banco de Dados (Priority: P1)

Como avaliador que atende múltiplos alunos/atletas ao longo do tempo, desejo salvar cada atleta (perfil completo) e o histórico de todas as suas avaliações (triagem, teste incremental, teste de tolerância, zonas e plano semanal) em um banco de dados estruturado, podendo buscar, listar e carregar novamente os dados de qualquer atleta a qualquer momento sem perder os dados ao iniciar a avaliação de outro aluno.

**Why this priority**: Hoje o aplicativo armazena apenas um único estado ativo (`runlab_state_v2`), que é sobrescrito quando outro atleta é avaliado. Sem um banco de dados de atletas e histórico de testes, o profissional perde as avaliações anteriores ao atender o próximo aluno.

**Independent Test**: Cadastrar e concluir a avaliação do "Atleta A", salvar no banco de dados, iniciar uma nova avaliação para o "Atleta B", salvar, e em seguida selecionar novamente o "Atleta A" na lista de atletas para verificar que seu perfil, triagem, teste incremental, teste de tolerância e prescrição são restaurados integralmente.

**Acceptance Scenarios**:

1. **Given** uma avaliação preenchida (perfil, triagem, teste incremental e/ou tolerância), **When** o avaliador clica em "Salvar avaliação do atleta" (ou ao concluir um teste), **Then** o perfil do atleta e o registro datado da avaliação são gravados no banco de dados.
2. **Given** múltiplos atletas já cadastrados no banco de dados, **When** o avaliador acessa a área/gaveta de "Atletas & Histórico" e busca pelo nome, **Then** o sistema lista os atletas com a data da última avaliação, `vPico` e `VO₂máx`, permitindo carregar o perfil para uma **nova avaliação** ou **reabrir uma avaliação passada** para visualização/impressão de PDF.
3. **Given** um atleta selecionado no banco de dados, **When** o avaliador clica em "Nova avaliação para este atleta", **Then** os dados cadastrais do perfil (nome, idade, sexo, peso, estatura, nível, objetivo) são mantidos e os campos de triagem/teste são limpos para iniciar a nova coleta, preservando todas as avaliações anteriores no histórico do atleta.
4. **Given** um registro de atleta ou avaliação específica no banco, **When** o avaliador solicita excluir uma avaliação ou excluir o atleta (com confirmação), **Then** o registro selecionado é removido com segurança.

---

### User Story 3 - Comparar Avaliações de um Mesmo Atleta (Evolução Temporal) (Priority: P2)

Como avaliador reavaliando um atleta após um ciclo de treinamento (ex.: 8 ou 12 semanas), desejo comparar lado a lado duas ou mais avaliações desse atleta (ex.: Teste Atual vs. Teste Anterior), visualizando a evolução de peso, FC de repouso, `vPico`, `VO₂máx`, limiares (`VT1` e `RCP/VT2`), tempo de tolerância (`tlim`) e a curva de FC por velocidade, para demonstrar objetivamente os ganhos de condicionamento.

**Why this priority**: A comparação longitudinal é o principal argumento de valor para o treinador e para a retenção do aluno, mostrando se para uma mesma velocidade submáxima a frequência cardíaca caiu (economia/adaptação cardiovascular) e se o `vPico`/`VO₂máx` subiu.

**Independent Test**: Para um atleta com pelo menos 2 testes salvos em datas diferentes (ex.: `vPico 10 km/h` em agosto e `vPico 11 km/h` em novembro), abrir a visão de Comparação e verificar os deltas (`+1,0 km/h`, `+3,5 ml/kg·min`, variação de FC por estágio e de `tlim`).

**Acceptance Scenarios**:

1. **Given** um atleta com 2 ou mais avaliações salvas no banco de dados, **When** o avaliador abre a seção/aba de "Comparar Evolução", **Then** o sistema exibe uma tabela e indicadores comparativos entre a avaliação selecionada como base (anterior) e a avaliação atual, destacando os deltas absolutos e percentuais (`Δ Peso`, `Δ FC repouso`, `Δ vPico`, `Δ VO₂máx`, `Δ VT1`, `Δ VT2`, `Δ tlim`).
2. **Given** duas avaliações comparadas, **When** ambas possuem estágios de velocidade em comum (ex.: 8, 9, 10 km/h), **Then** o sistema compara a FC registrada em cada velocidade (mostrando, por exemplo, redução da FC para a mesma velocidade submáxima) e inclui esse comparativo no relatório/PDF quando desejado.

---

### Edge Cases

- **Interrupção antes de concluir o 1º estágio (< 2 minutos totais de teste)**:
  Se o teste for interrompido antes mesmo de completar o Estágio 1 (`tmr.stages.length === 0`), não existe estágio anterior concluído. O sistema deve alertar o avaliador ("Nenhum estágio completo de 2 min foi concluído") e, caso o avaliador confirme o encerramento mesmo assim, adotar a velocidade inicial (`startV`) sem acréscimo fracionário.
- **Atletas homônimos ou atualização de peso/idade entre testes**:
  Cada atleta possui um identificador único (`athleteId`), permitindo atualizar peso e idade a cada nova avaliação e mantendo o histórico vinculado ao mesmo atleta (com registro do peso/idade vigentes na data de cada teste).
- **Exportação e Importação de Backup**:
  Para evitar perda de dados em caso de troca de aparelho ou limpeza de navegador, o sistema deve permitir exportar e importar a base de atletas em arquivo JSON.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Quando o teste incremental for interrompido/finalizado com o estágio atual em andamento (não concluído os 2 minutos), o sistema DEVE definir a velocidade de pico (`vPico`) como a velocidade do **último estágio completo de 2 minutos** (estágio anterior), sem somar o estágio incompleto nem fração proporcional do tempo corrente.
- **FR-002**: A função pura de cálculo da velocidade de pico (`computeVPeak` em `assets/calc.js`) DEVE ser determinística e coberta por testes automatizados em `tests/calc.test.js`, garantindo que todos os derivados (`VO₂máx`, `METs`, `deriveVTs` e `computeZones`) utilizem exclusivamente o `vPico` do último estágio concluído.
- **FR-003**: O sistema DEVE persistir o cadastro de atletas e o histórico completo de suas avaliações exclusivamente em nuvem utilizando o **Firebase Firestore** do projeto (`teste-incremental-56aeb`), permitindo salvar, listar, consultar, comparar e excluir atletas e avaliações a partir de qualquer dispositivo conectado à internet.
- **FR-004**: Cada registro de avaliação salvo no histórico do atleta DEVE conter: data/hora, snapshot do perfil na data (peso, idade, nível, objetivo), dados da triagem (PA, FC repouso, SpO₂, glicose, status de liberação), resultado completo do teste incremental (`vPico`, `VO₂máx`, `METs`, `VT1`, `VT2`, lista de estágios com velocidade/FC/RPE/Talk Test), resultado do teste de tolerância (`tlim`) e configuração do plano semanal.
- **FR-005**: O sistema DEVE oferecer uma interface de gerenciamento de atletas permitindo: (a) buscar/filtrar atletas pelo nome, (b) carregar um atleta existente para iniciar uma nova avaliação, (c) reabrir qualquer avaliação histórica de um atleta para consulta ou impressão de PDF, e (d) excluir avaliações individuais ou o cadastro de um atleta.
- **FR-006**: O sistema DEVE oferecer uma visualização de comparação entre duas avaliações de um mesmo atleta, exibindo as diferenças (`Δ`) em `vPico`, `VO₂máx`, `METs`, `VT1`, `VT2`, `FC de repouso`, `peso`, `tlim` e frequência cardíaca por velocidade submáxima equivalente.
- **FR-007**: O sistema DEVE permitir exportar e importar a base completa de atletas e avaliações em formato JSON para backup e portabilidade.

### Key Entities *(include if feature involves data)*

- **Atleta (`AthleteRecord`)**: Identificador único (`id`), nome completo, sexo, data de criação, dados de perfil mais recentes (idade, peso, estatura, nível, objetivo, FC máx conhecida) e lista/relação de avaliações realizadas (`assessments`).
- **Avaliação Histórica (`AssessmentRecord`)**: Identificador único (`id`), `athleteId`, data ISO e data formatada (`pt-BR`), snapshot do perfil no dia do teste, dados de triagem (`screen`), dados do teste incremental (`test`), dados do teste de tolerância (`tte`) e prescrição (`plan`).
- **Comparativo de Evolução (`AssessmentComparison`)**: Par de avaliações (`baseline`, `current`) do mesmo atleta com deltas calculados para indicadores cardiorrespiratórios e tabela pareada de FC por velocidade (`km/h`).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos testes incrementais interrompidos no meio de um estágio (ex.: estágio `N` incompleto após concluir o estágio `N-1`) registram como `vPico` exatamente a velocidade do estágio `N-1` concluído, com zero desvio fracionário.
- **SC-002**: O avaliador consegue localizar um atleta cadastrado, abrir seu histórico ou iniciar uma nova avaliação mantendo os dados de perfil em menos de 10 segundos (máximo de 2 cliques).
- **SC-003**: Na tela de comparação de um atleta com 2 ou mais testes, 100% dos indicadores-chave (`vPico`, `VO₂máx`, `VT1`, `VT2`, `tlim` e FC por velocidade) exibem a variação numérica exata (`Δ`) entre as datas selecionadas.
- **SC-004**: 100% das novas funções puras (cálculo de `vPico` por estágio completo e cálculo de comparativo de evolução entre dois testes) possuem testes automatizados aprovados em `tests/calc.test.js`.

## Assumptions

- Um estágio do teste incremental só é considerado concluído quando atinge a duração completa do protocolo (2 minutos / `120 s`).
- Quando o avaliador clica em "Encerrar / Parar teste" durante um estágio em andamento, o estágio atual é considerado interrompido (não concluído), prevalecendo a velocidade do estágio imediatamente anterior já fechado.
- Caso o atleta interrompa ainda no 1º estágio (antes dos primeiros 2 minutos), o sistema utiliza a velocidade inicial (`startV`) como referência mínima para não gerar velocidade nula ou negativa.

