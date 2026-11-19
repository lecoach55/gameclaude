// Hameau — moteur de simulation (sans DOM)
const Sim=(function(){
'use strict';
const W=56,H=56,N=W*H;
const T_GRASS=0,T_STONE=2,T_WATER=3;
const Z={none:0,house:1,field:2,forest:3,quarry:4,market:5,workshop:6,fishing:7,chapel:8,pasture:9};
const NF=['Jeanne','Marie','Agnès','Isabeau','Mahaut','Perrine','Aude','Blanche','Guillemette','Alix','Héloïse','Margot','Ysabel','Clémence','Sibylle','Ermengarde','Béatrice','Colette','Odile','Pernelle','Jacquette','Aliénor','Gisèle','Mathilde'];
const NM=['Jehan','Guillaume','Pierre','Thibaut','Martin','Bertrand','Gautier','Hugues','Robin','Colin','Arnaud','Étienne','Raoul','Simon','Mathieu','Enguerrand','Gilles','Benoît','Aymeric','Florent','Lambert','Renaud','Tristan','Baudouin'];
const DEFAULTS={
  houseWood:4, marketWood:3, marketStone:2, upWood:2, upStone:3, upTools:1, storeWood:6, storeStone:2,
  shopWood:5, shopStone:3, craftTime:6, craftWood:2, craftStone:1, toolInterval:45, useTools:true,
  fieldGrow:25, harvestYield:7, chainHarvest:true, chainMax:3, plantTime:2.5, harvestTime:3, replant:false, mealInterval:12, foodPerMeal:1,
  seasons:true, fishing:true, fishTime:5, fishYield:6, fishRegen:40, chapels:true, chapelWood:6, chapelStone:6, chapelR:11, house3Cap:10, up3Wood:3, up3Stone:4, up3Tools:2, varietyBonus:8, chapelBonus:10, level3:true, winterGrow:0.3, winterImmig:false, jobsGate:false, maxIdle:0.35, seasonLen:96, heatInterval:20, heatHouse:1, heatHouse2:0.5, heatHall:1, plantPrio:3,
  chopTime:3, chopWood:3, treeGrow:60, treeRegrow:0.02, mineTime:4, stoneYield:2,
  walkSpeed:1.7, roadMul:1.7, pathMul:1.3, pathT:6, roadT:30, trafficDecay:0.995,
  buildTime:6, carry:5, immigInterval:5, immigHappy:30, immigFood:3, immigTrend:true, replantTree:true, trampleRoad:true, reachFilter:true, advTrend:true, forage:0.5, berryYield:2, berryRegen:150, autumnGate:1.2, autumnFarm:1.4, deadwood:0.7, dwYield:2, dwRegen:150, stoneNeed:true, stoneTgt:4, stoneW:3.2, fest:true, festBonus:10, festNeed:1.8, festFood:2, weed:0.6, weedGain:0.2, emigHappy:20, hallCap:6, houseCap:4, house2Cap:7,
  marketR:9, autoStore:true, storeDist:12, storeDemand:25, startFood:60, startWood:24, startStone:6,
  bigFamily:true, terraces:true,
  gens:true, adultAge:14, elderAge:58, retireAge:66, deathAge:62, kidMeal:0.5, birthInterval:34, birthHappy:55, birthMaxKids:0.3, birthScale:0, ageRate:1,
  // arrivées (décision de Victor 16/11) : 'graine' = tirée à la graine de la carte ; 'etale' = âges étalés et enfants ; 'vague' = jeunes adultes (une génération qui passe, annoncée par un conseil)
  arrivees:'graine', arrKid:0.15, arrMin:16, arrMax:50,
  pasture:true, woolGrow:55, shearTime:3, woolYield:3, sheepPer:4, sheepBreed:45, sheepMax:30, sheepHay:0.12, clothWool:2, clothTime:6, clothUse:0.015, warmBonus:6, warmHeat:0.75,
  merchant:true, merchantStock:3,
  // petits événements à décision (décision de Victor 18/11) : ≈ 1 par saison, pertes modérées et rattrapables ; evtRate 0 = aucun
  events:true, evtRate:1, evtChance:0.75, evtStart:4, evtAt:0.35, evtWait:0.5, evtScale:1, evtMinPop:8,
  fert:true, fertUse:0.12, fertRegen:200, fertWinter:90, fertBase:0.62, fertGain:0.42, fallowMin:0.3, fallowOk:0.7
};
function hash2(x,y,s){let h=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(s|0,1442695041);h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return (h>>>0)/4294967296;}
function vnoise(x,y,s){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi;const u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
  const a=hash2(xi,yi,s),b=hash2(xi+1,yi,s),c=hash2(xi,yi+1,s),d=hash2(xi+1,yi+1,s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
function fbm(x,y,s){return vnoise(x,y,s)*0.6+vnoise(x*2,y*2,s+7)*0.28+vnoise(x*4,y*4,s+13)*0.12;}
const idx=(x,y)=>y*W+x, inb=(x,y)=>x>=0&&y>=0&&x<W&&y<H, clamp=(v,a,b)=>v<a?a:v>b?b:v;

function create(params,rng){
const P=Object.assign({},DEFAULTS,params||{});
let R=rng||Math.random;
const S={P,W,H,N,Z,T_GRASS,T_STONE,T_WATER,idx,inb,hash2,
  terrain:null,tree:null,stoneAmt:null,zone:null,traffic:null,fstate:null,fgrow:null,occ:null,reserved:null,unreach:null,elev:null,
  buildings:[],bmap:new Map(),villagers:[],sheep:[],merchant:null,evt:null,evH:[],evS:-1,arr:'vague',vague:false,dlog:[],blog:[],fert:null,rest:null,res:null,fishAmt:null,time:0,happy:60,starving:false,seed:1,hall:null,
  cold:false,noTools:false,variety:false,info:{fields:0,forestTrees:0,quarryStone:0,houseZone:0,marketZone:0,shopZone:0,fishZone:0,chapelZone:0,spot:true,jobs:{}},
  stats:{pathFails:0,pathCalls:0,coldTime:0,starveTime:0,idleTime:0,workTime:0,walkTime:0,haulDist:0,hauls:0,arrivals:0,departures:0,built:0,births:0,deaths:0,sheared:0,trades:0},
  milestones:new Set(),onEvent:null,version:0,hist:[],trend:{food:0,wood:0,stone:0,tools:0,fish:0,wool:0,clothes:0}};
let nextVid=1,nextBid=1;
const timers={trend:0,tool:0,heat:0,plan:0,meal:0,immig:0,emig:0,env:0,decay:0,store:0,birth:0,death:0,sheep:0};
let demand=new Float32Array(Math.ceil(W/7)*Math.ceil(H/7));
const emit=(type,data)=>{if(S.onEvent)S.onEvent(type,data);};

function alloc(){
  S.terrain=new Uint8Array(N);S.tree=new Float32Array(N);S.stoneAmt=new Uint8Array(N);S.zone=new Uint8Array(N);
  S.traffic=new Float32Array(N);S.fstate=new Uint8Array(N);S.fgrow=new Float32Array(N);S.occ=new Int32Array(N).fill(-1);
  S.reserved=new Int32Array(N);S.unreach=new Float32Array(N);S.elev=new Float32Array(N);S.fishAmt=new Float32Array(N).fill(1);S.fert=new Float32Array(N).fill(1);S.rest=new Uint8Array(N);
}
function genTerrain(){
  const {terrain,tree,stoneAmt,elev}=S,seed=S.seed,cx=W/2,cy=H/2;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const i=idx(x,y),dc=Math.hypot(x+0.5-cx,y+0.5-cy);
    const w=fbm(x/10,y/10,seed),f=fbm(x/7,y/7,seed+101),s=fbm(x/5,y/5,seed+202);
    elev[i]=fbm(x/12,y/12,seed+303);
    if(w<0.33&&dc>10)terrain[i]=T_WATER;
    else if(s>0.665&&dc>7){terrain[i]=T_STONE;stoneAmt[i]=5+(hash2(x,y,seed+3)*5|0);}
    else if(dc>4.5&&((f>0.54&&hash2(x,y,seed+5)>0.12)||hash2(x,y,seed+9)<0.03))tree[i]=1;
  }
  const count=(pred,r)=>{let n=0;for(let i=0;i<N;i++){const x=i%W,y=i/W|0;if(Math.hypot(x-cx,y-cy)<r&&pred(i))n++;}return n;};
  const blob=(bx,by,r,fn)=>{for(let y=Math.floor(by-r);y<=by+r;y++)for(let x=Math.floor(bx-r);x<=bx+r;x++){if(!inb(x,y))continue;if(Math.hypot(x-bx,y-by)<=r+hash2(x,y,seed+44)*0.8)fn(idx(x,y));}};
  if(count(i=>tree[i]>0,15)<35)blob(cx-11,cy+5,3.6,i=>{terrain[i]=T_GRASS;stoneAmt[i]=0;tree[i]=1;});
  if(count(i=>terrain[i]===T_STONE,17)<8)blob(cx+10,cy-8,2.3,i=>{terrain[i]=T_STONE;stoneAmt[i]=8;tree[i]=0;});
}
function addBuilding(type,x,y,w,h,built,cost){
  const b={id:nextBid++,type,x,y,w,h,built,level:1,site:null,born:S.time};
  if(!built)b.site=mkSite(cost[0],cost[1],cost[2]||0);
  for(let dy=0;dy<h;dy++)for(let dx=0;dx<w;dx++){const i=idx(x+dx,y+dy);S.occ[i]=b.id;if(S.tree[i]>=1)S.res.wood+=1;S.tree[i]=0;S.fstate[i]=0;}
  S.buildings.push(b);S.bmap.set(b.id,b);S.version++;return b;
}
function mkSite(w,s,t){return {need:{wood:w,stone:s,tools:t},have:{wood:0,stone:0,tools:0},prog:0,asg:0};}
function siteMissing(s){let m=0;for(const k in s.need)m+=Math.max(0,s.need[k]-s.have[k]);return m;}
function removeBuilding(b,refund){
  if(b.site&&refund)for(const k in b.site.have)S.res[k]+=b.site.have[k];
  for(let dy=0;dy<b.h;dy++)for(let dx=0;dx<b.w;dx++)S.occ[idx(b.x+dx,b.y+dy)]=-1;
  b.removed=true;S.buildings.splice(S.buildings.indexOf(b),1);S.bmap.delete(b.id);S.version++;
}
function capacity(){let c=0;for(const b of S.buildings){if(!b.built)continue;if(b.type==='hall')c+=P.hallCap;else if(b.type==='house')c+=b.level>=3?P.house3Cap:b.level>=2?P.house2Cap:P.houseCap;}return c;}
function frontOf(b){
  const x=b.x+(b.w>>1),y=b.y+b.h;
  if(inb(x,y)&&S.terrain[idx(x,y)]!==T_WATER)return {x,y};
  return {x:b.x+(b.w>>1),y:b.y+b.h-1};
}
function stores(){return S.buildings.filter(b=>(b.type==='hall'||b.type==='store')&&b.built);}
function nearestStore(x,y,needStock){
  let best=S.hall,bd=1e9;
  for(const b of stores()){const f=frontOf(b);const d=Math.hypot(f.x-x,f.y-y);if(d<bd){bd=d;best=b;}}
  return best;
}
// ---- villageois ----
function pickName(fem){const L=fem?NF:NM,used=new Set(S.villagers.map(v=>v.name));for(let k=0;k<8;k++){const n=L[(R()*L.length)|0];if(!used.has(n))return n;}return L[(R()*L.length)|0];}
function spawnVillager(x,y,o){
  o=o||{};const fem=o.fem!=null?o.fem:R()<0.5;
  const v={id:nextVid++,x,y,plan:[],cur:null,job:'idle',carry:null,res:[],face:0,phase:R()*6,walking:false,working:false,wait:0,
    skin:o.skin!=null?o.skin:(R()*4)|0,hat:(R()*3)|0,from:null,fem,age:o.age!=null?o.age:16+R()*24,name:o.name||pickName(fem)};
  S.villagers.push(v);return v;
}
const isKid=v=>P.gens&&v.age<P.adultAge,isRetired=v=>P.gens&&v.age>=P.retireAge,isElder=v=>P.gens&&v.age>=P.elderAge;
function release(v){
  v.shop=null;v.weave=false;if(v.sheepId){const a=S.sheep.find(o=>o.id===v.sheepId);if(a&&a.held===v.id)a.held=0;v.sheepId=0;}
  for(const i of v.res)if(S.reserved[i]===v.id)S.reserved[i]=0;
  v.res.length=0;
  for(const b of S.buildings)if(b.site&&b.site.asg===v.id)b.site.asg=0;
}
function reserve(v,i){S.reserved[i]=v.id;v.res.push(i);}
const goTo=(v,x,y)=>v.plan.push({a:'go',x,y});
const work=(v,t,fn,tick)=>v.plan.push({a:'work',t,fn,tick});
const doIt=(v,fn)=>v.plan.push({a:'do',fn});
function thenDeposit(v){
  doIt(v,()=>{if(!v.carry)return;
    const st=nearestStore(v.x,v.y);const f=frontOf(st);
    const d=Math.hypot(f.x-v.x,f.y-v.y);S.stats.haulDist+=d;S.stats.hauls++;
    if(P.autoStore&&d>P.storeDist){const c=((v.y/7)|0)*Math.ceil(W/7)+((v.x/7)|0);demand[c]+=d-P.storeDist;}
    v.plan.unshift({a:'go',x:f.x,y:f.y},{a:'do',fn:()=>deposit(v)});});
}
function deposit(v){
  if(!v.carry)return;
  const out=[];
  for(const k in v.carry){const n=v.carry[k];if(!n)continue;S.res[k]+=n;out.push([k,n]);}
  if(out.length)emit('gain',{x:v.x,y:v.y,items:out});
  v.carry=null;
}
function vdist(v,i){return Math.hypot(i%W+0.5-v.x,(i/W|0)+0.5-v.y);}
const ZL={};let zlT=-1;
function zoneList(z){if(S.time-zlT>=1||zlT<0||S.time<zlT){zlT=S.time;for(const k in ZL)ZL[k].length=0;for(let i=0;i<N;i++){const zz=S.zone[i];if(zz){(ZL[zz]||(ZL[zz]=[])).push(i);}}}return ZL[z]||(ZL[z]=[]);}
function nearest(v,pred,z){
  let best=-1,bd=1e18;const t=S.time,rs=P.reachFilter?reachSet():null,vx=v.x-0.5,vy=v.y-0.5;
  const L=z!=null?zoneList(z):null,n=L?L.length:N;
  for(let k=0;k<n;k++){const i=L?L[k]:k;if(!pred(i)||S.unreach[i]>t)continue;if(rs&&!rs[i]&&S.terrain[i]!==T_WATER)continue;const dx=i%W-vx,dy=(i/W|0)-vy,d=dx*dx+dy*dy;if(d<bd){bd=d;best=i;}}
  return best;
}
function findFieldTask(v){
  let best=null,bs=1e9;const {zone,reserved,occ,terrain,tree,fstate,unreach}=S;const rs=P.reachFilter?reachSet():null;
  const L=zoneList(Z.field);for(let q=0;q<L.length;q++){const i=L[q];
    if(zone[i]!==Z.field||reserved[i]||occ[i]>=0||terrain[i]!==T_GRASS||unreach[i]>S.time)continue;if(rs&&!rs[i])continue;
    let k,p;
    if(tree[i]>0){k='clear';p=6;}else if(fstate[i]===2){k='harvest';p=0;}else if(fstate[i]===0){if(P.fert&&S.rest[i])continue;k='plant';p=3+(P.fert?(1-S.fert[i])*4:0);}else continue;
    const d=vdist(v,i)+p;if(d<bs){bs=d;best={i,k};}
  }
  return best;
}
function pickSite(v){
  let best=null,bd=1e9;const res=S.res;
  for(const b of S.buildings){
    const s=b.site;if(!s||s.asg)continue;
    const t=frontOf(b);if(S.unreach[idx(t.x,t.y)]>S.time)continue;
    const miss=siteMissing(s);let ok=miss===0;
    if(!ok)for(const k in s.need)if(s.need[k]>s.have[k]&&res[k]>=1)ok=true;
    if(!ok)continue;
    const d=Math.hypot(b.x+b.w/2-v.x,b.y+b.h/2-v.y)+(miss===0?-4:0)+(b.type==='store'?-6:0);
    if(d<bd){bd=d;best=b;}
  }
  return best;
}
function planBuild(v,b){
  v.job='build';const s=b.site;s.asg=v.id;const t=frontOf(b);
  const miss=siteMissing(s);
  const buildStep=()=>{v.plan.unshift({a:'work',t:P.buildTime*(1-(b.site?b.site.prog:1)),
    tick:dt=>{if(b.site)b.site.prog=Math.min(1,b.site.prog+dt/P.buildTime);},
    fn:()=>{if(!b.removed&&b.site&&b.site.prog>=0.99)completeSite(b);}});};
  if(miss>0){
    const st=nearestStore(t.x,t.y),f=frontOf(st);
    goTo(v,f.x,f.y);
    doIt(v,()=>{
      if(!b.site){v.plan.length=0;return;}
      let room=P.carry;const c={};
      for(const k in s.need){const n=Math.min(Math.max(0,s.need[k]-s.have[k]),Math.floor(S.res[k]),room);if(n>0){c[k]=n;S.res[k]-=n;room-=n;}}
      if(room===P.carry){v.plan.length=0;return;}
      v.carry=c;
    });
    goTo(v,t.x,t.y);
    doIt(v,()=>{
      if(b.removed||!b.site){deposit(v);return;}
      if(v.carry)for(const k in v.carry)b.site.have[k]+=v.carry[k];v.carry=null;S.version++;
      if(siteMissing(b.site)===0)buildStep();
    });
  }else{goTo(v,t.x,t.y);doIt(v,()=>{if(!b.removed&&b.site)buildStep();});}
}
function milestone(key,msg){if(S.milestones.has(key))return;S.milestones.add(key);emit('toast',msg);}
function completeSite(b){
  b.site=null;S.version++;S.stats.built++;emit('built',{x:b.x+b.w/2,y:b.y+b.h/2,up:!!b.built});
  if(b.built){b.level=Math.min(3,b.level+1);if(b.level===3)milestone('up3','🏰 Première maison de maître : 10 habitants !');else milestone('up','🏛️ Une maison passe en pierre grâce au marché !');}
  else{b.built=true;
    if(b.type==='house')milestone('house','🏠 Première maison construite !');
    if(b.type==='market')milestone('market','🏪 Le marché ouvre ses étals !');
    if(b.type==='store')emit('toast','📦 Un entrepôt est construit près des travailleurs');
    if(b.type==='chapel')milestone('chapel','⛪ La chapelle sonne : les foyers alentour sont plus heureux');
    if(b.type==='workshop')milestone('shop','🔧 Premier atelier : les artisans fabriquent des outils');}
}
function planFarm(v,t){
  v.job='farm';reserve(v,t.i);const i=t.i;
  goTo(v,i%W,i/W|0);
  if(t.k==='harvest'){
    const harvestAt=j=>{
      work(v,P.harvestTime,()=>{if(S.fstate[j]===2&&S.zone[j]===Z.field){S.fstate[j]=P.replant?1:0;S.fgrow[j]=0;v.carry=v.carry||{food:0};const fy=P.fert?Math.round(P.harvestYield*(P.fertBase+P.fertGain*S.fert[j])):P.harvestYield;v.carry.food+=fy;if(P.fert){S.fert[j]=Math.max(0,S.fert[j]-P.fertUse);if(S.fert[j]<P.fallowMin)S.rest[j]=1;}}});
      doIt(v,()=>{
        if(!P.chainHarvest||!v.carry||v.carry.food>=P.harvestYield*P.chainMax)return;
        let best=-1,bd=1e9;const jx=j%W,jy=j/W|0;
        for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const x=jx+dx,y=jy+dy;if(!inb(x,y))continue;const k=idx(x,y);
          if(S.zone[k]!==Z.field||S.fstate[k]!==2||S.reserved[k]||S.occ[k]>=0)continue;const d=Math.abs(dx)+Math.abs(dy);if(d<bd){bd=d;best=k;}}
        if(best<0)return;reserve(v,best);
        const save=v.plan.splice(0);goTo(v,best%W,best/W|0);harvestAt(best);v.plan.push(...save);
      });
    };
    harvestAt(i);
    thenDeposit(v);
  }else if(t.k==='plant'){
    work(v,P.plantTime,()=>{if(S.zone[i]===Z.field&&S.fstate[i]===0&&S.tree[i]===0){S.fstate[i]=1;S.fgrow[i]=0;}});
  }else{
    work(v,2.5,()=>{if(S.tree[i]>0){if(S.tree[i]>=1)S.res.wood+=1;S.tree[i]=0;}});
  }
}
function planWood(v,i){
  v.job='wood';reserve(v,i);goTo(v,i%W,i/W|0);
  work(v,P.chopTime,()=>{if(S.tree[i]>=1){S.tree[i]=P.replantTree?0.05:0;v.carry={wood:P.chopWood};emit('fell',{i});}});
  thenDeposit(v);
}
function planStone(v,i){
  v.job='stone';reserve(v,i);goTo(v,i%W,i/W|0);
  work(v,P.mineTime,()=>{if(S.terrain[i]===T_STONE&&S.stoneAmt[i]>0){S.stoneAmt[i]--;v.carry={stone:P.stoneYield};if(S.stoneAmt[i]===0){S.terrain[i]=T_GRASS;emit('terrain',{i});}}});
  thenDeposit(v);
}
function planCraft(v,b){
  v.job='craft';v.shop=b.id;const t=frontOf(b),st=nearestStore(t.x,t.y),f=frontOf(st);
  goTo(v,f.x,f.y);
  doIt(v,()=>{if(S.res.wood<P.craftWood||S.res.stone<P.craftStone||b.removed){v.plan.length=0;return;}S.res.wood-=P.craftWood;S.res.stone-=P.craftStone;v.carry={wood:P.craftWood,stone:P.craftStone};});
  goTo(v,t.x,t.y);
  work(v,P.craftTime,()=>{if(b.removed){deposit(v);return;}v.carry={tools:1};});
  thenDeposit(v);
}
function planWeave(v,b){
  v.job='craft';v.shop=b.id;v.weave=true;const t=frontOf(b),st=nearestStore(t.x,t.y),f=frontOf(st);
  goTo(v,f.x,f.y);
  doIt(v,()=>{if((S.res.wool||0)<P.clothWool||b.removed){v.plan.length=0;return;}S.res.wool-=P.clothWool;v.carry={wool:P.clothWool};});
  goTo(v,t.x,t.y);
  work(v,P.clothTime,()=>{if(b.removed){deposit(v);return;}v.carry={clothes:1};});
  thenDeposit(v);
}
function planHerd(v,a){
  v.job='herd';a.held=v.id;v.sheepId=a.id;
  v.plan.push({a:'go',x:Math.round(a.x-0.5),y:Math.round(a.y-0.5)});
  doIt(v,()=>{v.face=Math.atan2(a.x-v.x,a.y-v.y);});
  work(v,P.shearTime,()=>{a.held=0;if(S.sheep.includes(a)&&a.wool>=1){a.wool=0;v.carry={wool:P.woolYield};S.stats.sheared++;emit('shear',{id:a.id});}});
  thenDeposit(v);
}
function planCull(v,a){
  v.job='herd';a.held=v.id;
  v.plan.push({a:'go',x:Math.round(a.x-0.5),y:Math.round(a.y-0.5)});
  work(v,P.shearTime,()=>{const k=S.sheep.indexOf(a);if(k>=0){S.sheep.splice(k,1);v.carry={food:6,wool:a.wool>=1?P.woolYield:0};}});
  thenDeposit(v);
}
function fishSpot(i){const x=i%W,y=i/W|0;for(const [dx,dy] of [[0,1],[1,0],[-1,0],[0,-1]]){const nx=x+dx,ny=y+dy;if(inb(nx,ny)&&S.terrain[idx(nx,ny)]!==T_WATER&&S.occ[idx(nx,ny)]<0)return idx(nx,ny);}return -1;}
function planFish(v,i){
  v.job='fish';reserve(v,i);const st=fishSpot(i);goTo(v,st%W,st/W|0);
  doIt(v,()=>{v.face=Math.atan2(i%W-st%W,(i/W|0)-(st/W|0));});
  work(v,P.fishTime,()=>{if(S.fishAmt[i]>=0.5){S.fishAmt[i]-=0.5;v.carry={fish:P.fishYield};}});
  thenDeposit(v);
}
function planIdle(v){
  v.job='idle';const h=S.hall;
  if(P.weed&&season()<3&&R()<P.weed){const L=zoneList(Z.field);if(L.length){for(let k=0;k<8;k++){const i=L[(R()*L.length)|0];
      if(S.fstate[i]!==1||S.reserved[i]||S.fgrow[i]>0.85||(S.weeded&&S.weeded[i]>S.time))continue;if(Math.hypot(i%W+0.5-v.x,(i/W|0)+0.5-v.y)>14)continue;S.weeded=S.weeded||new Float32Array(N);S.weeded[i]=S.time+P.fieldGrow*0.5;
      reserve(v,i);goTo(v,i%W,i/W|0);work(v,2.5,()=>{if(S.fstate[i]===1)S.fgrow[i]=Math.min(1,S.fgrow[i]+P.weedGain);});v.job='idle';return;}}}
  if(P.deadwood&&(season()>=2||S.res.wood<30)&&R()<P.deadwood){const rs=P.reachFilter?reachSet():null;S.dw=S.dw||new Float32Array(N);
    for(let k=0;k<14;k++){const x=Math.round(v.x+(R()-0.5)*16),y=Math.round(v.y+(R()-0.5)*16);if(!inb(x,y))continue;const i=idx(x,y);
      if(S.tree[i]<1||S.dw[i]>S.time||S.reserved[i]||(rs&&!rs[i]))continue;
      S.dw[i]=S.time+P.dwRegen;reserve(v,i);goTo(v,x,y);work(v,3,()=>{v.carry={wood:P.dwYield};});thenDeposit(v);return;}}
  if(P.forage&&season()!==3&&R()<P.forage){const rs=P.reachFilter?reachSet():null;S.berry=S.berry||new Float32Array(N);
    for(let k=0;k<14;k++){const x=Math.round(v.x+(R()-0.5)*16),y=Math.round(v.y+(R()-0.5)*16);if(!inb(x,y))continue;const i=idx(x,y);
      if(S.tree[i]<1||S.zone[i]!==0||S.berry[i]>S.time||S.reserved[i]||(rs&&!rs[i]))continue;
      S.berry[i]=S.time+P.berryRegen;reserve(v,i);goTo(v,x,y);work(v,3,()=>{v.carry={food:P.berryYield};});thenDeposit(v);return;}}
  for(let k=0;k<8;k++){
    const x=h.x+1+Math.round((R()-0.5)*9),y=h.y+1+Math.round((R()-0.3)*9);
    if(inb(x,y)&&S.terrain[idx(x,y)]!==T_WATER&&S.occ[idx(x,y)]<0){goTo(v,x,y);break;}
  }
  work(v,1.5+R()*3);
}
function planPlay(v){
  v.job='kid';const hs=S.buildings.filter(b=>b.built&&(b.type==='house'||b.type==='hall'||b.type==='market'||b.type==='chapel'));const b=hs.length?hs[(R()*hs.length)|0]:S.hall;
  for(let k=0;k<8;k++){const x=b.x+(b.w>>1)+Math.round((R()-0.5)*6),y=b.y+b.h+Math.round((R()-0.4)*5);
    if(inb(x,y)&&S.terrain[idx(x,y)]!==T_WATER&&S.occ[idx(x,y)]<0){goTo(v,x,y);break;}}
  work(v,2+R()*4);
}
function assignJob(v){
  release(v);
  if(isKid(v)){planPlay(v);return;}
  if(isRetired(v)){planIdle(v);v.job='elder';return;}
  if(S._cntT!==S.time){S._cntT=S.time;const c={build:0,farm:0,wood:0,stone:0,craft:0,fish:0,idle:0,kid:0,elder:0,herd:0};for(const o of S.villagers)if(o.cur||o.plan.length)c[o.job]++;S._cnt=c;}
  const cnt=S._cnt;
  const pop=S.villagers.length,opts=[],res=S.res;
  const site=pickSite(v);if(site)opts.push(['build',6,()=>planBuild(v,site)]);
  const lvl=(have,tgt,hi)=>have<tgt*0.3?hi:have<tgt?hi*0.55:have<tgt*2?hi*0.15:0.03;
  const houses=S.buildings.filter(b=>b.type==='house').length;
  const ft=findFieldTask(v);
  const winterFood=P.seasons?pop*P.seasonLen/P.mealInterval*P.foodPerMeal*1.3:0;
  if(ft){let w=lvl(res.food,Math.max(pop*8+20,winterFood*(P.autumnFarm&&season()===2?P.autumnFarm:1)),4.5);if(P.autumnFarm&&season()===2)w*=1.3;if(ft.k==='harvest')w+=1.5;else if(ft.k==='plant')w=Math.max(w,P.plantPrio);opts.push(['farm',w,()=>planFarm(v,ft)]);}
  const wt=nearest(v,i=>S.zone[i]===Z.forest&&S.tree[i]>=1&&!S.reserved[i],Z.forest);
  if(wt>=0){const w=lvl(res.wood,30+houses*8+(P.seasons?houses*P.seasonLen/P.heatInterval*1.6:0),3.5);opts.push(['wood',w,()=>planWood(v,wt)]);}
  const st=nearest(v,i=>S.zone[i]===Z.quarry&&S.terrain[i]===T_STONE&&S.stoneAmt[i]>0&&!S.reserved[i],Z.quarry);
  if(st>=0){let sn=0;if(P.stoneNeed)for(const b of S.buildings)if(b.site&&b.site.need.stone>b.site.have.stone)sn+=b.site.need.stone-b.site.have.stone;const w=lvl(res.stone,15+houses*(P.stoneTgt||2)+sn,P.stoneW||2.6);opts.push(['stone',w,()=>planStone(v,st)]);}
  if(P.fishing){const fi=nearest(v,i=>S.zone[i]===Z.fishing&&S.terrain[i]===T_WATER&&S.fishAmt[i]>=0.5&&!S.reserved[i]&&(P.reachFilter?(j=>j>=0&&reachSet()[j])(fishSpot(i)):fishSpot(i)>=0),Z.fishing);
    if(fi>=0)opts.push(['fish',lvl(res.fish,pop*3+15,2.8),()=>planFish(v,fi)]);}
  if(P.pasture&&S.sheep.length){let sh=null,sd=1e9;for(const a of S.sheep){if(a.held||a.wool<1||a.age<1)continue;const d=Math.hypot(a.x-v.x,a.y-v.y);if(d<sd){sd=d;sh=a;}}
    if(sh)opts.push(['herd',lvl(res.wool||0,6+houses*0.6,2.6),()=>planHerd(v,sh)]);
    else{const cap=sheepCap();const ex=S.sheep.find(a=>!a.held&&a.age>=1);if(ex&&S.sheep.length>cap+1)opts.push(['herd',1.6,()=>planCull(v,ex)]);}}
  const wantWeave=P.pasture&&(res.wool||0)>=P.clothWool,wantTools=P.useTools&&res.wood>=P.craftWood&&res.stone>=P.craftStone;
  if(wantWeave||wantTools){let shop=null,sd=1e9;const occ={};for(const o of S.villagers)if(o.shop)occ[o.shop]=(occ[o.shop]||0)+1;
    for(const b of S.buildings){if(b.type!=='workshop'||!b.built||(occ[b.id]||0)>=3)continue;const d=Math.hypot(b.x-v.x,b.y-v.y);if(d<sd){sd=d;shop=b;}}
    if(shop&&wantWeave)opts.push(['craft',lvl(res.clothes||0,pop*0.35+4,2.7),()=>planWeave(v,shop)]);
    if(shop&&wantTools){const l2=S.buildings.filter(b=>b.type==='house'&&b.level>=2).length;opts.push(['craft',lvl(res.tools,6+l2*1.5+houses*0.3,3),()=>planCraft(v,shop)]);}}
  if(isElder(v))for(let k=opts.length-1;k>=0;k--)if(opts[k][0]==='wood'||opts[k][0]==='stone'||opts[k][0]==='build')opts.splice(k,1);
  let best=null,bs=0.12;
  for(const o of opts){const s=o[1]/(1+cnt[o[0]]*0.7)*(0.85+R()*0.3);if(s>bs){bs=s;best=o;}}
  if(best){best[2]();S._cnt[best[0]]++;}else planIdle(v);
}
function failPlan(v,target){
  S.stats.pathFails++;S.stats.rescues=S.stats.rescues||0;
  v.fails=(v.fails||0)+1;
  if(v.fails>=6){const ok=reachSet();if(!ok[idx(v.x|0,v.y|0)]){const f=frontOf(S.hall);v.x=f.x+0.5;v.y=f.y+0.5;S.stats.rescues++;}v.fails=0;}
  if(target!=null)S.unreach[target]=S.time+30;
  v.plan.length=0;v.cur=null;if(v.carry)deposit(v);release(v);v.wait=1;
}
function speedAt(i){
  let s=P.walkSpeed;const tr=S.traffic[i];
  if(tr>=P.roadT)s*=P.roadMul;else if(tr>=P.pathT)s*=P.pathMul;
  if(S.tree[i]>=0.5)s*=0.75;if(S.zone[i]===Z.field&&S.fstate[i])s*=0.8;
  return s;
}
function onEnter(i){
  if(S.occ[i]>=0||S.zone[i]===Z.field)return;
  S.traffic[i]=Math.min(150,S.traffic[i]+1);
  if(S.tree[i]>0&&S.tree[i]<1&&S.traffic[i]>(P.trampleRoad?P.roadT:P.pathT))S.tree[i]=0;
}
function stepVillager(v,dt){
  v.walking=false;v.working=false;
  if(v.wait>0){v.wait-=dt;S.stats.idleTime+=dt;return;}
  if(!v.cur){
    v.cur=v.plan.shift()||null;
    if(!v.cur){assignJob(v);v.cur=v.plan.shift()||null;if(!v.cur){v.wait=0.5;return;}}
  }
  const c=v.cur;
  if(c.a==='go'){
    if(!c.path){
      const s=idx(clamp(Math.floor(v.x),0,W-1),clamp(Math.floor(v.y),0,H-1)),g=idx(c.x,c.y);
      c.path=findPath(s,g);c.k=0;S.stats.pathCalls++;
      if(!c.path){failPlan(v,g);return;}
    }
    let rem=dt;
    while(rem>0&&c.k<c.path.length){
      const i=c.path[c.k],tx=i%W+0.5,ty=(i/W|0)+0.5,dx=tx-v.x,dy=ty-v.y,d=Math.hypot(dx,dy);
      if(d>0.02)v.face=Math.atan2(dx,dy);
      if(d<1e-4){c.k++;continue;}
      const sp=speedAt(i),step=sp*rem;
      if(step>=d){v.x=tx;v.y=ty;rem-=d/sp;c.k++;onEnter(i);}
      else{v.x+=dx/d*step;v.y+=dy/d*step;rem=0;}
    }
    v.walking=true;v.phase+=dt*12;const lazy=v.job==='idle'||v.job==='kid'||v.job==='elder';
    if(lazy)S.stats.idleTime+=dt;else S.stats.walkTime+=dt;
    if(c.k>=c.path.length)v.cur=null;
  }else if(c.a==='work'){
    const lazy=v.job==='idle'||v.job==='kid'||v.job==='elder';c.t-=dt;v.working=!lazy;v.phase+=dt*8;if(c.tick)c.tick(dt);
    if(lazy)S.stats.idleTime+=dt;else S.stats.workTime+=dt;
    if(c.t<=0){v.cur=null;if(c.fn)c.fn();}
  }else{v.cur=null;c.fn();}
}
// ---- A* ----
const gS=new Float32Array(N),from=new Int32Array(N),seen=new Uint32Array(N),closed=new Uint32Array(N);
const hI=new Int32Array(N*9),hP=new Float32Array(N*9);let hN=0,stamp=0;
function hpush(i,p){let k=hN++;hI[k]=i;hP[k]=p;while(k>0){const pa=(k-1)>>1;if(hP[pa]<=hP[k])break;const ti=hI[pa],tp=hP[pa];hI[pa]=hI[k];hP[pa]=hP[k];hI[k]=ti;hP[k]=tp;k=pa;}}
function hpop(){const r=hI[0];hN--;if(hN>0){hI[0]=hI[hN];hP[0]=hP[hN];let k=0;for(;;){const l=2*k+1,rr=l+1;let m=k;if(l<hN&&hP[l]<hP[m])m=l;if(rr<hN&&hP[rr]<hP[m])m=rr;if(m===k)break;const ti=hI[m],tp=hP[m];hI[m]=hI[k];hP[m]=hP[k];hI[k]=ti;hP[k]=tp;k=m;}}return r;}
function tcost(i){
  if(S.terrain[i]===T_WATER)return Infinity;
  let c=1;const tr=S.traffic[i];
  if(tr>=P.roadT)c=0.5;else if(tr>=P.pathT)c=0.72;
  if(S.tree[i]>=0.5)c+=1.4;if(S.terrain[i]===T_STONE)c+=2;if(S.occ[i]>=0)c+=3;if(S.zone[i]===Z.field&&S.fstate[i]>0)c+=1.2;
  return c;
}
const DIRS=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
function findPath(s,g){
  if(s===g)return [];
  if(S.terrain[g]===T_WATER)return null;
  stamp++;hN=0;
  const gx=g%W,gy=g/W|0;
  const heur=(x,y)=>{const dx=Math.abs(x-gx),dy=Math.abs(y-gy);return (Math.max(dx,dy)+0.414*Math.min(dx,dy))*0.5;};
  gS[s]=0;seen[s]=stamp;from[s]=-1;hpush(s,heur(s%W,s/W|0));
  let it=0,found=false;
  while(hN>0){
    const cur=hpop();
    if(cur===g){found=true;break;}
    if(closed[cur]===stamp)continue;closed[cur]=stamp;
    if(++it>7000)return null;
    const cx=cur%W,cy=cur/W|0;
    for(let k=0;k<8;k++){
      const dx=DIRS[k][0],dy=DIRS[k][1],nx=cx+dx,ny=cy+dy;
      if(nx<0||ny<0||nx>=W||ny>=H)continue;
      const ni=ny*W+nx;if(closed[ni]===stamp)continue;
      let c=tcost(ni);if(c===Infinity)continue;
      if(k>=4){if(S.terrain[cy*W+nx]===T_WATER||S.terrain[ny*W+cx]===T_WATER)continue;c*=1.414;}
      const ng=gS[cur]+c;
      if(seen[ni]!==stamp||ng<gS[ni]){seen[ni]=stamp;gS[ni]=ng;from[ni]=cur;hpush(ni,ng+heur(nx,ny));}
    }
  }
  if(!found)return null;
  const p=[];let c=g;
  while(c!==s){p.push(c);c=from[c];if(c<0)return null;}
  return p.reverse();
}
// ---- planificateur ----
function fitsAt(x,y,ok,ring){
  for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){const i=idx(x+dx,y+dy);if(!ok(i)||S.occ[i]>=0||S.terrain[i]!==T_GRASS||S.reserved[i])return false;}
  for(let dy=-1;dy<=2;dy++)for(let dx=-1;dx<=2;dx++){
    if(dx>=0&&dx<=1&&dy>=0&&dy<=1)continue;
    if(!ring&&dy!==2)continue;
    if(ring&&P.terraces&&(dx<0||dx>1))continue;
    const nx=x+dx,ny=y+dy;if(!inb(nx,ny))continue;if(S.occ[idx(nx,ny)]>=0)return false;
  }
  return true;
}
function findSpot(ok,cx,cy,maxD,ring=true){
  let best=null,bs=1e9;
  for(let y=0;y<H-1;y++)for(let x=0;x<W-1;x++){
    if(!ok(idx(x,y)))continue;
    const d=Math.hypot(x+1-cx,y+1-cy);if(maxD&&d>maxD)continue;
    if(!fitsAt(x,y,ok,ring))continue;
    const sc=d+hash2(x,y,S.seed)*1.5;
    if(sc<bs){bs=sc;best=[x,y];}
  }
  return best;
}
function planner(){
  const pop=S.villagers.length,cap=capacity(),res=S.res,h=S.hall,hx=h.x+1.5,hy=h.y+1.5;
  let sites=0,pendCap=0,markets=0;
  for(const b of S.buildings){if(b.site)sites++;if(b.type==='house'&&!b.built)pendCap+=P.houseCap;if(b.type==='market')markets++;}
  const maxSites=2+Math.floor(pop/6);
  S.info.spot=true;
  const want=P.bigFamily?Math.max(4,Math.ceil(pop*0.15)):4;
  if(sites<maxSites&&cap+pendCap-pop<want){
    const s=findSpot(i=>S.zone[i]===Z.house,hx,hy);
    if(s){addBuilding('house',s[0],s[1],2,2,false,[P.houseWood,0,0]);sites++;}else{S.info.spot=false;if(P.autoHouse!==false&&S.happy>=50&&!S.starving&&!S.cold&&season()<2&&res.food>=pop*6&&res.wood>=pop*0.5)growHousing(hx,hy);}
  }
  if(sites<maxSites&&markets<1+Math.floor(pop/14)&&pop>=5){
    const s=findSpot(i=>S.zone[i]===Z.market,hx,hy,0,false);if(s){addBuilding('market',s[0],s[1],2,2,false,[P.marketWood,P.marketStone]);sites++;}
  }
  const chs=S.buildings.filter(b=>b.type==='chapel').length;
  if(P.chapels&&sites<maxSites&&chs<1+Math.floor(pop/60)&&pop>=20){
    const s=findSpot(i=>S.zone[i]===Z.chapel,hx,hy,0,false);if(s){addBuilding('chapel',s[0],s[1],2,2,false,[P.chapelWood,P.chapelStone]);sites++;}
  }
  const shops=S.buildings.filter(b=>b.type==='workshop').length;
  if(sites<maxSites&&shops<1+Math.floor(pop/25)&&pop>=10){
    const s=findSpot(i=>S.zone[i]===Z.workshop,hx,hy,0,false);if(s){addBuilding('workshop',s[0],s[1],2,2,false,[P.shopWood,P.shopStone]);sites++;}
  }
  if(sites<maxSites&&res.stone>=P.upStone&&(!P.useTools||res.tools>=P.upTools)){
    const mk=S.buildings.filter(b=>b.type==='market'&&b.built);
    if(mk.length){
      let best=null,bd=1e9;
      for(const b of S.buildings){
        if(b.type!=='house'||!b.built||b.level>=2||b.site)continue;
        if(!mk.some(m=>Math.hypot(m.x-b.x,m.y-b.y)<=P.marketR))continue;
        const d=Math.hypot(b.x-h.x,b.y-h.y);if(d<bd){bd=d;best=b;}
      }
      if(best){best.site=mkSite(P.upWood,P.upStone,P.useTools?P.upTools:0);S.version++;sites++;}
    }
  }
  if(P.level3&&sites<maxSites&&S.variety&&res.tools>=P.up3Tools&&res.stone>=P.up3Stone){
    const ch=S.buildings.filter(b=>b.type==='chapel'&&b.built);
    if(ch.length){let best=null,bd=1e9;
      for(const b of S.buildings){if(b.type!=='house'||!b.built||b.level!==2||b.site)continue;if(!ch.some(m=>Math.hypot(m.x-b.x,m.y-b.y)<=P.chapelR))continue;const d=Math.hypot(b.x-h.x,b.y-h.y);if(d<bd){bd=d;best=b;}}
      if(best){best.site=mkSite(P.up3Wood,P.up3Stone,P.up3Tools);best.site.to=3;S.version++;}}
  }
}
function growHousing(hx,hy){
  // façon Foundation : l'habitat déborde d'une rangée autour des maisons existantes
  let best=[],n=0;
  for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=idx(x,y);
    if(S.zone[i]!==0||S.terrain[i]!==T_GRASS||S.tree[i]>0||S.occ[i]>=0)continue;
    let near=false;for(let dy=-2;dy<=2&&!near;dy++)for(let dx=-2;dx<=2;dx++){const j=idx(x+dx,y+dy);if(inb(x+dx,y+dy)&&S.zone[j]===Z.house){near=true;break;}}
    if(!near)continue;best.push([Math.hypot(x-hx,y-hy)+hash2(x,y,S.seed)*2,i]);}
  best.sort((a,b)=>a[0]-b[0]);
  for(const [,i] of best.slice(0,8)){S.zone[i]=Z.house;n++;}
  if(n){S.version++;S.stats.autoHouse=(S.stats.autoHouse||0)+n;}
}
function storePlanner(){
  if(!P.autoStore)return;
  if(S.buildings.some(b=>b.type==='store'&&!b.built))return;
  let bc=-1,bv=P.storeDemand;
  for(let c=0;c<demand.length;c++)if(demand[c]>bv){bv=demand[c];bc=c;}
  for(let c=0;c<demand.length;c++)demand[c]*=0.85;
  if(bc<0)return;
  const cw=Math.ceil(W/7),cx=(bc%cw)*7+3.5,cy=((bc/cw)|0)*7+3.5;
  const ok=i=>S.terrain[i]===T_GRASS&&S.zone[i]!==Z.field&&S.zone[i]!==Z.quarry&&S.zone[i]!==Z.pasture&&S.tree[i]<1;
  const s=findSpot(ok,cx,cy,7);
  if(s){addBuilding('store',s[0],s[1],2,2,false,[P.storeWood,P.storeStone]);demand[bc]=0;}
}
function computeInfo(){
  let f=0,ft=0,qs=0,hz=0,mz=0,wz=0,hf=0,fz=0,cz=0,pz=0,fw=0;const {zone,tree,terrain}=S;
  for(let i=0;i<N;i++){const z=zone[i];
    if(z===Z.field)f++;else if(z===Z.forest&&tree[i]>=1)ft++;else if(z===Z.quarry&&terrain[i]===T_STONE)qs++;else if(z===Z.house){hz++;if(S.occ[i]<0)hf++;}else if(z===Z.market)mz++;else if(z===Z.workshop)wz++;else if(z===Z.fishing)fz++;else if(z===Z.chapel)cz++;else if(z===Z.pasture)pz++;if(z===Z.field&&S.rest[i])fw++;}
  Object.assign(S.info,{fields:f,forestTrees:ft,quarryStone:qs,houseZone:hz,marketZone:mz,shopZone:wz,houseFree:hf,fishZone:fz,chapelZone:cz,pastureZone:pz,fallow:fw});
  const j={build:0,farm:0,wood:0,stone:0,craft:0,fish:0,herd:0,idle:0,kid:0,elder:0};for(const v of S.villagers)j[isKid(v)?'kid':isRetired(v)?'elder':v.job]=(j[isKid(v)?'kid':isRetired(v)?'elder':v.job]||0)+1;S.info.jobs=j;
}
function season(){return P.seasons?Math.floor(S.time/P.seasonLen)%4:1;}
function seasonProgress(){return P.seasons?(S.time%P.seasonLen)/P.seasonLen:0;}
function growMul(){const s=season();return s===0?1:s===1?1.25:s===2?0.9:P.winterGrow;}
function envUpdate(dt){
  const {tree,zone,terrain,occ,traffic,fstate,fgrow}=S;const gm=growMul(),sea=season();const fa=S.fishAmt,fr=dt/P.fishRegen*(season()===3?0.3:1);
  for(let i=0;i<N;i++){
    const t=tree[i];
    if(t>0&&t<1)tree[i]=Math.min(1,t+dt*gm/P.treeGrow);
    else if(t===0&&zone[i]===Z.forest&&terrain[i]===T_GRASS&&occ[i]<0&&traffic[i]<P.pathT&&R()<dt*P.treeRegrow)tree[i]=0.05;
    if(fa[i]<1&&terrain[i]===T_WATER)fa[i]=Math.min(1,fa[i]+fr);
    if(P.fert&&S.fert[i]<1){let f=S.fert[i];if(zone[i]!==Z.field){f+=dt/40;S.rest[i]=0;}else if(sea===3)f+=dt/P.fertWinter;else if(fstate[i]===0)f+=dt/P.fertRegen;
      S.fert[i]=f>=1?1:f;if(S.rest[i]&&f>=P.fallowOk)S.rest[i]=0;}
    if(fstate[i]){
      if(zone[i]!==Z.field||occ[i]>=0){fstate[i]=0;fgrow[i]=0;}
      else if(fstate[i]===1){fgrow[i]+=dt*gm/P.fieldGrow;if(fgrow[i]>=1){fgrow[i]=1;fstate[i]=2;}}
    }
  }
}
function reachSet(){
  if(S._reach&&S._reachT>S.time-20)return S._reach;
  const f=frontOf(S.hall),seen=new Uint8Array(N),q=[idx(f.x,f.y)];seen[q[0]]=1;
  while(q.length){const i=q.pop(),x=i%W,y=i/W|0;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(!inb(nx,ny))continue;const j=idx(nx,ny);if(seen[j]||S.terrain[j]===T_WATER)continue;seen[j]=1;q.push(j);}}
  S._reach=seen;S._reachT=S.time;return seen;
}
function edgeSpawn(){
  const ok=reachSet();
  for(let k=0;k<80;k++){
    const e=(R()*4)|0,r=(R()*W)|0;
    const x=e===0?0:e===1?W-1:r,y=e===2?0:e===3?H-1:r;
    if(ok[idx(x,y)])return [x+0.5,y+0.5];
  }
  const f=frontOf(S.hall);return [f.x+0.5,f.y+0.5];
}
function happinessTarget(){
  const pop=S.villagers.length,cap=capacity();
  let houses=0,cov=0,l2=0,cc=0;const mk=S.buildings.filter(b=>b.type==='market'&&b.built),ch=S.buildings.filter(b=>b.type==='chapel'&&b.built);
  for(const b of S.buildings){if(b.type!=='house'||!b.built)continue;houses++;if(b.level>=2)l2++;if(mk.some(m=>Math.hypot(m.x-b.x,m.y-b.y)<=P.marketR))cov++;if(ch.some(m=>Math.hypot(m.x-b.x,m.y-b.y)<=P.chapelR))cc++;}
  let t=45+(S.starving?-35:12)+(S.cold?-20:0)+(S.noTools?-12:0)+(S.festT>S.time?P.festBonus:0)+(S.festGlow>S.time?P.festBonus*0.4:0);
  if(houses)t+=25*cov/houses+12*l2/houses+P.chapelBonus*cc/houses;
  t+=P.varietyBonus*(S.varietyF||0);if(S.warm)t+=P.warmBonus;if(S.mourn>S.time)t-=4;for(const e of S.evH)if(e[0]>S.time)t+=e[1];
  if(pop>cap)t-=15;
  return clamp(t,0,100);
}
function festCheck(){if(!P.fest||!P.seasons)return;const sea=season();if(sea===S._lastSea)return;const prev=S._lastSea;S._lastSea=sea;
  if(prev===1&&sea===2){const pop=S.villagers.length,wf=pop*P.seasonLen/P.mealInterval*P.foodPerMeal*1.3;
    if(pop>=10&&S.res.food>=wf*P.festNeed&&S.res.wood>=pop*1.5){S.res.food-=pop*P.festFood;S.res.wood-=pop*0.5;S.festT=S.time+P.seasonLen*0.25;S.festGlow=S.time+P.seasonLen*1.5;S.stats.fests=(S.stats.fests||0)+1;
      emit('toast','🎉 Fête des moissons ! Les réserves sont pleines : le village fait la fête (😄 bonheur ↑)');emit('fest',{});}
    else if(pop>=10)emit('toast','🌾 Pas de fête des moissons cette année : il faudrait plus de réserves');}}
