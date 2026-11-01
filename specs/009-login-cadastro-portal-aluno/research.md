# Phase 0 Research: Sistema de Login (Professor e Aluno), Central Profissional de Alunos e Portal de Treinos na Esteira

**Feature**: `009-login-cadastro-portal-aluno`  
**Date**: 2026-11-01  
**Author**: Antigravity Assistant

## 1. Estratégia de Autenticação e Gestão de Sessão (Zero-Backend / Firebase Firestore)

### Decisão
Utilizar autenticação baseada em documentos no Firebase Firestore nas coleções `professors` e `athletes`, com derivação criptográfica de hash de senha no navegador através da **Web Crypto API nativa** (`crypto.subtle.digest('SHA-256', ...)`), associada a persistência de sessão em `localStorage` (`runlab_auth_session`).

### Racional
1. **Aderência à Constituição (Princípios I e II)**: O RunLab opera como um artefato estático único servido no Firebase Hosting, sem servidores Node/Express intermediários e sem bundlers. O Firebase SDK carregado via CDN conecta-se diretamente ao Firestore do projeto (`teste-incremental-56aeb`).
2. **Dois perfis de acesso distintos**:
   - **Professor / Avaliador**: Conta com e-mail/usuário único e senha forte (hash SHA-256). O professor tem acesso irrestrito ao painel de testes, execução na esteira, telemetria Bluetooth, cadastro de alunos e edição de avaliações.
   - **Aluno / Atleta**: Acesso simplificado e desburocratizado (Código de Acesso do Aluno, ex.: `CARLOS-731`, ou E-mail + PIN numérico de 4 a 6 dígitos). O aluno não precisa confirmar e-mail externo para entrar na academia e ver seu treino; o professor define ou gera o código/PIN na ficha do aluno e entrega a ele.
3. **Web Crypto API**: Presente nativamente em todos os navegadores modernos (desktop e mobile) sem necessidade de bibliotecas de terceiros como `bcrypt` ou `crypto-js`.
4. **Persistência de Sessão**: Ao fazer login, a sessão fica salva no `localStorage` com timestamp, perfil e dados cadastrais. Ao recarregar a página (F5), a sessão é restaurada sem desconectar o professor ou o aluno. O logout limpa a chave e retorna à tela inicial de login.

### Alternativas Consideradas
- **Firebase Auth (E-mail/Senha com Identity Platform)**: Exigiria configuração de provedor de Auth na console do Google Cloud, regras de claims customizadas para diferenciar professor de aluno, e obrigaria confirmações de e-mail que atrapalham o aluno no momento do teste na esteira. Rejeitado para v1.
- **Login sem senha para alunos (apenas nome)**: Muito inseguro, pois qualquer pessoa poderia digitar o nome de outro atleta e bisbilhotar suas avaliações de saúde. A combinação de `Código/Login + PIN` garante privacidade com excelente usabilidade.

---

## 2. Central Profissional de Busca e Cadastro Prévio de Alunos

### Decisão
Substituir a seção isolada de "Perfil do Aluno" da aba `1 · Aluno & Perfil` por um painel de comando profissional contendo:
1. **Barra de Busca em Tempo Real**: Filtragem instantânea por nome, e-mail ou código de acesso no Firestore (ou no cache local em memória dos alunos carregados).
2. **Card de Aluno Ativo / Histórico Rápido**: Ao selecionar um aluno, a tela exibe o resumo da sua última avaliação ($v\text{Pico}$, $VO_2\text{máx}$, data) com botões diretos: **"Iniciar Nova Avaliação"**, **"Ver Ficha e Treinos"** ou **"Editar Cadastro"**.
3. **Ficha Completa de Cadastro**: Formulário profissional com:
   - Dados de Acesso: `Nome Completo`, `Código de Acesso`, `PIN de Acesso`;
   - Dados Antropométricos: `Idade`, `Sexo`, `Peso (kg)`, `Altura (cm)`;
   - Dados de Condicionamento: `Nível`, `Objetivo Principal`, `FC Repouso (bpm)`, `FC Máxima conhecida (bpm)`;
   - Histórico Clínico: `Observações / Restrições`.

