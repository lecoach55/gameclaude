// Testeur exhaustif : parcourt toutes les cases de chaque étage avec le vrai joystick,
// ouvre chaque coffre/sanctuaire, visite le marchand, clique tout dans les menus,
// utilise toutes les compétences en combat, tourne la caméra, bat le dragon et descend.
(()=>{const BUG=window.__bugs=[];const log=(k,m)=>{if(BUG.filter(b=>b.k===k).length<8)BUG.push({k,m,F:VD.F,t:Math.round(performance.now()/1000)});};
const $=id=>document.getElementById(id);const vis=el=>el&&el.offsetParent!==null&&getComputedStyle(el).display!=='none';
let joyDown=false,jc={x:0,y:0};const jz=$('joyz');
function joy(dx,dy){const r=jz.getBoundingClientRect();if(!joyDown){jc={x:r.left+r.width/2,y:r.top+r.height/2};jz.dispatchEvent(new PointerEvent('pointerdown',{pointerId:7,clientX:jc.x,clientY:jc.y,bubbles:true}));joyDown=true;}
 jz.dispatchEvent(new PointerEvent('pointermove',{pointerId:7,clientX:jc.x+dx*48,clientY:jc.y+dy*48,bubbles:true}));}
function joyUp(){if(joyDown){jz.dispatchEvent(new PointerEvent('pointerup',{pointerId:7,clientX:jc.x,clientY:jc.y,bubbles:true}));joyDown=false;}}
const walk=(x,y)=>x>=0&&y>=0&&x<VD.W&&y<VD.H&&!VD.solid(x+.5,y+.5);
function bfsAll(sx,sy){const W=VD.W,H=VD.H,dist=new Int32Array(W*H).fill(-1),prev=new Int32Array(W*H).fill(-1),q=[sy*W+sx];dist[q[0]]=0;let h=0;
 while(h<q.length){const c=q[h++],x=c%W,y=(c/W)|0;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(!walk(nx,ny))continue;const n=ny*W+nx;if(dist[n]>=0)continue;dist[n]=dist[c]+1;prev[n]=c;q.push(n);}}return{dist,prev};}
function pathTo(B,goal){if(B.dist[goal]<0)return null;const p=[];let c=goal;while(c!==-1){p.push(c);c=B.prev[c];}return p.reverse();}
const S=window.__cov={floors:{},skills:{},panels:new Set(),clicked:new Set(),shops:0,buys:0,sells:0,ups:0,rot:0,battles:0,wins:0,loses:0,bosses:0,chests:0,shrines:0,brk:0,respawnTested:false,maxStuck:0};
let F=-1,visited=null,walkN=0,target=null,path=null,pickT=0,lastPos={x:0,y:0},moveT=performance.now(),phase='explore',merchDone=false,panelClicks=0,lastRot=performance.now(),floorT=performance.now(),sigT=performance.now(),lastSig='',lossPlanned=false;
function newFloor(){F=VD.F;visited=new Uint8Array(VD.W*VD.H);walkN=0;for(let y=0;y<VD.H;y++)for(let x=0;x<VD.W;x++)if(walk(x,y))walkN++;
 const B=bfsAll(VD.P.x|0,VD.P.y|0);let reach=0;for(let i=0;i<B.dist.length;i++)if(B.dist[i]>=0)reach++;if(reach<walkN)log('unreachable',`${walkN-reach} cases inaccessibles depuis le départ`);
 // objets posés dans des cases inaccessibles ?
 VD.obj.forEach(o=>{const c=(o.y|0)*VD.W+(o.x|0);if(B.dist[c]<0)log('objUnreach',o.t+' '+o.x.toFixed(1)+','+o.y.toFixed(1));});
 if(B.dist[VD.stairs.y*VD.W+VD.stairs.x]<0)log('stairsUnreach','F'+VD.F);
 S.floors[F]={walk:walkN,visited:0,objs:VD.obj.length,merch:false,t:0};phase='explore';merchDone=false;target=null;floorT=performance.now();
 // garde le groupe en vie pour tout explorer (le test porte sur les bugs, pas l'équilibrage)
 const P=VD.P;const L=VD.F+5;if(P.lvl<L){P.lvl=L;P.heroes.forEach(h=>{h.lvl=Math.max(h.lvl,L);});VD.calcAll();}P.pot.soin=Math.max(P.pot.soin,6);P.pot.phenix=Math.max(P.pot.phenix,2);P.gold=Math.max(P.gold,1500);
 P.heroes.forEach(h=>{h.dead=false;h.hp=h.s.mhp;h.en=h.s.men;});}
function covered(){let n=0;for(let i=0;i<visited.length;i++)n+=visited[i];return n;}
function nextTarget(){const P=VD.P,B=bfsAll(P.x|0,P.y|0);let best=-1,bd=1e9;
 for(let i=0;i<visited.length;i++){if(visited[i]||B.dist[i]<0)continue;if(B.dist[i]<bd){bd=B.dist[i];best=i;}}
 return best<0?null:{c:best,p:pathTo(B,best)};}
function clickables(){return[...document.querySelectorAll('#panel button,#panel [data-b],#panel [data-e]')].filter(x=>!x.disabled&&vis(x));}
function sigOf(el){return(el.id||'')+'|'+Object.entries(el.dataset).map(([k,v])=>k+'='+(k==='b'?'*':v)).join(',')+'|'+(el.dataset.b||el.dataset.e?'':el.textContent.trim().slice(0,14));}
function panelStep(){const P=VD.P;const story=$('story').style.display==='block';if(story){const sk=$('story').querySelector('.sskip');if(sk)sk.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));return true;}
 if($('panel').style.display!=='block')return false;joyUp();
 const c=$('cont')||$('rsp');if(c&&vis(c)){if($('cont'))S.wins++;else S.loses++;c.click();return true;}
 const tabOn=document.querySelector('#panel .tabs .on');if(tabOn)S.panels.add(tabOn.dataset.t);
 const bs=clickables();const fresh=bs.filter(b=>!S.clicked.has(sigOf(b))&&b.id!=='xx'&&!/Vendre Communs/.test(b.textContent));
 if(fresh.length&&panelClicks<40){const b=fresh[0];S.clicked.add(sigOf(b));panelClicks++;
  if(b.dataset.buy)S.buys++;if(b.id==='slb')S.sells++;if(b.dataset.up)S.ups++;b.click();return true;}
 // onglets pas encore vus
 const tb=[...document.querySelectorAll('#panel .tabs [data-t]')].find(t=>!S.panels.has(t.dataset.t));if(tb&&panelClicks<45){panelClicks++;tb.click();return true;}
 panelClicks=0;const x=$('xx');if(x)x.click();return true;}
