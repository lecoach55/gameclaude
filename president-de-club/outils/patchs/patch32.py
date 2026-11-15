f='/home/claude/president/index.html';s=open(f).read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:70],s.count(a));s=s.replace(a,b)
# poids des buteurs/passeurs selon le rôle et les aptitudes
rep("""  const w=e=>({A:5,M:2.2,D:.7,G:.02}[e.slot])*(e.p.ovr/50);
  const goals={},assists={};
  for(let i=0;i<gf;i++){
    if(!xi.length)break;
    const e=wPick(xi,w),as=R()<.75&&xi.length>1?wPick(xi,x=>AW[x.slot]*(x.p.ovr/50),e):null;
    goals[e.p.id]=(goals[e.p.id]||0)+1;if(as)assists[as.p.id]=(assists[as.p.id]||0)+1;
    ev.push({m:ri(1,90),k:'goal',n:pname(e.p)+(as?' (passe de '+pshort(as.p)+')':'')});
  }""","""  const roleOf=e=>e.role||({G:'GB',D:'DC',M:'MC',A:'BU'})[e.slot];
  const av=e=>attrVals(e.p);
  const w=e=>({BU:5,AIL:3,MOC:2.6,MC:1.3,MDC:.6,LAT:.55,DC:.6,GB:.02}[roleOf(e)]||1)*(.4+av(e)[3]/80)*(e.p.ovr/50);
  const aw=x=>({AIL:2.3,MOC:2.5,MC:1.6,LAT:1.2,BU:1,MDC:.8,DC:.3,GB:.05}[roleOf(x)]||1)*(.3+(av(x)[2]+av(x)[8])/140)*(x.p.ovr/50);
  const goals={},assists={},saves={},miss={};
  for(let i=0;i<gf;i++){
    if(!xi.length)break;
    const pen=R()<.08;const e=wPick(xi,w),as=!pen&&R()<.75&&xi.length>1?wPick(xi,aw,e):null;
    goals[e.p.id]=(goals[e.p.id]||0)+1;if(as)assists[as.p.id]=(assists[as.p.id]||0)+1;
    const rl=roleOf(e),hd=!pen&&av(e)[6]>=e.p.ovr+3&&R()<.4;const cr=as&&['AIL','LAT'].includes(roleOf(as))&&R()<.5;
    const how=pen?'sur penalty':hd?'de la tête'+(cr?' sur un centre de '+pshort(as.p):', passe de '+(as?pshort(as.p):'')):cr?'sur un centre de '+pshort(as.p):as?'passe de '+pshort(as.p):(rl==='BU'||rl==='AIL')&&R()<.5?'en solo':'';
    ev.push({m:ri(1,90),k:'goal',n:pname(e.p)+(how?' ('+how.replace(/, passe de $/,'')+')':'')});
  }
  // occasions manquées et arrêts du gardien
  {const att=xi.filter(e=>['BU','AIL','MOC'].includes(roleOf(e)));const gk=xi.find(e=>roleOf(e)==='GB');
   const nm=ri(0,2);for(let i=0;i<nm&&att.length;i++){const e=pick(att);miss[e.p.id]=(miss[e.p.id]||0)+1;ev.push({m:ri(3,89),k:'occ',n:pname(e.p)+' '+pick(['trouve le poteau','manque le cadre seul face au gardien','voit sa frappe repoussée sur la ligne','bute sur le gardien'])});}
   const ns=clamp(Math.round(rf(0,2.2)+(os.att-me.def)/6),0,4);if(gk)for(let i=0;i<ns;i++){saves[gk.p.id]=(saves[gk.p.id]||0)+1;if(i<2)ev.push({m:ri(3,89),k:'save',n:pname(gk.p)+' '+pick(['détourne une frappe en corner','sort dans les pieds de l’attaquant','s’envole pour un arrêt réflexe','repousse un penalty !'].slice(0,R()<.08?4:3))});}}""")
