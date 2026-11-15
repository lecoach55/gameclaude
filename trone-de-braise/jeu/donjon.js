'use strict';
/* =========================================================
   Donjons : génération, combat en temps réel, IA des monstres, butin
   Unité = une case. Aucune dépendance au DOM (testable sous Node).
   ========================================================= */
const MUR = 0, SOL = 1, ESC = 2, PIL = 3;

function genCarte(W, H, nSalles, boss) {
 const t = new Uint8Array(W * H), salles = [];
 for (let k = 0; k < 400 && salles.length < nSalles; k++) {
  const w = ri(6, 11), h = ri(5, 9), x = ri(2, W - w - 3), y = ri(2, H - h - 3);
  if (salles.some(s => x < s.x + s.w + 3 && x + w + 3 > s.x && y < s.y + s.h + 3 && y + h + 3 > s.y)) continue;
  salles.push({ x, y, w, h, cx: x + (w >> 1), cy: y + (h >> 1) });
 }
 const creuse = (x, y) => { if (x > 0 && y > 0 && x < W - 1 && y < H - 1) t[y * W + x] = SOL; };
 for (const s of salles) for (let y = s.y; y < s.y + s.h; y++) for (let x = s.x; x < s.x + s.w; x++) creuse(x, y);
 const couloir = (a, b) => {
  const larg = chance(.5) ? 2 : 3; let x = a.cx, y = a.cy; const hFirst = chance(.5);
  const pas = (tx, ty) => { while (x !== tx || y !== ty) { if (x !== tx) x += Math.sign(tx - x); else y += Math.sign(ty - y); for (let i = 0; i < larg; i++) for (let j = 0; j < larg; j++) creuse(x + i - 1, y + j - 1); } };
  if (hFirst) { pas(b.cx, y); pas(x, b.cy); } else { pas(x, b.cy); pas(b.cx, y); }
 };
 // arbre couvrant (Prim) + quelques boucles
 const lie = [salles[0]], reste = salles.slice(1);
 while (reste.length) {
  let best = null, bd = 1e9, bi = -1;
  for (const a of lie) reste.forEach((b, i) => { const d = Math.abs(a.cx - b.cx) + Math.abs(a.cy - b.cy); if (d < bd) { bd = d; best = [a, b]; bi = i; } });
  couloir(best[0], best[1]); lie.push(best[1]); reste.splice(bi, 1);
 }
 for (let i = 0; i < 2; i++) { const a = pick(salles), b = pick(salles); if (a !== b) couloir(a, b); }
 // distances depuis le départ
 const dist = bfs(t, W, H, salles[0].cx, salles[0].cy, 9999);
 let fin = salles[1] || salles[0];
 for (const s of salles) if (dist[s.cy * W + s.cx] > dist[fin.cy * W + fin.cx]) fin = s;
 if (boss) { // agrandir la salle du boss
  const w = 15, h = 12, x = clamp(fin.cx - 7, 2, W - w - 2), y = clamp(fin.cy - 6, 2, H - h - 2);
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) creuse(xx, yy);
  Object.assign(fin, { x, y, w, h, cx: x + 7, cy: y + 6 });
 }
 // piliers dans les grandes salles
 for (const s of salles) if (s.w >= 9 && s.h >= 7 && s !== salles[0] && chance(.55)) {
  for (const [dx, dy] of [[2, 2], [s.w - 3, 2], [2, s.h - 3], [s.w - 3, s.h - 3]]) t[(s.y + dy) * W + s.x + dx] = PIL;
 }
 return { t, W, H, salles, depart: salles[0], fin };
}
function bfs(t, W, H, sx, sy, max) {
 const d = new Int16Array(W * H).fill(-1), q = new Int32Array(W * H); let a = 0, b = 0;
 const s = sy * W + sx; if (s < 0 || s >= W * H) return d; d[s] = 0; q[b++] = s;
 while (a < b) {
  const c = q[a++], cd = d[c]; if (cd >= max) continue;
  const x = c % W, y = (c / W) | 0;
  if (x > 0) { const n = c - 1; if (d[n] < 0 && t[n] && t[n] !== PIL) { d[n] = cd + 1; q[b++] = n; } }
  if (x < W - 1) { const n = c + 1; if (d[n] < 0 && t[n] && t[n] !== PIL) { d[n] = cd + 1; q[b++] = n; } }
  if (y > 0) { const n = c - W; if (d[n] < 0 && t[n] && t[n] !== PIL) { d[n] = cd + 1; q[b++] = n; } }
  if (y < H - 1) { const n = c + W; if (d[n] < 0 && t[n] && t[n] !== PIL) { d[n] = cd + 1; q[b++] = n; } }
 }
 return d;
}

/* ---------- Création d'une expédition ---------- */
// o : { type, niveau, etages, heros, generation, arene:{n, maison}, nomLieu }
function creerExpedition(o) {
 const X = { o, etage: 0, etages: o.etages || 3, sacOr: 0, butin: [], tues: 0, phenix: false, resultat: null, xpGagne: 0, journal: [] };
 return X;
}
function creerEtage(X) {
 const o = X.o, D = DONJONS[o.type], estBoss = X.etage === X.etages - 1;
 const A = { X, D, type: o.type, niveau: o.niveau + X.etage * .5, t: 0, mobs: [], projs: [], zones: [], fx: [], textes: [], loot: [], deco: [], lumieres: [], pieges: [], portail: null, shake: 0, boss: null, flow: null, flowT: 0, msg: null, msgT: 0, pause: false, fini: false };
 let C;
 if (o.arene) { C = carteArene(); } else C = genCarte(56, 56, estBoss ? 11 : ri(10, 13), estBoss);
 Object.assign(A, { carte: C, W: C.W, H: C.H, vu: new Uint8Array(C.W * C.H) });
 // héros
 const h = o.heros, S = statsHeros(h, o.generation || 1);
 const ancien = X.joueur;
 A.p = { x: C.depart.cx + .5, y: C.depart.cy + .5, r: .33, ang: 0, pv: ancien ? Math.min(ancien.pv, S.pvmax) : S.pvmax, mana: ancien ? ancien.mana : S.manamax, S, cdA: 0, cds: {}, buff: 0, dash: null, inv: 0, anim: 0, animT: 0, pas: 0, frappes: 0, slow: 0, hitf: 0, potions: h.potions, potT: 0, vide: 0, mort: false, bonus: ancien ? ancien.bonus : {} };
 X.joueur = A.p;
 // décor
 for (const s of C.salles) {
  if (o.arene) break;
  const nb = ri(1, 2);
  for (let i = 0; i < nb; i++) {
   const cx = s.x + (chance(.5) ? 0 : s.w - 1), cy = s.y + (chance(.5) ? 0 : s.h - 1);
   A.deco.push({ k: 'brasero', x: cx + .5, y: cy + .5 }); A.lumieres.push({ x: cx + .5, y: cy + .5, r: 4.2, f: R() * 6 });
  }
  if (s !== C.depart) for (let i = 0; i < ri(0, 3); i++) A.mobs.push(mkObjet('jarre', s.x + ri(0, s.w - 1) + .5, s.y + ri(0, s.h - 1) + .5));
  if (s !== C.depart && chance(.22)) A.mobs.push(mkObjet('coffre', s.cx + .5, s.y + .9));
 }
 if (o.arene) { for (let i = 0; i < 6; i++) A.lumieres.push({ x: 3 + i * 5, y: 2, r: 6, f: i }); for (let i = 0; i < 6; i++) A.lumieres.push({ x: 3 + i * 5, y: C.H - 3, r: 6, f: i + 3 }); }
 // monstres
 const N = A.niveau;
 if (o.arene) {
  const n = clamp(o.arene.n, 0, 14);
  for (let i = 0; i < n; i++) A.mobs.push(mkMob(i % 3 === 2 ? 'arbaletrier' : 'soldat', C.fin.cx + rnd(-4, 4), C.fin.cy + rnd(-4, 4), N, false, o.arene.maison));
  const b = mkMob('champion', C.fin.cx + 1, C.fin.cy, N, true, o.arene.maison); A.mobs.push(b); A.boss = b;
 } else {
  for (const s of C.salles) {
   if (s === C.depart || (estBoss && s === C.fin)) continue;
   const n = ri(2, 4) + (X.etage > 0 ? 1 : 0);
   for (let i = 0; i < n; i++) {
    const k = pick(D.mobs), M = MONSTRES[k];
    for (let g = 0; g < (M.groupe ? M.groupe + 1 : 1); g++) A.mobs.push(mkMob(k, s.x + rnd(.5, s.w - .5), s.y + rnd(.5, s.h - .5), N));
   }
  }
  // meutes d'élite
  const nbE = (A.niveau < 3 ? 1 : ri(1, 2)) + (X.etage > 0 ? 1 : 0);
  const cand = C.salles.filter(s => s !== C.depart && !(estBoss && s === C.fin));
  for (let i = 0; i < nbE && cand.length; i++) {
   const s = pick(cand), k = pick(D.mobs);
   const ch = mkMob(k, s.cx + .5, s.cy + .5, N, false, null, true); A.mobs.push(ch);
   for (let j = 0; j < 2; j++) A.mobs.push(mkMob(k, s.cx + rnd(-1.5, 1.5), s.cy + rnd(-1.5, 1.5), N));
  }
  if (estBoss) { const b = mkMob(o.boss || D.boss, C.fin.cx + .5, C.fin.cy + .5, N + .5, true); A.mobs.push(b); A.boss = b; }
  else C.t[C.fin.cy * C.W + C.fin.cx] = ESC;
 }
 // autels, gobelin voleur, compagnon
 A.autels = []; A.cadavres = [];
 if (!o.arene) {
  const cand = shuffle(C.salles.filter(s => s !== C.depart && !(estBoss && s === C.fin)));
  const nA = chance(.55) ? 1 : chance(.5) ? 2 : 0;
  for (let i = 0; i < nA && i < cand.length; i++) { const s = cand[i], k = pick(Object.keys(AUTELS)); const a = { k, x: s.x + 1.5 + R() * (s.w - 3), y: s.y + 1.5 + R() * (s.h - 3), pris: false }; A.autels.push(a); A.lumieres.push({ x: a.x, y: a.y, r: 2.6, f: i * 2, autel: a }); }
  if (chance(.3) && cand.length > 2) { const s = cand[cand.length - 1]; const g = mkMob('gobelin', s.cx + .5, s.cy + .5, N); g.fuiteT = 0; A.mobs.push(g); }
 }
 if (o.compagnon) {
  const K = COMPAGNONS[o.compagnon.type], nv = o.heros.niveau, anc = X.allie;
  A.allie = { k: o.compagnon.type, K, nom: o.compagnon.nom, x: A.p.x - .8, y: A.p.y + .3, r: .32, pvmax: K.pv + K.pvn * (nv - 1), dg: K.dg + K.dgn * (nv - 1), cdA: 0, cdS: 4, ang: 0, anim: 0, pas: 0, hitf: 0, ko: 0, wind: 0 };
  A.allie.pv = anc && !anc.ko ? Math.min(anc.pv, A.allie.pvmax) : A.allie.pvmax; X.allie = A.allie;
 }
 // éloigner les monstres du départ
 A.mobs = A.mobs.filter(m => m.objet || Math.hypot(m.x - A.p.x, m.y - A.p.y) > 6 || o.arene);
 for (const m of A.mobs) if (!libre(A, m.x, m.y, m.r * .8)) { m.x = Math.floor(m.x) + .5; m.y = Math.floor(m.y) + .5; if (!sol(A, m.x, m.y)) m.mort = true; }
 A.mobs = A.mobs.filter(m => !m.mort);
 const dif = { facile: [.8, .75], difficile: [1.25, 1.3] }[o.dif]; if (dif) for (const m of A.mobs) if (!m.objet) { m.pvmax *= dif[0]; m.pv = m.pvmax; m.dg *= dif[1]; }
 revele(A);
 return A;
}
function carteArene() {
 const W = 32, H = 22, t = new Uint8Array(W * H);
 for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) t[y * W + x] = SOL;
 for (const [x, y] of [[9, 7], [22, 7], [9, 14], [22, 14]]) t[y * W + x] = PIL;
 const dep = { cx: 5, cy: 11, x: 2, y: 2, w: 28, h: 18 }, fin = { cx: 25, cy: 11, x: 2, y: 2, w: 28, h: 18 };
 return { t, W, H, salles: [dep], depart: dep, fin };
}
function mkObjet(k, x, y) { return { k, objet: true, x, y, r: k === 'coffre' ? .42 : .3, pv: 1, pvmax: 1, hitf: 0 }; }
function mkMob(k, x, y, niv, boss, maison, elite) {
 const M = MONSTRES[k], f = 1 + .3 * (niv - 1) + .03 * (niv - 1) * (niv - 1), fd = 1 + .2 * (niv - 1) + .016 * (niv - 1) * (niv - 1);
 const m = { k, M, x, y, r: M.r, pvmax: M.pv * f, dg: M.dg * fd, vit: M.vit, portee: M.portee, cad: M.cad, xp: M.xp * (1 + .25 * (niv - 1)), cdA: rnd(.3, 1.2), etat: 'veille', ang: R() * 6.28, anim: R() * 10, hitf: 0, slow: 0, gel: 0, stun: 0, brule: 0, bruleDg: 0, wind: 0, niv, boss: !!boss, maison, cdS: [4, 7, 10], phase: 1, elite: !!elite, aff: [] };
 if (elite) { const af = shuffle(AFFIXES_ELITE.slice()).slice(0, niv > 5 ? 2 : 1); m.pvmax *= niv < 3 ? 1.8 : 2.2; m.dg *= 1.15; m.xp *= 3; m.r *= 1.15; m.aff = af.map(a => a.nom); m.pv = m.pvmax; for (const a of af) a.f(m); }
 m.pv = m.pvmax;
 if (boss) { m.cdS = [3, 6, 9]; if (niv < 4) { m.pvmax *= .55 + niv * .1; m.pv = m.pvmax; m.dg *= .8 + niv * .05; } }
 return m;
}

