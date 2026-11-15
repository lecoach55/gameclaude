// ===== Valdragon · illustrations d'objets peintes au canvas (dégradés métalliques, cuir, bois, gemmes) =====
const CACHE={};
const RCOL=[['#8b8577','#2a2621'],['#5f86c8','#16233d'],['#e0b44a','#3a2a0c'],['#e0782a','#3a1406']];
function rnd(seed){let s=seed>>>0||1;return()=>{s=Math.imul(s^(s>>>15),2246822507)^Math.imul(s^(s>>>13),3266489909);s^=s>>>16;return(s>>>0)/4294967296;};}
function hash(str){let h=2166136261;for(const c of str)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
// --- matières ---
function steel(g,x0,y0,x1,y1,tone=1){const gr=g.createLinearGradient(x0,y0,x1,y1);const c=v=>`rgb(${Math.round(v*tone*.96)},${Math.round(v*tone*.98)},${Math.round(v*tone)})`;
 gr.addColorStop(0,c(70));gr.addColorStop(.35,c(205));gr.addColorStop(.5,c(245));gr.addColorStop(.62,c(150));gr.addColorStop(1,c(60));return gr;}
function gold(g,x0,y0,x1,y1){const gr=g.createLinearGradient(x0,y0,x1,y1);gr.addColorStop(0,'#5a3b0e');gr.addColorStop(.4,'#e8c060');gr.addColorStop(.55,'#fff0b0');gr.addColorStop(.7,'#b88a2a');gr.addColorStop(1,'#4a300a');return gr;}
function wood(g,x0,y0,x1,y1,dark=0){const gr=g.createLinearGradient(x0,y0,x1,y1);gr.addColorStop(0,dark?'#2a1a0e':'#3d2614');gr.addColorStop(.45,dark?'#6a4426':'#8a5a32');gr.addColorStop(1,dark?'#1e120a':'#33200f');return gr;}
function leather(g,x0,y0,x1,y1,c='#5a3820'){const gr=g.createLinearGradient(x0,y0,x1,y1);gr.addColorStop(0,'#1e120a');gr.addColorStop(.5,c);gr.addColorStop(1,'#1a0f08');return gr;}
function gem(g,x,y,r,col){const gr=g.createRadialGradient(x-r*.35,y-r*.35,r*.1,x,y,r);gr.addColorStop(0,'#fff');gr.addColorStop(.25,col);gr.addColorStop(1,'#0a0a10');g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,7);g.fill();
 g.strokeStyle='rgba(0,0,0,.6)';g.lineWidth=1;g.stroke();g.fillStyle='rgba(255,255,255,.75)';g.beginPath();g.arc(x-r*.35,y-r*.4,r*.22,0,7);g.fill();}
function scratches(g,R,n,x,y,w,h,a=.18){g.save();g.strokeStyle=`rgba(255,255,255,${a})`;g.lineWidth=.6;for(let i=0;i<n;i++){const sx=x+R()*w,sy=y+R()*h,l=2+R()*7,an=R()*Math.PI;g.beginPath();g.moveTo(sx,sy);g.lineTo(sx+Math.cos(an)*l,sy+Math.sin(an)*l);g.stroke();}
 g.strokeStyle=`rgba(0,0,0,${a*1.4})`;for(let i=0;i<n;i++){const sx=x+R()*w,sy=y+R()*h,l=2+R()*6,an=R()*Math.PI;g.beginPath();g.moveTo(sx,sy);g.lineTo(sx+Math.cos(an)*l,sy+Math.sin(an)*l);g.stroke();}g.restore();}
