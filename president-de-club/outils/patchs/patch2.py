p='/home/claude/president/index.html'; s=open(p).read()
def rep(old,new,cnt=1):
    global s
    n=s.count(old); assert n==cnt,(n,old[:90]); s=s.replace(old,new)
def func(name,new):
    global s
    key='\nfunction '+name+'('
    i=s.index(key)+1; j=s.index('\n}\n',i)+3
    s=s[:i]+new.strip('\n')+'\n'+s[j:]

# ---------------- CSS
rep("@media (max-width:640px){\n  .top{grid-template-columns:auto 1fr}\n  .play{grid-column:1/-1}\n  .digits{font-size:46px}\n  .match-next .t{font-size:19px}\n}", r"""
.mbox>*{min-width:0}
.scoreboard{grid-template-columns:minmax(0,1fr) auto minmax(0,1fr)}
.scoreboard .tn{overflow-wrap:anywhere}
.scoreboard.flash{animation:flash .6s ease-out}
@keyframes flash{0%{box-shadow:0 0 0 0 rgba(244,196,48,.85);border-color:var(--flood)}100%{box-shadow:0 0 0 22px rgba(244,196,48,0)}}
.clock{font-family:var(--mono);font-size:13px;color:var(--muted);margin-top:6px;text-align:center}
.tl li.pend,.later{display:none!important}
.tl li.in{animation:slidein .35s ease-out}
@keyframes slidein{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:none}}
.match-next{grid-template-columns:minmax(0,1fr) auto minmax(0,1fr)}
.chart{width:100%;height:auto;display:block;overflow:visible}
.chart .ax{font:11px var(--mono);fill:var(--muted)}
.odds{display:flex;height:22px;border-radius:4px;overflow:hidden;font-size:11px;font-weight:800;color:#08110c}
.odds span{display:grid;place-items:center;min-width:0;white-space:nowrap;overflow:hidden}
.odds .w{background:var(--good)}.odds .d{background:#b8c2b9}.odds .l{background:var(--bad)}
.stadium{width:100%;height:auto;display:block;border-radius:6px;border:1px solid var(--line)}
.legend{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:12.5px;color:var(--muted)}
.legend i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:5px;vertical-align:-1px}
.pitch-wrap{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(0,1fr);gap:16px;align-items:start}
.pitch{width:100%;height:auto;display:block;border-radius:6px}
.pitch .pv{font:800 17px var(--display)}
.pitch .pn{font:600 11.5px var(--body);fill:#e9efe5}
.bench{display:grid;gap:4px;font-size:14px}
.bench div{display:flex;justify-content:space-between;gap:8px;padding:4px 0;border-bottom:1px dotted #2a3d31}
tr.click{cursor:pointer}
tr.click:hover td{background:rgba(255,255,255,.025)}
.potbar{position:relative;height:10px;background:#203128;border-radius:5px;margin-top:6px}
.potbar i{position:absolute;left:0;top:0;bottom:0;background:var(--flood);border-radius:5px}
.potbar b{position:absolute;top:-4px;width:3px;height:18px;background:var(--good);border-radius:2px}
.road{display:grid;gap:10px}
.road .step{border-left:3px solid var(--line);padding:2px 0 2px 12px}
.road .step.ok{border-left-color:var(--good)}
.road .step.next{border-left-color:var(--flood)}
.road h4{margin:0 0 4px;font-family:var(--display);font-size:17px;text-transform:uppercase;letter-spacing:.03em}
.road ul{margin:0;padding:0;list-style:none;display:grid;gap:2px;font-size:13.5px}
.road li::before{content:'○ ';color:var(--bad)}
.road li.ok::before{content:'● ';color:var(--good)}
@media (max-width:820px){.pitch-wrap{grid-template-columns:1fr}}
@media (max-width:640px){
  .top{grid-template-columns:auto 1fr;gap:10px 12px;padding:12px 16px}
  .crest svg{width:44px;height:50px}
  .crest{width:44px;height:50px}
  .ident .sub{font-size:11px}
  .play{grid-column:1/-1;padding:10px 16px;font-size:19px}
  .board .cell{flex:1 1 33%;padding:6px 10px;border-bottom:1px solid var(--line)}
  .board .val{font-size:20px}
  .board .lab{font-size:9.5px;letter-spacing:.06em}
  .tabs{-webkit-mask-image:linear-gradient(90deg,#000 82%,transparent);mask-image:linear-gradient(90deg,#000 82%,transparent)}
  .tabs button{padding:11px 10px;font-size:16px}
  .digits{font-size:40px}
  .scoreboard{padding:12px 8px;gap:6px}
  .scoreboard .tn{font-size:15px}
  .lineup{grid-template-columns:1fr 1fr}
  .mbox{padding:16px}
  .match-next .t{font-size:18px}
  main{padding-top:14px}
}""")

# ---------------- modales : arrêter l'animation
rep("function openModal(html,wide){const m=", "function stopRep(){if(UI.rep&&UI.rep.timer)clearInterval(UI.rep.timer);}\nfunction openModal(html,wide){stopRep();const m=")
rep("function closeModal(){document.getElementById('modal')", "function closeModal(){stopRep();UI.rep=null;document.getElementById('modal')")

