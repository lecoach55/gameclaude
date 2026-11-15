const Sim=require(process.env.SIMF||require('path').join(__dirname,'../../jeu/sim.js'));const {bot}=require(require('path').join(__dirname,'bot_fix.js'));
function mul(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const seed=+process.argv[2]||7002,days=+process.argv[3]||35;const S=Sim.create({},mul(seed*7+1));S.newGame(seed);const R=mul(seed*13+7);let bt=0;
const t0=Date.now();let tl=0;
for(let d=1;d<=days;d++){const td=Date.now();for(let t=0;t<48;t+=0.05){S.step(0.05);if((bt+=0.05)>=8){bt=0;bot(S,{fieldPerPop:0.8,fieldDir:[0,1]},R);}}if(d>days-5)tl+=Date.now()-td;}
console.log('pop',S.villagers.length,'total ms',Date.now()-t0,'ms/jour (5 derniers)',(tl/5).toFixed(0),'food',Math.round(S.res.food),'pathFails',S.stats.pathFails);
