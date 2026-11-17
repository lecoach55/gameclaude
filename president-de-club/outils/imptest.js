// Test : import d'un code de sauvegarde ancien (champs récents retirés) puis tous les onglets + journées
const { JSDOM } = require('jsdom'); const fs = require('fs');
const file = process.argv[2]||__dirname+'/../jeu/index.html'; const bot = fs.readFileSync(__dirname+'/bot.js','utf8');
const dom = new JSDOM(fs.readFileSync(file,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/'});
const w = dom.window; w.scrollTo=()=>{}; const errs=[]; w.addEventListener('error',e=>errs.push(e.message));
w.HTMLCanvasElement.prototype.getContext=()=>null;
w.eval(bot);
w.eval(`BOT.strat='equilibre';BOT.x={club:{},player:{},inj:0,reds:0,coachReq:0,resign:0,promise:0,youthGain:[],ages:[],offers:0,newsTypes:{}};UI.setup.diff=1;document.getElementById('cTown').value='Clichy';A.create();`);
function run(n){let s=0;while(s++<3000){if(w.eval('S.over')||w.eval('S.gw')>=n)break;if(w.eval('UI.modalOpen')){w.eval('BOT.handleModal()');w.eval('if(!UI.modalOpen)nextQueue()');continue;}w.eval('BOT.weekly()');w.eval('A.play()');}}
run(12);console.error("gw",w.eval("S.gw"));
// code « ancien » : on retire ce que les versions récentes ont ajouté
const code = w.eval(`(()=>{const s=JSON.parse(JSON.stringify(S));s.players.forEach(p=>{p.sa=p.s?p.s.mj:0;p.sg=p.s?p.s.g:0;delete p.s;delete p.assists;delete p.hist;delete p.moves;});
 delete s.req;delete s.reqLog;delete s.track;delete s.sf.fi;delete s.roundRes;delete s.transfers;delete s.watch;delete s.talks;delete s.offers;delete s.pre;delete s.scouting;
 return btoa(unescape(encodeURIComponent(JSON.stringify(s))));})()`);
const before = w.eval('JSON.stringify(S).length');
w.eval(`A.importSave();document.getElementById('imp').value=${JSON.stringify(code)};A.doImport();`);
const fails=[];
for(const t of ['accueil','calendrier','classement','stats','effectif','mercato','staff','infra','finances','coupe','club']){try{w.eval(`UI.tab='${t}';render()`);}catch(e){fails.push(t+': '+e.message);}}
try{ run(20); }catch(e){fails.push('jouer: '+e.message);}
// code invalide : partie conservée
const gw=w.eval('S.gw'); w.eval(`A.importSave();document.getElementById('imp').value='abc';A.doImport();`); const keep=w.eval('S.gw')===gw;
// code valide mais cassé (pas de staff) : partie conservée
const bad = w.eval(`btoa(unescape(encodeURIComponent(JSON.stringify({v:1,players:[]}))))`);
w.eval(`A.importSave();document.getElementById('imp').value=${JSON.stringify(bad)};A.doImport();`); const keep2=w.eval('S.gw')===gw;
let r2=[];for(const t of ['accueil','effectif']){try{w.eval(`UI.tab='${t}';render()`);}catch(e){r2.push(t+': '+e.message);}}
console.log(JSON.stringify({gw:w.eval('S.gw'),fails,keepInvalid:keep,keepBroken:keep2,afterBroken:r2,errs:errs.slice(0,5)}));
process.exit(0);
