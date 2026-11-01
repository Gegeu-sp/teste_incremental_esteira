# Quickstart & Guia de Validação: Isolamento de Conexão e Fidedignidade Bluetooth

**Feature**: `specs/007-estabilidade-fidedignidade-bluetooth`  
**Date**: 2026-11-01

## 1. Pré-requisitos
- Node.js (v18+) para execução dos testes automatizados de unidade (`node --test`).
- Navegador com suporte a Web Bluetooth API (Google Chrome / Microsoft Edge no Desktop ou Android; Bluefy no iOS) para validação de interface e pareamento BLE.
- Cinto cardíaco Bluetooth (Polar, Garmin, Wahoo, Magene, CooSpo, Decathlon) ou simulador BLE (ex.: *nRF Connect*).

---

## 2. Validação Automatizada de Unidade (Funções Puras em `assets/calc.js`)

Executar a suíte de testes a partir do diretório do repositório (`teste_incremental_esteira`):

```bash
npm test
# ou diretamente:
node --test tests/*.test.js
```

**Cenários validados automaticamente**:
1. **Rejeição de mau contato (`contactDetected === false`)**: pacotes onde o sensor informa ausência de contato com a pele são rejeitados (`reason: 'no-contact'`) e não entram no buffer de estágio.
2. **Filtro de picos espúrios isolados (`spike`)**: saltos abruptos de 1 ou 2 amostras (`> 25 bpm` em `< 5s`, ex.: `150 → 210 → 151 bpm`) são descartados (`reason: 'spike'`).
3. **Confirmação de transição fisiológica real (`confirmed-transition`)**: quando um novo patamar de FC se sustenta por 3 amostras consecutivas (ex.: `140 → 172, 174, 175 bpm`), o filtro confirma a mudança real e passa a aceitar o novo patamar.
4. **Cálculo fidedigno de FC de estágio (`computeStableStageHr`)**:
   - Calcula a média aparada (`trimmed-mean`) das amostras válidas dos últimos 15 segundos, eliminando extremos residuais.
   - Rejeita janelas expiradas (`stale` > 6s sem novas amostras) retornando `bpm: null`.
5. **Diagnóstico de qualidade do sinal (`assessBtSignalQuality`)**: valida transições entre `'stable'`, `'noisy'`, `'no-contact'`, `'stale'`, `'reconnecting'` e `'lost'`.

---

## 3. Validação Manual Ponta a Ponta (End-to-End)

### Cenário A: Pareamento sem Colisão e Trava de Sessão (US1)
1. Abrir `index.html` no Chrome ou Edge em ambiente com múltiplos aparelhos Bluetooth ativos.
2. Clicar em **"Conectar cinto"** e observar que a listagem padrão filtra prioritariamente sensores cardíacos compatíveis.
3. Selecionar o cinto do aluno.
4. **Resultado esperado**:
   - O painel exibe o nome do cinto vinculado e o indicador **"Sinal fidedigno"**.
   - Se o sinal oscilar ou cair brevemente, o sistema exibe **"Reconectando ao cinto…"** e reconecta exclusivamente ao mesmo dispositivo sem abrir janela de seleção e sem conectar a outros cintos próximos.

### Cenário B: Seleção Acidental de Periférico Incompatível no Modo "Todos" (Edge Case)
1. Com o cinto desconectado, clicar em **"Todos"** e selecionar um periférico que não seja monitor cardíaco (ex.: fone de ouvido ou caixa de som).
2. **Resultado esperado**:
   - O sistema detecta a ausência do serviço `heart_rate`, encerra a conexão GATT imediatamente e exibe aviso orientativo sem travar em "Conectando…".

### Cenário C: Fechamento Estabilizado de Estágio e Alerta de Mau Contato (US2 & US3)
1. Com o cinto conectado, iniciar o Teste Incremental na esteira.
2. Simular perda momentânea de contato com a pele ou observar os últimos 15 segundos de um estágio de 2 minutos.
3. **Resultado esperado**:
   - Em caso de perda de contato, o badge alerta **"Mau contato"** e não sobrescreve a FC com `0` ou ruído.
   - Ao concluir os 2 minutos do estágio, o campo `#stHrNow` e a linha da tabela recebem a **FC estabilizada dos últimos 15 segundos**, mantendo o campo livre para edição manual caso o avaliador deseje ajustar.

