/* Interface do mapa: busca, cartão do destino, modos Evento / Andares / Campus, botões de andar e 2D, legenda das cores
   do evento e etiquetas sobre os prédios. Toda mudança de vista é animada (palco + pose de câmera): nada teleporta. */
import * as THREE from 'three';
import { PLAN, BUILDINGS, COVERS, FLATS, wp, FH, zonePoly, centroid } from './dados.js';
import { rota, maisPerto, PONTOS } from './rotas.js';
import { LEGENDA } from './estilo.js';
import { enquadrar } from './camera.js';

const $ = (s) => document.querySelector(s);
const norm = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
const nomeAndar = (l) => (l ? `${l}º andar` : 'Térreo');
const ler = (k, padrao) => {
  try {
    return JSON.parse(localStorage.getItem(k)) ?? padrao;
  } catch {
    return padrao;
  }
};

export function iniciarInterface(ctx) {
  const {
    gestos,
    scene,
    camera,
    controls,
    renderer,
    principal,
    interior,
    palco,
    estilo,
    viagem,
    passeio,
    veg,
    entorno,
    sol,
    pedir,
    hora,
    prepararCampus,
    verCampus,
    predios,
    detalhes,
  } = ctx;
  let andarReal = null; // andar visto por dentro no prédio real (modos Evento e Campus)
  let selecionado = null,
    modo = 'evento',
    andarFoco = null,
    plano2d = false,
    percurso = null,
    ultimoQuadro = 0,
    amostras = [],
    autoNivel = 0;
  let sessoes = window.DATA?.sessions || [];
  let origem = null; // { level, zonaId, titulo }
  const prefs = ler('etal-mapa-novo', {});
  const salvar = () => {
    try {
      localStorage.setItem(
        'etal-mapa-novo',
        JSON.stringify({ quality: $('#qualidade').value, reduced: $('#reduzir').checked }),
      );
    } catch {}
  };
  const aviso = (t) => {
    $('#toast').textContent = t;
    $('#toast').hidden = false;
    clearTimeout(aviso.t);
    aviso.t = setTimeout(() => ($('#toast').hidden = true), 3800);
  };
  const ms = (n) => ($('#reduzir').checked ? 0 : n);

  /* ---------- vistas ---------- */
  /* Campus: mais baixo e mais aberto que o Evento (a 48° a vista ficava alta demais e mostrava pouco do campus): o campus
     inteiro em perspectiva, da rodovia, com o horizonte perto do alto da tela. */
  const campusPose = () =>
    innerWidth < innerHeight
      ? enquadrar(
          camera,
          [
            [-54, -122],
            [34, -122],
            [34, 50],
            [-54, 50],
          ].map(([x, z]) => new THREE.Vector3(x, 0, z)),
          { e: 31, min: 60, folga: 0.92 },
        ) // em pé: o miolo do campus, da quadra à rodovia
      : enquadrar(
          camera,
          [
            [-95, -150],
            [55, -150],
            [55, 60],
            [-95, 60],
          ].map(([x, z]) => new THREE.Vector3(x, 0, z)),
          { e: 28, min: 60, folga: 0.96 },
        );
  const eventoPose = () =>
    enquadrar(
      camera,
      [
        [-70, -60],
        [32, -55],
        [32, 48],
        [-60, 30],
      ].map(([x, z]) => new THREE.Vector3(x, 0, z)),
      { e: 50, min: 50 },
    );
  const andaresPose = (foco = null) =>
    foco == null
      ? enquadrar(
          camera,
          [0, 1, 2].flatMap((l) => interior.contorno(l, 1)),
          { e: 42, min: 40, folga: 1.04 },
        )
      : enquadrar(
          camera,
          foco === 0
            ? PLAN.floors[0].outlinePts.map((p) => {
                const w = wp(p);
                return new THREE.Vector3(w[0], 0, w[1]);
              })
            : interior.contorno(foco, 1),
          { e: 54, min: 26, folga: 1.02 },
        ); // o térreo inclui o auditório // bem perto do andar escolhido, na posição dele na escadinha
  const planoPose = (l) => {
    const pts = interior.contorno(l, 0);
    return enquadrar(camera, pts, { e: 89, a: 0, min: 34, folga: 1.02 });
  };
  /* Com um andar em foco, ele desce até a altura real dentro do prédio (escada desfeita); os de baixo ficam fantasmas
     e os de cima somem. Sem foco, os três se abrem em escada. */
  /* com um andar em foco a escadinha continua montada: ele fica inteiro e os outros dois esmaecem */
  /* com um andar em foco os outros quase somem (antes ficavam a 40% e disputavam a atenção) */
  const opsDe = (foco) => [0, 1, 2].map((l) => (foco == null || l === foco ? 1 : 0.12));
  async function abrirAndares(foco = null, achatar = false, real = false) {
    viagem.limpar();
    if (!real) {
      andarFoco = foco;
      andarReal = null;
    }
    plano2d = achatar && foco != null;
    marcarAndar();
    const ops = plano2d ? [0, 1, 2].map((l) => (l === foco ? 1 : 0)) : opsDe(foco);
    const sala =
      selecionado &&
      selecionado.kind !== 'ponto' &&
      selecionado.kind !== 'place' &&
      (foco == null || selecionado.level === foco);
    palco.set({ isoMax: modo === 'campus' ? 0.55 : 1 });
    /* vindo do prédio fechado, primeiro ele se abre em escada (os três andares) e só depois o andar escolhido desce */
    /* vindo do prédio fechado, vai direto ao andar num movimento só (antes parava na escadinha inteira no meio do caminho) */
    await palco.ir(
      {
        abre: 1,
        esc: plano2d ? 0 : 1,
        corte: 99,
        ops,
        elos: plano2d ? [0, 0] : foco == null ? [1, 1] : [0.12, 0.12],
        plano: plano2d ? 1 : 0,
        chegada: sala ? 1 : 0,
      },
      plano2d ? planoPose(foco) : andaresPose(foco),
      ms(palco.estado().abre > 0.9 ? 750 : 1500),
    );
  }
  async function fecharAndares(p) {
    viagem.limpar();
    andarFoco = null;
    andarReal = null;
    plano2d = false;
    marcarAndar();
    await palco.ir({ abre: 0, esc: 1, corte: 99, ops: [1, 1, 1], elos: [1, 1], plano: 0, chegada: 0 }, p, ms(1100));
  }
  /* Por dentro, sem maquete: o prédio real é cortado logo acima das salas do andar (salas, portas, piso dos corredores,
     cartazes e armários). É o que os botões de andar fazem nos modos Evento e Campus. */
  const contornoReal = (l) =>
    (l ? PLAN.floors[1] : PLAN.floors[0]).outlinePts.map((p) => {
      const w = wp(p);
      return new THREE.Vector3(w[0], l * FH, w[1]);
    });
  /* Nos modos Evento e Campus, os botões de andar abrem o mesmo prédio em escada, sem trocar de modo. */
  async function verDentro(l) {
    andarReal = l;
    if (l == null) return fecharAndares(modo === 'campus' ? campusPose() : eventoPose());
    andarFoco = null;
    return abrirAndares(l, false, true);
  }
  function marcarAndar() {
    const foco = modo === 'andares' ? andarFoco : andarReal;
    document
      .querySelectorAll('[data-nivel]')
      .forEach((b) => b.classList.toggle('on', b.dataset.nivel === 'tudo' ? foco == null : +b.dataset.nivel === foco));
    $('#flat').setAttribute('aria-pressed', plano2d);
    $('#flat').textContent = plano2d ? '3D' : '2D';
    $('#flat').hidden = modo !== 'andares';
    $('#andares').hidden = false;
    $('#legenda').hidden = modo !== 'evento';
  }
  /* Passear: personagem com a foto do perfil, carros na rodovia e no estacionamento (passeio.js) */
  /* celular: o passeio abre em tela cheia e deitado, como um jogo; ao sair, a tela volta ao normal */
  const tocavel = matchMedia('(pointer: coarse)').matches;
  function deitar() {
    if (!tocavel) return;
    const el = document.documentElement;
    Promise.resolve(el.requestFullscreen?.({ navigationUI: 'hide' }))
      .catch(() => {})
      .then(() => screen.orientation?.lock?.('landscape'))
      .catch(() => {});
  }
  function levantar() {
    if (!tocavel) return;
    try {
      screen.orientation?.unlock?.();
    } catch {
      /* sem suporte */
    }
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  }
  async function passear() {
    viagem.limpar();
    andarFoco = null;
    andarReal = null;
    palco.parar();
    palco.set({ abre: 0, esc: 1, corte: 99, ops: [1, 1, 1], elos: [1, 1], plano: 0, chegada: 0, iso: 0 });
    if (parent !== window) parent.postMessage({ type: 'etal:mapa:passeio', on: true }, location.origin);
    estilo.setMode('campus');
    document.body.classList.add('passeando');
    $('#passeio').hidden = false;
    aviso('Carregando o personagem e os carros…');
    try {
      await passeio.ligar({ aviso });
      $('#toast').hidden = true;
    } catch {
      aviso('Não foi possível abrir o passeio neste aparelho.');
      setMode('evento');
    }
  }
  function setMode(m) {
    if (modo === 'passear' && m !== 'passear') {
      passeio.desligar();
      document.body.classList.remove('passeando');
      $('#passeio').hidden = true;
      levantar();
      if (parent !== window) parent.postMessage({ type: 'etal:mapa:passeio', on: false }, location.origin);
    }
    if (m === 'passear') {
      modo = m;
      document.querySelectorAll('[data-modo]').forEach((b) => {
        b.classList.toggle('on', b.dataset.modo === m);
        b.setAttribute('aria-pressed', b.dataset.modo === m);
      });
      deitar();
      passear();
      return;
    }
    modo = m;
    estilo.setMode(m === 'campus' ? 'campus' : 'evento');
    /* o modo Campus mostra tudo (entorno e o recheio do bloco), montado na primeira vez; Evento e Andares ficam só com o campus */
    if (m === 'campus') {
      const pronto = prepararCampus();
      let ok = false;
      pronto.then(() => {
        ok = true;
        if (modo === 'campus') verCampus(true);
      });
      setTimeout(() => {
        if (!ok && modo === 'campus') aviso('Montando o campus inteiro…');
      }, 120);
    } else verCampus(false);
    document.querySelectorAll('[data-modo]').forEach((b) => {
      b.classList.toggle('on', b.dataset.modo === m);
      b.setAttribute('aria-pressed', b.dataset.modo === m);
    });
    if (m === 'andares') abrirAndares(selecionado?.level ?? null);
    else fecharAndares(m === 'campus' ? campusPose() : eventoPose());
    marcarAndar();
    pedir();
  }

  /* ---------- catálogo e busca ---------- */
  const catalogo = () => [
    { kind: 'perto', id: 'bebedouro', title: 'Bebedouro mais perto', sub: 'pelo caminho a pé' },
    ...Object.entries(PONTOS).map(([id, P]) => ({ kind: 'ponto', id, title: P.nome, sub: P.onde })),
    ...PLAN.floors.flatMap((f, level) =>
      f.zones
        .filter((z) => !z.closed && (z.roomNumber || z.kind === 'restroom'))
        .map((z) => ({
          kind: 'room',
          level,
          id: z.id,
          title: z.roomNumber ? `Sala ${z.roomNumber}` : z.label,
          sub: (z.name || z.label) + ' · ' + nomeAndar(level),
          zone: z,
        })),
    ),
    ...sessoes
      .filter((s) => Number.isInteger(s.floor) && s.zone)
      .map((s) => ({
        kind: 'activity',
        level: s.floor,
        id: s.zone,
        title: s.title,
        sub: `${s.time} · ${nomeAndar(s.floor)}`,
        activity: s,
      })),
    ...[...BUILDINGS, ...COVERS, ...FLATS]
      .filter((b) => b.label)
      .map((b) => ({ kind: 'place', id: b.id, title: b.label, sub: 'Campus', building: b })),
  ];
  const destinoDe = (it) => (it.kind === 'ponto' ? { ponto: it.id } : { level: it.level, zonaId: it.id });
  function mostrarOrigem() {
    $('#origem').textContent = origem ? `Saída: ${origem.titulo}` : 'Saída: Portaria';
    $('#trocar-origem').hidden = !origemAtividade;
    $('#trocar-origem').textContent = origem ? 'usar a portaria' : 'sair da minha sala';
  }
  let origemAtividade = null;
  /* Próxima atividade sua (o app manda): uma pílula com o nome, a hora e o ícone de rota. Sem ela, nada aparece até a
     pessoa escolher um destino (o cartão grande "Seu próximo encontro" saiu: era texto demais). */
  let proxima = null;
  function mostrarProxima() {
    const b = $('#proxima');
    const livre = !selecionado && !document.body.classList.contains('em-viagem') && modo !== 'passear';
    b.hidden = !(proxima && livre);
    if (b.hidden) return;
    $('#px-quando').textContent = `Sua próxima · ${proxima.quando || proxima.time}`;
    $('#px-titulo').textContent = proxima.title;
  }
  $('#proxima').onclick = () => {
    if (!proxima) return;
    select({
      kind: 'activity',
      level: proxima.floor,
      id: proxima.zone,
      title: proxima.title,
      sub: `${proxima.time} · ${nomeAndar(proxima.floor)}`,
      activity: proxima,
    });
    ir();
  };
  const salaAtividades = document.createElement('section');
  salaAtividades.id = 'sala-atividades';
  salaAtividades.hidden = true;
  $('#meta').after(salaAtividades);
  /* Atividades de um lugar. O bloco principal reúne todas as salas (menos o auditório, que tem cor e lista próprias). */
  let agoraEv = window.DATA?.now || null; // { day, time } do evento (o app manda)
  const LUGAR_AUD = (() => {
    const z = PLAN.floors[0].zones.find((q) => q.id === 'auditorio');
    return z && { id: 'auditorio', label: 'Auditório', p: zonePoly(z).map(wp) };
  })();
  function sessoesDoLugar(it) {
    if (it.kind !== 'place') return sessoes.filter((s) => s.floor === it.level && s.zone === it.id);
    if (it.id === 'auditorio') return sessoes.filter((s) => s.zone === 'auditorio');
    if (it.id === 'principal')
      return sessoes.filter((s) => Number.isInteger(s.floor) && s.zone && s.zone !== 'auditorio');
    return sessoes.filter((s) => s.place === it.id);
  }
  const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  const semana = (d) => DIAS[new Date(2025, 10, d).getDay()];
  const minutos = (t) => {
    const [h, m] = String(t || '0:0')
      .split(':')
      .map(Number);
    return h * 60 + m;
  };
  function situacao(s) {
    if (!agoraEv) return '';
    const a = agoraEv.day * 1440 + minutos(agoraEv.time),
      ini = s.day * 1440 + minutos(s.time),
      fim = s.end ? s.day * 1440 + minutos(s.end) : ini + 60;
    return a >= ini && a < fim ? 'agora' : ini > a ? 'futuro' : 'passou';
  }
  function listarAtividades(it) {
    const rows = sessoesDoLugar(it).sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
    salaAtividades.replaceChildren();
    salaAtividades.hidden = !rows.length;
    $('#cartao').classList.remove('recolhido');
    $('#recolher').setAttribute('aria-expanded', 'true');
    if (!rows.length) return;
    /* o que está acontecendo agora e a próxima ganham selo; a lista começa nelas */
    const prox = rows.find((s) => situacao(s) === 'futuro');
    let dia = null,
      rolar = null;
    const lista = it.kind === 'place' || rows.length > 2;
    if (lista) {
      const cab = document.createElement('p');
      cab.className = 'sa-resumo';
      cab.textContent = `${rows.length} ${rows.length === 1 ? 'atividade' : 'atividades'} aqui`;
      salaAtividades.append(cab);
    }
    for (const s of rows) {
      if (lista && s.day !== dia) {
        dia = s.day;
        const h = document.createElement('h3');
        h.className = 'sa-dia';
        h.textContent = `${semana(s.day)}, ${s.day} nov`;
        salaAtividades.append(h);
      }
      const st = situacao(s);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'sa-item ' + st;
      const hora = document.createElement('time');
      hora.textContent = s.time;
      const tx = document.createElement('span');
      const title = document.createElement('b');
      title.textContent = s.title;
      const when = document.createElement('small');
      when.textContent = lista ? s.room || s.type || 'Atividade' : `${s.day} nov · ${s.type || 'Atividade'}`;
      tx.append(title, when);
      b.append(hora, tx);
      if (st === 'agora' || s === prox) {
        const sel = document.createElement('em');
        sel.textContent = st === 'agora' ? 'Agora' : 'A seguir';
        b.append(sel);
        rolar ??= b;
      }
      b.onclick = () => {
        if (parent !== window) parent.postMessage({ type: 'etal:mapa:atividade', id: s.id }, location.origin);
        else aviso(s.title + ' · ' + s.time);
      };
      salaAtividades.append(b);
    }
    /* ver a mesma lista na Agenda do app */
    if (lista && parent !== window) {
      const v = document.createElement('button');
      v.type = 'button';
      v.className = 'sa-agenda';
      v.textContent = 'Ver na programação';
      v.onclick = () =>
        parent.postMessage(
          { type: 'etal:mapa:programacao', nome: it.title, ids: rows.map((s) => s.id), dia: (prox || rows[0]).day },
          location.origin,
        );
      salaAtividades.append(v);
    }
    if (rolar)
      requestAnimationFrame(() => {
        salaAtividades.scrollTop = Math.max(0, rolar.offsetTop - salaAtividades.offsetTop - 34);
      });
  }
  function select(it, { voar = true } = {}) {
    listarAtividades(it);
    selecionado = it;
    $('#proxima').hidden = true;
    percurso = null;
    viagem.limpar();
    $('#resultados').hidden = true;
    $('#busca').blur();
    if (it.kind === 'perto') {
      const r = maisPerto('bebedouro', origem);
      if (!r) {
        aviso('Nenhum bebedouro com caminho.');
        return;
      }
      return select({ kind: 'ponto', id: r.ponto.id, title: 'Bebedouro', sub: r.ponto.onde });
    }
    $('#titulo').textContent = it.title;
    $('#descricao').textContent = it.sub;
    $('#limpar').hidden = false;
    ['pular', 'repetir', 'etapas', 'etapas-texto'].forEach((id) => ($('#' + id).hidden = true));
    $('#etapa-atual').textContent = '';
    if (it.kind === 'place') {
      $('#ir').disabled = true;
      $('#via-wrap').hidden = true;
      $('#meta').textContent = sessoesDoLugar(it).length ? '' : 'No campus';
      if (voar)
        palco.ir(
          {},
          enquadrar(
            camera,
            it.building.p.map((q) => new THREE.Vector3(q[0], 0, q[1])),
            { e: 50, min: 56 },
          ),
          ms(900),
        );
      return;
    }
    const mesma = origem && it.kind !== 'ponto' && origem.level === it.level && origem.zonaId === it.id;
    const r = rota(destinoDe(it), mesma ? null : origem, $('#via').value || null);
    $('#ir').disabled = !r;
    $('#via-wrap').hidden = !r || !r.via;
    $('#meta').textContent = r
      ? `${it.level != null ? nomeAndar(it.level) + ' · ' : ''}${Math.ceil(r.metros)} m · cerca de ${r.minutos} min a pé`
      : 'Sem caminho confirmado';
    if ((modo === 'andares' || andarReal != null) && it.kind !== 'ponto') {
      interior.select(it.level, it.id);
      if (modo === 'andares') abrirAndares(it.level);
      else verDentro(it.level);
    }
  }
  function ir() {
    if (!selecionado || selecionado.kind === 'place') return false;
    /* saindo da própria sala de destino não há caminho: nesse caso vale a portaria */
    const mesma =
      origem && selecionado.kind !== 'ponto' && origem.level === selecionado.level && origem.zonaId === selecionado.id;
    percurso = viagem.ir(destinoDe(selecionado), { origem: mesma ? null : origem, forcar: $('#via').value || null });
    if (!percurso) {
      aviso('Não há um caminho confirmado para este destino.');
      return false;
    }
    if (modo !== 'evento' && modo !== 'andares') {
      modo = 'evento';
      estilo.setMode('evento');
      verCampus(false);
      document.querySelectorAll('[data-modo]').forEach((b) => {
        b.classList.toggle('on', b.dataset.modo === 'evento');
        b.setAttribute('aria-pressed', b.dataset.modo === 'evento');
      });
    }
    andarFoco = null;
    plano2d = false;
    marcarAndar();
    /* no celular o cartão recolhe durante a viagem, para o mapa ficar com a tela */
    if (innerWidth < 700) {
      $('#cartao').classList.add('recolhido');
      $('#recolher').setAttribute('aria-expanded', 'false');
    }
    $('#origem').textContent = r0Origem(percurso);
    document.body.classList.add('em-viagem');
    $('#pular').hidden = false;
    $('#repetir').hidden = true;
    $('#etapas').hidden = false;
    $('#via-wrap').open = false;
    const r = percurso;
    const passos = [r.origem ? `Saia da ${origem.titulo}.` : 'Comece na portaria de pedestres.'];
    if (r.entrada) passos.push(`Siga até a ${r.entrada}.`);
    if (r.via)
      passos.push(
        `${r.level >= (r.origem?.level ?? 0) ? 'Suba' : 'Desça'} pela ${r.via} até o ${nomeAndar(r.level).toLowerCase()}.`,
      );
    if (r.saida) passos.push(`Saia pela ${r.saida}.`);
    passos.push(
      r.zona
        ? `Siga até ${r.zona.roomNumber ? 'a sala ' + r.zona.roomNumber : r.zona.label}.`
        : `Siga até o ${r.ponto.nome.toLowerCase()} (${r.ponto.onde}).`,
    );
    $('#etapas-texto').replaceChildren(
      ...passos.map((t) => {
        const li = document.createElement('li');
        li.textContent = t;
        return li;
      }),
    );
    $('#meta').textContent =
      `${r.via ? 'pela ' + r.via + ' · ' : ''}${Math.ceil(r.metros)} m · cerca de ${r.minutos} min a pé`;
    return true;
  }
  const r0Origem = (r) => (r?.origem ? `Saída: ${origem.titulo}` : 'Saída: Portaria');
  function limpar() {
    salaAtividades.hidden = true;
    viagem.limpar();
    mostrarOrigem();
    selecionado = null;
    setTimeout(mostrarProxima);
    document.body.classList.remove('em-viagem');
    percurso = null;
    selecionado = null;
    $('#titulo').textContent = 'Seu próximo encontro';
    $('#descricao').textContent = 'Escolha uma sala, atividade ou lugar para ver o caminho.';
    $('#meta').textContent = 'Campus Pau dos Ferros';
    $('#ir').disabled = true;
    ['pular', 'repetir', 'etapas', 'limpar', 'via-wrap', 'etapas-texto'].forEach((id) => ($('#' + id).hidden = true));
    $('#etapa-atual').textContent = '';
    if (modo === 'andares') abrirAndares();
    else fecharAndares(modo === 'campus' ? campusPose() : eventoPose());
  }

  $('#busca').addEventListener('input', () => {
    const q = norm($('#busca').value).trim();
    $('#resultados').replaceChildren();
    $('#resultados').hidden = !q;
    if (!q) return;
    const lista = catalogo()
      .filter((x) => norm(x.title + ' ' + x.sub).includes(q))
      .slice(0, 14);
    /* segredo: quem digita "passear" acha o passeio */
    if (/^passe(ar|io)$/.test(q)) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = 'Passear pelo campus';
      const sm = document.createElement('small');
      sm.textContent = 'um segredo do mapa';
      b.append(sm);
      b.onclick = () => {
        $('#busca').value = '';
        $('#resultados').hidden = true;
        $('#busca').blur();
        setMode('passear');
      };
      $('#resultados').append(b);
      if (!lista.length) return;
    }
    for (const it of lista) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = it.title;
      const s = document.createElement('small');
      s.textContent = it.sub;
      b.append(s);
      b.onclick = () => select(it);
      $('#resultados').append(b);
    }
    if (!lista.length) $('#resultados').textContent = 'Nada encontrado. Tente o número da sala ou o nome do setor.';
  });
  /* ---------- achar a sala pelo número: teclado grande, resultado a cada dígito ---------- */
  {
    const wrap = $('#busca-wrap');
    const bt = document.createElement('button');
    bt.id = 'num-btn';
    bt.type = 'button';
    bt.textContent = '123';
    bt.setAttribute('aria-label', 'Achar sala pelo número');
    bt.setAttribute('aria-expanded', 'false');
    const tec = document.createElement('div');
    tec.id = 'teclado';
    tec.hidden = true;
    tec.innerHTML =
      '<div id="tec-achados" aria-live="polite"></div><div id="tec-teclas">' +
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'fechar', '0', 'apagar']
        .map(
          (k) =>
            `<button type="button" data-k="${k}" ${k.length > 1 ? `class="tec-acao" aria-label="${k === 'apagar' ? 'Apagar' : 'Fechar teclado'}"` : ''}>${k === 'apagar' ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5h11v14H9l-6-7Z"/><path d="M12 9.500l5 5M17 9.500l-5 5"/></svg>' : k === 'fechar' ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>' : k}</button>`,
        )
        .join('') +
      '</div>';
    wrap.append(bt, tec);
    let dig = '';
    const fechar = () => {
      tec.hidden = true;
      bt.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('teclando');
    };
    const pintar = () => {
      $('#busca').value = dig;
      const box = $('#tec-achados');
      box.replaceChildren();
      const salas = dig
        ? catalogo().filter((x) => x.kind === 'room' && x.zone.roomNumber && String(x.zone.roomNumber).startsWith(dig))
        : [];
      if (!dig) {
        box.textContent = 'Digite o número da sala';
        return;
      }
      if (!salas.length) {
        box.textContent = 'Nenhuma sala começa com ' + dig;
        return;
      }
      /* número completo e único: abre direto */
      if (salas.length === 1 && String(salas[0].zone.roomNumber) === dig && dig.length >= 2) {
        fechar();
        select(salas[0]);
        dig = '';
        return;
      }
      salas.slice(0, 8).forEach((it) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.innerHTML = `<b>${it.zone.roomNumber}</b><small>${it.zone.word || it.zone.label || ''} · ${nomeAndar(it.level)}</small>`;
        b.onclick = () => {
          fechar();
          dig = '';
          select(it);
        };
        box.append(b);
      });
    };
    bt.onclick = () => {
      const abrir = tec.hidden;
      if (!abrir) {
        fechar();
        return;
      }
      tec.hidden = false;
      bt.setAttribute('aria-expanded', 'true');
      document.body.classList.add('teclando');
      $('#resultados').hidden = true;
      $('#busca').blur();
      dig = '';
      pintar();
    };
    tec.addEventListener('pointerdown', (e) => {
      const b = e.target.closest('[data-k]');
      if (!b) return;
      e.preventDefault();
      const k = b.dataset.k;
      if (k === 'fechar') {
        fechar();
        $('#busca').value = '';
        return;
      }
      dig = k === 'apagar' ? dig.slice(0, -1) : (dig + k).slice(0, 3);
      pintar();
    });
    $('#busca').addEventListener('focus', fechar);
  }
  /* ---------- celular: tudo ao alcance do dedão ----------
     Busca, cartão, modos e andares vão para uma doca na parte de baixo da tela; em cima fica só voltar, legenda e ajustes. */
  {
    const mq = matchMedia('(max-width: 600px)');
    const doca = document.createElement('div');
    doca.id = 'doca';
    document.body.append(doca);
    const arrumar = () => {
      if (mq.matches) {
        doca.append($('#andares'), $('#cartao'), $('#busca-wrap'), $('#modos'));
        document.body.classList.add('dedao');
      } else {
        $('#topo').insertBefore($('#busca-wrap'), $('#ajustes-btn'));
        document.body.append($('#andares'), $('#cartao'), $('#proxima'), $('#modos'));
        document.body.classList.remove('dedao');
      }
    };
    arrumar();
    mq.addEventListener('change', arrumar);
  }
  $('#busca').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $('#resultados button')?.click();
    if (e.key === 'Escape') $('#resultados').hidden = true;
  });
  $('#ir').onclick = () => ir();
  $('#via').onchange = () => {
    if (selecionado) {
      if (percurso) ir();
      else select(selecionado);
    }
  };
  $('#pular').onclick = () => viagem.pular();
  $('#repetir').onclick = () => {
    if (percurso) {
      viagem.repetir();
      $('#pular').hidden = false;
      $('#repetir').hidden = true;
    }
  };
  $('#limpar').onclick = limpar;
  $('#etapas').onclick = () => {
    $('#etapas-texto').hidden = !$('#etapas-texto').hidden;
    $('#etapas').setAttribute('aria-expanded', !$('#etapas-texto').hidden);
  };
  $('#recolher').onclick = () => {
    const c = $('#cartao').classList.toggle('recolhido');
    $('#recolher').setAttribute('aria-expanded', !c);
  };
  $('#trocar-origem').onclick = () => {
    origem = origem ? null : origemAtividade;
    mostrarOrigem();
    if (selecionado) {
      const it = selecionado;
      select(it);
    }
  };
  document.addEventListener('mapa:etapa', (e) => {
    $('#etapa-atual').textContent = e.detail.text;
  });
  document.addEventListener('mapa:chegada', () => {
    document.body.classList.remove('em-viagem');
    $('#pular').hidden = true;
    $('#repetir').hidden = false;
    $('#etapa-atual').textContent = 'Você chegou';
  });

  /* ---------- modos, andares, 2D, legenda ---------- */
  document.querySelectorAll('[data-modo]').forEach((b) => (b.onclick = () => setMode(b.dataset.modo)));
  document.querySelectorAll('[data-nivel]').forEach((b) =>
    b.addEventListener('click', () => {
      const l = b.dataset.nivel === 'tudo' ? null : +b.dataset.nivel;
      if (modo === 'andares') abrirAndares(l, plano2d && l != null);
      else verDentro(l);
    }),
  );
  $('#flat').onclick = () => {
    const l = andarFoco ?? selecionado?.level ?? 0;
    abrirAndares(l, !plano2d);
  };
  $('#p-sair').onclick = () => setMode('evento');
  $('#legenda').replaceChildren(
    ...LEGENDA.map(([cor, nome, sub]) => {
      const b = document.createElement('button');
      b.className = 'leg ' + cor;
      b.innerHTML = `<i></i><span><b data-curto="${nome.split(' ')[0]}">${nome}</b><small>${sub}</small></span>`;
      b.onclick = () => focarParte(nome);
      return b;
    }),
  );
  function focarParte(nome) {
    const ids = { 'Bloco principal': 'principal', Auditório: 'principal', Cantina: 'cantina', Pátio: 'patio' };
    const b = [...BUILDINGS, ...COVERS].find((x) => x.id === ids[nome]);
    if (!b) return;
    palco.ir(
      {},
      enquadrar(
        camera,
        b.p.map((q) => new THREE.Vector3(q[0], 0, q[1])),
        { e: 50, min: 40 },
      ),
      ms(900),
    );
  }

  /* ---------- qualidade ---------- */
  $('#ajustes-btn').onclick = () => {
    $('#ajustes').hidden = !$('#ajustes').hidden;
    $('#ajustes-btn').setAttribute('aria-expanded', !$('#ajustes').hidden);
  };
  $('#reduzir').checked = prefs.reduced ?? matchMedia('(prefers-reduced-motion: reduce)').matches;
  $('#reduzir').onchange = () => {
    salvar();
    if ($('#reduzir').checked) viagem.pular();
  };
  function qualidade() {
    const q = $('#qualidade').value;
    const movel = matchMedia('(pointer:coarse)').matches || innerWidth < 600;
    const n = q === 'alta' ? 0 : q === 'media' ? 1 : q === 'leve' ? 2 : Math.max(movel ? 1 : 0, autoNivel);
    renderer.setPixelRatio(Math.min(devicePixelRatio, [1.8, 1.25, 1][n]));
    renderer.setSize($('#tela').clientWidth, $('#tela').clientHeight, false);
    renderer.shadowMap.enabled = $('#sombras').checked && n < 2;
    sol.castShadow = renderer.shadowMap.enabled;
    const tam = [2048, 1024, 512][n];
    if (sol.shadow.mapSize.x !== tam) {
      sol.shadow.mapSize.set(tam, tam);
      sol.shadow.map?.dispose();
      sol.shadow.map = null;
    }
    for (const g of [veg, entorno])
      g.traverse((o) => {
        if (!o.isInstancedMesh) return;
        o.userData.cheio ??= o.count;
        o.count = g === entorno ? Math.ceil(o.userData.cheio * [1, 0.45, 0.15][n]) : o.userData.cheio;
        o.castShadow = n === 0 && g === veg;
      });
    renderer.shadowMap.needsUpdate = true;
    pedir();
    return n;
  }
  $('#qualidade').value = prefs.quality || 'auto';
  $('#qualidade').onchange = () => {
    autoNivel = 0;
    amostras = [];
    qualidade();
    salvar();
  };
  $('#sombras').onchange = qualidade;
  qualidade();
  const qt = setInterval(qualidade, 1500);
  setTimeout(() => clearInterval(qt), 12000);

  /* ---------- etiquetas do evento (pílulas, como no app) ---------- */
  const etiquetas = [];
  const noBloco = (px, py, h) => {
    const w = wp([px, py]);
    return new THREE.Vector3(w[0], h, w[1]);
  };
  const meio = (id, h) => {
    const b = [...BUILDINGS, ...COVERS, ...FLATS].find((q) => q.id === id);
    const c = centroid(b.p);
    return new THREE.Vector3(c[0], h ?? (b.h || 0) + 1.5, c[1]);
  };
  /* ícone de cada lugar, como nos mapas ilustrados de campus: o que é cada prédio se entende de longe */
  const ic = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const ICONE = {
    aula: ic('<path d="M3 4h18M4 4v10h16V4M12 14v3M8 21l4-4 4 4"/>'),
    mic: ic(
      '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>',
    ),
    talher: ic('<path d="M7 3v18M4.5 3v5a2.5 2.5 0 0 0 5 0V3M17.5 21V3c-2.2 1.2-3.5 4-3.5 7.5h3.5"/>'),
    banco: ic('<path d="M4 10h16M3.5 14h17M6 14v5M18 14v5M6 10V6.5h12V10"/>'),
    obelisco: ic('<path d="M12 2.5l2.2 3V19h-4.4V5.5zM6.5 21h11"/>'),
    entrada: ic('<path d="M14 4h5v16h-5M3 12h11M10 8l4 4-4 4"/>'),
    livro: ic('<path d="M4 19.5V5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2 2 2 0 0 0 2 2h13"/>'),
    bola: ic(
      '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c3 2.4 3 14.6 0 17M12 3.5c-3 2.4-3 14.6 0 17"/>',
    ),
    campo: ic(
      '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M12 5v14"/><circle cx="12" cy="12" r="2.6"/>',
    ),
    lab: ic('<path d="M9 3h6M10 3v6.5L4.8 18.3A1.8 1.8 0 0 0 6.4 21h11.2a1.8 1.8 0 0 0 1.6-2.7L14 9.5V3M7.5 15h9"/>'),
    agua: ic('<path d="M3 15.5c3 0 3 2 6 2s3-2 6-2 3 2 6 2M3 10c3 0 3 2 6 2s3-2 6-2 3 2 6 2"/>'),
    predio: ic('<path d="M4 21V4h10v17M14 9h6v12M7.5 8h3M7.5 12h3M7.5 16h3M3 21h18"/>'),
  };
  const etiqueta = (html, cls, p, onclick, prio) => {
    const el = document.createElement('button');
    el.innerHTML = html;
    el.className = cls;
    el.onclick = onclick;
    $('#rotulos').append(el);
    etiquetas.push({ el, p, prio });
  };
  /* partes do evento: pílula na cor da parte, com ícone */
  [
    { t: 'Bloco principal', cor: 'verde', i: 'aula', p: noBloco(620, 300, 13) },
    { t: 'Auditório', cor: 'azul', i: 'mic', p: noBloco(118, 200, 10.5) },
    { t: 'Cantina', cor: 'laranja', i: 'talher', p: meio('cantina', 6) },
    { t: 'Pátio', cor: 'patio', i: 'banco', p: meio('patio', 8.6) },
    { t: 'Obelisco', cor: 'vermelho', i: 'obelisco', p: meio('obelisco', 6.6) },
  ].forEach((q) =>
    etiqueta(
      `${ICONE[q.i]}<span>${q.t}</span>`,
      'pilula ' + q.cor,
      q.p,
      () => {
        /* a pílula abre o lugar com a programação dele */
        const b = {
          'Bloco principal': LUGARES.principal,
          Auditório: LUGAR_AUD,
          Cantina: LUGARES.cantina,
          Pátio: LUGARES.patio,
          Obelisco: LUGARES.obelisco,
        }[q.t];
        if (b) select(lugarItem(b));
        else focarParte(q.t);
      },
      0,
    ),
  );
  /* o resto do campus: marcador branco com ícone e o nome curto (tocar mostra o lugar no cartão) */
  [
    ['portaria', 'entrada', 'Entrada'],
    ['biblioteca', 'livro', 'Biblioteca'],
    ['laboratorios', 'lab', 'Laboratórios'],
    ['anexo', 'predio', 'Anexo'],
    ['ginasio', 'bola', 'Ginásio'],
    ['campo', 'campo', 'Campo'],
    ['piscina', 'agua', 'Piscina'],
  ].forEach(([id, i, t]) =>
    etiqueta(
      `${ICONE[i]}<span>${t}</span>`,
      'marco',
      meio(id),
      () => {
        const b = LUGARES[id];
        if (b) select({ kind: 'place', id, title: b.label, sub: 'Campus', building: b });
      },
      1,
    ),
  );

  /* ---------- tocar numa sala ---------- */
  const raio = new THREE.Raycaster();
  raio.layers.enable(1);
  let toque = null,
    ultimoToque = null;
  $('#tela').addEventListener('pointerdown', (e) => {
    toque = { x: e.clientX, y: e.clientY, t: performance.now() };
  });
  $('#tela').addEventListener('pointerup', (e) => {
    if (!toque || Math.hypot(e.clientX - toque.x, e.clientY - toque.y) > 6 || performance.now() - toque.t > 500) return;
    toque = null;
    if (viagem.estado() && !viagem.estado().fim) return;
    /* dois toques seguidos no mesmo ponto */
    const agora = performance.now(),
      duplo =
        ultimoToque &&
        agora - ultimoToque.t < 340 &&
        Math.hypot(e.clientX - ultimoToque.x, e.clientY - ultimoToque.y) < 40;
    ultimoToque = duplo ? null : { t: agora, x: e.clientX, y: e.clientY };
    if (duplo && palco.estado().abre < 0.9) {
      toqueDuplo(e);
      return;
    }
    if (palco.estado().abre < 0.9) {
      if (modo !== 'passear') tocarLugar(e);
      return;
    }
    const r = $('#tela').getBoundingClientRect();
    raio.setFromCamera(
      new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, (-(e.clientY - r.top) / r.height) * 2 + 1),
      camera,
    );
    const foco = modo === 'andares' ? andarFoco : andarReal;
    const hits = raio.intersectObjects(
      interior.rooms.filter(
        (m) => palco.estado().ops[m.userData.level] > 0.3 && (foco == null || m.userData.level === foco),
      ),
      false,
    );
    if (hits.length) {
      const { zone: z, level } = hits[0].object.userData;
      if (!z.roomNumber && z.kind !== 'restroom') return;
      if (z.closed) {
        aviso('Interditado.');
        return;
      }
      interior.select(level, z.id);
      select({
        kind: 'room',
        level,
        id: z.id,
        title: z.roomNumber ? 'Sala ' + z.roomNumber : z.label,
        sub: (z.name || z.label) + ' · ' + nomeAndar(level),
        zone: z,
      });
    }
  });

  /* ---------- tocar num prédio: mostra o nome e aproxima ----------
     O obelisco esconde o passeio: cinco toques seguidos nele. */
  const raioLugar = new THREE.Raycaster();
  const LUGARES = Object.fromEntries([...BUILDINGS, ...COVERS, ...FLATS].filter((b) => b.label).map((b) => [b.id, b]));
  let obelisco = { n: 0, t: 0 };
  /* lugar debaixo do dedo: id do prédio (o auditório é a casca azul do bloco principal) */
  function lugarEm(e) {
    const r = $('#tela').getBoundingClientRect();
    raioLugar.setFromCamera(
      new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, (-(e.clientY - r.top) / r.height) * 2 + 1),
      camera,
    );
    const alvos = [predios, principal.grupo, detalhes].filter(Boolean);
    const hit = raioLugar.intersectObjects(alvos, true).find((h) => h.object.visible);
    let o = hit?.object,
      casca = false;
    while (o && !LUGARES[o.name] && !(o === principal.grupo)) {
      if (o.name === 'casca' || o.name === 'tetos-baixos') casca = true;
      o = o.parent;
    }
    const id = o === principal.grupo ? (casca && LUGAR_AUD ? 'auditorio' : 'principal') : o?.name;
    return id === 'auditorio' ? LUGAR_AUD : LUGARES[id] || null;
  }
  /* o auditório é uma sala do térreo: abre como sala, com "Como chegar" */
  const lugarItem = (b) =>
    b.id === 'auditorio'
      ? {
          kind: 'room',
          level: 0,
          id: 'auditorio',
          title: 'Auditório',
          sub: 'Palestras · Térreo do bloco principal',
          zone: PLAN.floors[0].zones.find((z) => z.id === 'auditorio'),
        }
      : { kind: 'place', id: b.id, title: b.label, sub: 'Campus', building: b };
  function tocarLugar(e) {
    if (window.MAPA3D?.abertura?.ativa()) return;
    const b = lugarEm(e);
    if (!b) return;
    const id = b.id;
    if (id === 'obelisco') {
      const agora = performance.now();
      obelisco = agora - obelisco.t < 2000 ? { n: obelisco.n + 1, t: agora } : { n: 1, t: agora };
      if (obelisco.n >= 5) {
        obelisco = { n: 0, t: 0 };
        aviso('Você achou um segredo!');
        setMode('passear');
        return;
      }
      if (obelisco.n >= 3) aviso(`Mais ${5 - obelisco.n}…`);
      if (obelisco.n > 1) return;
    }
    if (selecionado?.kind === 'place' && selecionado.id === id) return;
    select(lugarItem(b), { voar: id !== 'obelisco' }); // o obelisco fica parado: é nele que se toca de novo
  }
  /* Toque duplo: no bloco principal, abre os andares; em outro lugar, mostra a programação dele (cartão aberto, com a
     atividade de agora ou a próxima em destaque); num lugar vazio, aproxima. */
  function toqueDuplo(e) {
    if (window.MAPA3D?.abertura?.ativa() || modo === 'passear') return;
    const b = lugarEm(e);
    if (b?.id === 'principal') {
      setMode('andares');
      return;
    }
    if (b && b.id !== 'obelisco') {
      select(lugarItem(b));
      if (!sessoesDoLugar(lugarItem(b)).length) aviso('Nenhuma atividade aqui.');
      return;
    }
    if (!b) gestos?.aproximar(e.clientX, e.clientY, (p) => palco.ir({}, p, ms(450)));
  }

  /* ---------- integração com o app ---------- */
  addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (modo === 'passear') setMode('evento');
    else $('#voltar').click();
  });
  $('#voltar').onclick = () => {
    if (window.parent !== window) window.parent.postMessage({ type: 'etal:mapa:fechar' }, location.origin);
    else if (history.length > 1) history.back();
  };
  const api = {
    route: (l, z, via = null) => {
      const it = catalogo().find((x) => x.kind === 'room' && x.level === l && x.id === z);
      if (!it) return false;
      $('#via').value = via || '';
      select(it);
      return ir();
    },
    focus: (id) => {
      const x = catalogo().find((q) => q.kind === 'place' && q.id === id);
      if (x) select(x);
    },
    clearRoute: limpar,
    setMode,
    setHour: hora,
    setFoto: (uri, nome) => passeio.setFoto(uri, nome),
    setOrigem: (o) => {
      origemAtividade =
        o && Number.isInteger(o.floor) ? { level: o.floor, zonaId: o.zone, titulo: o.titulo || 'sua atividade' } : null;
      origem = null;
      mostrarOrigem();
    }, // a rota sai da portaria; "sair da minha atividade" troca
    syncRooms: (rooms) => {
      for (const f of PLAN.floors)
        for (const z of f.zones) {
          const n = rooms?.[`${f.level}:${z.id}`];
          if (n) z.roomNumber = String(n);
        }
      principal.syncRooms();
      interior.syncRooms();
    },
  };
  window.CampusNovo = api;
  window.addEventListener('message', (e) => {
    if (
      e.origin !== location.origin ||
      e.source !== parent ||
      !['etal:mapa:abrir', 'etal:mapa:sincronizar'].includes(e.data?.type)
    )
      return;
    const d = e.data;
    if (Array.isArray(d.sessions)) sessoes = d.sessions;
    if (d.agora && Number.isInteger(d.agora.day)) agoraEv = d.agora;
    if (d.tema === 'escuro' || d.tema === 'claro') document.documentElement.dataset.tema = d.tema;
    if ('proxima' in d) {
      proxima = d.proxima && Number.isInteger(d.proxima.floor) ? d.proxima : null;
      mostrarProxima();
    }
    if ('foto' in d || 'nome' in d) passeio.setFoto(d.foto, d.nome);
    api.syncRooms(d.rooms);
    if ('origem' in d) api.setOrigem(d.origem);
    if (d.hour != null) hora(d.hour); // o app manda a hora do aparelho (ou a escolhida no céu)
    if (selecionado) listarAtividades(selecionado);
    if (d.type === 'etal:mapa:sincronizar') return;
    if (d.reduced != null) $('#reduzir').checked = !!d.reduced;
    /* o app pode pedir um modo (tela grande do computador) e uma rota tira o mapa do passeio */
    if (typeof d.mode === 'string' && ['evento', 'andares', 'campus', 'passear'].includes(d.mode) && d.mode !== modo)
      setMode(d.mode);
    if (Number.isInteger(d.floor) && typeof d.zone === 'string' && modo === 'passear') setMode('evento');
    if (Number.isInteger(d.floor) && typeof d.zone === 'string') {
      const a = sessoes.find((s) => s.floor === d.floor && s.zone === d.zone);
      if (a) {
        select({
          kind: 'activity',
          level: d.floor,
          id: d.zone,
          title: a.title,
          sub: `${a.time} · ${nomeAndar(d.floor)}`,
          activity: a,
        });
        ir();
      } else api.route(d.floor, d.zone, d.via);
    } else if (d.place) api.focus(d.place);
  });
  if (parent !== window) parent.postMessage({ type: 'etal:mapa:pronto' }, location.origin);
  const params = new URLSearchParams(location.search);
  if (params.get('aba') === '1') {
    $('#voltar').hidden = true;
    document.body.classList.add('sem-voltar');
  }
  if (params.has('origem')) {
    const [l, z] = params.get('origem').split(':');
    const zz = PLAN.floors[+l]?.zones.find((q) => q.id === z);
    if (zz) api.setOrigem({ floor: +l, zone: z, titulo: zz.roomNumber ? 'Sala ' + zz.roomNumber : zz.label });
  } else mostrarOrigem();
  if (params.has('sala')) api.route(+(params.get('andar') || 1), params.get('sala'), params.get('via'));
  addEventListener('resize', () => {
    viagem.resize();
    qualidade();
  });
  $('#tela').addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    $('#fallback').hidden = false;
  });
  setMode('evento');

  return {
    api,
    select,
    ir,
    qualidade,
    poseEvento: eventoPose,
    quadro(now) {
      const ocupado = [];
      const ver =
        modo === 'evento' &&
        !passeio.ativo() &&
        !viagem.ativa() &&
        palco.estado().abre < 0.05 &&
        !window.MAPA3D?.abertura?.ativa();
      for (const l of etiquetas) {
        const p = l.p.clone().project(camera),
          x = (p.x * 0.5 + 0.5) * innerWidth,
          y = (-p.y * 0.5 + 0.5) * innerHeight;
        /* as do evento têm a vez; os marcadores do campus só entram onde sobra lugar */
        const ok =
          ver &&
          p.z > -1 &&
          p.z < 1 &&
          x > 60 &&
          x < innerWidth - 60 &&
          y > 140 &&
          y < innerHeight - 40 &&
          !ocupado.some((o) => Math.abs(o.x - x) < (l.prio ? 100 : 120) && Math.abs(o.y - y) < 34);
        l.el.hidden = !ok;
        if (ok) {
          l.el.style.left = x + 'px';
          l.el.style.top = y + 'px';
          ocupado.push({ x, y });
        }
      }
      const dt = now - ultimoQuadro;
      ultimoQuadro = now;
      if (dt > 0 && dt < 1000 && viagem.estado() && !viagem.estado().fim) {
        amostras.push(dt);
        if (amostras.length >= 24) {
          const m = amostras.reduce((a, b) => a + b) / amostras.length;
          $('#fps').textContent = `${Math.round(1000 / m)} fps no percurso`;
          if ($('#qualidade').value === 'auto' && m > 38 && autoNivel < 2) {
            autoNivel++;
            qualidade();
          }
          amostras = [];
        }
      }
    },
  };
}