rep("""  const res=gf>ga?'V':gf<ga?'D':'N';
  const lineup=[];""","""  const res=gf>ga?'V':gf<ga?'D':'N';
  const poss=clamp(Math.round(50+(me.ovr-os.ovr)*1.1+rf(-5,5)+(S.tactic.formation==='3-5-2'?3:S.tactic.formation==='5-3-2'?-3:0)),28,72);
  const lineup=[];""")
rep("""    let note=6+(gf-ga)*.3+g*.9+a*.5+rf(-.9,.9)+(p.ovr-me.ovr)/20;if(e.slot==='G'||e.slot==='D')note-=ga*.25;
    note=clamp(Math.round(note*2)/2,2,10);""","""    const rl=roleOf(e);
    let note=6+(gf-ga)*.25+g*.9+a*.5+rf(-.8,.8)+(p.ovr-me.ovr)/20;
    if(['GB','DC','LAT','MDC'].includes(rl)){note-=ga*.28;if(ga===0)note+=rl==='GB'?.8:.45;}
    if(rl==='GB')note+=(saves[p.id]||0)*.35;
    if(['MC','MDC','MOC'].includes(rl))note+=(poss-50)/30;
    if(['BU','AIL'].includes(rl)&&!g&&!a)note-=.3;
    note-=(miss[p.id]||0)*.3;if(e.pen>0)note-=.4;if(p.fit<55)note-=.3;
    note=clamp(Math.round(note*2)/2,2,10);""")
rep("    lineup.push({id:p.id,n:pshort(p),pos:e.slot,note,g,a});","    lineup.push({id:p.id,n:pshort(p),pos:e.slot,role:rl,note,g,a,ce:e.pen>0,sv:saves[p.id]||0});")
rep("""  const poss=clamp(Math.round(50+(me.ovr-os.ovr)*1.1+rf(-5,5)),28,72);
  return {gf,ga,ev,lineup,res,poss,""","""  const motm=lineup.length?lineup.slice().sort((a,b)=>b.note-a.note||b.g-a.g||b.a-a.a)[0]:null;
  if(motm){const p=getP(motm.id);if(p&&p.s)p.s.motm=(p.s.motm||0)+1;motm.why=motm.g>=3?'triplé':motm.g===2?'doublé':motm.g?'buteur'+(motm.a?' et passeur':''):motm.a>=2?motm.a+' passes décisives':motm.a?'passeur décisif':motm.sv>=2?motm.sv+' arrêts décisifs':motm.role==='GB'&&ga===0?'cage inviolée':['DC','LAT','MDC'].includes(motm.role)&&ga===0?'mur défensif':'le plus influent sur le terrain';}
  const tac=tacComment({gf,ga,res,poss},lineup);
  return {gf,ga,ev,lineup,res,poss,motm,tac,""")
# rapport
rep("const tags={goal:['BUT','goal'],goalo:['BUT','goalo'],yc:['JAUNE','yc'],rc:['ROUGE','rc'],inj:['BLESSÉ','inj'],ht:['MI-TEMPS','goalo']};","const tags={goal:['BUT','goal'],goalo:['BUT','goalo'],yc:['JAUNE','yc'],rc:['ROUGE','rc'],inj:['BLESSÉ','inj'],ht:['MI-TEMPS','goalo'],occ:['OCCASION','occ'],save:['ARRÊT','save']};")
rep("""    <div><h3 style="margin-bottom:6px">Notes des joueurs</h3>""","""    ${d.motm?`<div class="motm">⭐ <span>Homme du match : <b>${d.motm.id!=null?plk(d.motm.id,d.motm.n):esc(d.motm.n)}</b> · ${String(d.motm.note).replace('.',',')} · ${esc(d.motm.why||'')}</span></div>`:''}
    ${d.tac?`<div class="tacnote"><b>L’analyse de l’entraîneur</b><br>${esc(d.tac)}</div>`:''}
    <div><h3 style="margin-bottom:6px">Notes des joueurs</h3>""")