# ---------------- rapport de match animé
func('showReport', r"""
function showReport(d){
  const me=S.club.name,on=d.opp.name;
  const hn=d.home?me:on,an=d.home?on:me,hg=d.home?d.gf:d.ga,ag=d.home?d.ga:d.gf;
  const tags={goal:['BUT','goal'],goalo:['BUT','goalo'],yc:['CARTON J.','yc'],rc:['ROUGE','rc'],inj:['BLESSURE','inj'],ht:['MI-TEMPS','goalo']};
  const tab=d.tab?(d.home?d.tab[0]+'-'+d.tab[1]:d.tab[1]+'-'+d.tab[0]):'';
  const res=d.tab?(d.cupWin?'Qualifiés aux tirs au but':'Éliminés aux tirs au but'):d.res==='V'?'Victoire':d.res==='N'?'Match nul':'Défaite';
  const evs=d.ev.slice();const hi=evs.findIndex(e=>e.m>45);evs.splice(hi<0?evs.length:hi,0,{m:45,k:'ht',n:'Retour aux vestiaires'});
  const win=d.res==='V'||d.cupWin===true,lose=d.res==='D'||d.cupWin===false;
  openModal(`<div class="kicker">${esc(d.comp)}${d.att?' · '+nf(d.att)+' spectateurs':''}${d.neutral?' · Stade de France':''}</div>
  <div class="scoreboard" id="rsBoard">
    <div class="tn ${d.home?'me':''}">${esc(hn)}</div>
    <div><div class="digits"><span id="rsH">0</span><em>:</em><span id="rsA">0</span></div><div class="clock" id="rsMin">Coup d’envoi</div></div>
    <div class="tn ${d.home?'':'me'}">${esc(an)}</div>
  </div>
  <div class="spread"><h3 id="rsRes" class="later ${win?'good':lose?'bad':''}">${res}${tab?' ('+tab+')':''}</h3><span class="muted num">Force ${d.myRating} contre ${d.oppRating}</span></div>
  <ol class="tl" id="rsTl">${evs.map(e=>`<li class="pend" data-m="${e.m}" data-k="${e.k}"><span class="m">${e.m}'</span><span class="tag ${tags[e.k][1]}">${tags[e.k][0]}</span><span class="${e.k==='ht'?'muted':''}">${esc(e.n)}</span></li>`).join('')}</ol>
  <div id="rsMore" class="later" style="display:grid;gap:10px">
    <div class="statbar"><span class="num">${d.poss}%</span><div class="b"><i style="width:${d.poss}%"></i></div><span class="num r">${100-d.poss}%</span></div>
    <div class="statbar"><span class="num">${d.sh[0]}</span><div class="b"><i style="width:${Math.round(100*d.sh[0]/(d.sh[0]+d.sh[1]))}%"></i></div><span class="num">${d.sh[1]}</span></div>
    <div class="muted" style="font-size:12px">Possession · Tirs (jaune : votre club)</div>
    <div><h3 style="margin-bottom:6px">Notes des joueurs</h3><div class="lineup">${d.lineup.map(l=>`<div><span><span class="pos ${l.pos}">${l.pos}</span> ${esc(l.n)}${l.g?' <b class="gold">'+'●'.repeat(l.g)+'</b>':''}</span><b class="num ${l.note>=7?'good':l.note<5?'bad':''}">${String(l.note).replace('.',',')}</b></div>`).join('')}</div></div>
  </div>
  <div class="spread"><label class="row muted" style="font-size:13px"><input type="checkbox" id="autorep" onchange="S.autoReport=this.checked;save()"> Ne plus afficher les rapports de match</label><button class="btn pri" id="rsBtn" onclick="A.skipRep()">Passer au coup de sifflet</button></div>`,true);
  UI.rep={d,min:0,h:0,a:0,pause:6,done:false,final:[hg,ag],tab};
  const reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce)repFinish();else UI.rep.timer=setInterval(repTick,30);
}
function repTick(){
  const r=UI.rep;if(!r||r.done)return;
  if(r.pause>0){r.pause--;return;}
  const el=document.getElementById('rsMin');if(!el){stopRep();return;}
  r.min++;el.textContent=r.min+"'";
  document.querySelectorAll('#rsTl li.pend').forEach(li=>{
    if(+li.dataset.m!==r.min)return;
    li.classList.remove('pend');li.classList.add('in');
    const k=li.dataset.k;
    if(k==='goal'||k==='goalo'){
      if((k==='goal')===r.d.home)r.h++;else r.a++;
      document.getElementById('rsH').textContent=r.h;document.getElementById('rsA').textContent=r.a;
      const b=document.getElementById('rsBoard');b.classList.remove('flash');void b.offsetWidth;b.classList.add('flash');r.pause=16;
    }else r.pause=k==='ht'?12:5;
  });
  if(r.min>=90)repFinish();
}
function repFinish(){
  const r=UI.rep;if(!r)return;stopRep();r.done=true;
  const q=id=>document.getElementById(id);if(!q('rsH'))return;
  q('rsH').textContent=r.final[0];q('rsA').textContent=r.final[1];
  q('rsMin').textContent=r.tab?'Tirs au but '+r.tab:'Coup de sifflet final';
  document.querySelectorAll('#rsTl li.pend').forEach(li=>li.classList.remove('pend'));
  q('rsRes').classList.remove('later');q('rsMore').classList.remove('later');
  const b=q('rsBtn');b.textContent='Continuer';b.focus({preventScroll:true});
}
A.skipRep=function(){if(UI.rep&&!UI.rep.done)repFinish();else A.close();};
""")

# ---------------- objectif : repères de force
rep("Annoncez l’objectif aux adhérents et partenaires.</p>",
    "Annoncez l’objectif aux adhérents et partenaires.</p>\n  ${(()=>{const ai=S.teams.filter(t=>!t.user).map(t=>t.rating);return `<div class=\"kpis\"><div class=\"kpi\"><div class=\"l\">Votre force</div><div class=\"v gold\">${Math.round(strength().ovr)}</div></div><div class=\"kpi\"><div class=\"l\">Moyenne de la division</div><div class=\"v\">${Math.round(ai.reduce((a,b)=>a+b,0)/ai.length)}</div></div><div class=\"kpi\"><div class=\"l\">Favori</div><div class=\"v\">${Math.round(Math.max(...ai))}</div></div></div>`;})()}")

