import * as THREE from 'three';
import { PLAN, BUILDINGS, COVERS, FLATS, wp, FH, zonePoly, centroid } from './dados.js';
import { planejar } from './rotas.js';
const $=s=>document.querySelector(s);
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const floorName=l=>l?`${l}º andar`:'Térreo';
const safeRead=(k,fallback)=>{try{return JSON.parse(localStorage.getItem(k))??fallback;}catch{return fallback;}};
export function iniciarInterface(ctx){
 const {scene,camera,controls,renderer,principal,viagem,veg,entorno,sol,DESAT,pedir,nivel,hora,irPara,VISTAS}=ctx;
 let selected=null,flat=false,mode='evento',currentFloor=1,route=null,lastFrame=0,samples=[],autoLevel=0,stackAnim=null;
 let sessions=window.DATA?.sessions||[];
 const prefs=safeRead('etal-mapa-novo',{});
 const save=()=>{try{localStorage.setItem('etal-mapa-novo',JSON.stringify({quality:$('#qualidade').value,reduced:$('#reduzir').checked,hour:+$('#hora').value}));}catch{}};
 const toast=text=>{$('#toast').textContent=text;$('#toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').hidden=true,4000);};
 const catalog=()=>[
  ...PLAN.floors.flatMap((f,level)=>f.zones.filter(z=>!z.closed&&(z.roomNumber||z.kind==='restroom')).map(z=>({kind:'room',level,id:z.id,title:z.roomNumber?`Sala ${z.roomNumber}`:z.label,sub:z.name||z.label,zone:z}))),
  ...sessions.filter(s=>Number.isInteger(s.floor)&&s.zone).map(s=>({kind:'activity',level:s.floor,id:s.zone,title:s.title,sub:`${s.time} · ${floorName(s.floor)} · exemplo`,activity:s})),
  ...[...BUILDINGS,...COVERS,...FLATS].filter(b=>b.label).map(b=>({kind:'place',id:b.id,title:b.label,sub:'Campus',building:b}))];
 function select(item){
  selected=item;route=null;viagem.limpar();stackAnim=null;$('#resultados').hidden=true;$('#busca').blur();$('#titulo').textContent=item.title;$('#descricao').textContent=item.sub;$('#ir').disabled=item.kind==='place';$('#ir').textContent='Como chegar';$('#via-wrap').hidden=item.kind==='place'||!item.level;
  $('#limpar').hidden=false;$('#pular').hidden=true;$('#repetir').hidden=true;$('#etapas').hidden=true;$('#etapas-texto').hidden=true;$('#etapa-atual').textContent='';
  if(item.kind==='place'){
   $('#meta').textContent='Explore o campus';const p=centroid(item.building.p);irPara({p:[p[0]+40,55,p[1]+65],t:[p[0],2,p[1]]});
  }else{
   currentFloor=item.level;const z=PLAN.floors[item.level].zones.find(z=>z.id===item.id);if(!z){toast('Sala não encontrada.');return;}
   const r=planejar(item.level,item.id,$('#via').value||null);$('#ir').disabled=!r;
   $('#meta').textContent=r?`${floorName(item.level)} · ${Math.ceil(r.metros)} m · cerca de ${r.minutos} min da portaria`:`${floorName(item.level)} · percurso ainda não confirmado`;
   nivel(String(item.level));const p=centroid(zonePoly(z).map(wp));irPara({p:[p[0]+12,65,p[1]+50],t:[p[0],item.level*FH,p[1]]});
  }
  if(flat)drawFlat();pedir();
 }
 function go({instant=false}={}){
  if(!selected||selected.kind==='place')return false;
  stackAnim=null;route=viagem.ir(selected.level,selected.id,{forcar:$('#via').value||null});
  if(!route){toast('Não há um percurso confirmado para esta sala.');return false;}
  if(flat||instant)viagem.pular();$('#pular').hidden=flat||instant;$('#via-wrap').open=false;$('#repetir').hidden=true;$('#etapas').hidden=false;
  $('#meta').textContent=`${floorName(selected.level)} · ${route.via?'pela '+route.via+' · ':''}${Math.ceil(route.metros)} m · cerca de ${route.minutos} min`;
  const instructions=[`Comece na portaria de pedestres.`,`Siga até a ${route.entrada}.`,...(route.via?[`Suba pela ${route.via} até o ${floorName(route.level)}.`]:[]),`Siga pelo corredor até ${route.zona.roomNumber?'a sala '+route.zona.roomNumber:route.zona.label}.`];
  $('#etapas-texto').replaceChildren(...instructions.map(t=>{const li=document.createElement('li');li.textContent=t;return li;}));
  if(flat)drawFlat();return true;
 }
 function clear(){viagem.limpar();route=null;selected=null;$('#titulo').textContent='Seu próximo encontro';$('#descricao').textContent='Escolha uma sala ou atividade para descobrir o caminho.';$('#meta').textContent='Campus Pau dos Ferros · programação demonstrativa';$('#ir').disabled=true;['pular','repetir','etapas','limpar','via-wrap','etapas-texto'].forEach(id=>$('#'+id).hidden=true);$('#etapa-atual').textContent='';if(flat)drawFlat();}
 $('#busca').addEventListener('input',()=>{
  const q=norm($('#busca').value).trim();$('#resultados').replaceChildren();$('#resultados').hidden=!q;if(!q)return;
  const result=catalog().filter(x=>norm(x.title+' '+x.sub).includes(q)).slice(0,18);
  for(const item of result){const b=document.createElement('button');b.type='button';b.textContent=item.title;const sub=document.createElement('small');sub.textContent=item.sub+(item.kind==='room'?' · '+floorName(item.level):'');b.append(sub);b.onclick=()=>select(item);$('#resultados').append(b);}
  if(!result.length)$('#resultados').textContent='Nenhum resultado. Tente o número da sala ou o nome do setor.';
 });
 $('#busca').addEventListener('keydown',e=>{if(e.key==='Enter')$('#resultados button')?.click();if(e.key==='Escape')$('#resultados').hidden=true;if(e.key==='ArrowDown'){e.preventDefault();$('#resultados button')?.focus();}});
 $('#ir').onclick=()=>go();$('#via').onchange=()=>{if(selected){if(route)go();else{const item=selected;select(item);}}};
 $('#pular').onclick=()=>viagem.pular();$('#repetir').onclick=()=>{if(route){viagem.repetir();$('#pular').hidden=flat;if(flat)viagem.pular();}};
 $('#limpar').onclick=clear;
 $('#etapas').onclick=()=>{$('#etapas-texto').hidden=!$('#etapas-texto').hidden;$('#etapas').setAttribute('aria-expanded',!$('#etapas-texto').hidden);};
 $('#recolher').onclick=()=>{const c=$('#cartao').classList.toggle('recolhido');$('#recolher').setAttribute('aria-expanded',!c);$('#recolher').textContent=c?'⌃':'⌄';};
 document.addEventListener('mapa:etapa',e=>{$('#etapa-atual').textContent=e.detail.text;$('#passos .agora')?.scrollIntoView({block:'nearest',inline:'nearest'});});
 document.addEventListener('mapa:chegada',()=>{$('#pular').hidden=true;$('#repetir').hidden=false;$('#etapa-atual').textContent='Destino destacado · entre pela porta marcada';});
 $('#ajustes-btn').onclick=()=>{$('#ajustes').hidden=!$('#ajustes').hidden;$('#ajustes-btn').setAttribute('aria-expanded',!$('#ajustes').hidden);};
 $('#reduzir').checked=prefs.reduced??matchMedia('(prefers-reduced-motion: reduce)').matches;$('#reduzir').onchange=()=>{save();if($('#reduzir').checked)viagem.pular();};
 function quality(){
  const q=$('#qualidade').value;const mobile=matchMedia('(pointer:coarse)').matches||innerWidth<600;
  const n=q==='alta'?0:q==='media'?1:q==='leve'?2:Math.max(mobile?1:0,autoLevel);
  renderer.setPixelRatio(Math.min(devicePixelRatio,[1.8,1.25,1][n]));renderer.setSize($('#tela').clientWidth,$('#tela').clientHeight,false);
  renderer.shadowMap.enabled=$('#sombras').checked&&n<2;sol.castShadow=renderer.shadowMap.enabled;
  const size=[2048,1024,512][n];if(sol.shadow.mapSize.x!==size){sol.shadow.mapSize.set(size,size);sol.shadow.map?.dispose();sol.shadow.map=null;}
  for(const group of [veg,entorno])group.traverse(o=>{if(!o.isInstancedMesh)return;o.userData.fullCount??=o.count;o.count=group===entorno?Math.ceil(o.userData.fullCount*[1,.45,.15][n]):o.userData.fullCount;o.castShadow=n===0&&group===veg;});
  renderer.shadowMap.needsUpdate=true;pedir();return n;
 }
 $('#qualidade').value=prefs.quality||'auto';$('#qualidade').onchange=()=>{autoLevel=0;samples=[];quality();save();};$('#sombras').onchange=quality;
 $('#hora').value=prefs.hour??15;$('#hora').dispatchEvent(new Event('input'));$('#hora').addEventListener('change',save);
 quality();let qualityTimer=setInterval(quality,1500);setTimeout(()=>clearInterval(qualityTimer),12000);
 const labels=[];
 /* etiquetas do evento, como no mapa do app: pílula na cor do lugar, com a seta */
 const noBloco=(px,py,h)=>{const w=wp([px,py]);return new THREE.Vector3(w[0],h,w[1]);};
 const meio=(id,h)=>{const b=[...BUILDINGS,...COVERS].find(q=>q.id===id);const c=centroid(b.p);return new THREE.Vector3(c[0],h,c[1]);};
 [{id:'principal',t:'Bloco principal',cor:'verde',p:noBloco(620,300,13)},{id:'auditorio',t:'Auditório',cor:'azul',p:noBloco(118,200,10.5)},{id:'cantina',t:'Cantina',cor:'mel',p:meio('cantina',6)},{id:'patio',t:'Pátio',cor:'patio',p:meio('patio',8.6)},{id:'obelisco',t:'Obelisco',cor:'vermelho',p:meio('obelisco',6.6)}].forEach(q=>{
  const el=document.createElement('button');el.textContent=q.t+' ›';el.className='pilula '+q.cor;const b=BUILDINGS.find(x=>x.id===q.id);if(b)el.onclick=()=>select({kind:'place',id:b.id,title:b.label,sub:'Campus',building:b});$('#rotulos').append(el);labels.push({el,p:q.p});});
 // Pick only a tap, never a drag. Room hit planes are independent of merged model meshes.
 const picks=[];const pickGroup=new THREE.Group();scene.add(pickGroup);
 PLAN.floors.forEach((f,l)=>f.zones.filter(z=>z.roomNumber).forEach(z=>{const poly=zonePoly(z).map(wp);const g=new THREE.ShapeGeometry(new THREE.Shape(poly.map(p=>new THREE.Vector2(...p))));g.rotateX(Math.PI/2);g.translate(0,l*FH+principal.altoSala+.1,0);const mesh=new THREE.Mesh(g,new THREE.MeshBasicMaterial({side:THREE.DoubleSide,visible:false}));mesh.userData={level:l,zone:z};pickGroup.add(mesh);picks.push(mesh);}));
 const ray=new THREE.Raycaster();let down=null;
 $('#tela').addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,time:performance.now()};});
 $('#tela').addEventListener('pointerup',e=>{
  if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>6||performance.now()-down.time>500)return;down=null;
  if(viagem.estado()&&!viagem.estado().fim)return;
  if(principal.nivel()==='tudo')return;
  const r=$('#tela').getBoundingClientRect();ray.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);
  const hits=ray.intersectObjects(picks.filter(m=>principal.nivel()==='separados'||m.userData.level===currentFloor));
  if(hits.length){const {zone:z,level}=hits[0].object.userData;select({kind:'room',level,id:z.id,title:'Sala '+z.roomNumber,sub:z.name||z.label,zone:z});}
 });
 function setMode(m){mode=m;stackAnim=null;viagem.limpar();route=null;ctx.estilo.setMode(m==='campus'?'campus':'evento');document.querySelectorAll('[data-modo]').forEach(b=>{b.classList.toggle('on',b.dataset.modo===m);b.setAttribute('aria-pressed',b.dataset.modo===m);});if(m==='andares'&&!flat){irPara({p:[35,105,60],t:[-7,14,-29]});stackAnim={start:performance.now()};if($('#reduzir').checked){principal.separar();stackAnim=null;}}else if(m==='campus')irPara(VISTAS.campus);else irPara(VISTAS.bloco);pedir();}
 document.querySelectorAll('[data-modo]').forEach(b=>b.onclick=()=>setMode(b.dataset.modo));
 document.querySelectorAll('[data-nivel]').forEach(b=>b.addEventListener('click',()=>{stackAnim=null;currentFloor=b.dataset.nivel==='tudo'?0:+b.dataset.nivel;if(flat)drawFlat();else irPara(VISTAS.bloco);route=null;$('#pular').hidden=true;$('#repetir').hidden=true;}));
 function setFlat(value){flat=value;$('#flat').setAttribute('aria-pressed',flat);$('#flat').textContent=flat?'3D':'2D';$('#tela').hidden=flat;$('#planta2d').toggleAttribute('hidden',!flat);$('#ficha').hidden=true;$('#rotulos').hidden=flat;if(flat){stackAnim=null;viagem.pular();drawFlat();}else{viagem.resize();pedir();}}
 $('#flat').onclick=()=>setFlat(!flat);
 function drawFlat(){
  const svg=$('#planta2d');svg.replaceChildren();svg.setAttribute('viewBox','0 0 960 660');const ns='http://www.w3.org/2000/svg';const f=PLAN.floors[currentFloor];
  for(const z of [...f.corridors,...f.zones]){const pts=z.points||`${z.x},${z.y} ${z.x+z.w},${z.y} ${z.x+z.w},${z.y+z.h} ${z.x},${z.y+z.h}`;const p=document.createElementNS(ns,'polygon');p.setAttribute('points',pts);p.setAttribute('fill',z.id===selected?.id?'#8abb7a':z.kind==='courtyard'?'#cbdcb8':z.kind?'#faf8ed':'#e0e5d8');svg.append(p);
   if(z.roomNumber){p.setAttribute('tabindex','0');p.setAttribute('role','button');p.setAttribute('aria-label',`Sala ${z.roomNumber}, ${z.name||z.label}`);const action=()=>select({kind:'room',level:currentFloor,id:z.id,title:'Sala '+z.roomNumber,sub:z.name||z.label,zone:z});p.onclick=action;p.onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();action();}};const c=centroid(zonePoly(z));const t=document.createElementNS(ns,'text');t.setAttribute('x',c[0]);t.setAttribute('y',c[1]);t.setAttribute('text-anchor','middle');t.textContent=z.roomNumber;svg.append(t);}}
  if(route){const segments=[];let curr=[];for(const q of route.pts){if(Math.abs(q[1]-(currentFloor*FH+.03))<.15){curr.push(`${(q[0]-PLAN.world.x0)/PLAN.world.sx},${(q[2]-PLAN.world.y0)/PLAN.world.sy}`);}else if(curr.length){segments.push(curr);curr=[];}}if(curr.length)segments.push(curr);for(const pts of segments){const p=document.createElementNS(ns,'polyline');p.setAttribute('points',pts.join(' '));p.setAttribute('fill','none');p.setAttribute('stroke','#397d4b');p.setAttribute('stroke-width','5');p.setAttribute('stroke-linejoin','round');svg.append(p);}}
 }
 addEventListener('keydown',e=>{if(e.key==='Escape')$('#voltar').click();});
 $('#voltar').onclick=()=>{if(window.parent!==window){window.parent.postMessage({type:'etal:mapa:fechar'},location.origin);}else if(history.length>1)history.back();else location.href='../prototipo/?tela=mapa';};
 // Explicit, same-origin integration contract; identifiers, never display numbers, are exchanged.
 const api={route:(l,z,via=null)=>{const item=catalog().find(x=>x.kind==='room'&&x.level===l&&x.id===z);if(!item)return false;$('#via').value=via||'';select(item);return go();},focus:id=>{const x=catalog().find(x=>x.kind==='place'&&x.id===id);if(x)select(x);},clearRoute:clear,setMode,setHour:hora,setFlat,goFloor:l=>{currentFloor=l;nivel(String(l));if(flat)drawFlat();},syncRooms:rooms=>{for(const f of PLAN.floors)for(const z of f.zones){const n=rooms?.[`${f.level}:${z.id}`];if(n)z.roomNumber=String(n);}principal.syncRooms();if(selected){const z=PLAN.floors[selected.level]?.zones.find(z=>z.id===selected.id);if(z&&selected.kind==='room')$('#titulo').textContent='Sala '+z.roomNumber;}if(flat)drawFlat();}};
 window.CampusNovo=api;
 window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==parent||!['etal:mapa:abrir','etal:mapa:sincronizar'].includes(e.data?.type))return;const d=e.data;if(Array.isArray(d.sessions))sessions=d.sessions;api.syncRooms(d.rooms);if(d.type==='etal:mapa:sincronizar'){if(selected?.activity){const a=sessions.find(s=>s.id===selected.activity.id);if(a&&(a.floor!==selected.level||a.zone!==selected.id)){toast('A atividade mudou de sala. Percurso atualizado.');select({kind:'activity',level:a.floor,id:a.zone,title:a.title,sub:a.time,activity:a});go();}}return;}if(d.hour!=null)hora(d.hour);if(d.reduced!=null)$('#reduzir').checked=!!d.reduced;if(Number.isInteger(d.floor)&&typeof d.zone==='string'){const activity=sessions.find(s=>s.floor===d.floor&&s.zone===d.zone&&(!d.activity||s.id===d.activity));if(activity){select({kind:'activity',level:d.floor,id:d.zone,title:activity.title,sub:`${activity.time} · ${floorName(d.floor)}`,activity});go();}else api.route(d.floor,d.zone,d.via);}else if(d.place)api.focus(d.place);});
 if(parent!==window)parent.postMessage({type:'etal:mapa:pronto'},location.origin);
 const svg=$('#planta2d');let pan=null;
 svg.addEventListener('wheel',e=>{e.preventDefault();const v=svg.viewBox.baseVal,k=e.deltaY>0?1.12:.89;if(v.width*k<180||v.width*k>2400)return;const cx=v.x+v.width/2,cy=v.y+v.height/2;svg.setAttribute('viewBox',`${cx-v.width*k/2} ${cy-v.height*k/2} ${v.width*k} ${v.height*k}`);},{passive:false});
 svg.addEventListener('pointerdown',e=>{const v=svg.viewBox.baseVal;pan={x:e.clientX,y:e.clientY,v:[v.x,v.y,v.width,v.height],moved:false};});
 svg.addEventListener('pointermove',e=>{if(!pan)return;const dx=e.clientX-pan.x,dy=e.clientY-pan.y;if(Math.hypot(dx,dy)<6)return;pan.moved=true;const k=Math.max(pan.v[2]/svg.clientWidth,pan.v[3]/svg.clientHeight);svg.setAttribute('viewBox',`${pan.v[0]-dx*k} ${pan.v[1]-dy*k} ${pan.v[2]} ${pan.v[3]}`);});
 svg.addEventListener('click',e=>{if(pan?.moved){e.preventDefault();e.stopImmediatePropagation();}pan=null;},true);
 svg.addEventListener('pointercancel',()=>pan=null);
 const params=new URLSearchParams(location.search);if(params.get('aba')==='1')$('#voltar').hidden=true; // dentro da aba Mapa do app não há para onde voltar
