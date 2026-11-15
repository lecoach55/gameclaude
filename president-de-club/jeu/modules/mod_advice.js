/* ====================== Conseils du staff ====================== */
function advWho(role){const s=S.staff[role];
  if(s)return {name:s.name,title:ROLES[role].n,lvl:s.lvl};
  if(!S.flags.tresName){const n=genName();S.flags.tresName=n.fn+' '+n.ln;}
  return {name:S.flags.tresName,title:'Trésorier bénévole',lvl:0};}
function attAt(price){const L=LV[S.div];return Math.min(cap(),S.fans*(.45+S.mood/200)*clamp(Math.pow(tk()/price,1.1),.25,1.6));}
function gateAt(price){const a=attAt(price),ab=S.abo&&!S.abo.open?S.abo.n*.9:0;return Math.max(0,a-ab)*price+Math.max(a,ab)*BUV[S.infra.commerce];}
function bestTicket(){let b=S.ticket,bv=-1;const mx=Math.round(tk()*3);for(let p=1;p<=mx;p++){const v=gateAt(p)-(p>tk()*1.4?gateAt(p)*.04:0);if(v>bv){bv=v;b=p;}}return b;}
const noisy=(v,lvl,seed)=>lvl>=3?v:Math.max(1,Math.round(v*(1+(hashN(seed)-.5)*(lvl>=1?.2:.4))));
function staffAdvice(){
  const out=[],L=LV[S.div],hide=UI.advHide||{};
  const add=(key,role,pri,text,acts)=>{if(hide[key]===S.gw)return;out.push({key,who:advWho(role),pri,text,acts:acts||[]});};
  // billetterie
  if(S.week<S.N){const w=advWho('commercial'),b=noisy(bestTicket(),w.lvl,S.gw*7+1),cur=S.ticket;
    if(Math.abs(b-cur)>=Math.max(1,Math.round(cur*.08))){
      const up=b>cur;
      if(w.lvl===0)add('ticket','commercial',2,up?'Le stade se remplit bien : je pense qu’on pourrait monter un peu le prix du billet sans perdre de monde.':'Les gradins sonnent creux. On attirerait sans doute plus de monde en baissant un peu le prix.',[[up?'Monter de 1 €':'Baisser de 1 €',`A.ticket(${up?1:-1})`]]);
      else add('ticket','commercial',3,`Avec un billet à ${b} € au lieu de ${cur} €, on attendrait environ ${nf(Math.round(attAt(b)))} spectateurs et ${money(Math.round(gateAt(b)))} de recette par match à domicile (contre ${money(Math.round(gateAt(cur)))} aujourd’hui)${up&&b>tk()*1.4?' — attention, les supporters risquent de grincer':''}.`,[[`Passer à ${b} €`,`A.ticket(${b-cur})`]]);}}
  // abonnements
  if(S.abo&&S.abo.open){const w=advWho('commercial');let bp=S.abo.price,bv=-1;const f=aboFair();for(let p=Math.round(f*.35);p<=f*2;p+=Math.max(1,Math.round(f/60))){const n=aboDemand(p),v=n*p+(homeGames()*Math.max(0,attAt(S.ticket)-n*.9)*S.ticket)*.6;if(v>bv){bv=v;bp=p;}}
    bp=noisy(bp,w.lvl,S.year*3+5);if(Math.abs(bp-S.abo.price)>=Math.max(2,S.abo.price*.07))add('abo','commercial',4,`Pour la campagne d’abonnement, je viserais ${bp} € : environ ${nf(aboDemand(bp))} abonnés et ${money(aboDemand(bp)*bp)} encaissés tout de suite.`,[[`Fixer à ${bp} €`,`A.aboPrice(${bp});render()`]]);}
  // finances
  const pr=projection();
  if(pr<0){const st=strength(),inXI=new Set(st.xi.map(e=>e.p.id));const cand=S.players.filter(p=>!inXI.has(p.id)&&!p.loan).sort((a,b)=>b.wage-a.wage)[0];
    add('fin','commercial',5,`Au rythme actuel, on finira la saison à ${money(pr)}.${cand?` Le plus gros salaire hors du onze, c’est ${plk(cand.id,pname(cand))} (${money(cand.wage)}/mois) : le vendre ou le prêter soulagerait les comptes.`:''}${loanCap()>2000?' La banque peut aussi nous prêter jusqu’à '+money(loanCap())+'.':''}`,[...(cand?[[`Mettre ${pshort(cand)} en vente`,`A.list(${cand.id})`]]:[]),['Voir les finances',"A.tab('finances')"]]);}
  // effectif : postes dégarnis
  {const need={G:2,D:6,M:6,A:4},av=p=>!p.loan;const miss=Object.entries(need).filter(([k,n])=>S.players.filter(p=>p.pos===k&&av(p)).length<n);
    if(miss.length)add('gap','coach',4,`Il nous manque du monde : ${miss.map(([k,n])=>POSN[k].toLowerCase()+' ('+S.players.filter(p=>p.pos===k&&av(p)).length+'/'+n+')').join(', ')}. Une blessure et on est coincés.`,[['Aller au mercato',"A.tab('mercato')"]]);}
  // fraîcheur
  {const st=strength(),f=st.xi.reduce((a,e)=>a+e.p.fit,0)/Math.max(1,st.xi.length),inj=S.players.filter(p=>p.inj).length;
    if(f<78||inj>=3)add('fit','prepa',3,`Le groupe est ${f<78?'fatigué (forme moyenne du onze : '+Math.round(f)+' %)':'touché par les blessures ('+inj+' blessés)'}. ${S.euro&&S.euro.phase!=='out'?'Avec les matchs européens en semaine, il faut faire tourner.':'Évitons les matchs amicaux et les sollicitations en plus.'}${slvl('prepa')<3?' Un meilleur préparateur physique accélérerait la récupération.':''}`,[['Voir l’effectif',"A.tab('effectif')"]]);}
  // recrutement
  if(windowOpen()&&S.market&&S.market.length){const st=strength();const weak=[...st.xi].sort((a,b)=>a.p.ovr-b.p.ovr)[0];
    if(weak){const c=S.market.filter(p=>p.pos===weak.slot&&p.ovr>=weak.p.ovr+3&&interest(p)>=.3&&(p.fee||0)<=Math.max(0,S.cash)*.5).sort((a,b)=>(b.ovr-b.fee/1e5)-(a.ovr-a.fee/1e5))[0];
      if(c)add('recrue','recruteur',3,`J’ai repéré ${plk(c.id,pname(c))} (${POSN[c.pos].toLowerCase()}, ${c.age} ans, ${c.ovr}) : il ferait mieux que ${pshort(weak.p)} (${weak.p.ovr}). ${c.fee?'Indemnité demandée : '+money(c.fee)+'.':'Il est libre.'}`,[['Voir sa fiche',`A.pinfo(${c.id})`],['Négocier',`A.nego(${c.id})`]]);}}
  // contrats
  {const st=strength(),inXI=new Set(st.xi.map(e=>e.p.id));const k=S.players.filter(p=>p.contract<=1&&!p.loan&&(inXI.has(p.id)||p.pot-p.ovr>=8)).sort((a,b)=>b.ovr-a.ovr)[0];
    if(k&&S.week>=4)add('contrat','coach',3,`Le contrat de ${plk(k.id,pname(k))} se termine en fin de saison. ${inXI.has(k.id)?'C’est un titulaire : ne le laissons pas partir libre.':'Il a un vrai potentiel : prolongeons-le avant que d’autres clubs ne s’en mêlent.'}`,[['Prolonger',`A.renew(${k.id})`]]);}
  // jeunes
  {const y=S.players.filter(p=>p.age<=21&&p.pot-p.ovr>=10&&!p.loan&&(p.s?p.s.mj+p.s.cmj:0)<=1&&S.week>=6).sort((a,b)=>b.pot-a.pot)[0];
    if(y)add('jeune','formateur',2,`${plk(y.id,pname(y))} (${y.age} ans) a un gros potentiel mais ne joue pas. ${S.reserve?'Il joue en réserve, mais un prêt le ferait progresser plus vite.':'Un prêt ou une équipe réserve lui donnerait du temps de jeu.'}`,[['Le prêter',`A.loanOut(${y.id})`]]);}
  // supporters
  if(S.ultras&&S.ultras.rel<35)add('ultras','commercial',3,`Les ${esc(S.ultras.name)} sont remontés (relation ${Math.round(S.ultras.rel)}/100). ${S.ticket>tk()*1.15?'Le prix des places les agace particulièrement. ':''}Une rencontre avec leurs leaders calmerait le jeu.`,[['Les rencontrer','A.ultraMeet()']]);
  // installations rentables
  {const c=buildCost('commerce');if(c&&!buildBlocked('commerce')&&!S.builds.some(b=>b.key==='commerce')){const lv=S.infra.commerce+1,gain=(S.fans*(MERCH[lv]-MERCH[lv-1])*(1+S.div*.4))+homeGames()*attAt(S.ticket)*(BUV[lv]-BUV[lv-1]);
    if(gain>0&&c/gain<=2.2&&S.cash>c*1.3)add('commerce','commercial',2,`Agrandir la buvette et la boutique (${money(c)}) rapporterait environ ${money(Math.round(gain))} par saison : remboursé en ${(c/gain).toFixed(1).replace('.',',')} saison${c/gain>=2?'s':''}.`,[['Voir les installations',"A.tab('infra')"]]);}}
  // licence
  if(L.promo&&S.div>=1&&S.div<6){const it=licenceItems(S.div+1).filter(x=>!x.admin&&!x.bd&&x.w<=S.N-S.week&&x.w>=S.N-S.week-3);
    if(it.length)add('licence','commercial',4,`Dernier moment pour lancer « ${it[0].l} » si on veut être en règle pour une éventuelle montée : ${it[0].w} semaines de travaux.`,[['Voir les installations',"A.tab('infra')"]]);}
  return out.sort((a,b)=>b.pri-a.pri);
}
A.advHide=function(k){UI.advHide=UI.advHide||{};UI.advHide[k]=S.gw;render();};
function adviceCard(){
  const a=staffAdvice().slice(0,4);if(!a.length)return '';
  return `<div class="card advice"><header><h3>Le staff vous conseille</h3><span class="muted" style="font-size:12.5px">${a.length} conseil${a.length>1?'s':''}</span></header>
   ${a.map(x=>`<div class="adv"><div class="adv-who">${avatar(x.who.name,x.who.lvl)}<div><b>${esc(x.who.name)}</b><small>${esc(x.who.title)}${x.who.lvl?' · '+'★'.repeat(x.who.lvl):''}</small></div></div>
    <p>« ${x.text} »</p><div class="row" style="gap:6px">${x.acts.map(([l,f])=>`<button class="btn sm pri" onclick="${f}">${esc(l)}</button>`).join('')}<button class="btn sm" onclick="A.advHide('${x.key}')">Ignorer</button></div></div>`).join('')}
   <p class="muted" style="margin:0;font-size:12px">Un staff de bon niveau donne des chiffres précis ; un bénévole n’a que son intuition.</p></div>`;
}
function advInline(keys){const a=staffAdvice().filter(x=>keys.includes(x.key));return a.map(x=>`<div class="adv inline"><div class="adv-who">${avatar(x.who.name,x.who.lvl)}<div><b>${esc(x.who.name)}</b><small>${esc(x.who.title)}</small></div></div><p>« ${x.text} »</p><div class="row" style="gap:6px">${x.acts.map(([l,f])=>`<button class="btn sm pri" onclick="${f}">${esc(l)}</button>`).join('')}</div></div>`).join('');}
