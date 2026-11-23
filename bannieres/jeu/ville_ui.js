'use strict';
/* =========================================================
   BANNIÈRES & SORTILÈGES — écran de ville : panorama, construction, recrutement, marché, taverne, guilde
   ========================================================= */
var VI=null;
function ouvrirVille(v){if(!v)return Promise.resolve();SON.porte(1);return new Promise(res=>{bulle(null);VI={v,res,survol:null,dirty:true};
 VI.fermer=()=>{SON.porte(0);SON.musique('carte');const r=VI.res;VI=null;ecran('aventure');V.fogDirty=true;V.miniDirty=true;majUI();r();};
 ecran('ville');majVille();redimVille();SON.musique(v.fac);});}
function herosVille(){const v=VI.v;const h=heroPar(G.hpos[idx(v.x,v.y)]);return h&&h.j===v.prop?h:null;}
function redimVille(){if(!VI)return;const cv=$('cvVille');const d=Math.min(2,devicePixelRatio||1);const bas=document.querySelector('.ville-bas').offsetHeight;const H=Math.max(160,innerHeight-bas);cv.style.height=H+'px';cv.width=innerWidth*d;cv.height=H*d;VI.dpr=d;VI.W=innerWidth;VI.H=H;VI.dirty=true;}
function dessinerVille(){if(!VI)return;const cv=$('cvVille');const g=cv.getContext('2d');
 if(VI.dirty){let p=null;if(V.m3&&R3.ok){try{/* 23/11 : panorama gardé en mémoire tant que la ville ne change pas (réouverture instantanée) */
  const cle=[VI.v.id,VI.v.fac,JSON.stringify(VI.v.bat),VI.W*VI.dpr,VI.H*VI.dpr,R3.niveau&&R3.niveau()].join('|');const M=window.PANO_CACHE=window.PANO_CACHE||new Map();p=M.get(cle)||null;
  if(!p){p=R3.panoVille(VI.v,VI.W*VI.dpr,VI.H*VI.dpr);if(p){M.set(cle,p);while(M.size>4)M.delete(M.keys().next().value);}}}catch(e){console.error(e);}}VI.pano=p||panoramaVille(VI.v,VI.W*VI.dpr,VI.H*VI.dpr);VI.dirty=false;}
 g.setTransform(1,0,0,1,0,0);g.drawImage(VI.pano.c,0,0);
 // drapeaux et fumées
 const t=performance.now()/1000;const col=COULEURS[G.joueurs[VI.v.prop].coul].c;g.save();g.scale(VI.dpr,VI.dpr);if(VI.pano.drap){for(const [x,y] of VI.pano.drap)drapeau(g,x/VI.dpr,y/VI.dpr,col,t,Math.min(2.2,VI.H/260));}else{drapeau(g,VI.W*.5,VI.H*.36,col,t,VI.H/200);drapeau(g,VI.W*.22,VI.H*.42,col,t+1,VI.H/300);drapeau(g,VI.W*.78,VI.H*.42,col,t+2,VI.H/300);}
 if(VI.survol){const z=VI.survol;g.strokeStyle='rgba(255,224,138,.9)';g.lineWidth=2;g.setLineDash([6,4]);g.strokeRect(z.x/VI.dpr,z.y/VI.dpr,z.w/VI.dpr,z.h/VI.dpr);g.setLineDash([]);g.font='bold 15px Palatino,Georgia,serif';g.textAlign='center';g.lineWidth=4;g.strokeStyle='#000';const n=batNom(z.b,VI.v.fac);g.strokeText(n,(z.x+z.w/2)/VI.dpr,z.y/VI.dpr-4);g.fillStyle='#ffe8a0';g.fillText(n,(z.x+z.w/2)/VI.dpr,z.y/VI.dpr-4);}
 g.restore();}
