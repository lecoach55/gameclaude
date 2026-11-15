const D=require(require('path').resolve(process.env.JEU||'.','engine.js')),S=require(require('path').resolve(process.env.JEU||'.','sim.js'));
const by={};const N=+process.argv[2]||400;
for(let i=0;i<N;i++){const s=D.createGame(123000+i*7919);let cur=null;
 while(!s.over){const m0=s.mission&&s.mission.k;D.playTurn(s,...S.heuristicAction(s));
  for(const f of (s.flashes||[])) if(f.type==='mission'){by[f.k]=by[f.k]||[0,0];by[f.k][f.won?0:1]++;}
  s.flashes=[];if(s.event&&!s.over)D.resolveEvent(s,S.bestChoice(s));}}
for(const [k,[w,l]] of Object.entries(by))console.log(k.padEnd(10),'réussis',(w/(w+l)*100).toFixed(0)+'%','sur',w+l);
