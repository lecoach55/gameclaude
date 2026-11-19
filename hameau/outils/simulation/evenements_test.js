// Petits événements à décision (décision de Victor 18/11) : contrôles de non-régression.
// Usage : node evenements_test.js [ANCIEN=chemin/vers/ancien/sim.js] — sans ANCIEN, seuls les contrôles propres aux événements tournent.
const path=require('path'),fs=require('fs');const Sim=require(path.join(__dirname,'../../jeu/sim.js'));
let ok=true;const chk=(c,m)=>{console.log((c?'OK  ':'ÉCHEC ')+m);if(!c)ok=false;};
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const {bot}=require(path.join(__dirname,'../../jeu/bot.js'));
function partie(SimM,params,seed,jours,joue){const S=SimM.create(params,mulberry(seed*7+1));S.newGame(seed);const opt={fieldPerPop:0.8,fieldDir:[0,1]};let bt=0,neg=0;
  for(let t=0;t<48*jours;t+=0.05){S.step(0.05);if((bt+=0.05)>=8){bt=0;joue(S,opt);}for(const k in S.res)if(S.res[k]<0)neg++;}return {S,neg};}
// 1. événements coupés = simulation d'avant (le tirage des événements ne consomme pas le hasard de la simulation)
if(process.env.ANCIEN){const Old=require(path.resolve(process.env.ANCIEN));const sansDec=(S,o)=>{const e=S.evt;S.evt=null;bot(S,o);S.evt=e;};
  for(const seed of [1,2]){const a=partie(Old,{},seed,30,sansDec).S,b=partie(Sim,{evtRate:0},seed,30,sansDec).S;
    chk(a.villagers.length===b.villagers.length&&Math.round(a.res.food)===Math.round(b.res.food)&&a.stats.deaths===b.stats.deaths,`graine ${seed} : événements coupés → même partie qu'avant (pop ${a.villagers.length}/${b.villagers.length}, 🍞 ${Math.round(a.res.food)}/${Math.round(b.res.food)})`);}}
// 2. partie avec événements : ni ressource négative ni troupeau vidé, environ un événement par saison après la 1re année
for(const seed of [3,4]){const {S,neg}=partie(Sim,{},seed,60,bot);const sa=Math.floor(S.time/S.P.seasonLen)-S.P.evtStart;
  chk(neg===0&&S.stats.events>=sa*0.4&&S.stats.events<=sa,`graine ${seed} : ${S.stats.events} événements en ${sa} saisons, ressources jamais négatives, ${S.sheep.length} moutons`);}
// 3. ancienne sauvegarde (sans les nouveaux champs) : chargée, champs complétés, fichier jamais modifié ; événement en cours sauvegardé puis repris
const f=path.join(__dirname,'../../jeu/test_save.json'),brut=fs.readFileSync(f,'utf8'),ts=JSON.parse(brut);
const V=Sim.create();chk(V.deserialize(JSON.parse(brut))&&V.evt===null&&Array.isArray(V.evH)&&V.evS===Math.floor(ts.time/V.P.seasonLen),'ancienne sauvegarde : champs complétés (aucun événement en cours, saison courante déjà vue)');
V.P.evtChance=1;let vu=null;V.onEvent=(t,d)=>{if(t==='event'&&!vu)vu=d.k;};for(let i=0;i<4000&&!V.evt;i++)V.step(0.05);
chk(!!V.evt,'un événement survient dans la saison suivante ('+vu+')');const d=JSON.parse(JSON.stringify(V.serialize()));const W2=Sim.create();
chk(W2.deserialize(d)&&W2.evt&&W2.evt.k===V.evt.k&&W2.evtView().opts.length===2,'événement en cours conservé par la sauvegarde');
const t0=W2.time,u=W2.evt.until;for(let i=0;i<4000&&W2.evt;i++)W2.step(0.05);chk(!W2.evt&&W2.time>=u-0.01&&W2.stats.evAuto===1,`sans décision : choix par défaut appliqué au bout de ${Math.round(W2.time-t0)} s`);
const X=Sim.create();X.deserialize(d);chk(X.decide(0)&&!X.evt&&X.decide(0)===false,'décision du joueur appliquée une seule fois');
chk(fs.readFileSync(f,'utf8')===brut,'test_save.json inchangé');
console.log(ok?'TOUT EST VERT':'ÉCHECS');process.exit(ok?0:1);
