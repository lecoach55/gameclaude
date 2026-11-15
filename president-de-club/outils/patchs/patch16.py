p='/home/claude/president/index.html';s=open(p).read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:80],s.count(a));s=s.replace(a,b)
mod=open('/home/claude/t/mod_eco.js').read()
rep("function migrate(){",mod+"\nfunction migrate(){")
# ouverture de la campagne à chaque nouvelle saison
rep("  if(S.div===6)eliteSetup();\n  S.euro=null;",
    "  if(S.div===6)eliteSetup();\n  {const o=S.abo;const fair=aboFair();S.abo={open:true,price:o&&o.price&&o.div===S.div?o.price:fair,prevN:o?o.n:0,prevPrice:o&&o.div===S.div?o.price:0,n:0,div:S.div};}\n  S.budget=null;S.cashStart=S.cash;\n  S.euro=null;")
rep("  if(S.seasonOver){showSeasonEnd();return;}\n  S.gw++;",
    "  if(S.seasonOver){showSeasonEnd();return;}\n  if(S.week===0){aboClose();S.budget=budgetBuild();S.cashStart=S.cash;}\n  S.gw++;")
rep("  if(rep.home){rep.att=attendance(rep.opp,rep.opp.derby?1.4:1);}",
    "  if(rep.home){rep.att=attendance(rep.opp,rep.opp.derby?1.4:1);if(S.abo&&S.abo.n){rep.aboP=Math.min(cap(),Math.round(S.abo.n*rf(.86,.95)));rep.att=Math.min(cap(),Math.max(rep.att,rep.aboP));}}")
rep("    fin('Billetterie',rep.att*S.ticket);\n","    fin('Billetterie',Math.max(0,rep.att-(rep.aboP||0))*S.ticket);\n")
rep("  const homeG=att*(S.ticket+BUV[i.commerce])+(i.loges?LOGES[i.loges]*(1+S.div*.25):0);",
    "  const aboN=S.abo?(S.abo.open?aboDemand(S.abo.price):S.abo.n):0;if(S.abo&&S.abo.open)cash+=aboN*S.abo.price;\n  const homeG=Math.max(0,att-aboN*.9)*S.ticket+Math.max(att,aboN*.9)*BUV[i.commerce]+(i.loges?LOGES[i.loges]*(1+S.div*.25):0);")
# budget en fin de saison
rep("  if(barrage&&barrage.win&&!objOk)dc=Math.max(dc,4);",
"""  if(barrage&&barrage.win&&!objOk)dc=Math.max(dc,4);
  if(S.budget&&S.budget.y===S.year){const NB=new Set(['Transferts (ventes)','Transferts (achats)','Travaux','Primes à la signature','Commissions d’agents','Indemnités de départ']);
    const sum=o=>Object.entries(o).filter(([k])=>!NB.has(k)).reduce((a,[,v])=>a+v,0);const real=sum(S.sf.inc)-sum(S.sf.exp),tol=Math.max(3000,S.budget.ti*.05);
    if(real>=S.budget.res-tol){dc+=3;notes.push('Budget tenu : résultat d’exploitation de '+money(real)+' pour '+money(S.budget.res)+' prévus. Les adhérents apprécient (+3).');}
    else{dc-=4;notes.push('Budget dépassé : résultat d’exploitation de '+money(real)+' pour '+money(S.budget.res)+' prévus (−4 de confiance).');}}""")
# vFin : cartes abonnement et budget
rep("  <div class=\"grid g2\">\n   <div class=\"card\"><h3>Billetterie</h3>",
    "  ${aboCard()}\n  <div class=\"grid g2\">\n   <div class=\"card\"><h3>Billetterie</h3>")
rep("  <div class=\"card\"><header><h3>Évolution de la trésorerie</h3>","  ${budgetCard()}\n  <div class=\"card\"><header><h3>Évolution de la trésorerie</h3>")
# alerte campagne
rep("  if(S.over)a.push(['b','Partie terminée : '+S.over.t]);",
    "  if(S.over)a.push(['b','Partie terminée : '+S.over.t]);\n  if(S.abo&&S.abo.open)a.push(['y','Campagne d’abonnement ouverte jusqu’à la J1 : fixez le prix dans l’onglet Finances (actuellement '+S.abo.price+' €, ≈ '+nf(aboDemand(S.abo.price))+' abonnés).']);")