/* ---------- Utilitaires de carte ---------- */
function tuile(A, x, y) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= A.W || y >= A.H) return MUR; return A.carte.t[y * A.W + x]; }
function sol(A, x, y) { const v = tuile(A, x, y); return v === SOL || v === ESC; }
function libre(A, x, y, r) { return sol(A, x - r, y - r) && sol(A, x + r, y - r) && sol(A, x - r, y + r) && sol(A, x + r, y + r); }
function bouger(A, e, dx, dy) {
 if (!libre(A, e.x, e.y, e.r)) { // coincé (apparition, poussée) : on laisse sortir tant que le centre reste au sol
  if (sol(A, e.x + dx, e.y + dy)) { e.x += dx; e.y += dy; } else { const cx = Math.floor(e.x) + .5, cy = Math.floor(e.y) + .5; if (sol(A, cx, cy)) { e.x += (cx - e.x) * .2; e.y += (cy - e.y) * .2; } }
  return;
 }
 if (dx && libre(A, e.x + dx, e.y, e.r)) e.x += dx; else if (dx) { const step = dx > 0 ? .02 : -.02; let n = 0; while (n++ < 10 && libre(A, e.x + step, e.y, e.r)) e.x += step; }
 if (dy && libre(A, e.x, e.y + dy, e.r)) e.y += dy; else if (dy) { const step = dy > 0 ? .02 : -.02; let n = 0; while (n++ < 10 && libre(A, e.x, e.y + step, e.r)) e.y += step; }
}
function vue(A, x0, y0, x1, y1) {
 const d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d * 6);
 for (let i = 1; i < n; i++) { const k = i / n; if (!sol(A, x0 + (x1 - x0) * k, y0 + (y1 - y0) * k)) return false; }
 return true;
}
function revele(A) {
 const px = A.p.x | 0, py = A.p.y | 0, R2 = 9;
 for (let y = py - R2; y <= py + R2; y++) for (let x = px - R2; x <= px + R2; x++) if (x >= 0 && y >= 0 && x < A.W && y < A.H && (x - px) ** 2 + (y - py) ** 2 <= R2 * R2) A.vu[y * A.W + x] = 1;
}

/* ---------- Effets visuels (purement décoratifs) ---------- */
function particules(A, x, y, n, coul, v = 3, vie = .6, taille = .08, grav = 0) {
 if (A.fx.length > 500) n = Math.min(n, 2);
 for (let i = 0; i < n; i++) { const a = R() * 6.283, s = v * rnd(.3, 1); A.fx.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vie: vie * rnd(.6, 1.2), v0: vie, coul, taille: taille * rnd(.6, 1.4), grav }); }
}
function texte(A, x, y, s, coul, gros) { A.textes.push({ x, y, s, coul, t: 0, gros }); if (A.textes.length > 60) A.textes.shift(); }
function message(A, s, d = 2.5) { A.msg = s; A.msgT = d; }

