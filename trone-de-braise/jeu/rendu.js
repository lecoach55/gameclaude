'use strict';
/* =========================================================
   Rendu des donjons (Canvas 2D) : sol pré-calculé, lumière des torches, personnages dessinés
   ========================================================= */
const RENDU = { q: 1, ombres: true, off: {} };
const B = 32; // pixels par case dans le sol pré-calculé
/* lueurs pré-calculées : un dégradé radial dessiné une fois, puis étiré (bien moins cher que createRadialGradient à chaque image) */
const LUEURS = new Map();
function lueur(c0, c1, stops) {
 const cle = c0 + '|' + (c1 || '') + '|' + (stops || ''); let c = LUEURS.get(cle); if (c) return c;
 c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
 if (stops === 'trou') { gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(.35, 'rgba(0,0,0,.85)'); gr.addColorStop(.7, 'rgba(0,0,0,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); }
 else if (c1) { gr.addColorStop(0, c0); gr.addColorStop(.4, c1); gr.addColorStop(1, 'rgba(0,0,0,0)'); }
 else { gr.addColorStop(0, `rgba(${c0},1)`); gr.addColorStop(1, `rgba(${c0},0)`); }
 g.fillStyle = gr; g.fillRect(0, 0, 128, 128); LUEURS.set(cle, c); return c;
}
function rgbDe(hex) { const n = parseInt(hex.slice(1), 16); return `${n >> 16 & 255},${n >> 8 & 255},${n & 255}`; }
let VIGNETTE = null;
function vignette() { if (VIGNETTE) return VIGNETTE; const c = document.createElement('canvas'); c.width = 320; c.height = 200; const g = c.getContext('2d'), gr = g.createRadialGradient(160, 100, 60, 160, 100, 190); gr.addColorStop(0, 'rgba(150,0,0,0)'); gr.addColorStop(1, 'rgba(150,0,0,1)'); g.fillStyle = gr; g.fillRect(0, 0, 320, 200); return VIGNETTE = c; }
const RAYONS = new Map();
function rayon(coul) { let c = RAYONS.get(coul); if (c) return c; c = document.createElement('canvas'); c.width = 4; c.height = 64; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, coul + '88'); g.fillStyle = gr; g.fillRect(0, 0, 4, 64); RAYONS.set(coul, c); return c; }

function prerendu(A) {
 const D = A.D, W = A.W, H = A.H, t = A.carte.t;
 const c = document.createElement('canvas'); c.width = W * B; c.height = H * B;
 const g = c.getContext('2d'); const rr = seeded(A.W * 131 + A.niveau * 17 + A.X.etage * 7 + (A.carte.depart.cx * 3));
 g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height);
 const estSol = (x, y) => x >= 0 && y >= 0 && x < W && y < H && t[y * W + x] !== MUR;
 const teinte = (hex, k) => { const n = parseInt(hex.slice(1), 16); let r = n >> 16 & 255, gg = n >> 8 & 255, b = n & 255; r = clamp(r * k, 0, 255) | 0; gg = clamp(gg * k, 0, 255) | 0; b = clamp(b * k, 0, 255) | 0; return `rgb(${r},${gg},${b})`; };
 for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const v = t[y * W + x], px = x * B, py = y * B;
  if (v !== MUR) {
   const base = D.sol[(x * 7 + y * 13 + (rr() * 2 | 0)) % 2];
   g.fillStyle = teinte(base, .62); g.fillRect(px, py, B, B);
   // dalles
   const dal = A.type === 'foret' || A.type === 'marais' ? 0 : 1;
   if (dal) { const big = (x + y) % 3 === 0; if (big) { g.fillStyle = teinte(base, .9 + rr() * .14); g.fillRect(px + 1, py + 1, B - 2, B - 2); } else for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { g.fillStyle = teinte(base, .88 + rr() * .16); g.fillRect(px + i * 16 + 1, py + j * 16 + 1, 14.5, 14.5); } g.fillStyle = 'rgba(255,240,210,.05)'; g.fillRect(px + 1, py + 1, B - 2, 1); }
   else { g.fillStyle = teinte(base, .95); g.fillRect(px, py, B, B); for (let k = 0; k < 6; k++) { g.fillStyle = teinte(base, .8 + rr() * .35); g.beginPath(); g.arc(px + rr() * B, py + rr() * B, 2 + rr() * 5, 0, 6.28); g.fill(); } }
   if (rr() < .08) { g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1; g.beginPath(); let cx = px + rr() * B, cy = py + rr() * B; g.moveTo(cx, cy); for (let k = 0; k < 4; k++) { cx += rr() * 12 - 6; cy += rr() * 12 - 6; g.lineTo(cx, cy); } g.stroke(); }
   if ((A.type === 'foret' || A.type === 'marais' || A.type === 'crypte') && rr() < .12) { g.fillStyle = A.type === 'marais' ? 'rgba(60,110,80,.35)' : 'rgba(70,100,40,.3)'; g.beginPath(); g.ellipse(px + rr() * B, py + rr() * B, 4 + rr() * 8, 3 + rr() * 5, 0, 0, 6.28); g.fill(); }
   if (A.type === 'glace' && rr() < .2) { g.fillStyle = 'rgba(220,240,255,.22)'; g.beginPath(); g.ellipse(px + rr() * B, py + rr() * B, 5 + rr() * 9, 3 + rr() * 5, rr(), 0, 6.28); g.fill(); }
   if (rr() < .035) dessinerOs(g, px + rr() * B, py + rr() * B, rr);
   if (rr() < .02) { g.fillStyle = 'rgba(90,10,10,.35)'; g.beginPath(); g.ellipse(px + B / 2, py + B / 2, 6 + rr() * 8, 4 + rr() * 5, rr() * 3, 0, 6.28); g.fill(); }
   if (v === ESC) { for (let k = 0; k < 6; k++) { g.fillStyle = `rgba(0,0,0,${.15 + k * .13})`; g.fillRect(px + 2, py + 2 + k * 4.6, B - 4, 4.6); } g.strokeStyle = '#b08a4a'; g.lineWidth = 1.5; g.strokeRect(px + 1.5, py + 1.5, B - 3, B - 3); }
  }
 }
 // ombres portées des murs sur le sol (dégradés créés une fois, placés par translation)
 const gH = g.createLinearGradient(0, 0, 0, 12); gH.addColorStop(0, 'rgba(0,0,0,.55)'); gH.addColorStop(1, 'rgba(0,0,0,0)');
 const gG = g.createLinearGradient(0, 0, 8, 0); gG.addColorStop(0, 'rgba(0,0,0,.4)'); gG.addColorStop(1, 'rgba(0,0,0,0)');
 const gD = g.createLinearGradient(B, 0, B - 8, 0); gD.addColorStop(0, 'rgba(0,0,0,.4)'); gD.addColorStop(1, 'rgba(0,0,0,0)');
 const hF = B * .62, gF = g.createLinearGradient(0, 0, 0, hF); gF.addColorStop(0, 'rgba(0,0,0,.45)'); gF.addColorStop(.3, 'rgba(0,0,0,0)'); gF.addColorStop(1, 'rgba(0,0,0,.25)');
 const poser = (gr, px, py, x, y, w, h) => { g.save(); g.translate(px, py); g.fillStyle = gr; g.fillRect(x, y, w, h); g.restore(); };
 for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  if (t[y * W + x] === MUR) continue; const px = x * B, py = y * B;
  if (!estSol(x, y - 1)) poser(gH, px, py, 0, 0, B, 12);
  if (!estSol(x - 1, y)) poser(gG, px, py, 0, 0, 8, B);
  if (!estSol(x + 1, y)) poser(gD, px, py, B - 8, 0, 8, B);
 }
 // murs : dessus + face visible
 for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  if (t[y * W + x] !== MUR) continue;
  let pres = false; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (estSol(x + i, y + j)) pres = true;
  if (!pres) continue;
  const px = x * B, py = y * B;
  g.fillStyle = teinte(D.mur, .9 + rr() * .25); g.fillRect(px, py, B, B);
  g.fillStyle = 'rgba(255,255,255,.04)'; g.fillRect(px, py, B, 2);
  if (estSol(x, y + 1)) { // face sud visible
   const h = B * .62, fy = py + B - h;
   g.fillStyle = D.face; g.fillRect(px, fy, B, h);
   for (let r = 0; r < 3; r++) { const by = fy + r * (h / 3), off = (r % 2) * 8; for (let k = -1; k < 3; k++) { g.fillStyle = teinte(D.face, .8 + rr() * .45); g.fillRect(px + off + k * 16 + 1, by + 1, 14, h / 3 - 2); } }
   poser(gF, px, fy, 0, 0, B, h);
   g.fillStyle = 'rgba(255,220,170,.06)'; g.fillRect(px, fy, B, 1.5);
  }
 }
 return c;
}
function dessinerOs(g, x, y, rr) { g.strokeStyle = 'rgba(225,215,190,.55)'; g.lineWidth = 2; g.lineCap = 'round'; for (let k = 0; k < 2; k++) { const a = rr() * 3.14, l = 4 + rr() * 5; g.beginPath(); g.moveTo(x - Math.cos(a) * l, y - Math.sin(a) * l); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); } if (rr() < .4) { g.fillStyle = 'rgba(225,215,190,.6)'; g.beginPath(); g.arc(x + 5, y - 3, 3, 0, 6.28); g.fill(); } }

