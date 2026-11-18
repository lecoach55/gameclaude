const fs = require('fs'), vm = require('vm');
const ctx = { console, Math, JSON, btoa: s => Buffer.from(s, 'binary').toString('base64'), atob: s => Buffer.from(s, 'base64').toString('binary') };
vm.createContext(ctx);
for (const f of ['data.js', 'engine.js', 'events.js', 'ambitions.js']) vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../jeu/',f), 'utf8'), ctx, { filename: f });
vm.runInContext(`
var ERR={}; var GENTLE=false;
function bad(k,info){ ERR[k]=(ERR[k]||0)+1; if(ERR[k]<=2) console.log('!!',k,info||''); }
function inv(){
 for(const k of ['treasury','authority','corruption','army','debt']) if(!isFinite(S[k])) bad('nan_'+k);
 if(S.army<0) bad('army<0',S.army);
 for(const r in S.realms){ const R=S.realms[r]; for(const k of ['rel','fervor','heresy','invest','union','mission']) if(!isFinite(R[k])) bad('nan_realm_'+k,r);
  if(R.legate){ const c=card(R.legate); if(!c) bad('legate_dangling',r); else if(c.legate!==r) bad('legate_mismatch',r); }
  if(!R.dormant && r!=='etats' && !R.ruler) bad('no_ruler',r);
  if(!R.dormant && r!=='etats' && nProv(r)===0) bad('active_noprov',r);
  if(R.ruler && R.ruler.n && /undefined|NaN/.test(R.ruler.n)) bad('ruler_name',R.ruler.n);
  if(R.dormant && R.legate) bad('dormant_legate',r);
 }
 for(const c of S.cardinals){ if(c.legate && (!S.realms[c.legate] || S.realms[c.legate].legate!==c.id)) bad('card_legate_mismatch',c.legate); if(c.office && S.offices[c.office]!==c.id) bad('office_mismatch',c.office); if(!isFinite(c.loyal)) bad('nan_loyal'); }
 for(const k in S.offices) if(S.offices[k]!=null && !card(S.offices[k])) bad('office_dangling',k);
 for(const p of PROVS) if(!S.realms[S.own[p.id]]) bad('own_bad',p.id);
 for(const w of S.wars) if(!active(w.a)||!active(w.b)) bad('war_inactive');
 if(S.crusade && !PROV[S.crusade.p]) bad('crusade_p');
 for(const l of S.log.slice(-20)) if(/undefined|NaN|\\[object/.test(l.t)) bad('log_text',l.t);
 if(!isFinite(S.pope.health)) bad('pope_health');
}
function txtcheck(e){ const s=e.title+' '+e.text+' '+e.opts.map(o=>o.t+o.d).join(' '); if(/undefined|NaN|\\[object|null/.test(s)) bad('event_text_'+e.id, s.slice(0,160)); }
function fuzzActs(){
 const ids=Object.keys(ACT).filter(x=>x!=='abdiquer');
 for(let k=0;k<(GENTLE?4:12);k++){
  const id=pick(ids); if(GENTLE && ['excom','interdit','disgrace','conceder','subside','chatier'].includes(id) && chance(.85)) continue; const a={};
  a.r=pick(activeRealms()); a.c=(S.cardinals.length?pick(S.cardinals).id:0); a.p=pick(PATRI); a.f=pick(S.rome.fam).n; a.b=pick(Object.keys(BUILDINGS));
  const t=crusadeTargets(); if(t.length) a.key=pick(t).key;
  if(id==='creer'){ if(!S.cands) genCandidates(); a.c=pick(S.cands).id; }
  if(id==='legat'){ const f=S.cardinals.filter(c=>!c.legate&&!c.office); if(!f.length) continue; a.c=pick(f).id; }
  try{ const r=doAct(id,a); if(r.ok && /undefined|NaN/.test(r.msg||'')) bad('actmsg_'+id,r.msg);}catch(e){ bad('act_throw_'+id, e.stack.split('\\n').slice(0,3).join(' | ')); }
 }
 if(chance(0.3)) S.fisc=ri(0,3); if(chance(0.1)) S.indulg=chance(0.5);
 for(const k of Object.keys(S.offices)) if(chance(0.1)){ const old=S.offices[k]&&card(S.offices[k]); if(old) old.office=null; const c=S.cardinals.filter(c=>!c.legate)[0]; if(c){ for(const kk in S.offices) if(S.offices[kk]===c.id) S.offices[kk]=null; c.office=k; S.offices[k]=c.id; } else S.offices[k]=null; }
}
function resolve(){
 let g=0;
 while(S.events.length && g++<40){
  const e=S.events.shift();
  try{
   if(e.special==='council'){ closeCouncil(shuffle(availableDecrees()).slice(0,councilSlots())); continue; }
   txtcheck(e);
   const ok=e.opts.filter(o=>!o.req||!o.req()); const o=ok.length?pick(ok):pick(e.opts);
   const out=o.fx(); if(out && /undefined|NaN/.test(out)) bad('ev_out_'+e.id,out);
  }catch(err){ bad('ev_throw_'+e.id, err.stack.split('\\n').slice(0,3).join(' | ')); }
 }
}
function conclave(){ const cv=conclaveSetup(); cv.backed=pick(cv.cands); cv.bribe=chance(0.2); let g=0; while(!cv.done&&g++<20) conclaveRound(cv); if(!cv.done) bad('conclave_nodone'); electPope(cv,pick(PNAMES_LIST)); }
function fuzz(scen){
 newGame({scen,name:pick(PNAMES_LIST),fam:'Test',nat:pick(Object.keys(NAT_LABEL)),voc:pick(['reformateur','juriste','diplomate','ascete','batisseur','croise','theologien']),flaw:chance(.5),diff:ri(0,2)});
 for(let i=0;i<1800 && !S.over;i++){
  try{ const o=ambEnsure(); if(o&&!S.pope.amb&&chance(0.3)) ambChoose(pick(o.ids)); const st=ambState(); if(st&&(!isFinite(st.v)||!isFinite(st.max)||/undefined|NaN/.test(st.lbl))) bad('amb_etat_'+st.a.id,st.lbl); }catch(e){ bad('amb_throw', e.stack.split('\\n').slice(0,3).join(' | ')); }
  fuzzActs(); resolve();
  try{ endSeason(); }catch(e){ bad('endSeason_throw', e.stack.split('\\n').slice(0,4).join(' | ')); break; }
  resolve();
  if(S.pendingConclave){ try{conclave();}catch(e){bad('conclave_throw',e.stack.split('\\n').slice(0,3).join(' | '));} resolve(); }
  if(chance(0.002)){ doAct('abdiquer',{}); conclave(); }
  if(chance(0.01)){ const code=exportCode(); const s0=S; if(!importCode(code)) bad('import'); }
  if(GENTLE) S.authority=Math.max(S.authority,30); inv();
 }
 return S.year+' '+(S.over?S.over.reason:'');
}
`, ctx);
const N = +process.argv[2] || 4;
const res = [];
for (let i = 0; i < N; i++) for (const sc of ['1073', '1198', '1294', '1378']) res.push(vm.runInContext(`fuzz('${sc}')`, ctx));
console.log(res.join(' ; '));
console.log(JSON.stringify(vm.runInContext('ERR', ctx)));
vm.runInContext('GENTLE=true', ctx);
const r2=[]; for (let i = 0; i < N; i++) for (const sc of ['1073', '1198', '1294', '1378']) r2.push(vm.runInContext(`fuzz('${sc}')`, ctx));
console.log('GENTLE', r2.join(' ; ')); console.log(JSON.stringify(vm.runInContext('ERR', ctx)));
