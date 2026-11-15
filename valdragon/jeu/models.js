// ===== Valdragon 3D · modèles procéduraux et animations =====
import * as THREE from 'three';
const MC=new Map();
export function mat(color,o={}){const k=color+JSON.stringify(o);if(MC.has(k))return MC.get(k);
 const m=new THREE.MeshStandardMaterial(Object.assign({color,roughness:.75,metalness:0,flatShading:!!o.flat},o.std||{}));if(o.em){m.emissive=new THREE.Color(o.em);m.emissiveIntensity=o.ei||1;}m.userData.keep=1;MC.set(k,m);return m;}
const G={};function geo(k,f){if(!G[k]){G[k]=f();G[k].userData.keep=1;}return G[k];}
function mesh(g,m,x=0,y=0,z=0,sx=1,sy=1,sz=1){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;return o;}
const box=()=>geo('box',()=>new THREE.BoxGeometry(1,1,1)),sph=()=>geo('sph',()=>new THREE.SphereGeometry(.5,14,10)),sphL=()=>geo('sphL',()=>new THREE.IcosahedronGeometry(.5,0)),
 cyl=()=>geo('cyl',()=>new THREE.CylinderGeometry(.5,.5,1,10)),cone=()=>geo('cone',()=>new THREE.ConeGeometry(.5,1,10)),cone4=()=>geo('cone4',()=>new THREE.ConeGeometry(.5,1,4)),
 rock=()=>geo('rock',()=>new THREE.DodecahedronGeometry(.5,0)),tor=()=>geo('tor',()=>new THREE.TorusGeometry(.5,.035,6,16,2.3));
function pivot(parent,x,y,z){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;}
const RCOL=[0xd8d0c0,0x7f9cff,0xffd84a,0xff9a3a];
const ARMC=[[0x8a6a44,.0],[0x6a4e30,.0],[0x9aa0a8,.7],[0xd0d6dc,.85],[0xa89a50,.6],[0x4a5062,.8]];
/* ---------- humanoïde générique ---------- */
function humanoid(o){const root=new THREE.Group(),body=pivot(root,0,0,0);const R={root,body,o};const s=o.scale||1;
 const legM=mat(o.leg||0x2a2a30,{std:{roughness:.8}});
 R.legL=pivot(body,-.11*s,.48*s,0);R.legR=pivot(body,.11*s,.48*s,0);
 [R.legL,R.legR].forEach(l=>{l.add(mesh(box(),legM,0,-.22*s,0,.13*s,.46*s,.15*s));l.add(mesh(box(),mat(o.boot||0x1e1a16),0,-.45*s,.03*s,.15*s,.08*s,.2*s));});
 R.torso=pivot(body,0,.5*s,0);
 R.chest=mesh(o.chestGeo||box(),o.chestMat||mat(0x888888),0,.26*s,0,.42*s,.5*s,.26*s);R.torso.add(R.chest);
 R.head=pivot(R.torso,0,.6*s,0);R.head.add(mesh(sph(),mat(o.skin||0xe0b890),0,.08*s,0,.24*s,.26*s,.24*s));
 R.armL=pivot(R.torso,-.27*s,.46*s,0);R.armR=pivot(R.torso,.27*s,.46*s,0);
 const armM=o.armMat||mat(o.arm||0x888888);[R.armL,R.armR].forEach(a=>{a.add(mesh(box(),armM,0,-.2*s,0,.11*s,.42*s,.12*s));a.add(mesh(sph(),mat(o.skin||0xe0b890),0,-.44*s,0,.1*s,.1*s,.1*s));});
 R.handL=pivot(R.armL,0,-.44*s,0);R.handR=pivot(R.armR,0,-.44*s,0);
 return R;}