function runes(g,pts,col){g.save();g.shadowColor=col;g.shadowBlur=6;g.strokeStyle=col;g.lineWidth=1.3;g.beginPath();pts.forEach(([x,y],i)=>{const k=i%3;if(k===0){g.moveTo(x-2,y-3);g.lineTo(x+2,y+3);}else if(k===1){g.moveTo(x-2,y);g.lineTo(x+2,y-3);g.lineTo(x+2,y+3);}else{g.moveTo(x,y-3);g.lineTo(x,y+3);g.moveTo(x-2,y-1);g.lineTo(x+2,y+1);}});g.stroke();g.restore();}
function wrap(g,x,y,w,h,n,c='#3a2414'){g.fillStyle=leather(g,x,0,x+w,0,c);g.fillRect(x,y,w,h);g.strokeStyle='rgba(0,0,0,.55)';g.lineWidth=1;for(let i=1;i<n;i++){const yy=y+h*i/n;g.beginPath();g.moveTo(x,yy-1.5);g.lineTo(x+w,yy+1.5);g.stroke();}}
// --- armes ---
function sword(g,R,o){const {len=78,w=9,curve=0,serr=0,rune=0,guard='#888',tone=1}=o;g.save();g.translate(64,64);g.rotate(-Math.PI/4);g.translate(0,10);
 const top=-len*.72,bot=8;g.beginPath();g.moveTo(-w/2,bot);g.lineTo(-w/2+curve*.3,top+10);g.lineTo(curve*.5,top);g.lineTo(w/2+curve*.6,top+12);
 if(serr){for(let i=0;i<5;i++){const yy=top+18+i*(bot-top-24)/5;g.lineTo(w/2+3+curve*.3,yy);g.lineTo(w/2,yy+5);}}g.lineTo(w/2,bot);g.closePath();
 g.fillStyle=steel(g,-w/2,0,w/2,0,tone);g.fill();g.strokeStyle='rgba(20,20,24,.85)';g.lineWidth=1.2;g.stroke();
 g.strokeStyle='rgba(40,40,48,.5)';g.lineWidth=1.4;g.beginPath();g.moveTo(curve*.1,bot-2);g.lineTo(curve*.35,top+16);g.stroke();
 scratches(g,R,7,-w/2,top+8,w,bot-top-10,.22);if(rune)runes(g,[[0,top+22],[0,top+34],[0,top+46],[0,top+58]].filter(p=>p[1]<bot-4),rune);
 // garde
 const gw=w*3.2;g.fillStyle=guard==='gold'?gold(g,-gw/2,0,gw/2,0):steel(g,-gw/2,bot,gw/2,bot+5,.8);g.beginPath();g.moveTo(-gw/2,bot);g.quadraticCurveTo(0,bot-4,gw/2,bot);g.lineTo(gw/2-2,bot+5);g.quadraticCurveTo(0,bot+2,-gw/2+2,bot+5);g.closePath();g.fill();g.strokeStyle='rgba(0,0,0,.7)';g.stroke();
 wrap(g,-3.2,bot+5,6.4,20,5);g.fillStyle=guard==='gold'?gold(g,-5,0,5,0):steel(g,-5,0,5,0,.7);g.beginPath();g.arc(0,bot+28,4.8,0,7);g.fill();g.stroke();g.restore();}
function axe(g,R,o){g.save();g.translate(64,64);g.rotate(-Math.PI/5);g.fillStyle=wood(g,-3,0,3,0);g.fillRect(-3,-44,6,92);g.strokeStyle='rgba(0,0,0,.6)';g.strokeRect(-3,-44,6,92);wrap(g,-3.5,24,7,20,5);
 g.beginPath();g.moveTo(2,-40);g.quadraticCurveTo(30,-50,38,-30);g.quadraticCurveTo(26,-14,40,4);g.quadraticCurveTo(22,0,2,-10);g.closePath();g.fillStyle=steel(g,2,-40,40,4,.92);g.fill();g.strokeStyle='rgba(15,15,18,.85)';g.lineWidth=1.3;g.stroke();
 g.strokeStyle='rgba(255,255,255,.55)';g.lineWidth=1.5;g.beginPath();g.moveTo(37,-29);g.quadraticCurveTo(28,-14,39,2);g.stroke();
 g.beginPath();g.moveTo(-2,-38);g.lineTo(-16,-30);g.lineTo(-2,-18);g.closePath();g.fillStyle=steel(g,-16,-30,-2,-30,.75);g.fill();g.stroke();scratches(g,R,8,6,-36,28,30,.2);
 g.fillStyle='#2a2a2e';for(const yy of[-36,-16])g.fillRect(-4,yy,8,3);g.restore();}
