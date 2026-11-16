/* ===== Le Trône de Braise — identité visuelle des profondeurs =====
   « Braise & lapis » : ombres bleu nuit, lumières de braise, blasons des maisons, braises qui montent partout.
   Chaque type de donjon du royaume a sa palette, sa lumière (celle du donjon 2D), son air (spores, neige, brume, cendre…),
   ses monstres et son gardien. Le moteur (géométrie, textures de base) reste celui de Valdragon : base = 0 crypte, 1 caverne, 2 forge, 3 glace. */
export const THEMES = {
 crypte:     { nom: 'Crypte', base: 0, fog: 0x070a13, amb: 0x26324e, light: 0xffb35c, kt: [.55, .56, .63], grade: { tint: [.98, .98, 1.03], sat: .84, con: 1.12, vig: .72 }, air: 'cendre' },
 catacombes: { nom: 'Catacombes', base: 0, fog: 0x0b0806, amb: 0x3a2c24, light: 0xffa94a, kt: [.63, .55, .47], grade: { tint: [1.04, .98, .93], sat: .86, con: 1.12, vig: .7 }, air: 'braises' },
 mine:       { nom: 'Mine abandonnée', base: 1, fog: 0x0a0806, amb: 0x34281c, light: 0xffc070, kt: [.56, .47, .37], grade: { tint: [1.05, .99, .9], sat: .84, con: 1.1, vig: .7 }, air: 'poussiere', ecl: .85 },
 foret:      { nom: 'Bois maudit', base: 1, fog: 0x050f08, amb: 0x1c3a22, light: 0xd7ff9a, kt: [.38, .47, .33], grade: { tint: [.94, 1.03, .92], sat: .82, con: 1.12, vig: .74 }, air: 'spores', ecl: .75 },
 marais:     { nom: 'Marais noyé', base: 1, fog: 0x07120f, amb: 0x1a3a36, light: 0x9fffd0, kt: [.34, .43, .4], grade: { tint: [.9, 1.02, 1.0], sat: .78, con: 1.1, vig: .76 }, air: 'lucioles' },
 glace:      { nom: 'Faille gelée', base: 3, fog: 0x081222, amb: 0x2a3e5e, light: 0xbfe4ff, kt: [.42, .5, .62], grade: { tint: [.92, .98, 1.08], sat: .8, con: 1.1, vig: .7 }, air: 'neige', ecl: .1 },
 egouts:     { nom: 'Égouts anciens', base: 0, fog: 0x0a0c07, amb: 0x2a3020, light: 0xffd27a, kt: [.47, .5, .41], grade: { tint: [1.0, 1.02, .9], sat: .8, con: 1.1, vig: .74 }, air: 'gouttes' },
 antre:      { nom: 'Antre du dragon', base: 2, fog: 0x150503, amb: 0x4a1a0c, light: 0xff7a3a, kt: [.64, .42, .33], grade: { tint: [1.08, .95, .88], sat: .92, con: 1.14, vig: .68 }, air: 'braises', ecl: 2.6, eclGris: .85, eclGroupe: .7 },
 arene:      { nom: 'Champ de bataille', base: 0, fog: 0x0d0b09, amb: 0x3a3228, light: 0xffd890, kt: [.6, .56, .5], grade: { tint: [1.04, 1.0, .94], sat: .88, con: 1.1, vig: .66 }, air: 'braises' },
};
// ecl : force de l'éclairage d'exploration (1 par défaut ; antre sombre par nature 2.6, mine .85, Bois maudit .75, Faille gelée déjà claire .1) ; eclGris : part de gris neutre dans la teinte d'ambiance (.55 par défaut, antre .85 pour ne pas rougir le sol) ; eclGroupe : force du projecteur et de la lanterne du groupe (antre .7) — voir buildFloor dans g3d.js
// lumière de lune lapis commune à tous les donjons (contre-jour froid), et teinte des braises
export const LAPIS = 0x3d63a3, BRAISE = 0xff7a2a;
// monstres, noms et gardiens : dans pont.js (utilisés aussi par le simulateur)
// blason d'une maison sur toile (bannières, sol de l'arène)
export function blason(c1, c2, emb, w = 256, h = 384, sol = false) {
 const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
 if (sol) { g.translate(w / 2, h / 2); g.beginPath(); g.arc(0, 0, w / 2 - 4, 0, 7); g.fillStyle = c1; g.fill(); g.lineWidth = w / 24; g.strokeStyle = c2; g.stroke(); g.scale(.62, .62); g.translate(-w / 2, -h / 2 + h * .06); }
 else {
  // bannière à queue d'aronde, bord doré
  g.fillStyle = c1; g.beginPath(); g.moveTo(0, 0); g.lineTo(w, 0); g.lineTo(w, h); g.lineTo(w / 2, h * .82); g.lineTo(0, h); g.closePath(); g.fill();
  g.strokeStyle = c2; g.lineWidth = w / 28; g.beginPath(); g.moveTo(w * .06, 0); g.lineTo(w * .06, h * .93); g.moveTo(w * .94, 0); g.lineTo(w * .94, h * .93); g.stroke();
  g.fillStyle = 'rgba(0,0,0,.25)'; for (let i = 0; i < 6; i++) g.fillRect(w * (.12 + i * .15), 0, w * .02, h * .8);
 }
 const cx = w / 2, cy = sol ? h / 2 : h * .4, r = Math.min(w, h) * .3; g.fillStyle = c2; g.strokeStyle = c2; g.lineWidth = r * .12; g.lineJoin = 'round';
 const P = (pts) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(cx + x * r, cy + y * r) : g.moveTo(cx + x * r, cy + y * r)); g.closePath(); g.fill(); };
 switch (emb) {
  case 'tour': P([[-.55, 1], [-.55, -.5], [-.75, -.5], [-.75, -.95], [-.45, -.95], [-.45, -.75], [-.15, -.75], [-.15, -.95], [.15, -.95], [.15, -.75], [.45, -.75], [.45, -.95], [.75, -.95], [.75, -.5], [.55, -.5], [.55, 1]]); break;
  case 'dragon': P([[-1, .2], [-.3, -.2], [-.1, -.9], [.15, -.3], [.9, -.6], [.5, .1], [.9, .6], [.2, .4], [0, 1], [-.25, .35]]); break;
  case 'corbeau': P([[-1, .1], [-.2, -.35], [.2, -.7], [.5, -.55], [.95, -.6], [.55, -.35], [.4, .1], [.9, .8], [.1, .35], [-.5, .5]]); break;
  case 'cerf': P([[-.35, 1], [-.3, .1], [-.7, -.3], [-.9, -.95], [-.55, -.45], [-.2, -.3], [0, -.55], [.2, -.3], [.55, -.45], [.9, -.95], [.7, -.3], [.3, .1], [.35, 1]]); break;
  case 'loup': P([[-.8, 1], [-.6, -.1], [-.75, -.9], [-.3, -.45], [.3, -.45], [.75, -.9], [.6, -.1], [.8, 1], [0, .6]]); break;
  case 'soleil': g.beginPath(); g.arc(cx, cy, r * .5, 0, 7); g.fill(); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; g.beginPath(); g.moveTo(cx + Math.cos(a) * r * .6, cy + Math.sin(a) * r * .6); g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); g.stroke(); } break;
  case 'vague': for (let k = 0; k < 3; k++) { g.beginPath(); for (let i = 0; i <= 20; i++) { const x = -1 + i / 10, y = -.5 + k * .5 + Math.sin(i * .9) * .18; i ? g.lineTo(cx + x * r, cy + y * r) : g.moveTo(cx + x * r, cy + y * r); } g.stroke(); } break;
  default: P([[-.12, 1], [-.12, -.2], [-.5, -.2], [-.5, -.42], [-.12, -.42], [-.12, -1], [.12, -1], [.12, -.42], [.5, -.42], [.5, -.2], [.12, -.2], [.12, 1]]);
 }
 return c;
}
