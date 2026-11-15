p='/home/claude/president/index.html';s=open(p).read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:80],s.count(a));s=s.replace(a,b)
mod=open('/home/claude/t/mod_real.js').read()
rep("Object.assign(EVENTS,TERR_EV);",mod+"\nObject.assign(EVENTS,TERR_EV);")
# création : club réel ou concurrence
rep("S.subsidyMult=(S.subsidyMult||1)*PROF[S.terr.prof].sub*clamp(Math.pow(S.terr.pop/40000,.12),.85,1.25);\n",
    "S.subsidyMult=(S.subsidyMult||1)*PROF[S.terr.prof].sub*clamp(Math.pow(S.terr.pop/40000,.12),.85,1.25);\n  if(UI.setup.real)setupRealClub(UI.setup.real);else{const cp=terrCompet(S.terr.n);S.terr.comp=cp.f;S.terr.compClubs=cp.clubs;}\n")
i=s.index("UI.tab='accueil';render();UI.queue.push({type:'objective',msgs:['Fondé en '+S.club.founded+', le club évolue en Régional 2")
j=s.index("]",i)
old=s[i:j+1]
s=s.replace(old,"UI.tab='accueil';render();UI.queue.push({type:'objective',msgs:[S.realClub?'Vous prenez la présidence de '+S.club.name+', en '+LV[S.div].n+'. Le club, son effectif, son stade et ses supporters vous attendent.':"+old[old.index("msgs:[")+6:-1]+"]",1)
# équipes réelles et rival géographique
rep("  {const ai=S.teams.filter(t=>!t.user);const old=S.rivalName&&ai.find(t=>t.name===S.rivalName);const rv=old||pick(ai);",
    "  applyRealTeams();\n  {const ai=S.teams.filter(t=>!t.user);let old=S.rivalName&&ai.find(t=>t.name===S.rivalName);\n   if(!old&&S.div>=4&&S.terr&&S.terr.reg){const geo=ai.filter(t=>{const r=t.real&&realFor(t.name);if(!r)return false;const c=r[1]&&commFind(r[1]);const reg=c?REGIONS[c[2]]:(REAL_EXTRA[r[0]]||{}).reg;return reg===S.terr.reg;});if(geo.length)old=geo.sort((a,b)=>b.rating-a.rating)[0];}\n   const rv=old||pick(ai);")
rep("  const ai=S.teams.filter(t=>!t.user);\n  if(!S.elite){","  const ai=S.teams.filter(t=>!t.user);\n  if(ai.some(t=>t.real)){ai.sort((a,b)=>b.rating-a.rating);const prev=S.elite||[];S.elite=ai.slice(0,3).map((t,k)=>{const o=prev.find(x=>x.name===t.name);return {name:t.name,base:o?o.base:[90,87,85][k]};});}\n  if(!S.elite){")
# écran de départ
rep('   <div class="fld">Situation de départ<div class="diff">','   ${realStartHtml()}\n   <div class="fld" ${UI.setup.real?\'style="display:none"\':\'\'}>Situation de départ<div class="diff">')
# fiche territoire : concurrence
rep("${t.rivalTown?' Rival historique : '+esc(t.rivalTown)+'.':''}</p>",
    "${t.rivalTown?' Rival historique : '+esc(t.rivalTown)+'.':''}${t.compClubs&&t.compClubs.length?' <b>Concurrence</b> : '+t.compClubs.map(esc).join(', ')+' — une partie du public lui reste fidèle.':''}</p>")
s=s.replace("</style>",""".start .diff button small{display:block}
</style>""",1)
open(p,'w').write(s);print('ok')
