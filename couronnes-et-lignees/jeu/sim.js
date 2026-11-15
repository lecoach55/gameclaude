// Simulateur : fait jouer des bots N parties et sort les statistiques
const D = require('./engine.js');

const clone = s => { const l = s.log; s.log = []; const c = JSON.parse(JSON.stringify(s)); s.log = l; return c; };

function value(s) {
  if (s.over) return s.result.won ? 1e4 + s.result.score : -1e4 + s.year;
  const h = D.heir(s);
  const r = D.ruler(s);
  let v = s.stab * 2.2 + Math.min(s.gold, 80) * 0.6 + Math.min(s.army, 70) * 0.8 + s.prestige * 0.7 + s.domains * 18 + s.builds * 10 + s.alliances * 6 - s.menace * 0.5;
  v += ((s.mine && !s.mineSold) ? 30 : 0) + (s.trade || 0) * 8 - (s.corvee || 0) * 8 + (s.univ ? 8 : 0) + (s.cathedral ? 30 : 0) + (s.stats.ambitions || 0) * 15;
  v += (s.chantier ? 15 : 0) + (s.chains || []).length * 6 + (s.edif ? Object.values(s.edif).reduce((a, b) => a + b, 0) * 2 : 0);
  { const ad = D.livingDyn(s).filter(p => p.id !== s.rulerId && D.age(s, p) >= 14); if (ad.length) v += ad.reduce((a, p) => a + (p.loyal - 50), 0) / ad.length * 0.2; }
  if (s.houses) v += Object.values(s.houses).reduce((a, h) => a + h.rel, 0) * 0.03;
  if (s.regency && !s.regency.by) v -= 5;
  if (s.stab < 20) v -= (20 - s.stab) * 4;
  if (s.gold < 0) v += s.gold * 1.5;
  if (!h) v -= 60; else v += h.traits.reduce((a, t) => a + D.TRAITS[t].g * 6, 0);
  const line = D.successionLine(s).length; v += Math.min(line, 4) * 12;
  if (!r.spouse && D.age(s, r) >= 16) v -= 20;
  return v;
}

