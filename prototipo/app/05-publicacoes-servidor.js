/* app/05-publicacoes-servidor.js · publicações com servidor.
   Parte do app.js: os arquivos de prototipo/app/ rodam juntos, na ordem dos números, no mesmo escopo
   (scripts/app/montar-app.mjs). */
/* Com API, as publicações vêm de /api/publicacoes no mesmo formato do community.js (as telas não mudam) e cada ação
   vira uma chamada ao servidor. Sem API, nada daqui roda: tudo fica no aparelho, como na demonstração.
   Ao vivo: o servidor avisa só o número da versão; o app busca de novo apenas se a versão mudou e se a tela de
   publicações estiver aberta (senão, quando ela abrir), com um atraso aleatório para os celulares não pedirem juntos. */
const PUB = { v: null, dono: null, buscando: null, deNovo: false, velho: false, timer: 0, em: 0 };
if (API) SOCIAL.usarServidor({ exemplos: DEMO });
/* /demo com servidor: as publicações e a mensagem de exemplo aparecem junto com as de verdade. Elas não existem no
   servidor, então curtir, salvar, comentar, denunciar e moderar nelas fica neste aparelho. */
const PUB_EXEMPLOS = 'etal-exemplos-demo';
const pubExemplo = (id) => DEMO && SOCIAL.seeds.some((p) => p.id === id);
function pubAlvoExemplo(alvo) {
  const [tipo, id] = String(alvo).split(':');
  return tipo === 'message' ? DEMO && SOCIAL.seedMessages.some((m) => m.id === id) : pubExemplo(id);
}
function pubExemplos() {
  try {
    return {
      likes: {},
      bookmarks: {},
      comments: {},
      moderation: {},
      ...JSON.parse(localStorage.getItem(PUB_EXEMPLOS)),
    };
  } catch (_) {
    return { likes: {}, bookmarks: {}, comments: {}, moderation: {} };
  }
}
function pubExemplosAplicar(v) {
  if (!DEMO || !v) return;
  const ex = pubExemplos();
  const me = String(D.person.id);
  for (const p of SOCIAL.seeds) {
    v.likes[p.id] = ex.likes[p.id] || [];
    v.comments[p.id] = ex.comments[p.id] || [];
  }
  v.bookmarks[me] = [...(v.bookmarks[me] || []).filter((id) => !pubExemplo(id)), ...(ex.bookmarks[me] || [])];
  for (const [alvo, m] of Object.entries(ex.moderation)) if (pubAlvoExemplo(alvo)) v.moderation[alvo] = m;
}
function pubExemplosMudar(change) {
  const ex = pubExemplos();
  change(ex, String(D.person.id));
  try {
    localStorage.setItem(PUB_EXEMPLOS, JSON.stringify(ex));
  } catch (_) {
    /* sem armazenamento: vale até recarregar */
  }
  pubExemplosAplicar(PUB.v);
  rerender();
}
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
  /* também confere com a tela aberta, caso um aviso ao vivo se perca: a cada 20 s, ou a cada 60 s sem conexão
     contínua (Vercel). Com a mesma versão, o servidor responde só "igual" */
  if (!PUB.v || PUB.velho || Date.now() - PUB.em > (window.ETAL_CONFIG?.vivo === 'consulta' ? 60000 : 20000)) {
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
      if (v.igual) {
        if (PUB.v && PUB.v.semCredencial !== v.semCredencial) {
          PUB.v.semCredencial = v.semCredencial;
          if (pubNaTela() && !pubDigitando() && !ov.classList.contains('open')) rerender();
        }
        return;
      }
      for (const p of v.posts) for (const img of p.images || []) img.src = API.url(img.src);
      let vistas = [];
      try {
        vistas = JSON.parse(localStorage.getItem(pubVistasKey())) || [];
      } catch (_) {
        /* sem armazenamento */
      }
      v.mentionSeen = { [String(D.person.id)]: vistas };
      pubExemplosAplicar(v);
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
  if (pubExemplo(id)) {
    pubExemplosMudar((ex) => (ex.likes[id] = pubAlternar(ex.likes[id] || [], me)));
    return;
  }
  if (PUB.v) PUB.v.likes[id] = pubAlternar(PUB.v.likes[id] || [], me);
  rerender();
  pubFazer(API.post(`/api/publicacoes/${encodeURIComponent(id)}/curtir`));
}
function pubSalvar(id) {
  const me = String(D.person.id);
  let salvou = false;
  if (pubExemplo(id)) {
    pubExemplosMudar((ex) => {
      salvou = !(ex.bookmarks[me] || []).includes(id);
      ex.bookmarks[me] = pubAlternar(ex.bookmarks[me] || [], id);
    });
    toast(salvou ? 'Publicação salva' : 'Removida dos salvos');
    return;
  }
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
  if (pubExemplo(id)) {
    pubExemplosMudar((ex) => (ex.moderation[SOCIAL.postKey(id)] = { hidden: true }));
    if (top().s === 'communityPost') navBack();
    toast('Publicação tirada do ar (fica no histórico da moderação)');
    return;
  }
  const r = await pubFazer(API.del(`/api/publicacoes/${encodeURIComponent(id)}`));
  if (!r) return;
  if (top().s === 'communityPost') navBack();
  else rerender();
  toast(r.resultado === 'oculta' ? 'Publicação tirada do ar (fica no histórico da moderação)' : 'Publicação excluída');
}
async function pubModerar(alvo, acao, nota) {
  if (pubAlvoExemplo(alvo)) {
    if (acao !== 'dismiss') pubExemplosMudar((ex) => (ex.moderation[alvo] = { hidden: acao === 'hide' }));
    toast('Revisão salva');
    return;
  }
  if (await pubFazer(API.post('/api/publicacoes/moderar', { alvo, acao, nota }))) {
    rerender();
    toast('Revisão salva');
  }
}
async function pubDenunciar(alvo, motivo, detalhe) {
  if (pubAlvoExemplo(alvo)) {
    closeOverlay(() => toast('Denúncia registrada para revisão'));
    return;
  }
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
  const mencoes = communityMentions(text).map((p) => p.id);
  if (kind === 'community-comment' && pubExemplo(postId)) {
    const novo = { ...communityAuthor(), id: SOCIAL.uid(), created: Date.now(), text, mentions: mencoes };
    pubExemplosMudar((ex) => (ex.comments[postId] = [...(ex.comments[postId] || []), novo]));
    return true;
  }
  pubEnviando = true;
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
