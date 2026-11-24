'use strict';
/* =========================================================
   BANNIÈRES & SORTILÈGES — créatures, héros, portraits et icônes peints au pinceau numérique
   Tout est dessiné par le code (aucune image externe) puis mis en cache.
   ========================================================= */
function mkC(w,h){const c=document.createElement('canvas');c.width=Math.ceil(w);c.height=Math.ceil(h);return c;}
function teinte(hex,k){// k>0 éclaircit, k<0 assombrit
 let c=hex.replace('#','');if(c.length===3)c=c.split('').map(x=>x+x).join('');let r=parseInt(c.slice(0,2),16),g=parseInt(c.slice(2,4),16),b=parseInt(c.slice(4,6),16);
 if(k>0){r+=(255-r)*k;g+=(255-g)*k;b+=(255-b)*k;}else{r*=1+k;g*=1+k;b*=1+k;}return'#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');}
function rgba(hex,a){let c=hex.replace('#','');if(c.length===3)c=c.split('').map(x=>x+x).join('');return`rgba(${parseInt(c.slice(0,2),16)},${parseInt(c.slice(2,4),16)},${parseInt(c.slice(4,6),16)},${a})`;}
var TRAIT='rgba(24,14,6,.4)';var LWK=.6;// contours fins (style réaliste ; 0.78 et 1 pour l'ancien style dessiné)
// forme remplie avec dégradé vertical, contour sombre
var MOTIF=null;(function(){if(typeof MOTIF_PIERRE_URI==='undefined'||typeof document==='undefined')return;const im=new Image();im.onload=()=>{MOTIF=im;for(const k in SPR_CACHE)if(/^(v|l|mi|fc)/.test(k))delete SPR_CACHE[k];if(typeof VI!=='undefined'&&VI)VI.dirty=true;};im.src=MOTIF_PIERRE_URI;})();
function motifPierre(g,ech){if(!MOTIF)return null;const p=g.createPattern(MOTIF,'repeat');if(p&&p.setTransform)p.setTransform(new DOMMatrix().scale(ech,ech));return p;}
function peint(g,chemin,coul,opt={}){g.beginPath();chemin(g);const gr=g.createLinearGradient(0,opt.y0==null?0:opt.y0,opt.dx||0,opt.y1==null?100:opt.y1);gr.addColorStop(0,teinte(coul,opt.clair==null?.28:opt.clair));gr.addColorStop(.55,coul);gr.addColorStop(1,teinte(coul,opt.sombre==null?-.38:opt.sombre));g.fillStyle=gr;g.fill();
 if(opt.pierre&&MOTIF){const p=motifPierre(g,opt.pierre);if(p){g.save();g.globalCompositeOperation='multiply';g.globalAlpha=.85;g.fillStyle=p;g.fill();g.restore();}}if(opt.trait!==false){g.lineWidth=(opt.lw||1.6)*LWK;g.strokeStyle=opt.trait||TRAIT;g.stroke();}}
function boule(g,x,y,r,coul,opt={}){g.beginPath();g.arc(x,y,r,0,Math.PI*2);const gr=g.createRadialGradient(x-r*.35,y-r*.4,r*.1,x,y,r);gr.addColorStop(0,teinte(coul,.35));gr.addColorStop(.6,coul);gr.addColorStop(1,teinte(coul,-.35));g.fillStyle=gr;g.fill();if(opt.trait!==false){g.lineWidth=(opt.lw||1.4)*LWK;g.strokeStyle=opt.trait||TRAIT;g.stroke();}}
function ell(g,x,y,rx,ry,coul,opt={}){g.beginPath();g.ellipse(x,y,rx,ry,opt.rot||0,0,Math.PI*2);const gr=g.createRadialGradient(x-rx*.3,y-ry*.45,1,x,y,Math.max(rx,ry));gr.addColorStop(0,teinte(coul,.3));gr.addColorStop(.6,coul);gr.addColorStop(1,teinte(coul,-.38));g.fillStyle=gr;g.fill();if(opt.trait!==false){g.lineWidth=(opt.lw||1.5)*LWK;g.strokeStyle=TRAIT;g.stroke();}}
function ombreSol(g,x,y,rx,ry,a=.35){g.save();g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);const gr=g.createRadialGradient(x,y,1,x,y,rx);gr.addColorStop(0,`rgba(0,0,0,${a})`);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fill();g.restore();}
function trait(g,pts,coul,lw){g.beginPath();g.moveTo(pts[0],pts[1]);for(let i=2;i<pts.length;i+=2)g.lineTo(pts[i],pts[i+1]);g.lineCap='round';g.lineJoin='round';g.lineWidth=lw+2*LWK;g.strokeStyle=TRAIT;g.stroke();g.lineWidth=lw;g.strokeStyle=coul;g.stroke();}
function poly(pts){return g=>{g.moveTo(pts[0],pts[1]);for(let i=2;i<pts.length;i+=2)g.lineTo(pts[i],pts[i+1]);g.closePath();};}
function rrect(x,y,w,h,r){return g=>{g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();};}

// ---------- armes ----------
function arme(g,t,x,y,d){const fer='#cfd5da',bois='#7a5230';
 switch(t){
 case 'pique':trait(g,[x-6,y+20,x+26,y-30],bois,2.4);peint(g,poly([x+26,y-30,x+22,y-24,x+31,y-40]),fer);break;
 case 'lance':trait(g,[x-18,y+6,x+34,y-10],bois,2.6);peint(g,poly([x+34,y-10,x+30,y-6,x+44,y-14]),fer);break;
 case 'epee':trait(g,[x,y,x+4,y-4],'#6a4a20',3);peint(g,poly([x+1,y-6,x+5,y-2,x+24,y-26,x+22,y-28]),fer,{y0:y-28,y1:y});trait(g,[x-3,y-7,x+8,y+3],'#c9a040',2);break;
 case 'hache':trait(g,[x-2,y+10,x+12,y-18],bois,2.6);peint(g,g2=>{g2.moveTo(x+8,y-18);g2.quadraticCurveTo(x+22,y-24,x+20,y-8);g2.lineTo(x+11,y-12);g2.closePath();},fer);break;
 case 'hachejet':trait(g,[x,y+4,x+10,y-12],bois,2.2);peint(g,poly([x+7,y-12,x+17,y-17,x+15,y-6]),fer);break;
 case 'massue':trait(g,[x-2,y+8,x+12,y-14],bois,3);ell(g,x+14,y-17,6,8,'#6b4a2a',{rot:.6});break;
 case 'baton':trait(g,[x+2,y+30,x+8,y-32],bois,2.4);g.save();g.shadowColor=d.orbe||'#ffe79a';g.shadowBlur=12;boule(g,x+8,y-35,5.5,d.orbe||'#ffe79a',{trait:false});g.restore();break;
 case 'arc':g.beginPath();g.arc(x-2,y-6,24,-1.15,1.15);g.lineWidth=4.6;g.strokeStyle=TRAIT;g.stroke();g.lineWidth=2.6;g.strokeStyle='#8a5a2a';g.stroke();g.beginPath();g.moveTo(x-2+24*Math.cos(-1.15),y-6+24*Math.sin(-1.15));g.lineTo(x-4,y-6);g.lineTo(x-2+24*Math.cos(1.15),y-6+24*Math.sin(1.15));g.lineWidth=.9;g.strokeStyle='#eee';g.stroke();break;
 }}

