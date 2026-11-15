# Protótipo: como o código está organizado

O app é HTML, CSS e JavaScript puro, sem framework e sem build obrigatório: abre direto no navegador.

## Telas e lógica (`app/`)

O código do app fica em partes por assunto, numeradas na ordem em que rodam:

| Partes | Assunto |
|---|---|
| `00` a `04` | base (dados, utilitários, ícones), personalização, estado, planta em SVG, registro de telas |
| `05` a `08` | publicações, entrada pelo crachá, início e agenda, atividade |
| `09` a `17` | mapa e tela grande, colmeia, céu, campus ao vivo, preferências, perfil, organização, crachá, campeonatos |
| `18` a `24` | sobreposições, navegação, lembretes, PWA, campus, busca, leitor de QR |
| `25-acoes*` | o despachante de cliques e as ações de cada assunto |
| `26` a `29` | formulários e toque, painel do computador, servidor (API e ao vivo), início do app |

As partes rodam **no mesmo escopo**: `scripts/app/montar-app.mjs` junta todas no `app.js` (que é gerado e não deve
ser editado). Por isso uma função de uma parte enxerga as das outras, como antes da divisão.

- `npm run app` monta o `app.js` e o `app.css`. O servidor local (`server.py`) monta sozinho quando uma parte muda, e
  o `npm run pwa`, a exportação e o build da Vercel também.
- O ESLint analisa o `app.js` montado; os avisos mostram a parte pelo marcador `/* ===== app/NN-….js ===== */`.

### Ações

Botões e links do app têm `data-act="nome"`. Um único despachante de cliques (`25-acoes.js`) chama `ACOES[nome]`, e
cada assunto registra as suas ações no seu arquivo (`25-acoes-mapa.js`, `25-acoes-comunidade.js`…):

```js
ACOES['filter'] = (el, e, a) => {
  S.agendaFilter = el.dataset.f;
  rerender();
};
```

Para criar uma ação nova: pôr `data-act` no HTML da tela e registrar a função no arquivo do assunto.

## Estilos (`estilos/`)

O `app.css` é montado das partes de `estilos/`, também na ordem dos números. No CSS a ordem decide qual regra vale:
as partes mais novas refinam as anteriores, e por isso os trechos de um mesmo assunto ainda aparecem em mais de uma
parte. Ao mudar um estilo, procure a regra pelo seletor em todas as partes.

## Outros arquivos

| Arquivo | Papel |
|---|---|
| `index.html` | Página do app (carrega os dados, o mapa clássico, as publicações e o app) |
| `data.js` | Programação, pessoas e campeonatos de exemplo |
| `community.js`, `community.css` | Publicações: dados, armazenamento local e moderação (também usados pelo painel) |
| `campus3d.js` | Mapa clássico em Canvas: miniatura da sala, minutos a pé e mapa quando o 3D não está disponível |
| `campus-*.js`, `plan-data.js`, `sprites.js` | Dados gerados do campus e da planta |
| `api.js`, `config.js` | Cliente da API e escolha do modo (sem API = dados de exemplo) |
| `admin.*` | Painel da organização no computador |
| `server.py`, `rodar.sh` | Servidor local, login de simulação no SUAP e modo HTTPS para o celular |
| `sw.js`, `manifest.webmanifest` | App instalável e uso sem internet |
| `tests/` | Testes das publicações e das telas no navegador |
