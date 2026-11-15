'use strict';
/* =========================================================
   BANNIÈRES & SORTILÈGES — écran de combat (grille hexagonale, animations, livre de sorts)
   ========================================================= */
var CB=null;
const SQ=.78; // aplatissement des hexagones (perspective)
const SQP=.86; // portrait : le champ de bataille est tourné (attaquants en bas, défenseurs en haut)
function redimCombat(){const cv=$('cvCombat');const d=Math.min(2,devicePixelRatio||1);cv.width=innerWidth*d;cv.height=innerHeight*d;CB.dpr=d;
 const bas=$('combat').querySelector('.barre-combat').offsetHeight||56;const W=innerWidth,H=innerHeight-bas;
 if(H>W*1.15){const top=Math.max(70,H*.09);let h=(W-12)/8.5;let w=h/1.1547;if(15.5*w*SQP>H-top-10){w=(H-top-10)/(15.5*SQP);h=w*1.1547;}
  CB.geo={w,h,ox:(W-8.5*h)/2,oy:top+Math.max(0,(H-top-15.5*w*SQP)/2),W,H,port:true};}
 else{const top=H*.25;const w=Math.min((W-16)/15.5,(H-top-8)/(8.5*1.1547*SQ));const h=w*1.1547;CB.geo={w,h,ox:(W-15.5*w)/2,oy:top+Math.max(0,(H-top-8.5*h*SQ)/2)-4,W,H,port:false};}
 CB.fond=null;for(const p of CB.C.piles)CB.aff.set(p.id,centreHex(p.h));}
function centreHex(hx){const g=CB.geo,q=hx%CW,r=(hx/CW)|0;if(g.port)return{x:g.ox+r*g.h*.75+g.h/2,y:g.oy+((CW-1-q)+.5-(r&1)*.5)*g.w*SQP+g.w*SQP*.5};return{x:g.ox+q*g.w+(r&1)*g.w/2+g.w/2,y:g.oy+r*g.h*.75*SQ+g.h*SQ/2};}
function hexSous(px,py){const P=CB.geo.port;let best=-1,bd=1e9;for(let h=0;h<CW*CH;h++){const c=centreHex(h);const d=Math.hypot((c.x-px),(c.y-py)/(P?SQP:SQ));if(d<bd){bd=d;best=h;}}return bd<CB.geo.w*.62?best:-1;}
function cheminHex(g,c){const G2=CB.geo;const P=G2.port;const rx=P?G2.h/2:G2.w/2,ry=P?G2.w/2*SQP*1.1547:G2.h/2*SQ;g.beginPath();for(let k=0;k<6;k++){const a=Math.PI/3*k+(P?0:Math.PI/6);const x=c.x+rx*Math.cos(a),y=c.y+ry*Math.sin(a);k?g.lineTo(x,y):g.moveTo(x,y);}g.closePath();}
function couleurCote(k){const j=CB.C.cotes[k].joueur;return j>=0?COULEURS[G.joueurs[j].coul].c:'#8a7a9a';}

async function combatInteractif(A,D,opts){const C=creerCombat(A,D,Object.assign({graine:R.i(1,1e9)},opts));
 CB={C,humain:[humain(A.joueur),humain(D.joueur)],auto:!!opts.banc,banc:!!opts.banc,aff:new Map(),fx:[],alpha:new Map(),mode:null,survol:-1,log:[],t0:performance.now(),attente:null,fini:false};
 ecran('combat');redimCombat();SON.musique('combat');majBarreCombat();
 logC(`Combat : ${C.stats[0].nom||'Créatures'} contre ${C.stats[1].nom||(D.monstre?qteTxt(D.monstre.n)+' '+CRE[D.monstre.cre].pl.toLowerCase():'la garnison')}.`);
 while(!C.fin&&!CB.abandon){const p=C.actif;if(!p)break;majBarreCombat();
  let a;if(CB.humain[p.cote]&&!CB.auto){a=await new Promise(r=>CB.attente=r);CB.attente=null;if(CB.abandon)break;}else{await pause(CB.banc?60:260);a=iaCombat(C);}
  if(!a)continue;const ok=C.agir(a);if(!ok){if(CB.humain[p.cote])toast('Action impossible.');continue;}
  await jouerEvts(C.evts.slice());}
 majBarreCombat();if(CB.banc){return C;}
 await pause(400);await resultatsCombat(C);ecran('aventure');SON.musique('carte');const c=C;CB=null;return c;}
