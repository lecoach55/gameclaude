'use strict';
/* Cage & Gloire — interface */
const M=Moteur;let G=null,VUE='ecurie',TEST=false,TK=null,NUAGE=null,ARENE_OK=false;
const SEL={org:'cfr',div:'le',tri:'note'};
const $=id=>document.getElementById(id);
const CLE='cage-gloire-v1';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const fE=x=>M.fmtE(x);
const ORGc=id=>M.ORG(id);
const OE=e=>e&&e.maison?{id:'cfr',court:'GALA',nom:G.nom,c1:'#e9c46a',c2:'#3a1d08',acc:'#ffffff',tier:0,devise:'À domicile',freq:10,show:0,max:0,villes:[]}:ORGc(e.org);
const flag=p=>(PAYS[p]||{}).f||'🏳️';
const nomC=f=>f.pr+' '+f.nom;
const rec=f=>f.v+'-'+f.d+(f.n?'-'+f.n:'');
const noteCol=n=>n>=85?'#ffd36b':n>=75?'#f0a23a':n>=65?'#7fd0ff':n>=55?'#8fe0a8':'#c9c9c9';
function toast(t,ms=2400){const d=document.createElement('div');d.textContent=t;$('toast').appendChild(d);setTimeout(()=>d.remove(),ms);}
/* ---------- emblèmes, ceinture ---------- */
function embleme(O,big){const id='em'+O.id+(big?'b':'');const st='★'.repeat(O.tier+1);
 return `<svg viewBox="0 0 100 100"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${O.c2}"/><stop offset="1" stop-color="#050507"/></linearGradient></defs>
<polygon points="30,3 70,3 97,30 97,70 70,97 30,97 3,70 3,30" fill="url(#${id})" stroke="${O.c1}" stroke-width="4"/>
<polygon points="33,11 67,11 89,33 89,67 67,89 33,89 11,67 11,33" fill="none" stroke="${O.c1}" stroke-width="1.2" opacity=".55"/>
<text x="50" y="${O.court.length>4?58:61}" text-anchor="middle" font-family="Bebas Neue,Impact" font-size="${O.court.length>4?21:30}" fill="${O.c1}" letter-spacing="1">${O.court}</text>
<text x="50" y="80" text-anchor="middle" font-size="8" fill="${O.acc}" letter-spacing="1">${st}</text><text x="50" y="31" text-anchor="middle" font-family="Bebas Neue,Impact" font-size="9" fill="${O.acc}" letter-spacing="2">MMA</text></svg>`;}
const ceinture=(c='#e9c46a')=>`<svg class="ceinture" viewBox="0 0 52 28"><rect x="0" y="9" width="52" height="10" rx="3" fill="#1a1a1a"/><rect x="14" y="2" width="24" height="24" rx="6" fill="${c}" stroke="#fff6d0" stroke-width="1.5"/><circle cx="26" cy="14" r="6" fill="#fff3c4" opacity=".7"/><rect x="5" y="11" width="6" height="6" rx="1" fill="${c}"/><rect x="41" y="11" width="6" height="6" rx="1" fill="${c}"/></svg>`;
const orgB=id=>{if(!id)return '<span class="orgb" style="background:#333;color:#ccc">LIBRE</span>';const O=ORGc(id);return `<span class="orgb" style="background:${O.c2};color:${O.c1};border:1px solid ${O.c1}55">${O.court}</span>`;};
const por=(f,o={})=>Portrait.svg(f,Object.assign({bg:f.org?ORGc(f.org).c2:'#23252e',rim:f.org?ORGc(f.org).c1:null},o));
const etoiles=f=>{const pv=(!f.mine&&f.potVu!=null)?f.potVu:f.pot;const n=Math.max(1,Math.min(5,Math.round((pv-40)/10)));return '★'.repeat(n)+'<span style="opacity:.25">'+'★'.repeat(5-n)+'</span>';};
const traitsH=(f,grand)=>(f.traits||[]).map(k=>{const t=TRAITS[k];return t?`<span class="trait ${t.bon?'':'mauvais'}" title="${esc(t.d)}" data-trait="${k}">${t.ic} ${t.n}</span>`:'';}).join('');
function courbe(f){const C=(f.carr||[]).slice(-60);if(C.length<2)return '<p class="doux" style="font-size:12px">La courbe de progression apparaîtra après quelques mois.</p>';
 const W=320,H=90,mn=Math.min(...C.map(x=>x.o))-3,mx=Math.max(...C.map(x=>x.o),f.pot)+2;const px=i=>i/(C.length-1)*W,py=v=>H-6-(v-mn)/(mx-mn||1)*(H-12);
 const pts=C.map((x,i)=>px(i).toFixed(1)+','+py(x.o).toFixed(1)).join(' ');
 return `<svg viewBox="0 0 ${W} ${H}" class="graph" style="height:90px" preserveAspectRatio="none"><line x1="0" x2="${W}" y1="${py(f.pot)}" y2="${py(f.pot)}" stroke="#e9c46a" stroke-dasharray="4 4" opacity=".5"/><polyline points="${pts}" fill="none" stroke="#ff5a66" stroke-width="2.4" vector-effect="non-scaling-stroke"/></svg><div class="ligne doux" style="font-size:11px;justify-content:space-between"><span>${M.date(C[0].s)}</span><span>pointillés : potentiel</span><span>note ${C[C.length-1].o}</span></div>`;}
function estChamp(f){return f.org&&G.orgs[f.org].ch[f.div]===f.id;}
/* ---------- sauvegarde ---------- */
const b64=buf=>{let s='';const a=new Uint8Array(buf);for(let i=0;i<a.length;i+=0x8000)s+=String.fromCharCode.apply(null,a.subarray(i,i+0x8000));return btoa(s);};
const unb64=s=>{const b=atob(s),a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a;};
let SV=null;
function sauver(){if(TEST||!G)return;G.savedAt=Date.now();const txt=JSON.stringify(G);
 if(window.CompressionStream){const id=SV=Date.now();new Response(new Blob([txt]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer().then(buf=>{if(id!==SV)return;try{localStorage.setItem(CLE+'z',b64(buf));localStorage.removeItem(CLE);}catch(e){toast('Sauvegarde locale impossible : '+e.message);}}).catch(()=>{});}
 else{try{localStorage.setItem(CLE,txt);}catch(e){toast('Sauvegarde locale impossible : '+e.message);}}
 if(NUAGE)NUAGE.push();}
async function charge(){try{const z=localStorage.getItem(CLE+'z');if(z&&window.DecompressionStream){const t=await new Response(new Blob([unb64(z)]).stream().pipeThrough(new DecompressionStream('gzip'))).text();return JSON.parse(t);}const s=localStorage.getItem(CLE);return s?JSON.parse(s):null;}catch(e){return null;}}
/* ---------- accueil ---------- */
async function accueil(){$('accueil').classList.remove('cache');$('app').classList.add('cache');$('combat').classList.add('cache');$('cv3d').style.display='block';
 const s=await charge();let h='';
 if(s){const ms=Object.values(s.F).filter(f=>f.mine&&!f.ret).sort((p,q)=>(q.v-q.d)-(p.v-p.d)).slice(0,4);h+=`<button class="btn or" id="bCont">Continuer · ${esc(s.nom)}</button><div class="acc-sauv"><div>${ms.map(f=>`<span>${Portrait.svg(f,{mini:1,nobg:true})}</span>`).join('')}</div><small>${esc(dateDe(s))} · ${M.fmtE(s.argent)} · ${s.stats.v}-${s.stats.d} · ${s.stats.titres} ceinture(s)</small></div>`;}
 h+=`<button class="btn ${s?'':'or'}" id="bNouv">Nouvelle carrière</button><button class="btn fant" id="bNuage" style="display:none">☁ Reprendre la partie d'un autre appareil</button><button class="btn fant petit" id="bTest">🧪 Mode test</button>`;
 $('accBtns').innerHTML=h;
 if(s)$('bCont').onclick=()=>{G=M.charger(s);completer(G);lancer();};
 $('bNouv').onclick=nouvelle;$('bTest').onclick=modeTest;
 if(NUAGE){NUAGE.get().then(m=>{if(m&&(!s||m.t>(s.savedAt||0)+60000)){const b=$('bNuage');if(!b)return;b.style.display='';b.textContent='☁ Reprendre la partie de l\'autre appareil ('+(m.nom||'')+', '+(m.date||'')+')';b.onclick=async()=>{b.disabled=true;const t=await NUAGE.full(m);if(t){G=M.charger(JSON.parse(t));completer(G);lancer();}else{toast('Lecture impossible');b.disabled=false;}};}});}
 if(ARENE_OK)fondAccueil(s);}
function dateDe(s){const an=s.an0+Math.floor((s.sem-1)/52),w=(s.sem-1)%52;return 'Semaine '+(w+1)+', '+an;}
function fondAccueil(sv){let O=ORGS[4];const mk=(i)=>({id:'acc'+i,sexe:'H',div:'mm',app:{peau:[1,4][i],chev:[2,0][i],cc:0,short:['#c1121f','#1d4ed8'][i],gant:'#111'}});let duo=[mk(0),mk(1)];
 if(sv){const ms=Object.values(sv.F).filter(f=>f.mine&&!f.ret&&f.org).sort((p,q)=>M.ORG(q.org).tier-M.ORG(p.org).tier);if(ms[0]){O=M.ORG(ms[0].org);duo[0]=ms[0];const adv=Object.values(sv.F).find(f=>f.org===ms[0].org&&f.div===ms[0].div&&!f.mine&&!f.ret);if(adv)duo[1]=adv;}}
 try{Arene.preparer(O,duo);Arene.demarrer();const st=Arene.ST;st.pos='S';st.dist=1.5;st.ang=.3;Arene.placer();Arene.cam('moyen');Arene.perso().forEach(h=>{h.idle=null;});
  clearInterval(fondAccueil.t);fondAccueil.t=setInterval(()=>{if($('accueil').classList.contains('cache')){clearInterval(fondAccueil.t);return;}const ks=['jab','cross','lowkick','feint','hook','bodykick','feint','combo'];const k=ks[Math.floor(Math.random()*ks.length)];Arene.action({k,a:Math.random()<.5?0:1,h:Math.random()<.6,z:k==='lowkick'?'jambe':k==='bodykick'?'corps':'tete',pos:'S'});},1500);}catch(e){console.error(e);}}
function nouvelle(){modal(`<h2>Nouvelle carrière</h2><p class="doux">Vous dirigez une petite écurie de MMA avec trois jeunes espoirs. Faites-les progresser, négociez leurs combats et menez-les des galas régionaux jusqu'au sommet du monde : l'APEX.</p>
 <label class="doux" style="font-size:12px">Nom de votre écurie</label><input id="iNom" value="Team Phénix" maxlength="28" style="width:100%;padding:12px;border-radius:10px;border:1px solid var(--bord);background:var(--p3);color:var(--txt);font:inherit;margin:6px 0 4px;user-select:text;-webkit-user-select:text">
 <div class="doux" style="font-size:12px;margin-top:10px">Difficulté</div><div class="choix" id="cDiff" style="margin-top:6px">${['Facile · 30 000 €','Normale · 15 000 €','Difficile · 8 000 €'].map((t,i)=>`<button data-k="${i}" class="${i===1?'on':''}">${t}</button>`).join('')}</div>
 <div class="btns"><button class="btn or" id="bGo">Ouvrir l'écurie</button></div>`);
 let df=1;$('cDiff').querySelectorAll('button').forEach(b=>b.onclick=()=>{df=+b.dataset.k;$('cDiff').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));});
 $('bGo').onclick=()=>{const n=($('iNom').value||'').trim()||'Team Phénix';fermerModal();G=M.nouvellePartie({nom:n,diff:df});TEST=false;lancer(true);};}
function modeTest(){TEST=true;TK&&TK.modeTest();G=M.nouvellePartie({graine:7,nom:'Équipe Test'});lancer();toast('🧪 Mode test : rien n\'est sauvegardé');}
function completer(g){for(const id in g.F){const f=g.F[id];if(!f.clan)f.clan=CLANS[(id.length*7+(f.app?.seed||3))%CLANS.length];}g.offres=g.offres||[];g.news=g.news||[];g.aJouer=g.aJouer||[];g.trophees=g.trophees||[];g.stats=g.stats||{v:0,d:0,titres:0,bourses:0};
 g.spons=g.spons||[];g.succes=g.succes||{};g.prix=g.prix||[];g.hof=g.hof||[];g.gps=g.gps||[];if(g.gp===undefined)g.gp=null;g.coachs.recruteur=g.coachs.recruteur||0;g.coachs.media=g.coachs.media||0;
 const tk=Object.keys(TRAITS).filter(k=>!['verre','fragile','tete_brulee'].includes(k));let h=7;
 for(const id in g.F){const f=g.F[id];if(!f.traits){h=(h*31+id.length+(f.app?.seed||1))%100003;f.traits=h%3===0?[]:[tk[h%tk.length]];}f.titres=f.titres||[];f.riv=f.riv||{};f.carr=f.carr||[];}}