// ---------- humanoïdes ----------
function dessHum(g,d){const pk=d.petit?.78:d.geant?1.42:d.gros?1.22:1;const lx=d.mince?.85:1;const peau=d.peau||'#e3b58c';
 g.save();g.translate(50,92);g.scale(pk*lx,pk);g.translate(-50,-92);
 // cape
 if(d.cape)peint(g,poly([40,34,58,34,64,86,30,88]),d.cape);
 // jambes ou robe
 if(d.robe){peint(g,g2=>{g2.moveTo(38,40);g2.lineTo(60,40);g2.quadraticCurveTo(68,70,66,90);g2.lineTo(32,90);g2.quadraticCurveTo(32,70,38,40);g2.closePath();},d.robe,{y0:40,y1:92});}
 else{const jb=d.zombi?'#4a4238':teinte(d.tun||'#666',-.35);peint(g,rrect(40,62,8,28,3),jb,{y0:62,y1:90});peint(g,rrect(51,62,8,28,3),jb,{y0:62,y1:90});peint(g,rrect(38,86,11,6,2),'#3a2a1a');peint(g,rrect(50,86,12,6,2),'#3a2a1a');}
 // bras arrière
 peint(g,rrect(33,40,8,24,4),teinte(d.robe||d.tun||'#777',-.15),{y0:40,y1:64});
 // torse
 const corps=d.robe||d.tun||'#777';peint(g,g2=>{g2.moveTo(36,38);g2.quadraticCurveTo(49,32,62,38);g2.lineTo(61,66);g2.lineTo(37,66);g2.closePath();},corps,{y0:34,y1:66});
 if(d.arm&&!d.robe){g.save();g.globalAlpha=.9;peint(g,g2=>{g2.moveTo(38,39);g2.quadraticCurveTo(49,34,60,39);g2.lineTo(59,52);g2.lineTo(39,52);g2.closePath();},d.arm,{y0:34,y1:52});g.restore();}
 if(d.croix){g.fillStyle=d.croix;g.fillRect(47,41,4,20);g.fillRect(42,47,14,4);}
 g.fillStyle='rgba(60,40,20,.85)';g.fillRect(37,60,24,4);
 // tête
 const hy=d.zombi?28:26;const hx=d.zombi?54:50;
 if(d.crane){boule(g,hx,hy,9,'#e2dcc6');g.fillStyle='#1a1410';g.beginPath();g.arc(hx+2,hy-1,2.4,0,7);g.arc(hx+7,hy-1,2.2,0,7);g.fill();g.save();g.shadowColor=d.orbe||'#7cf7a2';g.shadowBlur=6;g.fillStyle=d.orbe||'#7cf7a2';g.beginPath();g.arc(hx+2,hy-1,1,0,7);g.arc(hx+7,hy-1,1,0,7);g.fill();g.restore();}
 else if(d.cyclope){boule(g,hx,hy,9,peau);g.fillStyle='#fff';g.beginPath();g.ellipse(hx+4,hy-2,3.2,2.6,0,0,7);g.fill();g.fillStyle='#3a1a0a';g.beginPath();g.arc(hx+5,hy-2,1.5,0,7);g.fill();g.strokeStyle='#3a2010';g.lineWidth=1.4;g.beginPath();g.moveTo(hx,hy-6);g.lineTo(hx+8,hy-6);g.stroke();}
 else{boule(g,hx,hy,9,peau);g.fillStyle='#2a1a10';g.beginPath();g.arc(hx+5,hy-1,1.3,0,7);g.fill();if(d.zombi){g.strokeStyle='#5a2a2a';g.lineWidth=1;g.beginPath();g.moveTo(hx+2,hy+5);g.lineTo(hx+8,hy+4);g.stroke();}}
 if(d.oreilles){peint(g,poly([hx-6,hy-2,hx-14,hy-8,hx-7,hy+3]),peau);}
 if(d.barbe)peint(g,g2=>{g2.moveTo(hx-3,hy+3);g2.quadraticCurveTo(hx+6,hy+20,hx+10,hy+3);g2.closePath();},d.barbe);
 if(d.cheveux&&!d.casque&&!d.capuche)peint(g,g2=>{g2.moveTo(hx-9,hy+6);g2.quadraticCurveTo(hx-11,hy-12,hx+3,hy-10);g2.quadraticCurveTo(hx+10,hy-9,hx+8,hy-4);g2.quadraticCurveTo(hx,hy-6,hx-4,hy+8);g2.closePath();},d.cheveux);
 if(d.casque===1)peint(g,g2=>{g2.moveTo(hx-11,hy-1);g2.quadraticCurveTo(hx,hy-17,hx+11,hy-1);g2.lineTo(hx+13,hy+1);g2.lineTo(hx-13,hy+1);g2.closePath();},d.arm||'#9aa8b8');
 if(d.casque===2){peint(g,rrect(hx-10,hy-11,20,20,5),d.arm||'#ccc');g.fillStyle='#111';g.fillRect(hx+1,hy-3,9,2.5);}
 if(d.capuche)peint(g,g2=>{g2.moveTo(hx-12,hy+8);g2.quadraticCurveTo(hx-12,hy-16,hx+4,hy-13);g2.quadraticCurveTo(hx+13,hy-8,hx+10,hy+2);g2.lineTo(hx+6,hy-3);g2.quadraticCurveTo(hx-2,hy-7,hx-5,hy+10);g2.closePath();},d.capuche);
 if(d.couronne)peint(g,poly([hx-8,hy-7,hx-8,hy-14,hx-4,hy-10,hx,hy-16,hx+4,hy-10,hx+8,hy-14,hx+8,hy-7]),'#e8c040');
 // bouclier
 if(d.bouclier)peint(g,g2=>{g2.moveTo(30,40);g2.lineTo(44,40);g2.lineTo(44,56);g2.quadraticCurveTo(37,66,30,56);g2.closePath();},d.bouclier,{y0:40,y1:64});
 if(d.bouclier&&d.croix){g.fillStyle=d.croix;g.fillRect(35.5,43,3,14);g.fillRect(32,48,10,3);}
 // bras avant + arme
 peint(g,rrect(56,40,8,20,4),teinte(d.robe||d.tun||'#777',.05),{y0:40,y1:60});boule(g,61,61,3.6,peau,{lw:1});
 if(d.arme)arme(g,d.arme,61,60,d);
 g.restore();}
function dessSquel(g,d){const os=d.os||'#e8e2cc';g.save();
 trait(g,[44,64,42,90],os,3);trait(g,[54,64,57,90],os,3);trait(g,[49,38,49,64],os,3.4);for(let k=0;k<4;k++)trait(g,[42,42+k*5,56,42+k*5],os,1.8);trait(g,[42,64,56,64],os,3);
 trait(g,[44,40,36,58],os,2.4);trait(g,[54,40,62,58],os,2.4);boule(g,50,28,9,os);g.fillStyle='#1a1410';g.beginPath();g.arc(52,27,2.3,0,7);g.arc(57,27,2.2,0,7);g.fill();g.fillRect(52,33,6,1.4);
 if(d.bouclier)ell(g,34,52,8,10,d.bouclier);arme(g,d.arme||'epee',62,58,d);g.restore();}
