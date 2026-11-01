# Implementation Plan: Sistema de Login (Professor e Aluno), Central Profissional de Alunos e Portal de Treinos na Esteira

**Branch**: `specs/009-login-cadastro-portal-aluno` | **Date**: 2026-11-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/009-login-cadastro-portal-aluno/spec.md`

## Summary

Esta feature eleva o RunLab ao nível de uma plataforma profissional completa de avaliação e prescrição de corrida:
1. **Sistema de Autenticação Dupla (Professor e Aluno)**:
   - Tela de recepção elegante com separação clara entre "Sou Professor" (login e criação de conta de avaliador com e-mail/senha) e "Sou Aluno" (acesso direto via código/nome + PIN de 4 dígitos cadastrado pelo professor).
   - Gerenciamento de sessão persistente no `localStorage` com suporte a logout explícito.
2. **Central Profissional de Busca e Cadastro Prévio de Alunos (`1 · Aluno & Perfil`)**:
   - Transforma a tela inicial em um centro de operações: busca em tempo real de alunos por nome, código ou e-mail com 1 clique para nova avaliação ou visualização de ficha, além de formulário completo de cadastro prévio (antropometria, objetivos, nível, FC repouso/máx, credenciais de acesso e observações clínicas).
3. **Portal do Aluno ("Meus Treinos na Esteira")**:
   - Visualizador responsivo mobile-first de alta legibilidade para uso no smartphone ao lado ou em cima da esteira: exibe resumo dos testes, as 5 Zonas de Treino (Z1 a Z5) e 6 cards detalhados de sessões de treino com **velocidade exata na esteira (`km/h`)**, **pace (`min/km`)**, **BPM alvo (`bpm` e `%FCmáx`)** e passo a passo estruturado de aquecimento, bloco principal e volta à calma.
4. **Modo "Ver como Aluno" para o Professor**:
   - Permite ao professor alternar instantaneamente para a visão do aluno e conferir a prescrição sem precisar desconectar sua conta.

---

## Technical Context

**Language/Version**: HTML5 / CSS3 (Tailwind CSS via CDN) / JavaScript vanilla (ES2020+) client-side; testes unitários em Node.js com o test runner nativo (`node --test`).

**Primary Dependencies**:
- Firebase App & Cloud Firestore compat SDK v10.14.1 via CDN oficial (`gstatic.com`).
- Web Crypto API nativa do navegador (`crypto.subtle.digest('SHA-256', ...)`) para derivação de hash de senhas de professores sem bibliotecas externas.

**Storage**:
- **Firebase Firestore** (projeto `teste-incremental-56aeb`):
  - Coleção `professors`: contas de professores avaliadores (`name`, `emailLower`, `cref`, `passwordHash`, `createdAt`).
  - Coleção `athletes`: perfis enriquecidos com credenciais (`accessCode`, `pin`, `professorId`, `heightCm`, `goal`, `clinicalNotes`) e histórico de avaliações.
- **`localStorage`**: persistência da sessão ativa (`runlab_auth_session`).

**Testing**:
- Testes unitários em `tests/calc.test.js` cobrindo `generateWorkoutPrescriptions` (todas as 6 categorias de treino, velocidades, paces, faixas de FC e passos de execução), `generateStudentAccessCode` e integridade das fórmulas.

**Target Platform**: Qualquer navegador moderno desktop e mobile (Chrome, Safari, Firefox, Edge).

**Project Type**: Single-Page Web Application estática servida via Firebase Hosting e integrada ao Cloud Firestore.

**Performance Goals**:
- Autenticação e restauração de sessão em `< 300 ms`.
- Busca e filtragem em tempo real de alunos em `< 50 ms`.
- Geração instantânea de treinos determinísticos (`< 5 ms`).

**Constraints**:
- **Princípio I (Constitution v2.0.0)**: Dados salvos exclusivamente no Firestore do projeto (`teste-incremental-56aeb`), sem dependência de serviços externos proprietários.
- **Princípio II**: Arquitetura de artefato único estático (`index.html` + `assets/calc.js`), sem etapas de build obrigatórias.
- **Princípio III**: Segurança clínica assegurada — o Portal do Aluno opera em modo somente-leitura com alertas educacionais visíveis.
- **Princípio IV**: Todas as fórmulas de treino e conversões de velocidade/pace rigorosamente testadas em `tests/calc.test.js`.
- **Princípio V**: Interface 100% em pt-BR e mobile-first.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Gate Requirement | Pre-Research | Post-Design |
|---|---|---|---|
| I. Persistência em Nuvem via Firestore | Contas de professores e dados de alunos persistidos no Firestore (`teste-incremental-56aeb`) | PASS | PASS |
| II. Simplicidade — Um Único Artefato | Sem bundlers; Firebase SDK e Web Crypto nativos | PASS | PASS |
| III. Segurança Clínica Antes de Tudo | Triagem e restrições clínicas preservadas; aluno em modo consulta segura | PASS | PASS |
| IV. Precisão Numérica Testável | `generateWorkoutPrescriptions` e paces testados com 100% de cobertura | PASS | PASS |
| V. Interface em pt-BR e Mobile-First | Fichas de treino com números grandes para leitura rápida na esteira | PASS | PASS |

---

## Project Structure

### Documentation (this feature)

```text
specs/009-login-cadastro-portal-aluno/
├── spec.md                                      # Especificação funcional completa
├── plan.md                                      # Este plano técnico de implementação
├── research.md                                  # Phase 0: Pesquisa de autenticação, prescrição e mobile UX
├── data-model.md                                # Phase 1: Modelos de dados do Firestore, sessão e treinos
├── quickstart.md                                # Phase 1: Roteiro de validação automatizada e manual
├── contracts/
│   └── auth-portal-prescriptions.md             # Phase 1: Contratos de funções puras e operações Firestore
└── checklists/
    └── requirements.md                          # Checklist de qualidade da especificação (16/16 PASS)
```

### Source Code (repository root)

```text
index.html          # - Tela inicial de Autenticação (#view-auth: Sou Professor / Sou Aluno);
                    # - Header superior com identificação do usuário, logout e alternância de visão;
                    # - Central Profissional de Alunos em 1 · Aluno & Perfil (#tab-perfil);
                    # - Tela dedicada do Portal do Aluno (#view-portal-aluno);
                    # - Módulos ProfessorAuthDB e AthleteCloudDB (autenticação e sessões).
assets/calc.js      # + generateWorkoutPrescriptions(assessment)
                    # + generateStudentAccessCode(studentName, salt)
                    # + formatPace(speedKmh)
tests/calc.test.js  # + Testes unitários para prescrições de esteira e códigos de acesso
firestore.rules     # Regras de segurança para coleções 'professors' e 'athletes'
firebase.json       # Configurações de Hosting e Firestore Rules
```

**Structure Decision**: Preserva a arquitetura canônica do projeto RunLab (HTML estático único + módulo de cálculos JS compartilhado + testes nativos Node.js).

---

## Complexity Tracking

Nenhuma violação aos princípios da Constitution v2.0.0.