/* ---------- Rendu d'une image ---------- */
function rendreDonjon(A, cv, ctx, lum, lctx) {
 const cw = cv.width, ch = cv.height, P = A.p;
 const TS = Math.round(clamp(ch > cw ? cw / 10 : Math.min(cw / 16, ch / 10), 30 * RENDU.q, 84 * RENDU.q));
 A.TS = TS; RENDU.TS = TS;
 const sh = A.shake * TS * .35, sx = (R() - .5) * sh, sy = (R() - .5) * sh;
 const ox = cw / 2 - P.x * TS + sx, oy = ch / 2 - P.y * TS + sy;
 A.ox = ox; A.oy = oy;
 ctx.setTransform(1, 0, 0, 1, 0, 0);
 if (!A.sol) A.sol = prerendu(A);
 // sol visible
 const x0 = Math.max(0, Math.floor(-ox / TS) - 1), y0 = Math.max(0, Math.floor(-oy / TS) - 1), x1 = Math.min(A.W, Math.ceil((cw - ox) / TS) + 1), y1 = Math.min(A.H, Math.ceil((ch - oy) / TS) + 1);
 ctx.imageSmoothingEnabled = true;
 { const fx0 = ox + x0 * TS, fy0 = oy + y0 * TS, fx1 = ox + x1 * TS, fy1 = oy + y1 * TS; ctx.fillStyle = '#000'; // noircir seulement les bords que le sol ne couvre pas
  if (fx0 > 0) ctx.fillRect(0, 0, Math.ceil(fx0), ch); if (fx1 < cw) ctx.fillRect(Math.floor(fx1), 0, cw, ch); if (fy0 > 0) ctx.fillRect(0, 0, cw, Math.ceil(fy0)); if (fy1 < ch) ctx.fillRect(0, Math.floor(fy1), cw, ch); }
 if (!RENDU.off.sol) ctx.drawImage(A.sol, x0 * B, y0 * B, (x1 - x0) * B, (y1 - y0) * B, ox + x0 * TS, oy + y0 * TS, (x1 - x0) * TS, (y1 - y0) * TS);
 ctx.setTransform(TS, 0, 0, TS, ox, oy);
 const t = A.t;
 // pièges, télégraphes au sol
 for (const g of A.pieges) { ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.arc(g.x, g.y, .22, 0, 6.28); ctx.fill(); ctx.fillStyle = (t * 4 | 0) % 2 ? '#ff5a2a' : '#7a2a10'; ctx.beginPath(); ctx.arc(g.x, g.y, .07, 0, 6.28); ctx.fill(); }
 for (const z of A.zones) {
  if (z.k === 'ligne' && z.t < 0) { ctx.save(); ctx.translate(z.x - Math.cos(z.ang) * 3, z.y - Math.sin(z.ang) * 3); ctx.rotate(z.ang); ctx.fillStyle = `rgba(255,60,30,${.18 + .12 * Math.sin(t * 20)})`; ctx.fillRect(0, -.45, z.long, .9); ctx.restore(); continue; }
  if (z.feu) { ctx.fillStyle = `rgba(255,${90 + 40 * Math.sin(t * 9 + z.x)},20,.28)`; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, 6.28); ctx.fill(); continue; }
  if (z.t < 0) {
   const k = 1 + z.t / (z.k === 'meteore' ? 1 : 1.2);
   const coul = z.ami ? (z.k === 'meteore' ? '255,150,40' : '255,230,160') : z.k === 'givre' ? '140,210,255' : z.k === 'poison' ? '130,240,80' : '255,50,30';
   if (z.ami && z.k !== 'meteore') continue;
   ctx.strokeStyle = `rgba(${coul},.75)`; ctx.lineWidth = .05; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, 6.28); ctx.stroke();
   ctx.fillStyle = `rgba(${coul},${.12 + .25 * clamp(k, 0, 1)})`; ctx.beginPath(); ctx.arc(z.x, z.y, z.r * clamp(k, .05, 1), 0, 6.28); ctx.fill();
   if (z.k === 'meteore') { const h = -z.t * 8; ctx.fillStyle = '#ffb04a'; ctx.beginPath(); ctx.arc(z.x + h * .3, z.y - h, .35, 0, 6.28); ctx.fill(); }
  }
 }
 for (const c of A.cadavres || []) {
  if (c.x < x0 - 1 || c.x > x1 + 1 || c.y < y0 - 1 || c.y > y1 + 1) continue;
  if (c.spectre) continue;
  if (c.os) { ctx.strokeStyle = 'rgba(220,210,185,.55)'; ctx.lineWidth = .05; ctx.lineCap = 'round'; for (let k = 0; k < 3; k++) { const a = c.ang + k * 2.1, l = .18; ctx.beginPath(); ctx.moveTo(c.x - Math.cos(a) * l, c.y - Math.sin(a) * l * .6); ctx.lineTo(c.x + Math.cos(a) * l, c.y + Math.sin(a) * l * .6); ctx.stroke(); } ctx.fillStyle = 'rgba(225,215,190,.6)'; ctx.beginPath(); ctx.arc(c.x + Math.cos(c.ang) * .2, c.y, .09, 0, 6.28); ctx.fill(); }
  else { ctx.fillStyle = 'rgba(80,6,6,.5)'; ctx.beginPath(); ctx.ellipse(c.x, c.y, c.r * 1.3, c.r * .7, c.ang * .2, 0, 6.28); ctx.fill(); ctx.fillStyle = 'rgba(40,30,25,.55)'; ctx.beginPath(); ctx.ellipse(c.x + .05, c.y - .05, c.r * .8, c.r * .45, c.ang, 0, 6.28); ctx.fill(); }
 }
 for (const f of A.fx) if (f.k === 'cible') { ctx.strokeStyle = 'rgba(255,230,160,.35)'; ctx.lineWidth = .04; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.28); ctx.stroke(); }
 // objets au sol
 for (const l of A.loot) {
  if (l.or) { ctx.fillStyle = '#e8b830'; ctx.beginPath(); ctx.ellipse(l.x, l.y, .12, .08, 0, 0, 6.28); ctx.fill(); ctx.fillStyle = '#fff3a0'; ctx.beginPath(); ctx.arc(l.x - .03, l.y - .02, .03, 0, 6.28); ctx.fill(); continue; }
  if (l.globe) { const yy = l.y - .2 + Math.sin(t * 4 + l.x) * .04; ctx.drawImage(lueur('#ffd0d0', '#e02020'), l.x - .2, yy - .2, .4, .4); continue; }
  if (l.potion) { ctx.fillStyle = '#c21a1a'; ctx.beginPath(); ctx.arc(l.x, l.y, .11, 0, 6.28); ctx.fill(); ctx.fillStyle = '#ddd'; ctx.fillRect(l.x - .03, l.y - .2, .06, .1); continue; }
  const coul = RARETES.find(r => r.id === l.obj.rar).coul;
  if (l.obj.rar !== 'normal') ctx.drawImage(rayon(coul), l.x - .06, l.y - 1.6, .12, 1.6);
  ctx.fillStyle = coul; ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(.6); ctx.fillRect(-.16, -.05, .32, .1); ctx.restore();
 }
 // entités triées par profondeur
 const L = A.liste || (A.liste = []); L.length = 0;
 if (!A.piliers) { A.piliers = []; for (let i = 0; i < A.W * A.H; i++) if (A.carte.t[i] === PIL) A.piliers.push({ k: 'pilier', x: i % A.W + .5, y: (i / A.W | 0) + .5 }); }
 for (const d of A.deco) if (d.x > x0 - 2 && d.x < x1 + 2 && d.y > y0 - 2 && d.y < y1 + 3) L.push(d);
 for (const p of A.piliers) if (p.x > x0 - 1 && p.x < x1 + 1 && p.y > y0 - 1 && p.y < y1 + 3) L.push(p);
 for (const m of A.mobs) if (!m.mort && m.x > x0 - 2 && m.x < x1 + 2 && m.y > y0 - 2 && m.y < y1 + 2) L.push(m);
 L.push(P);
 for (const a of A.autels || []) L.push(a.ent || (a.ent = { k: 'autel', x: a.x, y: a.y, a }));
 if (A.allie) L.push(A.allie);
 if (A.portail) L.push(A.portail.ent || (A.portail.ent = { k: 'portail', x: A.portail.x, y: A.portail.y }));
 L.sort((a, b) => a.y - b.y);
 if (!RENDU.off.ent) for (const e of L) {
  if (e === P) dessinerHeros(ctx, P, A);
  else if (e.k === 'brasero') dessinerBrasero(ctx, e, t);
  else if (e.k === 'pilier') dessinerPilier(ctx, e, A);
  else if (e.k === 'portail') dessinerPortail(ctx, e, t);
  else if (e.k === 'autel') dessinerAutel(ctx, e.a, t);
  else if (e === A.allie) dessinerAllie(ctx, e, A);
  else if (e.objet) dessinerObjetDecor(ctx, e);
  else dessinerMob(ctx, e, A);
 }
 // projectiles
 for (const p of A.projs) {
  const a = Math.atan2(p.vy, p.vx);
  if (p.k === 'fleche' || p.k === 'fleche_e') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(a); ctx.strokeStyle = p.k === 'fleche' ? '#e6d6b0' : '#cfa080'; ctx.lineWidth = .045; ctx.beginPath(); ctx.moveTo(-.35, 0); ctx.lineTo(.12, 0); ctx.stroke(); ctx.fillStyle = '#ddd'; ctx.beginPath(); ctx.moveTo(.2, 0); ctx.lineTo(.08, -.05); ctx.lineTo(.08, .05); ctx.fill(); ctx.restore(); }
  else if (p.k === 'toile') { ctx.strokeStyle = 'rgba(235,235,225,.85)'; ctx.lineWidth = .025; for (let k = 0; k < 4; k++) { const a = k * .785 + A.t * 3; ctx.beginPath(); ctx.moveTo(p.x - Math.cos(a) * .2, p.y - Math.sin(a) * .2); ctx.lineTo(p.x + Math.cos(a) * .2, p.y + Math.sin(a) * .2); ctx.stroke(); } ctx.beginPath(); ctx.arc(p.x, p.y, .12, 0, 6.28); ctx.stroke(); }
  else { const c = p.k === 'lumiere' ? ['#ffffff', '#ffe08a'] : p.k === 'eclair' ? ['#f3e6ff', '#a070ff'] : p.k === 'givre' ? ['#ffffff', '#7ad0ff'] : ['#fff2c0', '#ff6a1a']; const r = p.r * 2.2; ctx.drawImage(lueur(c[0], c[1]), p.x - r, p.y - r, r * 2, r * 2); }
 }
 // poussières en suspension dans la lumière
 if (!A.poussiere) { A.poussiere = []; for (let i = 0; i < 40; i++) A.poussiere.push({ x: rnd(-8, 8), y: rnd(-6, 6), z: R() * 6.28, v: rnd(.05, .2) }); }
 ctx.fillStyle = hexa(A.D.lum, .35);
 for (const d of A.poussiere) { d.z += .01; const px = P.x + ((d.x + Math.sin(d.z) * .6 + 8 + t * d.v) % 16) - 8, py = P.y + ((d.y + Math.cos(d.z * .7) * .4 + 6 - t * d.v * .5) % 12 + 12) % 12 - 6; ctx.fillRect(px, py, .035, .035); }
 // particules
 let coulF = '', alphaF = -1;
 for (const f of A.fx) {
  if (f.k === 'anneau') { const k = 1 - f.vie / f.v0; ctx.strokeStyle = f.coul; ctx.globalAlpha = alphaF = 1 - k; ctx.lineWidth = .12 * (1 - k) + .02; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (.4 + .6 * k), 0, 6.28); ctx.stroke(); continue; }
  if (f.k) continue;
  if (f.x < x0 - 1 || f.x > x1 + 1 || f.y < y0 - 1 || f.y > y1 + 1) continue;
  const al = Math.ceil(clamp(f.vie / f.v0, 0, 1) * 4) / 4; if (al !== alphaF) { ctx.globalAlpha = alphaF = al; }
  if (f.coul !== coulF) { ctx.fillStyle = coulF = f.coul; }
  ctx.fillRect(f.x - f.taille / 2, f.y - f.taille / 2, f.taille, f.taille);
 }
 ctx.globalAlpha = 1;
 // lumière
 const lw = lum.width, lh = lum.height, k = lw / cw;
 lctx.globalCompositeOperation = 'source-over'; lctx.fillStyle = 'rgba(2,1,4,.97)'; lctx.fillRect(0, 0, lw, lh);
 lctx.globalCompositeOperation = 'destination-out';
 const ST = lueur('', '', 'trou'); const trou = (x, y, r, a) => { const X = (ox + x * TS) * k, Y = (oy + y * TS) * k, Rr = r * TS * k; if (X < -Rr || Y < -Rr || X > lw + Rr || Y > lh + Rr) return; lctx.globalAlpha = clamp(a, 0, 1); lctx.drawImage(ST, X - Rr, Y - Rr, Rr * 2, Rr * 2); };
 trou(P.x, P.y, 6.2, .95); trou(P.x, P.y, 2.6, .5);
 for (const l of A.lumieres) trou(l.x, l.y, l.r * .8 + Math.sin(t * 7 + l.f) * .2, .9);
 for (const p of A.projs) if (p.k !== 'fleche' && p.k !== 'fleche_e') trou(p.x, p.y, 2.2, .8);
 for (const z of A.zones) if (z.feu || (z.t < 0 && !z.ami)) trou(z.x, z.y, z.r + 1, .5);
 for (const m of A.mobs) if (!m.mort && (m.boss || m.k === 'spectre' || m.k === 'chaman')) trou(m.x, m.y, m.boss ? 3.5 : 1.6, .6);
 if (A.portail) trou(A.portail.x, A.portail.y, 4, 1);
 if (A.lumFlash) trou(A.lumFlash.x, A.lumFlash.y, 6, A.lumFlash.t * 3);
 for (const l of A.loot) if (l.obj && l.obj.rar !== 'normal') trou(l.x, l.y, 1.2, .5);
 lctx.globalAlpha = 1;
 ctx.setTransform(1, 0, 0, 1, 0, 0);
 if (!RENDU.off.lum) ctx.drawImage(lum, 0, 0, cw, ch);
 // lueur chaude des braseros
 ctx.globalCompositeOperation = 'lighter';
 const LL = lueur(rgbDe(A.D.lum)), LF = lueur('255,140,40');
 ctx.globalAlpha = .22;
 for (const l of A.lumieres) { const X = ox + l.x * TS, Y = oy + l.y * TS, r = TS * 2.4; if (X < -r || Y < -r || X > cw + r || Y > ch + r) continue; ctx.drawImage(LL, X - r, Y - r, r * 2, r * 2); }
 ctx.globalAlpha = .3;
 for (const p of A.projs) if (p.k === 'boule' || p.k === 'feu') { const X = ox + p.x * TS, Y = oy + p.y * TS, r = TS * 1.5; ctx.drawImage(LF, X - r, Y - r, r * 2, r * 2); }
 // teinte chaude autour du héros
 ctx.globalAlpha = .1; if (RENDU.teinte) { const X = ox + P.x * TS, Y = oy + P.y * TS, r = TS * 6; ctx.drawImage(LL, X - r, Y - r, r * 2, r * 2); }
 ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
 // vignette rouge quand la vie est basse
 if (P.pv < P.S.pvmax * .3 || P.hitf > 0) { ctx.globalAlpha = P.hitf > 0 ? .25 : .18 + .08 * Math.sin(t * 6); ctx.drawImage(vignette(), 0, 0, cw, ch); ctx.globalAlpha = 1; }
 // textes (dégâts, noms)
 ctx.textAlign = 'center';
 for (const m of A.mobs) {
  if (m.mort || m.objet || m.boss) continue;
  const X = ox + m.x * TS, Y = oy + (m.y - m.r - .55) * TS;
  if (X < 0 || Y < 0 || X > cw || Y > ch) continue;
  if (m.pv < m.pvmax || m.elite) { const w = TS * (m.elite ? 1 : .7); ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(X - w / 2 - 1, Y - 1, w + 2, TS * .09 + 2); ctx.fillStyle = m.elite ? '#ffb030' : '#c62020'; ctx.fillRect(X - w / 2, Y, w * clamp(m.pv / m.pvmax, 0, 1), TS * .09); }
  if (m.elite) { ctx.font = `600 ${Math.round(TS * .26)}px 'Alegreya Sans', sans-serif`; ctx.fillStyle = '#ffc860'; ctx.fillText(`${m.aff.join(' ')} ${m.M.nom}`, X, Y - TS * .1); }
 }
 for (const tx of A.textes) {
  const X = ox + tx.x * TS, Y = oy + (tx.y - tx.t * .9) * TS; ctx.globalAlpha = clamp(1.4 - tx.t * 1.4, 0, 1);
  ctx.font = `${tx.gros ? 800 : 700} ${Math.round(TS * (tx.gros ? .5 : .34))}px 'Alegreya Sans', sans-serif`; ctx.lineWidth = 3 * RENDU.q; ctx.strokeStyle = 'rgba(0,0,0,.8)'; ctx.strokeText(tx.s, X, Y); ctx.fillStyle = tx.coul; ctx.fillText(tx.s, X, Y);
 }
 ctx.globalAlpha = 1;
 // noms des objets au sol (proches)
 ctx.font = `600 ${Math.round(TS * .27)}px 'Alegreya Sans', sans-serif`;
 for (const l of A.loot) if (l.obj && Math.hypot(l.x - P.x, l.y - P.y) < 6) { const X = ox + l.x * TS, Y = oy + (l.y - .35) * TS; const w = ctx.measureText(l.obj.nom).width + 10; ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(X - w / 2, Y - TS * .3, w, TS * .38); ctx.fillStyle = RARETES.find(r => r.id === l.obj.rar).coul; ctx.fillText(l.obj.nom, X, Y); }
}
function hexa(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; }

