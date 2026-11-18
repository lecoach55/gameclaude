/* =========================================================================
   SEDES PETRI — Ambitions de pontificat (v18)
   À chaque couronnement, trois ambitions tirées selon l'époque et le caractère du pape ;
   le joueur en choisit une (onglet Pontife). Une réussite ne donne QUE de la gloire
   (S.ambGlory, comptée dans glory()), une ligne dorée dans les annales et une mention
   dans le bilan du pape défunt. Rien ici ne modifie l'autorité, le trésor, la ferveur…
   Tirage avec un générateur à part (graine du pape) : le hasard du jeu n'est pas consommé.
   ========================================================================= */
const AMB = {
 jerusalem: { bin: 1, n: 'Délivrer Jérusalem', d: 'Que la Ville sainte revienne aux chrétiens avant votre mort.', g: 260, aff: ['croise'],
  when: () => S.own.jerusalem && !isCath(S.own.jerusalem), ok: () => isCath(S.own.jerusalem), prog: () => [isCath(S.own.jerusalem) ? 1 : 0, 1, isCath(S.own.jerusalem) ? 'Jérusalem est chrétienne' : 'Jérusalem aux mains ' + deR(S.own.jerusalem)] },
 reforme: { n: 'Purger la Curie', d: 'Ramener la corruption sous 20 en dix ans.', yrs: 10, g: 160, aff: ['reformateur', 'ascete'],
  when: () => S.corruption >= 26, ok: () => S.corruption < 20, prog: () => [Math.max(0, 100 - S.corruption), 80, 'corruption ' + Math.round(S.corruption) + ' (but : moins de 20)'] },
 ordres: { n: 'Père des moines', d: 'Approuver trois nouveaux ordres religieux en quinze ans.', yrs: 15, g: 150, aff: ['ascete', 'theologien'],
  base: () => ({ o: S.orders.length }), when: () => Object.keys(ORDERS).length - S.orders.length >= 3, ok: b => S.orders.length - b.o >= 3, prog: b => [S.orders.length - b.o, 3, 'ordres approuvés'] },
 rome: { bin: 1, n: 'Ramener la Curie à Rome', d: 'Rentrer au Latran avant votre mort.', g: 210, aff: ['diplomate', 'theologien'],
  when: () => S.curia !== 'rome', ok: () => S.curia === 'rome', prog: () => [S.curia === 'rome' ? 1 : 0, 1, S.curia === 'rome' ? 'la Curie siège à Rome' : 'la Curie siège ' + (S.curia === 'avignon' ? 'en Avignon' : 'en exil')] },
 schisme: { bin: 1, n: 'Refaire l’unité', d: 'Mettre fin au schisme avant votre mort.', g: 230, aff: ['diplomate', 'juriste'],
  when: () => !!S.schism, ok: () => !S.schism, prog: () => [S.schism ? 0 : 1, 1, S.schism ? 'l’antipape tient encore ses fidèles' : 'l’Église est une'] },
 batir: { n: 'Rome resplendissante', d: 'Achever deux grands chantiers en douze ans.', yrs: 12, g: 140, aff: ['batisseur', 'vaniteux'],
  base: () => ({ b: ambBuilt() }), when: () => Object.keys(BUILDINGS).length - ambBuilt() >= 2, ok: b => ambBuilt() - b.b >= 2, prog: b => [ambBuilt() - b.b, 2, 'chantiers achevés'] },
 decrets: { n: 'Le législateur', d: 'Faire promulguer deux décrets conciliaires en douze ans.', yrs: 12, g: 140, aff: ['juriste', 'theologien'],
  base: () => ({ d: S.decrees.length }), when: () => Object.keys(DECREES).length - S.decrees.length >= 3, ok: b => S.decrees.length - b.d >= 2, prog: b => [S.decrees.length - b.d, 2, 'décrets promulgués'] },
 croisade: { n: 'Prendre la croix', d: 'Mener une croisade à la victoire en quinze ans.', yrs: 15, g: 180, aff: ['croise', 'irascible'],
  base: () => ({ w: S.crusadeWins }), when: () => true, ok: b => S.crusadeWins - b.w >= 1, prog: b => [S.crusadeWins - b.w, 1, 'croisade victorieuse'] },
 heresie: { n: 'Marteau des hérétiques', d: 'Qu’aucun royaume catholique ne dépasse 12 d’hérésie, en douze ans.', yrs: 12, g: 170, aff: ['theologien', 'ascete', 'irascible'],
  when: () => ambHer() >= 30, ok: () => ambHer() <= 12, prog: () => [Math.max(0, 100 - ambHer()), 88, 'hérésie la plus forte : ' + Math.round(ambHer()) + ' (but : 12)'] },
 tresor: { n: 'Les coffres de Salomon', d: 'Amasser 400 marcs de plus, sans dette, en dix ans.', yrs: 10, g: 120, aff: ['avide', 'juriste'],
  base: () => ({ t: Math.max(0, Math.round(S.treasury)) }), when: () => true, ok: b => S.treasury >= b.t + 400 && S.debt <= 0, prog: b => [Math.max(0, Math.round(S.treasury) - b.t), 400, 'marcs amassés' + (S.debt > 0 ? ' · dette à solder' : '')] },
 autorite: { n: 'Plenitudo potestatis', d: 'Porter l’autorité pontificale à 80 en douze ans.', yrs: 12, g: 160, aff: ['vaniteux', 'juriste', 'reformateur'],
  when: () => S.authority < 68, ok: () => S.authority >= 80, prog: () => [Math.round(S.authority), 80, 'autorité'] },
 paix: { n: 'Le pacificateur', d: 'Arbitrer deux paix entre princes chrétiens en douze ans.', yrs: 12, g: 150, aff: ['diplomate'],
  base: () => ({ m: S.mediations || 0 }), when: () => true, ok: b => (S.mediations || 0) - b.m >= 2, prog: b => [(S.mediations || 0) - b.m, 2, 'paix signées sous votre arbitrage'] },
 vassaux: { n: 'Suzerain des rois', d: 'Recevoir l’hommage de deux nouveaux royaumes vassaux en vingt ans.', yrs: 20, g: 170, aff: ['vaniteux', 'diplomate'],
  base: () => ({ v: ambVass() }), when: () => catholics(r => !RL(r).vassal).length >= 3, ok: b => ambVass() - b.v >= 2, prog: b => [Math.max(0, ambVass() - b.v), 2, 'nouveaux vassaux'] },
 ferveur: { n: 'Raviver la foi', d: 'Porter la ferveur de la Chrétienté à 68 en dix ans.', yrs: 10, g: 140, aff: ['ascete', 'theologien'],
  when: () => avgFervor() < 60, ok: () => avgFervor() >= 68, prog: () => [Math.round(avgFervor()), 68, 'ferveur moyenne'] },
 college: { n: 'Un Sacré Collège fidèle', d: 'Porter la loyauté moyenne des cardinaux à 70 en dix ans.', yrs: 10, g: 110, aff: ['nepotiste', 'diplomate'],
  when: () => avgLoyal() < 60, ok: () => avgLoyal() >= 70, prog: () => [Math.round(avgLoyal()), 70, 'loyauté de la Curie'] },
 union: { n: 'Union des Églises', d: 'Réconcilier Grecs et Latins avant votre mort.', g: 260, aff: ['theologien', 'diplomate'],
  when: () => !S.flags.unionDone && active('byzance'), ok: () => !!S.flags.unionDone, prog: () => [Math.round((RL('byzance') && RL('byzance').union) || 0), 100, 'avancée de l’union'] },
 reconquista: { n: 'Achever la Reconquista', d: 'Qu’aucune terre ibérique ne reste sous domination musulmane, avant votre mort.', g: 230, aff: ['croise'],
  when: () => IBERIA.some(p => RL(S.own[p]).relig === 'musulman'), ok: () => !IBERIA.some(p => RL(S.own[p]).relig === 'musulman'), prog: () => { const n = IBERIA.filter(p => RL(S.own[p]).relig === 'musulman').length; return [IBERIA.length - n, IBERIA.length, n + ' province' + (n > 1 ? 's' : '') + ' encore musulmane' + (n > 1 ? 's' : '')]; } },
 chretiente: { n: 'Dilater la Chrétienté', d: 'Gagner trois provinces à la foi catholique en vingt ans.', yrs: 20, g: 150, aff: ['croise', 'vaniteux'],
  base: () => ({ p: catholicProvCount() }), when: () => true, ok: b => catholicProvCount() - b.p >= 3, prog: b => [Math.max(0, catholicProvCount() - b.p), 3, 'provinces gagnées'] }
};
function ambBuilt() { return Object.values(S.build).filter(v => v === true).length; }
function ambHer() { return catholics().reduce((m, r) => Math.max(m, RL(r).heresy || 0), 0); }
function ambVass() { return catholics(r => RL(r).vassal).length; }

