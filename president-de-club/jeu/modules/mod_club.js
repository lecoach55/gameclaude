/* ====================== Équipe réserve & section féminine ====================== */
const RESCOST=[3000,6000,15000,40000,120000,300000,600000];
const RES_LV=['Départemental 2','Départemental 1','Régional 3','Régional 2','Régional 1','National 3 (réserve)','National 2 (réserve)'];
const FEM_LV=['Régional féminin','Régional féminin','Division 3 féminine','Division 3 féminine','Seconde Ligue','Seconde Ligue','Première Ligue'];
A.reserveCreate=function(){if(S.reserve)return;const c=RESCOST[S.div];if(S.cash<c*.25){toast('Trésorerie insuffisante.');return;}S.reserve={since:S.year,W:0,D:0,L:0,GF:0,GA:0,pos:null};news('Création de l’équipe réserve en '+RES_LV[S.div]+' : les remplaçants et les jeunes auront du temps de jeu.','g');save();render();};
A.reserveClose=function(){if(!S.reserve)return;S.reserve=null;news('L’équipe réserve est dissoute.','b');save();render();};
A.femCreate=function(){if(S.flags.fem)return;S.flags.fem=true;S.subsidyMult*=1.1;S.fans=Math.round(S.fans*1.05);S.confidence=clamp(S.confidence+4,0,100);S.rep=clamp(S.rep+2,0,100);S.femT={W:0,D:0,L:0,since:S.year};news('La section féminine est lancée en '+FEM_LV[S.div]+'.','g');save();render();};
function reserveWeek(st){
  const R_=S.reserve;if(!R_)return;
  const inXI=new Set(st.xi.map(e=>e.p.id));
  const pool=S.players.filter(p=>!inXI.has(p.id)&&!p.inj&&!p.loan);
  pool.forEach(p=>{if(R()<(p.age<=23?.85:.6)){p.lastPlayed=S.gw;p.morale=clamp(p.morale+.6,0,100);p.rmj=(p.rmj||0)+1;}});
  const top=pool.sort((a,b)=>b.ovr-a.ovr).slice(0,11),avg=top.length?top.reduce((s,p)=>s+p.ovr,0)/top.length:30;
  const lvl=LV[Math.max(0,S.div-2)].str,ref=(lvl[0]+lvl[1])/2-4;
  const [g1,g2]=[poisson(lam(avg,ref,true)),poisson(lam(ref,avg,false))];
  R_.GF+=g1;R_.GA+=g2;if(g1>g2)R_.W++;else if(g1<g2)R_.L++;else R_.D++;
  if(S.flags.fem){const F=S.femT||(S.femT={W:0,D:0,L:0,since:S.year});const q=clamp(.45+(S.infra.entrainement*.04)+(S.rep/400),.2,.8);const x=R();if(x<q)F.W++;else if(x<q+.22)F.D++;else F.L++;}
}
function reserveWeekFem(){if(!S.flags.fem||S.reserve)return;const F=S.femT||(S.femT={W:0,D:0,L:0,since:S.year});const q=clamp(.45+(S.infra.entrainement*.04)+(S.rep/400),.2,.8);const x=R();if(x<q)F.W++;else if(x<q+.22)F.D++;else F.L++;}
function teamsSeasonEnd(msgs){
  if(S.reserve){const R_=S.reserve,n=R_.W+R_.D+R_.L||1,pts=(R_.W*3+R_.D)/n,pos=clamp(Math.round(13-pts*4.2+rf(-1,1)),1,14);R_.last={pos,W:R_.W,D:R_.D,L:R_.L,lv:RES_LV[S.div]};msgs.push('Équipe réserve : '+pos+'e de '+RES_LV[S.div]+' ('+R_.W+' V, '+R_.D+' N, '+R_.L+' D).');Object.assign(R_,{W:0,D:0,L:0,GF:0,GA:0});S.players.forEach(p=>p.rmj=0);}
  if(S.flags.fem&&S.femT){const F=S.femT,n=F.W+F.D+F.L||1,pts=(F.W*3+F.D)/n,pos=clamp(Math.round(12-pts*4+rf(-1,1)),1,12);F.last={pos,lv:FEM_LV[S.div]};msgs.push('Section féminine : '+pos+'e de '+FEM_LV[S.div]+'.');if(pos===1){S.palmares.push('Championnat féminin ('+FEM_LV[S.div]+') '+seasonLabel(S.year));S.rep=clamp(S.rep+2,0,100);}Object.assign(F,{W:0,D:0,L:0});}
}