/* ---------- Dégâts ---------- */
function degatsHeros(A, mult) {
 const S = A.p.S; let d = rnd(S.dmin, S.dmax) * (1 + S.pdmg / 100) * mult;
 if (A.p.buff > 0) d *= 1.35;
 if (A.p.bonus.fureur > 0) d *= 1.5;
 const crit = R() < S.crit / 100; if (crit) d *= 1 + S.critd / 100;
 return { d: d + S.feu * Math.min(1, mult), crit };
}
function toucherMob(A, m, mult, opts = {}) {
 if (m.mort) return;
 const S = A.p.S, P = A.p;
 if (m.objet) { m.mort = true; casserObjet(A, m); return; }
 const { d, crit } = degatsHeros(A, mult);
 let dd = d; if (m.k === 'spectre' && !opts.magie) dd *= .75;
 m.pv -= dd; m.hitf = .12; m.etat = 'chasse';
 if (opts.recul) { const a = Math.atan2(m.y - P.y, m.x - P.x), k = m.boss ? .1 : opts.recul; bouger(A, m, Math.cos(a) * k, Math.sin(a) * k); }
 if (opts.stun && !m.boss) m.stun = Math.max(m.stun, opts.stun);
 if (S.riposte && !m.boss && R() < S.riposte) { m.stun = Math.max(m.stun, .8); texte(A, m.x, m.y - m.r - .7, 'Étourdi', '#ffe08a'); }
 if (opts.slow) m.slow = Math.max(m.slow, opts.slow);
 if (opts.gel && !m.boss) m.gel = Math.max(m.gel, opts.gel);
 if (S.effets.brulure) { m.brule = 3; m.bruleDg = dd * .4 / 3; }
 if (S.effets.givrecoup && opts.proj) m.slow = Math.max(m.slow, 2.5);
 if (S.vol) P.pv = Math.min(S.pvmax, P.pv + dd * S.vol / 100);
 texte(A, m.x, m.y - m.r - .3, Math.round(dd), crit ? '#ffd84a' : '#fff', crit);
 particules(A, m.x, m.y, crit ? 7 : 4, m.k === 'squelette' || m.k === 'archer' || m.k === 'liche' ? '#e8e2d0' : m.k === 'spectre' ? '#9fd3ff' : '#8a1d1d', 3, .45);
 if (crit) A.shake = Math.max(A.shake, .12);
 if (S.effets.execution && !m.boss && m.pv > 0 && m.pv < m.pvmax * .12) { m.pv = 0; texte(A, m.x, m.y - 1, 'Exécuté', '#ff5040', true); }
 if (m.pv <= 0) tuerMob(A, m);
 SON('coup', crit ? 1.2 : 1);
}
function casserObjet(A, m) {
 particules(A, m.x, m.y, 10, m.k === 'coffre' ? '#8a6233' : '#9a7b5a', 3, .6, .1);
 if (m.k === 'jarre') { if (chance(.55)) lacherOr(A, m.x, m.y, ri(2, 6) * A.niveau); if (chance(.08)) ajLoot(A, { x: m.x, y: m.y, potion: true }); SON('casse'); }
 else { lacherOr(A, m.x, m.y, ri(10, 25) * A.niveau); for (let i = 0; i < ri(1, 2); i++) lacherObjet(A, m.x + rnd(-.6, .6), m.y + rnd(-.3, .6), { bonus: .06 }); SON('coffre'); }
}
function ajLoot(A, l) {
 if (!libre(A, l.x, l.y, .2)) { let best = null, bd = 9; for (let y = (l.y | 0) - 2; y <= (l.y | 0) + 2; y++) for (let x = (l.x | 0) - 2; x <= (l.x | 0) + 2; x++) if (sol(A, x + .5, y + .5)) { const d = Math.hypot(x + .5 - l.x, y + .5 - l.y); if (d < bd) { bd = d; best = [x + .5, y + .5]; } } if (best) { l.x = best[0]; l.y = best[1]; } }
 A.loot.push(l);
}
function lacherOr(A, x, y, n) { n = Math.max(1, Math.round(n * .3 * (1 + A.p.S.or / 100 + (A.X.o.chanceOr ? .3 : 0)) * (A.p.bonus.fortune > 0 ? 2 : 1))); ajLoot(A, { x: x + rnd(-.4, .4), y: y + rnd(-.4, .4), or: n }); }
function lacherObjet(A, x, y, opts = {}) { const o = genObjet(A.niveau + rnd(-.5, 1), A.X.o.heros.classe, opts); ajLoot(A, { x, y, obj: o, t: 0 }); if (o.rar === 'legendaire') { message(A, '✦ Objet légendaire !', 3); SON('legendaire'); } }
function tuerMob(A, m) {
 m.mort = true; A.X.tues++;
 if (A.cadavres) { A.cadavres.push({ x: m.x, y: m.y, k: m.k, r: m.r, ang: R() * 6.28, os: m.k === 'squelette' || m.k === 'archer' || m.k === 'liche', spectre: m.k === 'spectre' }); if (A.cadavres.length > 90) A.cadavres.shift(); }
 if (m.k === 'gobelin') { message(A, 'Le gobelin lâche son butin !', 2.5); for (let i = 0; i < 8; i++) lacherOr(A, m.x + rnd(-1, 1), m.y + rnd(-1, 1), ri(6, 12) * A.niveau); for (let i = 0; i < 2; i++) lacherObjet(A, m.x + rnd(-.8, .8), m.y + rnd(-.8, .8), { min: 'magique', bonus: .2 }); }
 { const ec = A.X.o.heros.niveau - m.niv; gagnerXp(A, m.xp * (ec > 2 ? Math.max(.2, 1 - .15 * (ec - 2)) : 1)); }
 particules(A, m.x, m.y, m.boss ? 40 : 12, m.k === 'spectre' ? '#bfe6ff' : m.k === 'squelette' || m.k === 'archer' ? '#e8e2d0' : '#6e1414', 4, .8, .1);
 if (chance(m.boss ? 1 : m.elite ? .9 : .32)) lacherOr(A, m.x, m.y, ri(3, 8) * A.niveau * (m.boss ? 6 : m.elite ? 2.5 : 1));
 if (chance(m.elite ? .2 : .045)) ajLoot(A, { x: m.x + .3, y: m.y, potion: true });
 if (chance(m.boss ? 1 : m.elite ? .6 : .12)) ajLoot(A, { x: m.x - .3, y: m.y + .2, globe: true });
 const pObj = m.boss ? 1 : m.elite ? .75 : .085;
 if (chance(pObj)) lacherObjet(A, m.x, m.y, { bonus: m.elite ? .08 : 0, min: m.elite ? 'magique' : null });
 if (m.boss) {
  for (let i = 0; i < 2; i++) lacherObjet(A, m.x + rnd(-1, 1), m.y + rnd(-1, 1), { min: 'rare', bonus: .15 });
  if (chance(A.X.o.arene ? .1 : .3)) lacherObjet(A, m.x, m.y + .8, { rarete: 'legendaire' });
  A.shake = .6; SON('boss_mort');
  if (A.X.o.arene) { for (const o of A.mobs) if (!o.objet && !o.mort) { o.mort = true; particules(A, o.x, o.y, 8, '#aaa'); } message(A, 'Le champion est tombé ! Leurs rangs se débandent.', 4); }
  else message(A, `${m.M.nom} est vaincu !`, 4);
  A.portail = { x: m.x, y: m.y + (A.X.o.arene ? 0 : 0), t: 0 };
 } else SON('mort');
}
function gagnerXp(A, n) {
 const h = A.X.o.heros; n = Math.round(n * (A.p.bonus.savoir > 0 ? 1.5 : 1)); h.xp += n; A.X.xpGagne += n;
 while (h.xp >= xpPour(h.niveau)) {
  h.xp -= xpPour(h.niveau); h.niveau++; h.points++;
  A.p.S = statsHeros(h, A.X.o.generation || 1); A.p.pv = A.p.S.pvmax; A.p.mana = A.p.S.manamax;
  message(A, `Niveau ${h.niveau} ! (+1 point de compétence — touche K)`, 3.5); particules(A, A.p.x, A.p.y, 30, '#ffd84a', 4, 1, .1); SON('niveau');
 }
}
function blesserJoueur(A, dg, src, opts = {}) {
 const P = A.p; if (P.inv > 0 || P.mort) return;
 const S = P.S, arm = S.arm * (P.buff > 0 ? 1.5 : 1), niv = src ? src.niv || A.niveau : A.niveau;
 if (S.esquive && R() < S.esquive) { texte(A, P.x, P.y - .8, 'Esquive', '#cfe8ff'); return; }
 let d = dg * (1 - arm / (arm + 40 + 14 * niv)) * (1 - S.res / 100);
 if (P.bonus.protection > 0) d *= .6;
 d = Math.max(1, d * rnd(.9, 1.1));
 if (S.bouclierMana && P.mana > 0) { const k = Math.min(P.mana, d * S.bouclierMana); P.mana -= k; d -= k; }
 P.pv -= d; P.hitf = .15; A.shake = Math.max(A.shake, Math.min(.35, d / S.pvmax * 2));
 texte(A, P.x, P.y - .8, Math.round(d), '#ff5a4a');
 if (src && src.vampire) src.pv = Math.min(src.pvmax, src.pv + d);
 if (src && src.givre) P.slow = 1.5;
 if (src && opts.cac && S.effets.epines && !src.mort) { src.pv -= d * .5; src.hitf = .1; if (src.pv <= 0) tuerMob(A, src); }
 SON('aie');
 if (P.pv <= 0) {
  if (S.effets.phenix && !A.X.phenix) { A.X.phenix = true; P.pv = S.pvmax / 2; P.inv = 2; message(A, 'Le Cœur de Dragon vous relève !', 3); particules(A, P.x, P.y, 40, '#ff8a2a', 5, 1.2, .12); SON('niveau'); return; }
  P.pv = 0; P.mort = true; A.fini = true; A.X.resultat = 'mort'; SON('mort_joueur');
 }
}