# ---------------- outils graphiques
rep("/* ---------- Rendu ---------- */", r"""/* ---------- Rendu ---------- */
let CREST_N=0;
function oddsFor(me,t,home){
  const o={att:t.att+t.mom,def:t.def+t.mom};
  const la=lam(me.att,o.def,home),lb=lam(o.att,me.def,!home);
  const pf=(l,k)=>{let f=1;for(let i=2;i<=k;i++)f*=i;return Math.exp(-l)*Math.pow(l,k)/f;};
  let w=0,d=0,l=0;for(let a=0;a<=9;a++)for(let b=0;b<=9;b++){const p=pf(la,a)*pf(lb,b);if(a>b)w+=p;else if(a===b)d+=p;else l+=p;}
  const t2=w+d+l;return [w/t2,d/t2,l/t2];
}
function projection(){
  const L=LV[S.div],N=S.N,i=S.infra;let cash=S.cash;
  if(S.week>=N)return cash;
  const weekly=(S.sponsorAnnual+S.sponsorBonus+S.naming+L.sub*S.subsidyMult+L.tv+(S.flags.tvLocal||0)+S.fans*MERCH[i.commerce]*(1+S.div*.4)*(S.flags.kitShare?1.5:1))/N
    -(wageBill()+staffBill())*12/N-(S.invested*.025+MAINT[S.div])/N-(i.formation?INFRA.formation.run[i.formation]/N:0)-(S.flags.fem?FEMCOST[S.div]/N:0);
  const att=Math.min(cap(),S.fans*(.45+S.mood/200)*clamp(Math.pow(L.tick/S.ticket,1.1),.25,1.6));
  const homeG=att*(S.ticket+BUV[i.commerce])+(i.loges?LOGES[i.loges]*(1+S.div*.25):0);
  for(let w=S.week;w<N;w++){cash+=weekly;cash+=S.sched[w].some(([h])=>S.teams[h].user)?homeG:-TRAVEL[S.div];}
  return cash-S.loans.reduce((s,l)=>s+Math.min(l.remaining,l.perWeek*(N-S.week)),0);
}
function lineChart(vals,o){
  o=o||{};const W=o.w||560,H=o.h||170,P={l:o.pl||44,r:16,t:12,b:22};
  if(vals.length<2)return '<p class="muted" style="margin:0">Le graphique apparaîtra après quelques journées.</p>';
  let mn=o.min??Math.min(...vals),mx=o.max??Math.max(...vals);if(mn===mx){mx+=1;mn-=1;}
  const n=Math.max(o.n||vals.length,2);
  const X=i=>P.l+(W-P.l-P.r)*i/(n-1);
  const Y=v=>{const t=(v-mn)/(mx-mn);return o.invert?P.t+(H-P.t-P.b)*t:H-P.b-(H-P.t-P.b)*t;};
  let g='';
  (o.zones||[]).forEach(z=>{const y1=Y(z.from),y2=Y(z.to);g+=`<rect x="${P.l}" y="${Math.min(y1,y2).toFixed(1)}" width="${W-P.l-P.r}" height="${Math.abs(y2-y1).toFixed(1)}" style="fill:${z.c};opacity:.14"/>`;});
  (o.ticks||[mn,mx]).forEach(t=>{const y=Y(t).toFixed(1);g+=`<line x1="${P.l}" x2="${W-P.r}" y1="${y}" y2="${y}" style="stroke:var(--line)" stroke-dasharray="2 4"/><text x="${P.l-6}" y="${+y+4}" text-anchor="end" class="ax">${o.fmt?o.fmt(t):t}</text>`;});
  const pts=vals.map((v,i)=>[X(i),Y(v)]);
  const d='M'+pts.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' L');
  if(o.area){const base=Y(o.base??mn).toFixed(1);g+=`<path d="${d} L${pts[pts.length-1][0].toFixed(1)} ${base} L${pts[0][0].toFixed(1)} ${base} Z" style="fill:var(--flood);opacity:.12"/>`;}
  g+=`<path d="${d}" fill="none" style="stroke:var(--flood)" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>`;
  const lp=pts[pts.length-1];g+=`<circle cx="${lp[0].toFixed(1)}" cy="${lp[1].toFixed(1)}" r="4.5" style="fill:var(--flood);stroke:var(--night)" stroke-width="2"/>`;
  if(o.xl)g+=`<text x="${P.l}" y="${H-4}" class="ax">${o.xl[0]}</text><text x="${W-P.r}" y="${H-4}" text-anchor="end" class="ax">${o.xl[1]}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="${esc(o.label||'Graphique')}">${g}</svg>`;
}
function stadiumSVG(){
  const I=S.infra,c1=S.club.c1,st=I.stade,W=460,H=260,px=170,py=74,pw=180,ph=112,u='st'+(++CREST_N);
  const D=[0,8,12,16,20,24,28,32,36,40][st];
  let g=`<defs><pattern id="${u}s" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="${c1}"/><rect y="3" width="5" height="2" fill="#000" opacity=".3"/></pattern><radialGradient id="${u}g"><stop offset="0" stop-color="#fff3b8" stop-opacity=".6"/><stop offset="1" stop-color="#fff3b8" stop-opacity="0"/></radialGradient></defs>`;
  g+=`<rect width="${W}" height="${H}" fill="#08100b"/>`;
  // terrains annexes
  const nA=1+Math.floor(I.entrainement/2);
  for(let k=0;k<3;k++){const y=16+k*62;g+=k<nA?`<rect x="12" y="${y}" width="78" height="52" rx="2" fill="${I.entrainement>=4?'#2a7a43':'#1f4f2e'}" stroke="#e9efe5" stroke-opacity=".4"/><line x1="51" x2="51" y1="${y}" y2="${y+52}" stroke="#e9efe5" stroke-opacity=".4"/><circle cx="51" cy="${y+26}" r="7" fill="none" stroke="#e9efe5" stroke-opacity=".4"/>`:`<rect x="12" y="${y}" width="78" height="52" rx="2" fill="none" stroke="#2b4034" stroke-dasharray="3 3"/>`;}
  if(I.entrainement>=2)g+=`<rect x="98" y="16" width="16" height="${36+I.entrainement*26}" rx="1" fill="#2c3d33" stroke="#7d968a" stroke-opacity=".6"/>`;
  // centre de formation
  for(let k=0;k<5;k++)g+=k<I.formation?`<rect x="${12+k*20}" y="214" width="16" height="30" rx="1" fill="#24385a" stroke="#6cb6ff" stroke-opacity=".7"/>`:`<rect x="${12+k*20}" y="214" width="16" height="30" rx="1" fill="none" stroke="#2b4034" stroke-dasharray="2 3"/>`;
  // tribunes
  const seat=`url(#${u}s)`;
  const roofOn=side=>st>=6||(side==='b'&&st>=2);
  const stand=(x,y,w,h,side)=>{let r=`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${seat}"/>`;
    if(roofOn(side)){const R={b:[x,y+h*.45,w,h*.55],t:[x,y,w,h*.55],l:[x,y,w*.55,h],r:[x+w*.45,y,w*.55,h]}[side];r+=`<rect x="${R[0]}" y="${R[1]}" width="${R[2]}" height="${R[3]}" fill="#0b0f0d" opacity=".55" stroke="#c9d4c9" stroke-opacity=".35"/>`;}
    return r;};
  if(st>=1){const w=st===1?70:pw+(st>=8?2*(D+10):0);g+=stand(px+pw/2-w/2,py+ph+10,w,D,'b');}
  if(st>=3){const w=pw+(st>=8?2*(D+10):0);g+=stand(px+pw/2-w/2,py-10-D,w,D,'t');}
  if(st>=4)g+=stand(px-10-D,py,D,ph,'l');
  if(st>=5)g+=stand(px+pw+10,py,D,ph,'r');
  if(I.loges&&st>=3){const w=pw*(.25+I.loges*.15);g+=`<rect x="${px+pw/2-w/2}" y="${py+ph+10}" width="${w}" height="4" fill="#9fd3ff" opacity=".9"/>`;}
  if(st>=4)g+=`<rect x="${px+pw-34}" y="${py-10-D-9}" width="30" height="7" fill="#000" stroke="#f4c430" stroke-opacity=".8"/>`;
  // pelouse
  const pc=[['#6d5f47','#6d5f47'],['#2f9e4f','#2f9e4f'],['#2b7a40','#338a49'],['#2a8442','#38994f']][I.pelouse];
  g+=`<rect x="${px-6}" y="${py-6}" width="${pw+12}" height="${ph+12}" fill="none" stroke="#c9d4c9" stroke-opacity=".45"/>`;
  g+=`<rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="${pc[0]}"/>`;
  if(I.pelouse>=2)for(let k=1;k<12;k+=2)g+=`<rect x="${px+k*pw/12}" y="${py}" width="${pw/12}" height="${ph}" fill="${pc[1]}"/>`;
  if(I.pelouse===0)for(let k=0;k<40;k++)g+=`<circle cx="${px+((k*53)%pw)}" cy="${py+((k*37)%ph)}" r="1" fill="#8a7a5c"/>`;
  const L='stroke="#fff" stroke-opacity=".8" fill="none" stroke-width="1.1"';
  g+=`<rect x="${px+3}" y="${py+3}" width="${pw-6}" height="${ph-6}" ${L}/><line x1="${px+pw/2}" x2="${px+pw/2}" y1="${py+3}" y2="${py+ph-3}" ${L}/><circle cx="${px+pw/2}" cy="${py+ph/2}" r="15" ${L}/>`;
  g+=`<rect x="${px+3}" y="${py+ph/2-28}" width="26" height="56" ${L}/><rect x="${px+pw-29}" y="${py+ph/2-28}" width="26" height="56" ${L}/><rect x="${px+3}" y="${py+ph/2-12}" width="9" height="24" ${L}/><rect x="${px+pw-12}" y="${py+ph/2-12}" width="9" height="24" ${L}/>`;
  // éclairage
  const e=I.eclairage;
  if(e){const off=14+D*.75,pts=e===1?[[px-12,py+ph/2],[px+pw+12,py+ph/2]]:[[px-off,py-off],[px+pw+off,py-off],[px-off,py+ph+off],[px+pw+off,py+ph+off]];const gr=[0,18,30,46][e];
    if(e===3)g+=`<rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="#fff3b8" opacity=".07"/>`;
    pts.forEach(([x,y])=>{g+=`<circle cx="${x}" cy="${y}" r="${gr}" fill="url(#${u}g)"/><rect x="${x-3}" y="${y-3}" width="6" height="6" fill="#fff3b8" stroke="#08100b"/>`;});}
  // buvette & boutique
  const nk=Math.max(1,Math.min(5,I.commerce));
  for(let k=0;k<nk;k++){const big=I.commerce>=4&&k===0;g+=`<rect x="${404}" y="${30+k*40}" width="${big?44:30}" height="${big?30:22}" rx="2" fill="${S.club.c2}" stroke="${c1}" stroke-width="2"/><rect x="404" y="${30+k*40}" width="${big?44:30}" height="5" fill="${c1}"/>`;}
  return `<svg viewBox="0 0 ${W} ${H}" class="stadium" role="img" aria-label="Vue aérienne des installations du club">${g}</svg>`;
}
function pitchSVG(xi){
  const W=600,H=380,f=S.tactic.formation,c1=S.club.c1,c2=S.club.c2;
  let g=`<rect width="${W}" height="${H}" fill="#1c5631"/>`;
  for(let k=1;k<12;k+=2)g+=`<rect x="${k*W/12}" width="${W/12}" height="${H}" fill="#206139"/>`;
  const L='stroke="#fff" stroke-opacity=".5" fill="none" stroke-width="2"';
  g+=`<rect x="10" y="10" width="${W-20}" height="${H-20}" ${L}/><line x1="${W/2}" x2="${W/2}" y1="10" y2="${H-10}" ${L}/><circle cx="${W/2}" cy="${H/2}" r="48" ${L}/>`;
  g+=`<rect x="10" y="${H/2-100}" width="92" height="200" ${L}/><rect x="${W-102}" y="${H/2-100}" width="92" height="200" ${L}/><rect x="10" y="${H/2-46}" width="32" height="92" ${L}/><rect x="${W-42}" y="${H/2-46}" width="32" height="92" ${L}/>`;
  const by={G:[],D:[],M:[],A:[]};xi.forEach(e=>by[e.slot].push(e));
  const pl=e=>{};
  const place=(arr,fx)=>arr.forEach((e,i)=>{const x=fx*W,y=H*(i+1)/(arr.length+1),p=e.p;
    const ring=e.pen?'#f2a03a':p.fit<70?'#ff6a5c':c2;
    g+=`<g><circle cx="${x}" cy="${y}" r="20" fill="${c1}" stroke="${ring}" stroke-width="3"/><text x="${x}" y="${y+6}" text-anchor="middle" class="pv" fill="${c2}">${p.ovr}</text><rect x="${x-48}" y="${y+24}" width="96" height="17" rx="3" fill="#000" opacity=".55"/><text x="${x}" y="${y+36.5}" text-anchor="middle" class="pn">${esc(pshort(p))}</text></g>`;});
  place(by.G,.07);place(by.D,.25);
  if(f==='4-2-3-1'){place(by.M.slice(0,2),.44);place(by.M.slice(2),.62);}else place(by.M,.51);
  place(by.A,.81);
  if(xi.length<11)g+=`<text x="${W/2}" y="28" text-anchor="middle" class="pn" style="fill:#ff6a5c">Seulement ${xi.length} joueurs alignables</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" class="pitch" role="img" aria-label="Composition probable en ${f}">${g}</svg>`;
}
A.sheet=function(id){
  const p=getP(id);if(!p)return;
  const inXI=strength().xi.some(e=>e.p.id===id);
  const notes=p.notes.length?`<svg viewBox="0 0 200 52" class="chart" style="max-width:280px">${p.notes.map((n,i)=>`<rect x="${i*20+3}" y="${52-n*5}" width="14" height="${n*5}" rx="2" style="fill:${n>=7?'var(--good)':n<5?'var(--bad)':'var(--flood)'}"/>`).join('')}</svg>`:'<span class="muted">Pas encore noté cette saison.</span>';
  const sc=v=>(clamp(v,25,95)-25)/70*100;
  openModal(`<div class="kicker">${POSN[p.pos]} · ${p.age} ans${p.youth?' · formé au club':''}</div>
  <h2>${esc(pname(p))}</h2>
  <div class="row">${inXI?'<span class="pill g">Titulaire</span>':'<span class="pill">Remplaçant</span>'}${p.inj?'<span class="pill b">Blessé '+p.inj+' sem.</span>':''}${p.susp?'<span class="pill w">Suspendu</span>':''}${p.listed?'<span class="pill y">En vente</span>':''}${p.contract<=1?'<span class="pill w">Fin de contrat cette saison</span>':''}</div>
  <div class="kpis">
   <div class="kpi"><div class="l">Note</div><div class="v gold">${p.ovr}</div></div>
   <div class="kpi"><div class="l">Potentiel</div><div class="v">${p.pot}</div></div>
   <div class="kpi"><div class="l">Forme</div><div class="v ${p.fit<70?'warn':''}">${p.fit}%</div></div>
   <div class="kpi"><div class="l">Moral</div><div class="v ${p.morale<35?'bad':''}">${p.morale}</div></div>
   <div class="kpi"><div class="l">Valeur</div><div class="v" style="font-size:20px">${money(valueFor(p))}</div></div>
   <div class="kpi"><div class="l">Salaire</div><div class="v" style="font-size:20px">${money(p.wage)}<span class="muted" style="font-size:13px">/mois</span></div></div>
   <div class="kpi"><div class="l">Contrat</div><div class="v" style="font-size:20px">${p.contract} an${p.contract>1?'s':''}</div></div>
   <div class="kpi"><div class="l">Buts saison · total</div><div class="v" style="font-size:20px">${p.sg} · ${p.goals}</div></div>
  </div>
  <div><div class="spread muted" style="font-size:12px"><span>Note actuelle et potentiel (repère vert)</span><span>${p.pot-p.ovr>0?'+'+(p.pot-p.ovr)+' de marge':'Au maximum'}</span></div><div class="potbar"><i style="width:${sc(p.ovr)}%"></i><b style="left:${sc(p.pot)}%"></b></div></div>
  <div><div class="muted" style="font-size:12px;margin-bottom:4px">Dernières notes de match</div>${notes}</div>
  <div class="row"><button class="btn pri" onclick="A.renew(${id})">Prolonger</button><button class="btn" onclick="A.list(${id});A.sheet(${id})">${p.listed?'Retirer de la vente':'Mettre en vente'}</button><button class="btn dan" onclick="A.release(${id})">Libérer</button><button class="btn" onclick="A.close()">Fermer</button></div>`);
};""")

