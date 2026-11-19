'use strict';
/* =========================================================
   Royaume : moteur de la partie (saisons, économie, guerres aux dés, IA, dynastie)
   Pur : aucune dépendance au DOM (testable sous Node).
   ========================================================= */
const COUTS = { recruter: 30, marche: 60, caserne: 50, temple: 50, fortifier: 80, festin: 40, presents: 50 };
/* ---------- Grosses dépenses (décision de Victor du 18/11 : l'or des donjons doit redevenir un choix) ---------- */
// Grands travaux : une fois chacun, effet permanent sur tout le domaine (un ordre)
const GRANDS_TRAVAUX = {
 routes: { nom: 'Routes royales', ic: '🛣️', cout: 700, d: '+20 % de revenus dans tout le domaine' },
 cathedrale: { nom: 'Cathédrale de Braise', ic: '⛪', cout: 900, d: '+10 à la loyauté visée partout, +1 influence par saison, +15 prestige' },
 arsenal: { nom: 'Arsenal royal', ic: '⚒️', cout: 1100, d: '+2 hommes à chaque levée, garnisons jusqu’à 50' },
 secrets: { nom: 'Chambre des secrets', ic: '🗝️', cout: 800, d: '+15 % de réussite aux complots, +1 influence par saison' },
 chancellerie: { nom: 'Chancellerie', ic: '📜', cout: 1600, d: '+1 ordre chaque saison' },
};
function travail(G, k) { return !!G.travaux && G.travaux[k] !== undefined; }
function garnisonMax(G) { return travail(G, 'arsenal') ? 50 : 40; }
// Mercenaires : sans ordre ; une compagnie sert 4 saisons puis s'en va, touche une solde (2 or par homme et par saison),
// et chaque compagnie déjà sous contrat renchérit la suivante
const MERC_N = 8, MERC_DUREE = 4, MERC_SOLDE = 2, MERC_MAX = 12; // au plus 12 compagnies sous contrat ; chacune renchérit la suivante de 200 or
function mercActifs(G) { return (G.mercs || []).reduce((s, m) => s + m.n, 0); }
function prixMercenaires(G) { return 200 + 200 * (G.mercs || []).length; }
// Rançon de paix : acheter la fin d'une guerre (un ordre), prix selon l'armée adverse
function prixRancon(G, m) { return Math.round(100 + 12 * troupesDe(G, m) + 3 * G.tour); }
// Achat de vassaux : un seigneur voisin prête serment avec ses hommes (un ordre) ; plus le domaine est grand, plus c'est cher
function prixVassal(G, p) {
 const base = 150 + 25 * p.t + 50 * p.p + 120 * p.c + (p.bat.marche ? 80 : 0);
 return Math.round(base * (p.o === 'rebelles' ? 1 : 1.6) * (1 + .15 * provincesDe(G, 'joueur').length) * Math.pow(1.4, (G.depenses && G.depenses.vassaux) || 0) / 10) * 10;
}
function vassalPossible(G, p) {
 if (!p || p.o === 'joueur') return 'Déjà à vous';
 if (p.capitale) return 'Une capitale ne se vend pas';
 if (!voisinsDe(p.id).some(id => prov(G, id).o === 'joueur')) return 'Trop loin de vos terres';
 if (p.o !== 'rebelles') {
  const M = G.maisons[p.o];
  if (enGuerre(G, 'joueur', p.o)) return 'Impossible en pleine guerre';
  if (provincesDe(G, p.o).length < 2) return `Dernière terre de la maison ${M.nom}`;
  if (M.rel.joueur < 0) return `La maison ${M.nom} ne vend pas à un rival (relation ${Math.round(M.rel.joueur)}, il faut au moins 0)`;
 }
 return '';
}

function nomAuHasard(sexe) { return pick(sexe === 'f' ? PRENOMS_F : PRENOMS_H); }

