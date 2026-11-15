p='/home/claude/president/index.html'; s=open(p).read()
def rep(old,new,cnt=1):
    global s
    n=s.count(old); assert n==cnt,(n,old[:100]); s=s.replace(old,new)
def func(name,new,prefix='\nfunction '):
    global s
    key=prefix+name
    i=s.index(key)+1; j=s.index('\n}\n',i)+3 if prefix=='\nfunction ' else s.index('\n};\n',i)+4
    s=s[:i]+new.strip('\n')+'\n'+s[j:]

# ======================= JOUEURS : stats, historique =======================
rep("  return {id:S.uid++,fn:nm.fn,ln:nm.ln,age,pos,ovr,pot,morale:65,fit:100,inj:0,susp:0,goals:0,apps:0,sg:0,sa:0,contract:o.contract??ri(1,3),wage:o.wage??wageFor(ovr),listed:false,youth:!!o.youth,notes:[]};",
"""  return {id:S.uid++,fn:nm.fn,ln:nm.ln,age,pos,ovr,pot,morale:65,fit:100,inj:0,susp:0,goals:0,apps:0,assists:0,s:newS(),hist:[],moves:[],contract:o.contract??ri(1,3),wage:o.wage??wageFor(ovr),listed:false,youth:!!o.youth,notes:[]};""")
rep("const pname=p=>p.fn+' '+p.ln;", r"""const pname=p=>p.fn+' '+p.ln;
function newS(){return {mj:0,g:0,a:0,cmj:0,cg:0,ca:0,yc:0,rc:0,ns:0,nn:0};}
const avgN=s=>s.nn?s.ns/s.nn:0;
const fmtN=v=>v?v.toFixed(2).replace('.',','):'—';
// saisons passées fictives pour les joueurs qui arrivent d'ailleurs
function genHist(p,club,div,n){
  n=n??Math.min(3,Math.max(0,p.age-17));
  for(let k=n;k>=1;k--){
    const d=clamp(div+(k>1&&R()<.4?-1:0),0,6),mj=ri(8,32);
    const gr={A:rf(.12,.5),M:rf(.03,.2),D:rf(0,.07),G:0}[p.pos],ar={A:rf(.05,.22),M:rf(.08,.3),D:rf(.02,.1),G:0}[p.pos];
    p.hist.push({y:seasonLabel(S.year-k),club:club||clubName(new Set()),div:LV[d].n,mj,g:Math.round(mj*gr),a:Math.round(mj*ar),note:+rf(5.6,6.9).toFixed(2)});
  }
}
function logMove(p,type,from,to,fee,dir){
  const m={y:seasonLabel(S.year),j:S.week===0?'Pré-saison':'J'+S.week,pid:p.id,name:pname(p),pos:p.pos,age:p.age,ovr:p.ovr,type,from,to,fee:fee||0,dir};
  S.transfers.unshift(m);if(S.transfers.length>400)S.transfers.length=400;
  (p.moves=p.moves||[]).push({y:m.y,j:m.j,type,from,to,fee:m.fee});
}
// attributs détaillés, stables pour un même joueur
const ATTR={G:['Réflexes','Placement','Jeu au pied','Sorties','Mental','Physique'],F:['Vitesse','Technique','Passes','Tir','Défense','Physique']};
const AOFF={G:[4,2,-7,0,1,-2],D:[-2,-4,-2,-12,6,4],M:[0,3,5,-3,-4,-1],A:[4,2,-3,6,-14,0]};
function hashN(n){const x=Math.sin(n*9301+49297)*233280;return x-Math.floor(x);}
function attrs(p){const names=p.pos==='G'?ATTR.G:ATTR.F;return names.map((n,k)=>({n,v:clamp(Math.round(p.ovr+AOFF[p.pos][k]+(hashN(p.id*13+k)-.5)*12),15,99)}));}""")

