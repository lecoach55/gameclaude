/* ===== Valdragon · histoire et dialogues ===== */
const ST=(function(){
const TAU=Math.PI*2;
const WHO={aldric:['Aldric','guerrier'],ysolde:['Ysolde','mage'],maelle:['Maëlle','rodeuse'],borin:['Borin','borin'],
 vharzul:['Vharzul','fire'],sylthra:['Sylthra','ice'],morgrath:['Morgrath','poison'],ysmeralde:['Ysmeralde','arcane'],echo:['Écho','fire']};
const L={
 prologue:{t:'Prologue · Le soupir du puits',l:[
  {s:'village',x:"Valdragon. Un bourg de pierre grise, accroché au bord d’un puits que personne n’a jamais sondé."},
  {s:'fondateurs',x:"Il y a trois cents ans, quatre fondateurs y sont descendus avec quatre dragons. Ils ont scellé quelque chose, tout au fond. Puis ils sont remontés seuls."},
  {s:'souffle',x:"Cette nuit, le puits a soupiré. Les lampes du bourg se sont éteintes une à une, et une chaleur monte des profondeurs."},
  {s:'heritiers',x:"Trois héritiers des fondateurs se tiennent au bord de la margelle."},
  {w:'aldric',x:"Si le sceau cède, Valdragon tombe avec lui. On descend."},
  {w:'ysolde',x:"Les runes de la margelle parlent de quatre gardiens. Elles ne parlent pas de quatre monstres."},
  {w:'maelle',x:"Gardiens ou monstres, ils ont des crocs. Je passe devant."}]},
 biome0:{t:'Étage 1 · La Crypte oubliée',l:[
  {w:'borin',x:"Des héritiers ! Ça faisait trois siècles. Je vends, vous survivez, et tout le monde est content."},
  {w:'aldric',x:"Un marchand, au fond d’un puits scellé ?"},
  {w:'borin',x:"Les sceaux, ça retient les monstres. Pas le commerce. Revenez me voir à chaque étage."}]},
 biome1:{t:'Étage 5 · Les Cavernes fongiques',l:[
  {w:'maelle',x:"Ces champignons brillent comme des yeux. J’ai l’impression qu’ils nous suivent."},
  {w:'ysolde',x:"Ils poussent sur la lumière des dragons. Vharzul les nourrissait depuis trois cents ans… et ils commencent déjà à faner."}]},
 biome2:{t:'Étage 9 · La Forge engloutie',l:[
  {w:'aldric',x:"Une forge, sous la terre ? Les enclumes sont encore chaudes."},
  {w:'ysolde',x:"C’est ici que les fondateurs ont forgé le sceau. Regarde les moules : ils ont la forme d’écailles."},
  {w:'maelle',x:"Ils ont forgé quelque chose avec des écailles de dragon. Je n’aime pas ça."}]},
 biome3:{t:'Étage 13 · L’Abîme de givre',l:[
  {w:'ysolde',x:"Le froid vient d’en bas. Le sceau aspire toute la chaleur du monde pour tenir fermé."},
  {w:'maelle',x:"Alors dépêchons-nous, avant qu’il aspire la nôtre."}]},
 pre0:{t:'Vharzul, Dragon des Cendres',l:[
  {w:'vharzul',x:"Héritiers… Vous avez les yeux de ceux qui m’ont enchaîné ici."},
  {w:'vharzul',x:"Montrez-moi s’ils vous ont aussi légué leur courage."}]},
 post0:{t:'Les dernières braises',l:[
  {w:'vharzul',x:"Bien… Descendez. Mais écoutez-moi : nous ne gardions pas le puits contre vous."},
  {w:'vharzul',x:"Nous le gardions pour vous."},
  {w:'aldric',x:"Que voulait-il dire ?"},
  {w:'ysolde',x:"Je ne sais pas. Mais il n’avait pas l’air d’un geôlier. Il avait l’air d’un veilleur."}]},
 pre1:{t:'Sylthra, Wyrm de Givre',l:[
  {w:'sylthra',x:"Vharzul est tombé. Je l’ai senti, comme une braise qu’on écrase dans la neige."},
  {w:'sylthra',x:"Si vous voulez descendre, il faudra me faire fondre."}]},
 post1:{t:'Le dégel',l:[
  {w:'sylthra',x:"Le sceau se fissure… Quand le dernier gardien tombera, quelqu’un devra prendre sa place."},
  {w:'ysolde',x:"Prendre sa place… Comme les dragons l’ont prise pour les fondateurs ?"},
  {w:'maelle',x:"Personne ne prendra la place de personne. On descend, on comprend, on remonte."}]},
 pre2:{t:'Morgrath le Dévoreur',l:[
  {w:'morgrath',x:"J’ai faim depuis trois cents ans. On m’a nourri de sortilèges et de silence."},
  {w:'morgrath',x:"Vous serez un repas plus honnête."}]},
 post2:{t:'La faim de lumière',l:[
  {w:'morgrath',x:"Je n’avais pas faim de vous… J’avais faim de lumière. Il n’y en a plus, en bas."},
  {w:'maelle',x:"Je n’aime pas quand les monstres ont l’air tristes."},
  {w:'aldric',x:"Il reste une gardienne. Et ce qu’elle garde."}]},
 pre3:{t:'Ysmeralde, Reine des Écailles',l:[
  {w:'ysmeralde',x:"Je suis la dernière. Derrière moi dort ce que vos ancêtres ont scellé."},
  {w:'ysmeralde',x:"Ils ne vous ont jamais dit son nom, n’est-ce pas ? Approchez. Je vais vous l’apprendre à ma manière."}]},
 post3:{t:'Le nom du Cœur',l:[
  {w:'ysmeralde',x:"Le puits a un cœur, et ce cœur rêve. Vos ancêtres ne l’ont pas tué : ils l’ont endormi."},
  {w:'ysmeralde',x:"Et ils nous ont donnés à lui, comme on chante une berceuse. Quatre chants. Il n’en reste plus aucun."}]},
 epilogue:{t:'Épilogue · Le premier chant',l:[
  {s:'coeur',x:"Au fond de l’Abîme, les héritiers trouvèrent une chambre ronde. Au centre, quelque chose battait lentement, comme une bête qui dort."},
  {w:'aldric',x:"Alors c’est nous, les berceuses, maintenant ?"},
  {w:'ysolde',x:"Non. Les runes ont changé depuis que nous sommes descendus. Il existe une autre manière, plus bas."},
  {w:'maelle',x:"Plus bas. Évidemment."},
  {s:'coeur',x:"Fin du premier chant. Le puits continue de descendre, et les profondeurs ne sont pas vides. Les dragons qui gardent la suite ne sont que les échos des quatre premiers."}]},
 echo:{t:'Un écho',l:[{w:'echo',x:"Je suis l’écho d’un gardien tombé. Le Cœur rêve encore de moi."}]}};

/* ---------- DOM ---------- */
const ov=document.createElement('div');ov.id='story';ov.innerHTML=`<canvas id="scv"></canvas><div class="sdlg"><canvas id="spor" width="180" height="180"></canvas><div class="stx"><div class="snm"></div><div class="stt"></div><div class="snx">Toucher pour continuer ▸</div></div></div><div class="stitle"></div><button class="sskip">Passer ⏭</button>`;
document.body.appendChild(ov);
const css=document.createElement('style');css.textContent=`#story{position:fixed;inset:0;z-index:20;display:none;background:rgba(0,0,0,.55);touch-action:none}
#scv{position:absolute;inset:0;width:100%;height:100%}
#story .sdlg{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(16px + env(safe-area-inset-bottom));width:min(620px,94%);display:flex;gap:12px;align-items:flex-start;background:linear-gradient(#1f170e,#0e0a06);border:1px solid #8a6a2a;border-radius:14px;padding:12px;box-shadow:0 0 0 1px #000,0 10px 30px rgba(0,0,0,.8)}
#spor{width:84px;height:84px;flex:none;border-radius:50%;border:2px solid #8a6a2a;background:radial-gradient(circle at 50% 40%,#3a2a18,#0a0604)}
#story .stx{flex:1;min-width:0}#story .snm{font-family:Cinzel,serif;color:#f0c46a;font-size:17px}
#story .stt{font-size:16.5px;line-height:1.4;margin-top:3px;min-height:68px;color:#efe4cf}#story .snx{font-size:12px;color:#8a7b62;text-align:right;margin-top:4px}
#story .stitle{position:absolute;top:calc(18px + env(safe-area-inset-top));left:12px;right:100px;text-align:center;font-family:Cinzel,serif;color:#c9b48a;font-size:14px;letter-spacing:.12em;text-shadow:0 2px 4px #000}
#story .sskip{position:absolute;top:calc(12px + env(safe-area-inset-top));right:12px;background:#000a;border:1px solid #6b5631;color:#c9b48a;border-radius:16px;padding:6px 12px;font-family:'Alegreya Sans',sans-serif}
#story.scene .sdlg{background:linear-gradient(rgba(14,10,6,.75),rgba(8,5,3,.88))}#story.scene #spor{display:none}#story.scene .snm{display:none}`;document.head.appendChild(css);
const scv=ov.querySelector('#scv'),sx=scv.getContext('2d'),por=ov.querySelector('#spor'),px=por.getContext('2d');
let cur=null,idx=0,cb=null,shown=0,full='',run=false,t0=0,seen=null;
function play(key,done,seenArr){const S=L[key];seen=seenArr||seen;if(!S){if(done)done();return;}if(seen&&!seen.includes(key))seen.push(key);cur=S;idx=0;cb=done;ov.style.display='block';ov.querySelector('.stitle').textContent=S.t;show();if(!run){run=true;requestAnimationFrame(loop);}}
function show(){const l=cur.l[idx];full=l.x;shown=0;t0=performance.now();ov.classList.toggle('scene',!!l.s);
 if(l.w){const[w,k]=WHO[l.w];ov.querySelector('.snm').textContent=w;drawPortrait(k);}ov.querySelector('.stt').textContent='';}
function next(){if(!cur)return;if(shown<full.length){shown=full.length;ov.querySelector('.stt').textContent=full;return;}idx++;if(idx>=cur.l.length)return end();show();}
function end(){ov.style.display='none';run=false;cur=null;const f=cb;cb=null;if(f)f();}
ov.addEventListener('pointerdown',e=>{if(e.target.classList.contains('sskip')){end();return;}next();});
addEventListener('keydown',e=>{if(cur&&(e.key===' '||e.key==='Enter')){e.preventDefault();next();}});
function drawPortrait(k){px.clearRect(0,0,180,180);const pi=window.G3&&G3.portrait&&G3.portrait(k);if(pi){px.drawImage(pi,0,0,180,180);return;}px.save();
 if(['guerrier','mage','rodeuse'].includes(k)){px.translate(90,150);px.scale(1,1);VR.drawHeroCls(px,0,0,170,k,{face:Math.PI/2,walk:0,swing:0,swingA:0,spin:0,iframe:0,wcol:'#ddd',wr:0,t:0});}
 else if(k==='borin'){VR.drawMerch(px,90,140,150,0);}
 else{const save=VD.P;VD.P={x:0,y:-3};try{VR.drawDragon(px,{el:k,r:1.05,ph:1,fl:0,x:0,y:0},90,205,62);}finally{VD.P=save;}}
 px.restore();}
/* ---------- scènes illustrées ---------- */
function loop(t){if(!run)return;const W=scv.width=innerWidth,H=scv.height=innerHeight,l=cur&&cur.l[idx];
 if(l&&shown<full.length){shown=Math.min(full.length,Math.floor((t-t0)/22));ov.querySelector('.stt').textContent=full.slice(0,shown);}
 sx.clearRect(0,0,W,H);if(l&&l.s)scene(l.s,W,H,t/1000);requestAnimationFrame(loop);}
function stars(W,H,t){for(let i=0;i<90;i++){const x=(i*137.5)%W,y=(i*71.3)%(H*.55),a=.4+.4*Math.sin(t*2+i);sx.fillStyle=`rgba(255,250,230,${a})`;sx.fillRect(x,y,1.6,1.6);}}
function village(W,H,glow){const g=sx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#05060f');g.addColorStop(.6,'#1a1424');g.addColorStop(1,'#0a0606');sx.fillStyle=g;sx.fillRect(0,0,W,H);
 sx.fillStyle='#0b0a0e';sx.beginPath();sx.moveTo(0,H*.62);const hs=[[.0,.58],[.06,.5],[.1,.56],[.16,.47],[.22,.55],[.27,.44],[.31,.54],[.68,.52],[.72,.45],[.78,.55],[.84,.48],[.9,.56],[.95,.5],[1,.57]];
 hs.forEach(([x,y])=>sx.lineTo(x*W,y*H));sx.lineTo(W,H);sx.lineTo(0,H);sx.fill();
 [[.08,.54],[.19,.5],[.29,.5],[.75,.5],[.87,.52]].forEach(([x,y],i)=>{sx.fillStyle=glow>0?`rgba(255,190,90,${glow*(.6+.4*Math.sin(i))})`:'#151217';sx.fillRect(x*W,y*H,6,8);});}
function well(W,H,t,k){const cx=W/2,cy=H*.66,rw=Math.min(W*.32,180),rh=rw*.32;
 const gl=sx.createRadialGradient(cx,cy,0,cx,cy,rw*2.6);gl.addColorStop(0,`rgba(255,120,30,${.25*k})`);gl.addColorStop(1,'rgba(255,60,0,0)');sx.fillStyle=gl;sx.fillRect(0,0,W,H);
 sx.fillStyle='#000';sx.beginPath();sx.ellipse(cx,cy,rw,rh,0,0,TAU);sx.fill();
 const ig=sx.createRadialGradient(cx,cy,0,cx,cy,rw);ig.addColorStop(0,`rgba(255,${130+60*Math.sin(t*2)|0},40,${.85*k})`);ig.addColorStop(1,'rgba(80,10,0,0)');sx.fillStyle=ig;sx.beginPath();sx.ellipse(cx,cy,rw*.92,rh*.85,0,0,TAU);sx.fill();
 sx.strokeStyle='#4a4250';sx.lineWidth=rh*.45;sx.beginPath();sx.ellipse(cx,cy,rw,rh,0,0,TAU);sx.stroke();sx.strokeStyle='#6a6272';sx.lineWidth=2;sx.beginPath();sx.ellipse(cx,cy-rh*.18,rw,rh,0,Math.PI,TAU);sx.stroke();
 for(let i=0;i<12;i++){const a=i/12*TAU;sx.fillStyle=`rgba(255,180,90,${.3+.3*Math.sin(t*3+i)})`;sx.font='12px serif';sx.fillText('ᚱᚢᚾ'[i%3],cx+Math.cos(a)*rw*.98-4,cy+Math.sin(a)*rh*.98+4);}
 if(k>0)for(let i=0;i<40;i++){const p=((t*.25+i*.37)%1),x=cx+Math.sin(i*12.9+t)*rw*.6,y=cy-p*H*.6;sx.fillStyle=`rgba(255,${140+i*2},60,${(1-p)*.8})`;sx.fillRect(x,y,2.2,2.2);}}
function dragonSil(x,y,s,a,col){sx.save();sx.translate(x,y);sx.rotate(a);sx.scale(s,s);sx.fillStyle=col;sx.beginPath();sx.moveTo(0,-30);[-1,1].forEach(d=>{sx.lineTo(d*60,-40);sx.lineTo(d*90,-10);sx.lineTo(d*40,0);});sx.lineTo(0,40);sx.closePath();sx.fill();sx.beginPath();sx.ellipse(0,0,10,26,0,0,TAU);sx.fill();sx.restore();}
function scene(k,W,H,t){
 if(k==='village'){village(W,H,1);stars(W,H,t);sx.fillStyle='#e8e0c8';sx.beginPath();sx.arc(W*.8,H*.16,26,0,TAU);sx.fill();sx.fillStyle='#1a1424';sx.beginPath();sx.arc(W*.8+9,H*.16-5,24,0,TAU);sx.fill();well(W,H,t,.25);}
 else if(k==='fondateurs'){const g=sx.createRadialGradient(W/2,H*.62,0,W/2,H*.62,H);g.addColorStop(0,'#2a0f08');g.addColorStop(1,'#000');sx.fillStyle=g;sx.fillRect(0,0,W,H);
  const cols=['#7d1813','#2f5f88','#3e4a22','#5b2079'];for(let i=0;i<4;i++){const a=t*.5+i*TAU/4,r=Math.min(W,H)*.22*(1-((t*.05)%1)*.3);dragonSil(W/2+Math.cos(a)*r,H*.48+Math.sin(a)*r*.45,.9,a+Math.PI/2,cols[i]);}
  sx.fillStyle='#000';sx.beginPath();sx.ellipse(W/2,H*.62,Math.min(W*.3,170),40,0,0,TAU);sx.fill();for(let i=0;i<4;i++){sx.fillStyle='#c9b48a';sx.fillRect(W/2-45+i*30,H*.62-62,4,14);sx.beginPath();sx.arc(W/2-43+i*30,H*.62-66,3,0,TAU);sx.fill();}}
 else if(k==='souffle'){village(W,H,Math.max(0,1-((t*.3)%1.4)));stars(W,H,t);well(W,H,t,1);}
 else if(k==='heritiers'){village(W,H,0);stars(W,H,t);well(W,H,t,.9);const y=H*.76,s=Math.min(W/4.5,130);[['mage',-1],['guerrier',0],['rodeuse',1]].forEach(([c,o])=>VR.drawHeroCls(sx,W/2+o*s*.9,y+(o?0:-8),s,c,{face:-Math.PI/2,walk:t*.2,swing:0,swingA:0,spin:0,iframe:0,wcol:'#ddd',wr:0,t}));}
 else if(k==='coeur'){sx.fillStyle='#03030a';sx.fillRect(0,0,W,H);const cx=W/2,cy=H*.42,b=1+.08*Math.sin(t*2.2)+.04*Math.sin(t*4.4);
  for(let i=0;i<3;i++){sx.strokeStyle=`rgba(180,140,255,${.25-i*.07})`;sx.lineWidth=2;sx.beginPath();sx.ellipse(cx,cy+60,180+i*40,50+i*12,0,0,TAU);sx.stroke();}
  const g=sx.createRadialGradient(cx,cy,0,cx,cy,140*b);g.addColorStop(0,'rgba(255,220,240,.95)');g.addColorStop(.25,'rgba(220,90,160,.7)');g.addColorStop(.6,'rgba(90,30,120,.35)');g.addColorStop(1,'rgba(0,0,0,0)');sx.fillStyle=g;sx.beginPath();sx.arc(cx,cy,140*b,0,TAU);sx.fill();
  for(let i=0;i<24;i++){const a=i/24*TAU+t*.1;sx.fillStyle='rgba(200,170,255,.6)';sx.font='14px serif';sx.fillText('ᚠᚢᚦᚨᚱᚲ'[i%6],cx+Math.cos(a)*200-5,cy+60+Math.sin(a)*55+5);}
  const y=H*.74,s=Math.min(W/5,110);[['mage',-1],['guerrier',0],['rodeuse',1]].forEach(([c,o])=>VR.drawHeroCls(sx,cx+o*s*.9,y,s,c,{face:-Math.PI/2,walk:0,swing:0,swingA:0,spin:0,iframe:0,wcol:'#ddd',wr:0,t}));}}
function journal(arr){const order=['prologue','biome0','pre0','post0','biome1','pre1','post1','biome2','pre2','post2','biome3','pre3','post3','epilogue'];
 const got=order.filter(k=>arr&&arr.includes(k));if(!got.length)return'<p class="small">Rien encore.</p>';
 return got.map(k=>`<div class="det"><h3 style="font-size:16px;color:#f0c46a">${L[k].t}</h3>${L[k].l.map(l=>`<p>${l.w?'<b>'+WHO[l.w][0]+'</b> : ':''}${l.w?'« '+l.x+' »':'<i>'+l.x+'</i>'}</p>`).join('')}<button class="b2" data-replay="${k}">Revoir</button></div>`).join('');}
return{play,journal,has:k=>!!L[k],get active(){return!!cur;}};
})();
