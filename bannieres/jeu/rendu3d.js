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
const U={fog:{value:null},N:{value:1},t:{value:0},loin:{value:0},haze:{value:new T.Vector4(.36,.42,.52,0)},hazeD:{value:new T.Vector2(20,40)}};
let PAN_A=.45,PAN_K=1.1;
const C3={cible:new T.Vector3(10,0,10),dist:16,tang:.95,yaw:0};
const S={pret:false,glb:{},qual:2};
const RC=new T.Raycaster();const v2=new T.Vector2();
// ---------- brouillard et ondulation : injectés dans les matériaux standard ----------
function brume(m,opt={}){m.onBeforeCompile=sh=>{sh.uniforms.bsFog=U.fog;sh.uniforms.bsBrF={value:texBruitGL()};sh.uniforms.bsTF=U.t;sh.uniforms.bsN=U.N;sh.uniforms.bsT=U.t;sh.uniforms.bsHaze=U.haze;sh.uniforms.bsHazeD=U.hazeD;
  const tri=!!opt.tri;if(tri){sh.uniforms.bsEch={value:opt.ech||1};sh.uniforms.bsNeige={value:opt.neige??9};sh.uniforms.bsTexN={value:RES.tx.neige||null};}
  sh.vertexShader='varying vec2 vBsW;\nvarying vec3 vBsP;varying vec3 vBsNw;\nuniform float bsT;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n'+(opt.vent?'{vec4 w0=modelMatrix*vec4(0.,0.,0.,1.);\n#ifdef USE_INSTANCING\nw0=modelMatrix*instanceMatrix*vec4(0.,0.,0.,1.);\n#endif\nfloat k=max(0.,position.y)*'+opt.vent+';transformed.x+=sin(bsT*1.6+w0.x*.7+w0.z*.5)*k;transformed.z+=cos(bsT*1.3+w0.x*.4)*k*.6;}':'')+(opt.onde?'transformed.z+=sin(bsT*1.2+position.x*1.3+position.y*.9)*.02;':''))
   .replace('#include <project_vertex>','#include <project_vertex>\n{vec4 bw=vec4(transformed,1.);\n#ifdef USE_INSTANCING\nbw=instanceMatrix*bw;\n#endif\nbw=modelMatrix*bw;vBsW=bw.xz;vBsP=bw.xyz;'+(tri?'vec3 nn=objectNormal;\n#ifdef USE_INSTANCING\nnn=mat3(instanceMatrix)*nn;\n#endif\nvBsNw=normalize(mat3(modelMatrix)*nn);':'vBsNw=vec3(0.,1.,0.);')+'}');
  sh.fragmentShader=(opt.cle==='sol'||opt.cle==='eau'?'':'#define BS_OBJ\n')+'varying vec2 vBsW;varying vec3 vBsP;varying vec3 vBsNw;uniform sampler2D bsFog;uniform sampler2D bsBrF;uniform float bsTF;uniform float bsN;uniform vec4 bsHaze;uniform vec2 bsHazeD;\n'+(tri?'uniform float bsEch;uniform float bsNeige;uniform sampler2D bsTexN;\n':'')+sh.fragmentShader.replace('#include <opaque_fragment>','#include <opaque_fragment>\n{float f=texture2D(bsFog,vBsW/bsN).r;float hors=1.;if(bsN>1.5){float db=min(min(vBsW.x,vBsW.y),min(bsN-vBsW.x,bsN-vBsW.y));f*=smoothstep(-.6,.9,db);hors=smoothstep(-2.,-.2,db);}if(f<.999){/* 24/11 : brouillard de guerre peint — nuées sombres qui dérivent lentement, bord effiloché, au lieu d’un noir uni */float n1=texture2D(bsBrF,vBsW*.045+vec2(bsTF*.004,bsTF*.0025)).r,n2=texture2D(bsBrF,vBsW*.13-vec2(bsTF*.006,-bsTF*.003)).r;float nn=n1*.65+n2*.35;float fe=clamp(f*1.15+(nn-.5)*.9*(1.-abs(f*2.-1.)),0.,1.);vec3 nu=mix(vec3(.035,.035,.045),vec3(.13,.125,.15),smoothstep(.35,.75,nn));nu=mix(nu,vec3(.2,.17,.13),.35*smoothstep(.55,.0,fe)*smoothstep(.0,.3,fe));gl_FragColor.rgb=mix(nu,gl_FragColor.rgb,smoothstep(.0,1.,fe));\n#ifdef BS_OBJ\nif(fe<.06)discard;/* objets cachés : les nuées du sol passent devant, sans silhouette */\n#endif\n}gl_FragColor.rgb*=hors;/* 24/11 : noir uni au-delà du bord */float ah=bsHaze.a*f*smoothstep(bsHazeD.x,bsHazeD.y,length(vBsP-cameraPosition));gl_FragColor.rgb=mix(gl_FragColor.rgb,bsHaze.rgb,ah);}');
  if(tri)sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>',`#ifdef USE_MAP
{vec3 nw=normalize(vBsNw);vec3 an=pow(abs(nw),vec3(4.));an/=an.x+an.y+an.z;vec3 q=vBsP*bsEch;
 vec4 tc=${S.qual<=0?'texture2D(map,an.x>an.z?q.zy:q.xy)*(an.x+an.z)+texture2D(map,q.xz)*an.y':'texture2D(map,q.zy)*an.x+texture2D(map,q.xz)*an.y+texture2D(map,q.xy)*an.z'};
 if(bsNeige<8.){float sn=smoothstep(bsNeige-.15,bsNeige+.15,vBsP.y+(tc.g-.45)*.6)*smoothstep(.3,.65,nw.y);vec4 ns=texture2D(bsTexN,q.xz*1.4);tc=mix(tc,ns,sn);}
 diffuseColor*=tc;}
#endif`);
  if(opt.extra)opt.extra(sh);};
 m.customProgramCacheKey=()=>'bs'+(opt.vent||'')+(opt.onde?'o':'')+(opt.tri?'t'+opt.tri+(opt.neige??''):'')+(opt.cle||'')+((opt.cle==='sol'||opt.cle==='eau'||opt.tri)&&S.qual<=0?'0':'');return m;}
const PM={tri:'mur',r:.92},PM2={tri:'mur2',r:.92},PT={tri:'ardoise',r:.75,ech:1.2},PTU={tri:'tuile',r:.8,ech:1.2},PC={tri:'chaume',r:.95,ech:1.4},PB={tri:'bois',r:.85,ech:1.1};
let ECH=3;// répétitions des textures par unité (carte 3, combat 1.4, ville .55)
const MATS={};function mat(c,o={}){if(o.map===null)delete o.map;if(o.tri&&!RES.tx[o.tri])o=Object.assign({},o,{tri:null});if(o.tri)o=Object.assign({},o,{ech:(o.ech||1)*ECH});const k=c+JSON.stringify(o,(n,v)=>n==='map'?(v&&v.uuid):v);if(MATS[k])return MATS[k];const m=new T.MeshStandardMaterial(Object.assign({color:c,roughness:o.r??.85,metalness:o.m||0,flatShading:!!o.plat},o.map?{map:o.map}:{},o.tri?{map:RES.tx[o.tri]}:{}));if(o.em){m.emissive=new T.Color(o.em);m.emissiveIntensity=o.ei||1;}if(o.vc)m.vertexColors=true;if(o.transp){m.transparent=true;m.opacity=o.transp;}return MATS[k]=brume(m,o);}
// ---------- ressources réalistes : textures Poly Haven (CC0) et arbres/rochers pré-rendus (imposteurs) ----------
const RES={tx:{},img:{},pret:false,lay:null,atlas:null,imp:null};
const NOMS_TX=['sol_herbe_n','sol_terre_n','sol_rude_n','sol_neige_n','sol_sable_n','sol_marais_n','sol_lave_n','sol_fond_n','sol_route_n','enduit','poutre','pave','mur3','ardoise2','sol_herbe','sol_terre','sol_rude','sol_neige','sol_sable','sol_marais','sol_lave','sol_fond','sol_route','roche','roche2','neige','mur','mur2','ardoise','tuile','chaume','bois','ecorce','ciel'];
function srcRes(id,f){const el=document.getElementById(id);return el?'data:'+(f.endsWith('.webp')?'image/webp':'image/jpeg')+';base64,'+el.textContent.trim():f;}
function chargerImg(src){return new Promise(r=>{const im=new Image();im.onload=()=>r(im);im.onerror=()=>r(null);im.src=src;});}
let RESP=null;function chargerRes(){if(RESP)return RESP;RESP=(async()=>{
 if(document.readyState==='loading')await new Promise(r=>document.addEventListener('DOMContentLoaded',r,{once:true}));
 await Promise.all(NOMS_TX.map(async n=>{const im=await chargerImg(srcRes('t3-'+n,'tex3d/'+n+'.jpg'));if(!im)return;RES.img[n]=im;const t=new T.Texture(im);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;t.needsUpdate=true;RES.tx[n]=t;}));
 // couches du sol (texture « tableau » : une couche par terrain)
 const L=['sol_herbe','sol_terre','sol_rude','sol_neige','sol_sable','sol_marais','sol_lave','sol_fond','sol_route'];if(L.every(n=>RES.img[n])){const S0=512,d=new Uint8Array(S0*S0*4*L.length);const c=mkC(S0,S0),g=c.getContext('2d',{willReadFrequently:true});
  L.forEach((n,k)=>{g.drawImage(RES.img[n],0,0,S0,S0);d.set(g.getImageData(0,0,S0,S0).data,k*S0*S0*4);});const t=new T.DataArrayTexture(d,S0,S0,L.length);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.anisotropy=4;t.needsUpdate=true;RES.lay=t;}
 {const LN=L.map(n=>n+'_n');if(LN.every(n=>RES.img[n])){const S1=256,d=new Uint8Array(S1*S1*4*LN.length);const c=mkC(S1,S1),g=c.getContext('2d',{willReadFrequently:true});
  LN.forEach((n,k)=>{g.drawImage(RES.img[n],0,0,S1,S1);d.set(g.getImageData(0,0,S1,S1).data,k*S1*S1*4);});const t=new T.DataArrayTexture(d,S1,S1,LN.length);t.wrapS=t.wrapT=T.RepeatWrapping;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.needsUpdate=true;RES.layN=t;}}
 // imposteurs : atlas (vue de dessus « h » et vue de côté « b »)
 let meta=null;const mj=document.getElementById('imp-json');try{meta=mj?JSON.parse(mj.textContent):await (await fetch('imp/imp.json')).json();}catch(e){}
 if(meta){RES.imp=meta;for(const vue of ['h','b']){const ks=Object.keys(meta).filter(k=>k.endsWith('_'+vue));const ims=await Promise.all(ks.map(k=>chargerImg(srcRes('i3-'+k,'imp/'+k+'.webp'))));
  const W=2048;let x=0,y=0,lh=0;const pos={};ks.forEach((k,j)=>{const im=ims[j];if(!im)return;if(x+im.width>W){x=0;y+=lh+2;lh=0;}pos[k]=[x,y,im.width,im.height];x+=im.width+2;lh=Math.max(lh,im.height);});
  const H0=Math.pow(2,Math.ceil(Math.log2(y+lh+2)));const c=mkC(W,H0),g=c.getContext('2d');ks.forEach((k,j)=>{if(ims[j]&&pos[k])g.drawImage(ims[j],pos[k][0],pos[k][1]);});
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;const rect={};for(const k in pos){const [px,py,w,h]=pos[k];rect[k]=[px/W,1-(py+h)/H0,w/W,h/H0];}
  (RES.atlas=RES.atlas||{})[vue]={tex:t,rect,canvas:c,pos};}}
 RES.lieuV={};for(const k of Object.keys(LIEUV)){const im=await chargerImg(srcRes('i3-lv_'+k,'imp/lv_'+k+'.webp'));if(im){const t=new T.Texture(im);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;t.needsUpdate=true;RES.lieuV[k]=t;}}
 RES.maisV={};for(const k of Object.keys(MAISV)){const im=await chargerImg(srcRes('i3-mv_'+k,'imp/mv_'+k+'.webp'));if(im)RES.maisV[k]=im;}
 RES.fortV={};for(const f of ['bastion','horde','necro','sylve']){const im=await chargerImg(srcRes('i3-fortv_'+f,'imp/fortv_'+f+'.webp'));if(im)RES.fortV[f]=im;}
 RES.fort={};for(const f of ['bastion','horde','necro','sylve'])for(const sx of ['','_n','_s','_l']){const im=await chargerImg(srcRes('i3-fort_'+f+'_h'+sx,'imp/fort_'+f+'_h'+sx+'.webp'));if(im){const t=new T.Texture(im);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;t.needsUpdate=true;RES.fort[f+sx]=t;}}/* 23/11 : butte de neige, sable ou basalte selon le terrain */
 RES.pret=true;})();return RESP;}
chargerRes();
// ciel pour l'éclairage d'ambiance et les reflets (remplace la « pièce » de studio)
function envCiel(R0,haut,horiz,bas){const sc=new T.Scene();const g=new T.SphereGeometry(50,32,16);const m=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{a:{value:new T.Color(haut)},b:{value:new T.Color(horiz)},c:{value:new T.Color(bas)}},
 vertexShader:'varying vec3 vp;void main(){vp=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 a,b,c;varying vec3 vp;void main(){float y=vp.y;vec3 col=y>0.?mix(b,a,pow(y,.6)):mix(b,c,pow(-y,.4));gl_FragColor=vec4(col,1.);}'});
 sc.add(new T.Mesh(g,m));const s=new T.Mesh(new T.SphereGeometry(4,16,8),new T.MeshBasicMaterial({color:0xfff2d0}));s.position.set(-20,30,15);s.material.color.multiplyScalar(12);sc.add(s);
 const pm=new T.PMREMGenerator(R0);const t=pm.fromScene(sc,.02).texture;pm.dispose();g.dispose();m.dispose();return t;}
// ---------- ambiance (19/11, axe « lumière ») : ciel HDRI Poly Haven kloppenheim_06_puresky (CC0) + lumière de fin d'après-midi dorée ----------
// tex3d/ciel.jpg vient de outils/ressources/ciel_hdri.py (soleil écrêté, tourné du côté de AMB.dir, sol brun-vert sous l'horizon, valeurs ÷ ECH_CIEL).
const ECH_CIEL=4;const AMB={dir:new T.Vector3(-.75,.62,.45).normalize(),sol:0xffe2c0,solI:3.0,hCiel:0xa9c2e6,hSol:0x5a4430,hI:.88,envI:.62*ECH_CIEL,haze:[.60,.60,.62]};
const ENVS=new WeakMap();// un ciel préfiltré par moteur de rendu (carte / combats et villes), gardé : ne jamais le libérer
function envAmb(R0){let e=ENVS.get(R0);if(e)return e;const im=RES.img.ciel;if(!im)return null;const t=new T.Texture(im);t.mapping=T.EquirectangularReflectionMapping;t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;
 const pm=new T.PMREMGenerator(R0);e=pm.fromEquirectangular(t).texture;pm.dispose();t.dispose();ENVS.set(R0,e);return e;}
// étalonnage des images rendues une seule fois (combat, ville) : contraste doux, couleurs un peu moins criardes, chaleur du soir côté soleil, vignette
function etalonner(c,ox,oy,W,H,o={}){const g=c.getContext('2d');const w=c.width,h=c.height,k=w/(o.w||w);let o0=null;if(o.alpha){o0=mkC(w,h);o0.getContext('2d').drawImage(c,0,0);}g.save();g.filter=o.filtre||'contrast(1.05) saturate(.96)';g.globalCompositeOperation='copy';g.drawImage(c,0,0);g.filter='none';
 g.globalCompositeOperation='soft-light';const cx=(-ox+W*(o.sx??.08))*k,cy=(-oy+H*(o.sy??.0))*k;const gr=g.createRadialGradient(cx,cy,0,cx,cy,Math.max(W,H)*1.1*k);gr.addColorStop(0,o.chaud||'rgba(255,190,110,.55)');gr.addColorStop(.6,'rgba(255,190,110,0)');gr.addColorStop(1,o.froid||'rgba(60,80,130,.35)');g.fillStyle=gr;g.fillRect(0,0,w,h);
 g.globalCompositeOperation='multiply';const vx=(-ox+W/2)*k,vy=(-oy+H*.48)*k;const vg=g.createRadialGradient(vx,vy,Math.min(W,H)*.45*k,vx,vy,Math.hypot(W,H)*.62*k);vg.addColorStop(0,'rgba(255,255,255,1)');vg.addColorStop(1,o.vignette||'rgba(178,164,150,1)');g.fillStyle=vg;g.fillRect(0,0,w,h);if(o.alpha&&o0){g.globalCompositeOperation='destination-in';g.drawImage(o0,0,0);}g.restore();}
// ---------- relief ----------
const AMP_RIVE=.22;const COLL=[.55,.7,1,.8,.6,0,.5];/* collines par terrain : herbe, terre, lande, neige, sable, marais, lave */function hauteurs(){const c=G.carte;N=c.N;/* les collines évitent les cases d’objets (mines, villes, lieux : posés à plat) et s’adoucissent autour */const OCC_C=new Uint8Array(N*N),OCC_C2=new Float32Array(N*N);for(const o of (G.objs||[])){const r=o.t==='ville'?2:o.t==='bat'||o.t==='mine'?1:0;for(let dz=-r-1;dz<=r+1;dz++)for(let dx=-r-1;dx<=r+1;dx++){const x=o.x+dx,y=o.y+dz;if(x<0||y<0||x>=N||y>=N)continue;const k=y*N+x;if(Math.abs(dx)<=r&&Math.abs(dz)<=r)OCC_C[k]=1;else OCC_C2[k]=1;}}const FCOL=new Float32Array(N*N);for(let k=0;k<N*N;k++)FCOL[k]=OCC_C[k]?0:(COLL[c.ter[k]]||0)*(1-OCC_C2[k]*.6);{/* lissé (3 passes 3×3) : pas de pli de lumière le long des rangées de cases */const tmp=new Float32Array(N*N);for(let p=0;p<3;p++){for(let y=0;y<N;y++)for(let x=0;x<N;x++){let a=0,n=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=N||yy>=N)continue;a+=FCOL[yy*N+xx];n++;}tmp[y*N+x]=a/n;}for(let k=0;k<N*N;k++)FCOL[k]=OCC_C[k]?Math.min(tmp[k],.15):tmp[k];}}const SD=champSigne(c);const nz=bruit(G.graine*3+11);const R=S.qual>=2?4:3;const W=N*R+1;H=new Float32Array(W*W);
 const sd=(fx,fy)=>{fx=Math.max(0,Math.min(N-1.001,fx-.5));fy=Math.max(0,Math.min(N-1.001,fy-.5));const x0=Math.floor(fx),y0=Math.floor(fy),ax=fx-x0,ay=fy-y0,x1=Math.min(N-1,x0+1),y1=Math.min(N-1,y0+1);return SD[y0*N+x0]*(1-ax)*(1-ay)+SD[y0*N+x1]*ax*(1-ay)+SD[y1*N+x0]*(1-ax)*ay+SD[y1*N+x1]*ax*ay;};
 const mont=new Float32Array(N*N);for(let i=0;i<N*N;i++)if(c.obs[i]===OBS.MONT||c.obs[i]===OBS.MONTP)mont[i]=1;
 // 24/11 : rivages adoucis — champ signé flouté (≈1 case) + léger bruit : les côtes diagonales ne font plus d'escaliers ; une case d'eau isolée reste de l'eau
 /* 24/11 : distance exacte (euclidienne) au bord des cases de l’autre nature, dans un rayon de 2 cases : la rive suit le vrai contour des cases, coins arrondis ensuite par le flou */const EA=i=>c.ter[i]===EAU;const sdx=(x,z)=>{const tx=Math.max(0,Math.min(N-1,Math.floor(x))),tz=Math.max(0,Math.min(N-1,Math.floor(z)));const e=EA(tz*N+tx);let dm=2;for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){if(!dx&&!dz)continue;const nx=tx+dx,nz2=tz+dz;if(nx<0||nz2<0||nx>=N||nz2>=N)continue;if(EA(nz2*N+nx)===e)continue;const ax=Math.max(0,nx-x,x-(nx+1)),az=Math.max(0,nz2-z,z-(nz2+1));dm=Math.min(dm,Math.hypot(ax,az));}return e?dm:-dm;};const WS=new Float32Array(W*W);for(let j=0;j<W;j++)for(let i=0;i<W;i++)WS[j*W+i]=Math.max(-.8,Math.min(.8,sdx(i/R,j/R)));/* borné de part et d’autre : le flou ne pousse plus la terre dans l’eau (la garde redressait alors la côte en ligne droite) */
 {const rb=R>=4?3:2,tmp=new Float32Array(W*W);for(let p=0;p<2;p++){for(let j=0;j<W;j++)for(let i=0;i<W;i++){let s=0,c2=0;for(let d=-rb;d<=rb;d++){const ii=i+d;if(ii>=0&&ii<W){s+=WS[j*W+ii];c2++;}}tmp[j*W+i]=s/c2;}
  for(let j=0;j<W;j++)for(let i=0;i<W;i++){let s=0,c2=0;for(let d=-rb;d<=rb;d++){const jj=j+d;if(jj>=0&&jj<W){s+=tmp[jj*W+i];c2++;}}WS[j*W+i]=s/c2;}}}
 for(let j=0;j<W;j++)for(let i=0;i<W;i++){const x=i/R,z=j/R;let h=Math.max(-.07,(nz.fbm(x/7,z/7,3)-.5)*.55);{/* 24/11 : collines douces selon le terrain (lande et neige plus vallonnées, marais plat), jamais près de l’eau ; facteur par case interpolé (sinon marches carrées au bord des objets et des terrains) */const fx=Math.max(0,Math.min(N-1.001,x-.5)),fz=Math.max(0,Math.min(N-1.001,z-.5)),x0=fx|0,z0=fz|0,ax=fx-x0,az=fz-z0,x1=Math.min(N-1,x0+1),z1=Math.min(N-1,z0+1);const kt=FCOL[z0*N+x0]*(1-ax)*(1-az)+FCOL[z0*N+x1]*ax*(1-az)+FCOL[z1*N+x0]*(1-ax)*az+FCOL[z1*N+x1]*ax*az;if(kt>0){const hl=Math.max(0,nz.fbm(x/9+71,z/9+13,3)-.42)*3.2*kt;const wl=WS[j*W+i];h+=hl*Math.min(1,Math.max(0,(-wl-.7)/.8));}}/* 24/11 : plus de cuvettes sous le niveau de l’eau sur la terre ferme (elles dessinaient de faux lacs où l’on marche) */
  let w=WS[j*W+i];if(w>-1.6&&w<1.4){w+=(nz.fbm(x*.33+31,z*.33+17,3)-.455)*AMP_RIVE+(nz.fbm(x*.9+7,z*.9+3,2)-.455)*.3+(nz.fbm(x*2.1+5,z*2.1+11,2)-.455)*.6;/* bruit centré (moyenne du fbm ≈ 0,455), assez faible pour ne pas buter sur la garde *//* 24/11 : garde par case — près du centre de chaque case, l'eau reste de l'eau et la terre reste de la terre, quel que soit le bruit (les chenaux d'une case restent ouverts) */const tx0=Math.min(N-1,Math.floor(x)),tz0=Math.min(N-1,Math.floor(z));const eT=c.ter[tz0*N+tx0]===EAU,fx=x-tx0,fz=z-tz0;let dm=9;for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dz)continue;const nx=tx0+dx,nz2=tz0+dz;if(nx<0||nz2<0||nx>=N||nz2>=N)continue;if((c.ter[nz2*N+nx]===EAU)===eT)continue;const ax=dx<0?fx:dx>0?1-fx:0,az=dz<0?fz:dz>0?1-fz:0;dm=Math.min(dm,Math.hypot(ax,az));}/* garde : le signe du champ suit le type réel de la case dès qu’on s’éloigne de la frontière eau/terre */if(eT)w=Math.max(w,Math.min(.35,dm-.36));else w=Math.min(w,Math.max(-.6,.36-dm));/* contrainte proportionnelle à la distance : pente douce, pas de marche sous l’eau */}
  /* 24/11 : la rive passe exactement par le bord des cases (w=0 ⇒ niveau de l’eau), fond à −0,45 */if(w>-.5)h=Math.max(-.45,Math.min(h,w<0?-(w+.5)*.2:-.1-w*.9));/* plage en pente douce sur une demi-case, puis le fond */// rives et fonds
  // pied des montagnes
  let m=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const tx=Math.floor(x)+dx,ty=Math.floor(z)+dy;if(tx>=0&&ty>=0&&tx<N&&ty<N&&mont[ty*N+tx]){const d=Math.hypot(x-tx-.5,z-ty-.5);m=Math.max(m,Math.max(0,1-d/1.6));}}if(h>-.1)h+=m*.45*Math.min(1,(h+.1)*8);/* 24/11 : le pied des montagnes ne relève pas le fond de l’eau */
  const tx=Math.min(N-1,Math.floor(x)),ty=Math.min(N-1,Math.floor(z));if(c.route[ty*N+tx]&&h>-.1)h=Math.max(-.09,h*.4);
  H[j*W+i]=h;}
 H.R=R;H.W=W;RIVE=texRive();}
// rivages (19/11) : R = profondeur (distance à la terre, cases/2,5), G = proximité de l'eau sur la terre (bande de sable mouillé ≈ 0,45 case)
let RIVE=null;function texRive(){const R=H.R,W=H.W,n=W*W,BIG=1e6;const eauP=new Uint8Array(n);for(let k=0;k<n;k++)eauP[k]=H[k]<-.1?1:0;
 const dt=src=>{const d=new Float32Array(n);for(let k=0;k<n;k++)d[k]=src[k]?0:BIG;// chanfrein 3-4, deux passes
  for(let j=0;j<W;j++)for(let i=0;i<W;i++){const k=j*W+i;let v=d[k];if(!v)continue;if(i>0)v=Math.min(v,d[k-1]+3);if(j>0){v=Math.min(v,d[k-W]+3);if(i>0)v=Math.min(v,d[k-W-1]+4);if(i<W-1)v=Math.min(v,d[k-W+1]+4);}d[k]=v;}
  for(let j=W-1;j>=0;j--)for(let i=W-1;i>=0;i--){const k=j*W+i;let v=d[k];if(!v)continue;if(i<W-1)v=Math.min(v,d[k+1]+3);if(j<W-1){v=Math.min(v,d[k+W]+3);if(i<W-1)v=Math.min(v,d[k+W+1]+4);if(i>0)v=Math.min(v,d[k+W-1]+4);}d[k]=v;}
  return d;};
 const dEau=dt(eauP),terre=new Uint8Array(n);for(let k=0;k<n;k++)terre[k]=1-eauP[k];const dTer=dt(terre);
 const px=new Uint8Array(n*4);for(let k=0;k<n;k++){const de=dEau[k]/3/R,dtr=dTer[k]/3/R;px[k*4]=eauP[k]?Math.min(255,dtr/2.5*255):0;px[k*4+1]=eauP[k]?255:Math.max(0,255*(1-de/.45));px[k*4+3]=255;}
 if(RIVE)RIVE.dispose();const t=new T.DataTexture(px,W,W);t.magFilter=t.minFilter=T.LinearFilter;t.wrapS=t.wrapT=T.ClampToEdgeWrapping;t.needsUpdate=true;t.userData={W,R};return t;}
