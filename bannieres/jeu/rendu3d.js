'use strict';
/* =========================================================
   BANNIÈRES & SORTILÈGES — carte d'aventure en 3D (Three.js)
   Relief peint, eau, montagnes et forêts en volume, villes et lieux construits en 3D,
   créatures et héros en panneaux (comme les sprites des Heroes classiques), brouillard dans les shaders.
   L'ancienne vue 2D reste disponible (menu ☰).
   ========================================================= */
var R3=(()=>{
const T=window.THREE;if(!T)return{ok:false};
let ren=null,scene,cam,soleil,hemi,terrain,eau,fogTex,fogData,N=0,H=null,grp=null,decor=null,objets=new Map(),herosS=new Map(),fleches=null,anneau=null,croixG=null,env=null;
const U={fog:{value:null},N:{value:1},t:{value:0}};
let PAN_A=.45,PAN_K=1.1;
const C3={cible:new T.Vector3(10,0,10),dist:16,tang:.95,yaw:0};
const S={pret:false,glb:{},qual:2};
const RC=new T.Raycaster();const v2=new T.Vector2();
// ---------- brouillard et ondulation : injectés dans les matériaux standard ----------
function brume(m,opt={}){m.onBeforeCompile=sh=>{sh.uniforms.bsFog=U.fog;sh.uniforms.bsN=U.N;sh.uniforms.bsT=U.t;
  sh.vertexShader='varying vec2 vBsW;\nuniform float bsT;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n'+(opt.vent?'{vec4 w0=modelMatrix*vec4(0.,0.,0.,1.);\n#ifdef USE_INSTANCING\nw0=modelMatrix*instanceMatrix*vec4(0.,0.,0.,1.);\n#endif\nfloat k=max(0.,position.y)*'+opt.vent+';transformed.x+=sin(bsT*1.6+w0.x*.7+w0.z*.5)*k;transformed.z+=cos(bsT*1.3+w0.x*.4)*k*.6;}':'')+(opt.onde?'transformed.z+=sin(bsT*1.2+position.x*1.3+position.y*.9)*.02;':''))
   .replace('#include <project_vertex>','#include <project_vertex>\n{vec4 bw=vec4(transformed,1.);\n#ifdef USE_INSTANCING\nbw=instanceMatrix*bw;\n#endif\nbw=modelMatrix*bw;vBsW=bw.xz;}');
  sh.fragmentShader='varying vec2 vBsW;uniform sampler2D bsFog;uniform float bsN;\n'+sh.fragmentShader.replace('#include <opaque_fragment>','#include <opaque_fragment>\n{float f=texture2D(bsFog,vBsW/bsN).r;gl_FragColor.rgb*=mix(.035,1.,f);}');};
 m.customProgramCacheKey=()=>'bs'+(opt.vent||'')+(opt.onde?'o':'');return m;}
const MATS={};function mat(c,o={}){if(o.map===null)delete o.map;const k=c+JSON.stringify(o,(n,v)=>n==='map'?(v&&v.uuid):v);if(MATS[k])return MATS[k];const m=new T.MeshStandardMaterial(Object.assign({color:c,roughness:o.r??.85,metalness:o.m||0,flatShading:!!o.plat},o.map?{map:o.map}:{}));if(o.em){m.emissive=new T.Color(o.em);m.emissiveIntensity=o.ei||1;}if(o.vc)m.vertexColors=true;if(o.transp){m.transparent=true;m.opacity=o.transp;}return MATS[k]=brume(m,o);}
// ---------- relief ----------
function hauteurs(){const c=G.carte;N=c.N;const SD=champSigne(c);const nz=bruit(G.graine*3+11);const R=S.qual>=2?4:3;const W=N*R+1;H=new Float32Array(W*W);
 const sd=(fx,fy)=>{fx=Math.max(0,Math.min(N-1.001,fx-.5));fy=Math.max(0,Math.min(N-1.001,fy-.5));const x0=Math.floor(fx),y0=Math.floor(fy),ax=fx-x0,ay=fy-y0,x1=Math.min(N-1,x0+1),y1=Math.min(N-1,y0+1);return SD[y0*N+x0]*(1-ax)*(1-ay)+SD[y0*N+x1]*ax*(1-ay)+SD[y1*N+x0]*(1-ax)*ay+SD[y1*N+x1]*ax*ay;};
 const mont=new Float32Array(N*N);for(let i=0;i<N*N;i++)if(c.obs[i]===OBS.MONT||c.obs[i]===OBS.MONTP)mont[i]=1;
 for(let j=0;j<W;j++)for(let i=0;i<W;i++){const x=i/R,z=j/R;let h=(nz.fbm(x/7,z/7,3)-.5)*.55;
  const w=sd(x,z);if(w>-.6)h=Math.min(h,0)-Math.min(1,(w+.6)/1.4)*.45;// rives et fonds
  // pied des montagnes
  let m=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const tx=Math.floor(x)+dx,ty=Math.floor(z)+dy;if(tx>=0&&ty>=0&&tx<N&&ty<N&&mont[ty*N+tx]){const d=Math.hypot(x-tx-.5,z-ty-.5);m=Math.max(m,Math.max(0,1-d/1.6));}}h+=m*.45;
  const tx=Math.min(N-1,Math.floor(x)),ty=Math.min(N-1,Math.floor(z));if(c.route[ty*N+tx])h*=.4;
  H[j*W+i]=h;}
 H.R=R;H.W=W;}
function h(x,z){if(!H)return 0;const R=H.R,W=H.W;const fx=Math.max(0,Math.min(W-1.001,x*R)),fz=Math.max(0,Math.min(W-1.001,z*R));const i=Math.floor(fx),j=Math.floor(fz),ax=fx-i,az=fz-j;
 return H[j*W+i]*(1-ax)*(1-az)+H[j*W+i+1]*ax*(1-az)+H[(j+1)*W+i]*(1-ax)*az+H[(j+1)*W+i+1]*ax*az;}
function sol(x,y){return Math.max(-.12,h(x+.5,y+.5));}// hauteur d'appui au centre d'une case (pas sous l'eau)
function construireTerrain(){hauteurs();const R=H.R;const g=new T.PlaneGeometry(N,N,N*R,N*R);g.rotateX(-Math.PI/2);g.translate(N/2,0,N/2);
 const p=g.attributes.position;for(let k=0;k<p.count;k++){p.setY(k,h(p.getX(k),p.getZ(k)));}g.computeVertexNormals();
 const tx=new T.CanvasTexture(V.sol);tx.colorSpace=T.SRGBColorSpace;tx.anisotropy=Math.min(8,ren.capabilities.getMaxAnisotropy());
 terrain=new T.Mesh(g,brume(new T.MeshStandardMaterial({map:tx,roughness:.93,metalness:0})));terrain.receiveShadow=true;terrain.name='terrain';scene.add(terrain);
 // eau : plan brillant et légèrement transparent
 const ge=new T.PlaneGeometry(N+40,N+40,1,1);ge.rotateX(-Math.PI/2);ge.translate(N/2,-.1,N/2);
 const me=brume(new T.MeshStandardMaterial({color:0x2d6f9c,roughness:.12,metalness:.25,transparent:true,opacity:.62,envMapIntensity:1.2}));eau=new T.Mesh(ge,me);eau.renderOrder=1;scene.add(eau);
 // sol au-delà de la carte
 const gb=new T.PlaneGeometry(N+80,N+80,1,1);gb.rotateX(-Math.PI/2);gb.translate(N/2,-.5,N/2);const bas=new T.Mesh(gb,new T.MeshBasicMaterial({color:0x0a0806}));scene.add(bas);}
// ---------- brouillard (texture N×N, filtrage linéaire = bords doux) ----------
function majBrume(){const vu=G.joueurs[vueJoueur()].vu;for(let i=0;i<N*N;i++)fogData[i]=vu[i]?255:0;fogTex.needsUpdate=true;}
// ---------- géométries de décor ----------
function bruiter(g,k,seed){const p=g.attributes.position;const nz=bruit(seed);for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);const n=nz.fbm(x*1.7+5,z*1.7+y*1.3,3)-.5;const s=1+n*k;p.setXYZ(i,x*s,y*(1+n*k*.6),z*s);}g.computeVertexNormals();return g;}
function colorer(g,f){const p=g.attributes.position;const col=new Float32Array(p.count*3);const c=new T.Color();for(let i=0;i<p.count;i++){f(p.getX(i),p.getY(i),p.getZ(i),c);c.convertSRGBToLinear();col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;}g.setAttribute('color',new T.BufferAttribute(col,3));return g;}
const GEO={};
function geoMontagne(v,ter){const k='m'+v+ter;if(GEO[k])return GEO[k];const r=creeRng(v*13+7);let g=new T.IcosahedronGeometry(1,3);
 const p=g.attributes.position;const pics=[];const np=2+r.i(0,2);for(let i=0;i<np;i++)pics.push([(r.f()-.5)*.9,(r.f()-.5)*.9,.8+r.f()*.7]);
 for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);if(y<0){p.setXYZ(i,x*1.05,0,z*1.05);continue;}let hh=0;for(const [px,pz,ph] of pics){const d=Math.hypot(x-px,z-pz);hh=Math.max(hh,ph*Math.max(0,1-d/1.05));}p.setXYZ(i,x*(1-y*.25),y*.25+hh*1.35,z*(1-y*.25));}
 g=bruiter(g,.28,v*31+3);g.computeBoundingBox();const hm=g.boundingBox.max.y;
 const base={neige:[.55,.58,.64],sable:[.66,.48,.3],lave:[.22,.17,.16],marais:[.36,.36,.3],terre:[.46,.4,.32],rude:[.52,.46,.38],herbe:[.46,.46,.42]}[ter]||[.5,.5,.5];const nz=bruit(v*7+1);
 colorer(g,(x,y,z,c)=>{const n=nz(x*3+9,z*3+y*2);c.setRGB(base[0]*(.75+n*.5),base[1]*(.75+n*.5),base[2]*(.75+n*.5));const neige=ter==='neige'?.35:ter==='lave'||ter==='sable'?2:.62;if(y>hm*neige+n*.15){c.setRGB(.93,.95,1);}if(ter==='lave'&&y>hm*.8)c.setRGB(1,.42,.1);if(y<.15&&ter!=='neige'&&ter!=='sable'&&ter!=='lave')c.lerp(new T.Color(.3,.42,.2),.5);});
 return GEO[k]=g;}