function nouvellePartie(opts = {}) {
 const G = {
  v: 1, an: 412, saison: 0, tour: 0, fin: null, couronne: false,
  options: { mortReelle: !!opts.mortReelle, difficulte: opts.difficulte || 'normale' },
  maisons: {}, provinces: [], chronique: [], evts: [], vus: {}, roiMort: false,
  joueur: null, ordres: 3, dejaBouge: {}, stats: { batailles: 0, victoires: 0, donjons: 0, tues: 0 },
 };
 for (const id in MAISONS) {
  const M = MAISONS[id];
  G.maisons[id] = { id, nom: id === 'joueur' ? (opts.maison || M.nom) : M.nom, devise: M.devise, c1: M.c1, c2: M.c2, embleme: M.embleme, trait: M.trait, neutre: !!M.neutre, or: 100, influence: 3, prestige: 10, rel: {}, guerre: {}, alliance: {}, chef: null, elim: false };
 }
 const H = G.maisons;
 for (const a in H) for (const b in H) if (a !== b) { H[a].rel[b] = ri(-10, 15); H[a].guerre[b] = false; H[a].alliance[b] = false; }
 for (const a in H) { H[a].guerre.rebelles = !H[a].neutre; H.rebelles.guerre[a] = true; }
 H.joueur.rel.corbelin = H.corbelin.rel.joueur = -15;
 H.joueur.rel.draknor = H.draknor.rel.joueur = 10;
 for (const id of IA_MAISONS) { const s = chance(.5) ? 'h' : 'f'; H[id].chef = { nom: nomAuHasard(s), sexe: s, age: ri(30, 55), surnom: pick(SURNOMS) }; }
 H.draknor.chef = { nom: 'Aldric', sexe: 'h', age: 71, surnom: 'le Vieux', roi: true };
 H.draknor.heritier = { nom: 'Valéran', sexe: 'h', age: 14 };
 H.draknor.or = 220;
 G.provinces = PROVINCES.map(p => ({ id: p.id, nom: p.nom, x: p.x, y: p.y, o: p.o, t: p.t, c: p.c, p: p.p, loy: 60, d: p.d, donjon: p.donjon, dniv: p.d, nettoye: 0, bat: {}, capitale: !!p.capitale }));
 // héros et dynastie du joueur
 const sexe = opts.sexe || 'h', classe = opts.classe || 'chevalier';
 const h = nouveauHeros(classe, opts.nom || (sexe === 'f' ? 'Aénor' : 'Émeric'), sexe, 1);
 h.equip.arme = genObjet(1, classe, { empl: 'arme', rarete: 'normal' });
 h.equip.armure = genObjet(1, classe, { empl: 'armure', rarete: 'normal' });
 G.joueur = { heros: h, age: 24, conjoint: null, enfants: [], generation: 1, lignee: [], inventaire: [], blesse: 0, regence: 0, compagnon: null };
 completer(G);
 noter(G, `${titre(G)} ${h.nom} d’${H.joueur.nom} prend le gouvernement de Val-Sombre. Le vieux roi Aldric règne encore à Haute-Braise.`, 'regne');
 G.evts.push({ id: 'intro' });
 return G;
}
function titre(G) { return G.joueur.heros.sexe === 'f' ? 'Dame' : 'Sire'; }
function noter(G, txt, type = 'info') { G.chronique.unshift({ an: G.an, s: G.saison, txt, type }); if (G.chronique.length > 250) G.chronique.pop(); }
function prov(G, id) { return G.provinces.find(p => p.id === id); }
function voisinsDe(id) { return MONDE.voisins[MONDE.idx[id]]; }
function provincesDe(G, m) { return G.provinces.filter(p => p.o === m); }
function troupesDe(G, m) { return provincesDe(G, m).reduce((s, p) => s + p.t, 0); }
function revenuProv(G, p) { let r = 3 + 3 * p.p + (p.bat.marche ? 6 : 0) + (p.capitale ? 8 : 0); if (p.loy < 30) r *= .5; return r; }
function revenus(G, m) {
 let r = provincesDe(G, m).reduce((s, p) => s + revenuProv(G, p), 0);
 if (m === 'joueur') { const e = effetsRoyaume(G.joueur.heros); if (e.impots) r *= 1.25; if (travail(G, 'routes')) r *= 1.2; }
 if (G.maisons[m].trait === 'marchand') r *= 1.2;
 return Math.round(r);
}
function entretien(G, m) { return Math.round(troupesDe(G, m) * .75 + (m === 'joueur' ? mercActifs(G) * MERC_SOLDE + (G.joueur.compagnon ? 6 : 0) + G.joueur.enfants.filter(e => e.formation !== undefined && e.formation < 10).length * 8 : 0)); }
/* ---------- Mise à niveau des anciennes sauvegardes ---------- */
function completer(G) {
 const J = G.joueur;
 if (J.compagnon === undefined) J.compagnon = null;
 if (G.options && G.options.d3 === undefined) G.options.d3 = true; // donjons 3D au tour par tour (v5)
 if (!J.heros.talents) J.heros.talents = {};
 for (const e of J.enfants) if (e.classe === undefined) e.classe = null;
 if (!G.objectifs) G.objectifs = { n: 0, faits: [] };
 if (!G.nouvelles) G.nouvelles = [];
 if (!G.faille) G.faille = { palier: 1, record: 0 };
 if (!G.stats.bossTues) G.stats.bossTues = 0;
 if (!G.travaux) G.travaux = {}; // grands travaux bâtis (v6)
 if (!G.depenses) G.depenses = { merc: 0, vassaux: 0, total: 0 }; // compteurs des grosses dépenses (v6)
 if (!G.mercs) G.mercs = []; // compagnies de mercenaires sous contrat (v6) : { p, n, fin }
 if (!G.v || G.v < 2) G.v = 2;
 return G;
}
/* ---------- Objectifs (fil conducteur récompensé) ---------- */
const OBJECTIFS = [
 { t: 'Purger un donjon (la crypte de Val-Sombre est la plus facile)', ok: G => G.stats.donjons >= 1, r: G => { G.maisons.joueur.or += 60; return '+60 or'; } },
 { t: 'Dépenser un point de compétence ou de talent (🛡️ Armurerie → ✦ ; utile au donjon 2D, en 3D tout vient du niveau)', ok: G => G.joueur.heros.points === 0 && G.joueur.heros.niveau >= 2, r: G => { G.joueur.heros.potions = Math.max(G.joueur.heros.potions, 5); return 'Ceinture de 5 potions'; } },
 { t: 'Recruter des troupes dans une de vos provinces', ok: G => troupesDe(G, 'joueur') >= 14, r: G => { G.maisons.joueur.or += 30; return '+30 or'; } },
 { t: 'Conquérir une province (Les Saulaies ou les Marches Grises sont mal défendues)', ok: G => provincesDe(G, 'joueur').length >= 3, r: G => { G.maisons.joueur.or += 80; G.maisons.joueur.prestige += 5; return '+80 or, +5 prestige'; } },
 { t: 'Engager un compagnon d’armes (🛡️ Armurerie → Compagnon)', ok: G => !!G.joueur.compagnon, r: G => { G.joueur.inventaire.push(genObjet(G.joueur.heros.niveau + 1, G.joueur.heros.classe, { min: 'rare' })); return 'Un objet rare'; } },
 { t: 'Vous marier (🤝 Maisons → Mariage) pour assurer la lignée', ok: G => !!G.joueur.conjoint, r: G => { G.maisons.joueur.prestige += 10; return '+10 prestige'; } },
 { t: 'Bâtir un marché ou une caserne', ok: G => provincesDe(G, 'joueur').some(p => p.bat.marche || p.bat.caserne), r: G => { G.maisons.joueur.or += 50; return '+50 or'; } },
 { t: 'Atteindre le niveau 6', ok: G => G.joueur.heros.niveau >= 6, r: G => { G.joueur.inventaire.push(genObjet(7, G.joueur.heros.classe, { min: 'rare', empl: 'arme' })); return 'Une arme rare'; } },
 { t: 'Tenir 5 provinces', ok: G => provincesDe(G, 'joueur').length >= 5, r: G => { G.maisons.joueur.or += 120; return '+120 or'; } },
 { t: 'Avoir un héritier et lui choisir un maître d’armes (👑 Dynastie)', ok: G => G.joueur.enfants.some(e => e.classe), r: G => { G.maisons.joueur.prestige += 8; return '+8 prestige'; } },
 { t: 'Vaincre trois maîtres de donjon', ok: G => G.stats.donjons >= 3, r: G => { G.joueur.inventaire.push(genObjet(G.joueur.heros.niveau + 2, G.joueur.heros.classe, { rarete: 'legendaire' })); return 'Un objet légendaire !'; } },
 { t: 'Tenir 8 provinces', ok: G => provincesDe(G, 'joueur').length >= 8, r: G => { G.maisons.joueur.or += 200; return '+200 or'; } },
 { t: 'Prendre Haute-Braise et ceindre la couronne (10 provinces)', ok: G => G.couronne, r: G => { G.maisons.joueur.prestige += 20; return 'La Faille de Braise s’ouvre à Haute-Braise…'; } },
 { t: 'Descendre au palier 5 de la Faille de Braise', ok: G => G.faille.record >= 5, r: G => { G.joueur.inventaire.push(genObjet(G.joueur.heros.niveau + 4, G.joueur.heros.classe, { rarete: 'legendaire' })); return 'Un objet légendaire !'; } },
];
function objectifActuel(G) { return OBJECTIFS[G.objectifs.n] || null; }
// renvoie le texte de récompense si l'objectif courant vient d'être atteint
function verifierObjectif(G) {
 const o = objectifActuel(G); if (!o || !o.ok(G)) return null;
 const r = o.r(G); G.objectifs.faits.push(G.objectifs.n); G.objectifs.n++; noter(G, `Objectif accompli : ${o.t.replace(/ \(.*\)$/, '')}.`, 'exploit');
 return { t: o.t, r };
}
function ordresMax(G) { const e = effetsRoyaume(G.joueur.heros); return 3 + (e.ordre ? 1 : 0) + (G.maisons.joueur.prestige >= 80 ? 1 : 0) + (travail(G, 'chancellerie') ? 1 : 0); }
function enGuerre(G, a, b) { return a !== b && (G.maisons[a].guerre[b] || G.maisons[b].guerre[a]); }
function changeRel(G, a, b, v) { if (a === b || !G.maisons[a] || !G.maisons[b]) return; G.maisons[a].rel[b] = clamp(G.maisons[a].rel[b] + v, -100, 100); G.maisons[b].rel[a] = clamp(G.maisons[b].rel[a] + v, -100, 100); }
function declarerGuerre(G, a, b, raison) {
 if (enGuerre(G, a, b)) return;
 G.maisons[a].guerre[b] = G.maisons[b].guerre[a] = true; G.maisons[a].alliance[b] = G.maisons[b].alliance[a] = false; changeRel(G, a, b, -30);
 if (a === 'joueur' || b === 'joueur') noter(G, `Guerre : ${G.maisons[a].nom} contre ${G.maisons[b].nom}${raison ? ' — ' + raison : ''}.`, 'guerre');
 // les alliés suivent
 for (const c in G.maisons) if (c !== a && c !== b && G.maisons[b].alliance[c] && !G.maisons[c].neutre && c !== 'joueur') { G.maisons[c].guerre[a] = G.maisons[a].guerre[c] = true; }
}
function faireLaPaix(G, a, b) { G.maisons[a].guerre[b] = G.maisons[b].guerre[a] = false; if (a === 'joueur' || b === 'joueur') noter(G, `Paix signée entre ${G.maisons[a].nom} et ${G.maisons[b].nom}.`, 'paix'); }

