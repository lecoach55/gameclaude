const { JSDOM } = require('jsdom'); const fs = require('fs');
const html=fs.readFileSync('/home/claude/president/index.html','utf8');
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/'});const w=dom.window;w.scrollTo=()=>{};
w.onerror=(e)=>console.log('ERR',e);
w.eval(`UI.setup.diff=1;A.create();S.cash+=2e6;S.staff.recruteur={name:'Jean Test',lvl:3,salary:500,age:40};`);
for(const k of ['poste','jeunes','libres','exp','region','inf','etranger','adv']){
  const r=w.eval(`(()=>{S.mission=null;S.gw=10;const ok=misStart('${k}','LAT',false);S.gw=S.mission?S.mission.end:10;UI.queue=[];misEnd();const ps=S.misRep.ids.map(id=>S.market.find(p=>p.id===id));return ok+' '+S.misRep.l+' -> '+ps.map(p=>p.role+' '+p.age+'a '+p.ovr+'/'+p.pot+' '+p.club+' '+(p.fee||0)+'€').join(' | ')+(S.misRep.txt?' TXT '+S.misRep.txt:'')+' Q:'+UI.queue.length})()`);
  console.log(r);
}
console.log(w.eval(`(()=>{A.misReport();const t=document.getElementById('mbox').textContent.slice(0,300);closeModal();return t})()`));
console.log(w.eval(`(()=>{S.mission=null;S.misLast=0;S.gw=20;const c=misAutoPick();return JSON.stringify(c)})()`));
console.log(w.eval(`(()=>{UI.tab='mercato';render();return document.body.innerHTML.includes('Cellule de recrutement')})()`));
// jouer 15 journées avec mission auto
w.eval(`UI.multiRun=true;UI.multiLog=[];S.misAuto=true;S.gw=0;S.misLast=0;`);
for(let i=0;i<15;i++){w.eval(`UI.queue=[];UI.modalOpen=false;A.play();UI.queue=[];`);}
console.log(w.eval(`JSON.stringify(S.misHist)`));
console.log(w.eval(`S.news.filter(n=>/mission|Rapport de/.test(n.t)).slice(0,6).map(n=>n.t).join('\\n')`));
