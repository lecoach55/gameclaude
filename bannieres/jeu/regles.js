'use strict';
/* =========================================================
   BANNIÈRES & SORTILÈGES — règles de la carte d'aventure (sans DOM, testable sous Node)
   Les interactions passent par HOOK (interface ou robot) : HOOK.choix, HOOK.message, HOOK.combat, HOOK.niveau, HOOK.echange, HOOK.ville, HOOK.anim
   ========================================================= */
var G=null,R=null;
var HOOK={choix:async(j,t,x,opts)=>0,message:async()=>{},combat:null,niveau:async(h,offres)=>0,echange:async()=>{},ville:async()=>{},anim:async()=>{},journal:()=>{},maj:()=>{}};
var COULEURS=[{nom:'Rouge',c:'#c8332b',f:'#7a1712'},{nom:'Bleu',c:'#2f6bd1',f:'#173a7a'},{nom:'Vert',c:'#3a9a3a',f:'#1c5a1c'},{nom:'Violet',c:'#8a3fc0',f:'#4a1d6e'}];

function idx(x,y){return y*G.carte.N+x;}
function xy(i){return[i%G.carte.N,(i/G.carte.N)|0];}
function dansC(x,y){return x>=0&&y>=0&&x<G.carte.N&&y<G.carte.N;}
function alea(){return R.f();}
function aleaI(a,b){return R.i(a,b);}

// ---------- création de partie ----------
function nouvellePartie(o){
 const graine=o.graine||(Date.now()%1e9);
 const gen=genererCarte({graine,taille:o.taille,joueurs:o.joueurs,eau:o.eau,monstres:o.monstres});
 R=creeRng(graine*7+3);
 G={v:1,graine,jour:1,opts:o,carte:gen.carte,objs:gen.objs,heros:[],joueurs:[],courant:0,hid:1,log:[],fini:null,stats:{combats:0}};
 o.joueurs.forEach((p,k)=>{G.joueurs.push({id:k,nom:p.nom||COULEURS[k].nom,coul:k,fac:p.fac,humain:!!p.humain,res:{or:p.humain?7500:7500,bois:20,minerai:20,mercure:5,soufre:5,cristal:5,gemmes:5},vu:new Uint8Array(G.carte.N*G.carte.N),elim:false,sansVille:0,taverne:[],ia:p.humain?null:{niveau:o.difficulte==null?1:o.difficulte}});});
 if(o.difficulte===0)G.joueurs.forEach(p=>{if(!p.humain)for(const r of RES)p.res[r]=Math.round(p.res[r]*.6);});
 if(o.difficulte===2)G.joueurs.forEach(p=>{if(p.humain)for(const r of RES)p.res[r]=Math.round(p.res[r]*.7);});
 // villes
 for(const ob of G.objs)if(ob.t==='ville')initVille(ob);
 for(const ob of G.objs)if(ob.t==='monstre')ob.n0=ob.n;
 // héros de départ
 for(const p of G.joueurs){const v=G.objs.find(b=>b.t==='ville'&&b.prop===p.id);const cl=FAC[p.fac].classes[R.i(0,1)];const h=creerHeros(cl,p.id,v.x,v.y,true);revele(p.id,v.x,v.y,9);tavernePiocher(p);}
 index();for(const h of G.heros)revele(h.j,h.x,h.y,visionH(h));
 return G;}

function initVille(v){const f=v.fac;v.nom=nomVille(v);v.bat={conseil:1,fort:1,hab1:1};if(v.prop>=0){v.bat.taverne=1;}else{v.bat.hab2=1;if(alea()<.5)v.bat.hab3=1;}
 v.dispo=[0,0,0,0,0,0,0];v.garn=[null,null,null,null,null,null,null];v.construit=false;
 // guilde : sorts tirés au hasard
 v.guilde=[[],R.melange(SORTS_NIV[1].slice()).slice(0,3),R.melange(SORTS_NIV[2].slice()).slice(0,2),R.melange(SORTS_NIV[3].slice()).slice(0,2)];
 croissance(v,true);
 if(v.prop<0){// garnison neutre
  const val=v.garnisonInit||2500;const cr=FAC[f].crea;let rest=val;for(let k=0;k<3;k++){const c=CRE[cr[Math.min(6,k*2+ (alea()<.5?0:1))]];const n=Math.max(1,Math.round(rest/3/c.val*1.2));v.garn[k*2]={c:c.id,n};}}
}
var NOMS_VILLES=['Montclair','Valombre','Roche-Noire','Aubeterre','Brumecombe','Ormeval','Pierrelune','Castelfort','Sombreval','Hautepierre','Clairefontaine','Vergerac','Morteaux','Belcastel','Lirandel','Fendebrume','Corbelin','Aigueblanche','Tourmaline','Grisemont'];
function nomVille(v){const pris=new Set(G.objs.filter(b=>b.t==='ville'&&b.nom).map(b=>b.nom));const l=NOMS_VILLES.filter(n=>!pris.has(n));return l.length?R.pick(l):'Ville '+v.id;}