/* Trois ambitions proposées au couronnement (ou à la reprise d'une ancienne partie). */
function ambEnsure() {
 if (!S || !S.pope || S.over) return null;
 const p = S.pope;
 if (p.amb) return p.amb;
 if (p.ambO && p.ambO.ids.some(ambOuverte)) return p.ambO; // offres encore valables ; sinon nouveau tirage
 const rng = mulberryAmb(((p.seed || 1) ^ (S.year * 2654435761)) >>> 0);
 const pool = Object.keys(AMB).filter(ambOuverte);
 const pick3 = [];
 while (pick3.length < 3 && pool.length) {
  const wts = pool.map(k => 1 + (AMB[k].aff || []).filter(t => p.traits.includes(t)).length * 2);
  let x = rng() * wts.reduce((a, b) => a + b, 0), i = 0; while (x > wts[i] && i < wts.length - 1) { x -= wts[i]; i++; }
  pick3.push(pool.splice(i, 1)[0]);
 }
 p.ambO = { ids: pick3, y: S.year };
 return p.ambO;
}
/* Une offre n'est valable que si l'objectif n'est pas déjà atteint et que sa condition tient toujours (sinon : gloire gratuite). */
function ambOuverte(k) { const A = AMB[k]; if (!A) return false; try { return A.when() && !A.ok(A.base ? A.base() : {}); } catch (e) { return false; } }
function mulberryAmb(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function ambChoose(id) {
 const p = S.pope, A = AMB[id]; if (!A || p.amb || !p.ambO || !p.ambO.ids.includes(id) || !ambOuverte(id)) return false;
 p.amb = { id, y: S.year, b: A.base ? A.base() : {}, st: 'cours' }; delete p.ambO;
 log(`${popeName()} fait vœu : « ${A.n} ». ${A.d}`, 'info');
 ambTick(); return true;
}
function ambState() {
 const a = S.pope && S.pope.amb; if (!a || !AMB[a.id]) return null; const A = AMB[a.id];
 const [v, max, l0] = A.prog(a.b || {}); const lbl = A.bin || /\d/.test(l0) ? l0 : v + ' / ' + max + ' ' + l0;
 return { A, a, v, max, lbl, left: A.yrs ? a.y + A.yrs - S.year : null };
}
/* Appelé à la fin de chaque saison (engine.js) : ne touche qu'à la gloire et aux annales. */
function ambTick() {
 const a = S && S.pope && S.pope.amb; if (!a || a.st !== 'cours' || !AMB[a.id]) return;
 const A = AMB[a.id];
 let ok = false; try { ok = A.ok(a.b || {}); } catch (e) { }
 if (ok) { a.st = 'ok'; a.fin = S.year; S.ambGlory = (S.ambGlory || 0) + A.g; S.ambNew = a.id; log(`✦ Ambition accomplie : « ${A.n} » — ${popeName()} entre dans la mémoire de l’Église (+${A.g} gloire).`, 'gold'); return; }
 if (A.yrs && S.year > a.y + A.yrs) { a.st = 'rate'; a.fin = S.year; log(`L’ambition « ${A.n} » de ${popeName()} est restée un vœu pieux.`, 'info'); }
}
/* Pour le bilan du pape défunt (popeRecord). */
function ambRecord() {
 ambTick(); // une réussite de la dernière saison (fin du schisme puis abdication…) compte encore
 const a = S.pope && S.pope.amb; if (!a || !AMB[a.id]) return null;
 return { id: a.id, n: AMB[a.id].n, st: a.st === 'cours' ? 'rate' : a.st, g: a.st === 'ok' ? AMB[a.id].g : 0 };
}
if (typeof module !== 'undefined') module.exports = { AMB };