# ======================= ÉQUIPES IA : buteurs nommés =======================
rep("function aiStr(t){", r"""function genSq(){const a=[];[['A',3],['M',3],['D',2]].forEach(([pos,n])=>{for(let k=0;k<n;k++)a.push({n:pick(FIRST)+' '+pick(LAST),pos,w:{A:5,M:2.2,D:.8}[pos]*rf(.55,1.6),g:0,a:0});});return a;}
function wPick(arr,wf,ex){const c=arr.filter(x=>x!==ex);const tot=c.reduce((s,x)=>s+wf(x),0);let r=R()*tot;for(const x of c){r-=wf(x);if(r<=0)return x;}return c[0];}
const AW={A:2.5,M:4,D:1.2,G:.1};
function creditAI(t,goals,track){const out=[];if(!t.sq)t.sq=genSq();for(let i=0;i<goals;i++){const sc=wPick(t.sq,x=>x.w);const as=R()<.75?wPick(t.sq,x=>AW[x.pos],sc):null;if(track){sc.g++;if(as)as.a++;}out.push([sc,as]);}return out;}
function aiStr(t){""")
rep("    }else [gh,ga]=simGoals(aiStr(th),aiStr(ta));", "    }else{[gh,ga]=simGoals(aiStr(th),aiStr(ta));creditAI(th,gh,true);creditAI(ta,ga,true);}")
rep("  S.teams.forEach(t=>Object.assign(t,{P:0,W:0,D:0,L:0,GF:0,GA:0,Pts:0,form:[]}));",
    "  S.teams.forEach(t=>Object.assign(t,{P:0,W:0,D:0,L:0,GF:0,GA:0,Pts:0,form:[]}));\n  S.teams.forEach(t=>{if(!t.user)t.sq=genSq();});\n  S.roundRes=[];S.req={play:[],bench:[],formation:S.req&&S.staff.coach?null:null,ment:null};")
rep("  S.players.forEach(p=>{p.sg=0;p.sa=0;p.notes=[];});", "  S.players.forEach(p=>{p.s=newS();p.notes=[];});")

# ======================= MATCH : passes, stats =======================
func('userMatch', r"""
function userMatch(home,opp,me,neutral,cup){
  const os=aiStr(opp);
  const gf=poisson(lam(me.att,os.def,neutral?null:home)),ga=poisson(lam(os.att,me.def,neutral?null:!home));
  const xi=me.xi,ev=[];
  const w=e=>({A:5,M:2.2,D:.7,G:.02}[e.slot])*(e.p.ovr/50);
  const goals={},assists={};
  for(let i=0;i<gf;i++){
    if(!xi.length)break;
    const e=wPick(xi,w),as=R()<.75&&xi.length>1?wPick(xi,x=>AW[x.slot]*(x.p.ovr/50),e):null;
    goals[e.p.id]=(goals[e.p.id]||0)+1;if(as)assists[as.p.id]=(assists[as.p.id]||0)+1;
    ev.push({m:ri(1,90),k:'goal',n:pname(e.p)+(as?' (passe de '+pshort(as.p)+')':'')});
  }
  creditAI(opp,ga,!cup).forEach(([sc,as])=>ev.push({m:ri(1,90),k:'goalo',n:sc.n+(as?' (passe de '+as.n.split(' ').pop()+')':'')+' · '+opp.name}));
  const reds=[],injs=[],yc={};
  const ny=ri(0,3);for(let i=0;i<ny&&xi.length;i++){const e=pick(xi);yc[e.p.id]=1;ev.push({m:ri(5,90),k:'yc',n:pname(e.p)});}
  if(R()<.05&&xi.length){const e=pick(xi);reds.push(e.p);ev.push({m:ri(20,89),k:'rc',n:pname(e.p)+' (suspendu 1 match)'});}
  const pel=[1.3,1.1,1,.85][S.infra.pelouse];
  if(R()<.13*pel*(1-slvl('prepa')*.1)*(S.flags.flood>0?1.6:1)&&xi.length){const e=pick(xi);const wk=ri(1,8);injs.push([e.p,wk]);ev.push({m:ri(5,88),k:'inj',n:pname(e.p)+' ('+wk+' sem.)'});}
  ev.sort((a,b)=>a.m-b.m);
  const res=gf>ga?'V':gf<ga?'D':'N';
  const lineup=[];
  for(const e of xi){
    const p=e.p;if(!p.s)p.s=newS();
    const g=goals[p.id]||0,a=assists[p.id]||0;
    p.apps++;p.lastPlayed=S.gw;p.goals+=g;p.assists=(p.assists||0)+a;
    if(cup){p.s.cmj++;p.s.cg+=g;p.s.ca+=a;}else{p.s.mj++;p.s.g+=g;p.s.a+=a;}
    if(yc[p.id])p.s.yc++;if(reds.includes(p))p.s.rc++;
    const r=S.rec[p.id]||(S.rec[p.id]={n:pname(p),pos:p.pos,mj:0,g:0,a:0});r.mj++;r.g+=g;r.a+=a;
    p.fit=clamp(p.fit-ri(9,15),20,100);
    let note=6+(gf-ga)*.3+g*.9+a*.5+rf(-.9,.9)+(p.ovr-me.ovr)/20;if(e.slot==='G'||e.slot==='D')note-=ga*.25;
    note=clamp(Math.round(note*2)/2,2,10);p.notes.push(note);if(p.notes.length>10)p.notes.shift();
    p.s.ns+=note;p.s.nn++;
    lineup.push({n:pshort(p),pos:e.slot,note,g,a});
  }
  const dm=res==='V'?6:res==='N'?1:-6;
  const inXI=new Set(xi.map(e=>e.p.id));
  S.players.forEach(p=>{p.morale=clamp(Math.round(p.morale+(inXI.has(p.id)?dm:dm/2-1)),5,100);});
  S.players.forEach(p=>{if(p.susp>0&&!inXI.has(p.id))p.susp--;});
  reds.forEach(p=>p.susp=1);
  injs.forEach(([p,wk])=>p.inj=Math.max(p.inj,wk));
  const poss=clamp(Math.round(50+(me.ovr-os.ovr)*1.1+rf(-5,5)),28,72);
  return {gf,ga,ev,lineup,res,poss,sh:[gf*2+ri(3,8),ga*2+ri(3,8)],oppRating:Math.round(opp.rating),myRating:Math.round(me.ovr),form:S.tactic.formation,ment:S.tactic.mentality};
}""")
rep("lineup.map(l=>`<div><span><span class=\"pos ${l.pos}\">${l.pos}</span> ${esc(l.n)}${l.g?' <b class=\"gold\">'+'●'.repeat(l.g)+'</b>':''}</span>",
    "lineup.map(l=>`<div><span><span class=\"pos ${l.pos}\">${l.pos}</span> ${esc(l.n)}${l.g?' <b class=\"gold\" title=\"Buts\">'+'●'.repeat(l.g)+'</b>':''}${l.a?' <b class=\"muted\" title=\"Passes décisives\">'+'○'.repeat(l.a)+'</b>':''}</span>")