function lancer(nouv){$('accueil').classList.add('cache');$('app').classList.remove('cache');Arene.arreter&&Arene.arreter();$('cv3d').style.display='none';VUE='ecurie';rendre();sauver();
 if(nouv)setTimeout(()=>modal(`<h2>Bienvenue, patron</h2><p>Chaque semaine :</p><ul style="padding-left:18px;line-height:1.6"><li><b>Entraînez</b> vos combattants (fiche → programme et intensité).</li><li><b>Acceptez les combats</b> proposés dans 📨 Offres : regardez les chances estimées.</li><li>Les soirs de combat, <b>regardez-les en 3D</b> et donnez vos consignes entre les rounds.</li><li>Gagnez pour <b>monter de ligue</b> : CFR → HEX → ECC → GLADIUS → APEX. Trop de défaites et l'organisation vous libère.</li><li>Vous touchez ${Math.round(M.COMM*100)} % des bourses, plus les cotisations de la salle.</li></ul><div class="btns"><button class="btn or" onclick="fermerModal()">C'est parti</button></div>`),300);}
/* ---------- rendu général ---------- */
const VUES=[['ecurie','🏠','Écurie'],['combattants','🥊','Combattants'],['ligues','🏆','Ligues'],['salle','🏋️','Salle'],['offres','📨','Offres']];
function rendre(){if(!G)return;
 $('haut').innerHTML=`<div><div class="logo">CAGE <b>&amp;</b> GLOIRE</div><div class="h-ecurie">${esc(G.nom)}${TEST?' · 🧪 test':''}</div></div><div class="h-esp"></div>
 <div><div class="h-arg ${G.argent<0?'neg':''}">${fE(G.argent)}</div><div class="h-date">${M.date()}</div></div><button class="h-menu" id="bMenu">☰</button>`;
 $('bMenu').onclick=menu;
 const nOff=G.offres.length;
 $('nav').innerHTML=VUES.map(([k,i,n])=>`<button data-v="${k}" class="${VUE===k?'on':''}"><i>${i}</i>${n}${k==='offres'&&nOff?`<span class="badge">${nOff}</span>`:''}</button>`).join('');
 $('nav').querySelectorAll('button').forEach(b=>b.onclick=()=>{VUE=b.dataset.v;rendre();$('vue').scrollTop=0;});
 const f={ecurie:vEcurie,combattants:vCombattants,ligues:vLigues,salle:vSalle,offres:vOffres}[VUE];$('vue').innerHTML=f();brancher($('vue'));
 // barre d'action
 if(G.aJouer.length){$('barreAction').innerHTML=`<button class="btn rouge" id="bSoir" style="font-family:var(--t);font-size:22px;letter-spacing:.05em">🥊 Soirée de combat : entrer dans la cage</button>`;$('bSoir').onclick=()=>preCombat(G.aJouer[0]);}
 else{$('barreAction').innerHTML=`<button class="btn fant" id="bAuto" title="Avancer jusqu'au prochain événement">⏩</button><button class="btn or" id="bSem">Semaine suivante ▶</button>`;$('bSem').onclick=()=>avancer(1);$('bAuto').onclick=()=>avancer(12);}}
function brancher(el){el.querySelectorAll('[data-f]').forEach(x=>x.onclick=e=>{e.stopPropagation();fiche(x.dataset.f);});
 el.querySelectorAll('[data-act]').forEach(x=>x.onclick=e=>{e.stopPropagation();ACT[x.dataset.act](x.dataset.x,x);});
 el.querySelectorAll('[data-trait]').forEach(x=>x.onclick=e=>{e.stopPropagation();const t=TRAITS[x.dataset.trait];toast(t.ic+' '+t.n+' : '+t.d,3500);});}
const ACT={
 accC:id=>{M.accepterCombat(id);toast('Combat accepté ✍️');sauver();rendre();},
 refO:id=>{M.refuser(id);sauver();rendre();},
 accK:id=>{const o=G.offres.find(x=>x.id===id);M.accepterContrat(id);toast('Contrat signé 🖊️');sauver();rendre();if($('modal').innerHTML&&!$('modal').classList.contains('cache'))fermerModal();},
 org:id=>{SEL.org=id;rendre();},div:id=>{SEL.div=id;rendre();},
 salle:()=>{if(M.ameliorerSalle()){toast('Travaux terminés ! 🏗️');sauver();rendre();}else toast('Pas assez d\'argent');},
 coach:(x)=>{const [k,d]=x.split(':');M.coach(k,G.coachs[k]+(+d));sauver();rendre();},
 signer:id=>{const f=G.F[id];if(M.mes().length>=M.SALLES[G.salle.niv].cap){toast('Salle pleine : agrandissez-la');return;}if(G.argent<f.prime){toast('Pas assez d\'argent');return;}M.signer(id);toast(nomC(f)+' rejoint l\'écurie !');sauver();rendre();},
 voirOff:()=>{VUE='offres';rendre();},tri:x=>{SEL.tri=x;rendre();},
 pre:cid=>preCombat(cid),
 nego:x=>{const [id,p]=x.split(':');const r=M.negocier(id,+p);if(!r)return;toast(r.ok?'Accepté ! L\'offre est revalorisée 💪':r.retire?'Vexée, l\'organisation retire son offre…':'Refusé : l\'offre reste sur la table.',3000);COTEvider();sauver();rendre();},
 cat:x=>{const [id,d]=x.split(':');const f=G.F[id];const v=M.categorieVoisine(f,+d);modal(`<h2>Changer de catégorie ?</h2><p>${esc(nomC(f))} passera en <b>${v.nom}</b> (${v.kg} kg).</p><p class="doux">${+d>0?'Moins de puissance relative, mais plus de cardio.':'Coupe de poids éprouvante : cardio en baisse, fatigue, mais il sera plus lourd que ses adversaires.'} Son classement repart du bas${estChamp(f)?' et il laisse sa ceinture':''}.</p><div class="btns"><button class="btn or" id="bCat">Confirmer</button><button class="btn" onclick="fiche('${id}')">Annuler</button></div>`);$('bCat').onclick=()=>{M.changerCategorie(id,+d);sauver();fiche(id);rendre();};},
 lv:x=>{SEL.lv=x;rendre();},
 camp:x=>{const [cid,k]=x.split(':');if(M.acheterCamp(cid,k)){toast('Camp réservé ✅');COTEvider();sauver();if(!$('modal').classList.contains('cache')&&$('pPlans'))preCombat(cid);else rendre();}else toast('Pas assez d\'argent');},
 sponsor:()=>{},
 autoTous:x=>{M.mes().forEach(f=>f.train.auto=x==='1');toast(x==='1'?'Le staff gère l\'entraînement de tous 🤖':'À vous de jouer');sauver();rendre();},
 gala:()=>{const e=M.organiserGala();if(e){toast('Gala programmé ! 🎪');sauver();VUE='ecurie';rendre();}else toast('Impossible pour le moment');},
 pre2:cid=>{const t=M.trouverCombat(cid);if(t&&t.c.ok)preparerCamp(cid);},
 voirGP:()=>{VUE='ligues';SEL.lv='gp';rendre();},voirPrix:()=>{VUE='ligues';SEL.lv='prix';rendre();}
};
/* ---------- vue Écurie ---------- */
function affiche(c,e,o={}){const A=G.F[c.a],B=G.F[c.b],O=OE(e);
 return `<div class="affiche" ${o.click?`data-act="${o.act||'pre'}" data-x="${c.id}"`:''}><div class="fond" style="background:radial-gradient(circle at 50% 120%,${O.c1}55,transparent 60%),linear-gradient(115deg,#7a0d18 0%,#16070a 48%,#06102a 52%,#0b2a7a 100%)"></div>
 <div class="bandeau"><span style="width:30px;height:30px;display:inline-block">${embleme(O)}</span><b class="t" style="font-size:20px">${e.nom}</b><span class="doux">${esc(e.ville)} · ${M.date(e.sem)}</span>${c.titre?`<span class="puce" style="margin-left:auto;background:#3a2c08;border-color:#e9c46a;color:#ffe39a">${ceinture()} TITRE</span>`:c.gp!=null?`<span class="puce" style="margin-left:auto;background:#3a0a10;border-color:#ff5a66;color:#ffc4c9">🏆 GRAND PRIX · ${['QUART','DEMIE','FINALE'][Math.min(2,c.gp)]}</span>`:c.rival?'<span class="puce" style="margin-left:auto;background:#3a1408;border-color:#ff8a3a;color:#ffd0b0">😠 REVANCHE</span>':c.main?'<span class="puce" style="margin-left:auto">TÊTE D\'AFFICHE</span>':''}</div>
 <div class="duo"><div class="por" data-f="${A.id}">${Portrait.svg(A,{nobg:true,rim:'#ff4d5e'})}</div><div class="vs">VS</div><div class="por" data-f="${B.id}" style="transform:scaleX(-1)">${Portrait.svg(B,{nobg:true,rim:'#5aa0ff'})}</div></div>
 <div class="noms"><div>${flag(A.pays)} ${esc(nomC(A))}<small>${rec(A)} · ${M.rangTxt(A)} · note ${M.ov(A)}</small></div><div>${esc(nomC(B))} ${flag(B.pays)}<small>${rec(B)} · ${M.rangTxt(B)} · note ${M.ov(B)}</small></div></div></div>`;}