### Racional
Profissionais de educação física e fisiologia necessitam de um fluxo limpo: cadastrar o aluno na recepção ou selecionar o aluno antes de iniciar os testes. Se o aluno já existe, todos os dados fixos são preenchidos instantaneamente, evitando redigitação a cada reavaliação.

---

## 3. Algoritmo Determinístico de Prescrição de Treinos na Esteira (`assets/calc.js`)

### Decisão
Implementar e exportar a função pura `generateWorkoutPrescriptions(assessment)` em `assets/calc.js`, que converte os limiares fisiológicos ($v\text{Pico}$, VT1, RCP/VT2, $VO_2\text{máx}$, $t_{\text{lim}}$, FC máxima e FC repouso) em 6 modelos fundamentais de sessões de treino para esteira:

| ID | Nome do Treino | Zona Alvo | Velocidade na Esteira | BPM Alvo (%FCmáx ou FC Reserva) | Estrutura Típica na Esteira |
|---|---|---|---|---|---|
| `rec-z1` | **Regenerativo / Soltura** | Z1 | 55% a 65% de $v\text{Pico}$ | < 72% FCmáx (RPE 1-2) | 20 a 30 min contínuos na esteira |
| `base-z2` | **Rodagem Base Aeróbia** | Z2 | 65% a 75% de $v\text{Pico}$ (abaixo do VT1) | 72% a 82% FCmáx (RPE 3-4, Talk Test confortável) | 40 a 60 min contínuos |
| `tempo-z3` | **Tempo Run / Limiar** | Z3 | Entre VT1 e RCP (~78% a 88% de $v\text{Pico}$) | 82% a 88% FCmáx (RPE 5-6, respiração rítmica) | 10 min aquec. + 20-30 min no ritmo + 5 min volta à calma |
| `hiit-vo2-z4`| **Intervalado Longo $VO_2\text{máx}$**| Z4 | 95% a 100% de $v\text{Pico}$ | 90% a 95% FCmáx (RPE 7-8) | 10 min aquec. + 4 a 5x (3 min a $v\text{Pico}$ com 2 min trote a 50%) + desaquec. |
| `hiit-short` | **HIIT Curto na Esteira** | Z4/Z5 | 100% a 105% de $v\text{Pico}$ | Pico > 90% FCmáx | 10 min aquec. + 10x (1 min forte / 1 min trote) ou 12x (30s forte / 30s pausa) |
| `speed-z5` | **Tiros de Economia de Corrida**| Z5 | 105% a 115% de $v\text{Pico}$ | Não guiado por FC (esforço neuromusc.) | 12 min aquec. + 6 a 8x 45s com 2 min caminhada/pausa |

### Racional
Alunos que treinam na esteira precisam de instruções inequívocas: qual número digitar na esteira (`km/h`), qual pace isso representa (`min/km`) e qual faixa de frequência cardíaca verificar no relógio ou painel. A parametrização puramente baseada nos dados do teste elimina "achismos" do treino.

---

## 4. Ergonomia e Visualização Mobile-First no Portal do Aluno

### Decisão
Criar o Portal do Aluno com foco estrito em legibilidade em telas de smartphones:
- Números gigantes com fonte monoespaçada em destaque (`text-3xl font-extrabold`) para velocidade na esteira (`km/h`), facilitando a leitura pelo aluno enquanto se move na esteira.
- Badges coloridas de zonas (Z1 a Z5) consistentes com as cores já consagradas no RunLab (azul, verde, amarelo, laranja, vermelho).
- Visualizador com abas/filtros para alternar rapidamente entre "Treinos Contínuos", "Treinos de Ritmo/Limiar" e "Treinos Intervalados (Tiros)".
- Botão "👀 Ver como Aluno" no cabeçalho do professor para que o treinador mostre a tela diretamente ao aluno após o teste.

