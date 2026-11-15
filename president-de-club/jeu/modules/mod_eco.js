/* ====================== Abonnements de saison ====================== */
const homeGames=()=>Math.ceil((S.N||22)/2);
function aboFair(){return Math.round(LV[S.div].tick*homeGames()*.72);}
function aboDemand(price){
  const L=LV[S.div],last=S.history[0];
  const succ=last?(last.out==='up'?.06:last.out==='down'||last.out==='dncg'?-.05:0)+(last.pos<=3?.03:0):0;
  const base=S.fans*clamp(.16+S.mood/420+succ+(S.ultras?.03:0),.06,.5);
  const f=clamp(Math.pow(aboFair()/Math.max(1,price),1.5),.08,1.7);
  const loyal=S.abo&&S.abo.prevN?S.abo.prevN*.25:0;
  return Math.round(Math.min(cap()*.78,base*f+loyal*Math.min(1,f)));
}
function aboClose(){
  const A_=S.abo;if(!A_||!A_.open)return;
  A_.open=false;A_.n=aboDemand(A_.price);
  const prev=A_.prevPrice;if(prev&&A_.price>prev*1.15){S.mood=clamp(S.mood-5,0,100);news('Hausse des abonnements mal vécue par les fidèles.','b');}
  if(A_.n){fin('Abonnements',A_.n*A_.price);news('Campagne d’abonnement close : '+nf(A_.n)+' abonnés à '+A_.price+' € ('+money(A_.n*A_.price)+' encaissés).','g');}
}
A.aboPrice=function(v){if(!S.abo||!S.abo.open)return;S.abo.price=Math.max(10,Math.round(+v));const el=document.getElementById('aboSim');if(el)el.innerHTML=aboSimTxt();const pv=document.getElementById('aboPv');if(pv)pv.textContent=S.abo.price+' €';};
function aboSimTxt(){const n=aboDemand(S.abo.price),pm=S.abo.price/homeGames();return `≈ <b class="gold">${nf(n)}</b> abonnés · recette immédiate <b class="gold">${money(n*S.abo.price)}</b> · soit ${pm.toFixed(1).replace('.',',')} € par match (billet : ${S.ticket} €) · ${Math.round(n/cap()*100)} % du stade`;}
function aboCard(){
  const A_=S.abo;if(!A_)return '';const fair=aboFair();
  if(A_.open)return `<div class="card hl"><header><h3>Campagne d’abonnement ${seasonLabel(S.year)}</h3><span class="pill y">ouverte jusqu’à la J1</span></header>
   <p style="margin:0;font-size:14px">Fixez le prix de l’abonnement (${homeGames()} matchs à domicile). La recette tombe d’un coup avant la reprise, les abonnés viennent à chaque match mais ne paient plus de billet. Prix de référence : <b>${fair} €</b>.</p>
   <label class="fld" for="aboR">Prix de l’abonnement : <b id="aboPv" class="gold">${A_.price} €</b></label>
   <input type="range" id="aboR" min="${Math.max(10,Math.round(fair*.35))}" max="${Math.round(fair*2)}" step="1" value="${A_.price}" oninput="A.aboPrice(this.value)">
   <div id="aboSim" class="muted" style="font-size:13px">${aboSimTxt()}</div></div>`;
  return `<div class="card"><header><h3>Abonnés ${seasonLabel(S.year)}</h3><b class="gold num">${nf(A_.n)}</b></header><p class="muted" style="margin:0;font-size:13px">${A_.price} € l’abonnement · ${money(A_.n*A_.price)} encaissés avant la reprise · ${Math.round(A_.n/cap()*100)} % de la capacité. La prochaine campagne ouvrira à l’intersaison.</p></div>`;
}

