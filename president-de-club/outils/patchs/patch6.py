p='/home/claude/president/index.html'; s=open(p).read()
def rep(old,new,cnt=1):
    global s
    n=s.count(old); assert n==cnt,(n,old[:100]); s=s.replace(old,new)

# ============================== CSS
rep("/* ===================== Habillage « soir de match » ===================== */", r"""/* ===================== Habillage « soir de match » ===================== */
.live{position:relative;border-radius:14px;overflow:hidden;border:1px solid #23402d;box-shadow:inset 0 0 40px rgba(0,0,0,.5)}
.live canvas{display:block;width:100%;height:auto}
.pc-wrap{display:grid;grid-template-columns:190px minmax(0,1fr);gap:16px;align-items:start}
@media (max-width:560px){.pc-wrap{grid-template-columns:1fr;justify-items:center}.pc-wrap>.kpis{width:100%}}
.pcard{position:relative;width:190px;height:262px;border-radius:16px 16px 22px 22px;padding:14px 14px 12px;overflow:hidden;color:#1b1606;
  box-shadow:0 18px 40px -16px rgba(0,0,0,.8),inset 0 0 0 2px rgba(255,255,255,.25);isolation:isolate}
.pcard.or{background:linear-gradient(150deg,#fff1b0 0%,#e9c048 38%,#b8861a 70%,#f5d675 100%)}
.pcard.argent{background:linear-gradient(150deg,#ffffff 0%,#c9d2d8 40%,#8c99a3 72%,#e8eef2 100%)}
.pcard.bronze{background:linear-gradient(150deg,#ffd9b3 0%,#c9864f 42%,#8a5428 75%,#e3a36f 100%)}
.pcard.jeune{background:linear-gradient(150deg,#d6fff0 0%,#5ccf88 40%,#21794a 75%,#a8f0c8 100%)}
.pcard::after{content:'';position:absolute;inset:-40% -60%;background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,.55) 50%,transparent 60%);transform:translateX(-60%);animation:shine 3.8s ease-in-out 1s infinite;z-index:-1}
@keyframes shine{0%,60%{transform:translateX(-60%)}100%{transform:translateX(60%)}}
.pcard .top{display:flex;justify-content:space-between;align-items:flex-start;padding:0;background:none;border:0}
.pcard .top::before,.pcard .top::after{display:none}
.pcard .big{font:900 46px/0.9 var(--display)}
.pcard .ps{font:800 15px/1 var(--display);letter-spacing:.06em;margin-top:4px}
.pcard .shirt{display:grid;place-items:center;margin:-6px 0 2px}
.pcard .nm{text-align:center;font:900 19px/1 var(--display);text-transform:uppercase;letter-spacing:.02em;border-top:1px solid rgba(0,0,0,.25);border-bottom:1px solid rgba(0,0,0,.25);padding:5px 0;margin:2px 0 7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pcard .at{display:grid;grid-template-columns:1fr 1fr;gap:2px 12px;font:700 12.5px var(--body)}
.pcard .at b{font:900 15px var(--display);margin-right:4px}
.cabinet{display:flex;flex-wrap:wrap;gap:14px;align-items:flex-end;padding:16px;border-radius:12px;background:linear-gradient(180deg,#0c1510,#132019);border:1px solid var(--line2);box-shadow:inset 0 -14px 0 #1b2a21}
.troph{display:grid;justify-items:center;gap:6px;width:112px;text-align:center;font-size:12px;color:#c9d4c9}
.troph svg{filter:drop-shadow(0 8px 12px rgba(0,0,0,.6))}
.troph.ghost{opacity:.28;filter:grayscale(1)}
.confetti{position:absolute;inset:0;pointer-events:none;z-index:2;border-radius:20px}
@media (prefers-reduced-motion:reduce){.pcard::after{animation:none;display:none}}
""")

