// A/B : niveaux d'IA mélangés, sièges en rotation
const {JSDOM}=require('jsdom');const fs=require('fs');
const [,,N,G,LA,LB,F,OUT]=process.argv;
let html=fs.readFileSync(F,'utf8').replace('function boot(data) {','window.__start=(n,l)=>newGame(Array.from({length:n},(_, i) => ({ name: "P"+i, ai: true, lvl:l[i], color: i })));window.__S=()=>S;window.__fast=()=>{render=()=>{};floatText=()=>{};flash=()=>{};placeFX=()=>{};};\nfunction boot(data) {');
const res={[LA]:0,[LB]:0,none:0},types={};let errs=0;
(async()=>{for(let g=0;g<+G;g++){
  const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,beforeParse(win){win.__RULES=JSON.parse(process.env.RULES||'{}')}});const w=dom.window;
  w.addEventListener('error',e=>{errs++;console.error(e.message)});
  w.document.getElementById('speed').innerHTML='<option value="0" selected>0</option>';
  await new Promise(r=>setTimeout(r,20));
  const l=Array.from({length:+N},(_,i)=>((i+g)%2?LB:LA));
  w.__fast();w.__start(+N,l);
  for(let i=0;i<6000;i++){await new Promise(r=>setTimeout(r,50));const S=w.__S();if(S.over||S.round>40)break;}
  const S=w.__S();const L=S.log.map(x=>x.html.replace(/<[^>]+>/g,'')).join('\n');const m=L.match(/Victoire (\w+(?: Conseil)?) de P(\d)/);
  if(m){res[l[+m[2]]]++;const k=l[+m[2]]+":"+m[1];types[k]=(types[k]||0)+1}else res.none++;
  w.close();}
  fs.writeFileSync(OUT,JSON.stringify({N,res,types,errs}));})();
