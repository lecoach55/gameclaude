// ===== Valdragon 3D · effets d'ambiance (étalonnage, brouillard au sol, fumée, rayons, ombres de contact) =====
import * as THREE from 'three';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';

/* ---------- textures embarquées (data URI) ---------- */
const ET={};export function elTex(id,srgb=false){if(ET[id]!==undefined)return ET[id];const el=document.getElementById('vdtx-'+id);if(!el){ET[id]=null;return null;}
 const t=new THREE.Texture();const im=new Image();im.onload=()=>{t.image=im;t.needsUpdate=true;};im.src='data:image/png;base64,'+el.textContent.trim();if(srgb)t.colorSpace=THREE.SRGBColorSpace;t.userData.keep=1;ET[id]=t;return t;}
/* ---------- étalonnage + vignette + grain ---------- */
export const GRADE={tier:[{tint:[1.0,.97,1.0],sat:.92,con:1.08,vig:.6},{tint:[.95,1.02,.98],sat:.9,con:1.08,vig:.64},{tint:[1.06,.97,.9],sat:.95,con:1.1,vig:.58},{tint:[.92,.98,1.06],sat:.86,con:1.08,vig:.64}]};
export function gradePass(){return new ShaderPass({uniforms:{toneMappingExposure:{value:1.3},tDiffuse:{value:null},tint:{value:new THREE.Vector3(1,1,1)},sat:{value:1},con:{value:1},vig:{value:.5},t:{value:0},flash:{value:0},asp:{value:1}},
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`uniform sampler2D tDiffuse;uniform vec3 tint;uniform float sat,con,vig,t,flash,asp;varying vec2 vUv;
 float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
 void main(){vec4 c=texture2D(tDiffuse,vUv);c.rgb=sRGBTransferOETF(vec4(ACESFilmicToneMapping(c.rgb),1.)).rgb;vec3 col=c.rgb*tint;float l=dot(col,vec3(.299,.587,.114));col=mix(vec3(l),col,sat);
  // courbe en S douce + virage partiel : ombres froides, hautes lumières chaudes
  vec3 sc=col*col*(3.-2.*col);col=mix(col,clamp(sc,0.,1.),clamp((con-1.)*4.,0.,1.));
  float L2=dot(col,vec3(.299,.587,.114));col+=vec3(-.012,.0,.022)*(1.-smoothstep(.0,.35,L2))+vec3(.03,.012,-.02)*smoothstep(.45,.95,L2);
  col=max(col-.006,0.)*1.01;
  vec2 d=(vUv-.5)*vec2(asp,1.);float v=smoothstep(.95,.25,length(d)*1.05);col*=mix(1.-vig,1.,v);
  col+=(h(vUv*vec2(913.,577.)+t)-.5)*.025;col=mix(col,vec3(1.,.95,.85),flash);gl_FragColor=vec4(max(col,0.),c.a);}`});}

/* ---------- brouillard au sol ---------- */
export function groundFog(size,color,op=.32){const m=new THREE.ShaderMaterial({uniforms:{t:{value:0},col:{value:new THREE.Color(color)},op:{value:op},ctr:{value:new THREE.Vector2()}},transparent:true,depthWrite:false,
 vertexShader:'varying vec2 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xz;gl_Position=projectionMatrix*viewMatrix*w;}',
 fragmentShader:`uniform float t,op;uniform vec3 col;uniform vec2 ctr;varying vec2 vW;
 float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
 float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*n(p);p*=2.03;a*=.5;}return s;}
 void main(){vec2 p=vW*.32;float f=fbm(p+vec2(t*.05,t*.03))*.65+fbm(p*1.7-vec2(t*.04,-t*.02))*.45;f=smoothstep(.35,.95,f);
  float edge=1.-smoothstep(.55,1.,length(vW-ctr)/${(size/2).toFixed(1)});gl_FragColor=vec4(col,f*op*edge);}`});
 // un seul grand triangle (pas d'arête interne : évite le trait lumineux sur la diagonale)
 const h2=size/2,g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([-h2,0,h2, 3*h2,0,h2, -h2,0,-3*h2],3));g.setAttribute('normal',new THREE.Float32BufferAttribute([0,1,0,0,1,0,0,1,0],3));const o=new THREE.Mesh(g,m);o.position.y=.12;o.renderOrder=5;o.frustumCulled=false;return o;}

