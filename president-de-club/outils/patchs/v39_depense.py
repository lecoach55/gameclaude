#!/usr/bin/env python3
# v39 — décision de Victor du 18/11 : dépense risquée (intérêts selon l'endettement,
# DNCG plus stricte quand la masse salariale dépasse les recettes) + joueurs libres
# moins chers en zone de relégation.  Usage : python3 v39_depense.py chemin/index.html
import sys
p = sys.argv[1] if len(sys.argv) > 1 else 'jeu/index.html'
s = open(p, encoding='utf-8').read()
def rep(a, b, n=1):
    global s
    assert s.count(a) == n, (a[:70], s.count(a)); s = s.replace(a, b)

# 1) fonctions communes
rep("const debt=()=>S.loans.reduce((s,l)=>s+l.remaining,0);\n",
"""const debt=()=>S.loans.reduce((s,l)=>s+l.remaining,0);
/* v39 — dépense risquée (décision de Victor, 18/11) */
const RISK={pal1:.4,pal2:.8,sur1:.03,sur2:.06,frais:.08,seuilFrais:.6,libre:.8};
function recettesAn(){const L=LV[S.div],i=S.infra;return S.sponsorAnnual+(S.sponsorBonus||0)+(S.naming||0)+L.sub*(S.subsidyMult||1)+L.tv+(S.flags.tvLocal||0)+S.fans*MERCH[i.commerce]*(1+S.div*.4)*(S.flags.kitShare?1.5:1)+S.fans*.6*S.ticket*S.N/2+(i.loges?LOGES[i.loges]*(1+S.div*.25)*S.N/2:0);}
function recettesRef(){const est=recettesAn();if(!S.sf||S.week<4)return est;const inc=Object.values(S.sf.inc||{}).reduce((a,b)=>a+b,0),ven=(S.sf.inc||{})['Transferts (ventes)']||0;return Math.max(est,(inc-ven)*S.N/S.week+ven);}
// NB (relecture 18/11) : version mesurée par run3 ; les abonnements et recettes ponctuelles sont extrapolés, l'estimation
// de billetterie n'est pas plafonnée au stade → question q-design-president-de-club-3 posée à Victor avant de durcir.
const msRatio=()=>(wageBill()+staffBill())*12/Math.max(1,recettesRef());
const detteRatio=(x=0)=>(debt()+x)/Math.max(1,recettesRef());
function tauxEmprunt(amt){const dr=detteRatio(amt||0);return .045+(S.confidence<40?.03:0)+(S.cash<0?.03:0)+(dr>RISK.pal2?RISK.sur2:dr>RISK.pal1?RISK.sur1:0);}
function fraisDette(){const r=recettesRef(),ex=debt()-r*RISK.seuilFrais;return ex>0?ex*RISK.frais:0;}
const zoneRel=()=>{const L=LV[S.div];return S.div>0&&L.rel>0&&S.week>=3&&myPos()>L.teams-L.rel;};
function libresRel(){const z=zoneRel();(S.market||[]).forEach(p=>{if(p.fee)return;if(z&&!p.rd){p.rd=1;p.demand=Math.round(p.demand*RISK.libre/10)*10;}else if(!z&&p.rd){delete p.rd;p.demand=Math.round(p.demand/RISK.libre/10)*10;}});
  if(z!==!!S.relZ){S.relZ=z;if(z)news('Zone de relégation : les joueurs libres acceptent de baisser leurs prétentions de 20 % pour venir jouer le maintien.','g');}}
""")

# 2) emprunt : le taux monte avec l'endettement
rep("const rate=.045+(S.confidence<40?.03:0)+(S.cash<0?.03:0);\n  const total=Math.round(amt*(1+rate*2));",
    "const rate=tauxEmprunt(amt);\n  const total=Math.round(amt*(1+rate*2));")

# 3) frais de la dette chaque journée au-delà de 60 % des recettes annuelles
rep("  S.loans=S.loans.filter(l=>l.remaining>1);\n",
    "  S.loans=S.loans.filter(l=>l.remaining>1);\n  {const fd=fraisDette();if(fd>0)fin('Intérêts d’emprunt',-fd/N);}\n")

# 4) DNCG à la trêve : plus stricte quand la masse salariale dépasse les recettes
rep("""    const pr=projection(),inc=S.sponsorAnnual+LV[S.div].sub+LV[S.div].tv;
    if(pr<-inc*.2){""",
"""    const pr=projection(),inc=S.sponsorAnnual+LV[S.div].sub+LV[S.div].tv,msr=msRatio(),trop=msr>1;
    if(pr<-inc*.2||(trop&&pr<0)){""")
rep("""d:'Après examen de vos comptes à la trêve, la DNCG vous interdit tout recrutement jusqu’à la fin de la saison (fin de saison prévue à '+money(pr)+'). Une""",
    """d:'Après examen de vos comptes à la trêve, la DNCG vous interdit tout recrutement jusqu’à la fin de la saison (fin de saison prévue à '+money(pr)+(trop?' ; masse salariale à '+Math.round(msr*100)+' % des recettes':'')+'). Une""")
