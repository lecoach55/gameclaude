// Équilibre des factions : parties IA contre IA, petites cartes, chaque paire jouée dans les deux sens sur les mêmes graines.
// node sim_factions.js nbGraines [jours]
const J=require('./charger.js')();
const NG=+process.argv[2]||4,JOURS=+process.argv[3]||120;
const F=J.FACS,v={},n={};F.forEach(f=>{v[f]=0;n[f]=0;});let nul=0;const durees=[];
(async()=>{for(let g=0;g<NG;g++)for(let a=0;a<3;a++)for(let b=0;b<3;b++){if(a===b)continue;
 J.nouvellePartie({graine:5000+g,taille:36,eau:g%3,monstres:1,joueurs:[{fac:F[a]},{fac:F[b]}]});
 while(!J.G.fini&&J.G.jour<=JOURS){await J.tourIA(J.G.courant);J.finTourJoueur();}
 n[F[a]]++;n[F[b]]++;if(J.G.fini){v[J.G.joueurs[J.G.fini.gagnant].fac]++;durees.push(J.G.jour);}else nul++;}
 console.log(JSON.stringify({victoires:v,parties:n,nuls:nul,taux:Object.fromEntries(F.map(f=>[f,Math.round(100*v[f]/n[f])+'%'])),duree_mediane:durees.sort((x,y)=>x-y)[durees.length>>1]}));})();
