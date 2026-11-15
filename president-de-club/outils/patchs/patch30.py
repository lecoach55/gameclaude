f='/home/claude/president/index.html';s=open(f).read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:70],s.count(a));s=s.replace(a,b)
rep("  S.myResults.push({j:S.week,opp:rep.opp.name,","  h2hAdd(rep.opp.name,rep.res,rep.gf,rep.ga,rep.home);\n  S.myResults.push({j:S.week,opp:rep.opp.name,")
rep("    ${cupNow?'<div class=\"alert g\">Coupe de France ('+CUP_R[S.cup.round]","    ${h2hLine(o)}\n    ${cupNow?'<div class=\"alert g\">Coupe de France ('+CUP_R[S.cup.round]")
add='''
/* ====================== Confrontations directes ====================== */
function h2hAdd(n,res,gf,ga,home){S.h2h=S.h2h||{};const h=S.h2h[n]||(S.h2h[n]={W:0,D:0,L:0,last:null});h[res==='V'?'W':res==='N'?'D':'L']++;h.last={s:gf+'-'+ga,y:seasonLabel(S.year),home:!!home};const k=Object.keys(S.h2h);if(k.length>150)delete S.h2h[k[0]];}
function h2hLine(o){const h=(S.h2h||{})[o.name];const tag=o.tag?`<span class="pill">${o.tag}</span> ${esc(o.last||'')}`:o.last?'Saison passée : '+esc(o.last):'';
  if(!h&&!tag)return '<div class="muted" style="font-size:13px">Première confrontation officielle entre les deux clubs.</div>';
  const n=h?h.W+h.D+h.L:0;
  return `<div class="spread muted" style="font-size:13px"><span>${h?`Face à face : ${n} match${n>1?'s':''} · <b class="good">${h.W} V</b> · ${h.D} N · <b class="bad">${h.L} D</b> · dernier : ${h.last.s} (${h.last.home?'dom.':'ext.'}, ${h.last.y})`:'Première confrontation officielle.'}</span><span>${tag}</span></div>`;}
'''
rep("/* ====================== Missions du recruteur ====================== */",add+"\n/* ====================== Missions du recruteur ====================== */")
open(f,'w').write(s);print('ok')
