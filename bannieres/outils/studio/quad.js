// ===== Studio : bêtes sculptées par le code (chevaux, loups, griffon, roc, béhémoth, tréant…) =====
// Chaque image est SCULPTÉE : un squelette posé (cinématique directe) porte des volumes (cônes arrondis, ellipsoïdes)
// fusionnés en douceur (fonctions de distance), puis la peau est extraite en maillage lisse (marching cubes).
// Pelage / plumes / écorce : variations de couleur et relief fin dans le shader, crinières et queues en mèches de crins,
// ailes en vraies rangées de plumes, yeux brillants. Les cavaliers et le centaure gardent les personnages Mixamo.
import * as THREE from 'three';
import {MarchingCubes} from 'three/addons/objects/MarchingCubes.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {K,makeChar} from './kit.js';

// ---------- vecteurs (tableaux) ----------
const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],mul=(a,k)=>[a[0]*k,a[1]*k,a[2]*k];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],len=a=>Math.sqrt(dot(a,a)),nrm=a=>mul(a,1/(len(a)||1)),lerp=(a,b,t)=>add(a,mul(sub(b,a),t));
// direction dans le plan x-y : angle depuis la verticale descendante, positif = vers l'avant (+x)
const bas=(ang,l,z=0)=>[Math.sin(ang)*l,-Math.cos(ang)*l,z];
const col=h=>{const c=new THREE.Color(h);return[c.r,c.g,c.b];};

// ---------- sculpture par distances signées ----------
class Sculpt{
 constructor(){this.p=[];}
 // cône arrondi (deux sphères reliées), k = douceur de la fusion
 rc(a,b,r1,r2,c,k=.05){const lo=[Math.min(a[0]-r1,b[0]-r2),Math.min(a[1]-r1,b[1]-r2),Math.min(a[2]-r1,b[2]-r2)],hi=[Math.max(a[0]+r1,b[0]+r2),Math.max(a[1]+r1,b[1]+r2),Math.max(a[2]+r1,b[2]+r2)];
  const ba=sub(b,a),l2=Math.max(1e-6,dot(ba,ba)),rr=r1-r2;this.p.push({t:0,a,b,r1,r2,ba,l2,rr,a2:l2-rr*rr,il2:1/l2,c:col(c),k,lo,hi});return this;}
 // ellipsoïde (centre, rayons, rotation y puis z)
 el(cen,r,c,k=.05,rz=0,ry=0,rx=0){const m=new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx,ry,rz,'XYZ'));const inv=m.clone().invert().elements;const R=Math.max(r[0],r[1],r[2]);
  this.p.push({t:1,cen,r,inv,c:col(c),k,lo:cen.map(v=>v-R),hi:cen.map(v=>v+R)});return this;}
 d1(q,p){if(p.t===0){// iq sdRoundCone
   const pa=sub(q,p.a),y=dot(pa,p.ba),z=y-p.l2;const xv=sub(mul(pa,p.l2),mul(p.ba,y));const x2=dot(xv,xv),y2=y*y*p.l2,z2=z*z*p.l2;const k=Math.sign(p.rr)*p.rr*p.rr*x2;
   if(Math.sign(z)*p.a2*z2>k)return Math.sqrt(x2+z2)*p.il2-p.r2;if(Math.sign(y)*p.a2*y2<k)return Math.sqrt(x2+y2)*p.il2-p.r1;return(Math.sqrt(x2*p.a2*p.il2)+y*p.rr)*p.il2-p.r1;}
  const e=p.inv,x=q[0]-p.cen[0],y=q[1]-p.cen[1],z=q[2]-p.cen[2];const lx=e[0]*x+e[4]*y+e[8]*z,ly=e[1]*x+e[5]*y+e[9]*z,lz=e[2]*x+e[6]*y+e[10]*z;
  const k0=Math.sqrt((lx/p.r[0])**2+(ly/p.r[1])**2+(lz/p.r[2])**2),k1=Math.sqrt((lx/p.r[0]**2)**2+(ly/p.r[1]**2)**2+(lz/p.r[2]**2)**2);return k1<1e-9?-Math.min(...p.r):k0*(k0-1)/k1;}
 // champ + couleur
 ev(q,out){let d=1e9,r=0,g=0,b=0;for(const p of this.p){let di;const dx=Math.max(p.lo[0]-q[0],0,q[0]-p.hi[0]),dy=Math.max(p.lo[1]-q[1],0,q[1]-p.hi[1]),dz=Math.max(p.lo[2]-q[2],0,q[2]-p.hi[2]);
   const bd=Math.sqrt(dx*dx+dy*dy+dz*dz);if(bd>p.k+.03){di=bd;}else di=this.d1(q,p);
   if(d>=1e8){d=di;r=p.c[0];g=p.c[1];b=p.c[2];continue;}
   const k=p.k,h=Math.max(k-Math.abs(d-di),0)/k;const w=Math.min(1,Math.max(0,.5+.5*(d-di)/k));d=Math.min(d,di)-h*h*k*.25;r+=(p.c[0]-r)*w;g+=(p.c[1]-g)*w;b+=(p.c[2]-b)*w;}
  out[0]=r;out[1]=g;out[2]=b;return d;}
 bornes(){const lo=[1e9,1e9,1e9],hi=[-1e9,-1e9,-1e9];for(const p of this.p)for(let i=0;i<3;i++){lo[i]=Math.min(lo[i],p.lo[i]);hi[i]=Math.max(hi[i],p.hi[i]);}return[lo,hi];}
}
// extraction de la peau (marching cubes) dans un maillage réutilisable
function peau(S,mc,res){const [lo,hi]=S.bornes();const c=[(lo[0]+hi[0])/2,(lo[1]+hi[1])/2,(lo[2]+hi[2])/2];const E=Math.max(hi[0]-lo[0],hi[1]-lo[1],hi[2]-lo[2])/2*1.08+.04;
 const n=mc.size,hs=mc.halfsize,f=mc.field,pal=mc.palette,o=[0,0,0],q=[0,0,0];
 for(let z=0;z<n;z++){q[2]=c[2]+(z-hs)/hs*E;for(let y=0;y<n;y++){q[1]=c[1]+(y-hs)/hs*E;for(let x=0;x<n;x++){q[0]=c[0]+(x-hs)/hs*E;const i=x+y*n+z*n*n;const d=S.ev(q,o);f[i]=-d;pal[i*3]=o[0];pal[i*3+1]=o[1];pal[i*3+2]=o[2];}}}
 mc.isolation=0;mc.update();mc.position.set(...c);mc.scale.setScalar(E);}

// ---------- matières : pelage / cuir / plumes / écorce (bruit fin + relief dans le shader) ----------
const NOISE=`float bh(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float bn(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(bh(i),bh(i+vec3(1,0,0)),f.x),mix(bh(i+vec3(0,1,0)),bh(i+vec3(1,1,0)),f.x),f.y),mix(mix(bh(i+vec3(0,0,1)),bh(i+vec3(1,0,1)),f.x),mix(bh(i+vec3(0,1,1)),bh(i+vec3(1,1,1)),f.x),f.y),f.z);}
float poil(vec3 p,vec3 s){return bn(p*s)*.55+bn(p*s*2.13+7.)*.3+bn(p*s*4.7+3.)*.15;}`;
function matPeau(o={}){const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:o.r??.82,metalness:0});
 const S=o.etire||[90,140,90],T=o.tache??.25,B=o.relief??.35,F=o.freq||4;
 m.onBeforeCompile=sh=>{sh.vertexShader='varying vec3 vWp;\n'+sh.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvWp=(modelMatrix*vec4(transformed,1.)).xyz;');
  sh.fragmentShader='varying vec3 vWp;\n'+NOISE+'\n'+sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 {float t=bn(vWp*${F.toFixed(1)})*.6+bn(vWp*${(F*2.7).toFixed(1)})*.4;float f=poil(vWp,vec3(${S.map(v=>v.toFixed(1)).join(',')}));diffuseColor.rgb*=(1.-${T.toFixed(2)})+${(2*T).toFixed(2)}*t;diffuseColor.rgb*=.82+.36*f;}`)
  .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
 {vec3 s=vec3(${S.map(v=>v.toFixed(1)).join(',')});float e=.004;float f0=poil(vWp,s);vec3 gr=vec3(poil(vWp+vec3(e,0,0),s)-f0,poil(vWp+vec3(0,e,0),s)-f0,poil(vWp+vec3(0,0,e),s)-f0)/e;
  vec3 gv=(viewMatrix*vec4(gr,0.)).xyz;normal=normalize(normal-gv*${(B*.004).toFixed(4)});}`);};
 m.customProgramCacheKey=()=>'peau'+JSON.stringify(o);return m;}
