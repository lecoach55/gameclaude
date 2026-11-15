'use strict';
/* =========================================================
   Objets : génération du butin, statistiques du héros
   ========================================================= */
let UID_OBJ = 1;
function tirerRarete(bonus = 0) {
 const r = R() - bonus;
 if (r < .012) return 'legendaire';
 if (r < .09) return 'rare';
 if (r < .38) return 'magique';
 return 'normal';
}
// classe : arme préférée de la classe (80 %) ; force : 'rare' minimum, etc.
function genObjet(ilvl, classe, opts = {}) {
 ilvl = Math.max(1, Math.round(ilvl));
 let rar = opts.rarete || tirerRarete(opts.bonus || 0);
 if (opts.min) { const ord = ['normal', 'magique', 'rare', 'legendaire']; if (ord.indexOf(rar) < ord.indexOf(opts.min)) rar = opts.min; }
 let empl = opts.empl || pick(['arme', 'arme', 'casque', 'armure', 'gants', 'bottes', 'amulette', 'anneau']);
 const o = { id: UID_OBJ++, ilvl, rar, empl, stats: {} };
 let leg = null;
 if (rar === 'legendaire') {
  const pool = LEGENDAIRES.filter(l => (!opts.empl || l.empl === opts.empl) && (l.empl !== 'arme' || !classe || CLASSES[classe].armes.includes(l.arme) || chance(.15)));
  leg = pick(pool.length ? pool : LEGENDAIRES); o.empl = empl = leg.empl; o.leg = leg.id; o.effet = leg.effet;
 }
 if (empl === 'arme') {
  let t = leg && leg.arme || (classe && chance(.8) ? pick(CLASSES[classe].armes) : pick(Object.keys(ARMES)));
  const A = ARMES[t]; o.arme = t;
  const base = (6 + ilvl * 2.6) * A.k * (rar === 'legendaire' ? 1.3 : rar === 'rare' ? 1.15 : rar === 'magique' ? 1.07 : 1);
  o.dmin = Math.round(base * rnd(.8, .95)); o.dmax = Math.round(base * rnd(1.45, 1.7)); o.vit = A.vit;
  o.base = A.nom; o.ic = A.ic;
 } else {
  const b = pick(BASES[empl]); o.base = b.n; o.ic = ICONES[empl];
  if (b.arm) o.armure = Math.round((2 + ilvl * 1.3) * b.arm * rnd(.9, 1.15));
 }
 const n = RARETES.find(x => x.id === rar).n + (rar === 'rare' ? ri(0, 1) : 0);
 const pool = shuffle(STATS_EMPL[empl].slice());
 for (let i = 0; i < Math.min(n, pool.length); i++) {
  const s = STATS[pool[i]]; let v = s.min + s.s * ilvl * rnd(.6, 1.15);
  if (rar === 'legendaire') v *= 1.2;
  if (s.max) v = Math.min(v, s.max);
  o.stats[pool[i]] = Math.max(1, Math.round(v));
 }
 o.nom = leg ? leg.nom : rar === 'normal' ? o.base : rar === 'magique' ? `${o.base} ${pick(SUFFIXES)}` : `${pick(NOMS_RARES)} ${pick(SUFFIXES)}`;
 o.prix = Math.round((8 + ilvl * 4) * ({ normal: 1, magique: 2.2, rare: 5, legendaire: 14 }[rar]));
 return o;
}
// score approximatif pour comparer deux objets (bots, tri)
function scoreObjet(o, classe) {
 if (!o) return 0;
 let s = 0;
 if (o.empl === 'arme') { if (classe && !CLASSES[classe].armes.includes(o.arme)) return -1; s += (o.dmin + o.dmax) / 2 * o.vit * 3; }
 s += (o.armure || 0) * 1.5;
 const w = { pdmg: 1.2, pv: .5, arm: 1.2, vit: 1.5, crit: 2, critd: .5, vol: 4, mana: .3, regen: 2.5, vmov: 1, feu: 2, res: 3, or: .3, recup: 1.2 };
 for (const k in o.stats) s += o.stats[k] * (w[k] || 1);
 if (o.leg) s += 40;
 return s;
}
function lignesObjet(o) {
 const L = [];
 if (o.empl === 'arme') L.push(`<b>${o.dmin}–${o.dmax}</b> dégâts · ${o.vit.toFixed(2)} coups/s`);
 if (o.armure) L.push(`<b>${o.armure}</b> armure`);
 for (const k in o.stats) L.push(STATS[k].fmt(o.stats[k]));
 if (o.leg) { const l = LEGENDAIRES.find(x => x.id === o.leg); L.push(`<i class="legtxt">${l.txt}</i>`); }
 return L;
}
/* ---------- Héros ---------- */
function nouveauHeros(classe, nom, sexe, niveau = 1) {
 const h = { classe, nom, sexe, niveau, xp: 0, equip: {}, talents: {}, points: niveau - 1, comp: { [CLASSES[classe].comp[0].id]: 1 }, potions: 3 };
 return h;
}
function xpPour(n) { return 600 + 500 * n; }
// statistiques finales (generation : rang de la dynastie pour la hache de la lignée)
function statsHeros(h, generation = 1) {
 const C = CLASSES[h.classe];
 const S = { pvmax: C.pv + C.pvn * (h.niveau - 1), manamax: C.mana + C.manan * (h.niveau - 1), arm: C.arm + h.niveau * 1.2, pdmg: 0, vit: 0, crit: 5, critd: 50, vol: 0, regen: .4 + h.niveau * .08, vmov: 0, feu: 0, res: 0, or: 0, recup: 0, effets: {} };
 let arme = h.equip.arme; if (arme && !C.armes.includes(arme.arme)) arme = null;
 S.dmin = arme ? arme.dmin : 2 + h.niveau; S.dmax = arme ? arme.dmax : 4 + h.niveau * 1.5; S.cadence = arme ? arme.vit : 1.2;
 for (const e of EMPLACEMENTS) {
  const o = h.equip[e]; if (!o || (e === 'arme' && !arme)) continue;
  if (o.armure) S.arm += o.armure;
  for (const k in o.stats) { if (k === 'pv') S.pvmax += o.stats[k]; else if (k === 'mana') S.manamax += o.stats[k]; else S[k] += o.stats[k]; }
  if (o.effet) S.effets[o.effet] = true;
 }
 if (S.effets.heritage) S.pdmg += 3 * generation;
 // talents
 const T = h.talents || {}, t = k => T[k] || 0;
 S.arm *= 1 + .08 * t('fer'); S.pvmax *= 1 + .06 * t('vigueur'); S.riposte = .05 * t('riposte'); S.vol += t('sangchaud'); S.pdmg += 6 * (t('maitre') + t('chasseur')) + 7 * t('pyro'); S.res += 5 * t('inebranlable');
 S.manamax *= 1 + .12 * t('erudition'); S.fluxMana = 1 + .2 * t('flux'); S.crit += 4 * (t('cristal') + t('faucon')); S.bouclierMana = .1 * t('bouclier'); S.recup += 6 * t('concentration');
 S.vmov += 6 * t('piedleger'); S.critd += 15 * t('barbele'); S.esquive = .05 * t('instinct'); S.regen += 1.2 * t('survie');
 if (S.effets.fantome) S.vmov += 15;
 S.cadence *= 1 + S.vit / 100;
 S.vitesse = 4.3 * (1 + S.vmov / 100);
 S.res = Math.min(S.res, 40);
 S.crit = Math.min(S.crit, 60);
 S.recup = Math.min(S.recup, 40);
 S.dps = (S.dmin + S.dmax) / 2 * (1 + S.pdmg / 100) * S.cadence * (1 + S.crit / 100 * S.critd / 100) + S.feu * S.cadence;
 return S;
}
function effetsRoyaume(h) {
 const e = {};
 if (!h) return e;
 for (const k of EMPLACEMENTS) { const o = h.equip[k]; if (o && o.effet) e[o.effet] = true; }
 return e;
}
