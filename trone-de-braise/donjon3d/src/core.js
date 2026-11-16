/* ===== Valdragon · Tour par tour — moteur (logique pure, sans DOM) ===== */
(function(root){
"use strict";
const W=64,H=64,TAU=Math.PI*2;
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}
let R=Math.random;
const ri=n=>Math.floor(R()*n),rr=(a,b)=>a+R()*(b-a),cl=(v,a,b)=>v<a?a:v>b?b:v,pk=a=>a[ri(a.length)];
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function wpick(w){let s=0;for(const k in w)s+=w[k];let x=R()*s;for(const k in w){x-=w[k];if(x<=0)return k;}return Object.keys(w)[0];}

/* ---------- équilibrage ---------- */
const BAL={respawn:45,
 hpScale:.30,hpScale2:.015,dmgScale:.20,dmgScale2:.0025,monHp:2.6,monDmg:1.5,
 packChance:0.75,eliteChance:.22,packMin:2,packRand:2,
 xpBase:60,xpExp:1.55,xpMul:.7,
 potHeal:.45,potFlat:20,startPot:3,potMax:6,
 dropItem:0.075,goldMul:.75,
 bossHp:140,bossHpScale:0.45,bossHpScale2:0.02,bossDmg:6.2,bossDmgScale:0.2,
 defK:50,regen:8,postHeal:.20,
 legBase:.3,legK:.05,rareBase:3,rareK:.6,magBase:18,floorLuck:.25,eliteLuck:8,mfDiv:10,
 itemScale:.12,valMul:.4,fleeBase:.55,
};

/* ---------- classes et compétences ---------- */
const CLASSES={
 guerrier:{n:'Aldric',t:'Guerrier',hp:[72,13],str:[10,2.1],mag:[2,.3],def:[8,1.3],spd:[9,.15],crit:5,en:40,main:'str'},
 mage:{n:'Ysolde',t:'Mage',hp:[44,7.5],str:[3,.4],mag:[12,2.5],def:[3,.6],spd:[11,.2],crit:5,en:60,main:'mag'},
 rodeuse:{n:'Maëlle',t:'Rôdeuse',hp:[52,9.5],str:[10,2.2],mag:[3,.3],def:[5,.9],spd:[14,.25],crit:15,en:50,main:'str'}};
const SK={
 frappe:{n:'Frappe',c:'guerrier',l:1,cost:0,cd:0,tg:'foe',d:'Coup d’épée. +10 énergie.'},
 provoc:{n:'Provocation',c:'guerrier',l:1,cost:15,cd:2,tg:'self',d:'Attire les attaques ciblées pendant 2 tours, défense +50 %.'},
 fendoir:{n:'Fendoir',c:'guerrier',l:1,cost:25,cd:0,tg:'all',d:'Frappe tous les ennemis à 55 %.'},
 rempart:{n:'Rempart',c:'guerrier',l:3,cost:30,cd:4,tg:'party',d:'Le groupe subit −40 % de dégâts jusqu’au prochain tour d’Aldric.'},
 execution:{n:'Exécution',c:'guerrier',l:6,cost:35,cd:3,tg:'foe',d:'Coup puissant (180 %), double sous 30 % de vie.'},
 trait:{n:'Trait arcanique',c:'mage',l:1,cost:0,cd:0,tg:'foe',d:'Projectile magique. +8 énergie.'},
 feu:{n:'Boule de feu',c:'mage',l:1,cost:25,cd:0,tg:'all',d:'Tous les ennemis (70 %) et brûlure 3 tours.'},
 soin:{n:'Soin',c:'mage',l:1,cost:20,cd:0,tg:'ally',d:'Rend 30 % de la vie d’un allié, plus la Magie.'},
 givre:{n:'Lance de givre',c:'mage',l:2,cost:22,cd:2,tg:'foe',d:'140 % et gèle : la cible perd son prochain tour (annule les incantations).'},
 barriere:{n:'Barrière',c:'mage',l:5,cost:28,cd:3,tg:'ally',d:'Bouclier qui absorbe 25 % de la vie de l’allié, plus la Magie ×2.'},
 meteore:{n:'Météore',c:'mage',l:8,cost:50,cd:4,tg:'all',d:'Pluie de feu sur tous les ennemis (160 %).'},
 tir:{n:'Tir',c:'rodeuse',l:1,cost:0,cd:0,tg:'foe',d:'Flèche précise. +10 énergie.'},
 poison:{n:'Flèche empoisonnée',c:'rodeuse',l:1,cost:15,cd:0,tg:'foe',d:'70 % et poison cumulable 3 tours.'},
 volee:{n:'Volée',c:'rodeuse',l:1,cost:25,cd:0,tg:'all',d:'4 flèches sur des ennemis au hasard (50 % chacune).'},
 marque:{n:'Marque du chasseur',c:'rodeuse',l:3,cost:15,cd:3,tg:'foe',d:'La cible subit +30 % de dégâts pendant 3 tours.'},
 fatal:{n:'Tir fatal',c:'rodeuse',l:7,cost:40,cd:4,tg:'foe',d:'220 %, coup critique garanti.'}};
const CLS_SK={guerrier:['frappe','provoc','fendoir','rempart','execution'],mage:['trait','feu','soin','givre','barriere','meteore'],rodeuse:['tir','poison','volee','marque','fatal']};

/* ---------- objets ---------- */
const RAR=['Commun','Magique','Rare','Légendaire'];
const SLOTS={arme:'Arme',armure:'Armure',bijou:'Bijou'};
const WEAP={guerrier:[['Épée courte',4,8],['Hache de guerre',5,11],['Masse ferrée',7,11],['Lame bâtarde',8,15],['Glaive runique',10,18],['Fendoir de Wyrm',13,23]],
 mage:[['Baguette de frêne',3,6],['Bâton de chêne',4,8],['Grimoire relié',5,10],['Bâton runique',7,12],["Sceptre d'opale",9,15],['Bâton de Wyrm',11,19]],
 rodeuse:[['Arc court',3,8],['Arc de chasse',4,10],['Arc long',6,12],['Arc composite',7,14],['Arc runique',9,17],['Arc de Wyrm',12,21]]};
const ARM=[['Tunique',3],['Brigandine',6],['Cotte de mailles',10],["Plastron d'acier",15],["Armure d'écailles",21],['Harnois runique',28]];
const JEW=['Anneau','Amulette','Talisman'];
const AFF={hp:['Vie',8,18,0,'de Vigueur'],str:['Force',2,5,0,'du Taureau'],mag:['Magie',2,5,0,'du Mage'],def:['Défense',2,5,0,'du Rempart'],spd:['Vitesse',1,3,0,'du Vent'],
 crit:['% critique',2,5,1,'de Précision'],ll:['% vol de vie',2,4,1,'du Vampire'],en:['Énergie max',5,12,0,'de Sagesse'],regen:['Énergie par tour',1,3,1,'de la Source'],
 pdmg:['% dégâts',5,14,1,'du Massacre'],res:['% résistance',3,8,1,'de la Garde'],gf:['% or trouvé',10,25,1,'du Marchand'],mf:['% objets magiques',8,20,1,'de Fortune']};
const AFFW={hp:.5,str:1.6,mag:1.6,def:1.1,spd:2,crit:2.2,ll:3,en:.4,regen:3,pdmg:1.8,res:2,gf:.15,mf:.3};
const NOSCALE={crit:1,ll:1,spd:1,regen:1,res:1};
const UNIQ=[
 {n:'Cendrebraise',s:'arme',c:'guerrier',b:4,u:'burnhit',fx:'Les attaques d’Aldric infligent brûlure.',a:[['str',6],['pdmg',20]]},
 {n:'Fléau des Mille Marches',s:'arme',c:'guerrier',b:3,u:'freecleave',fx:'Fendoir ne coûte plus d’énergie.',a:[['hp',30],['spd',3]]},
 {n:'Bâton de Sylthra',s:'arme',c:'mage',b:4,u:'iceall',fx:'Lance de givre touche tous les ennemis.',a:[['mag',7],['en',15]]},
 {n:'Grimoire de Vharzul',s:'arme',c:'mage',b:3,u:'fireup',fx:'Boule de feu : +50 % de dégâts, brûlure doublée.',a:[['mag',6],['regen',3]]},
 {n:'Arc des Mille Vents',s:'arme',c:'rodeuse',b:4,u:'volley6',fx:'Volée tire 6 flèches.',a:[['str',6],['crit',6]]},
 {n:'Cœur-de-Wyrm',s:'armure',b:4,u:'dr',fx:'Réduit tous les dégâts subis de 15 %.',a:[['hp',45],['def',6]]},
 {n:'Œil de Vharzul',s:'bijou',b:0,u:'critx',fx:'Les coups critiques infligent ×2,5 au lieu de ×1,6.',a:[['crit',10],['pdmg',12]]},
 {n:'Couronne du Roi Englouti',s:'bijou',b:0,u:'regen',fx:'+6 énergie par tour.',a:[['mag',5],['en',20]]},
 {n:"Larme d'Écaille",s:'bijou',b:0,u:'scale',fx:'+5 à toutes les caractéristiques, 5 % de vol de vie.',a:[['str',5],['mag',5],['def',5],['spd',2],['ll',5]]}];
const RW1=['Glas','Fléau','Ombre','Cendre','Croc','Serment','Rune','Brume','Sang','Givre','Corne','Murmure'],RW2=['funeste','du Gouffre','écarlate','des Anciens','maudit','du Néant','des Marches','de Braise','sans nom','du Roi'];
let UID=1;
function affix(k,il){const a=AFF[k];let v=rr(a[1],a[2]);if(!NOSCALE[k])v*=1+.09*(il-1);return{k,v:Math.max(1,Math.round(v))};}
function baseItem(slot,cls,il,bi){const m=1+BAL.itemScale*(il-1);const it={id:UID++,s:slot,il,aff:[]};
 if(slot==='arme'){const b=WEAP[cls][Math.min(bi,5)];it.c=cls;it.n=it.bn=b[0];it.dmin=Math.round(b[1]*m);it.dmax=Math.round(b[2]*m);}
 else if(slot==='armure'){const b=ARM[Math.min(bi,5)];it.n=it.bn=b[0];it.def=Math.round(b[1]*m);}
 else{it.n=it.bn=pk(JEW);}return it;}
function mkItem(il,rar,slot,cls){slot=slot||pk(['arme','arme','armure','bijou']);cls=cls||pk(Object.keys(CLASSES));
 if(rar===3){let pool=UNIQ.filter(u=>u.s===slot&&(!u.c||u.c===cls));if(!pool.length)pool=UNIQ.filter(u=>u.s===slot);const u=pk(pool);
  const it=baseItem(slot,u.c||cls,il,u.b);it.rar=3;it.n=u.n;it.u=u.u;it.fx=u.fx;it.aff=u.a.map(([k,v])=>({k,v:Math.round(v*(NOSCALE[k]?1:1+.05*(il-1)))}));
  const a=affix(pk(Object.keys(AFF)),il),ex=it.aff.find(x=>x.k===a.k);if(ex)ex.v+=a.v;else it.aff.push(a);
  if(it.dmin){it.dmin=Math.round(it.dmin*1.2);it.dmax=Math.round(it.dmax*1.2);}if(it.def)it.def=Math.round(it.def*1.2);return it;}
 const bi=cl(Math.floor(il/3)+ri(2)-(R()<.3?1:0),0,5),it=baseItem(slot,cls,il,bi);it.rar=rar;
 const n=rar===0?(slot==='bijou'?1:0):rar===1?1+ri(2):3+ri(2);const ks=Object.keys(AFF).sort(()=>R()-.5).slice(0,n);it.aff=ks.map(k=>affix(k,il));
 if(rar===1||(rar===0&&n))it.n=it.n+' '+AFF[ks[0]][4];if(rar===2)it.n=pk(RW1)+' '+pk(RW2);return it;}
function rollRar(b){const x=R()*100;if(x<BAL.legBase+b*BAL.legK)return 3;if(x<BAL.rareBase+b*BAL.rareK)return 2;if(x<BAL.magBase+b)return 1;return 0;}
const val=it=>Math.round((5+it.il*3)*[1,3,8,25][it.rar]*BAL.valMul);
function power(it){if(!it)return 0;let s=0;if(it.dmin!==undefined)s+=(it.dmin+it.dmax)/2*2.5;if(it.def)s+=it.def*1.2;it.aff.forEach(a=>s+=AFFW[a.k]*a.v);if(it.u)s+=25+it.il*3;return s;}
const canEquip=(h,it)=>it.s!=='arme'||it.c===h.cls;

/* ---------- monstres ---------- */
const MON={
 gob:{n:'Gobelin',hp:22,atk:6,def:2,spd:13,xp:10,f:1,gold:4},
 sq:{n:'Squelette',hp:30,atk:7,def:6,spd:8,xp:12,f:1,gold:3},
 ar:{n:'Archer squelette',hp:22,atk:7.5,def:3,spd:11,xp:12,f:1,gold:3},
 sp:{n:'Araignée des cavernes',hp:20,atk:5,def:2,spd:15,xp:11,f:2,gold:2},
 ch:{n:'Chaman gobelin',hp:24,atk:5,def:2,spd:10,xp:14,f:2,gold:6},
 py:{n:'Pyromancien',hp:26,atk:8,def:2,spd:9,xp:16,f:3,gold:6},
 go:{n:'Golem de pierre',hp:56,atk:9.5,def:10,spd:4,xp:30,f:4,gold:8},
 wy:{n:'Dragonnet',hp:34,atk:8,def:5,spd:12,xp:16,f:5,gold:5},
 so:{n:'Soldat',hp:30,atk:7,def:6,spd:9,xp:12,f:99,gold:4},
 ab:{n:'Arbalétrier',hp:22,atk:7.5,def:3,spd:11,xp:12,f:99,gold:4},
 cb:{n:'Champion',hp:110,atk:11,def:10,spd:10,xp:40,f:99,gold:20}};
const BIOMES=[{n:'Crypte oubliée',w:{sq:3,ar:2,gob:2,sp:1,ch:1,py:1,go:1,wy:.5}},{n:'Cavernes fongiques',w:{sp:3,gob:3,ch:2,go:1,ar:1,py:1,wy:1,sq:1}},
 {n:'Forge engloutie',w:{py:3,go:2,wy:2,sq:1,gob:1,ar:1,sp:1,ch:1}},{n:'Abîme de givre',w:{sq:2,ar:3,sp:2,go:3,py:3,wy:2,ch:1,gob:.5}}];
const BOSSES=[{n:'Vharzul, Dragon des Cendres',el:'fire'},{n:'Sylthra, Wyrm de Givre',el:'ice'},{n:'Morgrath le Dévoreur',el:'poison'},{n:'Ysmeralde, Reine des Écailles',el:'arcane'}];
const ELITE={rapide:'Rapide',blinde:'Blindé',vampire:'Vampirique',ardent:'Ardent'};
const SHRINES={fureur:['Sanctuaire de Fureur','+30 % de dégâts au prochain combat'],bastion:['Sanctuaire du Bastion','−25 % de dégâts subis au prochain combat'],vie:['Source de vie','Le groupe est entièrement soigné'],arcane:['Sanctuaire arcanique','Énergie pleine et +10 par tour au prochain combat']};

/* ---------- état ---------- */
const G={W,H,BAL,ev:[],stats:null};
const at=(x,y)=>(x<0||y<0||x>=W||y>=H)?0:G.map[(y|0)*W+(x|0)];
const solid=(x,y)=>{const v=at(x,y);return v===0||v===3||v===4;};
function carve(x,y,w,h,v=1){for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)if(i>0&&j>0&&i<W-1&&j<H-1&&G.map[j*W+i]!==2)G.map[j*W+i]=v;}
function emit(e){if(G.ev.length<300)G.ev.push(e);const B=G.B;if(B&&B.sc&&!B.over)track(B,e);}
function track(B,e){const sc=B.sc,add=(h,v,k)=>{if(!h||h.side!=='h'||!(v>0))return;sc[h.cls]=(sc[h.cls]||0)+v;const d=B.det[h.cls]=B.det[h.cls]||{dmg:0,heal:0,tank:0,util:0,kill:0};d[k]+=v;};const cur=B.cur&&B.cur.side==='h'?B.cur:null;
 const avg=B.avgM||(B.avgM=B.foes.reduce((s,f)=>s+f.mhp,0)/Math.max(1,B.foes.length));
 switch(e.t){case'hit':if(e.src&&e.src.side==='h'){add(e.src,e.v,'dmg');B.lastBy.set(e.u,e.src);}if(e.u.side==='h')add(e.u,e.v*(e.u.cls==='guerrier'?.8:.25),'tank');break;
  case'heal':add(cur,e.v*1.3,'heal');break;
  case'status':if(cur&&['taunt','rampart','shield','gel','mark','poison','slow','defup'].includes(e.s))add(cur,avg*(e.s==='taunt'||e.s==='rampart'?.3:.15),'util');break;
  case'absorb':if(e.u.side==='h'){const m=G.P.heroes.find(h=>h.cls==='mage'&&!h.dead);add(m,e.v*.7,'util');add(e.u,e.v*.3,'tank');}break;
  case'die':if(e.u.side==='e'){const k=B.lastBy.get(e.u);add(k,e.u.mhp*.3,'kill');}break;}}