/* ---------- Bataille aux dés ---------- */
// renvoie { manches:[{a:[...], d:[...], pa, pd}], att, def, gagne }
function bataille(G, att, def, o = {}) {
 const res = { manches: [], att0: att, def0: def };
 const seuil = Math.max(1, Math.ceil(att * (o.prudent ? .5 : .25)));
 let n = 0;
 while (att > seuil && def > 0 && n++ < 60) {
  const na = Math.min(3 + (o.deAtt || 0), att), nd = Math.min(2 + (o.chateau >= 2 ? 1 : 0), def);
  const a = Array.from({ length: na }, () => ri(1, 6)).sort((x, y) => y - x), d = Array.from({ length: nd }, () => ri(1, 6)).sort((x, y) => y - x);
  if (o.bonusAtt) a[0] = Math.min(7, a[0] + o.bonusAtt);
  if (o.chateau >= 3) d[0] = Math.min(7, d[0] + 1);
  if (o.malusAtt) a[0] = Math.max(1, a[0] - o.malusAtt);
  let pa = 0, pd = 0;
  for (let i = 0; i < Math.min(a.length, d.length); i++) { if (a[i] > d[i]) pd++; else pa++; }
  att -= pa; def -= pd; res.manches.push({ a, d, pa, pd });
 }
 Object.assign(res, { att, def, gagne: def <= 0 });
 return res;
}
// attaque d'une province par une autre ; o : { n, prudent, champion:'victoire'|'mort'|null }
function attaquer(G, deId, versId, o = {}) {
 const A = prov(G, deId), D = prov(G, versId); const ma = A.o, md = D.o;
 const n = clamp(o.n || A.t - 1, 1, A.t - 1);
 let def = D.t;
 const opts = { chateau: D.c, prudent: o.prudent };
 if (ma === 'joueur') { const e = effetsRoyaume(G.joueur.heros); if (e.de) opts.deAtt = 1; }
 if (G.maisons[ma].trait === 'guerrier') opts.deAtt = (opts.deAtt || 0) + (chance(.5) ? 1 : 0);
 let txtChamp = '';
 if (o.champion === 'victoire') { const k = Math.ceil(def * .3); def = Math.max(1, def - k); opts.bonusAtt = 1; txtChamp = ` Le champion adverse est tombé : ${k} défenseurs ont fui.`; }
 else if (o.champion === 'mort') { opts.malusAtt = 1; txtChamp = ' Votre héros est tombé dans la mêlée, le moral vacille.'; }
 if (!enGuerre(G, ma, md) && md !== 'rebelles') { declarerGuerre(G, ma, md, 'sans déclaration'); if (ma === 'joueur') { G.maisons.joueur.prestige -= 5; for (const c in G.maisons) changeRel(G, 'joueur', c, -5); } }
 const r = bataille(G, n, def, opts);
 A.t -= n;
 const pertesA = n - r.att, pertesD = D.t - r.def;
 G.stats.batailles += ma === 'joueur' || md === 'joueur' ? 1 : 0;
 if (r.gagne) {
  const ancien = D.o; D.o = ma; D.t = Math.max(1, r.att); D.loy = 35; if (D.c > 0 && chance(.35)) D.c--; D.nettoye = D.nettoye > 0 ? D.nettoye : 0;
  if (ma === 'joueur') { G.maisons.joueur.prestige += D.capitale ? 20 : 4; G.stats.victoires++; }
  changeRel(G, ma, ancien, -12);
  if (ma === 'joueur' || ancien === 'joueur') noter(G, `${D.nom} tombe aux mains de ${G.maisons[ma].nom} (pertes : ${pertesA} contre ${pertesD}).${txtChamp}`, 'bataille');
  verifierElimination(G, ancien);
 } else {
  A.t += r.att; D.t = r.def;
  if (ma === 'joueur' || md === 'joueur') noter(G, `Assaut de ${G.maisons[ma].nom} repoussé à ${D.nom} (pertes : ${pertesA} contre ${pertesD}).${txtChamp}`, 'bataille');
  if (md === 'joueur') G.maisons.joueur.prestige += 2;
 }
 A.t = Math.max(A.t, 0); if (A.t === 0) A.t = 1;
 r.pertesA = pertesA; r.pertesD = pertesD; r.n = n; r.def0 = D.t + pertesD - (r.gagne ? D.t - Math.max(1, r.att) + pertesD - pertesD : 0);
 r.prov = D.nom; r.de = A.nom; r.ma = ma; r.md = md;
 return r;
}
function verifierElimination(G, m) {
 if (!m || m === 'rebelles' || G.maisons[m].elim) return;
 if (!provincesDe(G, m).length) {
  G.maisons[m].elim = true;
  if (m === 'joueur') { G.fin = { type: 'defaite', txt: 'Votre maison a perdu sa dernière terre. Le nom d’' + G.maisons.joueur.nom + ' ne sera plus qu’une note en marge des chroniques.' }; }
  else noter(G, `La maison ${G.maisons[m].nom} est anéantie.`, 'guerre');
  for (const c in G.maisons) { G.maisons[c].guerre[m] = false; G.maisons[c].alliance[m] = false; }
 }
}

