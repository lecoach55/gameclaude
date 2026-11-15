'use strict';
/* =========================================================
   BANNIÈRES & SORTILÈGES — décor peint : sol de la carte, reliefs, forêts, villes, mines, lieux,
   panoramas de ville et champs de bataille. Tout est généré puis mis en cache.
   ========================================================= */
var PX=32; // résolution du sol (pixels par case)
var TS=64; // résolution des sprites (pixels par case)
var PAL={
 herbe:[[46,84,30],[78,118,44],[118,152,64]],terre:[[88,64,40],[122,92,58],[156,124,84]],rude:[[104,90,62],[140,122,86],[176,158,116]],
 neige:[[176,192,212],[214,226,238],[246,250,255]],sable:[[188,150,84],[214,182,112],[236,212,150]],marais:[[44,58,36],[66,80,46],[92,104,58]],
 lave:[[30,22,22],[54,36,32],[80,52,40]]};
function texBruit(seed,octaves=[8,16,32,64],poids=[.5,.25,.15,.1]){const T=new Float32Array(65536);const r=creeRng(seed);
 octaves.forEach((p,o)=>{const L=new Float32Array(p*p);for(let i=0;i<p*p;i++)L[i]=r.f();const cs=256/p;
  for(let y=0;y<256;y++){const gy=y/cs,y0=Math.floor(gy),fy=gy-y0,sy=fy*fy*(3-2*fy);for(let x=0;x<256;x++){const gx=x/cs,x0=Math.floor(gx),fx=gx-x0,sx=fx*fx*(3-2*fx);
   const a=L[(y0%p)*p+x0%p],b=L[(y0%p)*p+(x0+1)%p],c=L[((y0+1)%p)*p+x0%p],d=L[((y0+1)%p)*p+(x0+1)%p];T[y*256+x]+=poids[o]*(a+(b-a)*sx+(c-a)*sy+(a-b-c+d)*sx*sy);}}});
 return T;}
var TEXS=null;function textures(){return TEXS||(TEXS=[texBruit(11),texBruit(23,[16,32,64,128],[.4,.3,.2,.1]),texBruit(37,[64,128],[.5,.5])]);}

function champSigne(c){// distance signée à l'eau, en cases (positive dans l'eau)
 const N=c.N,eau=i=>c.ter[i]===EAU;const D=new Float32Array(N*N).fill(1e9);const q=[];
 for(let i=0;i<N*N;i++){const x=i%N,y=(i/N)|0;let bord=false;for(const [dx,dy] of DIR8){const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<N&&ny<N&&eau(ny*N+nx)!==eau(i)){bord=true;break;}}if(bord){D[i]=.5;q.push(i);}}
 for(let h=0;h<q.length;h++){const i=q[h];const x=i%N,y=(i/N)|0;for(const [dx,dy] of DIR8){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=N||ny>=N)continue;const j=ny*N+nx;if(eau(j)!==eau(i))continue;const nd=D[i]+(dx&&dy?1.41:1);if(nd<D[j]){D[j]=nd;q.push(j);}}}
 for(let i=0;i<N*N;i++){if(D[i]>=1e9)D[i]=N;if(!eau(i))D[i]=-D[i];}return D;}

function peindreSol(c,objs){const N=c.N,W=N*PX;const cv=mkC(W,W);const g=cv.getContext('2d');const img=g.createImageData(W,W);const d=img.data;const [T1,T2,T3]=textures();const SD=champSigne(c);
 const terN=c.ter.map(t=>TER[t]);
 const sd=(fx,fy)=>{fx=Math.max(0,Math.min(N-1.001,fx));fy=Math.max(0,Math.min(N-1.001,fy));const x0=Math.floor(fx),y0=Math.floor(fy),ax=fx-x0,ay=fy-y0;const x1=Math.min(N-1,x0+1),y1=Math.min(N-1,y0+1);
  return SD[y0*N+x0]*(1-ax)*(1-ay)+SD[y0*N+x1]*ax*(1-ay)+SD[y1*N+x0]*(1-ax)*ay+SD[y1*N+x1]*ax*ay;};
 for(let py=0;py<W;py++){const fy=py/PX;for(let px=0;px<W;px++){const fx=px/PX;const o=(py*W+px)*4;
   const a1=T1[((py>>1)&255)*256+((px>>1)&255)],a2=T2[(py&255)*256+(px&255)],a3=T3[((py*3)&255)*256+((px*3)&255)];
   const w=sd(fx-.5,fy-.5)+(a1-.5)*.9+(a2-.5)*.25;let R,Gc,B;
   if(w>0){// eau
    const p=Math.min(1,w/3.2);R=58-36*p;Gc=132-66*p;B=164-50*p;const rip=(a2-.5)*28+Math.sin((px+py*.4)*.18+a1*9)*4;R+=rip*.5;Gc+=rip;B+=rip;
    if(w<.22){const f=1-w/.22;R+=(232-R)*f*.75;Gc+=(240-Gc)*f*.75;B+=(236-B)*f*.75;}
   }else{
    const wx=fx+(a1-.5)*1.1,wy=fy+(T1[((px>>1)&255)*256+((py>>1)&255)]-.5)*1.1;const tx=Math.max(0,Math.min(N-1,Math.floor(wx))),ty=Math.max(0,Math.min(N-1,Math.floor(wy)));
    let t=terN[ty*N+tx];if(t==='eau')t=terN[Math.min(N-1,Math.floor(fy))*N+Math.min(N-1,Math.floor(fx))];if(t==='eau')t='sable';
    const P=PAL[t];const v=Math.min(.999,Math.max(0,a1*.7+a2*.5-.1));const k=v*2,i0=Math.min(1,Math.floor(k)),f=k-i0;
    R=P[i0][0]+(P[i0+1][0]-P[i0][0])*f;Gc=P[i0][1]+(P[i0+1][1]-P[i0][1])*f;B=P[i0][2]+(P[i0+1][2]-P[i0][2])*f;
    const grain=.86+a3*.28;R*=grain;Gc*=grain;B*=grain;
    // relief : lumière venant du haut à gauche
    const hs=(T1[(((py>>1)-2)&255)*256+(((px>>1)-2)&255)]-T1[(((py>>1)+2)&255)*256+(((px>>1)+2)&255)])*(t==='neige'?260:170);R+=hs;Gc+=hs;B+=hs*(t==='neige'?1.2:.8);
    if(t==='herbe'){if(a3>.93&&a2>.55){const fl=(px*7+py*13)%3;R=fl===0?235:fl===1?240:200;Gc=fl===0?220:fl===1?240:70;B=fl===0?90:fl===1?240:70;}else if(a2<.3){R*=.82;Gc*=.88;B*=.8;}}
    else if(t==='sable'){const s=Math.sin(px*.21+py*.09+a1*14)*9;R+=s;Gc+=s;B+=s*.7;}
    else if(t==='lave'){const cr=Math.abs(a2-.5);if(cr<.018){const f2=1-cr/.018;R+=(255-R)*f2;Gc+=(120-Gc)*f2;B+=(30-B)*f2*.5;}else if(cr<.04){R+=50*(1-cr/.04);Gc+=12*(1-cr/.04);}}
    else if(t==='marais'){if(a2>.66){const f2=Math.min(1,(a2-.66)*12);R+=(40-R)*f2;Gc+=(62-Gc)*f2;B+=(58-B)*f2;}}
    else if((t==='rude'||t==='terre')&&a3>.92){R=R*.7+60;Gc=Gc*.7+58;B=B*.7+56;}
    else if(t==='neige'&&a3>.96){R=255;Gc=255;B=255;}
    if(w>-.35){const f2=(w+.35)/.35;R+=(150-R)*f2*.45;Gc+=(130-Gc)*f2*.45;B+=(90-B)*f2*.45;}// rive humide
   }
   d[o]=R;d[o+1]=Gc;d[o+2]=B;d[o+3]=255;}}
 g.putImageData(img,0,0);
 // rivières décoratives : des montagnes vers le lac le plus proche (ou le bord), en contournant villes et objets
 if(objs)rivieres(g,c,objs);
 // routes
 const rt=i=>c.route[i]&&c.ter[i]!==EAU;g.lineCap='round';g.lineJoin='round';
 const segs=[];if(c.routeSeg)for(const [a,b] of c.routeSeg){if(rt(a)&&rt(b))segs.push([a%N,(a/N)|0,b%N,(b/N)|0]);}
 else for(let i=0;i<N*N;i++){if(!rt(i))continue;const x=i%N,y=(i/N)|0;const orth=[[1,0],[0,1]],dia=[[1,1],[-1,1]];for(const [dx,dy] of orth){const nx=x+dx,ny=y+dy;if(nx<N&&ny<N&&rt(ny*N+nx))segs.push([x,y,nx,ny]);}
  for(const [dx,dy] of dia){const nx=x+dx,ny=y+dy;if(nx<0||nx>=N||ny>=N||!rt(ny*N+nx))continue;if(rt(y*N+nx)||rt(ny*N+x))continue;segs.push([x,y,nx,ny]);}}
 for(const [w2,col] of [[PX*.46,'rgba(70,48,24,.55)'],[PX*.36,'#a07a4c'],[PX*.22,'#bc966a']]){g.lineWidth=w2;g.strokeStyle=col;g.beginPath();for(const [a,b,c2,d2] of segs){g.moveTo((a+.5)*PX,(b+.5)*PX);g.lineTo((c2+.5)*PX,(d2+.5)*PX);}g.stroke();}
 const r=creeRng(5);g.fillStyle='rgba(90,70,50,.55)';for(const [a,b,c2,d2] of segs)for(let k=0;k<3;k++){const t=r.f();g.beginPath();g.arc((a+.5+(c2-a)*t)*PX+(r.f()-.5)*PX*.25,(b+.5+(d2-b)*t)*PX+(r.f()-.5)*PX*.25,1.2,0,7);g.fill();}
 return cv;}