# blason : identifiant unique
rep('<clipPath id="cl">', '<clipPath id="cl${++CREST_N}">')
rep('<g clip-path="url(#cl)">', '<g clip-path="url(#cl${CREST_N})">')

# ---------------- alertes : projection
rep("  if(!S.staff.coach)a.push(['b',", "  if(S.week<S.N){const pr=projection();if(pr<0)a.push(['b','Au rythme actuel, la trésorerie finira la saison à '+money(pr)+'. Réduisez la masse salariale, vendez ou empruntez.']);}\n  if(!S.staff.coach)a.push(['b',")

# ---------------- Accueil
func('vAccueil', r"""
function vAccueil(st){
  const L=LV[S.div],nx=nextFixture(),tbl=standings(),pos=myPos();
  let nextHtml='';
  if(nx){
    const o=nx.opp,oi=tbl.indexOf(o)+1,os=Math.round(o.rating);
    const me=Math.round(st.ovr),mx=Math.max(me,os,1);
    const [pw,pd,pl]=oddsFor(st,o,nx.home).map(x=>Math.round(x*100));
    const abs=S.players.filter(p=>p.inj||p.susp).sort((a,b)=>b.ovr-a.ovr).slice(0,4);
    const cupNow=!S.cup.out&&!S.cup.won&&S.cup.round<12&&cupDay(S.cup.round)===S.week+1;
    nextHtml=`<div class="card hl"><header><h3>Prochain match · J${S.week+1}</h3><span class="pill y">${nx.home?'Domicile':'Extérieur'}</span></header>
    <div class="match-next"><div class="t">${esc(nx.home?S.club.name:o.name)}</div><div class="vs">VS</div><div class="t">${esc(nx.home?o.name:S.club.name)}</div></div>
    <div class="cmp"><span>Votre club</span><div class="bar"><i style="width:${me/mx*100}%"></i></div><b class="num">${me}</b></div>
    <div class="cmp"><span>Adversaire</span><div class="bar"><i class="o" style="width:${os/mx*100}%"></i></div><b class="num">${os}</b></div>
    <div><div class="spread muted" style="font-size:12px;margin-bottom:4px"><span>Pronostic : victoire ${pw} % · nul ${pd} % · défaite ${pl} %</span><span>${S.week?oi+'e':''} ${o.form.length?formPills(o.form):''}</span></div>
    <div class="odds" aria-hidden="true"><span class="w" style="width:${pw}%">${pw>12?'V':''}</span><span class="d" style="width:${pd}%">${pd>12?'N':''}</span><span class="l" style="width:${pl}%">${pl>12?'D':''}</span></div></div>
    <div class="spread muted" style="font-size:13px"><span>${abs.length?'Absents : '+abs.map(p=>esc(pshort(p))+(p.inj?' (blessé)':' (suspendu)')).join(', '):'Effectif au complet'}</span><span>${nx.home?'Affluence attendue ≈ '+nf(attendance(o))+' / '+nf(cap()):'Déplacement : '+money(TRAVEL[S.div])}</span></div>
    ${cupNow?'<div class="alert g">Coupe de France ('+CUP_R[S.cup.round]+') au programme cette semaine.</div>':''}
    </div>`;
  }else nextHtml=`<div class="card hl"><h3>Saison terminée</h3><p>Le championnat est fini. Clôturez la saison pour voir le bilan.</p><button class="btn pri" onclick="A.play()">Voir le bilan</button></div>`;
  const i=Math.max(0,Math.min(tbl.length-5,pos-3));
  const mini=tbl.slice(i,i+5);
  const target={maintien:L.teams-L.rel,milieu:Math.ceil(L.teams/2),montee:Math.max(L.promo,L.promo?L.promo:2)}[S.objective];
  const objTxt={maintien:'Maintien',milieu:'Première moitié',montee:L.promo?'Montée':'Podium'}[S.objective];
  const onTrack=!S.week||pos<=target;
  const al=alerts();
  const tp=(S.track&&S.track.pos)||[];
  const chart=lineChart(tp,{min:.5,max:L.teams+.5,invert:true,n:S.N,ticks:[1,Math.ceil(L.teams/2),L.teams],pl:30,
    zones:[...(L.promo?[{from:.5,to:L.promo+.5,c:'var(--good)'}]:[]),{from:L.teams-L.rel+.5,to:L.teams+.5,c:'var(--bad)'}],xl:['J1','J'+S.N],label:'Évolution du classement'});
  return `<div class="grid g2">${nextHtml}
  <div class="card"><header><h3>Situation</h3><span class="muted">${formPills(S.teams[0].form)}</span></header>
   <div class="tbl-wrap"><table><thead><tr><th>#</th><th>Club</th><th class="r">J</th><th class="r">Diff</th><th class="r">Pts</th></tr></thead><tbody>
   ${mini.map(t=>{const p=tbl.indexOf(t)+1;return `<tr class="${t.user?'me ':''}${p<=L.promo?'zone-up':p>L.teams-L.rel?'zone-down':''}"><td>${p}</td><td>${esc(t.name)}</td><td class="r">${t.P}</td><td class="r">${t.GF-t.GA>0?'+':''}${t.GF-t.GA}</td><td class="r"><b>${t.Pts}</b></td></tr>`;}).join('')}
   </tbody></table></div>
   <div class="spread" style="font-size:14px"><span>Objectif : <b>${objTxt}</b> (${target}e ou mieux) ${onTrack?'<span class="pill g">Dans les clous</span>':'<span class="pill b">En retard</span>'}</span><span class="muted">Coupe : ${S.cup.won?'vainqueur':S.cup.out?'éliminé':CUP_R[S.cup.round]}</span></div>
  </div></div>
  <div class="grid g2">
   <div class="card"><header><h3>Trajectoire</h3><span class="muted" style="font-size:12px"><span class="good">▌</span> montée · <span class="bad">▌</span> relégation</span></header>${chart}</div>
   <div class="card"><h3>À surveiller</h3><div class="alerts">${al.length?al.map(([c,t])=>`<div class="alert ${c}">${esc(t)}</div>`).join(''):'<div class="alert g">Tout est sous contrôle.</div>'}</div></div>
  </div>
  <div class="card"><h3>Fil du club</h3><div class="feed">${S.news.map(n=>`<div><b>${esc(n.w)}</b><span class="${n.type==='b'?'bad':''}">${esc(n.t)}</span></div>`).join('')}</div></div>`;
}""")