/* ---------- Actions du joueur (chacune coûte un ordre sauf mention) ---------- */
function peutOrdre(G) { return G.ordres > 0 && !G.fin; }
function act(G, type, a = {}) {
 const J = G.maisons.joueur, p = a.prov ? prov(G, a.prov) : null;
 const fail = m => ({ ok: false, msg: m });
 if (type === 'deplacer') { // gratuit, une fois par province et par saison
  const q = prov(G, a.vers); if (!p || !q || p.o !== 'joueur' || q.o !== 'joueur' || !voisinsDe(p.id).includes(q.id)) return fail('Déplacement impossible');
  if (G.dejaBouge[p.id]) return fail('Ces troupes ont déjà marché cette saison');
  const n = clamp(a.n, 1, p.t - 1); if (n < 1) return fail('Il faut laisser au moins une troupe');
  p.t -= n; q.t += n; G.dejaBouge[q.id] = true; return { ok: true, msg: `${n} troupes rejoignent ${q.nom}.` };
 }
 if (type === 'mercenaires') { // sans ordre : l'or achète du temps
  if (G.fin) return fail('La partie est finie');
  if (!p || p.o !== 'joueur') return fail('Province hors de votre domaine');
  const c = prixMercenaires(G); if (J.or < c) return fail(`Il faut ${c} or`);
  if (p.t >= garnisonMax(G)) return fail('Garnison déjà pleine');
  if (G.mercs.length >= MERC_MAX) return fail(`Déjà ${MERC_MAX} compagnies sous contrat`);
  const n = Math.min(MERC_N, garnisonMax(G) - p.t); J.or -= c; p.t += n; G.mercs.push({ p: p.id, n, fin: G.tour + MERC_DUREE }); G.depenses.merc++; G.depenses.total += c;
  noter(G, `Une compagnie de ${n} mercenaires est engagée à ${p.nom} pour ${c} or.`, 'info');
  return { ok: true, msg: `${n} mercenaires rejoignent ${p.nom} pour ${MERC_DUREE} saisons (−${c} or, solde ${n * MERC_SOLDE} or par saison). La prochaine compagnie coûtera ${prixMercenaires(G)} or.` };
 }
 if (!peutOrdre(G)) return fail('Plus d’ordres cette saison');
 let r;
 switch (type) {
  case 'recruter': {
   if (!p || p.o !== 'joueur') return fail('Province hors de votre domaine');
   if (J.or < COUTS.recruter) return fail('Pas assez d’or');
   const n = 4 + (p.bat.caserne ? 2 : 0) + (p.capitale ? 2 : 0) + (travail(G, 'arsenal') ? 2 : 0); J.or -= COUTS.recruter; p.t = Math.max(p.t, Math.min(garnisonMax(G), p.t + n)); p.loy = Math.max(0, p.loy - 3);
   r = { ok: true, msg: `${n} hommes d’armes rejoignent la bannière à ${p.nom}.` }; break;
  }
  case 'batir': {
   if (!p || p.o !== 'joueur') return fail('Province hors de votre domaine');
   const b = a.bat; let cout = b === 'fortifier' ? COUTS.fortifier * (p.c + 1) : COUTS[b];
   if (b === 'fortifier' && p.c >= 3) return fail('Château déjà au maximum');
   if (b !== 'fortifier' && p.bat[b]) return fail('Déjà bâti');
   if (J.or < cout) return fail('Pas assez d’or');
   J.or -= cout; if (b === 'fortifier') p.c++; else p.bat[b] = true;
   r = { ok: true, msg: b === 'fortifier' ? `Les murs de ${p.nom} s’élèvent (château niveau ${p.c}).` : `${{ marche: 'Un marché', caserne: 'Une caserne', temple: 'Un temple' }[b]} est bâti à ${p.nom}.` };
   noter(G, r.msg, 'batir'); break;
  }
  case 'attaquer': {
   const q = prov(G, a.vers); if (!p || !q || p.o !== 'joueur' || q.o === 'joueur' || !voisinsDe(p.id).includes(q.id)) return fail('Attaque impossible');
   if (p.t < 2) return fail('Pas assez de troupes');
   const res = attaquer(G, p.id, q.id, a); r = { ok: true, bataille: res, msg: res.gagne ? `Victoire ! ${q.nom} est à vous.` : `L’assaut sur ${q.nom} a échoué.` }; break;
  }
  case 'impots': {
   const gain = Math.round(revenus(G, 'joueur') * 1.5); J.or += gain; for (const q of provincesDe(G, 'joueur')) q.loy = Math.max(0, q.loy - 15);
   r = { ok: true, msg: `Impôts extraordinaires : +${gain} or. Le peuple gronde.` }; break;
  }
  case 'festin': {
   if (J.or < COUTS.festin) return fail('Pas assez d’or'); J.or -= COUTS.festin; for (const q of provincesDe(G, 'joueur')) q.loy = Math.min(100, q.loy + 12); J.prestige += 3;
   r = { ok: true, msg: 'Un grand festin réjouit vos sujets (+loyauté, +3 prestige).' }; break;
  }
  case 'presents': {
   const m = G.maisons[a.maison]; if (!m || J.or < COUTS.presents) return fail('Pas assez d’or'); J.or -= COUTS.presents; changeRel(G, 'joueur', a.maison, 18 + ri(0, 8));
   r = { ok: true, msg: `${m.nom} accepte vos présents (relation ${m.rel.joueur}).` }; break;
  }
  case 'alliance': {
   const m = G.maisons[a.maison]; if (!m) return fail('?');
   if (enGuerre(G, 'joueur', a.maison)) return fail('Vous êtes en guerre');
   const seuil = 35 - J.prestige / 5;
   if (m.rel.joueur >= seuil) { m.alliance.joueur = J.alliance[a.maison] = true; changeRel(G, 'joueur', a.maison, 10); noter(G, `Alliance conclue avec ${m.nom}.`, 'paix'); r = { ok: true, msg: `${m.nom} accepte l’alliance.` }; }
   else { changeRel(G, 'joueur', a.maison, -3); r = { ok: true, msg: `${m.nom} décline (il faudrait une relation d’au moins ${Math.round(seuil)}).` }; }
   break;
  }
  case 'paix': {
   const m = G.maisons[a.maison]; if (!enGuerre(G, 'joueur', a.maison)) return fail('Vous n’êtes pas en guerre');
   const force = troupesDe(G, 'joueur') / Math.max(1, troupesDe(G, a.maison));
   if (m.rel.joueur > -45 || force > 1.4 || chance(.25)) { faireLaPaix(G, 'joueur', a.maison); changeRel(G, 'joueur', a.maison, 15); r = { ok: true, msg: `${m.nom} accepte la paix.` }; }
   else r = { ok: true, msg: `${m.nom} refuse la paix. « Vous n’avez rien à offrir. »` };
   break;
  }
  case 'guerre': { declarerGuerre(G, 'joueur', a.maison); r = { ok: true, msg: `Vous déclarez la guerre à ${G.maisons[a.maison].nom}.` }; break; }
  case 'mariage': {
   const m = G.maisons[a.maison]; const Jo = G.joueur;
   if (Jo.conjoint) return fail('Vous êtes déjà marié(e)');
   if (m.rel.joueur < 10 - J.prestige / 6) { changeRel(G, 'joueur', a.maison, -2); r = { ok: true, msg: `${m.nom} juge l’union indigne de son sang (relation insuffisante).` }; break; }
   const s = Jo.heros.sexe === 'f' ? 'h' : 'f';
   Jo.conjoint = { nom: nomAuHasard(s), sexe: s, age: clamp(Jo.age + ri(-6, 2), 16, 60), maison: a.maison };
   m.alliance.joueur = J.alliance[a.maison] = true; changeRel(G, 'joueur', a.maison, 30); J.prestige += 8; if (m.trait === 'royal') J.prestige += 10;
   noter(G, `Noces de ${Jo.heros.nom} et de ${Jo.conjoint.nom} ${m.nom}. Les deux maisons sont désormais alliées.`, 'famille');
   r = { ok: true, msg: `Vous épousez ${Jo.conjoint.nom} de la maison ${m.nom}. Alliance scellée.` }; break;
  }
  case 'complot': {
   const m = G.maisons[a.maison]; const e = effetsRoyaume(G.joueur.heros); const cout = { revolte: 3, assassinat: 6, vol: 2 }[a.type];
   if (J.influence < cout) return fail(`Il faut ${cout} d’influence`);
   J.influence -= cout;
   let p0 = { revolte: .6, assassinat: .38, vol: .65 }[a.type] + (e.intrigue ? .15 : 0) + (G.maisons.joueur.trait === 'intrigant' ? .1 : 0) + (travail(G, 'secrets') ? .15 : 0);
   const reussi = chance(p0), decouvert = chance(reussi ? .25 : .6);
   let msg = '';
   if (a.type === 'revolte') {
    const q = prov(G, a.prov); if (!q || q.o === 'joueur') return fail('?');
    if (reussi) { const k = Math.ceil(q.t * .5); q.t = Math.max(1, q.t - k); q.loy = 10; if (chance(.4)) { const anc = q.o; q.o = 'rebelles'; q.t = Math.max(2, k); msg = `${q.nom} se soulève et chasse ses maîtres !`; verifierElimination(G, anc); } else msg = `Des émeutes éclatent à ${q.nom} : la garnison perd ${k} hommes.`; }
    else msg = `Vos agents à ${q.nom} ont été démasqués.`;
   } else if (a.type === 'assassinat') {
    if (reussi) { const ch = m.chef; msg = `${ch.nom} ${ch.surnom || ''} de la maison ${m.nom} est retrouvé mort.`; successionIA(G, a.maison); for (const q of provincesDe(G, a.maison)) q.loy -= 15; }
    else msg = `Le poignard a manqué ${m.chef.nom}.`;
   } else if (a.type === 'vol') {
    if (reussi) { const k = Math.round(m.or * .4); m.or -= k; J.or += k; msg = `Vos espions dérobent ${k} or dans les coffres des ${m.nom}.`; }
    else msg = 'Le voleur a été pris la main dans le coffre.';
   }
   if (decouvert) { changeRel(G, 'joueur', a.maison, -35); msg += ` Le complot est découvert : ${m.nom} crie vengeance !`; if (chance(.5)) declarerGuerre(G, a.maison, 'joueur', 'complot découvert'); }
   noter(G, msg, 'complot'); r = { ok: true, msg }; break;
  }
  case 'expedition': {
   // la préparation est gérée par l'interface ; ici on consomme l'ordre
   r = { ok: true, msg: '' }; break;
  }
  case 'travaux': {
   const T = GRANDS_TRAVAUX[a.k]; if (!T) return fail('?'); if (travail(G, a.k)) return fail('Déjà bâti');
   if (J.or < T.cout) return fail(`Il faut ${T.cout} or`);
   J.or -= T.cout; G.travaux[a.k] = G.tour; G.depenses.total += T.cout; if (a.k === 'cathedrale') J.prestige += 15;
   r = { ok: true, msg: `${T.ic} ${T.nom} : les travaux sont achevés (${T.d}).` }; noter(G, `Grands travaux : ${T.nom} (${T.cout} or).`, 'batir'); break;
  }
  case 'rancon': {
   const m = G.maisons[a.maison]; if (!m || !enGuerre(G, 'joueur', a.maison)) return fail('Vous n’êtes pas en guerre');
   const c = prixRancon(G, a.maison); if (J.or < c) return fail(`Il faut ${c} or`);
   J.or -= c; G.depenses.total += c; faireLaPaix(G, 'joueur', a.maison); m.rel.joueur = J.rel[a.maison] = clamp(Math.max(m.rel.joueur, 0) + 10, -100, 100);
   r = { ok: true, msg: `${m.nom} empoche ${c} or et rappelle ses armées. La paix est signée.` }; break;
  }
  case 'vassal': {
   const pourquoi = vassalPossible(G, p); if (pourquoi) return fail(pourquoi);
   const c = prixVassal(G, p); if (J.or < c) return fail(`Il faut ${c} or`);
   const anc = p.o; J.or -= c; G.depenses.total += c; G.depenses.vassaux++;
   p.o = 'joueur'; p.loy = 45; G.dejaBouge[p.id] = true;
   if (anc !== 'rebelles') { changeRel(G, 'joueur', anc, -15); verifierElimination(G, anc); }
   r = { ok: true, msg: `Le seigneur de ${p.nom} vous prête serment avec ses ${p.t} hommes (−${c} or).` };
   noter(G, `${p.nom} passe sous la bannière d’${J.nom} contre ${c} or${anc !== 'rebelles' ? `, au grand dépit de la maison ${G.maisons[anc].nom}` : ''}.`, 'regne'); break;
  }
  case 'conseil': { J.influence += 2; J.prestige += 1; r = { ok: true, msg: 'Vous tenez conseil : +2 influence.' }; break; }
  default: return fail('Action inconnue');
 }
 if (r.ok) G.ordres--;
 return r;
}
function prixRecrue() { return COUTS.recruter; }

