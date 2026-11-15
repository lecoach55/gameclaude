
/* ====================== Missions du recruteur ====================== */
const MIS={
 poste:{n:'Chercher un poste précis',ic:'🎯',d:2,c:1,txt:'Il ratisse les matchs pour trouver des joueurs à un poste donné.'},
 jeunes:{n:'Jeunes à potentiel',ic:'🌱',d:3,c:1.2,txt:'Tournois de jeunes, centres de formation, réserves : des paris sur l’avenir.'},
 libres:{n:'Joueurs libres',ic:'🆓',d:1,c:.6,txt:'Joueurs sans club ou en fin de contrat : pas d’indemnité à payer.'},
 exp:{n:'Joueurs expérimentés',ic:'🎖️',d:2,c:1,txt:'Des joueurs de 29 à 33 ans, prêts tout de suite, pour encadrer le vestiaire.'},
 region:{n:'Prospecter la région',ic:'📍',d:2,c:.7,txt:'Des joueurs du coin, attachés au territoire, moins exigeants sur le salaire.'},
 inf:{n:'Divisions inférieures',ic:'⬇️',d:2,c:.8,txt:'Les meilleurs joueurs de la division du dessous : pas chers, souvent affamés.'},
 etranger:{n:'Prospecter à l’étranger',ic:'✈️',d:3,c:2.5,txt:'Belgique, Suisse, Espagne, Allemagne… Plus cher, mais un meilleur niveau.'},
 adv:{n:'Observer le prochain adversaire',ic:'🔭',d:1,c:.5,txt:'Il assiste au match de votre prochain adversaire : l’entraîneur prépare mieux la rencontre.'}
};
const misCost=k=>Math.round(SCOUT_COST[S.div]*MIS[k].c*2/50)*50;
const misDur=k=>Math.max(1,MIS[k].d-(slvl('recruteur')>=4?1:0));
function misLabelLow(m){const l=misLabel(m);return l.charAt(0).toLowerCase()+l.slice(1);}
function misLabel(m){return MIS[m.k].n+(m.k==='poste'&&m.role?' : '+ROLE[m.role].n.toLowerCase():'')+(m.k==='adv'&&m.opp?' ('+m.opp+')':'');}
function misPlayer(d,o){
  const rec=slvl('recruteur');o=o||{};
  const p=genPlayer({div:clamp(d,0,6),pos:o.pos,age:o.age});
  if(o.role){p.role=o.role;p.pos=RGROUP[o.role];}
  if(o.age!=null&&o.age<=20){p.pot=clamp(p.ovr+ri(8,18)+rec*2,p.ovr,95);}
  if(o.age!=null&&o.age>=29){p.ovr=clamp(p.ovr+ri(1,3),25,92);p.pot=p.ovr;}
  p.ovr=clamp(p.ovr+Math.round(rec*.6-.5)+(o.ovr||0),25,92);p.pot=Math.max(p.pot,p.ovr);
  const free=o.free!=null?o.free:R()<(S.div<=2?.55:.2);
  p.fee=free?0:Math.round(valueFor(p,d)*rf(.85,1.25)*(o.feeM||1)/100)*100;
  p.demand=Math.round(wageFor(p.ovr)*rf(1,1.3)*(o.wM||1)*(1+Math.max(0,p.ovr-LV[S.div].str[1])*.06)/10)*10;
  p.club=free?'Libre':(o.club||(R()<.5?clubNameLocal(new Set(S.teams.map(t=>t.name))):'Club de '+LV[clamp(d,0,6)].n));
  p.pers=pick(PERS);p.firm=+rf(.78,.93).toFixed(2);p.lastYear=!free&&R()<.3;
  genHist(p,p.club==='Libre'||p.club.startsWith('Club de')?null:p.club,clamp(d,0,6));
  p.scouted=rec>=2;p.potSeen=rec>=2?[p.pot,p.pot]:[clamp(p.pot-ri(1,5),p.ovr,99),p.pot+ri(1,5)];
  if(o.tag)p.local=1;
  return p;
}
function misForeignClub(){const e=pick(EU_C),c=pick(e[2]);return e[3]?pick(e[3])+c:c+pick(e[4]||[' FC']);}
function misFind(m){
  const rec=slvl('recruteur'),n=2+Math.ceil(rec/2),out=[];
  for(let k=0;k<n;k++){let p;
    switch(m.k){
      case 'poste':p=misPlayer(S.div+pick([0,0,0,-1,rec>=3?1:0]),{role:m.role});break;
      case 'jeunes':p=misPlayer(S.div+pick([0,-1]),{age:ri(17,20),ovr:-ri(2,5)});break;
      case 'libres':p=misPlayer(S.div+pick([0,0,-1,rec>=3?1:0]),{free:true,ovr:-1});break;
      case 'exp':p=misPlayer(S.div+pick([0,0,1]),{age:ri(29,33),ovr:ri(2,4),wM:1.15});break;
      case 'region':p=misPlayer(S.div+pick([0,0,-1]),{wM:.85,tag:1});break;
      case 'inf':p=misPlayer(S.div-1,{ovr:ri(2,5),feeM:.7,wM:.9});if(p.age>26)p.age=ri(20,25);break;
      case 'etranger':p=misPlayer(S.div+pick([0,0,1]),{ovr:ri(1,3),feeM:1.3,wM:1.2,club:misForeignClub(),free:false});break;
    }
    if(p){p.mis=MIS[m.k].ic+' '+misLabel(m);out.push(p);}
  }
  // le recruteur range d'abord ses meilleurs coups
  return out.sort((a,b)=>(b.ovr+(b.pot-b.ovr)*.4)-(a.ovr+(a.pot-a.ovr)*.4));
}
function misStart(k,role,auto){
  const rec=slvl('recruteur');if(!rec)return false;
  const c=misCost(k);if(S.cash<c)return false;
  const m={k,role:k==='poste'?(role||'BU'):null,start:S.gw,end:S.gw+misDur(k),cost:c,auto:!!auto};
  if(k==='adv'){const nf=nextFixture();if(!nf)return false;m.opp=nf.opp.name;m.end=S.gw+1;}
  fin('Supervisions',-c);S.mission=m;
  const w=advWho('recruteur');
  news(w.name+' part en mission'+(auto?' de sa propre initiative':'')+' : '+misLabelLow(m)+' ('+misDur(k)+' journée'+(misDur(k)>1?'s':'')+', '+money(c)+').');
  return true;
}
function misEnd(){
  const m=S.mission;S.mission=null;S.misLast=S.gw;const w=advWho('recruteur');
  S.misHist=S.misHist||[];
  if(m.k==='adv'){
    const t=S.teams.find(x=>x.name===m.opp);const rec=slvl('recruteur');
    const bonus=+(0.6+rec*.35).toFixed(1);S.oppScout={opp:m.opp,b:bonus};
    const style=t?(t.att>t.def+1?'joue très offensif, mais laisse des espaces derrière':t.def>t.att+1?'défend bas et compte sur les contres':'est équilibré, sans point faible évident'):'est difficile à cerner';
    const star=t&&t.sq&&t.sq.length?t.sq.slice().sort((a,b)=>b.w-a.w)[0]:null;
    const txt=m.opp+' '+style+'.'+(star?' Le joueur à surveiller : '+star.n+'.':'')+' L’entraîneur adapte son plan de jeu (+'+String(bonus).replace('.',',')+' de force pour ce match).';
    news('Rapport de '+w.name+' sur '+txt,'g');
    S.misHist.unshift({y:seasonLabel(S.year),j:S.week,l:misLabel(m),r:'Plan de jeu préparé',auto:m.auto});
    S.misRep={l:misLabel(m),ids:[],txt,auto:m.auto,gw:S.gw};
  }else{
    const found=misFind(m);
    S.market=found.concat(S.market.filter(p=>!found.includes(p)));
    S.watch=S.watch||[];found.slice(0,m.auto?2:9).forEach(p=>{if(!S.watch.includes(p.id))S.watch.push(p.id);});
    const best=found[0];
    news(w.name+' revient de mission ('+misLabelLow(m)+') avec '+found.length+' joueurs repérés, en tête du marché'+(m.auto?' (les 2 meilleurs dans votre liste de suivi)':' et dans votre liste de suivi')+(best?'. Son coup de cœur : '+pname(best)+' ('+best.ovr+')':'')+'.','g');
    S.misHist.unshift({y:seasonLabel(S.year),j:S.week,l:misLabel(m),r:found.length+' joueurs repérés',auto:m.auto});
    S.misRep={l:misLabel(m),ids:found.map(p=>p.id),auto:m.auto,gw:S.gw};
  }
  if(S.misHist.length>12)S.misHist.length=12;
  if(!UI.multiRun&&!m.auto)UI.queue.push({type:'misrep'});
}
// sans consigne, le recruteur choisit lui-même sa mission
function misAutoPick(){
  const nf=nextFixture(),rec=slvl('recruteur');
  let an=null;try{an=squadAnalysis();}catch(e){}
  const wi=winInfo(),soon=wi.cur||(wi.next&&wi.next.a-S.week<=3);
  if(an&&an.rec.length&&soon){
    const P=an.rec[0],roles=[...new Set(ROLES_OF[P.k])];
    const cnt=r=>S.players.filter(p=>!p.loan&&(ensureRole(p).role===r||p.role2===r)).length;
    const role=roles.sort((a,b)=>cnt(a)-cnt(b))[0];
    return {k:'poste',role,why:'le poste '+ROLE[role].n.toLowerCase()+' est le plus faible de l’effectif'};
  }
  const exp=S.players.filter(p=>!p.loan&&p.contract<=1).length;
  if(exp>=4&&soon)return {k:'libres',why:exp+' contrats expirent bientôt'};
  if(nf&&rec>=2&&(nf.opp.derby||nf.opp.rating>=strength().ovr))return {k:'adv',why:'le prochain adversaire ('+nf.opp.name+') est un gros morceau'};
  if(soon)return {k:pick(['jeunes','region','inf']),why:'préparer le prochain mercato'};
  return null;
}
function misTick(){
  if(S.mission&&S.gw>=S.mission.end)misEnd();
  if(S.mission||!slvl('recruteur')||S.misAuto===false||S.seasonOver)return;
  if(S.gw-(S.misLast||0)<2)return;
  let c=misAutoPick();if(!c)return;
  const last=(S.misHist||[])[0];if(last&&last.l===misLabel(c)){c=S.players.filter(p=>!p.loan&&p.contract<=1).length>=3?{k:'libres',why:'des contrats arrivent à échéance'}:{k:pick(['jeunes','region','inf']),why:'élargir les pistes après sa dernière mission'};}
  if(S.cash<misCost(c.k)*8)return;
  if(misStart(c.k,c.role,true)){S.mission.why=c.why;}
}
function misOppBonus(me,nf){
  if(S.oppScout&&nf&&nf.opp&&nf.opp.name===S.oppScout.opp){const b=S.oppScout.b;me.att+=b;me.def+=b;me.ovr+=b;}
  S.oppScout=null;
}
A.misSend=function(){
  const k=(document.getElementById('misK')||{}).value||'poste',role=(document.getElementById('misR')||{}).value;
  if(S.mission){toast('Le recruteur est déjà en mission.');return;}
  if(!slvl('recruteur')){toast('Embauchez un recruteur (onglet Staff).');return;}
  if(S.cash<misCost(k)){toast('Trésorerie insuffisante.');return;}
  if(k==='adv'&&!nextFixture()){toast('Plus de match de championnat à préparer.');return;}
  misStart(k,role,false);save();render();toast('Mission lancée.');
};
A.misCancel=function(){if(!S.mission)return;news('Mission du recruteur annulée ('+misLabelLow(S.mission)+'). Les frais engagés sont perdus.');S.mission=null;S.misLast=S.gw;save();render();};
A.misAuto=function(){S.misAuto=S.misAuto===false?true:false;save();render();};
A.misK=function(v){UI.misK=v;render();};
A.misReport=function(){
  const r=S.misRep;if(!r){toast('Pas encore de rapport de mission.');return;}
  const ps=r.ids.map(id=>S.market.find(p=>p.id===id)).filter(Boolean),w=advWho('recruteur');
  const rows=ps.length?`<div class="tbl-wrap"><table><thead><tr><th>Joueur</th><th>Rôle</th><th>Âge</th><th>Note</th><th>Pot.</th><th>Club</th><th>Coût</th><th></th></tr></thead><tbody>${ps.map(p=>`<tr><td><span class="pos ${p.pos}">${p.pos}</span> ${plk(p.id,pname(p))}${p.local?' <span class="pill">du coin</span>':''}</td><td><span class="role">${ensureRole(p).role}</span></td><td>${p.age}</td><td><b>${p.ovr}</b></td><td>${potTxt(p)}</td><td style="white-space:normal">${esc(p.club)}</td><td style="white-space:normal">${p.fee?money(p.fee):'libre'}<br><span class="muted">${money(p.demand)}/mois</span></td><td><button class="btn sm pri" onclick="A.close();setTimeout(()=>A.nego(${p.id}),40)">Négocier</button></td></tr><tr><td colspan="8" class="muted" style="font-size:12.5px;white-space:normal">« ${esc(misComment(p))} »</td></tr>`).join('')}</tbody></table></div>`
    :(r.txt?`<p>${esc(r.txt)}</p>`:'<p class="muted">Les joueurs repérés ont déjà signé ailleurs ou ne sont plus disponibles.</p>');
  UI.curModalFn=()=>A.misReport();
  openModal(`<h2>${MIS[Object.keys(MIS).find(k=>r.l.startsWith(MIS[k].n))||'poste'].ic} Rapport de mission</h2><p class="muted">${esc(w.name)}, ${esc(w.title.toLowerCase())} · ${esc(r.l)}${r.auto?' · mission choisie par le recruteur':''}</p>${rows}
   <div class="row">${ps.length&&!windowOpen()?'<span class="muted" style="font-size:13px">Mercato fermé : vous pourrez négocier (ou proposer un pré-contrat) à la réouverture. Ils restent dans votre liste de suivi.</span>':''}<button class="btn" onclick="A.close()">Fermer</button></div>`,true);
};
function misComment(p){
  const rec=slvl('recruteur'),gap=p.pot-p.ovr,mid=(LV[S.div].str[0]+LV[S.div].str[1])/2;
  const a=[];
  if(p.ovr>=mid+3)a.push('Il serait titulaire tout de suite chez nous');else if(p.ovr>=mid-1)a.push('Niveau de la division, solide en rotation');else a.push('Un peu juste pour l’instant');
  if(gap>=10)a.push(rec>=2?'énorme marge de progression':'il a l’air d’avoir de la marge');else if(gap>=4)a.push('peut encore progresser');
  if(rec>=2){const at=attrs(p).slice().sort((x,y)=>y.v-x.v);if(at[0])a.push('point fort : '+at[0].n.toLowerCase());}
  if(p.local)a.push('attaché à la région');
  if(rec>=3)a.push('caractère '+p.pers.toLowerCase());
  return a.join(', ')+'.';
}
function misCard(){
  const rec=slvl('recruteur'),w=advWho('recruteur'),m=S.mission,k=UI.misK||'poste';
  if(!rec)return `<div class="card"><header><h3>🕵️ Cellule de recrutement</h3></header><p class="muted" style="margin:0">Embauchez un recruteur (onglet Staff) pour l’envoyer en mission : chercher un poste précis, des jeunes, des joueurs libres, observer le prochain adversaire…</p></div>`;
  const hist=(S.misHist||[]).slice(0,4).map(h=>`<div class="muted" style="font-size:12.5px">${h.y} J${h.j} · ${esc(h.l)} → ${esc(h.r)}${h.auto?' <span class="pill">son initiative</span>':''}</div>`).join('');
  const cur=m?`<div class="spread"><div><b>${MIS[m.k].ic} En mission : ${esc(misLabel(m))}</b><br><span class="muted" style="font-size:13px">${m.auto?'Choisie par '+esc(w.name)+(m.why?' : '+esc(m.why):'')+'. ':''}Retour ${m.end-S.gw<=1?'après la prochaine journée':'dans '+(m.end-S.gw)+' journées'}.</span></div><button class="btn sm" onclick="A.misCancel()">Rappeler</button></div>`
   :`<div class="row" style="flex-wrap:wrap;gap:8px"><select id="misK" onchange="A.misK(this.value)">${Object.entries(MIS).map(([kk,v])=>`<option value="${kk}" ${kk===k?'selected':''}>${v.ic} ${v.n}</option>`).join('')}</select>
     ${k==='poste'?`<select id="misR">${Object.entries(ROLE).map(([r,v])=>`<option value="${r}">${v.n}</option>`).join('')}</select>`:''}
     <button class="btn pri" onclick="A.misSend()">Envoyer en mission · ${money(misCost(k))} · ${k==='adv'?1:misDur(k)} j.</button></div><div class="muted" style="font-size:13px">${MIS[k].txt}</div>`;
  return `<div class="card"><header><h3>🕵️ Cellule de recrutement</h3><span class="muted" style="font-size:13px">${esc(w.name)} ${stars(rec)}</span></header>${cur}
   <div class="spread" style="margin-top:6px"><label style="font-size:13px"><input type="checkbox" ${S.misAuto===false?'':'checked'} onchange="A.misAuto()"> Sans consigne, le recruteur choisit lui-même ses missions</label>${S.misRep?'<button class="btn sm" onclick="A.misReport()">Dernier rapport</button>':''}</div>${hist}</div>`;
}
