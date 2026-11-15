import re
p='/home/claude/president/index.html'; s=open(p).read()
def rep(old,new,cnt=1):
    global s
    n=s.count(old); assert n==cnt,(n,old[:100]); s=s.replace(old,new)

# ---------- A. plafonds de budget des clubs acheteurs
rep("function genOffers(){", "const BUYCAP=[60e3,200e3,800e3,2.5e6,6e6,25e6,80e6];\nconst capFee=(f,d)=>Math.round(Math.min(f,BUYCAP[clamp(d,0,6)]*rf(.75,1))/100)*100;\nfunction genOffers(){")
rep("      if(R()<.4){const fee=Math.round(Math.min(p.askP,v*1.3)*rf(.6,1)/100)*100;S.offers.push({id:S.uid++,pid:p.id,club:clubName(new Set()),fee,max:Math.round(Math.max(fee,Math.min(p.askP*1.08,v*rf(.95,1.35)))/100)*100,exp:S.gw+2});",
    "      if(R()<.4){const bd=clamp(S.div+ri(-1,1),0,6);const fee=capFee(Math.round(Math.min(p.askP,v*1.3)*rf(.6,1)/100)*100,bd);S.offers.push({id:S.uid++,pid:p.id,club:clubName(new Set()),fee,max:Math.max(fee,Math.min(Math.round(Math.max(fee,Math.min(p.askP*1.08,v*rf(.95,1.35)))/100)*100,BUYCAP[bd])),exp:S.gw+2});")
rep("    else if(top.includes(p.id)&&S.div<6&&R()<.04){const fee=Math.round(v*rf(1,1.5)/100)*100;",
    "    else if(top.includes(p.id)&&S.div<6&&R()<.04){const fee=capFee(Math.round(v*rf(1,1.5)/100)*100,S.div+2);")
rep("return p?{pid:p.id,fee:Math.round(valueFor(p)*rf(1,1.6)*(S.div<=2?.4:1)/100)*100,","return p?{pid:p.id,fee:capFee(Math.round(valueFor(p)*rf(1,1.6)*(S.div<=2?.4:1)/100)*100,S.div+2),")

# ---------- B. période de grâce des premières saisons
rep("  let dc=objOk?16:{montee:-14,milieu:-12,maintien:-20}[S.objective];",
    "  let dc=objOk?16:{montee:-14,milieu:-12,maintien:-20}[S.objective];\n  if(S.history.length<2&&dc<0)dc=Math.round(dc/2);")

# ---------- C. prêts de joueurs
rep("const wageBill=()=>S.players.reduce((s,p)=>s+p.wage,0);",
    "const wageBill=()=>S.players.reduce((s,p)=>s+(p.loan?p.wage*(1-p.loan.share):p.wage),0);\nconst squadN=()=>S.players.filter(p=>!p.loan).length;")
s=s.replace("if(S.players.length>=30)return","if(squadN()>=30)return")
rep("  for(let k=0;k<nY&&S.players.length<30;k++){","  for(let k=0;k<nY&&squadN()<30;k++){")
rep("  if(!pre&&S.players.length>=30){toast(","  if(!pre&&squadN()>=30){toast(")
rep("  let av=S.players.filter(p=>!p.inj&&!p.susp);","  let av=S.players.filter(p=>!p.inj&&!p.susp&&!p.loan);")
rep("  const bench=S.players.filter(p=>!inXI.has(p.id)&&!p.inj&&!p.susp)","  const bench=S.players.filter(p=>!inXI.has(p.id)&&!p.inj&&!p.susp&&!p.loan)")
rep("  const out=S.players.filter(p=>p.inj||p.susp);","  const out=S.players.filter(p=>p.inj||p.susp||p.loan);")
# indisponibles : afficher le prêt
s=s.replace("<span class=\"bad\">${p.inj?p.inj+' sem.':'suspendu'}</span>","<span class=\"${p.loan?'muted':'bad'}\">${p.loan?'prêté':p.inj?p.inj+' sem.':'suspendu'}</span>")
# progression : un joueur prêté joue
rep("    const played=p.lastPlayed!=null&&S.gw-p.lastPlayed<=2;",
    """    if(p.loan){const L2=p.loan;if(R()<L2.play){L2.mj++;const gr={A:.32,M:.12,D:.04,G:0}[p.pos],ar={A:.12,M:.16,D:.06,G:0}[p.pos];if(R()<gr)L2.g++;if(R()<ar)L2.a++;L2.ns+=clamp(6+rf(-1,1.2)+(p.ovr-(LV[L2.div].str[0]+LV[L2.div].str[1])/2)/12,3,9);L2.nn++;p.lastPlayed=S.gw;p.morale=clamp(p.morale+1,0,100);}}
    const played=p.lastPlayed!=null&&S.gw-p.lastPlayed<=2;""")