const mBrillant=(c,r=.12)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:.05});

// ---------- crins (crinière, queue, fourrure longue) : mèches fines ----------
function meches(chemins,ep,cols,mat){const gs=[];for(const ch of chemins){const cur=new THREE.CatmullRomCurve3(ch.p.map(v=>new THREE.Vector3(...v)));const g=new THREE.TubeGeometry(cur,10,ep*(ch.e||1),3,false);
  const pos=g.attributes.position,N=pos.count;const c=new Float32Array(N*3);const cc=new THREE.Color(cols[(ch.k||0)%cols.length]);
  // fin de mèche plus fine : on resserre vers l'axe
  const pts=cur.getSpacedPoints(10);for(let i=0;i<N;i++){const s=Math.floor(i/4)/10;const ax=pts[Math.min(10,Math.round(s*10))];const v=new THREE.Vector3().fromBufferAttribute(pos,i);v.sub(ax).multiplyScalar(1-s*.85).add(ax);pos.setXYZ(i,v.x,v.y,v.z);
   const l=.85+.3*((i*7919)%13)/13;c[i*3]=cc.r*l;c[i*3+1]=cc.g*l;c[i*3+2]=cc.b*l;}
  g.setAttribute('color',new THREE.BufferAttribute(c,3));g.deleteAttribute('uv');gs.push(g);}
 return new THREE.Mesh(mergeGeometries(gs),mat||new THREE.MeshStandardMaterial({vertexColors:true,roughness:.6}));}
let SEED=12345;const rnd=()=>(SEED=(SEED*16807)%2147483647)/2147483647;

// ---------- ailes : bras + rangées de plumes ----------
let TPL=null;function texPlume(){if(TPL)return TPL;const c=document.createElement('canvas');c.width=64;c.height=256;const g=c.getContext('2d');
 g.fillStyle='#fff';g.beginPath();g.moveTo(32,2);g.bezierCurveTo(58,40,60,200,40,254);g.lineTo(24,254);g.bezierCurveTo(4,200,6,40,32,2);g.fill();
 g.globalCompositeOperation='source-atop';for(let y=6;y<250;y+=3){const a=(y/256)*.6+.2;g.strokeStyle=`rgba(0,0,0,${.12+.1*Math.random()})`;g.lineWidth=1;g.beginPath();g.moveTo(32,y);g.lineTo(4,y-14*a);g.moveTo(32,y);g.lineTo(60,y-14*a);g.stroke();}
 for(let k=0;k<6;k++){g.fillStyle='rgba(0,0,0,.35)';const y=40+Math.random()*190;g.fillRect(Math.random()<.5?2:44,y,18,2);}
 const gr=g.createLinearGradient(0,0,0,256);gr.addColorStop(0,'rgba(0,0,0,.25)');gr.addColorStop(.4,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,64,256);
 g.globalCompositeOperation='source-over';g.strokeStyle='rgba(240,230,210,.9)';g.lineWidth=2;g.beginPath();g.moveTo(32,4);g.lineTo(32,254);g.stroke();
 TPL=new THREE.CanvasTexture(c);TPL.colorSpace=THREE.SRGBColorSpace;return TPL;}
function aile(o,cote,ouv){// ouv : 0 replié, 1 déployé ; renvoie un groupe (racine à l'épaule), étendue vers -x (arrière) et le côté
 const g=new THREE.Group();const L=o.ailesT||1.2;const plume=new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2).rotateY(Math.PI/2);const mats={};
 const mp=c=>mats[c]||(mats[c]=new THREE.MeshStandardMaterial({color:c,roughness:.8,map:texPlume(),alphaTest:.45,side:THREE.DoubleSide}));
 // os de l'aile : épaule → coude → poignet (dans le plan, dépliés selon ouv)
 const a1=-.3-ouv*.25,a2=.8-ouv*.75,a3=-.4+ouv*.2;// angles
 const e=[0,0,0],c=add(e,[Math.cos(Math.PI+a1)*L*.32,Math.sin(.6+ouv*.4)*L*.32*.6,cote*L*.32*(.35+ouv*.6)]);
 const p=add(c,[Math.cos(Math.PI+a1+a2)*L*.3,Math.sin(.3+ouv*.3)*L*.3*.5,cote*L*.3*(.2+ouv*.7)]);
 const bout=add(p,[Math.cos(Math.PI+a1+a2+a3)*L*.18,.02,cote*L*.18*(.3+ouv*.6)]);
 const os=[e,c,p,bout];
 // plumes : rémiges primaires (main), secondaires (avant-bras), couvertures
 const ajout=(base,dir,lg,lar,coul,inc)=>{const m=new THREE.Mesh(plume,mp(coul));const d=nrm(dir);m.scale.set(lg,1,lar*1.6);m.position.set(...add(base,mul(d,lg/2)));
  const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1,0,0),new THREE.Vector3(...d));m.quaternion.copy(q);m.rotateX(inc*cote);g.add(m);};
 const rang=(A,B,n,lg0,lg1,ang0,ang1,coul,lar,inc,dy)=>{for(let i=0;i<n;i++){const t=i/(n-1);const base=add(lerp(A,B,t),[0,dy,0]);const ang=ang0+(ang1-ang0)*t;const dir=[Math.cos(Math.PI+ang),-.25-.15*(1-ouv),cote*Math.sin(ang)*.9];
   const cl=new THREE.Color(coul[0]).lerp(new THREE.Color(coul[1]),t*.7+rnd()*.3).getHex();ajout(base,dir,lg0+(lg1-lg0)*t,lar,cl,inc);}};
 const pt=o.plumes||[0x6a4a2a,0x3a2818];
 rang(p,bout,9,L*.55,L*.42,-.15,.9+ouv*.4,pt,L*.07,.08,0);// primaires
 rang(c,p,10,L*.42,L*.5,-.35,-.1,pt,L*.075,.06,0);// secondaires
 rang(e,c,8,L*.32,L*.4,-.6,-.35,pt,L*.08,.05,0);// tertiaires
 const cv=o.couv||[pt[0],pt[0]];rang(e,p,14,L*.22,L*.18,-.5,.2,cv,L*.07,.15,.012);rang(e,c,10,L*.12,L*.1,-.4,0,cv,L*.06,.2,.024);
 // bras (os couvert)
 const mb=new THREE.MeshStandardMaterial({color:new THREE.Color(cv[0]).multiplyScalar(.6),roughness:.85});for(let i=0;i<3;i++){const a=os[i],b=os[i+1];const d=sub(b,a);const m=new THREE.Mesh(new THREE.CylinderGeometry(L*.012,L*.02,len(d),8),mb);m.position.set(...lerp(a,b,.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(...nrm(d)));g.add(m);}
 return g;}