function vEcurie(){const ms=M.mes();const S=M.SALLES[G.salle.niv];let h='';
 // soirée à jouer / prochain combat
 const aj=G.aJouer[0];if(aj){const t=M.trouverCombat(aj);h+=`<div class="sec">CE SOIR</div>`+affiche(t.c,t.e,{click:1});}
 else{const pe=M.prochainEvent();if(pe){const c=pe.combats.find(c=>c.mine&&c.ok);h+=`<div class="sec">PROCHAIN COMBAT · dans ${pe.sem-G.sem} sem. · touchez pour préparer le camp</div>`+affiche(c,pe,{click:1,act:'pre2'});}
  else h+=`<div class="carte" style="text-align:center"><h3 style="justify-content:center">Aucun combat programmé</h3><p class="doux">Les organisations vous proposent des combats dans l'onglet Offres.</p>${G.offres.length?`<button class="btn or petit" data-act="voirOff">Voir les ${G.offres.length} offre(s)</button>`:''}</div>`;}
 const bilan=(G.semRec||0)-(G.semDep||0);
 h+=`<div class="sec">L'ÉCURIE</div><div class="kpi"><div><b class="${G.argent<0?'neg':''}">${fE(G.argent)}</b><span>Trésorerie</span></div><div><b class="${bilan>=0?'pos':'neg'}">${bilan>=0?'+':''}${fE(bilan)}</b><span>Bilan / semaine</span></div><div><b>${G.salle.membres}</b><span>Adhérents</span></div>
 <div><b>${G.stats.v}-${G.stats.d}</b><span>Bilan des combats</span></div><div><b class="or-t">${G.stats.titres}</b><span>Ceintures gagnées</span></div><div><b>${Math.round(G.salle.rep)}</b><span>Réputation</span></div></div>`;
 // calendrier des 8 prochaines semaines
 const cal=G.ev.filter(e=>!e.fait&&e.sem>=G.sem&&e.sem<=G.sem+8).sort((a,b)=>a.sem-b.sem);
 if(cal.length)h+=`<div class="sec">CALENDRIER</div><div class="cal">${cal.slice(0,7).map(e=>{const O=OE(e);const mc=e.combats.find(c=>c.mine&&(c.ok||G.offres.some(o=>o.c===c.id)));const f=mc&&G.F[mc.a];
  return `<div class="${mc&&mc.ok?'moi':''}" ${mc?`data-act="${mc.ok?'pre2':'voirOff'}" data-x="${mc.id}"`:''}><span class="doux">${e.sem===G.sem?'Cette sem.':'Dans '+(e.sem-G.sem)+' sem.'}</span><span>${e.maison?'<span class="orgb" style="background:#3a1d08;color:#e9c46a">GALA</span>':orgB(e.org)} <b>${e.nom}</b> · ${esc(e.ville)}</span><span>${mc?(mc.ok?'🥊 '+esc(f.nom):'📨 '+esc(f.nom)):e.combats.some(c=>c.titre)?ceinture(O.c1):''}</span></div>`;}).join('')}</div>`;
 if(G.gp){const gp=G.gp;const m=gp.ids.filter(id=>G.F[id]&&G.F[id].mine);h+=`<div class="carte" style="margin-top:10px;cursor:pointer" data-act="voirGP"><h3>🏆 ${esc(gp.nom)} <small>${M.DIV(gp.div).nom}</small></h3><div class="doux" style="font-size:12.5px">${['Quarts','Demies','Finale'][Math.min(2,gp.ronde)]} · ${gp.vivants.length} en lice${m.length?' · vos combattants : '+m.map(id=>esc(G.F[id].nom)+(gp.vivants.includes(id)?' ✅':' ❌')).join(', '):''}</div></div>`;}
 const sp=(G.spons||[]);if(sp.length)h+=`<div class="sec">SPONSORS · ${fE(sp.reduce((a,x)=>a+x.hebdo,0))} / sem.</div><div class="carte">${sp.map(x=>`<div class="ligne" style="padding:4px 0;font-size:13px">🤝 <b>${esc(x.nom)}</b><span class="doux">${G.F[x.f]?esc(nomC(G.F[x.f])):''}</span><span style="margin-left:auto">${fE(x.hebdo)}/sem. · +${fE(x.bonusV)}/victoire · fin ${M.date(x.fin).split(' · ')[0]}</span></div>`).join('')}</div>`;
 if(G.obj)h+=`<div class="sec">OBJECTIFS ${G.obj.an}</div><div class="carte">${G.obj.L.map(o=>{const D=M.OBJ.find(x=>x.id===o.id);const cible=D&&D.cible1?1:o.c;const pr=Math.min(1,(o.prog||0)/cible);
  return `<div style="padding:6px 0"><div class="ligne"><span>${o.ok?'✅':'🎯'} ${esc(o.n)}</span><b style="margin-left:auto" class="${o.ok?'pos':'or-t'}">${o.ok?'atteint':'+'+fE(o.r)}</b></div><div class="barre" style="margin-top:5px"><i style="width:${pr*100}%;background:${o.ok?'#2fbf71':'#e9c46a'}"></i></div></div>`;}).join('')}</div>`;
 h+=`<div class="sec">MES COMBATTANTS · ${ms.length}/${S.cap}</div>`+ms.sort((a,b)=>M.ov(b)-M.ov(a)).map(ligneF).join('');
 h+=`<div class="carte" style="margin-top:10px;cursor:pointer" data-act="voirPrix"><h3>🎖️ Succès <small>${Object.keys(G.succes||{}).length}/${M.SUCCES.length}</small></h3><div class="barre"><i style="width:${Object.keys(G.succes||{}).length/M.SUCCES.length*100}%;background:var(--or)"></i></div></div>`;
 if(G.trophees.length)h+=`<div class="sec">SALLE DES TROPHÉES</div><div class="carte"><div style="display:flex;flex-wrap:wrap;gap:10px">${G.trophees.slice().reverse().map(t=>{const O=ORGc(t.org),f=G.F[t.f];return `<div style="text-align:center;width:88px">${ceinture(O.c1)}<div class="t" style="font-size:15px">${O.court}</div><div style="font-size:11px" class="doux">${f?esc(f.nom):''} · ${M.DIV(t.div).kg} kg</div></div>`;}).join('')}</div></div>`;
 h+=`<div class="sec">ACTUALITÉS</div><div class="carte news">${G.news.slice(0,14).map(n=>`<div><i>${n.ic}</i><span>${esc(n.t)}</span><small>S${(n.s-1)%52+1}</small></div>`).join('')}</div>`;
 return h;}
function ligneF(f){const O=f.org?ORGc(f.org):null;const ch=estChamp(f);const pc=f.prochain&&M.trouverCombat(f.prochain);const etat=f.bless>0?`<span class="puce" style="color:#ff9aa2">🚑 ${f.bless} sem.</span>`:pc&&pc.c.ok?'<span class="puce">📅 combat le '+M.date(pc.e.sem).split(' · ')[0].replace('Sem. ','S')+'</span>':pc?'<span class="puce" style="color:#ffe39a">📨 offre</span>':'';
 return `<div class="fl ${f.mine?'moi':''}" data-f="${f.id}"><div class="por">${por(f,{mini:1})}</div><div style="min-width:0"><div class="nm">${flag(f.pays)} ${esc(nomC(f))} ${ch?ceinture(O.c1):''}</div>
 <div class="sm">${M.DIV(f.div).nom} · ${STYLES[f.style].ic} ${STYLES[f.style].nom}</div><div class="sm" style="margin-top:3px;display:flex;gap:6px;flex-wrap:wrap;align-items:center">${orgB(f.org)} <b style="color:var(--txt)">${rec(f)}</b> ${M.rangTxt(f)} ${etat}</div>
 ${f.mine?`<div style="display:flex;gap:6px;align-items:center;margin-top:5px;font-size:10px" class="doux">Forme<div class="barre" style="flex:1;max-width:90px"><i style="width:${f.forme}%;background:${f.forme>75?'#2fbf71':f.forme>55?'#f0a23a':'#e63946'}"></i></div>${M.FOCUS[f.train.f].ic} ${M.FOCUS[f.train.f].n}${f.train.auto?' 🤖':''}</div>`:''}</div>
 <div class="note"><b style="color:${noteCol(M.ov(f))}">${M.ov(f)}</b><span>NOTE</span><div class="etoiles" style="font-size:9px">${etoiles(f)}</div></div></div>`;}
/* ---------- vue Combattants ---------- */
function vCombattants(){const ms=M.mes();const S=M.SALLES[G.salle.niv];
 let h=`<div class="titreVue"><h1>Mes combattants</h1><small>${ms.length}/${S.cap} places</small></div><div style="display:flex;gap:8px;margin:-4px 0 12px"><button class="btn petit" data-act="autoTous" data-x="1">🤖 Tout confier au staff</button><button class="btn petit fant" data-act="autoTous" data-x="0">Reprendre la main</button></div>`;
 h+=ms.sort((a,b)=>M.ov(b)-M.ov(a)).map(ligneF).join('')||'<p class="doux">Personne… recrutez dans l\'onglet Salle.</p>';
 {const L=[];for(const id in G.F){const f=G.F[id];if(!f.mine&&!(f.ret&&f.histo.length&&f.mg))continue;for(const x of f.histo)L.push([x,f]);}L.sort((a,b)=>b[0].s-a[0].s);
  if(L.length)h+=`<div class="sec">DERNIERS COMBATS DE L'ÉCURIE</div><div class="carte histo">${L.slice(0,12).map(([x,f])=>`<div data-f="${f.id}"><span class="vd ${x.r}">${x.r}</span><span><b>${esc(f.nom)}</b> ${x.r==='V'?'bat':x.r==='D'?'perd contre':'nul avec'} ${flag(x.ap)} ${esc(x.an)} ${x.titre?ceinture():''}<br><small class="doux">${x.ev} · ${ISSUES[x.m]}${['ko','tko','sub'].includes(x.m)?' R'+x.rd:''} · ${M.date(x.s).split(' · ')[1]}</small></span><span></span></div>`).join('')}</div>`;}
 h+=`<div class="sec">RECRUTEMENT · AGENTS LIBRES</div><p class="doux" style="margin-top:-4px;font-size:12px">Renouvelé tous les mois. La prime de signature est payée une fois ; l'organisation la plus adaptée lui propose ensuite un contrat.</p>`;
 h+=G.recrues.map(id=>G.F[id]).filter(Boolean).map(f=>`<div class="fl" data-f="${f.id}"><div class="por">${por(f,{mini:1})}</div><div style="min-width:0;flex:1"><div class="nm">${flag(f.pays)} ${esc(nomC(f))}</div><div class="sm">${Math.floor(f.age)} ans · ${M.DIV(f.div).nom} · ${STYLES[f.style].ic} ${STYLES[f.style].nom} · ${rec(f)}</div>
 <div class="sm">Potentiel <span class="etoiles">${etoiles(f)}</span></div><button class="btn vert petit" style="margin-top:6px" data-act="signer" data-x="${f.id}">Signer · ${fE(f.prime)}</button></div><div class="note"><b style="color:${noteCol(M.ov(f))}">${M.ov(f)}</b><span>NOTE</span></div></div>`).join('');
 return h;}
/* ---------- fiche combattant ---------- */
function radar(f){const A=ATTRS,n=A.length,c=90,r=70;const pt=(i,v)=>{const a=-Math.PI/2+i/n*Math.PI*2;return [c+Math.cos(a)*r*v/100,c+Math.sin(a)*r*v/100];};
 const poly=A.map(([k],i)=>pt(i,f.at[k]).join(',')).join(' ');const cap=A.map(([k],i)=>pt(i,Math.min(99,f.pot+(STYLES[f.style].b[k]||0)*.8)).join(',')).join(' ');
 return `<svg viewBox="0 0 180 180" style="width:100%;max-width:240px">${[25,50,75,100].map(v=>`<polygon points="${A.map((_,i)=>pt(i,v).join(',')).join(' ')}" fill="none" stroke="#2c2f3b"/>`).join('')}
 <polygon points="${cap}" fill="none" stroke="#e9c46a" stroke-dasharray="3 3" opacity=".6"/><polygon points="${poly}" fill="rgba(230,57,70,.35)" stroke="#ff5a66" stroke-width="2"/>
 ${A.map(([k,l],i)=>{const [x,y]=pt(i,122);return `<text x="${x}" y="${y+3}" text-anchor="middle" font-size="9" fill="#9a9caa">${l.split(' ')[0]}</text>`;}).join('')}</svg>`;}