/* ---------- Compétences du joueur ---------- */
function rangComp(A, id) { return A.X.o.heros.comp[id] || 0; }
function multComp(A, id, base) { return base * (1 + .22 * (rangComp(A, id) - 1)); }
function attaqueBase(A, ax, ay) {
 const P = A.p, S = P.S, C = CLASSES[A.X.o.heros.classe];
 if (P.cdA > 0) return;
 P.cdA = 1 / (S.cadence * (P.bonus.celerite > 0 ? 1.3 : 1)); P.ang = Math.atan2(ay - P.y, ax - P.x); P.anim = .22; P.animT = .22; P.frappes++;
 const onde = S.effets.onde && P.frappes % 4 === 0;
 if (C.attaque === 'cac') {
  let touche = 0;
  for (const m of A.mobs) {
   if (m.mort) continue; const dx = m.x - P.x, dy = m.y - P.y, d = Math.hypot(dx, dy);
   if (d > 1.55 + m.r) continue;
   let da = Math.atan2(dy, dx) - P.ang; da = Math.atan2(Math.sin(da), Math.cos(da));
   if (Math.abs(da) < 1.05 || d < m.r + .4) { toucherMob(A, m, 1, { recul: .12 }); touche++; }
  }
  if (onde) { A.zones.push({ x: P.x + Math.cos(P.ang) * 1.6, y: P.y + Math.sin(P.ang) * 1.6, r: 2.2, t: 0, tmax: .05, mult: 1.4, ami: true, k: 'onde' }); }
  SON(touche ? 'epee' : 'swing');
 } else {
  const arc = C.attaque === 'tir', v = arc ? 15 : 11;
  tirer(A, P.ang, v, { k: arc ? 'fleche' : 'eclair', mult: 1, perce: S.effets.percant, explose: S.effets.explosif ? 1.6 : 0, rebond: S.effets.rebond ? 1 : 0 });
  if (onde) A.zones.push({ x: P.x, y: P.y, r: 2.4, t: 0, tmax: .05, mult: 1.2, ami: true, k: 'onde' });
  SON(arc ? 'arc' : 'sort');
 }
}
function tirer(A, ang, v, o) {
 const P = A.p;
 A.projs.push(Object.assign({ x: P.x + Math.cos(ang) * .4, y: P.y + Math.sin(ang) * .4, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, r: .18, ami: true, vie: 1.4, touches: [] }, o));
}
function utiliserComp(A, i, ax, ay) {
 const P = A.p, h = A.X.o.heros, C = CLASSES[h.classe], c = C.comp[i];
 if (!c || !rangComp(A, c.id)) return false;
 if ((P.cds[c.id] || 0) > 0) return false;
 let gratuit = false;
 if (P.S.effets.vide) { P.vide = (P.vide + 1) % 3; gratuit = P.vide === 0; }
 if (!gratuit && P.mana < c.cout) { message(A, 'Pas assez de mana', 1); return false; }
 if (!gratuit) P.mana -= c.cout;
 P.cds[c.id] = c.cd * (1 - P.S.recup / 100);
 const ang = Math.atan2(ay - P.y, ax - P.x); P.ang = ang; P.anim = .3; P.animT = .3;
 const dc = Math.min(Math.hypot(ax - P.x, ay - P.y), 9);
 switch (c.id) {
  case 'tourbillon': { for (const m of A.mobs) if (!m.mort && Math.hypot(m.x - P.x, m.y - P.y) < 2.3 + m.r) toucherMob(A, m, multComp(A, c.id, 1.5), { recul: .35 }); A.fx.push({ k: 'anneau', x: P.x, y: P.y, r: 2.3, vie: .3, v0: .3, coul: '#ffe3a0' }); P.spin = .35; SON('tourbillon'); break; }
  case 'charge': { const d = Math.min(dc, 6.5); P.dash = { vx: Math.cos(ang) * 22, vy: Math.sin(ang) * 22, t: d / 22, touche: [], mult: multComp(A, c.id, 1.3), stun: 1.2 }; P.inv = d / 22 + .1; SON('charge'); break; }
  case 'cri': { P.buff = 8; A.fx.push({ k: 'anneau', x: P.x, y: P.y, r: 4, vie: .5, v0: .5, coul: '#ff6a3a' }); particules(A, P.x, P.y, 20, '#ff9a3a', 4, .7); SON('cri'); break; }
  case 'seisme': { for (let k = 1; k <= 7; k++) A.zones.push({ x: P.x + Math.cos(ang) * k, y: P.y + Math.sin(ang) * k, r: .95, t: -k * .05, tmax: .05, mult: multComp(A, c.id, 2.6), ami: true, k: 'seisme', unique: true }); A.shake = .3; SON('seisme'); break; }
  case 'nova': { for (const m of A.mobs) if (!m.mort && Math.hypot(m.x - P.x, m.y - P.y) < 3.3 + m.r) toucherMob(A, m, multComp(A, c.id, 1.2), { slow: 3, gel: 1.2, magie: true }); A.fx.push({ k: 'anneau', x: P.x, y: P.y, r: 3.3, vie: .45, v0: .45, coul: '#bfe8ff' }); particules(A, P.x, P.y, 30, '#d8f2ff', 6, .6); SON('givre'); break; }
  case 'boule': { tirer(A, ang, 10, { k: 'boule', mult: multComp(A, c.id, 1.9), explose: 1.9, r: .28, magie: true }); SON('boule'); break; }
  case 'blink': { let d = Math.min(dc, 7), x = P.x, y = P.y; const n = Math.ceil(d * 4); for (let k = 1; k <= n; k++) { const nx = P.x + Math.cos(ang) * d * k / n, ny = P.y + Math.sin(ang) * d * k / n; if (!libre(A, nx, ny, P.r)) break; x = nx; y = ny; } particules(A, P.x, P.y, 16, '#c9a0ff', 3, .5); P.x = x; P.y = y; P.inv = .3; particules(A, x, y, 16, '#c9a0ff', 3, .5); SON('blink'); break; }
  case 'meteore': { A.zones.push({ x: ax, y: ay, r: 2.5, t: -1, tmax: .05, mult: multComp(A, c.id, 4.2), ami: true, k: 'meteore', unique: true }); SON('meteore_lance'); break; }
  case 'volee': { for (let k = -2; k <= 2; k++) tirer(A, ang + k * .17, 15, { k: 'fleche', mult: multComp(A, c.id, .9), perce: P.S.effets.percant, explose: P.S.effets.explosif ? 1.2 : 0 }); SON('arc'); break; }
  case 'roulade': { let a = P.mvx || P.mvy ? Math.atan2(P.mvy, P.mvx) : ang + Math.PI; P.dash = { vx: Math.cos(a) * 18, vy: Math.sin(a) * 18, t: .22, touche: null }; P.inv = .3; SON('swing'); break; }
  case 'piege': { if (A.pieges.length >= 3) A.pieges.shift(); A.pieges.push({ x: P.x, y: P.y, t: 20, mult: multComp(A, c.id, 3) }); SON('piege'); break; }
  case 'pluie': { for (let k = 0; k < 10; k++) A.zones.push({ x: ax + rnd(-.4, .4), y: ay + rnd(-.4, .4), r: 2.4, t: -.3 - k * .3, tmax: .05, mult: multComp(A, c.id, .6), ami: true, k: 'pluie' }); A.fx.push({ k: 'cible', x: ax, y: ay, r: 2.4, vie: 3.3, v0: 3.3, coul: '#ffe3a0' }); SON('arc'); break; }
 }
 return true;
}
function boirePotion(A) {
 const P = A.p; if (P.potions <= 0 || P.potT > 0 || P.pv >= P.S.pvmax) return;
 P.potions--; A.X.o.heros.potions = P.potions; P.potT = 1.2; P.potSoin = P.S.pvmax * .5; particules(A, P.x, P.y, 14, '#ff4a4a', 2, .8); SON('potion');
}

