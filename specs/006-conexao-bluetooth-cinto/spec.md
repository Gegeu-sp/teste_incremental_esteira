# Feature Specification: Conexão Bluetooth com Cinto Cardíaco para Monitoramento de FC

**Feature Branch**: `specs/006-conexao-bluetooth-cinto`

**Created**: 2026-10-12

**Status**: Draft

**Input**: User description: "verificar a inteiração com o bluetooth e o cinto para verificar os batimentos"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Conectar Cinto Cardíaco Bluetooth e Visualizar FC em Tempo Real (Priority: P1)

Como avaliador físico conduzindo o teste na esteira, desejo parear um cinto peitoral/monitor cardíaco padrão Bluetooth diretamente pela interface do RunLab, para acompanhar os batimentos cardíacos (BPM) do aluno continuamente na tela sem precisar ler um relógio externo ou apalpador manual.

**Why this priority**: É o valor central da funcionalidade. Sem a conexão e visualização em tempo real da frequência cardíaca, nenhuma outra automação de coleta de dados pode funcionar.

**Independent Test**: Ligar o cinto cardíaco transmissor, clicar no botão de pareamento Bluetooth na aplicação, selecionar o dispositivo na lista do navegador, e verificar se o valor numérico de BPM passa a atualizar dinamicamente na tela com indicador visual de conexão ativa.

**Acceptance Scenarios**:

1. **Given** um monitor cardíaco com Bluetooth ativo e o navegador com suporte a Bluetooth, **When** o avaliador clica em "Conectar cinto cardíaco" e seleciona o dispositivo, **Then** o sistema estabelece a conexão, exibe o status "Conectado" com o nome do dispositivo e mostra a FC em tempo real (bpm).
2. **Given** o cinto conectado transmitindo batimentos, **When** a FC do aluno oscila, **Then** a exibição de BPM na tela é atualizada a cada segundo sem travar a interface do cronômetro ou das abas.
3. **Given** o cinto conectado, **When** o avaliador clica em "Desconectar", **Then** a conexão é encerrada de forma limpa, o status volta para "Desconectado" e os campos de entrada manuais permanecem editáveis.

---

### User Story 2 - Preenchimento Automático da FC nos Estágios do Teste Incremental (Priority: P2)

Como avaliador durante o teste incremental de esforço, desejo que o sistema preencha automaticamente a FC registrada ao final de cada estágio de 2 minutos (ou ao comando de avanço de estágio), para reduzir a sobrecarga cognitiva e evitar erros de digitação rápida enquanto controlo a esteira e monitoro os sintomas do aluno.

**Why this priority**: A fase de execução do teste na esteira é crítica e de alta demanda de atenção. Automatizar o registro da FC do estágio enquanto o avaliador foca na segurança do aluno traz enorme ganho de usabilidade clínica (Princípio III e V da Constitution).

**Independent Test**: Iniciar o teste incremental com o cinto conectado. Ao completar os 2 minutos do estágio 1, verificar se o valor atual de BPM foi registrado no campo do estágio e na tabela de resultados, permitindo ajuste manual caso o avaliador deseje sobrescrever.

**Acceptance Scenarios**:

1. **Given** o teste incremental em andamento com o cinto pareado, **When** o cronômetro do estágio chega a zero (ou quando o estágio é avançado), **Then** a FC média ou instantânea dos últimos segundos do estágio é registrada automaticamente no campo do estágio atual e adicionada à tabela de estágios.
2. **Given** o registro automático da FC do estágio pelo cinto, **When** o avaliador identifica uma medição anômala ou deseja retificar o valor, **Then** o avaliador pode editar manualmente o campo numérico de FC a qualquer momento.

---

### User Story 3 - Uso da FC Bluetooth na Triagem Inicial e no Teste de Tolerância (Priority: P3)

Como avaliador, desejo poder capturar a FC de repouso na Triagem e a FC de recuperação/estresse no Teste de Tolerância diretamente pelo cinto Bluetooth já conectado, unificando a experiência de coleta em todas as etapas da avaliação.

**Why this priority**: Complementa o ecossistema da avaliação, garantindo consistência em todas as abas do RunLab onde a frequência cardíaca é coletada.

**Independent Test**: Com o cinto conectado, acessar a aba "Triagem", clicar em "Usar FC atual" no campo de FC de repouso e confirmar que o valor instantâneo do cinto é transferido para o formulário.

**Acceptance Scenarios**:

1. **Given** o cinto conectado transmitindo batimentos e a aba Triagem aberta, **When** o avaliador solicita a captura da FC de repouso, **Then** o valor instantâneo do cinto é inserido no campo de FC de repouso.
2. **Given** a aba de Teste de Tolerância aberta com o cinto conectado, **When** o avaliador registra os momentos pré e pós-esforço, **Then** a FC capturada pelo cinto é disponibilizada para preenchimento com um clique.

---

### Edge Cases