function rivieres(g,c,objs){const N=c.N,r=creeRng((c.ter.length*7+N)*13+(c.graine||0));const occ=new Uint8Array(N*N);for(const o of objs){for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const x=o.x+dx,y=o.y+dy;if(x>=0&&y>=0&&x<N&&y<N)occ[y*N+x]=o.t==='ville'?2:1;}}
 const nb=Math.max(1,Math.round(N/18));const eau=i=>c.ter[i]===EAU;const nz=bruit(r.i(1,1e9));
 for(let k=0;k<nb;k++){// source : case libre au pied d'une montagne
  let src=-1;for(let t=0;t<400&&src<0;t++){const x=r.i(2,N-3),y=r.i(2,N-3),i=y*N+x;if(c.obs[i]||eau(i)||occ[i])continue;if(DIR8.some(([dx,dy])=>{const j=(y+dy)*N+x+dx;return c.obs[j]===OBS.MONT||c.obs[j]===OBS.MONTP;}))src=i;}
  if(src<0)continue;
  // cible : eau la plus proche, sinon le bord
  let dst=-1,bd=1e9;const sx=src%N,sy=(src/N)|0;for(let i=0;i<N*N;i++){const x=i%N,y=(i/N)|0;const bord=x===0||y===0||x===N-1||y===N-1;if(!eau(i)&&!bord)continue;const d=Math.hypot(x-sx,y-sy);if(d<bd&&d>6){bd=d;dst=i;}}
  if(dst<0||bd>N*.6)continue;
  const ch=aEtoile(N,src,dst,j=>occ[j]===2?Infinity:occ[j]?40:(c.route[j]?6:1)+(c.obs[j]?1.5:0)+nz((j%N)/3,((j/N)|0)/3)*4);if(!ch||ch.length<6)continue;
  const pts=ch.map(i=>[(i%N+.5+(nz(i%N,(i/N)|0)-.5)*.5)*PX,(((i/N)|0)+.5+(nz((i/N)|0,i%N)-.5)*.5)*PX]);
  const trace=(lw,col)=>{g.beginPath();g.moveTo(pts[0][0],pts[0][1]);for(let p=1;p<pts.length-1;p++){const mx=(pts[p][0]+pts[p+1][0])/2,my=(pts[p][1]+pts[p+1][1])/2;g.quadraticCurveTo(pts[p][0],pts[p][1],mx,my);}g.lineTo(pts[pts.length-1][0],pts[pts.length-1][1]);g.lineWidth=lw;g.strokeStyle=col;g.lineCap='round';g.lineJoin='round';g.stroke();};
  trace(PX*.42,'rgba(60,46,28,.55)');trace(PX*.32,'#3f7fa6');trace(PX*.2,'#5aa0c4');g.setLineDash([PX*.18,PX*.35]);trace(PX*.05,'rgba(230,245,255,.7)');g.setLineDash([]);
  // ponts sur les routes
  for(const i of ch)if(c.route[i]){const x=(i%N+.5)*PX,y=(((i/N)|0)+.5)*PX;g.fillStyle='#8a6238';g.strokeStyle='rgba(40,24,10,.8)';g.lineWidth=1.5;g.beginPath();g.rect(x-PX*.32,y-PX*.26,PX*.64,PX*.52);g.fill();g.stroke();g.strokeStyle='rgba(60,36,14,.6)';for(let p=-2;p<=2;p++){g.beginPath();g.moveTo(x-PX*.32,y+p*PX*.1);g.lineTo(x+PX*.32,y+p*PX*.1);g.stroke();}}
 }}
// ---------- végétation et reliefs ----------
function arbreFeuillu(g,x,y,s,r,c){trait(g,[x,y,x+(r.f()-.5)*2,y-14*s],'#5a3a1e',3.2*s);const base=c||'#3f7a2a';
 for(const [dx,dy,rr] of [[-7,-18,9],[7,-18,9],[0,-26,10],[-3,-14,8],[5,-12,7]])boule(g,x+dx*s,y+dy*s,rr*s,teinte(base,(r.f()-.5)*.25),{lw:1.1});}
function sapin(g,x,y,s,neige){trait(g,[x,y,x,y-6*s],'#4a2e18',3*s);for(let k=0;k<3;k++){const yy=y-6*s-k*8*s,w=(13-k*3.4)*s;peint(g,poly([x-w,yy,x,yy-14*s,x+w,yy]),'#2c5a34',{y0:yy-14*s,y1:yy,lw:1.1});if(neige){g.fillStyle='rgba(250,252,255,.92)';g.beginPath();g.moveTo(x-w*.6,yy-5*s);g.lineTo(x,yy-14*s);g.lineTo(x+w*.5,yy-6*s);g.quadraticCurveTo(x,yy-9*s,x-w*.6,yy-5*s);g.fill();}}}
function palmier(g,x,y,s){g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+6*s,y-14*s,x+2*s,y-30*s);g.lineWidth=4*s;g.strokeStyle=TRAIT;g.stroke();g.lineWidth=2.8*s;g.strokeStyle='#8a6a3a';g.stroke();
 for(const a of [-2.6,-2,-1.3,-.6,0]){g.beginPath();g.moveTo(x+2*s,y-30*s);g.quadraticCurveTo(x+2*s+Math.cos(a)*10*s,y-36*s+Math.sin(a)*4*s,x+2*s+Math.cos(a)*16*s,y-26*s+Math.sin(a)*8*s);g.lineWidth=3.2*s;g.strokeStyle='#2f6a2a';g.stroke();}}
