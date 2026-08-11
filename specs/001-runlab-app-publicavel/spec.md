# Feature Specification: RunLab — App Publicável de Triagem, Teste Incremental e Prescrição

**Feature Branch**: `001-runlab-app-publicavel`

**Created**: 2026-08-11

**Status**: Draft

**Input**: User description: "Transformar o conteúdo existente do repositório (protocolo de teste incremental em esteira, página RunLab) em um app funcional e publicável."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Triagem e liberação para o teste (Priority: P1)

Um profissional de educação física registra o perfil do aluno, a pressão arterial e
frequência cardíaca de repouso, limitações clínicas e sinais/sintomas relatados, e
recebe um parecer objetivo (liberado / liberado com ressalvas / contraindicado) mais
uma velocidade inicial sugerida para o protocolo.

**Why this priority**: É a etapa de segurança que precede qualquer esforço físico —
sem ela as demais etapas não deveriam ocorrer.

**Independent Test**: Preencher PA/FC de repouso e marcar sinais de alerta (ex.: dor
torácica) e verificar que o parecer exibido é "TESTE CONTRAINDICADO"; preencher
valores normais e verificar "LIBERADO PARA O TESTE".

**Acceptance Scenarios**:

1. **Given** PA de repouso ≥ 200/110 mmHg, **When** o profissional visualiza o
   parecer, **Then** o sistema exibe "TESTE CONTRAINDICADO" e a justificativa.
2. **Given** nenhum sinal de alerta e PA normal, **When** o profissional visualiza o
   parecer, **Then** o sistema exibe "LIBERADO PARA O TESTE" e uma velocidade inicial
   sugerida em km/h.

---

### User Story 2 - Execução do teste incremental em esteira (Priority: P1)

Durante o teste (estágios de 2 minutos, +1 km/h por estágio, inclinação fixa em 1%),
o profissional usa um cronômetro visual por estágio, registra FC, RPE (0–10) e Talk
Test ao final de cada estágio, e monitora sinais/sintomas de alerta em tempo real. Ao
encerrar (exaustão voluntária), o sistema calcula vVO₂max, VO₂máx estimado, METs,
VT1 (limiar aeróbico) e RCP/VT2 (limiar anaeróbico) a partir dos dados coletados, e
apresenta um diagnóstico de aptidão cardiorrespiratória comparado a valores de
referência por idade e sexo.

**Why this priority**: É o núcleo da avaliação — todas as etapas seguintes (zonas,
tolerância, plano) dependem do resultado deste teste.

**Independent Test**: Rodar o cronômetro por 3 estágios completos, marcar Talk Test
"apenas palavras" no 2º estágio e "não consegue falar" no 3º, encerrar o teste e
verificar que VT1 e RCP/VT2 são derivados corretamente e que VO₂máx/METs são
calculados a partir da velocidade pico atingida.

**Acceptance Scenarios**:

1. **Given** um teste em andamento, **When** um estágio de 2 minutos é concluído,
   **Then** a velocidade aumenta em 1 km/h e o sistema emite um sinal sonoro de
   troca de estágio (se habilitado).
2. **Given** sinais de alerta marcados durante o teste, **When** qualquer um deles é
   marcado, **Then** o sistema exibe um alerta visível recomendando interrupção
   imediata do teste.
3. **Given** o teste encerrado, **When** os resultados são exibidos, **Then** o
   sistema mostra vVO₂max, VO₂máx, METs, VT1, RCP/VT2 e uma classificação
   (Excelente/Bom/Regular/Ruim) comparada à média de referência do aluno.

---

### User Story 3 - Zonas de treino e teste de tolerância (Priority: P2)

A partir do resultado do teste incremental, o sistema gera zonas de treino
individuais (FC, velocidade, pace, RPE, "combustível" energético predominante) e
permite executar um teste de tempo-limite (tlim) na vVO₂max para calibrar a duração
das repetições de alta intensidade.

**Why this priority**: Refina a prescrição, mas depende do teste incremental já
estar concluído (P1); o app continua útil sem esta etapa.

**Independent Test**: Com um teste incremental salvo, abrir a aba Zonas e verificar
que 5 zonas são exibidas com faixas de FC/velocidade coerentes com VT1/RCP; rodar o
cronômetro de tolerância e confirmar que o tempo registrado aparece na prescrição
das repetições de VO₂máx.

