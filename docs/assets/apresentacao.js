(() => {
  'use strict';
  const slides = [...document.querySelectorAll('.slide')];
  const shell = document.querySelector('.deck-shell');
  const dots = [...document.querySelectorAll('.slide-dots [data-go]')];
  const previous = document.querySelector('[data-prev]');
  const next = document.querySelector('[data-next]');
  const output = document.querySelector('.nav-control output');
  const referenceDialog = document.getElementById('references');
  const outlineDialog = document.getElementById('outline');
  const lightbox = document.getElementById('lightbox');
  const assetBase = new URL('.', document.currentScript.src);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const aliases = {README:'visao',estado:'verificacao',casos:'jornada',entrada:'jornada',agenda:'app',persistencia:'arquitetura',modos:'offline',implantacao:'arquitetura','api-exemplo':'api','01-requisitos':'processo','02-casos-de-uso':'jornada','03-banco-de-dados':'banco','04-arquitetura':'arquitetura','05-api':'api','06-testes':'verificacao'};
  let current = 0;
  let changedAt = 0;
  let wheelDelta = 0;
  let touchStart = null;
  let hourFrame = null;

  function drawDatabase() {
    const graph = document.querySelector('.db-graph');
    const svg = graph.querySelector('.db-wires');
    const area = graph.getBoundingClientRect();
    const ratio = graph.offsetWidth / area.width;
    const point = (name, right) => {
      const rect = graph.querySelector(`[data-table="${name}"]`).getBoundingClientRect();
      return [(rect[right ? 'right' : 'left']-area.left)*ratio, (rect.top+rect.height/2-area.top)*ratio];
    };
    const paths = [];
    ['agenda','presencas'].forEach(name => {
      [[point('pessoas',true),point(name,false)],[point('atividades',false),point(name,true)]].forEach(([a,b]) => {
        const mid = (a[0]+b[0])/2;
        paths.push(`M${a[0]} ${a[1]}H${mid}V${b[1]}H${b[0]}`);
      });
    });
    svg.setAttribute('viewBox', `0 0 ${graph.offsetWidth} ${graph.offsetHeight}`);
    svg.querySelector('path').setAttribute('d', paths.join(' '));
  }

  function fit() {
    const box = shell.getBoundingClientRect();
    document.documentElement.style.setProperty('--scale', Math.min(box.width / 1440, box.height / 810));
    requestAnimationFrame(drawDatabase);
  }
  function mount(demo) {
    const frame = demo.querySelector('iframe');
    if (frame.dataset.loaded === '1') return;
    if (location.protocol === 'file:') frame.setAttribute('sandbox','allow-scripts allow-same-origin');
    frame.dataset.loaded = '1';
    frame.onload = () => {
      if (frame.getAttribute('src') !== 'about:blank') demo.classList.add('ready');
    };
    frame.src = frame.dataset.src;
  }
  function unmount(demo) {
    const frame = demo.querySelector('iframe');
    frame.onload = null;
    if (frame.dataset.loaded === '1') frame.src = 'about:blank';
    delete frame.dataset.loaded;
    demo.classList.remove('ready');
  }
  function loadCurrent() {
    if (document.querySelector('dialog[open]')) return;
    slides[current].querySelectorAll('[data-demo][data-auto="true"]').forEach(mount);
  }
  function stopCurrent() {
    slides[current].querySelectorAll('[data-demo]').forEach(unmount);
  }
  function go(index, updateHash = true) {
    const target = Math.max(0, Math.min(slides.length - 1, index));
    const old = slides[current];
    if (target !== current) {
      stopCurrent();
      old.classList.add('leaving');
      setTimeout(() => old.classList.remove('leaving'), 650);
    }
    current = target;
    changedAt = performance.now();
    slides.forEach((slide, i) => {
      const active = i === current;
      slide.classList.toggle('active', active);
      slide.inert = !active;
      slide.setAttribute('aria-hidden', String(!active));
    });
    dots.forEach((dot, i) => i === current ? dot.setAttribute('aria-current', 'step') : dot.removeAttribute('aria-current'));
    previous.disabled = current === 0;
    next.disabled = current === slides.length - 1;
    output.value = `${String(current + 1).padStart(2, '0')} / ${slides.length}`;
    document.querySelector('[data-breadcrumb]').textContent = slides[current].dataset.chapter;
    document.documentElement.style.setProperty('--progress', (current + 1) / slides.length);
    if (updateHash) history.replaceState(null, '', `#${slides[current].id}`);
    setTimeout(loadCurrent, reduced.matches ? 0 : 300);
    if (slides[current].id === 'banco') setTimeout(drawDatabase, 750);
  }
  function openDialog(dialog) {
    stopCurrent();
    if (!dialog.open) dialog.showModal();
  }
  function references(id) {
    openDialog(referenceDialog);
    if (id) {
      const target = document.getElementById(id);
      if (target && referenceDialog.contains(target)) {
        if (target.tagName === 'DETAILS') target.open = true;
        target.scrollIntoView({block:'start'});
      }
    } else referenceDialog.scrollTop = 0;
  }
  function fromHash() {
    const value = decodeURIComponent(location.hash.slice(1));
    const id = aliases[value] || value;
    const index = slides.findIndex(slide => slide.id === id);
    if (index >= 0) go(index, false);
    else if (id === 'referencias' || id.startsWith('ref-') || id.startsWith('schema-') || id === 'rotas') references(id);
  }
  function send(command, value) {
    const demo = slides[current].querySelector('[data-demo="map"]');
    if (!demo) return;
    mount(demo);
    const frame = demo.querySelector('iframe');
    frame.contentWindow.postMessage({type:'etal-command', command, value}, '*');
  }
  document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => {
    if (outlineDialog.open) outlineDialog.close();
    go(Number(button.dataset.go));
  }));
  previous.addEventListener('click', () => go(current - 1));
  next.addEventListener('click', () => go(current + 1));
  document.querySelectorAll('[data-references]').forEach(button => button.addEventListener('click', () => references()));
  document.querySelector('[data-outline]').addEventListener('click', () => openDialog(outlineDialog));
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => setTimeout(loadCurrent, 50));
    dialog.addEventListener('click', event => {if (event.target === dialog) dialog.close();});
  });
  document.querySelectorAll('[data-zoom]').forEach(button => button.addEventListener('click', () => {
    const img = button.querySelector('img');
    lightbox.querySelector('img').src = img.src;
    lightbox.querySelector('img').alt = img.alt;
    lightbox.querySelector('[data-image-title]').textContent = img.alt;
    lightbox.querySelector('[data-image-credit]').textContent = button.dataset.credit || 'Captura local do projeto; dados demonstrativos.';
    openDialog(lightbox);
  }));
  referenceDialog.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
    const id = link.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (target && referenceDialog.contains(target)) {
      event.preventDefault();
      if (target.tagName === 'DETAILS') target.open = true;
      target.scrollIntoView({block:'start'});
    }
  }));
  document.querySelector('[data-fullscreen]').addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch (_) {
      const toast = document.querySelector('.toast');
      toast.textContent = 'Use F11 para a tela cheia do navegador.';
      toast.classList.add('show');setTimeout(() => toast.classList.remove('show'), 3500);
    }
  });
  document.querySelectorAll('[data-launch]').forEach(button => button.addEventListener('click', () => mount(button.closest('[data-demo]'))));
  document.querySelectorAll('[data-app-screen]').forEach(button => button.addEventListener('click', () => {
    const demo = button.closest('.slide').querySelector('[data-demo="app"]');
    const frame = demo.querySelector('iframe');
    const url = new URL(frame.dataset.src, location.href);
    url.searchParams.set('tela', button.dataset.appScreen);
    demo.classList.remove('ready');
    frame.dataset.src = url.href;
    frame.src = url.href;
    document.querySelectorAll('[data-app-screen]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  }));
  document.querySelectorAll('[data-command]').forEach(button => button.addEventListener('click', () => {
    send(button.dataset.command, button.dataset.value);
    const group = button.closest('.seg, .quality-buttons');
    if (group) group.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  }));
  document.querySelectorAll('[data-compare] input').forEach(input => input.addEventListener('input', () => input.closest('[data-compare]').style.setProperty('--split', input.value + '%')));
  document.querySelector('[data-gps]').addEventListener('click', event => {
    const button = event.currentTarget;
    const on = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(on));
    document.querySelector('[data-route-art]').classList.toggle('simulating', on);
  });
  document.querySelector('[data-offline]').addEventListener('click', event => {
    const button = event.currentTarget;
    const off = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(off));
    document.querySelector('[data-offline-flow]').classList.toggle('is-offline', off);
    document.querySelector('[data-offline-status]').innerHTML = `<svg class="icon" aria-hidden="true"><use href="#i-${off ? 'wifi-off' : 'wifi'}"/></svg>${off ? 'Sem rede no diagrama · interface e mapa em cache' : 'Diagrama conectado'}`;
    button.firstChild.textContent = off ? 'Reconectar o diagrama' : 'Desligar a rede do diagrama';
  });
  const flows = {
    agenda:{table:'agenda',route:'/api/eu/agenda/{atividade_id}',text:'Relaciona a pessoa à atividade salva, sem repetir o par.'},
    presenca:{table:'pessoas + presencas',route:'/api/presenca',text:'Credencia, se preciso, e grava a presença na atividade após validar o QR.'},
    aviso:{table:'avisos',route:'/api/org/avisos',text:'Grava o texto, autor e atividade opcional. Distribui a atualização ao app.'},
  };
  document.querySelectorAll('[data-flow]').forEach(button => button.addEventListener('click', () => {
    const data = flows[button.dataset.flow];
    document.querySelector('[data-flow-table]').textContent = data.table;
    document.querySelector('[data-flow-description]').textContent = data.text;
    document.querySelector('[data-flow-route]').textContent = data.route;
    document.querySelectorAll('[data-flow]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    if (!reduced.matches) document.querySelector('[data-flow-route]').animate([{opacity:0,transform:'translateX(-8px)'},{opacity:1,transform:'none'}],{duration:400});
  }));
  const tables = {
    pessoas:{title:'Quem entra no evento.',text:'Identidade, origem e papel. O credenciamento no evento fica em credenciado_em.',rule:'Matrícula e e-mail são únicos quando preenchidos.',related:['pessoas']},
    atividades:{title:'O que vai acontecer.',text:'Programação, horário, vagas e local. Andar e zona ligam a atividade à planta do app.',rule:'O id textual é compartilhado pelo app e pela API.',related:['atividades']},
    agenda:{title:'Uma escolha pessoal.',text:'Liga uma pessoa a uma atividade salva. O registro de presença é separado.',rule:'pessoa_id + atividade_id: par único.',related:['pessoas','agenda','atividades']},
    presencas:{title:'A leitura confirmada.',text:'Liga pessoa, atividade, horário e via após a validação da API.',rule:'Uma presença por pessoa e atividade; releitura não duplica.',related:['pessoas','presencas','atividades']},
    links_acesso:{title:'Um link para entrar.',text:'Guarda o hash do token, a validade e o momento em que foi usado.',rule:'1 pessoa → N links; cada token é de uso único.',related:['pessoas','links_acesso']},
    avisos:{title:'A organização fala.',text:'Texto e título do aviso. Autor e atividade são referências opcionais.',rule:'Um aviso pode ser geral, sem atividade vinculada.',related:['pessoas','atividades','avisos']},
    numeros_sala:{title:'O nome que aparece.',text:'Número personalizado pela organização, usando a chave andar:zona.',rule:'Sem FK: a geometria das zonas fica na planta do app.',related:['numeros_sala']},
  };
  document.querySelectorAll('[data-table]').forEach(button => button.addEventListener('click', () => {
    const data = tables[button.dataset.table];
    document.querySelector('[data-db-title]').textContent = data.title;
    document.querySelector('[data-db-description]').textContent = data.text;
    document.querySelector('[data-db-rule]').textContent = data.rule;
    document.querySelector('[data-schema]').dataset.schema = button.dataset.table;
    document.querySelectorAll('[data-table]').forEach(b => b.classList.toggle('selected', data.related.includes(b.dataset.table)));
  }));
  document.querySelector('[data-schema]').addEventListener('click', event => references('schema-' + event.currentTarget.dataset.schema));
  document.querySelectorAll('[data-swagger]').forEach(button => button.addEventListener('click', () => {
    const img = document.querySelector('[data-swagger-image]');
    img.src = new URL(button.dataset.swagger, assetBase).href;
    img.alt = button.dataset.swagger.includes('saude') ? 'GET /api/saude executado no Swagger: resposta HTTP 200 e ok true' : button.dataset.swagger.includes('presenca') ? 'Contrato POST /api/presenca no Swagger' : 'Swagger da API atual do ETAL Connect';
    document.querySelectorAll('[data-swagger]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  }));
  document.querySelector('[data-hour]').addEventListener('input', event => {
    const h = Number(event.target.value);
    document.querySelector('[data-hour-output]').value = `${String(Math.floor(h)).padStart(2,'0')}:${String(Math.round((h%1)*60)).padStart(2,'0')}`;
    cancelAnimationFrame(hourFrame);
    hourFrame = requestAnimationFrame(() => send('hour',h));
  });
  window.addEventListener('message', event => {
    const demo = slides[current].querySelector('[data-demo]');
    if (!demo || event.source !== demo.querySelector('iframe').contentWindow || event.data?.type !== 'etal-demo') return;
    if (event.data.ready) demo.classList.add('ready');
    const status = slides[current].querySelector('[data-map-state]');
    if (status) {
      if (event.data.selected) status.textContent = `Lugar selecionado: ${event.data.selected.replaceAll('-',' ')}`;
      if (event.data.floor != null) status.textContent = `Andar ${event.data.floor === 0 ? 'térreo' : event.data.floor} ${event.data.zone ? '· ambiente selecionado' : ''}`;
      if (event.data.route && event.data.state?.hasRoute) status.textContent = `Rota à sala · entrada ${event.data.route.entrance} · via ${event.data.route.via}`;
    }
  });
  document.addEventListener('keydown', event => {
    if (document.querySelector('dialog[open]') || event.ctrlKey || event.metaKey || event.altKey || /^(INPUT|TEXTAREA|SELECT|SUMMARY)$/.test(event.target.tagName)) return;
    if (event.key === ' ' && /^(BUTTON|A)$/.test(event.target.tagName)) return;
    if (['ArrowRight','PageDown',' '].includes(event.key)) {event.preventDefault();go(current+1);}
    if (['ArrowLeft','PageUp'].includes(event.key)) {event.preventDefault();go(current-1);}
    if (event.key === 'Home') {event.preventDefault();go(0);}
    if (event.key === 'End') {event.preventDefault();go(slides.length-1);}
    if (event.key.toLowerCase() === 'f') document.querySelector('[data-fullscreen]').click();
  });
  shell.addEventListener('wheel', event => {
    if (event.target.closest('input,button,[data-demo]') || document.querySelector('dialog[open]')) return;
    event.preventDefault();
    if (performance.now()-changedAt < 900) {wheelDelta=0;return;}
    wheelDelta += event.deltaY;
    if (Math.abs(wheelDelta)>65) {go(current+(wheelDelta>0?1:-1));wheelDelta=0;}
  },{passive:false});
  shell.addEventListener('touchstart', event => {
    if (event.target.closest('input,button,[data-demo]')) return;
    touchStart={x:event.touches[0].clientX,y:event.touches[0].clientY};
  },{passive:true});
  shell.addEventListener('touchend', event => {
    if (!touchStart) return;
    const dx=event.changedTouches[0].clientX-touchStart.x,dy=event.changedTouches[0].clientY-touchStart.y;
    if (Math.abs(dx)>55 && Math.abs(dx)>Math.abs(dy)) go(current+(dx<0?1:-1));
    touchStart=null;
  },{passive:true});
  window.addEventListener('hashchange',fromHash);
  window.addEventListener('resize',fit);
  window.addEventListener('fullscreenchange',fit);
  fit();go(0,false);fromHash();
})();