function h(x,z){if(!H)return 0;const R=H.R,W=H.W;const fx=Math.max(0,Math.min(W-1.001,x*R)),fz=Math.max(0,Math.min(W-1.001,z*R));const i=Math.floor(fx),j=Math.floor(fz),ax=fx-i,az=fz-j;
 return H[j*W+i]*(1-ax)*(1-az)+H[j*W+i+1]*ax*(1-az)+H[(j+1)*W+i]*(1-ax)*az+H[(j+1)*W+i+1]*ax*az;}
function sol(x,y){return Math.max(-.12,h(x+.5,y+.5));}// hauteur d'appui au centre d'une case (pas sous l'eau)
function construireTerrain(){hauteurs();const R=H.R;const g=new T.PlaneGeometry(N,N,N*R,N*R);g.rotateX(-Math.PI/2);g.translate(N/2,0,N/2);
 const p=g.attributes.position;for(let k=0;k<p.count;k++){p.setY(k,h(p.getX(k),p.getZ(k)));}g.computeVertexNormals();
 terrain=new T.Mesh(g,RES.lay?matSol():(()=>{const tx=new T.CanvasTexture(V.sol);tx.colorSpace=T.SRGBColorSpace;tx.anisotropy=Math.min(8,ren.capabilities.getMaxAnisotropy());return brume(new T.MeshStandardMaterial({map:tx,roughness:.93,metalness:0}));})());terrain.receiveShadow=true;terrain.name='terrain';scene.add(terrain);
 // eau : plan brillant et légèrement transparent
 const ge=new T.PlaneGeometry(N+40,N+40,1,1);ge.rotateX(-Math.PI/2);ge.translate(N/2,-.1,N/2);
 const me=brume(new T.MeshStandardMaterial({color:0x1a4558,roughness:.05,metalness:.15,transparent:true,opacity:.9,envMapIntensity:.8,normalMap:texVagues(),normalScale:new T.Vector2(.26,.26)}),{cle:'eau',extra:sh=>{
  Object.assign(sh.uniforms,{bsRive:{value:RIVE},bsRW:{value:RIVE.userData.W},bsRR:{value:RIVE.userData.R},bsBr:{value:texBruitGL()}});
  sh.fragmentShader=sh.fragmentShader.replace('void main() {',(S.qual<=0?'#define BS_LEGER\n':'')+'uniform sampler2D bsRive;uniform float bsRW;uniform float bsRR;uniform sampler2D bsBr;uniform float bsT;\nvoid main() {')
   .replace('#include <color_fragment>',`#include <color_fragment>
 {float d=texture2D(bsRive,(vBsW*bsRR+.5)/bsRW).r;// hauts-fonds #3c6e6a → large #12303f
  diffuseColor.rgb=mix(vec3(.05,.24,.33),vec3(.015,.085,.21),smoothstep(.0,.6,d));/* 24/11 : lacs moins pâles (eau peu profonde plus opaque et plus soutenue) */diffuseColor.a=mix(.93,.97,smoothstep(.0,.3,d));
#ifndef BS_LEGER
  if(d<.12){float nz=texture2D(bsBr,vBsW*.9+vec2(bsT*.03,bsT*.02)).r,nz2=texture2D(bsBr,vBsW*2.3-vec2(bsT*.05,0.)).r;
  float ec=(1.-smoothstep(.0,.09+.06*nz,d))*smoothstep(.35,.7,nz2*.6+nz*.4+.15*sin(bsT*1.3+d*40.));
  diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.9,.93,.9),ec*.9);diffuseColor.a=max(diffuseColor.a,ec*.85);}
#endif
 }`).replace('#include <opaque_fragment>',`#include <opaque_fragment>
#ifndef BS_LEGER
 {// mer brillante (20/11) : reflets du ciel sur les faces des vagues tournées vers le soleil + scintillement doré du soleil bas (avant la brume et le brouillard)
  float d=texture2D(bsRive,(vBsW*bsRR+.5)/bsRW).r,pr=smoothstep(.04,.35,d);
  vec3 Vw=normalize(cameraPosition-vBsP),Nw=normalize((vec4(normal,0.)*viewMatrix).xyz);
  float fr=pow(1.-clamp(dot(Nw,Vw),0.,1.),3.),w=dot(Nw.xz,vec2(-.86,.51))*3.6,m=texture2D(bsBr,vBsW*.071+vec2(bsT*.004,bsT*.003)).r;
  gl_FragColor.rgb=mix(gl_FragColor.rgb,vec3(.30,.46,.60),clamp(.03+fr*.3+max(w,0.)*.2,0.,.3)*pr*(.55+.9*m));
  gl_FragColor.rgb*=1.-clamp(-w,0.,1.)*.15*pr;
  float s1=texture2D(bsBr,vBsW*.83+vec2(bsT*.021,-bsT*.013)).r,s2=texture2D(bsBr,vBsW*1.91-vec2(bsT*.017,bsT*.026)).r;
  float sc=smoothstep(.73,.82,s1*.5+s2*.5)*smoothstep(.0,.6,w+.3);/* 24/11 : scintillement plus rare et plus doux (l'eau faisait « photo ») */
  gl_FragColor.rgb+=vec3(1.,.86,.62)*sc*.55*pr;}
#endif`);}});eau=new T.Mesh(ge,me);eau.renderOrder=1;scene.add(eau);
 // sol au-delà de la carte
 const gb=new T.PlaneGeometry(N+80,N+80,1,1);gb.rotateX(-Math.PI/2);gb.translate(N/2,-.5,N/2);const bas=new T.Mesh(gb,new T.MeshBasicMaterial({color:0x0a0806}));bas.renderOrder=.5;scene.add(bas);try{ponts();}catch(e){console.warn(e);}}
/* 24/11 : ponts de bois là où une route franchit une rivière (dans l’ancien rendu 2D ils existaient, la 3D faisait passer l’eau par-dessus la route) */
function ponts(){if(!MASQ_CV)return;const W=MASQ_CV.width,D=MASQ_CV.getContext('2d').getImageData(0,0,W,W).data;const px=(x,y)=>(y*W+x)*4;
 /* croisements = pixels à la fois route (rouge) et rivière (vert) dans le masque peint, regroupés ; axe du pont = axe principal des pixels de route autour */
 const cl=[];for(let y=0;y<W;y+=3)for(let x=0;x<W;x+=3){const k=px(x,y);if(D[k]>150&&D[k+1]>150){const tx=x/PX,tz=y/PX;let c0=cl.find(q=>Math.hypot(q.x/q.n-tx,q.z/q.n-tz)<.9);if(!c0){c0={x:0,z:0,n:0};cl.push(c0);}c0.x+=tx;c0.z+=tz;c0.n++;}}
 window.__ponts=[];for(const q of cl){if(q.n<4)continue;const cx=q.x/q.n,cz=q.z/q.n;let sxx=0,szz=0,sxz=0,m=0;const r0=Math.floor(PX*.75);
  for(let y=Math.max(0,Math.floor(cz*PX)-r0);y<Math.min(W,Math.floor(cz*PX)+r0);y+=2)for(let x=Math.max(0,Math.floor(cx*PX)-r0);x<Math.min(W,Math.floor(cx*PX)+r0);x+=2){const k=px(x,y);if(D[k]>150&&D[k+1]<90){const dx=x/PX-cx,dz=y/PX-cz;sxx+=dx*dx;szz+=dz*dz;sxz+=dx*dz;m++;}}
  const a=m>3?.5*Math.atan2(2*sxz,sxx-szz):0;window.__ponts.push([+cx.toFixed(2),+cz.toFixed(2),+(a*57.3).toFixed(0)]);
  const gr=new T.Group();/* pont : tablier de planches claires légèrement bombé, garde-corps, piles dans l’eau */for(let k=-5;k<=5;k++){const x=k*.105;bloc(gr,BOX,k%2?0xb08a5c:0xa07c50,PB,[x,.1+.05*(1-(x/.6)**2),0],[0,0,0],[.095,.05,.54]);}
  for(const sd of [-1,1]){bloc(gr,BOX,0x7a5a3a,PB,[0,.3,sd*.25],null,[1.15,.035,.04]);for(const p2 of [-.55,-.18,.18,.55])bloc(gr,BOX,0x6a4a30,PB,[p2,.16,sd*.25],null,[.05,.32,.05]);}
  for(const p2 of [-.3,.3])for(const sd of [-1,1])bloc(gr,CYL,0x5a3e28,PB,[p2,-.02,sd*.2],null,[.07,.2,.07]);
  const wz=cz;gr.rotation.y=-a;gr.position.set(cx,Math.max(-.08,h(cx,wz))+.02,wz);gr.traverse(o=>{if(o.isMesh)o.raycast=()=>{};});scene.add(gr);}}
// sol réaliste : chaque fragment mélange les textures des 4 cases voisines (bords irréguliers), routes et rivières d'après un masque peint
let BRUIT=null;function texBruitGL(){if(BRUIT)return BRUIT;const [T1]=textures();const d=new Uint8Array(65536);for(let i=0;i<65536;i++)d[i]=Math.max(0,Math.min(255,T1[i]*255));BRUIT=new T.DataTexture(d,256,256,T.RedFormat);BRUIT.wrapS=BRUIT.wrapT=T.RepeatWrapping;BRUIT.magFilter=BRUIT.minFilter=T.LinearFilter;BRUIT.needsUpdate=true;return BRUIT;}
let MASQ_CV=null;function masquesSol(){const c=G.carte;const cv=mkC(N*PX,N*PX);MASQ_CV=cv;const g=cv.getContext('2d');g.fillStyle='#000';g.fillRect(0,0,cv.width,cv.height);g.globalCompositeOperation='lighter';
 const rt=i=>c.route[i]&&c.ter[i]!==EAU;g.lineCap='round';g.lineJoin='round';const segs=[];if(c.routeSeg)for(const [a,b] of c.routeSeg){if(rt(a)&&rt(b))segs.push([a%N,(a/N)|0,b%N,(b/N)|0]);}
 g.filter='blur('+(PX*.08)+'px)';g.lineWidth=PX*.42;g.strokeStyle='#ff0000';g.beginPath();for(const [a,b,c2,d2] of segs){g.moveTo((a+.5)*PX,(b+.5)*PX);g.lineTo((c2+.5)*PX,(d2+.5)*PX);}g.stroke();
 try{rivieres(g,Object.assign({graine:G.graine},c),G.objs,'#00ff00');}catch(e){console.warn(e);}g.filter='none';
 const t=new T.CanvasTexture(cv);t.flipY=false;/* 24/11 : sans cela routes et rivières étaient dessinées en miroir (nord ↔ sud) par rapport aux vraies cases de route */t.minFilter=T.LinearMipmapLinearFilter;return t;}
function matSol(){const c=G.carte;const td=new Uint8Array(N*N);for(let i=0;i<N*N;i++)td[i]=c.ter[i];
 {/* 24/11 : sous l’eau, chaque case prend le terrain de la terre la plus proche : le liseré sec d’une case d’eau a la texture de sa rive (plus de dents de scie lave/fond), le fond lui-même est peint en sable par le shader */
  const q=[];const vu=new Uint8Array(N*N);for(let i=0;i<N*N;i++)if(c.ter[i]!==EAU){vu[i]=1;q.push(i);}
  for(let k=0;k<q.length;k++){const i=q[k],x=i%N,y=(i/N)|0;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=N||ny>=N)continue;const j=ny*N+nx;if(vu[j])continue;vu[j]=1;td[j]=td[i];q.push(j);}}}const tt=new T.DataTexture(td,N,N,T.RedFormat);tt.needsUpdate=true;
 /* 24/11 : appartenance douce à chaque terrain (distance exacte au bord des cases, coins arrondis par un flou) : les limites entre terrains ne suivent plus l’escalier des cases */
 const RM=4,WM=N*RM;const MA=new Float32Array(WM*WM*8);
 for(let j=0;j<WM;j++)for(let i=0;i<WM;i++){const x=(i+.5)/RM,z=(j+.5)/RM,tx=Math.floor(x),tz=Math.floor(z),e=td[tz*N+tx];const d=[2,2,2,2,2,2,2,2];
  for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){const nx=tx+dx,nz2=tz+dz;if(nx<0||nz2<0||nx>=N||nz2>=N)continue;const t=td[nz2*N+nx];if(t===e)continue;const ax=Math.max(0,nx-x,x-(nx+1)),az=Math.max(0,nz2-z,z-(nz2+1));const v=Math.hypot(ax,az);if(v<d[t])d[t]=v;}
  let own=2;for(let t=0;t<8;t++)if(t!==e&&d[t]<own)own=d[t];const o=(j*WM+i)*8;for(let t=0;t<8;t++){const sg=t===e?own:-d[t];MA[o+t]=Math.min(1,Math.max(0,.5+sg*.8));}}
 {const tmp=new Float32Array(MA.length);const rb=3;for(let pass=0;pass<3;pass++){for(let j=0;j<WM;j++)for(let i=0;i<WM;i++)for(let t=0;t<8;t++){let a=0,n=0;for(let k=-rb;k<=rb;k++){const ii=i+k;if(ii<0||ii>=WM)continue;a+=MA[(j*WM+ii)*8+t];n++;}tmp[(j*WM+i)*8+t]=a/n;}
  for(let j=0;j<WM;j++)for(let i=0;i<WM;i++)for(let t=0;t<8;t++){let a=0,n=0;for(let k=-rb;k<=rb;k++){const jj=j+k;if(jj<0||jj>=WM)continue;a+=tmp[(jj*WM+i)*8+t];n++;}MA[(j*WM+i)*8+t]=a/n;}}}
 const mk2=o2=>{const u=new Uint8Array(WM*WM*4);for(let k=0;k<WM*WM;k++)for(let c2=0;c2<4;c2++)u[k*4+c2]=Math.round(MA[k*8+o2+c2]*255);const t=new T.DataTexture(u,WM,WM,T.RGBAFormat);t.magFilter=t.minFilter=T.LinearFilter;t.needsUpdate=true;return t;};
 const memA=mk2(0),memB=mk2(4);
 const uni={bsLoin:U.loin,bsRive:{value:RIVE},bsRW:{value:RIVE.userData.W},bsRR:{value:RIVE.userData.R},bsLay:{value:RES.lay},bsLayN:{value:RES.layN||RES.lay},bsRel:{value:RES.layN?1:0},bsTer:{value:tt},bsMemA:{value:memA},bsDbg:{value:0},bsMemB:{value:memB},bsMasque:{value:masquesSol()},bsBr:{value:texBruitGL()}};
 const m=new T.MeshStandardMaterial({roughness:.95,metalness:0});
 return brume(m,{cle:'sol',extra:sh=>{Object.assign(sh.uniforms,uni);
  sh.fragmentShader=sh.fragmentShader.replace('void main() {',(S.qual<=0?'#define BS_LEGER\n':'')+`uniform float bsT;uniform highp sampler2DArray bsLay;uniform highp sampler2DArray bsLayN;uniform float bsRel;vec3 bsNt=vec3(0.,0.,1.);uniform sampler2D bsTer;uniform sampler2D bsMemA;uniform sampler2D bsMemB;uniform sampler2D bsMasque;uniform sampler2D bsBr;uniform sampler2D bsRive;uniform float bsRW;uniform float bsRR;uniform float bsLoin;
float bsRiv=0.,bsGlow=0.;vec4 bsMa,bsMb;
uniform float bsDbg;float mem(float t){int k=int(t+.5);return k<4?bsMa[k]:bsMb[k-4];}
vec3 couche(vec2 p,float id,float nz){vec3 a=texture(bsLay,vec3(p*.42,id)).rgb;
#ifdef BS_LEGER
return a;
#else
vec3 b=texture(bsLay,vec3(mat2(.8,-.6,.6,.8)*p*.29+.37,id)).rgb;return mix(a,b,smoothstep(.3,.7,nz));
#endif
}
float idc(vec2 c){return floor(texture2D(bsTer,(clamp(c,0.,bsN-1.)+.5)/bsN).r*255.+.5);}
void main() {`).replace('#include <map_fragment>',`{vec2 p=vBsW;float nz=texture2D(bsBr,p*.13).r;float nz2=texture2D(bsBr,p*.031+.5).r;
 vec2 f=p-.5;vec2 i0=floor(f);
 float t0=idc(i0),t1=idc(i0+vec2(1.,0.)),t2=idc(i0+vec2(0.,1.)),t3=idc(i0+vec2(1.,1.));
 vec3 c0=couche(p,t0,nz),c1=couche(p,t1,nz),c2=couche(p,t2,nz),c3=couche(p,t3,nz);
 {vec2 um=p/bsN;bsMa=texture2D(bsMemA,um);bsMb=texture2D(bsMemB,um);}
 vec4 w=vec4(mem(t0),t1==t0?0.:mem(t1),(t2==t0||t2==t1)?0.:mem(t2),(t3==t0||t3==t1||t3==t2)?0.:mem(t3));
 vec4 nt=vec4((texture2D(bsBr,p*.37+vec2(t0*.173,t0*.291)).r+.7*texture2D(bsBr,p*1.13+vec2(t0*.311,t0*.137)).r),(texture2D(bsBr,p*.37+vec2(t1*.173,t1*.291)).r+.7*texture2D(bsBr,p*1.13+vec2(t1*.311,t1*.137)).r),(texture2D(bsBr,p*.37+vec2(t2*.173,t2*.291)).r+.7*texture2D(bsBr,p*1.13+vec2(t2*.311,t2*.137)).r),(texture2D(bsBr,p*.37+vec2(t3*.173,t3*.291)).r+.7*texture2D(bsBr,p*1.13+vec2(t3*.311,t3*.137)).r))-.85;w+=nt*.9*step(.001,w);/* bords ondulés : chaque terrain avance ou recule selon son propre bruit (2 octaves) *//* bords ondulés : chaque terrain avance ou recule un peu selon un bruit */
 {vec4 ex=step(.001,w);vec4 sc=w+(vec4(dot(c0,vec3(.33)),dot(c1,vec3(.33)),dot(c2,vec3(.33)),dot(c3,vec3(.33)))-.4)*.18-(1.-ex)*9.;float mx=max(max(sc.x,sc.y),max(sc.z,sc.w));w=exp((sc-mx)*14.)*ex;w/=max(1e-5,w.x+w.y+w.z+w.w);}/* softmax : la limite passe là où les scores (appartenance + bruit + relief de la texture) s’égalent */
 vec3 col=c0*w.x+c1*w.y+c2*w.z+c3*w.w;
 if(bsDbg>.5){float lv=(t0==6.?w.x:0.)+(t1==6.?w.y:0.)+(t2==6.?w.z:0.)+(t3==6.?w.w:0.);col=vec3(lv,mem(6.),mem(0.));}

#ifndef BS_LEGER
 if(bsLoin<.5){vec2 q=p*.42;bsNt=(texture(bsLayN,vec3(q,t0)).xyz*w.x+texture(bsLayN,vec3(q,t1)).xyz*w.y+texture(bsLayN,vec3(q,t2)).xyz*w.z+texture(bsLayN,vec3(q,t3)).xyz*w.w)*2.-1.;}
#endif
 float lav=(t0==6.?w.x:0.)+(t1==6.?w.y:0.)+(t2==6.?w.z:0.)+(t3==6.?w.w:0.);bsGlow=lav*(1.-smoothstep(.015,.06,dot(col,vec3(.33))))*(.6+.4*sin(bsT*2.+nz*20.));col=mix(col,dot(col,vec3(.33))*vec3(.4,.3,.27),lav*.9);// 23/11 : croûte de basalte sombre (au lieu d'ocre vif)
 float hum=(t0==7.?w.x:0.)+(t1==7.?w.y:0.)+(t2==7.?w.z:0.)+(t3==7.?w.w:0.);col*=1.-.38*smoothstep(.05,.6,hum);
 col*=.84+.32*nz2;
 col=mix(vec3(dot(col,vec3(.299,.587,.114))),col,.76);// grandes surfaces moins saturées (revue artistique : S ≤ 0,45)
 {float sub=smoothstep(-.085,-.16,vBsP.y);if(sub>.001){col=mix(col,mix(couche(p,4.,nz)*vec3(.6,.58,.52),col*.7,lav),sub);bsGlow*=1.-sub;}}// 24/11 : fond de l’eau en sable quel que soit le terrain de la case (la limite lave/neige/terre se voyait en dents de scie sous l’eau)
 {float sa=texture2D(bsRive,(vBsW*bsRR+.5)/bsRW).g;if(sa>.002){sa=smoothstep(.2,.7,sa+(nz-.5)*.55);col=mix(col,couche(p,4.,nz)*vec3(.74,.72,.68),sa*(1.-lav));col*=1.-.22*smoothstep(.75,1.,sa);}}// sable mouillé (19/11) : calculé seulement près de l'eau
 {float nu=texture2D(bsBr,(p+vec2(bsT*.35,bsT*.12))*.018).r;col*=1.-.13*smoothstep(.5,.85,nu);}// ombres de nuages
 vec4 mk=texture2D(bsMasque,p/bsN);float rr=smoothstep(.25,.6,mk.r);col=mix(col*(1.-.28*smoothstep(.04,.3,mk.r)),couche(p*1.6,8.,nz)*(.9+.2*nz2),rr);
 bsRiv=smoothstep(.3,.6,mk.g);{/* 24/11 : rivière vivante — berge humide, eau plus claire au bord et sombre au milieu, rides qui coulent, écume le long des rives */vec3 bank=col*(1.-.42*smoothstep(.03,.33,mk.g));bank=mix(bank,bank*vec3(.82,.78,.7),smoothstep(.1,.3,mk.g));vec3 eauR=mix(vec3(.07,.22,.27),vec3(.03,.11,.16),smoothstep(.55,.95,mk.g));float rid=texture2D(bsBr,p*1.7+vec2(bsT*.11,bsT*.07)).r*.6+texture2D(bsBr,p*3.1-vec2(bsT*.09,-bsT*.13)).r*.4;eauR+=vec3(.08,.12,.12)*smoothstep(.55,.8,rid);float ecu=smoothstep(.3,.42,mk.g)*(1.-smoothstep(.45,.62,mk.g))*smoothstep(.45,.7,texture2D(bsBr,p*4.3+vec2(bsT*.2,0.)).r);eauR=mix(eauR,vec3(.78,.84,.82),ecu*.7);col=mix(bank,eauR,bsRiv);}
 diffuseColor.rgb*=col;}`).replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,.06,bsRiv);').replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\n#ifndef BS_LEGER\nif(bsRel>.5){vec3 nW=normalize((vec4(normal,0.)*viewMatrix).xyz);nW=normalize(nW+vec3(bsNt.x,0.,-bsNt.y)*1.1*(1.-bsRiv));normal=normalize((viewMatrix*vec4(nW,0.)).xyz);}\n#endif').replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vec3(1.,.16,.01)*bsGlow*1.8;/* 23/11 : fissures rouge-orangé (le blanc-jaune venait de la saturation) */');}});}
// ---------- brouillard (texture N×N, filtrage linéaire = bords doux) ----------
function majBrume(){const vu=G.joueurs[vueJoueur()].vu;for(let i=0;i<N*N;i++)fogData[i]=vu[i]?255:0;fogTex.needsUpdate=true;}
let VAGUES=null;function texVagues(){if(VAGUES)return VAGUES;const S0=256;const [T1,T2]=textures();const d=new Uint8Array(S0*S0*4);const hh=(x,y)=>T2[((y+S0)%S0)*256+((x+S0)%S0)]*.6+T1[((y*2+S0)%S0)*256+((x*2+S0)%S0)]*.4;
 for(let y=0;y<S0;y++)for(let x=0;x<S0;x++){const dx=(hh(x+1,y)-hh(x-1,y))*6,dy=(hh(x,y+1)-hh(x,y-1))*6;const l=Math.hypot(dx,dy,1);const o=(y*S0+x)*4;d[o]=(-dx/l*.5+.5)*255;d[o+1]=(-dy/l*.5+.5)*255;d[o+2]=(1/l*.5+.5)*255;d[o+3]=255;}
 VAGUES=new T.DataTexture(d,S0,S0);VAGUES.wrapS=VAGUES.wrapT=T.RepeatWrapping;VAGUES.repeat.set(12,12);VAGUES.generateMipmaps=true;VAGUES.minFilter=T.LinearMipmapLinearFilter;VAGUES.magFilter=T.LinearFilter;VAGUES.needsUpdate=true;return VAGUES;}
// ---------- forêts et rochers pré-rendus (imposteurs Poly Haven) : un maillage instancié par bloc de cases ----------
const GIMP=new T.PlaneGeometry(1,1).translate(.5,.5,0);const MIMP={};
function patchImp(sh,vent){sh.vertexShader=sh.vertexShader.replace('void main() {','attribute vec4 aUV;attribute vec2 aAnc;attribute vec2 aTail;\nvoid main() {')
  .replace('#include <begin_vertex>','vec3 transformed=vec3((position.xy-aAnc)*aTail,0.);'+(vent?'{vec4 w0=modelMatrix*instanceMatrix*vec4(0.,0.,0.,1.);float k=max(0.,position.y-aAnc.y)*aTail.y*.025;transformed.x+=sin(bsT*1.5+w0.x*.7+w0.z*.5)*k;}':''))
  .replace('#include <uv_vertex>','#include <uv_vertex>\nvMapUv=aUV.xy+uv*aUV.zw;');}
function matImp(vue,ombre){const k=vue+(ombre?'o':'');if(MIMP[k])return MIMP[k];const tex=RES.atlas[vue].tex;
 if(ombre){const m=new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking,map:tex,alphaTest:.5,side:T.DoubleSide});m.onBeforeCompile=sh=>{sh.uniforms.bsT=U.t;sh.vertexShader='uniform float bsT;\n'+sh.vertexShader;patchImp(sh,true);/* 24/11 : pour l’ombre, carte verticale face au soleil, sans l’inclinaison vers la caméra ni l’étirement vertical (ils projetaient de grandes taches sombres loin des arbres) */sh.vertexShader=sh.vertexShader.replace('#include <project_vertex>','vec4 bsP0=modelMatrix*instanceMatrix*vec4(0.,0.,0.,1.);vec3 bsWp=bsP0.xyz+vec3(.515,0.,.857)*transformed.x+vec3(0.,1.,0.)*transformed.y;vec4 mvPosition=viewMatrix*vec4(bsWp,1.);gl_Position=projectionMatrix*mvPosition;');};m.customProgramCacheKey=()=>'impo2';return MIMP[k]=m;}
 const m=new T.MeshBasicMaterial({map:tex,alphaTest:.5,side:T.DoubleSide,toneMapped:false});return MIMP[k]=brume(m,{cle:'imp',extra:sh=>patchImp(sh,true)});}