function mkHero(cls){const C=CLASSES[cls];return{cls,n:C.n,t:C.t,eq:{arme:baseItem('arme',cls,1,0),armure:baseItem('armure',cls,1,cls==='guerrier'?1:0),bijou:null},rk:{},cdn:{},side:'h',st:{},lvl:1,xp:0,spts:0};}
function newParty(){const p={x:0,y:0,r:.34,lvl:1,xp:0,gold:0,pot:{soin:BAL.startPot,elixir:1,phenix:1},bag:[],floor:1,best:1,wins:0,wipes:0,spts:0,bless:null,
 heroes:[mkHero('guerrier'),mkHero('mage'),mkHero('rodeuse')]};p.heroes.forEach(h=>{h.eq.arme.rar=0;h.eq.armure.rar=0;});return p;}
const xpNext=l=>Math.round(BAL.xpBase*Math.pow(l,BAL.xpExp));
// progression propre à chaque héros : courbe par classe, XP selon les actions en combat
const XPC={guerrier:1,mage:1.12,rodeuse:.93};const xpNextH=h=>Math.round(xpNext(h.lvl)*(XPC[h.cls]||1));
function syncLvl(){const P=G.P;P.lvl=Math.round(P.heroes.reduce((s,h)=>s+h.lvl,0)/P.heroes.length);P.spts=P.heroes.reduce((s,h)=>s+h.spts,0);}
function migrate(){const P=G.P;P.heroes.forEach(h=>{if(h.lvl===undefined){h.lvl=P.lvl||1;h.xp=Math.round((P.xp||0)*(XPC[h.cls]||1));h.spts=P.spts||0;}});syncLvl();}
function stats(h){const C=CLASSES[h.cls],L=(h.lvl||1)-1,a={};Object.keys(AFF).forEach(k=>a[k]=0);const u={};let def=0,dmin=2,dmax=4;
 Object.values(h.eq).forEach(it=>{if(!it)return;it.aff.forEach(x=>a[x.k]+=x.v);if(it.def)def+=it.def;if(it.u)u[it.u]=1;if(it.s==='arme'){dmin=it.dmin;dmax=it.dmax;}});
 const rk=k=>h.rk[k]||0,s={};
 s.mhp=Math.round(C.hp[0]+C.hp[1]*L+a.hp);s.str=Math.round(C.str[0]+C.str[1]*L+a.str);s.mag=Math.round(C.mag[0]+C.mag[1]*L+a.mag);
 s.def=Math.round(C.def[0]+C.def[1]*L+def+a.def);s.spd=Math.round(C.spd[0]+C.spd[1]*L+a.spd);s.crit=C.crit+a.crit;s.ll=a.ll;s.men=C.en+a.en;s.regen=BAL.regen+a.regen+(u.regen?6:0);
 s.pdmg=a.pdmg;s.res=Math.min(50,a.res);s.dmin=dmin;s.dmax=dmax;s.u=u;s.cm=u.critx?2.5:1.6;s.dr=u.dr?.15:0;s.mf=a.mf;s.gf=a.gf;
 if(u.scale){s.str+=5;s.mag+=5;s.def+=5;s.spd+=2;}
 s.pow=(dmin+dmax)/2+s[C.main]*.8;h.s=s;return s;}