function creerHeros(classe,j,x,y,depart,nom){const C=CLASSES[classe];const pris=new Set(G.heros.map(h=>h.nom));let noms=HEROS_NOMS[classe].filter(n=>!pris.has(n));if(!noms.length)noms=HEROS_NOMS[classe];
 const h={id:G.hid++,nom:nom||R.pick(noms),classe,fac:C.fac,j,x,y,niv:1,xp:0,att:C.base[0],def:C.base[1],pou:C.base[2],con:C.base[3],comp:Object.assign({},C.comp),sorts:C.sorts.slice(),arts:[],armee:[null,null,null,null,null,null,null],visites:{},bonus:{},portrait:R.i(0,9999)};
 const cr=FAC[C.fac].crea;h.armee[0]={c:cr[0],n:R.i(12,22)};h.armee[1]={c:cr[1],n:R.i(4,8)};if(depart)h.armee[2]={c:cr[2],n:R.i(1,3)};
 h.mana=manaMax(h);h.mp=mvtMax(h);G.heros.push(h);return h;}

// ---------- héros : caractéristiques ----------
function bonusArts(h,k){let s=0;for(const a of h.arts)s+=(ARTS[a].b[k]||0);return s;}
function statH(h,k){return h[k]+bonusArts(h,k);}
function manaMax(h){const s=h.comp.sagesse||0;return Math.round(statH(h,'con')*10*(1+(s>=2?.1:0)+(s>=3?.1:0)));}
function visionH(h){return 5+(h.comp.eclaireur||0)+bonusArts(h,'vision');}
function moralH(h){return(h.comp.meneur||0)+bonusArts(h,'moral')+(h.bonus.fontaine?1:0);}
function chanceH(h){return(h.comp.chance||0)+bonusArts(h,'chance')+(h.bonus.fontaine?1:0);}
function vitLente(armee){let v=99;for(const s of armee)if(s)v=Math.min(v,CRE[s.c].vit);return v===99?5:v;}
function mvtMax(h){const v=Math.min(11,vitLente(h.armee));return Math.round((1300+70*(v-3))*(1+.1*(h.comp.logistique||0)))+bonusArts(h,'mvt')+(h.bonus.ecurie?400:0);}
function coutCase(h,i){if(G.carte.route[i])return 75;const t=TER[G.carte.ter[i]];let c=TER_COUT[t];if(t===FAC[h.fac].ter)return 100;const p=h.comp.pistage||0;return Math.round(100+(c-100)*(1-.25*p));}
function forceArmee(armee,h){let s=0;for(const x of armee)if(x)s+=x.n*CRE[x.c].val;if(h)s*=1+.05*(statH(h,'att')+statH(h,'def'))+.03*statH(h,'pou')*Math.min(1,h.mana/10);return s;}
function nbPiles(a){return a.filter(Boolean).length;}

// ---------- index ----------
function index(){const N=G.carte.N;G.occ=new Int32Array(N*N);G.oi={};G.zoc=new Int32Array(N*N);G.hpos=new Int32Array(N*N);
 for(const o of G.objs){G.oi[o.id]=o;G.occ[idx(o.x,o.y)]=o.id;}
 for(const o of G.objs)if(o.t==='monstre')for(const [dx,dy] of DIR8){const x=o.x+dx,y=o.y+dy;if(dansC(x,y)&&!G.zoc[idx(x,y)])G.zoc[idx(x,y)]=o.id;}
 for(const h of G.heros)G.hpos[idx(h.x,h.y)]=h.id;}
function heroPar(id){return G.heros.find(h=>h.id===id);}
function passable(i){return G.carte.ter[i]!==EAU&&!G.carte.obs[i];}
function villesDe(j){return G.objs.filter(o=>o.t==='ville'&&o.prop===j);}
function herosDe(j){return G.heros.filter(h=>h.j===j);}
function villeSous(h){const o=G.oi[G.occ[idx(h.x,h.y)]];return o&&o.t==='ville'?o:null;}

// ---------- brouillard ----------
function revele(j,x,y,r){const p=G.joueurs[j];const N=G.carte.N;for(let yy=Math.max(0,y-r);yy<=Math.min(N-1,y+r);yy++)for(let xx=Math.max(0,x-r);xx<=Math.min(N-1,x+r);xx++)if((xx-x)*(xx-x)+(yy-y)*(yy-y)<=r*r+r)p.vu[yy*N+xx]=1;}

