/* ===== Valdragon 3D — interface ===== */
import {G3} from './g3d.js';
import {blason,THEMES} from './theme.js';
import {itemIcon} from './icons.js';
import {cloudLoad,cloudSave,cloudPut} from './cloud.js';
let TEST=false;const EXPE=true;// donjon 3D du Trône de Braise : piloté par la page du royaume (postMessage), jamais de sauvegarde ici
// mode test : partie séparée, jamais sauvegardée dans la vraie partie
import {glyph,glyphURL,uiIco} from './glyphs.js';
const IC=(it,sz=64,cl='ic')=>{try{return`<img class="${cl}" src="${itemIcon(it,sz)}" alt="">`;}catch(e){return'';}};
import {AU,initAudio,setRoom,pickVar,out,musicStart,musicMode,musicBattle,musicVol} from './audio.js';
const $=id=>document.getElementById(id);
const cv=$('cv'),cx=cv.getContext('2d'),mini=$('mini'),mx=mini.getContext('2d');
let VW,VH,paused=true,started=false,mode='explo';
function resize(){const d=Math.min(2,devicePixelRatio||1);VW=innerWidth;VH=innerHeight;cv.width=VW*d;cv.height=VH*d;cx.setTransform(d,0,0,d,0,0);}
addEventListener('resize',resize);resize();G3.init(document.body);
const RCOL=VR.RCOL,TAU=Math.PI*2;
function toast(t,c){const e=document.createElement('div');e.innerHTML=c?`<span style="color:${c}">${t}</span>`:t;$('toast').appendChild(e);setTimeout(()=>e.remove(),3400);while($('toast').children.length>4)$('toast').firstChild.remove();}
function banner(h,p){$('bh').textContent=h;$('bp').textContent=p||'';const b=$('banner');b.classList.remove('on');void b.offsetWidth;b.classList.add('on');}

/* ---------- son ---------- */
let AC=null,muted=false;try{muted=localStorage.getItem('vd_mute')==='1';}catch(e){}$('mute').innerHTML=uiIco(muted?'muet':'son',22);{const b=$('bBag');if(b.firstChild&&b.firstChild.nodeType===3)b.firstChild.remove();b.insertAdjacentHTML('afterbegin',uiIco('bag',24));}
const QN=['Économie','Normale','Haute','Maximale'],QI=['▫️','✦','✨','💎'];let qMax=3,qAuto=true,hiQ=true;try{const s=localStorage.getItem('vd_q2');if(s!==null){qMax=+s;qAuto=false;}}catch(e){}
const mobile=(matchMedia&&matchMedia('(pointer:coarse)').matches)||Math.min(innerWidth,innerHeight)<600;let qCur=Math.min(qMax,mobile?1:2);function qSet(l){qCur=l;G3.setLevel(l);$('fxq').innerHTML=uiIco('q'+l,22);hiQ=l>=1;}qSet(qCur);
$('fxq').onclick=()=>{const n=(qCur+3)%4;qMax=n;qAuto=false;try{localStorage.setItem('vd_q2',String(n))}catch(e){}qSet(n);toast('Qualité '+QN[n]+(n===0?' : la plus fluide.':n===3?' : tous les effets, pour les téléphones puissants.':'.'));};
const perf={t:0,n:0,bad:0,good:0,told:false};function perfTick(dt){if(window.__noAutoQ)return;perf.t+=dt;perf.n++;if(perf.t>2){const fps=perf.n/perf.t;perf.t=0;perf.n=0;
 perf.bad=fps<42?perf.bad+1:0;perf.good=fps>58?perf.good+1:0;
 if(perf.bad>=2&&qCur>0){qSet(qCur-1);perf.bad=0;perf.drops=(perf.drops||0)+1;if(!perf.told){perf.told=true;toast('Qualité ajustée automatiquement pour rester fluide.');}}
 else if(qAuto&&perf.good>=6&&qCur<qMax&&(perf.drops||0)<2){qSet(qCur+1);perf.good=0;}}}
$('mute').onclick=()=>{muted=!muted;$('mute').innerHTML=uiIco(muted?'muet':'son',22);try{localStorage.setItem('vd_mute',muted?'1':'0')}catch(e){}musVol();};
/* ---------- musique d'ambiance ---------- */
const MUSB={},MUSP={};let musM=null,musLay=[],musKey=null,musBattle=false;
function musBuf(k){if(MUSB[k])return Promise.resolve(MUSB[k]);if(MUSP[k])return MUSP[k];const el=document.getElementById('vdmu-'+k);if(!el||!AC)return Promise.resolve(null);
 const bin=atob(el.textContent.trim()),u8=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);
 return MUSP[k]=AC.decodeAudioData(u8.buffer).then(b=>MUSB[k]=b).catch(()=>null);}
function musVol(){if(!musM||!AC)return;musM.gain.cancelScheduledValues(AC.currentTime);musM.gain.setTargetAtTime(muted?0:(musBattle?.12:.22),AC.currentTime,.6);musicVol(muted?0:(musBattle?.55:.42));}
function musicFor(tier){const key='m'+tier;if(!AC||key===musKey)return;musKey=key;setRoom(tier);musicStart(['crypt','cavern','forge','frost'][tier]);musicMode(['crypt','cavern','forge','frost'][tier]);if(!musM){musM=AC.createGain();musM.gain.value=0;musM.connect(AU.mus?AU.bus:AC.destination);}
 const old=musLay;musLay=[];old.forEach(l=>{l.g.gain.setTargetAtTime(0,AC.currentTime,.8);setTimeout(()=>{try{l.s.stop();}catch(e){}},4000);});
 const parts=[[['crypt'],1,1],[['cavern'],1,1],[['cavern'],.8,1],[['frost','wind'],1,1]][tier];
 parts[0].forEach((k,i)=>musBuf(k).then(b=>{if(!b||musKey!==key)return;const s=AC.createBufferSource();s.buffer=b;s.loop=true;s.playbackRate.value=parts[1];const g=AC.createGain();g.gain.value=0;
  let node=s;if(tier===2){const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=900;s.connect(f);node=f;}node.connect(g);g.connect(musM);s.start(0,Math.random()*b.duration*.5);g.gain.setTargetAtTime(k==='wind'?.7:1,AC.currentTime,1.2);musLay.push({s,g});}));
 musVol();}
function musSetBattle(b){musBattle=b;musicBattle(b);musVol();}
function ac(){if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)();}catch(e){}if(AC){initAudio(AC);setTimeout(loadS,0);}}if(AC&&AC.state==='suspended')AC.resume();return AC;}
let noiseB=null;function noise(){if(!noiseB){const a=ac();noiseB=a.createBuffer(1,a.sampleRate*.5,a.sampleRate);const d=noiseB.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}return noiseB;}
const lastS={};
const SMAP={swing:['knifeSlice','knifeSlice2','drawKnife1','drawKnife2'],hit:['chop'],crit:['chop','metalPot1'],hurt:['chop'],shield:['metalPot2','metalLatch'],coin:['handleCoins','handleCoins2'],pick:['beltHandle1','beltHandle2','handleSmallLeather'],break:['creak1','doorClose_1'],chest:['doorOpen_1'],step:['footstep00','footstep01','footstep02','footstep03','footstep04'],open:['bookOpen'],close:['bookClose'],page:['bookFlip1'],equip:['cloth1','cloth2','dropLeather'],click:['metalClick']};
const SVOL={step:.35,swing:.8,hit:.9,crit:1,hurt:.8,coin:.7,pick:.7,open:.6,close:.6,page:.5,equip:.7,click:.5,shield:.7,break:.9,chest:.8};
const SB={};let sbLoad=false;
function loadS(){if(sbLoad||!AC)return;sbLoad=true;for(const el of document.querySelectorAll('script[id^="vds-"]')){const n=el.id.slice(4);try{const bin=atob(el.textContent.trim()),u8=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);AC.decodeAudioData(u8.buffer).then(b=>{SB[n]=b;}).catch(()=>{});}catch(e){}}}
function smp(k,v){const L=SMAP[k];if(!L||!AC)return false;const n=pickVar(L,k),b=SB[n];if(!b)return false;const s=AC.createBufferSource();s.buffer=b;const pr=k==='step'?.08:.15;s.playbackRate.value=1-pr+Math.random()*pr*2;s.detune&&(s.detune.value=(Math.random()-.5)*60);
 const vv=v*(SVOL[k]||.7)*(.78+Math.random()*.4);const g=out(vv,(Math.random()-.5)*(k==='step'?.5:.35));
 if(k!=='step'&&k!=='click'){const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=3500+Math.random()*6000;s.connect(f);f.connect(g);}else s.connect(g);s.start(AC.currentTime+Math.random()*.018);return true;}
function sfx(k,v=1){if(muted)return;const a=ac();if(!a)return;const now=a.currentTime;if(lastS[k]&&now-lastS[k]<.04)return;lastS[k]=now;if(smp(k,v)){if(!['hit','crit','hurt'].includes(k))return;v*=.45;}
 const g=a.createGain();g.connect(AU.sfx||a.destination);const env=(t,vol)=>{g.gain.setValueAtTime(vol*v*.5,now);g.gain.exponentialRampToValueAtTime(.001,now+t);};
 const osc=(type,f1,f2,t)=>{const o=a.createOscillator();o.type=type;o.frequency.setValueAtTime(f1,now);o.frequency.exponentialRampToValueAtTime(f2,now+t);o.connect(g);o.start(now);o.stop(now+t);};
 const nz=(t,fq,q=1,type='bandpass')=>{const s=a.createBufferSource();s.buffer=noise();const f=a.createBiquadFilter();f.type=type;f.frequency.value=fq;f.Q.value=q;s.connect(f);f.connect(g);s.start(now);s.stop(now+t);};
 switch(k){case'swing':env(.12,.25);nz(.12,1800,.8);break;case'hit':env(.12,.5);nz(.1,900,1.5);osc('square',180,60,.08);break;case'crit':env(.2,.6);nz(.18,600,1);osc('sawtooth',300,80,.15);break;
  case'hurt':env(.2,.5);osc('sawtooth',160,70,.18);break;case'fire':env(.4,.4);nz(.4,700,.6,'lowpass');osc('sine',300,90,.35);break;case'ice':env(.35,.35);osc('triangle',1600,600,.3);nz(.2,4000,2,'highpass');break;
  case'arrow':env(.15,.3);nz(.12,3000,2,'highpass');break;case'heal':env(.6,.3);osc('sine',500,900,.5);osc('triangle',750,1300,.5);break;case'shield':env(.5,.3);osc('sine',220,440,.45);break;
  case'coin':env(.18,.25);osc('square',1300,1800,.06);break;case'pick':env(.3,.3);osc('triangle',600,1200,.2);break;case'leg':env(1.2,.4);osc('triangle',440,880,.6);osc('sine',660,1320,.9);break;
  case'lvl':env(1.4,.45);[523,659,784,1046].forEach((f,i)=>setTimeout(()=>{const o=a.createOscillator(),gg=a.createGain();o.frequency.value=f;o.type='triangle';gg.gain.setValueAtTime(.12*v,a.currentTime);gg.gain.exponentialRampToValueAtTime(.001,a.currentTime+.5);o.connect(gg);gg.connect(AU.sfx||a.destination);o.start();o.stop(a.currentTime+.5);},i*110));break;
  case'pot':env(.35,.3);osc('sine',300,700,.3);break;case'break':env(.25,.45);nz(.22,500,.7);break;case'die':env(.5,.4);osc('sawtooth',200,50,.45);break;
  case'roar':env(1.4,.6);nz(1.3,220,.4,'lowpass');osc('sawtooth',110,45,1.2);break;case'battle':env(.6,.5);osc('sawtooth',90,180,.3);nz(.5,300,.5,'lowpass');break;case'win':env(1.2,.4);[392,523,659,784].forEach((f,i)=>setTimeout(()=>sfx('note'+f),i*120));break;
  case'shrine':env(1.2,.35);osc('sine',880,440,1);osc('triangle',1320,660,1);break;default:if(k.startsWith('note')){env(.4,.3);osc('triangle',+k.slice(4),+k.slice(4),.35);}}}

