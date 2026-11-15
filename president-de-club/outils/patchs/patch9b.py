p='/home/claude/president/index.html';s=open(p).read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:60],s.count(a));s=s.replace(a,b)
rep("    if(i>=6)S.rep=clamp(S.rep+1.5,0,100);\n",
"""    if(i>=6)S.rep=clamp(S.rep+1.5,0,100);
    if(i===5&&S.div<=2&&!S.cup.poucet){S.cup.poucet=true;fin('Coupe de France',5000);S.fans=Math.round(S.fans*1.08);S.mood=clamp(S.mood+6,0,100);S.rep=clamp(S.rep+2,0,100);news('Petit Poucet de la Coupe de France ! Le club amateur se hisse en 32es de finale : prime de 5 000 €, la presse nationale débarque.','g');}
""")
# indice de dérogation dans les alertes et la feuille de route
rep("a.push(['w','En cas de montée en '+LV[S.div+1].n+', il manque : '+r.map(x=>x.l.toLowerCase()).join(', ')+'.']);",
    "a.push(['w','En cas de montée en '+LV[S.div+1].n+', il manque : '+r.map(x=>x.l.toLowerCase()).join(', ')+'.'+(S.div+1>=3&&!S.deloc&&r.every(x=>x.need)?' Seul le stade manque : une dérogation (stade voisin, loyer) reste possible.':'')]);")
rep("""'+rq.map(r=>`<li class="${r.ok?'ok':''}">${esc(r.l)}</li>`).join('')+'</ul>'""",
    """'+rq.map(r=>`<li class="${r.ok?'ok':''}">${esc(r.l)}${r.need&&!r.ok&&t>=3?' <span class="muted">(dérogation possible)</span>':''}</li>`).join('')+'</ul>'""")
open(p,'w').write(s);print('ok')
