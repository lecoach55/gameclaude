// Joueur automatique + banc de mesure
const Sim=require('./sim.js');
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

function bot(S,opt){
  const {W,H,idx,inb,Z}=S;const h=S.hall,hx=h.x+1.5,hy=h.y+1.5;
  const pop=S.villagers.length;
  // petits événements : le joueur attentif choisit selon ses réserves (les autres profils laissent le choix par défaut)
  if(S.evt&&S.decide){const r=S.res,k=S.evt.k,ch={feu:0,loups:r.wood>=40?0:1,fievre:r.food>=pop*8&&r.wood>=30?0:1,orage:r.wood>=35?0:1,pelerins:r.food>=pop*10?0:1,gel:r.wood>=60?0:1}[k];if(ch!=null)S.decide(ch);}
  const free=i=>S.zone[i]===0&&S.terrain[i]===S.T_GRASS&&S.occ[i]<0;
  function nearestFree(cx,cy,pred,minD=0){let b=-1,bd=1e9;for(let i=0;i<S.N;i++){if(!pred(i))continue;const x=i%W,y=i/W|0;const d=Math.hypot(x+0.5-cx,y+0.5-cy);if(d<minD)continue;if(d<bd){bd=d;b=i;}}return b;}
  function paintAround(z,i,br){const r=(br-1)>>1,x0=i%W,y0=i/W|0;for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const x=x0+dx,y=y0+dy;if(inb(x,y)&&S.zone[idx(x,y)]===0)S.paint(z,x,y,1);}}
  // habitat
  let houseFree=0;for(let i=0;i<S.N;i++)if(S.zone[i]===Z.house&&S.occ[i]<0)houseFree++;
  if(!S.info.spot||houseFree<12){const i=nearestFree(hx,hy,j=>free(j)&&S.tree[j]===0,2.5);if(i>=0)paintAround(Z.house,i,3);}
  // champs
  const hungry=S.res.food<pop*2;
  if(S.info.fields<Math.ceil(pop*opt.fieldPerPop)+4||(hungry&&S.info.fields<pop*1.6)){
    let cx=hx+opt.fieldDir[0]*8,cy=hy+opt.fieldDir[1]*8;
    const i=nearestFree(cx,cy,j=>free(j)&&S.tree[j]===0);if(i>=0)paintAround(Z.field,i,3);
  }
  // forêt
  if(S.info.forestTrees<Math.max(12,pop*0.6)){const i=nearestFree(hx,hy,j=>S.zone[j]===0&&S.tree[j]>=1);if(i>=0)paintAround(Z.forest,i,5);}
  // carrière
  if(S.info.quarryStone<4){const i=nearestFree(hx,hy,j=>S.zone[j]===0&&S.terrain[j]===S.T_STONE);if(i>=0)paintAround(Z.quarry,i,3);}
  // atelier
  const shops=S.buildings.filter(b=>b.type==='workshop').length;
  if(opt.shops!==false&&pop>=10&&shops<1+Math.floor(pop/25)&&S.info.shopZone<4*(1+Math.floor(pop/25))){
    const i=nearestFree(hx,hy,j=>free(j)&&S.tree[j]===0,5);if(i>=0)paintAround(Z.workshop,i,3);
  }
  // pêche + chapelle
  if(opt.fish!==false&&pop>=15&&S.info.fishZone<Math.max(6,pop/8)){const i=nearestFree(hx,hy,j=>S.zone[j]===0&&S.terrain[j]===S.T_WATER&&S.fishSpot(j)>=0);if(i>=0)paintAround(Z.fishing,i,3);}
  if(opt.chapel!==false&&S.buildings.filter(b=>b.type==='house'&&b.level>=2).length>=4&&S.info.chapelZone<4&&!S.buildings.some(b=>b.type==='chapel')){const i=nearestFree(hx,hy,j=>free(j)&&S.tree[j]===0,4);if(i>=0)paintAround(Z.chapel,i,3);}
  // pâturage
  if(opt.pasture!==false&&pop>=16&&S.info.pastureZone<Math.min(36,8+pop/4)){const c=S.info.pastureZone?(()=>{let sx=0,sy=0,n=0;for(let i=0;i<S.N;i++)if(S.zone[i]===Z.pasture){sx+=i%W;sy+=i/W|0;n++;}return [sx/n,sy/n];})():[hx-opt.fieldDir[0]*10,hy-opt.fieldDir[1]*10];
    const i=nearestFree(c[0],c[1],j=>free(j)&&S.tree[j]===0,S.info.pastureZone?0:6);if(i>=0)paintAround(Z.pasture,i,3);}
  // marchand : n'échange que des surplus
  if(opt.trade!==false&&S.merchant){const need={food:pop*10+30,wood:40+pop*2,stone:20,tools:8,fish:pop*2,wool:4,clothes:pop*0.3};
    S.merchant.deals.forEach((d,k)=>{if(d.stock>0&&Object.keys(d.give).every(r=>(S.res[r]||0)-d.give[r]>=need[r]))S.trade(k);});}
  // marché
  const mk=S.buildings.filter(b=>b.type==='market').length;
  if(pop>=6&&S.info.marketZone<4*(1+Math.floor(pop/14))&&mk<1+Math.floor(pop/14)){
    const i=nearestFree(hx,hy,j=>free(j)&&S.tree[j]===0,4);if(i>=0)paintAround(Z.market,i,3);
  }
}