# fin de saison : ligne d'historique du prêt et retour
rep("  S.players.forEach(p=>{const s=p.s||newS();p.hist.push({y:seasonLabel(S.year),club:S.club.name,",
    "  S.players.forEach(p=>{const s=p.s||newS();if(p.loan){const l=p.loan;p.hist.push({y:seasonLabel(S.year),club:l.club+' (prêt)',div:LV[l.div].n,mj:l.mj,g:l.g,a:l.a,note:l.nn?+(l.ns/l.nn).toFixed(2):0});news(pname(p)+' revient de prêt ('+esc(l.club)+') : '+l.mj+' matchs, '+l.g+' but'+(l.g>1?'s':'')+'.','g');p.loan=null;return;}p.hist.push({y:seasonLabel(S.year),club:S.club.name,")
# actions du prêt
rep("A.watch=function(id){", r"""A.loanOut=function(id){
  const p=getP(id);if(!p)return;
  if(!windowOpen()){toast('Les prêts se concluent pendant les fenêtres de mercato.');return;}
  const used=new Set();
  UI.loanOpts=[0,1,2].map(k=>{const d=clamp(S.div-2+k+ri(-1,0),0,6);return {club:clubName(used),div:d,share:+rf(.3,.9).toFixed(2),play:+rf(.45,.95).toFixed(2)};});
  openModal(`<div class="kicker">Prêt · ${esc(pname(p))}</div><h2>Envoyer en prêt</h2>
  <p>${esc(pname(p))} (${p.age} ans, ${p.ovr}) jouera toute la saison ailleurs et reviendra l’été prochain. Un joueur qui joue progresse plus vite qu’un remplaçant. Le club d’accueil prend en charge une partie de son salaire, et le joueur ne compte plus dans la limite de 30.</p>
  <div class="choices">${UI.loanOpts.map((o,i)=>`<button class="choice" onclick="A.doLoan(${id},${i})">${esc(o.club)} · ${LV[o.div].n}<small>Temps de jeu ${o.play>=.8?'garanti':o.play>=.6?'régulier':'à gagner'} · salaire payé à ${Math.round(o.share*100)} % par le club d’accueil</small></button>`).join('')}</div>
  <div class="row"><button class="btn" onclick="A.close()">Annuler</button></div>`);
};
A.doLoan=function(id,i){const p=getP(id),o=UI.loanOpts&&UI.loanOpts[i];if(!p||!o)return;p.loan=Object.assign({mj:0,g:0,a:0,ns:0,nn:0},o);p.listed=false;S.req.play=(S.req.play||[]).filter(x=>x!==id);
  logMove(p,'Prêt',S.club.name,o.club,0,'out');news(pname(p)+' est prêté à '+o.club+' ('+LV[o.div].n+') jusqu’à la fin de la saison.');save();closeModal();};
A.recall=function(id){const p=getP(id);if(!p||!p.loan)return;if(!windowOpen()){toast('Un rappel de prêt n’est possible que pendant le mercato.');return;}
  const l=p.loan;p.hist.push({y:seasonLabel(S.year),club:l.club+' (prêt, rappelé)',div:LV[l.div].n,mj:l.mj,g:l.g,a:l.a,note:l.nn?+(l.ns/l.nn).toFixed(2):0});p.loan=null;logMove(p,'Retour de prêt',l.club,S.club.name,0,'in');news(pname(p)+' est rappelé de son prêt.');save();A.sheet(id);};
A.watch=function(id){""")
rep("""  <div class="row">${reqBtns}<button class="btn" onclick="A.renew(${id})">Prolonger</button>""",
    """  <div class="row">${p.loan?`<button class="btn" onclick="A.recall(${id})">Rappeler de prêt</button>`:reqBtns}${!p.loan&&p.age<=23&&!inXI?`<button class="btn" onclick="A.loanOut(${id})">Prêter</button>`:''}<button class="btn" onclick="A.renew(${id})">Prolonger</button>""")
rep("""  <div class="row">${inXI?'<span class="pill g">Titulaire</span>':'<span class="pill">Remplaçant</span>'}""",
    """  <div class="row">${p.loan?'<span class="pill y">En prêt · '+esc(p.loan.club)+' · '+p.loan.mj+' m. · '+p.loan.g+' b.</span>':inXI?'<span class="pill g">Titulaire</span>':'<span class="pill">Remplaçant</span>'}""")
# tableau effectif : statut prêt
rep("""${p.listed?'<span class="pill y">En vente</span>':''}${inXI.has(p.id)&&!p.inj?'<span class="pill g">Titulaire</span>':''}</td>""",
    """${p.loan?'<span class="pill">Prêté · '+esc(p.loan.club)+'</span>':''}${p.listed?'<span class="pill y">En vente</span>':''}${inXI.has(p.id)&&!p.inj?'<span class="pill g">Titulaire</span>':''}</td>""")