/* ---------- entrées (exploration) ---------- */
const keys={};let joyV={x:0,y:0},joyId=null,joyO={x:0,y:0};
addEventListener('keydown',e=>{const k=e.key.toLowerCase();keys[k]=1;if(paused)return;if(mode==='explo'){if(k==='i'||k==='b'||k==='tab'){e.preventDefault();openPanel('equip');}if(k==='e'||k==='enter')ctxAct();}
 else if(mode==='battle'&&ui.menu){const n=parseInt(k);if(n>=1&&n<=9){const b=$('bgrid')&&$('bgrid').children[n-1];if(b&&!b.disabled)b.click();}if(k==='escape')cancelTarget();}});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=0);
const jz=$('joyz'),jy=$('joy');
jz.addEventListener('pointerdown',e=>{ac();joyId=e.pointerId;joyO={x:e.clientX,y:e.clientY};jy.style.display='block';jy.style.left=(e.clientX-60)+'px';jy.style.top=(e.clientY-60)+'px';try{jz.setPointerCapture(e.pointerId);}catch(_){}});
jz.addEventListener('pointermove',e=>{if(e.pointerId!==joyId)return;let dx=e.clientX-joyO.x,dy=e.clientY-joyO.y;const l=Math.hypot(dx,dy),m=48;if(l>m){dx*=m/l;dy*=m/l;}joyV={x:dx/m,y:dy/m};jy.firstChild.style.transform=`translate(${dx}px,${dy}px)`;});
const jend=e=>{if(e.pointerId!==joyId)return;joyId=null;joyV={x:0,y:0};jy.style.display='none';jy.firstChild.style.transform='';};
jz.addEventListener('pointerup',jend);jz.addEventListener('pointercancel',jend);
$('bBag').onclick=()=>{ac();if(!paused)openPanel('equip');};
function ctxAct(){if(paused)return;if(VD.ctx==='down'){if(VD.bossAlive){toast('Le gardien de l’antre barre le passage.');return;}if(VD.expe&&VD.F>=VD.expe.dernier){finExpe('victoire');return;}VD.descend();save();}else if(VD.ctx==='shop')openPanel('shop');}
$('ctx').onclick=ctxAct;
function input(){const kx=((keys.d||keys.arrowright)?1:0)-((keys.a||keys.q||keys.arrowleft)?1:0),ky=((keys.s||keys.arrowdown)?1:0)-((keys.w||keys.z||keys.arrowup)?1:0);return G3.rotIn(joyV.x+kx,joyV.y+ky);}


/* ---------- exploration 3D ---------- */
const FT=[];function wtext(x,y,t,c){FT.push({x,y,t,c,life:1.3});}
let fogDirty=true;
function exploEvents(){for(const e of VD.ev){switch(e.t){
 case'floor':{G3.buildFloor(VD);musicFor(VD.tier());G3.mode='explo';fogDirty=true;if(VD.expe){if(!VD.expe.combat)banner(VD.expe.nom||(THEMES[VD.expe.type]||THEMES.crypte).nom,e.boss?'Dernier étage · '+(VD.expe.gardien?VD.expe.gardien.n:'le gardien')+' vous attend':'Premier étage');}else banner('Étage '+e.f,e.biome+(e.boss?' · Antre du dragon':''));if(e.boss)setTimeout(()=>sfx('roar',.6),1200);
  const sk={1:'biome0',5:'biome1',9:'biome2',13:'biome3'}[e.f];VD.P.story=VD.P.story||[];if(sk&&!VD.P.story.includes(sk)){paused=true;setTimeout(()=>ST.play(sk,()=>{paused=false;},VD.P.story),1300);}break;}
 case'respawn':if(!ui.respTold||performance.now()-ui.respTold>60000){ui.respTold=performance.now();toast('Des pas résonnent au loin… de nouvelles créatures rôdent dans l\'étage.','#c9b48a');}break;
 case'aggro':if(e.e.boss){sfx('roar',.7);toast(e.e.n+' vous a vus !','#ff6a4a');}else toast(e.e.n+(e.e.cnt>1?' et ses alliés':'')+' vous chargent !','#ff9a7a');break;
 case'break':G3.exploBurst(e.x,e.y,e.k==='tonneau'?0x8a5a2a:0xb07a4a,18);sfx('break');break;
 case'gold':wtext(e.x,e.y,'+'+e.v+' or','#ffd84a');sfx('coin');break;
 case'potpick':wtext(e.x,e.y,'+1 potion','#ff8a7a');sfx('pick',.6);break;
 case'chest':G3.exploBurst(e.x,e.y,0xffd84a,50);sfx('chest');sfx('coin');sfx('pick');toast(`Coffre : ${e.v} or · `+e.its.map(it=>`<span class="r${it.rar}">${IC(it,40,'icl')}${it.n}</span>`).join(' · '));$('dot').style.display='block';if(e.its.some(i=>i.rar===3))sfx('leg');break;
 case'shrine':{const c={fureur:'#ff4a3a',bastion:'#e8e0d0',vie:'#7fff9a',arcane:'#b47aff'}[e.k];toast(e.m,c);G3.exploBurst(e.x,e.y,parseInt(c.slice(1),16),70);sfx('shrine');break;}
 case'toast':toast(e.m);break;
 case'battle':enterBattle(e.boss);return;}}
 VD.ev.length=0;}
$('rotL').onclick=()=>G3.setYaw(G3.yaw-Math.PI/4);$('rotR').onclick=()=>G3.setYaw(G3.yaw+Math.PI/4);
function drawMini(m,sz){const W=VD.W,H=VD.H,R=13,s=sz/(R*2),P=VD.P,t=performance.now()/1000;m.clearRect(0,0,sz,sz);
 m.save();m.beginPath();m.arc(sz/2,sz/2,sz/2,0,TAU);m.clip();const bg=m.createRadialGradient(sz/2,sz/2,0,sz/2,sz/2,sz/2);bg.addColorStop(0,'#2a1e12');bg.addColorStop(1,'#0c0805');m.fillStyle=bg;m.fillRect(0,0,sz,sz);
 m.translate(sz/2,sz/2);m.rotate(G3.yaw);m.translate(-P.x*s,-P.y*s);
 const x0=Math.max(0,(P.x-R-2)|0),x1=Math.min(W-1,(P.x+R+2)|0),y0=Math.max(0,(P.y-R-2)|0),y1=Math.min(H-1,(P.y+R+2)|0);
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const k=y*W+x;if(!VD.seen[k])continue;const v=VD.map[k];if(v===0)continue;const lit=VD.vis[k];
  m.fillStyle=v===3||v===4?'#6a5640':lit?'#c9b48a':'#7d6a4c';m.fillRect(x*s,y*s,s+.6,s+.6);}
 m.strokeStyle='#2a1a0c';m.lineWidth=Math.max(1.5,s*.28);m.beginPath();
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const k=y*W+x;if(!VD.seen[k]||VD.map[k]===0)continue;
  if(VD.at(x,y-1)===0){m.moveTo(x*s,y*s);m.lineTo((x+1)*s,y*s);}if(VD.at(x,y+1)===0){m.moveTo(x*s,(y+1)*s);m.lineTo((x+1)*s,(y+1)*s);}
  if(VD.at(x-1,y)===0){m.moveTo(x*s,y*s);m.lineTo(x*s,(y+1)*s);}if(VD.at(x+1,y)===0){m.moveTo((x+1)*s,y*s);m.lineTo((x+1)*s,(y+1)*s);}}
 m.stroke();
 const icon=(x,y,txt,col,size)=>{m.save();m.translate(x*s,y*s);m.rotate(-G3.yaw);m.font=`900 ${size}px sans-serif`;m.textAlign='center';m.textBaseline='middle';m.lineWidth=3;m.strokeStyle='rgba(0,0,0,.85)';m.strokeText(txt,0,0);m.fillStyle=col;m.fillText(txt,0,0);m.restore();};
 const sn=(x,y)=>VD.seen[(y|0)*W+(x|0)];
 if(sn(VD.stairs.x,VD.stairs.y))icon(VD.stairs.x+.5,VD.stairs.y+.5,'▼',VD.bossAlive?'#ff5a3a':'#ffd060',s*1.6);
 if(sn(VD.merch.x,VD.merch.y))icon(VD.merch.x,VD.merch.y,'●','#ffd84a',s*1.1);
 VD.obj.forEach(o=>{if(!sn(o.x,o.y))return;if(o.t==='shrine'&&!o.used)icon(o.x,o.y,'◆','#c48aff',s*1.3);else if(o.t==='chest')icon(o.x,o.y,'■',o.gold?'#ffd84a':'#c08a50',s*1.1);});
 VD.E.forEach(e=>{if(VD.vis[(e.y|0)*W+(e.x|0)]||e.boss&&sn(e.x,e.y)){const pu=.75+.25*Math.sin(t*6);m.fillStyle=e.boss?'#ff3020':'#e04030';m.beginPath();m.arc(e.x*s,e.y*s,(e.boss?s*1.1:s*.6)*pu+1,0,TAU);m.fill();}});
 m.restore();
 m.save();m.translate(sz/2,sz/2);m.fillStyle='rgba(255,220,140,.25)';m.beginPath();m.moveTo(0,0);m.arc(0,0,sz*.32,-Math.PI/2-.5,-Math.PI/2+.5);m.fill();
 m.fillStyle='#fff';m.strokeStyle='#000';m.lineWidth=2;m.beginPath();m.moveTo(0,-s*1.2);m.lineTo(s*.8,s*.8);m.lineTo(0,s*.4);m.lineTo(-s*.8,s*.8);m.closePath();m.stroke();m.fill();m.restore();
 const vg=m.createRadialGradient(sz/2,sz/2,sz*.35,sz/2,sz/2,sz/2);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.75)');m.fillStyle=vg;m.beginPath();m.arc(sz/2,sz/2,sz/2,0,TAU);m.fill();}
function drawExploOverlay(dt){cx.clearRect(0,0,VW,VH);cx.textAlign='center';
 const lab=(x,y,h,t,c,f='600 13px Cinzel,serif')=>{const p=G3.exploScreen(x,y,h);if(p.z>1)return;cx.font=f;cx.fillStyle='rgba(0,0,0,.8)';cx.fillText(t,p.x+1,p.y+1);cx.fillStyle=c;cx.fillText(t,p.x,p.y);};
 if(VD.vis[(VD.merch.y|0)*VD.W+(VD.merch.x|0)])lab(VD.merch.x,VD.merch.y,1.6,'Borin','#f0c46a');
 VD.E.forEach(e=>{if(!VD.vis[(e.y|0)*VD.W+(e.x|0)])return;if(e.boss)lab(e.x,e.y,4.2,e.n.split(',')[0],'#ff9a7a','700 15px Cinzel,serif');else{if(e.elite)lab(e.x,e.y,1.75,e.n,'#9fb4ff');if(e.cnt>1)lab(e.x,e.y,e.elite?2.05:1.75,'×'+e.cnt,'#f0c46a',"800 14px 'Alegreya Sans',sans-serif");}});
 for(let i=FT.length-1;i>=0;i--){const f=FT[i];f.life-=dt;if(f.life<=0){FT.splice(i,1);continue;}const p=G3.exploScreen(f.x,f.y,1.2+(1.3-f.life)*.8);cx.globalAlpha=Math.min(1,f.life*2);cx.font="800 16px 'Alegreya Sans',sans-serif";cx.lineWidth=3;cx.strokeStyle='#000';cx.strokeText(f.t,p.x,p.y);cx.fillStyle=f.c;cx.fillText(f.t,p.x,p.y);cx.globalAlpha=1;}}