function geoArbre(type,v){const k='a'+type+v;if(GEO[k])return GEO[k];const r=creeRng(v*17+type.length);const parts=[];const BGU=T.BGU;
 const tronc=(h0,r0,col)=>{const g=new T.CylinderGeometry(r0*.6,r0,h0,6,1);g.translate(0,h0/2,0);return colorer(g,(x,y,z,c)=>c.setRGB(...col));};
 if(type==='feuillu'){parts.push(tronc(.35,.06,[.36,.25,.15]));const base=[.2+r.f()*.08,.34+r.f()*.1,.13];for(let i=0;i<3;i++){let g=new T.IcosahedronGeometry(.22+r.f()*.08,1);g=bruiter(g,.35,v*9+i);g.translate((r.f()-.5)*.25,.45+r.f()*.25,(r.f()-.5)*.25);const s=.8+r.f()*.4;parts.push(colorer(g,(x,y,z,c)=>c.setRGB(base[0]*s+y*.08,base[1]*s+y*.12,base[2]*s+y*.02)));}}
 else if(type==='sapin'||type==='sapinN'){parts.push(tronc(.2,.05,[.3,.2,.12]));for(let i=0;i<3;i++){const g=new T.ConeGeometry(.24-i*.06,.32,7,1);g.translate(0,.25+i*.18+.16,0);parts.push(colorer(g,(x,y,z,c)=>{c.setRGB(.13,.3+i*.03,.17);if(type==='sapinN'&&y>.3+i*.18)c.setRGB(.9,.93,.98);}));}}
 else if(type==='palmier'){const g=new T.CylinderGeometry(.03,.05,.6,6,4);g.translate(0,.3,0);const p=g.attributes.position;for(let i=0;i<p.count;i++)p.setX(i,p.getX(i)+Math.pow(p.getY(i),2)*.25);parts.push(colorer(g,(x,y,z,c)=>c.setRGB(.5,.38,.22)));
  for(let i=0;i<6;i++){const f=new T.ConeGeometry(.05,.42,4,1);f.rotateZ(Math.PI/2+.5);f.translate(.2,0,0);f.rotateY(i*Math.PI/3);f.translate(.09,.6,0);parts.push(colorer(f,(x,y,z,c)=>c.setRGB(.2,.42,.16)));}}
 else if(type==='cactus'){const a=new T.CylinderGeometry(.05,.06,.42,7);a.translate(0,.21,0);parts.push(colorer(a,(x,y,z,c)=>c.setRGB(.28,.5,.22)));for(const s of [-1,1]){const b=new T.CylinderGeometry(.03,.03,.16,6);b.translate(s*.09,.27,0);parts.push(colorer(b,(x,y,z,c)=>c.setRGB(.28,.5,.22)));}}
 else{// arbre mort
  parts.push(tronc(.45,.05,[.25,.2,.15]));for(let i=0;i<3;i++){const b=new T.CylinderGeometry(.012,.025,.25,4);b.translate(0,.12,0);b.rotateZ((r.f()-.5)*1.8);b.rotateY(r.f()*6);b.translate(0,.25+i*.07,0);parts.push(colorer(b,(x,y,z,c)=>c.setRGB(.25,.2,.15)));}}
 const g=BGU.mergeGeometries(parts.map(p=>p.index?p.toNonIndexed():p),false);g.computeVertexNormals();return GEO[k]=g;}
function geoRocher(v,ter){const k='r'+v+ter;if(GEO[k])return GEO[k];let g=new T.DodecahedronGeometry(.22,1);g=bruiter(g,.45,v*5+2);g.scale(1.2,.75,1);g.translate(0,.12,0);
 const base={neige:[.6,.63,.7],sable:[.68,.5,.33],lave:[.2,.16,.15],marais:[.38,.38,.32],terre:[.46,.42,.36],rude:[.55,.5,.42],herbe:[.5,.5,.47]}[ter]||[.5,.5,.5];
 colorer(g,(x,y,z,c)=>{c.setRGB(...base);if(ter==='neige'&&y>.18)c.setRGB(.92,.94,.98);});return GEO[k]=g;}
// ---------- décor instancié : montagnes, forêts, rochers, buissons ----------
function construireDecor(){decor=new T.Group();scene.add(decor);const c=G.carte;const lots={};let ck='';const ajout=(cle,geo,matr,ombre)=>{cle+='|'+ck;(lots[cle]=lots[cle]||{geo,l:[],ombre}).l.push(matr);};
 const M4=new T.Matrix4(),Q=new T.Quaternion(),E=new T.Euler(),P=new T.Vector3(),Sc=new T.Vector3();
 const mk=(x,y,z,ry,s,sy)=>{E.set(0,ry,0);Q.setFromEuler(E);P.set(x,y,z);Sc.set(s,sy||s,s);return new T.Matrix4().compose(P,Q,Sc);};
 const occ=new Set(G.objs.map(o=>o.y*N+o.x));
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){ck=((x/9)|0)+','+((y/9)|0);const i=y*N+x,o=c.obs[i],ter=TER[c.ter[i]];const r=creeRng(i*7+3);
  if(o===OBS.MONT){const v=(x*5+y*11)%6;const g=geoMontagne(v,ter);const cx=x+1,cz=y+1;ajout('m'+v+ter,g,mk(cx,h(cx,cz)-.1,cz,r.f()*6,.95+r.f()*.25,.9+r.f()*.5),1);}
  else if(o===OBS.VEG){const type=ter==='neige'?'sapinN':ter==='sable'?(r.f()<.5?'palmier':'cactus'):ter==='lave'?'mort':ter==='marais'?(r.f()<.6?'mort':'feuillu'):ter==='terre'?(r.f()<.4?'mort':'feuillu'):ter==='rude'?(r.f()<.5?'sapin':'feuillu'):(r.f()<.25?'sapin':'feuillu');
   const n=2+r.i(0,2);for(let k=0;k<n;k++){const v=r.i(0,3);const px=x+.2+r.f()*.6,pz=y+.2+r.f()*.6;ajout('a'+type+v,geoArbre(type,v),mk(px,h(px,pz),pz,r.f()*6,1.1+r.f()*.5),1);}}
  else if(o===OBS.ROC){const n=1+r.i(0,1);for(let k=0;k<n;k++){const v=r.i(0,4);const px=x+.25+r.f()*.5,pz=y+.25+r.f()*.5;ajout('r'+v+ter,geoRocher(v,ter),mk(px,h(px,pz),pz,r.f()*6,1+r.f()*.8,.9+r.f()*.6),1);}}
  else if(!o&&c.ter[i]!==EAU&&!c.route[i]&&!occ.has(i)&&(ter==='herbe'||ter==='terre'||ter==='marais'||ter==='rude')&&r.f()<.10){// petits buissons et pierres
   const px=x+.2+r.f()*.6,pz=y+.2+r.f()*.6;if(r.f()<.6){const v=r.i(0,3);ajout('a'+(ter==='marais'?'mort':'feuillu')+v,geoArbre(ter==='marais'?'mort':'feuillu',v),mk(px,h(px,pz),pz,r.f()*6,.45+r.f()*.2),0);}else{const v=r.i(0,4);ajout('r'+v+ter,geoRocher(v,ter),mk(px,h(px,pz),pz,r.f()*6,.4+r.f()*.3),0);}}}
 const mVeg=mat(0xffffff,{vc:1,r:.82,vent:'.035'}),mPierre=mat(0xffffff,{vc:1,r:.95,plat:0});
 for(const k in lots){const L=lots[k];const im=new T.InstancedMesh(L.geo,k[0]==='a'?mVeg:mPierre,L.l.length);L.l.forEach((m,j)=>im.setMatrixAt(j,m));im.castShadow=!!L.ombre&&S.qual>=2;im.receiveShadow=true;im.instanceMatrix.needsUpdate=true;im.computeBoundingSphere();decor.add(im);}}
// ---------- bâtiments en 3D ----------
// pierre des remparts : image chargée dès le départ, texture créée seulement une fois l'image prête
const IMP=new Image();IMP.src=MOTIF_PIERRE_URI;let TEXP=null;
function texPierre(){if(TEXP)return TEXP;if(!IMP.complete||!IMP.naturalWidth)return null;const c=mkC(IMP.naturalWidth,IMP.naturalHeight);c.getContext('2d').drawImage(IMP,0,0);TEXP=new T.CanvasTexture(c);TEXP.wrapS=TEXP.wrapT=T.RepeatWrapping;TEXP.colorSpace=T.SRGBColorSpace;TEXP.repeat.set(1.5,1.5);return TEXP;}
function bloc(gr,geo,c,o,pos,rot,sc){const m=new T.Mesh(geo,mat(c,o));if(pos)m.position.set(...pos);if(rot)m.rotation.set(...rot);if(sc)m.scale.set(...sc);m.castShadow=S.qual>=2;m.receiveShadow=true;gr.add(m);return m;}
const BOX=new T.BoxGeometry(1,1,1),CYL=new T.CylinderGeometry(.5,.5,1,12),CONE=new T.ConeGeometry(.5,1,12),CONE4=new T.ConeGeometry(.5,1,4),SPH=new T.SphereGeometry(.5,14,10);
function tour(gr,x,z,r0,ht,mur,toit,forme,pierre){bloc(gr,CYL,mur,pierre,[x,ht/2,z],null,[r0*2,ht,r0*2]);if(forme==='plat'){for(let k=0;k<6;k++){const a=k/6*Math.PI*2;bloc(gr,BOX,mur,pierre,[x+Math.cos(a)*r0*.9,ht+.05,z+Math.sin(a)*r0*.9],null,[.07,.1,.07]);}}
 else bloc(gr,CONE,toit,{r:.6},[x,ht+r0*(forme==='fleche'?1.6:1.1),z],null,[r0*2.5,r0*(forme==='fleche'?3.2:2.2),r0*2.5]);}
