// Art procédural : blasons, portraits, icônes, carte
(function (root) {
  'use strict';
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function prng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const pk = (r, a) => a[Math.floor(r() * a.length)];
  let uid = 0; const nid = p => p + (++uid);

  // ---------- Héraldique ----------
  const METALS = { or: '#d6a62e', argent: '#f2ede2' };
  const COLOURS = { gueules: '#b3261e', azur: '#1d4b97', sinople: '#2c7146', sable: '#231e1a', pourpre: '#6b3a78' };
  const SHIELD = 'M8 6 H92 V56 Q92 97 50 114 Q8 97 8 56 Z';
  const CHARGES = {
    fleur: 'M0 -12 C4 -8 4.6 -3 1.8 1.4 L-1.8 1.4 C-4.6 -3 -4 -8 0 -12 Z M2.4 1.6 C3 -4 8 -7.4 11.4 -4 C8.4 -4.4 6.4 -1.6 7.4 2 C6.4 4 4 4 2.4 3.2 Z M-2.4 1.6 C-3 -4 -8 -7.4 -11.4 -4 C-8.4 -4.4 -6.4 -1.6 -7.4 2 C-6.4 4 -4 4 -2.4 3.2 Z M-7.4 3 H7.4 V5.6 H-7.4 Z M-1.6 5.6 C-2 8.4 -4 10.4 -7.6 10.2 C-4.4 12.6 -1.2 10.6 0 7.6 C1.2 10.6 4.4 12.6 7.6 10.2 C4 10.4 2 8.4 1.6 5.6 Z',
    etoile: (() => { let d = ''; for (let i = 0; i < 10; i++) { const r = i % 2 ? 4.4 : 11, a = -Math.PI / 2 + i * Math.PI / 5; d += (i ? 'L' : 'M') + (r * Math.cos(a)).toFixed(2) + ' ' + (r * Math.sin(a)).toFixed(2) + ' '; } return d + 'Z'; })(),
    croissant: 'M-9 -3 A9.5 9.5 0 1 0 9 -3 A7.6 7.6 0 1 1 -9 -3 Z',
    tour: 'M-7 11 V-3 H-8.5 V-10 H-5 V-6.5 H-1.8 V-10 H1.8 V-6.5 H5 V-10 H8.5 V-3 H7 V11 Z',
    croix: 'M-2.2 -2.2 L-4.5 -11 H4.5 L2.2 -2.2 L11 -4.5 V4.5 L2.2 2.2 L4.5 11 H-4.5 L-2.2 2.2 L-11 4.5 V-4.5 Z',
    besant: 'M-8 0 A8 8 0 1 0 8 0 A8 8 0 1 0 -8 0 Z',
    losange: 'M0 -11 L8 0 L0 11 L-8 0 Z',
    coquille: 'M0 10 L-9 -3 Q-9 -10 0 -10 Q9 -10 9 -3 Z M-4.5 -9 L-1.5 9 M4.5 -9 L1.5 9 M0 -10 V10',
  };
  function arms(houseName) {
    const r = prng(hash(houseName));
    const metalFirst = r() < 0.5;
    const metal = pk(r, Object.keys(METALS)), colour = pk(r, Object.keys(COLOURS));
    const field = metalFirst ? METALS[metal] : COLOURS[colour];
    const other = metalFirst ? COLOURS[colour] : METALS[metal];
    const div = pk(r, ['plain', 'plain', 'pale', 'fess', 'quarterly', 'bend', 'chevron', 'fessband', 'chief', 'bordure', 'cross', 'saltire', 'paleband']);
    const charge = pk(r, Object.keys(CHARGES));
    const count = ['cross', 'saltire', 'quarterly'].includes(div) ? 0 : pk(r, [1, 3, 3]);
    return { field, other, div, charge, count, robe: metalFirst ? COLOURS[colour] : field, accent: metalFirst ? METALS[metal] : METALS.or };
  }
  function impaledSVG(h1, h2, size) {
    const id = nid('im'), a = shieldSVG(h1, size), b = shieldSVG(h2, size);
    const inner = s => s.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
    return `<svg viewBox="0 0 100 120" width="${size}" height="${size * 1.2}" class="impale" aria-hidden="true"><defs><clipPath id="${id}l"><rect width="50" height="120"/></clipPath><clipPath id="${id}r"><rect x="50" width="50" height="120"/></clipPath></defs><g clip-path="url(#${id}l)">${inner(a)}</g><g clip-path="url(#${id}r)">${inner(b)}</g><path d="M50 4 V112" stroke="#3b2a18" stroke-width="1.6" opacity=".55"/></svg>`;
  }
  function shieldSVG(houseName, size) {
    const a = arms(houseName), id = nid('sh');
    let g = `<rect width="100" height="120" fill="${a.field}"/>`;
    const o = a.other;
    switch (a.div) {
      case 'pale': g += `<rect x="50" width="50" height="120" fill="${o}"/>`; break;
      case 'fess': g += `<rect y="58" width="100" height="62" fill="${o}"/>`; break;
      case 'quarterly': g += `<rect x="50" width="50" height="58" fill="${o}"/><rect y="58" width="50" height="62" fill="${o}"/>`; break;
      case 'bend': g += `<path d="M0 0 H100 V120 Z" fill="${o}"/>`; break;
      case 'chevron': g += `<path d="M0 92 L50 40 L100 92 V112 L50 60 L0 112 Z" fill="${o}"/>`; break;
      case 'fessband': g += `<rect y="44" width="100" height="24" fill="${o}"/>`; break;
      case 'paleband': g += `<rect x="38" width="24" height="120" fill="${o}"/>`; break;
      case 'chief': g += `<rect width="100" height="34" fill="${o}"/>`; break;
      case 'bordure': g += `<path d="${SHIELD}" fill="none" stroke="${o}" stroke-width="16"/>`; break;
      case 'cross': g += `<rect x="40" width="20" height="120" fill="${o}"/><rect y="40" width="100" height="20" fill="${o}"/>`; break;
      case 'saltire': g += `<path d="M0 0 L100 120 M100 0 L0 120" stroke="${o}" stroke-width="18"/>`; break;
    }
    if (a.count) {
      // couleur de la meuble : contraste avec ce qui est dessous
      const col = (a.div === 'plain' || a.div === 'bordure' || a.div === 'chevron') ? o : (a.div === 'chief' ? a.field : (a.div === 'fessband' || a.div === 'paleband') ? a.field : o);
      let pos;
      if (a.div === 'chief') pos = a.count === 1 ? [[50, 72]] : [[30, 17], [50, 17], [70, 17]];
      else if (a.div === 'fessband') pos = a.count === 1 ? [[50, 56]] : [[26, 56], [50, 56], [74, 56]];
      else if (a.div === 'paleband') pos = a.count === 1 ? [[50, 56]] : [[50, 26], [50, 56], [50, 86]];
      else if (a.div === 'chevron') pos = [[30, 28], [70, 28], [50, 92]].slice(0, a.count === 1 ? 0 : 3).concat(a.count === 1 ? [[50, 90]] : []);
      else pos = a.count === 1 ? [[50, 54]] : [[30, 34], [70, 34], [50, 80]];
      const sc = a.count === 1 ? 2.1 : 1.15;
      const stroke = a.charge === 'coquille' ? `stroke="${col === METALS.argent || col === METALS.or ? '#3a2a12' : '#f2ede2'}" stroke-width="1" ` : '';
      // pour les champs partis, la meuble alterne de couleur
      const alt = ['pale', 'fess', 'bend'].includes(a.div);
      for (const [x, y] of pos) {
        let c = col;
        if (alt) { const onOther = a.div === 'pale' ? x > 50 : a.div === 'fess' ? y > 58 : y < x * 1.2; c = onOther ? a.field : a.other; }
        g += `<path d="${CHARGES[a.charge]}" transform="translate(${x} ${y}) scale(${sc})" fill="${c}" ${stroke}/>`;
      }
    }
    return `<svg viewBox="0 0 100 120" width="${size}" height="${size * 1.2}" class="shield" aria-hidden="true"><defs><clipPath id="${id}"><path d="${SHIELD}"/></clipPath>
      <linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>
      <linearGradient id="${id}o" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6dc8a"/><stop offset=".5" stop-color="#b8862a"/><stop offset="1" stop-color="#f0cf6e"/></linearGradient></defs>
      <g clip-path="url(#${id})">${g}<rect width="100" height="120" fill="url(#${id}g)"/></g>
      <path d="${SHIELD}" fill="none" stroke="url(#${id}o)" stroke-width="4"/></svg>`;
  }

  // ---------- Portraits ----------
  const SKIN = ['#f2d4b8', '#ebc6a2', '#e0b48d', '#d2a07a', '#f4dcc6'];
  const HAIR = ['#24160e', '#3e2614', '#6a3f1f', '#94592a', '#b98a4a', '#d8b46a', '#5a1f12'];
  const ROBES = ['#6b2d2a', '#2d4a6b', '#3d5a3a', '#5b3d6b', '#7a5a22', '#4a4038'];
  function shade(hex, f) { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255; r = Math.round(Math.min(255, r * f)); g = Math.round(Math.min(255, g * f)); b = Math.round(Math.min(255, b * f)); return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1); }

  // p: {id, sex, age, traits[], ruler, heir, dead, robe, accent}
  function portraitSVG(p, size, houseSeed) {
    const r = prng(hash(String(p.id) + '|' + (houseSeed || '')));
    const id = nid('pt');
    const sk = p.traits.includes('maladif') ? '#e6dcc4' : pk(r, SKIN);
    const baseHair = pk(r, HAIR);
    const hair = p.age >= 64 ? '#e8e4dc' : p.age >= 50 ? (r() < 0.5 ? '#a49d93' : shade(baseHair, 1.5)) : baseHair;
    const robe = p.robe || pk(r, ROBES);
    const acc = p.accent || '#d6a62e';
    const child = p.age < 14;
    const M = p.sex === 'M';
    const style = Math.floor(r() * 3), beardStyle = Math.floor(r() * 4);
    const fw = 0.92 + r() * 0.16;
    const cruel = p.traits.includes('cruel'), brave = p.traits.includes('brave'), pieux = p.traits.includes('pieux'), sage = p.traits.includes('sage'), couard = p.traits.includes('couard'), charis = p.traits.includes('charismatique'), simplet = p.traits.includes('simplet'), era = p.era || 0;
    const hx = 17 * fw, hy = 21;
    const L = 50 - hx, R = 50 + hx;
    let s = '';
    // fond : niche en ogive
    s += `<rect width="100" height="120" fill="url(#${id}bg)"/>`;
    s += `<path d="M0 120 V44 Q0 6 50 4 Q100 6 100 44 V120 Z" fill="${p.dead ? '#3a3a40' : '#1a2c55'}" opacity=".9"/>`;
    s += `<g fill="${acc}" opacity=".18">${[18, 50, 82].map(x => `<path d="${CHARGES.fleur}" transform="translate(${x} ${x === 50 ? 16 : 28}) scale(.42)"/>`).join('')}</g>`;
    const body = child ? 'translate(50 120) scale(.84) translate(-50 -116)' : '';
    s += `<g transform="${body}">`;
    // cheveux arrière
    if (!M && style !== 0 && !child) s += `<path d="M${L - 3} 50 Q${L - 6} 92 ${L - 1} 104 L${R + 1} 104 Q${R + 6} 92 ${R + 3} 50 Z" fill="${hair}"/>`;
    if (M && style === 2 && p.age < 50) s += `<path d="M${L - 2} 48 Q${L - 4} 76 ${L + 2} 82 L${R - 2} 82 Q${R + 4} 76 ${R + 2} 48 Z" fill="${hair}"/>`;
    // voile de femme mariée (style 0)
    if (!M && style === 0 && !child) s += `<path d="M${L - 6} 44 Q${L - 8} 22 50 20 Q${R + 8} 22 ${R + 6} 44 L${R + 12} 106 Q50 96 ${L - 12} 106 Z" fill="${pieux ? '#f1ece2' : shade(robe, 1.35)}"/>`;
    // buste
    s += `<path d="M6 120 Q8 92 30 86 Q40 83 50 84 Q60 83 70 86 Q92 92 94 120 Z" fill="${robe}"/>`;
    s += `<path d="M6 120 Q8 92 30 86 Q40 83 50 84 Q60 83 70 86 Q92 92 94 120 Z" fill="url(#${id}fold)"/>`;
    // cou
    s += `<path d="M43 70 V86 Q50 90 57 86 V70 Z" fill="${shade(sk, 0.9)}"/>`;
    // col
    s += M ? `<path d="M36 86 Q50 96 64 86 L62 92 Q50 100 38 92 Z" fill="${acc}"/>`
      : `<path d="M34 87 Q50 100 66 87" fill="none" stroke="${acc}" stroke-width="2.4"/>${r() < 0.6 ? `<circle cx="50" cy="96" r="2.6" fill="${acc}"/><circle cx="50" cy="96" r="1.2" fill="#9e1d1d"/>` : ''}`;
    if (!child && era === 0 && M && brave && !p.ruler) s += `<path d="M30 88 Q50 80 70 88 L72 98 Q50 92 28 98 Z" fill="#9aa3aa"/><path d="M30 91 Q50 84 70 91 M29 95 Q50 88 71 95" stroke="#6b737a" stroke-width=".7" fill="none" stroke-dasharray="1.2 1"/>`;
    if (!child && era === 1) s += `<path d="M24 120 L30 92 Q50 100 70 92 L76 120" fill="none" stroke="${shade(acc, 0.85)}" stroke-width="1.6" opacity=".7"/><path d="M50 96 V120" stroke="${shade(robe, 0.7)}" stroke-width="1.2"/>`;
    if (!child && era === 2) s += `<path d="M34 92 Q36 78 43 76 L43 86 Q50 90 57 86 L57 76 Q64 78 66 92 Q50 98 34 92 Z" fill="${shade(robe, 0.82)}"/><path d="M36 84 Q50 92 64 84" fill="none" stroke="${acc}" stroke-width="1" opacity=".8"/>`;
    if (pieux && !child) s += `<path d="M50 96 v9 M46.5 99.5 h7" stroke="#f0d68a" stroke-width="1.8" stroke-linecap="round"/><path d="M45 88 Q50 95 55 88" fill="none" stroke="#cdb46a" stroke-width=".6"/>`;
    if (p.ruler && !child) s += `<path d="M14 120 Q20 98 34 92 L38 120 Z M86 120 Q80 98 66 92 L62 120 Z" fill="#f2ede2"/><g fill="#231e1a">${[[22, 108], [28, 114], [76, 108], [72, 114], [30, 101], [70, 101]].map(([x, y]) => `<path d="M${x} ${y - 2.4} L${x + 1.2} ${y + 1.6} L${x - 1.2} ${y + 1.6} Z"/>`).join('')}</g>`;
    // tête
    s += `<ellipse cx="50" cy="50" rx="${hx}" ry="${hy}" fill="${sk}"/>`;
    s += `<ellipse cx="50" cy="50" rx="${hx}" ry="${hy}" fill="url(#${id}face)"/>`;
    // oreilles
    if (M || style === 2) s += `<ellipse cx="${L + 0.5}" cy="52" rx="2.6" ry="4.4" fill="${shade(sk, 0.93)}"/><ellipse cx="${R - 0.5}" cy="52" rx="2.6" ry="4.4" fill="${shade(sk, 0.93)}"/>`;
    // yeux
    const ey = 49, ex = 7 * fw;
    const iris = pk(r, ['#3b2a1c', '#2d3d55', '#3c4a2e', '#4a3220']);
    for (const sx of [-1, 1]) {
      const x = 50 + sx * ex;
      s += `<path d="M${x - 4} ${ey} Q${x} ${ey - 3} ${x + 4} ${ey} Q${x} ${ey + 2.2} ${x - 4} ${ey} Z" fill="#f6efe2"/><circle cx="${x}" cy="${ey - 0.2}" r="1.7" fill="${iris}"/><circle cx="${x + 0.5}" cy="${ey - 0.7}" r=".45" fill="#fff"/>`;
      s += `<path d="M${x - 4.2} ${ey - 0.2} Q${x} ${ey - 3.4} ${x + 4.2} ${ey - 0.2}" fill="none" stroke="#3a2618" stroke-width=".9"/>`;
      const by = ey - 6, inner = cruel ? 2 : sage ? -0.8 : 0;
      s += `<path d="M${x - sx * 4.6} ${by + inner} Q${x} ${by - 1.8} ${x + sx * 4.6} ${by + 0.4}" fill="none" stroke="${p.age >= 64 ? '#cfc8be' : shade(hair === '#e8e4dc' ? '#7a6a5a' : hair, 0.85)}" stroke-width="1.5" stroke-linecap="round"/>`;
      if (p.age >= 45) s += `<path d="M${x + sx * 4.6} ${ey + 1} l${sx * 2} 1.4" stroke="${shade(sk, 0.75)}" stroke-width=".6" fill="none"/>`;
    }
    // nez
    s += `<path d="M50 ${ey + 1} Q48.3 ${ey + 9} 47.6 ${ey + 11} Q50 ${ey + 12.6} 52.6 ${ey + 11.2}" fill="none" stroke="${shade(sk, 0.72)}" stroke-width=".9" stroke-linecap="round"/>`;
    // bouche
    const my = 66;
    s += cruel ? `<path d="M45 ${my + 1} Q50 ${my - 1} 55 ${my + 1}" fill="none" stroke="#7a3a30" stroke-width="1.3" stroke-linecap="round"/><path d="M55 ${my + 1} l1.6 -1.2" stroke="#7a3a30" stroke-width="1"/>`
      : simplet ? `<ellipse cx="50" cy="${my + 0.8}" rx="3" ry="1.8" fill="#6a2a24"/><path d="M47 ${my} h6" stroke="#f3ead8" stroke-width=".7"/>`
      : charis ? `<path d="M44.5 ${my - 0.6} Q50 ${my + 4} 55.5 ${my - 0.6}" fill="#8a3a30" stroke="#8a3a30" stroke-width="1" stroke-linejoin="round"/><path d="M46 ${my + 0.2} Q50 ${my + 1.8} 54 ${my + 0.2}" fill="none" stroke="#f6efe2" stroke-width="1"/>`
      : `<path d="M45.5 ${my} Q50 ${my + 2.4} 54.5 ${my}" fill="none" stroke="#9a4a3e" stroke-width="1.3" stroke-linecap="round"/><path d="M47 ${my + 2.3} Q50 ${my + 3.4} 53 ${my + 2.3}" fill="none" stroke="${shade(sk, 0.82)}" stroke-width=".7"/>`;
    // joues
    if (!p.traits.includes('maladif')) s += `<ellipse cx="${50 - 10 * fw}" cy="58" rx="4" ry="2.4" fill="#d9776a" opacity=".22"/><ellipse cx="${50 + 10 * fw}" cy="58" rx="4" ry="2.4" fill="#d9776a" opacity=".22"/>`;
    else s += `<path d="M${50 - ex - 4} ${ey + 3.5} q4 2 8 0 M${50 + ex - 4} ${ey + 3.5} q4 2 8 0" stroke="#9b8f7c" stroke-width=".8" fill="none"/>`;
    if (p.age >= 40) s += `<path d="M${50 - 6 * fw} 58 Q${50 - 8.5 * fw} 63 ${50 - 7 * fw} 67 M${50 + 6 * fw} 58 Q${50 + 8.5 * fw} 63 ${50 + 7 * fw} 67" stroke="${shade(sk, 0.78)}" stroke-width=".6" fill="none"/>`;
    if (p.age >= 58) s += `<path d="M${50 - ex - 3} ${ey + 3} q3 1.6 6 0 M${50 + ex - 3} ${ey + 3} q3 1.6 6 0" stroke="${shade(sk, 0.72)}" stroke-width=".55" fill="none"/><circle cx="${50 - 11 * fw}" cy="44" r=".9" fill="${shade(sk, 0.82)}"/><circle cx="${50 + 12 * fw}" cy="61" r=".7" fill="${shade(sk, 0.82)}"/>`;
    if (cruel && p.age >= 16) s += `<path d="M${50 - ex - 4} ${ey + 1.6} q4 1.8 8 0 M${50 + ex - 4} ${ey + 1.6} q4 1.8 8 0" stroke="#4a2a3a" stroke-width=".9" opacity=".45" fill="none"/>`;
    if (couard && p.age >= 10) s += `<path d="M${50 - 3} ${ey - 9} q-2 1 -4 0 M${50 + 3} ${ey - 9} q2 1 4 0" stroke="${shade(sk, 0.7)}" stroke-width=".6" fill="none"/>`;
    if (p.age >= 52) s += `<path d="M42 37 q8 -1.6 16 0 M43.5 40 q6.5 -1.2 13 0" stroke="${shade(sk, 0.8)}" stroke-width=".6" fill="none"/>`;
    if (brave && p.age >= 16) s += `<path d="M${R - 7} 42 l-3 13" stroke="#a5574a" stroke-width="1" stroke-linecap="round"/>`;
    // barbe
    if (M && p.age >= 19 && beardStyle > 0) {
      if (beardStyle === 1) s += `<path d="M45 ${my - 1.6} Q50 ${my - 4} 55 ${my - 1.6} Q50 ${my - 2.6} 45 ${my - 1.6} Z" fill="${hair}"/><path d="M47 ${my + 4} Q50 ${my + 9} 53 ${my + 4} Z" fill="${hair}"/>`;
      else if (beardStyle === 2) s += `<path d="M${L + 1} 52 Q${L + 2} 72 50 75 Q${R - 2} 72 ${R - 1} 52 Q${R - 4} 66 56 ${my + 3} Q50 ${my + 5} 44 ${my + 3} Q${L + 4} 66 ${L + 1} 52 Z" fill="${hair}"/><path d="M44 ${my - 1.2} Q50 ${my - 4.4} 56 ${my - 1.2} Q50 ${my - 2.4} 44 ${my - 1.2} Z" fill="${hair}"/>`;
      else s += `<path d="M${L + 1} 50 Q${L} 74 44 84 L50 80 L56 84 Q${R} 74 ${R - 1} 50 Q${R - 4} 66 56 ${my + 3} Q50 ${my + 5} 44 ${my + 3} Q${L + 4} 66 ${L + 1} 50 Z" fill="${hair}"/><path d="M43.5 ${my - 1} Q50 ${my - 4.8} 56.5 ${my - 1} Q50 ${my - 2.4} 43.5 ${my - 1} Z" fill="${hair}"/>`;
    }
    // cheveux avant
    const bald = M && p.age >= 55 && r() < 0.6, tonsure = M && pieux && !p.ruler && !p.heir && p.age >= 16;
    if (M) {
      if (bald) s += `<path d="M${L - 1} 50 Q${L - 2} 36 ${L + 5} 33 Q${L + 2} 42 ${L + 2} 50 Z M${R + 1} 50 Q${R + 2} 36 ${R - 5} 33 Q${R - 2} 42 ${R - 2} 50 Z" fill="${hair}"/>`;
      else if (style === 0) s += `<path d="M${L - 2} 52 Q${L - 4} 26 50 26 Q${R + 4} 26 ${R + 2} 52 L${R - 1} 52 Q${R - 2} 40 ${R - 6} 39 L${L + 6} 39 Q${L + 2} 40 ${L + 1} 52 Z" fill="${hair}"/>`;
      else if (style === 1) s += `<path d="M${L - 2} 56 Q${L - 5} 25 50 26 Q${R + 5} 25 ${R + 2} 56 Q${R - 1} 42 ${R - 9} 37 Q50 40 ${L + 6} 35 Q${L} 42 ${L - 2} 56 Z" fill="${hair}"/>`;
      else s += `<path d="M${L - 2} 58 Q${L - 5} 25 50 26 Q${R + 5} 25 ${R + 2} 58 L${R} 44 Q50 32 ${L} 44 Z" fill="${hair}"/>`;
    } else if (style === 0 && !child) {
      s += `<path d="M${L - 1} 47 Q50 26 ${R + 1} 47" fill="none" stroke="${pieux ? '#d9d2c4' : shade(robe, 1.15)}" stroke-width="5"/><path d="M${L + 3} 74 Q50 82 ${R - 3} 74 L${R - 1} 78 Q50 88 ${L + 1} 78 Z" fill="#f1ece2"/>`;
    } else {
      s += `<path d="M${L - 2} 54 Q${L - 4} 26 50 26 Q${R + 4} 26 ${R + 2} 54 Q${R - 1} 40 52 34 Q50 36 48 34 Q${L + 1} 40 ${L - 2} 54 Z" fill="${hair}"/>`;
      if (style === 1 && !child) s += `<path d="M${L - 2} 56 q-2 10 1 22 q2 -10 -1 -22 M${R + 2} 56 q2 10 -1 22 q-2 -10 1 -22" fill="${shade(hair, 0.85)}" stroke="${shade(hair, 0.85)}" stroke-width="3"/>`;
    }
    if (tonsure && !bald) s += `<ellipse cx="50" cy="29.5" rx="7" ry="2.6" fill="${shade(sk, 0.96)}"/><ellipse cx="50" cy="29.5" rx="7" ry="2.6" fill="url(#${id}face)"/>`;
    // couronne / diadème
    if (p.ruler) {
      const cy = M && style === 0 && !bald ? 29 : 30;
      s += `<g transform="translate(0 ${cy - 30})"><path d="M${L - 1} 34 L${L - 3} 18 L${L + 6} 26 L${50 - 6} 14 L50 24 L${50 + 6} 14 L${R - 6} 26 L${R + 3} 18 L${R + 1} 34 Z" fill="url(#${id}gold)" stroke="#7a5512" stroke-width=".6"/>
      <rect x="${L - 1}" y="31" width="${2 * hx + 2}" height="4.4" fill="url(#${id}gold)" stroke="#7a5512" stroke-width=".5"/>
      <circle cx="50" cy="33.2" r="1.7" fill="#b3261e"/><circle cx="${L + 5}" cy="33.2" r="1.3" fill="#1d4b97"/><circle cx="${R - 5}" cy="33.2" r="1.3" fill="#1d4b97"/>
      ${[L - 3, 50 - 6, 50 + 6, R + 3].map(x => `<circle cx="${x}" cy="${x === L - 3 || x === R + 3 ? 17.4 : 13.4}" r="1.6" fill="#f6dc8a"/>`).join('')}</g>`;
    } else if (p.heir && !child) {
      s += `<path d="M${L} 35 Q50 31 ${R} 35" fill="none" stroke="url(#${id}gold)" stroke-width="2.2"/><circle cx="50" cy="32.4" r="1.4" fill="#b3261e"/>`;
    }
    s += '</g>';
    const defs = `<defs>
      <radialGradient id="${id}bg" cx=".5" cy=".3" r=".9"><stop offset="0" stop-color="#2a3f70"/><stop offset="1" stop-color="#0e1730"/></radialGradient>
      <radialGradient id="${id}face" cx=".38" cy=".35" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".7" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#5a2a10" stop-opacity=".22"/></radialGradient>
      <linearGradient id="${id}fold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset=".35" stop-color="#fff" stop-opacity=".08"/><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".4"/></linearGradient>
      <linearGradient id="${id}gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbe7a1"/><stop offset=".5" stop-color="#c9922c"/><stop offset="1" stop-color="#f3d27a"/></linearGradient></defs>`;
    return `<svg viewBox="0 0 100 120" width="${size}" height="${size * 1.2}" class="portrait${p.dead ? ' dead' : ''}" aria-hidden="true">${defs}${s}</svg>`;
  }

  // ---------- Icônes (traits à la plume, 48×48) ----------
  const IC = {
    impots: '<ellipse cx="24" cy="33" rx="13" ry="4"/><path d="M11 33 V27 M37 33 V27"/><ellipse cx="24" cy="27" rx="13" ry="4"/><ellipse cx="20" cy="17" rx="9" ry="3"/><path d="M11 17 V13 M29 17 V13"/><ellipse cx="20" cy="13" rx="9" ry="3"/><path d="M33 9 l3 3 l3 -3 M36 12 v8"/>',
    festin: '<path d="M15 8 H33 Q33 24 24 26 Q15 24 15 8 Z"/><path d="M24 26 V38 M16 40 H32"/><path d="M17 13 H31"/><circle cx="38" cy="10" r="1.4"/><circle cx="10" cy="16" r="1"/>',
    recruter: '<path d="M12 30 Q12 10 24 9 Q36 10 36 30 L33 38 H15 Z"/><path d="M24 9 V38 M15 24 H33"/><path d="M18 28 h3 M27 28 h3"/><path d="M24 9 Q30 2 38 4"/>',
    campagne: '<path d="M10 38 L34 10 M34 10 l2 -3 l3 3 l-3 2 Z M14 30 l4 4 M8 40 l4 -4"/><path d="M38 38 L14 10 M14 10 l-2 -3 l-3 3 l3 2 Z M34 30 l-4 4 M40 40 l-4 -4"/>',
    construire: '<path d="M12 40 V18 H10 V10 H15 V14 H19 V10 H24 V14 H28 V10 H33 V14 H38 V10 H38 V18 H36 V40 Z"/><path d="M20 40 V32 Q24 27 28 32 V40"/><path d="M17 22 v4 M31 22 v4"/><path d="M24 10 V3 l6 2 l-6 2"/>',
    ambassade: '<path d="M12 10 H34 Q38 10 38 14 V34 Q38 38 34 38 H14"/><path d="M12 10 Q8 10 8 14 Q8 18 12 18 H16 V34 Q16 38 12 38 Q8 38 8 34"/><path d="M21 18 H32 M21 23 H32 M21 28 H28"/><circle cx="31" cy="35" r="3.5" fill="currentColor" opacity=".7"/>',
    eduquer: '<path d="M24 14 Q16 8 8 10 V36 Q16 34 24 39 Q32 34 40 36 V10 Q32 8 24 14 Z M24 14 V39"/><path d="M12 17 Q16 16 20 18 M12 22 Q16 21 20 23 M28 18 Q32 16 36 17 M28 23 Q32 21 36 22"/>',
    marier: '<circle cx="18" cy="28" r="9"/><circle cx="30" cy="28" r="9"/><path d="M27 15 l3 -5 l3 5 l-3 3 Z"/>',
    adopter: '<path d="M8 26 Q24 42 40 26"/><path d="M8 26 H40"/><path d="M12 34 L9 40 M36 34 L39 40"/><circle cx="20" cy="20" r="5"/><path d="M25 20 Q32 18 36 26"/>',
    repos: '<path d="M10 26 Q18 14 30 18 Q36 12 40 14 Q36 16 35 20 Q34 30 22 32 Q14 32 10 26 Z"/><circle cx="34" cy="16" r=".9" fill="currentColor"/><path d="M14 30 Q12 38 18 40 M22 32 Q22 38 26 40"/><path d="M6 12 Q10 8 14 10 M8 16 Q11 13 13 15"/>',
    peste: '<path d="M14 22 Q14 9 24 9 Q34 9 34 22 Q34 28 30 30 V36 H18 V30 Q14 28 14 22 Z"/><circle cx="19.5" cy="21" r="3"/><circle cx="28.5" cy="21" r="3"/><path d="M24 25 l-1.5 3 h3 Z M21 36 v-3 M24 36 v-3 M27 36 v-3"/>',
    recolte: '<path d="M24 42 V14 M24 42 L16 18 M24 42 L32 18 M24 42 L12 24 M24 42 L36 24"/><path d="M24 14 Q21 10 24 6 Q27 10 24 14 M16 18 Q12 15 14 10 Q18 13 16 18 M32 18 Q36 15 34 10 Q30 13 32 18"/><path d="M18 34 H30"/>',
    revolte: '<path d="M24 44 V14 M16 6 V14 Q16 18 24 18 Q32 18 32 14 V6 M24 6 V18"/><path d="M36 26 Q40 20 36 14 Q42 18 40 24 Q44 22 42 28 Q40 32 36 30 Z M38 30 V44"/>',
    marchand: '<path d="M6 30 H42 L37 39 H11 Z"/><path d="M24 30 V6 M24 8 Q36 14 24 26 M24 8 Q12 14 24 26"/><path d="M4 43 Q10 40 16 43 Q22 46 28 43 Q34 40 44 43"/>',
    bebe: '<path d="M14 24 Q14 14 24 14 Q34 14 34 24 Q34 38 24 40 Q14 38 14 24 Z"/><circle cx="24" cy="21" r="5"/><path d="M16 28 Q24 34 32 28 M16 33 Q24 38 32 33"/>',
    complot: '<path d="M24 4 L28 26 H20 Z M16 26 H32 M24 26 V36 M21 36 H27 Q27 42 24 42 Q21 42 21 36"/><path d="M8 14 Q4 24 10 34 M40 14 Q44 24 38 34"/>',
    eglise: '<path d="M24 4 V10 M21 7 H27 M24 10 L16 22 V42 H32 V22 Z"/><path d="M8 42 V28 L16 22 M40 42 V28 L32 22 M8 42 H40"/><path d="M21 42 V34 Q24 30 27 34 V42 M24 16 v4"/>',
    tournoi: '<path d="M6 42 L38 6 M38 6 l3 1 -1 3 M42 42 L10 6 M10 6 l-3 1 1 3"/><path d="M18 22 H30 V30 Q30 38 24 40 Q18 38 18 30 Z"/>',
    croisade: '<path d="M20 4 H28 V16 H40 V24 H28 V44 H20 V24 H8 V16 H20 Z"/>',
    mine: '<path d="M10 14 Q24 2 38 14 Q24 8 10 14 Z M24 8 L24 8 M23 10 L13 42 M25 10 L35 42"/><path d="M6 44 Q14 36 22 44 M28 44 Q34 38 42 44"/><circle cx="34" cy="30" r="1.5" fill="currentColor"/><circle cx="14" cy="34" r="1" fill="currentColor"/>',
    banniere: '<path d="M12 44 V4 M12 6 H38 L32 14 L38 22 H12"/><path d="M18 11 L22 15 L28 9"/>',
    astres: '<path d="M30 8 A14 14 0 1 0 40 30 A11 11 0 1 1 30 8 Z"/><path d="M14 8 l1.5 3.5 l3.5 1.5 l-3.5 1.5 l-1.5 3.5 l-1.5 -3.5 l-3.5 -1.5 l3.5 -1.5 Z M38 40 l1 2 l2 1 l-2 1 l-1 2 l-1 -2 l-2 -1 l2 -1 Z"/>',
    plume: '<path d="M8 40 H30 Q34 40 34 36 V12"/><path d="M40 4 Q24 8 20 28 L22 30 Q40 24 40 4 Z M20 28 L14 36"/><path d="M12 30 H22 M12 34 H18"/>',
    fiole: '<path d="M20 6 H28 M21 6 V16 Q12 20 12 30 Q12 42 24 42 Q36 42 36 30 Q36 20 27 16 V6"/><path d="M14 30 Q24 26 34 30"/><circle cx="21" cy="35" r="1.5" fill="currentColor"/><circle cx="27" cy="33" r="1" fill="currentColor"/>',
    dette: '<path d="M24 6 V40 M10 40 H38 M8 14 H40 M8 14 L4 26 Q8 30 12 26 Z M40 14 L36 26 Q40 30 44 26 Z"/><circle cx="24" cy="6" r="2"/>',
    pelerinage: '<path d="M14 44 L22 6"/><path d="M22 6 Q26 4 27 8"/><path d="M30 20 L40 32 Q40 40 32 40 Q24 40 24 32 Z"/><path d="M28 26 L32 40 M34 25 L32 40 M37 29 L32 40"/>',
    mercenaires: '<path d="M10 30 Q10 12 22 11 Q34 12 34 30 L31 38 H13 Z"/><path d="M22 11 V38 M13 25 H31"/><circle cx="37" cy="34" r="7"/><path d="M37 30 v8 M35 32 h4"/>',
    epees: '<path d="M10 38 L34 10 M34 10 l2 -3 l3 3 l-3 2 Z M14 30 l4 4"/><path d="M38 38 L14 10 M14 10 l-2 -3 l-3 3 l3 2 Z M34 30 l-4 4"/>',
    or: '<ellipse cx="24" cy="30" rx="13" ry="4.5"/><path d="M11 30 V22 M37 30 V22"/><ellipse cx="24" cy="22" rx="13" ry="4.5"/>',
    armee: '<path d="M12 30 Q12 10 24 9 Q36 10 36 30 L33 38 H15 Z"/><path d="M24 9 V38 M15 24 H33"/>',
    prestige: '<path d="M24 40 Q8 34 8 14 M24 40 Q40 34 40 14"/><path d="M10 20 q4 0 5 -4 M9 27 q5 0 6 -4 M12 33 q5 1 7 -3 M38 20 q-4 0 -5 -4 M39 27 q-5 0 -6 -4 M36 33 q-5 1 -7 -3"/><path d="M24 10 l2 4.5 l5 .7 l-3.6 3.5 l.9 5 l-4.3 -2.4 l-4.3 2.4 l.9 -5 l-3.6 -3.5 l5 -.7 Z"/>',
    domaine: '<path d="M6 40 L18 18 L26 30 L32 22 L42 40 Z"/><path d="M18 18 V8 l6 2 l-6 2"/>',
  };
  const EVENT_ICON = { peste: 'peste', recolte: 'recolte', revolte: 'revolte', marchand: 'marchand', batard: 'bebe', complot: 'complot', eveque: 'eglise', tournoi: 'tournoi', croisade: 'croisade', mine: 'mine', heritier_rebelle: 'banniere', brigands: 'epees', astrologue: 'astres', heresie: 'eglise', vassal: 'banniere', chroniqueur: 'plume', maladie: 'fiole', proposition: 'marier', jumeaux: 'bebe', dette: 'dette', albigeois: 'croisade', bouvines: 'epees', foires: 'marchand', templiers: 'croisade', famine: 'recolte', centans: 'banniere', peste_noire: 'peste', jacquerie: 'revolte', prodige: 'eduquer', conseil_conjoint: 'marier', universite: 'eduquer', cathedrale: 'eglise', condottiere: 'mercenaires', comete: 'astres', duel: 'tournoi', insulte: 'banniere', veuve: 'marier', relique: 'croisade', mesalliance: 'marier', heritier_ost: 'campagne', rival_defi: 'tournoi', rival_noces: 'marier', rival_trahison: 'complot', rival_chute: 'epees', rival_treve: 'eglise', baron_felon: 'banniere', croise_retour: 'croisade', guilde: 'marchand', pont_pierre: 'construire', grandes_compagnies: 'mercenaires', flagellants: 'peste', guerisseuse: 'fiole', guerisseuse_2: 'fiole', carte_templier: 'croisade', carte_templier_2: 'croisade', pretendant: 'bebe', pretendant_2: 'banniere', conseiller_felon: 'complot', conseil_preseance: 'banniere', voeu_croisade: 'croisade', voeu_croisade_2: 'croisade', amour_secret: 'marier', amour_secret_2: 'marier', voisin_raid: 'epees', voisin_secours: 'banniere', voisin_arbitrage: 'banniere', voisin_noces: 'marier', choix_regent: 'banniere', usurpation: 'complot', freres_rivaux: 'epees', testament: 'plume', pastoureaux: 'revolte', cassel: 'epees', centans_2: 'banniere', salaires: 'recolte' };
  function icon(name, size, extra) { return `<svg viewBox="0 0 48 48" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra || ''}>${IC[name] || ''}</svg>`; }

  // ---------- Carte du royaume (Voronoï découpé) ----------
  function clipPoly(poly, a, b, c) { // garde a*x+b*y <= c
    const out = []; for (let i = 0; i < poly.length; i++) {
      const P = poly[i], Q = poly[(i + 1) % poly.length];
      const pin = a * P[0] + b * P[1] <= c, qin = a * Q[0] + b * Q[1] <= c;
      if (pin) out.push(P);
      if (pin !== qin) { const t = (c - a * P[0] - b * P[1]) / (a * (Q[0] - P[0]) + b * (Q[1] - P[1])); out.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]); }
    } return out;
  }
  const mapCache = {};
  function buildMap(seed) {
    if (mapCache[seed]) return mapCache[seed];
    const r = prng(hash('map' + seed));
    const W = 340, H = 240, n = 15;
    // contour de terre irrégulier
    const coast = []; const K = 90; const ph = [r() * 6, r() * 6, r() * 6];
    for (let i = 0; i < K; i++) { const a = i / K * Math.PI * 2; const rad = 1 + 0.1 * Math.sin(a * 3 + ph[0]) + 0.06 * Math.sin(a * 5 + ph[1]) + 0.035 * Math.sin(a * 11 + ph[2]); coast.push([W / 2 + Math.cos(a) * W * 0.44 * rad, H / 2 + Math.sin(a) * H * 0.42 * rad]); }
    const sites = []; let tries = 0;
    while (sites.length < n && tries++ < 2000) {
      const p = [W * 0.12 + r() * W * 0.76, H * 0.14 + r() * H * 0.72];
      if (sites.every(q => Math.hypot(p[0] - q[0], p[1] - q[1]) > 46)) sites.push(p);
    }
    // capitale = site le plus proche du centre ; ordre d'expansion = distance à la capitale
    sites.sort((a, b) => Math.hypot(a[0] - W / 2, a[1] - H / 2) - Math.hypot(b[0] - W / 2, b[1] - H / 2));
    const cap = sites[0];
    const rest = sites.slice(1).sort((a, b) => Math.hypot(a[0] - cap[0], a[1] - cap[1]) - Math.hypot(b[0] - cap[0], b[1] - cap[1]));
    const ordered = [cap, ...rest];
    const cells = ordered.map((s, i) => {
      let poly = coast.slice();
      ordered.forEach((o, j) => { if (j === i) return; const a = o[0] - s[0], b = o[1] - s[1], c = (o[0] * o[0] + o[1] * o[1] - s[0] * s[0] - s[1] * s[1]) / 2; poly = clipPoly(poly, a, b, c); });
      return { site: s, poly };
    });
    const trees = []; for (let i = 0; i < 70; i++) trees.push([r() * W, r() * H, r()]);
    return (mapCache[seed] = { W, H, coast, cells, trees });
  }
  const pathOf = poly => 'M' + poly.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L') + ' Z';
  function inside(poly, x, y) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) c = !c; } return c; }
  function mapSVG(seed, house, domains, builds, menace, alliances, opt) {
    opt = opt || {};
    const m = buildMap(seed), a = arms(house), id = nid('mp');
    let s = `<defs><pattern id="${id}h" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><path d="M0 0 V6" stroke="#8c7350" stroke-width=".7" opacity=".45"/></pattern>
      <filter id="${id}r"><feTurbulence type="fractalNoise" baseFrequency=".04" numOctaves="2" seed="${hash(seed + '') % 100}"/><feDisplacementMap in="SourceGraphic" scale="3"/></filter></defs>`;
    // mer
    s += `<rect width="${m.W}" height="${m.H}" fill="#c9d3c4"/>`;
    for (let i = 0; i < 9; i++) s += `<path d="M${10 + (i * 47) % 320} ${12 + (i * 71) % 220} q5 -3 10 0 q5 3 10 0" fill="none" stroke="#7d9187" stroke-width=".8" opacity=".6"/>`;
    s += `<g filter="url(#${id}r)"><path d="${pathOf(m.coast)}" fill="#e7d6ae" stroke="#5b4428" stroke-width="2"/>`;
    m.cells.forEach((c, i) => {
      if (c.poly.length < 3) return;
      const own = i < domains;
      s += `<path class="${i === opt.fresh ? 'fresh' : i === opt.lost ? 'lostr' : ''}" d="${pathOf(c.poly)}" fill="${own ? a.robe : 'url(#' + id + 'h)'}" fill-opacity="${own ? 0.55 : 1}" stroke="#6b5230" stroke-width="1" stroke-dasharray="${own ? '' : '3 2'}"/>`;
    });
    s += '</g>';
    // forêts & monts sur terres libres
    for (const [x, y, k] of m.trees) {
      if (!inside(m.coast, x, y)) continue;
      const ci = m.cells.findIndex(c => c.poly.length > 2 && inside(c.poly, x, y));
      if (ci >= 0 && ci < domains) continue;
      s += k < 0.55 ? `<path d="M${x} ${y} l-3 6 h6 Z M${x} ${y + 6} v2" fill="#6f7d4c" stroke="#4a5532" stroke-width=".6"/>` : `<path d="M${x - 6} ${y + 5} L${x} ${y - 4} L${x + 6} ${y + 5}" fill="none" stroke="#6b5230" stroke-width="1"/>`;
    }
    // châteaux dans les domaines possédés
    m.cells.forEach((c, i) => {
      if (i >= domains) return; const [x, y] = c.site;
      if (i === 0) s += `<g transform="translate(${x - 14} ${y - 20}) scale(.6)" stroke="#2b1e12" stroke-width="2.6" fill="#f3e6c6">${IC.construire}</g>`;
      else s += `<g transform="translate(${x - 7} ${y - 9})"><path d="M2 14 V5 H0 V1 H3 V3 H5 V1 H9 V3 H11 V1 H14 V5 H12 V14 Z" fill="#f3e6c6" stroke="#2b1e12" stroke-width="1"/></g>`;
    });
    // menace aux frontières
    const flames = Math.min(5, Math.floor(menace / 20));
    m.cells.forEach((c, i) => { if (i < domains || i >= domains + flames) return; const [x, y] = c.site; s += `<g transform="translate(${x - 8} ${y - 10})"><g class="flame" style="animation-delay:${(i % 5) * -0.37}s"><path d="M8 18 Q0 14 3 7 Q5 10 6 8 Q5 3 9 0 Q9 5 13 7 Q16 13 8 18 Z" fill="#b3261e" opacity=".85"/><path d="M8 17 Q4 14 6 10 Q7 12 8 11 Q8 8 10 6 Q10 10 11 12 Q12 15 8 17 Z" fill="#f0a33a"/></g></g>`; });
    // rose des vents & cartouche
    s += `<g transform="translate(${m.W - 34} ${m.H - 34})" stroke="#5b4428" fill="none" stroke-width="1"><circle r="12"/><path d="M0 -16 L3 0 L0 16 L-3 0 Z M-16 0 L0 3 L16 0 L0 -3 Z" fill="#e7d6ae"/><text y="-19" text-anchor="middle" font-size="8" fill="#5b4428" stroke="none" font-family="Alegreya, serif">N</text></g>`;
    return `<svg viewBox="0 0 ${m.W} ${m.H}" class="map" role="img" aria-label="Carte du royaume : ${domains} domaines">${s}</svg>`;
  }

  root.Art = { impaledSVG, shieldSVG, portraitSVG, icon, EVENT_ICON, mapSVG, arms, hash };
})(typeof window !== 'undefined' ? window : globalThis);
