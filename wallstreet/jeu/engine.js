/* Moteur de marché simulé — calibré sur les statistiques réelles (2013-2018) et les moyennes historiques longues */
var ENGINE=(function(){
"use strict";
var D=null, TK=[];
var FIRMS=[
  {n:"Bercy Capital Research",noise:0.07},
  {n:"Atlantique Securities",noise:0.09},
  {n:"Hudson & Fils",noise:0.16},
  {n:"Pinnacle Street",noise:0.28},
  {n:"Moonshot Analytics",noise:0.5}
];
var REG={
  expansion:{lbl:"Expansion",drift:0.045,vm:1.0,gadj:0.01,infl:0.025,unemp:0.042,gdp:0.025,oil:0.05,
    desc:"Croissance solide, emploi en hausse. Les valeurs cycliques (industrie, banques, semi-conducteurs, tourisme) profitent le plus."},
  surchauffe:{lbl:"Fin de cycle",drift:-0.04,vm:1.3,gadj:-0.02,infl:0.036,unemp:0.037,gdp:0.012,oil:0.10,
    desc:"L'inflation monte, la banque centrale resserre. Les valeurs défensives (santé, consommation de base) résistent mieux, les valorisations élevées souffrent."},
  recession:{lbl:"Récession",drift:-0.22,vm:2.1,gadj:-0.10,infl:0.014,unemp:0.075,gdp:-0.02,oil:-0.35,
    desc:"Les bénéfices reculent, la volatilité explose. Les cycliques plongent. C'est souvent là que se préparent les meilleures affaires."},
  reprise:{lbl:"Reprise",drift:0.22,vm:1.4,gadj:0.05,infl:0.018,unemp:0.060,gdp:0.032,oil:0.25,
    desc:"Les marchés anticipent la sortie de crise. Les cycliques et les valeurs qui ont le plus chuté rebondissent fort."}
};
// matrice mensuelle de transition (durées moyennes inspirées des cycles américains depuis 1945)
var TRANS={expansion:{surchauffe:1/52},surchauffe:{recession:1/9,expansion:1/14},recession:{reprise:1/9},reprise:{expansion:1/7}};

/* ---------- aléa ---------- */
function rnd(){return Math.random();}
function randn(){var u=0,v=0;while(u===0)u=rnd();while(v===0)v=rnd();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
function tdist(df){var z=randn(),c=0;for(var k=0;k<df;k++){var x=randn();c+=x*x;}return z/Math.sqrt(c/df)*Math.sqrt((df-2)/df);}
function pick(a){return a[Math.floor(rnd()*a.length)];}
function clamp(x,a,b){return Math.max(a,Math.min(b,x));}
function nextDate(s){var d=new Date(s+"T12:00:00Z");do{d.setUTCDate(d.getUTCDate()+1);}while(d.getUTCDay()===0||d.getUTCDay()===6);return d.toISOString().slice(0,10);}
function prevDate(s){var d=new Date(s+"T12:00:00Z");do{d.setUTCDate(d.getUTCDate()-1);}while(d.getUTCDay()===0||d.getUTCDay()===6);return d.toISOString().slice(0,10);}
function f1(x){return (Math.round(x*10)/10).toString().replace(".",",");}
function f2(x){return x.toFixed(2).replace(".",",");}
function pc(x){return (x>=0?"+":"−")+f1(Math.abs(x*100))+" %";}

/* ---------- textes ---------- */
var NEWS_POS=[
 {k:"contrat",t:"{n} décroche un contrat majeur",x:"Le groupe annonce un accord pluriannuel qui devrait soutenir ses ventes.",imp:0.6,g:0.012},
 {k:"produit",t:"Accueil enthousiaste pour le nouveau produit de {n}",x:"Les premiers retours clients et les précommandes dépassent les attentes.",imp:0.7,g:0.015},
 {k:"rachat",t:"{n} lance un programme de rachat d'actions",x:"Le groupe va racheter une partie de ses propres titres, ce qui soutient le bénéfice par action.",imp:0.35,g:0.004},
 {k:"div",t:"{n} relève son dividende",x:"La direction augmente la rémunération des actionnaires, signe de confiance.",imp:0.3,g:0.003,div:0.15},
 {k:"marche",t:"{n} s'implante sur un nouveau marché",x:"Le groupe ouvre une activité en Asie, avec un potentiel de croissance important à moyen terme.",imp:0.45,g:0.01},
 {k:"pdg",t:"{n} recrute un dirigeant très réputé",x:"L'arrivée d'un nouveau directeur général salué par les investisseurs.",imp:0.4,g:0.006},
 {k:"part",t:"Partenariat stratégique pour {n}",x:"Un accord avec un leader de son secteur ouvre de nouveaux débouchés.",imp:0.4,g:0.008}
];
var NEWS_NEG=[
 {k:"proces",t:"{n} visé par une action en justice",x:"Un recours collectif pourrait coûter cher au groupe.",imp:-0.5,g:-0.006},
 {k:"rappel",t:"Rappel de produits chez {n}",x:"Le groupe rappelle un de ses produits phares pour un défaut. Coût et image en jeu.",imp:-0.6,g:-0.01},
 {k:"pdgout",t:"Départ surprise du PDG de {n}",x:"Le directeur général quitte ses fonctions sans successeur désigné.",imp:-0.5,g:-0.005},
 {k:"enquete",t:"Les autorités ouvrent une enquête sur {n}",x:"Le régulateur examine certaines pratiques commerciales du groupe.",imp:-0.6,g:-0.008},
 {k:"cyber",t:"{n} victime d'une cyberattaque",x:"Des données clients auraient été dérobées. L'ampleur reste à préciser.",imp:-0.5,g:-0.006},
 {k:"greve",t:"Grève chez {n}",x:"Un mouvement social perturbe la production et les livraisons.",imp:-0.35,g:-0.004},
 {k:"concur",t:"Un concurrent agressif menace {n}",x:"Un nouvel entrant casse les prix sur le cœur de métier du groupe.",imp:-0.55,g:-0.012},
 {k:"augk",t:"{n} lève des fonds en émettant des actions",x:"L'augmentation de capital dilue les actionnaires existants.",imp:-0.35,g:-0.003}
];
var SECTOR_NEWS={
 "Santé":[{t:"Feu vert des autorités sanitaires pour un médicament de {n}",x:"L'autorisation ouvre un marché potentiellement très lucratif.",imp:1.0,g:0.02},{t:"Échec d'un essai clinique pour {n}",x:"Le traitement en phase 3 n'a pas atteint son objectif principal.",imp:-1.0,g:-0.02}],
 "Énergie":[{t:"{n} annonce une découverte de gisement",x:"Les réserves prouvées du groupe augmentent nettement.",imp:0.6,g:0.012}],
 "Transport":[{t:"Incident technique chez {n}",x:"Une partie de la flotte est immobilisée pour inspection.",imp:-0.5,g:-0.006}],
 "Semi-conducteurs":[{t:"Pénurie de puces : {n} en position de force",x:"Les clients se bousculent, les prix de vente montent.",imp:0.6,g:0.015}],
 "Jeux vidéo":[{t:"Le nouveau jeu de {n} bat des records",x:"Ventes de lancement historiques pour le titre phare du studio.",imp:0.9,g:0.02},{t:"Report du jeu phare de {n}",x:"La sortie très attendue est repoussée de plusieurs mois.",imp:-0.8,g:-0.015}]
};
var BIG_POS=[
 {t:"{n} change de dimension",x:"Un nouveau marché très porteur s'ouvre au groupe. Les analystes revoient fortement à la hausse leurs prévisions sur plusieurs années.",imp:1.6,g:0.07},
 {t:"Percée technologique chez {n}",x:"Une innovation majeure pourrait redessiner son secteur au profit du groupe.",imp:1.5,g:0.06}];
var BIG_NEG=[
 {t:"{n} perd un marché clé",x:"Son principal client se tourne vers la concurrence. Le modèle économique du groupe est remis en question.",imp:-1.6,g:-0.07},
 {t:"Scandale comptable chez {n}",x:"Des irrégularités dans les comptes sont révélées. La confiance des investisseurs est durablement entamée.",imp:-1.8,g:-0.06}];
var SRC=[{s:"un forum d'investisseurs",p:0.2},{s:"un blog financier",p:0.3},{s:"la presse financière",p:0.5},{s:"des sources proches du dossier",p:0.65}];

/* ---------- création ---------- */
function init(data,startDate,cap){
  D=data; TK=Object.keys(D.stocks);
  var G={v:3,cap:cap,cash:cap,pos:{},tx:[],vals:[],idx:[],dates:[],news:[],pend:[],day:0,start:0,
    pro:-1,ach:{},seq:0,firms:FIRMS.map(function(f){return{n:f.n,noise:f.noise,calls:[],ok:0,ko:0};}),
    macro:{reg:"expansion",regDays:0,rate:0.025,infl:0.024,unemp:0.043,gdp:0.024,oil:70,fear:13,shock:0,nextFed:12,nextCPI:7,nextJobs:17,nextGDP:40,fedExp:null,mvol:[]},
    st:{}};
  TK.forEach(function(t,k){
    var s=D.stocks[t];
    var o={p:[],eps:s.p/s.pe,pe:s.pe,g:s.g,glt:0.3*s.g+0.045,gc:s.g,fair:s.pe*Math.exp(randn()*0.18),fairNoise:randn()*0.06,
      dy:s.dy,earn:5+Math.floor(((k*11)%63)*0.45),cons:0,gNext:null,hint:0,rat:{},drift:[],lastSurp:null,lastEarnDay:null};
    o.fair0=o.fair; o.g0=s.g;
    G.st[t]=o;
  });
  // préhistoire : un an et demi de séances pour avoir des graphiques et des historiques d'analystes
  var pre=380, d=startDate; for(var k=0;k<pre;k++)d=prevDate(d);
  G.date=d; G.quiet=true;
  TK.forEach(function(t){G.st[t].p.push(D.stocks[t].p);});
  G.idx.push(1000); G.dates.push(d); G.vals.push(cap);
  for(var k2=0;k2<pre;k2++)step(G);
  G.quiet=false; G.start=G.day; G.vals=G.dates.map(function(){return cap;});
  G.news=G.news.filter(function(n){return n.day>G.day-15;});
  return G;
}

/* ---------- helpers ---------- */
function P(G,t,back){var a=G.st[t].p;return a[a.length-1-(back||0)];}
function value(G){var v=G.cash;for(var t in G.pos)v+=G.pos[t].q*P(G,t);return v;}
function addNews(G,n){n.day=G.day;n.date=G.date;n.id=++G.seq;if(!G.quiet||n.keep)G.news.push(n);}
function sched(G,inDays,kind,data){G.pend.push({day:G.day+inDays,kind:kind,data:data});}
function addDrift(G,t,total,days){G.st[t].drift.push({v:total/days,n:days});}
function name(t){return D.stocks[t].n;}

/* ---------- macro ---------- */
function macroStep(G){
  var M=G.macro, R=REG[M.reg];
  M.regDays++;
  if(M.regDays%21===0){
    var tr=TRANS[M.reg], r=rnd(), acc=0;
    // fin de cycle plus probable si les valorisations sont tendues
    var stretch=avgStretch(G);
    for(var k in tr){var p=tr[k]*(k==="recession"||k==="surchauffe"?(1+Math.max(0,stretch)*2):1);acc+=p;if(r<acc){changeRegime(G,k);break;}}
  }
  R=REG[M.reg];
  M.infl+= (R.infl-M.infl)*0.004+randn()*0.0004;
  M.unemp+=(R.unemp-M.unemp)*0.006+randn()*0.0003;
  M.gdp+=  (R.gdp-M.gdp)*0.01+randn()*0.0006;
  M.unemp=clamp(M.unemp,0.03,0.12);
  var oilR=R.oil/252+0.30/Math.sqrt(252)*tdist(5);
  M.oil*=Math.exp(oilR); M.oil=clamp(M.oil,15,180); M.oilR=oilR;
  // calendrier
  if(--M.nextCPI===0){M.nextCPI=21;release(G,"infl");}
  if(--M.nextJobs===0){M.nextJobs=21;release(G,"unemp");}
  if(--M.nextGDP===0){M.nextGDP=63;release(G,"gdp");}
  M.nextFed--;
  if(M.nextFed===5){M.fedExp=fedExpect(G);addNews(G,{cat:"macro",title:"Banque centrale : le marché anticipe "+M.fedExp.lbl,x:"Réunion de politique monétaire dans 5 séances. Probabilité estimée par les marchés : "+Math.round(M.fedExp.p*100)+" %. Inflation à "+f1(M.infl*100)+" %, chômage à "+f1(M.unemp*100)+" %."});}
  if(M.nextFed===0){M.nextFed=32;fedDecision(G);}
}
function avgStretch(G){var s=0;TK.forEach(function(t){var o=G.st[t];s+=Math.log(o.pe/o.fair);});return s/TK.length;}
function changeRegime(G,k){
  var M=G.macro;M.reg=k;M.regDays=0;
  var T={expansion:"L'économie entre en phase d'expansion",surchauffe:"Signes de fin de cycle : l'économie surchauffe",recession:"Les économistes confirment la récession",reprise:"La reprise se confirme"};
  addNews(G,{cat:"macro",big:true,title:T[k],x:REG[k].desc});
  if(k==="recession"){M.shock=-0.05;}
  if(k==="reprise"){ // krach du momentum : à la sortie de crise, les grands perdants rebondissent le plus fort
    var L=TK.map(function(t){var a=G.st[t].p;return{t:t,r:a[a.length-1]/a[Math.max(0,a.length-253)]};}).sort(function(a,b){return a.r-b.r;});
    var q=Math.floor(L.length/4);
    L.slice(0,q).forEach(function(x){var o=G.st[x.t];o.fair*=Math.exp(0.10);addDrift(G,x.t,0.16,35);});
    L.slice(-q).forEach(function(x){addDrift(G,x.t,-0.06,35);});
  }
}
function taylor(M){return clamp(0.01+M.infl+0.5*(M.infl-0.02)-0.8*(M.unemp-0.045),0,0.07);}
function fedExpect(G){
  var M=G.macro, tgt=taylor(M), diff=tgt-M.rate, move=0;
  if(diff>0.004)move=0.0025; else if(diff<-0.004)move=(M.reg==="recession"?-0.005:-0.0025);
  var p=clamp(0.55+Math.min(Math.abs(diff),0.02)*20+randn()*0.08,0.5,0.95);
  if(move===0)p=clamp(0.6+randn()*0.1,0.5,0.9);
  var lbl=move>0?"une hausse des taux":move<0?"une baisse des taux":"un statu quo sur les taux";
  return {move:move,p:p,lbl:lbl};
}
function fedDecision(G){
  var M=G.macro, e=M.fedExp||fedExpect(G);
  var move=rnd()<e.p?e.move:(e.move===0?(taylor(M)>M.rate?0.0025:-0.0025):0);
  M.rate=clamp(M.rate+move,0,0.08);
  var surprise=move-e.move;
  M.shock+= -surprise*4; // une hausse surprise de 0,25 pt ≈ -1 %
  G.rateMove=move;
  var t=move>0?"La banque centrale relève ses taux à "+f2(M.rate*100)+" %":move<0?"La banque centrale abaisse ses taux à "+f2(M.rate*100)+" %":"La banque centrale maintient ses taux à "+f2(M.rate*100)+" %";
  var x=surprise===0?"Décision conforme aux attentes.":"Surprise pour les marchés, qui attendaient "+e.lbl+".";
  x+=move>0?" Les banques en profitent, les valeurs de croissance et les secteurs endettés en pâtissent.":move<0?" Bonne nouvelle pour les valeurs de croissance et l'immobilier ; les banques voient leurs marges réduites.":"";
  addNews(G,{cat:"macro",big:surprise!==0,title:t,x:x});
  M.fedExp=null;
}
function release(G,k){
  var M=G.macro, cons, act, t, x;
  if(k==="infl"){cons=M.infl+randn()*0.0015;act=M.infl;t="Inflation : "+f1(act*100)+" % sur un an";x="Le consensus attendait "+f1(cons*100)+" %.";var s=act-cons;M.shock+=-s*3;x+=Math.abs(s)>0.002?(s>0?" Mauvaise surprise : les marchés craignent des hausses de taux.":" Bonne surprise : la pression sur les taux se relâche."):"";}
  if(k==="unemp"){cons=M.unemp+randn()*0.002;act=M.unemp;t="Chômage : "+f1(act*100)+" %";x="Le consensus attendait "+f1(cons*100)+" %.";var s2=cons-act;M.shock+=s2*2;}
  if(k==="gdp"){cons=M.gdp+randn()*0.004;act=M.gdp;t="Croissance : "+(act>=0?"+":"")+f1(act*100)+" % en rythme annuel";x="Le consensus attendait "+(cons>=0?"+":"")+f1(cons*100)+" %.";M.shock+=(act-cons)*1.5;}
  addNews(G,{cat:"macro",title:t,x:x});
}

/* ---------- sociétés ---------- */
function earningsSetup(G,t){
  var o=G.st[t];
  // la vraie tendance des bénéfices pour le prochain trimestre est tirée maintenant : les indices en parlent avant la publication
  var cyc=D.sectors[D.stocks[t].s].cyc;
  o.gExp=o.g+0.12*(o.glt-o.g); o.gNext=o.gExp+randn()*0.045;
  o.gNext=clamp(o.gNext,-0.4,0.6);
  o.cons=o.eps/4*Math.exp(o.gc/4);
  o.hintDay=o.earn-3-Math.floor(rnd()*14); o.leaked=0;
  var dir=o.gNext>=o.gExp?1:-1; o.proSig=rnd()<0.68?dir:-dir; o.fairNoise=randn()*0.03;
}
function earnings(G,t){
  var o=G.st[t], s=D.stocks[t];
  if(o.gNext==null)earningsSetup(G,t);
  var surpG=(o.gNext-o.gc), surp=surpG*0.6+randn()*0.015; // surprise sur le BPA trimestriel
  var actual=o.cons*(1+surp);
  var z=clamp(surp/0.04,-3,3);
  var permJ=clamp((o.gNext-o.gExp)/0.045,-3,3)*s.j*0.6-(o.leaked||0), jump=permJ+z*s.j*0.2+randn()*s.j*0.35;
  o.pe*=Math.exp(jump); o.fair*=Math.exp(permJ); addDrift(G,t,permJ*0.2,45); // dérive post-résultats (environ un tiers de la réaction, étalé sur deux mois) // dérive post-résultats (effet documenté)
  o.g=o.gNext; o.gc=o.g+randn()*0.02; o.lastSurp=surp; o.lastEarnDay=G.day;
  var dv=o.dy/4*P(G,t);
  var held=G.pos[t]?G.pos[t].q:0;
  if(dv>0){(G.divs=G.divs||[]).push({t:t,dv:dv});o.pe*=(1-o.dy/4);o.fair*=(1-o.dy/4);if(held&&!G.quiet){G.cash+=held*dv;G.tx.push({day:G.day,date:G.date,t:t,s:"D",q:held,p:dv,f:0,pl:held*dv});}}
  var verdict=surp>0.03?"pulvérise":surp>0.005?"bat":surp<-0.03?"déçoit lourdement":surp<-0.005?"manque":"publie en ligne avec";
  addNews(G,{cat:"resultats",tk:t,big:Math.abs(z)>1.5,title:name(t)+" "+verdict+" "+"le consensus",
    x:"BPA trimestriel de "+f2(actual)+" $ contre "+f2(o.cons)+" $ attendus ("+pc(surp)+"). Tendance des bénéfices sur un an : "+pc(o.g)+"."+(dv>0?" Dividende trimestriel : "+f2(dv)+" $ par action.":"")});
  o.earn=G.day+63; o.gNext=null; earningsSetup(G,t);
}
function hint(G,t){
  var o=G.st[t]; if(o.gNext==null)return;
  var up=o.gNext>o.gExp, correct=rnd()<0.58, say=correct?up:!up;
  o.hint=say?1:-1; o.hintTrue=correct;
  var pos=["Enquête : les ventes de {n} seraient meilleures que prévu","Les fournisseurs de {n} signalent des commandes en hausse","Fréquentation record observée chez {n}"];
  var neg=["Enquête : les ventes de {n} ralentiraient","Les distributeurs de {n} réduisent leurs commandes","Signes de faiblesse de la demande chez {n}"];
  addNews(G,{cat:"societe",tk:t,title:pick(say?pos:neg).replace("{n}",name(t)),x:"Indice avant la publication des résultats, prévue dans "+(o.earn-G.day)+" séances. Ce type de signal est souvent, mais pas toujours, confirmé."});
  var pj=Math.abs(clamp((o.gNext-o.gExp)/0.045,-3,3))*D.stocks[t].j*0.6; o.pe*=Math.exp((say?1:-1)*pj*0.25); o.fair*=Math.exp((say?1:-1)*pj*0.1);
}
function companyNews(G,t){
  var s=D.stocks[t], o=G.st[t], pool;
  var good=rnd()<0.5+clamp(o.g-o.gc,-0.1,0.1);
  var sec=SECTOR_NEWS[s.s];
  if(sec&&rnd()<0.3){pool=sec.filter(function(e){return (e.imp>0)===good;});if(!pool.length)pool=good?NEWS_POS:NEWS_NEG;}
  else pool=good?NEWS_POS:NEWS_NEG;
  var e=pick(pool);
  if(rnd()<0.08)e=pick(good?BIG_POS:BIG_NEG);
  var size=e.imp*s.j*(0.6+rnd()*0.8);
  o.pe*=Math.exp(size*0.9); o.fair*=Math.exp(size*0.8); addDrift(G,t,size*0.1,8);
  o.g=clamp(o.g+e.g,-0.4,0.6); if(o.gNext!=null)o.gNext=clamp(o.gNext+e.g,-0.4,0.6);
  if(e.div)o.dy*=1+e.div;
  if(e.k==="augk")o.eps*=0.97;
  addNews(G,{cat:"societe",tk:t,big:Math.abs(size)>0.06,title:e.t.replace("{n}",s.n),x:e.x});
}
function rumor(G){
  var t=pick(TK), src=pick(SRC), truth=rnd()<src.p, s=D.stocks[t];
  var kinds=[
   {k:"acq",t:"Rumeur : {n} préparerait une fusion très rentable",x:"Le groupe négocierait le rachat d'un concurrent, avec d'importantes économies à la clé.",imp:2*s.j,yes:"C'est officiel : {n} annonce une fusion majeure",no:"{n} dément toute opération de fusion",g:0.03},
   {k:"bon",t:"Rumeur : {n} s'apprêterait à relever ses objectifs",x:"La direction serait plus optimiste qu'annoncé.",imp:1.2*s.j,yes:"{n} relève ses objectifs annuels",no:"{n} confirme ses objectifs, sans les relever",g:0.02},
   {k:"enq",t:"Rumeur : le régulateur s'intéresserait à {n}",x:"Une enquête sur des irrégularités comptables serait envisagée.",imp:-1.5*s.j,yes:"Enquête officielle ouverte sur les comptes de {n}",no:"Pas d'enquête : {n} rassure le marché",g:-0.02},
   {k:"pdg",t:"Rumeur : le PDG de {n} sur le départ",x:"Le dirigeant aurait des désaccords avec le conseil d'administration.",imp:-0.8*s.j,yes:"Le PDG de {n} démissionne",no:"Le PDG de {n} reste en place",g:-0.005}
  ];
  var k=pick(kinds);
  var initial=k.imp*src.p*0.6;
  G.st[t].pe*=Math.exp(initial);
  addNews(G,{cat:"rumeur",tk:t,src:src.s,cred:src.p,title:k.t.replace("{n}",s.n),x:k.x+" Source : "+src.s+"."});
  sched(G,4+Math.floor(rnd()*14),"rumor",{t:t,k:k,truth:truth,initial:initial});
}
function resolveRumor(G,d){
  var o=G.st[d.t], s=D.stocks[d.t], k=d.k;
  if(d.truth){
    var rest=k.imp-d.initial; o.pe*=Math.exp(rest); o.fair*=Math.exp(k.imp*0.8); if(k.g)o.g=clamp(o.g+k.g,-0.4,0.6);
    addNews(G,{cat:"societe",tk:d.t,big:true,title:k.yes.replace("{n}",s.n),x:"La rumeur était fondée."});
  }else{
    o.pe*=Math.exp(-d.initial*0.9);
    addNews(G,{cat:"societe",tk:d.t,title:k.no.replace("{n}",s.n),x:"La rumeur ne se confirme pas."});
  }
}
function analystNote(G){
  var fi=Math.floor(rnd()*G.firms.length), F=G.firms[fi], t=pick(TK), o=G.st[t];
  var view=(o.fairNow||o.fair)*Math.exp(randn()*F.noise), gap=view/o.pe;
  var p=P(G,t), tgt=view*o.eps*Math.exp(o.gc+randn()*F.noise*0.3), up=tgt/p-1;
  var r=gap>1.12?3:gap<0.92?1:2;
  var prev=o.rat[fi];
  o.rat[fi]={r:r,tgt:tgt,day:G.day};
  F.calls.push({t:t,day:G.day,r:r,p:p,i:G.idx[G.idx.length-1]});
  var L={3:"Achat",2:"Neutre",1:"Vente"};
  var verb=!prev?"initie "+name(t)+" à « "+L[r]+" »":prev.r<r?"relève "+name(t)+" à « "+L[r]+" »":prev.r>r?"abaisse "+name(t)+" à « "+L[r]+" »":"réitère « "+L[r]+" » sur "+name(t);
  o.pe*=Math.exp(prev&&prev.r!==r?(r-prev.r)*0.006:0);
  addNews(G,{cat:"analyste",tk:t,firm:fi,r:r,title:F.n+" "+verb,x:"Objectif de cours : "+f2(tgt)+" $ ("+pc(up)+" de potentiel)."});
}
function scoreCalls(G){
  G.firms.forEach(function(F){
    var keep=[];
    F.calls.forEach(function(c){
      if(G.day-c.day>=63){
        if(c.r!==2){var rs=P(G,c.t)/c.p, ri=G.idx[G.idx.length-1]/c.i; var good=c.r===3?rs>ri:rs<ri; if(good)F.ok++;else F.ko++;}
      }else keep.push(c);
    });
    F.calls=keep;
  });
}

/* ---------- séance ---------- */
function step(G){
  G.day++; G.date=nextDate(G.date);
  G.divs=[]; G.splits=[];
  var M=G.macro;
  M.shock=0; G.rateMove=0;
  macroStep(G);
  // événements programmés
  var still=[];G.pend.forEach(function(e){if(e.day<=G.day){if(e.kind==="rumor")resolveRumor(G,e.data);}else still.push(e);});G.pend=still;
  // choc rare (géopolitique, krach éclair) — fréquence ~1 tous les 2 ans, plus probable si le marché est cher
  var stretch=avgStretch(G);
  if(rnd()<(1/500)*(1+Math.max(0,stretch)*3)){
    var sz=-(0.03+rnd()*0.05);M.shock+=sz;M.fearBoost=25;
    addNews(G,{cat:"macro",big:true,title:pick(["Krach éclair à Wall Street","Choc géopolitique : les marchés paniquent","Faillite d'un grand fonds : contagion redoutée","Tensions commerciales : escalade brutale"]),x:"Le marché recule de "+f1(-sz*100)+" % en une séance. La volatilité s'envole."});
  }
  M.fearBoost=(M.fearBoost||0)*0.93;
  var R=REG[M.reg], vm=R.vm*(1+(M.fearBoost||0)/40);
  var base=D.market.vol*0.76/Math.sqrt(252)*vm, A=0.0, Gm=0.2, Bt=0.88; // GJR : les baisses font monter la volatilité davantage que les hausses (effet de levier)
  if(!M.h)M.h=base*base;
  var el=M.eLast||0;M.h=Math.min(base*base*(1-A-Gm/2-Bt)+(A+(el<0?Gm:0))*el*el+Bt*M.h,9*base*base);
  var eps=Math.sqrt(M.h)*tdist(6)+M.shock;
  M.eLast=eps; var mkD=R.drift/252, mk=mkD+eps;
  var volRatio=Math.sqrt(M.h)/base;
  // mode du moment : par périodes de plusieurs années, le marché préfère les valeurs chères (croissance) ou bon marché (valeur)
  M.style=0.997*(M.style||0)+0.00008*randn();
  var mlpe=0,mAnc=0;TK.forEach(function(t){mlpe+=Math.log(G.st[t].pe);mAnc+=Math.log(G.st[t].fair0/G.st[t].fair);});mlpe/=TK.length;mAnc/=TK.length; // ancrage du PER moyen du marché seulement : pas de prime « valeur » gratuite action par action
  var secF={};
  Object.keys(D.sectors).forEach(function(s){var S=D.sectors[s];secF[s]=S.v/Math.sqrt(252)*Math.sqrt(vm)*tdist(5)+S.oil*M.oilR;});
  var sumR=0,n=0;
  TK.forEach(function(t){
    var s=D.stocks[t], o=G.st[t], S=D.sectors[s.s], p0=P(G,t);
    var gEff=o.g+R.gadj*S.cyc;
    var cycD=R.gadj*(S.cyc-0.9)/252;
    o.eps*=Math.exp(gEff/252);
    // rendement attendu à peu près égal entre actions : une forte croissance se paie par un PER qui se contracte avec le temps
    var rT=0.10+0.02*(s.b-1);
    o.fair*=Math.exp((rT-gEff)/252+0.0006*mAnc);
    if(o.fair>70)o.fair*=Math.exp(0.003*Math.log(70/o.fair)); else if(o.fair<2)o.fair*=Math.exp(0.001*Math.log(2/o.fair));
    var fair=o.fair*Math.exp(-S.rs*(M.rate-0.025));
    o.fairNow=clamp(fair,3,250);
    var dr=0; o.drift=o.drift.filter(function(d){dr+=d.v;return --d.n>0;});
    var lpe=Math.log(o.pe);
    // en période agitée, les nouvelles propres à chaque société s'agitent aussi (pas seulement le marché)
    var ei=s.i/Math.sqrt(252)*Math.sqrt(0.85)*Math.pow(vm,1.0)*Math.pow(volRatio,0.85);
    var perm=0.88*s.b*eps+0.78*s.sg*secF[s.s]+Math.sqrt(0.88)*ei*tdist(5);
    var trans=0.12*s.b*eps+s.b*mkD+0.22*s.sg*secF[s.s]+Math.sqrt(0.12)*ei*tdist(5);
    // retour à la moyenne de court terme : une partie des excès d'une semaine se corrige la semaine suivante
    var stN=0.75*(o.stv||0)+Math.sqrt(0.15/1.14)*s.i/Math.sqrt(252)*tdist(5); trans+=stN-(o.stv||0); o.stv=stN;
    perm+=cycD; trans+=M.style*clamp(Math.log(o.pe)-mlpe,-1,1); o.fair*=Math.exp(perm);
    lpe+=(rT-clamp(gEff,-0.08,0.35))/252; // le multiple suit la croissance : rendement attendu identique pour toutes les actions
    // retour vers la juste valeur : 0,0025 → 0,0023 par séance (décision de Victor 16/11 : stratégie « PER bas » moins fiable)
    lpe+=0.0023*(Math.log(o.fairNow)-lpe)+perm+trans+dr-S.rs*G.rateMove*0.6;
    lpe=Math.min(Math.max(lpe,Math.log(o.fairNow*0.35)),Math.log(o.fairNow*3)); o.pe=Math.exp(lpe);
    if(G.day===o.earn)earnings(G,t);
    else if(o.gNext==null)earningsSetup(G,t);
    if(o.hintDay===G.day&&rnd()<0.6)hint(G,t);
    if(o.gNext!=null&&o.earn-G.day===10){var pj=clamp((o.gNext-o.gExp)/0.045,-3,3)*s.j*0.6;o.leaked=0.55*pj;o.fair*=Math.exp(o.leaked);o.pe*=Math.exp(o.leaked*0.5);addDrift(G,t,o.leaked*0.5,4);}
    if(rnd()<1/140)companyNews(G,t);
    var p=Math.max(0.5,o.pe*o.eps); o.pe=p/o.eps;
    var ks=1;
    if(p>1200&&!G.quiet){ // division d'action, comme le font les vraies sociétés quand le cours devient trop élevé
      var k=p>6000?20:10; ks=k; p/=k; o.eps/=k; o.cons/=k; o.p=o.p.map(function(x){return +(x/k).toFixed(2);});
      for(var fi in o.rat)o.rat[fi].tgt/=k;
      G.firms.forEach(function(F){F.calls.forEach(function(c){if(c.t===t)c.p/=k;});});
      if(G.pos[t])G.pos[t].q*=k;
      (G.splits=G.splits||[]).push({t:t,k:k});
      addNews(G,{cat:"societe",tk:t,title:name(t)+" divise son action par "+k,x:"Chaque action détenue devient "+k+" actions. La valeur de votre position ne change pas ; l'historique des cours est ajusté."});
    }
    o.p.push(+p.toFixed(2)); if(o.p.length>1600)o.p.shift();
    sumR+=p*ks/p0-1;n++;
  });
  if(rnd()<0.12)rumor(G);
  var na=rnd()<0.35?0:rnd()<0.7?1:2; for(var a=0;a<na;a++)analystNote(G);
  if(G.day%5===0)scoreCalls(G);
  var ir=sumR/n; G.idx.push(+(G.idx[G.idx.length-1]*(1+ir)).toFixed(2));
  M.mvol.push(Math.log(1+ir)); if(M.mvol.length>21)M.mvol.shift();
  var sd=Math.sqrt(M.mvol.reduce(function(a,x){return a+x*x;},0)/M.mvol.length);
  M.fear=clamp(sd*Math.sqrt(252)*100*1.15+4+randn()*0.6,9,80);
  G.dates.push(G.date); if(G.dates.length>1600){G.dates.shift();G.idx.shift();G.trim=(G.trim||0)+1;}
  if(G.idx.length>G.dates.length)G.idx.shift();
  G.vals.push(value(G)); if(G.vals.length>G.dates.length)G.vals.shift();
  if(G.news.length>700)G.news=G.news.slice(-600);
}
function use(data){D=data;TK=Object.keys(D.stocks);} // partie rechargée : le moteur doit connaître les données sans refaire init
return {init:init,use:use,step:step,value:value,P:P,REG:REG,FIRMS:FIRMS,f2:f2,pc:pc,nextDate:nextDate};
})();
if(typeof module!=="undefined")module.exports=ENGINE;
