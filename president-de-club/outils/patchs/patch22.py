p='/home/claude/president/index.html';s=open(p).read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:80],s.count(a));s=s.replace(a,b)
mod=open('/home/claude/t/mod_deleg.js').read()
rep("Object.assign(EVENTS,TERR_EV);",mod+"\nObject.assign(EVENTS,TERR_EV);")
rep("  if(S.week===0){aboClose();S.budget=budgetBuild();S.cashStart=S.cash;}","  runDelegations('pre');\n  if(S.week===0){aboClose();S.budget=budgetBuild();S.cashStart=S.cash;}")
rep("  genOffers();releaseTick();","  genOffers();releaseTick();runDelegations('post');")
rep("function vStaff(){\n  return `<div class=\"grid g2\">","function vStaff(){\n  return delegCard()+`<div class=\"grid g2\">")
rep("  const add=(key,role,pri,text,acts)=>{if(hide[key]===S.gw)return;",
    "  const DM={ticket:'ticket',abo:'abo',contrat:'renew',jeune:'loan',gap:'recruit'};\n  const add=(key,role,pri,text,acts)=>{if(hide[key]===S.gw)return;if(DM[key]&&dlgOn(DM[key]))return;")
s=s.replace("</style>",""".deleg{border-top:3px solid var(--good)}
.dl-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #1e2f25}
.dl-row.on .adv-who b{color:var(--good)}
.dl-log{display:grid;gap:4px;font-size:13px;padding:10px 12px;border-radius:8px;background:#ffffff06;border:1px solid var(--line)}
</style>""",1)
open(p,'w').write(s);print('ok')