/* ---------- Boucle de mise à jour ---------- */
// inp : { mx, my (monde), clic, droit, shift, haut, bas, gauche, droite, comp:[4], potion, action }
function majDonjon(A, dt, inp) {
 if (A.pause || A.fini) return;
 dt = Math.min(dt, .05); A.t += dt; majMinuteries(A);
 const P = A.p, S = P.S;
 // ---- joueur ----
 P.cdA -= dt; P.inv -= dt; P.hitf -= dt; P.anim -= dt; P.slow -= dt; if (P.spin) P.spin -= dt;
 if (P.buff > 0) P.buff -= dt;
 for (const k in P.cds) P.cds[k] -= dt;
 P.pv = Math.min(S.pvmax, P.pv + S.regen * dt); P.mana = Math.min(S.manamax, P.mana + (2.5 + S.manamax * .035) * (S.fluxMana || 1) * dt);
 for (const k in P.bonus) P.bonus[k] -= dt;
 if (P.potT > 0) { P.potT -= dt; P.pv = Math.min(S.pvmax, P.pv + P.potSoin / 1.2 * dt); }
 let mx = (inp.droite ? 1 : 0) - (inp.gauche ? 1 : 0), my = (inp.bas ? 1 : 0) - (inp.haut ? 1 : 0);
 const C = CLASSES[A.X.o.heros.classe];
 // clic : attaquer la cible sous le curseur ou s'y déplacer
 let veutAttaquer = false;
 if (inp.clic && !P.dash) {
  let cible = null, bd = 1;
  for (const m of A.mobs) { if (m.mort) continue; const d = Math.hypot(m.x - inp.mx, m.y - inp.my); if (d < m.r + .6 && d < bd) { bd = d; cible = m; } }
  if (mx || my || inp.shift) veutAttaquer = true;
  else if (cible) {
   const d = Math.hypot(cible.x - P.x, cible.y - P.y);
   if (C.attaque === 'cac' && d > 1.4 + cible.r) { mx = cible.x - P.x; my = cible.y - P.y; } else veutAttaquer = true;
  } else if (Math.hypot(inp.mx - P.x, inp.my - P.y) > .35) { mx = inp.mx - P.x; my = inp.my - P.y; }
  if (veutAttaquer) attaqueBase(A, inp.mx, inp.my);
 }
 const ml = Math.hypot(mx, my);
 if (P.dash) {
  const st = Math.min(dt, P.dash.t); bouger(A, P, P.dash.vx * st, P.dash.vy * st); P.dash.t -= dt;
  if (P.dash.touche) for (const m of A.mobs) if (!m.mort && !P.dash.touche.includes(m) && Math.hypot(m.x - P.x, m.y - P.y) < m.r + .8) { P.dash.touche.push(m); toucherMob(A, m, P.dash.mult, { recul: .6, stun: P.dash.stun }); }
  particules(A, P.x, P.y, 1, '#cbbfa8', 1, .3);
  if (P.dash.t <= 0) P.dash = null;
 } else if (ml > 0) {
  const v = S.vitesse * (P.bonus.celerite > 0 ? 1.3 : 1) * (P.slow > 0 ? .55 : 1) * (veutAttaquer && C.attaque !== 'cac' ? .6 : 1) * dt;
  P.mvx = mx / ml; P.mvy = my / ml; bouger(A, P, P.mvx * v, P.mvy * v); P.pas += dt * 9;
  if (!veutAttaquer) P.ang = Math.atan2(my, mx);
 } else { P.mvx = P.mvy = 0; }
 if (S.effets.fantome) { /* traverse */ } else for (const m of A.mobs) { if (m.mort || m.objet && m.k !== 'coffre') continue; const dx = P.x - m.x, dy = P.y - m.y, d = Math.hypot(dx, dy), mn = P.r + m.r * .8; if (d < mn && d > .001) { const k = (mn - d) * .5; bouger(A, P, dx / d * k, dy / d * k); } }
 for (let i = 0; i < 4; i++) if (inp.comp[i]) utiliserComp(A, i, inp.mx, inp.my);
 if (inp.potion) boirePotion(A);
 // ---- ramassage ----
 for (let i = A.loot.length - 1; i >= 0; i--) {
  const l = A.loot[i]; l.t = (l.t || 0) + dt;
  const d = Math.hypot(l.x - P.x, l.y - P.y);
  if (l.or && d < 2.2) { l.x += (P.x - l.x) * dt * 8; l.y += (P.y - l.y) * dt * 8; }
  if (d > (l.globe ? .9 : .7)) continue;
  if (l.or) { A.X.sacOr += l.or; texte(A, P.x, P.y - .9, '+' + l.or + ' or', '#ffd84a'); A.loot.splice(i, 1); SON('or'); }
  else if (l.globe) { if (d < .9) { P.pv = Math.min(S.pvmax, P.pv + S.pvmax * .2); P.mana = Math.min(S.manamax, P.mana + S.manamax * .1); texte(A, P.x, P.y - .9, '+vie', '#ff7a7a'); particules(A, P.x, P.y, 10, '#ff5a5a', 2, .5); A.loot.splice(i, 1); SON('potion'); } }
  else if (l.potion) { if (P.potions < 5) { P.potions++; A.X.o.heros.potions = P.potions; texte(A, P.x, P.y - .9, '+1 potion', '#ff7a7a'); A.loot.splice(i, 1); SON('or'); } }
  else if (l.obj) { if (A.X.butin.length + (A.X.o.inventaire ? A.X.o.inventaire.length : 0) < 60) { A.X.butin.push(l.obj); A.loot.splice(i, 1); texte(A, P.x, P.y - 1, l.obj.nom, RARETES.find(r => r.id === l.obj.rar).coul); SON(l.obj.rar === 'legendaire' || l.obj.rar === 'rare' ? 'objet_rare' : 'objet'); } }
 }
 // ---- autels ----
 for (const a of A.autels) if (!a.pris && Math.hypot(a.x - P.x, a.y - P.y) < .9) {
  a.pris = true; const D = AUTELS[a.k]; P.bonus[a.k] = D.d; message(A, `${D.nom} : ${D.txt}`, 3); particules(A, a.x, a.y, 30, D.coul, 4, 1, .1); SON('niveau');
  if (a.k === 'fortune') for (let i = 0; i < 10; i++) lacherOr(A, a.x + rnd(-1.5, 1.5), a.y + rnd(-1.5, 1.5), ri(4, 9) * A.niveau);
  for (const l of A.lumieres) if (l.autel === a) l.r = 1.2;
 }
 majAllie(A, dt);
 // ---- pièges ----
 for (let i = A.pieges.length - 1; i >= 0; i--) { const g = A.pieges[i]; g.t -= dt; let boom = g.t <= 0; for (const m of A.mobs) if (!m.mort && !m.objet && Math.hypot(m.x - g.x, m.y - g.y) < .9 + m.r) boom = true; if (boom) { A.zones.push({ x: g.x, y: g.y, r: 2.3, t: 0, tmax: .05, mult: g.mult, ami: true, k: 'explosion' }); A.pieges.splice(i, 1); } }
 // ---- monstres ----
 A.flowT -= dt;
 if (A.flowT <= 0) { A.flowT = .25; A.flow = bfs(A.carte.t, A.W, A.H, P.x | 0, P.y | 0, 34); }
 let vivants = 0;
 for (const m of A.mobs) { if (m.mort || m.objet) continue; vivants++; majMob(A, m, dt); }
 A.vivants = vivants;
 // séparation
 const L = A.mobs;
 for (let i = 0; i < L.length; i++) { const a = L[i]; if (a.mort || a.objet) continue; for (let j = i + 1; j < L.length; j++) { const b = L[j]; if (b.mort || b.objet) continue; const dx = b.x - a.x, dy = b.y - a.y; if (Math.abs(dx) > 1.6 || Math.abs(dy) > 1.6) continue; const d = Math.hypot(dx, dy), mn = (a.r + b.r) * .9; if (d < mn && d > .001) { const k = (mn - d) / d * .5; const wa = a.boss ? .1 : 1, wb = b.boss ? .1 : 1; bouger(A, a, -dx * k * wa, -dy * k * wa); bouger(A, b, dx * k * wb, dy * k * wb); } } }
 if (A.mobs.length > 40 && A.t % 2 < dt) A.mobs = A.mobs.filter(m => !m.mort);
 // ---- projectiles ----
 for (let i = A.projs.length - 1; i >= 0; i--) {
  const p = A.projs[i]; p.vie -= dt; p.x += p.vx * dt; p.y += p.vy * dt;
  let fin = p.vie <= 0 || !sol(A, p.x, p.y);
  if (!fin) {
   if (p.ami) {
    for (const m of A.mobs) {
     if (m.mort || p.touches.includes(m)) continue;
     if (Math.hypot(m.x - p.x, m.y - p.y) < m.r + p.r) {
      p.touches.push(m);
      if (p.allie) { frapperParAllie(A, m, p.allie); fin = true; break; }
      if (!p.explose) toucherMob(A, m, p.mult, { proj: true, magie: p.magie, recul: .08 });
      if (p.rebond > 0) { p.rebond--; let c = null, bd = 6; for (const o of A.mobs) { if (o.mort || o.objet || p.touches.includes(o)) continue; const d = Math.hypot(o.x - p.x, o.y - p.y); if (d < bd) { bd = d; c = o; } } if (c) { const a = Math.atan2(c.y - p.y, c.x - p.x), v = Math.hypot(p.vx, p.vy); p.vx = Math.cos(a) * v; p.vy = Math.sin(a) * v; p.vie = 1; continue; } }
      if (!p.perce) { fin = true; break; }
     }
    }
   } else if (Math.hypot(P.x - p.x, P.y - p.y) < P.r + p.r) { blesserJoueur(A, p.dg, p.src); if (p.gel) P.slow = 1.5; fin = true; }
   else if (A.allie && !A.allie.ko && Math.hypot(A.allie.x - p.x, A.allie.y - p.y) < A.allie.r + p.r) { blesserAllie(A, p.dg, p.src); fin = true; }
  }
  if (p.k === 'boule' || p.k === 'feu' || p.k === 'eclair') particules(A, p.x, p.y, 1, p.k === 'eclair' ? '#c9a0ff' : '#ffb04a', .6, .3, .07);
  if (fin) {
   if (p.ami && p.explose) A.zones.push({ x: p.x - p.vx * dt, y: p.y - p.vy * dt, r: p.explose, t: 0, tmax: .05, mult: p.mult, ami: true, k: 'explosion', magie: p.magie });
   else particules(A, p.x, p.y, 3, p.ami ? '#ffe3a0' : '#ff8a5a', 2, .3);
   A.projs.splice(i, 1);
  }
 }
 // ---- zones (télégraphes et explosions) ----
 for (let i = A.zones.length - 1; i >= 0; i--) {
  const z = A.zones[i], avant = z.t; z.t += dt;
  if (z.k !== 'ligne' && !z.feu && (avant < 0 && z.t >= 0 || avant === 0 && z.t > 0 && !z.fait)) {
   z.fait = true;
   if (z.ami) {
    for (const m of A.mobs) if (!m.mort && Math.hypot(m.x - z.x, m.y - z.y) < z.r + m.r) toucherMob(A, m, z.mult, { recul: z.k === 'explosion' || z.k === 'meteore' ? .4 : .1, magie: z.magie || z.k === 'meteore', slow: z.k === 'givre' ? 2 : 0, stun: z.k === 'seisme' ? .6 : 0 });
    if (z.k === 'explosion' || z.k === 'meteore') { particules(A, z.x, z.y, z.k === 'meteore' ? 50 : 22, '#ff9a3a', z.k === 'meteore' ? 7 : 5, .7, .12); A.fx.push({ k: 'anneau', x: z.x, y: z.y, r: z.r, vie: .35, v0: .35, coul: '#ffb04a' }); A.shake = Math.max(A.shake, z.k === 'meteore' ? .45 : .18); SON('explosion'); A.lumFlash = { x: z.x, y: z.y, t: .3 }; }
    else if (z.k === 'seisme') particules(A, z.x, z.y, 6, '#b8a07a', 3, .5, .1);
    else if (z.k === 'pluie') particules(A, z.x + rnd(-1, 1), z.y + rnd(-1, 1), 3, '#e8dcc0', 2, .3);
    else if (z.k === 'onde') { A.fx.push({ k: 'anneau', x: z.x, y: z.y, r: z.r, vie: .3, v0: .3, coul: '#ffe3a0' }); }
   } else {
    if (Math.hypot(P.x - z.x, P.y - z.y) < z.r + P.r * .5) { blesserJoueur(A, z.dg, z.src); if (z.k === 'givre' || z.k === 'poison') P.slow = 2; }
    if (A.allie && !A.allie.ko && Math.hypot(A.allie.x - z.x, A.allie.y - z.y) < z.r) blesserAllie(A, z.dg * .7, z.src);
    const zc = z.k === 'givre' ? '#bfe8ff' : z.k === 'poison' ? '#9cff5a' : '#ff6a3a'; particules(A, z.x, z.y, 18, zc, 4, .6, .1); A.fx.push({ k: 'anneau', x: z.x, y: z.y, r: z.r, vie: .3, v0: .3, coul: zc }); A.shake = Math.max(A.shake, .15); SON(z.k === 'givre' ? 'givre' : 'explosion');
   }
  }
  if (z.feu && z.t > 0) { z.dur -= dt; z.tick = (z.tick || 0) - dt; if (z.tick <= 0) { z.tick = .5; if (Math.hypot(P.x - z.x, P.y - z.y) < z.r) blesserJoueur(A, z.dg * .35, z.src); } if (z.dur > 0) continue; A.zones.splice(i, 1); continue; }
  if (z.t > z.tmax && z.fait) A.zones.splice(i, 1);
 }
 // ---- effets ----
 for (let i = A.fx.length - 1; i >= 0; i--) { const f = A.fx[i]; f.vie -= dt; if (f.vx !== undefined) { f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= .92; f.vy *= .92; } if (f.vie <= 0) A.fx.splice(i, 1); }
 for (let i = A.textes.length - 1; i >= 0; i--) { const t = A.textes[i]; t.t += dt; if (t.t > 1) A.textes.splice(i, 1); }
 A.shake = Math.max(0, A.shake - dt * 1.5); if (A.msgT > 0) A.msgT -= dt; if (A.lumFlash) { A.lumFlash.t -= dt; if (A.lumFlash.t <= 0) A.lumFlash = null; }
 // ---- carte, escalier, portail ----
 if (((A.t * 10) | 0) % 2 === 0) revele(A);
 const tu = tuile(A, P.x, P.y); A.surEscalier = tu === ESC;
 if (A.surEscalier && inp.action) { A.fini = true; A.X.resultat = 'etage'; SON('escalier'); }
 if (A.portail) { A.portail.t += dt; if (Math.hypot(P.x - A.portail.x, P.y - A.portail.y) < .9 && A.portail.t > 1) { A.fini = true; A.X.resultat = 'victoire'; SON('portail'); } }
}

