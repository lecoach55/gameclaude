// v39b : aperçu chiffré des choix d'événements. Vérifie que l'aperçu (joué à blanc) ne change
// RIEN à la partie (S identique, file d'attente intacte, aucune sauvegarde), compte les choix
// avec une indication et mesure le temps d'ouverture d'une fenêtre.  node outils/pvtest.js [html]
const { JSDOM } = require('jsdom'); const fs = require('fs');
const html=fs.readFileSync(process.argv[2]||__dirname+'/../jeu/index.html','utf8');
let n=0,avec=0,err=0,mut=0,saves=0,ms=[],ex=[];
for(const div of [0,3,5,6]){
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/'});const w=dom.window;w.scrollTo=()=>{};
w.HTMLCanvasElement.prototype.getContext=()=>null;const errs=[];w.addEventListener('error',e=>errs.push(e.message));
w.eval(`UI.setup.diff=1;document.getElementById('cTown').value='Lens';A.create();UI.queue=[];S.div=${div};S.sasp=${div>=3};Object.assign(S.infra,{stade:3,eclairage:1,commerce:1});setupSeason();S.week=10;S.gw=10;S.players.forEach(p=>p.joinGw=5);`);
w.eval(`window.__sv=0;const _ls=localStorage.setItem.bind(localStorage);localStorage.setItem=function(k,v){window.__sv++;return _ls(k,v);};`);
const keys=w.eval('Object.keys(EVENTS)');
for(const k of keys){
  const r=w.eval(`(()=>{try{const e=EVENTS[${JSON.stringify(k)}];if(e.cond){try{if(!e.cond())return null;}catch(x){return null;}}const d=e.make?e.make():{};if(!d)return null;
    UI.queue=[{type:'x'}];const before=JSON.stringify(S),sv=window.__sv,t0=performance.now();
    showEvent({id:${JSON.stringify(k)},d});const dt=performance.now()-t0;
    const pv=[...document.querySelectorAll('#mbox .choice')].map(b=>{const s=b.querySelector('small.evpv');return s?s.textContent:''});
    return {pv,dt,mut:JSON.stringify(S)!==before,q:UI.queue.length!==1,sv:window.__sv-sv};}catch(x){return {e:String(x)}}})()`);
  if(!r)continue;if(r.e){err++;ex.push(k+': '+r.e);continue;}
  n+=r.pv.length;avec+=r.pv.filter(Boolean).length;ms.push(r.dt);if(r.mut||r.q){mut++;ex.push(div+':'+k+' modifie la partie');}saves+=r.sv;
  if(process.env.V&&div===3)console.log(k,'|',r.pv.join(' | '));
}
if(errs.length){err+=errs.length;ex.push(...errs.slice(0,3));}
w.close();}
ms.sort((a,b)=>a-b);
console.log(JSON.stringify({choix:n,avec_indication:avec,erreurs:err,partie_modifiee:mut,sauvegardes:saves,ms_median:Math.round(ms[ms.length>>1]),ms_max:Math.round(ms[ms.length-1]),ex:ex.slice(0,8)}));
process.exit(0);
