/* ===== Valdragon — rendu ===== */
const VR=(function(){
const PX=40,TAU=Math.PI*2;
const hr=(x,y,k=0)=>{let h=(x*374761393+y*668265263+k*1442695041)|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return(h>>>0)/4294967296;};
const PAL=[
 {floor:['#3b3a42','#35343c','#403f48'],mortar:'#1a191f',cap:'#56525e',capHi:'#7a7686',face:['#3a3742','#1f1d24'],amb:[5,4,11],tint:'rgba(120,130,170,',dec:'crypte'},
 {floor:['#3e3529','#382f24','#453b2e'],mortar:'#1c1610',cap:'#5b4d3b',capHi:'#7d6a52',face:['#3e3427','#211a12'],amb:[4,6,6],tint:'rgba(90,170,150,',dec:'caverne'},
 {floor:['#302826','#2b2321','#372e2b'],mortar:'#130d0b',cap:'#4c3f3a',capHi:'#6b5850',face:['#33282400','#18110f'],amb:[10,4,3],tint:'rgba(255,110,40,',dec:'forge'},
 {floor:['#3a495c','#344255','#415267'],mortar:'#1a2230',cap:'#70839a',capHi:'#c4dcef',face:['#3d4d62','#1f2836'],amb:[3,6,12],tint:'rgba(150,200,255,',dec:'givre'}];
PAL[2].face=['#4a3a32','#1c1412'];PAL[0].capD='#141318';PAL[1].capD='#17130e';PAL[2].capD='#120c0a';PAL[3].capD='#18202b';PAL[0].face=['#4a4652','#25232b'];PAL[1].face=['#4d4030','#241c13'];PAL[3].face=['#4d6078','#232e3e'];
const RCOL=['#d8d0c0','#7f9cff','#ffd84a','#ff9a3a'];
const ELC={fire:'#ff7a2a',ice:'#8fd8ff',poison:'#8cff5a',arcane:'#d77aff',phys:'#e8dcc4'};
const BOSSCOL={fire:['#7d1813','#2a0806','#ffb02e'],ice:['#2f5f88','#0c1e30','#c8f2ff'],poison:['#3e4a22','#141a08','#a8ff5a'],arcane:['#5b2079','#1c0628','#ff8ae8']};
let floorCv,fx,fogCv,fogx,fogImg,lc,lx,vg,pal,tier,UIL=[];
const P_=[];// particules
let TXT=[],FL=[],afterImg=[],LBL=[];

/* ---------- pré-rendu de l'étage ---------- */
function prerender(vd){const W=VD.W,H=VD.H;tier=Math.floor((VD.F-1)/4)%4;pal=PAL[tier];const lair=VD.F%4===0;
 if(!floorCv){floorCv=document.createElement('canvas');floorCv.width=W*PX;floorCv.height=H*PX;fx=floorCv.getContext('2d');
  fogCv=document.createElement('canvas');fogCv.width=W;fogCv.height=H;fogx=fogCv.getContext('2d');fogImg=fogx.createImageData(W,H);}
 fx.fillStyle='#030204';fx.fillRect(0,0,W*PX,H*PX);UIL=[];P_.length=0;TXT=[];FL=[];
 const fl=(x,y)=>{const v=VD.at(x,y);return v===1||v===2||v===3;};
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(fl(x,y))floorTile(x,y);
 // occlusion ambiante
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(!fl(x,y))continue;const X=x*PX,Y=y*PX;
  if(!fl(x,y-1)){const g=fx.createLinearGradient(0,Y,0,Y+PX*.55);g.addColorStop(0,'rgba(0,0,0,.6)');g.addColorStop(1,'rgba(0,0,0,0)');fx.fillStyle=g;fx.fillRect(X,Y,PX,PX*.55);}
  if(!fl(x-1,y)){const g=fx.createLinearGradient(X,0,X+PX*.35,0);g.addColorStop(0,'rgba(0,0,0,.45)');g.addColorStop(1,'rgba(0,0,0,0)');fx.fillStyle=g;fx.fillRect(X,Y,PX*.35,PX);}
  if(!fl(x+1,y)){const g=fx.createLinearGradient(X+PX,0,X+PX*.65,0);g.addColorStop(0,'rgba(0,0,0,.45)');g.addColorStop(1,'rgba(0,0,0,0)');fx.fillStyle=g;fx.fillRect(X+PX*.65,Y,PX*.35,PX);}
  if(VD.at(x,y)===3){fx.fillStyle='rgba(0,0,0,.35)';fx.beginPath();fx.ellipse(X+PX*.6,Y+PX*.62,PX*.55,PX*.3,0,0,TAU);fx.fill();}}
 decals(lair);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(fl(x,y))continue;let n=false;for(let j=-1;j<=1&&!n;j++)for(let i=-1;i<=1;i++)if(fl(x+i,y+j)){n=true;break;}if(n)wallTile(x,y);}
 // escalier
 const s=VD.stairs,SX=s.x*PX,SY=s.y*PX;fx.fillStyle='#000';fx.fillRect(SX+3,SY+3,PX-6,PX-6);
 for(let i=0;i<5;i++){fx.fillStyle=`rgba(${110-i*18},${95-i*16},${80-i*14},1)`;fx.fillRect(SX+5+i*2,SY+5+i*(PX-12)/5,PX-10-i*4,(PX-12)/5-2);}
 fx.strokeStyle='#8a7350';fx.lineWidth=3;fx.strokeRect(SX+2,SY+2,PX-4,PX-4);
 // lumières statiques du moteur
 VD.lights.forEach(l=>{const X=l.x*PX,Y=l.y*PX;if(l.k==='torch'){fx.fillStyle='#2a2018';fx.fillRect(X-3,Y-8,6,12);fx.fillStyle='#5a4228';fx.fillRect(X-6,Y-10,12,4);}else{fx.fillStyle='rgba(0,0,0,.4)';fx.beginPath();fx.ellipse(X+2,Y+6,12,5,0,0,TAU);fx.fill();fx.fillStyle='#3a3028';fx.fillRect(X-2,Y-4,4,10);fx.fillStyle='#5a4a38';fx.beginPath();fx.ellipse(X,Y-6,11,5,0,0,TAU);fx.fill();fx.fillStyle='#ff8a2a';fx.beginPath();fx.ellipse(X,Y-7,8,3,0,0,TAU);fx.fill();}});
 VD.lights.forEach(l=>UIL.push({x:l.x,y:l.y,r:l.k==='torch'?3.4:4.6,c:l.k==='torch'?[255,150,60]:[255,120,40],i:l.k==='torch'?.85:1,fl:1,k:l.k}));
 for(let i=0;i<W*H;i++)fogImg.data[i*4+3]=255;
}
function floorTile(x,y){const X=x*PX,Y=y*PX,h=hr(x,y),f=pal.floor;
 fx.fillStyle=pal.mortar;fx.fillRect(X,Y,PX,PX);
 if(pal.dec==='caverne'){fx.fillStyle=f[(h*3)|0];fx.fillRect(X,Y,PX,PX);for(let i=0;i<5;i++){const a=hr(x,y,i+3);fx.fillStyle=a<.5?'rgba(0,0,0,.12)':'rgba(255,240,200,.05)';fx.beginPath();fx.ellipse(X+hr(x,y,i+9)*PX,Y+hr(x,y,i+19)*PX,4+a*9,3+a*6,a*3,0,TAU);fx.fill();}}
 else{const split=h<.55;const st=split?[[0,0,.5,.5],[.5,0,.5,.5],[0,.5,.5,.5],[.5,.5,.5,.5]]:h<.8?[[0,0,1,.5],[0,.5,1,.5]]:[[0,0,1,1]];
  st.forEach((q,i)=>{const k=hr(x,y,i+1);const c=f[(k*3)|0];const g=fx.createLinearGradient(X+q[0]*PX,Y+q[1]*PX,X+(q[0]+q[2])*PX,Y+(q[1]+q[3])*PX);
   g.addColorStop(0,shade(c,10+k*8));g.addColorStop(1,shade(c,-12));fx.fillStyle=g;fx.fillRect(X+q[0]*PX+1,Y+q[1]*PX+1,q[2]*PX-2,q[3]*PX-2);
   fx.fillStyle='rgba(255,255,255,.05)';fx.fillRect(X+q[0]*PX+1,Y+q[1]*PX+1,q[2]*PX-2,1.5);});}
 for(let i=0;i<6;i++){const a=hr(x,y,i+30);fx.fillStyle=a<.5?'rgba(0,0,0,.25)':'rgba(255,255,255,.07)';fx.fillRect(X+hr(x,y,i+40)*PX,Y+hr(x,y,i+50)*PX,1.5,1.5);}
 if(h>.93){fx.strokeStyle='rgba(0,0,0,.45)';fx.lineWidth=1;fx.beginPath();let cx=X+hr(x,y,7)*PX,cy=Y+hr(x,y,8)*PX;fx.moveTo(cx,cy);for(let i=0;i<4;i++){cx+=(hr(x,y,60+i)-.5)*16;cy+=(hr(x,y,70+i)-.3)*14;fx.lineTo(cx,cy);}fx.stroke();}
 if(pal.dec==='givre'&&hr(x,y,99)<.25){fx.fillStyle='rgba(220,240,255,.10)';fx.beginPath();fx.ellipse(X+PX/2,Y+PX/2,PX*.6,PX*.35,hr(x,y,98)*3,0,TAU);fx.fill();}}