function majMob(A, m, dt) {
 const P = A.p; m.anim += dt; m.hitf -= dt; m.cdA -= dt; m.slow -= dt; m.gel -= dt;
 if (m.brule > 0) { m.brule -= dt; m.pv -= m.bruleDg * dt; if (R() < dt * 8) particules(A, m.x, m.y - .2, 1, '#ff8a2a', 1, .4); if (m.pv <= 0) { tuerMob(A, m); return; } }
 if (m.stun > 0) { m.stun -= dt; return; }
 if (m.gel > 0) return;
 if (m.M.type === 'fuite') return majGobelin(A, m, dt);
 const Al = A.allie, dP = Math.hypot(P.x - m.x, P.y - m.y);
 const T = Al && !Al.ko && m.etat === 'chasse' && Math.hypot(Al.x - m.x, Al.y - m.y) + .8 < dP ? Al : P;
 const dx = T.x - m.x, dy = T.y - m.y, d = Math.hypot(dx, dy);
 if (m.etat === 'veille') {
  if (d < (m.boss ? 9 : 8.5) && vue(A, m.x, m.y, P.x, P.y)) { m.etat = 'chasse'; if (m.boss) { message(A, m.M.nom + ' s’éveille…', 3); SON('boss'); } else if (chance(.3)) SON('grogne'); }
  else return;
 }
 if (P.mort) return;
 const vit = m.vit * (m.slow > 0 ? .5 : 1) * (m.boss && m.phase === 2 ? 1.2 : 1);
 if (m.boss && m.pv < m.pvmax * .5 && m.phase === 1) { m.phase = 2; m.cad *= .75; message(A, m.M.nom + ' entre en fureur !', 2.5); A.shake = .4; SON('boss'); }
 // ---- attaque en cours (télégraphe) ----
 if (m.wind > 0) {
  m.wind -= dt;
  if (m.chg) { const st = dt; bouger(A, m, m.chg.vx * st, m.chg.vy * st); m.chg.t -= dt; particules(A, m.x, m.y, 1, '#b8a07a', 1, .3); if (!m.chg.hit && Math.hypot(P.x - m.x, P.y - m.y) < m.r + P.r + .2) { m.chg.hit = true; blesserJoueur(A, m.dg * 1.5, m, { cac: true }); bouger(A, P, m.chg.vx * .04, m.chg.vy * .04); } if (m.chg.t <= 0) { m.chg = null; m.wind = 0; } return; }
  if (m.wind <= 0) {
   if (m.attaque === 'cac') { if (d < m.portee + m.r + T.r + .35) { if (T === P) blesserJoueur(A, m.dg, m, { cac: true }); else blesserAllie(A, m.dg, m); } SON('griffe'); }
   else if (m.attaque === 'tir' && m.M.rafale) { const a0 = Math.atan2(dy, dx); for (let k = -1; k <= 1; k++) { const a = a0 + k * .22; A.projs.push({ x: m.x, y: m.y, vx: Math.cos(a) * 6, vy: Math.sin(a) * 6, r: .17, ami: false, dg: m.dg, vie: 2, k: 'feu', src: m, touches: [] }); } SON('tir_e'); }
   else if (m.attaque === 'tir') { const a = Math.atan2(dy, dx); A.projs.push({ x: m.x, y: m.y, vx: Math.cos(a) * (m.M.proj === 'feu' ? 6 : 8.5), vy: Math.sin(a) * (m.M.proj === 'feu' ? 6 : 8.5), r: .18, ami: false, dg: m.dg, vie: 2, k: m.M.proj === 'feu' ? 'feu' : 'fleche_e', src: m, touches: [] }); SON('tir_e'); }
   else if (m.attaque === 'soin') { const c = m.cibleSoin; if (c && !c.mort) { c.pv = Math.min(c.pvmax, c.pv + c.pvmax * .25); particules(A, c.x, c.y, 10, '#9cff9c', 2, .6); texte(A, c.x, c.y - .8, '+soin', '#9cff9c'); } }
   m.attaque = null;
  }
  return;
 }
 // ---- capacités spéciales ----
 if (m.boss) { if (capaciteBoss(A, m, dt, d)) return; }
 else if (m.M.charge && m.cdS[0] <= 0 && d > 2.5 && d < 6.5 && vue(A, m.x, m.y, P.x, P.y)) {
  m.cdS[0] = 6; const a = Math.atan2(dy, dx); m.ang = a; m.wind = 1.25; m.chg = null;
  A.zones.push({ x: m.x + Math.cos(a) * 3, y: m.y + Math.sin(a) * 3, r: .01, t: -.6, tmax: .01, dg: 0, k: 'ligne', ang: a, long: 6, src: m, fait: true, ligneVie: .6 });
  setTimeoutJeu(A, .6, () => { if (!m.mort) m.chg = { vx: Math.cos(a) * 9, vy: Math.sin(a) * 9, t: .65 }; });
  return;
 }
 if (m.M.charge) m.cdS[0] -= dt;
 if (m.M.frappe) { m.cdS[0] -= dt; if (m.cdS[0] <= 0 && d < 3) { m.cdS[0] = 7; A.zones.push({ x: m.x, y: m.y, r: 2.2, t: -1, tmax: .05, dg: m.dg * 1.5, k: 'frappe', src: m }); m.wind = 1.05; m.attaque = null; SON('grogne'); return; } }
 if (m.k === 'spectre') { m.cdS[1] -= dt; if (m.cdS[1] <= 0 && d < 7 && d > 2.5) { m.cdS[1] = rnd(3, 5); const a = R() * 6.28, nx = P.x + Math.cos(a) * 1.6, ny = P.y + Math.sin(a) * 1.6; if (libre(A, nx, ny, m.r)) { particules(A, m.x, m.y, 10, '#9fd3ff', 2, .5); m.x = nx; m.y = ny; particules(A, m.x, m.y, 10, '#9fd3ff', 2, .5); m.cdA = .5; } } }
 if (m.ardent) { m.cdS[2] -= dt; if (m.cdS[2] <= 0) { m.cdS[2] = 2.2; A.zones.push({ x: m.x, y: m.y, r: .8, t: .01, tmax: 99, fait: true, feu: true, dur: 4, dg: m.dg, src: m, k: 'feusol' }); } }
 // ---- choix d'action ----
 const portee = m.portee + m.r + T.r;
 const voit = d < 12 && (d < 1.8 || vue(A, m.x, m.y, T.x, T.y));
 if (m.M.type === 'soin' && m.cdA <= 0) {
  let c = null; for (const o of A.mobs) if (!o.mort && !o.objet && o !== m && o.pv < o.pvmax * .6 && Math.hypot(o.x - m.x, o.y - m.y) < 6) { c = o; break; }
  if (c) { m.cdA = m.cad * 1.6; m.wind = .6; m.attaque = 'soin'; m.cibleSoin = c; return; }
 }
 if (m.M.type === 'tir' || m.M.type === 'soin' || (m.boss && m.M.portee > 3)) {
  if (voit && d < portee && m.cdA <= 0) { m.cdA = m.cad; m.wind = .5; m.attaque = 'tir'; m.ang = Math.atan2(dy, dx); return; }
  if (voit && d < m.portee * .55 && !m.boss) { suivre(A, m, -dx / d, -dy / d, vit * .8, dt); return; } // reculer
  if (voit && d < portee) return;
 } else if (d < portee) {
  if (m.cdA <= 0) { m.cdA = m.cad; m.wind = m.boss ? .6 : .5; m.attaque = 'cac'; m.ang = Math.atan2(dy, dx); }
  return;
 }
 // déplacement vers le joueur (champ de distances)
 if (d < 1.5 || (voit && d < 4)) { suivre(A, m, dx / d, dy / d, vit, dt); return; }
 const F = A.flow; if (!F) return;
 const tx = m.x | 0, ty = m.y | 0, c = F[ty * A.W + tx];
 if (c < 0) { if (d > 14) m.etat = 'veille'; return; }
 let bx = 0, by = 0, bv = c;
 for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
  const nx = tx + ox, ny = ty + oy; if (nx < 0 || ny < 0 || nx >= A.W || ny >= A.H) continue;
  const v = F[ny * A.W + nx]; if (v < 0 || v >= bv) continue;
  if (ox && oy && (F[ty * A.W + nx] < 0 || F[ny * A.W + tx] < 0)) continue;
  bv = v; bx = ox; by = oy;
 }
 if (bx || by) { const gx = tx + bx + .5 - m.x, gy = ty + by + .5 - m.y, gl = Math.hypot(gx, gy) || 1; suivre(A, m, gx / gl, gy / gl, vit, dt); }
}
/* ---------- Gobelin voleur : fuit, puis disparaît ---------- */
function majGobelin(A, m, dt) {
 const P = A.p, d = Math.hypot(P.x - m.x, P.y - m.y);
 if (m.etat === 'veille') { if (d < 8 && vue(A, m.x, m.y, P.x, P.y)) { m.etat = 'chasse'; message(A, 'Un gobelin voleur ! Rattrapez-le !', 2.5); SON('grogne'); } else return; }
 m.fuiteT += dt; if (R() < dt * 6) ajLoot(A, { x: m.x, y: m.y, or: Math.max(1, Math.round(ri(1, 3) * A.niveau * .3)) });
 if (m.fuiteT > 22) { m.mort = true; particules(A, m.x, m.y, 25, '#9a7aff', 3, .8); message(A, 'Le gobelin s’échappe par un portail…', 2.5); SON('blink'); return; }
 const F = A.flow; if (!F) return; const tx = m.x | 0, ty = m.y | 0, c = F[ty * A.W + tx];
 let bx = 0, by = 0, bv = c;
 for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) { const nx = tx + ox, ny = ty + oy; if (nx < 0 || ny < 0 || nx >= A.W || ny >= A.H) continue; const v = F[ny * A.W + nx]; if (v < 0 || v <= bv) continue; if (ox && oy && (F[ty * A.W + nx] < 0 || F[ny * A.W + tx] < 0)) continue; bv = v; bx = ox; by = oy; }
 const vit = m.vit * (m.slow > 0 ? .5 : 1);
 if (bx || by) { const gx = tx + bx + .5 - m.x, gy = ty + by + .5 - m.y, gl = Math.hypot(gx, gy) || 1; suivre(A, m, gx / gl, gy / gl, vit, dt); }
 else if (d < 3) suivre(A, m, (m.x - P.x) / d, (m.y - P.y) / d, vit, dt);
}
/* ---------- Compagnon ---------- */
function blesserAllie(A, dg, src) {
 const C = A.allie; if (!C || C.ko) return;
 const d = Math.max(1, dg * (1 - (10 + A.X.o.heros.niveau * 3) / ((10 + A.X.o.heros.niveau * 3) + 40 + 14 * (src ? src.niv || A.niveau : A.niveau))) * rnd(.9, 1.1));
 C.pv -= d; C.hitf = .15; texte(A, C.x, C.y - .8, Math.round(d), '#ffb0a0');
 if (C.pv <= 0) { C.pv = 0; C.ko = 18; message(A, `${C.nom} est à terre !`, 2); particules(A, C.x, C.y, 14, '#8a1d1d', 3, .6); SON('mort'); }
}
function majAllie(A, dt) {
 const C = A.allie, P = A.p; if (!C) return;
 C.anim += dt; C.hitf -= dt; C.cdA -= dt; C.cdS -= dt;
 if (C.ko > 0) { C.ko -= dt; if (C.ko <= 0) { C.pv = C.pvmax * .5; message(A, `${C.nom} se relève.`, 1.5); } if (Math.hypot(P.x - C.x, P.y - C.y) > 12) { C.x = P.x; C.y = P.y; } return; }
 C.pv = Math.min(C.pvmax, C.pv + C.pvmax * .006 * dt);
 const K = C.K; let cible = null, bd = K.type === 'cac' ? 5.5 : 7.5;
 for (const m of A.mobs) { if (m.mort || m.objet || m.etat !== 'chasse' && Math.hypot(m.x - P.x, m.y - P.y) > 5) continue; const d = Math.hypot(m.x - C.x, m.y - C.y); if (d < bd && vue(A, C.x, C.y, m.x, m.y)) { bd = d; cible = m; } }
 const dP = Math.hypot(P.x - C.x, P.y - C.y);
 // prêtresse : soins
 if (K.type === 'soin' && C.cdS <= 0 && P.pv < P.S.pvmax * .65 && dP < 7) { C.cdS = 7; const s = P.S.pvmax * .22; P.pv = Math.min(P.S.pvmax, P.pv + s); particules(A, P.x, P.y, 16, '#fff2b0', 2, .7); texte(A, P.x, P.y - 1, '+' + Math.round(s), '#fff2b0'); C.anim2 = .5; SON('potion'); }
 if (dP > 9) { C.x = P.x - .5; C.y = P.y + .5; return; }
 let mx = 0, my = 0;
 if (cible) {
  const d = Math.hypot(cible.x - C.x, cible.y - C.y), portee = K.portee + cible.r + C.r;
  C.ang = Math.atan2(cible.y - C.y, cible.x - C.x);
  if (d > portee) { mx = (cible.x - C.x) / d; my = (cible.y - C.y) / d; }
  else if (C.cdA <= 0) {
   C.cdA = K.cad; C.anim2 = .25;
   const dg = C.dg * rnd(.85, 1.15) * (1 + .4 * (chance(.1) ? 1 : 0));
   if (K.type === 'cac') { frapperParAllie(A, cible, dg); SON('epee'); }
   else A.projs.push({ x: C.x, y: C.y, vx: Math.cos(C.ang) * 13, vy: Math.sin(C.ang) * 13, r: .16, ami: true, allie: dg, vie: 1.2, k: K.type === 'soin' ? 'lumiere' : 'fleche', touches: [] });
  }
 } else if (dP > 2.2) { mx = (P.x - C.x) / dP; my = (P.y - C.y) / dP; C.ang = Math.atan2(my, mx); }
 if (mx || my) { bouger(A, C, mx * 4.4 * dt, my * 4.4 * dt); C.pas += dt * 9; }
}
function frapperParAllie(A, m, dg) {
 if (m.mort) return; if (m.objet) { m.mort = true; casserObjet(A, m); return; }
 m.pv -= dg; m.hitf = .1; m.etat = 'chasse'; texte(A, m.x, m.y - m.r - .3, Math.round(dg), '#d8e8c8');
 if (m.pv <= 0) tuerMob(A, m);
}
function suivre(A, m, ux, uy, v, dt) { bouger(A, m, ux * v * dt, uy * v * dt); m.ang = Math.atan2(uy, ux); }
function setTimeoutJeu(A, t, f) { (A.minuteries || (A.minuteries = [])).push({ t: A.t + t, f }); }
function majMinuteries(A) { if (!A.minuteries) return; for (let i = A.minuteries.length - 1; i >= 0; i--) if (A.t >= A.minuteries[i].t) { const f = A.minuteries[i].f; A.minuteries.splice(i, 1); f(); } }