function fiche(id){const f=G.F[id];if(!f)return;const O=f.org?ORGc(f.org):null;const ch=estChamp(f);const r=M.rang(f);
 let h=`<button class="fermer" onclick="fermerModal()">✕</button><div class="fiche"><div class="fiche-tete"><div class="por">${por(f)}</div><div>
 ${f.sur?`<div class="fiche-sur">« ${esc(f.sur)} »</div>`:''}<div class="fiche-nom">${esc(f.pr)}<br>${esc(f.nom)}</div>
 <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;align-items:center">${flag(f.pays)} <span class="doux">${PAYS[f.pays].lib} · ${Math.floor(f.age)} ans · ${f.mine?esc(G.nom):esc(f.clan||'')}</span></div>
 <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;align-items:center">${orgB(f.org)} ${ch?`<span class="puce" style="background:#3a2c08;border-color:#e9c46a;color:#ffe39a">${ceinture(O.c1)} CHAMPION</span>`:`<span class="puce">${M.rangTxt(f)}</span>`}</div></div></div>
 <div class="carte"><div class="ligne" style="justify-content:space-between"><div><div class="rec">${rec(f)}</div><div class="doux" style="font-size:12px">${f.ko} KO/TKO · ${f.sub} soum. · ${f.dec} déc. · série ${f.serie>0?'+'+f.serie:f.serie}</div></div>
 <div class="note" style="text-align:center"><b style="color:${noteCol(M.ov(f))};font-size:44px">${M.ov(f)}</b><span>NOTE GLOBALE</span><div class="etoiles">${etoiles(f)}</div></div></div>
 <div class="doux" style="font-size:12px;margin-top:6px">${M.DIV(f.div).nom} (${M.DIV(f.div).kg} kg) · ${STYLES[f.style].ic} ${STYLES[f.style].nom} · popularité ${Math.round(f.pop)}</div>${(f.traits||[]).length?`<div class="traits">${traitsH(f)}</div>`:''}${(f.titres||[]).length||(f.trophees||[]).length?`<div class="traits">${(f.titres||[]).map(t=>`<span class="trait or">🏆 ${t}</span>`).join('')}${(f.trophees||[]).map(t=>`<span class="trait or">🏅 ${esc(t)}</span>`).join('')}</div>`:''}</div>
 <div class="grille g2"><div class="carte"><h3>Qualités</h3>${ATTRS.map(([k,l])=>{const v=Math.round(f.at[k]);return `<div class="attr"><span>${l}</span><div class="barre"><i style="width:${v}%;background:linear-gradient(90deg,${noteCol(v)}88,${noteCol(v)})"></i></div><b style="color:${noteCol(v)}">${v}</b></div>`;}).join('')}</div>
 <div class="carte" style="display:flex;align-items:center;justify-content:center">${radar(f)}</div></div>`;
 if(f.mine){h+=`<div class="carte"><h3>État physique</h3>${[['Forme',f.forme,'#2fbf71'],['Fatigue',f.fat,'#e63946'],['Moral',f.moral,'#3d7bff']].map(([l,v,c])=>`<div class="attr"><span>${l}</span><div class="barre"><i style="width:${v}%;background:${c}"></i></div><b>${Math.round(v)}</b></div>`).join('')}
  ${f.bless>0?`<p style="color:#ff9aa2">🚑 ${esc(f.blessT||'Blessé')} : encore ${f.bless} semaine(s).</p>`:''}</div>
  <div class="carte"><h3>Progression</h3>${courbe(f)}</div>
  <div class="carte"><h3>Programme d'entraînement <small><button class="btn petit ${f.train.auto?'vert':'fant'}" id="bAuto">🤖 ${f.train.auto?'Le staff gère':'Confier au staff'}</button></small></h3>${f.train.auto?'<p class="doux" style="font-size:12px;margin-top:0">Le staff choisit chaque semaine le programme (point faible) et l\'intensité (fatigue, combat proche). Touchez un programme pour reprendre la main.</p>':''}<div class="choix" id="cFocus">${Object.entries(M.FOCUS).map(([k,x])=>`<button data-k="${k}" class="${f.train.f===k?'on':''}">${x.ic} ${x.n}</button>`).join('')}</div>
  <div class="doux" style="font-size:12px;margin:10px 0 6px">Intensité</div><div class="choix" id="cInt">${M.INTENS.map((x,i)=>`<button data-k="${i}" class="${f.train.i===i?'on':''}">${['🟢','🟠','🔴'][i]} ${x.n}</button>`).join('')}</div>
  <p class="doux" style="font-size:12px;margin-bottom:0">${conseil(f)}</p></div>
  <div class="carte"><h3>Contrats</h3><div style="margin-bottom:8px">🤝 Management : <b>${Math.round(M.pctF(f)*100)} %</b> de ses bourses pour l'écurie${f.mg?` · jusqu'à la ${M.date(f.mg.fin)}`:''}</div>${f.ctr&&f.org?`${orgB(f.org)} ${O.nom} · encore <b>${Math.max(0,f.ctr.rest)}</b> combat(s)${f.ctr.show?` · bourse ${fE(f.ctr.show)} + ${fE(f.ctr.show)} si victoire`:''}`:'<span class="doux">Sans contrat : en attente d\'une offre.</span>'}
  ${(G.spons||[]).filter(sp=>sp.f===f.id).map(sp=>`<div class="doux" style="font-size:12px;margin-top:6px">🤝 Sponsor ${esc(sp.nom)} : ${fE(sp.hebdo)}/sem. jusqu'à la ${M.date(sp.fin)}</div>`).join('')}</div>
  <div class="carte"><h3>Catégorie de poids</h3><p class="doux" style="font-size:12px;margin-top:0">Monter coûte un peu de puissance ; descendre coûte du cardio et fatigue. Le classement repart du bas et une ceinture est abandonnée.</p>
  <div style="display:flex;gap:8px;flex-wrap:wrap">${[[-1,'⬇️'],[1,'⬆️']].map(([d,ic])=>{const v=M.categorieVoisine(f,d);return v?`<button class="btn petit" data-act="cat" data-x="${f.id}:${d}" ${f.prochain?'disabled':''}>${ic} ${v.nom} (${v.kg} kg)</button>`:'';}).join('')}</div></div>
  ${Object.keys(f.riv||{}).filter(id=>G.F[id]).length?`<div class="carte"><h3>Rivaux</h3>${Object.keys(f.riv).filter(id=>G.F[id]).map(id=>{const x=G.F[id];return `<div class="ligne" style="padding:4px 0" data-f="${id}">😠 ${flag(x.pays)} <b>${esc(nomC(x))}</b> <span class="doux">${rec(x)} · ${orgB(x.org)}</span></div>`;}).join('')}<p class="doux" style="font-size:12px;margin-bottom:0">Les organisations aiment programmer les revanches : bourse majorée.</p></div>`:''}
  <div class="carte"><button class="btn petit fant" id="bLib">Rompre avec ce combattant</button></div>`;}
 else if(f.libre)h+=`<div class="carte"><h3>Agent libre</h3><p>Prime de signature : <b>${fE(f.prime)}</b></p><p class="doux" style="font-size:12px">Potentiel estimé par votre recruteur : ${f.potVu??f.pot} (${['±12','±8','±4','±1'][G.coachs.recruteur||0]})</p><button class="btn vert" data-act="signer" data-x="${f.id}">Signer dans l'écurie</button></div>`;
 h+=`<div class="carte"><h3>Derniers combats</h3><div class="histo">${f.histo.slice(0,12).map(x=>`<div><span class="vd ${x.r}">${x.r}</span><span>${flag(x.ap)} ${esc(x.an)} ${x.titre?ceinture():''}<br><small class="doux">${x.ev} · ${ISSUES[x.m]}${['ko','tko','sub'].includes(x.m)?' R'+x.rd+' '+x.t:''}${x.tech?' ('+esc(x.tech)+')':''}</small></span>${x.adv&&G.F[x.adv]?`<button class="btn petit fant" data-f="${x.adv}">👁</button>`:'<span></span>'}</div>`).join('')||'<p class="doux">Aucun combat professionnel pour l\'instant.</p>'}</div></div></div>`;
 modal(h,true);
 if(f.mine){$('cFocus').querySelectorAll('button').forEach(b=>b.onclick=()=>{f.train.f=b.dataset.k;f.train.auto=false;sauver();fiche(id);rendre();});
  $('cInt').querySelectorAll('button').forEach(b=>b.onclick=()=>{f.train.i=+b.dataset.k;f.train.auto=false;sauver();fiche(id);rendre();});
  $('bAuto').onclick=()=>{f.train.auto=!f.train.auto;sauver();fiche(id);rendre();};
  $('bLib').onclick=()=>modal(`<h2>Rompre ?</h2><p>${esc(nomC(f))} quittera définitivement votre écurie.</p><div class="btns"><button class="btn rouge" id="bOui">Oui, rompre</button><button class="btn" onclick="fiche('${id}')">Annuler</button></div>`)||($('bOui').onclick=()=>{M.liberer(id);fermerModal();sauver();rendre();});}
 brancher($('modal'));}
function conseil(f){const a=f.at,s=f.style;const fai=ATTRS.map(([k])=>k).filter(k=>k!=='menton').sort((x,y)=>a[x]-a[y])[0];
 const nom={frappe:'pieds-poings',puiss:'physique',def:'pieds-poings',lutte:'lutte',sol:'jiu-jitsu',cardio:'physique'}[fai];
 if(f.fat>70)return '🩺 Le staff conseille du repos : la fatigue augmente fortement le risque de blessure.';
 if(f.prochain)return '📅 Combat en vue : une intensité normale garde la forme pour le jour J.';
 return '🧠 Point faible : '+ATTRS.find(x=>x[0]===fai)[1].toLowerCase()+' ('+Math.round(a[fai])+'). Programme conseillé : '+nom+'.';}
/* ---------- vue Ligues ---------- */
function segLigues(){const L=[['org','Organisations'],['p4p','Top 15'],['gp','Grand Prix'],['prix','Palmarès']];SEL.lv=SEL.lv||'org';
 return `<div class="seg">${L.map(([k,n])=>`<button class="${SEL.lv===k?'on':''}" data-act="lv" data-x="${k}">${n}</button>`).join('')}</div>`;}