function wallTile(x,y){const X=x*PX,Y=y*PX,isF=(i,j)=>[1,2,3].includes(VD.at(i,j)),below=isF(x,y+1);const capH=below?PX*.34:PX;
 // faîte sombre en blocs
 fx.fillStyle=pal.capD;fx.fillRect(X,Y,PX,capH);
 for(let i=0;i<4;i++){const bx=X+(i%2)*PX/2,by=Y+((i/2)|0)*capH/2;fx.fillStyle=`rgba(255,255,255,${.015+hr(x,y,i+200)*.03})`;fx.fillRect(bx+1,by+1,PX/2-2,capH/2-2);}
 const rim=pal.capHi;fx.fillStyle=rim;
 if(isF(x,y-1))fx.fillRect(X,Y,PX,2);if(isF(x-1,y))fx.fillRect(X,Y,2,capH);if(isF(x+1,y))fx.fillRect(X+PX-2,Y,2,capH);
 if(below){fx.fillRect(X,Y+capH-2,PX,2);const fy=Y+capH,fh=PX-capH;const g2=fx.createLinearGradient(0,fy,0,fy+fh);g2.addColorStop(0,pal.face[0]);g2.addColorStop(1,pal.face[1]);fx.fillStyle=g2;fx.fillRect(X,fy,PX,fh);
  const rows=3;for(let r=0;r<rows;r++){const ry=fy+r*fh/rows;const off=(r+x)%2?PX*.5:0;for(let bx=-PX*.5+off;bx<PX;bx+=PX*.5){const k=hr(x*3+r,y,bx|0);fx.fillStyle=`rgba(255,255,255,${.03+k*.05})`;fx.fillRect(X+Math.max(0,bx)+1,ry+1,Math.min(PX*.5,PX-Math.max(0,bx))-2,fh/rows-2);}
   fx.fillStyle='rgba(0,0,0,.45)';fx.fillRect(X,ry,PX,1);}
  fx.fillStyle='rgba(0,0,0,.35)';fx.fillRect(X,Y+PX-2,PX,2);
  if(pal.dec==='givre'){fx.fillStyle='rgba(235,248,255,.85)';fx.beginPath();fx.moveTo(X,Y+capH-2);for(let i=0;i<=4;i++)fx.lineTo(X+i*PX/4,Y+capH+1+hr(x,y,i+80)*5);fx.lineTo(X+PX,Y+capH-2);fx.fill();
   for(let i=0;i<2;i++){const ix=X+hr(x,y,i+90)*PX;fx.fillStyle='rgba(200,235,255,.7)';fx.beginPath();fx.moveTo(ix-2,fy+3);fx.lineTo(ix+2,fy+3);fx.lineTo(ix,fy+8+hr(x,y,i+91)*8);fx.fill();}}
  if(pal.dec==='caverne'&&hr(x,y,77)<.4){fx.fillStyle='rgba(70,120,45,.6)';fx.beginPath();fx.ellipse(X+hr(x,y,78)*PX,fy+fh*.9,9,4,0,0,TAU);fx.fill();}
  if(pal.dec==='forge'&&hr(x,y,79)<.15){fx.fillStyle='#ff6a1a';fx.shadowColor='#ff5a00';fx.shadowBlur=6;fx.fillRect(X+hr(x,y,81)*PX*.8,fy+fh*.4,3,fh*.6);fx.shadowBlur=0;}}}
function decals(lair){const R=VD.rooms;
 R.forEach((r,i)=>{const n=4+((hr(r.x,r.y,1)*6)|0);for(let j=0;j<n;j++){const x=r.x+hr(i,j,3)*r.w,y=r.y+hr(i,j,4)*r.h;if(VD.solid(x,y))continue;const X=x*PX,Y=y*PX,k=hr(i,j,5);
  if(pal.dec==='crypte'){if(k<.4)bones(X,Y,hr(i,j,6));else if(k<.6)puddle(X,Y,'rgba(20,25,40,.55)');else rubble(X,Y);}
  else if(pal.dec==='caverne'){if(k<.45){shroom(X,Y);UIL.push({x,y,r:2.1,c:[90,220,255],i:.55,fl:.2});}else if(k<.75)moss(X,Y);else rubble(X,Y);}
  else if(pal.dec==='forge'){if(k<.4){lavaCrack(X,Y,i*10+j);UIL.push({x,y,r:2.4,c:[255,110,30],i:.7,fl:.6});}else if(k<.6)grate(X,Y);else rubble(X,Y);}
  else{if(k<.35){crystal(X,Y);UIL.push({x,y,r:2.3,c:[140,210,255],i:.6,fl:.15});}else if(k<.6)puddle(X,Y,'rgba(200,230,255,.18)');else bones(X,Y,hr(i,j,6));}}
  if(pal.dec==='crypte'){[[r.x,r.y,1,1],[r.x+r.w,r.y,-1,1]].forEach(([cx,cy,sx,sy])=>{if(hr(r.x,r.y,cx)<.5)web(cx*PX,cy*PX,sx,sy);});}
  if(lair&&r===VD.stairs.room){for(let k=0;k<26;k++){const x=r.x+hr(k,1,2)*r.w,y=r.y+hr(k,2,2)*r.h;if(VD.solid(x,y))continue;if(k<12)goldPile(x*PX,y*PX);else scorch(x*PX,y*PX);if(k<5)UIL.push({x,y,r:1.6,c:[255,200,80],i:.35,fl:.1});}}});}
function shade(hex,p){let c=hex.replace('#','');if(c.length>6)c=c.slice(0,6);const n=parseInt(c,16);let r=(n>>16)+p,g=((n>>8)&255)+p,b=(n&255)+p;r=Math.max(0,Math.min(255,r));g=Math.max(0,Math.min(255,g));b=Math.max(0,Math.min(255,b));return`rgb(${r|0},${g|0},${b|0})`;}
function bones(X,Y,k){fx.save();fx.translate(X,Y);fx.rotate(k*6);fx.strokeStyle='#cfc7b0';fx.lineWidth=2.5;fx.lineCap='round';fx.beginPath();fx.moveTo(-7,0);fx.lineTo(7,0);fx.moveTo(-3,-5);fx.lineTo(4,5);fx.stroke();
 if(k>.6){fx.fillStyle='#d8d0b8';fx.beginPath();fx.arc(10,-4,4.5,0,TAU);fx.fill();fx.fillStyle='#222';fx.fillRect(8,-5,1.6,1.6);fx.fillRect(10.8,-5,1.6,1.6);}fx.restore();}
function puddle(X,Y,c){fx.fillStyle=c;fx.beginPath();fx.ellipse(X,Y,12,6,0,0,TAU);fx.fill();fx.fillStyle='rgba(255,255,255,.06)';fx.beginPath();fx.ellipse(X-3,Y-1,5,2,0,0,TAU);fx.fill();}
function rubble(X,Y){for(let i=0;i<5;i++){fx.fillStyle=i%2?'#5a544c':'#433e38';fx.beginPath();fx.arc(X+(hr(X,Y,i)-.5)*16,Y+(hr(Y,X,i)-.5)*10,1.5+hr(X,i,Y)*2.5,0,TAU);fx.fill();}}
function shroom(X,Y){for(let i=0;i<3;i++){const x=X+(i-1)*5,y=Y+(i%2)*3;fx.fillStyle='#d8e8e0';fx.fillRect(x-1,y-4,2,5);fx.fillStyle='#4fd0f0';fx.beginPath();fx.ellipse(x,y-4,4,2.6,0,Math.PI,0);fx.fill();}}
function moss(X,Y){fx.fillStyle='rgba(70,110,45,.45)';for(let i=0;i<4;i++){fx.beginPath();fx.ellipse(X+(hr(X,i,1)-.5)*20,Y+(hr(Y,i,2)-.5)*12,6,3.5,0,0,TAU);fx.fill();}}
function lavaCrack(X,Y,s){fx.strokeStyle='#ff7a1a';fx.lineWidth=2;fx.shadowColor='#ff5a00';fx.shadowBlur=8;fx.beginPath();let x=X-10,y=Y;fx.moveTo(x,y);for(let i=0;i<5;i++){x+=5;y+=(hr(s,i,3)-.5)*8;fx.lineTo(x,y);}fx.stroke();fx.shadowBlur=0;}
function grate(X,Y){fx.strokeStyle='#1a1414';fx.lineWidth=2;fx.strokeRect(X-9,Y-9,18,18);for(let i=-6;i<=6;i+=4){fx.beginPath();fx.moveTo(X+i,Y-9);fx.lineTo(X+i,Y+9);fx.stroke();}fx.fillStyle='rgba(255,90,20,.25)';fx.fillRect(X-8,Y-8,16,16);}
function crystal(X,Y){for(let i=0;i<3;i++){const h=8+i*3;fx.fillStyle=i===1?'#cfefff':'#8cc8ee';fx.beginPath();fx.moveTo(X+(i-1)*5,Y);fx.lineTo(X+(i-1)*5-3,Y-h*.4);fx.lineTo(X+(i-1)*5,Y-h);fx.lineTo(X+(i-1)*5+3,Y-h*.4);fx.fill();}}
function web(X,Y,sx,sy){fx.strokeStyle='rgba(220,220,230,.22)';fx.lineWidth=1;for(let i=1;i<=3;i++){fx.beginPath();fx.arc(X,Y,i*7,sx>0?0:Math.PI/2,sx>0?Math.PI/2:Math.PI);fx.stroke();}
 for(let a=0;a<4;a++){const t=(sx>0?0:Math.PI/2)+a*Math.PI/6;fx.beginPath();fx.moveTo(X,Y);fx.lineTo(X+Math.cos(t)*24,Y+Math.sin(t)*24);fx.stroke();}}
function goldPile(X,Y){for(let i=0;i<7;i++){fx.fillStyle=i%2?'#f2c14a':'#c9932a';fx.beginPath();fx.ellipse(X+(hr(X,i,1)-.5)*14,Y+(hr(Y,i,1)-.5)*7,3,2,0,0,TAU);fx.fill();}}
function scorch(X,Y){const g=fx.createRadialGradient(X,Y,0,X,Y,18);g.addColorStop(0,'rgba(0,0,0,.55)');g.addColorStop(1,'rgba(0,0,0,0)');fx.fillStyle=g;fx.beginPath();fx.arc(X,Y,18,0,TAU);fx.fill();}
function stamp(k,x,y,c){if(!fx)return;const X=x*PX,Y=y*PX;
 if(k==='blood'){fx.fillStyle=c||'rgba(90,10,10,.6)';for(let i=0;i<6;i++){fx.beginPath();fx.ellipse(X+(Math.random()-.5)*20,Y+(Math.random()-.5)*12,2+Math.random()*7,1.5+Math.random()*4,Math.random()*3,0,TAU);fx.fill();}}
 else if(k==='bones'){bones(X,Y,Math.random());}else if(k==='scorch')scorch(X,Y);else if(k==='debris')rubble(X,Y);}

/* ---------- brouillard ---------- */
function updFog(){if(!fogImg||!VD||!VD.seen)return;const d=fogImg.data,s=VD.seen,v=VD.vis;for(let i=0;i<s.length;i++)d[i*4+3]=v[i]?0:s[i]?140:255;fogx.putImageData(fogImg,0,0);}

