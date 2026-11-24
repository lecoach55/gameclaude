'use strict';
/* =========================================================
   BANNIÈRES & SORTILÈGES — écran de combat (grille hexagonale, animations, livre de sorts)
   ========================================================= */
var CB=null;
const SQ=.78; // aplatissement des hexagones (perspective)
const SQP=.86; // portrait : le champ de bataille est tourné (attaquants en bas, défenseurs en haut)
function redimCombat(){const cv=$('cvCombat');const d=Math.min(2,devicePixelRatio||1);cv.width=innerWidth*d;cv.height=innerHeight*d;CB.dpr=d;
 const bas=$('combat').querySelector('.barre-combat').offsetHeight||56;CB.basH=bas;const W=innerWidth,H=innerHeight-bas;
 if(H>W*1.15){const top=Math.max(70,H*.09);let h=(W-12)/9.5;let w=h/1.1547;if(15.5*w*SQP>H-top-10){w=(H-top-10)/(15.5*SQP);h=w*1.1547;}
  CB.geo={w,h,ox:(W-8.5*h)/2,oy:top+Math.max(0,(H-top-15.5*w*SQP)/2),W,H,port:true};}
 else{const top=H*.25;const w=Math.min((W-16)/(H<520?16.5:15.5),(H-top-8)/(8.5*1.1547*SQ));const h=w*1.1547;CB.geo={w,h,ox:(W-15.5*w)/2,oy:top+Math.max(0,(H-top-8.5*h*SQ)/2)-4,W,H,port:false};}
 CB.c3=null;if(V.m3&&R3.ok){try{CB.c3=R3.camCombat(CB.geo,CB.geo.H+60);}catch(e){console.error(e);}}
 CB.fond=null;for(const p of CB.C.piles)CB.aff.set(p.id,centreHex(p.h));}
const PS0=.84; // perspective : la rangée du fond est plus petite que celle du premier plan
function echRang(r){return PS0+(1-PS0)*r/(CH-1);}
function centreHex(hx){if(CB.c3&&CB.c3.p3){const c=CB.c3.p3[hx];return{x:c.x,y:c.y,s:c.s};}const g=CB.geo,q=hx%CW,r=(hx/CW)|0;if(g.port){const s=1;return{x:g.ox+r*g.h*.75+g.h/2,y:g.oy+((CW-1-q)+.5-(r&1)*.5)*g.w*SQP+g.w*SQP*.5,s};}
 const s=echRang(r);let y=g.oy+g.h*SQ*PS0/2;for(let k=0;k<r;k++)y+=g.h*.75*SQ*(echRang(k)+echRang(k+1))/2;return{x:g.W/2+(q-7+(r&1)*.5-.25)*g.w*s,y,s};}
function hexSous(px,py){const P=CB.geo.port;let best=-1,bd=1e9;for(let h=0;h<CW*CH;h++){const c=centreHex(h);const d=Math.hypot((c.x-px),(c.y-py)/(P?SQP:SQ));if(d<bd){bd=d;best=h;}}return bd<CB.geo.w*.62?best:-1;}
function cheminHex(g,c){const G2=CB.geo;const P=G2.port;const k=c.s||1;const rx=(P?G2.h/2:G2.w/2)*k,ry=(P?G2.w/2*SQP*1.1547:G2.h/2*SQ)*k;g.beginPath();for(let k=0;k<6;k++){const a=Math.PI/3*k+(P?0:Math.PI/6);const x=c.x+rx*Math.cos(a),y=c.y+ry*Math.sin(a);k?g.lineTo(x,y):g.moveTo(x,y);}g.closePath();}
function couleurCote(k){const j=CB.C.cotes[k].joueur;return j>=0?COULEURS[G.joueurs[j].coul].c:'#8a7a9a';}

async function combatInteractif(A,D,opts){const C=creerCombat(A,D,Object.assign({graine:R.i(1,1e9)},opts));
 CB={C,humain:[humain(A.joueur),humain(D.joueur)],auto:!!opts.banc,banc:!!opts.banc,aff:new Map(),fx:[],alpha:new Map(),mode:null,survol:-1,log:[],t0:performance.now(),attente:null,fini:false};
 ecran('combat');redimCombat();SON.musique('combat');majBarreCombat();if(($('combat').querySelector('.barre-combat').offsetHeight||56)!==CB.basH)redimCombat();// la file d'initiative remplie change la hauteur de la barre (téléphone)
 logC(`Combat : ${C.stats[0].nom||'Créatures'} contre ${C.stats[1].nom||(D.monstre?qteTxt(D.monstre.n)+' '+CRE[D.monstre.cre].pl.toLowerCase():'la garnison')}.`);
 while(!C.fin&&!CB.abandon){const p=C.actif;if(!p)break;majBarreCombat();
  let a;if(CB.humain[p.cote]&&!CB.auto){a=await new Promise(r=>CB.attente=r);CB.attente=null;if(CB.abandon)break;}else{await pause(CB.banc?60:260);a=iaCombat(C);}
  if(!a)continue;const ok=C.agir(a);if(!ok){if(CB.humain[p.cote])toast('Action impossible.');continue;}
  await jouerEvts(C.evts.slice());}
 majBarreCombat();if(CB.banc){return C;}
 await pause(400);await resultatsCombat(C);ecran('aventure');SON.musique('carte');const c=C;CB=null;return c;}