function novice(S,opt){
  const a=S.advice();if(!a)return;
  const {W,idx,inb,Z}=S;const h=S.hall,hx=h.x+1.5,hy=h.y+1.5;
  const free=i=>S.zone[i]===0&&S.terrain[i]===S.T_GRASS&&S.occ[i]<0;
  function nearestFree(cx,cy,pred,minD=0){let b=-1,bd=1e9;for(let i=0;i<S.N;i++){if(!pred(i))continue;const x=i%W,y=i/W|0;const d=Math.hypot(x+0.5-cx,y+0.5-cy);if(d<minD)continue;if(d<bd){bd=d;b=i;}}return b;}
  const paint=(z,i,br)=>{if(i>=0)S.paint(z,i%W,i/W|0,br);};
  // centre de gravité de la zone existante pour peindre « à côté »
  const near=(z)=>{let sx=0,sy=0,n=0;for(let i=0;i<S.N;i++)if(S.zone[i]===z){sx+=i%W;sy+=i/W|0;n++;}return n?[sx/n,sy/n]:null;};
  opt.actions=(opt.actions||0)+1;
  switch(a.code){
    case 'field':{const c=near(Z.field)||[hx,hy+7];paint(Z.field,nearestFree(c[0],c[1],j=>free(j)&&S.tree[j]===0),3);break;}
    case 'house':{paint(Z.house,nearestFree(hx,hy,j=>free(j)&&S.tree[j]===0,3),3);break;}
    case 'forest':{paint(Z.forest,nearestFree(hx,hy,j=>S.zone[j]===0&&S.tree[j]>=1),5);break;}
    case 'quarry':{paint(Z.quarry,nearestFree(hx,hy,j=>S.zone[j]===0&&S.terrain[j]===S.T_STONE),3);break;}
    case 'market':{const c=a.at||[hx,hy];paint(Z.market,nearestFree(c[0],c[1],j=>free(j)&&S.tree[j]===0,a.at?0:4),3);break;}
    case 'work':{const opts=[Z.field,Z.forest,Z.workshop];const z=opts[(opt.actions||0)%3];
      if(z===Z.field){const c=near(Z.field)||[hx,hy+7];paint(Z.field,nearestFree(c[0],c[1],j=>free(j)&&S.tree[j]===0),3);}
      else if(z===Z.forest)paint(Z.forest,nearestFree(hx,hy,j=>S.zone[j]===0&&S.tree[j]>=1),5);
      else paint(Z.workshop,nearestFree(hx,hy,j=>free(j)&&S.tree[j]===0,5),3);break;}
    case 'fish':{const c=a.at;paint(Z.fishing,c?idx(c[0],c[1]):-1,3);break;}
    case 'chapel':{const c=near(Z.house)||[hx,hy];paint(Z.chapel,nearestFree(c[0],c[1],j=>free(j)&&S.tree[j]===0),3);break;}
    case 'workshop':{paint(Z.workshop,nearestFree(hx,hy,j=>free(j)&&S.tree[j]===0,5),3);break;}
    case 'pasture':{const c=near(Z.pasture)||[hx-8,hy-6];for(let q=0;q<3;q++)paint(Z.pasture,nearestFree(c[0],c[1],j=>free(j)&&S.tree[j]===0,near(Z.pasture)?0:5),3);break;}
    case 'merchant':break;
  }
  opt.log&&opt.log.push(Math.round(S.time)+':'+a.code);
}
function run(params,seed,days,opt){
  opt=Object.assign({fieldPerPop:0.8,fieldDir:[0,1],botEvery:8},opt||{});
  const S=Sim.create(params,mulberry(seed*7+1));S.newGame(seed);
  const DAY=48,dt=0.05;const rows=[];let bt=0;
  for(let d=1;d<=days;d++){
    for(let t=0;t<DAY;t+=dt){S.step(dt);bt+=dt;if(bt>=opt.botEvery){bt=0;(opt.novice?novice:bot)(S,opt);}}
    const st=S.stats,tot=st.idleTime+st.workTime+st.walkTime||1;
    rows.push({day:d,pop:S.villagers.length,cap:S.capacity(),food:Math.round(S.res.food),wood:Math.round(S.res.wood),stone:Math.round(S.res.stone),tools:Math.round(S.res.tools||0),
      happy:Math.round(S.happy),idle:+(st.idleTime/tot).toFixed(2),walk:+(st.walkTime/tot).toFixed(2),haul:+(st.haulDist/(st.hauls||1)).toFixed(1),
      starve:Math.round(st.starveTime),notool:S.noTools?1:0,cold:Math.round(st.coldTime),stores:S.buildings.filter(b=>b.type==='store'&&b.built).length,
      houses:S.buildings.filter(b=>b.type==='house'&&b.built).length,l3:S.buildings.filter(b=>b.level>=3).length,fish:Math.round(S.res.fish||0),variety:+(S.varietyF||0).toFixed(2),lvl2:S.buildings.filter(b=>b.level>=2).length,jobs:{...S.info.jobs},sheep:S.sheep.length,wool:Math.round(S.res.wool||0),clothes:Math.round(S.res.clothes||0),births:st.births,deaths:st.deaths,trades:st.trades,fallow:S.info.fallow||0,fields:S.info.fields});
    for(const k of ['idleTime','workTime','walkTime','haulDist','hauls'])st[k]=0;
  }
  rows.opt=opt;return rows;
}
module.exports={run,bot,novice};
if(require.main===module){
  const days=+process.argv[2]||20;const params=process.argv[3]?JSON.parse(process.argv[3]):{};
  for(const seed of [1,2,3]){
    const t0=Date.now();const rows=run(params,seed,days);
    console.log(`--- seed ${seed} (${Date.now()-t0}ms)`);
    for(const r of rows)if(r.day%2===0||r.day<=3)console.log(JSON.stringify(r));
  }
}
