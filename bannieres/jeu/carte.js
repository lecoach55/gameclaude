'use strict';
/* =========================================================
   BANNIÈRES & SORTILÈGES — générateur de cartes aléatoires (sans DOM)
   Zones (Voronoï déformé) → terrains → lacs → murs de relief entre zones avec passages gardés
   → villes → routes (A*) → mines, trésors, bâtiments, monstres → vérification de connexité.
   ========================================================= */
var OBS={RIEN:0,VEG:1,ROC:2,MONT:3,MONTP:4,STRUCT:5};

// bruit de valeur lissé, reproductible
function bruit(seed){const P=new Uint32Array(512);const r=creeRng(seed);for(let i=0;i<256;i++)P[i]=i;for(let i=255;i>0;i--){const j=Math.floor(r.f()*(i+1));const t=P[i];P[i]=P[j];P[j]=t;}for(let i=0;i<256;i++)P[i+256]=P[i];
 const V=new Float32Array(256);for(let i=0;i<256;i++)V[i]=r.f();
 const h=(x,y)=>V[P[(P[x&255]+y)&511]&255];const s=t=>t*t*(3-2*t);
 const n=(x,y)=>{const x0=Math.floor(x),y0=Math.floor(y),fx=s(x-x0),fy=s(y-y0);const a=h(x0,y0),b=h(x0+1,y0),c=h(x0,y0+1),d=h(x0+1,y0+1);return a+(b-a)*fx+(c-a)*fy+(a-b-c+d)*fx*fy;};
 n.fbm=(x,y,o=3)=>{let v=0,a=1,t=0,f=1;for(let i=0;i<o;i++){v+=n(x*f+i*17.3,y*f-i*9.1)*a;t+=a;a*=.5;f*=2;}return v/t;};return n;}

// tas binaire pour A*
function Tas(){const a=[],p=[];return{vide:()=>!a.length,push(v,pr){a.push(v);p.push(pr);let i=a.length-1;while(i>0){const q=(i-1)>>1;if(p[q]<=p[i])break;[a[q],a[i]]=[a[i],a[q]];[p[q],p[i]]=[p[i],p[q]];i=q;}},
 pop(){const top=a[0];const lv=a.pop(),lp=p.pop();if(a.length){a[0]=lv;p[0]=lp;let i=0;for(;;){const l=2*i+1,r=l+1;let m=i;if(l<a.length&&p[l]<p[m])m=l;if(r<a.length&&p[r]<p[m])m=r;if(m===i)break;[a[m],a[i]]=[a[i],a[m]];[p[m],p[i]]=[p[i],p[m]];i=m;}}return top;}};}
var DIR8=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];

// A* générique 8 directions : cout(i)=coût d'entrer (Infinity = interdit)
function aEtoile(N,dep,arr,cout){const g=new Float32Array(N*N).fill(Infinity),par=new Int32Array(N*N).fill(-1);const T=Tas();g[dep]=0;T.push(dep,0);const ax=arr%N,ay=(arr/N)|0;
 while(!T.vide()){const i=T.pop();if(i===arr)break;const x=i%N,y=(i/N)|0;for(const [dx,dy] of DIR8){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=N||ny>=N)continue;const j=ny*N+nx;const c=cout(j);if(c===Infinity)continue;const ng=g[i]+c*(dx&&dy?1.414:1);if(ng<g[j]){g[j]=ng;par[j]=i;T.push(j,ng+Math.max(Math.abs(nx-ax),Math.abs(ny-ay)));}}}
 if(g[arr]===Infinity)return null;const ch=[];for(let i=arr;i!==-1;i=par[i])ch.push(i);return ch.reverse();}