function arbreMort(g,x,y,s,col){trait(g,[x,y,x,y-20*s],col,3.2*s);trait(g,[x,y-12*s,x-8*s,y-22*s],col,2*s);trait(g,[x,y-16*s,x+9*s,y-26*s],col,2*s);trait(g,[x,y-20*s,x-2*s,y-30*s],col,1.6*s);}
function cactus(g,x,y,s){peint(g,rrect(x-3*s,y-24*s,6*s,24*s,3*s),'#4a8a3a');peint(g,rrect(x-10*s,y-18*s,4*s,10*s,2*s),'#4a8a3a');peint(g,rrect(x+6*s,y-20*s,4*s,9*s,2*s),'#4a8a3a');}
function rocher(g,x,y,s,col,neige,lave){const pts=[x-12*s,y,x-10*s,y-9*s,x-3*s,y-15*s,x+6*s,y-13*s,x+12*s,y-5*s,x+11*s,y];peint(g,poly(pts),col,{y0:y-15*s,y1:y,pierre:.12});
 g.fillStyle=rgba('#ffffff',.18);g.beginPath();g.moveTo(x-9*s,y-8*s);g.lineTo(x-3*s,y-14*s);g.lineTo(x,y-6*s);g.closePath();g.fill();
 if(neige){g.fillStyle='rgba(250,252,255,.95)';g.beginPath();g.moveTo(x-10*s,y-9*s);g.lineTo(x-3*s,y-15*s);g.lineTo(x+6*s,y-13*s);g.quadraticCurveTo(x,y-9*s,x-10*s,y-9*s);g.fill();}
 if(lave){g.strokeStyle='#ff7a2a';g.lineWidth=1.2;g.shadowColor='#ff5a1a';g.shadowBlur=5;g.beginPath();g.moveTo(x-6*s,y-3*s);g.lineTo(x-1*s,y-8*s);g.lineTo(x+4*s,y-4*s);g.stroke();g.shadowBlur=0;}}
function spriteObstacle(kind,ter,v){const k='o'+kind+ter+v;if(SPR_CACHE[k])return SPR_CACHE[k];const r=creeRng(v*31+kind*7+TER.indexOf(ter)*101);
 let c;if(kind===OBS.MONT){c=mkC(TS*2.2,TS*2.6);const g=c.getContext('2d');const w=c.width,h=c.height,base=h-4;
  const col={neige:'#9aa6b6',sable:'#b07a48',lave:'#4a3430',marais:'#5a5a48',terre:'#7a6650',rude:'#8a7a62',herbe:'#7a7a6a'}[ter];
  ombreSol(g,w/2,base-6,w*.48,TS*.25,.4);
  const pics=[];const np=r.i(2,3);for(let i=0;i<np;i++)pics.push([w*(.22+.56*i/(np-1||1))+(r.f()-.5)*14,base-TS*(1.3+r.f()*.8)]);pics.sort((a,b)=>b[1]-a[1]);
  for(const [px,py] of pics){const lw=TS*(.55+r.f()*.25);
   g.beginPath();g.moveTo(px-lw,base-2);g.lineTo(px-lw*.45,py+TS*.35);g.lineTo(px,py);g.lineTo(px+lw*.5,py+TS*.4);g.lineTo(px+lw,base-2);g.closePath();
   const gr=g.createLinearGradient(px-lw,0,px+lw,0);gr.addColorStop(0,teinte(col,.25));gr.addColorStop(.48,teinte(col,.05));gr.addColorStop(.52,teinte(col,-.3));gr.addColorStop(1,teinte(col,-.5));g.fillStyle=gr;g.fill();g.lineWidth=1.8;g.strokeStyle=TRAIT;g.stroke();
   g.strokeStyle=rgba('#000000',.25);g.lineWidth=1.2;for(let k2=0;k2<4;k2++){g.beginPath();g.moveTo(px+(r.f()-.3)*lw*.4,py+TS*(.2+k2*.25));g.lineTo(px+(r.f()-.2)*lw*.8,py+TS*(.5+k2*.3));g.stroke();}
   if(ter==='neige'||r.f()<.35&&ter!=='lave'&&ter!=='sable'){g.fillStyle='rgba(248,250,255,.95)';g.beginPath();g.moveTo(px-lw*.3,py+TS*.28);g.lineTo(px,py);g.lineTo(px+lw*.32,py+TS*.3);g.lineTo(px+lw*.12,py+TS*.22);g.lineTo(px,py+TS*.34);g.lineTo(px-lw*.12,py+TS*.22);g.closePath();g.fill();}
   if(ter==='lave'){g.save();g.shadowColor='#ff6a1a';g.shadowBlur=12;g.fillStyle='#ff8a2a';g.beginPath();g.ellipse(px,py+3,6,3,0,0,7);g.fill();g.strokeStyle='#ff6a1a';g.lineWidth=2;g.beginPath();g.moveTo(px,py+4);g.quadraticCurveTo(px+6,py+TS*.5,px+2,py+TS*.9);g.stroke();g.restore();}}
  for(let k2=0;k2<3;k2++)rocher(g,w*(.2+.3*k2)+(r.f()-.5)*10,base-2,.8+r.f()*.4,teinte(col,-.1),ter==='neige',ter==='lave');
 }else{c=mkC(TS*1.3,TS*1.7);const g=c.getContext('2d');const cx=c.width/2,base=c.height-TS*.18;
  if(kind===OBS.ROC){ombreSol(g,cx,base-2,TS*.42,TS*.12,.35);const col={neige:'#8c96a4',sable:'#b58a5a',lave:'#3a2c2a',marais:'#5a5c4a',terre:'#7a6a58',rude:'#8a8070',herbe:'#7e7e74'}[ter];
   rocher(g,cx-8+r.f()*6,base,1.1+r.f()*.5,col,ter==='neige',ter==='lave');if(r.f()<.6)rocher(g,cx+12,base+2,.6+r.f()*.3,teinte(col,-.08),ter==='neige',ter==='lave');}
  else{ombreSol(g,cx,base-3,TS*.5,TS*.16,.38);const n=r.i(2,4);const pos=[];for(let i=0;i<n;i++)pos.push([cx+(r.f()-.5)*TS*.62,base-r.f()*TS*.32]);pos.sort((a,b)=>a[1]-b[1]);
   for(const [x,y] of pos){const s=.85+r.f()*.4;
    if(ter==='neige')sapin(g,x,y,s,true);else if(ter==='sable')(r.f()<.5?palmier:cactus)(g,x,y,s);else if(ter==='marais')r.f()<.6?arbreMort(g,x,y,s,'#3a3424'):arbreFeuillu(g,x,y,s*.9,r,'#3a5a2a');
    else if(ter==='lave')arbreMort(g,x,y,s,'#1a1210');else if(ter==='terre')r.f()<.45?arbreMort(g,x,y,s,'#4a3420'):arbreFeuillu(g,x,y,s,r,'#6a7a2a');
    else if(ter==='rude')r.f()<.5?sapin(g,x,y,s*.9,false):arbreFeuillu(g,x,y,s,r,'#5a7a30');else(r.f()<.25?sapin(g,x,y,s,false):arbreFeuillu(g,x,y,s,r));}}}
 SPR_CACHE[k]=c;return c;}

// ---------- villes sur la carte ----------
function tourelle(g,x,y,w,h,mur,toit,forme){peint(g,rrect(x-w/2,y-h,w,h,2),mur,{pierre:(g.canvas.height>500?.4:.22),y0:y-h,y1:y});g.strokeStyle='rgba(0,0,0,.25)';g.lineWidth=1;for(let k=1;k<h/8;k++){g.beginPath();g.moveTo(x-w/2,y-k*8);g.lineTo(x+w/2,y-k*8);g.stroke();}
 g.fillStyle='#1a1410';g.fillRect(x-2,y-h*.6,4,7);
 if(forme==='cone')peint(g,poly([x-w/2-3,y-h,x,y-h-w*1.3,x+w/2+3,y-h]),toit,{y0:y-h-w*1.3,y1:y-h});
 else if(forme==='fleche')peint(g,poly([x-w/2-2,y-h,x,y-h-w*2.2,x+w/2+2,y-h]),toit,{y0:y-h-w*2.2,y1:y-h});
 else{for(let k=0;k<3;k++)peint(g,rrect(x-w/2+k*w/3,y-h-5,w/3-2,6,1),mur,{pierre:(g.canvas.height>500?.4:.22)});}}