// ---- générations ----
function die(v){release(v);if(v.carry)deposit(v);const k=S.villagers.indexOf(v);if(k>=0)S.villagers.splice(k,1);S.stats.deaths++;S.dlog.push(S.time);S.mourn=S.time+40;S.graves=(S.graves||0)+1;
  emit('toast',`🕯️ ${v.name} s'est éteint${v.fem?'e':''} à ${Math.floor(v.age)} ans, entouré${v.fem?'e':''} des siens`);emit('death',{x:v.x,y:v.y});}
// vague des anciens (variante « vague ») : sur la dernière année, nettement plus de décès que de naissances
function vagueCheck(){const t0=S.time-P.seasonLen*4;while(S.dlog.length&&S.dlog[0]<t0)S.dlog.shift();while(S.blog.length&&S.blog[0]<t0)S.blog.shift();
  if(S.time<P.seasonLen)milestone('arr',S.arr==='etale'?'🧭 Des familles de tous âges s\'installent : enfants, adultes et anciens se relaieront':'🧭 Les colons sont jeunes : leur génération vieillira ensemble — pensez au renouveau');
  if(S.arr!=='vague'){S.vague=false;return;}const d=S.dlog.length,b=S.blog.length,pop=S.villagers.length;
  const on=d>=Math.max(6,pop*0.06)&&d>=b*2+4,off=d<Math.max(4,pop*0.05)||d<=b+2;
  if(!S.vague&&on){S.vague=true;S.vagueT0=S.time;milestone('vague','🕯️ Les anciens s\'éteignent : la génération des fondateurs passe. Il faut du renouveau — des familles heureuses et bien nourries auront des enfants, et les maisons libérées attireront de nouveaux venus');}
  else if(S.vague&&off)S.vague=false;}
