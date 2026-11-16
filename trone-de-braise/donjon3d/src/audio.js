// ===== Valdragon · moteur audio : bus, réverbération, variations, musique générative =====
export const AU={ctx:null,bus:null,sfx:null,wet:null,mus:null,on:false};
function impulse(a,sec,decay){const n=Math.floor(a.sampleRate*sec),b=a.createBuffer(2,n,a.sampleRate);for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<n;i++){const t=i/n;d[i]=(Math.random()*2-1)*Math.pow(1-t,decay)*(i<a.sampleRate*.012?i/(a.sampleRate*.012):1);}}return b;}
export function initAudio(a){if(AU.ctx===a)return AU;AU.ctx=a;
 const comp=a.createDynamicsCompressor();comp.threshold.value=-16;comp.ratio.value=3.5;comp.attack.value=.004;comp.release.value=.2;comp.connect(a.destination);
 AU.bus=a.createGain();AU.bus.gain.value=1;AU.bus.connect(comp);
 AU.rev=a.createConvolver();AU.rev.buffer=impulse(a,2.6,3.2);AU.wet=a.createGain();AU.wet.gain.value=.32;AU.rev.connect(AU.wet);AU.wet.connect(AU.bus);
 AU.sfx=a.createGain();AU.sfx.gain.value=.95;AU.sfx.connect(AU.bus);AU.send=a.createGain();AU.send.gain.value=.55;AU.sfx.connect(AU.send);AU.send.connect(AU.rev);
 AU.mus=a.createGain();AU.mus.gain.value=0;AU.mus.connect(AU.bus);const ms=a.createGain();ms.gain.value=.9;AU.mus.connect(ms);ms.connect(AU.rev);
 return AU;}
export function setRoom(tier){if(!AU.ctx)return;const big=[1.9,3.4,2.4,3.0][tier]||2.4;AU.rev.buffer=impulse(AU.ctx,big,tier===1?2.4:3.2);AU.wet.gain.value=[.3,.42,.28,.38][tier]||.32;}
// variation : évite de rejouer deux fois de suite le même échantillon, hauteur/volume/panoramique aléatoires
const last={};export function pickVar(list,k){if(list.length<2)return list[0];let n;do{n=list[(Math.random()*list.length)|0];}while(n===last[k]);last[k]=n;return n;}
export function out(v,pan=0){const a=AU.ctx,g=a.createGain();g.gain.value=v;let node=g;if(a.createStereoPanner){const p=a.createStereoPanner();p.pan.value=Math.max(-1,Math.min(1,pan));g.connect(p);node=p;}node.connect(AU.sfx);return g;}

/* ---------- musique générative (harpe, nappes, bourdon, tambour en combat) ---------- */
const MODES={crypt:{root:50,sc:[0,2,3,5,7,9,10],prog:[0,5,3,6],bpm:62},cavern:{root:45,sc:[0,2,3,5,7,8,10],prog:[0,5,6,4],bpm:56},forge:{root:52,sc:[0,1,3,5,7,8,10],prog:[0,1,6,5],bpm:66},frost:{root:47,sc:[0,2,4,6,7,9,11],prog:[0,4,5,3],bpm:54}};
const M={on:false,mode:'crypt',battle:false,next:0,step:0,bar:0,timer:null,vol:.0};
const hz=m=>440*Math.pow(2,(m-69)/12);
function harp(t,midi,vel){const a=AU.ctx;const o=a.createOscillator(),o2=a.createOscillator(),g=a.createGain(),f=a.createBiquadFilter();o.type='triangle';o2.type='sine';o.frequency.value=hz(midi);o2.frequency.value=hz(midi)*2.003;
 f.type='lowpass';f.frequency.setValueAtTime(3200,t);f.frequency.exponentialRampToValueAtTime(700,t+1.2);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vel,t+.006);g.gain.exponentialRampToValueAtTime(.0008,t+2.4);
 const g2=a.createGain();g2.gain.value=.25;o.connect(f);o2.connect(g2);g2.connect(f);f.connect(g);g.connect(AU.mus);o.start(t);o2.start(t);o.stop(t+2.5);o2.stop(t+2.5);}