function spriteVille(fac){const k='v'+fac;if(SPR_CACHE[k])return SPR_CACHE[k];const W=TS*3.2,H=TS*3.4;const c=mkC(W,H);const g=c.getContext('2d');const F=FAC[fac].coul;const cx=W/2,base=H-TS*.15;
 ombreSol(g,cx,base-TS*.4,W*.48,TS*.5,.45);
 if(fac==='sylve'){// palissade, maisons dans les arbres
  for(const [x,s] of [[cx-TS*1.1,1.3],[cx+TS*1.15,1.25],[cx,1.6]]){trait(g,[x,base-TS*.8,x,base-TS*1.9*s],'#6a4a2a',9);for(const [dx,dy,rr] of [[-20,-2,22],[20,-4,22],[0,-22,26],[-10,8,16],[12,8,16]])boule(g,x+dx,base-TS*1.9*s+dy,rr,teinte('#3f7a34',(dx%3)*.05));}
  for(const [x,y,w] of [[cx-TS*1.1,base-TS*1.5,30],[cx+TS*1.15,base-TS*1.45,30],[cx,base-TS*2.1,36]]){peint(g,rrect(x-w/2,y,w,w*.7,3),'#9a7448');peint(g,poly([x-w/2-5,y,x,y-w*.6,x+w/2+5,y]),F.toit);g.fillStyle='#ffd87a';g.fillRect(x-3,y+6,6,7);}
  for(let x=cx-W*.44;x<cx+W*.44;x+=7){if(Math.abs(x-cx)<TS*.36)continue;peint(g,poly([x,base-TS*.15,x,base-TS*.75,x+3.5,base-TS*.9,x+7,base-TS*.75,x+7,base-TS*.15]),'#8a6238',{y0:base-TS*.9,y1:base});}
  peint(g,g2=>{g2.moveTo(cx-TS*.34,base-TS*.15);g2.lineTo(cx-TS*.34,base-TS*.7);g2.quadraticCurveTo(cx,base-TS*1.05,cx+TS*.34,base-TS*.7);g2.lineTo(cx+TS*.34,base-TS*.15);g2.closePath();},'#5a3a1a');
 }else{
  const mur=F.mur,toit=F.toit,forme=fac==='necro'?'fleche':'cone';
  // donjon
  const dw=TS*.95,dh=TS*1.55;peint(g,rrect(cx-dw/2,base-TS*.4-dh,dw,dh,3),teinte(mur,-.05),{pierre:(g.canvas.height>500?.4:.22),y0:base-TS*.4-dh,y1:base-TS*.4});
  for(let k=0;k<4;k++){g.fillStyle='#1a1410';g.fillRect(cx-dw/2+8+k*(dw-16)/3-2,base-TS*.4-dh+16,4,9);}
  peint(g,poly([cx-dw/2-6,base-TS*.4-dh,cx,base-TS*.4-dh-TS*(fac==='necro'?1.5:1),cx+dw/2+6,base-TS*.4-dh]),toit,{y0:base-TS*2.9,y1:base-TS*1.9});
  tourelle(g,cx-dw/2-4,base-TS*.6,TS*.36,TS*1.2,mur,toit,forme);tourelle(g,cx+dw/2+4,base-TS*.6,TS*.36,TS*1.25,mur,toit,forme);
  // remparts
  peint(g,rrect(cx-W*.42,base-TS*.95,W*.84,TS*.8,2),mur,{pierre:(g.canvas.height>500?.4:.22),y0:base-TS*.95,y1:base-TS*.15});
  for(let x=cx-W*.42;x<cx+W*.42-6;x+=11)peint(g,rrect(x,base-TS*1.05,7,10,1),mur,{pierre:(g.canvas.height>500?.4:.22)});
  g.strokeStyle='rgba(0,0,0,.22)';g.lineWidth=1;for(let y=base-TS*.85;y<base-TS*.2;y+=8){g.beginPath();g.moveTo(cx-W*.42,y);g.lineTo(cx+W*.42,y);g.stroke();}
  tourelle(g,cx-W*.42,base-TS*.1,TS*.42,TS*1.05,mur,toit,forme);tourelle(g,cx+W*.42,base-TS*.1,TS*.42,TS*1.05,mur,toit,forme);
  // porte
  peint(g,g2=>{g2.moveTo(cx-TS*.3,base-TS*.15);g2.lineTo(cx-TS*.3,base-TS*.6);g2.quadraticCurveTo(cx,base-TS*.95,cx+TS*.3,base-TS*.6);g2.lineTo(cx+TS*.3,base-TS*.15);g2.closePath();},'#3a2412');
  g.strokeStyle='rgba(200,170,90,.6)';g.lineWidth=1.4;for(let x=cx-TS*.22;x<cx+TS*.25;x+=8){g.beginPath();g.moveTo(x,base-TS*.17);g.lineTo(x,base-TS*.7);g.stroke();}
  if(fac==='necro'){for(const x of [cx-W*.3,cx+W*.28,cx-W*.15]){peint(g,rrect(x-4,base-TS*.15-12,8,12,4),'#8a8690');}g.save();g.shadowColor='#7cf7a2';g.shadowBlur=14;g.fillStyle='#7cf7a2';g.beginPath();g.arc(cx,base-TS*.4-dh*.55,4,0,7);g.fill();g.restore();}
 }
 SPR_CACHE[k]=c;return c;}
function drapeau(g,x,y,coul,t,s=1){trait(g,[x,y,x,y-22*s],'#3a2a1a',1.6*s);const o=Math.sin(t*4+x)*2*s;g.beginPath();g.moveTo(x,y-22*s);g.quadraticCurveTo(x+8*s,y-24*s+o,x+15*s,y-20*s+o);g.lineTo(x+15*s,y-13*s+o);g.quadraticCurveTo(x+8*s,y-16*s+o,x,y-13*s);g.closePath();g.fillStyle=coul;g.fill();g.lineWidth=1;g.strokeStyle=TRAIT;g.stroke();}

