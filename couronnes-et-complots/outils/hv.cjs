// héros (siège tournant) contre N-1 IA d'un niveau donné
const {JSDOM}=require('jsdom');const fs=require('fs');
const [,,N,G,HERO,OPP,F,OUT]=process.argv;
let html=fs.readFileSync(F,'utf8').replace('function boot(data) {','window.__start=(n,l)=>newGame(Array.from({length:n},(_, i) => ({ name: "P"+i, ai: true, lvl:l[i], color: i })));window.__S=()=>S;window.__fast=()=>{render=()=>{};floatText=()=>{};flash=()=>{};placeFX=()=>{};};\nfunction boot(data) {');
let win=0,n=0,rounds=[],types={},errs=0;
(async()=>{for(let g=0;g<+G;g++){
  const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true});const w=dom.window;
  w.addEventListener('error',e=>{errs++});
  w.document.getElementById('speed').innerHTML='<option value="0" selected>0</option>';
  await new Promise(r=>setTimeout(r,20));w.__fast();
  const hs=g%(+N);const l=Array.from({length:+N},(_,i)=>i===hs?HERO:OPP);w.__start(+N,l);
  for(let i=0;i<8000;i++){await new Promise(r=>setTimeout(r,25));const S=w.__S();if(S.over||S.round>40)break;}
  const S=w.__S();const L=S.log.map(x=>x.html.replace(/<[^>]+>/g,'')).join('\n');const m=L.match(/Victoire (\w+(?: Conseil)?) de P(\d)/);
  n++;rounds.push(S.round);if(m&&+m[2]===hs){win++;types[m[1]]=(types[m[1]]||0)+1;}
  w.close();}
  rounds.sort((a,b)=>a-b);
  fs.writeFileSync(OUT,JSON.stringify({N,HERO,OPP,win,n,rate:+(win/n).toFixed(2),fair:+(1/N).toFixed(2),medRounds:rounds[n>>1],types,errs}));})();
