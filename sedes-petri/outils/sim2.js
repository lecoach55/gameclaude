const fs = require('fs'), vm = require('vm');
const ctx = { console, Math, JSON, btoa: s => Buffer.from(s, 'binary').toString('base64'), atob: s => Buffer.from(s, 'base64').toString('binary') };
vm.createContext(ctx);
for (const f of ['data.js', 'engine.js', 'events.js']) vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../jeu/',f), 'utf8'), ctx, { filename: f });
vm.runInContext(`
function tryA(id,a){ if(!canAct(id,a||{})){ doAct(id,a||{}); return true;} return false; }
function offices(){
 for(const k of ['camerlingue','chancelier','penitencier','inquisiteur']){
  if(S.offices[k] && card(S.offices[k])) continue;
  const key = k==='penitencier'?'piety':'comp';
  const c=S.cardinals.filter(c=>!c.legate&&!c.office).sort((a,b)=>b[key]-a[key])[0];
  if(c){ c.office=k; S.offices[k]=c.id; }
 }
}
const BORDER=['chancellerie','hopital','saintange','bibliotheque','basilique','ostie','rocca','aqueduc','studium','chapelle'];
function sage(level){
 offices();
 const skip = () => level<1 && chance(0.5);
 // urgences
 if(S.pope.health<40) tryA('repos');
 if(S.rome.stab<35){ if(S.treasury>60) tryA('pain'); tryA('procession'); }
 if(S.authority>=40 && !S.council && !skip()) tryA('concile');
 // croisade raisonnable
 if(!S.crusade && S.authority>=55 && S.treasury>150 && !skip()){
  const t=crusadeTargets(); const pref=t.find(x=>x.k==='heretiques')||t.find(x=>x.k==='terre_sainte')||t[0]; if(pref) tryA('croisade',{key:pref.key});
 }
 if(S.crusade && S.crusade.phase==='predication'){ for(const r of catholics().sort((a,b)=>power(b)-power(a)).slice(0,2)) if(!S.crusade.members.includes(r)) tryA('exhorter',{r}); }
 // hérésies
 const her=catholics(r=>RL(r).heresy>12).sort((a,b)=>RL(b).heresy-RL(a).heresy);
 for(const r of her.slice(0,2)){ if(!RL(r).legate){ const c=S.cardinals.filter(c=>!c.legate&&!c.office).sort((a,b)=>b.piety-a.piety)[0]; if(c) tryA('legat',{r,c:c.id}); } tryA('predication',{r}); if(RL(r).heresy>50) tryA('inquisition',{r}); }
 // médiations
 for(const w of S.wars) if(isCath(w.a)&&isCath(w.b)&&!skip()) tryA('mediation',{r:w.a});
 // relations
 for(const r of catholics(r=>RL(r).rel<-25&&power(r)>20)) tryA('rose',{r});
 for(const r of catholics(r=>RL(r).rel>=60&&!RL(r).vassal)) tryA('vassal',{r});
 for(const r of catholics(r=>RL(r).excom&&RL(r).excomT>10)) tryA('absoudre',{r});
 // investitures modérées
 for(const r of catholics(r=>RL(r).invest<30&&RL(r).rel>20).slice(0,1)) tryA('investir',{r});
 // chantiers
 if(S.treasury>250) for(const b of BORDER) if(S.build[b]===undefined && tryA('build',{b})) break;
 // patrimoine
 for(const p of PATRI) if(S.ctrl[p]<45 && S.treasury>60) { tryA('recteur',{p}); if(S.ctrl[p]<30) tryA('campagne',{p}); }
 if(active('byzance') && RL('byzance').union<60 && !S.flags.unionDone && !skip()) tryA('ambassade',{r:'byzance'});
 for(const r of activeRealms(r=>RL(r).relig==='paien')) if(!skip()) tryA('mission',{r});
 // famille
 const lowf=S.rome.fam.slice().sort((a,b)=>a.loyal-b.loyal)[0]; if(lowf.loyal<35) tryA('favoriser',{f:lowf.n});
 // curie
 if(S.cardinals.length<16){ if(!S.cands) genCandidates(); const c=S.cands.filter(c=>!c.nephew).sort((a,b)=>b.comp-a.comp)[0]; if(c) tryA('creer',{c:c.id}); }
 const dis=S.cardinals.find(c=>c.loyal<30&&c.amb>6); if(dis && S.treasury>80) tryA('faveur',{c:dis.id});
 if(avgLoyal()<45) tryA('consistoire');
 if(S.seals>=2) tryA('bulle');
 if(S.army<300 && S.treasury>200) tryA('recruter');
 if(S.debt>0 && S.treasury>300) tryA('rembourser');
 if(S.treasury<40 && S.debt<400) tryA('emprunt');
}
function pickOpt(e, smart){
 const ok=e.opts.filter(o=>!o.req||!o.req()); if(!ok.length) return e.opts[e.opts.length-1];
 if(!smart) return pick(ok);
 // heuristique : préférer les options dont le texte promet autorité/ferveur, éviter "corruption +"
 let best=ok[0], bs=-1e9;
 for(const o of ok){ const d=o.d||''; let s=Math.random()*3;
  const m=(re)=>{ const x=d.match(re); return x? (x[1]==='−'||x[1]==='-'?-1:1)*(+x[2]) : 0; };
  s+= m(/Autorité ([+−-])(\\d+)/i)*1.5 + m(/[Ff]erveur ([+−-])(\\d+)/)*0.8 - m(/[Cc]orruption ([+−-])(\\d+)/)*1 + m(/[Rr]elation ([+−-])(\\d+)/)*0.3 + m(/[Tt]résor ([+−-])(\\d+)/)*0.05 - m(/[Hh]érésie ([+−-])(\\d+)/)*0.6;
  if(/marcs\\)/.test(o.t)) s-=1;
  if(s>bs){bs=s;best=o;} }
 return best;
}
function resolve(smart){
 let g=0; while(S.events.length&&g++<40){ const e=S.events.shift();
  if(e.special==='council'){ const pref=['celibat','simonie','confession','conclave','treve','ubi','residence','universites','transsub','inquisition','union','finschisme','investitures','reforme','indulgence','tournois']; const av=availableDecrees(); closeCouncil(pref.filter(k=>av.includes(k)).slice(0,councilSlots())); continue; }
  pickOpt(e,smart).fx(); }
}
function conclave(){ const cv=conclaveSetup(); cv.backed=cv.cands.slice().sort((a,b)=>{const A=card(a),B=card(b); return (POPE_TRAITS[B.trait].v*5+B.comp+B.piety-(B.age>70?5:0))-(POPE_TRAITS[A.trait].v*5+A.comp+A.piety-(A.age>70?5:0));})[0]; let g=0; while(!cv.done&&g++<20) conclaveRound(cv); electPope(cv,pick(PNAMES_LIST)); }
function run(scen, bot, diff){
 newGame({scen,name:SCEN[scen].pope.name,fam:SCEN[scen].pope.fam,nat:'italien',voc:SCEN[scen].pope.voc,flaw:true,diff});
 let minA=100, sumA=0, n=0, popes=1, ruinY=null, maxHer=0;
 const snaps=[];
 for(let i=0;i<1800&&!S.over;i++){
  if(bot==='sage') sage(1); else if(bot==='moyen') sage(0);
  const sm = bot==='sage' ? true : bot==='moyen' ? chance(0.6) : false; resolve(sm);
  endSeason(); resolve(sm);
  if(S.pendingConclave){ conclave(); popes++; resolve(bot!=='passif'); }
  minA=Math.min(minA,S.authority); sumA+=S.authority; n++; maxHer=Math.max(maxHer,catholics(r=>RL(r).heresy>50).length);
  if(i%100===99) snaps.push(Math.round(S.authority));
 }
 return {scen,bot,diff,end:S.year,over:S.over&&S.over.reason,popes,minA:Math.round(minA),avgA:Math.round(sumA/n),a:Math.round(S.authority),t:S.treasury,c:Math.round(S.corruption),f:Math.round(avgFervor()),maxHer,cr:S.crusades.length+'/'+S.crusadeWins,net:Math.round(budget().total),debt:S.debt,army:S.army,ach:Object.keys(S.ach).length,glory:glory(),snaps:snaps.join(',')};
}
`, ctx);
const bots = (process.argv[2] || 'sage,moyen,passif').split(','); const N = +process.argv[3] || 2; const diff = +(process.argv[4] || 1);
for (const bot of bots) for (const sc of ['1073', '1198', '1294', '1378']) for (let i = 0; i < N; i++) {
  const r = vm.runInContext(`run('${sc}','${bot}',${diff})`, ctx); console.log(JSON.stringify(r));
}