/* ---------- Résultat d'une expédition ---------- */
function finExpedition(G, pid, X, special) {
 const J = G.maisons.joueur, p = pid ? prov(G, pid) : null, h = G.joueur.heros;
 const res = { lignes: [] };
 J.or += X.sacOr; res.lignes.push(`+${X.sacOr} or rapporté`);
 for (const o of X.butin) G.joueur.inventaire.push(o);
 if (X.butin.length) res.lignes.push(`${X.butin.length} objet(s) rapporté(s)`);
 G.stats.tues += X.tues;
 if (X.resultat === 'victoire') {
  G.stats.donjons++; J.prestige += 5 + Math.round((p ? p.dniv : 5) / 2);
  if (p && !special) {
   p.nettoye = ri(8, 12);
   if (p.o === 'joueur') { p.p = Math.min(5, p.p + 1); p.loy = Math.min(100, p.loy + 15); res.lignes.push(`${p.nom} est purgée du mal : prospérité ${p.p}, loyauté +15`); }
   else res.lignes.push(`Les ${DONJONS[p.donjon].nom.toLowerCase()} de ${p.nom} sont nettoyées`);
   noter(G, `${h.nom} a vaincu le maître des ${DONJONS[p.donjon].nom.toLowerCase()} de ${p.nom}.`, 'exploit');
  }
  res.lignes.push(`+${5 + Math.round((p ? p.dniv : 5) / 2)} prestige`);
 } else if (X.resultat === 'mort') {
  if (G.options.mortReelle) { res.lignes.push(`${h.nom} est mort dans les profondeurs.`); mortDuSouverain(G, 'tombé dans les profondeurs de ' + (p ? p.nom : 'l’antre')); res.mort = true; }
  else { G.joueur.blesse = 2; J.prestige = Math.max(0, J.prestige - 3); const perte = Math.round(J.or * .1); J.or -= perte; res.lignes.push(`Vos hommes vous ramènent, gravement blessé(e) : pas d’expédition pendant 2 saisons, −${perte} or`); noter(G, `${h.nom} est ramené(e) à demi-mort(e) des ${DONJONS[p ? p.donjon : 'antre'].nom.toLowerCase()}.`, 'exploit'); }
 } else res.lignes.push('Vous avez rebroussé chemin.');
 return res;
}

