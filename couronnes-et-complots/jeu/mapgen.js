// ---------- Génération de la carte (cellules de Voronoï déformées) ----------
const W = 1000, H = 660;
const REGIONS = [
  { name: "Nordmark", bonus: 3, lx: 200, ly: 60 },
  { name: "Marches de l'Est", bonus: 3, lx: 760, ly: 50 },
  { name: "Couronne", bonus: 5, lx: 480, ly: 175 },
  { name: "Sud Ambré", bonus: 3, lx: 450, ly: 625 },
  { name: "Côte du Ponant", bonus: 2, lx: 95, ly: 330 },
  { name: "Désert d'Ishar", bonus: 3, lx: 860, ly: 610 },
];
const TERR = [
  // Nordmark
  { n: "Glacemont", r: 0, x: 150, y: 115 }, { n: "Fjordheim", r: 0, x: 265, y: 95 },
  { n: "Hautbois", r: 0, x: 200, y: 195 }, { n: "Brumeval", r: 0, x: 315, y: 180 },
  { n: "Port-Gris", r: 0, x: 105, y: 245 },
  // Marches de l'Est
  { n: "Vargas", r: 1, x: 610, y: 105 }, { n: "Kesh", r: 1, x: 725, y: 95 },
  { n: "Sarnathe", r: 1, x: 845, y: 135 }, { n: "Ostrel", r: 1, x: 680, y: 195 },
  { n: "Durnholm", r: 1, x: 800, y: 235 },
  // Couronne
  { n: "Aurelion", r: 2, x: 480, y: 300 }, { n: "Valmont", r: 2, x: 400, y: 235 },
  { n: "Lysse", r: 2, x: 565, y: 225 }, { n: "Corbel", r: 2, x: 385, y: 345 },
  { n: "Tarn", r: 2, x: 575, y: 345 }, { n: "Mirebel", r: 2, x: 480, y: 405 },
  // Sud Ambré
  { n: "Solenne", r: 3, x: 345, y: 465 }, { n: "Cendrais", r: 3, x: 455, y: 490 },
  { n: "Ambrecourt", r: 3, x: 575, y: 465 }, { n: "Vireterre", r: 3, x: 375, y: 560 },
  { n: "Pallas", r: 3, x: 505, y: 575 },
  // Côte du Ponant
  { n: "Ravenne", r: 4, x: 260, y: 330 }, { n: "Merrow", r: 4, x: 135, y: 390 },
  { n: "Thalos", r: 4, x: 225, y: 450 }, { n: "Kael", r: 4, x: 150, y: 525 },
  // Désert d'Ishar
  { n: "Ishar", r: 5, x: 720, y: 440 }, { n: "Zahrim", r: 5, x: 830, y: 405 },
  { n: "Qadim", r: 5, x: 790, y: 520 }, { n: "Nabur", r: 5, x: 670, y: 555 },
  { n: "Selim", r: 5, x: 885, y: 305 },
];
const SEA = [
  [450, 95], [455, 40], [380, 60], [540, 50], // golfe du Nord
  [660, 320], [700, 300], // baie d'Ostrel
  [290, 530], [270, 600], // détroit de Kael
  [610, 625], [930, 470], [950, 220], [40, 160], [60, 460], [940, 600], [35, 600],
  [285, 255],
];
const SEA_ROUTES = [["Fjordheim", "Vargas"], ["Kael", "Vireterre"], ["Ostrel", "Tarn"]];

