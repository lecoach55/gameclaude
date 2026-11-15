// Duels d'armées équivalentes (croissance d'une ou deux semaines, sans héros) : quelle faction a les meilleures créatures ?
// node duel_factions.js [niveauMax] [semaines] [ameliore]
const J=require('./charger.js')();
const NMAX=+process.argv[2]||5,SEM=+process.argv[3]||1,AM=process.argv[4]==='1';
const armee=f=>J.FAC[f].crea.slice(0,NMAX).map(c=>{const id=AM&&J.CRE[c].amelio?J.CRE[c].amelio:c;return{c:id,n:J.CRE[c].cr*SEM};}).concat(Array(7-NMAX).fill(null));
const val=a=>a.filter(Boolean).reduce((s,x)=>s+x.n*J.CRE[x.c].val,0);
const F=J.FACS,res={};F.forEach(f=>res[f]={v:0,n:0,val:val(armee(f))});
for(const a of F)for(const b of F){if(a===b)continue;for(let k=0;k<20;k++){const C=J.creerCombat({heros:null,armee:armee(a),joueur:0},{heros:null,armee:armee(b),joueur:1},{graine:k*31+7});for(let t=0;t<5000&&!C.fin;t++)C.agir(J.iaCombat(C));res[a].n++;res[b].n++;if(C.fin&&C.fin.gagnant===0)res[a].v++;else if(C.fin)res[b].v++;}}
for(const f of F)console.log(f.padEnd(8),'victoires',Math.round(100*res[f].v/res[f].n)+'%','valeur armée',res[f].val);
