p='/home/claude/president/index.html';s=open(p).read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:80],s.count(a));s=s.replace(a,b)
rep("E.log.push({r:'J'+(i+1),","E.log.push({w:S.week,r:'J'+(i+1),")
rep("E.log.push({r:KO_N[K.r]+","E.log.push({w:S.week,r:KO_N[K.r]+")
import re
i=s.index("function starSVG(c){");j=s.index("\n",i)
s=s[:i]+"""function starSVG(c,sz){sz=sz||20;const pts=[...Array(10)].map((_,k)=>{const a=-Math.PI/2+k*Math.PI/5,r=k%2?4.2:10;return (12+r*Math.cos(a)).toFixed(2)+','+(12+r*Math.sin(a)).toFixed(2);}).join(' ');return `<svg viewBox="0 0 24 24" width="${sz}" height="${sz}" aria-hidden="true"><polygon points="${pts}" fill="${c}"/></svg>`;}"""+s[j:]
css="""
/* Europe */
.card.euro{border-color:color-mix(in srgb,var(--ec) 45%,transparent);background:linear-gradient(135deg,color-mix(in srgb,var(--ec) 14%,transparent),transparent 55%),var(--card,#111)}
.card.euro h3{display:flex;align-items:center;gap:8px}
.estar{display:inline-flex;filter:drop-shadow(0 0 6px color-mix(in srgb,var(--ec) 60%,transparent))}
.flag{display:inline-block;font:700 10px/1 var(--fd,inherit);letter-spacing:.06em;padding:3px 5px;border-radius:4px;background:#ffffff14;color:var(--muted,#9aa);vertical-align:1px}
tr.eur td{background:color-mix(in srgb,var(--ec) 8%,transparent)}
tr.eur td:first-child{color:var(--ec);font-weight:700;box-shadow:inset 3px 0 0 var(--ec)}
.pill.eu{border-color:color-mix(in srgb,var(--ec,#8fb3ff) 60%,transparent);color:var(--ec,#8fb3ff)}
tr.eu1 td:first-child{box-shadow:inset 3px 0 0 var(--good)}tr.eu2 td:first-child{box-shadow:inset 3px 0 0 var(--flood)}tr.eu3 td:first-child{box-shadow:inset 3px 0 0 #ff6a5c55}
.mbox.euro-rep{border-color:var(--ec);box-shadow:0 0 0 1px var(--ec),0 30px 80px #000c,0 0 60px color-mix(in srgb,var(--ec) 25%,transparent)}
</style>"""
rep("</style>",css)
open(p,'w').write(s);print('ok')