function mace(g,R,o){g.save();g.translate(64,64);g.rotate(-Math.PI/4);g.scale(1.15,1.15);g.fillStyle=wood(g,-3,0,3,0,1);g.fillRect(-3,-20,6,62);wrap(g,-3.5,22,7,18,5);
 g.fillStyle=steel(g,-14,-44,14,-16,.85);g.beginPath();g.ellipse(0,-30,13,15,0,0,7);g.fill();g.strokeStyle='rgba(0,0,0,.75)';g.lineWidth=1.2;g.stroke();
 for(let i=0;i<7;i++){const a=i/7*Math.PI*2;const x=Math.cos(a)*13,y=-30+Math.sin(a)*15;g.beginPath();g.moveTo(x*.85,y*1);g.lineTo(x*1.35,-30+(y+30)*1.35);g.lineTo(x*.95+2,y+2);g.closePath();g.fillStyle=steel(g,x-3,y,x+3,y,.9);g.fill();g.stroke();}
 g.fillStyle='rgba(255,255,255,.4)';g.beginPath();g.ellipse(-4,-36,4,6,-.4,0,7);g.fill();scratches(g,R,6,-10,-42,20,24,.2);g.restore();}
function staff(g,R,o){const {top='orb',col='#7ad0ff',bone=0,len=100}=o;g.save();g.translate(64,64);g.rotate(-Math.PI/4);g.scale(1.3,1.12);
 const sg=g.createLinearGradient(-3,0,3,0);if(bone){sg.addColorStop(0,'#6a5e48');sg.addColorStop(.5,'#d8ccaa');sg.addColorStop(1,'#5a4e38');}else{sg.addColorStop(0,'#2a180c');sg.addColorStop(.5,'#7a4e2a');sg.addColorStop(1,'#24140a');}
 g.fillStyle=sg;g.beginPath();g.moveTo(-3,len/2);g.lineTo(-2.5,-len/2+16);g.lineTo(2.5,-len/2+16);g.lineTo(3,len/2);g.closePath();g.fill();g.strokeStyle='rgba(0,0,0,.6)';g.lineWidth=1;g.stroke();
 g.strokeStyle='rgba(0,0,0,.35)';for(let i=0;i<6;i++){const y=-len/2+24+i*13+R()*4;g.beginPath();g.moveTo(-2.5,y);g.quadraticCurveTo(0,y+2,2.5,y-1);g.stroke();}
 const ty=-len/2+10;
 if(top==='orb'||top==='opal'){g.strokeStyle=top==='opal'?gold(g,-10,0,10,0):wood(g,-10,0,10,0);g.lineWidth=3;g.beginPath();g.moveTo(-3,ty+8);g.quadraticCurveTo(-11,ty-2,-6,ty-12);g.moveTo(3,ty+8);g.quadraticCurveTo(11,ty-2,6,ty-12);g.stroke();
  g.save();g.shadowColor=col;g.shadowBlur=14;gem(g,0,ty-4,8,col);g.restore();}
 else if(top==='crystal'){g.save();g.shadowColor=col;g.shadowBlur=12;const cg=g.createLinearGradient(-7,0,7,0);cg.addColorStop(0,'#123');cg.addColorStop(.5,col);cg.addColorStop(1,'#fff');g.fillStyle=cg;g.beginPath();g.moveTo(0,ty-22);g.lineTo(7,ty-4);g.lineTo(0,ty+8);g.lineTo(-7,ty-4);g.closePath();g.fill();g.restore();g.strokeStyle='rgba(0,0,0,.5)';g.stroke();
  g.strokeStyle='rgba(255,255,255,.6)';g.beginPath();g.moveTo(0,ty-20);g.lineTo(-2,ty+4);g.stroke();runes(g,[[0,ty+22],[0,ty+36],[0,ty+50]],col);}
 else if(top==='claw'){g.fillStyle='#d8ccaa';for(const d of[-1,1]){g.beginPath();g.moveTo(d*2,ty+6);g.quadraticCurveTo(d*14,ty-6,d*5,ty-20);g.quadraticCurveTo(d*8,ty-6,d*1,ty);g.closePath();g.fill();g.strokeStyle='rgba(0,0,0,.6)';g.stroke();}g.save();g.shadowColor=col;g.shadowBlur=14;gem(g,0,ty-6,6,col);g.restore();}
 else if(top==='wand'){g.fillStyle=gold(g,-4,0,4,0);g.fillRect(-4,ty+2,8,4);g.save();g.shadowColor=col;g.shadowBlur=10;gem(g,0,ty-3,4.5,col);g.restore();}
 g.restore();}
