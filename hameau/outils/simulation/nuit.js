// Banc de nuit : nombreuses parties, plusieurs profils de joueurs, détecteurs d'anomalies, recherche de paramètres
const Sim=require(process.env.SIMP||require('path').join(__dirname,'../../jeu/sim.js'));const {bot,novice}=require(require('path').join(__dirname,'bot_fix.js'));const fs=require('fs');
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const args=Object.fromEntries(process.argv.slice(2).map(a=>a.replace(/^--/,'').split('=')).map(([k,v])=>[k,v===undefined?true:isNaN(+v)?v:+v]));
const batch=args.batch||1,minutes=args.minutes||8,out=args.out||require('path').join(process.env.SORTIE||require('path').join(__dirname,'../../mesures'),'results.jsonl');
const DAY=48;
// ---- profils de joueurs ----
function lazy(S,o){o.k=(o.k||0)+1;if(o.k%4===0)novice(S,o);}            // agit 4× moins souvent
function greedy(S,o){const a=S.advice();if(!a)return;novice(S,o);novice(S,o);}   // sur-réagit
function chaotic(S,o,R){const Z=S.Z,zs=[Z.house,Z.field,Z.forest,Z.quarry,Z.market,Z.workshop,Z.fishing,Z.chapel];
  if(R()<0.6)novice(S,o);else{const h=S.hall;S.paint(zs[(R()*zs.length)|0],h.x+((R()-0.5)*30|0),h.y+((R()-0.5)*30|0),[1,3,5,7][(R()*4)|0]);}}
const PROFILES={expert:{fn:bot,every:8},novice:{fn:novice,every:15},lazy:{fn:lazy,every:15},greedy:{fn:greedy,every:15},chaotic:{fn:chaotic,every:12}};
// ---- une partie instrumentée ----
function play(params,seed,days,prof){
  const R=mulberry(seed*13+7),S=Sim.create(params,mulberry(seed*7+1));S.newGame(seed);
  const P=PROFILES[prof],opt={fieldPerPop:0.8,fieldDir:[0,1]};let bt=0;
  const rows=[],anomalies=[],siteSeen=new Map();let peak=0,t0=Date.now(),stall=0,lastPop=0,overflow={};
  for(let d=1;d<=days;d++){const td=Date.now();
    for(let t=0;t<DAY;t+=0.05){S.step(0.05);if((bt+=0.05)>=P.every){bt=0;P.fn(S,opt,R);}}
    const ms=Date.now()-td,pop=S.villagers.length,cap=S.capacity();peak=Math.max(peak,pop);
    const adv=S.advice();
    for(const b of S.buildings)if(b.site){const k=b.id+':'+b.level;const s=siteSeen.get(k);if(!s)siteSeen.set(k,{d,p:0});else if(d-s.d>=4&&!s.flag){s.flag=1;anomalies.push({d,type:'chantier_bloqué',what:b.type,need:b.site.need,have:b.site.have,res:{...S.res}});}}
    if(pop<=lastPop&&pop<cap&&S.season()!==3)stall++;else stall=0;
    if(stall===6)anomalies.push({d,type:'stagnation',pop,cap,happy:Math.round(S.happy),advice:adv&&adv.code});
    if(pop<peak*0.8&&!anomalies.some(a=>a.type==='effondrement'))anomalies.push({d,type:'effondrement',pop,peak,starving:S.starving,cold:S.cold});
    if((S.starving||S.cold)&&!adv)anomalies.push({d,type:'crise_sans_conseil',starving:S.starving,cold:S.cold});
    for(const k of ['food','wood','stone','tools','fish'])if(S.res[k]>1500&&!overflow[k]){overflow[k]=1;anomalies.push({d,type:'stock_inutile',res:k,val:Math.round(S.res[k])});}
    if(pop<cap-8&&!adv&&S.happy>40&&S.season()!==3)anomalies.push({d,type:'blocage_inexpliqué',pop,cap,happy:Math.round(S.happy)});
    lastPop=pop;
    rows.push({d,pop,cap,happy:Math.round(S.happy),food:Math.round(S.res.food),wood:Math.round(S.res.wood),stone:Math.round(S.res.stone),tools:Math.round(S.res.tools||0),fish:Math.round(S.res.fish||0),
      jobs:{...S.info.jobs},sea:S.season(),ms,var:+(S.varietyF||0).toFixed(2),l2:S.buildings.filter(b=>b.level>=2).length,l3:S.buildings.filter(b=>b.level>=3).length,adv:adv&&adv.code});
  }
  const st=S.stats,tot=st.idleTime+st.workTime+st.walkTime||1;
  return {seed,prof,days,params,final:rows[rows.length-1],peak,starveDays:+(st.starveTime/DAY).toFixed(2),coldDays:+(st.coldTime/DAY).toFixed(2),
    idle:+(st.idleTime/tot).toFixed(3),walk:+(st.walkTime/tot).toFixed(3),haul:+(st.haulDist/(st.hauls||1)).toFixed(2),pathFailRate:+(st.pathFails/(st.pathCalls||1)).toFixed(4),
    departures:st.departures,msPerDay:Math.round(rows.reduce((a,r)=>a+r.ms,0)/rows.length),msLastDay:rows[rows.length-1].ms,anomalies:anomalies.slice(0,40),
    series:rows.filter(r=>r.d%5===0).map(r=>[r.d,r.pop,r.cap,r.happy,r.food,r.wood,r.var,r.l2,r.l3,r.ms]),wall:Date.now()-t0};
}
const score=r=>r.final.pop-12*r.starveDays-10*r.coldDays-3*r.departures-(r.anomalies.filter(a=>a.type==='effondrement').length?40:0);
// ---- espaces de recherche ----
const SPACE={harvestYield:[5,6,7],fieldGrow:[20,25,30],mealInterval:[9,10,12],heatInterval:[15,20,25],chopWood:[2,3,4],treeRegrow:[0.015,0.02,0.03],
  immigInterval:[4,5,7],winterGrow:[0.2,0.3,0.45],fishYield:[4,5,6],fishRegen:[30,40,55],storeDist:[8,10,12],plantPrio:[1.6,2.2,3],houseCap:[4,5],marketR:[8,9,11]};
