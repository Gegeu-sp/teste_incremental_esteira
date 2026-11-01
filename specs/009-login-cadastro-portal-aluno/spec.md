# Feature Specification: Sistema de Login (Professor e Aluno), Central Profissional de Cadastro/Busca de Alunos e Portal de Treinos do Aluno

**Feature Branch**: `009-login-cadastro-portal-aluno`

**Created**: 2026-11-01

**Status**: Ready for Planning

**Input**: User description: "criar uma interface para cadastra o aluno antes, nao apenas ter aquela tela inicial Perfil do Aluno, melhorar e deixar mais profissional ali mesmo posso procurar o aluno e cadastra. alem disso, criar uma dela de login e cadastro de professor e login do aluno para ele ver seus treinos de forma legivel e detalhado para ele treinar, que velocidade na esteira, bpm esperado, tipo de treino, pace,"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Central Profissional de Busca e Cadastro Prévio de Alunos na Tela Inicial do Professor (Priority: P1)

Ao acessar a área do professor, em vez de encontrar apenas um formulário simples e isolado de "Perfil do Aluno", o professor dispõe logo na tela inicial (`1 · Aluno & Perfil`) de uma **Central Profissional de Alunos**, onde pode pesquisar instantaneamente qualquer aluno já cadastrado ou cadastrar um novo aluno com ficha completa e credenciais de acesso antes de iniciar a triagem e o teste incremental.

**Why this priority**: O fluxo real de uma assessoria ou academia exige localizar rapidamente um aluno recorrente ou registrar formalmente um novo aluno na recepção/início da sessão, evitando duplicidade de cadastros e garantindo que todo teste incremental já nasça vinculado ao registro correto do aluno.

**Independent Test**: Pode ser testado de forma independente entrando como professor, pesquisando um aluno existente na barra de busca integrada da tela inicial para carregar sua ficha em um clique, ou preenchendo e salvando um novo cadastro de aluno (com nome, dados antropométricos/fisiológicos, objetivo e código/PIN de acesso) antes de avançar para a aba de Triagem.

**Acceptance Scenarios**:

1. **Given** que o professor está na aba inicial (`1 · Aluno & Perfil`), **When** ele digita parte do nome ou e-mail/identificador de um aluno na caixa de busca integrada, **Then** o sistema exibe imediatamente os alunos correspondentes com resumo da última avaliação (`vPico`, `VO₂máx`, data) e botões para **"Selecionar p/ Nova Avaliação"** ou **"Ver Último Resultado"**.
2. **Given** que o aluno ainda não possui cadastro, **When** o professor preenche a ficha profissional de cadastro na tela inicial (Nome completo, Identificador/E-mail ou Telefone, PIN/Senha de acesso do aluno, Idade, Sexo, Peso, Altura, Nível de treinamento, Objetivo principal, FC de repouso, FC máxima conhecida e Observações) e clica em **"Cadastrar e Selecionar Aluno"**, **Then** o aluno é salvo na nuvem, fica ativo no cabeçalho da sessão e seus dados fisiológicos já preenchem automaticamente os parâmetros do teste.
3. **Given** que um aluno já cadastrado foi selecionado na tela inicial, **When** o professor atualiza qualquer dado mutável da ficha (como Peso atual ou FC de repouso do dia) e clica em **"Atualizar Ficha / Ir para Triagem"**, **Then** o cadastro do aluno é atualizado e o fluxo avança para a etapa `2 · Triagem`.

---

### User Story 2 - Tela de Login e Cadastro de Professor e Login de Aluno (Priority: P1)

Ao abrir a aplicação, o usuário visualiza uma tela de boas-vindas e autenticação dividida claramente em dois perfis de acesso: **Sou Professor / Avaliador** (com opção de Login e de Criar Conta de Professor) e **Sou Aluno / Atleta** (com acesso direto via identificador/nome + código PIN ou senha cadastrada pelo professor).

**Why this priority**: Separa a visão clínica/operacional do avaliador (que conduz testes, gerencia todos os alunos e edita avaliações) da visão de consulta do aluno (que precisa apenas visualizar seus próprios resultados e treinos prescritos com segurança e simplicidade).

**Independent Test**: Pode ser testado criando uma conta de professor, fazendo login como professor, cadastrando um aluno com código/senha de acesso, encerrando a sessão (logout) e entrando na aba "Sou Aluno" com as credenciais desse aluno para verificar que apenas o Portal do Aluno é exibido.

