/* ====================== Comparateur de joueurs ====================== */
UI.cmp=[];
function cmpFind(id){return getP(id)||(S.market||[]).find(p=>p.id===id)||null;}
A.cmpToggle=function(id){const i=UI.cmp.indexOf(id);if(i>=0)UI.cmp.splice(i,1);else{if(UI.cmp.length>=3)UI.cmp.shift();UI.cmp.push(id);}cmpBar();if(UI.cmp.length>=2)toast('Comparateur : '+UI.cmp.length+' joueurs sélectionnés');document.querySelectorAll('[data-cmp]').forEach(b=>b.classList.toggle('on',UI.cmp.includes(+b.dataset.cmp)));};
function cmpBar(){let b=document.getElementById('cmpBar');UI.cmp=UI.cmp.filter(id=>cmpFind(id));
  if(UI.cmp.length<1){if(b)b.remove();return;}
  if(!b){b=document.createElement('div');b.id='cmpBar';b.className='cmpbar';document.body.appendChild(b);}
  b.innerHTML=`<span>${UI.cmp.map(id=>esc(pshort(cmpFind(id)))).join(' · ')}</span><button class="btn sm pri" onclick="A.cmpShow()" ${UI.cmp.length<2?'disabled':''}>Comparer (${UI.cmp.length})</button><button class="btn sm" onclick="UI.cmp=[];cmpBar();document.querySelectorAll('[data-cmp]').forEach(b=>b.classList.remove('on'))" aria-label="Vider le comparateur">×</button>`;}
const CMPC=['#f4c430','#5fd3ff','#ff7ab6'];
function radarMulti(list){
  const W=300,cx=150,cy=135,R0=95,n=list[0].at.length,pt=(k,r)=>{const a=-Math.PI/2+k*2*Math.PI/n;return [cx+Math.cos(a)*r,cy+Math.sin(a)*r];};
  let g='';[.25,.5,.75,1].forEach(f=>{g+=`<polygon points="${list[0].at.map((_,k)=>pt(k,R0*f).map(v=>v.toFixed(1)).join(',')).join(' ')}" fill="none" style="stroke:var(--line)"/>`;});
  list[0].at.forEach((a,k)=>{const [lx,ly]=pt(k,R0+18);g+=`<text x="${lx.toFixed(1)}" y="${(ly+4).toFixed(1)}" text-anchor="middle">${a.n}</text>`;});
  list.forEach((x,i)=>{g+=`<polygon points="${x.at.map((a,k)=>pt(k,R0*a.v/100).map(v=>v.toFixed(1)).join(',')).join(' ')}" style="fill:${CMPC[i]};fill-opacity:.14;stroke:${CMPC[i]}" stroke-width="2"/>`;});
  return `<svg viewBox="0 0 ${W} 270" class="radar" role="img" aria-label="Comparaison des profils">${g}</svg>`;}
A.cmpShow=function(){
  const ps=UI.cmp.map(cmpFind).filter(Boolean);if(ps.length<2)return;
  const mine=p=>!!getP(p.id),seen=p=>mine(p)||p.scouted;
  const rows=[['Club',p=>mine(p)?esc(S.club.name):esc(p.club)],['Poste',p=>POSN[p.pos]],['Âge',p=>p.age,'low'],['Note',p=>p.ovr,'high'],['Potentiel',p=>mine(p)||p.potSeen?potTxt(p):'?'],
    ['Valeur',p=>money(valueFor(p)),'v'],['Prix demandé',p=>mine(p)?'—':p.fee?money(p.fee):'Libre'],['Salaire',p=>money(mine(p)?p.wage:p.demand)+'/mois'],
    ['Personnalité',p=>seen(p)?p.pers||'—':'?'],['Forme',p=>mine(p)?p.fit+' %':'—'],['Moral',p=>mine(p)?p.morale:'—'],
    ['Matchs (saison)',p=>mine(p)?(p.s.mj+p.s.cmj):'—'],['Buts (saison)',p=>mine(p)?(p.s.g+p.s.cg):'—'],['Note moyenne',p=>mine(p)&&p.s.nn?(p.s.ns/p.s.nn).toFixed(2).replace('.',','):'—']];
  const best=(f,mode)=>{if(!mode)return -1;const v=ps.map(p=>{const x=f(p);return typeof x==='number'?x:mode==='v'?valueFor(p):NaN;});if(v.some(isNaN))return -1;const t=mode==='low'?Math.min(...v):Math.max(...v);return v.filter(x=>x===t).length===1?v.indexOf(t):-1;};
  const same=ps.every(p=>(p.pos==='G')===(ps[0].pos==='G'));
  openModal(`<div class="kicker">Comparateur</div><h2>Comparer ${ps.length} joueurs</h2>
   <div class="cmp-head" style="grid-template-columns:repeat(${ps.length},1fr)">${ps.map((p,i)=>`<div style="--cc:${CMPC[i]}">${jersey(p,40)}<b>${esc(pname(p))}</b><span class="ovr">${p.ovr}</span></div>`).join('')}</div>
   ${same?`<div style="max-width:340px;margin:0 auto">${radarMulti(ps.map(p=>({at:attrs(p)})))}</div>`:'<p class="muted" style="font-size:13px;margin:0">Profils non comparables sur le radar (gardien contre joueur de champ).</p>'}
   <div class="tbl-wrap"><table class="mini cmp"><tbody>${rows.map(([k,f,m])=>{const b=best(f,m);return `<tr><td class="muted">${k}</td>${ps.map((p,i)=>`<td class="${i===b?'gold':''}">${f(p)}</td>`).join('')}</tr>`;}).join('')}</tbody></table></div>
   <div class="row"><button class="btn" onclick="A.close()">Fermer</button><button class="btn" onclick="UI.cmp=[];cmpBar();A.close()">Vider la sélection</button></div>`,true);
};

