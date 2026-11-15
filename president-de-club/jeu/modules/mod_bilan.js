
/* ====================== Bilan de saison enrichi ====================== */
function seasonExtrasData(){
  const y=seasonLabel(S.year),out={},R_=S.records||(S.records={});
  // partenariats
  const spInc=(S.sf.inc||{}).Sponsors||0;const signed=(S.spSigned||[]).filter(x=>x.y===S.year);
  out.sp={inc:spInc,signed};
  // recrutement
  const mis=(S.misHist||[]).filter(h=>h.y===y);
  const fromMis=S.players.filter(p=>p.mis&&(p.moves||[]).some(m=>m.y===y&&m.to===S.club.name));
  out.rec={mis:mis.length,auto:mis.filter(h=>h.auto).length,signed:fromMis.map(p=>({id:p.id,n:pname(p)}))};
  // formation
  const ac=S.players.filter(p=>((p.moves||[]).some(m=>m.type==='Contrat aspirant'||m.type==='Centre de formation')||(p.age<=21&&!(p.moves||[]).length))&&p.s&&(p.s.mj+p.s.cmj)>0).sort((a,b)=>(b.s.mj+b.s.cmj)-(a.s.mj+a.s.cmj));
  out.yo=ac.slice(0,3).map(p=>({id:p.id,n:pname(p),mj:p.s.mj+p.s.cmj,age:p.age}));
  // homme du match
  const mo=S.players.filter(p=>p.s&&p.s.motm).sort((a,b)=>b.s.motm-a.s.motm)[0];
  out.motm=mo?{id:mo.id,n:pname(mo),c:mo.s.motm}:null;
  // confrontations de la saison
  const per={};(S.myResults||[]).forEach(r=>{const o=per[r.opp]||(per[r.opp]={pts:0,lost:0,n:0});o.n++;const p=r.res==='V'?3:r.res==='N'?1:0;o.pts+=p;o.lost+=3-p;});
  const ar=Object.entries(per);
  const bete=ar.filter(([,o])=>o.lost>=4).sort((a,b)=>b[1].lost-a[1].lost)[0];
  const fav=ar.filter(([,o])=>o.pts===6).sort((a,b)=>b[1].pts-a[1].pts)[0];
  out.h2h={bete:bete?bete[0]:null,fav:fav?fav[0]:null};
  // records du club
  const nr=[];
  const big=(S.myResults||[]).slice().sort((a,b)=>(b.gf-b.ga)-(a.gf-a.ga)||b.gf-a.gf)[0];
  if(big&&big.gf-big.ga>=3&&(!R_.win||big.gf-big.ga>R_.win.d)){R_.win={d:big.gf-big.ga,s:big.gf+'-'+big.ga,opp:big.opp,y};nr.push('Plus large victoire de l’histoire du club : '+big.gf+'-'+big.ga+' contre '+big.opp+'.');}
  const att=(S.myResults||[]).filter(r=>r.att).sort((a,b)=>b.att-a.att)[0];
  if(att&&(!R_.att||att.att>R_.att.v)){const first=!R_.att;R_.att={v:att.att,opp:att.opp,y};if(!first)nr.push('Record d’affluence : '+nf(att.att)+' spectateurs contre '+att.opp+'.');}
  const sc=S.players.filter(p=>p.s).sort((a,b)=>(b.s.g+b.s.cg)-(a.s.g+a.s.cg))[0];
  if(sc&&(sc.s.g+sc.s.cg)>=8&&(!R_.sc||sc.s.g+sc.s.cg>R_.sc.v)){const first=!R_.sc;R_.sc={v:sc.s.g+sc.s.cg,n:pname(sc),y};if(!first)nr.push('Record de buts sur une saison : '+pname(sc)+' ('+(sc.s.g+sc.s.cg)+').');}
  const me=S.teams.find(t=>t.user);if(me){const k='pts'+S.div;if(!R_[k]||me.Pts>R_[k].v){const first=!R_[k];R_[k]={v:me.Pts,y};if(!first)nr.push('Record de points en '+LV[S.div].n+' : '+me.Pts+'.');}}
  out.records=nr;
  return out;
}
function seasonExtras(e){
  if(!e.ext)e.ext=seasonExtrasData();const x=e.ext;
  const blk=(t,b)=>`<div class="bx"><b>${t}</b><div>${b}</div></div>`;
  const parts=[];
  parts.push(blk('🤝 Partenaires',`${money(x.sp.inc)} de sponsoring${x.sp.signed.length?' · nouveaux contrats : '+x.sp.signed.map(s=>esc(s.b)).join(', '):''}`));
  parts.push(blk('🕵️ Recrutement',x.rec.mis?`${x.rec.mis} mission${x.rec.mis>1?'s':''} du recruteur${x.rec.auto?' (dont '+x.rec.auto+' à son initiative)':''}${x.rec.signed.length?' · signés grâce à lui : '+x.rec.signed.map(p=>plk(p.id,p.n)).join(', '):''}`:'Aucune mission cette saison'));
  parts.push(blk('🎓 Formation',x.yo.length?x.yo.map(p=>plk(p.id,p.n)+' ('+p.mj+' match'+(p.mj>1?'s':'')+')').join(', '):'Aucun jeune formé au club n’a joué'));
  if(x.motm)parts.push(blk('⭐ Homme du match',`${plk(x.motm.id,x.motm.n)} : élu ${x.motm.c} fois`));
  if(x.h2h.bete||x.h2h.fav)parts.push(blk('⚔️ Face-à-face',`${x.h2h.fav?'Victime préférée : '+esc(x.h2h.fav):''}${x.h2h.fav&&x.h2h.bete?' · ':''}${x.h2h.bete?'Bête noire : '+esc(x.h2h.bete):''}`));
  return `<div class="bxgrid">${parts.join('')}</div>${x.records.length?x.records.map(r=>`<div class="alert g">🏅 ${esc(r)}</div>`).join(''):''}`;
}
/* ====================== Événements de saison ====================== */
const sf=()=>S.N?S.week/S.N:0;
const EV5={
 noel:{w:2,cond:()=>sf()>.36&&sf()<.5&&S.flags.noel!==S.year,make:()=>{S.flags.noel=S.year;return {c:smallAmt(.02)};},k:'Vie du club',title:'L’arbre de Noël du club',
  text:d=>`Les éducateurs veulent organiser l’arbre de Noël de l’école de foot : goûter, cadeaux et visite des joueurs de l’équipe première. Budget : ${money(d.c)}.`,
  ch:[{t:'Faire les choses en grand',f:d=>{fin('Vie associative',-d.c);S.mood=clamp(S.mood+5,0,100);S.fans=Math.round(S.fans*1.015);S.players.forEach(p=>{if(!p.loan)p.morale=clamp(p.morale+2,0,100);});return 'Les enfants repartent avec un maillot dédicacé. Les parents ne parlent que de ça.';}},
      {t:'Un simple goûter',f:d=>{fin('Vie associative',-Math.round(d.c*.3/50)*50);return 'Sympathique, sans plus.';}}]},
 galette:{w:1.5,cond:()=>sf()>.48&&sf()<.62&&S.div<=3&&S.flags.galette!==S.year,make:()=>{S.flags.galette=S.year;return {};},k:'Vie du club',title:'La galette des rois des bénévoles',
  text:()=>`Comme chaque janvier, les bénévoles se retrouvent pour la galette. Ils aimeraient que le président fasse un discours.`,
  ch:[{t:'Venir et remercier tout le monde',f:()=>{S.confidence=clamp(S.confidence+3,0,100);S.mood=clamp(S.mood+2,0,100);return 'Vous tirez la fève. Les bénévoles sont touchés.';}},{t:'S’excuser : agenda chargé',f:()=>{S.confidence=clamp(S.confidence-2,0,100);return 'Les bénévoles le prennent un peu mal.';}}]},
 gel:{w:1.2,cond:()=>sf()>.4&&sf()<.62&&S.infra.pelouse<=2,make:()=>({c:smallAmt(.03)}),k:'Météo',title:'Terrain gelé',
  text:d=>`Une vague de froid gèle la pelouse avant le match. Louer des bâches chauffantes coûte ${money(d.c)}, sinon le match risque d’être reporté en semaine.`,
  ch:[{t:'Louer les bâches',f:d=>{fin('Entretien des installations',-d.c);return 'Le match a lieu normalement.';}},{t:'Accepter le report',f:()=>{S.players.forEach(p=>{if(!p.loan)p.fit=clamp(p.fit-6,20,100);});return 'Match reporté en semaine : calendrier chargé et jambes lourdes.';}}]},
 treve:{w:1.5,cond:()=>Math.abs(S.week-Math.floor(S.N/2))<=1&&S.flags.treve!==S.year,make:()=>{S.flags.treve=S.year;return {c:smallAmt(.05)};},k:'Préparation',title:'Un stage pendant la trêve ?',
  text:d=>`L’entraîneur propose un stage de quelques jours au soleil pendant la trêve pour remobiliser le groupe : ${money(d.c)}.`,
  ch:[{t:'Valider le stage',f:d=>{fin('Vie associative',-d.c);S.players.forEach(p=>{if(!p.loan){p.morale=clamp(p.morale+6,0,100);p.fit=clamp(p.fit+5,20,100);}});if(S.staff.coach)S.staff.coach.rel=clamp((S.staff.coach.rel||60)+5,0,100);return 'Le groupe revient soudé et affûté.';}},{t:'Repos à la maison',f:()=>{S.players.forEach(p=>{if(!p.loan)p.fit=clamp(p.fit+3,20,100);});return 'Les joueurs profitent des fêtes en famille.';}}]},
 canicule:{w:1.3,cond:()=>(S.week<=2||S.week>=S.N-2)&&S.week>0,make:()=>({}),k:'Météo',title:'Canicule',
  text:()=>`Il fera 36 °C à l’heure du match. La ligue autorise de décaler le coup d’envoi en soirée, mais cela gêne les familles.`,
  ch:[{t:'Décaler à 21 h',f:()=>{S.mood=clamp(S.mood-1,0,100);return 'Ambiance de nocturne, joueurs préservés.';}},{t:'Garder l’horaire avec des pauses fraîcheur',f:()=>{S.players.forEach(p=>{if(!p.loan)p.fit=clamp(p.fit-5,20,100);});return 'Match éprouvant : les jambes ont souffert.';}}]},
 derniereDom:{w:2,cond:()=>S.week>=S.N-3&&S.flags.lastHome!==S.year,make:()=>{S.flags.lastHome=S.year;const p=pick(S.players.filter(p=>!p.loan&&p.age>=32));return p?{pid:p.id}:{};},k:'Supporters',title:'Le dernier match à domicile',
  text:d=>`Pour le dernier match à domicile de la saison, les supporters préparent un tour d’honneur${d.pid!=null&&getP(d.pid)?' et un hommage à '+pname(getP(d.pid))+', qui pourrait raccrocher':''}.`,
  ch:[{t:'Organiser une fête avec les supporters',f:()=>{fin('Vie associative',-smallAmt(.01));S.mood=clamp(S.mood+5,0,100);return 'Tour d’honneur sous les applaudissements, buvette dévalisée.';}},{t:'Rester sobre',f:()=>'Un simple merci au micro.'}]}
};
Object.assign(EVENTS,EV5);
