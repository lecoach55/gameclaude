'use strict';
/* Cage & Gloire — monde : combattants, organisations, calendrier, classements, montées/descentes, économie. Tourne sous Node. */
var Moteur=(function(){
const _D=typeof module!=='undefined'?require('./data.js'):globalThis;
const _C=typeof module!=='undefined'?require('./combat.js'):globalThis.Combat;
const {ORGS,DIVS,STYLES,ATTRS,PAYS,PAYS_TIER,SURNOMS,SURNOMS_F,ISSUES,TRAITS,BLESSURES,CLANS}=_D;
const COMM=.25,ALLOC=60;
const SALLES=[
 {nom:'Garage aménagé',cap:4,membres:70,loyer:250,mult:1,prix:0},
 {nom:'Salle de quartier',cap:6,membres:150,loyer:650,mult:1.15,prix:18000},
 {nom:'Club régional',cap:8,membres:280,loyer:1500,mult:1.3,prix:60000},
 {nom:'Centre de performance',cap:10,membres:480,loyer:3300,mult:1.45,prix:180000},
 {nom:'Académie d\'élite',cap:12,membres:760,loyer:7200,mult:1.62,prix:450000}];
const COACHS={boxe:{n:'Entraîneur pieds-poings',ic:'🥊',a:['frappe','puiss','def']},lutte:{n:'Entraîneur de lutte',ic:'🤼',a:['lutte']},
 jjb:{n:'Professeur de jiu-jitsu',ic:'🥋',a:['sol']},physique:{n:'Préparateur physique',ic:'🏃',a:['cardio','puiss']},medecin:{n:'Kiné & médecin',ic:'🩺',a:[]},recruteur:{n:'Recruteur',ic:'🔭',a:[]},media:{n:'Attaché de presse',ic:'📣',a:[]}};
const COACH_PAYE=[0,220,600,1500];
const FOCUS={equi:{n:'Équilibré',ic:'⚖️',g:{frappe:.4,puiss:.25,def:.35,lutte:.4,sol:.4,cardio:.4}},
 frappe:{n:'Pieds-poings',ic:'🥊',g:{frappe:1,puiss:.5,def:.6}},lutte:{n:'Lutte',ic:'🤼',g:{lutte:1,cardio:.3,def:.15}},
 sol:{n:'Jiu-jitsu',ic:'🥋',g:{sol:1,lutte:.2,def:.15}},physique:{n:'Physique',ic:'🏃',g:{cardio:1,puiss:.45}},repos:{n:'Repos',ic:'😴',g:{}}};
const INTENS=[{n:'Légère',m:.6,f:2,b:.4},{n:'Normale',m:1,f:5,b:1},{n:'Intense',m:1.4,f:9.5,b:2.3}];
let G=null,R=Math.random;
function rngOf(seed){let a=seed>>>0||1;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function setRng(){let s=G.rs>>>0;R=function(){s=(s+0x6D2B79F5)|0;G.rs=s;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const ri=(a,b)=>a+Math.floor(R()*(b-a+1)),rf=(a,b)=>a+R()*(b-a),pk=a=>a[Math.floor(R()*a.length)],cl=(x,a,b)=>x<a?a:x>b?b:x;
function wpk(w){let s=0;for(const k in w)s+=w[k];let x=R()*s;for(const k in w){x-=w[k];if(x<=0)return k;}return Object.keys(w)[0];}
const ORG=id=>ORGS.find(o=>o.id===id),DIV=id=>DIVS.find(d=>d.id===id);
function ov(f){const a=f.at;return Math.round(a.frappe*.2+a.puiss*.12+a.def*.14+a.lutte*.16+a.sol*.14+a.cardio*.12+a.menton*.12);}
function styleDe(pays){const w={striker:3,cogneur:2,lutteur:2,grappler:2,complet:3,muay:1.2,sambo:.2};
 if(pays==='RU'||pays==='KZ'||pays==='GE'){w.sambo=4;w.lutteur=4;w.striker=1;}if(pays==='BR'){w.grappler=5;w.muay=2;}if(pays==='US'){w.lutteur=4;w.cogneur=3;}
 if(pays==='NL'||pays==='JP'){w.striker=4;w.muay=3;}if(pays==='NG'||pays==='CM'){w.cogneur=4;w.striker=3;}if(pays==='IE'||pays==='GB'){w.striker=4;}return wpk(w);}
function nouveauNom(pays,sexe){const P=PAYS[pays];return {pr:pk(sexe==='F'?P.pf:P.p),nom:pk(P.n)};}
function apparence(pays){const dark={NG:1,CM:1},mid={BR:1,MX:1,MA:1,ES:1,IT:1},asian={JP:1,CN:1,KZ:1};
 let peau;if(dark[pays])peau=ri(4,5);else if(asian[pays])peau=R()<.5?1:2;else if(mid[pays])peau=ri(1,4);else if(pays==='FR'||pays==='US'||pays==='GB'||pays==='BE'||pays==='CA')peau=wpk({0:4,1:3,2:2,3:2,4:2,5:1})*1;else peau=wpk({0:5,1:3,2:1})*1;
 return {peau,chev:ri(0,7),cc:asian[pays]||dark[pays]?0:wpk({0:5,1:3,2:2,3:1,4:.4})*1,barbe:ri(0,5),yeux:ri(0,3),nez:ri(0,3),cic:R()<.25?ri(1,3):0,oreille:R()<.3,ta:ri(0,3),
  short:pk(['#d62839','#1d4ed8','#111827','#f8f8f8','#16a34a','#f59e0b','#7c3aed','#0ea5e9','#e11d48','#b45309']),gant:pk(['#111','#111','#b91c1c','#1e3a8a','#f5f5f5']),seed:ri(1,1e6)};}
/* crée un combattant ; lv = niveau de base, o = options */
function creer(tier,div,o={}){
 const d=DIV(div);const sexe=d.s;const pays=o.pays||wpk(PAYS_TIER[tier]);const st=o.style||styleDe(pays);
 const base=o.lv??([44,54,62,69,76][tier]+rf(-5,5));const age=o.age??rf(21,33);
 const n=nouveauNom(pays,sexe);
 const at={};ATTRS.forEach(([k])=>{at[k]=Math.round(cl(base+(STYLES[st].b[k]||0)*.8+rf(-6,6),20,97));});
 const pot=Math.round(cl(o.pot??(base+(age<24?rf(6,22):age<28?rf(2,12):rf(0,4))),base,96));
 const f={id:'f'+(G.nid++),pr:n.pr,nom:n.nom,sur:R()<.55?pk(sexe==='F'?SURNOMS_F:SURNOMS):'',pays,sexe,age:+age.toFixed(2),div,style:st,at,pot,
  forme:100,fat:0,bless:0,moral:70,pop:Math.round(cl(tier*14+rf(0,22),1,99)),v:0,d:0,n:0,ko:0,sub:0,dec:0,serie:0,elo:0,org:o.org??null,
  histo:[],app:apparence(pays),mine:!!o.mine,dispo:0,prochain:null,train:{f:'equi',i:1},ctr:null,def:0,ret:false,traits:tirerTraits(o.nbTraits),titres:[],riv:{},carr:[],clan:pk(CLANS)};
 // palmarès plausible
 if(!o.vierge){const nb=Math.round(cl((age-20)*1.5+tier*2+rf(-2,3),0,30));for(let i=0;i<nb;i++){if(R()<.55+tier*.04){f.v++;const m=wpk({ko:3,sub:2,dec:5});f[m]++;}else f.d++;}
  if(R()<.15)f.n=1;f.serie=Math.min(f.v,ri(-1,4));}
 f.elo=Math.round(1000+ov(f)*10+(f.v-f.d)*4);
 return f;}
function tirerTraits(n){if(n==null)n=wpk({0:3,1:5,2:2})*1;const L=[];const ks=Object.keys(TRAITS);let k=0;
 while(L.length<n&&k++<40){const t=pk(ks);if(L.includes(t))continue;if((t==='verre'&&L.includes('menton_fer'))||(t==='menton_fer'&&L.includes('verre'))||(t==='diesel'&&L.includes('explosif'))||(t==='explosif'&&L.includes('diesel')))continue;L.push(t);}return L;}
const a_=(f,t)=>f&&f.traits&&f.traits.includes(t);
function blesser(f,grave){const L=BLESSURES.filter(b=>grave?true:!b.grave);let b=pk(L);if(!grave&&R()<.04)b=pk(BLESSURES.filter(x=>x.grave));
 let w=ri(b.s[0],b.s[1]);if(a_(f,'fragile'))w=Math.round(w*1.2);w=Math.max(1,Math.round(w*(1-(G?G.coachs.medecin:0)*.08)));f.bless=Math.max(f.bless,w);f.blessT=b.n;if(b.grave&&f.mine)f.opChoix=1;return b;}
function nouvellePartie(o={}){
 const DF=[{a:30000,p:5},{a:15000,p:0},{a:8000,p:-4}][o.diff??1];
 G={v:1,rs:(o.graine||Math.floor(Math.random()*1e9))>>>0,graine:o.graine||0,sem:1,an0:2027,argent:DF.a,nom:o.nom||'Team Phénix',nid:1,
  salle:{niv:0,membres:52,rep:10},coachs:{boxe:0,lutte:0,jjb:0,physique:0,medecin:0,recruteur:0,media:0},F:{},orgs:{},offres:[],news:[],ev:[],aJouer:[],recrues:[],
  hist:[],stats:{v:0,d:0,titres:0,bourses:0,ko:0,sub:0},trophees:[],noff:1,nev:1,tuto:1,diff:o.diff??1,spons:[],gp:null,gps:[],prix:[],hof:[],succes:{},nspo:1};
 setRng();
 for(const O of ORGS){G.orgs[O.id]={num:ri(8,40)*(O.tier+1),ch:{},defs:{},dernierTitre:{},off:ri(0,O.freq-1),rel:60};
  for(const d of DIVS){const n=d.s==='F'?Math.round(O.max*.75):O.max;
   for(let i=0;i<n;i++){const f=creer(O.tier,d.id,{org:O.id});G.F[f.id]=f;f.ctr={org:O.id,rest:ri(1,4)};}
   const L=roster(O.id,d.id);const c=L.sort((a,b)=>b.elo-a.elo)[0];G.orgs[O.id].ch[d.id]=c.id;c.pop+=10;}}
 // l'écurie du joueur : 3 jeunes espoirs
 const dv=o.divs||['le','mm','fc'];
 dv.forEach((dd,i)=>{const f=creer(0,dd,{org:'cfr',mine:true,nbTraits:i===1?2:1,lv:[47,45,46][i]+rf(-1,2),age:rf(20,24),pot:[80,74,84][i]+ri(-3,3)+DF.p,pays:i===2?'FR':pk(['FR','FR','FR','BE','MA']),vierge:true});
  f.v=ri(2,4);f.d=ri(0,1);f.serie=f.v;['ko','sub','dec'].forEach(k=>f[k]=0);for(let k=0;k<f.v;k++)f[pk(['ko','sub','dec'])]++;f.pop=ri(4,10);f.elo=Math.round(1000+ov(f)*10);
  f.ctr={org:'cfr',rest:4,show:Math.round(ORG('cfr').show*.6)};G.F[f.id]=f;});
 recruesMaj();
 news('🏁','Bienvenue ! Votre écurie '+G.nom+' ouvre ses portes avec trois jeunes espoirs sous contrat au '+ORG('cfr').nom+'.','#2fbf71');
 // planifier les premiers événements
 for(let s=1;s<=6;s++)for(const O of ORGS)if((s+G.orgs[O.id].off)%O.freq===0)creerEvent(O,s+4);
 return G;}
function roster(org,div){const L=[];for(const id in G.F){const f=G.F[id];if(f.org===org&&f.div===div&&!f.ret)L.push(f);}return L;}
function classement(org,div){const L=roster(org,div).sort((a,b)=>b.elo-a.elo);const c=G.orgs[org].ch[div];const i=L.findIndex(f=>f.id===c);
 if(i>0){const x=L.splice(i,1)[0];L.unshift(x);}return L;}
function rang(f){if(!f.org)return null;const L=classement(f.org,f.div);const i=L.findIndex(x=>x.id===f.id);if(G.orgs[f.org].ch[f.div]===f.id)return 0;return G.orgs[f.org].ch[f.div]?i:i+1;}
function rangTxt(f){const r=rang(f);if(r===null)return 'Libre';return r===0?'Champion':'N°'+r;}
function mes(){return Object.values(G.F).filter(f=>f.mine&&!f.ret);}
function news(ic,t,c){G.news.unshift({s:G.sem,ic,t,c:c||''});if(G.news.length>80)G.news.length=80;}
function date(s){s=s??G.sem;const an=G.an0+Math.floor((s-1)/52),w=(s-1)%52;const mois=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
 return 'Sem. '+(w+1)+' · '+mois[Math.floor(w/52*12)]+' '+an;}
function dispo(f,s){return !f.ret&&!f.prochain&&f.bless<=0&&f.dispo<=s&&f.org&&!f.inGP;}
function bourse(f,org,titre,main){const O=ORG(org);let r=rang(f);r=r==null?12:r;
 return Math.round(O.show*(.55+f.pop/110)*(titre?2.2:1)*(main?1.35:1)*(1+Math.max(0,10-r)/25)/50)*50;}
/* ---------- événements ---------- */
function creerEvent(O,s){const go=G.orgs[O.id];go.num++;
 const ev={id:'e'+(G.nev++),org:O.id,sem:s,nom:O.court+' '+go.num,ville:pk(O.villes),combats:[],fait:false};
 const nbF=[6,7,8,8,10][O.tier];const usage=new Set();
 const divs=DIVS.map(d=>d.id).sort(()=>R()-.5);
 // combats de mes combattants d'abord
 for(const f of mes())if(f.org===O.id&&dispo(f,s)&&!G.offres.some(x=>x.f===f.id&&x.type==='combat')&&R()<.85){
  const L=classement(O.id,f.div).filter(x=>x.id!==f.id&&dispo(x,s)&&!usage.has(x.id)&&!x.mine);if(!L.length)continue;
  const rf_=rang(f)||0;L.sort((a,b)=>Math.abs((rang(a)||0)-rf_)-Math.abs((rang(b)||0)-rf_)+(R()-.5)*3);
  let adv=L[Math.min(L.length-1,ri(0,2))];const chId=G.orgs[O.id].ch[f.div];let titre=false;
  if(chId===f.id){const c=L.filter(x=>rang(x)<=4);if(c.length)adv=c[0];titre=true;go.dernierTitre[f.div]=s;}
  else if(chId&&rf_>=1&&(rf_<=2||(rf_<=3&&f.serie>=2))&&s-(go.dernierTitre[f.div]||-99)>=8){const C=G.F[chId];if(C&&dispo(C,s)&&!usage.has(chId)){adv=C;titre=true;go.dernierTitre[f.div]=s;}}
  else if(chId===adv.id)titre=true;
  let rival=false;if(!titre){const rv=Object.keys(f.riv||{}).map(id=>G.F[id]).filter(x=>x&&x.org===O.id&&x.div===f.div&&dispo(x,s)&&!usage.has(x.id));if(rv.length&&R()<.45){adv=rv[0];rival=true;}}
  usage.add(f.id);usage.add(adv.id);
  const c={id:ev.id+'c'+ev.combats.length,a:f.id,b:adv.id,div:f.div,titre,mine:true,ok:false,res:null,rival};ev.combats.push(c);f.prochain=c.id;adv.prochain=c.id;
  const sh=Math.round(bourse(f,O.id,titre,false)*(rival?1.3:1)/50)*50;
  G.offres.push({id:'o'+(G.noff++),type:'combat',f:f.id,ev:ev.id,c:c.id,adv:adv.id,show:sh,win:sh,exp:s-3,titre,rival});
 }
 reserverGP(O,ev,s,usage);
 for(const dv of divs){if(ev.combats.length>=nbF)break;
  const L=classement(O.id,dv).filter(x=>dispo(x,s)&&!usage.has(x.id)&&!x.mine);if(L.length<2)continue;
  const ch=G.orgs[O.id].ch[dv];let a,b,titre=false;
  const chf=ch&&G.F[ch];
  if(chf&&!chf.mine&&dispo(chf,s)&&!usage.has(ch)&&s-(go.dernierTitre[dv]||-99)>=10){const c=L.filter(x=>x.id!==ch).slice(0,3);if(c.length){a=chf;b=c[0];titre=true;go.dernierTitre[dv]=s;}}
  if(!a){const i=ri(0,Math.min(L.length-2,9));a=L[i];const cand=L.filter(x=>x!==a&&x.id!==ch);if(!cand.length)continue;cand.sort((x,y)=>Math.abs(L.indexOf(x)-i)-Math.abs(L.indexOf(y)-i));b=cand[Math.min(cand.length-1,ri(0,1))];}
  usage.add(a.id);usage.add(b.id);const c={id:ev.id+'c'+ev.combats.length,a:a.id,b:b.id,div:dv,titre,mine:false,ok:true,res:null};ev.combats.push(c);a.prochain=c.id;b.prochain=c.id;}
 // tête d'affiche
 let best=null,bs=-1;for(const c of ev.combats){const sc=(c.titre?1000:0)+G.F[c.a].pop+G.F[c.b].pop;if(sc>bs){bs=sc;best=c;}}if(best)best.main=true;
 G.ev.push(ev);return ev;}
function rounds(c,O){return c.titre||(c.gp===2)||(c.main&&O.tier>=1)?5:3;}
function planIA(f,adv){const s=f.style,a=f.at,b=adv.at;if((s==='lutteur'||s==='sambo'||s==='grappler')&&(b.frappe>a.frappe-3))return 'sol';
 if((s==='striker'||s==='cogneur'||s==='muay')&&b.lutte>a.lutte-2)return 'debout';if(a.frappe>b.frappe+8&&a.cardio>65)return 'pression';return 'equi';}
function trouverCombat(cid){for(const e of G.ev)for(const c of e.combats)if(c.id===cid)return {e,c};return null;}
/* simule un combat (IA ou joueur) ; renvoie l'objet de simulation */
function preparerSim(cid,planJ,changes){const {e,c}=trouverCombat(cid);const A=G.F[c.a],B=G.F[c.b];const O=ORG(e.org);
 const pa=A.mine?(planJ||'equi'):planIA(A,B),pb=B.mine?(planJ||'equi'):planIA(B,A);
 if(!c.seed)c.seed=ri(1,2e9);
 const bc=bonusCamp(c);A.bonusCamp=bc;
 const sim=_C.simuler([A,B],{seed:c.seed,rounds:rounds(c,O),plans:[pa,pb],changes});delete A.bonusCamp;return sim;}
function appliquer(cid,sim){const {e,c}=trouverCombat(cid);if(c.res)return;const O=ORG(e.org);const A=G.F[c.a],B=G.F[c.b];const res=sim.res;
 c.res={w:res.w,m:res.m,r:res.r,t:res.temps,tech:res.tech||'',st:res.stats,cards:res.cards};
 const F=[A,B];const ea=1/(1+Math.pow(10,(B.elo-A.elo)/400));const fin=['ko','tko','sub'].includes(res.m);const K=fin?46:36;
 const sa=res.w===0?1:res.w===1?0:.5;A.elo=Math.round(A.elo+K*(sa-ea));B.elo=Math.round(B.elo+K*((1-sa)-(1-ea)));
 F.forEach((f,i)=>{const adv=F[1-i];const w=res.w===i,l=res.w===1-i;
  if(w){f.v++;f[res.m==='tko'?'ko':['ud','sd','md'].includes(res.m)?'dec':res.m]++;f.serie=f.serie>0?f.serie+1:1;f.pop=cl(f.pop+((fin?5:3)+(c.main?3:0)+(c.titre?6:0)+(c.rival?4:0)+(c.gp!=null?4:0)+O.tier*.6)*(a_(f,'showman')?1.5:1)*(f.mine?1+G.coachs.media*.15:1),0,100);f.moral=cl(f.moral+10*(a_(f,'tete_brulee')?1.5:1),0,100);}
  else if(l){f.d++;f.serie=f.serie<0?f.serie-1:-1;f.pop=cl(f.pop-(fin?3:1.5),0,100);f.moral=cl(f.moral-12*(a_(f,'tete_brulee')?1.5:1),0,100);if(res.m==='ko'||res.m==='tko'){f.at.menton=Math.max(20,f.at.menton-(res.m==='ko'?1.5:.7));if(R()<.3)blesser(f);}}
  else{f.n++;f.serie=0;}
  f.prochain=null;f.dispo=G.sem+ri(5,8)+(l&&fin?3:0);f.fat=cl(f.fat+25,0,100);f.forme=cl(100-f.fat*.6,30,100);
  if(R()<(a_(f,'fragile')?.2:.1))blesser(f);
  if(f.mine&&!adv.mine&&(l||(['sd','md','dr'].includes(res.m)))){f.riv=f.riv||{};f.riv[adv.id]=(f.riv[adv.id]||0)+1;}
  if(c.rival&&f.riv&&w)delete f.riv[adv.id];
  // l'expérience fait progresser
  const k=pk(ATTRS)[0];f.at[k]=cl(f.at[k]+(w?.9:.5)*(f.age<30?1:.4),20,f.pot+12);
  f.histo.unshift({s:G.sem,adv:adv.id,an:adv.pr+' '+adv.nom,ap:adv.pays,r:w?'V':l?'D':'N',m:res.m,rd:res.r,t:res.temps,tech:res.tech||'',org:e.org,ev:e.nom,titre:!!c.titre,main:!!c.main,gp:c.gp,tier:O.tier});
  if(!f.mine&&f.histo.length>12)f.histo.length=12;
  if(f.ctr&&f.ctr.org===e.org)f.ctr.rest--;
 });
 // titre
 const go=G.orgs[e.org];if(c.titre){const ch=go.ch[c.div];const W=res.w>=0?F[res.w]:null;
  if(W&&W.id!==ch){go.ch[c.div]=W.id;go.defs[c.div]=0;go.lig=go.lig||{};(go.lig[c.div]=go.lig[c.div]||[]).push({id:W.id,n:W.pr+' '+W.nom,p:W.pays,s:G.sem,mine:!!W.mine});W.pop=cl(W.pop+8,0,100);W.titres=W.titres||[];W.titres.push(O.court);
   news('🏆',W.pr+' '+W.nom+' devient '+(W.sexe==='F'?'championne':'champion')+' '+O.court+' des '+DIV(c.div).nom.toLowerCase().replace(' (f)','')+' !',O.c1);
   if(W.mine){G.stats.titres++;G.trophees.push({s:G.sem,f:W.id,org:e.org,div:c.div});G.salle.rep=cl(G.salle.rep+6+O.tier*5,0,100);}}
  else if(W&&W.id===ch){go.defs[c.div]=(go.defs[c.div]||0)+1;W.def=(W.def||0)+1;}}
 // argent et nouvelles pour mes combattants
 F.forEach((f,i)=>{if(!f.mine)return;const w=res.w===i;const sh=c.show??bourse(f,e.org,c.titre,c.main);let tot=sh+(w?(c.win??sh):0);
  let bonus=0;if(w&&fin&&R()<(c.main?.55:.35)){bonus=Math.round(O.show*1.5/50)*50;tot+=bonus;}
  const com=Math.round(tot*pctF(f));G.argent+=com;G.stats.bourses+=com;if(w){G.stats.v++;if(res.m==='ko'||res.m==='tko')G.stats.ko=(G.stats.ko||0)+1;if(res.m==='sub')G.stats.sub=(G.stats.sub||0)+1;for(const sp of G.spons||[])if(sp.f===f.id&&sp.fin>=G.sem&&sp.bonusV){G.argent+=sp.bonusV;c.gain=(c.gain||0)+sp.bonusV;}}else if(res.w===1-i)G.stats.d++;
  G.salle.rep=cl(G.salle.rep+(w?1.2+O.tier*.8+(fin?.6:0):-.6),0,100);
  c.gain=(c.gain||0)+com;c.bonus=bonus;
  const adv=F[1-i];news(w?'✅':res.w<0?'➖':'❌',f.pr+' '+f.nom+(w?' bat ':res.w<0?' fait match nul contre ':' s\'incline face à ')+adv.pr+' '+adv.nom+' ('+ISSUES[res.m]+(fin?', R'+res.r:'')+') — '+e.nom+'. Commission : '+fmtE(com)+(bonus?' (dont bonus de performance)':''),w?'#2fbf71':'#e8344a');});
 if(c.gp!=null)gpResultat(c,e,res);
 verifierSucces();
}
function fmtE(x){x=Math.round(x);return (x<0?'−':'')+Math.abs(x).toString().replace(/\B(?=(\d{3})+(?!\d))/g,' ')+' €';}
/* ---------- semaine ---------- */
function avancer(){
 if(G.aJouer.length)return {attente:true};
 setRng();G.sem++;const s=G.sem;const out={evts:[],popups:[]};
 // économie hebdomadaire
 const S=SALLES[G.salle.niv];const cible=S.membres*cl(.55+G.salle.rep/110,.5,1.25);G.salle.membres=Math.round(G.salle.membres+(cible-G.salle.membres)*.08+rf(-1,1));
 const rec=G.salle.membres*12;let dep=S.loyer+mes().length*ALLOC;for(const k in G.coachs)dep+=COACH_PAYE[G.coachs[k]];
 let spo=0;G.spons=(G.spons||[]).filter(sp=>{if(sp.fin<s||!G.F[sp.f]||(sp.f&&!G.F[sp.f].mine)){news('📄','Fin du contrat de sponsoring '+sp.nom+'.');return false;}spo+=sp.hebdo;return true;});
 G.argent+=rec-dep+spo;G.semSpo=spo;G.hist.push({s,rec:rec+spo,dep,a:Math.round(G.argent)});if(G.hist.length>104)G.hist.shift();G.semRec=rec;G.semDep=dep;
 G.salle.rep=cl(G.salle.rep-.04,0,100);
 // entraînement de mes combattants
 for(const f of mes())entrainer(f);
 if(mes().some(f=>a_(f,'leader')))mes().forEach(f=>f.moral=cl(f.moral+.6,0,100));
 // vieillissement
 for(const id in G.F){const f=G.F[id];if(f.ret)continue;f.age+=1/52;if(f.bless>0)f.bless--;if(!f.mine){f.fat=Math.max(0,f.fat-6);f.forme=cl(100-f.fat*.6,30,100);}}
 // offres expirées
 G.offres=G.offres.filter(o=>{if(o.exp<s){if(o.type==='combat')refuserCombat(o,true);else if(o.type==='contrat')news('⌛','L\'offre de '+ORG(o.org).court+' pour '+nomF(o.f)+' a expiré.');return false;}return true;});
 // calendrier
 for(const O of ORGS)if((s+G.orgs[O.id].off)%O.freq===0)creerEvent(O,s+5);
 for(const e of G.ev)if(e.sem===s&&!e.fait){if(e.maison)recetteGala(e);for(const c of e.combats){if(c.res)continue;
   if(c.mine){if(c.ok){const f=G.F[c.a];if(f.bless>0){forfait(e,c);continue;}G.aJouer.push(c.id);}else annuler(c);}else{const A=G.F[c.a],B=G.F[c.b];if(A.bless>0||B.bless>0){annuler(c);continue;}appliquer(c.id,preparerSim(c.id));}}
  e.fait=!G.aJouer.some(id=>id.startsWith(e.id+'c'));out.evts.push(e.id);
  const m=e.combats.find(c=>c.main&&c.res&&!c.mine);if(m&&ORG(e.org).tier>=2&&m.res.w>=0){const W=G.F[[m.a,m.b][m.res.w]],L=G.F[[m.a,m.b][1-m.res.w]];news(ORG(e.org).tier===4?'🌟':'📰',e.nom+' ('+e.ville+') : '+W.pr+' '+W.nom+' bat '+L.pr+' '+L.nom+' par '+ISSUES[m.res.m].toLowerCase()+(m.titre?' — combat pour le titre':'')+'.',ORG(e.org).c1);}}
 G.ev=G.ev.filter(e=>!e.fait||s-e.sem<10);
 if(s%4===0){mercato();for(const f of mes()){f.carr=f.carr||[];f.carr.push({s,o:ov(f)});if(f.carr.length>160)f.carr.shift();}}
 if(s%52===8)demarrerGP();
 if(s%52===0)prixAnnuels();
 verifierSucces();
 if(s%4===2)recruesMaj();
 for(const O of ORGS)for(const d of DIVS){const L=classement(O.id,d.id);const ch=G.orgs[O.id].ch[d.id];L.forEach((f,i)=>{const r=f.id===ch?0:(ch?i:i+1);if(f.rpS!==s){f.rp0=f.rp??r;f.rp=r;f.rpS=s;}});}
 gpVerifier();const p=evenementAleatoire();if(p)out.popups.push(p);
 for(const f of mes()){const sp=speciaux(f);if(sp)out.popups.push(sp);}
 if(s%52===1){nouveauxObjectifs();G.an0s={v:G.stats.v,d:G.stats.d,t:G.stats.titres,b:G.stats.bourses,a:G.argent,ko:(G.stats.ko||0)+(G.stats.sub||0)};}
 if(s%52===0&&G.an0s){const x=G.an0s;out.popups.push(mkP('bilan',{v:G.stats.v-x.v,d:G.stats.d-x.d,t:G.stats.titres-x.t,b:G.stats.bourses-x.b,da:G.argent-x.a,f:(G.stats.ko||0)+(G.stats.sub||0)-x.ko,an:G.an0+Math.floor((s-1)/52),ob:G.obj?G.obj.L.filter(o=>o.ok).length:0,best:mes().sort((p,q)=>ov(q)-ov(p))[0]?.id}));}majObjectifs();if(s%52===0)bilanObjectifs(out);
 if(G.argent<-15000&&!G.faillite){G.faillite=1;out.popups.push({id:'faillite',t:'Les huissiers à la porte',d:'Votre écurie accumule les dettes. Vendez du matériel, baissez les dépenses ou trouvez un sponsor !',ch:[{t:'Compris'}]});}
 if(G.argent>0)G.faillite=0;
 return out;}
function nomF(id){const f=G.F[id];return f?f.pr+' '+f.nom:'?';}
function forfait(e,c){const f=G.F[c.a];news('🚑',f.pr+' '+f.nom+' est blessé et déclare forfait pour '+e.nom+'.','#e8344a');f.pop=cl(f.pop-3,0,100);G.orgs[e.org].rel=cl(G.orgs[e.org].rel-6,0,100);annuler(c);}
function annuler(c){[c.a,c.b].forEach(id=>{const f=G.F[id];if(f&&f.prochain===c.id)f.prochain=null;});c.res={annule:true};}
function refuserCombat(o,auto){const t=trouverCombat(o.c);if(!t)return;const {e,c}=t;const f=G.F[o.f];if(f.prochain===c.id)f.prochain=null;
 G.orgs[e.org].rel=cl(G.orgs[e.org].rel-(auto?5:2),0,100);
 // remplaçant
 const L=classement(e.org,c.div).filter(x=>dispo(x,e.sem)&&!x.mine&&x.id!==c.b);if(L.length){const x=L[0];c.a=x.id;c.mine=false;c.ok=true;x.prochain=c.id;}else annuler(c);
 if(auto)news('⌛',f.pr+' '+f.nom+' n\'a pas répondu à l\'offre de '+e.nom+'.');}
function accepterCombat(oid){const o=G.offres.find(x=>x.id===oid);if(!o)return;const {e,c}=trouverCombat(o.c);c.ok=true;c.show=o.show;c.win=o.win;c.plan='equi';G.offres=G.offres.filter(x=>x!==o);
 G.orgs[e.org].rel=cl(G.orgs[e.org].rel+2,0,100);news('✍️',nomF(o.f)+' affrontera '+nomF(o.adv)+' à '+e.nom+' ('+e.ville+', '+date(e.sem)+').',ORG(e.org).c1);}
function refuser(oid){const o=G.offres.find(x=>x.id===oid);if(!o)return;G.offres=G.offres.filter(x=>x!==o);if(o.type==='combat')refuserCombat(o,false);else if(o.type==='contrat'){if(o.renouv&&G.F[o.f].org===o.org&&G.F[o.f].ctr&&G.F[o.f].ctr.rest<=0){libere(G.F[o.f],true);}}}
function accepterContrat(oid){const o=G.offres.find(x=>x.id===oid);if(!o)return;const f=G.F[o.f];G.offres=G.offres.filter(x=>x!==o);
 G.offres=G.offres.filter(x=>!(x.f===f.id&&x.type==='contrat'));
 if(f.org&&f.org!==o.org){const go=G.orgs[f.org];if(go.ch[f.div]===f.id){go.ch[f.div]=null;news('👑',f.pr+' '+f.nom+' laisse sa ceinture '+ORG(f.org).court+' vacante.');}
  if(f.prochain){const t=trouverCombat(f.prochain);if(t&&!t.c.res)annuler(t.c);G.offres=G.offres.filter(x=>!(x.f===f.id&&x.type==='combat'));}}
 const nv=f.org!==o.org;f.org=o.org;f.ctr={org:o.org,rest:o.nb,show:o.show};if(o.prime)G.argent+=Math.round(o.prime*COMM);
 f.elo=Math.max(f.elo,eloEntree(o.org,f.div));
 news('🖊️',f.pr+' '+f.nom+(nv?' signe chez ':' prolonge avec ')+ORG(o.org).nom+' ('+o.nb+' combats, '+fmtE(o.show)+' + '+fmtE(o.show)+' de victoire).',ORG(o.org).c1);}
function eloEntree(org,div){const L=classement(org,div);if(!L.length)return 1000;return L[Math.min(L.length-1,Math.max(0,L.length-3))].elo-5;}
function offreContrat(f,org,raison,renouv){if(G.offres.some(x=>x.f===f.id&&x.type==='contrat'&&x.org===org))return;const O=ORG(org);
 const show=Math.round(O.show*(.55+f.pop/110)*(f.org===org?1.1:1)/50)*50;
 G.offres.push({id:'o'+(G.noff++),type:'contrat',f:f.id,org,nb:O.tier>=3?ri(3,4):4,show,prime:O.tier>=2?Math.round(show*.5/50)*50:0,exp:G.sem+3,raison,renouv:!!renouv});
 news('📨',O.nom+' propose un contrat à '+f.pr+' '+f.nom+(raison?' ('+raison+')':'')+'.',O.c1);}
function libere(f,quiet){const go=f.org&&G.orgs[f.org];if(go&&go.ch[f.div]===f.id)go.ch[f.div]=null;const ex=f.org;f.org=null;f.ctr=null;
 if(f.mine){if(!quiet)news('✂️',f.pr+' '+f.nom+' est libéré par '+ORG(ex).nom+'.','#e8344a');const t=Math.max(0,ORG(ex).tier-1);offreContrat(f,ORGS[t].id,'agent libre');}}
/* ---------- mercato mensuel : montées, descentes, retraites, renfort ---------- */
function mercato(){
 // progression des combattants IA
 for(const id in G.F){const f=G.F[id];if(f.mine||f.ret)continue;const af=f.age<24?1.2:f.age<28?.8:f.age<31?.4:f.age<33?0:-.7;
  for(const [k] of ATTRS){if(af>0&&f.at[k]<f.pot+(STYLES[f.style].b[k]||0)*.8)f.at[k]+=af*rf(0,.55);else if(af<0&&k!=='sol')f.at[k]+=af*rf(0,.6);}
  f.at.def=Math.min(f.at.def,97);}
 for(let t=3;t>=0;t--){const O=ORGS[t],U=ORGS[t+1];
  for(const d of DIVS){const L=classement(O.id,d.id);
   L.forEach((f,i)=>{if(f.mine||f.prochain)return;const champ=G.orgs[O.id].ch[d.id]===f.id;
    if((champ&&(f.def>=1||f.serie>=3))||(i<=2&&f.serie>=3)||f.serie>=5){if(R()<.55){monter(f,U.id);}}});}}
 {const O=ORGS[0];for(const d of DIVS){const max=d.s==='F'?Math.round(O.max*.75):O.max;const L=classement(O.id,d.id).filter(f=>!f.mine&&!f.prochain&&!f.inGP&&G.orgs[O.id].ch[d.id]!==f.id).sort((a,b)=>(a.elo-a.age*3)-(b.elo-b.age*3));let ex=roster(O.id,d.id).length-max-2;while(ex-->0&&L.length){const f=L.shift();f.ret=true;}}}
 for(let t=1;t<=4;t++){const O=ORGS[t];for(const d of DIVS){const L=classement(O.id,d.id);const max=d.s==='F'?Math.round(O.max*.75):O.max;
   // trop de monde : les plus faibles redescendent
   let extra=L.length-max;const cand=L.filter(f=>!f.mine&&!f.prochain&&G.orgs[O.id].ch[d.id]!==f.id).sort((a,b)=>(a.elo+a.serie*15)-(b.elo+b.serie*15));
   while(extra>0&&cand.length){const f=cand.shift();descendre(f,ORGS[t-1].id);extra--;}
   for(const f of cand)if(f.serie<=-3&&R()<.6)descendre(f,ORGS[t-1].id);}}
 // mes combattants
 for(const f of mes()){
  if(!f.org){if(!G.offres.some(x=>x.f===f.id&&x.type==='contrat')){let t=0;for(let k=4;k>=0;k--){const md=medianeOv(ORGS[k].id,f.div);if(ov(f)>=md-3){t=k;break;}}offreContrat(f,ORGS[Math.min(t,f.pop>40?t:Math.min(t,2))].id,'agent libre');}continue;}
  const O=ORG(f.org);const r=rang(f);const champ=r===0;
  if(O.tier<4&&!G.offres.some(x=>x.f===f.id&&x.type==='contrat'&&x.org!==f.org)&&(f.dernOffre||0)+8<=G.sem){
   const U=ORGS[O.tier+1];const md=medianeOv(U.id,f.div);
   if(champ||(r<=3&&f.serie>=2)||(f.serie>=3&&ov(f)>=md-4)||(f.serie>=2&&ov(f)>=md+2)){f.dernOffre=G.sem;offreContrat(f,U.id,champ?'champion '+O.court:'série de '+f.serie+' victoires');}}
  if(O.tier>=1&&(f.serie<=-3||(f.serie<=-2&&r>=classement(f.org,f.div).length-2))&&!f.prochain)libere(f);
  else if(f.ctr&&f.ctr.rest<=0&&!f.prochain&&!G.offres.some(x=>x.f===f.id&&x.type==='contrat'&&x.org===f.org))offreContrat(f,f.org,'renouvellement',true);}
 // retraites
 for(const id in G.F){const f=G.F[id];if(f.ret||f.mine||f.prochain||f.inGP)continue;if(f.age>39||(f.age>34&&R()<.035*(f.age-33))||(f.d>f.v+6&&R()<.2)){f.ret=true;temple(f);if(G.orgs[f.org]&&G.orgs[f.org].ch[f.div]===f.id){G.orgs[f.org].ch[f.div]=null;}}}
 for(const f of mes())if(f.age>=40&&!f.prochain){f.ret=true;temple(f);news('🎗️',f.pr+' '+f.nom+' prend sa retraite à 40 ans. Merci champion !');}
 // renforts : chaque organisation reste pleine
 for(const O of ORGS)for(const d of DIVS){const max=d.s==='F'?Math.round(O.max*.75):O.max;let L=roster(O.id,d.id);
  while(L.length<max){let f=null;if(O.tier>0){const B=classement(ORGS[O.tier-1].id,d.id).filter(x=>!x.mine&&!x.prochain&&G.orgs[x.org].ch[d.id]!==x.id);if(B.length&&R()<.5)f=B[0];}
   if(f)monter(f,O.id,true);else{f=creer(O.tier,d.id,{org:O.id,age:O.tier===0?rf(20,26):rf(23,31)});f.ctr={org:O.id,rest:4};G.F[f.id]=f;f.elo=eloEntree(O.id,d.id);}
   L=roster(O.id,d.id);}
  if(!G.orgs[O.id].ch[d.id]){const C=classement(O.id,d.id).filter(x=>!x.mine);if(C.length>=2&&R()<.6){/* titre vacant : décerné au prochain combat entre les deux premiers */G.orgs[O.id].dernierTitre[d.id]=-99;}}}
 // titre vacant : couronner le n°1 si personne
 for(const O of ORGS)for(const d of DIVS){if(!G.orgs[O.id].ch[d.id]){const L=classement(O.id,d.id).filter(x=>!x.mine&&!x.prochain);if(L.length)G.orgs[O.id].ch[d.id]=L[0].id;}}
 // nettoyage des retraités anciens
 for(const id in G.F){const f=G.F[id];if(f.ret&&!f.mine&&!f.prochain&&G.sem-(f.histo[0]?.s||0)>60)delete G.F[id];}
}
function medianeOv(org,div){const L=roster(org,div).map(ov).sort((a,b)=>a-b);return L.length?L[Math.floor(L.length/2)]:50;}
function monter(f,org,quiet){const go=G.orgs[f.org];if(go&&go.ch[f.div]===f.id)go.ch[f.div]=null;f.org=org;f.ctr={org,rest:4};f.elo=Math.max(f.elo,eloEntree(org,f.div));f.serie=Math.min(f.serie,1);
 if(!quiet&&ORG(org).tier>=3&&f.pop>45)news('⬆️',f.pr+' '+f.nom+' signe chez '+ORG(org).court+'.');}
function descendre(f,org){const go=G.orgs[f.org];if(go&&go.ch[f.div]===f.id)go.ch[f.div]=null;const ex=f.org;
 if(ORG(ex).tier>=2&&f.age<33&&!f.inGP&&R()<.14){f.org=null;f.ctr=null;f.libre=true;f.serie=0;f.prime=Math.round((ov(f)*ov(f)*1.8*(1+(f.pot-ov(f))/30)+f.pop*120)/100)*100;f.potVu=f.pot;G.recrues.push(f.id);news('🔓',f.pr+' '+f.nom+' est libéré par '+ORG(ex).court+' : il cherche une nouvelle écurie.');return;}
 f.org=org;f.ctr={org,rest:3};f.serie=0;}
/* ---------- entraînement ---------- */
function autoTrain(f){const a=f.at;const pr=f.prochain&&trouverCombat(f.prochain);const proche=pr&&pr.c.ok&&pr.e.sem-G.sem<=2;
 if(f.fat>62||f.bless>0){f.train.f='repos';f.train.i=0;return;}
 const g={frappe:(a.frappe+a.def)/2,lutte:a.lutte,sol:a.sol,physique:(a.cardio+a.puiss)/2};let k='equi',mn=1e9;for(const x in g){const cap=f.pot+(STYLES[f.style].b[x==='physique'?'cardio':x==='frappe'?'frappe':x]||0)*.8;const v=g[x]-cap;if(v<mn){mn=v;k=x;}}
 f.train.f=k;f.train.i=proche?0:f.fat>35?1:2;}
function entrainer(f){if(f.train.auto)autoTrain(f);
 const I=INTENS[f.train.i],Fc=FOCUS[f.train.f];const S=SALLES[G.salle.niv];
 if(f.bless>0||f.train.f==='repos'){f.fat=Math.max(0,f.fat-(f.train.f==='repos'?14:8)-G.coachs.medecin*2);}
 else{const ageF=f.age<23?1.3:f.age<27?1.1:f.age<30?.85:f.age<33?.55:.3;
  for(const k in Fc.g){let co=1;for(const c in COACHS)if(COACHS[c].a.includes(k))co+=G.coachs[c]*.28;
   const cap=f.pot+(STYLES[f.style].b[k]||0)*.8;const room=cl((cap-f.at[k])/18,.04,1);
   f.at[k]=cl(f.at[k]+.55*Fc.g[k]*I.m*S.mult*co*ageF*room*(.75+f.moral/280)*(a_(f,'bosseur')?1.2:1)*rf(.7,1.3),20,99);}
  f.fat=cl(f.fat+I.f-6-G.coachs.medecin*1.5-G.coachs.physique*.8,0,100);
  const pB=.0045*I.b*(1+f.fat/35)*(1-G.coachs.medecin*.2)*(a_(f,'fragile')?1.8:1);if(R()<pB){const b=blesser(f);news('🤕',f.pr+' '+f.nom+' se blesse à l\'entraînement : '+b.n.toLowerCase()+' ('+f.bless+' sem.).','#e8344a');}}
 if(f.age>32){for(const k of ['cardio','puiss','frappe','lutte','def'])f.at[k]=Math.max(20,f.at[k]-.035*(f.age-32));}
 f.forme=cl(100-f.fat*.6,30,100);f.moral=cl(f.moral+(70-f.moral)*.03,0,100);}
/* ---------- recrutement ---------- */
function recruesMaj(){G.recrues=G.recrues.filter(id=>{const f=G.F[id];const k=f&&!f.mine&&R()<.4;if(f&&!f.mine&&!k&&!f.org){f.ret=true;}return k;});
 const nr=G.coachs.recruteur||0;while(G.recrues.length<6+nr){const tier=wpk({0:6,1:3,2:1.2+nr*.4,3:.4+nr*.3});const d=pk(DIVS).id;const jeune=R()<.65;
  const f=creer(tier,d,{age:jeune?rf(19,23):rf(24,31),lv:[42,51,59,66][tier]+rf(-4,3),pot:jeune?[58,64,70,76][tier]+rf(0,20)+nr*2:undefined});
  f.potVu=Math.round(f.pot+rf(-1,1)*[12,8,4,1.5][nr]);
  f.libre=true;f.prime=Math.round((ov(f)*ov(f)*1.8*(1+(f.pot-ov(f))/30)+f.pop*120)/100)*100;G.F[f.id]=f;G.recrues.push(f.id);}}
function signer(id){const f=G.F[id];if(!f||G.argent<f.prime||mes().length>=SALLES[G.salle.niv].cap)return false;G.argent-=f.prime;f.mine=true;f.libre=false;G.recrues=G.recrues.filter(x=>x!==id);
 news('🤝',f.pr+' '+f.nom+' rejoint '+G.nom+' !','#e9c46a');let t=0;for(let k=4;k>=0;k--){if(ov(f)>=medianeOv(ORGS[k].id,f.div)-2){t=k;break;}}offreContrat(f,ORGS[t].id,'nouvelle recrue');return true;}
function liberer(id){const f=G.F[id];if(!f)return;f.mine=false;if(f.prochain){const t=trouverCombat(f.prochain);if(t&&!t.c.res)annuler(t.c);}G.offres=G.offres.filter(x=>x.f!==id);if(!f.org)f.ret=true;news('👋',f.pr+' '+f.nom+' quitte l\'écurie.');}
function ameliorerSalle(){const n=G.salle.niv+1;if(n>=SALLES.length||G.argent<SALLES[n].prix)return false;G.argent-=SALLES[n].prix;G.salle.niv=n;news('🏗️','Votre salle devient : '+SALLES[n].nom+' !','#e9c46a');return true;}
function coach(k,niv){if(niv<0||niv>3)return;G.coachs[k]=niv;}
/* ---------- petits événements aléatoires ---------- */
const EVENTS=[
 {id:'sponsor',p:1.3,cond:()=>mes().some(f=>!(G.spons||[]).some(sp=>sp.f===f.id)),make:()=>{const f=pk(mes().filter(f=>!(G.spons||[]).some(sp=>sp.f===f.id)));return offreSponsor(f);},
  t:x=>'Un sponsor pour '+nomF(x.f),d:x=>'La marque '+x.nom+' veut habiller '+nomF(x.f)+' : '+fmtE(x.hebdo)+' par semaine pendant '+x.duree+' semaines, plus '+fmtE(x.bonusV)+' par victoire.',
  ch:[{t:'Signer le contrat',f:x=>{signerSponsor(x);}},{t:'Refuser (il garde son image)',f:x=>{G.F[x.f].moral=Math.min(100,G.F[x.f].moral+6);}}]},
 {id:'portes',p:.7,cond:()=>G.argent>2000,make:()=>({}),t:()=>'Journée portes ouvertes',d:()=>'Organiser une journée portes ouvertes avec démonstrations (coût 900 €) pourrait attirer de nouveaux adhérents.',
  ch:[{t:'Organiser (−900 €)',f:()=>{G.argent-=900;G.salle.membres+=ri(8,22);G.salle.rep+=1.5;}},{t:'Pas cette fois'}]},
 {id:'moral',p:.9,cond:()=>mes().some(f=>f.serie<0),make:()=>({f:pk(mes().filter(f=>f.serie<0)).id}),t:x=>'Coup de blues',d:x=>nomF(x.f)+' doute après sa défaite. Il passe ses soirées seul devant les vidéos de son combat.',
  ch:[{t:'Lui offrir une semaine de vacances',f:x=>{const f=G.F[x.f];f.moral=Math.min(100,f.moral+20);f.fat=Math.max(0,f.fat-25);}},{t:'Le pousser à retourner au sac',f:x=>{const f=G.F[x.f];f.moral-=5;f.at.frappe+=.6;}}]},
 {id:'talent',p:.5,cond:()=>mes().length<SALLES[G.salle.niv].cap,make:()=>{const d=pk(DIVS).id;const f=creer(0,d,{age:rf(18,21),lv:rf(38,43),pot:rf(74,90),vierge:true});f.libre=true;f.prime=0;G.F[f.id]=f;return {f:f.id};},
  t:()=>'Un gamin frappe à la porte',d:x=>{const f=G.F[x.f];return 'Un jeune de '+Math.floor(f.age)+' ans, '+f.pr+' '+f.nom+' ('+STYLES[f.style].nom+'), demande à s\'entraîner chez vous. Vos coachs le trouvent très doué.';},
  ch:[{t:'Le prendre sous votre aile',f:x=>{const f=G.F[x.f];f.mine=true;f.libre=false;f.v=0;f.d=0;offreContrat(f,'cfr','premier contrat pro');news('🌱',f.pr+' '+f.nom+' rejoint l\'écurie.','#2fbf71');}},{t:'Pas de place',f:x=>{delete G.F[x.f];}}]},
 {id:'degats',p:.4,cond:()=>true,make:()=>({m:ri(4,12)*100*(G.salle.niv+1)}),t:()=>'Dégât des eaux',d:x=>'Une fuite a abîmé une partie des tatamis. Réparation : '+fmtE(x.m)+'.',ch:[{t:'Payer',f:x=>{G.argent-=x.m;}}]},
 {id:'influ',p:.5,cond:()=>true,make:()=>({}),t:()=>'Un influenceur fitness',d:()=>'Un influenceur aux deux millions d\'abonnés veut filmer son entraînement dans votre salle.',
  ch:[{t:'Accepter',f:()=>{G.salle.membres+=ri(10,30);G.salle.rep+=2;}},{t:'Refuser, ici on bosse',f:()=>{mes().forEach(f=>f.moral+=3);}}]},
 {id:'presse',p:.8,cond:()=>mes().some(f=>f.prochain&&trouverCombat(f.prochain)?.c.ok),make:()=>{const f=pk(mes().filter(f=>f.prochain&&trouverCombat(f.prochain)?.c.ok));return {f:f.id,adv:(()=>{const c=trouverCombat(f.prochain).c;return c.a===f.id?c.b:c.a;})()};},
  t:()=>'Conférence de presse',d:x=>'À la conférence de presse, '+nomF(x.adv)+' provoque '+nomF(x.f)+' devant les caméras.',
  ch:[{t:'Répondre par une punchline',f:x=>{G.F[x.f].pop=Math.min(100,G.F[x.f].pop+5);}},{t:'Rester calme et respectueux',f:x=>{G.F[x.f].moral=Math.min(100,G.F[x.f].moral+6);G.salle.rep+=.5;}},{t:'Bousculer son adversaire (amende 500 €)',f:x=>{G.argent-=500;G.F[x.f].pop=Math.min(100,G.F[x.f].pop+10);}}]},
 {id:'pied',p:.55,cond:()=>mes().some(f=>f.org&&ORG(f.org).tier<4&&dispo(f,G.sem+2)&&f.forme>70),make:()=>{const f=pk(mes().filter(f=>f.org&&ORG(f.org).tier<4&&dispo(f,G.sem+2)&&f.forme>70));
   const U=ORGS[ORG(f.org).tier+1];const L=classement(U.id,f.div).filter(x=>!x.mine&&dispo(x,G.sem+2));if(!L.length)return null;const adv=L[Math.min(L.length-1,ri(Math.floor(L.length/2),L.length-1))];return {f:f.id,org:U.id,adv:adv.id};},
  t:x=>'Combat au pied levé !',d:x=>ORG(x.org).nom+' cherche un remplaçant dans deux semaines : '+nomF(x.f)+' contre '+nomF(x.adv)+' ('+ov(G.F[x.adv])+' de note). Une victoire lui ouvrirait les portes de l\'organisation.',
  ch:[{t:'Accepter le défi',f:x=>{combatPiedLeve(x);}},{t:'Trop risqué'}]},
 {id:'rachat',p:.3,cond:()=>mes().some(f=>ov(f)>60&&!f.prochain),make:()=>{const f=pk(mes().filter(f=>ov(f)>60&&!f.prochain));return {f:f.id,m:Math.round(ov(f)*ov(f)*ov(f)*(f.pop/50+.6)/40/500)*500};},
  t:()=>'Une écurie rivale tente un rachat',d:x=>'Une grande écurie veut racheter les droits de management de '+nomF(x.f)+' pour '+fmtE(x.m)+'.',
  ch:[{t:'Vendre',f:x=>{G.argent+=x.m;liberer(x.f);}},{t:'Il n\'est pas à vendre',f:x=>{G.F[x.f].moral=Math.min(100,G.F[x.f].moral+12);}}]},
 {id:'seminaire',p:.5,cond:()=>G.argent>3000,make:()=>({k:pk(['sol','lutte','frappe'])}),t:()=>'Stage avec un ancien champion',d:x=>'Un ancien champion du monde propose un stage de '+({sol:'jiu-jitsu',lutte:'lutte',frappe:'boxe'})[x.k]+' pour toute l\'équipe (1 800 €).',
  ch:[{t:'Réserver le stage',f:x=>{G.argent-=1800;mes().forEach(f=>{f.at[x.k]=Math.min(f.pot+8,f.at[x.k]+ri(1,2));});}},{t:'Non merci'}]},
 {id:'gala',p:.4,cond:()=>G.salle.rep>20,make:()=>({m:Math.round((1500+G.salle.rep*120)/100)*100}),t:()=>'Gala de charité',d:x=>'La mairie vous invite à un gala de charité. Vos combattants signent des autographes ; la soirée rapporte une subvention de '+fmtE(x.m)+'.',ch:[{t:'Super',f:x=>{G.argent+=x.m;G.salle.rep+=1;}}]},
 {id:'poids',p:.35,cond:()=>mes().some(f=>f.prochain&&trouverCombat(f.prochain)?.c.ok),make:()=>({f:pk(mes().filter(f=>f.prochain&&trouverCombat(f.prochain)?.c.ok)).id}),t:()=>'Coupe de poids difficile',d:x=>nomF(x.f)+' a du mal à faire le poids pour son prochain combat.',
  ch:[{t:'Engager un nutritionniste (700 €)',f:x=>{G.argent-=700;}},{t:'Il se débrouillera au sauna',f:x=>{const f=G.F[x.f];f.fat=Math.min(100,f.fat+22);f.forme=Math.max(30,100-f.fat*.6);}}]},
 {id:'viral',p:.6,cond:()=>mes().length>0,make:()=>({f:pk(mes()).id}),t:()=>'Vidéo virale !',d:x=>'Une vidéo de '+nomF(x.f)+' cassant des planches au tibia fait des millions de vues.',
  ch:[{t:'Surfer sur la vague',f:x=>{const f=G.F[x.f];f.pop=Math.min(100,f.pop+7);G.salle.membres+=ri(5,15);}}]},
 {id:'fete',p:.5,cond:()=>mes().some(f=>f.prochain),make:()=>({f:pk(mes().filter(f=>f.prochain)).id}),t:()=>'Une soirée de trop',d:x=>nomF(x.f)+' a été aperçu en boîte de nuit à trois heures du matin, à quelques semaines de son combat.',
  ch:[{t:'Le recadrer sévèrement',f:x=>{const f=G.F[x.f];f.moral=Math.max(0,f.moral-10);}},{t:'Il a le droit de souffler',f:x=>{const f=G.F[x.f];f.moral=Math.min(100,f.moral+8);f.fat=Math.min(100,f.fat+15);f.forme=Math.max(30,100-f.fat*.6);}}]},
 {id:'tv',p:.3,cond:()=>G.salle.rep>30,make:()=>({m:Math.round((3000+G.salle.rep*150)/100)*100}),t:()=>'Une chaîne de télé frappe à la porte',d:x=>'Une chaîne sportive veut diffuser vos entraînements chaque semaine. Elle propose '+fmtE(x.m)+'.',
  ch:[{t:'Signer',f:x=>{G.argent+=x.m;G.salle.rep+=2;}},{t:'Pas question, on garde nos secrets',f:()=>{mes().forEach(f=>f.moral=Math.min(100,f.moral+4));}}]},
 {id:'conflit',p:.4,cond:()=>mes().length>=3,make:()=>{const L=mes().slice().sort(()=>R()-.5);return {a:L[0].id,b:L[1].id};},t:()=>'Ça chauffe au vestiaire',d:x=>'Un sparring entre '+nomF(x.a)+' et '+nomF(x.b)+' a dégénéré. Ils ne se parlent plus.',
  ch:[{t:'Les réunir pour s\'expliquer',f:x=>{G.F[x.a].moral=Math.min(100,G.F[x.a].moral+5);G.F[x.b].moral=Math.min(100,G.F[x.b].moral+5);}},{t:'Les séparer aux entraînements',f:x=>{G.F[x.a].moral-=6;G.F[x.b].moral-=6;}}]},
 {id:'augment',p:.45,cond:()=>mes().some(f=>f.pop>35),make:()=>{const f=pk(mes().filter(f=>f.pop>35));return {f:f.id,m:Math.round((800+f.pop*60)/100)*100};},t:()=>'Il réclame plus',d:x=>nomF(x.f)+' estime qu\'il mérite une prime pour tout ce qu\'il apporte à l\'écurie : '+fmtE(x.m)+'.',
  ch:[{t:'Payer la prime',f:x=>{G.argent-=x.m;G.F[x.f].moral=Math.min(100,G.F[x.f].moral+15);}},{t:'Refuser',f:x=>{G.F[x.f].moral=Math.max(0,G.F[x.f].moral-15);}}]},
 {id:'mentor',p:.3,cond:()=>Object.values(G.coachs).some(n=>n<2),make:()=>{const k=pk(Object.keys(G.coachs).filter(k=>G.coachs[k]<2&&k!=='media'&&k!=='recruteur'));return k?{k}:null;},t:()=>'Un ancien champion veut transmettre',d:x=>'Un ancien champion du monde, jeune retraité, propose de rejoindre votre staff ('+COACHS[x.k].n.toLowerCase()+') pour un salaire symbolique.',
  ch:[{t:'L\'engager',f:x=>{G.coachs[x.k]=Math.max(G.coachs[x.k],2);G.argent-=1500;}},{t:'Décliner',f:()=>{}}]},
 {id:'journaliste',p:.5,cond:()=>mes().length>0,make:()=>({f:pk(mes()).id}),t:()=>'Interview exclusive',d:x=>'Un grand magazine sportif veut faire le portrait de '+nomF(x.f)+'.',
  ch:[{t:'Parler de l\'écurie',f:x=>{G.salle.rep+=2;G.salle.membres+=ri(3,10);}},{t:'Mettre le combattant en avant',f:x=>{G.F[x.f].pop=Math.min(100,G.F[x.f].pop+6);}}]},
 {id:'cage',p:.3,cond:()=>G.argent>8000,make:()=>({m:6000}),t:()=>'Une vraie cage pour la salle',d:()=>'Un fournisseur propose une cage octogonale d\'occasion, comme en compétition, pour 6 000 €.',
  ch:[{t:'L\'acheter',f:x=>{G.argent-=x.m;G.salle.rep+=3;mes().forEach(f=>f.at.lutte=Math.min(f.pot+8,f.at.lutte+.8));G.salle.membres+=ri(5,12);}},{t:'Trop cher',f:()=>{}}]},
 {id:'remplacant',p:.4,cond:()=>mes().some(f=>{const t=f.prochain&&trouverCombat(f.prochain);return t&&t.c.ok&&!t.c.titre&&t.c.gp==null&&t.e.sem-G.sem>=2;}),make:()=>{const f=pk(mes().filter(f=>{const t=f.prochain&&trouverCombat(f.prochain);return t&&t.c.ok&&!t.c.titre&&t.c.gp==null&&t.e.sem-G.sem>=2;}));const t=trouverCombat(f.prochain);
   const L=classement(t.e.org,f.div).filter(x=>!x.mine&&dispo(x,t.e.sem)&&x.id!==t.c.b);if(!L.length)return null;return {f:f.id,c:t.c.id,nv:L[L.length-1].id,old:t.c.b};},
  t:()=>'Changement d\'adversaire',d:x=>nomF(x.old)+' s\'est blessé et doit déclarer forfait. L\'organisation propose '+nomF(x.nv)+' ('+ov(G.F[x.nv])+' de note) en remplacement.',
  ch:[{t:'Accepter le remplaçant',f:x=>{const t=trouverCombat(x.c);if(!t)return;const o=G.F[x.old],n=G.F[x.nv];if(o.prochain===x.c)o.prochain=null;blesser(o);t.c.b=x.nv;n.prochain=x.c;t.c.seed=0;}},{t:'Annuler le combat',f:x=>{const t=trouverCombat(x.c);if(t){blesser(G.F[x.old]);annuler(t.c);}}}]},
 {id:'jeunes',p:.4,cond:()=>G.salle.niv>=1&&G.argent>3000,make:()=>({m:2500}),t:()=>'Section jeunes',d:()=>'Des parents demandent l\'ouverture d\'un cours de MMA éducatif pour les 12-16 ans le mercredi. Il faut équiper une salle (2 500 €).',
  ch:[{t:'Ouvrir le cours',f:x=>{G.argent-=x.m;G.salle.membres+=ri(15,30);G.salle.rep+=2;}},{t:'Pas pour l\'instant'}]},
 {id:'adv_parle',p:.5,cond:()=>mes().some(f=>f.prochain&&trouverCombat(f.prochain)?.c.ok),make:()=>{const f=pk(mes().filter(f=>f.prochain&&trouverCombat(f.prochain)?.c.ok));const c=trouverCombat(f.prochain).c;return {f:f.id,adv:c.a===f.id?c.b:c.a};},
  t:()=>'Il promet un KO',d:x=>nomF(x.adv)+' annonce sur les réseaux qu\'il mettra '+nomF(x.f)+' KO au premier round.',
  ch:[{t:'Utiliser ça comme motivation',f:x=>{G.F[x.f].moral=Math.min(100,G.F[x.f].moral+10);}},{t:'Répondre publiquement',f:x=>{G.F[x.f].pop=Math.min(100,G.F[x.f].pop+4);G.F[x.adv].pop=Math.min(100,G.F[x.adv].pop+3);}}]},
 {id:'sparring_star',p:.35,cond:()=>mes().length>0&&G.argent>2500,make:()=>{const f=pk(mes());return {f:f.id,m:2000};},t:()=>'Sparring avec une star',d:x=>'Un champion de GLADIUS de passage propose quelques sessions de sparring avec '+nomF(x.f)+' (2 000 €). Formateur… mais dangereux.',
  ch:[{t:'Accepter',f:x=>{const f=G.F[x.f];G.argent-=x.m;for(const k of ['frappe','lutte','sol'])f.at[k]=Math.min(f.pot+8,f.at[k]+.8);if(R()<.25)blesser(f);}},{t:'Refuser'}]},
 {id:'nutrition',p:.4,cond:()=>mes().some(f=>f.at.cardio<60),make:()=>({f:pk(mes().filter(f=>f.at.cardio<60)).id,m:1200}),t:()=>'Un nutritionniste du sport',d:x=>'Un nutritionniste propose un suivi de trois mois pour '+nomF(x.f)+', qui manque de souffle en fin de combat (1 200 €).',
  ch:[{t:'Engager',f:x=>{G.argent-=x.m;const f=G.F[x.f];f.at.cardio=Math.min(f.pot+8,f.at.cardio+2.5);}},{t:'Non merci'}]},
 {id:'fan',p:.4,cond:()=>mes().some(f=>f.pop>20),make:()=>({f:pk(mes().filter(f=>f.pop>20)).id}),t:()=>'Le fan numéro un',d:x=>'Un supporter a fait tatouer le visage de '+nomF(x.f)+' sur son mollet. La photo fait le tour des réseaux.',
  ch:[{t:'L\'inviter au prochain gala',f:x=>{G.F[x.f].pop=Math.min(100,G.F[x.f].pop+3);G.F[x.f].moral=Math.min(100,G.F[x.f].moral+5);}},{t:'Ignorer'}]},
 {id:'panne',p:.35,cond:()=>true,make:()=>({m:300+G.salle.niv*400}),t:()=>'Panne de chauffage',d:x=>'Le chauffage de la salle est tombé en panne en plein hiver. Réparation express : '+fmtE(x.m)+'.',
  ch:[{t:'Réparer',f:x=>{G.argent-=x.m;}},{t:'Attendre le printemps',f:()=>{G.salle.membres=Math.max(10,G.salle.membres-ri(5,12));mes().forEach(f=>f.moral-=3);}}]},
 {id:'doc',p:.25,cond:()=>mes().some(f=>f.pop>50),make:()=>({}),t:()=>'Un documentaire sur l\'écurie',d:()=>'Une plateforme de streaming veut tourner une série documentaire dans votre salle pendant six semaines.',ch:[{t:'Action !',f:()=>{G.argent+=4000;G.salle.rep+=4;mes().forEach(f=>f.pop=Math.min(100,f.pop+4));}},{t:'Trop de caméras',f:()=>{}}]}
];
function evenementAleatoire(){if(G.sem<3||R()>.3)return null;const ok=EVENTS.filter(e=>e.cond());if(!ok.length)return null;let s=0;ok.forEach(e=>s+=e.p);let x=R()*s;let E=ok[0];for(const e of ok){x-=e.p;if(x<=0){E=e;break;}}
 const d=E.make();if(d===null)return null;const p={id:E.id,x:d,t:E.t(d),d:E.d(d),ch:E.ch.map(c=>({t:c.t}))};G.popup=p;return p;}
function choisir(i,pp){const p=pp||G.popup;if(!p)return;const E=EVENTS.find(e=>e.id===p.id)||SPECIAUX[p.id];if(G.popup===p||!pp)G.popup=null;if(E&&E.ch[i]&&E.ch[i].f)E.ch[i].f(p.x);verifierSucces();}
function combatPiedLeve(x){const f=G.F[x.f],adv=G.F[x.adv],O=ORG(x.org);const ev=G.ev.find(e=>e.org===x.org&&!e.fait&&e.sem>=G.sem+1&&e.sem<=G.sem+3)||creerEvent(O,G.sem+2);
 const c={id:ev.id+'c'+ev.combats.length,a:f.id,b:adv.id,div:f.div,titre:false,mine:true,ok:true,res:null,pied:true,org2:x.org};ev.combats.push(c);f.prochain=c.id;adv.prochain=c.id;
 c.show=Math.round(O.show*.8/50)*50;c.win=c.show;news('⚡',f.pr+' '+f.nom+' remplace au pied levé à '+ev.nom+' contre '+adv.pr+' '+adv.nom+' !',O.c1);}
/* après un combat au pied levé gagné, l'organisation propose un contrat */
function apresPied(cid){const t=trouverCombat(cid);if(!t||!t.c.pied)return;const f=G.F[t.c.a];if(t.c.res&&t.c.res.w===0)offreContrat(f,t.e.org,'victoire au pied levé');}
function jouerMonCombat(cid,sim){appliquer(cid,sim);apresPied(cid);G.aJouer=G.aJouer.filter(x=>x!==cid);const t=trouverCombat(cid);if(t&&!G.aJouer.some(id=>id.startsWith(t.e.id+'c')))t.e.fait=true;}
function prochainEvent(){let best=null;for(const e of G.ev)if(!e.fait&&e.combats.some(c=>c.mine&&c.ok)&&(!best||e.sem<best.sem))best=e;return best;}
/* ---------- contrats de management, reconversion, objectifs ---------- */
function pctF(f){return f&&f.mg?f.mg.pct:COMM;}
function demandePct(f){return cl(.25-(f.pop-30)/420+(G.salle.rep-30)/700+(f.moral-60)/900,.12,.3);}
function mkP(id,x){const E=SPECIAUX[id];return {id,x,t:E.t(x),d:E.d(x),ch:E.ch.map((c,i)=>({t:typeof c.t==='function'?c.t(x):c.t}))};}
const SPECIAUX={
 bilan:{t:x=>'Bilan de la saison '+x.an,d:x=>'Bilan des combats : '+x.v+' victoires ('+x.f+' avant la limite), '+x.d+' défaites. '+(x.t?x.t+' ceinture(s) remportée(s) ! ':'')+'Commissions : '+fmtE(x.b)+'. Trésorerie : '+(x.da>=0?'+':'')+fmtE(x.da)+' sur l\'année. Objectifs atteints : '+x.ob+'/3.'+(x.best?' Votre meilleur combattant : '+nomF(x.best)+' ('+ov(G.F[x.best])+').':''),ch:[{t:'En route pour la nouvelle saison !'}]},
 operation:{t:x=>'Blessure grave : '+nomF(x.f),d:x=>{const f=G.F[x.f];return 'Diagnostic : '+(f.blessT||'blessure').toLowerCase()+'. Indisponible '+f.bless+' semaines. Le chirurgien propose d\'opérer tout de suite ('+fmtE(x.m)+') pour raccourcir l\'absence d\'environ 40 %.';},
  ch:[{t:x=>'Opérer ('+fmtE(x.m)+')',f:x=>{const f=G.F[x.f];G.argent-=x.m;f.bless=Math.max(1,Math.round(f.bless*.6));}},{t:'Rééducation classique',f:x=>{const f=G.F[x.f];f.at.cardio=Math.max(20,f.at.cardio-1.5);f.at.puiss=Math.max(20,f.at.puiss-1);}}]},
 mgmt:{t:x=>'Contrat de management : '+nomF(x.f),d:x=>{const f=G.F[x.f];return 'Le contrat qui vous lie à '+nomF(x.f)+' arrive à son terme. Sa popularité ('+Math.round(f.pop)+') et votre réputation pèsent dans la discussion : il demande une commission de '+Math.round(x.dem*100)+' % (actuellement '+Math.round(f.mg.pct*100)+' %).';},
  ch:[{t:x=>'Accepter '+Math.round(x.dem*100)+' % pour deux ans',f:x=>{const f=G.F[x.f];f.mg={pct:x.dem,fin:G.sem+104};news('🖊️',nomF(x.f)+' prolonge avec l\'écurie ('+Math.round(x.dem*100)+' %).','#2fbf71');}},
   {t:x=>'Insister pour '+Math.round(Math.min(.3,x.dem+.05)*100)+' % ('+Math.round(x.p*100)+' % de chances)',f:x=>{const f=G.F[x.f];if(R()<x.p){f.mg={pct:Math.min(.3,x.dem+.05),fin:G.sem+104};news('🖊️',nomF(x.f)+' accepte vos conditions.','#2fbf71');}else{f.moral=cl(f.moral-15,0,100);if(R()<.5){news('💔',nomF(x.f)+' claque la porte et quitte l\'écurie !','#e8344a');liberer(x.f);}else{f.mg={pct:x.dem,fin:G.sem+52};news('😤',nomF(x.f)+' reste un an, mais à ses conditions.');}}}},
   {t:'Le laisser partir',f:x=>{liberer(x.f);}}]},
 veteran:{t:x=>'L\'heure de raccrocher ?',d:x=>{const f=G.F[x.f];return nomF(x.f)+' ('+Math.floor(f.age)+' ans, '+f.v+'-'+f.d+') se pose des questions. Il pourrait raccrocher les gants et rejoindre votre staff comme '+COACHS[x.k].n.toLowerCase()+'.';},
  ch:[{t:'Raccrocher et devenir entraîneur',f:x=>{const f=G.F[x.f];f.ret=true;f.mine=false;G.coachs[x.k]=Math.min(3,G.coachs[x.k]+1);G.offres=G.offres.filter(o=>o.f!==f.id);temple(f);news('🎓',nomF(x.f)+' prend sa retraite et devient '+COACHS[x.k].n.toLowerCase()+' de l\'écurie !','#e9c46a');}},
   {t:'Encore une saison !',f:x=>{const f=G.F[x.f];f.moral=cl(f.moral+10,0,100);f.veteranVu=G.sem;}}]}};
function speciaux(f){if(f.opChoix){f.opChoix=0;return mkP('operation',{f:f.id,m:Math.round((5000+(f.org?ORG(f.org).tier:0)*3000)/100)*100});}
 if(f.prochain&&trouverCombat(f.prochain)?.e.sem===G.sem)return null;
 if(!f.mg)f.mg={pct:COMM,fin:G.sem+ri(40,104)};
 if(f.mg.fin-G.sem===4){const dem=demandePct(f);const p=cl(.65-(f.pop-30)/150+(f.moral-60)/150+(G.salle.rep-30)/200,.1,.9);return mkP('mgmt',{f:f.id,dem:Math.round(dem*100)/100,p});}
 if(f.mg.fin<G.sem-1){f.mg.fin=G.sem+52;}
 if(f.age>34.5&&(f.serie<=-2||ov(f)<f.pot-8)&&(!f.veteranVu||G.sem-f.veteranVu>40)&&!f.prochain){f.veteranVu=G.sem;const k={striker:'boxe',cogneur:'boxe',muay:'boxe',lutteur:'lutte',sambo:'lutte',grappler:'jjb',complet:'physique'}[f.style]||'boxe';if(G.coachs[k]>=3)return null;return mkP('veteran',{f:f.id,k});}
 return null;}
const OBJ=[
 {id:'v',n:c=>'Remporter '+c+' combats',c:()=>Math.max(3,Math.round(mes().length*1.4)),p:o=>G.stats.v-o.v0,r:c=>3000+c*900},
 {id:'fin',n:c=>'Gagner '+c+' combats avant la limite',c:()=>Math.max(2,Math.round(mes().length*.7)),p:o=>(G.stats.ko||0)+(G.stats.sub||0)-o.f0,r:c=>3000+c*1200},
 {id:'tier',n:c=>'Placer un combattant en '+ORGS[c].court,c:()=>Math.min(4,Math.max(...mes().map(f=>f.org?ORG(f.org).tier:0),0)+1),p:o=>mes().some(f=>f.org&&ORG(f.org).tier>=o.c)?1:0,cible1:1,r:c=>6000+c*6000},
 {id:'titre',n:()=>'Remporter une ceinture',c:()=>1,p:o=>G.stats.titres-o.t0,r:()=>12000},
 {id:'mb',n:c=>'Atteindre '+c+' adhérents',c:()=>Math.round(G.salle.membres*1.25/10)*10+10,p:o=>G.salle.membres,abs:1,r:c=>2500+c*12},
 {id:'rec',n:()=>'Recruter un nouveau combattant',c:()=>1,p:o=>mes().filter(f=>!o.ids.includes(f.id)).length,r:()=>3000}];
function nouveauxObjectifs(){const an=G.an0+Math.floor((G.sem-1)/52);const L=OBJ.slice().sort(()=>R()-.5).slice(0,3);
 G.obj={an,L:L.map(o=>{const c=o.c();return {id:o.id,c,n:o.n(c),r:Math.round(o.r(c)/100)*100,v0:G.stats.v,f0:(G.stats.ko||0)+(G.stats.sub||0),t0:G.stats.titres,ids:mes().map(f=>f.id),prog:0,ok:false};})};
 news('🎯','Objectifs de la saison '+an+' : '+G.obj.L.map(o=>o.n.toLowerCase()).join(', ')+'.','#e9c46a');}
function majObjectifs(){if(!G.obj)return;for(const o of G.obj.L){const D=OBJ.find(x=>x.id===o.id);if(!D)continue;o.prog=D.p(o);const cible=D.cible1?1:o.c;if(!o.ok&&o.prog>=cible){o.ok=true;G.argent+=o.r;news('🎯','Objectif atteint : '+o.n+' ! Prime de '+fmtE(o.r)+'.','#2fbf71');}}}
function bilanObjectifs(out){if(!G.obj)return;const n=G.obj.L.filter(o=>o.ok).length;G.objHist=G.objHist||[];G.objHist.push({an:G.obj.an,n});if(n===3){G.salle.rep=cl(G.salle.rep+5,0,100);news('🌟','Saison parfaite : les trois objectifs atteints ! La réputation de l\'écurie grimpe.','#e9c46a');}}
/* ---------- gala maison ---------- */
function galaPossible(){if(G.salle.niv<1)return {ok:false,r:'Il faut au moins une salle de quartier.'};if(G.galaSem&&G.sem-G.galaSem<10)return {ok:false,r:'Prochain gala possible dans '+(10-(G.sem-G.galaSem))+' semaine(s).'};
 const L=mes().filter(f=>dispo(f,G.sem+4)&&f.org&&ORG(f.org).tier<=1);if(!L.length)return {ok:false,r:'Aucun combattant disponible (CFR ou HEX, sans combat prévu).'};const cout=2500+Math.min(3,L.length)*1200;if(G.argent<cout)return {ok:false,r:'Il faut '+fmtE(cout)+'.'};return {ok:true,L:L.slice(0,3),cout};}
function organiserGala(){const P=galaPossible();if(!P.ok)return false;G.argent-=P.cout;G.galaSem=G.sem;G.ngala=(G.ngala||0)+1;
 const ev={id:'e'+(G.nev++),org:'cfr',sem:G.sem+4,nom:'Gala '+G.nom+(G.ngala>1?' '+G.ngala:''),ville:'Votre salle',combats:[],fait:false,maison:true};
 for(const f of P.L){const T=ORG(f.org).tier;const L=classement(ORGS[T].id,f.div).filter(x=>!x.mine&&dispo(x,ev.sem)).sort((a,b)=>Math.abs(a.elo-f.elo)-Math.abs(b.elo-f.elo));if(!L.length)continue;const adv=L[ri(0,Math.min(2,L.length-1))];
  const c={id:ev.id+'c'+ev.combats.length,a:f.id,b:adv.id,div:f.div,titre:false,mine:true,ok:true,res:null,show:0,win:0};ev.combats.push(c);f.prochain=c.id;adv.prochain=c.id;}
 if(!ev.combats.length){G.argent+=P.cout;return false;}ev.combats[ev.combats.length-1].main=true;G.ev.push(ev);
 news('🎪','Vous organisez le '+ev.nom+' ('+date(ev.sem)+') : '+ev.combats.map(c=>nomF(c.a)+' contre '+nomF(c.b)).join(', ')+'.','#e9c46a');return ev;}
function recetteGala(e){let pop=0;for(const c of e.combats)if(G.F[c.a])pop+=G.F[c.a].pop;const r=Math.round((1500+G.salle.rep*60+pop*35)*(1+G.salle.niv*.35)/50)*50;G.argent+=r;G.salle.rep=cl(G.salle.rep+3,0,100);G.salle.membres+=ri(6,18);
 news('🎟️','Billetterie du '+e.nom+' : '+fmtE(r)+'. La salle était pleine !','#2fbf71');}
/* ---------- camp d'entraînement ---------- */
const CAMP={etude:{n:'Étude vidéo de l\'adversaire',ic:'🎬',b:1.2,c:t=>300+t*500,d:'Le staff décortique ses derniers combats.'},
 spar:{n:'Partenaires d\'entraînement spécialisés',ic:'🥊',b:1.3,c:t=>500+t*900,d:'Des sparrings qui imitent son style.'},
 stage:{n:'Stage à l\'étranger',ic:'✈️',b:2,c:t=>1500+t*2600,d:'Trois semaines dans une grande académie. Moral en hausse.'}};
function bonusCamp(c){let b=0;for(const k in (c.camp||{}))if(c.camp[k]&&CAMP[k])b+=CAMP[k].b;return b;}
function acheterCamp(cid,k){const t=trouverCombat(cid);if(!t)return false;const {c,e}=t;c.camp=c.camp||{};if(c.camp[k])return false;const prix=CAMP[k].c(ORG(e.org).tier);if(G.argent<prix)return false;
 G.argent-=prix;c.camp[k]=1;if(k==='stage'){const f=G.F[c.a];f.moral=cl(f.moral+10,0,100);}return true;}
/* ---------- changement de catégorie ---------- */
function categorieVoisine(f,dir){const L=DIVS.filter(d=>d.s===DIV(f.div).s);const i=L.findIndex(d=>d.id===f.div);return L[i+dir]||null;}
function changerCategorie(id,dir){const f=G.F[id];const d=categorieVoisine(f,dir);if(!d||f.prochain)return false;
 const go=f.org&&G.orgs[f.org];if(go&&go.ch[f.div]===f.id){go.ch[f.div]=null;news('👑',f.pr+' '+f.nom+' laisse sa ceinture vacante pour changer de catégorie.');}
 G.offres=G.offres.filter(o=>!(o.f===f.id&&o.type==='combat'));
 if(dir>0){f.at.puiss=Math.max(20,f.at.puiss-2);f.at.frappe+=0;f.at.cardio+=1.5;}else{f.at.cardio=Math.max(20,f.at.cardio-3);f.at.puiss+=1.5;f.fat=cl(f.fat+15,0,100);}
 f.div=d.id;if(f.org)f.elo=eloEntree(f.org,d.id);f.serie=0;f.riv={};news('⚖️',f.pr+' '+f.nom+' passe en '+d.nom.toLowerCase()+' ('+d.kg+' kg).','#e9c46a');return true;}
/* ---------- négociation ---------- */
function negocier(oid,pct){const o=G.offres.find(x=>x.id===oid);if(!o||o.nego)return null;const f=G.F[o.f];o.nego=1;
 const r=o.type==='combat'?rang(f):3;let p=.82-pct*1.7+(f.pop-30)/140+(r!=null&&r<=3?.12:0)+((G.orgs[o.org||G.ev.find(e=>e.id===o.ev)?.org]?.rel??60)-60)/150+(G.coachs.media||0)*.04;
 if(o.titre)p+=.1;p=cl(p,.05,.95);
 if(R()<p){if(o.type==='combat'){o.show=Math.round(o.show*(1+pct)/50)*50;o.win=Math.round(o.win*(1+pct)/50)*50;}else{o.show=Math.round(o.show*(1+pct)/50)*50;if(o.prime)o.prime=Math.round(o.prime*(1+pct)/50)*50;}return {ok:true,p};}
 if(R()<.35+pct){refuser(oid);return {ok:false,retire:true,p};}return {ok:false,p};}
function chanceNego(oid,pct){const o=G.offres.find(x=>x.id===oid);if(!o)return 0;const f=G.F[o.f];const r=o.type==='combat'?rang(f):3;
 return cl(.82-pct*1.7+(f.pop-30)/140+(r!=null&&r<=3?.12:0)+((G.orgs[o.org||G.ev.find(e=>e.id===o.ev)?.org]?.rel??60)-60)/150+(G.coachs.media||0)*.04+(o.titre?.1:0),.05,.95);}
/* ---------- sponsors ---------- */
const MARQUES=['Iron Fuel','Volta Energy','Karbon Gear','Rhino Wraps','Nordik Tape','Atlas Nutrition','Pulse Wear','Titan Drinks','Kodiak Gloves','Blackline','Méduse Paris','Fenrir Apparel','Lumen Watches','Saber Mouthguards'];
function offreSponsor(f){const t=f.org?ORG(f.org).tier:0;const heb=Math.round((40+f.pop*f.pop*.18+t*t*90)*(1+(G.coachs.media||0)*.15)/10)*10;return {nom:pk(MARQUES),f:f.id,hebdo:heb,bonusV:Math.round(heb*4/50)*50,duree:ri(16,40)};}
function signerSponsor(x){G.spons=G.spons||[];G.spons.push({id:'sp'+(G.nspo=(G.nspo||1)+1),nom:x.nom,f:x.f,hebdo:x.hebdo,bonusV:x.bonusV,fin:G.sem+x.duree});news('🤝',x.nom+' sponsorise '+nomF(x.f)+' : '+fmtE(x.hebdo)+' par semaine pendant '+x.duree+' semaines (+'+fmtE(x.bonusV)+' par victoire).','#e9c46a');}
/* ---------- Grand Prix ---------- */
function demarrerGP(){if(G.gp)return;const an=G.an0+Math.floor((G.sem-1)/52);const O=ORGS[[2,3][an%2]];
 const cand=DIVS.filter(d=>roster(O.id,d.id).length>=10);let d=cand.find(d=>mes().some(f=>f.org===O.id&&f.div===d.id&&rang(f)<=8&&rang(f)>0))||pk(cand);if(!d)return;
 const L=classement(O.id,d.id).filter(f=>G.orgs[O.id].ch[d.id]!==f.id&&f.bless<=0&&!f.ret).slice(0,8);if(L.length<8)return;
 const ids=[L[0],L[7],L[3],L[4],L[1],L[6],L[2],L[5]].map(f=>f.id);ids.forEach(id=>{G.F[id].inGP=true;});
 // annuler les offres et combats déjà prévus des participants
 for(const id of ids){const f=G.F[id];if(f.prochain){const t=trouverCombat(f.prochain);if(t&&!t.c.res){annuler(t.c);G.offres=G.offres.filter(o=>o.c!==t.c.id);}}}
 const prix=[0,0,60000,150000][O.tier];
 G.gp={org:O.id,div:d.id,an,ronde:0,ids,vivants:ids.slice(),prochain:G.sem+3,prix,nom:'Grand Prix '+O.court+' '+an};
 news('🏆','Le '+G.gp.nom+' des '+d.nom.toLowerCase()+' est lancé : huit combattants, trois tours, '+fmtE(prix)+' pour le vainqueur !',O.c1);
 const m=ids.filter(id=>G.F[id].mine);if(m.length)news('🔥',m.map(nomF).join(' et ')+' participe'+(m.length>1?'nt':'')+' au '+G.gp.nom+' !','#e9c46a');}
function reserverGP(O,ev,s,usage){const gp=G.gp;if(!gp||gp.org!==O.id||gp.reserve||s<gp.prochain)return;
 gp.vivants=gp.vivants.filter(id=>G.F[id]&&!G.F[id].ret);const V=gp.vivants;if(V.length<2){gpVerifier();return;}const paires=[];for(let i=0;i+1<V.length;i+=2)paires.push([V[i],V[i+1]]);
 if(V.length%2)paires.length=paires.length;// le dernier passe directement
 gp.reserve=true;gp.ev=ev.id;let n=0;
 for(const [a,b] of paires){const A=G.F[a],B=G.F[b];
  if(A.bless>0||B.bless>0||A.prochain||B.prochain){const L=(A.bless>0||A.prochain)?A:B;gp.vivants=gp.vivants.filter(id=>id!==L.id);gp.elim=gp.elim||{};gp.elim[L.id]=gp.ronde;L.inGP=false;news('🚑',L.pr+' '+L.nom+' déclare forfait au '+gp.nom+'.');continue;}
  n++;let x=A,y=B;if(B.mine&&!A.mine){x=B;y=A;}
  const c={id:ev.id+'c'+ev.combats.length,a:x.id,b:y.id,div:gp.div,titre:false,mine:!!x.mine,ok:true,res:null,gp:gp.ronde,main:gp.ronde===2};
  if(x.mine){c.show=Math.round(bourse(x,O.id,false,gp.ronde===2)*1.4/50)*50;c.win=c.show;}
  ev.combats.push(c);x.prochain=c.id;y.prochain=c.id;usage.add(a);usage.add(b);
  if(x.mine)news('📅',gp.nom+' — '+['quart de finale','demi-finale','finale'][Math.min(2,gp.ronde)]+' : '+nomF(x.id)+' contre '+nomF(y.id)+' à '+ev.nom+' ('+date(ev.sem)+').',O.c1);}
 if(!n){gp.reserve=false;gpAvance();}}
function gpAvance(){const gp=G.gp;if(!gp)return;if(gp.vivants.length<=1){gpFin();return;}gp.ronde++;gp.reserve=false;gp.prochain=G.sem+4;}
function gpResultat(c,e,res){const gp=G.gp;if(!gp)return;const W=res.w===1?c.b:c.a;const L=W===c.a?c.b:c.a;// nul : avantage au premier nommé
 gp.vivants=gp.vivants.filter(id=>id!==L);gp.elim=gp.elim||{};gp.elim[L]=gp.ronde;if(G.F[L])G.F[L].inGP=false;
 const tours=e.combats.filter(x=>x.gp===gp.ronde);if(tours.every(x=>x.res))gpAvance();}
function gpFin(){const gp=G.gp;if(!gp)return;const v=G.F[gp.vivants[0]];G.gp=null;if(!v)return;v.inGP=false;v.pop=cl(v.pop+15,0,100);v.titres=v.titres||[];v.titres.push('GP '+ORG(gp.org).court);
 G.gps=G.gps||[];G.gps.push({nom:gp.nom,div:gp.div,v:v.id,vn:v.pr+' '+v.nom,org:gp.org,an:gp.an});
 news('🏆',v.pr+' '+v.nom+' remporte le '+gp.nom+' !',ORG(gp.org).c1);
 if(v.mine){G.argent+=Math.round(gp.prix*COMM);G.stats.gp=(G.stats.gp||0)+1;G.salle.rep=cl(G.salle.rep+8,0,100);G.trophees.push({s:G.sem,f:v.id,org:gp.org,div:gp.div,gp:1});news('💰','Prime du Grand Prix : votre commission de '+fmtE(gp.prix*COMM)+' !','#e9c46a');
  const U=ORGS[ORG(gp.org).tier+1];if(U)offreContrat(v,U.id,'vainqueur du Grand Prix');}}
function gpTableau(){return G.gp;}
// sécurité : un participant blessé est remplacé par forfait
function gpVerifier(){const gp=G.gp;if(!gp||gp.reserve)return;gp.vivants=gp.vivants.filter(id=>G.F[id]&&!G.F[id].ret);if(gp.vivants.length<=1)gpFin();
 if(G.gp&&G.sem-gp.prochain>12){gp.vivants.forEach(id=>{if(G.F[id])G.F[id].inGP=false;});G.gp=null;news('⚠️','Le '+gp.nom+' est annulé.');}}
/* ---------- classement toutes catégories, prix annuels, temple ---------- */
function p4p(n=15){const L=[];for(const id in G.F){const f=G.F[id];if(f.ret||!f.org)continue;const O=ORG(f.org);const ch=G.orgs[f.org].ch[f.div]===f.id;
 L.push({f,s:f.elo+O.tier*140+(ch?70:0)+Math.max(0,f.serie)*8});}return L.sort((a,b)=>b.s-a.s).slice(0,n).map(x=>x.f);}
function prixAnnuels(){const an=G.an0+Math.floor((G.sem-1)/52);const s0=G.sem-51;let best=null,bs=-1,ko=null,kos=-1,rev=null,rs=-1;
 for(const id in G.F){const f=G.F[id];if(!f.histo)continue;let sc=0,vic=0;for(const h of f.histo){if(h.s<s0)break;if(h.r==='V'){vic++;sc+=1+(h.tier||0)*1.2+(h.titre?3:0)+(h.gp!=null?1.5:0)+(['ko','tko','sub'].includes(h.m)?.5:0);
   if((h.m==='ko'||h.m==='tko')){const k=(h.tier||0)*10+(h.titre?8:0)+(h.main?4:0)+(h.rd===1?3:0)+R();if(k>kos){kos=k;ko={f:f.id,n:f.pr+' '+f.nom,adv:h.an,ev:h.ev,rd:h.rd,t:h.t,tech:h.tech};}}}else if(h.r==='D')sc-=.7;}
  if(sc>bs){bs=sc;best=f;}if(f.age<25&&vic>0&&sc>rs){rs=sc;rev=f;}}
 const P={an,cdla:best&&{f:best.id,n:best.pr+' '+best.nom},ko,rev:rev&&{f:rev.id,n:rev.pr+' '+rev.nom}};G.prix=G.prix||[];G.prix.push(P);
 const lots=[['cdla','Combattant de l\'année',15000],['ko','KO de l\'année',6000],['rev','Révélation de l\'année',5000]];
 for(const [k,lib,m] of lots){const x=P[k];if(!x)continue;const f=G.F[x.f];if(f){f.pop=cl(f.pop+(k==='cdla'?10:5),0,100);f.trophees=f.trophees||[];f.trophees.push(lib+' '+an);}
  news('🏅',lib+' '+an+' : '+x.n+(k==='ko'?' contre '+x.adv+' ('+x.ev+')':'')+'.','#e9c46a');if(f&&f.mine){G.argent+=m;G.salle.rep=cl(G.salle.rep+4,0,100);news('💰','Votre écurie touche '+fmtE(m)+' de primes pour ce trophée.','#e9c46a');}}
 return P;}
function temple(f){const t=(f.titres||[]).filter(x=>!x.startsWith('GP'));const top=t.filter(x=>x==='APEX'||x==='GLADIUS').length;
 if(top>=1||(f.v>=30&&f.v>f.d*2.4)||t.length>=4||f.mine&&(f.titres||[]).length){G.hof=G.hof||[];G.hof.unshift({n:f.pr+' '+f.nom,pays:f.pays,rec:f.v+'-'+f.d+(f.n?'-'+f.n:''),titres:f.titres||[],an:G.an0+Math.floor((G.sem-1)/52),mine:!!f.mine,div:f.div});
  if(G.hof.length>60)G.hof.length=60;news('🏛️',f.pr+' '+f.nom+' entre au temple de la renommée.','#e9c46a');}}
/* ---------- succès ---------- */
const SUCCES=[
 {id:'v1',n:'Première victoire',d:'Gagner un premier combat.',t:()=>G.stats.v>=1},
 {id:'ko1',n:'Lumières éteintes',d:'Gagner par KO ou TKO.',t:()=>(G.stats.ko||0)>=1},
 {id:'sub1',n:'Il a tapé !',d:'Gagner par soumission.',t:()=>(G.stats.sub||0)>=1},
 {id:'v10',n:'Machine à gagner',d:'10 victoires pour l\'écurie.',t:()=>G.stats.v>=10},
 {id:'v50',n:'Écurie redoutée',d:'50 victoires pour l\'écurie.',t:()=>G.stats.v>=50},
 {id:'ceint',n:'Ceinturé',d:'Remporter une ceinture.',t:()=>G.stats.titres>=1},
 {id:'hex',n:'Le meilleur de France',d:'Avoir un combattant sous contrat HEX.',t:()=>mes().some(f=>f.org&&ORG(f.org).tier>=1)},
 {id:'ecc',n:'Conquête de l\'Europe',d:'Avoir un combattant sous contrat ECC.',t:()=>mes().some(f=>f.org&&ORG(f.org).tier>=2)},
 {id:'gla',n:'Gladiateur',d:'Avoir un combattant sous contrat GLADIUS.',t:()=>mes().some(f=>f.org&&ORG(f.org).tier>=3)},
 {id:'apx',n:'Le sommet',d:'Avoir un combattant sous contrat APEX.',t:()=>mes().some(f=>f.org&&ORG(f.org).tier>=4)},
 {id:'chapx',n:'Roi du monde',d:'Avoir un champion APEX.',t:()=>mes().some(f=>f.org==='apx'&&G.orgs.apx.ch[f.div]===f.id)},
 {id:'double',n:'Double champion',d:'Avoir deux champions en même temps.',t:()=>mes().filter(f=>f.org&&G.orgs[f.org].ch[f.div]===f.id).length>=2},
 {id:'gp',n:'Vainqueur de Grand Prix',d:'Remporter un Grand Prix.',t:()=>(G.stats.gp||0)>=1},
 {id:'p4p',n:'Livre pour livre',d:'Placer un combattant dans le top 15 toutes catégories.',t:()=>p4p().some(f=>f.mine)},
 {id:'salle',n:'Académie d\'élite',d:'Agrandir la salle au niveau maximal.',t:()=>G.salle.niv>=4},
 {id:'riche',n:'Millionnaire',d:'Atteindre 1 000 000 € de trésorerie.',t:()=>G.argent>=1e6},
 {id:'equipe',n:'Grande famille',d:'Avoir 8 combattants dans l\'écurie.',t:()=>mes().length>=8},
 {id:'serie',n:'Invaincu',d:'Une série de 8 victoires pour un de vos combattants.',t:()=>mes().some(f=>f.serie>=8)},
 {id:'prix',n:'Récompensé',d:'Gagner un prix de fin d\'année.',t:()=>(G.prix||[]).some(P=>['cdla','ko','rev'].some(k=>P[k]&&G.F[P[k].f]&&G.F[P[k].f].mine))},
 {id:'hof',n:'Immortel',d:'Faire entrer un de vos combattants au temple de la renommée.',t:()=>(G.hof||[]).some(h=>h.mine)}];
function verifierSucces(){G.succes=G.succes||{};for(const x of SUCCES)if((x.id!=='p4p'||G.sem%4===0)&&!G.succes[x.id]&&x.t()){G.succes[x.id]=G.sem;news('🎖️','Succès débloqué : '+x.n+' — '+x.d,'#e9c46a');G.nouveauSucces=(G.nouveauSucces||[]);G.nouveauSucces.push(x.n);}}
function charger(g){G=g;setRng();return G;}
return {get G(){return G;},nouvellePartie,charger,avancer,classement,rang,rangTxt,mes,ov,date,fmtE,ORG,DIV,SALLES,COACHS,COACH_PAYE,FOCUS,INTENS,COMM,ALLOC,
 EVENTS,SPECIAUX,galaPossible,organiserGala,OBJ,pctF,demandePct,accepterCombat,accepterContrat,refuser,CAMP,bonusCamp,acheterCamp,categorieVoisine,changerCategorie,negocier,chanceNego,p4p,SUCCES,verifierSucces,prixAnnuels,gpTableau,offreSponsor,signerSponsor,MARQUES,preparerSim,jouerMonCombat,trouverCombat,signer,liberer,ameliorerSalle,coach,choisir,bourse,prochainEvent,rounds,medianeOv,nomF,planIA,roster,dispo};
})();
if(typeof module!=='undefined')module.exports=Moteur;
