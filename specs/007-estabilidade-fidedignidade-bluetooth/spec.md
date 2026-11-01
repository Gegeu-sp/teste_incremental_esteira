# Feature Specification: Isolamento de Conexão e Fidedignidade das Leituras Bluetooth de FC

**Feature Branch**: `specs/007-estabilidade-fidedignidade-bluetooth`

**Created**: 2026-10-30

**Status**: Draft

**Input**: User description: "verificar a rede bluetooth para nao ficar colidindo com outras rede e ter o resultado do bluetooth mais fidedigno"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Isolamento do Sensor e Prevenção de Colisão entre Dispositivos Próximos (Priority: P1)

Como avaliador físico aplicando testes em ambiente compartilhado (academia, estúdio ou laboratório com múltiplos alunos, celulares, caixas de som, esteiras e outros monitores cardíacos ativos), desejo que o sistema filtre rigorosamente apenas sensores cardíacos válidos na descoberta inicial e mantenha vínculo exclusivo (trava de sessão) com o cinto selecionado do aluno em avaliação, para que interferências ou reconexões nunca capturem batimentos de outro equipamento ou pessoa próxima.

**Why this priority**: Em academias e assessorias esportivas, há dezenas de sinais sem fio simultâneos. Conectar ou reconectar acidentalmente ao sensor de outro aluno ao lado invalida toda a avaliação clínica e o diagnóstico de zonas de treino (Princípio III — Segurança Clínica).

**Independent Test**: Em um ambiente com mais de um dispositivo Bluetooth ativo, iniciar a conexão padrão, verificar que apenas sensores cardíacos compatíveis são listados prioritariamente, conectar ao cinto do aluno, simular uma queda rápida de sinal e confirmar que a reconexão ocorre exclusivamente com o mesmo dispositivo vinculado, exibindo sua identificação única na tela.

**Acceptance Scenarios**:

1. **Given** múltiplos dispositivos sem fio ativos no ambiente (fones, celulares, TVs, outros cintos), **When** o avaliador aciona a conexão padrão do cinto, **Then** o seletor prioriza estritamente dispositivos que anunciam o serviço de frequência cardíaca ou prefixos homologados de monitores cardíacos, evitando poluição visual de periféricos genéricos.
2. **Given** um cinto cardíaco conectado para a sessão do aluno atual, **When** a conexão é estabelecida, **Then** o sistema registra e exibe o identificador/nome específico do dispositivo vinculado e bloqueia trocas automáticas para qualquer outro sensor durante o teste em andamento.
3. **Given** uma oscilação ou perda temporária de sinal durante o teste na esteira, **When** o sistema tenta restabelecer a comunicação automaticamente, **Then** ele reconecta única e exclusivamente ao identificador do dispositivo já vinculado à sessão atual, sem abrir margem para capturar pacotes de outro cinto próximo.
4. **Given** o desejo explícito do avaliador de trocar de cinto, **When** ele aciona a opção "Trocar/Esquecer sensor" fora de um estágio crítico ou após desconectar, **Then** o vínculo anterior é limpo de forma controlada para permitir um novo pareamento.

---

### User Story 2 - Filtragem de Artefatos e Cálculo Fidedigno da FC de Estágio (Priority: P2)

Como avaliador conduzindo o teste incremental de 2 minutos por estágio, desejo que o sistema descarte leituras espúrias (falha de contato com a pele, saltos fisiologicamente impossíveis de 1 segundo ou ruído de impacto na corrida) e registre ao final de cada estágio um valor representativo e estabilizado dos segundos finais, em vez de uma única leitura instantânea sujeita a oscilação momentânea.

**Why this priority**: Um único pacote corrompido ou pico de ruído exatamente no segundo `02:00` do estágio distorce a curva hemodinâmica, a estimativa de VT1/VT2 e a prescrição de zonas (Princípio IV — Precisão Numérica Testável). Na fisiologia do exercício, a FC de final de estágio deve refletir o estado estável dos últimos segundos do estágio.

**Independent Test**: Simular uma sequência de leituras de frequência cardíaca nos últimos 15 segundos de um estágio contendo valores estáveis em torno de 160 bpm e um pico isolado de 215 bpm (ou queda a 0/40 bpm por perda momentânea de contato), e verificar que o valor registrado no estágio reflete a leitura estabilizada (~160 bpm), ignorando o pico espúrio.

**Acceptance Scenarios**:

1. **Given** o cinto enviando indicador explícito de "sem contato com a pele" ou leituras fora da faixa fisiológica plausível, **When** esses pacotes chegam ao sistema, **Then** eles são descartados do cálculo de estágio e a interface sinaliza "Ajuste o cinto / mau contato" sem sobrescrever a última leitura válida consolidada.
2. **Given** uma série de batimentos estáveis (ex.: ~150 bpm) durante a corrida, **When** ocorre um salto abrupto isolado incompatível com a resposta fisiológica humana em 1 segundo (ex.: salto instantâneo > 25 bpm seguido de retorno ou perda de pacote), **Then** o filtro de estabilidade atenua/rejeita a leitura anômala antes de exibi-la como FC consolidada ou gravá-la no estágio.
3. **Given** um estágio de 2 minutos chegando ao fim com o cinto conectado, **When** o sistema preenche automaticamente a FC do estágio, **Then** o valor registrado corresponde à média estabilizada (sem extremos/outliers) das leituras válidas coletadas na janela final do estágio (últimos 10 a 15 segundos), garantindo alta fidedignidade clínica.

