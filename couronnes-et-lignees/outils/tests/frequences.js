// Fréquence de chaque événement par partie (bot attentif) : repère les événements trop fréquents ou jamais vus.
// usage : JEU=jeu node outils/tests/frequences.js [parties=400]
const path = require('path'), J = process.env.JEU || '.';
const D = require(path.resolve(J, 'engine.js')), S = require(path.resolve(J, 'sim.js'));
const n = +process.argv[2] || 400, c = {}, era = {}, orig = D.resolveEvent, oc = D.createGame;
// seules les vraies parties comptent (pas les copies que le bot simule pour choisir) : marque non copiable
D.createGame = (...a) => { const s = oc(...a); Object.defineProperty(s, '_vraie', { value: true }); return s; };
D.resolveEvent = (s, i) => { if (s.event && s._vraie) { c[s.event.id] = (c[s.event.id] || 0) + 1; const e = D.eraOf(s); (era[s.event.id] = era[s.event.id] || [0, 0, 0])[e]++; } return orig(s, i); };
const r = S.run('heur', n); D.resolveEvent = orig; D.createGame = oc;
const rows = D.EVENTS.map(e => [e.id, (c[e.id] || 0) / n, era[e.id] || [0, 0, 0]]).sort((a, b) => b[1] - a[1]);
console.log(`${n} parties, ${r.avgTurns.toFixed(1)} tours, victoire ${(r.winRate * 100).toFixed(1)} %`);
console.log('Les plus fréquents (par partie) :'); for (const x of rows.slice(0, 12)) console.log(' ', x[0].padEnd(20), x[1].toFixed(2), '  âges', x[2].join('/'));
console.log('Rares (< 0,15 par partie) :', rows.filter(x => x[1] < 0.15).map(x => x[0] + ' ' + x[1].toFixed(2)).join(', '));
const per = [0, 0, 0]; for (const k in era) era[k].forEach((v, i) => per[i] += v); console.log('Événements par âge (barons / cathédrales / fléaux) :', per.map(v => (v / n).toFixed(1)).join(' / '));
