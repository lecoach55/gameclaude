// Calibrage de la Charte (lecture seule) : jour où chaque titre est atteint, par profil et graine.
// usage : node charte_sim.js [jours=90] [graines=1,2,3] [profils=expert,novice,lazy]
const path=require('path');const J=path.join(__dirname,'../../jeu');
const Sim=require(J+'/sim.js');const {bot,novice}=require(path.join(__dirname,'bot_fix.js'));const C=require(J+'/charte.js');
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const days=+(process.argv[2]||90),seeds=(process.argv[3]||'1,2,3').split(',').map(Number),profs=(process.argv[4]||'expert,novice,lazy').split(',');
const PF={expert:[bot,8],novice:[novice,15],lazy:[(S,o)=>{o.k=(o.k||0)+1;if(o.k%4===0)novice(S,o);},15]};
for(const prof of profs)for(const seed of seeds){const S=Sim.create({},mulberry(seed*7+1));S.newGame(seed);const R=mulberry(seed*13+7);const [fn,every]=PF[prof];let bt=0,rang=0;const opt={fieldPerPop:0.8,fieldDir:[0,1]};const jours=[];
  for(let d=1;d<=days;d++){for(let t=0;t<48;t+=0.05){S.step(0.05);if((bt+=0.05)>=every){bt=0;fn(S,opt,R);}}
    const r=C.charteRang(S);if(r>rang){for(let k=rang+1;k<=r;k++)jours[k]=d;rang=r;}}
  console.log(JSON.stringify({prof,seed,village:jours[1]||null,bourg:jours[2]||null,ville_franche:jours[3]||null,final:C.charteMesures(S)}));}
