
/* ====================== Partenariats : prospection de sponsors ====================== */
// part de la valeur de sponsoring du club (S.spPot) rapportée par chaque emplacement ; le reste = petits partenaires
const SPSLOT={
 maillot:{n:'Sponsor maillot (poitrine)',sh:.30,ic:'👕'},
 dos:{n:'Dos du maillot',sh:.08,ic:'🔢'},
 manche:{n:'Manche',sh:.08,ic:'💪'},
 short:{n:'Short',sh:.06,ic:'🩳'},
 panneaux:{n:'Panneaux du stade',sh:.16,ic:'🪧'},
 hospi:{n:'Loges et hospitalités',sh:.10,ic:'🥂',need:()=>S.infra.loges>=1}
};
const SP_BRANDS=['Novalis','Altéa','Vernier','Kelvion','Orcéa','Mistral','Arvalis','Solvane','Brévia','Lumen','Cardinal','Optimo','Hexa','Valmont','Equinox'];
const SP_NAT=['Assurances','Énergie','Banque','Télécoms','Paris sportifs','Distribution','Automobile','Transport'];
function spBrand(){
  const sec=TP().sec;
  if(S.div>=4&&R()<.55){const t=pick(SP_NAT);return {b:pick(SP_BRANDS)+' '+t,s:t+' (groupe national)'};}
  const s=pick(sec);return {b:s+' '+pick(LAST),s:s+(S.terr?' ('+S.terr.n+')':'')};
}
function spSlots(){return Object.keys(SPSLOT).filter(k=>!SPSLOT[k].need||SPSLOT[k].need());}
function spVal(k,q){return Math.round(S.spPot*SPSLOT[k].sh*q/100)*100;}
function spSmallShare(){return 1-spSlots().reduce((a,k)=>a+SPSLOT[k].sh,0);}
function spInit(){if(!S.spons&&S.sponsorAnnual&&S.N)spSeason();}
function spTotal(){const C=S.spons||{};return Math.round(S.spPot*spSmallShare()+spSlots().reduce((a,k)=>a+(C[k]?spVal(k,C[k].q):0),0));}
function spApply(){const prev=S.spLast||0,mod=prev>0?S.sponsorAnnual/prev:1;S.spLast=spTotal();S.sponsorAnnual=Math.round(S.spLast*clamp(mod,.5,1.5));}
// début de saison : contrats indexés sur la division, échéances, reconductions
function spSeason(){
  S.spPot=S.sponsorAnnual;S.spLast=0;S.spOff=null;S.spTried={};
  if(!S.spons){S.spons={};spSlots().forEach(k=>{const br=spBrand();S.spons[k]={b:br.b,s:br.s,q:+rf(.95,1.06).toFixed(2),until:S.year+ri(0,2),from:S.year};});}
  const C=S.spons,who=advWho('commercial');
  for(const k of Object.keys(C)){const c=C[k];if(!c||S.year<=c.until)continue;
    if(c.next){C[k]=c.next;news('Nouveau partenaire « '+SPSLOT[k].n.toLowerCase()+' » : '+C[k].b+' ('+money(spVal(k,C[k].q))+' par saison).','g');}
    else{const q=+Math.max(.85,c.q*rf(.96,1.03)).toFixed(2);C[k]={b:c.b,s:c.s,q,until:S.year+ri(0,1),from:S.year,auto:1};
      news(who.name+' reconduit '+c.b+' (« '+SPSLOT[k].n.toLowerCase()+' ») faute d’alternative'+(q<c.q?', à des conditions un peu moins bonnes':'')+'.','');}
  }
  spSlots().forEach(k=>{if(C[k]===undefined)C[k]=null;});
  S.sponsorAnnual=spTotal();S.spLast=S.sponsorAnnual;
}
function spOffers(k){
  const w=advWho('commercial'),lvl=w.lvl,n=1+Math.ceil(lvl/2);
  const form=(S.myResults||[]).slice(-5).reduce((a,r)=>a+(r.res==='V'?1:r.res==='D'?-1:0),0);
  const out=[];
  for(let i=0;i<n;i++){const br=spBrand(),dur=ri(1,4);
    let q=rf(.72,1.08)+.045*lvl+(S.mood-60)/500+form*.012+(S.rep-30)/600;
    q*=1-.025*(dur-1);q=+clamp(q,.6,1.4).toFixed(2);
    const cl=R()<.4&&LV[S.div].promo?{t:'prime de montée',v:Math.round(spVal(k,q)*rf(.2,.5)/100)*100}:null;
    out.push({b:br.b,s:br.s,q,dur,cl,id:i});}
  return out.sort((a,b)=>b.q-a.q);
}
function spSign(k,o){
  const C=S.spons,c=C[k],start=c&&S.year<=c.until?c.until+1:S.year;
  const ct={b:o.b,s:o.s,q:o.q,until:start+o.dur-1,from:start,cl:o.cl||null};
  if(start>S.year){c.next=ct;news('Accord signé avec '+o.b+' (« '+SPSLOT[k].n.toLowerCase()+' ») à partir de la saison '+seasonLabel(start)+'.','g');}
  else{C[k]=ct;spApply();news('Nouveau partenaire « '+SPSLOT[k].n.toLowerCase()+' » : '+o.b+', '+money(spVal(k,o.q))+' par saison jusqu’en '+(ct.until+1)+'.','g');}
}
function spFree(k){const c=S.spons&&S.spons[k];return !c||(c.until<=S.year&&!c.next);}
function spPrice(k){return Math.round(Math.max(150,S.spPot*.004)/50)*50;}
A.spProspect=function(k){
  if(!spFree(k)){toast('Cet emplacement est déjà sous contrat.');return;}
  S.spTried=S.spTried||{};
  if(S.spTried[k]===S.gw&&S.spOff&&S.spOff.k===k){A.spShow();return;}
  if(S.spTried[k]===S.gw){toast('Déjà démarché cette semaine : retentez après la prochaine journée.');return;}
  const c=spPrice(k);if(S.cash<c){toast('Trésorerie insuffisante.');return;}
  fin('Démarchage commercial',-c);S.spTried[k]=S.gw;S.spOff={k,gw:S.gw,list:spOffers(k)};save();A.spShow();
};
A.spShow=function(){
  const o=S.spOff;if(!o){return;}const k=o.k,w=advWho('commercial'),c=S.spons[k];
  UI.curModalFn=()=>A.spShow();
  const rows=o.list.length?o.list.map(x=>`<div class="sp-off"><div><b>${esc(x.b)}</b> <span class="muted">· ${esc(x.s)}</span><br>
     <span class="gold"><b>${money(spVal(k,x.q))}</b> par saison</span> · ${x.dur} saison${x.dur>1?'s':''}${x.cl?' · '+x.cl.t+' : '+money(x.cl.v):''}
     <span class="pill ${x.q>=1.1?'g':x.q<.9?'b':'y'}">${x.q>=1.1?'au-dessus du marché':x.q<.9?'en dessous du marché':'prix du marché'}</span></div>
     <div class="row"><button class="btn sm" onclick="A.spNeg(${x.id})">Négocier +10 %</button><button class="btn sm pri" onclick="A.spOk(${x.id})">Signer</button></div></div>`).join('')
   :'<p class="muted">Plus aucune offre sur la table. Retentez la semaine prochaine.</p>';
  openModal(`<h2>${SPSLOT[k].ic} Démarchage : ${esc(SPSLOT[k].n.toLowerCase())}</h2>
   <p class="muted">${esc(w.name)}, ${esc(w.title.toLowerCase())}, a rencontré des entreprises${S.terr?' de '+esc(S.terr.n)+' et des environs':''}. Valeur de marché de l’emplacement : environ ${money(spVal(k,1))} par saison.${c&&c.until===S.year?' Le contrat actuel avec '+esc(c.b)+' se termine en fin de saison : un nouvel accord démarrera la saison prochaine.':''}</p>
   ${rows}<p class="muted" style="font-size:12.5px">Les montants sont indexés sur la division : ils montent si le club monte et baissent en cas de descente. ${w.lvl>=3?'':'Un meilleur directeur commercial décrocherait plus d’offres et de meilleurs montants.'}</p>
   <div class="row"><button class="btn" onclick="A.close()">Fermer</button></div>`,true);
};
A.spOk=function(id){const o=S.spOff;if(!o)return;const x=o.list.find(y=>y.id===id);if(!x)return;spSign(o.k,x);S.spOff=null;save();UI.curModalFn=null;closeModal();toast('Contrat signé avec '+x.b+'.');};
A.spNeg=function(id){const o=S.spOff;if(!o)return;const x=o.list.find(y=>y.id===id);if(!x)return;
  if(x.neg){toast('Il a déjà fait un effort.');return;}
  const ch=.5+.05*advWho('commercial').lvl-(x.q>1.15?.15:0);x.neg=1;
  if(R()<ch){x.q=+(x.q*1.1).toFixed(2);toast(x.b+' accepte : '+money(spVal(o.k,x.q))+' par saison.');}
  else{o.list=o.list.filter(y=>y!==x);toast(x.b+' se retire des discussions.');}
  save();A.spShow();};
