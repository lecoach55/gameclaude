import re
f='/home/claude/president/index.html';s=open(f).read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:70],s.count(a));s=s.replace(a,b)
# 1) conflit de classe .legend (légendes du club) qui cassait les légendes des graphiques
rep(".legends{display:grid;gap:12px}.legend{display:grid;grid-template-columns:54px 1fr;gap:12px;align-items:center}",".legends{display:grid;gap:12px}.lgd-row{display:grid;grid-template-columns:54px 1fr;gap:12px;align-items:center}")
rep('<div class="legends">${lg.map((l,i)=>`<div class="legend">','<div class="legends">${lg.map((l,i)=>`<div class="lgd-row">')
# 2) supprimer les anciennes crestSVG et jersey (remplacées par kit.js)
i=s.index("function crestSVG(c1,c2,ini,size,v){");j=s.index("function teamLook(name){");s=s[:i]+s[j:]
i=s.index("function jersey(p,size){");j=s.index("function oddsFor(me,t,home){");s=s[:i]+s[j:]
rep("function teamCrest(name,size){const [a,b,v]=teamLook(name);return crestSVG(a,b,initials(name),size,v);}",
"function teamCrest(name,size){if(S&&name===S.club.name){const k=clubKit();return crestSVG(S.club.c1,S.club.c2,initials(name),size,k.cr,k.em);}const [a,b,v,em]=teamLook(name);return crestSVG(a,b,initials(name),size,v,em);}")
rep("const a=dark(c[0])?c[1]:c[0],b=dark(c[0])?c[0]:c[1];return [a,b,(h>>>7)%4];","const a=dark(c[0])?c[1]:c[0],b=dark(c[0])?c[0]:c[1];return [a,b,(h>>>7)%8,((h>>>11)%10)<4?1+((h>>>13)%6):0];")
rep("function crest(c1,c2,name,size){return crestSVG(c1,c2,initials(name),size,0);}","function crest(c1,c2,name,size){if(S&&name===S.club.name){const k=clubKit();return crestSVG(c1,c2,initials(name),size,k.cr,k.em);}return crestSVG(c1,c2,initials(name),size,0);}")
kit=open('/home/claude/t/kit.js').read()
rep("/* ====================== Missions du recruteur ====================== */",kit+"\n/* ====================== Missions du recruteur ====================== */")
# 3) stade : spectateurs, panneaux, abords
rep("  const D=[0,8,12,16,20,24,28,32,36,40][st];","""  const D=[0,8,12,16,20,24,28,32,36,40][st];
  const hr=(S.myResults||[]).filter(r=>r.home&&r.att),fillR=hr.length?clamp(hr.reduce((a,r)=>a+r.att,0)/hr.length/Math.max(1,cap()),.05,1):.45;
  let rs=Math.abs(hashS(S.club.name))%997+1;const rnd=()=>{rs=(rs*16807)%2147483647;return (rs-1)/2147483646;};
  const crowd=(x,y,w,h)=>{const n=Math.min(70,Math.round(w*h/38*fillR));let o='';const cs=[S.club.c1,S.club.c2,'#e9efe5'];for(let k=0;k<n;k++)o+=`<rect x="${(x+1+rnd()*(w-3)).toFixed(1)}" y="${(y+1+rnd()*(h-3)).toFixed(1)}" width="1.8" height="1.8" fill="${cs[k%3]}" opacity=".9"/>`;return o;};""")
rep("const stand=(x,y,w,h,side)=>{let r=`<rect x=\"${x}\" y=\"${y}\" width=\"${w}\" height=\"${h}\" fill=\"${seat}\"/>`;","const stand=(x,y,w,h,side)=>{let r=`<rect x=\"${x}\" y=\"${y}\" width=\"${w}\" height=\"${h}\" fill=\"${seat}\"/>`+crowd(x,y,w,h);")
rep("  // pelouse\n","""  // main courante et public debout (petits stades)
  if(st<=1){g+=`<rect x="${px-14}" y="${py-14}" width="${pw+28}" height="${ph+28}" fill="none" stroke="#c9d4c9" stroke-opacity=".5" stroke-dasharray="3 2"/>`;const n=Math.round(40*fillR);for(let k=0;k<n;k++){const t=rnd();const side=k%3;const x=side===0?px-12+t*(pw+24):side===1?px-19:px+pw+15,y=side===0?py+ph+15:py-8+t*(ph+16);g+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.3" fill="${k%2?S.club.c1:'#e9efe5'}"/>`;}}
  // abords : arbres, parking
  for(let k=0;k<9;k++){const x=k<5?130+(k%2)*14:372+(k%2)*14,y=k<5?20+k*44:30+(k-5)*52;g+=`<circle cx="${x}" cy="${y}" r="${6+(k%3)}" fill="#14301f"/><circle cx="${x-1.5}" cy="${y-1.5}" r="${4+(k%3)}" fill="#1d4a2c"/>`;}
  if(st>=2){g+=`<rect x="300" y="232" width="92" height="22" rx="2" fill="#1a211d" stroke="#2e3a33"/>`;const nc=Math.min(10,2+st);for(let k=0;k<nc;k++)g+=`<rect x="${303+k*9}" y="${235+(k%2)*9}" width="6" height="8" rx="1.5" fill="${['#c9d4c9','#6c7a86','#a33','#e8c214','#335'][k%5]}"/>`;}
  // pelouse
""")
rep("  // éclairage\n","""  // panneaux publicitaires le long de la touche
  {const sp=S.spons||{},names=[sp.panneaux,sp.maillot,sp.manche,sp.dos].filter(Boolean).map(c=>c.b.split(' ').slice(-2).join(' ').toUpperCase().slice(0,14));if(names.length&&st>=1){const n=st>=4?4:2,bw=(pw-8)/n;for(let k=0;k<n;k++){const nm=names[k%names.length];g+=`<rect x="${px+4+k*bw}" y="${py-5}" width="${bw-3}" height="4.5" fill="#0b1220" stroke="${S.club.c2}" stroke-width=".4"/><text x="${px+4+k*bw+(bw-3)/2}" y="${py-1.6}" text-anchor="middle" font-size="3.4" font-family="Barlow, sans-serif" font-weight="800" fill="#e9efe5">${esc(nm)}</text>`;}}}
  // éclairage
""")
rep(".sp-off{display:flex;",".kitrow{display:flex;gap:14px;align-items:center;justify-content:center;flex-wrap:wrap;margin:4px 0 10px}.kitfig{margin:0;text-align:center}.kitfig figcaption{font-size:12px;color:var(--muted,#8fa196)}\n.sp-off{display:flex;")
open(f,'w').write(s);print('ok')
s=open(f).read();a="   <div class=\"card\"><h3>Ce que pensent les adhérents</h3>";s=s.replace(a,"   ${kitCard()}\n"+a);open(f,"w").write(s)