rep("<div class=\"muted\" style=\"font-size:12px\">Possession · Tirs (jaune : votre club)</div>",
    "<div class=\"muted\" style=\"font-size:12px\">Possession · Tirs (jaune : votre club) · Système de l’entraîneur : ${d.form||''}, ${(d.ment||'').toLowerCase()} · ● but ○ passe décisive</div>")

# coupe : effectif fictif de l'adversaire, stats coupe
rep("const opp={name:clubName(new Set(S.teams.map(t=>t.name))),rating:r,att:r+rf(-2,2),def:r+rf(-2,2),mom:0,div:od};",
    "const opp={name:clubName(new Set(S.teams.map(t=>t.name))),rating:r,att:r+rf(-2,2),def:r+rf(-2,2),mom:0,div:od,sq:genSq()};")
rep("  const me=strength();\n  const d=userMatch(home,opp,me,final);", "  coachDecide(opp);const me=strength();\n  const d=userMatch(home,opp,me,final,true);")

# ======================= ENTRAÎNEUR : décisions & demandes =======================
rep("/* ---------- Championnat ---------- */", r"""/* ---------- L'entraîneur décide ---------- */
const COACH_YES=['« Entendu, président. On essaie. »','« C’est une idée qui se tient. Je l’applique dès ce week-end. »','« D’accord, mais on jugera sur les résultats. »'];
const COACH_NO=['« Je comprends, président, mais c’est moi qui fais l’équipe. »','« Le groupe a trouvé ses repères, je ne change rien. »','« On en reparlera si les résultats ne suivent pas. »','« Avec tout le respect que je vous dois : non. »'];
function ensureCoach(c){if(!c)return;if(c.stub==null)c.stub=+rf(.15,.85).toFixed(2);if(c.rel==null)c.rel=60;if(!c.cur)c.cur=c.form||'4-4-2';if(!c.style)c.style='Équilibré';if(!c.form)c.form='4-4-2';}
const stubTxt=c=>c.stub>=.7?'Très têtu':c.stub>=.5?'Têtu':c.stub>=.3?'À l’écoute':'Très ouvert';
function coachDecide(opp){
  const c=S.staff.coach;S.req=S.req||{play:[],bench:[]};
  if(!c){S.tactic.mentality='Équilibré';return;}
  ensureCoach(c);
  S.tactic.formation=S.req.formation||c.cur;
  if(S.req.ment){S.tactic.mentality=S.req.ment;return;}
  let m=c.style;
  if(opp&&c.stub<.75){const d=opp.rating-strength().ovr;if(d>4)m='Défensif';else if(d<-4)m='Offensif';}
  S.tactic.mentality=m;
}
function coachAfter(res){
  const c=S.staff.coach;if(!c)return;ensureCoach(c);
  if(res==='V')c.rel=clamp(c.rel+.6,0,100);
  const last=S.myResults.slice(-3);
  if(last.length===3&&last.every(r=>r.res==='D')&&R()<.5){
    if(S.req.formation){news('Après trois défaites, '+c.name+' abandonne le '+S.req.formation+' que vous aviez demandé et revient au '+c.cur+'.','b');S.req.formation=null;}
    else{const alt=pick(Object.keys(FORM).filter(f=>f!==c.cur));news(c.name+' change de système après trois défaites : passage en '+alt+'.');c.cur=alt;}
  }
}
function coachAnswer(extra){
  const c=S.staff.coach;if(!c)return null;ensureCoach(c);
  S.reqLog=(S.reqLog||[]).filter(g=>S.gw-g<=3);const recent=S.reqLog.length;
  const pr=clamp(.8-c.stub*.55+(c.rel-50)/120-recent*.13-(extra||0),.04,.95);
  S.reqLog.push(S.gw);const ok=R()<pr;
  c.rel=clamp(c.rel+(ok?-1:-3)-(recent>=2?3:0),0,100);
  return ok;
}
function coachReply(ok,what){
  const c=S.staff.coach;
  news((ok?'Demande acceptée par ':'Demande refusée par ')+c.name+' : '+what+'.',ok?'g':'b');
  openModal(`<div class="kicker">Bureau de l’entraîneur</div><h2>${ok?'Demande acceptée':'Demande refusée'}</h2><p><b>${esc(what)}</b></p><p style="font-size:18px">${esc(pick(ok?COACH_YES:COACH_NO))}</p><p class="muted">${esc(c.name)} · relation avec le président : ${Math.round(c.rel)}/100. Plus vous multipliez les demandes, moins il est disposé à vous écouter.</p><div class="row"><button class="btn pri" onclick="A.close()">Continuer</button></div>`);
}
A.reqTac=function(kind){
  const c=S.staff.coach;if(!c){toast('Recrutez d’abord un entraîneur.');return;}
  const opts=kind==='formation'?Object.keys(FORM):Object.keys(MENT);
  openModal(`<div class="kicker">Bureau de l’entraîneur</div><h2>${kind==='formation'?'Suggérer un système':'Suggérer une approche'}</h2>
  <p>${esc(c.name)} décide seul de la tactique. Vous pouvez lui faire une suggestion : il l’acceptera ou non selon son caractère (<b>${stubTxt(c).toLowerCase()}</b>) et votre relation (${Math.round(c.rel)}/100).${kind==='formation'?' Imposer un autre système que son préféré ('+c.form+') lui fait perdre son bonus.':''}</p>
  <div class="choices">${opts.map(o=>`<button class="choice" onclick="A.doReqTac('${kind}','${o}')">${o}${kind==='formation'&&o===c.form?'<small>Son système préféré</small>':''}${kind==='ment'&&o===c.style?'<small>Son style de jeu</small>':''}</button>`).join('')}</div>
  <div class="row"><button class="btn" onclick="A.close()">Annuler</button></div>`);
};
A.doReqTac=function(kind,v){
  const c=S.staff.coach;const pref=kind==='formation'?c.cur:c.style;
  const ok=v===pref?true:coachAnswer(kind==='formation'?.05:0);
  if(ok){if(kind==='formation')S.req.formation=v===c.cur?null:v;else S.req.ment=v;}
  coachDecide();save();
  coachReply(ok,kind==='formation'?'jouer en '+v:'adopter une approche '+v.toLowerCase());
};
A.reqFree=function(){const c=S.staff.coach;if(!c)return;S.req={play:[],bench:[],formation:null,ment:null};c.rel=clamp(c.rel+4,0,100);coachDecide();news('Vous laissez '+c.name+' gérer la tactique et la composition comme il l’entend.');save();render();toast('L’entraîneur reprend la main.');};
A.reqPlayer=function(id,kind){
  const c=S.staff.coach;const p=getP(id);if(!c||!p){toast('Recrutez d’abord un entraîneur.');return;}
  S.req=S.req||{play:[],bench:[]};
  const xi=strength().xi,starters=xi.filter(e=>e.slot===p.pos&&e.p.id!==id).map(e=>e.p.ovr);
  let gap=0;
  if(kind==='play'){gap=starters.length?Math.min(...starters)-p.ovr:0;}
  else{const bench=S.players.filter(x=>x.pos===p.pos&&x.id!==id&&!x.inj&&!x.susp&&!xi.some(e=>e.p.id===x.id)).map(x=>x.ovr);gap=bench.length?p.ovr-Math.max(...bench):12;}
  const ok=coachAnswer(Math.max(0,gap)*.07);
  if(ok){S.req.play=S.req.play.filter(x=>x!==id);S.req.bench=S.req.bench.filter(x=>x!==id);S.req[kind].push(id);}
  save();coachReply(ok,(kind==='play'?'titulariser ':'écarter ')+pname(p));
};
A.reqCancel=function(id){S.req.play=S.req.play.filter(x=>x!==id);S.req.bench=S.req.bench.filter(x=>x!==id);save();render();};

/* ---------- Championnat ---------- */""")
# composition : demandes acceptées
rep("""  const av=S.players.filter(p=>!p.inj&&!p.susp);
  const sc=p=>p.ovr*(0.8+0.2*p.fit/100);""", """  const rq=S.req||{play:[],bench:[]};
  let av=S.players.filter(p=>!p.inj&&!p.susp);
  const noBench=av.filter(p=>!rq.bench.includes(p.id));if(noBench.length>=11)av=noBench;
  const sc=p=>p.ovr*(0.8+0.2*p.fit/100)+(rq.play.includes(p.id)?100:0);""")
