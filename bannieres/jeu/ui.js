'use strict';
/* =========================================================
   BANNIÈRES & SORTILÈGES — interface : écrans, fenêtres, tours de jeu, sauvegarde, mode test
   ========================================================= */
var CLE_SAUVE='bannieres-v1',TEST=false,ECRAN='accueil',TK=null;
const $=id=>document.getElementById(id);
function ecran(n){for(const e of document.querySelectorAll('.ecran'))e.classList.toggle('on',e.id===n);ECRAN=n;}
function toast(t,ms=2200){const e=$('toast');e.innerHTML=t;e.style.display='block';clearTimeout(e._t);e._t=setTimeout(()=>e.style.display='none',ms);}
function bandeau(t,ms){const e=$('bandeau');if(!t){e.style.display='none';return;}e.innerHTML=t;e.style.display='block';clearTimeout(e._t);if(ms)e._t=setTimeout(()=>e.style.display='none',ms);}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function imgRes(r,s=18){const c=iconeRes(r,32);return`<canvas width="32" height="32" data-res="${r}" style="width:${s}px;height:${s}px"></canvas>`;}
function peindreCanvasRes(el){for(const c of el.querySelectorAll('canvas[data-res]'))c.getContext('2d').drawImage(iconeRes(c.dataset.res,32),0,0);for(const c of el.querySelectorAll('canvas[data-cre]')){const s=c.width;if(s<=72){c.getContext('2d').drawImage(vignetteCre(c.dataset.cre,s),0,0);}/* 24/11 : vignette recadrée */else c.getContext('2d').drawImage(spriteCreature(c.dataset.cre,s),0,0);}/* vignettes (19/11) : créature cadrée plus serré */for(const c of el.querySelectorAll('canvas[data-por]')){const h=heroPar(+c.dataset.por)||V.porTmp;if(h)c.getContext('2d').drawImage(portrait(h,64),0,0,c.width,c.height);}}
function txtCout(c,res){return'<div class="cout">'+Object.keys(c).filter(r=>c[r]).map(r=>`<span class="${res&&(res[r]||0)<c[r]?'manque':''}">${imgRes(r,16)}${c[r]}</span>`).join('')+'</div>';}

// ---------- fenêtres ----------
var FEN_N=0;
function fenetre(html,boutons,opt={}){return new Promise(res=>{const m=document.createElement('div');m.className='modal on';m.style.zIndex=50+(++FEN_N);const f=document.createElement('div');f.className='cadre fen';m.appendChild(f);document.body.appendChild(m);
 f.innerHTML=html+(boutons&&boutons.length?'<div class="btns">'+boutons.map((b,i)=>`<button class="btn ${b.or?'or':''} ${b.petit?'petit':''}" data-i="${i}" ${b.off?'disabled':''}>${b.t}</button>`).join('')+'</div>':'');
 peindreCanvasRes(f);
 const fermer=v=>{m.remove();FEN_N--;res(v);};m._fermer=fermer;
 f.querySelectorAll(':scope > .btns button').forEach(b=>b.onclick=()=>{SON.clic();const bt=boutons[+b.dataset.i];if(bt.f){const r=bt.f();if(r===false)return;}fermer(bt.v!=null?bt.v:+b.dataset.i);});
 if(opt.init)opt.init(f,fermer);});}
function fenHaut(){const l=document.querySelectorAll('body > .modal.on');return l.length?l[l.length-1]:null;}
const alerte=(titre,txt,extra='')=>fenetre(`<h2>${titre}</h2>${extra}<p>${txt}</p>`,[{t:'D’accord',or:true}]);

// ---------- crochets du moteur ----------
function humain(j){return j>=0&&G.joueurs[j]&&G.joueurs[j].humain;}
function visible(i){return G.joueurs[vueJoueur()].vu[i];}
HOOK.choix=async(j,titre,texte,opts,ex)=>{if(!humain(j))return ex&&ex.ia?ex.ia():0;return fenetre(`<h2>${titre}</h2><p>${texte}</p>`,opts.map((t,i)=>({t,or:i===0})));};
function notifier(titre,texte,img,ms=4500){let z=$('notifs');if(!z){z=document.createElement('div');z.id='notifs';document.body.appendChild(z);}const p=$('panneau');if(p)z.style.setProperty('--panneau',(p.offsetWidth||0)+'px');
 const d=document.createElement('div');d.className='notif';d.innerHTML=(img||'')+`<div><b>${titre}</b>${texte}</div>`;const part=()=>{d.classList.add('part');setTimeout(()=>d.remove(),420);};d.onclick=part;setTimeout(part,ms);z.appendChild(d);peindreCanvasRes(d);while(z.children.length>4)z.firstChild.remove();}
HOOK.message=async(j,titre,texte,ex={})=>{if(!humain(j)||j!==G.courant)return;
 if(!ex.art&&!ex.bloquant&&!ex.ville){if(ex.res)SON.piece();notifier(titre,texte,ex.res?imgRes(ex.res,36):'');majUI();return;}/* 23/11 : simple information → carte non bloquante, le héros continue sa route */let img='';if(ex.res)img=`<div style="text-align:center">${imgRes(ex.res,48)}</div>`;if(ex.art){img=`<div style="text-align:center"><canvas width="64" height="64" id="cvArt"></canvas></div>`;SON.objet();}if(ex.res)SON.piece();
 await fenetre(`<h2>${titre}</h2>${img}<p>${texte}</p>`,[{t:'D’accord',or:true}],{init:f=>{const c=f.querySelector('#cvArt');if(c)c.getContext('2d').drawImage(spriteArtefact(ex.art),0,0);}});majUI();};
HOOK.niveau=async(h,offres,stat)=>{if(!humain(h.j)){const C=CLASSES[h.classe];let b=0;offres.forEach((o,i)=>{if((C.ch[o]||0)>(C.ch[offres[b]]||0))b=i;});return b;}
 SON.fanfare();V.porTmp=h;const html=`<h2>${esc(h.nom)} passe au niveau ${h.niv} !</h2><div style="display:flex;gap:12px;align-items:center"><canvas width="128" height="128" data-por="${h.id}" class="portrait-fiche" style="width:104px;height:104px;border:2px solid #b08a40;border-radius:4px;box-shadow:0 2px 6px rgba(0,0,0,.45)"></canvas><p>+1 en <b>${STAT_NOM[stat]}</b>.<br>Choisissez une compétence :</p></div>`;
 return fenetre(html,offres.map(o=>{const n=(h.comp[o]||0)+1;return{t:`${COMP[o].nom} (${NIV_NOM[n]})<br><small>${COMP[o].desc[n-1]}</small>`};}));};
HOOK.echange=async(h,o)=>{if(!humain(h.j)){// l'IA regroupe les troupes sur le plus fort
  const [a,b]=forceArmee(h.armee,h)>=forceArmee(o.armee,o)?[h,o]:[o,h];for(let k=0;k<7;k++){const s=b.armee[k];if(s&&nbPiles(b.armee)>1&&ajouterTroupe(a.armee,s.c,s.n))b.armee[k]=null;}return;}
 await fenetreEchange(h,o);};
HOOK.ville=async(v,h)=>{if(!humain(v.prop)){iaVille(v);return;}if(G.courant!==v.prop)return;await ouvrirVille(v);};
HOOK.recruter=async(h,o,c,maxN)=>{if(!humain(h.j))return maxN;return choisirNombre(`Habitation : ${c.pl}`,`${o.dispo} disponibles. Coût unitaire :`+txtCout(c.cout),maxN,maxN,c.id);};
HOOK.journal=(j,t)=>{G.log.push({j:G.jour,t});if(G.log.length>200)G.log.shift();if(ECRAN==='aventure'&&(humain(j)||/éliminé|empare/.test(t)))toast(t);};
HOOK.maj=()=>{V.miniDirty=true;V.fogDirty=true;majUI();};
HOOK.anim=async(type,h,a,b)=>{if(type==='ramasse'){if(humain(h.j))SON.piece();return;}
 if(type==='pas'){const vis=visible(a)||visible(b);V.fogDirty=true;V.miniDirty=true;if(!vis||V.rapide)return;const [x0,y0]=xy(a),[x1,y1]=xy(b);const dur=(humain(h.j)?150:90)/AC();V.anim={h,x0,y0,x1,y1,t0:performance.now(),dur};if(humain(h.j))SON.pas();
  suivre(x1,y1);await new Promise(r=>setTimeout(r,dur));V.anim=null;}};