/* ====================== Plusieurs parties & carrière ====================== */
const SLOTS=3,keyFor=n=>n===1?'president-club-save-v1':'president-club-save-v1-s'+n,CAREER_KEY='president-club-career';
function slotInfo(n){try{const t=localStorage.getItem(keyFor(n));if(!t)return null;const x=JSON.parse(t);return {name:x.club.name,c1:x.club.c1,c2:x.club.c2,div:x.div,year:x.year,over:x.over?x.over.t:null,pal:(x.palmares||[]).length};}catch(e){return null;}}
function careerGet(){try{return JSON.parse(localStorage.getItem(CAREER_KEY)||'[]');}catch(e){return [];}}
function careerAdd(reason){if(!S||S.careerDone)return;S.careerDone=true;const c=careerGet();c.unshift({club:S.club.name,c1:S.club.c1,c2:S.club.c2,from:S.club.start||2026,to:S.year,seasons:S.history.length,best:LV[S.maxDiv].n,maxDiv:S.maxDiv,pal:S.palmares.slice(0,12),end:reason});try{localStorage.setItem(CAREER_KEY,JSON.stringify(c.slice(0,20)));}catch(e){}}
function careerBonus(){const c=careerGet();let pts=0;c.forEach(x=>{pts+=x.seasons*.5+x.maxDiv*1.5+x.pal.length*2;});return Math.min(20,Math.round(pts));}
A.loadSlot=function(n){const t=localStorage.getItem(keyFor(n));if(!t)return;try{localStorage.setItem('president-club-slot',String(n));}catch(e){}KEY=keyFor(n);S=JSON.parse(t);migrate();S.track=S.track||{cash:[],pos:[]};S.sf.fi=S.sf.fi||{};UI.tab='accueil';UI.queue=[];render();if(S.over)UI.queue.push({type:'over'});nextQueue();};
A.newInSlot=function(n){UI.setup.slot=n;renderStart();setTimeout(()=>{const el=document.getElementById('cTown');if(el){el.scrollIntoView({block:'center'});el.focus();}},50);};
A.delSlot=function(n){openModal(`<div class="kicker">Emplacement ${n}</div><h2>Effacer cette partie ?</h2><p>Elle sera définitivement supprimée de ce navigateur.</p><div class="row"><button class="btn dan" onclick="A.doDelSlot(${n})">Effacer</button><button class="btn" onclick="A.close()">Annuler</button></div>`);};
A.doDelSlot=function(n){try{localStorage.removeItem(keyFor(n));}catch(e){}document.getElementById('modal').classList.add('hidden');UI.modalOpen=false;renderStart();};
A.toMenu=function(){if(S)save();S=null;UI.queue=[];UI.cmp=[];cmpBar();document.getElementById('modal').classList.add('hidden');UI.modalOpen=false;renderStart();window.scrollTo({top:0});};
A.resign=function(){openModal(`<div class="kicker">Démission</div><h2>Quitter la présidence de ${esc(S.club.name)} ?</h2><p>Votre mandat s’arrête ici et rejoint votre carrière de président. Votre réputation vous suivra dans votre prochain club (meilleure confiance de départ et sponsors plus généreux).</p><div class="row"><button class="btn dan" onclick="A.doResign()">Démissionner</button><button class="btn" onclick="A.close()">Annuler</button></div>`);};
A.doResign=function(){S.over={t:'Démission',d:'Vous quittez le club la tête haute après '+S.history.length+' saison'+(S.history.length>1?'s':'')+'.'};careerAdd('Démission');save();document.getElementById('modal').classList.add('hidden');UI.modalOpen=false;UI.queue=[{type:'over'}];nextQueue();};
function startSlotsHtml(){
  const cards=[...Array(SLOTS)].map((_,k)=>{const n=k+1,x=slotInfo(n);
    return x?`<div class="slot"><div class="row" style="gap:10px;align-items:center;flex-wrap:nowrap">${crestSVG(x.c1,x.c2,initials(x.name),40,0)}<div style="min-width:0"><b>${esc(x.name)}</b><div class="muted" style="font-size:12.5px">${LV[x.div].n} · saison ${seasonLabel(x.year)}${x.pal?' · '+x.pal+' trophée'+(x.pal>1?'s':''):''}${x.over?' · <span class="bad">'+esc(x.over)+'</span>':''}</div></div></div><div class="row" style="gap:6px"><button class="btn sm pri" onclick="A.loadSlot(${n})">${x.over?'Voir':'Reprendre'}</button><button class="btn sm dan" onclick="A.delSlot(${n})" aria-label="Effacer la partie ${n}">Effacer</button></div></div>`
      :`<div class="slot empty ${UI.setup.slot===n?'on':''}"><span class="muted">Emplacement ${n} libre</span><button class="btn sm" onclick="A.newInSlot(${n})">Nouvelle partie ici</button></div>`;}).join('');
  const c=careerGet();
  return `<div class="card"><header><h3>Vos parties</h3><span class="muted" style="font-size:13px">${SLOTS} emplacements</span></header><div class="slots">${cards}</div></div>
   ${c.length?`<div class="card"><header><h3>Votre carrière de président</h3><span class="pill g">Réputation +${careerBonus()}</span></header><div class="career">${c.slice(0,8).map(x=>`<div class="row" style="gap:10px;align-items:center;flex-wrap:nowrap">${crestSVG(x.c1,x.c2,initials(x.club),32,0)}<div><b>${esc(x.club)}</b> <span class="muted" style="font-size:12.5px">${x.from}–${x.to} · ${x.seasons} saison${x.seasons>1?'s':''} · plus haut : ${esc(x.best)} · ${esc(x.end)}</span>${x.pal.length?'<div class="gold" style="font-size:12.5px">'+x.pal.map(esc).join(' · ')+'</div>':''}</div></div>`).join('')}</div><p class="muted" style="margin:0;font-size:12.5px">Votre réputation vous ouvre des portes : un nouveau club démarre avec plus de confiance et des sponsors plus généreux.</p></div>`:''}`;
}

