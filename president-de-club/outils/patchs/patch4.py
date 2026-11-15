p='/home/claude/president/index.html'; s=open(p).read()
def rep(old,new,cnt=1):
    global s
    n=s.count(old); assert n==cnt,(n,old[:100]); s=s.replace(old,new)
def func(name,new):
    global s
    key='\nfunction '+name+'('
    i=s.index(key)+1; j=s.index('\n}\n',i)+3
    s=s[:i]+new.strip('\n')+'\n'+s[j:]
def cut(start,end_marker):
    """supprime du début de `start` jusqu'au début de `end_marker`"""
    global s
    i=s.index(start); j=s.index(end_marker,i); s=s[:i]+s[j:]

# ================= CSS
rep("thead th.on{color:var(--flood)}", r"""thead th.on{color:var(--flood)}
thead th[tabindex]{cursor:pointer;user-select:none}
thead th[tabindex]:hover{color:var(--chalk);background:#13211a}
thead th[tabindex]:not(.on)::after{content:'↕';margin-left:4px;opacity:.35;font-size:10px}
.wintl{display:grid;gap:6px}
.wintl .bar{display:flex;gap:2px;height:22px}
.wintl .bar i{flex:1;border-radius:2px;background:#1c2b22;position:relative}
.wintl .bar i.w{background:#5e4d14}
.wintl .bar i.w.now,.wintl .bar i.now{outline:2px solid var(--chalk);outline-offset:1px}
.wintl .bar i.past{opacity:.45}
.wintl .lab{display:flex;justify-content:space-between;font-size:11px;color:var(--muted);font-family:var(--mono)}
.mtabs{display:flex;gap:4px;flex-wrap:wrap}
.status{font-family:var(--display);font-weight:900;font-size:30px;line-height:1;text-transform:uppercase}
.rules{margin:0;padding-left:18px;display:grid;gap:3px;font-size:13.5px;color:#c9d4c9}
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:4px}
.steps div{padding:6px 8px;border-radius:4px;background:#0f1a14;border:1px solid var(--line);font-size:12px;color:var(--muted);text-align:center}
.steps div.on{border-color:var(--flood);color:var(--flood);font-weight:700}
.steps div.ok{border-color:#2d5a3f;color:var(--good)}
.chat{display:grid;gap:6px;max-height:220px;overflow:auto;padding:8px;background:#0b130f;border:1px solid var(--line);border-radius:6px}
.chat div{padding:7px 10px;border-radius:8px;font-size:13.5px;max-width:88%}
.chat .me{justify-self:end;background:#2a2610;border:1px solid #5e4d14}
.chat .club,.chat .agent{justify-self:start;background:#16251c;border:1px solid var(--line)}
.chat b{display:block;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:2px}
.star{background:none;border:0;cursor:pointer;font-size:17px;color:#4b6355;padding:0 4px;line-height:1}
.star.on{color:var(--flood)}
.fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px 16px}
""")

# ================= tri plus lisible
rep("""  rows.forEach(x=>body.appendChild(x.r));
}""", """  rows.forEach(x=>body.appendChild(x.r));
  if(ths[0]&&ths[0].textContent.replace(/[↕▲▼]/g,'').trim()==='#')[...body.rows].forEach((r,k)=>{if(r.cells[0])r.cells[0].textContent=k+1;});
}
function rowSig(tb){return tb.tBodies[0]?[...tb.tBodies[0].rows].map((r,k)=>{if(r.dataset.o==null)r.dataset.o=k;return r.dataset.o;}).join(','):'';}""")
rep("""        UI.sorts[key]=cur&&cur.col===i?{col:i,dir:-cur.dir}:{col:i,dir:firstNum?-1:1};sortTable(tb,key);};""",
    """        const before=rowSig(tb);UI.sorts[key]=cur&&cur.col===i?{col:i,dir:-cur.dir}:{col:i,dir:firstNum?-1:1};sortTable(tb,key);
        if(!(cur&&cur.col===i)&&rowSig(tb)===before){UI.sorts[key].dir*=-1;sortTable(tb,key);}};""")

# ================= génération du marché : personnalité, fin de contrat, fermeté
rep("    p.club=free?'Libre':(R()<.5?clubName(used):'Club de '+LV[d].n);",
    "    p.club=free?'Libre':(R()<.5?clubName(used):'Club de '+LV[d].n);\n    p.pers=pick(PERS);p.firm=+rf(.78,.93).toFixed(2);p.lastYear=!free&&R()<.28;")