var ACCEL=1; // accélération des animations (tests automatiques)
var VITESSE=(()=>{try{return Math.min(3,Math.max(1,+localStorage.getItem('bs-vitesse')||1));}catch(e){return 1;}})();// 23/11 : vitesse choisie par le joueur (×1, ×2, ×3), carte et combat
function AC(){return ACCEL*VITESSE;}
const NOMS_VIT={1:'normale',2:'rapide',3:'très rapide'};
function changerVitesse(v){VITESSE=v||(VITESSE%3)+1;try{localStorage.setItem('bs-vitesse',String(VITESSE));}catch(e){}const b=$('cbVit');if(b)b.textContent='×'+VITESSE;return VITESSE;}
function pause(ms){return new Promise(r=>setTimeout(r,ms/AC()));}
function logC(t){CB.log.push(t);if(CB.log.length>3)CB.log.shift();$('cbLog').innerHTML=CB.log.map((l,i)=>`<div style="opacity:${.55+.45*(i===CB.log.length-1)}">${l}</div>`).join('');}
function nomP(p,n){return(n||p.n)>1?CRE[p.c].pl:CRE[p.c].nom;}
async function jouerEvts(ev){const C=CB.C;
 for(const e of ev){const a=e.a&&C.pile(e.a),c=e.c&&C.pile(e.c);
  switch(e.t){
  case 'bouge':{const pts=e.ch.map(centreHex);const dur=e.vol?Math.min(600,150+60*e.ch.length):110;
   if(e.vol){await animer(dur,t=>{CB.aff.set(a.id,{x:pts[0].x+(pts[1].x-pts[0].x)*t,y:pts[0].y+(pts[1].y-pts[0].y)*t-Math.sin(t*Math.PI)*CB.geo.h*.8,s:pts[0].s+(pts[1].s-pts[0].s)*t});});}
   else for(let i=1;i<pts.length;i++){const p0=pts[i-1],p1=pts[i];if(i===1||i%2)SON.pas();await animer(dur,t=>CB.aff.set(a.id,{x:p0.x+(p1.x-p0.x)*t,y:p0.y+(p1.y-p0.y)*t-Math.abs(Math.sin(t*Math.PI))*3,s:p0.s+(p1.s-p0.s)*t}));}
   CB.aff.set(a.id,centreHex(a.h));break;}
  case 'attaque':case 'riposte':{const pa=centreHex(a.h),pc=centreHex(c.h);anim3(a,'atk',420);await animer(140,t=>CB.aff.set(a.id,{x:pa.x+(pc.x-pa.x)*.35*Math.sin(t*Math.PI),y:pa.y+(pc.y-pa.y)*.35*Math.sin(t*Math.PI),s:pa.s}));SON.coup();
   flash(c);texte(pc,`−${e.d}${e.morts?` (${e.morts} †)`:''}`,'#ffd0a0');logC(`${e.t==='riposte'?'Riposte : ':''}${a.n||e.morts?nomP(a):''} inflige${a.n>1?'nt':''} ${e.d} dégâts${e.morts?`, ${e.morts} ${nomP(c,e.morts).toLowerCase()} périssent`:''}.${e.mal?' Maléfice !':''}`);CB.aff.set(a.id,pa);await pause(120);break;}
  case 'tir':{const pa=centreHex(a.h),pc=centreHex(c.h);anim3(a,'atk',380);await pause(160);SON.tir();await projectile(pa,pc,CRE[a.c].d.orbe||(CRE[a.c].d.arme==='baton'?'#ffe79a':null));flash(c);texte(pc,`−${e.d}${e.morts?` (${e.morts} †)`:''}`,'#ffd0a0');logC(`${nomP(a)} tire${a.n>1?'nt':''} : ${e.d} dégâts${e.morts?`, ${e.morts} ${nomP(c,e.morts).toLowerCase()} périssent`:''}.`);await pause(100);break;}
  case 'mort':{SON.mort();CB.mortT=CB.mortT||{};CB.mortT[c.id]=0;await animer(420,t=>{CB.mortT[c.id]=t;});logC(`Les ${CRE[c.c].pl.toLowerCase()} sont anéantis.`);break;}
  case 'sort':{SON.sort();const S=SORTS[e.s];logC(`${C.stats[e.k].nom} lance ${S.nom}.`);const pc=centreHex(e.h);const dep={x:e.k?CB.geo.W-40:40,y:40};
   if(e.s==='eclair'||e.s==='chaine'){await eclair({x:pc.x+(Math.random()-.5)*40,y:-10},{x:pc.x,y:pc.y-CB.geo.h*.4});CB.dernierImpact=pc;}
   else if(e.s==='fleche'){await projectile(dep,pc,'#c07aff');}
   else if(e.s==='boulefeu'){await projectile(dep,pc,'#ff8a2a');await explosion(pc);}
   else await etincelles(pc,S.type==='debuff'?'#b07aff':S.type==='soin'?'#9aff9a':'#9ae8ff',false);break;}
  case 'degatsSort':if(e.s==='chaine'&&CB.dernierImpact&&CB.dernierImpact!==centreHex(c.h)){const pc=centreHex(c.h);if(Math.hypot(pc.x-CB.dernierImpact.x,pc.y-CB.dernierImpact.y)>4){await eclair({x:CB.dernierImpact.x,y:CB.dernierImpact.y-CB.geo.h*.4},{x:pc.x,y:pc.y-CB.geo.h*.4});}CB.dernierImpact=pc;}flash(c);texte(centreHex(c.h),`−${e.d}${e.morts?` (${e.morts} †)`:''}`,'#ffb070');await pause(160);break;
  case 'effet':texte(centreHex(c.h),SORTS_EFFETS[e.e]||e.e,'#bfe8ff');await pause(200);break;
  case 'soin':texte(centreHex(c.h),'Soigné','#9f9');await pause(200);break;
  case 'resiste':texte(centreHex(c.h),'Résiste !','#fff');await pause(200);break;
  case 'moral':texte(centreHex(a.h),e.bon?'Moral élevé !':'Moral au plus bas…',e.bon?'#8f8':'#f88');logC(e.bon?`${nomP(a)} : un regain de courage, ils rejouent !`:`${nomP(a)} : paralysés par la peur.`);await pause(450);break;
  case 'chance':texte({x:centreHex(a.h).x,y:centreHex(a.h).y-30},'Chance !','#ffe060');break;
  case 'regen':texte(centreHex(a.h),'Régénération','#9f9');await pause(200);break;
  case 'drain':texte(centreHex(a.h),`+${e.n} ressuscités`,'#f9a');await pause(200);break;
  case 'poison':texte(centreHex(a.h),`Poison −${e.d}`,'#9f6');await pause(250);break;
  case 'defend':texte(centreHex(a.h),'En garde','#ddd');logC(`${nomP(a)} se mettent en garde.`);await pause(150);break;
  case 'tour':if(e.n){logC(`— Round ${e.n} —`);break;}if(c){const pc=centreHex(c.h);await projectile({x:CB.geo.W-20,y:CB.geo.oy-20},pc,'#ffe0a0');flash(c);texte(pc,`−${e.d}`,'#ffd0a0');logC(`La tour de garde frappe : ${e.d} dégâts.`);}break;
  }}
 majBarreCombat();}