/* ---------- HUD exploration ---------- */
let hudT=0;
const PDU={};function pdu(c){if(PDU[c]!==undefined)return PDU[c];const cv2=G3.portrait&&G3.portrait(c);PDU[c]=cv2?cv2.toDataURL():null;return PDU[c];}
function hud(){const P=VD.P;if(VD.expe){const T=THEMES[VD.expe.type]||THEMES.crypte;$('flr').textContent=VD.expe.nom||T.nom;$('bio').textContent='Étage '+(VD.F-VD.expe.F0+1)+' sur '+VD.expe.etages+(VD.lair()?' · '+(VD.bossAlive?(VD.expe.gardien?VD.expe.gardien.n:'le gardien')+' veille':'le gardien est tombé'):'');}else{$('flr').textContent='Étage '+VD.F;$('bio').textContent=VD.BIOMES[VD.tier()].n+(VD.lair()?' · antre':'');}
 $('lv').innerHTML=`${P.gold} or · ${uiIco('potion',14)}${P.pot.soin} ${uiIco('elixir',14)}${P.pot.elixir} ${uiIco('phenix',14)}${P.pot.phenix}`;$('xpw').style.display='none';
 $('bless').textContent=P.bless?'✦ '+VD.SHRINES[P.bless][1]:'';
 $('party').innerHTML=P.heroes.map(h=>`<div class="pc">${pdu(h.cls)?`<img class="pp" src="${pdu(h.cls)}">`:''}<b>${h.n}</b> <span class="small">niv. ${h.lvl}${h.spts?' <span style="color:#ffd84a">✦'+h.spts+'</span>':''}</span><div class="bar hpb"><i style="width:${100*h.hp/h.s.mhp}%"></i></div><div class="bar enb"><i style="width:${100*h.en/h.s.men}%"></i></div><div class="bar xpb"><i style="width:${100*h.xp/VD.xpNextH(h)}%"></i></div></div>`).join('');
 const c=$('ctx');if(VD.ctx==='down'){c.style.display='block';c.textContent=VD.bossAlive?'🔒 Escalier gardé':`⬇ Descendre à l'étage ${VD.F+1}`;}else if(VD.ctx==='shop'){c.style.display='block';c.textContent='💰 Parler à Borin';}else c.style.display='none';
 if(P.spts)$('dot').style.display='block';}

/* =================== COMBAT =================== */
const ui={menu:false,sel:null,vis:new Map(),tw:[],steps:[],stepT:0,P:[],TX:[],PR:[],cap:null,foeDelay:0,end:null,shake:0,bgK:null};
const SKI={frappe:'⚔️',provoc:'😠',fendoir:'🌀',rempart:'🛡️',execution:'💀',trait:'✨',feu:'🔥',soin:'💚',givre:'❄️',barriere:'🔵',meteore:'☄️',tir:'🏹',poison:'🧪',volee:'🌧️',marque:'🎯',fatal:'💥'};
const EL={fire:'#ff8a2a',ice:'#9fe0ff',poison:'#9cff5a',arcane:'#d77aff',phys:'#fff3dc'};
const SI={burn:'🔥',poison:'☠',gel:'❄',stun:'💫',mark:'🎯',shield:'🛡',weak:'⬇',slow:'🐌',taunt:'😠',defup:'⛨'};
const SN={burn:'Brûlure',poison:'Empoisonné',gel:'Gelé',stun:'Étourdi',mark:'Marqué',shield:'Bouclier',weak:'Affaibli',slow:'Ralenti',taunt:'Provocation',rampart:'Rempart',defup:'Défense +'};
const RANGED={rodeuse:1,mage:1,ar:1,py:1,ch:1,boss:1,wy:0};
const EL3={fire:0xff8a2a,ice:0x9fe0ff,poison:0x9cff5a,arcane:0xd77aff,phys:0xfff3dc};

const vis=u=>{let v=ui.vis.get(u);if(!v){v={};ui.vis.set(u,v);}return v;};
function enterBattle(boss){mode='battle';musSetBattle(true);$('toast').innerHTML='';ui.vis=new Map();ui.tw=[];ui.steps=[];ui.TX=[];ui.cap=null;ui.end=null;ui.menu=false;ui.sel=null;ui.foeDelay=.9;ui.intro=boss?3.4:1.3;ui.wipe=boss?.5:.9;
 G3.buildArena(VD,VD.B);G3.mode='battle';
 $('explo').classList.add('hide');$('bui').style.display='block';$('blog').innerHTML='';$('bact').innerHTML='<div id="bwait">Le combat commence…</div>';
 if(boss){ui.story=true;const tier=VD.tier();setTimeout(()=>ST.play(VD.F<=16?'pre'+tier:'echo',()=>{ui.story=false;},VD.P.story=VD.P.story||[]),900);}
 sfx(boss?'roar':'battle');banner(boss?VD.B.foes[0].n.split(',')[0]:'Combat !',boss?(VD.expe&&VD.expe.gardien?({liche:'Le froid du tombeau envahit la salle',ogre:'Le sol tremble sous ses pas',reine:'Les toiles frémissent de toutes parts',wyverne:'La cendre se soulève en tourbillons'}[VD.expe.gardien.cle]||'Le gardien des lieux se dresse'):'Le dragon déploie ses ailes'):VD.expe&&VD.expe.combat?'Les hommes de '+((VD.expe.adverse&&VD.expe.adverse.nom)||'l’ennemi')+' vous barrent la route':VD.B.foes.length+' ennemi'+(VD.B.foes.length>1?'s':''));VD.ev.length=0;}
function layout(){const pos=new Map(),bh=$('bui').offsetHeight||VH*.32;G3.setUiBottom(bh);for(const u of [...VD.B.foes,...VD.P.heroes]){const s=G3.screenOf(u);if(s)pos.set(u,{x:s.x,y:s.y,top:Math.max(s.top,u.boss?104:0),s:Math.max(30,s.s)});}ui.pos=pos;ui.S=Math.min(VW/5.4,90);ui.H=VH-bh;return pos;}

/* tweens & pas d'animation */
function tw(d,fn,done){ui.tw.push({t:0,d,fn,done});}
const SOFT={'#ff6a5a':'#e3836e','#7fff8a':'#9fd8a4','#ffd84a':'#e9c877','#9fd0ff':'#a9cbe6','#8ab4ff':'#9db6e0','#c9d8ff':'#c4cfe4','#fff':'#efe6d6'};
function addTxt(x,y,t,c,big){c=SOFT[c]||c;ui.TX.push({x,y,t,c,big,life:big?1.35:1.1,vx:(Math.random()-.5)*40,vy:-90-Math.random()*30});}
function burst(x,y,c,n=14,sp=160,o={}){for(let i=0;i<n;i++){const a=Math.random()*TAU,s=sp*(.3+Math.random()*.7);if(ui.P.length<500)ui.P.push(Object.assign({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.4+Math.random()*.4,max:.8,c,size:2+Math.random()*3.5,add:1,g:0},o));}}
function P(u){return ui.pos&&ui.pos.get(u)||{x:VW/2,y:VH/3,s:60};}
function stepGroup(g){const act=g[0],u=act.u,B=VD.B;const hits=g.filter(e=>e.t!=='act');const tg=act.tgt||(hits.find(e=>e.t==='hit'||e.t==='heal'||e.t==='status')||{}).u;
 const isItem=/Potion|Élixir|Plume/.test(act.n||'');let anim='atk',ranged=false;const a=act.a;
 if(u.side==='h'){anim={guerrier:'atk',mage:'cast',rodeuse:'bow'}[u.cls];ranged=u.cls!=='guerrier';if(['provoc','rempart'].includes(act.k)){anim=null;ranged=true;}}
 else{if(['ar','ab','py','ch'].includes(u.k)){anim=(u.k==='ar'||u.k==='ab')?'bow':'cast';ranged=true;}else if(u.boss){anim=a==='dbreath'?'breath':'atk';ranged=['dbreath','tail','summon','chargeA'].includes(a);}else if(u.k==='go'||(u.k==='cb'&&a==='smash'))anim='slam';else if(u.k==='sp')anim='bite';else if(u.k==='wy'&&a==='breath'){ranged=true;}
  if(['bone','chargeA','heal','summon','curse'].includes(a)){anim=(u.k==='py'||u.k==='ch')?'cast':null;ranged=true;}}
 if(u.side==='h'){const nt=new Set(hits.filter(e=>e.t==='hit').map(e=>e.u)).size;
  if(u.cls==='guerrier'&&anim==='atk'&&nt>1)anim='spin';
  if(u.cls==='mage'&&anim==='cast'){if(act.k==='meteore')anim='summon';else if(!nt)anim='raise';else if(nt===1)anim='shoot';}
  if(['provoc','rempart'].includes(act.k))anim='block';}
 if(act.n==='Défense')anim='block';if(isItem)anim='item';if(act.n==='Fuite')anim=null;
 const targets=[...new Set(hits.filter(e=>e.t==='hit').map(e=>e.u))];const melee=!ranged&&tg&&targets.length;
 const imp=targets.length?(melee?.2:(anim==='bow'?.44:.38)):.22;
 if(anim)G3.act(u,anim,melee?tg:null,melee?.42:anim==='breath'?1.1:.62);
 caption(u,act.n);if(act.n==='Défense'){sfx('shield',.6);G3.FX.ring(u,0x9fc8ff,.3,1.2,.5);}if(isItem)G3.FX.pillar(tg||u,0xffe0a0,.6);
 if(ranged&&targets.length&&!['dbreath','tail','blast','breath'].includes(a)&&act.k!=='meteore'){const arrow=u.cls==='rodeuse'||u.k==='ar'||u.k==='ab';
  const col=u.side==='h'?(act.k==='feu'?EL3.fire:act.k==='givre'?EL3.ice:act.k==='poison'?EL3.poison:EL3.arcane):u.k==='py'?EL3.fire:u.k==='ch'?EL3.poison:u.boss?EL3[u.el]:EL3.phys;
  tw(Math.max(0,imp-.26),()=>{},()=>targets.forEach((t2,i)=>G3.FX.projectile(u,t2,col,.26+i*.04,arrow?'arrow':'orb')));sfx(arrow?'arrow':act.k==='givre'?'ice':'fire',.7);}
 if(melee)sfx('swing',.6);
 let k=0;hits.forEach(e=>{const at=imp+(e.t==='hit'?k++*.07:0);tw(at,()=>{},()=>applyFx(e));});
 fxFor(act,u,hits,imp);ui.steps.push({d:Math.max(.62,imp+k*.07+.42)});}
function fxFor(act,u,hits,imp){const k=act.k,a=act.a,ts=[...new Set(hits.filter(e=>['hit','heal','status'].includes(e.t)).map(e=>e.u))],at=(d,f)=>tw(d,()=>{},f);
 switch(k){
  case'frappe':case'execution':ts.forEach(t=>at(imp,()=>{G3.FX.slash(t,k==='execution'?0xffb0a0:0xfff0d0,k==='execution'?1.4:1);if(k==='execution'){G3.zoom(t,1.15,.6);G3.FX.explode(t,0xff4a3a,.7);}}));break;
  case'fendoir':G3.focus(u,1.1,1);at(imp,()=>ts.forEach(t=>G3.FX.slash(t,0xfff0d0,1.25)));break;
  case'provoc':G3.FX.ring(u,0xff5a3a,.4,2.8,.7);G3.FX.hitSpark(u,0xff5a3a,false);break;
  case'rempart':G3.FX.dome(1.3);break;
  case'feu':ts.forEach(t=>at(imp,()=>G3.FX.explode(t,0xff8a2a,1)));at(imp,()=>G3.shake(.18));break;
  case'trait':ts.forEach(t=>at(imp,()=>G3.FX.explode(t,0xc48aff,.5)));break;
  case'givre':ts.forEach(t=>at(imp,()=>G3.FX.shards(t)));break;
  case'barriere':ts.forEach(t=>G3.FX.bubble(t,0x7fc0ff,1.1));break;
  case'meteore':G3.focus(null,1.8,-1);ts.forEach((t,i)=>at(i*.12,()=>G3.FX.meteor(t)));break;
  case'poison':ts.forEach(t=>at(imp,()=>G3.FX.explode(t,0x8cff5a,.45)));break;
  case'fatal':slowmo(.35,.7);ts.forEach(t=>at(imp,()=>{G3.zoom(t,1.22,.8);G3.FX.explode(t,0xffffff,.8);G3.FX.slash(t,0xffffff,1.4);}));break;
  case'marque':ts.forEach(t=>G3.FX.reticle(t));break;}
 if(u.side==='e'){
  if(a==='dbreath'){G3.focus(u,1.6,1);G3.FX.breath(u,EL3[u.el],1);G3.shake(.45);}
  else if(a==='breath')G3.FX.breath(u,EL3.fire,.5);
  else if(a==='blast')at(imp,()=>{VD.P.heroes.forEach(h=>{if(!h.dead)G3.FX.explode(h,0xff8a2a,.7);});G3.shake(.3);});
  else if(a==='tail')at(imp,()=>{G3.FX.groundRing(0,2.8,0xffe0b0,.5,4.5,.55);G3.shake(.45);});
  else if(a==='smash')at(imp,()=>{ts.forEach(t=>G3.FX.ring(t,0xd8c8a8,.3,2.2,.5));G3.shake(.5);});
  else if(['atk','sneak','bite','curse','web'].includes(a))ts.forEach(t=>at(imp,()=>{if(['ar','py','ch'].includes(u.k))G3.FX.explode(t,u.k==='py'?0xff8a2a:u.k==='ch'?0x8cff5a:0xfff3dc,.4);else G3.FX.slash(t,0xffb0a0,u.boss?1.7:.9);}));
  else if(a==='chargeA')G3.FX.ring(u,0xff6a2a,2.2,.3,.7);
  else if(a==='bone')G3.FX.bubble(u,0xe8dcc4,.9);
  else if(a==='heal')ts.forEach(t=>G3.FX.pillar(t,0x8cff5a,.8));}}