# ================= nouveau système de négociation
cut("A.nego=function(id){", "A.scout=function(){")
rep("A.scout=function(){", r"""/* ---------- Mercato : négociations en deux temps ---------- */
function winInfo(){
  const h=Math.floor(S.N/2);
  const wins=[{n:'Mercato d’été',a:0,b:3},{n:'Mercato d’hiver',a:h-1,b:h+2}];
  return {wins,cur:wins.find(w=>S.week>=w.a&&S.week<=w.b)||null,next:wins.find(w=>S.week<w.a)||null,h};
}
const preOK=()=>S.week>=Math.floor(S.N/2)-1;
const dots=n=>'<span class="gold">'+'●'.repeat(clamp(n,0,3))+'</span><span class="muted">'+'○'.repeat(3-clamp(n,0,3))+'</span>';
function talk(p){
  S.talks=S.talks||{};let t=S.talks[p.id];
  if(!t){const it=interest(p);t=S.talks[p.id]={stage:p.fee?'club':'player',mode:'now',cp:3,pp:3,ask:p.fee,fee:0,wAsk:Math.round(p.demand*(it<.3?1.2:1)/10)*10,bAsk:Math.round(p.demand*rf(.5,3)/10)*10,log:[],closed:0};}
  return t;
}
function clubOffer(p,amt){
  const t=talk(p),L=x=>t.log.push(x);amt=Math.round(amt/100)*100;
  const min=Math.round(p.fee*(p.firm||.85)/100)*100;let res;
  L({who:'me',t:'Offre de '+money(amt)+' pour '+pname(p)+'.'});
  if(amt>=t.ask){t.fee=amt;t.stage='player';L({who:'club',t:'Offre acceptée. Vous pouvez maintenant discuter avec le joueur et son agent.'});res='ok';}
  else if(amt>=min){
    if(R()<.4){t.fee=amt;t.stage='player';L({who:'club',t:'Après réflexion, nous acceptons '+money(amt)+'.'});res='ok';}
    else{t.ask=Math.max(min,Math.round((amt+t.ask)/2/100)*100);t.cp--;L({who:'club',t:'Contre-proposition : '+money(t.ask)+'. Nous ne descendrons pas beaucoup plus bas.'});res='counter';}
  }else if(amt>=min*.8){t.cp--;L({who:'club',t:'Offre insuffisante. Notre prix reste '+money(t.ask)+'.'});res='no';}
  else{t.cp-=2;L({who:'club',t:'Offre jugée irrespectueuse. Ne nous faites pas perdre notre temps.'});res='insult';}
  if(t.stage==='club'&&t.cp<=0){t.closed=S.gw+3;t.cp=3;L({who:'club',t:'Le club rompt les discussions pendant trois journées.'});res='closed';}
  return res;
}
function startsAt(p){const xi=strength().xi;const a=xi.filter(e=>e.slot===p.pos&&!e.pen);return a.length?Math.min(...a.map(e=>e.p.ovr)):0;}
function playerScore(p,o){
  const t=talk(p),pers=p.pers||'Professionnel',bw=pers==='Mercenaire'?1.6:1;
  let r=(o.wage+o.bonus*bw/(o.years*12))/(t.wAsk+t.bAsk*bw/(o.years*12));
  r+={Titulaire:.06,Rotation:0,Remplaçant:-.08,Espoir:p.age<=21?.04:-.1}[o.role]*(pers==='Ambitieux'?2:1);
  if(o.role==='Titulaire'&&p.ovr<startsAt(p)-1)r-=.05;
  if(p.age>=30)r+=o.years>=2?.04:-.06;
  if(pers==='Casanier')r+=(o.years-2)*.03;
  if(pers==='Ambitieux')r+=(S.div-3)*.02;
  if(pers==='Loyal'||pers==='Professionnel')r+=.03;
  return r+(interest(p)-.6)*.25;
}
function playerOffer(p,o){
  const t=talk(p),L=x=>t.log.push(x),thr=p.pers==='Mercenaire'?1.02:1;
  L({who:'me',t:`${money(o.wage)}/mois sur ${o.years} an${o.years>1?'s':''}${o.bonus?', prime de '+money(o.bonus):''}, rôle promis : ${o.role.toLowerCase()}.`});
  const r=playerScore(p,o);let res;
  if(r>=thr){t.stage='done';t.deal=o;L({who:'agent',t:'Mon client accepte. Il ne reste qu’à officialiser la signature.'});res='ok';}
  else if(r>=thr-.15){t.pp--;t.wAsk=Math.max(Math.round((t.wAsk*.6+o.wage*.4)/10)*10,o.wage);if(o.bonus<t.bAsk)t.bAsk=Math.round((t.bAsk*.7+o.bonus*.3)/10)*10;L({who:'agent',t:`On se rapproche. Nous demandons ${money(t.wAsk)}/mois${t.bAsk?' et une prime de '+money(t.bAsk):''}.`});res='counter';}
  else{t.pp-=r<thr-.3?2:1;L({who:'agent',t:r<thr-.3?'Cette offre est très loin de nos attentes.':'Ce n’est pas suffisant pour convaincre mon client.'});res='no';}
  if(t.stage!=='done'&&t.pp<=0){t.closed=S.gw+3;t.pp=3;L({who:'agent',t:'Mon client préfère étudier d’autres pistes pour le moment.'});res='closed';}
  return res;
}
function agentFee(p,t){return Math.round(((t.mode==='pre'?0:t.fee||0)*.05+p.demand*(t.fee&&t.mode!=='pre'?.5:1.5))/100)*100;}
function finalize(p){
  const t=talk(p),o=t.deal;if(!o)return false;
  const pre=t.mode==='pre',fee=pre?0:(t.fee||0),af=agentFee(p,t),tot=fee+o.bonus+af;
  if(S.cash<tot){toast('Trésorerie insuffisante : il faut '+money(tot)+'.');return false;}
  if(!pre&&S.players.length>=30){toast('Effectif complet : 30 joueurs maximum.');return false;}
  if(!pre&&fee&&!windowOpen()){toast('Le mercato est fermé : le transfert attendra la prochaine fenêtre.');return false;}
  if(fee)fin('Transferts (achats)',-fee);if(o.bonus)fin('Primes à la signature',-o.bonus);fin('Commissions d’agents',-af);
  const q=Object.assign({},p,{wage:o.wage,contract:o.years,morale:72,fit:100,listed:false,youth:false,notes:[],promise:o.role,joinGw:S.gw,s:newS()});
  ['fee','demand','club','potSeen','firm','lastYear','scouted'].forEach(k=>delete q[k]);
  S.market=S.market.filter(x=>x.id!==p.id);delete S.talks[p.id];S.watch=(S.watch||[]).filter(i=>i!==p.id);
  const from=p.club==='Libre'?'Sans club':p.club;
  if(pre){S.pre=(S.pre||[]).concat([q]);logMove(q,'Pré-contrat',from,S.club.name,0,'in');news(pname(p)+' signe un pré-contrat : il rejoindra le club l’été prochain.','g');}
  else{S.players.push(q);logMove(q,fee?'Transfert':'Joueur libre',from,S.club.name,-fee,'in');news(pname(p)+' signe '+o.years+' an'+(o.years>1?'s':'')+(fee?' contre '+money(fee):'')+(o.bonus?' (prime '+money(o.bonus)+')':'')+'.','g');}
  return true;
}
A.nego=function(id){
  const p=S.market.find(x=>x.id===id);if(!p)return;
  const t=talk(p);
  if(t.closed>S.gw){toast('Discussions rompues : reprise possible dans '+(t.closed-S.gw)+' journée'+(t.closed-S.gw>1?'s':'')+'.');return;}
  if(interest(p)<.05){toast(pname(p)+' ne souhaite pas rejoindre un club de votre niveau.');return;}
  if(UI.negId!==id)UI.ng={fee:Math.round(t.ask*.9/100)*100,wage:t.wAsk,bonus:0,years:p.age>=30?2:3,role:p.ovr>=startsAt(p)?'Titulaire':'Rotation'};
  UI.negId=id;showNego();
};
function showNego(){
  const p=S.market.find(x=>x.id===UI.negId);if(!p){closeModal();return;}
  const t=talk(p),n=UI.ng,open=windowOpen(),wi=winInfo(),canPre=p.lastYear&&preOK()&&t.mode!=='pre';
  const freeDeal=!p.fee||t.mode==='pre';
  const st=t.stage,steps=freeDeal?[['player','Accord avec le joueur'],['done','Signature']]:[['club','Accord avec le club'],['player','Accord avec le joueur'],['done','Signature']];
  const idx=steps.findIndex(x=>x[0]===st);
  const sit=p.club==='Libre'?'Libre de tout contrat : signature possible toute l’année, sans indemnité.':p.lastYear?'Dernière année de contrat à '+esc(p.club)+(preOK()?' : un pré-contrat gratuit est possible pour la saison prochaine.':' : pré-contrat possible à partir de la J'+(wi.h-1)+'.'):'Sous contrat à '+esc(p.club)+' : une indemnité de transfert est nécessaire, uniquement pendant les fenêtres.';
  let form='';
  if(st==='club'){
    if(!open)form=`<div class="alert">Le mercato est fermé. Les transferts avec indemnité reprennent ${wi.next?'après la J'+wi.next.a+' ('+matchDate(Math.max(0,wi.next.a-1))+')':'l’été prochain'}.</div>${canPre?'<div class="row"><button class="btn pri" onclick="A.ngPre()">Proposer un pré-contrat</button></div>':''}`;
    else form=`<div class="spread"><span>Prix demandé par ${esc(p.club)} : <b class="gold">${money(t.ask)}</b>${p.scouted?' <span class="muted">· le recruteur estime qu’il peut descendre vers '+money(Math.round(p.fee*p.firm/100)*100)+'</span>':''}</span><span>Patience du club ${dots(t.cp)}</span></div>
      <label class="fld" for="ngF">Votre offre : <b id="ngFv" class="gold">${money(n.fee)}</b></label>
      <input type="range" id="ngF" min="${Math.round(p.fee*.4/100)*100}" max="${Math.round(p.fee*1.3/100)*100}" step="${Math.max(100,Math.round(p.fee/200/100)*100)}" value="${n.fee}" oninput="A.negUpd()">
      <div class="row"><button class="btn pri" onclick="A.ngClub()">Envoyer l’offre au club</button>${canPre?'<button class="btn" onclick="A.ngPre()">Proposer plutôt un pré-contrat</button>':''}</div>`;
  }else if(st==='player'){
    form=`<div class="spread"><span>L’agent demande <b class="gold">${money(t.wAsk)}</b>/mois${t.bAsk?' et une prime à la signature de <b class="gold">'+money(t.bAsk)+'</b>':''}.</span><span>Patience du joueur ${dots(t.pp)}</span></div>
     <div class="fields">
      <div><label class="fld" for="ngW">Salaire mensuel : <b id="ngWv" class="gold">${money(n.wage)}</b></label><input type="range" id="ngW" min="${Math.round(t.wAsk*.6/10)*10}" max="${Math.round(t.wAsk*1.8/10)*10}" step="${Math.max(10,Math.round(t.wAsk/100)*5)}" value="${n.wage}" oninput="A.negUpd()"></div>
      <div><label class="fld" for="ngB">Prime à la signature : <b id="ngBv" class="gold">${money(n.bonus)}</b></label><input type="range" id="ngB" min="0" max="${Math.max(t.bAsk*2,p.demand*6)}" step="${Math.max(10,Math.round(p.demand/20)*10)}" value="${n.bonus}" oninput="A.negUpd()"></div>
      <label class="fld" for="ngY">Durée du contrat<select id="ngY" onchange="A.negUpd()">${[1,2,3,4,5].map(y=>`<option value="${y}" ${y===n.years?'selected':''}>${y} an${y>1?'s':''}</option>`).join('')}</select></label>
      <label class="fld" for="ngR">Rôle promis<select id="ngR" onchange="A.negUpd()">${['Titulaire','Rotation','Remplaçant'].concat(p.age<=21?['Espoir']:[]).map(r=>`<option ${r===n.role?'selected':''}>${r}</option>`).join('')}</select></label>
     </div>
     <div id="ngSum" class="muted" style="font-size:13px"></div>
     <div class="row"><button class="btn pri" onclick="A.ngPlayer()">Faire la proposition</button></div>`;
  }else{
    const o=t.deal,af=agentFee(p,t),fee=t.mode==='pre'?0:t.fee;
    form=`<div class="kpis"><div class="kpi"><div class="l">Indemnité</div><div class="v">${money(fee)}</div></div><div class="kpi"><div class="l">Prime</div><div class="v">${money(o.bonus)}</div></div><div class="kpi"><div class="l">Commission d’agent</div><div class="v">${money(af)}</div></div><div class="kpi"><div class="l">Total à payer</div><div class="v gold">${money(fee+o.bonus+af)}</div></div></div>
     <p style="margin:0">Salaire : <b>${money(o.wage)}</b>/mois sur ${o.years} an${o.years>1?'s':''} · rôle promis : <b>${o.role.toLowerCase()}</b>${t.mode==='pre'?' · <b>arrivée l’été prochain</b>':''}. Une promesse de titularisation non tenue fera chuter son moral.</p>
     <div class="row"><button class="btn pri" onclick="A.ngSign()">Officialiser la signature</button></div>`;
  }
  openModal(`<div class="kicker">Négociation${t.mode==='pre'?' · pré-contrat':''} · ${esc(p.club)}</div>
  <div class="spread"><h2>${esc(pname(p))}</h2><span class="ovr" style="font-size:34px;color:var(--flood)">${p.ovr}</span></div>
  <p style="margin:0">${POSN[p.pos]}, ${p.age} ans · potentiel ${potTxt(p)} · personnalité : <b>${p.scouted?p.pers:'inconnue'}</b>${p.scouted?' <span class="muted">('+PERS_D[p.pers]+')</span>':' <span class="muted">(faites-le superviser pour la connaître)</span>'}</p>
  <p class="muted" style="margin:0;font-size:13px">${sit} Intérêt pour votre club : ${Math.round(interest(p)*100)} %.</p>
  <div class="steps">${steps.map((x,k)=>`<div class="${k<idx?'ok':k===idx?'on':''}">${k+1}. ${x[1]}</div>`).join('')}</div>
  ${t.log.length?`<div class="chat" id="ngChat">${t.log.map(m=>`<div class="${m.who}"><b>${m.who==='me'?'Vous':m.who==='club'?esc(p.club):'Agent du joueur'}</b>${esc(m.t)}</div>`).join('')}</div>`:''}
  ${form}
  <div class="row"><button class="btn" onclick="A.close()">Fermer (la discussion reste ouverte)</button></div>`,true);
  const c=document.getElementById('ngChat');if(c)c.scrollTop=c.scrollHeight;
  A.negUpd();
}
A.negUpd=function(){
  const p=S.market.find(x=>x.id===UI.negId);if(!p)return;const n=UI.ng,g=id=>document.getElementById(id);
  if(g('ngF')){n.fee=+g('ngF').value;g('ngFv').textContent=money(n.fee);}
  if(g('ngW')){n.wage=+g('ngW').value;n.bonus=+g('ngB').value;n.years=+g('ngY').value;n.role=g('ngR').value;g('ngWv').textContent=money(n.wage);g('ngBv').textContent=money(n.bonus);
    const t=talk(p),r=playerScore(p,n),thr=p.pers==='Mercenaire'?1.02:1,af=agentFee(p,t),fee=t.mode==='pre'?0:t.fee;
    const lab=r>=thr?'<span class="pill g">Il devrait accepter</span>':r>=thr-.15?'<span class="pill y">Proche d’un accord</span>':'<span class="pill b">Trop loin de ses attentes</span>';
    g('ngSum').innerHTML=`Réaction probable : ${lab} · Coût immédiat ${money(fee+n.bonus+af)} (dont commission ${money(af)}) · Masse salariale ${money(wageBill())} → ${money(wageBill()+n.wage)}/mois${n.role==='Titulaire'&&p.ovr<startsAt(p)-1?' · <span class="warn">il ne serait pas titulaire aujourd’hui</span>':''}`;}
};
A.ngClub=function(){const p=S.market.find(x=>x.id===UI.negId);if(!p)return;if(!windowOpen()){toast('Mercato fermé.');return;}const r=clubOffer(p,UI.ng.fee);if(r==='ok'){const t=talk(p);UI.ng.wage=t.wAsk;}save();if(r==='closed'){closeModal();toast('Le club a rompu les discussions.');return;}showNego();};
A.ngPre=function(){const p=S.market.find(x=>x.id===UI.negId);if(!p)return;const t=talk(p);t.mode='pre';t.stage='player';t.log.push({who:'me',t:'Nous proposons un pré-contrat : arrivée libre l’été prochain.'});t.log.push({who:'agent',t:'Mon client est ouvert à l’idée. Parlons de son contrat.'});save();showNego();};
A.ngPlayer=function(){const p=S.market.find(x=>x.id===UI.negId);if(!p)return;const r=playerOffer(p,UI.ng);save();if(r==='closed'){closeModal();toast(pname(p)+' met fin aux discussions.');return;}if(r==='counter'){const t=talk(p);UI.ng.wage=Math.min(t.wAsk,Math.round(t.wAsk*1.8));}showNego();};
A.ngSign=function(){const p=S.market.find(x=>x.id===UI.negId);if(!p)return;if(finalize(p)){UI.negId=null;save();closeModal();toast(pname(p)+' a signé !');}};
A.watch=function(id){S.watch=S.watch||[];const i=S.watch.indexOf(id);if(i>=0)S.watch.splice(i,1);else S.watch.push(id);save();render();};
const SCOUT_COST=[150,400,1200,3000,8000,20000,40000];
A.scoutP=function(id){
  const p=S.market.find(x=>x.id===id);if(!p)return;const rec=slvl('recruteur');S.scouting=S.scouting||{};
  if(!rec){toast('Embauchez un recruteur (onglet Staff) pour superviser des joueurs.');return;}
  if(S.scouting[id]){toast('Supervision déjà en cours.');return;}
  if(Object.keys(S.scouting).length>=rec){toast('Votre recruteur ne peut suivre que '+rec+' joueur'+(rec>1?'s':'')+' à la fois.');return;}
  const c=SCOUT_COST[S.div];if(S.cash<c){toast('Trésorerie insuffisante.');return;}
  fin('Supervisions',-c);S.scouting[id]=S.gw+(rec>=3?1:2);if(!(S.watch||[]).includes(id))(S.watch=S.watch||[]).push(id);
  toast('Supervision lancée : rapport dans '+(rec>=3?1:2)+' journée'+(rec>=3?'':'s')+'.');save();render();
};
function genOffers(){
  S.offers=(S.offers||[]).filter(o=>o.exp>=S.gw&&getP(o.pid));
  if(!windowOpen()){S.offers=[];return;}
  const top=topPlayers(3).map(p=>p.id);
  S.players.forEach(p=>{
    if(S.offers.some(o=>o.pid===p.id))return;
    const v=valueFor(p)*(S.div<=2?.3:1);
    if(p.listed){p.askP=p.askP||Math.round(v/100)*100;
      if(R()<.4){const fee=Math.round(Math.min(p.askP,v*1.3)*rf(.6,1)/100)*100;S.offers.push({id:S.uid++,pid:p.id,club:clubName(new Set()),fee,max:Math.round(Math.max(fee,Math.min(p.askP*1.08,v*rf(.95,1.35)))/100)*100,exp:S.gw+2});news('Offre de '+money(fee)+' reçue pour '+pname(p)+'.');}}
    else if(top.includes(p.id)&&S.div<6&&R()<.04){const fee=Math.round(v*rf(1,1.5)/100)*100;S.offers.push({id:S.uid++,pid:p.id,club:clubName(new Set())+' ('+LV[clamp(S.div+ri(1,2),0,6)].n+')',fee,max:Math.round(fee*rf(1.05,1.25)/100)*100,exp:S.gw+2,spont:true});news('Un club de l’échelon supérieur s’intéresse à '+pname(p)+' : '+money(fee)+' sur la table.');}
  });
}
A.acceptOffer=function(oid){const o=(S.offers||[]).find(x=>x.id===oid);const p=o&&getP(o.pid);if(!p)return;sellPlayer(p,o.fee,o.club);S.offers=S.offers.filter(x=>x.pid!==p.id);toast(pname(p)+' est vendu '+money(o.fee)+'.');save();closeModal();};
A.rejectOffer=function(oid){S.offers=(S.offers||[]).filter(x=>x.id!==oid);save();render();};
A.counter=function(oid){
  const o=S.offers.find(x=>x.id===oid),p=o&&getP(o.pid);if(!p)return;UI.cnt=Math.round(Math.max(o.fee*1.2,p.askP||0)/100)*100;
  openModal(`<div class="kicker">Vente · ${esc(o.club)}</div><h2>Contre-proposition</h2><p>${esc(o.club)} offre <b>${money(o.fee)}</b> pour ${esc(pname(p))} (valeur estimée ${money(valueFor(p)*(S.div<=2?.3:1))}${p.askP?', votre prix : '+money(p.askP):''}).${o.last?' <b class="warn">C’est leur dernière offre.</b>':''}</p>
  <label class="fld" for="cnt">Votre prix : <b id="cntv" class="gold">${money(UI.cnt)}</b></label><input type="range" id="cnt" min="${o.fee}" max="${Math.round(o.fee*2/100)*100}" step="${Math.max(100,Math.round(o.fee/100/100)*100)}" value="${UI.cnt}" oninput="UI.cnt=+this.value;document.getElementById('cntv').textContent=money(UI.cnt)">
  <p class="muted" style="font-size:13px;margin:0">Trop gourmand, l’acheteur peut se retirer.</p>
  <div class="row"><button class="btn pri" onclick="A.doCounter(${oid})">Envoyer</button><button class="btn" onclick="A.close()">Annuler</button></div>`);
};
A.doCounter=function(oid){
  const o=S.offers.find(x=>x.id===oid),p=o&&getP(o.pid);if(!p)return;const a=UI.cnt;
  if(a<=o.max){sellPlayer(p,a,o.club);S.offers=S.offers.filter(x=>x.pid!==p.id);toast('Accord : '+pname(p)+' vendu '+money(a)+'.');}
  else if(!o.last&&a<=o.max*1.15){o.fee=o.max;o.last=true;toast(o.club+' monte à '+money(o.max)+' : dernière offre.');}
  else{S.offers=S.offers.filter(x=>x.id!==oid);toast(o.club+' se retire des discussions.');news(o.club+' retire son offre pour '+pname(p)+'.','b');}
  save();closeModal();
};
A.ask=function(id,f){const p=getP(id);if(!p)return;const v=valueFor(p)*(S.div<=2?.3:1);p.askP=Math.max(100,Math.round((p.askP||v)*f/100)*100);save();render();};
A.mtab=function(t){UI.mtab=t;render();};
A.mopt=function(k){UI.mo=UI.mo||{};UI.mo[k]=!UI.mo[k];render();};
A.scout=function(){""")

