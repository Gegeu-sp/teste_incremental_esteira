# Feature Specification: Fase 2A — Diagnóstico/Interpretação (Zonas) e Biblioteca de Métodos de Treino (Prescrição)

**Feature Branch**: `claude/speckit-analysis-implementation-fdvell`

**Created**: 2026-08-11

**Status**: Draft

**Input**: User description: "Zonas de Treino Personalizadas: Diagnóstico do VO2 max, Análise e
Interpretação dos Limiares, Comportamento da pressão Arterial e Frequência
cardíaca no treinamento, Testes para Avaliar o VO2max, Importância da
Avaliação Diagnóstica Clínica e Funcional. Prescrição do Treino: Zonas de
Treinamento Aeróbio, Adaptações Fisiológicas Associadas ao Aumento do
VO2máx, Método Contínuo Zonas 1 e 2, Método Fartlek Zonas 1 e 2, HIIT,
Prescrição do HIIT no Ponto de Compensação Respiratória (Zona 3), Método de
Treinamento Intervalado na Zona 4, HIIT Longo, HIIT Curto, Modelos de RST e
SIT."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Diagnóstico e interpretação na aba Zonas (Priority: P2)

Ao abrir a aba Zonas depois de um teste incremental concluído, o profissional
vê, além da tabela de zonas já existente, um resumo do diagnóstico de aptidão
cardiorrespiratória (mesma classificação da aba Teste), uma explicação mais
completa do que VT1 e RCP significam fisiologicamente, um resumo de como PA e
FC costumam se comportar durante diferentes tipos de treino, uma lista de
referência de outros testes de VO₂máx existentes na literatura, e um lembrete
da importância do julgamento clínico na interpretação dos números.

**Why this priority**: É conteúdo educacional/de apoio à decisão — enriquece
a aba já funcional, não bloqueia nenhum fluxo.

**Independent Test**: Completar um teste incremental e abrir a aba Zonas;
verificar que os 5 novos cards aparecem com o conteúdo esperado.

**Acceptance Scenarios**:

1. **Given** um teste incremental concluído, **When** o profissional abre a
   aba Zonas, **Then** vê um card de diagnóstico do VO₂máx igual ao exibido
   na aba Teste.
2. **Given** a aba Zonas aberta, **When** o profissional lê os cards de
   VT1/RCP, **Then** encontra uma explicação do mecanismo fisiológico, não só
   a definição operacional já existente.
3. **Given** a aba Zonas aberta, **When** o profissional rola até o final,
   **Then** encontra um card de referência com outros protocolos de VO₂máx
   (Balke esteira/bicicleta, Cooper, caminhada de 6 min).

---

### User Story 2 - Biblioteca de métodos de treino na Prescrição (Priority: P2)

Ao gerar o plano semanal, o profissional vê sessões nomeadas pelos métodos de
treino reconhecidos na literatura (Contínuo, Fartlek, Intervalado Zona 4, HIIT
Longo no RCP, HIIT Curto, RST, SIT), cada uma com os parâmetros
correspondentes (intensidade, duração, relação esforço:recuperação),
variando conforme fase de periodização, objetivo e nível de treino do aluno.

**Why this priority**: Enriquece a prescrição já existente com mais
variedade e rigor científico; o plano já funciona sem isso.

**Independent Test**: Gerar planos para diferentes combinações de
fase/objetivo/nível e conferir que os métodos corretos aparecem — incluindo
que RST/SIT só aparecem para objetivo Performance + fase Específico + nível
diferente de Iniciante.

**Acceptance Scenarios**:

1. **Given** fase Base, **When** o plano é gerado, **Then** a sessão de
   qualidade é do método Fartlek (Z1–Z2).
2. **Given** fase Construção, **When** o plano é gerado, **Then** a sessão de
   qualidade é do método Intervalado Zona 4.
3. **Given** fase Específico, **When** o plano é gerado, **Then** a sessão de
   qualidade alterna entre HIIT Longo (no RCP) e HIIT Curto.
4. **Given** objetivo Performance, fase Específico e nível Avançado ou
   Intermediário, **When** a frequência semanal permite uma sessão extra de
   qualidade, **Then** o plano pode incluir uma sessão de RST ou SIT.
5. **Given** objetivo Condicionamento geral ou nível Iniciante, **When** o
   plano é gerado, **Then** RST e SIT nunca aparecem.

### Edge Cases

- Aluno sem teste de tolerância registrado ao gerar sessões de HIIT/RST/SIT
  que dependem de calibração por tlim → usa o mesmo fallback (360s de
  referência) já usado pela sessão de VO₂máx existente, sem quebrar.
- Nível de treino não preenchido no Perfil → tratado como não-avançado
  (comportamento conservador: RST/SIT não aparecem).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A aba Zonas MUST exibir o diagnóstico do VO₂máx (reexibição do
  cálculo já existente).
- **FR-002**: A aba Zonas MUST exibir uma explicação do mecanismo fisiológico
  de VT1 e RCP, um resumo de comportamento de PA/FC durante o treino, uma
  lista de referência de outros testes de VO₂máx, e um lembrete sobre
  julgamento clínico.
- **FR-003**: A geração do plano semanal MUST nomear as sessões de qualidade
  pelos métodos reconhecidos (Contínuo, Fartlek, Intervalado Z4, HIIT Longo
  no RCP, HIIT Curto, RST, SIT) com os parâmetros de intensidade/duração
  correspondentes.
- **FR-004**: RST e SIT MUST só aparecer quando objetivo = Performance, fase
  = Específico e nível de treino ≠ Iniciante.
- **FR-005**: Nenhuma fórmula ou valor numérico já calculado (VO₂, METs, VT1,
  RCP, zonas, diagnóstico, tlim) MUST mudar de resultado para os mesmos
  dados de entrada — esta fase é aditiva/reorganização de conteúdo.

### Key Entities

- Sem novas entidades de dados — usa `state.test`, `state.tte`,
  `state.profile.level`, `state.plan` já existentes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um profissional consegue, na aba Zonas, entender o
  significado clínico dos limiares sem sair do app ou consultar material
  externo.
- **SC-002**: Um plano gerado para um atleta avançado com objetivo
  Performance na fase Específico inclui pelo menos um método de alta
  intensidade nomeado (HIIT Longo, HIIT Curto, RST ou SIT) com parâmetros
  corretos.
- **SC-003**: Nenhuma regressão nos resultados numéricos já cobertos pelos
  16 testes automatizados existentes.

## Assumptions

- O conteúdo educacional (interpretação de limiares, comportamento de PA/FC,
  outros testes de referência) é baseado na apostila `Curso de
  Aprofundamento em Emagrecimento - Professor Raphael Carvalho.pdf`, já
  presente no repositório, que é também a fonte original do protocolo já
  implementado.
- O app continua implementando só o protocolo de teste incremental em
  esteira; os demais testes de VO₂máx citados aparecem apenas como
  referência informativa, não como fluxos interativos novos.
- Relatório em PDF (Fase 2B) e sistema de login/banco de dados seguem fora
  de escopo desta feature.