function applyFx(e){const p=P(e.u);switch(e.t){
 case'hit':G3.hit(e.u,e.src,e.crit);G3.FX.hitSpark(e.u,EL3[e.el]||0xfff0d0,e.crit);addTxt(p.x,p.top-10,''+e.v,e.crit?'#ffd84a':e.u.side==='h'?'#ff6a5a':'#fff',e.crit);
  if(e.crit){G3.zoom(e.u,1.12,.45);G3.shake(.25);G3.flash(.16);}else G3.shake(.07);sfx(e.crit?'crit':e.u.side==='h'?'hurt':'hit',.8);break;
 case'heal':G3.FX.pillar(e.u,0xa8ff9a,.8);addTxt(p.x,p.top-10,'+'+e.v,'#7fff8a');sfx('heal',.7);break;
 case'status':addTxt(p.x,p.top-30,(SI[e.s]||'✦')+' '+(SN[e.s]||e.s),'#c9d8ff');if(e.s==='gel')G3.FX.shards(e.u);if(e.s==='shield')G3.FX.bubble(e.u,0x7fc0ff,1);if(e.s==='shield'||e.s==='rampart')sfx('shield');break;
 case'absorb':addTxt(p.x+24,p.top,'🛡'+e.v,'#9fd0ff');break;
 case'die':G3.die(e.u);G3.FX.soul(e.u,e.u.side==='h'?0xff9a8a:0xc8d8ff);sfx('die');if(e.u.side==='e'&&!VD.B.foes.some(f=>!f.dead)){slowmo(.3,.9);G3.zoom(e.u,e.u.boss?1.25:1.15,1.1);if(e.u.boss)G3.shake(.7);}break;
 case'summon':G3.unitOf(e.u);G3.FX.portal(e.u,0xff8a2a);break;
 case'energy':addTxt(p.x,p.top-10,'+'+e.v+' énergie','#8ab4ff');break;
 case'revive':G3.revive(e.u);G3.FX.pillar(e.u,0xffd84a,1);addTxt(p.x,p.top-20,'Ressuscité !','#ffd84a');sfx('lvl',.5);break;}}
let tsc=1;function slowmo(f,d){tsc=f;setTimeout(()=>{tsc=1;},d*1000);}

function caption(u,n){ui.cap={u,n,t:1.1};}
function battleEvents(){const B=VD.B;if(!VD.ev.length)return;const ev=VD.ev.splice(0);let g=null;const flush=()=>{if(g){stepGroup(g);g=null;}};
 for(const e of ev){switch(e.t){
  case'act':flush();if(e.u.side==='e'&&e.u.intent)e.u.intentEl=e.u.intent.el;g=[e];break;
  case'hit':case'heal':case'status':case'absorb':case'die':case'summon':case'energy':case'revive':if(g)g.push(e);else{const ee=e;ui.steps.push({d:.35,at:()=>applyFx(ee)});}break;
  case'charge':if(g)g.push(e);break;
  case'dot':flush();{const ee=e;ui.steps.push({d:.45,at:()=>{const p=P(ee.u);addTxt(p.x,p.y-p.s*.9,(ee.el==='fire'?'🔥':'☠')+ee.v,ee.el==='fire'?EL.fire:EL.poison);burst(p.x,p.y-p.s*.3,EL[ee.el],10,110);}});}break;
  case'skip':flush();{const ee=e;ui.steps.push({d:.6,at:()=>{const p=P(ee.u);addTxt(p.x,p.y-p.s*1.1,ee.why==='gelé'?'❄ Gelé':'💫 Étourdi','#c9d8ff');}});}break;
  case'turn':flush();break;
  case'enrage':flush();ui.steps.push({d:.9,at:()=>{ui.shake=.6;ui.flash=.7;ui.flashCol='#ff2a1a';sfx('roar');banner('Furie !','Le dragon est blessé et enragé');}});break;
  case'flee':flush();ui.steps.push({d:.6,at:()=>{ui.end='flee';}});break;
  case'win':flush();ui.steps.push({d:.7});ui.steps.push({d:1.7,at:()=>{G3.victory(VD);sfx('win');}});ui.steps.push({d:.1,at:()=>{ui.end='win';}});break;
  case'lose':flush();ui.steps.push({d:1.1,at:()=>{ui.end='lose';}});break;
  case'lvl':ui.lvl=e;break;
  case'toast':toast(e.m);break;}}
 flush();
 ui.log=B.log.slice(-2);}
function updBattle(dt){const B=VD.B;if(ui.story){ui.tw=ui.tw.filter(x=>{x.t+=dt;const p=Math.min(1,x.t/x.d);if(x.fn)x.fn(p);if(p>=1){if(x.done)x.done();return false;}return true;});return;}
 ui.tw=ui.tw.filter(x=>{x.t+=dt;const p=Math.min(1,x.t/x.d);if(x.fn)x.fn(p);if(p>=1){if(x.done)x.done();return false;}return true;});
 if(ui.stepRun){ui.stepT-=dt;if(ui.stepT<=0)ui.stepRun=null;}
 if(!ui.stepRun&&ui.steps.length){const s=ui.steps.shift();ui.stepRun=s;ui.stepT=s.d;if(s.at)s.at();}
 if(ui.intro>0){ui.intro-=dt;return;}
 if(ui.stepRun||ui.steps.length||ui.tw.length)return;
 $('blog').innerHTML=(ui.log||[]).map(m=>`<div>${m}</div>`).join('');
 if(ui.end){const e=ui.end;ui.end=null;endScreen(e);return;}
 if(!B||B.over)return;
 if(B.wait==='foe'){ui.menu=false;if(ui.foeDelay>0){ui.foeDelay-=dt;if(!ui.waitShown){$('bact').innerHTML=`<div id="bwait">${B.cur.n} agit…</div>`;ui.waitShown=1;}return;}ui.foeDelay=.25;ui.waitShown=0;VD.foeTurn();battleEvents();return;}
 if(B.wait==='hero'&&!ui.menu)buildMenu();}
function buildMenu(){const B=VD.B,h=B.cur;ui.menu=true;ui.sel=null;ui.waitShown=0;const P=VD.P;
 const sk=VD.skillsOf(h);let html=`<div id="bhead"><span style="display:flex;align-items:center;gap:8px"><canvas id="bpor" width="96" height="96" style="width:44px;height:44px;border-radius:50%;border:2px solid #8a6a2a;background:radial-gradient(circle at 50% 40%,#3a2a18,#0a0604)"></canvas><span><b>${h.n}</b> <span class="small">niv. ${h.lvl}</span><br><span class="small">${uiIco('heart',13)} ${Math.ceil(h.hp)}/${h.s.mhp} · ${uiIco('energy',13)} ${Math.floor(h.en)}/${h.s.men}</span></span></span><span class="xb"><button class="b2" data-k="defend" title="Défendre">${uiIco('guard',20)}</button><button class="b2" data-k="items" ${P.pot.soin+P.pot.elixir+P.pot.phenix?'':'disabled'}>${uiIco('bag',20)} ${P.pot.soin}</button>${B.boss?'':'<button class="b2" data-k="flee">'+uiIco('boot',20)+'</button>'}</span></div><div id="bgrid">`;
 sk.forEach(k=>{const s=VD.SK[k],c=VD.cost(h,k),cd=h.cdn[k]||0,ok=VD.canUse(h,k);html+=`<button class="sk" data-k="${k}" ${ok?'':'disabled'}><img class="ski" src="${glyphURL('skill',k,64)}" alt=""><b>${s.n}</b><span class="c">${cd?uiIco('q0',12).replace(glyphURL('ui','q0',48),glyphURL('intent','charge',48))+cd:c?c+uiIco('energy',12):''}</span><small>${s.d}</small></button>`;});
 $('bact').innerHTML=html+'</div><div id="bdesc" class="small"></div>';{const pc=$('bpor').getContext('2d'),pi=G3.portrait(h.cls);if(pi)pc.drawImage(pi,0,0,96,96);else VR.drawHeroCls(pc,48,92,96,h.cls,{face:Math.PI/2,walk:0,swing:0,swingA:0,spin:0,iframe:0,wcol:'#ddd',wr:0,t:0});}
 document.querySelectorAll('#bact [data-k]').forEach(b=>b.onclick=()=>{ac();const k=b.dataset.k;
  if(k==='items')return itemMenu();if(k==='defend'||k==='flee')return act(k,0);
  const s=VD.SK[k];if(s.tg==='foe'||s.tg==='ally'){ui.sel={k,tg:s.tg};G3.unfocus();document.querySelectorAll('#bgrid .sk').forEach(x=>x.classList.toggle('sel',x===b));
   const al=VD.alive(s.tg==='foe'?B.foes:P.heroes);if(al.length===1&&s.tg==='foe')return act(k,B.foes.indexOf(al[0]));$('blog').innerHTML=`<div>${s.n} : touche ${s.tg==='foe'?'un ennemi':'un allié'}.</div>`;}
  else act(k,0);});}
function itemMenu(){const P=VD.P;const it=[['soin',uiIco('potion',18)+' Potion de soin',`Rend ${Math.round(VD.BAL.potHeal*100)} % de la vie (+${VD.BAL.potFlat}).`],['elixir',uiIco('elixir',18)+' Élixir','+50 énergie.'],['phenix',uiIco('phenix',18)+' Plume de phénix','Ramène un héros tombé (35 % de vie).']];
 $('bact').innerHTML=`<div id="bhead"><span><b>Objets</b></span><button class="b2" id="bk">← Retour</button></div><div id="bgrid">${it.map(([k,n,d])=>`<button class="sk" data-i="${k}" ${P.pot[k]>0?'':'disabled'}><b>${n}</b><span class="c">×${P.pot[k]}</span><small>${d}</small></button>`).join('')}</div>`;
 $('bk').onclick=()=>{ui.menu=false;buildMenu();};document.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{ui.sel={k:'item:'+b.dataset.i,tg:b.dataset.i==='phenix'?'dead':'ally'};G3.unfocus();$('blog').innerHTML=`<div>Sur quel héros ?</div>`;
  document.querySelectorAll('[data-i]').forEach(x=>x.classList.toggle('sel',x===b));});}
function cancelTarget(){if(ui.sel){ui.sel=null;ui.menu=false;buildMenu();}}
function act(k,ti){const ok=VD.heroAct(k,ti);if(!ok){toast('Action impossible.');return;}ui.menu=false;ui.sel=null;$('bact').innerHTML='<div id="bwait">…</div>';battleEvents();}
cv.addEventListener('pointerdown',e=>{if(mode!=='battle'||!VD.B)return;ac();const best=G3.hitTest(e.clientX,e.clientY);if(!best)return;const B=VD.B;
 if(ui.sel){const s=ui.sel;if(s.tg==='foe'&&best.side==='e'&&!best.dead)return act(s.k,B.foes.indexOf(best));
  if((s.tg==='ally'&&best.side==='h'&&!best.dead)||(s.tg==='dead'&&best.side==='h'&&best.dead))return act(s.k,VD.P.heroes.indexOf(best));return;}
 if(best.side==='e'&&!best.dead){toast(`<b>${best.n}</b> · ${Math.ceil(best.hp)}/${best.mhp} PV · déf. ${best.def}<br>${VD.preview(best)}`);}
 else if(best.side==='h'){const s=best.s;toast(`<b>${best.n}</b> · Force ${s.str} · Magie ${s.mag} · Déf. ${s.def} · Vit. ${s.spd} · Crit ${s.crit} %`);}});