var SORTS_EFFETS={beni:'Béni',maudit:'Maudit',hate:'Hâte',lent:'Ralenti',bouclier:'Bouclier',pierre:'Peau de pierre',fureur:'Fureur',priere:'Prière'};
function animer(ms,f){ms/=AC();return new Promise(r=>{const t0=performance.now();const st=()=>{const t=Math.min(1,(performance.now()-t0)/ms);f(t);if(t<1&&!CB.abandon)requestAnimationFrame(st);else r();};st();});}
function flash(p){CB.fx.push({t:'flash',id:p.id,t0:performance.now(),d:260});anim3(p,'hit',420);}
function anim3(p,a,d){(CB.anim3d=CB.anim3d||{})[p.id]={a,t0:performance.now(),d:d/AC()};}
function texte(pos,txt,coul){CB.fx.push({t:'txt',x:pos.x,y:pos.y-CB.geo.h*.9,txt,coul,t0:performance.now(),d:1100});}
async function projectile(a,b,orbe){const fx={t:'proj',x:a.x,y:a.y-CB.geo.h*.6,orbe,a:0};CB.fx.push(fx);const yb=b.y-CB.geo.h*.5;await animer(Math.min(420,180+Math.hypot(b.x-a.x,b.y-a.y)*.4),t=>{fx.x=a.x+(b.x-a.x)*t;fx.y=a.y-CB.geo.h*.6+(yb-(a.y-CB.geo.h*.6))*t-Math.sin(t*Math.PI)*CB.geo.h*.8;fx.a=Math.atan2(yb-a.y,b.x-a.x)+(t-.5)*-1.4*Math.sign(b.x-a.x||1);});CB.fx.splice(CB.fx.indexOf(fx),1);}
async function eclair(a,b){const pts=[];const n=9;for(let i=0;i<=n;i++){const t=i/n;pts.push({x:a.x+(b.x-a.x)*t+(i&&i<n?(Math.random()-.5)*30:0),y:a.y+(b.y-a.y)*t});}const fx={t:'eclair',pts,t0:performance.now(),d:380/AC()};CB.fx.push(fx);CB.flashEcran=performance.now();SON.coup();await pause(260);}
async function explosion(c){const fx={t:'explo',x:c.x,y:c.y-CB.geo.h*.3,t0:performance.now(),d:520/AC(),r:CB.geo.w*1.7};CB.fx.push(fx);SON.coup();await pause(380);}
async function etincelles(c,coul,zone){const fx={t:'spark',x:c.x,y:c.y-CB.geo.h*.4,coul,t0:performance.now(),d:600,r:zone?CB.geo.w*1.6:CB.geo.w*.7};CB.fx.push(fx);await pause(560);}