function drapeauMesh(gr,x,y,z,coul,s=1){const m=new T.Mesh(new T.PlaneGeometry(.32*s,.2*s,6,2).translate(.16*s,0,0),mat(coul,{onde:1,r:.7}));m.position.set(x,y,z);m.material.side=T.DoubleSide;gr.add(m);const mat2=new T.Mesh(CYL,mat(0x3a2a1a));mat2.scale.set(.025,.42*s,.025);mat2.position.set(x,y-.12*s,z);gr.add(mat2);return m;}
function villeMesh(v){const gr=new T.Group();const F=FAC[v.fac].coul;const mur=new T.Color(F.mur).getHex(),toit=new T.Color(F.toit).getHex();const P={map:texPierre(),r:.9};
 if(v.fac==='horde'||v.fac==='sylve'){const bois=v.fac==='horde'?0x7a5228:0x8a6238;
  for(let k=0;k<26;k++){const a=k/26*Math.PI*2;if(Math.abs(a-Math.PI/2)<.3)continue;bloc(gr,CYL,bois,{},[Math.cos(a)*1.25,.28,Math.sin(a)*.95],null,[.09,.56+(k%2)*.08,.09]);bloc(gr,CONE,bois,{},[Math.cos(a)*1.25,.62,Math.sin(a)*.95],null,[.09,.12,.09]);}
  if(v.fac==='horde'){for(const [x,z,s] of [[-.6,-.3,.5],[.6,-.3,.5],[0,-.15,.75]]){bloc(gr,CYL,0x9a7448,{},[x,.22*s/.5,z],null,[s,.44*s/.5,s]);bloc(gr,CONE,0xc9a050,{r:.95},[x,(.44+.35)*s/.5,z],null,[s*1.25,.7*s/.5,s*1.25]);}
   for(const s of [-1,1])bloc(gr,CONE,0xe8dcc4,{},[s*.32,1.55,-.15],[0,0,s*-.5],[.06,.4,.06]);}
  else{for(const [x,z,s] of [[-.7,-.2,1],[.7,-.2,1],[0,-.35,1.3]]){bloc(gr,CYL,0x6a4a2a,{},[x,.55*s,z],null,[.16*s,1.1*s,.16*s]);for(let k=0;k<4;k++)bloc(gr,SPH,0x3f7a34,{},[x+(k%2-.5)*.3*s,1.1*s+(k>>1)*.18*s,z+((k>>1)-.5)*.2*s],null,[.5*s,.42*s,.5*s]);bloc(gr,BOX,0x9a7448,{},[x,.75*s,z+.12*s],null,[.3*s,.22*s,.24*s]);bloc(gr,CONE4,toit,{},[x,.95*s,z+.12*s],[0,Math.PI/4,0],[.36*s,.2*s,.36*s]);}}
  bloc(gr,BOX,0x3a2412,{},[0,.25,.95],null,[.4,.5,.06]);}
 else{const forme=v.fac==='necro'?'fleche':'cone';
  // remparts
  for(const [x,z,w,d] of [[0,-.85,2.3,.16],[-1.15,0,.16,1.7],[1.15,0,.16,1.7],[-.75,.85,.8,.16],[.75,.85,.8,.16]]){bloc(gr,BOX,mur,P,[x,.3,z],null,[w,.6,d]);const n=Math.round(Math.max(w,d)/.18);for(let k=0;k<n;k++){const t=(k+.5)/n-.5;bloc(gr,BOX,mur,P,[x+(w>d?t*w:0),.66,z+(w>d?0:t*d)],null,[.09,.12,.09]);}}
  for(const [x,z] of [[-1.15,-.85],[1.15,-.85],[-1.15,.85],[1.15,.85]])tour(gr,x,z,.2,.95,mur,toit,forme,P);
  tour(gr,-.4,.85,.17,.8,mur,toit,forme,P);tour(gr,.4,.85,.17,.8,mur,toit,forme,P);
  // donjon
  bloc(gr,BOX,mur,P,[0,.75,-.2],null,[.9,1.5,.75]);bloc(gr,CONE4,toit,{r:.6},[0,1.5+(forme==='fleche'?.6:.4),-.2],[0,Math.PI/4,0],[1.25,forme==='fleche'?1.2:.8,1.05]);
  tour(gr,-.42,-.55,.16,1.75,mur,toit,forme,P);tour(gr,.42,-.55,.16,1.75,mur,toit,forme,P);
  for(let k=0;k<3;k++)bloc(gr,BOX,0xffd87a,{em:0xffb040,ei:.8},[-.25+k*.25,1.05,.18],null,[.08,.14,.02]);
  bloc(gr,BOX,0x3a2412,{},[0,.22,.88],null,[.36,.44,.08]);
  if(v.fac==='necro')bloc(gr,SPH,0x7cf7a2,{em:0x7cf7a2,ei:2},[0,1.2,.2],null,[.12,.12,.12]);}
 gr.scale.setScalar(.95);gr.userData.drap=drapeauMesh(gr,0,v.fac==='horde'||v.fac==='sylve'?2.0:2.25,-.2,v.prop>=0?COULEURS[G.joueurs[v.prop].coul].c:'#d8d2c2',1.4);
 return gr;}
function mineMesh(o){const gr=new T.Group();let g=new T.SphereGeometry(.55,16,10,0,Math.PI*2,0,Math.PI/2);g=bruiter(g,.25,o.id);const col={or:0x8a7a5a,minerai:0x7a7670,mercure:0x6a7078,soufre:0x8a7a40,cristal:0x6a5a6a,gemmes:0x5a6a6a,bois:0x6a5a3a}[o.res];
 if(o.res==='bois'){bloc(gr,BOX,0x8a6238,{},[0,.25,-.1],null,[.8,.5,.5]);bloc(gr,CONE4,0x6a4a2a,{},[0,.65,-.1],[0,Math.PI/4,0],[1.1,.35,.75]);for(let k=0;k<3;k++)bloc(gr,CYL,0xa87a48,{},[-.25+k*.15,.08+k%2*.06,.35],[0,0,Math.PI/2],[.12,.5,.12]);
  const roue=new T.Group();roue.position.set(.45,.45,-.1);for(let k=0;k<4;k++)bloc(roue,BOX,0xc8b48a,{},[0,0,0],[0,0,k*Math.PI/4],[.06,.7,.04]);gr.add(roue);gr.userData.tourne=roue;}
 else{const m=bloc(gr,g,col,{},[0,0,-.15],null,[1.1,1.1,1]);bloc(gr,BOX,0x120c08,{r:1},[0,.17,.32],null,[.3,.34,.1]);for(const s of [-1,1])bloc(gr,BOX,0x7a5228,{},[s*.18,.2,.36],null,[.05,.4,.05]);bloc(gr,BOX,0x7a5228,{},[0,.4,.36],null,[.42,.05,.05]);
  const pile={or:0xf2c23a,minerai:0x9a9a9a,mercure:0xd8e8f0,soufre:0xe8d23a,cristal:0xe0384a,gemmes:0x3ac85a}[o.res];for(let k=0;k<5;k++)bloc(gr,o.res==='cristal'||o.res==='gemmes'?new T.OctahedronGeometry(.08):SPH,o.res==='gemmes'?[0x3a7ae8,0x3ac85a,0xe83a8a,0xf0d03a,0x3ac8e8][k]:pile,{r:.3,m:o.res==='or'||o.res==='mercure'?.7:0,em:o.res==='cristal'||o.res==='gemmes'?pile:null,ei:.25},[-.3+k*.14,.07,.48+(k%2)*.08],null,o.res==='cristal'||o.res==='gemmes'?[1,1.6,1]:[.14,.1,.14]);}
 gr.userData.drap=drapeauMesh(gr,.3,.95,-.1,o.prop>=0?COULEURS[G.joueurs[o.prop].coul].c:'#d8d2c2',.9);return gr;}
function pileMesh(o){const gr=new T.Group();const r=o.res;
 if(r==='or'){for(let k=0;k<7;k++)bloc(gr,CYL,0xf2c23a,{r:.3,m:.45,em:0x6a4a00,ei:.4},[(k%3-1)*.12,.03+(k/3|0)*.05,((k*7)%3-1)*.08],null,[.14,.04,.14]);}
 else if(r==='bois'){for(let k=0;k<5;k++)bloc(gr,CYL,0x8a5a30,{},[(k%3-1)*.1,.06+(k>2?.1:0),0],[Math.PI/2,0,.3],[.1,.45,.1]);}
 else if(r==='minerai'){for(let k=0;k<4;k++){const m=bloc(gr,geoRocher(k,'rude'),0x8a8f96,{},[(k%2-.5)*.18,0,((k>>1)-.5)*.15],null,[.6,.6,.6]);}}
 else if(r==='mercure'){bloc(gr,SPH,0xcfe3ea,{r:.05,m:.2,transp:.75},[0,.16,0],null,[.28,.28,.28]);bloc(gr,CYL,0x8a5a30,{},[0,.33,0],null,[.08,.08,.08]);bloc(gr,SPH,0xb8c0cc,{r:.15,m:1},[0,.12,0],null,[.2,.12,.2]);}
 else if(r==='soufre'){bloc(gr,CONE,0xe8d23a,{r:.9},[0,.12,0],null,[.45,.24,.45]);}
 else{const cs=r==='cristal'?[0xe0384a]:[0x3a7ae8,0x3ac85a,0xe83a8a,0xf0d03a];for(let k=0;k<5;k++)bloc(gr,new T.OctahedronGeometry(.09),cs[k%cs.length],{r:.2,em:cs[k%cs.length],ei:.35},[(k%3-1)*.12,.12,((k*5)%3-1)*.1],[0,k,0],[1,1.8,1]);}
 return gr;}
function coffreMesh(){const gr=new T.Group(); bloc(gr,BOX,0x8a5a2a,{},[0,.14,0],null,[.5,.28,.32]);bloc(gr,CYL,0x9a6a32,{},[0,.28,0],[0,0,Math.PI/2],[.32,.5,.32]);bloc(gr,BOX,0xd8b040,{m:.7,r:.3},[0,.2,.17],null,[.08,.1,.02]);return gr;}
function lieuMesh(o){const gr=new T.Group();const b=o.b;
 switch(b){
 case 'moulin':{bloc(gr,CYL,0xd8cbb0,{},[0,.5,0],null,[.45,1,.45]);bloc(gr,CONE,0x8a3a2a,{},[0,1.15,0],null,[.6,.35,.6]);const ail=new T.Group();ail.position.set(0,.9,.27);for(let k=0;k<4;k++)bloc(ail,BOX,0xe8dcc0,{},[0,0,0],[0,0,k*Math.PI/2],[.08,.9,.02]).geometry=new T.BoxGeometry(1,1,1).translate(0,.5,0);gr.add(ail);gr.userData.tourne=ail;break;}
 case 'puits':bloc(gr,CYL,0x9a948a,{map:texPierre()},[0,.15,0],null,[.5,.3,.5]);bloc(gr,CYL,0x2a5a7a,{r:.1},[0,.29,0],null,[.4,.02,.4]);for(const s of [-1,1])bloc(gr,BOX,0x6a4a2a,{},[s*.22,.45,0],null,[.04,.6,.04]);bloc(gr,CONE4,0x8a3a2a,{},[0,.82,0],[0,Math.PI/4,0],[.7,.3,.5]);break;
 case 'autel':bloc(gr,BOX,0xa8a296,{map:texPierre()},[0,.18,0],null,[.6,.36,.4]);bloc(gr,CONE,0xff8a2a,{em:0xff6a1a,ei:2.5},[0,.48,0],null,[.18,.35,.18]);break;
 case 'pierre':bloc(gr,BOX,0x7a7a84,{map:texPierre()},[0,.45,0],[0,0,.08],[.28,.9,.18]);bloc(gr,BOX,0x9ae8ff,{em:0x7ad8ff,ei:2},[0,.5,.095],null,[.05,.4,.01]);break;
 case 'arbre':{const g=geoArbre('feuillu',1);const m=new T.Mesh(g,mat(0xffd860,{vc:1,em:0x806000,ei:.35,vent:'.03'}));m.scale.setScalar(2);m.castShadow=true;gr.add(m);break;}
 case 'tour':tour(gr,0,0,.22,1.4,0x9a948a,0x6a6a72,'plat',{map:texPierre()});break;
 case 'sanctuaire':bloc(gr,BOX,0xd8d2c2,{},[0,.05,0],null,[.8,.1,.6]);for(let k=0;k<4;k++)bloc(gr,CYL,0xece6d6,{},[(k%2-.5)*.6,.4,((k>>1)-.5)*.4],null,[.08,.7,.08]);bloc(gr,CONE4,0xd8d2c2,{},[0,.95,0],[0,Math.PI/4,0],[1.05,.35,.85]);bloc(gr,SPH,0xd8c0ff,{em:0xbfa0ff,ei:2},[0,.45,0],null,[.12,.12,.12]);break;
 case 'ecurie':bloc(gr,BOX,0x9a6a3a,{},[0,.25,0],null,[.9,.5,.55]);bloc(gr,CONE4,0x7a3a2a,{},[0,.62,0],[0,Math.PI/4,0],[1.25,.3,.8]);bloc(gr,BOX,0x3a2412,{},[0,.2,.28],null,[.25,.4,.02]);break;
 case 'feu':for(const s of [-1,1])bloc(gr,CONE4,0xc8b48a,{},[s*.32,.22,0],[0,Math.PI/4,0],[.45,.44,.45]);bloc(gr,CONE,0xffb03a,{em:0xff8a2a,ei:2.5},[0,.15,.2],null,[.14,.3,.14]);bloc(gr,CYL,0xf2c23a,{m:.8,r:.3},[.2,.03,.3],null,[.12,.04,.12]);break;
 case 'fontaine':bloc(gr,CYL,0x9a948a,{map:texPierre()},[0,.08,0],null,[.75,.16,.75]);bloc(gr,CYL,0x4a9ac8,{r:.1,m:.2},[0,.15,0],null,[.65,.02,.65]);bloc(gr,CYL,0xbcb6aa,{},[0,.35,0],null,[.08,.5,.08]);bloc(gr,SPH,0xbfe8ff,{transp:.6,em:0x6ab8e8,ei:.4},[0,.62,0],null,[.18,.12,.18]);break;
 case 'obelisque':bloc(gr,CONE4,0x8a8478,{map:texPierre()},[0,.65,0],[0,Math.PI/4,0],[.32,1.3,.32]);bloc(gr,BOX,0xffe08a,{em:0xffd060,ei:2},[0,.6,.09],null,[.04,.5,.01]);bloc(gr,BOX,0x9a948a,{},[0,.05,0],null,[.5,.1,.5]);break;
 case 'habitation':{let g=new T.SphereGeometry(.5,14,8,0,Math.PI*2,0,Math.PI/2);g=bruiter(g,.25,o.id+3);bloc(gr,g,0x7a6a52,{},[0,0,-.1],null,[1.1,1.1,1]);bloc(gr,BOX,0x120c08,{},[0,.15,.38],null,[.3,.3,.05]);break;}
 }return gr;}
