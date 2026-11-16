// ===== Couronnes & Lignées · carte en 3D (Three.js r160, perspective cavalière) =====
// Le sol garde exactement les coordonnées de la carte SVG (x vers la droite, y vers le bas) ; la hauteur z
// se dessine vers le haut de l'écran (y_écran = y − K·z). La couche SVG au-dessus reste donc alignée.
const R3 = (() => {
  const K = 0.62;                 // inclinaison de la vue cavalière
  let renderer = null, scene = null, cam = null, canvas = null, built = null, ok = null, quality = 1, raf = 0, lastView = null;
  const groups = {};
  const pref = () => { try { const q = new URLSearchParams(location.search).get('v3d'); if (q != null) return q !== '0'; const v = localStorage.getItem('cl_3d'); return v === '1'; } catch (e) { return true; } };
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
    const wgeo = new THREE.PlaneGeometry(g.W + 1600, g.H + 1600); wgeo.translate(g.W / 2, g.H / 2, 0.35);
    const water = new THREE.Mesh(wgeo, new THREE.MeshStandardMaterial({ color: 0x3f6f86, roughness: 0.22, metalness: 0.1, transparent: true, opacity: 0.86 }));
    water.receiveShadow = true;
    return { mesh, water, height: (x, y) => { const i = Math.round((x - x0) / step), j = Math.round((y - y0) / step); if (i < 0 || j < 0 || i > nx || j > ny) return 0; return Math.max(0.35, H[j * (nx + 1) + i]); } };
  }

  // ---------- forêts ----------
  function buildTrees(S, g, hgt) {
    const pts = [];
    const r = (s => () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; })(S.seed * 31 + 7);
    g.cells.forEach((c, i) => {
      const t = S.regions[i].terrain, n = t === 'forêt' ? (quality >= 2 ? 70 : 45) : t === 'collines' ? 8 : t === 'marais' ? 10 : 12;
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

  // ---------- châteaux (provisoires, phase 1) ----------
  function buildCastles(S, g, hgt) {
    const grp = new THREE.Group();
    const stone = new THREE.MeshStandardMaterial({ color: 0xc9bfa8, roughness: 0.9 }), roofM = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 });
    g.cells.forEach((c, i) => {
      const R = S.regions[i], [x, y] = c.c, z = hgt(x, y), own = R.owner;
      const col = own === 'me' ? A.arms(S.house).robe : own === 'rival' ? '#7a1e12' : A.arms(own).robe;
      const big = own === 'me' && R.cap, s = big ? 1.4 : own === 'me' ? 1.05 : 0.85;
      const keep = new THREE.Mesh(new THREE.BoxGeometry(6 * s, 6 * s, 11 * s), stone); keep.position.set(x, y - 4, z + 5.5 * s); keep.castShadow = true; grp.add(keep);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(4.6 * s, 6 * s, 4), roofM(own === 'me' ? 0x8c3a2c : 0x6b4a3a)); roof.rotation.x = Math.PI / 2; roof.rotation.y = Math.PI / 4; roof.position.set(x, y - 4, z + 14 * s); roof.castShadow = true; grp.add(roof);
      if (big || own === 'me') for (const dx of [-7, 7]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(2 * s, 2.2 * s, 8 * s, 8), stone); t.rotation.x = Math.PI / 2; t.position.set(x + dx * s, y - 1, z + 4 * s); t.castShadow = true; grp.add(t); const tr = new THREE.Mesh(new THREE.ConeGeometry(2.6 * s, 4 * s, 8), roofM(0x8c3a2c)); tr.rotation.x = Math.PI / 2; tr.position.set(x + dx * s, y - 1, z + 10 * s); grp.add(tr); }
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 6, 4), new THREE.MeshStandardMaterial({ color: 0x3b2a18 })); pole.rotation.x = Math.PI / 2; pole.position.set(x, y - 4, z + 18 * s + 3); grp.add(pole);
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(4, 2.4), new THREE.MeshStandardMaterial({ color: col, side: THREE.DoubleSide, roughness: 0.8 })); flag.rotation.x = Math.PI / 2; flag.position.set(x + 2, y - 4, z + 18 * s + 4.6); grp.add(flag);
    });
    return grp;
  }

  function build(S) {
    const g = D.mapGeom(S.seed), dec = MAP2.decor(S.seed, S.regions);
    if (!renderer) {
      canvas = document.createElement('canvas'); canvas.className = 'map3d';
      renderer = new THREE.WebGLRenderer({ canvas, antialias: quality >= 1, alpha: false, powerPreference: 'low-power', preserveDrawingBuffer: true });
      renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.2;
      renderer.shadowMap.enabled = quality >= 2; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      cam = new THREE.Camera(); scene = new THREE.Scene(); scene.background = new THREE.Color(0x3d6a7e);
      groups.root = new THREE.Group(); groups.root.scale.set(1, 1, -1); scene.add(groups.root);
      const hemi = new THREE.HemisphereLight(0xdfe8f0, 0x6a5a40, 0.9); hemi.position.set(0, 0, -1); scene.add(hemi); groups.hemi = hemi;
      const sun = new THREE.DirectionalLight(0xfff1d6, 2.2); sun.position.set(-160, 420, -520); sun.target.position.set(180, 230, 0); scene.add(sun, sun.target); groups.sun = sun;
      sun.castShadow = quality >= 2; sun.shadow.mapSize.set(2048, 2048); const sc = sun.shadow.camera; sc.left = -320; sc.right = 320; sc.top = 320; sc.bottom = -320; sc.near = 10; sc.far = 1400; sun.shadow.bias = -0.0008;
    }
    for (const k of ['terrain', 'water', 'trees', 'castles']) if (groups[k]) { groups.root.remove(groups[k]); groups[k].traverse && groups[k].traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
    const t = buildTerrain(S, g, dec); groups.terrain = t.mesh; groups.water = t.water; groups.root.add(t.mesh, t.water);
    groups.trees = buildTrees(S, g, t.height); groups.root.add(groups.trees);
    groups.castles = buildCastles(S, g, t.height); groups.root.add(groups.castles);
    built = { seed: S.seed, owners: S.regions.map(r => r.owner).join('|'), height: t.height };
  }
  function sync(S) {
    if (!on()) return;
    try {
      if (!built || built.seed !== S.seed) build(S);
      else { const o = S.regions.map(r => r.owner).join('|'); if (o !== built.owners) { groups.root.remove(groups.castles); groups.castles = buildCastles(S, D.mapGeom(S.seed), built.height); groups.root.add(groups.castles); built.owners = o; } }
    } catch (e) { R3.failed = true; console.error('3D', e); }
  }
  function attach(container) {
    if (!on() || !canvas) return false;
    if (canvas.parentNode !== container) container.insertBefore(canvas, container.firstChild);
    return true;
  }
  function render(v) {
    if (!renderer || !on() || !canvas.isConnected) return;
    if (v) lastView = { x: v.x, y: v.y, w: v.w, h: v.h };
    if (!lastView) return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const dpr = Math.min(devicePixelRatio || 1, quality >= 2 ? 2 : 1.5), w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
      renderer.setPixelRatio(dpr); renderer.setSize(w, h, false);
      project(lastView); const t0 = performance.now(); renderer.render(scene, cam); R3.lastMs = performance.now() - t0;
    });
  }
  function setLive(css) { if (canvas) { canvas.style.transformOrigin = '0 0'; canvas.style.transform = css || ''; } }
  return { on, supported, setPref, pref, sync, attach, render, setLive, get canvas() { return canvas; }, set quality(q) { quality = q; }, get quality() { return quality; }, K };
})();