function genUpdate(dt){
  if(!P.gens)return;const da=dt/P.seasonLen*P.ageRate;
  for(const v of S.villagers){const a0=v.age;v.age+=da;if(a0<P.adultAge&&v.age>=P.adultAge){emit('toast',`🧑 ${v.name} a ${P.adultAge} ans : un bras de plus au travail`);if(v.job==='kid'){v.plan.length=0;v.cur=null;}}
    if(a0<P.retireAge&&v.age>=P.retireAge){v.plan.length=0;v.cur=null;}}
  if((timers.death+=dt)>=10){timers.death=0;for(const v of S.villagers.slice())if(v.age>P.deathAge&&R()<(v.age-P.deathAge)*0.05*10/P.seasonLen)die(v);vagueCheck();}
  if((timers.birth+=dt)>=P.birthInterval){timers.birth=0;const pop=S.villagers.length,cap=capacity();
    if(pop<cap&&S.happy>=P.birthHappy&&!S.starving&&!S.cold&&S.res.food>=pop*3){let kids=0,fem=null,mal=0,nf=0;
      for(const v of S.villagers){if(isKid(v))kids++;else if(v.age<46){if(v.fem){fem=v;nf++;}else mal++;}}
      // birthScale (0 = règle actuelle, une tentative) : une tentative de plus par tranche de 1/birthScale femmes en âge d'avoir des enfants
      const tries=P.birthScale?1+Math.floor(Math.min(nf,mal)*P.birthScale):1;let nb=0;
      for(let k=0;k<tries&&S.villagers.length<cap;k++)if(fem&&mal&&kids+nb<pop*P.birthMaxKids&&R()<0.55){const hs=S.buildings.filter(b=>b.type==='house'&&b.built),b=hs.length?hs[(R()*hs.length)|0]:S.hall,f=frontOf(b);
        const nv=spawnVillager(f.x+0.5,f.y+0.5,{age:0,skin:fem.skin});nb++;S.stats.births++;S.blog.push(S.time);timers.immig=0;emit('toast',`👶 Naissance : ${nv.name} vient au monde`);emit('birth',{x:nv.x,y:nv.y});}}}
}
// ---- élevage ----
let nextSid=1;
function sheepCap(){return Math.min(P.sheepMax,Math.floor(zoneList(Z.pasture).length/P.sheepPer));}
function spawnSheep(x,y,age){const a={id:nextSid++,x,y,tx:x,ty:y,wool:age>=1?0.6:0,age,wait:R()*3,held:0,face:R()*6,moving:false};S.sheep.push(a);return a;}
function pastureTile(near,ax,ay){const L=zoneList(Z.pasture);if(!L.length)return -1;let best=-1;
  for(let k=0;k<8;k++){const i=L[(R()*L.length)|0];if(S.occ[i]>=0)continue;best=i;if(!near||Math.hypot(i%W+0.5-ax,(i/W|0)+0.5-ay)<3.5)break;}return best;}