---

### User Story 3 - Indicador de Qualidade do Sinal e Reconexão Silenciosa Resiliente (Priority: P3)

Como avaliador acompanhando o teste ao lado da esteira pelo celular ou notebook, desejo visualizar o nível de confiabilidade do sinal Bluetooth (estável, instável/mau contato ou reconectando) e contar com recuperação automática transparente em microquedas de sinal, para saber exatamente quando posso confiar na leitura automática e quando devo intervir.

**Why this priority**: Ambientes com interferência de rádio (Wi-Fi 2.4 GHz e múltiplos dispositivos Bluetooth na mesma faixa de frequência) causam microquedas de pacotes. Recuperar a conexão automaticamente sem exigir novo clique na tela reduz a carga cognitiva do avaliador (Princípio V).

**Independent Test**: Com o cinto conectado, simular atraso de pacotes ou desconexão breve (< 10 segundos) e verificar se o sistema tenta reconectar automaticamente em segundo plano ao mesmo sensor, exibindo o indicador de qualidade de sinal correspondente.

**Acceptance Scenarios**:

1. **Given** o cinto conectado e enviando pacotes regulares com bom contato e baixa variação espúria, **When** o avaliador observa o painel Bluetooth, **Then** um indicador de qualidade confirma "Sinal estável / Fidedigno".
2. **Given** atraso no recebimento de pacotes (> 3 segundos sem atualização), mau contato na fita peitoral ou alta taxa de leituras descartadas por ruído, **When** essa instabilidade ocorre, **Then** o indicador muda para alerta ("Sinal instável / Verifique contato") antes que um valor impreciso seja utilizado.
3. **Given** uma queda inesperada de conexão durante a sessão, **When** o evento de desconexão ocorre, **Then** o sistema executa tentativas automáticas de reconexão ao mesmo dispositivo vinculado com recuo progressivo, restaurando o monitoramento ao vivo sem intervenção manual assim que o cinto voltar ao alcance.

---

### Edge Cases

- **Queda definitiva de bateria ou afastamento permanente durante o estágio**:
  Se as tentativas automáticas de reconexão ao dispositivo vinculado não tiverem sucesso dentro da janela limite, o sistema encerra o ciclo de tentativas, sinaliza claramente "Sinal perdido — digite a FC manualmente" e mantém o cronômetro e os dados anteriores intactos.
- **Poucas amostras válidas nos últimos segundos do estágio (ex.: cinto conectado há menos de 5 segundos do fim do estágio)**:
  Se a janela final do estágio tiver menos amostras do que o ideal, o sistema utiliza as amostras válidas recentes disponíveis (dentro do limite de validade temporal) e, caso não haja nenhuma amostra válida recente, não preenche um número enganoso, solicitando confirmação/digitação manual ao avaliador.
- **Transição fisiológica real rápida (ex.: início de esforço ou recuperação pós-esforço)**:
  O filtro de rejeição de artefatos deve distinguir entre um salto elétrico impossível em 1 segundo (ex.: +35 bpm instantâneo em um único pacote) e uma subida/descida fisiológica progressiva real ao longo de vários segundos consecutivos, nunca travando a atualização real da FC quando a mudança se sustenta por múltiplas leituras seguidas.
