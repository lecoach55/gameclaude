(function(){
"use strict";
const E=ENGINE, ST=DATA.stocks, SECS=DATA.sectors, TK=Object.keys(ST);
const FEE_RATE=0.001, FEE_MIN=1, PRO_DAYS=21;
const $=s=>document.querySelector(s);
const nf2=new Intl.NumberFormat('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2});
const nf1=new Intl.NumberFormat('fr-FR',{minimumFractionDigits:1,maximumFractionDigits:1});
const nf0=new Intl.NumberFormat('fr-FR',{maximumFractionDigits:0});
const money=v=>nf2.format(v)+' $', money0=v=>nf0.format(v)+' $';
const sgn=v=>v>0?'+':v<0?'−':'';
const pct=v=>sgn(v)+nf2.format(Math.abs(v*100))+' %';
const pct1=v=>sgn(v)+nf1.format(Math.abs(v*100))+' %';
const cls=v=>v>0.00001?'up':v<-0.00001?'down':'flat';
const pill=(v,f)=>v==null||!isFinite(v)?'<span class="muted">—</span>':'<span class="pill '+cls(v)+'">'+(f||pct)(v)+'</span>';
const txt=(v,f)=>v==null||!isFinite(v)?'<span class="muted">—</span>':'<span class="'+cls(v)+'">'+(f||pct)(v)+'</span>';
const short$=v=>{const a=Math.abs(v);return a>=1e9?nf1.format(v/1e9)+' Md$':a>=1e6?nf1.format(v/1e6)+' M$':a>=1e4?nf0.format(v/1e3)+' k$':nf0.format(v)+' $';};
const dObj=s=>new Date(s+'T12:00:00Z');
const cap1=s=>s.charAt(0).toUpperCase()+s.slice(1);
const DTF={},dtf=o=>{const k=JSON.stringify(o);return DTF[k]||(DTF[k]=new Intl.DateTimeFormat('fr-FR',Object.assign({timeZone:'UTC'},o)));},fdate=(d,o)=>dtf(o).format(d);
const dLong=s=>cap1(fdate(dObj(s),{weekday:'long',day:'numeric',month:'long',year:'numeric'}));
const DSH={};const dShort=s=>DSH[s]||(DSH[s]=fdate(dObj(s),{day:'numeric',month:'short',year:'numeric'}));
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const rnd=Math.random, pickA=a=>a[Math.floor(rnd()*a.length)], clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const AV={3:'Achat',2:'Neutre',1:'Vente'};
const secList=Object.keys(SECS).sort((a,b)=>a.localeCompare(b,'fr'));
const HUE={};secList.forEach((s,k)=>HUE[s]=Math.round(k*360/secList.length+18)%360);
const hueOf=t=>HUE[ST[t].s];
const avatar=t=>'<span class="av" style="--h:'+hueOf(t)+'">'+t.replace('.','').slice(0,4)+'</span>';
const CATC={macro:'var(--accent)',societe:'var(--muted)',resultats:'var(--gold)',rumeur:'#b06ab3',analyste:'var(--up)',jeu:'#e0a526'};
const CATL={macro:'Économie',societe:'Société',resultats:'Résultats',rumeur:'Rumeur',analyste:'Analyste',jeu:'Événement'};
const PHC={expansion:'var(--up)',surchauffe:'var(--gold)',recession:'var(--down)',reprise:'var(--accent)'};

let cview='list', hp=1, showMA=true, omode='now', chosenDiff=1;
const DIFF={sal:[1.5,1,0.6],rsal:[0.7,1,1.3],xp:[1,1,1.25]};
const dif=()=>GM().diff??1;
let G=null, sel='AAPL', range=252, sortK='name', sortDir=1, auto=null, tab='cote', sub='fil', filt='tout', qf='all', side='A', busy=false;
const KEY='wallst-sim-v3';
function saveNow(){clearTimeout(save.tm);save.tm=0;if(NOSAVE||!G)return;G.savedAt=Date.now();try{localStorage.setItem(KEY,JSON.stringify(G));}catch(e){}CLOUD.push();}
function save(){if(NOSAVE)return;G.savedAt=Date.now();if(!save.tm)save.tm=setTimeout(saveNow,1500);}
function load(){try{const r=localStorage.getItem(KEY);return r?JSON.parse(r):null;}catch(e){return null;}}

/* =====================================================================
   COUCHE JEU : carrière, rivaux, missions, événements, train de vie
   ===================================================================== */
const RANKS=[
 {xp:0,n:'Stagiaire',u:'Acheter et vendre des actions.'},
 {xp:250,n:'Trader junior',u:'Accès à la Recherche Pro.'},
 {xp:800,n:'Trader confirmé',u:'Vente à découvert : gagnez quand une action baisse.'},
 {xp:2000,n:'Gérant de fonds',u:'Les rivaux peuvent vous lancer des défis, et la boutique de luxe s\'ouvre en grand.'},
 {xp:4500,n:'Associé',u:'Un informateur vous glisse un tuyau fiable chaque mois.'},
 {xp:9000,n:'Légende de Wall Street',u:'Votre tour s\'illumine d\'une couronne d\'or.'}
];
const RIVALS=[
 {id:'max',n:'Max Kowalski',nick:'le Loup',st:'momentum',c:'#e4572e',skin:'#f1c7a5',hair:'#3b2416',
  lines:{pass:['Tu croyais vraiment me tenir derrière toi ?','Je te dépasse, champion. Prends des notes.'],passed:['Profite bien de ta place, elle est provisoire.','Coup de chance. On en reparle dans un mois.'],crash:['Ça saigne ! Moi j\'achète le sang.','Les faibles vendent, les loups se servent.'],win:['Encore une semaine en or pour le Loup.','Le momentum, c\'est la vie.'],idle:['Tu tradées ou tu fais la sieste ?','J\'ai doublé ma mise sur les semi-conducteurs. Et toi ?']}},
 {id:'margaux',n:'Margaux Delaunay',nick:'la Prudente',st:'value',c:'#2e86ab',skin:'#e8b894',hair:'#7a4a24',
  lines:{pass:['La patience finit toujours par payer.','Doucement mais sûrement, comme toujours.'],passed:['Bravo. Mais le marché a la mémoire courte.','Joli. Vérifiez quand même vos PER.'],crash:['Rien d\'inquiétant : mes dividendes tombent toujours.','Les soldes commencent. J\'ai ma liste.'],win:['Mes valeurs ennuyeuses font encore des merveilles.','Un dividende par-ci, un dividende par-là.'],idle:['Avez-vous lu les résultats de ce trimestre ?','Je n\'achète que ce que je comprends.']}},
 {id:'kevin',n:'Kevin « YOLO » Martin',nick:'l\'Instinctif',st:'yolo',c:'#8e44ad',skin:'#f3d2b8',hair:'#d9a441',
  lines:{pass:['YOLOOO ! Je te passe devant !','Tout sur une ligne, et ça passe !'],passed:['Attends, je me refais au prochain coup.','Bon, c\'était un test.'],crash:['Je… je crois que j\'ai tout mis au mauvais endroit.','C\'est une décote, pas une perte. Hein ?'],win:['Encore un coup de génie. Ou de chance.','Je sens les marchés, c\'est un don.'],idle:['Tu connais un truc qui va faire ×10 cette semaine ?','J\'ai vu une vidéo, ça va exploser.']}}
];
const SAL=[1500,2500,4000,6500,10000,16000];
const SHOP=[
 {id:'watch',n:'Montre suisse',d:'Pour regarder l\'heure de clôture avec style.',p:8000,pr:10,r:0},
 {id:'car',n:'Voiture de sport',d:'Douze cylindres pour aller au bureau.',p:120000,pr:40,r:0},
 {id:'art',n:'Toile de maître',d:'Accrochée dans votre bureau d\'angle.',p:600000,pr:90,r:1},
 {id:'penthouse',n:'Penthouse',d:'Le dernier étage de votre tour s\'illumine.',p:3000000,pr:220,r:2},
 {id:'yacht',n:'Yacht',d:'Amarré sur l\'Hudson, bien visible de tous.',p:12000000,pr:450,r:3},
 {id:'jet',n:'Jet privé',d:'Il survole la ville à chaque séance.',p:45000000,pr:900,r:3},
 {id:'island',n:'Île privée',d:'Un coin de paradis au large de la baie.',p:200000000,pr:2500,r:4}
];
function ensureGame(){
  if(G.game){const g=G.game;if(g.contrib==null){g.contrib=G.cap;g.cool={};g.reroll=0;g.hist=[];g.rivals.forEach(r=>r.contrib=r.start);}if(!g.orders){g.orders=[];g.fav={};g.oseq=0;}if(!G.game.stats)G.game.stats={dil:0,spec:0,pop:0,md:{},mf:{},rk:{0:G.day},pay:[]};return;}
  const v=E.value(G);
  G.game={xp:0,rank:0,missions:[],done:0,shorts:{},items:{},pend:[],msgs:[],
    rivals:RIVALS.map(r=>({id:r.id,cash:G.cap,pos:{},start:G.cap,contrib:G.cap,mem:{},resets:0})),contrib:G.cap,cool:{},reroll:0,hist:[],orders:[],fav:{},oseq:0,diff:chosenDiff,
    nextEvent:G.day+6+Math.floor(rnd()*6),nextSpecial:G.day+50+Math.floor(rnd()*60),lastRank:[],flags:{},lock:0,weekV:v,weekM:G.idx[G.idx.length-1],tutorial:true};
  G.game.stats={dil:0,spec:0,pop:0,md:{},mf:{},rk:{0:G.day},pay:[]};
  G.game.missions=[mk('first'),mk('days'),mk('terminal')];
}
const GM=()=>G.game;

/* ---------- valeurs ---------- */
const P=(t,b)=>{const a=G.st[t].p;return a[a.length-1-(b||0)];};
const ret=(t,n)=>{const a=G.st[t].p,i=a.length-1,j=Math.max(0,i-n);return a[i]/a[j]-1;};
const startPos=()=>Math.max(0,G.dates.length-1-(G.day-G.start));
function shortLiab(){let s=0;const S=GM().shorts;for(const t in S)s+=S[t].q*P(t);return s;}
function itemsVal(){let s=0;for(const id in GM().items){const it=SHOP.find(x=>x.id===id);if(it)s+=it.p*0.6;}return s;}
function value(){return E.value(G)-shortLiab()+itemsVal();}
function rivalVal(r){let v=r.cash;for(const t in r.pos)v+=r.pos[t]*P(t);return v;}
function board(){const L=[{id:'me',n:'Vous',v:value()}].concat(GM().rivals.map(r=>({id:r.id,n:RIVALS.find(x=>x.id===r.id).n,v:rivalVal(r)})));return L.sort((a,b)=>b.v-a.v);}
const contrib=()=>GM().contrib;
const perfMe=()=>value()/contrib()-1;
const perfR=r=>rivalVal(r)/(r.contrib||r.start)-1;
const myRank=()=>board().findIndex(x=>x.id==='me')+1;
const idxRet=n=>{const a=G.idx,i=a.length-1;return a[i]/a[Math.max(0,i-n)]-1;};
function fresh(t){const r=G.st[t].rat,o={};for(const k in r)if(r[k].day>G.day-126)o[k]=r[k];return o;}
function cons(t){const r=fresh(t);let n=0,s=0,tg=0,b=0,h=0,v=0;for(const k in r){n++;s+=r[k].r;tg+=r[k].tgt;if(r[k].r===3)b++;else if(r[k].r===2)h++;else v++;}return n?{n,score:s/n,tgt:tg/n,b,h,v}:null;}
function dateIn(n){let d=G.date;for(let k=0;k<n;k++)d=E.nextDate(d);return d;}
const firmRate=F=>{const n=F.ok+F.ko;return n?F.ok/n:null;};
const proOn=()=>G.pro>=G.day;
const proCost=()=>Math.round(Math.max(300,value()*0.0025));
function secPE(s){const a=TK.filter(t=>ST[t].s===s).map(t=>G.st[t].pe).sort((x,y)=>x-y);return a[Math.floor(a.length/2)];}

/* ---------- son ---------- */
let AC=null, soundOn=true;
try{soundOn=localStorage.getItem('wallst-sound')!=='0';}catch(e){}
function tone(f,d,type,vol,when){if(!soundOn)return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();const o=AC.createOscillator(),g=AC.createGain();o.type=type||'sine';o.frequency.value=f;g.gain.value=0;o.connect(g);g.connect(AC.destination);const t=AC.currentTime+(when||0);g.gain.linearRampToValueAtTime(vol||0.08,t+0.01);g.gain.exponentialRampToValueAtTime(0.0001,t+d);o.start(t);o.stop(t+d+0.02);}catch(e){}}
const SND={
  bell:()=>{tone(880,0.5,'sine',0.05);tone(1320,0.4,'sine',0.03,0.02);},
  cash:()=>{tone(1568,0.12,'square',0.04);tone(2093,0.25,'square',0.04,0.08);},
  ding:()=>{tone(1046,0.3,'triangle',0.08);tone(1318,0.3,'triangle',0.07,0.1);tone(1568,0.5,'triangle',0.07,0.2);},
  bad:()=>{tone(220,0.35,'sawtooth',0.05);tone(165,0.5,'sawtooth',0.05,0.15);},
  fanfare:()=>{[523,659,784,1046].forEach((f,k)=>tone(f,0.35,'triangle',0.08,k*0.12));}
};
function renderSoundBtn(){const b=$('#bSound');b.setAttribute('aria-pressed',soundOn);b.setAttribute('aria-label',soundOn?'Couper le son':'Activer le son');b.innerHTML='<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M3 7h3l4-3v10l-4-3H3z" fill="currentColor"/>'+(soundOn?'<path d="M12.5 6.5a3.5 3.5 0 010 5M14.5 4.5a6.5 6.5 0 010 9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>':'<path d="M12 7l4 4M16 7l-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>')+'</svg>';}

/* ---------- confettis ---------- */
const CF={parts:[],run:false};
function confetti(n){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const cv=$('#confetti'),W=innerWidth,H=innerHeight;cv.width=W;cv.height=H;
  const cols=['#e0a526','#f6d27a','#45c98c','#2e86ab','#e4572e','#ffffff'];
  for(let k=0;k<(n||140);k++)CF.parts.push({x:W/2+(rnd()-0.5)*200,y:H*0.35,vx:(rnd()-0.5)*14,vy:-rnd()*14-4,r:rnd()*6+4,c:pickA(cols),a:rnd()*6,va:(rnd()-0.5)*0.3,life:0});
  if(!CF.run){CF.run=true;requestAnimationFrame(cfLoop);}
  if((n||140)>=150)skyFireworks(5);
}
function cfLoop(){
  const cv=$('#confetti'),c=cv.getContext('2d');c.clearRect(0,0,cv.width,cv.height);
  CF.parts=CF.parts.filter(p=>p.life<180&&p.y<cv.height+20);
  CF.parts.forEach(p=>{p.vy+=0.35;p.vx*=0.99;p.x+=p.vx;p.y+=p.vy;p.a+=p.va;p.life++;c.save();c.translate(p.x,p.y);c.rotate(p.a);c.fillStyle=p.c;c.fillRect(-p.r/2,-p.r/4,p.r,p.r/2);c.restore();});
  if(CF.parts.length)requestAnimationFrame(cfLoop);else{CF.run=false;c.clearRect(0,0,cv.width,cv.height);}
}

/* ---------- XP et grades ---------- */
function addXP(n,why){
  const g=GM();n=Math.round(n*DIFF.xp[g.diff??1]);g.xp+=n;
  let r=g.rank;while(r+1<RANKS.length&&g.xp>=RANKS[r+1].xp)r++;
  if(r>g.rank){g.rank=r;promoQueue.push(r);g.stats.rk[r]=G.day;}
  if(r===RANKS.length-1){const st=Math.floor((g.xp-RANKS[r].xp)/5000);if(st>(g.stars||0)){g.stars=st;toast('Nouvelle étoile de Légende : '+st+' !','var(--gold)');skyFireworks(4);SND.fanfare();}}
  if(why)toast('+'+n+' XP : '+why,'var(--gold)');
}
let promoQueue=[];
function showPromo(r){
  SND.fanfare();confetti(220);
  info('<div class="dlg-top"><div style="font-size:14px;opacity:.8">Promotion</div><h2 id="infoTitle">Vous êtes '+RANKS[r].n+' !</h2><p>Vos résultats ont été remarqués au dernier étage.</p></div><div class="dlg-body"><div class="unl"><svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="13" fill="var(--gold)"/><path d="M8 14l4 4 8-8" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg><div><b>Débloqué</b><div>'+RANKS[r].u+'</div></div></div><div class="dlg-act"><button class="btn go" data-close>Au travail</button></div></div>');
}

/* ---------- missions ---------- */
function mk(type){
  const v=value(),g=G.game||{rivals:[]};
  const base={type,start:G.day,v0:v,c0:G.game&&G.game.contrib!=null?G.game.contrib:G.cap,tx0:G.tx.length,done:false};
  const T={
    first:{t:'Premier ordre',d:'Achetez votre première action.',xp:60,cash:0},
    days:{t:'Prendre ses marques',d:'Passez 10 séances sur le marché.',xp:60,cash:0,n:10},
    terminal:{t:'Se tenir informé',d:'Ouvrez l\'onglet Infos et lisez l\'agenda économique.',xp:40,cash:0},
    gain:(()=>{const x=pickA([0.03,0.05,0.08]),n=x<0.04?40:x<0.06?60:100;return{t:'Objectif +'+nf0.format(x*100)+' %',d:'Faites progresser votre fortune de '+nf0.format(x*100)+' % en '+n+' séances.',xp:Math.round(x*2500),cash:Math.round(v*x*0.2),x,n};})(),
    sectors:(()=>{const k=pickA([3,4,5]);return{t:'Ne pas mettre tous ses œufs…',d:'Détenez des actions de '+k+' secteurs différents en même temps.',xp:40+k*20,cash:0,k,n:40};})(),
    profit:(()=>{const a=Math.max(200,Math.round(v*0.02/100)*100);return{t:'Encaisser',d:'Réalisez une vente avec au moins '+money0(a)+' de plus-value.',xp:120,cash:0,a,n:60};})(),
    divs:(()=>{const k=pickA([2,3,4]);return{t:'Rentier',d:'Encaissez '+k+' dividendes.',xp:60+k*25,cash:0,k,n:70};})(),
    beat:(()=>{const L=(g.rivals||[]).map(r=>({r,v:rivalVal(r)})).filter(x=>x.v>v).sort((a,b)=>a.v-b.v);const tg=L.length?L[0].r.id:pickA(RIVALS).id;return{t:'Doubler '+RIVALS.find(x=>x.id===tg).n.split(' ')[0],d:'Terminez une séance devant '+RIVALS.find(x=>x.id===tg).n+' au classement.',xp:150,cash:0,rid:tg,n:60};})(),
    panic:{t:'Sang-froid',d:'Achetez une action un jour où l\'indice de peur dépasse 24.',xp:180,cash:0,n:120},
    earn:{t:'Le bon timing',d:'Détenez une action le jour où elle bondit de plus de 4 % après ses résultats.',xp:160,cash:0,n:63},
    short:{t:'Parier contre',d:'Clôturez une vente à découvert avec un gain.',xp:200,cash:0,n:80},
    pro:{t:'L\'information se paie',d:'Abonnez-vous à la Recherche Pro.',xp:80,cash:0,n:60},
    order:{t:'Pilote automatique',d:'Faites exécuter un ordre programmé (achat sur repli, stop ou objectif de gain).',xp:140,cash:0,n:80},
    invest:{t:'L\'argent doit travailler',d:'Gardez moins de 20 % de liquidités pendant 15 séances d\'affilée.',xp:120,cash:0,n:60},
    hold:{t:'Patience',d:'Conservez une position au moins 60 séances et terminez avec un gain sur elle.',xp:150,cash:0,n:120},
    fav:{t:'Liste de surveillance',d:'Ajoutez 3 valeurs à vos favoris (étoile sur la fiche).',xp:40,cash:0,n:60}
  }[type];
  return Object.assign(base,T,{deadline:T.n?G.day+T.n:null});
}
function playStyle(){
  const rec=G.tx.filter(x=>x.day>G.day-150);
  return{sells:rec.filter(x=>x.s==='V').length,buys:rec.filter(x=>x.s==='A').length,shorts:rec.filter(x=>x.s==='S'||x.s==='C').length,prog:rec.filter(x=>x.prog).length,divs:Object.keys(G.pos).filter(t=>G.st[t].dy>0.015).length,cash:G.cash/Math.max(1,value())};
}
function newMission(){
  const g=GM(),have=g.missions.map(m=>m.type),st=playStyle(),fails=g.recentFail||{};
  // poids selon votre façon de jouer : on propose surtout ce qui vous ressemble, et un peu de nouveauté
  const W={gain:3,sectors:st.buys>0?2:1,profit:st.sells>0?3:0.6,divs:st.divs>0?3:1,beat:2,panic:1.2,earn:st.buys>2?2:1,order:st.prog>0?1.5:2,invest:st.cash>0.4?3:0.6,hold:Object.keys(G.pos).length?2:0.5,fav:Object.keys(g.fav||{}).length<3?1:0};
  if(g.rank>=1&&!proOn())W.pro=1.2;
  if(g.rank>=2)W.short=st.shorts>0?2.5:0.8;
  if(myRank()===1)delete W.beat;
  for(const k in W){if(have.includes(k)||(fails[k]&&fails[k].n>=2&&G.day-fails[k].d<300))delete W[k];}
  let tot=0;for(const k in W)tot+=W[k];let r=rnd()*tot;
  for(const k in W){r-=W[k];if(r<=0)return mk(k);}
  return mk('gain');
}
function missionProgress(m){
  const v=value(),txs=G.tx.slice(m.tx0);
  switch(m.type){
    case 'first':return txs.some(x=>x.s==='A')?1:0;
    case 'days':return Math.min(1,(G.day-m.start)/m.n);
    case 'terminal':return GM().flags.terminal?1:0;
    case 'gain':return clamp(((v-(contrib()-(m.c0!=null?m.c0:contrib())))/m.v0-1)/m.x,0,1);
    case 'sectors':return Math.min(1,new Set(Object.keys(G.pos).map(t=>ST[t].s)).size/m.k);
    case 'profit':return clamp(Math.max(0,...txs.filter(x=>x.s==='V'||x.s==='C').map(x=>x.pl))/m.a,0,1);
    case 'divs':return Math.min(1,txs.filter(x=>x.s==='D').length/m.k);
    case 'beat':{const r=GM().rivals.find(x=>x.id===m.rid);return v>rivalVal(r)?1:clamp(v/rivalVal(r),0,0.99);}
    case 'panic':return txs.some(x=>x.s==='A'&&x.fear>24)?1:0;
    case 'earn':return m.hit?1:0;
    case 'short':return txs.some(x=>x.s==='C'&&x.pl>0)?1:0;
    case 'pro':return proOn()?1:0;
    case 'order':return txs.some(x=>x.prog)?1:0;
    case 'invest':return Math.min(1,(m.streak||0)/15);
    case 'hold':{let best=0;for(const t in G.pos){const first=G.tx.filter(x=>x.t===t&&x.s==='A').slice(-1)[0];if(!first)continue;const age=G.day-first.day,gain=G.pos[t].q*P(t)-G.pos[t].cost;best=Math.max(best,gain>0?Math.min(1,age/60):0);}return best;}
    case 'fav':return Math.min(1,Object.keys(GM().fav||{}).length/3);
  }
  return 0;
}
function checkMissions(){
  const g=GM();
  g.missions.forEach(m=>{
    if(m.done)return;
    if(m.type==='invest'){m.streak=G.cash/Math.max(1,value())<0.2?(m.streak||0)+(m.lastS===G.day?0:1):0;m.lastS=G.day;}
    if(m.type==='earn'){for(const t in G.pos){const o=G.st[t];if(o.lastEarnDay===G.day&&ret(t,1)>0.04)m.hit=1;}}
    if(missionProgress(m)>=1){
      m.done=true;g.done++;g.stats.md[m.type]=(g.stats.md[m.type]||0)+1;SND.ding();confetti(120);
      if(m.cash){G.cash+=m.cash;g.contrib+=m.cash;}
      toast('Mission réussie : '+m.t+(m.cash?' (+'+money0(m.cash)+')':''),'var(--gold)');
      addXP(m.xp);
      m.endDay=G.day;
    }else if(m.deadline&&G.day>m.deadline){g.stats.mf[m.type]=(g.stats.mf[m.type]||0)+1;g.recentFail=g.recentFail||{};const rf=g.recentFail[m.type]||{n:0,d:0};g.recentFail[m.type]={n:G.day-rf.d<300?rf.n+1:1,d:G.day};m.failed=true;m.done=true;toast('Mission expirée : '+m.t,'var(--muted)');m.endDay=G.day;}
  });
  g.missions=g.missions.filter(m=>!m.done||G.day-m.endDay<1);
  const active=g.missions.filter(m=>!m.done).length;
  for(let k=active;k<3;k++)g.missions.push(newMission());
}

/* ---------- rivaux ---------- */
function rBuy(r,t,amt){const p=P(t);const q=Math.floor(Math.min(amt,r.cash)/(p*(1+FEE_RATE)));if(q<1)return;const f=Math.max(1,q*p*FEE_RATE);if(q*p+f>r.cash)return;r.cash-=q*p+f;r.pos[t]=(r.pos[t]||0)+q;}
function rSell(r,t){const q=r.pos[t];if(!q)return;const p=P(t),f=Math.max(1,q*p*FEE_RATE);r.cash+=q*p-f;delete r.pos[t];}
function rRebal(r,list){for(const t in r.pos)if(!list.includes(t))rSell(r,t);if(!list.length)return;const tg=rivalVal(r)/list.length;list.forEach(t=>{const cur=(r.pos[t]||0)*P(t);if(cur<tg*0.8)rBuy(r,t,tg-cur);});}
function rivalStep(){
  const g=GM();
  (G.splits||[]).forEach(x=>g.rivals.forEach(r=>{if(r.pos[x.t])r.pos[x.t]*=x.k;}));
  (G.divs||[]).forEach(x=>g.rivals.forEach(r=>{if(r.pos[x.t])r.cash+=r.pos[x.t]*x.dv;}));
  g.rivals.forEach(r=>{
    if(r.id==='max'&&G.day%21===0){const m=t=>{const a=G.st[t].p;return a[a.length-1]/a[Math.max(0,a.length-127)];};rRebal(r,TK.slice().sort((a,b)=>m(b)-m(a)).slice(0,10));}
    if(r.id==='margaux'&&G.day%63===0){const s=t=>G.st[t].pe/secPE(ST[t].s);rRebal(r,TK.filter(t=>G.st[t].dy>0.01).sort((a,b)=>s(a)-s(b)).slice(0,12));}
    if(r.id==='kevin'&&rnd()<0.08){for(const t in r.pos)rSell(r,t);const L=TK.slice().sort((a,b)=>ret(b,3)-ret(a,3)).slice(0,8).sort(()=>rnd()-0.5).slice(0,4);const part=r.cash/4;L.forEach(t=>rBuy(r,t,part));}
    if(rivalVal(r)<(r.contrib||r.start)*0.25){r.cash+=r.start*0.6;r.contrib=(r.contrib||r.start)+r.start*0.6;r.pos={};r.resets++;say(r.id,r.id==='kevin'?'J\'ai tout perdu… Ma grand-mère me prête de quoi repartir. On ne lâche rien !':'Mauvaise passe. Je repars de zéro.',true);}
  });
}
function say(id,text,toastIt){const g=GM();g.msgs.push({id,text,day:G.day,date:G.date});if(g.msgs.length>80)g.msgs.shift();if(toastIt){const R=RIVALS.find(x=>x.id===id);toast(R.n.split(' ')[0]+' : '+text,R.c);}}
function rivalTalk(){
  const g=GM(),L=board(),me=L.findIndex(x=>x.id==='me');
  const prev=g.lastRank||[];
  if(prev.length){
    L.forEach((x,k)=>{if(x.id==='me')return;const pk=prev.indexOf(x.id),pm=prev.indexOf('me');if(pk>pm&&k<me)say(x.id,pickA(RIVALS.find(r=>r.id===x.id).lines.pass),true);if(pk<pm&&k>me)say(x.id,pickA(RIVALS.find(r=>r.id===x.id).lines.passed),true);});
  }
  g.lastRank=L.map(x=>x.id);
  if(idxRet(1)<-0.03){const r=pickA(RIVALS);say(r.id,pickA(r.lines.crash),true);}
  if(G.day%5===0&&rnd()<0.5){const r=pickA(RIVALS);say(r.id,pickA(rnd()<0.5?r.lines.idle:r.lines.win),false);}
}
function faceSVG(R,size){
  const s=size||52;
  return '<svg class="face" viewBox="0 0 52 52" width="'+s+'" height="'+s+'" aria-hidden="true"><circle cx="26" cy="26" r="26" fill="'+R.c+'"/><circle cx="26" cy="23" r="12" fill="'+R.skin+'"/>'+
  (R.id==='max'?'<path d="M14 20c1-9 23-9 24 0-4-4-20-4-24 0z" fill="'+R.hair+'"/><path d="M15 44c2-8 20-8 22 0" fill="#1c1c1c"/><path d="M24 36l2 6 2-6z" fill="#c0392b"/>':
   R.id==='margaux'?'<path d="M13 26c-2-14 28-14 26 0-2-8-22-10-26 0z" fill="'+R.hair+'"/><path d="M13 26c0 8 2 12 4 14M39 26c0 8-2 12-4 14" stroke="'+R.hair+'" stroke-width="4" fill="none"/><circle cx="21.5" cy="23" r="3.6" fill="none" stroke="#222" stroke-width="1.2"/><circle cx="30.5" cy="23" r="3.6" fill="none" stroke="#222" stroke-width="1.2"/><path d="M15 46c2-8 20-8 22 0" fill="#f4f1ea"/>':
   '<path d="M13 19c2-6 24-9 26 1-6-2-10 0-26-1z" fill="#2f2f2f"/><path d="M12 19h28v-3H12z" fill="#2f2f2f"/><path d="M38 17h7v2h-7z" fill="#2f2f2f"/><path d="M15 46c2-8 20-8 22 0" fill="#f39c12"/>')+
  '<circle cx="21.5" cy="23.5" r="1.5" fill="#222"/><circle cx="30.5" cy="23.5" r="1.5" fill="#222"/><path d="M21 29q5 4 10 0" stroke="#7a3b2e" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>';
}

/* ---------- dilemmes ---------- */
function randStock(f){const L=TK.filter(f||(()=>true));return pickA(L.length?L:TK);}
const DILEMMAS=[
 {id:'taxi',w:3,ok:()=>true,mk:()=>{const t=randStock();return{t,art:'taxi',kick:'Tuyau',title:'Votre chauffeur de taxi a un tuyau',text:'« Croyez-moi, '+ST[t].n+' va s\'envoler. Mon cousin y travaille. » Il vous regarde dans le rétroviseur, très sûr de lui.',ch:[{l:'Acheter pour 10 % de mes liquidités',s:'Un tuyau de taxi… vraiment ?',f:d=>{const amt=G.cash*0.1;quickBuy(d.t,amt);const ok=rnd()<0.3;GM().pend.push({day:G.day+3+Math.floor(rnd()*6),k:'drift',t:d.t,v:ok?0.12:-0.06,n:6,news:ok?ST[d.t].n+' grimpe sans raison apparente':'Le « tuyau » sur '+ST[d.t].n+' fait pschitt'});addXP(10);}},{l:'Le remercier poliment et ignorer',s:'La sagesse a aussi sa récompense.',f:()=>addXP(25,'sagesse')}]};}},
 {id:'foodtruck',w:2,ok:()=>value()>15000,mk:()=>{const a=Math.round(Math.max(1000,value()*0.04)/100)*100;return{a,art:'truck',kick:'Famille',title:'Votre beau-frère lance un food truck',text:'Burgers au homard et sauce secrète. Il lui manque '+money0(a)+'. « Tu récupères le double, garanti. »',ch:[{l:'Investir '+money0(a),s:'Résultat dans environ six mois.',dis:()=>G.cash<a,f:d=>{G.cash-=d.a;const r=rnd();const mult=r<0.15?3:r<0.55?1:0;GM().pend.push({day:G.day+120,k:'payout',amt:d.a*mult,title:mult>=3?'Le food truck cartonne':mult>0?'Le food truck tient le coup':'Le food truck fait faillite',text:mult>=3?'Votre beau-frère vous rend '+money0(d.a*mult)+'. Il ouvre trois restaurants.':mult>0?'Vous récupérez '+money0(d.a*mult)+'. Pas mal pour des burgers.':'Le homard coûtait trop cher. Votre mise est perdue.'});addXP(15);}},{l:'Refuser gentiment',s:'Le prochain repas de famille sera un peu froid.',f:()=>addXP(10)}]};}},
 {id:'structured',w:2,ok:()=>value()>20000,mk:()=>{const a=Math.round(value()*0.1/100)*100;return{a,art:'bank',kick:'Banque privée',title:'Un placement « garanti » à 12 %',text:'Votre banquier vous propose un produit structuré : 12 % en trois mois, capital garanti par une banque d\'investissement dont vous n\'avez jamais entendu parler.',ch:[{l:'Placer '+money0(a),s:'Trop beau pour être vrai ?',dis:()=>G.cash<a,f:d=>{G.cash-=d.a;const ok=rnd()<0.6;GM().pend.push({day:G.day+63,k:'payout',amt:ok?d.a*1.12:d.a*0.4,title:ok?'Le placement garanti a tenu parole':'La banque émettrice fait défaut',text:ok?'Vous récupérez '+money0(d.a*1.12)+'.':'Vous ne récupérez que '+money0(d.a*0.4)+'. « Garanti » avait des astérisques.'});}},{l:'Lire les petites lignes et refuser',s:'Vous avez repéré trois astérisques.',f:()=>addXP(40,'prudence')}]};}},
 {id:'unicorn',w:2,ok:()=>value()>30000,mk:()=>{const a=Math.round(value()*0.05/100)*100;return{a,art:'rocket',kick:'Capital-risque',title:'Une start-up cherche des fonds',text:'Des livraisons par drone pour les pizzas. Le fondateur porte un col roulé et parle de « révolution ». La plupart des start-up échouent, quelques-unes rapportent gros. Ticket d\'entrée : '+money0(a)+'.',ch:[{l:'Investir '+money0(a),s:'Dans environ dix mois : jackpot ou zéro.',dis:()=>G.cash<a,f:d=>{G.cash-=d.a;const r=rnd();const m=r<0.08?10:r<0.3?2:0;GM().pend.push({day:G.day+200,k:'payout',amt:d.a*m,title:m>=10?'La start-up devient une licorne !':m?'La start-up est rachetée':'La start-up ferme ses portes',text:m>=10?'Votre part vaut désormais '+money0(d.a*m)+'.':m?'Vous doublez votre mise : '+money0(d.a*m)+'.':'Les drones se sont révélés allergiques à la pluie. Mise perdue.'});addXP(20);}},{l:'Passer votre tour',s:'Les pizzas arriveront à pied.',f:()=>addXP(10)}]};}},
 {id:'davos',w:2,ok:()=>GM().rank>=1,mk:()=>{const a=Math.round(Math.max(2000,value()*0.01)/100)*100;return{a,art:'mountain',kick:'Invitation',title:'Invitation au forum de Davos',text:'Trois jours dans les Alpes avec des banquiers centraux et des patrons du monde entier. L\'inscription coûte '+money0(a)+'.',ch:[{l:'Y aller ('+money0(a)+')',s:'Réseau, informations et Recherche Pro offerte un mois.',dis:()=>G.cash<a,f:d=>{G.cash-=d.a;G.pro=Math.max(G.pro,G.day)+PRO_DAYS;addXP(90,'réseau');}},{l:'Rester au bureau',s:'Quelqu\'un doit surveiller le marché.',f:()=>{}}]};}},
 {id:'tv',w:2,ok:()=>G.day-G.start>40,mk:()=>({art:'tv',kick:'Médias',title:'Une chaîne financière veut vous interviewer',text:'Ils veulent savoir comment vous gérez votre argent. Votre performance face au marché sera affichée à l\'écran.',ch:[{l:'Accepter l\'interview',s:'Ça dépendra de vos résultats…',f:()=>{const sp=startPos(),perf=value()/G.cap-1,mk=G.idx[G.idx.length-1]/G.idx[sp]-1;if(perf>mk){addXP(120,'interview remarquée');SND.ding();}else{addXP(20,'vous devenez un mème');}}},{l:'Décliner',s:'Pour vivre heureux, vivons cachés.',f:()=>{}}]})},
 {id:'whistle',w:3,ok:()=>true,mk:()=>{const t=randStock();return{t,art:'doc',kick:'Confidentiel',title:'Un lanceur d\'alerte vous contacte',text:'Un ancien cadre de '+ST[t].n+' vous montre des documents troublants sur les comptes. Rien n\'est encore public.',ch:[{l:'Parier à la baisse (vente à découvert)',s:'Réservé aux traders confirmés.',dis:()=>GM().rank<2,f:d=>{sel=d.t;side='S';setTab('cote');renderFiche();toast('Formulaire prêt : vente à découvert sur '+ST[d.t].n+'.','var(--accent)');schedWhistle(d.t);}},{l:'Vendre mes titres '+ST[t].n,s:'Si vous en avez.',f:d=>{if(G.pos[d.t]){sel=d.t;doTrade('V',G.pos[d.t].q);}schedWhistle(d.t);}},{l:'Ne rien faire',s:'Ce n\'est peut-être rien.',f:d=>schedWhistle(d.t)}]};}},
 {id:'gala',w:1,ok:()=>value()>100000,mk:()=>{const a=Math.round(value()*0.01/100)*100;return{a,art:'heart',kick:'Gala',title:'Gala de charité au Metropolitan',text:'Tout le gratin de Manhattan sera là. Un don de '+money0(a)+' ferait sensation.',ch:[{l:'Donner '+money0(a),s:'Prestige et carnet d\'adresses.',dis:()=>G.cash<a,f:d=>{G.cash-=d.a;addXP(130,'générosité remarquée');}},{l:'Envoyer un petit mot',s:'C\'est l\'intention qui compte.',f:()=>addXP(5)}]};}},
 {id:'duel',w:2,ok:()=>GM().rank>=3&&!GM().duel,mk:()=>{const R=pickA(RIVALS);const a=Math.round(Math.max(5000,value()*0.03)/1000)*1000;return{rid:R.id,a,art:'duel',kick:'Défi',title:R.n+' vous lance un défi',text:'« La meilleure performance sur les 20 prochaines séances empoche '+money0(a)+'. Tu es partant ? »',ch:[{l:'Relever le défi',s:'Mise : '+money0(a),dis:()=>G.cash<a,f:d=>{GM().duel={rid:d.rid,a:d.a,end:G.day+20,v0:value(),r0:rivalVal(GM().rivals.find(r=>r.id===d.rid))};say(d.rid,'Que le meilleur gagne !',true);}},{l:'Décliner',s:'Il va s\'en vanter.',f:d=>say(d.rid,'Je savais que tu n\'oserais pas.',true)}]};}},
 {id:'outage',w:1,ok:()=>Object.keys(G.pos).length>0,mk:()=>({art:'plug',kick:'Imprévu',title:'Panne de réseau au bureau',text:'Plus d\'internet. Le technicien demande 800 $ pour intervenir immédiatement. Sinon, vous serez coupé du marché pendant 3 séances.',ch:[{l:'Payer le technicien (800 $)',s:'',dis:()=>G.cash<800,f:()=>{G.cash-=800;}},{l:'Attendre',s:'Impossible de passer des ordres pendant 3 séances.',f:()=>{GM().lock=G.day+3;}}]})},
 {id:'crypto',w:2,ok:()=>value()>15000,mk:()=>{const a=Math.round(Math.max(1000,value()*0.05)/100)*100;return{a,art:'coin',kick:'Cryptomonnaie',title:'Votre cousin ne jure que par le MoonCoin',text:'« Il a pris 400 % en un mois, et ce n\'est que le début ! » Il vous montre des graphiques en forme de fusée.',ch:[{l:'Acheter pour '+money0(a),s:'Volatil, c\'est le moins qu\'on puisse dire.',dis:()=>G.cash<a,f:d=>{G.cash-=d.a;const r=rnd();const m=r<0.25?3.5:r<0.45?1:0.15;GM().pend.push({day:G.day+40+Math.floor(rnd()*60),k:'payout',amt:d.a*m,title:m>3?'Le MoonCoin décolle !':m>=1?'Le MoonCoin fait du surplace':'Le MoonCoin s\'écrase',text:m>3?'Vous revendez pour '+money0(d.a*m)+'. Votre cousin est insupportable.':m>=1?'Vous récupérez votre mise, '+money0(d.a*m)+'. Beaucoup de stress pour rien.':'Il ne reste que '+money0(d.a*m)+'. Votre cousin ne répond plus au téléphone.'});addXP(10);}},{l:'Rester sur les actions',s:'Les fusées redescendent aussi.',f:()=>addXP(20)}]};}},
 {id:'kevinloan',w:2,ok:()=>G.cash>8000,mk:()=>{const a=5000;return{a,art:'duel',kick:'Rival',title:'Kevin vous demande un prêt',text:'« J\'ai un coup en or, mais plus de liquidités. Prête-moi 5 000 $, je te rends 7 500 $ dans deux mois. Promis. »',ch:[{l:'Lui prêter 5 000 $',s:'C\'est Kevin…',dis:()=>G.cash<a,f:d=>{G.cash-=d.a;const ok=rnd()<0.5;GM().pend.push({day:G.day+42,k:'payout',amt:ok?7500:0,title:ok?'Kevin rembourse !':'Kevin est injoignable',text:ok?'Contre toute attente, Kevin vous rend 7 500 $. Il est très fier de lui.':'Kevin a « tout misé sur un truc sûr ». Votre prêt est perdu.'});say('kevin','Merci frérot, tu ne le regretteras pas !',true);}},{l:'Refuser',s:'Il va bouder.',f:()=>say('kevin','Ok… je trouverai ailleurs.',true)}]};}},
 {id:'margauxtip',w:2,ok:()=>G.day-G.start>60,mk:()=>{const t=TK.slice().sort((a,b)=>(G.st[b].fairNow/G.st[b].pe)-(G.st[a].fairNow/G.st[a].pe))[Math.floor(rnd()*6)];return{t,art:'glasses',kick:'Rival',title:'Margaux partage une idée',text:'« Entre nous, je trouve '+ST[t].n+' sous-évaluée. Je ne dis pas ça à tout le monde. » Est-elle sincère ?',ch:[{l:'Acheter pour 15 % de mes liquidités',s:'Margaux se trompe rarement… mais elle est votre rivale.',f:d=>{quickBuy(d.t,G.cash*0.15);addXP(15);}},{l:'Noter l\'idée et regarder la fiche',s:'Vérifier avant d\'agir.',f:d=>{sel=d.t;setTab('cote');renderFiche();addXP(20,'esprit critique');}}]};}},
 {id:'mentor',w:1,ok:()=>GM().rank<=2,mk:()=>{const a=3000;return{a,art:'book',kick:'Formation',title:'Un vieux trader propose de vous former',text:'Quarante ans de marchés, trois krachs et une collection de cravates. Ses cours du soir coûtent 3 000 $.',ch:[{l:'Suivre la formation (3 000 $)',s:'Beaucoup d\'expérience d\'un coup.',dis:()=>G.cash<a,f:d=>{G.cash-=d.a;addXP(220,'formation');}},{l:'Apprendre sur le tas',s:'Gratuit, mais plus lent.',f:()=>{}}]};}},
 {id:'insider',w:2,ok:()=>G.day-G.start>40,mk:()=>{const t=randStock();return{t,art:'doc',kick:'Délit d\'initié ?',title:'Un ami siège au conseil de '+ST[t].n,text:'Au dîner, il laisse entendre que de très bons résultats arrivent. C\'est une information privilégiée : l\'utiliser est illégal.',ch:[{l:'Acheter quand même',s:'Le régulateur surveille les achats suspects.',f:d=>{quickBuy(d.t,G.cash*0.2);GM().pend.push({day:G.day+5,k:'drift',t:d.t,v:0.1,n:3,news:ST[d.t].n+' publie des résultats remarquables'});if(rnd()<0.45)GM().pend.push({day:G.day+30,k:'payout',amt:-Math.round(value()*0.08),title:'Le régulateur vous inflige une amende',text:'Vos achats juste avant l\'annonce ont été repérés. Amende : 8 % de votre fortune.'});}},{l:'Refuser et changer de sujet',s:'Intégrité.',f:()=>addXP(60,'intégrité')}]};}},
 {id:'audit',w:1,ok:()=>G.tx.length>20,mk:()=>{const a=Math.round(value()*0.01);return{a,art:'bank',kick:'Impôts',title:'Le fisc vous contrôle',text:'Vos nombreuses opérations ont attiré l\'attention. Votre comptable propose de régler '+money0(a)+' à l\'amiable.',ch:[{l:'Régler à l\'amiable ('+money0(a)+')',s:'Tranquillité.',f:d=>{G.cash-=d.a;}},{l:'Contester',s:'Une chance sur deux de ne rien payer… ou de payer trois fois plus.',f:d=>{const win=rnd()<0.5;GM().pend.push({day:G.day+30,k:'payout',amt:win?0:-d.a*3,title:win?'Contrôle fiscal : vous avez gain de cause':'Contrôle fiscal : redressement',text:win?'Le fisc abandonne les poursuites.':'Vous devez payer '+money0(d.a*3)+'.'});}}]};}},
 {id:'vacation',w:1,ok:()=>G.day-G.start>120,mk:()=>{const a=Math.round(Math.max(2000,value()*0.01));return{a,art:'sun',kick:'Repos',title:'Des vacances aux Maldives ?',text:'Vous n\'avez pas pris un jour depuis des mois. Une semaine au soleil coûte '+money0(a)+', et vous ne pourrez pas trader pendant 5 séances.',ch:[{l:'Partir (+ énergie)',s:'Le marché continuera sans vous.',dis:()=>G.cash<a,f:d=>{G.cash-=d.a;GM().lock=G.day+5;addXP(70,'batteries rechargées');}},{l:'Rester connecté',s:'Le travail avant tout.',f:()=>{}}]};}},
 {id:'book',w:1,ok:()=>GM().rank>=3,mk:()=>({art:'book',kick:'Édition',title:'Un éditeur veut publier vos mémoires',text:'« De stagiaire à requin de Wall Street ». Il propose une avance de 25 000 $, mais il faudra raconter vos pires erreurs.',ch:[{l:'Signer le contrat',s:'Avance versée à la publication.',f:()=>{GM().pend.push({day:G.day+90,k:'payout',amt:25000+(rnd()<0.2?100000:0),title:'Votre livre sort en librairie',text:'Avance encaissée. Si le livre est un succès, des droits suivront.'});addXP(60);}},{l:'Garder vos secrets',s:'',f:()=>{}}]})}
];
function schedWhistle(t){const ok=rnd()<0.6;GM().pend.push({day:G.day+4+Math.floor(rnd()*8),k:'drift',t,v:ok?-0.28:0.03,n:4,news:ok?'Scandale chez '+ST[t].n+' : les comptes étaient maquillés':'Fausse alerte chez '+ST[t].n+' : les comptes sont validés',big:ok});}
function quickBuy(t,amt){const p=P(t);const q=Math.floor(amt/(p*(1+FEE_RATE)));if(q>=1){sel=t;doTrade('A',q,true);}}
function pickDilemma(){const g=GM();let L=DILEMMAS.filter(d=>d.ok()&&G.day-(g.cool[d.id]??-9999)>260);if(!L.length)L=DILEMMAS.filter(d=>d.ok());let tot=L.reduce((a,d)=>a+d.w,0),r=rnd()*tot;for(const d of L){r-=d.w;if(r<=0)return d;}return L[0];}
const ART={
 coin:['#f39c12','<circle cx="60" cy="56" r="34" fill="#ffd56b" stroke="#fff" stroke-width="5"/><text x="60" y="68" text-anchor="middle" font-size="34" font-weight="800" fill="#b9770e">M</text><path d="M96 20l8-8M100 30l12-4M88 14l2-10" stroke="#fff" stroke-width="4" stroke-linecap="round"/>'],
 glasses:['#2e86ab','<circle cx="40" cy="58" r="18" fill="none" stroke="#fff" stroke-width="6"/><circle cx="82" cy="58" r="18" fill="none" stroke="#fff" stroke-width="6"/><path d="M58 56q3-4 6 0M22 54l-10-6M100 54l10-6" stroke="#fff" stroke-width="6" stroke-linecap="round" fill="none"/>'],
 book:['#8e44ad','<path d="M20 30q20-10 40 0v60q-20-10-40 0z" fill="#fff"/><path d="M100 30q-20-10-40 0v60q20-10 40 0z" fill="#f4f1ea"/><g stroke="#c8a2d6" stroke-width="3"><path d="M28 44h22M28 54h22M70 44h22M70 54h22"/></g>'],
 sun:['#00b4d8','<circle cx="78" cy="34" r="16" fill="#ffd56b"/><path d="M0 84q30-14 60 0t60 0v26H0z" fill="#f4e1b0"/><path d="M36 84c2-20-2-34-8-46" stroke="#6b4a2b" stroke-width="4" fill="none"/><g fill="#2e8b57"><ellipse cx="20" cy="38" rx="14" ry="5"/><ellipse cx="38" cy="36" rx="14" ry="5"/></g>'],
 taxi:['#f4c430','<rect x="20" y="52" width="80" height="34" rx="8" fill="#1c1c1c"/><rect x="30" y="38" width="58" height="22" rx="6" fill="#1c1c1c"/><rect x="36" y="42" width="20" height="14" rx="3" fill="#9fd3f5"/><rect x="62" y="42" width="20" height="14" rx="3" fill="#9fd3f5"/><circle cx="38" cy="88" r="8" fill="#333"/><circle cx="82" cy="88" r="8" fill="#333"/><rect x="50" y="30" width="18" height="8" rx="2" fill="#fff"/>'],
 truck:['#e8735a','<rect x="14" y="40" width="70" height="44" rx="6" fill="#fff"/><rect x="84" y="54" width="22" height="30" rx="4" fill="#fff"/><rect x="24" y="48" width="40" height="18" rx="3" fill="#2b2b2b"/><circle cx="34" cy="88" r="8" fill="#2b2b2b"/><circle cx="90" cy="88" r="8" fill="#2b2b2b"/><path d="M30 40l8-12h30l8 12" fill="#f4c430"/>'],
 bank:['#2e86ab','<path d="M60 20l42 20H18z" fill="#fff"/><rect x="22" y="44" width="76" height="6" fill="#fff"/><g fill="#fff"><rect x="28" y="52" width="8" height="30"/><rect x="48" y="52" width="8" height="30"/><rect x="64" y="52" width="8" height="30"/><rect x="84" y="52" width="8" height="30"/></g><rect x="18" y="84" width="84" height="8" fill="#fff"/><text x="60" y="40" text-anchor="middle" font-size="12" font-weight="700" fill="#2e86ab">12 %*</text>'],
 rocket:['#6c5ce7','<path d="M60 14c18 14 20 40 12 62H48c-8-22-6-48 12-62z" fill="#fff"/><circle cx="60" cy="44" r="8" fill="#6c5ce7"/><path d="M48 70l-12 16 16-4zM72 70l12 16-16-4z" fill="#f4c430"/><path d="M52 78l8 22 8-22z" fill="#ff7b54"/>'],
 mountain:['#74b9ff','<path d="M8 96l36-56 18 26 14-18 36 48z" fill="#fff"/><path d="M44 40l8 12-8-4-8 4z" fill="#dfe6e9"/><circle cx="90" cy="30" r="10" fill="#ffeaa7"/>'],
 tv:['#e17055','<rect x="16" y="28" width="88" height="58" rx="8" fill="#2d3436"/><rect x="24" y="35" width="72" height="44" rx="4" fill="#74b9ff"/><path d="M30 70l14-12 12 8 18-18 14 12" stroke="#fff" stroke-width="4" fill="none"/><path d="M48 92h24" stroke="#2d3436" stroke-width="6" stroke-linecap="round"/>'],
 doc:['#2d3436','<rect x="30" y="16" width="60" height="80" rx="6" fill="#fff"/><g stroke="#b2bec3" stroke-width="4"><path d="M40 34h40M40 46h40M40 58h26"/></g><rect x="38" y="66" width="44" height="12" fill="#d63031" transform="rotate(-12 60 72)"/><text x="60" y="76" text-anchor="middle" font-size="9" font-weight="800" fill="#fff" transform="rotate(-12 60 72)">CONFIDENTIEL</text>'],
 heart:['#fd79a8','<path d="M60 92C20 64 18 40 36 30c10-6 20 0 24 8 4-8 14-14 24-8 18 10 16 34-24 62z" fill="#fff"/>'],
 duel:['#e4572e','<path d="M26 92l52-62M94 92L42 30" stroke="#fff" stroke-width="8" stroke-linecap="round"/><circle cx="60" cy="60" r="10" fill="#f4c430"/>'],
 plug:['#636e72','<rect x="40" y="20" width="40" height="40" rx="8" fill="#fff"/><path d="M50 20V8M70 20V8" stroke="#fff" stroke-width="6" stroke-linecap="round"/><path d="M60 60v30" stroke="#fff" stroke-width="6"/><path d="M30 30l60 60" stroke="#d63031" stroke-width="7" stroke-linecap="round"/>']
};
let curEvent=null;
function showDilemma(){
  const D=pickDilemma(),d=D.mk();curEvent={D,d};GM().stats.dil++;GM().cool[D.id]=G.day;GM().stats.last=D.id;
  const a=ART[d.art]||ART.doc;
  $('#evDlg').innerHTML='<div class="ev-art" style="background:'+a[0]+'"><span class="ev-kicker">'+d.kick+'</span><svg viewBox="0 0 120 110" aria-hidden="true">'+a[1]+'</svg></div><div class="dlg-body"><h2 id="evTitle" style="font-size:28px">'+esc(d.title)+'</h2><p style="margin:8px 0 0;color:var(--muted)">'+esc(d.text)+'</p><div class="choices">'+d.ch.map((c,k)=>'<button class="choice" data-c="'+k+'"'+(c.dis&&c.dis()?' disabled':'')+'><b>'+esc(c.l)+'</b>'+(c.s?'<small>'+esc(c.s)+'</small>':'')+'</button>').join('')+'</div></div>';
  $('#mEvent').hidden=false;SND.bell();
  const first=$('#evDlg .choice:not([disabled])');if(first)first.focus();
}
$('#mEvent').addEventListener('click',e=>{const b=e.target.closest('.choice');if(!b||b.disabled||!curEvent)return;const c=curEvent.d.ch[+b.dataset.c];$('#mEvent').hidden=true;c.f(curEvent.d);curEvent=null;save();renderAll();nextPopup();});

/* ---------- grands événements de marché ---------- */
const SPECIALS=[
 {id:'ai',t:'Fièvre de l\'intelligence artificielle',x:'Les investisseurs se ruent sur tout ce qui touche à l\'IA. Les semi-conducteurs et la tech s\'envolent. Jusqu\'où ?',sec:{'Semi-conducteurs':0.45,'Technologie':0.2},bubble:true,after:[90,140],burst:{t:'La bulle de l\'IA éclate',x:'Les promesses tardent à se concrétiser. Les valeurs qui avaient flambé dégringolent.',sec:{'Semi-conducteurs':-0.4,'Technologie':-0.18}}},
 {id:'pandemic',t:'Une épidémie se propage dans le monde',x:'Frontières fermées, avions cloués au sol. Le tourisme et le transport s\'effondrent, la santé résiste.',mk:-0.07,sec:{'Tourisme':-0.35,'Transport':-0.3,'Santé':0.12,'Distribution':0.05},after:[70,110],burst:{t:'Fin de l\'épidémie : la vie reprend',x:'Les restrictions sont levées. Les secteurs sinistrés rebondissent violemment.',sec:{'Tourisme':0.35,'Transport':0.28}}},
 {id:'oil',t:'Choc pétrolier',x:'Une crise au Moyen-Orient fait bondir le baril. L\'énergie flambe, le transport souffre.',mk:-0.03,sec:{'Énergie':0.28,'Matières premières':0.15,'Transport':-0.2,'Tourisme':-0.12,'Automobile':-0.1},oil:1.5},
 {id:'stimulus',t:'Plan de relance géant à Washington',x:'Des milliers de milliards pour les infrastructures. L\'industrie et les matériaux en tête.',mk:0.04,sec:{'Industrie':0.15,'Matières premières':0.18,'Banque':0.06}},
 {id:'bankpanic',t:'Panique bancaire',x:'Une banque régionale s\'effondre en 48 heures. La contagion inquiète tout le secteur financier.',mk:-0.05,sec:{'Banque':-0.22,'Finance':-0.12},after:[40,60],burst:{t:'Les banques respirent',x:'La banque centrale garantit les dépôts. Le secteur se redresse.',sec:{'Banque':0.14,'Finance':0.07}}},
 {id:'gold',t:'Ruée vers l\'or',x:'La peur de l\'inflation pousse les investisseurs vers les métaux. Les minières s\'envolent.',sec:{'Matières premières':0.3}},
 {id:'merger',t:'Méga-fusion annoncée',x:'',merger:true},
 {id:'cyber',t:'Cyberattaque mondiale',x:'Des milliers d\'entreprises paralysées. La tech vacille, mais la cybersécurité deviendra une priorité.',mk:-0.025,sec:{'Technologie':-0.1,'Médias':-0.06,'Finance':-0.05},after:[30,50],burst:{t:'Après la cyberattaque, les budgets explosent',x:'Les entreprises investissent massivement dans leurs systèmes. La tech repart.',sec:{'Technologie':0.12}}}
];
function shockStock(t,size,days,perm){const o=G.st[t];if(perm)o.fair*=Math.exp(size);o.pe*=Math.exp(size*0.45);o.drift.push({v:size*0.55/days,n:days});}
function applyShock(spec,perm){
  if(spec.mk)TK.forEach(t=>shockStock(t,spec.mk*ST[t].b,3,perm));
  if(spec.sec)for(const s in spec.sec)TK.filter(t=>ST[t].s===s).forEach(t=>shockStock(t,spec.sec[s]*(0.7+rnd()*0.6),spec.bubble?40:12,perm));
  if(spec.oil)G.macro.oil*=spec.oil;
}
function special(){
  const S=pickA(SPECIALS);GM().stats.spec++;
  if(S.merger){const a=randStock(),b=randStock(t=>t!==a&&ST[t].s===ST[a].s);shockStock(b,0.3,2,true);shockStock(a,-0.05,3,true);G.st[b].g+=0.02;breaking({title:ST[a].n+' rachète '+ST[b].n,x:'Une offre avec une prime de 30 %. Les actionnaires de '+ST[b].n+' jubilent.',tk:b,good:true});return;}
  applyShock(S,!S.bubble);
  breaking({title:S.t,x:S.x,good:(S.mk||0)>=0&&!S.burst});
  if(S.after){GM().pend.push({day:G.day+S.after[0]+Math.floor(rnd()*(S.after[1]-S.after[0])),k:'burst',id:S.id});}
}
function breaking(n){
  addGameNews({title:n.title,x:n.x,tk:n.tk,big:true});
  const el=$('#breaking');el.innerHTML='<div class="in'+(n.good?' gold':'')+'" role="alert"><div class="k"><span>FLASH SPÉCIAL</span><span>'+dShort(G.date)+'</span></div><h2>'+esc(n.title)+'</h2><p>'+esc(n.x)+'</p></div>';
  if(!n.good){document.body.classList.remove('shake','redflash');void document.body.offsetWidth;document.body.classList.add('shake','redflash');SND.bad();}else SND.bell();
  breaking.hit=1;clearTimeout(breaking.tm);breaking.tm=setTimeout(()=>el.innerHTML='',4500);
  if(auto)stopAuto();
}
$('#breaking').addEventListener('click',()=>$('#breaking').innerHTML='');
function addGameNews(n){G.news.push(Object.assign({cat:'jeu',day:G.day,date:G.date,id:++G.seq},n));}
function preStep(){ // effets à appliquer avant que la séance ne soit calculée
  const g=GM(),due=g.pend.filter(p=>!p.fired&&p.day<=G.day+1&&(p.k==='drift'||p.k==='burst'));
  due.forEach(p=>{
    if(p.k==='drift'){const o=G.st[p.t];o.fair*=Math.exp(p.v*0.8);o.pe*=Math.exp(p.v*0.4);o.drift.push({v:p.v*0.6/p.n,n:p.n});p.fired=1;}
    if(p.k==='burst'){const S=SPECIALS.find(s=>s.id===p.id);applyShock(S.burst,true);p.fired=1;}
  });
}
function postStep(){
  const g=GM();
  g.pend.forEach(p=>{
    if(!p.fired&&p.k==='payout'&&p.day<=G.day){G.cash+=p.amt;GM().stats.pay.push(p.amt);p.fired=1;info('<div class="dlg-top"><h2 id="infoTitle">'+esc(p.title)+'</h2></div><div class="dlg-body"><p>'+esc(p.text)+'</p><div class="dlg-act"><button class="btn go" data-close>Continuer</button></div></div>');if(p.amt>0){SND.cash();confetti(80);}else SND.bad();}
    if(p.fired===1&&p.k==='drift'){p.fired=2;addGameNews({title:p.news,x:'',tk:p.t,big:p.big});}
    if(p.fired===1&&p.k==='burst'){p.fired=2;const S=SPECIALS.find(s=>s.id===p.id);breaking({title:S.burst.t,x:S.burst.x,good:Object.values(S.burst.sec).reduce((a,b)=>a+b,0)>0});}
  });
  g.pend=g.pend.filter(p=>p.fired!==2&&!(p.k==='payout'&&p.fired));
  // duel
  if(g.duel&&G.day>=g.duel.end){const d=g.duel,r=g.rivals.find(x=>x.id===d.rid),me=value()/d.v0-1,him=rivalVal(r)/d.r0-1;const R=RIVALS.find(x=>x.id===d.rid);
    if(me>him){G.cash+=d.a;addXP(150);g.flags.duel=1;info('<div class="dlg-top"><h2 id="infoTitle">Défi remporté contre '+esc(R.n)+'</h2></div><div class="dlg-body"><p>Vous avez fait '+pct1(me)+' contre '+pct1(him)+'. Vous empochez '+money0(d.a)+'.</p><div class="dlg-act"><button class="btn go" data-close>Savourer</button></div></div>');SND.fanfare();confetti(160);say(d.rid,'Pfff. Revanche quand tu veux.',false);}
    else{G.cash-=d.a;info('<div class="dlg-top"><h2 id="infoTitle">Défi perdu contre '+esc(R.n)+'</h2></div><div class="dlg-body"><p>Vous avez fait '+pct1(me)+' contre '+pct1(him)+'. Vous lui versez '+money0(d.a)+'.</p><div class="dlg-act"><button class="btn go" data-close>La prochaine fois</button></div></div>');SND.bad();say(d.rid,pickA(R.lines.win),true);}
    g.duel=null;}
  // informateur
  if(g.rank>=4&&G.day%21===0){const t=TK.slice().sort((a,b)=>(G.st[b].fairNow/G.st[b].pe)-(G.st[a].fairNow/G.st[a].pe))[Math.floor(rnd()*5)];addGameNews({title:'Votre informateur : regardez du côté de '+ST[t].n,x:'« Le marché la sous-estime. Faites-moi confiance. »',tk:t,big:false});toast('Un tuyau de votre informateur sur '+ST[t].n+'.','var(--gold)');}
  // paie mensuelle et prime annuelle
  const el=G.day-G.start;
  if(el>0&&el%21===0){const s=Math.round(SAL[g.rank]*DIFF.sal[dif()]);G.cash+=s;g.contrib+=s;G.tx.push({day:G.day,date:G.date,t:null,s:'W',q:1,p:s,f:0,pl:s,item:'Salaire'});toast('Jour de paie : +'+money0(s)+' sur votre compte.','var(--up)');SND.cash();
    g.rivals.forEach(r=>{const rs=Math.round(SAL[Math.min(5,Math.floor(el/252*1.7))]*DIFF.rsal[dif()]);r.cash+=rs;r.contrib=(r.contrib||r.start)+rs;});}
  if(el>0&&el%252===0){const sp=Math.max(0,G.dates.length-253);const mk=G.idx[G.idx.length-1]/G.idx[sp]-1;const k=G.vals.length-253;const dep=g.contrib-(g.cYear??G.cap);const me=k>=0?(value()-dep)/G.vals[k]-1:0;const out=Math.min(0.3,Math.max(0,me-mk));g.cYear=g.contrib;g.rivals.forEach(r=>{const rv=rivalVal(r),pr=(rv-((r.contrib||r.start)-(r.cYear??r.start)))/(r.vYear||r.start)-1;const rb=Math.round(SAL[Math.min(5,Math.floor(el/252*1.7))]*3*(1+5*Math.min(0.3,Math.max(0,pr-mk))));r.cash+=rb;r.contrib=(r.contrib||r.start)+rb;r.cYear=r.contrib;r.vYear=rivalVal(r);});const b=Math.round(SAL[g.rank]*3*(1+5*out));G.cash+=b;g.contrib+=b;g.cYear=g.contrib;G.tx.push({day:G.day,date:G.date,t:null,s:'W',q:1,p:b,f:0,pl:b,item:'Prime annuelle'});ceremony(b,out,me,mk);if(out>0)addXP(Math.min(400,Math.round(out*1000)),'année au-dessus du marché');}
  if(el%5===0){g.hist.push({d:G.date,me:value(),r:g.rivals.map(r=>rivalVal(r))});if(g.hist.length>700)g.hist=g.hist.filter((x,k)=>k%2===0);}
  // semaine
  if((G.day-G.start)%5===0){const v=value(),m=G.idx[G.idx.length-1];if(v/g.weekV>m/g.weekM&&G.tx.length)addXP(15);g.weekV=v;g.weekM=m;}
  // déclencheurs
  if(G.day>=g.nextEvent){g.nextEvent=G.day+20+Math.floor(rnd()*16);evQueue.push('dilemma');}
  if(G.day>=g.nextSpecial){g.nextSpecial=G.day+90+Math.floor(rnd()*110);special();}
}
let evQueue=[];

/* ---------- vente à découvert : dividendes, divisions, appel de marge ---------- */
function shortsStep(){
  const S=GM().shorts;
  (G.splits||[]).forEach(x=>{if(S[x.t]){S[x.t].q*=x.k;S[x.t].entry/=x.k;}});
  (G.divs||[]).forEach(x=>{if(S[x.t]){G.cash-=S[x.t].q*x.dv;}});
  for(const t in S)G.cash-=S[t].q*P(t)*0.0002; // coût d'emprunt des titres
  const liab=shortLiab();
  if(liab>0&&value()<liab*0.25){for(const t in S)coverShort(t,S[t].q,true);info('<div class="dlg-top" style="background:#b3261e"><h2 id="infoTitle">Appel de marge !</h2></div><div class="dlg-body"><p>Vos paris à la baisse ont trop mal tourné. Le courtier a racheté toutes vos positions à découvert d\'office.</p><div class="dlg-act"><button class="btn go" data-close>Aïe</button></div></div>');SND.bad();}
}
function coverShort(t,q,forced){const S=GM().shorts,o=S[t];if(!o)return;q=Math.min(q,o.q);const p=P(t),g=q*p,f=Math.max(FEE_MIN,g*FEE_RATE),pl=q*(o.entry-p)-f;G.cash-=g+f;o.q-=q;if(!o.q)delete S[t];G.tx.push({day:G.day,date:G.date,t,s:'C',q,p,f,pl,fear:G.macro.fear});if(!forced)toast('Rachat de '+nf0.format(q)+' '+ST[t].n+' : '+(pl>=0?'gain':'perte')+' de '+money(Math.abs(pl))+'.',pl>=0?'var(--up)':'var(--down)');if(pl>0)SND.cash();}

/* =====================================================================
   SCÈNE : la ligne d'horizon
   ===================================================================== */
const SKY={b:[],w:0,h:0,t:0,heights:{},jet:-300,run:false,mood:'calm',seed:7,fw:[]};
function skyFireworks(n){for(let k=0;k<(n||4);k++)SKY.fw.push({x:SKY.w*(0.15+rnd()*0.7),y:SKY.h-30,ty:20+rnd()*SKY.h*0.35,vy:-(4+rnd()*2),c:pickA(['#ffd76a','#ff6b6b','#6bd6ff','#9bff8a','#ffffff']),delay:k*12,parts:null});}
function srand(s){return function(){s=(s*16807)%2147483647;return(s-1)/2147483646;};}
function skyBuild(){
  const cv=$('#sky'),r=cv.getBoundingClientRect();SKY.w=r.width;SKY.h=r.height;const dpr=Math.min(2,devicePixelRatio||1);cv.width=r.width*dpr;cv.height=r.height*dpr;cv.getContext('2d').setTransform(dpr,0,0,dpr,0,0);
  const R=srand(42);SKY.far=[];SKY.near=[];
  for(let x=-10;x<SKY.w+40;){const w=24+R()*46;SKY.far.push({x,w,h:40+R()*110,ant:R()<0.15});x+=w+2;}
  for(let x=-10;x<SKY.w+40;){const w=30+R()*50;SKY.near.push({x,w,h:30+R()*85,seed:Math.floor(R()*1e6),roof:R()<0.3?1:R()<0.5?2:0});x+=w+R()*8;}
}
function towerH(v){return clamp(46+36*Math.log10(Math.max(1000,v)/10000),26,SKY.h-40);}
function moodNow(){const f=G.macro.fear,d=idxRet(1);if(f>30||d<-0.03)return'storm';if(G.macro.reg==='recession')return'night';if(d>0.004)return'gold';if(d<-0.004)return'dusk';return'calm';}
const PAL={gold:['#1d2b53','#7e4f7a','#f3a65a'],calm:['#132544','#2f5a8a','#9cc3df'],dusk:['#1b1430','#4a2747','#c0606a'],night:['#070b16','#131d36','#2c3a5c'],storm:['#0e1117','#262c36','#4f5864']};
function skyDraw(){
  if(!G||!SKY.w)return;
  const cv=$('#sky'),c=cv.getContext('2d'),W=SKY.w,H=SKY.h,t=SKY.t,mood=SKY.mood,p=PAL[mood];
  const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,p[0]);g.addColorStop(0.6,p[1]);g.addColorStop(1,p[2]);c.fillStyle=g;c.fillRect(0,0,W,H);
  // soleil ou lune selon le jour de la semaine
  const wd=dObj(G.date).getUTCDay(),fx=(wd-1)/4,sx=W*(0.12+fx*0.76),sy=H*0.62-Math.sin(Math.PI*(0.15+fx*0.7))*H*0.42;
  if(mood==='gold'||mood==='calm'){c.fillStyle=mood==='gold'?'rgba(255,214,140,.95)':'rgba(255,248,220,.9)';c.beginPath();c.arc(sx,sy,mood==='gold'?26:18,0,7);c.fill();c.fillStyle='rgba(255,220,150,.12)';c.beginPath();c.arc(sx,sy,60,0,7);c.fill();}
  else if(mood!=='storm'){c.fillStyle='rgba(240,240,255,.85)';c.beginPath();c.arc(sx,sy,14,0,7);c.fill();c.fillStyle=p[0];c.beginPath();c.arc(sx+6,sy-4,13,0,7);c.fill();
    const R=srand(9);c.fillStyle='rgba(255,255,255,.7)';for(let k=0;k<60;k++){const x=R()*W,y=R()*H*0.5;if((k+Math.floor(t/20))%7)c.fillRect(x,y,1.3,1.3);}}
  // nuages
  const cl=mood==='storm'?'rgba(60,66,78,.55)':mood==='night'?'rgba(120,130,160,.10)':'rgba(255,255,255,.16)';
  c.fillStyle=cl;for(let k=0;k<6;k++){const sp=0.12+(k%3)*0.08,x=((k*263+t*sp)%(W+260))-130,y=18+k*13+(k%2)*8,sz=26+(k*7)%22;
    c.beginPath();c.ellipse(x,y,sz*1.8,sz*0.45,0,0,7);c.ellipse(x+sz*0.8,y-6,sz,sz*0.5,0,0,7);c.ellipse(x-sz*0.7,y-3,sz*0.9,sz*0.4,0,0,7);c.fill();}
  // jet
  if(GM().items.jet){SKY.jet+=1.6;if(SKY.jet>W+200)SKY.jet=-200;const jx=SKY.jet,jy=H*0.22;c.fillStyle='rgba(255,255,255,.9)';c.beginPath();c.moveTo(jx,jy);c.lineTo(jx-34,jy-3);c.lineTo(jx-34,jy+3);c.closePath();c.fill();c.fillRect(jx-24,jy-9,6,18);c.strokeStyle='rgba(255,255,255,.25)';c.lineWidth=2;c.beginPath();c.moveTo(jx-36,jy);c.lineTo(jx-160,jy+4);c.stroke();}
  const ground=H-28;
  // arrière-plan
  c.fillStyle=mood==='storm'?'#20252e':'rgba(18,26,48,.75)';
  SKY.far.forEach(b=>{c.fillRect(b.x,ground-b.h,b.w,b.h);if(b.ant)c.fillRect(b.x+b.w/2-1,ground-b.h-16,2,16);});
  // tours des joueurs
  const L=board(),slots=W<720?[0.2,0.42,0.62,0.82]:[0.31,0.44,0.56,0.68];
  const order=['me','max','margaux','kevin'];
  const towers=order.map((id,k)=>{const e=L.find(x=>x.id===id);const tgt=towerH(e.v);SKY.heights[id]=SKY.heights[id]==null?tgt:SKY.heights[id]+(tgt-SKY.heights[id])*0.08;return{id,x:W*slots[k],h:SKY.heights[id],v:e.v,rank:L.indexOf(e)+1};});
  // premier plan générique
  SKY.near.forEach(b=>{if(towers.some(T=>Math.abs(b.x+b.w/2-T.x)<48))return;drawBuilding(c,b.x,ground-b.h,b.w,b.h,'#0d1322',b.seed,'rgba(255,214,140,',0.35,t);});
  towers.forEach(T=>{
    const me=T.id==='me',w=me?58:48,x=T.x-w/2,y=ground-T.h;
    const R=me?null:RIVALS.find(r=>r.id===T.id);
    drawBuilding(c,x,y,w,T.h,me?'#1a1a1a':'#121a2c',me?123:T.id.length*999,me?'rgba(255,205,90,':'rgba(200,220,255,',me?0.85:0.55,t,me);
    // couronne
    c.fillStyle=me?'#e0a526':R.c;c.fillRect(x,y-4,w,4);
    if(me&&(GM().items.penthouse||GM().rank>=5)){c.fillStyle='rgba(255,210,100,'+(0.6+0.3*Math.sin(t/12))+')';c.beginPath();c.moveTo(x+4,y-4);c.lineTo(x+w/2,y-30);c.lineTo(x+w-4,y-4);c.closePath();c.fill();}
    if(me&&GM().rank>=5){c.fillStyle='#ffd76a';c.fillRect(T.x-1,y-52,2,22);c.beginPath();c.arc(T.x,y-54,3+Math.sin(t/8),0,7);c.fill();}
    // étiquette
    const lab=T.rank+'. '+(me?'Vous':R.n.split(' ')[0])+'  '+short$(T.v);c.font='600 12px '+(getComputedStyle(document.body).fontFamily);const tw=c.measureText(lab).width+16;
    const lx=clamp(T.x-tw/2,4,W-tw-4),ly=Math.max(4,y-(me&&GM().items.penthouse?58:32));
    c.fillStyle=me?'#e0a526':'rgba(10,15,28,.75)';roundRect(c,lx,ly,tw,20,10);c.fill();
    c.fillStyle=me?'#2a1d02':'#fff';c.textBaseline='middle';c.fillText(lab,lx+8,ly+10.5);c.textBaseline='alphabetic';
  });
  // panneau lumineux (masqué sur téléphone, où il chevaucherait la fortune)
  if(W>=720){const bx=W<720?W*0.04:W*0.8,bw2=Math.min(150,W*0.26),by=W<720?ground-150:ground-185;
  c.fillStyle='#0a0d14';c.fillRect(bx-4,by+30,8,90);c.fillRect(bx+bw2-4,by+30,8,90);
  c.fillStyle='#05070c';roundRect(c,bx-8,by-6,bw2+16,40,6);c.fill();
  c.save();c.beginPath();c.rect(bx-2,by,bw2+4,28);c.clip();
  const d1=idxRet(1),movers=TK.slice().sort((a,b)=>Math.abs(ret(b,1))-Math.abs(ret(a,1))).slice(0,6);
  const items=[['MARCHÉ '+pct1(d1),d1]].concat(movers.map(x=>[x+' '+pct1(ret(x,1)),ret(x,1)]));
  c.font='700 15px '+getComputedStyle(document.body).fontFamily;c.textBaseline='middle';
  let tw=0;const ws=items.map(it=>{const w=c.measureText(it[0]).width+26;tw+=w;return w;});
  let ox=bx+bw2-((t*1.1)%tw);
  for(let rep2=0;rep2<2;rep2++)items.forEach((it,k)=>{c.fillStyle=it[1]>0?'#5dff9e':it[1]<0?'#ff6b5f':'#ffd76a';c.fillText(it[0],ox,by+14.5);ox+=ws[k];});
  c.restore();c.fillStyle='rgba(255,255,255,.04)';for(let yy=by;yy<by+28;yy+=3)c.fillRect(bx,yy,bw2,1);}
  // feux d'artifice
  SKY.fw=SKY.fw.filter(f=>{if(f.delay>0){f.delay--;return true;}
    if(!f.parts){f.y+=f.vy*2;c.fillStyle=f.c;c.fillRect(f.x-1,f.y,2,6);if(f.y<=f.ty){f.parts=[];for(let k=0;k<40;k++){const a=k/40*Math.PI*2,v=1.5+rnd()*2.2;f.parts.push({x:f.x,y:f.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:60+rnd()*20});}}return true;}
    f.parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.04;p.vx*=0.98;p.l--;c.globalAlpha=Math.max(0,p.l/80);c.fillStyle=f.c;c.fillRect(p.x,p.y,2.2,2.2);});c.globalAlpha=1;
    f.parts=f.parts.filter(p=>p.l>0);return f.parts.length>0;});
  // eau
  const wg=c.createLinearGradient(0,ground,0,H);wg.addColorStop(0,'#0b1220');wg.addColorStop(1,'#060a14');c.fillStyle=wg;c.fillRect(0,ground,W,H-ground);
  c.strokeStyle='rgba(255,214,140,.18)';c.lineWidth=1;for(let k=0;k<26;k++){const x=((k*97+t*0.6)%(W+60))-30,y=ground+5+(k%5)*4;c.beginPath();c.moveTo(x,y);c.lineTo(x+18+(k%3)*8,y);c.stroke();}
  if(GM().items.yacht){const yx=W*0.3+Math.sin(t/60)*30,yy=ground+12;c.fillStyle='#f5f5f5';c.beginPath();c.moveTo(yx-34,yy);c.lineTo(yx+38,yy);c.lineTo(yx+28,yy+9);c.lineTo(yx-28,yy+9);c.closePath();c.fill();c.fillRect(yx-16,yy-8,30,8);c.fillStyle='#1f3a5f';c.fillRect(yx-12,yy-6,22,3);}
  if(GM().items.island){const ix=W-70,iy=ground+18;c.fillStyle='#d9b26f';c.beginPath();c.ellipse(ix,iy,46,8,0,0,7);c.fill();c.strokeStyle='#6b4a2b';c.lineWidth=3;c.beginPath();c.moveTo(ix,iy-4);c.quadraticCurveTo(ix+4,iy-24,ix-2,iy-40);c.stroke();c.fillStyle='#2e8b57';for(let k=0;k<5;k++){c.beginPath();c.ellipse(ix-2+Math.cos(k*1.3)*10,iy-40+Math.sin(k*1.3)*3,12,4,k*1.3,0,7);c.fill();}}
  // pluie
  if(mood==='storm'){c.strokeStyle='rgba(180,200,230,.35)';c.lineWidth=1;for(let k=0;k<90;k++){const x=(k*53+t*7)%(W+40)-20,y=(k*37+t*13)%H;c.beginPath();c.moveTo(x,y);c.lineTo(x-4,y+12);c.stroke();}
    if(t%180<4){c.fillStyle='rgba(255,255,255,.18)';c.fillRect(0,0,W,H);}}
}
function drawBuilding(c,x,y,w,h,col,seed,lit,dens,t,me){
  c.fillStyle=col;c.fillRect(x,y,w,h);
  const R=srand(seed+1),cols=Math.max(2,Math.floor((w-8)/9)),rows=Math.floor((h-8)/10);
  for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){const r=R();if(r<dens){const fl=me?1:((Math.floor(t/90)+i*7+j*3+seed)%37===0?0:1);if(!fl)continue;c.fillStyle=lit+(0.5+r*0.5)+')';c.fillRect(x+5+j*9,y+6+i*10,5,6);}}
}
function roundRect(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
let lastFrame=0;
function skyLoop(ts){
  if(!SKY.run)return;
  if(ts-lastFrame>33&&!document.hidden){lastFrame=ts;SKY.t++;skyDraw();}
  requestAnimationFrame(skyLoop);
}
function skyStart(){
  skyBuild();SKY.mood=moodNow();
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){SKY.run=false;for(const k in SKY.heights)delete SKY.heights[k];skyDraw();return;}
  if(!SKY.run){SKY.run=true;requestAnimationFrame(skyLoop);}
}
new ResizeObserver(()=>{if(G){skyBuild();skyDraw();}}).observe($('#hero'));