/* ---------- Personnages ---------- */
function ombre(ctx, x, y, rx) { ctx.fillStyle = 'rgba(0,0,0,.38)'; ctx.beginPath(); ctx.ellipse(x, y + .05, rx, rx * .42, 0, 0, 6.28); ctx.fill(); }
function dessinerHeros(ctx, P, A) {
 ctx.save(); ctx.translate(P.x, P.y); ctx.scale(1.22, 1.22); ctx.translate(-P.x, -P.y);
 dessinerHeros0(ctx, P, A); ctx.restore();
}
function dessinerHeros0(ctx, P, A) {
 const h = A.X.o.heros, C = h.classe, x = P.x, y = P.y, a = P.ang, M = A.X.o.couleurs || ['#c8632a', '#f2d7a0'];
 const marche = Math.sin(P.pas) * (P.mvx || P.mvy ? 1 : 0);
 ctx.globalAlpha = P.inv > 0 && !P.dash ? .6 + .4 * Math.sin(A.t * 40) : 1;
 ombre(ctx, x, y, .34);
 if (P.buff > 0) { ctx.strokeStyle = `rgba(255,110,40,${.4 + .2 * Math.sin(A.t * 10)})`; ctx.lineWidth = .05; ctx.beginPath(); ctx.ellipse(x, y, .5, .22, 0, 0, 6.28); ctx.stroke(); }
 const devant = Math.sin(a) > -.2; // arme devant le corps si on regarde vers le bas
 const arme = () => dessinerArmeHeros(ctx, P, A, C);
 if (!devant) arme();
 // jambes
 ctx.fillStyle = '#2a2420';
 ctx.beginPath(); ctx.ellipse(x - .1, y - .05 + marche * .05, .07, .1, 0, 0, 6.28); ctx.fill();
 ctx.beginPath(); ctx.ellipse(x + .1, y - .05 - marche * .05, .07, .1, 0, 0, 6.28); ctx.fill();
 // cape
 const cape = C === 'arcaniste' ? '#2b2f6e' : C === 'rodeur' ? '#34482b' : M[0];
 ctx.fillStyle = cape; ctx.beginPath(); ctx.moveTo(x - .2, y - .48); ctx.quadraticCurveTo(x - .3 - marche * .03, y - .05, x - .2, y + .04); ctx.lineTo(x + .2, y + .04); ctx.quadraticCurveTo(x + .3 + marche * .03, y - .05, x + .2, y - .48); ctx.fill();
 // torse
 const corps = C === 'chevalier' ? '#9aa3ad' : C === 'arcaniste' ? '#454aa0' : '#5a6b3c';
 const gr = ctx.createLinearGradient(x - .2, 0, x + .2, 0); gr.addColorStop(0, ombrage(corps, .75)); gr.addColorStop(.5, corps); gr.addColorStop(1, ombrage(corps, .6));
 ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(x, y - .3, .19, .23, 0, 0, 6.28); ctx.fill();
 if (C === 'chevalier') { ctx.fillStyle = M[0]; ctx.fillRect(x - .08, y - .44, .16, .3); ctx.fillStyle = M[1]; ctx.fillRect(x - .02, y - .4, .04, .2); ctx.fillRect(x - .06, y - .34, .12, .04); }
 if (C === 'arcaniste') { ctx.fillStyle = '#d8b44a'; ctx.fillRect(x - .17, y - .16, .34, .03); }
 if (C === 'rodeur') { ctx.strokeStyle = '#3a2a18'; ctx.lineWidth = .04; ctx.beginPath(); ctx.moveTo(x - .16, y - .46); ctx.lineTo(x + .14, y - .12); ctx.stroke(); }
 // tête
 const tx = x + Math.cos(a) * .03, ty = y - .56;
 if (C === 'chevalier') { const hg = ctx.createRadialGradient(tx - .04, ty - .05, .02, tx, ty, .16); hg.addColorStop(0, '#e8edf2'); hg.addColorStop(1, '#6d757e'); ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(tx, ty, .15, 0, 6.28); ctx.fill(); ctx.fillStyle = '#111'; if (Math.sin(a) > -.3) ctx.fillRect(tx - .09 + Math.cos(a) * .03, ty - .01, .18, .035); ctx.fillStyle = M[0]; ctx.beginPath(); ctx.moveTo(tx, ty - .15); ctx.quadraticCurveTo(tx - .12, ty - .3, tx - .2, ty - .18); ctx.lineTo(tx, ty - .12); ctx.fill(); }
 else { ctx.fillStyle = '#d9ab83'; ctx.beginPath(); ctx.arc(tx, ty, .12, 0, 6.28); ctx.fill(); ctx.fillStyle = cape; ctx.beginPath(); ctx.arc(tx, ty - .02, .155, Math.PI * .95, Math.PI * 2.05); ctx.lineTo(tx + .14, ty + .06); ctx.lineTo(tx - .14, ty + .06); ctx.fill(); if (Math.sin(a) > -.3) { ctx.fillStyle = '#d9ab83'; ctx.beginPath(); ctx.arc(tx + Math.cos(a) * .02, ty + .02, .085, 0, 6.28); ctx.fill(); ctx.fillStyle = '#222'; ctx.fillRect(tx - .045 + Math.cos(a) * .03, ty, .025, .025); ctx.fillRect(tx + .02 + Math.cos(a) * .03, ty, .025, .025); } }
 if (devant) arme();
 if (P.spin > 0) { ctx.strokeStyle = `rgba(255,240,200,${P.spin * 2})`; ctx.lineWidth = .08; ctx.beginPath(); ctx.arc(x, y - .3, 1.6, 0, 6.28); ctx.stroke(); }
 ctx.globalAlpha = 1;
}
function ombrage(hex, k) { const n = parseInt(hex.slice(1), 16); return `rgb(${(n >> 16 & 255) * k | 0},${(n >> 8 & 255) * k | 0},${(n & 255) * k | 0})`; }
function dessinerArmeHeros(ctx, P, A, C) {
 const x = P.x, y = P.y - .3, a = P.ang; const o = A.X.o.heros.equip.arme; const t = o ? o.arme : C === 'chevalier' ? 'epee' : C === 'arcaniste' ? 'baton' : 'arc';
 const anim = P.anim > 0 ? 1 - P.anim / P.animT : 1;
 const leg = o && o.rar === 'legendaire', rare = o && o.rar === 'rare';
 ctx.save(); ctx.translate(x, y);
 if (t === 'epee' || t === 'hache' || t === 'masse') {
  const sw = P.anim > 0 ? -1.3 + anim * 2.6 : .5; ctx.rotate(a + sw);
  ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = .05; ctx.beginPath(); ctx.moveTo(.1, 0); ctx.lineTo(.28, 0); ctx.stroke();
  ctx.fillStyle = '#a08a50'; ctx.fillRect(.26, -.07, .04, .14);
  if (t === 'epee') { ctx.fillStyle = leg ? '#ffb070' : '#dde3ea'; ctx.beginPath(); ctx.moveTo(.3, -.035); ctx.lineTo(.82, -.02); ctx.lineTo(.88, 0); ctx.lineTo(.82, .02); ctx.lineTo(.3, .035); ctx.fill(); }
  else if (t === 'hache') { ctx.strokeStyle = '#6b4a28'; ctx.lineWidth = .05; ctx.beginPath(); ctx.moveTo(.28, 0); ctx.lineTo(.8, 0); ctx.stroke(); ctx.fillStyle = leg ? '#ffb070' : '#c8ced6'; ctx.beginPath(); ctx.moveTo(.62, 0); ctx.quadraticCurveTo(.72, -.25, .86, -.2); ctx.lineTo(.84, .18); ctx.quadraticCurveTo(.72, .22, .62, 0); ctx.fill(); }
  else { ctx.strokeStyle = '#6b4a28'; ctx.lineWidth = .05; ctx.beginPath(); ctx.moveTo(.28, 0); ctx.lineTo(.7, 0); ctx.stroke(); ctx.fillStyle = leg ? '#ffb070' : '#9aa0a8'; ctx.beginPath(); ctx.arc(.78, 0, .12, 0, 6.28); ctx.fill(); ctx.fillStyle = '#d6dbe0'; ctx.beginPath(); ctx.arc(.75, -.04, .04, 0, 6.28); ctx.fill(); }
  if (P.anim > 0) { ctx.strokeStyle = `rgba(255,245,220,${.5 * (1 - anim)})`; ctx.lineWidth = .1; ctx.beginPath(); ctx.arc(0, 0, .78, -2.6 + anim * 2.6 - .3, anim * 2.6 - 1.3); ctx.stroke(); }
 } else if (t === 'baton' || t === 'sceptre') {
  ctx.rotate(a + (P.anim > 0 ? -.4 * (1 - anim) : .3));
  ctx.strokeStyle = t === 'baton' ? '#5a3c22' : '#c9a227'; ctx.lineWidth = .05; ctx.beginPath(); ctx.moveTo(-.25, 0); ctx.lineTo(.55, 0); ctx.stroke();
  const gl = ctx.createRadialGradient(.6, 0, 0, .6, 0, .16); gl.addColorStop(0, '#fff'); gl.addColorStop(.4, leg ? '#ff9a3a' : rare ? '#ffd84a' : '#a070ff'); gl.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(.6, 0, .16 + (P.anim > 0 ? .05 : 0), 0, 6.28); ctx.fill();
 } else {
  ctx.rotate(a);
  const tend = P.anim > 0 ? (1 - anim) * .12 : 0;
  ctx.strokeStyle = leg ? '#ff9a3a' : '#6b4a28'; ctx.lineWidth = .045; ctx.beginPath();
  if (t === 'arc') { ctx.arc(.2, 0, .32, -1.2, 1.2); ctx.stroke(); ctx.strokeStyle = '#ddd'; ctx.lineWidth = .015; ctx.beginPath(); ctx.moveTo(.2 + Math.cos(-1.2) * .32, Math.sin(-1.2) * .32); ctx.lineTo(.2 - tend, 0); ctx.lineTo(.2 + Math.cos(1.2) * .32, Math.sin(1.2) * .32); ctx.stroke(); }
  else { ctx.moveTo(0, 0); ctx.lineTo(.5, 0); ctx.stroke(); ctx.beginPath(); ctx.moveTo(.4, -.22); ctx.quadraticCurveTo(.5, 0, .4, .22); ctx.stroke(); }
 }
 ctx.restore();
}
function dessinerBrasero(ctx, e, t) {
 const x = e.x, y = e.y; ombre(ctx, x, y, .22);
 ctx.fillStyle = '#2a2622'; ctx.beginPath(); ctx.moveTo(x - .18, y - .35); ctx.lineTo(x + .18, y - .35); ctx.lineTo(x + .08, y); ctx.lineTo(x - .08, y); ctx.fill();
 ctx.fillStyle = '#4a4038'; ctx.fillRect(x - .2, y - .4, .4, .07);
 for (let i = 0; i < 4; i++) { const f = Math.sin(t * 9 + i * 1.7 + e.x), h = .28 + f * .07; ctx.fillStyle = i % 2 ? '#ff9a2a' : '#ffd36a'; ctx.beginPath(); ctx.moveTo(x - .14 + i * .08, y - .4); ctx.quadraticCurveTo(x - .12 + i * .08, y - .4 - h * .7, x - .1 + i * .07 + f * .03, y - .4 - h); ctx.quadraticCurveTo(x - .04 + i * .07, y - .4 - h * .5, x - .02 + i * .08, y - .4); ctx.fill(); }
}
const CACHE_DECOR = new Map();
function imageDecor(cle, TS, boite, ancre, dessin) {
 const k = cle + '|' + TS; let c = CACHE_DECOR.get(k); if (c) return c;
 if (CACHE_DECOR.size > 200) CACHE_DECOR.clear();
 const px = Math.ceil(boite * TS); c = document.createElement('canvas'); c.width = c.height = px; c.boite = boite; c.ancre = ancre;
 const g = c.getContext('2d'); g.setTransform(TS, 0, 0, TS, px / 2, px * ancre); dessin(g); CACHE_DECOR.set(k, c); return c;
}
function poserDecor(ctx, c, x, y) { ctx.drawImage(c, x - c.boite / 2, y - c.boite * c.ancre, c.boite, c.boite); }
function dessinerPilier(ctx, e, A) {
 if (!RENDU.vecteur) return poserDecor(ctx, imageDecor('pil' + A.type, A.TS, 2.2, .86, g => dessinerPilier0(g, { x: 0, y: 0 }, A)), e.x, e.y);
 dessinerPilier0(ctx, e, A);
}
function dessinerPilier0(ctx, e, A) {
 const x = e.x, y = e.y; ombre(ctx, x + .08, y + .1, .45);
 const c = A.D.face; const gr = ctx.createLinearGradient(x - .38, 0, x + .38, 0); gr.addColorStop(0, ombrage(c, .7)); gr.addColorStop(.45, ombrage(c, 1.8)); gr.addColorStop(1, ombrage(c, .5));
 ctx.fillStyle = gr; ctx.fillRect(x - .34, y - 1.6, .68, 1.6);
 ctx.fillStyle = ombrage(c, 2); ctx.fillRect(x - .42, y - 1.72, .84, .16); ctx.fillRect(x - .42, y - .12, .84, .14);
 ctx.fillStyle = ombrage(A.D.mur, 1.3); ctx.fillRect(x - .42, y - 1.76, .84, .06);
}
function dessinerPortail(ctx, e, t) {
 const x = e.x, y = e.y;
 for (let i = 0; i < 3; i++) { ctx.strokeStyle = `rgba(${120 + i * 50},${160 + i * 30},255,${.7 - i * .2})`; ctx.lineWidth = .08; ctx.beginPath(); ctx.ellipse(x, y - .6, .45 + i * .08 + Math.sin(t * 3 + i) * .03, .75 + i * .08, 0, 0, 6.28); ctx.stroke(); }
 const gr = ctx.createRadialGradient(x, y - .6, 0, x, y - .6, .7); gr.addColorStop(0, 'rgba(220,240,255,.9)'); gr.addColorStop(1, 'rgba(60,90,255,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(x, y - .6, .45, .75, 0, 0, 6.28); ctx.fill();
}
function dessinerObjetDecor(ctx, m) {
 if (!RENDU.vecteur && RENDU.TS) return poserDecor(ctx, imageDecor(m.k, RENDU.TS, 1.4, .72, g => dessinerObjetDecor0(g, { k: m.k, x: 0, y: 0, r: m.r })), m.x, m.y);
 dessinerObjetDecor0(ctx, m);
}
function dessinerObjetDecor0(ctx, m) {
 const x = m.x, y = m.y; ombre(ctx, x, y, m.r);
 if (m.k === 'jarre') { const gr = ctx.createRadialGradient(x - .07, y - .25, .02, x, y - .2, .28); gr.addColorStop(0, '#c49a6a'); gr.addColorStop(1, '#5e4024'); ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(x, y - .2, .22, .26, 0, 0, 6.28); ctx.fill(); ctx.fillStyle = '#3e2a16'; ctx.fillRect(x - .09, y - .5, .18, .08); }
 else { ctx.fillStyle = '#5b3a1c'; ctx.fillRect(x - .38, y - .45, .76, .45); ctx.fillStyle = '#7a5028'; ctx.fillRect(x - .38, y - .6, .76, .18); ctx.fillStyle = '#c9a227'; ctx.fillRect(x - .38, y - .47, .76, .05); ctx.fillRect(x - .05, y - .5, .1, .14); ctx.strokeStyle = '#2a1a0a'; ctx.lineWidth = .03; ctx.strokeRect(x - .38, y - .6, .76, .6); }
}
/* ---------- Monstres : corps mis en cache (8 directions × 4 poses) ---------- */
const CACHE_MOBS = new Map(); let cacheTS = 0;
const AVEC_ELAN = { brute: 1, ogre: 1, chaman: 1, wyverne: 1, soldat: 1, champion: 1, arbaletrier: 1, golem: 1, cultiste: 1 };
function corpsMob(ctx, m, a, pas, t) {
 switch (m.k) {
  case 'squelette': case 'archer': squelette(ctx, a, pas, m.k === 'archer', m); break;
  case 'liche': squelette(ctx, a, pas, false, m, true); break;
  case 'goule': goule(ctx, a, pas, m); break;
  case 'brute': case 'ogre': brute(ctx, a, pas, m, m.k === 'ogre'); break;
  case 'chaman': chaman(ctx, a, pas, m); break;
  case 'araignee': araignee(ctx, a, t, m); break;
  case 'spectre': spectre(ctx, a, t, m); break;
  case 'loup': loup(ctx, a, pas, m); break;
  case 'soldat': case 'champion': case 'arbaletrier': soldat(ctx, a, pas, m, m.k === 'champion', m.k === 'arbaletrier'); break;
  case 'wyverne': wyverne(ctx, a, t, m); break;
  case 'gobelin': gobelin(ctx, a, t, m); break;
  case 'rat': rat(ctx, a, t, m); break;
  case 'golem': golem(ctx, a, pas, m); break;
  case 'cultiste': cultiste(ctx, a, pas, m); break;
  case 'reine': ctx.scale(2.6, 2.6); araignee(ctx, a, t * .7, m); ctx.fillStyle = '#c9a227'; ctx.beginPath(); ctx.moveTo(Math.cos(a) * .1 - .08, -.22); ctx.lineTo(Math.cos(a) * .1 - .04, -.3); ctx.lineTo(Math.cos(a) * .1, -.24); ctx.lineTo(Math.cos(a) * .1 + .04, -.3); ctx.lineTo(Math.cos(a) * .1 + .08, -.22); ctx.fill(); break;
 }
}
function imageMob(m, TS) {
 if (TS !== cacheTS) { CACHE_MOBS.clear(); cacheTS = TS; }
 const sc = Math.round(m.r / m.M.r * 20) / 20, dir = ((Math.round(m.ang / (Math.PI / 4)) % 8) + 8) % 8;
 const per = Math.PI / 4, marche = m.etat === 'chasse';
 const f = marche ? Math.floor((((m.anim % per) + per) % per) / per * 4) : 0;
 const elan = AVEC_ELAN[m.k] && m.wind > 0 ? 1 : 0;
 const cle = m.k + (m.maison || '') + sc + '|' + dir + '|' + f + '|' + elan + '|' + (marche ? 1 : 0);
 let c = CACHE_MOBS.get(cle);
 if (c) return c;
 const boite = (m.M.boss ? 3.6 : 2.7) * sc, px = Math.ceil(boite * TS);
 c = document.createElement('canvas'); c.width = c.height = px; c.boite = boite;
 const g = c.getContext('2d'); g.setTransform(TS, 0, 0, TS, px / 2, px * .66);
 g.scale(sc * 1.18, sc * 1.18);
 const t = (f + .5) / 4 * per + (marche ? 0 : 0), fm = { k: m.k, M: m.M, wind: elan ? 1 : 0, maison: m.maison, anim: t };
 corpsMob(g, fm, dir * Math.PI / 4, Math.sin(t * 8) * (marche ? 1 : .2), t);
 if (CACHE_MOBS.size > 420) CACHE_MOBS.delete(CACHE_MOBS.keys().next().value);
 CACHE_MOBS.set(cle, c);
 return c;
}
function dessinerMob(ctx, m, A) {
 const x = m.x, y = m.y, a = m.ang, t = m.anim;
 ombre(ctx, x, y, m.r * .95);
 if (m.elite) { ctx.strokeStyle = `rgba(255,170,40,${.35 + .2 * Math.sin(t * 6)})`; ctx.lineWidth = .05; ctx.beginPath(); ctx.ellipse(x, y, m.r * 1.3, m.r * .55, 0, 0, 6.28); ctx.stroke(); }
 if (m.wind > 0 && m.attaque === 'cac') { ctx.fillStyle = 'rgba(255,40,20,.22)'; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, m.portee + m.r, a - .8, a + .8); ctx.fill(); }
 if (m.gel > 0) { ctx.fillStyle = 'rgba(170,220,255,.5)'; ctx.beginPath(); ctx.ellipse(x, y - m.r * .9, m.r * 1.1, m.r * 1.3, 0, 0, 6.28); ctx.fill(); }
 if (RENDU.vecteur) { ctx.save(); ctx.translate(x, y); const s = m.r / m.M.r; ctx.scale(s * 1.18, s * 1.18); corpsMob(ctx, m, a, Math.sin(t * 8) * (m.etat === 'chasse' ? 1 : .2), t); ctx.restore(); }
 else { const c = imageMob(m, A.TS), b = c.boite; ctx.drawImage(c, x - b / 2, y - b * .66, b, b); }
 if (m.hitf > 0) { ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.beginPath(); ctx.ellipse(x, y - m.r * 1.1, m.r * .9, m.r * 1.2, 0, 0, 6.28); ctx.fill(); }
 if (m.brule > 0) { ctx.fillStyle = 'rgba(255,120,20,.25)'; ctx.beginPath(); ctx.arc(x, y - m.r, m.r * .8, 0, 6.28); ctx.fill(); }
}
function bras(ctx, x1, y1, x2, y2, c, w) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
function squelette(ctx, a, pas, archer, m, liche) {
 const os = liche ? '#d8f4ff' : '#e4dcc6', fonce = '#8a826e';
 bras(ctx, -.08, -.1, -.1, .02 + pas * .04, os, .05); bras(ctx, .08, -.1, .1, .02 - pas * .04, os, .05);
 if (liche) { ctx.fillStyle = '#2a1840'; ctx.beginPath(); ctx.moveTo(-.28, -.55); ctx.lineTo(.28, -.55); ctx.lineTo(.34, .02); ctx.lineTo(-.34, .02); ctx.fill(); ctx.fillStyle = '#6b3fa0'; ctx.fillRect(-.3, -.02, .6, .04); }
 ctx.fillStyle = os; ctx.fillRect(-.03, -.5, .06, .36);
 for (let i = 0; i < 4; i++) { ctx.fillRect(-.13, -.47 + i * .07, .26, .03); }
 const ca = Math.cos(a), sa = Math.sin(a);
 const mx = ca * .22, my = -.32 + sa * .1;
 bras(ctx, 0, -.42, mx, my, os, .04);
 if (archer) { ctx.strokeStyle = '#6b4a28'; ctx.lineWidth = .04; ctx.beginPath(); ctx.arc(mx, my, .2, a - 1.2, a + 1.2); ctx.stroke(); }
 else if (liche) { bras(ctx, mx, my + .1, mx + ca * .1, my - .55, '#3a2a4a', .05); const gl = ctx.createRadialGradient(mx + ca * .1, my - .6, 0, mx + ca * .1, my - .6, .15); gl.addColorStop(0, '#fff'); gl.addColorStop(.5, '#7ad0ff'); gl.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(mx + ca * .1, my - .6, .15, 0, 6.28); ctx.fill(); }
 else bras(ctx, mx, my, mx + ca * .4, my + sa * .2 - .1, '#8a8f94', .05);
 const hx = ca * .02, hy = -.62;
 ctx.fillStyle = os; ctx.beginPath(); ctx.arc(hx, hy, .13, 0, 6.28); ctx.fill(); ctx.fillRect(hx - .07, hy + .06, .14, .07);
 if (sa > -.3) { ctx.fillStyle = liche ? '#7ad0ff' : '#1a0e08'; ctx.beginPath(); ctx.arc(hx - .05, hy, .035, 0, 6.28); ctx.arc(hx + .05, hy, .035, 0, 6.28); ctx.fill(); if (!liche) { ctx.fillStyle = '#ff5a2a'; ctx.fillRect(hx - .055, hy - .005, .015, .015); ctx.fillRect(hx + .045, hy - .005, .015, .015); } }
 if (liche) { ctx.fillStyle = '#c9a227'; ctx.beginPath(); ctx.moveTo(hx - .13, hy - .08); for (let i = 0; i < 5; i++) { ctx.lineTo(hx - .13 + i * .065 + .03, hy - .22); ctx.lineTo(hx - .13 + i * .065 + .065, hy - .1); } ctx.lineTo(hx + .13, hy - .08); ctx.fill(); }
}
function goule(ctx, a, pas, m) {
 const c = '#7f9a62', ca = Math.cos(a), sa = Math.sin(a);
 ctx.fillStyle = '#3a4a2c'; ctx.beginPath(); ctx.ellipse(-.08, -.02 + pas * .03, .06, .08, 0, 0, 6.28); ctx.ellipse(.08, -.02 - pas * .03, .06, .08, 0, 0, 6.28); ctx.fill();
 ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(ca * .05, -.22, .17, .15, 0, 0, 6.28); ctx.fill();
 bras(ctx, -.12, -.25, -.1 + ca * .3, -.12 + sa * .15 + pas * .05, c, .05); bras(ctx, .12, -.25, .1 + ca * .3, -.12 + sa * .15 - pas * .05, c, .05);
 ctx.fillStyle = '#e8e0c0'; for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.arc(sgn * .1 + ca * .32, -.12 + sa * .15, .025, 0, 6.28); ctx.fill(); }
 ctx.fillStyle = '#6a8450'; ctx.beginPath(); ctx.arc(ca * .12, -.36 + sa * .04, .1, 0, 6.28); ctx.fill();
 if (sa > -.4) { ctx.fillStyle = '#ffe94a'; ctx.fillRect(ca * .12 - .05, -.38, .03, .03); ctx.fillRect(ca * .12 + .02, -.38, .03, .03); }
}
function brute(ctx, a, pas, m, ogre) {
 const c = ogre ? '#7d8c4f' : '#8a6a52', ca = Math.cos(a), sa = Math.sin(a);
 ctx.fillStyle = '#3a2a20'; ctx.beginPath(); ctx.ellipse(-.18, -.05 + pas * .05, .12, .14, 0, 0, 6.28); ctx.ellipse(.18, -.05 - pas * .05, .12, .14, 0, 0, 6.28); ctx.fill();
 const gr = ctx.createRadialGradient(-.1, -.5, .05, 0, -.4, .45); gr.addColorStop(0, ombrage(c, 1.3)); gr.addColorStop(1, ombrage(c, .65)); ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(0, -.4, .4, .36, 0, 0, 6.28); ctx.fill();
 ctx.fillStyle = '#4a3020'; ctx.fillRect(-.36, -.25, .72, .08);
 const mx = ca * .45, my = -.4 + sa * .2;
 bras(ctx, -.3, -.5, -.42, -.2 + pas * .06, c, .13);
 bras(ctx, .3, -.5, mx, my, c, .13);
 // massue
 const sw = m.wind > 0 ? -1.2 : 0;
 ctx.save(); ctx.translate(mx, my); ctx.rotate(a - 1.2 + sw * -.5); ctx.fillStyle = '#5a3c22'; ctx.fillRect(0, -.05, .55, .1); ctx.fillStyle = ogre ? '#6a6f74' : '#4a3020'; ctx.beginPath(); ctx.ellipse(.6, 0, .17, .13, 0, 0, 6.28); ctx.fill(); if (ogre) { ctx.fillStyle = '#ccc'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(.55 + i * .04, (i % 2 - .5) * .2, .03, 0, 6.28); ctx.fill(); } } ctx.restore();
 ctx.fillStyle = ombrage(c, 1.1); ctx.beginPath(); ctx.arc(ca * .05, -.78, .17, 0, 6.28); ctx.fill();
 ctx.fillStyle = '#e8dcc0'; ctx.beginPath(); ctx.moveTo(-.12, -.88); ctx.lineTo(-.22, -1.02); ctx.lineTo(-.06, -.9); ctx.moveTo(.12, -.88); ctx.lineTo(.22, -1.02); ctx.lineTo(.06, -.9); ctx.fill();
 if (sa > -.3) { ctx.fillStyle = '#ff3a1a'; ctx.fillRect(ca * .05 - .08, -.8, .04, .03); ctx.fillRect(ca * .05 + .04, -.8, .04, .03); ctx.fillStyle = '#eee'; ctx.fillRect(ca * .05 - .06, -.7, .03, .04); ctx.fillRect(ca * .05 + .03, -.7, .03, .04); }
 if (ogre) { ctx.fillStyle = '#c9a227'; ctx.fillRect(ca * .05 - .14, -.96, .28, .06); }
}
function chaman(ctx, a, pas, m) {
 const ca = Math.cos(a), sa = Math.sin(a);
 ctx.fillStyle = '#4a2a5a'; ctx.beginPath(); ctx.moveTo(-.2, -.52); ctx.lineTo(.2, -.52); ctx.lineTo(.26, 0); ctx.lineTo(-.26, 0); ctx.fill();
 ctx.fillStyle = '#9b5fb8'; ctx.beginPath(); ctx.ellipse(0, -.4, .15, .14, 0, 0, 6.28); ctx.fill();
 bras(ctx, .12, -.4, ca * .3, -.3 + sa * .1, '#6a8a50', .04);
 bras(ctx, ca * .3, -.05, ca * .3, -.85, '#5a3c22', .04);
 const gl = ctx.createRadialGradient(ca * .3, -.9, 0, ca * .3, -.9, .15); gl.addColorStop(0, '#fff'); gl.addColorStop(.4, m.wind > 0 ? '#ff9a3a' : '#b070ff'); gl.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(ca * .3, -.9, .15, 0, 6.28); ctx.fill();
 ctx.fillStyle = '#6a8a50'; ctx.beginPath(); ctx.arc(0, -.62, .1, 0, 6.28); ctx.fill();
 ctx.fillStyle = '#e8dcc0'; ctx.beginPath(); ctx.arc(0, -.64, .1, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#c03030'; ctx.fillRect(-.1, -.66, .2, .02);
 if (sa > -.3) { ctx.fillStyle = '#ffd84a'; ctx.fillRect(-.05, -.62, .03, .03); ctx.fillRect(.02, -.62, .03, .03); }
}
function araignee(ctx, a, t, m) {
 ctx.strokeStyle = '#1e1a1c'; ctx.lineWidth = .035;
 for (let i = 0; i < 4; i++) for (const sgn of [-1, 1]) { const ph = Math.sin(t * 14 + i * 1.3 + (sgn > 0 ? 1.5 : 0)) * .08; const la = a + sgn * (.8 + i * .45); ctx.beginPath(); ctx.moveTo(0, -.12); ctx.quadraticCurveTo(Math.cos(la) * .25, -.3 + Math.sin(la) * .12, Math.cos(la) * .42 + ph, -.05 + Math.sin(la) * .25); ctx.stroke(); }
 ctx.fillStyle = '#2c2426'; ctx.beginPath(); ctx.ellipse(-Math.cos(a) * .14, -.14 - Math.sin(a) * .06, .17, .14, 0, 0, 6.28); ctx.fill();
 ctx.fillStyle = '#5a1a1a'; ctx.beginPath(); ctx.arc(-Math.cos(a) * .16, -.18 - Math.sin(a) * .06, .05, 0, 6.28); ctx.fill();
 ctx.fillStyle = '#3a3034'; ctx.beginPath(); ctx.arc(Math.cos(a) * .1, -.13 + Math.sin(a) * .05, .09, 0, 6.28); ctx.fill();
 ctx.fillStyle = '#ff3030'; for (let i = 0; i < 3; i++) ctx.fillRect(Math.cos(a) * .15 - .04 + i * .03, -.16 + Math.sin(a) * .06, .018, .018);
}
function spectre(ctx, a, t, m) {
 const fl = Math.sin(t * 3) * .06;
 ctx.globalAlpha *= .78;
 const gr = ctx.createLinearGradient(0, -.9, 0, .1); gr.addColorStop(0, 'rgba(200,235,255,.95)'); gr.addColorStop(1, 'rgba(90,150,220,0)');
 ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(-.2, -.6 + fl); ctx.quadraticCurveTo(-.3, -.2, -.18 + Math.sin(t * 5) * .05, .05); ctx.lineTo(0, -.1); ctx.lineTo(.18 + Math.sin(t * 5 + 1) * .05, .05); ctx.quadraticCurveTo(.3, -.2, .2, -.6 + fl); ctx.fill();
 ctx.fillStyle = 'rgba(220,240,255,.95)'; ctx.beginPath(); ctx.arc(0, -.66 + fl, .15, 0, 6.28); ctx.fill();
 if (Math.sin(a) > -.4) { ctx.fillStyle = '#103050'; ctx.beginPath(); ctx.ellipse(-.05, -.66 + fl, .035, .05, 0, 0, 6.28); ctx.ellipse(.05, -.66 + fl, .035, .05, 0, 0, 6.28); ctx.fill(); }
 ctx.globalAlpha = 1;
}
function loup(ctx, a, pas, m) {
 const ca = Math.cos(a), sa = Math.sin(a), c = '#8c8f96';
 ctx.save(); ctx.rotate(Math.abs(ca) > .4 ? 0 : 0);
 const dir = ca >= 0 ? 1 : -1;
 ctx.scale(dir, 1);
 ctx.fillStyle = '#4a4c52'; for (const [lx, ph] of [[-.22, 0], [-.1, 1], [.12, 0], [.24, 1]]) { ctx.fillRect(lx - .025, -.12, .05, .14 + Math.sin(pas * 3 + ph * 3) * .03); }
 ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, -.22, .32, .13, 0, 0, 6.28); ctx.fill();
 ctx.strokeStyle = c; ctx.lineWidth = .07; ctx.beginPath(); ctx.moveTo(-.3, -.24); ctx.quadraticCurveTo(-.45, -.32, -.5, -.18 + pas * .05); ctx.stroke();
 ctx.fillStyle = ombrage(c, 1.1); ctx.beginPath(); ctx.ellipse(.32, -.32 - sa * .03, .13, .1, -.2, 0, 6.28); ctx.fill(); ctx.beginPath(); ctx.moveTo(.4, -.3); ctx.lineTo(.54, -.27); ctx.lineTo(.4, -.24); ctx.fill();
 ctx.beginPath(); ctx.moveTo(.26, -.4); ctx.lineTo(.3, -.5); ctx.lineTo(.34, -.4); ctx.fill();
 ctx.fillStyle = '#ffd84a'; ctx.fillRect(.36, -.35, .03, .025);
 ctx.restore();
}
function soldat(ctx, a, pas, m, champion, arb) {
 const ca = Math.cos(a), sa = Math.sin(a), M = MAISONS[m.maison] || MAISONS.rebelles;
 ctx.fillStyle = '#2a2622'; ctx.beginPath(); ctx.ellipse(-.08, -.03 + pas * .04, .06, .09, 0, 0, 6.28); ctx.ellipse(.08, -.03 - pas * .04, .06, .09, 0, 0, 6.28); ctx.fill();
 const corps = champion ? '#c9ced4' : '#8a9097';
 ctx.fillStyle = corps; ctx.beginPath(); ctx.ellipse(0, -.3, .18, .22, 0, 0, 6.28); ctx.fill();
 ctx.fillStyle = M.c1; ctx.fillRect(-.09, -.44, .18, .3); ctx.fillStyle = M.c2; ctx.fillRect(-.03, -.38, .06, .12);
 // bouclier
 if (sa < .5) { ctx.fillStyle = M.c1; ctx.beginPath(); ctx.moveTo(-.28, -.48); ctx.lineTo(-.1, -.48); ctx.lineTo(-.12, -.22); ctx.lineTo(-.19, -.12); ctx.lineTo(-.26, -.22); ctx.fill(); ctx.strokeStyle = M.c2; ctx.lineWidth = .02; ctx.stroke(); }
 const mx = ca * .2, my = -.32 + sa * .08, sw = m.wind > 0 ? -.8 : 0;
 bras(ctx, .1, -.38, mx, my, corps, .05);
 ctx.save(); ctx.translate(mx, my); ctx.rotate(a + sw); if (arb) { ctx.fillStyle = '#6b4a28'; ctx.fillRect(0, -.03, .45, .06); ctx.strokeStyle = '#4a3a28'; ctx.lineWidth = .04; ctx.beginPath(); ctx.moveTo(.35, -.22); ctx.quadraticCurveTo(.45, 0, .35, .22); ctx.stroke(); } else if (champion) { ctx.fillStyle = '#e8edf2'; ctx.fillRect(0, -.03, .75, .06); ctx.fillStyle = '#c9a227'; ctx.fillRect(-.02, -.08, .04, .16); } else { ctx.fillStyle = '#6b4a28'; ctx.fillRect(-.2, -.02, .9, .04); ctx.fillStyle = '#c8ced6'; ctx.beginPath(); ctx.moveTo(.7, -.05); ctx.lineTo(.85, 0); ctx.lineTo(.7, .05); ctx.fill(); } ctx.restore();
 const hg = ctx.createRadialGradient(-.03, -.62, .02, 0, -.58, .14); hg.addColorStop(0, '#e8edf2'); hg.addColorStop(1, '#5d656e'); ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(ca * .02, -.58, .13, 0, 6.28); ctx.fill();
 if (sa > -.3) { ctx.fillStyle = '#111'; ctx.fillRect(ca * .03 - .08, -.59, .16, .03); }
 if (champion) { ctx.fillStyle = M.c1; ctx.beginPath(); ctx.moveTo(0, -.7); ctx.quadraticCurveTo(-.1, -.95, -.25, -.85); ctx.quadraticCurveTo(-.1, -.8, 0, -.66); ctx.fill(); }
}
function wyverne(ctx, a, t, m) {
 const ca = Math.cos(a), sa = Math.sin(a), bat = Math.sin(t * 6) * .25;
 const c = '#c2462a';
 // ailes
 for (const sgn of [-1, 1]) { ctx.fillStyle = 'rgba(120,30,20,.9)'; ctx.beginPath(); ctx.moveTo(0, -.45); ctx.quadraticCurveTo(sgn * .6, -1.1 - bat, sgn * 1.15, -.75 - bat * .6); ctx.lineTo(sgn * .95, -.4); ctx.lineTo(sgn * .75, -.5); ctx.lineTo(sgn * .55, -.25); ctx.lineTo(sgn * .3, -.35); ctx.fill(); ctx.strokeStyle = '#3a0e08'; ctx.lineWidth = .03; ctx.stroke(); }
 // queue
 ctx.strokeStyle = c; ctx.lineWidth = .14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-ca * .2, -.25); ctx.quadraticCurveTo(-ca * .7, -.1 + Math.sin(t * 2) * .1, -ca * 1.0, -.05); ctx.stroke();
 const gr = ctx.createRadialGradient(-.1, -.55, .05, 0, -.4, .5); gr.addColorStop(0, '#e8704a'); gr.addColorStop(1, '#6a1a10'); ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(0, -.4, .38, .32, 0, 0, 6.28); ctx.fill();
 ctx.strokeStyle = c; ctx.lineWidth = .16; ctx.beginPath(); ctx.moveTo(ca * .2, -.55); ctx.quadraticCurveTo(ca * .45, -.95, ca * .55, -.9 + sa * .2); ctx.stroke();
 ctx.fillStyle = '#d0553a'; ctx.beginPath(); ctx.ellipse(ca * .62, -.92 + sa * .22, .17, .12, a, 0, 6.28); ctx.fill();
 ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(ca * .66 - sa * .05, -.96 + sa * .2, .03, 0, 6.28); ctx.arc(ca * .66 + sa * .05, -.96 + sa * .2, .03, 0, 6.28); ctx.fill();
 if (m.wind > 0) { const gl = ctx.createRadialGradient(ca * .8, -.9 + sa * .3, 0, ca * .8, -.9 + sa * .3, .25); gl.addColorStop(0, '#fff2c0'); gl.addColorStop(1, 'rgba(255,90,20,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(ca * .8, -.9 + sa * .3, .25, 0, 6.28); ctx.fill(); }
}

function dessinerAutel(ctx, a, t) {
 const D = AUTELS[a.k], x = a.x, y = a.y;
 ombre(ctx, x, y, .4);
 ctx.fillStyle = '#3a3530'; ctx.beginPath(); ctx.moveTo(x - .36, y); ctx.lineTo(x + .36, y); ctx.lineTo(x + .28, y - .18); ctx.lineTo(x - .28, y - .18); ctx.fill();
 const gr = ctx.createLinearGradient(x - .2, 0, x + .2, 0); gr.addColorStop(0, '#4a443c'); gr.addColorStop(.5, '#8a8276'); gr.addColorStop(1, '#3a342c');
 ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x - .2, y - .18); ctx.lineTo(x - .14, y - 1.3); ctx.lineTo(x, y - 1.45); ctx.lineTo(x + .14, y - 1.3); ctx.lineTo(x + .2, y - .18); ctx.fill();
 const pulse = a.pris ? .25 : .6 + .4 * Math.sin(t * 3 + x);
 ctx.globalAlpha = pulse; ctx.fillStyle = D.coul; ctx.beginPath(); ctx.arc(x, y - .85, .09, 0, 6.28); ctx.fill();
 ctx.strokeStyle = D.coul; ctx.lineWidth = .03; ctx.beginPath(); ctx.moveTo(x, y - .7); ctx.lineTo(x, y - .4); ctx.moveTo(x - .08, y - 1.05); ctx.lineTo(x + .08, y - 1.15); ctx.stroke();
 if (!a.pris) { const g2 = ctx.createRadialGradient(x, y - .85, 0, x, y - .85, .5); g2.addColorStop(0, D.coul); g2.addColorStop(1, 'rgba(0,0,0,0)'); ctx.globalAlpha = .35 * pulse; ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(x, y - .85, .5, 0, 6.28); ctx.fill(); }
 ctx.globalAlpha = 1;
}
function gobelin(ctx, a, t, m) {
 const ca = Math.cos(a), pas = Math.sin(t * 16);
 ctx.fillStyle = '#4a3a20'; ctx.beginPath(); ctx.ellipse(-.07, -.02 + pas * .04, .05, .07, 0, 0, 6.28); ctx.ellipse(.07, -.02 - pas * .04, .05, .07, 0, 0, 6.28); ctx.fill();
 // sac d'or
 ctx.fillStyle = '#8a6a3a'; ctx.beginPath(); ctx.arc(-ca * .18, -.42, .2, 0, 6.28); ctx.fill(); ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(-ca * .18, -.56, .07, 0, 6.28); ctx.fill();
 ctx.fillStyle = '#7a9a3a'; ctx.beginPath(); ctx.ellipse(0, -.25, .13, .14, 0, 0, 6.28); ctx.fill();
 ctx.beginPath(); ctx.arc(ca * .06, -.46, .11, 0, 6.28); ctx.fill();
 ctx.beginPath(); ctx.moveTo(ca * .06 - .1, -.5); ctx.lineTo(ca * .06 - .26, -.6); ctx.lineTo(ca * .06 - .06, -.44); ctx.moveTo(ca * .06 + .1, -.5); ctx.lineTo(ca * .06 + .26, -.6); ctx.lineTo(ca * .06 + .06, -.44); ctx.fill();
 ctx.fillStyle = '#ffe94a'; ctx.fillRect(ca * .06 - .05, -.48, .03, .03); ctx.fillRect(ca * .06 + .02, -.48, .03, .03);
}
function dessinerAllie(ctx, C, A) {
 const x = C.x, y = C.y, a = C.ang, K = C.K;
 ctx.globalAlpha = C.ko > 0 ? .45 : 1;
 ombre(ctx, x, y, .3);
 ctx.strokeStyle = 'rgba(120,220,140,.55)'; ctx.lineWidth = .035; ctx.beginPath(); ctx.ellipse(x, y, .42, .18, 0, 0, 6.28); ctx.stroke();
 ctx.save(); ctx.translate(x, y); ctx.scale(1.15, 1.15);
 if (C.ko > 0) { ctx.rotate(1.4); }
 const pas = Math.sin(C.pas) * .04, ca = Math.cos(a), sa = Math.sin(a);
 ctx.fillStyle = '#2a2420'; ctx.beginPath(); ctx.ellipse(-.08, -.03 + pas, .06, .09, 0, 0, 6.28); ctx.ellipse(.08, -.03 - pas, .06, .09, 0, 0, 6.28); ctx.fill();
 const robe = C.k === 'pretresse' ? '#e8dcc0' : C.k === 'arbaletriere' ? '#5a6b3c' : '#9aa3ad';
 ctx.fillStyle = robe; ctx.beginPath(); ctx.ellipse(0, -.3, .17, .21, 0, 0, 6.28); ctx.fill();
 const M = A.X.o.couleurs || ['#c8632a', '#f2d7a0']; ctx.fillStyle = M[0]; ctx.fillRect(-.06, -.42, .12, .24);
 const mx = ca * .2, my = -.32 + sa * .08;
 ctx.save(); ctx.translate(mx, my); ctx.rotate(a + (C.anim2 > 0 ? -.6 : 0));
 if (C.k === 'ecuyer') { ctx.fillStyle = '#dde3ea'; ctx.fillRect(0, -.025, .6, .05); }
 else if (C.k === 'arbaletriere') { ctx.fillStyle = '#6b4a28'; ctx.fillRect(0, -.03, .42, .06); ctx.strokeStyle = '#4a3a28'; ctx.lineWidth = .04; ctx.beginPath(); ctx.moveTo(.32, -.2); ctx.quadraticCurveTo(.42, 0, .32, .2); ctx.stroke(); }
 else { ctx.strokeStyle = '#c9a227'; ctx.lineWidth = .04; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(.5, 0); ctx.stroke(); ctx.fillStyle = '#fff2b0'; ctx.beginPath(); ctx.arc(.55, 0, .08, 0, 6.28); ctx.fill(); }
 ctx.restore();
 ctx.fillStyle = C.k === 'ecuyer' ? '#b8c0c8' : '#d9ab83'; ctx.beginPath(); ctx.arc(ca * .02, -.56, .12, 0, 6.28); ctx.fill();
 if (C.k === 'pretresse') { ctx.fillStyle = '#f4ecd8'; ctx.beginPath(); ctx.arc(ca * .02, -.58, .14, Math.PI, 0); ctx.fill(); }
 if (C.k === 'arbaletriere') { ctx.fillStyle = '#7a3a1a'; ctx.beginPath(); ctx.arc(ca * .02, -.6, .13, Math.PI, 0); ctx.fill(); }
 ctx.restore();
 if (C.anim2 > 0) C.anim2 -= 1 / 60;
 // barre de vie
 ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x - .35, y - 1.05, .7, .07); ctx.fillStyle = '#5ac85a'; ctx.fillRect(x - .35, y - 1.05, .7 * Math.max(0, C.pv / C.pvmax), .07);
 ctx.globalAlpha = 1;
}

