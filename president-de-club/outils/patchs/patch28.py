f='/home/claude/president/index.html';s=open(f).read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:70],s.count(a));s=s.replace(a,b)
sp=open('/home/claude/t/mod_spons.js').read()
rep("/* ====================== Missions du recruteur ====================== */",sp+"\n/* ====================== Missions du recruteur ====================== */")
rep("*(S.flags.careerSp||1)*terrEco());\n","*(S.flags.careerSp||1)*terrEco());\n  spSeason();\n")
rep("  misTick();\n","  misTick();spTick();\n")
rep("  if(e.out==='up'){const pm=S.players","  if(e.out==='up')spPromo();\n  if(e.out==='up'){const pm=S.players")
rep("  ${aboCard()}\n","  ${aboCard()}\n  ${spCard()}\n")
rep("  // licence\n  if(L.promo&&S.div>=1","  if(S.spons&&!dlgOn('spons')){const k=spSlots().find(k=>spFree(k)&&(!S.spons[k]||S.week>=S.N/2));if(k)add('spons','commercial',S.spons[k]?2:3,S.spons[k]?`Le contrat « ${SPSLOT[k].n.toLowerCase()} » avec ${S.spons[k].b} se termine en fin de saison. Je peux démarcher d’autres entreprises : la valeur de marché est d’environ ${money(spVal(k,1))} par saison.`:`L’emplacement « ${SPSLOT[k].n.toLowerCase()} » est libre : c’est environ ${money(spVal(k,1))} par saison qui nous échappent. Je peux démarcher.`,[['Démarcher',`A.spProspect('${k}')`]]);}\n  // licence\n  if(L.promo&&S.div>=1")
open(f,'w').write(s);print('ok')
s=open(f).read()
a=".sr-cand{display:flex;"
s=s.replace(a,".sp-off{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;font-size:14px;padding:10px 0;border-top:1px solid #1e2f25}.sp-off .pill{margin-left:6px}\n"+a,1)
open(f,'w').write(s)
s=open(f).read()
ev=open('/home/claude/t/ev4.js').read()
assert s.count("Object.assign(EVENTS,EV3);")==1
s=s.replace("Object.assign(EVENTS,EV3);","Object.assign(EVENTS,EV3);\n"+ev)
open(f,'w').write(s)