function dessSpectre(g,d){g.save();g.globalAlpha=.82;const c=d.robe||'#9fb3c9';
 const gr=g.createLinearGradient(0,20,0,92);gr.addColorStop(0,teinte(c,.3));gr.addColorStop(.7,rgba(c,.75));gr.addColorStop(1,rgba(c,0));g.fillStyle=gr;
 g.beginPath();g.moveTo(36,40);g.quadraticCurveTo(50,8,64,40);g.quadraticCurveTo(70,60,72,84);g.quadraticCurveTo(64,76,58,88);g.quadraticCurveTo(52,78,46,90);g.quadraticCurveTo(40,78,32,86);g.quadraticCurveTo(32,60,36,40);g.fill();
 g.globalAlpha=1;g.fillStyle='#10141c';g.beginPath();g.ellipse(52,30,9,11,0,0,7);g.fill();g.shadowColor=d.yeux;g.shadowBlur=10;g.fillStyle=d.yeux;g.beginPath();g.arc(52,29,2,0,7);g.arc(58,29,2,0,7);g.fill();g.restore();
 trait(g,[60,46,74,40],rgba(c,.9),3);}
// ---------- quadrupèdes ----------
function corpsCheval(g,d,opt={}){const c=d.corps||d.cheval||'#8a6a44';const sombre=teinte(c,-.35);
 // pattes arrière
 trait(g,[30,62,26,90],sombre,4);trait(g,[38,62,40,90],teinte(c,-.2),4);trait(g,[62,62,60,90],sombre,4);trait(g,[70,60,74,90],teinte(c,-.2),4);
 // queue
 trait(g,[22,50,14,66,16,76],d.crin||teinte(c,-.4),4);
 // corps
 ell(g,48,54,26,13,c);
 // cou et tête
 peint(g,g2=>{g2.moveTo(64,46);g2.quadraticCurveTo(70,30,76,22);g2.lineTo(84,28);g2.quadraticCurveTo(78,40,74,56);g2.closePath();},c,{y0:20,y1:56});
 peint(g,g2=>{g2.moveTo(74,20);g2.quadraticCurveTo(84,16,94,30);g2.quadraticCurveTo(94,36,88,36);g2.quadraticCurveTo(80,32,76,30);g2.closePath();},c,{y0:16,y1:38});
 g.fillStyle='#111';g.beginPath();g.arc(83,25,1.4,0,7);g.fill();
 if(opt.yeux){g.save();g.shadowColor=opt.yeux;g.shadowBlur=8;g.fillStyle=opt.yeux;g.beginPath();g.arc(83,25,1.8,0,7);g.fill();g.restore();}
 peint(g,poly([76,20,78,12,81,21]),c);
 trait(g,[66,40,72,26,76,20],d.crin||teinte(c,-.45),3.4);
 if(d.corne)peint(g,poly([84,20,98,6,86,23]),d.corne,{y0:6,y1:24});}
function ailes(g,c,x,y,ech=1,haut=1){g.save();g.translate(x,y);g.scale(ech,ech*haut);
 for(const [k,a] of [[0,.0],[1,.0]]){const off=k?6:0;g.save();g.translate(-off,-off*.5);
  peint(g,g2=>{g2.moveTo(0,0);g2.quadraticCurveTo(-10,-30,-36,-40);g2.quadraticCurveTo(-30,-30,-34,-24);g2.quadraticCurveTo(-26,-20,-30,-12);g2.quadraticCurveTo(-20,-10,-22,-2);g2.quadraticCurveTo(-10,-2,0,6);g2.closePath();},k?teinte(c,-.12):c,{y0:-40,y1:6});g.restore();}
 g.restore();}
function dessCheval(g,d){if(d.aile)ailes(g,d.aile,52,46,1,1);corpsCheval(g,d);if(d.aile){g.save();g.translate(4,2);ailes(g,teinte(d.aile,.05),52,46,.95,.9);g.restore();}}
function dessCavalier(g,d){corpsCheval(g,{corps:d.cheval,crin:teinte(d.cheval,-.5)},{yeux:d.yeux});
 // caparaçon
 peint(g,g2=>{g2.moveTo(30,48);g2.quadraticCurveTo(48,40,66,48);g2.lineTo(64,62);g2.quadraticCurveTo(48,66,32,62);g2.closePath();},d.tun,{y0:40,y1:66});
 // cavalier
 peint(g,rrect(42,18,16,24,5),d.arm,{y0:18,y1:42});trait(g,[46,40,42,54],teinte(d.arm,-.2),5);
 peint(g,rrect(43,4,14,15,4),d.arm);g.fillStyle='#111';g.fillRect(51,10,6,2.2);if(d.yeux){g.save();g.shadowColor=d.yeux;g.shadowBlur=8;g.fillStyle=d.yeux;g.fillRect(52,10,4,1.6);g.restore();}
 peint(g,poly([47,4,50,-4,53,4]),d.tun);
 arme(g,d.arme==='lance'?'lance':'epee',58,32,d);}
function dessCentaure(g,d){corpsCheval(g,{corps:d.corps,crin:teinte(d.corps,-.5)});
 // torse humain à la place du cou
 g.save();g.fillStyle='rgba(0,0,0,0)';g.restore();
 peint(g,g2=>{g2.moveTo(62,50);g2.lineTo(64,22);g2.quadraticCurveTo(72,18,80,22);g2.lineTo(80,50);g2.closePath();},d.peau,{y0:18,y1:50});
 peint(g,rrect(62,30,18,12,3),d.tun);boule(g,72,13,8,d.peau);g.fillStyle='#2a1a10';g.beginPath();g.arc(76,12,1.2,0,7);g.fill();
 peint(g,g2=>{g2.moveTo(64,10);g2.quadraticCurveTo(70,0,80,8);g2.lineTo(66,18);g2.closePath();},'#5a3a1a');
 arme(g,'lance',78,34,d);}
function dessGriffon(g,d){ailes(g,d.aile,46,40,1.1,1.1);
 const c=d.corps;trait(g,[30,62,26,90],teinte(c,-.3),5);trait(g,[38,62,40,90],c,5);trait(g,[62,62,62,90],teinte(c,-.3),5);trait(g,[70,60,74,90],c,5);
 trait(g,[22,52,12,60,10,72],teinte(c,-.2),3);boule(g,10,73,3,teinte(c,-.3));
 ell(g,48,54,25,14,c);
 peint(g,g2=>{g2.moveTo(62,48);g2.quadraticCurveTo(66,28,76,22);g2.quadraticCurveTo(86,26,80,50);g2.closePath();},d.tete,{y0:20,y1:50});
 boule(g,78,22,10,d.tete);peint(g,g2=>{g2.moveTo(85,18);g2.quadraticCurveTo(98,20,94,30);g2.quadraticCurveTo(90,26,86,27);g2.closePath();},'#e8b030');
 g.fillStyle='#111';g.beginPath();g.arc(81,19,1.6,0,7);g.fill();
 g.save();g.translate(6,4);ailes(g,teinte(d.aile,.08),46,40,1,1);g.restore();}