rep("""<span class="pos ${l.pos}">${l.pos}</span> ${l.id!=null?plk(l.id,l.n):esc(l.n)}""","""<span class="pos ${l.pos}">${l.pos}</span>${l.role?` <span class="role" ${l.ce?'title="À contre-emploi" style="opacity:.6"':''}>${l.role}</span>`:''} ${l.id!=null?plk(l.id,l.n):esc(l.n)}""")
rep("liveMsg(r.live,(k==='ht'?'Mi-temps':k==='yc'?'Carton jaune · ':k==='rc'?'Carton rouge · ':'Blessure · ')","liveMsg(r.live,(k==='ht'?'Mi-temps':k==='yc'?'Carton jaune · ':k==='rc'?'Carton rouge · ':k==='occ'?'Occasion · ':k==='save'?'Arrêt · ':'Blessure · ')")
rep(".tag.yc{background:#e8d23a;color:#1b1606}",".tag.occ{background:#3a4a41;color:var(--chalk)}.tag.save{background:#2c5d8a;color:#eaf4ff}.motm{display:flex;gap:8px;align-items:center;padding:8px 12px;border-radius:10px;background:rgba(232,194,20,.1);border:1px solid rgba(232,194,20,.35);font-size:14px}.tacnote{font-size:13.5px;padding:8px 12px;border-left:3px solid var(--flood,#e8c214);background:rgba(255,255,255,.03);border-radius:6px}\n.tag.yc{background:#e8d23a;color:#1b1606}")
add=r'''
/* ====================== Analyse tactique du match ====================== */
const FTAC={'4-3-3':['AIL','Les ailiers du 4-3-3 ont fait la différence sur les côtés','Le 4-3-3 a laissé trop d’espaces dans le dos des ailiers'],
 '4-4-2':['BU','Le duo d’attaque du 4-4-2 a pesé sur la défense adverse','Le milieu à deux du 4-4-2 a souvent été pris en infériorité'],
 '3-5-2':['MC','Le milieu à cinq du 3-5-2 a confisqué le ballon','Les pistons du 3-5-2 n’ont pas réussi à défendre et attaquer à la fois'],
 '5-3-2':['DC','Le bloc bas du 5-3-2 n’a presque rien laissé passer','Le 5-3-2 a manqué de solutions pour se projeter'],
 '4-2-3-1':['MOC','Le meneur du 4-2-3-1 a trouvé les espaces entre les lignes','L’avant-centre du 4-2-3-1 s’est retrouvé trop isolé']};
function tacComment(r,lineup){
  const F=FTAC[S.tactic.formation];if(!F||!lineup.length)return '';
  const key=lineup.filter(l=>l.role===F[0]).sort((a,b)=>b.note-a.note)[0];
  const good=r.res==='V'||(r.res==='N'&&(r.poss>=55||r.ga===0));
  const out=[];
  out.push((good?F[1]:F[2])+(key?' ('+key.n+', '+String(key.note).replace('.',',')+')':'')+'.');
  const ce=lineup.filter(l=>l.ce);if(ce.length)out.push(ce.map(l=>l.n).join(' et ')+(ce.length>1?', alignés':', aligné')+' à contre-emploi, '+(ce.some(l=>l.note<5.5)?'a'+(ce.length>1?'ont':'')+' souffert.':'s’en sor'+(ce.length>1?'tent':'t')+' correctement.').replace('aont','ont'));
  const m=S.tactic.mentality;
  if(m==='Offensif'&&r.ga>=3)out.push('Le choix de jouer offensif s’est payé cher derrière.');
  else if(m==='Offensif'&&r.gf>=3)out.push('L’animation offensive a porté ses fruits.');
  else if(m==='Défensif'&&r.gf===0)out.push('Prudent, l’équipe n’a presque rien tenté.');
  else if(m==='Défensif'&&r.ga===0)out.push('Le plan défensif a été appliqué à la lettre.');
  if(r.poss<=38)out.push('Avec '+r.poss+' % de possession, il a fallu courir après le ballon.');else if(r.poss>=62)out.push(r.poss+' % de possession : la maîtrise était de notre côté.');
  return out.join(' ');
}
'''
rep("/* ====================== Missions du recruteur ====================== */",add+"\n/* ====================== Missions du recruteur ====================== */")
open(f,'w').write(s);print('ok')