/* ====================== Budget prévisionnel ====================== */
function budgetBuild(){
  const L=LV[S.div],N=S.N,i=S.infra,hg=homeGames(),ag=N-hg;
  const att=Math.min(cap(),S.fans*(.45+S.mood/200)*clamp(Math.pow(L.tick/S.ticket,1.1),.25,1.6));
  const aboP=S.abo?S.abo.n*.9:0,tix=Math.max(0,att-aboP);
  const b={inc:{},exp:{}},I=(k,v)=>{if(v>0)b.inc[k]=Math.round(v);},E=(k,v)=>{if(v>0)b.exp[k]=Math.round(v);};
  I('Sponsors',S.sponsorAnnual+S.sponsorBonus+S.naming);I('Subventions',L.sub*S.subsidyMult);
  I('Droits TV',L.tv+(S.flags.tvLocal||0));if(S.div===6)I('Droits TV (indice UEFA)',uefaIndex()*2.4e6);
  I('Abonnements',S.abo?S.abo.n*S.abo.price:0);I('Billetterie',tix*S.ticket*hg);I('Buvette',att*BUV[i.commerce]*hg);
  I('Boutique & maillots',S.fans*MERCH[i.commerce]*(1+S.div*.4)*(S.flags.kitShare?1.5:1));if(i.loges)I('Loges & VIP',LOGES[i.loges]*(1+S.div*.25)*hg);
  if(S.euro)I('Compétitions européennes',EURO[S.euro.k].part+EURO[S.euro.k].win*3);
  E('Salaires joueurs',wageBill()*12);E('Salaires staff',staffBill()*12);E('Entretien des installations',S.invested*.025+MAINT[S.div]);
  if(i.formation)E('Centre de formation',INFRA.formation.run[i.formation]);if(S.flags.fem)E('Section féminine',FEMCOST[S.div]);if(S.reserve)E('Équipe réserve',RESCOST[S.div]);
  E('Déplacements',TRAVEL[S.div]*ag);
  b.ti=Object.values(b.inc).reduce((a,c)=>a+c,0);b.te=Object.values(b.exp).reduce((a,c)=>a+c,0);b.res=b.ti-b.te;b.y=S.year;
  return b;
}
function budgetCard(){
  const B=S.budget;if(!B||B.y!==S.year)return '';
  const inc=S.sf.inc,exp=S.sf.exp,prog=S.week/S.N;
  const row=(k,v,real,good)=>{const pc=v?real/v:0,exp_=prog;const st=good?(pc>=exp_*.95?'good':pc<exp_*.8?'bad':''):(pc<=exp_*1.05?'good':pc>exp_*1.2?'bad':'');
    return `<tr><td>${esc(k)}</td><td class="r muted">${money(v)}</td><td class="r ${st}">${money(real||0)}</td><td style="width:34%"><div class="bmeter"><i style="width:${clamp(pc*100,0,100)}%" class="${st}"></i><b style="left:${prog*100}%"></b></div></td></tr>`;};
  const ti=Object.values(inc).reduce((a,b)=>a+b,0),te=Object.values(exp).reduce((a,b)=>a+b,0);
  return `<div class="card"><header><h3>Budget prévisionnel ${seasonLabel(S.year)}</h3><span class="muted" style="font-size:13px">voté en AG · résultat prévu <b class="${B.res<0?'bad':'good'}">${money(B.res)}</b></span></header>
   <div class="tbl-wrap"><table class="mini"><thead><tr><th>Poste</th><th class="r">Budget</th><th class="r">Réalisé</th><th>Avancement (repère : ${Math.round(prog*100)} % de la saison)</th></tr></thead><tbody>
   ${Object.entries(B.inc).map(([k,v])=>row(k,v,inc[k],true)).join('')}
   ${Object.entries(B.exp).map(([k,v])=>row(k,v,exp[k],false)).join('')}
   <tr class="me"><td><b>Résultat</b></td><td class="r"><b>${money(B.res)}</b></td><td class="r"><b class="${ti-te<0?'bad':'good'}">${money(ti-te)}</b></td><td class="muted" style="font-size:12px">Fin de saison prévue : ${money(projection()-(S.cashStart??S.cash))}</td></tr></tbody></table></div>
   <p class="muted" style="margin:0;font-size:12.5px">Tenir le budget rassure les adhérents (+3 de confiance en fin de saison) ; un résultat très en dessous de la prévision leur coûte confiance (−4). Les achats, ventes et travaux ne sont pas budgétés : ce sont des décisions d’investissement.</p></div>`;
}

/* ====================== Clauses et revente ====================== */
function resaleTick(){
  // à l'intersaison, les clubs acheteurs revendent parfois nos anciens joueurs : on touche le pourcentage prévu
  (S.sellOn||[]).forEach(x=>{if(x.done)return;if(S.year>x.until){x.done=true;return;}
    if(R()<.3){const fee=Math.round(x.base*rf(1.2,3.2)/1000)*1000,amt=Math.round(fee*x.pct);fin('Pourcentages à la revente',amt);x.done=true;news(x.n+' est revendu '+money(fee)+' par '+x.club+' : le club touche '+Math.round(x.pct*100)+' %, soit '+money(amt)+'.','g');}});
  S.sellOn=(S.sellOn||[]).filter(x=>!x.done);
}
function releaseTick(){
  // clauses libératoires : un club plus riche peut payer la clause sans vous demander votre avis
  if(!windowOpen())return;
  S.players.forEach(p=>{if(!p.release||p.loan)return;const v=valueFor(p);if(p.release<v*1.15&&R()<.08){const club=clubName(new Set())+' ('+LV[clamp(S.div+1,0,6)].n+')';const fee=p.release;sellPlayer(p,fee,club);UI.queue.push({type:'info',t:'Clause libératoire activée',d:club+' a payé la clause de '+pname(p)+' ('+money(fee)+'). Le joueur part immédiatement, vous ne pouvez pas vous y opposer.'});}});
}
A.acceptSellOn=function(oid){const o=(S.offers||[]).find(x=>x.id===oid);const p=o&&getP(o.pid);if(!p)return;const fee=Math.round(o.fee*.9/100)*100;
  S.sellOn=(S.sellOn||[]).concat([{n:pname(p),club:o.club,pct:.15,base:fee,until:S.year+3}]);sellPlayer(p,fee,o.club);S.offers=S.offers.filter(x=>x.pid!==p.id);toast(pname(p)+' vendu '+money(fee)+' avec 15 % à la revente.');save();closeModal();};
