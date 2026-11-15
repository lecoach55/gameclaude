const { JSDOM } = require('jsdom'); const fs = require('fs');
const html=fs.readFileSync('/home/claude/president/index.html','utf8');
let tot=[0,0,0,0,0,0,0,0];
for(let g=0;g<20;g++){
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/'});const w=dom.window;w.scrollTo=()=>{};
w.eval(`UI.setup.diff=1;A.create();`);
for(let y=0;y<8;y++){tot[y]+=w.eval(`S.sponsorAnnual/S.spPot`);w.eval(`S.year++;setupSeason();`);}
}
console.log(tot.map(x=>(x/20).toFixed(3)).join(' '));
