// Atelier Hameau — définitions des modèles (repère : centre de l'emprise, sol y=0, façade avant vers +z)
import {Model,rnd,reseed} from './kit.mjs';

// façade : fn(M) dessinée dans le repère de la façade (z sortant)
function facades(M,w,d,fns){const f=[[0,d/2,0,fns.front],[w/2,0,Math.PI/2,fns.right],[0,-d/2,Math.PI,fns.back],[-w/2,0,-Math.PI/2,fns.left]];
  for(const [x,z,ry,fn] of f)if(fn){M.push(x,0,z,ry);fn(M,(ry===0||ry===Math.PI)?w:d);M.pop();}}
function timber(M,len,y0,y1,{posts=[],braces=[]}={}){
  M.rb('trim',len+0.02,0.06,0.05,0.012,{y:y0,z:0.015,seg:1});M.rb('trim',len+0.02,0.06,0.05,0.012,{y:y1-0.06,z:0.015,seg:1});
  for(const x of posts)M.rb('trim',0.06,y1-y0,0.05,0.012,{x,y:y0,z:0.015,seg:1});
  for(const [x,dir] of braces){const h=y1-y0-0.12,l=Math.hypot(0.28,h);M.rb('trim',0.05,l,0.04,0.01,{c:true,x,y:y0+0.06+h/2,z:0.02,rz:dir*Math.atan2(0.28,h),seg:1});}}

export function house1(v){reseed(11+v*7);const M=new Model('house1_'+v);
  const w=1.44,d=1.16,H=0.74,y0=0.1;
  M.stones('stone',-w/2-0.04,w/2+0.04,d/2+0.02,0,0.12);M.stones('stone',-w/2-0.04,w/2+0.04,-d/2-0.02,0,0.12);
  M.stones('stone',-d/2,d/2,w/2+0.02,0,0.12,Math.PI/2);M.stones('stone',-d/2,d/2,w/2+0.02,0,0.12,-Math.PI/2);
  M.rb('stone',w+0.04,0.1,d+0.04,0.02,{});
  M.rb('wall',w,H,d,0.02,{y:y0});
  M.prism('wall',w-0.02,d,0.58,{y:y0+H});
  facades(M,w,d,{
    front:(M)=>{M.push(0,0,0.0);timber(M,w,y0,y0+H,{posts:[-w/2+0.03,-0.22,0.22,w/2-0.03],braces:[[-0.47,1],[0.47,-1]]});
      M.door({x:0,w:0.26,h:0.46,z:0.02});M.window({x:-0.47,y:y0+0.4,w:0.2,h:0.2,shutters:'shutter',depth:0.03});M.window({x:0.47,y:y0+0.4,w:0.2,h:0.2,shutters:'shutter',depth:0.03});
      if(v!==1){M.rb('trim',0.32,0.07,0.1,0.01,{x:-0.47,y:y0+0.2,z:0.08,seg:1});M.rb('flowers',0.28,0.07,0.08,0.02,{x:-0.47,y:y0+0.26,z:0.08,seg:1});}M.pop();},
    right:(M,l)=>{timber(M,l,y0,y0+H,{posts:[-l/2+0.03,l/2-0.03,0],braces:[[-0.27,1],[0.27,-1]]});M.window({x:0.27,y:y0+0.42,w:0.18,h:0.18,depth:0.03});},
    left:(M,l)=>{timber(M,l,y0,y0+H,{posts:[-l/2+0.03,l/2-0.03,0]});M.window({x:-0.27,y:y0+0.42,w:0.18,h:0.18,depth:0.03});
      if(v===2)for(let k=0;k<6;k++){M.cyl('log',0.045,0.045,0.42,7,{x:-0.15+(k%3)*0.1,y:0.05+(k>2?0.085:0)+0.045,z:0.12,rx:Math.PI/2,c:true});}},
    back:(M,l)=>{timber(M,l,y0,y0+H,{posts:[-l/2+0.03,0,l/2-0.03],braces:[[-0.36,1],[0.36,-1]]});}});
  M.roof('roof',{len:w+0.3,halfW:d/2+0.16,h:0.62,y:y0+H-0.04});
  if(v===1){// appentis en L à l'arrière
    M.push(w/2-0.3,0,-d/2-0.28,0);M.rb('wood',0.6,0.5,0.5,0.015,{y:0.04});M.roof('roof',{len:0.7,halfW:0.3,h:0.24,y:0.52,ry:0});for(let k=0;k<4;k++)M.cyl('log',0.035,0.035,0.4,7,{x:-0.36,y:0.06+(k>1?0.07:0),z:-0.12+(k%2)*0.16,rx:Math.PI/2,c:true});M.pop();}
  M.rb('stone',0.2,1.05,0.2,0.02,{x:0.42,y:0.6,z:-0.3});M.rb('stone',0.26,0.05,0.26,0.01,{x:0.42,y:1.65,z:-0.3,seg:1});M.anchor('chim',0.42,1.72,-0.3);
  if(v===0){for(const z of [-0.45,0.45])M.cyl('trim',0.018,0.018,0.62,5,{x:-w/2-0.28,z});M.cyl('dark',0.006,0.006,0.9,3,{c:true,x:-w/2-0.28,y:0.58,rx:Math.PI/2});
    const cl=['cloth','shutter','flowers'];for(let k=0;k<3;k++)M.box(['cloth','awnW','awnR'][k],0.012,0.2,0.16,{x:-w/2-0.28,y:0.38,z:-0.28+k*0.24});}
  if(v===0){M.cyl('wood',0.09,0.08,0.22,10,{x:w/2+0.12,z:d/2-0.08});M.cyl('trim',0.092,0.092,0.02,10,{x:w/2+0.12,y:0.17,z:d/2-0.08});}
  if(v===1){M.rb('wood',0.38,0.04,0.12,0.01,{x:-w/2+0.32,y:0.17,z:d/2+0.2,seg:1});for(const x of [-0.14,0.14])M.box('wood',0.04,0.17,0.1,{x:-w/2+0.32+x,z:d/2+0.2});}
  return M;}

