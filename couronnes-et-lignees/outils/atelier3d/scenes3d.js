// Atelier 3D de Couronnes & Lignées : rend hors ligne les scènes d'événements en 3D réaliste.
// S'exécute dans la page du jeu construite (index.html) : réutilise Three.js, les textures (TEX3D)
// et le kit de bâtiments de rendu3d.js (R3.kit). Piloté par rendre.py.
window.ATELIER = (() => {
  const K = R3.kit, T = THREE;
  let M = null, renderer = null, curCam = null;
  const rngOf = s => () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const std = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.9 }, o || {}));

  // ---------- ciel, lumière et âges ----------
  const SKIES = {
    day: ['#5d86a3', '#a9c9d4', '#e6eee6'], dawn: ['#4b4f7a', '#c98a7a', '#f6c890'], dusk: ['#2e2f5a', '#9a5a6a', '#f2a65e'],
    gold: ['#6a5a6a', '#d9a060', '#f8dc94'], night: ['#060a1c', '#101a3c', '#2a3a66'], grey: ['#5f625f', '#9a978e', '#cfcbc0'],
  };
  // âge 0 barons, 1 cathédrales (plus chaud), 2 fléaux (plus froid et brumeux)
  function grade(cols, era) {
    return cols.map(c => { const k = new T.Color(c); if (era === 1) k.lerp(new T.Color('#ffc870'), 0.3); if (era === 2) { const g = (k.r + k.g + k.b) / 3; k.lerp(new T.Color(g * 0.88, g * 0.94, g * 1.04), 0.72); } return k; });
  }
  function skyTex(cols, clouds, seed) {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, '#' + cols[0].getHexString()); g.addColorStop(0.62, '#' + cols[1].getHexString()); g.addColorStop(1, '#' + cols[2].getHexString());
    x.fillStyle = g; x.fillRect(0, 0, 1024, 512);
    if (clouds) { // nuages : amas de taches floues, éclairés par le bas
      const r = rngOf(seed || 3), lit = '#' + cols[2].clone().lerp(new T.Color(1, 1, 1), 0.45).getHexString(), sh = '#' + cols[1].clone().lerp(cols[0], 0.35).getHexString();
      x.filter = 'blur(6px)';
      for (let k = 0; k < clouds; k++) { const cx = r() * 1024, cy = 60 + r() * 260, w = 80 + r() * 220, n = 8 + (r() * 10 | 0);
        for (let i = 0; i < n; i++) { const px = cx + (r() - 0.5) * w, py = cy + (r() - 0.5) * w * 0.12, rr = 14 + r() * 30;
          x.globalAlpha = 0.18 + r() * 0.2; x.fillStyle = sh; x.beginPath(); x.ellipse(px, py + rr * 0.25, rr * 1.6, rr * 0.55, 0, 0, 6.3); x.fill();
          x.globalAlpha = 0.16 + r() * 0.22; x.fillStyle = lit; x.beginPath(); x.ellipse(px, py, rr * 1.4, rr * 0.45, 0, 0, 6.3); x.fill(); } }
      x.globalAlpha = 1; x.filter = 'none';
    }
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
  }
  function setup(sky, era, o) {
    o = o || {};
    const scene = new T.Scene(), cols = grade(SKIES[sky], era);
    scene.background = skyTex(cols, o.clouds != null ? o.clouds : (sky === 'night' ? 0 : sky === 'grey' ? 14 : 9), o.seed || 7);
    const fogc = cols[2].clone().lerp(cols[1], 0.35);
    scene.fog = new T.Fog(fogc, (o.fogNear || 90) * (era === 2 ? 0.5 : 1), (o.fogFar || 420) * (era === 2 ? 0.5 : 1));
    const sunCol = { day: 0xfff1d6, dawn: 0xffc890, dusk: 0xffa060, gold: 0xffd28a, night: 0x8aa0ff, grey: 0xd8dcd8 }[sky];
    const sun = new T.DirectionalLight(sunCol, (o.sunI || (sky === 'night' ? 0.5 : sky === 'grey' ? 1.2 : 2.6)) * (era === 2 ? 0.6 : era === 1 ? 1.1 : 1));
    const az = o.sunAz != null ? o.sunAz : 0.7, el = o.sunEl != null ? o.sunEl : (sky === 'day' ? 0.9 : 0.32);
    sun.position.set(Math.cos(az) * 200 * Math.cos(el), Math.sin(az) * 200 * Math.cos(el) + 120, 200 * Math.sin(el));
    sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); const sc = sun.shadow.camera; sc.left = -90; sc.right = 90; sc.top = 90; sc.bottom = -90; sc.near = 1; sc.far = 600; sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04;
    scene.add(sun, sun.target);
    const hemi = new T.HemisphereLight(cols[1].clone().lerp(new T.Color(1, 1, 1), 0.3), 0x4a4434, sky === 'night' ? 0.4 : sky === 'grey' ? 1.2 : 1.25); hemi.position.set(0, 0, 1); scene.add(hemi);
    const cam = new T.PerspectiveCamera(o.fov || 27, 2.4, 0.5, 2000); cam.up.set(0, 0, 1);
    curCam = cam; return { scene, sun, cam, fogc };
  }

  // ---------- sol et végétation ----------
  function ground(scene, seed, o) {
    o = o || {};
    const S = 900, n = 180, geo = new T.PlaneGeometry(S, S, n, n), p = geo.attributes.position, col = new Float32Array(p.count * 3);
    const tint = new T.Color(o.tint || '#ffffff');
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), d = Math.max(0, y - (o.flat || 40));
      let z = (K.fbm(x * 0.02, y * 0.02, seed) - 0.5) * 3 + Math.pow(d / 100, 1.35) * 13 * K.fbm(x * 0.006, y * 0.006, seed + 9);
      if (o.flatR && Math.hypot(x - (o.fx || 0), y - (o.fy || 0)) < o.flatR) z *= 0.15;
      if (o.hill) { const h = Math.hypot(x - o.hill[0], y - o.hill[1]); z += o.hill[2] * Math.exp(-(h * h) / (o.hill[3] * o.hill[3])); }
      p.setZ(i, z); const v = 0.78 + K.fbm(x * 0.05, y * 0.05, seed + 3) * 0.35;
      col[i * 3] = v * tint.r; col[i * 3 + 1] = v * tint.g; col[i * 3 + 2] = v * tint.b;
    }
    geo.setAttribute('color', new T.BufferAttribute(col, 3)); geo.computeVertexNormals();
    const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 90, uv.getY(i) * 90);
    const tex = K.texture(TEX3D[o.tex || 'herbe']);
    const m = new T.Mesh(geo, new T.MeshStandardMaterial({ map: tex, vertexColors: true, roughness: 1 })); m.receiveShadow = true; scene.add(m);
    const hgt = (x, y) => { // hauteur du sol (même formule)
      const d = Math.max(0, y - (o.flat || 40)); let z = (K.fbm(x * 0.02, y * 0.02, seed) - 0.5) * 3 + Math.pow(d / 100, 1.35) * 13 * K.fbm(x * 0.006, y * 0.006, seed + 9);
      if (o.flatR && Math.hypot(x - (o.fx || 0), y - (o.fy || 0)) < o.flatR) z *= 0.15;
      if (o.hill) { const h = Math.hypot(x - o.hill[0], y - o.hill[1]); z += o.hill[2] * Math.exp(-(h * h) / (o.hill[3] * o.hill[3])); }
      return z;
    };
    return hgt;
  }
  function trees(scene, pts, era) {
    const trunk = new T.CylinderGeometry(0.25, 0.4, 2.4, 6); trunk.rotateX(Math.PI / 2); trunk.translate(0, 0, 1.2);
    const leaf = new T.IcosahedronGeometry(2.2, 2); { const p = leaf.attributes.position, r = rngOf(5); for (let i = 0; i < p.count; i++) { const k = 0.82 + r() * 0.3; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k * 1.15); } leaf.computeVertexNormals(); leaf.translate(0, 0, 4); }
    const pine = new T.ConeGeometry(1.8, 6.5, 8); pine.rotateX(Math.PI / 2); pine.translate(0, 0, 5);
    const leafC = era === 2 ? 0x7a7a4a : era === 1 ? 0x6a8a36 : 0x5a7c38;
    const mk = (g, mat, list) => { if (!list.length) return; const im = new T.InstancedMesh(g, mat, list.length), o = new T.Object3D(); list.forEach((q, i) => { o.position.set(q[0], q[1], q[2]); o.scale.setScalar(q[3]); o.rotation.z = q[0] * 3.1; o.updateMatrix(); im.setMatrixAt(i, o.matrix); }); im.castShadow = true; im.receiveShadow = true; scene.add(im); };
    const tex = K.texture(TEX3D.foret);
    mk(trunk, std(0x4a3524), pts); mk(leaf, new T.MeshStandardMaterial({ color: leafC, map: tex, roughness: 1 }), pts.filter(q => !q[4])); mk(pine, new T.MeshStandardMaterial({ color: 0x4a6a40, map: tex, roughness: 1 }), pts.filter(q => q[4]));
  }
  function scatter(hgt, r, n, box, avoid, pineP) {
    const pts = []; let t = 0;
    while (pts.length < n && t++ < n * 20) { const x = box[0] + r() * (box[2] - box[0]), y = box[1] + r() * (box[3] - box[1]); if (avoid && avoid(x, y)) continue; pts.push([x, y, hgt(x, y) - 0.2, 0.7 + r() * 0.7, r() < (pineP || 0.25)]); }
    return pts;
  }

  // ---------- figures, tentes, bannières ----------
  let BODY = null, ARM = null;
  const FLAGS = []; // drapeaux à teindre (coins projetés)
  function flag(grp, x, y, z, w, h, col, who, rotZ) {
    const g = new T.PlaneGeometry(w, h, 6, 3), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const u = (p.getX(i) + w / 2) / w; p.setZ(i, Math.sin(u * 5 + p.getY(i)) * 0.12 * w * u); }
    g.computeVertexNormals(); g.rotateX(Math.PI / 2); g.translate(w / 2, 0, -h / 2);
    const m = new T.Mesh(g, who ? new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, side: T.DoubleSide }) : K.flagMat(col)); m.position.set(x, y, z); m.rotation.z = rotZ || 0; m.castShadow = true; grp.add(m);
    if (who) FLAGS.push({ m, w, h, who });
    return m;
  }
  function pole(grp, x, y, z, h, col, who, s, rotZ) { K.add(grp, K.cyl(0.08 * s, h, 6), M.bois, x, y, z, 2); flag(grp, x, y, z + h - 0.1 * s, 2.6 * s, 1.5 * s, col, who, rotZ); }
  function person(grp, x, y, z, col, s, r, o) {
    o = o || {}; s = s || 1; const g = new T.Group(); g.position.set(x, y, z); g.rotation.z = r ? r() * 6.28 : 0; g.scale.setScalar(s); grp.add(g);
    if (!BODY) { BODY = new T.LatheGeometry([[0, 0], [0.44, 0], [0.38, 0.35], [0.3, 0.8], [0.26, 1.1], [0.3, 1.2], [0.24, 1.3], [0.1, 1.34], [0, 1.34]].map(([r, y]) => new T.Vector2(r, y)), 12); BODY.rotateX(Math.PI / 2); BODY.computeVertexNormals();
      ARM = new T.CapsuleGeometry(0.075, 0.5, 3, 6); }
    const b = new T.Mesh(BODY, std(col)); b.castShadow = true; g.add(b);
    for (const sd of [-1, 1]) { const a = new T.Mesh(ARM, std(col)); a.position.set(0.05, sd * 0.3, 0.98); a.rotation.x = sd * 0.25; a.rotation.y = 0.35; a.castShadow = true; g.add(a); }
    const head = new T.Mesh(new T.SphereGeometry(0.19, 10, 8), std(o.skin || 0xd8a888, { roughness: 0.7 })); head.position.z = 1.45; head.castShadow = true; g.add(head);
    if (o.hood) { const h = new T.Mesh(new T.ConeGeometry(0.25, 0.55, 8), std(col)); h.rotation.x = Math.PI / 2; h.position.z = 1.62; g.add(h); } else if (!o.helm && !o.crown && (x * 7 | 0) % 3 === 0) { const h = new T.Mesh(new T.CylinderGeometry(0.34, 0.34, 0.04, 10), std(0x5a4430)); h.rotation.x = Math.PI / 2; h.position.z = 1.58; g.add(h); }
    if (o.helm) { const h = new T.Mesh(new T.SphereGeometry(0.22, 10, 6, 0, 6.3, 0, 1.7), M.fer); h.position.z = 1.5; g.add(h); }
    if (o.spear) { const sp = new T.Mesh(new T.CylinderGeometry(0.025, 0.025, 3.2, 4), M.bois); sp.rotation.x = Math.PI / 2; sp.position.set(0.32, 0, 1.4); g.add(sp); }
    if (o.crown) { const c = new T.Mesh(new T.CylinderGeometry(0.17, 0.16, 0.12, 10, 1, true), M.or); c.rotation.x = Math.PI / 2; c.position.z = 1.6; g.add(c); }
    return g;
  }
  function horse(grp, x, y, z, col, s, rot, rider, lance) {
    const g = new T.Group(); g.position.set(x, y, z); g.rotation.z = rot || 0; g.scale.setScalar(s || 1); grp.add(g);
    const mat = std(col), cap = std(rider || 0x2c4f8a);
    const body = new T.Mesh(new T.CapsuleGeometry(0.42, 1.3, 4, 10), mat); body.rotation.z = Math.PI / 2; body.position.z = 1.35; g.add(body);
    const neck = new T.Mesh(new T.CapsuleGeometry(0.22, 0.7, 4, 8), mat); neck.position.set(0.95, 0, 1.85); neck.rotation.y = -0.7; g.add(neck);
    const hd = new T.Mesh(new T.CapsuleGeometry(0.17, 0.45, 4, 8), mat); hd.position.set(1.3, 0, 2.05); hd.rotation.y = 1.2; g.add(hd);
    for (const [dx, dy] of [[0.6, 0.22], [0.6, -0.22], [-0.6, 0.22], [-0.6, -0.22]]) { const l = new T.Mesh(new T.CylinderGeometry(0.08, 0.07, 1.15, 6), mat); l.rotation.x = Math.PI / 2; l.position.set(dx, dy, 0.58); g.add(l); }
    const capa = new T.Mesh(new T.CylinderGeometry(0.62, 0.7, 1.9, 12, 1, true, 0, Math.PI), cap); capa.rotation.z = Math.PI / 2; capa.position.z = 1.15; capa.material.side = T.DoubleSide; g.add(capa);
    const kn = person(g, -0.1, 0, 1.55, rider || 0x2c4f8a, 0.9, null, { helm: true }); kn.rotation.z = 0;
    if (lance) { const l = new T.Mesh(new T.CylinderGeometry(0.04, 0.07, 4.5, 6), std(0xe8dcc0)); l.rotation.z = Math.PI / 2; l.rotation.y = 0.12; l.position.set(1.6, 0.35, 2.55); g.add(l); }
    g.traverse(m => { if (m.isMesh) m.castShadow = true; });
    return g;
  }
  function tent(grp, x, y, z, s, col, stripe) {
    const g = new T.Group(); g.position.set(x, y, z); g.scale.setScalar(s); grp.add(g);
    const wall = new T.Mesh(new T.CylinderGeometry(1.6, 1.6, 1.5, 16, 1, true), M.toile); wall.rotation.x = Math.PI / 2; wall.position.z = 0.75; g.add(wall);
    const roof = new T.Mesh(new T.ConeGeometry(1.9, 1.6, 16), stripe ? std(stripe) : M.toile); roof.rotation.x = Math.PI / 2; roof.position.z = 2.3; g.add(roof);
    g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    return g;
  }
  function stall(grp, x, y, z, col, r) {
    const g = new T.Group(); g.position.set(x, y, z); g.rotation.z = (r() - 0.5) * 0.6; grp.add(g);
    for (const [dx, dy] of [[-1.2, -0.8], [1.2, -0.8], [-1.2, 0.8], [1.2, 0.8]]) K.add(g, K.box(0.12, 0.12, 2), M.bois, dx, dy, 0, 2);
    K.add(g, K.box(2.6, 1.2, 0.9), M.planches, 0, 0.2, 0, 2);
    const roof = new T.Mesh(K.gable(3, 2.2, 0.7), std(col, { side: T.DoubleSide })); roof.position.z = 2; roof.castShadow = true; g.add(roof);
    for (let i = 0; i < 5; i++) { const b = new T.Mesh(new T.SphereGeometry(0.16, 6, 5), std([0xc0392b, 0xe0a030, 0x6a8a30, 0x8a5a2a][i % 4])); b.position.set(-0.9 + i * 0.45, 0.2, 0.98); g.add(b); }
    return g;
  }
  function ship(grp, x, y, z, s, sail, col, who, rot) {
    const g = new T.Group(); g.position.set(x, y, z); g.scale.setScalar(s); g.rotation.z = rot || 0; grp.add(g);
    const hull = new T.BoxGeometry(7, 2.2, 1.6, 8, 2, 2), p = hull.attributes.position;
    for (let i = 0; i < p.count; i++) { const X = p.getX(i), Z = p.getZ(i), t = Math.abs(X) / 3.5; p.setY(i, p.getY(i) * (1 - Math.pow(t, 3) * 0.85) * (Z < 0 ? 0.7 : 1)); p.setZ(i, Z + Math.pow(t, 2) * 0.7); }
    hull.computeVertexNormals(); K.wuv(hull, 3); const h = new T.Mesh(hull, M.planches); h.position.z = 0.4; h.castShadow = true; g.add(h);
    K.add(g, K.cyl(0.12, 8, 6), M.bois, 0.3, 0, 0.6, 2);
    const sg = new T.PlaneGeometry(4.2, 3.6, 8, 6), sp = sg.attributes.position; for (let i = 0; i < sp.count; i++) sp.setZ(i, 0.5 * Math.cos(sp.getX(i) / 2.1 * 1.5));
    sg.computeVertexNormals(); sg.rotateX(Math.PI / 2); sg.rotateZ(Math.PI / 2);
    const sl = new T.Mesh(sg, std(sail || 0xefe6cf, { side: T.DoubleSide })); sl.position.set(0.5, 0, 5.4); sl.castShadow = true; g.add(sl);
    pole(g, 0.3, 0, 8.4, 0.1, col, who, 0.7);
    return g;
  }
  function sea(scene, era, o) {
    o = o || {};
    const geo = new T.PlaneGeometry(1400, 1400, 220, 220), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, Math.sin(x * 0.35 + y * 0.12) * 0.12 + Math.sin(x * 0.11 - y * 0.27) * 0.18 + (K.fbm(x * 0.15, y * 0.15, 4) - 0.5) * 0.35); }
    geo.computeVertexNormals();
    const m = new T.Mesh(geo, new T.MeshStandardMaterial({ color: era === 2 ? 0x3a5258 : 0x2f5e74, roughness: 0.18, metalness: 0.15 })); m.position.z = o.z || 0; m.receiveShadow = true; scene.add(m); return m;
  }
  let puffTex = null;
  function smoke(grp, x, y, z, h, op) { // fumée : voiles flous superposés
    if (!puffTex) { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(235,230,222,1)'); gr.addColorStop(0.5, 'rgba(225,220,212,.45)'); gr.addColorStop(1, 'rgba(220,215,205,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); puffTex = new T.CanvasTexture(c); }
    const mat = new T.SpriteMaterial({ map: puffTex, transparent: true, opacity: (op || 0.35) * 0.8, depthWrite: false });
    for (let i = 0; i < 9; i++) { const sp = new T.Sprite(mat); const k = i / 8; sp.position.set(x + Math.sin(i * 1.3) * 0.6 * i + k * k * 4, y, z + k * h); sp.scale.setScalar(1.5 + k * h * 0.55); grp.add(sp); }
  }
  function fields(scene, hgt, r, box, era) {
    const cols = era === 2 ? [0x8a8466, 0x7a7a60] : [0xc8a850, 0x8faa52, 0xb89a48, 0x7f9a4a];
    for (let i = 0; i < 9; i++) {
      const w = 14 + r() * 16, d = 8 + r() * 10, x = box[0] + r() * (box[2] - box[0]), y = box[1] + r() * (box[3] - box[1]);
      const g = new T.PlaneGeometry(w, d, 8, 6), p = g.attributes.position; for (let j = 0; j < p.count; j++) p.setZ(j, hgt(x + p.getX(j), y + p.getY(j)) + 0.08);
      g.computeVertexNormals(); const m = new T.Mesh(g, new T.MeshStandardMaterial({ color: cols[i % cols.length], map: K.texture(TEX3D.sable), roughness: 1, polygonOffset: true, polygonOffsetFactor: -2 })); m.position.set(x, y, 0); m.rotation.z = (r() - 0.5) * 0.3; m.receiveShadow = true; scene.add(m);
    }
  }

  // ---------- les scènes ----------
  // chaque scène : construit et place la caméra ; me = couleur de votre maison (rendue en blanc puis teinte), foe = adversaire
  const SC = {
    chateau(E) { const { scene, cam } = setup('dusk', E.era, { sunAz: 2.6, sunEl: 0.18 }); const r = rngOf(11); const hgt = ground(scene, 3, { hill: [6, 40, 9, 22] });
      const g = new T.Group(); g.position.set(6, 40, hgt(6, 40) - 1.6); g.scale.setScalar(1.6); scene.add(g); K.castle(g, null, 0, 0, 0, '#c9a24a', 'cap');
      pole(scene, 6 - 1.6, 40 - 2.4, hgt(6, 40) + 1.6 * 13 + 1.6 * 4, 3.5, null, 'me', 2.2);
      trees(scene, scatter(hgt, r, 90, [-90, -10, 100, 140], (x, y) => Math.hypot(x - 6, y - 40) < 26 || Math.abs(x - 2 + (y - 10) * 0.2) < 3), E.era);
      cam.position.set(-20, -66, 10); cam.lookAt(4, 40, 17); return scene; },
    titre(E) { const { scene, cam } = setup('dusk', E.era, { sunAz: 2.6, sunEl: 0.16 }); const r = rngOf(12); const hgt = ground(scene, 3, { hill: [0, 46, 11, 24] });
      const g = new T.Group(); g.position.set(0, 46, hgt(0, 46) - 2.2); g.scale.setScalar(1.7); scene.add(g); K.castle(g, null, 0, 0, 0, '#c9a24a', 'cap');
      pole(scene, -1.7, 46 - 2.55, hgt(0, 46) + 1.7 * 19, 6, null, 'me', 2.4);
      trees(scene, scatter(hgt, r, 120, [-80, -10, 80, 150], (x, y) => Math.hypot(x, y - 46) < 27), E.era);
      cam.aspect = 1; cam.fov = 46; cam.position.set(-8, -30, 8); cam.lookAt(0, 46, 20); return scene; },
    eglise(E) { const { scene, cam } = setup('dawn', E.era, { sunAz: -0.4, sunEl: 0.2 }); const r = rngOf(13); const hgt = ground(scene, 5, { flatR: 40, fx: 0, fy: 40 });
      const g = new T.Group(); g.position.set(2, 42, hgt(2, 42)); g.scale.setScalar(1.25); g.rotation.z = 0.25; scene.add(g); K.cathedral(g, 0, 0, 0, true);
      for (let i = 0; i < 9; i++) { const x = -30 + i * 7 + r() * 3, y = 22 + r() * 10; K.house(scene, x, y, hgt(x, y), 1.1, i % 2 ? M.tuiles : M.chaume, r() - 0.5); }
      for (let i = 0; i < 14; i++) person(scene, -8 + r() * 18, 12 + r() * 8, hgt(0, 15), [0x6a4a2a, 0x3a4a6a, 0x7a2a1a, 0x5a5a3a][i % 4], 1, r, { hood: i % 3 === 0 });
      trees(scene, scatter(hgt, r, 70, [-90, 0, 90, 140], (x, y) => Math.hypot(x - 2, y - 42) < 22 || (y < 34 && Math.abs(x) < 34)), E.era);
      cam.position.set(-6, -16, 5); cam.lookAt(2, 40, 13); return scene; },
    village(E, grey) { const { scene, cam } = setup(grey ? 'grey' : 'day', grey ? 2 : E.era, grey ? { fogNear: 20, fogFar: 160, sunEl: 0.5 } : { sunAz: 0.4, sunEl: 0.55 }); const r = rngOf(14); const hgt = ground(scene, 7, { tint: grey ? '#b8b4a4' : '#ffffff' });
      fields(scene, hgt, r, [-70, 30, 70, 90], grey ? 2 : E.era);
      const hs = [[-10, 14], [-3, 18], [5, 13], [12, 19], [-16, 22], [20, 14], [0, 26], [9, 27]];
      hs.forEach(([x, y], i) => K.house(scene, x, y, hgt(x, y), 1.25 + r() * 0.2, i % 3 === 0 ? M.tuiles : M.chaume, (r() - 0.5) * 0.8));
      { const g = new T.Group(); g.position.set(-2, 40, hgt(-2, 40)); g.scale.setScalar(0.8); scene.add(g); K.edifice(g, 'abbaye', 0, 0, 0, 0); }
      if (!grey) { smoke(scene, -3, 18, hgt(-3, 18) + 4, 7); for (let i = 0; i < 12; i++) person(scene, -12 + r() * 30, 4 + r() * 8, hgt(0, 6), [0x6a4a2a, 0x3a4a6a, 0x7a2a1a, 0x5a5a3a, 0x8a7a50][i % 5], 1, r, { hood: i % 4 === 0 }); }
      else { for (let i = 0; i < 4; i++) person(scene, -6 + r() * 14, 6 + r() * 6, hgt(0, 8), 0x2a2622, 1, r, { hood: true }); smoke(scene, 12, 19, hgt(12, 19) + 3, 9, 0.5); }
      trees(scene, scatter(hgt, r, 80, [-100, 0, 100, 150], (x, y) => y < 34 && Math.abs(x) < 30), grey ? 2 : E.era);
      cam.position.set(-4, -20, 6); cam.lookAt(2, 26, 3); return scene; },
    peste(E) { return SC.village(E, true); },
    bataille(E) { const { scene, cam } = setup('gold', E.era, { sunAz: 1.6, sunEl: 0.16, fogNear: 40, fogFar: 260 }); const r = rngOf(15); const hgt = ground(scene, 9, { tex: 'herbe', tint: '#e8d8a8' });
      for (let i = 0; i < 4; i++) { tent(scene, -36 + i * 5, 34 + (i % 2) * 4, hgt(-36, 34), 1.3, 0, null); tent(scene, 22 + i * 5, 36 + (i % 2) * 4, hgt(22, 36), 1.3, 0, 0x8a2a1a); }
      pole(scene, -12, 26, hgt(-12, 26), 7, null, 'me', 1.4); pole(scene, 12, 26, hgt(12, 26), 7, null, 'foe', 1.4, Math.PI);
      for (let i = 0; i < 26; i++) { const x = -26 + (i % 13) * 1.4, y = 18 + Math.floor(i / 13) * 1.6; person(scene, x, y, hgt(x, y), 0x3a3a44, 1, null, { helm: true, spear: true }); }
      for (let i = 0; i < 26; i++) { const x = 10 + (i % 13) * 1.4, y = 19 + Math.floor(i / 13) * 1.6; person(scene, x, y, hgt(x, y), 0x5a2a20, 1, null, { helm: true, spear: true }).rotation.z = Math.PI; }
      horse(scene, -8, 14, hgt(-8, 14), 0x4a3426, 1.3, 0.1, 0x2c4f8a, true); horse(scene, 6, 15, hgt(6, 15), 0x2a2420, 1.3, Math.PI - 0.1, 0x7a1e12, true);
      smoke(scene, 0, 30, hgt(0, 30), 10, 0.25); smoke(scene, -40, 50, hgt(-40, 50), 14, 0.3);
      trees(scene, scatter(hgt, r, 50, [-120, 50, 120, 160], (x, y) => Math.abs(x) < 30 && y < 160), E.era);
      cam.position.set(-1, -10, 5); cam.lookAt(0, 26, 3); return scene; },
    tournoi(E) { const { scene, cam } = setup('day', E.era, { sunAz: 0.3, sunEl: 0.6 }); const r = rngOf(16); const hgt = ground(scene, 11, { flatR: 50, fx: 0, fy: 20 });
      for (let i = 0; i < 30; i++) K.add(scene, K.box(1.3, 0.2, 1.1), M.planches, -22 + i * 1.5, 16, hgt(0, 16), 2);
      K.add(scene, K.box(40, 0.25, 0.9), M.bois, 0, 22, hgt(0, 22), 2);
      // tribune
      const tb = new T.Group(); tb.position.set(0, 34, hgt(0, 34)); scene.add(tb); K.add(tb, K.box(18, 4, 2.5), M.planches, 0, 0, 0, 3); K.add(tb, K.box(18, 0.3, 4.5), M.planches, 0, 2, 2.5, 3);
      const can = new T.Mesh(K.gable(19, 5, 1.6), std(0x2c4f8a, { side: T.DoubleSide })); can.position.set(0, 0.5, 7); can.castShadow = true; tb.add(can);
      for (let i = 0; i < 16; i++) person(tb, -8 + i * 1.05, 0.3, 2.5, [0x8a2a1a, 0x2c4f8a, 0xc9a24a, 0x3a5a2a][i % 4], 0.95, null, {});
      for (const x of [-7, 0, 7]) pole(tb, x, -2.2, 2.5, 6, null, 'me', 1.1);
      tent(scene, -28, 28, hgt(-28, 28), 1.6, 0, 0x2c4f8a); tent(scene, 28, 28, hgt(28, 28), 1.6, 0, 0x8a2a1a); pole(scene, 13, 27, hgt(13, 27), 6, null, 'foe', 1);
      horse(scene, -6, 20, hgt(-6, 20), 0xe8e0d0, 1.35, 0, 0xffffff, true); horse(scene, 7, 23.5, hgt(7, 23.5), 0x2a2420, 1.35, Math.PI, 0x7a1e12, true);
      for (let i = 0; i < 18; i++) person(scene, -24 + r() * 48, 9 + r() * 4, hgt(0, 11), [0x6a4a2a, 0x3a4a6a, 0x7a2a1a, 0x5a5a3a][i % 4], 1, r, { hood: i % 4 === 0 });
      trees(scene, scatter(hgt, r, 60, [-110, 40, 110, 160]), E.era);
      cam.position.set(0, -6, 5.5); cam.lookAt(0, 26, 4); return scene; },
    chantier(E) { const { scene, cam } = setup('dawn', E.era, { sunAz: -0.5, sunEl: 0.25 }); const r = rngOf(17); const hgt = ground(scene, 13, { flatR: 40, fx: 0, fy: 40, tint: '#e0d4b8' });
      const g = new T.Group(); g.position.set(0, 42, hgt(0, 42)); g.scale.setScalar(1.3); g.rotation.z = -0.2; scene.add(g); K.cathedral(g, 0, 0, 0, false);
      for (let i = 0; i < 10; i++) K.add(scene, K.box(1.4, 0.9, 0.7), M.taille, -14 + r() * 12, 22 + r() * 6, hgt(-8, 24), 2);
      for (let i = 0; i < 14; i++) person(scene, -16 + r() * 30, 18 + r() * 10, hgt(0, 22), [0x6a5a40, 0x5a4a3a, 0x7a6a50][i % 3], 1, r, { hood: i % 2 === 0 });
      smoke(scene, 16, 26, hgt(16, 26), 6, 0.3);
      trees(scene, scatter(hgt, r, 60, [-100, 0, 100, 150], (x, y) => Math.hypot(x, y - 40) < 30 || (y < 30 && Math.abs(x) < 25)), E.era);
      cam.position.set(-8, -12, 4); cam.lookAt(0, 40, 13); return scene; },
    foire(E) { const { scene, cam } = setup('day', E.era, { sunAz: 0.9, sunEl: 0.5 }); const r = rngOf(18); const hgt = ground(scene, 15, { flatR: 45, fx: 0, fy: 20, tex: 'sable', tint: '#d8c8a0' });
      const cols = [0xb03a2a, 0x2c4f8a, 0xc9a24a, 0x3a6a3a, 0xe8dcc0, 0x7a3a6a];
      for (let i = 0; i < 12; i++) { const x = -22 + (i % 6) * 8 + r() * 2, y = 14 + Math.floor(i / 6) * 10 + r() * 2; stall(scene, x, y, hgt(x, y), cols[i % cols.length], r); }
      { const g = new T.Group(); g.position.set(0, 40, hgt(0, 40)); g.scale.setScalar(1.6); scene.add(g); K.edifice(g, 'marche', 0, 0, 0, 0); }
      [[-24, 44], [-14, 48], [16, 46], [26, 42], [8, 52]].forEach(([x, y], i) => K.house(scene, x, y, hgt(x, y), 1.5, i % 2 ? M.tuiles : M.chaume, r() - 0.5));
      for (let i = 0; i < 40; i++) person(scene, -26 + r() * 52, 6 + r() * 28, hgt(0, 18), [0x6a4a2a, 0x3a4a6a, 0x7a2a1a, 0x5a5a3a, 0x8a7a50, 0x2a5a5a][i % 6], 1, r, { hood: i % 5 === 0 });
      for (const x of [-14, 11]) pole(scene, x, 24, hgt(x, 24), 7, null, 'me', 1.2);
      trees(scene, scatter(hgt, r, 50, [-110, 55, 110, 160]), E.era);
      cam.position.set(-3, -10, 7); cam.lookAt(0, 26, 2); return scene; },
    noces(E) { const { scene, cam } = setup('gold', E.era, { sunAz: 2.2, sunEl: 0.22 }); const r = rngOf(19); const hgt = ground(scene, 17, { flatR: 40, fx: 0, fy: 30 });
      const g = new T.Group(); g.position.set(0, 34, hgt(0, 34)); g.scale.setScalar(1.6); g.rotation.z = Math.PI / 2; scene.add(g); K.edifice(g, 'abbaye', 0, 0, 0, 0);
      person(scene, -0.7, 20, hgt(0, 20), 0xf2ece0, 1.05, null, { crown: true }).rotation.z = 0; person(scene, 0.7, 20, hgt(0, 20), 0x2c4f8a, 1.1, null, { crown: true });
      for (let i = 0; i < 26; i++) { const sd = i % 2 ? 1 : -1, x = sd * (2.5 + r() * 7), y = 12 + r() * 10; person(scene, x, y, hgt(x, y), [0x8a2a1a, 0x2c4f8a, 0xc9a24a, 0x3a5a2a, 0x7a3a6a][i % 5], 1, r, {}); }
      const pet = new T.InstancedMesh(new T.PlaneGeometry(0.2, 0.2), std(0xf0e0e8, { side: T.DoubleSide }), 220), o = new T.Object3D();
      for (let i = 0; i < 220; i++) { o.position.set((r() - 0.5) * 10, 13 + r() * 9, hgt(0, 16) + 0.5 + r() * 4); o.rotation.set(r() * 6, r() * 6, r() * 6); o.updateMatrix(); pet.setMatrixAt(i, o.matrix); } scene.add(pet);
      pole(scene, -5, 26, hgt(-5, 26), 7, null, 'me', 1.3); pole(scene, 5, 26, hgt(5, 26), 7, null, 'foe', 1.3, Math.PI);
      trees(scene, scatter(hgt, r, 60, [-100, 10, 100, 150], (x, y) => Math.hypot(x, y - 32) < 20 || (y < 30 && Math.abs(x) < 16)), E.era);
      cam.position.set(0, -2, 4); cam.lookAt(0, 26, 4.5); return scene; },
    siege(E) { const { scene, cam } = setup('dusk', E.era, { sunAz: 2.8, sunEl: 0.12, fogNear: 40, fogFar: 300 }); const r = rngOf(20); const hgt = ground(scene, 19, { hill: [0, 50, 6, 20], tint: '#d0c4a8' });
      const g = new T.Group(); g.position.set(0, 50, hgt(0, 50)); g.scale.setScalar(1.5); scene.add(g); K.castle(g, null, 0, 0, 0, '#7a1e12', 'rival');
      // tour de siège et trébuchet
      const st = new T.Group(); st.position.set(-12, 34, hgt(-12, 34)); scene.add(st); K.add(st, K.box(3.2, 3.2, 11), M.planches, 0, 0, 0, 3); K.add(st, K.box(3.6, 3.6, 0.4), M.bois, 0, 0, 11, 2);
      const tb = new T.Group(); tb.position.set(14, 26, hgt(14, 26)); tb.rotation.z = 0.6; scene.add(tb);
      K.add(tb, K.box(4, 0.3, 0.4), M.bois, 0, 1, 0, 2); K.add(tb, K.box(4, 0.3, 0.4), M.bois, 0, -1, 0, 2); for (const dy of [1, -1]) { const a = new T.Mesh(K.box(0.3, 0.3, 5), M.bois); a.position.set(0, dy, 0); tb.add(a); }
      const arm = new T.Mesh(K.box(0.25, 0.25, 9), M.bois); arm.position.set(0, 0, 5); arm.rotation.y = 1.1; arm.castShadow = true; tb.add(arm);
      for (let i = 0; i < 5; i++) tent(scene, -30 + i * 14 + r() * 4, 12 + r() * 6, hgt(-30 + i * 14, 14), 1.2, 0, i % 2 ? 0x2c4f8a : null);
      pole(scene, -6, 14, hgt(-6, 14), 7, null, 'me', 1.4);
      for (let i = 0; i < 30; i++) { const x = -24 + r() * 48, y = 20 + r() * 8; person(scene, x, y, hgt(x, y), 0x3a3a44, 1, r, { helm: true, spear: i % 2 === 0 }); }
      smoke(scene, 6, 52, hgt(6, 52) + 8, 16, 0.4); smoke(scene, -8, 48, hgt(-8, 48) + 6, 12, 0.35);
      const fire = new T.PointLight(0xff8030, 60, 30); fire.position.set(6, 50, hgt(6, 50) + 10); scene.add(fire);
      trees(scene, scatter(hgt, r, 40, [-120, 60, 120, 160]), E.era);
      cam.position.set(-4, -14, 6); cam.lookAt(0, 40, 9); return scene; },
    port(E) { const { scene, cam } = setup('dawn', E.era, { sunAz: -0.2, sunEl: 0.18 }); const r = rngOf(21); sea(scene, E.era, { z: 0 });
      const land = new T.Group(); scene.add(land);
      K.add(land, K.box(70, 18, 2.2), M.taille, -10, 40, -0.6, 4); K.add(land, K.box(3, 26, 1.4), M.planches, 10, 18, 0, 3);
      for (let i = 0; i < 9; i++) { const x = -40 + i * 6.5, y = 44 + (i % 2) * 3; const g = new T.Group(); g.position.set(x, y, 1.6); g.scale.setScalar(1.5); land.add(g); K.house(g, 0, 0, 0, 1, i % 3 ? M.tuiles : M.ardoise, 0); }
      { const g = new T.Group(); g.position.set(26, 44, 1.6); g.scale.setScalar(1.4); land.add(g); K.tower(g, 0, 0, 0, 2.6, 12, M.ardoise); }
      ship(scene, 2, 22, 0.1, 1.2, 0xefe6cf, null, 'me', 0.2); ship(scene, 22, 30, 0.1, 0.9, 0xc8b89a, 0x8a2a1a, null, -0.5); ship(scene, -30, 60, 0.1, 0.8, 0xe8dcc0, 0x2c4f8a, null, 0.4);
      for (let i = 0; i < 6; i++) K.add(land, K.box(0.8, 0.8, 0.8), M.planches, -4 + r() * 10, 33 + r() * 2, 1.6, 2);
      for (let i = 0; i < 10; i++) person(land, -14 + r() * 26, 33 + r() * 3, 1.6, [0x6a4a2a, 0x3a4a6a, 0x7a2a1a][i % 3], 1, r, {});
      cam.position.set(-12, -8, 6); cam.lookAt(4, 34, 3); return scene; },
    mer(E) { const { scene, cam } = setup('day', E.era, { sunAz: 1.1, sunEl: 0.35, fogNear: 80, fogFar: 600 }); sea(scene, E.era);
      ship(scene, 0, 24, 0.1, 1.6, 0xefe6cf, null, 'me', 0.35); ship(scene, 40, 90, 0.1, 1.2, 0xc8b89a, 0x8a2a1a, null, -0.3);
      const cl = new T.Group(); scene.add(cl); const hgt = (x, y) => 0;
      const geo = new T.ConeGeometry(30, 18, 24, 4), p = geo.attributes.position; for (let i = 0; i < p.count; i++) p.setX(i, p.getX(i) * (0.9 + K.fbm(p.getY(i) * 0.1, p.getZ(i) * 0.1, 3) * 0.3)); geo.rotateX(Math.PI / 2); geo.translate(0, 0, 9); geo.computeVertexNormals(); K.wuv(geo, 10);
      const c = new T.Mesh(geo, M.pierre); c.position.set(-90, 200, -3); c.scale.set(2.2, 1, 1); scene.add(c);
      const lh = new T.Group(); lh.position.set(-80, 200, 14); lh.scale.setScalar(1.5); scene.add(lh); K.tower(lh, 0, 0, 0, 2.2, 10, M.ardoise);
      cam.position.set(-10, -20, 6); cam.lookAt(2, 30, 6.5); return scene; },
    nuit(E) { const { scene, cam } = setup('night', E.era, { sunAz: 1.4, sunEl: 0.5, fogNear: 60, fogFar: 300 }); const r = rngOf(22); const hgt = ground(scene, 23, { hill: [-10, 46, 8, 22] });
      const g = new T.Group(); g.position.set(-10, 46, hgt(-10, 46)); g.scale.setScalar(1.5); scene.add(g); K.castle(g, null, 0, 0, 0, '#7a1e12', 'me');
      const win = std(0xffc870, { emissive: 0xffa040, emissiveIntensity: 2 });
      for (let i = 0; i < 10; i++) { const w = new T.Mesh(new T.PlaneGeometry(0.5, 0.8), win); w.rotation.x = Math.PI / 2; w.position.set(-14 + r() * 8, 46 - 6.5, hgt(-10, 46) + 3 + r() * 12); scene.add(w); }
      const moon = new T.Mesh(new T.SphereGeometry(6, 20, 14), new T.MeshBasicMaterial({ color: 0xf6ecc8, fog: false })); moon.position.set(60, 300, 80); scene.add(moon);
      const sp = new Float32Array(900); for (let i = 0; i < 300; i++) { const a = r() * 3.2 - 0.1, e = 0.12 + r() * 0.8; sp[i * 3] = Math.cos(a) * 600 * Math.cos(e); sp[i * 3 + 1] = Math.sin(a) * 600 * Math.cos(e) + 100; sp[i * 3 + 2] = 600 * Math.sin(e); }
      const sg = new T.BufferGeometry(); sg.setAttribute('position', new T.BufferAttribute(sp, 3)); scene.add(new T.Points(sg, new T.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, fog: false })));
      const cm = new T.Mesh(new T.CylinderGeometry(0.4, 0.05, 30, 6), new T.MeshBasicMaterial({ color: 0xfff6d8, fog: false, transparent: true, opacity: 0.7 })); cm.position.set(-60, 320, 150); cm.rotation.z = 1; cm.rotation.x = 0.5; scene.add(cm);
      const tl = new T.PointLight(0xffa040, 30, 18); tl.position.set(14, 20, hgt(14, 20) + 2); scene.add(tl); person(scene, 14, 19, hgt(14, 19), 0x2a2622, 1.1, null, { hood: true });
      trees(scene, scatter(hgt, r, 60, [-100, 0, 100, 150], (x, y) => Math.hypot(x + 10, y - 46) < 24), E.era);
      cam.position.set(6, -12, 5); cam.lookAt(-4, 40, 12); return scene; },
    cour(E) { return interior(E, false); },
    couronnement(E) { return interior(E, true); },
  };
  function interior(E, sacre) {
    const scene = new T.Scene(); scene.background = new T.Color(0x140c07); scene.fog = new T.Fog(0x1e130b, 20, 90);
    const cam = new T.PerspectiveCamera(40, 2.4, 0.3, 300); cam.up.set(0, 0, 1); curCam = cam;
    const floor = new T.Mesh(K.wuv(new T.PlaneGeometry(40, 80), 4), M.taille); floor.receiveShadow = true; scene.add(floor);
    const carpet = new T.Mesh(new T.PlaneGeometry(4, 60), std(0x7a1e12)); carpet.position.z = 0.02; carpet.receiveShadow = true; scene.add(carpet);
    for (const sx of [-1, 1]) {
      K.add(scene, K.box(1, 80, 18), M.taille, sx * 12, 0, 0, 4);
      for (let i = 0; i < 6; i++) { const y = -4 + i * 7; K.add(scene, K.cyl(0.9, 13, 14), M.taille, sx * 7, y, 0, 3); }
      for (let i = 0; i < 5; i++) { const y = -1 + i * 7, gl = new T.Mesh(new T.PlaneGeometry(2.2, 5.5), std(sacre ? [0x2c4f8a, 0x8a2a1a, 0xc9a24a][i % 3] : 0x8aa0c0, { emissive: sacre ? [0x2c4f8a, 0x8a2a1a, 0xc9a24a][i % 3] : 0x6a7a9a, emissiveIntensity: 0.9 })); gl.rotation.y = sx * Math.PI / 2; gl.rotation.x = Math.PI / 2; gl.position.set(sx * 11.45, y, 9); scene.add(gl); }
    }
    K.add(scene, K.box(24, 80, 0.6), M.planches, 0, 0, 16, 3);
    // estrade, trône, bannières
    K.add(scene, K.box(10, 6, 1), M.taille, 0, 36, 0, 3); K.add(scene, K.box(3, 2, 1.4), M.bois, 0, 37, 1, 2); K.add(scene, K.box(3, 0.6, 5), std(0x5a2a1a), 0, 38, 1, 2);
    const back = flag(scene, -2.2, 38.9, 13, 4.4, 7, null, 'me'); back.rotation.z = 0;
    for (const x of [-8.5, 8.5]) { const b = flag(scene, x - 1.4, 30, 14, 2.8, 6, null, 'me'); }
    const hemi = new T.HemisphereLight(0xffd8a0, 0x2a1a10, 0.45); hemi.position.set(0, 0, 1); scene.add(hemi);
    const key = new T.DirectionalLight(sacre ? 0xfff0d0 : 0xffd8a8, sacre ? 2.4 : 1.1); key.position.set(-20, 10, 30); key.target.position.set(0, 30, 0); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); const c = key.shadow.camera; c.left = -40; c.right = 40; c.top = 40; c.bottom = -40; scene.add(key, key.target);
    const r = rngOf(sacre ? 31 : 32);
    for (const [x, y] of [[-5, 10], [5, 10], [-5, 24], [5, 24], [-3, 34], [3, 34]]) { K.add(scene, K.cyl(0.08, 2.2, 6), M.fer, x, y, 0, 1); const fl = new T.Mesh(new T.SphereGeometry(0.12, 6, 5), new T.MeshBasicMaterial({ color: 0xffd080 })); fl.position.set(x, y, 2.35); scene.add(fl); const l = new T.PointLight(0xffa850, 9, 14, 1.6); l.position.set(x, y, 2.6); scene.add(l); }
    if (sacre) {
      person(scene, 0, 35.5, 1, 0x7a1e12, 1.15, null, { crown: true }); person(scene, 1.6, 35.2, 1, 0xf0ece0, 1.15, null, { hood: true });
      const beam = new T.Mesh(new T.CylinderGeometry(1.4, 3.5, 22, 16, 1, true), new T.MeshBasicMaterial({ color: 0xfff2c4, transparent: true, opacity: 0.12, depthWrite: false, side: T.DoubleSide })); beam.position.set(-4, 30, 10); beam.rotation.x = Math.PI / 2; beam.rotation.y = 0.5; scene.add(beam);
    } else person(scene, 0, 37.3, 2.1, 0x2c4f8a, 1.05, null, { crown: true });
    for (let i = 0; i < 22; i++) { const sd = i % 2 ? 1 : -1, x = sd * (2.8 + r() * 2.8), y = 6 + r() * 22; person(scene, x, y, 0, [0x8a2a1a, 0x2c4f8a, 0xc9a24a, 0x3a5a2a, 0x5a3a6a, 0x2a2622][i % 6], 1, null, {}).rotation.z = sd > 0 ? Math.PI : 0; }
    cam.position.set(0, -6, 4.5); cam.lookAt(0, 34, 4); return scene;
  }

  // ---------- rendu ----------
  let cur = null;
  function build(kind, era, w, h) {
    M = K.mats(); FLAGS.length = 0;
    if (!renderer) { renderer = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.outputColorSpace = T.SRGBColorSpace; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap; document.body.appendChild(renderer.domElement); }
    renderer.toneMappingExposure = kind === 'nuit' ? 1.5 : kind === 'cour' || kind === 'couronnement' ? 1.45 : 1.3;
    renderer.setPixelRatio(1); renderer.setSize(w, h, false);
    cur = SC[kind]({ era }); curCam.aspect = w / h; curCam.updateProjectionMatrix(); return true;
  }
  function shot() {
    renderer.render(cur, curCam); cur.updateMatrixWorld(true);
    const W = renderer.domElement.width, H = renderer.domElement.height;
    const flags = FLAGS.map(f => { const pts = [[0, 0], [f.w, 0], [f.w, -f.h], [0, -f.h]].map(([x, z]) => { const v = new T.Vector3(x, 0, z).applyMatrix4(f.m.matrixWorld).project(curCam); return [Math.round((v.x + 1) / 2 * W), Math.round((1 - v.y) / 2 * H)]; }); return { who: f.who, pts }; });
    return { url: renderer.domElement.toDataURL('image/png'), flags };
  }
  function dispose() { cur.traverse(o => { if (o.geometry) o.geometry.dispose(); }); cur = null; }
  return { SC, FLAGS, build, shot, dispose, KINDS: Object.keys(SC) };
})();