function suivre(x,y){if(en3D()){R3.suivre(x,y);return;}const T=tailleT(),z=zoneVue();const sx=(x+.5)*T-V.cam.x,sy=(y+.5)*T-V.cam.y;if(sx<z.w*.25||sx>z.w*.75||sy<z.y+z.h*.25||sy>z.y+z.h*.75){V.cam.x+=(sx-z.w/2)*.25;V.cam.y+=(sy-z.y-z.h/2)*.25;borner();}}
HOOK.combat=async(A,D,opts)=>{const ha=humain(A.joueur),hd=humain(D.joueur);if(!ha&&!hd)return combatAuto(A,D,opts);
 if(ha&&!hd&&D.monstre&&A.heros){const r=iaRisque(A.heros,D.armee);if(r<.1){let auto=false;try{auto=localStorage.getItem('bs-rapide')==='1';}catch(e){}
   const k=auto?0:await fenetre(`<h2>${qteTxt(D.monstre.n)} ${CRE[D.monstre.cre].pl.toLowerCase()}</h2><p>Une proie facile pour votre armée. Résoudre le combat automatiquement ?</p>`,[{t:'⚡ Combat rapide',or:true},{t:'⚔ Mener la bataille'},{t:'Toujours rapide pour les proies faciles',petit:1}]);
   if(k===2)try{localStorage.setItem('bs-rapide','1');}catch(e){}
   if(k!==1){const C=combatAuto(A,D,opts);const p=C.pertes(0);SON.coup();toast(C.fin.gagnant===0?`Victoire${p.length?' — pertes : '+p.map(x=>x.n+' '+(x.n>1?CRE[x.c].pl:CRE[x.c].nom).toLowerCase()).join(', '):' sans pertes'}.`:'Défaite !',3200);return C;}}}
 return combatInteractif(A,D,opts);};

// ---------- accueil ----------
function fondAccueil(){const c=$('fondAccueil');c.width=innerWidth*Math.min(2,devicePixelRatio||1);c.height=innerHeight*Math.min(2,devicePixelRatio||1);const g=c.getContext('2d');
 // fond en 3D : une ville du Bastion rendue une fois, avec un lent travelling
 if(V.m3&&R3.ok&&R3.pret&&R3.pret()&&V.acc3!==false){try{if(!V.acc3||V.acc3.W!==c.width){const bat={};for(const b of BAT_ORDRE)if(!BAT[b].unique)bat[b]=1;const W=Math.round(c.width*1.12),H=Math.round(c.height*1.12);
   V.acc3=R3.panoVille({id:11,fac:'bastion',nom:'',bat,prop:-1,sansCre:1},W,H);V.acc3.W=c.width;
   {/* 24/11 : fond légèrement flou et assourdi, comme un décor de théâtre : le titre ressort, la ville reste lisible */const b=document.createElement('canvas');b.width=V.acc3.c.width;b.height=V.acc3.c.height;const bg=b.getContext('2d');bg.filter='blur('+(1.4*b.width/1434).toFixed(2)+'px) saturate(.9) brightness(.94)';bg.drawImage(V.acc3.c,0,0);bg.filter='none';V.acc3.c=b;}}
  const t=performance.now()/1000;const im=V.acc3.c;const ox=-(Math.sin(t*.06)+1)*.5*(im.width-c.width),oy=-(Math.cos(t*.05)+1)*.5*(im.height-c.height);g.drawImage(im,ox,oy);
  const gr=g.createLinearGradient(0,0,0,c.height);gr.addColorStop(0,'rgba(0,0,0,.25)');gr.addColorStop(.5,'rgba(0,0,0,.05)');gr.addColorStop(1,'rgba(0,0,0,.45)');g.fillStyle=gr;g.fillRect(0,0,c.width,c.height);
  const vg=g.createRadialGradient(c.width/2,c.height*.45,Math.min(c.width,c.height)*.35,c.width/2,c.height*.45,Math.hypot(c.width,c.height)*.6);vg.addColorStop(0,'rgba(10,6,2,0)');vg.addColorStop(1,'rgba(10,6,2,.55)');g.fillStyle=vg;g.fillRect(0,0,c.width,c.height);return;}catch(e){console.error(e);V.acc3=false;}}
 if(!V.accueil){const gen=genererCarte({graine:31,taille:28,joueurs:[{fac:'bastion'},{fac:'necro'}],eau:2,monstres:1});V.accueil={sol:peindreSol(gen.carte),gen};}
 const {sol,gen}=V.accueil;const N=gen.carte.N;const k=Math.max(c.width,c.height)/(N*PX)*1.25;const t=performance.now()/1000;const ox=-((Math.sin(t*.05)+1)*.5)*(N*PX*k-c.width),oy=-((Math.cos(t*.04)+1)*.5)*(N*PX*k-c.height);
 g.drawImage(sol,ox,oy,N*PX*k,N*PX*k);const T=PX*k;
 for(let y=0;y<N;y++){for(let x=0;x<N;x++){const o=gen.carte.obs[y*N+x];if(o===OBS.VEG||o===OBS.ROC){const s=spriteObstacle(o,TER[gen.carte.ter[y*N+x]],(x*7+y*13)%9);const w=s.width*T/TS,h=s.height*T/TS;g.drawImage(s,ox+(x+.5)*T-w/2,oy+(y+1)*T-h+T*.1,w,h);}
   if(y>0&&gen.carte.obs[(y-1)*N+x]===OBS.MONT){const s=spriteObstacle(OBS.MONT,TER[gen.carte.ter[(y-1)*N+x]],(x*5+y*11)%7);const w=s.width*T/TS,h=s.height*T/TS;g.drawImage(s,ox+(x+1)*T-w/2,oy+(y+1)*T-h,w,h);}}
  for(const o of gen.objs)if(o.y===y){const cx=ox+(o.x+.5)*T,by=oy+(o.y+1)*T;if(o.t==='ville'){const s=spriteVille(o.fac);g.drawImage(s,cx-s.width*T/TS/2,by-s.height*T/TS,s.width*T/TS,s.height*T/TS);}else if(o.t==='monstre'){const s=spriteMiroir(o.cre,160);g.drawImage(s,cx-T*.81,by-T*1.5,T*1.62,T*1.62);}else if(o.t==='mine'){const s=spriteMine(o.res);g.drawImage(s,cx-s.width*T/TS/2,by-s.height*T/TS,s.width*T/TS,s.height*T/TS);}}}
 const v=g.createRadialGradient(c.width/2,c.height/2,c.height*.2,c.width/2,c.height/2,c.height*.9);v.addColorStop(0,'rgba(10,6,2,.15)');v.addColorStop(1,'rgba(10,6,2,.8)');g.fillStyle=v;g.fillRect(0,0,c.width,c.height);}
function majAccueil(){let s=null;try{s=localStorage.getItem(CLE_SAUVE);}catch(e){}$('bContinuer').style.display=s?'':'none';
 if(window.NUAGE)NUAGE.get().then(m=>{if(!m)return;let loc=0;try{loc=+localStorage.getItem(CLE_SAUVE+'-t')||0;}catch(e){}if(m.t>loc+5000){$('bContinuer').style.display='';$('nuageInfo').innerHTML=`☁ Une partie plus récente existe sur un autre appareil (${m.jour?'jour '+m.jour:''}).`;V.nuageMeta=m;}else $('nuageInfo').textContent='☁ Sauvegarde en ligne : active';}).catch(()=>{});}

