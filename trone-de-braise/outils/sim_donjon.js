// Expéditions jouées par le robot (équilibrage des combats). node sim_donjon.js classe niveauHeros niveauDonjon N [depart]
const vm=require('vm'),fs=require('fs'),path=require('path');const d=path.join(__dirname,'../jeu/');
for(const f of ['data.js','objets.js','monde.js','donjon.js'])vm.runInThisContext(fs.readFileSync(d+f,'utf8'),{filename:f});
const [cls='chevalier',nh=1,nd=1,N=12,mode='depart']=process.argv.slice(2);
const r={victoire:0,mort:0,temps:0,etageMort:[],niveauFin:[],t:[]};
for(let k=0;k<+N;k++){
 const h=nouveauHeros(cls,'T','h',+nh);
 if(mode==='depart'){h.equip.arme=genObjet(+nh,cls,{empl:'arme',rarete:'normal'});h.equip.armure=genObjet(+nh,cls,{empl:'armure',rarete:'normal'});}
 else for(const e of EMPLACEMENTS)h.equip[e]=genObjet(+nh,cls,{empl:e,rarete:'magique'});
 h.points=0;CLASSES[cls].comp.forEach((c,i)=>{if(+nh>=[1,2,4,6][i])h.comp[c.id]=Math.max(1,Math.floor(+nh/3));});
 const X=creerExpedition({type:pick(['crypte','foret','mine','marais']),niveau:+nd,etages:3,heros:h});let t=0;
 while(!X.resultat||X.resultat==='etage'){X.resultat=null;const A=creerEtage(X);simulerEtage(A,600);t+=A.t;if(!A.fini){X.resultat='temps';break;}if(X.resultat==='etage')X.etage++;}
 r[X.resultat]=(r[X.resultat]||0)+1;if(X.resultat==='mort')r.etageMort.push(X.etage);r.niveauFin.push(h.niveau);r.t.push(Math.round(t));
}
console.log(cls,'héros',nh,'donjon',nd,mode,JSON.stringify({v:r.victoire,m:r.mort,temps:r.temps||0,etageMort:r.etageMort.join(''),niv:r.niveauFin.join(','),t:Math.round(r.t.reduce((a,b)=>a+b,0)/r.t.length)}));