/* ====================== Licence : compte à rebours ====================== */
const REQ_MAP=[[/Stade|Tribune/,'stade',null],[/Éclairage d’entraînement/,'eclairage',1],[/E4/,'eclairage',2],[/TV E1/,'eclairage',3],[/synthétique/,'pelouse',1],[/Pelouse naturelle/,'pelouse',2],[/Pôle espoirs/,'formation',2],[/formation agréé/,'formation',3],[/entraînement complet/,'entrainement',3]];
function licenceItems(t){
  return reqs(t).filter(r=>!r.ok).map(r=>{const m=REQ_MAP.find(([re])=>re.test(r.l));if(!m)return {l:r.l,admin:true};
    const k=m[1],need=m[2]??r.need,cur=S.infra[k],bd=S.builds.find(b=>b.key===k);const lv=bd?bd.to:cur;
    let w=bd?bd.left:0,c=0;for(let x=lv+1;x<=need;x++){w+=INFRA[k].weeks[x]||0;c+=INFRA[k].cost[x]||0;}
    return {l:r.l,k,need,w,c,bd:!!bd,blk:buildBlocked(k)};});
}
function licenceCard(){
  const L=LV[S.div];if(S.div>=6||!L.promo||S.div<1)return '';
  const t=S.div+1,it=licenceItems(t);if(!it.length)return `<div class="card lic ok"><header><h3>Licence ${LV[t].n}</h3><span class="pill g">En règle</span></header><p class="muted" style="margin:0;font-size:13px">Tous les critères sont remplis : en cas de montée, rien ne bloquera.</p></div>`;
  const left=S.N-S.week;
  return `<div class="card lic"><header><h3>Licence ${LV[t].n}</h3><span class="pill w">${it.length} critère${it.length>1?'s':''} manquant${it.length>1?'s':''}</span></header>
   <div class="lic-list">${it.map(x=>{if(x.admin)return `<div class="li"><span>${esc(x.l)}</span><span class="muted">administratif</span></div>`;
     const late=x.w>left,deloc=x.k==='stade'&&t>=3&&!S.deloc;
     return `<div class="li ${late?'late':''}"><span>${esc(x.l)}${x.bd?' <span class="pill y">chantier en cours</span>':''}</span><span class="num">${x.w} sem.${x.c?' · '+money(x.c):''}</span><div class="lbar"><i style="width:${clamp(left/Math.max(1,x.w)*100,0,100)}%"></i></div><small class="${late?'bad':'muted'}">${x.bd?'livraison dans '+x.w+' semaines':late?(deloc?'trop tard pour cette saison : la dérogation stade restera possible':'trop tard pour cette saison'):'à lancer avant la J'+(S.N-x.w)}${x.blk?' · '+esc(x.blk):''}</small></div>`;}).join('')}</div>
   <div class="row"><button class="btn sm" onclick="A.tab('infra')">Aller aux installations</button><span class="muted" style="font-size:12.5px">Il reste ${left} journée${left>1?'s':''} dans la saison.</span></div></div>`;
}