function capaciteBoss(A, m, dt, d) {
 const P = A.p; for (let i = 0; i < 3; i++) m.cdS[i] -= dt * (m.phase === 2 ? 1.3 : 1);
 const telegraphe = (x, y, r, t, dg, k) => A.zones.push({ x, y, r, t: -t, tmax: .05, dg, k, src: m });
 if (m.k === 'liche') {
  if (m.cdS[0] <= 0) { m.cdS[0] = 5.5; const n = m.phase === 2 ? 12 : 9; for (let i = 0; i < n; i++) { const a = i / n * 6.283 + m.anim; A.projs.push({ x: m.x, y: m.y, vx: Math.cos(a) * 4.5, vy: Math.sin(a) * 4.5, r: .2, ami: false, dg: m.dg * .5, vie: 3, k: 'givre', gel: true, src: m, touches: [] }); } SON('givre'); m.wind = .4; return true; }
  if (m.cdS[1] <= 0 && A.vivants < 10) { m.cdS[1] = 13; for (let i = 0; i < 3; i++) { const a = R() * 6.28; const s = mkMob('squelette', m.x + Math.cos(a) * 2, m.y + Math.sin(a) * 2, m.niv - .5); s.etat = 'chasse'; if (libre(A, s.x, s.y, s.r)) { A.mobs.push(s); particules(A, s.x, s.y, 12, '#b6f0ff', 2, .6); } } message(A, 'Les morts se relèvent…', 2); SON('invoque'); return true; }
  if (m.cdS[2] <= 0) { m.cdS[2] = 7; for (let i = 0; i < 3; i++) telegraphe(P.x + rnd(-2, 2), P.y + rnd(-2, 2), 1.5, 1.2 + i * .25, m.dg * 1.1, 'givre'); return false; }
 } else if (m.k === 'ogre' || m.k === 'champion') {
  if (m.cdS[0] <= 0 && d < 4) { m.cdS[0] = m.k === 'ogre' ? 6 : 5; telegraphe(m.x, m.y, m.k === 'ogre' ? 3.2 : 2.6, 1, m.dg * 1.6, 'frappe'); m.wind = 1.05; m.attaque = null; SON('grogne'); return true; }
  if (m.cdS[1] <= 0 && d > 3 && d < 9) { m.cdS[1] = 8; const a = Math.atan2(P.y - m.y, P.x - m.x); m.wind = 1.3; A.zones.push({ x: m.x, y: m.y, r: .01, t: -.6, tmax: .01, k: 'ligne', ang: a, long: 7, fait: true, ligneVie: .6 }); setTimeoutJeu(A, .6, () => { if (!m.mort) m.chg = { vx: Math.cos(a) * 11, vy: Math.sin(a) * 11, t: .65 }; }); return true; }
  if (m.k === 'champion' && m.cdS[2] <= 0 && A.vivants < 8 && A.X.o.arene) { m.cdS[2] = 14; for (let i = 0; i < 2; i++) { const s = mkMob('soldat', m.x + rnd(-2, 2), m.y + rnd(-2, 2), m.niv - .5, false, m.maison); s.etat = 'chasse'; if (libre(A, s.x, s.y, s.r)) A.mobs.push(s); } message(A, 'Des renforts accourent !', 2); return true; }
 } else if (m.k === 'reine') {
  if (m.cdS[0] <= 0 && A.vivants < 12) { m.cdS[0] = 11; for (let i = 0; i < (m.phase === 2 ? 6 : 4); i++) { const a = R() * 6.28; const s = mkMob('araignee', m.x + Math.cos(a) * 1.5, m.y + Math.sin(a) * 1.5, m.niv - 1); s.etat = 'chasse'; if (libre(A, s.x, s.y, s.r)) A.mobs.push(s); } message(A, 'La couvée éclot !', 2); SON('invoque'); m.wind = .5; return true; }
  if (m.cdS[1] <= 0) { m.cdS[1] = 6; for (let i = 0; i < (m.phase === 2 ? 5 : 3); i++) telegraphe(P.x + rnd(-2.2, 2.2), P.y + rnd(-2.2, 2.2), 1.4, 1.1 + i * .2, m.dg * 1.1, 'poison'); return false; }
  if (m.cdS[2] <= 0 && d < 8) { m.cdS[2] = 3.5; const a = Math.atan2(P.y - m.y, P.x - m.x); for (const k of [-.15, .15]) A.projs.push({ x: m.x, y: m.y, vx: Math.cos(a + k) * 7, vy: Math.sin(a + k) * 7, r: .22, ami: false, dg: m.dg * .5, vie: 2.2, k: 'toile', gel: true, src: m, touches: [] }); m.wind = .35; return true; }
 } else if (m.k === 'wyverne') {
  if (m.cdS[0] <= 0 && d < 7) { m.cdS[0] = 6; const a = Math.atan2(P.y - m.y, P.x - m.x); for (let k = 1; k <= 5; k++) for (const s of [-1, 0, 1]) { if (k < 2 && s) continue; const aa = a + s * .28; telegraphe(m.x + Math.cos(aa) * k * 1.2, m.y + Math.sin(aa) * k * 1.2, .75 + k * .08, .9 + k * .06, m.dg * 1.2, 'feu'); } m.wind = 1.3; m.ang = a; SON('souffle'); return true; }
  if (m.cdS[1] <= 0) { m.cdS[1] = 4.5; for (let i = -2; i <= 2; i++) { const a = Math.atan2(P.y - m.y, P.x - m.x) + i * .2; A.projs.push({ x: m.x, y: m.y, vx: Math.cos(a) * 6.5, vy: Math.sin(a) * 6.5, r: .24, ami: false, dg: m.dg * .8, vie: 2.5, k: 'feu', src: m, touches: [] }); } m.wind = .4; return true; }
  if (m.cdS[2] <= 0 && m.phase === 2) { m.cdS[2] = 9; for (let i = 0; i < 6; i++) telegraphe(P.x + rnd(-4, 4), P.y + rnd(-4, 4), 1.4, 1.2 + R() * .6, m.dg * 1.3, 'feu'); message(A, 'Une pluie de braises !', 1.5); return false; }
 }
 return false;
}

