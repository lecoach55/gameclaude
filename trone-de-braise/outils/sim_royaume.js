// Parties complètes du royaume par un robot (équilibrage). node sim_royaume.js N [tours]
const vm=require('vm'),fs=require('fs'),path=require('path');const d=path.join(__dirname,'../jeu/');
for(const f of ['data.js','objets.js','monde.js','donjon.js','royaume.js','evenements.js'])vm.runInThisContext(fs.readFileSync(d+f,'utf8'),{filename:f});
const N=+process.argv[2]||50,T=+process.argv[3]||120;
const agg={couronne:0,tourCouronne:[],defaite:0,extinction:0,prov:[],or:[],niveau:[],gen:[],erreurs:0,rois:[],provIA:{}};
for(let k=0;k<N;k++){
 const G=nouvellePartie({classe:pick(Object.keys(CLASSES))});
 try{
 for(let t=0;t<T&&!G.fin;t++){
  let g=0;while(G.evts.length&&g++<10){const e=G.evts[0];const o=ouvrirEvt(G,e);const ok=o.choix.filter(c=>c.ok);const c=pick(ok.length?ok:o.choix);const r=choisirEvt(G,e,c.i);if(r.combat){const X={resultat:chance(chanceExpedition(G,r.combat.niveau))?'victoire':'mort',sacOr:40,butin:[],tues:10};apresCombatEvt(G,e,X);}}
  if(G.succession)succession(G,pick(Object.keys(CLASSES)));
  botRoyaume(G);
  finSaison(G);
  if(G.succession)succession(G,pick(Object.keys(CLASSES)));
  if([12,24,40].includes(G.tour)){(agg['t'+G.tour]=agg['t'+G.tour]||[]).push(provincesDe(G,'joueur').length);(agg['tr'+G.tour]=agg['tr'+G.tour]||[]).push(troupesDe(G,'joueur')+'/'+Math.round(IA_MAISONS.reduce((s,m)=>s+troupesDe(G,m),0)/6));}
  if(G.couronne&&!G._c){G._c=1;agg.couronne++;agg.tourCouronne.push(G.tour);}
 }}catch(e){agg.erreurs++;if(agg.erreurs<3)console.log(e.stack);}
 if(G.fin)agg[G.fin.type]++;
 agg.prov.push(provincesDe(G,'joueur').length);agg.or.push(G.maisons.joueur.or);agg.niveau.push(G.joueur.heros.niveau);agg.gen.push(G.joueur.generation);agg.rois.push(G.roiMort);
 for(const m of IA_MAISONS){(agg.provIA[m]=agg.provIA[m]||[]).push(provincesDe(G,m).length);}
}
const moy=a=>a.length?(a.reduce((x,y)=>x+y,0)/a.length).toFixed(1):'-';
console.log(`parties ${N} × ${T} saisons | couronne ${agg.couronne} (tour moyen ${moy(agg.tourCouronne)}) | défaites ${agg.defaite} | extinctions ${agg.extinction} | erreurs ${agg.erreurs}`);
console.log(`provinces fin ${moy(agg.prov)} | or ${moy(agg.or)} | niveau héros ${moy(agg.niveau)} | générations ${moy(agg.gen)} | roi mort ${agg.rois.filter(x=>x).length}`);
console.log('provinces joueur t12/24/40',moy(agg.t12||[]),moy(agg.t24||[]),moy(agg.t40||[]),'troupes j/IA moy',(agg.tr24||[]).slice(0,6).join(' '));
console.log('provinces IA', Object.entries(agg.provIA).map(([m,a])=>m+' '+moy(a)).join(' · '));
