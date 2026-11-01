# Implementation Plan: Restrição, PIN de Acesso e Aprovação de Professores

**Branch**: `010-permissao-cadastro-professor` | **Date**: 2026-11-01 | **Spec**: [specs/010-permissao-cadastro-professor/spec.md](spec.md)

**Input**: Feature specification from `/specs/010-permissao-cadastro-professor/spec.md`

## Summary

Implementar a restrição comercial de criação de contas de professores no RunLab através de um modelo híbrido: (1) envio de requisição de cadastro para o Firebase Firestore com dados de contato WhatsApp para aprovação pelo administrador/proprietário; (2) suporte a ativação instantânea caso o cliente informe um PIN/Código de Licença válido pré-gerado; (3) bloqueio de login para contas pendentes ou não autorizadas; (4) painel administrativo para o proprietário aprovar solicitações e emitir novos PINs de ativação.

## Technical Context

**Language/Version**: HTML5 + Vanilla JavaScript (ES2022+), Web Crypto API (`crypto.subtle.digest('SHA-256')`)  
**Primary Dependencies**: Tailwind CSS CDN, Firebase JS SDK v10 (Firestore) via CDN  
**Storage**: Cloud Firestore (projeto `teste-incremental-56aeb`) — coleções `professors` e `activation_codes`  
**Testing**: Node.js Test Runner nativo (`node --test tests/*.test.js`) e validação sintática (`vm.Script`)  
**Target Platform**: Navegadores Web modernos (Mobile-first para uso na esteira e Desktop para gestão)  
**Project Type**: Single static web artifact (Web App client-side estático)  
**Performance Goals**: Tempo de submissão de cadastro e feedback visual < 1s; ativação por PIN < 2s  
**Constraints**: Zero-backend server (serverless com Firestore direto no cliente); 100% em pt-BR; estrita conformidade com a Constituição v2.0.0  
**Scale/Scope**: Centenas de solicitações de professores e gestão ágil de licenças comerciais  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Princípio I (Persistência no Firebase Firestore & Privacidade)**: PASS. Todas as solicitações, contas de professores e códigos de ativação são gerenciados exclusivamente no Cloud Firestore do próprio projeto (`teste-incremental-56aeb`).
- **Princípio II (Simplicidade — Um Único Artefato Estático)**: PASS. Nenhuma etapa de build obrigatória ou servidor intermediário Node.js é introduzido. Todo o código roda em `index.html` e `assets/calc.js`.
- **Princípio III (Segurança Clínica Antes de Tudo)**: PASS. Nenhuma alteração nas fórmulas de triagem ou limiares de segurança cardiovascular.
- **Princípio IV (Precisão Numérica Testável)**: PASS. Funções puras de geração e validação de PINs e avaliação de acesso são cobertas por testes automatizados em `tests/calc.test.js`.
- **Princípio V (Interface em pt-BR e Uso em Campo)**: PASS. Interface 100% em português brasileiro, com botões amplos para fácil operação e atalhos para WhatsApp.

## Project Structure

### Documentation (this feature)

```text
specs/010-permissao-cadastro-professor/
├── spec.md              # Especificação de requisitos e histórias de usuário
├── checklists/
│   └── requirements.md  # Checklist de qualidade (16/16 aprovados)
├── research.md          # Decisões arquiteturais e modelo comercial
├── data-model.md        # Schemas Firestore de professors e activation_codes
├── contracts/
│   └── auth-approval-contract.md # Contratos de funções e regras de acesso
├── quickstart.md        # Guia passo a passo de validação
└── plan.md              # Este plano de implementação
```

### Source Code (repository root)

```text
teste_incremental_esteira/
├── index.html           # UI: Formulário de cadastro com WhatsApp e PIN, bloqueio de pendentes, Painel Admin
├── assets/
│   └── calc.js          # Lógica pura: generateActivationPin, validatePhone, evaluateProfessorAccess
├── firestore.rules      # Regras de segurança para professors (status pendente) e activation_codes
└── tests/
    └── calc.test.js     # Testes automatizados unitários para novas funções puras
```

**Structure Decision**: Repositório estático único mantendo a arquitetura modular com `assets/calc.js` para regras puras e `index.html` para UI e orquestração do Firebase.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| Nenhuma violação | N/A | N/A |

