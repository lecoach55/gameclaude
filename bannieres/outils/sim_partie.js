// Parties complètes entre IA (sans écran) : node sim_partie.js [nbParties] [taille] [joueurs] [jours]
const J=require('./charger.js')();
const N=+process.argv[2]||5,T=+process.argv[3]||36,P=+process.argv[4]||2,JOURS=+process.argv[5]||120;
(async()=>{const res=[];for(let k=0;k<N;k++){const t0=Date.now();
 J.nouvellePartie({graine:1000+k,taille:T,eau:k%3,monstres:1,joueurs:Array.from({length:P},(_,i)=>({fac:J.FACS[(i+k)%3],humain:false}))});
 let tours=0;const G=()=>J.G;
 while(!G().fini&&G().jour<=JOURS){await J.tourIA(G().courant);J.finTourJoueur();tours++;}
 const g=G();res.push({graine:1000+k,jours:g.jour,gagnant:g.fini?g.joueurs[g.fini.gagnant].fac:'-',combats:g.stats.combats,ms:Date.now()-t0,
  heros:g.heros.map(h=>h.nom+' n'+h.niv+' '+Math.round(J.forceArmee(h.armee,h))),villes:g.joueurs.map(p=>J.villesDe(p.id).length)});
 console.log(JSON.stringify(res[res.length-1]));}
})().catch(e=>{console.error(e);process.exit(1);});
