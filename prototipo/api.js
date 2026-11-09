/* Cliente da API do ETAL Connect. Fica nulo (window.ETAL_API = null) quando config.js não aponta para uma API. */
window.ETAL_API = (() => {
  const cfg = window.ETAL_CONFIG || {};
  if (cfg.api == null) return null;
  const base = String(cfg.api).replace(/\/$/, '');
  const url = (p) => base + p;
  async function req(path, opts = {}) {
    const init = { method: opts.method || 'GET', credentials: 'include', headers: {} };
    if (opts.body !== undefined) { init.headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(opts.body); }
    const r = await fetch(url(path), init);
    const j = await r.json().catch(() => null);
    if (!r.ok) {
      const msg = j && (typeof j.detail === 'string' ? j.detail : Array.isArray(j.detail) ? 'Confira os dados enviados.' : null);
      throw Object.assign(new Error(msg || 'Não foi possível falar com o servidor.'), { status: r.status });
    }
    return j;
  }
  /* Sem conexão contínua (hospedagem em funções, como a Vercel): consulta a cada 12 s e avisa só do que mudou. */
  function poll(h) {
    let seen = null; let rooms = null; const where = {};
    const tick = async () => {
      try {
        const av = await req('/api/avisos');
        if (seen) av.filter((n) => !seen.has(n.id)).reverse().forEach((n) => h.aviso?.(n));
        seen = new Set(av.map((n) => n.id));
        const p = await req('/api/programacao');
        const r = JSON.stringify(p.rooms || {});
        if (rooms !== null && r !== rooms) h.numeros?.(p.rooms || {});
        rooms = r;
        p.sessions.forEach((x) => { const k = `${x.floor}|${x.zone}|${x.room}`; if (where[x.id] && where[x.id] !== k) h.sala?.({ activity: x.id, floor: x.floor, zone: x.zone, room: x.room }); where[x.id] = k; });
      } catch (_) { /* sem rede: tenta de novo */ }
    };
    tick(); const t = setInterval(() => { if (!document.hidden) tick(); }, 12000);
    return { close: () => clearInterval(t) };
  }
  return {
    url,
    get: (p) => req(p),
    post: (p, body = {}) => req(p, { method: 'POST', body }),
    put: (p, body) => req(p, { method: 'PUT', body }),
    patch: (p, body) => req(p, { method: 'PATCH', body }),
    del: (p) => req(p, { method: 'DELETE' }),
    /* Avisos, trocas de sala, numeração e lotação em tempo real. O navegador reconecta sozinho. */
    live(handlers) {
      if (cfg.vivo === 'consulta') return poll(handlers);
      const es = new EventSource(url('/api/ao-vivo'), { withCredentials: true });
      Object.entries(handlers).forEach(([k, f]) => es.addEventListener(k, (e) => { try { f(JSON.parse(e.data)); } catch (_) { /* evento malformado */ } }));
      return es;
    },
  };
})();
