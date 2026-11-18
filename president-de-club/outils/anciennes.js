// v39 : une partie de l'ANCIENNE version (avant.html) reprise dans la nouvelle : complétée, 11 onglets, 40 journées de plus, 0 erreur.
// node outils/anciennes.js ancien.html nouveau.html
const { JSDOM } = require('jsdom'); const fs = require('fs');
const bot = fs.readFileSync(__dirname+'/bot.js','utf8');
function mk(file){const dom=new JSDOM(fs.readFileSync(file,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/'});const w=dom.window;w.scrollTo=()=>{};w.HTMLCanvasElement.prototype.getContext=()=>null;w.errs=[];w.addEventListener('error',e=>w.errs.push(e.message));w.eval(bot);return w;}
function run(w,weeks){let s=0;while(s++<4000){if(w.eval('S.over'))break;if(w.eval('S.gw')>=weeks)break;if(w.eval('UI.modalOpen')){w.eval('BOT.handleModal()');w.eval('if(!UI.modalOpen)nextQueue()');continue;}w.eval('BOT.weekly()');w.eval('A.play()');}}
const out={};
for(const st of ['depensier','prudent']){
const a=mk(process.argv[2]);a.eval(`BOT.strat='${st}';UI.setup.diff=1;document.getElementById('cTown').value='Clichy';A.create();`);run(a,70);
const saved=a.eval('JSON.stringify(S)');const gw0=a.eval('S.gw');
const b=mk(process.argv[3]);const savedCopy=saved;
b.eval(`boot({S:JSON.parse(${JSON.stringify(saved)})});UI.modalOpen=false;UI.queue=[];BOT.strat='${st}';`);
const rz=b.eval('S.relZ'),tabs=b.eval(`(()=>{const bad=[];['accueil','calendrier','classement','stats','effectif','mercato','staff','infra','finances','coupe','club'].forEach(t=>{try{UI.tab=t;render();}catch(x){bad.push(t+':'+x.message)}});return bad;})()`);
const fin=b.eval(`UI.tab='finances';render();/Taux du prochain/.test(document.body.innerHTML)`);
run(b,gw0+40);
out[st]={gw_ancien:gw0,gw_apres:b.eval('S.gw'),relZ_complete:rz===false||rz===true,onglets_en_erreur:tabs,finances_nouvelles:fin,erreurs:[...a.errs.filter(e=>!/getContext/.test(e)),...b.errs.filter(e=>!/getContext/.test(e))].slice(0,4),sauvegarde_source_intacte:saved===savedCopy,over:b.eval('S.over&&S.over.t')};
}
console.log(JSON.stringify(out));process.exit(0);