/* ---------- particules & textes ---------- */
function part(o){if(P_.length<520)P_.push(Object.assign({vx:0,vy:0,life:.6,size:3,g:0,add:1,drag:1},o,{max:o.life||.6}));}
function burst(x,y,c,n=12,sp=3,o={}){for(let i=0;i<n;i++){const a=Math.random()*TAU,s=sp*(.3+Math.random()*.7);part(Object.assign({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.3+Math.random()*.5,c,size:2+Math.random()*3,drag:.92},o));}}
function text(x,y,t,c,big){TXT.push({x,y,t,c,big,life:1});}
function flash(x,y,r,c,t=.25){FL.push({x,y,r,c,t,T:t});}

/* ---------- sprites ---------- */
function shadow(c,X,Y,rx,ry){c.fillStyle='rgba(0,0,0,.45)';c.beginPath();c.ellipse(X,Y,rx,ry,0,0,TAU);c.fill();}
function rg(c,x,y,r,c1,c2){const g=c.createRadialGradient(x-r*.35,y-r*.4,r*.1,x,y,r);g.addColorStop(0,c1);g.addColorStop(1,c2);return g;}
const ARMP=[['#b08a5a','#4a3420'],['#8a643e','#2e2014'],['#c8ccd2','#4f545c'],['#eef2f6','#5d636e'],['#c8bc7a','#4a4620'],['#6a7084','#1c2028']],TRIM=['#c9a640','#7f9cff','#ffd84a','#ff9a3a'];
function drawHero(c,X,Y,s,st){const at=st.at==null?3:st.at,ar=st.ar||0,AP=ARMP[at],TR=TRIM[ar];const f=st.face,cs=Math.cos(f),sn=Math.sin(f),bob=Math.sin(st.walk*11)*s*.025,by=Y-s*.2+bob;
 shadow(c,X,Y+s*.2,s*.3,s*.12);
 if(st.iframe>0)c.globalAlpha=.55;
 // cape
 const sw=Math.sin(st.walk*8)*s*.05;c.fillStyle=['#6e1414','#1e2a6e','#6e5a14','#7a1010'][ar];c.beginPath();c.moveTo(X-s*.2,by-s*.1);c.lineTo(X+s*.2,by-s*.1);c.lineTo(X+s*.24-cs*s*.25+sw,by+s*.32-sn*s*.12);c.lineTo(X-s*.24-cs*s*.25+sw,by+s*.32-sn*s*.12);c.closePath();c.fill();
 c.fillStyle='#4a0c0c';c.fillRect(X-s*.2,by-s*.12,s*.4,s*.05);
 // jambes
 const lg=Math.sin(st.walk*11)*s*.06;c.fillStyle='#2a2a30';c.fillRect(X-s*.12,by+s*.1+lg,s*.09,s*.16);c.fillRect(X+s*.03,by+s*.1-lg,s*.09,s*.16);
 // bouclier (côté opposé à l'arme)
 const shx=X-sn*s*.24*(cs>=0?1:-1)-cs*s*.04,shy=by+s*.04;const behind=sn<-.3;
 const drawShield=()=>{c.fillStyle=rg(c,shx,shy,s*.15,'#9c2a22','#4a0e0b');c.beginPath();c.ellipse(shx,shy,s*.11,s*.15,0,0,TAU);c.fill();c.strokeStyle='#c9a640';c.lineWidth=s*.025;c.stroke();
  c.fillStyle='#e8c060';c.beginPath();c.moveTo(shx,shy-s*.07);c.lineTo(shx+s*.04,shy+s*.03);c.lineTo(shx,shy+s*.07);c.lineTo(shx-s*.04,shy+s*.03);c.fill();};
 if(behind)drawShield();
 // torse
 c.fillStyle=rg(c,X,by,s*.24,AP[0],AP[1]);c.beginPath();c.ellipse(X,by,s*.21,s*.2,0,0,TAU);c.fill();c.strokeStyle='#1b1d22';c.lineWidth=1.2;c.stroke();
 if(at===2){c.fillStyle='rgba(0,0,0,.22)';for(let i=-3;i<=3;i++)for(let j=-2;j<=2;j++)c.fillRect(X+i*s*.05,by+j*s*.05,s*.018,s*.018);}
 if(at===4){c.strokeStyle='rgba(60,50,10,.5)';c.lineWidth=1;for(let j=-2;j<=2;j++){c.beginPath();c.arc(X,by+j*s*.06,s*.18,.3,Math.PI-.3);c.stroke();}}
 c.fillStyle=TR;c.fillRect(X-s*.18,by+s*.08,s*.36,s*.035);
 if(ar===3||at===5){c.globalCompositeOperation='lighter';c.strokeStyle=ar===3?'rgba(255,150,50,.85)':'rgba(120,200,255,.7)';c.lineWidth=s*.02;c.beginPath();c.moveTo(X,by-s*.12);c.lineTo(X-s*.06,by);c.lineTo(X,by+s*.06);c.lineTo(X+s*.06,by);c.closePath();c.stroke();c.globalCompositeOperation='source-over';}
 [-1,1].forEach(d=>{c.fillStyle=rg(c,X+d*s*.18,by-s*.08,s*.09,ARMP[at][0],ARMP[at][1]);c.beginPath();c.arc(X+d*s*.18,by-s*.08,s*.085,0,TAU);c.fill();});
 // casque
 const hy=by-s*.24;c.fillStyle=rg(c,X,hy,s*.15,'#f4f6f8','#5a606a');c.beginPath();c.arc(X,hy,s*.14,0,TAU);c.fill();c.strokeStyle='#2b2e35';c.stroke();
 if(sn>-.3){c.strokeStyle='#15161a';c.lineWidth=s*.035;c.beginPath();c.moveTo(X-s*.08+cs*s*.03,hy+s*.01);c.lineTo(X+s*.08+cs*s*.03,hy+s*.01);c.stroke();}
 c.fillStyle='#a3201f';c.beginPath();c.moveTo(X-s*.03,hy-s*.13);c.quadraticCurveTo(X-cs*s*.25,hy-s*.32,X-cs*s*.32,hy-s*.05);c.lineTo(X+s*.03,hy-s*.12);c.fill();
 if(!behind)drawShield();
 // arme
 const wc=st.wcol;let a;if(st.spin>0)a=st.spinA;else if(st.swing>0)a=st.swingA-1.3+(1-st.swing/.18)*2.6;else a=f+.8+Math.sin(st.walk*11)*.08;
 const hx=X+Math.cos(a)*s*.2,hy2=by+Math.sin(a)*s*.14;const tx=X+Math.cos(a)*s*.72,ty=by+Math.sin(a)*s*.58;
 if(st.wr>=2){c.shadowColor=wc;c.shadowBlur=st.wr===3?14:8;}
 c.strokeStyle='#ddd';c.lineWidth=s*.075;c.lineCap='round';c.beginPath();c.moveTo(hx,hy2);c.lineTo(tx,ty);c.stroke();c.strokeStyle=wc;c.lineWidth=s*.035;c.beginPath();c.moveTo(hx,hy2);c.lineTo(tx,ty);c.stroke();c.shadowBlur=0;
 c.strokeStyle='#8a6a2a';c.lineWidth=s*.05;c.beginPath();c.moveTo(hx-Math.sin(a)*s*.07,hy2+Math.cos(a)*s*.07);c.lineTo(hx+Math.sin(a)*s*.07,hy2-Math.cos(a)*s*.07);c.stroke();
 if(st.swing>0&&st.spin<=0){c.globalCompositeOperation='lighter';c.strokeStyle=`rgba(255,240,210,${st.swing*2.2})`;c.lineWidth=s*.16;c.beginPath();c.arc(X,by,s*.62,st.swingA-1.3,a);c.stroke();c.globalCompositeOperation='source-over';}
 if(st.spin>0){c.globalCompositeOperation='lighter';for(let i=0;i<3;i++){c.strokeStyle=`rgba(255,235,200,${.35-i*.1})`;c.lineWidth=s*.12;c.beginPath();c.arc(X,by,s*(1.6-i*.35),st.spinA-1.6,st.spinA);c.stroke();}c.globalCompositeOperation='source-over';}
 c.globalAlpha=1;}
