'use strict';
/* =========================================================
   Carte du royaume : contours lissés (marching squares + Chaikin), parchemin, blasons
   ========================================================= */
const CARTE = (() => {
 const { W, H, K, grille, relief } = MONDE;
 function contours(test) {
  const segs = [];
  const v = (x, y) => x >= 0 && y >= 0 && x < W && y < H && test(grille[y * W + x]) ? 1 : 0;
  for (let y = -1; y < H; y++) for (let x = -1; x < W; x++) {
   const a = v(x, y), b = v(x + 1, y), c = v(x + 1, y + 1), d = v(x, y + 1), idx = a * 8 + b * 4 + c * 2 + d;
   if (idx === 0 || idx === 15) continue;
   const T = [x + .5, y], R = [x + 1, y + .5], Bm = [x + .5, y + 1], L = [x, y + .5];
   const tab = { 1: [[L, Bm]], 2: [[Bm, R]], 3: [[L, R]], 4: [[T, R]], 5: [[L, T], [Bm, R]], 6: [[T, Bm]], 7: [[L, T]], 8: [[T, L]], 9: [[T, Bm]], 10: [[T, R], [L, Bm]], 11: [[T, R]], 12: [[L, R]], 13: [[Bm, R]], 14: [[L, Bm]] }[idx];
   for (const s of tab) segs.push(s);
  }
  // chaînage
  const cle = p => p[0] * 1000 + p[1] * 2;
  const par = new Map(); segs.forEach((s, i) => { for (const p of s) { const k = cle(p); if (!par.has(k)) par.set(k, []); par.get(k).push(i); } });
  const vu = new Uint8Array(segs.length), boucles = [];
  for (let i = 0; i < segs.length; i++) {
   if (vu[i]) continue; vu[i] = 1; const pts = [segs[i][0], segs[i][1]]; let fin = segs[i][1];
   for (let g = 0; g < 100000; g++) { const l = par.get(cle(fin)) || []; let n = -1; for (const j of l) if (!vu[j]) { n = j; break; } if (n < 0) break; vu[n] = 1; const s = segs[n]; fin = cle(s[0]) === cle(fin) ? s[1] : s[0]; pts.push(fin); }
   if (pts.length > 4) boucles.push(chaikin(chaikin(pts)));
  }
  return boucles;
 }
 function chaikin(p) { const o = []; for (let i = 0; i < p.length - 1; i++) { const a = p[i], b = p[i + 1]; o.push([a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25], [a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75]); } o.push(o[0]); return o; }
 function chemin(boucles) { const p = new Path2D(); for (const b of boucles) { p.moveTo(b[0][0] * K, b[0][1] * K); for (let i = 1; i < b.length; i++) p.lineTo(b[i][0] * K, b[i][1] * K); p.closePath(); } return p; }
 const chemins = PROVINCES.map((_, i) => chemin(contours(v => v === i)));
 const terre = chemin(contours(v => v >= 0));
 // fond statique (parchemin, mer, relief, montagnes, forêts)
 let fond = null, cache = null;
 function faireFond() {
  const S = 2, c = document.createElement('canvas'); c.width = 1000 * S; c.height = 680 * S; const g = c.getContext('2d'); g.scale(S, S);
  const rr = seeded(77);
  // mer
  const gm = g.createRadialGradient(500, 340, 100, 500, 340, 700); gm.addColorStop(0, '#3d5866'); gm.addColorStop(1, '#1c2a33'); g.fillStyle = gm; g.fillRect(0, 0, 1000, 680);
  g.strokeStyle = 'rgba(200,225,235,.08)'; g.lineWidth = 1;
  for (let i = 0; i < 260; i++) { const x = rr() * 1000, y = rr() * 680; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 6, y - 3, x + 12, y); g.quadraticCurveTo(x + 18, y + 3, x + 24, y); g.stroke(); }
  // hauts-fonds
  g.save(); g.strokeStyle = 'rgba(140,190,200,.22)'; g.lineWidth = 16; g.lineJoin = 'round'; g.stroke(terre); g.strokeStyle = 'rgba(140,190,200,.15)'; g.lineWidth = 32; g.stroke(terre); g.restore();
  // terre
  g.fillStyle = '#c9b48a'; g.fill(terre);
  g.save(); g.clip(terre);
  const rc = document.createElement('canvas'); rc.width = W; rc.height = H; const rg = rc.getContext('2d'); const im = rg.createImageData(W, H);
  for (let i = 0; i < W * H; i++) { const v = relief[i]; const k = (v - .5) * 2; im.data[i * 4] = 200 + k * 50; im.data[i * 4 + 1] = 180 + k * 40; im.data[i * 4 + 2] = 135 + k * 30; im.data[i * 4 + 3] = 255; }
  rg.putImageData(im, 0, 0); g.globalAlpha = .55; g.imageSmoothingEnabled = true; g.drawImage(rc, 0, 0, 1000, 680); g.globalAlpha = 1;
  // grain du parchemin
  for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(${rr() < .5 ? '90,60,30' : '255,245,220'},${rr() * .06})`; g.fillRect(rr() * 1000, rr() * 680, 2 + rr() * 3, 1 + rr() * 2); }
  // montagnes et forêts selon le relief et le type de donjon
  for (let i = 0; i < 1400; i++) {
   const x = rr() * 1000, y = rr() * 680, gx = x / K | 0, gy = y / K | 0, id = grille[gy * W + gx]; if (id < 0) continue;
   const v = relief[gy * W + gx], d = PROVINCES[id].donjon;
   if (v > .64) { const h = 7 + (v - .64) * 40; g.fillStyle = 'rgba(90,70,50,.55)'; g.beginPath(); g.moveTo(x - h * .8, y); g.lineTo(x, y - h); g.lineTo(x + h * .8, y); g.fill(); g.fillStyle = 'rgba(255,250,235,.5)'; g.beginPath(); g.moveTo(x - h * .25, y - h * .7); g.lineTo(x, y - h); g.lineTo(x + h * .25, y - h * .7); g.fill(); }
   else if ((d === 'foret' || d === 'marais' || v < .38) && rr() < .5) { g.fillStyle = d === 'marais' ? 'rgba(60,90,70,.45)' : 'rgba(55,80,40,.5)'; g.beginPath(); g.arc(x, y - 4, 3.5, 0, 6.28); g.fill(); g.fillStyle = 'rgba(60,40,20,.5)'; g.fillRect(x - .6, y - 1, 1.2, 3); }
  }
  g.restore();
  // côte
  g.strokeStyle = '#4a3a26'; g.lineWidth = 2.2; g.lineJoin = 'round'; g.stroke(terre);
  g.strokeStyle = 'rgba(255,240,210,.35)'; g.lineWidth = .8; g.stroke(terre);
  // rose des vents
  rose(g, 930, 600, 38);
  // cartouche
  g.fillStyle = 'rgba(30,20,10,.55)'; g.fillRect(24, 20, 230, 46); g.strokeStyle = '#c9a227'; g.lineWidth = 1.5; g.strokeRect(28, 24, 222, 38);
  g.fillStyle = '#e8d6a8'; g.font = 'italic 600 21px Georgia, serif'; g.textAlign = 'center'; g.fillText('Royaume d’Esterre', 139, 50);
  // navires
  for (const [x, y] of [[60, 150], [960, 240], [610, 650], [230, 640]]) navire(g, x, y);
  fond = c;
 }
 function rose(g, x, y, r) { g.save(); g.translate(x, y); g.strokeStyle = 'rgba(230,210,170,.6)'; g.fillStyle = 'rgba(230,210,170,.55)'; g.lineWidth = 1; g.beginPath(); g.arc(0, 0, r * .7, 0, 6.28); g.stroke(); for (let i = 0; i < 8; i++) { g.rotate(Math.PI / 4); const l = i % 2 ? r * .55 : r; g.beginPath(); g.moveTo(0, -l); g.lineTo(4, 0); g.lineTo(-4, 0); g.fill(); } g.fillStyle = '#e8d6a8'; g.font = 'bold 12px Georgia'; g.textAlign = 'center'; g.fillText('N', 0, -r - 4); g.restore(); }
 function navire(g, x, y) { g.save(); g.translate(x, y); g.fillStyle = 'rgba(60,40,20,.7)'; g.beginPath(); g.moveTo(-10, 0); g.lineTo(10, 0); g.lineTo(6, 5); g.lineTo(-6, 5); g.fill(); g.fillStyle = 'rgba(235,225,200,.7)'; g.beginPath(); g.moveTo(0, -14); g.lineTo(7, -2); g.lineTo(0, -2); g.fill(); g.strokeStyle = 'rgba(60,40,20,.7)'; g.beginPath(); g.moveTo(0, -15); g.lineTo(0, 0); g.stroke(); g.restore(); }

 /* ---------- Rendu dynamique ---------- */
 const V = { z: 1, x: 0, y: 0 }; // zoom et décalage (coordonnées carte)
 function ajuster(cw, ch) { const z = Math.min(cw / 1000, ch / 680); V.base = z; if (!V.init) { V.z = z; V.x = (cw - 1000 * z) / 2; V.y = (ch - 680 * z) / 2; V.init = true; } }
 function versCarte(sx, sy) { return [(sx - V.x) / V.z, (sy - V.y) / V.z]; }
 function provinceA(G, mx, my) { const gx = mx / K | 0, gy = my / K | 0; if (gx < 0 || gy < 0 || gx >= W || gy >= H) return null; const i = grille[gy * W + gx]; return i >= 0 ? G.provinces[i] : null; }
 function dessiner(G, cv, ctx, ui) {
  if (!fond) faireFond();
  const cw = cv.width, ch = cv.height, q = cv.q || 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#141b20'; ctx.fillRect(0, 0, cw, ch);
  ctx.setTransform(V.z, 0, 0, V.z, V.x, V.y);
  ctx.drawImage(fond, 0, 0, 1000, 680);
  const t = performance.now() / 1000;
  // possessions (calque mis en cache tant que les frontières ne changent pas)
  const cle = G.provinces.map(p => p.o).join(',');
  if (!cache || cache.cle !== cle) {
   const S = 2, c = cache && cache.c || document.createElement('canvas'); c.width = 1000 * S; c.height = 680 * S; const g = c.getContext('2d'); g.setTransform(S, 0, 0, S, 0, 0); g.clearRect(0, 0, 1000, 680);
   G.provinces.forEach((p, i) => {
    const M = G.maisons[p.o];
    g.fillStyle = hexa(M.c1, p.o === 'joueur' ? .5 : p.o === 'rebelles' ? .18 : .38); g.fill(chemins[i]);
    if (p.o === 'joueur') { g.save(); g.clip(chemins[i]); g.strokeStyle = hexa(M.c2, .18); g.lineWidth = 2; for (let k = -700; k < 1000; k += 14) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + 680, 680); g.stroke(); } g.restore(); }
   });
   g.lineJoin = 'round';
   G.provinces.forEach((p, i) => { g.strokeStyle = 'rgba(50,35,20,.55)'; g.lineWidth = 1.1; g.stroke(chemins[i]); });
   G.provinces.forEach((p, i) => { if (p.o === 'rebelles') return; g.save(); g.clip(chemins[i]); g.strokeStyle = hexa(G.maisons[p.o].c1, .9); g.lineWidth = 5; g.stroke(chemins[i]); g.restore(); });
   cache = { cle, c };
  }
  ctx.drawImage(cache.c, 0, 0, 1000, 680);
  ctx.lineJoin = 'round';
  // surbrillances
  const sel = ui.sel && G.provinces.findIndex(p => p.id === ui.sel);
  if (ui.cibles) for (const id of ui.cibles) { const i = MONDE.idx[id]; ctx.fillStyle = `rgba(255,80,40,${.18 + .14 * Math.sin(t * 5)})`; ctx.fill(chemins[i]); ctx.strokeStyle = '#ff6a3a'; ctx.lineWidth = 2.5; ctx.stroke(chemins[i]); }
  if (ui.amis) for (const id of ui.amis) { const i = MONDE.idx[id]; ctx.fillStyle = `rgba(120,220,120,${.14 + .1 * Math.sin(t * 5)})`; ctx.fill(chemins[i]); ctx.strokeStyle = '#8fe08f'; ctx.lineWidth = 2; ctx.stroke(chemins[i]); }
  if (sel >= 0 && sel !== null && ui.sel) { ctx.strokeStyle = '#ffe08a'; ctx.lineWidth = 3.2; ctx.shadowColor = '#ffd84a'; ctx.shadowBlur = 12; ctx.stroke(chemins[sel]); ctx.shadowBlur = 0; }
  if (ui.survol && ui.survol !== ui.sel) { const i = MONDE.idx[ui.survol]; ctx.strokeStyle = 'rgba(255,240,200,.7)'; ctx.lineWidth = 1.8; ctx.stroke(chemins[i]); }
  // flèches d'attaques récentes
  if (ui.fleches) for (const f of ui.fleches) { const a = prov(G, f.de), b = prov(G, f.vers); if (!a || !b) continue; fleche(ctx, a.x, a.y, b.x, b.y, f.coul, f.t); }
  // icônes
  ctx.textAlign = 'center';
  for (const p of G.provinces) {
   const M = G.maisons[p.o];
   chateau(ctx, p.x, p.y - 6, p.c, p.capitale, M);
   // donjon
   if (!p.nettoye) { const dx = p.x + 26, dy = p.y + 8; ctx.fillStyle = 'rgba(20,10,10,.8)'; ctx.beginPath(); ctx.arc(dx, dy, 8.5, 0, 6.28); ctx.fill(); ctx.strokeStyle = '#b04030'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.fillStyle = '#eadfcf'; ctx.font = '9px sans-serif'; ctx.fillText('☠', dx, dy + 3.2); ctx.fillStyle = '#ffcc88'; ctx.font = 'bold 8px Georgia'; ctx.fillText(p.dniv, dx + 10, dy - 6); }
   else { ctx.fillStyle = 'rgba(120,200,120,.7)'; ctx.font = '9px sans-serif'; ctx.fillText('✓', p.x + 26, p.y + 11); }
   // troupes
   const tx = p.x - 24, ty = p.y + 8;
   ctx.fillStyle = M.c1; ctx.strokeStyle = M.c2; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(tx - 9, ty - 9); ctx.lineTo(tx + 9, ty - 9); ctx.lineTo(tx + 9, ty + 5); ctx.lineTo(tx, ty + 10); ctx.lineTo(tx - 9, ty + 5); ctx.closePath(); ctx.fill(); ctx.stroke();
   ctx.fillStyle = M.c2; ctx.font = 'bold 10px Georgia'; ctx.fillText(p.t, tx, ty + 2);
   // nom
   ctx.font = `${p.capitale ? 'bold ' : ''}italic 12px Georgia, serif`; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(240,225,190,.85)'; ctx.strokeText(p.nom, p.x, p.y + 30); ctx.fillStyle = '#2a1a0c'; ctx.fillText(p.nom, p.x, p.y + 30);
   if (G.dejaBouge[p.id] && p.o === 'joueur') { ctx.fillStyle = '#5a3a1a'; ctx.font = '9px sans-serif'; ctx.fillText('⏸', tx + 12, ty - 8); }
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
 }
 function fleche(ctx, x1, y1, x2, y2, c, k) { const a = Math.atan2(y2 - y1, x2 - x1), d = Math.hypot(x2 - x1, y2 - y1); ctx.save(); ctx.translate(x1, y1); ctx.rotate(a); ctx.globalAlpha = clamp(k, 0, 1); ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(14, 0); ctx.quadraticCurveTo(d / 2, -d * .15, d - 18, 0); ctx.stroke(); ctx.beginPath(); ctx.moveTo(d - 8, 0); ctx.lineTo(d - 22, -8); ctx.lineTo(d - 20, 6); ctx.fill(); ctx.restore(); ctx.globalAlpha = 1; }
 function chateau(ctx, x, y, c, cap, M) {
  const s = cap ? 1.35 : .8 + c * .15;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(0, 9, 14, 4, 0, 0, 6.28); ctx.fill();
  ctx.fillStyle = '#d9ccb0'; ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1;
  if (c === 0 && !cap) { ctx.beginPath(); ctx.moveTo(-8, 8); ctx.lineTo(-8, -1); ctx.lineTo(0, -8); ctx.lineTo(8, -1); ctx.lineTo(8, 8); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  else {
   const tours = cap ? [-11, 0, 11] : c >= 2 ? [-9, 9] : [0];
   ctx.fillRect(-11, -2, 22, 10); ctx.strokeRect(-11, -2, 22, 10);
   for (const tx of tours) { const h = tx === 0 && cap ? 20 : 14; ctx.fillStyle = '#e6dac0'; ctx.fillRect(tx - 4, 8 - h, 8, h); ctx.strokeRect(tx - 4, 8 - h, 8, h); ctx.fillStyle = M.c1; ctx.beginPath(); ctx.moveTo(tx - 5, 8 - h); ctx.lineTo(tx, 8 - h - 7); ctx.lineTo(tx + 5, 8 - h); ctx.fill(); ctx.stroke(); }
   ctx.fillStyle = '#3a2a1a'; ctx.fillRect(-2.5, 3, 5, 5);
  }
  if (cap) { ctx.fillStyle = '#ffd84a'; ctx.font = '11px serif'; ctx.textAlign = 'center'; ctx.fillText('♛', 0, -24); }
  ctx.restore();
 }
 return { dessiner, ajuster, versCarte, provinceA, V };
})();

/* ---------- Blasons (SVG) ---------- */
function blason(m, taille = 40) {
 const M = typeof m === 'string' ? MAISONS[m] : m; const c1 = M.c1, c2 = M.c2;
 const em = {
  tour: `<path d="M35 70h30V40h-4v-8h-5v8h-4v-8h-4v8h-5v-8h-4v8h-4z" fill="${c2}"/><rect x="45" y="58" width="10" height="12" fill="${c1}"/>`,
  dragon: `<path d="M30 70c5-15 0-25 12-32-6-6-4-14 4-16 4 6 10 6 16 2-2 8 4 12 10 10-4 10-14 12-18 22 6 2 10 8 8 14-8-6-16-4-32 0z" fill="${c2}"/>`,
  corbeau: `<path d="M28 58c10-2 18-12 30-12 8 0 12-6 16-10-2 8 0 12 4 14-8 0-10 6-16 10-6 4-20 6-34-2z M60 44l4-4" fill="${c2}" stroke="${c2}"/>`,
  cerf: `<path d="M50 72V48m0 0c-6-2-8-10-6-16m6 16c6-2 8-10 6-16M44 32l-6-6m6 6-2-10m16 10 6-6m-6 6 2-10" stroke="${c2}" stroke-width="4" fill="none"/><circle cx="50" cy="50" r="7" fill="${c2}"/>`,
  loup: `<path d="M32 66l6-24 6 8 6-18 6 18 6-8 6 24c-12 6-24 6-36 0z" fill="${c2}"/><circle cx="44" cy="54" r="2" fill="${c1}"/><circle cx="56" cy="54" r="2" fill="${c1}"/>`,
  soleil: `<circle cx="50" cy="50" r="11" fill="${c2}"/><g stroke="${c2}" stroke-width="3">${[...Array(8)].map((_, i) => { const a = i * Math.PI / 4; return `<line x1="${50 + Math.cos(a) * 15}" y1="${50 + Math.sin(a) * 15}" x2="${50 + Math.cos(a) * 22}" y2="${50 + Math.sin(a) * 22}"/>`; }).join('')}</g>`,
  vague: `<path d="M28 56c6-8 12-8 18 0s12 8 18 0 8-6 8-6M28 66c6-8 12-8 18 0s12 8 18 0 8-6 8-6" stroke="${c2}" stroke-width="4" fill="none"/>`,
  epee: `<path d="M50 26v36M42 56h16M50 62v8" stroke="${c2}" stroke-width="5"/>`,
 }[M.embleme] || '';
 return `<svg viewBox="20 16 60 70" width="${taille}" height="${taille * 1.15}" class="blason"><path d="M24 20h52v30c0 20-12 30-26 34-14-4-26-14-26-34z" fill="${c1}" stroke="#1a120a" stroke-width="2"/><path d="M24 20h52v30c0 20-12 30-26 34-14-4-26-14-26-34z" fill="url(#lustre)" opacity=".35"/>${em}<defs><linearGradient id="lustre" x1="0" x2="1"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000"/></linearGradient></defs></svg>`;
}