// ---------- configuration ----------
var CFG={taille:54,eau:1,monstres:1,difficulte:1,victoire:0,joueurs:[{fac:'bastion',humain:true},{fac:'necro',humain:false}]};
function choixGroupe(id,cle){const el=$(id);el.querySelectorAll('button').forEach(b=>{b.classList.toggle('sel',+b.dataset.v===CFG[cle]);b.onclick=()=>{SON.clic();CFG[cle]=+b.dataset.v;el.querySelectorAll('button').forEach(x=>x.classList.toggle('sel',x===b));};});}
function majJoueursCfg(){const el=$('cJoueurs');el.innerHTML=CFG.joueurs.map((p,i)=>`<div class="joueur"><div class="pastille" style="background:${COULEURS[i].c}"></div>
 <select data-i="${i}" data-k="fac">${FACS.map(f=>`<option value="${f}" ${p.fac===f?'selected':''}>${FAC[f].nom}</option>`).join('')}<option value="hasard" ${p.fac==='hasard'?'selected':''}>Au hasard</option></select>
 <select data-i="${i}" data-k="humain"><option value="1" ${p.humain?'selected':''}>Joueur humain</option><option value="0" ${!p.humain?'selected':''}>Ordinateur</option></select>
 ${i>=2?`<button class="x" data-x="${i}">✕</button>`:'<span></span>'}</div>`).join('')+`<div style="font-size:13px;color:#c9b38a;text-align:center">${FAC[CFG.joueurs[0].fac]?FAC[CFG.joueurs[0].fac].desc:''}</div>`;
 el.querySelectorAll('select').forEach(s=>s.onchange=()=>{const p=CFG.joueurs[+s.dataset.i];if(s.dataset.k==='fac')p.fac=s.value;else p.humain=s.value==='1';majJoueursCfg();});
 el.querySelectorAll('[data-x]').forEach(b=>b.onclick=()=>{CFG.joueurs.splice(+b.dataset.x,1);majJoueursCfg();});$('cAjout').style.display=CFG.joueurs.length>=4?'none':'';}
function ouvrirConfig(){choixGroupe('cTaille','taille');choixGroupe('cEau','eau');choixGroupe('cMonstres','monstres');choixGroupe('cDif','difficulte');choixGroupe('cVict','victoire');majJoueursCfg();ecran('config');}

// ---------- démarrage ----------
function demarrer(opts){ecran('generation');$('genMsg').textContent='Le cartographe trace des terres inconnues…';
 setTimeout(()=>{try{const t0=performance.now();opts.joueurs=opts.joueurs.map(p=>Object.assign({},p,{fac:p.fac==='hasard'?FACS[Math.floor(Math.random()*FACS.length)]:p.fac}));
  nouvellePartie(opts);$('genMsg').textContent='Les peintres colorent le monde…';
  setTimeout(()=>{initRendu();entrerAventure();V.tGen=Math.round(performance.now()-t0);debutTour(true);},30);}catch(e){console.error(e);alerte('Erreur',String(e));ecran('accueil');}},60);}
function entrerAventure(){ecran('aventure');redim();majUI();SON.musique('carte');}
function continuer(){let s=null;try{s=localStorage.getItem(CLE_SAUVE);}catch(e){}
 const charger=txt=>{ecran('generation');$('genMsg').textContent='Retour sur vos terres…';setTimeout(()=>{try{deserialiser(txt);initRendu();entrerAventure();debutTour(false);}catch(e){console.error(e);alerte('Sauvegarde illisible',String(e));ecran('accueil');}},50);};
 if(V.nuageMeta){const m=V.nuageMeta;fenetre('<h2>Deux sauvegardes</h2><p>Une partie plus récente a été trouvée sur un autre appareil. Laquelle reprendre ?</p>',[{t:'☁ Celle de l’autre appareil',or:true},{t:'Celle de cet appareil',off:!s}]).then(async k=>{if(k===0){const txt=await NUAGE.full(m);if(txt)charger(txt);else alerte('Échec','Impossible de lire la sauvegarde en ligne.');}else charger(s);});return;}
 if(s)charger(s);}
function sauver(){if(TEST||!G||G.fini)return;try{const s=serialiser();localStorage.setItem(CLE_SAUVE,s);localStorage.setItem(CLE_SAUVE+'-t',String(Date.now()));if(window.NUAGE)NUAGE.push();}catch(e){console.warn('sauvegarde',e);}}

// ---------- tours ----------
async function debutTour(premier){const p=G.joueurs[G.courant];V.chemin=null;bandeau(null);
 if(G.fini)return finPartie();
 if(p.humain){V.occupe=false;V.rapide=false;
  const humains=G.joueurs.filter(q=>q.humain&&!q.elim).length;V.fogDirty=true;V.miniDirty=true;
  if(humains>1){$('carte').style.visibility='hidden';await fenetre(`<h2>Au tour de ${p.nom}</h2><p>Passez l’appareil au joueur ${p.nom}.</p>`,[{t:'Je suis prêt',or:true}]);$('carte').style.visibility='';}
  const hs=herosDe(p.id);if(hs.length){V.sel={t:'heros',id:hs[0].id};centrer(hs[0].x,hs[0].y);}else{const v=villesDe(p.id)[0];if(v){V.sel={t:'ville',id:v.id};centrer(v.x,v.y);}}
  majUI();if(!premier||G.jour>1)sauver();
  if(premier&&!TEST){let vu=false;try{vu=localStorage.getItem('bs-tuto')==='1';}catch(e){}if(!vu){try{localStorage.setItem('bs-tuto','1');}catch(e){}
   setTimeout(()=>fenetre(`<h2>Premiers pas</h2><p>🐎 <b>Déplacer le héros :</b> touchez une case pour tracer le chemin (flèches vertes : aujourd’hui), touchez-la encore pour partir.</p><p>🏰 <b>Votre ville :</b> touchez-la (ou 🏰) pour construire un bâtiment par jour et recruter des créatures.</p><p>💰 <b>Ressources :</b> ramassez les tas, capturez les mines (drapeau) ; méfiez-vous des créatures qui gardent trésors et passages (appui long pour juger de leur force).</p><p>⌛ <b>Fin du tour</b> quand vos héros ont fini de bouger. Chaque lundi, les créatures se multiplient.</p><p style="font-size:13px">Aide complète : menu ☰ → 📖.</p>`,[{t:'C’est parti !',or:true}]),600);}}
  if((G.jour-1)%7===0&&G.jour>1&&G.courant===G.joueurs.findIndex(q=>q.humain&&!q.elim)){SON.jour();const sm=G.semaine?CRE[G.semaine.cre]:null;annonceSemaine(Math.floor((G.jour-1)/7)+1,sm,G.semaine);}
  else bandeau(dateTxt(),1800);
  majAlerte();approches(p);
  return;}
 // ordinateur
 V.occupe=true;bandeau(`Tour de <span style="color:${COULEURS[p.coul].c}">${p.nom}</span>…`);majUI();
 await new Promise(r=>setTimeout(r,30));
 try{await tourIA(G.courant);}catch(e){console.error(e);TK&&TK.erreurs.push('IA: '+e);}
 if(G.fini)return finPartie();finTour();}
// ---------- le royaume prévient (alerte persistante + héros ennemis qui approchent) ----------
function majAlerte(){const e=$('alerte');if(!e)return;const av=$('aventure');const cache=()=>{e.style.display='none';e.innerHTML='';av&&av.classList.remove('avec-alerte');};
 if(!G||G.fini||ECRAN!=='aventure')return cache();const p=G.joueurs[vueJoueur()];if(!p||!p.humain||p.elim)return cache();
 const vs=villesDe(p.id);let txt='',act=null;
 if(!vs.length){const n=Math.max(1,7-(p.sansVille||0));txt=`⚠ Plus aucune ville : <b>${n} jour${n>1?'s':''} avant la chute</b>. Reprenez une ville !`;}
 else if(!herosDe(p.id).length){const v=vs.find(v=>v.bat.taverne);const n=(p.taverne||[]).filter(Boolean).length;
  if(v&&n){txt=`⚠ Aucun héros : la taverne de ${esc(v.nom)} en propose ${n} (2 500 or${p.res.or<2500?' — il vous en manque '+(2500-p.res.or).toLocaleString('fr-FR'):''})`;act=v;}
  else if(v)txt=`⚠ Aucun héros : la taverne de ${esc(v.nom)} n’en propose plus avant lundi`;
  else txt='⚠ Aucun héros : construisez une taverne pour en engager';}
 if(!txt)return cache();
 const cle=p.id+':'+txt+(act?act.id:'');if(e._cle!==cle||e.style.display==='none'){e._cle=cle;e.innerHTML=`<span>${txt}</span>`+(act?'<button class="btn petit or" id="alerteGo">🍺 Taverne</button>':'');
  if(act)$('alerteGo').onclick=()=>{if(V.occupe||G.courant!==p.id)return;ouvrirVille(act);fenTaverne();};}
 e.style.display='flex';av&&av.classList.add('avec-alerte');av&&av.style.setProperty('--hAlerte',e.offsetHeight+'px');}