function setPolicies(s) {
  s.pol.fisc = s.stab < 30 ? 0 : s.gold < 25 && s.stab > 55 ? 2 : 1;
  s.pol.cour = s.gold < 25 ? 0 : s.gold > 160 && s.stab > 70 ? 1 : 2;
  s.pol.ost = s.menace > 55 && s.army < 55 ? 2 : s.army < 30 ? 1 : 0;
}
const TV = { fertile: 3, robuste: 2, sage: 2, genie: 3, brave: 1, pieux: 1, charismatique: 1, sterile: -6, maladif: -3, simplet: -3, couard: -1, cruel: -1 };
function chooseCandidate(s, p, look) {
  const list = D.marriageMarket(s, p);
  let best = -1, bv = -Infinity;
  list.forEach((c, i) => {
    const f = D.candidateFx(s, p, c); if (!f.ok) return;
    let v;
    if (look) {
      v = 0;
      for (let k = 0; k < 3; k++) { const cl = clone(s); cl.r = (cl.r ^ ((k + 1) * 911382323)) | 0; D.playTurn(cl, 'marier', p.id, i); if (cl.event && !cl.over) D.resolveEvent(cl, bestChoice(cl)); v += value(cl); }
      v += c.traits.reduce((a, t) => a + (TV[t] || 0), 0) * 6 * (f.leaves ? 0 : 1);
    } else {
      v = c.traits.reduce((a, t) => a + (TV[t] || 0), 0) * (f.leaves ? 0 : 1) * 3 + f.prest + f.stab * 2 + f.alliance * 8 - f.menace * 0.4 + Math.min(f.gold, 40) * (s.gold < 30 ? 0.5 : 0.15);
    }
    if (v > bv) { bv = v; best = i; }
  });
  return best;
}
function missionAction(s, ok, e) {
  const m = s.mission; if (!m || globalThis.MISSION_BOT === 0) return null;
  const left = m.target - (m.prog != null ? m.prog : 0);
  if (left <= 0) return null;
  switch (m.k) {
    case 'treasure': s.pol.fisc = s.stab > 45 ? 2 : 1; s.pol.cour = 0; return ['attendre'];
    case 'army': s.pol.ost = 2; return ok('recruter') && e('recruter') > 0.6 ? ['recruter'] : ok('mercenaires') ? ['mercenaires'] : null;
    case 'prestige': return ok('pelerinage') && e('pelerinage') > 0.6 ? ['pelerinage'] : ok('festin') && e('festin') > 0.6 ? ['festin'] : null;
    case 'peace': s.pol.fisc = 0; s.pol.cour = s.gold > 30 ? 2 : 1; return ok('festin') && e('festin') > 0.6 ? ['festin'] : null;
    case 'alliance': return ok('ambassade') && e('ambassade') > 0.5 ? ['ambassade'] : null;
    case 'build': return ok('construire') && e('construire') > 0.5 ? ['construire'] : null;
    case 'heir': return null;
    case 'rivalLand': {
      const b = D.borderTargets(s).filter(x => x.owner === 'rival').map(x => [x.i, D.campaignOdds(s, x.i)]).sort((a, b) => b[1] - a[1])[0];
      if (b && b[1] >= 0.45 && ok('campagne')) return ['campagne', b[0]];
      if (ok('intrigue') && e('intrigue') > 0.6) return ['intrigue'];
      return s.army < 70 && ok('recruter') ? ['recruter'] : null;
    }
    case 'vassal': case 'conquer': {
      const v = D.borderTargets(s).filter(x => x.owner !== 'rival').map(x => [x.i, D.vassalOdds(s, x.i), D.vassalCost(s, x.i)]).filter(x => x[2] <= s.gold).sort((a, b) => b[1] - a[1])[0];
      if (v && v[1] >= 0.4) return ['vassaliser', v[0]];
      if (m.k === 'conquer' && ok('campagne')) { const b = D.borderTargets(s).map(x => [x.i, D.campaignOdds(s, x.i)]).sort((a, b) => b[1] - a[1])[0]; if (b && b[1] >= 0.5) return ['campagne', b[0]]; }
      return null;
    }
  }
  return null;
}
function pickBuild(s) {
  const T = D.buildTypes(s), n = k => D.edif(s, k);
  if (s.menace > 55 && n('donjon') < 2) return 'donjon';
  if (s.stab < 45 && n('moulin') < 2) return 'moulin';
  if (s.mission && s.mission.k === 'prestige' && n('abbaye') < 3) return 'abbaye';
  if (s.army < 40 && n('lices') < 2) return 'lices';
  if (T.includes('hopital') && n('hopital') < 1) return 'hopital';
  if (T.includes('universite') && n('universite') < 1) return 'universite';
  return n('marche') <= n('abbaye') ? 'marche' : 'abbaye';
}
function heuristicAction(s) {
  setPolicies(s);
  if (globalThis.COUNCIL_BOT !== 0) D.autoCouncil(s);
  if (globalThis.GIFT_BOT !== 0 && s.gold > 90 && s.giftTurn !== s.turn) { const b = D.borderTargets(s).filter(x => x.owner !== 'rival').sort((a, b) => D.houseOf(s, a.owner).rel - D.houseOf(s, b.owner).rel)[0]; if (b && D.houseOf(s, b.owner).rel < 50) D.sendGift(s, b.owner); }
  const r = D.ruler(s), acts = Object.fromEntries(D.getActions(s).map(a => [a.id, a]));
  const ok = id => acts[id] && acts[id].ok, e = id => (acts[id] && acts[id].eff != null ? acts[id].eff : 1);
  const line = D.successionLine(s).length;
  const ua = D.unmarriedAdults(s);
  const rAge = D.age(s, r);
  if (ok('adopter') && (rAge >= 45 || r.traits.includes('sterile'))) return ['adopter'];
  if (s.stab < 25 && ok('festin') && e('festin') > 0.65) return ['festin'];
  { const ma = missionAction(s, ok, e); if (ma && s.stab >= 25) return ma; }
  const priority = ua.find(p => p.id === s.rulerId) || (line < 3 ? ua.find(p => p.sex === 'M') || ua[0] : null);
  if (priority) { const i = chooseCandidate(s, priority, s._look); if (i >= 0) return ['marier', priority.id, i]; }
  if (s.menace > 60 && s.army < 45) { if (ok('mercenaires') && s.gold > 60) return ['mercenaires']; if (ok('recruter') && e('recruter') > 0.65) return ['recruter']; if (ok('intrigue') && e('intrigue') > 0.7) return ['intrigue']; if (ok('ambassade')) return ['ambassade']; }
  if (globalThis.WAR && ok('campagne') && rAge >= 16) { const best = D.borderTargets(s).map(x => [x.i, D.campaignOdds(s, x.i)]).sort((a, b) => b[1] - a[1])[0]; if (best && best[1] >= globalThis.WAR) return ['campagne', best[0]]; if (s.army < 60 && ok('recruter') && e('recruter') > 0.6) return ['recruter']; }
  if (ok('vassaliser')) { const v = D.borderTargets(s).filter(x => x.owner !== 'rival').map(x => [x.i, D.vassalOdds(s, x.i), D.vassalCost(s, x.i)]).filter(x => x[2] + 15 <= s.gold).sort((a, b) => b[1] - a[1])[0]; if (v && v[1] >= (globalThis.VASS_T || 0.55)) return ['vassaliser', v[0]]; }
  if (ok('construire') && s.gold > 60) return ['construire'];
  if (ok('campagne') && s.stab > (globalThis.STAB_T || 35) && rAge >= 18 && !r.traits.includes('couard')) { const best = D.borderTargets(s).map(x => [x.i, D.campaignOdds(s, x.i)]).sort((a, b) => b[1] - a[1])[0]; if (best && best[1] >= (globalThis.ODDS_T || 0.55)) return ['campagne', best[0]]; }
  if (ok('pelerinage') && s.gold > 40 && e('pelerinage') > 0.8 && rand0() < 0.3) return ['pelerinage'];
  if (ok('eduquer') && s.gold > 25 && rand0() < 0.3) return ['eduquer'];
  if (s.stab < 45 && ok('festin') && e('festin') > 0.65) return ['festin'];
  if (s.menace > 40 && ok('intrigue') && e('intrigue') > 0.7 && D.rivalCount(s) > 0 && rand0() < 0.4) return ['intrigue'];
  if (s.menace > 40 && ok('ambassade') && e('ambassade') > 0.7) return ['ambassade'];
  return ['attendre'];
}
let seed0 = 12345; function rand0() { seed0 = (seed0 * 1103515245 + 12345) & 0x7fffffff; return seed0 / 0x7fffffff; }

