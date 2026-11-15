const { JSDOM } = require('jsdom'); const fs = require('fs');
const bot = fs.readFileSync(__dirname+'/bot.js','utf8');
function mk(file){const dom=new JSDOM(fs.readFileSync(file,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/'});const w=dom.window;w.scrollTo=()=>{};w.errs=[];w.addEventListener('error',e=>w.errs.push(e.message));w.eval(bot);return w;}
function run(w,weeks){let s=0;while(s++<3000){if(w.eval('S.over'))break;if(w.eval('S.gw')>=weeks)break;if(w.eval('UI.modalOpen')){w.eval('BOT.handleModal()');w.eval('if(!UI.modalOpen)nextQueue()');continue;}w.eval('BOT.weekly()');w.eval('A.play()');}}
const a=mk('/home/claude/president/v13.html');
a.eval(`BOT.strat='equilibre';BOT.x={club:{},player:{},inj:0,reds:0,coachReq:0,resign:0,promise:0,youthGain:[],ages:[],offers:0,newsTypes:{}};UI.setup.diff=1;document.getElementById('cTown').value='Clichy';A.create();`);
run(a,40);const save=a.eval('JSON.stringify(S)');console.log('v13 gw',a.eval('S.gw'),'div',a.eval('S.div'),'errs',a.errs.length);
const b=mk('/home/claude/president/index.html');
b.eval(`localStorage.setItem('president-club-save-v1',${JSON.stringify(save)});boot({});BOT.strat='equilibre';BOT.x={club:{},player:{},inj:0,reds:0,coachReq:0,resign:0,promise:0,youthGain:[],ages:[],offers:0,newsTypes:{}};`);
try{run(b,140);}catch(e){console.log('EXC',e.message);}
console.log('v14 gw',b.eval('S.gw'),'div',b.eval('S.div'),'over',b.eval('S.over&&S.over.t'),'errs',b.errs.slice(0,5));
for(const t of ['accueil','calendrier','classement','stats','effectif','mercato','staff','infra','finances','coupe','club']){try{b.eval(`UI.tab='${t}';render()`);}catch(e){console.log('render',t,e.message);}}
console.log('render ok');
