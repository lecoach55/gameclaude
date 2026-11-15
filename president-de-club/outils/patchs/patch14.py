p='/home/claude/president/index.html';s=open(p).read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:80],s.count(a));s=s.replace(a,b)
rep("['coupe','Coupe'],","['coupe',S.euro?'Coupes':'Coupe'],")
rep("function vCoupe(){\n  const c=S.cup,e=CUP_ENTRY[S.div];\n  return `",
"""function vEuro(){
  const E=S.euro;if(!E){const ix=uefaIndex();return S.div>=5?`<div class="card"><header><h3>Europe</h3><span class="muted" style="font-size:13px">Indice UEFA ${ix}</span></header><p class="muted" style="margin:0">${S.div===6?'Qualification : 1er à 3e → Ligue des champions · 4e → tour préliminaire · 5e (ou vainqueur de la Coupe de France) → Ligue Europa · 6e → Ligue Conférence. Chaque saison européenne rapporte aussi une part des droits TV internationaux (indice UEFA) pendant trois ans.':'Le vainqueur de la Coupe de France est qualifié pour la Ligue Europa, même hors de la Ligue 1.'}</p></div>`:'';}
  const C=EURO[E.k],tb=euroTable(),r=tb.findIndex(t=>t.user)+1;
  const st={league:'Phase de ligue · J'+E.md+'/'+C.md,ko:E.ko?KO_N[E.ko.r]:'',out:'Éliminé',won:'Vainqueur !'}[E.phase];
  const nextW=E.phase==='league'?E.lpw[E.md]:E.phase==='ko'?E.ko.weeks[E.ko.leg]:null;
  const zone=i=>i<8?'eu1':i<24?'eu2':'eu3';
  return `<div class="card euro ${E.k}" style="--ec:${C.col}"><header><h3><span class="estar">${starSVG(C.col)}</span>${C.n} ${seasonLabel(S.year)}</h3><span class="pill ${E.phase==='out'?'b':E.phase==='won'?'g':'y'}">${st}</span></header>
   <div class="kpis"><div class="kpi"><div class="l">Gains européens</div><div class="v gold">${money(E.earned)}</div></div><div class="kpi"><div class="l">Classement phase de ligue</div><div class="v">${E.md?r+'<span class="muted" style="font-size:15px">/36</span>':'—'}</div></div><div class="kpi"><div class="l">Prochain match</div><div class="v" style="font-size:17px">${nextW?'après la J'+nextW+' ('+matchDate(nextW-1,true)+')':'—'}</div></div><div class="kpi"><div class="l">Indice UEFA</div><div class="v">${uefaIndex()}</div></div></div>
   ${E.phase==='ko'?`<div class="alert g">${KO_N[E.ko.r]} contre <b>${esc(E.ko.opp.name)}</b> (${E.ko.opp.c}, force ${Math.round(E.ko.opp.rating)})${E.ko.r==='f'?' · finale sur terrain neutre':E.ko.leg?' · match retour, cumul '+E.ko.agg[0]+'-'+E.ko.agg[1]:''}.</div>`:''}
   <p class="muted" style="margin:0;font-size:13px">Primes : participation ${money(C.part)}, victoire ${money(C.win)}, nul ${money(C.draw)}, puis 8es ${money(C.r16)}, quarts ${money(C.qf)}, demies ${money(C.sf)}, finale ${money(C.f)}, titre +${money(C.w)}. Top 8 qualifiés directement pour les 8es, 9e à 24e en barrages. Les matchs se jouent en semaine : la fraîcheur de l’effectif compte.</p></div>
  <div class="grid g2"><div class="card"><h3>Parcours</h3>${E.log.length?'<div class="tbl-wrap"><table><tbody>'+E.log.map(l=>`<tr><td class="muted">${l.r}</td><td>${l.home?'<span class="pill">Dom.</span>':'<span class="pill">Ext.</span>'}</td><td>${tc(l.opp)} <span class="flag">${l.c}</span></td><td class="r"><span class="resb ${l.res}">${l.home?l.gf+' - '+l.ga:l.ga+' - '+l.gf}</span>${l.tab?' <span class="muted" style="font-size:12px">t.a.b.</span>':''}</td></tr>`).join('')+'</tbody></table></div>':'<p class="muted">Premier match après la J'+E.lpw[0]+'.</p>'}</div>
  <div class="card"><h3>Phase de ligue</h3><div class="tbl-wrap" style="max-height:440px;overflow:auto"><table data-norank class="mini"><thead><tr><th>#</th><th>Club</th><th class="r">J</th><th class="r">Diff.</th><th class="r">Pts</th></tr></thead><tbody>${tb.map((t,i)=>`<tr class="${t.user?'me':''} ${zone(i)}"><td>${i+1}</td><td>${tc(t.name)} <span class="flag">${t.c}</span></td><td class="r">${t.P}</td><td class="r">${t.GF-t.GA>0?'+':''}${t.GF-t.GA}</td><td class="r"><b>${t.Pts}</b></td></tr>`).join('')}</tbody></table></div><p class="muted" style="font-size:12px;margin:6px 0 0"><span style="color:var(--good)">▌</span> 8es directs · <span style="color:var(--flood)">▌</span> barrages · <span style="color:var(--bad)">▌</span> éliminés</p></div></div>`;
}
function starSVG(c){return `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">${[0,72,144,216,288].map(a=>`<path d="M12 2l1.4 3.2 3.4.3-2.6 2.2.8 3.3L12 9.3 9 11l.8-3.3L7.2 5.5l3.4-.3z" transform="rotate(${a} 12 12) translate(0 -.5) scale(.5) translate(12 0)" fill="${c}"/>`).join('')}<circle cx="12" cy="12" r="3.2" fill="none" stroke="${c}" stroke-width="1.6"/></svg>`;}
function vCoupe(){
  const c=S.cup,e=CUP_ENTRY[S.div];
  return vEuro()+`""")