function dessLoup(g,d){const c=d.corps;trait(g,[32,62,30,90],teinte(c,-.3),4);trait(g,[38,62,42,90],c,4);trait(g,[62,62,60,90],teinte(c,-.3),4);trait(g,[68,60,72,90],c,4);
 peint(g,g2=>{g2.moveTo(26,50);g2.quadraticCurveTo(10,48,8,66);g2.quadraticCurveTo(16,58,26,58);g2.closePath();},teinte(c,-.1));
 ell(g,48,56,24,12,c);ell(g,50,62,16,5,d.ventre,{trait:false});
 peint(g,g2=>{g2.moveTo(64,48);g2.quadraticCurveTo(72,34,82,36);g2.lineTo(96,44);g2.quadraticCurveTo(92,50,82,50);g2.quadraticCurveTo(76,54,70,58);g2.closePath();},c,{y0:30,y1:58});
 peint(g,poly([74,36,76,24,81,35]),c);g.fillStyle='#ffde5a';g.beginPath();g.arc(84,40,1.6,0,7);g.fill();g.fillStyle='#111';g.beginPath();g.arc(95,44,1.6,0,7);g.fill();}
function dessTreant(g,d){const e=d.ecorce;
 trait(g,[40,70,32,90],e,7);trait(g,[58,70,66,90],e,7);peint(g,g2=>{g2.moveTo(36,76);g2.quadraticCurveTo(30,40,40,24);g2.lineTo(60,24);g2.quadraticCurveTo(70,40,64,76);g2.closePath();},e,{y0:20,y1:80});
 g.strokeStyle='rgba(30,18,8,.6)';g.lineWidth=1.2;for(let k=0;k<5;k++){g.beginPath();g.moveTo(40+k*5,30);g.quadraticCurveTo(42+k*5,55,40+k*5,74);g.stroke();}
 trait(g,[62,36,78,26,86,30],e,5);trait(g,[38,36,24,22,18,26],e,5);
 for(const [x,y,r] of [[50,14,16],[34,20,11],[66,18,12],[22,22,8],[84,26,8],[50,2,10]])boule(g,x,y,r,d.feuille);
 g.fillStyle='#1a1008';g.beginPath();g.ellipse(46,42,2.4,3.2,0,0,7);g.ellipse(56,42,2.4,3.2,0,0,7);g.fill();g.save();g.shadowColor='#d8ff7a';g.shadowBlur=6;g.fillStyle='#d8ff7a';g.beginPath();g.arc(46,42,1,0,7);g.arc(56,42,1,0,7);g.fill();g.restore();
 g.fillStyle='#1a1008';g.beginPath();g.ellipse(51,54,5,2,0,0,7);g.fill();}
function dessDragon(g,d){const c=d.corps,a=d.aile;const pt=d.petit?.82:1;g.save();g.translate(50,92);g.scale(pt,pt);g.translate(-50,-92);
 // aile arrière
 peint(g,g2=>{g2.moveTo(46,44);g2.lineTo(30,-2);g2.lineTo(18,8);g2.quadraticCurveTo(14,22,6,26);g2.quadraticCurveTo(18,32,14,40);g2.quadraticCurveTo(28,40,30,48);g2.closePath();},teinte(a,-.15),{y0:-2,y1:50});
 // queue
 g.beginPath();g.moveTo(30,60);g.quadraticCurveTo(10,64,6,80);g.quadraticCurveTo(2,88,14,86);g.lineWidth=9;g.strokeStyle=TRAIT;g.lineCap='round';g.stroke();g.lineWidth=7;g.strokeStyle=c;g.stroke();peint(g,poly([14,86,4,82,8,92]),teinte(c,-.2));
 // pattes
 trait(g,[38,64,34,90],teinte(c,-.3),6);trait(g,[62,64,64,90],teinte(c,-.3),6);if(!d.petit){trait(g,[44,66,46,90],c,6);trait(g,[68,62,72,88],c,6);}
 // corps
 ell(g,50,56,26,15,c);g.save();g.beginPath();g.ellipse(52,62,18,7,0,0,7);g.fillStyle=d.ventre;g.globalAlpha=.85;g.fill();g.restore();
 if(d.os){g.strokeStyle='rgba(40,30,20,.75)';g.lineWidth=1.6;for(let k=0;k<5;k++){g.beginPath();g.moveTo(36+k*7,46);g.quadraticCurveTo(38+k*7,58,36+k*7,66);g.stroke();}}
 // cou + tête
 g.beginPath();g.moveTo(66,50);g.quadraticCurveTo(78,36,76,20);g.lineWidth=12;g.strokeStyle=TRAIT;g.stroke();g.lineWidth=10;g.strokeStyle=c;g.stroke();
 peint(g,g2=>{g2.moveTo(70,16);g2.quadraticCurveTo(80,6,92,14);g2.lineTo(100,22);g2.quadraticCurveTo(94,28,84,26);g2.quadraticCurveTo(74,26,70,16);g2.closePath();},c,{y0:6,y1:28});
 peint(g,poly([74,12,70,2,78,10]),teinte(c,.2));peint(g,poly([80,10,80,0,84,10]),teinte(c,.2));
 g.save();g.shadowColor=d.os?'#7cf7ff':'#ffd84a';g.shadowBlur=8;g.fillStyle=d.os?'#9ff':'#ffd84a';g.beginPath();g.arc(84,15,1.8,0,7);g.fill();g.restore();
 // aile avant
 peint(g,g2=>{g2.moveTo(54,44);g2.lineTo(46,-6);g2.lineTo(34,2);g2.quadraticCurveTo(30,16,20,20);g2.quadraticCurveTo(32,26,26,34);g2.quadraticCurveTo(40,36,42,46);g2.closePath();},a,{y0:-6,y1:46});
 g.strokeStyle='rgba(20,12,6,.55)';g.lineWidth=1.2;for(const [x,y] of [[34,2],[22,20],[28,34]]){g.beginPath();g.moveTo(52,42);g.lineTo(x,y);g.stroke();}
 g.restore();}
function dessAnge(g,d){g.save();g.shadowColor='#fff6c8';g.shadowBlur=14;ailes(g,d.aile,46,36,1.15,1.15);g.restore();
 dessHum(g,{robe:d.robe,cheveux:d.cheveux,arme:d.arme,peau:'#f0caa0',tun:d.robe});
 g.save();g.translate(5,3);ailes(g,teinte(d.aile,-.05),46,36,1.05,1.05);g.restore();
 g.save();g.strokeStyle='#ffe58a';g.lineWidth=2;g.shadowColor='#ffe58a';g.shadowBlur=8;g.beginPath();g.ellipse(50,12,9,3,0,0,7);g.stroke();g.restore();}