**Acceptance Scenarios**:

1. **Given** um novo professor acessando a tela inicial de autenticação, **When** ele seleciona **"Sou Professor" → "Criar Conta"**, informa Nome profissional, E-mail/Usuário, CREF/Registro (opcional) e Senha, **Then** sua conta de professor é criada e sua sessão autenticada é iniciada no painel completo de avaliação.
2. **Given** um professor já cadastrado, **When** ele informa seu E-mail/Usuário e Senha na tela de login, **Then** ele acessa todas as abas de avaliação (`1 · Aluno & Perfil` a `7 · Atletas & Evolução`) e vê seu nome profissional identificado no topo com botão de **"Sair"**.
3. **Given** um aluno cadastrado pelo professor, **When** o aluno seleciona **"Sou Aluno"** na tela de login e informa seu identificador (Nome/E-mail/Código) e seu PIN/Senha de acesso, **Then** o sistema autentica o aluno e abre exclusivamente o **Portal de Treinos do Aluno**, ocultando os controles de execução de teste e os cadastros de outros atletas.
4. **Given** qualquer tentativa de login com credenciais inválidas (professor ou aluno), **When** o usuário submete o formulário, **Then** o sistema exibe uma mensagem clara em português informando que os dados de acesso não conferem, sem expor dados de outros usuários.

---

### User Story 3 - Portal do Aluno com Fichas de Treino Legíveis e Detalhadas para Esteira (Priority: P1)

Quando o aluno entra em seu portal (ou quando o professor clica em "Visualizar Visão do Aluno"), o sistema apresenta um painel de fácil leitura em tela de celular (pensado para uso em cima da esteira na academia), exibindo suas zonas de treinamento e fichas detalhadas de sessões de treino contendo: **Tipo de treino**, **Velocidade exata na esteira (`km/h`)**, **Pace equivalente (`min/km`)**, **BPM esperado (`bpm` e `%FCmáx`)**, **Percepção de esforço (RPE / Talk Test)** e **Estrutura passo a passo da sessão** (aquecimento, bloco principal / tiros com recuperação e desaquecimento).

**Why this priority**: Transforma os números fisiológicos do teste ($v\text{Pico}$, $VO_2\text{máx}$, VT1, RCP/VT2 e $t_{\text{lim}}$) em orientação prática imediata para o aluno saber exatamente qual velocidade digitar na esteira e qual batimento cardíaco manter em cada tipo de treino.

**Independent Test**: Pode ser testado fazendo login como um aluno que possui avaliação salva e verificando se os cards de treino mostram em fonte destacada a velocidade em `km/h`, o pace em `min/km`, a faixa de `bpm` esperada e o passo a passo de cada tipo de treino (Regenerativo, Base Aeróbia, Limiar/Tempo Run, Intervalado Curto/Longo de $VO_2\text{máx}$ e Repetições).

**Acceptance Scenarios**:

1. **Given** um aluno autenticado no Portal do Aluno com pelo menos uma avaliação concluída, **When** o portal é carregado, **Then** o aluno visualiza o resumo da sua avaliação mais recente ($v\text{Pico}$, $VO_2\text{máx}$, Pace de Pico, VT1 e VT2/RCP) e a tabela/cards das suas **5 Zonas de Treinamento (Z1 a Z5)** com velocidade (`km/h`), pace (`min/km`) e faixa de frequência cardíaca (`bpm`).
2. **Given** o aluno visualizando a seção **"Meus Treinos na Esteira"** no seu portal, **When** ele consulta ou filtra um tipo de treino (ex.: *Treino Contínuo Extensivo / Base Z2*, *Treino de Limiar / Tempo Run Z3*, *HIIT Longo $VO_2\text{máx}$ Z4*, *HIIT Curto 30s/30s ou 1min/1min*, *Treino Regenerativo Z1*), **Then** cada card de treino exibe de forma destacada e legível:
   - **Nome e Tipo do Treino** + objetivo fisiológico em linguagem simples;
   - **Velocidade na Esteira (`km/h`)** em destaque numérico grande (incluindo velocidade do estímulo e velocidade da recuperação ativa/passiva nos intervalados);
   - **Pace equivalente (`min/km`)**;
   - **BPM esperado (`bpm` mín–máx e `%FCmáx`)** + sensação esperada (Borg / Talk Test);
   - **Roteiro completo da sessão** (Aquecimento em minutos e `km/h` → Série Principal com número de repetições, duração e recuperação → Volta à calma em minutos e `km/h`).