function drawHeroCls(c,X,Y,s,cls,st){if(cls==='guerrier')return drawHero(c,X,Y,s,st);const f=st.face,cs=Math.cos(f),sn=Math.sin(f),bob=Math.sin(st.walk*11)*s*.025,by=Y-s*.2+bob;
 shadow(c,X,Y+s*.2,s*.28,s*.11);const lg=Math.sin(st.walk*11)*s*.05;
 const ar=st.ar||0,cast=st.cast||0,drw=st.draw||0;
 if(cls==='mage'){const RB=[['#5a4aa8','#1e1640'],['#3a5ac8','#101a48'],['#8a3a9a','#2a0a30'],['#b02a2a','#3a0606']][ar];c.fillStyle=rg(c,X,by+s*.05,s*.32,RB[0],RB[1]);c.beginPath();c.moveTo(X-s*.2,by-s*.12);c.lineTo(X+s*.2,by-s*.12);c.lineTo(X+s*.28,by+s*.32);c.lineTo(X-s*.28,by+s*.32);c.closePath();c.fill();
  c.fillStyle=['#c9a640','#9fb4ff','#ffd84a','#ff9a3a'][ar];c.fillRect(X-s*.2,by+s*.06,s*.4,s*.03);c.fillStyle='#e8c9a0';c.beginPath();c.arc(X,by-s*.22,s*.11,0,TAU);c.fill();
  c.fillStyle=['#3a2c7a','#1e3a8a','#5a1a6a','#7a1414'][ar];c.beginPath();c.moveTo(X-s*.16,by-s*.16);c.quadraticCurveTo(X,by-s*.52,X+s*.16,by-s*.16);c.quadraticCurveTo(X,by-s*.3,X-s*.16,by-s*.16);c.fill();
  if(sn>-.3){c.fillStyle='#2a1a10';c.fillRect(X-s*.06,by-s*.22,s*.03,s*.03);c.fillRect(X+s*.03,by-s*.22,s*.03,s*.03);}
  const sx=X+s*.3-cast*s*.14,sy=by-cast*s*.3;c.strokeStyle='#6a4a2a';c.lineWidth=s*.05;c.beginPath();c.moveTo(sx+cast*s*.05,sy+s*.3);c.lineTo(sx,sy-s*.45);c.stroke();
  if(cast>0){c.strokeStyle='#e8c9a0';c.lineWidth=s*.06;c.beginPath();c.moveTo(X+s*.12,by-s*.05);c.lineTo(sx,sy-s*.1);c.stroke();}
  c.globalCompositeOperation='lighter';const gl=.6+.3*Math.sin(st.walk*3+(st.t||0)*3)+cast*.4,orR=s*(.3+cast*.45);c.fillStyle=rg(c,sx,sy-s*.5,orR,`rgba(150,170,255,${gl})`,'rgba(0,0,0,0)');c.beginPath();c.arc(sx,sy-s*.5,orR,0,TAU);c.fill();
  if(cast>.3)for(let i=0;i<3;i++){const a=(st.t||0)*6+i*2.1;c.fillStyle='rgba(200,215,255,.9)';c.beginPath();c.arc(sx+Math.cos(a)*s*.22*cast,sy-s*.5+Math.sin(a)*s*.12*cast,s*.025,0,TAU);c.fill();}c.globalCompositeOperation='source-over';
  c.fillStyle='#cfe0ff';c.beginPath();c.arc(sx,sy-s*.5,s*.07*(1+cast*.5),0,TAU);c.fill();}
 else{c.fillStyle='#2a2a1e';c.fillRect(X-s*.1,by+s*.1+lg,s*.08,s*.15);c.fillRect(X+s*.02,by+s*.1-lg,s*.08,s*.15);
  c.fillStyle=['#2f5a2a','#2a4a6a','#5a5a1a','#7a3a10'][ar];c.beginPath();c.moveTo(X-s*.2,by-s*.1);c.lineTo(X+s*.2,by-s*.1);c.lineTo(X+s*.24,by+s*.28);c.lineTo(X-s*.24,by+s*.28);c.closePath();c.fill();
  c.fillStyle=rg(c,X,by,s*.2,'#a8784a','#4a2e18');c.beginPath();c.ellipse(X,by,s*.16,s*.17,0,0,TAU);c.fill();
  c.fillStyle='#e8c9a0';c.beginPath();c.arc(X,by-s*.22,s*.1,0,TAU);c.fill();c.fillStyle='#3a6a32';c.beginPath();c.moveTo(X-s*.15,by-s*.14);c.quadraticCurveTo(X,by-s*.48,X+s*.15,by-s*.14);c.quadraticCurveTo(X,by-s*.28,X-s*.15,by-s*.14);c.fill();
  c.fillStyle='#c98a3a';c.beginPath();c.moveTo(X-s*.04,by-s*.31);c.quadraticCurveTo(X-s*.2,by-s*.42,X-s*.3,by-s*.3);c.lineTo(X-s*.05,by-s*.27);c.fill();
  const bx=X+s*.25,byy=by-s*.02-drw*s*.1;c.strokeStyle=ar>=2?['','','#c9a640','#ff9a3a'][ar]:'#7a4a1a';c.lineWidth=s*.04;c.beginPath();c.arc(bx-s*.12,byy,s*.32,-1.1,1.1);c.stroke();
  const p1x=bx-s*.12+Math.cos(-1.1)*s*.32,p1y=byy+Math.sin(-1.1)*s*.32,p2x=bx-s*.12+Math.cos(1.1)*s*.32,p2y=byy+Math.sin(1.1)*s*.32,mx=(p1x+p2x)/2-drw*s*.28,my=(p1y+p2y)/2;
  c.strokeStyle='#ddd';c.lineWidth=1;c.beginPath();c.moveTo(p1x,p1y);c.lineTo(mx,my);c.lineTo(p2x,p2y);c.stroke();
  if(drw>.05){c.strokeStyle='#e8dcc4';c.lineWidth=s*.02;c.beginPath();c.moveTo(mx,my);c.lineTo(bx+s*.22,my);c.stroke();c.fillStyle='#ccc';c.beginPath();c.moveTo(bx+s*.26,my);c.lineTo(bx+s*.2,my-s*.03);c.lineTo(bx+s*.2,my+s*.03);c.fill();}
  c.fillStyle='#5a3a1a';c.fillRect(X-s*.24,by-s*.18,s*.08,s*.22);c.fillStyle='#e8dcc4';for(let i=0;i<3;i++)c.fillRect(X-s*.23+i*s*.025,by-s*.24,s*.015,s*.07);}}
