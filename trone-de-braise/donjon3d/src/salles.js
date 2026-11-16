/* ===== Le Trône de Braise — salles de combat sculptées par le code =====
   Une salle par type de donjon, construite à partir de formes simples (blocs, fûts, arcs, tubes) habillées des matières
   photographiées (Poly Haven, CC0) en projection triplanaire : rien n'est repris du décor de Valdragon.
   Repère : les combattants occupent x ∈ [-4,4], z ∈ [-4.5,3.5] ; la caméra regarde depuis +z vers le fond (z négatif). */
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

function atelier(C,sc){
 const {T,grime,bioTex,elTex,hr}=C;
 const TAU=Math.PI*2,R=(i,k)=>hr(i,k,77);
 const base=T.base,TF=bioTex(base,'f'),TW=bioTex(base,'w');
 const woodD=elTex('wood_d'),woodN=elTex('wood_n');[woodD,woodN].forEach(t=>{if(t){t.wrapS=t.wrapT=THREE.RepeatWrapping;}});
 // matières
 const std=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.88,metalness:0},o));
 const pierre=(c=0x8a8478,s=.42)=>TW?grime(std(c),{sc:1.3,amt:.3,sat:.85,dk:1,base:.6,rough:.2,tex:{d:TW.d,n:TW.n,s,b:1.5,wall:1}}):std(c);
 const dalle=(c=0x8a8478,s=.2)=>TF?grime(std(c),{sc:1.1,amt:.28,sat:.9,dk:1,rough:.2,tex:{d:TF.d,n:TF.n,s,b:1.5}}):std(c);
 const bois=(c=0x8a6a48)=>woodD?grime(std(c,{roughness:.8}),{sc:1.2,amt:.25,sat:.9,dk:1,rough:.2,tex:{d:woodD,n:woodN,s:.9,b:1.3,wall:1}}):std(c);
 const metal=(c=0x4a4440)=>std(c,{metalness:.75,roughness:.42});
 const LU=new Map(),lueur=(c,i=1.2)=>{const k=c+'|'+i;if(!LU.has(k))LU.set(k,new THREE.MeshStandardMaterial({color:0x111111,emissive:new THREE.Color(c),emissiveIntensity:i,roughness:.6}));return LU.get(k);};
 // accumulateur de géométries par matière (une seule passe de dessin par matière)
 const lots=new Map();const put=(m,g,x=0,y=0,z=0,ry=0,rx=0,rz=0,sx=1,sy=1,sz=1)=>{g=g.toNonIndexed?g:g;const mm=new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new THREE.Vector3(sx,sy,sz));const gg=g.clone().applyMatrix4(mm);if(gg.index)gg.toNonIndexed&&0;(lots.get(m)||lots.set(m,[]).get(m)).push(gg);};
 const fin=()=>{for(const[m,arr]of lots){const ok=arr.map(g=>g.index?g.toNonIndexed():g);ok.forEach(g=>{['uv2','uv1'].forEach(a=>g.deleteAttribute&&g.getAttribute(a)&&g.deleteAttribute(a));});const g=mergeGeometries(ok,false);if(!g)continue;const me=new THREE.Mesh(g,m);me.receiveShadow=true;me.castShadow=false;sc.add(me);}lots.clear();};
 return {TAU,R,base,std,pierre,dalle,bois,metal,lueur,put,fin,box,cyl,sph,cone};
}

 const box=(w,h,d)=>new THREE.BoxGeometry(w,h,d),cyl=(r1,r2,h,n=10)=>new THREE.CylinderGeometry(r1,r2,h,n),sph=(r,n=10)=>new THREE.SphereGeometry(r,n,Math.max(6,n*.7|0)),cone=(r,h,n=8)=>new THREE.ConeGeometry(r,h,n);