# ================= événements de vente : passent par la liste d'offres
rep("""  if(windowOpen()){
    S.players.filter(p=>p.listed).forEach(p=>{if(R()<.35)UI.queue.push({type:'event',id:'offre',d:{pid:p.id,fee:Math.round(valueFor(p)*rf(.6,1.15)*(S.div<=2?.3:1)/100)*100,club:clubName(new Set())}});});
  }""", r"""  genOffers();
  // supervisions terminées
  S.scouting=S.scouting||{};
  Object.entries(S.scouting).forEach(([id,g])=>{if(S.gw>=g){const p=S.market.find(x=>x.id===+id);if(p){p.scouted=true;p.potSeen=[p.pot,p.pot];news('Rapport du recruteur sur '+pname(p)+' : potentiel '+p.pot+', personnalité « '+p.pers.toLowerCase()+' »'+(p.fee?', le club pourrait céder autour de '+money(Math.round(p.fee*p.firm/100)*100):'')+'.','g');}delete S.scouting[id];}});
  // joueurs suivis qui signent ailleurs
  (S.watch||[]).slice().forEach(id=>{const p=S.market.find(x=>x.id===id);if(!p){S.watch=S.watch.filter(i=>i!==id);return;}if(!(S.talks||{})[id]&&!S.scouting[id]&&R()<.04){S.market=S.market.filter(x=>x.id!==id);S.watch=S.watch.filter(i=>i!==id);news(pname(p)+', que vous suiviez, signe dans un autre club.','b');}});
  // promesses de temps de jeu
  S.players.forEach(p=>{if(p.promise==='Titulaire'&&p.joinGw!=null&&S.gw-p.joinGw>=6&&S.gw-p.joinGw<=S.N){const r=(p.s.mj+p.s.cmj)/Math.max(1,S.gw-p.joinGw);if(r<.5){p.morale=clamp(p.morale-2,5,100);if(!p.promiseWarn){p.promiseWarn=true;news(pname(p)+' rappelle qu’on lui avait promis une place de titulaire.','b');}}}});""")