/* =====================================================================
   INTERFACE
   ===================================================================== */
function sparkSVG(a,cl,w,h,fill,klass){
  w=w||84;h=h||26;const mn=Math.min(...a),mx=Math.max(...a),r=mx-mn||1;
  const pts=a.map((v,k)=>[(k/(a.length-1))*w,h-2-((v-mn)/r)*(h-4)]);
  const d=pts.map((p,k)=>(k?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join('');
  const col=cl==='down'?'var(--down)':cl==='up'?'var(--up)':cl;
  return '<svg class="'+(klass||'sp')+'" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none" aria-hidden="true">'+(fill?'<path d="'+d+'L'+w+' '+h+'L0 '+h+'Z" fill="'+col+'" opacity=".12"/>':'')+'<path d="'+d+'" fill="none" stroke="'+col+'" stroke-width="1.6" vector-effect="non-scaling-stroke"/></svg>';
}
let lastFlap='';
function flapText(){const d=dObj(G.date);const wd=fdate(d,{weekday:'short',timeZone:'UTC'}).replace('.','').slice(0,3);const m=fdate(d,{month:'short',timeZone:'UTC'}).replace('.','').slice(0,4);return(wd+' '+String(d.getUTCDate()).padStart(2,'0')+' '+m.padEnd(4,' ')+' '+d.getUTCFullYear()).toUpperCase();}
function renderBoard(){
  const s=flapText(),host=$('#flaps');
  if(host.children.length!==s.length){host.innerHTML=[...s].map(c=>'<span class="fl'+(c===' '?' sp':'')+'">'+(c===' '?'':c)+'</span>').join('');}
  else{const ch=[];[...s].forEach((c,k)=>{if(lastFlap[k]!==c){const el=host.children[k];el.textContent=c===' '?'':c;el.classList.remove('go');el.style.animationDelay=(k*28)+'ms';ch.push(el);}});if(ch.length)requestAnimationFrame(()=>ch.forEach(el=>el.classList.add('go')));}
  lastFlap=s;host.setAttribute('aria-label',dLong(G.date));
  $('#seanceLbl').innerHTML='Séance<br>'+nf0.format(G.day-G.start+1);
}
function renderTape(){const items=TK.map(t=>{const r=ret(t,1);return'<button data-t="'+t+'"><b>'+t+'</b><span>'+nf2.format(P(t))+'</span><span class="'+cls(r)+'">'+pct(r)+'</span></button>';}).join('');$('#tapeIn').innerHTML=items+items;}
let shownVal=null;
function renderHero(){
  const v=value(),perf=perfMe(),vals=G.vals,vd=vals.length>1?vals[vals.length-1]/vals[vals.length-2]-1:0;
  animateNum($('#hVal'),shownVal==null?v:shownVal,v);shownVal=v;
  $('#hSub').innerHTML='<span class="pill lite '+cls(vd)+'">'+pct(vd)+' aujourd\'hui</span><span class="pill lite '+cls(perf)+'">'+pct1(perf)+' sur vos placements</span>';
  const g=GM(),r=g.rank,nx=RANKS[r+1],L=board();
  const stars=nx?0:Math.floor((g.xp-RANKS[r].xp)/5000);const prog=nx?(g.xp-RANKS[r].xp)/(nx.xp-RANKS[r].xp):((g.xp-RANKS[r].xp)%5000)/5000;
  $('#hRank').innerHTML='<div class="t"><span class="medal">'+(r+1)+'</span><div><b>'+RANKS[r].n+(stars?' '+'★'.repeat(Math.min(5,stars))+(stars>5?'+'+(stars-5):''):'')+'</b><small>'+nf0.format(g.xp)+' XP'+(nx?', prochain grade à '+nf0.format(nx.xp):', prochaine étoile à '+nf0.format(RANKS[r].xp+(stars+1)*5000))+'</small></div></div><div class="xp"><i style="width:'+(prog*100).toFixed(1)+'%"></i></div><div class="podium">'+L.map((x,k)=>'<span'+(x.id==='me'?' class="me"':'')+'>'+(k+1)+'. '+(x.id==='me'?'Vous':x.n.split(' ')[0])+'</span>').join('')+'</div>';
  SKY.mood=moodNow();if(!SKY.run)skyDraw();
}
function animateNum(el,a,b){
  const fmt=x=>nf0.format(x)+'<small> $</small>';
  if(matchMedia('(prefers-reduced-motion: reduce)').matches||Math.abs(a-b)<1){el.innerHTML=fmt(b);return;}
  const t0=performance.now(),D=600;cancelAnimationFrame(el._r);
  const f=now=>{const k=Math.min(1,(now-t0)/D),e=1-Math.pow(1-k,3);el.innerHTML=fmt(a+(b-a)*e);if(k<1)el._r=requestAnimationFrame(f);};el._r=requestAnimationFrame(f);
}
function renderCards(){
  const M=G.macro,R=E.REG[M.reg],d1=idxRet(1),sp=startPos(),mk=G.idx[G.idx.length-1]/G.idx[sp]-1;
  const fear=Math.min(80,M.fear),ang=Math.PI*(1-Math.min(1,(fear-9)/50)),nx=50+38*Math.cos(ang),ny=48-38*Math.sin(ang);
  const fearL=M.fear<15?'calme':M.fear<22?'normal':M.fear<32?'nervosité':'panique';
  $('#cardMkt').innerHTML='<div class="klab"><span>Le marché aujourd\'hui</span><span class="phase" style="--c:'+PHC[M.reg]+'"><i></i>'+R.lbl+'</span></div><div class="row" style="align-items:flex-end;justify-content:space-between"><div><div class="big">'+pct1(d1).replace(' %','<small> %</small>')+'</div><div style="font-size:14px">'+txt(mk,pct1)+' <span class="muted">depuis votre départ</span></div></div><svg class="gauge" viewBox="0 0 100 66" aria-label="Indice de peur '+nf0.format(M.fear)+', '+fearL+'"><path d="M12 48A38 38 0 0 1 88 48" fill="none" stroke="var(--line)" stroke-width="8" stroke-linecap="round"/><path d="M12 48A38 38 0 0 1 88 48" fill="none" stroke="url(#gg)" stroke-width="8" stroke-linecap="round" stroke-dasharray="120" stroke-dashoffset="'+(120*(1-Math.min(1,(fear-9)/50)))+'"/><defs><linearGradient id="gg"><stop offset="0" stop-color="var(--up)"/><stop offset=".6" stop-color="var(--gold)"/><stop offset="1" stop-color="var(--down)"/></linearGradient></defs><line x1="50" y1="48" x2="'+nx.toFixed(1)+'" y2="'+ny.toFixed(1)+'" stroke="var(--ink)" stroke-width="2.4" stroke-linecap="round"/><circle cx="50" cy="48" r="3.5" fill="var(--ink)"/><text x="50" y="64" text-anchor="middle" font-size="9.5" fill="var(--muted)">peur '+nf0.format(M.fear)+', '+fearL+'</text></svg></div>'+sparkSVG(G.idx.slice(-126),cls(idxRet(126)),300,46,true,'spark');
  const ms=GM().missions.filter(m=>!m.done).slice(0,3);
  $('#cardMis').innerHTML='<div class="klab"><span>Missions en cours</span><button class="linkb" id="goMis">Carrière</button></div>'+ms.map(m=>{const pr=missionProgress(m);return'<div style="display:grid;gap:4px"><div class="row" style="justify-content:space-between;gap:6px"><b style="font-size:14.5px">'+esc(m.t)+'</b><span class="gold" style="font-size:12.5px;font-weight:700">+'+m.xp+' XP</span></div><div class="mission" style="padding:0;background:none"><div class="prog"><i style="width:'+(pr*100).toFixed(0)+'%"></i></div></div></div>';}).join('');
  $('#goMis').onclick=()=>setTab('missions');
  $('#nPos').textContent=Object.keys(G.pos).length+Object.keys(GM().shorts).length||'';
  const ready=GM().missions.filter(m=>!m.done&&missionProgress(m)>=0.8).length;$('#nMis').textContent=ready?ready:'';
}
function newsItem(n,big){
  let meta='<span class="cat" style="--c:'+CATC[n.cat]+'">'+CATL[n.cat]+'</span>';
  if(n.tk)meta+='<button class="tk'+(G.pos[n.tk]?' mine':'')+'" data-t="'+n.tk+'" style="--h:'+hueOf(n.tk)+'">'+n.tk+'</button>';
  if(n.cat==='analyste'){const r=firmRate(G.firms[n.firm]);if(r!=null)meta+='<span>fiabilité du cabinet '+Math.round(r*100)+' %</span>';}
  if(n.cat==='rumeur')meta+='<span>source : '+esc(n.src||'')+'</span>'+(proOn()?'<span class="gold">probabilité ~'+Math.round(n.cred*100)+' %</span>':'');
  return '<div class="nw'+(big&&n.big?' big-n':'')+'" style="--c:'+CATC[n.cat]+'"><span class="bar"></span><div><div class="meta">'+meta+'</div><h3>'+esc(n.title)+'</h3>'+(n.x?'<p>'+esc(n.x)+'</p>':'')+'</div></div>';
}
function renderUne(){
  const today=G.news.filter(n=>n.day===G.day);
  const score=n=>(n.cat==='jeu'?6:0)+(n.big?4:0)+(n.tk&&G.pos[n.tk]?3:0)+(n.cat==='macro'?2:0)+(n.cat==='rumeur'||n.cat==='resultats'?1:0);
  const top=today.slice().sort((a,b)=>score(b)-score(a)).slice(0,3);
  let h='<div class="row" style="justify-content:space-between"><h2>À la une</h2>'+(today.length>top.length?'<button class="linkb" id="goFil">Les '+today.length+' dépêches du jour</button>':'')+'</div>';
  h+=top.length?top.map(n=>newsItem(n,true)).join(''):'<div class="quiet">Séance calme, aucune dépêche notable.</div>';
  $('#une').innerHTML=h;const g=$('#goFil');if(g)g.onclick=()=>{setTab('terminal');setSub('fil');};
}
function rows(){
  const q=$('#q').value.trim().toLowerCase(),sf=$('#secF').value;
  let r=TK.map(t=>{const o=G.st[t],c=cons(t);return{t,name:ST[t].n,sec:ST[t].s,px:P(t),d1:ret(t,1),m1:ret(t,21),pe:o.pe,dy:o.dy,avis:c?c.score:0,c,earn:o.earn-G.day,held:(G.pos[t]?G.pos[t].q:0)-(GM().shorts[t]?GM().shorts[t].q:0)};});
  if(q)r=r.filter(x=>x.name.toLowerCase().includes(q)||x.t.toLowerCase().includes(q));
  if(sf)r=r.filter(x=>x.sec===sf);
  if(qf==='fav')r=r.filter(x=>GM().fav[x.t]);if(qf==='mine')r=r.filter(x=>x.held);if(qf==='soon')r=r.filter(x=>x.earn<=10);if(qf==='movers')r=r.filter(x=>Math.abs(x.d1)>0.025);
  r.sort((a,b)=>{const x=a[sortK],y=b[sortK];return(typeof x==='string'?x.localeCompare(y,'fr'):x-y)*sortDir;});
  return r;
}
function abar(c){if(!c)return'<span class="muted">—</span>';const w=k=>(k/c.n*100).toFixed(0)+'%';return'<span class="abar" title="'+c.b+' achat, '+c.h+' neutre, '+c.v+' vente"><i style="width:'+w(c.b)+';background:var(--up)"></i><i style="width:'+w(c.h)+';background:var(--muted);opacity:.45"></i><i style="width:'+w(c.v)+';background:var(--down)"></i></span>';}
function heatColor(r,scale){const x=clamp(r/scale,-1,1);if(x>=0){const a=[138,143,152],b=[19,122,74];return'rgb('+a.map((v,k)=>Math.round(v+(b[k]-v)*x)).join(',')+')';}const a=[138,143,152],b=[179,38,30];return'rgb('+a.map((v,k)=>Math.round(v+(b[k]-v)*(-x))).join(',')+')';}
function renderHeat(){
  const scale={1:0.03,5:0.06,21:0.12,252:0.4}[hp];
  let h='<div class="row" style="justify-content:space-between;width:100%"><div class="seg" id="hpSeg">'+[[1,'Jour'],[5,'Semaine'],[21,'Mois'],[252,'Un an']].map(x=>'<button data-hp="'+x[0]+'"'+(hp===x[0]?' class="on"':'')+'>'+x[1]+'</button>').join('')+'</div><div class="hleg"><span>−'+nf0.format(scale*100)+' %</span><span class="g"></span><span>+'+nf0.format(scale*100)+' %</span></div></div>';
  const secs=secList.map(s=>{const ts=TK.filter(t=>ST[t].s===s).sort((a,b)=>ret(b,hp)-ret(a,hp));return{s,ts,avg:ts.reduce((a,t)=>a+ret(t,hp),0)/ts.length};}).sort((a,b)=>b.ts.length-a.ts.length);
  secs.forEach(x=>{h+='<div class="hsec" style="--n:'+x.ts.length+'"><h5><span>'+x.s+'</span><span class="'+cls(x.avg)+'">'+pct1(x.avg)+'</span></h5><div class="hgrid">'+x.ts.map(t=>{const r=ret(t,hp);return'<button class="ht'+(t===sel?' sel':'')+'" data-t="'+t+'" style="background:'+heatColor(r,scale)+'" title="'+esc(ST[t].n)+'">'+t+'<small>'+pct1(r)+'</small></button>';}).join('')+'</div></div>';});
  $('#heat').innerHTML=h;
  $('#hpSeg').onclick=e=>{const v=e.target.dataset.hp;if(v){hp=+v;renderHeat();}};
}
const SPK={};function spkRow(r){const k=r.t+'|'+G.day+'|'+cls(r.m1);return SPK[k]||(SPK[r.t+'_']&&delete SPK[SPK[r.t+'_']],SPK[r.t+'_']=k,SPK[k]=sparkSVG(G.st[r.t].p.slice(-22),cls(r.m1)));}
const COTEV={vis:true,dirty:false};
try{new IntersectionObserver(es=>{es.forEach(e=>{COTEV.vis=e.isIntersecting;if(COTEV.vis&&COTEV.dirty&&tab==='cote')renderCote();});}).observe(document.getElementById('v-cote'));}catch(e){}
function renderCote(){COTEV.dirty=false;
  $('#heat').hidden=cview!=='map';$('#listWrap').hidden=cview==='map';$('#quickF').style.display=cview==='map'?'none':'';
  if(cview==='map'){renderHeat();return;}
  document.querySelectorAll('#tMarket th[data-k]').forEach(th=>{const on=th.dataset.k===sortK;th.classList.toggle('sorted',on);th.dataset.dir=on?(sortDir>0?'↑':'↓'):'';});
  const R=rows();
  $('#tMarket tbody').innerHTML=R.length?R.map(r=>'<tr data-t="'+r.t+'"'+(r.t===sel?' class="sel"':'')+'><td><div class="who">'+avatar(r.t)+'<div><b>'+esc(r.name)+(GM().fav[r.t]?' <span class="gold">★</span>':'')+'</b><small>'+r.t+', '+r.sec+'</small></div></div></td><td>'+spkRow(r)+'</td><td><b>'+nf2.format(r.px)+'</b></td><td>'+pill(r.d1)+'</td><td>'+(r.pe>0&&r.pe<500?nf1.format(r.pe):'—')+'</td><td>'+(r.dy>0?nf1.format(r.dy*100)+' %':'<span class="muted">—</span>')+'</td><td>'+abar(r.c)+'</td><td><span class="chipd'+(r.earn<=5?' soon':'')+'">'+(r.earn===0?'aujourd\'hui':'dans '+r.earn+' j')+'</span></td><td>'+(r.held>0?'<span class="held">'+nf0.format(r.held)+'</span>':r.held<0?'<span class="held" style="background:var(--down)">'+nf0.format(r.held)+'</span>':'')+'</td></tr>').join(''):'<tr><td colspan="9" class="quiet">Aucune valeur ne correspond à ce filtre.</td></tr>';
}
function renderFiche(){
  const t=sel,o=G.st[t],s=ST[t],p=P(t),d1=ret(t,1);
  $('#fAv').outerHTML='<div class="av" id="fAv" style="--h:'+hueOf(t)+'">'+t.replace('.','').slice(0,4)+'</div>';
  const fv=!!GM().fav[t];$('#fStar').classList.toggle('on',fv);$('#fStar').setAttribute('aria-pressed',fv);$('#fStar').setAttribute('aria-label',fv?'Retirer des favoris':'Ajouter aux favoris');
  $('#fName').textContent=s.n;$('#fSub').textContent=t+', '+s.s;
  $('#fPx').innerHTML=nf2.format(p)+'<small> $</small>';$('#fChg').innerHTML=pill(d1)+' <span class="muted" style="font-size:13.5px">sur 1 an '+txt(ret(t,252),pct1)+'</span>';
  const a=o.p.slice(-252),hi=Math.max(...a),lo=Math.min(...a),pos=G.pos[t],sh=GM().shorts[t];
  let st='';const add=(k,v)=>st+='<div><dt>'+k+'</dt><dd>'+v+'</dd></div>';
  add('PER',(o.pe>0&&o.pe<500?nf1.format(o.pe):'—')+' <span class="muted" style="font-weight:400">/ '+nf1.format(secPE(s.s))+' secteur</span>');
  add('Bénéfice par action',money(o.eps));add('Croissance attendue',txt(o.gc,pct1));add('Dividende',o.dy>0?nf1.format(o.dy*100)+' %':'aucun');
  add('Bêta',nf2.format(s.b));add('Volatilité',nf0.format(s.vol*100)+' % par an');add('Plus haut 1 an',nf2.format(hi));add('Plus bas 1 an',nf2.format(lo));
  if(pos){const pl=pos.q*p-pos.cost;add('Vous détenez',nf0.format(pos.q)+' titres');add('Plus-value',txt(pl,money0));}
  if(sh){const pl=sh.q*(sh.entry-p);add('À découvert',nf0.format(sh.q)+' titres');add('Gain du pari',txt(pl,money0));}
  $('#fStats').innerHTML=st;
  let b='';const ed=o.earn-G.day;
  b+='<div class="blk"><h4>Prochains résultats</h4><div class="ln"><span>'+(ed===0?'Aujourd\'hui':dShort(dateIn(ed))+', dans '+ed+' séance'+(ed>1?'s':''))+'</span><span>attendu '+money(o.cons)+'</span></div>'+(o.lastSurp!=null?'<div class="ln"><span class="muted">Dernière publication</span><span class="'+cls(o.lastSurp)+'">'+pct1(o.lastSurp)+' face au consensus</span></div>':'')+'</div>';
  const c=cons(t),fr0=fresh(t);let ra='';
  for(const k in fr0){const r=fr0[k],F=G.firms[k],fr=firmRate(F);ra+='<div class="ln"><span>'+esc(F.n)+(fr!=null?' <span class="muted">'+Math.round(fr*100)+' %</span>':'')+'</span><span><span class="'+(r.r===3?'up':r.r===1?'down':'muted')+'">'+AV[r.r]+'</span> '+nf0.format(r.tgt)+' $</span></div>';}
  b+='<div class="blk"><h4>Analystes</h4>'+(c?'<div class="cbar"><i style="flex:'+c.b+';background:var(--up)"></i><i style="flex:'+c.h+';background:var(--muted);opacity:.4"></i><i style="flex:'+c.v+';background:var(--down)"></i></div><div class="ln"><span class="muted">Objectif moyen</span><span>'+nf0.format(c.tgt)+' $ '+txt(c.tgt/p-1,pct1)+'</span></div>'+ra:'<span class="muted">Aucune note récente sur cette valeur.</span>')+'</div>';
  if(proOn()){const fv=o.fairNow*o.eps*(1+o.fairNoise),gap=fv/p-1;b+='<div class="blk pro"><h4>Recherche Pro</h4><div class="ln"><span>Juste valeur estimée</span><span><b>'+money(fv)+'</b> '+txt(gap,pct1)+'</span></div><div class="ln"><span>Prochain trimestre</span><span class="'+(o.proSig>0?'up':'down')+'">'+(o.proSig>0?'au-dessus du consensus':'sous le consensus')+'</span></div><div class="ln"><span>Fenêtre pour agir</span>'+proWindow(o.earn-G.day)+'</div></div>';}
  const nw=G.news.filter(n=>n.tk===t).slice(-4).reverse();
  b+='<div class="blk"><h4>Dernières dépêches</h4>'+(nw.length?nw.map(n=>'<div><span class="muted">'+dShort(n.date)+'</span> '+esc(n.title)+'</div>').join(''):'<span class="muted">Rien de récent.</span>')+'</div>';
  $('#fBoxes').innerHTML=b;drawStock();renderOrder();
}
function sides(){const L=[['A','Acheter','b'],['V','Vendre','s']];if(GM().rank>=2)L.push(['S','À découvert','s'],['C','Racheter','b']);return L;}
function maxQty(){const p=P(sel),S=GM().shorts;
  if(side==='V')return G.pos[sel]?G.pos[sel].q:0;
  if(side==='C')return S[sel]?S[sel].q:0;
  if(side==='S'){const room=Math.max(0,value()*1.0-shortLiab());return Math.floor(room/p);}
  let q=Math.floor(G.cash/(p*(1+FEE_RATE)));while(q>0&&q*p+Math.max(FEE_MIN,q*p*FEE_RATE)>G.cash)q--;return Math.max(0,q);}
function renderOrder(){
  if(!sides().some(s=>s[0]===side))side='A';
  $('#sideSeg').style.gridTemplateColumns='repeat('+sides().length+',1fr)';
  $('#sideSeg').innerHTML=sides().map(s=>'<button class="'+s[2]+(side===s[0]?' on':'')+'" data-side="'+s[0]+'">'+s[1]+'</button>').join('');
  $('#quick').innerHTML=side==='A'||side==='S'?'<button data-p=".1">10 %</button><button data-p=".25">25 %</button><button data-p=".5">50 %</button><button data-p="1">Maximum</button>':'<button data-p=".25">Un quart</button><button data-p=".5">La moitié</button><button data-p="1">Tout</button>';
  const mx=maxQty(),q=Math.max(0,Math.floor(+$('#qty').value||0));
  $('#qRange').value=mx?Math.round(Math.min(1,q/mx)*100):0;
  const p=P(sel),g=q*p,f=q?Math.max(FEE_MIN,g*FEE_RATE):0,pay=side==='A'||side==='C';
  $('#est').innerHTML='<div class="ln"><span class="muted">'+nf0.format(q)+' × '+money(p)+'</span><span>'+money(g)+'</span></div><div class="ln"><span class="muted">Frais</span><span>'+money(f)+'</span></div><div class="ln tot"><span>'+(pay?'Vous payez':'Vous recevez')+'</span><span>'+money(pay?g+f:g-f)+'</span></div><div class="ln"><span class="muted">Liquidités disponibles</span><span>'+money(G.cash)+'</span></div>';
  const L={A:'Acheter',V:'Vendre',S:'Vendre à découvert',C:'Racheter'};
  const condOK=side==='A'||side==='V';if(!condOK)omode='now';
  $('#modeSeg').style.display=condOK?'':'none';[...$('#modeSeg').children].forEach(b=>b.classList.toggle('on',b.dataset.mode===omode));
  $('#condBox').hidden=omode!=='cond';
  const ex=$('#bExec');ex.className='exec '+(pay?'b':'s');ex.textContent=L[side]+' '+nf0.format(q)+' '+ST[sel].n;
  if(omode==='cond'){
    const ci=$('#cPx');if(!ci.value||ci.dataset.t!==sel+side){ci.value=(p*(side==='A'?0.95:0.9)).toFixed(2);ci.dataset.t=sel+side;}
    const cp=+ci.value||p,dir=cp<p?'le':'ge',ch=cp/p-1;
    $('#cQuick').innerHTML=(side==='A'?[-0.03,-0.05,-0.1,0.05]:[-0.05,-0.1,0.1,0.2]).map(x=>'<button data-cq="'+x+'">'+pct1(x)+'</button>').join('');
    const kind=side==='A'?(dir==='le'?'Achat si le cours baisse':'Achat sur cassure à la hausse'):(dir==='le'?'Stop de protection : vous limitez vos pertes':'Objectif de gain : vous encaissez à la hausse');
    $('#cNote').innerHTML='<b>'+kind+'</b>. Exécution automatique à la première clôture '+(dir==='le'?'au niveau ou sous ':'au niveau ou au-dessus de ')+money(cp)+' ('+pct1(ch)+'). Valable 6 mois.';
    ex.textContent='Programmer : '+L[side].toLowerCase()+' '+nf0.format(q)+' '+ST[sel].n+(dir==='le'?' à ≤ ':' à ≥ ')+nf2.format(cp)+' $';
  }
  ex.disabled=GM().lock>G.day;if(ex.disabled)ex.textContent='Connexion coupée encore '+(GM().lock-G.day)+' séance(s)';
  renderOrderList();
  $('#oNote').textContent=omode==='cond'?'':side==='S'?'Vous empruntez des titres pour les vendre maintenant et les racheter plus tard. Vous gagnez si le cours baisse, vous perdez sans limite s\'il monte. Coût d\'emprunt : 0,02 % par séance.':side==='C'?'Racheter clôture votre pari à la baisse.':'Exécuté au cours de clôture de la séance. Frais de 0,1 % (minimum 1 $). Les dividendes sont versés sur vos liquidités.';
}
function placeOrder(q){
  const p=P(sel),cp=+$('#cPx').value;
  if(!(cp>0)){toast('Indiquez un cours de déclenchement.','var(--down)');return;}
  if(q<1){toast('Indiquez une quantité d\'au moins 1 titre.','var(--down)');return;}
  const g=GM();g.orders.push({id:++g.oseq,t:sel,s:side,q,px:cp,dir:cp<p?'le':'ge',day:G.day,exp:G.day+126});
  toast('Ordre programmé : '+(side==='A'?'achat':'vente')+' de '+nf0.format(q)+' '+ST[sel].n+(cp<p?' à ≤ ':' à ≥ ')+money(cp)+'.','var(--accent)');
  save();renderAll();
}
function execOrders(){
  const g=GM(),keep=[],prevSel=sel;
  g.orders.forEach(o=>{
    const p=P(o.t),hit=o.dir==='le'?p<=o.px:p>=o.px;
    if(!hit){if(G.day>o.exp)toast('Ordre expiré sur '+ST[o.t].n+'.','var(--muted)');else keep.push(o);return;}
    sel=o.t;
    if(o.s==='A'){const cost=o.q*p*(1+FEE_RATE)+FEE_MIN;if(G.cash<cost){toast('Ordre annulé sur '+ST[o.t].n+' : liquidités insuffisantes.','var(--down)');return;}}
    if(o.s==='V'){const h=G.pos[o.t]?G.pos[o.t].q:0;if(!h){toast('Ordre annulé : vous ne détenez plus '+ST[o.t].n+'.','var(--muted)');return;}o.q=Math.min(o.q,h);}
    const n=G.tx.length;doTrade(o.s,o.q,true);if(G.tx.length>n){G.tx[G.tx.length-1].prog=1;g.flags.prog=(g.flags.prog||0)+1;toast('Ordre exécuté : '+(o.s==='A'?'achat':'vente')+' de '+nf0.format(o.q)+' '+ST[o.t].n+' à '+money(p)+'.','var(--gold)');}
  });
  g.orders=keep;sel=prevSel;
}
function orderLine(o){return'<div class="oitem"><span><b>'+(o.s==='A'?'Achat':'Vente')+'</b> '+nf0.format(o.q)+' '+esc(ST[o.t].n)+' si '+(o.dir==='le'?'≤ ':'≥ ')+nf2.format(o.px)+' $ <span class="muted">('+pct1(o.px/P(o.t)-1)+')</span></span><button data-cancel="'+o.id+'">Annuler</button></div>';}
function renderOrderList(){const L=GM().orders.filter(o=>o.t===sel);$('#ordList').innerHTML=L.length?'<div class="olist"><b style="font-size:13.5px">Ordres en attente sur '+esc(ST[sel].n)+'</b>'+L.map(orderLine).join('')+'</div>':'';}
document.addEventListener('click',e=>{const b=e.target.closest('[data-cancel]');if(!b)return;const g=GM();g.orders=g.orders.filter(o=>o.id!==+b.dataset.cancel);toast('Ordre annulé.','var(--muted)');save();renderAll();});
function proWindow(d){return d>=10&&d<=25?'<span class="pill up">idéale</span>':d<10?'<span class="pill flat">trop tard</span>':'<span class="muted">à surveiller</span>';}
function renderTerminal(){
  document.querySelectorAll('#tSub button').forEach(b=>b.classList.toggle('on',b.dataset.s===sub));
  let h='';
  if(sub==='fil'){
    const F=[['tout','Tout'],['mine','Mes valeurs'],['jeu','Événements'],['macro','Économie'],['societe','Sociétés'],['resultats','Résultats'],['rumeur','Rumeurs'],['analyste','Analystes']];
    h+='<div class="seg" id="fF" style="margin-bottom:6px">'+F.map(f=>'<button data-f="'+f[0]+'"'+(filt===f[0]?' class="on"':'')+'>'+f[1]+'</button>').join('')+'</div>';
    let L=G.news.slice().reverse();if(filt==='mine')L=L.filter(n=>n.tk&&G.pos[n.tk]);else if(filt!=='tout')L=L.filter(n=>n.cat===filt);
    L=L.slice(0,150);let last=null;L.forEach(n=>{if(n.date!==last){h+='<div class="dayh">'+dLong(n.date)+'</div>';last=n.date;}h+=newsItem(n,false);});
    if(!L.length)h+='<div class="quiet">Aucune dépêche dans cette catégorie.</div>';
  }
  if(sub==='macro'){
    GM().flags.terminal=1;
    const M=G.macro,R=E.REG[M.reg];
    h+='<div class="hero-phase" style="--c:'+PHC[M.reg]+'"><div class="muted" style="font-size:13.5px">Phase du cycle économique</div><h3>'+R.lbl+'</h3><p>'+R.desc+'</p></div>';
    const tl=(k,v,x)=>'<div class="tile"><div class="l">'+k+'</div><div class="v">'+v+'</div><div class="x">'+x+'</div></div>';
    const fearL=M.fear<15?'calme':M.fear<22?'normal':M.fear<32?'nervosité':'panique';
    h+='<div class="tiles">'+tl('Taux directeur',nf2.format(M.rate*100)+' %','fixé par la banque centrale')+tl('Inflation',nf1.format(M.infl*100)+' %','sur un an')+tl('Chômage',nf1.format(M.unemp*100)+' %','de la population active')+tl('Croissance',sgn(M.gdp)+nf1.format(Math.abs(M.gdp*100))+' %','PIB, rythme annuel')+tl('Pétrole',nf0.format(M.oil)+' $','le baril')+tl('Indice de peur',nf0.format(M.fear),fearL)+'</div>';
    h+='<h3 class="st">Agenda</h3><table><tbody>';
    const ag=[[M.nextFed,'Réunion de la banque centrale',M.fedExp?'Le marché anticipe '+M.fedExp.lbl+' ('+Math.round(M.fedExp.p*100)+' %)':'Anticipations publiées 5 séances avant'],[M.nextCPI,'Chiffre de l\'inflation','Plus fort que prévu : crainte de hausse des taux'],[M.nextJobs,'Chiffre du chômage','En baisse : bonne nouvelle pour l\'activité'],[M.nextGDP,'Croissance trimestrielle','Surprise positive : soutien aux cycliques']].sort((a,b)=>a[0]-b[0]);
    ag.forEach(a=>h+='<tr><td><b>'+a[1]+'</b><div class="muted" style="font-size:13px">'+a[2]+'</div></td><td><b>'+dShort(dateIn(a[0]))+'</b><div class="muted" style="font-size:13px">dans '+a[0]+' séance'+(a[0]>1?'s':'')+'</div></td></tr>');
    h+='</tbody></table><h3 class="st">Comment l\'économie fait bouger les cours</h3><ul style="max-width:72ch;padding-left:18px;color:var(--muted)"><li>Hausse des taux : les PER se compriment, surtout pour la tech, les télécoms et la consommation de base. Les banques gagnent davantage sur leurs prêts.</li><li>Pétrole en hausse : bon pour l\'énergie et les matières premières, mauvais pour l\'aérien et le tourisme.</li><li>Récession : les bénéfices des cycliques chutent bien plus que ceux de la santé ou de la consommation.</li><li>Indice de peur élevé : les cours bougent fort dans les deux sens.</li></ul>';
  }
  if(sub==='resu'){
    const up=TK.map(t=>({t,o:G.st[t],d:G.st[t].earn-G.day})).filter(x=>x.d<=15).sort((a,b)=>a.d-b.d);
    const days=[];for(let k=0;k<10;k++)days.push({k,L:up.filter(x=>x.d===k)});
    h+='<div class="ecal">'+days.map(d=>'<div class="ecd'+(d.L.length?'':' empty')+'"><div class="ecl"><b>'+(d.k===0?'Auj.':fdate(dObj(dateIn(d.k)),{weekday:'short',timeZone:'UTC'}).replace('.',''))+'</b><small>'+dObj(dateIn(d.k)).getUTCDate()+'</small></div>'+d.L.map(x=>'<button class="tk ec'+(G.pos[x.t]?' mine':'')+'" data-t="'+x.t+'" style="--h:'+hueOf(x.t)+'" title="'+esc(ST[x.t].n)+'">'+x.t+'</button>').join('')+'</div>').join('')+'</div>';
    h+='<p class="intro">Chaque trimestre, les sociétés publient leurs bénéfices. Une surprise fait bouger le cours, mais une partie de l\'information filtre dans les jours qui précèdent.</p><div class="tw"><table><thead><tr><th>Valeur</th><th>Date</th><th>Bénéfice attendu</th><th>Indice repéré</th>'+(proOn()?'<th>Recherche Pro</th>':'')+'</tr></thead><tbody>';
    h+=up.map(x=>'<tr data-t="'+x.t+'"><td><div class="who">'+avatar(x.t)+'<div><b>'+esc(ST[x.t].n)+'</b><small>'+x.t+'</small></div></div></td><td><span class="chipd'+(x.d<=5?' soon':'')+'">'+(x.d===0?'aujourd\'hui':dShort(dateIn(x.d)))+'</span></td><td>'+money(x.o.cons)+'</td><td>'+(x.o.hint&&x.o.hintDay<=G.day&&x.o.hintDay>G.day-20?(x.o.hint>0?'<span class="pill up">positif</span>':'<span class="pill down">négatif</span>'):'<span class="muted">—</span>')+'</td>'+(proOn()?'<td class="'+(x.o.proSig>0?'up':'down')+'">'+(x.o.proSig>0?'au-dessus':'en dessous')+'</td>':'')+'</tr>').join('');
    h+='</tbody></table></div><h3 class="st">Dernières publications</h3>'+(G.news.filter(n=>n.cat==='resultats').slice(-15).reverse().map(n=>newsItem(n,false)).join('')||'<div class="quiet">Aucune pour l\'instant.</div>');
  }
  if(sub==='ana'){
    h+='<p class="intro">Chaque note est jugée trois mois plus tard : un achat est réussi si l\'action a fait mieux que le marché, une vente si elle a fait moins bien.</p>';
    const fs=G.firms.map((F,k)=>({F,k,r:firmRate(F)})).sort((a,b)=>(b.r||0)-(a.r||0));
    h+='<table><thead><tr><th>Cabinet</th><th>Taux de réussite</th><th>Notes jugées</th></tr></thead><tbody>'+fs.map(x=>'<tr><td><b>'+esc(x.F.n)+'</b></td><td>'+(x.r==null?'—':'<span class="meter"><i style="width:'+Math.round(x.r*100)+'%;background:'+(x.r>=0.58?'var(--up)':x.r<0.52?'var(--down)':'var(--gold)')+'"></i></span> <b>'+Math.round(x.r*100)+' %</b>')+'</td><td>'+nf0.format(x.F.ok+x.F.ko)+'</td></tr>').join('')+'</tbody></table><h3 class="st">Dernières notes</h3>'+G.news.filter(n=>n.cat==='analyste').slice(-25).reverse().map(n=>newsItem(n,false)).join('');
  }
  if(sub==='secteurs'){
    const secs=secList.map(s=>{const ts=TK.filter(t=>ST[t].s===s);const m=n=>ts.reduce((a,t)=>a+ret(t,n),0)/ts.length;return{s,S:SECS[s],d1:m(1),m1:m(21),y1:m(252),pe:secPE(s),n:ts.length};}).sort((a,b)=>b.m1-a.m1);
    const lvl=(v,a,b)=>v>=b?'forte':v>=a?'moyenne':'faible';
    h+='<p class="intro">Cyclicité : à quel point le secteur suit la conjoncture. Taux : sensibilité à une hausse des taux. Pétrole : effet d\'un baril plus cher.</p><div class="tw"><table><thead><tr><th>Secteur</th><th>Jour</th><th>1 mois</th><th>1 an</th><th>PER médian</th><th>Cyclicité</th><th>Taux</th><th>Pétrole</th></tr></thead><tbody>'+secs.map(x=>'<tr><td><div class="who"><span class="av" style="--h:'+HUE[x.s]+';width:12px;height:12px;border-radius:4px"></span><div><b>'+x.s+'</b><small>'+x.n+' valeurs</small></div></div></td><td>'+pill(x.d1)+'</td><td>'+txt(x.m1)+'</td><td>'+txt(x.y1)+'</td><td>'+nf1.format(x.pe)+'</td><td>'+lvl(x.S.cyc,0.7,1.2)+'</td><td>'+(x.S.rs<0?'<span class="up">en profite</span>':lvl(x.S.rs,3,5))+'</td><td>'+(x.S.oil>0.2?'<span class="up">en profite</span>':x.S.oil<-0.1?'<span class="down">pénalisé</span>':'neutre')+'</td></tr>').join('')+'</tbody></table></div>';
  }
  if(sub==='pro'){
    if(GM().rank<1&&!proOn())h+=lockHTML('La Recherche Pro se débloque au grade de Trader junior ('+RANKS[1].xp+' XP).');
    else if(proOn()){
      h+='<div class="blk pro" style="margin-bottom:14px"><h4>Abonnement actif jusqu\'au '+dShort(dateIn(G.pro-G.day))+'</h4><span>Juste valeur estimée à environ 3 % près, et signal sur le prochain trimestre juste environ deux fois sur trois.</span><span><b>Agissez tôt.</b> Environ 10 séances avant une publication, l\'information commence à filtrer dans le cours. Dans nos simulations, suivre un signal positif rapporte en moyenne +1,2 % par opération si l\'on achète 12 séances avant, contre +0,3 % seulement 2 séances avant. Un signal négatif est surtout utile pour vendre à temps.</span><button class="btn" id="bPro" style="justify-self:start">Prolonger de 21 séances pour '+money0(proCost())+'</button></div>';
      const L=TK.map(t=>{const o=G.st[t],fv=o.fairNow*o.eps*(1+o.fairNoise);return{t,fv,gap:fv/P(t)-1,sig:o.proSig,d:o.earn-G.day};}).sort((a,b)=>b.gap-a.gap);
      h+='<div class="tw"><table><thead><tr><th>Valeur</th><th>Cours</th><th>Juste valeur</th><th>Potentiel</th><th>Prochain trimestre</th><th>Fenêtre</th></tr></thead><tbody>'+L.map(x=>'<tr data-t="'+x.t+'"><td><div class="who">'+avatar(x.t)+'<div><b>'+esc(ST[x.t].n)+'</b><small>'+x.t+'</small></div></div></td><td>'+nf2.format(P(x.t))+'</td><td><b>'+nf2.format(x.fv)+'</b></td><td>'+pill(x.gap,pct1)+'</td><td><span class="'+(x.sig>0?'up':'down')+'">'+(x.sig>0?'au-dessus':'en dessous')+'</span> <span class="muted">dans '+x.d+' j</span></td><td>'+proWindow(x.d)+'</td></tr>').join('')+'</tbody></table></div>';
    }else h+='<div class="hero-phase" style="--c:var(--gold)"><h3>Recherche Pro</h3><p>La juste valeur estimée de chaque société, le classement des plus fortes décotes, un signal sur le prochain trimestre et la probabilité que chaque rumeur soit vraie.</p><p style="color:var(--ink);margin-top:10px"><b>'+money0(proCost())+'</b> pour 21 séances (0,25 % de votre fortune, minimum 300 $).</p></div><button class="btn go" id="bPro">S\'abonner pour '+money0(proCost())+'</button>';
  }
  $('#tBody').innerHTML=h;
  const bp=$('#bPro');if(bp)bp.onclick=buyPro;
  const ff=$('#fF');if(ff)ff.onclick=e=>{if(e.target.dataset.f){filt=e.target.dataset.f;renderTerminal();}};
}
function lockHTML(t){return'<div class="lock"><svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true"><rect x="9" y="18" width="22" height="16" rx="3" fill="currentColor"/><path d="M14 18v-5a6 6 0 0112 0v5" stroke="currentColor" stroke-width="3" fill="none"/></svg><b>'+t+'</b><span>Remplissez des missions dans l\'onglet Carrière pour gagner de l\'expérience.</span></div>';}
function buyPro(){const c=proCost();if(G.cash<c){toast('Il vous faut '+money0(c)+' de liquidités pour vous abonner.','var(--down)');return;}G.cash-=c;G.pro=Math.max(G.pro,G.day)+PRO_DAYS;G.tx.push({day:G.day,date:G.date,t:null,s:'P',q:1,p:c,f:0,pl:-c});toast('Recherche Pro activée pour 21 séances.','var(--gold)');checkMissions();save();renderAll();}
function renderPortef(){
  const v=value();let inv=0,cost=0;
  const R=Object.keys(G.pos).map(t=>{const p=P(t),o=G.pos[t];inv+=o.q*p;cost+=o.cost;return{t,o,p,val:o.q*p,pl:o.q*p-o.cost,sh:false};});
  Object.keys(GM().shorts).forEach(t=>{const o=GM().shorts[t],p=P(t);R.push({t,o:{q:-o.q,cost:-o.q*o.entry},p,val:-o.q*p,pl:o.q*(o.entry-p),sh:true});});
  R.sort((a,b)=>Math.abs(b.val)-Math.abs(a.val));
  const sp=startPos(),mk=G.idx[G.idx.length-1]/G.idx[sp]-1,perf=perfMe();
  const realized=G.tx.filter(x=>x.s==='V'||x.s==='C').reduce((s,x)=>s+x.pl,0),divs=G.tx.filter(x=>x.s==='D').reduce((s,x)=>s+x.pl,0);
  const years=(G.day-G.start)/252,ann=years>=0.5?Math.pow(Math.max(0.01,v/G.cap),1/years)-1:null;
  const tl=(k,x,s)=>'<div class="tile"><div class="l">'+k+'</div><div class="v">'+x+'</div>'+(s?'<div class="x">'+s+'</div>':'')+'</div>';
  $('#pTiles').innerHTML=tl('Fortune',money0(v),txt(perf)+' sur vos placements')+tl('Liquidités',money0(G.cash),nf0.format(G.cash/v*100)+' % du total')+tl('Salaires et primes',money0(contrib()-G.cap),'versés depuis le départ')+tl('Plus-value latente',txt(inv-cost,money0),'sur '+money0(inv)+' investis')+tl('Plus-value réalisée',txt(realized,money0),'dividendes : '+money0(divs))+tl('Face au marché',txt(perf-mk,x=>sgn(x)+nf1.format(Math.abs(x*100))+' pts'),'le marché a fait '+pct1(mk))+tl('Rendement annuel',ann==null?'<span class="muted" style="font-size:16px">après 6 mois</span>':txt(ann,pct1));
  $('#tPos tbody').innerHTML=R.length?R.map(r=>'<tr data-t="'+r.t+'"><td><div class="who">'+avatar(r.t)+'<div><b>'+esc(ST[r.t].n)+'</b><small>'+r.t+(r.sh?', à découvert':'')+'</small></div></div></td><td>'+nf0.format(r.o.q)+'</td><td>'+nf2.format(r.o.cost/r.o.q)+'</td><td>'+nf2.format(r.p)+'</td><td><b>'+money0(r.val)+'</b></td><td>'+nf0.format(Math.abs(r.val)/v*100)+' %</td><td>'+txt(r.pl,money0)+' '+pill(r.pl/Math.abs(r.o.cost),pct1)+'</td></tr>').join(''):'<tr><td colspan="7" class="quiet">Aucune position. Choisissez une valeur dans le marché, puis achetez-la depuis le panneau de droite.</td></tr>';
  const by={};let tot=G.cash>0?G.cash:0;Object.keys(G.pos).forEach(t=>{const x=G.pos[t].q*P(t);by[ST[t].s]=(by[ST[t].s]||0)+x;tot+=x;});
  const parts=Object.entries(by).sort((a,b)=>b[1]-a[1]);if(G.cash>0)parts.push(['Liquidités',G.cash]);
  let ang=-Math.PI/2,svg='<svg viewBox="0 0 180 180" aria-label="Répartition de votre portefeuille">';
  const colOf=s=>s==='Liquidités'?'var(--line)':'hsl('+HUE[s]+' 55% 55%)';
  parts.forEach(([s,x])=>{const a=x/tot*Math.PI*2;if(a<=0)return;const a2=ang+a,large=a>Math.PI?1:0,r=80,ri=52;
    const p=(r,t)=>(90+r*Math.cos(t)).toFixed(2)+' '+(90+r*Math.sin(t)).toFixed(2);
    svg+=a>=Math.PI*2-1e-6?'<circle cx="90" cy="90" r="66" fill="none" stroke="'+colOf(s)+'" stroke-width="28"/>':'<path d="M'+p(r,ang)+' A'+r+' '+r+' 0 '+large+' 1 '+p(r,a2)+' L'+p(ri,a2)+' A'+ri+' '+ri+' 0 '+large+' 0 '+p(ri,ang)+'Z" fill="'+colOf(s)+'"/>';ang=a2;});
  svg+='<text x="90" y="86" text-anchor="middle" font-size="13" fill="var(--muted)">'+parts.length+' poche'+(parts.length>1?'s':'')+'</text><text x="90" y="106" text-anchor="middle" font-size="18" font-weight="700" fill="var(--ink)">'+short$(tot)+'</text></svg>';
  const OL=GM().orders;$('#ordAll').innerHTML=OL.length?'<h3 class="st">Ordres programmés</h3><div class="olist">'+OL.map(orderLine).join('')+'</div>':'';
  $('#alloc').innerHTML=svg+'<ul>'+parts.map(([s,x])=>'<li><i style="background:'+colOf(s)+'"></i><span>'+s+'</span><b>'+nf0.format(x/tot*100)+' %</b></li>').join('')+'</ul>';
  drawPort();
}
const TROPHIES=[
 {id:'first',n:'Premier ordre',d:'Acheter sa première action.',i:'M7 18l5-5 4 4 7-8'},
 {id:'div',n:'Rentier débutant',d:'Encaisser un premier dividende.',i:'M15 5c5 6 7 9 7 12a7 7 0 01-14 0c0-3 2-6 7-12z'},
 {id:'five',n:'Bien réparti',d:'Détenir des actions de 5 secteurs en même temps.',i:'M15 5v10l8 5M15 5a10 10 0 100 20 10 10 0 000-20'},
 {id:'ten',n:'Collectionneur',d:'Détenir 10 actions différentes.',i:'M6 8h18M6 15h18M6 22h18'},
 {id:'k100',n:'Six chiffres',d:'Atteindre 100 000 $ de fortune.',i:'M8 22V10l7-5 7 5v12z'},
 {id:'m1',n:'Millionnaire',d:'Atteindre un million de dollars.',i:'M15 4l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z'},
 {id:'beat',n:'Plus fort que le marché',d:'Battre le marché sur une année.',i:'M5 22l7-7 5 4 9-11M20 8h6v6'},
 {id:'storm',n:'Dans la tempête',d:'Rester investi à plus de 50 % pendant une récession.',i:'M8 16a5 5 0 010-10 7 7 0 0113 2 4 4 0 010 8zM10 20l-2 4M16 20l-2 4M22 20l-2 4'},
 {id:'panic',n:'Nerfs d\'acier',d:'Acheter un jour où l\'indice de peur dépasse 35.',i:'M15 4l11 20H4zM15 11v6M15 20v1'},
 {id:'short',n:'Contre le courant',d:'Gagner de l\'argent avec une vente à découvert.',i:'M5 8l7 7 5-4 9 11M20 22h6v-6'},
 {id:'prog',n:'Pilote automatique',d:'Faire exécuter un ordre programmé.',i:'M15 5a10 10 0 100 20 10 10 0 000-20M15 9v6l4 3'},
 {id:'double',n:'Doublé',d:'Une position qui a doublé de valeur.',i:'M6 22l6-6M12 22l12-12M18 10h6v6'},
 {id:'big',n:'Le gros coup',d:'Gagner 10 000 $ sur une seule vente.',i:'M15 6v18M10 10h7a3 3 0 010 6h-4a3 3 0 000 6h7'},
 {id:'podium',n:'Investisseur de l\'année',d:'Finir premier à une cérémonie de fin d\'année.',i:'M10 24V14h10v10M4 24v-6h6M20 24v-8h6'},
 {id:'duel',n:'Duelliste',d:'Remporter un défi contre un rival.',i:'M6 24L24 6M24 24L6 6'},
 {id:'luxe',n:'La belle vie',d:'S\'offrir un bien de luxe.',i:'M8 12l7-6 7 6-7 12z'},
 {id:'legend',n:'Légende',d:'Atteindre le grade de Légende de Wall Street.',i:'M5 20l3-10 7 6 7-6 3 10z'}
];
function trophyCheck(){
  const g=GM(),silent=!g.trophies&&G.day-G.start>5;g.trophies=g.trophies||{};const T=g.trophies,v=value(),inv=Object.keys(G.pos).reduce((a,t)=>a+G.pos[t].q*P(t),0);
  const ok={first:G.tx.some(x=>x.s==='A'),div:G.tx.some(x=>x.s==='D'),five:new Set(Object.keys(G.pos).map(t=>ST[t].s)).size>=5,ten:Object.keys(G.pos).length>=10,
    k100:v>=100000,m1:v>=1e6,beat:!!G.ach.beat,storm:G.macro.reg==='recession'&&inv>v*0.5,panic:G.tx.some(x=>x.s==='A'&&x.fear>35),short:G.tx.some(x=>x.s==='C'&&x.pl>0),
    prog:G.tx.some(x=>x.prog),double:Object.keys(G.pos).some(t=>G.pos[t].q*P(t)>=2*G.pos[t].cost),big:G.tx.some(x=>(x.s==='V'||x.s==='C')&&x.pl>=10000),
    podium:!!g.flags.podium,duel:!!g.flags.duel,luxe:Object.keys(g.items).length>0,legend:g.rank>=5};
  TROPHIES.forEach(t=>{if(ok[t.id]&&!T[t.id]){T[t.id]=G.date;if(silent)return;toast('Trophée débloqué : '+t.n,'var(--gold)');SND.ding();confetti(90);addXP(30);}});
}
function trophyHTML(){const T=GM().trophies||{},n=Object.keys(T).length;
  return '<h3 class="st">Trophées <span class="muted" style="font-size:15px;font-weight:500">'+n+' sur '+TROPHIES.length+'</span></h3><div class="trophies">'+TROPHIES.map(t=>'<div class="tro'+(T[t.id]?' got':'')+'" title="'+esc(t.d)+'"><svg viewBox="0 0 30 30" aria-hidden="true"><circle cx="15" cy="15" r="14" class="tro-bg"/><path d="'+t.i+'" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" transform="translate(3 3) scale(.8)"/></svg><b>'+t.n+'</b><small>'+(T[t.id]?dShort(T[t.id]):t.d)+'</small></div>').join('')+'</div>';}
function renderMissions(){
  const g=GM(),r=g.rank;
  let h='<div class="mgrid">'+g.missions.filter(m=>!m.done).map(m=>{const pr=missionProgress(m);return'<div class="mission"><div class="mi">'+missionIcon(m.type)+'</div><h4>'+esc(m.t)+'</h4><p>'+esc(m.d)+'</p><div class="prog"><i style="width:'+(pr*100).toFixed(0)+'%"></i></div><div class="rw"><span>'+(m.deadline?'Encore '+Math.max(0,m.deadline-G.day)+' séances':'Sans limite')+'</span><span><b>+'+m.xp+' XP</b>'+(m.cash?' et '+money0(m.cash):'')+'</span></div>'+(['first','days','terminal'].includes(m.type)?'':'<button class="linkb reroll" data-rr="'+g.missions.indexOf(m)+'"'+(g.reroll>G.day?' disabled':'')+'>'+(g.reroll>G.day?'Nouvelle mission possible dans '+(g.reroll-G.day)+' séances':'Changer de mission')+'</button>')+'</div>';}).join('')+'</div>';
  h+='<p class="muted" style="margin:10px 0 0;font-size:13.5px">'+g.done+' mission'+(g.done>1?'s':'')+' réussie'+(g.done>1?'s':'')+'. Une nouvelle mission remplace chaque mission terminée ou expirée.</p>';
  h+='<h3 class="st">Votre carrière</h3><div class="ranks">'+RANKS.map((R,k)=>'<div class="rk'+(k<=r?' got':'')+(k===r?' cur':'')+'"><span class="medal">'+(k+1)+'</span><div><b>'+R.n+'</b><br><small>'+R.u+'</small></div><small>'+nf0.format(R.xp)+' XP</small></div>').join('')+'</div>';
  h+=trophyHTML();
  $('#v-missions').innerHTML=h;
}
$('#v-missions').addEventListener('click',e=>{const b=e.target.closest('[data-rr]');if(!b||b.disabled)return;const g=GM();const k=+b.dataset.rr;g.missions.splice(k,1);g.missions.push(newMission());g.reroll=G.day+10;save();renderAll();});
function missionIcon(t){const I={first:'<path d="M6 18l6-6 4 4 8-9" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',days:'<rect x="4" y="6" width="22" height="18" rx="3" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M4 12h22M10 3v5M20 3v5" stroke="currentColor" stroke-width="2.2"/>',terminal:'<rect x="4" y="5" width="22" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M8 11h10M8 15h6" stroke="currentColor" stroke-width="2"/>',gain:'<path d="M5 22l7-7 5 4 9-11" stroke="currentColor" stroke-width="2.4" fill="none"/><path d="M20 8h6v6" stroke="currentColor" stroke-width="2.4" fill="none"/>',sectors:'<circle cx="15" cy="15" r="10" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M15 5v10l8 6" stroke="currentColor" stroke-width="2.2" fill="none"/>',profit:'<circle cx="15" cy="15" r="10" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M15 9v12M11 12h6a2 2 0 010 4h-4a2 2 0 000 4h6" stroke="currentColor" stroke-width="1.8" fill="none"/>',divs:'<path d="M15 4c6 7 8 10 8 14a8 8 0 01-16 0c0-4 2-7 8-14z" fill="none" stroke="currentColor" stroke-width="2.2"/>',beat:'<path d="M5 24h20M8 24V14h4v10M14 24V8h4v16M20 24v-6h4" stroke="currentColor" stroke-width="2.2" fill="none"/>',panic:'<path d="M15 4l12 21H3z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M15 11v7M15 21v1" stroke="currentColor" stroke-width="2.4"/>',earn:'<rect x="5" y="14" width="5" height="10" fill="currentColor"/><rect x="12.5" y="9" width="5" height="15" fill="currentColor"/><rect x="20" y="4" width="5" height="20" fill="currentColor"/>',short:'<path d="M5 8l7 7 5-4 9 11" stroke="currentColor" stroke-width="2.4" fill="none"/><path d="M20 22h6v-6" stroke="currentColor" stroke-width="2.4" fill="none"/>',pro:'<circle cx="13" cy="13" r="8" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M19 19l6 6" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',order:'<circle cx="15" cy="15" r="10" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M15 9v6l4 3" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round"/>',invest:'<path d="M6 20h18M9 20v-6M15 20V9M21 20v-9" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',hold:'<path d="M10 5h10M10 25h10M11 5c0 6 8 6 8 10s-8 4-8 10M19 5c0 6-8 6-8 10s8 4 8 10" stroke="currentColor" stroke-width="2" fill="none"/>',fav:'<path d="M15 4l3.3 6.8 7.4 1-5.4 5.2 1.3 7.4L15 21l-6.6 3.4 1.3-7.4-5.4-5.2 7.4-1z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'};return'<svg viewBox="0 0 30 30" width="26" height="26" aria-hidden="true">'+(I[t]||I.gain)+'</svg>';}
function renderRivaux(){
  const L=board();
  let h='<p class="intro">Trois investisseurs ont commencé avec le même capital que vous, sur le même marché. Max suit les tendances, Margaux achète les valeurs bon marché qui versent des dividendes, Kevin… improvise.</p><div class="rivals">';
  L.forEach((x,k)=>{const me=x.id==='me',R=me?null:RIVALS.find(r=>r.id===x.id),rv=me?null:GM().rivals.find(r=>r.id===x.id);
    const face=me?'<svg class="face" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="26" fill="#e0a526"/><text x="26" y="31" text-anchor="middle" font-size="13" font-weight="800" fill="#2a1d02">VOUS</text></svg>':faceSVG(R);
    const perf=me?perfMe():perfR(rv);
    h+='<div class="rv'+(me?' me':'')+'"><span class="pos">'+(k+1)+'</span>'+face+'<div><b>'+(me?'Vous':esc(R.n))+'</b><small>'+(me?RANKS[GM().rank].n:R.nick+(rv.resets?', reparti de zéro '+rv.resets+' fois':''))+'</small></div><div class="val"><b>'+money0(x.v)+'</b>'+txt(perf,pct1)+'</div></div>';});
  h+='</div>';
  if(GM().duel){const d=GM().duel,R=RIVALS.find(x=>x.id===d.rid),r=GM().rivals.find(x=>x.id===d.rid);h+='<div class="blk pro" style="margin-top:14px"><h4>Défi en cours contre '+esc(R.n)+'</h4><div class="ln"><span>Vous '+txt(value()/d.v0-1,pct1)+'</span><span>'+esc(R.n.split(' ')[0])+' '+txt(rivalVal(r)/d.r0-1,pct1)+'</span></div><span class="muted">Fin dans '+(d.end-G.day)+' séances, mise de '+money0(d.a)+'.</span></div>';}
  h+='<h3 class="st">La course des fortunes</h3><div class="race-leg">'+[['Vous','#e0a526']].concat(RIVALS.map(r=>[r.n.split(' ')[0],r.c])).map(x=>'<span><i style="background:'+x[1]+'"></i>'+x[0]+'</span>').join('')+'</div><div class="chart tall"><canvas id="cRace"></canvas><div class="tip"></div></div>';
  h+='<h3 class="st">Messages</h3><div class="chat">'+(GM().msgs.slice(-12).reverse().map(m=>{const R=RIVALS.find(x=>x.id===m.id);return'<div class="msg">'+faceSVG(R,40)+'<div class="bubble"><small>'+esc(R.n)+', '+dShort(m.date)+'</small>'+esc(m.text)+'</div></div>';}).join('')||'<div class="quiet">Vos rivaux ne vous ont pas encore remarqué.</div>')+'</div>';
  $('#v-rivaux').innerHTML=h;
  const H=GM().hist;const cv=$('#cRace');
  if(H.length>1){const labels=H.map(x=>x.d);chart(cv,RIVALS.map((r,k)=>({d:H.map(x=>x.r[k]),c:r.c,w:1.8})).concat([{d:H.map(x=>x.me),c:'#e0a526',w:3,dot:true}]),labels,v=>short$(v));cv.addEventListener('mousemove',e=>hover(cv,e));cv.addEventListener('mouseleave',()=>cv.parentElement.querySelector('.tip').style.display='none');}
  else cv.parentElement.innerHTML='<div class="quiet" style="padding:20px 0">La course démarre : revenez dans quelques séances.</div>';
}
const ITEMART={
  watch:'<circle cx="60" cy="42" r="22" fill="#f4f1ea" stroke="#c99a33" stroke-width="5"/><path d="M60 42V28M60 42l10 6" stroke="#1f3a5f" stroke-width="3" stroke-linecap="round"/><rect x="52" y="8" width="16" height="14" rx="3" fill="#c99a33"/><rect x="52" y="62" width="16" height="14" rx="3" fill="#c99a33"/>',
  car:'<path d="M14 56l10-16c4-5 10-8 18-8h30c8 0 14 4 20 10l14 14v10H14z" fill="#d63031"/><circle cx="34" cy="68" r="9" fill="#222"/><circle cx="88" cy="68" r="9" fill="#222"/><path d="M40 38h26v14H32z" fill="#9fd3f5"/>',
  art:'<rect x="22" y="10" width="76" height="62" rx="2" fill="#c99a33"/><rect x="28" y="16" width="64" height="50" fill="#2e86ab"/><circle cx="48" cy="34" r="9" fill="#f4c430"/><path d="M28 66l22-20 14 12 12-10 16 18z" fill="#2d3436"/>',
  penthouse:'<rect x="34" y="20" width="52" height="60" fill="#1f3a5f"/><path d="M30 20l30-14 30 14z" fill="#e0a526"/><g fill="#f6d27a"><rect x="42" y="30" width="8" height="8"/><rect x="56" y="30" width="8" height="8"/><rect x="70" y="30" width="8" height="8"/><rect x="42" y="46" width="8" height="8"/><rect x="70" y="46" width="8" height="8"/></g>',
  yacht:'<path d="M10 54h100l-14 16H22z" fill="#f4f1ea"/><rect x="34" y="40" width="46" height="14" rx="3" fill="#f4f1ea"/><rect x="40" y="44" width="34" height="5" fill="#1f3a5f"/><path d="M0 78q15-6 30 0t30 0 30 0 30 0" stroke="#2e86ab" stroke-width="4" fill="none"/>',
  jet:'<path d="M10 44l90-10 10 6-10 6-90-2z" fill="#f4f1ea"/><path d="M52 40l-14-24h10l22 22zM52 46l-12 20h10l20-18z" fill="#dfe6e9"/><path d="M14 44l-6-14h8l8 12z" fill="#e0a526"/>',
  island:'<ellipse cx="60" cy="70" rx="48" ry="10" fill="#d9b26f"/><path d="M60 68c4-20 0-36-6-50" stroke="#6b4a2b" stroke-width="5" fill="none"/><g fill="#2e8b57"><ellipse cx="44" cy="18" rx="16" ry="6"/><ellipse cx="68" cy="16" rx="16" ry="6"/><ellipse cx="56" cy="10" rx="12" ry="5"/></g><path d="M0 80q15-6 30 0t30 0 30 0 30 0" stroke="#2e86ab" stroke-width="4" fill="none"/>'
};
function renderShop(){
  const g=GM(),v=value();
  let pres=0;for(const id in g.items){const it=SHOP.find(x=>x.id===id);if(it)pres+=it.pr;}
  let h='<p class="intro">Profitez de vos gains. Chaque bien compte dans votre fortune pour 60 % de son prix (ce que vous en tireriez en le revendant), et certains apparaissent dans la ville. Prestige actuel : <b>'+pres+'</b>.</p><div class="shop">';
  SHOP.forEach(it=>{const own=g.items[it.id],locked=g.rank<it.r;
    h+='<div class="item'+(own?' own':'')+(locked?' locked':'')+'"><svg viewBox="0 0 120 84" aria-hidden="true">'+ITEMART[it.id]+'</svg><h4>'+it.n+'</h4><p>'+it.d+'</p><div class="pr"><b>'+short$(it.p)+'</b>'+(own?'<button class="btn" data-sell="'+it.id+'">Revendre '+short$(it.p*0.6)+'</button>':locked?'<span class="muted" style="font-size:13px">Grade '+RANKS[it.r].n+'</span>':'<button class="btn go" data-buy="'+it.id+'"'+(G.cash<it.p?' disabled':'')+'>Acheter</button>')+'</div></div>';});
  h+='</div>';
  $('#v-shop').innerHTML=h;
}
$('#v-shop').addEventListener('click',e=>{
  const b=e.target.closest('[data-buy]'),s=e.target.closest('[data-sell]');
  if(b){const it=SHOP.find(x=>x.id===b.dataset.buy);if(G.cash<it.p)return;G.cash-=it.p;GM().items[it.id]=G.day;G.tx.push({day:G.day,date:G.date,t:null,s:'L',q:1,p:it.p,f:0,pl:-it.p,item:it.n});addXP(Math.round(it.pr/2),it.n);SND.fanfare();confetti(160);save();renderAll();}
  if(s){const it=SHOP.find(x=>x.id===s.dataset.sell);delete GM().items[it.id];G.cash+=it.p*0.6;G.tx.push({day:G.day,date:G.date,t:null,s:'R',q:1,p:it.p*0.6,f:0,pl:it.p*0.6,item:it.n});save();renderAll();}
});
function renderOrdres(){
  const L={A:'Achat',V:'Vente',D:'Dividende',P:'Recherche Pro',S:'Vente à découvert',C:'Rachat',L:'Achat de luxe',R:'Revente'};
  $('#tTx tbody').innerHTML=G.tx.length?G.tx.slice(-300).reverse().map(x=>'<tr'+(x.t?' data-t="'+x.t+'"':'')+'><td>'+dShort(x.date)+'</td><td>'+(x.s==='A'||x.s==='C'?'<span class="pill up">'+L[x.s]+'</span>':x.s==='V'||x.s==='S'?'<span class="pill down">'+L[x.s]+'</span>':'<span class="pill flat">'+L[x.s]+'</span>')+'</td><td>'+(x.t?esc(ST[x.t].n):x.item?esc(x.item):'—')+'</td><td>'+nf0.format(x.q)+'</td><td>'+nf2.format(x.p)+'</td><td>'+nf2.format(x.f)+'</td><td>'+money0(x.q*x.p)+'</td><td>'+(x.s==='A'||x.s==='S'?'':txt(x.pl,money0))+'</td></tr>').join(''):'<tr><td colspan="8" class="quiet">Aucune opération pour l\'instant.</td></tr>';
}
function renderAll(){
  renderBoard();renderTape();renderHero();renderCards();renderUne();renderFiche();
  const V={cote:()=>{if(COTEV.vis)renderCote();else COTEV.dirty=true;},terminal:renderTerminal,portef:renderPortef,missions:renderMissions,rivaux:renderRivaux,shop:renderShop,ordres:renderOrdres};V[tab]();
}

/* ---------- graphiques ---------- */
const CSSV={};function css(n){return n in CSSV?CSSV[n]:(CSSV[n]=getComputedStyle(document.documentElement).getPropertyValue(n).trim());}
try{matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{for(const k in CSSV)delete CSSV[k];});}catch(e){}
const CSZ={};const RO=window.ResizeObserver?new ResizeObserver(es=>es.forEach(e=>{const b=e.borderBoxSize&&e.borderBoxSize[0];e.target._sz=b?{width:b.inlineSize,height:b.blockSize}:{width:e.target.offsetWidth,height:e.target.offsetHeight};})):null;
function hex(c){if(/^#[0-9a-f]{6}$/i.test(c))return c;const t=document.createElement('div');t.style.color=c;document.body.appendChild(t);const m=getComputedStyle(t).color.match(/\d+/g);t.remove();return'#'+m.slice(0,3).map(x=>(+x).toString(16).padStart(2,'0')).join('');}
function chart(canvas,series,labels,fmt,marks,lines){
  const wrap=canvas.parentElement;if(RO&&!wrap._ro){wrap._ro=1;RO.observe(wrap);}const sz=(wrap._sz&&wrap._sz.width>=10)?wrap._sz:(canvas.id&&CSZ[canvas.id]&&CSZ[canvas.id].iw===innerWidth?CSZ[canvas.id]:null),r=sz||wrap.getBoundingClientRect();if(canvas.id&&r.width>=10)CSZ[canvas.id]={width:r.width,height:r.height,iw:innerWidth};const dpr=window.devicePixelRatio||1;if(r.width<10)return;
  const cw=Math.round(r.width*dpr),ch=Math.round(r.height*dpr);if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch;}const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,r.width,r.height);c.globalAlpha=1;c.setLineDash([]);
  const W=r.width,H=r.height,L=2,R=58,T=10,B=22;let mn=Infinity,mx=-Infinity;series.forEach(s=>s.d.forEach(v=>{if(v!=null){mn=Math.min(mn,v);mx=Math.max(mx,v);}}));(lines||[]).forEach(l=>{mn=Math.min(mn,l.v);mx=Math.max(mx,l.v);});
  if(mx===mn){mx+=1;mn-=1;}const pad=(mx-mn)*0.1;mn-=pad;mx+=pad;
  const n=labels.length,X=k=>L+(n<2?0:k/(n-1))*(W-L-R),Y=v=>T+(1-(v-mn)/(mx-mn))*(H-T-B);
  c.strokeStyle=css('--line');c.lineWidth=1;c.setLineDash([2,4]);c.fillStyle=css('--muted');c.font='12px '+(css('--body')||'sans-serif');c.textBaseline='middle';c.textAlign='left';
  for(let g=0;g<4;g++){const v=mn+(mx-mn)*(g+0.5)/4,y=Math.round(Y(v))+.5;c.beginPath();c.moveTo(L,y);c.lineTo(W-R,y);c.stroke();c.fillText(fmt(v),W-R+8,y);}
  c.setLineDash([]);c.textBaseline='alphabetic';
  if(n>1){const o=n<130?{day:'numeric',month:'short',timeZone:'UTC'}:{month:'short',year:'numeric',timeZone:'UTC'};[0,Math.floor((n-1)/2),n-1].forEach((k,j)=>{c.textAlign=j===0?'left':j===2?'right':'center';c.fillText(fdate(dObj(labels[k]),o),j===2?W-R:X(k),H-5);});}
  series.forEach(s=>{c.beginPath();s.d.forEach((v,k)=>{const x=X(k),y=Y(v);k?c.lineTo(x,y):c.moveTo(x,y);});c.strokeStyle=s.c;c.lineWidth=s.w||2.2;c.lineJoin='round';c.setLineDash(s.dash||[]);c.stroke();c.setLineDash([]);
    if(s.fill){c.lineTo(X(n-1),H-B);c.lineTo(X(0),H-B);c.closePath();const g=c.createLinearGradient(0,T,0,H-B);g.addColorStop(0,s.c+'44');g.addColorStop(1,s.c+'00');c.fillStyle=g;c.fill();}
    if(s.dot){const x=X(n-1),y=Y(s.d[n-1]);c.beginPath();c.arc(x,y,7,0,7);c.fillStyle=s.c+'33';c.fill();c.beginPath();c.arc(x,y,3.5,0,7);c.fillStyle=s.c;c.fill();}});
  (lines||[]).forEach(l=>{const y=Math.round(Y(l.v))+.5;c.strokeStyle=l.c;c.lineWidth=1.5;c.setLineDash([6,4]);c.beginPath();c.moveTo(L,y);c.lineTo(W-R,y);c.stroke();c.setLineDash([]);c.font='600 11px '+(css('--body')||'sans-serif');const tw=c.measureText(l.lab).width+10;c.fillStyle=l.c;roundRect(c,W-R-tw-4,y-9,tw,18,6);c.fill();c.fillStyle='#fff';c.textAlign='left';c.textBaseline='middle';c.fillText(l.lab,W-R-tw+1,y+.5);c.textBaseline='alphabetic';});
  (marks||[]).forEach(mk=>{if(mk.k<0||mk.k>=n)return;const x=X(mk.k);const base=series[series.length-1].d[mk.k];const y=Y(base);
    if(mk.kind==='r'){c.fillStyle=css('--gold');c.beginPath();c.arc(x,H-B-4,3.5,0,7);c.fill();c.strokeStyle=css('--gold');c.globalAlpha=.35;c.setLineDash([2,3]);c.beginPath();c.moveTo(x,H-B-8);c.lineTo(x,y+6);c.stroke();c.setLineDash([]);c.globalAlpha=1;return;}
    const up=mk.kind==='b';c.fillStyle=up?css('--up'):css('--down');c.strokeStyle=css('--surface');c.lineWidth=1.5;c.beginPath();
    if(up){c.moveTo(x,y+6);c.lineTo(x-6,y+16);c.lineTo(x+6,y+16);}else{c.moveTo(x,y-6);c.lineTo(x-6,y-16);c.lineTo(x+6,y-16);}c.closePath();c.fill();c.stroke();});
  canvas._m={X,n,labels,series,L,R,W,fmt};
}
function drawStock(){
  const a=G.st[sel].p,n=Math.min(range,a.length),d=a.slice(-n),labels=G.dates.slice(-n),first=G.dates.length-n;
  const series=[];
  if(showMA){const ma=[];for(let k=0;k<n;k++){const j=first+k,lo=Math.max(0,j-49);let s=0;for(let i=lo;i<=j;i++)s+=a[i];ma.push(s/(j-lo+1));}series.push({d:ma,c:hex(css('--accent')),w:1.4,dash:[4,3]});}
  series.push({d,c:hex(d[d.length-1]<d[0]?css('--down'):css('--up')),fill:true,dot:true});
  const idxOf={};labels.forEach((x,k)=>idxOf[x]=k);
  const marks=[];
  G.tx.forEach(x=>{if(x.t===sel&&idxOf[x.date]!=null&&'AVSC'.includes(x.s))marks.push({k:idxOf[x.date],kind:(x.s==='A'||x.s==='C')?'b':'s'});});
  G.news.forEach(x=>{if(x.cat==='resultats'&&x.tk===sel&&idxOf[x.date]!=null)marks.push({k:idxOf[x.date],kind:'r'});});
  const lines=GM().orders.filter(o=>o.t===sel).map(o=>({v:o.px,c:o.s==='A'?css('--up'):(o.dir==='le'?css('--down'):css('--gold')),lab:(o.s==='A'?'Achat ':o.dir==='le'?'Stop ':'Objectif ')+nf2.format(o.px)}));
  if(omode==='cond'&&+$('#cPx').value>0)lines.push({v:+$('#cPx').value,c:css('--accent'),lab:'Déclencheur '+nf2.format(+$('#cPx').value)});
  chart($('#cStock'),series,labels,v=>nf2.format(v),marks,lines);
}
function drawPort(){const sp=startPos(),labels=G.dates.slice(sp),base=G.idx[sp];const idx=G.idx.slice(sp).map(x=>G.cap*x/base),vals=G.vals.slice(sp);const cv=$('#cPort');if(labels.length<2){cv.getContext('2d').clearRect(0,0,cv.width,cv.height);return;}chart(cv,[{d:idx,c:hex(css('--muted')),w:1.6,dash:[5,4]},{d:vals,c:hex(css('--gold')),fill:true,dot:true}],labels,v=>nf0.format(v));}
function hover(canvas,ev){const m=canvas._m,tip=canvas.parentElement.querySelector('.tip');if(!m)return;const r=canvas.getBoundingClientRect();let k=Math.round((ev.clientX-r.left-m.L)/(m.W-m.L-m.R)*(m.n-1));k=Math.max(0,Math.min(m.n-1,k));tip.textContent=dShort(m.labels[k])+'  '+m.series.slice().reverse().map(s=>m.fmt(s.d[k])).join(' / ');tip.style.display='block';tip.style.left=Math.max(0,Math.min(m.X(k)+10,r.width-tip.offsetWidth-4))+'px';tip.style.top='0px';}
['#cStock','#cPort'].forEach(id=>{const c=$(id);c.addEventListener('mousemove',e=>hover(c,e));c.addEventListener('mouseleave',()=>c.parentElement.querySelector('.tip').style.display='none');});
new ResizeObserver(()=>{if(G){drawStock();if(tab==='portef')drawPort();}}).observe($('#cStock').parentElement);
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>G&&renderAll());
new MutationObserver(()=>G&&renderAll()).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});