// ---------- mines et lieux ----------
function spriteMine(res){const k='mi'+res;if(SPR_CACHE[k])return SPR_CACHE[k];const c=mkC(TS*1.6,TS*2.1);const g=c.getContext('2d');const cx=c.width/2,base=c.height-TS*.12;
 ombreSol(g,cx,base-6,TS*.7,TS*.2,.4);
 if(res==='bois'){peint(g,rrect(cx-TS*.55,base-TS*.85,TS*1.1,TS*.7,3),'#8a6238');peint(g,poly([cx-TS*.65,base-TS*.85,cx,base-TS*1.35,cx+TS*.65,base-TS*.85]),'#6a4a2a');
  g.save();g.translate(cx+TS*.5,base-TS*1.0);for(let k2=0;k2<4;k2++){g.rotate(Math.PI/2);peint(g,rrect(-2,0,4,TS*.38,1),'#c8b48a');}g.restore();boule(g,cx+TS*.5,base-TS*1.0,4,'#6a4a2a');
  for(let k2=0;k2<3;k2++)peint(g,rrect(cx-TS*.5+k2*6,base-TS*.15-k2*6,TS*.5,7,3),'#a87a48');}
 else{const col={or:'#8a7a5a',minerai:'#7a7670',mercure:'#6a7078',soufre:'#8a7a40',cristal:'#6a5a6a',gemmes:'#5a6a6a'}[res];
  peint(g,g2=>{g2.moveTo(cx-TS*.78,base-4);g2.quadraticCurveTo(cx-TS*.7,base-TS*1.5,cx,base-TS*1.6);g2.quadraticCurveTo(cx+TS*.75,base-TS*1.45,cx+TS*.78,base-4);g2.closePath();},col,{y0:base-TS*1.6,y1:base});
  g.fillStyle='#120c08';g.beginPath();g.moveTo(cx-TS*.26,base-6);g.lineTo(cx-TS*.26,base-TS*.55);g.quadraticCurveTo(cx,base-TS*.8,cx+TS*.26,base-TS*.55);g.lineTo(cx+TS*.26,base-6);g.fill();
  trait(g,[cx-TS*.28,base-6,cx-TS*.28,base-TS*.6,cx+TS*.28,base-TS*.6,cx+TS*.28,base-6],'#7a5228',4);
  if(res==='mercure'){peint(g,rrect(cx+TS*.32,base-TS*.75,TS*.3,TS*.6,3),'#9aa0aa');g.save();g.shadowColor='#bfe8ff';g.shadowBlur=10;boule(g,cx+TS*.47,base-TS*.85,5,'#d8f0ff');g.restore();}
  if(res==='cristal'||res==='gemmes'){for(let k2=0;k2<4;k2++){const x=cx-TS*.55+k2*10,h=10+k2%2*8;peint(g,poly([x-3,base-TS*1.0,x,base-TS*1.0-h,x+3,base-TS*1.0]),res==='cristal'?'#e0384a':['#3a7ae8','#3ac85a','#e83a8a','#f0d03a'][k2]);}}
  if(res==='soufre'){g.save();g.globalAlpha=.4;g.fillStyle='#f0f090';for(let k2=0;k2<3;k2++){g.beginPath();g.arc(cx-6+k2*7,base-TS*1.6-k2*7,6+k2*2,0,7);g.fill();}g.restore();}}
 g.drawImage(iconeRes(res,TS*.55),cx-TS*.85,base-TS*.5);
 SPR_CACHE[k]=c;return c;}
function spriteLieu(b,cre){const k='l'+b+(cre||'');if(SPR_CACHE[k])return SPR_CACHE[k];const c=mkC(TS*1.5,TS*1.9);const g=c.getContext('2d');const cx=c.width/2,base=c.height-TS*.15;ombreSol(g,cx,base-4,TS*.6,TS*.18,.4);
 switch(b){
 case 'moulin':peint(g,poly([cx-TS*.3,base,cx-TS*.2,base-TS*1.05,cx+TS*.2,base-TS*1.05,cx+TS*.3,base]),'#d8cbb0');peint(g,poly([cx-TS*.26,base-TS*1.05,cx,base-TS*1.35,cx+TS*.26,base-TS*1.05]),'#8a3a2a');
  g.save();g.translate(cx,base-TS*1.05);for(let a=0;a<4;a++){g.rotate(Math.PI/2+.3*(a===0));peint(g,rrect(-4,4,8,TS*.62,1),'#e8dcc0');}g.restore();boule(g,cx,base-TS*1.05,4,'#5a3a1a');peint(g,rrect(cx-5,base-16,10,16,2),'#5a3a1a');break;
 case 'puits':peint(g,rrect(cx-TS*.32,base-TS*.4,TS*.64,TS*.36,4),'#9a948a');ell(g,cx,base-TS*.4,TS*.32,TS*.1,'#2a5a7a');trait(g,[cx-TS*.28,base-TS*.4,cx-TS*.28,base-TS*.95],'#6a4a2a',3);trait(g,[cx+TS*.28,base-TS*.4,cx+TS*.28,base-TS*.95],'#6a4a2a',3);peint(g,poly([cx-TS*.4,base-TS*.9,cx,base-TS*1.2,cx+TS*.4,base-TS*.9]),'#8a3a2a');break;
 case 'autel':peint(g,rrect(cx-TS*.36,base-TS*.4,TS*.72,TS*.38,2),'#a8a296');peint(g,rrect(cx-TS*.42,base-TS*.48,TS*.84,TS*.1,2),'#bcb6aa');g.save();g.shadowColor='#ffb03a';g.shadowBlur=16;for(let k2=0;k2<3;k2++){g.fillStyle=['#ff6a1a','#ffb03a','#fff0a0'][k2];g.beginPath();g.moveTo(cx-10+k2*4,base-TS*.48);g.quadraticCurveTo(cx,base-TS*(1.05-k2*.15),cx+10-k2*4,base-TS*.48);g.fill();}g.restore();break;
 case 'pierre':peint(g,poly([cx-TS*.22,base,cx-TS*.18,base-TS*1.1,cx+TS*.05,base-TS*1.25,cx+TS*.22,base-TS*1.0,cx+TS*.24,base]),'#7a7a84');g.save();g.shadowColor='#7ad8ff';g.shadowBlur=8;g.strokeStyle='#9ae8ff';g.lineWidth=1.8;g.beginPath();g.moveTo(cx-6,base-TS*.9);g.lineTo(cx+4,base-TS*.75);g.lineTo(cx-4,base-TS*.6);g.moveTo(cx+2,base-TS*.45);g.lineTo(cx-5,base-TS*.3);g.stroke();g.restore();break;
 case 'arbre':trait(g,[cx,base,cx,base-TS*.9],'#6a4a2a',8);for(const [dx,dy,rr] of [[-16,-1.0,16],[16,-1.0,16],[0,-1.25,19],[-8,-.8,12],[10,-.78,12]])boule(g,cx+dx,base+TS*dy,rr,'#d8b030');g.save();g.shadowColor='#fff0a0';g.shadowBlur=10;g.fillStyle='#fff6c0';for(let k2=0;k2<6;k2++){g.beginPath();g.arc(cx-16+k2*7,base-TS*(1.05+(k2%2)*.15),1.6,0,7);g.fill();}g.restore();break;
 case 'tour':peint(g,rrect(cx-TS*.22,base-TS*1.35,TS*.44,TS*1.35,2),'#9a948a',{y0:base-TS*1.35,y1:base});for(let k2=0;k2<3;k2++)peint(g,rrect(cx-TS*.26+k2*TS*.18,base-TS*1.45,TS*.14,TS*.12,1),'#9a948a');g.fillStyle='#1a1410';g.fillRect(cx-3,base-TS*1.05,6,9);g.fillRect(cx-4,base-14,8,14);break;
 case 'sanctuaire':peint(g,rrect(cx-TS*.45,base-TS*.12,TS*.9,TS*.12,1),'#d8d2c2');for(let k2=0;k2<4;k2++)peint(g,rrect(cx-TS*.4+k2*TS*.25,base-TS*.8,TS*.08,TS*.68,1),'#ece6d6');peint(g,poly([cx-TS*.5,base-TS*.8,cx,base-TS*1.15,cx+TS*.5,base-TS*.8]),'#d8d2c2');g.save();g.shadowColor='#bfa0ff';g.shadowBlur=12;boule(g,cx,base-TS*.45,5,'#d8c0ff',{trait:false});g.restore();break;
 case 'ecurie':peint(g,rrect(cx-TS*.55,base-TS*.6,TS*1.1,TS*.6,2),'#9a6a3a');peint(g,poly([cx-TS*.65,base-TS*.6,cx,base-TS*1.0,cx+TS*.65,base-TS*.6]),'#7a3a2a');g.fillStyle='#3a2412';g.fillRect(cx-9,base-TS*.42,18,TS*.42);trait(g,[cx-9,base-TS*.42,cx+9,base],'#c8a060',1.5);break;
 case 'feu':for(const x of [cx-TS*.35,cx+TS*.35])peint(g,poly([x-TS*.22,base-4,x,base-TS*.6,x+TS*.22,base-4]),'#c8b48a');for(let k2=0;k2<4;k2++)trait(g,[cx-8+k2*4,base-2,cx-4+k2*3,base-8],'#5a3a1a',3);g.save();g.shadowColor='#ff8a2a';g.shadowBlur=14;g.fillStyle='#ffb03a';g.beginPath();g.moveTo(cx-7,base-6);g.quadraticCurveTo(cx,base-28,cx+7,base-6);g.fill();g.restore();g.drawImage(iconeRes('or',20),cx+8,base-18);break;
 case 'fontaine':ell(g,cx,base-TS*.15,TS*.42,TS*.14,'#9a948a');ell(g,cx,base-TS*.18,TS*.34,TS*.09,'#4a9ac8',{trait:false});peint(g,rrect(cx-4,base-TS*.75,8,TS*.6,2),'#bcb6aa');g.save();g.strokeStyle='rgba(180,230,255,.9)';g.lineWidth=2;for(const s of [-1,1]){g.beginPath();g.moveTo(cx,base-TS*.75);g.quadraticCurveTo(cx+s*14,base-TS*.95,cx+s*18,base-TS*.25);g.stroke();}g.restore();break;
 case 'obelisque':{peint(g,poly([cx-TS*.2,base,cx-TS*.12,base-TS*1.3,cx,base-TS*1.5,cx+TS*.12,base-TS*1.3,cx+TS*.2,base]),'#8a8478',{y0:base-TS*1.5,y1:base,pierre:.12});g.save();g.shadowColor='#ffd86a';g.shadowBlur=10;g.strokeStyle='#ffe08a';g.lineWidth=1.6;for(let k=0;k<4;k++){const y=base-TS*(.35+k*.24);g.beginPath();g.moveTo(cx-5,y);g.lineTo(cx+5,y-4);g.moveTo(cx,y-6);g.lineTo(cx,y+3);g.stroke();}g.restore();peint(g,rrect(cx-TS*.3,base-TS*.12,TS*.6,TS*.12,2),'#9a948a');break;}
 case 'habitation':{peint(g,g2=>{g2.moveTo(cx-TS*.6,base);g2.quadraticCurveTo(cx-TS*.5,base-TS*1.0,cx,base-TS*1.05);g2.quadraticCurveTo(cx+TS*.5,base-TS*1.0,cx+TS*.6,base);g2.closePath();},'#7a6a52');g.fillStyle='#120c08';g.beginPath();g.ellipse(cx,base-TS*.2,TS*.22,TS*.3,0,Math.PI,0);g.fill();if(cre)g.drawImage(spriteCreature(cre,TS*.9),cx-TS*.15,base-TS*.85);break;}
 }
 SPR_CACHE[k]=c;return c;}
