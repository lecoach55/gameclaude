const { JSDOM } = require('jsdom'); const fs = require('fs');
const file = process.argv[2] || '/home/claude/president/index.html';
const games = +process.argv[3] || 8, maxSeasons = +process.argv[4] || 12;
const html = fs.readFileSync(file, 'utf8'); const bot = fs.readFileSync(__dirname + '/bot.js', 'utf8');
const strats = (process.argv[5] || 'prudent,depensier,formation,equilibre').split(',');
const all = {};
for (const st of strats) {
 all[st] = [];
 for (let g = 0; g < games; g++) {
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://x.test/' });
  const w = dom.window; w.scrollTo = () => { }; const errs = [];
  w.addEventListener('error', e => errs.push(e.message));
  w.eval(bot);
  w.eval(`BOT.strat='${st}';
   const _rec=record; record=function(h,a,gh,ga){ if(!h.user&&!a.user){BOT.stats.matches.n++;BOT.stats.matches.goals+=gh+ga; if(gh>ga)BOT.stats.matches.h++; else if(gh<ga)BOT.stats.matches.a++; else BOT.stats.matches.d++;} else { const my=h.user?gh:ga, op=h.user?ga:gh; if(my>op)BOT.stats.mine.w++; else if(my<op)BOT.stats.mine.l++; else BOT.stats.mine.d++; if(h.user) BOT.home=true; else BOT.home=false;} return _rec(h,a,gh,ga); };
   BOT.x={club:{},player:{},inj:0,reds:0,coachReq:0,resign:0,promise:0,youthGain:[],ages:[],offers:0,newsTypes:{}};
   const _co=clubOffer;clubOffer=function(p,a){const r=_co(p,a);BOT.x.club[r]=(BOT.x.club[r]||0)+1;return r;};
   const _po=playerOffer;playerOffer=function(p,o){const r=_po(p,o);BOT.x.player[r]=(BOT.x.player[r]||0)+1;return r;};
   const _um=userMatch;userMatch=function(...a){const d=_um(...a);d.ev.forEach(e=>{if(e.k==='inj')BOT.x.inj++;if(e.k==='rc')BOT.x.reds++;});return d;};
   const _nw=news;news=function(t,ty){if(/démissionne/.test(t))BOT.x.resign++;if(/promis une place/.test(t))BOT.x.promise++;if(/Offre de .* reçue/.test(t))BOT.x.offers++;return _nw(t,ty);};
   UI.setup.diff=1; document.getElementById('cTown').value='Clichy'; A.create();`);
  let steps = 0, err = null;
  try {
   while (steps++ < 4000) {
    const S = w.eval('S');
    if (S.over) break;
    if (w.eval('BOT.stats.seasons.length') >= maxSeasons) break;
    if (w.eval('UI.modalOpen')) { w.eval('BOT.handleModal()'); w.eval('if(!UI.modalOpen)nextQueue()'); continue; }
    w.eval('BOT.weekly()');
    w.eval('A.play()');
    w.eval('{const r=S.myResults[S.myResults.length-1]; if(r&&r.home){BOT.lastAtt=r.att; BOT.stats.attUtil.push(r.att/cap());}}');
   }
  } catch (e) { err = e.stack.split('\n').slice(0, 3).join(' | '); }
  const S = w.eval('S'); const stats = w.eval('BOT.stats');
  const perf=w.eval(`(()=>{const o={};['accueil','calendrier','classement','stats','effectif','mercato','staff','infra','finances','coupe','club'].forEach(t=>{const t0=performance.now();UI.tab=t;render();o[t]=Math.round(performance.now()-t0);});o.size=JSON.stringify(S).length;o.news=S.news.length;o.tr=(S.transfers||[]).length;o.rec=Object.keys(S.rec||{}).length;o.hist=S.players.reduce((a,p)=>a+(p.hist||[]).length,0);o.market=S.market.length;o.reports=JSON.stringify(S.reports||{}).length;o.roundRes=JSON.stringify(S.roundRes||[]).length;o.teams=JSON.stringify(S.teams).length;o.players=JSON.stringify(S.players).length;o.trJ=JSON.stringify(S.transfers||[]).length;o.recJ=JSON.stringify(S.rec||{}).length;o.mkJ=JSON.stringify(S.market).length;return o;})()`);
  const X=w.eval('BOT.x');const P=w.eval('S.players.map(p=>({a:p.age,o:p.ovr,pot:p.pot,y:p.youth,m:p.morale,w:p.wage,h:(p.hist||[]).length}))');
  all[st].push({perf,x:X,P, over: S.over ? S.over.t : null, maxDiv: S.maxDiv, seasons: stats.seasons, stats, errs: errs.slice(0, 3), err, palmares: S.palmares, cupLog: S.cup.log.length });
  w.close();
 }
}
fs.writeFileSync(__dirname + '/results.json', JSON.stringify(all));
// résumé
const LVn = ['R2', 'R1', 'N2', 'N1', 'L3', 'L2', 'L1'];
for (const st in all) {
 const G = all[st];
 const md = G.map(g => LVn[g.maxDiv]); const overs = G.filter(g => g.over).map(g => g.over + '@' + g.seasons.length);
 const m = G.reduce((a, g) => { for (const k in g.stats.matches) a[k] = (a[k] || 0) + g.stats.matches[k]; return a; }, {});
 const mine = G.reduce((a, g) => { for (const k in g.stats.mine) a[k] = (a[k] || 0) + g.stats.mine[k]; return a; }, {});
 const util = G.flatMap(g => g.stats.attUtil); const uAvg = util.reduce((a, b) => a + b, 0) / util.length;
 const full = util.filter(u => u > .97).length / util.length;
 console.log(`\n=== ${st.toUpperCase()} (${G.length} parties) ===`);
 console.log('Niveau max :', md.join(' '));
 console.log('Fins de partie :', overs.join(', ') || 'aucune');
 console.log('Erreurs :', G.map(g => g.err || g.errs.join(';')).filter(Boolean).join(' || ') || 'aucune');
 console.log(`Matchs IA : ${m.n} | dom ${(m.h / m.n * 100).toFixed(0)}% nul ${(m.d / m.n * 100).toFixed(0)}% ext ${(m.a / m.n * 100).toFixed(0)}% | buts/match ${(m.goals / m.n).toFixed(2)}`);
 console.log(`Nos matchs : V${mine.w} N${mine.d} D${mine.l} | stade rempli à ${(uAvg * 100).toFixed(0)}% en moyenne, guichets fermés ${(full * 100).toFixed(0)}%`);
 const s = G.reduce((a, g) => { a.sign += g.stats.signings; a.builds += g.stats.builds; a.loans += g.stats.loans; a.ref += g.stats.refused; a.rf += g.stats.renewFail; return a; }, { sign: 0, builds: 0, loans: 0, ref: 0, rf: 0 });
 console.log(`Signatures ${s.sign} | chantiers ${s.builds} | prêts ${s.loans} | montées refusées ${s.ref} | prolongations refusées ${s.rf}`);
 const ev = {}; G.forEach(g => { for (const k in g.stats.events) ev[k] = (ev[k] || 0) + g.stats.events[k]; });
 const XX=G.reduce((a,g)=>{for(const k of ['inj','reds','resign','promise','offers'])a[k]=(a[k]||0)+g.x[k];for(const k in g.x.club)a['c_'+k]=(a['c_'+k]||0)+g.x.club[k];for(const k in g.x.player)a['p_'+k]=(a['p_'+k]||0)+g.x.player[k];return a;},{});
 console.log('Divers :',JSON.stringify(XX));
 G.forEach((g,i)=>console.log(' perf/taille partie',i+1,JSON.stringify(g.perf)));
 const evS={};G.forEach(g=>{const n=g.seasons.length||1;for(const k in g.stats.events)evS[k]=(evS[k]||0)+g.stats.events[k]/n;});console.log('Événements par saison (moy.) :',Object.entries(evS).map(([k,v])=>k+':'+(v/G.length).toFixed(1)).join(' '),'| total/saison',(Object.values(evS).reduce((a,b)=>a+b,0)/G.length).toFixed(1));
 const reach={};G.forEach(g=>{g.seasons.forEach((x,i)=>{const d=x.div+(x.out==='up'?1:0);if(reach[d]==null||i+1<reach[d][0])reach[d]=[i+1];});});
 const PP=G.flatMap(g=>g.P);console.log('Effectifs finaux : âge moyen',(PP.reduce((a,p)=>a+p.a,0)/PP.length).toFixed(1),'moral moyen',(PP.reduce((a,p)=>a+p.m,0)/PP.length).toFixed(0),'marge pot moyenne',(PP.reduce((a,p)=>a+p.pot-p.o,0)/PP.length).toFixed(1),'part >30 ans',(PP.filter(p=>p.a>30).length/PP.length*100).toFixed(0)+'%','jeunes',PP.filter(p=>p.a<=20).length);
 console.log('Événements :', Object.entries(ev).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ':' + v).join(' '));
 const bl = {}; G.forEach(g => { for (const k in g.stats.blocked) bl[k] = (bl[k] || 0) + g.stats.blocked[k]; }); console.log('Chantiers bloqués :', JSON.stringify(bl));
 G.slice(0, 3).forEach((g, i) => { console.log(` partie ${i + 1}:`); g.seasons.forEach(x => console.log(`   ${x.y} ${LVn[x.div]} ${x.pos}e ${x.out} obj:${x.obj}${x.objOk ? '✓' : '✗'} str${x.str}/lg${x.lg} cash ${x.cash} inc ${x.inc} exp ${x.exp} sal ${Math.round(x.wages)} staff ${Math.round(x.staff)} fans ${x.fans} att ${x.att}/${x.cap} €${x.ticket} conf ${x.conf} mood ${x.mood} rep ${x.rep} squad ${x.squad} dette ${x.debt}`)); });
}