# ---------------- Effectif
func('vEffectif', r"""
function vEffectif(st){
  const order={G:0,D:1,M:2,A:3};
  const ps=[...S.players].sort((a,b)=>order[a.pos]-order[b.pos]||b.ovr-a.ovr);
  const inXI=new Set(st.xi.map(e=>e.p.id));
  const avgNote=p=>p.notes.length?(p.notes.reduce((a,b)=>a+b,0)/p.notes.length).toFixed(1).replace('.',','):'—';
  const c=S.staff.coach;
  const bench=S.players.filter(p=>!inXI.has(p.id)&&!p.inj&&!p.susp).sort((a,b)=>b.ovr-a.ovr).slice(0,7);
  const out=S.players.filter(p=>p.inj||p.susp);
  return `<div class="card"><header><h3>Consignes à l’entraîneur</h3><span class="muted" style="font-size:13px">${c?esc(c.name)+' préfère le '+c.form+', style '+c.style.toLowerCase():'Pas d’entraîneur'}</span></header>
   <div class="row">${Object.keys(FORM).map(f=>`<button class="btn sm ${S.tactic.formation===f?'pri':''}" onclick="A.setTac('formation','${f}')">${f}${c&&c.form===f?' ★':''}</button>`).join('')}<span style="width:12px"></span>${Object.keys(MENT).map(m=>`<button class="btn sm ${S.tactic.mentality===m?'pri':''}" onclick="A.setTac('mentality','${m}')">${m}${c&&c.style===m?' ★':''}</button>`).join('')}</div>
   <div class="pitch-wrap">${pitchSVG(st.xi)}
    <div style="display:grid;gap:12px;align-content:start">
     <div class="kpis"><div class="kpi"><div class="l">Attaque</div><div class="v">${Math.round(st.att)}</div></div><div class="kpi"><div class="l">Défense</div><div class="v">${Math.round(st.def)}</div></div><div class="kpi"><div class="l">Effectif</div><div class="v">${S.players.length}<span class="muted" style="font-size:15px">/30</span></div></div><div class="kpi"><div class="l">Salaires</div><div class="v" style="font-size:19px">${money(wageBill())}<span class="muted" style="font-size:12px">/mois</span></div></div></div>
     <div><h3 style="font-size:16px;margin-bottom:4px">Remplaçants</h3><div class="bench">${bench.map(p=>`<div><span><span class="pos ${p.pos}">${p.pos}</span> ${esc(pshort(p))}</span><b class="num">${p.ovr}</b></div>`).join('')||'<span class="muted">Aucun</span>'}</div></div>
     ${out.length?`<div><h3 style="font-size:16px;margin-bottom:4px">Indisponibles</h3><div class="bench">${out.map(p=>`<div><span><span class="pos ${p.pos}">${p.pos}</span> ${esc(pshort(p))}</span><span class="bad">${p.inj?p.inj+' sem.':'suspendu'}</span></div>`).join('')}</div></div>`:''}
     <p class="muted" style="font-size:12px;margin:0">Cercle orange : joueur hors de son poste. Cercle rouge : forme sous 70 %. ★ : préférence de l’entraîneur.</p>
    </div></div>
  </div>
  <div class="tbl-wrap"><table><thead><tr><th>Poste</th><th>Joueur</th><th class="r">Âge</th><th class="r">Note</th><th class="r">Pot.</th><th class="r">Forme</th><th class="r">Moral</th><th class="r">Salaire</th><th class="r">Contrat</th><th class="r">Valeur</th><th class="r">Buts</th><th class="r">Moy.</th><th>Statut</th><th></th></tr></thead><tbody>
  ${ps.map(p=>`<tr class="click" onclick="A.sheet(${p.id})"><td><span class="pos ${p.pos}">${p.pos}</span></td><td>${inXI.has(p.id)?'<b>':''}${esc(pname(p))}${inXI.has(p.id)?'</b>':''}${p.youth?' <span class="pill y">Jeune</span>':''}</td><td class="r">${p.age}</td><td class="r"><span class="ovr">${p.ovr}</span></td><td class="r ${p.pot-p.ovr>=8?'good':''}">${p.pot}</td><td class="r ${p.fit<70?'warn':''}">${p.fit}%</td><td class="r ${p.morale<35?'bad':p.morale>75?'good':''}">${p.morale}</td><td class="r">${money(p.wage)}</td><td class="r ${p.contract<=1?'warn':''}">${p.contract} an${p.contract>1?'s':''}</td><td class="r">${money(valueFor(p))}</td><td class="r">${p.sg}</td><td class="r">${avgNote(p)}</td>
  <td>${p.inj?'<span class="pill b">Blessé '+p.inj+' sem.</span> ':''}${p.susp?'<span class="pill w">Suspendu</span> ':''}${p.listed?'<span class="pill y">En vente</span>':''}${inXI.has(p.id)&&!p.inj?'<span class="pill g">Titulaire</span>':''}</td>
  <td><button class="btn sm" onclick="event.stopPropagation();A.sheet(${p.id})">Gérer</button></td></tr>`).join('')}
  </tbody></table></div>
  <p class="muted" style="font-size:13px">Cliquez sur un joueur pour voir sa fiche, le prolonger, le vendre ou le libérer. Les joueurs en vente reçoivent des offres pendant les fenêtres de mercato.</p>`;
}""")

