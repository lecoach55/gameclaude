// usage: node harness.js game.js N policy
const fs=require('fs');const [,,GAME,N0,POL]=process.argv;const N=+N0||1000;
let ALL=[];
function el(tag){let _ih='';const e={tag,children:[],parent:null,removed:false,_q:{},className:'',textContent:'',get innerHTML(){return _ih},set innerHTML(v){_ih=v;if(typeof v=='string'&&/undefined|NaN|null|\[object/.test(v)){global.BAD=(global.BAD||{});const k=v.replace(/<[^>]+>/g,'').slice(0,90);global.BAD[k]=(global.BAD[k]||0)+1}this.children.forEach(c=>c.removed=true);this.children=[]},onclick:null,style:{},dataset:{},
 classList:{toggle(){},add(){},remove(){}},setAttribute(){},addEventListener(){},
 appendChild(c){c.parent=this;this.children.push(c);return c},insertBefore(c){return this.appendChild(c)},remove(){this.removed=true},
 querySelector(s){return this._q[s]||(this._q[s]=el('q'))},querySelectorAll(){return[]},scrollIntoView(){},getBoundingClientRect(){return{top:0}}};if(tag=='button')ALL.push(e);return e}
const ids={};
global.document={getElementById:id=>{if(id=='app'&&!ids.app){const a=el('div');Object.defineProperty(a,'innerHTML',{set(v){ALL.forEach(b=>b.removed=true);delete ids.go;delete ids.hd;delete ids.log;delete ids.sp},get(){return''}});ids.app=a}return ids[id]||(ids[id]=el('div'))},createElement:t=>el(t),body:el('body'),documentElement:{style:{setProperty(){}}}};
global.window={scrollTo(){},matchMedia:()=>({matches:false})};global.localStorage={getItem:()=>null,setItem(){}};
global.requestAnimationFrame=f=>0;global.addEventListener=()=>{};
// Vies appariées : SEED=n (graine par vie), FORCE="evenement=libellé" (choix imposé), SCORES=f.json (score, âge, événement vu)
let _st0=0;const _rs=x=>{_st0=x>>>0};if(process.env.SEED){Math.random=function(){_st0=(_st0+0x6D2B79F5)>>>0;let t=_st0;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
const FORCE=process.env.FORCE?process.env.FORCE.split('='):null;
let ivf=null;global.setTimeout=(f)=>{f()};global.setInterval=(f)=>{ivf=f;return 1};global.clearInterval=()=>{ivf=null};
const live=b=>{let x=b;while(x){if(x.removed)return false;x=x.parent}return !!b.onclick};
eval(fs.readFileSync(GAME,'utf8')+`
const M={ev:{},evLives:{},choice:{},turns:[],empty:0,turnsTot:0,sat:{h0:0,b0:0,m0:0,m100:0,b100:0,e100:0,l0:0,l100:0},cause:{},focus:{},score:[],age:[],byT:{1:[],2:[],3:[],4:[]},scoreT:{1:[],2:[],3:[],4:[]},clicks:[],ach:{},evPerLife:[],repeatText:0,oldQuiet:0,oldTurns:0,debt:0,kids:[],partner:0,stuckJob:0,maxLvl:[0,0,0,0]};
let curEv=null,life=null;
const wrap=arr=>arr.forEach(e=>{const r=e.run;e.run=()=>{curEv=e.id;M.ev[e.id]=(M.ev[e.id]||0)+1;life.evs.add(e.id);return r()}});
wrap(EV);wrap(MACRO);
const _st=structural;structural=function(){const r=_st();if(r){curEv="S@"+S.age+(r.t||"").slice(0,18)}return r};
const _pe=pickEvent;pickEvent=function(){const r=_pe();if(!r){M.empty++;if(S.age>=70)M.oldQuiet++}return r};
const _turn=turn;turn=function(){M.turnsTot++;life.turns++;if(S.age>=70)M.oldTurns++;return _turn()};
const _ch=choose;choose=function(list,q){const ev=curEv;list.forEach(c=>{const o1=c.ok,o2=c.ko;const k=ev+" | "+c.l;c.ok=()=>{life.ch.push([k,1]);return o1()};if(o2)c.ko=()=>{life.ch.push([k,0]);return o2()}});return _ch(list,q)};
const _cs=computeScore;computeScore=function(a,b,l){const r=_cs(a,b,l);M._parts=r.parts.map(p=>p[1]);return r};
const _cause=cause;cause=function(a){const c=_cause(a);M._lastCause=c;const k=c.replace(/entouré.? des tiens|seul.? dans la nuit/,'').replace(/ton |ta /,'');M.cause[k]=(M.cause[k]||0)+1;return c};
const policy="${POL||'random'}";
function chooseBtn(L){
  if(FORCE&&curEv==FORCE[0]&&!life.forced){const fb=L.find(b=>(b.innerHTML||'').includes(FORCE[1]));if(fb){life.forced=1;return fb}}
  if(policy=='random')return L[Math.floor(Math.random()*L.length)];
  if(policy.startsWith('f:')){const want=policy.slice(2);const fb=L.find(b=>b.innerHTML.includes(want)&&!/Continuer/.test(b.innerHTML));const cont=L.find(b=>/Continuer ·/.test(b.innerHTML));
    if(cont&&cont.innerHTML.includes(want))return cont; if(fb)return fb; const chg=L.find(b=>b.textContent=='Changer de priorité'); if(cont&&chg&&!cont.innerHTML.includes(want)&&L.some(()=>1)){ }
    const ev=L.filter(b=>!/Continuer ·|Changer/.test(b.innerHTML+b.textContent));const pool=ev.length?ev:L;
    return pool.slice().sort((a,b)=>{const pa=(a.innerHTML.match(/(\d+) %/)||[0,70])[1],pb=(b.innerHTML.match(/(\d+) %/)||[0,70])[1];return pb-pa})[0]}
  // smart: prefer high % ; focus by need
  const sc=b=>{const t=b.innerHTML;let s=Math.random()*.2;const m=t.match(/(\\d+) %/);if(m)s+=+m[1]/100;
    if(/Prendre soin|Te soigner|Suivre un traitement|Commencer le traitement|hôpital|vacciner|dispensaire/.test(t)&&S.h<70)s+=.8;
    if(/Économiser/.test(t)&&(S.m<25||S.debt))s+=.7;
    if(/Viser une promotion/.test(t)&&S.h>60&&S.m>=25)s+=.5;
    if(/Étudier sérieusement|Te former/.test(t)&&S.age<30)s+=.6;
    if(/Te consacrer à ta famille|Équilibre/.test(t)&&(S.partner&&S.partner.rel<50||S.b<40))s+=.75;
    if(/Chercher du travail/.test(t))s+=1;
    if(/Tenter l'université|Entrer au collège|Aller à l'école|Tenter ta chance|Dire oui|Essayer d'avoir/.test(t))s+=.5;
    if(/passeur|Accepter$|Céder|Investir$/.test(t))s-=.3;
    return s};
  return L.slice().sort((a,b)=>sc(b)-sc(a))[0];
}
const VL=[];const X={trait:{},country:{},sex:{m:[],f:[]},wealth:[[],[],[]],ach:{},ageHist:{}};
const SC=[];for(let n=0;n<${N};n++){if(process.env.SEED)_rs(+process.env.SEED*100003+n*7919+1);SAVE.ach=[];SAVE.born=[];SAVE.lives=[];ALL=[];life={evs:new Set(),ch:[],turns:0,clicks:0};M._lastCause='';birth();while(ivf)ivf();
  let guard=0;
  while(guard++<600){const L=ALL.filter(b=>live(b));if(L.find(b=>b._end))break;if(!L.length){console.log('STUCK',S.age);break}
    const b=chooseBtn(L);life.clicks++;b.onclick();
    ["h","b","m","e","l"].forEach(k=>{if(S[k]<=0)M.sat[k+"0"]=(M.sat[k+"0"]||0)+1;if(S[k]>=100)M.sat[k+"100"]=(M.sat[k+"100"]||0)+1});}
  const sc=SAVE.lives[0].s;M.score.push(sc);M.age.push(S.age);M.byT[S.c.t].push(S.age);M.scoreT[S.c.t].push(sc);M.clicks.push(life.clicks);M.turns.push(life.turns);M.evPerLife.push(life.evs.size);
  life.evs.forEach(id=>M.evLives[id]=(M.evLives[id]||0)+1);
  for(const [k,ok] of life.ch){const o=M.choice[k]||(M.choice[k]={n:0,s:0,ok:0,a:0});o.n++;o.s+=sc;o.ok+=ok;o.a+=S.age}
  S.traits.forEach(t=>(X.trait[t]=X.trait[t]||[]).push(sc));(X.country[S.c.n]=X.country[S.c.n]||[]).push(sc);X.sex[S.sex].push(sc);X.wealth[S.wealth].push(sc);SAVE.ach.forEach(a=>X.ach[a]=(X.ach[a]||0)+1);const ab=Math.floor(S.age/10)*10;X.ageHist[ab]=(X.ageHist[ab]||0)+1;
  if(process.env.SCORES)SC.push([sc,S.age,FORCE?(life.evs.has(FORCE[0])?(life.forced?1:2):0):0,M._parts,S.kids.length,S.everPartner?1:0]);
  if(S.debt>0)M.debt++;M.kids.push(S.kids.length);if(S.everPartner)M.partner++;
  const lj=S.job||S.lastJob;if(lj)M.maxLvl[lj.lvl]++;
  if(process.env.VIES)VL.push({p:S.c.n,t:S.c.t,w:S.wealth,sx:S.sex,a:S.age,s:sc,c:M._lastCause||'',ev:[...life.evs].filter(x=>!x.startsWith('S@')),j:lj?lj.s:null,lv:lj?lj.lvl:-1,ed:S.edu,k:S.kids.length,pa:!!S.everPartner,ab:S.ab?S.ab[0]:null,tr:S.traits.slice(),ac:SAVE.ach.slice(),g:[S.h,S.b,S.m,S.e,S.l].map(Math.round),cl:life.clicks,ch:life.ch.map(x=>x[0])});
}
const avg=a=>a.length?(a.reduce((x,y)=>x+y,0)/a.length):0, f1=x=>x.toFixed(1);
const sd=a=>{const m=avg(a);return Math.sqrt(avg(a.map(x=>(x-m)**2)))};
if(process.env.SCORES)require('fs').writeFileSync(process.env.SCORES,JSON.stringify(SC));if(process.env.VIES)require('fs').writeFileSync(process.env.VIES,JSON.stringify(VL));if(process.env.JSON){require('fs').writeFileSync(process.env.JSON,JSON.stringify({M:{...M,choice:M.choice},X,BAD:global.BAD||{},N:${N}}));}
console.log("=== POLICY",policy,"N",${N});
console.log("age moyen",f1(avg(M.age)),"par revenu",[1,2,3,4].map(t=>f1(avg(M.byT[t]))).join(" / "));
console.log("score moyen",f1(avg(M.score)),"sd",f1(sd(M.score)),"par revenu",[1,2,3,4].map(t=>f1(avg(M.scoreT[t]))).join(" / "));
console.log("tours/vie",f1(avg(M.turns)),"clics/vie",f1(avg(M.clicks)),"événements distincts/vie",f1(avg(M.evPerLife)));
console.log("tours sans événement",(100*M.empty/M.turnsTot).toFixed(1)+"%","tours vides après 70 ans",(100*M.oldQuiet/Math.max(1,M.oldTurns)).toFixed(1)+"%");
console.log("saturation (nb clics où jauge à 0/100)",JSON.stringify(M.sat));
console.log("fin avec dettes",M.debt,"enfants moy",f1(avg(M.kids)),"a eu un partenaire",M.partner,"niveau final carrière",M.maxLvl.join(","));
console.log("--- causes",JSON.stringify(Object.entries(M.cause).sort((a,b)=>b[1]-a[1]).slice(0,14)));
const evs=[...EV,...MACRO].map(e=>[e.id,M.evLives[e.id]||0]).sort((a,b)=>b[1]-a[1]);
console.log("--- % vies où l'événement apparaît:",evs.map(([i,c])=>i+":"+(100*c/${N}).toFixed(0)).join(" "));
if(process.env.CH){console.log("--- choix (n, %réussite, écart score vs moyenne de l'événement)");
 const byEv={};for(const k in M.choice){const ev=k.split(" | ")[0];(byEv[ev]=byEv[ev]||[]).push([k,M.choice[k]])}
 for(const ev in byEv){const L=byEv[ev];const tot=L.reduce((s,x)=>s+x[1].s,0)/L.reduce((s,x)=>s+x[1].n,0);
  if(ev.startsWith("S@"))continue;
  console.log(ev+": "+L.map(([k,o])=>k.split(" | ")[1]+" n="+o.n+" ok="+(100*o.ok/o.n).toFixed(0)+"% Δ="+(o.s/o.n-tot).toFixed(1)).join(" ; "))}}
`);
