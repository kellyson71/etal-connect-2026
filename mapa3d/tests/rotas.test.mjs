import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
globalThis.window=globalThis;
for(const name of ['campus-data','plan-data'])vm.runInThisContext(fs.readFileSync(new URL(`../../prototipo/${name}.js`,import.meta.url),'utf8'));
const {planejar,gridPath,doorOf}=await import('../src/rotas.js');
const {fracaoRampa}=await import('../src/subidas.js');
test('origem fixa, porta explícita e alturas finitas nos três andares',()=>{
 for(const [l,z] of [[0,'napne'],[1,'sala-nadic'],[2,'coord-ads']])for(const via of ['rampa','escada']){
  const r=planejar(l,z,via);assert.ok(r);assert.deepEqual(r.pts[0],[15,.08,47]);assert.deepEqual(r.pts.at(-1),r.door);assert.ok(r.pts.flat().every(Number.isFinite));assert.equal(r.level,l);if(l)assert.equal(r.via,via);
 }
});
test('destino inválido e corredor desconectado não geram atalhos',()=>{
 assert.equal(planejar(9,'inexistente'),null);assert.equal(planejar(1,'sala-nadic','elevador'),null);
 const original=PLAN.floors[0];PLAN.floors[0]={corridors:[{x:0,y:0,w:20,h:20},{x:80,y:80,w:20,h:20}]};
 try{assert.equal(gridPath(0,[5,5],[90,90]),null);}finally{PLAN.floors[0]=original;}
});
test('a porta de NADIC não se confunde com a do Grêmio',()=>{assert.deepEqual(doorOf(1,PLAN.floors[1].zones.find(z=>z.id==='sala-nadic')),[652,417]);});
test('patamar da rampa é horizontal e o perfil sobe monotonamente',()=>{
 const loop=PLAN.rampLoop,profile=loop.map((q,i)=>fracaoRampa(q,i,loop));assert.equal(profile[0],0);assert.equal(profile.at(-1),1);
 profile.forEach((h,i)=>{if(i)assert.ok(h>=profile[i-1]);if(loop[i][1]<=185)assert.equal(h,.5);});
});
test('atalhos permanecem dentro dos corredores, entre início e destino',()=>{
 const {floors}=PLAN;
 for(const l of [0,1,2]){
  const route=gridPath(l,[340,435],[640,435]);if(!route)continue;
  const inside=(x,y)=>floors[l].corridors.some(c=>c.poly?pointIn(x,y,c.poly):x>=c.x&&x<=c.x+c.w&&y>=c.y&&y<=c.y+c.h);
  for(let i=1;i<route.length;i++)for(let k=1;k<100;k++){const a=route[i-1],b=route[i];assert.ok(inside(a[0]+(b[0]-a[0])*k/100,a[1]+(b[1]-a[1])*k/100));}
 }
});
function pointIn(x,y,p){let b=false;for(let i=0,j=p.length-1;i<p.length;j=i++)if((p[i][1]>y)!==(p[j][1]>y)&&x<(p[j][0]-p[i][0])*(y-p[i][1])/(p[j][1]-p[i][1])+p[i][0])b=!b;return b;}
