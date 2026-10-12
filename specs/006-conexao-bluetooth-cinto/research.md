# Technical Research: Conexão Bluetooth com Cinto Cardíaco

**Feature**: `specs/006-conexao-bluetooth-cinto`  
**Date**: 2026-10-12

## 1. Web Bluetooth API e Padrão GATT de Frequência Cardíaca

### Contexto
O objetivo é receber dados de frequência cardíaca diretamente no navegador, sem nenhum servidor intermediário, operando com cintos e sensores cardíacos Bluetooth Low Energy (BLE) padrão de mercado (Polar H10, Garmin HRM-Dual, Wahoo TICKR, CooSpo, Magene, Decathlon, etc.).

### Decisões Técnicas

#### Decisão 1: Utilização da Web Bluetooth API nativa
- **Decisão**: Utilizar `navigator.bluetooth.requestDevice` com o serviço padrão `'heart_rate'` (`0x180D`).
- **Rationale**: É uma API padrão do ecossistema Web (W3C Community Group), implementada nativamente no Chromium (Chrome Desktop, Chrome Android, Edge, Opera, Samsung Internet) e disponível via navegadores especiais como Bluefy no iOS. Não requer bibliotecas externas nem bundlers, mantendo o artefato estático (Princípio II da Constitution).
- **Alternativas consideradas**:
  - *App nativo / Electron / Cordova / Capacitor*: Rejeitado porque violaria o Princípio II (artefato estático HTML/JS puro hospedável em GitHub Pages/Firebase Hosting sem etapa de build).
  - *WebSockets / Servidor ponte local*: Rejeitado por violar o Princípio I (Zero-Backend) e exigir instalação de software adicional na esteira.

#### Decisão 2: Especificação do Serviço e Parser do Padrão Bluetooth SIG
- **Decisão**: Implementar a especificação Bluetooth SIG GATT Heart Rate Service:
  - **Service UUID**: `0x180D` (`heart_rate`)
  - **Characteristic UUID**: `0x2A37` (`heart_rate_measurement`)
  - **Formato dos Dados (`DataView`)**:
    - Byte 0 (Flags):
      - Bit 0 (`flags & 0x01`): Formato da FC. `0` = UINT8 (1 byte em offset 1), `1` = UINT16 (2 bytes em offset 1, little-endian).
      - Bit 1 & 2: Status de contato com a pele (Skin Contact).
      - Bit 3: Gasto energético presente.
      - Bit 4: Intervalos RR presentes.
    - Offset 1+: Valor de FC em bpm.
- **Rationale**: Universalidade com 100% dos cintos e sensores que seguem o padrão internacional.
- **Isolamento de Função Pura**: A lógica de decodificação de bytes em número de BPM (`parseHeartRateMeasurement(dataView)`) será uma função pura colocada em `assets/calc.js`, permitindo cobertura completa por testes automatizados em Node.js (`node --test`) conforme Princípio IV.

#### Decisão 3: Tratamento de Desconexão e Reconexão
- **Decisão**: Adicionar ouvinte ao evento `gattserverdisconnected` no objeto `BluetoothDevice`.
  - Atualizar o estado visual imediatamente para "Desconectado" ou "Sinal perdido".
  - Manter todos os registros históricos e o cronômetro do teste intactos.
  - Disponibilizar botão de reconexão de um clique (`device.gatt.connect()`).
  - Habilitar digitação manual nos campos sem bloqueio.
- **Rationale**: Cintos podem afastar-se da esteira, entrar em repouso por contato seco ou sofrer interferência. O fluxo do teste não pode ser abortado por falha de conectividade do sensor (Princípio III).

#### Decisão 4: Suporte de Navegadores e Graceful Degradation
- **Decisão**: Verificar `Boolean(navigator && navigator.bluetooth)` ao carregar a página.
  - Se suportado: Exibir botão "Conectar cinto cardíaco".
  - Se não suportado (ex.: Safari no iOS, Firefox no desktop): Exibir badge explicativo sutil ("Bluetooth requer Chrome/Edge no PC/Android ou app Bluefy no iOS; digitação manual ativa") e manter a interface manual habitual.
- **Rationale**: Garante que o aplicativo nunca quebra nem gera erros no console em navegadores sem suporte.

#### Decisão 5: Automação no Teste Incremental
- **Decisão**: Durante a contagem regressiva dos 2 minutos de cada estágio, o sistema armazena a FC contínua. Nos últimos 5 segundos ou no disparo de avanço do estágio (`nextStage`), o valor da FC é atribuído automaticamente ao campo `#stHrNow` e enviado à tabela/gráfico, permitindo que o avaliador ajuste manualmente se desejar.
- **Rationale**: Atende ao objetivo do usuário de diminuir o esforço operacional enquanto conduz o aluno na esteira (Princípio V).