if(params.has('sala'))api.route(+(params.get('andar')||1),params.get('sala'),params.get('via'));if(params.get('2d')==='1')setFlat(true);
 addEventListener('resize',()=>{viagem.resize();quality();});
 $('#tela').addEventListener('webglcontextlost',e=>{e.preventDefault();$('#fallback').hidden=false;});
 return {api,select,go,setFlat,quality,quadro(now){
  if(stackAnim){const t=Math.min(1,(now-stackAnim.start)/700);principal.separar(t*t*(3-2*t));picks.forEach(m=>m.position.y=m.userData.level*9*t);if(t===1)stackAnim=null;else pedir();}else if(principal.nivel()!=='separados')picks.forEach(m=>m.position.y=0);
  if(flat)$('#ficha').hidden=true;
  const occupied=[];for(const l of labels){const p=l.p.clone().project(camera),x=(p.x*.5+.5)*innerWidth,y=(-p.y*.5+.5)*innerHeight;const valid=!flat&&!viagem.ativa()&&p.z>-1&&p.z<1&&x>65&&x<innerWidth-65&&y>135&&y<innerHeight-235&&!occupied.some(o=>Math.abs(o.x-x)<110&&Math.abs(o.y-y)<35);l.el.hidden=!valid;if(valid){l.el.style.left=x+'px';l.el.style.top=y+'px';occupied.push({x,y});}}
  const dt=now-lastFrame;lastFrame=now;if(dt>0&&dt<1000&&viagem.estado()&&!viagem.estado().fim){samples.push(dt);if(samples.length>=24){const avg=samples.reduce((a,b)=>a+b)/samples.length;$('#fps').textContent=`${Math.round(1000/avg)} fps durante o percurso`;if($('#qualidade').value==='auto'&&avg>38&&autoLevel<2){autoLevel++;quality();}samples=[];}}
 }};
}
