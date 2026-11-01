<!--
Sync Impact Report
- Version change: 1.0.0 → 2.0.0 (MAJOR: adoção de persistência em nuvem via Firebase Firestore do próprio projeto)
- Modified principles: Princípio I atualizado de "Zero-Backend" para "Persistência em Nuvem via Firebase Firestore & Privacidade dos Dados"; Restrições Técnicas atualizadas para permitir SDK do Firebase via CDN
- Added sections: none
- Removed sections: none
-->
# RunLab Constitution

## Core Principles

### I. Persistência em Nuvem via Firebase Firestore & Privacidade dos Dados
O RunLab opera como uma aplicação web estática conectada diretamente ao banco de dados em nuvem **Firebase Firestore** do próprio projeto (`teste-incremental-56aeb`) para armazenamento do cadastro de atletas e do histórico de avaliações, permitindo acesso e comparação longitudinal a partir de qualquer dispositivo autorizado. Nenhum dado de telemetria bruta em tempo real (fluxo segundo a segundo do cinto Bluetooth) ou analytics de terceiros MUST ser enviado a serviços externos; apenas os perfis e avaliações consolidadas dos atletas são persistidos no Firestore do projeto (com opção explícita de exclusão).

### II. Simplicidade — Um Único Artefato Estático
A aplicação MUST permanecer distribuível como HTML/CSS/JS estático, sem etapa de build obrigatória para rodar (abrir o arquivo ou servir via qualquer servidor estático deve funcionar). Dependências externas (fontes, Tailwind CDN, Firebase JS SDK via CDN) são aceitáveis apenas como `<link>`/`<script>` carregados via CDN — nunca como dependência de bundler. Ferramentas de build/teste (ex.: para testes automatizados) podem existir no repositório, mas não podem ser pré-requisito para servir a aplicação em produção.

### III. Segurança Clínica Antes de Tudo (NÃO NEGOCIÁVEL)
Toda lógica de triagem, contraindicação, sinais de alerta e classificação de risco cardiovascular MUST ser conservadora: na dúvida, o sistema recomenda encaminhamento médico em vez de liberar o teste. A aplicação MUST exibir, de forma permanente e visível, que é uma ferramenta educacional e não substitui avaliação médica. Mudanças nos limiares clínicos (PA, sinais/sintomas, critérios de liberação) exigem revisão explícita e justificativa registrada no PR/commit — não podem ser alteradas incidentalmente junto de outras refatorações.

### IV. Precisão Numérica Testável
Toda fórmula fisiológica (VO₂ a partir da velocidade, METs, velocidade de pico por estágio completo, FC máxima estimada, zonas de treino, tempo-limite, diagnóstico de aptidão, comparativo de evolução entre testes) MUST ter cobertura de teste automatizado que fixe os valores esperados para entradas conhecidas. Mudanças em qualquer fórmula MUST vir acompanhadas de atualização dos testes correspondentes no mesmo commit. Regressões numéricas silenciosas são tratadas como bugs de prioridade alta.

### V. Interface em pt-BR e Uso em Campo (Mobile-First durante o teste)
A interface MUST permanecer em português brasileiro, pois é a língua de trabalho do profissional e do aluno durante a avaliação. As telas usadas durante a execução do teste (cronômetro de estágio, registro de FC/RPE/Talk Test, teste de tolerância) MUST permanecer utilizáveis em tela de celular com uma mão, já que são operadas ao lado da esteira.

## Restrições Técnicas

- Stack: HTML5 + CSS (Tailwind via CDN) + JavaScript vanilla (sem framework SPA) + Firebase Firestore SDK via CDN.
- Persistência de atletas e avaliações exclusivamente no Firebase Firestore do projeto (`teste-incremental-56aeb`), mantendo estado de rascunho em memória/sessão durante a execução do teste na esteira.
- O ponto de entrada da aplicação MUST ser um arquivo `index.html` na raiz (ou em um diretório de publicação claramente documentado), para permitir hospedagem trivial em Firebase Hosting ou qualquer servidor estático.
- Testes automatizados rodam em Node.js e não alteram o comportamento do artefato estático em produção.

## Fluxo de Desenvolvimento

- Funcionalidades novas ou mudanças de comportamento clínico/numérico passam pelo fluxo Spec Kit: `/speckit-specify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`.
- Correções triviais de texto/estilo não exigem o fluxo completo, mas não podem alterar fórmulas ou critérios de triagem.
- Antes de reportar uma mudança de UI como concluída, ela MUST ser verificada abrindo a aplicação em um navegador (não apenas revisão de código).

## Governance

Esta constitution tem precedência sobre convenções informais do repositório.
Emendas exigem: (1) descrição da mudança e motivação, (2) atualização de versão seguindo semver (MAJOR = remoção/redefinição incompatível de princípio; MINOR = novo princípio ou seção; PATCH = clarificação de texto), (3) atualização da data de "Last Amended". Toda revisão de código relevante MUST verificar aderência aos princípios I–V acima; complexidade adicional (novas dependências, build steps) exige justificativa explícita registrada no PR.

**Version**: 2.0.0 | **Ratified**: 2026-08-11 | **Last Amended**: 2026-11-01
