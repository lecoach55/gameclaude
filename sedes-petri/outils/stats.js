const fs=require('fs'),vm=require('vm');const ctx={console,Math,JSON,btoa:s=>Buffer.from(s,'binary').toString('base64'),atob:s=>Buffer.from(s,'base64').toString('binary')};vm.createContext(ctx);
for(const f of ['data.js','engine.js','events.js'])vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../jeu/',f),'utf8'),ctx);
vm.runInContext(eval('`'+fs.readFileSync(''+require('path').join(__dirname,'fuzz.js')+'','utf8').split('vm.runInContext(`')[1].split('`, ctx);')[0]+'`'),ctx);
vm.runInContext(`GENTLE=true; var EVC={}; var _ps=pushEvent; 
var _res=resolve; resolve=function(){ for(const e of S.events) EVC[e.id]=(EVC[e.id]||0)+1; _res(); };`,ctx);
const out={};
for(const sc of ['1073','1198','1294']){ for(let i=0;i<3;i++){ vm.runInContext(`fuzz('${sc}')`,ctx);
 const r=vm.runInContext(`activeRealms().map(r=>r+':'+nProv(r)).join(' ')+' | dormant: '+realmIds().filter(r=>S.realms[r].dormant).join(',')`,ctx); if(i==0) console.log(sc,r);} }
console.log(JSON.stringify(vm.runInContext('EVC',ctx)));
console.log('never:', vm.runInContext('EVENTS.map(e=>e.id).filter(id=>!EVC[id]).join(",")',ctx));
