/* app/05-publicacoes-servidor.js · publicações com servidor.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
/* Com API, as publicações vêm de /api/publicacoes no mesmo formato do community.js (as telas não mudam) e cada ação
   vira uma chamada ao servidor. Sem API, nada daqui roda: tudo fica no aparelho, como na demonstração.
   Ao vivo: o servidor avisa só o número da versão; o app busca de novo apenas se a versão mudou e se a tela de
   publicações estiver aberta (senão, quando ela abrir), com um atraso aleatório para os celulares não pedirem juntos. */
const PUB = { v: null, dono: null, buscando: null, deNovo: false, velho: false, timer: 0, em: 0 };
if (API) SOCIAL.usarServidor();
const PUB_TELAS = ['communityPost', 'communityPerson', 'orgCommunity', 'communityCompose'];
const pubNaTela = () => S.auth && (S.tab === 'community' || PUB_TELAS.includes(top().s));
const pubVistasKey = () => `etal-mencoes-vistas:${D.person.id}`;
const pubVazio = () => ({
  versao: 0,
  posts: [],
  messages: [],
  comments: {},
  likes: {},
  bookmarks: {},
  reports: [],
  moderation: {},
  audit: [],
  mentionSeen: {},
});
/* o que a tela lê (communityRead): o último estado do servidor, e busca se ainda não tem ou se ficou velho */
function pubEstado() {
  if (PUB.dono !== D.person.id) {
    PUB.v = null;
    PUB.dono = D.person.id;
  }
  /* também confere a cada 20 s com a tela aberta (aviso ao vivo perdido, ou hospedagem sem conexão contínua);
     com a mesma versão, o servidor responde só "igual" */
  if (!PUB.v || PUB.velho || Date.now() - PUB.em > 20000) {
    PUB.velho = false;
    pubCarregar();
  }
  return PUB.v || pubVazio();
}
/* menções já vistas ficam no aparelho (não precisam ir ao servidor) */
function pubGuardarVistas() {
  try {
    localStorage.setItem(pubVistasKey(), JSON.stringify(PUB.v?.mentionSeen[String(D.person.id)] || []));
  } catch (_) {
    /* opcional */
  }
}
const pubDigitando = () => document.activeElement?.matches?.('textarea, input, select');
function pubCarregar() {
  if (!API || !S.auth) return Promise.resolve();
  if (PUB.buscando) {
    PUB.deNovo = true;
    return PUB.buscando;
  }
  PUB.em = Date.now();
  const versao = PUB.v ? `?versao=${PUB.v.versao}` : '';
  PUB.buscando = API.get('/api/publicacoes' + versao)
    .then((v) => {
      if (v.igual) return;
      for (const p of v.posts) for (const img of p.images || []) img.src = API.url(img.src);
      let vistas = [];
      try {
        vistas = JSON.parse(localStorage.getItem(pubVistasKey())) || [];
      } catch (_) {
        /* sem armazenamento */
      }
      v.mentionSeen = { [String(D.person.id)]: vistas };
      PUB.v = v;
      if (pubNaTela() && !pubDigitando() && !ov.classList.contains('open')) rerender();
    })
    .catch((e) => {
      if (pubNaTela()) toast(e.status ? e.message : 'Sem internet: as publicações aparecem quando a conexão voltar.');
    })
    .finally(() => {
      PUB.buscando = null;
      if (PUB.deNovo) {
        PUB.deNovo = false;
        pubCarregar();
      }
    });
  return PUB.buscando;
}
/* aviso ao vivo do servidor: { versao } */
function pubAviso(d) {
  if (!PUB.v || d.versao === PUB.v.versao) return;
  if (!pubNaTela()) {
    PUB.velho = true;
    return;
  }
  clearTimeout(PUB.timer);
  PUB.timer = setTimeout(pubCarregar, 500 + Math.random() * 2500);
}
/* uma ação no servidor: avisa o erro; depois busca o estado novo (a resposta do servidor é quem manda) */
async function pubFazer(promessa) {
  try {
    const r = await promessa;
    await pubCarregar();
    return r || true;
  } catch (e) {
    toast(e.message);
    await pubCarregar();
    return null;
  }
}
const pubIdDoAlvo = (alvo) => String(alvo).split(':').pop();
/* curtir e salvar mudam na hora na tela; se o servidor recusar, o estado volta na próxima busca */
function pubAlternar(lista, id) {
  return lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id];
}
function pubCurtir(id) {
  const me = String(D.person.id);
  if (PUB.v) PUB.v.likes[id] = pubAlternar(PUB.v.likes[id] || [], me);
  rerender();
  pubFazer(API.post(`/api/publicacoes/${encodeURIComponent(id)}/curtir`));
}
function pubSalvar(id) {
  const me = String(D.person.id);
  let salvou = false;
  if (PUB.v) {
    const antes = PUB.v.bookmarks[me] || [];
    salvou = !antes.includes(id);
    PUB.v.bookmarks[me] = pubAlternar(antes, id);
  }
  rerender();
  toast(salvou ? 'Publicação salva' : 'Removida dos salvos');
  pubFazer(API.post(`/api/publicacoes/${encodeURIComponent(id)}/salvar`));
}
async function pubApagar(id) {
  const r = await pubFazer(API.del(`/api/publicacoes/${encodeURIComponent(id)}`));
  if (!r) return;
  if (top().s === 'communityPost') navBack();
  else rerender();
  toast(r.resultado === 'oculta' ? 'Publicação tirada do ar (fica no histórico da moderação)' : 'Publicação excluída');
}
async function pubModerar(alvo, acao, nota) {
  if (await pubFazer(API.post('/api/publicacoes/moderar', { alvo, acao, nota }))) {
    rerender();
    toast('Revisão salva');
  }
}
async function pubDenunciar(alvo, motivo, detalhe) {
  const r = await pubFazer(
    API.post(`/api/publicacoes/${encodeURIComponent(pubIdDoAlvo(alvo))}/denunciar`, { motivo, detalhe }),
  );
  if (r)
    closeOverlay(() =>
      toast(
        r.oculta ? 'Denúncia enviada. O conteúdo saiu do ar até a revisão.' : 'Denúncia enviada para a organização',
      ),
    );
}
/* publicação, comentário ou mensagem; devolve true se o servidor aceitou */
let pubEnviando = false;
async function pubEnviar(kind, text, postId) {
  if (pubEnviando) return false;
  pubEnviando = true;
  const mencoes = communityMentions(text).map((p) => p.id);
  const botao = $('.page:not(.leaving) .compose-submit');
  if (botao) botao.disabled = true;
  try {
    const pedido =
      kind === 'community-post'
        ? API.post('/api/publicacoes', {
            texto: text,
            atividade: byId(communityDraft.activity)?.id || null,
            dia: byId(communityDraft.activity)?.day || +communityDraft.day || D.now.day,
            assunto: communityDraft.tag,
            mencoes,
            fotos: communityDraft.images.map((img) => ({ dados: img.src, alt: img.alt || '' })),
          })
        : kind === 'community-message'
          ? API.post('/api/publicacoes/mensagens', { texto: text, mencoes })
          : API.post(`/api/publicacoes/${encodeURIComponent(postId)}/comentarios`, { texto: text, mencoes });
    return !!(await pubFazer(pedido));
  } finally {
    pubEnviando = false;
    if (botao) botao.disabled = false;
  }
}