function endScreen(e){const B=VD.B;if(e==='flee'){if(VD.expe&&VD.expe.combat){finExpe('fuite');return;}VD.closeBattle();leaveBattle();toast('Vous avez fui.');return;}
 const fini=e==='win'&&VD.expe&&(B.boss||VD.expe.combat);
 if(e==='win'&&B.boss&&!ui.postDone){ui.postDone=1;const tier=VD.tier();if(VD.F<=16){ST.play('post'+tier,()=>{if(VD.F===16)ST.play('epilogue',()=>endScreen('win'),VD.P.story);else endScreen('win');},VD.P.story);return;}}
 if(e==='win'){ui.postDone=0;const r=B.reward;let lv='';const DL={dmg:'dégâts',heal:'soins',tank:'encaisse',util:'soutien',kill:'coup final'};
  if(r.per){lv='<div class="det" style="text-align:left">'+r.per.map(p=>{const h=VD.P.heroes.find(x=>x.cls===p.cls);const top=Object.entries(p.det).sort((a,b)=>b[1]-a[1])[0];const news=p.lvl?VD.CLS_SK[p.cls].filter(k=>VD.SK[k].l===p.lvl):[];
   return`<div style="margin:4px 0"><b style="color:#f0c46a">${p.n}</b> <span class="small">+${p.xp} XP${top&&top[1]>0?' · surtout '+DL[top[0]]:''}</span>${p.lvl?` <b style="color:#ffd84a">· Niveau ${p.lvl} !</b>`:''}<div class="bar xpb" style="height:5px"><i style="width:${100*h.xp/VD.xpNextH(h)}%"></i></div>${news.length?`<span class="small" style="color:#ffd84a">Nouvelle compétence : ${news.map(k=>VD.SK[k].n).join(', ')}</span>`:''}</div>`;}).join('')+'</div>';if(r.lvl)sfx('lvl');}
  $('pnc').innerHTML=`<div style="text-align:center;padding-top:10vh"><h2 style="font-family:'Cinzel Decorative',Cinzel,serif;font-size:36px;color:#f0c46a;margin:0;text-shadow:0 0 20px #a33">Victoire</h2>
   <p style="font-size:16px">+${r.gold} or</p>${lv}${r.its.length?`<div class="det" style="text-align:left"><p class="small">Butin</p>${r.its.map(it=>`<p class="r${it.rar}" style="${it.sold?'opacity:.55':''}">${IC(it,52,'icl')}${it.n} <span class="small">· ${it.sold?'revendu '+it.sold+' or':VD.SLOTS[it.s]+(it.c?' ('+VD.CLASSES[it.c].n+')':'')}</span></p>`).join('')}</div>`:'<p class="small">Pas de butin cette fois.</p>'}
   <button class="b2 gold big" id="cont">Continuer</button>${r.its.length||r.lvl?'<button class="b2 big" id="cont2">Ouvrir le sac</button>':''}</div>`;
  $('panel').style.display='block';$('cont').onclick=()=>{$('panel').style.display='none';if(fini){finExpe('victoire');return;}VD.closeBattle();leaveBattle();};if(fini){$('cont').textContent=VD.expe.combat?'Retour au royaume':'Remonter au royaume';if($('cont2'))$('cont2').remove();}if($('cont2'))$('cont2').onclick=()=>{VD.closeBattle();leaveBattle();openPanel(r.its.length?'bag':'talent');};
  if(r.its.some(i=>i.rar===3))sfx('leg');return;}
 $('pnc').innerHTML=`<div style="text-align:center;padding-top:16vh"><h2 style="font-family:'Cinzel Decorative',Cinzel,serif;font-size:34px;color:#d22;text-shadow:0 0 20px #800;margin:0">Le groupe est tombé</h2><p class="small" style="font-size:15px">${VD.expe?'Vos hommes vous ramènent à la surface, couverts de sang.':`Les profondeurs gardent ${VD.lostGold||0} pièces d'or.<br>Vous vous réveillez au début de l'étage ${VD.F}, qui a changé de forme.`}</p><button class="b2 gold big" id="rsp">${VD.expe?'Retour au royaume':'Se relever'}</button></div>`;
 $('panel').style.display='block';$('rsp').onclick=()=>{$('panel').style.display='none';if(VD.expe){finExpe('mort');return;}VD.closeBattle();leaveBattle();};}
function leaveBattle(){mode='explo';musSetBattle(false);G3.mode='explo';G3.refreshParty(VD);fogDirty=true;$('bui').style.display='none';$('explo').classList.remove('hide');paused=false;const fl=VD.ev.filter(e=>e.t==='floor');VD.ev.length=0;if(fl.length){VD.ev.push(fl[fl.length-1]);exploEvents();}VD.calcAll();save();}

/* ---------- interface superposée au combat 3D ---------- */
function drawBattle(c,dt,t){const B=VD.B;if(!B)return;const pos=layout(),S=ui.S;c.clearRect(0,0,VW,VH);
 const vt=u=>ui.sel&&((ui.sel.tg==='foe'&&u.side==='e'&&!u.dead)||(ui.sel.tg==='ally'&&u.side==='h'&&!u.dead)||(ui.sel.tg==='dead'&&u.side==='h'&&u.dead));G3.setTarget(ui.sel?vt:null);
 if(ui.wipe>0){ui.wipe-=dt;const q=ui.wipe/.9;c.fillStyle=`rgba(0,0,0,${q})`;c.fillRect(0,0,VW,VH);c.strokeStyle=`rgba(200,120,70,${q*.45})`;c.lineWidth=2;c.beginPath();c.moveTo(VW*(1.6*(1-q)),0);c.lineTo(VW*(1.6*(1-q))-VW*.6,VH);c.stroke();}
 const units=[...B.foes,...VD.P.heroes].filter(u=>pos.get(u));c.textAlign='center';
 units.forEach(u=>{const p=pos.get(u);if(u.dead&&u.side==='e')return;const X=p.x;const bw=Math.max(54,Math.min(170,(u.boss?2.6:1.1)*p.s*1.4)),by=u.side==='e'?p.top-16:p.y+12,mhp=u.side==='h'?u.s.mhp:u.mhp;
  const fr=Math.max(0,u.hp)/mhp;u._tr=u._tr===undefined?fr:(u._tr>fr?Math.max(fr,u._tr-dt*.45):fr);const bh2=u.side==='h'?12:9,rr=(x,y,w,h,r)=>{c.beginPath();c.roundRect?c.roundRect(x,y,w,h,r):c.rect(x,y,w,h);};
  c.fillStyle='rgba(8,5,3,.85)';rr(X-bw/2-2,by-2,bw+4,bh2+3,4);c.fill();c.strokeStyle=u.side==='h'?'rgba(216,178,90,.75)':u.boss?'rgba(255,120,80,.8)':'rgba(140,90,70,.6)';c.lineWidth=1;c.stroke();
  c.fillStyle='rgba(230,210,170,.7)';c.fillRect(X-bw/2,by,bw*u._tr,7);const gr=c.createLinearGradient(0,by,0,by+7);gr.addColorStop(0,u.side==='h'?'#c8634e':'#c24a3c');gr.addColorStop(.5,u.side==='h'?'#9a2a1e':'#8a1c14');gr.addColorStop(1,'#4a0806');c.fillStyle=gr;c.fillRect(X-bw/2,by,bw*fr,7);
  c.fillStyle='rgba(255,255,255,.18)';c.fillRect(X-bw/2,by,bw*fr,2);c.strokeStyle='rgba(0,0,0,.35)';for(let q=1;q<10;q++){const xx=X-bw/2+bw*q/10;c.beginPath();c.moveTo(xx,by);c.lineTo(xx,by+7);c.stroke();}
  if(u.st.shield>0){c.fillStyle='rgba(140,200,255,.9)';c.fillRect(X-bw/2,by,Math.min(bw,bw*u.st.shield/mhp),2);}if(u.side==='h'){c.fillStyle='#3a6aff';c.fillRect(X-bw/2,by+7,bw*u.en/u.s.men,3);}
  c.font="700 12px 'Alegreya Sans',sans-serif";if(u.side==='h'||u.elite||u.boss||B.foes.length<=3){let nm=u.side==='h'?u.n+(u.dead?' (KO)':''):u.n.split(',')[0];if(u.side==='e'&&!u.boss&&nm.length>15&&B.foes.filter(f=>!f.dead).length>1){const pr=nm.includes(' · ')?nm.split(' · ')[0]+' · ':'';nm=pr+nm.replace(pr,'').split(' ')[0];}c.fillStyle='#000';c.fillText(nm,X+1,by-4+1);c.fillStyle=u.side==='h'?'#f0c46a':u.elite?'#9fb4ff':'#e8dcc4';c.fillText(nm,X,by-4);}
  const sts=Object.keys(SI).filter(k=>u.st[k]>0);if(u.side==='h'&&B.rampart)sts.push('defup');if(sts.length){const gs=15,yy=(u.side==='e'?by+20:by+28)-12;sts.forEach((k,i)=>c.drawImage(glyph('status',k,32),X-sts.length*gs/2+i*gs,yy,gs,gs));}
  if(u.side==='e'&&u.intent&&!B.over){const I=u.intent;const ic='',icK=u.charge?'warn':I.aoe?'aoe':I.a==='heal'?'heal':I.self?'guard':I.a==='chargeA'?'charge':I.a==='summon'?'summon':I.a==='web'?'web':I.a==='bite'?'bite':I.a==='curse'?'curse':'atk';
   const tt=VD.alive(VD.P.heroes).find(h=>h.st.taunt>0);const tgO=I.aoe?null:I.tg?((tt&&!I.self&&I.a!=='heal')?tt:I.tg):I.ally;const tgt=I.aoe?'Groupe':tgO?tgO.n:'';
   const est=I.m?Math.round(u.atk*I.m*(u.p2?1.25:1)):0;const txt=I.a==='chargeA'?`Prépare…`:I.self?`Garde`:`${tgt}${est?' '+est:''}`;
   c.font="800 12px 'Alegreya Sans',sans-serif";const w2=c.measureText(txt).width+30,iy=by-(u.elite||u.boss||B.foes.length<=3?22:8);
   c.fillStyle=u.charge?'rgba(120,20,10,.92)':'rgba(20,14,8,.9)';c.strokeStyle=u.charge?'#ff6a3a':I.aoe?'#ff9a3a':'#6b5631';c.lineWidth=1.2;c.beginPath();c.roundRect?c.roundRect(X-w2/2,iy-13,w2,18,6):c.rect(X-w2/2,iy-13,w2,18);c.fill();c.stroke();
   c.drawImage(glyph('intent',icK,40),X-w2/2+3,iy-13,18,18);c.fillStyle=u.charge?'#ffd0b0':'#f2e4c0';c.fillText(txt,X+8,iy+1);}});
 c.textAlign='center';ui.TX=ui.TX.filter(o=>{o.life-=dt*.9;if(o.life<=0)return false;o.x+=(o.vx||0)*dt;o.vy=(o.vy||-40)+160*dt;o.y+=Math.min(o.vy,20)*dt;const age=(o.big?1.35:1.1)-o.life,pop=age<.1?.6+age/.1*.5:age<.22?1.1-(age-.1)/.12*.1:1,sz=(o.big?30:19)*pop;
  c.font=`700 ${sz|0}px Georgia,'Times New Roman',serif`;c.globalAlpha=Math.min(1,o.life*2.2);c.lineJoin='round';c.lineWidth=o.big?6:4.5;c.strokeStyle='rgba(10,4,2,.92)';c.strokeText(o.t,o.x,o.y);
  const gr=c.createLinearGradient(0,o.y-sz*.8,0,o.y+2);gr.addColorStop(0,'#f6efe2');gr.addColorStop(.5,o.c);gr.addColorStop(1,o.c);c.fillStyle=gr;c.fillText(o.t,o.x,o.y);
  if(o.big){c.font="800 11px Cinzel,serif";c.lineWidth=3;c.strokeText('CRITIQUE',o.x,o.y-sz*.85);c.fillStyle='#ffe9a0';c.fillText('CRITIQUE',o.x,o.y-sz*.85);}return true;});c.globalAlpha=1;
 if(ui.cap){ui.cap.t-=dt;if(ui.cap.t<=0)ui.cap=null;else{const a=Math.min(1,ui.cap.t*3);c.globalAlpha=a;c.font='600 17px Cinzel,serif';const txt=(ui.cap.u.side==='h'?ui.cap.u.n:ui.cap.u.n.split(',')[0])+' — '+ui.cap.n;const w=c.measureText(txt).width+40;
  c.fillStyle='rgba(0,0,0,.7)';c.fillRect(VW/2-w/2,64,w,32);c.fillStyle=ui.cap.u.side==='h'?'#f0c46a':'#ff9a7a';c.fillText(txt,VW/2,86);c.globalAlpha=1;}}
 if(!ST.active){const order=[B.cur,...B.q].filter(u=>u&&!u.dead).slice(0,9);const oy=14,r=13;order.forEach((u,i)=>{const ox=VW/2-(order.length-1)*15+i*30;
  c.fillStyle=u.side==='h'?'#3a2c12':'#3a1210';c.strokeStyle=i===0?'#fff':u.side==='h'?'#d8b25a':'#c33';c.lineWidth=i===0?2.5:1.5;c.beginPath();c.arc(ox,oy+r,r,0,TAU);c.fill();c.stroke();
  c.font="800 12px 'Alegreya Sans',sans-serif";c.fillStyle=u.side==='h'?'#f0c46a':'#ffb0a0';c.fillText(u.side==='h'?u.n[0]:u.boss?'🐉':u.n.replace(/^.*· /,'')[0],ox,oy+r+4);});}}