function sheepUpdate(dt){
  if(!P.pasture)return;const L=zoneList(Z.pasture),sea=season();
  if(!S.sheep.length){if(L.length>=P.sheepPer*2&&(S._sheepWait=(S._sheepWait||0)+dt)>15){S._sheepWait=0;for(let k=0;k<2;k++){const i=pastureTile(false);if(i>=0)spawnSheep(i%W+0.5,(i/W|0)+0.5,2);}
      emit('toast','🐑 Un couple de moutons arrive au pâturage');}return;}
  if(!L.length){let n=0;for(const a of S.sheep){S.res.food+=4;n++;}S.sheep.length=0;emit('toast',`🐑 Sans pâturage, le troupeau est vendu (+${n*4} 🍞)`);return;}
  if((timers.sheep+=dt)>=P.sheepBreed){timers.sheep=0;if(sea<3&&S.sheep.length>=2&&S.sheep.length<sheepCap()){const m=S.sheep[(R()*S.sheep.length)|0];spawnSheep(m.x+(R()-0.5)*0.4,m.y+(R()-0.5)*0.4,0);emit('lamb',{});}}
  for(const a of S.sheep){a.age+=dt/P.seasonLen;if(sea!==3&&a.age>=1)a.wool=Math.min(1.5,a.wool+dt/P.woolGrow);
    if(a.held){a.moving=false;continue;}
    if(a.wait>0){a.wait-=dt;a.moving=false;continue;}
    const dx=a.tx-a.x,dy=a.ty-a.y,d=Math.hypot(dx,dy);
    if(d<0.05){const i=pastureTile(true,a.x,a.y);if(i>=0){a.tx=i%W+0.2+R()*0.6;a.ty=(i/W|0)+0.2+R()*0.6;}a.wait=2+R()*7;continue;}
    const sp=(d>4?1.2:0.35)*(a.age<1?1.3:1)*dt,k=Math.min(sp,d)/d;a.x+=dx*k;a.y+=dy*k;a.face=Math.atan2(dx,dy);a.moving=true;
    const ti=idx(clamp(a.x|0,0,W-1),clamp(a.y|0,0,H-1));if(S.zone[ti]!==Z.pasture&&d<1.5){a.tx=a.x;a.ty=a.y;}}
}
// ---- marchand ambulant ----
const DEALS=[[{food:12},{tools:2}],[{wood:15},{stone:5}],[{stone:6},{food:14}],[{wool:4},{tools:2}],[{clothes:2},{stone:8}],[{food:20},{sheep:2}],[{fish:10},{tools:1}],[{tools:2},{food:16}],[{wood:12},{wool:4}],[{food:15},{clothes:2}],[{stone:5},{tools:1}],[{wood:10},{food:10}]];

