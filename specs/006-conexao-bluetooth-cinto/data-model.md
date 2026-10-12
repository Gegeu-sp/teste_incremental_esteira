# Data Model: Conexão Bluetooth com Cinto Cardíaco

**Feature**: `specs/006-conexao-bluetooth-cinto`  
**Date**: 2026-10-12

## Entidades e Estruturas de Dados

### 1. BluetoothConnectionState (Estado da Conexão Bluetooth)
Representa o estado operacional do hardware e da conexão BLE no cliente.

```typescript
interface BluetoothConnectionState {
  isSupported: boolean;       // Se navigator.bluetooth existe no navegador
  status: 'disconnected' | 'connecting' | 'connected' | 'lost';
  deviceName: string | null;  // Ex: "Polar H10 12345678" ou "HRM-Dual"
  batteryLevel?: number | null; // % de bateria se disponível (opcional)
  lastError: string | null;   // Mensagem amigável de erro se falhar
  lastReadingTime: number | null; // Timestamp da última notificação recebida
}
```

### 2. HeartRateSample (Amostra de Frequência Cardíaca)
Resultado da decodificação do pacote GATT do cinto (`0x2A37`).

```typescript
interface HeartRateSample {
  bpm: number;                // Frequência cardíaca em batimentos por minuto (ex: 142)
  contactDetected?: boolean;  // Se sensor detectou contato com a pele
  rrIntervals?: number[];     // Intervalos R-R em ms (se transmitidos pelo cinto)
  timestamp: number;          // Timestamp local da leitura (ms)
}
```

### 3. StageHeartRateEntry (Registro de FC no Estágio)
Associação da FC ao estágio do teste incremental.

```typescript
interface StageHeartRateEntry {
  stageIndex: number;         // Índice do estágio (0, 1, 2...)
  speed: number;              // Velocidade em km/h
  hr: number | null;          // FC registrada (bpm)
  rpe: number | null;         // Percepção subjetiva de esforço (Borg 6-20)
  tt: number | null;          // Talk Test (0 = fala confortável, 1 = com esforço, 2 = não consegue)
  source: 'auto-bluetooth' | 'manual'; // Proveniência do dado
}
```

## Regras de Validação e Transição de Estado

1. **Faixa Fisiológica Aceitável**:
   - `bpm >= 30` e `bpm <= 240`: Valor aceito e renderizado no mostrador.
   - `bpm < 30` ou `bpm > 240`: Alerta visual de leitura anômala/ruído de sensor; não deve ser fixado automaticamente como FC válida do estágio sem confirmação.

2. **Transições de Estado de Conexão**:
   - `disconnected` → `connecting` (usuário clica em conectar e abre diálogo do navegador).
   - `connecting` → `connected` (serviço GATT descoberto e notificações iniciadas com sucesso).
   - `connecting` → `disconnected` (usuário cancelou a janela de pareamento ou timeout).
   - `connected` → `lost` (disparo do evento `gattserverdisconnected` sem ação voluntária).
   - `lost` → `connecting` (tentativa de reconexão automática ou manual).
   - `connected` / `lost` → `disconnected` (usuário clica explicitamente em "Desconectar").

3. **Sobrescrita Manual**:
   - Mesmo com o cinto em estado `connected`, qualquer campo de entrada numérico (`#stHrNow`, campos da triagem e tolerância) aceita edição direta do usuário, mudando a origem daquele campo para `'manual'`.
