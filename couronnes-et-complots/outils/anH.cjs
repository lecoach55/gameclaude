const fs=require('fs');
for(const f of process.argv.slice(2)){const d=JSON.parse(fs.readFileSync(f));
 const long=d.filter(x=>!x.over);const rounds=d.map(x=>x.round).sort((a,b)=>a-b);
 const types={};d.forEach(x=>types[x.type||'aucune']=(types[x.type||'aucune']||0)+1);
 console.log(`\n== ${f} (${d.length}) méd ${rounds[d.length>>1]} p90 ${rounds[Math.floor(d.length*.9)]} | ${JSON.stringify(types)} | >40 manches: ${long.length} | pactes/partie ${(d.reduce((a,x)=>a+x.pacts,0)/d.length).toFixed(1)} trahisons ${(d.reduce((a,x)=>a+x.betray,0)/d.length).toFixed(2)} | proclamations ${(d.reduce((a,x)=>a+x.procl,0)/d.length).toFixed(2)}`);
 // parties longues : diagnostic
 long.slice(0,4).forEach(x=>{const s=x.snapLast;console.log('  bloquée : terr',JSON.stringify(s.t),'armées',JSON.stringify(s.a),'pactes',s.pacts,'inf',JSON.stringify(s.inf),'stab',JSON.stringify(s.stab),'conquêtes manches 30-40',JSON.stringify(x.conq.slice(30,41)));});
 // conquêtes par manche (moyenne) aux manches 5,10,15,20,25,30
 const cm=r=>(d.filter(x=>x.round>r).reduce((a,x)=>a+(x.conq[r]||0),0)/Math.max(1,d.filter(x=>x.round>r).length)).toFixed(2);
 console.log('  conquêtes/manche @5,10,15,20,25,30:',[5,10,15,20,25,30].map(cm).join(' '));
 // édits : adoption et corrélation avec victoire (le vainqueur a-t-il voté pour ? indisponible) -> taux d'adoption et lien adoption/longueur
 const E={};d.forEach(x=>x.ed.forEach(e=>{E[e.n]=E[e.n]||{ok:0,n:0};E[e.n].n++;if(e.ok)E[e.n].ok++;}));
 console.log('  édits adoptés:',Object.entries(E).map(([k,v])=>`${k.split(' ')[0]} ${Math.round(v.ok/v.n*100)}%`).join(', '));
 if(d[0].lv.length>1){const w={};d.forEach(x=>{if(x.winLvl)w[x.winLvl]=(w[x.winLvl]||0)+1});console.log('  victoires par niveau',JSON.stringify(w));}
}