function battleStep(){const B=VD.B,P=VD.P;joyUp();if(B.over)return;
 if(B.wait==='hero'&&__ui.menu&&!__ui.sel){const u=B.cur;const bs=[...document.querySelectorAll('#bact [data-k],#bact [data-i]')].filter(x=>!x.disabled&&x.dataset.k!=='flee');
  if(!bs.length)return;const key=b=>u.cls+':'+(b.dataset.k||'item:'+b.dataset.i);
  // priorité aux actions jamais utilisées, sinon aléatoire
  const un=bs.filter(b=>!S.skills[key(b)]);const off=bs.filter(b=>b.dataset.k&&!['defend','items'].includes(b.dataset.k));const b=un.length?un[0]:(off.length&&Math.random()<.85?off[(Math.random()*off.length)|0]:bs[(Math.random()*bs.length)|0]);S.skills[key(b)]=(S.skills[key(b)]||0)+1;b.click();return;}
 if(__ui.sel){if(!__ui.sel.__t){__ui.sel.__t=performance.now();return;}if(performance.now()-__ui.sel.__t<350)return;const s=__ui.sel;const pool=s.tg==='foe'?B.foes.filter(f=>!f.dead):s.tg==='dead'?P.heroes.filter(h=>h.dead):P.heroes.filter(h=>!h.dead);
  if(!pool.length){const bk=$('bk');if(bk)bk.click();else{window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));window.dispatchEvent(new KeyboardEvent('keyup',{key:'Escape'}));}return;}
  const u=pool[(Math.random()*pool.length)|0];const sc=G3.screenOf(u);if(!sc){log('noscreen',u.n);return;}
  if(sc.x<0||sc.x>innerWidth||sc.top<0||sc.y>innerHeight)log('offscreen',u.n+' '+Math.round(sc.x)+','+Math.round(sc.y));
  const x=sc.x,y=(sc.y+sc.top)/2;const el=document.elementFromPoint(x,y);if(el&&el.id!=='cv')log('covered',u.n+' par '+(el.id||el.className||el.tagName));
  const hit=G3.hitTest(x,y);if(hit!==u)log('hittest',u.n+' -> '+(hit&&hit.n));
  $('cv').dispatchEvent(new PointerEvent('pointerdown',{clientX:x,clientY:y,bubbles:true}));}}
