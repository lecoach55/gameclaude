const { JSDOM } = require('jsdom'); const fs = require('fs');
const html=fs.readFileSync('/home/claude/president/index.html','utf8');
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/'});const w=dom.window;w.scrollTo=()=>{};
w.eval(`UI.setup.diff=1;A.create();var AS={};`);
w.eval(`for(let i=0;i<400;i++){S.players.forEach(p=>{p.fit=100;p.inj=0;p.susp=0;});const st=strength();const d=userMatch(true,S.teams[1+(i%11)],st);d.lineup.forEach(l=>{AS[l.role]=(AS[l.role]||0)+l.a;});}`);
console.log(w.eval('JSON.stringify(AS)'));
console.log(w.eval('wPick.toString().slice(0,300)'));