function approches(p){const vs=villesDe(p.id);if(!vs.length)return;const sem=Math.floor((G.jour-1)/7);V.approche=V.approche||{};const msgs=[];
 for(const h of G.heros){if(h.j===p.id||h.j<0||!G.joueurs[h.j]||G.joueurs[h.j].elim)continue;if(!p.vu||!p.vu[idx(h.x,h.y)])continue;
  let v=null,dm=99;for(const w of vs){const d=Math.max(Math.abs(w.x-h.x),Math.abs(w.y-h.y));if(d<dm){dm=d;v=w;}}if(!v||dm>8)continue;
  const k=G.graine+':'+p.id+':'+h.id+':'+sem;if(V.approche[k])continue;V.approche[k]=1;const q=G.joueurs[h.j];
  msgs.push(`⚔ Un héros <span style="color:${COULEURS[q.coul].c}">${FAC[q.fac].adj}</span> approche de ${esc(v.nom)} !`);}
 if(msgs.length){V.approcheMsg=msgs;setTimeout(()=>{SON.clic&&SON.clic();toast(msgs.slice(0,2).join('<br>')+(msgs.length>2?`<br>et ${msgs.length-2} autre(s)…`:''),5000);},1900);}}
function finTour(){if(V.occupe&&G.joueurs[G.courant].humain)return;V.chemin=null;const avant=G.jour;finTourJoueur();if(G.jour!==avant)V.nouveauJour=true;V.fogDirty=true;V.miniDirty=true;setTimeout(()=>debutTour(false),20);}
async function finPartie(){V.occupe=true;bandeau(null);const g=G.fini;const p=G.joueurs[g.gagnant];const gagne=p&&p.humain&&!g.defaite;try{localStorage.removeItem(CLE_SAUVE);}catch(e){}
 gagne?SON.fanfare():SON.defaite();
 await fenetre(`<h2>${gagne?'Victoire !':'Défaite…'}</h2><p>${gagne?(g.graal?`La merveille du Graal s’élève dans votre royaume : ${p.nom} entre dans la légende (${dateTxt().toLowerCase()}).`:`Toutes les bannières rivales sont tombées. ${p.nom} règne sur ces terres depuis ${dateTxt().toLowerCase()}.`):(g.graal?`${p.nom} a bâti la merveille du Graal avant vous.`:`${p?p.nom:'Un rival'} l’emporte. Vos héros ne sont plus que des légendes.`)}</p><p style="font-size:13px">Combats livrés : ${G.stats.combats} · Graine de la carte : ${G.graine}</p>`,[{t:'Retour à l’accueil',or:true}]);
 G=null;ecran('accueil');majAccueil();}

// ---------- panneau d'aventure ----------
function majUI(){if(!G||ECRAN!=='aventure')return;const j=vueJoueur();const p=G.joueurs[j];
 $('barreRes').innerHTML=RES.map(r=>`<span class="r" title="${RES_NOM[r]}">${imgRes(r,20)}${p.res[r]}</span>`).join('')+`<span class="date">${dateTxt()}</span>`;peindreCanvasRes($('barreRes'));
 const hs=herosDe(j),vs=villesDe(j);
 $('listeHeros').innerHTML=hs.map(h=>`<div class="it ${V.sel&&V.sel.t==='heros'&&V.sel.id===h.id?'sel':''}" data-h="${h.id}"><canvas width="64" height="64" data-por="${h.id}"></canvas><div class="mp"><i style="height:${Math.min(100,h.mp/mvtMax(h)*100)}%"></i></div><div class="mana"><i style="height:${Math.min(100,h.mana/Math.max(1,manaMax(h))*100)}%"></i></div></div>`).join('')+'<div class="it vide"></div>'.repeat(Math.max(0,5-hs.length));
 $('listeVilles').innerHTML=vs.map(v=>`<div class="it ${V.sel&&V.sel.t==='ville'&&V.sel.id===v.id?'sel':''}" data-v="${v.id}"><canvas width="96" height="64" data-vil="${v.fac}"></canvas><div class="nom">${esc(v.nom)}${v.construit?'':'<svg class="ico pi"><use href="#i-hammer"/></svg>'}</div></div>`).join('')+'<div class="it vide"></div>'.repeat(Math.max(0,5-vs.length));
 peindreCanvasRes($('listeHeros'));for(const c of $('listeVilles').querySelectorAll('canvas[data-vil]')){const s=spriteVille(c.dataset.vil);c.getContext('2d').drawImage(s,0,s.height*.1,s.width,s.height*.75,0,0,96,64);}
 $('listeHeros').querySelectorAll('[data-h]').forEach(e=>e.onclick=()=>{const h=heroPar(+e.dataset.h);if(V.sel&&V.sel.t==='heros'&&V.sel.id===h.id)ouvrirFiche(h);else{V.sel={t:'heros',id:h.id};V.chemin=null;centrer(h.x,h.y);majUI();}});
 $('listeVilles').querySelectorAll('[data-v]').forEach(e=>e.onclick=()=>{const v=G.oi[+e.dataset.v];if(V.sel&&V.sel.t==='ville'&&V.sel.id===v.id&&!V.occupe)ouvrirVille(v);else{V.sel={t:'ville',id:v.id};centrer(v.x,v.y);majUI();}});
 // fiche sélection
 const f=$('ficheSel');const h=V.sel&&V.sel.t==='heros'?heroPar(V.sel.id):null;const v=V.sel&&V.sel.t==='ville'?G.oi[V.sel.id]:null;
 if(h&&h.j===j){f.innerHTML=`<div class="ligne"><b>${esc(h.nom)}</b><span>niv. ${h.niv}</span></div><div class="ligne"><span title="Mouvement"><svg class="ico pi" aria-label="Mouvement"><title>Mouvement</title><use href="#i-footprints"/></svg>${h.mp}/${mvtMax(h)}</span><span title="Mana"><svg class="ico pi" aria-label="Mana"><title>Mana</title><use href="#i-flame"/></svg>${h.mana}/${manaMax(h)}</span><span title="Attaque"><svg class="ico pi" aria-label="Attaque"><title>Attaque</title><use href="#i-sword"/></svg>${statH(h,'att')} <svg class="ico pi" aria-label="Défense"><title>Défense</title><use href="#i-shield"/></svg>${statH(h,'def')}</span></div>`+miniArmee(h.armee);}
 else if(v){f.innerHTML=`<div class="ligne"><b>${esc(v.nom)}</b><span>+${revenuVille(v)} or</span></div>`+miniArmee(v.garn);}
 else f.innerHTML=`<div style="opacity:.7">${p.nom} — ${FAC[p.fac].nom}</div>`;
 peindreCanvasRes(f);
 const mon=G.joueurs[G.courant].humain&&!V.occupe;for(const id of ['bHeroSuiv','bFiche','bVille','bBouger','bFinTour'])$(id).disabled=!mon;$('bBouger').disabled=!mon||!V.chemin;majAlerte();}
function miniArmee(a){return'<div class="mini-armee">'+a.map(s=>`<div class="s ${s?'':'vide'}">${s?`<canvas width="48" height="48" data-cre="${s.c}"></canvas><b>${s.n}</b>`:''}</div>`).join('')+'</div>';}

// ---------- tapotements sur la carte ----------
async function toucher(i){if(i<0||!G||V.occupe)return;const p=G.joueurs[G.courant];if(!p.humain)return;bulle(null);
 const [x,y]=xy(i);const hid=G.hpos[i];const o=G.occ[i]&&G.oi[G.occ[i]];const hs=V.sel&&V.sel.t==='heros'?heroPar(V.sel.id):null;
 // ville du joueur (n'importe quelle case de son emprise)
 let ville=null;for(const v of G.objs)if(v.t==='ville'&&Math.abs(v.x-x)<=1&&(y===v.y||y===v.y-1))ville=v;
 if(hid){const h=heroPar(hid);if(h.j===p.id&&(!hs||hs.id===h.id||!V.chemin||V.chemin.dest!==i)){if(hs&&hs.id===h.id){if(ville&&ville.prop===p.id)return ouvrirVille(ville);return ouvrirFiche(h);}V.sel={t:'heros',id:h.id};V.chemin=null;majUI();SON.clic();return;}}
 if(ville&&ville.prop===p.id&&(!hs||(hs.x===ville.x&&hs.y===ville.y)||(V.sel&&V.sel.t==='ville'))){if(V.sel&&V.sel.t==='ville'&&V.sel.id===ville.id||hs)return ouvrirVille(ville);V.sel={t:'ville',id:ville.id};V.chemin=null;majUI();SON.clic();return;}
 if(!hs){const d=descCase(i);const [ex,ey]=posEcran(x,y);bulle(d,ex,ey,2200);return;}
 const dest=ville&&!(x===ville.x&&y===ville.y)?idx(ville.x,ville.y):i;
 if(V.chemin&&V.chemin.dest===dest&&V.chemin.h===hs.id)return avancer();
 const ch=chemin(hs,dest);if(!ch){const [ex,ey]=posEcran(x,y);bulle(G.joueurs[p.id].vu[i]?'Inaccessible':'Terres inexplorées',ex,ey,1200);V.chemin=null;majUI();return;}
 V.chemin=Object.assign(ch,{h:hs.id,dest});SON.clic();majUI();
 if(o||hid){const [ex,ey]=posEcran(x,y);bulle(descCase(dest)+'<br><small>Touchez encore pour y aller</small>',ex,ey,2000);}}