// liste d'instances → maillage : [nom, x, y, z, hauteur voulue, miroir, luminosité]
function maillageImp(vue,liste,lean,kY,ombre){const n=liste.length;const g=GIMP.clone();const aUV=new Float32Array(n*4),aAnc=new Float32Array(n*2),aTail=new Float32Array(n*2);
 const im=new T.InstancedMesh(g,matImp(vue),n);const M=new T.Matrix4(),Q=new T.Quaternion().setFromEuler(new T.Euler(-lean,0,0)),P=new T.Vector3(),Sc=new T.Vector3(1,kY,1),C=new T.Color();
 const at=RES.atlas[vue];liste.forEach(([nom,x,y,z,ht,mir,lum],j)=>{const k=nom+'_'+vue,me=RES.imp[k],r=at.rect[k];if(!me||!r)return;const s=ht/me.haut;const w=me.w/me.ppm*s,hh=me.h/me.ppm*s;
  aUV.set(mir?[r[0]+r[2],r[1],-r[2],r[3]]:r,j*4);aAnc.set([mir?1-me.px/me.w:me.px/me.w,1-me.py/me.h],j*2);aTail.set([w,hh],j*2);P.set(x,y,z);M.compose(P,Q,Sc);im.setMatrixAt(j,M);im.setColorAt(j,C.setScalar(lum||1));});
 g.setAttribute('aUV',new T.InstancedBufferAttribute(aUV,4));g.setAttribute('aAnc',new T.InstancedBufferAttribute(aAnc,2));g.setAttribute('aTail',new T.InstancedBufferAttribute(aTail,2));
 im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;im.castShadow=!!ombre;im.receiveShadow=false;im.customDepthMaterial=matImp(vue,true);
 // sphère englobante large (les plans sont déformés dans le shader)
 g.boundingSphere=new T.Sphere();const bb=new T.Box3();liste.forEach(([,x,y,z,ht])=>{bb.expandByPoint(new T.Vector3(x,y,z));bb.expandByPoint(new T.Vector3(x,y+ht*1.2,z));});bb.expandByScalar(1.2);bb.min.z-=4;bb.max.y+=2;bb.getBoundingSphere(g.boundingSphere);im.boundingSphere=g.boundingSphere.clone();/* 24/11 : three r160 culle les InstancedMesh avec leur propre sphère (calculée sur le plan unité, sans le décalage du shader) : des pans entiers de montagnes et de forêts disparaissaient en vue large, ne laissant que leurs ombres */
 // 20/11 : les plans sont penchés vers la caméra dans le shader ; la boîte trop juste faisait disparaître des pans entiers de décor (montagnes, buissons) au bas de l'écran
 return im;}
// un imposteur seul (vrai maillage, pour les décors rendus une fois : combats, villes) ; q = orientation (face à la caméra)
const MPI={};function planImp(vue,nom,ht,mir,q){const k=nom+'_'+vue,me=RES.imp&&RES.imp[k],at=RES.atlas&&RES.atlas[vue];if(!me||!at||!at.rect[k])return null;const r=at.rect[k];const s=ht/me.haut;const w=me.w/me.ppm*s,hh=me.h/me.ppm*s;
 const g=new T.PlaneGeometry(w,hh);const ax=(mir?1-me.px/me.w:me.px/me.w)*w,ay=(1-me.py/me.h)*hh;g.translate(w/2-ax,hh/2-ay,0);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++){let u=uv.getX(i);if(mir)u=1-u;uv.setXY(i,r[0]+u*r[2],r[1]+uv.getY(i)*r[3]);}
 const mk=vue+'m';const m=MPI[mk]||(MPI[mk]=brume(new T.MeshBasicMaterial({map:at.tex,alphaTest:.5,side:T.DoubleSide,toneMapped:false}),{cle:'impl'}));const o=new T.Mesh(g,m);if(q)o.quaternion.copy(q);
 o.customDepthMaterial=MPI[mk+'o']||(MPI[mk+'o']=new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking,map:at.tex,alphaTest:.5,side:T.DoubleSide}));o.castShadow=true;return o;}
function matSolSimple(a,b,ech,var2){const m=new T.MeshStandardMaterial({roughness:.95,metalness:0});const uni={bsLay:{value:RES.lay},bsLayN:{value:RES.layN||RES.lay},bsRel:{value:RES.layN?1:0},bsBr:{value:texBruitGL()}};
 return brume(m,{cle:'solS'+a+b+ech,extra:sh=>{Object.assign(sh.uniforms,uni);sh.fragmentShader=sh.fragmentShader.replace('void main() {','uniform highp sampler2DArray bsLay;uniform highp sampler2DArray bsLayN;uniform float bsRel;vec3 bsNt=vec3(0.,0.,1.);uniform sampler2D bsBr;\nvoid main() {').replace('#include <map_fragment>',`{vec2 p=vBsW*${ech.toFixed(3)};float nz=texture2D(bsBr,p*.11).r,nz2=texture2D(bsBr,p*.023+.4).r;
 vec3 ca=mix(texture(bsLay,vec3(p,${a}.)).rgb,texture(bsLay,vec3(mat2(.8,-.6,.6,.8)*p*.71+.3,${a}.)).rgb,smoothstep(.35,.65,nz));vec3 cb=texture(bsLay,vec3(p*.9,${b}.)).rgb;
 float mb=smoothstep(.56,.68,nz2*.7+nz*.3)*${(var2??1).toFixed(2)};vec3 col=mix(ca,cb,mb);col*=.85+.3*nz2;col=mix(vec3(dot(col,vec3(.299,.587,.114))),col,.8);diffuseColor.rgb*=col;bsNt=mix(texture(bsLayN,vec3(p,${a}.)).xyz,texture(bsLayN,vec3(p*.9,${b}.)).xyz,mb)*2.-1.;}`).replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nif(bsRel>.5){vec3 nW=normalize((vec4(normal,0.)*viewMatrix).xyz);nW=normalize(nW+vec3(bsNt.x,0.,-bsNt.y)*1.1);normal=normalize((viewMatrix*vec4(nW,0.)).xyz);}');}});}
const SEC={herbe:1,terre:2,rude:1,neige:3,sable:2,marais:7,lave:2};const IDT={herbe:0,terre:1,rude:2,neige:3,sable:4,marais:5,lave:6};
/* 23/11 : rochers peints selon le terrain (grès au désert, neige, basalte à fissures de lave) */
function rocT(ter,l){const v={sable:'s',neige:'n',lave:'l'}[ter];return'roc_'+l+(v&&RES.imp&&RES.imp['roc_'+l+v+'_h']?v:'');}
function arbresPour(ter,r){const p=r.f();switch(ter){
 case 'neige':return p<.8?['sapin_a','sapin_b','sapin_c'][r.i(0,2)]+(RES.imp&&RES.imp.sapin_aN_h?'N':''):'arbre_mort';/* 24/11 : sapins enneigés (outils/ressources/sapins_neige.py) */
 case 'sable':return p<.5?'desert_a':p<.75?'desert_b':'desert_c';
 case 'lave':return 'arbre_mort';
 case 'marais':return p<.4?['arbuste_a','arbuste_b'][r.i(0,1)]:p<.75?'jeune_b':'feuillu_b';
 case 'terre':return p<.55?['feuillu_a','feuillu_b'][r.i(0,1)]:p<.85?['arbuste_a','arbuste_c'][r.i(0,1)]:'jeune_b';
 case 'rude':return p<.55?['sapin_a','sapin_b','sapin_c'][r.i(0,2)]:p<.8?['jeune_a','jeune_b'][r.i(0,1)]:'arbuste_b';
 default:return p<.55?['feuillu_a','feuillu_b'][r.i(0,1)]:p<.8?['sapin_a','sapin_b','sapin_c'][r.i(0,2)]:['arbuste_a','arbuste_b','arbuste_c'][r.i(0,2)];}}
function hauteurArbre(nom,r){return nom.startsWith('sapin')?1.25+r.f()*.5:nom.startsWith('feuillu')?1.05+r.f()*.4:nom.startsWith('jeune')?.7+r.f()*.3:nom.startsWith('desert_a')?1.1+r.f()*.3:nom==='arbre_mort'?.9+r.f()*.35:nom==='acacia'?.75+r.f()*.2:nom==='desert_b'?.55+r.f()*.2:nom.startsWith('roc')?.32+r.f()*.25:nom==='mort_a'?.12:.5+r.f()*.25;}
// ---------- géométries de décor ----------
function bruiter(g,k,seed){const p=g.attributes.position;const nz=bruit(seed);for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);const n=nz.fbm(x*1.7+5,z*1.7+y*1.3,3)-.5;const s=1+n*k;p.setXYZ(i,x*s,y*(1+n*k*.6),z*s);}g.computeVertexNormals();return g;}
function colorer(g,f){const p=g.attributes.position;const col=new Float32Array(p.count*3);const c=new T.Color();for(let i=0;i<p.count;i++){f(p.getX(i),p.getY(i),p.getZ(i),c);c.convertSRGBToLinear();col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;}g.setAttribute('color',new T.BufferAttribute(col,3));return g;}
const GEO={};
function geoMontagne(v,ter){const k='m'+v+ter;if(GEO[k])return GEO[k];const r=creeRng(v*13+7);const nz=bruit(v*31+5);const g=new T.PlaneGeometry(2.8,2.8,30,30);g.rotateX(-Math.PI/2);
 const p=g.attributes.position;const pics=[];const np=1+r.i(1,2);for(let i=0;i<np;i++)pics.push([(r.f()-.5)*.9,(r.f()-.5)*.9,.75+r.f()*.6]);
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);const d=Math.hypot(x,z*1.1)/1.38;let env=Math.max(0,1-d*d);env=Math.pow(env,1.15);
  let hp=0;for(const [px,pz,ph] of pics){const dd=Math.hypot(x-px,z-pz);hp=Math.max(hp,ph*Math.max(0,1-dd/1.25));}
  let rid=0,a=1,f=1.3,tot=0;for(let o=0;o<4;o++){const n=nz.fbm(x*f+v*3,z*f-v*2,1);rid+=(1-Math.abs(n*2-1))*a;tot+=a;a*=.5;f*=2.1;}rid/=tot;
  const y=env*(hp*1.55*(.55+rid*.7)+rid*.25)-(d>.97?.25:0);p.setXYZ(i,x+(nz(x*4,z*4)-.5)*.06,y,z+(nz(z*4+9,x*4)-.5)*.06);}
 g.computeVertexNormals();colorer(g,(x,y,z,c)=>c.setRGB(.5,.5,.5));return GEO[k]=g;}
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
function construireDecor(){decor=new T.Group();scene.add(decor);const c=G.carte;const lots={};let ck='';const ajout=(cle,geo,matr,ombre,m)=>{cle+='|'+ck;(lots[cle]=lots[cle]||{geo,l:[],ombre,m}).l.push(matr);};
 const imps={};const imp=(nom,x,z,ht,r,ombre)=>{const k=ck+(ombre?'':'_');(imps[k]=imps[k]||{l:[],ombre}).l.push([nom,x,h(x,z)-.02,z,ht,r.f()<.5,.86+r.f()*.2]);};
 const M4=new T.Matrix4(),Q=new T.Quaternion(),E=new T.Euler(),P=new T.Vector3(),Sc=new T.Vector3();
 const mk=(x,y,z,ry,s,sy)=>{E.set(0,ry,0);Q.setFromEuler(E);P.set(x,y,z);Sc.set(s,sy||s,s);return new T.Matrix4().compose(P,Q,Sc);};
 const occ=new Set(G.objs.map(o=>o.y*N+o.x));const reel=!!(RES.atlas&&RES.imp);
 const mMont={};const matMont=ter=>mMont[ter]||(mMont[ter]=RES.tx.roche?mat(ter==='lave'?0x5a4a46:0xffffff,{tri:ter==='sable'||ter==='terre'?'roche2':'roche',neige:ter==='neige'?.55:ter==='sable'||ter==='lave'?9:1.15,r:.95,ech:.3}):mat(0xffffff,{vc:1,r:.95}));
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){ck=((x/9)|0)+','+((y/9)|0);const i=y*N+x,o=c.obs[i],ter=TER[c.ter[i]];const r=creeRng(i*7+3);
  if(o===OBS.MONT&&reel&&RES.imp['mont_a_h']){const v=(x*5+y*11)%6;const cx=x+1,cz=y+1;const sfx=ter==='neige'?'_n':ter==='lave'&&RES.imp['mont_a_l_h']?'_l':'';imp('mont_'+'abcdef'[v]+sfx,cx+(r.f()-.5)*.3,cz+.35,1.9+r.f()*.9,r,0);/* 23/11 : sans ombre portée (les plans penchés projetaient des ombres géantes) */if(r.f()<.6)imp('mont_'+'abcdef'[(v+3)%6]+sfx,cx+(r.f()-.5)*1.1,cz+.75,1.1+r.f()*.6,r,0);if(ter!=='neige'&&ter!=='lave'&&r.f()<.7){for(let k=0;k<3;k++){const a=r.f()*6.28,d=1+r.f()*.4;const nm=arbresPour(ter,r);imp(nm,cx+Math.cos(a)*d,cz+.9+Math.abs(Math.sin(a))*d*.4,hauteurArbre(nm,r)*.9,r,0);}}}/* 24/11 : sans ombre (cachés derrière la montagne, leurs ombres faisaient des taches sombres sur la plaine) */
  else if(o===OBS.MONT){const v=(x*5+y*11)%6;const g=geoMontagne(v,ter);const cx=x+1,cz=y+1;ajout('m'+v+ter,g,mk(cx,h(cx,cz)-.1,cz,r.f()*6,.95+r.f()*.25,.9+r.f()*.5),1,matMont(ter));
   if(reel&&ter!=='neige'&&ter!=='lave'&&r.f()<.7){for(let k=0;k<2;k++){const a=r.f()*6.28,d=.9+r.f()*.5;const nm=ter==='sable'?'buisson_a':arbresPour(ter,r);imp(nm,cx+Math.cos(a)*d,cz+Math.sin(a)*d*.8,hauteurArbre(nm,r)*.9,r,1);}}}
  else if(o===OBS.VEG){if(reel){// 21/11 : moins d'arbres mais plus grands, pour lire chaque houppier comme dans Heroes (au lieu d'un tapis de feuilles)
   const n=5+r.i(0,2);for(let k=0;k<n;k++){const nm=arbresPour(ter,r);imp(nm,x+.08+r.f()*.84,y+.1+r.f()*.84,hauteurArbre(nm,r)*(1.0+r.f()*.3),r,1);}if(r.f()<.8)imp('buisson_a',x+r.f(),y+.35+r.f()*.6,.3+r.f()*.2,r,0);/* 24/11 : buissons répartis dans la case (alignés en bas, ils dessinaient une haie droite au pied des forêts) */}
   else{const type=ter==='neige'?'sapinN':ter==='sable'?(r.f()<.5?'palmier':'cactus'):ter==='lave'?'mort':ter==='marais'?(r.f()<.6?'mort':'feuillu'):ter==='terre'?(r.f()<.4?'mort':'feuillu'):ter==='rude'?(r.f()<.5?'sapin':'feuillu'):(r.f()<.25?'sapin':'feuillu');
   const n=2+r.i(0,2);for(let k=0;k<n;k++){const v=r.i(0,3);const px=x+.2+r.f()*.6,pz=y+.2+r.f()*.6;ajout('a'+type+v,geoArbre(type,v),mk(px,h(px,pz),pz,r.f()*6,1.1+r.f()*.5),1);}}}
  else if(o===OBS.ROC){if(reel){const n=1+r.i(0,2);for(let k=0;k<n;k++){const nm=rocT(ter,'abcd'[r.i(0,3)]);imp(nm,x+.2+r.f()*.6,y+.25+r.f()*.6,k?.25+r.f()*.15:.4+r.f()*.25,r,1);}if(ter!=='neige'&&ter!=='lave'&&r.f()<.6)imp(ter==='sable'?'desert_b':'buisson_a',x+r.f(),y+.7+r.f()*.3,.3+r.f()*.15,r,0);}
   else{const n=1+r.i(0,1);for(let k=0;k<n;k++){const v=r.i(0,4);const px=x+.25+r.f()*.5,pz=y+.25+r.f()*.5;ajout('r'+v+ter,geoRocher(v,ter),mk(px,h(px,pz),pz,r.f()*6,1+r.f()*.8,.9+r.f()*.6),1);}}}
  else if(!o&&c.ter[i]!==EAU&&!c.route[i]&&!occ.has(i)&&ter!=='neige'&&r.f()<(reel?.55:.10)){// petits buissons et pierres
   const px=x+.2+r.f()*.6,pz=y+.2+r.f()*.6;if(reel&&RES.imp['touffe_a_h']&&(ter==='herbe'||ter==='terre'||ter==='marais'||ter==='rude')&&r.f()<.65){const TF=ter==='marais'?['roseaux_a','touffe_c','roseaux_a','touffe_a','roseaux_a','touffe_b']:['touffe_a','touffe_b','touffe_c','touffe_a','touffe_b','touffe_c'];const n=2+r.i(0,2);for(let k=0;k<n;k++){const nm=TF[r.i(0,5)];imp(nm,x+.05+r.f()*.9,y+.1+r.f()*.85,nm==='tronc_a'?.2:nm==='roseaux_a'?.28+r.f()*.1:.15+r.f()*.08,r,0);}/* 23/11 : roseaux et flaques dans les marais */}
   else if(reel){const p0=r.f();imp(p0<.5?(ter==='sable'?'desert_b':ter==='lave'?'arbre_mort':'buisson_a'):p0<.8?rocT(ter,'abcd'[r.i(0,3)]):arbresPour(ter,r),px,pz,p0<.5?.28+r.f()*.15:p0<.8?.14+r.f()*.1:.55+r.f()*.2,r,0);}
   else if(ter==='herbe'||ter==='terre'||ter==='marais'||ter==='rude'){if(r.f()<.6){const v=r.i(0,3);ajout('a'+(ter==='marais'?'mort':'feuillu')+v,geoArbre(ter==='marais'?'mort':'feuillu',v),mk(px,h(px,pz),pz,r.f()*6,.45+r.f()*.2),0);}else{const v=r.i(0,4);ajout('r'+v+ter,geoRocher(v,ter),mk(px,h(px,pz),pz,r.f()*6,.4+r.f()*.3),0);}}}}
 /* 24/11 : nénuphars sur les eaux calmes près des rives (hors terrains de lave et de neige) */
 if(reel){const cv=mkC(256,256),q=cv.getContext('2d');const pad=(x,y,r,a)=>{q.save();q.translate(x,y);q.rotate(a);const gr=q.createRadialGradient(-r*.2,-r*.2,1,0,0,r);gr.addColorStop(0,'#6f9a3a');gr.addColorStop(1,'#2f5a22');q.fillStyle=gr;q.beginPath();q.moveTo(0,0);q.arc(0,0,r,.35,Math.PI*2-.05);q.closePath();q.fill();q.strokeStyle='rgba(20,40,10,.6)';q.lineWidth=2;q.stroke();q.restore();};
  const rr=creeRng(77);for(let k=0;k<9;k++)pad(40+rr.f()*176,40+rr.f()*176,14+rr.f()*16,rr.f()*6);for(let k=0;k<2;k++){const x=60+rr.f()*136,y=60+rr.f()*136;for(let j=0;j<6;j++){q.fillStyle=j%2?'#f6d0e0':'#e898b8';q.beginPath();q.ellipse(x+Math.cos(j)*5,y+Math.sin(j)*5,6,3,j,0,7);q.fill();}q.fillStyle='#f0d040';q.beginPath();q.arc(x,y,3,0,7);q.fill();}
  const tx=new T.CanvasTexture(cv);tx.colorSpace=T.SRGBColorSpace;const mN=brume(new T.MeshLambertMaterial({map:tx,alphaTest:.4,transparent:false}),{cle:'nenu'});const gN=new T.PlaneGeometry(1,1).rotateX(-Math.PI/2);const L=[];
  for(let y=1;y<N-1;y++)for(let x=1;x<N-1;x++){const i=y*N+x;if(c.ter[i]!==EAU)continue;let land=null;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const j=(y+dy)*N+x+dx;if(c.ter[j]!==EAU){land=TER[c.ter[j]];break;}}if(!land||land==='lave'||land==='neige'||land==='sable')continue;const r=creeRng(i*31+5);if(r.f()>.22)continue;
   const m=new T.Matrix4().compose(new T.Vector3(x+.2+r.f()*.6,-.093,y+.2+r.f()*.6),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),r.f()*6),new T.Vector3(.7+r.f()*.4,1,.7+r.f()*.4));L.push(m);}
  if(L.length){const im=new T.InstancedMesh(gN,mN,L.length);L.forEach((m,j)=>im.setMatrixAt(j,m));im.instanceMatrix.needsUpdate=true;im.computeBoundingSphere();im.receiveShadow=true;im.renderOrder=1.5;decor.add(im);}}
 /* 24/11 : roseaux et pierres le long des rives (cases de terre libres au bord de l’eau), posés sur la berge côté eau */
 if(reel&&RES.imp['roseaux_a_h'])for(let y=1;y<N-1;y++)for(let x=1;x<N-1;x++){const i=y*N+x;if(c.ter[i]===EAU||c.obs[i]||c.route[i]||occ.has(i))continue;const ter=TER[c.ter[i]];if(ter==='lave'||ter==='neige')continue;
  const r=creeRng(i*13+7);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){if(c.ter[(y+dy)*N+x+dx]!==EAU||r.f()>.45)continue;ck=((x/9)|0)+','+((y/9)|0);
   const n=1+r.i(0,2);for(let k=0;k<n;k++){const t=(r.f()-.5)*.8;const px=x+.5+dx*(.4+r.f()*.08)+(dy?t:0),pz=y+.5+dy*(.4+r.f()*.08)+(dx?t:0);
    const nm=ter==='sable'?(r.f()<.6?rocT(ter,'d'):'desert_b'):r.f()<.75?'roseaux_a':rocT(ter,'d');imp(nm,px,pz,nm==='roseaux_a'?.26+r.f()*.12:nm==='desert_b'?.22:.12+r.f()*.06,r,0);}}}
 const mVeg=mat(0xffffff,{vc:1,r:.82,vent:'.035'}),mPierre=mat(0xffffff,{vc:1,r:.95,plat:0});
 for(const k in lots){const L=lots[k];const im=new T.InstancedMesh(L.geo,L.m||(k[0]==='a'?mVeg:mPierre),L.l.length);L.l.forEach((m,j)=>im.setMatrixAt(j,m));im.userData.ombre=!!L.ombre;im.castShadow=!!L.ombre&&S.qual>=2;im.receiveShadow=true;im.instanceMatrix.needsUpdate=true;im.computeBoundingSphere();decor.add(im);}
 for(const k in imps){const L=imps[k];L.l.sort((a,b)=>a[3]-b[3]);{const mi=maillageImp('h',L.l,PAN_A,PAN_K,L.ombre&&S.qual>=2);mi.userData.ombre=!!L.ombre;decor.add(mi);}}}
// ---------- bâtiments en 3D ----------
// pierre des remparts : image chargée dès le départ, texture créée seulement une fois l'image prête
const IMP=new Image();IMP.src=MOTIF_PIERRE_URI;let TEXP=null;
function texPierre(){if(TEXP)return TEXP;if(!IMP.complete||!IMP.naturalWidth)return null;const c=mkC(IMP.naturalWidth,IMP.naturalHeight);c.getContext('2d').drawImage(IMP,0,0);TEXP=new T.CanvasTexture(c);TEXP.wrapS=TEXP.wrapT=T.RepeatWrapping;TEXP.colorSpace=T.SRGBColorSpace;TEXP.repeat.set(1.5,1.5);return TEXP;}
function bloc(gr,geo,c,o,pos,rot,sc){const m=new T.Mesh(geo,mat(c,o));if(pos)m.position.set(...pos);if(rot)m.rotation.set(...rot);if(sc)m.scale.set(...sc);m.userData.ombre=true;m.castShadow=S.qual>=2;m.receiveShadow=true;gr.add(m);return m;}
const BOX=new T.BoxGeometry(1,1,1),CYL=new T.CylinderGeometry(.5,.5,1,12),CONE=new T.ConeGeometry(.5,1,12),CONE4=new T.ConeGeometry(.5,1,4),SPH=new T.SphereGeometry(.5,14,10);
function tour(gr,x,z,r0,ht,mur,toit,forme,pierre){bloc(gr,CYL,mur,pierre,[x,ht/2,z],null,[r0*2,ht,r0*2]);if(forme==='plat'){for(let k=0;k<6;k++){const a=k/6*Math.PI*2;bloc(gr,BOX,mur,pierre,[x+Math.cos(a)*r0*.9,ht+.05,z+Math.sin(a)*r0*.9],null,[.07,.1,.07]);}}
 else bloc(gr,CONE,toit,PT,[x,ht+r0*(forme==='fleche'?1.6:1.1),z],null,[r0*2.5,r0*(forme==='fleche'?3.2:2.2),r0*2.5]);}
function drapeauMesh(gr,x,y,z,coul,s=1){const m=new T.Mesh(new T.PlaneGeometry(.32*s,.2*s,6,2).translate(.16*s,0,0),mat(coul,{onde:1,r:.7}));m.position.set(x,y,z);m.material.side=T.DoubleSide;gr.add(m);const mat2=new T.Mesh(CYL,mat(0x3a2a1a));mat2.scale.set(.025,.42*s,.025);mat2.position.set(x,y-.12*s,z);gr.add(mat2);return m;}
function toitNat(c){return new T.Color(c).lerp(new T.Color(0x9a9aa2),.68).getHex();}