function calcAll(){if(G.P.heroes.some(h=>h.lvl===undefined))migrate();G.P.heroes.forEach(h=>{stats(h);if(h.hp===undefined){h.hp=h.s.mhp;h.en=h.s.men;}h.hp=Math.min(h.hp,h.s.mhp);h.en=Math.min(h.en,h.s.men);});
 G.mf=G.P.heroes.reduce((s,h)=>s+h.s.mf,0);G.gf=G.P.heroes.reduce((s,h)=>s+h.s.gf,0);}
function skillsOf(h){return CLS_SK[h.cls].filter(k=>SK[k].l<=h.lvl);}

/* ---------- carte ---------- */
function gen(){const map=G.map=new Uint8Array(W*H);G.seen=new Uint8Array(W*H);G.vis=new Uint8Array(W*H);const rooms=G.rooms=[];
 for(let t=0;t<500&&rooms.length<12;t++){const w=5+ri(8),h=5+ri(6),x=2+ri(W-w-4),y=2+ri(H-h-4);
  if(rooms.some(o=>x<o.x+o.w+2&&x+w+2>o.x&&y<o.y+o.h+2&&y+h+2>o.y))continue;rooms.push({x,y,w,h,cx:x+(w>>1),cy:y+(h>>1)});carve(x,y,w,h);}
 rooms.sort((a,b)=>a.cx+a.cy-b.cx-b.cy);
 const link=(a,b)=>{if(R()<.5){carve(Math.min(a.cx,b.cx),a.cy,Math.abs(a.cx-b.cx)+2,2);carve(b.cx,Math.min(a.cy,b.cy),2,Math.abs(a.cy-b.cy)+2);}
  else{carve(a.cx,Math.min(a.cy,b.cy),2,Math.abs(a.cy-b.cy)+2);carve(Math.min(a.cx,b.cx),b.cy,Math.abs(a.cx-b.cx)+2,2);}};
 for(let i=1;i<rooms.length;i++)link(rooms[i-1],rooms[i]);for(let i=0;i<3;i++)link(pk(rooms),pk(rooms));
 const r0=rooms[0];let far=rooms[1],fd=0;rooms.forEach(r=>{const d=Math.hypot(r.cx-r0.cx,r.cy-r0.cy);if(d>fd){fd=d;far=r;}});
 rooms.forEach(r=>{if(r===r0||r===far||r.w<9||r.h<8||R()<.4)return;for(let y=r.y+2;y<r.y+r.h-2;y+=3)for(let x=r.x+2;x<r.x+r.w-2;x+=3){if(Math.abs(x-r.cx)<2&&Math.abs(y-r.cy)<2)continue;map[y*W+x]=3;}});
 // mobilier (cases bloquantes) : tables, bibliothèques, réserves
 G.furn=[];const free=(x,y)=>map[y*W+x]===1,wallAt=(x,y)=>map[y*W+x]===0;
 rooms.forEach((r,i)=>{if(i===0||r===far)return;r.theme=null;const th=G.expe?1:R();
  if(r.w>=7&&r.h>=6&&th<.34){const y=r.cy;if([-1,0,1].every(d=>free(r.cx+d,y)&&free(r.cx+d,y-1)&&free(r.cx+d,y+1))){[-1,0,1].forEach(d=>map[y*W+r.cx+d]=4);G.furn.push({k:'table',x:r.cx,y,w:3});r.theme='salle';}}
  else if(th<.62){let n=0;for(let x=r.x+1;x<r.x+r.w-1;x+=2){const y=r.y;if(free(x,y)&&wallAt(x,y-1)&&wallAt(x-1,y-1)&&wallAt(x+1,y-1)&&free(x,y+1)&&free(x-1,y)&&free(x+1,y)){map[y*W+x]=4;G.furn.push({k:'shelf',x,y,d:0});n++;}}if(n)r.theme='biblio';}
  else if(th<.85){[[r.x,r.y+r.h-1,-1,1],[r.x+r.w-1,r.y+r.h-1,1,1]].forEach(([x,y,dx,dy])=>{if(free(x,y)&&wallAt(x+dx,y)&&wallAt(x,y+dy)&&free(x-dx,y)&&free(x,y-dy)){map[y*W+x]=4;G.furn.push({k:'store',x,y});}});r.theme='reserve';}});
 G.stairs={x:far.cx,y:far.cy,room:far};map[far.cy*W+far.cx]=2;
 G.obj=[];G.lights=[];
 for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){if(map[y*W+x]===0&&map[(y+1)*W+x]===1&&map[(y-1)*W+x]===0&&((x*7+y*13)%9===0))G.lights.push({x:x+.5,y:y+.75,k:'torch'});}
 rooms.forEach((r,i)=>{const n=i===0?0:ri(3);for(let j=0;j<n;j++){const x=r.x+.6+R()*(r.w-1.2),y=r.y+.6+R()*(r.h-1.2);if(!solid(x,y))G.obj.push({t:'brk',x,y,k:R()<.5?'tonneau':'urne'});}
  if(i>0&&R()<.22)G.obj.push({t:'chest',x:r.x+1.5,y:r.y+1.5,gold:R()<.25});
  if(i>0&&r.w>6&&R()<.35){G.lights.push({x:r.x+.8,y:r.y+.8,k:'brasier'});G.lights.push({x:r.x+r.w-.8,y:r.y+.8,k:'brasier'});}});
 const sr=rooms.filter((r,i)=>i>0&&r!==far);if(sr.length&&R()<.75){const r=pk(sr);G.obj.push({t:'shrine',x:r.cx+.5,y:r.cy+.5,k:pk(Object.keys(SHRINES))});}
 G.obj=G.obj.filter(o=>!solid(o.x,o.y));}
function populate(){const E=G.E=[];const tier=G.tier();const w={};for(const k in BIOMES[tier].w)if(MON[k].f<=G.F)w[k]=BIOMES[tier].w[k];
 G.rooms.forEach((r,i)=>{if(i===0||r===G.stairs.room&&G.lair())return;if(R()>BAL.packChance&&r!==G.stairs.room)return;E.push(mkPack(r,w));});
 if(G.expe)while(E.length>(G.expe.packs||5))E.splice(ri(E.length),1);
 G.nPacks=E.length;G.respT=0;
 G.bossAlive=false;if(G.lair()&&G.P.bossDone!==G.F){const r=G.stairs.room,b=bossDef();G.E.push({pack:1,boss:1,k:'boss',el:b.el,n:b.n,mem:['boss'],x:r.cx+.5,y:r.cy-1.5,r:1.05,aggro:0,ph:0,fl:0,hp:1,mhp:1,wind:0,mods:[],cnt:1,stun:0});G.bossAlive=true;}}