**Acceptance Scenarios**:

1. **Given** nenhum teste incremental salvo, **When** o aluno abre a aba Zonas,
   **Then** o sistema exibe aviso para concluir o teste primeiro, sem quebrar.
2. **Given** um teste incremental salvo, **When** o aluno abre a aba Zonas, **Then**
   5 zonas (Z1–Z5) são exibidas com FC, velocidade, pace, RPE e objetivo.

---

### User Story 4 - Plano semanal de treino (Priority: P2)

Com base nas zonas calculadas, no tlim (se houver) e nas escolhas de frequência
semanal, objetivo (condicionamento geral / cardio pós-musculação / performance) e
fase de periodização, o sistema gera um microciclo semanal com sessões detalhadas
(zona-alvo, velocidade, pace, FC, estrutura do treino) e uma tabela de macrociclo,
imprimível/exportável para PDF via impressão do navegador.

**Why this priority**: É o produto final entregue ao aluno, mas depende
inteiramente das etapas anteriores.

**Independent Test**: Selecionar 3 sessões/semana, objetivo "Performance" e fase
"Construção"; verificar que 3 cartões de sessão são gerados com zona-alvo e
estrutura coerentes, e que o botão de impressão produz uma versão sem os elementos
de navegação/interação.

**Acceptance Scenarios**:

1. **Given** objetivo "Cardio pós-musculação", **When** o plano é gerado, **Then**
   todas as sessões ficam em Z1–Z2 e um bloco de regras de treino concorrente é
   exibido.
2. **Given** um plano gerado, **When** o profissional clica em "Imprimir", **Then**
   os elementos de controle (`no-print`) são ocultados na saída impressa/PDF.

---

### User Story 5 - Publicação e acesso ao app (Priority: P1)

Qualquer pessoa com o link (ou arquivo) consegue abrir o RunLab diretamente em um
navegador — via hospedagem estática (ex.: GitHub Pages) ou abrindo o arquivo
localmente — sem instalar dependências nem rodar um processo de build.

**Why this priority**: Sem um ponto de entrada padrão e publicável, o app existente
não é utilizável fora do repositório-fonte, apesar de todo o comportamento (P1–P2
acima) já estar implementado.

