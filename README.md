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

O repositório já traz `firebase.json` configurado (raiz do repo como pasta
pública, ignorando `specs/`, `tests/`, `.specify/` etc.). Passos (rodar
localmente — o login do Firebase é interativo, via navegador):

```bash
npm install -g firebase-tools   # se ainda não tiver o CLI
firebase login
firebase use --add              # escolha/crie o projeto no Firebase Console
                                 # e associe um alias (ex.: "default")
firebase deploy --only hosting
```

Se ainda não existe um projeto, crie um em
[console.firebase.google.com](https://console.firebase.google.com/) antes do
`firebase use --add`. O arquivo `.firebaserc` (gerado pelo `use --add`) é
local por padrão (está no `.gitignore`) — remova a entrada do `.gitignore`
se quiser versionar o projeto padrão do time.

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
