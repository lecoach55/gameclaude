// statistiques détaillées en mode rapide (rendu désactivé)
const {JSDOM}=require('jsdom');const fs=require('fs');
const [,,N,G,LVLS,F,OUT]=process.argv; const lv=LVLS.split(',');
let html=fs.readFileSync(F,'utf8').replace('function boot(data) {','window.__start=(n,l)=>newGame(Array.from({length:n},(_, i) => ({ name: "P"+i, ai: true, lvl:l[i%l.length], color: i })));window.__S=()=>S;window.__fast=()=>{render=()=>{};floatText=()=>{};flash=()=>{};placeFX=()=>{};};\nfunction boot(data) {').replace('if (S.log.length > 150) S.log.shift();','');
const out=[];
(async()=>{for(let g=0;g<+G;g++){
  const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,beforeParse(win){win.__RULES=JSON.parse(process.env.RULES||'{}')}});const w=dom.window;let errs=0;
  w.addEventListener('error',e=>{errs++;console.error(e.message)});
  w.document.getElementById('speed').innerHTML='<option value="0" selected>0</option>';
  await new Promise(r=>setTimeout(r,20));w.__fast();w.__start(+N,lv);
  const snaps={};
  for(let i=0;i<8000;i++){await new Promise(r=>setTimeout(r,25));const S=w.__S();
    if(!snaps[S.round]) snaps[S.round]={t:S.players.map((p,k)=>S.t.filter(x=>x.o===k).length),a:S.players.map((p,k)=>S.t.reduce((s,x)=>s+(x.o===k?x.a:0),0)),pacts:S.pacts.length,inf:S.players.map(p=>p.inf),stab:S.players.map(p=>p.stab)};
    if(S.over||S.round>40)break;}
  const S=w.__S();const L=S.log.map(x=>x.html.replace(/<(?!\/?b>)[^>]+>/g,''));const T=L.join('\n');
  const m=T.match(/Victoire (\w+(?: au Conseil)?|au Conseil) de P(\d)/);const win=m?+m[2]:null;
  // édits : par manche, adopté ?, et qui a voté pour
  const ed=[];let curR=1;
  for(const l of L){const r=l.match(/^Manche (\d+)/);if(r)curR=+r[1];const e=l.match(/^(.+?) : pour \d+\+🎲\d = \d+ contre \d+\+🎲\d = \d+ → <b>([A-ZÉ]+)/);if(e)ed.push({n:e[1],ok:e[2]==='ADOPTÉ',r:curR});}
  const conq=[];let cr=1;for(const l of L){const r=l.match(/^Manche (\d+)/);if(r)cr=+r[1];if(/s'empare de/.test(l))conq[cr]=(conq[cr]||0)+1;}
  out.push({N:+N,lv,round:S.round,over:S.over,type:m&&m[1],win,winLvl:win!=null?lv[win%lv.length]:null,errs,
    pacts:(T.match(/Pacte de non-agression entre/g)||[]).length,acts:{merc:(T.match(/engage des mercenaires/g)||[]).length,prop:(T.match(/campagne de propagande/g)||[]).length,bribe:(T.match(/soudoyer|achète la garnison/g)||[]).length,revolt:(T.match(/Révolte fomentée/g)||[]).length,ordre:(T.match(/à l'ordre du jour de la prochaine/g)||[]).length},betray:(T.match(/trahit/g)||[]).length,procl:(T.match(/proclame sa souveraineté/g)||[]).length,
    ed,conq,snapLast:snaps[S.round]||snaps[S.round-1],snap20:snaps[20],snap30:snaps[30]});
  w.close();}
  fs.writeFileSync(OUT,JSON.stringify(out));})();
