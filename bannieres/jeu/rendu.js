'use strict';
/* =========================================================
   BANNIÈRES & SORTILÈGES — affichage de la carte d'aventure (Canvas 2D) et commandes au doigt / à la souris
   ========================================================= */
var V={zoom:1,cam:{x:0,y:0},sel:null,chemin:null,sol:null,fog:null,fogDirty:true,miniDirty:true,anim:null,dpr:1,occupe:false,survol:-1,t:0,images:0};
function estMobile(){return innerWidth<=860;}
function tailleT(){return Math.round((estMobile()?42:50)*V.zoom);}
function vueJoueur(){// joueur dont on montre le brouillard : le joueur humain courant (ou le premier humain)
 const c=G.joueurs[G.courant];if(c&&c.humain)return G.courant;const h=G.joueurs.find(p=>p.humain&&!p.elim);return h?h.id:G.courant;}
function initRendu(){V.sol=peindreSol(Object.assign({graine:G.graine},G.carte),G.objs);V.fog=mkC(G.carte.N,G.carte.N);V.mini=document.getElementById('minicarte');V.fogDirty=true;V.miniDirty=true;V.sel=null;V.chemin=null;redim();}
function redim(){const cv=document.getElementById('carte');V.dpr=Math.min(2,devicePixelRatio||1);cv.width=innerWidth*V.dpr;cv.height=innerHeight*V.dpr;V.mini.width=V.mini.height=Math.min(440,G?G.carte.N*4:220);V.miniDirty=true;}
function zoneVue(){// zone utile de la carte (hors panneaux)
 if(estMobile()){const bas=document.getElementById('panneau').offsetHeight||96;return{x:0,y:28,w:innerWidth,h:innerHeight-28-bas};}
 return{x:0,y:0,w:innerWidth-236,h:innerHeight-30};}
function centrer(x,y,instant){const T=tailleT(),z=zoneVue();V.cam.x=(x+.5)*T-z.w/2;V.cam.y=(y+.5)*T-z.h/2-z.y;borner();}
function borner(){const T=tailleT(),z=zoneVue(),N=G.carte.N;V.cam.x=Math.max(-z.w*.3,Math.min(N*T-z.w*.7,V.cam.x));V.cam.y=Math.max(-z.y-z.h*.3,Math.min(N*T-z.h*.7,V.cam.y));}
function majFog(){const N=G.carte.N;const g=V.fog.getContext('2d');const img=g.createImageData(N,N);const vu=G.joueurs[vueJoueur()].vu;for(let i=0;i<N*N;i++){img.data[i*4+3]=vu[i]?0:255;img.data[i*4]=8;img.data[i*4+1]=6;img.data[i*4+2]=4;}g.putImageData(img,0,0);V.fogDirty=false;}
var COUL_MINI={herbe:'#5a8a34',terre:'#8a6a44',rude:'#9a8762',neige:'#dde6ef',sable:'#d8bc78',marais:'#4f5e34',lave:'#4a2e28',eau:'#2f6a96'};
function majMini(){const N=G.carte.N,S=V.mini.width,k=S/N;const g=V.mini.getContext('2d');const vu=G.joueurs[vueJoueur()].vu;
 for(let i=0;i<N*N;i++){const x=i%N,y=(i/N)|0;let c=COUL_MINI[TER[G.carte.ter[i]]];if(G.carte.obs[i])c=teinte(c,-.35);if(G.carte.route[i]&&!G.carte.obs[i])c='#c8a070';if(!vu[i])c='#0a0806';g.fillStyle=c;g.fillRect(x*k,y*k,Math.ceil(k),Math.ceil(k));}
 for(const o of G.objs){if(!vu[idx(o.x,o.y)])continue;if(o.t==='ville'||o.t==='mine'){g.fillStyle=o.prop>=0?COULEURS[G.joueurs[o.prop].coul].c:'#aaa';const s=o.t==='ville'?3:1.6;g.fillRect((o.x-s/2+.5)*k,(o.y-s/2+.5)*k,s*k,s*k);}}
 for(const h of G.heros){if(!vu[idx(h.x,h.y)])continue;g.fillStyle=COULEURS[G.joueurs[h.j].coul].c;g.beginPath();g.arc((h.x+.5)*k,(h.y+.5)*k,Math.max(2,k*.9),0,7);g.fill();g.strokeStyle='#fff';g.lineWidth=1;g.stroke();}
 V.miniImg=g.getImageData(0,0,S,S);V.miniDirty=false;}