async function avancer(){const c=V.chemin;if(!c||V.occupe)return;const h=heroPar(c.h);if(!h)return;if(h.mp<=0){toast('Ce héros n’a plus de mouvement aujourd’hui.');return;}
 V.occupe=true;majUI();bulle(null);try{await deplacer(h,c.ch);}catch(e){console.error(e);TK&&TK.erreurs.push(String(e));}
 V.occupe=false;const h2=heroPar(c.h);V.chemin=null;if(h2&&idx(h2.x,h2.y)!==c.dest){const ch=chemin(h2,c.dest);if(ch)V.chemin=Object.assign(ch,{h:h2.id,dest:c.dest});}
 if(!h2&&V.sel&&V.sel.id===c.h){const hs=herosDe(G.courant);V.sel=hs.length?{t:'heros',id:hs[0].id}:null;}
 V.fogDirty=true;V.miniDirty=true;majUI();if(G.fini)finPartie();}
function heroSuivant(){const hs=herosDe(G.courant);if(!hs.length)return;let k=hs.findIndex(h=>V.sel&&V.sel.t==='heros'&&h.id===V.sel.id);for(let t=1;t<=hs.length;t++){const h=hs[(k+t)%hs.length];if(h.mp>0||t===hs.length){V.sel={t:'heros',id:h.id};V.chemin=null;centrer(h.x,h.y);majUI();return;}}}

// ---------- fiche du héros ----------
function ouvrirFiche(h){V.porTmp=h;const st=['att','def','pou','con'];
 const html=`<h2>${esc(h.nom)}</h2><div style="display:flex;gap:12px;align-items:flex-start"><canvas width="128" height="128" data-por="${h.id}" class="portrait-fiche" style="width:104px;height:104px;border:2px solid #b08a40;border-radius:4px;box-shadow:0 2px 6px rgba(0,0,0,.45)"></canvas>
 <div style="flex:1"><b>${CLASSES[h.classe].nom}</b> ${FAC[h.fac].adj}, niveau ${h.niv}<br>Expérience : ${h.xp} / ${xpPourNiveau(h.niv+1)}<br>Mana : ${h.mana}/${manaMax(h)} · Mouvement : ${h.mp}/${mvtMax(h)}<br>Moral ${moralH(h)>=0?'+':''}${moralH(h)} · Chance ${chanceH(h)>=0?'+':''}${chanceH(h)}</div></div>
 <table class="stats" style="margin-top:8px"><tr>${st.map((k,i)=>`<td style="text-align:center"><svg class="ico" style="width:26px;height:26px;color:${['#8a2a1a','#2a4a8a','#a85a10','#2a6a3a'][i]}"><use href="#${['i-sword','i-shield','i-flame','i-book-open'][i]}"/></svg><br><small>${STAT_NOM[i]}</small><br><b style="font-size:18px">${statH(h,k)}</b>${bonusArts(h,k)?` <small>(+${bonusArts(h,k)})</small>`:''}</td>`).join('')}</tr></table>
 <p><b>Compétences :</b> ${Object.keys(h.comp).map(c=>`${COMP[c].nom} (${NIV_NOM[h.comp[c]]})`).join(', ')||'aucune'}</p>
 <p><b>Sorts :</b> ${h.sorts.map(s=>`<span class="sort-li"><img src="${typeof iconeSort==='function'?iconeSort(s,48).toDataURL():''}" alt="">${SORTS[s].nom}</span>`).join(' ')||'aucun'}</p>
 <p><b>Artefacts :</b> ${h.arts.map(a=>`${ARTS[a].nom} <small>(${txtBonus(ARTS[a].b)})</small>`).join(', ')||'aucun'}</p>
 <div id="edArm"></div>`;
 const sa=sortsAventure(h);const monTour=h.j===G.courant&&G.joueurs[h.j].humain&&!V.occupe;
 const btCreuser={t:'⛏ Creuser ici',petit:1,off:!monTour||h.mp<mvtMax(h)*.99,f:()=>{const r=creuser(h);toast(r.msg,3500);if(r.graal){SON.fanfare();}majUI();}};
 const bts=sa.map(s=>({t:`✨ ${SORTS[s].nom} (${SORTS[s].mana})`,petit:1,off:!monTour||h.mana<SORTS[s].mana,f:()=>{const r=lancerAventure(h,s);SON.sort();toast(r.msg,3000);if(r.ok){V.fogDirty=true;V.miniDirty=true;V.chemin=null;centrer(h.x,h.y);majUI();}}}));
 return fenetre(html,bts.concat([btCreuser,{t:'Fermer',or:true}]),{init:f=>{editeurArmees(f.querySelector('#edArm'),[{titre:'Armée',armee:h.armee,heros:h}]);}}).then(()=>majUI());}

// ---------- éditeur d'armées (fiches, échanges, villes) ----------
function blasonVille(g,v,S){const F=FAC[v.fac].coul;const gr=g.createLinearGradient(0,0,0,S);gr.addColorStop(0,'#3a2412');gr.addColorStop(1,'#1a0e06');g.fillStyle=gr;g.fillRect(0,0,S,S);
 g.save();g.translate(S/2,S*.52);g.beginPath();g.moveTo(-S*.32,-S*.36);g.lineTo(S*.32,-S*.36);g.lineTo(S*.32,0);g.quadraticCurveTo(S*.3,S*.3,0,S*.4);g.quadraticCurveTo(-S*.3,S*.3,-S*.32,0);g.closePath();
 const b=g.createLinearGradient(0,-S*.36,0,S*.4);b.addColorStop(0,F.drap);b.addColorStop(1,'#101010');g.fillStyle=b;g.fill();g.lineWidth=S*.04;g.strokeStyle='#d8b060';g.stroke();
 g.fillStyle='#f0d890';g.font=`bold ${S*.34}px Georgia,serif`;g.textAlign='center';g.textBaseline='middle';g.fillText(FAC[v.fac].nom[0],0,S*.02);g.restore();}
