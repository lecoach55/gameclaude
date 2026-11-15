f='/home/claude/president/index.html';s=open(f).read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:70],s.count(a));s=s.replace(a,b)
m=open('/home/claude/t/mod_bilan.js').read()
rep("/* ====================== Missions du recruteur ====================== */",m+"\n/* ====================== Missions du recruteur ====================== */")
rep("  ${seasonVisual()}\n","  ${seasonVisual()}\n  ${seasonExtras(e)}\n")
rep("A.newSeason=function(){\n  const e=S.endSum||computeSeasonEnd();","A.newSeason=function(){\n  const e=S.endSum||computeSeasonEnd();if(!e.ext)e.ext=seasonExtrasData();")
rep("  const C=S.spons,c=C[k],start=c&&S.year<=c.until?c.until+1:S.year;","  const C=S.spons,c=C[k],start=c&&S.year<=c.until?c.until+1:S.year;S.spSigned=(S.spSigned||[]).filter(x=>x.y>=S.year-1);S.spSigned.push({y:S.year,b:o.b,k});")
rep(".sp-off{display:flex;",".bxgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:8px;margin:6px 0}.bx{padding:8px 10px;border:1px solid #1e2f25;border-radius:8px;font-size:13px}.bx>b{display:block;margin-bottom:2px;font-size:13.5px}\n.sp-off{display:flex;")
open(f,'w').write(s);print('ok')