// ---------- quadrupède sculpté ----------
// gabarits (longueurs en unités du monde ; le cheval fait ~1 au garrot)
const G_CHEVAL={// corps
 corps:{bar:[.56,.27,.25],poit:[.26,.3,.23],cul:[.29,.29,.24],ventre:[.46,.21,.22]},epaule:[.42,-.06,.15],hanche:[-.42,-.02,.15],
 av:[.31,.33,.25,.09],ar:[.34,.37,.29,.09],rav:[.085,.065,.042,.034,.032],rar:[.11,.07,.044,.034,.032],sabot:[.05,.058,.06],
 cou:{base:[.48,.12],l:.56,r0:.17,r1:.1,ang:.95},tete:{l:.5,r0:.115,r1:.07,ang:-1.0},oreille:.12,queue:'crins',
 pose0:{av:[-.42,.06,0,.45],ar:[.38,-.55,.06,.4]}};
const G_LOUP={corps:{bar:[.5,.19,.15],poit:[.25,.24,.17],cul:[.21,.19,.15],ventre:[.34,.1,.12]},epaule:[.38,-.02,.11],hanche:[-.38,.01,.1],
 av:[.24,.26,.17,.06],ar:[.27,.3,.2,.06],rav:[.07,.046,.032,.026,.028],rar:[.09,.05,.034,.026,.028],patte:.045,
 cou:{base:[.42,.1],l:.26,r0:.15,r1:.12,ang:.6},tete:{l:.38,r0:.12,r1:.04,ang:-.28},oreille:.18,queue:'touffu',fraise:.75,
 pose0:{av:[-.22,.1,0,.32],ar:[.45,-.75,.1,.3]}};
const G_BEHEMOTH={corps:{bar:[.72,.38,.36],poit:[.42,.46,.38],cul:[.34,.33,.3],ventre:[.58,.28,.3],bosse:1.35},epaule:[.52,.02,.26],hanche:[-.55,-.1,.22],
 av:[.44,.4,.24,.09],ar:[.34,.33,.22,.09],rav:[.19,.15,.11,.1,.1],rar:[.17,.12,.095,.085,.09],patte:.12,griffes:1,
 cou:{base:[.7,.12],l:.26,r0:.3,r1:.24,ang:.05},tete:{l:.5,r0:.21,r1:.13,ang:-.5},oreille:.07,queue:'court',cornes:1,crocs:1,epines:1,
 pose0:{av:[-.1,.08,0,.12],ar:[.25,-.35,.06,.12]}};
const G_GRIFFON={corps:{bar:[.5,.24,.22],poit:[.26,.28,.22],cul:[.25,.24,.2],ventre:[.4,.17,.19]},epaule:[.4,-.04,.14],hanche:[-.38,0,.13],
 av:[.25,.26,.16,.07],ar:[.27,.28,.19,.07],rav:[.07,.05,.032,.028,.03],rar:[.09,.06,.035,.03,.035],patte:.045,serres:1,
 cou:{base:[.44,.12],l:.28,r0:.16,r1:.13,ang:1.15},tete:{l:.3,r0:.135,r1:.07,ang:-.4},oreille:.07,bec:1,queue:'lion',ailes:1,
 pose0:{av:[-.3,.15,0,.4],ar:[.45,-.7,.1,.35]}};