// ---------- chemins ----------
// Renvoie {ch:[cases], cout:[cumuls]} ou null. Les objets, héros et zones de contrôle ne sont franchissables qu'en destination.
function chemin(h,dest,opts={}){const N=G.carte.N,dep=idx(h.x,h.y);if(dest===dep)return null;const p=G.joueurs[h.j];const vu=opts.toutVoir?null:p.vu;
 if(vu&&!vu[dest])return null;
 const dx0=dest%N,dy0=(dest/N)|0;
 const destMonstre=G.occ[dest]&&G.oi[G.occ[dest]].t==='monstre';
 const bloque=i=>{if(i===dest)return!(passable(i)||G.occ[i]||G.hpos[i]);if(!passable(i))return true;if(vu&&!vu[i])return true;if(G.occ[i]||G.hpos[i])return true;if(G.zoc[i])return!(destMonstre&&Math.max(Math.abs(i%N-dx0),Math.abs(((i/N)|0)-dy0))===1);return false;};
 if(bloque(dest))return null;
 const g=new Float64Array(N*N).fill(Infinity),par=new Int32Array(N*N).fill(-1);const T=Tas();g[dep]=0;T.push(dep,0);
 while(!T.vide()){const i=T.pop();if(i===dest)break;const x=i%N,y=(i/N)|0;
  for(const [dx,dy] of DIR8){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=N||ny>=N)continue;const j=ny*N+nx;if(bloque(j))continue;
   const c=(coutCase(h,j)+coutCase(h,i))/2*(dx&&dy?1.414:1);const ng=g[i]+c;if(ng<g[j]-1e-9){g[j]=ng;par[j]=i;T.push(j,ng+Math.max(Math.abs(nx-dx0),Math.abs(ny-dy0))*75);}}}
 if(g[dest]===Infinity)return null;const ch=[];for(let i=dest;i!==dep;i=par[i])ch.push(i);ch.reverse();
 const cout=[];let s=0,prev=dep;for(const i of ch){const [ax,ay]=xy(prev),[bx,by]=xy(i);s+=Math.round((coutCase(h,i)+coutCase(h,prev))/2*(ax!==bx&&ay!==by?1.414:1));cout.push(s);prev=i;}
 return{ch,cout};}
// cartes de distances (IA) : coût depuis le héros vers toutes les cases (objets en destination)
function distances(h){const N=G.carte.N,dep=idx(h.x,h.y);const g=new Float64Array(N*N).fill(Infinity);const T=Tas();g[dep]=0;T.push(dep,0);
 while(!T.vide()){const i=T.pop();if(i!==dep&&(G.occ[i]||G.hpos[i]))continue;const zo=i!==dep&&G.zoc[i];const x=i%N,y=(i/N)|0;
  for(const [dx,dy] of DIR8){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=N||ny>=N)continue;const j=ny*N+nx;if(zo&&!(G.occ[j]&&G.oi[G.occ[j]].t==='monstre'))continue;if(!passable(j)&&!G.occ[j])continue;if(!passable(j)&&G.occ[j]&&G.oi[G.occ[j]].t!=='ville')continue;
   const c=(coutCase(h,j)+coutCase(h,i))/2*(dx&&dy?1.414:1);if(g[i]+c<g[j]){g[j]=g[i]+c;T.push(j,g[j]);}}}
 return g;}

// ---------- déplacement ----------
async function deplacer(h,ch){// suit le chemin tant qu'il reste du mouvement ; renvoie true si le héros a bougé
 let bouge=false;const N=G.carte.N;
 for(let k=0;k<ch.length;k++){const i=ch[k];const [x,y]=xy(i);const prev=idx(h.x,h.y);const c=Math.round((coutCase(h,i)+coutCase(h,prev))/2*(x!==h.x&&y!==h.y?1.414:1));
  if(h.mp<c&&!(h.mp>=mvtMax(h)*0.99))break; // pas assez de mouvement (on autorise toujours le premier pas d'une journée)
  const occ=G.occ[i],hid=G.hpos[i];
  if(hid&&hid!==h.id){const o=heroPar(hid);h.mp=Math.max(0,h.mp-c);if(o.j===h.j)await HOOK.echange(h,o);else await combatHeros(h,o);return true;}
  if(occ&&G.oi[occ].t==='monstre'){h.mp=Math.max(0,h.mp-c);const r=await combatMonstre(h,G.oi[occ]);if(r&&heroPar(h.id)){poserHeros(h,x,y);}return true;}
  if(occ&&G.oi[occ].t==='ville'&&G.oi[occ].prop!==h.j&&!memeEquipe(G.oi[occ].prop,h.j)){h.mp=Math.max(0,h.mp-c);const r=await assiegerVille(h,G.oi[occ]);if(r&&heroPar(h.id))poserHeros(h,x,y);if(r&&heroPar(h.id))await HOOK.ville(G.oi[occ],h);return true;}
  h.mp=Math.max(0,h.mp-c);await HOOK.anim('pas',h,prev,i);poserHeros(h,x,y);bouge=true;revele(h.j,x,y,visionH(h));
  // les gardiens attaquent d'abord
  let garde=0;while(G.zoc[i]&&G.oi[G.zoc[i]]&&garde++<8){const ok=await combatMonstre(h,G.oi[G.zoc[i]],true);if(!ok||!heroPar(h.id))return true;}
  if(G.zoc[i]||occ||garde){if(occ&&G.oi[occ])await visiter(h,G.oi[occ]);return true;}
 }
 return bouge;}