function majVille(){const v=VI.v,p=G.joueurs[v.prop];const h=herosVille();
 $('vNom').innerHTML=`${esc(v.nom)} <small style="color:#c9b38a">— ${FAC[v.fac].ville}${v.construit?' · déjà construit aujourd’hui':''}</small>`;
 $('vRes').innerHTML=RES.map(r=>`<span>${imgRes(r,16)}${p.res[r]}</span>`).join('');peindreCanvasRes($('vRes'));
 const zone=document.querySelector('.ville-armees');const listes=[{titre:'Garnison',armee:v.garn}];if(h)listes.push({titre:h.nom,armee:h.armee,heros:h});
 editeurArmees(zone,listes,()=>{});zone.querySelectorAll('.arm-tit').forEach(e=>e.style.color='#d8c49a');
 $('vTaverne').disabled=!v.bat.taverne;$('vMarche').disabled=!v.bat.marche;$('vGuilde').disabled=!v.bat.guilde1;
 setTimeout(redimVille,0);}
function brancherVille(){const cv=$('cvVille');
 const zoneSous=e=>{if(!VI||!VI.pano)return null;const r=cv.getBoundingClientRect();const x=(e.clientX-r.left)*VI.dpr,y=(e.clientY-r.top)*VI.dpr;const I=VI.pano.ids;if(I){const k=I.a[Math.min(I.H-1,Math.max(0,Math.round(y)))*I.W+Math.min(I.W-1,Math.max(0,Math.round(x)))];if(k){const z=VI.pano.zones.find(z=>z.b===I.bs[k-1]);if(z)return z;}}let best=null;for(const z of VI.pano.zones)if(x>=z.x&&x<=z.x+z.w&&y>=z.y&&y<=z.y+z.h&&(!best||z.y>best.y))best=z;return best;};
 cv.addEventListener('pointermove',e=>{if(!VI)return;VI.survol=zoneSous(e);});
 cv.addEventListener('pointerup',e=>{if(!VI)return;const z=zoneSous(e);if(z){SON.clic();clicBatiment(z.b);}});
 $('vQuitter').onclick=()=>{SON.clic();VI&&VI.fermer();};
 $('vConstruire').onclick=()=>fenConstruire();$('vRecruter').onclick=()=>fenRecruter();$('vMarche').onclick=()=>fenMarche();$('vTaverne').onclick=()=>fenTaverne();$('vGuilde').onclick=()=>fenGuilde();}
function clicBatiment(b){if(BAT[b].niv)return fenRecruter(BAT[b].niv-1);if(b.startsWith('guilde'))return fenGuilde();if(b==='taverne')return fenTaverne();if(b==='marche')return fenMarche();if(['conseil','mairie','hotelville','capitole'].includes(b))return fenConstruire();if(['fort','citadelle','chateau'].includes(b))return fenRecruter();
 return alerte(batNom(b,VI.v.fac),BAT[b].desc);}