/* ---------- actions ---------- */
function toast(msg,c){const el=document.createElement('div');el.className='toast';el.style.setProperty('--c',c||'var(--gold)');el.textContent=msg;$('#toasts').appendChild(el);setTimeout(()=>el.remove(),3600);while($('#toasts').children.length>(innerWidth<720?2:3))$('#toasts').firstChild.remove();}
function info(html){GM().stats.pop++;$('#infoDlg').innerHTML=html;$('#mInfo').hidden=false;const b=$('#infoDlg [data-close]');if(b)b.focus();}
$('#mInfo').addEventListener('click',e=>{if(e.target.closest('[data-close]')||e.target.id==='mInfo'){$('#mInfo').hidden=true;nextPopup();}});
function doTrade(s,q,silent){
  if(GM().lock>G.day){toast('Connexion coupée : impossible de passer un ordre.','var(--down)');return;}
  const p=P(sel);if(q<1){toast('Indiquez une quantité d\'au moins 1 titre.','var(--down)');return;}
  const g=q*p,f=Math.max(FEE_MIN,g*FEE_RATE),S=GM().shorts;
  if(s==='A'){if(g+f>G.cash+1e-9){toast('Liquidités insuffisantes : il faut '+money(g+f)+'.','var(--down)');return;}G.cash-=g+f;const o=G.pos[sel]||(G.pos[sel]={q:0,cost:0});o.q+=q;o.cost+=g+f;G.tx.push({day:G.day,date:G.date,t:sel,s:'A',q,p,f,fear:G.macro.fear});toast('Acheté : '+nf0.format(q)+' '+ST[sel].n+' à '+money(p)+'.','var(--up)');SND.cash();}
  if(s==='V'){const o=G.pos[sel];if(!o||o.q<q){toast('Vous ne détenez que '+(o?o.q:0)+' titre(s) '+ST[sel].n+'.','var(--down)');return;}const c=o.cost*q/o.q,pl=g-f-c;o.cost-=c;o.q-=q;if(o.q===0)delete G.pos[sel];G.cash+=g-f;G.tx.push({day:G.day,date:G.date,t:sel,s:'V',q,p,f,pl});toast('Vendu : '+nf0.format(q)+' '+ST[sel].n+', '+(pl>=0?'gain':'perte')+' de '+money(Math.abs(pl))+'.',pl>=0?'var(--up)':'var(--down)');if(pl>0){SND.cash();if(pl>value()*0.05)confetti(60);}}
  if(s==='S'){if(q>maxQty()){toast('Pari trop gros pour votre fortune : maximum '+nf0.format(maxQty())+' titres.','var(--down)');return;}const o=S[sel]||(S[sel]={q:0,entry:0});o.entry=(o.entry*o.q+p*q)/(o.q+q);o.q+=q;G.cash+=g-f;G.tx.push({day:G.day,date:G.date,t:sel,s:'S',q,p,f});toast('Pari à la baisse ouvert : '+nf0.format(q)+' '+ST[sel].n+' à '+money(p)+'.','var(--down)');}
  if(s==='C'){if(!S[sel]){toast('Aucun pari à la baisse sur cette valeur.','var(--down)');return;}coverShort(sel,q);}
  if((s==='A'||s==='V')&&!silent&&rnd()<0.14)rivalReact(s,sel);
  G.vals[G.vals.length-1]=value();checkMissions();trophyCheck();save();if(!silent)renderAll();
}
function rivalReact(s,t){
  const R=pickA(RIVALS),n=ST[t].n,mom=ret(t,126),cheap=G.st[t].pe<secPE(ST[t].s);let line;
  if(R.id==='max')line=s==='A'?(mom>0?n+' ? Bon choix, la tendance est avec toi.':'Tu achètes '+n+' en pleine chute ? On ne rattrape pas un couteau qui tombe.'):(mom>0?'Tu vends '+n+' alors que ça monte ? Trop tôt, l\'ami.':'Vendre '+n+', enfin une décision de loup.');
  else if(R.id==='margaux')line=s==='A'?(cheap?'Joli, '+n+' n\'est vraiment pas chère.':n+' à ce prix-là ? Courageux.'):'Encaisser fait toujours du bien. Pensez aux frais.';
  else line=s==='A'?pickA(['J\'ai '+n+' aussi ! Enfin, j\'en avais.','Tu suis mes conseils maintenant ?','Si tu achètes '+n+', moi je double !']):pickA(['Vendre ? Jamais. Bon, parfois.','Tu as peur ou quoi ?']);
  say(R.id,line,true);
}
function checkGoals(){
  const v=value(),goals=[[100000,'100 000 $'],[250000,'250 000 $'],[1e6,'Millionnaire'],[1e7,'Dix millions'],[1e8,'Cent millions'],[1e9,'Milliardaire']];
  goals.forEach(g=>{if(v>=g[0]&&g[0]>G.cap&&!G.ach[g[0]]){G.ach[g[0]]=G.date;addGameNews({title:'Cap franchi : '+g[1],x:'Votre fortune dépasse '+money0(g[0])+'.',big:true});addXP(100,g[1]);confetti(200);SND.fanfare();}});
}
let popQueue=[];
function ceremony(prime,out,me,mk){
  const L=board(),pos=L.findIndex(x=>x.id==='me')+1,yr=Math.round((G.day-G.start)/252);
  const xp=[0,300,150,80,0][pos];if(xp)addXP(xp);if(pos===1)GM().flags.podium=1;
  const yt=G.tx.filter(x=>x.day>G.day-252&&(x.s==='V'||x.s==='C'));
  const best=yt.slice().sort((a,b)=>b.pl-a.pl)[0],worst=yt.slice().sort((a,b)=>a.pl-b.pl)[0];
  const face=id=>id==='me'?'<svg class="face" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="26" fill="#e0a526"/><text x="26" y="31" text-anchor="middle" font-size="13" font-weight="800" fill="#2a1d02">VOUS</text></svg>':faceSVG(RIVALS.find(r=>r.id===id));
  const nm=x=>x.id==='me'?'Vous':x.n.split(' ')[0];
  const order=[1,0,2].filter(k=>L[k]),H=[110,150,84];
  const pod='<div class="podium-c">'+order.map(k=>'<div class="pc"><div class="pf">'+face(L[k].id)+'</div><b>'+nm(L[k])+'</b><small>'+short$(L[k].v)+'</small><div class="step s'+(k+1)+'" style="height:'+H[k===0?1:k===1?0:2]+'px"><span>'+(k+1)+'</span></div></div>').join('')+'</div>';
  popQueue.push('<div '+(pos<=3?'data-fx ':'')+'class="dlg-top" style="background:linear-gradient(160deg,#1a2333,#3a2b5c)"><div style="font-size:14px;opacity:.8">Cérémonie de fin d\'année, '+(yr===1?'votre première année':'année '+yr)+' à Wall Street</div><h2 id="infoTitle">'+(pos===1?'Vous êtes le meilleur investisseur de l\'année !':pos===2?'Deuxième place, tout près du sommet':pos===3?'Sur le podium':'Hors du podium cette année')+'</h2>'+pod+'</div><div class="dlg-body"><div class="rc-nums"><div><span class="muted">Vos placements</span><b class="'+cls(me)+'">'+pct1(me)+'</b></div><div><span class="muted">Le marché</span><b class="'+cls(mk)+'">'+pct1(mk)+'</b></div><div><span class="muted">Prime</span><b>'+short$(prime)+'</b></div></div>'+(xp?'<p class="gold" style="margin:10px 0 0"><b>+'+xp+' XP pour votre place sur le podium.</b></p>':'')+(best&&best.pl>0?'<p style="margin:10px 0 0">Meilleur coup : <b>'+esc(ST[best.t].n)+'</b>, '+money0(best.pl)+'.</p>':'')+(worst&&worst.pl<0?'<p style="margin:4px 0 0">Pire coup : <b>'+esc(ST[worst.t].n)+'</b>, '+money0(worst.pl)+'.</p>':'')+'<div class="dlg-act"><button class="btn go" data-close>Année suivante</button></div></div>');
}
const COACH=[
 ['#hero','Votre tour','Votre fortune fait grandir ce gratte-ciel. Les trois autres tours sont celles de vos rivaux : dépassez-les.'],
 ['#listWrap','Le marché','Quatre-vingt-dix sociétés. Cliquez sur une ligne pour ouvrir sa fiche. Le bouton Carte montre tout le marché en couleurs.'],
 ['.order','Passer un ordre','Choisissez une quantité, puis achetez. Vous pouvez aussi programmer un ordre qui se déclenchera tout seul si le cours atteint un niveau.'],
 ['#bNext','Faire avancer le temps','Chaque clic fait passer une journée de Bourse. Les boutons voisins avancent d\'une semaine ou d\'un mois.'],
 ['.tabs','Votre carrière','Missions, rivaux, train de vie : remplissez des missions pour monter en grade et débloquer de nouveaux outils.']
];
let coachK=-1;
function coach(k){
  coachK=k;const box=$('#coach');
  if(k>=COACH.length||k<0){box.hidden=true;try{localStorage.setItem('wallst-tuto','1');}catch(e){}return;}
  const [selq,t,x]=COACH[k],el=document.querySelector(selq);if(!el){coach(k+1);return;}
  el.scrollIntoView({block:'center',behavior:'auto'});
  box.hidden=false;
  requestAnimationFrame(()=>{const r=el.getBoundingClientRect(),pad=8,h=$('#coachHole');
    const top=Math.max(4,r.top-pad),hh=Math.min(innerHeight-8,r.height+pad*2);
    Object.assign(h.style,{left:(r.left-pad)+'px',top:top+'px',width:(r.width+pad*2)+'px',height:hh+'px'});
    const tip=$('#coachTip');
    tip.innerHTML='<h3 id="coachT">'+t+'</h3><p>'+x+'</p><div class="row"><div class="dots">'+COACH.map((_,i)=>'<i'+(i===k?' class="on"':'')+'></i>').join('')+'</div><div class="row" style="gap:6px"><button class="btn" data-co="skip">Passer</button><button class="btn go" data-co="next">'+(k===COACH.length-1?'C\'est parti':'Suivant')+'</button></div></div>';
    const tw=Math.min(340,innerWidth-24);let tx=Math.min(Math.max(12,r.left),innerWidth-tw-12),ty=r.bottom+14;
    if(ty+190>innerHeight)ty=Math.max(12,r.top-200);
    Object.assign(tip.style,{left:tx+'px',top:ty+'px'});
    tip.querySelector('[data-co=next]').focus();
  });
}
$('#coach').addEventListener('click',e=>{const b=e.target.closest('[data-co]');if(!b)return;coach(b.dataset.co==='next'?coachK+1:99);});
function nextPopup(){
  if(!$('#mInfo').hidden||!$('#mEvent').hidden)return;
  if(promoQueue.length){showPromo(promoQueue.shift());return;}
  if(evQueue.length){evQueue.shift();showDilemma();return;}
  if(popQueue.length){const h=popQueue.shift();info(h);if(h.includes('data-fx')){SND.fanfare();confetti(200);}return;}
}
function step(n){
  if(busy)return;busy=true;
  const v0=value(),m0=G.idx[G.idx.length-1],tx0=G.tx.length,d0=G.date,news0=G.news.length,rank0=myRank(),vStart=G.vals.length,c0=contrib();let stop=false;
  breaking.hit=0;
  for(let k=0;k<n;k++){
    preStep();
    E.step(G);
    rivalStep();shortsStep();execOrders();postStep();
    G.vals[G.vals.length-1]=value();
    checkMissions();checkGoals();trophyCheck();rivalTalk();
    G.tx.slice(tx0).forEach(x=>{if(x.s==='D'&&x.day===G.day&&n===1)toast('Dividende reçu : '+money(x.pl)+' de '+ST[x.t].n+'.','var(--gold)');});
    if(promoQueue.length||evQueue.length)stop=true;
    if(auto&&G.news.some(x=>x.day===G.day&&(x.big||(x.tk&&G.pos[x.tk]&&x.cat!=='analyste'))))stop=true;
    if(n>1&&breaking.hit&&k<n-1){stop=true;toast('Avance interrompue : flash spécial. À vous de jouer.','var(--red)');}
    if(stop)break;
  }
  if(stop&&auto)stopAuto();
  if(n>1)showRecap(v0,m0,tx0,d0,news0,rank0,vStart,c0);
  save();if(!auto)SND.bell();renderAll();busy=false;nextPopup();
}
function showRecap(v0,m0,tx0,d0,news0,rank0,vStart,c0){
  const v=value(),m=G.idx[G.idx.length-1],dep=contrib()-c0,mine=(v-dep)/v0-1,mk=m/m0-1,rk=myRank();
  const divs=G.tx.slice(tx0).filter(x=>x.s==='D').reduce((a,x)=>a+x.pl,0);
  const big=G.news.slice(news0).filter(x=>x.big).slice(-3);
  const n=G.vals.length-vStart+1, vs=G.vals.slice(-n), is=G.idx.slice(-n);
  const wd={};G.tx.slice(tx0).forEach(x=>{if(x.s==='W')wd[x.date]=(wd[x.date]||0)+x.pl;});const ds=G.dates.slice(-n);
  const bars=[];for(let k=1;k<vs.length;k++)bars.push({a:(vs[k]-(wd[ds[k]]||0))/vs[k-1]-1,b:is[k]/is[k-1]-1});
  const mx=Math.max(0.005,...bars.map(x=>Math.max(Math.abs(x.a),Math.abs(x.b))));
  const bw=Math.max(3,Math.min(12,Math.floor(300/Math.max(1,bars.length))-2));
  let svg='<svg viewBox="0 0 '+(bars.length*(bw+2))+' 60" preserveAspectRatio="none" class="rbars" aria-hidden="true"><line x1="0" y1="30" x2="9999" y2="30" stroke="var(--line)"/>';
  bars.forEach((x,k)=>{const h=Math.abs(x.a)/mx*28;svg+='<rect x="'+(k*(bw+2))+'" y="'+(x.a>=0?30-h:30)+'" width="'+bw+'" height="'+Math.max(1,h)+'" rx="1.5" fill="'+(x.a>=0?'var(--up)':'var(--down)')+'"/>';const hb=x.b/mx*28;svg+='<rect x="'+(k*(bw+2))+'" y="'+(30-hb-1)+'" width="'+bw+'" height="2" fill="var(--ink)" opacity=".55"/>';});
  svg+='</svg>';
  const el=$('#recapCard');
  el.innerHTML='<button class="rc-x" aria-label="Fermer le bilan">×</button><div class="muted" style="font-size:13px">Bilan du '+dShort(d0)+' au '+dShort(G.date)+'</div><div class="rc-nums"><div><span class="muted">Vos placements</span><b class="'+cls(mine)+'">'+pct1(mine)+'</b></div><div><span class="muted">Le marché</span><b class="'+cls(mk)+'">'+pct1(mk)+'</b></div><div><span class="muted">Classement</span><b>'+rk+(rk===1?'er':'e')+(rk<rank0?' <small class="up">▲'+(rank0-rk)+'</small>':rk>rank0?' <small class="down">▼'+(rk-rank0)+'</small>':'')+'</b></div></div>'+svg+'<div class="rc-leg"><span><i style="background:var(--up)"></i>votre journée</span><span><i style="background:var(--ink);opacity:.55;height:2px"></i>le marché</span></div>'+(divs||dep?'<div style="font-size:13.5px">'+(divs?'Dividendes : <b>'+money0(divs)+'</b>  ':'')+(dep?'Salaire et primes : <b>'+money0(dep)+'</b>':'')+'</div>':'')+(big.length?'<ul>'+big.map(x=>'<li>'+esc(x.title)+'</li>').join('')+'</ul>':'');
  el.hidden=false;document.body.classList.add('has-recap');document.body.style.setProperty('--recap-h',(el.offsetHeight+30)+'px');el.classList.remove('in');void el.offsetWidth;el.classList.add('in');
  const hide=()=>{el.hidden=true;document.body.classList.remove('has-recap');};
  clearTimeout(showRecap.t);showRecap.t=setTimeout(hide,9000);
  el.querySelector('.rc-x').onclick=hide;
}
function stopAuto(){clearInterval(auto);auto=null;const b=$('#bAuto');b.classList.remove('on');b.setAttribute('aria-pressed','false');b.textContent='Lecture auto';}
function setTab(t){tab=t;document.querySelectorAll('.tab').forEach(b=>b.setAttribute('aria-selected',b.dataset.tab===t));['cote','terminal','portef','missions','rivaux','shop','ordres'].forEach(v=>$('#v-'+v).hidden=v!==t);renderAll();}
function setSub(s){sub=s;if(s==='macro'){GM().flags.terminal=1;checkMissions();}renderTerminal();}
function pick(t){if(!ST[t])return;sel=t;if(tab==='cote')renderCote();renderFiche();if(innerWidth<=1040)$('#aside').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
function today(){const d=new Date();d.setUTCHours(12);while(d.getUTCDay()===0||d.getUTCDay()===6)d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10);}