function mkPack(r,w){{
  const n=BAL.packMin+ri(BAL.packRand+1)+(G.F>6?1:0)-(G.F===1?1:0);const lead=wpick(w),mem=[lead];for(let j=1;j<n;j++)mem.push(R()<.5?lead:wpick(w));
  const elite=R()<BAL.eliteChance*(G.F>1?1:.3)?pk(Object.keys(ELITE)):null;
  let x=r.cx+.5,y=r.cy+.5;if(solid(x,y)){x=r.x+1.5;y=r.y+1.5;}
  return{pack:1,k:lead,mem,elite,x,y,r:.4,aggro:0,ph:R()*6,fl:0,hp:1,mhp:1,wind:0,mods:elite?[elite]:[],n:(elite?ELITE[elite]+' · ':'')+MON[lead].n,cnt:n,stun:0};}}
// réapparition : de nouveaux groupes rôdent dans les salles éloignées et hors de vue
// champ de distance vers le groupe (pour les chasseurs qui rôdent)
function flowUpdate(){const P=G.P,f=G.flow||(G.flow=new Int16Array(W*H));f.fill(-1);const s=(P.y|0)*W+(P.x|0);f[s]=0;const q=[s];let qi=0;
 while(qi<q.length){const c=q[qi++],x=c%W,y=(c/W)|0,d=f[c];if(d>40)continue;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const n=(y+dy)*W+x+dx;if(f[n]<0&&!solid(x+dx+.5,y+dy+.5)){f[n]=d+1;q.push(n);}}}}
function hunt(e,dt){const f=G.flow;if(!f)return;const x=e.x|0,y=e.y|0,d=f[y*W+x];if(d<0||d>30)return;let bx=x,by=y,bd=d;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const v=f[(y+dy)*W+x+dx];if(v>=0&&v<bd){bd=v;bx=x+dx;by=y+dy;}}
 const tx=bx+.5,ty=by+.5,a=Math.atan2(ty-e.y,tx-e.x);if(Math.hypot(tx-e.x,ty-e.y)>.05)moveE(e,Math.cos(a)*1.5*dt,Math.sin(a)*1.5*dt);}
function respawn(dt){const P=G.P;if(G.expe)return;G.respT=(G.respT||0)+dt;if(G.respT<BAL.respawn)return;G.respT=0;
 const alive=G.E.filter(e=>!e.boss).length;if(alive>=Math.max(4,(G.nPacks||0)+1))return;const tier=G.tier();const w={};for(const k in BIOMES[tier].w)if(MON[k].f<=G.F)w[k]=BIOMES[tier].w[k];
 const rs=G.rooms.filter((r,i)=>i>0&&!(r===G.stairs.room&&G.lair())&&Math.hypot(r.cx-P.x,r.cy-P.y)>9&&!G.vis[r.cy*W+r.cx]&&!G.E.some(e=>Math.hypot(e.x-r.cx,e.y-r.cy)<3));
 if(!rs.length)return;const p=mkPack(pk(rs),w);p.re=1;p.hunt=1;G.E.push(p);emit({t:'respawn',e:p});}
function startFloor(f){G.F=f;const P=G.P;P.floor=f;P.best=Math.max(P.best,f);gen();const r=G.rooms[0];P.x=r.cx+.5;P.y=r.cy+.5;G.merch=G.expe?{x:-99,y:-99}:{x:r.cx+2.5,y:r.cy-1.2};
 populate();G.PR=[];G.LOOT=[];G.HZ=[];G.GZ=[];G.B=null;G.ctx=null;G.revT=0;G.face=Math.PI/2;G.swing=0;P.iframe=0;P.dashT=0;P.buffs={};
 calcAll();if(G.stats)G.stats.floorStart(f);emit({t:'floor',f,biome:BIOMES[G.tier()].n,boss:G.lair()});}

/* ---------- exploration ---------- */
function free(x,y,r){r=Math.min(r,.45);return !solid(x-r,y-r)&&!solid(x+r,y-r)&&!solid(x-r,y+r)&&!solid(x+r,y+r);}
function moveE(e,dx,dy){let moved=false;const ax=Math.abs(dx),ay=Math.abs(dy);
 if(free(e.x+dx,e.y,e.r)){e.x+=dx;moved=true;}else if(ax>ay*2){for(const s of[1,-1]){const ny=e.y+s*ax*.8;if(free(e.x,ny,e.r)&&free(e.x+dx,ny,e.r)){e.y=ny;moved=true;break;}}}
 if(free(e.x,e.y+dy,e.r)){e.y+=dy;moved=true;}else if(ay>ax*2){for(const s of[1,-1]){const nx=e.x+s*ay*.8;if(free(nx,e.y,e.r)&&free(nx,e.y+dy,e.r)){e.x=nx;moved=true;break;}}}return moved;}
function los(a,b){const d=dist(a,b),n=Math.ceil(d/.3);for(let i=1;i<n;i++){const t=i/n;if(solid(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t))return false;}return true;}
function reveal(){const P=G.P,px=P.x|0,py=P.y|0,rad=8;G.vis.fill(0);
 for(let j=-rad;j<=rad;j++)for(let i=-rad;i<=rad;i++){const x=px+i,y=py+j;if(x<0||y<0||x>=W||y>=H||i*i+j*j>rad*rad)continue;const k=y*W+x;
  if(los(P,{x:x+.5,y:y+.5})||(solid(x,y)&&los(P,{x:x+.5-Math.sign(i)*.55,y:y+.5-Math.sign(j)*.55}))){G.vis[k]=1;G.seen[k]=1;}}}
function step(dt,inp){const P=G.P;if(G.B)return;G.time=(G.time||0)+dt;respawn(dt);G.flowT=(G.flowT||0)-dt;if(G.flowT<=0&&G.E.some(e=>e.hunt)){G.flowT=.5;flowUpdate();}
 let mx=inp.mx||0,my=inp.my||0;const ml=Math.hypot(mx,my);if(ml>.15){const s=Math.min(1,ml)*4.6*dt/ml;moveE(P,mx*s,my*s);G.face=Math.atan2(my,mx);}
 G.revT-=dt;if(G.revT<=0){G.revT=.12;reveal();}
 for(const e of G.E){e.ph+=dt;e.stun-=dt;const d=dist(e,P);if(e.stun>0)continue;
  if(!e.aggro&&d<(e.boss?7:5.5)&&los(e,P)){e.aggro=1;emit({t:'aggro',e});}
  if(!e.aggro&&e.hunt)hunt(e,dt);
  if(e.aggro&&!e.boss&&d>.9){const a=Math.atan2(P.y-e.y,P.x-e.x);moveE(e,Math.cos(a)*2.9*dt,Math.sin(a)*2.9*dt);}
  if(d<(e.boss?1.9:.95)){startBattle(e);return;}}
 for(const o of G.obj.slice()){if(dist(o,P)>.8)continue;
  if(o.t==='brk'){G.obj.splice(G.obj.indexOf(o),1);emit({t:'break',x:o.x,y:o.y,k:o.k});const x=R();if(x<.35){const v=Math.round(rr(3,7)*(1+G.F*.5)*BAL.goldMul);P.gold+=v;emit({t:'gold',x:o.x,y:o.y,v});}else if(x<.43&&P.pot.soin<BAL.potMax){P.pot.soin++;emit({t:'potpick',x:o.x,y:o.y});}}
  if(o.t==='chest'){G.obj.splice(G.obj.indexOf(o),1);const its=[];const n=o.gold?3:2;for(let i=0;i<n;i++){const it=mkItem(G.F,Math.max(o.gold?2:0,rollRar(luck(o.gold?15:6))));its.push(it);addItem(it);}
   const v=Math.round(rr(12,25)*(1+G.F*.6)*(o.gold?3:1)*BAL.goldMul);P.gold+=v;emit({t:'chest',x:o.x,y:o.y,gold:o.gold,its,v});}
  if(o.t==='shrine'&&!o.used){o.used=1;applyShrine(o.k);emit({t:'shrine',k:o.k,m:SHRINES[o.k][0]+' : '+SHRINES[o.k][1],x:o.x,y:o.y});}}
 const onSt=Math.hypot(P.x-G.stairs.x-.5,P.y-G.stairs.y-.5)<.9,nearM=dist(P,G.merch)<1.6;G.ctx=onSt?'down':nearM?'shop':null;}