function dessChevaucheur(g,d){dessLoup(g,d);g.save();g.translate(44,62);g.scale(.62,.62);g.translate(-50,-92);dessHum(g,{petit:1,peau:d.peau,tun:d.tun,arme:'lance',oreilles:1});g.restore();}
function dessOiseau(g,d){ailes(g,d.aile,50,40,1.25,1.15);trait(g,[44,64,40,86],'#c8a050',3);trait(g,[56,64,60,86],'#c8a050',3);for(const x of [40,60]){trait(g,[x,86,x+6,90],'#c8a050',2);trait(g,[x,86,x-4,90],'#c8a050',2);}
 peint(g,g2=>{g2.moveTo(22,50);g2.lineTo(10,62);g2.lineTo(26,58);g2.closePath();},teinte(d.corps,-.2));ell(g,46,54,24,14,d.corps);
 peint(g,g2=>{g2.moveTo(60,46);g2.quadraticCurveTo(66,30,74,24);g2.quadraticCurveTo(84,28,78,48);g2.closePath();},d.tete,{y0:22,y1:50});boule(g,76,24,9,d.tete);
 peint(g,g2=>{g2.moveTo(83,20);g2.quadraticCurveTo(98,22,94,34);g2.quadraticCurveTo(90,28,84,29);g2.closePath();},'#e8b030');g.fillStyle='#111';g.beginPath();g.arc(79,21,1.6,0,7);g.fill();
 g.save();g.translate(6,4);ailes(g,teinte(d.aile,.08),50,40,1.15,1.05);g.restore();}
function dessBehemoth(g,d){const c=d.corps;g.save();g.translate(50,92);g.scale(1.12,1.12);g.translate(-50,-92);
 for(const [x,c2] of [[30,teinte(c,-.3)],[40,c],[62,teinte(c,-.3)],[72,c]])peint(g,rrect(x-5,62,11,28,4),c2,{y0:62,y1:90});
 for(const x of [30,40,62,72]){peint(g,poly([x-5,90,x-3,94,x,90,x+3,94,x+6,90]),'#e8dcc4');}
 ell(g,50,52,30,19,c);ell(g,52,62,20,7,d.ventre,{trait:false});peint(g,g2=>{g2.moveTo(22,46);g2.quadraticCurveTo(10,50,12,62);g2.quadraticCurveTo(18,56,24,56);g2.closePath();},teinte(c,-.1));
 for(let k=0;k<5;k++)peint(g,poly([34+k*7,36,37+k*7,26-(k%2)*3,40+k*7,36]),teinte(c,-.25));
 boule(g,80,46,13,c);peint(g,g2=>{g2.moveTo(84,50);g2.quadraticCurveTo(98,52,96,60);g2.quadraticCurveTo(88,62,82,58);g2.closePath();},teinte(c,-.15));
 g.fillStyle='#fff';for(let k=0;k<3;k++){g.beginPath();g.moveTo(86+k*3,56);g.lineTo(87.5+k*3,60);g.lineTo(89+k*3,56);g.fill();}
 peint(g,g2=>{g2.moveTo(76,36);g2.quadraticCurveTo(70,22,78,14);g2.quadraticCurveTo(76,26,82,34);g2.closePath();},d.corne);peint(g,g2=>{g2.moveTo(86,38);g2.quadraticCurveTo(94,26,90,18);g2.quadraticCurveTo(96,28,90,40);g2.closePath();},d.corne);
 g.save();g.shadowColor='#ff5a2a';g.shadowBlur=6;g.fillStyle='#ffb02a';g.beginPath();g.arc(86,43,2,0,7);g.fill();g.restore();g.restore();}
var SPR_CACHE={};
// ---------- créatures pré-rendues en 3D (sprites3d.js) ----------
var IMG3D={};
function charger3D(){if(typeof SPR3D==='undefined')return;for(const id of Object.keys(SPR3D)){const up=CRE[id]&&CRE[id].amelio;if(up&&!SPR3D[up])SPR3D[up]=SPR3D[id];}for(const id in SPR3D){const im=new Image();im.onload=()=>{IMG3D[id]=im;for(const k in SPR_CACHE)if(k.startsWith(id+':')||k.startsWith('m'+id+':'))delete SPR_CACHE[k];if(typeof V!=='undefined')V.miniDirty=true;};im.src=SPR3D[id].img;}}
function a3d(id){return IMG3D[id]?SPR3D[id]:null;}
// image k de l'animation an (idle, atk, hit, die) : [image, sx, sy, sw, sh]
function cadre3D(id,an,k){const D=SPR3D[id];const ord=['idle','atk','hit','die'];let o=0;for(const a of ord){if(a===an)break;o+=D.n[a]||0;}const n=D.n[an]||D.n.idle;k=Math.max(0,Math.min(n-1,k|0));return[IMG3D[id],(o+k)*D.w,0,D.w,D.h];}
// dessine la créature : pied au point (x,y), echelle = pixels par unité du monde, miroir = regarde à gauche
// 23/11 : liseré sombre et étalonnage commun sur toutes les planches de créatures (style illustré à la Heroes, modèles d'origines variées harmonisés)
/* 24/11 : retouches de couleur des modèles qui détonnaient (ogre jaune plastique, tréant orange, troll blanchâtre) */
const TEINTE3D={spectre:'saturate(.55) brightness(.95)',spectre2:'saturate(.55) brightness(.95)',liche:'saturate(.65) brightness(.92)',liche2:'saturate(.65) brightness(.92)',ogre:'saturate(.6) brightness(.82) sepia(.25) hue-rotate(35deg)',ogre2:'saturate(.6) brightness(.82) sepia(.25) hue-rotate(35deg)',treant:'hue-rotate(28deg) saturate(.7) brightness(.85)',treant2:'hue-rotate(28deg) saturate(.7) brightness(.85)',troll:'sepia(.6) hue-rotate(50deg) saturate(1.3) brightness(.75)',troll2:'sepia(.6) hue-rotate(50deg) saturate(1.3) brightness(.75)'};
const LISERE=new Map();function planche3D(im){if(!im||!im.width)return im;let c=LISERE.get(im);if(c)return c;
 try{const w=im.width,h=im.height;let id0=null;if(typeof IMG3D!=='undefined')for(const k in IMG3D)if(IMG3D[k]===im){id0=k;break;}
  const elite=!!(id0&&typeof CRE!=='undefined'&&Object.values(CRE).some(q=>q.amelio===id0));/* 24/11 : troupes améliorées reconnaissables à leur liseré doré */
  const sil=document.createElement('canvas');sil.width=w;sil.height=h;const sg=sil.getContext('2d');sg.drawImage(im,0,0);sg.globalCompositeOperation='source-in';sg.fillStyle='rgba(24,16,8,.9)';sg.fillRect(0,0,w,h);
  c=document.createElement('canvas');c.width=w;c.height=h;const cg=c.getContext('2d');for(const [dx,dy] of [[-1.5,0],[1.5,0],[0,-1.5],[0,1.5],[-1,-1],[1,1],[-1,1],[1,-1]])cg.drawImage(sil,dx,dy);
  if(elite){sg.fillStyle='rgba(232,186,70,1)';sg.fillRect(0,0,w,h);for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]])cg.drawImage(sil,dx,dy);}
  cg.filter='contrast(1.07) saturate(1.1)'+(TEINTE3D[id0]?' '+TEINTE3D[id0]:'');cg.drawImage(im,0,0);cg.filter='none';}catch(e){c=im;}
 LISERE.set(im,c);return c;}