# churn : protéger suivis, négociations, supervisions
rep("  for(let k=0;k<5&&S.market.length;k++)S.market.splice(ri(0,S.market.length-1),1);",
    "  {const keep=id=>(S.watch||[]).includes(id)||(S.talks||{})[id]||(S.scouting||{})[id];for(let k=0;k<5;k++){const c=S.market.filter(p=>!keep(p.id));if(!c.length)break;const x=pick(c);S.market=S.market.filter(p=>p!==x);}\n   Object.keys(S.talks||{}).forEach(id=>{if(!S.market.some(p=>p.id===+id))delete S.talks[id];});}")
rep("A.scout=function(){if(S.flags.scoutGw===S.gw){toast('Le recruteur a déjà parcouru le marché cette semaine.');return;}S.flags.scoutGw=S.gw;S.market=genMarket(28);S.tried={};",
    "A.scout=function(){if(S.flags.scoutGw===S.gw){toast('Le recruteur a déjà parcouru le marché cette semaine.');return;}S.flags.scoutGw=S.gw;{const keep=p=>(S.watch||[]).includes(p.id)||(S.talks||{})[p.id]||(S.scouting||{})[p.id];const k=S.market.filter(keep);S.market=k.concat(genMarket(Math.max(10,28-k.length)));}S.tried={};")