function randParams(R,base){const p={...base};for(const [k,v] of Object.entries(SPACE))if(R()<0.35)p[k]=v[(R()*v.length)|0];return p;}
function log(o){fs.appendFileSync(out,JSON.stringify(o)+'\n');}
// ---- programme des vagues ----
if(args.test){console.log(JSON.stringify(play({},1001,3,"expert").final));process.exit(0);}
const end=Date.now()+minutes*60000;const R=mulberry(batch*1000+Date.now()%1000);let n=0;
const best=(()=>{try{return JSON.parse(fs.readFileSync(require('path').join(process.env.SORTIE||require('path').join(__dirname,'../../mesures'),'best.json'),'utf8'));}catch(_){return {params:{},score:-1e9};}})();
while(Date.now()<end){
  const seed=batch*1000+n+1;let job;
  if(batch===1)job={params:{},days:50,prof:Object.keys(PROFILES)[n%5]};
  else if(batch===2)job={params:{},days:100,prof:n%2?'novice':'expert'};
  else if(batch===3||batch===4)job={params:randParams(R,batch===4?best.params:{}),days:40,prof:'novice',search:true};
  else if(batch===5)job={params:{immigInterval:3},days:80,prof:'expert'};
  else if(batch===6)job={params:{},days:50,prof:n%2?'chaotic':'lazy'};
  else job={params:n%2?best.params:{},days:45,prof:['novice','expert','lazy'][n%3],tag:n%2?'meilleurs':'actuels'};
  const r=play(job.params,seed,job.days,job.prof);r.batch=batch;r.tag=job.tag||null;r.score=score(r);
  if(job.search){// on évalue aussi un 2e seed pour limiter le hasard
    const r2=play(job.params,seed+500,job.days,'novice');r.score=(r.score+score(r2))/2;r.score2=score(r2);
    if(r.score>best.score){best.params=job.params;best.score=r.score;fs.writeFileSync(require('path').join(process.env.SORTIE||require('path').join(__dirname,'../../mesures'),'best.json'),JSON.stringify(best));}}
  log(r);n++;
  console.log(`v${batch} #${n} ${job.prof} graine ${seed} ${job.days}j → pop ${r.final.pop} pic ${r.peak} famine ${r.starveDays}j froid ${r.coldDays}j oisifs ${r.idle} ms/j ${r.msPerDay} anomalies ${r.anomalies.length} score ${r.score.toFixed(0)} (${(r.wall/1000).toFixed(0)}s)`);
}
