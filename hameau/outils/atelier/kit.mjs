// Atelier Hameau — modeleur procédural low-poly + cuiseur
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries,mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';

let seed=1;export const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};export const reseed=s=>{seed=s>0?s:1;};
const clean=g=>{g=g.index?g.toNonIndexed():g.clone();for(const k of Object.keys(g.attributes))if(!['position','normal'].includes(k))g.deleteAttribute(k);return g;};

export class Model{
  constructor(name){this.name=name;this.parts=[];this.anchors={};this.stack=[new THREE.Matrix4()];}
  top(){return this.stack[this.stack.length-1];}
  push(x=0,y=0,z=0,ry=0){this.stack.push(this.top().clone().multiply(new THREE.Matrix4().makeRotationY(ry).setPosition(x,y,z)));return this;}
  pop(){this.stack.pop();return this;}
  add(mat,geo,o={}){const {x=0,y=0,z=0,rx=0,ry=0,rz=0,uv=1}=o;const sc=o.s||[1,1,1];
    const m=new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz,'YXZ')),new THREE.Vector3(1,1,1));
    this.parts.push({mat,geo:clean(geo),m:this.top().clone().multiply(m),uv});return this;}
  anchor(name,x,y,z){const v=new THREE.Vector3(x,y,z).applyMatrix4(this.top());this.anchors[name]=[+v.x.toFixed(3),+v.y.toFixed(3),+v.z.toFixed(3)];return this;}
  // primitives (base posée en y sauf c:true)
  box(mat,w,h,d,o={}){return this.add(mat,new THREE.BoxGeometry(w,h,d).translate(0,o.c?0:h/2,0),o);}
  rb(mat,w,h,d,r=0.025,o={}){if(Math.min(w,h,d)<0.07||o.seg===0)return this.box(mat,w,h,d,o);const rr=Math.max(0.002,Math.min(r,w/2-1e-3,h/2-1e-3,d/2-1e-3));return this.add(mat,new RoundedBoxGeometry(w,h,d,1,rr).translate(0,o.c?0:h/2,0),o);}
  cyl(mat,r1,r2,h,seg=10,o={}){return this.add(mat,new THREE.CylinderGeometry(r1,r2,h,seg).translate(0,o.c?0:h/2,0),o);}
  cone(mat,r,h,seg=8,o={}){return this.add(mat,new THREE.ConeGeometry(r,h,seg).translate(0,h/2,0),o);}
  sph(mat,r,o={}){return this.add(mat,new THREE.IcosahedronGeometry(r,o.det??0),o);}
  // prisme triangulaire : base d (en z), hauteur h, longueur l (en x)
  prism(mat,l,d,h,o={}){const s=new THREE.Shape();s.moveTo(-d/2,0);s.lineTo(d/2,0);s.lineTo(0,h);s.closePath();
    const g=new THREE.ExtrudeGeometry(s,{depth:l,bevelEnabled:false});g.translate(0,0,-l/2);g.rotateY(Math.PI/2);return this.add(mat,g,o);}
  // ---- éléments d'architecture ----
  roof(mat,{len,halfW,h,y,thick=0.07,ridge=null,x=0,z=0,ry=0}){ridge=ridge||mat;
    const L=Math.hypot(halfW,h),a=Math.atan2(h,halfW);
    this.push(x,y,z,ry);
    for(const sd of [1,-1])this.rb(mat,len,thick,L+0.04,0.02,{c:true,x:0,y:h/2+thick*0.35,z:sd*halfW/2,rx:sd*a,seg:1});
    this.rb(ridge,len+0.02,0.1,0.1,0.025,{c:true,y:h+thick*0.45,rx:Math.PI/4});
    this.pop();return this;}
  window(o){const {x=0,y=0.4,w=0.22,h=0.22,frame='trim',sill='trim',shutters=null,lintel=null,depth=0.03}=o;
    this.rb(frame,w+0.06,h+0.06,0.05,0.012,{x,y:y-h/2-0.03,z:depth,seg:1});
    this.box('win',w,h,0.02,{x,y:y-h/2,z:depth+0.02});
    this.box(frame,0.025,h,0.02,{x,y:y-h/2,z:depth+0.035});this.box(frame,w,0.025,0.02,{x,y:y-0.0125,z:depth+0.035,c:true});
    this.rb(sill,w+0.12,0.035,0.09,0.01,{x,y:y-h/2-0.06,z:depth+0.03,seg:1});
    if(lintel)this.rb(lintel,w+0.14,0.07,0.07,0.012,{x,y:y+h/2+0.02,z:depth+0.01,seg:1});
    if(shutters)for(const sd of [-1,1])this.rb(shutters,w*0.5,h+0.02,0.025,0.006,{x:x+sd*(w/2+w*0.3),y:y-h/2-0.01,z:depth+0.05,ry:sd*0.35,seg:1});
    return this;}
  door(o){const {x=0,w=0.28,h=0.48,frame='trim',z=0.02,step='stone'}=o;
    this.rb(frame,w+0.08,h+0.05,0.05,0.012,{x,z,seg:1});this.box('door',w,h,0.03,{x,z:z+0.025});
    for(const k of [-1,0,1])this.box('trim',w,0.025,0.01,{x,y:h*(0.5+k*0.33),z:z+0.045,c:true});
    this.sph('metal',0.018,{x:x+w*0.32,y:h*0.5,z:z+0.05,det:0});
    if(step)this.rb(step,w+0.14,0.05,0.14,0.015,{x,z:z+0.07,seg:1});return this;}
  stones(mat,x0,x1,z,y=0,hgt=0.13,ry=0){this.push(0,0,0,ry);let x=x0;while(x<x1-0.04){const w=Math.min(x1-x,0.14+rnd()*0.12);
    this.rb(mat,w-0.015,hgt*(0.85+rnd()*0.3),0.1+rnd()*0.04,0.025,{x:x+w/2,y,z:z+(rnd()-0.5)*0.02,seg:1});x+=w;}this.pop();return this;}
  // ---- cuisson en un seul maillage à couleurs de sommets (pour l'instanciation) ----
  bakeVC(pal){const list=[];for(const p of this.parts){const g=p.geo.clone();g.applyMatrix4(p.m);const c=pal[p.mat]||[1,1,1],col=new Float32Array(g.attributes.position.count*3);
      for(let i=0;i<col.length;i+=3){col[i]=c[0];col[i+1]=c[1];col[i+2]=c[2];}g.setAttribute('color',new THREE.BufferAttribute(col,3));list.push(g);}
    const g=mergeVertices(mergeGeometries(list),1e-4);const P=g.attributes.position.array,Nn=g.attributes.normal.array,C=g.attributes.color.array;
    const p16=new Int16Array(P.length),n8=new Int8Array(Nn.length),c8=new Uint8Array(C.length);
    for(let i=0;i<P.length;i++)p16[i]=Math.round(P[i]*4000);for(let i=0;i<Nn.length;i++)n8[i]=Math.round(Nn[i]*127);for(let i=0;i<C.length;i++)c8[i]=Math.round(Math.min(1,C[i])*255);
    const I=g.index.array,ix=g.attributes.position.count<65536?new Uint16Array(I):new Uint32Array(I);const b64=a=>Buffer.from(a.buffer).toString('base64');
    return {vc:1,verts:g.attributes.position.count,anchors:{},parts:[{m:'vc',n:g.attributes.position.count,p:b64(p16),q:b64(n8),c:b64(c8),i:b64(ix),i32:ix instanceof Uint32Array?1:0}]};}
  // ---- cuisson ----
  bake(){const groups={};
    for(const p of this.parts){const g=p.geo.clone();
      // UV : projection selon l'axe dominant, en coordonnées locales de la pièce (densité de texture constante)
      const pos=g.attributes.position,nor=g.attributes.normal,uv=new Float32Array(pos.count*2);
      for(let t=0;t<pos.count;t+=3){let nx=0,ny=0,nz=0;for(let k=0;k<3;k++){nx+=nor.getX(t+k);ny+=nor.getY(t+k);nz+=nor.getZ(t+k);}
        const ax=Math.abs(nx),ay=Math.abs(ny),az=Math.abs(nz);
        for(let k=0;k<3;k++){const X=pos.getX(t+k),Y=pos.getY(t+k),Z=pos.getZ(t+k);let u,v;
          if(ay>=ax&&ay>=az){u=X;v=Z;}else if(ax>=az){u=Z;v=Y;}else{u=X;v=Y;}uv[(t+k)*2]=u*p.uv;uv[(t+k)*2+1]=v*p.uv;}}
      g.setAttribute('uv',new THREE.BufferAttribute(uv,2));g.applyMatrix4(p.m);(groups[p.mat]=groups[p.mat]||[]).push(g);}
    const out={anchors:this.anchors,parts:[]};let verts=0;const bb=new THREE.Box3();
    for(const [mat,list] of Object.entries(groups)){const g=mergeVertices(mergeGeometries(list),1e-4);verts+=g.attributes.position.count;g.computeBoundingBox();bb.union(g.boundingBox);
      const P=g.attributes.position.array,Nn=g.attributes.normal.array,U=g.attributes.uv.array;
      const p16=new Int16Array(P.length),n8=new Int8Array(Nn.length),u16=new Int16Array(U.length);
      for(let i=0;i<P.length;i++)p16[i]=Math.round(P[i]*4000);for(let i=0;i<Nn.length;i++)n8[i]=Math.round(Nn[i]*127);for(let i=0;i<U.length;i++)u16[i]=Math.round(U[i]*256);
      const b64=a=>Buffer.from(a.buffer).toString('base64');
      const I=g.index.array,ix=g.attributes.position.count<65536?new Uint16Array(I):new Uint32Array(I);
      out.parts.push({m:mat,n:g.attributes.position.count,p:b64(p16),q:b64(n8),u:b64(u16),i:b64(ix),i32:ix instanceof Uint32Array?1:0});}
    out.verts=verts;out.bbox=[bb.min.toArray().map(v=>+v.toFixed(2)),bb.max.toArray().map(v=>+v.toFixed(2))];return out;}
}