/* ---------- Dynastie ---------- */
function mortDuSouverain(G, cause) {
 const Jo = G.joueur, h = Jo.heros;
 Jo.lignee.push({ nom: h.nom, sexe: h.sexe, classe: h.classe, niveau: h.niveau, fin: G.an, age: Jo.age, cause, generation: Jo.generation });
 noter(G, `${h.nom} d’${G.maisons.joueur.nom} est mort(e) à ${Jo.age} ans, ${cause}.`, 'mort');
 const enfants = Jo.enfants.slice().sort((a, b) => b.age - a.age);
 if (!enfants.length) { G.fin = { type: 'extinction', txt: `${h.nom} meurt sans héritier. La maison ${G.maisons.joueur.nom} s’éteint, et ses terres sont dépecées par les vautours.` }; return; }
 const e = enfants[0]; Jo.enfants = Jo.enfants.filter(x => x !== e);
 // l'héritier attend que le joueur choisisse sa voie (classe) : voir succession()
 G.succession = { heritier: e, ancien: h };
 Jo.conjoint = null;
}
function succession(G, classe) {
 const S = G.succession, Jo = G.joueur, e = S.heritier, ancien = S.ancien;
 const niv = Math.max(1, Math.floor(ancien.niveau / 2), e.classe === classe ? e.formation || 0 : Math.floor((e.formation || 0) / 2));
 const h = nouveauHeros(classe, e.nom, e.sexe, niv);
 h.xp = 0; h.potions = 3;
 // l'armurerie de la maison passe à l'héritier
 for (const k of EMPLACEMENTS) { const o = ancien.equip[k]; if (!o) continue; if (k === 'arme' && !CLASSES[classe].armes.includes(o.arme)) Jo.inventaire.push(o); else h.equip[k] = o; }
 if (!h.equip.arme) { const best = Jo.inventaire.filter(o => o.empl === 'arme' && CLASSES[classe].armes.includes(o.arme)).sort((a, b) => scoreObjet(b, classe) - scoreObjet(a, classe))[0]; if (best) { h.equip.arme = best; Jo.inventaire = Jo.inventaire.filter(o => o !== best); } else h.equip.arme = genObjet(Math.max(1, niv), classe, { empl: 'arme', rarete: 'magique' }); }
 Jo.heros = h; Jo.age = e.age; Jo.generation++; Jo.blesse = 0;
 if (e.age < 16) { Jo.regence = 16 - e.age; G.maisons.joueur.prestige -= 10; for (const q of provincesDe(G, 'joueur')) q.loy -= 10; noter(G, `${e.nom}, ${e.age} ans, hérite sous la tutelle d’un régent.`, 'regne'); }
 else noter(G, `${e.nom} d’${G.maisons.joueur.nom} monte sur le siège de ses ancêtres (génération ${Jo.generation}).`, 'regne');
 G.succession = null;
}
function successionIA(G, m) {
 const M = G.maisons[m];
 if (M.heritier) { M.chef = Object.assign({ surnom: pick(SURNOMS) }, M.heritier); M.heritier = null; }
 else { const s = chance(.5) ? 'h' : 'f'; M.chef = { nom: nomAuHasard(s), sexe: s, age: ri(18, 40), surnom: pick(SURNOMS) }; }
 for (const c in M.rel) M.rel[c] = Math.round(M.rel[c] * .6);
}

/* ---------- Fin de saison ---------- */
function finSaison(G) {
 if (G.fin || G.succession) return;
 const J = G.maisons.joueur;
 tourIA(G);
 // économie du joueur
 const rev = revenus(G, 'joueur'), ent = entretien(G, 'joueur');
 J.or += rev - ent; J.influence += 1 + provincesDe(G, 'joueur').filter(p => p.bat.temple).length * .5 + (effetsRoyaume(G.joueur.heros).intrigue ? 2 : 0) + (travail(G, 'cathedrale') ? 1 : 0) + (travail(G, 'secrets') ? 1 : 0);
 J.influence = Math.round(J.influence * 2) / 2;
 if (G.dette) { J.or -= G.dette.m; if (--G.dette.s <= 0) { G.dette = null; noter(G, 'La dette envers le banquier de Port-Ambre est soldée.', 'info'); } }
 if (J.or < 0) { const q = provincesDe(G, 'joueur').sort((a, b) => b.t - a.t)[0]; if (q) { const k = Math.ceil(q.t * .2); q.t -= k; noter(G, `Faute de solde, ${k} soldats désertent à ${q.nom}.`, 'alerte'); } J.or = 0; }
 // provinces
 for (const p of G.provinces) {
  const cible = 50 + (p.bat.temple ? 15 : 0) + (p.o === 'joueur' ? J.prestige / 8 + (travail(G, 'cathedrale') ? 10 : 0) : 10) + (p.capitale ? 5 : 0);
  p.loy += (cible - p.loy) * .15 + (p.o !== 'rebelles' && p.t >= 6 ? 1 : 0);
  if (p.nettoye > 0) { p.nettoye--; if (p.nettoye === 0) { p.dniv += 2; if (p.o === 'joueur') { p.loy -= 8; G.evts.push({ id: 'retour_mal', prov: p.id }); } } }
  if (p.o !== 'rebelles' && p.loy > 70 && chance(.04)) p.p = Math.min(5, p.p + 1);
  if (p.o === 'rebelles' && chance(.25)) p.t = Math.min(10, p.t + 1);
  if (p.loy < 18 && p.o !== 'rebelles' && chance(.3)) {
   const anc = p.o; p.o = 'rebelles'; p.t = 3 + p.p; p.loy = 40;
   if (anc === 'joueur') noter(G, `Révolte ! ${p.nom} chasse vos officiers.`, 'alerte');
   verifierElimination(G, anc);
  }
 }
 // vieillissement, naissances
 const Jo = G.joueur;
 if (Jo.blesse > 0) Jo.blesse--;
 if (G.saison === 3) {
  Jo.age++; if (Jo.conjoint) Jo.conjoint.age++; for (const e of Jo.enfants) e.age++;
  if (Jo.regence > 0) Jo.regence--;
  for (const e of Jo.enfants) if (e.classe && e.age >= 6 && (e.formation || 0) < 10) e.formation = (e.formation || 0) + 1;
  for (const id of IA_MAISONS) { const M = G.maisons[id]; if (M.elim) continue; M.chef.age++; if (M.heritier) M.heritier.age++; if (M.chef.age > 55 && chance((M.chef.age - 55) * .02)) { if (M.chef.roi) G.evts.push({ id: 'mort_roi' }); else if (chance(.5)) noter(G, `${M.chef.nom} de la maison ${M.nom} est mort(e) de vieillesse.`, 'info'); successionIA(G, id); } }
 }
 if (Jo.conjoint && Jo.age < 50 && Jo.conjoint.age < 46 && Jo.enfants.length < 6 && chance(.14)) {
  const s = chance(.5) ? 'h' : 'f', e = { nom: nomAuHasard(s), sexe: s, age: 0 };
  if (Jo.enfants.some(x => x.nom === e.nom)) e.nom = nomAuHasard(s);
  Jo.enfants.push(e); noter(G, `Naissance de ${e.nom}, ${s === 'f' ? 'fille' : 'fils'} de ${Jo.heros.nom}.`, 'famille'); G.evts.push({ id: 'naissance', nom: e.nom, sexe: s });
 }
 // mort naturelle du souverain
 if (Jo.age >= 48 && chance((Jo.age - 46) * .0045)) { mortDuSouverain(G, 'emporté(e) par la maladie'); }
 // le vieux roi
 if (!G.roiMort && G.tour >= 3 && chance(G.tour >= 10 ? .25 : .07)) G.evts.push({ id: 'mort_roi' });
 // événements de la saison suivante
 tirerEvenements(G);
 // passage du temps
 G.saison = (G.saison + 1) % 4; if (G.saison === 0) G.an++; G.tour++;
 G.ordres = ordresMax(G); G.dejaBouge = {};
 // fin des contrats de mercenaires
 // (province perdue : la compagnie est perdue avec elle ; sinon les hommes partent de la province d'embauche, puis des plus grosses garnisons s'ils ont été déplacés)
 for (const c of G.mercs.slice()) {
  const q = prov(G, c.p);
  if (!q || q.o !== 'joueur') { G.mercs.splice(G.mercs.indexOf(c), 1); continue; }
  if (G.tour < c.fin) continue;
  G.mercs.splice(G.mercs.indexOf(c), 1);
  let reste = c.n; const ordre = [q].concat(provincesDe(G, 'joueur').filter(x => x !== q).sort((a, b) => b.t - a.t));
  for (const x of ordre) { if (reste <= 0) break; const k = Math.max(0, Math.min(reste, x.t - 1)); x.t -= k; reste -= k; }
  noter(G, `Leur contrat échu, ${c.n - reste} mercenaires quittent ${q.nom}.`, 'info');
 }
 J.prestige = Math.max(0, Math.round(J.prestige));
 verifierVictoire(G);
}
function verifierVictoire(G) {
 if (G.couronne) return;
 const mien = provincesDe(G, 'joueur');
 if (mien.some(p => p.capitale) && mien.length >= 10) {
  G.couronne = true; G.maisons.joueur.prestige += 50;
  noter(G, `${G.joueur.heros.nom} d’${G.maisons.joueur.nom} est couronné(e) sur le Trône de Braise !`, 'regne');
  G.evts.unshift({ id: 'couronnement' });
 }
}

