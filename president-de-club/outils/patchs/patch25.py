p='/home/claude/president/index.html';s=open(p).read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:80],s.count(a));s=s.replace(a,b)
mod=open('/home/claude/t/mod_roles.js').read()
rep("Object.assign(EVENTS,TERR_EV);",mod+"\nObject.assign(EVENTS,TERR_EV);")
rep("  const val=e=>e.p.ovr*(0.8+0.2*e.p.fit/100)-e.pen;","  const val=e=>(e.eff!=null?e.eff:e.p.ovr-e.pen)*(0.8+0.2*e.p.fit/100);")
rep("  ensureCoach(c);\n  S.tactic.formation=S.req.formation||c.cur;","  ensureCoach(c);\n  coachPickFormation();\n  S.tactic.formation=S.req.formation||c.cur;")
# effectif : rôle
rep("${esc(pname(p))}${inXI.has(p.id)?'</b>':''}${p.youth?' <span class=\"pill y\">Jeune</span>':''}",
    "${esc(pname(p))}${inXI.has(p.id)?'</b>':''} <span class=\"role\" title=\"${ROLE[ensureRole(p).role].n}${p.role2?' / '+ROLE[p.role2].n:''}\">${p.role}${p.role2?'/'+p.role2:''}</span>${p.youth?' <span class=\"pill y\">Jeune</span>':''}")
rep("inXI.has(p.id)&&!p.inj?'<span class=\"pill g\">Titulaire</span>':''}</td>",
    "inXI.has(p.id)&&!p.inj?(()=>{const e=st.xi.find(x=>x.p.id===p.id);return `<span class=\"pill g\">Titulaire · ${e.role}</span>${e.pen?` <span class=\"pill ${e.pen>=8?'b':'w'}\" title=\"Joue hors de son rôle naturel\">à contre-emploi</span>`:''}`;})():''}</td>")
rep("<p class=\"muted\" style=\"font-size:12.5px;margin:0\">L’entraîneur choisit le système,","${S.tactic.why?`<div class=\"alert g\" style=\"font-size:13.5px\">${esc(S.tactic.why)}</div>`:''}<p class=\"muted\" style=\"font-size:12.5px;margin:0\">L’entraîneur choisit le système selon les profils de ses joueurs,")
# fiche : rôle et meilleurs rôles
rep("     <div class=\"kpi\"><div class=\"l\">Note</div><div class=\"v gold\">${p.ovr}</div></div>\n     <div class=\"kpi\"><div class=\"l\">Potentiel</div><div class=\"v\">${p.pot}</div></div>",
    "     <div class=\"kpi\"><div class=\"l\">Rôle</div><div class=\"v\" style=\"font-size:17px\">${ROLE[ensureRole(p).role].n}</div>${p.role2?'<div class=\"muted\" style=\"font-size:12px\">aussi : '+ROLE[p.role2].n.toLowerCase()+'</div>':''}</div>\n     <div class=\"kpi\"><div class=\"l\">Note</div><div class=\"v gold\">${p.ovr}</div></div>\n     <div class=\"kpi\"><div class=\"l\">Potentiel</div><div class=\"v\">${p.pot}</div></div>")
rep("    <div class=\"grid g2\" style=\"align-items:center\">${radar(at)}<div style=\"display:grid;gap:6px\">",
    "    <div class=\"rolefit\"><b>Rendement selon le rôle</b>${roleBest(p).slice(0,4).map((x,i)=>`<span class=\"${i===0?'good':''}\">${ROLE[x.r].n} <b>${x.v}</b></span>`).join('')}</div>\n    <div class=\"grid g2\" style=\"align-items:center\">${radar(at)}<div style=\"display:grid;gap:6px\">")
# terrain : rôle au-dessus du joueur
rep("    g+=`<g><circle cx=\"${x}\" cy=\"${y}\" r=\"20\"","    if(e.role)g+=`<text x=\"${x}\" y=\"${y-25}\" text-anchor=\"middle\" style=\"font:700 10px var(--mono);fill:#fff;opacity:.75\">${e.role}</text>`;\n    g+=`<g><circle cx=\"${x}\" cy=\"${y}\" r=\"20\"")
# marché : rôle
rep("<span class=\"pos ${p.pos}\">${p.pos}</span> ${plk(p.id,pname(p))}${p.scouted?","<span class=\"pos ${p.pos}\">${p.pos}</span> ${plk(p.id,pname(p))} <span class=\"role\">${ensureRole(p).role}</span>${p.scouted?")
s=s.replace("</style>",""".role{display:inline-block;font:700 10px/1 var(--mono);padding:3px 5px;border-radius:4px;background:#ffffff12;color:#cfe3d6;vertical-align:1px;letter-spacing:.03em}
.rolefit{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;font-size:13px;padding:8px 10px;border-radius:8px;background:#ffffff06;border:1px solid var(--line)}
.rolefit span b{margin-left:3px}
</style>""",1)
open(p,'w').write(s);print('ok')