- **Dispositivo selecionado no modo amplo ("Todos") que não possui serviço de frequência cardíaca**:
  Se o usuário optar pela busca ampla e selecionar por engano uma caixa de som, TV ou relógio que não expõe o serviço padrão de frequência cardíaca, o sistema deve desconectar imediatamente desse dispositivo e exibir mensagem clara explicando que o aparelho selecionado não transmite frequência cardíaca, sem travar em "Conectando…".

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE vincular exclusivamente o dispositivo sensor selecionado (por sua identidade única de sessão) do início ao fim da avaliação, garantindo que tentativas de reconexão automática ocorram apenas com o mesmo dispositivo já pareado.
- **FR-002**: O sistema DEVE validar imediatamente após a conexão se o dispositivo expõe o serviço padrão de medição de frequência cardíaca; caso contrário (ex.: seleção acidental de outro periférico em ambiente congestionado), DEVE encerrar a conexão com aviso claro ao usuário.
- **FR-003**: O sistema DEVE realizar reconexão automática transparente (com múltiplas tentativas espaçadas) ao dispositivo vinculado quando ocorrer queda involuntária de sinal durante o uso, sem bloquear a interface ou o cronômetro do teste.
- **FR-004**: O sistema DEVE rejeitar leituras em que o próprio sensor informe ausência de contato físico com a pele (`contactDetected = false`), exibindo alerta visual de mau contato ao avaliador.
- **FR-005**: O sistema DEVE aplicar filtragem de plausibilidade e variação fisiológica sobre o fluxo de batimentos recebidos, descartando picos ou quedas isoladas de 1 amostra que excedam a variação humana plausível entre leituras consecutivas, mas acompanhando mudanças reais sustentadas em leituras subsequentes.
- **FR-006**: O sistema DEVE calcular a FC automática de fechamento de cada estágio do teste incremental usando uma medida central estabilizada (média aparada/mediana das leituras válidas dos últimos 10 a 15 segundos do estágio), em vez de depender de uma única amostra instantânea no segundo final.
- **FR-007**: O sistema DEVE manter uma classificação em tempo real da qualidade/confiabilidade do sinal (ex.: "Fidedigno/Estável", "Mau contato/Ruído", "Sinal atrasado/Reconectando") visível no painel do cinto e nos atalhos de preenchimento.
- **FR-008**: O sistema DEVE impedir o preenchimento automático de estágio ou captura rápida quando o sinal atual estiver expirado, sem contato com a pele ou sem amostras válidas recentes suficientes, preservando a integridade clínica dos registros.
- **FR-009**: Toda a lógica de filtragem de ruído, detecção de outliers fisiológicos, avaliação de qualidade de sinal e cálculo da FC estabilizada de estágio DEVE ser determinística, livre de dependências externas e 100% testável de forma automatizada (em conformidade com o Princípio IV da Constitution).
- **FR-010**: O sistema DEVE continuar operando 100% no cliente (Zero-Backend), sem transmitir identificadores de dispositivos Bluetooth ou séries de batimentos para servidores externos (Princípio I da Constitution).

### Key Entities *(include if feature involves data)*

- **Vínculo de Sessão do Sensor (Device Lock)**: Identificador único do dispositivo conectado na sessão atual, nome amigável, estado de travamento da sessão e contador de tentativas de reconexão automática.
- **Janela Deslizante de Amostras de FC (Rolling HR Buffer)**: Histórico recente de leituras válidas dos últimos segundos contendo valor de BPM, carimbo de tempo, status de contato com a pele e intervalos RR (quando disponíveis).
- **Diagnóstico de Qualidade do Sinal**: Estado calculado da confiabilidade da leitura atual (`estavel`, `mau-contato`, `ruido`, `expirado`, `reconectando`) e valor de FC estabilizada (suavizada para exibição e consolidada para fechamento de estágio).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 0% de troca cruzada de dispositivo: em reconexões automáticas após queda de sinal, 100% das tentativas são direcionadas exclusivamente ao sensor previamente vinculado na sessão, sem conectar a outros dispositivos Bluetooth vizinhos.
- **SC-002**: 100% dos picos espúrios isolados de 1 leitura (variação abrupta > 25 bpm em até 2 segundos não sustentada nas amostras seguintes, ou leituras com indicador de falta de contato) são filtrados e não contaminam a FC registrada nos estágios do teste incremental.
- **SC-003**: A FC registrada automaticamente ao fim de um estágio de 2 minutos apresenta desvio máximo de ±1 bpm em relação à tendência central real dos últimos 15 segundos do estágio, mesmo na presença de até 20% de pacotes ruidosos na janela.
- **SC-004**: Em microquedas de sinal Bluetooth de até 10 segundos, o sistema restabelece a leitura em tempo real automaticamente sem necessidade de clique do avaliador na tela.
- **SC-005**: 100% das funções de filtragem de sinal, rejeição de artefatos e cálculo de FC estabilizada de estágio possuem cobertura de testes automatizados passando sem regressões nas fórmulas existentes do RunLab.

## Assumptions

- A interferência de rádio na faixa de 2.4 GHz (comum entre múltiplos dispositivos Bluetooth e redes Wi-Fi em academias) é tratada na camada de aplicação por meio de: (a) filtragem estrita no pareamento, (b) vínculo exclusivo ao identificador do sensor conectado, (c) reconexão automática resiliente com backoff e (d) validação/suavização estatística dos pacotes recebidos, visto que o controle de salto de canais de frequência (Adaptive Frequency Hopping) ocorre nativamente no hardware Bluetooth.
- Uma janela de 10 a 15 segundos finais do estágio é o padrão fisiológico adequado para representar a frequência cardíaca de final de estágio em protocolos incrementais de 2 minutos.
- Um salto instantâneo superior a 25 bpm em menos de 2 segundos em uma única amostra isolada é tratado como artefato de medição, mas se 3 ou mais amostras consecutivas confirmarem o novo patamar dentro da faixa fisiológica (30–240 bpm), o sistema aceita a nova faixa como mudança fisiológica real.
- O preenchimento manual permanece soberano: o avaliador sempre pode digitar ou sobrescrever qualquer valor de FC a qualquer momento.

