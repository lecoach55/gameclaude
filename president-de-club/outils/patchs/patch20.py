p='/home/claude/president/index.html';s=open(p).read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:80],s.count(a));s=s.replace(a,b)
mod=open('/home/claude/t/mod_pinfo.js').read()
rep("Object.assign(EVENTS,TERR_EV);",mod+"\nObject.assign(EVENTS,TERR_EV);")
# archive des joueurs partis
rep("  (p.moves=p.moves||[]).push({y:m.y,j:m.j,type,from,to,fee:m.fee});\n}",
    "  (p.moves=p.moves||[]).push({y:m.y,j:m.j,type,from,to,fee:m.fee});\n  if(dir==='out'){S.gone=S.gone||{};S.gone[p.id]={n:pname(p),pos:p.pos,age:p.age,ovr:p.ovr,how:type,y:m.y,to,hist:(p.hist||[]).slice(-12)};const k=Object.keys(S.gone);if(k.length>120)delete S.gone[k[0]];}\n}")
# marché
rep("<span class=\"pos ${p.pos}\">${p.pos}</span> ${esc(pname(p))}${p.scouted?' <span class=\"pill g\" title=\"Rapport du recruteur disponible\">supervisé</span>':''}</td>",
    "<span class=\"pos ${p.pos}\">${p.pos}</span> ${pl(p.id,pname(p))}${p.scouted?' <span class=\"pill g\" title=\"Rapport du recruteur disponible\">supervisé</span>':''}</td>")
# classements buteurs/passeurs
rep("<td><span class=\"pos ${x.pos}\">${x.pos}</span> ${esc(x.n)}</td><td class=\"${x.me?'':'muted'}\">${tc(x.club,16)}</td>",
    "<td><span class=\"pos ${x.pos}\">${x.pos}</span> ${x.me?esc(x.n):plAI(x.club,x.n)}</td><td class=\"${x.me?'':'muted'}\">${tc(x.club,16)}</td>")
# transferts
rep("<td><span class=\"pos ${m.pos}\">${m.pos}</span> ${esc(m.name)} <span class=\"muted\" style=\"font-size:12px\">${m.age} ans · ${m.ovr}</span></td>",
    "<td><span class=\"pos ${m.pos}\">${m.pos}</span> ${p?esc(m.name):pl(m.pid,m.name)} <span class=\"muted\" style=\"font-size:12px\">${m.age} ans · ${m.ovr}</span></td>")
# rapport de match
rep("    lineup.push({n:pshort(p),pos:e.slot,note,g,a});","    lineup.push({id:p.id,n:pshort(p),pos:e.slot,note,g,a});")
rep("<span class=\"pos ${l.pos}\">${l.pos}</span> ${esc(l.n)}${l.g?","<span class=\"pos ${l.pos}\">${l.pos}</span> ${l.id!=null?pl(l.id,l.n):esc(l.n)}${l.g?")
s=s.replace("</style>",""".plink{cursor:pointer;text-decoration:underline dotted rgba(244,196,48,.55);text-underline-offset:3px}.plink:hover{color:var(--flood)}
</style>""",1)
open(p,'w').write(s);print('ok')