export function construireSalle(C){
 const {sc,T,TH,type,elTex,glowTex,banniere,MAISON0,VIEILLE,hr,lair,BT}=C;
 const {TAU,R,base,std,pierre,dalle,bois,metal,lueur,put,fin,box,cyl,sph,cone}=atelier(C,sc);
 // brasero du Trône : trépied de fer, coupe, braises incandescentes, flamme
 const FT=elTex('flame')||glowTex();
 const brasero=(x,z,h=1.15,i=0,lum=true)=>{const fer=metal(0x2e2a28);for(let k=0;k<3;k++){const a=k/3*TAU;put(fer,cyl(.03,.03,h+.1,6),x+Math.cos(a)*.18,h/2,z+Math.sin(a)*.18,0,Math.sin(a)*.18,-Math.cos(a)*.18);}
  put(fer,cyl(.36,.16,.22,14),x,h,z);put(lueur(0xff5a1a,1.6),sph(.27,10),x,h+.05,z,0,0,0,1,.35,1);
  const f=new THREE.Sprite(new THREE.SpriteMaterial({map:FT,color:new THREE.Color(T.light).lerp(new THREE.Color(0xffc080),.4),blending:THREE.AdditiveBlending,depthWrite:false}));f.scale.set(.8,1.1,1);f.position.set(x,h+.5,z);sc.add(f);
  const hs=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(),color:T.light,blending:THREE.AdditiveBlending,depthWrite:false,opacity:.45}));hs.scale.setScalar(2.2);hs.position.set(x,h+.4,z);sc.add(hs);
  let l=null;if(lum){l=new THREE.PointLight(T.light,12,12,2);l.position.set(x,h+.8,z);sc.add(l);}BT.lights.push({l,f,x,z});};
 // sol commun : une grande dalle habillée de la matière du donjon
 const sol=(m,w=30,d=26)=>{const g=new THREE.PlaneGeometry(w,d,1,1);g.rotateX(-Math.PI/2);const me=new THREE.Mesh(g,m);me.position.set(0,0,-2);me.receiveShadow=true;sc.add(me);return me;};
 // mur de pierres appareillées (blocs décalés, légèrement irréguliers)
 const mur=(m,x0,x1,z,h=5,ep=.6,rot=0)=>{const L=x1-x0,nr=Math.ceil(h/.55);for(let r=0;r<nr;r++){let x=x0-(r%2?.45:0);while(x<x1){const w=.75+R(r*31+(x*7|0),3)*.6,ww=Math.min(w,x1-x);if(ww>.15){const cx=x+ww/2,cy=r*.55+.275,dz=(R(r,x*13|0)-.5)*.08;if(rot)put(m,box(ep,.52,ww-.04),z+dz,cy,cx);else put(m,box(ww-.04,.52,ep),cx,cy,z+dz);}x+=w;}}};
 const arche=(m,x,z,r=1.6,ep=.5,prof=.7)=>{const g=new THREE.TorusGeometry(r,ep/2,8,18,Math.PI);put(m,g,x,0,z,0,0,0,1,1,prof/ep);};
 const banM=TH.maison||MAISON0,banA=TH.adverse||VIEILLE;
 const bannieres=(z,y,xs)=>xs.forEach((x,i)=>{const b=banniere(x<0?banM:banA,1.6);b.position.set(x,y,z+.36);sc.add(b);});
 const lune=new THREE.DirectionalLight(C.LAPIS,.7);lune.position.set(-5,9,-8);sc.add(lune);

 switch(type){
 case'crypte':case'catacombes':{// nef funéraire : dalles, piliers, sarcophages, niches à ossements
  sol(dalle(0x9a948a));const p=pierre(0x8c867c);mur(p,-11,11,-9.2,5.5);mur(p,-9.2,3,-9.4,4.5,.6,1);mur(p,-9.2,3,9.4,4.5,.6,1);
  for(const x of[-6.5,-2.2,2.2,6.5]){put(p,box(.9,.35,.9),x,.17,-8.2);put(p,cyl(.34,.38,4.6,12),x,2.65,-8.2);put(p,box(1,.3,1),x,5.05,-8.2);}
  for(const z of[-6,-2.5]){for(const s of[-1,1]){put(p,cyl(.3,.34,4.2,12),s*7.6,2.1,z);put(p,box(.8,.3,.8),s*7.6,.15,z);}}
  const sarc=(x,z,ry)=>{put(p,box(1.05,.62,2.1),x,.31,z,ry);put(p,box(1.18,.16,2.24),x,.7,z,ry);put(p,box(.5,.12,1.1),x,.84,z,ry);};
  [[-6.2,-4.4,.15],[6.4,-4.8,-.12],[-6.6,.2,.08],[6.8,-.6,-.2]].forEach(([x,z,r])=>sarc(x,z,r));
  if(type==='catacombes'){// ossuaire : rangées de crânes encastrées dans le mur du fond
   const os=std(0xd8ccb0,{roughness:.7});for(let r=0;r<5;r++)for(let i=0;i<34;i++){const x=-10.4+i*.62+(r%2)*.31;if(Math.abs(x)<1.6&&r<4)continue;put(os,sph(.2,8),x,1.2+r*.42,-8.85,0,0,0,1,.9,.8);}
   for(let i=0;i<14;i++){const x=(R(i,1)-.5)*16,z=-7+R(i,2)*3;if(Math.abs(x)<4.5)continue;put(os,sph(.13,7),x,.12,z);put(os,cyl(.03,.03,.5,5),x+.2,.04,z+.1,R(i,3)*3,0,Math.PI/2);}}
  arche(p,0,-9.15,1.5,.6,.9);put(std(0x050403),box(3,3,.2),0,1.5,-9.35);
  bannieres(-9.2,3.6,[-4.4,4.4]);
  for(let i=0;i<9;i++){const x=(R(i,5)-.5)*14,z=-7.5+R(i,6)*2;if(Math.abs(x)<4)continue;const c=lueur(0xffc070,.9);put(std(0xe8e0c8),cyl(.035,.04,.2+R(i,7)*.2,6),x,.12,z);put(c,sph(.025,6),x,.3+R(i,7)*.2,z);}
  brasero(-4.6,-6.6,1.15,0);brasero(4.6,-6.6,1.15,1);brasero(-7.4,1.6,1.15,2,false);brasero(7.4,1.6,1.15,3,false);break;}
 case'mine':{// galerie boisée : cadres de soutènement, rails, wagonnet, filons
  sol(dalle(0x8a7a66,.16));const r=pierre(0x7a6a5a,.36),b=bois(0x8a6644),fer=metal(0x3a3430);
  for(let i=0;i<18;i++){const a=Math.PI*1.05+i/17*Math.PI*.9,rr=9.6+R(i,1)*1.2;put(r,new THREE.DodecahedronGeometry(1.6+R(i,2)*1.4,0),Math.cos(a)*rr,1.2+R(i,3)*2,Math.sin(a)*rr-2,R(i,4)*3,R(i,5)*3,0,1,1.4+R(i,6),1);}
  for(const z of[-7.5,-3.8]){for(const s of[-1,1])put(b,box(.34,4.2,.34),s*5.6,2.1,z,0,0,s*.04);put(b,box(12,.38,.42),0,4.2,z);put(b,box(.3,.3,1.8),-4,4.05,z+.9,0,.4,0);}
  for(const s of[-1,1])put(fer,box(.08,.08,18),s*.55-6.6,.06,-2,0);for(let i=0;i<16;i++)put(b,box(1.6,.1,.24),-6.6,.03,-10+i*1.1);
  {const x=-6.6,z=-5.2;put(b,box(1.3,.8,1.7),x,.75,z);put(fer,box(1.38,.08,1.78),x,1.15,z);for(const sx of[-1,1])for(const sz of[-1,1])put(fer,cyl(.2,.2,.1,12),x+sx*.6,.22,z+sz*.55,0,0,Math.PI/2);put(r,new THREE.DodecahedronGeometry(.45,0),x,1.25,z);put(r,new THREE.DodecahedronGeometry(.35,0),x+.3,1.3,z+.4);}
  const filon=lueur(0x6ab8ff,1.4);for(let i=0;i<10;i++){const a=Math.PI*1.1+R(i,9)*Math.PI*.8,rr=8.6;put(filon,new THREE.OctahedronGeometry(.16+R(i,8)*.12,0),Math.cos(a)*rr,.5+R(i,7)*2.6,Math.sin(a)*rr-2,R(i,6)*3,0,0,1,1.8,1);}
  for(let i=0;i<6;i++){const x=(R(i,11)-.5)*15,z=-6+R(i,12)*5;if(Math.abs(x)<4.5)continue;put(b,box(.9,.6,.6),x,.3,z,R(i,13));}
  for(const x of[-3.2,3.2]){const lan=new THREE.Group();const g=new THREE.Mesh(sph(.12,8),lueur(0xffc070,2));lan.add(g);lan.position.set(x,3.7,-3.8);sc.add(lan);}
  brasero(-4.4,-6.2,1.0,0);brasero(4.6,-6.4,1.0,1);bannieres(-8.9,3.2,[-2.8,2.8]);break;}
 case'foret':case'marais':{// sous-bois maudit ou marais noyé : arbres tordus, racines, champignons ou eaux noires et roseaux
  const marais=type==='marais';sol(dalle(marais?0x5e6658:0x6a6450,.17));const ec=bois(marais?0x4a4a40:0x4a3e30);
  const arbre=(x,z,h,s)=>{const pts=[];let px=x,pz=z;for(let k=0;k<=6;k++){pts.push(new THREE.Vector3(px,k/6*h,pz));px+=(R(s,k)-.5)*.9;pz+=(R(s,k+9)-.5)*.9;}
   put(ec,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),24,.32+R(s,2)*.2,8,false));
   for(let k=0;k<4;k++){const a=R(s,20+k)*TAU,y0=h*(.45+k*.12),p0=pts[Math.min(6,2+k)];const q=[p0.clone(),p0.clone().add(new THREE.Vector3(Math.cos(a)*1.2,1+R(s,30+k),Math.sin(a)*1.2)),p0.clone().add(new THREE.Vector3(Math.cos(a)*2.4,1.4+R(s,40+k)*1.6,Math.sin(a)*2.4))];put(ec,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(q),10,.1,6,false));}
   for(let k=0;k<5;k++){const a=k/5*TAU+R(s,50),q=[new THREE.Vector3(x,.5,z),new THREE.Vector3(x+Math.cos(a)*.9,.35,z+Math.sin(a)*.9),new THREE.Vector3(x+Math.cos(a)*1.8,-.05,z+Math.sin(a)*1.8)];put(ec,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(q),8,.12,6,false));}};
  [[-8,-7,7],[-4.5,-9,8],[3.6,-9.4,8.5],[7.8,-6.6,7],[-9.4,-1.6,6],[9.6,-2.2,6.5],[0,-11.5,9],[-6.6,-10.6,7]].forEach(([x,z,h],i)=>arbre(x,z,h,i+1));
  if(marais){const eau=new THREE.Mesh(new THREE.PlaneGeometry(30,9),new THREE.MeshStandardMaterial({color:0x0c1814,roughness:.08,metalness:.6,transparent:true,opacity:.9}));eau.rotation.x=-Math.PI/2;eau.position.set(0,.04,-9.5);sc.add(eau);
   const ros=std(0x6a7448,{roughness:.9});for(let i=0;i<60;i++){const x=(R(i,60)-.5)*22,z=-5.5-R(i,61)*4;if(Math.abs(x)<3&&z>-6)continue;put(ros,cyl(.012,.02,.8+R(i,62)*.9,4),x,.5,z,0,(R(i,63)-.5)*.3,(R(i,64)-.5)*.3);}}
  const ch=lueur(marais?0x9fffd0:0xb8ff7a,.7),pied=std(0xc8c0a8);for(let i=0;i<22;i++){const x=(R(i,70)-.5)*17,z=-8+R(i,71)*9;if(Math.abs(x)<4.6&&z>-5.5)continue;const s=.5+R(i,72)*.9;put(pied,cyl(.04*s,.06*s,.3*s,6),x,.15*s,z);put(ch,sph(.16*s,10),x,.3*s,z,0,0,0,1,.45,1);}
  for(const x of[-5,5]){const pl=bois(0x5a4a38);put(pl,cyl(.06,.07,2.6,6),x,1.3,-6.6);const lan=new THREE.Mesh(sph(.13,8),lueur(T.light,2));lan.position.set(x,2.65,-6.6);sc.add(lan);BT.lights.push({l:null,f:lan,x,z:-6.6});}
  {const l=new THREE.PointLight(T.light,10,12,2);l.position.set(0,2.6,-6);sc.add(l);}
  brasero(-6.4,-3.4,.9,0,false);brasero(6.4,-3.6,.9,1);
  {const st=banniere(banM,1.2,true);st.position.set(-3.4,2.4,-6.9);st.rotation.y=.3;sc.add(st);}break;}
 case'glace':{// faille gelée : parois de glace, aiguilles, stalactites, neige
  sol(dalle(0xc8d4e0,.19));const gl=new THREE.MeshStandardMaterial({color:0x9ec8e8,roughness:.15,metalness:.1,transparent:true,opacity:.82,emissive:new THREE.Color(0x1a3a5a),emissiveIntensity:.5});const r=pierre(0x8a9aae,.3);
  for(let i=0;i<26;i++){const a=Math.PI*1.02+i/25*Math.PI*.96,rr=9+R(i,1)*1.6,h=2.5+R(i,2)*5;put(i%3?gl:r,cone(.6+R(i,3)*.8,h,6),Math.cos(a)*rr,h/2,Math.sin(a)*rr-2,R(i,4)*3,(R(i,5)-.5)*.2,(R(i,6)-.5)*.2);}
  for(let i=0;i<30;i++){const x=(R(i,7)-.5)*18,z=-9+R(i,8)*4;put(gl,cone(.12+R(i,9)*.12,.8+R(i,10)*1.4,5),x,6.2,z,0,Math.PI,0);}
  for(let i=0;i<12;i++){const x=(R(i,11)-.5)*15,z=-7+R(i,12)*7;if(Math.abs(x)<4.6)continue;put(gl,cone(.3,1.2+R(i,13),5),x,.6,z,R(i,14)*3,(R(i,15)-.5)*.4);}
  put(r,box(22,7,1.2),0,3.5,-11.4);brasero(-4.4,-6.4,1.1,0);brasero(4.4,-6.4,1.1,1);bannieres(-10.7,3.6,[-3.4,3.4]);break;}
 case'egouts':{// égouts anciens : canal central, voûtes de briques, tuyaux, grilles
  sol(dalle(0x7a7a70,.2));const p=pierre(0x7a706a,.4),fer=metal(0x3a3a34);
  const eau=new THREE.Mesh(new THREE.PlaneGeometry(30,2.2),new THREE.MeshStandardMaterial({color:0x14201a,roughness:.06,metalness:.55,emissive:new THREE.Color(0x061208),emissiveIntensity:.6}));eau.rotation.x=-Math.PI/2;eau.position.set(0,.02,-7.2);sc.add(eau);put(p,box(30,.22,.3),0,.11,-6.0);put(p,box(30,.22,.3),0,.11,-8.4);put(p,box(2.2,.3,2.8),0,.15,-7.2);
  mur(p,-11,11,-9.2,5.4);for(const x of[-6.2,-1.6,3,7.4])arche(p,x,-8.8,1.9,.55,1.1);
  for(const z of[-6.4,-2.6,1.2]){put(p,box(.7,4.6,.7),9.2,2.3,z);put(p,box(.7,4.6,.7),-10,2.3,z);}
  for(let k=0;k<3;k++)put(fer,cyl(.22,.22,22,12),0,4.4-k*.6,-8.4+k*.2,0,0,Math.PI/2);for(let i=0;i<9;i++)put(fer,box(.07,.07,2.2),-1+i*.25,.24,-7.2);
  {const m=std(0x2a3a1e,{roughness:.3,metalness:.2});for(let i=0;i<9;i++){const x=(R(i,2)-.5)*18;if(Math.abs(x)<4)continue;put(m,sph(.3+R(i,1)*.3,8),x,.02,-4+R(i,3)*3,0,0,0,1,.05,1);}}
  brasero(-3.8,-6.6,1.05,0);brasero(5,-6.4,1.05,1);bannieres(-8.85,3.8,[-4,1.6]);break;}
 case'antre':{// antre : roche volcanique, crevasses de lave, ossements géants, trésor
  sol(dalle(0x6a4a3e,.16));const r=pierre(0x5a4038,.32),os=std(0x9a8e78,{roughness:.75});const lave=lueur(0xff5a10,2.2);
  for(let i=0;i<22;i++){const a=Math.PI*1.02+i/21*Math.PI*.96,rr=9.4+R(i,1)*1.6,h=3+R(i,2)*6;put(r,cone(1+R(i,3)*1.2,h,7),Math.cos(a)*rr,h/2-.2,Math.sin(a)*rr-2,R(i,4)*3);}
  for(let i=0;i<9;i++){const x=(R(i,5)-.5)*18,z=-8+R(i,6)*8;if(Math.abs(x)<3.8&&z>-5)continue;put(lave,box(.18,.02,1.6+R(i,7)*2),x,.012,z,R(i,8)*3);}
  {const cx=6.2,cz=-6.4;put(os,sph(.9,12),cx,.7,cz,0,0,0,1.2,.9,1.4);for(let k=0;k<7;k++){const q=[new THREE.Vector3(cx-1-k*.9,.1,cz+.6),new THREE.Vector3(cx-1.4-k*.9,1.1,cz+.2),new THREE.Vector3(cx-1-k*.9,.1,cz-.4)];put(os,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(q),10,.07,6,false));}}
  if(lair){const or=std(0xd8a838,{metalness:.9,roughness:.3});for(let i=0;i<70;i++){const x=(R(i,30)-.5)*12,z=-7.5+R(i,31)*2.2;put(or,cyl(.07,.07,.02,8),x,.02+R(i,32)*.15,z,R(i,33),R(i,34)*.4);}}
  brasero(-4.4,-6.4,1.15,0);brasero(4.4,-6.6,1.15,1);{const st=banniere(banA,1.3,true);st.position.set(-6.4,2.6,-7.4);sc.add(st);}break;}
 default:{// champ de bataille : plein air de nuit, palissade, tentes aux couleurs des deux camps, feu de camp
  sol(dalle(0x6a6450,.15));sc.background=new THREE.Color(0x0b1220);sc.fog=new THREE.FogExp2(0x0b1220,.045);const b=bois(0x7a6044);
  const ciel=new THREE.Mesh(new THREE.SphereGeometry(60,24,12,0,TAU,0,Math.PI/2),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{},vertexShader:'varying vec3 v;void main(){v=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:'varying vec3 v;float h(vec3 p){return fract(sin(dot(p,vec3(12.9,78.2,37.7)))*43758.5);}void main(){float y=max(v.y,0.);vec3 c=mix(vec3(.10,.14,.24),vec3(.02,.03,.07),pow(y,.6));c+=vec3(.5,.22,.08)*pow(1.-y,8.)*.35;vec3 q=floor(v*260.);float s=step(.996,h(q))*smoothstep(.1,.5,y);gl_FragColor=vec4(c+s*.8,1.);}'}));sc.add(ciel);
  for(let i=0;i<46;i++){const x=-13+i*.58,z=-9.6+Math.sin(i*.7)*.25;const h=2.2+R(i,1)*.6;put(b,cyl(.13,.15,h,7),x,h/2,z);put(b,cone(.15,.35,7),x,h+.17,z);}
  put(b,box(27,.18,.12),0,1.4,-9.4);put(b,box(27,.18,.12),0,.6,-9.4);
  const tente=(x,z,m,s=1)=>{const toile=std(new THREE.Color(m.c1).multiplyScalar(.8),{roughness:.95,side:THREE.DoubleSide});put(toile,cone(1.7*s,2.6*s,10),x,1.3*s,z);put(b,cyl(.05,.05,3.4*s,6),x,1.7*s,z);const f=banniere(m,.5);f.position.set(x+.3,3.3*s,z);sc.add(f);};
  tente(-7.6,-6.2,banM);tente(-9.2,-2.4,banM,.85);tente(7.4,-6.6,banA);tente(9.4,-2.8,banA,.85);
  for(let i=0;i<5;i++){const x=(i-2)*2.6,z=-7.6;put(b,box(1.8,.12,.12),x,.7,z,.0,0,.6);put(b,box(1.8,.12,.12),x,.7,z,0,0,-.6);}
  brasero(-4.6,-5.8,.35,0);brasero(4.6,-6,.35,1);
  {const st=banniere(banM,1.3,true);st.position.set(-3.2,2.7,-7.2);sc.add(st);const st2=banniere(banA,1.3,true);st2.position.set(3.2,2.7,-7.2);st2.rotation.y=Math.PI;sc.add(st2);}}
 }
 fin();
}

