const { JSDOM } = require('jsdom'); const fs = require('fs');
const html=fs.readFileSync('/home/claude/president/index.html','utf8');
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/'});const w=dom.window;w.scrollTo=()=>{};
w.eval(`UI.setup.diff=1;UI.setup.town='Clichy';A.create();`);
console.log(w.eval(`'pot '+S.spPot+' annual '+S.sponsorAnnual+' small '+spSmallShare().toFixed(2)+' '+JSON.stringify(S.spons)`));
console.log(w.eval(`(()=>{S.spons.maillot=null;spApply();const a=S.sponsorAnnual;A.spProspect('maillot');const t=document.getElementById('mbox').textContent.slice(0,500);return a+' | '+t})()`));
console.log(w.eval(`(()=>{const o=S.spOff.list[0];A.spOk(o.id);return S.sponsorAnnual+' '+JSON.stringify(S.spons.maillot)})()`));
console.log(w.eval(`(()=>{UI.tab='finances';render();return document.body.textContent.includes('Partenariats')})()`));
// saison suivante
console.log(w.eval(`(()=>{S.year++;setupSeason();return S.sponsorAnnual+' '+JSON.stringify(Object.fromEntries(Object.entries(S.spons).map(([k,c])=>[k,c&&c.b+' q'+c.q+' u'+c.until])))})()`));
console.log(w.eval(`S.news.slice(0,5).map(n=>n.t).join('\\n')`));
console.log(w.eval(`JSON.stringify(staffAdvice().map(a=>a.key))`));