function spriteCoffre(){const k='coffre';if(SPR_CACHE[k])return SPR_CACHE[k];const c=mkC(TS,TS);const g=c.getContext('2d');ombreSol(g,32,56,22,6,.4);peint(g,rrect(12,30,40,24,3),'#8a5a2a',{y0:30,y1:54});peint(g,g2=>{g2.moveTo(12,32);g2.quadraticCurveTo(32,16,52,32);g2.closePath();},'#9a6a32');for(const x of [18,30,42])peint(g,rrect(x,26,5,28,1),'#d8b040');peint(g,rrect(29,36,7,8,1),'#e8c860');SPR_CACHE[k]=c;return c;}
function spriteArtefact(a){const k='a'+a;if(SPR_CACHE[k])return SPR_CACHE[k];const c=mkC(TS,TS);const g=c.getContext('2d');ombreSol(g,32,56,18,5,.35);
 peint(g,rrect(22,44,20,10,2),'#bcb6aa');g.save();g.shadowColor='#ffe58a';g.shadowBlur=16;const A=ARTS[a];const b=Object.keys(A.b)[0];
 if(b==='att')arme(g,a==='hache'?'hache':'epee',28,42,{});else if(b==='def')peint(g,g2=>{g2.moveTo(24,22);g2.lineTo(40,22);g2.lineTo(40,34);g2.quadraticCurveTo(32,46,24,34);g2.closePath();},'#c8a040');
 else if(b==='pou'||b==='con')boule(g,32,32,8,b==='pou'?'#8a5ae8':'#4ac0e8');else if(b==='mvt')peint(g,poly([24,24,32,24,32,38,40,40,40,44,24,44]),'#8a5a2a');else{boule(g,32,34,7,'#e8c040');g.fillStyle='#fff';g.fillRect(31,28,2,6);}
 g.restore();SPR_CACHE[k]=c;return c;}

// ---------- panorama de ville ----------
// positions des bâtiments (fractions de la largeur/hauteur)
var PANO={capitole:[.5,.68,.19],hotelville:[.5,.68,.18],mairie:[.5,.68,.16],conseil:[.5,.68,.14],fort:[.5,.56,1],citadelle:[.5,.56,1],chateau:[.5,.56,1],taverne:[.25,.97,.14],marche:[.45,.99,.15],silo:[.06,.96,.1],
 graal:[.64,.6,.12],guilde1:[.82,.62,.1],guilde2:[.82,.62,.1],guilde3:[.82,.62,.1],hab1:[.08,.78,.12],hab2:[.3,.8,.12],hab3:[.68,.81,.12],hab4:[.92,.82,.12],hab5:[.65,.98,.13],hab6:[.87,1,.14],hab7:[.18,.62,.15]};
