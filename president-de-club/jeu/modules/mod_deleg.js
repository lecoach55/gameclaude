/* ====================== Délégations au staff ====================== */
const DELEG=[
 {k:'ticket',role:'commercial',n:'Prix des billets',d:'Ajuste le prix du billet avant chaque match à domicile pour maximiser la recette sans vider le stade.'},
 {k:'abo',role:'commercial',n:'Campagne d’abonnement',d:'Fixe le prix de l’abonnement à l’ouverture de la campagne.'},
 {k:'renew',role:'coach',n:'Prolongations de contrat',d:'Prolonge les titulaires et les espoirs en fin de contrat, au salaire raisonnable, dans la limite de la masse salariale.'},
 {k:'sell',role:'recruteur',n:'Offres pour les remplaçants',d:'Accepte les offres correctes (au moins la valeur estimée) pour les joueurs hors du onze. Les titulaires restent votre décision.'},
 {k:'recruit',role:'recruteur',n:'Recrutement des postes dégarnis',d:'Comble les trous de l’effectif (gardiens, défenseurs…) avec des joueurs adaptés, dans le budget que vous fixez.'},
 {k:'loan',role:'formateur',n:'Prêts des jeunes',d:'Prête les jeunes à fort potentiel qui ne jouent pas, pendant les fenêtres de mercato.'}
];
function dlg(){return S.deleg||(S.deleg={budget:0,log:[]});}
function dlgOn(k){return !!dlg()[k];}
function dlgLog(t){const D=dlg();D.log.unshift({w:wkLabel(),y:seasonLabel(S.year),t});D.log.length=Math.min(D.log.length,20);news('Délégation : '+t,'');}
function bestAbo(){let bp=S.abo.price,bv=-1;const f=aboFair();for(let p=Math.round(f*.35);p<=f*2;p+=Math.max(1,Math.round(f/60))){const n=aboDemand(p),v=n*p+(homeGames()*Math.max(0,attAt(S.ticket)-n*.9)*S.ticket)*.6;if(v>bv){bv=v;bp=p;}}return bp;}
function runDelegations(phase){
  if(!S)return;const D=dlg();const lv=r=>advWho(r).lvl;
  if(phase==='pre'){
    if(D.abo&&S.abo&&S.abo.open){const p=noisy(bestAbo(),lv('commercial'),S.year*3+5);if(p!==S.abo.price){S.abo.price=p;dlgLog(advWho('commercial').name+' fixe l’abonnement à '+p+' €.');}}
    if(D.ticket){const nf_=S.sched[S.week]&&S.sched[S.week].some(([h])=>S.teams[h].user);if(nf_){const b=clamp(noisy(bestTicket(),lv('commercial'),S.gw*7+1),1,150);if(b!==S.ticket){dlgLog(advWho('commercial').name+' passe le billet de '+S.ticket+' à '+b+' €.');S.ticket=b;}}}
    return;}
  // après le match
  const st=strength(),inXI=new Set(st.xi.map(e=>e.p.id));
  if(D.renew&&S.week>=Math.floor(S.N/2)){
    S.players.filter(p=>p.contract<=1&&!p.loan&&(inXI.has(p.id)||p.pot-p.ovr>=8||p.age<=21)&&p.renewTried!==S.gw).slice(0,2).forEach(p=>{
      p.renewTried=S.gw;const dem=Math.round(wageFor(p.ovr)*rf(1,1.2)*(p.morale<40?1.25:1)/10)*10;p.renewDemand=dem;p.renewDemandGw=S.gw;
      const n={wage:Math.round(dem*(lv('coach')>=3?.97:1.05)/10)*10,years:p.age>=30?1:p.age<=23?3:2};
      if(S.dncg&&wageBill()+n.wage-p.wage>S.dncg.cap)return;
      if(R()<renewChance(p,n)){p.wage=n.wage;p.contract+=n.years;p.morale=clamp(p.morale+8,0,100);dlgLog(advWho('coach').name+' prolonge '+pname(p)+' de '+n.years+' an'+(n.years>1?'s':'')+' ('+money(n.wage)+'/mois).');}
      else dlgLog(pname(p)+' refuse la prolongation proposée par '+advWho('coach').name+'.');});}
  if(D.sell&&windowOpen()){(S.offers||[]).slice().forEach(o=>{const p=getP(o.pid);if(!p||inXI.has(p.id))return;const v=valueFor(p);
    if(o.fee>=v*(lv('recruteur')>=3?1.05:.95)){sellPlayer(p,o.fee,o.club);S.offers=S.offers.filter(x=>x.pid!==p.id);dlgLog(advWho('recruteur').name+' accepte '+money(o.fee)+' de '+o.club+' pour '+pname(p)+'.');}});}
  if(D.loan&&windowOpen()){S.players.filter(p=>p.age<=21&&p.pot-p.ovr>=8&&!p.loan&&!inXI.has(p.id)&&(p.s?p.s.mj+p.s.cmj:0)<=1&&S.week>=3).slice(0,1).forEach(p=>{
    const d=clamp(S.div-1+(lv('formateur')>=3?0:-1),0,6);const o={club:clubName(new Set()),div:d,share:+rf(.4,.9).toFixed(2),play:+rf(lv('formateur')>=3?.7:.5,.95).toFixed(2)};
    p.loan=Object.assign({mj:0,g:0,a:0,ns:0,nn:0},o);p.listed=false;logMove(p,'Prêt',S.club.name,o.club,0,'out');dlgLog(advWho('formateur').name+' prête '+pname(p)+' à '+o.club+' ('+LV[o.div].n+').');});}
  if(D.recruit&&windowOpen()&&!(S.dncg&&S.dncg.lvl>=2)){const need={G:2,D:6,M:6,A:4};
    for(const [pos,n] of Object.entries(need)){if(squadN()>=30)break;if(S.players.filter(p=>p.pos===pos&&!p.loan).length>=n)continue;
      const room=Math.max(0,D.budget||0);const c=(S.market||[]).filter(p=>p.pos===pos&&(p.fee||0)<=room&&interest(p)>=.3&&(p.fee||0)+p.demand*3<=Math.max(0,S.cash)).sort((a,b)=>(b.ovr*(lv('recruteur')>=3?1:.97)+rf(0,lv('recruteur')>=2?1:4))-(a.ovr+0))[0];
      if(!c)continue;const fee=c.fee||0,af=Math.round((fee*.05+c.demand*(fee?.5:1.5))/100)*100;
      if(fee)fin('Transferts (achats)',-fee);fin('Commissions d’agents',-af);D.budget=room-fee;
      const q=Object.assign({},c,{wage:c.demand,contract:2,morale:72,fit:100,listed:false,youth:false,notes:[],promise:'Rotation',joinGw:S.gw,s:newS()});['fee','demand','club','potSeen','firm','lastYear','scouted'].forEach(k=>delete q[k]);
      S.market=S.market.filter(x=>x.id!==c.id);S.players.push(q);logMove(q,fee?'Transfert':'Joueur libre',c.club==='Libre'?'Sans club':c.club,S.club.name,-fee,'in');
      dlgLog(advWho('recruteur').name+' recrute '+pname(q)+' ('+POSN[pos].toLowerCase()+', '+q.ovr+')'+(fee?' pour '+money(fee):', libre')+'.');}}
}
A.dlg=function(k){const D=dlg();D[k]=!D[k];save();render();};
A.dlgBudget=function(v){dlg().budget=Math.max(0,Math.round(+v/100)*100);const el=document.getElementById('dlgBv');if(el)el.textContent=money(dlg().budget);save();};
function delegCard(){
  const D=dlg();
  return `<div class="card deleg"><header><h3>Délégations au staff</h3><span class="muted" style="font-size:12.5px">${DELEG.filter(x=>D[x.k]).length} tâche${DELEG.filter(x=>D[x.k]).length>1?'s':''} confiée${DELEG.filter(x=>D[x.k]).length>1?'s':''}</span></header>
   <p class="muted" style="margin:0;font-size:13px">Confiez une tâche à un membre du staff : il la fera tout seul, à chaque journée. Sa compétence (étoiles) décide de la qualité de ses choix. Sans le bon membre du staff, c’est un bénévole qui s’en charge, avec les moyens du bord.</p>
   ${DELEG.map(x=>{const w=advWho(x.role);return `<div class="dl-row ${D[x.k]?'on':''}"><div class="adv-who">${avatar(w.name,w.lvl)}<div><b>${x.n}</b><small>${esc(w.name)} · ${esc(w.title)}${w.lvl?' · '+'★'.repeat(w.lvl):''}</small><div class="muted" style="font-size:12.5px">${x.d}</div></div></div>
     <button class="btn sm ${D[x.k]?'pri':''}" onclick="A.dlg('${x.k}')" aria-pressed="${!!D[x.k]}">${D[x.k]?'Confié':'Confier'}</button></div>`;}).join('')}
   ${D.recruit?`<label class="fld" for="dlgB">Budget transferts du recruteur : <b id="dlgBv" class="gold">${money(D.budget||0)}</b></label><input type="range" id="dlgB" min="0" max="${Math.max(1000,Math.round(Math.max(0,S.cash)*.6/100)*100)}" step="${Math.max(100,Math.round(Math.max(0,S.cash)/200/100)*100)}" value="${D.budget||0}" oninput="A.dlgBudget(this.value)">`:''}
   ${D.log&&D.log.length?`<div class="dl-log"><b>Dernières décisions</b>${D.log.slice(0,6).map(l=>`<div><span class="muted">${l.w}</span> ${esc(l.t)}</div>`).join('')}</div>`:''}</div>`;
}