/* ---------- héros ---------- */
export function makeHero(cls,eq={}){let R;
 if(cls==='guerrier'){const at=eq.at||0,ar=eq.ar||0,[ac,mt]=ARMC[at];const am=mat(ac,{std:{metalness:mt,roughness:mt?.35:.8}});
  R=humanoid({chestMat:am,armMat:am,leg:0x2a2c34,skin:0xd8a880});
  R.chest.add(mesh(box(),mat(RCOL[ar]===0xd8d0c0?0xc9a640:RCOL[ar],{std:{metalness:.8,roughness:.3}}),0,-.3,0,1.04,.08,1.04));
  [-1,1].forEach(d=>R.torso.add(mesh(sph(),am,d*.26,.5,0,.24,.18,.26)));
  R.head.add(mesh(sph(),mat(0xd8dce2,{std:{metalness:.85,roughness:.3}}),0,.1,0,.28,.3,.28));R.head.add(mesh(box(),mat(0x0a0a0c),0,.1,.13,.2,.035,.04));
  R.head.add(mesh(cone(),mat(ar>=2?0xffc040:0xa3201f),0,.32,-.04,.08,.24,.08));
  R.cape=pivot(R.torso,0,.52,-.15);R.cape.add(mesh(box(),mat([0x6e1414,0x1e2a6e,0x6e5a14,0x7a1010][ar],{std:{roughness:.9}}),0,-.36,0,.46,.72,.03));
  const sw=pivot(R.handR,0,0,0);sw.rotation.x=-Math.PI/2;R.weapon=sw;const wc=RCOL[eq.wr||0];
  sw.add(mesh(box(),mat(0xe8eef4,{std:{metalness:.9,roughness:.2},em:eq.wr>=2?wc:null,ei:.35}),0,.5,0,.06,.78,.02));sw.add(mesh(box(),mat(0xc9a640,{std:{metalness:.8,roughness:.3}}),0,.1,0,.24,.04,.05));sw.add(mesh(cyl(),mat(0x4a2e18),0,-.02,0,.04,.18,.04));
  const sh=pivot(R.handL,0,.05,.05);sh.add(mesh(cyl(),mat(0x8a1a14,{std:{roughness:.6}}),0,0,0,.42,.05,.5));sh.children[0].rotation.x=Math.PI/2;sh.add(mesh(cyl(),mat(0xc9a640,{std:{metalness:.8}}),0,0,.03,.12,.05,.14));sh.children[1].rotation.x=Math.PI/2;R.shield=sh;}
 else if(cls==='mage'){const ar=eq.ar||0;const rc=[0x4a3a98,0x2a4ab8,0x7a2a8a,0xa0202a][ar];
  R=humanoid({chestMat:mat(rc,{std:{roughness:.85}}),armMat:mat(rc),skin:0xe8c9a0});R.legL.visible=R.legR.visible=false;
  R.body.add(mesh(cone(),mat(rc,{std:{roughness:.85}}),0,.42,0,.62,.95,.62));R.body.add(mesh(cyl(),mat([0xc9a640,0x9fb4ff,0xffd84a,0xff9a3a][ar],{std:{metalness:.6}}),0,.08,0,.62,.04,.62));
  R.head.add(mesh(cone(),mat([0x2a1c5a,0x14246a,0x4a0a5a,0x5a0a0a][ar],{std:{roughness:.9}}),0,.28,-.03,.36,.46,.36));
  const st=pivot(R.handR,0,0,0);R.weapon=st;st.add(mesh(cyl(),mat(0x5a3a1e),0,.25,0,.05,1.3,.05));R.orb=mesh(sph(),mat(0xbfd0ff,{em:0x8fa8ff,ei:2.5}),0,.95,0,.16,.16,.16);R.orb.castShadow=false;st.add(R.orb);}
 else{const ar=eq.ar||0;R=humanoid({chestMat:mat(0x7a4e2a,{std:{roughness:.8}}),arm:0x6a4428,leg:0x3a3424,skin:0xe0b890});
  R.cloak=pivot(R.torso,0,.55,-.14);R.cloak.add(mesh(box(),mat([0x2f5a2a,0x2a4a6a,0x5a5a1a,0x7a3a10][ar],{std:{roughness:.95}}),0,-.34,0,.44,.7,.03));
  R.head.add(mesh(cone(),mat([0x2f5a2a,0x2a4a6a,0x5a5a1a,0x7a3a10][ar]),0,.22,-.02,.3,.32,.3));
  R.torso.add(mesh(cyl(),mat(0x5a3a1a),.12,.45,-.18,.08,.42,.08));
  const bw=pivot(R.handL,0,0,.02);R.weapon=bw;const bm=mesh(tor(),mat(ar>=2?[0,0,0xc9a640,0xff9a3a][ar]:0x7a4a1a,{std:{metalness:ar>=2?.6:0}}),0,0,0,1.25,1.25,1.25);bm.rotation.z=Math.PI/2-1.15;bw.add(bm);
  R.string=mesh(box(),mat(0xeeeeee),0,0,-.05,.01,1.2,.01);bw.add(R.string);R.arrow=mesh(box(),mat(0xe8dcc4),0,0,.3,.015,.015,.7);R.arrow.visible=false;bw.add(R.arrow);}
 R.kind='hero';R.cls=cls;R.root.userData.R=R;return R;}