function buildMap(Delaunay) {
  let a = 7;
  const rng = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const step = 15, pts = [];
  for (let y = 0; y <= H; y += step) for (let x = 0; x <= W; x += step)
    pts.push([Math.min(W, Math.max(0, x + (rng() - .5) * step * .9)), Math.min(H, Math.max(0, y + (rng() - .5) * step * .9))]);
  const nz = (x, y) => Math.sin(x * .021 + 1.3) * Math.cos(y * .017 + .4) + .55 * Math.sin(x * .053 + y * .041 + 2) + .3 * Math.sin(x * .11 - y * .093 + 5);
  const seeds = TERR.map(t => [t.x, t.y]).concat(SEA);
  const owner = pts.map(([x, y]) => {
    if (x < 22 || y < 22 || x > W - 22 || y > H - 22) return -1;
    const wx = x + 26 * nz(x, y), wy = y + 26 * nz(y + 77, x - 31);
    let best = 0, bd = 1e12;
    seeds.forEach(([sx, sy], i) => { const d = (sx - wx) ** 2 + (sy - wy) ** 2; if (d < bd) { bd = d; best = i; } });
    // limite côtière : trop loin de toute graine terrestre → mer
    return best < TERR.length && bd < 115 * 115 ? best : -1;
  });
  const del = Delaunay.from(pts), vor = del.voronoi([0, 0, W, H]);
  // nettoyage : chaque territoire ne garde que sa plus grande composante connexe
  for (let pass = 0; pass < 3; pass++) {
    const comp = new Array(pts.length).fill(-1), compsBy = {};
    let cid = 0;
    for (let i = 0; i < pts.length; i++) {
      if (owner[i] < 0 || comp[i] >= 0) continue;
      const st = [i], cells = []; comp[i] = cid;
      while (st.length) { const u = st.pop(); cells.push(u); for (const v of del.neighbors(u)) if (comp[v] < 0 && owner[v] === owner[i]) { comp[v] = cid; st.push(v); } }
      (compsBy[owner[i]] ||= []).push(cells); cid++;
    }
    for (const t in compsBy) {
      const cs = compsBy[t].sort((a, b) => b.length - a.length);
      for (const cells of cs.slice(1)) for (const u of cells) {
        const cnt = {}; for (const v of del.neighbors(u)) if (owner[v] != t) cnt[owner[v]] = (cnt[owner[v]] || 0) + 1;
        const k = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0]; if (k !== undefined) owner[u] = +k;
      }
    }
  }
  const { halfedges, triangles } = del, cc = vor.circumcenters;
  const adj = TERR.map(() => new Set());
  const segInner = [], segRegion = [], segCoast = [], segT = TERR.map(() => []);
  for (let e = 0; e < halfedges.length; e++) {
    const o = halfedges[e]; if (o < e) continue;
    const p = triangles[e], q = triangles[e % 3 === 2 ? e - 2 : e + 1];
    const tp = owner[p], tq = owner[q]; if (tp === tq) continue;
    const t1 = Math.floor(e / 3), t2 = Math.floor(o / 3);
    const s = [cc[2 * t1], cc[2 * t1 + 1], cc[2 * t2], cc[2 * t2 + 1]].map(v => Math.round(v * 10) / 10);
    if (tp >= 0) segT[tp].push(s); if (tq >= 0) segT[tq].push(s);
    if (tp >= 0 && tq >= 0) { adj[tp].add(tq); adj[tq].add(tp); (TERR[tp].r === TERR[tq].r ? segInner : segRegion).push(s); }
    else segCoast.push(s);
  }
  const paths = TERR.map(() => []), sums = TERR.map(() => [0, 0, 0]);
  owner.forEach((t, i) => {
    if (t < 0) return;
    const poly = vor.cellPolygon(i); if (!poly) return;
    paths[t].push("M" + poly.slice(0, -1).map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join("L") + "Z");
    sums[t][0] += pts[i][0]; sums[t][1] += pts[i][1]; sums[t][2]++;
  });
  const centers = sums.map(([sx, sy, n], t) => {
    const mx = sx / n, my = sy / n; let best = null, bd = 1e12;
    owner.forEach((o, i) => { if (o === t) { const d = (pts[i][0] - mx) ** 2 + (pts[i][1] - my) ** 2; if (d < bd) { bd = d; best = pts[i]; } } });
    return best;
  });
  const idx = Object.fromEntries(TERR.map((t, i) => [t.n, i]));
  const routes = SEA_ROUTES.map(([u, v]) => [idx[u], idx[v]]).filter(([u, v]) => !adj[u].has(v));
  routes.forEach(([u, v]) => { adj[u].add(v); adj[v].add(u); });
  // ---- décor : étiquettes de région et pictogrammes de relief ----
  const interior = pts.map((_, i) => owner[i] >= 0 && [...del.neighbors(i)].every(j => owner[j] === owner[i]));
  const tok = centers;
  const busy = []; // rectangles occupés [x0,y0,x1,y1]
  tok.forEach(([x, y], t) => busy.push([x - 42, y - 30, x + 42, y + 36]));
  const free = (x, y, w, h) => !busy.some(b => x + w > b[0] && x - w < b[2] && y + h > b[1] && y - h < b[3]);
  const rlabels = [];
  const KIND = [["mont", "pin", "pin"], ["mont", "mont", "pin"], ["colline", "arbre", "champ"], ["champ", "vigne", "colline"], ["arbre", "arbre", "pin"], ["dune", "dune", "palmier"]];
  const glyphs = [];
  const order = pts.map((_, i) => i).sort(() => rng() - .5);
  for (const i of order) {
    if (!interior[i]) continue;
    const [x, y] = pts[i];
    if (!free(x, y, 7, 6) || glyphs.some(g => Math.hypot(g[0] - x, g[1] - y) < 19)) continue;
    if (rng() < .2) continue;
    const ks = KIND[TERR[owner[i]].r];
    glyphs.push([Math.round(x), Math.round(y), ks[Math.floor(rng() * ks.length)]]);
  }
  // ---- géométrie compacte : on enchaîne les segments en anneaux fermés (au lieu de ~2000 cellules) ----
  const chain = segs => {
    const key = (x, y) => x.toFixed(1) + "," + y.toFixed(1);
    const adjm = new Map(), used = new Array(segs.length).fill(false);
    segs.forEach((s, i) => { for (const k of [key(s[0], s[1]), key(s[2], s[3])]) { if (!adjm.has(k)) adjm.set(k, []); adjm.get(k).push(i); } });
    const out = [];
    for (let i = 0; i < segs.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      const pts = [[segs[i][0], segs[i][1]], [segs[i][2], segs[i][3]]];
      // prolonge dans les deux sens
      for (const dir of [1, -1]) {
        for (;;) {
          const end = dir === 1 ? pts[pts.length - 1] : pts[0];
          const nx = (adjm.get(key(end[0], end[1])) || []).find(j => !used[j]);
          if (nx === undefined) break;
          used[nx] = true;
          const s2 = segs[nx], k0 = key(s2[0], s2[1]) === key(end[0], end[1]);
          const p = k0 ? [s2[2], s2[3]] : [s2[0], s2[1]];
          if (dir === 1) pts.push(p); else pts.unshift(p);
        }
      }
      out.push(pts);
    }
    return out;
  };
  const ringPath = segs => chain(segs).map(p => "M" + p.map(q => q[0] + "," + q[1]).join("L") + (p.length > 2 && p[0][0] === p[p.length - 1][0] && p[0][1] === p[p.length - 1][1] ? "Z" : "")).join("");
  const seg = arr => arr.map(s => `M${s[0]},${s[1]}L${s[2]},${s[3]}`).join("");
  return {
    paths: paths.map(p => p.join("")), centers, adj: adj.map(s => [...s]), routes, counts: sums.map(s => s[2]),
    glyphs, rlabels, inner: ringPath(segInner), outlines: segT.map(ringPath), region: ringPath(segRegion), coast: ringPath(segCoast), rings: segT.map(ringPath), landRings: ringPath(segCoast),
  };
}
if (typeof module !== "undefined") module.exports = { buildMap, TERR, REGIONS, W, H };
