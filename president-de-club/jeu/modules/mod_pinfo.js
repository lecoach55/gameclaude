/* ====================== Fiche joueur partout (clic sur un nom) ====================== */
function pl(id,name,extra){return `<span class="plink" data-pid="${id}" ${extra||''}>${esc(name)}</span>`;}
function plAI(club,name){return `<span class="plink" data-ai="${esc(club)}|${esc(name)}">${esc(name)}</span>`;}
document.addEventListener('click',e=>{const t=e.target.closest&&e.target.closest('[data-pid],[data-ai]');if(!t||!S)return;
  if(t.closest('button'))return;e.stopPropagation();e.preventDefault();
  if(t.dataset.pid)A.pinfo(+t.dataset.pid);else{const [c,n]=t.dataset.ai.split('|');A.aiInfo(c,n);}},true);
function histTable(h){return h&&h.length?`<div class="tbl-wrap"><table class="mini"><thead><tr><th>Saison</th><th>Club</th><th>Division</th><th class="r">MJ</th><th class="r">Buts</th><th class="r">Passes</th></tr></thead><tbody>${[...h].reverse().slice(0,10).map(x=>`<tr><td>${x.y}</td><td>${esc(x.club)}</td><td class="muted">${esc(x.div||'')}</td><td class="r">${x.mj??'—'}</td><td class="r">${x.g??'—'}</td><td class="r">${x.a??'—'}</td></tr>`).join('')}</tbody></table></div>`:'<p class="muted" style="margin:0">Pas d’historique connu.</p>';}
A.pinfo=function(id){
  if(getP(id)){A.sheet(id);return;}
  const m=(S.market||[]).find(p=>p.id===id)||(S.pre||[]).find(p=>p.id===id);
  if(m){const sc=m.scouted,at=attrs(m),t=S.talks&&S.talks[m.id];
    openModal(`<div class="kicker">Fiche joueur · ${esc(m.club)}</div>
     <div class="spread"><h2 class="pname">${jersey(m,42)}${esc(pname(m))}</h2><span class="ovr" style="font-size:40px;color:var(--flood)">${m.ovr}</span></div>
     <div class="pc-wrap">${pcard(m,at)}<div class="kpis">
      <div class="kpi"><div class="l">Poste · âge</div><div class="v" style="font-size:18px">${POSN[m.pos]}, ${m.age} ans</div></div>
      <div class="kpi"><div class="l">Potentiel</div><div class="v">${potTxt(m)}</div></div>
      <div class="kpi"><div class="l">Valeur</div><div class="v" style="font-size:20px">${money(valueFor(m))}</div></div>
      <div class="kpi"><div class="l">Indemnité demandée</div><div class="v" style="font-size:20px">${m.fee?money(m.fee):'Libre'}</div></div>
      <div class="kpi"><div class="l">Salaire demandé</div><div class="v" style="font-size:20px">${money(m.demand)}<span class="muted" style="font-size:13px">/mois</span></div></div>
      <div class="kpi"><div class="l">Personnalité</div><div class="v" style="font-size:18px">${sc?esc(m.pers):'?'}</div>${sc?`<div class="muted" style="font-size:12px">${esc(PERS_D[m.pers])}</div>`:''}</div>
      <div class="kpi"><div class="l">Intérêt pour le club</div><div class="v">${Math.round(interest(m)*100)} %</div></div></div></div>
     <div style="max-width:320px;margin:0 auto">${radar(at)}</div>
     <h3>Carrière</h3>${histTable(m.hist)}
     ${sc?'':'<p class="muted" style="margin:0;font-size:13px">Faites-le superviser par le recruteur pour connaître sa personnalité et son vrai potentiel.</p>'}
     <div class="row"><button class="btn pri" onclick="A.close();setTimeout(()=>A.nego(${m.id}),40)">${t?'Reprendre la négociation':'Négocier'}</button>${sc?'':`<button class="btn" onclick="A.scoutP(${m.id});A.close()">Superviser</button>`}<button class="btn" onclick="A.watch(${m.id});A.close()">${(S.watch||[]).includes(m.id)?'Retirer du suivi':'Suivre'}</button><button class="btn" onclick="A.cmpToggle(${m.id})">⇄ Comparer</button><button class="btn" onclick="A.close()">Fermer</button></div>`,true);return;}
  const g=(S.gone||{})[id];
  if(g){openModal(`<div class="kicker">Ancien joueur du club</div><div class="spread"><h2>${esc(g.n)}</h2><span class="ovr" style="font-size:40px;color:var(--flood)">${g.ovr}</span></div>
     <p style="margin:0">${POSN[g.pos]}, ${g.age} ans au départ · ${esc(g.how)} (${esc(g.y)})${g.to&&g.to!=='—'?' · aujourd’hui à <b>'+esc(g.to)+'</b>':''}.</p>
     <h3>Carrière</h3>${histTable(g.hist)}<div class="row"><button class="btn" onclick="A.close()">Fermer</button></div>`,true);return;}
  toast('Ce joueur n’est plus suivi par le club.');
};
A.aiInfo=function(club,name){
  const t=S.teams.find(x=>x.name===club)||(S.euro&&S.euro.teams.find(x=>x.name===club));const x=t&&(t.sq||[]).find(q=>q.n===name);
  const lvl=t?Math.round(t.rating+(x?({A:1.5,M:.5,D:-.5}[x.pos]||0)+Math.min(4,(x.g+x.a)*.25):0)):null;
  const pos=x?x.pos:'M';
  UI.aiPick={club,name,pos,lvl};
  openModal(`<div class="kicker">Fiche joueur · ${esc(club)}</div><h2>${esc(name)}</h2>
   <div class="kpis"><div class="kpi"><div class="l">Poste</div><div class="v" style="font-size:18px">${POSN[pos]}</div></div>
   <div class="kpi"><div class="l">Club</div><div class="v" style="font-size:17px">${tc(club)}</div></div>
   <div class="kpi"><div class="l">Buts cette saison</div><div class="v">${x?x.g:'—'}</div></div><div class="kpi"><div class="l">Passes décisives</div><div class="v">${x?x.a:'—'}</div></div>
   <div class="kpi"><div class="l">Niveau estimé</div><div class="v">${lvl?'≈ '+lvl:'?'}</div><div class="muted" style="font-size:12px">d’après son équipe et ses statistiques</div></div></div>
   <p class="muted" style="margin:0;font-size:13px">Joueur d’un club adverse : vous ne connaissez de lui que ce que montrent les matchs. Le recruteur peut aller le voir de près et sonder son club.</p>
   <div class="row"><button class="btn pri" onclick="A.aiScout()">Envoyer le recruteur le superviser</button><button class="btn" onclick="A.close()">Fermer</button></div>`);
};
A.aiScout=function(){
  const a=UI.aiPick;if(!a)return;let p=(S.market||[]).find(m=>m.n0===a.name&&m.club===a.club);
  if(!p){const t=S.teams.find(x=>x.name===a.club);const d=t&&!t.user?S.div:clamp(S.div+1,0,6);
    p=genPlayer({div:d,pos:a.pos});const [fn,...ln]=a.name.split(' ');p.fn=fn;p.ln=ln.join(' ')||fn;p.n0=a.name;p.ovr=clamp(a.lvl||p.ovr,25,92);p.pot=Math.max(p.pot,p.ovr);
    p.fee=Math.round(valueFor(p,d)*rf(1.1,1.5)/100)*100;p.demand=Math.round(wageFor(p.ovr)*rf(1.05,1.4)/10)*10;p.club=a.club;p.pers=pick(PERS);p.firm=+rf(.82,.95).toFixed(2);p.lastYear=R()<.25;genHist(p,a.club,d);
    S.market.unshift(p);}
  p.scouted=true;p.potSeen=[p.pot,p.pot];save();closeModal();toast('Rapport du recruteur : '+a.name+' ajouté au marché (onglet Mercato).');setTimeout(()=>A.pinfo(p.id),60);
};
