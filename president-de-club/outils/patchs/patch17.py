p='/home/claude/president/index.html';s=open(p).read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:80],s.count(a));s=s.replace(a,b)
mod=open('/home/claude/t/mod_club.js').read()
rep("function migrate(){",mod+"\nfunction migrate(){")
# événements à titre/choix dynamiques
rep("  openModal(`<div class=\"kicker\">${esc(e.k)} · ${wkLabel()}</div><h2>${esc(e.title)}</h2><p>${esc(e.text(q.d))}</p>\n  <div class=\"choices\">${e.ch.map(",
    "  const tt=typeof e.title==='function'?e.title(q.d):e.title,chs=typeof e.ch==='function'?e.ch(q.d):e.ch;\n  openModal(`<div class=\"kicker\">${e.icon?e.icon:''}${esc(e.k)} · ${wkLabel()}</div><h2>${esc(tt)}</h2><p>${esc(e.text(q.d))}</p>\n  <div class=\"choices\">${chs.map(")
rep("  const msg=e.ch[i].f(q.d);","  const chs=typeof e.ch==='function'?e.ch(q.d):e.ch,tt=typeof e.title==='function'?e.title(q.d):e.title;\n  const msg=chs[i].f(q.d);")
rep("  if(msg)news(e.title+' : '+msg);","  if(msg)news(tt+' : '+msg);")
rep("  openModal(`<div class=\"kicker\">${esc(e.k)}</div><h2>${esc(e.title)}</h2><p>${esc(msg||'C’est noté.')}</p>",
    "  openModal(`<div class=\"kicker\">${esc(e.k)}</div><h2>${esc(tt)}</h2><p>${esc(msg||'C’est noté.')}</p>")
rep(" naming:{w:1,cond:()=>S.infra.stade",
""" presse_conf:{w:0,k:'Conférence de presse',icon:'🎙 ',title:()=>'Salle de presse',text:d=>'Question d’un journaliste : « '+PRESS[d.c].q+' »',ch:d=>PRESS[d.c].a.map(([t,s,f])=>({t,s,f}))},
 ultrasNes:{w:2,cond:()=>!S.ultras&&S.fans>=1500&&S.div>=2,make:()=>({name:pick(ULTRA_N)+' '+(S.club.town||'du club')+' '+ri(S.year-2,S.year)}),k:'Supporters',title:'Naissance d’un groupe de supporters',
  text:d=>`Une centaine de fidèles du virage fondent les « ${d.name} ». Chants, tifos, déplacements… et parfois des fumigènes. Ils demandent à rencontrer la présidence.`,
  ch:[{t:'Les accueillir et leur prêter un local',s:'Bonne relation, ferveur à domicile',f:d=>{S.ultras={name:d.name,rel:65,size:120,since:S.year,sec:0};S.mood=clamp(S.mood+4,0,100);return 'Les '+d.name+' promettent une ambiance de feu.';}},
      {t:'Rester à distance',s:'Relation neutre',f:d=>{S.ultras={name:d.name,rel:45,size:100,since:S.year,sec:0};return 'Le groupe s’installe dans le virage, sans plus.';}},
      {t:'Refuser tout dialogue',s:'Ambiance tendue',f:d=>{S.ultras={name:d.name,rel:22,size:80,since:S.year,sec:0};S.mood=clamp(S.mood-3,0,100);return 'Le groupe se forme quand même, et vous en veut déjà.';}}]},
 naming:{w:1,cond:()=>S.infra.stade""")
# match : ferveur, huis clos, réserve, presse
rep("      const d=userMatch(th.user,opp,me);","      const d=userMatch(th.user,opp,th.user?ultraBoost(me):me);")
rep("    fin('Billetterie',Math.max(0,rep.att-(rep.aboP||0))*S.ticket);\n",
    "    if(S.flags.huisClos){S.flags.huisClos=0;rep.att=0;rep.aboP=0;rep.huis=true;news('Match à huis clos : aucune recette, ambiance glaciale.','b');}\n    fin('Billetterie',Math.max(0,rep.att-(rep.aboP||0))*S.ticket);\n")