export function house2(v){reseed(21+v*5);const M=new Model('house2_'+v);
  const w=1.56,d=1.26,H=1.02;
  M.rb('stoneWall',w,H,d,0.03,{});M.prism('stoneWall',w-0.02,d,0.66,{y:H});
  for(const [sx,sz] of [[1,1],[-1,1],[1,-1],[-1,-1]])for(let k=0;k<6;k++){const big=k%2===0;M.rb('stoneLight',big?0.2:0.13,0.15,big?0.13:0.2,0.02,{x:sx*(w/2-(big?0.08:0.045)),y:k*0.17,z:sz*(d/2-(big?0.045:0.08))+sz*0.01,seg:1});}
  facades(M,w,d,{
    front:(M)=>{M.door({x:0,w:0.28,h:0.52,z:0.0,frame:'stoneLight'});M.rb('stoneLight',0.46,0.08,0.08,0.015,{y:0.56,z:0.02,seg:1});
      for(const x of [-0.5,0.5])M.window({x,y:0.5,w:0.22,h:0.24,shutters:'shutter',lintel:'stoneLight',frame:'trim',sill:'stoneLight',depth:0.01});
      M.rb('trim',0.3,0.07,0.1,0.01,{x:0.5,y:0.28,z:0.07,seg:1});M.rb('flowers',0.26,0.07,0.08,0.02,{x:0.5,y:0.34,z:0.07,seg:1});},
    right:(M)=>{M.window({x:0,y:0.55,w:0.2,h:0.22,lintel:'stoneLight',sill:'stoneLight',depth:0.01});},
    left:(M)=>{M.window({x:0.2,y:0.55,w:0.2,h:0.22,lintel:'stoneLight',sill:'stoneLight',depth:0.01});},
    back:(M)=>{M.window({x:-0.35,y:0.55,w:0.2,h:0.22,lintel:'stoneLight',sill:'stoneLight',depth:0.01});}});
  M.roof('roof',{len:w+0.28,halfW:d/2+0.15,h:0.7,y:H-0.04});
  if(v!==2){M.push(0,0,0.32);M.rb('stoneWall',0.34,0.34,0.36,0.02,{y:H+0.05});M.roof('roof',{len:0.44,halfW:0.22,h:0.2,y:H+0.38,ry:Math.PI/2});
    M.window({x:0,y:H+0.22,w:0.15,h:0.15,depth:0.18});M.pop();}
  M.rb('stone',0.24,0.95,0.24,0.02,{x:0.48,y:1.05,z:-0.28});M.rb('stoneLight',0.3,0.06,0.3,0.01,{x:0.48,y:2.0,z:-0.28,seg:1});M.anchor('chim',0.48,2.08,-0.28);
  if(v!==1){// aile en retour d'équerre (plan en L) avec sa propre toiture
    M.push(-w/2-0.2,0,-d/2+0.42,0);M.rb('stoneWall',0.44,0.62,0.78,0.03,{});M.roof('roof',{len:0.84,halfW:0.28,h:0.36,y:0.58,ry:Math.PI/2});
    M.push(0,0,0.39);M.door({x:0,w:0.2,h:0.4,frame:'stoneLight',z:0.0});M.pop();M.push(-0.22,0,0,-Math.PI/2);M.window({x:0,y:0.36,w:0.16,h:0.18,lintel:'stoneLight',sill:'stoneLight',depth:0.01});M.pop();M.pop();}
  return M;}