function randomAction(s) {
  if (rand0() < 0.3) { const k = ['fisc', 'cour', 'ost'][Math.floor(rand0() * 3)]; s.pol[k] = Math.floor(rand0() * 3); }
  const acts = D.getActions(s).filter(a => a.ok);
  const a = acts[Math.floor(rand0() * acts.length)];
  if (a.id === 'marier') { const ua = D.unmarriedAdults(s); const p = ua[Math.floor(rand0() * ua.length)]; const L = D.marriageMarket(s, p).map((c, i) => [c, i]).filter(([c]) => D.candidateFx(s, p, c).ok); return L.length ? ['marier', p.id, L[Math.floor(rand0() * L.length)][1]] : ['attendre']; }
  return [a.id];
}

// Stratège : essaie chaque action sur plusieurs futurs simulés (même graine différente) et garde la meilleure
function allMoves(s) {
  const out = [];
  for (const a of D.getActions(s)) {
    if (!a.ok) continue;
    if (a.id === 'marier') { for (const p of D.unmarriedAdults(s)) D.marriageMarket(s, p).forEach((c, i) => { if (D.candidateFx(s, p, c).ok) out.push(['marier', p.id, i]); }); }
    else out.push([a.id]);
  }
  return out;
}
function strategistAction(s, samples = 4) {
  setPolicies(s);
  let best = null, bv = -Infinity;
  for (const m of allMoves(s)) {
    let tot = 0;
    for (let k = 0; k < samples; k++) {
      const c = clone(s); c.r = (c.r ^ ((k + 1) * 2654435761) ^ 0x5bd1e995) | 0;
      D.playTurn(c, ...m);
      if (c.event && !c.over) D.resolveEvent(c, bestChoice(c));
      // un tour supplémentaire joué par l'heuristique pour voir un peu plus loin
      if (!c.over) { D.playTurn(c, ...heuristicAction(c)); if (c.event && !c.over) D.resolveEvent(c, bestChoice(c)); }
      tot += value(c);
    }
    if (tot > bv) { bv = tot; best = m; }
  }
  return best;
}
function bestChoice(s, samples = 3) {
  let bi = 0, bv = -Infinity;
  s.event.choices.forEach((_, i) => {
    let tot = 0;
    for (let k = 0; k < samples; k++) { const c = clone(s); c.r = (c.r ^ ((k + 1) * 40503 + 7) ^ 0x1b873593) | 0; D.resolveEvent(c, i); tot += value(c); }
    if (tot > bv) { bv = tot; bi = i; }
  });
  return bi;
}

