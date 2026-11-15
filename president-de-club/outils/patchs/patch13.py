p='/home/claude/president/index.html';s=open(p).read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:80],s.count(a));s=s.replace(a,b)
mod=open('/home/claude/t/mod_euro.js').read()
rep("function migrate(){",mod+"\nfunction migrate(){")
# économie TV
rep("spons:3500000,tv:4000000,","spons:3500000,tv:2500000,")
rep("spons:10000000,tv:18000000,","spons:10000000,tv:4000000,")
rep("const MERIT=[0,0,0,0,300000,2000000,12000000];","const MERIT=[0,0,0,0,300000,8000000,80000000];")
rep("  if(e.merit)fin('Prime de classement',e.merit);","  if(e.merit)fin(S.div>=5?'Droits TV (classement)':'Prime de classement',e.merit);")
rep("  ${e.merit?'<p>Prime de classement versée par la ligue : <b class=\"gold\">'+money(e.merit)+'</b>.</p>':''}",
    "  ${e.merit?'<p>'+(S.div>=5?'Part des droits TV liée au classement':'Prime de classement versée par la ligue')+' : <b class=\"gold\">'+money(e.merit)+'</b>.</p>':''}")
rep("  if(S.flags.tvLocal)fin('Droits TV',S.flags.tvLocal/N);\n",
    "  if(S.flags.tvLocal)fin('Droits TV',S.flags.tvLocal/N);\n  if(S.div===6&&uefaIndex())fin('Droits TV (indice UEFA)',uefaIndex()*2.4e6/N);\n")
rep("  for(let w=S.week;w<N;w++){cash+=weekly;cash+=S.sched[w].some(([h])=>S.teams[h].user)?homeG:-TRAVEL[S.div];}",
    "  for(let w=S.week;w<N;w++){cash+=weekly;cash+=S.sched[w].some(([h])=>S.teams[h].user)?homeG:-TRAVEL[S.div];}\n  {const pos=S.week?myPos():Math.ceil(L.teams/2);cash+=MERIT[S.div]*(L.teams-pos+1)/(L.teams*(L.teams+1)/2);if(S.div===6)cash+=uefaIndex()*2.4e6*(N-S.week)/N;}")
# saison : cadors + Europe
rep("  S.players.forEach(p=>{p.s=newS();p.notes=[];});\n}\nfunction standings(){",
"""  S.players.forEach(p=>{p.s=newS();p.notes=[];});
  if(S.div===6)eliteSetup();
  S.euro=null;
  if(S.euroNext){let k=S.euroNext;S.euroNext=null;
    if(k==='ldcq'){const oppR=rf(77,84),me=S.lastStr||strength().ovr,pw=clamp(.5+(me-oppR)*.04,.15,.85),w=R()<pw;news('Tour préliminaire de Ligue des champions : '+(w?'qualification pour la phase de ligue !':'élimination, le club est reversé en Ligue Europa.'),w?'g':'b');k=w?'ldc':'lde';}
    euroSetup(k);}
}
function standings(){""")
rep("  if(!S.cup.out&&!S.cup.won&&S.cup.round<12&&S.week===cupDay(S.cup.round)){const c=playCup();if(c)UI.queue.push({type:'report',d:c});}\n",
"""  if(!S.cup.out&&!S.cup.won&&S.cup.round<12&&S.week===cupDay(S.cup.round)){const c=playCup();if(c)UI.queue.push({type:'report',d:c});}
  if(euroDue()){const d=euroPlay();if(d)UI.queue.push({type:'report',d});}
  if(S.div===6&&S.week===Math.floor(S.N/2)&&myPos()===1&&S.elite){S.teams.filter(t=>t.elite).forEach(t=>{const b=rf(.8,2.2);t.rating+=b;t.att+=b;t.def+=b;});news('Mercato d’hiver : piqués au vif, les cadors du championnat se renforcent pour vous rattraper.','b');}
""")
# objectif L1 = podium
rep("const objOk=S.objective==='montee'?pos<=Math.max(L.promo,1):","const objOk=S.objective==='montee'?pos<=(S.div===6?3:Math.max(L.promo,1)):")
rep("montee:Math.max(L.promo,L.promo?L.promo:2)}[S.objective];","montee:S.div===6?3:Math.max(L.promo,1)}[S.objective];")
rep("target={maintien:L.teams-L.rel,milieu:Math.ceil(L.teams/2),montee:Math.max(L.promo,2)}[S.objective];","target={maintien:L.teams-L.rel,milieu:Math.ceil(L.teams/2),montee:S.div===6?3:Math.max(L.promo,1)}[S.objective];")
rep("`<button class=\"choice\" onclick=\"A.setObj('montee')\">Viser le podium européen<small>Finir dans les 2 premiers. Sponsors +8 %.</small></button>`",
    "`<button class=\"choice\" onclick=\"A.setObj('montee')\">Viser le podium<small>Finir dans les 3 premiers (Ligue des champions). Sponsors +8 %, mais l’échec coûtera cher.</small></button>`")
