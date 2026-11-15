const { JSDOM } = require('jsdom'); const fs = require('fs');
const html=fs.readFileSync('/home/claude/president/index.html','utf8');
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/'});const w=dom.window;w.scrollTo=()=>{};
const errs=[];w.addEventListener('error',e=>errs.push(e.message));
w.eval(`UI.setup.diff=1;A.create();S.cash+=3e6;`);
for(let s=0;s<3;s++){
  w.eval(`UI.multiRun=true;UI.multiLog=[];let g=0;while(!S.seasonOver&&g<60){UI.queue=[];UI.modalOpen=false;A.play();g++;}UI.queue=[];UI.modalOpen=false;`);
  console.log(w.eval(`'Saison '+seasonLabel(S.year)+' '+LV[S.div].n+' : '+standings().map((t,i)=>(i+1)+'.'+t.name+(t.user?'*':'')).join(' | ')`));
  w.eval(`S.endSum=computeSeasonEnd();UI.multiRun=true;try{A.newSeason();}catch(e){console.log('ERR',e.message)}UI.queue=[];UI.modalOpen=false;`);
  console.log(w.eval(`'  -> '+LV[S.div].n+' : '+S.teams.filter(t=>!t.user).map(t=>t.name+'['+(t.tag||t.last||'')+' '+t.rating.toFixed(1)+']').join(', ')`));
}
console.log('errs',errs.slice(0,3));
w.eval(`UI.multiRun=false;UI.tab='accueil';render();`);
console.log(w.eval(`(()=>{const nx=nextFixture();return nx.opp.name+' :: '+h2hLine(nx.opp).replace(/<[^>]+>/g,'')})()`));
console.log(w.eval(`Object.keys(S.h2h).length+' clubs dans l historique'`));