function spTick(){
  spInit();if(!S.spons)return;const D=dlg();
  if(S.infra.loges>=1&&S.spons.hospi===undefined){S.spons.hospi={b:'Club des partenaires locaux',s:'Entreprises du coin',q:.9,until:S.year,from:S.year};spApply();news('Les nouvelles loges accueillent leurs premiers partenaires. Démarchez des entreprises pour la saison prochaine (Finances > Partenariats).','g');}
  if(D.spons){for(const k of spSlots()){if(!spFree(k))continue;const c=S.spons[k];if(c&&S.week<S.N-10)continue;
      S.spTried=S.spTried||{};if(S.spTried[k]===S.gw)continue;S.spTried[k]=S.gw;
      const lvl=advWho('commercial').lvl,offs=spOffers(k),best=offs[0];fin('Démarchage commercial',-spPrice(k));
      if(best&&best.q>=.92-.02*lvl){spSign(k,best);dlgLog(advWho('commercial').name+' signe '+best.b+' (« '+SPSLOT[k].n.toLowerCase()+' », '+money(spVal(k,best.q))+'/saison).');}
      break;}}
  // alerte d'échéance
  if(S.week===S.N-8)spSlots().forEach(k=>{const c=S.spons[k];if(c&&c.until===S.year&&!c.next&&!D.spons)news('Le contrat « '+SPSLOT[k].n.toLowerCase()+' » avec '+c.b+' se termine en fin de saison : pensez à démarcher (onglet Finances), sinon il sera reconduit tel quel ou à la baisse.','');});
}
function spCard(){
  spInit();if(!S.spons)return '';const C=S.spons;
  const rows=Object.keys(SPSLOT).map(k=>{const sl=SPSLOT[k],c=C[k],ok=!sl.need||sl.need();
    if(!ok)return `<tr><td>${sl.ic} ${sl.n}</td><td colspan="3" class="muted">Construisez des loges VIP (Installations) pour vendre des hospitalités.</td><td></td></tr>`;
    const ends=c&&c.until===S.year;
    return `<tr><td>${sl.ic} ${sl.n}</td><td>${c?`<b>${esc(c.b)}</b><br><span class="muted" style="font-size:12px">${esc(c.s)}</span>`:'<span class="bad">Emplacement libre</span>'}</td>
      <td class="r">${c?money(spVal(k,c.q)):'—'}${c&&c.cl?'<br><span class="muted" style="font-size:12px">+ '+esc(c.cl.t)+' '+money(c.cl.v)+'</span>':''}</td>
      <td>${c?(ends?'<span class="pill y">fin de saison</span>':'jusqu’en '+(c.until+1)):''}${c&&c.next?'<br><span class="pill g">'+esc(c.next.b)+' ensuite</span>':''}</td>
      <td>${spFree(k)?`<button class="btn sm ${!c?'pri':''}" onclick="A.spProspect('${k}')">Démarcher · ${money(spPrice(k))}</button>`:''}</td></tr>`;}).join('');
  return `<div class="card"><header><h3>🤝 Partenariats</h3><span class="muted" style="font-size:13px">Petits partenaires locaux : ${money(Math.round(S.spPot*spSmallShare()))} / saison</span></header>
   <p class="muted" style="margin:0 0 6px;font-size:13px">Chaque emplacement se vend à une entreprise. Démarchez quand un emplacement est libre ou que son contrat se termine : le nombre d’offres et leur niveau dépendent de votre directeur commercial, de vos résultats et de l’ambiance au club.${dlgOn('spons')?' <b>Délégué au commercial.</b>':''}</p>
   <div class="tbl-wrap"><table><thead><tr><th>Emplacement</th><th>Partenaire</th><th class="r">Par saison</th><th>Contrat</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}
DELEG.push({k:'spons',role:'commercial',n:'Partenariats',d:'Démarche les entreprises dès qu’un emplacement est libre ou que son contrat se termine, et signe la meilleure offre correcte.'});
// prime de montée prévue au contrat
function spPromo(){if(!S.spons)return;Object.keys(S.spons).forEach(k=>{const c=S.spons[k];if(c&&c.cl&&c.cl.t==='prime de montée'&&!c.cl.paid){c.cl.paid=1;fin('Sponsors',c.cl.v);news(c.b+' verse la prime de montée prévue au contrat : '+money(c.cl.v)+'.','g');}});}
EVENTS.spSpont={w:1.1,cond:()=>S.spons&&S.week>3&&spSlots().some(k=>spFree(k))&&!dlgOn('spons'),
  make:()=>{const ks=spSlots().filter(k=>spFree(k));const k=pick(ks);const br=spBrand();return {k,b:br.b,s:br.s,q:+rf(.95,1.2).toFixed(2),dur:ri(2,3)};},k:'Partenaires',
  title:d=>'Une entreprise veut s’afficher',
  text:d=>`${d.b} (${d.s}) contacte le club de lui-même : il veut l’emplacement « ${SPSLOT[d.k].n.toLowerCase()} » pour ${d.dur} saisons, à ${money(spVal(d.k,d.q))} par saison.`,
  ch:[{t:'Signer tout de suite',f:d=>{spSign(d.k,{b:d.b,s:d.s,q:d.q,dur:d.dur});return 'Contrat signé avec '+d.b+'.';}},
      {t:'Décliner et démarcher d’autres entreprises',f:()=>'Vous gardez la main. Rendez-vous dans Finances > Partenariats.'}]};