function memeEquipe(a,b){return a===b;}
function poserHeros(h,x,y){G.hpos[idx(h.x,h.y)]=0;h.x=x;h.y=y;G.hpos[idx(x,y)]=h.id;}
function retirerObjet(o){G.objs=G.objs.filter(b=>b!==o);G.occ[idx(o.x,o.y)]=0;delete G.oi[o.id];if(o.t==='monstre')index();}

// ---------- visites ----------
function gain(j,res,q){G.joueurs[j].res[res]=(G.joueurs[j].res[res]||0)+q;}
function txtRes(c){return Object.keys(c).filter(r=>c[r]).map(r=>c[r]+' '+RES_NOM[r].toLowerCase()).join(', ');}
async function visiter(h,o){const p=G.joueurs[h.j];
 switch(o.t){
 case 'res':{gain(h.j,o.res,o.q);retirerObjet(o);await HOOK.anim('ramasse',h,o);HOOK.journal(h.j,`${h.nom} ramasse ${o.q} ${RES_NOM[o.res].toLowerCase()}.`);break;}
 case 'coffre':{const v=aleaI(2,4)*500;const k=await HOOK.choix(h.j,'Coffre au trésor',`Vous trouvez un coffre. Gardez-vous l’or ou le distribuez-vous aux paysans contre leur savoir ?`,[`${v} or`,`${v-500} expérience`],{ia:h=>0});
  retirerObjet(o);if(k===0)gain(h.j,'or',v);else await gagnerXp(h,v-500);await HOOK.anim('ramasse',h,o);break;}
 case 'artefact':{retirerObjet(o);h.arts.push(o.art);await HOOK.message(h.j,'Artefact',`${h.nom} trouve : ${ARTS[o.art].nom} (${txtBonus(ARTS[o.art].b)}).`,{art:o.art});break;}
 case 'mine':{if(o.prop!==h.j){o.prop=h.j;await HOOK.message(h.j,MINE_NOM[o.res],`${MINE_NOM[o.res]} passe sous votre bannière : +${MINE_PROD[o.res]} ${RES_NOM[o.res].toLowerCase()} par jour.`,{res:o.res});}break;}
 case 'ville':{if(o.prop===h.j){apprendreSorts(h,o);if(o.bat.guilde1)h.mana=Math.max(h.mana,manaMax(h));await HOOK.ville(o,h);}break;}
 case 'bat':await visiterBat(h,o);break;
 }
 HOOK.maj();}