# ============================== moteur du match animé
rep("function repTick(){", r"""/* ---------- match en direct (canevas) ---------- */
const LIVE={W:640,H:360};
function livePos(form,away){
  const f=FORM[form]||FORM['4-4-2'],out=[];
  const col=(n,x)=>{for(let i=0;i<n;i++)out.push([x,.12+.76*(i+1)/(n+1)]);};
  col(1,.05);col(f.D,.22);
  if(form==='4-2-3-1'){col(2,.38);col(3,.55);}else col(f.M,.45);
  col(f.A,.66);
  return out.map(([x,y])=>away?[1-x,1-y]:[x,y]);
}
function liveStart(d,hn,an){
  const cv=document.getElementById('rsLive');if(!cv)return null;
  const dpr=Math.min(2,window.devicePixelRatio||1);cv.width=LIVE.W*dpr;cv.height=LIVE.H*dpr;
  const ctx=cv.getContext('2d');ctx.scale(dpr,dpr);
  let hc=teamLook(hn),ac=teamLook(an);if(hc[0]===ac[0])ac=[ac[1],ac[0]];
  const M={ctx,d,t:0,hc,ac,home:livePos(d.home?d.form:'4-4-2',false),away:livePos(d.home?'4-4-2':d.form,true),
    ball:{x:.5,y:.5,tx:.5,ty:.5},poss:R()<.5?0:1,goal:0,gx:0,msg:'',msgT:0,big:'',bigT:0,done:false,raf:0,last:0};
  M.homeShare=(d.home?d.poss:100-d.poss)/100;
  M.pick=()=>{const team=M.poss===0?M.home:M.away;const dir=M.poss===0?1:-1;
    const cands=team.map((p,i)=>i).filter(i=>i>0);const i=pick(cands);const p=team[i];
    M.ball.tx=clamp(p[0]+dir*rf(0,.08)+M.shift(),.03,.97);M.ball.ty=clamp(p[1]+rf(-.05,.05),.06,.94);};
  M.shift=()=>(M.ball.x-.5)*.22;
  M.pick();
  const loop=ts=>{if(!document.getElementById('rsLive')){cancelAnimationFrame(M.raf);return;}
    const dt=Math.min(.05,(ts-(M.last||ts))/1000);M.last=ts;M.t+=dt;liveStep(M,dt);liveDraw(M);if(!M.done)M.raf=requestAnimationFrame(loop);};
  M.raf=requestAnimationFrame(loop);
  return M;
}
function liveStep(M,dt){
  const b=M.ball;
  if(M.goal>0){M.goal-=dt;b.x+=(M.gx-b.x)*Math.min(1,dt*7);b.y+=(.5-b.y)*Math.min(1,dt*7);
    if(M.goal<=0){b.x=b.tx=.5;b.y=b.ty=.5;M.poss=M.gx>.5?1:0;M.pick();}return;}
  const sp=dt*2.6;b.x+=(b.tx-b.x)*Math.min(1,sp);b.y+=(b.ty-b.y)*Math.min(1,sp);
  if(Math.hypot(b.tx-b.x,b.ty-b.y)<.012){
    const keep=M.poss===0?M.homeShare:1-M.homeShare;
    if(R()>.55+keep*.35)M.poss=1-M.poss;
    M.pick();
  }
  if(M.msgT>0)M.msgT-=dt;if(M.bigT>0)M.bigT-=dt;
}
function liveDraw(M){
  const c=M.ctx,W=LIVE.W,H=LIVE.H,px=x=>16+x*(W-32),py=y=>14+y*(H-28);
  c.clearRect(0,0,W,H);
  for(let k=0;k<12;k++){c.fillStyle=k%2?'#1f6a3c':'#1b5f35';c.fillRect(px(k/12),py(0),(W-32)/12+1,H-28);}
  const g=c.createRadialGradient(W/2,-60,20,W/2,-60,W*.8);g.addColorStop(0,'rgba(255,243,184,.18)');g.addColorStop(1,'rgba(255,243,184,0)');c.fillStyle=g;c.fillRect(0,0,W,H);
  c.strokeStyle='rgba(255,255,255,.65)';c.lineWidth=1.6;
  c.strokeRect(px(0),py(0),W-32,H-28);c.beginPath();c.moveTo(W/2,py(0));c.lineTo(W/2,py(1));c.stroke();
  c.beginPath();c.arc(W/2,H/2,38,0,Math.PI*2);c.stroke();
  [[0,1],[1,-1]].forEach(([x0,s])=>{c.strokeRect(s>0?px(0):px(1)-86,H/2-78,86,156);c.strokeRect(s>0?px(0):px(1)-30,H/2-36,30,72);
    c.fillStyle='rgba(255,255,255,.85)';c.fillRect(s>0?px(0)-6:px(1),H/2-22,6,44);});
  const sh=M.shift(),wob=(i,k)=>Math.sin(M.t*1.3+i*1.7+k)*.012;
  const drawTeam=(team,col,side)=>team.forEach((p,i)=>{
    let x=p[0]+(i?sh:sh*.3),y=p[1]+wob(i,side*3);
    const own=(side===0?M.poss===0:M.poss===1);if(i&&own)x+=(side===0?.03:-.03);
    const X=px(clamp(x,.01,.99)),Y=py(clamp(y,.02,.98));
    c.beginPath();c.arc(X,Y+2,8,0,Math.PI*2);c.fillStyle='rgba(0,0,0,.35)';c.fill();
    c.beginPath();c.arc(X,Y,8,0,Math.PI*2);c.fillStyle=i===0?'#2b2f36':col[0];c.fill();c.lineWidth=2.4;c.strokeStyle=i===0?'#f4c430':col[1];c.stroke();});
  drawTeam(M.home,M.hc,0);drawTeam(M.away,M.ac,1);
  const bx=px(M.ball.x),by=py(M.ball.y);
  c.beginPath();c.arc(bx+2,by+3,4.5,0,Math.PI*2);c.fillStyle='rgba(0,0,0,.4)';c.fill();
  c.beginPath();c.arc(bx,by,4.5,0,Math.PI*2);c.fillStyle='#fff';c.fill();c.strokeStyle='#222';c.lineWidth=1;c.stroke();
  if(M.msgT>0&&M.msg){c.font='600 13px Barlow, sans-serif';const w=c.measureText(M.msg).width+22;c.fillStyle='rgba(5,9,7,.82)';
    c.beginPath();c.roundRect?c.roundRect(W/2-w/2,H-44,w,28,8):c.rect(W/2-w/2,H-44,w,28);c.fill();c.fillStyle='#e9efe5';c.textAlign='center';c.fillText(M.msg,W/2,H-25);}
  if(M.bigT>0&&M.big){const a=Math.min(1,M.bigT*2);c.save();c.globalAlpha=a;c.font='900 64px "Big Shoulders Display", Impact, sans-serif';c.textAlign='center';
    c.lineWidth=8;c.strokeStyle='rgba(0,0,0,.6)';c.strokeText(M.big,W/2,H/2+22);c.fillStyle='#f4c430';c.fillText(M.big,W/2,H/2+22);c.restore();}
}
function liveGoal(M,homeScored,who){if(!M)return;M.goal=1.3;M.gx=homeScored?1.01:-.01;M.big='BUT !';M.bigT=1.7;M.msg=who;M.msgT=2.6;}
function liveMsg(M,t){if(!M)return;M.msg=t;M.msgT=2.2;}
function liveEnd(M,txt){if(!M)return;M.big=txt;M.bigT=99;M.msg='';liveDraw(M);M.done=true;cancelAnimationFrame(M.raf);liveDraw(M);}
function repTick(){""")