function editeurArmees(el,listes,onChange){let sel=null;
 const rendre=()=>{el.innerHTML=listes.map((l,li)=>`<div class="arm-ligne" style="margin:4px 0"><div class="arm-tit" style="color:#5a3a10">${esc(l.titre)}</div>${l.heros||l.ville?`<canvas class="arm-port" width="128" height="128" data-port="${li}"></canvas>`:''}<div class="slots">${l.armee.map((s,k)=>`<div class="slot ${sel&&sel.l===li&&sel.k===k?'sel':''} ${s?'':'vide'}" data-l="${li}" data-k="${k}">${s?`<canvas width="72" height="72" data-cre="${s.c}"></canvas><b>${s.n}</b>`:''}</div>`).join('')}</div></div>`).join('')
  +`<div class="btns" style="margin-top:4px"><button class="btn petit" id="edDiv" ${sel?'':'disabled'}>✂ Diviser</button><button class="btn petit" id="edInfo" ${sel?'':'disabled'}><svg class="ico pt"><use href="#i-info"/></svg>Détails</button><button class="btn petit" id="edRenv" ${sel?'':'disabled'}><svg class="ico pt"><use href="#i-x"/></svg>Renvoyer</button></div>`;
  peindreCanvasRes(el);
  el.querySelectorAll('canvas[data-port]').forEach(c=>{const l=listes[+c.dataset.port];const g=c.getContext('2d');try{if(l.heros)g.drawImage(portrait(l.heros,128),0,0,128,128);else if(l.ville)blasonVille(g,l.ville,128);}catch(e){}});/* 23/11 : portrait du héros et blason de la ville devant les rangées, comme dans Heroes */
  el.querySelectorAll('.slot').forEach(d=>d.onclick=()=>tap(+d.dataset.l,+d.dataset.k));
  const bd=el.querySelector('#edDiv'),bi=el.querySelector('#edInfo'),br=el.querySelector('#edRenv');
  if(bi)bi.onclick=()=>{if(sel){const s=listes[sel.l].armee[sel.k];if(s)ficheCreature(s.c,s.n);}};
  if(br)br.onclick=async()=>{if(!sel)return;const l=listes[sel.l];if(l.heros&&nbPiles(l.armee)<=1){toast('Un héros doit garder au moins une troupe.');return;}const s=l.armee[sel.k];const ok=await fenetre(`<h2>Renvoyer ?</h2><p>Renvoyer ${s.n} ${CRE[s.c].pl.toLowerCase()} ?</p>`,[{t:'Renvoyer',or:true},{t:'Annuler'}]);if(ok===0){l.armee[sel.k]=null;sel=null;rendre();onChange&&onChange();}};
  if(bd)bd.onclick=async()=>{if(!sel)return;const l=listes[sel.l];const s=l.armee[sel.k];if(!s||s.n<2)return;let cible=null;for(let li=0;li<listes.length&&!cible;li++){const k=listes[li].armee.findIndex(x=>!x);if(k>=0&&(li===sel.l||listes.length>1))cible={l:li,k};}
   if(!cible){toast('Aucun emplacement libre.');return;}const n=await choisirNombre('Diviser la troupe',`Combien de ${CRE[s.c].pl.toLowerCase()} déplacer${cible.l!==sel.l?' vers '+esc(listes[cible.l].titre):''} ?`,Math.floor(s.n/2),s.n-1,s.c);
   if(n>0&&n<s.n){s.n-=n;listes[cible.l].armee[cible.k]={c:s.c,n};}sel=null;rendre();onChange&&onChange();};};
 const tap=(li,k)=>{SON.clic();const A=listes[li].armee;if(!sel){if(A[k])sel={l:li,k};rendre();return;}
  if(sel.l===li&&sel.k===k){const s=A[k];sel=null;rendre();if(s)ficheCreature(s.c,s.n);return;}
  const S=listes[sel.l],src=S.armee[sel.k],dst=A[k];
  if(!dst){if(S.heros&&li!==sel.l&&nbPiles(S.armee)<=1){toast('Un héros doit garder au moins une troupe.');sel=null;rendre();return;}A[k]=src;S.armee[sel.k]=null;}
  else if(dst.c===src.c){if(S.heros&&li!==sel.l&&nbPiles(S.armee)<=1){toast('Un héros doit garder au moins une troupe.');sel=null;rendre();return;}dst.n+=src.n;S.armee[sel.k]=null;}
  else{A[k]=src;S.armee[sel.k]=dst;}
  sel=null;rendre();onChange&&onChange();};
 rendre();}
function ficheCreature(c,n){const C=CRE[c];return fenetre(`<h2>${n?n+' ':''}${n>1?C.pl:C.nom}</h2><div class="fiche-cre"><canvas width="120" height="120" data-cre="${c}"></canvas><table class="stats">
 <tr><td>Attaque</td><td><b>${C.att}</b></td></tr><tr><td>Défense</td><td><b>${C.def}</b></td></tr><tr><td>Dégâts</td><td><b>${C.dmin}${C.dmax!==C.dmin?'–'+C.dmax:''}</b></td></tr><tr><td>Points de vie</td><td><b>${C.pv}</b></td></tr>
 <tr><td>Vitesse</td><td><b>${C.vit}</b>${C.vol?' (vole)':''}</td></tr>${C.tirs?`<tr><td>Tirs</td><td><b>${C.tirs}</b></td></tr>`:''}<tr><td>Croissance</td><td>${C.cr}/semaine</td></tr><tr><td>Coût</td><td>${txtCout(C.cout)}</td></tr></table></div>
 ${C.sp.length?'<p>'+C.sp.map(s=>'• '+CAP_NOM[s]).join('<br>')+'</p>':''}<p style="font-size:12px">${C.fac==='neutre'?'Créature neutre':FAC[C.fac].nom}, niveau ${C.niv}</p>`,[{t:'Fermer',or:true}]);}
function choisirNombre(titre,txt,defaut,max,cre){return new Promise(res=>{let n=Math.min(defaut,max);
 fenetre(`<h2>${titre}</h2>${cre?`<div style="text-align:center"><canvas width="96" height="96" data-cre="${cre}"></canvas></div>`:''}<p>${txt}</p><input type="range" min="0" max="${max}" value="${n}" id="nbR"><p style="text-align:center;font-size:20px"><b id="nbV">${n}</b> / ${max}</p>`,
  [{t:'Max',petit:1,f:()=>{n=max;$('nbR').value=max;$('nbV').textContent=max;return false;}},{t:'Valider',or:true,f:()=>{res(n);}},{t:'Annuler',f:()=>{res(0);}}],{init:f=>{const r=f.querySelector('#nbR');r.oninput=()=>{n=+r.value;f.querySelector('#nbV').textContent=n;};}});});}
async function fenetreEchange(a,b){V.porTmp=a;await fenetre(`<h2>Rencontre : ${esc(a.nom)} et ${esc(b.nom)}</h2><p style="font-size:13px">Touchez une troupe puis un emplacement pour la déplacer, l’échanger ou la fusionner.</p><div id="edArm"></div>`,[{t:'Terminer',or:true}],{init:f=>editeurArmees(f.querySelector('#edArm'),[{titre:a.nom,armee:a.armee,heros:a},{titre:b.nom,armee:b.armee,heros:b}])});majUI();}

// ---------- menu ----------
async function menu(){if(!G)return;const e=SON.etat();const nb=window.NUAGE?(NUAGE.ok?'active':NUAGE.err?'refusée ('+esc(NUAGE.err)+')':'en attente'):'—';
 const it=[{id:'sauver',t:'💾 Sauvegarder'},{id:'son',t:e.actif?'🔊 Sons : oui':'🔇 Sons : non'},{id:'musique',t:e.musique?'🎵 Musique : oui':'🎵 Musique : non'},{id:'journal',t:'📜 Journal'},{id:'graal',t:'🗺 Carte du Graal'},{id:'rapide',t:(()=>{let a=false;try{a=localStorage.getItem('bs-rapide')==='1';}catch(e){}return a?'⚡ Combats rapides auto : oui':'⚡ Combats rapides auto : non';})()},{id:'vitesse',t:'⏩ Vitesse des animations : '+NOMS_VIT[VITESSE]},{id:'3d',t:R3.ok?(V.m3?'🧊 Carte en 3D : oui':'🧊 Carte en 3D : non (2D)'):'🧊 3D indisponible sur cet appareil',off:!R3.ok},
  ...(R3.ok&&V.m3&&R3.actif?[{id:'qualite',t:'🎚 Qualité 3D : '+NOMS_Q3D[R3.niveau()]+(R3.auto()?' (auto)':'')}]:[]),
  {id:'aide',t:'📖 Aide'},{id:'bug',t:'🐞 Signaler un problème'},...(TEST?[{id:'banc',t:'▶ Banc de mesure'}]:[]),{id:'quitter',t:'🏠 Quitter vers l’accueil'},{id:'reprendre',t:'Reprendre',or:true}];
 const k=await fenetre(`<h2>Menu</h2><p style="font-size:13px;text-align:center">${dateTxt()} · Graine ${G.graine}${TEST?' · 🧪 Mode test':''}<br>☁ Sauvegarde en ligne : ${nb}</p>`,it);
 const c=it[k]&&it[k].id;
 if(c==='sauver'){sauver();toast(TEST?'Mode test : rien n’est sauvegardé.':'Partie sauvegardée.');}
 else if(c==='son'){SON.basculerSon();menu();}else if(c==='musique'){SON.basculerMusique();menu();}
 else if(c==='rapide'){try{localStorage.setItem('bs-rapide',localStorage.getItem('bs-rapide')==='1'?'0':'1');}catch(e){}menu();}
 else if(c==='vitesse'){changerVitesse();menu();}
 else if(c==='graal')carteGraal();
 else if(c==='journal'){await fenetre('<h2>Journal</h2>'+(G.log.slice(-40).reverse().map(l=>`<p style="font-size:13px">J${l.j} — ${esc(l.t)}</p>`).join('')||'<p>Rien pour l’instant.</p>'),[{t:'Fermer',or:true}]);}
 else if(c==='3d'){basculer3D();}
 else if(c==='qualite'){if(!R3.auto()&&R3.niveau()===0){R3.autoQualite();toast('Qualité 3D automatique : elle baisse seule si l’appareil peine.',2500);}else{const q=R3.auto()?2:R3.niveau()-1;R3.choisirQualite(q);toast('Qualité 3D : '+NOMS_Q3D[q]+' — '+['image allégée, sans ombres','sans ombres','ombres et image fine'][q],2500);}menu();}
 else if(c==='aide')aide();
 else if(c==='bug'){toast('Envoi du signalement…');const ok=TK?await TK.signaler():false;toast(ok?'Merci ! Signalement envoyé à Claude.':'Signalement enregistré sur cet appareil ('+(TK?TK.base:'?')+').',3000);}
 else if(c==='banc')banc();
 else if(c==='quitter'){sauver();G=null;ecran('accueil');majAccueil();}}