function panoramaVille(v,W,H){const c=mkC(W,H);const g=c.getContext('2d');const F=FAC[v.fac];const zones=[];const r=creeRng(v.id*13);
 const nuit=v.fac==='necro';const sky=g.createLinearGradient(0,0,0,H*.6);sky.addColorStop(0,nuit?'#1a1430':v.fac==='sylve'?'#6aa8d8':'#5a90d0');sky.addColorStop(1,nuit?'#5a4a6a':v.fac==='sylve'?'#cfe8c8':'#f0d8b0');g.fillStyle=sky;g.fillRect(0,0,W,H);
 if(nuit){g.fillStyle='#e8e4d0';g.beginPath();g.arc(W*.8,H*.14,H*.06,0,7);g.fill();g.fillStyle='#1a1430';g.beginPath();g.arc(W*.82,H*.13,H*.055,0,7);g.fill();}
 else{g.save();g.globalAlpha=.7;g.fillStyle='#fff';for(let k=0;k<5;k++){const x=r.f()*W,y=H*(.06+r.f()*.2);for(let j=0;j<4;j++){g.beginPath();g.ellipse(x+j*W*.025,y+(j%2)*4,W*.03,H*.025,0,0,7);g.fill();}}g.restore();}
 // montagnes lointaines
 for(let l=0;l<2;l++){g.fillStyle=nuit?['#3a3050','#2a2438'][l]:v.fac==='sylve'?['#8ab0a0','#5a8a64'][l]:['#9aa8c0','#6a7a90'][l];g.beginPath();g.moveTo(0,H*.55);for(let x=0;x<=W;x+=W/14)g.lineTo(x,H*(.32+l*.08)+Math.sin(x*.013+l*2+v.id)*H*.06+r.f()*H*.04);g.lineTo(W,H*.6);g.closePath();g.fill();}
 const sol=g.createLinearGradient(0,H*.5,0,H);const sc=nuit?['#4a4038','#2a2420']:v.fac==='sylve'?['#5a8a3a','#2f5a24']:['#7aa04a','#4a7030'];sol.addColorStop(0,sc[0]);sol.addColorStop(1,sc[1]);g.fillStyle=sol;g.fillRect(0,H*.52,W,H*.48);
 // chemin
 g.fillStyle=nuit?'rgba(120,100,80,.5)':'rgba(200,170,120,.55)';g.beginPath();g.moveTo(W*.45,H);g.quadraticCurveTo(W*.5,H*.75,W*.5,H*.62);g.quadraticCurveTo(W*.52,H*.75,W*.6,H);g.fill();
 const [T1]=textures();const im=g.getImageData(0,H*.52|0,W,H-(H*.52|0));for(let y=0;y<im.height;y++)for(let x=0;x<W;x++){const o=(y*W+x)*4;const v=(T1[((y>>1)&255)*256+((x>>1)&255)]-.5)*50;im.data[o]+=v;im.data[o+1]+=v;im.data[o+2]+=v*.6;}g.putImageData(im,0,H*.52|0);
 const s0=H/420;for(let k=0;k<26;k++){const x=r.f()*W,y=H*(.52+r.f()*.04);const s=s0*(1.1+r.f()*.6);if(nuit)arbreMort(g,x,y,s*1.2,'#2a2228');else if(v.fac==='sylve'||r.f()<.3)sapin(g,x,y,s*1.1,false);else arbreFeuillu(g,x,y,s,r);}
 for(let k=0;k<40;k++){const x=r.f()*W,y=H*(.6+r.f()*.4);g.fillStyle=nuit?'rgba(30,24,20,.35)':'rgba(30,60,20,.3)';g.beginPath();g.ellipse(x,y,6*s0,2.5*s0,0,0,7);g.fill();if(!nuit&&r.f()<.5){g.fillStyle=['#f0e070','#f0f0f0','#e86a6a'][k%3];g.beginPath();g.arc(x,y-2*s0,1.6*s0,0,7);g.fill();}}
 if(nuit)for(let k=0;k<8;k++){const x=r.f()*W,y=H*(.62+r.f()*.35);peint(g,rrect(x-5*s0,y-14*s0,10*s0,14*s0,4*s0),'#7a7680');}
 for(const [x,y,sc] of [[W*.02,H*.7,1.6],[W*.98,H*.72,1.7],[W*.55,H*.84,.9]]){if(nuit)arbreMort(g,x,y,s0*sc*1.6,'#2a2228');else if(v.fac==='sylve')sapin(g,x,y,s0*sc*1.5,false);else arbreFeuillu(g,x,y,s0*sc*1.4,r);}
 const sx=W/1000;
 const ordre=Object.keys(PANO).filter(b=>v.bat[b]).filter(b=>!(b==='conseil'&&(v.bat.mairie))&&!(b==='mairie'&&v.bat.hotelville)&&!(b==='hotelville'&&v.bat.capitole)&&!(b==='fort'&&v.bat.citadelle)&&!(b==='citadelle'&&v.bat.chateau)&&!(b==='guilde1'&&v.bat.guilde2)&&!(b==='guilde2'&&v.bat.guilde3));
 ordre.sort((a,b)=>PANO[a][1]-PANO[b][1]);
 for(const b of ordre){const [fx,fy,fw]=PANO[b];const x=fx*W,y=fy*H,w=fw*W;const z=batimentPano(g,b,x,y,w,H,v,sx);zones.push(Object.assign({b},z));}
 return{c,zones};}