/* ---------- liaisons ---------- */
$('#secF').innerHTML='<option value="">Tous les secteurs</option>'+secList.map(s=>'<option>'+s+'</option>').join('');
$('#sGo').onclick=()=>{const cap=+document.querySelector('input[name=cap]:checked').value;chosenDiff=+document.querySelector('input[name=diff]:checked').value;G=E.init(DATA,today(),cap);ensureGame();sel='AAPL';side='A';shownVal=null;SKY.heights={};save();$('#mStart').hidden=true;setTab('cote');toast('Bienvenue à Wall Street. Vos premières missions vous attendent.','var(--gold)');let done=false;try{done=localStorage.getItem('wallst-tuto')==='1';}catch(e){}if(!done)setTimeout(()=>coach(0),400);};
$('#sResume').onclick=()=>{$('#mStart').hidden=true;renderAll();};
$('#bMenu').onclick=()=>{stopAuto();$('#sResume').hidden=false;$('#mStart').hidden=false;};
$('#bNext').onclick=()=>step(1);$('#mNext').onclick=()=>step(1);$('#bWeek').onclick=()=>step(5);$('#bMonth').onclick=()=>step(21);$('#mMonth').onclick=()=>step(21);
$('#bAuto').onclick=()=>{if(auto){stopAuto();return;}auto=setInterval(()=>{if($('#mEvent').hidden&&$('#mInfo').hidden)step(1);},750);const b=$('#bAuto');b.classList.add('on');b.setAttribute('aria-pressed','true');b.textContent='Pause';};
$('#bSound').onclick=()=>{soundOn=!soundOn;try{localStorage.setItem('wallst-sound',soundOn?'1':'0');}catch(e){}renderSoundBtn();if(soundOn)SND.ding();};
document.addEventListener('keydown',e=>{if(!$('#coach').hidden){if(e.key==='Escape')coach(99);return;}if((e.key==='n'||e.key==='N')&&!/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)&&$('#mStart').hidden&&$('#mEvent').hidden&&$('#mInfo').hidden)step(1);if(e.key==='Escape'&&!$('#mInfo').hidden){$('#mInfo').hidden=true;nextPopup();}});
$('#sideSeg').onclick=e=>{const s=e.target.dataset.side;if(!s)return;side=s;if(s==='V')$('#qty').value=G.pos[sel]?G.pos[sel].q:0;if(s==='C')$('#qty').value=GM().shorts[sel]?GM().shorts[sel].q:0;renderOrder();};
$('#bExec').onclick=()=>{const q=Math.floor(+$('#qty').value||0);if(omode==='cond')placeOrder(q);else doTrade(side,q);};
$('#modeSeg').onclick=e=>{const m=e.target.dataset.mode;if(!m)return;omode=m;renderOrder();drawStock();};
$('#cPx').oninput=()=>{renderOrder();drawStock();};
$('#cQuick').onclick=e=>{const x=e.target.dataset.cq;if(x==null)return;$('#cPx').value=(P(sel)*(1+ +x)).toFixed(2);renderOrder();drawStock();};
$('#qty').oninput=renderOrder;
$('#qMinus').onclick=()=>{$('#qty').value=Math.max(0,(+$('#qty').value||0)-1);renderOrder();};
$('#qPlus').onclick=()=>{$('#qty').value=(+$('#qty').value||0)+1;renderOrder();};
$('#qRange').oninput=e=>{$('#qty').value=Math.floor(maxQty()*e.target.value/100);renderOrder();};
$('#quick').onclick=e=>{const p=e.target.dataset.p;if(!p)return;$('#qty').value=Math.floor(maxQty()*(+p));renderOrder();};
$('#ranges').onclick=e=>{const r=e.target.dataset.r;if(!r)return;range=+r;[...$('#ranges').children].forEach(b=>b.classList.toggle('on',b===e.target));drawStock();};
document.addEventListener('click',e=>{const ch=e.target.closest('[data-t]');if(!ch||ch.closest('#aside'))return;if(ch.matches('.tk,.tape button,tbody tr[data-t],.ht'))pick(ch.dataset.t);});
$('#viewSeg').onclick=e=>{const m=e.target.dataset.m;if(!m)return;cview=m;[...$('#viewSeg').children].forEach(b=>b.classList.toggle('on',b===e.target));renderCote();};
$('#fStar').onclick=()=>{const f=GM().fav;if(f[sel])delete f[sel];else f[sel]=G.day;checkMissions();save();renderAll();};
$('#maT').onchange=e=>{showMA=e.target.checked;drawStock();};
$('#tMarket thead').onclick=e=>{const k=e.target.dataset.k;if(!k)return;if(sortK===k)sortDir*=-1;else{sortK=k;sortDir=(k==='name'||k==='earn')?1:-1;}renderCote();};
$('#q').oninput=renderCote;$('#secF').onchange=renderCote;
$('#quickF').onclick=e=>{const v=e.target.dataset.v;if(!v)return;qf=v;[...$('#quickF').children].forEach(b=>b.classList.toggle('on',b===e.target));renderCote();};
document.querySelector('.tabs').onclick=e=>{const t=e.target.closest('.tab');if(t)setTab(t.dataset.tab);};
$('#tSub').onclick=e=>{const s=e.target.dataset.s;if(s)setSub(s);};