const NOMS_Q3D=['Économie','Normale','Haute'];
function basculer3D(){V.m3=!V.m3;try{localStorage.setItem('bs-3d',V.m3?'1':'0');}catch(e){}const c=V.ctr;
 if(V.m3){toast('Préparation de la carte en 3D…');R3.init().then(ok=>{if(ok){R3.ouvrir();if(c)R3.centrer(c[0],c[1]);}else{V.m3=false;toast('La 3D n’a pas pu démarrer sur cet appareil.');}});}
 else{R3.fermer();if(c)centrer(c[0],c[1]);}}
function carteGraal(){const j=vueJoueur();const p=G.joueurs[j];const n=(p.obel||[]).length,t=G.carte.nObel||4;
 return fenetre(`<h2>Carte du Graal</h2><p style="text-align:center">${G.graalPris?'Le Graal a déjà été déterré.':`Fragments déchiffrés : <b>${n}/${t}</b>. Visitez les obélisques pour compléter la carte.`}</p><div style="text-align:center"><canvas id="cvGraal" width="280" height="280" style="width:280px;max-width:80vw;border:3px solid #8a6420;border-radius:4px"></canvas></div>`,[{t:'Fermer',or:true}],{init:f=>{
  const c=f.querySelector('#cvGraal'),g=c.getContext('2d');const N=G.carte.N,R0=7;const [gx,gy]=G.carte.graal>=0?xy(G.carte.graal):[N/2,N/2];const x0=Math.max(0,Math.min(N-2*R0-1,gx-R0)),y0=Math.max(0,Math.min(N-2*R0-1,gy-R0));
  g.drawImage(V.sol,x0*PX,y0*PX,(2*R0+1)*PX,(2*R0+1)*PX,0,0,280,280);const k=280/(2*R0+1);
  for(let y=y0;y<=y0+2*R0;y++)for(let x=x0;x<=x0+2*R0;x++){const o=G.carte.obs[y*N+x];if(o===OBS.VEG||o===OBS.ROC){const s=spriteObstacle(o,TER[G.carte.ter[y*N+x]],(x*7+y*13)%9);g.drawImage(s,(x-x0+.5)*k-s.width*k/TS/2,(y-y0+1)*k-s.height*k/TS,s.width*k/TS,s.height*k/TS);}}
  const P=4,vis=Math.floor(P*P*Math.min(1,n/t));const ordre=[...Array(P*P).keys()].sort((a,b)=>((a*7919)%13)-((b*7919)%13));
  for(let q=vis;q<P*P;q++){const i=ordre[q];const px=(i%P)*70,py=((i/P)|0)*70;const gr=g.createLinearGradient(px,py,px+70,py+70);gr.addColorStop(0,'#e8d6aa');gr.addColorStop(1,'#c8ae78');g.fillStyle=gr;g.fillRect(px,py,70,70);g.strokeStyle='rgba(90,60,20,.5)';g.strokeRect(px+.5,py+.5,69,69);}
  if(n>=t&&!G.graalPris){const X=(gx-x0+.5)*k,Y=(gy-y0+.5)*k;g.lineWidth=5;g.strokeStyle='#c8201a';g.beginPath();g.moveTo(X-10,Y-10);g.lineTo(X+10,Y+10);g.moveTo(X+10,Y-10);g.lineTo(X-10,Y+10);g.stroke();}}});}
function aide(){return fenetre(`<h2>Comment jouer</h2>
 <p><b>But :</b> prendre toutes les villes et vaincre tous les héros rivaux. Chaque partie se joue sur une carte <b>générée au hasard</b> (taille, eau, monstres au choix ; la graine permet de rejouer la même carte).</p>
 <p><b>Carte :</b> touchez une case pour tracer le chemin du héros (flèches vertes : atteignable aujourd’hui, rouges : les jours suivants), touchez à nouveau pour partir. Glissez pour déplacer la vue, pincez ou utilisez la molette pour zoomer, appui long ou clic droit pour décrire une case.</p>
 <p><b>Ressources :</b> ramassez les tas, capturez les mines (drapeau), ouvrez les coffres. Les créatures gardent souvent les trésors et les passages entre régions.</p>
 <p><b>Villes :</b> un bâtiment par jour. Les habitations produisent des créatures chaque semaine (lundi). La guilde des mages enseigne des sorts, la taverne propose des héros.</p>
 <p><b>Le Graal :</b> chaque obélisque révèle un fragment de sa carte (menu ☰). Une fois la carte complète, une croix rouge marque l’emplacement : creusez-y (fiche du héros, ⛏) avec un héros qui n’a pas bougé de la journée, puis rapportez le Graal dans une ville pour y bâtir une merveille (+5000 or par jour, créatures +50 %).</p>
 <p><b>Combat :</b> chaque troupe agit à son tour selon sa vitesse. Touchez une case verte pour vous déplacer, un ennemi pour l’attaquer (ou tirer). Votre héros peut lancer un sort par round (📖). ⏳ attendre, 🛡 se défendre, ⚙ combat automatique.</p>
 <p><b>Raccourcis :</b> E fin du tour · H héros suivant · V ville · Espace avancer · Échap menu. En combat : W attendre · D se défendre · S sorts · A automatique · V vitesse (×1, ×2, ×3) · F fuir.</p>`,[{t:'Fermer',or:true}]);}

// ---------- mode test et banc ----------
function modeTest(){TEST=true;TK&&TK.modeTest();demarrer({graine:7,taille:54,eau:1,monstres:1,difficulte:1,joueurs:[{fac:'bastion',humain:true},{fac:'necro',humain:false},{fac:'sylve',humain:false}]});}
async function banc(){if(!TK)return;const h=herosDe(G.courant)[0];const q3=en3D()&&R3.actif;const q0=q3?R3.niveau():null;toast('Banc en cours… (≈'+(q3?45:25)+' s)',3000);V.banc=true;if(q3)R3.figer(true);
 const parQ=q3?[2,1,0].filter(q=>q!==q0).map(q=>({nom:'carte_'+['eco','normale','haute'][q],preparer:async()=>{ecran('aventure');R3.qualite(q);if(h)centrer(h.x,h.y);V.zoom=1;}})):[];
 let res;try{res=await TK.banc([
  {nom:'carte',preparer:async()=>{ecran('aventure');if(h)centrer(h.x,h.y);V.zoom=1;}},...parQ,
  {nom:'carte_dezoom',preparer:async()=>{if(q3)R3.qualite(q0);V.zoom=.6;if(h)centrer(h.x,h.y);}},
  {nom:'combat',preparer:async()=>{V.zoom=1;const m=G.objs.find(o=>o.t==='monstre');const A={heros:h,armee:h.armee.map(s=>s?{c:s.c,n:s.n*3}:null),joueur:h.j},D={heros:null,armee:pileMonstre(m),joueur:-1};combatInteractif(A,D,{terrain:'herbe',banc:true});}},
  {nom:'ville',preparer:async()=>{if(CB)CB.quitter&&CB.quitter();const v=villesDe(G.courant)[0];ouvrirVille(v);}},
 ],5000);}finally{V.banc=false;if(q3){R3.qualite(q0);R3.figer(false);}}
 if(VI)VI.fermer&&VI.fermer();ecran('aventure');
 alerte('Banc terminé',res.res.map(r=>`${r.scene} : ${r.fps} img/s (pire ${r.pire} ms)`).join('<br>')+`<br><small>${res.enregistre?'Envoyé à Claude ✓':'Non envoyé : '+esc(res.base)}</small>`);}