# alerte : jeunes sans temps de jeu
rep("  const exp=S.players.filter(p=>p.contract<=1).length;",
    "  {const idle=S.players.filter(p=>!p.loan&&p.age<=21&&S.week>=8&&(p.s?p.s.mj+p.s.cmj:0)<=1);if(idle.length>=3)a.push(['w',idle.length+' jeunes n’ont presque pas joué cette saison. Un prêt les ferait progresser (bouton « Prêter » dans leur fiche, pendant le mercato).']);}\n  const exp=S.players.filter(p=>p.contract<=1).length;")

# ---------- D. vitesse du direct
rep("  if(reduce)repFinish();else UI.rep.timer=setInterval(repTick,30);","  if(reduce)repFinish();else UI.rep.timer=setInterval(repTick,30/(S.speed||1));")
rep("const dt=Math.min(.05,(ts-(M.last||ts))/1000);M.last=ts;M.t+=dt;liveStep(M,dt);","const dt=Math.min(.05,(ts-(M.last||ts))/1000)*(S.speed||1);M.last=ts;M.t+=dt;liveStep(M,dt);")
rep("""Ne plus afficher les rapports de match</label><button class="btn pri" id="rsBtn" onclick="A.skipRep()">Passer au coup de sifflet</button></div>`,true);""",
    """Ne plus afficher les rapports de match</label><div class="row"><span class="muted" style="font-size:12px">Vitesse</span>${[1,2,4].map(v=>`<button class="btn sm ${(S.speed||1)===v?'pri':''}" onclick="A.speed(${v})">×${v}</button>`).join('')}<button class="btn pri" id="rsBtn" onclick="A.skipRep()">Passer au coup de sifflet</button></div></div>`,true);""")
rep("A.skipRep=function(){", """A.speed=function(v){S.speed=v;save();const r=UI.rep;document.querySelectorAll('#mbox .btn.sm').forEach(b=>{if(/^×/.test(b.textContent))b.classList.toggle('pri',b.textContent==='×'+v);});if(r&&!r.done&&r.timer){clearInterval(r.timer);r.timer=setInterval(repTick,30/v);}};
A.skipRep=function(){""")

# ---------- E. enchaîner plusieurs journées
rep("  UI.queue.push({type:'report',d:rep});","  if(UI.multi){UI.multiLog=(UI.multiLog||[]);UI.multiLog.push(rep.res);}else UI.queue.push({type:'report',d:rep});")
rep("""  const q=UI.queue.shift();if(!q){render();return;}""",
    """  const q=UI.queue.shift();
  if(!q){render();if(UI.multi>0&&S&&!S.seasonOver&&!S.over){UI.multi--;setTimeout(()=>{if(!UI.modalOpen)A.play();},80);}else if(UI.multiLog&&UI.multiLog.length&&!UI.multi){const l=UI.multiLog;toast(l.length+' journée'+(l.length>1?'s':'')+' jouée'+(l.length>1?'s':'')+' : '+l.filter(x=>x==='V').length+' V · '+l.filter(x=>x==='N').length+' N · '+l.filter(x=>x==='D').length+' D');UI.multiLog=[];}return;}
  if(q.type==='report'&&UI.multi!=null&&UI.multiLog&&UI.multiLog.length&&UI.multi>=0&&UI.multiRun){nextQueue();return;}
  if(q.type==='seasonEnd'||q.type==='over'){UI.multi=0;}""")
rep("A.skipRep=function(){", """A.playN=function(n){if(!S||S.over||UI.modalOpen||S.seasonOver)return;UI.multi=n-1;UI.multiLog=[];UI.multiRun=true;A.play();};
A.skipRep=function(){""")
# le premier match d'une série ne montre pas de rapport non plus
rep("  if(UI.multi){UI.multiLog=(UI.multiLog||[]);UI.multiLog.push(rep.res);}else UI.queue.push({type:'report',d:rep});",
    "  if(UI.multiRun&&(UI.multi>0||UI.multiLog)){UI.multiLog=(UI.multiLog||[]);UI.multiLog.push(rep.res);if(!UI.multi)UI.multiRun=UI.multi>0;}else UI.queue.push({type:'report',d:rep});")
# bouton
rep("""    <button class="play" onclick="A.play()" ${S.over?'disabled':''}>${btnLabel}<small>${esc(btnSub)}</small></button>""",
    """    <div class="playwrap"><button class="play" onclick="A.play()" ${S.over?'disabled':''}>${btnLabel}<small>${esc(btnSub)}</small></button>${!S.over&&!S.seasonOver&&S.N-S.week>1?`<button class="btn sm multi" onclick="A.playN(${Math.min(5,S.N-S.week)})">Enchaîner ${Math.min(5,S.N-S.week)} journées (sans rapport)</button>`:''}</div>""")
rep("/* ===================== Habillage « soir de match » ===================== */","""/* ===================== Habillage « soir de match » ===================== */
.playwrap{display:grid;gap:6px;justify-items:stretch}
.btn.multi{background:rgba(0,0,0,.25);border-color:rgba(244,196,48,.35);color:#f3dc8f;font-size:12px}
@media (max-width:640px){.playwrap{grid-column:1/-1}}""")
open(p,'w').write(s); print('ok')
