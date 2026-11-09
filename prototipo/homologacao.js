/* Página de homologação: entrada de teste, atalhos e os QRs assinados pelo servidor. */
(() => {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const API = window.ETAL_API;
  const say = (el, text, ok) => { el.textContent = text; el.className = `msg ${ok ? 'ok' : 'err'}`; };
  if (!API) { $('#sem-api').hidden = false; $('#entrar').hidden = true; return; }

  async function me() {
    try {
      const j = await API.get('/api/eu');
      $('#me').innerHTML = `Você está como <b>${esc(j.person.name)}</b>${j.person.org ? ' (organização)' : ''}. Presenças: ${Object.keys(j.present).length}. ${j.person.credentialedAt ? 'Credenciado.' : 'Ainda sem credenciamento.'}`;
      return j;
    } catch (_) { $('#me').textContent = 'Você ainda não entrou.'; return null; }
  }
  $('#fdev').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    try {
      await API.post('/api/auth/dev', { nome: f.get('nome').trim(), matricula: f.get('matricula').trim() || null, organizacao: !!f.get('organizacao'), codigo: f.get('codigo') });
      say($('#mdev'), 'Pronto. Abra o app ou o painel.', true); me();
    } catch (x) { say($('#mdev'), x.message); }
  });
  $('#sair').addEventListener('click', async () => { await API.post('/api/auth/sair').catch(() => {}); say($('#mdev'), 'Sessão encerrada.', true); me(); });

  async function qrs() {
    try {
      const list = await API.get('/api/homologacao/qrs');
      $('#qrs').innerHTML = list.map((q, i) => `<article class="qr" data-i="${i}"><div class="img">${q.svg}</div><b>${esc(q.title)}</b><small>${esc(q.when || 'Vale para todo o evento')}</small>
        <div class="acts"><button class="btn" data-read="${i}">Ler agora</button><a class="btn soft" href="${esc(q.url)}">Abrir link</a></div></article>`).join('');
      $('#qrs').addEventListener('click', async (e) => {
        const b = e.target.closest('[data-read]'); if (!b) return;
        b.disabled = true;
        try {
          const r = await API.post('/api/presenca', { qr: list[+b.dataset.read].url });
          b.closest('.qr').classList.add('done');
          say($('#mqr'), r.alreadyPresent ? 'Essa presença já estava registrada.' : r.activity ? `Presença registrada às ${r.time}.` : `Credenciamento confirmado às ${r.time}.`, true); me();
        } catch (x) { say($('#mqr'), x.status === 401 ? 'Entre primeiro (passo 1).' : x.message); } finally { b.disabled = false; }
      });
    } catch (x) { say($('#mqr'), x.status === 404 ? 'Os QRs de teste só aparecem com a homologação ligada (ETAL_LOGIN_DEV=1).' : x.message); }
  }
  me(); qrs();
})();
