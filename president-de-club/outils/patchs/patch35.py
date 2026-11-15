f='/home/claude/president/index.html';s=open(f).read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:70],s.count(a));s=s.replace(a,b)
# accent aux couleurs du club
rep("document.documentElement.style.setProperty('--c1',S.club.c1);document.documentElement.style.setProperty('--c2',S.club.c2);",
"document.documentElement.style.setProperty('--c1',S.club.c1);document.documentElement.style.setProperty('--c2',S.club.c2);document.documentElement.style.setProperty('--cacc',clubAccent());")
rep(".card>header>h3::before,.card>h3::before{content:'';width:4px;height:17px;border-radius:2px;background:linear-gradient(180deg,var(--flood),#c68f00);flex:none}",
".card>header>h3::before,.card>h3::before{content:'';width:4px;height:17px;border-radius:2px;background:linear-gradient(180deg,var(--cacc,var(--flood)),var(--flood));flex:none}\n.agenda{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}\n.ag{display:flex;gap:10px;align-items:center;text-align:left;padding:9px 10px;border-radius:10px;border:1px solid #1e2f25;background:rgba(255,255,255,.025);color:inherit;font:inherit;cursor:pointer;min-width:0;transition:border-color .15s,background .15s}\n.ag:hover,.ag:focus-visible{border-color:var(--cacc,var(--flood));background:rgba(255,255,255,.05)}\n.ag .ag-i{font-size:20px;line-height:1;flex:none;width:30px;height:30px;display:grid;place-items:center;border-radius:8px;background:rgba(255,255,255,.05)}\n.ag small{display:block;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted,#8fa196)}\n.ag b{display:block;font-size:13.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.ag.warn{border-color:rgba(232,194,20,.45)}.ag.bad{border-color:rgba(255,107,95,.5)}.ag.good b{color:var(--good)}\n.only-m{display:none}@media (max-width:900px){.only-d{display:none}.only-m{display:block}.agenda{grid-template-columns:1fr 1fr}}")
# mise en page de l'accueil
rep("""  return `<div class="home-cols"><div>${nextHtml}
   <div class="card"><header><h3>Trajectoire</h3>""","""  const feed=`<div class="card"><h3>Fil du club</h3><div class="feed">${S.news.slice(0,30).map(n=>`<div><b>${esc(n.w)}</b><span class="${n.type==='b'?'bad':n.type==='g'?'g':''}">${esc(n.t)}</span></div>`).join('')}</div></div>`;
  return `<div class="home-cols"><div>${nextHtml}
   ${agendaCard()}
   <div class="card"><header><h3>Trajectoire</h3>""")
rep("""${chart}</div>
  </div><div>""","""${chart}</div>
   <div class="only-d">${feed}</div>
  </div><div>""")
rep("""   <div class="card"><h3>Fil du club</h3><div class="feed">${S.news.slice(0,30).map(n=>`<div><b>${esc(n.w)}</b><span class="${n.type==='b'?'bad':n.type==='g'?'g':''}">${esc(n.t)}</span></div>`).join('')}</div></div>
  </div></div>`;""","""   <div class="only-m">${feed}</div>
  </div></div>`;""")
add=r'''
/* ====================== Accueil : agenda du président et couleurs du club ====================== */
function hexLum(h){h=(h||'#000').replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16);const r=(n>>16)&255,g=(n>>8)&255,b=n&255;const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);};return .2126*f(r)+.7152*f(g)+.0722*f(b);}
function hexSat(h){h=(h||'#000').replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16);const r=(n>>16)&255,g=(n>>8)&255,b=n&255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b);return mx?(mx-mn)/mx:0;}
// couleur d'accent lisible sur fond sombre : couleur 1 du club, sinon couleur 2, sinon l'or du jeu
function clubAccent(){const ok=c=>{const l=hexLum(c);return l>.06&&l<.85&&hexSat(c)>.25;};return ok(S.club.c1)?S.club.c1:ok(S.club.c2)?S.club.c2:'#e8c214';}
function nextDerby(){const ri=S.teams.findIndex(t=>t.name===S.rivalName);if(ri<0||!S.sched)return null;for(let k=S.week;k<S.N;k++){for(const [h,a] of S.sched[k]){if((S.teams[h].user&&a===ri)||(S.teams[a].user&&h===ri))return {j:k+1,home:S.teams[h].user};}}return null;}
function agendaCard(){
  const it=[];const add=(ic,t,v,tab,cls)=>it.push(`<button class="ag ${cls||''}" onclick="A.tab('${tab}')"><span class="ag-i" aria-hidden="true">${ic}</span><span style="min-width:0"><small>${t}</small><b>${v}</b></span></button>`);
  const wi=winInfo();
  add('🔁','Mercato',wi.cur?'Ouvert · jusqu’à J'+(wi.cur.b+1):wi.next?'Ouvre après J'+wi.next.a:'Cet été','mercato',wi.cur?'good':'');
  const rec=slvl('recruteur');
  add('🕵️','Recruteur',S.mission?(S.mission.end-S.gw<=1?'Retour au prochain match':'En mission · '+(S.mission.end-S.gw)+' j.'):rec?'Disponible':'Pas de recruteur','mercato',!rec?'warn':'');
  if(S.spons&&typeof spSlots==='function'){const free=spSlots().filter(k=>!S.spons[k]).length,end=spSlots().filter(k=>S.spons[k]&&S.spons[k].until===S.year&&!S.spons[k].next).length;
    add('🤝','Partenaires',free?free+' emplacement'+(free>1?'s':'')+' libre'+(free>1?'s':''):end?end+' contrat'+(end>1?'s':'')+' à renouveler':'Tout est signé','finances',free?'bad':end?'warn':'good');}
  const out=S.players.filter(p=>!p.loan&&(p.inj||p.susp)).length;
  add('🩹','Infirmerie',out?out+' absent'+(out>1?'s':''):'Effectif au complet','effectif',out>=3?'warn':'');
  const d=nextDerby();
  if(d)add('🔥','Derby',(d.j===S.week+1?'Ce week-end':'J'+d.j)+' · '+(d.home?'à domicile':'à l’extérieur'),'calendrier',d.j-S.week<=2?'warn':'');
  const pr=projection();
  add('💶','Fin de saison',(pr>=0?'+':'')+money(pr),'finances',pr<0?'bad':'good');
  const ys=S.players.filter(p=>p.age<=21).length;
  add('🎓','Jeunes',ys+' de 21 ans et moins','effectif','');
  return `<div class="card"><header><h3>Cette semaine au club</h3></header><div class="agenda">${it.join('')}</div></div>`;
}
'''
rep("/* ====================== Missions du recruteur ====================== */",add+"\n/* ====================== Missions du recruteur ====================== */")
open(f,'w').write(s);print('ok')