/* ====================== Bilan de saison illustré ====================== */
function seasonVisual(){
  const L=LV[S.div],tp=(S.track&&S.track.pos)||[];
  const chart=tp.length>1?lineChart(tp,{w:520,h:150,min:.5,max:L.teams+.5,invert:true,n:S.N,ticks:[1,Math.ceil(L.teams/2),L.teams],pl:30,zones:[...(L.promo?[{from:.5,to:L.promo+.5,c:'var(--good)'}]:[]),{from:L.teams-L.rel+.5,to:L.teams+.5,c:'var(--bad)'}],xl:['J1','J'+S.N],label:'Classement journée par journée'}):'';
  const pl=S.players.filter(p=>p.s&&p.s.nn>=Math.min(8,S.N/3));
  const by=(f)=>[...pl].sort((a,b)=>f(b)-f(a))[0];
  const best=by(p=>p.s.ns/p.s.nn),sc=by(p=>p.s.g+p.s.cg),as=by(p=>p.s.a+p.s.ca),yg=by(p=>p.age<=21?p.s.ns/p.s.nn:0);
  const awards=[['Joueur de la saison',best,best&&(best.s.ns/best.s.nn).toFixed(2).replace('.',',')+' de moyenne'],['Meilleur buteur',sc,sc&&(sc.s.g+sc.s.cg)+' buts'],['Meilleur passeur',as,as&&(as.s.a+as.s.ca)+' passes'],['Révélation',yg&&yg.age<=21?yg:null,yg&&yg.age<=21?yg.age+' ans':'']].filter(a=>a[1]);
  const inc=Object.entries(S.sf.inc).sort((a,b)=>b[1]-a[1]).slice(0,5),exp=Object.entries(S.sf.exp).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const mx=Math.max(1,...inc.map(x=>x[1]),...exp.map(x=>x[1]));
  const bars=(arr,cls)=>arr.map(([k,v])=>`<div class="fbar"><span>${esc(k)}</span><div><i class="${cls}" style="width:${v/mx*100}%"></i></div><b class="num">${money(v)}</b></div>`).join('');
  const E=S.euro;
  return `<div class="sv">
   ${chart?`<div class="sv-c"><h4>La saison en une courbe</h4>${chart}</div>`:''}
   ${awards.length?`<div class="sv-c"><h4>Les trophées du club</h4><div class="awards">${awards.map(([t,p,x])=>`<div class="award">${jersey(p,38)}<div><small>${t}</small><b>${esc(pname(p))}</b><span class="muted">${x}</span></div></div>`).join('')}</div></div>`:''}
   <div class="sv-c"><h4>Où est passé l’argent</h4><div class="fbars"><div><div class="muted" style="font-size:12px;margin-bottom:4px">Principales recettes</div>${bars(inc,'good')}</div><div><div class="muted" style="font-size:12px;margin-bottom:4px">Principales dépenses</div>${bars(exp,'bad')}</div></div></div>
   ${E?`<div class="sv-c euro" style="--ec:${EURO[E.k].col}"><h4>${starSVG(EURO[E.k].col,14)} ${EURO[E.k].n}</h4><p style="margin:0">${E.phase==='won'?'<b class="gold">Vainqueur !</b>':E.phase==='out'?'Éliminé'+(E.ko?' en '+KO_N[E.ko.r].toLowerCase():' en phase de ligue ('+E.rank+'e)'):''} · ${money(E.earned)} de gains.</p></div>`:''}
  </div>`;
}