/* ---------- monstres ---------- */
export function makeMonster(k,o={}){let R;
 switch(k){
 case'gob':case'ch':R=humanoid({scale:.78,chestMat:mat(0x5a8a30,{flat:1}),arm:0x5a8a30,skin:0x6a9a3e,leg:0x3a2a14});
  [-1,1].forEach(d=>{const e=mesh(cone4(),mat(0x6a9a3e,{flat:1}),d*.2,.12,0,.12,.3,.06);e.rotation.z=-d*1.2;R.head.add(e);});
  R.eyes=[-1,1].map(d=>{const e=mesh(sph(),mat(0xffe14a,{em:0xffd020,ei:2}),d*.06,.1,.1,.05,.05,.05);R.head.add(e);return e;});
  R.chest.add(mesh(box(),mat(0x5a3a1a),0,-.32,0,1.05,.25,1.05));
  if(k==='gob'){const d=pivot(R.handR,0,0,0);d.rotation.x=-Math.PI/2;d.add(mesh(box(),mat(0xb0b4b8,{std:{metalness:.8,roughness:.3}}),0,.2,0,.04,.32,.015));R.weapon=d;}
  else{R.head.add(mesh(box(),mat(0xe8dcc4),0,.09,.08,.22,.16,.06));[0xd33,0xfc3,0x3cf].forEach((c,i)=>{const f=mesh(box(),mat(c),(i-1)*.07,.32,0,.025,.28,.025);f.rotation.z=(i-1)*.3;R.head.add(f);});
   const st=pivot(R.handR,0,0,0);st.add(mesh(cyl(),mat(0x6a4a2a),0,.3,0,.04,1,.04));st.add(mesh(sph(),mat(0xe8dcc4),0,.82,0,.14,.14,.14));R.orb=mesh(sph(),mat(0x8aff8a,{em:0x50ff50,ei:2.5}),0,.82,0,.08,.08,.08);st.add(R.orb);R.weapon=st;}
  break;
 case'sq':case'ar':{const bone=mat(0xdcd4c0,{std:{roughness:.6}});R=humanoid({chestMat:bone,armMat:bone,leg:0xdcd4c0,skin:0xe8e0cc});
  R.chest.scale.set(.32,.46,.16);for(let i=0;i<3;i++)R.chest.add(mesh(box(),mat(0x1a1612),0,.15-i*.2,.52,1.3,.06,.1));
  R.head.children[0].scale.set(.27,.27,.27);R.eyes=[-1,1].map(d=>{const e=mesh(sph(),mat(k==='ar'?0x7fd0ff:0xff6a3a,{em:k==='ar'?0x40b0ff:0xff4010,ei:3}),d*.06,.1,.11,.05,.05,.05);e.castShadow=false;R.head.add(e);return e;});
  if(k==='sq'){const sw=pivot(R.handR,0,0,0);sw.rotation.x=-Math.PI/2;sw.add(mesh(box(),mat(0x9aa0a8,{std:{metalness:.7,roughness:.4}}),0,.38,0,.06,.62,.02));R.weapon=sw;R.armL.add(mesh(cyl(),mat(0x5a4a3a),0,-.4,.08,.3,.04,.3));R.armL.children[R.armL.children.length-1].rotation.x=Math.PI/2;}
  else{const bw=pivot(R.handL,0,0,.02);const bm=mesh(tor(),mat(0x6a4a2a),0,0,0,1.1,1.1,1.1);bm.rotation.z=Math.PI/2-1.15;bw.add(bm);R.weapon=bw;}break;}
 case'sp':{R={root:new THREE.Group()};R.body=pivot(R.root,0,.35,0);const sm=mat(0x3a2448,{flat:1,std:{roughness:.5}});
  R.body.add(mesh(sphL(),sm,0,0,-.25,.7,.55,.8));R.body.add(mesh(sphL(),sm,0,.02,.22,.42,.36,.42));
  R.eyes=[];for(let i=0;i<4;i++){const e=mesh(sph(),mat(0xff2a2a,{em:0xff1010,ei:3}),-.09+i*.06,.1,.42,.05,.05,.05);e.castShadow=false;R.body.add(e);R.eyes.push(e);}
  R.legs=[];for(let i=0;i<8;i++){const side=i<4?-1:1,j=i%4,lg=pivot(R.body,side*.18,0,.15-j*.13);const up=mesh(cyl(),sm,side*.22,.12,0,.05,.5,.05);up.rotation.z=side*1.0;lg.add(up);const lo=mesh(cyl(),sm,side*.48,-.12,0,.04,.55,.04);lo.rotation.z=-side*.5;lg.add(lo);lg.rotation.y=side*(j-1.5)*.35;R.legs.push(lg);}break;}
 case'py':{R={root:new THREE.Group()};R.body=pivot(R.root,0,.15,0);const rm=mat(0x8a2a6a,{std:{roughness:.8}});R.body.add(mesh(cone(),rm,0,.55,0,.62,1.1,.62));
  R.head=pivot(R.body,0,1.1,0);R.head.add(mesh(cone(),mat(0x5a1442),0,.05,0,.38,.5,.38));R.head.add(mesh(sph(),mat(0x0a0306),0,-.05,.08,.22,.2,.12));
  R.eyes=[-1,1].map(d=>{const e=mesh(sph(),mat(0xffb030,{em:0xff9010,ei:3}),d*.05,-.04,.15,.04,.04,.04);R.head.add(e);return e;});
  R.armL=pivot(R.body,-.25,.85,0);R.armR=pivot(R.body,.25,.85,0);[R.armL,R.armR].forEach(a=>{a.add(mesh(box(),rm,0,-.18,0,.12,.38,.12));});
  R.handR=pivot(R.armR,0,-.4,0);R.handL=pivot(R.armL,0,-.4,0);R.orb=mesh(sph(),mat(0xffd27a,{em:0xff7a20,ei:4}),0,0,0,.16,.16,.16);R.orb.castShadow=false;R.handR.add(R.orb);R.float=1;break;}
 case'go':{R={root:new THREE.Group()};R.body=pivot(R.root,0,0,0);const rm=mat(0x8a8474,{flat:1,std:{roughness:.95}});
  R.torso=pivot(R.body,0,.9,0);R.torso.add(mesh(rock(),rm,0,.2,0,1.15,1.0,.85));R.head=pivot(R.torso,0,.8,.1);R.head.add(mesh(rock(),rm,0,0,0,.5,.42,.45));
  R.eyes=[-1,1].map(d=>{const e=mesh(box(),mat(0x58ffd0,{em:0x30ffc0,ei:3}),d*.1,0,.22,.08,.05,.04);R.head.add(e);return e;});
  R.torso.add(mesh(box(),mat(0x58ffd0,{em:0x30ffc0,ei:2}),0,.2,.42,.05,.4,.02));R.torso.add(mesh(box(),mat(0x58ffd0,{em:0x30ffc0,ei:2}),0,.25,.42,.32,.05,.02));
  R.armL=pivot(R.torso,-.7,.45,0);R.armR=pivot(R.torso,.7,.45,0);[R.armL,R.armR].forEach(a=>{a.add(mesh(rock(),rm,0,-.35,0,.45,.6,.45));a.add(mesh(rock(),rm,0,-.85,.05,.55,.5,.55));});
  R.legL=pivot(R.body,-.3,.55,0);R.legR=pivot(R.body,.3,.55,0);[R.legL,R.legR].forEach(l=>l.add(mesh(rock(),rm,0,-.3,0,.42,.6,.42)));R.scale=1.25;break;}
 case'wy':case'boss':{const big=k==='boss',el=o.el||'fire';const C={fire:[0x8f1a14,0x2a0806,0xffb02e],ice:[0x3d74a0,0x10243a,0xc8f2ff],poison:[0x4e5a2a,0x141a08,0xa8ff5a],arcane:[0x6b2a8a,0x1c0628,0xff8ae8]}[big?el:'fire'];
  R={root:new THREE.Group()};R.body=pivot(R.root,0,big?1.6:.9,0);const bm=mat(C[0],{flat:1,std:{roughness:.85,metalness:0}}),dm=mat(C[1],{flat:1});
  R.body.add(mesh(sphL(),bm,0,0,0,.7,.6,1.25));R.body.add(mesh(sphL(),mat(C[1],{flat:1}),0,-.18,.05,.5,.35,1.0));
  R.neck=pivot(R.body,0,.15,.5);R.neck.rotation.x=.6;R.neck.add(mesh(cyl(),bm,0,.3,0,.22,.65,.22));R.head=pivot(R.neck,0,.65,0);R.head.rotation.x=-.45;
  R.head.add(mesh(box(),bm,0,0,.12,.34,.26,.55));R.head.add(mesh(box(),dm,0,-.1,.2,.28,.1,.45));
  [-1,1].forEach(d=>{const h=mesh(cone(),mat(0xe8dcc4),d*.12,.2,-.1,.07,.4,.07);h.rotation.x=-1.2;h.rotation.z=d*.3;R.head.add(h);});
  R.eyes=[-1,1].map(d=>{const e=mesh(sph(),mat(C[2],{em:C[2],ei:4}),d*.13,.06,.3,.06,.04,.06);e.castShadow=false;R.head.add(e);return e;});
  R.mouth=mesh(sph(),new THREE.MeshStandardMaterial({color:C[2],emissive:C[2],emissiveIntensity:0}),0,-.06,.42,.12,.08,.12);R.mouth.castShadow=false;R.head.add(R.mouth);
  R.wings=[-1,1].map(d=>{const w=pivot(R.body,d*.3,.25,-.1);const sh=new THREE.Shape();sh.moveTo(0,0);sh.lineTo(d*1.9,.9);sh.lineTo(d*2.3,.2);sh.lineTo(d*1.7,-.3);sh.lineTo(d*1.2,.05);sh.lineTo(d*.8,-.45);sh.lineTo(0,-.35);
   const g=new THREE.ShapeGeometry(sh);g.scale(1,1.5,1);g.translate(0,.25,0);const wm=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:C[0],side:THREE.DoubleSide,roughness:.7,flatShading:true,emissive:C[1],emissiveIntensity:.25,transparent:true,opacity:.96}));wm.rotation.x=-.75;wm.castShadow=true;w.add(wm);
   const sp=mesh(cyl(),dm,d*1.0,.75,-.6,.06,2.2,.06);sp.rotation.z=Math.PI/2-d*.35;sp.rotation.x=-.75;w.add(sp);return w;});
  R.tail=pivot(R.body,0,-.05,-1.1);let t=R.tail;for(let i=0;i<4;i++){const s=mesh(cone(),bm,0,0,-.25,.26-i*.05,.6,.26-i*.05);s.rotation.x=-Math.PI/2;t.add(s);const n=pivot(t,0,0,-.5);t=n;}R.tailEnd=t;
  [-1,1].forEach(d=>[.4,-.5].forEach(z=>{const l=mesh(cyl(),bm,d*.38,-.55,z,.14,.6,.14);R.body.add(l);}));
  R.scale=big?1.55:.62;R.fly=!big;R.dragon=1;R.el=el;break;}}
 R.kind='mon';R.k=k;R.root.userData.R=R;if(R.scale)R.root.scale.setScalar(R.scale);return R;}