/* ---------- sauvegarde en ligne et trousse de test (outils communs du dépôt gameclaude) ---------- */
let NOSAVE=false;
const CLOUD=(()=>{
  let DB=null,UID=null,init=null,busy=false,pend=null,lastT=0,tm=null;
  const to=(p,ms)=>Promise.race([p,new Promise((_,r)=>setTimeout(()=>r({code:'timeout'}),ms))]);
  const ini=()=>init||(init=(async()=>{try{if(!window.claude||!window.claude.use)return false;const [db,u]=await Promise.all([window.claude.use('db'),window.claude.use('user')]);if(!db||!u)return false;const id=await u.id();if(!id)return false;DB=db;UID=id;return true;}catch(e){return false;}})());
  const doc=n=>DB.collection('data/users/'+UID).doc(n);
  const b64=buf=>{let s='';const a=new Uint8Array(buf);for(let i=0;i<a.length;i+=0x8000)s+=String.fromCharCode.apply(null,a.subarray(i,i+0x8000));return btoa(s);};
  const unb64=s=>{const b=atob(s),a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a;};
  const zip=async str=>{if(!window.CompressionStream)return {raw:str};const r=new Response(new Blob([str]).stream().pipeThrough(new CompressionStream('gzip')));return {z:b64(await r.arrayBuffer())};};
  const unzip=z=>new Response(new Blob([unb64(z)]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
  const CH=240000;
  async function put(str,meta){const p=await zip(str),body=p.z||p.raw,n=Math.max(1,Math.ceil(body.length/CH)),id=Date.now().toString(36);
    for(let k=1;k<n;k++)await to(doc('partie_'+k).set({id,c:body.slice(k*CH,(k+1)*CH)}),20000);
    await to(doc('partie').set(Object.assign({id,n,gz:!!p.z,c:body.slice(0,CH)},meta)),20000);C.taille=body.length;}
  async function get(){if(!await ini())return null;try{const s=await to(doc('partie').get(),10000);return s&&s.exists?s.data():null;}catch(e){return null;}}
  async function full(m){let body=m.c;for(let k=1;k<m.n;k++){const s=await to(doc('partie_'+k).get(),10000);const d=s&&s.exists&&s.data();if(!d||d.id!==m.id)return null;body+=d.c;}return m.gz?unzip(body):body;}
  async function pump(){if(busy||!pend)return;busy=true;if(!await ini()){pend=null;busy=false;return;}const p=pend;pend=null;if(!p){busy=false;return;}
    try{await put(p.s,p.m);C.ok=true;C.err='';}catch(e){C.err=String(e&&(e.code||e.message)||e).slice(0,160);if(e&&(e.code==='unavailable'||e.code==='timeout')){pend=pend||p;busy=false;setTimeout(pump,4000+Math.random()*3000);return;}}
    busy=false;if(pend)pump();}
  function push(now){if(NOSAVE||!G)return;if(C.hold&&G.day-G.start<20)return; // une partie plus récente existe en ligne : on ne l'écrase pas tant que le joueur n'a pas choisi
clearTimeout(tm);const go=()=>{lastT=Date.now();pend={s:JSON.stringify(G),m:{t:G.savedAt||Date.now(),day:G.day,date:G.date,val:Math.round(value())}};pump();};
    const w=30000-(Date.now()-lastT);if(now||w<=0)go();else tm=setTimeout(go,w);}
  const C={ini,get,full,push,ok:false,err:'',taille:0,put:async(n,o)=>{if(!await ini())return false;try{await to(doc(n).set(o),10000);return true;}catch(e){return false;}}};
  return C;
})();
addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){if(save.tm)saveNow();CLOUD.push(true);}});
addEventListener('pagehide',()=>{if(save.tm)saveNow();CLOUD.push(true);});
const KIT={erreurs:[]};
addEventListener('error',e=>{KIT.erreurs.push(String(e.message||e).slice(0,300));if(KIT.erreurs.length>20)KIT.erreurs.shift();});
addEventListener('unhandledrejection',e=>{KIT.erreurs.push('promesse : '+String(e.reason).slice(0,300));if(KIT.erreurs.length>20)KIT.erreurs.shift();});
const kitStats=a=>{if(!a.length)return{};const s=a.slice().sort((x,y)=>x-y),m=a.reduce((x,y)=>x+y,0)/a.length;return{fps:+(1000/m).toFixed(1),bas1:+(1000/s[Math.floor(s.length*.99)]).toFixed(1),pire:+s[s.length-1].toFixed(1),n:a.length};};
// mesure fiable (même règle que la trousse commune) : on attend que la page soit visible, on recommence une fois si l'affichage a été suspendu
const kitVisible=()=>new Promise(r=>{if(!document.hidden)return r();const f=()=>{if(!document.hidden){document.removeEventListener('visibilitychange',f);r();}};document.addEventListener('visibilitychange',f);});
const kitFrames0=ms=>new Promise(r=>{const a=[];let lt=0,on=true,masq=false;const vf=()=>{if(document.hidden)masq=true;};document.addEventListener('visibilitychange',vf);const f=t=>{if(lt)a.push(t-lt);lt=t;if(on)requestAnimationFrame(f);};requestAnimationFrame(f);setTimeout(()=>{on=false;document.removeEventListener('visibilitychange',vf);const st=kitStats(a);if(masq||a.length<ms/1000*3)st.masquee=true;r(st);},ms);});
async function kitFrames(ms){await kitVisible();let st=await kitFrames0(ms);if(st.masquee){await kitVisible();st=await kitFrames0(ms);}return st;}
const nextPaint=()=>new Promise(r=>requestAnimationFrame(()=>setTimeout(r,0)));
const med=a=>{const s=a.slice().sort((x,y)=>x-y);return s.length?+s[Math.floor(s.length/2)].toFixed(1):null;};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function kitEtat(){const g=GM();return{date:G.date,seance:G.day,onglet:tab,valeur:sel,patrimoine:Math.round(value()),liquidites:Math.round(G.cash),lignes:Object.keys(G.pos).length,ordres:(g.orders||[]).length,rang:myRank(),xp:g.xp,difficulte:g.diff,lecture_auto:!!auto,
  infos:G.news.slice(-5).map(n=>n.title),sauvegarde_ko:Math.round(JSON.stringify(G).length/1024),cloud:{ok:CLOUD.ok,err:CLOUD.err,taille_ko:Math.round(CLOUD.taille/1024)}};}
