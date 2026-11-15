const { JSDOM } = require('jsdom'); const fs = require('fs');
const html=fs.readFileSync('/home/claude/president/index.html','utf8');
for(const club of ['Nîmes Olympique','Stade briochin','US Créteil-Lusitanos','GOAL FC']){
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/'});const w=dom.window;w.scrollTo=()=>{};
w.eval(`UI.setup.diff=1;A.realPick(${JSON.stringify(club)});A.create();`);
console.log(w.eval(`S.club.name+' | '+LV[S.div].n+' | groupe '+n1Group()+' | cash '+S.cash+' | str '+strength().ovr.toFixed(1)+' | fans '+S.fans+' | stade '+cap()+' | '+S.statut+' | rival '+S.rivalName+' | terr '+S.terr.n+' '+S.terr.reg`));
console.log('  ',w.eval(`S.teams.filter(t=>!t.user).map(t=>t.name+(t.real?'':'*')).join(', ')`));
}
// club créé qui monte en N1 : simuler en forçant la division
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/'});const w=dom.window;w.scrollTo=()=>{};
w.eval(`UI.setup.diff=1;UI.setup.town='Toulouse';A.create();S.div=3;newSeason&&0;`);
console.log(w.eval(`typeof startSeason+' '+typeof newSeason+' '+typeof setupSeason`));
