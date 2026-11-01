# Implementation Plan: Isolamento de Conexão e Fidedignidade das Leituras Bluetooth de FC

**Branch**: `specs/007-estabilidade-fidedignidade-bluetooth` | **Date**: 2026-11-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/007-estabilidade-fidedignidade-bluetooth/spec.md`

## Summary

Aprimora a integração Bluetooth de frequência cardíaca do RunLab para operar com segurança clínica e alta fidedignidade em ambientes compartilhados (academias, estúdios e laboratórios). Introduz:
1. **Isolamento e Trava de Sessão (`DeviceSessionLock`)**: filtragem rigorosa na descoberta inicial, validação imediata do serviço GATT `0x180D` (desconectando periféricos incompatíveis selecionados por engano) e reconexão automática silenciosa com backoff restrita exclusivamente ao `device.id` já vinculado na sessão do aluno.
2. **Filtro Fisiológico e Estabilização Estatística (`assets/calc.js`)**: funções puras determinísticas (`evaluateHrSample`, `computeStableStageHr`, `assessBtSignalQuality`) que descartam pacotes sem contato com a pele (`contactDetected === false`), filtram picos/quedas espúrias isoladas (`> 25 bpm` em `< 5s`) preservando transições fisiológicas reais sustentadas, e calculam a FC de fechamento de estágio pela **média aparada/mediana das leituras válidas dos últimos 15 segundos** em vez de uma amostra única instantânea.
3. **Diagnóstico Visual de Qualidade do Sinal (`index.html`)**: indicador ao vivo de confiabilidade (`Sinal fidedigno`, `Mau contato`, `Filtro ativo`, `Reconectando…`) e proteção contra preenchimento automático com dados expirados ou ruidosos.

## Technical Context

**Language/Version**: HTML5 / CSS3 (Tailwind via CDN) / JavaScript vanilla (ES2020+); testes automatizados com runner nativo de Node.js (`node --test`).

**Primary Dependencies**: Nenhuma dependência externa adicionada. Uso exclusivo da Web Bluetooth API nativa (`navigator.bluetooth`) e JavaScript padrão.

**Storage**: Memória volátil da sessão para o buffer deslizante de amostras de FC (`RollingHrWindow`) e vínculo do dispositivo (`DeviceSessionLock`), mantendo `localStorage` (`runlab_state_v2`) inalterado para os dados da avaliação.

**Testing**: `node --test tests/*.test.js` cobrindo todas as funções puras de filtragem de sinal, rejeição de spikes, confirmação de transição fisiológica, cálculo de média aparada de estágio e diagnóstico de qualidade do sinal.

**Target Platform**: Navegadores compatíveis com Web Bluetooth (Google Chrome / Microsoft Edge em Desktop e Android; Bluefy no iOS), mantendo fallback manual 100% funcional nos demais navegadores.

**Project Type**: Single-page application estática client-side (SPA sem bundler).

**Performance Goals**: Processamento de cada pacote GATT em `< 1 ms` (`O(N)` sobre janela máxima de ~20 amostras), atualização fluida de UI a 1 Hz e reconexão automática iniciada em `< 1 s` após queda involuntária.

**Constraints**:
- Princípio I: Zero-Backend — nenhum identificador de dispositivo ou leitura de FC sai do navegador.
- Princípio II: Simplicidade — único artefato estático (`index.html` + `assets/calc.js`) sem etapa de build.
- Princípio III: Segurança Clínica — nunca registrar automaticamente leituras sem contato, expiradas ou corrompidas por ruído; reconectar somente ao sensor travado na sessão.
- Princípio IV: Precisão Numérica Testável — algoritmos de filtragem e estabilização 100% cobertos por testes unitários determinísticos em Node.js.
- Princípio V: Interface em pt-BR e Mobile-First — diagnóstico claro e controles operáveis com uma mão ao lado da esteira.

**Scale/Scope**: Extensão focada nos 3 arquivos centrais do repositório (`assets/calc.js`, `index.html`, `tests/calc.test.js`), adicionando ~120 linhas de lógica pura e ~100 linhas de testes automatizados.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Gate | Pre-Research | Post-Design |
|---|---|---|---|
| I. Zero-Backend & Privacidade | Nenhum dado de dispositivo BLE ou série temporal de FC é enviado à rede; processamento 100% em memória local | PASS | PASS |
| II. Simplicidade — Um Único Artefato | Zero bundlers ou pacotes npm de produção; aplicação segue abrindo diretamente via `index.html` | PASS | PASS |
| III. Segurança Clínica Antes de Tudo | Prevenção de colisão com sensores de terceiros, rejeição de mau contato/artefatos e bloqueio de auto-fill quando o sinal não é confiável | PASS | PASS |
| IV. Precisão Numérica Testável | Funções puras `evaluateHrSample`, `computeStableStageHr` e `assessBtSignalQuality` isoladas em `assets/calc.js` e testadas em `tests/calc.test.js` | PASS | PASS |
| V. Interface em pt-BR e Mobile-First | Rótulos de qualidade do sinal em português claro e botões de ação rápida adaptados para uso em campo | PASS | PASS |

Sem violações identificadas.

## Project Structure

### Documentation (this feature)

```text
specs/007-estabilidade-fidedignidade-bluetooth/
├── spec.md                                  # Especificação da feature
├── plan.md                                  # Este plano técnico de implementação
├── research.md                              # Phase 0: Pesquisa e decisões técnicas
├── data-model.md                            # Phase 1: Entidades, janelas deslizantes e estados
├── quickstart.md                            # Phase 1: Guia de execução e validação
├── contracts/
│   └── bluetooth-signal-quality.md          # Phase 1: Contratos das funções puras e UI
└── checklists/
    └── requirements.md                      # Checklist de qualidade da especificação
```

### Source Code (repository root)

```text
index.html          # Orquestração Web Bluetooth com trava de sessão (boundDeviceId),
                    # reconexão automática com backoff ao mesmo sensor, janela deslizante
                    # de amostras, badge de qualidade do sinal e uso de stageHr() estabilizado.
assets/calc.js      # + evaluateHrSample(sample, recentValidSamples, pendingSpikes, options)
                    # + computeStableStageHr(validSamples, nowMs, options)
                    # + assessBtSignalQuality(ctx, nowMs, options)
tests/calc.test.js  # + Testes unitários cobrindo rejeição de mau contato, filtro de spikes,
                    #   transição fisiológica sustentada, média aparada de estágio e qualidade.
```

**Structure Decision**: Mantida a arquitetura enxuta do RunLab — funções matemáticas/estatísticas puras em `assets/calc.js` (testadas via `tests/calc.test.js`) e integração de hardware/UI em `index.html`.

## Complexity Tracking

Nenhuma violação da Constitution — seção não aplicável.