// ---------- boucle et démarrage ----------
function boucle(){try{V.cpt=(V.cpt||0)+1;const repos=performance.now()-(V.activite||0)>4000&&!V.anim&&!V.occupe&&!V.banc;if(ECRAN==='aventure'&&G){if(!repos||V.cpt%2)dessiner();}else if(ECRAN==='accueil'&&(performance.now()-(V.tAcc||0))>100){V.tAcc=performance.now();fondAccueil();}else if(ECRAN==='combat'&&CB)dessinerCombat();else if(ECRAN==='ville'&&VI)dessinerVille();}catch(e){console.error(e);TK&&TK.erreurs.push(String(e).slice(0,200));}requestAnimationFrame(boucle);}
window.addEventListener('resize',()=>{if(G){redim();borner();}if(ECRAN==='combat'&&CB)redimCombat();if(ECRAN==='ville'&&VI)redimVille();});
window.addEventListener('keydown',e=>{V.activite=performance.now();if(e.target.tagName==='INPUT')return;const fh=fenHaut();const m=!!fh;
 if(e.key==='Escape'){if(m){const bs=fh.querySelectorAll('.fen > .btns .btn');const b=[...bs].find(x=>/Fermer|Annuler|Reprendre|Terminer|D’accord/.test(x.textContent))||bs[bs.length-1];if(b)b.click();}else if(ECRAN==='aventure')menu();else if(ECRAN==='ville'&&VI)VI.fermer();return;}
 if(!m&&ECRAN==='combat'&&CB){const k=e.key.toLowerCase();const id={w:'cbAttendre',d:'cbDefendre',s:'cbSort',a:'cbAuto',v:'cbVit',f:'cbFuir'}[k];if(id){const b=$(id);if(b&&!b.disabled){e.preventDefault();b.click();}}return;}
 if(m||ECRAN!=='aventure'||!G||V.occupe)return;const k=e.key.toLowerCase();
 if(k==='e')finTour();else if(k==='h')heroSuivant();else if(k===' '){e.preventDefault();avancer();}else if(k==='v'){const v=V.sel&&V.sel.t==='ville'?G.oi[V.sel.id]:villesDe(G.courant)[0];if(v)ouvrirVille(v);}
 else if(k.startsWith('arrow')&&en3D()){const d=innerHeight*.2;R3.deplacer(k==='arrowleft'?d:k==='arrowright'?-d:0,k==='arrowup'?d:k==='arrowdown'?-d:0);}
 else if(k.startsWith('arrow')){const d=tailleT()*3;if(k==='arrowleft')V.cam.x-=d;if(k==='arrowright')V.cam.x+=d;if(k==='arrowup')V.cam.y-=d;if(k==='arrowdown')V.cam.y+=d;borner();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&G&&!TEST&&window.NUAGE)NUAGE.push(true);});
function brancher(){V.mini=$('minicarte');{let dern=-2;addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||ECRAN!=='aventure'||!en3D()||!R3.survol)return;if(e.target&&e.target.id!=='carte3d'&&e.target.id!=='carte'){if(dern!==-1){dern=-1;R3.survol(-1);}return;}const i=R3.caseSous(e.clientX,e.clientY);if(i!==dern){dern=i;R3.survol(i);}},{passive:true});}/* 24/11 : case survolée */for(const ev of ['pointerdown','pointermove','wheel'])addEventListener(ev,()=>{V.activite=performance.now();},{passive:true});
 $('bNouvelle').onclick=()=>{SON.debloquer();SON.clic();ouvrirConfig();};$('bContinuer').onclick=()=>{SON.debloquer();continuer();};$('bAide').onclick=()=>aide();$('bTest').onclick=()=>{SON.debloquer();modeTest();};
 $('cRetour').onclick=()=>ecran('accueil');$('cAjout').onclick=()=>{if(CFG.joueurs.length<4){CFG.joueurs.push({fac:FACS.find(f=>!CFG.joueurs.some(p=>p.fac===f))||FACS[CFG.joueurs.length%FACS.length],humain:false});majJoueursCfg();}};
 $('cDe').onclick=()=>{$('cGraine').value=Math.floor(Math.random()*999999);};
 $('cGo').onclick=()=>{SON.clic();TEST=false;const gr=parseInt($('cGraine').value);demarrer({graine:isNaN(gr)?Math.floor(Math.random()*999999)+1:gr,taille:CFG.taille,eau:CFG.eau,monstres:CFG.monstres,difficulte:CFG.difficulte,victoire:CFG.victoire,joueurs:CFG.joueurs.map(p=>Object.assign({},p))});};
 $('bHeroSuiv').onclick=()=>heroSuivant();$('bFiche').onclick=()=>{const h=V.sel&&V.sel.t==='heros'?heroPar(V.sel.id):herosDe(G.courant)[0];if(h)ouvrirFiche(h);};
 $('bVille').onclick=()=>{const v=V.sel&&V.sel.t==='ville'?G.oi[V.sel.id]:villesDe(G.courant)[0];if(v)ouvrirVille(v);else toast('Vous n’avez plus de ville !');};
 $('bBouger').onclick=()=>avancer();$('bFinTour').onclick=()=>{SON.clic();const reste=herosDe(G.courant).filter(h=>h.mp>200);if(reste.length&&!V.avertiFin){V.avertiFin=true;toast(`Encore du mouvement pour ${reste.map(h=>h.nom).join(', ')} — touchez ⌛ à nouveau pour finir le tour.`,2600);setTimeout(()=>V.avertiFin=false,2600);return;}V.avertiFin=false;finTour();};
 $('bMenu').onclick=()=>menu();$('bCarte').onclick=()=>{V.mini.classList.toggle('ouvert');V.miniDirty=true;};
 brancherCarte();brancherCombat();brancherVille();
 try{TK=Testkit({jeu:'bannieres',canvas:()=>ECRAN==='combat'?$('cvCombat'):ECRAN==='ville'?$('cvVille'):ECRAN==='accueil'?$('fondAccueil'):en3D()?$('carte3d'):$('carte'),etat:()=>({ecran:ECRAN,test:TEST,graine:G&&G.graine,jour:G&&G.jour,courant:G&&G.courant,heros:G&&G.heros.map(h=>({nom:h.nom,j:h.j,x:h.x,y:h.y,mp:h.mp})),tGen:V.tGen,mode3d:en3D(),q3d:R3.niveau&&R3.niveau(),q3dAuto:R3.auto&&R3.auto(),gpu:R3.info&&R3.info(),ecranTaille:innerWidth+'x'+innerHeight}),rendu:()=>{if(ECRAN==='aventure'&&en3D())R3.rendre();}});}catch(e){}
 try{window.NUAGE=SauvegardeEnLigne({etat:()=>serialiser(),meta:()=>({jour:G?G.jour:0}),coupe:()=>TEST||!G});}catch(e){}
 V.mini=$('minicarte');
 const q=new URLSearchParams(location.search);{let p=null;try{p=localStorage.getItem('bs-3d');}catch(e){}V.m3=R3.ok&&(q.get('v3d')?q.get('v3d')!=='0':p!=='0');}if(q.get('graine')){TEST=q.get('test')!=='0';demarrer({graine:+q.get('graine'),taille:+(q.get('taille')||54),eau:+(q.get('eau')||1),monstres:1,difficulte:1,joueurs:[{fac:q.get('fac')||'bastion',humain:true},{fac:'necro',humain:false},{fac:'sylve',humain:false}].slice(0,+(q.get('joueurs')||3))});}
 else{ecran('accueil');majAccueil();}
 requestAnimationFrame(boucle);}
brancher();

/* 24/11 : annonce de la nouvelle semaine sur un parchemin, avec la créature de la semaine (comme « Semaine du griffon » dans Heroes III) */
function annonceSemaine(n,sm,se){let e=$('annSem');if(!e){e=document.createElement('div');e.id='annSem';e.className='ann-sem';document.body.appendChild(e);}
 e.innerHTML=`<canvas width="150" height="150"></canvas><div><div class="t">Semaine ${n}</div><div class="s">${sm?`Semaine ${/^[AEIOUÉ]/.test(sm.nom)?'de l’':'du '}${esc(sm.nom.toLowerCase())}`:'Les créatures se multiplient'}</div>${sm?`<div class="d">+${se.bonus} ${esc(sm.pl.toLowerCase())} dans chaque habitation</div>`:''}</div>`;
 try{if(sm)e.querySelector('canvas').getContext('2d').drawImage(spriteCreature(sm.id||se.cre,150),0,0);else e.querySelector('canvas').remove();}catch(x){}
 e.classList.remove('vu');void e.offsetWidth;e.classList.add('vu');clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove('vu'),4200);}