3. **Given** um aluno cadastrado que ainda não realizou o teste incremental, **When** ele faz login no Portal do Aluno, **Then** o sistema exibe sua ficha cadastral e um aviso amigável informando que seus treinos personalizados com velocidade e BPM estarão disponíveis assim que o professor concluir sua primeira avaliação na esteira.

---

### Edge Cases

- **Cadastro de aluno com nome homônimo ou já existente**: Se o professor tentar cadastrar um novo aluno com o mesmo nome ou identificador de um aluno já existente, o sistema alerta e oferece carregar o cadastro existente ou prosseguir diferenciando o identificador/código de acesso.
- **Aluno sem avaliação concluída acessando o Portal do Aluno**: O portal não deve exibir valores `NaN`, `undefined` ou velocidades zeradas; deve mostrar o estado "Aguardando 1ª Avaliação" com os dados do perfil do aluno.
- **Teste incremental realizado sem `tlim` (Aba 3 opcional não executada)**: No Portal do Aluno, os treinos baseados em Zonas (Z1 a Z5 derivadas de $v\text{Pico}$ e FC) são gerados integralmente, e os intervalos de HIIT utilizam durações padrão seguras baseadas em $v\text{Pico}$ (ex.: tiros de `60s` a `180s` a 95–100% de $v\text{Pico}$) caso o `tlim` individual não tenha sido medido, ou usam as prescrições exatas de `tlim` quando disponíveis.
- **Persistência de sessão ao recarregar a página**: Se o professor ou o aluno atualizar o navegador acidentalmente, a sessão autenticada permanece ativa no dispositivo até que o usuário clique explicitamente em **"Sair"**, sem perder dados em andamento.
- **Acesso rápido do Professor à Visão do Aluno**: O professor autenticado pode pré-visualizar a tela exata de treinos do aluno selecionado ("Ver como Aluno") sem precisar encerrar sua sessão de professor.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE apresentar uma tela de autenticação com suporte a dois perfis de usuário: **Professor (Avaliador)** e **Aluno (Atleta)**, mantendo a sessão ativa no navegador até o logout explícito.
- **FR-002**: O sistema DEVE permitir o **Cadastro e Login de Professor** (Nome profissional, E-mail/Login, CREF opcional e Senha) persistido no banco de dados em nuvem do projeto.
- **FR-003**: O sistema DEVE transformar a aba inicial `1 · Aluno & Perfil` do ambiente do professor em uma **Central Profissional de Busca e Cadastro de Alunos**, permitindo buscar alunos existentes em tempo real ou cadastrar um novo aluno antes de iniciar a triagem e o teste.
- **FR-004**: O cadastro de aluno realizado pelo professor DEVE incluir: Nome completo (obrigatório), Código/Identificador de acesso e PIN/Senha do aluno (gerado automaticamente ou definido pelo professor), Idade, Sexo, Peso (`kg`), Altura (`cm`), Nível de aptidão, Objetivo principal, FC de repouso (`bpm`), FC máxima conhecida (opcional) e Observações clínicas/esportivas.
- **FR-005**: Ao selecionar um aluno existente ou concluir o cadastro de um novo aluno na aba inicial, o sistema DEVE vincular automaticamente o aluno ativo à sessão de avaliação atual e preencher os campos de cálculo fisiológico (idade, sexo, peso, nível, FC de repouso, velocidade inicial sugerida).
- **FR-006**: O sistema DEVE permitir o **Login do Aluno** utilizando o identificador (Nome/E-mail/Código de acesso) e o PIN/Senha definidos em seu cadastro, direcionando-o exclusivamente ao **Portal do Aluno**.
- **FR-007**: O **Portal do Aluno** DEVE apresentar em layout legível e responsivo (mobile-first para leitura na esteira) um painel com os indicadores da avaliação vigente ($v\text{Pico}$, Pace de Pico, $VO_2\text{máx}$, METs, VT1, RCP/VT2) e a tabela/cartões das 5 Zonas de Treino (Z1 a Z5).
- **FR-008**: O **Portal do Aluno** DEVE gerar e exibir fichas detalhadas de sessões de treino para esteira baseadas na avaliação do aluno (cobrindo Treino Regenerativo Z1, Base Aeróbia Contínua Z2, Tempo Run / Limiar Z3, Intervalado Longo $VO_2\text{máx}$ Z4, Intervalado Curto HIIT e Tiros de Velocidade Z5), exibindo obrigatoriamente em cada ficha:
  1. **Tipo e Nome do Treino** + objetivo da sessão;
  2. **Velocidade na Esteira (`km/h`)** para cada fase da sessão (aquecimento, série principal/estímulo, recuperação e volta à calma);
  3. **Pace equivalente (`min/km`)**;
  4. **BPM esperado** (faixa de frequência cardíaca alvo em `bpm` e `%FCmáx`) e percepção subjetiva de esforço (RPE);
  5. **Estrutura detalhada de execução** (tempos, número de repetições e pausas).