function quadrupede(o){
 const P=Object.assign({},o.g);const root=new THREE.Group(),corps=new THREE.Group();root.add(corps);
 const mc=new MarchingCubes(o.res||104,matPeau(o.peau||{}),false,true,260000);mc.frustumCulled=false;mc.castShadow=mc.receiveShadow=true;corps.add(mc);
 const extras=new THREE.Group();corps.add(extras);
 const C=o.couleurs;// {robe, fonce, ventre, sabot, crin, nez, ...}
 const etat={mc,extras,P,o};
 // pose : angles des segments de pattes (absolus dans le repère du corps), cou, tête, queue, mâchoire, ailes
 etat.sculpter=(po)=>{SEED=12345;const S=new Sculpt();const B=P.corps;const ro=C.robe,fo=C.fonce||ro,ve=C.ventre||ro;
  for(const m of [...extras.children]){extras.remove(m);m.traverse(x=>{if(x.geometry)x.geometry.dispose();});}
  // tronc
  S.el([0,0,0],B.bar,ro,.12).el([.38*B.bar[0]/.56,-.02,0],B.poit,ro,.12).el([-.38*B.bar[0]/.56,.03,0],B.cul,ro,.12).el([0,-.07,0],B.ventre,ve,.14);
  S.el([P.epaule[0]-.12,.2*B.bar[1]/.27,0],[.2*B.bar[0]/.56,.09,.08*B.bar[2]/.25],ro,.08);// garrot
  if(o.dos)S.el([0,B.bar[1]*.55,0],[B.bar[0]*.9,B.bar[1]*.5,B.bar[2]*.75],fo,.1);
  if(B.bosse)S.el([P.epaule[0]-.1,B.bar[1]*.75,0],[B.bar[0]*.45,B.bar[1]*.45,B.bar[2]*.6],fo,.18);
  // pattes
  const sa=C.sabot||0x2a2218;const pieds=[];
  for(const [av,cote] of [[1,1],[1,-1],[0,1],[0,-1]]){const L=av?P.av:P.ar,R=av?P.rav:P.rar,A=po[av?'av':'ar'][cote>0?0:1];const j0=[...(av?P.epaule:P.hanche)];j0[2]*=cote;
   const pts=[j0];let cur=j0;for(let i=0;i<4;i++){cur=add(cur,bas(A[i],L[i]));pts.push(cur);}
   // muscles : épaule / cuisse
   const mus=av?[.17,.22,.09]:[.2,.26,.1];const sc=B.bar[1]/.27;S.el(lerp(pts[0],pts[1],.35),mus.map(v=>v*sc),ro,.09,A[0]);
   for(let i=0;i<4;i++){const cA=i<1?ro:i<2?(av?ro:ro):fo;S.rc(pts[i],pts[i+1],R[i],R[i+1],cA,i<1?.07:.035);}
   const pied=pts[4];pieds.push(pied);
   if(P.sabot){const sb=P.sabot;S.rc(add(pied,[0,sb[0]*.6,0]),add(pied,[.02,-sb[2]*.4,0]),sb[0]*.75,sb[1],sa,.02);}
   else{S.el(add(pied,[.03,-.012,0]),[P.patte*1.25,P.patte*.6,P.patte],fo,.03);if(P.serres&&av)for(let k=-1;k<=1;k++)S.rc(add(pied,[.04,-.01,k*.02]),add(pied,[.09,-.03,k*.03]),.012,.004,0x1a1612,.01);
    if(P.griffes)for(let k=-1;k<=1;k++)S.rc(add(pied,[P.patte*.9,0,k*P.patte*.55]),add(pied,[P.patte*1.9,-P.patte*.45,k*P.patte*.7]),P.patte*.22,.006,0xcfc4a8,.012);}}
  // cou et tête
  if(o.sansTete){peau(S,mc,o.res||104);etat.tete=null;return;}
  const cb=[P.cou.base[0],P.cou.base[1],0];const ca=P.cou.ang+(po.cou||0);const ct=add(cb,[Math.cos(ca)*P.cou.l,Math.sin(ca)*P.cou.l,0]);
  S.rc(cb,ct,P.cou.r0,P.cou.r1,ro,.12);S.el(lerp(cb,ct,.5),[P.cou.l*.55,P.cou.r0*.6,P.cou.r0*.55],ro,.1,ca);
  if(P.fraise)S.el(lerp(cb,ct,.3),[P.cou.r0*1.5*P.fraise,P.cou.r0*1.35*P.fraise,P.cou.r0*1.3*P.fraise],C.fraise||ro,.1,ca);
  const ta=P.tete.ang+(po.tete||0)+(po.cou||0)*.3;const hd=[Math.cos(ta),Math.sin(ta),0];const h0=add(ct,mul(hd,-P.tete.l*.08)),h1=add(ct,mul(hd,P.tete.l));
  const T=P.tete;const tete={h0,h1,hd};
  if(P.bec){S.el(add(ct,mul(hd,T.l*.15)),[T.l*.48,T.r0*1.05,T.r0*.9],C.tete||ro,.07,ta);
   const b0=add(ct,mul(hd,T.l*.45)),b1=add(add(ct,mul(hd,T.l*.95)),[0,-T.l*.12,0]);S.rc(b0,b1,T.r0*.42,.01,C.bec||0xd8a030,.025);S.rc(add(b1,[-.01,.03,0]),add(b1,[.02,-.04,0]),.018,.006,C.bec||0xd8a030,.015);}
  else{S.rc(h0,h1,T.r0,T.r1,ro,.06);S.el(add(h0,mul(hd,T.l*.22)),[T.l*.32,T.r0*1.05,T.r0*.95],ro,.06,ta);// crâne
   const jo=po.machoire||0;const jd=[Math.cos(ta-jo),Math.sin(ta-jo),0];S.rc(add(h0,[0,-T.r0*.45,0]),add(add(h0,mul(jd,T.l*.88)),[0,-T.r1*.6,0]),T.r0*.55,T.r1*.6,C.ventre||ro,.04);
   S.el(add(h1,mul(hd,-.01)),[T.r1*1.1,T.r1*.95,T.r1*1.15],C.nez||fo,.03,ta);// museau / truffe
   for(const z of [-1,1]){const e0=add(add(h0,mul(hd,T.l*.12)),[0,T.r0*.75,z*T.r0*.55]);S.rc(e0,add(e0,[-.02,P.oreille,z*.03]),.028,.006,fo,.03);}}
  // cornes et corne de licorne : maillages à part
  // queue
  const qb=[-B.bar[0]*.95,B.bar[1]*.55,0];const qa=(po.queue||0);
  if(P.queue==='lion'){const q1=add(qb,[-.18,-.15+qa*.1,0]),q2=add(q1,[-.12,-.25,0]);S.rc(qb,q1,.03,.022,ro,.03).rc(q1,q2,.022,.018,ro,.02).el(q2,[.05,.07,.05],fo,.02);}
  else if(P.queue==='court')S.rc(qb,add(qb,[-.2,-.25,0]),.06,.03,fo,.04);
  else if(P.queue==='touffu'){const q1=add(qb,[-.2,-.12+qa*.1,0]),q2=add(q1,[-.12,-.24,0]);S.rc(qb,q1,.055,.085,ro,.05).rc(q1,q2,.085,.03,fo,.05);}
  else S.rc(qb,add(qb,[-.1,-.08,0]),.06,.045,ro,.04);
  peau(S,mc,o.res||104);
  // crins : crinière, toupet, queue
  if(P.queue==='crins'){const ch=[];for(let i=0;i<70;i++){const z=(rnd()-.5)*.08;const l=.55+rnd()*.25;const sw=qa*.25;ch.push({p:[add(qb,[0,0,z]),add(qb,[-.12-rnd()*.05,-.12,z*1.6]),add(qb,[-.2+sw*.3,-.4*l,z*2]),add(qb,[-.24+sw,-.85*l,z*2.4])],k:i});}extras.add(meches(ch,.012,C.crin));}
  if(o.criniere){const ch=[];for(let i=0;i<90;i++){const t=rnd();const b=add(lerp(cb,ct,t),[-P.cou.r0*.55*(1-t*.4)+.02,P.cou.r0*.85*(1-t*.5),(rnd()-.5)*.03]);const sd=(rnd()<.5?1:-1);
    ch.push({p:[b,add(b,[-.05,.03,sd*.02]),add(b,[-.08,-.06,sd*.07]),add(b,[-.07,-.16,sd*.1])],k:i});}
   for(let i=0;i<14;i++){const b=add(add(h0,mul(hd,T.l*.1)),[0,T.r0*.9,(rnd()-.5)*.05]);ch.push({p:[b,add(b,[.05,.02,0]),add(b,[.1,-.04,(rnd()-.5)*.05])],k:i});}extras.add(meches(ch,.011,C.crin));}
  if(o.fourrure){const ch=[];for(let i=0;i<160;i++){const t=rnd();const onDos=i<100;const b=onDos?[ -B.bar[0]*.8+t*B.bar[0]*1.7,B.bar[1]*(.85+.1*Math.sin(t*3)),(rnd()-.5)*B.bar[2]*1.2]:add(lerp(cb,ct,t*.6),[(rnd()-.5)*.1,(rnd()-.3)*P.cou.r0*1.4,(rnd()<.5?1:-1)*P.cou.r0*(.8+rnd()*.4)]);const l=.05+rnd()*.05;
    ch.push({p:[b,add(b,[-l*.6,l*.4,(rnd()-.5)*l]),add(b,[-l*1.2,-l*.1,(rnd()-.5)*l*1.5])],k:i});}extras.add(meches(ch,.009,C.poils||[C.robe,C.fonce]));}
  // yeux
  if(!P.bec||true){for(const z of [-1,1]){const ep=P.bec?add(add(ct,mul(hd,T.l*.2)),[0,T.r0*.35,z*T.r0*.75]):add(add(h0,mul(hd,T.l*.25)),[0,T.r0*.45,z*T.r0*.82]);const e=new THREE.Mesh(new THREE.SphereGeometry(T.r0*.2,12,8),mBrillant(C.oeil||0x140c06,.08));e.position.set(...ep);extras.add(e);}}
  if(P.cornes){const mcn=mBrillant(C.corne||0xd8ccb0,.35);const fc=P.crocs?[[-.1,.16,.16],[.02,.34,.26],[.24,.38,.2]]:[[-.08,.2,.2],[.12,.38,.32],[.34,.36,.24]];for(const z of [-1,1]){const b=add(add(h0,mul(hd,T.l*.15)),[0,T.r0*.8,z*T.r0*.7]);const cur=new THREE.CatmullRomCurve3([b,add(b,[fc[0][0],fc[0][1],z*fc[0][2]]),add(b,[fc[1][0],fc[1][1],z*fc[1][2]]),add(b,[fc[2][0],fc[2][1],z*fc[2][2]])].map(v=>new THREE.Vector3(...v)));
   const g=new THREE.TubeGeometry(cur,16,P.crocs?.08:.085,10,false);const p=g.attributes.position;const pts=cur.getSpacedPoints(16);for(let i=0;i<p.count;i++){const s=Math.floor(i/11)/16;const ax=pts[Math.min(16,Math.round(s*16))];const v=new THREE.Vector3().fromBufferAttribute(p,i).sub(ax).multiplyScalar(1-s*.85).add(ax);p.setXYZ(i,v.x,v.y,v.z);}g.computeVertexNormals();extras.add(new THREE.Mesh(g,mcn));}}
  if(P.epines){const me=mBrillant(C.corne||0x5e5444,.4);for(let i=0;i<7;i++){const t=i/6;const x=P.epaule[0]-.05-t*B.bar[0]*1.45;const y=B.bar[1]*(1.02+.32*Math.sin((1-t)*2.2)*(B.bosse?1:0))-t*.04;const h=.16*(1-t*.55);const g=new THREE.ConeGeometry(.045*(1-t*.4),h,8);g.translate(0,h/2,0);const m=new THREE.Mesh(g,me);m.position.set(x,y,0);m.rotation.z=.45;extras.add(m);}}
  if(P.crocs){const mcr=mBrillant(0xe0d6c0,.3);for(const z of [-1,1]){const g=new THREE.ConeGeometry(T.r1*.22,T.r1*.9,10);g.translate(0,T.r1*.45,0);const m=new THREE.Mesh(g,mcr);m.position.set(...add(add(h0,mul(hd,T.l*.78)),[0,-T.r0*.45,z*T.r1*.62]));m.rotation.z=-.25;m.rotation.x=z*.15;extras.add(m);}}
  if(o.licorne){const b=add(add(h0,mul(hd,T.l*.18)),[0,T.r0*.9,0]);const dir=nrm(add(hd,[0,1.6,0]));const g=new THREE.ConeGeometry(.03,.36,24,24);g.translate(0,.18,0);const p=g.attributes.position;
   for(let i=0;i<p.count;i++){const y=p.getY(i);const a=Math.atan2(p.getZ(i),p.getX(i));const k=1+.25*Math.sin(a*2+y*60);p.setX(i,p.getX(i)*k);p.setZ(i,p.getZ(i)*k);}g.computeVertexNormals();
   const m=new THREE.Mesh(g,mBrillant(0xf0dca0,.25));m.position.set(...b);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(...dir));extras.add(m);}
  if(o.ailes){for(const z of [-1,1]){const w=aile(o,z,po.ailes??.3);w.position.set(P.epaule[0]-.12,B.bar[1]*.9,z*B.bar[2]*.55);extras.add(w);}}
  extras.traverse(x=>{if(x.isMesh){x.castShadow=true;}});
  etat.tete=tete;};
 // poses
 const p0=P.pose0;etat.poser=(an,t)=>{const k=Math.sin(t*Math.PI),s=Math.sin(t*Math.PI*2);const po={av:[[...p0.av],[...p0.av]],ar:[[...p0.ar],[...p0.ar]],cou:0,tete:0,queue:s*.4,machoire:P.crocs?.16:0,ailes:o.ailesRepos??.25};
  corps.position.set(0,0,0);corps.rotation.set(0,0,0);let dy=0;
  if(an==='idle'){po.cou=s*.03;po.tete=s*.04;dy=s*.008;po.ailes+=s*.05;}
  else if(an==='marche'){const f=t*Math.PI*2;const ph=[[.25,.75],[0,.5]];// pas : AG .25, AD .75, PG 0, PD .5
   for(const [av,i] of [[1,0],[1,1],[0,0],[0,1]]){const l=po[av?'av':'ar'][i];const a=f-ph[av?0:1][i]*Math.PI*2;const sw=Math.sin(a),lift=Math.max(0,Math.cos(a));
    l[0]+=sw*(av?.32:.28);l[1]+=lift*(av?-.25:.3)*-1+(av?lift*.15:0);l[2]+=lift*(av?-.55:.35)*-1;l[3]+=lift*.2;}
   dy=Math.abs(Math.sin(f))*.012;po.cou=Math.sin(f*2)*.04;po.tete=-Math.sin(f*2)*.05;po.queue=Math.sin(f)*.3;}
  else if(an==='atk'){if(o.cabre){corps.rotation.z=k*.62;dy=k*.08;corps.position.x=-k*.22;for(const l of po.av){l[0]+=k*1.5;l[1]-=k*.9;l[2]-=k*.8;}for(const l of po.ar){l[0]+=k*.4;l[1]-=k*.3;}po.cou=k*.25;po.tete=-k*.2;po.machoire=k*.25;po.ailes=.25+k*.75;}
   else{corps.position.x=k*.28;corps.rotation.z=-k*.1;for(const l of po.av){l[0]+=k*.9;l[1]+=k*.2;}for(const l of po.ar){l[0]-=k*.35;l[1]-=k*.2;}po.cou=-k*.35;po.tete=-k*.1;po.machoire=k*.6;po.ailes=.25+k*.6;}}
  else if(an==='hit'){corps.rotation.z=k*.12;corps.position.x=-k*.1;po.cou=k*.3;po.tete=k*.2;po.machoire=k*.3;}
  else if(an==='die'){const d=Math.min(1,t*1.15);corps.rotation.x=d*Math.PI/2*.92;for(const l of [...po.av,...po.ar]){l[0]+=d*.3;l[1]-=d*.4;}po.cou=-d*.5;po.tete=d*.3;po.ailes=.1+d*.4;}
  etat.sculpter(po);
  // posé au sol : le sabot le plus bas de la pose de repos touche le sol
  if(etat.h0==null){etat.h0=o.hauteur;}
  corps.position.y=etat.h0+dy+(an==='atk'&&o.cabre?k*.25:0);if(an==='die'){const d=Math.min(1,t*1.15);corps.position.y=etat.h0*(1-d)+P.corps.bar[2]*1.05*d;}
  corps.updateMatrixWorld(true);};
 etat.root=root;etat.corps=corps;return etat;}