# qualification européenne
rep("  if(out!=='up'){S._deloc=null;S._guar=null;}\n  return {",
    "  if(out!=='up'){S._deloc=null;S._guar=null;}\n  const euroNext=out==='down'||out==='dncg'?null:euroQualif(pos,S.cup.won);if(euroNext)notes.push('Qualification européenne : '+EQ_TXT[euroNext]+' la saison prochaine !');\n  return {euroNext,")
rep("  S.year++;\n  // vieillissement",
"""  S.lastStr=strength().ovr;S.euroNext=e.euroNext||null;
  if(S.investor){const I=S.investor,ok=demandOk(I.dem,e.pos,e.out);
    if(ok){I.strikes=0;msgs.push('L’actionnaire majoritaire ('+I.n+') salue une saison réussie.');}
    else{I.strikes++;msgs.push('L’actionnaire majoritaire attendait '+DEM_TXT[I.dem]+'. Avertissement '+I.strikes+'/2.');}
    if(I.strikes>=2){S.over={t:'Écarté par l’actionnaire majoritaire',d:I.n+' n’a pas obtenu '+DEM_TXT[I.dem]+' deux saisons de suite et nomme un nouveau président.'};}
    else if(I.top){fin('Apport des actionnaires',I.top);msgs.push('Nouvel apport de l’actionnaire : '+money(I.top)+'.');}
    if(S.div<6&&I.dem==='montee'&&e.out==='up')I.dem=INV_T[I.k].dem;}
  S.year++;
  // vieillissement""")
rep("  if(S.confidence<=0){checkOver();save();render();nextQueue();return;}",
    "  if(S.over){UI.queue.push({type:'over'});save();render();nextQueue();return;}\n  if(S.confidence<=0){checkOver();save();render();nextQueue();return;}")
# attractivité : les stars veulent l'Europe
rep("  const gap=p.ovr-((L.str[0]+L.str[1])/2+2+S.rep/40+S.infra.pelouse*.6);",
    "  const eu=S.euro?{ldc:3,lde:1.5,lce:.7}[S.euro.k]:0;\n  const gap=p.ovr-((L.str[0]+L.str[1])/2+2+S.rep/40+S.infra.pelouse*.6+eu)+(p.ovr>=85&&!S.euro?3:0);")
# événement : rachat
rep(" naming:{w:1,cond:()=>S.infra.stade",
""" rachat:{w:1.2,cond:()=>S.sasp&&S.div>=5&&!S.investor&&S.ownership>=30&&S.week>3&&S.year-(S.flags.lastBid||0)>=2,make:()=>{S.flags.lastBid=S.year;const k=pick(S.div===6?['fonds','golfe','local']:['fonds','local','local']),T=INV_T[k],base=S.div===6?60e6:14e6;return {k,amt:Math.round(base*rf(T.amt[0],T.amt[1])/1e5)*1e5,dem:S.div<6&&k!=='local'?'montee':T.dem};},k:'Actionnariat',title:'Une offre de rachat du club',
  text:d=>`${INV_T[d.k].n} veut racheter la majorité de la SASP. ${INV_T[d.k].d} Il propose d’apporter ${money(d.amt)} au capital, puis ${money(Math.round(d.amt*.2))} chaque saison, mais exige ${DEM_TXT[d.dem]}. Vous ne garderiez que ${INV_T[d.k].own} % des parts : deux saisons ratées et il vous remplace.`,
  ch:[{t:'Accepter le rachat',s:'Argent frais, mais plus vraiment le patron',f:d=>{const T=INV_T[d.k];S.investor={k:d.k,n:T.n,dem:d.dem,strikes:0,since:S.year,top:Math.round(d.amt*.2)};S.ownership=T.own;fin('Apport des actionnaires',d.amt);S.sponsorAnnual=Math.round(S.sponsorAnnual*1.1);S.mood=clamp(S.mood+T.mood,0,100);S.rep=clamp(S.rep+4,0,100);return 'Rachat signé : '+money(d.amt)+' arrivent au capital.';}},
      {t:'Négocier 20 % de plus',s:'Il peut se retirer',f:d=>{if(R()<.5){d.amt=Math.round(d.amt*1.2/1e5)*1e5;const T=INV_T[d.k];S.investor={k:d.k,n:T.n,dem:d.dem,strikes:0,since:S.year,top:Math.round(d.amt*.2)};S.ownership=T.own;fin('Apport des actionnaires',d.amt);S.sponsorAnnual=Math.round(S.sponsorAnnual*1.1);S.mood=clamp(S.mood+T.mood,0,100);return 'Bien joué : l’investisseur monte à '+money(d.amt)+'.';}return 'L’investisseur se retire, vexé.';}},
      {t:'Refuser : le club reste à ses supporters',f:()=>{S.mood=clamp(S.mood+5,0,100);S.confidence=clamp(S.confidence+3,0,100);return 'Les supporters saluent votre attachement à l’identité du club.';}}]},
 naming:{w:1,cond:()=>S.infra.stade""")
open(p,'w').write(s);print('ok')