function vP4P(){const L=M.p4p(15);return `<div class="carte" style="padding:6px 10px"><h3 style="padding:8px 0 0">Classement toutes catégories <small>tous combattants, toutes organisations</small></h3>${L.map((f,i)=>{const O=ORGc(f.org);const c=estChamp(f);
 return `<div class="rang ${f.mine?'moi':''}" data-f="${f.id}"><div class="n" style="${i<3?'color:var(--or)':''}">${i+1}</div><div class="p">${Portrait.svg(f,{mini:1,bg:O.c2})}</div><div style="min-width:0"><div style="font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${flag(f.pays)} ${esc(nomC(f))} ${c?ceinture(O.c1):''}</div><div class="doux" style="font-size:12px">${orgB(f.org)} ${M.DIV(f.div).nom.replace('Poids ','')} · ${rec(f)}</div></div><div class="note"><b style="color:${noteCol(M.ov(f))};font-size:24px">${M.ov(f)}</b></div></div>`;}).join('')}</div>`;}
function vGP(){const gp=G.gp;let h='';
 if(gp){const O=ORGc(gp.org);const tour=['Quarts de finale','Demi-finales','Finale'];
  h+=`<div class="carte" style="background:linear-gradient(120deg,${O.c2},#0d0d12 70%);border-color:${O.c1}66"><div class="orghead"><div style="width:64px;height:64px;flex:0 0 auto">${embleme(O)}</div><div><h2 style="font-size:28px;line-height:1">${esc(gp.nom)}</h2><div class="doux">${M.DIV(gp.div).nom} · prime ${fE(gp.prix)} · ${tour[Math.min(2,gp.ronde)]}${gp.reserve?' programmés':' dans '+Math.max(0,gp.prochain-G.sem)+' sem.'}</div></div></div></div>`;
  const el=gp.elim||{};const atteint=(id,r)=>r===0||(el[id]!=null?el[id]>=r:gp.vivants.includes(id)&&gp.ronde>=r);
  h+=`<div class="tableau">`+[0,1,2].map(r=>`<div class="tcol"><div class="ttit">${['QUARTS','DEMIES','FINALE'][r]}</div>${gp.ids.filter(id=>atteint(id,r)).map(id=>{const f=G.F[id];if(!f)return '';const out=el[id]===r;return `<div class="tcase ${f.mine?'moi':''} ${out?'out':''}" data-f="${id}">${flag(f.pays)} ${esc(f.nom)}</div>`;}).join('')}</div>`).join('')+`</div>`;}
 else h+=`<div class="carte doux">Aucun Grand Prix en cours. Chaque année, à la semaine 8, ECC ou GLADIUS lance un tournoi à huit dans une catégorie. Placez un combattant dans le top 8 pour y être invité !</div>`;
 const P=(G.gps||[]).slice().reverse();if(P.length)h+=`<div class="sec">VAINQUEURS</div><div class="carte">${P.map(x=>`<div class="ligne" style="padding:5px 0;border-bottom:1px solid #20232c" ${G.F[x.v]?`data-f="${x.v}"`:''}>🏆 <b>${esc(x.nom)}</b><span class="doux" style="margin-left:auto">${esc(x.vn)}${G.F[x.v]&&G.F[x.v].mine?' ⭐':''}</span></div>`).join('')}</div>`;
 return h;}
function vPrix(){let h='';const S=M.SUCCES;const ok=Object.keys(G.succes||{}).length;
 h+=`<div class="sec">SUCCÈS · ${ok}/${S.length}</div><div class="grille g2">${S.map(x=>{const d=(G.succes||{})[x.id];return `<div class="fl" style="cursor:default;${d?'':'opacity:.45'}"><div style="font-size:26px;width:36px;text-align:center">${d?'🎖️':'🔒'}</div><div><div class="nm">${x.n}</div><div class="sm">${x.d}</div></div></div>`;}).join('')}</div>`;
 const P=(G.prix||[]).slice().reverse();h+=`<div class="sec">PRIX DE FIN D'ANNÉE</div>`+(P.length?P.map(p=>`<div class="carte" style="margin-bottom:8px"><h3>${p.an}</h3>${[['cdla','🥇 Combattant de l\'année'],['ko','💥 KO de l\'année'],['rev','🌱 Révélation']].map(([k,l])=>p[k]?`<div class="ligne" style="padding:3px 0" ${G.F[p[k].f]?`data-f="${p[k].f}"`:''}><span>${l}</span><b style="margin-left:auto">${esc(p[k].n)}${G.F[p[k].f]&&G.F[p[k].f].mine?' ⭐':''}</b></div>`:'').join('')}</div>`).join(''):'<div class="carte doux">Décernés à la dernière semaine de chaque année.</div>');
 const H=G.hof||[];h+=`<div class="sec">TEMPLE DE LA RENOMMÉE</div>`+(H.length?`<div class="carte">${H.map(x=>`<div style="padding:6px 0;border-bottom:1px solid #20232c"><b>${flag(x.pays)} ${esc(x.n)}</b>${x.mine?' ⭐':''} <span class="doux">· ${x.rec} · intronisé en ${x.an}</span><div class="doux" style="font-size:12px">${x.titres.join(' · ')||'—'}</div></div>`).join('')}</div>`:'<div class="carte doux">Les grandes carrières y entrent à la retraite.</div>');
 return h;}
function vLigues(){if(SEL.lv&&SEL.lv!=='org')return segLigues()+({p4p:vP4P,gp:vGP,prix:vPrix}[SEL.lv])();const O=ORGc(SEL.org);const go=G.orgs[O.id];
 let h=segLigues()+`<div class="orgs">${ORGS.map(o=>`<button class="${o.id===O.id?'on':''}" data-act="org" data-x="${o.id}">${embleme(o)}<span>${o.court}</span></button>`).join('')}</div>`;
 h+=`<div class="carte" style="background:linear-gradient(120deg,${O.c2},#0d0d12 70%);border-color:${O.c1}55"><div class="orghead">${embleme(O,1)}<div><h2 style="font-size:30px;line-height:1">${O.nom}</h2><div style="color:${O.c1};font-family:var(--t);letter-spacing:.1em">${O.devise.toUpperCase()}</div>
 <div class="doux" style="font-size:12px;margin-top:4px">Niveau ${O.tier+1}/5 · un gala toutes les ${O.freq} semaines · bourses dès ${fE(O.show*.55)}</div></div></div></div>`;
 h+=`<div class="onglets" style="margin-top:12px">${DIVS.map(d=>`<button class="${SEL.div===d.id?'on':''}" data-act="div" data-x="${d.id}">${d.nom.replace('Poids ','')} · ${d.kg}</button>`).join('')}</div>`;
 const L=M.classement(O.id,SEL.div);const ch=go.ch[SEL.div];
 h+=`<div class="carte" style="padding:6px 10px">${L.map((f,i)=>{const c=f.id===ch;const n=c?ceinture(O.c1):(ch?i:i+1);
  const fl=(f.rp0!=null&&f.rp!=null&&f.rp0!==f.rp&&!c)?(f.rp<f.rp0?'<i class="fl-up">▲</i>':'<i class="fl-dn">▼</i>'):'';
  return `<div class="rang ${f.mine?'moi':''} ${c?'champ':''}" data-f="${f.id}"><div class="n">${n}${fl}</div><div class="p">${Portrait.svg(f,{mini:1,bg:O.c2})}</div><div style="min-width:0"><div style="font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${flag(f.pays)} ${esc(nomC(f))}${f.mine?' <span class="puce" style="color:var(--or)">VOUS</span>':''}</div>
  <div class="doux" style="font-size:12px">${rec(f)} · ${STYLES[f.style].ic} ${STYLES[f.style].nom} · ${f.serie>1?'🔥'+f.serie:f.serie<-1?'❄️'+(-f.serie):''}</div></div><div class="note"><b style="color:${noteCol(M.ov(f))};font-size:24px">${M.ov(f)}</b></div></div>`;}).join('')}</div>`;
 const evs=G.ev.filter(e=>e.org===O.id&&!e.fait).sort((a,b)=>a.sem-b.sem);
 if(evs.length)h+=`<div class="sec">PROCHAINS GALAS</div>`+evs.slice(0,3).map(e=>`<div class="carte" style="margin-bottom:8px"><h3>${e.nom} <small>${esc(e.ville)} · ${M.date(e.sem)}</small></h3>${e.combats.filter(c=>!c.res||!c.res.annule).map(c=>{const A=G.F[c.a],B=G.F[c.b];if(!A||!B)return '';return `<div style="display:grid;grid-template-columns:1fr auto 1fr;gap:6px;font-size:12.5px;padding:4px 0;border-bottom:1px solid #20232c"><span data-f="${A.id}" style="${A.mine?'color:var(--or);font-weight:700':''}">${flag(A.pays)} ${esc(A.nom)}</span><span class="doux">${c.titre?ceinture(O.c1):'vs'}</span><span data-f="${B.id}" style="text-align:right;${B.mine?'color:var(--or);font-weight:700':''}">${esc(B.nom)} ${flag(B.pays)}</span></div>`;}).join('')}</div>`).join('');
 const lig=((go.lig||{})[SEL.div]||[]).slice().reverse();if(lig.length)h+=`<div class="sec">LIGNÉE DES CHAMPIONS · ${M.DIV(SEL.div).nom.toUpperCase()}</div><div class="carte">${lig.slice(0,12).map(x=>`<div class="ligne" style="padding:4px 0;font-size:13px" ${G.F[x.id]?`data-f="${x.id}"`:''}>${ceinture(O.c1)} ${flag(x.p)} <b>${esc(x.n)}</b>${x.mine?' ⭐':''}<span class="doux" style="margin-left:auto">${M.date(x.s).split(' · ')[1]}</span></div>`).join('')}</div>`;
 // champions de l'organisation
 h+=`<div class="sec">CHAMPIONS ${O.court}</div><div class="grille g2">${DIVS.map(d=>{const c=G.F[go.ch[d.id]];if(!c)return `<div class="fl"><div class="sm">${d.nom} : titre vacant</div></div>`;return `<div class="fl ${c.mine?'moi':''}" data-f="${c.id}"><div class="por">${Portrait.svg(c,{mini:1,bg:O.c2,rim:O.c1})}</div><div><div class="sm">${d.nom}</div><div class="nm">${flag(c.pays)} ${esc(nomC(c))}</div><div class="sm">${rec(c)} · ${c.def||0} défense(s)</div></div><div class="note">${ceinture(O.c1)}</div></div>`;}).join('')}</div>`;
 return h;}
/* ---------- vue Salle ---------- */
function graphFin(){const H=G.hist.slice(-52);if(H.length<2)return '<p class="doux">Le graphique apparaîtra après quelques semaines.</p>';
 const vs=H.map(x=>x.a),mn=Math.min(0,...vs),mx=Math.max(1,...vs);const W=320,Hh=110;const px=i=>i/(H.length-1)*W,py=v=>Hh-8-(v-mn)/(mx-mn||1)*(Hh-16);
 const pts=H.map((x,i)=>px(i).toFixed(1)+','+py(x.a).toFixed(1)).join(' ');
 return `<svg viewBox="0 0 ${W} ${Hh}" class="graph" preserveAspectRatio="none"><defs><linearGradient id="gF" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9c46a" stop-opacity=".45"/><stop offset="1" stop-color="#e9c46a" stop-opacity="0"/></linearGradient></defs>
 ${mn<0?`<line x1="0" x2="${W}" y1="${py(0)}" y2="${py(0)}" stroke="#e63946" stroke-dasharray="4 4" opacity=".6"/>`:''}<polygon points="0,${Hh} ${pts} ${W},${Hh}" fill="url(#gF)"/><polyline points="${pts}" fill="none" stroke="#e9c46a" stroke-width="2.2" vector-effect="non-scaling-stroke"/></svg>
 <div class="ligne doux" style="font-size:11px;justify-content:space-between"><span>il y a ${H.length} sem.</span><span>min ${fE(Math.min(...vs))} · max ${fE(Math.max(...vs))}</span></div>`;}
function vSalle(){const S=M.SALLES[G.salle.niv],N=M.SALLES[G.salle.niv+1];
 let h=`<div class="titreVue"><h1>La salle</h1><small>${esc(G.nom)}</small></div>`;
 h+=`<div class="carte" style="background:linear-gradient(120deg,#2a2212,#12131a 70%)"><h3>🏟️ ${S.nom} <small>niveau ${G.salle.niv+1}/5</small></h3>
 <div class="kpi"><div><b>${S.cap}</b><span>Combattants max</span></div><div><b>×${S.mult.toFixed(2)}</b><span>Progression</span></div><div><b>${fE(S.loyer)}</b><span>Loyer / sem.</span></div></div>
 <div class="doux" style="font-size:12px;margin:8px 0">Adhérents : ${G.salle.membres} / ${S.membres} (12 € par semaine chacun). La réputation attire les adhérents : elle monte avec les victoires et les titres.</div>
 ${N?`<button class="btn or petit" data-act="salle" ${G.argent<N.prix?'disabled':''}>Agrandir : ${N.nom} · ${fE(N.prix)}</button>`:'<span class="puce or-t">Niveau maximal</span>'}</div>`;
 {const P=M.galaPossible();h+=`<div class="sec">ÉVÉNEMENTS</div><div class="carte" style="background:linear-gradient(120deg,#3a1d08,#12131a 70%);border-color:#6b5520"><h3>🎪 Organiser votre propre gala</h3><p class="doux" style="font-size:12.5px;margin-top:0">Vos combattants de CFR ou HEX (jusqu'à trois) affrontent des adversaires de leur niveau devant votre public, dans quatre semaines. Pas de bourse pour eux, mais toute la billetterie pour l'écurie, et un gros coup de pouce à la réputation. Un gala toutes les dix semaines au plus.</p>${P.ok?`<button class="btn or petit" data-act="gala">Organiser · ${fE(P.cout)}</button>`:`<span class="doux" style="font-size:12px">${esc(P.r)}</span>`}</div>`;}
 h+=`<div class="sec">LE STAFF</div>`+Object.entries(M.COACHS).map(([k,c])=>{const n=G.coachs[k];return `<div class="fl" style="cursor:default"><div style="font-size:30px;width:44px;text-align:center">${c.ic}</div><div style="flex:1"><div class="nm">${c.n}</div><div class="sm">${['Aucun','Bénévole du club','Entraîneur diplômé','Coach de renommée mondiale'][n]} · ${n?fE(M.COACH_PAYE[n])+' / sem.':'gratuit'}</div>
 <div class="sm">${k==='medecin'?'Moins de blessures, récupération plus rapide':'Progression +'+Math.round(n*28)+' % en '+c.a.map(x=>ATTRS.find(y=>y[0]===x)[1].toLowerCase()).join(', ')}</div></div>
 <div style="display:flex;gap:6px;align-items:center"><button class="btn petit" data-act="coach" data-x="${k}:-1" ${n<=0?'disabled':''}>−</button><b class="t" style="font-size:22px;width:20px;text-align:center">${n}</b><button class="btn petit vert" data-act="coach" data-x="${k}:1" ${n>=3?'disabled':''}>+</button></div></div>`;}).join('');
 const dep=S.loyer+M.mes().length*M.ALLOC+Object.values(G.coachs).reduce((s,n)=>s+M.COACH_PAYE[n],0);
 h+=`<div class="sec">FINANCES</div><div class="carte"><div class="kpi"><div><b class="pos">+${fE(G.salle.membres*12)}</b><span>Cotisations / sem.</span></div><div><b class="neg">−${fE(dep)}</b><span>Dépenses / sem.</span></div><div><b class="or-t">${fE(G.stats.bourses)}</b><span>Commissions totales</span></div></div><div style="margin-top:10px">${graphFin()}</div>
 <div class="doux" style="font-size:12px">Dépenses : loyer ${fE(S.loyer)}, allocations des combattants ${fE(M.mes().length*M.ALLOC)}, staff ${fE(dep-S.loyer-M.mes().length*M.ALLOC)}.</div></div>`;
 return h;}
/* ---------- vue Offres ---------- */
const COTE={};
function cote(cid,plan){const k=cid+plan;if(COTE[k]!=null)return COTE[k];const t=M.trouverCombat(cid);if(!t)return .5;const A=G.F[t.c.a],B=G.F[t.c.b];const R=M.rounds(t.c,ORGc(t.e.org));
 A.bonusCamp=M.bonusCamp(t.c);let w=0,n=0;for(let i=1;i<=140;i++){const s=Combat.simuler([A,B],{seed:i*7919+3,rounds:R,plans:[plan,M.planIA(B,A)]});if(s.res.w===0)w++;else if(s.res.w===-1)w+=.5;n++;}delete A.bonusCamp;COTE[k]=w/n;return COTE[k];}
function vOffres(){let h=`<div class="titreVue"><h1>Offres</h1><small>${G.offres.length} en attente</small></div>`;
 if(!G.offres.length)h+=`<div class="carte doux" style="text-align:center">Pas d'offre pour le moment. Les organisations proposent des combats quelques semaines avant leurs galas.</div>`;
 h+=`<div class="lst-off">`+G.offres.map(o=>{const f=G.F[o.f];if(!f)return '';
  if(o.type==='combat'){const t=M.trouverCombat(o.c);if(!t)return '';const adv=G.F[o.adv];const p=cote(o.c,'equi');
   return `<div>${affiche(t.c,t.e)}<div class="carte" style="border-radius:0 0 16px 16px;margin-top:-6px">
   <div class="ligne" style="justify-content:space-between"><div><div class="doux" style="font-size:11px">BOURSE</div><b class="t" style="font-size:24px">${fE(o.show)} <span class="doux" style="font-size:14px">+ ${fE(o.win)} si victoire</span></b><div class="doux" style="font-size:11.5px">Votre commission (${Math.round(M.pctF(f)*100)} %) : ${fE(o.show*M.pctF(f))} à ${fE((o.show+o.win)*M.pctF(f))}</div></div>
   <div style="text-align:right"><div class="doux" style="font-size:11px">CHANCES ESTIMÉES</div><b class="t" style="font-size:30px;color:${p>.6?'#2fbf71':p>.4?'#e9c46a':'#e63946'}">${Math.round(p*100)} %</b></div></div>
   <div class="cote"><i style="width:${p*100}%"></i><i style="flex:1"></i></div>
   <div class="doux" style="font-size:12px">Réponse avant la ${M.date(o.exp)} · ${M.rounds(t.c,ORGc(t.e.org))} rounds · forme de ${esc(f.pr)} : ${Math.round(f.forme)}${f.bless>0?' · 🚑 blessé !':''}</div>
   ${o.nego?'<div class="doux" style="font-size:12px;margin-top:6px">Négociation déjà tentée.</div>':`<div class="nego"><span class="doux">Négocier :</span><button class="btn petit" data-act="nego" data-x="${o.id}:0.15">+15 % <small>${Math.round(M.chanceNego(o.id,.15)*100)} %</small></button><button class="btn petit" data-act="nego" data-x="${o.id}:0.35">+35 % <small>${Math.round(M.chanceNego(o.id,.35)*100)} %</small></button></div>`}
   <div style="display:flex;gap:8px;margin-top:10px"><button class="btn vert" style="flex:1" data-act="accC" data-x="${o.id}">Accepter</button><button class="btn" data-f="${adv.id}">👁 Adversaire</button><button class="btn fant" data-act="refO" data-x="${o.id}">Refuser</button></div></div></div>`;}
  const O=ORGc(o.org);const cur=f.org?ORGc(f.org):null;const up=!cur||O.tier>cur.tier;
  return `<div class="carte" style="background:linear-gradient(120deg,${O.c2},#101117 70%);border-color:${O.c1}66"><div class="ligne"><div style="width:62px;height:62px;flex:0 0 auto">${embleme(O)}</div><div style="flex:1"><div class="doux" style="font-size:11px">${up&&cur?'⬆️ PROMOTION':o.renouv?'RENOUVELLEMENT':'CONTRAT'} · ${esc(o.raison||'')}</div><h3 style="font-size:24px;margin:0">${O.nom}</h3><div>pour <b data-f="${f.id}" style="text-decoration:underline">${esc(nomC(f))}</b> ${cur?'('+cur.court+' actuellement)':''}</div></div></div>
  <div class="kpi" style="margin-top:10px"><div><b>${o.nb}</b><span>Combats</span></div><div><b>${fE(o.show)}</b><span>Bourse + victoire</span></div><div><b>${o.prime?fE(o.prime):'—'}</b><span>Prime</span></div></div>
  ${cur&&f.org!==o.org&&estChamp(f)?'<p style="color:#ffb3b9;font-size:12px">⚠️ Signer libère sa ceinture '+cur.court+'.</p>':''}${f.prochain&&f.org!==o.org?'<p style="color:#ffb3b9;font-size:12px">⚠️ Son combat déjà prévu sera annulé.</p>':''}
  ${o.nego?'':`<div class="nego"><span class="doux">Négocier :</span><button class="btn petit" data-act="nego" data-x="${o.id}:0.15">+15 % <small>${Math.round(M.chanceNego(o.id,.15)*100)} %</small></button><button class="btn petit" data-act="nego" data-x="${o.id}:0.35">+35 % <small>${Math.round(M.chanceNego(o.id,.35)*100)} %</small></button></div>`}
  <div style="display:flex;gap:8px;margin-top:10px"><button class="btn or" style="flex:1;font-size:19px" data-act="accK" data-x="${o.id}">Signer</button><button class="btn fant" data-act="refO" data-x="${o.id}">Refuser</button></div><div class="doux" style="font-size:11px;margin-top:6px">Expire la ${M.date(o.exp)}</div></div>`;}).join('')+`</div>`;
 return h;}
/* ---------- menu ---------- */
function menu(){const N=NUAGE;modal(`<h2>Menu</h2><div class="btns">
 <button class="btn" id="mGuide">📖 Guide du manager</button><button class="btn" id="mAcc">🏠 Écran titre</button><button class="btn" id="mBug">🐞 Signaler un problème à Claude</button><button class="btn" id="mBanc">🧪 Mesurer la fluidité (arène 3D)</button>
 <button class="btn" id="mQual">⚙️ Qualité 3D : ${localStorage.getItem('cg-qual')==='0'?'allégée':'normale'}</button><button class="btn" onclick="fermerModal()">Fermer</button></div>
 <p class="doux" style="font-size:12px;margin-top:12px">☁ Sauvegarde en ligne : ${TEST?'coupée (mode test)':N?(N.ok?'active':N.err?'refusée ('+esc(N.err)+')':'en attente'):'indisponible'}</p>`);
 $('mAcc').onclick=()=>{fermerModal();sauver();accueil();};$('mGuide').onclick=guide;
 $('mBug').onclick=async()=>{toast('Envoi…');const ok=TK?await TK.signaler():false;toast(ok?'Merci ! Signalement envoyé.':'Enregistré sur cet appareil ('+(TK?TK.base:'?')+')',3200);};
 $('mQual').onclick=()=>{localStorage.setItem('cg-qual',localStorage.getItem('cg-qual')==='0'?'1':'0');toast('Pris en compte au prochain lancement');fermerModal();};
 $('mBanc').onclick=banc;}
function guide(){modal(`<button class="fermer" onclick="fermerModal()">✕</button><h2>Guide du manager</h2><div class="guide">
<h3>🏟️ Les organisations</h3><p>CFR (régional) → HEX (France) → ECC (Europe) → GLADIUS (monde) → APEX (le sommet). Une organisation vous propose un contrat quand votre combattant est champion, dans le top 3 avec une série de victoires, ou nettement trop fort pour sa ligue. Après plusieurs défaites, il est libéré et redescend.</p>
<h3>🥊 Les combats</h3><p>Les offres arrivent quelques semaines avant les galas. Regardez les <b>chances estimées</b>, négociez la bourse (+15 % ou +35 %, avec un risque de voir l'offre retirée), puis préparez le <b>camp</b> : étude vidéo, sparrings spécialisés, stage à l'étranger. Le soir du combat, choisissez un <b>plan</b> (l'avis du staff compare les cinq) et changez-le entre les rounds.</p>
<h3>🧬 Les traits</h3><p>Chaque combattant peut avoir des traits : menton de fer, cardio de machine, diesel, explosif, gaucher, contreur… Touchez un trait pour lire son effet. Certains sont des défauts (mâchoire de verre, fragile).</p>
<h3>🏋️ L'entraînement</h3><p>Programme et intensité dans la fiche de chaque combattant. L'intensité fait progresser plus vite mais fatigue et blesse. La progression ralentit à l'approche du potentiel (étoiles) et avec l'âge. Les entraîneurs et la taille de la salle accélèrent tout.</p>
<h3>💰 L'argent</h3><p>Vous touchez une commission sur les bourses (fixée par le contrat de management de chaque combattant, renégocié à son terme), les cotisations des adhérents (attirés par la réputation), les sponsors et les primes d'objectifs. Le loyer, le staff et les allocations sont payés chaque semaine.</p>
<h3>🏆 Grand Prix et palmarès</h3><p>Chaque année, ECC ou GLADIUS organise un Grand Prix à huit dans une catégorie : placez un combattant dans le top 8 pour y être invité. En fin d'année : combattant, KO et révélation de l'année. Les grandes carrières entrent au temple de la renommée.</p>
<h3>⚖️ Catégories, rivaux, vétérans</h3><p>On peut changer de catégorie de poids depuis la fiche. Une défaite serrée crée un rival : les revanches paient mieux. Un vétéran en déclin peut raccrocher et devenir entraîneur de l'écurie.</p></div>`,true);}
function modal(h,large){const m=$('modal');m.innerHTML=`<div class="boite" ${large?'style="max-width:720px"':''}>${h}</div>`;m.classList.remove('cache');m.onclick=e=>{if(e.target===m&&!m.dataset.bloque)fermerModal();};m.querySelector('.boite').scrollTop=0;}
function fermerModal(){$('modal').classList.add('cache');$('modal').innerHTML='';delete $('modal').dataset.bloque;}
window.fermerModal=fermerModal;window.fiche=fiche;
/* ---------- avancer le temps ---------- */
async function avancer(max){if(!G)return;fermerModal();let n=0;
 for(;n<max;n++){const nOff=G.offres.length;const out=M.avancer();if(out.attente)break;
  for(const p of out.popups){await popup(p);}
  if(G.aJouer.length||out.popups.length||(max>1&&G.offres.length>nOff))break;}
 COTEvider();sauver();rendre();if(G.nouveauSucces&&G.nouveauSucces.length){G.nouveauSucces.forEach((n,i)=>setTimeout(()=>toast('🎖️ Succès : '+n,3500),i*600));G.nouveauSucces=[];}
 if(G.aJouer.length)setTimeout(()=>preCombat(G.aJouer[0]),250);}
function COTEvider(){for(const k in COTE)delete COTE[k];}
function popup(p){return new Promise(res=>{modal(`<div class="doux" style="font-size:12px;letter-spacing:.1em">ÉVÉNEMENT · ${M.date()}</div><h2>${esc(p.t)}</h2><p>${esc(p.d)}</p><div class="btns">${p.ch.map((c,i)=>`<button class="btn ${i===0?'or':''}" data-i="${i}" style="${i===0?'font-size:19px':''}">${esc(c.t)}</button>`).join('')}</div>`);$('modal').dataset.bloque=1;
 $('modal').querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{if(p.id!=='faillite')M.choisir(+b.dataset.i,p);fermerModal();res();});});}