function genererCarte(o){
 const R=creeRng(o.graine),N=o.taille,P=o.joueurs.length,I=(x,y)=>y*N+x,dans=(x,y)=>x>=0&&y>=0&&x<N&&y<N;
 const nz=bruit(R.i(1,1e9)),nz2=bruit(R.i(1,1e9)),nz3=bruit(R.i(1,1e9));
 const mult=[0.55,1,1.7][o.monstres==null?1:o.monstres];
 // ---- 1. centres des zones
 const Z=[];const a0=R.f()*Math.PI*2,rad=N*(P===2?0.33:0.31);
 for(let p=0;p<P;p++){const a=a0+p*2*Math.PI/P+(R.f()-.5)*.25;Z.push({x:Math.max(6,Math.min(N-7,N/2+Math.cos(a)*rad)),y:Math.max(6,Math.min(N-7,N/2+Math.sin(a)*rad)),joueur:p});}
 const nNeut=Math.max(3,Math.round(N*N/230));const minD=N/Math.sqrt(P+nNeut)*0.78;
 for(let t=0;t<4000&&Z.length<P+nNeut;t++){const x=3+R.f()*(N-7),y=3+R.f()*(N-7);if(Z.every(z=>Math.hypot(z.x-x,z.y-y)>=(z.joueur!=null?minD*1.1:minD)))Z.push({x,y,joueur:null});}
 // ---- 2. zone de chaque case (Voronoï déformé par le bruit)
 const zone=new Int16Array(N*N);
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){let b=0,bd=1e9;const w=(nz(x/5,y/5)-.5)*7,w2=(nz(x/5+40,y/5+40)-.5)*7;for(let k=0;k<Z.length;k++){const d=Math.hypot(Z[k].x-x-w,Z[k].y-y-w2);if(d<bd){bd=d;b=k;}}zone[I(x,y)]=b;}
 for(const z of Z)z.cases=[];for(let i=0;i<N*N;i++)Z[zone[i]].cases.push(i);
 // richesse : distance aux joueurs
 for(const z of Z){if(z.joueur!=null){z.r=0;continue;}let d=1e9;for(const q of Z)if(q.joueur!=null)d=Math.min(d,Math.hypot(q.x-z.x,q.y-z.y));z.r=Math.min(1,Math.max(.15,(d-N*.12)/(N*.42)));}
 // ---- 3. terrains
 const TERP={herbe:3,terre:2,rude:2,neige:1.6,sable:1.6,marais:1.4,lave:1};
 for(const z of Z)z.ter=z.joueur!=null?FAC[o.joueurs[z.joueur].fac].ter:R.pond(TERP);
 const ter=new Uint8Array(N*N);for(let i=0;i<N*N;i++)ter[i]=TER.indexOf(Z[zone[i]].ter);
 // ---- 4. voisinages et passages
 const fr={};for(let y=0;y<N;y++)for(let x=0;x<N;x++){const a=zone[I(x,y)];for(const [dx,dy] of [[1,0],[0,1]]){const nx=x+dx,ny=y+dy;if(!dans(nx,ny))continue;const b=zone[I(nx,ny)];if(a===b)continue;const k=Math.min(a,b)+'_'+Math.max(a,b);(fr[k]=fr[k]||[]).push(a<b?[I(x,y),I(nx,ny)]:[I(nx,ny),I(x,y)]);}}
 const aretes=Object.keys(fr).filter(k=>fr[k].length>=3).map(k=>{const [a,b]=k.split('_').map(Number);return{a,b,f:fr[k],w:R.f()+(Z[a].joueur!=null&&Z[b].joueur!=null?3:0)};});
 aretes.sort((p,q)=>p.w-q.w);const ufp=Z.map((_,i)=>i),uf=i=>ufp[i]===i?i:(ufp[i]=uf(ufp[i]));
 for(const e of aretes){const ra=uf(e.a),rb=uf(e.b);if(ra!==rb){ufp[ra]=rb;e.mst=1;}else if(R.f()<.3&&!(Z[e.a].joueur!=null&&Z[e.b].joueur!=null&&P>2))e.extra=1;}
 const liens=aretes.filter(e=>e.mst||e.extra);
 for(const e of liens){const mx=(Z[e.a].x+Z[e.b].x)/2,my=(Z[e.a].y+Z[e.b].y)/2;let best=null,bd=1e9;for(const [i,j] of e.f){const x=i%N,y=(i/N)|0;if(x<2||y<2||x>N-3||y>N-3)continue;const d=Math.hypot(x-mx,y-my)+R.f()*2;if(d<bd){bd=d;best=[i,j];}}if(!best)best=e.f[0];e.g=best;}
 // ---- 5. eau
 const centreD=i=>{const z=Z[zone[i]];return Math.hypot((i%N)-z.x,((i/N)|0)-z.y);};
 const presM=new Uint8Array(N*N).fill(99);for(const e of liens)for(const g of e.g){const gx=g%N,gy=(g/N)|0;for(let y=gy-3;y<=gy+3;y++)for(let x=gx-3;x<=gx+3;x++)if(dans(x,y)){const d=Math.max(Math.abs(x-gx),Math.abs(y-gy));if(d<presM[I(x,y)])presM[I(x,y)]=d;}}
 const pres=(i,r)=>presM[i]<=r;
 if(o.eau>0){const thr=o.eau===1?.66:.57;for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=I(x,y);const bord=Math.max(0,1-Math.min(x,y,N-1-x,N-1-y)/(N*.18))*.22;const v=nz3.fbm(x/8,y/8,3)+bord;if(v>thr&&centreD(i)>6&&!pres(i,2))ter[i]=EAU;}
  // lissage
  for(let pass=0;pass<2;pass++){const t2=ter.slice();for(let y=1;y<N-1;y++)for(let x=1;x<N-1;x++){let c=0;for(const [dx,dy] of DIR8)if(ter[I(x+dx,y+dy)]===EAU)c++;const i=I(x,y);if(ter[i]===EAU&&c<3)t2[i]=TER.indexOf(Z[zone[i]].ter);else if(ter[i]!==EAU&&c>=6&&centreD(i)>6&&!pres(i,2))t2[i]=EAU;}ter.set(t2);}
 }
 // ---- 6. murs de relief entre zones + obstacles intérieurs
 const obs=new Uint8Array(N*N);
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=I(x,y);if(ter[i]===EAU)continue;let bord=false;for(const [dx,dy] of DIR8){const nx=x+dx,ny=y+dy;if(dans(nx,ny)&&zone[I(nx,ny)]!==zone[i]){bord=true;break;}}
  if(x===0||y===0||x===N-1||y===N-1)bord=true;
  if(bord&&!pres(i,1))obs[i]=OBS.VEG;
  else if(nz2(x/3.2,y/3.2)>.63&&centreD(i)>4.5&&!pres(i,1))obs[i]=OBS.VEG;}
 // ---- 7. villes
 const objs=[];let oid=1;const occ=new Int32Array(N*N); // id d'objet sur la case d'action
 const ajout=ob=>{ob.id=oid++;objs.push(ob);occ[I(ob.x,ob.y)]=ob.id;return ob;};
 const degager=(cx,cy,r)=>{for(let y=Math.floor(cy-r);y<=cy+r;y++)for(let x=Math.floor(cx-r);x<=cx+r;x++)if(dans(x,y)&&Math.hypot(x-cx,y-cy)<=r){const i=I(x,y);obs[i]=0;if(ter[i]===EAU)ter[i]=TER.indexOf(Z[zone[i]].ter);}};
 const villes=[];
 const poserVille=(z,fac,joueur)=>{const x=Math.round(z.x),y=Math.round(z.y);degager(x,y,3.6);for(const [dx,dy] of [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0]])obs[I(x+dx,y+dy)]=OBS.STRUCT;
  const v=ajout({t:'ville',x,y,fac,prop:joueur,zone:Z.indexOf(z)});z.ville=v;villes.push(v);return v;};
 for(const z of Z)if(z.joueur!=null)poserVille(z,o.joueurs[z.joueur].fac,z.joueur);
 const neut=Z.filter(z=>z.joueur==null&&z.cases.length>40&&z.x>4&&z.y>4&&z.x<N-5&&z.y<N-5).sort((a,b)=>b.cases.length-a.cases.length);
 const nVN=Math.max(1,Math.round(neut.length/4));for(let k=0;k<nVN&&k<neut.length;k++)poserVille(neut[k],R.pick(FACS),-1);
 // ---- 8. routes et passages (A*)
 const route=new Uint8Array(N*N);
 const ancre=z=>z.ville?I(z.ville.x,z.ville.y+1):I(Math.round(z.x),Math.round(z.y));
 const coutR=j=>obs[j]===OBS.STRUCT?Infinity:(route[j]?.6:0)+(ter[j]===EAU?30:obs[j]?7:1);
 const tracer=(a,b,mk)=>{const ch=aEtoile(N,a,b,coutR);if(!ch)return;for(const j of ch){if(obs[j]!==OBS.STRUCT)obs[j]=0;if(ter[j]===EAU)ter[j]=TER.indexOf(Z[zone[j]].ter);if(mk)route[j]=1;}};
 for(const e of liens){const [g,h]=e.g;const mk=!!e.mst;tracer(ancre(Z[e.a]),g,mk);tracer(g,h,mk);tracer(h,ancre(Z[e.b]),mk);}
 for(const v of villes){const i=I(v.x,v.y+1);obs[i]=0;route[i]=1;obs[I(v.x,v.y)]=0;}
 // ---- 9. objets
 const libre=i=>ter[i]!==EAU&&!obs[i]&&!occ[i];
 const sur=(x,y)=>{ // la case peut devenir un objet sans couper le passage local : les voisines libres doivent rester reliées entre elles
  const v=[];for(const [dx,dy] of DIR8){const nx=x+dx,ny=y+dy;if(dans(nx,ny)&&libre(I(nx,ny)))v.push([dx,dy]);}
  if(!v.length)return false;const vu=[0];const q=[0];const s=new Set([0]);while(q.length){const a=v[q.pop()];for(let k=0;k<v.length;k++)if(!s.has(k)&&Math.max(Math.abs(v[k][0]-a[0]),Math.abs(v[k][1]-a[1]))===1){s.add(k);q.push(k);}}
  return s.size===v.length;};
 const loinDesObjets=(x,y,d)=>{for(let yy=y-d+1;yy<y+d;yy++)for(let xx=x-d+1;xx<x+d;xx++)if(dans(xx,yy)&&occ[I(xx,yy)])return false;return true;};
 const bfsZone=z=>{const D=new Map();const s=ancre(z);D.set(s,0);const q=[s];while(q.length){const i=q.shift();const x=i%N,y=(i/N)|0;for(const [dx,dy] of DIR8){const nx=x+dx,ny=y+dy;if(!dans(nx,ny))continue;const j=I(nx,ny);if(D.has(j)||zone[j]!==zone[s]||ter[j]===EAU||(obs[j]&&obs[j]!==OBS.STRUCT))continue;D.set(j,D.get(i)+1);q.push(j);}}return D;};
 const choisir=(z,D,dmin,dmax,opt={})=>{const c=[];for(const [i,d] of D){if(d<dmin||d>dmax)continue;const x=i%N,y=(i/N)|0;if(x<1||y<2||x>N-2||y>N-2)continue;if(!libre(i)||(route[i]&&!opt.route))continue;if(opt.haut&&(!libre(I(x,y-1))||route[I(x,y-1)]))continue;if(!loinDesObjets(x,y,opt.ecart||2))continue;if(!sur(x,y))continue;c.push(i);}if(!c.length)return -1;return R.pick(c);};
 const mkMonstre=(v,x,y,extra)=>{v*=mult*(.85+R.f()*.3);const cands=Object.values(CRE).filter(c=>{const n=v/c.val;return n>=5&&n<=28;});let c=cands.length?R.pick(cands):Object.values(CRE).sort((a,b)=>Math.abs(Math.log(v/a.val/12))-Math.abs(Math.log(v/b.val/12)))[0];
  return ajout(Object.assign({t:'monstre',x,y,cre:c.id,n:Math.max(1,Math.round(v/c.val))},extra||{}));};
 const garder=(ob,v)=>{// place un gardien à côté d'un objet de valeur
  const c=[];for(const [dx,dy] of DIR8){const x=ob.x+dx,y=ob.y+dy;if(!dans(x,y))continue;const i=I(x,y);if(libre(i)&&sur(x,y))c.push([x,y,dy>0?0:1]);}
  if(!c.length)return;c.sort((a,b)=>a[2]-b[2]);const [x,y]=c[0];mkMonstre(v,x,y,{garde:ob.id});};
 const poser=(z,D,t,extra,dmin,dmax,opt)=>{const i=choisir(z,D,dmin,dmax,opt);if(i<0)return null;const x=i%N,y=(i/N)|0;const ob=ajout(Object.assign({t,x,y},extra));if(opt&&opt.haut)obs[I(x,y-1)]=OBS.STRUCT;return ob;};
 const pile=()=>{const r=R.pond({or:3,bois:3,minerai:3,mercure:1,soufre:1,cristal:1,gemmes:1});return{res:r,q:r==='or'?R.i(5,10)*100:(r==='bois'||r==='minerai')?R.i(5,10):R.i(3,6)};};
 const RARES=['mercure','soufre','cristal','gemmes'];
 const valGarde=z=>(350+5200*Math.pow(z.r,1.35));
 for(const z of Z){const D=bfsZone(z);const maxd=Math.max(...D.values(),6);
  if(z.joueur!=null){const fac=o.joueurs[z.joueur].fac;
   poser(z,D,'mine',{res:'bois',prop:-1},3,8,{haut:1,ecart:3});poser(z,D,'mine',{res:'minerai',prop:-1},3,8,{haut:1,ecart:3});
   const m=poser(z,D,'mine',{res:FAC[fac].rare,prop:-1},6,14,{haut:1,ecart:3});if(m)garder(m,450);
   const m2=poser(z,D,'mine',{res:R.pick(RARES.filter(r=>r!==FAC[fac].rare)),prop:-1},7,16,{haut:1,ecart:3});if(m2)garder(m2,600);
   for(let k=0;k<6;k++)poser(z,D,'res',pile(),2,12);
   for(let k=0;k<2;k++){const c=poser(z,D,'coffre',{},4,14);if(c&&k)garder(c,400);}
   poser(z,D,'bat',{b:R.pick(['moulin','puits','feu','ecurie'])},4,14,{});poser(z,D,'bat',{b:R.pick(['autel','pierre','feu','fontaine'])},5,16,{});
   for(let k=0;k<2;k++){const i=choisir(z,D,6,maxd,{});if(i>=0)mkMonstre(R.i(250,550),i%N,(i/N)|0);}
  }else{const r=z.r,n=Math.max(1,Math.round(z.cases.length/90));
   for(let k=0;k<n;k++){const res=R.f()<.35?'or':R.pick(RARES.concat(['bois','minerai']));const m=poser(z,D,'mine',{res,prop:-1},2,maxd,{haut:1,ecart:3});if(m)garder(m,valGarde(z)*(res==='or'?1.3:.9));}
   for(let k=0;k<2+n*2;k++){const p=poser(z,D,'res',pile(),1,maxd);if(p&&R.f()<.25)garder(p,valGarde(z)*.5);}
   for(let k=0;k<1+n;k++){const c=poser(z,D,'coffre',{},1,maxd);if(c&&R.f()<.5)garder(c,valGarde(z)*.7);}
   const bats=['moulin','puits','autel','pierre','arbre','tour','sanctuaire','ecurie','feu','habitation','fontaine'];
   for(let k=0;k<1+n;k++){const b=R.pick(bats);const ex={b};if(b==='autel')ex.stat=R.i(0,3);if(b==='habitation'){const f=R.pick(FACS.concat(['neutre']));const l=f==='neutre'?R.pick(CRE_NEUTRES):FAC[f].crea[R.i(0,r>.6?4:2)];ex.cre=l;ex.dispo=CRE[l].cr;}
    const ob=poser(z,D,'bat',ex,1,maxd);if(ob&&(b==='arbre'||b==='sanctuaire'||b==='habitation'||b==='autel'))garder(ob,valGarde(z)*.8);}
   const ra=r<.4?1:r<.75?(R.f()<.5?1:2):(R.f()<.25?3:2);const a=poser(z,D,'artefact',{art:R.pick(ARTS_RANG[ra])},2,maxd);if(a)garder(a,valGarde(z)*(ra===3?1.8:ra===2?1.2:.8));
   for(let k=0;k<n+1;k++){const i=choisir(z,D,2,maxd,{});if(i>=0)mkMonstre(valGarde(z)*.7,i%N,(i/N)|0);}
   if(z.ville&&z.ville.prop<0){const v=z.ville;v.garnisonInit=valGarde(z)*1.2*mult;}
  }}
 // gardiens des passages
 for(const e of liens){const [g]=e.g;const x=g%N,y=(g/N)|0;if(occ[g]||obs[g])continue;const r=(Z[e.a].r+Z[e.b].r)/2;const pp=Z[e.a].joueur!=null&&Z[e.b].joueur!=null;mkMonstre((pp?4000:500+4800*Math.pow(r,1.2))*(o.difPassage||1),x,y,{passage:1});}
 // ---- 10. connexité : toute case libre doit être accessible depuis la ville du joueur 1
 const pass=i=>ter[i]!==EAU&&!obs[i];
 for(let tour=0;tour<40;tour++){const vu=new Uint8Array(N*N);const s=I(villes[0].x,villes[0].y+1);vu[s]=1;const q=[s];while(q.length){const i=q.pop();const x=i%N,y=(i/N)|0;for(const [dx,dy] of DIR8){const nx=x+dx,ny=y+dy;if(!dans(nx,ny))continue;const j=I(nx,ny);if(!vu[j]&&pass(j)){vu[j]=1;q.push(j);}}}
  let cible=-1;for(let i=0;i<N*N;i++)if(pass(i)&&!vu[i]&&(occ[i]||route[i])){cible=i;break;}
  if(cible<0){for(let i=0;i<N*N;i++)if(pass(i)&&!vu[i])obs[i]=OBS.VEG;break;}
  // relier la poche à la partie accessible la plus proche
  let best=-1,bd=1e9;const cx=cible%N,cy=(cible/N)|0;for(let i=0;i<N*N;i++)if(vu[i]){const d=Math.hypot(i%N-cx,((i/N)|0)-cy);if(d<bd){bd=d;best=i;}}
  const ch=aEtoile(N,cible,best,j=>obs[j]===OBS.STRUCT||(occ[j]&&j!==cible)?Infinity:ter[j]===EAU?12:obs[j]?3:1);if(!ch){obs[cible]=OBS.VEG;const ob=objs.find(b=>I(b.x,b.y)===cible);if(ob){ob.mort=1;occ[cible]=0;}continue;}
  for(const j of ch){if(obs[j]!==OBS.STRUCT)obs[j]=0;if(ter[j]===EAU)ter[j]=TER.indexOf(Z[zone[j]].ter);}}
 // les objets coincés sous un obstacle sont retirés
 for(const ob of objs)if(obs[I(ob.x,ob.y)])ob.mort=1;
 // ---- 11. nature des obstacles (montagnes 2×2, forêts, rochers selon le terrain)
 for(let y=0;y<N-1;y++)for(let x=0;x<N-1;x++){const a=I(x,y),b=I(x+1,y),c=I(x,y+1),d=I(x+1,y+1);if(obs[a]===1&&obs[b]===1&&obs[c]===1&&obs[d]===1&&nz3(x/4+50,y/4)>.52){obs[a]=OBS.MONT;obs[b]=obs[c]=obs[d]=OBS.MONTP;}}
 const ROC={herbe:.15,terre:.45,rude:.65,neige:.3,sable:.55,marais:.15,lave:.8};
 for(let i=0;i<N*N;i++)if(obs[i]===1){const t=TER[ter[i]];const h=(Math.sin(i*12.9898)*43758.5453)%1;if(Math.abs(h)<ROC[t]*.7)obs[i]=OBS.ROC;}
 const vivants=objs.filter(b=>!b.mort);
 // renumérote proprement
 const carte={N,ter:Array.from(ter),obs:Array.from(obs),route:Array.from(route),zone:Array.from(zone),zones:Z.map(z=>({x:z.x,y:z.y,joueur:z.joueur,ter:z.ter,r:z.r}))};
 return{carte,objs:vivants,villes:villes.filter(v=>!v.mort)};
}
if(typeof module!=='undefined')module.exports={};
