'use strict';
/* BANNIÈRES & SORTILÈGES — sons et musique synthétisés (Web Audio), rien à télécharger */
var SON=(()=>{let ac=null,maitre=null,musG=null,mus=null,actif=true,musique=true;try{actif=localStorage.getItem('bs-son')!=='0';musique=localStorage.getItem('bs-mus')!=='0';}catch(e){}
 const ctx=()=>{if(!ac){try{ac=new(window.AudioContext||window.webkitAudioContext)();maitre=ac.createGain();maitre.gain.value=.5;maitre.connect(ac.destination);musG=ac.createGain();musG.gain.value=.22;musG.connect(maitre);}catch(e){}}if(ac&&ac.state==='suspended')ac.resume();return ac;};
 const note=(f,t,d,type='triangle',v=.3,dest)=>{const a=ctx();if(!a)return;const o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(dest||maitre);o.start(t);o.stop(t+d+.05);};
 const bruit=(t,d,v=.3,f=1200)=>{const a=ctx();if(!a)return;const b=a.createBuffer(1,a.sampleRate*d,a.sampleRate);const x=b.getChannelData(0);for(let i=0;i<x.length;i++)x[i]=(Math.random()*2-1)*(1-i/x.length);const s=a.createBufferSource();s.buffer=b;const fl=a.createBiquadFilter();fl.type='bandpass';fl.frequency.value=f;const g=a.createGain();g.gain.value=v;s.connect(fl);fl.connect(g);g.connect(maitre);s.start(t);};
 const S={
  clic(){if(!actif)return;const a=ctx();if(!a)return;note(880,a.currentTime,.06,'square',.06);},
  pas(){if(!actif)return;const a=ctx();if(!a)return;bruit(a.currentTime,.07,.12,500);},
  piece(){if(!actif)return;const a=ctx();if(!a)return;const t=a.currentTime;note(1320,t,.12,'square',.08);note(1760,t+.07,.2,'square',.07);},
  coup(){if(!actif)return;const a=ctx();if(!a)return;const t=a.currentTime;bruit(t,.18,.5,900);note(110,t,.15,'sawtooth',.15);},
  tir(){if(!actif)return;const a=ctx();if(!a)return;const t=a.currentTime;bruit(t,.12,.25,3000);},
  sort(){if(!actif)return;const a=ctx();if(!a)return;const t=a.currentTime;for(let i=0;i<6;i++)note(660*Math.pow(1.26,i),t+i*.05,.3,'sine',.08);},
  mort(){if(!actif)return;const a=ctx();if(!a)return;const t=a.currentTime;note(220,t,.4,'sawtooth',.08);note(165,t+.12,.5,'sawtooth',.07);},
  fanfare(){if(!actif)return;const a=ctx();if(!a)return;const t=a.currentTime;[523,659,784,1047,784,1047].forEach((f,i)=>note(f,t+i*.14,.35,'square',.09));},
  defaite(){if(!actif)return;const a=ctx();if(!a)return;const t=a.currentTime;[392,349,311,262].forEach((f,i)=>note(f,t+i*.25,.5,'triangle',.12));},
  jour(){if(!actif)return;const a=ctx();if(!a)return;const t=a.currentTime;note(784,t,.9,'sine',.12);note(1175,t+.02,.9,'sine',.06);},
  construire(){if(!actif)return;const a=ctx();if(!a)return;const t=a.currentTime;for(let i=0;i<3;i++){bruit(t+i*.15,.08,.4,700);}},
 };
 // musique : arpèges de luth sur une gamme modale, plus vive en combat
 let pas=0,mode='carte',timer=null;const GAM={carte:[0,2,3,5,7,9,10],combat:[0,1,3,5,7,8,10]};
 function boucle(){if(!musique||!actif){timer=null;return;}const a=ctx();if(!a){timer=null;return;}const t=a.currentTime+.05;const g=GAM[mode];const base=mode==='combat'?146.8:130.8;const bpm=mode==='combat'?132:84;const d=60/bpm/2;
  const accords=[0,5,3,4];const ac2=accords[Math.floor(pas/16)%4];
  for(let i=0;i<8;i++){const st=pas+i;const deg=[0,2,4,7,4,2,4,6][st%8]+ac2;const f=base*Math.pow(2,(g[deg%7]+12*Math.floor(deg/7))/12);note(f*2,t+i*d,d*2.2,'triangle',.11,musG);if(st%8===0)note(base/2*Math.pow(2,g[ac2%7]/12),t+i*d,d*7,'sine',.16,musG);}
  pas+=8;timer=setTimeout(boucle,d*8*1000-30);}
 S.musique=m=>{mode=m||mode;if(!timer&&musique&&actif)boucle();};
 S.basculerSon=()=>{actif=!actif;try{localStorage.setItem('bs-son',actif?'1':'0');}catch(e){}if(actif)S.musique();return actif;};
 S.basculerMusique=()=>{musique=!musique;try{localStorage.setItem('bs-mus',musique?'1':'0');}catch(e){}if(musique)S.musique();return musique;};
 S.etat=()=>({actif,musique});S.debloquer=()=>ctx();
 return S;})();