function book(g,R,o){g.save();g.translate(64,66);g.rotate(-.12);const bw=60,bh=74;g.fillStyle='#d8c9a0';g.fillRect(-bw/2+5,-bh/2+5,bw-4,bh-6);g.strokeStyle='rgba(0,0,0,.25)';for(let i=0;i<5;i++){g.beginPath();g.moveTo(bw/2,-bh/2+8+i*2);g.lineTo(bw/2,bh/2-6);g.stroke();}
 g.fillStyle=leather(g,-bw/2,-bh/2,bw/2,bh/2,'#5a1e1a');g.fillRect(-bw/2,-bh/2,bw-4,bh-4);g.strokeStyle='rgba(0,0,0,.7)';g.lineWidth=1.5;g.strokeRect(-bw/2,-bh/2,bw-4,bh-4);
 g.fillStyle=gold(g,-bw/2,0,bw/2,0);for(const[x,y]of[[-bw/2,-bh/2],[bw/2-14,-bh/2],[-bw/2,bh/2-14],[bw/2-14,bh/2-14]]){g.beginPath();g.moveTo(x,y);g.lineTo(x+10,y);g.lineTo(x,y+10);g.closePath();g.fill();}
 g.strokeStyle=gold(g,-20,0,20,0);g.lineWidth=2;g.strokeRect(-bw/2+7,-bh/2+7,bw-18,bh-18);g.save();g.shadowColor=o.col||'#9cf';g.shadowBlur=10;gem(g,-2,-2,7,o.col||'#6ac8ff');g.restore();
 g.fillStyle='#24140a';g.fillRect(-bw/2-2,-bh/2,5,bh-4);scratches(g,R,10,-bw/2,-bh/2,bw-4,bh-4,.12);g.restore();}
function bowI(g,R,o){const {k=1,tone='#6a4426',rune=0,horn=0}=o;g.save();g.translate(60,64);g.rotate(-Math.PI/4);const L=40+k*7;
 g.strokeStyle='rgba(230,220,200,.75)';g.lineWidth=1;g.beginPath();g.moveTo(-6,-L);g.lineTo(-6,L);g.stroke();
 g.lineCap='round';g.strokeStyle='#120a04';g.lineWidth=7;g.beginPath();g.moveTo(-6,-L);g.bezierCurveTo(18+k*2,-L*.6,18+k*2,L*.6,-6,L);if(o.recurve){g.moveTo(-6,-L);g.quadraticCurveTo(-12,-L-4,-10,-L-10);g.moveTo(-6,L);g.quadraticCurveTo(-12,L+4,-10,L+10);}g.stroke();
 g.strokeStyle=horn?'#cdbf9c':tone;g.lineWidth=5;g.stroke();g.strokeStyle='rgba(255,255,255,.25)';g.lineWidth=1.5;g.beginPath();g.moveTo(-3,-L+4);g.bezierCurveTo(19+k*2,-L*.6,19+k*2,-4,14,-6);g.stroke();
 wrap(g,9+k,-9,7,18,4,'#4a2c18');if(rune)runes(g,[[8,-L*.55],[13,-L*.3],[13,L*.3],[8,L*.55]],rune);
 // flèche
 g.strokeStyle='#5a3a1e';g.lineWidth=2;g.beginPath();g.moveTo(-6,0);g.lineTo(40,0);g.stroke();g.fillStyle=steel(g,36,-4,46,4,.9);g.beginPath();g.moveTo(40,-4);g.lineTo(49,0);g.lineTo(40,4);g.closePath();g.fill();
 g.fillStyle='#a8382a';g.beginPath();g.moveTo(-6,0);g.lineTo(2,-5);g.lineTo(6,0);g.lineTo(2,5);g.closePath();g.fill();g.restore();}