function eyes(c,X,Y,s,a,col,r=.04,sp=.08){const ex=Math.cos(a)*s*.06,ey=Math.sin(a)*s*.04;c.fillStyle=col;c.shadowColor=col;c.shadowBlur=6;c.beginPath();c.arc(X+ex-s*sp,Y+ey,s*r,0,TAU);c.arc(X+ex+s*sp,Y+ey,s*r,0,TAU);c.fill();c.shadowBlur=0;}
function drawMon(c,e,X,Y,s,t){const a=Math.atan2(VD.P.y-e.y,VD.P.x-e.x),fl=e.fl>0;let ox=0,oy=0;
 if(e.wind>0&&e.act==='melee'){const k=1-e.wind/e.wT;ox=-Math.cos(a)*s*.08*k;oy=-Math.sin(a)*s*.08*k;}
 if(e.cd>0&&e.cd>(e.lastCd||0)){e.lunge=.12;}e.lastCd=e.cd;if(e.lunge>0){e.lunge-=.016;ox=Math.cos(a)*s*.12;oy=Math.sin(a)*s*.12;}
 X+=ox;Y+=oy;const bob=Math.sin(e.ph*9)*s*.02,sz=e.r*s;shadow(c,X,Y+sz*.55,sz*.95,sz*.38);
 if(e.elite){const mc={rapide:'#7fe0ff',blinde:'#c0c0c0',vampire:'#ff3a5a',ardent:'#ff8a2a'}[e.mods[0]]||'#7f9cff';c.globalCompositeOperation='lighter';const g=c.createRadialGradient(X,Y,sz*.4,X,Y,sz*1.6);g.addColorStop(0,mc+'00');g.addColorStop(.7,mc+'44');g.addColorStop(1,mc+'00');c.fillStyle=g;c.beginPath();c.arc(X,Y,sz*1.6,0,TAU);c.fill();c.globalCompositeOperation='source-over';}
 const W=fl?'#fff':null,by=Y-sz*.35+bob;
 switch(e.k){
 case'gob':{c.fillStyle=W||rg(c,X,by,sz,'#8fc25a','#3c5f20');c.beginPath();c.ellipse(X,by,sz*.85,sz*.8,0,0,TAU);c.fill();
  c.fillStyle=W||'#6a9a3e';[-1,1].forEach(d=>{c.beginPath();c.moveTo(X+d*sz*.6,by-sz*.3);c.lineTo(X+d*sz*1.45,by-sz*.65);c.lineTo(X+d*sz*.7,by+sz*.05);c.fill();});
  c.fillStyle='#5a3a1a';c.fillRect(X-sz*.7,by+sz*.35,sz*1.4,sz*.25);eyes(c,X,by-sz*.15,s,a,'#ffe14a',.035,.07);
  c.strokeStyle='#bbb';c.lineWidth=2;c.beginPath();c.moveTo(X+Math.cos(a+.8)*sz*.8,by+Math.sin(a+.8)*sz*.6);c.lineTo(X+Math.cos(a+.5)*sz*1.5,by+Math.sin(a+.5)*sz*1.1);c.stroke();break;}
 case'ch':{c.fillStyle=W||rg(c,X,by,sz,'#7fb25a','#33501c');c.beginPath();c.ellipse(X,by,sz*.8,sz*.78,0,0,TAU);c.fill();
  ['#d33','#fc3','#3cf'].forEach((f,i)=>{c.strokeStyle=f;c.lineWidth=2.5;c.beginPath();c.moveTo(X-sz*.3+i*sz*.3,by-sz*.6);c.lineTo(X-sz*.5+i*sz*.5,by-sz*1.4);c.stroke();});
  c.fillStyle='#e8dcc4';c.beginPath();c.ellipse(X,by-sz*.2,sz*.42,sz*.34,0,0,TAU);c.fill();eyes(c,X,by-sz*.22,s,a,'#7fff7f',.03,.07);
  const sx=X+sz*1.1,sy=by;c.strokeStyle='#6a4a2a';c.lineWidth=3;c.beginPath();c.moveTo(sx,sy+sz*.8);c.lineTo(sx,sy-sz*1.1);c.stroke();c.fillStyle='#e8dcc4';c.beginPath();c.arc(sx,sy-sz*1.2,sz*.22,0,TAU);c.fill();
  c.globalCompositeOperation='lighter';c.fillStyle=rg(c,sx,sy-sz*1.2,sz*.6,'rgba(120,255,120,.7)','rgba(0,0,0,0)');c.beginPath();c.arc(sx,sy-sz*1.2,sz*.6,0,TAU);c.fill();c.globalCompositeOperation='source-over';break;}
 case'sq':case'ar':{c.fillStyle=W||'#c9c2ae';c.fillRect(X-sz*.45,by+sz*.1,sz*.9,sz*.75);c.strokeStyle='#5a5446';c.lineWidth=1.3;for(let i=0;i<3;i++){c.beginPath();c.moveTo(X-sz*.4,by+sz*(.25+i*.2));c.lineTo(X+sz*.4,by+sz*(.25+i*.2));c.stroke();}
  c.fillStyle=W||rg(c,X,by-sz*.3,sz*.7,'#f4efe0','#a59e88');c.beginPath();c.arc(X,by-sz*.3,sz*.62,0,TAU);c.fill();c.fillRect(X-sz*.3,by,sz*.6,sz*.28);
  c.fillStyle='#120e0a';const ex=Math.cos(a)*sz*.12;c.beginPath();c.ellipse(X-sz*.22+ex,by-sz*.32,sz*.15,sz*.19,0,0,TAU);c.ellipse(X+sz*.22+ex,by-sz*.32,sz*.15,sz*.19,0,0,TAU);c.fill();
  eyes(c,X+ex-sz*.0,by-sz*.32,s,a,e.k==='ar'?'#7fd0ff':'#ff6a3a',.022,.07);
  if(e.k==='ar'){c.strokeStyle='#7a5a2a';c.lineWidth=2.5;c.beginPath();c.arc(X+Math.cos(a)*sz*.9,by+Math.sin(a)*sz*.7,sz*.75,a-1.25,a+1.25);c.stroke();
   if(e.wind>0){c.strokeStyle=`rgba(255,80,60,${.12+.45*(1-e.wind/e.wT)})`;c.lineWidth=1.5;c.setLineDash([4,4]);c.beginPath();c.moveTo(X,by);c.lineTo(X+Math.cos(e.wa)*s*6,by+Math.sin(e.wa)*s*6);c.stroke();c.setLineDash([]);}}
  else{c.strokeStyle='#9aa0a8';c.lineWidth=3;c.beginPath();const sa=a+(e.wind>0?-1.2:.7);c.moveTo(X+Math.cos(sa)*sz*.5,by+Math.sin(sa)*sz*.4);c.lineTo(X+Math.cos(sa)*sz*1.7,by+Math.sin(sa)*sz*1.3);c.stroke();}break;}
 case'sp':{c.strokeStyle=W||'#2a1830';c.lineWidth=2.4;for(let i=0;i<4;i++){const w=Math.sin(e.ph*16+i*1.7)*sz*.2;[-1,1].forEach(d=>{c.beginPath();c.moveTo(X,by);c.quadraticCurveTo(X+d*sz*1.1,by-sz*.9+i*sz*.45,X+d*sz*1.6,by-sz*.3+i*sz*.45+w);c.stroke();});}
  c.fillStyle=W||rg(c,X,by,sz,'#5a3a6a','#1a0e22');c.beginPath();c.ellipse(X,by+sz*.15,sz*.85,sz*.75,0,0,TAU);c.fill();c.beginPath();c.arc(X,by-sz*.45,sz*.45,0,TAU);c.fill();
  c.fillStyle='#ff2a2a';c.shadowColor='#f00';c.shadowBlur=6;for(let i=0;i<4;i++){c.beginPath();c.arc(X-sz*.2+i*sz*.13,by-sz*.55+(i%2)*sz*.06,sz*.06,0,TAU);c.fill();}c.shadowBlur=0;
  if(e.wind>0&&e.act==='leap'){c.strokeStyle='rgba(255,60,60,.5)';c.lineWidth=2;c.beginPath();c.arc(X,by,sz*1.4*(1-e.wind/e.wT)+sz*.5,0,TAU);c.stroke();}break;}
 case'py':{c.fillStyle=W||rg(c,X,by,sz,'#b0407a','#3a0e28');c.beginPath();c.moveTo(X,by-sz*1.2);c.quadraticCurveTo(X+sz*1.1,by+sz*.2,X+sz*.8,by+sz*.8);c.lineTo(X-sz*.8,by+sz*.8);c.quadraticCurveTo(X-sz*1.1,by+sz*.2,X,by-sz*1.2);c.fill();
  c.fillStyle='#14060e';c.beginPath();c.ellipse(X+Math.cos(a)*sz*.1,by-sz*.45,sz*.35,sz*.3,0,0,TAU);c.fill();eyes(c,X,by-sz*.47,s,a,'#ffb030',.025,.06);
  const hx=X+Math.cos(a)*sz*.95,hy=by+Math.sin(a)*sz*.5;const ch=e.wind>0&&e.act==='fireball'?1-e.wind/e.wT:0;c.globalCompositeOperation='lighter';c.fillStyle=rg(c,hx,hy,sz*(.35+ch*.5),'#fff3b0','rgba(255,90,20,0)');c.beginPath();c.arc(hx,hy,sz*(.4+ch*.6),0,TAU);c.fill();c.globalCompositeOperation='source-over';
  if(Math.random()<.3)part({x:e.x+Math.cos(a)*e.r*.95,y:e.y+Math.sin(a)*e.r*.5-e.r*.35,vy:-1.2,vx:(Math.random()-.5)*.4,life:.45,c:'#ff8a2a',size:2.5});break;}
 case'go':{c.fillStyle=W||rg(c,X,by,sz*1.1,'#a59e8e','#4a453c');c.beginPath();c.moveTo(X-sz*.9,by+sz*.7);c.lineTo(X-sz*1,by-sz*.3);c.lineTo(X-sz*.5,by-sz*.95);c.lineTo(X+sz*.5,by-sz*.95);c.lineTo(X+sz*1,by-sz*.3);c.lineTo(X+sz*.9,by+sz*.7);c.closePath();c.fill();c.strokeStyle='#2a2620';c.lineWidth=1.5;c.stroke();
  const lift=e.wind>0&&e.act==='slam'?(1-e.wind/e.wT)*sz*.5:0;[-1,1].forEach(d=>{c.fillStyle=W||rg(c,X+d*sz*1.2,by-lift,sz*.5,'#9c9585','#3e3a32');c.beginPath();c.arc(X+d*sz*1.2,by+sz*.1-lift,sz*.42,0,TAU);c.fill();});
  c.strokeStyle='#58ffd0';c.shadowColor='#3fffc0';c.shadowBlur=8;c.lineWidth=2;c.beginPath();c.moveTo(X-sz*.3,by-sz*.2);c.lineTo(X,by+sz*.2);c.lineTo(X+sz*.3,by-sz*.2);c.stroke();eyes(c,X,by-sz*.55,s,a,'#58ffd0',.03,.1);c.shadowBlur=0;break;}
 case'wy':{const fw=Math.sin(e.ph*18)*sz*.5;c.fillStyle=W||'#9a2a1a';[-1,1].forEach(d=>{c.beginPath();c.moveTo(X,by);c.lineTo(X+d*sz*1.8,by-sz*.7-fw);c.lineTo(X+d*sz*1.2,by+sz*.2);c.lineTo(X+d*sz*.4,by+sz*.3);c.closePath();c.fill();});
  c.fillStyle=W||rg(c,X,by,sz,'#e05030','#5a1208');c.beginPath();c.ellipse(X,by,sz*.55,sz*.75,a+Math.PI/2,0,TAU);c.fill();c.beginPath();c.arc(X+Math.cos(a)*sz*.55,by+Math.sin(a)*sz*.45,sz*.35,0,TAU);c.fill();eyes(c,X+Math.cos(a)*sz*.6,by+Math.sin(a)*sz*.45,s,a,'#ffd040',.022,.05);break;}}
 // barre de vie
 if(e.hp<e.mhp){const w=Math.max(s*.6,sz*2.2);c.fillStyle='rgba(0,0,0,.7)';c.fillRect(X-w/2-1,Y-sz*2-s*.2,w+2,5);c.fillStyle=e.elite?'#7f9cff':'#d22';c.fillRect(X-w/2,Y-sz*2-s*.2+1,w*Math.max(0,e.hp/e.mhp),3);}
 if(e.cnt>1){c.font=`800 ${Math.round(s*.3)}px 'Alegreya Sans',sans-serif`;c.textAlign='center';c.fillStyle='rgba(0,0,0,.75)';c.beginPath();c.arc(X+sz*1.3,Y-sz*1.3,s*.2,0,TAU);c.fill();c.strokeStyle='#d8b25a';c.lineWidth=1.5;c.stroke();c.fillStyle='#f0c46a';c.fillText('×'+e.cnt,X+sz*1.3,Y-sz*1.3+s*.1);}
 if(e.elite){c.font=`600 ${Math.round(s*.28)}px Cinzel,serif`;c.textAlign='center';c.fillStyle='#000';c.fillText(e.n,X+1,Y-sz*2-s*.3+1);c.fillStyle='#9fb4ff';c.fillText(e.n,X,Y-sz*2-s*.3);}}
function drawDragon(c,e,X,Y,s){const col=BOSSCOL[e.el],a=Math.atan2(VD.P.y-e.y,VD.P.x-e.x),r=e.r*s,fl=e.fl>0,t=e.ph,flap=Math.sin(t*4.2)*r*.45;
 shadow(c,X,Y+r*.6,r*2.6,r*.9);c.save();c.translate(X,Y-r*.4);c.rotate(a+Math.PI/2);
 const body=fl?'#fff':col[0],dark=fl?'#ddd':col[1];
 // ailes
 [-1,1].forEach(d=>{const g=c.createLinearGradient(0,0,d*r*2.8,0);g.addColorStop(0,body);g.addColorStop(1,dark);c.fillStyle=g;c.beginPath();c.moveTo(d*r*.3,-r*.2);
  c.lineTo(d*r*2.9,-r*.9-flap);c.lineTo(d*r*2.6,-r*.1-flap*.5);c.lineTo(d*r*2.2,r*.4-flap*.2);c.lineTo(d*r*1.7,r*.1);c.lineTo(d*r*1.3,r*.7);c.lineTo(d*r*.4,r*.4);c.closePath();c.fill();
  c.strokeStyle='rgba(0,0,0,.45)';c.lineWidth=1.5;c.stroke();c.beginPath();c.moveTo(d*r*.3,-r*.2);c.lineTo(d*r*2.2,r*.4-flap*.2);c.moveTo(d*r*.3,-r*.2);c.lineTo(d*r*1.3,r*.7);c.stroke();});
 // queue
 c.fillStyle=body;c.beginPath();c.moveTo(-r*.3,r*.6);c.quadraticCurveTo(Math.sin(t*2.5)*r*1.2,r*1.8,Math.sin(t*2.5+1)*r*.5,r*2.7);c.lineTo(r*.3,r*.6);c.fill();
 // corps
 c.fillStyle=rg(c,0,0,r*1.1,shade(col[0],40),dark);c.beginPath();c.ellipse(0,0,r*.72,r*1.05,0,0,TAU);c.fill();
 c.fillStyle='rgba(0,0,0,.25)';for(let i=0;i<4;i++){c.beginPath();c.moveTo(-r*.12,-r*.5+i*r*.3);c.lineTo(0,-r*.62+i*r*.3);c.lineTo(r*.12,-r*.5+i*r*.3);c.fill();}
 // tête
 c.fillStyle=rg(c,0,-r*1.3,r*.55,shade(col[0],50),dark);c.beginPath();c.ellipse(0,-r*1.3,r*.42,r*.58,0,0,TAU);c.fill();
 c.fillStyle=fl?'#fff':'#e8dcc4';[-1,1].forEach(d=>{c.beginPath();c.moveTo(d*r*.25,-r*1.55);c.lineTo(d*r*.55,-r*2.0);c.lineTo(d*r*.36,-r*1.45);c.fill();});
 const br=e.act==='breath'&&e.aw>0?1-e.aw/.85:0;c.fillStyle=col[2];c.shadowColor=col[2];c.shadowBlur=12;[-1,1].forEach(d=>{c.beginPath();c.ellipse(d*r*.17,-r*1.48,r*.08,r*.05,0,0,TAU);c.fill();});
 if(br>0||e.act==='breath'){c.globalCompositeOperation='lighter';c.fillStyle=rg(c,0,-r*1.8,r*(.4+br*.5),'#fff',col[2]+'00');c.beginPath();c.arc(0,-r*1.85,r*(.35+br*.55),0,TAU);c.fill();c.globalCompositeOperation='source-over';}
 c.shadowBlur=0;c.restore();}