// =========================================================
// ARCHITECTURE : pièces médiévales assemblées (remparts crénelés, tours à mâchicoulis, donjons, portes, maisons à colombages)
// puis fusionnées par matière (peu d'appels de dessin). Matières : pierre de château, enduit, poutres, ardoise, tuile, chaume.
// =========================================================
const PE={tri:'enduit',r:.95,ech:1.3},PP={tri:'poutre',r:.8,ech:1.6},PM3={tri:'mur3',r:.92},PA2={tri:'ardoise2',r:.8,ech:1.2},PV={tri:'pave',r:.95,ech:.8};
const GCYL=new T.CylinderGeometry(.5,.56,1,20,1),GCYLH=new T.CylinderGeometry(.5,.5,1,20,1,true),GCONE=new T.ConeGeometry(.5,1,20,1),GBOX=new T.BoxGeometry(1,1,1);
const GARC=(()=>{const g=new T.CylinderGeometry(.5,.5,1,16,1,false,0,Math.PI);g.rotateX(Math.PI/2);g.rotateZ(Math.PI/2);return g;})();
const NOIR=0x161210;
// mur crénelé entre deux points (au sol), hauteur h, épaisseur e
function rempart(gr,a,b,h,e,mur,P,dents=true){const dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz),ang=-Math.atan2(dz,dx);const cx=(a[0]+b[0])/2,cz=(a[1]+b[1])/2;const ux=dx/L,uz=dz/L,nx=-uz,nz=ux;
 bloc(gr,GBOX,mur,P,[cx,h/2,cz],[0,ang,0],[L,h,e]);bloc(gr,GBOX,mur,P,[cx,h-.02,cz],[0,ang,0],[L,.05,e*1.3]);
 if(dents){const n=Math.max(3,Math.round(L/(e*.8)))|1;for(let k=0;k<n;k+=2){const t=(k+.5)/n-.5;for(const sg of [1,-1])bloc(gr,GBOX,mur,P,[cx+ux*t*L+nx*sg*e*.52,h+e*.25,cz+uz*t*L+nz*sg*e*.52],[0,ang,0],[L/n*.95,e*.5,e*.2]);}}}
// tour ronde : fût légèrement évasé, archères, mâchicoulis, toit conique débordant avec épi (forme : cone | fleche | plat)
function tourR(gr,x,z,r,h,mur,toit,forme,P,PR=PT){bloc(gr,GCYL,mur,P,[x,h/2,z],null,[r*2,h,r*2]);
 bloc(gr,GCYLH,mur,P,[x,h+r*.12,z],null,[r*2.3,r*.26,r*2.3]);// mâchicoulis
 for(let k=0;k<10;k++){const a=k/10*Math.PI*2;bloc(gr,GBOX,mur,P,[x+Math.cos(a)*r*1.1,h-r*.06,z+Math.sin(a)*r*1.1],[0,-a,0],[r*.14,r*.2,r*.2]);}
 for(let k=0;k<3;k++){const y=h*(.35+k*.22);bloc(gr,GBOX,NOIR,{r:1},[x,y,z+r*1.0],null,[r*.12,r*.38,r*.06]);}
 if(forme==='plat'){for(let k=0;k<8;k++){const a=k/8*Math.PI*2;bloc(gr,GBOX,mur,P,[x+Math.cos(a)*r*1.05,h+r*.42,z+Math.sin(a)*r*1.05],[0,-a,0],[r*.32,r*.3,r*.18]);}return;}
 const hc=r*(forme==='fleche'?4.2:2.6);bloc(gr,GCONE,toit,PR,[x,h+r*.25+hc/2,z],null,[r*2.75,hc,r*2.75]);
 bloc(gr,GCYL,0x3a3430,{m:.6,r:.4},[x,h+r*.25+hc+r*.25,z],null,[r*.08,r*.5,r*.08]);}
function tourC(gr,x,z,w,h,mur,toit,P,PR=PT){bloc(gr,GBOX,mur,P,[x,h/2,z],null,[w,h,w]);for(const [sx,sz] of [[1,1],[1,-1],[-1,1],[-1,-1]])bloc(gr,GBOX,mur,P,[x+sx*w*.5,h*.3,z+sz*w*.5],[0,Math.PI/4,0],[w*.18,h*.6,w*.18]);
 bloc(gr,CONE4,toit,PR,[x,h+w*.55,z],[0,Math.PI/4,0],[w*1.55,w*1.1,w*1.55]);for(let k=0;k<2;k++)bloc(gr,GBOX,NOIR,{r:1},[x,h*(.45+k*.25),z+w*.51],null,[w*.12,w*.3,w*.04]);}
// porte fortifiée : deux tours, arche sombre, herse
function porteF(gr,x,z,w,h,mur,toit,forme,P){bloc(gr,GBOX,mur,P,[x,h*.55,z],null,[w,h*1.1,w*.7]);bloc(gr,GBOX,NOIR,{r:1},[x,h*.25,z+w*.36],null,[w*.42,h*.5,.02]);bloc(gr,GARC,NOIR,{r:1},[x,h*.5,z+w*.36],null,[w*.42,.02,w*.42]);
 for(let k=0;k<4;k++)bloc(gr,GBOX,0x2a2622,{m:.7,r:.5},[x-w*.15+k*w*.1,h*.3,z+w*.37],null,[w*.015,h*.55,.015]);
 for(const s of [-1,1])tourR(gr,x+s*w*.55,z+w*.05,w*.28,h*1.35,mur,toit,forme,P);
 const n=4;for(let k=0;k<n;k++){bloc(gr,GBOX,mur,P,[x-w*.38+k*w*.25,h*1.1+w*.08,z+w*.3],null,[w*.12,w*.16,w*.12]);}}
// donjon : tour carrée massive, contreforts, fenêtres éclairées, toit en pavillon
function donjon(gr,x,z,w,d,h,mur,toit,P,nuit,haut=1){bloc(gr,GBOX,mur,P,[x,h/2,z],null,[w,h,d]);
 for(const sx of [-1,1])for(const sz of [-1,1])bloc(gr,GBOX,mur,P,[x+sx*w*.5,h*.4,z+sz*d*.5],[0,Math.PI/4,0],[w*.14,h*.8,w*.14]);
 bloc(gr,GBOX,mur,P,[x,h,z],null,[w*1.08,h*.04,d*1.08]);
 bloc(gr,CONE4,toit,PT,[x,h+w*.45*haut,z],[0,Math.PI/4,0],[w*1.45,w*.9*haut,d*1.45]);
 for(let r=0;r<2;r++)for(let k=0;k<3;k++)bloc(gr,GBOX,0xffd890,{em:nuit?0xffa040:0xffc870,ei:nuit?2:.6},[x-w*.28+k*w*.28,h*(.5+r*.22),z+d*.505],null,[w*.08,h*.08,.01]);}
// maison à colombages : enduit, poutres apparentes, toit débordant, cheminée, fenêtres à volets
let ENDUIT=0xf4efe6;
function colombage(gr,w,d,h,toit,nuit,PR=PTU,porte=true){bloc(gr,GBOX,ENDUIT,PE,[0,h/2,0],null,[w,h,d]);
 const pt=0x4a3220;const e=Math.min(w,h)*.045;
 for(const sx of [-1,1])for(const sz of [-1,1])bloc(gr,GBOX,pt,PP,[sx*w/2,h/2,sz*d/2],null,[e,h,e]);
 for(const y of [0,h*.5,h])for(const sz of [-1,1])bloc(gr,GBOX,pt,PP,[0,y,sz*d/2],null,[w,e,e]);
 for(const sx of [-1,1])for(const y of [0,h*.5,h])bloc(gr,GBOX,pt,PP,[sx*w/2,y,0],null,[e,e,d]);
 for(const sz of [1])for(const sx of [-.25,.25]){const L=Math.hypot(w*.25,h*.5);bloc(gr,GBOX,pt,PP,[sx*w,h*.25,sz*d/2+.001],[0,0,Math.atan2(h*.5,w*.25)*(sx>0?1:-1)],[L,e*.8,e*.8]);}
 // toit à deux pans débordant
 bloc(gr,PRISME,toit,PR,[0,h,0],null,[w*1.18,w*.62,d*1.15]);
 bloc(gr,GBOX,0x6a5a4e,PM3,[w*.28,h+w*.38,-d*.15],null,[w*.12,w*.42,w*.12]);
 for(const sx of [-.28,.28]){bloc(gr,GBOX,nuit?0xffd890:0x2a2a30,nuit?{em:0xffa040,ei:1.8}:{r:.2,m:.3},[sx*w,h*.72,d/2+.005],null,[w*.13,h*.16,.01]);for(const s2 of [-1,1])bloc(gr,GBOX,0x3a4a2a,PP,[sx*w+s2*w*.1,h*.72,d/2+.01],null,[w*.06,h*.17,.012]);}
 if(porte)bloc(gr,GBOX,0x3a2412,PP,[0,h*.2,d/2+.008],null,[w*.2,h*.4,.012]);}
// fusion par matière (meshes statiques) : un appel de dessin par matière
function fusionner(gr,garder=o=>false){gr.updateMatrixWorld(true);const lots=new Map(),hors=[];const inv=new T.Matrix4().copy(gr.matrixWorld).invert();
 gr.traverse(o=>{if(!o.isMesh||o===gr)return;if(garder(o)||o.isInstancedMesh||o.userData.face||o.material.isMeshBasicMaterial){hors.push(o);return;}const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();
  for(const k of Object.keys(g.attributes))if(!['position','normal'].includes(k))g.deleteAttribute(k);g.applyMatrix4(new T.Matrix4().multiplyMatrices(inv,o.matrixWorld));(lots.get(o.material)||lots.set(o.material,[]).get(o.material)).push(g);});
 const out=new T.Group();out.position.copy(gr.position);out.rotation.copy(gr.rotation);out.scale.copy(gr.scale);out.userData=gr.userData;
 for(const [m,gs] of lots){const g=T.BGU.mergeGeometries(gs,false);gs.forEach(x=>x.dispose());const me=new T.Mesh(g,m);me.castShadow=me.receiveShadow=true;out.add(me);}
 for(const o of hors){const wm=new T.Matrix4().multiplyMatrices(inv,o.matrixWorld);o.parent.remove(o);wm.decompose(o.position,o.quaternion,o.scale);out.add(o);}
 return out;}
// fort de la carte rendu dans Blender (Poly Haven modular_fort_01, CC0 ; outils/blender/imp_fort.py) : pied = avant du fort
const FORT={bastion:{w:526,h:751,px:263,py:731.7,ppm:14.709,haut:54.79,larg:35.62},horde:{w:668,h:821,px:334.0,py:796.3,ppm:18.707,haut:43.08,larg:35.62},necro:{w:412,h:697,px:206.0,py:681.3,ppm:11.543,haut:69.81,larg:35.62},sylve:{w:716,h:771,px:346.0,py:750.1,ppm:15.856,haut:50.82,larg:35.62}};
function fortImp(fac,sx){const me=FORT[fac],tx=RES.fort&&(RES.fort[fac+(sx||'')]||RES.fort[fac]);if(!me||!tx)return null;const s=3.3/me.larg;const w=me.w/me.ppm*s,hh=me.h/me.ppm*s;
 const g=new T.PlaneGeometry(w,hh);g.translate(w/2-me.px/me.w*w,hh/2-(1-me.py/me.h)*hh,0);
 const m=brume(new T.MeshBasicMaterial({map:tx,transparent:true,alphaTest:.04,toneMapped:false}),{cle:'fort'});const o=new T.Mesh(g,m);o.quaternion.setFromEuler(new T.Euler(-C3.tang*.75,0,0));o.position.set(0,0,17*s-.45);o.castShadow=false;o.renderOrder=1;return o;}
function villeMesh(v,carte){const gr=new T.Group();const F=FAC[v.fac].coul;const mur=new T.Color(F.mur).getHex(),toit=toitNat(F.toit);const P=PM;
 const fi=carte&&fortImp(v.fac,{3:'_n',4:'_s',6:'_l'}[G.carte.ter[idx(v.x,v.y)]]);const fiOk=!!fi;
 if(fi)gr.add(fi);
 else if(v.fac==='horde'||v.fac==='sylve'){const bois=v.fac==='horde'?0x7a5228:0x8a6238;
  for(let k=0;k<26&&v.fac==='horde';k++){const a=k/26*Math.PI*2;if(Math.abs(a-Math.PI/2)<.3)continue;bloc(gr,CYL,bois,PB,[Math.cos(a)*1.25,.28,Math.sin(a)*.95],null,[.09,.56+(k%2)*.08,.09]);bloc(gr,CONE,bois,PB,[Math.cos(a)*1.25,.62,Math.sin(a)*.95],null,[.09,.12,.09]);}
  if(v.fac==='horde'){for(const [x,z,s] of [[-.6,-.3,.5],[.6,-.3,.5],[0,-.15,.75]]){bloc(gr,CYL,0x9a7448,PB,[x,.22*s/.5,z],null,[s,.44*s/.5,s]);bloc(gr,CONE,0xc9a050,PC,[x,(.44+.35)*s/.5,z],null,[s*1.25,.7*s/.5,s*1.25]);}
   for(const s of [-1,1])bloc(gr,CONE,0xe8dcc4,{},[s*.32,1.55,-.15],[0,0,s*-.5],[.06,.4,.06]);}
  else{const pm={tri:'mur2',r:.9};const vt=0x5a7a62;const C8=[];for(let k=0;k<8;k++){const a=k/8*Math.PI*2+Math.PI/8;C8.push([Math.cos(a)*1.2,Math.sin(a)*.95]);}
   for(let k=0;k<8;k++){if(k===1)continue;rempart(gr,C8[k],C8[(k+1)%8],.42,.12,0xe8e2d4,pm);}
   for(const k of [0,3,5,7]){const [x,z]=C8[k];tourR(gr,x,z,.12,1.05+(k%3)*.15,0xece6d8,vt,'fleche',pm);}
   tourR(gr,0,-.25,.2,1.75,0xece6d8,vt,'fleche',pm);const h0=new T.Group();h0.position.set(.35,0,.15);h0.scale.setScalar(.6);colombage(h0,.8,.6,.45,vt,false,PT);gr.add(h0);
   impObj(gr,'feuillu_b',1.5,-.55,-.1);impObj(gr,'feuillu_a',1.3,.6,-.45,1);impObj(gr,'feuillu_b',1.1,-.2,.45,1);}
  if(v.fac==='horde')bloc(gr,BOX,0x3a2412,PB,[0,.25,.95],null,[.4,.5,.06]);}
 else{const forme=v.fac==='necro'?'fleche':'cone';const nuit=v.fac==='necro';
  const C=[[-1.15,-.85],[1.15,-.85],[1.15,.82],[-1.15,.82]];
  rempart(gr,C[0],C[1],.62,.16,mur,P);rempart(gr,C[1],C[2],.62,.16,mur,P);rempart(gr,C[3],C[0],.62,.16,mur,P);rempart(gr,C[2],[.36,.82],.62,.16,mur,P);rempart(gr,[-.36,.82],C[3],.62,.16,mur,P);
  for(const [x,z] of C)tourR(gr,x,z,.21,1.0,mur,toit,forme,P);
  porteF(gr,0,.82,.62,.62,mur,toit,forme,P);
  donjon(gr,-.05,-.25,.9,.72,1.45,mur,toit,P,nuit,nuit?1.5:1);
  tourR(gr,.5,-.5,.17,1.85,mur,toit,forme,P);tourR(gr,-.58,-.48,.15,1.6,mur,toit,forme,P);
  // cour pavée et maisons dans l'enceinte
  bloc(gr,GBOX,0xb8b0a0,PV,[0,.015,.3],null,[2.1,.03,1.0]);
  for(const [x,z,w] of [[.75,.35,.36],[-.78,.4,.32]]){const h0=new T.Group();h0.position.set(x,0,z);h0.scale.setScalar(.55);colombage(h0,w*1.6,w*1.2,w*1.1,toit,nuit,nuit?PA2:PTU);gr.add(h0);}
  if(nuit)bloc(gr,SPH,0x7cf7a2,{em:0x7cf7a2,ei:2.5},[-.05,2.6,-.25],null,[.12,.12,.12]);}
 const drap=drapeauMesh(gr,fiOk?.06:0,fiOk?(FORT[v.fac].drap||3.15):v.fac==='horde'||v.fac==='sylve'?2.0:2.5,fiOk?-.35:-.25,v.prop>=0?COULEURS[G.joueurs[v.prop].coul].c:'#d8d2c2',1.4);
 const out=fusionner(gr,o=>o===drap);out.scale.setScalar(.95);out.userData.drap=drap;return out;}
// lieux de la carte rendus dans Blender (modèles Sketchfab CC BY, outils/blender/imp_glb.py à 52°) : même pose que le fort (21/11)
const LIEUV={mine_entree_n:{w:341,h:287,px:192.1,py:172.8,ppm:86.768,larg:4.44},mine_entree_s:{w:341,h:287,px:192.1,py:172.8,ppm:86.768,larg:4.44},mine_entree_l:{w:341,h:287,px:192.1,py:172.8,ppm:86.768,larg:4.44},arbre_or:{w:226,h:205,px:110.3,py:196.8,ppm:59.762,larg:3.77},antre:{w:206,h:189,px:114.8,py:110.0,ppm:66.062,larg:3.06},artefact:{w:156,h:239,px:78.0,py:177.6,ppm:178.153,larg:0.9},puits:{w:194,h:279,px:97.0,py:214.6,ppm:147.814,larg:1.49},sanctuaire:{w:284,h:307,px:142.0,py:204.7,ppm:104.05,larg:2.2},fontaine:{w:200,h:182,px:100.0,py:102.2,ppm:108.452,larg:1.9},autel:{w:284,h:269,px:142.0,py:167.4,ppm:178.624,larg:1.3},obelisque:{w:112,h:217,px:56.0,py:173.6,ppm:89.359,larg:0.9},pierre:{w:85,h:183,px:41.5,py:173.2,ppm:152.738,larg:0.54},pile_or:{w:228,h:165,px:113.5,py:85.3,ppm:262.564,larg:0.88},pile_bois:{w:232,h:203,px:115.3,py:121.7,ppm:228.149,larg:1.01},pile_minerai:{w:232,h:164,px:120.2,py:97.4,ppm:275.388,larg:0.84},pile_soufre:{w:185,h:220,px:92.4,py:145.3,ppm:428.459,larg:0.44},pile_cristal:{w:129,h:175,px:63.0,py:120.2,ppm:243.78,larg:0.55},pile_gemmes:{w:208,h:223,px:107.9,py:122.1,ppm:364.084,larg:0.59},pile_mercure:{w:232,h:160,px:116.0,py:114.7,ppm:295.858,larg:0.78},scierie:{w:342,h:298,px:158.1,py:169.1,ppm:87.835,larg:3.88},tour:{w:462,h:633,px:231.0,py:452.2,ppm:53.395,larg:8.62},moulin:{w:323,h:485,px:167.0,py:389.2,ppm:82.12,larg:4.41},mine_entree:{w:341,h:287,px:192.1,py:172.8,ppm:86.768,larg:4.44},ecurie:{w:312,h:300,px:142.2,py:185.3,ppm:106.331,larg:2.93}};function lieuImp(nom,larg){const me=LIEUV[nom],tx=RES.lieuV&&RES.lieuV[nom];if(!me||!tx)return null;const s=larg/me.larg;const w=me.w/me.ppm*s,hh=me.h/me.ppm*s;
 const g=new T.PlaneGeometry(w,hh);g.translate(w/2-me.px/me.w*w,hh/2-(1-me.py/me.h)*hh,0);
 const m=brume(new T.MeshBasicMaterial({map:tx,transparent:true,alphaTest:.04,toneMapped:false}),{cle:'lieu_'+nom});const o=new T.Mesh(g,m);o.quaternion.setFromEuler(new T.Euler(-C3.tang*.75,0,0));o.castShadow=false;o.renderOrder=1;return o;}
function mineMesh(o){const gr=new T.Group();let g=new T.SphereGeometry(.55,16,10,0,Math.PI*2,0,Math.PI/2);g=bruiter(g,.25,o.id);const col={or:0x8a7a5a,minerai:0x7a7670,mercure:0x6a7078,soufre:0x8a7a40,cristal:0x6a5a6a,gemmes:0x5a6a6a,bois:0x6a5a3a}[o.res];
 const liS=o.res==='bois'&&lieuImp('scierie',2.0);if(liS){gr.add(liS);}/* 23/11 : scierie peinte (lieux_peints2.py) avec ses propres rondins */
 else if(o.res==='bois'){const h0=new T.Group();h0.position.set(-.05,0,-.12);colombage(h0,.8,.5,.36,0x8a7a5a,false,PC);gr.add(h0);bloc(gr,GBOX,0x4a3424,PP,[.5,.2,0],null,[.04,.4,.04]);for(let k=0;k<3;k++)bloc(gr,CYL,0xa87a48,PB,[-.25+k*.15,.08+k%2*.06,.35],[0,0,Math.PI/2],[.12,.5,.12]);
  const roue=new T.Group();roue.position.set(.45,.45,-.1);for(let k=0;k<4;k++)bloc(roue,BOX,0xc8b48a,PB,[0,0,0],[0,0,k*Math.PI/4],[.06,.7,.04]);gr.add(roue);gr.userData.tourne=roue;}
 else{// colline rocheuse (19/11) : rochers Poly Haven pré-rendus derrière l'entrée boisée, l'ancien dôme seulement sans atlas
  {const tm=G.carte.ter[idx(o.x,o.y)];const sfx={3:'_n',4:'_s',6:'_l'}[tm]||'';const li=lieuImp('mine_entree'+(RES.lieuV&&RES.lieuV['mine_entree'+sfx]?sfx:''),1.9);/* 23/11 : variante selon le terrain */if(li){li.position.z=-.05;gr.add(li);}else if(RES.atlas){impObj(gr,'roc_a',1.0,-.04,-.08);impObj(gr,'roc_b',.62,-.5,0,1);impObj(gr,'roc_c',.5,.48,.02);}else bloc(gr,g,0xd8d0c4,{tri:'roche2',r:.95,ech:.5},[0,0,-.15],null,[1.1,1.1,1]);
  if(!li){bloc(gr,BOX,0x0e0a08,{r:1},[0,.17,.32],null,[.3,.34,.1]);for(const s2 of [-1,1])bloc(gr,GBOX,0x4a3424,PP,[s2*.18,.2,.38],null,[.05,.42,.05]);bloc(gr,GBOX,0x4a3424,PP,[0,.42,.38],null,[.46,.05,.06]);}}for(let k=0;k<4;k++)bloc(gr,GBOX,0x4a3a30,PP,[0,.005,.5+k*.12],null,[.3,.01,.03]);
  const pile={or:0xf2c23a,minerai:0x9a9a9a,mercure:0xd8e8f0,soufre:0xe8d23a,cristal:0xe0384a,gemmes:0x3ac85a}[o.res];for(let k=0;k<5;k++)bloc(gr,o.res==='cristal'||o.res==='gemmes'?new T.OctahedronGeometry(.08):SPH,o.res==='gemmes'?[0x3a7ae8,0x3ac85a,0xe83a8a,0xf0d03a,0x3ac8e8][k]:pile,{r:.3,m:o.res==='or'||o.res==='mercure'?.7:0,em:o.res==='cristal'||o.res==='gemmes'?pile:null,ei:.25},[-.3+k*.14,.07,.48+(k%2)*.08],null,o.res==='cristal'||o.res==='gemmes'?[1,1.6,1]:[.14,.1,.14]);}
 if(RES.atlas&&o.res!=='bois'){impObj(gr,'tonneau',.22,-.42,.42);impObj(gr,'caisse',.16,.45,.45,1);}gr.userData.drap=drapeauMesh(gr,.3,.95,-.1,o.prop>=0?COULEURS[G.joueurs[o.prop].coul].c:'#d8d2c2',.9);return gr;}
function pileMesh(o){const gr=new T.Group();const r=o.res;gr.add(ombrePied(.6));/* 24/11 */
 {const li=lieuImp('pile_'+r,({or:1.25,bois:.95,minerai:1,soufre:.95,cristal:.85,gemmes:.9,mercure:.95}[r]||.95)*.72)/* 24/11 : piles plus petites */;if(li){gr.add(li);return gr;}}// 21/11 : piles rendues dans Blender (outils/blender/piles.py)
 if(typeof IMGICO!=='undefined'&&IMGICO[r]&&r!=='bois'&&r!=='minerai'){const p=panneau(iconeRes(r,96),'ico'+r+'96',.6);p.position.z=.05;gr.add(p);return gr;}
 if(RES.atlas){if(r==='bois'){impObj(gr,'mort_a',.1,-.05,-.05);impObj(gr,'mort_a',.1,.05,.1,1);return gr;}if(r==='minerai'){impObj(gr,'roc_b',.22,-.1,0);impObj(gr,'roc_c',.16,.12,.08,1);impObj(gr,'roc_d',.12,0,.15);return gr;}if(r==='mercure'){impObj(gr,'seau',.2,0,0);bloc(gr,SPH,0xcfe3ea,{r:.05,m:1},[0,.18,.02],null,[.12,.03,.12]);return gr;}}
 if(r==='or'){for(let k=0;k<7;k++)bloc(gr,CYL,0xf2c23a,{r:.3,m:.45,em:0x6a4a00,ei:.4},[(k%3-1)*.12,.03+(k/3|0)*.05,((k*7)%3-1)*.08],null,[.14,.04,.14]);}
 else if(r==='bois'){for(let k=0;k<5;k++)bloc(gr,CYL,0x8a5a30,PB,[(k%3-1)*.1,.06+(k>2?.1:0),0],[Math.PI/2,0,.3],[.1,.45,.1]);}
 else if(r==='minerai'){for(let k=0;k<4;k++){const m=bloc(gr,geoRocher(k,'rude'),0x8a8f96,{},[(k%2-.5)*.18,0,((k>>1)-.5)*.15],null,[.6,.6,.6]);}}
 else if(r==='mercure'){bloc(gr,SPH,0xcfe3ea,{r:.05,m:.2,transp:.75},[0,.16,0],null,[.28,.28,.28]);bloc(gr,CYL,0x8a5a30,PB,[0,.33,0],null,[.08,.08,.08]);bloc(gr,SPH,0xb8c0cc,{r:.15,m:1},[0,.12,0],null,[.2,.12,.2]);}
 else if(r==='soufre'){bloc(gr,CONE,0xe8d23a,{r:.9},[0,.12,0],null,[.45,.24,.45]);}
 else{const cs=r==='cristal'?[0xe0384a]:[0x3a7ae8,0x3ac85a,0xe83a8a,0xf0d03a];for(let k=0;k<5;k++)bloc(gr,new T.OctahedronGeometry(.09),cs[k%cs.length],{r:.2,em:cs[k%cs.length],ei:.35},[(k%3-1)*.12,.12,((k*5)%3-1)*.1],[0,k,0],[1,1.8,1]);}
 return gr;}