export function house3(v){reseed(31+v*3);const M=new Model('house3_'+v);
  const w=1.7,d=1.4,H1=0.86,H2=0.74,J=0.07;
  M.rb('stoneWall',w,H1,d,0.03,{});
  M.rb('trim',w+2*J+0.04,0.08,d+2*J+0.04,0.015,{y:H1-0.02,seg:1});
  M.rb('wall',w+2*J,H2,d+2*J,0.02,{y:H1+0.06});M.prism('wall',w+2*J,d+2*J,0.82,{y:H1+0.06+H2});
  for(let k=0;k<9;k++)M.rb('trim',0.07,0.08,0.07,0.01,{x:-w/2+k*w/8,y:H1-0.08,z:d/2+0.03,seg:1});
  facades(M,w+2*J,d+2*J,{
    front:(M,l)=>{timber(M,l,H1+0.06,H1+0.06+H2,{posts:[-l/2+0.03,-0.3,0.3,l/2-0.03],braces:[[-0.62,1],[0.62,-1]]});
      for(const x of [-0.62,0,0.62])M.window({x,y:H1+0.45,w:0.2,h:0.24,shutters:x===0?null:'shutter',depth:0.03});
      M.rb('trim',0.34,0.07,0.1,0.01,{x:0,y:H1+0.24,z:0.08,seg:1});M.rb('flowers',0.3,0.08,0.08,0.02,{x:0,y:H1+0.3,z:0.08,seg:1});},
    right:(M,l)=>{timber(M,l,H1+0.06,H1+0.06+H2,{posts:[-l/2+0.03,0,l/2-0.03],braces:[[-0.35,1],[0.35,-1]]});M.window({x:0.36,y:H1+0.45,w:0.2,h:0.22,depth:0.03});},
    left:(M,l)=>{timber(M,l,H1+0.06,H1+0.06+H2,{posts:[-l/2+0.03,0,l/2-0.03]});M.window({x:-0.36,y:H1+0.45,w:0.2,h:0.22,depth:0.03});},
    back:(M,l)=>{timber(M,l,H1+0.06,H1+0.06+H2,{posts:[-l/2+0.03,0,l/2-0.03],braces:[[-0.5,1],[0.5,-1]]});}});
  facades(M,w,d,{front:(M)=>{M.push(0,0,-J);M.door({x:0,w:0.32,h:0.58,z:J,frame:'stoneLight'});
      for(const x of [-0.55,0.55])M.window({x,y:0.48,w:0.22,h:0.26,lintel:'stoneLight',sill:'stoneLight',shutters:'shutter',depth:J+0.01});
      // auvent de porte
      for(const x of [-0.22,0.22])M.cyl('trim',0.025,0.025,0.62,6,{x,z:J+0.3});M.roof('roof',{len:0.62,halfW:0.2,h:0.12,y:0.62,z:J+0.2,thick:0.05});M.pop();},
    right:(M)=>{M.window({x:0,y:0.48,w:0.2,h:0.22,lintel:'stoneLight',sill:'stoneLight',depth:0.01});},
    back:(M)=>{M.window({x:0.3,y:0.48,w:0.2,h:0.22,lintel:'stoneLight',sill:'stoneLight',depth:0.01});}});
  const Y=H1+0.06+H2;M.roof('roof',{len:w+0.42,halfW:d/2+0.24,h:0.84,y:Y-0.04});
  for(const x of [-0.48,0.48]){M.push(x,0,0.42);M.rb('wall',0.34,0.34,0.38,0.02,{y:Y+0.06});M.roof('roof',{len:0.44,halfW:0.23,h:0.2,y:Y+0.38,ry:Math.PI/2,thick:0.05});M.window({x:0,y:Y+0.24,w:0.15,h:0.15,depth:0.2});M.pop();}
  for(const x of [-0.6,0.6]){M.rb('stone',0.22,1.25,0.22,0.02,{x,y:Y-0.2,z:-0.38});M.rb('stoneLight',0.28,0.06,0.28,0.01,{x,y:Y+1.05,z:-0.38,seg:1});}
  M.anchor('chim',0.6,Y+1.12,-0.38);
  return M;}

