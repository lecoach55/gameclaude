// Parties complètes du royaume par un robot (équilibrage). node sim_royaume.js N [tours]
// Variables : OR=reel|ancien (or des expéditions : vrai jeu ~450+200×niveau, ou ancien robot 18×niveau du donjon),
//             DEP=1|0 (le robot utilise ou non les grosses dépenses v6), GRAINE=n (parties appariées : même graine → même hasard au départ)
const vm=require('vm'),fs=require('fs'),path=require('path');const d=path.join(__dirname,'../jeu/');
for(const f of ['data.js','objets.js','monde.js','donjon.js','royaume.js','evenements.js'])vm.runInThisContext(fs.readFileSync(d+f,'utf8'),{filename:f});
const N=+process.argv[2]||50,T=+process.argv[3]||120;
if(typeof BOT!=='undefined'){BOT.orReel=process.env.OR!=='ancien';BOT.depenses=process.env.DEP!=='0';}
const graine0=+(process.env.GRAINE||1);
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const agg={couronne:0,tourCouronne:[],defaite:0,extinction:0,prov:[],or:[],niveau:[],gen:[],erreurs:0,rois:[],provIA:{},or4:[],or16:[],or40:[],dep16:[],dep40:[],trav:{},vass:[],rancons:0,otages:{}};
for(let k=0;k<N;k++){
 Math.random=mulberry(graine0*100003+k*7919);
 const G=nouvellePartie({classe:pick(Object.keys(CLASSES))});
 try{
 for(let t=0;t<T&&!G.fin;t++){
  let g=0;while(G.evts.length&&g++<10){const e=G.evts[0];const o=ouvrirEvt(G,e);const ok=o.choix.filter(c=>c.ok);const c=pick(ok.length?ok:o.choix);if(e.id==='otage')agg.otages[c.i]=(agg.otages[c.i]||0)+1;const r=choisirEvt(G,e,c.i);if(r.combat){const X={resultat:chance(chanceExpedition(G,r.combat.niveau))?'victoire':'mort',sacOr:40,butin:[],tues:10};apresCombatEvt(G,e,X);}}
  if(G.succession)succession(G,pick(Object.keys(CLASSES)));
  const av=G.maisons.joueur.or;
  botRoyaume(G);
  finSaison(G);
  if(G.succession)succession(G,pick(Object.keys(CLASSES)));
  if(G.tour===4)agg.or4.push(G.maisons.joueur.or);
  if(G.tour===16){agg.or16.push(G.maisons.joueur.or);agg.dep16.push(G.depenses?G.depenses.total:0);}
  if(G.tour===40){agg.or40.push(G.maisons.joueur.or);agg.dep40.push(G.depenses?G.depenses.total:0);}
  if([12,24,40].includes(G.tour)){(agg['t'+G.tour]=agg['t'+G.tour]||[]).push(provincesDe(G,'joueur').length);(agg['tr'+G.tour]=agg['tr'+G.tour]||[]).push(troupesDe(G,'joueur')+'/'+Math.round(IA_MAISONS.reduce((s,m)=>s+troupesDe(G,m),0)/6));}
  if(G.couronne&&!G._c){G._c=1;agg.couronne++;agg.tourCouronne.push(G.tour);}
 }}catch(e){agg.erreurs++;if(agg.erreurs<3)console.log(e.stack);}
 if(G.fin)agg[G.fin.type]++;
 agg.prov.push(provincesDe(G,'joueur').length);agg.or.push(G.maisons.joueur.or);agg.niveau.push(G.joueur.heros.niveau);agg.gen.push(G.joueur.generation);agg.rois.push(G.roiMort);
 if(G.travaux)for(const k in G.travaux)agg.trav[k]=(agg.trav[k]||0)+1; if(G.depenses)agg.vass.push(G.depenses.vassaux);
 for(const m of IA_MAISONS){(agg.provIA[m]=agg.provIA[m]||[]).push(provincesDe(G,m).length);}
}
const moy=a=>a.length?(a.reduce((x,y)=>x+y,0)/a.length).toFixed(1):'-';
const med=a=>{if(!a.length)return '-';const b=a.slice().sort((x,y)=>x-y);return Math.round(b[b.length>>1]);};
console.log(`mode : or ${typeof BOT==='undefined'?'ancien (robot sans BOT)':BOT.orReel?'réel':'ancien'} · dépenses v6 ${typeof BOT!=='undefined'&&BOT.depenses?'oui':'non'} · graine ${graine0}`);
console.log(`parties ${N} × ${T} saisons | couronne ${agg.couronne} (tour moyen ${moy(agg.tourCouronne)}) | défaites ${agg.defaite} | extinctions ${agg.extinction} | erreurs ${agg.erreurs}`);
console.log(`provinces fin ${moy(agg.prov)} | or ${moy(agg.or)} | niveau héros ${moy(agg.niveau)} | générations ${moy(agg.gen)} | roi mort ${agg.rois.filter(x=>x).length}`);
console.log(`or (médiane) saison 4 : ${med(agg.or4)} · saison 16 : ${med(agg.or16)} · saison 40 : ${med(agg.or40)} | grosses dépenses cumulées (médiane) s16 : ${med(agg.dep16)} · s40 : ${med(agg.dep40)}`);
console.log(`grands travaux (parties) ${JSON.stringify(agg.trav)} | vassaux achetés moy ${moy(agg.vass)} | choix « otage » ${JSON.stringify(agg.otages)}`);
console.log('provinces joueur t12/24/40',moy(agg.t12||[]),moy(agg.t24||[]),moy(agg.t40||[]),'troupes j/IA moy',(agg.tr24||[]).slice(0,6).join(' '));
console.log('provinces IA', Object.entries(agg.provIA).map(([m,a])=>m+' '+moy(a)).join(' · '));
