'use strict';
/* Cage & Gloire — portraits vectoriels générés (SVG), un visage unique par combattant */
var Portrait=(function(){
const PEAU=[['#f6d5bb','#e2b394','#b9846a'],['#ecbf9b','#d39e78','#a5704f'],['#d29a72','#b67b55','#87553a'],['#b37a53','#94603e','#6a4029'],['#86573a','#6c4329','#47291a'],['#5c3a25','#462a1a','#2c190f']];
const CH=['#18120e','#2a1c13','#4b3220','#7a5630','#b8935a','#d6c39b'];
const cache={};
function rng(s){let a=s>>>0||1;return()=>{a=(a*1664525+1013904223)>>>0;return a/4294967296;};}
function svg(f,o={}){const key=f.id+'|'+(o.bg||'')+'|'+(o.mini?1:0)+'|'+(f.bless>0?1:0)+'|'+(o.nobg?1:0)+'|'+(o.rim||'');if(cache[key])return cache[key];
 const a=f.app||{},r=rng(a.seed||7),F=f.sexe==='F';const P=PEAU[a.peau??1],hc=CH[a.cc??0];const id='p'+(a.seed||1)+(o.mini?'m':'');
 const jw=F?46+r()*5:51+r()*9,fl=F?62+r()*5:64+r()*8,cy=104,brow=r()*5,eyeY=cy-4+r()*3,nw=r()*4,tr=(a.ta||0);
 const neck=F?24:30+r()*8;const bg=o.bg||'#22242c';
 let s=`<svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg" class="portrait"><defs>
<radialGradient id="${id}g" cx="45%" cy="38%" r="70%"><stop offset="0" stop-color="${P[0]}"/><stop offset=".6" stop-color="${P[1]}"/><stop offset="1" stop-color="${P[2]}"/></radialGradient>
<linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="#0b0b0f"/></linearGradient>
<linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${P[2]}"/><stop offset=".35" stop-color="${P[1]}"/><stop offset=".6" stop-color="${P[0]}"/><stop offset="1" stop-color="${P[2]}"/></linearGradient>
<radialGradient id="${id}l" cx="50%" cy="20%" r="80%"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>`;
 if(!o.nobg)s+=`<rect width="200" height="240" fill="url(#${id}b)"/><circle cx="100" cy="70" r="120" fill="url(#${id}l)"/>`;
 // cheveux longs derrière (femmes)
 if(F&&a.chev!==0)s+=`<path d="M${100-jw-6} ${cy-10} Q${100-jw-14} ${cy+60} ${100-jw+4} ${cy+92} L${100+jw-4} ${cy+92} Q${100+jw+14} ${cy+60} ${100+jw+6} ${cy-10} Z" fill="${hc}"/>`;
 // épaules et trapèzes
 const sh=F?78:92;
 s+=`<path d="M0 240 L0 ${208-(F?0:10)} Q20 ${178-(F?0:8)} ${100-sh*.55} ${172} Q${100-neck} ${160} ${100-neck*.6} ${148} L${100+neck*.6} 148 Q${100+neck} 160 ${100+sh*.55} 172 Q180 ${178-(F?0:8)} 200 ${208-(F?0:10)} L200 240 Z" fill="url(#${id}s)"/>`;
 // pectoraux / clavicules
 s+=`<path d="M${100-sh*.5} 196 Q100 ${210} ${100+sh*.5} 196" stroke="${P[2]}" stroke-width="2.4" fill="none" opacity=".55"/><path d="M${100-sh*.4} 180 Q${100-20} 186 100 182 Q${100+20} 186 ${100+sh*.4} 180" stroke="${P[2]}" stroke-width="1.6" fill="none" opacity=".5"/>`;
 if(F)s+=`<path d="M0 240 L0 222 Q40 208 64 214 L72 240 Z M200 240 L200 222 Q160 208 136 214 L128 240 Z" fill="${a.short||'#111'}" opacity=".92"/><path d="M60 240 Q100 214 140 240 Z" fill="${a.short||'#111'}"/>`;
 // tatouages
 if(tr===1)s+=`<path d="M18 200 q14 -16 28 -6 q-10 4 -14 14 q-6 -6 -14 -8z M182 200 q-14 -16 -28 -6 q10 4 14 14 q6 -6 14 -8z" fill="#1d2a33" opacity=".55"/>`;
 if(tr===2)s+=`<g stroke="#1d2a33" stroke-width="3" fill="none" opacity=".5"><path d="M150 186 q14 4 22 18 q4 10 -2 22"/><path d="M160 192 q8 6 8 16"/></g>`;
 // cou
 s+=`<path d="M${100-neck*.62} 120 L${100-neck*.62} 156 Q100 168 ${100+neck*.62} 156 L${100+neck*.62} 120 Z" fill="${P[1]}"/><path d="M${100-neck*.62} 140 Q100 158 ${100+neck*.62} 140 L${100+neck*.62} 128 L${100-neck*.62} 128Z" fill="${P[2]}" opacity=".55"/>`;
 // oreilles
 const er=a.oreille&&!F?1.35:1;s+=`<ellipse cx="${100-jw-1}" cy="${cy-2}" rx="${6.5*er}" ry="${11*er}" fill="${P[1]}"/><ellipse cx="${100+jw+1}" cy="${cy-2}" rx="${6.5*er}" ry="${11*er}" fill="${P[1]}"/>`;
 if(a.oreille&&!F)s+=`<path d="M${100-jw-4} ${cy-8} q3 4 0 8 q3 3 0 7" stroke="${P[2]}" stroke-width="2" fill="none"/><path d="M${100+jw+4} ${cy-8} q-3 4 0 8 q-3 3 0 7" stroke="${P[2]}" stroke-width="2" fill="none"/>`;
 // visage
 const top=cy-fl*.8,jaw=cy+fl*.62;
 s+=`<path d="M${100-jw} ${cy-14} Q${100-jw-2} ${top+6} 100 ${top} Q${100+jw+2} ${top+6} ${100+jw} ${cy-14} Q${100+jw+1} ${cy+18} ${100+jw*.72} ${cy+fl*.42} Q${100+jw*.42} ${jaw} 100 ${jaw} Q${100-jw*.42} ${jaw} ${100-jw*.72} ${cy+fl*.42} Q${100-jw-1} ${cy+18} ${100-jw} ${cy-14} Z" fill="url(#${id}g)"/>`;
 // ombre de pommettes et mâchoire
 s+=`<path d="M${100-jw*.86} ${cy+8} Q${100-jw*.6} ${cy+30} ${100-jw*.35} ${cy+38}" stroke="${P[2]}" stroke-width="3" fill="none" opacity=".35"/><path d="M${100+jw*.86} ${cy+8} Q${100+jw*.6} ${cy+30} ${100+jw*.35} ${cy+38}" stroke="${P[2]}" stroke-width="3" fill="none" opacity=".35"/>`;
 // barbe
 const bb=F?0:a.barbe||0;
 if(bb===1)s+=`<path d="M${100-jw*.95} ${cy+4} Q${100-jw*.8} ${jaw-2} 100 ${jaw+1} Q${100+jw*.8} ${jaw-2} ${100+jw*.95} ${cy+4} Q${100+jw*.5} ${cy+30} 100 ${cy+24} Q${100-jw*.5} ${cy+30} ${100-jw*.95} ${cy+4}Z" fill="${hc}" opacity=".28"/>`;
 if(bb===2)s+=`<path d="M86 ${cy+28} Q100 ${cy+22} 114 ${cy+28} L112 ${jaw-2} Q100 ${jaw+4} 88 ${jaw-2}Z" fill="${hc}" opacity=".9"/>`;
 if(bb===3)s+=`<path d="M${100-jw} ${cy-2} Q${100-jw*.9} ${jaw+4} 100 ${jaw+8} Q${100+jw*.9} ${jaw+4} ${100+jw} ${cy-2} L${100+jw*.8} ${cy+14} Q${100+jw*.4} ${cy+26} 100 ${cy+22} Q${100-jw*.4} ${cy+26} ${100-jw*.8} ${cy+14}Z" fill="${hc}"/>`;
 if(bb===4||bb===3)s+=`<path d="M84 ${cy+22} Q100 ${cy+15} 116 ${cy+22} Q112 ${cy+26} 100 ${cy+23} Q88 ${cy+26} 84 ${cy+22}Z" fill="${hc}"/>`;
 if(bb===5)s+=`<path d="M${100-jw} ${cy-4} Q${100-jw*.8} ${jaw} 100 ${jaw+3} Q${100+jw*.8} ${jaw} ${100+jw} ${cy-4}" stroke="${hc}" stroke-width="5" fill="none"/>`;
 // yeux
 const ex=19+r()*3,ew=9,col=['#3b2a1a','#24384d','#3d4a2a','#18120c'][a.yeux||0];
 for(const sx of [-1,1]){const x=100+sx*ex;s+=`<path d="M${x-ew} ${eyeY} Q${x} ${eyeY-5.5} ${x+ew} ${eyeY} Q${x} ${eyeY+4} ${x-ew} ${eyeY}Z" fill="#f4efe8"/><circle cx="${x+sx*.5}" cy="${eyeY-.4}" r="3.6" fill="${col}"/><circle cx="${x+sx*.5}" cy="${eyeY-.4}" r="1.6" fill="#050505"/><circle cx="${x+sx*.5+1.1}" cy="${eyeY-1.6}" r=".9" fill="#fff"/>
<path d="M${x-ew-1} ${eyeY-.5} Q${x} ${eyeY-6.8} ${x+ew+1} ${eyeY-.5}" stroke="${P[2]}" stroke-width="2.2" fill="none"/>`;
  // sourcils (froncés)
  s+=`<path d="M${x-sx*12} ${eyeY-10+brow*.3} Q${x} ${eyeY-14-brow*.5} ${x+sx*11} ${eyeY-9+(F?-2:2)}" stroke="${hc}" stroke-width="${F?3:4.6}" stroke-linecap="round" fill="none"/>`;}
 // nez
 const nb=a.nez===3?3:0;s+=`<path d="M${98+nb*.4} ${eyeY+2} Q${96+nb} ${cy+10} ${91-nw} ${cy+16} Q${100} ${cy+21} ${109+nw} ${cy+16} Q${104} ${cy+12} ${102+nb*.4} ${eyeY+2}" fill="${P[1]}" stroke="${P[2]}" stroke-width="1.4"/><ellipse cx="${95-nw*.5}" cy="${cy+16.5}" rx="2.4" ry="1.4" fill="${P[2]}"/><ellipse cx="${105+nw*.5}" cy="${cy+16.5}" rx="2.4" ry="1.4" fill="${P[2]}"/>`;
 // bouche
 const mw=F?10:12;s+=`<path d="M${100-mw} ${cy+28} Q100 ${cy+30.5} ${100+mw} ${cy+28}" stroke="#6b3a2c" stroke-width="2.4" stroke-linecap="round" fill="none"/>${F?`<path d="M${100-mw+2} ${cy+29.5} Q100 ${cy+35} ${100+mw-2} ${cy+29.5}" fill="#a65a50" opacity=".7"/>`:`<path d="M${100-8} ${cy+32} Q100 ${cy+34.5} ${100+8} ${cy+32}" stroke="${P[2]}" stroke-width="1.6" fill="none" opacity=".6"/>`}`;
 // cicatrices
 if(a.cic===1)s+=`<path d="M${100+ex-6} ${eyeY-16} l9 7" stroke="#e7b3a0" stroke-width="2" opacity=".8"/>`;
 if(a.cic===2)s+=`<path d="M${100-ex-4} ${eyeY+8} l-6 12" stroke="#d99a88" stroke-width="2" opacity=".75"/>`;
 if(a.cic===3)s+=`<path d="M94 ${cy+32} l-4 8" stroke="#d99a88" stroke-width="2" opacity=".75"/>`;
 if(f.bless>0)s+=`<path d="M${100+ex+2} ${eyeY+4} q6 2 8 8" stroke="#8b1e2e" stroke-width="5" opacity=".35" fill="none" stroke-linecap="round"/><rect x="${100+ex-10}" y="${eyeY-18}" width="14" height="6" rx="2" fill="#f3e9d8" transform="rotate(-20 ${100+ex} ${eyeY-14})"/>`;
 // cheveux
 const ch=a.chev??1,ht=top;
 const calotte=(ext,h0)=>`M${100-jw-ext} ${cy-12} Q${100-jw-ext} ${ht-h0} 100 ${ht-h0-4} Q${100+jw+ext} ${ht-h0} ${100+jw+ext} ${cy-12} Q${100+jw-4} ${ht+14} 100 ${ht+10} Q${100-jw+4} ${ht+14} ${100-jw-ext} ${cy-12}Z`;
 if(F){if(ch!==0){s+=`<path d="${calotte(4,8)}" fill="${hc}"/><path d="M${100-jw+2} ${ht+18} Q${100-10} ${ht-2} ${100+jw-2} ${ht+22}" stroke="${hc}" stroke-width="10" fill="none"/>`;
  if(ch%2===0)s+=`<path d="M${100+jw-6} ${ht+4} q34 10 30 60 q-6 28 -14 40" stroke="${hc}" stroke-width="13" fill="none" stroke-linecap="round"/>`;}}
 else if(ch===1)s+=`<path d="${calotte(1,1)}" fill="${hc}" opacity=".55"/>`;
 else if(ch===2)s+=`<path d="${calotte(3,9)}" fill="${hc}"/>`;
 else if(ch===3)s+=`<path d="${calotte(1,0)}" fill="${hc}" opacity=".35"/><path d="M90 ${ht+6} Q92 ${ht-22} 100 ${ht-26} Q108 ${ht-22} 110 ${ht+6} Z" fill="${hc}"/>`;
 else if(ch===4)s+=`<path d="${calotte(4,10)}" fill="${hc}"/><circle cx="100" cy="${ht-14}" r="10" fill="${hc}"/>`;
 else if(ch===5)s+=`<path d="${calotte(6,16)}" fill="${hc}"/>`+Array.from({length:14},(_,i)=>`<circle cx="${100-jw+6+i*(jw*2-12)/13}" cy="${ht-8-Math.sin(i/13*Math.PI)*12}" r="7" fill="${hc}"/>`).join('');
 else if(ch===6)s+=`<path d="${calotte(2,4)}" fill="${hc}"/>`+[-24,-12,0,12,24].map(x=>`<path d="M${100+x} ${ht-2} L${100+x*1.2} ${cy-18}" stroke="${P[1]}" stroke-width="1.6" opacity=".6"/>`).join('');
 else if(ch===7)s+=`<path d="M${100-jw*.7} ${ht+6} Q${100-jw*.6} ${ht-14} 100 ${ht-16} Q${100+jw*.8} ${ht-12} ${100+jw*.75} ${ht+10} Q100 ${ht+2} ${100-jw*.7} ${ht+6}Z" fill="${hc}"/><path d="${calotte(1,0)}" fill="${hc}" opacity=".22"/>`;
 // lumière de contour (couleur de l'organisation)
 if(o.rim)s+=`<path d="M${100+jw} ${cy-14} Q${100+jw+1} ${cy+18} ${100+jw*.72} ${cy+fl*.42}" stroke="${o.rim}" stroke-width="1.6" fill="none" opacity=".5"/><path d="M200 ${208-(F?0:10)} Q180 ${178-(F?0:8)} ${100+sh*.55} 172" stroke="${o.rim}" stroke-width="3" fill="none" opacity=".6"/>`;
 s+='</svg>';cache[key]=s;return s;}
function vider(){for(const k in cache)delete cache[k];}
return {svg,vider};
})();