function impObj(gr,nom,ht,x,z,mir){const o=RES.atlas?planImp('h',nom,ht,!!mir,new T.Quaternion().setFromEuler(new T.Euler(-C3.tang*.75,0,0))):null;if(o){o.position.set(x,0,z);gr.add(o);}return o;}
function coffreMesh(){const gr=new T.Group();if(impObj(gr,'coffre',.32,0,0)){gr.add(ombrePied(.6));return gr;} bloc(gr,BOX,0x8a5a2a,PB,[0,.14,0],null,[.5,.28,.32]);bloc(gr,CYL,0x9a6a32,PB,[0,.28,0],[0,0,Math.PI/2],[.32,.5,.32]);bloc(gr,BOX,0xd8b040,{m:.7,r:.3},[0,.2,.17],null,[.08,.1,.02]);return gr;}
const _GS=new T.SphereGeometry(.5,16,12);function GSPH(){return _GS;}
function lieuMesh(o){const gr=new T.Group();const b=o.b;
 switch(b){
 case 'moulin':{const li=lieuImp('moulin',2.1);if(li){gr.add(li);break;}tourR(gr,0,0,.24,.95,0xd8d0c0,0x7a5a3a,'cone',PM3,PB);const ail=new T.Group();ail.position.set(0,.98,.3);for(let k=0;k<4;k++){const a=new T.Group();a.rotation.z=k*Math.PI/2;bloc(a,GBOX,0x5a4030,PP,[0,.45,0],null,[.03,.9,.03]);for(let j=1;j<6;j++)bloc(a,GBOX,0x6a4a34,PP,[.06,j*.15,0],null,[.12,.012,.01]);bloc(a,GBOX,0xd8d0bc,PE,[.07,.5,-.005],null,[.12,.66,.004]);ail.add(a);}gr.add(ail);gr.userData.tourne=ail;break;}
 case 'puits':{const li=lieuImp('puits',1.05);if(li){gr.add(li);break;}}bloc(gr,GCYL,0xb0a898,PM3,[0,.16,0],null,[.5,.32,.5]);bloc(gr,GCYL,0x1a3a4a,{r:.05},[0,.3,0],null,[.4,.02,.4]);for(const s2 of [-1,1])bloc(gr,GBOX,0x5a4030,PP,[s2*.22,.5,0],null,[.05,.66,.05]);bloc(gr,GBOX,0x5a4030,PP,[0,.72,0],[Math.PI/2,0,0],[.04,.04,.5]);bloc(gr,PRISME,0x7a7a82,PT,[0,.84,0],null,[.62,.28,.5]);break;
 case 'autel':{const li=lieuImp('autel',0.95);if(li){gr.add(li);break;}}bloc(gr,GBOX,0xb8b0a0,PM3,[0,.06,0],null,[.75,.12,.55]);bloc(gr,GBOX,0xb8b0a0,PM3,[0,.24,0],null,[.55,.26,.35]);bloc(gr,GCONE,0xff8a2a,{em:0xff6a1a,ei:3},[0,.5,0],null,[.16,.3,.16]);for(const s2 of [-1,1])bloc(gr,GCYL,0xc0b8a8,PM3,[s2*.32,.35,-.2],null,[.07,.7,.07]);break;
 case 'pierre':{const li=lieuImp('pierre',0.38);if(li){gr.add(li);break;}}bloc(gr,BOX,0x7a7a84,PM,[0,.45,0],[0,0,.08],[.28,.9,.18]);bloc(gr,BOX,0x9ae8ff,{em:0x7ad8ff,ei:2},[0,.5,.095],null,[.05,.4,.01]);break;
 case 'arbre':{const li=lieuImp('arbre_or',1.3);if(li){gr.add(li);break;}const g=geoArbre('feuillu',1);const m=new T.Mesh(g,mat(0xffd860,{vc:1,em:0x806000,ei:.35,vent:'.03'}));m.scale.setScalar(2);m.castShadow=true;gr.add(m);break;}
 case 'tour':{const li=lieuImp('tour',1.0);if(li){gr.add(li);break;}}tourR(gr,0,0,.24,1.5,0xa8a090,0x6a6a72,'plat',PM);bloc(gr,GBOX,0x3a2412,PP,[0,.18,.24],null,[.12,.24,.02]);break;
 case 'sanctuaire':{const li=lieuImp('sanctuaire',1.25);if(li){gr.add(li);break;}}bloc(gr,GBOX,0xd8d2c2,PM2,[0,.05,0],null,[.85,.1,.62]);bloc(gr,GBOX,0xd8d2c2,PM2,[0,.11,0],null,[.75,.04,.54]);for(let k=0;k<6;k++)bloc(gr,GCYL,0xece6d6,PM2,[(k%3-1)*.3,.45,((k/3|0)-.5)*.4],null,[.07,.66,.07]);bloc(gr,GBOX,0xd8d2c2,PM2,[0,.8,0],null,[.8,.06,.55]);bloc(gr,PRISME,0x8a8a92,PT,[0,.83,0],null,[.9,.32,.62]);bloc(gr,GSPH(),0xd8c0ff,{em:0xbfa0ff,ei:2},[0,.4,0],null,[.12,.12,.12]);break;
 case 'ecurie':{const li=lieuImp('ecurie',1.7);if(li){gr.add(li);break;}const h0=new T.Group();colombage(h0,.9,.55,.38,0xc9a050,false,PC);gr.add(h0);for(let k=0;k<5;k++)bloc(gr,GBOX,0x5a4030,PP,[-.6+k*.3,.14,.55],null,[.035,.28,.035]);bloc(gr,GBOX,0x5a4030,PP,[0,.24,.55],null,[1.25,.03,.03]);break;}
 case 'feu':if(RES.atlas){impObj(gr,'feu',.18,0,.1);impObj(gr,'tonneau',.3,-.32,-.05);impObj(gr,'caisse',.2,.32,-.05,1);bloc(gr,CONE,0xffb03a,{em:0xff8a2a,ei:3},[0,.14,.12],null,[.1,.22,.1]);break;}for(const s of [-1,1])bloc(gr,CONE4,0xc8b48a,PB,[s*.32,.22,0],[0,Math.PI/4,0],[.45,.44,.45]);bloc(gr,CONE,0xffb03a,{em:0xff8a2a,ei:2.5},[0,.15,.2],null,[.14,.3,.14]);bloc(gr,CYL,0xf2c23a,{m:.8,r:.3},[.2,.03,.3],null,[.12,.04,.12]);break;
 case 'fontaine':{const li=lieuImp('fontaine',1.0);if(li){gr.add(li);break;}}bloc(gr,GCYL,0xc0b8a8,PM3,[0,.09,0],null,[.8,.18,.8]);bloc(gr,GCYL,0x1a4a5a,{r:.04,m:.1},[0,.17,0],null,[.7,.02,.7]);bloc(gr,GCYL,0xc8c0b0,PM3,[0,.36,0],null,[.1,.5,.1]);bloc(gr,GCYL,0xc8c0b0,PM3,[0,.6,0],null,[.32,.06,.32]);bloc(gr,GSPH(),0xbfe8ff,{transp:.55,em:0x6ab8e8,ei:.3},[0,.45,0],null,[.28,.3,.28]);break;
 case 'obelisque':{const li=lieuImp('obelisque',0.45);if(li){gr.add(li);break;}}bloc(gr,CONE4,0x8a8478,PM,[0,.65,0],[0,Math.PI/4,0],[.32,1.3,.32]);bloc(gr,BOX,0xffe08a,{em:0xffd060,ei:2},[0,.6,.09],null,[.04,.5,.01]);bloc(gr,BOX,0x9a948a,PM,[0,.05,0],null,[.5,.1,.5]);break;
 case 'habitation':{const li=lieuImp('antre',1.25);if(li){gr.add(li);break;}let g=new T.SphereGeometry(.5,24,12,0,Math.PI*2,0,Math.PI/2);g=bruiter(g,.3,o.id+3);bloc(gr,g,0xd0c8bc,{tri:'roche2',r:.95,ech:.5},[0,0,-.1],null,[1.15,1.1,1]);bloc(gr,GBOX,0x0e0a08,{r:1},[0,.16,.4],null,[.3,.32,.06]);for(const s2 of [-1,1])bloc(gr,GBOX,0x4a3424,PP,[s2*.17,.18,.42],null,[.04,.36,.04]);bloc(gr,GBOX,0x4a3424,PP,[0,.35,.42],null,[.42,.04,.04]);break;}
 }return gr;}