// hauteur au sol (repos) : pied le plus bas
function hauteurPose(g){const p0=g.pose0;let m=0;for(const [av] of [[1],[0]]){const L=av?g.av:g.ar,A=p0[av?'av':'ar'];let y=(av?g.epaule:g.hanche)[1];for(let i=0;i<4;i++)y+=bas(A[i],L[i])[1];m=Math.min(m,y-(g.sabot?g.sabot[2]*.4:g.patte*.6));}return -m;}

// ---------- oiseau géant (roc) ----------
function oiseau(o){const root=new THREE.Group(),corps=new THREE.Group();root.add(corps);const mc=new MarchingCubes(o.res||100,matPeau({etire:[60,160,60],tache:.18,relief:.5,freq:5}),false,true,220000);mc.castShadow=true;corps.add(mc);const ex=new THREE.Group();corps.add(ex);
 const C=o.couleurs;const etat={root,corps};
  etat.poser=(an,t)=>{SEED=777;const k=Math.sin(t*Math.PI),s=Math.sin(t*Math.PI*2);let ouv=.15+(an==='idle'?.05*s:an==='atk'?.85*k:an==='hit'?.4:.5),ty=0,cou=0,rz=0;
  if(an==='atk'){cou=-k*.5;rz=-k*.2;}if(an==='hit'){cou=k*.4;rz=k*.15;}
  for(const m of [...ex.children]){ex.remove(m);}
  const S=new Sculpt();S.el([0,0,0],[.5,.3,.27],C.robe,.12).el([.22,.05,0],[.3,.3,.24],C.poitrail,.12).el([-.38,-.02,0],[.3,.18,.18],C.robe,.1);
  const cb=[.35,.2,0],ca=1.2+cou,ct=add(cb,[Math.cos(ca)*.32,Math.sin(ca)*.32,0]);S.rc(cb,ct,.17,.13,C.nuque||C.tete,.12);
  const hd=[Math.cos(-.2+cou*.3),Math.sin(-.2+cou*.3),0];S.el(add(ct,mul(hd,.05)),[.17,.14,.13],C.tete,.06,-.2);
  const b0=add(ct,mul(hd,.12)),b1=add(add(ct,mul(hd,.34)),[0,-.06,0]);if(o.rapace){const b2=add(add(ct,mul(hd,.36)),[0,-.02,0]);S.rc(b0,b2,.085,.035,C.bec,.03).rc(b2,add(b2,[.04,-.09,0]),.036,.008,C.bec,.02).el(b0,[.05,.06,.07],C.cire||C.bec,.02,-.2);
   for(const z of [-1,1])S.el(add(add(ct,mul(hd,.07)),[0,.065,z*.075]),[.075,.022,.04],C.robe,.03,-.35);}
  else S.rc(b0,b1,.065,.012,C.bec,.03).rc(add(b1,[-.02,.03,0]),add(b1,[.03,-.07,0]),.022,.006,C.bec,.02);
  // pattes
  for(const z of [-1,1]){const h=[.05,-.2,z*.13],g=add(h,[.02,-.28,0]),f=add(g,[.04,-.24,0]);S.rc(h,g,.08,.05,C.robe,.06).rc(g,f,.035,.03,C.patte,.02);
   for(let i=-1;i<=1;i++)S.rc(f,add(f,[.1,-.02,i*.05]),.018,.008,C.patte,.01);S.rc(f,add(f,[-.06,-.01,0]),.016,.006,C.patte,.01);}
  peau(S,mc,o.res||100);
  for(const z of [-1,1]){const e=new THREE.Mesh(new THREE.SphereGeometry(.03,12,8),mBrillant(o.rapace?0xb07810:0x2a1404,.08));e.position.set(...add(add(ct,mul(hd,.1)),[0,.04,z*.1]));ex.add(e);}
  // queue en éventail
  const plume=new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2).rotateY(Math.PI/2);for(let i=0;i<9;i++){const a=(i-4)/4*.5;const m=new THREE.Mesh(plume,new THREE.MeshStandardMaterial({color:new THREE.Color(C.plumes[0]).lerp(new THREE.Color(C.plumes[1]),rnd()).getHex(),roughness:.8,map:texPlume(),alphaTest:.45,side:THREE.DoubleSide}));m.scale.set(.5,1,.14);m.position.set(-.85,-.02,Math.sin(a)*.25);m.rotation.y=a;m.rotation.z=.1;ex.add(m);}
  for(const z of [-1,1]){const w=aile({ailesT:o.ailesT||1.5,plumes:C.plumes,couv:C.couv},z,ouv);w.position.set(.15,.2,z*.22);ex.add(w);}
  ex.traverse(x=>{if(x.isMesh)x.castShadow=true;});
  corps.rotation.set(0,0,rz);corps.position.set(an==='atk'?k*.2:0,o.hauteur+(an==='idle'?s*.01:0),0);if(an==='die'){const d=Math.min(1,t*1.15);corps.rotation.x=d*1.4;corps.position.y=o.hauteur*(1-d*.75);}corps.updateMatrixWorld(true);};
 return etat;}