function txtBonus(b){const n={att:'Attaque',def:'Défense',pou:'Puissance',con:'Connaissance',mvt:'Mouvement',chance:'Chance',moral:'Moral',vision:'Vision'};return Object.keys(b).map(k=>'+'+b[k]+' '+n[k]).join(', ');}
async function visiterBat(h,o){const B=BATIMENTS_CARTE[o.b];const deja=h.visites[o.id];
 switch(o.b){
 case 'moulin':{if(o.pris){await HOOK.message(h.j,B.nom,'Le meunier n’a plus rien à offrir cette semaine.');break;}const r=R.pick(['mercure','soufre','cristal','gemmes','bois','minerai']);const q=r==='bois'||r==='minerai'?aleaI(5,8):aleaI(3,5);gain(h.j,r,q);o.pris=1;await HOOK.message(h.j,B.nom,`Le meunier vous offre ${q} ${RES_NOM[r].toLowerCase()}.`,{res:r});break;}
 case 'puits':{if(h.bonus.puits){await HOOK.message(h.j,B.nom,'Vous avez déjà bu aujourd’hui.');break;}h.mana=Math.max(h.mana,manaMax(h));h.bonus.puits=1;await HOOK.message(h.j,B.nom,'L’eau claire restaure votre mana.');break;}
 case 'autel':{if(deja){await HOOK.message(h.j,B.nom,'Les anciens vous ont déjà béni.');break;}const k=['att','def','pou','con'][o.stat||0];h[k]++;h.visites[o.id]=1;await HOOK.message(h.j,B.nom,`+1 ${STAT_NOM[o.stat||0]}.`);break;}
 case 'pierre':{if(deja){await HOOK.message(h.j,B.nom,'Vous avez déjà lu ces runes.');break;}h.visites[o.id]=1;await HOOK.message(h.j,B.nom,'Les runes vous enseignent : +1000 expérience.');await gagnerXp(h,1000);break;}
 case 'arbre':{if(deja){await HOOK.message(h.j,B.nom,'L’arbre reste muet.');break;}h.visites[o.id]=1;await HOOK.message(h.j,B.nom,'Le savoir de l’arbre vous élève au niveau suivant.');await gagnerXp(h,Math.max(0,xpPourNiveau(h.niv+1)-h.xp));break;}
 case 'tour':{revele(h.j,o.x,o.y,14);await HOOK.message(h.j,B.nom,'Du haut de la tour, les environs se dévoilent.');break;}
 case 'sanctuaire':{if(deja){await HOOK.message(h.j,B.nom,'Les prêtres n’ont plus rien à vous apprendre.');break;}h.visites[o.id]=1;if(!o.sort)o.sort=R.pick(SORTS_NIV[1].concat(SORTS_NIV[2]));if(!h.sorts.includes(o.sort))h.sorts.push(o.sort);await HOOK.message(h.j,B.nom,`Vous apprenez le sort « ${SORTS[o.sort].nom} ».`);break;}
 case 'ecurie':{h.bonus.ecurie=1;h.mp+=400;await HOOK.message(h.j,B.nom,'Des chevaux frais : +400 mouvement jusqu’à la fin de la semaine.');break;}
 case 'feu':{const r=R.pick(['bois','minerai','mercure','soufre','cristal','gemmes']);const q=aleaI(4,6),orr=aleaI(4,6)*100;gain(h.j,r,q);gain(h.j,'or',orr);retirerObjet(o);await HOOK.message(h.j,B.nom,`Parmi les cendres : ${orr} or et ${q} ${RES_NOM[r].toLowerCase()}.`);break;}
 case 'fontaine':{h.bonus.fontaine=1;await HOOK.message(h.j,B.nom,'+1 moral et +1 chance pour votre prochain combat.');break;}
 case 'habitation':{const c=CRE[o.cre];if(!o.dispo){await HOOK.message(h.j,`Habitation : ${c.pl}`,'Aucune créature à recruter cette semaine.');break;}
  const maxN=Math.min(o.dispo,peutPayer(G.joueurs[h.j].res,c.cout));
  const n=await HOOK.recruter?await HOOK.recruter(h,o,c,maxN):maxN;if(n>0&&ajouterTroupe(h.armee,o.cre,n)){payer(h.j,c.cout,n);o.dispo-=n;}break;}
 }}

// ---------- économie ----------
function peutPayer(res,cout,n=1){let m=1e9;for(const r in cout)m=Math.min(m,Math.floor((res[r]||0)/(cout[r]*1)));return Math.max(0,Math.min(m,1e9));}
function aDeQuoi(res,cout){for(const r in cout)if((res[r]||0)<cout[r])return false;return true;}
function payer(j,cout,n=1){for(const r in cout)G.joueurs[j].res[r]-=cout[r]*n;}
function ajouterTroupe(armee,c,n){for(const s of armee)if(s&&s.c===c){s.n+=n;return true;}const k=armee.findIndex(s=>!s);if(k<0)return false;armee[k]={c,n};return true;}
function revenus(j){const r={};for(const k of RES)r[k]=0;for(const v of villesDe(j)){r.or+=revenuVille(v);if(v.bat.silo){r[FAC[v.fac].rare]++;r.minerai++;}}
 for(const o of G.objs)if(o.t==='mine'&&o.prop===j)r[o.res]+=MINE_PROD[o.res];for(const h of herosDe(j)){const i=h.comp.intendance||0;r.or+=[0,125,250,500][i];}return r;}
function niveauFort(v){return v.bat.chateau?3:v.bat.citadelle?2:v.bat.fort?1:0;}
function croissance(v,init){const f=FAC[v.fac];const k=v.bat.chateau?2:v.bat.citadelle?1.5:1;for(let n=1;n<=7;n++)if(v.bat['hab'+n]){const c=CRE[f.crea[n-1]];v.dispo[n-1]+=Math.floor(c.cr*k);}}
function batDisponible(v,b){const B=BAT[b];if(v.bat[b])return{ok:false,raison:'Déjà construit'};
 for(const r of B.req||[])if(!v.bat[r])return{ok:false,raison:'Requiert '+batNom(r,v.fac)};
 if(B.unique&&villesDe(v.prop).some(w=>w.bat[b]))return{ok:false,raison:'Un seul par royaume'};
 // un bâtiment remplacé n'est plus proposé
 for(const k in BAT)if(BAT[k].remplace===b&&v.bat[k])return{ok:false,raison:'Déjà amélioré'};
 return{ok:true};}
