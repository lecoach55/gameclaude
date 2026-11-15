// Parties automatiques : node outils/sim_monde.js [graines] [années] [strategie]
const M=require('../jeu/moteur.js'),D=require('../jeu/data.js');
const N=+process.argv[2]||3,ANS=+process.argv[3]||8,strat=process.argv[4]||'bon';
const t0=Date.now();let tot={titres:0,apex:0,fail:0};
for(let g=1;g<=N;g++){
 M.nouvellePartie({graine:g*7919});const G=M.G;let maxT=0,err=0;const log=[];
 for(let w=0;w<52*ANS;w++){
  try{
   const out=M.avancer();
   if(G.popup){M.choisir(strat==='bon'?(G.popup.id==='rachat'?1:0):Math.floor(Math.random()*G.popup.ch.length));}
   for(const o of [...G.offres]){if(o.type==='combat'){if(strat!=='passif'||Math.random()<.5)M.accepterCombat(o.id);}
    else{const f=G.F[o.f];const cur=f.org?M.ORG(f.org).tier:-1;if(M.ORG(o.org).tier>=cur||!f.org||o.renouv)M.accepterContrat(o.id);}}
   for(const cid of [...G.aJouer]){M.jouerMonCombat(cid,M.preparerSim(cid,'equi'));}
   for(const f of M.mes()){f.train.i=f.fat>55?0:f.fat>35?1:2;const foc=['frappe','lutte','sol','physique','equi'];const a=f.at;
    f.train.f=f.fat>75?'repos':(a.lutte<a.frappe-8?'lutte':a.sol<a.frappe-10?'sol':a.cardio<60?'physique':foc[w%5]);}
   if(strat==='bon'){const S=M.SALLES[G.salle.niv+1];if(S&&G.argent>S.prix*1.3)M.ameliorerSalle();
    for(const k of ['boxe','lutte','jjb','physique','medecin'])if(G.coachs[k]<3&&G.argent>M.COACH_PAYE[G.coachs[k]+1]*40&&G.semRec-G.semDep>M.COACH_PAYE[G.coachs[k]+1])G.coachs[k]++;
    if(M.mes().length<M.SALLES[G.salle.niv].cap){const r=G.recrues.map(id=>G.F[id]).filter(f=>f&&f.prime<G.argent*.35).sort((a,b)=>(b.pot-a.pot))[0];if(r&&r.pot>70)M.signer(r.id);}}
   for(const f of M.mes()){const t=f.org?M.ORG(f.org).tier:-1;if(t>maxT)maxT=t;}
  }catch(e){err++;if(err<3)console.log('ERREUR',e.stack.split('\n').slice(0,3).join(' | '));}
  if(w%52===51){const ms=M.mes();log.push('A'+(w+1)/52+': '+Math.round(G.argent/1000)+'k€ salle'+G.salle.niv+' mb'+G.salle.membres+' '+ms.map(f=>(f.org?M.ORG(f.org).court:'libre')+':'+M.ov(f)+'('+f.v+'-'+f.d+')').join(' '));}
 }
 const nb={};for(const id in G.F){const f=G.F[id];if(!f.ret&&f.org)nb[f.org]=(nb[f.org]||0)+1;}
 console.log('— graine',g,'titres',G.stats.titres,'V-D',G.stats.v+'-'+G.stats.d,'max tier',maxT,'erreurs',err,'effectifs',JSON.stringify(nb),'combattants',Object.keys(G.F).length);
 log.forEach(l=>console.log('  ',l));
 tot.titres+=G.stats.titres;if(maxT>=4)tot.apex++;if(G.argent<0)tot.fail++;
 console.log('   trophées:',G.trophees.map(t=>M.ORG(t.org).court+'@'+(Math.floor(t.s/52)+1)).join(' '));
}
console.log('TOTAL',JSON.stringify(tot),((Date.now()-t0)/1000).toFixed(1)+'s');
