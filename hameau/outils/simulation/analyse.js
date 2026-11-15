// Synthèse des résultats de nuit → rapport.md
const fs=require('fs');const L=fs.readFileSync(require('path').join(process.env.SORTIE||require('path').join(__dirname,'../../mesures'),'results.jsonl'),'utf8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
const avg=(a,f)=>a.length?a.reduce((s,x)=>s+f(x),0)/a.length:0;const r1=x=>Math.round(x*10)/10;
let md=`# Rapport de nuit — Hameau 3D\n\n${L.length} parties simulées.\n\n## Par profil de joueur (paramètres actuels)\n\n| Profil | Parties | Jours | Pop. finale | Pic | Famine (j) | Froid (j) | Départs | Oisifs | Marche | Trajet | Échecs chemin | ms/jour |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|\n`;
const base=L.filter(r=>!Object.keys(r.params||{}).length);
const groups={};for(const r of base){const k=r.prof+' '+r.days+'j';(groups[k]=groups[k]||[]).push(r);}
for(const [k,a] of Object.entries(groups))md+=`| ${k.split(' ')[0]} | ${a.length} | ${a[0].days} | ${r1(avg(a,r=>r.final.pop))} | ${r1(avg(a,r=>r.peak))} | ${r1(avg(a,r=>r.starveDays))} | ${r1(avg(a,r=>r.coldDays))} | ${r1(avg(a,r=>r.departures))} | ${avg(a,r=>r.idle).toFixed(2)} | ${avg(a,r=>r.walk).toFixed(2)} | ${r1(avg(a,r=>r.haul))} | ${(avg(a,r=>r.pathFailRate)*100).toFixed(2)} % | ${Math.round(avg(a,r=>r.msPerDay))} |\n`;
md+=`\n## Anomalies détectées\n\n| Type | Occurrences | Parties touchées | Exemple |\n|---|---|---|---|\n`;
const an={};for(const r of L)for(const a of r.anomalies||[]){const e=an[a.type]=an[a.type]||{n:0,runs:new Set(),ex:null};e.n++;e.runs.add(r.seed+r.prof);if(!e.ex)e.ex={...a,prof:r.prof,seed:r.seed};}
for(const [k,e] of Object.entries(an).sort((a,b)=>b[1].n-a[1].n))md+=`| ${k} | ${e.n} | ${e.runs.size} | \`${JSON.stringify(e.ex).slice(0,160)}\` |\n`;
// chantiers bloqués : quels matériaux manquent
const stuck=L.flatMap(r=>(r.anomalies||[]).filter(a=>a.type==='chantier_bloqué'));
if(stuck.length){const m={};for(const s of stuck){for(const k in s.need)if(s.need[k]>s.have[k])m[k+(s.res[k]<1?' (stock vide)':' (stock dispo!)')]=(m[k+(s.res[k]<1?' (stock vide)':' (stock dispo!)')]||0)+1;}md+=`\nChantiers bloqués — matériau manquant : ${JSON.stringify(m)}\n`;}
// perf
const perf=L.flatMap(r=>(r.series||[]).map(s=>[s[1],s[9]])).filter(x=>x[0]>0);const buckets={};for(const [p,ms] of perf){const b=Math.floor(p/50)*50;(buckets[b]=buckets[b]||[]).push(ms);}
md+=`\n## Coût de calcul (ms par jour de jeu simulé, en Node)\n\n`+Object.entries(buckets).sort((a,b)=>a[0]-b[0]).map(([b,a])=>`- ${b}–${+b+49} habitants : ${Math.round(avg(a,x=>x))} ms`).join('\n')+'\n';
// recherche de paramètres
const S=L.filter(r=>r.score2!=null).sort((a,b)=>b.score-a.score);
if(S.length){const baseNov=base.filter(r=>r.prof==='novice');md+=`\n## Recherche de paramètres (${S.length} essais, bot débutant, 40 j, 2 cartes chacun)\n\nScore = pop. − 12×jours de famine − 10×jours de froid − 3×départs − 40 si effondrement.\n\n| Rang | Score | Paramètres modifiés |\n|---|---|---|\n`;
  S.slice(0,8).forEach((r,i)=>md+=`| ${i+1} | ${r1(r.score)} | \`${JSON.stringify(r.params)}\` |\n`);
  const cnt={};for(const r of S.slice(0,Math.max(5,Math.floor(S.length/5))))for(const [k,v] of Object.entries(r.params)){cnt[k+'='+v]=(cnt[k+'='+v]||0)+1;}
  md+=`\nValeurs les plus fréquentes dans le meilleur quintile : ${Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([k,v])=>k+' ×'+v).join(', ')}\n`;}
// validation
const V=L.filter(r=>r.tag);if(V.length){md+=`\n## Validation (nouvelles cartes)\n\n| Réglage | Profil | Parties | Pop. finale | Famine | Froid | Score |\n|---|---|---|---|---|---|---|\n`;
  const g={};for(const r of V){const k=r.tag+'|'+r.prof;(g[k]=g[k]||[]).push(r);}for(const [k,a] of Object.entries(g)){const [t,p]=k.split('|');md+=`| ${t} | ${p} | ${a.length} | ${r1(avg(a,r=>r.final.pop))} | ${r1(avg(a,r=>r.starveDays))} | ${r1(avg(a,r=>r.coldDays))} | ${r1(avg(a,r=>r.score))} |\n`;}}
fs.writeFileSync(require('path').join(process.env.SORTIE||require('path').join(__dirname,'../../mesures'),'rapport.md'),md);console.log(md.slice(0,4000));