# chaque journée : l'entraîneur choisit
rep("  const me=strength();\n  const L=LV[S.div],round=S.sched[S.week];let rep=null;",
    "  const nf0=nextFixture();coachDecide(nf0&&nf0.opp);\n  const me=strength();\n  const L=LV[S.div],round=S.sched[S.week];let rep=null;")
rep("  S.lastRound=results;S.week++;", "  S.lastRound=results;S.roundRes=S.roundRes||[];S.roundRes[S.week]=results;S.week++;")
rep("  UI.queue.push({type:'report',d:rep});\n  // coupe", "  coachAfter(rep.res);\n  UI.queue.push({type:'report',d:rep});\n  // coupe")
# relation trop dégradée
rep("  // offres pour joueurs en vente", "  const co=S.staff.coach;if(co&&co.rel<15&&R()<.15){news(co.name+' démissionne : il estime ne plus avoir la confiance du président.','b');UI.queue.push({type:'info',t:'Démission de l’entraîneur',d:co.name+' quitte le club, lassé de vos interventions. Recrutez un remplaçant dans l’onglet Staff.'});S.staff.coach=null;S.req={play:[],bench:[]};}\n  // offres pour joueurs en vente")
rep("  else if(q.type==='over')showOver();", "  else if(q.type==='over')showOver();\n  else if(q.type==='info')openModal(`<div class=\"kicker\">Information</div><h2>${esc(q.t)}</h2><p>${esc(q.d)}</p><div class=\"row\"><button class=\"btn pri\" onclick=\"A.close()\">Continuer</button></div>`);")
# embauche
rep("  S.staff[role]=c;S.cands[role].list.splice(i,1);",
    "  S.staff[role]=c;S.cands[role].list.splice(i,1);\n  if(role==='coach'){ensureCoach(c);S.req={play:[],bench:[]};S.tactic.formation=c.cur;S.tactic.mentality=c.style;}")
