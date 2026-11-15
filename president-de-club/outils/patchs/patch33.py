f='/home/claude/president/index.html';s=open(f).read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:70],s.count(a));s=s.replace(a,b)
y=open('/home/claude/t/mod_youth.js').read()
rep("/* ====================== Missions du recruteur ====================== */",y+"\n/* ====================== Missions du recruteur ====================== */")
i=s.index("  // centre de formation\n  const fl=S.infra.formation,fo=slvl('formateur');")
j=s.index("  if(ys.length)msgs.push('Intégrés depuis le centre de formation : '+ys.join(', ')+'.');\n")+len("  if(ys.length)msgs.push('Intégrés depuis le centre de formation : '+ys.join(', ')+'.');\n")
s=s[:i]+"  // centre de formation : le formateur présente les U18, fin de formation des stagiaires\n  const L=LV[S.div];yIntakeStart(msgs);\n"+s[j:]
rep("  if(q.type==='sreport'){A.squadReport(true);return;}","  if(q.type==='sreport'){A.squadReport(true);return;}\n  if(q.type==='yintake'){A.yIntake();return;}")
rep("  if(m.k==='adv'){\n    const t=S.teams.find(x=>x.name===m.opp);","  if(m.k==='jeunes')yDetectAdd();\n  if(m.k==='adv'){\n    const t=S.teams.find(x=>x.name===m.opp);")
rep(".sp-off{display:flex;",".ylist{display:grid;gap:6px;max-height:52vh;overflow:auto}.yrow{display:flex;gap:10px;align-items:flex-start;justify-content:space-between;padding:8px 10px;border:1px solid #1e2f25;border-radius:8px;font-size:13.5px}.yrow input{margin-top:4px}label.yrow{justify-content:flex-start;cursor:pointer}\n.sp-off{display:flex;")
open(f,'w').write(s);print('ok')
