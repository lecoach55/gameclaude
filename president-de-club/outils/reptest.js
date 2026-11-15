const { JSDOM } = require('jsdom'); const fs = require('fs');
const html=fs.readFileSync('/home/claude/president/index.html','utf8');
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/'});const w=dom.window;w.scrollTo=()=>{};
w.eval(`UI.setup.diff=1;A.create();var GD=0;`);
const notes={},goals={};let n=0;
for(let i=0;i<300;i++){const r=w.eval(`(()=>{S.players.forEach(p=>{p.fit=100;p.inj=0;p.susp=0;p.morale=65;});coachDecide(null);const st=strength();const o=S.teams.filter(t=>!t.user).sort((a,b)=>Math.abs(a.rating-strength().ovr)-Math.abs(b.rating-strength().ovr))[0];const d=userMatch(true,o,st);GD+=d.gf-d.ga;return JSON.stringify({l:d.lineup.map(x=>[x.role,x.note,x.g]),m:d.motm&&d.motm.role+' '+d.motm.why,t:d.tac,ev:d.ev.map(e=>e.k+':'+e.n)})})()`);
 const d=JSON.parse(r);d.l.forEach(([r,no,g])=>{(notes[r]=notes[r]||[]).push(no);goals[r]=(goals[r]||0)+g;});if(i<3)console.log(d.m,'|',d.t,'\n  ',d.ev.join(' / '));n++;}
for(const r in notes)console.log(r,'note moy',(notes[r].reduce((a,b)=>a+b,0)/notes[r].length).toFixed(2),'buts',goals[r]);
console.log('GD moy',w.eval('GD/300'));
