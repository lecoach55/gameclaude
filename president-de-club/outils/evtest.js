const { JSDOM } = require('jsdom'); const fs = require('fs');
const html=fs.readFileSync('/home/claude/president/index.html','utf8');
let bad=0,n=0;
for(const div of [0,3,5,6]){
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/'});const w=dom.window;w.scrollTo=()=>{};
w.eval(`UI.setup.diff=1;document.getElementById('cTown').value='Lens';A.create();S.div=${div};S.sasp=${div>=3};Object.assign(S.infra,{stade:3,eclairage:1,commerce:1});setupSeason();S.week=10;S.gw=10;S.players.forEach(p=>p.joinGw=5);`);
const keys=w.eval('Object.keys(EVENTS)');
for(const k of keys){const r=w.eval(`(()=>{try{const e=EVENTS[${JSON.stringify(k)}];const okc=!e.cond||e.cond();const d=e.make?e.make():{};if(!d)return 'null';const tt=typeof e.title==='function'?e.title(d):e.title;e.text(d);const chs=typeof e.ch==='function'?e.ch(d):e.ch;const res=[];chs.forEach((c,i)=>{const snap=JSON.stringify(S);res.push(String(c.f(JSON.parse(JSON.stringify(d)))).slice(0,30));S=JSON.parse(snap);});return 'ok';}catch(err){return 'ERR '+err.message;}})()`);n++;if(r.startsWith('ERR')){bad++;console.log(div,k,r);}}
}
console.log('tested',n,'errors',bad);
