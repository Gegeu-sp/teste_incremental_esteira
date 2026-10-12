# Quickstart & Guia de Validação: Conexão Bluetooth com Cinto Cardíaco

**Feature**: `specs/006-conexao-bluetooth-cinto`  
**Date**: 2026-10-12

## 1. Pré-requisitos
- Navegador com suporte a Web Bluetooth API:
  - **Desktop**: Google Chrome ou Microsoft Edge no Windows, macOS ou Linux.
  - **Android**: Google Chrome.
  - **iOS**: Bluefy Web BLE Browser (já que o Safari mobile não expõe Web Bluetooth).
- Dispositivo transmissor Bluetooth de frequência cardíaca (cinto Polar, Garmin HRM, Wahoo, Magene, CooSpo, etc.) OU aplicativo emulador de sensor de FC (ex.: *BLE Heart Rate Simulator* ou *nRF Connect* no smartphone).

---

## 2. Validação Automatizada de Unidade (Parser Puro)

Executar o conjunto de testes unitários do projeto em terminal para garantir que a decodificação de bytes de FC em UINT8 e UINT16 funcione com precisão:

```bash
npm test
# ou:
node --test tests/*.test.js
```

**Resultado esperado**:
- Todos os testes de `parseHeartRateMeasurement` passam (UINT8, UINT16, pacotes com flags de contato e intervalos RR, pacotes malformados com tratamento defensivo).

---

## 3. Validação Manual Ponta a Ponta (End-to-End)

### Cenário A: Navegador sem suporte a Bluetooth
1. Abrir a aplicação em um navegador sem Web Bluetooth (ex.: Firefox).
2. Verificar que a interface não quebra.
3. Verificar a presença de aviso sutil informando a necessidade de navegador compatível para conexão sem fio e que todos os campos de FC manuais funcionam normalmente.

### Cenário B: Pareamento e Monitoramento em Tempo Real (P1)
1. Colocar o cinto cardíaco ou iniciar a simulação no nRF Connect.
2. Abrir o RunLab no Chrome ou Edge.
3. Clicar no botão **"Conectar cinto cardíaco"**.
4. Selecionar o cinto na janela de dispositivos do navegador e clicar em "Parear".
5. **Resultado esperado**:
   - Status muda para "Conectado" com o nome do dispositivo.
   - O indicador de batimentos cardíacos passa a pulsar e exibir os BPM em tempo real.

### Cenário C: Teste Incremental com Auto-preenchimento (P2)
1. Com o cinto conectado, iniciar o Teste Incremental na esteira.
2. Aguardar o fim do estágio de 2 minutos ou clicar para avançar de estágio.
3. **Resultado esperado**:
   - O campo de FC do estágio é preenchido automaticamente com o valor do cinto.
   - A tabela de estágios registra a FC correspondente.
   - O avaliador pode editar o campo se desejar.

### Cenário D: Desconexão e Fallback (Edge Case)
1. Durante um estágio do teste, desligar o Bluetooth do transmissor ou afastar o cinto.
2. **Resultado esperado**:
   - Status muda para "Sinal perdido / Desconectado".
   - O cronômetro do teste NÃO é interrompido.
   - O campo de FC do estágio é desbloqueado para digitação manual direta.