export function makeMerchant(){const R=humanoid({scale:.8,chestMat:mat(0x7a4a2a),arm:0x7a4a2a,skin:0xc98a5a,leg:0x3a2414});
 R.head.add(mesh(cone(),mat(0xd9a040),0,-.08,.1,.22,.3,.12));R.head.children[R.head.children.length-1].rotation.x=Math.PI;R.head.add(mesh(sph(),mat(0x4a2e18),0,.18,0,.26,.14,.26));
 const lan=pivot(R.handR,0,-.1,.05);lan.add(mesh(box(),mat(0xffd27a,{em:0xffb040,ei:3}),0,0,0,.1,.14,.1));R.lantern=lan;R.kind='npc';return R;}
/* ---------- animation ---------- */
const lerp=(a,b,t)=>a+(b-a)*t;
export function animate(R,dt,t,st){// st: {walk:0..1, act:'atk'|'cast'|'bow'|'slam'|null, p:0..1, hit:0..1, dead:0..1, charge:bool, phase}
 const ph=(st.phase||0)+t;const w=st.walk||0,sw=Math.sin(ph*9)*w;
 if(R.body&&!R.dragon)R.body.position.y=(R.float?.25+Math.sin(ph*2)*.08:0)+Math.abs(Math.sin(ph*9))*.04*w+Math.sin(ph*2.2)*.012;
 if(R.legL){R.legL.rotation.x=sw*.7;R.legR.rotation.x=-sw*.7;}
 if(R.armL&&!R.dragon){R.armL.rotation.x=-sw*.5;R.armR.rotation.x=sw*.5;R.armL.rotation.z=-.08;R.armR.rotation.z=.08;}
 if(R.cape)R.cape.rotation.x=.15+w*.5+Math.sin(ph*3)*.05;if(R.cloak)R.cloak.rotation.x=.12+w*.45+Math.sin(ph*3)*.05;
 if(R.legs)R.legs.forEach((l,i)=>{l.rotation.x=Math.sin(ph*14+i*1.3)*.25*(w+.15);});
 if(R.dragon){const fl=Math.sin(ph*(R.fly?14:3.2));R.wings.forEach((wg,i)=>{wg.rotation.z=(i?-1:1)*(.1+fl*(R.fly?.55:.28));wg.rotation.y=(i?1:-1)*(.15+fl*.15);});R.body.position.y=(R.fly?.9:1.6)+Math.sin(ph*(R.fly?7:1.6))*(R.fly?.12:.1);
  if(R.tail){let n=R.tail,i=0;while(n&&i<5){n.rotation.y=Math.sin(ph*1.5-i*.6)*.18;n=n.children.find(c=>c.isGroup);i++;}}
  R.neck.rotation.x=.6+Math.sin(ph*1.3)*.06;R.mouth.material.emissiveIntensity=st.charge?2+Math.sin(ph*12)*1.2:0;R.mouth.scale.set(.12,.08,.12).multiplyScalar(st.charge?1.4:1);}
 if(R.orb)R.orb.material.emissiveIntensity=2.2+Math.sin(ph*4)*.6+(st.act==='cast'?3*Math.sin(Math.min(1,st.p)*Math.PI):0)+(st.charge?3:0);
 if(R.eyes&&st.charge)R.eyes.forEach(e=>e.material.emissiveIntensity=4+Math.sin(ph*14)*2);
 // actions
 const p=st.p||0,a=st.act;
 if(a==='atk'&&R.armR){const up=p<.35?p/.35:p<.55?1-(p-.35)/.2*1.6:Math.max(-.6,-.6+(p-.55)/.45*.6);R.armR.rotation.x=-2.4*Math.max(0,up)+(up<0?up*-1.2:0);if(R.torso)R.torso.rotation.y=-.4*Math.max(0,up)+.3*Math.max(0,-up);}
 if(a==='cast'){const e=Math.sin(Math.min(1,p)*Math.PI);if(R.armR){R.armR.rotation.x=-2.6*e;R.armR.rotation.z=.2;}if(R.armL){R.armL.rotation.x=-1.2*e;}}
 if(a==='bow'&&R.armL){const e=p<.7?Math.min(1,p/.4):Math.max(0,1-(p-.7)/.3);R.armL.rotation.x=-1.5*Math.min(1,p*4);R.armR.rotation.x=-1.4*Math.min(1,p*4);R.armR.rotation.y=-.6*e;if(R.string){R.string.position.z=-.05-.3*e;R.arrow.visible=e>.2;R.arrow.position.z=.3-.3*e;}}
 if(a==='slam'&&R.armL){const up=p<.5?p/.5:1-(p-.5)/.15;const v=Math.max(-.2,up);R.armL.rotation.x=R.armR.rotation.x=-2.8*Math.max(0,v);}
 if(a==='bite'&&R.body){R.body.rotation.x=-Math.sin(p*Math.PI)*.4;}
 if(R.dragon&&a==='atk'){R.neck.rotation.x=.6+Math.sin(p*Math.PI)*.6;}
 if(R.dragon&&a==='breath'){R.neck.rotation.x=.6+(p<.3?-.5*p/.3:-.5+Math.min(1,(p-.3)*3)*.8);R.mouth.material.emissiveIntensity=p>.3?6:2;}
 // coup reçu et mort
 const h=st.hit||0;if(R.body&&!R.dragon)R.body.rotation.x=-h*.35;
 const d=st.dead||0;R.root.rotation.z=lerp(0,(st.fallDir||1)*(R.dragon?.5:1.45),d);R.root.position.y=lerp(R.root.userData.baseY||0,(R.root.userData.baseY||0)-.05,d);}
