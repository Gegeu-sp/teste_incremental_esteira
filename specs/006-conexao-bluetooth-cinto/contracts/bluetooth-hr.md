# Contract: Bluetooth Heart Rate Service & Pure Parser

**Feature**: `specs/006-conexao-bluetooth-cinto`  
**Date**: 2026-10-12

## 1. Pure Parser Contract (`assets/calc.js`)

Função pura desacoplada do DOM e de Web APIs de hardware, executável tanto no browser quanto nos testes em Node.js.

### Assinatura
```javascript
function parseHeartRateMeasurement(dataView)
```

### Entradas
- `dataView`: Instância de `DataView` representando os bytes crus recebidos da característica `0x2A37`.
  - Mínimo de 2 bytes (Byte 0: flags, Byte 1+: bpm).

### Saída
Objeto formatado contendo:
```javascript
{
  bpm: number,            // Inteiro positivo (ex: 135)
  contactDetected: boolean | null, // True se contato com pele detectado, false se não, null se não suportado
  energyExpended: number | null,   // Em Joules/kJ se presente
  rrIntervals: number[]   // Array com intervalos RR em milissegundos (pode ser vazio)
}
```

### Regras de Parsing
1. Se `dataView` for nulo, indefinido ou tiver `byteLength < 2`, retorna `{ bpm: null, contactDetected: null, rrIntervals: [] }`.
2. `flags = dataView.getUint8(0)`.
3. Se `(flags & 0x01) === 0`:
   - `bpm = dataView.getUint8(1)`.
   - `offset = 2`.
4. Se `(flags & 0x01) === 1`:
   - Se `dataView.byteLength < 3`, retorna `{ bpm: null }`.
   - `bpm = dataView.getUint16(1, /*littleEndian=*/true)`.
   - `offset = 3`.
5. Se `flags & 0x06`:
   - Bit 1: Suporte a contato; Bit 2: Contato detectado.
6. Se `flags & 0x08`:
   - `offset += 2` (Gasto energético ignorado ou extraído se necessário).
7. Se `flags & 0x10`:
   - Leitura de intervalos RR subsequentes (UINT16 com escala 1/1024s, convertidos para ms).

---

## 2. UI & Web Bluetooth Lifecycle Contract (`index.html`)

Componente/Módulo no frontend responsável pela orquestração com a Web Bluetooth API.

### Métodos e Eventos Expostos
```javascript
const BluetoothHR = {
  // Verificação de disponibilidade
  isSupported(): boolean,

  // Ações do usuário
  connect(): Promise<void>,
  disconnect(): Promise<void>,

  // Consulta de estado atual
  getState(): {
    status: 'disconnected' | 'connecting' | 'connected' | 'lost',
    deviceName: string | null,
    currentBpm: number | null
  },

  // Inscrição para atualizações em tempo real
  subscribe(callback: (sample: HeartRateSample) => void): () => void
};
```

### Contrato de Elementos de Interface
- **Botão de Ação**: `#btnBtConnect` (Alterna entre "Conectar cinto" e "Desconectar").
- **Badge de Status**: `#btStatusBadge` (Cores: cinza = desconectado, amarelo = conectando, verde = conectado, vermelho = sinal perdido).
- **Mostrador de BPM ao Vivo**: `#liveHrDisplay` (Exibe os batimentos em tempo real com ícone de coração pulsante).
- **Botões de Captura Rápida**:
  - `#btnCaptureRestHr`: Em Triagem (preenche FC de repouso).
  - `#btnCaptureTteHr`: Em Teste de Tolerância (preenche FC pré/pós).