function artefactMesh(o){const gr=new T.Group();{const li=lieuImp('artefact',.5);if(li){gr.add(li);return gr;}}bloc(gr,CYL,0xbcb6aa,PM,[0,.06,0],null,[.32,.12,.32]);const g=bloc(gr,new T.OctahedronGeometry(.13),0xffe08a,{em:0xffc040,ei:1.6,r:.2,m:.5},[0,.38,0],null,[1,1.5,1]);gr.userData.flotte=g;return gr;}
// ---------- panneaux (créatures, héros, habitants) ----------
const TXC=new Map();function texCanvas(c,cle){if(TXC.has(cle))return TXC.get(cle);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;TXC.set(cle,t);return t;}
// panneau penché à mi-chemin entre la verticale et la caméra : se lit bien sans traverser les murs voisins
const GPAN=new T.PlaneGeometry(1,1).translate(0,.4,0);const PANM=new Map();
/* 24/11 : ombre de contact douce sous les créatures et les héros de la carte (ellipse sombre posée au sol) */
let MOMB=null;function ombrePied(l){if(!MOMB){const c=mkC(128,128),g=c.getContext('2d');const gr=g.createRadialGradient(64,64,4,64,64,62);gr.addColorStop(0,'rgba(0,0,0,.55)');gr.addColorStop(.55,'rgba(0,0,0,.3)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);
 const t=new T.CanvasTexture(c);MOMB=brume(new T.MeshBasicMaterial({map:t,transparent:true,depthWrite:false}),{cle:'ombp'});}
 const o=new T.Mesh(new T.PlaneGeometry(1,1).rotateX(-Math.PI/2),MOMB);o.scale.set(l,1,l*.55);o.position.y=.02;o.renderOrder=1;o.raycast=()=>{};return o;}
/* 24/11 : monstres de la carte animés (4 images de repos dans une bande, décalage de texture : aucun coût de rendu en plus) */
const PANA=new Set();function panneauAnime(bande,cle,taille,id){let m=PANM.get(cle);if(!m){const t=new T.CanvasTexture(bande);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;t.repeat.set(.25,1);
  m=brume(new T.MeshBasicMaterial({map:t,transparent:true,alphaTest:.12,side:T.DoubleSide}));m.userData.ph=(id.length*7+id.charCodeAt(0))%13/13;PANM.set(cle,m);PANA.add(m);}
 const s=new T.Mesh(GPAN,m);s.userData.pan=1;s.scale.set(taille,taille*PAN_K,1);s.rotation.x=-PAN_A;s.renderOrder=2;return s;}
function panneau(canvas,cle,taille,miroir){const k=cle+(miroir?'-':'');let m=PANM.get(k);if(!m){const t=texCanvas(canvas,cle);m=brume(new T.MeshBasicMaterial({map:t,transparent:true,alphaTest:.12,side:T.DoubleSide}));if(miroir){m.map=t.clone();m.map.repeat.x=-1;m.map.offset.x=1;m.map.needsUpdate=true;}PANM.set(k,m);}
 const s=new T.Mesh(GPAN,m);s.userData.pan=1;s.scale.set(taille,taille*PAN_K,1);s.rotation.x=-PAN_A;s.renderOrder=2;return s;}
/* 24/11 : petits nuages de poussière sous les sabots pendant le déplacement d’un héros */
let POUS=null;function animPoussiere(t){if(!scene)return;if(!POUS){const c=mkC(64,64),q=c.getContext('2d');const gr=q.createRadialGradient(32,32,2,32,32,30);gr.addColorStop(0,'rgba(210,190,150,.8)');gr.addColorStop(1,'rgba(200,180,140,0)');q.fillStyle=gr;q.fillRect(0,0,64,64);const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;
  POUS={l:[],d:0,m:tx};for(let i=0;i<14;i++){const s=new T.Sprite(new T.SpriteMaterial({map:tx,transparent:true,depthWrite:false,opacity:0}));s.raycast=()=>{};s.renderOrder=3;s.userData.t0=-9;POUS.l.push(s);}}
 for(const s of POUS.l)if(s.parent!==scene)scene.add(s);
 if(V.anim&&V.anim.h&&t-POUS.d>.09&&typeof posHeros==='function'){POUS.d=t;const [x,y]=posHeros(V.anim.h);const s=POUS.l.find(q=>t-q.userData.t0>.8);if(s){s.userData.t0=t;s.userData.x=x+.5+(Math.random()-.5)*.25;s.userData.z=y+.78+(Math.random()-.5)*.12;}}
 for(const s of POUS.l){const a=(t-s.userData.t0)/.8;if(a<0||a>1){s.visible=false;continue;}s.visible=true;s.position.set(s.userData.x,Math.max(-.08,h(s.userData.x,s.userData.z))+.08+a*.25,s.userData.z);s.scale.setScalar(.28+a*.55);s.material.opacity=.8*(1-a)*Math.min(1,a*6);}}
/* 24/11 : un vol d'oiseaux traverse de temps en temps la carte (silhouettes qui battent des ailes, ombre au sol) */
let OIS=null;function animOiseaux(t){if(!scene)return;if(!OIS){const c=mkC(64,32),q=c.getContext('2d');q.strokeStyle='#1c1814';q.lineWidth=3.2;q.lineCap='round';q.beginPath();q.moveTo(4,10);q.quadraticCurveTo(18,4,32,16);q.quadraticCurveTo(46,4,60,10);q.stroke();const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;
  const m=new T.SpriteMaterial({map:tx,transparent:true,depthWrite:false,opacity:.85}),mo=new T.SpriteMaterial({map:tx,transparent:true,depthWrite:false,opacity:.18,color:0x000000});OIS={g:new T.Group(),b:[]};
  for(let i=0;i<5;i++){const s=new T.Sprite(m),o=new T.Sprite(mo);s.raycast=o.raycast=()=>{};s.renderOrder=6;OIS.g.add(s,o);OIS.b.push([s,o,[(i%2?1:-1)*Math.ceil(i/2)*.55,Math.ceil(i/2)*.5]]);}scene.add(OIS.g);}
 if(OIS.g.parent!==scene)scene.add(OIS.g);const P=46,p=(t%P)/P;OIS.g.visible=p<.45;if(!OIS.g.visible)return;const k=window.OIS_K??p/.45,cy=C3.cible;const ang=Math.floor(t/P)*2.1;const dx=Math.cos(ang),dz=Math.sin(ang);const L=C3.dist*1.5;
 const cx=cy.x+dx*(k-.5)*L*2,cz=cy.z+dz*(k-.5)*L*2;for(let i=0;i<OIS.b.length;i++){const [s,o,[ox,oz]]=OIS.b[i];const x=cx-dx*oz+(-dz)*ox,z=cz-dz*oz+dx*ox,y=4.2+Math.sin(t*.9+i)*.15;const f=.5+.5*Math.sin(t*9+i*1.7);
  s.position.set(x,y,z);s.scale.set(.5,.18+.14*f,1);o.position.set(x+5.1,.05,z-3.0);o.scale.set(.5,.2,1);}}
/* 24/11 : éclat doré qui scintille sur les coffres (on les repère d'un coup d'œil, comme dans Heroes III) */
let TETO=null;function scintille(g,x,y){if(!TETO){const c=mkC(64,64),q=c.getContext('2d');const gr=q.createRadialGradient(32,32,0,32,32,12);gr.addColorStop(0,'rgba(255,250,220,1)');gr.addColorStop(1,'rgba(255,220,120,0)');q.fillStyle=gr;q.fillRect(0,0,64,64);q.globalCompositeOperation='lighter';for(const [w,h] of [[30,2.2],[2.2,30]]){const l=q.createRadialGradient(32,32,0,32,32,30);l.addColorStop(0,'rgba(255,240,190,.95)');l.addColorStop(1,'rgba(255,200,90,0)');q.fillStyle=l;q.fillRect(32-w,32-h,w*2,h*2);}TETO=new T.CanvasTexture(c);TETO.colorSpace=T.SRGBColorSpace;}
 const s=new T.Sprite(new T.SpriteMaterial({map:TETO,transparent:true,depthWrite:false,blending:T.AdditiveBlending,opacity:0}));s.position.set(x,y,0);s.raycast=()=>{};s.renderOrder=5;g.add(s);g.userData.eclat=s;}
/* 24/11 : fumée de cheminée au-dessus des villes de la carte (cinq bouffées douces qui montent et se dissipent) */
let TFUM=null;function fumeeVille(g){if(!TFUM){const c=mkC(64,64),x=c.getContext('2d');const gr=x.createRadialGradient(32,32,2,32,32,30);gr.addColorStop(0,'rgba(235,232,226,.9)');gr.addColorStop(.5,'rgba(215,212,206,.45)');gr.addColorStop(1,'rgba(200,198,194,0)');x.fillStyle=gr;x.fillRect(0,0,64,64);TFUM=new T.CanvasTexture(c);TFUM.colorSpace=T.SRGBColorSpace;}
 const f=[];for(let i=0;i<5;i++){const s=new T.Sprite(new T.SpriteMaterial({map:TFUM,transparent:true,depthWrite:false,depthTest:false,opacity:0}));s.raycast=()=>{};s.renderOrder=4;g.add(s);f.push(s);}g.userData.fumee=f;}
function animFumee(g,t){const f=g.userData.fumee;const ph=(g.userData.id||0)*.37;for(let i=0;i<f.length;i++){const p=(t*.16+i/f.length+ph)%1;const s=f[i];s.position.set(-.7+p*.6+Math.sin(t*.7+i)*.06,3.3+p*2.2,-.5);const k=.35+p*1.0;s.scale.set(k,k,1);s.material.opacity=Math.sin(Math.PI*Math.min(1,p*1.15))*.5;}}
function objet3D(o){let g=null;
 switch(o.t){case 'ville':g=villeMesh(o,true);fumeeVille(g);break;case 'mine':g=mineMesh(o);break;case 'res':g=pileMesh(o);if(o.res==='or'||o.res==='gemmes'||o.res==='cristal')scintille(g,.05,.25);break;case 'coffre':g=coffreMesh();scintille(g,.1,.35);break;case 'artefact':g=artefactMesh(o);scintille(g,.08,.45);break;
  case 'bat':g=lieuMesh(o);if(o.b==='habitation'&&o.cre){const s=panneau(spriteCreature(o.cre,128),'c'+o.cre+'128',.9);s.position.set(.25,0,.3);g.add(s);}break;
  case 'monstre':{g=new T.Group();const br=bandeRepos(o.cre,160);const s=br?panneauAnime(br,'ma'+o.cre+'160',1.75,o.cre):panneau(spriteMiroir(o.cre,160),'m'+o.cre+'160',1.75);g.add(ombrePied(.95),s);g.userData.sprite=s;break;}}
 if(!g)return null;const y=o.t==='ville'?sol(o.x,o.y-.4):sol(o.x,o.y);g.position.set(o.x+.5,y,o.y+.5+(o.t==='ville'?-1.05:o.t==='mine'?-.45:0));
 g.userData.id=o.id;g.userData.prop=o.prop;g.userData.tile=o.y*N+o.x;g.traverse(m=>m.userData.tile=o.y*N+o.x);return g;}
// ---------- chemin, sélection ----------
function construireAides(){/* 24/11 : flèches de chemin dessinées (pointe épaisse cerclée de sombre, comme dans Heroes III) ; frustumCulled=false : la sphère englobante calculée à vide les rendait invisibles */
 const cv=mkC(128,128),q=cv.getContext('2d');q.translate(64,64);const fl=()=>{q.beginPath();q.moveTo(46,0);q.lineTo(-6,-34);q.lineTo(-6,-14);q.lineTo(-40,-14);q.lineTo(-40,14);q.lineTo(-6,14);q.lineTo(-6,34);q.closePath();};
 q.lineJoin='round';q.shadowColor='rgba(0,0,0,.55)';q.shadowBlur=8;fl();q.lineWidth=14;q.strokeStyle='rgba(20,14,6,.9)';q.stroke();q.shadowBlur=0;const gr=q.createLinearGradient(0,-34,0,34);gr.addColorStop(0,'#ffffff');gr.addColorStop(1,'#bdbdbd');fl();q.fillStyle=gr;q.fill();
 const tx=new T.CanvasTexture(cv);tx.colorSpace=T.SRGBColorSpace;tx.anisotropy=4;const g=new T.PlaneGeometry(.44,.44);g.rotateX(-Math.PI/2);
 fleches=new T.InstancedMesh(g,new T.MeshBasicMaterial({map:tx,color:0xffffff,transparent:true,opacity:.97,depthWrite:false,toneMapped:false}),400);fleches.frustumCulled=false;fleches.count=0;fleches.renderOrder=3;scene.add(fleches);
 anneau=new T.Mesh(new T.RingGeometry(.36,.46,32).rotateX(-Math.PI/2),new T.MeshBasicMaterial({color:0xffe08a,transparent:true,opacity:.8,depthWrite:false}));anneau.renderOrder=2;scene.add(anneau);
 const cg=new T.Group();for(const r of [.785,-.785]){const b=new T.Mesh(new T.BoxGeometry(.5,.04,.08),new T.MeshBasicMaterial({color:0xe83a2a}));b.rotation.y=r;cg.add(b);}croixG=cg;scene.add(croixG);}
let cheminCle='';function majChemin(){const c=V.chemin;const cle=c?c.h+':'+c.dest+':'+c.ch.length+':'+(heroPar(c.h)||{}).mp:'';if(cle===cheminCle)return;cheminCle=cle;if(!c){fleches.count=0;return;}const h0=heroPar(c.h);if(!h0){fleches.count=0;return;}
 const M=new T.Matrix4(),Q=new T.Quaternion(),P=new T.Vector3(),Sc=new T.Vector3(1,1,1);const col=new T.Color();let n=0;
 for(let k=0;k<c.ch.length&&n<400;k++){const [x,y]=xy(c.ch[k]);const fin=k===c.ch.length-1;const ok=c.cout[k]<=h0.mp;let a=0;if(!fin){const [nx,ny]=xy(c.ch[k+1]);a=Math.atan2(ny-y,nx-x);}else{const [px,py]=k?xy(c.ch[k-1]):[h0.x,h0.y];a=Math.atan2(y-py,x-px);}
  Q.setFromAxisAngle(new T.Vector3(0,1,0),-a);P.set(x+.5,sol(x,y)+.06,y+.5);Sc.setScalar(fin?1.6:1);M.compose(P,Q,Sc);fleches.setMatrixAt(n,M);fleches.setColorAt(n,col.set(ok?0x7cf07c:0xff6a50));n++;}
 fleches.count=n;fleches.instanceMatrix.needsUpdate=true;if(fleches.instanceColor)fleches.instanceColor.needsUpdate=true;}
// ---------- synchronisation avec la partie ----------
function majObjets(){const vu=G.joueurs[vueJoueur()].vu;const vus=new Set();
 for(const o of G.objs){vus.add(o.id);let g=objets.get(o.id);if(g&&(g.userData.prop!==o.prop||(o.t==='ville'&&g.userData.bat!==Object.keys(o.bat).length))){grp.remove(g);g=null;objets.delete(o.id);}
  if(!g){g=objet3D(o);if(!g)continue;if(o.t==='ville')g.userData.bat=Object.keys(o.bat).length;objets.set(o.id,g);grp.add(g);}
  // visible si la case (ou une case de l'emprise d'une ville) a été explorée
  g.visible=!!(vu[o.y*N+o.x]||(o.t==='ville'&&vu[(o.y-1)*N+o.x]));}
 for(const [id,g] of objets)if(!vus.has(id)){grp.remove(g);objets.delete(id);}}
// 23/11 : héros sur la carte = chevalier monté Sketchfab (planche « cavalier ») avec étendard aux couleurs du joueur, comme les héros de Heroes III
const HMONT=new Map();function spriteHerosMonte(h,fr){if(typeof SPR3D==='undefined'||!SPR3D.cavalier||typeof IMG3D==='undefined'||!IMG3D.cavalier||!IMG3D.cavalier.width)return null;
 const k=h.j+':'+(fr<0?0:fr);if(HMONT.has(k))return HMONT.get(k);const D=SPR3D.cavalier;const c=mkC(192,192),g=c.getContext('2d');
 const col=(COULEURS[G.joueurs[h.j].coul]||{}).c||'#c03030';
 g.strokeStyle='#3a2410';g.lineWidth=3;g.beginPath();g.moveTo(64,150);g.lineTo(64,22);g.stroke();
 g.fillStyle=col;g.strokeStyle='#1a1008';g.lineWidth=1.5;g.beginPath();g.moveTo(65,24);g.quadraticCurveTo(92,20,112,30);g.lineTo(104,40);g.lineTo(112,50);g.quadraticCurveTo(92,44,65,52);g.closePath();g.fill();g.stroke();
 const ppu=D.pxu*1.0;const [im0,sx,sy,sw,sh]=cadre3D('cavalier','idle',fr<0?0:fr%((D.n&&D.n.idle)||1));const e=Math.min(176/sw,176/sh);
 g.drawImage(planche3D(im0),sx,sy,sw,sh,96-sw*e/2,186-sh*e,sw*e,sh*e);HMONT.set(k,c);return c;}
window.spriteHerosMonte=spriteHerosMonte;
const HOMB=new Map();function majHeros(){const vu=G.joueurs[vueJoueur()].vu;const ids=new Set();
 for(const h of G.heros){ids.add(h.id);const dir=V.anim&&V.anim.h===h?(V.anim.x1<V.anim.x0?-1:V.anim.x1>V.anim.x0?1:(h.dir||1)):(h.dir||1);const fr=V.anim&&V.anim.h===h&&typeof spriteHeros3D==='function'&&a3d('h_'+h.classe)?Math.floor(performance.now()/140)%4:-1;const cle=h.classe+':'+h.j+':'+dir+':'+fr+(typeof IMG3D!=='undefined'&&IMG3D.cavalier?'m':'');let s=herosS.get(h.id);
  if(!s||s.userData.cle!==cle){if(s)grp.remove(s);const cv=spriteHerosMonte(h,fr)||(typeof spriteHeros3D==='function'&&spriteHeros3D(h,160,fr))||spriteHeros(h,128);s=panneau(cv,'h'+h.classe+h.j+':'+fr+':'+cv.width+(cv.width===192?'m':''),cv.width===192?1.75:1.45,dir<0);s.userData.cle=cle;s.userData.tile=-h.id;herosS.set(h.id,s);grp.add(s);}
  const [hx,hy]=posHeros(h);const bob=V.anim&&V.anim.h===h?Math.abs(Math.sin(performance.now()/60))*.05:0;const enV=G.occ[Math.round(hy)*N+Math.round(hx)]&&(G.oi[G.occ[Math.round(hy)*N+Math.round(hx)]]||{}).t==='ville';s.position.set(hx+.5,sol(Math.round(hx),Math.round(hy))+bob,hy+.55+(enV?.3:0));s.visible=!!vu[Math.round(hy)*N+Math.round(hx)];
  {let o=HOMB.get(h.id);if(!o){o=ombrePied(1.05);HOMB.set(h.id,o);grp.add(o);}o.position.set(s.position.x,s.position.y-bob+.02,s.position.z-.05);o.visible=s.visible;}}
 for(const [id,s] of herosS)if(!ids.has(id)){grp.remove(s);herosS.delete(id);const o=HOMB.get(id);if(o){grp.remove(o);HOMB.delete(id);}}}
// ---------- caméra ----------
function placerCam(){const d=C3.dist;const t=C3.tang;cam.position.set(C3.cible.x,C3.cible.y+d*Math.sin(t),C3.cible.z+d*Math.cos(t));cam.lookAt(C3.cible);
 soleil.position.copy(AMB.dir).multiplyScalar(22).add(C3.cible);// soleil de fin d'après-midi (≈ 38° de haut), ombres longues
 {const k=Math.min(1,Math.max(0,(d-16)/14));U.haze.value.set(AMB.haze[0],AMB.haze[1],AMB.haze[2],.08+.06*k);U.hazeD.value.set(d*.9,d*1.65);}soleil.target.position.copy(C3.cible);soleil.target.updateMatrixWorld();const sc=soleil.shadow.camera;const e=Math.max(10,d*1.25);sc.left=-e;sc.right=e;sc.top=e;sc.bottom=-e;sc.updateProjectionMatrix();}
function borner3(){C3.cible.x=Math.max(0,Math.min(N,C3.cible.x));C3.cible.z=Math.max(0,Math.min(N+2,C3.cible.z));C3.dist=Math.max(5.5,Math.min(30,C3.dist));C3.cible.y=Math.max(0,h(C3.cible.x,C3.cible.z))*.5;}
// ---------- API ----------
const A={ok:true,actif:false};
// qualité : 2 = ombres + image fine, 1 = sans ombres, 0 = image allégée. Baisse automatique si l'appareil peine (mémorisée).
function qualDepart(){const q=new URLSearchParams(location.search).get('q3d');if(q!=null){S.fixe=true;return +q;}let m=null;try{m=localStorage.getItem('bs-q3d');S.choisie=localStorage.getItem('bs-q3d-choix')==='1';}catch(e){}return m!=null&&m!==''&&!isNaN(+m)?Math.max(0,Math.min(2,+m)):(estMobile()?1:2);}
const SURV={t0:0,l:[]};function surveiller(){if(S.fixe||S.choisie||S.banc||S.qual<=0)return;const t=performance.now();if(SURV.der&&t-SURV.der<200&&performance.now()-(V.activite||0)<1500)SURV.l.push(t-SURV.der);SURV.der=t;
 if(SURV.l.length>=90){const l=SURV.l.sort((a,b)=>a-b);const med=l[l.length>>1];SURV.l=[];if(med>27){A.qualite(S.qual-1);try{localStorage.setItem('bs-q3d',S.qual);}catch(e){}console.log('qualité 3D abaissée',S.qual,med);}}}
A.init=async()=>{const cv=document.getElementById('carte3d');S.qual=qualDepart();
 if(!ren){try{ren=new T.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance'});}catch(e){A.ok=false;return false;}
  ren.outputColorSpace=T.SRGBColorSpace;ren.toneMapping=T.ACESFilmicToneMapping;ren.toneMappingExposure=1.4;ren.shadowMap.enabled=true;ren.shadowMap.type=T.PCFSoftShadowMap;}
 if(!IMP.complete)await IMP.decode().catch(()=>{});
 await chargerRes();PAN_A=C3.tang*.5;PAN_K=1/Math.cos(PAN_A);
 if(scene)A.vider();scene=new T.Scene();scene.background=new T.Color(0x0a0806);
 env=envAmb(ren);const hdr=!!env;if(!env)env=envCiel(ren,0x5a8ad0,0xd8e4ec,0x4a4232);scene.environment=env;scene.environmentIntensity=hdr?AMB.envI:.55;
 hemi=new T.HemisphereLight(AMB.hCiel,AMB.hSol,AMB.hI);scene.add(hemi);soleil=new T.DirectionalLight(AMB.sol,AMB.solI);soleil.castShadow=S.qual>=2;soleil.shadow.mapSize.set(2048,2048);soleil.shadow.bias=-.0006;soleil.shadow.normalBias=.02;scene.add(soleil);scene.add(soleil.target);
 cam=new T.PerspectiveCamera(38,1,.1,200);
 N=G.carte.N;fogData=new Uint8Array(N*N);fogTex=new T.DataTexture(fogData,N,N,T.RedFormat);fogTex.magFilter=T.LinearFilter;fogTex.minFilter=T.LinearFilter;U.fog.value=fogTex;U.N.value=N;majBrume();
 construireTerrain();construireDecor();grp=new T.Group();scene.add(grp);objets.clear();herosS.clear();HOMB.clear();construireAides();
 A.redim();A.actif=true;V.fogDirty=false;return true;};
A.vider=()=>{if(!scene)return;if(RIVE){RIVE.dispose();RIVE=null;}scene.traverse(o=>{if(o.geometry&&!Object.values(GEO).includes(o.geometry)&&![BOX,CYL,CONE,CONE4,SPH].includes(o.geometry))o.geometry.dispose();});for(const t of TXC.values())t.dispose();TXC.clear();if(terrain&&terrain.material.map)terrain.material.map.dispose();scene=null;objets.clear();herosS.clear();};
A.redim=()=>{if(!ren)return;const dpr=Math.min(devicePixelRatio||1,S.qual>=2?1.5:S.qual>=1?1.25:1);ren.setPixelRatio(dpr);ren.setSize(innerWidth,innerHeight,false);if(cam){cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();}};
A.rendre=()=>{if(!A.actif||!G)return;const t=performance.now()/1000;U.t.value=t;U.loin.value=C3.dist>24?1:0;// vue dézoomée : relief fin du sol inutile à cette distance (compense l'eau et le sable du 19/11)

 if(V.fogDirty){majBrume();V.fogDirty=false;}
 try{animOiseaux(t);animPoussiere(t);}catch(e){}for(const m of PANA){const f=Math.floor(t*4.5+m.userData.ph*4)%4;m.map.offset.x=f*.25;}
 majObjets();majHeros();majChemin();
 // animations : ailes des moulins, roues, artefacts, drapeaux
 for(const g of objets.values()){if(!g.visible)continue;if(g.userData.tourne)g.userData.tourne.rotation.z=t*1.2;if(g.userData.flotte){g.userData.flotte.position.y=.38+Math.sin(t*2+g.userData.id)*.05;g.userData.flotte.rotation.y=t;}if(g.userData.sprite)g.userData.sprite.position.y=Math.abs(Math.sin(t*2+g.userData.id))*.03;if(g.userData.fumee)animFumee(g,t);if(g.userData.eclat){const e=g.userData.eclat,p=((t*.45+(g.userData.id||0)*.61)%1.6);const a=p<.5?Math.sin(Math.PI*p/.5):0;e.material.opacity=a*.95;e.scale.setScalar(.12+a*.3);e.material.rotation=t*.8;}}
 const hs=V.sel&&V.sel.t==='heros'?heroPar(V.sel.id):null;anneau.visible=!!hs;if(hs){const [hx,hy]=posHeros(hs);anneau.position.set(hx+.5,sol(Math.round(hx),Math.round(hy))+.04,hy+.5);anneau.material.opacity=.55+.3*Math.sin(t*4);}
 croixG.visible=graalConnu(vueJoueur());if(croixG.visible){const [gx,gy]=xy(G.carte.graal);croixG.position.set(gx+.5,sol(gx,gy)+.05,gy+.5);}
 if(eau.material.normalMap){eau.material.normalMap.offset.set(t*.012,t*.007);}
 surveiller();borner3();placerCam();PAN_A=C3.tang*.5;PAN_K=1/Math.cos(C3.tang*.5);ren.render(scene,cam);V.images++;};
function opaque(hh){const im=hh.object.material.map&&hh.object.material.map.image;if(!im||!hh.uv)return true;let u=hh.uv.x;if(hh.object.material.map.repeat.x<0)u=1-u;try{const g=im.getContext('2d');const d=g.getImageData(Math.floor(u*(im.width-1)),Math.floor((1-hh.uv.y)*(im.height-1)),1,1).data;return d[3]>60;}catch(e){return true;}}
/* 24/11 : case survolée à la souris (ordinateur) : cadre doré arrondi posé sur le sol, plus vif sur un objet ou un héros */
let CURS=null;A.survol=(i)=>{if(!scene)return;if(!CURS){const c=mkC(128,128),q=c.getContext('2d');q.strokeStyle='rgba(255,226,140,.95)';q.lineWidth=7;q.shadowColor='rgba(255,200,90,.9)';q.shadowBlur=10;const r=22;q.beginPath();q.moveTo(14+r,14);q.arcTo(114,14,114,114,r);q.arcTo(114,114,14,114,r);q.arcTo(14,114,14,14,r);q.arcTo(14,14,114,14,r);q.closePath();q.stroke();
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;CURS=new T.Mesh(new T.PlaneGeometry(1,1,6,6).rotateX(-Math.PI/2),new T.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,toneMapped:false,depthTest:false}));CURS.renderOrder=1.2;CURS.raycast=()=>{};scene.add(CURS);}
 if(CURS.parent!==scene)scene.add(CURS);if(i==null||i<0||!G||!G.joueurs[vueJoueur()].vu[i]){CURS.visible=false;return;}const x=i%N,y=(i/N)|0;CURS.visible=true;CURS.position.set(x+.5,Math.max(-.08,h(x+.5,y+.5))+.07,y+.5);
 const occ=G.objs.some(o=>o.x===x&&o.y===y)||G.heros.some(hh=>hh.x===x&&hh.y===y)||G.carte.obs[i];CURS.visible=!occ;CURS.material.opacity=.6;const cv=document.getElementById('carte3d');if(cv)cv.style.cursor=occ&&!G.carte.obs[i]?'pointer':'';};/* sur un objet : main (le cadre passerait sur le bâtiment) */
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
A.qualite=q=>{S.qual=Math.max(0,Math.min(2,q));if(soleil)soleil.castShadow=S.qual>=2;if(scene)scene.traverse(o=>{if(o.userData.ombre!==undefined)o.castShadow=o.userData.ombre&&S.qual>=2;if(o.material&&o.material.needsUpdate!==undefined&&o.isMesh)o.material.needsUpdate=true;});A.redim();};A.niveau=()=>S.qual;
// choix du joueur (menu ☰) : mémorisé, et la baisse automatique ne s'applique plus ; figer : pendant le banc
A.choisirQualite=q=>{S.choisie=true;A.qualite(q);try{localStorage.setItem('bs-q3d',S.qual);localStorage.setItem('bs-q3d-choix','1');}catch(e){}};
A.autoQualite=()=>{S.choisie=false;try{localStorage.removeItem('bs-q3d');localStorage.removeItem('bs-q3d-choix');}catch(e){}A.qualite(estMobile()?1:2);};
A.auto=()=>!S.fixe&&!S.choisie;A.figer=b=>{S.banc=!!b;SURV.l=[];};
A.ouvrir=()=>{document.getElementById('carte3d').style.display='block';V.vide=false;};
A.fermer=()=>{A.actif=false;document.getElementById('carte3d').style.display='none';V.fogDirty=true;V.vide=false;};
A.pret=()=>RES.pret;A._scene=()=>scene;A._pi=(...a)=>planImp(...a);A._res=RES;A._ren=()=>ren;A._h=(x,z)=>h(x,z);
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
 const sc=new T.Scene();const fog0=U.fog.value,n0=U.N.value;U.fog.value=BLANC;U.N.value=1;const hz0=U.haze.value.clone(),hd0=U.hazeD.value.clone();
 const lave=ter==='lave',neige=ter==='neige';
 sc.background=new T.Color(lave?0x2a0e0a:neige?0xc8d4e2:0x7aa0c8);
 const envH=envAmb(R0),envC=envH||envCiel(R0,0x5a8ad0,0xd8e4ec,0x4a4232);sc.environment=envC;sc.environmentIntensity=envH?AMB.envI*.85:.3;
 // lumière de fin d'après-midi : soleil bas et doré du même côté que sur la carte, ciel froid en contre-partie, ombres longues et douces (rendu une seule fois : ombre fine)
 sc.add(new T.HemisphereLight(AMB.hCiel,AMB.hSol,.75));const sun=new T.DirectionalLight(lave?0xffb890:0xffe8cc,2.9);sun.position.copy(AMB.dir).multiplyScalar(19).add(new T.Vector3(0,0,4));sun.target.position.set(0,0,4);sc.add(sun,sun.target);
 {const dc=cam.position.distanceTo(new T.Vector3(0,0,3));U.haze.value.set(...(lave?[.30,.16,.10]:neige?[.55,.6,.68]:AMB.haze),lave?.2:.2);U.hazeD.value.set(dc*.92,dc*1.75);}
 sun.castShadow=!window.DBG_NOSH;{const ms=S.qual>=2&&R0.capabilities.maxTextureSize>=8192?4096:2048;sun.shadow.mapSize.set(ms,ms);}Object.assign(sun.shadow.camera,{left:-22,right:22,top:20,bottom:-20,near:1,far:60});sun.shadow.bias=-.0006;sun.shadow.normalBias=.03;sun.shadow.camera.updateProjectionMatrix();
 if(lave){const l=new T.PointLight(0xff5a1a,40,30);l.position.set(0,3,-6);sc.add(l);}
 // sol : légère ondulation hors du champ, rives et collines au loin
 const nz=bruit(77);const gs=new T.PlaneGeometry(80,70,120,105);gs.rotateX(-Math.PI/2);gs.translate(0,0,-6);const p=gs.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);const dx=Math.max(0,Math.abs(x)-8.5),dz=Math.max(0,-.8-z)+Math.max(0,z-10);const k=Math.min(1,(dx+dz)/4);let y=(nz.fbm(x/6,z/6,3)-.5)*1.4*k;if(z<-6)y+=Math.pow(Math.max(0,-z-6),1.35)*.35;p.setY(i,y);}gs.computeVertexNormals();
 const reel=!!(RES.lay&&RES.atlas);const ms=reel?(ter==='marais'?matSolSimple(0,5,.55,1.6):matSolSimple(IDT[ter]??0,lave?6:(SEC[ter]??1),.55))/* 24/11 : marais en combat = sous-bois avec plaques d'eau (le motif de flaques répété faisait « pois ») */:new T.MeshStandardMaterial({map:texSolCombat(ter),roughness:.95});if(reel&&lave)ms.color.set(0x8c8484);if(reel&&ter==='neige')ms.color.set(0xc4cad4);if(reel&&ter==='marais')ms.color.set(0x9ea488);/* sol de marais plus sombre et olive *//* 24/11 : neige moins éblouissante en combat *//* 23/11 : basalte sombre comme sur la carte */const msol=new T.Mesh(gs,ms);msol.receiveShadow=true;sc.add(msol);
 if(C.terrain==='eau'||ter==='marais'){const e=new T.Mesh(new T.PlaneGeometry(80,14).rotateX(-Math.PI/2),new T.MeshStandardMaterial({color:ter==='marais'?0x3a5a3a:0x2d6f9c,roughness:.1,metalness:.2,transparent:true,opacity:.75}));e.position.set(0,.05,-9);sc.add(e);}
 // lisière : arbres, rochers et montagnes en arrière-plan et sur les côtés
 const r=creeRng(C.terrain.length*31+7);const add=(geo,m,x,y,z,s,sy,ry)=>{const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.scale.set(s,sy||s,s);o.rotation.y=ry||0;o.castShadow=true;o.receiveShadow=true;sc.add(o);return o;};
 ECH=1.4;const mV=mat(0xffffff,{vc:1,r:.82}),mP=mat(0xffffff,{vc:1,r:.95});const mM=RES.tx.roche?mat(lave?0x5a4a46:0xffffff,{tri:ter==='sable'||ter==='terre'?'roche2':'roche',neige:neige?1.6:ter==='sable'||lave?9:3.2,r:.95,ech:.25}):mP;
 const qC=cam.quaternion.clone();const imp=(nom,x,y,z,ht)=>{const o=planImp('h',nom,ht,(x*7+z*3)%2<1,qC);if(o){o.position.set(x,y,z);sc.add(o);}return o;};
 const hS=(x,z)=>{let y=(nz.fbm(x/6,z/6,3)-.5)*1.4*Math.min(1,(Math.max(0,Math.abs(x)-8.5)+Math.max(0,-.8-z)+Math.max(0,z-10))/4);if(z<-6)y+=Math.pow(Math.max(0,-z-6),1.35)*.35;return y;};
 for(let k=0;k<150;k++){let x,z;const zone=r.f();if(zone<.55){x=(r.f()-.5)*36;z=-1.6-r.f()*6.5;}else{const sd=r.f()<.5?-1:1;x=sd*(9.3+r.f()*6);z=-2+r.f()*13;}
  if(C.ville&&x>5&&z<6)continue;
  if(reel){const nm=lave&&r.f()<.6?rocT(ter,'abcd'[r.i(0,3)]):arbresPour(ter,r);imp(nm,x,hS(x,z),z,nm.startsWith('roc')?.55+r.f()*.6:hauteurArbre(nm,r)*2.4);continue;}
  if(lave||ter==='sable'&&r.f()<.4){add(geoRocher(k%5,ter),mP,x,hS(x,z),z,2+r.f()*2.5,1.5+r.f()*2,r.f()*6);continue;}
  const ty=arbreType(ter,r);add(geoArbre(ty,k%3),mV,x,hS(x,z),z,2.6+r.f()*1.6,null,r.f()*6);}
 for(let k=0;k<7;k++){const x=-26+k*9+r.f()*3,z=-17-r.f()*5;add(geoMontagne(k%6,ter),mM,x,hS(x,z)-.5,z,4.5+r.f()*2,4+r.f()*3,r.f()*6);}
 for(let k=0;k<26;k++){const x=(r.f()-.5)*20,z=-1+r.f()*11;if(Math.abs(x)<8&&z>-.6&&z<9.5)continue;if(reel){const p0=r.f();imp(p0<.5?rocT(ter,'abcd'[r.i(0,3)]):neige||lave?rocT(ter,'a'):ter==='sable'?'desert_b':'buisson_a',x,hS(x,z),z,p0<.5?.3+r.f()*.35:.4+r.f()*.3);continue;}add(geoRocher(k%5,ter),mP,x,hS(x,z),z,.7+r.f()*.8,.6+r.f()*.6,r.f()*6);}
 const fiS=C.ville&&!geo.port&&fortImp(C.ville.fac,{3:'_n',4:'_s',6:'_l'}[IDT[ter]]);/* 24/11 : siège : château Blender de la carte (même plongée ≈ 51° que la caméra de combat) */
 if(fiS){fiS.quaternion.copy(cam.quaternion);fiS.scale.setScalar(1.2);fiS.position.set(8.3,0,.2);fiS.material=fiS.material.clone();fiS.material.fog=false;sc.add(fiS);}
 else if(C.ville){const v=villeMesh(C.ville);v.scale.setScalar(2.3);v.position.set(geo.port?0:11,0,geo.port?-4:1.2);v.rotation.y=geo.port?0:-.5;v.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});sc.add(v);}
 // obstacles posés sur leurs hexagones
 const obs=[];for(const h of C.obst){const [x,z]=hexMonde(h);const rr=creeRng(h*13+5);const gr=new T.Group();gr.position.set(x,0,z);
  if(reel){const arbre=ter==='herbe'&&h%2||ter==='marais'&&h%2||neige&&h%2;const n=arbre?2:2+rr.i(0,1);for(let k=0;k<n;k++){const nm=arbre?arbresPour(ter,rr):rocT(ter,'abcd'[rr.i(0,3)]);const o=planImp('h',nm,arbre?hauteurArbre(nm,rr)*1.9:(k?.35+rr.f()*.2:.6+rr.f()*.3),rr.f()<.5,qC);if(o){if(!arbre){o.material=o.material.clone();o.material.color.setRGB(.78,.76,.72);}/* 24/11 : rochers moins pâles sous la lumière du combat */o.position.set((rr.f()-.5)*.45,0,(rr.f()-.5)*.3+(k?.12:0));gr.add(o);}}}
  else 
  if(ter==='herbe'&&h%2||ter==='marais'&&h%2||neige&&h%2){const ty=arbreType(ter,rr);for(let k=0;k<2;k++){const o=new T.Mesh(geoArbre(ty,(h+k)%3),mV);o.position.set((rr.f()-.5)*.4,0,(rr.f()-.5)*.3);o.scale.setScalar(1.9+rr.f()*.6);o.rotation.y=rr.f()*6;o.castShadow=o.receiveShadow=true;gr.add(o);}}
  else{for(let k=0;k<3;k++){const o=new T.Mesh(geoRocher((h+k)%5,ter),mP);o.position.set((rr.f()-.5)*.5,0,(rr.f()-.5)*.35);const s0=k?1.1+rr.f()*.6:1.9+rr.f()*.5;o.scale.set(s0,s0*(.8+rr.f()*.5),s0);o.rotation.y=rr.f()*6;o.castShadow=o.receiveShadow=true;gr.add(o);}}
  sc.add(gr);obs.push([h,gr]);}
 // rendu
 const dpr0=R0.getPixelRatio(),sz=R0.getSize(new T.Vector2());const exp0=R0.toneMappingExposure,cc=R0.getClearColor(new T.Color()),ca=R0.getClearAlpha();
 R0.setPixelRatio(dpr);R0.setSize(W,Hs,false);R0.toneMappingExposure=lave?1:1.24;R0.shadowMap.enabled=true;R0.shadowMap.needsUpdate=true;
 const out={fond:null,obst:new Map()};
 R0.render(sc,cam);out.fond=mkC(W*dpr,Hs*dpr);out.fond.getContext('2d').drawImage(R0.domElement,0,0);const ETC={w:W,sx:-.1,sy:-.15,chaud:lave?'rgba(255,120,60,.35)':'rgba(255,200,140,.18)',filtre:'contrast(1.06)'};etalonner(out.fond,0,0,W,Hs,ETC);
 // obstacles détourés (redessinés dans l'ordre des rangées pour cacher les créatures derrière eux)
 sc.background=null;R0.setClearColor(0,0);const autres=[];sc.traverse(o=>{if(o.isMesh&&o!==msol&&!obs.some(([h,g])=>g===o.parent||g===o))autres.push(o);});
 for(const o of autres)o.visible=false;msol.visible=false;for(const [,g] of obs)g.visible=false;
 const bb=new T.Box3(),v=new T.Vector3();
 for(const [h,g] of obs){g.visible=true;bb.setFromObject(g);let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(let k=0;k<8;k++){v.set(k&1?bb.max.x:bb.min.x,k&2?bb.max.y:bb.min.y,k&4?bb.max.z:bb.min.z).project(cam);const sx=(v.x+1)/2*W,sy=(1-v.y)/2*Hs;x0=Math.min(x0,sx);x1=Math.max(x1,sx);y0=Math.min(y0,sy);y1=Math.max(y1,sy);}
  x0=Math.max(0,Math.floor(x0-2));y0=Math.max(0,Math.floor(y0-2));x1=Math.min(W,Math.ceil(x1+2));y1=Math.min(Hs,Math.ceil(y1+2));
  if(x1>x0&&y1>y0){R0.render(sc,cam);const c=mkC((x1-x0)*dpr,(y1-y0)*dpr);c.getContext('2d').drawImage(R0.domElement,x0*dpr,y0*dpr,(x1-x0)*dpr,(y1-y0)*dpr,0,0,c.width,c.height);etalonner(c,x0,y0,W,Hs,Object.assign({},ETC,{w:x1-x0,alpha:1}));out.obst.set(h,{c,x:x0,y:y0,w:x1-x0,h:y1-y0});}
  g.visible=false;}
 // remise en état du rendu de la carte
 R0.setClearColor(cc,ca);R0.toneMappingExposure=exp0;R0.setPixelRatio(dpr0);R0.setSize(sz.x,sz.y,false);U.fog.value=fog0;U.N.value=n0;U.haze.value.copy(hz0);U.hazeD.value.copy(hd0);
 sc.traverse(o=>{if(o.geometry&&o.geometry===gs)o.geometry.dispose();});if(ms.map)ms.map.dispose();ms.dispose();if(!envH)envC.dispose();if(sun.shadow.map)sun.shadow.map.dispose();
 return out;};

// remise en état garantie des réglages partagés avec la carte, même si un rendu unique échoue (relecture du 19/11)
function abri(f){return(...a)=>{const R0=rendu();const st=R0&&{fog:U.fog.value,n:U.N.value,hz:U.haze.value.clone(),hd:U.hazeD.value.clone(),dpr:R0.getPixelRatio(),sz:R0.getSize(new T.Vector2()),exp:R0.toneMappingExposure,cc:R0.getClearColor(new T.Color()),ca:R0.getClearAlpha(),tm:R0.toneMapping,sh:R0.shadowMap.enabled};
 try{return f(...a);}catch(e){if(st){U.fog.value=st.fog;U.N.value=st.n;U.haze.value.copy(st.hz);U.hazeD.value.copy(st.hd);R0.setPixelRatio(st.dpr);R0.setSize(st.sz.x,st.sz.y,false);R0.toneMappingExposure=st.exp;R0.setClearColor(st.cc,st.ca);R0.toneMapping=st.tm;R0.shadowMap.enabled=st.sh;}throw e;}};}
