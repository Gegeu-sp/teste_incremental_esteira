# Feature Specification: Progresso do Teste Persistente + Velocidade em Cada Etapa do Plano

**Feature Branch**: `claude/speckit-analysis-implementation-fdvell`

**Created**: 2026-08-11

**Status**: Draft

**Input**: User description: "Campo de FC do último estágio não editável (perda de progresso do
teste ao recarregar a página); métodos de treino da Prescrição não mostram
a velocidade de cada trecho (aquecimento, blocos, volta à calma), só a
zona principal."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Progresso do teste sobrevive a reload (Priority: P1)

Durante um teste incremental, se a página recarrega (tela trava, troca de
app, refresh acidental), o profissional não perde os estágios já
registrados — ao reabrir a aba Teste, vê um aviso de que o teste foi
restaurado (em pausa) e pode retomar de onde parou.

**Why this priority**: Sem isso, um teste de 8–12 min pode ser perdido
inteiro por um acidente comum em celular — é o problema relatado.

**Independent Test**: Completar 2 estágios com FC preenchida, recarregar a
página, conferir que os 2 estágios continuam na tabela e o teste está em
pausa pronto para retomar.

**Acceptance Scenarios**:

1. **Given** um teste com 2 estágios completados, **When** a página é
   recarregada, **Then** os 2 estágios (com FC/RPE/Talk Test preenchidos)
   continuam visíveis e o teste está pausado.
2. **Given** o teste restaurado e pausado, **When** o profissional aperta
   "Retomar", **Then** o cronômetro volta a contar normalmente.
3. **Given** um teste já finalizado (ou nenhum teste iniciado), **When** a
   página carrega, **Then** nenhum aviso de restauração aparece.

---

### User Story 2 - Registro de FC desde o início do estágio (Priority: P1)

Ao iniciar o teste, o campo de FC em destaque e a linha do estágio atual
já ficam disponíveis para edição — sem esperar o estágio de 2 min
terminar. Se o teste é encerrado no meio de um estágio (exaustão), esse
último estágio também pode ter FC/RPE/Talk Test registrados.

**Why this priority**: É o comportamento que o usuário pediu diretamente
("deixar editar"), e captura dados do esforço final que hoje se perdem.

**Independent Test**: Iniciar o teste e, antes de completar o primeiro
estágio de 2 min, digitar a FC no campo em destaque — deve funcionar.
Encerrar o teste no meio de um estágio e conferir que ele aparece no
resultado.

**Acceptance Scenarios**:

1. **Given** o teste recém-iniciado (estágio 1 em andamento), **When** o
   profissional digita no campo de FC em destaque, **Then** o valor é
   aceito e aparece na tabela de estágios.
2. **Given** o teste encerrado no meio de um estágio, **When** o
   resultado é exibido, **Then** esse estágio aparece na lista com a
   velocidade correspondente.

---

### User Story 3 - Velocidade em cada trecho dos métodos de treino (Priority: P2)

Ao ver o plano semanal gerado, cada passo de cada sessão (aquecimento,
bloco principal, blocos intercalados, volta à calma) mostra a velocidade
em km/h correspondente à zona mencionada — não só a velocidade da zona
principal no topo do card.

**Why this priority**: Sem isso, o aluno/profissional não sabe a que
velocidade ficar durante o aquecimento ou a volta à calma, mesmo sabendo
a zona principal do treino.

**Independent Test**: Gerar planos para fase Base (Fartlek) e conferir
que aquecimento, blocos alternados e volta à calma mostram velocidade;
repetir para os demais métodos.

**Acceptance Scenarios**:

1. **Given** um plano com o método Fartlek, **When** o card é exibido,
   **Then** aquecimento, blocos Z4/Z1 e volta à calma mostram km/h cada.
2. **Given** qualquer outro método com aquecimento/volta à calma em zona
   diferente da principal, **When** o card é exibido, **Then** essas
   etapas também mostram velocidade.

### Edge Cases

- `localStorage` indisponível/cheio → app continua funcionando na sessão
  atual, só sem sobreviver a reload (mesmo comportamento já aceito para o
  resto do app).
- Teste restaurado de um teste muito antigo (ex.: sessão anterior
  esquecida) → mesmo assim restaura em pausa; profissional decide se
  retoma ou reinicia ("Refazer teste"/zerar).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O progresso do teste incremental em andamento MUST ser
  persistido a cada checkpoint (estágio completado, pausa/retomada,
  edição de FC/RPE/Talk Test).
- **FR-002**: Ao carregar a página com um teste em andamento persistido,
  o sistema MUST restaurá-lo em estado pausado, com aviso visível.
- **FR-003**: A entrada de um estágio na tabela/campo de FC em destaque
  MUST existir desde o início do estágio, não apenas após sua conclusão.
- **FR-004**: Encerrar o teste no meio de um estágio MUST preservar esse
  estágio nos dados salvos do teste.
- **FR-005**: Cada passo de cada método de treino gerado em `planSessions()`
  que referenciar uma zona MUST exibir a velocidade (km/h) dessa zona.
- **FR-006**: Nenhuma fórmula ou valor numérico já calculado (VO₂, METs,
  VT1, RCP, zonas, diagnóstico, tlim) MUST mudar de resultado para os
  mesmos dados de entrada.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um reload acidental durante o teste não causa perda de
  nenhum estágio já registrado.
- **SC-002**: Um profissional consegue registrar a FC do primeiro estágio
  assim que ele começa, sem esperar 2 minutos.
- **SC-003**: Todo passo de todo método no plano semanal que menciona uma
  zona mostra a velocidade correspondente.
- **SC-004**: Nenhuma regressão nos 16 testes automatizados existentes.

## Assumptions

- Restaurar "em pausa" (sem tentar calcular quanto tempo real passou
  enquanto a página estava fechada) é aceitável — decisão tomada para
  evitar lógica de reconciliação de tempo arriscada; o profissional
  confirma manualmente e aperta "Retomar".
- `ritmoLivre` (fase Transição) mantém o caráter "por sensação" — ganha
  só uma faixa de referência solta, não uma velocidade travada.
