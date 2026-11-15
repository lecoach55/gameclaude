// Charge les fichiers du jeu sans DOM dans un contexte Node : const J=require('./charger.js')();
const vm=require('vm'),fs=require('fs'),path=require('path');
module.exports=function(fichiers=['data.js','carte.js','regles.js','combat.js','ia.js']){
 const ctx={console,Math,Date,JSON,setTimeout,module:undefined};vm.createContext(ctx);
 for(const f of fichiers){const p=path.join(__dirname,'../jeu',f);if(fs.existsSync(p))vm.runInContext(fs.readFileSync(p,'utf8').replace(/^'use strict';/,''),ctx,{filename:f});}
 return ctx;};
