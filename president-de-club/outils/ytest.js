const { JSDOM } = require('jsdom'); const fs = require('fs');
const html=fs.readFileSync('/home/claude/president/index.html','utf8');
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/'});const w=dom.window;w.scrollTo=()=>{};
const errs=[];w.addEventListener('error',e=>errs.push(e.message));
w.eval(`UI.setup.diff=1;A.create();S.cash+=1e6;S.staff.formateur={name:'Jean Forme',lvl:2,salary:300,age:50};`);
for(let s=0;s<4;s++){
  w.eval(`UI.multiRun=true;UI.multiLog=[];let g=0;while(!S.seasonOver&&g<60){UI.queue=[];UI.modalOpen=false;A.play();g++;}UI.queue=[];UI.modalOpen=false;`);
  w.eval(`S.endSum=computeSeasonEnd();UI.multiRun=false;A.newSeason();`);
  console.log(w.eval(`'queue: '+JSON.stringify(UI.queue.map(q=>q.type))+' modal '+UI.modalOpen+' | '+document.getElementById('mbox').textContent.slice(0,120)`));
  // ouvrir l'intake s'il est en file
  w.eval(`for(let k=0;k<10&&UI.modalOpen;k++){const t=document.getElementById('mbox').textContent;if(/Promotion des U18/.test(t)){console.log('INTAKE', t.slice(0,600));A.yIntakeOk();}else closeModal();}`);
  console.log(w.eval(`S.news.slice(0,6).map(n=>n.t).filter(t=>/formation|aspirant|professionnel|conservé/.test(t)).join(' || ')`));
  console.log(w.eval(`S.players.filter(p=>p.yst).map(p=>p.age+'a '+p.yst+' c'+p.contract).join(', ')`));
}
w.eval(`UI.tab='effectif';render();`);console.log('card',w.eval(`document.body.textContent.includes('Centre de formation et jeunes')`));
console.log('errs',errs.slice(0,3));