// ---------- tréant : écorce sculptée et feuillage en milliers de feuilles ----------
function texFeuille(){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.fillStyle='#fff';g.beginPath();g.moveTo(32,2);g.quadraticCurveTo(60,24,32,62);g.quadraticCurveTo(4,24,32,2);g.fill();g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=2;g.beginPath();g.moveTo(32,6);g.lineTo(32,58);g.stroke();const t=new THREE.CanvasTexture(c);return t;}
function treant(o){const root=new THREE.Group(),corps=new THREE.Group();root.add(corps);const mc=new MarchingCubes(o.res||100,matPeau({etire:[40,8,40],tache:.35,relief:1.4,freq:3,r:.95}),false,true,240000);mc.castShadow=true;corps.add(mc);const ex=new THREE.Group();corps.add(ex);
 const ft=texFeuille();const C=o.couleurs;const etat={root,corps};
 etat.poser=(an,t)=>{SEED=999;const k=Math.sin(t*Math.PI),s=Math.sin(t*Math.PI*2);let bras=[.2+s*.05,.2-s*.05],pench=s*.02;if(an==='atk'){bras=[.2+k*1.6,.2+k*1.3];pench=-k*.2;}if(an==='hit')pench=k*.15;if(an==='die')pench=-Math.min(1,t*1.1)*1.45;
  for(const m of [...ex.children]){ex.remove(m);m.geometry&&m.geometry.dispose();}
  const S=new Sculpt();const ec=C.ecorce,ef=C.fonce;
  // jambes-racines
  for(const z of [-1,1]){S.rc([0,0,z*.18],[.02,.45,z*.14],.13,.17,ef,.08);for(let i=0;i<3;i++){const a=i/2*2.2-1.1;S.rc([0,.08,z*.18],[Math.cos(a)*.3,-.02,z*.18+Math.sin(a)*.15*z],.07,.025,ef,.05);}}
  // tronc en torsade
  for(let i=0;i<6;i++){const y=.4+i*.25;const tw=Math.sin(i*1.3)*.04;S.rc([tw,y,0],[tw*.5,y+.27,0],.3-i*.02,.29-i*.02,i%2?ec:ef,.12);}
  // visage : arcade, nez, bouche creuse (assombrie)
  S.el([.26,1.35,0],[.06,.05,.2],ef,.04).el([.29,1.22,0],[.06,.08,.05],ec,.03).el([.24,1.05,0],[.04,.03,.12],0x1a1008,.02);
  // bras-branches
  const ep=[[.0,1.45,.32],[0,1.45,-.32]];bras.forEach((b,i)=>{const z=i?-1:1;const e=ep[i];const m1=add(e,[Math.sin(b)*.45,-Math.cos(b)*.45+.1,z*.15]);const m2=add(m1,[Math.sin(b+.4)*.4,-Math.cos(b+.4)*.35,z*.05]);
   S.rc(e,m1,.12,.08,ec,.07).rc(m1,m2,.08,.04,ec,.05);for(let j=0;j<3;j++){S.rc(m2,add(m2,[(rnd()-.3)*.2,(rnd()-.6)*.2,z*rnd()*.12]),.035,.01,ef,.02);}
   // feuillage au bout des bras
   feuilles(ex,m2,.22,420,C,ft);});
  peau(S,mc,o.res||100);
  feuilles(ex,[0,2.05,0],.55,2600,C,ft);feuilles(ex,[.1,1.75,.3],.35,900,C,ft);feuilles(ex,[-.1,1.8,-.3],.35,900,C,ft);
  for(const z of [-1,1]){const e=new THREE.Mesh(new THREE.SphereGeometry(.035,12,8),new THREE.MeshStandardMaterial({color:0xd8ff7a,emissive:0xb8f060,emissiveIntensity:1.6}));e.position.set(.3,1.3,z*.09);ex.add(e);}
  ex.traverse(x=>{if(x.isMesh)x.castShadow=true;});
  corps.rotation.set(0,0,pench);corps.position.set(0,0,0);corps.updateMatrixWorld(true);};
 return etat;}
function feuilles(par,c,R,n,C,tex){const g=new THREE.PlaneGeometry(.055,.075);const m=new THREE.MeshStandardMaterial({map:tex,alphaTest:.5,side:THREE.DoubleSide,roughness:.7,vertexColors:false});
 const im=new THREE.InstancedMesh(g,m,n);const M=new THREE.Matrix4(),Q=new THREE.Quaternion(),E=new THREE.Euler(),Sc=new THREE.Vector3(1,1,1),P=new THREE.Vector3(),cc=new THREE.Color();
 for(let i=0;i<n;i++){let x,y,z;do{x=rnd()*2-1;y=rnd()*2-1;z=rnd()*2-1;}while(x*x+y*y+z*z>1);const r=Math.cbrt(rnd())*.25+.75;P.set(c[0]+x*R*r,c[1]+y*R*.8*r,c[2]+z*R*r);E.set(rnd()*6,rnd()*6,rnd()*6);Q.setFromEuler(E);Sc.setScalar(.7+rnd()*.6);M.compose(P,Q,Sc);im.setMatrixAt(i,M);
  cc.set(C.feuilles[i%C.feuilles.length]).multiplyScalar(.75+rnd()*.4+(y>.3?.15:0));im.setColorAt(i,cc);}
 im.castShadow=true;par.add(im);}

