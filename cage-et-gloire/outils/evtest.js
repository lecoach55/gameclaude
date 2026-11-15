// Tous les événements aléatoires, chaque choix, sur une partie avancée : node outils/evtest.js
const M=require('../jeu/moteur.js');
let ok=0,ko=0,saut=0;
for(const E of M.EVENTS){for(let ch=0;ch<E.ch.length;ch++){M.nouvellePartie({graine:99});const G=M.G;
 for(let w=0;w<40;w++){M.avancer();G.popup=null;for(const o of [...G.offres]){if(o.type==='combat')M.accepterCombat(o.id);else M.accepterContrat(o.id);}for(const c of [...G.aJouer])M.jouerMonCombat(c,M.preparerSim(c,'equi'));}
 G.argent=50000;
 try{if(!E.cond()){saut++;continue;}const x=E.make();if(x===null){saut++;continue;}E.t(x);E.d(x);if(E.ch[ch].f)E.ch[ch].f(x);for(let w=0;w<6;w++){M.avancer();G.popup=null;for(const c of [...G.aJouer])M.jouerMonCombat(c,M.preparerSim(c,'equi'));}ok++;}
 catch(e){ko++;console.log('ERREUR',E.id,ch,e.stack.split('\n').slice(0,2).join(' '));}}}
console.log('événements testés',ok,'erreurs',ko,'non applicables',saut);
// événements spéciaux (contrat de management, vétéran, opération)
let ok2=0,ko2=0;
for(const id in M.SPECIAUX){const E=M.SPECIAUX[id];for(let ch=0;ch<E.ch.length;ch++){M.nouvellePartie({graine:7});const G=M.G;for(let w=0;w<20;w++)M.avancer();const f=M.mes()[0];
 const x=id==='mgmt'?{f:f.id,dem:.22,p:.5}:id==='veteran'?{f:f.id,k:'boxe'}:{f:f.id,m:6000};if(id==='operation'){f.bless=20;f.blessT='Ligament croisé';}
 try{E.t(x);E.d(x);const p={id,x,t:'',d:'',ch:[]};M.choisir(ch,p);for(let w=0;w<5;w++){M.avancer();for(const c of [...G.aJouer])M.jouerMonCombat(c,M.preparerSim(c,'equi'));}ok2++;}catch(e){ko2++;console.log('ERREUR',id,ch,e.stack.split('\n').slice(0,2).join(' '));}}}
console.log('spéciaux testés',ok2,'erreurs',ko2);
