import re
p='/home/claude/president/index.html';s=open(p).read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:60],s.count(a));s=s.replace(a,b)
# reqs : marquer les critères de stade
rep("const i=S.infra,r=[];const add=(l,ok)=>r.push({l,ok});","const i=S.infra,r=[];const add=(l,ok,need)=>r.push({l,ok,need});")
rep("add('Stade de 800 places',i.stade>=1);","add('Stade de 800 places',i.stade>=1,1);")
rep("add('Tribune couverte, 1 500 places (niveau T2)',i.stade>=2);","add('Tribune couverte, 1 500 places (niveau T2)',i.stade>=2,2);")
rep("add('Stade de 5 000 places',i.stade>=4);","add('Stade de 5 000 places',i.stade>=4,4);")
rep("add('Stade de 12 000 places',i.stade>=6);","add('Stade de 12 000 places',i.stade>=6,6);")
# décision de montée avec dérogation
rep("function computeSeasonEnd(){","""function promoDecide(notes,pre){const t=S.div+1,rq=reqs(t),bad=rq.filter(x=>!x.ok);if(!bad.length)return 'up';
  if(t>=3&&!S.deloc&&bad.every(x=>x.need)){const need=Math.max(...bad.map(x=>x.need));notes.push(pre+'montée validée par dérogation : faute de stade aux normes, le club jouera à domicile dans un stade voisin de '+INFRA.stade.cap[need].toLocaleString('fr-FR')+' places (loyer à chaque match) jusqu’à la mise aux normes, deux saisons maximum.');S._deloc=need;return 'up';}
  notes.push(pre?pre+'montée refusée : cahier des charges de '+LV[t].n+' non rempli.':'Montée refusée : le club ne remplit pas le cahier des charges de '+LV[t].n+'.');return 'refused';}
function computeSeasonEnd(){S._deloc=null;""")
rep("if(pos<=L.promo&&S.div<6){const rq=reqs(S.div+1);out=rq.every(x=>x.ok)?'up':'refused';if(out==='refused')notes.push('Montée refusée : le club ne remplit pas le cahier des charges de '+LV[S.div+1].n+'.');}",
    "if(pos<=L.promo&&S.div<6)out=promoDecide(notes,'');")
rep("if(win){const rq=reqs(S.div+1);out=rq.every(x=>x.ok)?'up':'refused';if(out==='refused')notes.push('Barrage gagné, mais montée refusée : cahier des charges de '+LV[S.div+1].n+' non rempli.');}}",
    "if(win)out=promoDecide(notes,'Barrage gagné : ');}")
rep("if(pos>L.teams-L.rel&&S.div>0)out='down';","if(pos>L.teams-L.rel&&S.div>0){out='down';S._deloc=null;}")
rep("  return {barrage,pos,out,notes,objOk,","  if(out!=='up')S._deloc=null;\n  return {deloc:S._deloc,barrage,pos,out,notes,objOk,")
# application au changement de saison
rep("msgs.push('Le club monte en '+LV[S.div].n+' !');}",
    "msgs.push('Le club monte en '+LV[S.div].n+' !');if(e.deloc){S.deloc={need:e.deloc,left:2};msgs.push('Dérogation : matchs à domicile dans un stade voisin de '+INFRA.stade.cap[e.deloc].toLocaleString('fr-FR')+' places tant que le vôtre n’est pas aux normes.');}}")
rep("  S.fans=Math.max(LV[S.div].fmin,S.fans);\n  S.year++;",
    """  if(S.deloc&&!e.deloc){if(S.infra.stade>=S.deloc.need)S.deloc=null;else if(e.out==='down'||e.out==='dncg')S.deloc=null;else if(--S.deloc.left<=0){S.deloc.left=0;S.confidence=clamp(S.confidence-8,0,100);msgs.push('La dérogation stade arrive à échéance : la Ligue double le loyer exigé et les adhérents s’impatientent.');}}
  S.fans=Math.max(LV[S.div].fmin,S.fans);
  S.year++;""")
# capacité et loyer
rep("const cap=()=>INFRA.stade.cap[S.infra.stade];",
    "const delocOn=()=>!!(S&&S.deloc&&S.infra.stade<S.deloc.need);\nconst cap=()=>delocOn()?INFRA.stade.cap[S.deloc.need]:INFRA.stade.cap[S.infra.stade];")
rep("  const a=S.fans*(.45+S.mood/200)*priceF*oppF*(mult||1)*rf(.92,1.08);",
    "  const a=S.fans*(.45+S.mood/200)*priceF*oppF*(mult||1)*rf(.92,1.08)*(delocOn()?.8:1);")
rep("    fin('Billetterie',rep.att*S.ticket);\n",
    "    fin('Billetterie',rep.att*S.ticket);\n    if(delocOn())fin('Location du stade',-Math.round((rep.att*S.ticket*.3+L.tick*150)*(S.deloc.left<=0?2:1)));\n")
# alerte
rep("  if(S.div<6&&L.promo){const r=reqs(S.div+1).filter(x=>!x.ok);",
    "  if(delocOn())a.push([S.deloc.left<=0?'b':'w','Dérogation stade : vous jouez à domicile dans un stade voisin (loyer à chaque match, affluence réduite). Construisez un stade de '+INFRA.stade.cap[S.deloc.need].toLocaleString('fr-FR')+' places'+(S.deloc.left<=0?' : le loyer est désormais doublé.':' avant la fin de la saison prochaine.')]);\n  if(S.div<6&&L.promo){const r=reqs(S.div+1).filter(x=>!x.ok);")
open(p,'w').write(s);print('ok')