function itemIcon(c,s,X,Y,sz,col){c.save();c.translate(X,Y);c.strokeStyle=col;c.fillStyle=col;c.lineWidth=sz*.14;c.lineCap='round';
 if(s==='arme'){c.rotate(-.8);c.beginPath();c.moveTo(0,-sz*.55);c.lineTo(0,sz*.35);c.stroke();c.beginPath();c.moveTo(-sz*.22,sz*.25);c.lineTo(sz*.22,sz*.25);c.stroke();}
 else if(s==='armure'){c.beginPath();c.moveTo(-sz*.4,-sz*.35);c.lineTo(sz*.4,-sz*.35);c.lineTo(sz*.3,sz*.4);c.lineTo(-sz*.3,sz*.4);c.closePath();c.fill();}
 else if(s==='casque'){c.beginPath();c.arc(0,0,sz*.38,Math.PI,0);c.lineTo(sz*.38,sz*.25);c.lineTo(-sz*.38,sz*.25);c.fill();}
 else if(s==='anneau'){c.beginPath();c.arc(0,0,sz*.28,0,TAU);c.stroke();}
 else{c.beginPath();c.arc(0,-sz*.1,sz*.3,Math.PI*.1,Math.PI*.9,true);c.stroke();c.beginPath();c.arc(0,sz*.25,sz*.15,0,TAU);c.fill();}c.restore();}
function drawObj(c,o,X,Y,s,t){if(o.t==='brk'){shadow(c,X,Y+s*.16,s*.22,s*.09);
  if(o.k==='tonneau'){c.fillStyle=rg(c,X,Y-s*.15,s*.3,'#9a6a3a','#4a2e14');c.beginPath();c.ellipse(X,Y-s*.12,s*.2,s*.27,0,0,TAU);c.fill();c.strokeStyle='#2a1a0a';c.lineWidth=2;[-.25,0,.15].forEach(k=>{c.beginPath();c.ellipse(X,Y-s*.12+k*s*.5,s*.2,s*.05,0,0,TAU);c.stroke();});c.fillStyle='#7a4f26';c.beginPath();c.ellipse(X,Y-s*.37,s*.17,s*.06,0,0,TAU);c.fill();}
  else{c.fillStyle=rg(c,X,Y-s*.12,s*.25,'#c98a5a','#5a321a');c.beginPath();c.moveTo(X-s*.08,Y-s*.42);c.lineTo(X+s*.08,Y-s*.42);c.quadraticCurveTo(X+s*.28,Y-s*.2,X+s*.12,Y+s*.1);c.lineTo(X-s*.12,Y+s*.1);c.quadraticCurveTo(X-s*.28,Y-s*.2,X-s*.08,Y-s*.42);c.fill();c.strokeStyle='#e8c070';c.lineWidth=1.3;c.beginPath();c.moveTo(X-s*.17,Y-s*.18);c.lineTo(X+s*.17,Y-s*.18);c.stroke();}}
 else if(o.t==='chest'){shadow(c,X,Y+s*.18,s*.38,s*.12);const gold=o.gold;c.fillStyle=gold?rg(c,X,Y,s*.4,'#f2c450','#7a5410'):rg(c,X,Y,s*.4,'#8a5a2a','#3a2410');c.fillRect(X-s*.32,Y-s*.25,s*.64,s*.4);
  c.fillStyle=gold?'#ffe08a':'#a8742f';c.beginPath();c.moveTo(X-s*.32,Y-s*.25);c.quadraticCurveTo(X,Y-s*.5,X+s*.32,Y-s*.25);c.fill();c.strokeStyle='#1a1006';c.lineWidth=2;c.strokeRect(X-s*.32,Y-s*.25,s*.64,s*.4);
  c.fillStyle='#d8d0c0';c.fillRect(X-s*.05,Y-s*.18,s*.1,s*.12);if(gold&&Math.random()<.08)part({x:o.x+(Math.random()-.5)*.6,y:o.y-.3,vy:-.6,life:.8,c:'#ffe08a',size:2});}
 else if(o.t==='shrine'){const cc={fureur:'#ff4a3a',celerite:'#5affc8',bastion:'#d8d0c0',arcane:'#b47aff',fortune:'#ffd84a'}[o.k];shadow(c,X,Y+s*.2,s*.42,s*.15);
  c.fillStyle=rg(c,X,Y,s*.5,'#8a8478','#3a362e');c.beginPath();c.moveTo(X-s*.4,Y+s*.18);c.lineTo(X-s*.28,Y-s*.15);c.lineTo(X+s*.28,Y-s*.15);c.lineTo(X+s*.4,Y+s*.18);c.fill();
  const fy=Y-s*.55+Math.sin(t*2.5)*s*.06;if(!o.used){c.globalCompositeOperation='lighter';c.fillStyle=rg(c,X,fy,s*.6,cc,'rgba(0,0,0,0)');c.beginPath();c.arc(X,fy,s*.6,0,TAU);c.fill();c.globalCompositeOperation='source-over';}
  c.fillStyle=o.used?'#555':cc;c.beginPath();c.moveTo(X,fy-s*.28);c.lineTo(X+s*.14,fy);c.lineTo(X,fy+s*.28);c.lineTo(X-s*.14,fy);c.fill();
  if(!o.used&&Math.random()<.15)part({x:o.x+(Math.random()-.5)*.5,y:o.y-.5,vy:-.8,life:.9,c:cc,size:2});}}
function drawPillar(c,X,Y,s){c.fillStyle='rgba(0,0,0,.4)';c.beginPath();c.ellipse(X+s*.08,Y+s*.28,s*.48,s*.2,0,0,TAU);c.fill();
 const g=c.createLinearGradient(X-s*.36,0,X+s*.36,0);g.addColorStop(0,shade(pal.cap,-25));g.addColorStop(.35,pal.capHi);g.addColorStop(1,shade(pal.cap,-35));
 c.fillStyle=g;c.fillRect(X-s*.32,Y-s*1.25,s*.64,s*1.45);c.fillStyle=shade(pal.cap,-10);c.fillRect(X-s*.42,Y+s*.05,s*.84,s*.2);c.fillRect(X-s*.42,Y-s*1.35,s*.84,s*.18);
 c.fillStyle=pal.capHi;c.fillRect(X-s*.42,Y-s*1.38,s*.84,s*.05);c.strokeStyle='rgba(0,0,0,.25)';c.lineWidth=1;for(let i=1;i<4;i++){c.beginPath();c.moveTo(X-s*.32+i*s*.16,Y-s*1.17);c.lineTo(X-s*.32+i*s*.16,Y+s*.05);c.stroke();}}
function drawMerch(c,X,Y,s,t){shadow(c,X,Y+s*.18,s*.3,s*.12);const by=Y-s*.15;
 c.fillStyle=rg(c,X,by,s*.3,'#8a5a3a','#3a2414');c.beginPath();c.ellipse(X,by,s*.27,s*.24,0,0,TAU);c.fill();
 c.fillStyle='#c98a5a';c.beginPath();c.arc(X,by-s*.22,s*.13,0,TAU);c.fill();c.fillStyle='#d9a040';c.beginPath();c.moveTo(X-s*.13,by-s*.2);c.quadraticCurveTo(X,by+s*.25,X+s*.13,by-s*.2);c.fill();
 c.fillStyle='#4a2e18';c.beginPath();c.arc(X,by-s*.3,s*.13,Math.PI,0);c.fill();
 const lx=X+s*.32,ly=by-s*.05+Math.sin(t*2)*s*.02;c.strokeStyle='#5a4a30';c.lineWidth=1.5;c.beginPath();c.moveTo(lx,ly-s*.15);c.lineTo(lx,ly-s*.08);c.stroke();c.fillStyle='#ffd27a';c.shadowColor='#ffb040';c.shadowBlur=10;c.fillRect(lx-s*.05,ly-s*.08,s*.1,s*.12);c.shadowBlur=0;
 c.font=`600 ${Math.round(s*.28)}px Cinzel,serif`;c.textAlign='center';c.fillStyle='#000';c.fillText('Borin',X+1,Y-s*.68+1);c.fillStyle='#f0c46a';c.fillText('Borin',X,Y-s*.68);}
function drawLoot(c,l,X,Y,s,t){if(l.t==='gold'){for(let i=0;i<4;i++){c.fillStyle=i%2?'#ffd84a':'#c9932a';c.beginPath();c.ellipse(X+(i-1.5)*s*.07,Y-(i%2)*s*.04,s*.07,s*.05,0,0,TAU);c.fill();}if(Math.random()<.03)part({x:l.x,y:l.y-.1,vy:-.4,life:.4,c:'#fff6c0',size:2});return;}
 if(l.t==='pot'){c.fillStyle=rg(c,X,Y-s*.08,s*.14,'#ff8a7a','#8a0d0d');c.beginPath();c.arc(X,Y-s*.06,s*.12,0,TAU);c.fill();c.fillStyle='#ccc';c.fillRect(X-s*.04,Y-s*.25,s*.08,s*.09);return;}
 const it=l.it,col=RCOL[it.rar];
 if(it.rar>=2){c.globalCompositeOperation='lighter';const h=it.rar===3?s*3.2:s*1.6;const g=c.createLinearGradient(0,Y-h,0,Y);g.addColorStop(0,col+'00');g.addColorStop(1,col+(it.rar===3?'88':'55'));c.fillStyle=g;c.fillRect(X-s*.12,Y-h,s*.24,h);c.globalCompositeOperation='source-over';
  if(it.rar===3&&Math.random()<.25)part({x:l.x+(Math.random()-.5)*.2,y:l.y,vy:-2.5,life:.8,c:col,size:2});}
 c.save();c.shadowColor=col;c.shadowBlur=8;itemIcon(c,it.s,X,Y-s*.1,s*.42,col);c.restore();
 c.font=`700 ${Math.round(s*.27)}px 'Alegreya Sans',sans-serif`;LBL.push({x:X,y:Y-s*.72,w:c.measureText(it.n).width+10,h:s*.34,t:it.n,col,r:it.rar});}

