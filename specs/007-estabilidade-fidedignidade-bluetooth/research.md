# Technical Research: Isolamento de Conexão e Fidedignidade das Leituras Bluetooth de FC

**Feature**: `specs/007-estabilidade-fidedignidade-bluetooth`  
**Date**: 2026-11-01

## 1. Isolamento de Dispositivo e Prevenção de Colisão em Ambientes Compartilhados

### Contexto
Em academias, estúdios e laboratórios de avaliação física, dezenas de dispositivos Bluetooth Low Energy (BLE) e redes Wi-Fi 2.4 GHz operam simultaneamente no mesmo espaço físico (outros cintos cardíacos, relógios esportivos, fones de ouvido, caixas de som, TVs e painéis de esteiras). O módulo atual (`BluetoothHR` na feature 006) apresentava três fragilidades nesse cenário:
1. O filtro padrão de `requestDevice` incluía prefixos curtos e genéricos (`namePrefix: 'HR'`, `'hr'`, `'Heart'`), e o botão `"Todos"` (`acceptAllDevices: true`) permitia conectar a periféricos sem o serviço `0x180D` sem feedback claro ao usuário.
2. Não havia exibição explícita de vínculo de sessão (identificador único do dispositivo + trava de sessão) nem ação dedicada para destravar/trocar de sensor com segurança.
3. Na queda temporária de sinal (`gattserverdisconnected`), o sistema caía imediatamente em estado passivo `lost`, exigindo clique manual do avaliador ou nova abertura do seletor (onde outro cinto vizinho poderia ser clicado por engano durante a corrida).

### Decisões Técnicas

#### Decisão 1: Vínculo Exclusivo de Sessão (`boundDeviceId`) e Reconexão Automática Restrita
- **Decisão**: Assim que um sensor válido expõe o serviço `heart_rate` (`0x180D`), o módulo `BluetoothHR` armazena a referência do `BluetoothDevice` e seu `device.id` exclusivo (`boundDeviceId`) como **dispositivo travado da sessão**.
  - Qualquer oscilação ou queda (`gattserverdisconnected`) dispara um ciclo de **reconexão automática silenciosa** (`device.gatt.connect()`) exclusivamente sobre a instância `device` já vinculada (`device.id === boundDeviceId`), com backoff exponencial curto (ex.: tentativas em `800ms`, `2000ms`, `4500ms`), sem jamais reabrir `navigator.bluetooth.requestDevice()` automaticamente.
  - O seletor de dispositivos só pode ser reaberto se o avaliador acionar explicitamente a desconexão/troca de sensor.
- **Rationale**: Na Web Bluetooth API, `device.gatt.connect()` reconecta diretamente ao endereço MAC/ID pareado na aba sem reabrir a listagem geral de rádio, garantindo **0% de chance de colisão ou troca cruzada** com o cinto de outro aluno ao lado.
- **Alternativas consideradas**:
  - *Reabrir `requestDevice` ao perder conexão*: Rejeitado — exige gesto do usuário no navegador e expõe o avaliador ao risco de clicar em outro cinto na pressa do teste.
  - *Persistir MAC address no `localStorage` entre recargas*: `navigator.bluetooth.getDevices()` ainda possui suporte experimental/restrito por flag em parte dos navegadores; manter o objeto `BluetoothDevice` em memória durante toda a SPA garante compatibilidade 100% no Chrome/Edge/Bluefy sem flags experimentais.

#### Decisão 2: Descoberta Estrita por Serviço GATT `heart_rate` e Validação Pós-Conexão no Modo Amplo
- **Decisão**:
  - No botão principal (`Conectar cinto`), priorizar o filtro canônico `filters: [{ services: ['heart_rate'] }]` combinado apenas com prefixos específicos de cintos cardíacos conhecidos que omitem o UUID no pacote de advertising (`Polar`, `Garmin`, `Wahoo`, `Magene`, `CooSpo`, `Decathlon`, `Kalenji`, `Geonaute`, `H64`, `H303`, `TICKR`, `HRM`).
  - Caso o usuário utilize o modo de compatibilidade (`Todos`) e selecione por engano um periférico que não possui o serviço `0x180D` (ex.: fone Bluetooth ou TV), capturar o erro de `getPrimaryService('heart_rate')`, desconectar imediatamente o GATT daquele aparelho e exibir mensagem específica no badge: `"Aparelho sem sensor de FC · selecione o cinto"`.
- **Rationale**: Evita poluição na lista padrão e impede que conexões acidentais a outros aparelhos deixem o sistema preso ou mudo.

---

## 2. Filtragem Fisiológica e Fidedignidade da Leitura de FC

### Contexto
Na implementação anterior, `stageHr()` retornava apenas a última leitura instantânea (`bpm`) no exato segundo em que o estágio de 2 minutos terminava, e `onValue()` aceitava pacotes mesmo quando o bit de contato com a pele indicava `contactDetected === false`. Durante a corrida na esteira, o impacto mecânico, o suor inicial insuficiente ou a colisão de pacotes RF de 2.4 GHz podem produzir:
- Leituras de `0 bpm` ou valores congelados quando `contactDetected === false`.
- Picos isolados de 1 pacote (ex.: o aluno está a `152 bpm`, um pacote ruidoso reporta `208 bpm` ou `82 bpm`, e no segundo seguinte volta a `153 bpm`).