rep("  if(role==='coach'){s.form=pick(Object.keys(FORM));s.style=pick(Object.keys(MENT));}",
    "  if(role==='coach'){s.form=pick(Object.keys(FORM));s.style=pick(Object.keys(MENT));s.cur=s.form;s.stub=+rf(.15,.85).toFixed(2);s.rel=60;}")
rep("A.setTac=function(k,v){S.tactic[k]=v;save();render();};\n", "")

# ======================= MOUVEMENTS =======================
rep("function sellPlayer(p,fee,club){S.players=S.players.filter(x=>x.id!==p.id);",
    "function sellPlayer(p,fee,club){S.players=S.players.filter(x=>x.id!==p.id);logMove(p,'Transfert',S.club.name,club,fee,'out');")
rep("const ind=Math.round(p.wage*3*Math.max(1,p.contract));fin('Indemnités de départ',-ind);S.players=S.players.filter(x=>x.id!==id);",
    "const ind=Math.round(p.wage*3*Math.max(1,p.contract));fin('Indemnités de départ',-ind);S.players=S.players.filter(x=>x.id!==id);logMove(p,'Résiliation',S.club.name,'Sans club',-ind,'out');")
rep("    S.players.push(q);S.market=S.market.filter(x=>x.id!==p.id);",
    "    S.players.push(q);S.market=S.market.filter(x=>x.id!==p.id);logMove(q,n.fee?'Transfert':'Joueur libre',p.club==='Libre'?'Sans club':p.club,S.club.name,-(n.fee||0),'in');")