rep("""    else if(pr<0){S.dncg={lvl:1,cap:wageBill()};UI.queue.push({type:'info',t:'DNCG : encadrement de la masse salariale',d:'La DNCG juge votre budget fragile (fin de saison prévue à '+money(pr)+'). Votre""",
    """    else if(pr<0||trop){S.dncg={lvl:1,cap:wageBill()};UI.queue.push({type:'info',t:'DNCG : encadrement de la masse salariale',d:(trop?'Votre masse salariale atteint '+Math.round(msr*100)+' % de vos recettes : la DNCG la juge excessive (fin de saison prévue à '+money(pr)+'). Au 30 juin, elle ne tolérera aucun déficit et tiendra compte de vos emprunts.':'La DNCG juge votre budget fragile (fin de saison prévue à '+money(pr)+').')+' Votre""")

# 5) joueurs libres moins chers en zone de relégation (chaque journée)
rep("  weeklyUpdates();\n", "  weeklyUpdates();libresRel();\n")

# 6) DNCG au 30 juin : masse salariale > recettes → aucun déficit toléré, emprunts comptés
rep("""  if(S.cash<0&&out!=='down'){
    if(S.div>=4){""",
"""  const msrF=msRatio(),dueF=S.loans.reduce((s,l)=>s+Math.min(l.remaining,l.perWeek*S.N),0);
  if(S.div>=2&&msrF>1&&out!=='down'&&S.cash>=0&&S.cash<dueF*.5){out='dncg';notes.push('La DNCG prononce une rétrogradation administrative : masse salariale à '+Math.round(msrF*100)+' % des recettes et trésorerie insuffisante pour couvrir les emprunts de la saison prochaine.');}
  else if(S.div>=2&&msrF>1&&S.cash<0&&out!=='down'&&S.div<4){out='dncg';notes.push('La DNCG fédérale prononce une rétrogradation administrative : déficit avec une masse salariale supérieure aux recettes.');}
  if(S.cash<0&&out!=='down'&&out!=='dncg'){
    if(S.div>=4){""")

# 7) Finances : taux réel, endettement, masse salariale / recettes
rep("""Capacité d’emprunt : <b>${money(lc)}</b>. Taux : ${S.confidence<40||S.cash<0?'majoré (situation fragile)':'4,5 % par an'}. Remboursement sur deux saisons.</p>""",
    """Capacité d’emprunt : <b>${money(lc)}</b>. Taux du prochain emprunt (moitié de la capacité) : <b>${(tauxEmprunt(lc*.5)*100).toFixed(1).replace('.',',')}&nbsp;% par an</b>${tauxEmprunt(lc*.5)>.046?' (majoré : '+[S.confidence<40?'confiance basse':'',S.cash<0?'trésorerie négative':'',detteRatio(lc*.5)>RISK.pal1?'endettement élevé':''].filter(Boolean).join(', ')+')':''}. Remboursement sur deux saisons.</p>
    <p style="margin:0;font-size:13.5px">Dette : <b class="${detteRatio()>RISK.seuilFrais?'bad':''}">${money(debt())}</b> = ${Math.round(detteRatio()*100)} % des recettes annuelles${fraisDette()>0?' · frais de surendettement : <b class="bad">'+money(fraisDette())+'/an</b>':''}. Masse salariale (joueurs + staff) : <b class="${msRatio()>1?'bad':msRatio()>.85?'warn':''}">${Math.round(msRatio()*100)} %</b> des recettes${S.div>=2&&msRatio()>1?' — <span class="bad">au-delà de 100 %, la DNCG ne tolère aucun déficit et compte vos emprunts</span>':''}.</p>
    <p class="muted" style="margin:0;font-size:12.5px">Taux selon le montant : ${[.25,.5,1].map(f=>money(lc*f)+' → '+(tauxEmprunt(lc*f)*100).toFixed(1).replace('.',',')+'&nbsp;%').join(' · ')}.</p>
    <p class="muted" style="margin:0;font-size:12.5px">Quand la dette dépasse 40 % des recettes annuelles, chaque nouvel emprunt coûte 3 points de plus (6 au-delà de 80 %) ; au-delà de 60 %, la part en excès coûte 8 % par an.</p>""")

# 8) conseil du staff
rep("""  // billetterie
  if(S.week<S.N){const w=advWho('commercial')""",
"""  // v39 : masse salariale et dette
  if(S.div>=2&&msRatio()>1)add('msr','commercial',1,`Notre masse salariale représente ${Math.round(msRatio()*100)} % de nos recettes. La DNCG ne nous passera aucun déficit au 30 juin et comptera nos emprunts : il faut vendre ou ne pas prolonger.`);
  else if(detteRatio()>RISK.seuilFrais)add('dette','commercial',2,`Notre dette atteint ${Math.round(detteRatio()*100)} % des recettes annuelles : la banque facture ${money(fraisDette())} par an de frais en plus. Évitons d’emprunter encore.`);
  if(zoneRel()&&squadN()<28)add('librel','recruteur',2,`Nous sommes en zone de relégation : les joueurs libres demandent 20 % de moins pour venir jouer le maintien. C’est le moment de renforcer l’équipe à bas prix (Mercato).`);
  // billetterie
  if(S.week<S.N){const w=advWho('commercial')""")

# 9) anciennes sauvegardes
rep("  ensureCoach(S.staff.coach);\n}\nfunction boot(",
    "  ensureCoach(S.staff.coach);\n  if(S.relZ==null)S.relZ=false;\n}\nfunction boot(")

open(p, 'w', encoding='utf-8').write(s); print('v39 ok')