/* ---------- panneaux (groupe, sac, talents, marchand) ---------- */
let tab='equip',hsel=0,sel=null;
function openPanel(t){sfx('open');tab=t;sel=null;paused=true;$('panel').style.display='block';$('dot').style.display='none';renderPanel();}
function closePanel(){sfx('close');$('panel').style.display='none';paused=false;VD.calcAll();G3.refreshParty(VD);save();}
const afLine=a=>`+${a.v} ${VD.AFF[a.k][0]}`;
function itemDesc(it){return`${IC(it,128,'icb')}<h3 class="r${it.rar}">${it.n}</h3><p class="small">${VD.RAR[it.rar]} · ${VD.SLOTS[it.s]}${it.c?' de '+VD.CLASSES[it.c].t.toLowerCase()+' ('+VD.CLASSES[it.c].n+')':''}${it.bn&&it.bn!==it.n?' · '+it.bn:''} · niveau ${it.il}</p>
 ${it.dmin!==undefined?`<p>Puissance : <b>${it.dmin}–${it.dmax}</b></p>`:''}${it.def?`<p>Défense : <b>${it.def}</b></p>`:''}${it.aff.map(a=>`<p class="r1">${afLine(a)}</p>`).join('')}${it.fx?`<p class="r3"><i>${it.fx}</i></p>`:''}`;}
