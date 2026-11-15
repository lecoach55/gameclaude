p='/home/claude/president/index.html';s=open(p).read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:70],s.count(a));s=s.replace(a,b)
rep("  if(S.week<S.N){const pr=projection();if(pr<0)a.push(['b','Au rythme actuel, la trésorerie finira la saison à '+money(pr)+'. Réduisez la masse salariale, vendez ou empruntez.']);}",
"""  if(S.week<S.N){const pr=projection();if(pr<0){const race=L.promo&&S.div<6&&S.week>=4&&myPos()<=L.promo+2;
    a.push(['b',race?'Course à la montée en danger : la montée exige une trésorerie positive en fin de saison, or la projection est de '+money(pr)+'. Il manque environ '+money(-pr)+' : vendez, réduisez les salaires ou empruntez (onglet Finances).':'Au rythme actuel, la trésorerie finira la saison à '+money(pr)+'. Réduisez la masse salariale, vendez ou empruntez.']);}}""")
rep("  if(S.week===Math.floor(S.N/2))S.teams.forEach(t=>{if(!t.user)",
"""  if(S.week===Math.floor(S.N*2/3)&&L.promo&&S.div<6&&myPos()<=L.promo+1&&!UI.multiRun){const pr=projection();if(pr<0)UI.queue.push({type:'info',t:'Le trésorier tire la sonnette d’alarme',d:'Le club est '+myPos()+'e et peut monter, mais la saison finirait avec une trésorerie de '+money(pr)+'. Sans trésorerie positive au 30 juin, la montée sera refusée (et la DNCG pourrait sévir). Il reste '+(S.N-S.week)+' journées pour trouver environ '+money(-pr)+' : vente d’un joueur, prêt avec prise en charge du salaire, emprunt ou baisse du prix des places pour remplir le stade.'});}
  if(S.week===Math.floor(S.N/2))S.teams.forEach(t=>{if(!t.user)""")
open(p,'w').write(s);print('ok')
