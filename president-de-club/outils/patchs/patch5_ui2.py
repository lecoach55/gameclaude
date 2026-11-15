p='/home/claude/president/index.html'; s=open(p).read()
def rep(old,new,cnt=1):
    global s
    n=s.count(old); assert n==cnt,(n,old[:100]); s=s.replace(old,new)
def func(name,new):
    global s
    key='\nfunction '+name+'('
    i=s.index(key)+1; j=s.index('\n}\n',i)+3
    s=s[:i]+new.strip('\n')+'\n'+s[j:]

# ---------- tableau d'affichage avec pictogrammes et tendances
rep("""    <div class="board">
      <div class="cell"><div class="lab">Trésorerie</div><div class="val ${S.cash<0?'neg':''}">${money(S.cash)}</div></div>
      <div class="cell"><div class="lab">Classement</div><div class="val">${S.week?pos+'<span style="font-size:15px">e</span>':'—'}<span style="font-size:15px;color:var(--muted)"> / ${L.teams}</span></div></div>
      <div class="cell"><div class="lab">Confiance de l’AG</div>""",
"""    <div class="board">
      <div class="cell"><div class="lab">${ico('finances',13)}Trésorerie</div><div class="val ${S.cash<0?'neg':''}">${money(S.cash)}${dCash?`<span class="delta ${dCash>0?'up':'dn'}">${dCash>0?'▲':'▼'} ${money(Math.abs(dCash))}</span>`:''}</div></div>
      <div class="cell"><div class="lab">${ico('classement',13)}Classement</div><div class="val">${S.week?pos+'<span style="font-size:15px">e</span>':'—'}<span style="font-size:15px;color:var(--muted)"> / ${L.teams}</span>${dPos?`<span class="delta ${dPos>0?'up':'dn'}">${dPos>0?'▲':'▼'} ${Math.abs(dPos)}</span>`:''}</div></div>
      <div class="cell"><div class="lab">${ico('club',13)}Confiance de l’AG</div>""")
rep("""<div class="cell"><div class="lab">Supporters</div>""", """<div class="cell"><div class="lab">${ico('users',13)}Supporters</div>""")
rep("""<div class="cell"><div class="lab">Force d’équipe</div>""", """<div class="cell"><div class="lab">${ico('bolt',13)}Force d’équipe</div>""")
rep("""<div class="cell"><div class="lab">Calendrier</div>""", """<div class="cell"><div class="lab">${ico('calendrier',13)}Calendrier</div>""")
rep("  const dot={staff:!S.staff.coach,", """  const tc_=S.track||{},cs=tc_.cash||[],ps_=tc_.pos||[];
  const dCash=cs.length>1?Math.round(cs[cs.length-1]-cs[cs.length-2]):0,dPos=ps_.length>1?ps_[ps_.length-2]-ps_[ps_.length-1]:0;
  document.documentElement.style.setProperty('--c1',S.club.c1);document.documentElement.style.setProperty('--c2',S.club.c2);
  const dot={staff:!S.staff.coach,""")
rep("""${tabs.map(([k,n])=>`<button class="${UI.tab===k?'on':''}" onclick="A.tab('${k}')">${n}""",
    """${tabs.map(([k,n])=>`<button class="${UI.tab===k?'on':''}" onclick="A.tab('${k}')">${ico(k)}${n}""")
# animation uniquement au changement d'onglet
rep("A.tab=function(t){UI.tab=t;render();", "A.tab=function(t){UI.tab=t;UI.enter=true;render();")
rep("  enhanceTables(document.getElementById('main'),UI.tab);\n}",
    "  enhanceTables(document.getElementById('main'),UI.tab);\n  if(UI.enter){const m=document.getElementById('main');m.classList.add('enter');UI.enter=false;setTimeout(()=>m.classList.remove('enter'),700);}\n}")

# ---------- accueil : affiche du match + deux colonnes
rep("""    nextHtml=`<div class="card hl"><header><h3>Prochain match · J${S.week+1}</h3><span class="pill y">${nx.home?'Domicile':'Extérieur'}</span></header>
    <div class="match-next"><div class="t">${esc(nx.home?S.club.name:o.name)}</div><div class="vs">VS</div><div class="t">${esc(nx.home?o.name:S.club.name)}</div></div>""",
"""    const hn=nx.home?S.club.name:o.name,an=nx.home?o.name:S.club.name;
    nextHtml=`<div class="card hl"><header><h3>Prochain match · J${S.week+1}</h3><span class="pill y">${nx.home?'À domicile':'À l’extérieur'}</span></header>
    <div class="hero"><div class="team ${nx.home?'me':''}">${teamCrest(hn,64)}<b>${esc(hn)}</b></div><div class="mid"><span class="vs">VS</span><small>${matchDate(S.week)}</small><small>${L.n}</small></div><div class="team ${nx.home?'':'me'}">${teamCrest(an,64)}<b>${esc(an)}</b></div></div>""")
rep("""  return `<div class="grid g2">${nextHtml}
  <div class="card"><header><h3>Situation</h3>""", """  return `<div class="home-cols"><div>${nextHtml}
   <div class="card"><header><h3>Trajectoire</h3><span class="muted" style="font-size:12px"><span class="good">▌</span> montée · <span class="bad">▌</span> relégation</span></header>${chart}</div>
  </div><div>
  <div class="card"><header><h3>Situation</h3>""")
rep("""  </div></div>
  <div class="grid g2">
   <div class="card"><header><h3>Trajectoire</h3><span class="muted" style="font-size:12px"><span class="good">▌</span> montée · <span class="bad">▌</span> relégation</span></header>${chart}</div>
   <div class="card"><h3>À surveiller</h3>""", """  </div>
   <div class="card"><h3>À surveiller</h3>""")
rep("""<div class="alert g">Tout est sous contrôle.</div>'}</div></div>
  </div>
  <div class="card"><h3>Fil du club</h3><div class="feed">${S.news.map(n=>`<div><b>${esc(n.w)}</b><span class="${n.type==='b'?'bad':''}">${esc(n.t)}</span></div>`).join('')}</div></div>`;""",
"""<div class="alert g">Tout est sous contrôle.</div>'}</div></div>
   <div class="card"><h3>Fil du club</h3><div class="feed">${S.news.slice(0,30).map(n=>`<div><b>${esc(n.w)}</b><span class="${n.type==='b'?'bad':n.type==='g'?'g':''}">${esc(n.t)}</span></div>`).join('')}</div></div>
  </div></div>`;""")
# mini-classement avec blasons
rep("""<td>${p}</td><td>${esc(t.name)}</td><td class="r">${t.P}</td>""", """<td>${p}</td><td>${tc(t.name)}</td><td class="r">${t.P}</td>""")
open(p,'w').write(s); print('ok part2')
