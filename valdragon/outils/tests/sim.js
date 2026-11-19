// Simulation headless du jeu tour par tour. usage: node sim.js seed0 n out.json
const fs=require('fs');new Function(fs.readFileSync(__dirname+'/core.js','utf8'))();const VD=globalThis.VD;
if(process.env.BAL)Object.assign(VD.BAL,JSON.parse(process.env.BAL));
const[,,S0='1',N='10',OUT='out.json',FMAX='16',BMAX='160']=process.argv;
const MIST=+(process.env.MIST||.08);
const VARS=process.env.VARS||'r';let SEED=0;const ORD=process.env.ORD?process.env.ORD.split(','):null;// ORD=frappe,soin,tir : ordre des talents du bot
const VARK=process.env.VARK?process.env.VARK.split(','):null;
function mkStats(){const s={floors:{},cur:null,battles:[],wipesL:[],use:{},dealt:{},kos:0,items:[0,0,0,0]};
 s.floorStart=f=>{if(!s.floors[f])s.floors[f]={f,att:0,wipes:0,battles:0,rounds:0,kos:0,lvl:VD.P.lvl,pots:0,gold:VD.P.gold,minhp:1};s.floors[f].att++;s.cur=s.floors[f];};
 s.battleStart=B=>{s.b={f:VD.F,boss:B.boss,n:B.foes.length,elite:!!B.pack.elite,rounds:0,kos:0,minhp:1};};
 s.dmg=(u,v)=>{};s.hit=(src,v)=>{if(src.side==='h')s.dealt[src.cls]=(s.dealt[src.cls]||0)+v;};
 s.useC={};s.use=k=>{s.useC[k]=(s.useC[k]||0)+1;if(k==='soin'&&s.cur)s.cur.pots++;};
 s.ko=u=>{s.kos++;s.cur.kos++;if(s.b)s.b.kos++;};s.wipe=B=>{s.cur.wipes++;s.wipesL.push({f:VD.F,boss:B.boss,elite:!!B.pack.elite,by:B.foes.filter(f=>!f.dead).map(f=>f.k).join('+'),round:B.round,lvl:VD.P.lvl});};
 s.boss=()=>{};s.item=it=>{s.items[it.rar]++;};return s;}
const alive=a=>a.filter(u=>!u.dead);
function bestT(foes){const ch=foes.filter(f=>f.charge);if(ch.length)return ch[0];const sh=foes.filter(f=>f.k==='ch');if(sh.length)return sh[0];return foes.slice().sort((a,b)=>a.hp-b.hp)[0];}
function choose(h){const B=VD.B,P=VD.P,foes=alive(B.foes),hs=alive(P.heroes),fi=f=>B.foes.indexOf(f),hi=x=>P.heroes.indexOf(x);
 const can=k=>VD.canUse(h,k);const low=hs.slice().sort((a,b)=>a.hp/a.s.mhp-b.hp/b.s.mhp)[0],lr=low.hp/low.s.mhp;
 const bigAoe=foes.some(f=>f.intent&&f.intent.aoe&&f.charge&&f.intent.m>1);const boss=foes.find(f=>f.boss);
 if(Math.random()<MIST){const ks=VD.skillsOf(h).filter(can);const k=ks[Math.floor(Math.random()*ks.length)];const s=VD.SK[k];return[k,s.tg==='ally'?hi(low):fi(foes[Math.floor(Math.random()*foes.length)])];}
 const dead=P.heroes.find(x=>x.dead);if(dead&&P.pot.phenix>0&&(B.boss||hs.length<=1))return['item:phenix',hi(dead)];
 if(h.cls==='mage'&&lr<.45&&can('soin'))return['soin',hi(low)];
 if(lr<.3&&P.pot.soin>0)return['item:soin',hi(low)];
 if(h.en<10&&P.pot.elixir>0&&B.boss&&h.cls==='mage')return['item:elixir',hi(h)];
 const t=bestT(foes);
 if(h.cls==='guerrier'){if(bigAoe&&can('rempart'))return['rempart'];if(boss&&!h.st.taunt&&can('provoc')&&Math.random()<.5)return['provoc'];
  if(foes.length>=3&&can('fendoir'))return['fendoir'];const ex=foes.find(f=>f.hp/f.mhp<.3);if(can('execution')&&(ex||boss))return['execution',fi(ex||boss)];return['frappe',fi(t)];}
 if(h.cls==='mage'){const ch=foes.find(f=>f.charge&&!f.boss);if(ch&&can('givre'))return['givre',fi(ch)];if(bigAoe&&can('barriere'))return['barriere',hi(low)];
  if(foes.length>=3&&can('feu'))return['feu'];if(lr<.65&&can('soin')&&h.en>45)return['soin',hi(low)];if(can('meteore')&&foes.length>=2)return['meteore'];
  if(boss&&can('givre'))return['givre',fi(boss)];if(foes.length>=2&&can('feu')&&h.en>40)return['feu'];return['trait',fi(t)];}
 if(boss&&!boss.st.mark&&can('marque'))return['marque',fi(boss)];if(foes.length>=3&&can('volee'))return['volee'];
 if(can('fatal'))return['fatal',fi(boss||foes.slice().sort((a,b)=>b.hp-a.hp)[0])];const big=foes.find(f=>f.hp/f.mhp>.6&&!f.st.poison);if(big&&can('poison'))return['poison',fi(big)];return['tir',fi(t)];}
