// Atelier de portraits 3D de Couronnes & Lignées (hors ligne, piloté par portraits.py).
// Tête scannée « Lee Perry-Smith » (Infinite-Realities, CC BY 3.0), déformée, coiffée et habillée procéduralement.
window.PORTRAIT = (() => {
  const T = THREE;
  let renderer, scene, cam, base = null, texP, texR, ready;
  function glb(url) { // lecteur GLB minimal (un maillage : position, normale, uv, indices)
    const bin = Uint8Array.from(atob(url.split(',')[1]), c => c.charCodeAt(0)).buffer, dv = new DataView(bin);
    const jl = dv.getUint32(12, true), j = JSON.parse(new TextDecoder().decode(new Uint8Array(bin, 20, jl))), bo = 20 + jl + 8;
    const acc = i => { const a = j.accessors[i], v = j.bufferViews[a.bufferView], n = { SCALAR: 1, VEC2: 2, VEC3: 3 }[a.type], off = bo + (v.byteOffset || 0) + (a.byteOffset || 0);
      return a.componentType === 5126 ? new Float32Array(bin.slice(off, off + a.count * n * 4)) : new Uint16Array(bin.slice(off, off + a.count * n * 2)); };
    const p = j.meshes[0].primitives[0], g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(acc(p.attributes.POSITION), 3)); g.setAttribute('normal', new T.BufferAttribute(acc(p.attributes.NORMAL), 3)); g.setAttribute('uv', new T.BufferAttribute(acc(p.attributes.TEXCOORD_0), 2)); g.setIndex(new T.BufferAttribute(acc(p.indices), 1));
    return g;
  }
  function tex(u, srgb) { const t = new T.TextureLoader().load(u); if (srgb) t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t; }
  function pret() {
    base = glb(PSRC.glb); base.computeBoundingBox(); texP = tex(PSRC.peau, true); texR = tex(PSRC.relief);
    renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); renderer.outputColorSpace = T.SRGBColorSpace; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap; renderer.setPixelRatio(1); document.body.appendChild(renderer.domElement);
    return true;
  }
  // ouvre les paupières : enfonce la peau dans une amande autour de chaque œil, l'œil (sphère) apparaît
  function ouvrir(g, e) {
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); if (z < e.z - 0.2) continue;
      const dx = (Math.abs(x) - e.x) / e.ax, dy = (y - e.y - (Math.abs(x) - e.x) * (e.tilt || 0)) / e.ay, q = dx * dx + dy * dy;
      if (q < 1) { const f = Math.pow(1 - q, 1.5); p.setZ(i, z - e.prof * f); } }
    g.computeVertexNormals();
  }
  const oeils = {};
  function oeilTex(col) {
    if (oeils[col]) return oeils[col];
    const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d');
    x.fillStyle = '#d8d0c4'; x.fillRect(0, 0, 256, 128);
    // la pupille regarde vers +z : sur une sphère dont l'axe y est vertical, u=0.75 correspond à +z après rotation
    const cx = 128, cy = 64; const g = x.createRadialGradient(cx, cy, 1, cx, cy, 13); g.addColorStop(0, '#000'); g.addColorStop(0.32, '#000'); g.addColorStop(0.38, col); g.addColorStop(0.9, col); g.addColorStop(1, '#2a2018');
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, 13, 0, 6.3); x.fill();
    x.fillStyle = 'rgba(255,255,255,.8)'; x.beginPath(); x.ellipse(cx - 3, cy - 4, 1.6, 1.8, 0, 0, 6.3); x.fill();
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return oeils[col] = t;
  }
  // ---------- outils ----------
  const rng = s => () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const gauss = (x, y, z, cx, cy, cz, r) => Math.exp(-((x - cx) ** 2 + (y - cy) ** 2 + (z - cz) ** 2) / (r * r));
  // ---------- visage : déformations douces ----------
  function morph(g, f) {
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i), z = p.getZ(i); const head = sm(-1.2, -0.6, y); // 0 sous le cou
      // largeur et longueur du crâne/visage
      x *= 1 + f.w * head; y = y > 1 ? 1 + (y - 1) * (1 + f.long * head) : y;
      // mâchoire : élargit/rétrécit le bas du visage
      const jaw = gauss(Math.abs(x), y, z, 1.25, -0.15, 0.6, 0.85) * head; x *= 1 + f.jaw * jaw;
      // menton : avance et descend
      const ch = gauss(x, y, z, 0, -0.55, 1.8, 0.6); z += f.chin * 0.25 * ch; y -= f.chin * 0.12 * ch;
      // nez : grossit autour de sa pointe
      const nz = gauss(x, y, z, 0, 1.15, 2.4, 0.55); x += x * f.nose * nz * 0.9; z += f.nose * 0.22 * nz;
      // arcades et pommettes
      const br = gauss(Math.abs(x), y, z, 0.6, 2.05, 1.9, 0.5); z += f.brow * 0.12 * br;
      const ck = gauss(Math.abs(x), y, z, 1.1, 0.95, 1.6, 0.5); z += f.cheek * 0.14 * ck; x += Math.sign(x) * f.cheek * 0.08 * ck;
      // embonpoint (joues, cou) et maigreur (âge)
      const fat = gauss(Math.abs(x), y, z, 1.1, 0.0, 1.0, 0.9) * head; x += Math.sign(x) * f.fat * 0.22 * fat; z += f.fat * 0.12 * fat;
      const gaunt = gauss(Math.abs(x), y, z, 1.05, 0.55, 1.55, 0.42); z -= (f.gaunt || 0) * 0.16 * gaunt;
      // enfant : visage plus court et crâne plus rond
      if (f.enfant) { const k = sm(2.2, 0.0, y) * head; y = y - (y - 2.2) * 0.14 * k; z = z - (z - 0.2) * 0.1 * k; x = x * (1 - 0.06 * k); }
      // femme : traits adoucis
      if (f.fem) { const k = gauss(Math.abs(x), y, z, 0.9, 0.2, 1.4, 1.0) * head; x *= 1 - 0.08 * k; const b2 = gauss(Math.abs(x), y, z, 0.5, 2.0, 1.9, 0.6); z -= 0.06 * b2; const n2 = gauss(x, y, z, 0, 1.15, 2.4, 0.5); z -= 0.12 * n2; x -= x * 0.12 * n2; }
      p.setXYZ(i, x, y, z);
    }
    g.computeVertexNormals();
  }
  // ---------- coquilles (cheveux, barbe, vêtement, guimpe) ----------
  function shell(g, keep, off, opt) {
    opt = opt || {};
    const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv, idx = g.index.array, P = [], U = [], A = [], map = new Map(), I = [];
    const w = new Float32Array(p.count); for (let i = 0; i < p.count; i++) w[i] = keep(p.getX(i), p.getY(i), p.getZ(i));
    for (let t = 0; t < idx.length; t += 3) {
      const a = idx[t], b = idx[t + 1], c = idx[t + 2]; if (Math.max(w[a], w[b], w[c]) <= 0) continue;
      for (const v of [a, b, c]) { if (!map.has(v)) { const k = w[v], o = typeof off === 'function' ? off(p.getX(v), p.getY(v), p.getZ(v)) : off, f = o * Math.min(1, k * (opt.taper || 3));
          map.set(v, P.length / 3); P.push(p.getX(v) + n.getX(v) * f, p.getY(v) + n.getY(v) * f - (opt.drop ? opt.drop(p.getX(v), p.getY(v), p.getZ(v)) * k : 0), p.getZ(v) + n.getZ(v) * f);
          U.push(opt.uvw ? p.getX(v) * 0.5 : uv.getX(v), opt.uvw ? p.getY(v) * 0.5 : uv.getY(v)); A.push(Math.min(1, k * (opt.fade || 1.2))); }
        I.push(map.get(v)); }
    }
    const s2 = new T.BufferGeometry(); s2.setAttribute('position', new T.Float32BufferAttribute(P, 3)); s2.setAttribute('uv', new T.Float32BufferAttribute(U, 2)); s2.setIndex(I); s2.computeVertexNormals(); const C = new Float32Array(A.length * 4); A.forEach((a, i) => { C[i * 4] = C[i * 4 + 1] = C[i * 4 + 2] = 1; C[i * 4 + 3] = a; }); s2.setAttribute('color', new T.BufferAttribute(C, 4)); return s2;
  }
  const texs = {};
  function strands(kind) { // texture de mèches / barbe / étoffe / fourrure
    if (texs[kind]) return texs[kind];
    const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'), r = rng(kind.length * 99);
    x.fillStyle = '#808080'; x.fillRect(0, 0, 512, 512);
    if (kind === 'cheveux' || kind === 'barbe') { for (let i = 0; i < 9000; i++) { const px = r() * 512, py = r() * 512, l = kind === 'barbe' ? 6 + r() * 10 : 14 + r() * 40, v = 60 + r() * 150 | 0; x.strokeStyle = `rgba(${v},${v},${v},.5)`; x.lineWidth = 0.6 + r() * 1.2; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + (r() - 0.5) * 6, py + l / 2, px + (r() - 0.5) * 8, py + l); x.stroke(); } }
    if (kind === 'etoffe') { for (let y = 0; y < 512; y += 2) { x.fillStyle = `rgba(0,0,0,${0.05 + r() * 0.06})`; x.fillRect(0, y, 512, 1); } for (let xx = 0; xx < 512; xx += 2) { x.fillStyle = `rgba(255,255,255,${0.03 + r() * 0.05})`; x.fillRect(xx, 0, 1, 512); } for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(0,0,0,.05)`; x.fillRect(0, r() * 512, 512, 3 + r() * 8); } }
    if (kind === 'hermine') { x.fillStyle = '#f2efe8'; x.fillRect(0, 0, 512, 512); for (let i = 0; i < 9000; i++) { const v = 200 + r() * 55 | 0; x.fillStyle = `rgba(${v},${v},${v - 6},.5)`; x.fillRect(r() * 512, r() * 512, 1, 3 + r() * 4); } x.fillStyle = '#141210'; for (let i = 0; i < 26; i++) { const px = r() * 512, py = r() * 512; x.beginPath(); x.moveTo(px, py - 12); x.lineTo(px + 5, py + 8); x.lineTo(px - 5, py + 8); x.fill(); } }
    if (kind === 'lin') { x.fillStyle = '#f0ece2'; x.fillRect(0, 0, 512, 512); for (let i = 0; i < 300; i++) { x.strokeStyle = `rgba(0,0,0,${0.03 + r() * 0.04})`; x.lineWidth = 2 + r() * 6; const px = r() * 512; x.beginPath(); x.moveTo(px, 0); x.bezierCurveTo(px + (r() - 0.5) * 40, 170, px + (r() - 0.5) * 40, 340, px + (r() - 0.5) * 30, 512); x.stroke(); } }
    const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.colorSpace = T.SRGBColorSpace; return texs[kind] = t;
  }
  // peau sans barbe (femmes, enfants) : repeint la zone de barbe de la texture avec la couleur de la joue
  let texLisse = null;
  function peauLisse() {
    if (texLisse) return texLisse;
    const img = texP.image, c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    const p = base.attributes.position, uv = base.attributes.uv, W = c.width, H = c.height;
    // copie floutée et éclaircie, appliquée à travers un masque de la zone de barbe
    const B = document.createElement('canvas'); B.width = W; B.height = H; const bx = B.getContext('2d'); bx.filter = 'blur(10px) brightness(1.1) saturate(1.05)'; bx.drawImage(img, 0, 0); bx.filter = 'none';
    const Mk = document.createElement('canvas'); Mk.width = W; Mk.height = H; const mx = Mk.getContext('2d');
    for (let i = 0; i < p.count; i++) { const X = p.getX(i), Y = p.getY(i), Z = p.getZ(i); const k = sm(1.15, 0.75, Y) * sm(-1.5, -1.0, Y) * sm(-0.6, 0.3, Z); if (k <= 0.02) continue;
      const lip = Math.abs(X) < 0.42 && Y > 0.28 && Y < 0.6 && Z > 1.65 ? 0.25 : 1;
      const u = uv.getX(i) * W, v = (1 - uv.getY(i)) * H, gr = mx.createRadialGradient(u, v, 0, u, v, 22); gr.addColorStop(0, `rgba(255,255,255,${0.9 * k * lip})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
      mx.fillStyle = gr; mx.fillRect(u - 22, v - 22, 44, 44); }
    bx.globalCompositeOperation = 'destination-in'; bx.drawImage(Mk, 0, 0); bx.globalCompositeOperation = 'source-over';
    x.drawImage(B, 0, 0);
    x.globalAlpha = 1; texLisse = new T.CanvasTexture(c); texLisse.colorSpace = T.SRGBColorSpace; texLisse.flipY = texP.flipY; return texLisse;
  }
  // ---------- un portrait ----------
  // d = { sexe:'M'|'F', age:0..3 (enfant, jeune, mûr, vieux), visage: n, epoque: 0..2, couronne: 0|1, masque: bool, taille }
  const CHEV = ['#2a1d14', '#4a3020', '#6b4a2a', '#8a6a3a', '#b08a50', '#1a1410', '#7a3a1e', '#c8a870'];
  const IRIS = ['#5a3a20', '#3a2a1a', '#4a6a8a', '#6a7a5a', '#7a8a9a', '#5a4a2a'];
  const PEAU = [0xffffff, 0xfff0e6, 0xf2dcc8, 0xe8cfb4, 0xfff4ee];
  function rendre(d) {
    const S = d.taille || 384, H = Math.round(S * 1.2); renderer.setSize(S, H, false);
    const r = rng(d.visage * 7919 + (d.sexe === 'F' ? 31 : 0)), F = d.sexe === 'F', age = d.age, vieux = age === 3, enfant = age === 0;
    const f = { w: (r() - 0.5) * 0.12, long: (r() - 0.5) * 0.1, jaw: (r() - 0.5) * 0.24, chin: (r() - 0.5) * 1.2, nose: (r() - 0.5) * 0.5, brow: (r() - 0.5) * 1.2, cheek: (r() - 0.5) * 1.2, fat: Math.max(0, r() - 0.55) * 1.6 + (age === 2 ? 0.15 : 0), gaunt: vieux ? 0.9 : 0, fem: F, enfant };
    const chev = CHEV[(r() * CHEV.length) | 0], iris = IRIS[(r() * IRIS.length) | 0], peau = PEAU[(r() * PEAU.length) | 0], coupe = (r() * 3) | 0, barbe = (r() * 4) | 0, calvitie = r();
    const cheveux = vieux ? (calvitie < 0.5 ? '#d8d4cc' : '#a8a298') : age === 2 && r() < 0.3 ? '#7a746a' : chev;
    scene = new T.Scene();
    const key = new T.DirectionalLight(0xfff0e0, 2.5); key.position.set(-6, 7, 10); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); const kc = key.shadow.camera; kc.left = kc.bottom = -6; kc.right = kc.top = 6; kc.near = 1; kc.far = 40; key.shadow.bias = -0.0005; key.shadow.normalBias = 0.02; scene.add(key);
    const fill = new T.DirectionalLight(0xc8d8ff, 0.6); fill.position.set(8, 1, 6); scene.add(fill);
    const rim = new T.DirectionalLight(0xffe0b0, 1.8); rim.position.set(5, 6, -8); scene.add(rim);
    scene.add(new T.HemisphereLight(0xfff4e8, 0x302418, 0.55));
    const g = base.clone(); morph(g, f);
    const E = { x: 0.52, y: 1.645, z: 1.5, r: 0.3, ax: 0.28, ay: F || enfant ? 0.108 : 0.1, prof: 0.3, tilt: 0.05 };
    ouvrir(g, E);
    const skin = new T.MeshStandardMaterial({ map: F || enfant ? peauLisse() : texP, normalMap: texR, normalScale: new T.Vector2(enfant ? 0.3 : F ? 0.5 : vieux ? 1.7 : age === 1 ? 0.75 : 1.1, enfant ? 0.3 : F ? 0.5 : vieux ? 1.7 : age === 1 ? 0.75 : 1.1), roughness: 0.6, color: peau });
    const grp = new T.Group(); const head = new T.Mesh(g, skin); head.castShadow = head.receiveShadow = true; grp.add(head); scene.add(grp);
    for (const sx of [-1, 1]) { const eb = new T.Mesh(new T.SphereGeometry(E.r, 24, 18), new T.MeshStandardMaterial({ map: oeilTex(iris), roughness: 0.12 })); eb.position.set(sx * E.x, E.y, E.z); eb.rotation.y = -Math.PI / 2; grp.add(eb); }
    const add = (geo, mat) => { if (geo.attributes.color && geo.attributes.color.itemSize === 4) { mat.vertexColors = true; mat.transparent = true; mat.alphaTest = 0.02; mat.polygonOffset = true; mat.polygonOffsetFactor = -1; mat.depthWrite = true; } const m = new T.Mesh(geo, mat); m.castShadow = m.receiveShadow = true; grp.add(m); return m; };
    const hairMat = (col, kind) => new T.MeshStandardMaterial({ color: col, map: strands(kind || 'cheveux'), roughness: 0.75, side: T.DoubleSide });
    // vêtement (blanc, teint dans le jeu par le masque) ; col montant à l'âge des fléaux
    const robeY = F ? -0.95 : -1.05, collar = d.epoque === 2 ? 0.25 : 0;
    const robe = add(shell(g, (x, y, z) => sm(robeY + 0.25 + collar, robeY - 0.15 + collar, y + (z < 0 ? 0.35 : 0)), 0.14, { taper: 4 }), new T.MeshStandardMaterial({ color: 0xf4f2ee, map: strands('etoffe'), roughness: 0.95 }));
    robe.userData.robe = true;
    // manteau à col de fourrure pour les souverains, liseré pour les autres
    const neckR = (y) => 1.25; const ring = (y0, rx, rz, tub, mat) => { const tg = new T.TorusGeometry(1, tub, 10, 48); tg.rotateX(Math.PI / 2); tg.scale(rx, 1, rz); tg.translate(0, y0, 0.05); return add(tg, mat); };
    if (!enfant) ring(robeY - 0.18 + collar, 1.42, 1.62, 0.2, d.couronne ? new T.MeshStandardMaterial({ map: strands('hermine'), roughness: 1 }) : new T.MeshStandardMaterial({ color: 0x8a6a3a, map: strands('cheveux'), roughness: 1 }));
    // cheveux
    const front = vieux && !F && calvitie < 0.6 ? 3.15 : 2.62;
    const hairline = (x, y, z) => { const side = sm(0.85, 1.6, Math.abs(x)), back = sm(0.4, -0.6, z); const t = front - side * 0.75 - back * (front - (coupe === 2 || F ? -0.7 : coupe === 1 ? 0.0 : 0.6)); return sm(t, t + 0.12, y) * (Math.abs(x) > 1.55 && y < 2.0 && y > 0.6 && z > -0.6 ? 0 : 1); };
    const hairVol = F || enfant ? 0.16 : 0.12 + coupe * 0.04;
    if (!F || enfant) add(shell(g, hairline, (x, y, z) => hairVol + (z < -0.5 ? 0.06 : 0), { taper: 5 }), hairMat(cheveux));
    // barbe
    if (!F && !enfant && (barbe > 0 || vieux)) {
      const full = barbe >= 2 || vieux, len = barbe === 3 ? 0.35 : full ? 0.2 : 0.07;
      const bm = (x, y, z) => { if (z < 0.25 || y > 1.0 || y < -1.0) return 0; if (Math.abs(x) < 0.45 && y > 0.28 && y < 0.6 && z > 1.65) return 0; if (y > 0.62 && (Math.abs(x) > 0.75 || y > 0.86)) return sm(1.0, 0.7, y) * sm(1.7, 1.5, Math.abs(x)) * (full ? 1 : 0); return sm(-1.0, -0.7, y) * sm(1.0, 0.75, y) * sm(1.85, 1.55, Math.abs(x)); };
      add(shell(g, bm, len, { taper: 6, drop: (x, y, z) => full ? sm(0.4, -0.6, y) * len * 0.8 : 0 }), hairMat(cheveux, 'barbe'));
    }
    // femmes : guimpe et voile (lin), ou cheveux longs pour les filles
    if (F && !enfant) { // voile et guimpe : formes lisses posées sur la tête
      const linC = d.epoque === 2 ? 0xe6dfd2 : d.epoque === 1 ? 0xf2e8d2 : 0xf6f2ea;
      const lin = new T.MeshStandardMaterial({ color: linC, map: strands('lin'), roughness: 0.95, side: T.DoubleSide });
      // calotte du voile (ouverte sur le visage)
      const cap = new T.SphereGeometry(1, 40, 28, 0, Math.PI * 2, 0, Math.PI * 0.6); cap.rotateX(-0.62); cap.scale(1.9, 2.05, 2.2); cap.translate(0, 2.2, 0.05);
      add(cap, lin);
      // retombée du voile sur la nuque et les épaules
      const dr = new T.CylinderGeometry(1.95, 2.7, 3.6, 40, 6, true, Math.PI * 0.32, Math.PI * 1.36); const dp = dr.attributes.position;
      for (let i = 0; i < dp.count; i++) { const yy = dp.getY(i); dp.setX(i, dp.getX(i) * (1 + Math.sin(dp.getZ(i) * 3 + yy) * 0.03)); }
      dr.computeVertexNormals(); dr.translate(0, 0.65, -0.25); add(dr, lin);
      // guimpe : tour du cou et bande sous le menton
      const nk = new T.CylinderGeometry(1.32, 1.5, 1.7, 36, 1, true); nk.translate(0, -0.55, 0.15); add(nk, new T.MeshStandardMaterial({ color: 0xfaf8f2, map: strands('lin'), roughness: 0.95, side: T.DoubleSide }));
      const bb = new T.TorusGeometry(1, 0.2, 12, 60); bb.scale(1.18, 1.72, 1); bb.rotateX(-0.42); bb.translate(0, 1.05, 0.95); add(bb, new T.MeshStandardMaterial({ color: 0xfaf8f2, map: strands('lin'), roughness: 0.95 }));
    } else if (F && enfant) add(shell(g, (x, y, z) => sm(2.55 - sm(0.85, 1.6, Math.abs(x)) * 0.75 - sm(0.4, -0.6, z) * 3.2, 2.67 - sm(0.85, 1.6, Math.abs(x)) * 0.75 - sm(0.4, -0.6, z) * 3.2, y) * (Math.abs(x) > 1.55 && y < 2.0 && y > 0.6 && z > -0.6 ? 0 : 1), 0.18, { taper: 5 }), hairMat(chev));
    // couronne ou diadème
    if (d.couronne && !enfant) {
      const y0 = F ? 3.05 : vieux && calvitie < 0.6 ? 2.75 : 2.85, rx = F ? 1.85 : 1.72, rz = F ? 2.12 : 2.0, gold = new T.MeshStandardMaterial({ color: 0xd4a840, roughness: 0.28, metalness: 1 });
      const band = new T.CylinderGeometry(1, 1.04, F ? 0.22 : 0.36, 48, 1, true); band.scale(rx, 1, rz); band.translate(0, y0, 0.12); add(band, new T.MeshStandardMaterial({ color: 0xd4a840, roughness: 0.28, metalness: 1, side: T.DoubleSide }));
      const n = F ? 0 : 8; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, px = Math.sin(a) * rx * 1.02, pz = Math.cos(a) * rz * 1.02 + 0.12; const fl = new T.ConeGeometry(0.13, 0.42, 6); fl.translate(px, y0 + 0.38, pz); add(fl, gold); const b2 = new T.SphereGeometry(0.08, 8, 6); b2.translate(px, y0 + 0.62, pz); add(b2, gold); }
      for (let i = 0; i < 6; i++) { const a = (i / 6 + 0.083) * Math.PI * 2; const jw = new T.SphereGeometry(F ? 0.07 : 0.09, 10, 8); jw.translate(Math.sin(a) * rx * 1.05, y0, Math.cos(a) * rz * 1.05 + 0.12); add(jw, new T.MeshStandardMaterial({ color: i % 2 ? 0x9a1a1a : 0x1a3a8a, roughness: 0.1, metalness: 0.3 })); }
    }
    if (d.masque) { // passe de masque : vêtement en blanc, reste en noir
      scene.traverse(o => { if (o.isMesh) o.material = new T.MeshBasicMaterial({ color: o.userData.robe ? 0xffffff : 0x000000, polygonOffset: true, polygonOffsetFactor: o.userData.robe ? 0 : -2 }); }); scene.background = new T.Color(0); }
    grp.rotation.y = 0.18;
    const sc = enfant ? 0.86 : 1; grp.scale.setScalar(sc); grp.position.y = enfant ? -0.2 : 0;
    cam = new T.PerspectiveCamera(24, S / H, 0.1, 200); cam.position.set(0.5, 1.3, 19.5); cam.lookAt(0, 0.95, 0);
    renderer.setClearColor(0, d.masque ? 1 : 0); renderer.render(scene, cam);
    const u = renderer.domElement.toDataURL('image/png');
    scene.traverse(o => { if (o.geometry && o.geometry !== base) o.geometry.dispose(); });
    return u;
  }
  return { pret, rendre, get base() { return base; } };
})();
