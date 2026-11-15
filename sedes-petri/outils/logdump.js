const fs=require('fs'),vm=require('vm');const ctx={console,Math,JSON,btoa:s=>s,atob:s=>s};vm.createContext(ctx);
for(const f of ['data.js','engine.js','events.js'])vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../jeu/',f),'utf8'),ctx);
vm.runInContext(fs.readFileSync(''+require('path').join(__dirname,'sim2.js')+'','utf8').split('vm.runInContext(`')[1].split('`, ctx);')[0].replace(/\\\\/g,'\\'),ctx);
vm.runInContext(`run('${process.argv[2]||'1198'}','sage',1)`,ctx);
const L=vm.runInContext('S.log',ctx); console.log(L.slice(0,400).map(l=>l.y+' '+l.t).join('\n'));
