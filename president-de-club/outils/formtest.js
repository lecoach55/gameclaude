const { JSDOM } = require('jsdom'); const fs = require('fs');
const html=fs.readFileSync('/home/claude/president/index.html','utf8');
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/'});const w=dom.window;w.scrollTo=()=>{};
w.eval(`UI.setup.diff=1;A.create();`);
console.log(w.eval(`JSON.stringify(bestFormation().map(x=>x.f+':'+x.v.toFixed(2)))`), w.eval('S.staff.coach&&S.staff.coach.form'));
console.log(w.eval(`(()=>{coachDecide(null);const st=strength();return S.tactic.formation+' | '+st.xi.map(e=>e.role+':'+e.p.role+(e.pen?'!':'')).join(' ')+' | str '+st.ovr.toFixed(1)+' | '+S.tactic.why})()`));