/* ---------- dessin principal ---------- */
let VR_follow=null;let VW,VH,TS,cam={x:0,y:0},shakeV=0,heroSt={walk:0,lx:0,ly:0},spin=0,spinA=0;
function view(w,h,ts){VW=w;VH=h;TS=ts;if(!lc){lc=document.createElement('canvas');lx=lc.getContext('2d');}lc.width=Math.ceil(w/2);lc.height=Math.ceil(h/2);vg=null;}
function shake(v){shakeV=Math.max(shakeV,v);}
function draw(c,dt,t){if(!floorCv||!VD)return;const P=VD.P;shakeV=Math.max(0,shakeV-dt*1.5);
 const ck=dt>0?Math.min(1,dt*10):1;cam.x+=(P.x-cam.x)*ck;cam.y+=(P.y-cam.y)*ck;
 const sx=(Math.random()-.5)*shakeV*30,sy=(Math.random()-.5)*shakeV*30;
 const ox=VW/2-cam.x*TS+sx,oy=VH/2-cam.y*TS+sy,X=x=>x*TS+ox,Y=y=>y*TS+oy;
 c.fillStyle='#000';c.fillRect(0,0,VW,VH);
 // sol pré-rendu
 const k=TS/PX,x0=Math.max(0,(-ox)/k),y0=Math.max(0,(-oy)/k);c.imageSmoothingEnabled=true;
 c.drawImage(floorCv,x0,y0,Math.min(floorCv.width-x0,VW/k+2),Math.min(floorCv.height-y0,VH/k+2),ox+x0*k,oy+y0*k,Math.min(floorCv.width-x0,VW/k+2)*k,Math.min(floorCv.height-y0,VH/k+2)*k);
 // escalier verrouillé / lueur
 {const s=VD.stairs;const a=.35+.25*Math.sin(t*3);c.globalCompositeOperation='lighter';c.fillStyle=VD.bossAlive?`rgba(255,40,30,${a*.5})`:`rgba(255,200,90,${a*.45})`;c.fillRect(X(s.x),Y(s.y),TS,TS);c.globalCompositeOperation='source-over';}
 // flammes des torches et braseros
 c.globalCompositeOperation='lighter';UIL.forEach(l=>{if(!l.k)return;const px=X(l.x),py=Y(l.y)-(l.k==='torch'?TS*.28:TS*.2);if(px<-40||py<-40||px>VW+40||py>VH+40)return;if(!VD.seen[((l.y)|0)*VD.W+(l.x|0)]&&!VD.seen[((l.y+1)|0)*VD.W+(l.x|0)])return;
  const fz=(l.k==='torch'?.22:.36)*TS*(1+Math.sin(t*14+l.x*3)*.12);const g=c.createRadialGradient(px,py,0,px,py,fz);g.addColorStop(0,'rgba(255,250,210,.95)');g.addColorStop(.35,'rgba(255,160,50,.8)');g.addColorStop(1,'rgba(255,60,0,0)');c.fillStyle=g;
  c.beginPath();c.ellipse(px,py,fz*.6,fz,0,0,TAU);c.fill();});c.globalCompositeOperation='source-over';
 // zones au sol & télégraphes
 VD.GZ.forEach(z=>{const col=ELC[z.el]||'#f80';const g=c.createRadialGradient(X(z.x),Y(z.y),0,X(z.x),Y(z.y),z.r*TS);g.addColorStop(0,col+'88');g.addColorStop(1,col+'00');c.fillStyle=g;c.beginPath();c.arc(X(z.x),Y(z.y),z.r*TS,0,TAU);c.fill();
  if(Math.random()<.3)part({x:z.x+(Math.random()-.5)*z.r*1.4,y:z.y+(Math.random()-.5)*z.r,vy:-1,life:.5,c:col,size:2.5});});
 VD.HZ.forEach(h=>{const p=1-h.t/h.T,col=h.tele?(ELC[h.el]||'#f44'):'#ff3a2a';c.save();c.translate(X(h.x),Y(h.y));
  if(h.k==='circle'){c.fillStyle='rgba(255,40,30,.14)';c.beginPath();c.arc(0,0,h.r*TS,0,TAU);c.fill();c.fillStyle='rgba(255,60,40,.28)';c.beginPath();c.arc(0,0,h.r*TS*p,0,TAU);c.fill();c.strokeStyle='rgba(255,90,60,.9)';c.lineWidth=2;c.beginPath();c.arc(0,0,h.r*TS,0,TAU);c.stroke();}
  else{c.rotate(h.a);c.fillStyle=h.tele?'rgba(255,120,40,.12)':'rgba(255,40,30,.14)';c.beginPath();c.moveTo(0,0);c.arc(0,0,h.r*TS,-h.w/2,h.w/2);c.closePath();c.fill();c.fillStyle=h.tele?'rgba(255,140,40,.22)':'rgba(255,60,40,.3)';c.beginPath();c.moveTo(0,0);c.arc(0,0,h.r*TS*p,-h.w/2,h.w/2);c.closePath();c.fill();c.strokeStyle=col;c.lineWidth=2;c.beginPath();c.moveTo(0,0);c.arc(0,0,h.r*TS,-h.w/2,h.w/2);c.closePath();c.stroke();}
  c.restore();});
 // sprites triés en profondeur
 const L=[],inV=(x,y,m=2)=>x>cam.x-VW/2/TS-m&&x<cam.x+VW/2/TS+m&&y>cam.y-VH/2/TS-m&&y<cam.y+VH/2/TS+m;
 const vis=(x,y)=>VD.vis[(y|0)*VD.W+(x|0)];
 for(let y=Math.floor(cam.y-VH/2/TS-1);y<cam.y+VH/2/TS+3;y++)for(let x=Math.floor(cam.x-VW/2/TS-1);x<cam.x+VW/2/TS+1;x++)if(VD.at(x,y)===3&&VD.seen[y*VD.W+x])L.push({y:y+.5,f:()=>drawPillar(c,X(x+.5),Y(y+.5),TS)});
 VD.obj.forEach(o=>{if(inV(o.x,o.y)&&VD.seen[(o.y|0)*VD.W+(o.x|0)])L.push({y:o.y,f:()=>drawObj(c,o,X(o.x),Y(o.y),TS,t)});});
 VD.LOOT.forEach(l=>{if(inV(l.x,l.y)&&vis(l.x,l.y))L.push({y:l.y-.5,f:()=>drawLoot(c,l,X(l.x),Y(l.y),TS,t)});});
 if(inV(VD.merch.x,VD.merch.y))L.push({y:VD.merch.y,f:()=>drawMerch(c,X(VD.merch.x),Y(VD.merch.y),TS,t)});
 VD.E.forEach(e=>{if(inV(e.x,e.y,4)&&vis(e.x,e.y))L.push({y:e.y,f:()=>e.boss?drawDragon(c,e,X(e.x),Y(e.y),TS):drawMon(c,e,X(e.x),Y(e.y),TS,t)});});
 const mv=Math.hypot(P.x-heroSt.lx,P.y-heroSt.ly);heroSt.walk+=mv*1.2;heroSt.lx=P.x;heroSt.ly=P.y;
 if(P.dashT>0)afterImg.push({x:P.x,y:P.y,t:.25});afterImg=afterImg.filter(a=>(a.t-=dt)>0);
 afterImg.forEach(a=>L.push({y:a.y-.01,f:()=>{c.globalAlpha=a.t*1.6;c.fillStyle='#9ab4ff';c.beginPath();c.ellipse(X(a.x),Y(a.y)-TS*.2,TS*.22,TS*.3,0,0,TAU);c.fill();c.globalAlpha=1;}}));
 spin-=dt;spinA+=dt*28;
 const w=P.heroes?P.heroes[0].eq.arme:P.eq.arme;if(P.heroes&&VR_follow)VR_follow(L,c,X,Y,TS,t);L.push({y:P.y,f:()=>drawHero(c,X(P.x),Y(P.y),TS,{face:VD.face,walk:heroSt.walk,swing:VD.swing,swingA:VD.swingA,spin,spinA,iframe:P.iframe,wcol:w?RCOL[w.rar]:'#ccc',wr:w?w.rar:0})});
 LBL=[];L.sort((a,b)=>a.y-b.y);L.forEach(o=>o.f());
 // étiquettes du butin sans chevauchement
 LBL.sort((a,b)=>b.r-a.r||a.y-b.y);const placed=[];c.font=`700 ${Math.round(TS*.27)}px 'Alegreya Sans',sans-serif`;c.textAlign='center';
 LBL.forEach(l=>{let y=l.y;for(let k=0;k<8;k++){const hit=placed.find(p=>Math.abs(p.x-l.x)<(p.w+l.w)/2+2&&Math.abs(p.y-y)<l.h+1);if(!hit)break;y=hit.y-l.h-2;}placed.push({x:l.x,y,w:l.w});
  c.fillStyle='rgba(0,0,0,.78)';c.fillRect(l.x-l.w/2,y,l.w,l.h);c.strokeStyle=l.col+'77';c.lineWidth=1;c.strokeRect(l.x-l.w/2,y,l.w,l.h);c.fillStyle=l.col;c.fillText(l.t,l.x,y+l.h*.74);});
 // projectiles
 c.globalCompositeOperation='lighter';
 VD.PR.forEach(p=>{const col=p.from==='p'?'#ff9a3a':(ELC[p.el]||'#fff'),px=X(p.x),py=Y(p.y)-TS*.25;
  if(p.el==='phys'){c.strokeStyle='#e8dcc4';c.lineWidth=2;const a=Math.atan2(p.vy,p.vx);c.beginPath();c.moveTo(px,py);c.lineTo(px-Math.cos(a)*TS*.45,py-Math.sin(a)*TS*.45);c.stroke();return;}
  const g=c.createRadialGradient(px,py,0,px,py,p.r*TS*2.2);g.addColorStop(0,'#fff');g.addColorStop(.3,col);g.addColorStop(1,col+'00');c.fillStyle=g;c.beginPath();c.arc(px,py,p.r*TS*2.2,0,TAU);c.fill();
  if(Math.random()<.8)part({x:p.x,y:p.y-.25,vx:(Math.random()-.5)*.8-p.vx*.05,vy:(Math.random()-.5)*.8-p.vy*.05,life:.35,c:col,size:p.r*TS*.5});});
 // particules
 for(let i=P_.length-1;i>=0;i--){const p=P_[i];p.life-=dt;if(p.life<=0){P_.splice(i,1);continue;}p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=p.drag;p.vy=p.vy*p.drag+p.g*dt;
  const a=Math.min(1,p.life/p.max*1.6);c.globalCompositeOperation=p.add?'lighter':'source-over';c.globalAlpha=a;c.fillStyle=p.c;const sz=p.size*(.5+.5*p.life/p.max);c.fillRect(X(p.x)-sz/2,Y(p.y)-sz/2,sz,sz);}
 c.globalAlpha=1;c.globalCompositeOperation='source-over';
 // brouillard de mémoire
 c.imageSmoothingEnabled=true;c.drawImage(fogCv,0,0,VD.W,VD.H,ox,oy,VD.W*TS,VD.H*TS);
 // lumière
 lighting(c,X,Y,t,dt);
 // textes flottants
 TXT=TXT.filter(o=>(o.life-=dt*.85)>0);c.textAlign='center';
 TXT.forEach(o=>{o.y-=dt*1.1;const pop=o.life>.85?1+(o.life-.85)*4:1,sz=(o.big?22:15)*pop*(TS/40);c.font=`800 ${sz|0}px 'Alegreya Sans',sans-serif`;c.globalAlpha=Math.min(1,o.life*2);
  c.lineWidth=3;c.strokeStyle='rgba(0,0,0,.85)';c.strokeText(o.t,X(o.x),Y(o.y));c.fillStyle=o.c;c.fillText(o.t,X(o.x),Y(o.y));});c.globalAlpha=1;
 // vignette
 if(!vg){vg=c.createRadialGradient(VW/2,VH/2,Math.min(VW,VH)*.35,VW/2,VH/2,Math.max(VW,VH)*.75);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.65)');}c.fillStyle=vg;c.fillRect(0,0,VW,VH);
 // vie basse
 if(VD.C&&P.hp<VD.C.life*.3){const a=.25+.15*Math.sin(t*6);const g=c.createRadialGradient(VW/2,VH/2,Math.min(VW,VH)*.3,VW/2,VH/2,Math.max(VW,VH)*.7);g.addColorStop(0,'rgba(120,0,0,0)');g.addColorStop(1,`rgba(160,0,0,${a})`);c.fillStyle=g;c.fillRect(0,0,VW,VH);}
 // barre du boss
 const b=VD.E.find(e=>e.boss&&e.aggro);if(b){const w=Math.min(460,VW-60),bx=VW/2-w/2,byy=Math.max(VH*.13,150);c.fillStyle='rgba(0,0,0,.75)';c.fillRect(bx-4,byy-4,w+8,22);c.strokeStyle='#8a6a2a';c.lineWidth=2;c.strokeRect(bx-4,byy-4,w+8,22);
  const g=c.createLinearGradient(bx,0,bx+w,0);g.addColorStop(0,BOSSCOL[b.el][1]);g.addColorStop(1,BOSSCOL[b.el][0]);c.fillStyle=g;c.fillRect(bx,byy,w*b.hp/b.mhp,14);c.fillStyle='rgba(255,255,255,.15)';c.fillRect(bx,byy,w*b.hp/b.mhp,4);
  c.font="600 15px Cinzel,serif";c.textAlign='center';c.fillStyle='#000';c.fillText(b.n,VW/2+1,byy-9);c.fillStyle='#f0c46a';c.fillText(b.n,VW/2,byy-10);}}
