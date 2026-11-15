import re
p='/home/claude/president/index.html';s=open(p).read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:80],s.count(a));s=s.replace(a,b)
data=open('/home/claude/t/terr/comm.js').read();mod=open('/home/claude/t/mod_terr.js').read()
rep("function migrate(){",data+mod+"\nfunction migrate(){")
n1=s.count("L.tick");n2=s.count("LV[S.div].tick")
s=s.replace("LV[S.div].tick*(S.terr?TP().w:1)","@@TK@@").replace("L.tick","tk()").replace("LV[S.div].tick","tk()").replace("@@TK@@","LV[S.div].tick*(S.terr?TP().w:1)")
print('tick repl',n1,n2)
rep("const fanCap=()=>LV[S.div].fcap*(1+S.rep/150);","const fanCap=()=>LV[S.div].fcap*(1+S.rep/150)*terrFan();")
rep("*(S.flags.careerSp||1));","*(S.flags.careerSp||1)*terrEco());")
rep("S.teams.push({id:i,name:clubName(used),","S.teams.push({id:i,name:clubNameLocal(used),")
rep("{const ai=S.teams.filter(t=>!t.user);const old=S.rivalName&&ai.find(t=>t.name===S.rivalName);const rv=old||pick(ai);rv.derby=true;S.rivalName=rv.name;}",
    "{const ai=S.teams.filter(t=>!t.user);const old=S.rivalName&&ai.find(t=>t.name===S.rivalName);const rv=old||pick(ai);\n   if(!old&&S.terr&&S.div<=3){const town=S.terr.rivalTown||(S.terr.rivalTown=terrNeighbors(3)[0]);if(town){const nm=S.rivalFull||(S.rivalFull=pick(PREF)+' '+town);if(!S.teams.some(t=>t.name===nm))rv.name=nm;}}\n   rv.derby=true;S.rivalName=rv.name;}")
rep("  S.club.start=S.year;\n","  S.club.start=S.year;\n  S.terr=terrFor(town,UI.setup.small);S.fans=Math.round(S.fans*clamp(Math.pow(S.terr.pop/40000,.3),.55,1.7));S.subsidyMult=(S.subsidyMult||1)*PROF[S.terr.prof].sub*clamp(Math.pow(S.terr.pop/40000,.12),.85,1.25);\n")
rep("""<input type="text" id="cTown" value="${esc(st.town||'Clichy')}" maxlength="28" oninput="UI.setup.town=this.value;A.pv()">""",
    """<input type="text" id="cTown" list="cList" autocomplete="off" value="${esc(st.town||'Clichy')}" maxlength="28" oninput="UI.setup.town=this.value;A.pv()"><datalist id="cList">${COMM.map(c=>`<option value="${c[0]}">${c[1]}</option>`).join('')}</datalist>""")
rep("  el.innerHTML=crestSVG(c[0],c[1],initials(nm),54,0)+`<div><div class=\"muted\" style=\"font-size:12px;text-transform:uppercase;letter-spacing:.1em\">Votre club</div><b>${esc(nm)}</b></div>`;};",
    "  el.innerHTML=crestSVG(c[0],c[1],initials(nm),54,0)+`<div><div class=\"muted\" style=\"font-size:12px;text-transform:uppercase;letter-spacing:.1em\">Votre club</div><b>${esc(nm)}</b></div>`+terrPreview();};")
rep("  return inv+sup+teams+leg;","  return terrCard()+inv+sup+teams+leg;")
# événements locaux
rep(" naming:{w:1,cond:()=>S.infra.stade"," ...TERR_EV,\n naming:{w:1,cond:()=>S.infra.stade")
# boost jeunes (politique de la ville)
rep("    const ovr=Math.round(L.str[0]-16+fl*1.6+fo*1+rf(-4,4));","    const ovr=Math.round(L.str[0]-16+fl*1.6+fo*1+rf(-4,4)+(S.flags.youthBoost||0)*.5);")
s=s.replace("</style>",""".terrpv{grid-column:1/-1;font-size:13.5px;line-height:1.45;padding:10px 12px;border-radius:8px;background:#ffffff08;border:1px solid var(--line)}
.terrpv select{margin-left:6px}
.card.terr{border-top:3px solid var(--flood)}
</style>""",1)
open(p,'w').write(s);print('ok')