export function hall(){reseed(41);const M=new Model('hall');
  const w=2.5,d=2.1,H=1.35;
  M.stones('stone',-w/2-0.05,w/2+0.05,d/2+0.03,0,0.14);M.stones('stone',-w/2-0.05,w/2+0.05,-d/2-0.03,0,0.14);
  M.stones('stone',-d/2,d/2,w/2+0.03,0,0.14,Math.PI/2);M.stones('stone',-d/2,d/2,w/2+0.03,0,0.14,-Math.PI/2);
  M.rb('stone',w+0.06,0.12,d+0.06,0.02,{});M.rb('wall',w,H,d,0.03,{y:0.12});M.prism('wall',w-0.02,d,1.0,{y:0.12+H});
  facades(M,w,d,{
    front:(M,l)=>{timber(M,l,0.12,0.12+H,{posts:[-l/2+0.04,-0.45,0.45,l/2-0.04],braces:[[-0.85,1],[0.85,-1]]});
      M.door({x:0,w:0.46,h:0.75,z:0.02});for(const x of [-0.85,0.85])M.window({x,y:0.7,w:0.3,h:0.32,shutters:'shutter',depth:0.03});
      for(const x of [-0.42,0.42])M.cyl('trim',0.04,0.04,1.15,8,{x,z:0.55});M.roof('hallRoof',{len:1.15,halfW:0.42,h:0.28,y:1.1,z:0.38,thick:0.06});
      M.rb('cloth',0.36,0.5,0.02,0.01,{x:0,y:0.88,z:0.06,seg:1});M.sph('gold',0.06,{x:0,y:1.15,z:0.08,det:0});},
    right:(M,l)=>{timber(M,l,0.12,0.12+H,{posts:[-l/2+0.04,0,l/2-0.04]});M.window({x:-0.5,y:0.7,w:0.26,h:0.3,depth:0.03});M.window({x:0.5,y:0.7,w:0.26,h:0.3,depth:0.03});},
    left:(M,l)=>{timber(M,l,0.12,0.12+H,{posts:[-l/2+0.04,0,l/2-0.04]});M.window({x:0.5,y:0.7,w:0.26,h:0.3,depth:0.03});},
    back:(M,l)=>{timber(M,l,0.12,0.12+H,{posts:[-l/2+0.04,0,l/2-0.04],braces:[[-0.6,1],[0.6,-1]]});}});
  M.roof('hallRoof',{len:w+0.36,halfW:d/2+0.22,h:1.05,y:0.12+H-0.05});
  // clocheton
  M.push(0.35,0,0);const by=0.12+H+0.62;for(const [x,z] of [[-0.2,-0.2],[0.2,-0.2],[-0.2,0.2],[0.2,0.2]])M.rb('trim',0.06,0.48,0.06,0.01,{x,y:by,z,seg:1});
  M.rb('trim',0.5,0.05,0.5,0.01,{y:by,seg:1});M.sph('gold',0.08,{y:by+0.3,det:1});M.cone('hallRoof',0.4,0.5,4,{y:by+0.48,ry:Math.PI/4});M.sph('gold',0.04,{y:by+1.0,det:0});M.pop();
  M.rb('stone',0.3,1.4,0.3,0.02,{x:-0.8,y:1.3,z:-0.5});M.rb('stoneLight',0.36,0.06,0.36,0.01,{x:-0.8,y:2.7,z:-0.5,seg:1});M.anchor('chim',-0.8,2.78,-0.5);
  M.anchor('flag',0.95,1.2,0.6);
  // puits
  M.push(1.72,0,1.25);for(let k=0;k<10;k++){const a=k/10*Math.PI*2;M.rb('stone',0.15,0.3,0.1,0.02,{x:Math.cos(a)*0.2,z:Math.sin(a)*0.2,ry:-a+Math.PI/2,seg:1});}
  M.cyl('waterDark',0.17,0.17,0.02,12,{y:0.24});for(const x of [-0.22,0.22])M.rb('trim',0.05,0.62,0.05,0.01,{x,seg:1});M.cyl('trim',0.03,0.03,0.5,6,{y:0.5,rz:Math.PI/2,c:true});
  M.roof('thatch',{len:0.6,halfW:0.26,h:0.2,y:0.6,thick:0.05});M.cyl('wood',0.06,0.05,0.1,8,{x:0.05,y:0.35});M.pop();
  for(const x of [-0.95,-0.68]){M.cyl('wood',0.12,0.11,0.3,10,{x,z:d/2+0.35});M.cyl('trim',0.122,0.122,0.02,10,{x,y:0.22,z:d/2+0.35});}
  return M;}

export function market(){reseed(51);const M=new Model('market');
  // place pavée avec bordure
  M.cyl('cobble',1.0,1.02,0.04,11,{});
  for(let k=0;k<26;k++){const a=k/26*Math.PI*2,r=0.98+Math.sin(k*1.7)*0.04;M.rb('stone',0.13+rnd()*0.06,0.07,0.08,0.02,{x:Math.cos(a)*r,z:Math.sin(a)*r,ry:-a+Math.PI/2,seg:1});}
  const fr=['fruitA','fruitB','fruitC'];
  const stall=(x,z,ry,awA,awB)=>{M.push(x,0,z,ry);
    for(const [px,pz] of [[-0.42,-0.32],[0.42,-0.32],[-0.42,0.3],[0.42,0.3]])M.rb('trim',0.05,0.95,0.05,0.01,{x:px,z:pz,seg:1});
    for(let k=0;k<5;k++)M.rb(k%2?awB:awA,0.19,0.025,0.82,0.008,{c:true,x:-0.38+k*0.19,y:0.95,z:0,rx:-0.2,seg:1});
    for(let k=0;k<5;k++)M.rb(k%2?awB:awA,0.19,0.13,0.015,0.004,{x:-0.38+k*0.19,y:0.76,z:0.41,seg:1});
    M.rb('wood',0.86,0.36,0.3,0.015,{z:0.16});M.rb('trim',0.9,0.035,0.34,0.008,{y:0.36,z:0.16,seg:1});
    for(let k=0;k<3;k++){const bx=-0.28+k*0.28;M.rb('basket',0.22,0.07,0.24,0.025,{x:bx,y:0.4,z:0.16,seg:1});for(let j=0;j<5;j++)M.sph(fr[(k+j)%3],0.04,{x:bx+(rnd()-0.5)*0.12,y:0.48,z:0.16+(rnd()-0.5)*0.14,det:0});}
    M.pop();};
  stall(-0.35,-0.38,0,'awnR','awnW');
  stall(0.48,0.32,-Math.PI/2,'shutter','awnW');
  // caisses, sacs, tonneaux et étal de légumes au sol
  for(const [x,z,h] of [[-0.75,0.45,0],[-0.55,0.62,0],[-0.66,0.53,0.22]])M.rb('wood',0.2,0.2,0.2,0.015,{x,y:h,z,ry:rnd()*0.5,seg:1});
  for(const [x,z] of [[-0.2,0.6],[-0.05,0.68]]){M.sph('cloth',0.09,{x,y:0.08,z,det:1});M.cyl('cloth',0.03,0.05,0.05,6,{x,y:0.17,z});}
  for(const [x,z] of [[0.75,-0.7],[0.55,-0.75]]){M.cyl('wood',0.1,0.09,0.26,10,{x,z});M.cyl('trim',0.102,0.102,0.02,10,{x,y:0.06,z});M.cyl('trim',0.102,0.102,0.02,10,{x,y:0.2,z});}
  M.rb('basket',0.3,0.08,0.22,0.03,{x:0.15,y:0.0,z:-0.75,seg:1});for(let j=0;j<7;j++)M.sph(fr[j%3],0.04,{x:0.15+(rnd()-0.5)*0.2,y:0.1,z:-0.75+(rnd()-0.5)*0.12,det:0});
  // banc
  M.rb('wood',0.5,0.04,0.14,0.01,{x:0.1,y:0.16,z:0.75,seg:1});for(const x of [-0.1,0.3])M.rb('wood',0.04,0.16,0.1,0.005,{x,z:0.75,seg:1});
  return M;}

