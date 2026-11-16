f='/home/claude/president/index.html';s=open(f).read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:70],s.count(a));s=s.replace(a,b)
rep("""    <div><h3 style="font-size:17px;margin-bottom:6px">Saison par saison</h3>""","""    ${careerFrise(hist.slice().reverse())}
    <div><h3 style="font-size:17px;margin-bottom:6px">Saison par saison</h3>""")
add=r'''
/* ====================== Frise de carrière ====================== */
function careerFrise(h){
  if(!h.length)return '';h=h.slice(-12);
  const bw=56,W=h.length*bw+10,H=118,mx=Math.max(10,...h.map(x=>x.mj||0));
  let g='';
  h.forEach((x,i)=>{const own=x.club===S.club.name||/\(prêt/.test(x.club)&&false;const cl=x.club.replace(/ \(.*\)$/,'');
    const [c1,c2]=own?[S.club.c1,S.club.c2]:teamLook(cl);const bh=Math.max(4,(x.mj||0)/mx*58),X=5+i*bw;
    const prev=i?h[i-1].club.replace(/ \(.*\)$/,''):null;
    g+=`<rect x="${X+6}" y="${74-bh}" width="${bw-12}" height="${bh}" rx="3" fill="${c1}" stroke="${c2}" stroke-width="1.5"/>`;
    if((x.g||0)>0)g+=`<text x="${X+bw/2}" y="${70-bh}" text-anchor="middle" style="font:700 10px var(--mono);fill:var(--flood)">${x.g}⚽</text>`;
    g+=`<text x="${X+bw/2}" y="88" text-anchor="middle" style="font:600 9.5px var(--mono);fill:var(--muted,#8fa196)">${esc(String(x.y).slice(2,7))}</text>`;
    if(cl!==prev)g+=`<text x="${X+4}" y="104" style="font:700 9.5px Barlow, sans-serif;fill:${own?'var(--flood)':'#cfd8cf'}">${esc(cl.length>14?cl.slice(0,13)+'…':cl)}</text>`;
  });
  g+=`<line x1="5" x2="${W-5}" y1="74.5" y2="74.5" stroke="#3a4a41"/>`;
  return `<div><h3 style="font-size:17px;margin-bottom:6px">Frise de carrière</h3><div class="tbl-wrap" style="overflow-x:auto"><svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Frise de carrière : matchs joués et buts par saison">${g}</svg></div><div class="muted" style="font-size:11.5px">Hauteur : matchs joués · ⚽ buts · couleurs du club de la saison</div></div>`;
}
'''
rep("/* ====================== Missions du recruteur ====================== */",add+"\n/* ====================== Missions du recruteur ====================== */")
open(f,'w').write(s);print('ok')
