const { JSDOM } = require('jsdom'); const fs = require('fs');
for(const f of ['v28','index']){
const html=fs.readFileSync('/home/claude/president/'+f+'.html','utf8');
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/'});const w=dom.window;w.scrollTo=()=>{};
w.eval(`UI.setup.diff=1;A.create();var GD=0,W=0,mor=0;`);
w.eval(`for(let i=0;i<3000;i++){S.players.forEach(p=>{p.fit=100;p.inj=0;p.susp=0;p.morale=65;});const st=strength();const o=S.teams[1+(i%11)];const d=userMatch(i%2==0,o,st);GD+=d.gf-d.ga;W+=d.res==='V'?1:0;}`);
console.log(f,w.eval('(GD/3000).toFixed(3)+" win "+(W/3000).toFixed(3)'));
}
