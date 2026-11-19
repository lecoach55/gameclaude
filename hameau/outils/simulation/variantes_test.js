// Arrivées « étalées » / « vague » (décision de Victor 16/11) : la variante tirée à la graine est gardée par la sauvegarde ; une ancienne sauvegarde reste en « vague » et évolue exactement comme avant.
// Usage : node variantes_test.js   (ANCIEN=chemin/vers/ancien/sim.js pour comparer à une version précédente)
const Sim=require(require('path').join(__dirname,'../../jeu/sim.js'));const fs=require('fs');let ok=true;const chk=(c,m)=>{console.log((c?'OK  ':'ÉCHEC ')+m);if(!c)ok=false;};
for(const seed of [1,2]){const S=Sim.create();S.newGame(seed);for(let i=0;i<4000;i++)S.step(0.05);const d=JSON.parse(JSON.stringify(S.serialize()));
  const T=Sim.create();chk(T.deserialize(d)&&T.arr===S.arr,`graine ${seed} : variante ${S.arr} conservée après sauvegarde/chargement`);
  delete d.arr;delete d.dl;delete d.bl;const U=Sim.create();chk(U.deserialize(d)&&U.arr==='vague',`graine ${seed} : ancienne sauvegarde (sans variante) → vague (comportement d'avant)`);for(let i=0;i<2000;i++)U.step(0.05);}
const ts=JSON.parse(fs.readFileSync(require('path').join(__dirname,'../../jeu/test_save.json')));const V=Sim.create();chk(V.deserialize(ts)&&V.arr==='vague','partie de test (134 hab.) chargée en variante vague');
for(let i=0;i<20000;i++)V.step(0.05);chk(V.villagers.length>0,'partie de test jouée 1000 s sans erreur ('+V.villagers.length+' hab., '+V.stats.deaths+' décès)');
// ancienne sauvegarde jouée sur l'ancienne et la nouvelle simulation : mêmes résultats (la variante ne change pas)
const Old=require(process.env.ANCIEN||require('path').join(__dirname,'../../jeu/sim.js'));const mul=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const A=Old.create({},mul(5)),B=Sim.create({evtRate:0},mul(5));A.deserialize(JSON.parse(JSON.stringify(ts)));B.deserialize(JSON.parse(JSON.stringify(ts)));for(let i=0;i<40000;i++){A.step(0.05);B.step(0.05);}
chk(A.villagers.length===B.villagers.length&&A.stats.deaths===B.stats.deaths&&Math.round(A.res.food)===Math.round(B.res.food),`ancienne partie : même évolution avant/après (petits événements coupés, 19/11) (${A.villagers.length}/${B.villagers.length} hab., ${A.stats.deaths}/${B.stats.deaths} décès)`);
process.exit(ok?0:1);