function manage(){const P=VD.P;
 for(const h of P.heroes)for(const it of P.bag.slice())if(VD.canEquip(h,it)&&VD.power(it)>VD.power(h.eq[it.s])*1.03)VD.equip(h,it);
 // un bijou peut aller à n'importe qui : déjà géré ; vendre le reste
 P.bag.slice().forEach(it=>VD.sell(it));
 while(P.pot.soin<4&&VD.buy('soin'));if(P.pot.phenix<1)VD.buy('phenix');if(P.pot.elixir<1)VD.buy('elixir');
 let g=0;while(P.gold>VD.prices().gamble*1.5&&g<3){const h=P.heroes[g%3];const slots=['arme','armure','bijou'].sort((a,b)=>VD.power(h.eq[a])-VD.power(h.eq[b]));const it=VD.gamble(slots[0],h.cls);if(!it)break;if(VD.canEquip(h,it)&&VD.power(it)>VD.power(h.eq[it.s]))VD.equip(h,it);g++;}if(!process.env.NOUP){let n=0;while(n<6){let best=null;P.heroes.forEach(h=>['arme','armure','bijou'].forEach(sl=>{const it=h.eq[sl];if(it&&(it.up||0)<VD.UPMAX){const c=VD.upCost(it);if(!best||c<best.c)best={h,sl,c};}}));if(!best||P.gold<best.c+VD.prices().soin*3)break;VD.upgrade(best.h,best.sl);n++;}}
 P.bag.slice().forEach(it=>VD.sell(it));
 const order=ORD?ORD.map(k=>[VD.SK[k].c,k]):[['guerrier','fendoir'],['mage','feu'],['rodeuse','volee'],['mage','soin'],['guerrier','frappe'],['rodeuse','tir']];let i=0;
 while(P.heroes.some(h=>h.spts>0)&&i<80){const[c,k]=order[i%order.length];VD.talent(P.heroes.find(h=>h.cls===c),k);i++;}
 // variantes (rang 3) : VARS=none (aucune, comme avant), a, b, r (une sur deux selon la graine, défaut)
 if(VD.varDue&&VARS!=='none')for(const h of P.heroes)for(const k of VD.varDue(h)){if(VARK&&!VARK.includes(k))continue;let w=VARS;if(w!=='a'&&w!=='b'){let x=SEED*31;for(const ch of k)x=(x*33+ch.charCodeAt(0))>>>0;w=(x>>>3)%2?'a':'b';}VD.chooseVar(h,k,w);}
 VD.calcAll();}
function battle(){const B=VD.B;let n=0;while(!B.over&&n<2000){n++;if(B.wait==='hero'){const[k,ti]=choose(B.cur);if(!VD.heroAct(k,ti||0)){VD.heroAct(B.cur.cls==='guerrier'?'frappe':B.cur.cls==='mage'?'trait':'tir',VD.B.foes.indexOf(alive(VD.B.foes)[0]));}}
 else if(B.wait==='foe')VD.foeTurn();else break;
 const hs=VD.P.heroes;const m=Math.min(...hs.map(h=>h.dead?0:h.hp/h.s.mhp));if(VD.stats.b)VD.stats.b.minhp=Math.min(VD.stats.b.minhp,m);}
 const st=VD.stats;st.b.rounds=B.round;st.b.res=B.over;st.battles.push(st.b);if(st.cur){st.cur.battles++;st.cur.rounds+=B.round;}return B.over;}
function play(seed){SEED=seed;Math.random=(function(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}})(seed*7919+13);
 VD.stats=mkStats();const st=VD.stats;VD.newGame(null,seed);let nb=0,wall=null;
 while(VD.F<=+FMAX&&nb<+BMAX){manage();let wiped=false;
  const targets=[...VD.obj.filter(o=>o.t!=='brk'),...VD.E.filter(e=>!e.boss)].sort(()=>Math.random()-.5);const boss=VD.E.find(e=>e.boss);if(boss)targets.push(boss);
  for(const t of targets){if(t.pack&&!VD.E.includes(t))continue;if(!t.pack&&(t.used||!VD.obj.includes(t)))continue;VD.P.x=t.x;VD.P.y=t.y+(t.boss?1:0);
   let k=0;while(!VD.B&&k<5){VD.step(.016,{});k++;}VD.ev.length=0;
   if(VD.B){nb++;const r=battle();VD.ev.length=0;if(r==='lose'){VD.closeBattle();wiped=true;break;}VD.closeBattle();manage();}}
  if(wiped){if(st.cur.wipes>=6){wall=VD.F;break;}continue;}
  if(VD.bossAlive)continue;VD.descend();}
 const P=VD.P;return{seed,best:P.best,lvl:P.lvl,hl:P.heroes.map(h=>h.lvl),wipes:P.wipes,wins:P.wins,nb,wall,kos:st.kos,gold:P.gold,use:st.useC,dealt:st.dealt,items:st.items,
  eq:P.heroes.map(h=>Object.values(h.eq).map(i=>i?i.rar:-1)),floors:Object.values(st.floors).map(f=>({f:f.f,att:f.att,w:f.wipes,b:f.battles,r:f.rounds,ko:f.kos,lvl:f.lvl,pots:f.pots})),
  battles:st.battles.map(b=>({f:b.f,boss:b.boss,n:b.n,e:b.elite,r:b.rounds,ko:b.kos,mh:+b.minhp.toFixed(2),res:b.res})),wl:st.wipesL};}
const res=[];const t0=Date.now();for(let i=0;i<+N;i++){res.push(play(+S0+i));if(i%100===0)process.stderr.write(i+' '+((Date.now()-t0)/1000).toFixed(0)+'s\n');}
fs.writeFileSync(OUT,JSON.stringify(res));