// ---- petits événements à décision (décision de Victor du 18/11) ----
// Au plus un par saison (tirage déterministe à la graine : ne consomme pas le hasard de la simulation), à partir de la 2e année.
// Deux choix chiffrés ; sans réponse avant la fin du délai, le choix par défaut (marqué) s'applique. Pertes en % plafonnées : toujours rattrapables.
const pct=(r,f,cap)=>{const n=Math.min(cap,Math.floor((S.res[r]||0)*f*P.evtScale));S.res[r]=Math.max(0,(S.res[r]||0)-n);return n;};
const pv=(r,f,cap)=>Math.min(cap,Math.floor((S.res[r]||0)*f*P.evtScale)),sur=r=>` (sur ${Math.round(S.res[r]||0)})`;
const fix=(r,n)=>{n=Math.min(S.res[r]||0,Math.round(n*P.evtScale));S.res[r]-=n;return n;};
const humeur=(v,saisons)=>{S.evH.push([S.time+P.seasonLen*saisons,Math.round(v*(v<0?P.evtScale:1))]);};
const growing=()=>{let n=0;for(const i of zoneList(Z.field))if(S.fstate[i]===1&&S.fgrow[i]>0.15)n++;return n;};
const EVTS={
  feu:{ic:'🔥',titre:'Le feu a pris dans la grange !',ok:sea=>sea<=2,txt:()=>'Une étincelle de la forge, et le grenier fume. Que fait le village ?',
    o:[{l:'Chaîne de seaux',d:()=>`−${pv('food',0.08,80)} 🍞${sur('food')} · 😓 bonheur −6 pendant ½ saison`,f:()=>{const n=pct('food',0.08,80);humeur(-6,0.5);return `Le feu est éteint : ${n} 🍞 perdus, les villageois sont épuisés`;}},
       {l:'Protéger les maisons',d:()=>`−${pv('food',0.2,180)} 🍞${sur('food')}`,f:()=>{const n=pct('food',0.2,180);return `La grange a brûlé : ${n} 🍞 perdus, aucune maison touchée`;}}],def:0},
  loups:{ic:'🐺',titre:'Des loups rôdent autour du troupeau',ok:sea=>sea>=2&&S.sheep.length>=3,txt:()=>`On les a vus à la lisière. ${S.sheep.length} moutons au pâturage.`,
    o:[{l:'Organiser une battue',d:()=>`−${Math.min(Math.round(S.res.wood||0),Math.round(10*P.evtScale))} 🪵 (torches, pieux)`,f:()=>{const n=fix('wood',10);return `Les loups sont repoussés dans la forêt (−${n} 🪵)`;}},
       {l:'Laisser faire',d:()=>`perdre ~${Math.max(1,Math.round(S.sheep.length*0.2*P.evtScale))} 🐑`,f:()=>{const k=Math.max(0,Math.min(S.sheep.length-1,Math.max(1,Math.round(S.sheep.length*0.2*P.evtScale))));if(!k)return 'Les loups sont repartis sans rien emporter';for(let q=0;q<k;q++)S.sheep.splice((S.sheep.length*hash2(S.seed|0,S.evtN|0,q+77))|0,1);return `Les loups ont emporté ${k} mouton${k>1?'s':''}`;}}],def:1},
  fievre:{ic:'🤒',titre:'Une fièvre court dans le village',ok:sea=>(sea===3||sea===0)&&S.villagers.length>=12,txt:()=>'Plusieurs familles toussent et gardent le lit.',
    o:[{l:'Remèdes de l’herboriste',d:()=>`−${pv('food',0.06,60)} 🍞 · −${Math.min(Math.round(S.res.wood||0),Math.round(8*P.evtScale))} 🪵`,f:()=>{const a=pct('food',0.06,60),b=fix('wood',8);return `Tisanes et bouillons : la fièvre recule (−${a} 🍞, −${b} 🪵)`;}},
       {l:'Laisser passer',d:()=>`😷 bonheur −10 pendant une saison`,f:()=>{humeur(-10,1);return 'La fièvre suit son cours : le village est morose pour la saison';}}],def:1},
  orage:{ic:'⛈️',titre:'Un orage de grêle menace les champs',ok:sea=>sea<=1&&growing()>=6,txt:()=>`${growing()} champs sont en pleine pousse.`,
    o:[{l:'Couvrir de claies',d:()=>`−${Math.min(Math.round(S.res.wood||0),Math.round(12*P.evtScale))} 🪵`,f:()=>{const n=fix('wood',12);return `Les claies ont tenu : les champs sont saufs (−${n} 🪵)`;}},
       {l:'Laisser passer',d:()=>`les champs perdent ~${Math.round(40*P.evtScale)} % de leur pousse`,f:()=>{let n=0;for(const i of zoneList(Z.field))if(S.fstate[i]===1){S.fgrow[i]*=1-0.4*P.evtScale;n++;}return `La grêle a couché les blés : ${n} champs reprennent leur pousse`;}}],def:1},
  pelerins:{ic:'🧺',titre:'Des pèlerins demandent l’hospitalité',ok:sea=>sea<=2&&S.villagers.length>=10,txt:()=>'Une petite troupe fatiguée frappe à la porte du hall.',
    o:[{l:'Les accueillir',d:()=>`−${pv('food',0.05,50)} 🍞${sur('food')} · 😊 bonheur +6 pendant une saison`,f:()=>{const n=pct('food',0.05,50);humeur(6,1);return `Les pèlerins repartent en chantant les louanges du village (−${n} 🍞)`;}},
       {l:'Les éconduire',d:()=>'rien ne change',f:()=>'Les pèlerins reprennent la route'}],def:1},
  gel:{ic:'🥶',titre:'Un gel terrible s’abat sur le hameau',ok:sea=>sea===3,txt:()=>'Le puits est pris et les murs se couvrent de givre.',
    o:[{l:'Brûler plus de bois',d:()=>`−${pv('wood',0.12,90)} 🪵${sur('wood')}`,f:()=>{const n=pct('wood',0.12,90);return `On garde les âtres allumés jour et nuit (−${n} 🪵)`;}},
       {l:'Se serrer autour du feu',d:()=>'🥶 bonheur −8 pendant ½ saison',f:()=>{humeur(-8,0.5);return 'On se serre sous les couvertures : le moral est bas';}}],def:1}
};
function evtUpdate(){
  if(S.evH.length&&S.evH[0][0]<=S.time)S.evH=S.evH.filter(e=>e[0]>S.time);
  if(S.evt){if(S.time>=S.evt.until)decide(S.evt.def,true);return;}
  if(!P.events||!P.seasons||!(P.evtRate>0))return;const si=Math.floor(S.time/P.seasonLen);
  if(si===S.evS||seasonProgress()<P.evtAt)return;S.evS=si;
  if(si<P.evtStart||S.villagers.length<P.evtMinPop||hash2(S.seed|0,si,4242)>=P.evtChance*P.evtRate)return;
  const sea=season(),R3=S.evRec||[],ok=Object.keys(EVTS).filter(k=>EVTS[k].ok(sea));let L=ok.filter(k=>!R3.includes(k));if(!L.length)L=ok.filter(k=>k!==S.evLast);if(!L.length)return;
  const k=L[(hash2(S.seed|0,si,4343)*L.length)|0],E=EVTS[k];S.evtN=(S.evtN||0)+1;
  S.evt={k,t0:S.time,until:S.time+P.seasonLen*P.evtWait,def:E.def,txt:E.txt()};emit('event',S.evt);
}
function evtView(){const e=S.evt;if(!e)return null;const E=EVTS[e.k];return {k:e.k,ic:E.ic,titre:E.titre,txt:e.txt,def:e.def,reste:Math.max(0,e.until-S.time),wait:P.seasonLen*P.evtWait,opts:E.o.map(o=>({l:o.l,d:o.d()}))};}
function decide(i,auto){const e=S.evt;if(!e)return false;const E=EVTS[e.k];if(!E||!E.o[i]){S.evt=null;return false;}
  const msg=E.o[i].f();S.evt=null;S.evLast=e.k;S.evRec=(S.evRec||[]).concat(e.k).slice(-3);S.stats.events=(S.stats.events||0)+1;if(auto)S.stats.evAuto=(S.stats.evAuto||0)+1;S.version++;
  emit('toast',`${E.ic} ${auto?'(sans décision) ':''}${msg}`);emit('eventDone',{k:e.k,i,auto:!!auto});return true;}
