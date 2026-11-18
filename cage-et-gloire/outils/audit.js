// Audit des invariants du monde sur de longues parties : node outils/audit.js [graines] [années]
// Cherche : NaN, valeurs hors bornes, combats en double, ceintures vacantes trop longtemps,
// divisions vides, sauvegarde qui grossit sans fin, argent incohérent, offres orphelines.
const M=require('../jeu/moteur.js');
const N=+process.argv[2]||4,ANS=+process.argv[3]||12;
const pb={};const note=(k,ex)=>{pb[k]=pb[k]||{n:0,ex:[]};pb[k].n++;if(pb[k].ex.length<3)pb[k].ex.push(ex);};
const tailles=[];const t0=Date.now();
for(let g=1;g<=N;g++){
 M.nouvellePartie({graine:g*104729});const G=M.G;const vac={};
 for(let w=0;w<52*ANS;w++){
  let out;try{out=M.avancer();if(out.attente){note('avancer bloqué (combat non joué)','sem '+G.sem);for(const cid of [...G.aJouer])M.jouerMonCombat(cid,M.preparerSim(cid,'equi'));continue;}}catch(e){note('exception avancer',e.stack.split('\n').slice(0,2).join(' | '));continue;}
  try{
   for(const p of out.popups){if(p.id==='faillite')continue;M.choisir(Math.floor(Math.random()*p.ch.length),p);}
   for(const o of [...G.offres]){if(Math.random()<.7){if(o.type==='combat')M.accepterCombat(o.id);else M.accepterContrat(o.id);}}
   for(const cid of [...G.aJouer])M.jouerMonCombat(cid,M.preparerSim(cid,['equi','debout','sol','pression'][w%4]));
   if(G.argent>200000&&M.SALLES[G.salle.niv+1])M.ameliorerSalle();
   if(M.mes().length<3&&G.recrues.length){const r=G.F[G.recrues[0]];if(r&&r.prime<G.argent/2)M.signer(r.id);}
  }catch(e){note('exception action joueur',e.stack.split('\n').slice(0,2).join(' | '));}
  if(!isFinite(G.argent))note('argent non fini','sem '+G.sem);
  const prochains={};
  for(const id in G.F){const f=G.F[id];if(f.ret)continue;
   for(const k in f.at){const v=f.at[k];if(!isFinite(v))note('attribut NaN',id+'.'+k);else if(v<0||v>110)note('attribut hors bornes',id+'.'+k+'='+v.toFixed(1));}
   for(const k of ['forme','fat','moral','pop'])if(!isFinite(f[k]))note('champ NaN',id+'.'+k);else if(f[k]<-5||f[k]>105)note('champ hors bornes',id+'.'+k+'='+Math.round(f[k]));
   if(!isFinite(f.elo))note('elo NaN',id);
   if(f.age>48)note('combattant trop âgé encore actif',id+' '+f.age.toFixed(1)+' org '+f.org);
   if(f.prochain){if(prochains[f.prochain]&&prochains[f.prochain]>=2)note('combat avec >2 combattants',f.prochain);prochains[f.prochain]=(prochains[f.prochain]||0)+1;}
   if(f.mine&&f.org&&!G.orgs[f.org])note('org inconnue',f.org);}
  for(const o in G.orgs){const O=G.orgs[o];for(const d in (O.ch||{})){const c=O.ch[d];const k=o+d;if(!c){vac[k]=(vac[k]||0)+1;if(vac[k]===40)note('ceinture vacante > 40 sem.',k+' sem '+G.sem);}else vac[k]=0;
    if(c&&G.F[c]&&(G.F[c].ret||G.F[c].org!==o))note('champion parti/retraité',k+' '+c);}}
  for(const o of G.offres){if(o.f&&!G.F[o.f])note('offre orpheline',o.id);}
  // v12 : écurie rivale, relations, semaine du combat
  if(!G.rival)note('écurie rivale absente','sem '+G.sem);else{const R=G.rival;if(new Set(R.ids).size!==R.ids.length)note('rival : combattant en double','sem '+G.sem);if(R.ids.length>12)note('rival : trop de combattants',R.ids.length);
   if(G.sem%4===1)for(const id of R.ids){const f=G.F[id];if(!f)note('rival : combattant inconnu',id);else if(f.mine)note('rival : combattant à moi',id);}
   for(const k of ['v','d','n'])if(!isFinite(R[k]))note('rival : bilan NaN',k);}
  for(const o in G.orgs){const r=G.orgs[o].rel;if(!isFinite(r)||r<0||r>100)note('relation hors bornes',o+'='+r);}
  if(w%52===51){const s=JSON.stringify(G).length;tailles.push(s);}
 }
 const nb={};for(const id in G.F){const f=G.F[id];if(!f.ret&&f.org){const k=f.org;nb[k]=(nb[k]||0)+1;}}
 console.log('graine',g,'argent',Math.round(G.argent),'V-D',G.stats.v+'-'+G.stats.d,'effectifs',JSON.stringify(nb),'combattants total',Object.keys(G.F).length,'retraités',Object.values(G.F).filter(f=>f.ret).length,'taille sauvegarde (Ko/an)',tailles.slice(-ANS).map(x=>Math.round(x/1024)).join(' '));
 tailles.length=0;
}
console.log('PROBLÈMES',Object.keys(pb).length?JSON.stringify(pb,null,1):'aucun');
console.log(((Date.now()-t0)/1000).toFixed(1)+'s');