function batimentPano(g,b,x,y,w,H,v,sx){const F=FAC[v.fac].coul;const mur=F.mur,toit=F.toit;const s=H/420;
 if(b==='fort'||b==='citadelle'||b==='chateau'){const n=b==='chateau'?3:b==='citadelle'?2:1;const W=g.canvas.width;
  peint(g,rrect(W*.18,y-40*s,W*.64,40*s,2),mur,{pierre:(g.canvas.height>500?.4:.22),y0:y-40*s,y1:y});for(let xx=W*.18;xx<W*.82;xx+=14*s)peint(g,rrect(xx,y-48*s,9*s,10*s,1),mur,{pierre:(g.canvas.height>500?.4:.22)});
  for(let k=0;k<n+1;k++){const tx=W*(.18+.64*k/n);tourelle(g,tx,y+4*s,34*s,(80+n*14)*s,mur,toit,v.fac==='necro'?'fleche':'cone');}
  return{x:W*.18,y:y-(80+n*14)*s,w:W*.64,h:(80+n*14)*s};}
 const h=w*1.1;
 if(b==='conseil'||b==='mairie'||b==='hotelville'||b==='capitole'){peint(g,rrect(x-w/2,y-h*.7,w,h*.7,3),mur,{pierre:(g.canvas.height>500?.4:.22),y0:y-h*.7,y1:y});peint(g,poly([x-w/2-8*s,y-h*.7,x,y-h*1.15,x+w/2+8*s,y-h*.7]),toit,{y0:y-h*1.15,y1:y-h*.7});
  if(b!=='conseil'){tourelle(g,x,y-h*.7,w*.3,h*.35,mur,toit,'cone');}if(b==='capitole'){g.save();g.shadowColor='#ffe58a';g.shadowBlur=12;boule(g,x,y-h*1.25,8*s,'#f0c040');g.restore();}
  for(let k=0;k<3;k++){g.fillStyle='#ffd87a';g.fillRect(x-w*.3+k*w*.25,y-h*.45,w*.1,h*.15);}g.fillStyle='#3a2412';g.fillRect(x-w*.1,y-h*.25,w*.2,h*.25);return{x:x-w/2,y:y-h*1.15,w,h:h*1.15};}
 if(b==='graal'){const hh=h*2.2;g.save();g.shadowColor='#ffe58a';g.shadowBlur=30*s;peint(g,poly([x-w*.32,y,x-w*.14,y-hh,x,y-hh*1.12,x+w*.14,y-hh,x+w*.32,y]),v.fac==='necro'?'#5a4a7a':v.fac==='sylve'?'#5a9a4a':'#f0e0a0',{y0:y-hh,y1:y});g.restore();
  g.save();g.globalCompositeOperation='lighter';const gr=g.createRadialGradient(x,y-hh*.9,2,x,y-hh*.9,w*.9);gr.addColorStop(0,'rgba(255,240,170,.8)');gr.addColorStop(1,'rgba(255,220,120,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y-hh*.9,w*.9,0,7);g.fill();g.restore();return{x:x-w*.4,y:y-hh*1.15,w:w*.8,h:hh*1.15};}
 if(b.startsWith('guilde')){const n=+b[6];tourelle(g,x,y,w*.6,h*(.8+n*.35),mur,toit,'fleche');g.save();g.shadowColor='#9a7aff';g.shadowBlur=16;boule(g,x,y-h*(.8+n*.35)-w*1.2,7*s,'#c8b0ff');g.restore();return{x:x-w*.4,y:y-h*(.8+n*.35)-w*1.4,w:w*.8,h:h*(.8+n*.35)+w*1.4};}
 if(b==='taverne'){peint(g,rrect(x-w/2,y-h*.6,w,h*.6,3),'#b08a5a');peint(g,poly([x-w/2-6*s,y-h*.6,x,y-h*.95,x+w/2+6*s,y-h*.6]),'#7a3a2a');g.fillStyle='#ffd87a';g.fillRect(x-w*.32,y-h*.42,w*.18,h*.14);g.fillRect(x+w*.14,y-h*.42,w*.18,h*.14);trait(g,[x+w*.5,y-h*.5,x+w*.7,y-h*.5],'#3a2a1a',2);peint(g,rrect(x+w*.6,y-h*.48,w*.18,h*.14,2),'#c89040');return{x:x-w/2,y:y-h*.95,w:w*1.3,h:h*.95};}
 if(b==='marche'){for(let k=0;k<3;k++){const xx=x-w*.4+k*w*.4;trait(g,[xx-w*.15,y,xx-w*.15,y-h*.45],'#6a4a2a',2);trait(g,[xx+w*.15,y,xx+w*.15,y-h*.45],'#6a4a2a',2);peint(g,poly([xx-w*.2,y-h*.45,xx,y-h*.62,xx+w*.2,y-h*.45]),['#c83a2a','#e8d8b0','#3a6ac8'][k]);peint(g,rrect(xx-w*.16,y-h*.18,w*.32,h*.1,1),'#9a6a3a');}return{x:x-w*.65,y:y-h*.62,w:w*1.3,h:h*.62};}
 if(b==='silo'){peint(g,rrect(x-w*.35,y-h*.8,w*.7,h*.8,w*.3),'#a87a48');peint(g,g2=>{g2.moveTo(x-w*.38,y-h*.78);g2.quadraticCurveTo(x,y-h*1.1,x+w*.38,y-h*.78);g2.closePath();},'#7a3a2a');return{x:x-w*.4,y:y-h*1.05,w:w*.8,h:h*1.05};}
 // habitations : bâtiment générique + créature devant
 const niv=+b[3];const cre=FAC[v.fac].crea[niv-1];
 if(v.fac==='sylve'){trait(g,[x,y,x,y-h*.9],'#6a4a2a',8*s);for(const [dx,dy,rr] of [[-.3,-.95,.28],[.3,-.95,.28],[0,-1.15,.32]])boule(g,x+dx*w,y+dy*h,rr*w,'#3f7a34');peint(g,rrect(x-w*.3,y-h*.55,w*.6,h*.35,3),'#9a7448');}
 else if(v.fac==='necro'){peint(g,poly([x-w/2,y,x-w/2,y-h*.6,x,y-h*1.0,x+w/2,y-h*.6,x+w/2,y]),teinte(mur,-.15),{pierre:(g.canvas.height>500?.4:.22),y0:y-h,y1:y});g.fillStyle='#120c18';g.beginPath();g.ellipse(x,y-h*.2,w*.18,h*.22,0,Math.PI,0);g.fill();}
 else{peint(g,rrect(x-w/2,y-h*.6,w,h*.6,3),mur,{pierre:(g.canvas.height>500?.4:.22),y0:y-h*.6,y1:y});peint(g,poly([x-w/2-6*s,y-h*.6,x,y-h*(.95+niv*.04),x+w/2+6*s,y-h*.6]),toit);g.fillStyle='#3a2412';g.fillRect(x-w*.12,y-h*.3,w*.24,h*.3);}
 const S=w*1.3;g.drawImage(spriteCreature(cre,Math.round(S)),x-S*.2,y-S*.9);
 return{x:x-w/2,y:y-h*1.1,w:w*1.2,h:h*1.1};}

// ---------- champ de bataille ----------
function fondCombat(ter,W,H,graine,hz){hz=hz||.24;const k='fc'+ter+W+'x'+H+hz;if(SPR_CACHE[k])return SPR_CACHE[k];const c=mkC(W,H);const g=c.getContext('2d');const r=creeRng(graine||7);
 const P=PAL[ter]||PAL.herbe;const ciel=g.createLinearGradient(0,0,0,H*(hz+.06));const lave=ter==='lave',neige=ter==='neige';
 ciel.addColorStop(0,lave?'#2a0a08':neige?'#8aa8c8':'#6a9ad0');ciel.addColorStop(1,lave?'#8a3a1a':neige?'#dfe8f0':'#d8e4c8');g.fillStyle=ciel;g.fillRect(0,0,W,H*(hz+.06));
 g.fillStyle=lave?'#3a2220':neige?'#b8c4d4':'#7a8aa0';g.beginPath();g.moveTo(0,H*(hz+.06));for(let x=0;x<=W;x+=W/10)g.lineTo(x,H*(hz-.08+r.f()*.1));g.lineTo(W,H*(hz+.06));g.fill();
 const sol=g.createLinearGradient(0,H*(hz-.02),0,H);sol.addColorStop(0,`rgb(${P[1]})`);sol.addColorStop(1,`rgb(${P[0]})`);g.fillStyle=sol;g.fillRect(0,H*hz,W,H*(1-hz));
 const [T1,T2]=textures();const img=g.getImageData(0,H*hz|0,W,H-(H*hz|0));const d=img.data;for(let y=0;y<img.height;y++)for(let x=0;x<W;x++){const o=(y*W+x)*4;const v=(T1[((y>>1)&255)*256+((x>>1)&255)]-.5)*60+(T2[(y&255)*256+(x&255)]-.5)*30;d[o]+=v;d[o+1]+=v;d[o+2]+=v*.8;
  if(lave&&Math.abs(T2[(y&255)*256+(x&255)]-.5)<.015){d[o]=255;d[o+1]=110;d[o+2]=30;}}
 g.putImageData(img,0,H*hz|0);
 // lisière d'arbres au fond
 for(let x=-10;x<W+20;x+=W/24){const s=W/900*(1+r.f()*.4);const y=H*(hz+.03+r.f()*.04);if(neige)sapin(g,x,y,s*1.4,true);else if(lave)rocher(g,x,y,s*1.3,'#3a2a28',false,true);else if(ter==='sable')(r.f()<.5?palmier:cactus)(g,x,y,s*1.2);else arbreFeuillu(g,x,y,s*1.3,r);}
 g.fillStyle='rgba(0,0,0,.18)';g.fillRect(0,H*(hz+.03),W,6);
 // détails du sol : plaques de terre, touffes, fleurs, cailloux ; buissons et arbres sur les bords (comme les captures)
 const s0=Math.min(W,H)/700;const sec=ter==='sable'||ter==='lave'||ter==='neige';
 for(let n=0;n<14;n++){const x=r.f()*W,y=H*(hz+.08+r.f()*(.9-hz)),rx=(30+r.f()*70)*s0,ry=rx*.35;const gr=g.createRadialGradient(x,y,1,x,y,rx);const col=ter==='neige'?'rgba(150,170,200,.25)':ter==='lave'?'rgba(10,6,4,.35)':ter==='sable'?'rgba(160,120,60,.25)':'rgba(110,80,40,.28)';gr.addColorStop(0,col);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.beginPath();g.ellipse(x,y,rx,ry,0,0,7);g.fill();}
 if(!sec)for(let n=0;n<220;n++){const x=r.f()*W,y=H*(hz+.05+r.f()*(.95-hz));const t=(.6+r.f()*.8)*s0*6;g.strokeStyle=r.f()<.5?'rgba(40,70,20,.45)':'rgba(140,180,80,.4)';g.lineWidth=1.2;g.beginPath();for(let b=-1;b<=1;b++){g.moveTo(x+b*2,y);g.lineTo(x+b*3.5,y-t);}g.stroke();
  if(r.f()<.12){g.fillStyle=['#f0e070','#f4f4f4','#e86a6a','#9a7aff'][n%4];g.beginPath();g.arc(x,y-t,1.8*s0+.5,0,7);g.fill();}}
 for(let n=0;n<18;n++){const x=r.f()*W,y=H*(hz+.06+r.f()*(.94-hz));const s=(.25+r.f()*.3)*s0;rocher(g,x,y,s,ter==='neige'?'#9aa6b4':ter==='lave'?'#3a2c2a':'#8a8478',ter==='neige',ter==='lave');}
 for(const [x,y,sc] of [[-.02,.96,1.6],[.06,1.02,1.2],[1.02,.97,1.7],[.94,1.03,1.2],[-.03,.55,1.1],[1.03,.6,1.2]]){const X=x*W,Y=y*H,s=s0*sc*2;if(ter==='neige')sapin(g,X,Y,s*1.2,true);else if(ter==='lave')arbreMort(g,X,Y,s*1.3,'#1a1210');else if(ter==='sable')palmier(g,X,Y,s*1.2);else if(ter==='marais')arbreMort(g,X,Y,s*1.3,'#3a3424');else arbreFeuillu(g,X,Y,s,r);}
 const v=g.createRadialGradient(W/2,H*.6,H*.3,W/2,H*.6,H*.95);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.35)');g.fillStyle=v;g.fillRect(0,0,W,H);
 SPR_CACHE[k]=c;return c;}
function spriteObstacleCombat(ter,v){return spriteObstacle(ter==='herbe'&&v%2?OBS.VEG:OBS.ROC,ter,v);}