async function fenConstruire(){const v=VI.v,p=G.joueurs[v.prop];
 const cartes=BAT_ORDRE.map(b=>{const fait=!!v.bat[b];const d=batDisponible(v,b);if(!fait&&!d.ok&&d.raison==='Déjà amélioré')return'';const c=batCout(b,v.fac);const ok=!fait&&d.ok&&aDeQuoi(p.res,c)&&!v.construit;
  const desc=BAT[b].amel?`Permet de recruter des ${CRE[CRE[FAC[v.fac].crea[BAT[b].niv-1]].amelio].pl.toLowerCase()} et d’améliorer vos ${CRE[FAC[v.fac].crea[BAT[b].niv-1]].pl.toLowerCase()}.`:BAT[b].niv?`Produit ${CRE[FAC[v.fac].crea[BAT[b].niv-1]].cr} ${CRE[FAC[v.fac].crea[BAT[b].niv-1]].pl.toLowerCase()} par semaine.`:BAT[b].desc;
  return`<div class="carte-b ${fait?'fait':ok?'ok':'non'}" data-b="${b}"><b>${batNom(b,v.fac)}</b><small>${desc}</small>${fait?'<div style="color:#2a6a1a">✔ Construit</div>':(d.ok?txtCout(c,p.res):`<div style="color:#8a2a1a;font-size:12px">${d.raison}</div>`)}</div>`;}).join('');
 await fenetre(`<h2>Construire à ${esc(v.nom)}</h2>${v.construit?'<p style="text-align:center;color:#8a2a1a">Un seul bâtiment par jour : revenez demain.</p>':''}<div class="grille">${cartes}</div>`,[{t:'Fermer',or:true}],{init:(f,fermer)=>{
  f.querySelectorAll('.carte-b.ok').forEach(d=>d.onclick=async()=>{const b=d.dataset.b;const k=await fenetre(`<h2>${batNom(b,v.fac)}</h2><p>${BAT[b].amel?`Les ${CRE[FAC[v.fac].crea[BAT[b].niv-1]].pl.toLowerCase()} deviennent des ${CRE[CRE[FAC[v.fac].crea[BAT[b].niv-1]].amelio].pl.toLowerCase()}.`:BAT[b].niv?`Habitation des ${CRE[FAC[v.fac].crea[BAT[b].niv-1]].pl.toLowerCase()}.`:BAT[b].desc}</p>${txtCout(batCout(b,v.fac))}`,[{t:'Construire',or:true},{t:'Annuler'}]);
   if(k===0&&construire(v,b)){SON.construire();VI.dirty=true;fermer(0);majVille();toast(`${batNom(b,v.fac)} construit !`);}});}});}
