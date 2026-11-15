'use strict';
/* Cage & Gloire — sons synthétisés (Web Audio) : cloche, coups, foule. Aucun fichier. */
var Son=(function(){
let C=null,M=null,foule=null,fouleG=null,actif=true,exc=0;
try{actif=localStorage.getItem('cg-son')!=='0';}catch(e){}
function ctx(){if(C)return C;try{C=new (window.AudioContext||window.webkitAudioContext)();M=C.createGain();M.gain.value=.8;M.connect(C.destination);}catch(e){C=null;}return C;}
function bruit(sec){const c=ctx();const n=Math.floor(c.sampleRate*sec),b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0);let l=0;for(let i=0;i<n;i++){const w=Math.random()*2-1;l=(l+.02*w)/1.02;d[i]=w*.5+l*3;}return b;}
let BR=null;
function reveil(){const c=ctx();if(c&&c.state==='suspended')c.resume();}
function cloche(n=1){if(!actif||!ctx())return;const c=C;for(let k=0;k<n;k++){const t=c.currentTime+k*.42;
 [[523,1],[1046,.5],[1568,.3],[2093,.18],[2794,.1]].forEach(([f,a])=>{const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=f*(1+Math.random()*.003);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.32*a,t+.005);g.gain.exponentialRampToValueAtTime(.0005,t+2.2);o.connect(g);g.connect(M);o.start(t);o.stop(t+2.3);});}}
function coup(force=1,corps=false){if(!actif||!ctx())return;const c=C,t=c.currentTime;if(!BR)BR=bruit(1);
 // claquement
 const s=c.createBufferSource();s.buffer=BR;const f=c.createBiquadFilter();f.type='bandpass';f.frequency.value=corps?900:1800+Math.random()*600;f.Q.value=.8;const g=c.createGain();
 g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.5*force,t+.004);g.gain.exponentialRampToValueAtTime(.0005,t+.09+force*.03);s.connect(f);f.connect(g);g.connect(M);s.start(t,Math.random()*.5,.2);
 // impact grave
 const o=c.createOscillator(),g2=c.createGain();o.type='sine';o.frequency.setValueAtTime(corps?120:150,t);o.frequency.exponentialRampToValueAtTime(45,t+.12);g2.gain.setValueAtTime(.0001,t);g2.gain.exponentialRampToValueAtTime(.55*force,t+.006);g2.gain.exponentialRampToValueAtTime(.0005,t+.16);o.connect(g2);g2.connect(M);o.start(t);o.stop(t+.2);
 if(force>1.3)clameur(.6);}
function souffle(){if(!actif||!ctx())return;const c=C,t=c.currentTime;if(!BR)BR=bruit(1);const s=c.createBufferSource();s.buffer=BR;const f=c.createBiquadFilter();f.type='highpass';f.frequency.value=2500;const g=c.createGain();
 g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.08,t+.03);g.gain.exponentialRampToValueAtTime(.0005,t+.18);s.connect(f);f.connect(g);g.connect(M);s.start(t,Math.random()*.5,.25);}
function chute(){if(!actif||!ctx())return;coup(1.1,true);setTimeout(()=>coup(.6,true),90);}
function demarrerFoule(){if(!actif||!ctx()||foule)return;const c=C;const b=bruit(4);foule=c.createBufferSource();foule.buffer=b;foule.loop=true;
 const f1=c.createBiquadFilter();f1.type='bandpass';f1.frequency.value=650;f1.Q.value=.5;const f2=c.createBiquadFilter();f2.type='lowpass';f2.frequency.value=2200;
 fouleG=c.createGain();fouleG.gain.value=.0001;foule.connect(f1);f1.connect(f2);f2.connect(fouleG);fouleG.connect(M);foule.start();fouleG.gain.linearRampToValueAtTime(.12,c.currentTime+1.5);}
function arreterFoule(){if(foule){try{fouleG.gain.linearRampToValueAtTime(.0001,C.currentTime+.6);const f=foule;setTimeout(()=>{try{f.stop();}catch(e){}},700);}catch(e){}foule=null;}}
function clameur(k=1){if(!actif||!fouleG)return;const t=C.currentTime;fouleG.gain.cancelScheduledValues(t);fouleG.gain.setValueAtTime(fouleG.gain.value,t);fouleG.gain.linearRampToValueAtTime(.12+.32*k,t+.25);fouleG.gain.linearRampToValueAtTime(.12,t+1.6+k*1.5);}
function basculer(){actif=!actif;try{localStorage.setItem('cg-son',actif?'1':'0');}catch(e){}if(!actif)arreterFoule();return actif;}
return {reveil,cloche,coup,souffle,chute,demarrerFoule,arreterFoule,clameur,basculer,get actif(){return actif;}};
})();
