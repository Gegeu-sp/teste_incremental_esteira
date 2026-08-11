# RunLab

Ferramenta client-side (sem backend) de triagem, teste incremental em esteira,
teste de tolerância, zonas de treino individuais e prescrição semanal para
corredores. Protocolo: estágios de 2 minutos, +1 km/h por estágio, inclinação
fixa em 1%.

Todos os dados ficam salvos apenas no `localStorage` do navegador do usuário —
nada é enviado a nenhum servidor. É uma ferramenta educacional e **não substitui
avaliação médica**.

## Rodar localmente

Não há build. Basta abrir `index.html` diretamente no navegador, ou servir a
raiz do repositório com qualquer servidor estático, por exemplo:

```bash
python3 -m http.server 8000
# ou
npx serve .
```

Depois acesse `http://localhost:8000/`.

## Publicar

Como é um site 100% estático, publique a raiz do repositório em qualquer
hospedagem estática (ex.: GitHub Pages, Firebase Hosting) — o ponto de
entrada é `index.html`.

### Firebase Hosting

Projeto Firebase: **`teste-incremental-56aeb`** ([console](https://console.firebase.google.com/project/teste-incremental-56aeb/overview)),
já referenciado em `.firebaserc`. `firebase.json` publica a raiz do repo
(`index.html` + `assets/`), ignorando `specs/`, `tests/`, `.specify/` etc.

**Deploy manual** (login interativo, via navegador):

```bash
npm install -g firebase-tools   # se ainda não tiver o CLI
firebase login
firebase deploy --only hosting
```

**Deploy automático (GitHub Actions)** — já configurado em
`.github/workflows/firebase-hosting-merge.yml` (deploy em push para `main`)
e `firebase-hosting-pull-request.yml` (preview em cada PR). Falta só
cadastrar a credencial, uma vez:

1. No [console do Firebase](https://console.firebase.google.com/project/teste-incremental-56aeb/settings/serviceaccounts/adminsdk),
   gere uma nova chave privada de service account (ou rode
   `firebase init hosting:github` localmente, que faz isso e já cria o
   secret no repo automaticamente).
2. No GitHub, vá em **Settings → Secrets and variables → Actions** deste
   repositório e crie o secret
   `FIREBASE_SERVICE_ACCOUNT_TESTE_INCREMENTAL_56AEB` com o conteúdo do
   JSON gerado.
3. A partir daí, todo push em `main` publica automaticamente e todo PR
   ganha uma URL de preview comentada automaticamente.

## Estrutura

- `index.html` — a aplicação (UI, estado, renderização).
- `assets/calc.js` — fórmulas fisiológicas puras (VO₂/METs, derivação de
  VT1/RCP, zonas de treino, diagnóstico, classificação de tolerância),
  carregadas pelo `index.html` via `<script>` e também usadas pelos testes.
- `protocolo` — fonte de verdade do protocolo original de teste incremental.
- `specs/` — especificação, plano e tarefas desta feature, seguindo o fluxo
  [Spec Kit](https://github.com/github/spec-kit) (`.specify/`).

## Testes

As fórmulas em `assets/calc.js` têm cobertura automatizada com o test runner
nativo do Node (≥ 18, sem dependências):

```bash
npm test
```
