p='/home/claude/president/index.html';s=open(p).read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:70],s.count(a));s=s.replace(a,b)
rep("function promoDecide(notes,pre){const t=S.div+1,rq=reqs(t),bad=rq.filter(x=>!x.ok);if(!bad.length)return 'up';",
"""function promoDecide(notes,pre){const t=S.div+1,rq=reqs(t);let bad=rq.filter(x=>!x.ok);
  const cashBad=bad.find(x=>/^Trésorerie/.test(x.l)),tol=Math.max(5000,(S.sponsorAnnual+LV[S.div].sub+LV[S.div].tv)*.08);
  if(cashBad&&-S.cash<=tol&&bad.length===1+bad.filter(x=>x.need).length){S._guar=Math.ceil(-S.cash/1000)*1000+2000;bad=bad.filter(x=>x!==cashBad);notes.push('Trésorerie légèrement négative ('+money(S.cash)+') : la Ligue accepte une garantie bancaire de '+money(S._guar)+', remboursable sur deux saisons.');}
  if(!bad.length)return 'up';""")
rep("function computeSeasonEnd(){S._deloc=null;","function computeSeasonEnd(){S._deloc=null;S._guar=null;")
rep("  if(out!=='up')S._deloc=null;\n  return {deloc:S._deloc,","  if(out!=='up'){S._deloc=null;S._guar=null;}\n  return {guar:S._guar,deloc:S._deloc,")
rep("msgs.push('Le club monte en '+LV[S.div].n+' !');",
    "msgs.push('Le club monte en '+LV[S.div].n+' !');if(e.guar){fin('Emprunts',e.guar);const tot=Math.round(e.guar*1.04);S.loans.push({label:'Garantie bancaire (montée)',amount:e.guar,remaining:tot,perWeek:tot/(S.N*2),intW:(tot-e.guar)/(S.N*2)});msgs.push('Garantie bancaire de '+money(e.guar)+' souscrite pour valider la montée.');}")
open(p,'w').write(s);print('ok')