export function store(){reseed(61);const M=new Model('store');
  const w=1.6,d=1.35,H=0.98;
  M.rb('stone',w+0.06,0.12,d+0.06,0.02,{});M.rb('barn',w,H,d,0.02,{y:0.1});M.prism('barn',w-0.02,d,0.72,{y:0.1+H});
  for(const sx of [-1,1])for(const sz of [-1,1])M.rb('trim',0.08,H,0.08,0.012,{x:sx*(w/2-0.02),y:0.1,z:sz*(d/2-0.02),seg:1});
  facades(M,w,d,{front:(M)=>{M.rb('trim',0.72,0.78,0.04,0.01,{z:0.02,y:0.1,seg:1});for(const sx of [-1,1]){M.box('barnDoor',0.32,0.72,0.03,{x:sx*0.17,y:0.13,z:0.04});
      M.rb('trim',0.04,0.8,0.02,0.005,{c:true,x:sx*0.17,y:0.49,z:0.06,rz:sx*0.42,seg:1});}M.rb('trim',0.7,0.05,0.02,0.005,{y:0.47,z:0.06,seg:1});
      M.rb('trim',0.34,0.3,0.03,0.01,{y:0.95,z:0.02,seg:1});M.box('dark',0.26,0.22,0.02,{y:0.99,z:0.04});}});
  M.roof('thatch',{len:w+0.3,halfW:d/2+0.18,h:0.76,y:0.1+H-0.04,thick:0.1});
  for(const [x,z] of [[-0.55,0.9],[-0.2,0.92]])M.cyl('hay',0.17,0.17,0.32,12,{c:true,x,y:0.17,z,rz:Math.PI/2});
  M.rb('hay',0.3,0.2,0.22,0.04,{x:0.55,z:0.9});M.rb('wood',0.26,0.22,0.26,0.02,{x:0.9,z:0.4,seg:1});
  M.rb('trim',0.06,0.06,0.5,0.01,{y:1.32,z:d/2+0.2,seg:1});M.cyl('dark',0.006,0.006,0.5,4,{y:1.06,z:d/2+0.42});M.sph('cloth',0.08,{y:0.78,z:d/2+0.42,det:1});
  for(const [x,y,z] of [[0.62,0,0.82],[0.84,0,0.82],[0.73,0.2,0.82]])M.rb('wood',0.2,0.2,0.2,0.015,{x,y,z,seg:1});
  for(let k=0;k<2;k++)M.rb('trim',0.04,1.2,0.04,0.01,{c:true,x:-0.9+k*0.2,y:0.58,z:-0.3,rz:0.18,seg:1});
  for(let k=0;k<5;k++)M.rb('trim',0.22,0.025,0.03,0.005,{c:true,x:-0.9+0.1-(k*0.04)+0.08,y:0.2+k*0.22,z:-0.3,seg:1});
  return M;}

export function workshop(){reseed(71);const M=new Model('workshop');
  const w=1.5,d=1.25;
  M.rb('stoneWall',w,0.45,d,0.02,{});M.rb('wall',w,0.45,d,0.02,{y:0.44});M.prism('wall',w-0.02,d,0.56,{y:0.89});
  facades(M,w,d,{front:(M,l)=>{timber(M,l,0.44,0.89,{posts:[-l/2+0.03,0,l/2-0.03]});M.door({x:0.25,w:0.3,h:0.55,frame:'trim',z:0.01,step:null});M.window({x:-0.4,y:0.66,w:0.22,h:0.18,depth:0.02});},
    right:(M,l)=>{timber(M,l,0.44,0.89,{posts:[-l/2+0.03,l/2-0.03]});},left:(M,l)=>{timber(M,l,0.44,0.89,{posts:[-l/2+0.03,l/2-0.03]});},back:(M,l)=>{timber(M,l,0.44,0.89,{posts:[-l/2+0.03,0,l/2-0.03]});}});
  M.roof('roof',{len:w+0.26,halfW:d/2+0.15,h:0.58,y:0.85,thick:0.06});
  M.rb('stone',0.32,1.35,0.32,0.03,{x:-0.5,y:0.35,z:-0.28});M.rb('stoneLight',0.38,0.06,0.38,0.01,{x:-0.5,y:1.7,z:-0.28,seg:1});M.anchor('chim',-0.5,1.78,-0.28);
  // appentis + forge
  M.push(0.95,0,0.1);for(const z of [-0.45,0.45])M.cyl('trim',0.03,0.03,0.7,6,{x:0.18,z});M.rb('roof',0.5,0.04,1.05,0.01,{c:true,x:0.05,y:0.74,rz:-0.35,seg:1});
  M.rb('metal',0.22,0.08,0.12,0.02,{y:0.22,seg:1});M.rb('dark',0.12,0.22,0.1,0.01,{});M.cyl('wood',0.1,0.09,0.24,10,{z:0.32});M.cyl('waterDark',0.085,0.085,0.01,10,{y:0.24,z:0.32});M.pop();
  M.anchor('forge',0.95,0.4,0.1);
  return M;}