/* ====================== Légendes du club ====================== */
function legendCheck(p,how){
  const own=(p.hist||[]).filter(h=>h.own);const seasons=own.length+((p.s&&(p.s.mj+p.s.cmj))?1:0);
  const apps=own.reduce((a,h)=>a+(h.mj||0),0)+(p.s?p.s.mj+p.s.cmj:0),goals=own.reduce((a,h)=>a+(h.g||0),0)+(p.s?p.s.g+p.s.cg:0);
  if(!(seasons>=6||apps>=160||goals>=60||(seasons>=4&&goals>=35)))return;
  S.legends=S.legends||[];if(S.legends.some(l=>l.id===p.id))return;
  S.legends.push({id:p.id,n:pname(p),pos:p.pos,num:shirtNo(p),seasons,apps,goals,y:S.year,how,retired:false,tribune:false,jubile:false,ret:how==='Retraite'});
  news(pname(p)+' entre dans la légende du club : '+seasons+' saisons, '+apps+' matchs, '+goals+' buts.','g');S.mood=clamp(S.mood+2,0,100);
}
A.legRetire=function(i){const l=S.legends[i];if(!l||l.retired)return;l.retired=true;S.mood=clamp(S.mood+3,0,100);news('Le numéro '+l.num+' de '+l.n+' est retiré à vie.','g');save();render();};
A.legTribune=function(i){const l=S.legends[i];if(!l||l.tribune)return;if(S.legends.filter(x=>x.tribune).length>=Math.min(4,S.infra.stade)){toast('Toutes les tribunes portent déjà un nom (agrandissez le stade).');return;}l.tribune=true;S.mood=clamp(S.mood+6,0,100);S.rep=clamp(S.rep+1,0,100);news('Une tribune portera désormais le nom de '+l.n+'.','g');save();render();};
A.legJubile=function(i){const l=S.legends[i];if(!l||l.jubile||!l.ret)return;l.jubile=true;const att=Math.min(cap(),Math.round(S.fans*.7));const amt=Math.round(att*S.ticket*1.3);fin('Billetterie',amt);S.mood=clamp(S.mood+5,0,100);news('Jubilé de '+l.n+' devant '+nf(att)+' spectateurs : '+money(amt)+' de recette, des larmes et des souvenirs.','g');toast('Jubilé : '+money(amt));save();render();};

/* ====================== Groupe de supporters ====================== */
const ULTRA_N=['Ultras','Brigade','Kop','Commando','Fanatics','Virage','Armata','Indépendants'];
function ultrasTick(rep){
  const U=S.ultras;if(!U)return;const L=LV[S.div];
  U.rel=clamp(U.rel+(S.ticket<=L.tick*1.1?.35:S.ticket>L.tick*1.4?-.9:-.3)+(rep.res==='V'?.8:rep.res==='D'?-.9:0)+(S.naming?-.15:0),0,100);
  U.size=Math.round(clamp(U.size+(rep.res==='V'?3:-1)*(1+S.div*.6),20,S.fans*.12));
  if(U.sec>0)U.sec--;
  if(rep.home){
    const pyro=(.05+(U.rel<35?.1:0))*(U.sec>0?.4:1);
    if(R()<pyro){const amt=[300,600,1500,4000,15000,40000,90000][S.div];fin('Amendes',-amt);news('Fumigènes en tribune : la commission de discipline inflige '+money(amt)+' d’amende.','b');
      if(U.rel<20&&R()<.35){S.flags.huisClos=1;S.confidence=clamp(S.confidence-3,0,100);news('Sanction : le prochain match à domicile se jouera à huis clos.','b');}}
    if(U.rel<30&&R()<.3){S.confidence=clamp(S.confidence-1.5,0,100);news('Banderole hostile au président déployée par les '+U.name+'.','b');}
  }
}
function ultraBoost(me){const U=S.ultras;if(!U||U.rel<55)return me;const b=U.rel>=75?1.6:1;return Object.assign({},me,{att:me.att+b,def:me.def+b});}
A.ultraMeet=function(){const U=S.ultras;if(!U)return;if(S.gw-(U.met||-99)<6){toast('Vous les avez rencontrés récemment.');return;}U.met=S.gw;const L=LV[S.div];
  if(S.ticket>L.tick*1.2){U.rel=clamp(U.rel+3,0,100);toast('Ils exigent une baisse du prix des places.');news('Réunion tendue avec les '+U.name+' : ils réclament des billets moins chers.','');}
  else{U.rel=clamp(U.rel+8,0,100);toast('Échange constructif avec les '+U.name+'.');news('Rencontre cordiale avec les leaders des '+U.name+'.','g');}save();render();};
