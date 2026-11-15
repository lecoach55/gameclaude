'use strict';
/* =========================================================
   SEDES PETRI — carte de la Chrétienté (raster parchemin + calque SVG)
   ========================================================= */
const MAP = { pid: null, tex: null, sea: null, ctx: null, img: null, mode: 'royaumes', cent: [], cnt: [], ready: false, view: { k: 1, x: 0, y: 0 }, fit: 1 };
function hash2(i, j) { let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function vnoise(x, y) { const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j; const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); const a = hash2(i, j), b = hash2(i + 1, j), c = hash2(i, j + 1), d = hash2(i + 1, j + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
function fbm(x, y) { return vnoise(x, y) * 0.6 + vnoise(x * 2.1 + 7, y * 2.1 + 3) * 0.3 + vnoise(x * 4.3 + 11, y * 4.3 + 5) * 0.1; }
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
function lerpC(a, b, t) { t = clamp(t, 0, 1); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
function landPath(ctx) { ctx.beginPath(); for (const poly of LAND) { for (let i = 0; i < poly.length; i += 2) { const [x, y] = proj(poly[i], poly[i + 1]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); } }

function buildMap() {
 const W = MW, H = MH, N = W * H;
 const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
 x.fillStyle = '#fff'; landPath(x); x.fill('nonzero');
 const d = x.getImageData(0, 0, W, H).data; const land = new Uint8Array(N);
 for (let i = 0; i < N; i++) land[i] = d[i * 4 + 3] > 127 ? 1 : 0;
 // composantes
 const comp = new Int32Array(N).fill(-1); const st = new Int32Array(N); let nc = 0;
 for (let i = 0; i < N; i++) if (land[i] && comp[i] < 0) {
  let sp = 0; st[sp++] = i; comp[i] = nc;
  while (sp) { const k = st[--sp], kx = k % W; const nb = [kx > 0 ? k - 1 : -1, kx < W - 1 ? k + 1 : -1, k - W, k + W]; for (const q of nb) if (q >= 0 && q < N && land[q] && comp[q] < 0) { comp[q] = nc; st[sp++] = q; } }
  nc++;
 }
 const seeds = [];
 PROVS.forEach((p, pi) => p.xy.forEach(([sx, sy]) => {
  const cx = Math.round(sx), cy = Math.round(sy); let best = -1;
  for (let r = 0; r < 16 && best < 0; r++) for (let dy = -r; dy <= r && best < 0; dy++) for (let dx = -r; dx <= r; dx++) { const xx = cx + dx, yy = cy + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const k = yy * W + xx; if (land[k]) { best = k; break; } }
  seeds.push({ x: sx, y: sy, p: pi, c: best >= 0 ? comp[best] : -1 });
 }));
 const byComp = {}; seeds.forEach(s => (byComp[s.c] = byComp[s.c] || []).push(s));
 const pid = new Int16Array(N).fill(-1), tex = new Float32Array(N);
 // accélération exacte : par case de 16 px, seules les graines qui peuvent être les plus proches sont testées
 const G = 16, GW = Math.ceil(W / G), GH = Math.ceil(H / G), RR = G * Math.SQRT1_2 + 18 * Math.SQRT2 + 1;
 const cellC = new Array(GW * GH);
 for (let gy = 0; gy < GH; gy++) for (let gx = 0; gx < GW; gx++) {
  const cx = gx * G + G / 2, cy = gy * G + G / 2, d0 = {};
  const ds = seeds.map(s => { const d = Math.hypot(cx - s.x, cy - s.y); if (d0[s.c] === undefined || d < d0[s.c]) d0[s.c] = d; return d; });
  cellC[gy * GW + gx] = seeds.filter((s, j) => ds[j] <= d0[s.c] + 2 * RR);
 }
 for (let i = 0; i < N; i++) {
  const px = i % W, py = (i / W) | 0;
  if (!land[i]) continue;
  const cm = comp[i], own = byComp[cm], list = own ? cellC[((py / G) | 0) * GW + ((px / G) | 0)] : seeds;
  const wx = px + (fbm(px * 0.017, py * 0.017) - 0.5) * 36, wy = py + (fbm(px * 0.017 + 40, py * 0.017 + 40) - 0.5) * 36;
  let bd = 1e12, bp = -1;
  for (let j = 0; j < list.length; j++) { const s = list[j]; if (own && s.c !== cm) continue; const dx = wx - s.x, dy = wy - s.y, dd = dx * dx + dy * dy; if (dd < bd) { bd = dd; bp = s.p; } }
  pid[i] = bp;
  tex[i] = 0.9 + fbm(px * 0.045, py * 0.045) * 0.13 + (hash2(px, py) - 0.5) * 0.045;
 }
 // adjacence, centres
 const adj = {}; PROVS.forEach(p => adj[p.id] = new Set());
 const sx = new Float64Array(PROVS.length), sy = new Float64Array(PROVS.length), cnt = new Int32Array(PROVS.length);
 for (let i = 0; i < N; i++) {
  const p = pid[i]; if (p < 0) continue; const px = i % W;
  sx[p] += px; sy[p] += (i / W) | 0; cnt[p]++;
  if (px < W - 1) { const q = pid[i + 1]; if (q >= 0 && q !== p) { adj[PROVS[p].id].add(PROVS[q].id); adj[PROVS[q].id].add(PROVS[p].id); } }
  if (i + W < N) { const q = pid[i + W]; if (q >= 0 && q !== p) { adj[PROVS[p].id].add(PROVS[q].id); adj[PROVS[q].id].add(PROVS[p].id); } }
 }
 setAdjacency(adj);
 MAP.cent = PROVS.map((p, i) => cnt[i] ? [sx[i] / cnt[i], sy[i] / cnt[i]] : p.xy[0]);
 const bl = PROVS.map(() => []);
 for (let i = 0; i < N; i++) { const p = pid[i]; if (p < 0) continue; const px = i % W; if ((px < W - 1 && pid[i + 1] !== p) || (px > 0 && pid[i - 1] !== p) || (i + W < N && pid[i + W] !== p) || (i >= W && pid[i - W] !== p)) bl[p].push(i); }
 MAP.bord = bl.map(a => Int32Array.from(a));
 MAP.cnt = Array.from(cnt);
 // mer gravée
 const sc = document.createElement('canvas'); sc.width = W; sc.height = H; const sx2 = sc.getContext('2d');
 const g = sx2.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#b7c4b8'); g.addColorStop(0.5, '#c4ccb8'); g.addColorStop(1, '#b4c1b6');
 sx2.fillStyle = g; sx2.fillRect(0, 0, W, H);
 sx2.lineJoin = 'round';
 const rings = [[22, 'rgba(70,95,100,.10)'], [17, '#c0c9b8'], [13, 'rgba(60,85,95,.16)'], [10, '#bcc6b6'], [7, 'rgba(50,75,85,.22)'], [4.5, '#b9c4b4'], [2.6, 'rgba(40,60,70,.32)']];
 for (const [w, col] of rings) { sx2.lineWidth = w; sx2.strokeStyle = col; landPath(sx2); sx2.stroke(); }
 const sd = sx2.getImageData(0, 0, W, H).data;
 for (let i = 0; i < N; i++) { const n = 0.94 + fbm((i % W) * 0.03, ((i / W) | 0) * 0.03) * 0.1 + (hash2(i % W, (i / W) | 0) - 0.5) * 0.03; sd[i * 4] *= n; sd[i * 4 + 1] *= n; sd[i * 4 + 2] *= n; }
 MAP.sea = sd; MAP.pid = pid; MAP.tex = tex;
 const wv = []; let guard = 0; while (wv.length < 34 && guard++ < 4000) { const x = 20 + Math.random() * 960, y = 20 + Math.random() * 760; const k = (y | 0) * W + (x | 0); let ok = !land[k]; for (let dy = -14; dy <= 14 && ok; dy += 7) for (let dx = -18; dx <= 18 && ok; dx += 9) { const kk = ((y + dy) | 0) * W + ((x + dx) | 0); if (kk >= 0 && kk < N && land[kk]) ok = false; } if (ok && !(x < 230 && y < 90)) wv.push([x | 0, y | 0]); } MAP.waves = wv;
 const cv = document.getElementById('map'); MAP.ctx = cv.getContext('2d'); MAP.img = MAP.ctx.createImageData(W, H);
 MAP.ready = true;
}

const MODES = [['royaumes', 'Royaumes'], ['relations', 'Relations'], ['ferveur', 'Ferveur'], ['heresie', 'Hérésie'], ['investitures', 'Investitures'], ['religions', 'Religions']];
const C_NEU = hexRgb('#ddd2b2'), C_RED = hexRgb('#a8322a'), C_GRN = hexRgb('#4f8a3a'), C_GOLD = hexRgb('#e8c25a'), C_GREY = hexRgb('#a49f8c');
function provColor(p) {
 const o = S.own[p], R = S.realms[o], m = MAP.mode;
 if (m === 'royaumes') return hexRgb(o === 'outremer' && R.relig === 'catholique' ? '#ece6d4' : REALMS[o].c);
 if (m === 'religions') return hexRgb(o === 'etats' ? '#f2d680' : { catholique: '#e3cf92', orthodoxe: '#9a7ab0', musulman: '#6e9a5a', paien: '#8a7458' }[R.relig]);
 if (o === 'etats') return C_GOLD;
 if (m === 'relations') return R.rel < 0 ? lerpC(C_NEU, C_RED, -R.rel / 90) : lerpC(C_NEU, C_GRN, R.rel / 90);
 if (R.relig !== 'catholique') return C_GREY;
 if (m === 'ferveur') return lerpC(hexRgb('#efe6cc'), hexRgb('#29498e'), R.fervor / 100);
 if (m === 'heresie') return lerpC(hexRgb('#e9e0c6'), hexRgb('#c2380f'), Math.pow(R.heresy / 100, 0.7));
 if (m === 'investitures') return lerpC(hexRgb('#6a3a7a'), hexRgb('#e2b53e'), R.invest / 100);
 return C_NEU;
}
function prepRaster() {
 // pré-calcul unique : pixels de terre, niveau de texture, voisins de province, motifs
 const W = MW, N = W * MH, pid = MAP.pid, tex = MAP.tex; const land = [];
 const tq = new Uint8Array(N), kind = new Uint8Array(N), nb1 = new Int16Array(N).fill(-1), nb2 = new Int16Array(N).fill(-1), pat = new Uint8Array(N);
 for (let i = 0; i < N; i++) {
  const p = pid[i]; if (p < 0) continue; land.push(i);
  const px = i % W, py = (i / W) | 0;
  tq[i] = Math.max(0, Math.min(15, Math.round((tex[i] - 0.84) / 0.26 * 15)));
  const rr = px < W - 1 ? pid[i + 1] : p, ll = px > 0 ? pid[i - 1] : p, dd = i + W < N ? pid[i + W] : p, uu = i >= W ? pid[i - W] : p;
  if (rr < 0 || ll < 0 || dd < 0 || uu < 0) { kind[i] = 1; continue; }
  for (const q of [rr, ll, dd, uu]) if (q !== p) { if (nb1[i] < 0) nb1[i] = q; else if (q !== nb1[i]) nb2[i] = q; }
  kind[i] = (rr !== p || dd !== p) ? 3 : 2;
  pat[i] = (((px + py) % 8) < 2 ? 1 : 0) | (((px - py + 800) % 10) < 2 ? 2 : 0);
 }
 MAP.R = { land: Int32Array.from(land), tq, kind, nb1, nb2, pat, sea32: new Uint32Array(MAP.sea.buffer.slice(0)), out32: new Uint32Array(MAP.img.data.buffer) };
}
function renderMapCanvas() {
 if (!MAP.ready || !S) return;
 const pc = PROVS.map(p => provColor(p.id)); const owner = PROVS.map(p => S.own[p.id]);
 const sel = UI.sel;
 const key = MAP.mode + '|' + sel + '|' + owner.join(',') + '|' + pc.map(c => c.map(v => v | 0).join('.')).join(',');
 if (key === MAP.lastKey) return; MAP.lastKey = key;
 if (!MAP.R) prepRaster();
 const R = MAP.R, out = R.out32, hatch = MAP.mode !== 'royaumes' && MAP.mode !== 'religions';
 const P = PROVS.length, oid = owner.map(o => o), lut = new Uint32Array(P * 128);
 for (let p = 0; p < P; p++) {
  const c = pc[p], ow = owner[p], nc = hatch && S.realms[ow].relig !== 'catholique' && ow !== 'etats', et = ow === 'etats', sl = sel && ow === sel;
  for (let l = 0; l < 16; l++) for (let pb = 0; pb < 2; pb++) for (let pt = 0; pt < 4; pt++) {
   let t = (0.84 + l / 15 * 0.26) * (pb ? 0.8 : 1) * ((pt & 1) && nc ? 0.86 : 1) * ((pt & 2) && et ? 1.06 : 1) * (sl ? 1.1 : 1);
   const r = Math.min(255, c[0] * t) | 0, g = Math.min(255, c[1] * t) | 0, b = Math.min(255, c[2] * t) | 0;
   lut[((p * 16 + l) * 2 + pb) * 4 + pt] = (255 << 24 | b << 16 | g << 8 | r) >>> 0;
  }
 }
 out.set(R.sea32);
 const COAST = (255 << 24 | 24 << 16 | 38 << 8 | 52) >>> 0, BORD = (255 << 24 | 18 << 16 | 30 << 8 | 46) >>> 0, GOLD = (255 << 24 | 70 << 16 | 196 << 8 | 240) >>> 0;
 const pid = MAP.pid, land = R.land, kind = R.kind, nb1 = R.nb1, nb2 = R.nb2, tq = R.tq, pat = R.pat;
 const own = new Int16Array(P); const ids = {}; let n = 0; for (let p = 0; p < P; p++) { const o = owner[p]; own[p] = ids[o] != null ? ids[o] : (ids[o] = n++); }
 const selId = sel && ids[sel] != null ? ids[sel] : -1;
 for (let k = 0, L = land.length; k < L; k++) {
  const i = land[k], p = pid[i], kd = kind[i];
  if (kd === 1) { out[i] = COAST; continue; }
  const a = nb1[i];
  if (a >= 0) { const ow = own[p]; if (own[a] !== ow || (nb2[i] >= 0 && own[nb2[i]] !== ow)) { out[i] = ow === selId ? GOLD : BORD; continue; } }
  out[i] = lut[((p * 16 + tq[i]) * 2 + (kd === 3 ? 1 : 0)) * 4 + pat[i]];
 }
 MAP.ctx.putImageData(MAP.img, 0, 0);
 const hc = document.getElementById('hl'); if (hc) { hc.getContext('2d').clearRect(0, 0, MW, MH); MAP.hlP = null; }
}

/* ---------- Calque vectoriel ---------- */
function mapName(r) {
 const sp = { teutons: 'Ordre teutonique', balkans: 'Serbie · Bulgarie', rus: 'Rus’', empire: 'Saint-Empire', outremer: RL('outremer').name.replace(/^Royaume de /, ''), etats: 'Patrimoine de saint Pierre', turcs: RL('turcs').name };
 if (sp[r]) return sp[r];
 return rname(r).replace(/^(Royaumes?|Couronne|République|Commune|Comté|Duchés?|Marche|Sultanat|Califat|Émirat|Grand-duché|Principautés|Seigneurie)\s+(de la |de l’|des |de |d’|du )?/, '');
}
function realmGeo() {
 const g = {};
 PROVS.forEach((p, i) => { const o = S.own[p.id]; const n = MAP.cnt[i] || 1; const [x, y] = MAP.cent[i]; const G = g[o] || (g[o] = { x: 0, y: 0, n: 0 }); G.x += x * n; G.y += y * n; G.n += n; });
 for (const k in g) { g[k].x /= g[k].n; g[k].y /= g[k].n; }
 if (g.empire) { g.empire.x -= 10; }
 return g;
}
function ptLL(lat, lon) { return proj(lat, lon); }
function renderOverlay() {
 if (!S) return;
 const geo = realmGeo(); let s = `<defs>
 <symbol id="i-excom" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="#1d140c" stroke="#e8d9b0" stroke-width="1.5"/><path d="M5 5L15 15" stroke="#d33" stroke-width="2.5"/></symbol>
 <symbol id="i-inter" viewBox="0 0 20 20"><rect x="4" y="9" width="12" height="9" rx="1" fill="#1d140c" stroke="#e8d9b0"/><path d="M6.5 9V6.5A3.5 3.5 0 0 1 13.5 6.5V9" stroke="#1d140c" stroke-width="2.5" fill="none"/></symbol>
 <symbol id="i-fire" viewBox="0 0 24 24"><path d="M12 2C17 8 18 12 15 17C16 13 14 11 12 9C11 13 7 14 9 19C5 15 6 9 12 2Z" fill="#ef7a24" stroke="#5a1a04" stroke-width="1.2"/></symbol>
 <symbol id="i-hat" viewBox="0 0 24 24"><ellipse cx="12" cy="15" rx="10" ry="3.2" fill="#b51d24" stroke="#3a0606"/><path d="M6.5 14.5C6.5 8 17.5 8 17.5 14.5Z" fill="#c4242b" stroke="#3a0606"/></symbol>
 <symbol id="i-key" viewBox="0 0 24 24"><circle cx="7" cy="12" r="4.5" fill="none" stroke="#e2b53e" stroke-width="2.6"/><path d="M11 12H22M18 12V16M21 12V15" stroke="#e2b53e" stroke-width="2.6"/></symbol>
 <symbol id="i-cross" viewBox="0 0 20 20"><rect x="1" y="1" width="18" height="18" rx="3" fill="#f3efe4" stroke="#1d140c"/><path d="M8 3H12V17H8ZM3 7.5H17V11.5H3Z" fill="#b3242b"/></symbol>
 <symbol id="i-anti" viewBox="0 0 24 24"><path d="M12 21C7 21 6.5 15 7 11C7.6 6 10 3 12 2.5C14 3 16.4 6 17 11C17.5 15 17 21 12 21Z" fill="#1d140c" stroke="#e8d9b0"/></symbol>
 <symbol id="i-swords" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#7a1a10" stroke="#f0d9a0" stroke-width="1.2"/><path d="M6 18L18 6M18 18L6 6" stroke="#f3efe4" stroke-width="2.4"/><path d="M8 14L5 17M16 14L19 17" stroke="#e2b53e" stroke-width="2.6"/></symbol>
 <symbol id="i-keys" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#f2d680" stroke="#7a1210" stroke-width="2.5"/><g fill="none" stroke-width="2.6"><g stroke="#b8892d"><circle cx="10.5" cy="29.5" r="4"/><path d="M13.5 26.5L29 11M26 12L29 15M23.5 14.5L26 17"/></g><g stroke="#7a1210"><circle cx="29.5" cy="29.5" r="4"/><path d="M26.5 26.5L11 11M14 12L11 15M16.5 14.5L14 17"/></g></g></symbol>
 <symbol id="i-tower" viewBox="0 0 16 16"><path d="M3 15V6H5V4H7V6H9V4H11V6H13V15Z" fill="#2a1a0c" stroke="#f0e2bf" stroke-width=".8"/></symbol>
 <symbol id="i-jcross" viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" fill="#f3efe4" stroke="#1d140c"/><path d="M8.5 3H11.5V17H8.5ZM3 8.5H17V11.5H3Z" fill="#c9a13a"/></symbol>
 <filter id="lblsh"><feMorphology operator="dilate" radius="1.4" in="SourceAlpha" result="d"/><feFlood flood-color="#f3e8cb" flood-opacity=".75"/><feComposite in2="d" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
 </defs>`;
 // décor
 s += `<g class="decor" opacity=".85"><rect x="12" y="12" width="210" height="66" rx="4" fill="#efe2c0" stroke="#5a3a1a" stroke-width="1.5"/><rect x="17" y="17" width="200" height="56" fill="none" stroke="#b8892d" stroke-width="1"/><text x="117" y="42" text-anchor="middle" font-family="Cinzel Decorative,Cinzel,serif" font-size="17" fill="#5a1a10">Evropa Christiana</text><text x="117" y="62" text-anchor="middle" font-family="EB Garamond,serif" font-style="italic" font-size="12" fill="#3a2410">Anno Domini ${S.year} · ${SEASONS[S.season].toLowerCase()}</text></g>`;
 s += `<g class="decor" transform="translate(44 610)" opacity=".8"><circle r="30" fill="none" stroke="#5a3a1a" stroke-width="1"/><circle r="24" fill="none" stroke="#5a3a1a" stroke-width=".6"/>${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<path d="M0 0L${(a % 90 ? 4 : 6)} -2L0 ${a % 90 ? -18 : -32}L-${a % 90 ? 4 : 6} -2Z" transform="rotate(${a})" fill="${a % 90 ? '#8a6a3a' : (a === 0 ? '#a3171c' : '#3a2410')}"/>`).join('')}<text y="-36" text-anchor="middle" font-family="Cinzel,serif" font-size="9" fill="#3a2410">N</text></g>`;
 s += `<g class="decor" transform="translate(110 405) scale(.9)" opacity=".75"><path d="M-22 6H22L16 14H-16Z" fill="#5a3a1e"/><path d="M0 6V-22" stroke="#3a2410" stroke-width="1.6"/><path d="M0 -20C14 -16 16 0 0 4Z" fill="#efe6cf" stroke="#3a2410"/><path d="M4 -14H8V0H4ZM1 -8H11V-5H1Z" fill="#a3171c"/><path d="M-40 18Q-30 14 -20 18T0 18T20 18T40 18" stroke="#4a6a78" fill="none"/></g>`;
 if (MAP.waves) s += `<g class="waves">${MAP.waves.map(([x, y], i) => `<path d="M${x} ${y}q3 -3 6 0t6 0" style="animation-delay:${(i % 7) * 0.6}s"/>`).join('')}</g><g class="monster" transform="translate(38 300)"><path d="M-20 8C-14 -6 -6 -6 0 6C6 -10 14 -10 20 4C24 0 30 -2 32 4" fill="none" stroke="#3e5a62" stroke-width="2.4"/><circle cx="30" cy="1" r="1.2" fill="#3e5a62"/><path d="M-22 10q-4 -6 -8 -2" stroke="#3e5a62" stroke-width="2" fill="none"/></g>`;
 for (const [lat, lon, t, fs] of SEA_LABELS) { const [x, y] = proj(lat, lon); s += `<text class="sea" x="${x}" y="${y}" font-size="${fs}">${t}</text>`; }
 // guerres
 for (const w of S.wars) { const A = geo[w.a], Bq = geo[w.b]; if (!A || !Bq) continue; const x = (A.x + Bq.x) / 2, y = (A.y + Bq.y) / 2; s += `<g class="war"><line x1="${A.x}" y1="${A.y}" x2="${Bq.x}" y2="${Bq.y}" stroke="#7a1a10" stroke-width="1.5" stroke-dasharray="4 3" opacity=".6"/><use href="#i-swords" x="${x - 9}" y="${y - 9}" width="18" height="18"><title>Guerre : ${rname(w.a)} contre ${rname(w.b)}</title></use></g>`; }
 // croisade
 if (S.crusade) {
  const c = S.crusade; const tgt = MAP.cent[PROVS.findIndex(p => p.id === c.p)];
  const o = c.k === 'iberie' ? ptLL(43.6, 1.44) : c.k === 'baltique' ? ptLL(53.87, 10.69) : c.k === 'heretiques' ? (geo.france ? [geo.france.x, geo.france.y] : ptLL(48.8, 2.3)) : (c.members.includes('venise') ? ptLL(45.44, 12.33) : ptLL(43.3, 5.4));
  const mx = (o[0] + tgt[0]) / 2, my = (o[1] + tgt[1]) / 2 - Math.abs(o[0] - tgt[0]) * 0.25 - 20;
  const fr = c.phase === 'predication' ? 0.04 : c.phase === 'route' ? 0.35 + c.t * 0.15 : 0.72 + Math.min(1, c.progress / 100) * 0.28;
  const q = (t) => [(1 - t) * (1 - t) * o[0] + 2 * (1 - t) * t * mx + t * t * tgt[0], (1 - t) * (1 - t) * o[1] + 2 * (1 - t) * t * my + t * t * tgt[1]];
  const [bx, by] = q(fr);
  s += `<path class="crpath" d="M${o[0]} ${o[1]}Q${mx} ${my} ${tgt[0]} ${tgt[1]}" fill="none" stroke="#b3242b" stroke-width="3" stroke-dasharray="7 5"/><circle cx="${tgt[0]}" cy="${tgt[1]}" r="9" fill="none" stroke="#b3242b" stroke-width="2.5" class="pulse"/><g transform="translate(${bx} ${by})"><path d="M0 0V-26" stroke="#3a2410" stroke-width="2"/><path d="M0 -26H18L14 -20L18 -14H0Z" fill="#f3efe4" stroke="#3a2410"/><path d="M6 -24H9V-16H6ZM3.5 -21.5H11.5V-18.5H3.5Z" fill="#b3242b"/></g>`;
 }
 // villes
 for (const r of realmIds()) { if (r === 'etats' || !active(r)) continue; const cp = capOf(r); if (!cp) continue; const i = PROVS.findIndex(p => p.id === cp); const [x, y] = PROV[cp].xy[0]; s += `<g class="city"><use href="#i-tower" x="${x - 4}" y="${y - 4}" width="8" height="8"/><text x="${x + 6}" y="${y + 3}">${PROV[cp].city}</text></g>`; }
 const [rx, ry] = ptLL(41.9, 12.5); s += `<use href="#i-keys" x="${rx - 11}" y="${ry - 11}" width="22" height="22" class="rome-key"><title>Rome</title></use>`;
 if (S.curia === 'avignon') { const [ax, ay] = ptLL(43.95, 4.8); s += `<use href="#i-keys" x="${ax - 9}" y="${ay - 9}" width="18" height="18"><title>Avignon — siège de la Curie</title></use>`; }
 const [jx, jy] = ptLL(31.78, 35.22); s += `<use href="#i-jcross" x="${jx - 6}" y="${jy - 6}" width="12" height="12"><title>Jérusalem</title></use>`;
 // étiquettes
 for (const r in geo) {
  if (r === 'etats' || !active(r)) continue; const G = geo[r]; const n = G.n; const fs = clamp(Math.sqrt(n) / 13, 7.5, 22); const small = n < 2600;
  const nm = mapName(r).toUpperCase();
  s += `<text class="lbl${small ? ' small' : ''}${UI.sel === r ? ' selL' : ''}" x="${G.x}" y="${G.y}" font-size="${fs}" letter-spacing="${fs * 0.12}">${nm}</text>`;
  const R = RL(r); const ic = [];
  if (R.excom) ic.push(['i-excom', 'Souverain excommunié']); if (R.interdict) ic.push(['i-inter', 'Royaume sous interdit']);
  if (R.heresy >= 30) ic.push(['i-fire', `${R.hname || 'Hérésie'} : ${Math.round(R.heresy)}`]); if (R.legate) ic.push(['i-hat', `Légat : ${cname(card(R.legate))}`]);
  if (R.vassal) ic.push(['i-key', 'Vassal du Saint-Siège']); if (S.crusade && S.crusade.members.includes(r)) ic.push(['i-cross', 'Croisé']);
  if (S.schism && R.obed === 'anti') ic.push(['i-anti', `Obédience de l’antipape ${S.schism.anti}`]);
  const sz = clamp(fs * 0.85, 10, 15);
  ic.forEach(([id, t], k) => { s += `<use href="#${id}" class="mic${small ? ' small' : ''}" x="${G.x - (ic.length * sz) / 2 + k * sz}" y="${G.y + 4}" width="${sz - 1}" height="${sz - 1}"><title>${t}</title></use>`; });
 }
 document.getElementById('ov').innerHTML = s;
}
function renderMap() { renderMapCanvas(); renderOverlay(); renderLegend(); }
function renderLegend() {
 const L = document.getElementById('legend'); if (!L) return;
 const m = MAP.mode; let h = '';
 const grad = (a, b, l, r) => `<div class="lg-grad" style="background:linear-gradient(90deg,${a},${b})"></div><div class="lg-ends"><span>${l}</span><span>${r}</span></div>`;
 if (m === 'royaumes') h = `<div class="lg-t">Les royaumes</div><div class="lg-n">Touchez un royaume pour l’ouvrir.</div>`;
 if (m === 'relations') h = `<div class="lg-t">Relations avec le Saint-Siège</div>` + grad('#a8322a,#ddd2b2', '#4f8a3a', 'Hostile', 'Dévoué');
 if (m === 'ferveur') h = `<div class="lg-t">Ferveur des fidèles</div>` + grad('#efe6cc', '#29498e', 'Tiède', 'Ardente');
 if (m === 'heresie') h = `<div class="lg-t">Hérésie</div>` + grad('#e9e0c6', '#c2380f', 'Aucune', 'Dominante');
 if (m === 'investitures') h = `<div class="lg-t">Qui nomme les évêques ?</div>` + grad('#6a3a7a', '#e2b53e', 'Le roi', 'Le pape');
 if (m === 'religions') h = `<div class="lg-t">Confessions</div><div class="lg-sw">${[['#e3cf92', 'Catholiques'], ['#9a7ab0', 'Orthodoxes'], ['#6e9a5a', 'Musulmans'], ['#8a7458', 'Païens']].map(([c, n]) => `<span><i style="background:${c}"></i>${n}</span>`).join('')}</div>`;
 L.innerHTML = h;
}

/* ---------- Navigation ---------- */
function mapFit() {
 const w = document.getElementById('mapWrap'); const W = w.clientWidth, H = w.clientHeight;
 MAP.fit = Math.min(W / MW, H / MH); return { W, H };
}
function mapReset(focus) {
 const { W, H } = mapFit(); const mobile = W < 700;
 let k = MAP.fit * (mobile ? 1.55 : 1.04);
 let cx = MW / 2, cy = MH / 2; if (mobile) { cx = 430; cy = 400; }
 if (focus) { cx = focus[0]; cy = focus[1]; k = Math.max(k, MAP.fit * 2); }
 MAP.view = { k, x: W / 2 - cx * k, y: H / 2 - cy * k }; applyView();
}
function applyView() {
 const { W, H } = { W: document.getElementById('mapWrap').clientWidth, H: document.getElementById('mapWrap').clientHeight };
 const v = MAP.view; v.k = clamp(v.k, MAP.fit * 0.9, MAP.fit * 7);
 const mw = MW * v.k, mh = MH * v.k;
 v.x = mw < W ? (W - mw) / 2 : clamp(v.x, W - mw, 0); v.y = mh < H ? (H - mh) / 2 : clamp(v.y, H - mh, 0);
 document.getElementById('mapInner').style.transform = `translate(${v.x}px,${v.y}px) scale(${v.k})`;
 document.getElementById('mapWrap').classList.toggle('zoomed', v.k > MAP.fit * 1.7);
}
function focusRealm(r) {
 if (!MAP.ready) return; const G = realmGeo()[r]; if (!G) return; const w = document.getElementById('mapWrap'); const v = MAP.view;
 const k = Math.max(v.k, MAP.fit * 1.6); const inner = document.getElementById('mapInner');
 inner.style.transition = 'transform .6s cubic-bezier(.3,.7,.3,1)'; MAP.view = { k, x: w.clientWidth / 2 - G.x * k, y: w.clientHeight / 2 - G.y * k }; applyView();
 setTimeout(() => inner.style.transition = '', 650);
}
function zoomAt(f, px, py) { const v = MAP.view; const nk = clamp(v.k * f, MAP.fit * 0.9, MAP.fit * 7); const r = nk / v.k; v.x = px - (px - v.x) * r; v.y = py - (py - v.y) * r; v.k = nk; applyView(); }
function mapPick(cx, cy) {
 const w = document.getElementById('mapWrap').getBoundingClientRect(); const v = MAP.view;
 const mx = Math.floor((cx - w.left - v.x) / v.k), my = Math.floor((cy - w.top - v.y) / v.k);
 if (mx < 0 || my < 0 || mx >= MW || my >= MH) return null; const p = MAP.pid[my * MW + mx]; return p >= 0 ? PROVS[p] : null;
}
function initMapInput() {
 const w = document.getElementById('mapWrap'); const pts = new Map(); let moved = 0, last = null, pinch = null;
 w.addEventListener('pointerdown', e => { if (e.target.closest('#mapModes,#zoomBtns,#legend')) return; w.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); moved = 0; last = { x: e.clientX, y: e.clientY }; if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) }; } });
 w.addEventListener('pointermove', e => {
  if (!pts.has(e.pointerId)) { hoverTip(e); return; }
  pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pts.size === 2 && pinch) { const [a, b] = [...pts.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); const r = w.getBoundingClientRect(); zoomAt(d / pinch.d, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top); pinch.d = d; moved += 10; return; }
  const dx = e.clientX - last.x, dy = e.clientY - last.y; moved += Math.abs(dx) + Math.abs(dy); last = { x: e.clientX, y: e.clientY };
  if (moved > 4) { MAP.view.x += dx; MAP.view.y += dy; applyView(); }
 });
 const up = e => { if (!pts.has(e.pointerId)) return; pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (pts.size === 0 && moved < 6 && e.type === 'pointerup') { const p = mapPick(e.clientX, e.clientY); if (p) { selectRealm(S.own[p.id], true); } } if (pts.size === 1) last = [...pts.values()][0]; };
 w.addEventListener('pointerup', up); w.addEventListener('pointercancel', up);
 w.addEventListener('wheel', e => { e.preventDefault(); const r = w.getBoundingClientRect(); zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - r.left, e.clientY - r.top); }, { passive: false });
 w.addEventListener('pointerleave', () => { document.getElementById('tip').hidden = true; hilite(null); });
 window.addEventListener('resize', () => { mapReset(); });
}
function hilite(pi) {
 const c = document.getElementById('hl'); if (!c || !MAP.bord) return; const x = c.getContext('2d');
 if (MAP.hlP === pi) return; x.clearRect(0, 0, MW, MH); MAP.hlP = pi; if (pi == null || pi < 0) return;
 const own = S.own[PROVS[pi].id]; x.fillStyle = 'rgba(255,236,170,.95)';
 for (let q = 0; q < PROVS.length; q++) { if (S.own[PROVS[q].id] !== own) continue; x.fillStyle = q === pi ? 'rgba(255,240,180,1)' : 'rgba(255,230,160,.55)'; const b = MAP.bord[q]; for (let k = 0; k < b.length; k++) { const i = b[k]; x.fillRect(i % MW - 0.5, ((i / MW) | 0) - 0.5, 2, 2); } }
}
function hoverTip(e) {
 const tip = document.getElementById('tip'); if (e.pointerType !== 'mouse') { tip.hidden = true; return; }
 const p = mapPick(e.clientX, e.clientY); hilite(p ? PROVS.indexOf(p) : null); if (!p) { tip.hidden = true; return; }
 const o = S.own[p.id], R = RL(o); const r = document.getElementById('mapWrap').getBoundingClientRect();
 let extra = '';
 if (o === 'etats') extra = `Contrôle pontifical : ${Math.round(S.ctrl[p.id] || 0)} %`;
 else if (MAP.mode === 'relations') extra = `Relation : ${Math.round(R.rel)}`;
 else if (MAP.mode === 'ferveur' && isCath(o)) extra = `Ferveur : ${Math.round(R.fervor)}`;
 else if (MAP.mode === 'heresie' && isCath(o)) extra = `Hérésie : ${Math.round(R.heresy)}${R.hname ? ' (' + R.hname + ')' : ''}`;
 else if (MAP.mode === 'investitures' && isCath(o)) extra = `Investitures : ${Math.round(R.invest)}`;
 else extra = o === 'etats' ? '' : rulerLbl(o);
 tip.innerHTML = `<b>${p.n}</b> — ${p.city}<br><span>${o === 'etats' ? 'États pontificaux' : rname(o)}</span>${extra ? `<br><i>${extra}</i>` : ''}`;
 tip.style.left = (e.clientX - r.left + 14) + 'px'; tip.style.top = (e.clientY - r.top + 10) + 'px'; tip.hidden = false;
}
