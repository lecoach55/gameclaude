// Mesure de la redondance
const D=require(require('path').resolve(process.env.JEU||'.','engine.js')),S=require(require('path').resolve(process.env.JEU||'.','sim.js'));
const N=+process.argv[2]||500, BOT=process.argv[3]||'heur';
let seed0=777;const rnd=()=>{seed0=(seed0*1103515245+12345)&0x7fffffff;return seed0/0x7fffffff;};
const A={},Aera=[{},{},{}],ev={},evChoice={},stats={turns:0,repeatPrev:0,streakMax:0,evPerGame:0,distinctEv:0,maxSameEv:0,quietTurns:0,wins:0};
const R={};
for(let g=0;g<N;g++){
  const s=D.createGame(31337+g*7919);let prev=null,streak=0,best=0;const seen={};
  while(!s.over){
    const m=BOT==='heur'?S.heuristicAction(s):BOT==='strat'?S.strategistAction(s):(()=>{const a=D.getActions(s).filter(x=>x.ok);const x=a[Math.floor(rnd()*a.length)];if(x.id==='marier'){const u=D.unmarriedAdults(s);return['marier',u[0].id,'local'];}return[x.id];})();
    const id=m[0];A[id]=(A[id]||0)+1;const era=Math.min(2,Math.floor((s.year-1200)/50));Aera[era][id]=(Aera[era][id]||0)+1;
    stats.turns++;if(id===prev){stats.repeatPrev++;streak++;}else streak=1;best=Math.max(best,streak);prev=id;
    const L=s.log.length;D.playTurn(s,...m);
    if(s.event&&!s.over){const e=s.event.id;ev[e]=(ev[e]||0)+1;seen[e]=(seen[e]||0)+1;const c=S.bestChoice(s);evChoice[e]=evChoice[e]||{};evChoice[e][c]=(evChoice[e][c]||0)+1;D.resolveEvent(s,c);}
    else if(!s.over) stats.quietTurns++;
  }
  if(s.result.won)stats.wins++;
  stats.streakMax+=best;stats.evPerGame+=Object.values(seen).reduce((a,b)=>a+b,0);stats.distinctEv+=Object.keys(seen).length;stats.maxSameEv+=Math.max(0,...Object.values(seen));
}
const pct=(a,b)=>(a/b*100).toFixed(0)+'%';
const tot=stats.turns;
console.log(`BOT ${BOT}, ${N} parties, victoire ${pct(stats.wins,N)}, ${(tot/N).toFixed(1)} tours/partie`);
console.log('Même action que le tour précédent:',pct(stats.repeatPrev,tot),'| plus longue série moyenne:',(stats.streakMax/N).toFixed(1));
console.log('Tours sans événement:',pct(stats.quietTurns,tot));
console.log('Événements/partie:',(stats.evPerGame/N).toFixed(1),'| distincts:',(stats.distinctEv/N).toFixed(1),'| le plus répété (moy. du max):',(stats.maxSameEv/N).toFixed(1));
console.log('\nActions (global | 1200-50 | 1250-1300 | 1300-50):');
for(const k of Object.keys(A).sort((a,b)=>A[b]-A[a])){const e=Aera.map(x=>{const t=Object.values(x).reduce((a,b)=>a+b,0);return pct(x[k]||0,t).padStart(4);}).join(' ');console.log(k.padEnd(11),pct(A[k],tot).padStart(4),'|',e);}
console.log('\nChoix dominants (choix retenu par le bot qui simule):');
const evs=D.EVENTS;
for(const k of Object.keys(ev).sort((a,b)=>ev[b]-ev[a])){const c=evChoice[k];const t=Object.values(c).reduce((a,b)=>a+b,0);const E=evs.find(x=>x.id===k);console.log(k.padEnd(17),String(ev[k]).padStart(5),'|',E.choices.map((ch,i)=>`${ch.l.slice(0,22)} ${pct(c[i]||0,t)}`).join(' / '));}