function rat(ctx, a, t, m) {
 const ca = Math.cos(a), dir = ca >= 0 ? 1 : -1; ctx.scale(dir, 1);
 ctx.strokeStyle = '#b08a80'; ctx.lineWidth = .03; ctx.beginPath(); ctx.moveTo(-.18, -.08); ctx.quadraticCurveTo(-.36, -.02 + Math.sin(t * 12) * .05, -.42, -.12); ctx.stroke();
 ctx.fillStyle = '#5a4a3e'; ctx.beginPath(); ctx.ellipse(0, -.1, .2, .1, 0, 0, 6.28); ctx.fill();
 ctx.beginPath(); ctx.ellipse(.2, -.13, .09, .07, -.3, 0, 6.28); ctx.fill();
 ctx.fillStyle = '#c08a8a'; ctx.beginPath(); ctx.arc(.16, -.2, .035, 0, 6.28); ctx.fill(); ctx.fillStyle = '#ff3030'; ctx.fillRect(.24, -.16, .02, .02);
}
function golem(ctx, a, pas, m) {
 const c = '#8a8478', ca = Math.cos(a), sa = Math.sin(a);
 ctx.fillStyle = '#4a463e'; ctx.fillRect(-.28, -.18 + pas * .03, .2, .2); ctx.fillRect(.08, -.18 - pas * .03, .2, .2);
 const gr = ctx.createLinearGradient(-.45, 0, .45, 0); gr.addColorStop(0, '#5e5950'); gr.addColorStop(.5, '#a8a294'); gr.addColorStop(1, '#4e4a42');
 ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(-.42, -.25); ctx.lineTo(-.36, -.82); ctx.lineTo(.36, -.86); ctx.lineTo(.44, -.25); ctx.closePath(); ctx.fill();
 ctx.strokeStyle = 'rgba(30,25,20,.6)'; ctx.lineWidth = .025; ctx.beginPath(); ctx.moveTo(-.2, -.8); ctx.lineTo(-.05, -.5); ctx.lineTo(-.25, -.3); ctx.moveTo(.15, -.82); ctx.lineTo(.25, -.45); ctx.stroke();
 const sw = m.wind > 0 ? -.25 : 0;
 ctx.fillStyle = c; ctx.fillRect(-.62, -.78 + sw, .2, .5); ctx.fillRect(.42, -.78 + sw, .2, .5);
 ctx.fillStyle = '#9a9488'; ctx.fillRect(-.16 + ca * .05, -1.05, .32, .24);
 if (sa > -.3) { ctx.fillStyle = '#7ad0ff'; ctx.fillRect(-.1 + ca * .05, -.97, .06, .04); ctx.fillRect(.04 + ca * .05, -.97, .06, .04); }
 ctx.fillStyle = 'rgba(122,208,255,.6)'; ctx.beginPath(); ctx.arc(0, -.55, .07, 0, 6.28); ctx.fill();
}
function cultiste(ctx, a, pas, m) {
 const ca = Math.cos(a), sa = Math.sin(a);
 ctx.fillStyle = '#3a1010'; ctx.beginPath(); ctx.moveTo(-.2, -.55); ctx.lineTo(.2, -.55); ctx.lineTo(.27, 0); ctx.lineTo(-.27, 0); ctx.fill();
 ctx.fillStyle = '#7a2a2a'; ctx.beginPath(); ctx.ellipse(0, -.4, .15, .14, 0, 0, 6.28); ctx.fill();
 ctx.fillStyle = '#c9a227'; ctx.fillRect(-.16, -.2, .32, .03);
 ctx.fillStyle = '#2a0808'; ctx.beginPath(); ctx.moveTo(-.14, -.55); ctx.lineTo(0, -.85); ctx.lineTo(.14, -.55); ctx.fill();
 if (sa > -.3) { ctx.fillStyle = '#ff6a2a'; ctx.fillRect(-.05 + ca * .02, -.62, .03, .03); ctx.fillRect(.02 + ca * .02, -.62, .03, .03); }
 const gl = ctx.createRadialGradient(ca * .28, -.38, 0, ca * .28, -.38, .14); gl.addColorStop(0, '#fff2c0'); gl.addColorStop(.4, m.wind > 0 ? '#ff6a1a' : '#a03010'); gl.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(ca * .28, -.38, .14, 0, 6.28); ctx.fill();
}
