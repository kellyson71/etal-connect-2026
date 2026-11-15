/* Cliente da API do ETAL Connect. Fica nulo (window.ETAL_API = null) quando config.js não aponta para uma API. */
window.ETAL_API = (() => {
  const cfg = window.ETAL_CONFIG || {};
  if (cfg.api == null) return null;
  /* Com servidor é o app de verdade: sem moldura de celular nem enfeites de demonstração (ver app.css, html.prod). */
  if (!cfg.demo) document.documentElement.classList.add('prod');
  const base = String(cfg.api).replace(/\/$/, '');
  const url = (p) => base + p;
  async function req(path, opts = {}) {
    const init = { method: opts.method || 'GET', credentials: 'include', headers: {} };
    if (opts.body !== undefined) {
      init.headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(opts.body);
    }
    const r = await fetch(url(path), init);
    const j = await r.json().catch(() => null);
    if (!r.ok) {
      const msg =
        j && (typeof j.detail === 'string' ? j.detail : Array.isArray(j.detail) ? 'Confira os dados enviados.' : null);
      throw Object.assign(new Error(msg || 'Não foi possível falar com o servidor.'), { status: r.status });
    }
    return j;
  }
  /* Sem conexão contínua (hospedagem em funções, como a Vercel): consulta a cada 12 s e avisa só do que mudou. */
  function poll(h) {
    let seen = null;
    let rooms = null;
    const where = {};
    const dados = {};
    const tick = async () => {
      try {
        const av = await req('/api/avisos');
        if (seen)
          av.filter((n) => !seen.has(n.id))
            .reverse()
            .forEach((n) => h.aviso?.(n));
        seen = new Set(av.map((n) => n.id));
        const p = await req('/api/programacao');
        const r = JSON.stringify(p.rooms || {});
        if (rooms !== null && r !== rooms) h.numeros?.(p.rooms || {});
        rooms = r;
        const first = !Object.keys(where).length;
        p.sessions.forEach((x) => {
          const k = `${x.floor}|${x.zone}|${x.room}`;
          const { taken, ...resto } = x;
          const f = JSON.stringify(resto);
          if (where[x.id] && where[x.id] !== k)
            h.sala?.({ activity: x.id, floor: x.floor, zone: x.zone, room: x.room });
          if (!first && (!dados[x.id] || dados[x.id] !== f)) h.atividade?.(x);
          where[x.id] = k;
          dados[x.id] = f;
        });
      } catch (_) {
        /* sem rede: tenta de novo */
      }
    };
    tick();
    const t = setInterval(() => {
      if (!document.hidden) tick();
    }, 12000);
    return { close: () => clearInterval(t) };
  }
  return {
    url,
    get: (p) => req(p),
    post: (p, body = {}) => req(p, { method: 'POST', body }),
    put: (p, body) => req(p, { method: 'PUT', body }),
    patch: (p, body) => req(p, { method: 'PATCH', body }),
    del: (p) => req(p, { method: 'DELETE' }),
    /* Envia um arquivo cru no corpo (Content-Type = tipo do arquivo), sem multipart. */
    async enviar(p, arquivo) {
      const r = await fetch(url(p), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': arquivo.type || 'application/octet-stream' },
        body: arquivo,
      });
      const j = await r.json().catch(() => null);
      if (!r.ok)
        throw Object.assign(
          new Error((j && typeof j.detail === 'string' && j.detail) || 'Não foi possível enviar o arquivo.'),
          { status: r.status },
        );
      return j;
    },
    /* Avisos, trocas de sala, numeração e lotação em tempo real. O navegador reconecta sozinho. */
    live(handlers) {
      if (cfg.vivo === 'consulta') return poll(handlers);
      const es = new EventSource(url('/api/ao-vivo'), { withCredentials: true });
      Object.entries(handlers).forEach(([k, f]) =>
        es.addEventListener(k, (e) => {
          try {
            f(JSON.parse(e.data));
          } catch (_) {
            /* evento malformado */
          }
        }),
      );
      return es;
    },
  };
})();