async function fenRecruter(niv){const v=VI.v,p=G.joueurs[v.prop];const h=herosVille();const cr=FAC[v.fac].crea;
 const carte=(n,base)=>{const id=creNiv(v,n,base);const C=CRE[id];const maxN=Math.min(v.dispo[n],peutPayer(p.res,C.cout));return`<div class="carte-b ${v.dispo[n]?'ok':'non'}" data-n="${n}" data-base="${base?1:0}" style="display:flex;gap:8px;align-items:center"><canvas width="64" height="64" data-cre="${id}"></canvas><div><b>${C.pl}</b>Disponibles : <b>${v.dispo[n]}</b> (abordables : ${maxN})${txtCout(C.cout,p.res)}</div></div>`;};
 const lignes=cr.map((c,n)=>{if(!v.bat['hab'+(n+1)])return'';return v.bat['hab'+(n+1)+'u']?carte(n,false)+carte(n,true):carte(n,true);}).join('');
 // troupes améliorables présentes dans la ville
 const piles=[];for(const [nom,arm] of [['Garnison',v.garn]].concat(h?[[h.nom,h.armee]]:[]))arm.forEach((s,k)=>{if(s&&CRE[s.c].amelio&&CRE[s.c].fac===v.fac&&v.bat['hab'+CRE[s.c].niv+'u'])piles.push({nom,arm,k,s});});
 const amel=piles.length?`<h3 style="text-align:center;margin:10px 0 4px">Améliorer vos troupes</h3><div class="grille">${piles.map((x,i)=>{const pr=prixAmelioration(x.s.c,x.s.n);const ok=aDeQuoi(p.res,pr);return`<div class="carte-b ${ok?'ok':'non'}" data-am="${i}" style="display:flex;gap:8px;align-items:center"><canvas width="56" height="56" data-cre="${CRE[x.s.c].amelio}"></canvas><div><b>${x.s.n} ${CRE[x.s.c].pl} → ${CRE[CRE[x.s.c].amelio].pl}</b><small>${esc(x.nom)}</small>${txtCout(pr,p.res)}</div></div>`;}).join('')}</div>`:'';
 await fenetre(`<h2>Recruter</h2><p style="font-size:13px;text-align:center">Les recrues rejoignent ${h?esc(h.nom):'la garnison'}. Croissance hebdomadaire ${v.bat.chateau?'+100 %':v.bat.citadelle?'+50 %':'normale'}${v.bat.graal?' (+50 % grâce au Graal)':''}.</p><div class="grille">${lignes||'<p>Aucune habitation construite.</p>'}</div>${amel}`,[{t:'Tout recruter'},{t:'Fermer',or:true}].map((b,i)=>i===0?Object.assign(b,{f:()=>{let tot=0;for(let n=6;n>=0;n--)if(v.dispo[n])tot+=recruter(v,n,v.dispo[n],h?h.armee:v.garn)||recruter(v,n,v.dispo[n],v.garn);majVille();if(tot)SON.recrue();toast(tot?`${tot} créatures recrutées.`:'Rien à recruter (ou pas assez de ressources / de place).');}}):b),
  {init:(f,fermer)=>{const go=async(n,base)=>{const C=CRE[creNiv(v,n,base)];const maxN=Math.min(v.dispo[n],peutPayer(p.res,C.cout));if(!maxN){toast('Pas assez de ressources.');return;}
   const q=await choisirNombre(`Recruter des ${C.pl.toLowerCase()}`,`Coût unitaire :`+txtCout(C.cout),maxN,maxN,C.id);if(q>0){const r=recruter(v,n,q,h?h.armee:v.garn,base)||recruter(v,n,q,v.garn,base);if(!r)toast('Plus de place dans l’armée !');else{SON.recrue();toast(`${r} ${C.pl.toLowerCase()} recrutés.`);}majVille();fermer(1);fenRecruter();}};
   f.querySelectorAll('.carte-b.ok[data-n]').forEach(d=>d.onclick=()=>go(+d.dataset.n,d.dataset.base==='1'));
   f.querySelectorAll('.carte-b.ok[data-am]').forEach(d=>d.onclick=()=>{const x=piles[+d.dataset.am];if(ameliorerPile(v,x.arm,x.k)){SON.construire();toast('Troupe améliorée !');majVille();fermer(1);fenRecruter();}});
   if(niv!=null&&v.dispo[niv]&&v.bat['hab'+(niv+1)]){setTimeout(()=>go(niv,!v.bat['hab'+(niv+1)+'u']),50);}}});}
async function fenMarche(){const v=VI.v,p=G.joueurs[v.prop];let de='bois',vers='or';
 const rendu=f=>{const taux=prixMarche(p.id,de,vers);const lab=vers==='or'?`1 ${RES_NOM[de].toLowerCase()} → ${Math.floor(taux)} or`:`${(Math.ceil(taux*10)/10)} ${RES_NOM[de].toLowerCase()} → 1 ${RES_NOM[vers].toLowerCase()}`;
  const max=vers==='or'?(p.res[de]||0):Math.floor((p.res[de]||0)/taux);
  f.querySelector('#mk').innerHTML=`<p><b>Vous donnez :</b></p><div class="choix">${RES.map(r=>`<button data-de="${r}" class="${r===de?'sel':''}" style="background:${r===de?'':'#f4e6c4'};color:#2a1a08">${imgRes(r,18)} ${p.res[r]}</button>`).join('')}</div>
  <p><b>Vous recevez :</b></p><div class="choix">${RES.map(r=>`<button data-vers="${r}" class="${r===vers?'sel':''}" style="background:${r===vers?'':'#f4e6c4'};color:#2a1a08">${imgRes(r,18)}</button>`).join('')}</div>
  <p style="text-align:center">Taux : <b>${de===vers?'—':lab}</b></p>${de!==vers&&max>0?`<input type="range" id="mq" min="1" max="${max}" value="1"><p style="text-align:center" id="mt"></p><div class="btns"><button class="btn or" id="mgo">Échanger</button></div>`:'<p style="text-align:center">Rien à échanger.</p>'}`;
  peindreCanvasRes(f);f.querySelectorAll('[data-de]').forEach(b=>b.onclick=()=>{de=b.dataset.de;rendu(f);});f.querySelectorAll('[data-vers]').forEach(b=>b.onclick=()=>{vers=b.dataset.vers;rendu(f);});
  const q=f.querySelector('#mq');if(q){const maj=()=>{const n=+q.value;f.querySelector('#mt').innerHTML=vers==='or'?`${n} ${RES_NOM[de].toLowerCase()} → <b>${Math.floor(n*taux)} or</b>`:`${Math.ceil(n*taux)} ${RES_NOM[de].toLowerCase()} → <b>${n} ${RES_NOM[vers].toLowerCase()}</b>`;};q.oninput=maj;maj();
   f.querySelector('#mgo').onclick=()=>{if(echanger(p.id,de,vers,+q.value)){SON.piece();majVille();rendu(f);}};}};
 await fenetre(`<h2>Marché</h2><p style="font-size:13px;text-align:center">Plus vous possédez de marchés, meilleurs sont les taux.</p><div id="mk"></div>`,[{t:'Fermer',or:true}],{init:f=>rendu(f)});}