rep("  weeklyFinance(rep);\n","  weeklyFinance(rep);\n  ultrasTick(rep);if(S.reserve)reserveWeek(me);else reserveWeekFem();\n")
rep("  if(UI.multiRun)UI.multiLog.push(rep.res);else UI.queue.push({type:'report',d:rep});\n",
    "  if(UI.multiRun)UI.multiLog.push(rep.res);else UI.queue.push({type:'report',d:rep});\n  pressMaybe(rep);\n")
rep("  if(i.formation)fin('Centre de formation',-INFRA.formation.run[i.formation]/N);\n  if(S.flags.fem)",
    "  if(i.formation)fin('Centre de formation',-INFRA.formation.run[i.formation]/N);\n  if(S.reserve)fin('Équipe réserve',-RESCOST[S.div]/N);\n  if(S.flags.fem)")
rep("-(S.flags.fem?FEMCOST[S.div]/N:0);\n  const att=","-(S.flags.fem?FEMCOST[S.div]/N:0)-(S.reserve?RESCOST[S.div]/N:0);\n  const att=")
# légendes
rep("function sellPlayer(p,fee,club){S.players=S.players.filter(x=>x.id!==p.id);","function sellPlayer(p,fee,club){legendCheck(p,'Transfert');S.players=S.players.filter(x=>x.id!==p.id);")
rep("    if(p.contract<=0){leaving.push(pname(p)+' (fin de contrat)');","    if(p.contract<=0){legendCheck(Object.assign({},p,{s:null}),'Fin de contrat');leaving.push(pname(p)+' (fin de contrat)');")
rep("    if(p.age>=34&&R()<(p.age-33)*.3){leaving.push(pname(p)+' (retraite)');","    if(p.age>=34&&R()<(p.age-33)*.3){legendCheck(Object.assign({},p,{s:null}),'Retraite');leaving.push(pname(p)+' (retraite)');")
rep("  S.endSum=null;S.flags.tvLocal=S.flags.tvLocal||0;\n  setupSeason();","  teamsSeasonEnd(msgs);\n  S.endSum=null;S.flags.tvLocal=S.flags.tvLocal||0;\n  setupSeason();")
# Club : cartes vie du club
rep("  <div class=\"grid\">\n\n   <div class=\"card\"><h3>Historique</h3>","  <div class=\"grid\">\n   ${clubLifeCards()}\n   <div class=\"card\"><h3>Historique</h3>")
css="""
.ultra-band{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 14px;border-radius:6px;background:repeating-linear-gradient(135deg,var(--c1) 0 18px,var(--c2) 18px 36px);color:#fff;text-shadow:0 1px 3px #000c;font-family:var(--display);text-transform:uppercase;letter-spacing:.06em}
.ultra-band b{font-size:20px}.ultra-band span{font-family:var(--body);font-size:12px;text-transform:none;letter-spacing:0;background:#0009;padding:3px 7px;border-radius:4px}
.team-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid #1e2f25}.team-row:last-child{border-bottom:0}
.legends{display:grid;gap:12px}.legend{display:grid;grid-template-columns:54px 1fr;gap:12px;align-items:center}
.lshirt{position:relative;width:54px;height:58px;display:grid;place-items:center;background:linear-gradient(90deg,var(--c1) 0 50%,var(--c2) 50%);clip-path:polygon(22% 0,78% 0,100% 18%,88% 34%,82% 30%,82% 100%,18% 100%,18% 30%,12% 34%,0 18%);border-radius:3px}
.lshirt span{font:900 22px/1 var(--display);color:#fff;text-shadow:0 1px 3px #000,0 0 8px #000a}
.lshirt em{position:absolute;bottom:3px;font:700 8px/1 var(--body);text-transform:uppercase;color:#fff;background:#000a;padding:2px 3px;border-radius:2px;font-style:normal}
</style>"""
s=s.replace("</style>",css,1)
open(p,'w').write(s);print('ok')