# insertion du terrain dans le rapport + démarrage
rep("""  <div class="spread"><h3 id="rsRes" class="later""", """  <div class="live"><canvas id="rsLive" width="640" height="360" role="img" aria-label="Animation du match"></canvas></div>
  <div class="spread"><h3 id="rsRes" class="later""")
rep("""  if(reduce)repFinish();else UI.rep.timer=setInterval(repTick,30);""",
    """  UI.rep.live=liveStart(d,hn.replace(/ \\(.*\\)$/,''),an.replace(/ \\(.*\\)$/,''));
  if(reduce)repFinish();else UI.rep.timer=setInterval(repTick,30);""")
rep("""      if((k==='goal')===r.d.home)r.h++;else r.a++;""","""      const hs=(k==='goal')===r.d.home;if(hs)r.h++;else r.a++;liveGoal(r.live,hs,(li.children[2]||li).textContent.split(' (')[0].split(' · ')[0]);""")
rep("""    }else r.pause=k==='ht'?12:5;""","""    }else{r.pause=k==='ht'?12:5;liveMsg(r.live,(k==='ht'?'Mi-temps':k==='yc'?'Carton jaune · ':k==='rc'?'Carton rouge · ':'Blessure · ')+(k==='ht'?'':(li.children[2]||li).textContent));}""")
rep("""  const r=UI.rep;if(!r)return;stopRep();r.done=true;""","""  const r=UI.rep;if(!r)return;stopRep();r.done=true;
  if(r.live){r.live.ball.x=.5;r.live.ball.y=.5;r.live.goal=0;liveEnd(r.live,r.final[0]+' - '+r.final[1]);}""")

