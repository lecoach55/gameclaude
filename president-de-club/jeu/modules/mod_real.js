/* ====================== Clubs réels 2026-27 (L1, L2, Ligue 3) ====================== */
// [nom, commune de la base (ou null), division, note de jeu indicative, capacité du stade, couleur 1, couleur 2]
const REAL=[
 ['Paris Saint-Germain','Paris',6,91,47926,'#0b1f4b','#d4122b'],['Olympique de Marseille','Marseille',6,86,67394,'#ffffff','#2fa6dc'],['AS Monaco',null,6,86,16360,'#d4122b','#ffffff'],
 ['Olympique lyonnais','Lyon',6,85,59186,'#ffffff','#1f3c8f'],['LOSC Lille','Lille',6,85,50186,'#d4122b','#13235b'],['RC Lens','Lens',6,84,38223,'#e8c214','#d4122b'],
 ['OGC Nice','Nice',6,83,36178,'#d4122b','#111111'],['Stade rennais','Rennes',6,83,29778,'#d4122b','#111111'],['RC Strasbourg Alsace','Strasbourg',6,83,32000,'#1f6fd1','#ffffff'],
 ['Toulouse FC','Toulouse',6,81,33150,'#5b2a86','#ffffff'],['Stade brestois','Brest',6,81,15220,'#d4122b','#ffffff'],['Paris FC','Paris',6,80,20000,'#13235b','#9cc8ec'],
 ['AJ Auxerre','Auxerre',6,79,17897,'#ffffff','#1f5fbf'],['Angers SCO','Angers',6,79,19800,'#111111','#ffffff'],['Le Havre AC','Le Havre',6,79,25181,'#1f3c8f','#9cc8ec'],
 ['FC Lorient','Lorient',6,79,18110,'#f07d1a','#111111'],['Le Mans FC','Le Mans',6,78,25064,'#d4122b','#e8c214'],['ES Troyes AC','Troyes',6,78,21877,'#1f5fbf','#ffffff'],
 ['FC Nantes','Nantes',5,76,35322,'#f2d21a','#1c7a3a'],['FC Metz','Metz',5,76,28786,'#7b1630','#ffffff'],['AS Saint-Étienne','Saint-Étienne',5,76,41965,'#1c7a3a','#ffffff'],
 ['Montpellier HSC','Montpellier',5,75,32900,'#13235b','#f07d1a'],['Stade de Reims','Reims',5,75,21029,'#d4122b','#ffffff'],['FC Annecy','Annecy',5,72,15660,'#d4122b','#ffffff'],
 ['Grenoble Foot 38','Grenoble',5,72,20068,'#1f5fbf','#ffffff'],['EA Guingamp',null,5,72,18378,'#d4122b','#111111'],['Clermont Foot 63','Clermont-Ferrand',5,72,11980,'#7b1630','#1f5fbf'],
 ['Dijon FCO','Dijon',5,71,15995,'#d4122b','#ffffff'],['AS Nancy Lorraine','Nancy',5,71,20087,'#d4122b','#ffffff'],['Stade lavallois','Laval',5,71,18607,'#f07d1a','#111111'],
 ['FC Sochaux-Montbéliard','Montbéliard',5,71,20005,'#e8c214','#1f3c8f'],['Red Star FC','Saint-Ouen-sur-Seine',5,70,10000,'#1c7a3a','#ffffff'],['Pau FC','Pau',5,70,4031,'#e8c214','#1f3c8f'],
 ['Rodez Aveyron Football','Rodez',5,69,5955,'#d4122b','#e8c214'],['USL Dunkerque','Dunkerque',5,69,4933,'#1f5fbf','#ffffff'],['US Boulogne','Boulogne-sur-Mer',5,69,9534,'#d4122b','#111111'],
 ['SM Caen','Caen',4,68,21500,'#1f3c8f','#d4122b'],['Amiens SC','Amiens',4,67,12097,'#ffffff','#111111'],['SC Bastia','Bastia',4,67,16078,'#1f5fbf','#ffffff'],
 ['Valenciennes FC','Valenciennes',4,66,25000,'#d4122b','#ffffff'],['FC Rouen','Rouen',4,66,8000,'#d4122b','#ffffff'],['US Orléans','Orléans',4,65,7000,'#e8c214','#d4122b'],
 ['AS Cannes','Cannes',4,65,12000,'#d4122b','#ffffff'],['FC Versailles 78','Versailles',4,65,3000,'#1f3c8f','#ffffff'],['US Quevilly-Rouen Métropole','Le Petit-Quevilly',4,65,12000,'#e8c214','#d4122b'],
 ['US Concarneau','Concarneau',4,64,6000,'#d4122b','#1f3c8f'],['FBBP 01','Bourg-en-Bresse',4,64,11400,'#d4122b','#ffffff'],['FC Villefranche Beaujolais','Villefranche-sur-Saône',4,63,3200,'#1f5fbf','#ffffff'],
 ['La Roche VF','La Roche-sur-Yon',4,63,10000,'#1f5fbf','#e8c214'],['US Thionville Lusitanos','Thionville',4,63,3000,'#d4122b','#1c7a3a'],['SC Aubagne Air Bel','Aubagne',4,63,3000,'#1f5fbf','#ffffff'],
 ['FC Fleury 91',null,4,62,2000,'#d4122b','#111111'],['Le Puy Foot 43 Auvergne',null,4,62,5000,'#111111','#ffffff'],['Paris 13 Atletico','Paris',4,62,2000,'#1f5fbf','#e8c214']
];
const REAL_EXTRA={'AS Monaco':{n:'Monaco',dep:'Principauté',reg:"Provence-Alpes-Côte d'Azur",pop:38000,prof:'aise'},'EA Guingamp':{n:'Guingamp',dep:"Côtes-d'Armor",reg:'Bretagne',pop:7000,prof:'moy'},'FC Fleury 91':{n:'Fleury-Mérogis',dep:'Essonne',reg:'Île-de-France',pop:10000,prof:'popu'},'Le Puy Foot 43 Auvergne':{n:'Le Puy-en-Velay',dep:'Haute-Loire',reg:'Auvergne-Rhône-Alpes',pop:19000,prof:'moy'}};
const realFor=n=>REAL.find(r=>r[0]===n);
function realLevel(capa){let l=0;INFRA.stade.cap.forEach((c,i)=>{if(c<=capa*1.05)l=i;});return l;}
// concurrence pour les supporters quand on crée un club dans une ville qui en a déjà un pro
function terrCompet(town,except){const rs=REAL.filter(r=>r[1]===town&&r[0]!==except);let f=1;rs.forEach(r=>{f*=r[2]===6?.55:r[2]===5?.72:.85;});return {f:Math.max(.3,f),clubs:rs.map(r=>r[0]+' ('+LV[r[2]].n+')')};}
// équipes réelles de la division (sauf la vôtre)
function realTeamsFor(div){return REAL.filter(r=>r[2]===div&&r[0]!==(S.realClub||''));}
function applyRealTeams(){
  if(S.div<4)return;const rs=shuffle(realTeamsFor(S.div).slice());const ai=S.teams.filter(t=>!t.user);
  ai.forEach((t,i)=>{const r=rs[i];if(!r)return;const rt=r[3]+rf(-1.5,1.5);t.name=r[0];t.rating=rt;t.att=rt+rf(-2,2);t.def=rt+rf(-2,2);t.real=true;t.c=[r[5],r[6]];});
  if(S.div===6&&S.elite){const top=REAL.filter(r=>r[2]===6&&r[0]!==S.realClub).sort((a,b)=>b[3]-a[3]).slice(0,3);S.elite.forEach((e,k)=>{if(top[k])e.name=top[k][0];});}
}
A.realPick=function(n){UI.setup.real=n||null;const r=n&&realFor(n);if(r){const ex=REAL_EXTRA[r[0]];UI.setup.town=r[1]||(ex&&ex.n)||'';UI.setup.name=r[0];}renderStart();};
function realStartHtml(){
  const st=UI.setup,sel=st.real;
  const grp=[6,5,4].map(d=>`<optgroup label="${LV[d].n}">${REAL.filter(r=>r[2]===d).map(r=>`<option value="${esc(r[0])}" ${sel===r[0]?'selected':''}>${esc(r[0])}</option>`).join('')}</optgroup>`).join('');
  const r=sel&&realFor(sel);
  return `<div class="fld">Mode de jeu<div class="diff">
    <button class="${!sel?'on':''}" onclick="A.realPick(null)"><b>Créer un club</b><small>Partir de Régional 2 dans la ville de votre choix.</small></button>
    <button class="${sel?'on':''}" onclick="A.realPick(REAL[0][0])"><b>Reprendre un vrai club</b><small>Prendre la présidence d’un club de Ligue 1, Ligue 2 ou Ligue 3 (saison 2026-27).</small></button></div></div>
   ${sel?`<label class="fld" for="cReal">Club<select id="cReal" onchange="A.realPick(this.value)">${grp}</select></label>
   <div class="terrpv">${r?`<b>${esc(r[0])}</b> · ${LV[r[2]].n} · stade de ${nf(r[4])} places. Vous héritez de son effectif, de son stade et de ses ambitions : les supporters attendent des résultats dès la première saison.`:''}<br><span class="muted">Clubs et divisions : saison 2026-27 (LFP, FFF). Niveaux des équipes : estimation pour le jeu.</span></div>`:''}`;
}
function setupRealClub(name){
  const r=realFor(name);if(!r)return;const d=r[2],L=LV[d];
  S.realClub=r[0];S.club.name=r[0];S.club.c1=r[5];S.club.c2=r[6];S.div=d;S.maxDiv=d;S.sasp=true;S.statut='SASP';S.ownership=d===6?20:d===5?35:50;
  const ex=REAL_EXTRA[r[0]];S.terr=r[1]?terrFor(r[1]):Object.assign({real:true},ex);
  const st=realLevel(r[4]);Object.assign(S.infra,{stade:Math.max(st,d>=5?4:2),eclairage:d>=5?3:2,pelouse:2,entrainement:d===6?3:2,formation:d>=5?3:2,commerce:d===6?4:d===5?3:2,loges:d===6?3:d===5?2:1});
  S.invested=Object.entries(S.infra).reduce((a,[k,l])=>{let c=0;for(let i=1;i<=l;i++)c+=(INFRA[k].cost[i]||0);return a+c;},0)*.6;
  S.fans=Math.round(Math.min(r[4]*1.4,LV[d].fcap*.9)*(d===6?1.2:1));S.rep=d===6?55+(r[3]-78)*2.5:d===5?40:30;S.mood=62;S.confidence=58;
  S.cash=d===6?Math.round(rf(12,30)*1e6*(r[3]>=85?2:1)):d===5?Math.round(rf(2.5,6)*1e6):Math.round(rf(.6,1.6)*1e6);
  S.ticket=Math.round(L.tick*(S.terr?PROF[S.terr.prof||'mixte'].w:1));
  // effectif à son niveau
  S.players=[];const need={G:3,D:8,M:8,A:5};for(const pos in need)for(let k=0;k<need[pos];k++){const p=genPlayer({div:d,pos,contract:ri(1,4)});const target=r[3]+(k<({G:1,D:4,M:4,A:2})[pos]?rf(-1,3):rf(-7,-1));p.ovr=clamp(Math.round(target),30,93);p.pot=Math.max(p.pot,p.ovr+(p.age<=22?ri(2,8):0));p.wage=wageFor(p.ovr);genHist(p,r[0],d,2);S.players.push(p);}
  for(let k=0;k<3;k++){const p=genPlayer({div:d,age:ri(17,19),youth:true,contract:3});p.ovr=clamp(Math.round(r[3]-12+rf(-3,3)),30,85);p.pot=p.ovr+ri(8,18);p.wage=Math.round(wageFor(p.ovr)*.5/10)*10;S.players.push(p);}
  // staff professionnel
  for(const role of Object.keys(ROLES)){const s=genStaff(role);s.lvl=clamp((d===6?4:3)+(R()<.3?1:0)-(R()<.3?1:0),2,5);s.salary=staffSalary(s.lvl);if(role==='coach')ensureCoach(s);S.staff[role]=s;}
  S.objective=d===6&&r[3]>=85?'montee':'milieu';
}
