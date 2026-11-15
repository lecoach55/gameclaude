/* ====================== Rapport d'effectif (qui vendre, quels postes recruter) ====================== */
function squadAnalysis(){
  const st=strength(),inXI=new Set(st.xi.map(e=>e.p.id)),L=LV[S.div],mid=(L.str[0]+L.str[1])/2;
  const need={G:2,D:6,M:6,A:4},avail=S.players.filter(p=>!p.loan);
  const pos={};
  for(const k of ['G','D','M','A']){
    const ps=avail.filter(p=>p.pos===k).sort((a,b)=>b.ovr-a.ovr);const starters=st.xi.filter(e=>e.slot===k).map(e=>e.p);
    const sAvg=starters.length?starters.reduce((a,p)=>a+p.ovr,0)/starters.length:0;
    const exp=ps.filter(p=>p.contract<=1).length,old=ps.filter(p=>p.age>=31).length;
    let score=0;const why=[];
    if(ps.length<need[k]){score+=3*(need[k]-ps.length);why.push('effectif trop court ('+ps.length+'/'+need[k]+')');}
    if(sAvg&&sAvg<mid-1){score+=2;why.push('titulaires en dessous du niveau de la division ('+Math.round(sAvg)+' contre '+Math.round(mid)+')');}
    if(exp>=2){score+=1;why.push(exp+' contrats qui expirent');}
    if(old>=2){score+=1;why.push(old+' joueurs de plus de 30 ans');}
    const weak=starters.length?starters.reduce((a,p)=>p.ovr<a.ovr?p:a,starters[0]):null;
    pos[k]={k,ps,starters,sAvg,score,why,weak,surplus:ps.length-need[k]};
  }
  // à vendre / prêter
  const sell=[];
  avail.forEach(p=>{if(inXI.has(p.id))return;const P=pos[p.pos];const mj=p.s?p.s.mj+p.s.cmj:0,v=valueFor(p);let r=null,act=null;
    if(p.age<=21&&p.pot-p.ovr>=8){r='Jeune à fort potentiel qui ne joue pas : un prêt le ferait progresser.';act='loan';}
    else if(p.age>=31&&p.ovr<P.sAvg-2){r='En fin de carrière et en dessous des titulaires : sa valeur ne fera que baisser.';act='sell';}
    else if(P.surplus>=2&&p===P.ps[P.ps.length-1]){r='Le moins bon d’un poste où l’effectif est trop fourni.';act='sell';}
    else if(p.wage>wageBill()/Math.max(1,avail.length)*1.6&&mj<=S.week*.3){r='Gros salaire pour un joueur qui joue peu.';act='sell';}
    if(r)sell.push({p,r,act,v,save:p.wage});});
  sell.sort((a,b)=>(b.act==='sell')-(a.act==='sell')||b.save-a.save);
  const rec=Object.values(pos).filter(x=>x.score>=2).sort((a,b)=>b.score-a.score);
  return {pos,sell:sell.slice(0,5),rec,mid};
}
function srCandidates(k,P,lvl){
  const target=Math.max(P.weak?P.weak.ovr+2:0,P.sAvg);const budget=Math.max(0,S.cash)*.5;
  return (S.market||[]).filter(p=>p.pos===k&&p.ovr>=target-(P.ps.length<({G:2,D:6,M:6,A:4})[k]?4:0)&&(p.fee||0)<=budget&&interest(p)>=.25)
    .sort((a,b)=>(b.ovr-(b.fee||0)/Math.max(1,LV[S.div].spons)*4+(lvl>=3?(b.pot-b.ovr)*.3:rf(-2,2)))-(a.ovr-(a.fee||0)/Math.max(1,LV[S.div].spons)*4+(lvl>=3?(a.pot-a.ovr)*.3:rf(-2,2)))).slice(0,lvl>=2?2:1);
}
A.squadReport=function(auto){
  const w=advWho('recruteur'),an=squadAnalysis(),lvl=w.lvl;
  const recHtml=an.rec.length?an.rec.map(P=>{const c=srCandidates(P.k,P,lvl);
    return `<div class="sr-pos"><div class="spread"><b>${POSN[P.k]}${P.k==='G'?'':'s'}</b><span class="pill ${P.score>=4?'b':'y'}">Priorité ${P.score>=4?'haute':'moyenne'}</span></div>
     <div class="muted" style="font-size:13px">${P.why.join(' · ')}.${P.weak?' Titulaire le plus faible : '+plk(P.weak.id,pname(P.weak))+' ('+P.weak.ovr+').':''}</div>
     <div style="font-size:13.5px">Profil recherché : ${P.k==='G'?'gardien':POSN[P.k].toLowerCase()} de ${P.score>=4?'niveau titulaire':'rotation'}, note ${Math.round(Math.max(an.mid,P.sAvg)+1)} ou plus${P.ps.some(p=>p.age>=31)?', plutôt jeune':''}.</div>
     ${c.length?c.map(p=>`<div class="sr-cand"><span>${plk(p.id,pname(p))} · ${p.age} ans · <b>${p.ovr}</b>${lvl>=3?' (pot. '+potTxt(p)+')':''} · ${p.fee?money(p.fee):'libre'} · ${money(p.demand)}/mois</span><button class="btn sm pri" onclick="A.close();setTimeout(()=>A.nego(${p.id}),40)">Négocier</button></div>`).join(''):'<div class="muted" style="font-size:13px">Rien d’intéressant sur le marché pour l’instant'+(lvl<2?' (un meilleur recruteur en trouverait davantage)':'')+'.</div>'}</div>`;}).join('')
    :'<p class="muted" style="margin:0">L’effectif est équilibré : pas de besoin urgent.</p>';
  const sellHtml=an.sell.length?an.sell.map(x=>`<div class="sr-cand"><span>${plk(x.p.id,pname(x.p))} · ${POSN[x.p.pos].toLowerCase()}, ${x.p.age} ans, ${x.p.ovr} · valeur ${money(x.v)} · ${money(x.save)}/mois<br><span class="muted" style="font-size:12.5px">${x.r}</span></span>${x.act==='loan'?`<button class="btn sm" onclick="A.close();setTimeout(()=>A.loanOut(${x.p.id}),40)">Prêter</button>`:`<button class="btn sm ${x.p.listed?'':'pri'}" onclick="A.list(${x.p.id});A.squadReport()">${x.p.listed?'Retirer de la vente':'Mettre en vente'}</button>`}</div>`).join('')
    :'<p class="muted" style="margin:0">Personne à vendre en priorité.</p>';
  UI.curModalFn=()=>A.squadReport();
  openModal(`<div class="kicker">Rapport d’effectif · ${wkLabel()}</div>
   <div class="adv-who">${avatar(w.name,w.lvl)}<div><b>${esc(w.name)}</b><small>${esc(w.title)}${lvl?' · '+'★'.repeat(lvl):''}</small></div></div>
   <h2>Qui vendre, quels postes renforcer</h2>
   <div class="sr-grid">${['G','D','M','A'].map(k=>{const P=an.pos[k];return `<div class="sr-box ${P.score>=4?'bad':P.score>=2?'warn':'ok'}"><b>${k}</b><span>${P.ps.length} joueurs</span><span>titulaires ${P.sAvg?Math.round(P.sAvg):'—'}</span></div>`;}).join('')}</div>
   <h3>Postes à renforcer</h3>${recHtml}
   <h3>Joueurs à vendre ou à prêter</h3>${sellHtml}
   <p class="muted" style="margin:0;font-size:12.5px">${lvl>=3?'Rapport détaillé d’un recruteur expérimenté.':lvl>=1?'Un meilleur recruteur verrait le potentiel des joueurs et trouverait plus de pistes.':'Sans recruteur, c’est un bénévole qui fait ce point : ses pistes sont limitées.'}${windowOpen()?'':' Le mercato est fermé : les transferts avec indemnité attendront la prochaine fenêtre.'}</p>
   <div class="row"><button class="btn" onclick="A.close()">Fermer</button></div>`,true);
};