/* 24/11 : planche sans liseré (créatures de la ville, posées dans une scène éclairée : le liseré leur donnait un air d'autocollant) */
const BRUTE=new Map();function plancheBrute(im,id){let c=BRUTE.get(im);if(c)return c;c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.filter='contrast(1.04) saturate(.95)'+(TEINTE3D[id]?' '+TEINTE3D[id]:'');g.drawImage(im,0,0);g.filter='none';BRUTE.set(im,c);return c;}
/* 23/11 : ombre portée des créatures (silhouette noire couchée vers l'arrière-droite, côté opposé au soleil comme les arbres) */
const PL_NOIR=new WeakMap();function plancheNoire(im){let c=PL_NOIR.get(im);if(c)return c;c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);x.globalCompositeOperation='source-in';x.fillStyle='#000';x.fillRect(0,0,c.width,c.height);PL_NOIR.set(im,c);return c;}
function ombre3D(g,id,an,k,x,y,ppu,miroir,a){const D=SPR3D[id];const [im0,sx,sy,sw,sh]=cadre3D(id,an,k);const im=plancheNoire(planche3D(im0));const e=ppu/D.pxu;g.save();g.globalAlpha*=a;g.translate(x,y);g.transform(1,0,-.75,.32,0,0);if(miroir)g.scale(-1,1);g.drawImage(im,sx,sy,sw,sh,-D.ax*e,-D.ay*e,sw*e,sh*e);g.restore();}
function dessiner3D(g,id,an,k,x,y,ppu,miroir,brut){const D=SPR3D[id];const [im0,sx,sy,sw,sh]=cadre3D(id,an,k);const im=brut?plancheBrute(im0,id):planche3D(im0);const e=ppu/D.pxu;g.save();g.translate(x,y);if(miroir)g.scale(-1,1);g.drawImage(im,sx,sy,sw,sh,-D.ax*e,-D.ay*e,sw*e,sh*e);g.restore();}
charger3D();
// sprite d'une créature (face à droite), taille S, avec ombre
function spriteCreature(id,S,brut){const k=id+':'+S+(brut?'b':'');if(SPR_CACHE[k])return SPR_CACHE[k];const c=mkC(S,S);
 if(a3d(id)){const D=SPR3D[id];const g=c.getContext('2d');ombreSol(g,S*.5,S*.896,S*.3,S*.06,.4);// même cadrage que les créatures dessinées : sol à 0,896 S
  let ppu=S*.62/1.7;const [im,sx,sy,sw,sh]=cadre3D(id,'idle',0);const e0=ppu/D.pxu;const larg=Math.max(D.ax,sw-D.ax)*2*e0,haut=D.ay*e0;const f=Math.min(1,S*.98/larg,S*.86/haut);ppu*=f;
  dessiner3D(g,id,'idle',0,S*.5,S*.896,ppu,false,brut);SPR_CACHE[k]=c;return c;}const g=c.getContext('2d');g.translate(S*.1,S*.16);g.scale(S/125,S/125);const d=CRE[id].d; // marge : ailes et armes ne sont jamais coupées
 ombreSol(g,50,91,30,6,.4);
 ({chevaucheur:dessChevaucheur,oiseau:dessOiseau,behemoth:dessBehemoth,hum:dessHum,squel:dessSquel,spectre:dessSpectre,cheval:dessCheval,cavalier:dessCavalier,centaure:dessCentaure,griffon:dessGriffon,loup:dessLoup,treant:dessTreant,dragon:dessDragon,ange:dessAnge})[d.t](g,d);
 eclairage(c);SPR_CACHE[k]=c;return c;}
// modelé : lumière chaude en haut à gauche, ombre froide en bas à droite, liseré de contre-jour (donne du volume aux figures dessinées)
function eclairage(c){const g=c.getContext('2d');const W=c.width,H=c.height;g.save();g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='source-atop';
 // grain de matière (peau, cuir, métal) : casse l'aplat du dessin
 if(!eclairage.p){const n=mkC(128,128),gn=n.getContext('2d'),im=gn.createImageData(128,128);const [,T2,T3]=textures();for(let i=0;i<128*128;i++){const v=128+(T2[((i>>7)*2&255)*256+((i&127)*2&255)]-.5)*150+(T3[i&65535]-.5)*90;im.data[i*4]=im.data[i*4+1]=im.data[i*4+2]=Math.max(0,Math.min(255,v));im.data[i*4+3]=255;}gn.putImageData(im,0,0);eclairage.p=n;}
 {const t=mkC(W,H),tg=t.getContext('2d');tg.drawImage(c,0,0);tg.globalCompositeOperation='overlay';tg.globalAlpha=.32;tg.fillStyle=tg.createPattern(eclairage.p,'repeat');tg.fillRect(0,0,W,H);tg.globalAlpha=1;tg.globalCompositeOperation='destination-in';tg.drawImage(c,0,0);g.globalCompositeOperation='copy';g.drawImage(t,0,0);g.globalCompositeOperation='source-atop';}
 const gr=g.createLinearGradient(W*.15,H*.05,W*.85,H*.95);gr.addColorStop(0,'rgba(255,236,190,.26)');gr.addColorStop(.45,'rgba(255,255,255,0)');gr.addColorStop(1,'rgba(10,14,40,.4)');g.fillStyle=gr;g.fillRect(0,0,W,H);
 const sol=g.createLinearGradient(0,H*.6,0,H*.92);sol.addColorStop(0,'rgba(0,0,0,0)');sol.addColorStop(1,'rgba(20,12,4,.22)');g.fillStyle=sol;g.fillRect(0,0,W,H);g.restore();}
function spriteMiroir(id,S){const k='m'+id+':'+S;if(SPR_CACHE[k])return SPR_CACHE[k];const s=spriteCreature(id,S);const c=mkC(S,S);const g=c.getContext('2d');g.translate(S,0);g.scale(-1,1);g.drawImage(s,0,0);SPR_CACHE[k]=c;return c;}

// ---------- héros sur la carte (cavalier à la bannière) ----------
// héros pré-rendu en 3D (personnage Mixamo) avec sa bannière ; f = image de marche (-1 = repos)
function spriteHeros3D(h,S,f){const id='h_'+h.classe;if(!a3d(id))return null;const k='h3'+h.classe+':'+h.j+':'+S+':'+f;if(SPR_CACHE[k])return SPR_CACHE[k];const c=mkC(S,S);const g=c.getContext('2d');
 const col=COULEURS[G.joueurs[h.j].coul];ombreSol(g,S*.5,S*.9,S*.26,S*.05,.45);
 const D=SPR3D[id];let ppu=S*.86/1.75;const [,,,sw]=cadre3D(id,'idle',0);const e0=ppu/D.pxu;const f2=Math.min(1,S*.92/(D.ay*e0));ppu*=f2;
 // bannière plantée derrière le héros
 const bx=S*.36,by=S*.9;g.strokeStyle='#3a2a18';g.lineWidth=S*.022;g.beginPath();g.moveTo(bx,by);g.lineTo(bx,S*.06);g.stroke();
 const gr=g.createLinearGradient(bx,0,bx+S*.26,0);gr.addColorStop(0,col.f);gr.addColorStop(.5,col.c);gr.addColorStop(1,col.f);g.fillStyle=gr;g.beginPath();g.moveTo(bx,S*.07);g.lineTo(bx+S*.24,S*.09);g.lineTo(bx+S*.2,S*.15);g.lineTo(bx+S*.24,S*.21);g.lineTo(bx,S*.23);g.closePath();g.fill();
 g.globalAlpha=.25;g.fillStyle='#000';g.fillRect(bx,S*.07,S*.24,S*.012);g.globalAlpha=1;
 dessiner3D(g,id,f<0?'idle':'atk',f<0?0:f,S*.52,S*.9,ppu,false);SPR_CACHE[k]=c;return c;}
