const { JSDOM } = require('jsdom'); const fs = require('fs');
const html=fs.readFileSync('/home/claude/president/index.html','utf8');const bot=fs.readFileSync(__dirname+'/bot.js','utf8');
for(const [real,st] of [['SM Caen','depensier'],['SM Caen','prudent'],['Nîmes Olympique','depensier'],['Nîmes Olympique','equilibre'],['GOAL FC','equilibre'],['RC Lens','equilibre']]){
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/'});const w=dom.window;w.scrollTo=()=>{};const errs=[];w.addEventListener('error',e=>errs.push(e.message));
w.eval(bot);w.eval(`BOT.strat='${st}';BOT.x={club:{},player:{},inj:0,reds:0,coachReq:0,resign:0,promise:0,youthGain:[],ages:[],offers:0,newsTypes:{}};UI.setup.diff=1;A.realPick(${JSON.stringify(real)});A.create();`);
let s=0;try{while(s++<4000){if(w.eval('S.over'))break;if(w.eval('BOT.stats.seasons.length')>=5)break;if(w.eval('UI.modalOpen')){w.eval('BOT.handleModal()');w.eval('if(!UI.modalOpen)nextQueue()');continue;}w.eval('BOT.weekly()');w.eval('A.play()');}}catch(e){console.log('EXC',e.message);}
console.log(real,st,'over',w.eval('S.over&&S.over.t'),errs.slice(0,2));
w.eval('BOT.stats.seasons').forEach(x=>console.log(' ',x.y,['R2','R1','N2','N1','L3','L2','L1'][x.div],x.pos+'e',x.out,'str',x.str,'lg',x.lg,'cash',Math.round(x.cash/1e5)/10+'M','inc',Math.round(x.inc/1e5)/10+'M','exp',Math.round(x.exp/1e5)/10+'M','conf',x.conf));}