// --- armures ---
function torso(g){g.beginPath();g.moveTo(-26,-34);g.quadraticCurveTo(-14,-40,-8,-38);g.quadraticCurveTo(0,-30,8,-38);g.quadraticCurveTo(14,-40,26,-34);g.lineTo(36,-20);g.lineTo(28,-10);g.lineTo(24,-14);g.lineTo(22,36);g.quadraticCurveTo(0,42,-22,36);g.lineTo(-24,-14);g.lineTo(-28,-10);g.lineTo(-36,-20);g.closePath();}
function armor(g,R,o){const {kind}=o;g.save();g.translate(64,66);torso(g);g.save();g.clip();
 if(kind==='cloth'){g.fillStyle=leather(g,-36,0,36,0,'#6a5a3a');g.fillRect(-40,-44,80,90);g.strokeStyle='rgba(0,0,0,.15)';for(let i=0;i<30;i++){g.beginPath();g.moveTo(-36+R()*72,-40);g.lineTo(-36+R()*72,40);g.stroke();}g.fillStyle=leather(g,-22,0,22,0,'#3a2414');g.fillRect(-24,10,48,7);}
 else if(kind==='brig'){g.fillStyle=leather(g,-36,0,36,0,'#5a2a1e');g.fillRect(-40,-44,80,90);g.fillStyle=steel(g,-3,0,3,0,.9);for(let y=-28;y<36;y+=7)for(let x=-24;x<26;x+=7){g.beginPath();g.arc(x+(y/7%2?3:0),y,1.6,0,7);g.fill();}}
 else if(kind==='mail'){g.fillStyle='#3a3c42';g.fillRect(-40,-44,80,90);g.strokeStyle=steel(g,-36,0,36,0,.85);g.lineWidth=1.3;for(let y=-40;y<42;y+=3.4)for(let x=-38;x<40;x+=4){g.beginPath();g.arc(x+((y/3.4)%2?2:0),y,2,0,7);g.stroke();}}
 else if(kind==='plate'||kind==='runic'){g.fillStyle=steel(g,-30,-10,30,10,kind==='runic'?.8:.95);g.fillRect(-40,-44,80,90);g.strokeStyle='rgba(0,0,0,.45)';g.lineWidth=1.4;g.beginPath();g.moveTo(0,-30);g.lineTo(0,30);g.stroke();
  for(const y of[8,20,30]){g.beginPath();g.moveTo(-24,y);g.quadraticCurveTo(0,y+5,24,y);g.stroke();}g.fillStyle='rgba(255,255,255,.35)';g.beginPath();g.ellipse(-10,-14,6,14,-.3,0,7);g.fill();
  if(kind==='runic'){g.fillStyle=gold(g,-30,0,30,0);g.fillRect(-26,-36,52,4);runes(g,[[-12,-6],[0,-14],[12,-6],[0,4]],'#7ad8ff');}}
 else if(kind==='scale'){g.fillStyle='#2a3028';g.fillRect(-40,-44,80,90);for(let y=-40;y<42;y+=6)for(let x=-40;x<42;x+=8){const xx=x+((y/6)%2?4:0);g.beginPath();g.moveTo(xx-4,y);g.quadraticCurveTo(xx-4,y+7,xx,y+8);g.quadraticCurveTo(xx+4,y+7,xx+4,y);g.closePath();g.fillStyle=steel(g,xx-4,y,xx+4,y+8,.7+.2*R());g.fill();g.strokeStyle='rgba(0,0,0,.55)';g.lineWidth=.8;g.stroke();}}
 scratches(g,R,14,-30,-36,60,70,.14);const sh=g.createLinearGradient(-36,0,36,0);sh.addColorStop(0,'rgba(0,0,0,.45)');sh.addColorStop(.4,'rgba(0,0,0,0)');sh.addColorStop(1,'rgba(0,0,0,.5)');g.fillStyle=sh;g.fillRect(-40,-44,80,90);g.restore();
 torso(g);g.strokeStyle='rgba(0,0,0,.8)';g.lineWidth=1.6;g.stroke();g.restore();}
