'use strict';
/* =========================================================
   Monde : géographie de la carte (raster déterministe) et voisinages
   ========================================================= */
const MONDE = (() => {
 const W = 250, H = 170, K = 4; // carte 1000 × 680
 const rng = seeded(41207);
 const perm = new Uint8Array(512); { const p = [...Array(256).keys()]; for (let i = 255; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } for (let i = 0; i < 512; i++) perm[i] = p[i & 255]; }
 const h2 = (x, y) => perm[(perm[x & 255] + y) & 255] / 255;
 const sm = t => t * t * (3 - 2 * t);
 function bruit(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = sm(x - xi), yf = sm(y - yi); const a = h2(xi, yi), b = h2(xi + 1, yi), c = h2(xi, yi + 1), d = h2(xi + 1, yi + 1); return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf; }
 function fbm(x, y) { return bruit(x, y) * .55 + bruit(x * 2.1, y * 2.1) * .3 + bruit(x * 4.3, y * 4.3) * .15; }
 const P = PROVINCES, N = P.length, idx = {}; P.forEach((p, i) => idx[p.id] = i);
 const grille = new Int8Array(W * H).fill(-1), relief = new Float32Array(W * H);
 for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const wx = x * K, wy = y * K;
  const ox = (fbm(wx / 90, wy / 90) - .5) * 70, oy = (fbm(wx / 90 + 30, wy / 90 + 17) - .5) * 70;
  let best = -1, bd = 1e9, second = 1e9;
  for (let i = 0; i < N; i++) { const d = Math.hypot(wx + ox - P[i].x, wy + oy - P[i].y); if (d < bd) { second = bd; bd = d; best = i; } else if (d < second) second = d; }
  const cote = 66 + fbm(wx / 60 + 5, wy / 60 + 9) * 62;
  const bord = Math.min(wx, wy, 1000 - wx, 680 - wy);
  relief[y * W + x] = fbm(wx / 40 + 3, wy / 40 + 1);
  if (bd < cote && bord > 18) grille[y * W + x] = best;
 }
 // voisinages
 const adj = P.map(() => new Set());
 for (let y = 0; y < H - 1; y++) for (let x = 0; x < W - 1; x++) {
  const a = grille[y * W + x]; if (a < 0) continue;
  for (const b of [grille[y * W + x + 1], grille[(y + 1) * W + x]]) if (b >= 0 && b !== a) { adj[a].add(b); adj[b].add(a); }
 }
 for (const [a, b] of LIENS_MER) { adj[idx[a]].add(idx[b]); adj[idx[b]].add(idx[a]); }
 // provinces isolées : relier à la plus proche
 for (let i = 0; i < N; i++) if (!adj[i].size) { let j = -1, bd = 1e9; for (let k = 0; k < N; k++) if (k !== i) { const d = Math.hypot(P[i].x - P[k].x, P[i].y - P[k].y); if (d < bd) { bd = d; j = k; } } adj[i].add(j); adj[j].add(i); }
 const voisins = adj.map(s => [...s].map(i => P[i].id));
 return { W, H, K, grille, relief, voisins, idx, fbm };
})();
