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
      /* Retry-After: a fila do SUAP está cheia (ou um limite curto); o app pode tentar de novo depois disso */
      const retryAfter = +r.headers.get('Retry-After') || 0;
      throw Object.assign(new Error(msg || 'Não foi possível falar com o servidor.'), { status: r.status, retryAfter });
    }
    return j;
  }
  /* Sem conexão contínua (hospedagem em funções, como a Vercel): consulta a cada minuto, só com a aba visível, e avisa
     só do que mudou. A programação e os avisos vêm com ETag: sem mudança, o servidor responde 304, sem corpo. No plano
     gratuito da Vercel, consultar a cada 12 s com abas abertas estourou a cota do mês. */
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
    const INTERVALO = 60000;
    let ultima = Date.now();
    const talvez = () => {
      if (!document.hidden && Date.now() - ultima >= INTERVALO - 1000) {
        ultima = Date.now();
        tick();
      }
    };
    tick();
    const t = setInterval(talvez, INTERVALO);
    document.addEventListener('visibilitychange', talvez); // voltou para a aba depois de um tempo: confere na hora
    return {
      close: () => {
        clearInterval(t);
        document.removeEventListener('visibilitychange', talvez);
      },
    };
  }
  /* Dias do evento a partir das datas da programação do servidor (o app embarca os de 2025). O "agora" é o dia de hoje
     durante o evento; antes dele, o primeiro dia às 00:00 (tudo por vir); depois, o último às 23:59 (tudo encerrado). */
  const SEM = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const SEM_LONGO = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const MESES = [
    'janeiro',
    'fevereiro',
    'março',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro',
  ];
  function calendario(D, sessions) {
    const datas = [...new Set(sessions.map((x) => x.date).filter(Boolean))].sort();
    if (!datas.length) return null;
    const days = datas.map((iso) => {
      const d = new Date(`${iso}T12:00:00`);
      const mesLongo = MESES[d.getMonth()];
      const long = `${SEM_LONGO[d.getDay()]}, ${d.getDate()} de ${mesLongo}`;
      return { day: d.getDate(), week: SEM[d.getDay()], long, date: iso, mes: mesLongo.slice(0, 3), mesLongo };
    });
    const t = new Date();
    const hoje = [t.getFullYear(), t.getMonth() + 1, t.getDate()].map((n) => String(n).padStart(2, '0')).join('-');
    const atual = days.find((d) => d.date === hoje);
    const [day, fixo] = atual
      ? [atual.day, null]
      : hoje < datas[0]
        ? [days[0].day, '00:00']
        : [days[days.length - 1].day, '23:59'];
    D.days.splice(0, D.days.length, ...days);
    Object.assign(D.now, { day, fixo }, fixo ? { time: fixo } : {});
    return { days, ano: +datas[0].slice(0, 4) };
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
    calendario,
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