function dessinerMini(){if(V.miniDirty)majMini();const g=V.mini.getContext('2d');g.putImageData(V.miniImg,0,0);const T=tailleT(),z=zoneVue(),k=V.mini.width/(G.carte.N*T);g.strokeStyle='#ffe08a';g.lineWidth=1.5;g.strokeRect(V.cam.x*k,(V.cam.y+z.y)*k,z.w*k,z.h*k);}

function posHeros(h){if(V.anim&&V.anim.h===h){const a=V.anim;const t=Math.min(1,(performance.now()-a.t0)/a.dur);return[a.x0+(a.x1-a.x0)*t,a.y0+(a.y1-a.y0)*t];}return[h.x,h.y];}
function dessiner(){if(!G)return;V.t=performance.now()/1000;V.images++;const cv=document.getElementById('carte');const g=cv.getContext('2d');const T=tailleT(),N=G.carte.N;
 g.setTransform(V.dpr,0,0,V.dpr,0,0);g.fillStyle='#0a0806';g.fillRect(0,0,innerWidth,innerHeight);
 const z=zoneVue();const ox=-V.cam.x,oy=-V.cam.y;
 g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
 // sol
 const k=PX/T;const sx=Math.max(0,-ox*k),sy=Math.max(0,-oy*k);const dx=Math.max(0,ox),dy=Math.max(0,oy);const sw=Math.min(V.sol.width-sx,(innerWidth-dx)*k),sh=Math.min(V.sol.height-sy,(innerHeight-dy)*k);
 if(sw>0&&sh>0)g.drawImage(V.sol,sx,sy,sw,sh,dx,dy,sw/k,sh/k);
 // reflets sur l'eau
 const x0=Math.max(0,Math.floor(-ox/T)-2),x1=Math.min(N-1,Math.ceil((innerWidth-ox)/T)+2),y0=Math.max(0,Math.floor(-oy/T)-2),y1=Math.min(N-1,Math.ceil((innerHeight-oy)/T)+3);
 g.fillStyle='rgba(255,255,255,.10)';for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const i=y*N+x;if(G.carte.ter[i]!==EAU)continue;const ph=Math.sin(V.t*1.3+x*1.7+y*2.3);if(ph>.6){g.fillRect(ox+(x+.3)*T,oy+(y+.5+ph*.1)*T,T*.3,1.5);}}
 // chemin (sous les sprites)
 dessinerChemin(g,T,ox,oy);
 // sélection
 const hs=V.sel&&V.sel.t==='heros'?heroPar(V.sel.id):null;
 if(hs){const [hx,hy]=posHeros(hs);g.save();g.strokeStyle=`rgba(255,230,120,${.55+.3*Math.sin(V.t*4)})`;g.lineWidth=2.5;g.beginPath();g.ellipse(ox+(hx+.5)*T,oy+(hy+.85)*T,T*.42,T*.16,0,0,7);g.stroke();g.restore();}
 // objets triés par rangée
 const hpar={};for(const h of G.heros){const [hx,hy]=posHeros(h);const ry=Math.round(hy);(hpar[ry]=hpar[ry]||[]).push(h);}
 const objPar={};for(const o of G.objs){if(o.y<y0-1||o.y>y1+2||o.x<x0-2||o.x>x1+2)continue;(objPar[o.y]=objPar[o.y]||[]).push(o);}
 for(let y=y0;y<=y1+2&&y<N;y++){
  for(let x=x0;x<=x1;x++){const i=y*N+x;const o=G.carte.obs[i];
   if(o===OBS.VEG||o===OBS.ROC){const s=spriteObstacle(o,TER[G.carte.ter[i]],(x*7+y*13)%9);const w=s.width*T/TS,h=s.height*T/TS;g.drawImage(s,ox+(x+.5)*T-w/2,oy+(y+1)*T-h+T*.1,w,h);}
   if(y>0&&G.carte.obs[i-N]===OBS.MONT){const s=spriteObstacle(OBS.MONT,TER[G.carte.ter[i-N]],(x*5+y*11)%7);const w=s.width*T/TS,h=s.height*T/TS;g.drawImage(s,ox+(x+1)*T-w/2,oy+(y+1)*T-h+T*.06,w,h);}}
  for(const o of objPar[y]||[])dessinerObjet(g,o,T,ox,oy);
  for(const h of hpar[y]||[]){const [hx,hy]=posHeros(h);const s=spriteHeros(h,128);const w=T*1.25;g.drawImage(s,ox+(hx+.5)*T-w/2,oy+(hy+1)*T-w*.98,w,w);}}
 // croix du Graal quand la carte est complète
 if(graalConnu(vueJoueur())){const [gx,gy]=xy(G.carte.graal);const px=ox+(gx+.5)*T,py=oy+(gy+.5)*T;g.save();g.translate(px,py);g.lineCap='round';for(const [lw,col] of [[7,'rgba(40,10,4,.8)'],[4,'#e83a2a']]){g.lineWidth=lw;g.strokeStyle=col;g.beginPath();g.moveTo(-T*.22,-T*.22);g.lineTo(T*.22,T*.22);g.moveTo(T*.22,-T*.22);g.lineTo(-T*.22,T*.22);g.stroke();}g.restore();}
 // brouillard
 if(V.fogDirty)majFog();g.save();g.imageSmoothingEnabled=true;g.drawImage(V.fog,0,0,N,N,ox-T*.5,oy-T*.5,N*T,N*T);
 // bords hors carte
 g.restore();
 if(!estMobile())dessinerMini();else if(V.mini.classList.contains('ouvert'))dessinerMini();
}
function dessinerObjet(g,o,T,ox,oy){const cx=ox+(o.x+.5)*T,by=oy+(o.y+1)*T;let s,w,h;
 switch(o.t){
 case 'ville':{s=spriteVille(o.fac);w=s.width*T/TS;h=s.height*T/TS;g.drawImage(s,cx-w/2,by-h+T*.05,w,h);drapeau(g,cx+T*.05,by-h*.86,o.prop>=0?COULEURS[G.joueurs[o.prop].coul].c:'#d8d2c2',V.t,T/40);if(o.prop>=0){drapeau(g,cx-w*.42,by-h*.45,COULEURS[G.joueurs[o.prop].coul].c,V.t+1,T/56);drapeau(g,cx+w*.42,by-h*.45,COULEURS[G.joueurs[o.prop].coul].c,V.t+2,T/56);}break;}
 case 'mine':{s=spriteMine(o.res);w=s.width*T/TS;h=s.height*T/TS;g.drawImage(s,cx-w/2,by-h+T*.05,w,h);drapeau(g,cx+w*.28,by-h*.7,o.prop>=0?COULEURS[G.joueurs[o.prop].coul].c:'#d8d2c2',V.t,T/56);break;}
 case 'res':{s=iconeRes(o.res,64);w=T*.95;g.drawImage(s,cx-w/2,by-w*.98,w,w);break;}
 case 'coffre':{s=spriteCoffre();w=T*.95;g.drawImage(s,cx-w/2,by-w,w,w);break;}
 case 'artefact':{s=spriteArtefact(o.art);w=T*.95;const b=Math.sin(V.t*3+o.id)*T*.03;g.drawImage(s,cx-w/2,by-w+b,w,w);break;}
 case 'bat':{s=spriteLieu(o.b,o.cre);w=s.width*T/TS;h=s.height*T/TS;g.drawImage(s,cx-w/2,by-h+T*.08,w,h);break;}
 case 'monstre':{s=spriteMiroir(o.cre,160);w=T*1.62;const b=Math.abs(Math.sin(V.t*2+o.id))*T*.03;g.drawImage(s,cx-w/2,by-w*.92-b,w,w);break;}
 }}