/* ---------- soirée de combat ---------- */
const PLANS_D={equi:'Rester adaptable, saisir les occasions',debout:'Défendre les amenées, boxer',sol:'Chercher les amenées et la soumission',pression:'Avancer, frapper beaucoup (fatigue)',contre:'Attendre l\'erreur, contrer'};
function campH(cid){const t=M.trouverCombat(cid);const {c,e}=t;const tier=ORGc(e.org).tier;c.camp=c.camp||{};
 return `<div class="carte"><h3>Camp d'entraînement <small>bonus actuel +${M.bonusCamp(c).toFixed(1)}</small></h3><div class="camp">${Object.entries(M.CAMP).map(([k,x])=>`<button class="${c.camp[k]?'on':''}" ${c.camp[k]?'':`data-act="camp" data-x="${cid}:${k}"`}><span style="font-size:24px">${x.ic}</span><div><b>${x.n}</b><span>${x.d} · +${x.b} à toutes les qualités le jour du combat</span></div><b style="margin-left:auto;white-space:nowrap">${c.camp[k]?'✅':fE(x.c(tier))}</b></button>`).join('')}</div></div>`;}
function rapportAdv(B,A){const n=B.v+B.d+B.n||1;const fin=Math.round((B.ko+B.sub)/Math.max(1,B.v)*100);const H=B.histo.slice(0,4);
 const forts=ATTRS.map(([k,l])=>[l,B.at[k]-A.at[k]]).sort((a,b)=>b[1]-a[1]);
 const deja=A.histo.filter(h=>h.adv===B.id);
 return `<div class="carte"><h3>Rapport sur l'adversaire</h3>${(B.traits||[]).length?`<div class="traits" style="margin:0 0 8px">${traitsH(B)}</div>`:''}
 <div class="doux" style="font-size:12.5px;line-height:1.55">${STYLES[B.style].ic} ${STYLES[B.style].nom} · ${B.ko} KO, ${B.sub} soumissions, ${B.dec} décisions${B.v?' ('+fin+' % de victoires avant la limite)':''}<br>
 Plus fort que vous en <b style="color:#ffb3b9">${forts.filter(x=>x[1]>2).slice(0,2).map(x=>x[0].toLowerCase()).join(', ')||'rien de marquant'}</b> · plus faible en <b style="color:#bff0cf">${forts.filter(x=>x[1]<-2).slice(-2).map(x=>x[0].toLowerCase()).join(', ')||'rien de marquant'}</b><br>
 Forme récente : ${H.map(h=>`<span class="vd ${h.r}" style="display:inline-flex;width:18px;height:18px;font-size:10px">${h.r}</span>`).join(' ')||'—'}${deja.length?`<br>😠 Déjà affrontés : ${deja.map(h=>(h.r==='V'?'victoire':h.r==='D'?'défaite':'nul')+' ('+ISSUES[h.m].toLowerCase()+')').join(', ')}`:''}</div></div>`;}
