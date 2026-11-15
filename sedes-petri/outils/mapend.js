const fs=require('fs'),vm=require('vm');const ctx={console,Math,JSON,btoa:s=>s,atob:s=>s};vm.createContext(ctx);
for(const f of ['data.js','engine.js','events.js'])vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../jeu/',f),'utf8'),ctx);
vm.runInContext(fs.readFileSync(''+require('path').join(__dirname,'sim2.js')+'','utf8').split('vm.runInContext(`')[1].split('`, ctx);')[0].replace(/\\\\/g,'\\'),ctx);
for(const sc of ['1073','1198','1294','1378']){ vm.runInContext(`run('${sc}','sage',1)`,ctx);
console.log(sc, vm.runInContext(`activeRealms().sort((a,b)=>nProv(b)-nProv(a)).map(r=>r+':'+nProv(r)).join(' ')+' | dormant: '+realmIds().filter(r=>S.realms[r].dormant).join(',')`,ctx)); }