function applyShrine(k){const P=G.P;if(k==='vie'){P.heroes.forEach(h=>{h.dead=false;h.hp=h.s.mhp;h.en=h.s.men;});}else P.bless=k;if(G.stats)G.stats.use('shrine');}
function addItem(it){const P=G.P;if(P.autoSell!==false&&it.rar===0){const users=P.heroes.filter(h=>canEquip(h,it));if(!users.some(h=>power(it)>power(h.eq[it.s]))){const v=val(it);P.gold+=v;it.sold=v;P.autoGold=(P.autoGold||0)+v;if(G.stats)G.stats.item(it);return false;}}if(P.bag.length>=30){P.gold+=val(it);emit({t:'toast',m:'Sac plein : '+it.n+' vendu automatiquement.'});return false;}P.bag.push(it);if(G.stats)G.stats.item(it);return true;}
function luck(extra){const mf=G.mf*200/(G.mf+200);return mf/BAL.mfDiv+G.F*BAL.floorLuck+(extra||0);}
function descend(){if(G.bossAlive)return false;startFloor(G.F+1);return true;}

/* ---------- combat ---------- */
function mkFoe(k,elite){const f=G.F-1,m=MON[k],hm=(1+BAL.hpScale*f+BAL.hpScale2*f*f)*BAL.monHp,dm=(1+BAL.dmgScale*f+BAL.dmgScale2*f*f)*BAL.monDmg;
 const e={side:'e',k,n:m.n,mhp:Math.round(m.hp*hm*(elite?2.2:1)),atk:m.atk*dm*(elite?1.3:1),def:Math.round(m.def*(1+.12*f)),spd:m.spd*(elite==='rapide'?1.5:1),xp:Math.round(m.xp*(1+.22*f)*(elite?2.5:1)),gold:m.gold,st:{},mods:elite?[elite]:[],elite:!!elite};
 if(elite){e.n=ELITE[elite]+' · '+m.n;if(elite==='blinde'){e.mhp=Math.round(e.mhp*1.4);e.def+=6;}}e.hp=e.mhp;return e;}
function bossDef(){return G.expe&&G.expe.gardien||BOSSES[G.tier()];}
function mkDragon(){const tier=G.tier(),b=bossDef(),f=G.F-1;
 const e={side:'e',k:'boss',boss:1,el:b.el,n:b.n,mhp:Math.round(BAL.bossHp*(1+BAL.bossHpScale*f+BAL.bossHpScale2*f*f)),atk:BAL.bossDmg*(1+BAL.bossDmgScale*f+.01*f*f),def:Math.round(8*(1+.12*f)),spd:10,xp:Math.round(220*(1+.3*f)),gold:60,st:{},mods:[],acts:2,summ:0};
 if(G.expe){e.mhp=Math.round(e.mhp*(G.expe.bossK||1));e.atk*=G.expe.bossA||1;}e.hp=e.mhp;return e;}
function startBattle(pack){const P=G.P;const B=G.B={pack,round:0,q:[],cur:null,foes:[],log:[],over:null,boss:!!pack.boss,turnN:0,sc:{},det:{},lastBy:new Map()};
 if(pack.boss)B.foes.push(mkDragon());else pack.mem.forEach((k,i)=>B.foes.push(mkFoe(k,i===0?pack.elite:null)));
 B.foes.forEach((e,i)=>{e.i=i;intent(e);});
 P.heroes.forEach(h=>{h.st={};h.cdn={};h.guard=0;if(h.dead){h.hp=0;}h.en=Math.min(h.s.men,h.en);});
 B.bless=P.bless;P.bless=null;if(B.bless==='arcane')P.heroes.forEach(h=>h.en=h.s.men);
 emit({t:'battle',boss:B.boss});if(G.stats)G.stats.battleStart(B);newRound();}
const alive=a=>a.filter(u=>!u.dead);
function newRound(){const B=G.B;B.round++;const units=[...alive(G.P.heroes),...alive(B.foes)];
 const q=[];units.forEach(u=>{const sp=u.side==='h'?u.s.spd:u.spd*(u.st.slow>0?.5:1);q.push({u,v:sp+rr(0,4)});if(u.acts===2)q.push({u,v:sp-7+rr(0,3)});});
 q.sort((a,b)=>b.v-a.v);B.q=q.map(o=>o.u);next();}
function next(){const B=G.B;if(B.over)return;
 while(B.q.length){const u=B.q.shift();if(u.dead)continue;
  // début de tour : effets
  if(u.side==='h'){if(u.cls==='guerrier')B.rampart=0;u.guard=0;for(const k in u.cdn)if(u.cdn[k]>0)u.cdn[k]--;u.en=Math.min(u.s.men,u.en+u.s.regen+(B.bless==='arcane'?10:0));}
  tickDots(u);if(u.dead){if(checkEnd())return;continue;}
  for(const k of['taunt','mark','weak','slow','defup'])if(u.st[k]>0)u.st[k]--;
  if(u.st.gel>0||u.st.stun>0){const w=u.st.gel>0?'gelé':'étourdi';u.st.gel=0;u.st.stun=0;if(u.side==='e'&&u.charge){u.charge=null;intent(u);}emit({t:'skip',u,why:w});log(`${u.n} est ${w} et perd son tour.`);if(u.side==='e')intent(u);continue;}
  B.cur=u;B.turnN++;B.wait=u.side==='h'?'hero':'foe';emit({t:'turn',u});return;}
 newRound();}
function tickDots(u){if(u.st.burn>0){const v=Math.max(1,Math.round(u.burnV||3));dmgRaw(u,v,'fire');u.st.burn--;emit({t:'dot',u,v,el:'fire'});}
 if(u.st.poison>0){const v=Math.max(1,Math.round(u.poisV||3));dmgRaw(u,v,'poison');u.st.poison--;if(u.st.poison<=0)u.poisV=0;emit({t:'dot',u,v,el:'poison'});}}
function dmgRaw(u,v,el){if(u.dead)return 0;if(u.st.shield>0){const a=Math.min(u.st.shield,v);u.st.shield-=a;v-=a;if(a)emit({t:'absorb',u,v:a});}
 u.hp-=v;if(G.stats)G.stats.dmg(u,v);if(u.hp<=0){u.hp=0;u.dead=true;emit({t:'die',u});log(`${u.n} ${u.side==='h'?'s’effondre':'est vaincu'} !`);if(u.side==='h'&&G.stats)G.stats.ko(u);}return v;}
function log(m){const B=G.B;if(!B)return;B.log.push(m);if(B.log.length>30)B.log.shift();}
function hit(src,tgt,mult,o={}){if(tgt.dead)return 0;const B=G.B;let raw;
 if(src.side==='h'){const s=src.s;raw=o.mag?(s.mag*1.15+(s.dmin+s.dmax)/2*.6):(rr(s.dmin,s.dmax)+s.str*.8);raw*=mult*(1+s.pdmg/100)*(B.bless==='fureur'?1.3:1);}
 else{raw=src.atk*mult*rr(.85,1.15)*(src.st.weak>0?.75:1)*(src.p2?1.25:1);}
 let crit=false;if(src.side==='h'&&(o.crit||R()*100<src.s.crit)){crit=true;raw*=src.s.cm;}
 if(tgt.st.mark>0)raw*=1.3;
 if(tgt.side==='h'){if(tgt.guard)raw*=.5;if(B.rampart)raw*=.6;raw*=(1-tgt.s.dr)*(1-tgt.s.res/100)*(B.bless==='bastion'?.75:1);}
 const def=tgt.side==='h'?tgt.s.def*(tgt.st.defup>0?1.5:1):tgt.def;raw*=o.mag?80/(80+def*.5):BAL.defK/(BAL.defK+def);
 const v=Math.max(1,Math.round(raw));emit({t:'hit',src,u:tgt,v,crit,el:o.el||'phys'});dmgRaw(tgt,v,o.el);
 if(src.side==='h'&&src.s.ll&&!o.mag){src.hp=Math.min(src.s.mhp,src.hp+v*src.s.ll/100);}
 if(src.side==='e'&&src.mods.includes('vampire'))src.hp=Math.min(src.mhp,src.hp+v*.5);
 if(src.side==='e'&&src.mods.includes('ardent')&&!tgt.dead){tgt.st.burn=2;tgt.burnV=src.atk*.25;}
 if(G.stats)G.stats.hit(src,v);return v;}