rep("S.players.push(d.p);S.fans=Math.round(S.fans*1.03);S.mood+=4;return pname(d.p)+' rejoint le club !';",
    "S.players.push(d.p);logMove(d.p,'Joueur libre','Sans club',S.club.name,0,'in');S.fans=Math.round(S.fans*1.03);S.mood+=4;return pname(d.p)+' rejoint le club !';")
rep("ch:[{t:'Lui offrir un contrat aspirant',f:d=>{if(S.players.length>=30)return 'Effectif complet.';S.players.push(d.p);",
    "ch:[{t:'Lui offrir un contrat aspirant',f:d=>{if(S.players.length>=30)return 'Effectif complet.';S.players.push(d.p);logMove(d.p,'Contrat aspirant','Club du quartier',S.club.name,0,'in');")
rep("p.wage=Math.round(wageFor(p.ovr)*.6/10)*10;S.players.push(p);return good?",
    "p.wage=Math.round(wageFor(p.ovr)*.6/10)*10;genHist(p,null,clamp(S.div-1,0,6),2);S.players.push(p);logMove(p,'Via un agent','Étranger',S.club.name,-d.fee,'in');return good?")
rep("make:()=>{const L=LV[S.div];const p=genPlayer({age:ri(33,35),ovr:L.str[1]+ri(3,8),contract:1});",
    "make:()=>{const L=LV[S.div];const p=genPlayer({age:ri(33,35),ovr:L.str[1]+ri(3,8),contract:1});genHist(p,null,clamp(S.div+2,0,6),3);")
# marché : passé des joueurs
rep("    p.potSeen=rec>=3?", "    genHist(p,p.club==='Libre'||p.club.startsWith('Club de')?null:p.club,d);\n    p.potSeen=rec>=3?")

# ======================= FIN DE SAISON =======================
rep("  const top=[...S.players].sort((a,b)=>b.sg-a.sg)[0];", "  const sgt=p=>p.s.g+p.s.cg;const top=[...S.players].sort((a,b)=>sgt(b)-sgt(a))[0];const lt=leaders('g')[0],la=leaders('a')[0];")
rep("top:top&&top.sg?pname(top)+' ('+top.sg+' buts)':'—',", "top:top&&sgt(top)?pname(top)+' ('+sgt(top)+' buts)':'—',lgTop:lt?lt.n+' ('+lt.club+', '+lt.v+')':'—',lgAst:la?la.n+' ('+la.club+', '+la.v+')':'—',")
rep("""   <div class="kpi"><div class="l">Meilleur buteur</div><div class="v" style="font-size:18px">${esc(e.top)}</div></div>
  </div>""", """   <div class="kpi"><div class="l">Meilleur buteur du club</div><div class="v" style="font-size:18px">${esc(e.top)}</div></div>
  </div>
  <p class="muted" style="margin:0">Meilleur buteur du championnat : <b style="color:var(--chalk)">${esc(e.lgTop)}</b> · meilleur passeur : <b style="color:var(--chalk)">${esc(e.lgAst)}</b></p>""")