# calendrier : lignes européennes
rep("    for(let i=entry;i<12;i++){if(cupDay(i)!==w+1)continue;",
"""    if(S.euro){const E=S.euro,C=EURO[E.k];const lpi=E.lpw.indexOf(w+1);
      const lg=lpi>=0?E.log.find(l=>l.r==='J'+(lpi+1)):null;
      if(lpi>=0){const o=E.teams[E.opp[lpi]],hm=lpi%2===0;rows.push(`<tr class="eur" style="--ec:${C.col}"><td>${C.s}</td><td class="muted">${matchDate(w,true)}</td><td><span class="pill eu">J${lpi+1}</span></td><td>${tc(o.name)} <span class="flag">${o.c}</span> <span class="muted" style="font-size:12px">${hm?'à domicile':'à l’extérieur'}</span></td><td class="r">${lg?`<span class="resb ${lg.res}">${hm?lg.gf+' - '+lg.ga:lg.ga+' - '+lg.gf}</span>`:'<span class="muted">à venir</span>'}</td><td class="r muted" style="font-size:12px">force ${Math.round(o.rating)}</td></tr>`);}
      else{E.log.filter(l=>!/^J\\d/.test(l.r)&&l.w===w+1).forEach(l=>rows.push(`<tr class="eur" style="--ec:${C.col}"><td>${C.s}</td><td class="muted">${matchDate(w,true)}</td><td><span class="pill eu">${l.r}</span></td><td>${tc(l.opp)} <span class="flag">${l.c}</span></td><td class="r"><span class="resb ${l.res}">${l.home?l.gf+' - '+l.ga:l.ga+' - '+l.gf}</span></td><td></td></tr>`));
        if(E.phase==='ko'&&E.ko.weeks[E.ko.leg]===w+1)rows.push(`<tr class="eur" style="--ec:${C.col}"><td>${C.s}</td><td class="muted">${matchDate(w,true)}</td><td><span class="pill eu">${KO_N[E.ko.r]}</span></td><td>${tc(E.ko.opp.name)} <span class="flag">${E.ko.opp.c}</span></td><td class="r"><span class="muted">à venir</span></td><td class="r muted" style="font-size:12px">force ${Math.round(E.ko.opp.rating)}</td></tr>`);}}
    for(let i=entry;i<12;i++){if(cupDay(i)!==w+1)continue;""")
open(p,'w').write(s);print('ok')