function kitMsg(t){$('#kMsg').textContent=t;}
async function kitBug(){
  let box=$('#kBugBox');if(!box){box=document.createElement('div');box.id='kBugBox';box.className='cloudbox';box.innerHTML='<textarea id="kBugT" rows="2" style="flex:1 1 220px;font:inherit;padding:6px 8px;border-radius:8px;border:1px solid var(--line)" placeholder="Décrivez le problème en quelques mots (facultatif)"></textarea><button class="btn go" id="kBugGo" type="button">Envoyer à Claude</button>';$('.kitrow').after(box);
    $('#kBugGo').onclick=async()=>{const b=$('#kBugGo');b.disabled=true;kitMsg('Envoi…');let img='';try{const src=$('#sky'),k=Math.min(1,480/src.width),c=document.createElement('canvas');c.width=src.width*k|0;c.height=src.height*k|0;c.getContext('2d').drawImage(src,0,0,c.width,c.height);img=c.toDataURL('image/jpeg',.6);}catch(e){}
      const st={jeu:'wallstreet',texte:$('#kBugT').value.slice(0,1000),date:new Date().toISOString(),ua:navigator.userAgent,ecran:innerWidth+'x'+innerHeight+' @'+devicePixelRatio,etat:(()=>{try{return kitEtat();}catch(e){return String(e);}})(),erreurs:KIT.erreurs.slice(),ciel:img};
      try{localStorage.setItem('wallst-dernier-signalement',JSON.stringify(st).slice(0,200000));}catch(e){}
      const ok=await CLOUD.put('signalement_'+Date.now(),st);b.disabled=false;kitMsg(ok?'Merci, Claude pourra le lire.':'Envoi impossible ici (gardé sur cet appareil).');if(ok){$('#kBugT').value='';box.remove();}};}
  $('#kBugT').focus();
}
async function kitBench(){
  if(busy)return;stopAuto();const snap=JSON.stringify(G),keep={tab,sel},sOn=soundOn;NOSAVE=true;soundOn=false;$('#mStart').hidden=true;
  const quiet=()=>{promoQueue.length=0;evQueue.length=0;popQueue.length=0;['mInfo','mEvent'].forEach(i=>{const m=$('#'+i);if(m)m.hidden=true;});};
  const res=[];const ov=document.createElement('div');ov.className='kitov';ov.innerHTML='🧪 Mesure en cours, environ 30 secondes.<br><small>Restez sur cet onglet : votre partie sera remise exactement comme avant.</small>';document.body.appendChild(ov);
  try{
    for(const t of ['cote','portef']){setTab(t);await sleep(300);await kitVisible();const js=[],tot=[];let masq=false;const vf=()=>{if(document.hidden)masq=true;};document.addEventListener('visibilitychange',vf);
      for(let i=0;i<10;i++){const t0=performance.now();step(1);quiet();const t1=performance.now();await nextPaint();js.push(t1-t0);tot.push(performance.now()-t0);await sleep(120);}
      document.removeEventListener('visibilitychange',vf);res.push(Object.assign({scene:'séance suivante ('+t+')',ms:med(tot),calcul_ms:med(js)},masq?{masquee:true}:{}));}
    await kitVisible();let t0=performance.now();step(21);quiet();await nextPaint();res.push({scene:'+1 mois',ms:Math.round(performance.now()-t0)});
    for(const t of ['cote','portef','missions','rivaux']){setTab(t);await sleep(700);res.push(Object.assign({scene:'repos '+t},await kitFrames(2500)));}
    setTab('cote');$('#bAuto').click();await sleep(400);res.push(Object.assign({scene:'lecture auto'},await kitFrames(5000)));stopAuto();quiet();
  }catch(e){res.push({erreur:String(e)});}
  ov.remove();  G=JSON.parse(snap);ensureGame();SKY.heights={};shownVal=null;quiet();$('#recapCard').hidden=true;document.body.classList.remove('has-recap');sel=keep.sel;NOSAVE=false;soundOn=sOn;setTab(keep.tab);
  saveNow();CLOUD.push(true);for(let i=0;i<50&&!CLOUD.ok&&!CLOUD.err;i++)await sleep(200);
  const out={jeu:'wallstreet',date:new Date().toISOString(),ua:navigator.userAgent,ecran:innerWidth+'x'+innerHeight+' @'+devicePixelRatio,coeurs:navigator.hardwareConcurrency||0,res,version:'passe7',cloud:{ok:CLOUD.ok,err:CLOUD.err,taille_ko:Math.round(CLOUD.taille/1024),partie_ko:Math.round(snap.length/1024)}};
  try{localStorage.setItem('wallst-derniere-mesure',JSON.stringify(out));}catch(e){}
  const ok=await CLOUD.put('mesures_'+Date.now(),out);KIT.dernier=out;
  const r=res.filter(x=>!x.erreur);
  info('<div class="dlg-top"><h2 id="infoTitle">Mesure terminée</h2></div><div class="dlg-body"><p>Votre partie est intacte.'+(ok?' Les résultats sont envoyés à Claude.':'')+'</p><ul>'+r.map(x=>'<li>'+esc(x.scene)+' : <b>'+(x.ms!=null?x.ms+' ms':x.fps+' img/s')+'</b></li>').join('')+'</ul><div class="dlg-act"><button class="btn go" data-close>Fermer</button></div></div>');GM().stats.pop--;
}
async function cloudOffer(){
  if(!await CLOUD.ini())return;const m=await CLOUD.get();const box=$('#sCloud');
  const localT=(G&&G.savedAt)||0,hasLocal=!!localT;
  if(m&&m.t>localT+2000&&!(hasLocal&&G.day===m.day&&G.date===m.date)){CLOUD.hold=true;
    box.innerHTML='<span>☁️ Une partie plus récente existe sur un autre appareil : <b>'+dShort(m.date)+'</b>, patrimoine <b>'+money0(m.val)+'</b>.</span><button class="btn go" id="cLoad" type="button">Reprendre cette partie</button>';box.hidden=false;
    $('#cLoad').onclick=async()=>{const b=$('#cLoad');b.disabled=true;b.textContent='Chargement…';try{const s=await CLOUD.full(m);const g=s&&JSON.parse(s);if(!g||g.v!==3)throw 0;stopAuto();CLOUD.hold=false;G=g;ensureGame();SKY.heights={};shownVal=null;try{localStorage.setItem(KEY,s);}catch(e){}box.innerHTML='☁️ Partie reprise. Elle suit sur tous vos appareils.';$('#mStart').hidden=true;renderAll();toast('Partie reprise : '+dShort(G.date)+'.','var(--gold)');}catch(e){b.disabled=false;b.textContent='Réessayer';}};
    if($('#mStart').hidden)toast('Une partie plus récente existe sur un autre appareil. Ouvrez le menu ☰ pour la reprendre.','var(--accent)');
  }else{box.innerHTML='☁️ Sauvegarde en ligne active : votre partie vous suit du téléphone à l’ordinateur.';box.hidden=false;}
}
$('#kBug').onclick=kitBug;$('#kBench').onclick=kitBench;

renderSoundBtn();
const saved=load();
if(saved&&saved.v===3){G=saved;ensureGame();$('#sResume').hidden=false;}else{G=E.init(DATA,today(),50000);ensureGame();}
renderAll();skyStart();
$('#mStart').hidden=false;
cloudOffer();
window.__wst={CLOUD,kitBench,kitEtat,get G(){return G;},step,doTrade,value,board,setSel:t=>{sel=t;},TK,RANKS,rivalVal,P,newGame:c=>{G=E.init(DATA,today(),c);ensureGame();SKY.heights={};shownVal=null;$('#mStart').hidden=true;renderAll();}};
})();