function construire(v,b){const c=batCout(b,v.fac);const p=G.joueurs[v.prop];if(v.construit||!batDisponible(v,b).ok||!aDeQuoi(p.res,c))return false;payer(v.prop,c);v.bat[b]=1;
 v.construit=true;
 if(BAT[b].niv)v.dispo[BAT[b].niv-1]+=Math.floor(CRE[FAC[v.fac].crea[BAT[b].niv-1]].cr);
 if(b.startsWith('guilde')){const h=heroPar(G.hpos[idx(v.x,v.y)]);if(h)apprendreSorts(h,v);}
 return true;}
// revenu : seul le meilleur bâtiment de la lignée compte
function revenuVille(v){if(v.bat.capitole)return 4000;if(v.bat.hotelville)return 2000;if(v.bat.mairie)return 1000;return 500;}
function revenusNets(j){return revenus(j);}
function recruter(v,niv,n,armee){const c=CRE[FAC[v.fac].crea[niv]];const p=G.joueurs[v.prop];n=Math.min(n,v.dispo[niv],peutPayer(p.res,c.cout));if(n<=0)return 0;if(!ajouterTroupe(armee,c.id,n))return 0;payer(v.prop,c.cout,n);v.dispo[niv]-=n;return n;}
function apprendreSorts(h,v){const maxN=h.comp.sagesse?3:2;for(let n=1;n<=3;n++)if(v.bat['guilde'+n]&&n<=maxN)for(const s of v.guilde[n])if(!h.sorts.includes(s))h.sorts.push(s);}
function tauxMarche(j){const k=villesDe(j).filter(v=>v.bat.marche).length;return Math.max(1.3,2.8-.35*(k-1));}
function echanger(j,de,vers,nVers){const f=tauxMarche(j);const p=G.joueurs[j];let cout;if(vers==='or'){cout=nVers;}else cout=Math.ceil(nVers*RES_VAL[vers]/RES_VAL[de]*(de==='or'?f:f*.8));
 // vers or : nVers est la quantité de ressource vendue
 if(vers==='or'){const q=nVers;if((p.res[de]||0)<q)return false;p.res[de]-=q;p.res.or+=Math.floor(q*RES_VAL[de]/f*1.0);return true;}
 if((p.res[de]||0)<cout)return false;p.res[de]-=cout;p.res[vers]+=nVers;return true;}
function prixMarche(j,de,vers){const f=tauxMarche(j);if(vers==='or')return RES_VAL[de]/f;return RES_VAL[vers]/RES_VAL[de]*(de==='or'?f:f*.8);}

// ---------- taverne ----------
function tavernePiocher(p){p.taverne=[];const cl=Object.keys(CLASSES);for(let k=0;k<2;k++){const c=k===0?R.pick(FAC[p.fac].classes):R.pick(cl);p.taverne.push(c);}}
function engager(v,k){const p=G.joueurs[v.prop];if(!v.bat.taverne||p.res.or<2500||herosDe(p.id).length>=8)return null;if(G.hpos[idx(v.x,v.y)])return null;const c=p.taverne[k];if(!c)return null;p.res.or-=2500;const h=creerHeros(c,p.id,v.x,v.y,false);
 h.armee=[null,null,null,null,null,null,null];h.armee[0]={c:FAC[h.fac].crea[0],n:aleaI(4,10)};h.mp=mvtMax(h);G.hpos[idx(v.x,v.y)]=h.id;p.taverne[k]=null;revele(p.id,v.x,v.y,visionH(h));return h;}

// ---------- expérience ----------
async function gagnerXp(h,x){h.xp+=Math.round(x);while(h.xp>=xpPourNiveau(h.niv+1)){h.niv++;const C=CLASSES[h.classe];
  // caractéristique
  let r=alea()*100,k=0;for(;k<3;k++){r-=C.prob[k];if(r<=0)break;}const st=['att','def','pou','con'][k];h[st]++;
  // compétences proposées
  const offres=offresComp(h);let ch=0;if(offres.length)ch=await HOOK.niveau(h,offres,k);
  if(offres.length){const o=offres[Math.max(0,Math.min(offres.length-1,ch))];h.comp[o]=(h.comp[o]||0)+1;}
  h.mana=Math.min(manaMax(h),h.mana+ (st==='con'?10:0));}}