function steer(wx,wy){const l=Math.hypot(wx,wy)||1;wx/=l;wy/=l;const yaw=G3.yaw,c=Math.cos(yaw),s=Math.sin(yaw);joy(wx*c-wy*s,wx*s+wy*c);}
function tick(){try{const now=performance.now(),P=VD.P;if(!P)return;
 // invariants
 if(!isFinite(P.x)||!isFinite(P.y))log('nanpos',P.x+','+P.y);
 P.heroes.forEach(h=>{if(h.hp>h.s.mhp+.01)log('hpmax',h.n+' '+h.hp+'/'+h.s.mhp);if(!isFinite(h.hp)||h.hp<0)log('hp',h.n+' '+h.hp);if(h.en<-.01||h.en>h.s.men+.01)log('en',h.n+' '+h.en+'/'+h.s.men);});
 if(P.gold<0||!isFinite(P.gold))log('gold',P.gold);
 if(!VD.B&&G3.mapRef&&G3.mapRef!==VD.map)log('mapdesync','F'+VD.F);
 if(!VD.B&&VD.solid(P.x,P.y))log('inwall','P '+P.x.toFixed(2)+','+P.y.toFixed(2));
 const D=G3._d&&G3._d();if(D&&!VD.B&&D.EX.party){D.EX.party.forEach((R,i)=>{const p=R.root.position;if(!R.root.parent)log('partyDetached','héros '+i);if(!isFinite(p.x))log('partyNaN','héros '+i);});}
 const sig=[$('story').style.display,$('panel').style.display,!!VD.B,VD.B?VD.B.log.length+'|'+(VD.B.cur&&VD.B.cur.n)+'|'+VD.B.wait+'|'+VD.B.over:'',P.x.toFixed(1),P.y.toFixed(1),VD.F,panelClicks].join('/');
 if(sig!==lastSig){lastSig=sig;sigT=now;}else if(now-sigT>30000){log('stuck',sig+' menu='+(__ui.menu)+' sel='+!!__ui.sel+' tw='+__ui.tw.length+' steps='+__ui.steps.length);sigT=now;}
 if(panelStep())return;
 if(VD.B){if(!VD.B.__c){VD.B.__c=1;S.battles++;if(VD.B.boss)S.bosses++;}if(!(lossPlanned&&!S.respawnTested)&&!VD.B.over)P.heroes.forEach(h=>{if(!h.dead&&h.hp<h.s.mhp*.55)h.hp=Math.round(h.s.mhp*.55);});battleStep();return;}
 if(VD.F!==F||VD.map!==window.__map2){if(VD.F===F&&window.__map2)S.regen=(S.regen||0)+1;window.__map2=VD.map;newFloor();}
 // soins entre les combats (le test vise les bugs)
 if(!(lossPlanned&&!S.respawnTested))P.heroes.forEach(h=>{if(h.dead||h.hp<h.s.mhp*.5){h.dead=false;h.hp=h.s.mhp;h.en=h.s.men;}});
 // test du respawn une fois : groupe mis à 1 PV avant un combat de l'étage 3
 if(!S.respawnTested&&VD.F===3&&!lossPlanned){lossPlanned=true;P.heroes.forEach(h=>{h.hp=1;});}
 if(lossPlanned&&!S.respawnTested&&S.loses>0)S.respawnTested=true;
 const cx=P.x|0,cy=P.y|0;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const x=cx+dx,y=cy+dy;if(walk(x,y)&&Math.hypot(P.x-x-.5,P.y-y-.5)<1.6)visited[y*VD.W+x]=1;}
 S.floors[F].visited=covered();S.floors[F].t=Math.round((now-floorT)/1000);
 if(now-lastRot>25000){lastRot=now;S.rot++;(S.rot%2?$('rotL'):$('rotR')).click();}
 if(VD.ctx==='shop'&&!merchDone){merchDone=true;S.floors[F].merch=true;S.shops++;$('ctx').click();return;}
 // cible
 if(phase==='explore'){if(!target||now-pickT>15000){const t=nextTarget();pickT=now;if(!t){phase=VD.bossAlive?'boss':'stairs';target=null;}else{target=t;}}}
 if(phase==='boss'){const e=VD.E.find(e=>e.boss);if(!e){phase='stairs';}else{const B=bfsAll(cx,cy);const p=pathTo(B,(e.y|0)*VD.W+(e.x|0));if(!p){log('bossUnreach','F'+VD.F);phase='stairs';}else target={c:(e.y|0)*VD.W+(e.x|0),p,boss:1};}}
 if(phase==='stairs'){if(!merchDone){const B=bfsAll(cx,cy);const m=VD.merch;const c=(m.y|0)*VD.W+(m.x|0);let best=null,bd=1e9;for(const[dx,dy]of[[0,1],[1,0],[-1,0],[0,-1],[1,1],[-1,1]]){const k=c+dy*VD.W+dx;if(B.dist[k]>=0&&B.dist[k]<bd){bd=B.dist[k];best=k;}}if(best!==null){target={c:best,p:pathTo(B,best)};}else{log('merchUnreach','F'+VD.F);merchDone=true;}}
  else{if(VD.ctx==='down'){if(VD.bossAlive){phase='boss';return;}$('ctx').click();return;}const B=bfsAll(cx,cy);const c=VD.stairs.y*VD.W+VD.stairs.x;target={c,p:pathTo(B,c),st:1};if(!target.p){log('stairsUnreach2','F'+VD.F);}}}
 if(!target||!target.p){joyUp();return;}
 // avance vers la case suivante du chemin
 const W=VD.W;let i=0;while(i<target.p.length-1&&target.p[i]!==cy*W+cx)i++;const nxt=target.p[Math.min(target.p.length-1,i+1)];const tx=nxt%W+.5,ty=((nxt/W)|0)+.5;
 if(target.p[target.p.length-1]===cy*W+cx&&Math.hypot(P.x-tx,P.y-ty)<.25){target=null;joyUp();return;}
 steer(tx-P.x,ty-P.y);
 if(Math.hypot(P.x-lastPos.x,P.y-lastPos.y)>.04){lastPos={x:P.x,y:P.y};moveT=now;}
 else if(now-moveT>5000){log('blocked',`bloqué en ${P.x.toFixed(2)},${P.y.toFixed(2)} vers la case ${tx-.5},${ty-.5}`);moveT=now;visited[nxt]=1;target=null;}
 }catch(e){log('agentErr',e.message+' '+(e.stack||'').slice(0,240));}}
const loop=()=>{tick();requestAnimationFrame(loop);};requestAnimationFrame(loop);})();
