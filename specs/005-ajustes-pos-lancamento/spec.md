# Feature Specification: Ajustes pós-lançamento — Capacidade, Mobile e Registro de FC

**Feature Branch**: `claude/speckit-analysis-implementation-fdvell`

**Created**: 2026-08-11

**Status**: Draft

**Input**: User description: "Precisa acontecer principalmente na montagem de treino — uma pessoa
que não aguentou nenhum estágio direito não pode receber um plano com
sessões longas; isso precisa ter uma memória para isso. Além disso, algumas
nomenclaturas estão passando na tela do celular (mobile) — queria mais
centralizado. E no teste incremental, na hora de avaliar, falta um campo
mais visível para colocar o BPM por estágio."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Prescrição ajustada à capacidade demonstrada (Priority: P1)

Um aluno faz o teste incremental e exaure muito cedo (poucos minutos, sem
completar direito nem o primeiro estágio). Ao gerar o plano semanal, as
sessões contínuas (Rodagem, Longão, Fartlek etc.) vêm com duração reduzida
proporcional ao que ele demonstrou aguentar, em vez do padrão fixo da fase
— com um aviso explicando o ajuste.

**Why this priority**: É uma questão de adequação/segurança da prescrição —
um plano descolado da capacidade real do aluno pode gerar frustração ou
lesão.

**Independent Test**: Simular um teste com duração total curta (< 6 min) e
conferir que nenhuma sessão do plano gerado excede o teto de 15 min, com o
aviso visível; simular um teste longo (> 15 min) e conferir que o plano sai
igual ao comportamento já existente.

**Acceptance Scenarios**:

1. **Given** um teste com duração total < 6 min, **When** o plano é gerado,
   **Then** nenhuma sessão contínua excede 15 min, e um aviso indica o
   ajuste.
2. **Given** um teste com duração total entre 10 e 15 min (dentro do
   "ideal" já comunicado na aba do teste), **When** o plano é gerado,
   **Then** as durações seguem os padrões já existentes por fase (sem
   corte adicional).
3. **Given** nenhum teste concluído, **When** o profissional está na aba
   Plano, **Then** o comportamento (mensagem de dados pendentes) continua
   igual ao atual.

---

### User Story 2 - Layout mobile sem estouro de texto (Priority: P2)

No celular, o card de resultado "VT1" com valor "não identificado" não
estoura mais a borda do card — o texto fica centralizado e contido dentro
do card, em uma coluna por vez em telas estreitas.

**Why this priority**: É um bug visual que compromete a leitura em campo
(o app é usado no celular ao lado da esteira).

**Independent Test**: Abrir os resultados do teste em uma viewport de
celular (ex.: 390px de largura) com VT1/RCP não identificados e conferir
visualmente (screenshot) que o texto não ultrapassa a borda do card.

**Acceptance Scenarios**:

1. **Given** um resultado com VT1 "não identificado" em tela de celular,
   **When** a aba Teste exibe o resultado, **Then** o texto do valor fica
   centralizado e não ultrapassa a borda do card.

---

### User Story 3 - Registro de FC em destaque durante o teste (Priority: P1)

Durante o teste incremental, ao lado do cronômetro/anel, existe um campo
grande e visível para digitar a FC assim que um estágio termina — sem
precisar procurar a tabela pequena de estágios.

**Why this priority**: Sem FC registrada, o app não consegue calcular a
resposta hemodinâmica nem ajudar a validar o esforço — e hoje o campo
existente passa despercebido no celular (relatado pelo usuário).

**Independent Test**: Completar um estágio, digitar a FC no novo campo em
destaque, e conferir que o valor aparece também na tabela de estágios (e
que editar a tabela atualiza o campo em destaque).

**Acceptance Scenarios**:

1. **Given** pelo menos um estágio concluído, **When** o profissional
   digita um valor no campo de FC em destaque, **Then** esse valor passa a
   valer para o último estágio, refletido também na tabela e no gráfico.

### Edge Cases

- Nenhum estágio concluído ainda → o campo de FC em destaque aparece
  desabilitado/vazio, sem erro.
- Teto de capacidade menor que a duração mínima de uma sessão de qualidade
  (ex.: HIIT) → aplica um piso mínimo (15 min) em vez de gerar uma sessão
  absurdamente curta ou de duração zero/negativa.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A geração do plano MUST usar `state.test.totalSec` para
  limitar a duração das sessões contínuas quando ele indicar baixa
  capacidade demonstrada (< 10 min de teste total).
- **FR-002**: O sistema MUST exibir um aviso visível quando a duração das
  sessões for reduzida por causa da capacidade demonstrada.
- **FR-003**: O card de resultado do VT1/RCP (e demais métricas do mesmo
  grid) MUST permanecer legível e contido dentro do card em telas de
  celular (≥ 360px de largura), sem overflow de texto.
- **FR-004**: A aba do Teste Incremental MUST oferecer um campo de FC
  visível perto do cronômetro, sincronizado com o registro de FC por
  estágio já existente.
- **FR-005**: Nenhuma fórmula ou valor numérico já calculado (VO₂, METs,
  VT1, RCP, zonas, diagnóstico, tlim) MUST mudar de resultado para os
  mesmos dados de entrada — esta feature ajusta composição de sessões e
  UI, não fórmulas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um plano gerado para um teste muito curto (< 6 min) nunca
  prescreve uma sessão contínua acima de 15 min.
- **SC-002**: Nenhum texto de resultado transborda a borda do seu card em
  viewport de 360–412px de largura (faixa comum de celulares).
- **SC-003**: O profissional consegue registrar a FC de um estágio em no
  máximo 1 toque a partir da tela do cronômetro, sem rolar até a tabela.
- **SC-004**: Nenhuma regressão nos 16 testes automatizados existentes.

## Assumptions

- Os degraus de capacidade (< 6 min / 6–10 min / 10–15 min / > 15 min) são
  calibrados pela própria orientação já exibida no app ("ideal: 8–12 min"
  até a exaustão) — ficam como constantes nomeadas, ajustáveis depois se o
  profissional preferir outros limites.
- "Ter uma memória" é satisfeito usando o resultado do teste já registrado
  (`state.test.totalSec`) como entrada da geração do plano — não introduz
  histórico multi-teste (isso seguiria fora de escopo, próximo do
  banco de dados já adiado para uma fase futura).