/* ---------- Robot joueur (tests automatiques et équilibrage) ---------- */
function botEntree(A) {
 const P = A.p, inp = { mx: P.x, my: P.y, clic: false, comp: [false, false, false, false] };
 let c = null, bd = 1e9;
 for (const m of A.mobs) { if (m.mort || m.botIgnore > A.t) continue; const d = Math.hypot(m.x - P.x, m.y - P.y); const prio = m.objet ? d + 6 : d; if (prio < bd && (d < 9 && vue(A, P.x, P.y, m.x, m.y))) { bd = prio; c = m; } }
 if (P.pv < P.S.pvmax * .38) inp.potion = true;
 // esquive des télégraphes
 for (const z of A.zones) if (!z.ami && z.t < 0 && Math.hypot(P.x - z.x, P.y - z.y) < z.r + .4) { const a = Math.atan2(P.y - z.y, P.x - z.x); inp.mx = P.x + Math.cos(a) * 3; inp.my = P.y + Math.sin(a) * 3; inp.clic = true; return inp; }
 const C = CLASSES[A.X.o.heros.classe];
 if (c) {
  if (A.botCible !== c || c.pv !== A.botCiblePv) { A.botCible = c; A.botCiblePv = c.pv; A.botCibleT = A.t; }
  else if (A.t - A.botCibleT > 4) { c.botIgnore = A.t + 15; A.botCible = null; }
  inp.mx = c.x; inp.my = c.y; inp.clic = true;
  const d = Math.hypot(c.x - P.x, c.y - P.y);
  if (C.attaque !== 'cac' && d < 2.2 && !c.objet) { inp.clic = true; inp.shift = true; }
  if (!c.objet) { const cs = C.comp; for (let i = 0; i < 4; i++) { const id = cs[i].id; if (!rangComp(A, id)) continue; if (id === 'roulade' || id === 'blink' || id === 'cri' && d > 3) continue; if (id === 'tourbillon' && d > 2.2 || id === 'nova' && d > 3) continue; if (P.mana > cs[i].cout + 10 && chance(.05)) inp.comp[i] = true; } }
  return inp;
 }
 // ramasser, sinon aller vers l'objectif
 let l = null; bd = 1e9; for (const o of A.autels || []) { if (o.pris) continue; const d = Math.hypot(o.x - P.x, o.y - P.y); if (d < bd && d < 12) { bd = d; l = o; } }
 for (const o of A.loot) { if (o.ign > A.t || o.potion && P.potions >= 5 || o.globe && P.pv > P.S.pvmax * .8) continue; const d = Math.hypot(o.x - P.x, o.y - P.y); if (d < bd && d < 10) { bd = d; l = o; } }
 let cx, cy;
 if (l) { if (A.botLoot !== l) { A.botLoot = l; A.botLootT = A.t; } else if (A.t - A.botLootT > 6) l.ign = A.t + 60; cx = Math.floor(l.x) + .5; cy = Math.floor(l.y) + .5; }
 else if (A.portail) { cx = A.portail.x; cy = A.portail.y; }
 else {
  // case non découverte la plus proche, ou l'escalier, ou le boss
  if (!A.botBut || A.t > A.botButT) {
   A.botButT = A.t + 2;
   const vivantsLoin = A.mobs.filter(m => !m.mort && !m.objet);
   const fin = A.carte.fin; const esc = A.carte.t[fin.cy * A.W + fin.cx] === ESC;
   if (esc && (vivantsLoin.length < 6 || A.t > 200)) A.botBut = { x: fin.cx + .5, y: fin.cy + .5 };
   else if (vivantsLoin.length) { let b = null, bdd = 1e9; for (const m of vivantsLoin) { const d = Math.hypot(m.x - P.x, m.y - P.y); if (d < bdd) { bdd = d; b = m; } } A.botBut = { x: b.x, y: b.y }; }
   else A.botBut = { x: fin.cx + .5, y: fin.cy + .5 };
  }
  cx = A.botBut.x; cy = A.botBut.y;
 }
 // chemin : descente du champ de distances calculé depuis le but
 if (!A.botFlow || A.botFlowBut !== cx + ',' + cy) { A.botFlow = bfs(A.carte.t, A.W, A.H, cx | 0, cy | 0, 999); A.botFlowBut = cx + ',' + cy; }
 const F = A.botFlow, tx = P.x | 0, ty = P.y | 0; let bv = F[ty * A.W + tx], gx = cx, gy = cy;
 if (bv > 0) for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const v = F[(ty + oy) * A.W + tx + ox]; if (v >= 0 && v < bv) { bv = v; gx = tx + ox + .5; gy = ty + oy + .5; } }
 inp.mx = gx; inp.my = gy; inp.clic = true;
 if (A.surEscalier) inp.action = true;
 return inp;
}
// joue un étage complet sans rendu (équilibrage)
function simulerEtage(A, maxT = 400) { const dt = 1 / 30; while (!A.fini && A.t < maxT) { majDonjon(A, dt, botEntree(A)); } return A; }
if (typeof SON === 'undefined') var SON = () => { };
