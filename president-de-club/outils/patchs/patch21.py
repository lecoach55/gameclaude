p='/home/claude/president/index.html';s=open(p).read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:80],s.count(a));s=s.replace(a,b)
mod=open('/home/claude/t/mod_advice.js').read()
rep("Object.assign(EVENTS,TERR_EV);",mod+"\nObject.assign(EVENTS,TERR_EV);")
rep("   ${licenceCard()}\n   <div class=\"card\"><h3>À surveiller</h3>","   ${adviceCard()}\n   ${licenceCard()}\n   <div class=\"card\"><h3>À surveiller</h3>")
rep("    <p class=\"muted\" style=\"font-size:13px;margin:0\">Un billet cher remplit moins le stade et agace les supporters.",
    "    ${advInline(['ticket'])}\n    <p class=\"muted\" style=\"font-size:13px;margin:0\">Un billet cher remplit moins le stade et agace les supporters.")
rep("   <div id=\"aboSim\" class=\"muted\" style=\"font-size:13px\">${aboSimTxt()}</div></div>`;",
    "   <div id=\"aboSim\" class=\"muted\" style=\"font-size:13px\">${aboSimTxt()}</div>${advInline(['abo'])}</div>`;")
s=s.replace("</style>",""".advice{border-top:3px solid #9fd3ff}
.adv{display:grid;gap:6px;padding:10px 0;border-bottom:1px solid #1e2f25}.adv:last-of-type{border-bottom:0}
.adv.inline{padding:10px 12px;border:1px solid #2b4034;border-radius:8px;background:#ffffff06}
.adv-who{display:flex;gap:10px;align-items:center}.adv-who small{display:block;color:var(--muted);font-size:12px}
.adv p{margin:0;font-size:14px;line-height:1.45;font-style:italic}
</style>""",1)
open(p,'w').write(s);print('ok')
