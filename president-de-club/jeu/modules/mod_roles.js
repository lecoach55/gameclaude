/* ====================== Aptitudes, rôles et choix tactiques ====================== */
const ROLE={
 GB:{n:'Gardien',g:'G',w:{0:.35,1:.3,3:.2,2:.15}},
 DC:{n:'Défenseur central',g:'D',w:{4:.35,6:.25,5:.2,0:.1,2:.1}},
 LAT:{n:'Latéral',g:'D',w:{0:.3,4:.25,7:.2,2:.15,1:.1}},
 MDC:{n:'Milieu défensif',g:'M',w:{4:.3,2:.25,5:.2,7:.15,8:.1}},
 MC:{n:'Milieu central',g:'M',w:{2:.3,8:.25,1:.2,7:.15,4:.1}},
 MOC:{n:'Meneur de jeu',g:'M',w:{8:.3,1:.3,2:.2,3:.2}},
 AIL:{n:'Ailier',g:'A',w:{0:.35,1:.3,2:.15,3:.2}},
 BU:{n:'Avant-centre',g:'A',w:{3:.4,6:.2,5:.15,0:.15,1:.1}}
};
const ATTR_F=['Vitesse','Technique','Passes','Tir','Défense','Physique','Jeu de tête','Endurance','Vision'];
const ATTR_G=['Réflexes','Placement','Jeu au pied','Sorties','Mental','Physique'];
const ROFF={GB:[4,2,-6,0,1,-1],DC:[-4,-5,-3,-12,7,5,6,0,-4],LAT:[5,-1,1,-8,3,0,-3,5,-2],MDC:[-2,-1,3,-6,5,4,1,4,1],MC:[-1,2,5,-2,-1,0,-3,4,4],MOC:[1,6,4,3,-10,-4,-5,-1,7],AIL:[8,5,1,2,-10,-4,-5,2,1],BU:[2,1,-4,8,-14,4,5,-1,-2]};
// rôles compatibles par poste historique (G/D/M/A)
const ROLES_OF={G:['GB'],D:['DC','DC','DC','LAT','LAT'],M:['MDC','MC','MC','MOC','AIL'],A:['BU','BU','BU','AIL','AIL']};
const RGROUP={GB:'G',DC:'D',LAT:'D',MDC:'M',MC:'M',MOC:'M',AIL:'A',BU:'A'};
function ensureRole(p){
  if(p.role&&p.ao)return p;
  const h=k=>hashN((p.id||1)*37+k);
  if(!p.role||RGROUP[p.role]===undefined){const opts=ROLES_OF[p.pos]||['MC'];p.role=opts[Math.floor(h(1)*opts.length)];}
  if(p.role==='AIL'&&p.pos==='M')p.pos='M';
  if(p.role2===undefined){const alt=Object.keys(ROFF).filter(r=>r!==p.role&&r!=='GB'&&p.pos!=='G');p.role2=h(2)<.3&&alt.length?alt[Math.floor(h(3)*alt.length)]:null;if(p.role2&&RGROUP[p.role2]!==RGROUP[p.role]&&h(4)<.5)p.role2=null;}
  const base=ROFF[p.role];p.ao=base.map((o,k)=>Math.round(o+(h(10+k)-.5)*14));
  return p;
}
function ageAdj(k,age,gk){if(gk)return k===4?clamp((age-24)*.6,-3,5):k===5?-Math.max(0,age-31)*.8:0;
  return k===0?-Math.max(0,age-27)*1.3:k===7?-Math.max(0,age-29):k===8?clamp((age-23)*.6,-3,5):k===5?-Math.max(0,age-31)*.8:k===4||k===6?clamp((age-22)*.3,-1,2):0;}
