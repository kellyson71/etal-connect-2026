(() => {
  'use strict';
  const C = window.Campus3D;
  const query = new URLSearchParams(location.search);
  let routeVia = null;
  const notify = (value) => parent.postMessage({type:'etal-demo', ...value}, '*');
  C.attach(document.getElementById('map'), {
    onPick(id) { C.select(id); C.focus(id); notify({selected:id}); },
    onFloor(level) { C.goFloor(level); notify({floor:level}); },
    onRoom(level, zone) { C.room(level, zone); notify({floor:level, zone}); },
    skipGrow:true,
  });
  C.setHour(Number(query.get('hour') || 14));
  C.setMode(query.get('mode') || 'evento');
  const initial = query.get('view');
  if (initial === 'floors') C.openStack();
  if (initial === 'entorno') {
    C.setMode('campus'); C.focus('apartamentos');
    setTimeout(() => C.setView({...C.getView(),t:3.5}),900);
  }
  if (initial === 'route') C.journey(2, 'labs-norte-2');
  if (initial === 'garden') { C.setMode('campus'); C.setView({...C.getView(),x:3,y:23,z:7,t:.5,k:.64,hv:1}); }
  if (query.has('clean')) document.getElementById('stamp').hidden = true;
  window.addEventListener('message', async (event) => {
    if (event.source !== parent || event.data?.type !== 'etal-command') return;
    const {command, value} = event.data;
    switch (command) {
      case 'mode': if (['evento','campus'].includes(value)) {await C.toCampus();C.setMode(value);} break;
      case 'floors': C.openStack(); break;
      case 'floor': if ([0,1,2].includes(Number(value))) C.goFloor(Number(value)); break;
      case 'route': routeVia = ['rampa','escada'].includes(value)?value:null; C.journey(2,'labs-norte-2',{via:routeVia}); break;
      case 'hour': if (Number.isFinite(Number(value))) C.setHour(Math.max(0,Math.min(24,Number(value)))); break;
      case 'quality': if (['alta','media','leve','simples'].includes(value)) C.setQuality(value); break;
      case 'flat': C.setFlat(Boolean(value)); break;
      case 'rotate': C.rotate(45); break;
      case 'zoom': C.zoom(value==='in'?1.4:.72); break;
      case 'fit': C.fit(); break;
    }
    notify({state:C.state(),quality:C.quality(),route:C.routeInfo(2,'labs-norte-2',routeVia)});
  });
  notify({ready:true,quality:C.quality()});
})();
