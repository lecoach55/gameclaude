// Chaque choix d'événement qui change l'état affiche-t-il au moins une conséquence (pastille ou « À venir ») ?
const { JSDOM } = require('jsdom'); const fs = require('fs');
const html=fs.readFileSync(process.argv[2]||__dirname+'/../jeu/index.html','utf8');
let n=0,chg=0,shown=0,err=0,silent=[],withNum=0;
for(const div of [0,3,5,6]){
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/'});const w=dom.window;w.scrollTo=()=>{};
w.HTMLCanvasElement.prototype.getContext=()=>null;
w.eval(`UI.setup.diff=1;document.getElementById('cTown').value='Lens';A.create();UI.queue=[];S.div=${div};S.sasp=${div>=3};Object.assign(S.infra,{stade:3,eclairage:1,commerce:1});setupSeason();S.week=10;S.gw=10;S.players.forEach(p=>p.joinGw=5);`);
const keys=w.eval('Object.keys(EVENTS)');
for(const k of keys){
  const nch=w.eval(`(()=>{try{const e=EVENTS[${JSON.stringify(k)}];const d=e.make?e.make():{};if(!d)return 0;window.__d=d;const chs=typeof e.ch==='function'?e.ch(d):e.ch;return chs.length;}catch(x){return -1}})()`);
  if(nch<=0)continue;
  for(let i=0;i<nch;i++){n++;
    const r=w.eval(`(()=>{const snap=JSON.stringify(S);try{const strip=s=>{const o=JSON.parse(s);delete o.news;return JSON.stringify(o);};UI.curEv={id:${JSON.stringify(k)},d:JSON.parse(JSON.stringify(window.__d))};A.evChoice(${i});const h=document.getElementById('mbox').innerHTML;const changed=strip(JSON.stringify(S))!==strip(snap);const r={changed,fx:/class="evfx"/.test(h),num:/class="pill/.test(h)};S=JSON.parse(snap);UI.queue=[];return r;}catch(x){S=JSON.parse(snap);return {err:x.message}}})()`);
    if(r.err){err++;continue;} if(r.changed){chg++;if(r.fx)shown++;else silent.push(div+':'+k+'#'+i);if(r.num)withNum++;}
  }
}}
console.log(JSON.stringify({choix:n,erreurs:err,changent_etat:chg,avec_consequence:shown,avec_chiffre:withNum,silencieux:silent.length,ex:silent.slice(0,12)}));
process.exit(0);