# ---------------- Mercato : apport
rep("<th>Club</th><th class=\"r\">Indemnité</th><th class=\"r\">Salaire demandé</th><th>Intérêt</th><th></th></tr></thead><tbody>\n  ${list.map(p=>{const it=interest(p);",
    "<th>Club</th><th class=\"r\">Indemnité</th><th class=\"r\">Salaire demandé</th><th>Apport</th><th>Intérêt</th><th></th></tr></thead><tbody>\n  ${list.map(p=>{const it=interest(p);const wv=worst(p.pos);")
rep("<td class=\"r\">${money(p.demand)}</td><td>${it>=.8",
    "<td class=\"r\">${money(p.demand)}</td><td>${p.ovr>wv?'<span class=\"pill g\">Titulaire +'+(p.ovr-wv)+'</span>':'<span class=\"muted\">Remplaçant</span>'}</td><td>${it>=.8")
rep("  const list=S.market.filter(", "  const xi=strength().xi;const worst=pos=>{const a=xi.filter(e=>e.slot===pos&&!e.pen);return a.length?Math.min(...a.map(e=>e.p.ovr)):0;};\n  const list=S.market.filter(")

# ---------------- Installations
rep("""  return `<div class="card"><div class="spread"><div><h3>${esc(S.stadiumName)}</h3><span class="muted">${nf(cap())} places · entretien ${money(S.invested*.025+MAINT[S.div])}/saison</span></div>
  <div class="row">${S.flags.subvBuild?'<span class="pill g">Prochain chantier subventionné à 30 %</span>':''}<button class="btn" onclick="A.askSubv()" ${S.flags.subvAsked?'disabled':''}>${S.flags.subvAsked?'Mairie sollicitée cette saison':'Solliciter la mairie pour les travaux'}</button></div></div></div>""",
"""  return `<div class="card"><div class="spread"><div><h3>${esc(S.stadiumName)}</h3><span class="muted">${nf(cap())} places · entretien ${money(S.invested*.025+MAINT[S.div])}/saison${S.builds.length?' · '+S.builds.length+' chantier'+(S.builds.length>1?'s':'')+' en cours':''}</span></div>
  <div class="row">${S.flags.subvBuild?'<span class="pill g">Prochain chantier subventionné à 30 %</span>':''}<button class="btn" onclick="A.askSubv()" ${S.flags.subvAsked?'disabled':''}>${S.flags.subvAsked?'Mairie sollicitée cette saison':'Solliciter la mairie pour les travaux'}</button></div></div>
  ${stadiumSVG()}
  <div class="legend"><span><i style="background:${S.club.c1}"></i>Tribunes</span><span><i style="background:#9fd3ff"></i>Loges</span><span><i style="background:#fff3b8"></i>Projecteurs</span><span><i style="background:#1f4f2e"></i>Terrains d’entraînement</span><span><i style="background:#24385a"></i>Centre de formation</span><span><i style="background:${S.club.c2};outline:2px solid ${S.club.c1}"></i>Buvette et boutiques</span></div></div>""")