/* ---------- IA des maisons ---------- */
function tourIA(G) {
 G.nouvelles = [];
 const ordre = shuffle(IA_MAISONS.slice());
 const dif = { facile: 1, normale: 1.35, difficile: 1.7 }[G.options.difficulte] || 1.35;
 for (const m of ordre) {
  const M = G.maisons[m]; if (M.elim) continue;
  const mes = provincesDe(G, m); if (!mes.length) { verifierElimination(G, m); continue; }
  M.or += Math.round(revenus(G, m) * dif) - entretien(G, m) + Math.round(10 * dif) + (m === 'draknor' ? 10 : 0);
  if (M.or < 0) { const q = mes.sort((a, b) => b.t - a.t)[0]; q.t = Math.max(1, q.t - Math.ceil(q.t * .15)); M.or = 0; }
  M.influence += 1;
  // menace par province
  const menace = p => voisinsDe(p.id).map(id => prov(G, id)).filter(q => q.o !== m && (enGuerre(G, m, q.o) || q.o === 'rebelles' || G.maisons[q.o] && G.maisons[q.o].rel[m] < -20)).reduce((s, q) => s + q.t, 0);
  // recrutement
  let n = 0; const cap = 16 + mes.length * 8;
  while (M.or >= 30 && troupesDe(G, m) < cap && n++ < 5) { const q = mes.slice().sort((a, b) => (menace(b) - b.t) - (menace(a) - a.t))[0]; q.t += 4 + (q.bat.caserne ? 2 : 0); M.or -= 30; }
  // constructions
  if (M.or > 110 && chance(.5)) { const q = pick(mes); const b = pick(['marche', 'caserne', 'temple', 'fortifier']); if (b === 'fortifier' && q.c < 3 && M.or >= 80 * (q.c + 1)) { M.or -= 80 * (q.c + 1); q.c++; } else if (b !== 'fortifier' && !q.bat[b]) { M.or -= 60; q.bat[b] = true; } }
  // coalition contre une maison trop puissante
  const nj = provincesDe(G, 'joueur').length; if (nj > 7 && !M.alliance.joueur) changeRel(G, m, 'joueur', -(nj - 7) * .7);
  // diplomatie
  for (const c in G.maisons) {
   if (c === m || G.maisons[c].elim || G.maisons[c].neutre) continue;
   const voisin = mes.some(p => voisinsDe(p.id).some(id => prov(G, id).o === c));
   if (voisin && chance(.3)) changeRel(G, m, c, -1);
   if (!voisin) M.rel[c] += (0 - M.rel[c]) * .05;
   const agress = M.trait === 'guerrier' ? 1.5 : M.trait === 'royal' && G.roiMort ? 1.3 : 1;
   if (!enGuerre(G, m, c) && !M.alliance[c] && voisin && M.rel[c] < -35 && chance(.12 * agress)) {
    declarerGuerre(G, m, c, c === 'joueur' ? 'votre voisin perd patience' : '');
    if (c === 'joueur') G.evts.push({ id: 'declaration', maison: m });
   }
   if (enGuerre(G, m, c) && M.rel[c] > -25 && chance(.15) && c !== 'joueur') faireLaPaix(G, m, c);
   if (enGuerre(G, m, c) && c === 'joueur' && troupesDe(G, m) < troupesDe(G, 'joueur') * .6 && chance(.2) && !G.evts.some(e => e.id === 'offre_paix')) G.evts.push({ id: 'offre_paix', maison: m });
   if (!enGuerre(G, m, c) && c === 'joueur' && M.rel[c] > 45 && !M.alliance[c] && chance(.08) && !G.evts.some(e => e.id === 'offre_alliance')) G.evts.push({ id: 'offre_alliance', maison: m });
  }
  // attaques
  const maxAtt = M.trait === 'guerrier' ? 2 : 1;
  let att = 0;
  const cibles = [];
  for (const p of mes) {
   if (p.t < 4) continue;
   for (const id of voisinsDe(p.id)) {
    const q = prov(G, id); if (q.o === m) continue;
    const hostile = enGuerre(G, m, q.o) || q.o === 'rebelles';
    if (!hostile) continue;
    if (q.o === 'joueur' && G.tour < 4) continue; // répit de début de partie
    if (q.o === 'rebelles' && G.tour < 8 && voisinsDe(q.id).some(id => prov(G, id).o === 'joueur')) continue; // laisser au joueur le temps de s'étendre
    const ratio = (p.t - 1) / (q.t + q.c * 1.5 + 1);
    if (ratio > 1.5) cibles.push({ p, q, ratio: ratio + (q.capitale ? .6 : 0) + (q.o === 'joueur' ? .2 : 0) });
   }
  }
  cibles.sort((a, b) => b.ratio - a.ratio);
  for (const c of cibles) {
   if (att >= maxAtt) break; if (c.p.o !== m || c.q.o === m || c.p.t < 4) continue;
   att++;
   const avant = c.q.o;
   const r = attaquer(G, c.p.id, c.q.id, { n: c.p.t - 1 - (menace(c.p) > c.p.t ? 2 : 0), prudent: true });
   G.nouvelles.push({ de: c.p.id, vers: c.q.id, m, avant, gagne: r.gagne });
   if (avant === 'joueur') G.evts.push({ id: 'attaque_subie', maison: m, prov: c.q.id, gagne: r.gagne, pa: r.pertesA, pd: r.pertesD });
  }
 }
}