function heal(u,v){if(u.dead)return 0;const mx=u.s?u.s.mhp:u.mhp;v=Math.max(0,Math.round(Math.min(v,mx-u.hp)));u.hp=Math.min(mx,u.hp+v);emit({t:'heal',u,v});return v;}
function checkEnd(){const B=G.B;if(!alive(B.foes).length){win();return true;}if(!alive(G.P.heroes).length){lose();return true;}return false;}
function endTurn(){if(checkEnd())return;next();}
/* héros */
function canUse(h,k){const s=SK[k];if(!s||s.c!==h.cls||s.l>h.lvl)return false;if((h.cdn[k]||0)>0)return false;return h.en>=cost(h,k);}
function cost(h,k){if(k==='fendoir'&&h.s.u.freecleave)return 0;return SK[k].cost;}
const rk=(h,k)=>1+.08*(h.rk[k]||0);
function heroAct(k,ti){const B=G.B,h=B.cur;if(!B||B.wait!=='hero'||B.over)return false;
 if(k==='defend'){h.guard=1;h.en=Math.min(h.s.men,h.en+15);emit({t:'act',u:h,n:'Défense'});log(`${h.n} se met en garde.`);B.wait=null;endTurn();return true;}
 if(k==='flee'){if(B.boss)return false;const hs=alive(G.P.heroes).reduce((s,x)=>s+x.s.spd,0)/alive(G.P.heroes).length,fs=alive(B.foes).reduce((s,x)=>s+x.spd,0)/alive(B.foes).length;
  emit({t:'act',u:h,n:'Fuite'});if(R()<BAL.fleeBase+(hs-fs)*.03){B.over='flee';log('Le groupe prend la fuite !');emit({t:'flee'});B.pack.stun=4;afterBattle();return true;}log('La fuite échoue !');B.wait=null;endTurn();return true;}
 if(k.startsWith('item:')){const it=k.slice(5),P=G.P;if((P.pot[it]||0)<=0)return false;const t=P.heroes[ti];if(!t)return false;
  if(it==='phenix'){if(!t.dead)return false;t.dead=false;t.hp=Math.round(t.s.mhp*.35);emit({t:'revive',u:t});}
  else{if(t.dead)return false;if(it==='soin')heal(t,t.s.mhp*BAL.potHeal+BAL.potFlat);else{t.en=Math.min(t.s.men,t.en+50);emit({t:'energy',u:t,v:50});}}
  P.pot[it]--;emit({t:'act',u:h,n:{soin:'Potion de soin',elixir:'Élixir',phenix:'Plume de phénix'}[it]});log(`${h.n} utilise ${{soin:'une potion',elixir:'un élixir',phenix:'une plume de phénix'}[it]} sur ${t.n}.`);if(G.stats)G.stats.use(it);
  B.wait=null;endTurn();return true;}
 if(!canUse(h,k))return false;const s=SK[k],foes=alive(B.foes);let t=null;
 if(s.tg==='foe'){t=B.foes[ti];if(!t||t.dead)return false;}if(s.tg==='ally'){t=G.P.heroes[ti];if(!t||t.dead)return false;}
 h.en-=cost(h,k);if(s.cd)h.cdn[k]=s.cd;emit({t:'act',u:h,n:s.n,k,tgt:t});if(G.stats)G.stats.use(k);
 const R1=rk(h,k);
 switch(k){
  case'frappe':hit(h,t,1*R1);h.en=Math.min(h.s.men,h.en+10);if(h.s.u.burnhit&&!t.dead){t.st.burn=3;t.burnV=h.s.str*.35;}log(`${h.n} frappe ${t.n}.`);break;
  case'provoc':h.st.taunt=2;h.st.defup=2;emit({t:'status',u:h,s:'taunt'});log(`${h.n} provoque les ennemis !`);break;
  case'fendoir':foes.forEach(f=>{hit(h,f,.55*R1);if(h.s.u.burnhit&&!f.dead){f.st.burn=3;f.burnV=h.s.str*.35;}});log(`${h.n} balaie ses ennemis.`);break;
  case'rempart':B.rampart=1;emit({t:'status',u:h,s:'rampart'});log(`${h.n} lève le Rempart : le groupe est protégé.`);break;
  case'execution':hit(h,t,1.8*R1*(t.hp/t.mhp<.3?2:1));log(`${h.n} tente une exécution sur ${t.n}.`);break;
  case'trait':hit(h,t,1*R1,{mag:1,el:'arcane'});h.en=Math.min(h.s.men,h.en+8);log(`${h.n} lance un trait arcanique.`);break;
  case'feu':{const m=.7*R1*(h.s.u.fireup?1.5:1);foes.forEach(f=>{hit(h,f,m,{mag:1,el:'fire'});if(!f.dead){f.st.burn=3;f.burnV=h.s.mag*.3*(h.s.u.fireup?2:1);}});log(`${h.n} déchaîne une boule de feu !`);break;}
  case'soin':heal(t,(t.s.mhp*.3+h.s.mag*1.2)*R1);log(`${h.n} soigne ${t.n}.`);break;
  case'givre':{const ts=h.s.u.iceall?foes:[t];ts.forEach(f=>{hit(h,f,1.4*R1*(h.s.u.iceall?.7:1),{mag:1,el:'ice'});if(!f.dead){if(f.boss){f.st.slow=2;emit({t:'status',u:f,s:'slow'});}else{f.st.gel=1;emit({t:'status',u:f,s:'gel'});if(f.charge){f.charge=null;log(`L’incantation de ${f.n} est brisée !`);}}}});log(`${h.n} projette une lance de givre.`);break;}
  case'barriere':t.st.shield=(t.st.shield||0)+Math.round((t.s.mhp*.25+h.s.mag*2)*R1);emit({t:'status',u:t,s:'shield'});log(`${h.n} protège ${t.n} d’une barrière.`);break;
  case'meteore':foes.forEach(f=>hit(h,f,1.6*R1,{mag:1,el:'fire'}));log(`${h.n} fait pleuvoir des météores !`);break;
  case'tir':hit(h,t,1*R1);h.en=Math.min(h.s.men,h.en+10);log(`${h.n} décoche une flèche.`);break;
  case'poison':hit(h,t,.7*R1);if(!t.dead){t.st.poison=3;t.poisV=Math.min((t.poisV||0)+h.s.str*.45*R1,h.s.str*1.35*R1);emit({t:'status',u:t,s:'poison'});}log(`${h.n} empoisonne ${t.n}.`);break;
  case'volee':{const n=h.s.u.volley6?6:4;for(let i=0;i<n;i++){const a=alive(B.foes);if(!a.length)break;hit(h,pk(a),.5*R1);}log(`${h.n} lâche une volée de flèches.`);break;}
  case'marque':t.st.mark=3;emit({t:'status',u:t,s:'mark'});log(`${h.n} marque ${t.n}.`);break;
  case'fatal':hit(h,t,2.2*R1,{crit:1});log(`${h.n} vise le cœur de ${t.n}.`);break;}
 B.wait=null;endTurn();return true;}
/* ennemis : intentions annoncées */
function pickTarget(e,mode){const hs=alive(G.P.heroes);const tt=hs.find(h=>h.st.taunt>0);if(tt&&mode!=='aoe')return tt;
 if(mode==='weak')return hs.slice().sort((a,b)=>a.hp/a.s.mhp-b.hp/b.s.mhp)[0];if(mode==='back')return hs.slice().sort((a,b)=>a.s.def-b.s.def)[0];
 const w=hs.map(h=>h.cls==='guerrier'?1.6:1);let s=w.reduce((a,b)=>a+b,0),x=R()*s;for(let i=0;i<hs.length;i++){x-=w[i];if(x<=0)return hs[i];}return hs[0];}
function intent(e){if(e.dead)return;const B=G.B;let I;
 if(e.charge){I=e.charge;}
 else switch(e.k){
  case'gob':I=R()<.3?{a:'sneak',n:'Coup bas',m:1.3,tg:pickTarget(e,'weak')}:{a:'atk',n:'Attaque',m:1,tg:pickTarget(e)};break;
  case'sq':I=R()<.22&&!e.st.shield?{a:'bone',n:'Bouclier d’os',self:1}:{a:'atk',n:'Attaque',m:1,tg:pickTarget(e)};break;
  case'ar':I={a:'atk',n:'Tir',m:1,tg:pickTarget(e,'back')};break;
  case'so':I=R()<.25?{a:'atk',n:'Coup de bouclier',m:1.2,tg:pickTarget(e,'weak')}:{a:'atk',n:'Coup d’épée',m:1,tg:pickTarget(e)};break;
  case'ab':I={a:'atk',n:'Carreau',m:1.05,tg:pickTarget(e,'back')};break;
  case'cb':I=R()<.4?{a:'chargeA',n:'Lève sa hache…',next:{a:'smash',n:'Coup de taille',m:1.6,tg:pickTarget(e)}}:{a:'atk',n:'Assaut',m:1,tg:pickTarget(e)};break;
  case'sp':I=R()<.3?{a:'web',n:'Toile',m:.4,tg:pickTarget(e)}:{a:'bite',n:'Morsure venimeuse',m:.8,tg:pickTarget(e)};break;
  case'ch':{const hurt=alive(B.foes).filter(f=>f!==e&&f.hp<f.mhp*.7);I=hurt.length&&R()<.7?{a:'heal',n:'Soin tribal',ally:hurt.sort((a,b)=>a.hp/a.mhp-b.hp/b.mhp)[0]}:{a:'curse',n:'Malédiction',m:.6,tg:pickTarget(e)};break;}
  case'py':I=R()<.55?{a:'chargeA',n:'Incante…',next:{a:'blast',n:'Déflagration',m:1.05,aoe:1}}:{a:'atk',n:'Trait de feu',m:.9,tg:pickTarget(e),el:'fire'};break;
  case'go':I=R()<.45?{a:'chargeA',n:'Lève les poings…',next:{a:'smash',n:'Écrasement',m:1.7,tg:pickTarget(e)}}:{a:'atk',n:'Frappe',m:1,tg:pickTarget(e)};break;
  case'wy':I=R()<.35?{a:'breath',n:'Petit souffle',m:.6,aoe:1,el:'fire'}:{a:'atk',n:'Griffes',m:1,tg:pickTarget(e)};break;
  case'boss':{const p2=e.hp<e.mhp*.5;if(p2&&!e.p2){e.p2=1;emit({t:'enrage',u:e});log(`${e.n.split(',')[0]} entre en furie !`);}
   const r=R(),sm=alive(B.foes).length<2&&e.summ<(p2?2:1);
   const bd=bossDef();
   if(sm&&r<.35)I={a:'summon',n:bd.summN||'Appel des dragonnets'};
   else if(r<.32)I={a:'chargeA',n:bd.charge||'Inspire profondément…',next:{a:'dbreath',n:bd.souffle||('Souffle '+{fire:'de feu',ice:'de givre',poison:'pestilentiel',arcane:'arcanique'}[e.el]),m:1.45,aoe:1,el:e.el}};
   else if(r<.62)I={a:'tail',n:bd.bal||'Balayage de queue',m:.75,aoe:1,stun:.25};
   else I={a:'atk',n:bd.atk||'Griffes',m:1.35,tg:pickTarget(e),el:'phys'};break;}}
 if(I.next&&I.a==='chargeA'){e.charge=null;}
 e.intent=I;}