rep("""<button class="btn ${S.cash>=c&&!bl?'pri':''}" onclick="A.build('${k}')" ${S.cash<c||bl?'disabled':''}>Lancer les travaux</button>""",
    """<button class="btn ${S.cash>=c&&!bl?'pri':''}" onclick="A.build('${k}')" ${S.cash<c||bl?'disabled':''}>${bl?'Prérequis manquant':S.cash<c?'Il manque '+money(c-S.cash):'Lancer les travaux'}</button>""")

# ---------------- Finances
rep("""  return `<div class="kpis">
   <div class="kpi"><div class="l">Trésorerie</div><div class="v ${S.cash<0?'bad':''}">${money(S.cash)}</div></div>""",
"""  const pr=projection(),fi=S.sf.fi||{};
  const cashV=(S.track&&S.track.cash)||[];const cmn=Math.min(0,...cashV),cmx=Math.max(0,...cashV);
  return `<div class="kpis">
   <div class="kpi"><div class="l">Trésorerie</div><div class="v ${S.cash<0?'bad':''}">${money(S.cash)}</div></div>
   <div class="kpi"><div class="l">Projection fin de saison</div><div class="v ${pr<0?'bad':''}">${money(pr)}</div></div>""")
rep("""  <div class="grid g2">
   <div class="card"><header><h3>Recettes ${seasonLabel(S.year)}</h3>""",
"""  <div class="card"><header><h3>Évolution de la trésorerie</h3><span class="muted" style="font-size:12px">${cashV.length} dernières journées</span></header>${lineChart(cashV,{min:cmn,max:cmx,area:true,base:Math.max(cmn,0),ticks:cmn<0?[cmn,0,cmx]:[0,cmx],fmt:money,pl:62,zones:cmn<0?[{from:cmn,to:0,c:'var(--bad)'}]:[],label:'Évolution de la trésorerie'})}</div>
  <div class="grid g2">
   <div class="card"><header><h3>Recettes ${seasonLabel(S.year)}</h3>""")
