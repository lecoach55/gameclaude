// positions (x vers le but adverse, y en largeur) de chaque rôle, dans l'ordre de FSLOTS
const LIVE_XY={
 '4-4-2':[[.05,.5],[.22,.14],[.2,.38],[.2,.62],[.22,.86],[.45,.12],[.42,.38],[.42,.62],[.45,.88],[.64,.38],[.64,.62]],
 '4-3-3':[[.05,.5],[.22,.14],[.2,.38],[.2,.62],[.22,.86],[.35,.5],[.45,.3],[.45,.7],[.62,.14],[.66,.5],[.62,.86]],
 '3-5-2':[[.05,.5],[.2,.25],[.18,.5],[.2,.75],[.4,.1],[.35,.5],[.46,.32],[.5,.62],[.4,.9],[.65,.38],[.65,.62]],
 '5-3-2':[[.05,.5],[.26,.1],[.18,.3],[.17,.5],[.18,.7],[.26,.9],[.37,.5],[.45,.28],[.45,.72],[.64,.38],[.64,.62]],
 '4-2-3-1':[[.05,.5],[.22,.14],[.2,.38],[.2,.62],[.22,.86],[.35,.38],[.35,.62],[.55,.14],[.54,.5],[.55,.86],[.68,.5]]
};
function livePos(form,away){const xy=LIVE_XY[form]||LIVE_XY['4-4-2'];return xy.map(([x,y])=>away?[1-x,1-y]:[x,y]);}
function liveStart(d,hn,an){
  const cv=document.getElementById('rsLive');if(!cv)return null;
  const lite=document.body.classList.contains('lite');
  const dpr=lite?1:Math.min(2,window.devicePixelRatio||1);cv.width=LIVE.W*dpr;cv.height=LIVE.H*dpr;
  let ctx=null;try{ctx=cv.getContext('2d');}catch(e){}if(!ctx)return null;ctx.scale(dpr,dpr);
  const grn=x=>{const n=parseInt(x.slice(1),16),r=n>>16,g=(n>>8)&255,b=n&255;return g>r+25&&g>b+15&&g<200;};
  const fix=c=>grn(c[0])?[c[1],c[0]]:c;
  let hc=fix(teamLook(hn)),ac=fix(teamLook(an));if(hc[0]===ac[0])ac=[ac[1],ac[0]];
  const oppForm=['4-4-2','4-3-3','4-2-3-1','3-5-2','5-3-2'][Math.abs(hashS(d.home?an:hn))%5];
  const hf=d.home?(d.form||'4-4-2'):oppForm,af=d.home?oppForm:(d.form||'4-4-2');
  // numéros : vrais numéros pour votre équipe (dans l'ordre du XI), 1-11 pour l'adversaire
  const ours=(d.lineup||[]).map(l=>{const p=l.id!=null&&getP(l.id);return p?shirtNo(p):null;});
  const nums=side=>{const mine=(side===0)===!!d.home;return [...Array(11)].map((_,i)=>mine&&ours[i]!=null?ours[i]:i+1);};
  const M={ctx,d,t:0,hc,ac,lite,home:livePos(hf,false),away:livePos(af,true),hn:nums(0),an:nums(1),
    cur:[null,null],ball:{x:.5,y:.5,tx:.5,ty:.5},poss:R()<.5?0:1,goal:0,gx:0,msg:'',msgT:0,big:'',bigT:0,done:false,raf:0,last:0,parts:[],chance:null,celeb:0};
  M.cur[0]=M.home.map(p=>p.slice());M.cur[1]=M.away.map(p=>p.slice());
  M.homeShare=(d.home?d.poss:100-d.poss)/100;
  M.pick=()=>{const team=M.poss===0?M.home:M.away;const dir=M.poss===0?1:-1;
    const cands=team.map((p,i)=>i).filter(i=>i>0);const i=pick(cands);const p=team[i];
    M.ball.tx=clamp(p[0]+dir*rf(0,.08)+M.shift(),.03,.97);M.ball.ty=clamp(p[1]+rf(-.05,.05),.06,.94);M.carrier=[M.poss,i];};
  M.shift=()=>(M.ball.x-.5)*.22;
  M.pick();
  const loop=ts=>{if(!document.getElementById('rsLive')){cancelAnimationFrame(M.raf);return;}
    const dt=Math.min(.05,(ts-(M.last||ts))/1000)*(S.speed||1);M.last=ts;M.t+=dt;liveStep(M,dt);liveDraw(M);if(!M.done)M.raf=requestAnimationFrame(loop);};
  M.raf=requestAnimationFrame(loop);
  return M;
}
// positions cibles : bloc qui coulisse avec le ballon, l'équipe qui a le ballon monte, les plus proches pressent
function liveTarget(M,side,i){
  const base=(side===0?M.home:M.away)[i],sh=M.shift(),b=M.ball;
  let x=base[0]+(i?sh:sh*.3),y=base[1];
  const own=side===M.poss;if(i&&own)x+=(side===0?.04:-.04);
  if(i){const dx=b.x-x,dy=b.y-y,dd=Math.hypot(dx,dy);if(dd<.22){const k=(own?.18:.42)*(1-dd/.22);x+=dx*k;y+=dy*k;}y+=(b.y-.5)*.12;}
  else{y=.5+(b.y-.5)*.35;}
  if(M.celeb>0&&M.celebSide===side&&i){x=M.celebX+Math.cos(i*1.9)*.05;y=M.celebY+Math.sin(i*1.9)*.08;}
  return [clamp(x,.01,.99),clamp(y,.03,.97)];
}
function liveStep(M,dt){
  const b=M.ball;
  if(M.msgT>0)M.msgT-=dt;if(M.bigT>0)M.bigT-=dt;if(M.celeb>0)M.celeb-=dt;
  for(let s=0;s<2;s++)for(let i=0;i<11;i++){const t=liveTarget(M,s,i),c=M.cur[s][i];const k=Math.min(1,dt*(M.celeb>0?3.2:2.2));c[0]+=(t[0]-c[0])*k;c[1]+=(t[1]-c[1])*k;}
  M.parts=M.parts.filter(p=>(p.l-=dt)>0);M.parts.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=.35*dt;});
  if(M.goal>0){M.goal-=dt;b.x+=(M.gx-b.x)*Math.min(1,dt*7);b.y+=(.5-b.y)*Math.min(1,dt*7);
    if(M.goal<=0){b.x=b.tx=.5;b.y=b.ty=.5;M.poss=M.gx>.5?1:0;M.pick();}return;}
  if(M.chance){const C=M.chance;C.t-=dt;
    if(C.phase===0){b.x+=(C.gx-b.x)*Math.min(1,dt*5);b.y+=(C.gy-b.y)*Math.min(1,dt*5);if(Math.abs(C.gx-b.x)<.02||C.t<.6){C.phase=1;b.tx=C.gx>.5?.82:.18;b.ty=clamp(C.gy+(C.kind==='save'?.18:-.2),.08,.92);}}
    else{b.x+=(b.tx-b.x)*Math.min(1,dt*4);b.y+=(b.ty-b.y)*Math.min(1,dt*4);}
    if(C.t<=0){M.chance=null;M.poss=C.gx>.5?1:0;M.pick();}return;}
  const sp=dt*2.6;b.x+=(b.tx-b.x)*Math.min(1,sp);b.y+=(b.ty-b.y)*Math.min(1,sp);
  if(Math.hypot(b.tx-b.x,b.ty-b.y)<.012){
    const keep=M.poss===0?M.homeShare:1-M.homeShare;
    if(R()>.55+keep*.35)M.poss=1-M.poss;
    M.pick();
  }
}
// maillot vu de dessus : corps, manches, numéro
function liveShirt(c,X,Y,s,col,num,gk){
  const f=gk?'#2b2f36':col[0],e=gk?'#f4c430':col[1];
  c.fillStyle='rgba(0,0,0,.32)';c.beginPath();c.ellipse(X+1.5,Y+s*1.05,s*.9,s*.35,0,0,Math.PI*2);c.fill();
  c.beginPath();c.moveTo(X-s*.55,Y-s*.75);c.lineTo(X-s*1.05,Y-s*.35);c.lineTo(X-s*.8,Y+s*.05);c.lineTo(X-s*.55,Y-s*.1);c.lineTo(X-s*.55,Y+s*.85);c.lineTo(X+s*.55,Y+s*.85);c.lineTo(X+s*.55,Y-s*.1);c.lineTo(X+s*.8,Y+s*.05);c.lineTo(X+s*1.05,Y-s*.35);c.lineTo(X+s*.55,Y-s*.75);c.lineTo(X+s*.2,Y-s*.75);c.quadraticCurveTo(X,Y-s*.5,X-s*.2,Y-s*.75);c.closePath();
  c.fillStyle=f;c.fill();c.lineWidth=Math.max(1.2,s*.16);c.strokeStyle=e;c.stroke();
  const lum=hexLum(f);c.fillStyle=lum>.45?'#111':'#fff';c.font='800 '+Math.round(s*.95)+'px Barlow, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(String(num),X,Y+s*.12);c.textBaseline='alphabetic';
}
function liveDraw(M){
  const c=M.ctx,W=LIVE.W,H=LIVE.H,px=x=>16+x*(W-32),py=y=>14+y*(H-28);
  if(!M.z){const cw=(c.canvas&&c.canvas.clientWidth)||640;M.z=clamp(640/cw,1,1.9);}const z=M.z,zr=Math.min(1.45,Math.pow(z,.7));
  c.clearRect(0,0,W,H);
  for(let k=0;k<12;k++){c.fillStyle=k%2?'#1f6a3c':'#1b5f35';c.fillRect(px(k/12),py(0),(W-32)/12+1,H-28);}
  if(!M.lite){const g=c.createRadialGradient(W/2,-60,20,W/2,-60,W*.8);g.addColorStop(0,'rgba(255,243,184,.18)');g.addColorStop(1,'rgba(255,243,184,0)');c.fillStyle=g;c.fillRect(0,0,W,H);}
  c.strokeStyle='rgba(255,255,255,.65)';c.lineWidth=1.6;
  c.strokeRect(px(0),py(0),W-32,H-28);c.beginPath();c.moveTo(W/2,py(0));c.lineTo(W/2,py(1));c.stroke();
  c.beginPath();c.arc(W/2,H/2,38,0,Math.PI*2);c.stroke();
  [[0,1],[1,-1]].forEach(([x0,s])=>{c.strokeRect(s>0?px(0):px(1)-86,H/2-78,86,156);c.strokeRect(s>0?px(0):px(1)-30,H/2-36,30,72);
    c.fillStyle='rgba(255,255,255,.85)';c.fillRect(s>0?px(0)-6:px(1),H/2-22,6,44);});
  const sz=8.2*zr;
  for(let s=0;s<2;s++){const col=s===0?M.hc:M.ac,nm=s===0?M.hn:M.an;M.cur[s].forEach((p,i)=>liveShirt(c,px(p[0]),py(p[1]),sz,col,nm[i],i===0));}
  const bx=px(M.ball.x),by=py(M.ball.y);
  c.beginPath();c.arc(bx+2,by+3,4.5*zr,0,Math.PI*2);c.fillStyle='rgba(0,0,0,.4)';c.fill();
  c.beginPath();c.arc(bx,by,4.5*zr,0,Math.PI*2);c.fillStyle='#fff';c.fill();c.strokeStyle='#222';c.lineWidth=1;c.stroke();
  M.parts.forEach(p=>{c.globalAlpha=Math.min(1,p.l*1.5);c.fillStyle=p.c;c.fillRect(px(p.x)-2,py(p.y)-3,4,6);});c.globalAlpha=1;
  if(M.chance&&M.chance.kind==='occ'&&M.chance.phase===1&&M.chance.t>.5){const gx=px(M.chance.gx>.5?1:0);c.strokeStyle='rgba(255,255,255,.9)';c.lineWidth=3;c.beginPath();c.arc(gx,H/2+(M.chance.gy>.5?22:-22),7,0,Math.PI*2);c.stroke();}
  if(M.msgT>0&&M.msg){const fs=Math.round(13*z),bh=28*z;c.font='600 '+fs+'px Barlow, sans-serif';const w=Math.min(W-20,c.measureText(M.msg).width+22*z);c.fillStyle='rgba(5,9,7,.85)';
    c.beginPath();c.roundRect?c.roundRect(W/2-w/2,H-16-bh,w,bh,8):c.rect(W/2-w/2,H-16-bh,w,bh);c.fill();c.fillStyle='#e9efe5';c.textAlign='center';c.fillText(M.msg,W/2,H-16-bh/2+fs*.36,W-30);}
  if(M.bigT>0&&M.big){const a=Math.min(1,M.bigT*2),sc=1+Math.max(0,M.bigT-1.4)*.6;c.save();c.globalAlpha=a;c.translate(W/2,H/2);c.scale(sc,sc);c.font='900 64px "Big Shoulders Display", Impact, sans-serif';c.textAlign='center';
    c.lineWidth=8;c.strokeStyle='rgba(0,0,0,.6)';c.strokeText(M.big,0,22);c.fillStyle=M.bigCol||'#f4c430';c.fillText(M.big,0,22);c.restore();}
}
function liveGoal(M,homeScored,who){if(!M)return;M.chance=null;M.goal=1.3;M.gx=homeScored?1.01:-.01;M.big='BUT !';M.bigT=1.7;M.msg=who;M.msgT=2.6;
  const side=homeScored?0:1,col=side===0?M.hc:M.ac;M.bigCol=col[0]&&hexLum(col[0])>.12?col[0]:'#f4c430';
  M.celeb=1.2;M.celebSide=side;M.celebX=homeScored?.9:.1;M.celebY=R()<.5?.12:.88;
  if(!M.lite&&!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches))for(let k=0;k<26;k++)M.parts.push({x:M.celebX+rf(-.05,.05),y:M.celebY+rf(-.05,.05),vx:rf(-.25,.25),vy:rf(-.5,-.15),l:rf(.9,1.6),c:k%2?col[0]:col[1]});}
// occasion (poteau, raté) de votre équipe ou arrêt de votre gardien
function liveChance(M,kind,usHome){if(!M||M.goal>0)return;const attackRight=kind==='occ'?usHome:!usHome;M.chance={kind,t:1.1,phase:0,gx:attackRight?.985:.015,gy:.5+(R()<.5?-1:1)*rf(.04,.09)};M.ball.x=attackRight?.8:.2;M.ball.y=rf(.3,.7);}