function dessinerCombat(){if(!CB)return;const C=CB.C;const cv=$('cvCombat');const g=cv.getContext('2d');const G2=CB.geo;g.setTransform(CB.dpr,0,0,CB.dpr,0,0);const now=performance.now();
 if(!CB.fond&&CB.c3&&R3.pret&&!R3.pret()){g.fillStyle='#1a1610';g.fillRect(0,0,G2.W,G2.H+60);return;}
 if(!CB.fond){let f3=null;if(CB.c3){try{f3=R3.fondCombat(C,G2,CB.c3.cam,G2.H+60,CB.dpr);}catch(e){console.error(e);}}if(f3){CB.fond=f3.fond;CB.obst3=f3.obst;}else{CB.fond=fondCombat(C.terrain,Math.round(G2.W),Math.round(G2.H+60),7,G2.port?.05:.24);CB.obst3=null;}}g.drawImage(CB.fond,0,0,G2.W,G2.H+60);
 if(C.ville&&!CB.obst3){const s=spriteVille(C.ville.fac);const w=G2.W*.32,h=w*s.height/s.width;g.globalAlpha=.9;g.drawImage(s,G2.W-w*.95,G2.oy-h*.92,w,h);g.globalAlpha=1;}
 // grille
 const p=C.actif;const monTour=p&&CB.humain[p.cote]&&!CB.auto&&CB.attente;const por=monTour&&!CB.mode?C.portee(p):null;
 g.lineWidth=1;for(let h=0;h<CW*CH;h++){const c=centreHex(h);cheminHex(g,c);if(por&&por.has(h)){g.fillStyle='rgba(255,255,230,.16)';g.fill();}g.strokeStyle='rgba(20,30,10,.28)';g.stroke();}
 if(monTour){if(CB.mode){for(const h of C.ciblesSort(p.cote,CB.mode)){cheminHex(g,centreHex(h));g.fillStyle='rgba(150,200,255,.22)';g.fill();}}
  if(CB.survol>=0){cheminHex(g,centreHex(CB.survol));g.strokeStyle='#ffe08a';g.lineWidth=2.5;g.stroke();g.lineWidth=1;}
  if(CB.depuis!=null){cheminHex(g,centreHex(CB.depuis));g.fillStyle='rgba(255,220,120,.35)';g.fill();}}
 if(p){cheminHex(g,CB.aff.get(p.id)||centreHex(p.h));g.strokeStyle=`rgba(255,215,90,${.6+.35*Math.sin(now/180)})`;g.lineWidth=3;g.stroke();g.lineWidth=1;}
 // obstacles + piles triés par profondeur
 const objets=[];for(const h of C.obst)objets.push({y:centreHex(h).y,f:()=>{const c=centreHex(h);const o3=CB.obst3&&CB.obst3.get(h);if(o3){g.drawImage(o3.c,o3.x,o3.y,o3.w,o3.h);return;}if(CB.obst3)return;const s=spriteObstacle(C.terrain==='herbe'&&h%2?OBS.VEG:OBS.ROC,C.terrain==='eau'?'herbe':C.terrain,h%9);const w=G2.w*1.25*(c.s||1),hh=w*s.height/s.width;g.drawImage(s,c.x-w/2,c.y-hh+G2.h*.3*SQ*(c.s||1),w,hh);}});
 for(const q of C.piles){const al=CB.alpha.has(q.id)?CB.alpha.get(q.id):1;const pos=CB.aff.get(q.id)||centreHex(q.h);objets.push({y:pos.y-(q.n<=0?1000:0),f:()=>dessinerPile(g,q,pos,al,now)});}
 // héros à cheval au bord du champ de bataille (comme dans Heroes), en paysage seulement
 if(!G2.port&&typeof spriteHeros3D==='function')for(let k=0;k<2;k++){const hs=C.cotes[k].heros;if(!hs)continue;const c=centreHex(k?CW-1:0);const S=Math.round(G2.w*1.9*(c.s||1));const sp=(typeof window.spriteHerosMonte==='function'&&typeof G!=='undefined'&&G&&G.joueurs&&G.joueurs[hs.j]&&window.spriteHerosMonte(hs,-1))||spriteHeros3D(hs,S,-1);if(!sp)continue;
  let x=c.x+(k?1:-1)*G2.w*.9;x=Math.max(S*.42,Math.min(G2.W-S*.42,x));const y=Math.max(S*.95,c.y-G2.h*.75);
  objets.push({y,f:()=>{g.save();if(k){g.translate(x,0);g.scale(-1,1);g.translate(-x,0);}{const SS=sp.width===192?S*1.45:S;g.drawImage(sp,x-SS*.52,y-SS*.9,SS,SS);}g.restore();}});}
 objets.sort((a,b)=>a.y-b.y);for(const o of objets)o.f();
 // compteurs après toutes les créatures : jamais cachés par la rangée de devant
 for(const q of C.piles){if(q.n<=0)continue;const al=CB.alpha.has(q.id)?CB.alpha.get(q.id):1;const pos=CB.aff.get(q.id)||centreHex(q.h);g.save();g.globalAlpha=al;badgePile(g,q,pos,G2);g.restore();}
 // effets
 for(let i=CB.fx.length-1;i>=0;i--){const f=CB.fx[i];const t=f.d?(now-f.t0)/f.d:0;if(f.d&&t>=1&&f.t!=='flash'){CB.fx.splice(i,1);continue;}
  if(f.t==='txt'){g.save();g.globalAlpha=Math.min(1,2-t*2);g.font=`bold ${Math.round(G2.w*.32)}px Palatino,Georgia,serif`;g.textAlign='center';g.lineWidth=4;g.strokeStyle='#1a0e04';const y=f.y-t*G2.h*.6;g.strokeText(f.txt,f.x,y);g.fillStyle=f.coul;g.fillText(f.txt,f.x,y);g.restore();}
  else if(f.t==='proj'){g.save();g.translate(f.x,f.y);if(f.orbe){g.shadowColor=f.orbe;g.shadowBlur=14;g.fillStyle=f.orbe;g.beginPath();g.arc(0,0,G2.w*.1,0,7);g.fill();}else{g.rotate(f.a);g.strokeStyle='#3a2a1a';g.lineWidth=2;g.beginPath();g.moveTo(-G2.w*.25,0);g.lineTo(G2.w*.2,0);g.stroke();g.fillStyle='#ddd';g.beginPath();g.moveTo(G2.w*.26,0);g.lineTo(G2.w*.16,-3);g.lineTo(G2.w*.16,3);g.fill();}g.restore();}
  else if(f.t==='eclair'){g.save();g.globalCompositeOperation='lighter';g.globalAlpha=1-t;for(const [lw,col] of [[9,'rgba(120,170,255,.35)'],[4,'#bfe0ff'],[1.6,'#ffffff']]){g.lineWidth=lw;g.strokeStyle=col;g.beginPath();f.pts.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.stroke();}g.restore();}
  else if(f.t==='explo'){g.save();g.globalCompositeOperation='lighter';const rr=f.r*(.3+t*.9);const gr=g.createRadialGradient(f.x,f.y,1,f.x,f.y,rr);gr.addColorStop(0,`rgba(255,240,180,${.9*(1-t)})`);gr.addColorStop(.4,`rgba(255,140,40,${.7*(1-t)})`);gr.addColorStop(1,'rgba(120,30,0,0)');g.fillStyle=gr;g.beginPath();g.ellipse(f.x,f.y,rr,rr*.6,0,0,7);g.fill();g.restore();}
  else if(f.t==='spark'){g.save();g.globalCompositeOperation='lighter';for(let k=0;k<18;k++){const a=k/18*Math.PI*2+t*3;const r=f.r*t*(.4+.6*((k*37)%10)/10);g.fillStyle=f.coul;g.globalAlpha=1-t;g.beginPath();g.arc(f.x+Math.cos(a)*r,f.y+Math.sin(a)*r*SQ,G2.w*.07*(1-t)+1,0,7);g.fill();}g.restore();}}
 if(CB.flashEcran&&now-CB.flashEcran<180/AC()){g.fillStyle=`rgba(220,235,255,${.35*(1-(now-CB.flashEcran)/(180/AC()))})`;g.fillRect(0,0,G2.W,G2.H+60);}
 // héros
 for(let k=0;k<2;k++){const s=C.cotes[k];if(!s.heros)continue;const x=k?G2.W-58:8,y=8;g.drawImage(portrait(s.heros,64),x,y,50,50);g.font='12px Palatino,Georgia,serif';g.textAlign=k?'right':'left';g.lineWidth=3;g.strokeStyle='#000';const tx=k?x-4:x+56;
  g.strokeText(s.heros.nom,tx,y+16);g.fillStyle='#f6d77a';g.fillText(s.heros.nom,tx,y+16);g.strokeText(`Mana ${C.mana[k]}${C.sort[k]?' (sort lancé)':''}`,tx,y+32);g.fillStyle='#9ad0ff';g.fillText(`Mana ${C.mana[k]}${C.sort[k]?' (sort lancé)':''}`,tx,y+32);}}