function foeTurn(){const B=G.B,e=B.cur;if(!B||B.wait!=='foe'||B.over)return false;const I=e.intent||{a:'atk',m:1,tg:pickTarget(e)};B.wait=null;
 let tg=I.tg;if(tg&&tg.dead)tg=pickTarget(e);const tt=alive(G.P.heroes).find(h=>h.st.taunt>0);if(tt&&tg&&!I.aoe)tg=tt;
 emit({t:'act',u:e,n:I.n,tgt:tg,a:I.a});
 switch(I.a){
  case'atk':case'sneak':hit(e,tg,I.m,{el:I.el});if(I.el==='fire'&&!tg.dead){tg.st.burn=2;tg.burnV=e.atk*.25;}log(`${e.n} : ${I.n} sur ${tg.n}.`);break;
  case'bone':e.st.shield=Math.round(e.mhp*.3);emit({t:'status',u:e,s:'shield'});log(`${e.n} s’entoure d’os.`);break;
  case'bite':hit(e,tg,I.m);if(!tg.dead){tg.st.poison=3;tg.poisV=Math.min((tg.poisV||0)+e.atk*.3,e.atk*.6);emit({t:'status',u:tg,s:'poison'});}log(`${e.n} mord ${tg.n}.`);break;
  case'web':hit(e,tg,I.m);if(!tg.dead){tg.st.slow=2;emit({t:'status',u:tg,s:'slow'});}log(`${e.n} englue ${tg.n} dans sa toile.`);break;
  case'heal':{const a=I.ally&&!I.ally.dead?I.ally:e;heal(a,a.mhp*.3);log(`${e.n} soigne ${a.n}.`);break;}
  case'curse':hit(e,tg,I.m);if(!tg.dead){tg.st.weak=2;emit({t:'status',u:tg,s:'weak'});}log(`${e.n} maudit ${tg.n}.`);break;
  case'chargeA':e.charge=I.next;emit({t:'charge',u:e});log(`${e.n} prépare quelque chose…`);break;
  case'blast':case'dbreath':case'breath':alive(G.P.heroes).forEach(h=>{hit(e,h,I.m,{el:I.el||'fire'});if(!h.dead){if((I.el||'fire')==='fire'){h.st.burn=2;h.burnV=e.atk*.22;}if(I.el==='ice'&&R()<.3){h.st.gel=1;emit({t:'status',u:h,s:'gel'});}
   if(I.el==='poison'){h.st.poison=3;h.poisV=Math.min((h.poisV||0)+e.atk*.2,e.atk*.4);}if(I.el==='arcane')h.en=Math.max(0,h.en-20);}});e.charge=null;log(`${e.n} : ${I.n} !`);break;
  case'smash':hit(e,tg,I.m);if(!tg.dead&&R()<.35){tg.st.stun=1;emit({t:'status',u:tg,s:'stun'});}e.charge=null;log(`${e.n} écrase ${tg.n} !`);break;
  case'tail':alive(G.P.heroes).forEach(h=>{hit(e,h,I.m);if(!h.dead&&R()<I.stun){h.st.stun=1;emit({t:'status',u:h,s:'stun'});}});log(`${e.n} balaie le groupe de sa queue.`);break;
  case'summon':{e.summ++;const n=e.p2?2:1;const sk=bossDef().summ||'wy';for(let i=0;i<n+1;i++){const w=mkFoe(sk);w.xp=Math.round(w.xp*.4);w.i=B.foes.length;B.foes.push(w);intent(w);emit({t:'summon',u:w});}log(`${e.n.split(',')[0]} : ${(bossDef().summN||'appel des dragonnets').toLowerCase()} !`);break;}}
 intent(e);endTurn();return true;}
function win(){const B=G.B,P=G.P;B.over='win';if(G.expe)G.expe.tues+=B.foes.length;const RE=B.pack&&B.pack.re;const xp=Math.round(B.foes.reduce((s,f)=>s+f.xp,0)*BAL.xpMul*(RE?.7:1));
 const gold=Math.round(B.foes.reduce((s,f)=>s+f.gold*rr(1.5,3)*(1+G.F*.6),0)*(1+G.gf/100)*BAL.goldMul*(RE?.5:1));P.gold+=gold;
 const its=[];const cls=()=>pk(Object.keys(CLASSES));
 B.foes.forEach(f=>{if(f.boss)return;const ch=(f.elite?1:BAL.dropItem)*(RE?.5:1);if(R()<ch)its.push(mkItem(G.F,rollRar(luck(f.elite?BAL.eliteLuck:0)),null,cls()));});
 if(B.boss){its.push(mkItem(G.F,3,null,cls()));its.push(mkItem(G.F,2,null,cls()));G.bossAlive=false;P.bossDone=G.F;P.pot.phenix=(P.pot.phenix||0)+1;if(G.stats)G.stats.boss(true);}
 if(R()<.12&&P.pot.soin<BAL.potMax)P.pot.soin++;
 its.forEach(addItem);B.reward={xp,gold,its};P.wins++;const lv0=P.lvl;
 const tot=P.heroes.reduce((s,h)=>s+(B.sc[h.cls]||0),0);B.reward.per=P.heroes.map(h=>{const N=P.heroes.length,base=xp*.45*(h.dead?.5:1),perf=tot>0?xp*.55*N*(B.sc[h.cls]||0)/tot:xp*.55;const n=Math.max(1,Math.round(base+perf)),l0=h.lvl;gainXPh(h,n);return{cls:h.cls,n:h.n,xp:n,lvl:h.lvl>l0?h.lvl:0,det:B.det[h.cls]||{}};});
 syncLvl();B.reward.lvl=B.reward.per.some(p=>p.lvl)?Math.max(...B.reward.per.map(p=>p.lvl)):0;
 G.E.splice(G.E.indexOf(B.pack),1);afterBattle();emit({t:'win',reward:B.reward});}
function lose(){const B=G.B,P=G.P;B.over='lose';P.wipes++;G.lostGold=Math.round(P.gold*.25);P.gold-=G.lostGold;if(G.stats)G.stats.wipe(B);emit({t:'lose'});}
function afterBattle(){const P=G.P;P.heroes.forEach(h=>{if(h.dead){h.dead=false;h.hp=1;}h.hp=Math.min(h.s.mhp,h.hp+h.s.mhp*BAL.postHeal);h.en=h.s.men;h.st={};h.guard=0;});}
function closeBattle(){const B=G.B;G.B=null;if(B&&B.over==='lose'){P_heal();startFloor(G.F);}}
function P_heal(){G.P.heroes.forEach(h=>{h.dead=false;h.hp=h.s.mhp;h.en=h.s.men;});}
function gainXPh(h,n){h.xp+=n;while(h.xp>=xpNextH(h)){h.xp-=xpNextH(h);h.lvl++;h.spts++;calcAll();h.hp=h.s.mhp;h.en=h.s.men;emit({t:'lvl',h,l:h.lvl,news:CLS_SK[h.cls].filter(k=>SK[k].l===h.lvl)});}}
function gainXP(n){G.P.heroes.forEach(h=>gainXPh(h,Math.round(n/G.P.heroes.length)));syncLvl();}
/* aperçu de dégâts pour l'interface */
function preview(e){const I=e.intent;if(!I)return'';const est=m=>Math.round(e.atk*m*(e.p2?1.25:1));
 if(I.a==='chargeA')return I.n+' → '+I.next.n+(I.next.aoe?' (tout le groupe)':'');
 if(I.aoe)return`${I.n} · ~${est(I.m)} à tout le groupe`;if(I.self)return I.n;if(I.a==='heal')return`${I.n} → ${I.ally&&!I.ally.dead?I.ally.n:'?'}`;
 const tt=alive(G.P.heroes).find(h=>h.st.taunt>0);const tg=tt||I.tg;return`${I.n} → ${tg&&!tg.dead?tg.n:'?'} · ~${est(I.m)}`;}