// --- bijoux ---
function ring(g,R,o){g.save();g.translate(64,70);g.lineWidth=7;g.strokeStyle=gold(g,-22,-10,22,10);g.beginPath();g.ellipse(0,6,22,13,0,0,7);g.stroke();g.lineWidth=1;g.strokeStyle='rgba(0,0,0,.6)';g.beginPath();g.ellipse(0,6,25.5,16.5,0,0,7);g.stroke();g.beginPath();g.ellipse(0,6,18.5,9.5,0,0,7);g.stroke();
 g.fillStyle=gold(g,-9,0,9,0);g.beginPath();g.moveTo(-10,-6);g.lineTo(10,-6);g.lineTo(6,-16);g.lineTo(-6,-16);g.closePath();g.fill();g.stroke();g.save();g.shadowColor=o.col;g.shadowBlur=12;gem(g,0,-18,8,o.col);g.restore();g.restore();}
function amulet(g,R,o){g.save();g.translate(64,60);g.strokeStyle=gold(g,-30,0,30,0);g.lineWidth=2;g.setLineDash([3,2]);g.beginPath();g.moveTo(-30,-40);g.quadraticCurveTo(-26,6,0,14);g.quadraticCurveTo(26,6,30,-40);g.stroke();g.setLineDash([]);
 g.fillStyle=gold(g,-16,10,16,40);g.beginPath();g.moveTo(0,12);g.lineTo(16,26);g.lineTo(0,46);g.lineTo(-16,26);g.closePath();g.fill();g.strokeStyle='rgba(0,0,0,.7)';g.lineWidth=1.2;g.stroke();g.save();g.shadowColor=o.col;g.shadowBlur=14;gem(g,0,28,8,o.col);g.restore();g.restore();}
function talisman(g,R,o){g.save();g.translate(64,62);g.strokeStyle='#3a2414';g.lineWidth=2;g.beginPath();g.moveTo(-6,-46);g.lineTo(0,-24);g.lineTo(6,-46);g.stroke();
 const gr=g.createRadialGradient(-6,-6,2,0,0,24);gr.addColorStop(0,'#d8ccaa');gr.addColorStop(1,'#5a4e38');g.fillStyle=gr;g.beginPath();g.arc(0,0,24,0,7);g.fill();g.strokeStyle='rgba(0,0,0,.7)';g.stroke();
 g.strokeStyle='rgba(40,25,10,.8)';g.lineWidth=2;g.beginPath();g.arc(0,0,16,0,7);g.stroke();runes(g,[[-8,-6],[8,-6],[0,8],[0,-10]],o.col);g.restore();}
