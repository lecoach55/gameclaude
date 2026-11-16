// Mesure de la redondance : ce que le joueur voit trop souvent dans une partie complète.
// Usage : node outils/redondance.js [N=3] [bot=sage] [sortie.json]
// Joue N parties par scénario (robots de sim2.js) et compte, PAR PARTIE :
//  - les événements affichés (id), l'intervalle moyen entre deux retours du même événement,
//  - les illustrations réellement montrées (art de l'instance, repli 'church' comme ui.js),
//    et la part d'événements dont l'image est la même que celle de l'événement précédent,
//  - les titres et textes identiques (même phrase exacte revue),
//  - les lignes de chronique répétées (chiffres et noms propres neutralisés).
const fs = require('fs'), vm = require('vm'), path = require('path');
const ctx = { console, Math, JSON, btoa: s => Buffer.from(s, 'binary').toString('base64'), atob: s => Buffer.from(s, 'base64').toString('binary') };
vm.createContext(ctx);
for (const f of ['data.js', 'engine.js', 'events.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '../jeu/', f), 'utf8'), ctx, { filename: f });
// reprend le code des robots de sim2.js sans lancer ses parties
const simSrc = fs.readFileSync(path.join(__dirname, 'sim2.js'), 'utf8');
vm.runInContext(simSrc.split('vm.runInContext(`')[1].split('`, ctx);')[0].replace(/\\\\/g, '\\'), ctx);
vm.runInContext(`
var SEEN=null;
var _resolve=resolve; resolve=function(sm){ for(const e of S.events){ if(e.special) continue; SEEN.push({id:e.id||'?',art:e.art||'church',title:e.title||'',text:e.text||'',t:S.turn}); } return _resolve(sm); };
function partie(scen,bot){ SEEN=[]; const r=run(scen,bot,1); return {r,seen:SEEN,log:S.log.map(l=>l.t)}; }
`, ctx);
const N = +process.argv[2] || 3, bot = process.argv[3] || 'sage', out = process.argv[4];
const norm = t => t.replace(/<[^>]+>/g, '').replace(/[0-9]+/g, '#').replace(/\b[A-ZÉÈÂÎ][\wÀ-ÿ’'-]+/g, 'X').slice(0, 90);
const A = { parties: 0, evts: 0, ids: {}, arts: {}, memeArt: 0, texte20: 0, t20: {}, titresRep: 0, textesRep: 0, logRep: {}, annees: 0, idsParPartie: [] };
for (const sc of ['1073', '1198', '1294', '1378']) for (let i = 0; i < N; i++) {
  const { r, seen, log } = vm.runInContext(`partie('${sc}','${bot}')`, ctx);
  A.parties++; A.evts += seen.length; A.annees += r.end - +sc;
  const last = {}, gaps = {}, cnt = {}, titres = new Set(), textes = new Set(), texteVu = {};
  let prevArt = null;
  for (const e of seen) {
    cnt[e.id] = (cnt[e.id] || 0) + 1;
    if (last[e.id] !== undefined) (gaps[e.id] = gaps[e.id] || []).push(e.t - last[e.id]);
    last[e.id] = e.t;
    A.arts[e.art] = (A.arts[e.art] || 0) + 1;
    if (e.art === prevArt) A.memeArt++; prevArt = e.art;
    if (titres.has(e.title)) A.titresRep++; titres.add(e.title);
    if (textes.has(e.text)) A.textesRep++; textes.add(e.text);
    if (texteVu[e.text] !== undefined && e.t - texteVu[e.text] <= 80) { A.texte20++; A.t20[e.id] = (A.t20[e.id] || 0) + 1; } texteVu[e.text] = e.t;
  }
  for (const [id, c] of Object.entries(cnt)) { const o = A.ids[id] = A.ids[id] || { n: 0, max: 0, gaps: [] }; o.n += c; o.max = Math.max(o.max, c); o.gaps.push(...(gaps[id] || [])); }
  const lc = {}; for (const l of log) { const k = norm(l); lc[k] = (lc[k] || 0) + 1; }
  for (const [k, c] of Object.entries(lc)) A.logRep[k] = (A.logRep[k] || 0) + c;
  A.idsParPartie.push(Object.keys(cnt).length);
}
const P = A.parties, ev = A.evts;
const top = Object.entries(A.ids).map(([id, o]) => ({ id, parPartie: +(o.n / P).toFixed(1), max: o.max, ecartSaisons: o.gaps.length ? Math.round(o.gaps.reduce((a, b) => a + b, 0) / o.gaps.length) : null })).sort((a, b) => b.parPartie - a.parPartie);
const res = {
  bot, parties: P, evtsParPartie: +(ev / P).toFixed(1), anneesParPartie: Math.round(A.annees / P),
  idsDifferentsParPartie: Math.round(A.idsParPartie.reduce((a, b) => a + b, 0) / P),
  illustrationsDifferentes: Object.keys(A.arts).length,
  partIllustrationPrincipale: +(Math.max(...Object.values(A.arts)) / ev * 100).toFixed(1),
  memeImageQuePrecedent: +(A.memeArt / ev * 100).toFixed(1),
  titresDejaVus: +(A.titresRep / ev * 100).toFixed(1), texteRevuMoins20ans: +(A.texte20 / ev * 100).toFixed(1), textesDejaVus: +(A.textesRep / ev * 100).toFixed(1),
  arts: Object.fromEntries(Object.entries(A.arts).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, +(v / ev * 100).toFixed(1)])),
  top15: top.slice(0, 15),
  texteRevuParId: Object.entries(A.t20).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([id, v]) => [id, +(v / P).toFixed(1)]),
  chroniqueTop: Object.entries(A.logRep).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => ({ ligne: k, parPartie: +(v / P).toFixed(1) })),
};
console.log(`${P} parties (${bot}) · ${res.evtsParPartie} événements/partie sur ~${res.anneesParPartie} ans · ${res.idsDifferentsParPartie} événements différents/partie`);
console.log(`illustrations : ${res.illustrationsDifferentes} différentes · la plus vue = ${res.partIllustrationPrincipale} % · même image que l'événement précédent : ${res.memeImageQuePrecedent} %`);
console.log(`titres déjà vus dans la partie : ${res.titresDejaVus} % · textes déjà vus : ${res.textesDejaVus} % · même texte mot pour mot revu en moins de 20 ans : ${res.texteRevuMoins20ans} %`);
console.log('les plus fréquents (par partie, max, écart moyen en saisons) :');
for (const t of res.top15) console.log(`  ${t.id.padEnd(16)} ${String(t.parPartie).padStart(5)}  max ${t.max}  écart ${t.ecartSaisons}`);
console.log('textes revus mot pour mot en moins de 20 ans (par partie) : ' + res.texteRevuParId.map(([i, v]) => i + ' ' + v).join(', '));
console.log('chronique la plus répétée :'); for (const c of res.chroniqueTop) console.log(`  ${String(c.parPartie).padStart(6)}  ${c.ligne}`);
if (out) fs.writeFileSync(out, JSON.stringify(res, null, 1));
