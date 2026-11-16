/* Pont entre Le Trône de Braise et le donjon 3D au tour par tour (moteur repris de Valdragon).
   Chargé dans la page du royaume (window.PONT3D) et par les simulateurs Node (require). */
(function (root) {
 const CLS = { chevalier: 'guerrier', arcaniste: 'mage', rodeur: 'rodeuse' };
 const COMP = { ecuyer: 'guerrier', pretresse: 'mage', arbaletriere: 'rodeuse' };
 const NOMS = { guerrier: 'Sergent d’armes', mage: 'Sœur guérisseuse', rodeuse: 'Éclaireuse' };
 const RAR = ['normal', 'magique', 'rare', 'legendaire'];
 const BIOME = { crypte: 0, catacombes: 0, foret: 1, marais: 1, egouts: 1, mine: 2, antre: 2, glace: 3, arene: 0 };
 // or et expérience ramenés à l'échelle du royaume (repères sim_donjon, 3 étages : ~450 + 200 × niveau pièces, ~+1 niveau)
 const OR_K = +(root.OR_K || 1), F_K = +(root.F_K || .88);
 // le dragon d'un antre du royaume, sans marchand ni retour en ville : calé pour ~75-90 % de réussite (comme le donjon 2D)
 const BOSS_K = +(root.BOSS_K || .7), BOSS_A = +(root.BOSS_A || 1);
 function rarMoy(h) { const os = Object.values(h.equip || {}).filter(Boolean); if (!os.length) return 0; const m = os.reduce((s, o) => s + Math.max(0, RAR.indexOf(o.rar)), 0) / os.length; return Math.max(1, Math.min(3, Math.round(m + 1))); } // l'équipement du royaume vaut un cran de plus que celui du puits (pas de marchand ni de pari en expédition)
 function configExpedition(o) {
  const h = o.heros, n = Math.max(1, Math.round(o.niveau || 1)), lv = Math.max(1, Math.round(h.niveau)), rar = rarMoy(h);
  const cl = CLS[h.classe] || 'guerrier';
  const groupe = [{ cls: cl, n: h.nom, lvl: lv, rar, heros: 1, xpf: Math.min(.99, (h.xp || 0) / (600 + 500 * h.niveau)) }];
  if (o.compagnon && COMP[o.compagnon.type] && COMP[o.compagnon.type] !== cl) groupe.push({ cls: COMP[o.compagnon.type], n: o.compagnon.nom || NOMS[COMP[o.compagnon.type]], lvl: lv, rar });
  for (const c of ['guerrier', 'mage', 'rodeuse']) if (groupe.length < 3 && !groupe.some(g => g.cls === c)) groupe.push({ cls: c, n: NOMS[c], lvl: lv, rar });
  const cfg = { F0: Math.max(1, Math.round(n * F_K + Math.max(0, n - 8) * .15)), etages: o.arene ? 1 : Math.min(2, o.etages || 3), bossK: BOSS_K, bossA: BOSS_A, tier: BIOME[o.type] ?? 0, groupe, pot: Math.max(3, h.potions || 0), nom: o.nom || '' };
  if (o.arene) { const k = Math.max(1, Math.min(12, o.arene.n || 4)); const mem = ['cb']; for (let i = 1; i < Math.min(5, 2 + Math.ceil(k / 3)); i++) mem.push(i % 2 ? 'so' : 'ab'); cfg.combat = { mem: mem.concat(k >= 9 ? ['so'] : []), elite: k >= 5 ? 'blinde' : null }; }
  return cfg;
 }
 function empl(s) { return s === 'bijou' ? (Math.random() < .5 ? 'amulette' : 'anneau') : s === 'armure' ? (['armure', 'casque', 'gants', 'bottes'][Math.floor(Math.random() * 4)]) : 'arme'; }
 // bilan du donjon 3D → expédition du royaume (même forme que celle du donjon 2D)
 function versTdB(b, h, cfg, genObjet) {
  const g0 = cfg.groupe[0], dl = Math.max(0, (b.lvl + b.xpf) - (g0.lvl + (g0.xpf || 0)));
  const X = { o: cfg, etage: 0, etages: cfg.etages, resultat: b.resultat, sacOr: Math.round(b.or * OR_K * Math.min(1.2, (450 + 200 * h.niveau) / (645 * Math.max(1, h.niveau)))), tues: b.tues, xpGagne: Math.round(dl * (.6 + .045 * h.niveau) * (600 + 500 * h.niveau)), butin: [], journal: [], d3: 1 };
  const objs = cfg.combat ? b.objets.slice().sort((x, y) => y.rar - x.rar).slice(0, 3) : b.objets;
  for (const it of objs) { const opts = { rarete: RAR[Math.max(0, Math.min(3, it.rar))], empl: empl(it.s) }; X.butin.push(genObjet ? genObjet(cfg.F0, h.classe, opts) : opts); }
  return X;
 }
 // expérience appliquée au héros du royaume (comme gagnerXp du donjon 2D)
 function appliquerXp(h, n) { h.xp = (h.xp || 0) + n; let up = 0; while (h.xp >= 600 + 500 * h.niveau) { h.xp -= 600 + 500 * h.niveau; h.niveau++; h.points = (h.points || 0) + 1; up++; } return up; }
 const P = { configExpedition, versTdB, appliquerXp, CLS, COMP };
 if (typeof module !== 'undefined' && module.exports) module.exports = P; else root.PONT3D = P;
})(typeof window !== 'undefined' ? window : globalThis);