function etat3D(q,now){const e=CB.anim3d&&CB.anim3d[q.id];if(q.n<=0||(e&&e.a==='die')){const t=e?Math.min(1,(now-e.t0)/500):1;return['die',Math.min(2,Math.floor(t*3))];}
 if(e&&now-e.t0<e.d){const t=(now-e.t0)/e.d;return[e.a,Math.floor(t*(e.a==='hit'?2:4))];}return['idle',Math.floor((now/260+q.id*1.7))%4];}
// hauteur réellement peinte (fraction du cadre) : la taille affichée suit le niveau de la créature, quel que soit le modèle d'origine
const HAUT={};// 21/11 : correction de taille pour les créatures longues et basses, que la règle « hauteur selon le niveau » grossit trop
const ECH3D={licorne:.8};
function hauteurOpaque(cle,im,sx,sy,sw,sh){if(HAUT[cle]!=null)return HAUT[cle];if(!im||!im.width||!sh)return 1;
 try{const c=document.createElement('canvas');const k=Math.min(1,128/Math.max(sw,sh));c.width=Math.max(1,Math.round(sw*k));c.height=Math.max(1,Math.round(sh*k));const g=c.getContext('2d');g.drawImage(im,sx,sy,sw,sh,0,0,c.width,c.height);
  const d=g.getImageData(0,0,c.width,c.height).data;let y0=c.height,y1=-1;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>40){if(y<y0)y0=y;if(y>y1)y1=y;}
  if(y1<0)return HAUT[cle]=1;return HAUT[cle]=(y1-y0+1)/c.height;}catch(e){return HAUT[cle]=1;}}
// largeur réellement peinte (fraction du cadre), mesurée une fois par créature : une pile ne déborde pas de 1,6 hexagone
const LARG={};function largeurOpaque(cle,im,sx,sy,sw,sh){if(LARG[cle]!=null)return LARG[cle];if(!im||!im.width||!sw)return 1;
 try{const c=document.createElement('canvas');const k=Math.min(1,128/Math.max(sw,sh));c.width=Math.max(1,Math.round(sw*k));c.height=Math.max(1,Math.round(sh*k));const g=c.getContext('2d');g.drawImage(im,sx,sy,sw,sh,0,0,c.width,c.height);
  const d=g.getImageData(0,0,c.width,c.height).data;let x0=c.width,x1=-1;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>40){if(x<x0)x0=x;if(x>x1)x1=x;}
  if(x1<0)return 1;return LARG[cle]=(x1-x0+1)/c.width;}catch(e){return LARG[cle]=1;}}