A.fondCombat=abri(A.fondCombat);
// =========================================================
// VILLE EN 3D : panorama rendu une fois (à chaque construction), mêmes zones cliquables que l'ancien dessin.
// =========================================================
const PRISME=(()=>{const g=new T.CylinderGeometry(.5,.5,1,3,1);g.rotateZ(Math.PI/2);g.rotateX(Math.PI/6);g.translate(0,.25,0);g.scale(1,1.15,1);return g;})();// toit à deux pans (axe x)
function fenetres(gr,n,larg,y,z,coul,nuit){for(let k=0;k<n;k++)bloc(gr,BOX,coul,{em:nuit?0xffb040:0xffd890,ei:nuit?2.2:.5},[(k-(n-1)/2)*larg/n,y,z],null,[larg/n*.4,larg/n*.55,.04]);}
function maison(gr,w,h,mur,toit,P,nuit,porte=true,PR=PT){bloc(gr,BOX,mur,P,[0,h/2,0],null,[w,h,w*.75]);bloc(gr,PRISME,toit,PR,[0,h,0],null,[w*1.12,w*.6,w*.92]);fenetres(gr,2,w*.8,h*.62,w*.38,0xffd87a,nuit);if(porte)bloc(gr,BOX,0x3a2412,PB,[0,h*.22,w*.38],null,[w*.22,h*.44,.04]);}
// maisons de la ville rendues dans Blender (modèles Sketchfab CC BY, outils/blender/imp_glb.py, vue à 8°) : panneau face à la caméra, cliquable par sa silhouette (21/11)
const MAISV={v_grenier_h:{w:296,h:256,px:153.3,py:241.7,ppm:93.616,larg:3.8},v_grenier_s:{w:236,h:369,px:118.0,py:350.7,ppm:94.187,larg:3.44},v_grenier_n:{w:314,h:371,px:157.0,py:350.0,ppm:98.765,larg:3.16},v_marche_h:{w:368,h:183,px:171.5,py:162.5,ppm:78.651,larg:4.9},v_marche_n:{w:368,h:183,px:171.5,py:162.5,ppm:78.651,larg:4.9},v_marche_s:{w:368,h:183,px:171.5,py:162.5,ppm:78.651,larg:4.9},col_hv:{w:286,h:405,px:132.0,py:391.0,ppm:53.129,larg:5.58},col_a:{w:311,h:366,px:155.0,py:348.7,ppm:92.389,larg:3.35},col_b:{w:281,h:361,px:141.0,py:346.7,ppm:65.793,larg:4.26},col_c:{w:320,h:370,px:160.0,py:348.4,ppm:89.583,larg:3.56},v_tourmage_s:{w:72,h:285,px:36.0,py:279.4,ppm:39.204,larg:2.48},v_tourmage_n:{w:72,h:285,px:36.0,py:279.4,ppm:39.204,larg:2.48},v_mausolee:{w:306,h:279,px:138.7,py:252.8,ppm:90.446,larg:3.37},v_cabane:{w:181,h:362,px:95.7,py:345.6,ppm:54.684,larg:3.99},v_porte_h:{w:416,h:269,px:213.6,py:263.4,ppm:48.846,larg:8.49},v_tour_h:{w:106,h:313,px:44.0,py:308.0,ppm:45.089,larg:3.82},v_hutte:{w:272,h:289,px:130.0,py:273.8,ppm:83.235,larg:4.27},v_tourmage:{w:98,h:389,px:49.0,py:381.7,ppm:53.647,larg:2.48},v_marche:{w:368,h:183,px:171.5,py:162.5,ppm:78.651,larg:4.9},v_grenier:{w:386,h:381,px:193.0,py:348.9,ppm:112.455,larg:3.43},eglise:{w:509,h:696,px:219.0,py:664.5,ppm:68.571,larg:9.36},pierre_a:{w:704,h:642,px:354.0,py:603.0,ppm:83.993,larg:8.57},pierre_b:{w:706,h:638,px:355.0,py:599.9,ppm:83.965,larg:8.58},pilotis_a:{w:682,h:692,px:322.0,py:647.8,ppm:81.251,larg:8.86},pilotis_b:{w:689,h:668,px:328.0,py:623.8,ppm:81.251,larg:8.86},lierre_a:{w:570,h:574,px:294.0,py:538.6,ppm:97.125,larg:7.11},lierre_b:{w:655,h:561,px:337.0,py:527.6,ppm:97.125,larg:7.11},crypte:{w:624,h:736,px:312.0,py:698.5,ppm:85.714,larg:7.27}};
function maisonVue(nom,u,nuit,larg){const me=MAISV[nom],im=RES.maisV&&RES.maisV[nom];if(!me||!im)return null;const s=u*(larg||1.15)/me.larg;const w=me.w/me.ppm*s,hh=me.h/me.ppm*s;
 const tx=new T.Texture(im);tx.colorSpace=T.SRGBColorSpace;tx.anisotropy=4;tx.needsUpdate=true;const sv=mkC(im.width,im.height),sg=sv.getContext('2d');sg.drawImage(im,0,0);sg.globalCompositeOperation='source-in';sg.fillStyle='#fff';sg.fillRect(0,0,sv.width,sv.height);const st=new T.CanvasTexture(sv);
 const g=new T.PlaneGeometry(w,hh);g.translate(w/2-me.px/me.w*w,hh/2-(1-me.py/me.h)*hh,0);const m=new T.MeshBasicMaterial({map:tx,transparent:true,alphaTest:.04,toneMapped:false,color:nuit?0x9a9ab8:0xffffff});
 const o=new T.Mesh(g,m);o.userData.face=1;o.userData.sil=st;o.castShadow=false;return o;}
/* 24/11 : image d'un bâtiment pour la fenêtre Construire (rendus Blender des villes) */
A.imageBat=(b,fac)=>{if(!RES.maisV&&!RES.fortV)return null;if(b==='fort'||b==='citadelle'||b==='chateau')return RES.fortV&&RES.fortV[fac]||null;const b0=b.replace(/u$/,'');const mn=maisonPour(b0,fac);return mn&&RES.maisV&&RES.maisV[mn]||null;};
function maisonPour(b,fac){const hab=b.startsWith('hab');if(b.startsWith('guilde')&&(fac==='sylve'||fac==='necro'))return fac==='sylve'?'v_tourmage_s':'v_tourmage_n';/* 23/11 : tour de mage propre à la faction */
 if(b==='silo'&&fac!=='bastion')return'v_grenier_'+fac[0];/* 24/11 : grenier propre à la faction (greniers_var.py) */
 if(fac==='necro'){if(b==='marche')return'v_marche_n';if(hab&&(+b[3])%2===0)return'v_mausolee';/* 23/11 : mausolées entre les cryptes */return(hab||b==='taverne'||['conseil','mairie','hotelville','capitole'].includes(b))?'crypte':null;}
 if(b.startsWith('guilde')&&fac!=='horde')return'v_tourmage';if(b==='marche')return fac==='horde'?'v_marche_h':fac==='necro'?'v_marche_n':fac==='sylve'?'v_marche_s':'v_marche';/* 24/11 : marché propre à la faction */if(b==='silo')return'v_grenier';
 if(fac==='sylve'&&(hab||b==='taverne'||['conseil','mairie','hotelville','capitole'].includes(b)))return'v_cabane';/* 23/11 : maisons-arbres de la Sylve */
 if(fac==='horde')return(b.startsWith('hab')||b==='taverne'||['conseil','mairie','hotelville','capitole'].includes(b))?'v_hutte':null;/* 23/11 : hôtel de ville de la Horde = grande hutte Blender au lieu de la maison carrée */// les huttes Sketchfab gardaient leur socle de terre : yourtes construites conservées
 if(['conseil','mairie','hotelville','capitole'].includes(b))return'col_hv';/* 24/11 : hôtel de ville peint à beffroi */if(b==='taverne')return'col_c';/* 24/11 : maisons à colombages peintes (colombages_peints.py) au lieu des modèles Sketchfab */
 if(hab){const L=['col_a','col_b','col_c','col_b','col_a','col_b','col_a'];return L[(+b[3]||1)-1];}return null;}
// château de la ville rendu dans Blender, vu presque de face (outils/blender/imp_fort.py, FORT_ELEV=8) : un panneau face à la caméra, cliquable par sa silhouette
const FORTV={bastion:{w:668,h:1175,px:334.0,py:1068.8,ppm:18.721},horde:{w:668,h:532,px:334.0,py:464.8,ppm:18.711},necro:{w:524,h:1142,px:262.0,py:1058.2,ppm:14.691},sylve:{w:912,h:1187,px:441.0,py:1073.2,ppm:20.18}};function fortVue(fac,L,n,nuit){const me=FORTV[fac],im=RES.fortV&&RES.fortV[fac];if(!me||!im)return null;const s=Math.min(L*(.62+.06*n)/35.62,(13+1.6*n)/((FORT[fac]&&FORT[fac].haut)||55));const w=me.w/me.ppm*s,hh=me.h/me.ppm*s;
 const tx=new T.Texture(im);tx.colorSpace=T.SRGBColorSpace;tx.anisotropy=4;tx.needsUpdate=true;const sv=mkC(im.width,im.height),sg=sv.getContext('2d');sg.drawImage(im,0,0);sg.globalCompositeOperation='source-in';sg.fillStyle='#fff';sg.fillRect(0,0,sv.width,sv.height);const st=new T.CanvasTexture(sv);
 const g=new T.PlaneGeometry(w,hh);g.translate(w/2-me.px/me.w*w,hh/2-(1-me.py/me.h)*hh,0);const m=new T.MeshBasicMaterial({map:tx,transparent:true,alphaTest:.04,toneMapped:false,color:nuit?0xb0b0c8:0xffffff});
 const o=new T.Mesh(g,m);o.userData.face=1;o.userData.sil=st;o.castShadow=false;return o;}
function batiment3D(b,v,u,P,nuit){const gr=new T.Group();ENDUIT=v.fac==='necro'?0x7c7684:v.fac==='horde'?0xc8b490:0xf0eae0;const F=FAC[v.fac].coul;const mur=new T.Color(F.mur).getHex();let toit=toitNat(F.toit);const fac=v.fac;const bois=fac==='horde'?0x8a6238:0x9a7448;
 if(b==='fort'||b==='citadelle'||b==='chateau'){const n=b==='chateau'?3:b==='citadelle'?2:1;const L=u;// u = largeur des remparts
  const fi=fortVue(fac,L,n,nuit);// château Blender au centre, enceinte et tours de façade construites autour (21/11)
  if(fac==='horde'){const pv=maisonVue('v_porte_h',1,nuit,6.2);/* 23/11 : porte et tours de guet en rondins rendues dans Blender (horde_peints.py) */
   for(let x=-L/2;x<=L/2;x+=.45){if(pv&&Math.abs(x)<2.9)continue;bloc(gr,CYL,0x7a5228,PB,[x,1.1,0],null,[.4,2.2+(Math.abs(x*7)%3)*.15,.4]);bloc(gr,CONE,0x7a5228,PB,[x,2.4,0],null,[.4,.5,.4]);}
   for(let k=0;k<=n;k++){const x=-L/2+L*k/n;const tv=pv&&maisonVue('v_tour_h',1,nuit,2.9+n*.25);if(tv){tv.position.set(x,0,.15);gr.add(tv);continue;}bloc(gr,BOX,0x8a6238,PB,[x,2.2,0],null,[1.3,4.4+n*.4,1.3]);bloc(gr,CONE4,0xc9a050,PC,[x,4.4+n*.4+.7,0],[0,Math.PI/4,0],[2.2,1.5,2.2]);for(const s of [-1,1])bloc(gr,CONE,0xe8dcc4,{},[x+s*.5,5.4+n*.4,0],[0,0,-s*.5],[.15,1.2,.15]);}
   if(pv){pv.position.set(0,0,.35);gr.add(pv);}else bloc(gr,BOX,0x3a2412,PB,[0,1,.3],null,[2,2,.2]);if(fi){fi.position.set(0,0,-4.5);gr.add(fi);}return gr;}
  const forme=fac==='necro'||fac==='sylve'?'fleche':'cone';const ht=2.4+n*.3;const D=7+n;
  if(fac==='sylve'){toit=0x5e8c70;// cuivre vert-de-grisé
   if(RES.atlas)for(const [x,z,h,nm] of [[-L*.28,-D-2.5,13+n*2,'feuillu_a'],[L*.3,-D-3,12+n*2,'feuillu_b'],[0,-D-5,16+n*2.5,'feuillu_a']]){const o=planImp('b',nm,h,x>0,null);if(o){o.position.set(x,0,z);o.userData.face=1;gr.add(o);}}}
  // enceinte en U ouverte vers la ville : courtine avant (avec porte), flancs, courtine arrière
  rempart(gr,[-L/2,0],[-1.6,0],ht,.8,mur,P);rempart(gr,[1.6,0],[L/2,0],ht,.8,mur,P);rempart(gr,[-L/2,0],[-L/2,-D],ht,.8,mur,P);rempart(gr,[L/2,0],[L/2,-D],ht,.8,mur,P);rempart(gr,[-L/2,-D],[L/2,-D],ht,.8,mur,P);
  porteF(gr,0,0,3.2,ht*.95,mur,toit,forme,P);
  for(let k=0;k<=n+1;k++){const x=-L/2+L*k/(n+1);if(Math.abs(x)<2)continue;tourR(gr,x,0,1.1,ht+2.2+n*.5,mur,toit,forme,P);}
  for(const x of [-L/2,L/2])tourR(gr,x,-D,1.2,ht+2.6+n*.5,mur,toit,forme,P);
  if(fi){fi.position.set(0,0,-D*.55);gr.add(fi);}else{donjon(gr,0,-D*.55,5.2,4.2,ht+4+n*1.2,mur,toit,P,nuit,nuit?1.6:1.1);
  for(const s2 of [-1,1])tourR(gr,s2*2.9,-D*.55+1.5,.9,ht+6+n*1.2,mur,toit,forme,P);}
  if(n>=2)tourC(gr,-L/2+2.2,-D*.6,2.2,ht+3.2,mur,toit,P);if(n>=3)tourC(gr,L/2-2.2,-D*.6,2.2,ht+3.6,mur,toit,P);
  if(fac==='necro'&&!fi)bloc(gr,SPH,0x7cf7a2,{em:0x7cf7a2,ei:2.5},[0,ht+4+n*1.2+5.8,-D*.55],null,[.5,.5,.5]);
  return gr;}
 const w=u;
 {const mn=maisonPour(b,fac);const mv=mn&&maisonVue(mn,u,nuit,(mn==='eglise'?2.3:mn==='crypte'?1.8:mn.startsWith('v_tourmage')?2.6:mn.startsWith('v_marche')?1.5:mn.startsWith('col_')?(mn==='col_hv'?1.85:mn==='col_b'?1.7:1.5):mn==='v_mausolee'?1.55:mn==='v_cabane'?(['conseil','mairie','hotelville','capitole'].includes(b)?2.4:1.55):mn==='v_hutte'?(['conseil','mairie','hotelville','capitole'].includes(b)?2.6:1.7):2.0)*((ZV[b]??0)>=5?.62:1));if(mv){gr.add(mv);return gr;}}
 if(b==='conseil'||b==='mairie'||b==='hotelville'||b==='capitole'){bloc(gr,GBOX,mur,P,[0,w*.18,0],null,[w*1.02,w*.36,w*.78]);const h1=new T.Group();h1.position.y=w*.36;colombage(h1,w,w*.75,w*.4,toit,nuit,PT,false);gr.add(h1);bloc(gr,GBOX,0x3a2412,PP,[0,w*.13,w*.4],null,[w*.18,w*.26,.02]);bloc(gr,GARC,0x3a2412,PP,[0,w*.26,w*.4],null,[w*.18,.02,w*.18]);
  if(b!=='conseil')tourC(gr,0,-w*.12,w*.22,w*1.2,mur,toit,P);
  if(b==='hotelville'||b==='capitole')for(const s of [-1,1])tourR(gr,s*w*.55,0,w*.1,w*.85,mur,toit,'cone',P);if(b==='capitole')bloc(gr,SPH,0xf0c040,{em:0xd0a020,ei:1,m:.8,r:.2},[0,w*1.25+w*.62,-w*.1],null,[w*.22,w*.22,w*.22]);return gr;}
 if(b==='graal'){bloc(gr,CONE4,fac==='necro'?0x5a4a7a:fac==='sylve'?0x5a9a4a:0xf0e0a0,{em:0xffd060,ei:.6,tri:P.tri},[0,w*1.3,0],[0,Math.PI/4,0],[w*.6,w*2.6,w*.6]);bloc(gr,SPH,0xfff0b0,{em:0xffe080,ei:3},[0,w*2.75,0],null,[w*.3,w*.3,w*.3]);return gr;}
 if(b.startsWith('guilde')){const n=+b[6];tourR(gr,0,0,w*.3,w*(.9+n*.4),mur,toit,'fleche',P);bloc(gr,SPH,0xc8b0ff,{em:0xa080ff,ei:2.5},[0,w*(.9+n*.4)+w*1.25,0],null,[w*.22,w*.22,w*.22]);return gr;}
 // architecture propre à la Horde et à la Nécropole (19/11) : yourte à totems et mausolée au lieu de la maison à colombages du Bastion
 if(b==='taverne'&&fac==='horde'){bloc(gr,GCYL,0x7a5a38,PB,[0,w*.28,0],null,[w*1.1,w*.56,w*.95]);bloc(gr,GCONE,0x9a7a52,PC,[0,w*.56+w*.34,0],null,[w*1.5,w*.68,w*1.32]);bloc(gr,CYL,0x2a1a0e,PB,[0,w*1.22,0],null,[w*.12,w*.06,w*.12]);
  for(let k=0;k<6;k++){const a2=k/6*Math.PI*2;bloc(gr,GBOX,0x4a3220,PP,[Math.cos(a2)*w*.56,w*.62,Math.sin(a2)*w*.49],[0,-a2,0],[w*.05,w*.05,w*.12]);}
  bloc(gr,GBOX,0x1e120a,{r:1},[0,w*.19,w*.47],null,[w*.3,w*.38,.05]);bloc(gr,GBOX,0xa07a50,PE,[w*.17,w*.2,w*.49],[0,0,.15],[w*.08,w*.4,.03]);
  for(const s2 of [-1,1]){const x=s2*w*.78;bloc(gr,CYL,0x5a3a20,PB,[x,w*.5,w*.4],null,[w*.09,w*1,w*.09]);bloc(gr,GBOX,0x6a4428,PP,[x,w*.78,w*.4],null,[w*.3,w*.05,w*.05]);bloc(gr,SPH,0xe2d8c0,{r:.6},[x,w*1.04,w*.4],null,[w*.15,w*.13,w*.14]);for(const s3 of [-1,1])bloc(gr,CONE,0xe8e0cc,{r:.5},[x+s3*w*.1,w*1.1,w*.4],[0,0,-s3*1.1],[w*.05,w*.16,w*.05]);}
  bloc(gr,CYL,0x2a2018,{r:1},[w*.55,w*.02,w*.75],null,[w*.3,w*.04,w*.3]);bloc(gr,SPH,0xff8a3a,{em:0xff6a20,ei:1.6},[w*.55,w*.08,w*.75],null,[w*.12,w*.14,w*.12]);return gr;}
 if(b==='taverne'&&fac==='necro'){bloc(gr,GBOX,0x55525c,PM3,[0,w*.05,0],null,[w*1.15,w*.1,w*.9]);bloc(gr,GBOX,0x6a6672,PM3,[0,w*.42,0],null,[w*.9,w*.64,w*.66]);bloc(gr,PRISME,0x3a3844,PT,[0,w*.74,0],null,[w*1.02,w*.46,w*.8]);
  for(const x of [-.36,-.14,.14,.36])bloc(gr,GCYL,0x8a8692,PM3,[x*w,w*.4,w*.38],null,[w*.08,w*.62,w*.08]);bloc(gr,GBOX,0x7a7682,PM3,[0,w*.74,w*.38],null,[w*.92,w*.06,w*.08]);
  bloc(gr,GBOX,0x0e0a12,{r:1},[0,w*.27,w*.335],null,[w*.22,w*.42,.03]);bloc(gr,BOX,0x7cf7a2,{em:0x7cf7a2,ei:1.4},[0,w*.5,w*.34],null,[w*.16,w*.03,.02]);
  bloc(gr,GBOX,0x8a8692,PM3,[0,w*1.06,w*.1],null,[w*.05,w*.3,w*.05]);bloc(gr,GBOX,0x8a8692,PM3,[0,w*1.12,w*.1],null,[w*.18,w*.05,w*.05]);
  for(let k=0;k<=12;k++){const x=(k/12-.5)*w*1.3;bloc(gr,GBOX,0x16161a,{r:.4,m:.6},[x,w*.14,w*.62],null,[.025,w*.28,.025]);}bloc(gr,GBOX,0x16161a,{r:.4,m:.6},[0,w*.26,w*.62],null,[w*1.3,.025,.025]);return gr;}
 if(b==='marche'&&fac==='horde'){for(let k=0;k<3;k++){const x=(k-1)*w*.44;bloc(gr,GCONE,[0x9a7a52,0x7a5a38,0xb08a5a][k],PC,[x,w*.28,0],null,[w*.38,w*.56,w*.38]);bloc(gr,CYL,0x4a3220,PB,[x,w*.6,0],null,[.03,w*.12,.03]);bloc(gr,GBOX,[0x8a6a48,0x6a4a30,0xa08060][k],PE,[x+w*.12,w*.03,w*.24],[0,.4,0],[w*.2,.02,w*.14]);}
  for(let j=0;j<3;j++)bloc(gr,CYL,0x6a4428,PB,[(j-1)*w*.2,w*.06,w*.32],null,[w*.1,w*.12,w*.1]);return gr;}
 if(b==='marche'&&fac==='necro'){for(let k=0;k<3;k++){const x=(k-1)*w*.42;for(const sx of [-1,1])for(const sz of [-1,1])bloc(gr,CYL,0x2a2228,PB,[x+sx*w*.15,w*.22,sz*w*.12],null,[.06,w*.44,.06]);bloc(gr,CONE4,[0x3a2a3a,0x4a4a52,0x2a3a3a][k],PE,[x,w*.52,0],[0,Math.PI/4,0],[w*.48,w*.18,w*.4]);bloc(gr,BOX,0x4a3a30,PB,[x,w*.16,0],null,[w*.32,w*.08,w*.22]);for(let j=0;j<3;j++)bloc(gr,j===1?SPH:CYL,j===1?0xd8d0bc:0xe8e0c0,j===1?{r:.6}:{em:0xffc070,ei:.9},[x+(j-1)*w*.08,w*.24,0],null,j===1?[w*.07,w*.06,w*.07]:[w*.025,w*.08,w*.025]);}return gr;}
 if(b==='taverne'){bloc(gr,GBOX,0xd8d0c4,PM3,[0,w*.17,0],null,[w*1.02,w*.34,w*.78]);const h1=new T.Group();h1.position.y=w*.34;colombage(h1,w,w*.76,w*.36,fac==='horde'?0xb08a48:fac==='bastion'?0x9a6a54:toit,nuit,fac==='horde'?PC:fac==='bastion'?PTU:PT,false);gr.add(h1);bloc(gr,GBOX,0x3a2412,PP,[0,w*.13,w*.4],null,[w*.18,w*.26,.02]);bloc(gr,BOX,0x3a2a1a,PB,[w*.62,w*.5,w*.3],null,[w*.3,.06,.06]);bloc(gr,BOX,0xc89040,{},[w*.7,w*.38,w*.3],null,[w*.18,w*.16,.04]);for(let k=0;k<2;k++)bloc(gr,CYL,0x8a5a30,PB,[-w*.65+k*.3,w*.12,w*.35],null,[w*.16,w*.24,w*.16]);return gr;}
 if(b==='marche'){for(let k=0;k<3;k++){const x=(k-1)*w*.42;for(const sx of [-1,1])for(const sz of [-1,1])bloc(gr,CYL,0x6a4a2a,PB,[x+sx*w*.15,w*.22,sz*w*.12],null,[.06,w*.44,.06]);bloc(gr,CONE4,[0x8a4a3a,0xc8bca0,0x4a5a6a][k],PE,[x,w*.52,0],[0,Math.PI/4,0],[w*.48,w*.18,w*.4]);bloc(gr,BOX,0x9a6a3a,PB,[x,w*.16,0],null,[w*.32,w*.08,w*.22]);for(let j=0;j<3;j++)bloc(gr,SPH,[0xe85a3a,0xf0c040,0x6ac84a][(j+k)%3],{},[x+(j-1)*w*.08,w*.22,0],null,[w*.06,w*.06,w*.06]);}return gr;}
 if(b==='silo'){tourR(gr,0,0,w*.32,w*.85,0xd8d0c0,0x8a6a4a,'cone',PM3,PB);bloc(gr,GBOX,0x3a2412,PP,[0,w*.15,w*.33],null,[w*.16,w*.3,.02]);return gr;}
 // habitations
 const niv=+b[3];
 if(fac==='sylve'){bloc(gr,CYL,0x6a4a2a,PB,[0,w*.55,0],null,[w*.2,w*1.1,w*.2]);{const o=RES.atlas?planImp('b','feuillu_b',w*2.4,false,null):null;if(o){o.position.set(0,0,-w*.2);o.userData.face=1;gr.add(o);}else for(let k=0;k<5;k++){const a=k*1.26;bloc(gr,SPH,0x3f7a34,{},[Math.cos(a)*w*.28,w*(1.15+(k%2)*.12),Math.sin(a)*w*.2],null,[w*.5,w*.42,w*.5]);}}const n0=gr.children.length;maison(gr,w*.6,w*.3,0x9a7448,toit,PB,nuit,false);gr.children.slice(n0).forEach(m=>m.position.y+=w*.45);}
 else if(fac==='horde'){bloc(gr,CYL,0x9a7448,PB,[0,w*.25,0],null,[w,w*.5,w*.9]);bloc(gr,CONE,0xc9a050,PC,[0,w*.5+w*.3,0],null,[w*1.25,w*.6,w*1.15]);bloc(gr,BOX,0x2a1608,PB,[0,w*.16,w*.44],null,[w*.26,w*.32,.04]);}
 else if(fac==='necro'){bloc(gr,BOX,teinteHex(mur,-.15),P,[0,w*.3,0],null,[w,w*.6,w*.8]);bloc(gr,CONE4,teinteHex(mur,-.3),P,[0,w*.6+w*.25,0],[0,Math.PI/4,0],[w*1.2,w*.5,w*1]);bloc(gr,BOX,0x120c18,{},[0,w*.2,w*.41],null,[w*.3,w*.4,.04]);for(const s of [-1,1])bloc(gr,BOX,0x7cf7a2,{em:0x7cf7a2,ei:1.5},[s*w*.3,w*.42,w*.41],null,[w*.08,w*.12,.03]);}
 else colombage(gr,w,w*.75,w*(.5+niv*.03),niv%2&&fac==='bastion'?0x9a6a54:toit,nuit,niv%2&&fac==='bastion'?PTU:PT);
 return gr;}