# offres : revente
rep("<button class=\"btn sm pri\" onclick=\"A.acceptOffer(${o.id})\">Accepter</button>",
    "<button class=\"btn sm pri\" onclick=\"A.acceptOffer(${o.id})\">Accepter</button><button class=\"btn sm\" title=\"Indemnité −10 %, mais 15 % de la prochaine revente pendant 3 ans\" onclick=\"A.acceptSellOn(${o.id})\">+ % revente</button>")
# clauses libératoires vérifiées pendant les fenêtres
rep("  genOffers();","  genOffers();releaseTick();")
# négociation : clause libératoire et prime de montée
rep("UI.ng={fee:Math.round(t.ask*.9/100)*100,wage:t.wAsk,bonus:0,years:p.age>=30?2:3,role:p.ovr>=startsAt(p)?'Titulaire':'Rotation'};",
    "UI.ng={fee:Math.round(t.ask*.9/100)*100,wage:t.wAsk,bonus:0,years:p.age>=30?2:3,role:p.ovr>=startsAt(p)?'Titulaire':'Rotation',rel:false,pm:0};")
rep("""     <div id="ngSum" class="muted" style="font-size:13px"></div>""",
"""     <div class="fields">
      ${LV[S.div].promo?`<div><label class="fld" for="ngPm">Prime de montée : <b id="ngPmv" class="gold">${money(n.pm||0)}</b></label><input type="range" id="ngPm" min="0" max="${Math.max(100,Math.round(t.wAsk*6/10)*10)}" step="${Math.max(10,Math.round(t.wAsk/20)*10)}" value="${n.pm||0}" oninput="A.negUpd()"><div class="muted" style="font-size:12px">Versée seulement si le club monte : le joueur la valorise, vous ne la payez qu’en cas de succès.</div></div>`:'<div></div>'}
      <label class="row" style="gap:8px;align-items:flex-start;font-size:14px"><input type="checkbox" id="ngRel" ${n.rel?'checked':''} onchange="A.negUpd()"> <span><b>Clause libératoire</b> (${money(Math.round(valueFor(p)*2/1000)*1000)})<br><span class="muted" style="font-size:12px">Le joueur l’apprécie, mais un club qui paie ce montant peut l’emmener sans votre accord.</span></span></label>
     </div>
     <div id="ngSum" class="muted" style="font-size:13px"></div>""")
rep("n.role=g('ngR').value;g('ngWv').textContent=money(n.wage);",
    "n.role=g('ngR').value;n.rel=!!(g('ngRel')&&g('ngRel').checked);n.pm=g('ngPm')?+g('ngPm').value:0;if(g('ngPmv'))g('ngPmv').textContent=money(n.pm);g('ngWv').textContent=money(n.wage);")
rep("  return r+(interest(p)-.6)*.25;\n}",
    "  if(o.rel)r+=.05;if(o.pm&&LV[S.div].promo)r+=o.pm/Math.max(1,t.wAsk*12)*.45;\n  return r+(interest(p)-.6)*.25;\n}")
rep("const q=Object.assign({},p,{wage:o.wage,contract:o.years,",
    "const q=Object.assign({},p,{release:o.rel?Math.round(valueFor(p)*2/1000)*1000:0,pm:o.pm||0,wage:o.wage,contract:o.years,")
rep("  L({who:'me',t:`${money(o.wage)}/mois sur ${o.years} an${o.years>1?'s':''}${o.bonus?', prime de '+money(o.bonus):''}, rôle promis : ${o.role.toLowerCase()}.`});",
    "  L({who:'me',t:`${money(o.wage)}/mois sur ${o.years} an${o.years>1?'s':''}${o.bonus?', prime de '+money(o.bonus):''}${o.pm?', prime de montée '+money(o.pm):''}${o.rel?', clause libératoire':''}, rôle promis : ${o.role.toLowerCase()}.`});")
# montée : primes, revente
rep("  S.lastStr=strength().ovr;S.euroNext=e.euroNext||null;",
    "  S.lastStr=strength().ovr;S.euroNext=e.euroNext||null;\n  if(e.out==='up'){const pm=S.players.reduce((a,p)=>a+(p.pm||0),0);if(pm){fin('Primes de montée',-pm);S.players.forEach(p=>{if(p.pm)p.morale=clamp(p.morale+8,0,100);});msgs.push('Primes de montée versées aux joueurs : '+money(pm)+'.');}}\n  resaleTick();")
open(p,'w').write(s);print('ok')
