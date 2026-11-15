// Bot de test : joue avec les vrais contrôles (joystick, boutons, cibles) et relève les anomalies.
(()=>{const BUG=window.__bugs=[];const log=(k,m)=>{if(BUG.filter(b=>b.k===k).length<5)BUG.push({k,m,t:Math.round(performance.now()/1000),F:VD.F});};
const $=id=>document.getElementById(id);const vis=el=>el&&el.offsetParent!==null&&getComputedStyle(el).display!=='none';
let joyDown=false,jc={x:0,y:0};const jz=$('joyz');
function joy(dx,dy){const r=jz.getBoundingClientRect();if(!joyDown){jc={x:r.left+r.width/2,y:r.top+r.height/2};jz.dispatchEvent(new PointerEvent('pointerdown',{pointerId:7,clientX:jc.x,clientY:jc.y,bubbles:true}));joyDown=true;}
 jz.dispatchEvent(new PointerEvent('pointermove',{pointerId:7,clientX:jc.x+dx*48,clientY:jc.y+dy*48,bubbles:true}));}
function joyUp(){if(joyDown){jz.dispatchEvent(new PointerEvent('pointerup',{pointerId:7,clientX:jc.x,clientY:jc.y,bubbles:true}));joyDown=false;}}
function bfs(sx,sy,tx,ty){const W=VD.W,H=VD.H,prev=new Int32Array(W*H).fill(-2),q=[sy*W+sx];prev[q[0]]=-1;const goal=ty*W+tx;
 while(q.length){const c=q.shift();if(c===goal)break;const x=c%W,y=(c/W)|0;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;const n=ny*W+nx;if(prev[n]!==-2)continue;if(VD.solid(nx+.5,ny+.5)&&n!==goal)continue;prev[n]=c;q.push(n);}}
 if(prev[goal]===-2)return null;const path=[];let c=goal;while(c!==-1){path.push(c);c=prev[c];}return path.reverse();}
let target=null,tStart=0,lastSig='',sigT=performance.now(),pickT=0,lastPos={x:0,y:0},moveT=performance.now(),panelN=0,explT=performance.now(),rot=0;
window.__stats={battles:0,floors:new Set(),wins:0,loses:0,panels:0,shops:0};
function chooseTarget(){const P=VD.P,c=[];
 VD.obj.forEach(o=>{if(!(o.t==='shrine'&&o.used))c.push({x:o.x,y:o.y,k:'obj:'+o.t,w:1});});
 VD.E.forEach(e=>c.push({x:e.x,y:e.y,k:e.boss?'boss':'pack',w:e.boss?(VD.E.length>1?6:1):1.2}));
 if(Math.random()<.15)c.push({x:VD.merch.x,y:VD.merch.y,k:'merch',w:1});
 if(!VD.bossAlive&&(c.length===0||performance.now()-explT>90000||Math.random()<.2))c.push({x:VD.stairs.x+.5,y:VD.stairs.y+.5,k:'stairs',w:.2});
 if(!c.length)c.push({x:VD.stairs.x+.5,y:VD.stairs.y+.5,k:'stairs',w:1});
 c.forEach(t=>t.d=Math.hypot(t.x-P.x,t.y-P.y)*t.w);c.sort((a,b)=>a.d-b.d);return c[0];}
function tick(){try{
 const now=performance.now();
 // invariants
 const P=VD.P;if(!P)return;if(window.__lastMap!==VD.map){window.__lastMap=VD.map;target=null;}
 if(!isFinite(P.x)||!isFinite(P.y))log('nanpos',P.x+','+P.y);
 P.heroes.forEach(h=>{if(h.hp>h.s.mhp+.01)log('hpmax',h.n+' '+h.hp+'/'+h.s.mhp);if(h.hp<0)log('hpneg',h.n+' '+h.hp);if(!isFinite(h.hp))log('hpnan',h.n);if(h.en<-.01||h.en>h.s.men+.01)log('en',h.n+' '+h.en+'/'+h.s.men);});
 if(P.gold<0||!isFinite(P.gold))log('gold',P.gold);
 if(!VD.B&&G3.mapRef&&G3.mapRef!==VD.map)log('mapdesync','F'+VD.F);
 if(!VD.B&&VD.solid(P.x,P.y))log('inwall','P '+P.x.toFixed(2)+','+P.y.toFixed(2));
 const story=$('story').style.display==='block',panel=$('panel').style.display==='block';
 const sig=[story,panel,!!VD.B,VD.B?VD.B.log.length+'|'+(VD.B.cur&&VD.B.cur.n)+'|'+VD.B.wait+'|'+VD.B.over:'',P.x.toFixed(1),P.y.toFixed(1),VD.F,$('bact')&&$('bact').innerText.slice(0,30)].join('/');
 if(sig!==lastSig){lastSig=sig;sigT=now;}else if(now-sigT>25000){log('stuck',sig+' menu='+(window.__ui&&__ui.menu)+' bui='+(vis($('bui')))+' tw='+(__ui.tw.length)+' steps='+(__ui.steps.length));sigT=now;
  if(VD.B&&VD.B.over){/*essaie de sortir*/}else if(!VD.B){const r=VD.rooms[0];P.x=r.cx+.5;P.y=r.cy+.5;}}
 // 3D : modèle de chaque héros présent
 if(story){$('story').querySelector('.sskip')&&$('story').querySelector('.sskip').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));joyUp();return;}
 if(panel){joyUp();panelN++;if(panelN%3)return;const b=$('cont')||$('rsp');if(b){if($('cont'))__stats.wins++;else __stats.loses++;b.click();return;}
  const bs=[...document.querySelectorAll('#panel button')].filter(x=>!x.disabled&&x.id!=='xx'&&vis(x));
  if(Math.random()<.65&&bs.length&&panelN<60){bs[(Math.random()*bs.length)|0].click();}else{panelN=0;$('xx')&&$('xx').click();}return;}
 panelN=0;
 if(VD.B){joyUp();if(VD.B.over)return;if(VD.B.wait==='hero'&&__ui.menu&&!__ui.sel){
   const bs=[...document.querySelectorAll('#bact [data-k],#bact [data-i]')].filter(x=>!x.disabled&&x.dataset.k!=='flee'||(x.dataset.k==='flee'&&Math.random()<.03));
   if(bs.length){const b=bs[(Math.random()*bs.length)|0];b.click();}}
  else if(__ui.sel){const s=__ui.sel;const pool=s.tg==='foe'?VD.B.foes.filter(f=>!f.dead):s.tg==='dead'?P.heroes.filter(h=>h.dead):P.heroes.filter(h=>!h.dead);
   if(!pool.length){const bk=$('bk');if(bk)bk.click();else{window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));window.dispatchEvent(new KeyboardEvent('keyup',{key:'Escape'}));}return;}
   const u=pool[(Math.random()*pool.length)|0];const sc=G3.screenOf(u);if(!sc){log('noscreen',u.n);return;}
   if(sc.x<0||sc.x>innerWidth||sc.top<0||sc.y>innerHeight)log('offscreen',u.n+' '+Math.round(sc.x)+','+Math.round(sc.y)+' top '+Math.round(sc.top)+' F'+VD.F);
   const x=sc.x,y=(sc.y+sc.top)/2;const el=document.elementFromPoint(x,y);if(el&&el.id!=='cv')log('covered',u.n+' by '+(el.id||el.className||el.tagName)+' at '+Math.round(x)+','+Math.round(y));
   const hit=G3.hitTest(x,y);if(hit!==u)log('hittest',u.n+' -> '+(hit&&hit.n));
   $('cv').dispatchEvent(new PointerEvent('pointerdown',{clientX:x,clientY:y,bubbles:true}));}
  return;}
 __stats.floors.add(VD.F);
 // exploration
 if(Math.random()<.004){(Math.random()<.5?$('rotL'):$('rotR')).click();}
 if(!target||now-pickT>20000||(target.k==='pack'&&!VD.E.some(e=>Math.hypot(e.x-target.x,e.y-target.y)<.01&&true))){target=chooseTarget();pickT=now;}
 if(target.k==='pack'||target.k==='boss'){const e=VD.E.slice().sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y))[0];if(e&&target.k==='pack'){target.x=e.x;target.y=e.y;}}
 const d=Math.hypot(target.x-P.x,target.y-P.y);
 if(d<.6){if(target.k==='stairs'||target.k==='merch'){if(VD.ctx==='down'||VD.ctx==='shop'){if(VD.ctx==='shop')__stats.shops++;$('ctx').click();explT=now;}}target=null;return;}
 const path=bfs(P.x|0,P.y|0,target.x|0,target.y|0);
 if(!path){log('nopath',target.k+' '+target.x.toFixed(1)+','+target.y.toFixed(1)+' from '+P.x.toFixed(1)+','+P.y.toFixed(1));target=null;return;}
 const nxt=path.length>2?path[2]:path[path.length-1];const nx=nxt%VD.W+.5,ny=((nxt/VD.W)|0)+.5;let wx=(path.length>2?nx:target.x)-P.x,wy=(path.length>2?ny:target.y)-P.y;const l=Math.hypot(wx,wy)||1;wx/=l;wy/=l;
 const yaw=G3.yaw,c=Math.cos(yaw),s=Math.sin(yaw);joy(wx*c-wy*s,wx*s+wy*c);
 if(Math.hypot(P.x-lastPos.x,P.y-lastPos.y)>.05){lastPos={x:P.x,y:P.y};moveT=now;}else if(now-moveT>6000){log('blocked','at '+P.x.toFixed(2)+','+P.y.toFixed(2)+' toward '+target.k+' cell '+(P.x|0)+','+(P.y|0));moveT=now;target=null;P.x=(P.x|0)+.5;P.y=(P.y|0)+.5;}
}catch(e){log('agentErr',e.message+' '+e.stack.slice(0,200));}}
setInterval(tick,90);
// compteur de combats
const ob=VD.startBattle;})();