function dessinerChemin(g,T,ox,oy){const c=V.chemin;if(!c)return;const h=heroPar(c.h);if(!h)return;let prev=[h.x,h.y];
 for(let k=0;k<c.ch.length;k++){const i=c.ch[k];const [x,y]=xy(i);const ok=c.cout[k]<=h.mp;const fin=k===c.ch.length-1;
  const px=ox+(x+.5)*T,py=oy+(y+.5)*T;
  if(fin){const cible=G.occ[i]&&G.oi[G.occ[i]]||null;const enn=(cible&&cible.t==='monstre')||G.hpos[i];g.save();g.translate(px,py);g.lineWidth=4;g.strokeStyle=TRAIT;
    if(enn){g.rotate(.785);for(let r=0;r<2;r++){g.rotate(1.57);g.beginPath();g.moveTo(-T*.26,0);g.lineTo(T*.26,0);g.lineWidth=5;g.strokeStyle=TRAIT;g.stroke();g.lineWidth=3;g.strokeStyle=ok?'#e8e8e8':'#e85a4a';g.stroke();}}
    else{g.beginPath();g.moveTo(-T*.18,-T*.18);g.lineTo(T*.18,T*.18);g.moveTo(T*.18,-T*.18);g.lineTo(-T*.18,T*.18);g.stroke();g.lineWidth=2.5;g.strokeStyle=ok?'#6ae86a':'#e85a4a';g.stroke();}
    g.restore();}
  else{const [nx,ny]=xy(c.ch[k+1]);const a=Math.atan2(ny-y,nx-x);g.save();g.translate(px,py);g.rotate(a);g.beginPath();g.moveTo(T*.16,0);g.lineTo(-T*.1,-T*.11);g.lineTo(-T*.04,0);g.lineTo(-T*.1,T*.11);g.closePath();g.fillStyle=ok?'#6ae86a':'#e85a4a';g.fill();g.lineWidth=1.2;g.strokeStyle=TRAIT;g.stroke();g.restore();}
  prev=[x,y];}}