function artefactMesh(o){const gr=new T.Group();bloc(gr,CYL,0xbcb6aa,{},[0,.06,0],null,[.32,.12,.32]);const g=bloc(gr,new T.OctahedronGeometry(.13),0xffe08a,{em:0xffc040,ei:1.6,r:.2,m:.5},[0,.38,0],null,[1,1.5,1]);gr.userData.flotte=g;return gr;}
// ---------- panneaux (créatures, héros, habitants) ----------
const TXC=new Map();function texCanvas(c,cle){if(TXC.has(cle))return TXC.get(cle);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;TXC.set(cle,t);return t;}
// panneau penché à mi-chemin entre la verticale et la caméra : se lit bien sans traverser les murs voisins
const GPAN=new T.PlaneGeometry(1,1).translate(0,.4,0);const PANM=new Map();
function panneau(canvas,cle,taille,miroir){const k=cle+(miroir?'-':'');let m=PANM.get(k);if(!m){const t=texCanvas(canvas,cle);m=brume(new T.MeshBasicMaterial({map:t,transparent:true,alphaTest:.12,side:T.DoubleSide}));if(miroir){m.map=t.clone();m.map.repeat.x=-1;m.map.offset.x=1;m.map.needsUpdate=true;}PANM.set(k,m);}
 const s=new T.Mesh(GPAN,m);s.userData.pan=1;s.scale.set(taille,taille*PAN_K,1);s.rotation.x=-PAN_A;s.renderOrder=2;return s;}
function objet3D(o){let g=null;
 switch(o.t){case 'ville':g=villeMesh(o);break;case 'mine':g=mineMesh(o);break;case 'res':g=pileMesh(o);break;case 'coffre':g=coffreMesh();break;case 'artefact':g=artefactMesh(o);break;
  case 'bat':g=lieuMesh(o);if(o.b==='habitation'&&o.cre){const s=panneau(spriteCreature(o.cre,128),'c'+o.cre+'128',.9);s.position.set(.25,0,.3);g.add(s);}break;
  case 'monstre':{g=new T.Group();const s=panneau(spriteMiroir(o.cre,160),'m'+o.cre+'160',1.75);g.add(s);g.userData.sprite=s;break;}}
 if(!g)return null;const y=o.t==='ville'?sol(o.x,o.y-.4):sol(o.x,o.y);g.position.set(o.x+.5,y,o.y+.5+(o.t==='ville'?-1.05:o.t==='mine'?-.45:0));
 g.userData.id=o.id;g.userData.prop=o.prop;g.userData.tile=o.y*N+o.x;g.traverse(m=>m.userData.tile=o.y*N+o.x);return g;}
// ---------- chemin, sélection ----------
function construireAides(){const sh=new T.Shape();sh.moveTo(.16,0);sh.lineTo(-.1,-.11);sh.lineTo(-.04,0);sh.lineTo(-.1,.11);sh.closePath();const g=new T.ShapeGeometry(sh);g.rotateX(-Math.PI/2);
 fleches=new T.InstancedMesh(g,new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.95,depthWrite:false}),400);fleches.count=0;fleches.renderOrder=3;scene.add(fleches);
 anneau=new T.Mesh(new T.RingGeometry(.36,.46,32).rotateX(-Math.PI/2),new T.MeshBasicMaterial({color:0xffe08a,transparent:true,opacity:.8,depthWrite:false}));anneau.renderOrder=2;scene.add(anneau);
 const cg=new T.Group();for(const r of [.785,-.785]){const b=new T.Mesh(new T.BoxGeometry(.5,.04,.08),new T.MeshBasicMaterial({color:0xe83a2a}));b.rotation.y=r;cg.add(b);}croixG=cg;scene.add(croixG);}
let cheminCle='';function majChemin(){const c=V.chemin;const cle=c?c.h+':'+c.dest+':'+c.ch.length+':'+(heroPar(c.h)||{}).mp:'';if(cle===cheminCle)return;cheminCle=cle;if(!c){fleches.count=0;return;}const h0=heroPar(c.h);if(!h0){fleches.count=0;return;}
 const M=new T.Matrix4(),Q=new T.Quaternion(),P=new T.Vector3(),Sc=new T.Vector3(1,1,1);const col=new T.Color();let n=0;
 for(let k=0;k<c.ch.length&&n<400;k++){const [x,y]=xy(c.ch[k]);const fin=k===c.ch.length-1;const ok=c.cout[k]<=h0.mp;let a=0;if(!fin){const [nx,ny]=xy(c.ch[k+1]);a=Math.atan2(ny-y,nx-x);}else{const [px,py]=k?xy(c.ch[k-1]):[h0.x,h0.y];a=Math.atan2(y-py,x-px);}
  Q.setFromAxisAngle(new T.Vector3(0,1,0),-a);P.set(x+.5,sol(x,y)+.06,y+.5);Sc.setScalar(fin?1.6:1);M.compose(P,Q,Sc);fleches.setMatrixAt(n,M);fleches.setColorAt(n,col.set(ok?0x6ae86a:0xe85a4a));n++;}
 fleches.count=n;fleches.instanceMatrix.needsUpdate=true;if(fleches.instanceColor)fleches.instanceColor.needsUpdate=true;}
// ---------- synchronisation avec la partie ----------
function majObjets(){const vu=G.joueurs[vueJoueur()].vu;const vus=new Set();
 for(const o of G.objs){vus.add(o.id);let g=objets.get(o.id);if(g&&(g.userData.prop!==o.prop||(o.t==='ville'&&g.userData.bat!==Object.keys(o.bat).length))){scene.remove(g);g=null;objets.delete(o.id);}
  if(!g){g=objet3D(o);if(!g)continue;if(o.t==='ville')g.userData.bat=Object.keys(o.bat).length;objets.set(o.id,g);grp.add(g);}
  // visible si la case (ou une case de l'emprise d'une ville) a été explorée
  g.visible=!!(vu[o.y*N+o.x]||(o.t==='ville'&&vu[(o.y-1)*N+o.x]));}
 for(const [id,g] of objets)if(!vus.has(id)){grp.remove(g);objets.delete(id);}}
function majHeros(){const vu=G.joueurs[vueJoueur()].vu;const ids=new Set();
 for(const h of G.heros){ids.add(h.id);const dir=V.anim&&V.anim.h===h?(V.anim.x1<V.anim.x0?-1:V.anim.x1>V.anim.x0?1:(h.dir||1)):(h.dir||1);const cle=h.classe+':'+h.j+':'+dir;let s=herosS.get(h.id);
  if(!s||s.userData.cle!==cle){if(s)grp.remove(s);s=panneau(spriteHeros(h,128),'h'+h.classe+h.j,1.45,dir<0);s.userData.cle=cle;s.userData.tile=-h.id;herosS.set(h.id,s);grp.add(s);}
  const [hx,hy]=posHeros(h);const bob=V.anim&&V.anim.h===h?Math.abs(Math.sin(performance.now()/60))*.05:0;const enV=G.occ[Math.round(hy)*N+Math.round(hx)]&&(G.oi[G.occ[Math.round(hy)*N+Math.round(hx)]]||{}).t==='ville';s.position.set(hx+.5,sol(Math.round(hx),Math.round(hy))+bob,hy+.55+(enV?.3:0));s.visible=!!vu[Math.round(hy)*N+Math.round(hx)];}
 for(const [id,s] of herosS)if(!ids.has(id)){grp.remove(s);herosS.delete(id);}}
// ---------- caméra ----------
function placerCam(){const d=C3.dist;const t=C3.tang;cam.position.set(C3.cible.x,C3.cible.y+d*Math.sin(t),C3.cible.z+d*Math.cos(t));cam.lookAt(C3.cible);
 soleil.position.set(C3.cible.x-8,C3.cible.y+16,C3.cible.z+6);soleil.target.position.copy(C3.cible);soleil.target.updateMatrixWorld();const sc=soleil.shadow.camera;const e=Math.max(10,d*1.25);sc.left=-e;sc.right=e;sc.top=e;sc.bottom=-e;sc.updateProjectionMatrix();}
function borner3(){C3.cible.x=Math.max(0,Math.min(N,C3.cible.x));C3.cible.z=Math.max(0,Math.min(N+2,C3.cible.z));C3.dist=Math.max(5.5,Math.min(30,C3.dist));C3.cible.y=Math.max(0,h(C3.cible.x,C3.cible.z))*.5;}
// ---------- API ----------
const A={ok:true,actif:false};
// qualité : 2 = ombres + image fine, 1 = sans ombres, 0 = image allégée. Baisse automatique si l'appareil peine (mémorisée).
function qualDepart(){const q=new URLSearchParams(location.search).get('q3d');if(q!=null){S.fixe=true;return +q;}let m=null;try{m=localStorage.getItem('bs-q3d');}catch(e){}return m!=null?+m:(estMobile()?1:2);}
const SURV={t0:0,l:[]};function surveiller(){if(S.fixe||S.qual<=0)return;const t=performance.now();if(SURV.der&&t-SURV.der<200&&performance.now()-(V.activite||0)<1500)SURV.l.push(t-SURV.der);SURV.der=t;
 if(SURV.l.length>=90){const l=SURV.l.sort((a,b)=>a-b);const med=l[l.length>>1];SURV.l=[];if(med>27){A.qualite(S.qual-1);try{localStorage.setItem('bs-q3d',S.qual);}catch(e){}console.log('qualité 3D abaissée',S.qual,med);}}}