function offresComp(h){const C=CLASSES[h.classe];const ameli=Object.keys(h.comp).filter(c=>h.comp[c]<3);const nb=Object.keys(h.comp).length;const nouv=nb<6?Object.keys(C.ch).filter(c=>!h.comp[c]):[];
 const pond=l=>{if(!l.length)return null;const t={};for(const c of l)t[c]=C.ch[c]||1;return R.pond(t);};
 const o=[];const a=pond(ameli);if(a)o.push(a);const n=pond(nouv.filter(c=>c!==a));if(n)o.push(n);if(o.length<2){const b=pond(ameli.filter(c=>c!==a));if(b)o.push(b);}return o;}

// ---------- combats sur la carte ----------
async function lancerCombat(A,D,opts){G.stats.combats++;if(HOOK.combat)return HOOK.combat(A,D,opts);return combatAuto(A,D,opts);}
function combatAuto(A,D,opts){const C=creerCombat(A,D,Object.assign({graine:R.i(1,1e9)},opts||{}));while(!C.fin){const a=iaCombat(C);C.agir(a);}return C;}
function cotesHeros(h){return{heros:h,armee:h.armee,joueur:h.j};}
async function combatMonstre(h,m,attaqueParMonstre){const arm=pileMonstre(m);const D={heros:null,armee:arm,joueur:-1,monstre:m};
 // les créatures faibles peuvent fuir ou se joindre — ici elles s'enfuient si l'armée est écrasante
 if(!attaqueParMonstre&&forceArmee(h.armee,h)>forceArmee(arm)*12&&!m.garde&&!m.passage){retirerObjet(m);await HOOK.message(h.j,'Fuite',`Les ${CRE[m.cre].pl.toLowerCase()} s’enfuient devant votre armée !`);return true;}
 const C=await lancerCombat(cotesHeros(h),D,{terrain:TER[G.carte.ter[idx(m.x,m.y)]]});
 return finCombat(C,h,null,m,null);}
function pileMonstre(m){const arm=[null,null,null,null,null,null,null];const n=m.n,piles=Math.min(7,Math.max(1,Math.min(n,n>=60?7:n>=30?5:n>=10?4:n>=4?3:n)));const base=Math.floor(n/piles);let rest=n-base*piles;for(let k=0;k<piles;k++){arm[k]={c:m.cre,n:base+(rest-->0?1:0)};}return arm.filter(Boolean).concat(Array(7-piles).fill(null));}
async function combatHeros(h,o){const vo=villeSous(o);const C=await lancerCombat(cotesHeros(h),cotesHeros(o),{terrain:TER[G.carte.ter[idx(o.x,o.y)]],siege:vo&&vo.prop===o.j?niveauFort(vo):0,ville:vo&&vo.prop===o.j?vo:null,garnison:vo&&vo.prop===o.j?vo.garn:null});return finCombat(C,h,o,null,vo&&vo.prop===o.j?vo:null);}
async function assiegerVille(h,v){const def=heroPar(G.hpos[idx(v.x,v.y)]);if(def&&def.j!==h.j)return combatHeros(h,def).then(r=>r&&v.prop!==h.j?capturer(h,v):r);
 if(!v.garn.some(Boolean)){return capturer(h,v);}
 const C=await lancerCombat(cotesHeros(h),{heros:null,armee:v.garn,joueur:v.prop,ville:v},{terrain:TER[G.carte.ter[idx(v.x,v.y)]],siege:niveauFort(v),ville:v});
 const r=await finCombat(C,h,null,null,v);if(r)return capturer(h,v);return false;}
async function capturer(h,v){const anc=v.prop;v.prop=h.j;v.garn=v.garn.map(s=>null);v.construit=true;HOOK.journal(h.j,`${h.nom} s’empare de ${v.nom} !`);if(anc>=0)verifierElimination(anc);await HOOK.message(h.j,'Ville conquise',`${v.nom} passe sous votre bannière.`,{ville:v});revele(h.j,v.x,v.y,9);return true;}
// applique le résultat : survivants, expérience, nécromancie, retraits
async function finCombat(C,h,o,m,v){
 const gagneA=C.fin.gagnant===0;
 // survivants
 C.appliquer();
 const xpA=C.pvTues(1),xpD=C.pvTues(0);
 if(m){if(gagneA){retirerObjet(m);}else{m.n=C.survivants(1);if(m.n<=0)retirerObjet(m);}}
 if(gagneA){if(o){retirerHeros(o,h.j);}await gagnerXp(h,xpA+(o?500:0));await necromancie(h,C,1);h.bonus.fontaine=0;HOOK.maj();return true;}
 else{if(o&&C.fin.gagnant===1){await gagnerXp(o,xpD+500);await necromancie(o,C,0);}retirerHeros(h,o?o.j:-1,C.fin.fuite);HOOK.maj();return false;}}