async function fenTaverne(){const v=VI.v,p=G.joueurs[v.prop];const occupe=!!G.hpos[idx(v.x,v.y)];
 const cartes=p.taverne.map((c,k)=>{if(!c)return`<div class="carte-b non"><b>—</b>Déjà engagé cette semaine.</div>`;const C=CLASSES[c];return`<div class="carte-b ${occupe||p.res.or<2500?'non':'ok'}" data-k="${k}"><b>${C.nom}</b>${FAC[C.fac].adj}<br><small>Att ${C.base[0]} · Déf ${C.base[1]} · Pui ${C.base[2]} · Con ${C.base[3]}<br>${Object.keys(C.comp).map(x=>COMP[x].nom).join(', ')}${C.sorts.length?' · sort : '+SORTS[C.sorts[0]].nom:''}</small></div>`;}).join('');
 await fenetre(`<h2>Taverne</h2><p style="text-align:center">Engager un héros coûte <b>2500 or</b>.${occupe?'<br><span style="color:#8a2a1a">Un héros occupe déjà la porte de la ville : faites-le sortir d’abord.</span>':''}${herosDe(p.id).length>=8?'<br>Vous avez déjà 8 héros.':''}</p><div class="grille">${cartes}</div>`,[{t:'Fermer',or:true}],{init:(f,fermer)=>{f.querySelectorAll('.carte-b.ok').forEach(d=>d.onclick=()=>{const h=engager(v,+d.dataset.k);if(h){SON.fanfare();apprendreSorts(h,v);fermer(0);majVille();toast(`${h.nom} rejoint votre cause !`);V.sel={t:'heros',id:h.id};}});}});}
async function fenGuilde(){const v=VI.v;const h=herosVille();let html='<h2>Guilde des mages</h2>';
 for(let n=1;n<=3;n++){if(!v.bat['guilde'+n])continue;html+=`<p><b>Cercle ${n}</b>${n===3?' <small>(Sagesse requise)</small>':''}</p><div class="grille">`+v.guilde[n].map(s=>`<div class="carte-b"><b>${SORTS[s].nom}</b><small>${SORTS[s].mana} mana</small><br>${SORTS[s].desc}${h?(h.sorts.includes(s)?'<br><span style="color:#2a6a1a">✔ connu de '+esc(h.nom)+'</span>':'<br><span style="color:#8a2a1a">'+(n===3?'Sagesse requise':'')+'</span>'):''}</div>`).join('')+'</div>';}
 if(!h)html+='<p style="font-size:13px">Un héros présent dans la ville apprend automatiquement les sorts de la guilde et recharge son mana.</p>';
 await fenetre(html,[{t:'Fermer',or:true}]);}
