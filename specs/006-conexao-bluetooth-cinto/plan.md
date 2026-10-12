# Implementation Plan: Conexão Bluetooth com Cinto Cardíaco para Monitoramento de FC

**Branch**: `specs/006-conexao-bluetooth-cinto` | **Date**: 2026-10-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/006-conexao-bluetooth-cinto/spec.md`

## Summary

Implementa a integração direta via Web Bluetooth API com cintos e monitores cardíacos padrão BLE (serviço GATT Heart Rate `0x180D`), permitindo pareamento com um clique, exibição de FC em tempo real (bpm) e preenchimento automático da FC nos estágios do teste incremental, na triagem e no teste de tolerância. A lógica de decodificação de pacotes binários do sensor (`parseHeartRateMeasurement`) é implementada como função pura em `assets/calc.js` com testes unitários em Node.js (`tests/calc.test.js`). Toda a comunicação é estritamente client-side, mantendo o aplicativo 100% estático, sem backend e sem quebra para navegadores sem suporte a Bluetooth.

## Technical Context

**Language/Version**: HTML5 / CSS3 (Tailwind via CDN) / JavaScript vanilla (ES2020+); testes com runner nativo de Node.js (`node --test`).

**Primary Dependencies**: Nenhuma nova biblioteca externa. Uso exclusivo da Web Bluetooth API nativa do navegador (`navigator.bluetooth`).

**Storage**: `localStorage` mantendo estado habitual (`runlab_state_v2`). As preferências de último dispositivo ou telemetria em tempo real não necessitam de persistência persistente sensível.

**Testing**: `node --test tests/*.test.js` para o parser puro e testes ponta a ponta manuais conforme `quickstart.md`.

**Target Platform**: Navegadores com suporte a Web Bluetooth (Google Chrome / Microsoft Edge no desktop e Android; Bluefy no iOS), com degradação graciosa (fallback para digitação manual) em navegadores sem suporte.

**Project Type**: Single-page application estática client-side (SPA sem bundler).

**Constraints**:
- Princípio I: Zero-Backend — nenhum dado de frequência cardíaca é transmitido para a internet.
- Princípio II: Simplicidade — um único artefato estático sem etapas de build obrigatórias.
- Princípio III: Segurança clínica e continuidade — se o sinal Bluetooth for perdido, o cronômetro não para e o campo de digitação manual é liberado instantaneamente.
- Princípio IV: Testabilidade numérica do parser de dados com valores fixados de teste.
- Princípio V: Interface em pt-BR e utilizável em tela de smartphone ao lado da esteira.

## Constitution Check

| Principle | Gate | Status |
|---|---|---|
| I. Zero-Backend & Privacidade | Leituras de FC permanecem restritas à memória do navegador; nenhuma chamada de rede/telemetria criada | PASS |
| II. Simplicidade — Um Único Artefato | Sem bundlers, sem npm build obrigatório, sem bibliotecas externas pesadas adicionadas | PASS |
| III. Segurança Clínica Antes de Tudo | Desconexão do cinto não interrompe o teste; fallback manual instantâneo; avisos claros de sinal perdido | PASS |
| IV. Precisão Numérica Testável | Função pura `parseHeartRateMeasurement` em `assets/calc.js` testada exaustivamente via `tests/calc.test.js` | PASS |
| V. Interface em pt-BR e Mobile-First | Botões de toque largo, status claros em português e compatibilidade com tela de celular na esteira | PASS |

Sem violações identificadas.

## Project Structure

### Documentation (this feature)

```text
specs/006-conexao-bluetooth-cinto/
├── spec.md                  # Especificação da feature
├── plan.md                  # Este plano de implementação
├── research.md              # Decisões técnicas e pesquisa de padrões GATT
├── data-model.md            # Modelo de dados e transições de estado
├── quickstart.md            # Guia de validação e testes
├── contracts/
│   └── bluetooth-hr.md      # Contrato do parser e ciclo de vida da UI
└── checklists/
    └── requirements.md      # Checklist de qualidade da especificação
```

### Source Code (repository root)

```text
index.html          # UI de pareamento (botão, badge de status, display de BPM pulsante ao vivo);
                    # Módulo client-side de orquestração Web Bluetooth;
                    # Auto-preenchimento nos estágios do teste incremental, triagem e tolerância.
assets/calc.js      # + parseHeartRateMeasurement(dataView) (função pura testável)
tests/calc.test.js  # + Casos de teste para decodificação UINT8, UINT16, flags de contato e tratamento defensivo
```

**Structure Decision**: Mantida a arquitetura do projeto — extensão direta dos três arquivos existentes sem adicionar dependências ou quebrar o fluxo estático.

## Complexity Tracking

Nenhuma violação de constitution — seção não aplicável.