A.init=async()=>{const cv=document.getElementById('carte3d');S.qual=qualDepart();
 if(!ren){try{ren=new T.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance'});}catch(e){A.ok=false;return false;}
  ren.outputColorSpace=T.SRGBColorSpace;ren.toneMapping=T.ACESFilmicToneMapping;ren.toneMappingExposure=.92;ren.shadowMap.enabled=true;ren.shadowMap.type=T.PCFSoftShadowMap;}
 if(!IMP.complete)await IMP.decode().catch(()=>{});
 if(scene)A.vider();scene=new T.Scene();scene.background=new T.Color(0x0a0806);
 const pm=new T.PMREMGenerator(ren);env=pm.fromScene(new T.RoomEnvironment(),.04).texture;pm.dispose();scene.environment=env;scene.environmentIntensity=.35;
 hemi=new T.HemisphereLight(0xdfe8ff,0x4a3a24,.75);scene.add(hemi);soleil=new T.DirectionalLight(0xffe8c8,2.1);soleil.castShadow=S.qual>=2;soleil.shadow.mapSize.set(2048,2048);soleil.shadow.bias=-.0006;soleil.shadow.normalBias=.02;scene.add(soleil);scene.add(soleil.target);
 cam=new T.PerspectiveCamera(38,1,.1,200);
 N=G.carte.N;fogData=new Uint8Array(N*N);fogTex=new T.DataTexture(fogData,N,N,T.RedFormat);fogTex.magFilter=T.LinearFilter;fogTex.minFilter=T.LinearFilter;U.fog.value=fogTex;U.N.value=N;majBrume();
 construireTerrain();construireDecor();grp=new T.Group();scene.add(grp);objets.clear();herosS.clear();construireAides();
 A.redim();A.actif=true;V.fogDirty=false;return true;};
A.vider=()=>{if(!scene)return;scene.traverse(o=>{if(o.geometry&&!Object.values(GEO).includes(o.geometry)&&![BOX,CYL,CONE,CONE4,SPH].includes(o.geometry))o.geometry.dispose();});for(const t of TXC.values())t.dispose();TXC.clear();if(terrain)terrain.material.map.dispose();scene=null;objets.clear();herosS.clear();};
A.redim=()=>{if(!ren)return;const dpr=Math.min(devicePixelRatio||1,S.qual>=2?1.5:S.qual>=1?1.25:1);ren.setPixelRatio(dpr);ren.setSize(innerWidth,innerHeight,false);if(cam){cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();}};
A.rendre=()=>{if(!A.actif||!G)return;const t=performance.now()/1000;U.t.value=t;
 if(V.fogDirty){majBrume();V.fogDirty=false;}
 majObjets();majHeros();majChemin();
 // animations : ailes des moulins, roues, artefacts, drapeaux
 for(const g of objets.values()){if(!g.visible)continue;if(g.userData.tourne)g.userData.tourne.rotation.z=t*1.2;if(g.userData.flotte){g.userData.flotte.position.y=.38+Math.sin(t*2+g.userData.id)*.05;g.userData.flotte.rotation.y=t;}if(g.userData.sprite)g.userData.sprite.position.y=Math.abs(Math.sin(t*2+g.userData.id))*.03;}
 const hs=V.sel&&V.sel.t==='heros'?heroPar(V.sel.id):null;anneau.visible=!!hs;if(hs){const [hx,hy]=posHeros(hs);anneau.position.set(hx+.5,sol(Math.round(hx),Math.round(hy))+.04,hy+.5);anneau.material.opacity=.55+.3*Math.sin(t*4);}
 croixG.visible=graalConnu(vueJoueur());if(croixG.visible){const [gx,gy]=xy(G.carte.graal);croixG.position.set(gx+.5,sol(gx,gy)+.05,gy+.5);}
 eau.material.opacity=.6+Math.sin(t*.8)*.03;
 surveiller();borner3();placerCam();PAN_A=C3.tang*.5;PAN_K=1/Math.cos(C3.tang*.5);ren.render(scene,cam);V.images++;};
function opaque(hh){const im=hh.object.material.map&&hh.object.material.map.image;if(!im||!hh.uv)return true;let u=hh.uv.x;if(hh.object.material.map.repeat.x<0)u=1-u;try{const g=im.getContext('2d');const d=g.getImageData(Math.floor(u*(im.width-1)),Math.floor((1-hh.uv.y)*(im.height-1)),1,1).data;return d[3]>60;}catch(e){return true;}}
A.caseSous=(cx,cy)=>{if(!cam)return-1;v2.set(cx/innerWidth*2-1,-(cy/innerHeight)*2+1);RC.setFromCamera(v2,cam);
 const hitsO=RC.intersectObjects(grp.children,true).filter(h=>h.object.visible&&h.object.parent&&(h.object.isSprite||h.object.isMesh));
 for(const hh of hitsO){if(hh.object.userData.pan&&!opaque(hh))continue;let o=hh.object;while(o&&o.userData.tile==null)o=o.parent;if(o&&o.userData.tile!=null){const t=o.userData.tile;if(t<0){const he=heroPar(-t);if(he)return he.y*N+he.x;}else return t;}}
 const hit=RC.intersectObject(terrain)[0];if(!hit)return-1;const x=Math.floor(hit.point.x),y=Math.floor(hit.point.z);if(x<0||y<0||x>=N||y>=N)return-1;return y*N+x;};
A.ecran=(x,y)=>{const p=new T.Vector3(x+.5,sol(x,y)+.5,y+.5).project(cam);return[(p.x+1)/2*innerWidth,(1-p.y)/2*innerHeight];};
A.centrer=(x,y)=>{C3.cible.set(x+.5,0,y+.5);C3.dist=16/(V.zoom||1);borner3();};
A.deplacer=(dx,dy)=>{const k=2*C3.dist*Math.tan(cam.fov*Math.PI/360)/innerHeight;C3.cible.x-=dx*k;C3.cible.z-=dy*k/Math.cos(C3.tang)*.75;borner3();};
A.zoomer=z=>{C3.dist=16/z;borner3();};
A.suivre=(x,y)=>{const p=new T.Vector3(x+.5,0,y+.5).project(cam);if(Math.abs(p.x)>.5||Math.abs(p.y)>.5){C3.cible.x+=(x+.5-C3.cible.x)*.25;C3.cible.z+=(y+.5-C3.cible.z)*.25;borner3();}};
// rectangle vu (pour la mini-carte) : intersections des coins de l'écran avec le sol
A.vue=()=>{const pts=[];for(const [sx,sy] of [[-1,-1],[1,-1],[1,1],[-1,1]]){v2.set(sx,sy);RC.setFromCamera(v2,cam);const d=RC.ray.direction;const o=RC.ray.origin;if(d.y>=-1e-3){pts.push([o.x+d.x*60,o.z+d.z*60]);continue;}const t=-o.y/d.y;pts.push([o.x+d.x*t,o.z+d.z*t]);}return pts;};
A.qualite=q=>{S.qual=Math.max(0,Math.min(2,q));if(soleil)soleil.castShadow=S.qual>=2;if(scene)scene.traverse(o=>{if(o.material&&o.material.needsUpdate!==undefined&&o.isMesh)o.material.needsUpdate=true;});A.redim();};A.niveau=()=>S.qual;
A.ouvrir=()=>{document.getElementById('carte3d').style.display='block';V.vide=false;};
A.fermer=()=>{A.actif=false;document.getElementById('carte3d').style.display='none';V.fogDirty=true;V.vide=false;};
A._scene=()=>scene;A._ren=()=>ren;
A.info=()=>ren?{calls:ren.info.render.calls,tris:ren.info.render.triangles,geo:ren.info.memory.geometries,tex:ren.info.memory.textures}:null;

// =========================================================
// CHAMP DE BATAILLE EN 3D : décor rendu une fois par combat (sol, lisière, montagnes, ville assiégée, obstacles),
// puis les créatures dessinées par-dessus. La caméra donne la vraie perspective des hexagones (centreHex).
// =========================================================
function hexMonde(h){const q=h%CW,r=(h/CW)|0;return[q-7+(r&1)*.5-.25,r*.866];}
A.camCombat=(geo,Hs)=>{let cam;const W=geo.W;
 if(geo.port){const w=geo.w,phi=Math.asin(SQP);cam=new T.OrthographicCamera();const Zt=(W/2-geo.ox-geo.h/2)/w,Ky=geo.oy+w*SQP*7.75,Xt=(Ky-Hs/2)/(w*SQP);
  const tgt=new T.Vector3(Xt,0,Zt);const fw=new T.Vector3(Math.cos(phi),-Math.sin(phi),0);cam.position.copy(tgt).addScaledVector(fw,-40);cam.up.set(0,1,0);cam.lookAt(tgt);
  cam.left=-W/2/w;cam.right=W/2/w;cam.top=Hs/2/w;cam.bottom=-Hs/2/w;cam.near=.1;cam.far=200;cam.updateProjectionMatrix();cam.updateMatrixWorld();return{cam,p3:null};}
 const w=geo.w,phi=Math.asin(SQ),Zf=10*.866;const df=Zf*Math.cos(phi)*PS0/(1-PS0);const f=w*df;
 // rangée de devant : même place que l'ancien dessin
 let yf=geo.oy+geo.h*SQ*PS0/2;for(let k=0;k<10;k++)yf+=geo.h*.75*SQ*(echRang(k)+echRang(k+1))/2;
 cam=new T.PerspectiveCamera();const Pf=new T.Vector3(0,0,Zf);cam.position.set(0,df*Math.sin(phi),Zf+df*Math.cos(phi));cam.lookAt(Pf);cam.updateMatrixWorld();
 const n=.5,cx=W/2,cy=yf;cam.projectionMatrix.makePerspective(-cx*n/f,(W-cx)*n/f,cy*n/f,-(Hs-cy)*n/f,n,400);cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
 const p3=[];const v=new T.Vector3();for(let h=0;h<CW*CH;h++){const [x,z]=hexMonde(h);v.set(x,0,z);const d=-v.clone().applyMatrix4(cam.matrixWorldInverse).z;v.project(cam);p3.push({x:(v.x+1)/2*W,y:(1-v.y)/2*Hs,s:df/d});}
 return{cam,p3};};
function texSolCombat(ter){const c=mkC(1024,1024),g=c.getContext('2d');const P=PAL[ter]||PAL.herbe;const r=creeRng(91);const [T1,T2]=textures();
 g.fillStyle=`rgb(${P[1]})`;g.fillRect(0,0,1024,1024);const img=g.getImageData(0,0,1024,1024),d=img.data;
 for(let y=0;y<1024;y++)for(let x=0;x<1024;x++){const o=(y*1024+x)*4;const a=T1[((y>>2)&255)*256+((x>>2)&255)],b=T2[(y&255)*256+(x&255)];const v=(a-.5)*70+(b-.5)*34;const m=Math.max(0,Math.min(1,(a-.45)*4));
  d[o]=d[o]*(1-m*.35)+P[0][0]*m*.35+v;d[o+1]=d[o+1]*(1-m*.35)+P[0][1]*m*.35+v;d[o+2]=d[o+2]*(1-m*.35)+P[0][2]*m*.35+v*.8;
  if(ter==='lave'&&Math.abs(b-.5)<.005&&a<.55){d[o]=255;d[o+1]=110;d[o+2]=30;}}
 g.putImageData(img,0,0);
 // plaques de terre, touffes, fleurs, cailloux
 const sec=ter==='sable'||ter==='lave'||ter==='neige';
 for(let k=0;k<26;k++){const x=r.f()*1024,y=r.f()*1024,rr=20+r.f()*50;const gr=g.createRadialGradient(x,y,1,x,y,rr);gr.addColorStop(0,sec?`rgba(${P[2]},.35)`:'rgba(120,92,52,.4)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.beginPath();g.ellipse(x,y,rr,rr*.7,r.f()*3,0,7);g.fill();}
 if(!sec)for(let k=0;k<900;k++){const x=r.f()*1024,y=r.f()*1024;g.strokeStyle=`rgba(${P[0]},.7)`;g.lineWidth=1.4;g.beginPath();for(let b=0;b<4;b++){g.moveTo(x+b*2-3,y);g.lineTo(x+b*2-3+(r.f()-.5)*4,y-5-r.f()*5);}g.stroke();}
 if(ter==='herbe')for(let k=0;k<160;k++){g.fillStyle=['#f2e6a0','#e8a0b8','#ffffff','#c8b0f0'][k%4];g.beginPath();g.arc(r.f()*1024,r.f()*1024,1.8,0,7);g.fill();}
 for(let k=0;k<120;k++){const x=r.f()*1024,y=r.f()*1024;g.fillStyle='rgba(30,24,16,.35)';g.beginPath();g.ellipse(x+1,y+1.5,4,2.5,0,0,7);g.fill();g.fillStyle=ter==='neige'?'#9aa4b4':'#8a8478';g.beginPath();g.ellipse(x,y,3.5,2.4,0,0,7);g.fill();}
 const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(4,4);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;return t;}
function arbreType(ter,r){return ter==='neige'?'sapinN':ter==='sable'?(r.f()<.5?'palmier':'cactus'):ter==='lave'?'mort':ter==='marais'?(r.f()<.5?'mort':'feuillu'):ter==='rude'?(r.f()<.5?'sapin':'feuillu'):(r.f()<.3?'sapin':'feuillu');}
const BLANC=(()=>{const t=new T.DataTexture(new Uint8Array([255]),1,1,T.RedFormat);t.needsUpdate=true;return t;})();
let CR=null;// rendu des combats (contexte partagé avec la carte quand elle existe)
function rendu(){if(ren)return ren;if(CR)return CR;try{CR=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:false});CR.outputColorSpace=T.SRGBColorSpace;CR.toneMapping=T.ACESFilmicToneMapping;CR.shadowMap.enabled=true;CR.shadowMap.type=T.PCFSoftShadowMap;}catch(e){CR=null;}return CR;}
A.fondCombat=(C,geo,cam,Hs,dpr)=>{const R0=rendu();if(!R0)return null;const ter=C.terrain==='eau'?'herbe':C.terrain;const W=Math.round(geo.W);Hs=Math.round(Hs);
 const sc=new T.Scene();const fog0=U.fog.value,n0=U.N.value;U.fog.value=BLANC;U.N.value=1;
 const lave=ter==='lave',neige=ter==='neige';
 sc.background=new T.Color(lave?0x2a0e0a:neige?0xc8d4e2:0x7aa0c8);
 const pm=new T.PMREMGenerator(R0);const envC=pm.fromScene(new T.RoomEnvironment(),.04).texture;pm.dispose();sc.environment=envC;sc.environmentIntensity=.3;
 sc.add(new T.HemisphereLight(0xdfe8ff,0x4a3a24,.8));const sun=new T.DirectionalLight(lave?0xffb890:0xffe8c8,2.2);sun.position.set(-9,14,12);sun.target.position.set(0,0,4);sc.add(sun,sun.target);
 sun.castShadow=!window.DBG_NOSH;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-22,right:22,top:20,bottom:-20,near:1,far:60});sun.shadow.bias=-.0006;sun.shadow.normalBias=.03;sun.shadow.camera.updateProjectionMatrix();
 if(lave){const l=new T.PointLight(0xff5a1a,40,30);l.position.set(0,3,-6);sc.add(l);}
 // sol : légère ondulation hors du champ, rives et collines au loin
 const nz=bruit(77);const gs=new T.PlaneGeometry(80,70,120,105);gs.rotateX(-Math.PI/2);gs.translate(0,0,-6);const p=gs.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);const dx=Math.max(0,Math.abs(x)-8.5),dz=Math.max(0,-.8-z)+Math.max(0,z-10);const k=Math.min(1,(dx+dz)/4);let y=(nz.fbm(x/6,z/6,3)-.5)*1.4*k;if(z<-6)y+=Math.pow(Math.max(0,-z-6),1.35)*.35;p.setY(i,y);}gs.computeVertexNormals();
 const ms=new T.MeshStandardMaterial({map:texSolCombat(ter),roughness:.95});const msol=new T.Mesh(gs,ms);msol.receiveShadow=true;sc.add(msol);
 if(C.terrain==='eau'||ter==='marais'){const e=new T.Mesh(new T.PlaneGeometry(80,14).rotateX(-Math.PI/2),new T.MeshStandardMaterial({color:ter==='marais'?0x3a5a3a:0x2d6f9c,roughness:.1,metalness:.2,transparent:true,opacity:.75}));e.position.set(0,.05,-9);sc.add(e);}
 // lisière : arbres, rochers et montagnes en arrière-plan et sur les côtés
 const r=creeRng(C.terrain.length*31+7);const add=(geo,m,x,y,z,s,sy,ry)=>{const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.scale.set(s,sy||s,s);o.rotation.y=ry||0;o.castShadow=true;o.receiveShadow=true;sc.add(o);return o;};
 const mV=mat(0xffffff,{vc:1,r:.82}),mP=mat(0xffffff,{vc:1,r:.95});
 const hS=(x,z)=>{let y=(nz.fbm(x/6,z/6,3)-.5)*1.4*Math.min(1,(Math.max(0,Math.abs(x)-8.5)+Math.max(0,-.8-z)+Math.max(0,z-10))/4);if(z<-6)y+=Math.pow(Math.max(0,-z-6),1.35)*.35;return y;};
 for(let k=0;k<150;k++){let x,z;const zone=r.f();if(zone<.55){x=(r.f()-.5)*36;z=-1.6-r.f()*6.5;}else{const sd=r.f()<.5?-1:1;x=sd*(9.3+r.f()*6);z=-2+r.f()*13;}
  if(C.ville&&x>5&&z<6)continue;
  if(lave||ter==='sable'&&r.f()<.4){add(geoRocher(k%5,ter),mP,x,hS(x,z),z,2+r.f()*2.5,1.5+r.f()*2,r.f()*6);continue;}
  const ty=arbreType(ter,r);add(geoArbre(ty,k%3),mV,x,hS(x,z),z,2.6+r.f()*1.6,null,r.f()*6);}
 for(let k=0;k<7;k++){const x=-26+k*9+r.f()*3,z=-17-r.f()*5;add(geoMontagne(k%6,ter),mP,x,hS(x,z)-.5,z,4.5+r.f()*2,4+r.f()*3,r.f()*6);}
 for(let k=0;k<26;k++){const x=(r.f()-.5)*20,z=-1+r.f()*11;if(Math.abs(x)<8&&z>-.6&&z<9.5)continue;add(geoRocher(k%5,ter),mP,x,hS(x,z),z,.7+r.f()*.8,.6+r.f()*.6,r.f()*6);}
 if(C.ville){const v=villeMesh(C.ville);v.scale.setScalar(2.3);v.position.set(geo.port?0:11,0,geo.port?-4:1.2);v.rotation.y=geo.port?0:-.5;v.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});sc.add(v);}
 // obstacles posés sur leurs hexagones
 const obs=[];for(const h of C.obst){const [x,z]=hexMonde(h);const rr=creeRng(h*13+5);const gr=new T.Group();gr.position.set(x,0,z);
  if(ter==='herbe'&&h%2||ter==='marais'&&h%2||neige&&h%2){const ty=arbreType(ter,rr);for(let k=0;k<2;k++){const o=new T.Mesh(geoArbre(ty,(h+k)%3),mV);o.position.set((rr.f()-.5)*.4,0,(rr.f()-.5)*.3);o.scale.setScalar(1.9+rr.f()*.6);o.rotation.y=rr.f()*6;o.castShadow=o.receiveShadow=true;gr.add(o);}}
  else{for(let k=0;k<3;k++){const o=new T.Mesh(geoRocher((h+k)%5,ter),mP);o.position.set((rr.f()-.5)*.5,0,(rr.f()-.5)*.35);const s0=k?1.1+rr.f()*.6:1.9+rr.f()*.5;o.scale.set(s0,s0*(.8+rr.f()*.5),s0);o.rotation.y=rr.f()*6;o.castShadow=o.receiveShadow=true;gr.add(o);}}
  sc.add(gr);obs.push([h,gr]);}
 // rendu
 const dpr0=R0.getPixelRatio(),sz=R0.getSize(new T.Vector2());const exp0=R0.toneMappingExposure,cc=R0.getClearColor(new T.Color()),ca=R0.getClearAlpha();
 R0.setPixelRatio(dpr);R0.setSize(W,Hs,false);R0.toneMappingExposure=lave?1:.95;R0.shadowMap.enabled=true;R0.shadowMap.needsUpdate=true;
 const out={fond:null,obst:new Map()};
 R0.render(sc,cam);out.fond=mkC(W*dpr,Hs*dpr);out.fond.getContext('2d').drawImage(R0.domElement,0,0);
 // obstacles détourés (redessinés dans l'ordre des rangées pour cacher les créatures derrière eux)
 sc.background=null;R0.setClearColor(0,0);const autres=[];sc.traverse(o=>{if(o.isMesh&&o!==msol&&!obs.some(([h,g])=>g===o.parent||g===o))autres.push(o);});
 for(const o of autres)o.visible=false;msol.visible=false;for(const [,g] of obs)g.visible=false;
 const bb=new T.Box3(),v=new T.Vector3();
 for(const [h,g] of obs){g.visible=true;bb.setFromObject(g);let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(let k=0;k<8;k++){v.set(k&1?bb.max.x:bb.min.x,k&2?bb.max.y:bb.min.y,k&4?bb.max.z:bb.min.z).project(cam);const sx=(v.x+1)/2*W,sy=(1-v.y)/2*Hs;x0=Math.min(x0,sx);x1=Math.max(x1,sx);y0=Math.min(y0,sy);y1=Math.max(y1,sy);}
  x0=Math.max(0,Math.floor(x0-2));y0=Math.max(0,Math.floor(y0-2));x1=Math.min(W,Math.ceil(x1+2));y1=Math.min(Hs,Math.ceil(y1+2));
  if(x1>x0&&y1>y0){R0.render(sc,cam);const c=mkC((x1-x0)*dpr,(y1-y0)*dpr);c.getContext('2d').drawImage(R0.domElement,x0*dpr,y0*dpr,(x1-x0)*dpr,(y1-y0)*dpr,0,0,c.width,c.height);out.obst.set(h,{c,x:x0,y:y0,w:x1-x0,h:y1-y0});}
  g.visible=false;}
 // remise en état du rendu de la carte
 R0.setClearColor(cc,ca);R0.toneMappingExposure=exp0;R0.setPixelRatio(dpr0);R0.setSize(sz.x,sz.y,false);U.fog.value=fog0;U.N.value=n0;
 sc.traverse(o=>{if(o.geometry&&o.geometry===gs)o.geometry.dispose();});ms.map.dispose();ms.dispose();envC.dispose();
 return out;};