// ---------- cavaliers (personnages Mixamo assis) ----------
function rig(root){const B={};root.traverse(o=>{if(o.isBone){const n=o.name.replace(/^mixamorig\d*:?/,'').replace(/^.*[:|]/,'');if(!B[n])B[n]=o;}});return B;}
const CH={LeftArm:'LeftForeArm',LeftForeArm:'LeftHand',RightArm:'RightForeArm',RightForeArm:'RightHand',LeftUpLeg:'LeftLeg',LeftLeg:'LeftFoot',RightUpLeg:'RightLeg',RightLeg:'RightFoot'};
const _a=new THREE.Vector3(),_b=new THREE.Vector3(),_q=new THREE.Quaternion(),_q2=new THREE.Quaternion();
function viser(B,n,dir){const b=B[n],c=B[CH[n]];if(!b||!c)return;b.updateMatrixWorld(true);b.getWorldPosition(_a);c.getWorldPosition(_b);const cur=_b.sub(_a).normalize();_q.setFromUnitVectors(cur,dir.clone().normalize());b.getWorldQuaternion(_q2);const nw=_q.multiply(_q2);const pq=new THREE.Quaternion();b.parent.getWorldQuaternion(pq);b.quaternion.copy(pq.invert().multiply(nw));b.updateMatrixWorld(true);}
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
function asseoir(R,bras){const B=rig(R.model);R.model.updateMatrixWorld(true);viser(B,'LeftUpLeg',V(.55,-.35,.75));viser(B,'LeftLeg',V(-.1,-1,.25));viser(B,'RightUpLeg',V(.55,-.35,-.75));viser(B,'RightLeg',V(-.1,-1,-.25));bras(B);return B;}
// selle, tapis de selle et bride (cuir)
function harnais(Q,coulTapis){const g=new THREE.Group();const cuir=new THREE.MeshStandardMaterial({color:0x3a2416,roughness:.55});const tissu=new THREE.MeshStandardMaterial({color:coulTapis,roughness:.85});
 const B=Q.P.corps.bar;const t=new THREE.Mesh(new THREE.CylinderGeometry(B[2]*1.05,B[2]*1.05,.42,24,1,true,Math.PI*.15,Math.PI*.7),tissu);t.rotation.set(0,0,Math.PI/2);t.rotation.y=Math.PI/2;t.position.set(.05,B[1]*.15,0);t.scale.set(1,1,1.15);g.add(t);
 const s=new THREE.Mesh(new THREE.SphereGeometry(.16,20,10,0,Math.PI*2,0,Math.PI/2),cuir);s.scale.set(1.25,.45,1);s.position.set(.05,B[1]*.98,0);g.add(s);
 const pom=new THREE.Mesh(new THREE.SphereGeometry(.04,10,8),cuir);pom.position.set(.2,B[1]*1.12,0);g.add(pom);g.traverse(x=>{if(x.isMesh){x.castShadow=x.receiveShadow=true;x.material.side=THREE.DoubleSide;}});return g;}

// ---------- fabriques ----------
const CHEV={g:G_CHEVAL,res:112,cabre:1,criniere:1};
function cheval(couleurs,extra={}){const o=Object.assign({},CHEV,{couleurs,peau:{etire:[110,26,110],tache:.18,relief:.25,freq:3}},extra);o.hauteur=hauteurPose(o.g);return o;}
function monte(o,perso,optsPerso,bras,tapis){return()=>{const Q=quadrupede(o);Q.poser('idle',0);
  if(tapis)Q.corps.add(harnais(Q,tapis));
  const R=makeChar(perso,Object.assign({set:'mx',kind:'mon'},optsPerso));R.mixer.stopAllAction();R.root.rotation.y=Math.PI/2;R.root.position.set(.08,Q.P.corps.bar[1]*1.0+(optsPerso.dy||0),0);Q.corps.add(R.root);
  const pose=k=>asseoir(R,B=>bras(B,k));
  return{root:Q.root,poser:(an,t)=>{Q.poser(an,t);pose(an==='atk'?Math.sin(t*Math.PI):0);}};};}
const BRAS_LANCE=(B,k)=>{viser(B,'RightArm',V(.6,-.5,-.3+k*.3));viser(B,'RightForeArm',V(1,.2-k*.3,0));viser(B,'LeftArm',V(.3,-.8,.4));viser(B,'LeftForeArm',V(.8,-.2,.3));};
function heros(couleurs,perso,opts,dy,tapis,loup){const make=monte(loup?(()=>{const o={g:Object.assign({},G_LOUP,{corps:{bar:[.62,.26,.23],poit:[.28,.3,.23],cul:[.28,.26,.22],ventre:[.5,.17,.2]},av:[.25,.25,.18,.07],ar:[.29,.3,.2,.07]}),res:100,couleurs,peau:{etire:[140,60,140],tache:.32,relief:.55,freq:6},dos:1,fourrure:1};o.couleurs.poils=[0x6a645e,0x3a3632,0x8a847c];o.hauteur=hauteurPose(o.g);return o;})():cheval(couleurs),
  perso,Object.assign({dy},opts),(B,k)=>{viser(B,'RightArm',V(.5,-.6,-.35));viser(B,'RightForeArm',V(.9,.1,-.1));viser(B,'LeftArm',V(.35,-.8,.4));viser(B,'LeftForeArm',V(.8,-.25,.3));},tapis);
 return()=>{const R=make();return{root:R.root,poser:(an,t)=>R.poser(an==='atk'?'marche':an,t)};};}
