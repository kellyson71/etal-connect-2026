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
  return {
    url,
    get: (p) => req(p),
    post: (p, body = {}) => req(p, { method: 'POST', body }),
    put: (p, body) => req(p, { method: 'PUT', body }),
    patch: (p, body) => req(p, { method: 'PATCH', body }),
    del: (p) => req(p, { method: 'DELETE' }),
    /* Avisos, trocas de sala, numeração e lotação em tempo real. O navegador reconecta sozinho. */
    live(handlers) {
      const es = new EventSource(url('/api/ao-vivo'), { withCredentials: true });
      Object.entries(handlers).forEach(([k, f]) => es.addEventListener(k, (e) => { try { f(JSON.parse(e.data)); } catch (_) { /* evento malformado */ } }));
      return es;
    },
  };
})();