// =========================================================
// VILLE EN 3D : panorama rendu une fois (à chaque construction), mêmes zones cliquables que l'ancien dessin.
// =========================================================
const PRISME=(()=>{const g=new T.CylinderGeometry(.5,.5,1,3,1);g.rotateZ(Math.PI/2);g.rotateX(Math.PI/6);g.translate(0,.25,0);g.scale(1,1.15,1);return g;})();// toit à deux pans (axe x)
function fenetres(gr,n,larg,y,z,coul,nuit){for(let k=0;k<n;k++)bloc(gr,BOX,coul,{em:nuit?0xffb040:0xffd890,ei:nuit?2.2:.5},[(k-(n-1)/2)*larg/n,y,z],null,[larg/n*.4,larg/n*.55,.04]);}
function maison(gr,w,h,mur,toit,P,nuit,porte=true){bloc(gr,BOX,mur,P,[0,h/2,0],null,[w,h,w*.75]);bloc(gr,PRISME,toit,{r:.7},[0,h,0],null,[w*1.12,w*.6,w*.92]);fenetres(gr,2,w*.8,h*.62,w*.38,0xffd87a,nuit);if(porte)bloc(gr,BOX,0x3a2412,{},[0,h*.22,w*.38],null,[w*.22,h*.44,.04]);}
function batiment3D(b,v,u,P,nuit){const gr=new T.Group();const F=FAC[v.fac].coul;const mur=new T.Color(F.mur).getHex(),toit=new T.Color(F.toit).getHex();const fac=v.fac;const bois=fac==='horde'?0x8a6238:0x9a7448;
 if(b==='fort'||b==='citadelle'||b==='chateau'){const n=b==='chateau'?3:b==='citadelle'?2:1;const L=u;// u = largeur des remparts
  if(fac==='horde'){for(let x=-L/2;x<=L/2;x+=.45){bloc(gr,CYL,0x7a5228,{},[x,1.1,0],null,[.4,2.2+(Math.abs(x*7)%3)*.15,.4]);bloc(gr,CONE,0x7a5228,{},[x,2.4,0],null,[.4,.5,.4]);}
   for(let k=0;k<=n;k++){const x=-L/2+L*k/n;bloc(gr,BOX,0x8a6238,{},[x,2.2,0],null,[1.3,4.4+n*.4,1.3]);bloc(gr,CONE4,0xc9a050,{},[x,4.4+n*.4+.7,0],[0,Math.PI/4,0],[2.2,1.5,2.2]);for(const s of [-1,1])bloc(gr,CONE,0xe8dcc4,{},[x+s*.5,5.4+n*.4,0],[0,0,-s*.5],[.15,1.2,.15]);}
   bloc(gr,BOX,0x3a2412,{},[0,1,.3],null,[2,2,.2]);return gr;}
  const ht=2.2;bloc(gr,BOX,mur,P,[0,ht/2,0],null,[L,ht,.9]);for(let x=-L/2+.3;x<L/2;x+=.7)bloc(gr,BOX,mur,P,[x,ht+.22,.3],null,[.42,.45,.3]);
  for(let k=0;k<=n;k++){const x=-L/2+L*k/n;tour(gr,x,.1,1.1,ht+2.6+n*.7,mur,toit,fac==='necro'?'fleche':'cone',P);fenetres(gr,1,.8,ht+1.4,.95,0xffd87a,nuit);}
  // donjon central
  bloc(gr,BOX,mur,P,[0,(ht+3.6+n)/2,-1.6],null,[4.4,ht+3.6+n,3]);bloc(gr,CONE4,toit,{r:.6},[0,ht+3.6+n+1.5,-1.6],[0,Math.PI/4,0],[6.4,3,4.6]);
  for(const s of [-1,1])tour(gr,s*2.4,-1.6,.75,ht+5+n,mur,toit,fac==='necro'?'fleche':'cone',P);
  for(let r=0;r<2;r++)fenetres(gr,3,3.2,ht+1.4+r*1.5,-.08,0xffd87a,nuit);
  bloc(gr,BOX,0x2a1a0c,{},[0,.9,.47],null,[1.6,1.8,.06]);if(fac==='necro')bloc(gr,SPH,0x7cf7a2,{em:0x7cf7a2,ei:2.5},[0,ht+3.6+n+3.6,-1.6],null,[.5,.5,.5]);
  return gr;}
 const w=u;
 if(b==='conseil'||b==='mairie'||b==='hotelville'||b==='capitole'){maison(gr,w,w*.75,mur,toit,P,nuit);if(b!=='conseil')tour(gr,0,-w*.1,w*.16,w*1.25,mur,toit,'cone',P);
  if(b==='hotelville'||b==='capitole')for(const s of [-1,1])tour(gr,s*w*.55,0,w*.1,w*.95,mur,toit,'cone',P);if(b==='capitole')bloc(gr,SPH,0xf0c040,{em:0xd0a020,ei:1,m:.8,r:.2},[0,w*1.25+w*.62,-w*.1],null,[w*.22,w*.22,w*.22]);return gr;}
 if(b==='graal'){bloc(gr,CONE4,fac==='necro'?0x5a4a7a:fac==='sylve'?0x5a9a4a:0xf0e0a0,{em:0xffd060,ei:.6,map:P.map},[0,w*1.3,0],[0,Math.PI/4,0],[w*.6,w*2.6,w*.6]);bloc(gr,SPH,0xfff0b0,{em:0xffe080,ei:3},[0,w*2.75,0],null,[w*.3,w*.3,w*.3]);return gr;}
 if(b.startsWith('guilde')){const n=+b[6];tour(gr,0,0,w*.3,w*(.9+n*.4),mur,toit,'fleche',P);bloc(gr,SPH,0xc8b0ff,{em:0xa080ff,ei:2.5},[0,w*(.9+n*.4)+w*1.25,0],null,[w*.22,w*.22,w*.22]);return gr;}
 if(b==='taverne'){maison(gr,w,w*.6,0xb08a5a,0x7a3a2a,{},nuit);bloc(gr,BOX,0x3a2a1a,{},[w*.62,w*.5,w*.3],null,[w*.3,.06,.06]);bloc(gr,BOX,0xc89040,{},[w*.7,w*.38,w*.3],null,[w*.18,w*.16,.04]);for(let k=0;k<2;k++)bloc(gr,CYL,0x8a5a30,{},[-w*.65+k*.3,w*.12,w*.35],null,[w*.16,w*.24,w*.16]);return gr;}
 if(b==='marche'){for(let k=0;k<3;k++){const x=(k-1)*w*.42;for(const sx of [-1,1])for(const sz of [-1,1])bloc(gr,CYL,0x6a4a2a,{},[x+sx*w*.15,w*.22,sz*w*.12],null,[.06,w*.44,.06]);bloc(gr,CONE4,[0xc83a2a,0xe8d8b0,0x3a6ac8][k],{},[x,w*.52,0],[0,Math.PI/4,0],[w*.48,w*.18,w*.4]);bloc(gr,BOX,0x9a6a3a,{},[x,w*.16,0],null,[w*.32,w*.08,w*.22]);for(let j=0;j<3;j++)bloc(gr,SPH,[0xe85a3a,0xf0c040,0x6ac84a][(j+k)%3],{},[x+(j-1)*w*.08,w*.22,0],null,[w*.06,w*.06,w*.06]);}return gr;}
 if(b==='silo'){bloc(gr,CYL,0xa87a48,{},[0,w*.45,0],null,[w*.7,w*.9,w*.7]);bloc(gr,SPH,0x7a3a2a,{},[0,w*.9,0],null,[w*.75,w*.6,w*.75]);return gr;}
 // habitations
 const niv=+b[3];
 if(fac==='sylve'){bloc(gr,CYL,0x6a4a2a,{},[0,w*.55,0],null,[w*.2,w*1.1,w*.2]);for(let k=0;k<5;k++){const a=k*1.26;bloc(gr,SPH,0x3f7a34,{},[Math.cos(a)*w*.28,w*(1.15+(k%2)*.12),Math.sin(a)*w*.2],null,[w*.5,w*.42,w*.5]);}const n0=gr.children.length;maison(gr,w*.6,w*.3,0x9a7448,toit,{},nuit,false);gr.children.slice(n0).forEach(m=>m.position.y+=w*.45);}
 else if(fac==='horde'){bloc(gr,CYL,0x9a7448,{},[0,w*.25,0],null,[w,w*.5,w*.9]);bloc(gr,CONE,0xc9a050,{r:.95},[0,w*.5+w*.3,0],null,[w*1.25,w*.6,w*1.15]);bloc(gr,BOX,0x2a1608,{},[0,w*.16,w*.44],null,[w*.26,w*.32,.04]);}
 else if(fac==='necro'){bloc(gr,BOX,teinteHex(mur,-.15),P,[0,w*.3,0],null,[w,w*.6,w*.8]);bloc(gr,CONE4,teinteHex(mur,-.3),P,[0,w*.6+w*.25,0],[0,Math.PI/4,0],[w*1.2,w*.5,w*1]);bloc(gr,BOX,0x120c18,{},[0,w*.2,w*.41],null,[w*.3,w*.4,.04]);for(const s of [-1,1])bloc(gr,BOX,0x7cf7a2,{em:0x7cf7a2,ei:1.5},[s*w*.3,w*.42,w*.41],null,[w*.08,w*.12,.03]);}
 else maison(gr,w,w*(.55+niv*.03),mur,toit,P,nuit);
 return gr;}