/* ---------- rayons de lumière volumétriques (cônes additifs) ---------- */
let rayTex=null;function rtex(){if(rayTex)return rayTex;const c=document.createElement('canvas');c.width=64;c.height=256;const g=c.getContext('2d');const gr=g.createLinearGradient(0,0,0,256);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(.25,'rgba(255,255,255,.55)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,256);
 const gx=g.createLinearGradient(0,0,64,0);gx.addColorStop(0,'rgba(0,0,0,1)');gx.addColorStop(.5,'rgba(0,0,0,0)');gx.addColorStop(1,'rgba(0,0,0,1)');g.globalCompositeOperation='destination-out';g.fillStyle=gx;g.fillRect(0,0,64,256);rayTex=new THREE.CanvasTexture(c);return rayTex;}
let rayTexV=null;function rtexV(){if(rayTexV)return rayTexV;const c=document.createElement('canvas');c.width=4;c.height=256;const g=c.getContext('2d');const gr=g.createLinearGradient(0,0,0,256);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(.25,'rgba(255,255,255,.55)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,4,256);rayTexV=new THREE.CanvasTexture(c);return rayTexV;}
// cône de lumière : opacité selon l'angle de vue (bords fondus), plus de trait lumineux sur la couture
export function lightRay(x,z,h,r0,r1,color,op=.16){const m=new THREE.MeshBasicMaterial({map:rtexV(),color,transparent:true,opacity:op,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
 m.onBeforeCompile=sh=>{sh.vertexShader='varying float vRF;\n'+sh.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\n {vec3 nV=normalize(normalMatrix*normal);vRF=abs(dot(nV,normalize(-mvPosition.xyz)));}');
  sh.fragmentShader='varying float vRF;\n'+sh.fragmentShader.replace('#include <alphamap_fragment>','#include <alphamap_fragment>\n diffuseColor.a*=pow(vRF,2.5)*.6;');};m.customProgramCacheKey=()=>'vdray';
 const o=new THREE.Mesh(new THREE.CylinderGeometry(r0,r1,h,24,1,true),m);o.position.set(x,h/2,z);o.userData.op=op;return o;}

/* ---------- ombre de contact ---------- */
let blobTex=null;export function blob(r=.45,op=.55){if(!blobTex){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(.55,'rgba(0,0,0,.55)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);blobTex=new THREE.CanvasTexture(c);blobTex.userData.keep=1;}
 const m=new THREE.Mesh(new THREE.PlaneGeometry(r*2,r*2),new THREE.MeshBasicMaterial({map:blobTex,transparent:true,opacity:op,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.y=.025;m.renderOrder=2;return m;}

/* ---------- fumée (particules à mélange normal) ---------- */
const SMAX=500;let sm=null,sPos,sCol,sSize,sRot,sD=[];
function smokeTex(){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');for(let i=0;i<22;i++){const x=40+Math.random()*48,y=40+Math.random()*48,r=18+Math.random()*26;const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(255,255,255,.22)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);}
 const m=g.createRadialGradient(64,64,20,64,64,64);m.addColorStop(0,'rgba(0,0,0,0)');m.addColorStop(1,'rgba(0,0,0,1)');g.globalCompositeOperation='destination-out';g.fillStyle=m;g.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);}
export function smokeSys(){if(sm)return sm;const g=new THREE.BufferGeometry();sPos=new Float32Array(SMAX*3);sCol=new Float32Array(SMAX*4);sSize=new Float32Array(SMAX);sRot=new Float32Array(SMAX);
 g.setAttribute('position',new THREE.BufferAttribute(sPos,3));g.setAttribute('color',new THREE.BufferAttribute(sCol,4));g.setAttribute('size',new THREE.BufferAttribute(sSize,1));g.setAttribute('rot',new THREE.BufferAttribute(sRot,1));
 const at=elTex('satlas');const m=new THREE.ShaderMaterial({uniforms:{map:{value:at||smokeTex()},atl:{value:at?1:0}},transparent:true,depthWrite:false,
  vertexShader:'attribute float size;attribute float rot;attribute vec4 color;varying vec4 vC;varying float vR;void main(){vC=color;vR=rot;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=size*300./-mv.z;gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform sampler2D map;uniform float atl;varying vec4 vC;varying float vR;void main(){float ti=floor(vR/1000.),rr=vR-ti*1000.;vec2 p=gl_PointCoord-.5;float c=cos(rr),s=sin(rr);p=clamp(mat2(c,-s,s,c)*p*1.05+.5,.01,.99);vec2 uv=p;float a2=1.;if(atl>.5){uv=(vec2(mod(ti,2.),floor(ti/2.))+vec2(p.x,1.-p.y))*.5;uv.y=1.-uv.y;a2=.55;}vec4 t=texture2D(map,uv);gl_FragColor=vec4(vC.rgb*mix(1.,t.r*1.3,atl),t.a*vC.a*2.2*a2);}'});
 sm=new THREE.Points(g,m);sm.frustumCulled=false;sm.renderOrder=6;sm.userData.keep=1;return sm;}
export function smoke(o){if(sD.length>=SMAX)sD.shift();sD.push(Object.assign({x:0,y:0,z:0,vx:0,vy:.4,vz:0,life:2,size:.6,grow:.6,a:.35,col:new THREE.Color(0x2a2622),r:Math.random()*6,vr:(Math.random()-.5)*.8,ti:(Math.random()*4)|0},o,{max:o.life||2}));}
export function smokeClear(){sD.length=0;}
export function updSmoke(dt){if(!sm)return;let n=0;for(let i=sD.length-1;i>=0;i--){const p=sD[i];p.life-=dt;if(p.life<=0){sD.splice(i,1);continue;}p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.vx*=.985;p.vz*=.985;p.r+=p.vr*dt;p.size+=p.grow*dt;}
 for(const p of sD){const k=p.life/p.max,a=Math.min(1,(1-k)*6)*k*p.a;sPos[n*3]=p.x;sPos[n*3+1]=p.y;sPos[n*3+2]=p.z;sCol[n*4]=p.col.r;sCol[n*4+1]=p.col.g;sCol[n*4+2]=p.col.b;sCol[n*4+3]=a;sSize[n]=p.size;sRot[n]=(p.ti||0)*1000+((p.r%6.2832)+6.2832)%6.2832;n++;}
 const g=sm.geometry;g.setDrawRange(0,n);g.attributes.position.needsUpdate=g.attributes.color.needsUpdate=g.attributes.size.needsUpdate=g.attributes.rot.needsUpdate=true;}

/* ---------- coulées de lave / givre (décalques animés) ---------- */
// mare de lave : texture réelle ambientCG Lava001 (CC0), croûte sombre et veines incandescentes qui coulent lentement
export function lavaDecal(w,h,seed=0){const tx=elTex('lava_d');if(tx){tx.wrapS=tx.wrapT=THREE.RepeatWrapping;}
 const m=new THREE.ShaderMaterial({uniforms:{t:{value:0},s:{value:seed},tx:{value:tx}},transparent:true,depthWrite:false,
 vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`uniform float t,s;uniform sampler2D tx;varying vec2 vU;float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
 void main(){vec2 q=vU*2.-1.;float r=length(q*vec2(1.,1.08));float b=.78+.22*(n(vU*5.+s)-.5)*2.;float edge=1.-smoothstep(b-.22,b,r);if(edge<=.002)discard;
  vec2 uv=vU*vec2(${w.toFixed(2)},${h.toFixed(2)})*.55+vec2(s*.13,s*.07);vec3 a=texture2D(tx,uv+vec2(t*.012,t*.006)).rgb,c=texture2D(tx,uv*1.37-vec2(t*.009,-t*.004)+.5).rgb;
  vec3 col=pow(mix(a,c,.45),vec3(2.2));float L=dot(col,vec3(.3,.59,.11));float hot=smoothstep(.015,.22,L)*(.8+.2*sin(t*1.7+s+L*9.))*(1.5-r*.7);
  float rim=smoothstep(b-.22,b-.05,r);/* bord : croûte refroidie */vec3 o=col*(.3+hot*6.*(1.-rim*.85))+vec3(.9,.25,.03)*hot*(1.-rim)*.12+vec3(.03,.02,.015)*rim;
  gl_FragColor=vec4(o,edge*(.92-rim*.2));}`});
 if(!tx){m.fragmentShader='void main(){discard;}';}
 const o=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m);o.rotation.x=-Math.PI/2;o.position.y=.03;return o;}