// ombre de contact : halo large et doux + noyau serré sous les pieds
function ombreContact(g,x,y,hw,a){y+=hw*.06;ombreSol(g,x,y,hw*.62,hw*.2,.42*a);ombreSol(g,x,y,hw*.34,hw*.1,.55*a);}
function dessinerPile(g,q,pos,al,now){const G2=CB.geo;const ps=pos.s||centreHex(q.h).s||1;const hexL=(G2.port?G2.h:G2.w)*ps*2.1;let S=G2.w*(G2.W<700?2.75:2.2)*ps;
 if(a3d(q.c)){g.save();g.globalAlpha=Math.max(al,q.n<=0?0:al);const [an,k]=etat3D(q,now);let ppu=G2.w*(G2.W<700?1.25:1.45)*ps;const by=pos.y+G2.h*.22*(G2.port?SQP:SQ);
  {const D=SPR3D[q.c];const [im,sx,sy,sw,sh]=cadre3D(q.c,'idle',0);const niv=((typeof CRE!=='undefined'&&(CRE[q.c]||CRE[String(q.c).replace(/2$/,'')]))||{}).niv||3;const T=G2.w*ps*(G2.W<700?.9:1)*(1.4+.15*niv)*(ECH3D[String(q.c).replace(/2$/,'')]||1);const ho=hauteurOpaque('3'+q.c,im,sx,sy,sw,sh)*sh;if(ho>0)ppu=T*D.pxu/ho;const lim=hexL*(niv>=6?1.45:niv>=4?1.15:1);const l=largeurOpaque('3'+q.c,im,sx,sy,sw,sh)*sw*ppu/D.pxu;if(l>lim)ppu*=lim/l;}
  if(q.n>0&&!CB.sansOmbre)ombre3D(g,q.c,an,k,pos.x,by,ppu,q.cote===1,.4);ombreContact(g,pos.x,by,G2.w*ps,q.n>0?1:.5);const fl=CB.fx.find(f=>f.t==='flash'&&f.id===q.id&&now-f.t0<f.d);
  dessiner3D(g,q.c,an,k,pos.x,by,ppu,q.cote===1);if(fl){g.globalCompositeOperation='lighter';g.globalAlpha=.45*(1-(now-fl.t0)/fl.d);dessiner3D(g,q.c,an,k,pos.x,by,ppu,q.cote===1);g.globalCompositeOperation='source-over';}
  g.restore();return;}const spr=q.cote===0?spriteCreature(q.c,160):spriteMiroir(q.c,160);{const l=largeurOpaque('2'+q.c+q.cote,spr,0,0,spr.width,spr.height)*S;if(l>hexL)S*=hexL/l;}g.save();g.globalAlpha=al;
 if(q.n<=0){const r=CB.mortT&&CB.mortT[q.id]!=null?CB.mortT[q.id]:1;const fy=pos.y+G2.h*.28*SQ*ps;g.translate(pos.x,fy);g.rotate((q.cote===0?-1:1)*r*Math.PI/2*.92);g.globalAlpha=1-.4*r;
  g.filter=r>.5?'grayscale(.55) brightness(.75)':'none';g.drawImage(spr,-S/2,-S*.87+G2.h*.28*SQ*0,S,S);g.filter='none';g.restore();return;}
 const actif=CB.C.actif===q;const b=actif?Math.sin(now/160)*2:0;const resp=1+Math.sin(now/520+q.id*1.3)*.012;
 const fl=CB.fx.find(f=>f.t==='flash'&&f.id===q.id&&now-f.t0<f.d);
 ombreContact(g,pos.x,pos.y+G2.h*.22*(G2.port?SQP:SQ)*ps,G2.w*ps,1);
 g.drawImage(spr,pos.x-S/2,pos.y-S*.87*resp+G2.h*.28*SQ+b,S,S*resp);
 if(fl){g.globalCompositeOperation='lighter';g.globalAlpha=.5*(1-(now-fl.t0)/fl.d);g.drawImage(spr,pos.x-S/2,pos.y-S*.87+G2.h*.28*SQ,S,S);g.globalCompositeOperation='source-over';g.globalAlpha=al;}
 g.restore();}