/* ---------- Robot joueur (équilibrage du royaume) ---------- */
// force : probabilité de réussir une expédition selon le niveau du héros et du donjon
function chanceExpedition(G, niv) { const h = G.joueur.heros; const s = statsHeros(h, G.joueur.generation); const pui = h.niveau + s.dps / 25; return clamp(.5 + (pui - niv) * .09, .08, .95); }
// BOT.orReel : or d'expédition au niveau du vrai jeu (donjon 3D : ~450 + 200 × niveau du héros) au lieu de l'ancien 18 × niveau du donjon
// BOT.depenses : le robot utilise les grosses dépenses (vassaux, grands travaux, rançons de paix, mercenaires)
const BOT = { orReel: true, depenses: true };
function front0(G) { return provincesDe(G, 'joueur').filter(p => p.t < garnisonMax(G) && voisinsDe(p.id).some(id => prov(G, id).o !== 'joueur')); }
function botDepenses(G, mes, front) {
 const J = G.maisons.joueur;
 // acheter un vassal si l'on garde une réserve
 const vs = G.provinces.filter(p => !vassalPossible(G, p)).map(p => ({ p, c: prixVassal(G, p) })).filter(x => x.c <= J.or - 150).sort((a, b) => a.c - b.c);
 if (vs.length) return act(G, 'vassal', { prov: vs[0].p.id }).ok;
 // grands travaux par ordre d'utilité
 for (const k of ['routes', 'chancellerie', 'arsenal', 'cathedrale', 'secrets']) if (!travail(G, k) && J.or >= GRANDS_TRAVAUX[k].cout + 250) return act(G, 'travaux', { k }).ok;
 // racheter la paix face à plus fort que soi
 for (const m of IA_MAISONS) if (!G.maisons[m].elim && enGuerre(G, 'joueur', m) && troupesDe(G, m) > troupesDe(G, 'joueur') * .7 && J.or >= prixRancon(G, m) * 1.5) return act(G, 'rancon', { maison: m }).ok;
 return null;
}
function botRoyaume(G) {
 const J = G.maisons.joueur, mes = provincesDe(G, 'joueur');
 // résoudre les événements avec un choix au hasard parmi ceux disponibles
 let garde = 0;
 while (G.ordres > 0 && garde++ < 10) {
  const front = mes.filter(p => voisinsDe(p.id).some(id => prov(G, id).o !== 'joueur'));
  // attaque favorable
  let best = null, br = 0;
  for (const p of front) for (const id of voisinsDe(p.id)) { const q = prov(G, id); if (q.o === 'joueur' || G.maisons[q.o].alliance.joueur) continue; const r = (p.t - 1) / (q.t + q.c * 1.5 + 1); if (r > br) { br = r; best = [p, q]; } }
  if (best && br > 1.6) { act(G, 'attaquer', { prov: best[0].id, vers: best[1].id }); continue; }
  if (BOT.depenses && botDepenses(G, mes, front)) continue;
  // expédition
  const dj = G.provinces.filter(p => (p.o === 'joueur' || voisinsDe(p.id).some(id => prov(G, id).o === 'joueur')) && !p.nettoye).sort((a, b) => a.dniv - b.dniv)[0];
  if (dj && !G.joueur.blesse && chanceExpedition(G, dj.dniv) > .55 && chance(.6)) {
   act(G, 'expedition', {}); const ok = chance(chanceExpedition(G, dj.dniv));
   const h = G.joueur.heros; const X = { sacOr: BOT.orReel ? Math.round((450 + 200 * h.niveau) * rnd(.7, 1.3) * (ok ? 1 : .3)) : Math.round(18 * dj.dniv * rnd(.7, 1.4)), butin: [], tues: 30, resultat: ok ? 'victoire' : 'mort' };
   const ec = h.niveau - dj.dniv, gainXp = Math.round(2400 * (.75 + .25 * dj.dniv) * (ok ? 1 : .4) * (ec > 2 ? Math.max(.2, 1 - .15 * (ec - 2)) : 1)); h.xp += gainXp; while (h.xp >= xpPour(h.niveau)) { h.xp -= xpPour(h.niveau); h.niveau++; h.points++; }
   if (ok) for (let i = 0; i < 3; i++) { const o = genObjet(dj.dniv, h.classe, { bonus: .1 }); if (scoreObjet(o, h.classe) > scoreObjet(h.equip[o.empl], h.classe)) h.equip[o.empl] = o; else G.joueur.inventaire.push(o); }
   finExpedition(G, dj.id, X); continue;
  }
  if (J.or > 120 && chance(.4)) { const p = pick(mes); act(G, 'batir', { prov: p.id, bat: pick(['marche', 'caserne', 'temple', 'fortifier']) }); continue; }
  if (J.or >= 30) { const p = (front.length ? front : mes).sort((a, b) => a.t - b.t)[0]; act(G, 'recruter', { prov: p.id }); continue; }
  if (mes.some(p => p.loy < 35)) { if (J.or >= 40) act(G, 'festin'); else act(G, 'conseil'); continue; }
  act(G, 'conseil');
 }
 // mercenaires (sans ordre) sur le front quand le trésor déborde
 if (BOT.depenses) for (let i = 0; i < 4 && front0(G).length && J.or >= prixMercenaires(G) * 3 && G.mercs.length < MERC_MAX; i++) { const p = front0(G).sort((a, b) => a.t - b.t)[0]; if (!act(G, 'mercenaires', { prov: p.id }).ok) break; }
 // vendre le surplus
 for (const o of G.joueur.inventaire.splice(0)) J.or += Math.round(o.prix / 3);
}

/* ---------- La Faille de Braise (fin de partie : paliers sans fin) ---------- */
function failleOuverte(G) { return G.couronne || provincesDe(G, 'joueur').some(p => p.capitale) || G.joueur.heros.niveau >= 15; }
function configFaille(G) { const n = G.faille.palier; return { type: ['catacombes', 'antre', 'glace', 'mine', 'marais', 'crypte'][n % 6], niveau: 7 + n * 1.7, etages: 3, nom: `Faille de Braise — palier ${n}`, boss: ['liche', 'wyverne', 'ogre'][n % 3] }; }
function finFaille(G, X) {
 const F = G.faille, n = F.palier;
 if (X.resultat !== 'victoire') return `La Faille vous recrache au palier ${n}.`;
 F.record = Math.max(F.record, n); F.palier++;
 const or = 60 * n; G.maisons.joueur.or += or; G.maisons.joueur.prestige += 3 + n;
 let t = `Palier ${n} vaincu ! +${or} or, +${3 + n} prestige.`;
 if (chance(.35 + n * .03)) { const o = genObjet(G.joueur.heros.niveau + 2, G.joueur.heros.classe, { rarete: 'legendaire' }); G.joueur.inventaire.push(o); t += ` La Faille vous offre ${o.nom} !`; }
 noter(G, `${G.joueur.heros.nom} a vaincu le palier ${n} de la Faille de Braise.`, 'exploit');
 return t;
}