**Independent Test**: Abrir `index.html` diretamente em um navegador (file://) e
confirmar que todas as 6 abas funcionam sem erros de console; servir o diretório com
um servidor estático simples e confirmar o mesmo resultado.

**Acceptance Scenarios**:

1. **Given** o repositório publicado como site estático, **When** um visitante
   acessa a URL raiz, **Then** o RunLab carrega automaticamente (via `index.html`).
2. **Given** o arquivo aberto localmente sem servidor, **When** o usuário interage
   com qualquer aba, **Then** não há erros de JavaScript no console.

### Edge Cases

- O que acontece se o aluno não preencher PA/FC de repouso? → O parecer deve
  continuar funcionando com base apenas nos sinais/sintomas e limitações marcadas,
  sem travar.
- Como o sistema lida com Talk Test nunca marcado durante o teste incremental? → VT1
  e RCP/VT2 devem cair para estimativa (78%/90% da vVO₂max) em vez de erro.
- O que acontece se `localStorage` estiver indisponível ou cheio (ex.: modo privado
  restritivo)? → A aplicação deve continuar funcional durante a sessão atual, apenas
  sem persistir entre recarregamentos.
- Como o sistema se comporta se o aluno usa betabloqueadores (FC atenuada)? → As
  zonas devem exibir um aviso para priorizar velocidade/RPE em vez de FC.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST calcular VO₂ e METs a partir da velocidade em esteira
  (1% de inclinação) usando a tabela de referência do protocolo (4–11 km/h).
- **FR-002**: O sistema MUST executar um cronômetro de estágios de 2 minutos com
  incremento de 1 km/h por estágio, com sinalização sonora opcional na troca de
  estágio.
- **FR-003**: O sistema MUST permitir registrar FC, RPE (0–10) e Talk Test
  (frases/palavras/não fala) por estágio concluído.
- **FR-004**: O sistema MUST derivar VT1 a partir do último estágio com Talk Test
  "frases completas" e RCP/VT2 a partir do primeiro estágio com Talk Test "não
  consegue falar" (ou, na ausência deste, do estágio "apenas palavras" + 1 km/h).
- **FR-005**: O sistema MUST calcular um parecer de liberação para o teste
  (liberado / liberado com ressalvas / contraindicado) a partir de PA de repouso e
  sinais/sintomas relatados, priorizando segurança clínica (Principle III).
- **FR-006**: O sistema MUST exibir um alerta visual imediato quando qualquer sinal
  de alerta (dor torácica, tontura, ataxia, etc.) for marcado durante o teste em
  andamento.
- **FR-007**: O sistema MUST gerar 5 zonas de treino individuais (FC, velocidade,
  pace, RPE, objetivo, combustível) a partir de VT1, RCP/VT2 e vVO₂max.
- **FR-008**: O sistema MUST executar um cronômetro de tempo-limite (tlim) na
  vVO₂max e usar o resultado para calibrar a duração das repetições de VO₂máx no
  plano de treino (55% do tlim).
- **FR-009**: O sistema MUST gerar um plano semanal (2–6 sessões) variando por
  objetivo (condicionamento geral / cardio pós-musculação / performance) e fase de
  periodização (base / construção / específico / transição).
- **FR-010**: O sistema MUST persistir perfil, triagem, resultado do teste
  incremental, tlim e preferências de plano em `localStorage`, sem enviar dados a
  qualquer servidor (Principle I), com opção explícita de apagar todos os dados.
- **FR-011**: O sistema MUST oferecer uma versão imprimível do plano (ocultando
  controles de UI) via impressão do navegador.
- **FR-012**: O ponto de entrada da aplicação MUST estar em `index.html` na raiz do
  repositório, permitindo publicação direta em hospedagem estática (ex.: GitHub
  Pages) sem etapa de build.
- **FR-013**: O sistema MUST exibir, de forma permanente, aviso de que é uma
  ferramenta educacional e não substitui avaliação médica.

### Key Entities

- **Perfil do Aluno**: nome, idade, sexo, FC máxima medida (opcional), nível de
  treino, objetivo principal.
- **Triagem**: PA sistólica/diastólica de repouso, FC de repouso, limitações
  clínicas marcadas, sinais/sintomas relatados.
- **Teste Incremental**: velocidade inicial, lista de estágios (velocidade, FC, RPE,
  Talk Test), vPeak/vVO₂max, VO₂máx estimado, METs, VT1, RCP/VT2, data.
- **Teste de Tolerância**: tempo-limite (segundos) na vVO₂max, data.
- **Zonas de Treino**: 5 faixas (Z1–Z5) de FC, velocidade e pace derivadas do teste.
- **Preferências de Plano**: frequência semanal, objetivo, fase de periodização.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um visitante consegue abrir o app publicado e completar as 6 etapas
  (perfil → triagem → teste → tolerância → zonas → plano) sem recarregar a página
  ou encontrar erro de console.
- **SC-002**: Todos os dados inseridos permanecem disponíveis após fechar e reabrir
  o navegador na mesma máquina, sem qualquer chamada de rede para persistência.
- **SC-003**: As fórmulas de VO₂, METs, zonas e diagnóstico produzem os mesmos
  valores em execuções repetidas para as mesmas entradas (determinístico), validado
  por testes automatizados.
- **SC-004**: O app é acessível publicamente por uma única URL, sem instruções de
  instalação além de "abrir o link".

## Assumptions

- O público-alvo é profissional de educação física/fisiologista aplicando o teste
  presencialmente ao lado da esteira, em português brasileiro.
- Não há requisito de multiusuário, contas ou sincronização entre dispositivos —
  cada navegador guarda seus próprios dados localmente.
- Hospedagem alvo é estática (GitHub Pages ou equivalente); não há requisito de
  HTTPS customizado, domínio próprio ou CI/CD além do necessário para publicar
  arquivos estáticos.
- A tabela de METs/VO₂ e os critérios de triagem já presentes no protocolo original
  (`protocolo`) são a fonte de verdade e não devem ser alterados nesta feature.
