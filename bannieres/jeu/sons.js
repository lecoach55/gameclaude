'use strict';
/* BANNIÈRES & SORTILÈGES — sons et musique synthétisés (Web Audio), rien à télécharger */
var SON=(()=>{let ac=null,maitre=null,musG=null,actif=true,musique=true;try{actif=localStorage.getItem('bs-son')!=='0';musique=localStorage.getItem('bs-mus')!=='0';}catch(e){}
 const ctx=()=>{if(!ac){try{ac=new(window.AudioContext||window.webkitAudioContext)();maitre=ac.createGain();maitre.gain.value=.5;maitre.connect(ac.destination);musG=ac.createGain();musG.gain.value=.55;musG.connect(maitre);}catch(e){}}if(ac&&ac.state==='suspended')ac.resume();return ac;};
 const note=(f,t,d,type='triangle',v=.3,dest)=>{const a=ctx();if(!a)return;const o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(dest||maitre);o.start(t);o.stop(t+d+.05);};
 const bruit=(t,d,v=.3,f=1200)=>{const a=ctx();if(!a)return;const b=a.createBuffer(1,a.sampleRate*d,a.sampleRate);const x=b.getChannelData(0);for(let i=0;i<x.length;i++)x[i]=(Math.random()*2-1)*(1-i/x.length);const s=a.createBufferSource();s.buffer=b;const fl=a.createBiquadFilter();fl.type='bandpass';fl.frequency.value=f;const g=a.createGain();g.gain.value=v;s.connect(fl);fl.connect(g);g.connect(maitre);s.start(t);};
 // échantillons (bruitages Kenney, CC0) : intégrés dans la page construite, sinon chargés depuis snd/
 const ECH={},ENC={};
 const charger=n=>{if(ECH[n]||ENC[n])return;const a=ctx();if(!a)return;ENC[n]=1;const el=document.getElementById('snd-'+n);
  const p=el?Promise.resolve(Uint8Array.from(atob(el.textContent.trim()),c=>c.charCodeAt(0)).buffer):fetch('snd/'+n+'.mp3').then(r=>r.arrayBuffer());
  p.then(b=>a.decodeAudioData(b)).then(buf=>{ECH[n]=buf;}).catch(()=>{});};
 const LISTE=['footstep00','footstep01','footstep02','footstep03','handleCoins','handleCoins2','knifeSlice','knifeSlice2','chop','drawKnife1','bookOpen','bookFlip1','bookClose','doorOpen_1','doorClose_1','metalLatch','metalClick','cloth1','dropLeather','metalPot1','beltHandle1'];
 const ech=(l,v=.5,pv=.06)=>{if(!actif)return false;const a=ctx();if(!a)return false;const n=Array.isArray(l)?l[(Math.random()*l.length)|0]:l;if(!ECH[n]){charger(n);return false;}
  const s=a.createBufferSource();s.buffer=ECH[n];s.playbackRate.value=1+(Math.random()*2-1)*pv;const g=a.createGain();g.gain.value=v;s.connect(g);g.connect(maitre);s.start();return true;};
 const S={
  precharger(){LISTE.forEach(charger);},
  porte(o){ech(o?'doorOpen_1':'doorClose_1',.45);},livre(o){ech(o?'bookOpen':'bookClose',.5);},page(){ech('bookFlip1',.45);},
  recrue(){ech(['beltHandle1','cloth1'],.55);},objet(){ech('dropLeather',.6);},
  clic(){if(!actif)return;if(ech('metalClick',.25,.1))return;const a=ctx();if(!a)return;note(880,a.currentTime,.06,'square',.06);},
  pas(){if(!actif)return;if(ech(['footstep00','footstep01','footstep02','footstep03'],.28,.08))return;const a=ctx();if(!a)return;bruit(a.currentTime,.07,.12,500);},
  piece(){if(!actif)return;if(ech(['handleCoins','handleCoins2'],.55))return;const a=ctx();if(!a)return;const t=a.currentTime;note(1320,t,.12,'square',.08);note(1760,t+.07,.2,'square',.07);},
  coup(){if(!actif)return;const a=ctx();if(!a)return;const t=a.currentTime;if(ech(['knifeSlice','knifeSlice2','chop'],.6)){note(90,t,.12,'sine',.18);return;}bruit(t,.18,.5,900);note(110,t,.15,'sawtooth',.15);},
  tir(){if(!actif)return;const a=ctx();if(!a)return;const t=a.currentTime;bruit(t,.12,.25,3000);},
  sort(){if(!actif)return;const a=ctx();if(!a)return;const t=a.currentTime;for(let i=0;i<6;i++)note(660*Math.pow(1.26,i),t+i*.05,.3,'sine',.08);},
  mort(){if(!actif)return;const a=ctx();if(!a)return;const t=a.currentTime;note(220,t,.4,'sawtooth',.08);note(165,t+.12,.5,'sawtooth',.07);},
  fanfare(){if(!actif)return;const a=ctx();if(!a)return;const t=a.currentTime;[523,659,784,1047,784,1047].forEach((f,i)=>note(f,t+i*.14,.35,'square',.09));},
  defaite(){if(!actif)return;const a=ctx();if(!a)return;const t=a.currentTime;[392,349,311,262].forEach((f,i)=>note(f,t+i*.25,.5,'triangle',.12));},
  jour(){if(!actif)return;const a=ctx();if(!a)return;const t=a.currentTime;note(784,t,.9,'sine',.12);note(1175,t+.02,.9,'sine',.06);},
  construire(){if(!actif)return;ech('metalLatch',.5);ech('chop',.4);const a=ctx();if(!a)return;const t=a.currentTime;for(let i=0;i<3;i++){bruit(t+i*.15,.08,.4,700);}},
 };
 // musique générative reprise de Valdragon (harpe, nappes, bourdon ; tambours en combat), passée dans une réverbération
 const MODES={carte:{root:55,sc:[0,2,4,5,7,9,11],prog:[0,5,3,4],bpm:64},bastion:{root:53,sc:[0,2,4,5,7,9,11],prog:[0,3,4,0],bpm:70},sylve:{root:50,sc:[0,2,3,5,7,9,10],prog:[0,3,6,4],bpm:62},
  necro:{root:50,sc:[0,2,3,5,7,8,10],prog:[0,5,3,6],bpm:56},combat:{root:52,sc:[0,1,3,5,7,8,10],prog:[0,1,6,5],bpm:66}};
 const M={on:false,mode:'carte',next:0,step:0,bar:0,timer:null,chord:null};let mus=null;
 const hz=m=>440*Math.pow(2,(m-69)/12);
 function bus(){const a=ctx();if(!a)return null;if(mus)return mus;mus=a.createGain();mus.gain.value=0;const rev=a.createConvolver();const n=Math.floor(a.sampleRate*2.6),b=a.createBuffer(2,n,a.sampleRate);for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,3);}rev.buffer=b;const wet=a.createGain();wet.gain.value=.35;mus.connect(musG);mus.connect(rev);rev.connect(wet);wet.connect(musG);return mus;}
 function harpe(t,m,v){const a=ac,o=a.createOscillator(),o2=a.createOscillator(),g=a.createGain(),f=a.createBiquadFilter();o.type='triangle';o2.type='sine';o.frequency.value=hz(m);o2.frequency.value=hz(m)*2.003;f.type='lowpass';f.frequency.setValueAtTime(3200,t);f.frequency.exponentialRampToValueAtTime(700,t+1.2);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.006);g.gain.exponentialRampToValueAtTime(.0008,t+2.4);const g2=a.createGain();g2.gain.value=.25;o.connect(f);o2.connect(g2);g2.connect(f);f.connect(g);g.connect(mus);o.start(t);o2.start(t);o.stop(t+2.5);o2.stop(t+2.5);}
 function nappe(t,ms,d,v){const a=ac,g=a.createGain(),f=a.createBiquadFilter();f.type='lowpass';f.frequency.value=650;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+d*.35);g.gain.linearRampToValueAtTime(v*.8,t+d*.8);g.gain.linearRampToValueAtTime(0,t+d*1.05);ms.forEach(m=>[-6,6].forEach(dt=>{const o=a.createOscillator();o.type='sawtooth';o.frequency.value=hz(m);o.detune.value=dt;o.connect(f);o.start(t);o.stop(t+d*1.1);}));f.connect(g);g.connect(mus);}
 function bourdon(t,m,d,v){const a=ac,o=a.createOscillator(),g=a.createGain();o.type='sine';o.frequency.value=hz(m);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+1.5);g.gain.linearRampToValueAtTime(0,t+d);o.connect(g);g.connect(mus);o.start(t);o.stop(t+d+.1);}
 function tambour(t,v,bas){const a=ac,o=a.createOscillator(),g=a.createGain();o.type='sine';o.frequency.setValueAtTime(bas?95:150,t);o.frequency.exponentialRampToValueAtTime(bas?42:70,t+.25);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+.45);o.connect(g);g.connect(mus);o.start(t);o.stop(t+.5);}
 function tic(){if(!M.on||!ac)return;if(!musique||!actif){mus.gain.setTargetAtTime(0,ac.currentTime,.3);return;}mus.gain.setTargetAtTime(1,ac.currentTime,.8);const md=MODES[M.mode]||MODES.carte,bat=M.mode==='combat',spb=60/(md.bpm*(bat?1.35:1))/2;
  while(M.next<ac.currentTime+.4){const t=Math.max(M.next,ac.currentTime+.02),s=M.step%16;
   if(s===0){const deg=md.prog[M.bar%md.prog.length],ch=[0,2,4].map(i=>md.root+md.sc[(deg+i)%7]+12*Math.floor((deg+i)/7));nappe(t,ch.map(x=>x+12),spb*16,bat?.022:.03);if(M.bar%2===0)bourdon(t,md.root-12,spb*32,.05);M.chord=ch;M.bar++;}
   const ch=M.chord||[md.root,md.root+4,md.root+7];
   if(s%2===0&&Math.random()<(s%4===0?.85:.45))harpe(t,ch[(Math.random()*3)|0]+24+(Math.random()<.25?12:0),.045+Math.random()*.03);
   if(s===6&&Math.random()<.5||s===14&&Math.random()<.35){const d=(Math.random()*7)|0;harpe(t,md.root+36+md.sc[d],.05);}
   if(bat){if(s%8===0)tambour(t,.32,true);if(s%8===4)tambour(t,.12,false);if(s===14)tambour(t,.18,true);}
   M.step++;M.next=t+spb;}}
 S.musique=m=>{if(m)M.mode=m;if(!ctx())return;bus();if(!M.on){M.on=true;M.next=ac.currentTime+.3;M.timer=setInterval(tic,120);}};
 S.basculerSon=()=>{actif=!actif;try{localStorage.setItem('bs-son',actif?'1':'0');}catch(e){}return actif;};
 S.basculerMusique=()=>{musique=!musique;try{localStorage.setItem('bs-mus',musique?'1':'0');}catch(e){}return musique;};
 S.etat=()=>({actif,musique});S.debloquer=()=>{const a=ctx();if(a)S.precharger();return a;};
 return S;})();
