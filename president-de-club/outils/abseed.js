// A/B des matchs à graine fixe : mêmes tirages → résultats identiques si la logique des matchs n'a pas changé
const { JSDOM } = require('jsdom'); const fs = require('fs');
for(const f of process.argv.slice(2)){ for(const seed of [1,2,3]){
const html=fs.readFileSync(f,'utf8');
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/',beforeParse(w){let a=seed*2654435761>>>0;w.Math.random=()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}});const w=dom.window;w.scrollTo=()=>{};
w.eval(`UI.setup.diff=1;document.getElementById('cTown').value='Clichy';A.create();var GD=0,W=0;`);
w.eval(`for(let i=0;i<3000;i++){S.players.forEach(p=>{p.fit=100;p.inj=0;p.susp=0;p.morale=65;});const st=strength();const o=S.teams[1+(i%11)];const d=userMatch(i%2==0,o,st);GD+=d.gf-d.ga;W+=d.res==='V'?1:0;}`);
console.log(f.split('/').pop(),seed,w.eval('(GD/3000).toFixed(3)+" win "+(W/3000).toFixed(3)'));
}}
process.exit(0);
