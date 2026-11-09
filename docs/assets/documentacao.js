(() => {
  const slides = [...document.querySelectorAll('.slide')];
  const links = [...document.querySelectorAll('.rail nav a')];
  const output = document.querySelector('.controls output');
  const previous = document.querySelector('[data-prev]');
  const next = document.querySelector('[data-next]');
  const toggle = document.querySelector('[data-present]');
  let current = 0;
  let presenting = false;
  const aliases = {'README':'visao','01-requisitos':'estado','02-casos-de-uso':'casos','03-banco-de-dados':'banco','04-arquitetura':'arquitetura','05-api':'api','06-testes':'verificacao'};
  function fitPresentation() {
    slides.forEach(slide => {slide.style.zoom = ''; slide.style.minHeight = '';});
    if (!presenting || innerWidth <= 850) return;
    const active = slides[current];
    const available = Math.max(300, innerHeight - 143);
    const scale = Math.min(1, available / active.offsetHeight);
    active.style.zoom = String(scale);
    active.style.minHeight = `${available / scale}px`;
  }
  function activate(index, navigate = false) {
    current = Math.max(0, Math.min(index, slides.length - 1));
    slides.forEach((slide, i) => slide.classList.toggle('active', i === current));
    links.forEach((link, i) => i === current ? link.setAttribute('aria-current', 'step') : link.removeAttribute('aria-current'));
    output.value = `${String(current + 1).padStart(2, '0')} / ${slides.length}`;
    previous.disabled = current === 0;
    next.disabled = current === slides.length - 1;
    document.documentElement.style.setProperty('--progress', (current + 1) / slides.length);
    fitPresentation();
    if (navigate) {
      history.replaceState(null, '', `#${slides[current].id}`);
      if (!presenting) slides[current].scrollIntoView({block:'start'});
      else window.scrollTo(0, 0);
    }
  }
  previous.addEventListener('click', () => activate(current - 1, true));
  next.addEventListener('click', () => activate(current + 1, true));
  toggle.addEventListener('click', () => {
    presenting = !presenting;
    document.body.classList.toggle('presenting', presenting);
    toggle.textContent = presenting ? 'Voltar à leitura' : 'Apresentar ↗';
    toggle.setAttribute('aria-pressed', String(presenting));
    activate(current, true);
  });
  function fromHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    const index = slides.findIndex(slide => slide.id === (aliases[id] || id));
    if (index >= 0) activate(index, true);
    else {
      const target = document.getElementById(id);
      if (target && target.closest('.reference')) {
        if (presenting) {toggle.click(); history.replaceState(null, '', `#${id}`);}
        if (target.tagName === 'DETAILS') target.open = true;
        requestAnimationFrame(() => target.scrollIntoView({block:'start'}));
      }
    }
  }
  links.forEach((link, index) => link.addEventListener('click', event => {
    event.preventDefault(); activate(index, true);
  }));
  document.querySelectorAll('a[href^="#schema-"]').forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    if (presenting) toggle.click();
    history.replaceState(null, '', link.getAttribute('href'));
    fromHash();
  }));
  const observer = new IntersectionObserver(entries => {
    if (presenting) return;
    const visible = entries.filter(entry => entry.isIntersecting && entry.intersectionRatio > .45);
    if (visible.length) activate(slides.indexOf(visible.sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0].target));
  }, {threshold:[.45,.6,.8]});
  slides.forEach(slide => observer.observe(slide));
  const dialog = document.querySelector('#ampliar');
  document.querySelectorAll('[data-zoom]').forEach(button => button.addEventListener('click', () => {
    const image = button.querySelector('img');
    const large = dialog.querySelector('img');
    large.src = image.src; large.alt = image.alt;
    dialog.querySelector('[data-caption]').textContent = image.alt;
    dialog.showModal();
  }));
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  document.querySelector('[data-print]').addEventListener('click', () => window.print());
  document.addEventListener('keydown', event => {
    if (dialog.open || !presenting || event.altKey || event.ctrlKey || event.metaKey || /^(INPUT|TEXTAREA|SELECT|SUMMARY|A)$/.test(event.target.tagName)) return;
    if (event.target.tagName === 'BUTTON' && event.key === ' ') return;
    if (['ArrowRight','PageDown',' '].includes(event.key)) {event.preventDefault(); activate(current + 1, true);}
    if (['ArrowLeft','PageUp'].includes(event.key)) {event.preventDefault(); activate(current - 1, true);}
    if (event.key === 'Home') {event.preventDefault(); activate(0, true);}
    if (event.key === 'End') {event.preventDefault(); activate(slides.length - 1, true);}
    if (event.key === 'Escape') toggle.click();
  });
  window.addEventListener('hashchange', fromHash);
  window.addEventListener('resize', fitPresentation);
  document.fonts.ready.then(fitPresentation);
  activate(0); fromHash();
})();