export const QDEFS={
 h_chevalier:{c:heros({robe:0xd8d0c0,fonce:0x8a8070,ventre:0xe8e2d6,crin:[0xe8e0d0,0xc8c0b0],nez:0x4a3e36,sabot:0x3a3026},'hx_aldric',{s:.78,gsat:.95,gdk:1.5,gamt:.06,recol:{h:.75,to:.6,w:.12,s:1.2}},-.52,0x2f4f88),u:3.0,fw:208,fh:192},
 h_clerc:{c:heros({robe:0x8a8a86,fonce:0x4a4844,ventre:0xa8a8a2,crin:[0xd8d8d4,0xa8a8a4],nez:0x2a2826,sabot:0x2a2622},'hx_ysolde',{s:.78,gsat:.7,gdk:.75,gamt:.2,recol:{h:.11,to:.6,w:.5,s:.5}},-.52,0x6a4a8a),u:3.0,fw:208,fh:192},
 h_rodeur:{c:heros({robe:0x8a5a32,fonce:0x4a2e18,ventre:0x9a6e44,crin:[0x2a1a10,0x3a2414],nez:0x201410,sabot:0x2a2018},'hx_maelle',{s:.8,gsat:.9,gdk:1.3,gamt:.08,recol:{h:.33,to:.3,w:.12,s:.9}},-.52,0x2f6a3a),u:3.0,fw:208,fh:192},
 h_druide:{c:heros({robe:0xb08a5a,fonce:0x6a4a2a,ventre:0xc8a878,crin:[0xe8d8b8,0xc8b090],nez:0x3a2a1a,sabot:0x3a3026},'hx_maelle',{s:.8,gsat:.9,gdk:1.3,gamt:.08,hue:.3},-.52,0x4a6a2a),u:3.0,fw:208,fh:192},
 h_chevmort:{c:heros({robe:0x1e1a1a,fonce:0x0e0c0c,ventre:0x2a2424,crin:[0x0a0808,0x1a1414],nez:0x101010,sabot:0x151010,oeil:0x801010},'hx_aldric',{s:.8,gsat:.3,gdk:.6,gamt:.3,gmet:.3,recol:{h:.75,to:.8,w:.2,s:1.1}},-.52,0x3a1010),u:3.0,fw:208,fh:192},
 h_necromancien:{c:heros({robe:0x3a3632,fonce:0x1a1816,ventre:0x4a4640,crin:[0x8a8a84,0x5a5a56],nez:0x101010,sabot:0x151010,oeil:0x30a060},'hx_ysolde',{s:.78,gsat:.5,gdk:.45,gamt:.3,recol:{h:.38,to:.55,w:.35,s:.45}},-.52,0x2a4a3a),u:3.0,fw:208,fh:192},
 h_barbare:{c:heros({robe:0x4a3424,fonce:0x24180e,ventre:0x6a4e38,crin:[0x1a120c,0x2a1e14],nez:0x181010,sabot:0x2a2018},'hx_brute',{s:.6,hue:.05,gsat:.6,gdk:1.1,gamt:.15,ghc:.2},-.48,0x6a2a14),u:3.0,fw:208,fh:192},
 h_chaman:{c:heros({robe:0x8a7a62,fonce:0x4a3e2e,ventre:0xa89a80,crin:[0x3a2e22,0x5a4a38],nez:0x201810,sabot:0x2a2018},'hx_brute',{s:.58,hue:.35,gsat:.55,gdk:1.1,gamt:.15,ghc:.2},-.48,0x5a3a14),u:3.0,fw:208,fh:192},

 cavalier:{c:monte(cheval({robe:0xd8d0c0,fonce:0x8a8070,ventre:0xe8e2d6,crin:[0xe8e0d0,0xc8c0b0,0xa89c88],nez:0x4a3e36,sabot:0x3a3026}),'hx_aldric',{s:.78,gsat:.9,gdk:1.45,gamt:.08,recol:{h:.75,to:.62,w:.14,s:1.1},wR:['staff'],wx:{staff:{p:[0,.1,.02],s:.62}},dy:-.52},BRAS_LANCE,0x2f4f88),u:3.0,fw:208,fh:192},
 chevnoir:{c:monte(cheval({robe:0x1e1a1a,fonce:0x0e0c0c,ventre:0x2a2424,crin:[0x0a0808,0x1a1414],nez:0x101010,sabot:0x151010,oeil:0x801010}),'hx_aldric',{s:.8,gsat:.25,gdk:.42,gamt:.35,gmet:.3,recol:{h:.75,to:.98,w:.2,s:1.2},dy:-.52},BRAS_LANCE,0x3a1010),u:3.0,fw:208,fh:192},
 pegase:{c:()=>{const Q=quadrupede(cheval({robe:0xeceef4,fonce:0xb8bcc8,ventre:0xf6f6fa,crin:[0xf0f4ff,0xd0dcf0,0xb8c8e8],nez:0x8a8088,sabot:0x8a8478},{ailes:1,ailesT:1.15,ailesRepos:.2,plumes:[0xf4f4f8,0xd8dce8],couv:[0xf8f8fc,0xe8eaf2]}));return{root:Q.root,poser:(an,t)=>Q.poser(an,t)};},u:3.3,fw:212,fh:208},
 licorne:{c:()=>{const Q=quadrupede(cheval({robe:0xf6f4f0,fonce:0xc8c4bc,ventre:0xfbfaf6,crin:[0xf8f0f8,0xe8d8f0,0xd8c0e8],nez:0xb09098,sabot:0xd8c8a0},{licorne:1}));return{root:Q.root,poser:(an,t)=>Q.poser(an,t)};},u:3.0,fw:200,fh:184},
 loup:{c:()=>{const o={g:G_LOUP,res:104,couleurs:{robe:0x3a3632,fonce:0x141210,ventre:0x6e665a,fraise:0x4a443c,nez:0x0a0808,oeil:0xc8901a},peau:{etire:[140,60,140],tache:.3,relief:.6,freq:6}};o.hauteur=hauteurPose(o.g);o.dos=1;o.fourrure=1;o.couleurs.poils=[0x3a3530,0x1e1b18,0x4e4840,0x121010];const Q=quadrupede(o);return{root:Q.root,poser:(an,t)=>Q.poser(an,t)};},u:2.0,fw:168,fh:140},
 griffon:{c:()=>{const o={g:G_GRIFFON,res:104,cabre:1,ailes:1,ailesT:1.1,ailesRepos:.35,plumes:[0x7a5430,0x3a2616],couv:[0x9a6e3e,0x7a5430],couleurs:{robe:0x9a6c3a,fonce:0x5a3c1e,ventre:0xc8b088,tete:0xece6d6,bec:0xd8a838,oeil:0xc88a10},peau:{etire:[90,90,90],tache:.25,relief:.4,freq:5}};
   o.hauteur=hauteurPose(o.g);const Q=quadrupede(o);return{root:Q.root,poser:(an,t)=>Q.poser(an,t)};},u:3.0,fw:200,fh:192},
 behemoth:{c:()=>{const o={g:G_BEHEMOTH,res:112,couleurs:{robe:0x3e3730,fonce:0x1a1612,ventre:0x5a4e40,nez:0x100c0a,oeil:0xc83a10,corne:0x5e5444,poils:[0x2a241e,0x1a1612,0x3a3228]},peau:{etire:[30,30,30],tache:.35,relief:1.3,freq:4,r:.75}};o.hauteur=hauteurPose(o.g);o.dos=1;o.fourrure=1;const Q=quadrupede(o);return{root:Q.root,poser:(an,t)=>Q.poser(an,t)};},u:3.2,fw:224,fh:192},
 roc:{c:()=>{const E=oiseau({hauteur:.75,ailesT:1.6,rapace:1,couleurs:{robe:0x24180e,poitrail:0x2c1e10,tete:0x1e150c,nuque:0x5a4020,bec:0x3a3632,cire:0xb8902a,patte:0xb08a2a,plumes:[0x3a2818,0x1a120a],couv:[0x4a3420,0x3a2818]}});return{root:E.root,poser:E.poser};},u:3.2,fw:224,fh:200},
 treant:{c:()=>{const E=treant({couleurs:{ecorce:0x6a5038,fonce:0x3e2e20,feuilles:[0x3a5a22,0x4a6a2a,0x5a7a30,0x2e4a1c]}});return{root:E.root,poser:E.poser};},u:3.0,fw:184,fh:208},
 centaure:{c:()=>{const o=cheval({robe:0x4e3220,fonce:0x22160c,ventre:0x5a3e2a,crin:[0x2a1a10,0x3a2414],nez:0x201410,sabot:0x2a2018});o.g=Object.assign({},o.g,{cou:Object.assign({},o.g.cou,{l:.05,r0:.12,r1:.1})});o.criniere=0;o.sansTete=1;o.g.queue='crins';
   const Q=quadrupede(o);Q.poser('idle',0);
   const R=makeChar('hx_maelle',{s:1.0,set:'mx',kind:'mon',gsat:1,gdk:1.2,gamt:.08,hue:.25});const B=rig(R.model);const replier=()=>{['LeftUpLeg','RightUpLeg'].forEach(n=>{if(B[n])B[n].scale.setScalar(.001);});};
   R.root.rotation.y=Math.PI/2;R.root.position.set(o.g.corps.bar[0]*.95,o.g.corps.bar[1]*.6-.98,0);Q.corps.add(R.root);
   return{root:Q.root,poser:(an,t)=>{Q.poser(an,t);const k={idle:'idle',atk:'bow',hit:'hit',die:'hit'}[an];R.mixer.stopAllAction();const a=R.act(k)||R.act('idle');a.reset();a.play();a.time=(an==='die'?.3:t)*a.getClip().duration;R.mixer.update(0);replier();}};},u:3.0,fw:200,fh:208},
 chevloup:{c:monte((()=>{const o={g:G_LOUP,res:104,couleurs:{robe:0x3e3934,fonce:0x161412,ventre:0x6a6256,fraise:0x4a443c,nez:0x0a0808,oeil:0xc89010},peau:{etire:[140,60,140],tache:.3,relief:.6,freq:6}};o.g=Object.assign({},G_LOUP,{corps:{bar:[.6,.23,.2],poit:[.28,.28,.21],cul:[.25,.23,.19],ventre:[.44,.13,.16]},av:[.27,.28,.19,.07],ar:[.3,.32,.22,.07]});o.hauteur=hauteurPose(o.g);o.dos=1;return o;})(),
   'hx_brute',{s:.44,hue:.35,gsat:.6,gdk:1.15,gamt:.18,ghc:.2,wR:['dagger'],wx:{dagger:{p:[0,.06,.02],s:.45}},dy:-.3},(B,k)=>{viser(B,'RightArm',V(.4+k*.4,-.4+k*.8,-.4));viser(B,'RightForeArm',V(.8,.3,0));viser(B,'LeftArm',V(.4,-.7,.4));viser(B,'LeftForeArm',V(.8,-.2,.3));},0x5a2a14),u:2.6,fw:184,fh:168},
};