# ============================== carte joueur
rep("function tc(name,size){", r"""function pcard(p,at){
  const L=LV[S.div],tier=p.youth&&p.age<=19?'jeune':p.ovr>=L.str[1]?'or':p.ovr>=(L.str[0]+L.str[1])/2?'argent':'bronze';
  const ab=p.pos==='G'?['RÉF','PLA','PIE','SOR','MEN','PHY']:['VIT','TEC','PAS','TIR','DEF','PHY'];
  return `<div class="pcard ${tier}"><div class="top"><div><div class="big">${p.ovr}</div><div class="ps">${{G:'GB',D:'DEF',M:'MIL',A:'ATT'}[p.pos]}</div></div><div style="display:grid;justify-items:end;gap:4px">${crest(S.club.c1,S.club.c2,S.club.name,26)}<span style="font:800 11px var(--body)">${p.age} ans</span></div></div>
   <div class="shirt">${jersey(p,64)}</div><div class="nm">${esc(p.ln)}</div>
   <div class="at">${at.map((a,k)=>`<span><b>${a.v}</b>${ab[k]}</span>`).join('')}</div></div>`;
}
function tc(name,size){""")
rep("""    body=`<div class="kpis">
     <div class="kpi"><div class="l">Note</div><div class="v gold">${p.ovr}</div></div>""","""    body=`<div class="pc-wrap">${pcard(p,at)}<div class="kpis">
     <div class="kpi"><div class="l">Note</div><div class="v gold">${p.ovr}</div></div>""")
rep("""     <div class="kpi"><div class="l">Note moyenne</div><div class="v" style="font-size:20px">${fmtN(avgN(s))}</div></div>
    </div>""","""     <div class="kpi"><div class="l">Note moyenne</div><div class="v" style="font-size:20px">${fmtN(avgN(s))}</div></div>
    </div></div>""")

# ============================== vitrine à trophées
rep("function tc(name,size){", r"""function trophySVG(kind,sz){
  sz=sz||74;const u='tr'+(++CREST_N);
  const gold=`<defs><linearGradient id="${u}" x1="0" x2="1"><stop offset="0" stop-color="#8a6510"/><stop offset=".35" stop-color="#ffe58a"/><stop offset=".6" stop-color="#e3b02a"/><stop offset="1" stop-color="#7a5a0e"/></linearGradient></defs>`;
  if(kind==='coupe')return `<svg viewBox="0 0 80 100" width="${sz}" height="${sz*1.25}" aria-hidden="true">${gold}<path d="M22 8h36v22c0 14-8 24-18 24S22 44 22 30z" fill="url(#${u})"/><path d="M22 14H10c0 12 6 18 14 18M58 14h12c0 12-6 18-14 18" fill="none" stroke="url(#${u})" stroke-width="5"/><rect x="36" y="54" width="8" height="16" fill="url(#${u})"/><path d="M24 70h32l4 12H20z" fill="url(#${u})"/><rect x="16" y="82" width="48" height="12" rx="2" fill="#3a2a10"/><text x="40" y="91" text-anchor="middle" font-size="7" font-weight="800" fill="#f4c430" font-family="Barlow,sans-serif">CDF</text></svg>`;
  return `<svg viewBox="0 0 80 100" width="${sz}" height="${sz*1.25}" aria-hidden="true">${gold}<path d="M40 6l26 10v22c0 22-12 36-26 42C26 74 14 60 14 38V16z" fill="url(#${u})"/><path d="M40 16l16 6v15c0 15-7 25-16 29-9-4-16-14-16-29V22z" fill="#1b5f35" stroke="#7a5a0e"/><path d="M40 28l3.5 7 7.5 1-5.5 5 1.5 7.5L40 45l-7 3.5L34.5 41 29 36l7.5-1z" fill="#ffe58a"/><rect x="16" y="82" width="48" height="12" rx="2" fill="#3a2a10"/><text x="40" y="91" text-anchor="middle" font-size="7" font-weight="800" fill="#f4c430" font-family="Barlow,sans-serif">CHAMPION</text></svg>`;
}
function tc(name,size){""")
rep("""   <div class="card"><h3>Palmarès</h3>${S.palmares.length?S.palmares.map(p=>'<div class="gold">'+esc(p)+'</div>').join(''):'<p class="muted">L’armoire à trophées attend son premier occupant.</p>'}</div>""",
    """   <div class="card"><h3>Vitrine à trophées</h3><div class="cabinet">${S.palmares.map(p=>`<div class="troph">${trophySVG(/^Coupe/.test(p)?'coupe':'titre')}<span>${esc(p)}</span></div>`).join('')}${S.palmares.some(p=>/Ligue 1/.test(p)&&/^Champion/.test(p))?'':`<div class="troph ghost">${trophySVG('titre')}<span>Champion de Ligue 1</span></div>`}${S.palmares.some(p=>/^Coupe/.test(p))?'':`<div class="troph ghost">${trophySVG('coupe')}<span>Coupe de France</span></div>`}</div>${S.palmares.length?'':'<p class="muted" style="margin:0;font-size:13px">Les silhouettes montrent les trophées qui restent à conquérir.</p>'}</div>""")

