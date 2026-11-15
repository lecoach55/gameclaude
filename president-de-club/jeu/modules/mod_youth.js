
/* ====================== Centre de formation ====================== */
const YPROF={GB:['Gardien prometteur','Gardien à réflexes'],DC:['Défenseur rugueux','Défenseur relanceur'],LAT:['Latéral moderne','Piston infatigable'],MDC:['Sentinelle','Récupérateur'],MC:['Milieu box-to-box','Organisateur'],MOC:['Meneur créatif','Numéro 10'],AIL:['Ailier dribbleur','Flèche'],BU:['Buteur né','Avant-centre puissant']};
function yProf(p){ensureRole(p);const o=YPROF[p.role]||['Polyvalent'];return o[hashN(p.id*7+1)<.5?0:1];}
function yStatus(p){if(!p.youth&&!p.yst)return null;return p.yst||(p.age<=17?'aspirant':p.age<=19?'stagiaire':null);}
const YST_N={aspirant:'Aspirant',stagiaire:'Stagiaire'};
const yPro=()=>S.sasp||S.div>=4;
function yPotSeen(p){const fo=slvl('formateur');if(fo>=3)return String(p.pot);const e=fo>=1?4:7;return Math.max(p.ovr,p.pot-e)+'-'+(p.pot+e);}
function yComment(p){
  const fo=slvl('formateur'),gap=p.pot-p.ovr,L=LV[S.div],mid=(L.str[0]+L.str[1])/2;const a=[];
  a.push(yProf(p));
  if(p.ovr>=mid-2)a.push('déjà au niveau de l’équipe première');else if(gap>=14)a.push(fo>=2?'un énorme potentiel':'semble avoir beaucoup de marge');else if(gap>=7)a.push('peut devenir un joueur de rotation');else a.push('plafond limité');
  if(fo>=2){const at=attrs(p).slice().sort((x,y)=>y.v-x.v);if(at[0])a.push('point fort : '+at[0].n.toLowerCase());}
  if(fo>=3)a.push('caractère '+(p.pers||'').toLowerCase());
  return a.join(', ')+'.';
}
// génération des U18 proposés par le formateur
function yGenCandidates(){
  const fl=S.infra.formation,fo=slvl('formateur'),L=LV[S.div];
  const gen=+rf(.85,1.2).toFixed(2);S.yGen=gen;
  const nK=2+Math.floor(fl/2)+(fo>=3?1:0),nC=nK+2+(S.yDetect||0);S.yDetect=0;
  const out=[];
  for(let k=0;k<nC;k++){
    const ovr=Math.round(L.str[0]-16+fl*1.6+fo*1+rf(-4,4)+(S.flags.youthBoost||0)*.5+(gen-1)*8);
    const p=genPlayer({age:ri(16,18),ovr,youth:true,contract:3});p.contract=Math.max(1,20-p.age);
    p.pot=clamp(Math.round(ovr+ri(4,15)+fl*1.2+fo*.8+(gen-1)*10+(R()<.08?ri(4,9):0)),ovr,94);
    p.wage=Math.max(40,Math.round(wageFor(ovr)*.4/10)*10);p.pers=pick(PERS);ensureRole(p);p.yst=p.age<=17?'aspirant':'stagiaire';
    out.push(p);
  }
  out.sort((a,b)=>(b.pot+b.ovr*.3)-(a.pot+a.ovr*.3));
  return {list:out,keep:nK};
}
function yFinishing(){return S.players.filter(p=>p.yst&&p.age>=19&&!p.loan);}
function yDefaultPro(p){const L=LV[S.div];return p.pot>=(L.str[0]+L.str[1])/2+2||p.ovr>=L.str[0]-3;}
function yIntakeStart(msgs){
  const c=yGenCandidates();S.yCand={ids:c.list.map(p=>p.id),keep:c.keep,pool:c.list};
  const fin=yFinishing();
  if(UI.multiRun){yIntakeApply(c.list.slice(0,c.keep).map(p=>p.id),fin.filter(yDefaultPro).map(p=>p.id),msgs);return;}
  UI.queue.push({type:'yintake'});
}
function yIntakeApply(keepIds,proIds,msgs){
  const C=S.yCand;if(!C)return;msgs=msgs||[];const kept=[];
  C.pool.forEach(p=>{if(keepIds.includes(p.id)&&squadN()<30){S.players.push(p);logMove(p,'Contrat aspirant','Formation du club',S.club.name,0,'in');kept.push(pname(p)+' ('+ensureRole(p).role+', '+p.ovr+')');}});
  const gq=S.yGen>=1.1?' Une génération exceptionnelle selon le formateur !':S.yGen<=.92?' Une génération modeste cette année.':'';
  if(kept.length)msgs.push('Centre de formation : '+kept.length+' contrat'+(kept.length>1?'s':'')+' aspirant signé'+(kept.length>1?'s':'')+' — '+kept.join(', ')+'.'+gq);
  // fin de formation
  yFinishing().forEach(p=>{
    if(proIds.includes(p.id)){p.yst=null;p.contract=3;p.wage=Math.max(p.wage,Math.round(wageFor(p.ovr)*.85/10)*10);p.morale=clamp(p.morale+10,0,100);logMove(p,'Premier contrat pro','Formation du club',S.club.name,0,'in');msgs.push(pname(p)+' signe son premier contrat '+(yPro()?'professionnel':'senior')+'.');}
    else{S.players=S.players.filter(x=>x!==p);logMove(p,'Fin de formation',S.club.name,R()<.5?'Libre':clubName(new Set()),0,'out');msgs.push(pname(p)+' n’est pas conservé à l’issue de sa formation.');}
  });
  // statut des autres jeunes
  S.players.forEach(p=>{if(p.yst){p.yst=p.age<=17?'aspirant':'stagiaire';if(p.yst==='stagiaire')p.wage=Math.max(p.wage,Math.round(wageFor(p.ovr)*.6/10)*10);}});
  S.yCand=null;
}
A.yIntake=function(){
  const C=S.yCand;if(!C){nextQueue();return;}const w=advWho('formateur'),fin=yFinishing();
  UI.curModalFn=()=>A.yIntake();
  const rows=C.pool.map((p,i)=>`<label class="yrow"><input type="checkbox" class="ykeep" value="${p.id}" ${i<C.keep?'checked':''}><span><b>${plk(p.id,pname(p))}</b> · ${p.age} ans · <span class="role">${ensureRole(p).role}</span> · note <b>${p.ovr}</b> · potentiel ${yPotSeen(p)}<br><span class="muted" style="font-size:12.5px">« ${esc(yComment(p))} » · ${money(p.wage)}/mois</span></span></label>`).join('');
  const frows=fin.map(p=>`<div class="yrow"><span><b>${plk(p.id,pname(p))}</b> · ${p.age} ans · <span class="role">${ensureRole(p).role}</span> · note <b>${p.ovr}</b> · pot. ${yPotSeen(p)} · ${(p.s?p.s.mj+p.s.cmj:0)} matchs cette saison<br><span class="muted" style="font-size:12.5px">Contrat ${yPro()?'pro':'senior'} : ${money(Math.round(wageFor(p.ovr)*.85/10)*10)}/mois · 3 saisons</span></span>
     <span class="row"><label><input type="radio" name="yf${p.id}" value="pro" ${yDefaultPro(p)?'checked':''}> ${yPro()?'Pro':'Garder'}</label><label><input type="radio" name="yf${p.id}" value="out" ${yDefaultPro(p)?'':'checked'}> Libérer</label></span></div>`).join('');
  openModal(`<div class="kicker">Centre de formation · ${seasonLabel(S.year)}</div><h2>🎓 Promotion des U18</h2>
   <p class="muted">${esc(w.name)}, ${esc(w.title.toLowerCase())}, vous présente les meilleurs jeunes de la saison${S.yGen>=1.1?' : <b class="good">une génération exceptionnelle</b>':S.yGen<=.92?' : une génération modeste':''}. Il recommande d’en garder ${C.keep}. Effectif actuel : ${squadN()}/30.</p>
   <div class="ylist">${rows}</div>
   ${fin.length?`<h3 style="margin-top:14px">Fin de formation : premier contrat ${yPro()?'pro':'senior'} ?</h3><div class="ylist">${frows}</div>`:''}
   <div class="row"><button class="btn pri" onclick="A.yIntakeOk()">Valider</button></div>`,true);
};
A.yIntakeOk=function(){
  const keep=[...document.querySelectorAll('.ykeep:checked')].map(x=>+x.value);
  const pro=yFinishing().filter(p=>{const r=document.querySelector(`input[name="yf${p.id}"]:checked`);return r?r.value==='pro':yDefaultPro(p);}).map(p=>p.id);
  const msgs=[];yIntakeApply(keep,pro,msgs);msgs.forEach(m=>news(m,'g'));UI.curModalFn=null;save();closeModal();
};
// la mission « jeunes » du recruteur alimente la détection
function yDetectAdd(){S.yDetect=Math.min(3,(S.yDetect||0)+1);}
function youthCard(){
  const ys=S.players.filter(p=>p.age<=21).sort((a,b)=>b.pot-a.pot);if(!ys.length)return '';
  const xi=new Set(strength().xi.map(e=>e.p.id));
  return `<div class="card"><header><h3>🎓 Centre de formation et jeunes</h3><span class="muted" style="font-size:13px">${INFRA.formation.lv[S.infra.formation]} · ${esc(advWho('formateur').name)}${slvl('formateur')?' '+'★'.repeat(slvl('formateur')):''}</span></header>
   <div class="tbl-wrap"><table><thead><tr><th>Joueur</th><th>Âge</th><th>Statut</th><th>Rôle</th><th class="r">Note</th><th class="r">Pot.</th><th>Temps de jeu</th><th>Avis du formateur</th></tr></thead><tbody>
   ${ys.map(p=>{const st=yStatus(p),mj=p.s?p.s.mj+p.s.cmj:0;const tj=p.loan?`Prêté à ${esc(p.loan.club)} : ${p.loan.mj} m.${p.loan.nn?' · '+(p.loan.ns/p.loan.nn).toFixed(1).replace('.',','):''}`:xi.has(p.id)?'<span class="good">Titulaire</span>':mj+' match'+(mj>1?'s':'');
     return `<tr><td>${plk(p.id,pname(p))}</td><td>${p.age}</td><td>${st?'<span class="pill">'+YST_N[st]+'</span>':(yPro()?'Pro':'Senior')}</td><td><span class="role">${ensureRole(p).role}</span></td><td class="r"><b>${p.ovr}</b></td><td class="r">${yPotSeen(p)}</td><td>${tj}</td><td class="muted" style="font-size:12.5px;white-space:normal;min-width:180px">${esc(yComment(p))}</td></tr>`;}).join('')}
   </tbody></table></div>
   <p class="muted" style="margin:6px 0 0;font-size:12.5px">Aspirant (16-17 ans) puis stagiaire (18-19 ans) : à 19 ans, vous décidez de leur offrir un premier contrat ${yPro()?'professionnel':'senior'} ou de les libérer. Chaque été, le formateur vous présente les meilleurs U18.</p></div>`;
}