function spriteHeros(h,S){const k='h'+h.classe+':'+h.j+':'+S;if(SPR_CACHE[k])return SPR_CACHE[k];const c=mkC(S,S);const g=c.getContext('2d');g.scale(S/100,S/100);
 {const c3=spriteHeros3D(h,S,-1);if(c3){SPR_CACHE[k]=c3;return c3;}}
 const col=COULEURS[G.joueurs[h.j].coul];const fac=FAC[h.fac];const mag=['clerc','druide','necromancien'].includes(h.classe);
 ombreSol(g,50,92,32,6,.45);
 // bannière
 trait(g,[34,70,34,2],'#6a4a2a',2);peint(g,g2=>{g2.moveTo(34,2);g2.lineTo(58,6);g2.lineTo(52,12);g2.lineTo(58,18);g2.lineTo(34,20);g2.closePath();},col.c,{y0:2,y1:20});
 corpsCheval(g,{corps:h.fac==='necro'?'#3a3644':h.fac==='sylve'?'#8a5a32':'#e8e0cc',crin:h.fac==='necro'?'#1a1820':'#5a3a1a'},{yeux:h.fac==='necro'?'#ff5a3a':null});
 peint(g,g2=>{g2.moveTo(30,48);g2.quadraticCurveTo(48,40,66,48);g2.lineTo(64,62);g2.quadraticCurveTo(48,66,32,62);g2.closePath();},col.c,{y0:40,y1:66});
 g.strokeStyle='#e8c060';g.lineWidth=1.5;g.beginPath();g.moveTo(33,60);g.quadraticCurveTo(48,64,63,60);g.stroke();
 peint(g,g2=>{g2.moveTo(40,20);g2.lineTo(34,46);g2.lineTo(46,44);g2.closePath();},col.f);
 peint(g,rrect(42,18,16,24,5),mag?fac.coul.drap:'#c3ccd6',{y0:18,y1:42});
 boule(g,50,12,7.5,'#e3b58c');if(mag)peint(g,g2=>{g2.moveTo(41,16);g2.quadraticCurveTo(42,0,52,2);g2.quadraticCurveTo(60,6,58,14);g2.lineTo(54,9);g2.quadraticCurveTo(46,8,45,18);g2.closePath();},fac.coul.drap);
 else peint(g,g2=>{g2.moveTo(42,12);g2.quadraticCurveTo(50,-2,58,12);g2.closePath();},'#b9c2cc');
 if(mag)arme(g,'baton',58,34,{orbe:h.fac==='necro'?'#7cf7a2':'#ffe79a'});else arme(g,'epee',58,32,{});
 eclairage(c);SPR_CACHE[k]=c;return c;}