- **FR-009**: Se o aluno possuir mais de uma avaliação salva no histórico, o Portal do Aluno DEVE carregar por padrão a avaliação mais recente e permitir alternar para visualizar avaliações anteriores e o resumo da sua evolução.
- **FR-010**: O ambiente do professor DEVE oferecer um botão **"Visualizar Treinos do Aluno"** para abrir e conferir exatamente a visão detalhada de treinos que o aluno selecionado enxerga em seu portal.

### Key Entities *(include if feature involves data)*

- **Conta de Professor (`ProfessorAccount`)**: Representa o profissional avaliador/treinador com identificador único, nome profissional, e-mail/login, registro profissional (CREF opcional), credencial de autenticação e data de criação.
- **Cadastro Profissional do Aluno (`AthleteProfile`)**: Evolução do documento de atleta no banco de dados contendo dados pessoais e antropométricos (nome, idade, sexo, peso, altura, nível, objetivo, FC repouso, FC máx conhecida, observações), credenciais de acesso ao Portal do Aluno (`accessCode` / login e `pin` / senha), vínculo opcional com o professor responsável e lista histórica de avaliações (`assessments`).
- **Ficha de Treino Detalhada (`WorkoutPrescriptionCard`)**: Estrutura derivada deterministicamente dos resultados fisiológicos do aluno ($v\text{Pico}$, FC máxima, FC de repouso, zonas Z1–Z5 e $t_{\text{lim}}$ quando disponível), contendo título, categoria/zona, objetivo, velocidade principal na esteira (`km/h`), velocidade de recuperação (`km/h`), pace principal (`min/km`), faixa de BPM esperada (`hrMin`–`hrMax`), RPE alvo e etapas estruturadas (Aquecimento, Bloco Principal e Volta à Calma).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O professor consegue localizar um aluno já cadastrado ou concluir o cadastro completo de um novo aluno na tela inicial em menos de 45 segundos antes de iniciar a triagem.
- **SC-002**: 100% dos alunos autenticados com avaliação concluída visualizam em seu portal pelo menos 5 fichas completas de sessões de treino contendo simultaneamente: tipo de treino, velocidade na esteira (`km/h`), pace (`min/km`), faixa de BPM esperado (`bpm`) e roteiro de aquecimento/série principal/volta à calma.
- **SC-003**: Os valores de velocidade (`km/h`), pace (`min/km`) e frequência cardíaca (`bpm`) exibidos nas fichas do Portal do Aluno têm 100% de correspondência matemática com as zonas e limiares calculados para a avaliação selecionada, validados por testes automatizados.
- **SC-004**: Um aluno logado no Portal do Aluno possui 0% de acesso a cadastros de outros alunos ou aos controles exclusivos do professor para alterar ou excluir avaliações.

## Assumptions

- O acesso tanto do professor quanto do aluno utiliza a infraestrutura em nuvem já estabelecida no projeto, mantendo a aplicação como um artefato web estático sem necessidade de servidores intermediários próprios.
- Para facilitar o acesso prático do aluno na academia sem depender de confirmação de e-mail externo, cada aluno cadastrado recebe um Código/Identificador de acesso e um PIN/Senha simples (ex.: 4 a 8 caracteres definido pelo professor no momento do cadastro e visível na ficha do aluno para o professor compartilhar com ele).
- A geração das fichas detalhadas de treino do aluno é realizada por funções puras e determinísticas a partir de $v\text{Pico}$, FC máxima/reserva, zonas Z1–Z5 e (quando disponível) $t_{\text{lim}}$.