// ---------- descriptions ----------
function qteTxt(n){return n<5?'Quelques':n<10?'Plusieurs':n<20?'Une bande de':n<50?'Beaucoup de':n<100?'Une horde de':n<250?'Une multitude de':n<500?'Un essaim de':n<1000?'Une nuée de':'Une légion de';}
function menaceTxt(m){const h=V.sel&&V.sel.t==='heros'?heroPar(V.sel.id):null;if(!h)return'';const r=forceArmee(pileMonstre(m))/Math.max(1,forceArmee(h.armee,h));
 return r<.25?'<span style="color:#8f8">Proie facile</span>':r<.6?'<span style="color:#cf8">Combat favorable</span>':r<1.1?'<span style="color:#fd6">Combat équilibré</span>':r<2?'<span style="color:#f96">Dangereux</span>':'<span style="color:#f55">Mortel</span>';}
function descCase(i){const [x,y]=xy(i);const vu=G.joueurs[vueJoueur()].vu;if(!vu[i])return'Terres inexplorées';const o=G.occ[i]&&G.oi[G.occ[i]];const hid=G.hpos[i];
 if(hid){const h=heroPar(hid);return`<b>${h.nom}</b>, ${CLASSES[h.classe].nom} (niv. ${h.niv})<br>${G.joueurs[h.j].nom}`;}
 if(!o){// partie d'une ville ?
  for(const v of G.objs)if(v.t==='ville'&&Math.abs(v.x-x)<=1&&(y===v.y||y===v.y-1))return descObjet(v);
  for(const m of G.objs)if(m.t==='mine'&&m.x===x&&m.y===y+1)return descObjet(m);
  const t=TER_NOM[TER[G.carte.ter[i]]];return t+(G.carte.route[i]?' — route':'')+(G.carte.obs[i]===OBS.VEG?' — forêt':G.carte.obs[i]===OBS.ROC?' — rochers':G.carte.obs[i]>=OBS.MONT&&G.carte.obs[i]<OBS.STRUCT?' — montagnes':'');}
 return descObjet(o);}
function descObjet(o){const prop=o.prop>=0?G.joueurs[o.prop].nom:'sans maître';
 switch(o.t){case 'ville':return`<b>${o.nom}</b> — ${FAC[o.fac].ville}<br>${o.prop>=0?'Bannière : '+prop:'Ville neutre'}`;
  case 'mine':return`<b>${MINE_NOM[o.res]}</b><br>+${MINE_PROD[o.res]} ${RES_NOM[o.res].toLowerCase()}/jour — ${prop}`;
  case 'res':return`<b>${RES_NOM[o.res]}</b>`;case 'coffre':return'<b>Coffre au trésor</b>';case 'artefact':return`<b>${ARTS[o.art].nom}</b><br>${txtBonus(ARTS[o.art].b)}`;
  case 'bat':return`<b>${BATIMENTS_CARTE[o.b].nom}${o.b==='habitation'?' : '+CRE[o.cre].pl:''}</b><br>${BATIMENTS_CARTE[o.b].desc}`;
  case 'monstre':return`<b>${qteTxt(o.n)} ${CRE[o.cre].pl.toLowerCase()}</b><br>${menaceTxt(o)}`;}return'';}