// icônes d'état au trait (Lucide, ISC) à la place des emoji (19/11) : image SVG teintée, construite une fois par effet
const ICO_EFF={defend:['shield','#e8c86a'],beni:['sun','#f2d27a'],maudit:['skull','#c69aea'],hate:['fast-forward','#8ad8f0'],lent:['hourglass','#b8b0a0'],bouclier:['shield','#8ab8f0'],pierre:['mountain-snow','#c8c4bc'],fureur:['flame','#f08a4a'],priere:['church','#f2d27a'],poison:['skull','#8ae07a'],entrave:['pause','#a8d080']},ICO_IMG={};
function icoEffet(e){if(ICO_IMG[e])return ICO_IMG[e];const d=ICO_EFF[e];const sy=d&&document.getElementById('i-'+d[0]);if(!sy)return null;const im=new Image();im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="${d[1]}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${sy.innerHTML}</svg>`);ICO_IMG[e]=im;return im;}
function badgePile(g,q,pos,G2){
 if(q.n>0){const txt=String(q.n);g.font=`bold ${Math.max(10,Math.round(G2.w*.27))}px Palatino,Georgia,serif`;const tw=g.measureText(txt).width+8;const bx=q.cote===0?pos.x+G2.w*.12:pos.x-G2.w*.12-tw,by=pos.y+G2.h*.12*SQ;
  const bh=G2.w*.34,rr=Math.min(4,bh*.25);{const j=CB.C.cotes[q.cote].joueur;const f=j>=0?COULEURS[G.joueurs[j].coul].f:'#3a3044';const gd=g.createLinearGradient(0,by,0,by+bh);gd.addColorStop(0,f);gd.addColorStop(1,'rgba(14,9,6,.92)');g.fillStyle=gd;}g.strokeStyle='#c9a24a';g.lineWidth=1.2;g.beginPath();g.roundRect?g.roundRect(bx,by,tw,bh,rr):g.rect(bx,by,tw,bh);g.fill();g.stroke();g.fillStyle=couleurCote(q.cote);g.fillRect(bx+2,by+bh-3,tw-4,2);g.fillStyle='#f3e3b8';g.textAlign='left';g.fillText(txt,bx+4,by+G2.w*.27);
  const ef=Object.keys(q.eff);if(ef.length||q.defend){const L=(q.defend?['defend']:[]).concat(ef);const sz=Math.max(12,Math.round(G2.w*.26));let ix=bx;for(const e of L){const im=icoEffet(e);if(!im)continue;g.fillStyle='rgba(14,9,6,.78)';g.beginPath();g.arc(ix+sz/2,by-3-sz/2,sz*.62,0,7);g.fill();if(im.complete&&im.naturalWidth)g.drawImage(im,ix+sz*.12,by-3-sz*.88,sz*.76,sz*.76);ix+=sz*1.2;}}}}
function majBarreCombat(){if(!CB)return;const C=CB.C;const p=C.actif;const mon=p&&CB.humain[p.cote]&&!CB.auto;
 $('cbSort').disabled=!mon||!C.peutLancer(p.cote);$('cbAttendre').disabled=!mon||p.attend;$('cbDefendre').disabled=!mon;$('cbFuir').disabled=!mon||!C.cotes[p.cote].heros||!!C.ville&&p.cote===1;$('cbAuto').disabled=!p||!(CB.humain[0]||CB.humain[1]);
 $('cbVit').textContent='×'+VITESSE;$('cbAuto').style.background=CB.auto?'linear-gradient(180deg,#b88a2a,#6a4a12)':'';
 // file d'attente
 const l=[];if(p)l.push(p);const reste=C.vivants().filter(q=>q!==p&&!q.aJoue&&!q.attend).sort((a,b)=>C.vit(b)-C.vit(a));const att=C.vivants().filter(q=>q!==p&&!q.aJoue&&q.attend).sort((a,b)=>C.vit(a)-C.vit(b));
 const suiv=C.vivants().filter(q=>q!==p).sort((a,b)=>C.vit(b)-C.vit(a));const file=l.concat(reste,att,suiv).slice(0,12);
 $('cbFile').innerHTML=file.map((q,i)=>`<div class="f" style="border-color:${couleurCote(q.cote)};${i===0?'box-shadow:0 0 8px #ffd060':''};${i>=l.length+reste.length+att.length?'opacity:.55':''}"><canvas width="64" height="64" data-cre="${q.c}"></canvas><b>${q.n}</b></div>`).join('');
 for(const c of $('cbFile').querySelectorAll('canvas'))c.getContext('2d').drawImage(spriteCreature(c.dataset.cre,64),0,0);}
function infoPile(q){const C=CB.C;const c=CRE[q.c];const ef=Object.keys(q.eff).map(e=>SORTS_EFFETS[e]||(e==='poison'?'Empoisonné':e==='entrave'?'Entravé':e)).join(', ');
 return fenetre(`<h2>${q.n} ${nomP(q)}</h2><div class="fiche-cre"><canvas width="120" height="120" data-cre="${q.c}"></canvas><table class="stats"><tr><td>Attaque</td><td><b>${C.attaque(q)}</b> (${c.att})</td></tr><tr><td>Défense</td><td><b>${C.defense(q)}</b> (${c.def})</td></tr><tr><td>Dégâts</td><td>${c.dmin}–${c.dmax}</td></tr><tr><td>PV</td><td>${q.pvh}/${c.pv}</td></tr><tr><td>Vitesse</td><td>${C.vit(q)}</td></tr>${c.tirs?`<tr><td>Tirs</td><td>${q.tirs}</td></tr>`:''}<tr><td>Ripostes</td><td>${q.rip}</td></tr></table></div>${c.sp.length?'<p>'+c.sp.map(s=>'• '+CAP_NOM[s]).join('<br>')+'</p>':''}${ef?`<p>Effets : ${ef}</p>`:''}<p>Moral du camp : ${C.moralBonus[q.cote]>=0?'+':''}${C.moralBonus[q.cote]}</p>`,[{t:'Fermer',or:true}]);}
function estimation(a,c,opt){const C=CB.C;const A=CRE[a.c];const mi=C.degats(Object.assign({},a,{eff:Object.assign({},a.eff,{maudit:0,beni:0}),n:a.n}),c,Object.assign({moyenne:1},opt)).d;
 const f=(dm)=>{const x=Object.assign({},a,{eff:{}});return C.degats(x,c,Object.assign({moyenne:1},opt)).d*dm/((A.dmin+A.dmax)/2);};
 const lo=Math.round(f(a.eff.beni?A.dmax:a.eff.maudit?A.dmin*.8:A.dmin)),hi=Math.round(f(a.eff.beni?A.dmax:a.eff.maudit?A.dmin*.8:A.dmax));const tue=d=>Math.min(c.n,Math.floor((d-c.pvh+CRE[c.c].pv)/CRE[c.c].pv));
 return`${lo===hi?lo:lo+'–'+hi} dégâts, ${Math.max(0,tue(lo))}${tue(hi)!==tue(lo)?'–'+Math.max(0,tue(hi)):''} tués`;}
function actionSur(h,px,py){// action correspondant à un tapotement
 const C=CB.C,p=C.actif;if(!p)return null;
 if(CB.mode){if(C.ciblesSort(p.cote,CB.mode).includes(h))return{t:'sort',s:CB.mode,h};return null;}
 const q=C.surCase(h);
 if(q&&q.cote!==p.cote){if(C.peutTirer(p))return{t:'tirer',cible:q.id,info:'🏹 '+estimation(p,q,{tir:1,dist:hexDist(p.h,q.h)})};
  const por=C.portee(p);let best=null,bd=1e9;for(const n of hexVois(q.h)){if(n!==p.h&&!por.has(n))continue;const c=centreHex(n);const d=Math.hypot(c.x-px,c.y-py);if(d<bd){bd=d;best=n;}}
  if(best==null)return{t:'hors'};return{t:'attaquer',cible:q.id,depuis:best===p.h?null:best,info:'⚔ '+estimation(p,q,{charge:best===p.h?0:por.get(best).d})};}
 if(!q&&C.portee(p).has(h))return{t:'bouger',h};return null;}
function brancherCombat(){const cv=$('cvCombat');let appui=null,down=null;
 const pos=e=>{return{x:e.clientX,y:e.clientY};};
 cv.addEventListener('pointermove',e=>{if(!CB||!CB.attente)return;const {x,y}=pos(e);const h=hexSous(x,y);CB.survol=h;const a=h>=0?actionSur(h,x,y):null;CB.depuis=a&&a.t==='attaquer'?(a.depuis==null?CB.C.actif.h:a.depuis):null;
  if(e.pointerType==='mouse'){if(a&&a.info)bulleC(a.info,x,y);else if(h>=0&&CB.C.surCase(h))bulleC(`${CB.C.surCase(h).n} ${nomP(CB.C.surCase(h))}`,x,y);else bulleC(null);}});
 cv.addEventListener('pointerdown',e=>{down=pos(e);clearTimeout(appui);if(e.button===2||!CB)return;appui=setTimeout(()=>{appui=null;const h=hexSous(down.x,down.y);const q=h>=0&&CB.C.surCase(h);if(q){down=null;infoPile(q);}},500);});
 cv.addEventListener('pointerup',e=>{clearTimeout(appui);if(!CB||!down)return;const {x,y}=pos(e);down=null;const h=hexSous(x,y);if(h<0)return;
  if(e.button===2){const q=CB.C.surCase(h);if(q)infoPile(q);return;}
  if(!CB.attente){return;}const a=actionSur(h,x,y);
  if(!a){const q=CB.C.surCase(h);if(q&&q.cote===CB.C.actif.cote&&!CB.mode)infoPile(q);else if(CB.mode){CB.mode=null;toast('Sort annulé.');}return;}
  if(a.t==='hors'){toast('Cible hors de portée.');return;}
  if(e.pointerType!=='mouse'&&a.info&&CB.confirme!==h){CB.confirme=h;CB.survol=h;CB.depuis=a.t==='attaquer'?(a.depuis==null?CB.C.actif.h:a.depuis):null;bulleC(a.info+'<br><small>Touchez encore pour confirmer</small>',x,y,2500);return;}
  CB.confirme=null;bulleC(null);CB.mode=null;CB.depuis=null;SON.clic();CB.attente(a);});
 cv.addEventListener('contextmenu',e=>e.preventDefault());
 $('cbAttendre').onclick=()=>{if(CB&&CB.attente)CB.attente({t:'attendre'});};
 $('cbVit').onclick=()=>{const v=changerVitesse();toast('Vitesse des animations : '+NOMS_VIT[v]+' (×'+v+')',1400);};
 $('cbDefendre').onclick=()=>{if(CB&&CB.attente)CB.attente({t:'defendre'});};
 $('cbAuto').onclick=async()=>{if(!CB)return;const cb0=CB;if(CB.auto){CB.auto=false;majBarreCombat();toast('Vous reprenez le commandement.');return;}const k=await fenetre('<h2>Combat automatique</h2><p>Laisser vos capitaines mener la bataille jusqu’au bout ? (vous pourrez reprendre la main en touchant ⚙)</p>',[{t:'Oui',or:true},{t:'Non'}]);if(k===0&&CB&&CB===cb0){CB.auto=true;majBarreCombat();const p=CB.C.actif;if(CB.attente&&p)CB.attente(iaCombat(CB.C));}};
 $('cbFuir').onclick=async()=>{if(!CB||!CB.attente)return;const k=await fenetre('<h2>Fuir ?</h2><p>Votre héros abandonne son armée et s’enfuit. Il pourra être recruté de nouveau à la taverne… par n’importe qui.</p>',[{t:'Fuir',or:true},{t:'Rester'}]);if(k===0&&CB.attente)CB.attente({t:'fuir'});};
 $('cbSort').onclick=()=>livreSorts();}
function bulleC(html,x,y,ms){const b=$('cbInfo');if(!html){b.style.display='none';return;}b.innerHTML=html;b.style.display='block';const w=b.offsetWidth,h=b.offsetHeight;b.style.left=Math.max(4,Math.min(innerWidth-w-4,x-w/2))+'px';b.style.top=Math.max(4,y-h-24)+'px';clearTimeout(b._t);if(ms)b._t=setTimeout(()=>b.style.display='none',ms);}
async function livreSorts(){const C=CB.C,p=C.actif;if(!p||!CB.attente)return;SON.livre(1);const k=p.cote;const sorts=C.stats[k].sorts;
 const html=`<h2>Livre de sorts</h2><p style="text-align:center">Mana : <b>${C.mana[k]}</b> · Puissance ${C.stats[k].pou}</p><div class="grille">${sorts.map((s,i)=>{const S=SORTS[s];const ok=S.mana<=C.mana[k]&&!C.sort[k];return`<div class="carte-b ${ok?'ok':'non'}" data-s="${s}"><canvas class="sort-ico" width="80" height="80" data-sort="${s}"></canvas><b>${S.nom}</b><small>Cercle ${S.niv} · ${S.mana} mana</small><br>${S.desc}${S.type==='degats'||S.type==='chaine'?`<br><i>≈ ${C.puissanceSort(k,s)} dégâts</i>`:''}</div>`;}).join('')||'<p>Aucun sort connu. Construisez une guilde des mages !</p>'}</div>`;
 await fenetre(html,[{t:'Fermer'}],{init:(f,fermer)=>{f.querySelectorAll('canvas.sort-ico').forEach(cv=>{try{cv.getContext('2d').drawImage(iconeSort(cv.dataset.sort,80),0,0);}catch(e){}});f.querySelectorAll('.carte-b.ok').forEach(d=>d.onclick=()=>{CB.mode=d.dataset.s;fermer(0);toast(`${SORTS[d.dataset.s].nom} : touchez une cible.`);});}});}
async function resultatsCombat(C){const k=CB.humain[0]?0:1;const gagne=C.fin.gagnant===k;gagne?SON.fanfare():SON.defaite();
 const pertes=c=>{const l=C.pertes(c);return l.length?'<div style="display:flex;flex-wrap:wrap;gap:6px">'+l.map(x=>`<div style="text-align:center"><canvas width="56" height="56" data-cre="${x.c}"></canvas><br><b>${x.n}</b></div>`).join('')+'</div>':'<p>Aucune.</p>';};
 await fenetre(`<h2>${C.fin.fuite?(gagne?'L’ennemi a fui !':'Vous avez fui'):gagne?'Victoire !':'Défaite…'}</h2><p><b>Vos pertes :</b></p>${pertes(k)}<p><b>Pertes ennemies :</b></p>${pertes(1-k)}${gagne&&C.cotes[k].heros?`<p>Expérience gagnée : <b>${C.pvTues(1-k)}</b></p>`:''}`,[{t:'D’accord',or:true}]);}
