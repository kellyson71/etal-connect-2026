/* Viagem guiada por etapas. A câmera enquadra o trecho, sem perseguir a linha. */
import * as THREE from 'three';
import { planejar } from './rotas.js';
import { PLAN, wp, zonePoly, centroid } from './dados.js';
import { GAP, ROOM_H, mapHeight } from './interior.js';
const COR = 0x4d971f;
const clamp = t => Math.max(0, Math.min(1,t));
const ease = t => { t=clamp(t); return t*t*t*(t*(t*6-15)+10); };
const phase = (u,a,b) => ease((u-a)/(b-a));
const vector = p => new THREE.Vector3(...p);
function amostrar(pts) {
  // Interpolação linear conserva o trajeto validado e não corta quinas de paredes.
  const result=[vector(pts[0])];
  for(let i=1;i<pts.length;i++) { const a=vector(pts[i-1]), b=vector(pts[i]); const n=Math.max(1,Math.ceil(a.distanceTo(b)/0.3)); for(let j=1;j<=n;j++)result.push(a.clone().lerp(b,j/n)); }
  return result;
}
function fita(P,width,offset,material) {
  const positions=[],indices=[];
  P.forEach((p,i)=>{const a=P[Math.max(0,i-1)],b=P[Math.min(P.length-1,i+1)];const dx=b.x-a.x,dz=b.z-a.z,L=Math.hypot(dx,dz)||1;
    positions.push(p.x-dz/L*width/2,p.y+offset,p.z+dx/L*width/2,p.x+dz/L*width/2,p.y+offset,p.z-dx/L*width/2);
    if(i){const k=(i-1)*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}});
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);
  const m=new THREE.Mesh(g,material);m.frustumCulled=false;return m;
}
/* A viagem segue a do mapa original do app, em quatro atos:
   1. no campus, a linha sai da portaria e chega à entrada do bloco;
   2. o campus some e o bloco aparece aberto em andares (só os necessários), visto de longe;
   3. a linha anda pelo térreo e sobe pela escada ou rampa, com a câmera parada mostrando a subida inteira;
   4. a câmera desce para o andar de destino, a linha chega à porta e a sala sobe na cor do evento.
   A câmera olha sempre do mesmo lado (o da entrada): nada gira, só aproxima. */