// ---------- commandes ----------
var PTR={pts:new Map(),glisse:false,pinch:null,appui:null,dernier:0};
function caseSous(cx,cy){const T=tailleT();const x=Math.floor((cx+V.cam.x)/T),y=Math.floor((cy+V.cam.y)/T);const N=G.carte.N;if(x<0||y<0||x>=N||y>=N)return-1;return y*N+x;}
function brancherCarte(){const cv=document.getElementById('carte');
 cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);PTR.pts.set(e.pointerId,{x:e.clientX,y:e.clientY,x0:e.clientX,y0:e.clientY});PTR.glisse=false;
  if(PTR.pts.size===2){const [a,b]=[...PTR.pts.values()];PTR.pinch={d:Math.hypot(a.x-b.x,a.y-b.y),z:V.zoom};}
  clearTimeout(PTR.appui);if(e.pointerType!=='mouse')PTR.appui=setTimeout(()=>{if(!PTR.glisse&&PTR.pts.size===1){PTR.glisse=true;const i=caseSous(e.clientX,e.clientY);if(i>=0)bulle(descCase(i),e.clientX,e.clientY,2500);}},480);
  if(e.button===2){const i=caseSous(e.clientX,e.clientY);if(i>=0)bulle(descCase(i),e.clientX,e.clientY,2500);PTR.glisse=true;}});
 cv.addEventListener('pointermove',e=>{const p=PTR.pts.get(e.pointerId);
  if(!p){if(e.pointerType==='mouse'&&G){const i=caseSous(e.clientX,e.clientY);if(i!==V.survol){V.survol=i;clearTimeout(V.tSurvol);bulle(null);V.tSurvol=setTimeout(()=>{if(V.survol===i&&i>=0&&!V.occupe){const d=descCase(i);if(G.occ[i]||G.hpos[i]||/<b>/.test(d))bulle(d,e.clientX+14,e.clientY+14,0);}},350);}}return;}
  const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
  if(PTR.pts.size===2&&PTR.pinch){const [a,b]=[...PTR.pts.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);zoomer(PTR.pinch.z*d/PTR.pinch.d,(a.x+b.x)/2,(a.y+b.y)/2);PTR.glisse=true;return;}
  if(Math.hypot(e.clientX-p.x0,e.clientY-p.y0)>9)PTR.glisse=true;if(PTR.glisse){V.cam.x-=dx;V.cam.y-=dy;borner();}});
 const fin=e=>{const p=PTR.pts.get(e.pointerId);PTR.pts.delete(e.pointerId);clearTimeout(PTR.appui);if(PTR.pts.size<2)PTR.pinch=null;if(!p)return;if(!PTR.glisse&&e.type==='pointerup'&&e.button!==2)toucher(caseSous(e.clientX,e.clientY));};
 cv.addEventListener('pointerup',fin);cv.addEventListener('pointercancel',fin);cv.addEventListener('contextmenu',e=>e.preventDefault());
 cv.addEventListener('wheel',e=>{e.preventDefault();zoomer(V.zoom*(e.deltaY<0?1.12:1/1.12),e.clientX,e.clientY);},{passive:false});
 cv.addEventListener('pointerleave',()=>{V.survol=-1;bulle(null);});
 V.mini.addEventListener('pointerdown',e=>{const r=V.mini.getBoundingClientRect();const N=G.carte.N;centrer((e.clientX-r.left)/r.width*N-.5,(e.clientY-r.top)/r.height*N-.5);if(estMobile())V.mini.classList.remove('ouvert');});}
function zoomer(z,cx,cy){const T0=tailleT();z=Math.max(.55,Math.min(1.9,z));const wx=(cx+V.cam.x)/T0,wy=(cy+V.cam.y)/T0;V.zoom=z;const T=tailleT();V.cam.x=wx*T-cx;V.cam.y=wy*T-cy;borner();}
function bulle(html,x,y,ms){const b=document.getElementById('infoBulle');if(!html){b.style.display='none';return;}b.innerHTML=html;b.style.display='block';const w=b.offsetWidth,h=b.offsetHeight;b.style.left=Math.max(4,Math.min(innerWidth-w-4,x-w/2))+'px';b.style.top=Math.max(4,Math.min(innerHeight-h-4,y-h-14))+'px';clearTimeout(b._t);if(ms)b._t=setTimeout(()=>b.style.display='none',ms);}
