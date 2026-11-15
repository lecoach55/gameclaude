p='/home/claude/president/index.html';s=open(p).read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:70],s.count(a));s=s.replace(a,b)
# --- Derby : un rival désigné chaque saison
rep("  S.teams.forEach(t=>{if(!t.user)t.sq=genSq();});\n",
"""  S.teams.forEach(t=>{if(!t.user)t.sq=genSq();});
  {const ai=S.teams.filter(t=>!t.user);const old=S.rivalName&&ai.find(t=>t.name===S.rivalName);const rv=old||pick(ai);rv.derby=true;S.rivalName=rv.name;}
""")
rep("rep=Object.assign(d,{home:th.user,opp:{name:opp.name,rating:opp.rating},comp:L.n+' · Journée '+(S.week+1)});",
    "rep=Object.assign(d,{home:th.user,opp:{name:opp.name,rating:opp.rating,derby:!!opp.derby},comp:L.n+' · Journée '+(S.week+1)+(opp.derby?' · DERBY':'')});")
rep("  if(rep.home){rep.att=attendance(rep.opp);}",
    "  if(rep.home){rep.att=attendance(rep.opp,rep.opp.derby?1.4:1);}")
rep("  coachAfter(rep.res);\n",
"""  coachAfter(rep.res);
  if(rep.opp.derby){const v=rep.res==='V'?1:rep.res==='D'?-1:0;S.mood=clamp(S.mood+v*7,0,100);S.confidence=clamp(S.confidence+v*3,0,100);S.players.forEach(p=>{if(!p.loan)p.morale=clamp(p.morale+v*4,0,100);});
    news(v>0?'Derby gagné contre '+rep.opp.name+' ! La ville est à vous cette semaine.':v<0?'Derby perdu contre '+rep.opp.name+'. Les supporters ont la gueule de bois.':'Derby nul contre '+rep.opp.name+' : honneur sauf.',v>0?'g':v<0?'b':'');}
""")
# calendrier : pastille derby
rep("<td>${tc(o.name)} <span class=\"muted\" style=\"font-size:12px\">${S.week?rk+'e':''}</span></td>",
    "<td>${tc(o.name)}${o.derby?' <span class=\"pill b\">Derby</span>':''} <span class=\"muted\" style=\"font-size:12px\">${S.week?rk+'e':''}</span></td>")
# --- Capitaine
rep("function weeklyUpdates(){\n  const L=LV[S.div];\n",
"""function captain(){let c=S.captainId!=null&&getP(S.captainId);if(c&&!c.loan)return c;
  const yrs=p=>(p.hist||[]).filter(h=>h.own).length;const pool=S.players.filter(p=>!p.loan&&!p.youth&&p.age>=20);if(!pool.length)return null;
  c=pool.reduce((b,p)=>{const sc=p.ovr+Math.min(p.age,32)*1.1+yrs(p)*3+p.morale*.05;return !b||sc>b.sc?{p,sc}:b;},null).p;
  if(S.captainId!=null&&S.captainId!==c.id)news(pname(c)+' hérite du brassard de capitaine.','');S.captainId=c.id;return c;}
function weeklyUpdates(){
  const L=LV[S.div];
  {const c=captain();if(c){const pull=c.morale>=60?.04:c.morale<35?-.03:0;if(pull)S.players.forEach(p=>{if(p!==c&&!p.loan)p.morale=clamp(Math.round(p.morale+(pull>0?Math.max(0,(c.morale-p.morale))*pull+.3:-1)),0,100);});}}
""")
rep("function sellPlayer(p,fee,club){S.players=S.players.filter(x=>x.id!==p.id);",
    "function sellPlayer(p,fee,club){S.players=S.players.filter(x=>x.id!==p.id);if(S.captainId===p.id){S.captainId=null;S.players.forEach(x=>{x.morale=clamp(x.morale-5,0,100);});news('Le vestiaire accuse le coup : le capitaine '+pname(p)+' s’en va.','b');}")
rep("${p.youth?' <span class=\"pill y\">Jeune</span>':''}</span></td><td class=\"r\">${p.age}</td>",
    "${p.youth?' <span class=\"pill y\">Jeune</span>':''}${p.id===S.captainId?' <span class=\"capt\" title=\"Capitaine\">C</span>':''}</span></td><td class=\"r\">${p.age}</td>")
rep("     <div class=\"kpi\"><div class=\"l\">Moral</div><div class=\"v ${p.morale<35?'bad':''}\">${p.morale}</div></div>",
    "     <div class=\"kpi\"><div class=\"l\">Moral</div><div class=\"v ${p.morale<35?'bad':''}\">${p.morale}</div>${p.id===S.captainId?'<div class=\"muted\" style=\"font-size:12px\"><span class=\"capt\">C</span> capitaine : son moral déteint sur le vestiaire</div>':''}</div>")
rep("</style>",".capt{display:inline-grid;place-items:center;width:18px;height:18px;border-radius:50%;background:var(--flood);color:#1a1405;font:700 11px/1 var(--fd,inherit);vertical-align:1px;margin-left:4px}\n</style>")
open(p,'w').write(s);print('ok')