export function chapel(){reseed(81);const M=new Model('chapel');
  const nx=-0.15,w=1.15,d=1.55,H=0.98;
  M.push(nx,0,0.1);
  M.rb('stone',w+0.1,0.1,d+0.1,0.02,{});M.rb('stoneWall',w,H,d,0.03,{y:0.08});M.push(0,0,0,Math.PI/2);M.prism('stoneWall',d-0.02,w,0.72,{y:0.08+H});M.pop();
  for(const sx of [-1,1])for(const z of [-0.45,0.25])M.rb('stoneLight',0.14,0.7,0.22,0.03,{x:sx*(w/2+0.06),z,seg:1});
  for(const sx of [-1,1])for(const z of [-0.45,0.25]){M.push(sx*(w/2),0,z-0.11,sx*Math.PI/2);M.rb('glass',0.12,0.36,0.02,0.01,{x:0.0,y:0.38,z:0.01,seg:1});M.rb('stoneLight',0.18,0.05,0.05,0.01,{y:0.75,z:0.02,seg:1});M.pop();}
  M.push(0,0,d/2);M.door({x:0,w:0.32,h:0.56,frame:'stoneLight',z:0.0});M.cyl('door',0.16,0.16,0.03,12,{c:true,y:0.56,z:0.025,rx:Math.PI/2});
  M.cyl('glass',0.15,0.15,0.03,14,{c:true,y:0.9,z:0.02,rx:Math.PI/2});M.cyl('stoneLight',0.18,0.18,0.02,14,{c:true,y:0.9,z:0.0,rx:Math.PI/2});
  for(let k=0;k<3;k++)M.rb('stone',0.6-k*0.1,0.05,0.12,0.01,{y:k*0.05,z:0.08+0.12*(2-k),seg:1});M.pop();
  M.push(0,0,0,Math.PI/2);M.roof('roofS',{len:d+0.2,halfW:w/2+0.14,h:0.76,y:0.08+H-0.04});M.pop();
  M.pop();
  // clocher
  M.push(0.58,0,-0.45);M.rb('stoneWall',0.6,1.75,0.6,0.03,{});M.rb('stoneLight',0.66,0.08,0.66,0.01,{y:1.15,seg:1});
  for(const [x,z,ry] of [[0,0.3,0],[0.3,0,Math.PI/2],[0,-0.3,Math.PI],[-0.3,0,-Math.PI/2]]){M.push(x,0,z,ry);M.box('dark',0.24,0.3,0.02,{y:1.3,z:0.01});for(let k=0;k<3;k++)M.box('trim',0.24,0.03,0.03,{y:1.36+k*0.08,z:0.025,rx:0.5});M.pop();}
  M.sph('gold',0.09,{y:1.4,det:1});M.rb('stoneLight',0.68,0.06,0.68,0.01,{y:1.73,seg:1});
  M.cone('roofS',0.46,1.15,4,{y:1.78,ry:Math.PI/4});M.sph('gold',0.05,{y:2.95,det:0});M.cyl('gold',0.012,0.012,0.22,4,{y:2.95});M.pop();
  // pierres tombales / bancs
  // petit cimetière clos : muret, croix et stèles, massifs fleuris
  M.rb('stone',0.07,0.16,1.0,0.02,{x:-0.97,z:0.45,seg:1});M.rb('stone',0.5,0.16,0.07,0.02,{x:-0.74,z:0.96,seg:1});
  for(const [x,z] of [[-0.97,-0.06],[-0.47,0.96]])M.rb('stoneLight',0.1,0.26,0.1,0.02,{x,z,seg:1});
  for(const [x,z,k] of [[-0.85,0.25,0],[-0.85,0.5,1],[-0.85,0.75,0],[-0.62,0.3,1],[-0.62,0.58,0]]){
    if(k){M.rb('stoneLight',0.035,0.22,0.03,0.006,{x,z,seg:1});M.rb('stoneLight',0.12,0.035,0.03,0.006,{x,y:0.14,z,seg:1});}
    else{M.rb('stoneLight',0.11,0.2,0.04,0.02,{x,z,seg:1});}
    M.rb('flowers',0.1,0.025,0.16,0.01,{x,z:z+0.1,seg:1});}
  for(const sx of [-1,1])M.rb('flowers',0.18,0.06,0.12,0.02,{x:-0.15+sx*0.3,z:0.1+0.85,seg:1});
  return M;}