function teinteHex(h,k){const c=new T.Color(h);c.multiplyScalar(1+k);return c.getHex();}
// profondeur et taille dans la scène pour chaque emplacement de l'ancien panorama
const ZV={fort:-13,citadelle:-13,chateau:-13,capitole:-6.5,hotelville:-6.5,mairie:-6.5,conseil:-6.5,graal:-8,guilde1:-7,guilde2:-7,guilde3:-7,hab7:-7.5,hab1:-.5,hab2:0,hab3:0,hab4:-.5,hab5:6,hab6:6.5,taverne:6,marche:7,silo:6};
const UV={capitole:4.4,hotelville:4.2,mairie:3.8,conseil:3.4,graal:1.7,guilde1:1.8,guilde2:1.8,guilde3:1.8,taverne:2.6,marche:2.8,silo:1.7,hab1:2.4,hab2:2.4,hab3:2.4,hab4:2.4,hab5:2.4,hab6:2.5,hab7:2.8};
A.panoVille=(v,W,H)=>{const R0=rendu();if(!R0)return null;W=Math.round(W);H=Math.round(H);const nuit=v.fac==='necro',hd=v.fac==='horde',syl=v.fac==='sylve';const r=creeRng(v.id*13);
 const sc=new T.Scene();const fog0=U.fog.value,n0=U.N.value;U.fog.value=BLANC;U.N.value=1;
 const asp=W/H;const port=asp<1.2;const fov=port?44:38;const cam=new T.PerspectiveCamera(fov,asp,.5,400);const camZ=port?23:22,camY=port?3.2:4.2,tgY=port?3.9:2.6;cam.position.set(0,camY,camZ);cam.lookAt(0,tgY,0);cam.updateMatrixWorld();
 const tf=Math.tan(fov*Math.PI/360);const pitch=Math.atan((camY-tgY)/camZ);const yh=.5-.5*Math.tan(pitch)/tf;// horizon (fraction de la hauteur)
 // ciel + montagnes lointaines peints (comme l'ancien panorama)
 const bg=mkC(W,H),g=bg.getContext('2d');const sky=g.createLinearGradient(0,0,0,H*yh);sky.addColorStop(0,nuit?'#141026':hd?'#c0603a':syl?'#5a9ad0':'#4a84c8');sky.addColorStop(1,nuit?'#4a3c60':hd?'#f8d090':syl?'#d8ecd0':'#f2dcb4');g.fillStyle=sky;g.fillRect(0,0,W,H);
 if(nuit){g.fillStyle='#e8e4d0';g.beginPath();g.arc(W*.8,H*.12,H*.05,0,7);g.fill();g.fillStyle='#141026';g.beginPath();g.arc(W*.815,H*.11,H*.046,0,7);g.fill();for(let k=0;k<60;k++){g.fillStyle='rgba(255,255,255,'+(.3+r.f()*.6)+')';g.fillRect(r.f()*W,r.f()*H*yh*.8,1.5,1.5);}}
 else{g.save();g.globalAlpha=.75;g.fillStyle='#fff';for(let k=0;k<6;k++){const x=r.f()*W,y=H*(.05+r.f()*yh*.45);for(let j=0;j<5;j++){g.beginPath();g.ellipse(x+j*W*.022,y+(j%2)*H*.012,W*.032,H*.028,0,0,7);g.fill();}}g.restore();}
 for(let l=0;l<2;l++){g.fillStyle=nuit?['#3a3050','#2a2438'][l]:syl?['#8ab0a0','#5a8a64'][l]:hd?['#b88a6a','#8a6a4a'][l]:['#9aa8c0','#7a8aa4'][l];g.beginPath();g.moveTo(0,H*(yh+.05));for(let x=0;x<=W;x+=W/16)g.lineTo(x,H*(yh-.2+l*.08)+Math.sin(x/W*12+l*2+v.id)*H*.05+r.f()*H*.035);g.lineTo(W,H*(yh+.05));g.closePath();g.fill();}
 const tb=new T.CanvasTexture(bg);tb.colorSpace=T.SRGBColorSpace;sc.background=tb;
 const haze=new T.Color(nuit?0x2a2438:syl?0x7a9a84:hd?0xa08060:0x8a98ac);sc.fog=new T.Fog(haze,35,95);
 const pm=new T.PMREMGenerator(R0);const envC=pm.fromScene(new T.RoomEnvironment(),.04).texture;pm.dispose();sc.environment=envC;sc.environmentIntensity=nuit?.12:.3;
 sc.add(new T.HemisphereLight(nuit?0x8a90c8:0xdfe8ff,nuit?0x1a1420:0x4a3a24,nuit?.45:.8));const sun=new T.DirectionalLight(nuit?0x9ab0ff:hd?0xffc890:0xffecd0,nuit?.9:2.2);sun.position.set(hd?-18:-10,hd?8:16,12);sun.target.position.set(0,0,-4);sc.add(sun,sun.target);
 sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-30,right:30,top:25,bottom:-25,near:1,far:80});sun.shadow.bias=-.0005;sun.shadow.normalBias=.04;sun.shadow.camera.updateProjectionMatrix();
 // sol, chemin, arbres
 const terS=nuit?'terre':hd?'rude':'herbe';const ts=texSolCombat(terS);ts.repeat.set(10,10);const gs=new T.PlaneGeometry(300,300,1,1).rotateX(-Math.PI/2);const ms=new T.MeshStandardMaterial({map:ts,roughness:.95,color:nuit?0x8a8078:0xffffff});const msol=new T.Mesh(gs,ms);msol.receiveShadow=true;sc.add(msol);
 const ch=new T.Mesh(new T.PlaneGeometry(2.6,40).rotateX(-Math.PI/2),new T.MeshStandardMaterial({color:nuit?0x6a5a4a:0xc8a878,roughness:1,transparent:true,opacity:.85}));ch.position.set(0,.02,8);ch.receiveShadow=true;sc.add(ch);
 const vis=z=>2*(camZ-z)*tf*asp;// largeur visible à la profondeur z
 const mV=mat(0xffffff,{vc:1,r:.82}),mP=mat(0xffffff,{vc:1,r:.95});
 const ty=()=>nuit?'mort':syl?(r.f()<.6?'sapin':'feuillu'):hd?(r.f()<.4?'mort':'feuillu'):(r.f()<.3?'sapin':'feuillu');
 const arbre=(x,z,s)=>{const o=new T.Mesh(geoArbre(ty(),r.i(0,2)),mV);o.position.set(x,0,z);o.scale.setScalar(s);o.rotation.y=r.f()*6;o.castShadow=true;o.receiveShadow=true;sc.add(o);};
 for(let k=0;k<70;k++){const z=-17-r.f()*22;arbre((r.f()-.5)*vis(z)*1.1,z,4+r.f()*3);}
 for(let k=0;k<16;k++){const z=-12+r.f()*20;const sd=r.f()<.5?-1:1;arbre(sd*vis(z)*(.44+r.f()*.1),z,3.5+r.f()*2);}
 for(let k=0;k<10;k++){const z=-2+r.f()*12;const x=(r.f()-.5)*vis(z)*.9;if(Math.abs(x)<2)continue;const o=new T.Mesh(geoRocher(k%5,terS),mP);o.position.set(x,0,z);o.scale.setScalar(.6+r.f()*.6);o.castShadow=true;sc.add(o);}
 // bâtiments
 const P={map:v.fac==='horde'||v.fac==='sylve'?null:texPierre(),r:.9};
 const ordre=Object.keys(PANO).filter(b=>v.bat[b]).filter(b=>!(b==='conseil'&&(v.bat.mairie))&&!(b==='mairie'&&v.bat.hotelville)&&!(b==='hotelville'&&v.bat.capitole)&&!(b==='fort'&&v.bat.citadelle)&&!(b==='citadelle'&&v.bat.chateau)&&!(b==='guilde1'&&v.bat.guilde2)&&!(b==='guilde2'&&v.bat.guilde3));
 const objs=[];for(const b of ordre){const z=ZV[b]??0;const fx=PANO[b][0];const L=vis(z);const u=(b==='fort'||b==='citadelle'||b==='chateau')?Math.min(26,L*.62):Math.min(UV[b]||2.4,PANO[b][2]*L*1.05);
  const gr=batiment3D(b,v,u,P,nuit);gr.position.set((fx-.5)*L*.94,0,z);if(b.startsWith('hab')||b==='taverne'||b==='marche'||b==='silo')gr.rotation.y=-(fx-.5)*.5;gr.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});sc.add(gr);objs.push([b,gr,u]);}
 const dpr0=R0.getPixelRatio(),sz=R0.getSize(new T.Vector2());const exp0=R0.toneMappingExposure;
 R0.setPixelRatio(1);R0.setSize(W,H,false);R0.toneMappingExposure=nuit?1.1:.95;R0.shadowMap.needsUpdate=true;R0.render(sc,cam);
 const c=mkC(W,H);const cg=c.getContext('2d');cg.drawImage(R0.domElement,0,0);
 R0.toneMappingExposure=exp0;R0.setPixelRatio(dpr0);R0.setSize(sz.x,sz.y,false);U.fog.value=fog0;U.N.value=n0;
 // zones cliquables + créatures devant leurs habitations (dessinées, comme sur la carte)
 const zones=[];const bb=new T.Box3(),q=new T.Vector3();const pr=(x,y,z)=>{q.set(x,y,z).project(cam);return[(q.x+1)/2*W,(1-q.y)/2*H];};
 const tri=objs.slice().sort((a,b)=>a[1].position.z-b[1].position.z);
 for(const [b,gr,u] of tri){bb.setFromObject(gr);let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(let k=0;k<8;k++){const [sx,sy]=pr(k&1?bb.max.x:bb.min.x,k&2?bb.max.y:bb.min.y,k&4?bb.max.z:bb.min.z);x0=Math.min(x0,sx);x1=Math.max(x1,sx);y0=Math.min(y0,sy);y1=Math.max(y1,sy);}
  if(b.startsWith('hab')){const niv=+b[3];const cre0=FAC[v.fac].crea[niv-1];const cre=v.bat['hab'+niv+'u']&&CRE[cre0].amelio?CRE[cre0].amelio:cre0;const [bx,by]=pr(gr.position.x+u*.35,0,gr.position.z+u*.65);const [bx2]=pr(gr.position.x+u*.35+u,0,gr.position.z+u*.65);const S=Math.max(24,Math.abs(bx2-bx)*1.25);
   cg.drawImage(spriteCreature(cre,Math.round(S)),bx-S*.5,by-S*.9);x1=Math.max(x1,bx+S*.4);y1=Math.max(y1,by);}
  zones.push({b,x:x0,y:y0,w:x1-x0,h:y1-y0});}
 // drapeaux animés en 2D au sommet du château
 const drap=[];const fort=objs.find(o=>o[0]==='fort'||o[0]==='citadelle'||o[0]==='chateau');if(fort){const [b,gr,u]=fort;bb.setFromObject(gr);const [dx,dy]=pr(gr.position.x,bb.max.y,gr.position.z-1.6);drap.push([dx,Math.max(H*.12,dy)]);}
 sc.traverse(o=>{if(o.geometry===gs)o.geometry.dispose();});ts.dispose();ms.dispose();tb.dispose();envC.dispose();
 return{c,zones,drap};};
return A;})();
R3.stats=()=>{const o={};const sc=R3._scene&&R3._scene();if(!sc)return o;sc.traverse(m=>{if(!m.isMesh)return;const g=m.geometry;const t=(g.index?g.index.count:g.attributes.position.count)/3*(m.isInstancedMesh?m.count:1);const k=m.isInstancedMesh?'inst':m.name||(m.parent&&m.parent.type)||'?';o[k]=(o[k]||0)+t;});return o;};