rep("offreTop:{w:2,", "offreTop:{w:1,")

# pré-contrats à l'intersaison
rep("  if(leaving.length)msgs.push('Départs : '+leaving.join(', ')+'.');",
    "  if(leaving.length)msgs.push('Départs : '+leaving.join(', ')+'.');\n  if(S.pre&&S.pre.length){S.pre.forEach(q=>{q.age++;q.joinGw=S.gw;S.players.push(q);});msgs.push('Arrivées en pré-contrat : '+S.pre.map(pname).join(', ')+'.');S.pre=[];}\n  S.talks={};S.offers=[];S.scouting={};")

# point rouge de l'onglet
rep("mercato:windowOpen()};", "mercato:windowOpen()||(S.offers||[]).length>0};")

# ================= vue Mercato
func('vMercato', r"""
function vMercato(){
  const open=windowOpen(),wi=winInfo(),f=UI.mfilter||'all',mo=UI.mo||{},mt=UI.mtab||'marche';
  const xi=strength().xi;const worst=pos=>{const a=xi.filter(e=>e.slot===pos&&!e.pen);return a.length?Math.min(...a.map(e=>e.p.ovr)):0;};
  const w=wi.cur||wi.next;
  const status=wi.cur?`<div class="status good">Ouvert</div><div>${wi.cur.n} · dernier délai avant la <b>J${wi.cur.b+1}</b> (${matchDate(wi.cur.b)}) · ${wi.cur.b-S.week+1} journée${wi.cur.b-S.week+1>1?'s':''} restante${wi.cur.b-S.week+1>1?'s':''}</div>`
    :`<div class="status bad">Fermé</div><div>${wi.next?wi.next.n+' : ouverture après la <b>J'+wi.next.a+'</b> ('+matchDate(Math.max(0,wi.next.a-1))+')':'Prochaine ouverture : intersaison (été)'}</div>`;
  const cells=[];for(let k=0;k<=S.N;k++){const inW=wi.wins.some(x=>k>=x.a&&k<=x.b);cells.push(`<i class="${inW?'w':''} ${k===S.week?'now':''} ${k<S.week?'past':''}" title="${k===0?'Pré-saison':'Après J'+k}"></i>`);}
  const offers=(S.offers||[]).filter(o=>getP(o.pid)),talks=Object.entries(S.talks||{}).filter(([id])=>S.market.some(p=>p.id===+id)),watch=S.market.filter(p=>(S.watch||[]).includes(p.id));
  const rec=slvl('recruteur'),busy=Object.keys(S.scouting||{}).length;
  const pr=projection();
  let body='';
  const table=list=>`<div class="tbl-wrap"><table><thead><tr><th></th><th>Poste</th><th>Joueur</th><th class="r">Âge</th><th class="r">Note</th><th class="r">Pot.</th><th>Situation</th><th class="r">Indemnité</th><th class="r">Salaire demandé</th><th>Apport</th><th>Intérêt</th><th></th></tr></thead><tbody>
  ${list.map(p=>{const it=interest(p),wv=worst(p.pos),t=(S.talks||{})[p.id],sc=(S.scouting||{})[p.id],closed=t&&t.closed>S.gw,needWin=p.fee&&!open&&!(p.lastYear&&preOK());
   const situ=p.club==='Libre'?'<span class="pill g">Libre</span>':p.lastYear?'<span class="pill y">Fin de contrat</span> <span class="muted">'+esc(p.club)+'</span>':'<span class="muted">'+esc(p.club)+'</span>';
   return `<tr><td><button class="star ${(S.watch||[]).includes(p.id)?'on':''}" onclick="A.watch(${p.id})" aria-label="Suivre">★</button></td><td><span class="pos ${p.pos}">${p.pos}</span></td><td>${esc(pname(p))}${p.scouted?' <span class="pill g" title="Rapport du recruteur disponible">supervisé</span>':''}</td><td class="r">${p.age}</td><td class="r"><span class="ovr">${p.ovr}</span></td><td class="r">${potTxt(p)}</td><td>${situ}</td><td class="r" data-v="${p.fee}">${p.fee?money(p.fee):'<span class="good">—</span>'}</td><td class="r" data-v="${p.demand}">${money(p.demand)}</td><td data-v="${p.ovr-wv}">${p.ovr>wv?'<span class="pill g">Titulaire +'+(p.ovr-wv)+'</span>':'<span class="muted">Remplaçant</span>'}</td><td data-v="${it}">${it>=.8?'<span class="pill g">Élevé</span>':it>=.5?'<span class="pill y">Correct</span>':it>=.2?'<span class="pill w">Réservé</span>':it>=.05?'<span class="pill b">Très faible</span>':'<span class="pill b">Aucun</span>'}</td>
   <td><div class="row" style="flex-wrap:nowrap"><button class="btn sm ${t?'':'pri'}" onclick="A.nego(${p.id})" ${closed||needWin||it<.05?'disabled':''}>${closed?'Rompu':t?'Reprendre':'Négocier'}</button><button class="btn sm" onclick="A.scoutP(${p.id})" ${p.scouted||sc?'disabled':''}>${sc?'En cours':p.scouted?'Rapport ✓':'Superviser'}</button></div></td></tr>`;}).join('')||'<tr><td colspan="12" class="muted">Aucun joueur ne correspond.</td></tr>'}
  </tbody></table></div>`;
  if(mt==='marche'||mt==='suivi'){
    let list=mt==='suivi'?watch:S.market.filter(p=>f==='all'||(f==='free'?!p.fee:f==='pre'?p.lastYear:p.pos===f));
    if(mo.budget)list=list.filter(p=>(p.fee||0)<=Math.max(0,S.cash)&&p.demand*12<=Math.max(0,pr)+wageBill()*0);
    if(mo.young)list=list.filter(p=>p.age<=23);
    if(mo.starter)list=list.filter(p=>p.ovr>worst(p.pos));
    list=list.slice().sort((a,b)=>b.ovr-a.ovr);
    body=`${mt==='marche'?`<div class="spread"><div class="row">${[['all','Tous'],['free','Libres'],['pre','Fin de contrat'],['G','Gardiens'],['D','Défenseurs'],['M','Milieux'],['A','Attaquants']].map(([k,n])=>`<button class="btn sm ${f===k?'pri':''}" onclick="A.mfilter('${k}')">${n}</button>`).join('')}</div>
      <div class="row">${[['budget','Dans mes moyens'],['young','23 ans et moins'],['starter','Titulaires potentiels']].map(([k,n])=>`<button class="btn sm ${mo[k]?'pri':''}" onclick="A.mopt('${k}')">${n}</button>`).join('')}<button class="btn sm" onclick="A.scout()">Nouvelle prospection</button></div></div>`:'<p class="muted" style="margin:0;font-size:13px">Les joueurs suivis restent sur le marché, mais peuvent signer ailleurs si vous tardez.</p>'}
      ${table(list)}`;
  }else if(mt==='nego'){
    body=talks.length?`<div class="tbl-wrap"><table><thead><tr><th>Joueur</th><th>Étape</th><th>Dernier message</th><th>Patience</th><th></th></tr></thead><tbody>${talks.map(([id,t])=>{const p=S.market.find(x=>x.id===+id);const last=t.log[t.log.length-1];return `<tr><td><span class="pos ${p.pos}">${p.pos}</span> ${esc(pname(p))} <span class="muted">${p.ovr}</span></td><td>${{club:'<span class="pill y">Accord club</span>',player:'<span class="pill y">Accord joueur</span>',done:'<span class="pill g">À signer</span>'}[t.stage]}${t.mode==='pre'?' <span class="pill">pré-contrat</span>':''}</td><td class="muted" style="white-space:normal;max-width:380px">${last?esc(last.t):'—'}</td><td>${t.closed>S.gw?'<span class="bad">rompu</span>':dots(t.stage==='club'?t.cp:t.pp)}</td><td><button class="btn sm pri" onclick="A.nego(${id})" ${t.closed>S.gw?'disabled':''}>Reprendre</button></td></tr>`;}).join('')}</tbody></table></div>`:'<p class="muted">Aucune négociation en cours. Ouvrez-en une depuis le marché.</p>';
    if((S.pre||[]).length)body+=`<div class="alert g">Pré-contrats signés (arrivée l’été prochain) : ${S.pre.map(q=>esc(pname(q))+' ('+q.pos+', '+q.ovr+')').join(', ')}.</div>`;
  }else if(mt==='ventes'){
    const listed=S.players.filter(p=>p.listed);
    body=`<h3 style="font-size:17px">Offres reçues</h3>${offers.length?`<div class="tbl-wrap"><table><thead><tr><th>Joueur</th><th>Club acheteur</th><th class="r">Offre</th><th class="r">Valeur</th><th>Expire</th><th></th></tr></thead><tbody>${offers.map(o=>{const p=getP(o.pid);return `<tr><td><span class="pos ${p.pos}">${p.pos}</span> ${esc(pname(p))} <span class="muted">${p.ovr}</span>${o.spont?' <span class="pill y">non listé</span>':''}</td><td>${esc(o.club)}</td><td class="r"><b class="gold">${money(o.fee)}</b>${o.last?' <span class="warn">dernière</span>':''}</td><td class="r muted">${money(valueFor(p)*(S.div<=2?.3:1))}</td><td class="muted">${o.exp-S.gw<=0?'cette journée':'dans '+(o.exp-S.gw+1)+' journées'}</td><td><div class="row" style="flex-wrap:nowrap"><button class="btn sm pri" onclick="A.acceptOffer(${o.id})">Accepter</button><button class="btn sm" onclick="A.counter(${o.id})">Contre-offre</button><button class="btn sm dan" onclick="A.rejectOffer(${o.id})">Refuser</button></div></td></tr>`;}).join('')}</tbody></table></div>`:`<p class="muted" style="margin:0">${open?'Aucune offre pour le moment. Les clubs se manifestent chaque journée pour les joueurs mis en vente.':'Les offres n’arrivent que pendant les fenêtres de mercato.'}</p>`}
    <h3 style="font-size:17px">Joueurs en vente</h3>${listed.length?`<div class="tbl-wrap"><table><thead><tr><th>Joueur</th><th class="r">Âge</th><th class="r">Note</th><th class="r">Valeur estimée</th><th class="r">Votre prix</th><th></th></tr></thead><tbody>${listed.map(p=>{const v=valueFor(p)*(S.div<=2?.3:1);p.askP=p.askP||Math.round(v/100)*100;return `<tr><td><span class="pos ${p.pos}">${p.pos}</span> ${esc(pname(p))}</td><td class="r">${p.age}</td><td class="r"><span class="ovr">${p.ovr}</span></td><td class="r muted">${money(v)}</td><td class="r"><b>${money(p.askP)}</b></td><td><div class="row" style="flex-wrap:nowrap"><button class="btn sm" onclick="A.ask(${p.id},.9)">−10 %</button><button class="btn sm" onclick="A.ask(${p.id},1.1)">+10 %</button><button class="btn sm" onclick="A.list(${p.id})">Retirer</button></div></td></tr>`;}).join('')}</tbody></table></div>`:'<p class="muted" style="margin:0">Aucun joueur en vente. Mettez un joueur en vente depuis sa fiche (onglet Effectif).</p>'}
    <p class="muted" style="font-size:13px;margin:0">Un prix élevé attire moins d’offres et des acheteurs plus prudents. Une contre-offre trop gourmande peut faire fuir l’acheteur.</p>`;
  }else body=transferHistory();
  return `<div class="card ${open?'hl':''}"><div class="grid g2" style="align-items:center">
    <div style="display:grid;gap:6px">${status}</div>
    <div class="wintl"><div class="bar">${cells.join('')}</div><div class="lab"><span>Pré-saison</span><span>J${wi.h}</span><span>J${S.N}</span></div><div class="legend"><span><i style="background:#5e4d14"></i>Fenêtres de transferts</span><span><i style="background:#1c2b22;outline:2px solid #e9efe5"></i>Aujourd’hui</span></div></div></div>
    <ul class="rules"><li><b>Pendant les fenêtres</b> (J0 à J3 et J${wi.h-1} à J${wi.h+2}) : achats avec indemnité et ventes.</li><li><b>Toute l’année</b> : joueurs libres, sans indemnité.</li><li><b>À partir de la J${wi.h-1}</b> : pré-contrats gratuits avec les joueurs en fin de contrat, qui arrivent l’été suivant.</li><li><b>Négociation</b> : d’abord l’indemnité avec le club, puis salaire, prime, durée et rôle avec l’agent. Chaque partie a une patience limitée.</li></ul>
    <div class="kpis"><div class="kpi"><div class="l">Trésorerie</div><div class="v ${S.cash<0?'bad':''}">${money(S.cash)}</div></div><div class="kpi"><div class="l">Projection fin de saison</div><div class="v ${pr<0?'bad':''}">${money(pr)}</div></div><div class="kpi"><div class="l">Masse salariale</div><div class="v" style="font-size:20px">${money(wageBill())}<span class="muted" style="font-size:12px">/mois</span></div></div><div class="kpi"><div class="l">Effectif</div><div class="v">${S.players.length}<span class="muted" style="font-size:15px">/30</span></div></div><div class="kpi"><div class="l">Supervisions</div><div class="v">${rec?busy+'<span class="muted" style="font-size:15px">/'+rec+'</span>':'<span class="muted" style="font-size:15px">pas de recruteur</span>'}</div></div></div>
  </div>
  <div class="card"><div class="mtabs">${[['marche','Marché ('+S.market.length+')'],['suivi','Liste de suivi ('+watch.length+')'],['nego','Négociations ('+talks.length+')'],['ventes','Ventes'+(offers.length?' · '+offers.length+' offre'+(offers.length>1?'s':''):'')],['histo','Historique']].map(([k,n])=>`<button class="btn ${mt===k?'pri':''}" onclick="A.mtab('${k}')">${n}</button>`).join('')}</div>
  ${body}</div>`;
}""")

# ================= sauvegardes existantes
rep("  S.transfers=S.transfers||[];S.rec=S.rec||{};", "  S.transfers=S.transfers||[];S.rec=S.rec||{};S.watch=S.watch||[];S.talks=S.talks||{};S.offers=S.offers||[];S.pre=S.pre||[];S.scouting=S.scouting||{};\n  (S.market||[]).forEach(p=>{if(!p.pers)p.pers=pick(PERS);if(p.firm==null)p.firm=.85;});")

# constantes personnalité (avant genMarket)
rep("/* ---------- Mercato ---------- */", """/* ---------- Mercato ---------- */
const PERS=['Ambitieux','Loyal','Mercenaire','Professionnel','Casanier'];
const PERS_D={Ambitieux:'veut jouer et viser plus haut, sensible à la promesse de temps de jeu',Loyal:'attaché à ses clubs, peu de surenchère',Mercenaire:'l’argent avant tout, adore les primes',Professionnel:'rationnel, accepte une offre juste',Casanier:'préfère un projet stable et un contrat long'};""")
open(p,'w').write(s); print('ok')