/* ===== décor des salles en exploration : mêmes formes, à l'échelle du donjon (case = 1, héros ≈ 0,7) =====
   Un groupe fusionné par salle (révélé quand la salle est vue), posé le long des murs pour ne pas encombrer le passage. */
export function decorExplo(C){
 const {VD,type,hr,addP}=C;const out=[];
 VD.rooms.forEach((r,ri)=>{if(ri===0||r===VD.stairs.room)return;const g=new THREE.Group();const A=atelier(C,g);const {TAU,R,std,pierre,bois,metal,lueur,put,box,cyl,sph,cone}=A;
  // cases contre un mur, à l'intérieur de la salle
  const bord=[];for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++){if(VD.map[y*VD.W+x]!==1)continue;const d=[[0,-1],[0,1],[-1,0],[1,0]].filter(([dx,dy])=>VD.map[(y+dy)*VD.W+x+dx]===0);if(d.length)bord.push([x,y,d[0]]);}
  if(!bord.length)return;const n=Math.min(bord.length,2+((r.w*r.h)>30?2:1));let posees=0;
  for(let k=0;k<n*3&&posees<n;k++){const [x,y,[dx,dy]]=bord[(R(ri*7+k,1)*bord.length)|0];if(Math.abs(VD.stairs.x-x)+Math.abs(VD.stairs.y-y)<2)continue;if((VD.obj||[]).some(o=>Math.abs(o.x-x-.5)+Math.abs(o.y-y-.5)<1.2))continue;
   const cx=x+.5+dx*.22,cz=y+.5+dy*.22,ry=Math.atan2(dx,dy),s=R(ri+k,9);posees++;
   switch(type){
    case'crypte':{const p=pierre(0x8c867c);put(p,box(.42,.26,.86),cx,.13,cz,ry+Math.PI/2*(dx?0:1));put(p,box(.48,.07,.92),cx,.29,cz,ry+Math.PI/2*(dx?0:1));for(let c=0;c<3;c++){put(std(0xe8e0c8),cyl(.018,.02,.1+c*.04,6),cx+(c-1)*.12,.35+c*.02,cz);put(lueur(0xffc070,1.2),sph(.014,5),cx+(c-1)*.12,.42+c*.04,cz);}break;}
    case'catacombes':{const os=std(0xcfc3a6,{roughness:.75});for(let c=0;c<7;c++)put(os,sph(.07,7),cx+(R(c,ri)-.5)*.4,.05+(c%3)*.06,cz+(R(c,ri+1)-.5)*.4);for(let c=0;c<5;c++)put(os,cyl(.015,.015,.32,5),cx+(R(c,ri+3)-.5)*.4,.03,cz+(R(c,ri+4)-.5)*.4,R(c,ri+5)*3,0,Math.PI/2);break;}
    case'mine':{const b=bois(0x8a6644);if(s<.5){put(b,box(.1,1.25,.1),cx-.35*(dy?1:0),.62,cz-.35*(dx?1:0));put(b,box(.1,1.25,.1),cx+.35*(dy?1:0),.62,cz+.35*(dx?1:0));put(b,box(dy?.9:.12,.12,dx?.9:.12),cx,1.28,cz);}else{put(b,box(.38,.3,.3),cx,.15,cz,ry);put(lueur(0x6ab8ff,1.4),new THREE.OctahedronGeometry(.06,0),cx+.2,.12,cz,0,0,0,1,1.8,1);}break;}
    case'foret':{const e=bois(0x4a3e30);const pts=[];let px=cx,pz=cz;for(let q=0;q<=4;q++){pts.push(new THREE.Vector3(px,q/4*1.9,pz));px+=(R(ri,q+k)-.5)*.3;pz+=(R(ri,q+k+9)-.5)*.3;}put(e,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),12,.09,6,false));
     for(let q=0;q<3;q++){const a=R(q,ri+k)*TAU,p0=pts[2+q%2];put(e,new THREE.TubeGeometry(new THREE.CatmullRomCurve3([p0.clone(),p0.clone().add(new THREE.Vector3(Math.cos(a)*.4,.35,Math.sin(a)*.4)),p0.clone().add(new THREE.Vector3(Math.cos(a)*.8,.5,Math.sin(a)*.8))]),6,.03,5,false));}
     for(let q=0;q<3;q++){const mx=cx+(R(q,ri+20)-.5)*.6,mz=cz+(R(q,ri+21)-.5)*.6;put(std(0xc8c0a8),cyl(.015,.02,.1,5),mx,.05,mz);put(lueur(0xb8ff7a,.7),sph(.05,8),mx,.1,mz,0,0,0,1,.45,1);}break;}
    case'marais':{const ros=std(0x6a7448,{roughness:.9});for(let q=0;q<10;q++)put(ros,cyl(.006,.01,.35+R(q,ri+k)*.35,4),cx+(R(q,ri+30)-.5)*.4,.25,cz+(R(q,ri+31)-.5)*.4,0,(R(q,ri+32)-.5)*.3,(R(q,ri+33)-.5)*.3);
     put(std(0x0c1814,{roughness:.06,metalness:.6}),cyl(.42,.42,.01,18),cx-dx*.1,.008,cz-dy*.1);break;}
    case'glace':{const gl=new THREE.MeshStandardMaterial({color:0x9ec8e8,roughness:.15,metalness:.1,transparent:true,opacity:.85,emissive:new THREE.Color(0x1a3a5a),emissiveIntensity:.5});for(let q=0;q<3;q++)put(gl,cone(.08+R(q,ri)*.06,.4+R(q,ri+k)*.6,5),cx+(q-1)*.14,.25,cz+(R(q,ri+5)-.5)*.2,R(q,ri+6)*3,(R(q,ri+7)-.5)*.3);break;}
    case'egouts':{const fer=metal(0x3a3a34);put(fer,cyl(.07,.07,.9,10),cx,.55,cz,ry,0,Math.PI/2);put(std(0x2a3a1e,{roughness:.3,metalness:.2}),sph(.25,8),cx-dx*.15,.01,cz-dy*.15,0,0,0,1,.05,1);break;}
    case'antre':{put(lueur(0xff5a10,2.2),box(.06,.01,.7),cx-dx*.25,.01,cz-dy*.25,R(ri,k)*3);put(pierre(0x5a4038,.32),cone(.2,.6+s*.5,6),cx,.3,cz,s*3);break;}
   }}
  if(!posees)return;A.fin();g.visible=false;addP(g,r.cx,r.cy);out.push(g);});
 return out;
}
