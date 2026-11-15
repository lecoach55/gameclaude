import re
f='/home/claude/president/index.html';s=open(f).read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:60],s.count(a));s=s.replace(a,b)
# 1. équilibrage des rôles
rep("return RGROUP[role]===RGROUP[p.role]?3:8;}","return RGROUP[role]===RGROUP[p.role]?2:5;}")
rep("function roleVal(p,role){return p.ovr+(roleFit(p,role)-p.ovr)*.6-famPen(p,role);}","function roleVal(p,role){return p.ovr+(roleFit(p,role)-p.ovr)*.5-famPen(p,role);}")
# 2. modules
mis=open('/home/claude/t/mod_mission.js').read();ev=open('/home/claude/t/ev3.js').read()
rep("Object.assign(EVENTS,TERR_EV);","Object.assign(EVENTS,TERR_EV);\n"+mis)
s=s.replace("Object.assign(EVENTS,EV2);","Object.assign(EVENTS,EV2);\n"+ev,1)
# 3. hooks
rep("  const nf0=nextFixture();coachDecide(nf0&&nf0.opp);\n  const me=strength();","  const nf0=nextFixture();coachDecide(nf0&&nf0.opp);\n  const me=strength();misOppBonus(me,nf0);")
rep("  weeklyUpdates();\n","  weeklyUpdates();\n  misTick();\n")
rep("  if(q.type==='sreport'){A.squadReport(true);return;}","  if(q.type==='sreport'){A.squadReport(true);return;}\n  if(q.type==='misrep'){if(UI.multiRun){nextQueue();return;}A.misReport();return;}")
rep('<div class="card"><div class="mtabs">','${misCard()}<div class="card"><div class="mtabs">')
# 4. conseil
rep("  // licence\n  if(L.promo&&S.div>=1","  if(slvl('recruteur')&&!S.mission&&S.misAuto===false&&S.cash>misCost('poste')*5){const c=misAutoPick();if(c)add('mission','recruteur',2,`Je suis disponible pour une mission. Je propose : « ${MIS[c.k].n.toLowerCase()}${c.role?' ('+ROLE[c.role].n.toLowerCase()+')':''} », car ${c.why}.`,[['Ouvrir la cellule de recrutement',\"A.tab('mercato')\"]]);}\n  // licence\n  if(L.promo&&S.div>=1")
open(f,'w').write(s);print('ok')