// variantes supplémentaires de maison en bois (chaumière à porche, maison à appentis)
export function house1b(v){reseed(41+v*13);const M=new Model('house1_'+v);
  const w=v===3?1.36:1.4,d=v===3?1.12:1.12,H=v===3?0.66:0.78,y0=0.1;
  M.stones('stone',-w/2-0.04,w/2+0.04,d/2+0.02,0,0.12);M.stones('stone',-w/2-0.04,w/2+0.04,-d/2-0.02,0,0.12);
  M.stones('stone',-d/2,d/2,w/2+0.02,0,0.12,Math.PI/2);M.stones('stone',-d/2,d/2,w/2+0.02,0,0.12,-Math.PI/2);
  M.rb('stone',w+0.04,0.1,d+0.04,0.02,{});
  if(v===3){M.rb('wall',w,H,d,0.03,{y:y0});M.prism('wall',w-0.02,d,0.5,{y:y0+H});}
  else{M.rb('stoneWall',w,0.36,d,0.02,{y:y0});M.rb('wood',w-0.01,H-0.36,d-0.01,0.015,{y:y0+0.36});
    for(let k=0;k<5;k++)M.rb('trim',w+0.01,0.018,d+0.01,0.004,{y:y0+0.42+k*0.085,seg:1});M.prism('wood',w-0.02,d,0.5,{y:y0+H});}
  facades(M,w,d,{
    front:(M)=>{M.door({x:v===3?0.18:-0.2,w:0.25,h:0.44,z:0.02});
      if(v===3){M.window({x:-0.36,y:y0+0.36,w:0.24,h:0.2,shutters:'shutter',depth:0.04});M.rb('trim',0.3,0.06,0.1,0.01,{x:-0.36,y:y0+0.18,z:0.08,seg:1});M.rb('flowers',0.26,0.08,0.08,0.02,{x:-0.36,y:y0+0.24,z:0.08,seg:1});}
      else{M.window({x:0.3,y:y0+0.5,w:0.2,h:0.2,shutters:'shutter',depth:0.03});M.window({x:-0.2,y:y0+0.62,w:0.14,h:0.12,depth:0.03});}},
    right:(M)=>{M.window({x:0,y:y0+0.4,w:0.18,h:0.18,depth:0.03,shutters:v===3?'shutter':null});},
    left:(M)=>{M.window({x:0.15,y:y0+0.4,w:0.18,h:0.18,depth:0.03});},
    back:(M)=>{M.window({x:-0.25,y:y0+0.4,w:0.18,h:0.18,depth:0.03});}});
  if(v===3){M.roof('thatch',{len:w+0.34,halfW:d/2+0.2,h:0.66,y:y0+H-0.04,thick:0.12});
    // porche à deux poteaux et petit auvent de chaume
    M.push(0.18,0,d/2+0.2);for(const x of [-0.2,0.2])M.cyl('wood',0.025,0.028,0.56,6,{x,y:0});M.roof('thatch',{len:0.56,halfW:0.22,h:0.14,y:0.54,thick:0.06,ry:Math.PI/2});M.rb('wood',0.5,0.04,0.36,0.01,{y:0,seg:1});M.pop();
    M.cyl('wood',0.08,0.07,0.2,10,{x:-w/2+0.16,z:d/2+0.14});M.cyl('trim',0.082,0.082,0.02,10,{x:-w/2+0.16,y:0.16,z:d/2+0.14});
    M.rb('stone',0.18,0.9,0.18,0.02,{x:-0.36,y:0.5,z:-0.26});M.anchor('chim',-0.36,1.45,-0.26);}
  else{M.roof('roof',{len:w+0.28,halfW:d/2+0.15,h:0.6,y:y0+H-0.04});
    // appentis latéral avec bûches
    M.push(w/2+0.14,0,0);M.rb('wood',0.26,0.46,0.8,0.01,{y:0.04,x:-0.02});M.roof('roof',{len:0.84,halfW:0.2,h:0.1,y:0.5,ry:Math.PI/2});
    for(let k=0;k<6;k++)M.cyl('log',0.035,0.035,0.24,7,{x:0.15,y:0.06+(k>2?0.07:0),z:-0.2+(k%3)*0.2,rx:Math.PI/2,c:true});M.pop();
    M.rb('stone',0.2,1.1,0.2,0.02,{x:-0.4,y:0.62,z:-0.28});M.rb('stone',0.26,0.05,0.26,0.01,{x:-0.4,y:1.72,z:-0.28,seg:1});M.anchor('chim',-0.4,1.8,-0.28);}
  return M;}

export const ALL={mill,sails,cart,house1_0:()=>house1(0),house1_1:()=>house1(1),house1_2:()=>house1(2),house1_3:()=>house1b(3),house1_4:()=>house1b(4),house2_0:()=>house2(0),house2_1:()=>house2(1),house2_2:()=>house2(2),
  house3_0:()=>house3(0),house3_1:()=>house3(1),hall,market,store,workshop,chapel};

// ---- villageois (pièces instanciées, couleurs de sommets ; blanc = teinte par instance) ----
const VPAL={cloth:[1,1,1],dark:[0.55,0.55,0.55],belt:[0.32,0.22,0.14],buckle:[0.9,0.78,0.4],skin:[1,1,1],hair:[0.32,0.24,0.18],eye:[0.08,0.06,0.05],collar:[0.92,0.9,0.85],band:[0.45,0.3,0.18]};
export function vBody(){const M=new Model('vBody');
  M.cyl('cloth',0.07,0.115,0.26,10,{y:0.18});M.cyl('dark',0.118,0.122,0.035,10,{y:0.18});
  M.cyl('belt',0.093,0.097,0.03,10,{y:0.29});M.box('buckle',0.03,0.025,0.012,{y:0.292,z:0.095});
  M.sph('cloth',0.075,{y:0.43,det:1});M.cyl('collar',0.05,0.06,0.025,10,{y:0.45});
  return M;}