### Decisões Técnicas

#### Decisão 3: Rejeição de Mau Contato (`contactDetected === false`) e Filtro de Salto Fisiológico (Spike Filter)
- **Decisão**: Implementar a função pura `evaluateHrSample(sample, recentValidSamples, pendingSpikes, options)` em `assets/calc.js`:
  1. **Validação de Contato**: Se `sample.contactDetected === false`, a amostra é rejeitada com motivo `'no-contact'`.
  2. **Validação de Faixa Humana**: Se `!isPlausibleHr(sample.bpm)` (`< 30` ou `> 240` bpm), é rejeitada com motivo `'out-of-range'`.
  3. **Filtro de Variação Fisiológica Instantânea (Spike Rejection)**:
     - Compara `sample.bpm` com a última amostra válida aceita há menos de `spikeWindowMs` (`5000 ms`).
     - A frequência cardíaca humana não salta mais de `25 bpm` em 1–2 segundos de forma isolada. Se `Math.abs(sample.bpm - lastValid.bpm) > maxDeltaBpm` (`25 bpm`), a leitura é classificada inicialmente como `'spike'` (suspeita) e guardada em `pendingSpikes`.
     - **Confirmação de Transição Real**: Se `minConfirmations` (`3` amostras consecutivas dentro de `6000 ms`) confirmarem o novo patamar (diferença entre elas `<= 15 bpm`), o sistema reconhece que houve uma mudança fisiológica real (ex.: retomada após hiato ou sprint) e passa a aceitar o novo patamar imediatamente.
- **Rationale**: Elimina 100% dos picos/quedas de 1 ou 2 amostras causados por ruído elétrico ou interferência, sem jamais "travar" a leitura caso a FC do aluno realmente suba ou desça de forma sustentada.
- **Alternativas consideradas**:
  - *Média móvel exponencial simples (EMA) sem rejeição de outlier*: Rejeitado — um único pico de `220 bpm` sobre `150 bpm` ainda puxaria a média para `~170+ bpm`, contaminando o estágio.
  - *Descarte permanente de qualquer salto > 25 bpm*: Rejeitado — se o cinto ficar 4 segundos sem transmitir no início de um tiro e voltar 30 bpm acima, um filtro sem confirmação travaria eternamente. A confirmação por 3 amostras consecutivas resolve esse caso de borda.

#### Decisão 4: Cálculo da FC de Estágio por Média Aparada (Trimmed Mean) dos Últimos 15 Segundos
- **Decisão**: Implementar a função pura `computeStableStageHr(validSamples, nowMs, options)` em `assets/calc.js`:
  - Considera todas as amostras válidas recebidas na janela final do estágio (`windowMs = 15000 ms`, ou seja, os últimos 15 segundos do estágio de 2 minutos), exigindo que a amostra mais recente não esteja expirada (`nowMs - latest.timestamp <= staleMs`, onde `staleMs = 6000 ms`).
  - Se houver `>= 5` amostras na janela: ordena os valores de BPM, remove os extremos (20% inferiores e 20% superiores, mínimo de 1 menor e 1 maior) e calcula a média aritmética arredondada (`Math.round`) do núcleo central (**média aparada / trimmed mean**).
  - Se houver `3` ou `4` amostras: calcula a **mediana** arredondada.
  - Se houver `1` ou `2` amostras recentes válidas: calcula a média simples arredondada.
  - Se não houver amostras válidas recentes: retorna `bpm: null` para impedir o preenchimento automático de um valor enganoso.
- **Rationale**: Na fisiologia do exercício, a FC representativa de um estágio submáximo/máximo de 2 minutos é o platô dos 10–15 segundos finais. A média aparada/mediana é estatisticamente robusta contra qualquer ruído residual e fornece um número fidedigno ao avaliador.

#### Decisão 5: Diagnóstico Determinístico de Qualidade do Sinal (`assessBtSignalQuality`)
- **Decisão**: Implementar `assessBtSignalQuality(context, nowMs)` em `assets/calc.js`, retornando o estado de confiabilidade:
  - `'stable'`: Conectado, contato OK, amostra válida recente (`<= 3500 ms`), baixa taxa de artefatos → `"Sinal fidedigno"`.
  - `'noisy'`: Conectado e com leitura válida recente, mas com picos descartados nos últimos segundos → `"Filtro ativo · sinal oscilando"`.
  - `'no-contact'`: Últimos pacotes indicam `contactDetected === false` → `"Ajuste o cinto (mau contato)"`.
  - `'stale'`: Conectado, porém sem amostras válidas há mais de `5000 ms` → `"Aguardando batimentos…"`.
  - `'reconnecting'`: Em tentativa automática de reconexão ao cinto vinculado → `"Reconectando ao cinto…"`.
  - `'lost'`: Queda após esgotar tentativas automáticas → `"Sinal perdido · digite FC"`.
- **Rationale**: Dá transparência clínica imediata ao avaliador ao lado da esteira (Princípios III e V).

