// Charte du village (18/11, demande design-hameau-1) : titres et objectifs visibles, récompenses uniquement visuelles.
// LECTURE SEULE de l'état de la simulation : aucune règle, aucune ressource, aucun bonheur n'en dépend (apparie.sh identique).
// Utilisable sous Node (outils/simulation/charte_sim.js) et intégré à la page par build.py.
const CHARTE_TITRES=[
  {nom:'Hameau',blason:['#7a8a5a','#e8dcc0'],obj:[]},
  {nom:'Village',blason:['#3f5f8a','#e8c860'],obj:[
    ['pop',200,'habitants'],['pierre',18,'maisons en pierre'],['chapelle',1,'chapelle'],['vetements',40,'vêtements en réserve']]},
  {nom:'Bourg',blason:['#8a3f35','#e8c860'],obj:[
    ['pop',280,'habitants'],['pierre',28,'maisons en pierre'],['marche',3,'marchés'],['atelier',5,'ateliers']]},
  {nom:'Ville franche',blason:['#4a3a6a','#f0d070'],obj:[
    ['pop',360,'habitants'],['maitre',12,'maisons de maître'],['vetements',120,'vêtements en réserve'],['ans',8,'ans d\'existence (charte royale)']]}
];
function charteMesures(S){const B=S.buildings.filter(b=>b.built),n=t=>B.filter(b=>b.type===t).length;
  const an=(S.P&&S.P.seasonLen?S.P.seasonLen:96)*4;
  return {pop:S.villagers.length,pierre:B.filter(b=>b.type==='house'&&b.level>=2).length,maitre:B.filter(b=>b.type==='house'&&b.level>=3).length,
    chapelle:n('chapel'),marche:n('market'),atelier:n('workshop'),vetements:Math.floor((S.res&&S.res.clothes)||0),ans:Math.floor(S.time/an)};}
// rang atteint d'après l'état actuel (un titre acquis n'est jamais repris : le jeu garde le maximum par partie)
function charteRang(S){const m=charteMesures(S);let r=0;for(let k=1;k<CHARTE_TITRES.length;k++){if(CHARTE_TITRES[k].obj.every(([c,v])=>m[c]>=v))r=k;else break;}return r;}
function charteObjectifs(S,rang){const m=charteMesures(S),T=CHARTE_TITRES[rang+1];if(!T)return null;
  return {nom:T.nom,obj:T.obj.map(([c,v,txt])=>({txt,have:Math.min(m[c],v),need:v,ok:m[c]>=v}))};}
if(typeof module!=='undefined')module.exports={CHARTE_TITRES,charteMesures,charteRang,charteObjectifs};