function pad(t,midis,dur,vel){const a=AU.ctx;const g=a.createGain(),f=a.createBiquadFilter();f.type='lowpass';f.frequency.value=650;f.Q.value=.4;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vel,t+dur*.35);g.gain.linearRampToValueAtTime(vel*.8,t+dur*.8);g.gain.linearRampToValueAtTime(0,t+dur*1.05);
 midis.forEach(m=>[-6,6].forEach(dt=>{const o=a.createOscillator();o.type='sawtooth';o.frequency.value=hz(m);o.detune.value=dt;o.connect(f);o.start(t);o.stop(t+dur*1.1);}));f.connect(g);g.connect(AU.mus);}
function drone(t,m,dur,vel){const a=AU.ctx,o=a.createOscillator(),g=a.createGain();o.type='sine';o.frequency.value=hz(m);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vel,t+1.5);g.gain.linearRampToValueAtTime(0,t+dur);o.connect(g);g.connect(AU.mus);o.start(t);o.stop(t+dur+.1);}
function drum(t,vel,low=true){const a=AU.ctx,o=a.createOscillator(),g=a.createGain();o.type='sine';o.frequency.setValueAtTime(low?95:150,t);o.frequency.exponentialRampToValueAtTime(low?42:70,t+.25);g.gain.setValueAtTime(vel,t);g.gain.exponentialRampToValueAtTime(.001,t+.45);o.connect(g);g.connect(AU.mus);o.start(t);o.stop(t+.5);
 const nb=a.createBuffer(1,a.sampleRate*.12,a.sampleRate),d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);const s=a.createBufferSource(),gf=a.createGain(),f=a.createBiquadFilter();s.buffer=nb;f.type='bandpass';f.frequency.value=low?300:1200;gf.gain.value=vel*.35;s.connect(f);f.connect(gf);gf.connect(AU.mus);s.start(t);}
function tick(){if(!M.on||!AU.ctx)return;const a=AU.ctx,md=MODES[M.mode],spb=60/(md.bpm*(M.battle?1.35:1))/2;
 while(M.next<a.currentTime+.4){const t=Math.max(M.next,a.currentTime+.02),s=M.step%16;
  if(s===0){const deg=md.prog[M.bar%md.prog.length],ch=[0,2,4].map(i=>md.root+md.sc[(deg+i)%7]+12*Math.floor((deg+i)/7));pad(t,ch.map(x=>x+12),spb*16,M.battle?.022:.03);if(M.bar%2===0)drone(t,md.root-12,spb*32,.05);M.chord=ch;M.bar++;}
  const ch=M.chord||[md.root,md.root+3,md.root+7];
  if(s%2===0&&Math.random()<(s%4===0?.85:.45))harp(t,ch[(Math.random()*3)|0]+24+(Math.random()<.25?12:0),.045+Math.random()*.03);
  if(s===6&&Math.random()<.5||s===14&&Math.random()<.35){const d=(Math.random()*7)|0;harp(t,md.root+36+md.sc[d],.05);}
  if(M.battle){if(s%8===0)drum(t,.32,true);if(s%8===4)drum(t,.12,false);if(s===14)drum(t,.18,true);}
  M.step++;M.next=t+spb;}}
export function musicStart(mode){if(!AU.ctx)return;M.mode=mode;if(!M.on){M.on=true;M.next=AU.ctx.currentTime+.3;M.timer=setInterval(tick,120);}}
export function musicMode(mode){M.mode=mode;}
export function musicBattle(b){M.battle=b;}
export function musicVol(v){if(!AU.ctx)return;AU.mus.gain.cancelScheduledValues(AU.ctx.currentTime);AU.mus.gain.setTargetAtTime(v,AU.ctx.currentTime,.8);}
