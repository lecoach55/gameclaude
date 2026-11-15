const { JSDOM } = require('jsdom'); const fs = require('fs');
const html=fs.readFileSync('/home/claude/president/index.html','utf8');
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/'});const w=dom.window;w.scrollTo=()=>{};
const errs=[];w.addEventListener('error',e=>errs.push(e.message));
w.eval(`UI.setup.diff=1;A.create();S.cash+=1e6;S.staff.recruteur={name:'R',lvl:3,salary:300,age:40};`);
for(let s=0;s<2;s++){
 w.eval(`UI.multiRun=true;UI.multiLog=[];let g=0;while(!S.seasonOver&&g<60){UI.queue=[];UI.modalOpen=false;A.play();g++;}UI.queue=[];UI.modalOpen=false;UI.multiRun=false;showSeasonEnd();`);
 console.log(w.eval(`document.querySelector('.bxgrid').textContent+' || '+[...document.querySelectorAll('#mbox .alert.g')].map(a=>a.textContent).join(' | ')`));
 w.eval(`A.newSeason();UI.queue=[];UI.modalOpen=false;document.getElementById('modal').classList.add('hidden');`);
}
console.log(w.eval('JSON.stringify(S.records)'));
console.log('errs',errs.slice(0,3));