function preparerCamp(cid){const t=M.trouverCombat(cid);modal(`<button class="fermer" onclick="fermerModal()">✕</button>${affiche(t.c,t.e)}<div style="margin-top:10px">${campH(cid)}</div><p class="doux" style="font-size:12px">Le plan de combat se choisit le soir du combat.</p>`,true);brancher($('modal'));}
window.preparerCamp=preparerCamp;
function preCombat(cid){const t=M.trouverCombat(cid);if(!t)return;const {c,e}=t;const A=G.F[c.a],B=G.F[c.b];c.plan=c.plan||'equi';
 const tale=(l,a,b,fmt=x=>x)=>`<b>${fmt(a)}</b><span>${l}</span><b>${fmt(b)}</b>`;
 const sc=e.combats.filter(x=>x!==c&&x.res&&!x.res.annule&&G.F[x.a]&&G.F[x.b]);const O0=OE(e);
 const h=`${affiche(c,e)}${sc.length?`<div class="carte" style="margin-top:10px"><h3>La sous-carte <small>déjà disputée ce soir</small></h3>${sc.map(x=>{const a=G.F[x.a],b=G.F[x.b];const w=x.res.w;return `<div class="soiree"><span class="${w===0?'gag':''}">${flag(a.pays)} ${esc(a.nom)}</span><span class="doux">${x.titre?ceinture(O0.c1):'vs'}</span><span class="${w===1?'gag':''}" style="text-align:right">${esc(b.nom)} ${flag(b.pays)}</span><small>${ISSUES[x.res.m]}${['ko','tko','sub'].includes(x.res.m)?' · R'+x.res.r:''}</small></div>`;}).join('')}</div>`:''}<div class="carte" style="margin-top:10px"><h3>Fiche technique</h3><div class="stat3">${tale('Âge',Math.floor(A.age),Math.floor(B.age))}${tale('Palmarès',rec(A),rec(B))}${tale('Note',M.ov(A),M.ov(B))}
 ${ATTRS.map(([k,l])=>tale(l,Math.round(A.at[k]),Math.round(B.at[k]))).join('')}${tale('Style',STYLES[A.style].nom,STYLES[B.style].nom)}${tale('Forme',Math.round(A.forme),Math.round(B.forme??100))}</div></div>
 ${rapportAdv(B,A)}
 ${campH(cid)}
 <div class="carte"><h3>Plan de combat <small><button class="btn petit fant" id="bStaff">🧠 Avis du staff</button></small></h3><div id="avisStaff"></div><div class="plans" id="pPlans">${Object.entries(Combat.PLANS).map(([k,p])=>`<button data-k="${k}" class="${c.plan===k?'on':''}"><b>${p.n}</b><span>${PLANS_D[k]}</span></button>`).join('')}</div>
 <div class="ligne" style="justify-content:space-between;margin-top:10px"><span class="doux">Chances estimées avec ce plan</span><b class="t" id="pCote" style="font-size:28px"></b></div><div class="cote"><i id="pCoteB"></i><i style="flex:1"></i></div></div>
 <div class="btns"><button class="btn rouge" id="bVoir" style="font-family:var(--t);font-size:24px;letter-spacing:.05em">🎥 Regarder le combat en 3D</button><button class="btn" id="bSim">⚡ Résultat immédiat</button></div>`;
 modal(h,true);$('modal').dataset.bloque=1;
 const maj=()=>{const p=cote(cid,c.plan);$('pCote').textContent=Math.round(p*100)+' %';$('pCote').style.color=p>.6?'#2fbf71':p>.4?'#e9c46a':'#e63946';$('pCoteB').style.width=p*100+'%';};
 $('pPlans').querySelectorAll('button').forEach(b=>b.onclick=()=>{c.plan=b.dataset.k;$('pPlans').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));maj();});
 setTimeout(maj,30);
 $('bStaff').onclick=()=>{$('bStaff').disabled=true;$('avisStaff').innerHTML='<p class="doux">Le staff simule le combat…</p>';setTimeout(()=>{const L=Object.keys(Combat.PLANS).map(k=>[k,cote(cid,k)]).sort((a,b)=>b[1]-a[1]);
  $('avisStaff').innerHTML=`<div class="avis">${L.map(([k,p],i)=>`<div class="${i===0?'top':''}"><span>${i===0?'⭐ ':''}${Combat.PLANS[k].n}</span><div class="barre"><i style="width:${p*100}%;background:${p>.6?'#2fbf71':p>.4?'#e9c46a':'#e63946'}"></i></div><b>${Math.round(p*100)} %</b></div>`).join('')}</div>`;},30);};
 $('bVoir').onclick=()=>{fermerModal();regarder(cid);};
 $('bSim').onclick=()=>{fermerModal();const sim=M.preparerSim(cid,c.plan,c.changes);resultat(cid,sim);};
 brancher($('modal'));}
let CB=null;
function regarder(cid){const t=M.trouverCombat(cid);const {c,e}=t;const A=G.F[c.a],B=G.F[c.b];const O=OE(e);
 if(!ARENE_OK){const sim=M.preparerSim(cid,c.plan,c.changes);resultat(cid,sim);return;}
 c.changes=c.changes||{};const sim=M.preparerSim(cid,c.plan,c.changes);
 CB={cid,sim,i:0,A,B,O,c,e,vit:1,fini:false,tmr:0};
 $('app').classList.add('cache');$('cv3d').style.display='block';$('combat').classList.remove('cache');$('coin').classList.add('cache');$('comm').innerHTML='';
 Arene.preparer(O,[A,B]);Arene.vitesse=1;Arene.demarrer();try{Son.reveil();Son.demarrerFoule();}catch(e){}
 const plaque=(f,cote)=>`<div class="plaque ${cote}"><div class="hp">${Portrait.svg(f,{mini:1,nobg:true})}</div><div class="n">${cote==='g'?flag(f.pays)+' ':''}${esc(f.nom.toUpperCase())}${cote==='d'?' '+flag(f.pays):''}</div><div class="s">${rec(f)} · ${M.rangTxt(f)} ${f.mine?'· VOUS':''}</div><div class="jauge vie"><i id="v${cote}" style="width:100%"></i></div><div class="jauge sta"><i id="s${cote}" style="width:100%"></i></div></div>`;
 $('hud').innerHTML=plaque(A,'g')+`<div class="horloge"><span id="hRd">${e.nom}</span><b id="hT">5:00</b><span id="hR">ROUND 1/${M.rounds(c,O)}</span></div>`+plaque(B,'d');
 ctrlCombat();
 banniere(c.titre?'COMBAT POUR LE TITRE':c.gp!=null?esc(G.gp?G.gp.nom:'GRAND PRIX'):e.nom,esc(e.ville)+' · '+(c.titre?'5 rounds':M.rounds(c,O)+' rounds'),2200);
 const pres=(f,i,coin)=>{Arene.intro(i);const p=$('presente');p.className='pres '+coin;p.innerHTML=`<div class="pres-p">${por(f)}</div><div><div class="pres-coin">COIN ${coin==='r'?'ROUGE':'BLEU'}</div>${f.sur?`<div class="pres-sur">« ${esc(f.sur)} »</div>`:''}<div class="pres-nom">${esc(f.pr)} <b>${esc(f.nom.toUpperCase())}</b></div><div class="pres-inf">${flag(f.pays)} ${PAYS[f.pays].lib} · ${Math.floor(f.age)} ans · ${rec(f)} · ${M.rangTxt(f)}</div><div class="traits">${traitsH(f)}</div></div>`;
  comm('Dans le coin '+(coin==='r'?'rouge':'bleu')+' : '+nomC(f)+(f.sur?' « '+f.sur+' »':'')+' !');try{Son.clameur(.6);}catch(e){}};
 CB.tmr=setTimeout(()=>{pres(A,0,'r');CB.tmr=setTimeout(()=>{pres(B,1,'b');CB.tmr=setTimeout(()=>{$('presente').classList.add('cache');Arene.intro(null);comm('L\'arbitre donne ses consignes… Combattez !','gros');CB.tmr=setTimeout(etape,1600);},3000);},3000);},1800);}
function banniere(t,s,ms=1600){const b=$('banniere');b.innerHTML=`<div><b>${t}</b>${s?`<span>${s}</span>`:''}</div>`;b.className='on';clearTimeout(banniere.t);banniere.t=setTimeout(()=>b.className='',ms);}
function ctrlCombat(){$('ctrl').innerHTML=[1,2,4].map(v=>`<button class="btn petit ${CB.vit===v?'on':''}" data-v="${v}">×${v}</button>`).join('')+`<button class="btn petit" id="cSon">${Son.actif?'🔊':'🔇'}</button><button class="btn petit" id="cFin">⏭ Résultat</button>`;$('cSon').onclick=()=>{const a=Son.basculer();if(a){Son.reveil();Son.demarrerFoule();}ctrlCombat();};
 $('ctrl').querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{CB.vit=+b.dataset.v;Arene.vitesse=CB.vit;ctrlCombat();});$('cFin').onclick=()=>finCombat(true);}
function comm(t,cl){const d=document.createElement('div');if(cl)d.className=cl;d.textContent=t;const c=$('comm');[...c.children].forEach(x=>x.classList.add('vieux'));c.appendChild(d);while(c.children.length>3)c.firstChild.remove();}
function majHud(e){if(!e.sta)return;try{[0,1].forEach(i=>Arene.degats(i,e.hd[i]||0,e.sta[i]));}catch(x){}['g','d'].forEach((s,i)=>{const v=$('v'+s),st=$('s'+s);if(v)v.style.width=Math.max(0,100-(e.hd[i]||0)*100)+'%';if(st)st.style.width=e.sta[i]+'%';});
 const R=M.rounds(CB.c,CB.O);if($('hR'))$('hR').textContent='ROUND '+e.r+'/'+R;if($('hT'))$('hT').textContent=e.k==='fin'?'0:00':Combat.fmt(300-(e.ts||e.b*15));}
function etape(){if(!CB||CB.fini)return;const e=CB.sim.ev[CB.i++];if(!e){finCombat();return;}
 majHud(e);let d=Arene.action(e);if(e.k==='round')banniere('ROUND '+e.r,e.r===M.rounds(CB.c,CB.O)?'dernier round':'',1500);
 if(e.k==='res'){CB.fini=true;const r=e.res;if(r.w>=0&&!['ko','tko','sub'].includes(r.m)){comm('Nous allons aux cartes des juges…');setTimeout(()=>comm('Victoire de '+nomC(r.w===0?CB.A:CB.B)+' par '+ISSUES[r.m].toLowerCase()+' !','gros'),1400/CB.vit);}else if(r.w<0)comm('Match nul !','gros');
  setTimeout(()=>finCombat(),3300/CB.vit);return;}
 if(e.t)comm(e.t,['kd','ko','gnpko','subw'].includes(e.k)?'gros':'');
 if(e.k==='fin'&&e.r<M.rounds(CB.c,CB.O)){setTimeout(()=>coin(e.r),900/CB.vit);return;}
 if(['ko','gnpko','subw'].includes(e.k)&&CB.vit<4){CB.tmr=setTimeout(()=>{banniere('🔁 RALENTI','',1800);const d2=Arene.replay();CB.tmr=setTimeout(()=>{Arene.finReplay();Arene.vitesse=CB.vit;etape();},d2*1000+600);},d*1000+300);return;}
 const pause=['ko','gnpko','subw'].includes(e.k)?d*1000+400:Math.max(650,d*1000+(e.k==='feint'?100:260)/CB.vit);
 CB.tmr=setTimeout(etape,pause);}
