// Parties automatiques : node outils/sim_monde.js [graines] [années] [strategie]   (CAMP=10 : le robot achète tout le camp dès que la trésorerie vaut 10 fois son prix)
const M=require('../jeu/moteur.js'),D=require('../jeu/data.js');
const N=+process.argv[2]||3,ANS=+process.argv[3]||8,strat=process.argv[4]||'bon';
const t0=Date.now();let tot={titres:0,apex:0,fail:0};
for(let g=1;g<=N;g++){
 M.nouvellePartie({graine:g*7919});const G=M.G;let maxT=0,err=0;const log=[];
 for(let w=0;w<52*ANS;w++){
  try{
   const out=M.avancer();
   for(const p of out.popups){if(p.id==='faillite')continue;M.choisir(strat==='bon'?(p.id==='rachat'?1:p.id==='veteran'?(Math.random()<.5?0:1):0):Math.floor(Math.random()*p.ch.length),p);}
   for(const o of [...G.offres]){if(o.type==='combat'){if(strat!=='passif'||Math.random()<.5)M.accepterCombat(o.id);}
    else{const f=G.F[o.f];const cur=f.org?M.ORG(f.org).tier:-1;if(M.ORG(o.org).tier>=cur||!f.org||o.renouv)M.accepterContrat(o.id);}}
   if(process.env.CAMP)for(const cid of [...G.aJouer]){const t=M.trouverCombat(cid);for(const k in M.CAMP)if(G.argent>M.CAMP[k].c(M.ORG(t.e.org).tier)*+process.env.CAMP)M.acheterCamp(cid,k);} // CAMP=n : achète le camp quand la trésorerie dépasse n fois son prix
   for(const cid of [...G.aJouer]){M.jouerMonCombat(cid,M.preparerSim(cid,'equi'));}
   for(const f of M.mes()){f.train.i=f.fat>55?0:f.fat>35?1:2;const foc=['frappe','lutte','sol','physique','equi'];const a=f.at;
    f.train.f=f.fat>75?'repos':(a.lutte<a.frappe-8?'lutte':a.sol<a.frappe-10?'sol':a.cardio<60?'physique':foc[w%5]);}
   if(strat==='bon'){const S=M.SALLES[G.salle.niv+1];if(S&&G.argent>S.prix*1.3)M.ameliorerSalle();if(M.CPX)for(const k in M.CPX)if(G.argent>M.CPX[k].prix*1.5)M.construire(k);
    for(const k of ['boxe','lutte','jjb','physique','medecin'])if(G.coachs[k]<3&&G.argent>M.COACH_PAYE[G.coachs[k]+1]*40&&G.semRec-G.semDep>M.COACH_PAYE[G.coachs[k]+1])G.coachs[k]++;
    if(M.mes().length<M.SALLES[G.salle.niv].cap){const r=G.recrues.map(id=>G.F[id]).filter(f=>f&&f.prime<G.argent*.35).sort((a,b)=>(b.pot-a.pot))[0];if(r&&r.pot>70)M.signer(r.id);}}
   for(const f of M.mes()){const t=f.org?M.ORG(f.org).tier:-1;if(t>maxT)maxT=t;}
  }catch(e){err++;if(err<3)console.log('ERREUR',e.stack.split('\n').slice(0,3).join(' | '));}
  if(w%52===51&&G.rival){const n=G.rival.v+G.rival.d+G.rival.n;(G._rv=G._rv||[]).push(n-(G._rvp||0));G._rvp=n;}
  if(w%52===51){const ms=M.mes();log.push('A'+(w+1)/52+': '+Math.round(G.argent/1000)+'k€ salle'+G.salle.niv+' mb'+G.salle.membres+' '+ms.map(f=>(f.org?M.ORG(f.org).court:'libre')+':'+M.ov(f)+'('+f.v+'-'+f.d+')').join(' '));}
 }
 const nb={};for(const id in G.F){const f=G.F[id];if(!f.ret&&f.org)nb[f.org]=(nb[f.org]||0)+1;}
 console.log('— graine',g,'titres',G.stats.titres,'V-D',G.stats.v+'-'+G.stats.d,'max tier',maxT,'erreurs',err,'effectifs',JSON.stringify(nb),'combattants',Object.keys(G.F).length);
 log.forEach(l=>console.log('  ',l));
 if(G.rival)console.log('   écurie rivale',G.rival.nom,'bilan',G.rival.v+'-'+G.rival.d,'combats par saison',(G._rv||[]).join(' '));
 tot.titres+=G.stats.titres;if(maxT>=4)tot.apex++;if(G.argent<0)tot.fail++;
 console.log('   objectifs/an:',(G.objHist||[]).map(x=>x.n).join(''),'commissions',M.mes().map(f=>Math.round(M.pctF(f)*100)).join('/'));console.log('   GP:',(G.gps||[]).map(x=>x.org+(G.F[x.v]&&G.F[x.v].mine?'*':'')).join(' '),'succès',Object.keys(G.succes||{}).length,'spons',(G.spons||[]).length,'prix',(G.prix||[]).length,'hof',(G.hof||[]).length,'complexe',Object.keys(G.cpx||{}).map(k=>k+'@'+(Math.floor(G.cpx[k]/52)+1)).join(' '),'académie signés',Object.values(G.F).filter(f=>f.academie&&f.mine).length);console.log('   trophées:',G.trophees.map(t=>M.ORG(t.org).court+'@'+(Math.floor(t.s/52)+1)).join(' '));
}
console.log('TOTAL',JSON.stringify(tot),((Date.now()-t0)/1000).toFixed(1)+'s');
