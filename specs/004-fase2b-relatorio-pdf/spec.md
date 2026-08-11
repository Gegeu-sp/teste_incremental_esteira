# Feature Specification: Fase 2B — Relatório Completo em PDF

**Feature Branch**: `claude/speckit-analysis-implementation-fdvell`

**Created**: 2026-08-11

**Status**: Draft

**Input**: User description: "Diagnóstico e Relatório pdf. Onde eu vou poder é tirar OPDF... de
acordo com o que foi diagnosticado na aba anterior."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Gerar relatório completo em PDF (Priority: P1)

O profissional, depois de completar a avaliação de um aluno (perfil,
triagem, teste incremental, opcionalmente tolerância, e plano gerado),
clica em um botão e obtém um relatório único combinando perfil, parecer da
triagem, diagnóstico de aptidão cardiorrespiratória, zonas de treino e
plano semanal — pronto para salvar como PDF pelo próprio diálogo de
impressão do navegador.

**Why this priority**: É o entregável final do processo de avaliação —
o que o profissional leva/envia para o aluno.

**Independent Test**: Completar um teste incremental e gerar um plano;
clicar em "Gerar Relatório Completo"; verificar que o diálogo de impressão
do navegador abre mostrando as seções esperadas, independente de qual aba
estava ativa no momento do clique.

**Acceptance Scenarios**:

1. **Given** um teste incremental e um plano gerados, **When** o
   profissional clica em "Gerar Relatório Completo", **Then** o relatório
   exibido para impressão contém Perfil, Triagem, Diagnóstico, Zonas e
   Plano semanal.
2. **Given** o profissional está na aba Perfil (não na aba Plano), **When**
   ele clica no botão de relatório, **Then** o relatório completo é gerado
   do mesmo jeito (não depende da aba ativa).
3. **Given** nenhum teste incremental foi concluído, **When** o
   profissional clica no botão de relatório, **Then** o relatório exibe uma
   mensagem informando que o teste precisa ser concluído primeiro, sem
   erro.

### Edge Cases

- Teste de tolerância não realizado → seção de Tolerância é omitida do
  relatório, sem quebrar as demais.
- Nome do aluno não preenchido → relatório usa um rótulo genérico ("Aluno")
  em vez de string vazia.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST oferecer um botão para gerar um relatório
  completo, acessível independente da aba atualmente ativa.
- **FR-002**: O relatório MUST reunir Perfil, parecer da Triagem,
  Diagnóstico (VO₂máx/VT1/RCP), Zonas de treino e Plano semanal, quando os
  respectivos dados existirem.
- **FR-003**: O relatório MUST ser exportável como PDF usando o mecanismo
  nativo de impressão do navegador (sem dependência nova).
- **FR-004**: O relatório MUST se comportar de forma graciosa quando dados
  opcionais (tolerância, plano) não existirem, sem gerar erro.
- **FR-005**: Nenhuma fórmula ou valor numérico já calculado MUST mudar de
  resultado — esta feature só compõe/formata dados já existentes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um profissional consegue gerar e salvar um PDF do relatório
  completo em menos de 3 cliques, a partir de qualquer aba do app.
- **SC-002**: O PDF gerado contém todas as informações necessárias para o
  aluno entender seu diagnóstico e plano, sem precisar abrir o app
  novamente.
- **SC-003**: Nenhuma regressão nos 16 testes automatizados existentes.

## Assumptions

- "Tirar o PDF" é satisfeito pelo recurso nativo "Salvar como PDF" do
  diálogo de impressão do navegador (decisão já tomada com o usuário na
  Fase 2A) — não há geração de arquivo binário em código nem dependência
  nova.
- Envio por e-mail continua fora de escopo (decisão já tomada na Fase 1) —
  o usuário baixa/salva o PDF e envia manualmente se quiser.