rep("  S.history.unshift({y:seasonLabel(S.year),div:LV[S.div].n,pos:e.pos,out:e.out,cup:e.cup,top:e.top,res:e.inc-e.exp});",
    """  S.history.unshift({y:seasonLabel(S.year),div:LV[S.div].n,pos:e.pos,out:e.out,cup:e.cup,top:e.top,lgTop:e.lgTop,res:e.inc-e.exp});
  S.players.forEach(p=>{const s=p.s||newS();p.hist.push({y:seasonLabel(S.year),club:S.club.name,div:LV[S.div].n,mj:s.mj+s.cmj,g:s.g+s.cg,a:s.a+s.ca,note:+avgN(s).toFixed(2),yc:s.yc,rc:s.rc,own:true});});""")
rep("    if(p.contract<=0){leaving.push(pname(p)+' (fin de contrat)');return false;}\n    if(p.age>=34&&R()<(p.age-33)*.3){leaving.push(pname(p)+' (retraite)');return false;}",
    "    if(p.contract<=0){leaving.push(pname(p)+' (fin de contrat)');logMove(p,'Fin de contrat',S.club.name,'Sans club',0,'out');return false;}\n    if(p.age>=34&&R()<(p.age-33)*.3){leaving.push(pname(p)+' (retraite)');logMove(p,'Retraite',S.club.name,'—',0,'out');return false;}")
rep("    S.players.push(p);ys.push(pname(p)+' ('+p.pos+', '+p.ovr+')');", "    S.players.push(p);logMove(p,'Centre de formation','Formation du club',S.club.name,0,'in');ys.push(pname(p)+' ('+p.pos+', '+p.ovr+')');")
rep("p.ovr=clamp(p.ovr-3,25,90);p.wage=wageFor(p.ovr);S.players.push(p);filled++;", "p.ovr=clamp(p.ovr-3,25,90);p.wage=wageFor(p.ovr);genHist(p,null,Math.max(0,S.div-1),2);S.players.push(p);logMove(p,'Joueur libre','Sans club',S.club.name,0,'in');filled++;")

# ======================= CRÉATION / MIGRATION =======================
rep("tactic:{formation:'4-4-2',mentality:'Équilibré'},loans:[],", "tactic:{formation:'4-4-2',mentality:'Équilibré'},loans:[],transfers:[],rec:{},req:{play:[],bench:[]},reqLog:[],")
rep("const nm=genName();S.staff.coach={name:nm.fn+' '+nm.ln,lvl:1,salary:0,age:58,form:'4-4-2',style:'Équilibré'};",
    "const nm=genName();S.staff.coach={name:nm.fn+' '+nm.ln,lvl:1,salary:0,age:58,form:'4-4-2',cur:'4-4-2',style:'Équilibré',stub:.4,rel:60};")
rep("plan.forEach(([pos,n])=>{for(let k=0;k<n;k++){const p=genPlayer({div:0,pos,ovr:ri(37,47)+D.q});S.players.push(p);}});",
    "plan.forEach(([pos,n])=>{for(let k=0;k<n;k++){const p=genPlayer({div:0,pos,ovr:ri(37,47)+D.q});genHist(p,null,0,Math.min(3,Math.max(0,p.age-18)));if(p.hist.length)p.hist[p.hist.length-1].club=name;S.players.push(p);}});")
rep("if(saved&&saved.v===1){S=saved;", r"""if(saved&&saved.v===1){S=saved;migrate();""")
rep("function boot(data){", r"""function migrate(){
  S.transfers=S.transfers||[];S.rec=S.rec||{};S.req=S.req||{play:[],bench:[]};S.req.play=S.req.play||[];S.req.bench=S.req.bench||[];S.reqLog=S.reqLog||[];S.roundRes=S.roundRes||[];
  S.players.forEach(p=>{if(!p.s)p.s=Object.assign(newS(),{mj:p.sa||0,g:p.sg||0});p.assists=p.assists||0;p.hist=p.hist||[];p.moves=p.moves||[];});
  (S.teams||[]).forEach(t=>{if(!t.user&&!t.sq)t.sq=genSq();});
  ensureCoach(S.staff.coach);
}
function boot(data){""")
open(p,'w').write(s); print('ok')