rep("""  <p class="muted" style="font-size:13px">Revenus de la division""",
"""  ${Object.keys(fi).length?`<div class="card"><header><h3>Financement (hors résultat)</h3></header><div class="tbl-wrap"><table><tbody>${Object.entries(fi).map(([k,v])=>`<tr><td>${esc(k)}</td><td class="r ${v<0?'bad':'good'}">${money(v)}</td></tr>`).join('')}</tbody></table></div></div>`:''}
  <p class="muted" style="font-size:13px">Revenus de la division""")

# ---------------- Club : feuille de route
rep("""  <div class="card"><h3>${S.div<6?'Cahier des charges : '+LV[S.div+1].n:'Sommet atteint'}</h3>
   ${S.div<6?(nt.length?nt.map(r=>`<div class="spread"><span>${esc(r.l)}</span>${r.ok?'<span class="pill g">OK</span>':'<span class="pill b">Manquant</span>'}</div>`).join(''):'<p class="muted">Aucune exigence particulière pour cette montée : seul le classement compte.</p>'):'<p>Le club est en Ligue 1. Visez le titre et la Coupe de France.</p>'}
   <p class="muted" style="font-size:13px;margin:0">Une montée sportive est refusée si ces critères ne sont pas remplis à la fin de la saison. Les chantiers en cours ne comptent pas.</p>
  </div></div>""",
"""  <div class="card"><h3>Feuille de route vers la Ligue 1</h3>
   ${S.div<6?`<div class="road">${LV.slice(S.div+1).map((l,k)=>{const t=S.div+1+k,rq=reqs(t),ok=rq.every(r=>r.ok);return `<div class="step ${ok?'ok':''} ${k===0?'next':''}"><h4>${l.n}${k===0?' <span class="pill y">prochaine marche</span>':''}</h4>${rq.length?'<ul>'+rq.map(r=>`<li class="${r.ok?'ok':''}">${esc(r.l)}</li>`).join('')+'</ul>':'<span class="muted" style="font-size:13px">Seul le classement compte.</span>'}</div>`;}).join('')}</div>`:'<p>Le club est en Ligue 1. Visez le titre et la Coupe de France.</p>'}
   <p class="muted" style="font-size:13px;margin:0">Une montée est refusée si les critères ne sont pas remplis à la fin de la saison. Les chantiers en cours ne comptent pas.</p>
  </div></div>""")

# compat anciennes sauvegardes
rep("if(saved&&saved.v===1){S=saved;", "if(saved&&saved.v===1){S=saved;S.track=S.track||{cash:[],pos:[]};S.sf.fi=S.sf.fi||{};")
open(p,'w').write(s); print('ok')