// --- table des objets ---
const DRAW={
 'Épée courte':(g,R)=>sword(g,R,{len:66,w:8}),'Hache de guerre':(g,R)=>axe(g,R,{}),'Masse ferrée':(g,R)=>mace(g,R,{}),'Lame bâtarde':(g,R)=>sword(g,R,{len:84,w:10}),
 'Glaive runique':(g,R)=>sword(g,R,{len:86,w:11,rune:'#7ad8ff',guard:'gold',tone:.92}),'Fendoir de Wyrm':(g,R)=>sword(g,R,{len:84,w:15,serr:1,curve:6,rune:'#ff7a3a',guard:'gold',tone:.8}),
 'Baguette de frêne':(g,R)=>staff(g,R,{top:'wand',len:64,col:'#9fe0ff'}),'Bâton de chêne':(g,R)=>staff(g,R,{top:'orb',col:'#8ad06a'}),'Grimoire relié':(g,R)=>book(g,R,{col:'#6ac8ff'}),
 'Bâton runique':(g,R)=>staff(g,R,{top:'crystal',col:'#7ad8ff'}),"Sceptre d'opale":(g,R)=>staff(g,R,{top:'opal',col:'#e8d8ff',len:84}),'Bâton de Wyrm':(g,R)=>staff(g,R,{top:'claw',bone:1,col:'#ff6a2a'}),
 'Arc court':(g,R)=>bowI(g,R,{k:0}),'Arc de chasse':(g,R)=>bowI(g,R,{k:1,tone:'#7a5030'}),'Arc long':(g,R)=>bowI(g,R,{k:3,tone:'#5a3a1e'}),'Arc composite':(g,R)=>bowI(g,R,{k:2,recurve:1,tone:'#4a2a18'}),
 'Arc runique':(g,R)=>bowI(g,R,{k:2,recurve:1,tone:'#3a2a3a',rune:'#9fe0ff'}),'Arc de Wyrm':(g,R)=>bowI(g,R,{k:3,recurve:1,horn:1,rune:'#ff7a3a'}),
 'Tunique':(g,R)=>armor(g,R,{kind:'cloth'}),'Brigandine':(g,R)=>armor(g,R,{kind:'brig'}),'Cotte de mailles':(g,R)=>armor(g,R,{kind:'mail'}),"Plastron d'acier":(g,R)=>armor(g,R,{kind:'plate'}),
 "Armure d'écailles":(g,R)=>armor(g,R,{kind:'scale'}),'Harnois runique':(g,R)=>armor(g,R,{kind:'runic'}),
 'Anneau':(g,R,c)=>ring(g,R,{col:c}),'Amulette':(g,R,c)=>amulet(g,R,{col:c}),'Talisman':(g,R,c)=>talisman(g,R,{col:c})};
const GEMC=['#9fb0c8','#5aa0ff','#ffd04a','#ff7a2a'];
export function itemIcon(it,size=128){const key=(it.bn||it.n)+'|'+it.rar+'|'+(it.up||0)+'|'+size;if(CACHE[key])return CACHE[key];
 const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');const R=rnd(hash(it.bn||it.n));const [rc,rd]=RCOL[it.rar||0];
 // fond : vignette sombre teintée de la rareté
 const bg=g.createRadialGradient(64,58,8,64,64,90);bg.addColorStop(0,rd==='#2a2621'?'#3a342c':rd);bg.addColorStop(1,'#07060a');g.fillStyle=bg;g.fillRect(0,0,128,128);
 g.globalAlpha=.06;for(let i=0;i<500;i++){g.fillStyle=R()<.5?'#fff':'#000';g.fillRect(R()*128,R()*128,1,1);}g.globalAlpha=1;
 if(it.rar>=2){const gl=g.createRadialGradient(64,64,4,64,64,60);gl.addColorStop(0,rc+'55');gl.addColorStop(1,rc+'00');g.fillStyle=gl;g.fillRect(0,0,128,128);}
 // ombre portée sous l'objet
 g.save();g.shadowColor='rgba(0,0,0,.85)';g.shadowBlur=10;g.shadowOffsetX=4;g.shadowOffsetY=6;
 const f=DRAW[it.bn]||DRAW[it.n]||(it.s==='bijou'?DRAW['Anneau']:it.s==='armure'?DRAW['Tunique']:DRAW['Épée courte']);f(g,R,GEMC[it.rar||0]);g.restore();
 // cadre
 g.strokeStyle=rc;g.lineWidth=it.rar>=3?4:3;g.strokeRect(2,2,124,124);g.strokeStyle='rgba(0,0,0,.8)';g.lineWidth=1;g.strokeRect(5.5,5.5,117,117);
 if(it.up){g.font='bold 22px Georgia,serif';g.textAlign='right';g.lineWidth=4;g.strokeStyle='#000';g.strokeText('+'+it.up,120,120);g.fillStyle='#ffd27a';g.fillText('+'+it.up,120,120);}
 let out=c;if(size!==128){out=document.createElement('canvas');out.width=out.height=size;out.getContext('2d').drawImage(c,0,0,size,size);}
 return CACHE[key]=out.toDataURL('image/png');}