function merchantUpdate(){
  if(!P.merchant)return;const m=S.merchant;
  if(m&&S.time>m.until){S.merchant=null;emit('toast','🧳 Le marchand ambulant reprend la route');emit('merchantGone',{});}
  const sea=season();if(sea===S._lastSeaM)return;const first=S._lastSeaM==null;S._lastSeaM=sea;if(first||S.merchant)return;
  if(sea!==0&&sea!==2)return;const mk=S.buildings.find(b=>b.type==='market'&&b.built);if(!mk||S.villagers.length<8)return;
  const past=zoneList(Z.pasture).length>=P.sheepPer*2;const pool=DEALS.filter(d=>(past||!d[1].sheep)&&(P.pasture||!(d[0].wool||d[0].clothes||d[1].wool||d[1].clothes)));
  const deals=[];while(deals.length<3&&pool.length){const d=pool.splice((R()*pool.length)|0,1)[0];deals.push({give:{...d[0]},get:{...d[1]},stock:P.merchantStock});}
  S.merchant={until:S.time+P.seasonLen*0.7,deals,mk:mk.id};emit('toast','🧳 Un marchand ambulant s\'installe au marché : touche le marché pour échanger');emit('merchant',{});
}
function trade(k){const m=S.merchant;if(!m)return false;const d=m.deals[k];if(!d||d.stock<=0)return false;if(d.get.sheep&&zoneList(Z.pasture).length<P.sheepPer)return false;
  for(const r in d.give)if((S.res[r]||0)<d.give[r])return false;
  for(const r in d.give)S.res[r]-=d.give[r];
  for(const r in d.get){if(r==='sheep'){for(let q=0;q<d.get[r];q++){const i=pastureTile(false);if(i>=0)spawnSheep(i%W+0.5,(i/W|0)+0.5,1.2);}}else S.res[r]=(S.res[r]||0)+d.get[r];}
  d.stock--;S.stats.trades++;S.version++;return true;}
