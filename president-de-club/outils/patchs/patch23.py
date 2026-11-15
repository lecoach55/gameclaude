p='/home/claude/president/index.html';s=open(p).read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:80],s.count(a));s=s.replace(a,b)
mod=open('/home/claude/t/mod_sreport.js').read()
rep("Object.assign(EVENTS,TERR_EV);",mod+"\nObject.assign(EVENTS,TERR_EV);")
i=s.index("Nouvelle prospection");j=s.rindex("<button",0,i)
s=s[:j]+'<button class="btn sm pri" onclick="A.squadReport()">📋 Rapport du recruteur</button>'+s[j:]
rep("  if(q.type==='report'&&UI.multiRun){nextQueue();return;}","  if((q.type==='report'||q.type==='sreport')&&UI.multiRun){nextQueue();return;}\n  if(q.type==='sreport'){A.squadReport(true);return;}")
rep("  pressMaybe(rep);\n","  pressMaybe(rep);\n  if(!UI.multiRun&&(S.week===1||S.week===winInfo().h-1)&&!dlgOn('recruit'))UI.queue.push({type:'sreport'});\n")
# conseil : lire le rapport
rep("  // recrutement\n","  if(windowOpen())add('sreport','recruteur',2,'J’ai préparé un point complet sur l’effectif : les postes à renforcer et les joueurs dont on pourrait se séparer.',[['Lire le rapport','A.squadReport()']]);\n  // recrutement\n")
s=s.replace("</style>",""".sr-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.sr-box{display:grid;gap:2px;text-align:center;padding:8px;border-radius:8px;border:1px solid var(--line);font-size:12.5px}
.sr-box b{font:900 22px/1 var(--display)}.sr-box.ok{border-color:#5ccf8866}.sr-box.warn{border-color:#f2a03a99;background:#f2a03a10}.sr-box.bad{border-color:#ff6a5c99;background:#ff6a5c12}
.sr-pos{display:grid;gap:6px;padding:10px 12px;border:1px solid var(--line);border-radius:8px;background:#ffffff05;margin-bottom:8px}
.sr-cand{display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:13.5px;padding:6px 0;border-top:1px solid #1e2f25}
</style>""",1)
open(p,'w').write(s);print('ok')
