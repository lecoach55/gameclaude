/* ====================== Territoire et économie locale ====================== */
const PROF={
 metro:{n:'Métropole régionale',w:1.12,eco:1.25,sub:1.2,fan:1.0,d:'Grand bassin d’emplois : sièges d’entreprises, université, services. Beaucoup de partenaires possibles, mais une offre de loisirs très concurrentielle.',sec:['Banque régionale','Cabinet d’avocats','Groupe immobilier','Concession automobile','Agence de communication','Clinique privée','Promoteur','Start-up du numérique']},
 aise:{n:'Ville résidentielle aisée',w:1.3,eco:1.2,sub:1.15,fan:.85,d:'Revenus élevés et commune bien dotée : billets plus chers acceptés, subventions généreuses, mais un public moins nombreux au stade.',sec:['Gestion de patrimoine','Agence immobilière de prestige','Cabinet d’expertise comptable','Concession haut de gamme','Clinique','Hôtel-restaurant']},
 mixte:{n:'Ville de banlieue (mixte)',w:1.0,eco:1.0,sub:1.0,fan:1.0,d:'Quartiers pavillonnaires et grands ensembles : un public varié, des commerces et des PME de services.',sec:['Supermarché','Concession automobile','Entreprise de BTP','Pharmacie','Boulangerie industrielle','Société de transport']},
 popu:{n:'Ville populaire',w:.8,eco:.82,sub:1.12,fan:1.15,d:'Revenus modestes mais énorme vivier de jeunes joueurs et un public fervent. Aides de la politique de la ville pour le sport.',sec:['Supermarché discount','Entreprise de nettoyage','Société de sécurité','Garage','Salle de sport','Auto-école']},
 indus:{n:'Bassin industriel',w:.9,eco:1.05,sub:1.0,fan:1.2,d:'Usines et sous-traitants : des sponsors solides et un public fidèle… tant que l’activité tient. Une fermeture de site peut tout changer.',sec:['Aciérie','Équipementier automobile','Usine chimique','Chantier naval','Plasturgie','Métallurgie','Logistique']},
 touri:{n:'Ville touristique',w:1.1,eco:1.05,sub:1.05,fan:.9,d:'Économie saisonnière : hôtels, restaurants et commerces soutiennent le club, et l’été attire du monde au stade.',sec:['Hôtel','Camping','Casino','Restaurant de la plage','Office de tourisme','Domaine viticole']},
 moy:{n:'Ville moyenne, centre local',w:.95,eco:.95,sub:1.05,fan:1.05,d:'Préfecture ou sous-préfecture : administrations, hôpital, commerces et PME. Le club peut vite devenir la fierté de la ville.',sec:['Crédit mutualiste','Coopérative agricole','Grossiste','Concession automobile','Entreprise de travaux publics','Hypermarché']},
 rural:{n:'Bourg rural',w:.88,eco:.72,sub:.92,fan:1.25,d:'Peu d’habitants mais tout le village vient au stade. Les partenaires sont les artisans, la coopérative et les commerçants.',sec:['Coopérative agricole','Artisan maçon','Boulangerie','Garage du bourg','Bar-tabac','Laiterie']}
};
const SMALL={village:{n:'Village (moins de 2 000 habitants)',pop:1200},bourg:{n:'Bourg (2 000 à 10 000 habitants)',pop:5000},ville:{n:'Petite ville (10 000 à 20 000 habitants)',pop:14000}};
function commFind(name){const k=(name||'').trim().toLowerCase();return COMM.find(c=>c[0].toLowerCase()===k)||null;}
function terrFor(town,small){const c=commFind(town);
  if(c)return {n:c[0],dep:c[1],reg:REGIONS[c[2]],pop:c[3],prof:c[4],real:true};
  const sz=SMALL[small||'bourg'];return {n:(town||'').trim()||'Clichy',dep:null,reg:null,pop:sz.pop,prof:small==='ville'?'moy':'rural',real:false,size:small||'bourg'};}
