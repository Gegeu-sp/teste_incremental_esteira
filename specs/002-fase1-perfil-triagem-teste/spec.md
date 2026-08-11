# Feature Specification: Fase 1 — Perfil, Triagem, Teste Incremental e Tolerância

**Feature Branch**: `claude/speckit-analysis-implementation-fdvell`

**Created**: 2026-08-11

**Status**: Draft

**Input**: User description: "Melhorias no Perfil (altura, remover FC máxima), Triagem
(SpO2, glicose, critérios de contraindicação), Teste Incremental (resposta
hemodinâmica repouso→pico, tabela de METs além de 11 km/h) e Teste de Tolerância
(vitais antes/depois)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Perfil sem campo redundante, com altura (Priority: P2)

O profissional preenche o perfil do aluno com nome, idade, sexo, altura, nível de
treino e objetivo. O campo de FC máxima medida (que confundia o fluxo) não existe
mais nesta tela — a FC máxima estimada continua sendo calculada automaticamente
pela idade nos bastidores.

**Why this priority**: Ajuste de UI/dados, não bloqueia nenhuma outra etapa.

**Independent Test**: Abrir o Perfil, confirmar que não há campo de FC máxima e
que existe um campo de Altura; preencher e recarregar a página confirmando que o
valor persiste.

**Acceptance Scenarios**:

1. **Given** o Perfil aberto, **When** o profissional olha os campos, **Then** não
   há campo "FC máxima medida" e existe um campo "Altura".
2. **Given** um valor de altura preenchido, **When** a página é recarregada,
   **Then** o valor continua preenchido (persistência em `localStorage`).

---

### User Story 2 - Triagem com SpO₂ e glicose influenciando o parecer (Priority: P1)

O profissional registra, além de PA/FC de repouso, a saturação de oxigênio (SpO₂)
e, opcionalmente, a glicose do aluno. O parecer de liberação para o teste passa a
considerar esses valores com critérios conservadores.

**Why this priority**: É segurança clínica — mesmo nível de prioridade da
triagem já existente (Princípio III da constitution).

**Independent Test**: Preencher SpO₂ = 88% → parecer "TESTE CONTRAINDICADO";
SpO₂ = 92% → "LIBERADO COM RESSALVAS"; glicose = 60 mg/dL → "LIBERADO COM
RESSALVAS"; todos os valores normais → "LIBERADO PARA O TESTE".

**Acceptance Scenarios**:

1. **Given** SpO₂ < 90%, **When** o parecer é calculado, **Then** o resultado é
   "TESTE CONTRAINDICADO", independente dos demais valores.
2. **Given** SpO₂ entre 90% e 94% e nenhum outro fator de risco, **When** o
   parecer é calculado, **Then** o resultado é "LIBERADO COM RESSALVAS".
3. **Given** glicose < 70 mg/dL ou > 300 mg/dL, **When** o parecer é calculado,
   **Then** o resultado é no mínimo "LIBERADO COM RESSALVAS", com nota
   explicando a conduta recomendada.
4. **Given** SpO₂ ≥ 95%, glicose entre 70–300 mg/dL e nenhum outro fator de
   risco, **When** o parecer é calculado, **Then** o resultado é "LIBERADO PARA
   O TESTE".

---

### User Story 3 - Resposta hemodinâmica no Teste Incremental (Priority: P2)

Ao concluir o teste incremental, o profissional vê uma comparação entre a FC de
repouso (registrada na Triagem) e a FC de pico atingida no teste, além de uma
tabela de referência de METs/VO₂ que cobre velocidades acima de 11 km/h (caso o
aluno ultrapasse esse patamar).

**Why this priority**: Enriquece a interpretação do resultado; não bloqueia o
fluxo principal (o teste já funciona sem isso).

**Independent Test**: Com FC de repouso = 70 registrada na Triagem, rodar um
teste até o estágio de 12 km/h com FC = 170 no último estágio; conferir que o
resultado mostra "FC repouso 70 → FC pico 170 (Δ +100)" e que a tabela de
referência tem uma linha para 12 km/h.

**Acceptance Scenarios**:

1. **Given** uma Triagem preenchida e um teste concluído, **When** os resultados
   são exibidos, **Then** aparece um card comparando FC de repouso e FC de pico
   com o delta.
2. **Given** um teste que atinge velocidade > 11 km/h, **When** a tabela de
   referência de METs é exibida, **Then** ela inclui uma linha para essa
   velocidade.

---