# ============================== célébration de fin de saison
rep("""  openModal(`<div class="kicker">Bilan ${seasonLabel(S.year)}</div>
  <h2>${e.champion?'Champions de '+L.n+' !':e.pos+'<sup>e</sup> de '+L.n}</h2>""","""  const party=e.champion||e.out==='up'||S.cup.won;
  openModal(`${party?'<canvas class="confetti" id="confetti"></canvas>':''}<div class="kicker">Bilan ${seasonLabel(S.year)}</div>
  ${e.champion||S.cup.won?`<div class="row" style="justify-content:center;gap:24px">${e.champion?trophySVG('titre',92):''}${S.cup.won?trophySVG('coupe',92):''}</div>`:''}
  <h2>${e.champion?'Champions de '+L.n+' !':e.pos+'<sup>e</sup> de '+L.n}</h2>""")
rep("""  <div class="row"><button class="btn pri" onclick="A.newSeason()">Lancer la saison ${seasonLabel(S.year+1)}</button></div>`,true);""",
    """  <div class="row"><button class="btn pri" onclick="A.newSeason()">Lancer la saison ${seasonLabel(S.year+1)}</button></div>`,true);
  if(party)confetti();""")
rep("function tc(name,size){", r"""function confetti(){
  const cv=document.getElementById('confetti');if(!cv)return;
  if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const box=cv.parentElement,W=box.clientWidth,H=Math.min(box.scrollHeight,900);cv.width=W;cv.height=H;cv.style.height=H+'px';
  const c=cv.getContext('2d'),cols=[S.club.c1,S.club.c2,'#f4c430','#ffffff','#5ccf88'];
  const P=[...Array(140)].map(()=>({x:rf(0,W),y:rf(-H,0),vx:rf(-40,40),vy:rf(90,200),r:rf(0,6.28),vr:rf(-6,6),w:rf(6,11),h:rf(3,6),c:pick(cols)}));
  let last=0,t=0;const loop=ts=>{if(!document.getElementById('confetti'))return;const dt=Math.min(.05,(ts-(last||ts))/1000);last=ts;t+=dt;
    c.clearRect(0,0,W,H);P.forEach(p=>{p.x+=p.vx*dt+Math.sin(t*3+p.r)*.6;p.y+=p.vy*dt;p.r+=p.vr*dt;c.save();c.translate(p.x,p.y);c.rotate(p.r);c.globalAlpha=Math.max(0,1-t/5);c.fillStyle=p.c;c.fillRect(-p.w/2,-p.h/2,p.w,p.h);c.restore();});
    if(t<5)requestAnimationFrame(loop);else c.clearRect(0,0,W,H);};
  requestAnimationFrame(loop);
}
function tc(name,size){""")
open(p,'w').write(s); print('ok')