function lighting(c,X,Y,t,dt){const P=VD.P,am=pal.amb;lx.setTransform(1,0,0,1,0,0);lx.globalCompositeOperation='source-over';lx.fillStyle=`rgba(${am[0]},${am[1]},${am[2]},.94)`;lx.fillRect(0,0,lc.width,lc.height);
 lx.globalCompositeOperation='destination-out';const lights=[];const fl=.96+Math.sin(t*13)*.02+Math.sin(t*7.3)*.02;
 lights.push({x:P.x,y:P.y-.2,r:6.6*fl,i:1,c:[255,190,120],ci:.12});
 const inV=(x,y,r)=>x>cam.x-VW/2/TS-r&&x<cam.x+VW/2/TS+r&&y>cam.y-VH/2/TS-r&&y<cam.y+VH/2/TS+r;
 UIL.forEach(l=>{if(!inV(l.x,l.y,l.r))return;if(!VD.seen[(l.y|0)*VD.W+(l.x|0)]&&!VD.seen[((l.y+1)|0)*VD.W+(l.x|0)])return;const f=1-l.fl*.12+Math.sin(t*(9+l.x)+l.y)*.06*l.fl;lights.push({x:l.x,y:l.y,r:l.r*f,i:l.i,c:l.c,ci:.22});
  if(l.k&&Math.random()<(l.k==='brasier'?.5:.18))part({x:l.x+(Math.random()-.5)*.15,y:l.y-.25,vy:-1-Math.random(),vx:(Math.random()-.5)*.3,life:.6,c:'#ffa040',size:2});});
 VD.PR.forEach(p=>{if(p.el!=='phys')lights.push({x:p.x,y:p.y,r:p.from==='p'?3.2:2.4,i:.9,c:hex(p.from==='p'?'#ff8a2a':(ELC[p.el]||'#fff')),ci:.35});});
 VD.E.forEach(e=>{if(e.k==='py')lights.push({x:e.x,y:e.y,r:1.8,i:.6,c:[255,120,40],ci:.25});if(e.k==='go')lights.push({x:e.x,y:e.y,r:1.6,i:.5,c:[80,255,200],ci:.2});if(e.boss)lights.push({x:e.x,y:e.y,r:4,i:.6,c:hex(BOSSCOL[e.el][2]),ci:.25});});
 VD.obj.forEach(o=>{if(o.t==='shrine'&&!o.used)lights.push({x:o.x,y:o.y-.4,r:3,i:.8,c:hex({fureur:'#ff4a3a',celerite:'#5affc8',bastion:'#e8e0d0',arcane:'#b47aff',fortune:'#ffd84a'}[o.k]),ci:.3});if(o.t==='chest'&&o.gold)lights.push({x:o.x,y:o.y,r:1.6,i:.5,c:[255,210,90],ci:.25});});
 VD.LOOT.forEach(l=>{if(l.t==='item'&&l.it.rar>=2)lights.push({x:l.x,y:l.y,r:l.it.rar===3?2.2:1.3,i:.6,c:hex(RCOL[l.it.rar]),ci:.25});});
 lights.push({x:VD.merch.x+.3,y:VD.merch.y,r:2.6,i:.8,c:[255,200,110],ci:.2});
 FL.forEach(f=>{f.t-=dt;lights.push({x:f.x,y:f.y,r:f.r*(f.t/f.T+.3),i:Math.max(0,f.t/f.T),c:hex(f.c),ci:.5});});FL=FL.filter(f=>f.t>0);
 const s=.5;lights.forEach(l=>{if(!inV(l.x,l.y,l.r))return;const px=X(l.x)*s,py=Y(l.y)*s,r=l.r*TS*s;const g=lx.createRadialGradient(px,py,0,px,py,r);g.addColorStop(0,`rgba(0,0,0,${l.i})`);g.addColorStop(.55,`rgba(0,0,0,${l.i*.55})`);g.addColorStop(1,'rgba(0,0,0,0)');lx.fillStyle=g;lx.fillRect(px-r,py-r,r*2,r*2);});
 c.drawImage(lc,0,0,lc.width,lc.height,0,0,VW,VH);
 c.globalCompositeOperation='lighter';lights.forEach(l=>{if(!inV(l.x,l.y,l.r))return;const px=X(l.x),py=Y(l.y),r=l.r*TS*.9;const g=c.createRadialGradient(px,py,0,px,py,r);g.addColorStop(0,`rgba(${l.c[0]},${l.c[1]},${l.c[2]},${l.ci})`);g.addColorStop(1,`rgba(${l.c[0]},${l.c[1]},${l.c[2]},0)`);c.fillStyle=g;c.fillRect(px-r,py-r,r*2,r*2);});
 c.globalCompositeOperation='source-over';}
function hex(h){const n=parseInt(h.slice(1,7),16);return[n>>16,(n>>8)&255,n&255];}
function drawMini(m,sz){if(!VD||!VD.seen)return;const W=VD.W,s=sz/W;m.clearRect(0,0,sz,sz);m.fillStyle='rgba(0,0,0,.55)';m.fillRect(0,0,sz,sz);
 for(let y=0;y<VD.H;y++)for(let x=0;x<W;x++){const k=y*W+x;if(!VD.seen[k])continue;const v=VD.map[k];if(v===0)continue;m.fillStyle=v===2?'#ffd060':v===3?'#5a5048':VD.vis[k]?'#8a7a62':'#56493a';m.fillRect(x*s,y*s,s+.4,s+.4);}
 VD.obj.forEach(o=>{if(o.t==='shrine'&&!o.used&&VD.seen[(o.y|0)*W+(o.x|0)]){m.fillStyle='#b47aff';m.fillRect(o.x*s-1.5,o.y*s-1.5,3,3);}});
 m.fillStyle='#5f5';m.fillRect(VD.merch.x*s-1.5,VD.merch.y*s-1.5,3,3);
 VD.E.forEach(e=>{if(VD.vis[(e.y|0)*W+(e.x|0)]||e.boss&&VD.seen[(e.y|0)*W+(e.x|0)]){m.fillStyle=e.boss?'#f33':'#c33';const r=e.boss?2.5:1.2;m.fillRect(e.x*s-r,e.y*s-r,r*2,r*2);}});
 m.fillStyle='#fff';m.beginPath();m.arc(VD.P.x*s,VD.P.y*s,2.2,0,TAU);m.fill();}
return{drawMerch,drawHeroCls,drawMon,drawDragon,shade,get floorCv(){return floorCv;},get PX(){return PX;},get pal(){return pal;},setFollow:f=>{VR_follow=f;},prerender,updFog,draw,view,shake,burst,part,text,flash,stamp,drawMini,setSpin:(v)=>{spin=v;},RCOL,ELC,itemIcon,get cam(){return cam;}};
})();