export function vHead(){const M=new Model('vHead');
  M.sph('skin',0.085,{y:0.555,det:1});M.box('skin',0.026,0.03,0.03,{y:0.54,z:0.085});
  M.sph('hair',0.09,{y:0.575,z:-0.018,det:1});
  for(const x of [-0.03,0.03])M.box('eye',0.016,0.018,0.01,{x,y:0.56,z:0.081});
  return M;}
export function vHatFarm(){const M=new Model('vHatFarm');M.cyl('cloth',0.16,0.16,0.012,14,{y:0.6});M.cyl('cloth',0.06,0.075,0.07,12,{y:0.6});M.cyl('band',0.077,0.077,0.018,12,{y:0.61});return M;}
export function vHatHood(){const M=new Model('vHatHood');M.sph('cloth',0.1,{y:0.57,z:-0.012,det:1});M.cone('cloth',0.05,0.12,8,{y:0.6,z:-0.07,rx:-0.9});return M;}
export function vHatCap(){const M=new Model('vHatCap');M.sph('cloth',0.093,{y:0.585,det:1});M.box('cloth',0.12,0.012,0.08,{y:0.6,z:0.08});return M;}
export function vHatBeret(){const M=new Model('vHatBeret');M.cyl('cloth',0.1,0.085,0.035,14,{y:0.615,rz:0.15});M.sph('band',0.015,{y:0.66,det:0});return M;}
export function vHatFish(){const M=new Model('vHatFish');M.cyl('cloth',0.13,0.15,0.03,14,{y:0.59});M.cyl('cloth',0.07,0.09,0.06,12,{y:0.61});return M;}
export const VC={vBody:()=>vBody().bakeVC(VPAL),vHead:()=>vHead().bakeVC(VPAL),vHatFarm:()=>vHatFarm().bakeVC(VPAL),vHatHood:()=>vHatHood().bakeVC(VPAL),vHatCap:()=>vHatCap().bakeVC(VPAL),vHatBeret:()=>vHatBeret().bakeVC(VPAL),vHatFish:()=>vHatFish().bakeVC(VPAL)};

// ---- décor : moulin à vent, ailes, charrette ----
export function mill(){reseed(91);const M=new Model('mill');
  M.cyl('stoneWall',0.42,0.55,1.6,12,{});M.cyl('stoneLight',0.57,0.57,0.1,12,{});M.cyl('trim',0.45,0.45,0.06,12,{y:1.58});
  M.cone('roof',0.55,0.7,12,{y:1.62});M.sph('gold',0.04,{y:2.33,det:0});
  M.push(0,0,0.5);M.door({x:0,w:0.24,h:0.42,z:0.0,frame:'stoneLight'});M.pop();
  M.push(0,0,0.42);M.window({x:0,y:1.05,w:0.14,h:0.16,depth:0.0,lintel:'stoneLight'});M.pop();
  M.cyl('trim',0.07,0.07,0.3,8,{c:true,y:1.45,z:0.55,rx:Math.PI/2});M.anchor('hub',0,1.45,0.72);
  for(const [x,z] of [[0.75,0.2],[0.85,-0.15]])M.cyl('hay',0.15,0.15,0.28,12,{c:true,x,y:0.15,z,rz:Math.PI/2});
  M.rb('wood',0.3,0.22,0.3,0.02,{x:-0.7,z:0.35,seg:1});
  return M;}
export function sails(){reseed(92);const M=new Model('sails');
  for(let k=0;k<4;k++){const a=k*Math.PI/2;M.push(0,0,0,0);
    const cx=Math.cos(a),cy=Math.sin(a);
    M.rb('trim',0.05,1.15,0.04,0.01,{c:true,x:cx*0.6,y:cy*0.6,rz:a-Math.PI/2});
    M.rb('awnW',0.18,0.85,0.015,0.005,{c:true,x:cx*0.68-sy(a)*0.1,y:cy*0.68+cx*0.1,rz:a-Math.PI/2});M.pop();}
  M.cyl('trim',0.08,0.08,0.08,8,{c:true,rx:Math.PI/2});
  return M;}
function sy(a){return Math.sin(a);}
export function cart(){reseed(93);const M=new Model('cart');
  M.rb('wood',0.7,0.06,0.42,0.01,{y:0.2,seg:1});for(const z of [-0.2,0.2])M.rb('wood',0.7,0.14,0.03,0.005,{y:0.26,z,seg:1});
  for(const z of [-0.25,0.25]){M.cyl('trim',0.17,0.17,0.04,12,{c:true,y:0.17,z,rx:Math.PI/2,x:0.05});M.cyl('metal',0.04,0.04,0.06,8,{c:true,y:0.17,z,rx:Math.PI/2,x:0.05});}
  for(const z of [-0.12,0.12])M.rb('trim',0.55,0.035,0.035,0.005,{c:true,x:-0.55,y:0.18,z,rz:0.25,seg:1});
  M.rb('hay',0.6,0.18,0.36,0.06,{y:0.24});
  return M;}