async function necromancie(h,C,coteEnnemi){const n=h.comp.necromancie||0;if(!n)return;const pv=C.pvTues(coteEnnemi,true);const q=Math.floor(pv*(.1*n)/CRE.squelette.pv);if(q>0&&ajouterTroupe(h.armee,'squelette',q))await HOOK.message(h.j,'Nécromancie',`${q} squelettes se relèvent et rejoignent ${h.nom}.`);}
function retirerHeros(h,par,fuite){G.heros=G.heros.filter(x=>x!==h);G.hpos[idx(h.x,h.y)]=0;HOOK.journal(h.j,`${h.nom} ${fuite?'a fui le combat':'a été vaincu'}.`);verifierElimination(h.j);}
function verifierElimination(j){const p=G.joueurs[j];if(p.elim)return;if(!villesDe(j).length&&!herosDe(j).length){p.elim=true;HOOK.journal(j,`${p.nom} est éliminé.`);}
 const vivants=G.joueurs.filter(q=>!q.elim);if(vivants.length===1)G.fini={gagnant:vivants[0].id};else if(!vivants.some(q=>q.humain)&&G.joueurs.some(q=>q.humain))G.fini={gagnant:vivants[0].id,defaite:true};}

// ---------- tours et jours ----------
function debutTourJoueur(j){}
function finTourJoueur(){const n=G.joueurs.length;let k=G.courant;for(let t=0;t<n;t++){k=(k+1)%n;if(k===0)nouveauJour();if(!G.joueurs[k].elim)break;}G.courant=k;return k;}
function nouveauJour(){G.jour++;const semaine=(G.jour-1)%7===0;
 for(const p of G.joueurs){if(p.elim)continue;const r=revenusNets(p.id);for(const k of RES)p.res[k]+=r[k];
  if(!villesDe(p.id).length){p.sansVille++;if(p.sansVille>=7){p.elim=true;for(const h of herosDe(p.id))retirerHeros(h,-1);HOOK.journal(p.id,`${p.nom} a perdu sa dernière ville depuis trop longtemps.`);}}else p.sansVille=0;
  if(semaine)tavernePiocher(p);}
 for(const h of G.heros){h.bonus.puits=0;if(semaine)h.bonus.ecurie=0;h.mp=mvtMax(h);const v=villeSous(h);if(v&&v.prop===h.j&&v.bat.guilde1)h.mana=Math.max(h.mana,manaMax(h));else h.mana=Math.min(manaMax(h),h.mana+1+(h.comp.sagesse||0));}
 for(const o of G.objs){if(o.t==='ville')o.construit=false;}
 if(semaine){for(const o of G.objs){if(o.t==='ville')croissance(o);if(o.t==='moulin'||(o.t==='bat'&&o.b==='moulin'))o.pris=0;if(o.t==='bat'&&o.b==='habitation')o.dispo=(o.dispo||0)+CRE[o.cre].cr;if(o.t==='monstre'&&!o.passage)o.n=Math.round(o.n*1.06+.4);}}
 const vivants=G.joueurs.filter(q=>!q.elim);if(vivants.length===1&&!G.fini)G.fini={gagnant:vivants[0].id};}
function dateTxt(){const d=G.jour-1;return`Mois ${Math.floor(d/28)+1}, semaine ${Math.floor(d%28/7)+1}, jour ${d%7+1}`;}

// ---------- sauvegarde ----------
function vuEnTexte(a){let s='',run=0,cur=a[0];const out=[];for(let i=0;i<a.length;i++){if(a[i]===cur&&run<9999)run++;else{out.push(cur+':'+run);cur=a[i];run=1;}}out.push(cur+':'+run);return out.join(',');}
function texteEnVu(s,N){const a=new Uint8Array(N*N);let i=0;for(const p of s.split(',')){const [v,n]=p.split(':').map(Number);a.fill(v,i,i+n);i+=n;}return a;}
function serialiser(){const c=G.carte;return JSON.stringify(Object.assign({},G,{occ:undefined,oi:undefined,zoc:undefined,hpos:undefined,rs:R.s,carte:Object.assign({},c,{zone:undefined}),joueurs:G.joueurs.map(p=>Object.assign({},p,{vu:vuEnTexte(p.vu)}))}));}
function deserialiser(s){const g=JSON.parse(s);g.joueurs.forEach(p=>p.vu=texteEnVu(p.vu,g.carte.N));G=g;R=creeRng(1);R.s=g.rs>>>0;delete G.rs;index();return G;}

if(typeof module!=='undefined')module.exports={};