function cmpFor(h,it){const eq=h.eq[it.s];const d=VD.power(it)-VD.power(eq);return`<span class="${d>=0?'up':'dn'}">${d>=0?'▲':'▼'}${Math.abs(Math.round(d))}</span>`;}
function renderPanel(){VD.calcAll();const P=VD.P;const T=[['equip','⚔ Groupe'],['bag','🎒 Sac ('+P.bag.length+')'],['talent','✦ Talents'+(P.spts?' ('+P.spts+')':'')]];T.push(['story','📜 Chroniques']);if(VD.ctx==='shop')T.push(['shop','💰 Borin']);
 let h=`<div class="tabs">${T.map(([k,l])=>`<button data-t="${k}" class="${tab===k?'on':''}">${l}</button>`).join('')}<button id="xx" style="margin-left:auto">✕ Reprendre</button></div>`;
 const hero=P.heroes[hsel];const hbar=`<div class="hsel">${P.heroes.map((x,i)=>`<button class="b2 ${i===hsel?'gold':''}" data-h="${i}">${x.n}<br><span class="small">${x.t}</span></button>`).join('')}</div>`;
 if(tab==='equip'){const s=hero.s;h+=hbar+`<h2 class="t">${hero.n} · ${hero.t}</h2><div class="eqg">${Object.keys(VD.SLOTS).map(k=>{const it=hero.eq[k];return`<div class="sl ${it?'r'+it.rar:''}" data-e="${k}"><em>${VD.SLOTS[k]}</em>${it?`${IC(it)}<span class="r${it.rar}">${it.n}</span>`:'<span class="small">—</span>'}</div>`;}).join('')}</div>`;
  if(sel&&sel.w==='eq')h+=`<div class="det">${itemDesc(sel.it)}<div class="row"><button class="b2" id="ueb">Retirer</button><button class="b2" id="clb">Fermer</button></div></div>`;
  h+=`<h2 class="t">Caractéristiques</h2>${[['Vie',Math.ceil(hero.hp)+' / '+s.mhp],['Énergie',Math.floor(hero.en)+' / '+s.men+` (+${s.regen}/tour)`],['Force',s.str],['Magie',s.mag],['Défense',s.def],['Vitesse',s.spd],['Critique',s.crit+' % (×'+s.cm+')'],['Puissance d’arme',s.dmin+'–'+s.dmax],['Vol de vie',s.ll+' %'],['Résistance',s.res+' %']].map(([a,b])=>`<div class="st"><span>${a}</span><b>${b}</b></div>`).join('')}
  <p class="small" style="margin-top:12px">${hero.n} : niveau ${hero.lvl} · ${hero.xp}/${VD.xpNextH(hero)} XP · ${P.wins} victoires du groupe · record : étage ${P.best}</p>`;}
 if(tab==='bag'){h+=`<div class="row"><button class="b2" id="sellc">Vendre Communs et Magiques</button><button class="b2" id="best">Équiper le meilleur partout</button></div>`;
  if(sel&&sel.w==='bag'){const it=sel.it;h+=`<div class="det">${itemDesc(it)}<p class="small">${P.heroes.filter(x=>VD.canEquip(x,it)).map(x=>x.n+' '+cmpFor(x,it)).join(' · ')}</p><div class="row">${P.heroes.filter(x=>VD.canEquip(x,it)).map(x=>`<button class="b2 gold" data-q="${P.heroes.indexOf(x)}">Équiper sur ${x.n}</button>`).join('')}<button class="b2" id="slb">Vendre ${VD.val(it)} or</button><button class="b2" id="clb">Fermer</button></div></div>`;}
  h+=`<div class="bag">${P.bag.map((it,i)=>{const up=P.heroes.some(x=>VD.canEquip(x,it)&&VD.power(it)>VD.power(x.eq[it.s]));return`<div class="sl r${it.rar}" data-b="${i}"><em>${VD.SLOTS[it.s]}${it.c?' · '+VD.CLASSES[it.c].n:''}</em>${IC(it)}<span class="r${it.rar}">${it.n}</span>${up?'<span class="up">▲</span>':''}</div>`;}).join('')||'<p class="small">Le sac est vide.</p>'}</div>`;}
 if(tab==='talent'){h+=hbar+`<p class="small">${hero.n} (niveau ${hero.lvl}) · points de talent : <b style="color:#ffd84a">${hero.spts}</b> · chaque rang ajoute +8 % d’efficacité à la compétence.</p>`+VD.CLS_SK[hero.cls].map(k=>{const s=VD.SK[k],un=s.l<=hero.lvl;return`<div class="st"><span><b>${s.n}</b> ${un?'· rang '+(1+(hero.rk[k]||0)):'· <span class="small">niveau '+s.l+'</span>'}<br><span class="small">${s.d}${s.cost?' · '+s.cost+' énergie':''}${s.cd?' · recharge '+s.cd:''}</span></span><button class="b2 gold" data-s="${k}" ${hero.spts&&un?'':'disabled'}>+1</button></div>`;}).join('');}
 if(tab==='shop'){const pr=VD.prices();h+=`<h2 class="t">Borin, marchand nain</h2><p class="small">« Des potions, des plumes, et des paquets scellés. »<br>Ton or : <b style="color:#ffd84a">${P.gold}</b></p>
  ${[['soin','🧪 Potion de soin',P.pot.soin+'/'+VD.BAL.potMax],['elixir','✨ Élixir',P.pot.elixir],['phenix','🪶 Plume de phénix',P.pot.phenix]].map(([k,n,c])=>`<div class="st"><span>${n} <span class="small">(${c})</span></span><button class="b2 gold" data-buy="${k}" ${P.gold<pr[k]?'disabled':''}>${pr[k]} or</button></div>`).join('')}
  <h2 class="t">⚒ Forge de Borin</h2><p class="small">« Je peux renforcer ce que vous portez déjà. Jusqu'à +${VD.UPMAX}. »</p>${hbar}${Object.keys(VD.SLOTS).map(s=>{const it=hero.eq[s];if(!it)return`<div class="st"><span>${VD.SLOTS[s]} : <span class="small">rien d'équipé</span></span></div>`;const up=it.up||0,c=VD.upCost(it);return`<div class="st"><span><span class="r${it.rar}">${it.n}</span><br><span class="small">${'★'.repeat(up)}${'☆'.repeat(VD.UPMAX-up)} · ${VD.SLOTS[s]}</span></span><button class="b2 gold" data-up="${s}" ${up>=VD.UPMAX||P.gold<c?'disabled':''}>${up>=VD.UPMAX?'Max':'⚒ '+c+' or'}</button></div>`;}).join('')}
  <h2 class="t">Paquets scellés · ${pr.gamble} or</h2><p class="small">Au moins Magique, souvent Rare. Choisis pour qui :</p>${hbar}${Object.keys(VD.SLOTS).map(s=>`<div class="st"><span>📦 ${VD.SLOTS[s]} pour ${hero.n}</span><button class="b2 gold" data-g="${s}" ${P.gold<pr.gamble?'disabled':''}>${pr.gamble} or</button></div>`).join('')}
  ${sel&&sel.w==='bag'?`<div class="det">${itemDesc(sel.it)}<div class="row"><button class="b2" id="clb">Fermer</button></div></div>`:''}`;}
 if(tab==='story')h+=`<h2 class="t">Chroniques du puits</h2>`+ST.journal(P.story);
 $('pnc').innerHTML=h;const q=id=>document.getElementById(id);
 document.querySelectorAll('[data-replay]').forEach(b=>b.onclick=()=>ST.play(b.dataset.replay,()=>{},null));
 $('xx').onclick=closePanel;document.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{tab=b.dataset.t;sel=null;renderPanel();});
 document.querySelectorAll('[data-h]').forEach(b=>b.onclick=()=>{hsel=+b.dataset.h;sel=null;renderPanel();});
 document.querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>{const it=hero.eq[b.dataset.e];if(it){sel={it,w:'eq'};renderPanel();}});
 document.querySelectorAll('[data-b]').forEach(b=>b.onclick=()=>{sel={it:P.bag[+b.dataset.b],w:'bag'};renderPanel();});
 document.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{(sfx('equip'),VD.equip(P.heroes[+b.dataset.q],sel.it));sfx('pick',.5);sel=null;renderPanel();});
 document.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{VD.talent(hero,b.dataset.s);sfx('pick');renderPanel();});
 document.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>{if(VD.upgrade(hero,b.dataset.up)){sfx('shield');sfx('coin');toast('⚒ '+hero.eq[b.dataset.up].n,'#ffd84a');G3.refreshParty&&0;}renderPanel();});
 document.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{if(VD.buy(b.dataset.buy))sfx('coin');renderPanel();});
 document.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>{const it=VD.gamble(b.dataset.g,hero.cls);if(it){sel={it,w:'bag'};sfx(it.rar===3?'leg':'pick');}renderPanel();});
 if(q('ueb'))q('ueb').onclick=()=>{(sfx('equip'),VD.unequip(hero,sel.it.s));sel=null;renderPanel();};
 if(q('clb'))q('clb').onclick=()=>{sel=null;renderPanel();};
 if(q('slb'))q('slb').onclick=()=>{VD.sell(sel.it);sfx('coin');sel=null;renderPanel();};
 if(q('sellc'))q('sellc').onclick=()=>{const g=VD.sellJunk();if(g){toast('+'+g+' or');sfx('coin');}sel=null;renderPanel();};
 if(q('best'))q('best').onclick=()=>{P.heroes.forEach(x=>P.bag.slice().forEach(it=>{if(VD.canEquip(x,it)&&VD.power(it)>VD.power(x.eq[it.s]))(sfx('equip'),VD.equip(x,it));}));sel=null;renderPanel();};}

/* ---------- sauvegarde & titre ---------- */
function save(){try{if(TEST||EXPE)return;if(!started||!VD.P||!VD.P.heroes)return;if(VD.B)return;const t=Date.now(),str=JSON.stringify({P:VD.P,UID:VD.getUID(),t});try{localStorage.setItem('valdragon_tb_v1',str);}catch(e){}cloudSave(str,t);}catch(e){}}
// sauvegarde à la sortie de l'application, à la mise en arrière-plan et toutes les 15 s en exploration
document.addEventListener('visibilitychange',()=>{if(document.hidden)save();});addEventListener('pagehide',save);addEventListener('beforeunload',save);setInterval(()=>{if(mode==='explo'&&!paused)save();},15000);
// au lancement : récupère la sauvegarde en ligne si elle est plus récente que la locale
if(!EXPE)cloudLoad().then(d=>{if(!d||started||TEST)return;let loc=null;try{loc=JSON.parse(localStorage.getItem('valdragon_tb_v1'));}catch(e){}if(!loc||(d.t||0)>(loc.t||0)){try{localStorage.setItem('valdragon_tb_v1',d.s);}catch(e){CLOUD=d.s;}if(!started){confirmNew=false;title();}}});
let CLOUD=null;
function load(){try{const d=JSON.parse(localStorage.getItem('valdragon_tb_v1')||CLOUD);if(d&&d.P){VD.setUID(d.UID||9999);d.P.heroes.forEach(h=>{h.st={};h.cdn={};h.dead=false;});return d.P;}}catch(e){}return null;}
const tcv=$('tcv'),tx=tcv.getContext('2d');const emb=[];
function titleLoop(){if(started)return;const w=tcv.width=innerWidth,h=tcv.height=innerHeight;const g=tx.createRadialGradient(w/2,h*.85,0,w/2,h*.85,h);g.addColorStop(0,'#3a0d06');g.addColorStop(.5,'#120504');g.addColorStop(1,'#000');tx.fillStyle=g;tx.fillRect(0,0,w,h);
 const t=performance.now()/1000,fl=Math.sin(t*1.6)*18;tx.save();tx.translate(w/2,h*.8);tx.scale(Math.min(1.4,w/600),Math.min(1.4,w/600));tx.globalAlpha=.9;tx.fillStyle='#160403';tx.shadowColor='#ff5a1a';tx.shadowBlur=30;
 [-1,1].forEach(d=>{tx.beginPath();tx.moveTo(d*20,-10);tx.lineTo(d*150,-150-fl);tx.lineTo(d*270,-90-fl);tx.lineTo(d*230,-40-fl*.5);tx.lineTo(d*250,10-fl*.3);tx.lineTo(d*190,0);tx.lineTo(d*180,50);tx.lineTo(d*120,20);tx.lineTo(d*90,70);tx.lineTo(d*30,40);tx.closePath();tx.fill();});
 tx.beginPath();tx.ellipse(0,20,42,80,0,0,7);tx.fill();tx.beginPath();tx.moveTo(-22,-40);tx.quadraticCurveTo(0,-110,0,-120);tx.quadraticCurveTo(0,-110,22,-40);tx.fill();tx.beginPath();tx.ellipse(0,-128,24,30,0,0,7);tx.fill();
 [-1,1].forEach(d=>{tx.beginPath();tx.moveTo(d*12,-148);tx.lineTo(d*34,-185);tx.lineTo(d*20,-140);tx.fill();});tx.beginPath();tx.moveTo(-14,90);tx.quadraticCurveTo(60,170,10,230);tx.lineTo(4,200);tx.quadraticCurveTo(30,160,0,95);tx.fill();
 tx.shadowBlur=14;tx.fillStyle='#ffb02e';tx.beginPath();tx.ellipse(-9,-132,5,3,0,0,7);tx.ellipse(9,-132,5,3,0,0,7);tx.fill();tx.restore();tx.shadowBlur=0;tx.globalAlpha=1;
 if(emb.length<120)emb.push({x:Math.random()*w,y:h+10,v:30+Math.random()*60,s:1+Math.random()*2.5,p:Math.random()*6});
 tx.globalCompositeOperation='lighter';emb.forEach(e=>{e.y-=e.v/60;e.x+=Math.sin(t+e.p)*.4;tx.fillStyle=`rgba(255,${120+Math.random()*60|0},40,${Math.min(1,e.y/h)})`;tx.fillRect(e.x,e.y,e.s,e.s);});tx.globalCompositeOperation='source-over';
 for(let i=emb.length-1;i>=0;i--)if(emb[i].y<-10)emb.splice(i,1);requestAnimationFrame(titleLoop);}
let confirmNew=false;
function title(){const sv=load();
 $('tic').innerHTML=`<h1>Les Héritiers<br>du Puits</h1><p style="font-family:Cinzel,serif;color:#c9b48a;margin:0 0 10px">Valdragon · combats au tour par tour</p><p class="small" style="font-size:15px;max-width:460px;margin:0 auto">Aldric le guerrier, Ysolde la mage et Maëlle la rôdeuse descendent dans le puits de Valdragon. Tous les quatre étages, un dragon garde l'escalier.</p>
 ${sv?`<button class="b2 gold big" id="ct">Continuer · niveau ${sv.lvl} · étage ${sv.floor}</button>`:''}<button class="b2 big ${sv?'':'gold'}" id="nw">${sv?'Nouvelle partie':'Descendre'}</button>
 <div class="det note"><p><b>Exploration</b> : pouce gauche ou ZQSD pour bouger. Toucher un groupe d'ennemis lance le combat. Coffres, sanctuaires et marchand en chemin.</p>
 <p><b>Combat</b> : à chaque tour, choisis une compétence puis touche la cible. Au-dessus de chaque ennemi, son <b>intention</b> annonce ce qu'il va faire : ⚠️ = attaque chargée, à briser avec la Lance de givre ou à encaisser avec Défense, Rempart ou Barrière.</p>
 <p class="small">Clavier : 1 à 9 pour les actions, Échap pour annuler, I pour le sac.</p></div><p class="small" style="opacity:.55;margin-top:8px">Crédits 3D : dragon « Drago » par Oscar Creativo (CC BY 4.0) · personnages Adobe Mixamo · textures Poly Haven (CC0) · décors KayKit &amp; Quaternius (CC0)</p>`;
 const go=p=>{$('explo').classList.remove('hide');if(!G3.isReady()){const b=$(p?'ct':'nw');if(b){b.disabled=true;b.textContent='Chargement des modèles 3D…';}G3.ready.then(()=>go(p));return;}ac();started=true;if(G3.kitErr)setTimeout(()=>toast('Modèles 3D non chargés ('+G3.kitErr+') : affichage simplifié.','#ff9a7a'),2500);$('title').style.display='none';VD.newGame(p);VD.P.story=VD.P.story||[];mode='explo';
  if(!p&&TEST){VD.P.story.push('prologue','biome0','biome1','biome2','biome3','pre0','pre1','pre2','pre3');paused=false;exploEvents();}else if(!p){paused=true;ST.play('prologue',()=>{paused=false;exploEvents();save();},VD.P.story);}else{exploEvents();paused=false;save();}};
 {const tb=document.createElement('button');tb.className='b2';tb.id='tst';tb.style.cssText='opacity:.55;font-size:13px;margin-top:6px';tb.textContent='🧪 Mode test (mesures, partie à part)';$('nw').after(tb);tb.onclick=()=>{TEST=true;qAuto=false;go(null);testUI();};}
 $('nw').onclick=()=>{if(sv&&!confirmNew){confirmNew=true;$('nw').textContent='Confirmer : effacer la partie en cours';$('nw').classList.add('gold');return;}go(null);};if($('ct'))$('ct').onclick=()=>go(sv);}


/* ---------- boucle ---------- */
let occPrev=false,last=performance.now(),last0=performance.now(),fogT=0,stepD=0,stepN=.55;
function loop(t){if(TEST)testFrame(t);const dt=Math.min(.05,(t-last)/1000);last=t;const ts=t/1000;
 if(!started&&G3.mode==='title'){G3.updTitle(dt,ts);G3.render(ts,dt);}
 if(started&&VD.P){const occ=G3.occupe,occ1=occ||occPrev;occPrev=occ;if(occ1){perf.t=0;perf.n=0;}else if(!ST.active&&!paused)perfTick((t-last0)/1000);last0=t;/* pendant la préparation des effets : ni mesure de fluidité, ni déplacement à l'aveugle */
  if(mode==='explo'){if(!paused&&!occ){const px=VD.P.x,py=VD.P.y;VD.step(dt,input());const mv=Math.hypot(VD.P.x-px,VD.P.y-py);stepD+=mv;if(stepD>stepN){stepD=0;stepN=.5+Math.random()*.14;sfx('step',.5+Math.random()*.35);}exploEvents();}
   if(mode==='explo'){fogT-=dt;if(fogT<=0){fogDirty=true;fogT=.15;}G3.updExplo(VD,dt,ts,fogDirty);fogDirty=false;if(!window.__skipR)G3.render(ts,dt);drawExploOverlay(dt);hudT-=dt;if(hudT<=0){hud();drawMini(mx,216);hudT=.1;}}}
  if(mode==='battle'&&VD.B){const db=occ?0:dt*tsc;updBattle(db);G3.updBattle(VD,db,ts);G3.render(ts,db);drawBattle(cx,db,ts);}}
 requestAnimationFrame(loop);}
/* ---------- pilotage par Le Trône de Braise ---------- */
let bilanFait=false;
function finExpe(res){if(bilanFait)return;bilanFait=true;const b=VD.bilanExpedition(res);$('panel').style.display='none';$('bui').style.display='none';$('explo').classList.add('hide');
 paused=true;started=false;mode='idle';G3.mode='idle';try{if(AC&&AC.state==='running')AC.suspend();}catch(e){}
 parent.postMessage({t:'fin3d',b},'*');}
function couleursMaison(cfg){const m=cfg.maison||{c1:'#c8632a',c2:'#f2d7a0',emb:'tour'};const r=document.documentElement.style;r.setProperty('--maison',m.c1);r.setProperty('--maison2',m.c2);try{r.setProperty('--blason',`url(${blason(m.c1,m.c2,m.emb,76,112).toDataURL()})`);}catch(e){}}
// Puce graphique modeste (Intel intégrée des Mac/PC portables, petits GPU mobiles) : on part en qualité Normale au lieu de Haute
// (2,3× moins de pixels, sans flou lumineux ni anticrénelage ×4) ; la qualité automatique remonte d'elle-même si tout est fluide.
function gpuFaible(){if(window.__gpuFaible!==undefined)return !!window.__gpuFaible;const g=gpuName();return /Intel/i.test(g)&&!/\bArc\b/i.test(g)||/Mali-[GT]?\d|Adreno \(TM\) [3-5]\d\d|PowerVR/i.test(g);}
let gpuVu=false;
function debutExpe(cfg){bilanFait=false;if(!gpuVu){gpuVu=true;try{if(qAuto&&qCur>1&&gpuFaible()){qSet(1);perf.good=0;}}catch(e){}}TEST=!!cfg.test;if(TEST)testUI();if($('tov'))$('tov').style.display=TEST?'flex':'none';couleursMaison(cfg);if(cfg.muet!==undefined){muted=!!cfg.muet;$('mute').innerHTML=uiIco(muted?'muet':'son',22);}$('title').style.display='none';$('explo').classList.remove('hide');ac();try{if(AC&&AC.state==='suspended')AC.resume();}catch(e){}
 started=true;mode='explo';paused=false;G3.setTheme(cfg);VD.lancerExpedition(cfg);VD.P.story=VD.P.story||[];exploEvents();
 if(G3.kitErr)setTimeout(()=>toast('Modèles 3D non chargés ('+G3.kitErr+') : affichage simplifié.','#ff9a7a'),2500);
 if(!VD.B)setTimeout(()=>toast(VD.expe.etages>1?'Le gardien attend au fond du deuxième étage. Touchez ⛺ pour rebrousser chemin.':'Le gardien attend au fond de l’antre.','#e8d8b0'),2600);}
try{ST.play=(k,d)=>{if(d)setTimeout(d,0);};}catch(e){}

{const q=document.createElement('button');q.className='rb';q.id='bQuit';q.title='Rebrousser chemin';q.textContent='⛺';q.style.cssText='right:140px;top:calc(124px + env(safe-area-inset-top));width:36px;height:36px;font-size:16px';$('explo').appendChild(q);
 let conf=0;q.onclick=()=>{if(paused||mode!=='explo')return;if(!conf){conf=1;toast('Touchez ⛺ encore une fois pour remonter : vous gardez l’or et le butin, mais le gardien reste en vie.');setTimeout(()=>conf=0,4000);return;}finExpe('fuite');};}
addEventListener('message',ev=>{const m=ev.data;if(!m||typeof m!=='object')return;if(m.t==='stop3d'){bilanFait=true;$('panel').style.display='none';$('bui').style.display='none';$('explo').classList.add('hide');paused=true;started=false;mode='idle';G3.mode='idle';try{if(AC&&AC.state==='running')AC.suspend();}catch(e){}return;}if(m.t==='banc3d'){runBench(m.sc,m.lv).then(out=>parent.postMessage({t:'banc3d-fin',out},'*'));return;}if(m.t==='expe3d'){const go=()=>debutExpe(m.cfg);if(G3.isReady())go();else G3.ready.then(go);}});
$('tic').innerHTML='<h1 style="font-size:28px">Le Trône de Braise</h1><p style="font-family:Cinzel,serif;color:#c9b48a">Préparation des profondeurs…</p>';
window.__expe={fin:finExpe,debut:debutExpe};G3.ready.then(()=>parent.postMessage({t:'pret3d',err:G3.kitErr||null},'*'));
requestAnimationFrame(loop);
if(0)G3.ready.then(ok=>{if(!started&&G3.buildTitle()){const t=$('tcv');t.style.transition='opacity 1.5s';t.style.opacity='0';$('title').style.background='transparent';$('title').classList.add('t3d');$('explo').classList.add('hide');}});
window.__ui=ui;

/* ---------- mode test : compteur d'images réelles et banc de mesure sur l'appareil ---------- */
const TF={ft:[],lt:0,txt:0,rec:null,calls:0,tris:0,renders:0};
function gpuName(){try{const gl=G3._d().renderer.getContext();const e=gl.getExtension('WEBGL_debug_renderer_info');return e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);}catch(e){return '?';}}
function stats(a){if(!a.length)return null;const s=a.slice().sort((x,y)=>x-y),avg=a.reduce((x,y)=>x+y,0)/a.length,p99=s[Math.min(s.length-1,Math.floor(s.length*.99))];return{fps:+(1000/avg).toFixed(1),low1:+(1000/p99).toFixed(1),pire:+s[s.length-1].toFixed(1),n:a.length};}
function testFrame(t){{const ri=G3._d().renderer.info;ri.autoReset=false;TF.calls=ri.render.calls;TF.tris=ri.render.triangles;ri.reset();}if(TF.lt){const d=t-TF.lt;TF.ft.push(d);if(TF.rec)TF.rec.push(d);if(TF.ft.length>240)TF.ft.shift();}TF.lt=t;
 if(t-TF.txt>500&&$('tov')){TF.txt=t;const st=stats(TF.ft.slice(-60));const r={triangles:TF.tris,calls:TF.calls};$('tov').firstChild.textContent=`🧪 ${st?st.fps:'-'} img/s · pire ${st?st.pire:'-'} ms · ${QN[qCur]} · ${mode==='battle'?(VD.B&&VD.B.boss?'boss':'combat'):'explo'} ét.${VD.F||'-'} · ${(r.triangles/1000|0)}k tri · ${r.calls} appels`;}}
function testUI(){if(!G3.__wr){G3.__wr=1;const r0=G3.render;G3.render=(a,b)=>{TF.renders++;r0(a,b);};}if($('tov'))return;const d=document.createElement('div');d.id='tov';d.style.cssText='position:fixed;top:4px;left:50%;transform:translateX(-50%);z-index:99;background:rgba(0,0,0,.72);color:#9fe0a0;font:12px monospace;padding:4px 8px;border-radius:6px;display:flex;gap:8px;align-items:center;pointer-events:auto';
 d.innerHTML='<span>🧪</span><button id="tbench" style="font:12px sans-serif">▶ Banc</button><button id="tbug" style="font:12px sans-serif">🐞 Signaler</button>';document.body.appendChild(d);$('tbench').onclick=()=>runBench();$('tbug').onclick=()=>report();}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function measure(ms){TF.rec=[];TF.renders=0;let tr=0,ca=0,k=0;const iv=setInterval(()=>{tr+=TF.tris;ca+=TF.calls;k++;},100);await wait(ms);clearInterval(iv);const a=TF.rec;TF.rec=null;const st=stats(a)||{};return Object.assign(st,{tris:Math.round(tr/Math.max(1,k)),calls:Math.round(ca/Math.max(1,k)),rendus:TF.renders,etat:mode+(paused?' pause':'')+(ST.active?' récit':'')+($('panel').style.display==='block'?' panneau':'')});}
function seedRng(seed){let s=seed;Math.random=()=>{s=(s*16807)%2147483647;return (s-1)/2147483646;};}
function skipStory(){const k=document.querySelector('#story .sskip');if(ST.active&&k)k.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));}
async function toExplo(){for(let i=0;i<5&&ST.active;i++){skipStory();await wait(250);}paused=true;if(VD.B){const i=VD.E.indexOf(VD.B.pack);if(i>=0)VD.E.splice(i,1);VD.B.over='win';VD.closeBattle();}if(mode==='battle'||VD.B){leaveBattle();paused=true;}VD.ev.length=0;await wait(300);}
let BENV=null;
// Environnement du banc : batterie (économie d'énergie = image limitée) et cadence maximale de l'écran sans rendu 3D
async function benchEnv(){const e={};try{if(navigator.getBattery){const b=await navigator.getBattery();e.batterie={branche:b.charging,niveau:Math.round(b.level*100)};}}catch(_){}
 try{e.cadenceMax=await new Promise(r=>{window.__skipR=1;let n=0,t0=0;const f=t=>{if(!t0)t0=t;n++;if(t-t0<1000)requestAnimationFrame(f);else{window.__skipR=0;r(Math.round(n*1000/(t-t0)));}};requestAnimationFrame(f);});}catch(_){window.__skipR=0;}
 e.cachee=document.hidden;return e;}
async function runBench(sc,lv){if(TF.busy)return null;TF.busy=true;const aq=window.__noAutoQ;window.__noAutoQ=1;const q0=qCur;BENV=await benchEnv();const btn=$('tbench')||{};btn.disabled=true;const res=[],rnd=Math.random;
 const SC=sc||window.__SC||[['explo',VD.F||2],['combat',VD.F||2],['boss',VD.expe?VD.expe.dernier:8]],LV=lv||window.__LV||[0,1,2,3];
 try{for(const lv of LV){qSet(lv);for(const [k,F] of SC){btn.textContent=`${QN[lv]} · ${k} ${F}…`;await toExplo();seedRng(4242+F);paused=true;VD.newGame(VD.P,4242+F);VD.startFloor(F);const keep=k==='explo'?null:VD.E.find(e=>k==='boss'?e.boss:!e.boss);VD.E.length=0;if(keep)VD.E.push(keep);exploEvents();paused=false;await wait(400);
   if(k==='explo'){const r=VD.rooms[1];VD.P.x=r.x+r.w/2;VD.P.y=r.y+r.h/2;await wait(2500);}
   else{const e=VD.E.find(e=>k==='boss'?e.boss:!e.boss);if(!e)continue;VD.P.x=e.x;VD.P.y=e.y+(e.boss?1:.4);for(let i=0;i<25;i++){await wait(200);skipStory();}const d=G3._d();if(d.BT){d.BT.cine=null;d.BT.camT=9;}await wait(800);}
   skipStory();await wait(200);const tp=performance.now();while(G3.occupe&&performance.now()-tp<30000)await wait(100);const prep=Math.round(performance.now()-tp);if(prep>150)await wait(500);/* on mesure le régime établi, pas la préparation des effets */
   const m=await measure(5000);res.push(Object.assign({scene:k+' '+F,niveau:QN[lv]},m,prep>150?{prep}:{}));}}
 }catch(e){res.push({erreur:String(e)});}
 Math.random=rnd;await toExplo();qSet(q0);window.__noAutoQ=aq;
 const out={jeu:'trone-de-braise',page:'donjon3d',date:new Date().toISOString(),gpu:gpuName(),ua:navigator.userAgent,ecran:innerWidth+'x'+innerHeight+' @'+devicePixelRatio,qAuto,depart:QN[q0],res,env:BENV};
 btn.disabled=false;btn.textContent='▶ Banc';TF.busy=false;if(sc)return out;const ok=await cloudPut('mesures_'+Date.now(),out);showBench(out,ok);return out;}
function showBench(o,ok){const rows=o.res.map(r=>`<tr><td>${r.niveau||''}</td><td>${r.scene||r.erreur}</td><td><b>${r.fps??''}</b></td><td>${r.low1??''}</td><td>${r.pire??''}</td><td>${r.tris?(r.tris/1000|0)+'k':''}</td></tr>`).join('');
 const p=document.createElement('div');p.style.cssText='position:fixed;inset:40px 8px auto 8px;z-index:100;background:rgba(10,8,6,.95);color:#e8dcc4;font:12px sans-serif;padding:10px;border:1px solid #6a5a40;border-radius:8px;max-height:80vh;overflow:auto';
 p.innerHTML=`<b>Banc de mesure</b> · ${o.gpu}<br><span style="opacity:.7">${o.ecran} · ${ok?'enregistré dans la base ✓':'enregistré sur cet appareil'}</span>${o.env?`<br><span style="opacity:.85">Écran : ${o.env.cadenceMax||'?'} img/s au maximum${o.env.batterie?` · batterie ${o.env.batterie.niveau} % ${o.env.batterie.branche?'(branché)':'(sur batterie)'}`:''}${o.env.cadenceMax&&o.env.cadenceMax<45?' · <b style="color:#ffb060">limité par l\'économie d\'énergie</b>':''}</span>`:''}<table style="width:100%;margin-top:6px;border-collapse:collapse"><tr><th>Qualité</th><th>Scène</th><th>img/s</th><th>1 % bas</th><th>pire ms</th><th>tri</th></tr>${rows}</table><button style="margin-top:8px">Fermer</button>`;
 document.body.appendChild(p);p.querySelector('button').onclick=()=>p.remove();}
const ERRS=[];addEventListener('error',e=>{ERRS.push(String(e.message||e).slice(0,300));if(ERRS.length>20)ERRS.shift();});addEventListener('unhandledrejection',e=>{ERRS.push('promesse: '+String(e.reason).slice(0,300));});
$('bugb').onclick=()=>report();document.body.appendChild($('bugb'));// 🐞 aussi pendant les combats (hors du bandeau d'exploration)
async function report(){const b=$('tbug')||$('bugb');b.disabled=true;const bt=b.textContent;b.textContent='…';let img='';try{const d=G3._d();d.composer.render(.016);const c=document.createElement('canvas');const src=d.renderer.domElement;const k=Math.min(1,480/src.width);c.width=src.width*k|0;c.height=src.height*k|0;c.getContext('2d').drawImage(src,0,0,c.width,c.height);img=c.toDataURL('image/jpeg',.6);}catch(e){}
 const st={test:TEST,date:new Date().toISOString(),gpu:gpuName(),ua:navigator.userAgent,mode,F:VD.F,pos:VD.P&&[+VD.P.x.toFixed(2),+VD.P.y.toFixed(2)],combat:VD.B?{round:VD.B.round,foes:VD.B.foes.map(f=>f.k+':'+Math.round(f.hp)),boss:!!VD.B.boss}:null,heros:VD.P&&VD.P.heroes.map(h=>h.n+' '+Math.round(h.hp)+'/'+h.s.mhp),qualite:QN[qCur],img_s:(stats(TF.ft.slice(-60))||{}).fps,erreurs:ERRS.slice(),capture:img};
 st.jeu='trone-de-braise';st.page='donjon3d';st.expe=VD.expe?{type:VD.expe.type,tier:VD.expe.tier,etage:VD.F,dernier:VD.expe.dernier}:null;const ok=await cloudPut('signalement_'+Date.now(),st);b.disabled=false;b.textContent=bt;toast(ok?'Signalement envoyé à Claude ✓':'Signalement gardé sur cet appareil');}
addEventListener('vd-save',()=>{try{save();}catch(e){}});
