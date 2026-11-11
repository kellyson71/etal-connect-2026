/* Camada de orientação: a mesma planta, com volumes baixos e pavimentos afastados.
   Altura expandida é representação didática; distâncias continuam vindo da rota real. */
import * as THREE from 'three';
import { PLAN, wp, zonePoly, insetPoly, centroid, FH } from './dados.js';
import { fracaoRampa } from './subidas.js';
import { Lote } from './geo.js';
import { placa } from './texturas.js';
export const GAP = 9;
export const ROOM_H = 1.05;
const DESTAQUE = new THREE.Color(0x4d971f);
export const mapHeight = y => Math.max(0,(y-.03)/FH)*GAP+.03;
export function criarInterior(){
 const grupo=new THREE.Group();grupo.name='interior-ilustrado';grupo.visible=false;
 const floors=[],rooms=[],labels=[],links=[];
 const mat=c=>new THREE.MeshLambertMaterial({color:c});
 const palette={classroom:0xe0e9ff,laboratory:0xd7e6ff,office:0xffefd1,staff:0xffefd1,restroom:0xd5eef0,reception:0xffdda4,auditorium:0xb8d69c,lounge:0xd9e6c8};
 function shape(poly){return new THREE.Shape(poly.map(p=>new THREE.Vector2(...p)));}
 function block(poly,base,height,color,holes=[]){
  const s=shape(poly);holes.forEach(p=>s.holes.push(new THREE.Path(p.map(q=>new THREE.Vector2(...q)))));
  const geo=new THREE.ExtrudeGeometry(s,{depth:height,bevelEnabled:false,steps:1});geo.rotateX(Math.PI/2);geo.translate(0,base+height,0);
  const mesh=new THREE.Mesh(geo,mat(color));mesh.receiveShadow=false;mesh.castShadow=false;return mesh;
 }
 const makeText=(text,w=4,h=1.6)=>{const tx=placa(256,96,(g,W,H)=>{g.clearRect(0,0,W,H);g.fillStyle='#22386f';g.font='800 62px system-ui';g.textAlign='center';g.textBaseline='middle';g.fillText(text,W/2,H/2);});const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tx,transparent:true,depthWrite:false}));m.rotation.x=-Math.PI/2;m.renderOrder=5;return m;};
 PLAN.floors.forEach((f,l)=>{
  const floor=new THREE.Group();floor.name='planta-'+l;floor.position.y=l*GAP;grupo.add(floor);floors.push(floor);
  const holes=f.zones.filter(z=>['courtyard','stairs','ramp'].includes(z.kind)).map(z=>zonePoly(z).map(wp));
  floor.add(block(f.outlinePts.map(wp),-.4,.38,0xe8edf7,holes));
  for(const c of f.corridors)floor.add(block(zonePoly(c).map(wp),0,.025,0xffffff));
  for(const z of f.zones){
   if(['courtyard','stairs','ramp','wall'].includes(z.kind))continue;
   const poly=insetPoly(zonePoly(z).map(wp),.15),color=palette[z.kind]||0xe2e7ef;
   const mesh=block(poly,.04,z.kind==='lounge'?.12:ROOM_H,color);mesh.name='sala:'+l+':'+z.id;mesh.userData={level:l,zone:z,baseColor:color};floor.add(mesh);rooms.push(mesh);
   const edge=new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry,35),new THREE.LineBasicMaterial({color:0x9daecb,transparent:true,opacity:.65}));mesh.add(edge);
   if(z.roomNumber){const c=centroid(poly);const w=Math.min(3.8,Math.max(...poly.map(p=>p[0]))-Math.min(...poly.map(p=>p[0]))-.6);const text=makeText(z.roomNumber,w,w*.4);text.position.set(c[0],ROOM_H+.07,c[1]);text.userData={zone:z,num:z.roomNumber};floor.add(text);labels.push(text);mesh.userData.label=text;}
  }
  // Portas independentes da fachada: um umbral escuro, sempre visível no corredor.
  for(const d of f.doors){const p=wp([d.x,d.y]);const marker=new THREE.Mesh(new THREE.BoxGeometry(d.axis==='h'?1.1:.16,.18,d.axis==='h'?.16:1.1),mat(0x60769f));marker.position.set(p[0],.16,p[1]);floor.add(marker);}
 });
 const materials={rampa:mat(0xc1cde2),escada:mat(0xb6c6e2),edge:mat(0x8298bb)};
 for(let l=0;l<2;l++){
  const g=new THREE.Group();g.position.y=l*GAP;g.name='conexao-'+l;grupo.add(g);links.push(g);const L=new Lote();
  const loop=PLAN.rampLoop;
  loop.slice(1).forEach((q,j)=>{const a=wp(loop[j]),b=wp(q);const len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(len<.01)return;const n=[-(b[1]-a[1])/len*.9,(b[0]-a[0])/len*.9],ha=fracaoRampa(loop[j],j,loop)*GAP,hb=fracaoRampa(q,j+1,loop)*GAP;
   L.quadUp('rampa',[a[0]+n[0],ha,a[1]+n[1]],[a[0]-n[0],ha,a[1]-n[1]],[b[0]-n[0],hb,b[1]-n[1]],[b[0]+n[0],hb,b[1]+n[1]]);
   for(const sign of [-1,1])L.tube('edge',[a[0]+n[0]*sign,ha+.08,a[1]+n[1]*sign],[b[0]+n[0]*sign,hb+.08,b[1]+n[1]*sign],.035);
  });
  const s=PLAN.floors[1].zones.find(z=>z.kind==='stairs');const a=wp([s.x+s.w*.27,s.y+s.h-6]),b=wp([s.x+s.w*.27,s.y+10]),c=wp([s.x+s.w*.73,s.y+10]),d=wp([s.x+s.w*.73,s.y+s.h-6]);
  for(let k=0;k<12;k++){let t=(k+.5)/12;L.box('escada',a[0],a[1]+(b[1]-a[1])*t,1.2,Math.abs(b[1]-a[1])/12,k/12*GAP/2,(k+1)/12*GAP/2);L.box('escada',c[0],c[1]+(d[1]-c[1])*t,1.2,Math.abs(d[1]-c[1])/12,GAP/2+k/12*GAP/2,GAP/2+(k+1)/12*GAP/2);}
  L.box('escada',(b[0]+c[0])/2,b[1],c[0]-b[0]+1.2,1.1,GAP/2-.15,GAP/2);
  L.build(g,materials,{cast:false,receive:false});
 }
 /* materiais do interior não entram na neblina (é ela que esconde o campus) e podem ficar translúcidos por andar */
 links.forEach(g=>g.traverse(o=>{if(o.isMesh)o.material=o.material.clone();}));
 grupo.traverse(o=>{if(o.material){o.material.fog=false;o.material.transparent=true;}});
 floors.forEach((f,l)=>f.traverse(o=>{if(o.isMesh||o.isLineSegments)o.renderOrder=l*2+(o.material.map?1:0);}));
 links.forEach((g,l)=>g.traverse(o=>{if(o.isMesh)o.renderOrder=l*2+1;}));
 let focused=null;
 const escrita=(text,cor)=>placa(256,96,(g,W,H)=>{g.clearRect(0,0,W,H);g.fillStyle=cor;g.font='800 62px system-ui';g.textAlign='center';g.textBaseline='middle';g.fillText(text,W/2,H/2);});
 /* ops: opacidade de cada andar (0 some); elos: opacidade de cada subida; chegada: 0 a 1, a sala de destino sobe e ganha cor */
 function view({ops=[1,1,1],elos=[1,1],chegada=0}={}){
  grupo.visible=ops.some(v=>v>.001);
  floors.forEach((f,l)=>{const a=ops[l]||0;f.visible=a>.001;f.traverse(o=>{if(!o.material)return;const texto=!!o.material.map;o.material.opacity=texto?(a>.55?(a-.55)/.45:0):(o.isLineSegments?a*.65:a);o.material.depthWrite=!texto&&a>.6;});});
  links.forEach((g,l)=>{const a=elos[l]||0;g.visible=a>.001;g.traverse(o=>{if(o.material){o.material.opacity=a;o.material.depthWrite=a>.6;}});});
  if(focused){const e=chegada*chegada*(3-2*chegada);focused.position.y=e*.9;focused.material.color.set(focused.userData.baseColor).lerp(DESTAQUE,e);const label=focused.userData.label;if(label){label.position.y=ROOM_H+.07+e*.9;if(label.userData.claro)label.material.map=e>.5?label.userData.claro:label.userData.escuro;}}
 }
 function select(l,id){
  if(focused){focused.material.color.set(focused.userData.baseColor);focused.position.y=0;const t=focused.userData.label;if(t){t.position.y=ROOM_H+.07;if(t.userData.escuro)t.material.map=t.userData.escuro;}}
  focused=rooms.find(r=>r.userData.level===l&&r.userData.zone.id===id)||null;
  const t=focused?.userData.label;if(t&&!t.userData.claro){t.userData.escuro=t.material.map;t.userData.claro=escrita(t.userData.num,'#ffffff');}
 }
 function syncRooms(){labels.forEach(m=>{if(m.userData.num===m.userData.zone.roomNumber)return;const updated=makeText(m.userData.zone.roomNumber);m.material.map.dispose();m.material.map=updated.material.map;m.userData.num=m.userData.zone.roomNumber;updated.geometry.dispose();updated.material.dispose();});}
 return {grupo,floors,rooms,links,view,select,syncRooms};
}