function playOne(seed, bot, params) {
  const s = D.createGame(seed, params);
  let guard = 0;
  while (!s.over && guard++ < 500) {
    let m = bot === 'random' ? randomAction(s) : bot === 'heur' ? heuristicAction(s) : strategistAction(s);
    if (m[0] === 'recruter' && m[2] == null && bot !== 'random' && globalThis.TROOP_BOT !== 0) { const mx = D.mixOf(s), T = D.TROOPS; let k = 'pietons'; if (s.menace > 50 && mx.ar < 0.35 && s.gold >= T.archers.cost) k = 'archers'; else if (globalThis.WAR && mx.ch < 0.3 && s.gold >= T.chevaliers.cost + 20) k = 'chevaliers'; else if (mx.ar < 0.2 && s.gold >= T.archers.cost) k = 'archers'; m = ['recruter', null, k]; }
    if (m[0] === 'eduquer' && m[1] == null && bot !== 'random' && globalThis.EDU_BOT !== 0) { const h = D.heir(s); if (h) { const P = D.EDU_PATHS; const k = Object.keys(P).find(k => h.traits.includes(P[k].fix)) || Object.keys(P).filter(k => P[k].good.some(t => !h.traits.includes(t))).sort((a, b) => D.eduChance(s, b) - D.eduChance(s, a))[0]; if (k) m = ['eduquer', k]; } }
    if (m[0] === 'construire' && m[2] == null && bot !== 'random') m = ['construire', m[1] != null ? m[1] : null, pickBuild(s)];
    if (m[0] === 'campagne' && m[2] == null && bot !== 'random' && globalThis.TACTIC_BOT !== 0 && m[1] != null) { const reg = s.regions[m[1]], st = D.scoutReport(s, reg); m = ['campagne', m[1], Object.keys(D.TACTICS).sort((a, b) => D.tacticMult(s, b, st) - D.tacticMult(s, a, st))[0]]; }
    D.playTurn(s, ...m);
    if (s.event && !s.over) D.resolveEvent(s, bot === 'random' ? Math.floor(rand0() * s.event.choices.length) : bestChoice(s));
  }
  return s;
}

function run(bot, n, params, seedBase = 1000) {
  const res = { bot, n, wins: 0, causes: {}, turns: 0, rulers: 0, score: 0, winScore: 0, actions: {}, eventsSeen: {} };
  for (let i = 0; i < n; i++) {
    const s = playOne(seedBase + i * 7919, bot, params);
    const c = s.result ? s.result.cause : 'timeout';
    res.causes[c] = (res.causes[c] || 0) + 1;
    if (s.result && s.result.won) { res.wins++; res.winScore += s.result.score; }
    res.turns += s.turn; res.rulers += s.rulers.length; res.score += s.result ? s.result.score : 0;
  }
  res.winRate = res.wins / n; res.avgTurns = res.turns / n; res.avgRulers = res.rulers / n; res.avgScore = res.score / n; res.avgWinScore = res.wins ? res.winScore / res.wins : 0;
  return res;
}
function fmt(r) {
  const c = Object.entries(r.causes).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${(v / r.n * 100).toFixed(0)}%`).join(' ');
  return `${r.bot.padEnd(6)} n=${r.n} win=${(r.winRate * 100).toFixed(1)}% tours=${r.avgTurns.toFixed(1)} souverains=${r.avgRulers.toFixed(1)} score=${r.avgScore.toFixed(0)} (gagnants ${r.avgWinScore.toFixed(0)}) | ${c}`;
}

module.exports = { chooseCandidate, setPolicies, run, fmt, playOne, heuristicAction, strategistAction, bestChoice, value };
if (require.main === module) {
  const params = process.argv[2] ? JSON.parse(process.argv[2]) : {};
  const n = +process.argv[3] || 1000, ns = +process.argv[4] || 200;
  console.log(fmt(run('random', n, params)));
  console.log(fmt(run('heur', n, params)));
  const t = Date.now();
  console.log(fmt(run('strat', ns, params)), `(${((Date.now() - t) / 1000).toFixed(1)}s)`);
}