- **Navegador sem suporte à tecnologia Bluetooth (ex.: iOS Safari / WebKit)**:
  O sistema deve identificar a ausência de suporte no navegador e exibir um aviso discreto e orientativo (ex.: recomendando navegadores compatíveis como Chrome/Edge ou app com Web Bluetooth no iOS), mantendo 100% da funcionalidade de entrada manual de dados sem quebrar nenhuma tela.
- **Desconexão acidental do cinto durante o teste na esteira (queda de sinal, afastamento ou bateria fraca)**:
  O sistema deve sinalizar visualmente a perda de sinal imediatamente ("Sinal Bluetooth perdido"), preservar todos os dados já gravados nos estágios anteriores e alternar suavemente para o modo manual para permitir que o avaliador digite a FC do estágio atual sem interromper o cronômetro.
- **Leituras anômalas ou espúrias (ex.: contato seco da fita marcando 0 bpm ou picos irreais de > 240 bpm)**:
  O sistema deve filtrar ou alertar visualmente leituras fora da faixa fisiológica plausível antes de fixar automaticamente o valor no estágio.
- **Cancelamento pelo usuário na janela de pareamento**:
  Se o usuário fechar ou cancelar a janela de seleção de dispositivos Bluetooth do navegador, o sistema não deve emitir erros não tratados e deve permanecer no estado "Desconectado" pronto para nova tentativa.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE permitir a busca e conexão sem fio com monitores/cintos cardíacos que utilizem o serviço padronizado de frequência cardíaca Bluetooth (Heart Rate Service GATT padrão da indústria).
- **FR-002**: O sistema DEVE exibir em tempo real o valor da frequência cardíaca atual (em batimentos por minuto - BPM) com indicador de status de conexão visível na área de teste.
- **FR-003**: O sistema DEVE operar de forma 100% local no cliente (browser), sem trafegar leituras de batimentos cardíacos para servidores externos ou nuvem (em estrita conformidade com o Princípio I - Zero-Backend).
- **FR-004**: O sistema DEVE manter o preenchimento manual de FC sempre disponível como alternativa ou fallback caso o cinto não seja utilizado ou ocorra desconexão.
- **FR-005**: Durante o teste incremental, o sistema DEVE capturar automaticamente o batimento cardíaco ao término de cada estágio de 2 minutos para alimentação da tabela e gráfico de curva hemodinâmica.
- **FR-006**: O sistema DEVE permitir ao usuário desconectar manualmente o dispositivo a qualquer momento.
- **FR-007**: O sistema DEVE detectar desconexões não planejadas e alertar o avaliador com indicador de status claro sem interromper a contagem do cronômetro da esteira.
- **FR-008**: O sistema DEVE validar e rejeitar/alertar valores fora da faixa aceitável de frequência cardíaca humana (ex.: leituras zero ou espúrias).
- **FR-009**: O sistema DEVE verificar a disponibilidade da API de Bluetooth no navegador antes de tentar o pareamento e fornecer mensagem explicativa quando não suportado.
- **FR-010**: O sistema DEVE permitir a captura de FC com um clique nos campos de repouso (Triagem) e Teste de Tolerância quando o cinto estiver conectado.

### Key Entities *(include if feature involves data)*

- **Dispositivo Cardíaco Bluetooth**: Representa o sensor/cinto conectado (nome do dispositivo, status de conexão: desconectado, conectando, conectado, reconectando; nível de bateria se disponibilizado pelo dispositivo).
- **Leitura de FC em Tempo Real**: Valor instantâneo de batimentos por minuto (bpm) e carimbo de tempo da última leitura recebida.
- **Registro de FC do Estágio**: Valor de FC vinculado ao estágio específico do teste incremental, com indicação de origem (automático via cinto ou digitado/editado manualmente).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Pareamento com o cinto realizado em menos de 10 segundos (a partir do clique em conectar e seleção do dispositivo).
- **SC-002**: Latência de atualização da FC na tela inferior a 1,5 segundos em relação à transmissão do cinto.
- **SC-003**: Redução a zero da necessidade de digitação manual de FC durante os estágios do teste incremental quando o cinto estiver conectado.
- **SC-004**: Continuidade total do teste: em caso de desconexão do cinto, 100% dos estágios anteriores permanecem intactos e o cronômetro do teste continua sem congelamento.
- **SC-005**: 100% de preservação do princípio Zero-Backend (nenhum dado de telemetria transmitido para APIs de terceiros).

## Assumptions

- O cinto ou sensor do usuário utiliza o perfil Bluetooth padrão Heart Rate Service (UUID de serviço padrão `0x180D` e característica `0x2A37`), adotado universalmente por fabricantes como Polar, Garmin, Wahoo, Decathlon, CooSpo, Magene, etc.
- O navegador utilizado para a conexão Bluetooth suporta a Web Bluetooth API (Google Chrome, Microsoft Edge, Opera, Bluefy no iOS, Chrome no Android).
- A digitação manual continuará sendo a principal alternativa funcional para ambientes onde o Bluetooth não estiver disponível.
- A aplicação permanece como um arquivo estático cliente puro, sem introduzir dependências pesadas ou bundlers (aderente aos Princípios I, II e V da Constitution).