/* ---------- inventaire ---------- */
function equip(h,it){const P=G.P,i=P.bag.indexOf(it);if(i<0||!canEquip(h,it))return false;const old=h.eq[it.s];P.bag.splice(i,1);if(old)P.bag.push(old);h.eq[it.s]=it;calcAll();return true;}
function unequip(h,s){const P=G.P;if(!h.eq[s]||P.bag.length>=30)return;P.bag.push(h.eq[s]);h.eq[s]=null;calcAll();}
const UPMAX=5;function upCost(it){if(!it)return 0;return Math.round((38+it.il*11)*(1+(it.up||0)*.75)*(1+it.rar*.35));}
function upgrade(h,slot){const P=G.P,it=h.eq[slot];if(!it||(it.up||0)>=UPMAX)return false;const c=upCost(it);if(P.gold<c)return false;P.gold-=c;it.up=(it.up||0)+1;
 if(it.dmin!==undefined){it.dmin=Math.ceil(it.dmin*1.085);it.dmax=Math.ceil(it.dmax*1.085);}if(it.def)it.def=Math.round(it.def*1.1+.5);it.aff.forEach(a=>{a.v=Math.max(a.v+(a.v>=6?1:0),Math.round(a.v*1.065));});
 it.n=it.n.replace(/ \+\d$/,'')+' +'+it.up;calcAll();return true;}
function sell(it){const P=G.P,i=P.bag.indexOf(it);if(i<0)return 0;P.bag.splice(i,1);const v=val(it);P.gold+=v;return v;}
function sellJunk(){let g=0;G.P.bag.slice().forEach(it=>{if(it.rar<2)g+=sell(it);});return g;}
const prices=()=>({soin:18+G.F*6,elixir:25+G.F*7,phenix:60+G.F*15,gamble:100+G.F*35});
function buy(k){const P=G.P,p=prices()[k];if(P.gold<p)return false;if(k==='soin'&&P.pot.soin>=BAL.potMax)return false;P.gold-=p;P.pot[k]=(P.pot[k]||0)+1;return true;}
function gamble(slot,cls){const P=G.P,p=prices().gamble;if(P.gold<p||P.bag.length>=30)return null;P.gold-=p;let r=rollRar(luck(14));if(r<1)r=1;const it=mkItem(G.F+1,r,slot,cls);P.bag.push(it);if(G.stats)G.stats.item(it);return it;}
function talent(h,k){if(h.spts<=0||SK[k].c!==h.cls||SK[k].l>h.lvl)return false;h.rk[k]=(h.rk[k]||0)+1;h.spts--;syncLvl();return true;}

function newGame(party,seed){if(seed!==undefined)R=mulberry(seed);else R=Math.random;G.P=party||newParty();G.ev=[];G.time=0;calcAll();if(!party)G.P.heroes.forEach(h=>{h.hp=h.s.mhp;h.en=h.s.men;});startFloor(G.P.floor||1);}
Object.assign(G,{xpNextH,syncLvl,upgrade,upCost,UPMAX,startBattle,newGame,step,startFloor,descend,heroAct,foeTurn,closeBattle,canUse,cost,skillsOf,preview,equip,unequip,sell,sellJunk,buy,gamble,talent,calcAll,power,val,xpNext,prices,canEquip,
 at,solid,los,dist,mkItem,rollRar,alive,setUID:n=>{UID=n;},getUID:()=>UID,
 RAR,SLOTS,AFF,UNIQ,MON,BIOMES,BOSSES,SHRINES,ELITE,CLASSES,SK,CLS_SK});
/* ---------- Mode expédition (Le Trône de Braise) ---------- */
// cfg : { F0, etages, tier, combat?, groupe:[{cls,n,lvl,arme:{dmin,dmax},def,aff:[[k,v]],rar,heros?}], pot }
G.tier=()=>G.expe?G.expe.tier:Math.floor((G.F-1)/4)%4;
G.lair=()=>G.expe?(!G.expe.combat&&G.F>=G.expe.dernier):G.F%4===0;
function partieExpedition(cfg){
 const P=newParty();P.floor=cfg.F0;P.best=cfg.F0;P.gold=0;P.pot={soin:Math.max(4,cfg.pot||0),elixir:1,phenix:1};P.story=['prologue','biome0','biome1','biome2','biome3','pre0','pre1','pre2','pre3','post0','post1','post2','post3','echo','epilogue'];
 P.autoSell=true;
 P.heroes=cfg.groupe.map(g=>{const h=mkHero(g.cls);h.n=g.n;h.t=g.t||h.t;h.lvl=Math.max(1,g.lvl|0);h.xp=Math.round((g.xpf||0)*xpNextH(h));h.heros=!!g.heros;
  const il=Math.max(1,g.lvl|0);
  if(g.arme){const it=baseItem('arme',g.cls,il,Math.min(5,Math.floor(il/3)));it.rar=g.rar||0;it.dmin=Math.max(1,Math.round(g.arme.dmin));it.dmax=Math.max(it.dmin+1,Math.round(g.arme.dmax));it.n=g.arme.n||it.n;it.tdb=1;h.eq.arme=it;}
  else h.eq.arme=mkItem(il,g.rar??1,'arme',g.cls);
  if(g.def!==undefined){const it=baseItem('armure',g.cls,il,Math.min(5,Math.floor(il/3)));it.rar=g.rar||0;it.def=Math.max(1,Math.round(g.def));it.n=g.armureN||it.n;it.tdb=1;h.eq.armure=it;}
  else h.eq.armure=mkItem(il,g.rar??1,'armure',g.cls);
  if(g.aff&&g.aff.length){const it=baseItem('bijou',g.cls,il,0);it.rar=g.rar||1;it.n=g.bijouN||'Parure de la maison';it.aff=g.aff.filter(([k])=>AFF[k]).map(([k,v])=>({k,v:Math.round(v)}));it.tdb=1;h.eq.bijou=it;}
  else h.eq.bijou=mkItem(il,g.rar??1,'bijou',g.cls);
  Object.values(h.eq).forEach(it=>{if(it)it.tdb=1;});// l'équipement de départ n'est pas du butin
  // points de talent des niveaux déjà acquis, répartis comme le ferait un joueur attentif
  h.rk={};h.spts=h.lvl-1;const ord={guerrier:['fendoir','frappe','rempart','provoc','execution'],mage:['feu','soin','givre','trait','meteore','barriere'],rodeuse:['volee','tir','poison','marque','fatal']}[g.cls];
  for(let i=0,k=0;h.spts>0&&k<200;k++){const t=ord[(i++%3)<2?0:1+Math.floor(i/3)%(ord.length-1)];if(SK[t]&&SK[t].c===g.cls&&SK[t].l<=h.lvl){h.rk[t]=(h.rk[t]||0)+1;h.spts--;}}
  return h;});
 return P;}
const MON0={},W0=BIOMES.map(b=>Object.assign({},b.w));for(const k in MON)MON0[k]=MON[k].n;
function themeExpedition(cfg){for(const k in MON0)MON[k].n=MON0[k];BIOMES.forEach((b,i)=>b.w=Object.assign({},W0[i]));
 if(cfg.noms)for(const k in cfg.noms)if(MON[k])MON[k].n=cfg.noms[k];
 if(cfg.pool){const w=Object.assign({},cfg.pool);if(!Object.keys(w).some(k=>MON[k]&&MON[k].f<=cfg.F0))Object.assign(w,{sq:1,gob:1});else{w.sq=w.sq||.3;w.gob=w.gob||.3;}BIOMES[cfg.tier||0].w=w;}}
function lancerExpedition(cfg){themeExpedition(cfg);G.expe=Object.assign({dernier:cfg.F0+(cfg.etages||1)-1},cfg);G.expe.debut={gold:0,lv:{}};const P=partieExpedition(cfg);newGame(P);
 P.heroes.forEach(h=>{G.expe.debut.lv[h.n]=h.lvl;});G.merch={x:-99,y:-99};G.expe.tues=0;
 if(cfg.combat){const pack={pack:1,mem:cfg.combat.mem,boss:cfg.combat.boss?1:0,elite:cfg.combat.elite||null,x:P.x+1,y:P.y,arena:1};startBattle(pack);}}
function bilanExpedition(resultat){const P=G.P,E=G.expe,h=P.heroes.find(x=>x.heros)||P.heroes[0];
 const its=P.bag.filter(it=>!it.tdb&&!it.sold).concat(P.heroes.flatMap(x=>Object.values(x.eq).filter(it=>it&&!it.tdb)));
 return{resultat,or:Math.max(0,P.gold),pot:P.pot.soin,lvl:h.lvl,xpf:h.xp/xpNextH(h),tues:E.tues||0,objets:its.map(it=>({s:it.s,rar:it.rar,il:it.il,n:it.n})),etage:G.F};}
Object.assign(G,{lancerExpedition,bilanExpedition,mkHero,baseItem});
root.VD=G;
})(typeof window!=='undefined'?window:globalThis);