const TP=()=>PROF[(S&&S.terr&&S.terr.prof)||'mixte'];
const popF=e=>S&&S.terr?clamp(Math.pow(S.terr.pop/40000,e),.25,3):1;
function terrFan(){if(!S||!S.terr)return 1;return clamp(Math.pow(S.terr.pop/40000,.42)*TP().fan,.3,2.6)*(S.terr.comp||1);}
function terrEco(){if(!S||!S.terr)return 1;return TP().eco*clamp(Math.pow(S.terr.pop/40000,.16),.72,1.4);}
const tk=()=>LV[S.div].tick*(S.terr?TP().w:1);
function terrNeighbors(n){const t=S.terr;if(!t||!t.dep)return [];return COMM.filter(c=>c[1]===t.dep&&c[0]!==t.n).sort((a,b)=>Math.abs(Math.log(a[3]/t.pop))-Math.abs(Math.log(b[3]/t.pop))).slice(0,n||6).map(c=>c[0]);}
function terrTowns(){const t=S.terr;if(!t||!t.reg)return null;const ri_=REGIONS.indexOf(t.reg);return COMM.filter(c=>c[2]===ri_&&c[0]!==t.n).map(c=>c[0]);}
// noms d'équipes : en régional et en National 2, les adversaires viennent de la même région
function clubNameLocal(used){
  const loc=S&&S.terr&&S.div<=2?terrTowns():null;
  if(loc&&loc.length&&R()<Math.min(.85,loc.length/25)){for(let k=0;k<30;k++){const n=pick(PREF)+' '+pick(loc);if(!used.has(n)){used.add(n);return n;}}}
  return clubName(used);
}
function terrSponsor(){const s=TP().sec;return pick(s)+' '+(S.terr?S.terr.n:'');}
function terrCard(){
  const t=S.terr;if(!t)return '';const P=TP(),nb=terrNeighbors(4);
  const lvl=v=>v>=1.3?'très élevé':v>=1.05?'élevé':v>=.85?'moyen':v>=.6?'modeste':'faible';
  return `<div class="card terr"><header><h3>Territoire : ${esc(t.n)}</h3><span class="pill">${esc(P.n)}</span></header>
   <div class="kpis"><div class="kpi"><div class="l">Population</div><div class="v">${nf(t.pop)}</div><div class="muted" style="font-size:11.5px">${t.real?'INSEE 2023':'estimation'}</div></div>
   <div class="kpi"><div class="l">Département</div><div class="v" style="font-size:17px">${esc(t.dep||'—')}</div><div class="muted" style="font-size:11.5px">${esc(t.reg||'')}</div></div>
   <div class="kpi"><div class="l">Potentiel de supporters</div><div class="v" style="font-size:17px">${lvl(terrFan())}</div></div>
   <div class="kpi"><div class="l">Tissu économique</div><div class="v" style="font-size:17px">${lvl(terrEco())}</div></div>
   <div class="kpi"><div class="l">Prix des places accepté</div><div class="v" style="font-size:17px">${P.w>=1.2?'élevé':P.w>=1?'normal':'bas'}</div></div></div>
   <p style="margin:0;font-size:14px">${esc(P.d)}</p>
   <p class="muted" style="margin:0;font-size:13px">Partenaires typiques : ${P.sec.slice(0,5).map(esc).join(', ')}.${nb.length?' Communes voisines : '+nb.map(esc).join(', ')+'.':''}${t.rivalTown?' Rival historique : '+esc(t.rivalTown)+'.':''}</p>
   <p class="muted" style="margin:0;font-size:11.5px">Population : INSEE (recensement 2023, via Wikipédia). Profil économique : classement indicatif établi pour le jeu.</p></div>`;
}
function terrPreview(){
  const st=UI.setup,t=terrFor(st.town||'Clichy',st.small);const P=PROF[t.prof];
  return `<div class="terrpv">${t.real?`<b>${esc(t.n)}</b> · ${esc(t.dep)} · ${esc(t.reg)} · ${nf(t.pop)} habitants<br><span class="muted">${esc(P.n)} — ${esc(P.d)}</span>`
   :`<b>${esc(t.n)}</b> ne fait pas partie des 455 communes de plus de 20 000 habitants de la base.<br><label class="muted">Taille de la commune : <select onchange="UI.setup.small=this.value;A.pv()">${Object.entries(SMALL).map(([k,v])=>`<option value="${k}" ${k===(st.small||'bourg')?'selected':''}>${v.n}</option>`).join('')}</select></label>`}</div>`;
}
const TERR_EV={
 usineFerme:{w:.8,cond:()=>S.terr&&S.terr.prof==='indus'&&S.week>4,make:()=>({sec:pick(PROF.indus.sec)}),k:'Économie locale',title:'Plan social à l’usine',
  text:d=>`Le site « ${d.sec} » de ${S.terr.n} annonce la suppression de centaines d’emplois. Plusieurs partenaires du club y sont liés, et une partie de vos supporters y travaille.`,
  ch:[{t:'Organiser un match de soutien aux salariés',s:'Recette reversée, image renforcée',f:()=>{S.sponsorAnnual=Math.round(S.sponsorAnnual*.93);S.mood=clamp(S.mood+6,0,100);S.rep=clamp(S.rep+2,0,100);S.confidence=clamp(S.confidence+3,0,100);return 'Le stade affiche complet pour les salariés. Les sponsors liés à l’usine réduisent tout de même leur soutien (−7 %).';}},
      {t:'Rester à l’écart',f:()=>{S.sponsorAnnual=Math.round(S.sponsorAnnual*.9);S.fans=Math.round(S.fans*.97);return 'Les partenaires liés à l’usine se retirent en partie (−10 %) et la ville vous reproche votre silence.';}}]},
 implantation:{w:.7,cond:()=>S.terr&&['metro','moy','mixte','indus'].includes(S.terr.prof)&&S.week>2,make:()=>({sec:pick(TP().sec),amt:Math.round(Math.max(1000,S.sponsorAnnual*rf(.05,.1))/100)*100}),k:'Économie locale',title:'Une entreprise s’installe en ville',
  text:d=>`Un nouveau site « ${d.sec} » ouvre à ${S.terr.n}, avec des centaines d’emplois à la clé. La direction veut s’afficher localement et propose ${money(d.amt)} pour figurer sur le maillot.`,
  ch:[{t:'Signer le partenariat',f:d=>{S.sponsorBonus+=d.amt;S.fans=Math.round(S.fans*1.02);return 'Nouveau partenaire maillot : +'+money(d.amt)+' cette saison.';}},{t:'Négocier une loge et un partenariat jeunes en plus',s:'Peut rapporter plus… ou rien',f:d=>{if(R()<.55){S.sponsorBonus+=Math.round(d.amt*1.4);return 'Accord élargi : +'+money(Math.round(d.amt*1.4))+'.';}return 'L’entreprise préfère soutenir le club de rugby.';}}]},
 galaEte:{w:2,cond:()=>S.terr&&S.terr.prof==='touri'&&S.week<=3&&S.flags.gala!==S.year,make:()=>{S.flags.gala=S.year;return {amt:Math.round(cap()*tk()*1.3)};},k:'Saison estivale',title:'Match de gala devant les vacanciers',
  text:d=>`La ville est pleine de touristes : l’office de tourisme propose un match de gala en nocturne. Recette estimée : ${money(d.amt)}.`,
  ch:[{t:'Organiser le gala',s:'Fatigue avant la reprise',f:d=>{fin('Billetterie',d.amt);S.fans=Math.round(S.fans*1.04);S.players.forEach(p=>p.fit=clamp(p.fit-6,20,100));return 'Belle soirée d’été : '+money(d.amt)+' de recette.';}},{t:'Préserver la préparation',f:()=>'L’équipe reste concentrée sur la reprise.'}]},
 municipales:{w:3,cond:()=>S.terr&&(S.year-2026)%6===0&&S.year>2026&&S.week>=8&&S.flags.muni!==S.year,make:()=>{S.flags.muni=S.year;return {pro:R()<.5};},k:'Vie municipale',title:'Élections municipales',
  text:d=>`Nouvelle équipe à la mairie de ${S.terr.n}. ${d.pro?'Le nouveau maire est un ancien licencié du club et veut faire du sport une priorité.':'La nouvelle majorité veut revoir les subventions aux associations sportives.'}`,
  ch:[{t:'Demander un rendez-vous au maire',f:d=>{const m=d.pro?rf(1.08,1.2):rf(.88,.98);S.subsidyMult*=m;return d.pro?'La subvention municipale augmente de '+Math.round((m-1)*100)+' %.':'La subvention baisse de '+Math.round((1-m)*100)+' %, mais le dialogue est engagé.';}},{t:'Mobiliser les supporters pour défendre le club',s:'Risqué',f:d=>{if(d.pro||R()<.45){S.subsidyMult*=1.1;S.mood=clamp(S.mood+4,0,100);return 'La mobilisation paie : +10 % de subvention.';}S.subsidyMult*=.85;return 'La mairie n’apprécie pas la pression : −15 % de subvention.';}}]},
 quartiers:{w:1,cond:()=>S.terr&&S.terr.prof==='popu'&&!S.flags.qpv,make:()=>{S.flags.qpv=1;return {};},k:'Politique de la ville',title:'Le club, acteur des quartiers',
  text:()=>`L’État et la ville proposent de financer un éducateur sportif et des créneaux pour les jeunes des quartiers prioritaires, en échange d’actions sociales du club.`,
  ch:[{t:'Signer la convention',s:'Subventions et vivier de jeunes',f:()=>{S.subsidyMult*=1.12;S.flags.youthBoost=(S.flags.youthBoost||0)+2;S.rep=clamp(S.rep+2,0,100);return 'Convention signée : subvention +12 %, et le centre de formation détectera plus de talents.';}},{t:'Décliner',f:()=>'Le club reste concentré sur l’équipe première.'}]}
};
