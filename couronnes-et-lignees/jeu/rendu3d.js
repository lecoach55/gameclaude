// ===== Couronnes & Lignées · carte en 3D (Three.js r160, perspective cavalière) =====
// Le sol garde exactement les coordonnées de la carte SVG (x vers la droite, y vers le bas) ; la hauteur z
// se dessine vers le haut de l'écran (y_écran = y − K·z). La couche SVG au-dessus reste donc alignée.
const R3 = (() => {
  const K = 0.62;                 // inclinaison de la vue cavalière
  let renderer = null, scene = null, cam = null, canvas = null, built = null, ok = null, quality = (() => { try { const m = localStorage.getItem('cl_3dq'); if (m != null) return +m; const mob = /Mobi|Android|iPhone|iPad/.test(navigator.userAgent), weak = (navigator.deviceMemory && navigator.deviceMemory <= 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2); return weak ? 0 : Math.min(innerWidth, innerHeight) >= 700 && !mob ? 2 : 1; } catch (e) { return 1; } })(), raf = 0, lastView = null, pend = null;
  const groups = {};
  const pref = () => { try { const q = new URLSearchParams(location.search).get('v3d'); if (q != null) return q !== '0'; const v = localStorage.getItem('cl_3d'); return v == null ? true : v === '1'; } catch (e) { return true; } };
  function supported() {
    if (ok != null) return ok;
    try { const c = document.createElement('canvas'); ok = !!(window.THREE && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { ok = false; }
    return ok;
  }
  const on = () => supported() && pref() && !R3.failed;
  function setPref(v) { try { localStorage.setItem('cl_3d', v ? '1' : '0'); } catch (e) {} }

  // ---------- bruit et hauteurs ----------
  function hash2(x, y, s) { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 2246822519)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function vnoise(x, y, s) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
  function fbm(x, y, s) { let t = 0, a = 0.5, f = 1; for (let i = 0; i < 4; i++) { t += a * vnoise(x * f, y * f, s + i * 17); a *= 0.5; f *= 2.03; } return t; }
  function inPoly(p, x, y) { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [xi, yi] = p[i], [xj, yj] = p[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }
  function distSeg(px, py, a, b) { const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy || 1; let t = ((px - a[0]) * dx + (py - a[1]) * dy) / l; t = Math.max(0, Math.min(1, t)); return Math.hypot(px - a[0] - t * dx, py - a[1] - t * dy); }
  function coastDist(g, x, y) { let m = 1e9; for (let i = 0; i < g.coast.length; i++) m = Math.min(m, distSeg(x, y, g.coast[i], g.coast[(i + 1) % g.coast.length])); return m; }

  // ---------- projection cavalière ----------
  function project(v) {
    const vx = v.x, vy = v.y, vw = v.w, vh = v.h, D = vh + 600, y0 = vy - 300;
    const m = new THREE.Matrix4();
    m.set(2 / vw, 0, 0, -2 * vx / vw - 1,
      0, -2 / vh, -2 * K / vh, 2 * vy / vh + 1 - 2 * K * 2.2 / vh,
      0, -2 / D, 0.0004, 2 * y0 / D + 1,
      0, 0, 0, 1);
    cam.projectionMatrix.copy(m); cam.projectionMatrixInverse.copy(m).invert();
  }

  function texture(url, rep) {
    const t = new THREE.TextureLoader().load(url, () => R3.render());
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  }

  // ---------- terrain ----------
  function buildTerrain(S, g, dec) {
    const T = { plaine: 0, 'forêt': 1, collines: 2, marais: 3 };
    const cellOf = (x, y) => { for (let i = 0; i < g.cells.length; i++) if (inPoly(g.cells[i].poly, x, y)) return i; return -1; };
    const step = quality >= 2 ? 2.5 : 3.2, x0 = -70, y0 = -70, nx = Math.ceil((g.W + 140) / step), ny = Math.ceil((g.H + 140) / step);
    const pos = new Float32Array((nx + 1) * (ny + 1) * 3), uv = new Float32Array((nx + 1) * (ny + 1) * 2), spl = new Float32Array((nx + 1) * (ny + 1) * 4), col = new Float32Array((nx + 1) * (ny + 1) * 3);
    const rivers = (dec && dec.rivers) || [];
    const H = new Float32Array((nx + 1) * (ny + 1));
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
      const k = j * (nx + 1) + i, x = x0 + i * step, y = y0 + j * step;
      const land = inPoly(g.coast, x, y), cd = coastDist(g, x, y);
      let h, w = [0, 0, 0, 0];
      if (!land) { h = -1.5 - Math.min(10, cd * 0.12); w = [0, 0, 0, 0]; }
      else {
        const ci = cellOf(x, y), t = ci >= 0 ? T[S.regions[ci].terrain] : 0, n = fbm(x * 0.03, y * 0.03, 7);
        const shore = Math.min(1, cd / 14);
        h = 0.6 + shore * (1.6 + n * 3.2);
        if (t === 2) { const c = g.cells[ci].c, dd = Math.hypot(x - c[0], y - c[1]); h += shore * Math.max(0, 1 - dd / 46) * (9 + fbm(x * 0.08, y * 0.08, 3) * 10); }
        if (t === 3) h = Math.min(h, 0.9 + n);
        // rivières : lit creusé
        let rd = 1e9; for (const pts of rivers) for (let q = 0; q + 1 < pts.length; q++) rd = Math.min(rd, distSeg(x, y, pts[q], pts[q + 1]));
        if (rd < 4) h = Math.min(h, 0.15 + rd * 0.12);
        const sand = 1 - Math.min(1, cd / 6), rock = t === 2 ? Math.min(1, Math.max(0, (h - 5) / 6)) : 0, forest = t === 1 ? 0.75 : 0.12 * fbm(x * 0.05, y * 0.05, 11), marsh = t === 3 ? 0.8 : 0;
        w = [1, forest, rock, Math.max(sand, marsh * 0.6)];
        if (marsh) w[3] = 0; spl[k * 4 + 3] = 0;
        if (t === 3) { col[k * 3] = 0.82; col[k * 3 + 1] = 0.9; col[k * 3 + 2] = 0.8; }
      }
      H[k] = h;
      pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = h;
      uv[k * 2] = x / 38; uv[k * 2 + 1] = y / 38;
      const sum = w[0] + w[1] + w[2] + w[3] || 1; spl.set([w[0] / sum, w[1] / sum, w[2] / sum, w[3] / sum], k * 4);
      if (!col[k * 3]) { const gn = fbm(x * 0.02, y * 0.02, 21); col[k * 3] = 0.78 + gn * 0.12; col[k * 3 + 1] = 0.98; col[k * 3 + 2] = 0.66 + gn * 0.1; }
      if (!land) { col[k * 3] = 0.55; col[k * 3 + 1] = 0.6; col[k * 3 + 2] = 0.55; spl.set([0, 0, 0, 1], k * 4); }
    }
    const idx = new Uint32Array(nx * ny * 6); let p = 0;
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx.set([a, b, c, b, d, c], p); p += 6; }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.setAttribute('splat', new THREE.BufferAttribute(spl, 4)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setIndex(new THREE.BufferAttribute(idx, 1)); geo.computeVertexNormals();
    const tx = { herbe: texture(TEX3D.herbe), foret: texture(TEX3D.foret), roche: texture(TEX3D.roche), sable: texture(TEX3D.sable) };
    const mat = new THREE.MeshStandardMaterial({ map: tx.herbe, vertexColors: true, roughness: 0.95, metalness: 0 });
    mat.onBeforeCompile = sh => {
      sh.uniforms.tF = { value: tx.foret }; sh.uniforms.tR = { value: tx.roche }; sh.uniforms.tS = { value: tx.sable };
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 splat; varying vec4 vSplat;').replace('#include <uv_vertex>', '#include <uv_vertex>\nvSplat = splat;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D tF; uniform sampler2D tR; uniform sampler2D tS; varying vec4 vSplat;')
        .replace('#include <map_fragment>', `vec4 cG = texture2D(map, vMapUv); vec4 cF = texture2D(tF, vMapUv * 1.3); vec4 cR = texture2D(tR, vMapUv * 0.8); vec4 cS = texture2D(tS, vMapUv * 1.5);
          vec4 tc = cG * vSplat.x + cF * vSplat.y + cR * vSplat.z + cS * vSplat.w; diffuseColor *= tc;`);
    };
    const mesh = new THREE.Mesh(geo, mat); mesh.receiveShadow = true;
    // mer
    const wgeo = new THREE.PlaneGeometry(g.W + 3000, g.H + 3000, 48, 48); wgeo.translate(g.W / 2, g.H / 2, 0.35);
    const water = new THREE.Mesh(wgeo, new THREE.MeshLambertMaterial({ color: 0x3f6f86, transparent: true, opacity: 0.86 }));
    water.receiveShadow = false;
    return { mesh, water, height: (x, y) => { const i = Math.round((x - x0) / step), j = Math.round((y - y0) / step); if (i < 0 || j < 0 || i > nx || j > ny) return 0; return Math.max(0.35, H[j * (nx + 1) + i]); } };
  }

  // ---------- forêts ----------
  function buildTrees(S, g, hgt) {
    const pts = [];
    const r = (s => () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; })(S.seed * 31 + 7);
    g.cells.forEach((c, i) => {
      const t = S.regions[i].terrain, n = t === 'forêt' ? (quality >= 2 ? 70 : quality === 1 ? 45 : 28) : t === 'collines' ? 8 : t === 'marais' ? 10 : 12;
      const xs = c.poly.map(p => p[0]), ys = c.poly.map(p => p[1]), mnx = Math.min(...xs), mxx = Math.max(...xs), mny = Math.min(...ys), mxy = Math.max(...ys);
      let made = 0, tries = 0;
      while (made < n && tries++ < n * 6) { const x = mnx + r() * (mxx - mnx), y = mny + r() * (mxy - mny); if (!inPoly(c.poly, x, y) || coastDist(g, x, y) < 5) continue; if (Math.hypot(x - c.c[0], y - c.c[1]) < 22) continue; pts.push([x, y, hgt(x, y), 0.7 + r() * 0.6, t === 'forêt' && r() < 0.55 ? 1 : 0]); made++; }
    });
    const grp = new THREE.Group();
    const trunk = new THREE.CylinderGeometry(0.35, 0.5, 2.2, 5); trunk.rotateX(Math.PI / 2); trunk.translate(0, 0, 1.1);
    const leafD = new THREE.IcosahedronGeometry(2.6, 1); leafD.scale(1, 1, 1.15); leafD.translate(0, 0, 3.8);
    const leafP = new THREE.ConeGeometry(2.1, 6, 7); leafP.rotateX(Math.PI / 2); leafP.translate(0, 0, 4.6);
    const mk = (geo, mat, list) => { const m = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length)); const o = new THREE.Object3D(); list.forEach((p, i) => { o.position.set(p[0], p[1], p[2]); o.scale.setScalar(p[3]); o.rotation.z = p[0] * 7.1; o.updateMatrix(); m.setMatrixAt(i, o.matrix); }); m.count = list.length; m.castShadow = true; return m; };
    const dec = pts.filter(p => !p[4]), pin = pts.filter(p => p[4]);
    grp.add(mk(trunk, new THREE.MeshStandardMaterial({ color: 0x5a4430, roughness: 1 }), pts));
    grp.add(mk(leafD, new THREE.MeshStandardMaterial({ color: 0x4d6b34, roughness: 0.9, flatShading: true }), dec));
    grp.add(mk(leafP, new THREE.MeshStandardMaterial({ color: 0x2f4c30, roughness: 0.9, flatShading: true }), pin));
    return grp;
  }

  // ---------- kit de construction réaliste (phase 2) ----------
  let MAT = null;
  function mats() {
    if (MAT) return MAT;
    const tx = (k, r) => { const t = texture(TEX3D[k]); return t; };
    const m = (k, o) => new THREE.MeshStandardMaterial(Object.assign({ map: tx(k), roughness: 0.92, metalness: 0 }, o || {}));
    MAT = { pierre: m('pierre'), taille: m('taille'), sombre: m('pierre', { color: 0x9a8f86 }), tuiles: m('tuiles'), ardoise: m('ardoise'), chaume: m('chaume'), enduit: m('enduit'), planches: m('planches'),
      bois: new THREE.MeshStandardMaterial({ color: 0x5a4430, roughness: 1 }), toile: new THREE.MeshStandardMaterial({ color: 0xe9e1cf, roughness: 0.9, side: THREE.DoubleSide }), fer: new THREE.MeshStandardMaterial({ color: 0x55585c, roughness: 0.5, metalness: 0.6 }),
      or: new THREE.MeshStandardMaterial({ color: 0xc9a24a, roughness: 0.35, metalness: 0.8 }), vitrail: new THREE.MeshStandardMaterial({ color: 0x2c4f8a, roughness: 0.3, emissive: 0x0c1830 }) };
    return MAT;
  }
  const flagMats = {};
  function flagMat(col) { return flagMats[col] || (flagMats[col] = new THREE.MeshStandardMaterial({ color: col, roughness: 0.85, side: THREE.DoubleSide })); }
  // coordonnées de texture « monde » : chaque face prend la projection sur son plan dominant (évite l'étirement)
  function wuv(geo, sc) {
    const p = geo.attributes.position, n = geo.attributes.normal, uv = new Float32Array(p.count * 2);
    for (let i = 0; i < p.count; i++) { const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i)), x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      let u, v; if (az >= ax && az >= ay) { u = x; v = y; } else if (ax >= ay) { u = y; v = z; } else { u = x; v = z; } uv[i * 2] = u / sc; uv[i * 2 + 1] = v / sc; }
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return geo;
  }
  function add(grp, geo, mat, x, y, z, sc) { wuv(geo, sc || 6); const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; grp.add(m); return m; }
  const box = (w, d, h) => { const g = new THREE.BoxGeometry(w, d, h); g.translate(0, 0, h / 2); return g; };
  const cyl = (r, h, seg) => { const g = new THREE.CylinderGeometry(r, r * 1.04, h, seg || 12); g.rotateX(Math.PI / 2); g.translate(0, 0, h / 2); return g; };
  const cone = (r, h, seg) => { const g = new THREE.ConeGeometry(r, h, seg || 12); g.rotateX(Math.PI / 2); g.translate(0, 0, h / 2); return g; };
  function gable(w, d, h) { // toit à deux pans le long de x
    const v = [-w / 2, -d / 2, 0, w / 2, -d / 2, 0, w / 2, 0, h, -w / 2, 0, h, -w / 2, d / 2, 0, w / 2, d / 2, 0];
    const idx = [0, 1, 2, 0, 2, 3, 4, 3, 2, 4, 2, 5, 0, 3, 4, 1, 5, 2];
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.setIndex(idx); const n = g.toNonIndexed(); n.computeVertexNormals(); return n;
  }
  function crenels(grp, M, x, y, z, w, d, sz) { const n = Math.max(2, Math.round(w / (sz * 2))); for (let i = 0; i < n; i++) { const xx = x - w / 2 + (i + 0.5) * w / n; add(grp, box(sz, d + 0.3, sz), M, xx, y, z, 4); } }
  function banner(grp, x, y, z, col, s) { add(grp, cyl(0.12 * s, 5 * s, 5), MAT.bois, x, y, z); const f = new THREE.Mesh(new THREE.PlaneGeometry(3.4 * s, 2 * s), flagMat(col)); f.rotation.x = Math.PI / 2; f.position.set(x + 1.7 * s, y, z + 4.2 * s); f.castShadow = true; grp.add(f); }
  function tower(grp, x, y, z, r, h, roofM, M) { add(grp, cyl(r, h, 12), M || MAT.pierre, x, y, z, 5); add(grp, cone(r * 1.25, r * 1.9, 12), roofM || MAT.ardoise, x, y, z + h, 4); }
  function keep(grp, x, y, z, w, h, roofM, col, M) { add(grp, box(w, w, h), M || MAT.taille, x, y, z, 5); add(grp, cone(w * 0.8, w * 0.95, 4).rotateZ(Math.PI / 4), roofM || MAT.ardoise, x, y, z + h, 4); if (col) banner(grp, x, y, z + h + w * 0.8, col, 0.9); }
  function house(grp, x, y, z, s, roofM, rot) {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.z = rot || 0; grp.add(g);
    add(g, box(4.2 * s, 3.2 * s, 2.6 * s), MAT.enduit, 0, 0, 0, 3); add(g, gable(4.6 * s, 3.8 * s, 1.9 * s), roofM || MAT.chaume, 0, 0, 2.6 * s, 3);
    add(g, box(0.9 * s, 0.1, 1.5 * s), MAT.bois, 0, 1.62 * s, 0, 2);
  }
  function castle(grp, R, x, y, z, col, kind) {
    if (kind === 'cap') {
      const W = 18, wallH = 4.2;
      for (const [dx, dy, w, d] of [[0, -W / 2, W, 1.6], [0, W / 2, W, 1.6], [-W / 2, 0, 1.6, W], [W / 2, 0, 1.6, W]]) { add(grp, box(w, d, wallH), MAT.pierre, x + dx, y + dy, z, 5); if (d < 2) crenels(grp, MAT.pierre, x + dx, y + dy, z + wallH, w, d, 0.9); }
      for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) tower(grp, x + dx * W / 2, y + dy * W / 2, z, 2.3, 7.5, MAT.ardoise);
      add(grp, box(4, 3, 6.5), MAT.taille, x, y + W / 2 + 0.6, z, 4); add(grp, box(1.6, 0.2, 2.6), MAT.bois, x, y + W / 2 + 2.15, z, 2);
      keep(grp, x - 1, y - 1.5, z, 7.5, 13, MAT.ardoise, col);
      add(grp, box(7, 4, 4.5), MAT.enduit, x + 4.5, y + 3.5, z, 4); add(grp, gable(7.4, 4.6, 2.6), MAT.tuiles, x + 4.5, y + 3.5, z + 4.5, 4);
    } else if (kind === 'me') {
      add(grp, box(13, 1.4, 3.4), MAT.pierre, x, y + 4, z, 5); crenels(grp, MAT.pierre, x, y + 4, z + 3.4, 13, 1.4, 0.8);
      tower(grp, x - 6.5, y + 4, z, 1.9, 6, MAT.ardoise); tower(grp, x + 6.5, y + 4, z, 1.9, 6, MAT.ardoise);
      keep(grp, x, y - 0.5, z, 6, 10.5, MAT.ardoise, col);
    } else if (kind === 'rival') {
      add(grp, box(12, 1.4, 3.6), MAT.sombre, x, y + 4, z, 5); crenels(grp, MAT.sombre, x, y + 4, z + 3.6, 12, 1.4, 0.8);
      tower(grp, x - 6, y + 4, z, 2, 7, MAT.tuiles, MAT.sombre); tower(grp, x + 6, y + 4, z, 2, 7, MAT.tuiles, MAT.sombre);
      keep(grp, x, y - 0.5, z, 6.5, 12, MAT.tuiles, col, MAT.sombre);
    } else {
      keep(grp, x, y, z, 5, 9, MAT.tuiles, col, MAT.pierre); add(grp, box(7, 1, 2.4), MAT.pierre, x + 1, y + 4, z, 4);
    }
  }
  function edifice(grp, k, x, y, z, era) {
    switch (k) {
      case 'moulin': { add(grp, cyl(1.9, 6.5, 10), MAT.enduit, x, y, z, 3); add(grp, cone(2.3, 3, 10), MAT.chaume, x, y, z + 6.5, 3);
        const hub = new THREE.Group(); hub.position.set(x, y + 2, z + 6); hub.rotation.y = 0.3; grp.add(hub);
        for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 7), MAT.toile); b.position.set(Math.sin(i * Math.PI / 2) * 3.5, 0, Math.cos(i * Math.PI / 2) * 3.5); b.rotation.y = i * Math.PI / 2; b.castShadow = true; hub.add(b); } break; }
      case 'marche': { for (const [dx, dy] of [[-3.5, -1.8], [3.5, -1.8], [-3.5, 1.8], [3.5, 1.8], [0, -1.8], [0, 1.8]]) add(grp, box(0.5, 0.5, 2.8), MAT.bois, x + dx, y + dy, z, 2);
        add(grp, gable(8.6, 5.2, 2.4), MAT.tuiles, x, y, z + 2.8, 4); for (const dx of [-2.4, 0, 2.4]) add(grp, box(1.6, 1, 0.9), MAT.planches, x + dx, y, z, 2); break; }
      case 'abbaye': { add(grp, box(9, 4, 4.5), MAT.taille, x, y, z, 5); add(grp, gable(9.4, 4.6, 2.8), MAT.ardoise, x, y, z + 4.5, 4); add(grp, box(3, 3, 8.5), MAT.taille, x + 5.2, y, z, 4); add(grp, cone(2.4, 3.6, 4).rotateZ(Math.PI / 4), MAT.ardoise, x + 5.2, y, z + 8.5, 3);
        add(grp, box(4, 3, 3), MAT.enduit, x - 2, y + 3.4, z, 3); add(grp, gable(4.4, 3.4, 1.6), MAT.tuiles, x - 2, y + 3.4, z + 3, 3); break; }
      case 'donjon': keep(grp, x, y, z, 5.5, 13, MAT.ardoise, null, MAT.taille); crenels(grp, MAT.taille, x, y + 2.75, z + 13, 5.5, 0.6, 0.7); break;
      case 'lices': { for (let i = 0; i < 9; i++) add(grp, box(1, 0.3, 1.2), MAT.planches, x - 6 + i * 1.5, y + 2.5, z, 2); for (let i = 0; i < 9; i++) add(grp, box(1, 0.3, 1.2), MAT.planches, x - 6 + i * 1.5, y - 2.5, z, 2);
        add(grp, box(13, 0.3, 0.9), MAT.bois, x, y, z, 2); for (const dx of [-7.5, 7.5]) { add(grp, cone(1.8, 3.2, 8), MAT.toile, x + dx, y, z, 3); banner(grp, x + dx, y, z + 2.6, dx < 0 ? '#c43d2a' : '#2c4f8a', 0.6); } break; }
      case 'universite': { add(grp, box(10, 4, 5), MAT.taille, x, y, z, 4); add(grp, gable(10.4, 4.6, 2.6), MAT.ardoise, x, y, z + 5, 4); tower(grp, x - 5.5, y + 2, z, 1.4, 8, MAT.ardoise, MAT.taille); break; }
      case 'hopital': { add(grp, box(9, 4, 3.8), MAT.enduit, x, y, z, 4); add(grp, gable(9.4, 4.6, 2.4), MAT.tuiles, x, y, z + 3.8, 4);
        const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.15, 2.2), (MAT.croix || (MAT.croix = new THREE.MeshStandardMaterial({ color: 0xb3261e })))); c1.position.set(x, y + 2.1, z + 2.2); grp.add(c1); const c2 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.15, 0.6), c1.material); c2.position.set(x, y + 2.1, z + 2.5); grp.add(c2); break; }
    }
  }
  function cathedral(grp, x, y, z, done) {
    add(grp, box(16, 7, 8), MAT.taille, x, y, z, 5); add(grp, gable(16.4, 7.6, 4.5), MAT.ardoise, x, y, z + 8, 4);
    add(grp, box(5, 12, 7), MAT.taille, x + 2, y, z, 5);
    const roseM = MAT.vitrail; const rose = new THREE.Mesh(new THREE.CircleGeometry(1.5, 20), roseM); rose.rotation.x = Math.PI / 2; rose.position.set(x - 8.05, y, z + 6); rose.rotation.y = -Math.PI / 2; grp.add(rose);
    for (const dy of [-2.4, 2.4]) { add(grp, box(3.6, 3.6, done ? 16 : 9), MAT.taille, x - 9, y + dy, z, 5); if (done) add(grp, cone(2.4, 8, 8), MAT.ardoise, x - 9, y + dy, z + 16, 3); }
    if (!done) { for (const dy of [-4.6, 4.6]) for (const dx of [-11, -7]) add(grp, box(0.3, 0.3, 14), MAT.bois, x + dx, y + dy, z, 1); for (const h of [4, 8, 12]) add(grp, box(5, 9.6, 0.3), MAT.planches, x - 9, y, z + h, 2);
      add(grp, cyl(0.3, 16, 5), MAT.bois, x + 10, y + 5, z); add(grp, box(10, 0.3, 0.3), MAT.bois, x + 6, y + 5, z + 15.5, 1); }
  }
  function buildSettlements(S, g, hgt) {
    mats(); const grp = new THREE.Group(); const era = (() => { try { return D.eraOf(S); } catch (e) { return 0; } })();
    const rng = (k => () => { k = (k * 16807) % 2147483647; return k / 2147483647; })((S.seed % 2147483646) + 1);
    g.cells.forEach((c, i) => {
      const R = S.regions[i], [x, y] = c.c, z = hgt(x, y), own = R.owner;
      const col = own === 'me' ? A.arms(S.house).robe : own === 'rival' ? '#7a1e12' : A.arms(own).robe;
      const kind = own === 'me' ? (R.cap ? 'cap' : 'me') : own === 'rival' ? 'rival' : 'lord';
      { const cg = new THREE.Group(), cz = hgt(x, y - 6); cg.position.set(x, y - 6, cz); cg.scale.setScalar(R.cap ? 1.45 : 1.3); grp.add(cg); castle(cg, R, 0, 0, 0, col, kind); }
      // village : selon la richesse
      const nh = (R.wealth || 1) + (R.cap ? 3 : 0);
      for (let h = 0; h < nh; h++) { const a = (h / nh) * Math.PI * 1.2 + 0.9 + rng() * 0.4, rr = (R.cap ? 19 : 14) + rng() * 5, hx = x + Math.cos(a) * rr, hy = y + 4 + Math.sin(a) * rr * 0.7; house(grp, hx, hy, hgt(hx, hy), 0.9 + rng() * 0.25, h % 3 === 0 ? MAT.tuiles : MAT.chaume, rng() * 0.6 - 0.3); }
      if (own === 'me') {
        const bl = (R.bl || []).slice(-3), spots = R.cap ? [[-21, 13], [-30, -6], [22, 14]] : [[-20, 6], [20, 6], [-14, 14]];
        bl.forEach((k, j) => { const ex = x + spots[j][0], ey = y + spots[j][1], eg = new THREE.Group(); eg.position.set(ex, ey, hgt(ex, ey)); eg.scale.setScalar(1.35); grp.add(eg); edifice(eg, k, 0, 0, 0, era); });
        if (R.cap && (S.cathedral || S.chantier)) { const cg = new THREE.Group(); cg.position.set(x - 34, y - 16, hgt(x - 34, y - 16)); cg.scale.setScalar(1.3); grp.add(cg); cathedral(cg, 0, 0, 0, !!S.cathedral); }
      }
    });
    return grp;
  }
  function setEra(S) {
    const era = (() => { try { return D.eraOf(S); } catch (e) { return 0; } })(); if (!groups.sun) return;
    const L = [[0xfff1d6, 2.3, 0xdfe8f0, 0.95, 0x3d6a7e], [0xffe2a8, 2.5, 0xf0e2c8, 1.0, 0x4a6e7a], [0xd9e2ec, 1.7, 0xb8c2cc, 0.85, 0x34505e]][era];
    groups.sun.color.setHex(L[0]); groups.sun.intensity = L[1]; groups.hemi.color.setHex(L[2]); groups.hemi.intensity = L[3]; scene.background.setHex(L[4]);
  }
  function fail(e) { if (e) console.error('3D', e); R3.failed = true; try { if (canvas && canvas.parentNode) canvas.remove(); if (renderer) renderer.dispose(); } catch (e2) {} setTimeout(() => { try { window.render && window.render(); } catch (e3) {} }, 0); }
  const keyOf = S => S.regions.map(r => r.owner + ':' + (r.bl || []).join(',') + ':' + (r.builds || 0)).join('|') + '|' + (S.cathedral ? 'C' : S.chantier ? 'c' : '') + '|' + (() => { try { return D.eraOf(S); } catch (e) { return 0; } })();
  function build(S) {
    const g = D.mapGeom(S.seed), dec = MAP2.decor(S.seed, S.regions);
    if (!renderer) {
      canvas = document.createElement('canvas'); canvas.className = 'map3d';
      let lostT = 0;
      canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); lostT = setTimeout(() => { fail(); }, 3000); });
      canvas.addEventListener('webglcontextrestored', () => { clearTimeout(lostT); built = null; try { window.render && window.render(); } catch (e) {} });
      renderer = new THREE.WebGLRenderer({ canvas, antialias: quality >= 1, alpha: false, powerPreference: 'low-power', preserveDrawingBuffer: true });
      renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.2;
      renderer.shadowMap.enabled = quality >= 2; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      cam = new THREE.Camera(); scene = new THREE.Scene(); scene.background = new THREE.Color(0x3d6a7e);
      groups.root = new THREE.Group(); groups.root.scale.set(1, 1, -1); scene.add(groups.root);
      const hemi = new THREE.HemisphereLight(0xdfe8f0, 0x6a5a40, 0.9); hemi.position.set(0, 0, -1); scene.add(hemi); groups.hemi = hemi;
      const sun = new THREE.DirectionalLight(0xfff1d6, 2.2); sun.position.set(-160, 420, -520); sun.target.position.set(180, 230, 0); scene.add(sun, sun.target); groups.sun = sun;
      sun.castShadow = quality >= 2; sun.shadow.mapSize.set(1536, 1536); const sc = sun.shadow.camera; sc.left = -520; sc.right = 520; sc.top = 520; sc.bottom = -520; sc.near = 10; sc.far = 1400; sun.shadow.bias = -0.0008;
    }
    for (const k of ['terrain', 'water', 'trees', 'castles']) if (groups[k]) { groups.root.remove(groups[k]); groups[k].traverse && groups[k].traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
    const t = buildTerrain(S, g, dec); groups.terrain = t.mesh; groups.water = t.water; groups.root.add(t.mesh, t.water);
    groups.trees = buildTrees(S, g, t.height); groups.root.add(groups.trees);
    groups.castles = buildSettlements(S, g, t.height); groups.root.add(groups.castles); setEra(S);
    built = { seed: S.seed, owners: keyOf(S), height: t.height };
  }
  function sync(S) {
    if (!on()) return;
    if (!built || built.seed !== S.seed) { // première construction différée : l'interface s'affiche d'abord
      if (pend) { pend = S; return; } pend = S;
      setTimeout(() => { const s2 = pend; pend = null; try { build(s2); const im = document.querySelector('.imm'); if (im) { attach(im); render(lastView); } } catch (e) { fail(e); } }, 40);
      return;
    }
    try {
      if (!built || built.seed !== S.seed) build(S);
      else { const o = keyOf(S); if (o !== built.owners) { groups.root.remove(groups.castles); groups.castles.traverse(m => { if (m.geometry) m.geometry.dispose(); }); groups.castles = buildSettlements(S, D.mapGeom(S.seed), built.height); groups.root.add(groups.castles); built.owners = o; setEra(S); } }
    } catch (e) { fail(e); }
  }
  function attach(container) {
    if (!on() || !canvas) return false;
    if (canvas.parentNode !== container) container.insertBefore(canvas, container.firstChild);
    return true;
  }
  function render(v) {
    if (v) lastView = { x: v.x, y: v.y, w: v.w, h: v.h };
    if (!renderer || !on() || !canvas.isConnected) return;
    if (!lastView) return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const dpr = Math.min(devicePixelRatio || 1, quality >= 2 ? 1.75 : quality === 1 ? 1.5 : 1), w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
      renderer.setPixelRatio(dpr); renderer.setSize(w, h, false);
      project(lastView); const t0 = performance.now(); renderer.render(scene, cam);
      if (probe < 4) { try { renderer.getContext().finish(); } catch (e) {} } // mesure réelle (puce graphique comprise) sur les premières images
      R3.lastMs = performance.now() - t0;
      if (probe < 4) { probe++; if (probe > 1) slow.push(R3.lastMs); if (probe === 4) { slow.sort((a, b) => a - b); if (slow[1] > 55 && quality > 0) downgrade(); } }
    });
  }
  let probe = 0; const slow = [];
  function downgrade() { // trop lent : on baisse d'un cran (ombres, puis résolution) et on s'en souvient
    quality--; try { localStorage.setItem('cl_3dq', String(quality)); } catch (e) {}
    if (quality < 2 && renderer) { renderer.shadowMap.enabled = false; if (groups.sun) groups.sun.castShadow = false; scene.traverse(o => { if (o.material) o.material.needsUpdate = true; }); }
    probe = 0; slow.length = 0; render(lastView);
  }
  function setLive(css) { if (canvas) { canvas.style.transformOrigin = '0 0'; canvas.style.transform = css || ''; } }
  const kit = { mats, flagMat, castle, edifice, cathedral, house, tower, keep, banner, crenels, add, box, cyl, cone, gable, wuv, fbm, texture };
  return { kit, get _groups() { return groups; }, on, supported, setPref, pref, sync, attach, render, setLive, get canvas() { return canvas; }, set quality(q) { quality = q; }, get quality() { return quality; }, K };
})();
