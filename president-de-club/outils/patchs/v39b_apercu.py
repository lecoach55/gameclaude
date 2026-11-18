#!/usr/bin/env python3
# v39b — demande design-president-de-club-1 (3) : indication chiffrée sur chaque choix
# AVANT de cliquer. Le choix est joué « à blanc » plusieurs fois sur une copie de la partie
# (sauvegarde, affichage, file d'attente et minuteries neutralisés), puis la vraie partie est
# remise en place : aucun effet n'est changé.  Usage : python3 v39b_apercu.py chemin/index.html
import sys
p = sys.argv[1] if len(sys.argv) > 1 else 'jeu/index.html'
s = open(p, encoding='utf-8').read()
def rep(a, b, n=1):
    global s
    assert s.count(a) == n, (a[:70], s.count(a)); s = s.replace(a, b)

rep("""  <div class="choices">${chs.map((c,i)=>`<button class="choice" onclick="A.evChoice(${i})">${esc(c.t)}${c.s?'<small>'+esc(c.s)+'</small>':''}</button>`).join('')}</div>`);
}""",
"""  <div class="choices">${chs.map((c,i)=>{const pv=evPreview(q,i);return `<button class="choice" onclick="A.evChoice(${i})">${esc(c.t)}${c.s?'<small>'+esc(c.s)+'</small>':''}${pv?'<small class="evpv">'+pv+'</small>':''}</button>`;}).join('')}</div>`);
}
// v39b : aperçu chiffré d'un choix, joué à blanc sur une copie de la partie (aucun effet réel)
function evPreview(q,i,K){K=K||5;const e=EVENTS[q.id];if(!e)return '';
  const real=S,uq=UI.queue.slice(),um=UI.modalOpen,ut=UI.tab,ucur=UI.curEv,G=window,keep={save,toast,render,openModal,nextQueue,checkOver},st=G.setTimeout,si=G.setInterval;
  const acc={cash:[],mood:[],conf:[],rep:[],fans:[],mor:[],inj:0,n:[],later:0,ok:0};let base=null;
  try{
    const json=JSON.stringify(real),dj=q.d?JSON.stringify(q.d):null;
    save=()=>{};toast=()=>{};render=()=>{};openModal=()=>{};nextQueue=()=>{};checkOver=()=>{};G.setTimeout=()=>0;G.setInterval=()=>0;
    for(let k=0;k<K;k++){
      S=JSON.parse(json);const d=dj?JSON.parse(dj):q.d;
      const chs=typeof e.ch==='function'?e.ch(d):e.ch;if(!chs||!chs[i])break;
      const a=evSnap();if(!base)base=a;
      try{chs[i].f(d);}catch(x){continue;}
      S.mood=clamp(S.mood,0,100);S.confidence=clamp(S.confidence,0,100);S.rep=clamp(S.rep,0,100);
      const b=evSnap();acc.ok++;
      acc.cash.push(b.cash-a.cash);acc.mood.push(b.mood-a.mood);acc.conf.push(b.conf-a.conf);acc.rep.push(b.rep-a.rep);acc.fans.push(b.fans-a.fans);acc.n.push(b.n-a.n);
      let ms=0,mn=0,inj=false;for(const id in b.sq){const x=a.sq[id];if(!x)continue;const dm=b.sq[id].m-x.m;if(Math.round(dm)){ms+=dm;mn++;}if(b.sq[id].i>x.i)inj=true;}
      acc.mor.push(mn?ms/mn:0);if(inj)acc.inj++;if(a.later!==b.later)acc.later++;
    }
  }catch(x){acc.ok=0;}
  finally{S=real;UI.queue=uq;UI.modalOpen=um;UI.tab=ut;UI.curEv=ucur;save=keep.save;toast=keep.toast;render=keep.render;openModal=keep.openModal;nextQueue=keep.nextQueue;checkOver=keep.checkOver;G.setTimeout=st;G.setInterval=si;}
  if(!acc.ok)return '';
  const avg=a=>a.reduce((s,v)=>s+v,0)/a.length,vary=a=>Math.max(...a)-Math.min(...a)>.5,out=[];
  const one=(arr,lab,fmt)=>{const m=avg(arr);if(Math.abs(m)<.5)return;const t=(vary(arr)?'≈ ':'')+(m>0?'+':'−')+fmt(Math.abs(m))+' '+lab;out.push(`<span class="${m>0?'good':'bad'}">${t}</span>`);};
  {const m=avg(acc.cash);if(Math.abs(m)>=50){const t=(vary(acc.cash)?'≈ ':'')+(m>0?'+':'−')+money(Math.abs(Math.round(m/10)*10));out.push(`<span class="${m>0?'good':'bad'}">${t}</span>`);}}
  one(acc.mood,'humeur',v=>Math.round(v));one(acc.conf,'confiance',v=>Math.round(v));one(acc.rep,'réputation',v=>Math.round(v));one(acc.fans,'supporters',v=>nf(Math.round(v)));
  one(acc.mor,'moral',v=>Math.round(v));one(acc.n,'effectif',v=>Math.round(v));
  if(acc.inj)out.push(`<span class="bad">risque de blessure ${Math.round(acc.inj/acc.ok*100)} %</span>`);
  if(acc.later)out.push('<span>suites à venir</span>');
  return out.join(' · ');
}""")

rep(".choice small{display:block;font-weight:400;color:var(--muted);margin-top:2px}",
    ".choice small{display:block;font-weight:400;color:var(--muted);margin-top:2px}\n.choice small.evpv{font-size:12.5px;font-variant-numeric:tabular-nums}.choice small.evpv .good{color:var(--good)}.choice small.evpv .bad{color:var(--bad)}")

open(p, 'w', encoding='utf-8').write(s); print('v39b ok')
