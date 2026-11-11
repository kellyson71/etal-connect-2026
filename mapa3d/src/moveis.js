/* Coisas que se mexem quando alguém encosta, no passeio: as portas (giram na dobradiça e voltam sozinhas, como porta
   com mola) e os cones (são empurrados, tombam com uma pancada mais forte e rolam até parar).
   Corpos: [{ x, z, r, vx, vz, y, k }] — pessoa e carros; k é o andar do bloco (0 no chão). */
import * as THREE from 'three';
import { FH } from './dados.js';

const MAX = 1.85;
export function criarMoveis({ portas = [], cones = [], fis }) {
  const eixo = new THREE.Vector3();
  function tickPortas(dt, corpos) {
    let mexe = false;
    for (const p of portas) {
      const co = Math.cos(p.ang), si = Math.sin(p.ang), dx = p.ux * co + p.uy * si, dz = -p.ux * si + p.uy * co; let torque = 0;
      for (const c of corpos) {
        if (Math.abs((c.y ?? 0) - p.k * FH) > 1.6) continue; const rx = c.x - p.x, rz = c.z - p.y; if (Math.abs(rx) > 3 || Math.abs(rz) > 3) continue;
        const t = Math.min(p.larg, Math.max(0, rx * dx + rz * dz)); const d = Math.hypot(rx - dx * t, rz - dz * t), folga = c.r + 0.07 - d; if (folga <= 0 || t < 0.06) continue;
        /* gira para longe de quem empurra; mais força na ponta e com quem vem andando */
        const lado = rx * dz - rz * dx > 0 ? -1 : 1; torque += lado * (folga * 170 + 12 + Math.hypot(c.vx || 0, c.vz || 0) * 7) * (0.35 + t / p.larg);
      }
      p.w += (torque - p.ang * (p.vidro ? 4 : 6) - p.w * 4.2) * dt; p.ang += p.w * dt;
      if (Math.abs(p.ang) > MAX) { p.ang = Math.sign(p.ang) * MAX; p.w = 0; }
      if (!torque && Math.abs(p.ang) < 0.003 && Math.abs(p.w) < 0.02) { if (p.ang) { p.ang = 0; p.w = 0; p.piv.rotation.y = p.base; mexe = true; } continue; }
      p.piv.rotation.y = p.base + p.ang; mexe = true;
    }
    return mexe;
  }
  function tickCones(dt, corpos) {
    let mexe = false;
    for (const c of cones) {
      for (const b of corpos) {
        if ((b.y ?? 0) - c.y > 1.2) continue; const dx = c.x - b.x, dz = c.z - b.z, d = Math.hypot(dx, dz), R = b.r + 0.19; if (d >= R || d < 1e-4) continue;
        const nx = dx / d, nz = dz / d, rel = Math.max(0, (b.vx || 0) * nx + (b.vz || 0) * nz);
        c.x += nx * (R - d); c.z += nz * (R - d); c.vx = nx * (rel * 1.25 + 0.9); c.vz = nz * (rel * 1.25 + 0.9);
        if (rel > 2.4 && !c.cai) { c.cai = true; c.qx = nx; c.qz = nz; }
      }
      const sp = Math.hypot(c.vx, c.vz); if (sp < 0.02 && (!c.cai || c.tomba >= 1)) { c.vx = c.vz = 0; continue; }
      const nx = c.x + c.vx * dt, nz = c.z + c.vz * dt;
      if (fis.livre(nx, nz, 0.12)) { c.x = nx; c.z = nz; } else { c.vx *= -0.35; c.vz *= -0.35; }
      const at = Math.exp(-(c.cai ? 1.5 : 3.4) * dt); c.vx *= at; c.vz *= at; c.y = fis.terreno(c.x, c.z);
      if (c.cai) { c.tomba = Math.min(1, c.tomba + dt * 4.5); c.rola += sp * dt * 2.2; }
      const m = c.mesh; m.position.set(c.x, c.y + (c.cai ? 0.13 * c.tomba : 0), c.z);
      if (c.cai) { m.quaternion.setFromAxisAngle(eixo.set(c.qz, 0, -c.qx), c.tomba * 1.72); m.rotateY(c.rola); }
      mexe = true;
    }
    return mexe;
  }
  return { tick: (dt, corpos) => { const a = tickPortas(dt, corpos), b = tickCones(dt, corpos); return a || b; } };
}