### User Story 4 - Vitais antes/depois do Teste de Tolerância (Priority: P2)

Antes de iniciar o teste de tolerância, o profissional confirma (ou atualiza) PA,
FC e SpO₂ do aluno; ao encerrar o teste, registra os mesmos três valores
novamente. O resultado exibe as duas leituras lado a lado.

**Why this priority**: Enriquece a avaliação de segurança/resposta ao esforço
sustentado; o teste já funciona (mede tempo) sem esses campos.

**Independent Test**: Preencher PA/FC/SpO₂ antes, rodar e parar o cronômetro,
preencher PA/FC/SpO₂ depois; conferir que ambos os conjuntos aparecem no
resultado.

**Acceptance Scenarios**:

1. **Given** o teste de tolerância iniciado, **When** o profissional abre a aba,
   **Then** os campos de PA/FC/SpO₂ "antes" já vêm pré-preenchidos com os
   valores da Triagem (editáveis).
2. **Given** o teste encerrado, **When** o profissional registra os vitais
   "depois", **Then** o card de resultado mostra os dois conjuntos de valores.

### Edge Cases

- SpO₂ ou glicose não preenchidos (opcionais) → parecer segue calculado
  normalmente pelos demais critérios, sem travar nem exigir preenchimento.
- Triagem não preenchida ao abrir o Teste Incremental → o card de referência de
  repouso exibe aviso "não registrado" em vez de quebrar.
- Teste de tolerância iniciado sem Triagem prévia → campos "antes" ficam vazios
  em vez de pré-preenchidos, sem erro.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O Perfil MUST ter um campo de Altura e MUST NOT ter mais o campo
  de FC máxima medida.
- **FR-002**: A FC máxima usada nos cálculos de zona MUST continuar sendo
  `208 − 0,7×idade` sempre que não houver valor manual válido (comportamento já
  existente, preservado).
- **FR-003**: A Triagem MUST coletar SpO₂ (%) e, opcionalmente, glicose (mg/dL).
- **FR-004**: O parecer de liberação MUST classificar SpO₂ < 90% como
  contraindicação e SpO₂ entre 90–94% como ressalva.
- **FR-005**: O parecer de liberação MUST classificar glicose < 70 mg/dL ou >
  300 mg/dL como ressalva, com orientação de conduta associada.
- **FR-006**: O Teste Incremental MUST exibir a FC de repouso (da Triagem) e a
  FC de pico do teste concluído, com o delta entre elas.
- **FR-007**: A tabela de referência de METs/VO₂ do Teste Incremental MUST
  cobrir velocidades acima de 11 km/h.
- **FR-008**: O Teste de Tolerância MUST coletar PA, FC e SpO₂ antes e depois
  do teste e exibi-los no resultado.
- **FR-009**: Todas as novas classificações clínicas (SpO₂, glicose) MUST ser
  funções puras testáveis, com cobertura de teste automatizado (Princípio IV).

### Key Entities

- **Perfil do Aluno**: adiciona `height`; remove `hrMax`.
- **Triagem**: adiciona `spo2`, `glicose`.
- **Teste Incremental**: sem nova entidade — resultado passa a exibir dados
  derivados (FC repouso vs. pico).
- **Teste de Tolerância**: adiciona `preVitals` e `postVitals` (cada um com
  `pas`, `pad`, `fc`, `spo2`).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um profissional consegue completar Perfil → Triagem → Teste
  Incremental → Teste de Tolerância preenchendo todos os novos campos, sem erro
  de console e sem precisar recarregar a página.
- **SC-002**: As classificações de SpO₂/glicose produzem o mesmo resultado em
  execuções repetidas para as mesmas entradas (determinístico), validado por
  teste automatizado.
- **SC-003**: Nenhum resultado numérico/clínico pré-existente (VO₂, METs, VT1,
  RCP, zonas, diagnóstico) muda de valor para os mesmos dados de entrada —
  esta fase é aditiva, não uma correção de fórmula.

## Assumptions

- Limites de SpO₂ (90%/95%) e glicose (70/300 mg/dL) seguem diretrizes usuais
  de prescrição de exercício (ACSM) e são valores conservadores razoáveis na
  ausência de protocolo específico do usuário; ficam como constantes nomeadas,
  fáceis de ajustar depois se o profissional preferir outros limites.
- Fase 2 (conteúdo de fisiologia/métodos de treino, relatório PDF) e a
  eventual introdução de login/banco de dados multiusuário estão fora do
  escopo desta feature.