function attrVals(p){ensureRole(p);const gk=p.pos==='G';return p.ao.map((o,k)=>clamp(Math.round(p.ovr+o+ageAdj(k,p.age,gk)),15,99));}
attrs=function(p){const v=attrVals(p),names=p.pos==='G'?ATTR_G:ATTR_F;return names.map((n,k)=>({n,v:v[k]}));};
const KCAL={};for(const r in ROLE){let c=0;for(const k in ROLE[r].w)c+=ROLE[r].w[k]*ROFF[r][k];KCAL[r]=c;}
function roleFit(p,role){const v=attrVals(p),w=ROLE[role].w;if(p.pos==='G'&&role!=='GB')return 25;if(role==='GB'&&p.pos!=='G')return 20;let s=0;for(const k in w)s+=v[k]*w[k];return s-KCAL[role];}
function famPen(p,role){ensureRole(p);if(p.role===role||p.role2===role)return 0;if(role==='GB'||p.pos==='G')return 18;return RGROUP[role]===RGROUP[p.role]?3:8;}
// valeur d'un joueur dans un rôle (sur l'échelle de la note générale)
function roleVal(p,role){return p.ovr+(roleFit(p,role)-p.ovr)*.6-famPen(p,role);}
const FSLOTS={'4-4-2':['GB','LAT','DC','DC','LAT','AIL','MC','MC','AIL','BU','BU'],'4-3-3':['GB','LAT','DC','DC','LAT','MDC','MC','MC','AIL','BU','AIL'],'3-5-2':['GB','DC','DC','DC','LAT','MDC','MC','MOC','LAT','BU','BU'],'5-3-2':['GB','LAT','DC','DC','DC','LAT','MDC','MC','MC','BU','BU'],'4-2-3-1':['GB','LAT','DC','DC','LAT','MDC','MDC','AIL','MOC','AIL','BU']};
const SLOTG={'4-4-2':'GDDDDMMMMAA','4-3-3':'GDDDDMMMAAA','3-5-2':'GDDDMMMMMAA','5-3-2':'GDDDDDMMMAA','4-2-3-1':'GDDDDMMMMMA'};
function buildXI(form,av,sc){
  const slots=FSLOTS[form],order=[...slots.keys()].sort((a,b)=>({GB:0,BU:1,DC:2,MOC:3,AIL:4,MDC:5,LAT:6,MC:7})[slots[a]]-({GB:0,BU:1,DC:2,MOC:3,AIL:4,MDC:5,LAT:6,MC:7})[slots[b]]);
  const used=new Set(),res=new Array(slots.length);
  for(const i of order){const role=slots[i];let best=null,bv=-1e9;for(const p of av){if(used.has(p.id))continue;const v=roleVal(p,role)*(0.8+0.2*p.fit/100)+sc(p);if(v>bv){bv=v;best=p;}}
    if(best){used.add(best.id);res[i]={p:best,slot:SLOTG[form][i],role,pen:famPen(best,role),eff:roleVal(best,role)};}}
  // amélioration par échanges deux à deux
  for(let pass=0;pass<2;pass++)for(let i=0;i<res.length;i++)for(let j=i+1;j<res.length;j++){const a=res[i],b=res[j];if(!a||!b)continue;
    const cur=roleVal(a.p,a.role)+roleVal(b.p,b.role),sw=roleVal(b.p,a.role)+roleVal(a.p,b.role);
    if(sw>cur+.5){res[i]={p:b.p,slot:a.slot,role:a.role,pen:famPen(b.p,a.role),eff:roleVal(b.p,a.role)};res[j]={p:a.p,slot:b.slot,role:b.role,pen:famPen(a.p,b.role),eff:roleVal(a.p,b.role)};}}
  return res.filter(Boolean);
}
function xiValue(xi){return xi.reduce((s,e)=>s+e.eff*(0.8+0.2*e.p.fit/100),0)-(11-xi.length)*45;}
pickXI=function(){
  const rq=S.req||{play:[],bench:[]};
  let av=S.players.filter(p=>!p.inj&&!p.susp&&!p.loan);av.forEach(ensureRole);
  const noBench=av.filter(p=>!rq.bench.includes(p.id));if(noBench.length>=11)av=noBench;
  const sc=p=>(rq.play.includes(p.id)?100:0)+(p.promise==='Titulaire'&&S.gw-(p.joinGw||0)<=S.N?2.5:0);
  return buildXI(S.tactic.formation,av,sc);
};
// l'entraîneur choisit le système selon les profils
function bestFormation(){
  const c=S.staff.coach,av=S.players.filter(p=>!p.inj&&!p.susp&&!p.loan);av.forEach(ensureRole);const sc=()=>0;
  const res=Object.keys(FSLOTS).map(f=>{const xi=buildXI(f,av,sc);let v=xiValue(xi)/11+FORM[f].att*.15+FORM[f].def*.15;if(c&&c.form===f)v+=1.5*(c.stub||.5)+.6;return {f,v,xi};}).sort((a,b)=>b.v-a.v);
  return res;
}
const FORM_WHY={
 '4-4-2':xi=>{const b=xi.filter(e=>e.role==='BU').map(e=>pshort(e.p));return 'deux avant-centres complémentaires'+(b.length?' ('+b.join(' et ')+')':'')+' et des ailiers pour centrer';},
 '4-3-3':xi=>{const a=xi.filter(e=>e.role==='AIL').map(e=>pshort(e.p));return 'des ailiers rapides'+(a.length?' ('+a.join(' et ')+')':'')+' pour étirer la défense adverse';},
 '3-5-2':xi=>{const m=xi.filter(e=>e.slot==='M').map(e=>pshort(e.p));return 'un milieu fourni et des pistons capables de couvrir tout le couloir';},
 '5-3-2':xi=>{const d=xi.filter(e=>e.role==='DC').map(e=>pshort(e.p));return 'trois défenseurs centraux solides'+(d.length?' ('+d.join(', ')+')':'');},
 '4-2-3-1':xi=>{const m=xi.find(e=>e.role==='MOC');return 'un vrai meneur de jeu'+(m?' ('+pshort(m.p)+')':'')+' derrière l’attaquant, protégé par deux récupérateurs';}
};
function coachPickFormation(){
  const c=S.staff.coach;if(!c||S.req.formation)return;
  const r=bestFormation(),cur=r.find(x=>x.f===c.cur)||r[0];
  if(r[0].f!==c.cur&&r[0].v>cur.v+.35){const old=c.cur;c.cur=r[0].f;S.tactic.why='L’entraîneur est passé du '+old+' au '+r[0].f+' : son effectif lui offre '+FORM_WHY[r[0].f](r[0].xi)+'.';news(S.tactic.why,'');}
  else if(!S.tactic.why||S.tactic.whyF!==c.cur){S.tactic.why='Le '+c.cur+' tire le meilleur de l’effectif : '+FORM_WHY[c.cur]((r.find(x=>x.f===c.cur)||r[0]).xi)+'.'+(c.form===c.cur?' C’est aussi son système préféré.':'');}
  S.tactic.whyF=c.cur;
}
const fitCls=e=>e.pen>=8?'bad':e.pen>0?'warn':e.eff>=e.p.ovr+1?'good':'';
function roleBest(p){ensureRole(p);return Object.keys(ROLE).filter(r=>(r==='GB')===(p.pos==='G')).map(r=>({r,v:Math.round(roleVal(p,r))})).sort((a,b)=>b.v-a.v);}
