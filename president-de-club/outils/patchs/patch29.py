f='/home/claude/president/index.html';s=open(f).read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:70],s.count(a));s=s.replace(a,b)
lg=open('/home/claude/t/mod_league.js').read()
rep("/* ====================== Missions du recruteur ====================== */",lg+"\n/* ====================== Missions du recruteur ====================== */")
rep("function computeSeasonEnd(){S._deloc=null;S._guar=null;","function computeSeasonEnd(){S._deloc=null;S._guar=null;leagueSnap();")
rep("  applyRealTeams();\n  {const ai=S.teams.filter(t=>!t.user);let old=","  applyRealTeams();leagueCarry();\n  {const ai=S.teams.filter(t=>!t.user);let old=")
rep("<td>${i+1}</td><td>${tc(t.name)}</td>","<td>${i+1}</td><td>${tc(t.name)}${t.tag?` <span class=\"pill\" title=\"${esc(t.last||'')}\" style=\"font-size:10.5px\">${t.tag}</span>`:t.last&&!t.user?` <span class=\"muted\" style=\"font-size:11.5px\" title=\"Classement la saison passée\">(${esc(t.last)})</span>`:''}</td>")
open(f,'w').write(s);print('ok')