// ---------- portraits ----------
var IMGP={};(function(){if(typeof POR3D==='undefined')return;for(const c in POR3D)POR3D[c].forEach((u,i)=>{const im=new Image();im.onload=()=>{IMGP[c+i]=im;for(const k in SPR_CACHE)if(k[0]==='p')delete SPR_CACHE[k];};im.src=u;});})();
function portrait(h,S=64){const k='p'+h.id+':'+h.portrait+':'+S+(IMGP[h.classe+0]?'3':'');if(SPR_CACHE[k])return SPR_CACHE[k];
 const ni=Math.max(0,HEROS_NOMS[h.classe].indexOf(h.nom));const ip=IMGP[h.classe+(ni>=0?ni:h.portrait%4)];
 if(ip){const c=mkC(S,S);const g=c.getContext('2d');const fac=FAC[h.fac];const bg=g.createRadialGradient(S*.45,S*.35,S*.05,S*.5,S*.5,S*.75);bg.addColorStop(0,teinte(fac.coul.drap,.3));bg.addColorStop(1,teinte(fac.coul.drap,-.6));g.fillStyle=bg;g.fillRect(0,0,S,S);
  g.drawImage(ip,0,0,S,S);const v=g.createRadialGradient(S/2,S/2,S*.35,S/2,S/2,S*.75);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.45)');g.fillStyle=v;g.fillRect(0,0,S,S);
  g.strokeStyle='#c09a48';g.lineWidth=Math.max(1.5,S/32);g.strokeRect(g.lineWidth/2,g.lineWidth/2,S-g.lineWidth,S-g.lineWidth);SPR_CACHE[k]=c;return c;}const c=mkC(S,S);const g=c.getContext('2d');g.scale(S/64,S/64);const r=creeRng(h.portrait+7);
 const fac=FAC[h.fac];const mag=['clerc','druide','necromancien'].includes(h.classe);const fem=/[ae]$/.test(h.nom)&&!['Tristan','Corbin','Lazare','Ambroise','Nérée','Oren','Faelan','Thalion','Elwyn'].includes(h.nom)||['Isolde','Mélisende','Ysoria','Liriel','Maëlis','Séverine','Ombeline','Morgane','Sylvara','Bérénice','Clothilde'].includes(h.nom);
 const bg=g.createRadialGradient(28,22,4,32,32,44);bg.addColorStop(0,teinte(fac.coul.drap,.35));bg.addColorStop(1,teinte(fac.coul.drap,-.55));g.fillStyle=bg;g.fillRect(0,0,64,64);
 const peaux=h.fac==='necro'?['#d8d0c8','#c8c0c0','#e0d6cc']:['#f0c8a0','#e3b58c','#c99470','#a87650','#f6d8b8'];const peau=r.pick(peaux);
 const chev=r.pick(h.fac==='necro'?['#1a1418','#e8e8e8','#3a2a3a','#6a6a72']:['#2a1a10','#5a3a1a','#a8642a','#e0c070','#7a7a7a','#1a1a1a']);
 // épaules
 const habit=mag?fac.coul.drap:'#9aa6b4';peint(g,g2=>{g2.moveTo(4,64);g2.quadraticCurveTo(6,44,22,42);g2.lineTo(42,42);g2.quadraticCurveTo(58,44,60,64);g2.closePath();},habit,{y0:40,y1:64});
 if(!mag){g.strokeStyle='rgba(255,255,255,.35)';g.lineWidth=1.2;g.beginPath();g.moveTo(12,50);g.quadraticCurveTo(32,44,52,50);g.stroke();}
 peint(g,rrect(26,36,12,9,3),teinte(peau,-.1));
 // cheveux arrière
 if(fem&&!(!mag&&r.f()<.4))peint(g,g2=>{g2.moveTo(17,24);g2.quadraticCurveTo(14,52,22,50);g2.lineTo(42,50);g2.quadraticCurveTo(50,52,47,24);g2.closePath();},chev);
 // visage
 peint(g,g2=>{g2.moveTo(20,22);g2.quadraticCurveTo(20,44,32,44);g2.quadraticCurveTo(44,44,44,22);g2.quadraticCurveTo(32,8,20,22);g2.closePath();},peau,{y0:8,y1:44,clair:.18});
 g.fillStyle='#fff';g.beginPath();g.ellipse(26.5,27,3,1.8,0,0,7);g.ellipse(37.5,27,3,1.8,0,0,7);g.fill();
 g.fillStyle=h.fac==='necro'?'#7cf0d0':r.pick(['#3a6aa8','#4a8a3a','#5a3a1a','#2a2a2a']);g.beginPath();g.arc(27,27,1.5,0,7);g.arc(38,27,1.5,0,7);g.fill();
 g.strokeStyle=teinte(chev,-.2);g.lineWidth=1.6;g.beginPath();g.moveTo(23,23.5);g.lineTo(29.5,23);g.moveTo(34.5,23);g.lineTo(41,23.5);g.stroke();
 g.strokeStyle=teinte(peau,-.35);g.lineWidth=1.2;g.beginPath();g.moveTo(32,28);g.quadraticCurveTo(30,34,33,34.5);g.stroke();
 g.strokeStyle=fem?'#b04a4a':teinte(peau,-.45);g.lineWidth=1.5;g.beginPath();g.moveTo(28.5,38.5);g.quadraticCurveTo(32,40,35.5,38.5);g.stroke();
 if(!fem&&r.f()<.55)peint(g,g2=>{g2.moveTo(21,32);g2.quadraticCurveTo(22,48,32,49);g2.quadraticCurveTo(42,48,43,32);g2.quadraticCurveTo(38,38,32,36.5);g2.quadraticCurveTo(26,38,21,32);g2.closePath();},chev,{trait:'rgba(0,0,0,.4)'});
 // couvre-chef
 if(mag)peint(g,g2=>{g2.moveTo(12,46);g2.quadraticCurveTo(10,8,32,6);g2.quadraticCurveTo(54,8,52,46);g2.lineTo(46,44);g2.quadraticCurveTo(46,16,32,15);g2.quadraticCurveTo(18,16,18,44);g2.closePath();},fac.coul.drap,{y0:6,y1:46});
 else if(r.f()<.6)peint(g,g2=>{g2.moveTo(17,25);g2.quadraticCurveTo(17,6,32,6);g2.quadraticCurveTo(47,6,47,25);g2.lineTo(44,24);g2.quadraticCurveTo(32,18,20,24);g2.closePath();},'#aeb8c4',{y0:6,y1:26});
 else peint(g,g2=>{g2.moveTo(19,24);g2.quadraticCurveTo(18,9,32,9);g2.quadraticCurveTo(46,9,45,24);g2.quadraticCurveTo(40,15,32,16);g2.quadraticCurveTo(24,15,19,24);g2.closePath();},chev);
 if(!mag&&h.fac==='bastion'){g.fillStyle='#e8c060';g.fillRect(30,6,4,6);}
 g.strokeStyle='rgba(20,12,4,.9)';g.lineWidth=2;g.strokeRect(1,1,62,62);
 SPR_CACHE[k]=c;return c;}

// ---------- icônes de ressources ----------
var IMGICO={};if(typeof ICO3D!=='undefined')for(const r in ICO3D){const im=new Image();im.onload=()=>{IMGICO[r]=im;for(const k in SPR_CACHE)if(k.startsWith('r'+r+':'))delete SPR_CACHE[k];if(typeof majUI==='function'&&typeof G!=='undefined'&&G)try{majUI();}catch(e){}};im.src=ICO3D[r];}
function iconeRes(r,S=32){const k='r'+r+':'+S;if(SPR_CACHE[k])return SPR_CACHE[k];if(IMGICO[r]){const c=mkC(S,S);const g=c.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(IMGICO[r],-S*.06,-S*.06,S*1.12,S*1.12);SPR_CACHE[k]=c;return c;}
 const c=mkC(S,S);const g=c.getContext('2d');g.scale(S/32,S/32);
 ombreSol(g,16,27,12,3.5,.35);
 switch(r){
 case 'or':for(const [x,y] of [[10,22],[18,23],[14,18],[22,19],[17,14],[11,16]]){ell(g,x,y,5.5,3,'#f2c23a',{lw:1});}g.fillStyle='#fff6b0';g.fillRect(15,12,2,1.2);break;
 case 'bois':for(const [y,x] of [[22,4],[22,13],[16,8]]){peint(g,rrect(x,y-4,15,8,4),'#8a5a30',{y0:y-4,y1:y+4});ell(g,x+14,y,3,4,'#d8b078',{lw:1});}break;
 case 'minerai':for(const [x,y,s] of [[10,21,7],[20,22,6],[15,15,6]])peint(g,poly([x-s,y+3,x-s*.6,y-s*.7,x+s*.4,y-s,x+s,y+1,x+s*.3,y+s*.6]),'#8a8f96',{y0:y-s,y1:y+s});g.fillStyle='#c8b070';g.fillRect(13,18,2,2);g.fillRect(19,21,2,1.5);break;
 case 'mercure':peint(g,g2=>{g2.moveTo(13,6);g2.lineTo(19,6);g2.lineTo(19,12);g2.quadraticCurveTo(27,16,25,24);g2.quadraticCurveTo(22,29,16,29);g2.quadraticCurveTo(10,29,7,24);g2.quadraticCurveTo(5,16,13,12);g2.closePath();},'#cfe3ea',{y0:6,y1:29});ell(g,16,22,7,4.5,'#b8c0cc');peint(g,rrect(12,3,8,4,1),'#8a5a30');break;
 case 'soufre':peint(g,g2=>{g2.moveTo(4,27);g2.quadraticCurveTo(8,10,16,9);g2.quadraticCurveTo(25,10,28,27);g2.closePath();},'#e8d23a',{y0:9,y1:27});g.fillStyle='rgba(255,255,220,.6)';g.beginPath();g.arc(13,15,2,0,7);g.fill();break;
 case 'cristal':for(const [x,h,w] of [[10,16,4],[16,22,5],[22,14,4]])peint(g,poly([x-w,27,x-w,27-h*.6,x,27-h,x+w,27-h*.6,x+w,27]),'#e0384a',{y0:27-h,y1:27});break;
 case 'gemmes':for(const [x,y,cl] of [[10,22,'#3a7ae8'],[20,22,'#3ac85a'],[15,15,'#e83a8a'],[22,14,'#f0d03a']])peint(g,poly([x-5,y,x-3,y-4,x+3,y-4,x+5,y,x,y+5]),cl,{y0:y-4,y1:y+5});break;
 }
 SPR_CACHE[k]=c;return c;}