var ACCEL=1; // accélération des animations (tests automatiques)
function pause(ms){return new Promise(r=>setTimeout(r,ms/ACCEL));}
function logC(t){CB.log.push(t);if(CB.log.length>3)CB.log.shift();$('cbLog').innerHTML=CB.log.map((l,i)=>`<div style="opacity:${.55+.45*(i===CB.log.length-1)}">${l}</div>`).join('');}
function nomP(p,n){return(n||p.n)>1?CRE[p.c].pl:CRE[p.c].nom;}
async function jouerEvts(ev){const C=CB.C;
 for(const e of ev){const a=e.a&&C.pile(e.a),c=e.c&&C.pile(e.c);
  switch(e.t){
  case 'bouge':{const pts=e.ch.map(centreHex);const dur=e.vol?Math.min(600,150+60*e.ch.length):110;
   if(e.vol){await animer(dur,t=>{CB.aff.set(a.id,{x:pts[0].x+(pts[1].x-pts[0].x)*t,y:pts[0].y+(pts[1].y-pts[0].y)*t-Math.sin(t*Math.PI)*CB.geo.h*.8});});}
   else for(let i=1;i<pts.length;i++){const p0=pts[i-1],p1=pts[i];if(i===1||i%2)SON.pas();await animer(dur,t=>CB.aff.set(a.id,{x:p0.x+(p1.x-p0.x)*t,y:p0.y+(p1.y-p0.y)*t-Math.abs(Math.sin(t*Math.PI))*3}));}
   CB.aff.set(a.id,centreHex(a.h));break;}
  case 'attaque':case 'riposte':{const pa=centreHex(a.h),pc=centreHex(c.h);await animer(140,t=>CB.aff.set(a.id,{x:pa.x+(pc.x-pa.x)*.35*Math.sin(t*Math.PI),y:pa.y+(pc.y-pa.y)*.35*Math.sin(t*Math.PI)}));SON.coup();
   flash(c);texte(pc,`−${e.d}${e.morts?` (${e.morts} †)`:''}`,'#ffd0a0');logC(`${e.t==='riposte'?'Riposte : ':''}${a.n||e.morts?nomP(a):''} inflige${a.n>1?'nt':''} ${e.d} dégâts${e.morts?`, ${e.morts} ${nomP(c,e.morts).toLowerCase()} périssent`:''}.${e.mal?' Maléfice !':''}`);CB.aff.set(a.id,pa);await pause(120);break;}
  case 'tir':{const pa=centreHex(a.h),pc=centreHex(c.h);SON.tir();await projectile(pa,pc,CRE[a.c].d.orbe||(CRE[a.c].d.arme==='baton'?'#ffe79a':null));flash(c);texte(pc,`−${e.d}${e.morts?` (${e.morts} †)`:''}`,'#ffd0a0');logC(`${nomP(a)} tire${a.n>1?'nt':''} : ${e.d} dégâts${e.morts?`, ${e.morts} ${nomP(c,e.morts).toLowerCase()} périssent`:''}.`);await pause(100);break;}
  case 'mort':{SON.mort();await animer(380,t=>CB.alpha.set(c.id,1-t));logC(`Les ${CRE[c.c].pl.toLowerCase()} sont anéantis.`);break;}
  case 'sort':{SON.sort();const S=SORTS[e.s];logC(`${C.stats[e.k].nom} lance ${S.nom}.`);await etincelles(centreHex(e.h),S.type==='degats'||S.type==='chaine'?'#ff9a3a':S.type==='debuff'?'#b07aff':'#9ae8ff',S.cible==='zone');break;}
  case 'degatsSort':flash(c);texte(centreHex(c.h),`−${e.d}${e.morts?` (${e.morts} †)`:''}`,'#ffb070');await pause(160);break;
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
function animer(ms,f){ms/=ACCEL;return new Promise(r=>{const t0=performance.now();const st=()=>{const t=Math.min(1,(performance.now()-t0)/ms);f(t);if(t<1&&!CB.abandon)requestAnimationFrame(st);else r();};st();});}
function flash(p){CB.fx.push({t:'flash',id:p.id,t0:performance.now(),d:260});}
function texte(pos,txt,coul){CB.fx.push({t:'txt',x:pos.x,y:pos.y-CB.geo.h*.9,txt,coul,t0:performance.now(),d:1100});}
async function projectile(a,b,orbe){const fx={t:'proj',x:a.x,y:a.y-CB.geo.h*.6,orbe,a:0};CB.fx.push(fx);const yb=b.y-CB.geo.h*.5;await animer(Math.min(420,180+Math.hypot(b.x-a.x,b.y-a.y)*.4),t=>{fx.x=a.x+(b.x-a.x)*t;fx.y=a.y-CB.geo.h*.6+(yb-(a.y-CB.geo.h*.6))*t-Math.sin(t*Math.PI)*CB.geo.h*.8;fx.a=Math.atan2(yb-a.y,b.x-a.x)+(t-.5)*-1.4*Math.sign(b.x-a.x||1);});CB.fx.splice(CB.fx.indexOf(fx),1);}
async function etincelles(c,coul,zone){const fx={t:'spark',x:c.x,y:c.y-CB.geo.h*.4,coul,t0:performance.now(),d:600,r:zone?CB.geo.w*1.6:CB.geo.w*.7};CB.fx.push(fx);await pause(560);}

function dessinerCombat(){if(!CB)return;const C=CB.C;const cv=$('cvCombat');const g=cv.getContext('2d');const G2=CB.geo;g.setTransform(CB.dpr,0,0,CB.dpr,0,0);const now=performance.now();
 if(!CB.fond)CB.fond=fondCombat(C.terrain,Math.round(G2.W),Math.round(G2.H+60),7,G2.port?.05:.24);g.drawImage(CB.fond,0,0,G2.W,G2.H+60);
 if(C.ville){const s=spriteVille(C.ville.fac);const w=G2.W*.32,h=w*s.height/s.width;g.globalAlpha=.9;g.drawImage(s,G2.W-w*.95,G2.oy-h*.92,w,h);g.globalAlpha=1;}
 // grille
 const p=C.actif;const monTour=p&&CB.humain[p.cote]&&!CB.auto&&CB.attente;const por=monTour&&!CB.mode?C.portee(p):null;
 g.lineWidth=1;for(let h=0;h<CW*CH;h++){const c=centreHex(h);cheminHex(g,c);if(por&&por.has(h)){g.fillStyle='rgba(255,255,230,.16)';g.fill();}g.strokeStyle='rgba(20,30,10,.28)';g.stroke();}
 if(monTour){if(CB.mode){for(const h of C.ciblesSort(p.cote,CB.mode)){cheminHex(g,centreHex(h));g.fillStyle='rgba(150,200,255,.22)';g.fill();}}
  if(CB.survol>=0){cheminHex(g,centreHex(CB.survol));g.strokeStyle='#ffe08a';g.lineWidth=2.5;g.stroke();g.lineWidth=1;}
  if(CB.depuis!=null){cheminHex(g,centreHex(CB.depuis));g.fillStyle='rgba(255,220,120,.35)';g.fill();}}
 if(p){cheminHex(g,CB.aff.get(p.id)||centreHex(p.h));g.strokeStyle=`rgba(255,215,90,${.6+.35*Math.sin(now/180)})`;g.lineWidth=3;g.stroke();g.lineWidth=1;}
 // obstacles + piles triés par profondeur
 const objets=[];for(const h of C.obst)objets.push({y:centreHex(h).y,f:()=>{const c=centreHex(h);const s=spriteObstacle(C.terrain==='herbe'&&h%2?OBS.VEG:OBS.ROC,C.terrain==='eau'?'herbe':C.terrain,h%9);const w=G2.w*1.25,hh=w*s.height/s.width;g.drawImage(s,c.x-w/2,c.y-hh+G2.h*.3*SQ,w,hh);}});
 for(const q of C.piles){const al=CB.alpha.has(q.id)?CB.alpha.get(q.id):1;if(q.n<=0&&al<=0)continue;const pos=CB.aff.get(q.id)||centreHex(q.h);objets.push({y:pos.y,f:()=>dessinerPile(g,q,pos,al,now)});}
 objets.sort((a,b)=>a.y-b.y);for(const o of objets)o.f();
 // effets
 for(let i=CB.fx.length-1;i>=0;i--){const f=CB.fx[i];const t=f.d?(now-f.t0)/f.d:0;if(f.d&&t>=1&&f.t!=='flash'){CB.fx.splice(i,1);continue;}
  if(f.t==='txt'){g.save();g.globalAlpha=Math.min(1,2-t*2);g.font=`bold ${Math.round(G2.w*.32)}px Palatino,Georgia,serif`;g.textAlign='center';g.lineWidth=4;g.strokeStyle='#1a0e04';const y=f.y-t*G2.h*.6;g.strokeText(f.txt,f.x,y);g.fillStyle=f.coul;g.fillText(f.txt,f.x,y);g.restore();}
  else if(f.t==='proj'){g.save();g.translate(f.x,f.y);if(f.orbe){g.shadowColor=f.orbe;g.shadowBlur=14;g.fillStyle=f.orbe;g.beginPath();g.arc(0,0,G2.w*.1,0,7);g.fill();}else{g.rotate(f.a);g.strokeStyle='#3a2a1a';g.lineWidth=2;g.beginPath();g.moveTo(-G2.w*.25,0);g.lineTo(G2.w*.2,0);g.stroke();g.fillStyle='#ddd';g.beginPath();g.moveTo(G2.w*.26,0);g.lineTo(G2.w*.16,-3);g.lineTo(G2.w*.16,3);g.fill();}g.restore();}
  else if(f.t==='spark'){g.save();g.globalCompositeOperation='lighter';for(let k=0;k<18;k++){const a=k/18*Math.PI*2+t*3;const r=f.r*t*(.4+.6*((k*37)%10)/10);g.fillStyle=f.coul;g.globalAlpha=1-t;g.beginPath();g.arc(f.x+Math.cos(a)*r,f.y+Math.sin(a)*r*SQ,G2.w*.07*(1-t)+1,0,7);g.fill();}g.restore();}}
 // héros
 for(let k=0;k<2;k++){const s=C.cotes[k];if(!s.heros)continue;const x=k?G2.W-58:8,y=8;g.drawImage(portrait(s.heros,64),x,y,50,50);g.font='12px Palatino,Georgia,serif';g.textAlign=k?'right':'left';g.lineWidth=3;g.strokeStyle='#000';const tx=k?x-4:x+56;
  g.strokeText(s.heros.nom,tx,y+16);g.fillStyle='#f6d77a';g.fillText(s.heros.nom,tx,y+16);g.strokeText(`✨ ${C.mana[k]}${C.sort[k]?' (sort lancé)':''}`,tx,y+32);g.fillStyle='#9ad0ff';g.fillText(`✨ ${C.mana[k]}${C.sort[k]?' (sort lancé)':''}`,tx,y+32);}}
function dessinerPile(g,q,pos,al,now){const G2=CB.geo;const S=G2.w*(G2.W<700?2.75:2.2);const spr=q.cote===0?spriteCreature(q.c,160):spriteMiroir(q.c,160);g.save();g.globalAlpha=al;
 const actif=CB.C.actif===q;const b=actif?Math.sin(now/160)*2:0;
 const fl=CB.fx.find(f=>f.t==='flash'&&f.id===q.id&&now-f.t0<f.d);
 g.drawImage(spr,pos.x-S/2,pos.y-S*.87+G2.h*.28*SQ+b,S,S);
 if(fl){g.globalCompositeOperation='lighter';g.globalAlpha=.5*(1-(now-fl.t0)/fl.d);g.drawImage(spr,pos.x-S/2,pos.y-S*.87+G2.h*.28*SQ,S,S);g.globalCompositeOperation='source-over';g.globalAlpha=al;}
 if(q.n>0){const txt=String(q.n);g.font=`bold ${Math.max(10,Math.round(G2.w*.27))}px Palatino,Georgia,serif`;const tw=g.measureText(txt).width+8;const bx=q.cote===0?pos.x+G2.w*.12:pos.x-G2.w*.12-tw,by=pos.y+G2.h*.12*SQ;
  g.fillStyle=couleurCote(q.cote);g.strokeStyle='#1a0e04';g.lineWidth=1.5;g.beginPath();g.rect(bx,by,tw,G2.w*.34);g.fill();g.stroke();g.fillStyle='#fff';g.textAlign='left';g.fillText(txt,bx+4,by+G2.w*.27);
  const ef=Object.keys(q.eff);if(ef.length||q.defend){g.font=`${Math.round(G2.w*.22)}px sans-serif`;g.fillText((q.defend?'🛡':'')+ef.map(e=>({beni:'✨',maudit:'💀',hate:'💨',lent:'🐌',bouclier:'🔰',pierre:'🪨',fureur:'🔥',priere:'🙏',poison:'☠',entrave:'🌿'})[e]||'').join(''),bx,by-3);}}
 g.restore();}
function majBarreCombat(){if(!CB)return;const C=CB.C;const p=C.actif;const mon=p&&CB.humain[p.cote]&&!CB.auto;
 $('cbSort').disabled=!mon||!C.peutLancer(p.cote);$('cbAttendre').disabled=!mon||p.attend;$('cbDefendre').disabled=!mon;$('cbFuir').disabled=!mon||!C.cotes[p.cote].heros||!!C.ville&&p.cote===1;$('cbAuto').disabled=!p||!(CB.humain[0]||CB.humain[1]);
 $('cbAuto').style.background=CB.auto?'linear-gradient(180deg,#b88a2a,#6a4a12)':'';
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
 $('cbDefendre').onclick=()=>{if(CB&&CB.attente)CB.attente({t:'defendre'});};
 $('cbAuto').onclick=async()=>{if(!CB)return;if(CB.auto){CB.auto=false;majBarreCombat();toast('Vous reprenez le commandement.');return;}const k=await fenetre('<h2>Combat automatique</h2><p>Laisser vos capitaines mener la bataille jusqu’au bout ? (vous pourrez reprendre la main en touchant ⚙)</p>',[{t:'Oui',or:true},{t:'Non'}]);if(k===0){CB.auto=true;majBarreCombat();const p=CB.C.actif;if(CB.attente&&p)CB.attente(iaCombat(CB.C));}};
 $('cbFuir').onclick=async()=>{if(!CB||!CB.attente)return;const k=await fenetre('<h2>Fuir ?</h2><p>Votre héros abandonne son armée et s’enfuit. Il pourra être recruté de nouveau à la taverne… par n’importe qui.</p>',[{t:'Fuir',or:true},{t:'Rester'}]);if(k===0&&CB.attente)CB.attente({t:'fuir'});};
 $('cbSort').onclick=()=>livreSorts();}
function bulleC(html,x,y,ms){const b=$('cbInfo');if(!html){b.style.display='none';return;}b.innerHTML=html;b.style.display='block';const w=b.offsetWidth,h=b.offsetHeight;b.style.left=Math.max(4,Math.min(innerWidth-w-4,x-w/2))+'px';b.style.top=Math.max(4,y-h-24)+'px';clearTimeout(b._t);if(ms)b._t=setTimeout(()=>b.style.display='none',ms);}
async function livreSorts(){const C=CB.C,p=C.actif;if(!p||!CB.attente)return;const k=p.cote;const sorts=C.stats[k].sorts;
 const html=`<h2>Livre de sorts</h2><p style="text-align:center">Mana : <b>${C.mana[k]}</b> · Puissance ${C.stats[k].pou}</p><div class="grille">${sorts.map((s,i)=>{const S=SORTS[s];const ok=S.mana<=C.mana[k]&&!C.sort[k];return`<div class="carte-b ${ok?'ok':'non'}" data-s="${s}"><b>${S.nom}</b><small>Cercle ${S.niv} · ${S.mana} mana</small><br>${S.desc}${S.type==='degats'||S.type==='chaine'?`<br><i>≈ ${C.puissanceSort(k,s)} dégâts</i>`:''}</div>`;}).join('')||'<p>Aucun sort connu. Construisez une guilde des mages !</p>'}</div>`;
 await fenetre(html,[{t:'Fermer'}],{init:(f,fermer)=>{f.querySelectorAll('.carte-b.ok').forEach(d=>d.onclick=()=>{CB.mode=d.dataset.s;fermer(0);toast(`${SORTS[d.dataset.s].nom} : touchez une cible.`);});}});}
async function resultatsCombat(C){const k=CB.humain[0]?0:1;const gagne=C.fin.gagnant===k;gagne?SON.fanfare():SON.defaite();
 const pertes=c=>{const l=C.pertes(c);return l.length?'<div style="display:flex;flex-wrap:wrap;gap:6px">'+l.map(x=>`<div style="text-align:center"><canvas width="56" height="56" data-cre="${x.c}"></canvas><br><b>${x.n}</b></div>`).join('')+'</div>':'<p>Aucune.</p>';};
 await fenetre(`<h2>${C.fin.fuite?(gagne?'L’ennemi a fui !':'Vous avez fui'):gagne?'Victoire !':'Défaite…'}</h2><p><b>Vos pertes :</b></p>${pertes(k)}<p><b>Pertes ennemies :</b></p>${pertes(1-k)}${gagne&&C.cotes[k].heros?`<p>Expérience gagnée : <b>${C.pvTues(1-k)}</b></p>`:''}`,[{t:'D’accord',or:true}]);}