function step(dt){
  S.time+=dt;festCheck();genUpdate(dt);sheepUpdate(dt);
  for(const v of S.villagers)stepVillager(v,dt);
  if((timers.env+=dt)>=0.5){envUpdate(timers.env);timers.env=0;}
  if((timers.plan+=dt)>=1){timers.plan=0;planner();computeInfo();merchantUpdate();evtUpdate();}
  if((timers.store+=dt)>=10){timers.store=0;storePlanner();}
  if((timers.decay+=dt)>=1){timers.decay=0;const tr=S.traffic;for(let i=0;i<N;i++)if(tr[i]>0)tr[i]*=P.trafficDecay;}
  if(S.starving)S.stats.starveTime+=dt;
  if(S.cold)S.stats.coldTime+=dt;
  if((timers.trend+=dt)>=10){timers.trend=0;S.hist.push({t:S.time,fish:S.res.fish,wool:S.res.wool||0,clothes:S.res.clothes||0,food:S.res.food,wood:S.res.wood,stone:S.res.stone,tools:S.res.tools,pop:S.villagers.length,happy:S.happy});
    if(S.hist.length>200)S.hist.shift();
    const h=S.hist,a=h[Math.max(0,h.length-7)],b=h[h.length-1],dtm=(b.t-a.t)/60||1;
    for(const k of ['food','wood','stone','tools','fish','wool','clothes'])S.trend[k]=((b[k]||0)-(a[k]||0))/dtm;}
  if(P.useTools&&(timers.tool+=dt)>=P.toolInterval){
    timers.tool=0;let need=0;for(const b of S.buildings)if(b.type==='house'&&b.built&&b.level>=2)need++;
    if(need){S.res.tools-=need;if(S.res.tools<0){S.res.tools=0;if(!S.noTools)emit('toast','🔧 Les maisons en pierre manquent d\'outils');S.noTools=true;}else S.noTools=false;}else S.noTools=false;
  }
  if((timers.heat+=dt)>=P.heatInterval){
    timers.heat=0;let need=0;const wint=season()===3,hm=wint?(S.warm?2*P.warmHeat:2):1;if(P.pasture&&wint&&S.res.clothes>0)S.res.clothes=Math.max(0,S.res.clothes-S.villagers.length*P.clothUse);for(const b of S.buildings)if(b.built)need+=b.type==='house'?(b.level>=2?P.heatHouse2:P.heatHouse):b.type==='hall'?P.heatHall:0;
    need*=hm;S.res.wood-=need;
    if(S.res.wood<0){S.res.wood=0;if(!S.cold&&need)emit('toast','🥶 Plus de bois de chauffage : les maisons ont froid');S.cold=true;}else S.cold=false;
  }
  if((timers.meal+=dt)>=P.mealInterval){
    timers.meal=0;let eaters=0;for(const v of S.villagers)eaters+=isKid(v)?P.kidMeal:1;const need=eaters*P.foodPerMeal+(season()===3?S.sheep.length*P.sheepHay:0);S.warm=P.pasture&&S.villagers.length>0&&(S.res.clothes||0)>=S.villagers.length*0.12;
    const fromFish=Math.min(S.res.fish,need*(S.res.food>0?0.4:1));S.res.fish-=fromFish;S.res.food-=need-fromFish;
    S.varietyF=need?Math.min(1,fromFish/(need*0.15)):0;S.variety=S.varietyF>=0.6;
    if(S.res.food<0){S.res.food=0;if(!S.starving&&need)emit('toast','⚠️ Famine : il manque de nourriture !');S.starving=true;}else S.starving=false;
  }
  S.happy+=(happinessTarget()-S.happy)*Math.min(1,dt*0.08);
  const pop=S.villagers.length,cap=capacity();
  const immF=S.happy>70?1:S.happy>50?1.6:2.5;
  if((timers.immig+=dt)>=P.immigInterval*immF){
    timers.immig=0;
    const idleN=S.villagers.filter(v=>v.job==='idle').length;S.idleShare=pop?idleN/pop:0;
    if(pop<cap&&S.happy>P.immigHappy&&(P.winterImmig||season()!==3)&&S.res.food>=pop*P.immigFood&&(!P.autumnGate||season()!==2||S.res.food>=(pop+1)*P.seasonLen/P.mealInterval*P.foodPerMeal*P.autumnGate)&&(!P.immigTrend||S.trend.food>=0||S.res.food>=pop*4)&&(!P.jobsGate||pop<12||S.idleShare<P.maxIdle)){
      const [x,y]=edgeSpawn();const u=R(),v=spawnVillager(x,y,{age:S.arr==='etale'?(u<P.arrKid?3+u/P.arrKid*10:P.arrMin+(u-P.arrKid)/(1-P.arrKid)*(P.arrMax-P.arrMin)):16+u*22});const f=frontOf(S.hall);goTo(v,f.x,f.y);S.stats.arrivals++;
      const np=S.villagers.length;
      for(const m of [10,20,30,50,75,100,150])if(np>=m)milestone('pop'+m,`🎉 Le hameau compte ${m} habitants !`);
    }
  }
  if((timers.emig+=dt)>=10){
    timers.emig=0;
    if(S.happy<P.emigHappy&&S.villagers.length>0){let k=S.villagers.length-1;while(k>0&&isKid(S.villagers[k]))k--;const v=S.villagers[k];release(v);if(v.carry)deposit(v);S.villagers.splice(k,1);S.stats.departures++;emit('toast','😞 Un villageois mécontent quitte le hameau');}
  }
}
// ---- actions joueur ----
function cancelUnbuilt(i){const id=S.occ[i];if(id<0)return;const b=S.bmap.get(id);if(b&&!b.built&&b.type!=='hall')removeBuilding(b,true);}
function paint(z,tx,ty,brush){
  const r=(brush-1)>>1;let changed=false;
  for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
    if(brush>=5&&dx*dx+dy*dy>r*r+r*0.6)continue;
    const x=tx+dx,y=ty+dy;if(!inb(x,y))continue;const i=idx(x,y);
    if(S.zone[i]===z)continue;if(z===Z.fishing?S.terrain[i]!==T_WATER:(S.terrain[i]===T_WATER&&z!==Z.none))continue;
    if(S.zone[i]===Z.field){S.fstate[i]=0;S.fgrow[i]=0;}
    cancelUnbuilt(i);S.zone[i]=z;S.unreach[i]=0;changed=true;
  }
  if(changed)S.version++;
}
function demolish(x,y){
  if(!inb(x,y))return null;const id=S.occ[idx(x,y)];if(id<0)return null;const b=S.bmap.get(id);
  if(!b||b.type==='hall')return 'hall';
  removeBuilding(b,true);return 'ok';
}
function newGame(seed){
  alloc();S.seed=seed!=null?seed:(R()*1e9)|0;
  S.buildings=[];S.bmap=new Map();S.villagers=[];S.sheep=[];S.merchant=null;S._lastSeaM=null;S.evt=null;S.evH=[];S.evS=-1;S.evLast=null;S.evRec=[];S.evtN=0;S.mourn=0;S.graves=0;S.vague=false;S.dlog=[];S.blog=[];nextVid=1;nextBid=1;nextSid=1;S.milestones.clear();
  S.res={food:P.startFood,wood:0,stone:P.startStone,tools:0,fish:0,wool:0,clothes:0};S.time=0;S.happy=60;S.starving=false;
  for(const k in timers)timers[k]=0;demand.fill(0);
  for(const k in S.stats)S.stats[k]=0;S.hist=[];S.trend={food:0,wood:0,stone:0,tools:0,fish:0,wool:0,clothes:0};
  S.arr=P.arrivees==='graine'?(hash2(S.seed|0,17,9001)<0.5?'etale':'vague'):P.arrivees;
  genTerrain();
  const cx=W>>1,cy=H>>1;
  for(let y=cy-4;y<=cy+5;y++)for(let x=cx-4;x<=cx+4;x++){const i=idx(x,y);if(Math.hypot(x-cx,y-cy)<4.6){S.terrain[i]=T_GRASS;S.stoneAmt[i]=0;S.tree[i]=0;}}
  S.hall=addBuilding('hall',cx-1,cy-1,3,3,true);
  S.res.wood=P.startWood;
  const f=frontOf(S.hall);
  for(let k=0;k<6;k++)spawnVillager(f.x+0.5+(R()-0.5)*3,f.y+0.5+R()*1.5,{fem:k%2===0,age:S.arr==='etale'?18+R()*30:19+R()*17});
  computeInfo();S.version++;
}
function serialize(){
  const r2=a=>Array.from(a,x=>Math.round(x*100)/100);
  return {v:3,seed:S.seed,time:S.time,happy:S.happy,res:S.res,nextBid,starving:S.starving,ms:[...S.milestones],
    terrain:Array.from(S.terrain),tree:r2(S.tree),stone:Array.from(S.stoneAmt),zone:Array.from(S.zone),traffic:r2(S.traffic),fstate:Array.from(S.fstate),fgrow:r2(S.fgrow),
    b:S.buildings.map(b=>({id:b.id,type:b.type,x:b.x,y:b.y,w:b.w,h:b.h,built:b.built,level:b.level,site:b.site?{need:{...b.site.need},have:{...b.site.have},prog:b.site.prog,asg:0}:null})),
    vil:S.villagers.map(v=>[Math.round(v.x*10)/10,Math.round(v.y*10)/10,Math.round(v.age*100)/100,v.fem?1:0,v.name,v.skin]),sheep:S.sheep.map(a=>[Math.round(a.x*10)/10,Math.round(a.y*10)/10,Math.round(a.wool*100)/100,Math.round(a.age*100)/100]),merchant:S.merchant,fert:r2(S.fert),rest:Array.from(S.rest),mourn:S.mourn||0,graves:S.graves||0,arr:S.arr,vg:S.vague?1:0,vt:Math.round(S.vagueT0||0),dl:S.dlog.map(Math.round),bl:S.blog.map(Math.round),lastSeaM:S._lastSeaM,evt:S.evt,evH:S.evH,evS:S.evS,evL:S.evLast||null,evR:S.evRec||[],evN:S.evtN||0,hist:S.hist.slice(-180).map(h=>({t:Math.round(h.t),food:Math.round(h.food),wood:Math.round(h.wood),stone:Math.round(h.stone),tools:Math.round(h.tools),pop:h.pop,happy:Math.round(h.happy)}))};
}
function deserialize(d){
  if(!d)return false;if(d.v!==3)return false;
  alloc();S.seed=d.seed;S.time=d.time;S.happy=d.happy;S.res=d.res;nextBid=d.nextBid;S.starving=!!d.starving;
  S.milestones.clear();(d.ms||[]).forEach(m=>S.milestones.add(m));
  genTerrainElevOnly();
  S.terrain.set(d.terrain);S.tree.set(d.tree);S.stoneAmt.set(d.stone);S.zone.set(d.zone);S.traffic.set(d.traffic);S.fstate.set(d.fstate);S.fgrow.set(d.fgrow);
  S.buildings=[];S.bmap=new Map();S.hall=null;
  for(const b of d.b){S.buildings.push(b);S.bmap.set(b.id,b);for(let dy=0;dy<b.h;dy++)for(let dx=0;dx<b.w;dx++)S.occ[idx(b.x+dx,b.y+dy)]=b.id;if(b.type==='hall')S.hall=b;}
  if(!S.hall)return false;
  S.villagers=[];nextVid=1;for(const e of d.vil){if(e.length>2)spawnVillager(e[0],e[1],{age:e[2],fem:!!e[3],name:e[4],skin:e[5]});else spawnVillager(e[0],e[1]);}
  S.sheep=[];nextSid=1;for(const e of (d.sheep||[])){const a=spawnSheep(e[0],e[1],e[3]);a.wool=e[2];}S.merchant=d.merchant||null;S._lastSeaM=d.lastSeaM!=null?d.lastSeaM:null;S.mourn=d.mourn||0;S.graves=d.graves||0;S.arr=d.arr==='etale'?'etale':'vague';S.vague=!!d.vg&&S.arr==='vague';S.vagueT0=d.vt||0;S.dlog=(d.dl||[]).slice();S.blog=(d.bl||[]).slice();
  S.evt=d.evt&&EVTS[d.evt.k]?d.evt:null;S.evH=Array.isArray(d.evH)?d.evH.slice():[];S.evS=d.evS!=null?d.evS:Math.floor(d.time/P.seasonLen);S.evLast=d.evL||null;S.evRec=Array.isArray(d.evR)?d.evR.slice(-3):[];S.evtN=d.evN||0;
  if(d.fert)S.fert.set(d.fert);if(d.rest)S.rest.set(d.rest);if(S.res.wool==null)S.res.wool=0;if(S.res.clothes==null)S.res.clothes=0;
  if(S.res.fish==null)S.res.fish=0;S.hist=d.hist||[];computeInfo();S.version++;return true;
}
function genTerrainElevOnly(){for(let y=0;y<H;y++)for(let x=0;x<W;x++)S.elev[idx(x,y)]=fbm(x/12,y/12,S.seed+303);}