export function criarViagem({scene,camera,controls,principal,interior,estilo,pedir,sombras,ficha,passos,aoNivel}) {
 const grupo=new THREE.Group();grupo.name='viagem';scene.add(grupo);
 const line=new THREE.MeshBasicMaterial({color:COR,side:THREE.DoubleSide,fog:false});
 const border=new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide,fog:false});
 const hidden=new THREE.MeshBasicMaterial({color:COR,side:THREE.DoubleSide,transparent:true,opacity:.22,depthWrite:false,depthFunc:THREE.GreaterDepth,fog:false});
 let st=null,last=null;const vector=p=>new THREE.Vector3(...p);
 const AZ=.3; // um pouco à direita de quem olha da rodovia
 const reduced=()=>document.querySelector('#reduzir')?.checked;
 const blend=(a,b,t)=>({p:a.p.clone().lerp(b.p,t),t:a.t.clone().lerp(b.t,t)});
 const mix=(a,b,t)=>a+(b-a)*t;
 function clearGeometry(){for(const c of [...grupo.children]){grupo.remove(c);c.geometry?.dispose();}}
 function limpar(){clearGeometry();st=null;controls.enabled=true;interior.view({ops:[0,0,0],elos:[0,0]});estilo.isolate(0);ficha.hidden=true;passos.hidden=true;document.body.classList.remove('em-viagem');aoNivel('tudo');sombras();pedir();}
 /* enquadra um conjunto de pontos na área livre da tela (fora do cartão e da busca) */
 function frame(points,{elevation=52,min=24,folga=1.12}={}){
  const box=new THREE.Box3().setFromPoints(points),center=box.getCenter(new THREE.Vector3());
  const e=THREE.MathUtils.degToRad(elevation),D=new THREE.Vector3(Math.sin(AZ)*Math.cos(e),Math.sin(e),Math.cos(AZ)*Math.cos(e));
  const right=new THREE.Vector3(D.z,0,-D.x).normalize(),up=new THREE.Vector3().crossVectors(D,right).normalize();
  const W=innerWidth,H=innerHeight,card=document.querySelector('#cartao').getBoundingClientRect();const estreita=W<700;
  const top=estreita?150:90,bottom=estreita?H-card.top+16:40,left=estreita?16:Math.min(W*.42,card.right+24),rightPad=70;
  const usableH=Math.max(.3,(H-top-bottom)/H),usableW=Math.max(.3,(W-left-rightPad)/W);
  const tan=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));let distance=min/(2*tan*Math.min(usableH,camera.aspect*usableW));
  for(const p of points){const v=p.clone().sub(center);distance=Math.max(distance,Math.abs(v.dot(right))*folga/(tan*camera.aspect*usableW)+v.dot(D),Math.abs(v.dot(up))*folga/(tan*usableH)+v.dot(D));}
  const ndcY=(bottom-top)/H,ndcX=(left-rightPad)/W;
  const target=center.clone().addScaledVector(up,-ndcY*distance*tan).addScaledVector(right,-ndcX*distance*tan*camera.aspect);
  return {t:target,p:target.clone().addScaledVector(D,distance)};
 }
 function path(pts){const P=amostrar(pts),acc=[0];for(let i=1;i<P.length;i++)acc.push(acc.at(-1)+P[i].distanceTo(P[i-1]));
  const meshes=[fita(P,1.25,.16,border),fita(P,.72,.19,line),fita(P,.72,.19,hidden)];meshes.forEach((m,i)=>{m.renderOrder=20+i;m.geometry.setDrawRange(0,0);grupo.add(m);});
  const at=f=>{const d=clamp(f)*acc.at(-1);let i=1;while(i<acc.length-1&&acc[i]<d)i++;return P[i-1].clone().lerp(P[i],clamp((d-acc[i-1])/Math.max(.001,acc[i]-acc[i-1])));};
  return {P,acc,meshes,at,show(f,visible=true){const d=clamp(f)*acc.at(-1);let i=0;while(i<acc.length-1&&acc[i]<d)i++;meshes.forEach(m=>{m.visible=visible;m.geometry.setDrawRange(0,i*6);});},near(p){const v=vector(p);let i=0,dist=Infinity;P.forEach((q,k)=>{const d=q.distanceToSquared(v);if(d<dist){dist=d;i=k;}});return acc[i]/acc.at(-1);}};
 }
 function poses(s){const q=s.plano;
  const pe=(l)=>PLAN.floors[Math.min(l,1)].outlinePts.map(p=>{const w=wp(p);return new THREE.Vector3(w[0],l*GAP,w[1]);});
  const pilha=[...pe(0),...(q.level?pe(q.level):[])];
  s.A=frame([...s.exterior.P,...pe(0)],{elevation:50,min:40});                 // campus: da portaria ao bloco
  s.S=frame(pilha,{elevation:q.level?38:50,min:36,folga:1.08});                // bloco aberto em andares, de longe
  s.F=frame(pe(q.level).concat(PLAN.floors[q.level].outlinePts.slice(0,1).map(p=>{const w=wp(p);return new THREE.Vector3(w[0],q.level*GAP+ROOM_H,w[1]);})),{elevation:56,min:34,folga:1.06}); // o andar de destino
  const sala=q.poly.map(p=>new THREE.Vector3(p[0],q.level*GAP+ROOM_H,p[1]));const fim=s.transformed.slice(q.iChega).map(vector);
  const F2=frame([...sala,...fim],{elevation:56,min:30,folga:1.5});s.R=blend(s.F,F2,.55);                                           // perto da sala, sem perder o andar de vista
 }
 function ir(level,id,{forcar=null,animate=false}={}){
  const plano=planejar(level,id,forcar);if(!plano)return null;
  limpar();controls.enableDamping=false;controls.update();controls.enableDamping=true;last={level,id,forcar};
  document.body.classList.add('em-viagem');interior.select(level,plano.zona.id);
  const transformed=plano.pts.map(([x,y,z])=>[x,mapHeight(y),z]);
  const exterior=path(plano.pts.slice(0,plano.iEntrada+1));const indoor=path(transformed.slice(plano.iEntrada));
  const dot=new THREE.Mesh(new THREE.SphereGeometry(.7,18,12),new THREE.MeshBasicMaterial({color:0x22386f,depthTest:false,fog:false}));dot.renderOrder=30;grupo.add(dot);
  const aro=new THREE.Mesh(new THREE.SphereGeometry(1,18,12),new THREE.MeshBasicMaterial({color:0xffffff,depthTest:false,fog:false}));aro.renderOrder=29;grupo.add(aro);
  /* tempos de cada ato, em ms: voo, linha no campus, abrir o bloco, térreo, subida, corredor, chegada */
  const metros=indoor.acc.at(-1);const walk=indoor.near(transformed[plano.iSobe]),climb=indoor.near(transformed[plano.iChega]);
  const times=[900,2600,1500,Math.max(1400,walk*metros*38),level?2300+level*900:0,Math.max(1500,(1-climb)*metros*45),1100];
  const boundaries=[0];times.forEach(t=>boundaries.push(boundaries.at(-1)+t));
  st={plano,transformed,exterior,indoor,dot,aro,level,elapsed:0,lastTime:performance.now(),duration:boundaries.at(-1),dur:boundaries.at(-1),boundaries,times,paused:false,speed:1,fim:false,etapa:-1,walk,climb,
   de:{p:camera.position.clone(),t:controls.target.clone()},centro:new THREE.Vector3(plano.centro[0],level*GAP+ROOM_H+2.2,plano.centro[1])};
  poses(st);controls.enabled=false;
  const andar=level?level+'º andar':'Térreo';const sala=plano.zona.roomNumber?'Sala '+plano.zona.roomNumber:plano.zona.label;
  const labels=['Portaria','Portaria',plano.entrada[0].toUpperCase()+plano.entrada.slice(1),'Térreo',plano.via==='escada'?'Escada':'Rampa',andar,sala];
  const unicos=labels.filter((t,i)=>labels.indexOf(t)===i&&(level||(t!=='Rampa'&&t!=='Escada')));st.rotulos=labels.map(t=>Math.max(0,unicos.indexOf(t)));
  passos.replaceChildren(...unicos.map(t=>{const el=document.createElement('span');el.textContent=t;return el;}));passos.hidden=false;
  ficha.querySelector('.f-num').textContent=sala;ficha.querySelector('.f-nome').textContent=plano.zona.name||plano.zona.label;ficha.querySelector('.f-via').textContent=andar;
  if(reduced()&&!animate)st.elapsed=st.duration;
  document.dispatchEvent(new CustomEvent('mapa:inicio',{detail:{duration:st.duration}}));pedir();return plano;
 }
 function tick(now){
  if(!st||st.fim)return false;const s=st,L=s.level;
  /* aba em segundo plano não pode gastar a viagem inteira de uma vez */
  const dt=Math.max(0,Math.min(60,now-s.lastTime));s.lastTime=now;if(!s.paused&&s.freeze==null)s.elapsed=Math.min(s.duration,s.elapsed+dt*s.speed);
  const elapsed=s.freeze==null?s.elapsed:s.freeze*s.duration;
  let stage=0;while(stage<6&&elapsed>=s.boundaries[stage+1])stage++;
  const t=clamp((elapsed-s.boundaries[stage])/Math.max(1,s.times[stage])),v=ease(t),lin=t*t*(3-2*t);
  let pose=s.A,f=0,iso=stage>2?1:0,ops=[0,0,0],elos=[0,0],chegada=0;
  const acima=(o)=>{for(let l=1;l<=L;l++)ops[l]=o;};
  if(stage===0){pose=blend(s.de,s.A,v);s.exterior.show(0);s.indoor.show(0,false);}
  if(stage===1){s.exterior.show(lin);s.indoor.show(0,false);}
  if(stage===2){s.exterior.show(1,t<.6);s.indoor.show(0);iso=v;pose=blend(s.A,s.S,v);ops[0]=v;acima(.3*v);elos=[v,v];}
  if(stage===3){f=s.walk*lin;pose=s.S;ops[0]=1;acima(.3);elos=[1,1];}
  if(stage===4){f=mix(s.walk,s.climb,lin);pose=s.S;const k=ease(clamp(t*1.6));ops[0]=mix(1,.5,k);acima(mix(.3,.75,k));ops[L]=mix(.3,1,k);elos=[1,1];}
  if(stage===5){f=mix(s.climb,1,lin);pose=blend(s.S,s.F,ease(clamp(t*1.5)));const k=ease(clamp(t*1.5));if(L){ops[0]=mix(.5,.1,k);acima(mix(.75,.1,k));elos=[mix(1,.25,k),mix(1,.25,k)];}ops[L]=1;}
  if(stage===6){f=1;pose=blend(s.F,s.R,v);chegada=v;if(L){ops[0]=.1;acima(.1);elos=[.25,.25];}ops[L]=1;}
  for(let l=L+1;l<3;l++)ops[l]=0;for(let l=L;l<2;l++)elos[l]=0;
  if(stage>=3){s.exterior.show(1,false);s.indoor.show(f);}
  const cab=stage<=1?s.exterior.at(stage?lin:0):stage===2?s.exterior.at(1):s.indoor.at(f);
  s.dot.position.copy(cab);s.dot.position.y+=.75;s.aro.position.copy(s.dot.position);s.dot.visible=s.aro.visible=stage>=1&&stage<6;
  estilo.isolate(iso);principal.mostrar('tudo');interior.view({ops,elos,chegada});
  camera.position.copy(pose.p);controls.target.copy(pose.t);camera.lookAt(controls.target);
  const et=s.rotulos[stage];
  if(et!==s.etapa){s.etapa=et;[...passos.children].forEach((el,i)=>{el.className=i===et?'agora':i<et?'feito':'';el.setAttribute('aria-current',i===et?'step':'false');});document.dispatchEvent(new CustomEvent('mapa:etapa',{detail:{etapa:et,text:passos.children[et].textContent}}));}
  const progress=document.querySelector('#progresso-rota');if(progress){progress.value=elapsed/s.duration;}
  if(elapsed>=s.duration&&s.freeze==null){s.fim=true;controls.enabled=true;controls.update();aoNivel(String(s.level),true);sombras();document.dispatchEvent(new CustomEvent('mapa:chegada',{detail:s.plano}));}
  return !s.fim&&!s.paused&&s.freeze==null;
 }
 function posicionarFicha(w,h){if(!st||!st.fim){ficha.hidden=true;return;}const v=st.centro.clone().project(camera);ficha.hidden=v.z>1||v.z< -1;ficha.style.transform=`translate(${Math.max(80,Math.min(w-80,(v.x*.5+.5)*w))}px,${Math.max(110,Math.min(h-60,(-v.y*.5+.5)*h))}px) translate(-50%,-100%)`;}
 function pular(){if(st){st.freeze=null;st.elapsed=st.duration;st.paused=false;st.fim=false;pedir();}}
 function congelar(u){if(st){st.freeze=u;st.fim=false;st.lastTime=performance.now();pedir();}}
 function resize(){if(st){poses(st);if(st.fim){camera.position.copy(st.R.p);controls.target.copy(st.R.t);controls.update();}pedir();}}
 function pause(){if(!st||st.fim)return false;st.paused=!st.paused;st.lastTime=performance.now();pedir();return st.paused;}
 return {ir,limpar,tick,posicionarFicha,pular,congelar,resize,pausar:pause,velocidade:v=>{if(st)st.speed=Math.max(.5,Math.min(1.5,v));},ativa:()=>!!st,estado:()=>st,repetir:()=>last&&ir(last.level,last.id,{forcar:last.forcar,animate:true})};
}