function coin(rd){const A=CB.A,B=CB.B;const st=statsJusqua(rd);const cur=planCourant(rd+1);
 $('coin').innerHTML=`<div class="boite"><div class="doux" style="font-size:12px;letter-spacing:.1em">FIN DU ROUND ${rd} · DANS LE COIN</div><h2>Consignes pour le round ${rd+1}</h2>
 <div class="stat3" style="margin:8px 0 12px"><b>${esc(A.nom)}</b><span></span><b>${esc(B.nom)}</b>${['sig','td','kd','sub'].map(k=>`<b>${st[0][k]}</b><span>${({sig:'Frappes touchées',td:'Amenées au sol',kd:'Knockdowns',sub:'Tentatives de soum.'})[k]}</span><b>${st[1][k]}</b>`).join('')}<b>${st.e[0]} %</b><span>Énergie</span><b>${st.e[1]} %</b></div>
 <div class="plans">${Object.entries(Combat.PLANS).map(([k,p])=>`<button data-k="${k}" class="${cur===k?'on':''}"><b>${p.n}</b><span>${PLANS_D[k]}</span></button>`).join('')}</div><p class="doux" style="font-size:12px">${conseilCoin(st)}</p>
 <div class="btns"><button class="btn rouge" id="cGo" style="font-family:var(--t);font-size:22px">Round ${rd+1} : on y va !</button></div></div>`;
 $('coin').classList.remove('cache');let choix=cur;
 $('coin').querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{choix=b.dataset.k;$('coin').querySelectorAll('[data-k]').forEach(x=>x.classList.toggle('on',x===b));});
 $('cGo').onclick=()=>{$('coin').classList.add('cache');if(choix!==cur){CB.c.changes[rd+1]={0:choix};const sim=M.preparerSim(CB.cid,CB.c.plan,CB.c.changes);CB.sim=sim;}CB.tmr=setTimeout(etape,300);};}
function planCourant(rd){let p=CB.c.plan;const ch=CB.c.changes||{};for(let r=1;r<=rd;r++)if(ch[r]&&ch[r][0])p=ch[r][0];return p;}
function statsJusqua(rd){const s=[{sig:0,td:0,kd:0,sub:0},{sig:0,td:0,kd:0,sub:0}];let last=null;for(const e of CB.sim.ev){if(e.r>rd)break;last=e;if(e.a==null)continue;
 if(e.h&&!['td','tdf','sweep','esc','ctrl','clinch','sep','feint'].includes(e.k)&&e.k!=='suba'&&e.k!=='subw')s[e.a].sig++;if(e.k==='td')s[e.a].td++;if(e.k==='kd')s[e.a].kd++;if(e.k==='suba')s[e.a].sub++;}
 s.e=last?last.sta:[100,100];return s;}
function conseilCoin(st){const A=CB.A,B=CB.B;if(st.e[0]<45)return '🧠 Le coach : « Tu es cuit, respire ! Reste prudent et contre. »';if(st[1].td>=2&&A.at.lutte<B.at.lutte)return '🧠 Le coach : « Il t\'amène au sol trop facilement : reste debout, défends ses jambes ! »';
 if(B.at.sol<A.at.sol-8)return '🧠 Le coach : « Au sol il est perdu. Amène-le ! »';if(A.at.frappe>B.at.frappe+6)return '🧠 Le coach : « Tu le touches plus que lui, mets la pression ! »';return '🧠 Le coach : « Continue comme ça, garde ta garde haute. »';}
function finCombat(saut){if(!CB)return;clearTimeout(CB.tmr);CB.fini=true;const {cid,sim}=CB;resultat(cid,sim,true);}
function resultat(cid,sim,vu){const t=M.trouverCombat(cid);const {c,e}=t;const A=G.F[c.a],B=G.F[c.b];const avOrg=A.org;const champAv=estChamp(A);
 M.jouerMonCombat(cid,sim);COTEvider();sauver();
 const r=sim.res,W=r.w===0?A:r.w===1?B:null;const moi=r.w===0;const st=r.stats;const O=OE(e);
 const devientChamp=!champAv&&estChamp(A);
 const h=`<div class="resultat"><div class="doux" style="font-size:12px;letter-spacing:.12em">${e.nom} · ${esc(e.ville)}</div>${W?`<div style="width:130px;margin:10px auto;border-radius:14px;overflow:hidden;border:2px solid ${moi?'#e9c46a':'#555'}">${por(W)}</div>`:''}
 <div class="gagnant">${W?(moi?'VICTOIRE !':'DÉFAITE'):'MATCH NUL'}</div><div style="font-size:16px;font-weight:700">${W?esc(nomC(W))+' l\'emporte':''}</div>
 <div class="meth">${ISSUES[r.m].toUpperCase()}${['ko','tko','sub'].includes(r.m)?' · ROUND '+r.r+' · '+r.temps:''}${r.tech?' · '+esc(r.tech).toUpperCase():''}</div>
 ${devientChamp?`<div class="carte" style="background:linear-gradient(120deg,#3a2c08,#141008);border-color:#e9c46a"><div style="font-size:40px">${ceinture(O.c1).replace('class="ceinture"','style="width:120px;height:64px"')}</div><h2 style="color:#ffe39a">NOUVEAU CHAMPION ${O.court} !</h2></div>`:''}
 ${r.cards?`<div class="cartes-juges">${r.cards.map(k=>`<div>${k.s[0]}-${k.s[1]}</div>`).join('')}</div>`:''}
 <div class="carte" style="text-align:left"><div class="stat3"><b>${esc(A.nom)}</b><span></span><b>${esc(B.nom)}</b>
 <b>${st[0].sig}/${st[0].sigT}</b><span>Frappes</span><b>${st[1].sig}/${st[1].sigT}</b><b>${st[0].td}/${st[0].tdT}</b><span>Amenées</span><b>${st[1].td}/${st[1].tdT}</b><b>${st[0].kd}</b><span>Knockdowns</span><b>${st[1].kd}</b><b>${st[0].sub}</b><span>Soumissions</span><b>${st[1].sub}</b><b>${Combat.fmt(st[0].ctrl)}</b><span>Contrôle</span><b>${Combat.fmt(st[1].ctrl)}</b></div></div>
 ${(()=>{const R0=[];for(const e of sim.ev){if(e.a==null||!e.h||!e.r)continue;if(['td','tdf','sweep','esc','ctrl','clinch','sep','feint','suba','subw'].includes(e.k))continue;R0[e.r]=R0[e.r]||[0,0];R0[e.r][e.a]++;}
  const rs=R0.map((x,i)=>x?[i,x]:null).filter(Boolean);if(!rs.length)return '';const mx=Math.max(1,...rs.flatMap(x=>x[1]));
  return `<div class="carte" style="text-align:left"><h3>Frappes touchées par round</h3><div class="rounds">${rs.map(([r,x])=>`<div><div class="rb"><i style="height:${x[0]/mx*100}%;background:#e63946"></i><i style="height:${x[1]/mx*100}%;background:#3d7bff"></i></div><span>R${r}</span><small>${x[0]}-${x[1]}</small></div>`).join('')}</div></div>`;})()}
 <div class="kpi"><div><b class="or-t">+${fE(c.gain||0)}</b><span>Commission</span></div><div><b>${rec(A)}</b><span>Palmarès</span></div><div><b>${M.rangTxt(A)}</b><span>Classement ${A.org?ORGc(A.org).court:''}</span></div></div>
 ${c.bonus?`<p class="or-t">💰 Bonus de performance de la soirée : ${fE(c.bonus)} !</p>`:''}
 ${(()=>{const L=e.combats.filter(x=>x!==c&&x.res&&!x.res.annule&&G.F[x.a]&&G.F[x.b]);if(!L.length)return '';return `<div class="carte" style="text-align:left"><h3>Résultats de la soirée <small>${e.nom}</small></h3>${L.map(x=>{const a=G.F[x.a],b=G.F[x.b];const w=x.res.w;return `<div class="soiree"><span class="${w===0?'gag':''}">${flag(a.pays)} ${esc(a.nom)}</span><span class="doux">${x.titre?ceinture(O.c1):'vs'}</span><span class="${w===1?'gag':''}" style="text-align:right">${esc(b.nom)} ${flag(b.pays)}</span><small>${ISSUES[x.res.m]}${['ko','tko','sub'].includes(x.res.m)?' · R'+x.res.r:''}</small></div>`;}).join('')}</div>`;})()}
 <div class="btns"><button class="btn or" id="rOk">Continuer</button></div></div>`;
 modal(h);$('modal').dataset.bloque=1;
 $('rOk').onclick=()=>{fermerModal();quitterCombat();if(G.aJouer.length)setTimeout(()=>preCombat(G.aJouer[0]),200);};}
function quitterCombat(){if(CB)clearTimeout(CB.tmr);try{Son.arreterFoule();}catch(e){}$('presente').classList.add('cache');CB=null;Arene.arreter&&Arene.arreter();$('combat').classList.add('cache');$('cv3d').style.display='none';$('app').classList.remove('cache');rendre();}
/* ---------- banc de mesure ---------- */
async function banc(){if(!TK){toast('Trousse de test indisponible');return;}fermerModal();toast('Mesure en cours (≈ 25 s)…',4000);
 const sauv=G;const copie=JSON.parse(JSON.stringify(G));const testAv=TEST;TEST=true;
 const O=ORGS[4];const fs=Object.values(copie.F).filter(f=>f.org==='apx').slice(0,2);
 $('app').classList.add('cache');$('cv3d').style.display='block';$('combat').classList.remove('cache');$('hud').innerHTML='';$('comm').innerHTML='';$('ctrl').innerHTML='';
 const res=await TK.banc([{nom:'arène large',preparer:async()=>{Arene.preparer(O,fs);Arene.demarrer();Arene.ST.pos='S';Arene.ST.dist=1.5;Arene.placer(true);Arene.cam('large');}},
  {nom:'échanges serrés',preparer:async()=>{Arene.cam('serre');let i=0;clearInterval(banc.t);banc.t=setInterval(()=>{Arene.action({k:['jab','cross','hook','lowkick'][i++%4],a:i%2,h:1,z:'tete',pos:'S'});},700);}},
  {nom:'au sol',preparer:async()=>{clearInterval(banc.t);Arene.action({k:'td',a:0,h:1,pos:'G0'});banc.t=setInterval(()=>Arene.action({k:'gnp',a:0,h:1,pos:'G0'}),900);}}],6000);
 clearInterval(banc.t);G=M.charger(sauv);TEST=testAv;quitterCombat();
 modal(`<h2>Fluidité</h2>${res.res.map(r=>`<p><b>${r.scene}</b> : ${r.fps||'?'} img/s (1 % bas : ${r.bas1||'?'})</p>`).join('')}<p class="doux">GPU : ${esc(res.gpu)}<br>${res.enregistre?'Envoyé à Claude ✓':'Non envoyé ('+esc(res.base)+')'}</p><div class="btns"><button class="btn" onclick="fermerModal()">OK</button></div>`);}
/* ---------- démarrage ---------- */
async function demarrer(){
 try{TK=Testkit({jeu:'cage-gloire',canvas:()=>$('cv3d'),capture:async()=>{try{return Arene.capture();}catch(e){return '';}},etat:()=>({vue:VUE,test:TEST,sem:G&&G.sem,argent:G&&Math.round(G.argent),mes:G&&M.mes().map(f=>({n:nomC(f),org:f.org,note:M.ov(f),rec:rec(f)})),offres:G&&G.offres.length,aJouer:G&&G.aJouer,combat:CB&&{cid:CB.cid,i:CB.i},ecran:innerWidth+'x'+innerHeight,arene:ARENE_OK,infos:Arene.infos&&Arene.infos()})});}catch(e){}
 try{NUAGE=SauvegardeEnLigne({etat:()=>JSON.stringify(G),meta:()=>({nom:G.nom,date:M.date(),sem:G.sem}),coupe:()=>TEST||!G});addEventListener('visibilitychange',()=>{if(document.hidden&&G&&!TEST){sauver();NUAGE.push(true);}});}catch(e){}
 try{const x=$('xbot');let b64=x?x.textContent.trim():'';if(!b64){const r=await fetch('xbot.glb');const buf=new Uint8Array(await r.arrayBuffer());let s='';for(let i=0;i<buf.length;i+=0x8000)s+=String.fromCharCode.apply(null,buf.subarray(i,i+0x8000));b64=btoa(s);}
  await document.fonts.load('40px "Bebas Neue"').catch(()=>{});
  await Arene.init($('cv3d'),b64,localStorage.getItem('cg-qual')==='0'?0:1);ARENE_OK=true;}catch(e){console.error('arène',e);TK&&TK.erreurs.push('arène: '+e);ARENE_OK=false;}
 accueil();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',demarrer);else demarrer();