function nearOf(pred){const h=S.hall;let b=null,bd=1e9;for(let i=0;i<N;i++){if(!pred(i))continue;const d=Math.hypot(i%W-h.x,(i/W|0)-h.y);if(d<bd){bd=d;b=[i%W,i/W|0];}}return b;}
const nearTree=()=>nearOf(i=>S.zone[i]===0&&S.tree[i]>=1),nearStone=()=>nearOf(i=>S.zone[i]===0&&S.terrain[i]===T_STONE);
// variante « vague » : au début de la vague (un an), quand les anciens s'éteignent plus vite qu'il ne naît d'enfants, le conseil l'annonce (le code du conseil ne change pas : même action proposée)
function advice(){const a=advice0();if(!(P.gens&&S.arr==='vague'&&S.vague)||S.starving||S.cold)return a;
  if(a&&S.time-(S.vagueT0||0)>P.seasonLen*4)return a; // l'annonce accompagne les conseils pendant un an, ensuite seulement quand il n'y a rien d'autre à faire (et dans le panneau population)
  const d=S.dlog.length,b=S.blog.length,head='🕯️ Les anciens s\'éteignent, il faut du renouveau';
  if(!a)return {code:'gen',text:`🕯️ Les anciens s'éteignent (${d} décès, ${b} naissance${b>1?'s':''} cette année) : il faut du renouveau. Bonheur ≥ 55 et réserves pleines font naître des enfants ; les maisons libérées attirent de nouvelles familles`};
  return Object.assign({},a,{text:head+' — '+a.text});}
function advice0(){
  const pop=S.villagers.length,cap=capacity(),info=S.info,res=S.res;
  const l2=S.buildings.some(b=>b.type==='house'&&b.level>=2);
  if(S.starving)return {code:'field',text:'⚠️ Famine ! Agrandis les champs 🌾'};
  if(S.cold)return {code:'forest',text:'🥶 Plus de bois de chauffage : agrandis la Forêt 🌲'};
  if(info.fields===0)return {code:'field',text:'🌾 Peins une zone Champs pour nourrir le village'};
  if(info.houseZone===0&&!S.buildings.some(b=>b.type==='house'))return {code:'house',text:'🏠 Peins une zone Habitat près du hall'};
  if(info.forestTrees<6&&res.wood<60)return {code:'forest',at:nearTree(),text:'🌲 Peins une zone Forêt sur des arbres pour le bois'};
  const tr=S.trend,soon=(k)=>tr[k]<0&&res[k]/(-tr[k])<2.5;
  if(P.advTrend&&pop<cap&&pop>=8&&S.happy>P.immigHappy&&season()!==3&&res.food>=pop*P.immigFood&&P.immigTrend&&S.trend.food<0&&res.food<pop*4)return {code:'field',text:`📉 Les réserves de 🍞 baissent : les familles attendent qu'elles remontent pour venir — ajoute des champs`};
  if(pop<cap&&pop>=8&&S.happy>P.immigHappy&&season()!==3&&res.food<pop*P.immigFood)return {code:'field',text:`🧳 Des familles attendent d'avoir assez à manger pour venir (🍞 ${Math.round(res.food)}/${Math.round(pop*P.immigFood)}) : agrandis les champs`};
  const sea=season(),winterFood=pop*P.seasonLen/P.mealInterval*P.foodPerMeal;
  const centroid=z=>{let sx=0,sy=0,n=0;for(let i=0;i<N;i++)if(S.zone[i]===z){sx+=i%W;sy+=i/W|0;n++;}return n?[Math.round(sx/n),Math.round(sy/n)]:null;};
  if(P.seasons&&sea===2&&res.food<winterFood*0.8)return {code:'field',at:centroid(Z.field),text:`❄️ L'hiver approche : vise ~${Math.round(winterFood)} 🍞 en réserve (rien ne pousse en hiver)`};
  if(P.seasons&&sea===2&&res.wood<30+capacity()*1.2)return {code:'forest',at:centroid(Z.forest),text:'❄️ L\'hiver approche : le chauffage double, prévois du bois 🌲'};
  if(soon('food')&&S.hist.length>6)return {code:'field',text:`🌾 Nourriture en baisse (${Math.round(tr.food)}/min) : ajoute des champs`};
  if(soon('wood')&&S.hist.length>6)return {code:'forest',text:`🌲 Bois en baisse (${Math.round(tr.wood)}/min) : le chauffage va manquer, agrandis la Forêt`};
  if(res.food<pop*3&&info.fields<pop*1.1)return {code:'field',text:'🌾 Les réserves baissent : ajoute des champs'};
  if(!info.spot&&pop>=cap-2)return {code:'house',text:info.houseFree>=4?'🏠 Zone Habitat trop étroite : peins un bloc d\'au moins 3×3 libre':'🏠 Plus de place pour bâtir : agrandis l\'Habitat'};
  if(info.quarryStone===0&&pop>=6&&res.stone<20)return {code:'quarry',at:nearStone(),text:'⛏️ Peins une Carrière sur les rochers gris'};
  if(pop>=8&&info.marketZone===0&&!S.buildings.some(b=>b.type==='market'))return {code:'market',text:'🏪 Un Marché (2×2 min.) rendra les gens plus heureux'};
  if((l2||pop>=12)&&info.shopZone===0&&!S.buildings.some(b=>b.type==='workshop'))return {code:'workshop',text:'🔧 Peins un Atelier : les maisons en pierre ont besoin d\'outils'};
  if(P.seasons&&sea<=2&&S.hist.length>6){const tl=((3-sea)-seasonProgress())*P.seasonLen/60,proj=res.food+Math.min(tr.food,pop*2)*tl;
    if(proj<winterFood*1.25)return {code:'field',at:centroid(Z.field),text:`❄️ Prévision : ~${Math.max(0,Math.round(proj))} 🍞 à l'hiver pour ${Math.round(winterFood)} nécessaires — ajoute des champs`};}
  if(P.jobsGate&&pop>=12&&S.idleShare>=P.maxIdle&&pop<cap)return {code:'work',text:`💤 ${Math.round(S.idleShare*100)} % de villageois sans travail : les familles n'arrivent plus. Ouvre des zones de travail (champs, forêt, carrière, atelier)`};
  if(pop>=20){const mk=S.buildings.filter(b=>b.type==='market'&&b.built);let un=0,ux=0,uy=0,tot=0;
    for(const b of S.buildings){if(b.type!=='house'||!b.built)continue;tot++;if(!mk.some(m=>Math.hypot(m.x-b.x,m.y-b.y)<=P.marketR)){un++;ux+=b.x;uy+=b.y;}}
    if(tot&&un/tot>0.4&&!S.buildings.some(b=>b.type==='market'&&!b.built))return {code:'market',at:[Math.round(ux/un),Math.round(uy/un)],text:`🏪 ${un} maisons loin d'un marché : peins un Marché près d'elles`};}
  if(P.merchant&&S.merchant&&S.merchant.deals.some(d=>d.stock>0&&Object.keys(d.give).every(r=>(res[r]||0)>=d.give[r]))){const m=S.bmap.get(S.merchant.mk);if(m)return {code:'merchant',at:[m.x+1,m.y+1],text:'🧳 Le marchand est au marché : touche ici pour échanger'};}
  if(P.fishing&&pop>=15&&info.fishZone===0){const w=nearOf(i=>S.terrain[i]===T_WATER&&fishSpot(i)>=0);if(w)return {code:'fish',at:w,text:'🐟 Peins une zone Pêche sur l\'eau près du rivage : la variété des repas rend heureux'};}
  if(P.fishing&&pop>=25&&info.fishZone>0&&(S.varietyF||0)<0.6&&S.hist.length>8){const w=nearOf(i=>S.zone[i]===0&&S.terrain[i]===T_WATER&&fishSpot(i)>=0);if(w)return {code:'fish',at:w,text:`🐟 Repas peu variés (${Math.round((S.varietyF||0)*100)} %) : agrandis la zone Pêche`};}
  if(P.chapels&&S.buildings.filter(b=>b.type==='house'&&b.level>=2).length>=4&&info.chapelZone===0&&!S.buildings.some(b=>b.type==='chapel'))return {code:'chapel',text:'⛪ Peins une Chapelle (2×2) au cœur des maisons : bonheur + maisons de maître'};
  if(S.noTools)return {code:'workshop',text:'🔧 Manque d\'outils : agrandis l\'Atelier ou la Carrière'};
  if(P.fert&&info.fields>=10&&info.fallow>=info.fields*0.3)return {code:'field',at:centroid(Z.field),text:`🌾 ${Math.round(info.fallow/info.fields*100)} % des champs se reposent (terre épuisée) : ajoute des champs`};
  if(P.pasture&&pop>=16&&info.pastureZone===0)return {code:'pasture',text:'🐑 Peins un Pâturage (8 cases ou plus) : la laine devient des vêtements chauds à l\'atelier'};
  if(P.pasture&&S.sheep.length&&(res.wool||0)>=6&&!S.buildings.some(b=>b.type==='workshop'&&b.built))return {code:'workshop',text:'🧶 La laine s\'entasse : un Atelier en ferait des vêtements chauds'};
  return null;
}
Object.assign(S,{decide,evtView,trade,sheepCap,isKid,isElder,isRetired,fishSpot,season,seasonProgress,growMul,advice,newGame,step,paint,demolish,capacity,serialize,deserialize,frontOf,computeInfo,happinessTarget});
return S;
}
return {create,DEFAULTS,W,H,Z};
})();
if(typeof module!=='undefined')module.exports=Sim;