function teinteHex(h,k){const c=new T.Color(h);c.multiplyScalar(1+k);return c.getHex();}
// profondeur et taille dans la scène pour chaque emplacement de l'ancien panorama
const ZV={fort:-13,citadelle:-13,chateau:-13,capitole:-6.5,hotelville:-6.5,mairie:-6.5,conseil:-6.5,graal:-8,guilde1:-7,guilde2:-7,guilde3:-7,hab7:-7.5,hab1:-.5,hab2:0,hab3:0,hab4:-.5,hab5:6,hab6:6.5,taverne:6,marche:7,silo:6};
const UV={capitole:4.4,hotelville:4.2,mairie:3.8,conseil:3.4,graal:1.7,guilde1:1.8,guilde2:1.8,guilde3:1.8,taverne:2.6,marche:2.8,silo:1.7,hab1:2.4,hab2:2.4,hab3:2.4,hab4:2.4,hab5:2.4,hab6:2.5,hab7:2.8};
A.panoVille=(v,W,H)=>{const R0=rendu();if(!R0)return null;W=Math.round(W);H=Math.round(H);const nuit=v.fac==='necro',hd=v.fac==='horde',syl=v.fac==='sylve';const r=creeRng(v.id*13);
 ECH=.55;const sc=new T.Scene();const fog0=U.fog.value,n0=U.N.value;U.fog.value=BLANC;U.N.value=1;
 const asp=W/H;const port=asp<1.2;const fov=port?44:38;const cam=new T.PerspectiveCamera(fov,asp,.5,400);const camZ=port?23:22,camY=port?3.2:4.2,tgY=port?3.9:2.6;cam.position.set(0,camY,camZ);cam.lookAt(0,tgY,0);cam.updateMatrixWorld();
 const tf=Math.tan(fov*Math.PI/360);const pitch=Math.atan((camY-tgY)/camZ);const yh=.5-.5*Math.tan(pitch)/tf;// horizon (fraction de la hauteur)
 // ciel + montagnes lointaines peints (comme l'ancien panorama)
 const bg=mkC(W,H),g=bg.getContext('2d');const ciel=!nuit&&RES.img.ciel;const sky=g.createLinearGradient(0,0,0,H*yh);sky.addColorStop(0,nuit?'#141026':hd?'#c0603a':syl?'#5a9ad0':'#4a84c8');sky.addColorStop(1,nuit?'#4a3c60':hd?'#f8d090':syl?'#d8ecd0':'#f2dcb4');g.fillStyle=sky;g.fillRect(0,0,W,H);
 if(nuit){const lx=W*.8,ly=H*.12,lr=H*.032;const hl=g.createRadialGradient(lx,ly,lr*.8,lx,ly,lr*6);hl.addColorStop(0,'rgba(200,205,220,.28)');hl.addColorStop(1,'rgba(200,205,220,0)');g.fillStyle=hl;g.fillRect(lx-lr*6,ly-lr*6,lr*12,lr*12);
  const dl=g.createRadialGradient(lx-lr*.3,ly-lr*.3,lr*.1,lx,ly,lr);dl.addColorStop(0,'#e4e2d8');dl.addColorStop(1,'#b8b6ae');g.fillStyle=dl;g.beginPath();g.arc(lx,ly,lr,0,7);g.fill();g.fillStyle='rgba(120,120,128,.35)';for(const [a,b,c] of [[-.3,-.2,.35],[.25,.1,.28],[-.05,.35,.2],[.3,-.35,.15]]){g.beginPath();g.arc(lx+a*lr,ly+b*lr,c*lr,0,7);g.fill();}for(let k=0;k<60;k++){g.fillStyle='rgba(255,255,255,'+(.3+r.f()*.6)+')';g.fillRect(r.f()*W,r.f()*H*yh*.8,1.5,1.5);}}
 else if(ciel&&!window.CIEL_PHOTO){for(let k=0;k<9*32;k++)r.f();/* 24/11 : ciel peint (cumulus ombrés, éclairés du côté du soleil) au lieu de la photo HDRI */
  const hb=H*yh+H*.04;const rc=creeRng(v.id*7+3);const lum=hd?'255,226,190':'255,250,240',omb=hd?'196,120,90':syl?'150,175,190':'150,165,200',bor=hd?'255,200,150':'255,238,205';
  {const q=4,cw=Math.ceil(W/q),ch=Math.ceil(H/q),cc=mkC(cw,ch),cg=cc.getContext('2d');/* 24/11 : nuages dessinés au quart de la taille puis agrandis (un seul flou) : 4× plus rapide sur le Mac */
  for(let k=0;k<8;k++){const cx=rc.f()*cw,cy=ch*(.06+rc.f()*yh*.5),L=cw*(.07+rc.f()*.11),hh=ch*(.03+rc.f()*.04);const bl=[];for(let j=0;j<22;j++){const t=(j/21-.5);bl.push([cx+t*L*1.8+(rc.f()-.5)*L*.3,cy-Math.cos(t*Math.PI)*hh*(.5+rc.f()*.7),hh*(.45+rc.f()*.55)*(1-Math.abs(t)*.7)]);}
   cg.fillStyle=`rgba(${omb},.75)`;for(const [x,y,rr] of bl){cg.beginPath();cg.arc(x+rr*.12,y+rr*.25,rr*1.05,0,7);cg.fill();}
   cg.fillStyle=`rgba(${lum},.9)`;for(const [x,y,rr] of bl){cg.beginPath();cg.arc(x-rr*.1,y-rr*.12,rr*.85,0,7);cg.fill();}
   cg.fillStyle=`rgba(${bor},.5)`;for(const [x,y,rr] of bl){cg.beginPath();cg.arc(x-rr*.3,y-rr*.35,rr*.5,0,7);cg.fill();}}
  g.save();g.filter='blur('+Math.max(2,Math.round(H*.008))+'px)';g.drawImage(cc,0,0,W,H);g.restore();}
  const hz=g.createLinearGradient(0,H*yh*.55,0,hb);hz.addColorStop(0,'rgba(236,214,186,0)');hz.addColorStop(1,hd?'rgba(240,190,140,.75)':'rgba(236,214,186,.45)');g.fillStyle=hz;g.fillRect(0,0,W,hb);}
 else if(ciel){for(let k=0;k<9*32;k++)r.f();// même tirage que les nuages peints : le premier plan (arbres, rochers) reste placé à l'identique
  // ciel photographié (HDRI Poly Haven) : bande au-dessus de l'horizon, nuages dorés du côté du soleil ; Horde : teinte de poussière, Sylve : plus vert
  const im=RES.img.ciel,iw=im.width,ih=im.height,hb=H*yh+H*.04,sw=iw*.36,sh=Math.min(ih*.5,sw*hb/W);g.save();g.filter=hd?'brightness(1.75) saturate(.9)':'brightness(1.45) saturate(1.15)';g.drawImage(im,iw*.6,ih*(hd?.5:.42)-sh,sw,sh,0,0,W,hb);g.restore();
  if(hd){g.save();g.globalCompositeOperation='color';g.fillStyle='rgba(205,105,55,.72)';g.fillRect(0,0,W,hb);g.globalCompositeOperation='multiply';g.fillStyle='rgba(250,190,140,.6)';g.fillRect(0,0,W,hb);g.restore();}else if(syl){g.save();g.globalCompositeOperation='soft-light';g.fillStyle='rgba(120,190,140,.4)';g.fillRect(0,0,W,hb);g.restore();}
  const hz=g.createLinearGradient(0,H*yh*.55,0,hb);hz.addColorStop(0,'rgba(236,214,186,0)');hz.addColorStop(1,hd?'rgba(240,190,140,.75)':'rgba(236,214,186,.45)');g.fillStyle=hz;g.fillRect(0,0,W,hb);}
 else{g.save();g.filter='blur('+Math.round(H*.018)+'px)';for(let k=0;k<9;k++){const x=r.f()*W,y=H*(.04+r.f()*yh*.55),L=W*(.08+r.f()*.14);g.globalAlpha=.25+r.f()*.35;g.fillStyle='#fff';for(let j=0;j<7;j++){g.beginPath();g.ellipse(x+(r.f()-.5)*L,y+(r.f()-.5)*H*.02,L*(.18+r.f()*.2),H*(.012+r.f()*.02),0,0,7);g.fill();}}g.restore();}
 g.save();g.filter='blur('+Math.max(1,Math.round(H*.003))+'px)';for(let l=0;l<2;l++){g.fillStyle=nuit?['#3a3050','#2a2438'][l]:syl?['#8ab0a0','#5a8a64'][l]:hd?['#b88a6a','#8a6a4a'][l]:['#9aa8c0','#7a8aa4'][l];g.beginPath();g.moveTo(0,H*(yh+.05));for(let x=0;x<=W;x+=W/16)g.lineTo(x,H*(yh-.2+l*.08)+Math.sin(x/W*12+l*2+v.id)*H*.05+r.f()*H*.035);g.lineTo(W,H*(yh+.05));g.closePath();g.fill();}g.restore();
 const tb=new T.CanvasTexture(bg);tb.colorSpace=T.SRGBColorSpace;sc.background=tb;
 const haze=new T.Color(nuit?0x2a2438:ciel?(syl?0x9aa894:hd?0xb89070:0xa8a49c):syl?0x7a9a84:hd?0xa08060:0x8a98ac);sc.fog=new T.Fog(haze,ciel?30:35,ciel?90:95);const hz0=U.haze.value.clone();U.haze.value.w=0;
 const envH=nuit?null:envAmb(R0),envC=envH||envCiel(R0,0x5a8ad0,0xd8e4ec,0x4a4232);sc.environment=envC;sc.environmentIntensity=envH?AMB.envI*.9:nuit?.12:.3;
 sc.add(new T.HemisphereLight(nuit?0x8a90c8:ciel?AMB.hCiel:0xdfe8ff,nuit?0x1a1420:ciel?AMB.hSol:0x4a3a24,nuit?.45:ciel?.72:.8));const sun=new T.DirectionalLight(nuit?0x9ab0ff:hd?0xffc08a:ciel?AMB.sol:0xffecd0,nuit?.9:ciel?2.8:2.2);if(ciel)sun.position.set(hd?-17:-14,hd?8:10.5,11);else sun.position.set(hd?-18:-10,hd?8:16,12);sun.target.position.set(0,0,-4);sc.add(sun,sun.target);
 sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-30,right:30,top:25,bottom:-25,near:1,far:80});sun.shadow.bias=-.0005;sun.shadow.normalBias=.04;sun.shadow.camera.updateProjectionMatrix();
 // sol, chemin, arbres
 const terS=nuit||hd?'terre':'herbe';const reel=!!(RES.lay&&RES.atlas);const ts=reel?null:texSolCombat(terS);if(ts)ts.repeat.set(10,10);const gs=new T.PlaneGeometry(300,300,1,1).rotateX(-Math.PI/2);const ms=reel?matSolSimple(IDT[terS],SEC[terS],.22,.7):new T.MeshStandardMaterial({map:ts,roughness:.95,color:nuit?0x8a8078:0xffffff});if(reel&&nuit)ms.color.set(0x9a9088);if(reel&&hd)ms.color.set(0xc8b49c);const msol=new T.Mesh(gs,ms);msol.receiveShadow=true;sc.add(msol);
 const ch=new T.Mesh(new T.PlaneGeometry(2.6,40).rotateX(-Math.PI/2),reel?matSolSimple(8,2,.3,.4):new T.MeshStandardMaterial({color:nuit?0x6a5a4a:0xc8a878,roughness:1,transparent:true,opacity:.85}));ch.position.set(0,.02,8);if(reel&&hd)ch.material.color.set(0xd8b48c);if(reel&&nuit)ch.material.color.set(0x7a7484);/* 23/11 : allée de la Nécropole moins blanche la nuit */ch.receiveShadow=true;sc.add(ch);
 const vis=z=>2*(camZ-z)*tf*asp;// largeur visible à la profondeur z
 const mV=mat(0xffffff,{vc:1,r:.82}),mP=mat(0xffffff,{vc:1,r:.95});
 const ty=()=>nuit?'mort':syl?(r.f()<.6?'sapin':'feuillu'):hd?(r.f()<.4?'mort':'feuillu'):(r.f()<.3?'sapin':'feuillu');
 const qV=cam.quaternion.clone();const nomV=()=>nuit?'arbre_mort':syl?['sapin_a','sapin_b','sapin_c','feuillu_a'][r.i(0,3)]:hd?['acacia','arbuste_a','feuillu_b','arbuste_a'][r.i(0,3)]:['feuillu_a','feuillu_b','sapin_a','sapin_b','arbuste_b'][r.i(0,4)];
 const arbre=(x,z,s)=>{if(reel){const nm=nomV();const o=planImp('b',nm,s*(nm.startsWith('arbuste')?.55:nm.startsWith('jeune')?.8:nm==='acacia'?.7:1.1),r.f()<.5,qV);if(o){o.position.set(x,0,z);sc.add(o);}return;}const o=new T.Mesh(geoArbre(ty(),r.i(0,2)),mV);o.position.set(x,0,z);o.scale.setScalar(s);o.rotation.y=r.f()*6;o.castShadow=true;o.receiveShadow=true;sc.add(o);};
 for(let k=0;k<70;k++){const z=-17-r.f()*22;arbre((r.f()-.5)*vis(z)*1.1,z,4+r.f()*3);}
 for(let k=0;k<16;k++){const z=-12+r.f()*20;const sd=r.f()<.5?-1:1;arbre(sd*vis(z)*(.44+r.f()*.1),z,3.5+r.f()*2);}
 for(let k=0;k<10;k++){const z=-2+r.f()*12;const x=(r.f()-.5)*vis(z)*.9;if(Math.abs(x)<2)continue;if(reel){const o=planImp('b','roc_'+'abcd'[k%4],.22+r.f()*.25,r.f()<.5,qV);if(o){o.position.set(x,0,z);sc.add(o);}continue;}const o=new T.Mesh(geoRocher(k%5,terS),mP);o.position.set(x,0,z);o.scale.setScalar(.6+r.f()*.6);o.castShadow=true;sc.add(o);}
 // premier plan (19/11) : massifs et rochers aux deux coins pour cadrer la scène comme un tableau, touffes éparses sur le terrain vide
 if(reel){const fg=nuit?['arbre_mort','roc_d','roc_c','arbre_mort']:hd?['arbuste_a','desert_c','roc_d','desert_c']:['buisson_a','arbuste_b','buisson_a','roc_d'];
  for(const sd of [-1,1])for(let k=0;k<6;k++){const z=8.6+r.f()*3.2;const nm=fg[r.i(0,3)];const x=sd*vis(z)*(.36+r.f()*.16);const o=planImp('b',nm,((nm.startsWith('roc')?.6:1.4)+r.f()*1.1)*(/^(arbuste|buisson)/.test(nm)?.55:1),r.f()<.5,qV);if(o){o.position.set(x,0,z);if(nuit){o.material=o.material.clone();o.material.color.set(0x5c5c78);}/* 23/11 : premier plan dans la nuit */sc.add(o);}}
  for(let k=0;k<22;k++){const z=-1+r.f()*11;const x=(r.f()-.5)*vis(z)*.95;if(Math.abs(x)<2.2)continue;const nm=fg[r.i(1,3)];const o=planImp('b',nm.startsWith('roc')?'arbuste_c':nm,.28+r.f()*.35,r.f()<.5,qV);if(o){o.position.set(x,0,z);sc.add(o);}}}
 // place pavée, puits, tonneaux, caisses et lanternes (accessoires photographiés)
 if(reel&&v.fac!=='horde'){ECH=.55;const pl=new T.Mesh(new T.CircleGeometry(4.2,40).rotateX(-Math.PI/2),mat(0xc8c0b4,{tri:'pave',r:.95,ech:.9}));pl.position.set(0,.025,4.5);pl.scale.set(1.25,1,.8);pl.receiveShadow=true;sc.add(pl);
  const ch2=new T.Mesh(new T.PlaneGeometry(2.4,22).rotateX(-Math.PI/2),mat(0xc8c0b4,{tri:'pave',r:.95,ech:.9}));ch2.position.set(0,.02,-3);ch2.receiveShadow=true;sc.add(ch2);
  const pu=new T.Group();pu.position.set(2.6,0,4.2);pu.scale.setScalar(1.6);bloc(pu,GCYL,0xb0a898,PM3,[0,.32,0],null,[1,.64,1]);bloc(pu,GCYL,0x1a3a4a,{r:.05},[0,.6,0],null,[.8,.02,.8]);for(const s2 of [-1,1])bloc(pu,GBOX,0x5a4030,PP,[s2*.45,1,0],null,[.08,1.3,.08]);bloc(pu,PRISME,0x7a7a82,PT,[0,1.68,0],null,[1.2,.5,1]);sc.add(fusionner(pu));}
 if(reel){const qA=cam.quaternion.clone();const acc=(nom,ht,x,z)=>{const o=planImp('b',nom,ht,r.f()<.5,qA);if(o){o.position.set(x,0,z);sc.add(o);}};
  // 24/11 : accessoires propres à chaque faction (outils/blender/accessoires_peints.py) ; tonneaux et caisses gardés pour le Bastion
  if(v.fac==='necro'){acc('tombe_a',.75,-3.7,7.3);acc('tombe_b',.95,-4.5,7.7);acc('tombe_a',.65,-2.9,7.9);acc('cercueil',.36,3.5,7.6);acc('tombe_b',.85,4.4,7.2);}
  else if(v.fac==='horde'){acc('totem',2.3,-3.9,7.2);acc('tambour',.7,-3.0,7.9);acc('sechoir',1.7,3.9,7.3);acc('tambour',.6,3.1,7.9);}
  else if(v.fac==='sylve'){acc('souche',.5,-3.6,7.4);acc('panier',.38,-2.8,7.9);acc('panier',.36,3.4,7.6);acc('souche',.45,4.3,7.2);}
  else{acc('tonneau',.65,-3.6,7.4);acc('tonneau2',.6,-4.3,7.8);acc('caisse',.42,-2.9,7.9);acc('caisse',.4,3.4,7.6);acc('tonneau',.62,4.2,7.2);acc('seau',.3,2.9,5.2);}
  for(const x of [-1.6,1.6])for(const z of [1,6.5]){acc('lanterne',.9,x,z);}}
 // bâtiments
 const P=v.fac==='sylve'?PM2:v.fac==='horde'?PB:PM;
 const ordre=Object.keys(PANO).filter(b=>v.bat[b]).filter(b=>!(b==='conseil'&&(v.bat.mairie))&&!(b==='mairie'&&v.bat.hotelville)&&!(b==='hotelville'&&v.bat.capitole)&&!(b==='fort'&&v.bat.citadelle)&&!(b==='citadelle'&&v.bat.chateau)&&!(b==='guilde1'&&v.bat.guilde2)&&!(b==='guilde2'&&v.bat.guilde3));
 /* 23/11 : les créatures des habitations du rang du milieu (et du fond) se tiennent sur la place, dans les trous entre les bâtiments de devant, au lieu d'être cachées derrière eux */
 const PLACE={hab6:[.76,4.4],hab1:[.15,2.6],hab2:[.36,2.9],hab3:[.565,2.9],hab4:[.8,2.6],hab7:[.43,1.2]};
 const posCre=(b,gr,u)=>{const q=PLACE[b];if(q){const zc=q[1];return[(q[0]-.5)*vis(zc)*.94,zc];}return[gr.position.x+u*.42*(gr.position.x>0?-1:1),gr.position.z+u*(RES.maisV&&maisonPour(b,v.fac)?1.8:1.0)];};
 const objs=[],texV=[],matV=[];const GCRV=new T.PlaneGeometry(1,1).translate(0,.396,0);for(const b of ordre){const z=ZV[b]??0;const fx=PANO[b][0];const L=vis(z);const u=(b==='fort'||b==='citadelle'||b==='chateau')?Math.min(26,L*.62):Math.min(UV[b]||2.4,PANO[b][2]*L*1.05);
  const gr=fusionner(batiment3D(b,v,u,P,nuit));gr.position.set((fx-.5)*L*.94,0,z);if(b.startsWith('hab')||b==='taverne'||b==='marche'||b==='silo')gr.rotation.y=-(fx-.5)*.5;gr.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});sc.add(gr);gr.updateMatrixWorld(true);gr.traverse(o=>{if(o.userData.face){const pq=o.parent.getWorldQuaternion(new T.Quaternion()).invert();o.quaternion.copy(pq.multiply(cam.quaternion));}});gr.traverse(o=>{o.userData.bidx=objs.length;});objs.push([b,gr,u]);
  // créature devant son habitation (19/11) : panneau posé au sol dans la scène 3D (cachée par les bâtiments placés devant, au lieu de flotter par-dessus)
  if(b.startsWith('hab')&&!v.sansCre){const niv=+b[3];const cre0=FAC[v.fac].crea[niv-1];const cre=v.bat['hab'+niv+'u']&&CRE[cre0].amelio?CRE[cre0].amelio:cre0;const Sw=u*1.25;
   const tx=new T.CanvasTexture(spriteCreature(cre,256,true));tx.colorSpace=T.SRGBColorSpace;texV.push(tx);const mc=new T.MeshBasicMaterial({map:tx,transparent:true,alphaTest:.04,toneMapped:false,color:nuit?0xa8a8c0:0xf4f0ea});matV.push(mc);
   const pc=new T.Mesh(GCRV,mc);pc.scale.setScalar(Sw);{const [cx,cz]=posCre(b,gr,u);pc.position.set(cx,.03,cz);}pc.quaternion.copy(cam.quaternion);pc.renderOrder=3;pc.userData.bidx=objs.length-1;{const sv=mkC(256,256),sg=sv.getContext('2d');sg.drawImage(spriteCreature(cre,256,true),0,0);sg.globalCompositeOperation='source-in';sg.fillStyle='#fff';sg.fillRect(0,0,256,256);const st=new T.CanvasTexture(sv);texV.push(st);pc.userData.sil=st;}sc.add(pc);}}
 const dpr0=R0.getPixelRatio(),sz=R0.getSize(new T.Vector2());const exp0=R0.toneMappingExposure;
 const mIb=MPI.bm,cIb=mIb&&mIb.color.getHex();if(mIb&&nuit)mIb.color.setRGB(.42,.44,.6);R0.setPixelRatio(1);R0.setSize(W,H,false);R0.toneMappingExposure=nuit?1.1:ciel?1.06:.95;R0.shadowMap.needsUpdate=true;R0.render(sc,cam);if(mIb)mIb.color.setHex(cIb);
 const c=mkC(W,H);const cg=c.getContext('2d');cg.drawImage(R0.domElement,0,0);if(ciel)etalonner(c,0,0,W,H,{sx:-.05,sy:.1,chaud:hd?'rgba(255,170,90,.5)':'rgba(255,200,130,.45)',vignette:'rgba(180,166,152,1)'});
 // passe d'identifiants (19/11) : chaque bâtiment et sa créature dans une couleur unique, cachés par ce qui est devant → le clic ouvre exactement ce qu'on voit
 let ids=null;try{const noir=new T.MeshBasicMaterial({color:0,toneMapped:false,fog:false});const tmpM=[noir],sauv=[];const parK=new Map();
  const coulK=k=>new T.Color().setRGB((k+1)*10/255,200/255,0,T.SRGBColorSpace);
  sc.traverse(o=>{if(!o.isMesh)return;const k=o.userData.bidx;let m=noir;if(k!==undefined){if(o.userData.sil){m=new T.MeshBasicMaterial({map:o.userData.sil,alphaTest:.5,toneMapped:false,fog:false,color:coulK(k)});tmpM.push(m);}else{m=parK.get(k);if(!m){m=new T.MeshBasicMaterial({color:coulK(k),toneMapped:false,fog:false,side:T.DoubleSide});parK.set(k,m);tmpM.push(m);}}}sauv.push([o,o.material]);o.material=m;});
  const bg0=sc.background,fg0=sc.fog,tm0=R0.toneMapping,sh0=R0.shadowMap.enabled;sc.background=new T.Color(0);sc.fog=null;R0.toneMapping=T.NoToneMapping;R0.shadowMap.enabled=false;try{R0.render(sc,cam);
  const ci=mkC(W,H),cx2=ci.getContext('2d',{willReadFrequently:true});cx2.drawImage(R0.domElement,0,0);const d=cx2.getImageData(0,0,W,H).data;const a=new Uint8Array(W*H);
  for(let i=0;i<W*H;i++){const g=d[i*4+1];if(g<194||g>206||d[i*4+2]>12)continue;const k=Math.round(d[i*4]/10)-1;if(k>=0&&k<objs.length&&Math.abs(d[i*4]-(k+1)*10)<=3)a[i]=k+1;}
  ids={W,H,a,bs:objs.map(o=>o[0])};}finally{for(const [o,m] of sauv)o.material=m;sc.background=bg0;sc.fog=fg0;R0.toneMapping=tm0;R0.shadowMap.enabled=sh0;tmpM.forEach(m=>m.dispose());}}catch(e){console.warn('pano ids',e);}
 R0.toneMappingExposure=exp0;R0.setPixelRatio(dpr0);R0.setSize(sz.x,sz.y,false);U.fog.value=fog0;U.N.value=n0;U.haze.value.copy(hz0);
 // zones cliquables + créatures devant leurs habitations (dessinées, comme sur la carte)
 const zones=[];const bb=new T.Box3(),q=new T.Vector3();const pr=(x,y,z)=>{q.set(x,y,z).project(cam);return[(q.x+1)/2*W,(1-q.y)/2*H];};
 const tri=objs.slice().sort((a,b)=>a[1].position.z-b[1].position.z);
 for(const [b,gr,u] of tri){bb.setFromObject(gr);let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(let k=0;k<8;k++){const [sx,sy]=pr(k&1?bb.max.x:bb.min.x,k&2?bb.max.y:bb.min.y,k&4?bb.max.z:bb.min.z);x0=Math.min(x0,sx);x1=Math.max(x1,sx);y0=Math.min(y0,sy);y1=Math.max(y1,sy);}
  if(b.startsWith('hab')&&!v.sansCre){const niv=+b[3];const cre0=FAC[v.fac].crea[niv-1];const cre=v.bat['hab'+niv+'u']&&CRE[cre0].amelio?CRE[cre0].amelio:cre0;const [cx,cz]=posCre(b,gr,u);const [bx,by]=pr(cx,0,cz);const [bx2]=pr(cx+u,0,cz);const S=Math.max(24,Math.abs(bx2-bx)*1.25);if(gr.position.x>0)x0=Math.min(x0,bx-S*.5);else x1=Math.max(x1,bx+S*.5);y1=Math.max(y1,by);}
  zones.push({b,x:x0,y:y0,w:x1-x0,h:y1-y0});}
 // drapeaux animés en 2D au sommet du château
 const drap=[];const fort=objs.find(o=>o[0]==='fort'||o[0]==='citadelle'||o[0]==='chateau');if(fort){const [b,gr,u]=fort;bb.setFromObject(gr);const [dx,dy]=pr(gr.position.x,bb.max.y,gr.position.z-1.6);drap.push([dx,Math.max(H*.12,dy)]);}
 sc.traverse(o=>{if(o.geometry===gs)o.geometry.dispose();});{const mi=Object.values(MPI);sc.traverse(o=>{if(o.isMesh&&mi.includes(o.material))o.geometry.dispose();});}GCRV.dispose();texV.forEach(t=>t.dispose());matV.forEach(m=>m.dispose());if(ts)ts.dispose();ms.dispose();tb.dispose();if(!envH)envC.dispose();if(sun.shadow.map)sun.shadow.map.dispose();
 return{c,zones,drap,ids};};
A.panoVille=abri(A.panoVille);
return A;})();
R3.stats=()=>{const o={};const sc=R3._scene&&R3._scene();if(!sc)return o;sc.traverse(m=>{if(!m.isMesh)return;const g=m.geometry;const t=(g.index?g.index.count:g.attributes.position.count)/3*(m.isInstancedMesh?m.count:1);const k=m.isInstancedMesh?'inst':m.name||(m.parent&&m.parent.type)||'?';o[k]=(o[k]||0)+t;});return o;};