A.ultraTifo=function(){const U=S.ultras;if(!U)return;if(U.tifo===S.year){toast('Déjà fait cette saison.');return;}const c=Math.round(Math.max(500,S.sponsorAnnual*.015)/100)*100;if(S.cash<c){toast('Trésorerie insuffisante.');return;}fin('Vie associative',-c);U.tifo=S.year;U.rel=clamp(U.rel+12,0,100);news('Le club finance un local et un tifo pour les '+U.name+' ('+money(c)+').','g');save();render();};
A.ultraSec=function(){const U=S.ultras;if(!U)return;U.sec=8;U.rel=clamp(U.rel-10,0,100);news('Contrôles renforcés aux entrées du virage : les '+U.name+' protestent.','b');save();render();};

/* ====================== Conférences de presse ====================== */
function pressCtx(rep){
  const r=S.myResults.slice(-3).map(x=>x.res).join('');const c=S.staff.coach;
  if(r==='DDD')return 'crise';
  if(r==='VVV')return 'serie';
  if(rep&&rep.opp&&rep.opp.derby)return 'rival';
  if(c&&c.rel<35)return 'coach';
  if(S.euro&&S.euro.phase!=='out'&&R()<.5)return 'europe';
  if(windowOpen())return 'mercato';
  if(projection()<0)return 'finances';
  return pick(['ambition','arbitrage','jeunes']);
}
const PRESS={
 crise:{q:'Trois défaites de suite. L’entraîneur est-il menacé ?',a:[['« Il a toute ma confiance. »','Entraîneur +, adhérents −',()=>{if(S.staff.coach)S.staff.coach.rel=clamp(S.staff.coach.rel+10,0,100);S.confidence-=2;return 'Le vestiaire apprécie le soutien.';}],['« Nous ferons le point en fin de mois. »','Pression sur le groupe',()=>{S.players.forEach(p=>p.morale=clamp(p.morale+3,0,100));if(S.staff.coach)S.staff.coach.rel-=6;return 'Le message est passé : les joueurs savent qu’ils jouent gros.';}],['« Les joueurs doivent se regarder dans la glace. »','Supporters +, moral −',()=>{S.mood+=4;S.players.forEach(p=>p.morale=clamp(p.morale-5,0,100));return 'Les supporters applaudissent, le vestiaire grince.';}]]},
 serie:{q:'Trois victoires de suite : peut-on parler d’ambitions revues à la hausse ?',a:[['« On ne s’enflamme pas, match après match. »','Prudence',()=>{S.confidence+=1;return 'Discours mesuré, salué par la presse locale.';}],['« Ce groupe peut aller chercher quelque chose de grand. »','Supporters ++, pression',()=>{S.mood+=6;S.flags.pressure=true;return 'L’enthousiasme gagne la ville… et les attentes aussi.';}],['« Le mérite revient au staff et aux joueurs. »','Moral +',()=>{S.players.forEach(p=>p.morale=clamp(p.morale+4,0,100));if(S.staff.coach)S.staff.coach.rel+=4;return 'Le vestiaire apprécie.';}]]},
 rival:{q:'Le match contre votre rival a enflammé la ville. Un mot sur l’ambiance ?',a:[['« C’est la fête du football local. »','Image +',()=>{S.rep+=1;S.confidence+=1;return 'Un discours rassembleur.';}],['« Ici, c’est chez nous. »','Supporters ++, risque d’amende',()=>{S.mood+=5;if(S.ultras)S.ultras.rel=clamp(S.ultras.rel+6,0,100);if(R()<.3){fin('Amendes',-[200,400,1000,3000,10000,30000,60000][S.div]);return 'Les supporters adorent, la commission de discipline beaucoup moins.';}return 'Le virage scande votre nom.';}],['« Je ne commente pas les autres clubs. »','Neutre',()=> 'Une réponse sans vagues.']]},
 coach:{q:'On dit que vos relations avec l’entraîneur sont tendues. Info ou intox ?',a:[['« Nous travaillons main dans la main. »','Relation +',()=>{if(S.staff.coach)S.staff.coach.rel=clamp(S.staff.coach.rel+12,0,100);return 'L’entraîneur apprécie le geste.';}],['« Chacun son rôle. Je jugerai sur les résultats. »','Relation −',()=>{if(S.staff.coach)S.staff.coach.rel-=5;S.confidence+=2;return 'Les adhérents aiment un président qui tient la barre.';}],['« Pas de commentaire. »','Le doute s’installe',()=>{S.mood-=2;return 'La rumeur enfle.';}]]},
 europe:{q:'L’Europe, c’est un rêve ou un objectif ?',a:[['« Un objectif : on vient pour gagner. »','Pression, prestige',()=>{S.rep+=1;S.flags.pressure=true;return 'Le continent est prévenu.';}],['« Une fête pour la ville, on profite. »','Supporters +',()=>{S.mood+=4;return 'Belle communion avec le public.';}],['« La priorité reste le championnat. »','Moral des cadres −',()=>{S.players.filter(p=>p.ovr>=strength().ovr).forEach(p=>p.morale=clamp(p.morale-3,0,100));S.confidence+=1;return 'Les adhérents approuvent, certains cadres moins.';}]]},
 mercato:{q:'Le mercato est ouvert. Des arrivées en vue ?',a:[['« Nous cherchons un grand nom. »','Supporters +, agents gourmands',()=>{S.mood+=4;S.flags.agentGreed=(S.flags.agentGreed||0)+3;(S.market||[]).forEach(p=>p.demand=Math.round(p.demand*1.04));return 'Les agents ont bien entendu… et augmentent leurs demandes.';}],['« L’effectif est complet. »','Moral +',()=>{S.players.forEach(p=>p.morale=clamp(p.morale+3,0,100));return 'Le groupe se sent soutenu.';}],['« Aucun joueur n’est intransférable. »','Moral −, offres +',()=>{S.players.forEach(p=>p.morale=clamp(p.morale-3,0,100));S.flags.openShop=S.gw;return 'Les clubs acheteurs prennent note.';}]]},
 finances:{q:'Les comptes du club inquiètent. Que répondez-vous ?',a:[['« Tout est sous contrôle. »','Si c’est faux, ça se paiera',()=>{S.confidence+=2;if(projection()<-LV[S.div].spons*.2)S.flags.liar=true;return 'La salle n’est qu’à moitié convaincue.';}],['« Des efforts seront demandés à tous. »','Adhérents +, moral −',()=>{S.confidence+=3;S.players.forEach(p=>p.morale=clamp(p.morale-2,0,100));return 'Un discours de vérité apprécié par les adhérents.';}],['« Nous cherchons de nouveaux partenaires. »','Sponsors',()=>{if(R()<.4){const b=Math.round(LV[S.div].spons*.05/100)*100;S.sponsorBonus+=b;return 'Un partenaire se manifeste : +'+money(b)+' cette saison.';}return 'Pas de retour immédiat.';}]]},
 ambition:{q:'Quel est le projet du club à cinq ans ?',a:[['« Monter le plus haut possible. »','Supporters +, pression',()=>{S.mood+=3;S.flags.pressure=true;return 'L’ambition plaît.';}],['« Former et faire jouer les jeunes du coin. »','Image +, subventions',()=>{S.rep+=1;S.subsidyMult*=1.02;return 'La mairie apprécie le discours.';}],['« Des comptes sains d’abord. »','Adhérents +',()=>{S.confidence+=3;return 'Les adhérents sont rassurés.';}]]},
 arbitrage:{q:'Le dernier match a fait polémique. L’arbitrage vous a-t-il lésé ?',a:[['« L’arbitre a volé mon équipe. »','Supporters +, amende probable',()=>{S.mood+=4;if(R()<.6){const a=[150,300,800,2500,8000,25000,50000][S.div];fin('Amendes',-a);return 'La commission de discipline sanctionne vos propos : '+money(a)+'.';}return 'Les supporters approuvent.';}],['« Nous devons d’abord nous regarder. »','Moral −, image +',()=>{S.rep+=1;S.players.forEach(p=>p.morale=clamp(p.morale-1,0,100));return 'Un discours responsable.';}],['« Pas de commentaire. »','Neutre',()=> 'Vous évitez la polémique.']]},
 jeunes:{q:'Vos jeunes du centre ont-ils un avenir ici ?',a:[['« Ils auront leur chance. »','Jeunes +',()=>{S.players.filter(p=>p.age<=21).forEach(p=>p.morale=clamp(p.morale+6,0,100));return 'Les jeunes sont galvanisés.';}],['« Il faudra le mériter. »','Neutre',()=>{S.players.filter(p=>p.age<=21).forEach(p=>p.morale=clamp(p.morale+1,0,100));return 'Message reçu.';}],['« Nous privilégions l’expérience. »','Cadres +, jeunes −',()=>{S.players.forEach(p=>p.morale=clamp(p.morale+(p.age>=27?3:-4),0,100));return 'Les anciens apprécient, les jeunes beaucoup moins.';}]]}
};
function pressMaybe(rep){if(UI.multiRun||S.week<3||S.week>=S.N)return;if(S.gw-(S.flags.lastPress||-99)<5||R()>.55)return;S.flags.lastPress=S.gw;const c=pressCtx(rep);UI.queue.push({type:'event',id:'presse_conf',d:{c}});}
function clubLifeCards(){
  const U=S.ultras,L=LV[S.div];
  const sup=`<div class="card"><header><h3>Tribune populaire</h3>${U?`<span class="pill ${U.rel>=55?'g':U.rel<30?'b':'y'}">${U.rel>=75?'Fusionnels':U.rel>=55?'Bonnes relations':U.rel>=30?'Relations tièdes':'Rupture'}</span>`:''}</header>
   ${U?`<div class="ultra-band" style="--c1:${S.club.c1};--c2:${S.club.c2}"><b>${esc(U.name)}</b><span>${nf(U.size)} membres · depuis ${U.since}</span></div>
   <div><div class="spread" style="font-size:13.5px"><b>Relation avec la présidence</b><span class="num">${Math.round(U.rel)}/100</span></div><div class="meter"><i style="width:${U.rel}%;background:${U.rel<30?'var(--bad)':U.rel>=55?'var(--good)':'var(--flood)'}"></i></div></div>
   <p class="muted" style="margin:0;font-size:13px">${U.rel>=55?'Leur ferveur pousse l’équipe à domicile (+'+(U.rel>=75?'1,6':'1')+' de force).':'Sans leur soutien, le virage sonne creux.'} Prix des places, résultats et naming jouent sur la relation. Fumigènes = amendes, et sous 20 de relation, risque de huis clos.${U.sec>0?' Sécurité renforcée encore '+U.sec+' journées.':''}</p>
   <div class="row"><button class="btn sm" onclick="A.ultraMeet()">Rencontrer les leaders</button><button class="btn sm" onclick="A.ultraTifo()" ${U.tifo===S.year?'disabled':''}>Financer local et tifo (${money(Math.round(Math.max(500,S.sponsorAnnual*.015)/100)*100)})</button><button class="btn sm dan" onclick="A.ultraSec()">Renforcer la sécurité</button></div>`
   :`<p class="muted" style="margin:0;font-size:13.5px">Pas encore de groupe de supporters organisé. Il naîtra quand le club comptera assez de fidèles (environ 1 500 supporters).</p>`}</div>`;
  const R_=S.reserve,F=S.femT;
  const teams=`<div class="card"><h3>Équipes du club</h3>
   <div class="team-row"><div><b>Équipe réserve</b><div class="muted" style="font-size:13px">${R_?RES_LV[S.div]+' · cette saison '+R_.W+' V, '+R_.D+' N, '+R_.L+' D'+(R_.last?' · saison passée : '+R_.last.pos+'e':''):'Donne du temps de jeu aux remplaçants et aux jeunes : ils progressent comme s’ils jouaient.'}</div></div>${R_?`<button class="btn sm" onclick="A.reserveClose()">Dissoudre</button>`:`<button class="btn sm pri" onclick="A.reserveCreate()">Créer (${money(RESCOST[S.div])}/an)</button>`}</div>
   <div class="team-row"><div><b>Section féminine</b><div class="muted" style="font-size:13px">${S.flags.fem?FEM_LV[S.div]+(F?' · cette saison '+F.W+' V, '+F.D+' N, '+F.L+' D'+(F.last?' · saison passée : '+F.last.pos+'e':''):''):'Subventions +10 %, image et supporters en hausse.'}</div></div>${S.flags.fem?'<span class="pill g">Active</span>':`<button class="btn sm pri" onclick="A.femCreate()">Créer (${money(FEMCOST[S.div])}/an)</button>`}</div></div>`;
  const lg=S.legends||[];
  const leg=`<div class="card"><header><h3>Légendes du club</h3><span class="muted" style="font-size:13px">${lg.length} joueur${lg.length>1?'s':''}</span></header>
   ${lg.length?`<div class="legends">${lg.map((l,i)=>`<div class="legend"><div class="lshirt" style="--c1:${S.club.c1};--c2:${S.club.c2}"><span>${l.num}</span>${l.retired?'<em>retiré</em>':''}</div><div><b>${esc(l.n)}</b><div class="muted" style="font-size:12.5px">${POSN[l.pos]||l.pos} · ${l.seasons} saisons · ${l.apps} matchs · ${l.goals} buts${l.tribune?' · <span class="gold">tribune '+esc(l.n.split(' ').pop())+'</span>':''}</div>
     <div class="row" style="gap:6px;margin-top:6px">${l.retired?'':`<button class="btn sm" onclick="A.legRetire(${i})">Retirer le n° ${l.num}</button>`}${l.tribune?'':`<button class="btn sm" onclick="A.legTribune(${i})">Nommer une tribune</button>`}${l.ret&&!l.jubile?`<button class="btn sm pri" onclick="A.legJubile(${i})">Organiser son jubilé</button>`:''}</div></div></div>`).join('')}</div>`
   :'<p class="muted" style="margin:0;font-size:13.5px">Un joueur entre dans la légende en quittant le club après 6 saisons, 160 matchs ou 60 buts sous vos couleurs.</p>'}</div>`;
  const I=S.investor;
  const inv=I?`<div class="card"><header><h3>Actionnaire majoritaire</h3><span class="pill ${I.strikes?'b':'g'}">${I.strikes?'Avertissement '+I.strikes+'/2':'Satisfait'}</span></header><p style="margin:0;font-size:14px"><b>${esc(I.n)}</b> détient la majorité depuis ${I.since}. Il exige ${DEM_TXT[I.dem]} chaque saison et apporte ${money(I.top)} par an.</p></div>`:'';
  return inv+sup+teams+leg;
}
