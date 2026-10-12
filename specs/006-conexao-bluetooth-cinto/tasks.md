# Tasks: Conexão Bluetooth com Cinto Cardíaco para Monitoramento de FC

**Input**: Design documents from `/specs/006-conexao-bluetooth-cinto/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/bluetooth-hr.md, quickstart.md  
**Tests**: Solicitados pela Constitution (Princípio IV) para lógica numérica e parser puro.

## Phase 1: Foundational — Parser GATT Puro e Testes Unitários

**Purpose**: Criar a função pura de decodificação de dados Bluetooth SIG Heart Rate (`0x2A37`), desacoplada de hardware e testável via Node.js.

- [x] T001 Implementar `parseHeartRateMeasurement(dataView)` em `assets/calc.js`: decodificar flags (bit 0 para UINT8 vs UINT16, bits 1-2 para contato com a pele, bit 4 para intervalos RR) com validação defensiva para pacotes truncados.
- [x] T002 Exportar `parseHeartRateMeasurement` no bloco `module.exports` existente em `assets/calc.js`.
- [x] T003 [P] Adicionar testes unitários completos em `tests/calc.test.js` para `parseHeartRateMeasurement`: casos com UINT8 (ex: 72 bpm), UINT16 (ex: 185 bpm), flags de contato, intervalos RR e tratamento de dados vazios ou corrompidos.

**Checkpoint**: `npm test` executando com sucesso e cobrindo todas as variações de pacotes Bluetooth Heart Rate.

---

## Phase 2: User Story 1 - Conectar Cinto Cardíaco Bluetooth e Visualizar FC em Tempo Real (Priority: P1) 🎯 MVP

**Goal**: Permitir ao avaliador conectar um cinto cardíaco BLE através do navegador e acompanhar os batimentos cardíacos (BPM) atualizados em tempo real na tela.

**Independent Test**: Abrir a aplicação em navegador compatível (Chrome/Edge), clicar no botão de conexão, selecionar o sensor BLE e verificar se o badge de status e o mostrador numérico de FC passam a exibir os batimentos em tempo real.

- [x] T004 [US1] Adicionar na interface de `index.html` os componentes visuais do cinto: botão de pareamento/desconexão (`#btnBtConnect`), badge de status da conexão (`#btStatusBadge`) e mostrador de BPM ao vivo com ícone de coração pulsante (`#liveHrDisplay`).
- [x] T005 [US1] Implementar o módulo/objeto `BluetoothHR` em `index.html`: checagem de `navigator.bluetooth`, pareamento com filtro `filters: [{ services: ['heart_rate'] }]`, conexão ao GATT Server, obtenção da característica `heart_rate_measurement`, escuta do evento `characteristicvaluechanged` e repasse dos dados para a interface via `parseHeartRateMeasurement`.
- [x] T006 [US1] Implementar tratamento de desconexão e exceções em `index.html`: escutar evento `gattserverdisconnected`, alertar visualmente perda de sinal, fornecer botão de desconexão voluntária limpa e exibir aviso discreto quando o navegador não suportar Web Bluetooth.

**Checkpoint**: User Story 1 funcional e testável de forma independente como MVP.

---

## Phase 3: User Story 2 - Preenchimento Automático da FC nos Estágios do Teste Incremental (Priority: P2)

**Goal**: Registrar automaticamente a FC do cinto ao final de cada estágio de 2 minutos do teste incremental, liberando o avaliador de digitação manual contínua.

**Independent Test**: Iniciar o teste incremental com o cinto pareado; ao expirar o tempo do estágio ou clicar em avançar estágio, a FC corrente do cinto deve ser preenchida no campo `#stHrNow` e adicionada à tabela de estágios.

- [x] T007 [US2] Em `index.html`, integrar o valor instantâneo do cinto à lógica do cronômetro de estágio (`runArea`): capturar a FC corrente do cinto ao término de cada estágio de 2 minutos (ou ao acionar próximo estágio) e preencher automaticamente o campo `#stHrNow`.
- [x] T008 [US2] Em `index.html`, garantir preservação da edição manual e continuidade: assegurar que o campo de FC do estágio permaneça editável caso o avaliador queira corrigir o valor e garantir que quedas de sinal Bluetooth não congelem o cronômetro do teste nem percam estágios passados.

**Checkpoint**: Teste incremental capturando e registrando batimentos de forma automática a cada estágio com fallback manual garantido.

---

## Phase 4: User Story 3 - Uso da FC Bluetooth na Triagem Inicial e no Teste de Tolerância (Priority: P3)

**Goal**: Disponibilizar botões de captura rápida com um clique para preencher a FC de repouso na Triagem e a FC no Teste de Tolerância com os dados do cinto.

**Independent Test**: Com o cinto conectado, acessar a aba Triagem ou Tolerância e clicar em "Usar FC do cinto", verificando o preenchimento instantâneo do campo correspondente.

- [x] T009 [US3] Em `index.html` (`#tab-triagem`), adicionar botão/atalho de captura rápida ao lado do campo de FC de repouso (`#sHr`) para transferir a FC atual do cinto conectado.
- [x] T010 [US3] Em `index.html` (`#tab-tolerancia`), adicionar botões/atalhos de captura rápida ao lado dos campos de FC pré e pós-teste de tolerância para preencher a partir da leitura atual do cinto.

**Checkpoint**: Todas as telas do RunLab que coletam FC integradas de forma opcional e rápida com o cinto conectado.

---

## Phase 5: Polish & Validação Final

- [x] T011 Rodar `npm test` para validar ausência de regressões em todas as fórmulas fisiológicas e garantir que os novos testes passem.
- [ ] T012 Realizar revisão de usabilidade mobile-first e layout em `index.html`, garantindo que os botões de Bluetooth sejam utilizáveis com uma mão ao lado da esteira e respeitem o tema visual da aplicação.

---

## Dependencies & Execution Strategy

- **Phase 1 (Foundational)** bloqueia Phase 2 (o módulo de UI usa `parseHeartRateMeasurement`).
- **Phase 2 (US1 - MVP)** entrega o valor central da funcionalidade (pareamento e visualização ao vivo). Pode ser entregue e testada de forma isolada.
- **Phase 3 (US2)** e **Phase 4 (US3)** dependem da Phase 2 para obter a leitura ativa de FC do `BluetoothHR`.
- **Phase 5 (Polish)** depende de todas as fases anteriores.
