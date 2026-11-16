const D = window.Dyn, Sim = window.Sim, A = window.Art;
let S = null, tab = 'plateau', news = [], deltas = [], labRes = null, queue = [];
const $ = id => document.getElementById(id);
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ROMAN = n => { const m = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]; let s = ''; for (const [v, r] of m) while (n >= v) { s += r; n -= v; } return s; };
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FN = p => D.fullName(S, p);
const ANS = n => n <= 1 ? `${Math.max(0, n)} an` : `${n} ans`;

const SAVE = 'cl_save4';
// ---------- Trousse de test (outils-communs/testkit.js) + sauvegarde en ligne ----------
// ===== Trousse de test à intégrer dans n'importe quel jeu (artefact Claude) =====
// Ajoute : compteur d'images par seconde (mode test), bouton 🐞 « signaler un problème » (capture + état + erreurs),
// banc de mesure scripté, et envoi des résultats dans la base de l'artefact (lisible par Claude avec db_list).
// Usage dans le jeu :
//   import {Testkit} from './testkit.js';
//   const TK=Testkit({jeu:'hameau', canvas:()=>renderer.domElement, etat:()=>({...}), rendu:()=>renderer.render(scene,cam)});
//   TK.bouton(document.body);            // bouton 🐞 permanent
//   TK.modeTest();                       // affiche le compteur (à appeler depuis un bouton « Mode test »)
//   await TK.banc([{nom:'scène 1', preparer:async()=>{...}}, ...], 5000);  // mesure chaque scène 5 s
// Le mode test ne doit jamais écrire dans la vraie sauvegarde : c'est au jeu de couper sa sauvegarde quand TK.test est vrai.
function Testkit(o){
 const TK={test:false,ft:[],rec:null,lt:0,erreurs:[]};
 let DB=null,UID=null,init=null;
 const cloud=()=>init||(init=(async()=>{try{if(!window.claude||!window.claude.use)return false;const [db,u]=await Promise.all([window.claude.use('db'),window.claude.use('user')]);UID=await u.id();DB=db;return !!(db&&UID);}catch(e){return false;}})());
 TK.envoyer=async(nom,obj)=>{try{localStorage.setItem(o.jeu+'_'+nom.split('_')[0],JSON.stringify(obj));}catch(e){}if(!await cloud())return false;try{await DB.collection('data/users/'+UID).doc(nom).set(obj);return true;}catch(e){return false;}};
 addEventListener('error',e=>{TK.erreurs.push(String(e.message||e).slice(0,300));if(TK.erreurs.length>20)TK.erreurs.shift();});
 addEventListener('unhandledrejection',e=>TK.erreurs.push('promesse: '+String(e.reason).slice(0,300)));
 const gpu=()=>{try{const c=o.canvas();const gl=c.getContext('webgl2')||c.getContext('webgl');const x=gl.getExtension('WEBGL_debug_renderer_info');return x?gl.getParameter(x.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);}catch(e){return '?';}};
 const stats=a=>{if(!a.length)return{};const s=a.slice().sort((x,y)=>x-y),m=a.reduce((x,y)=>x+y,0)/a.length;return{fps:+(1000/m).toFixed(1),bas1:+(1000/s[Math.floor(s.length*.99)]).toFixed(1),pire:+s[s.length-1].toFixed(1),n:a.length};};
 const tick=t=>{if(TK.lt){const d=t-TK.lt;TK.ft.push(d);if(TK.ft.length>240)TK.ft.shift();if(TK.rec)TK.rec.push(d);}TK.lt=t;if(TK.ov&&t-(TK.tt||0)>500){TK.tt=t;const s=stats(TK.ft.slice(-60));TK.ov.firstChild.textContent=`🧪 ${s.fps||'-'} img/s · pire ${s.pire||'-'} ms`;}requestAnimationFrame(tick);};requestAnimationFrame(tick);
 TK.modeTest=()=>{TK.test=true;if(TK.ov)return;const d=document.createElement('div');d.style.cssText='position:fixed;top:4px;left:50%;transform:translateX(-50%);z-index:9999;background:rgba(0,0,0,.72);color:#9fe0a0;font:12px monospace;padding:4px 8px;border-radius:6px';d.innerHTML='<span>🧪</span>';document.body.appendChild(d);TK.ov=d;};
 TK.mesurer=async ms=>{TK.rec=[];await new Promise(r=>setTimeout(r,ms));const a=TK.rec;TK.rec=null;return stats(a);};
 TK.banc=async(scenes,ms=5000)=>{const res=[];for(const s of scenes){try{await s.preparer();await new Promise(r=>setTimeout(r,1500));res.push(Object.assign({scene:s.nom},await TK.mesurer(ms)));}catch(e){res.push({scene:s.nom,erreur:String(e)});}}
  const out={jeu:o.jeu,date:new Date().toISOString(),gpu:gpu(),ua:navigator.userAgent,ecran:innerWidth+'x'+innerHeight+' @'+devicePixelRatio,res};out.enregistre=await TK.envoyer('mesures_'+Date.now(),out);return out;};
 TK.signaler=async()=>{let img='';try{if(o.rendu)o.rendu();const src=o.canvas(),k=Math.min(1,480/src.width),c=document.createElement('canvas');c.width=src.width*k|0;c.height=src.height*k|0;c.getContext('2d').drawImage(src,0,0,c.width,c.height);img=c.toDataURL('image/jpeg',.6);}catch(e){}
  const st={jeu:o.jeu,test:TK.test,date:new Date().toISOString(),gpu:gpu(),ua:navigator.userAgent,img_s:stats(TK.ft.slice(-60)).fps,etat:(()=>{try{return o.etat?o.etat():null;}catch(e){return String(e);}})(),erreurs:TK.erreurs.slice(),capture:img};
  return TK.envoyer('signalement_'+Date.now(),st);};
 TK.bouton=(parent,style)=>{const b=document.createElement('button');b.textContent='🐞';b.title='Signaler un problème à Claude';b.style.cssText=style||'position:fixed;right:10px;bottom:10px;z-index:9999;width:38px;height:38px;border-radius:50%;opacity:.75';parent.appendChild(b);
  b.onclick=async()=>{b.disabled=true;const ok=await TK.signaler();b.disabled=false;b.textContent=ok?'✓':'🐞';setTimeout(()=>b.textContent='🐞',1500);};return b;};
 return TK;}

let TEST = false;
const TK = Testkit({ jeu: 'couronnes', canvas: () => document.querySelector('#board svg') || document.createElement('canvas'),
  etat: () => ({ tab, an: S.year, tour: S.turn, maison: S.house, graine: S.seed, or: S.gold, armee: S.army, stab: S.stab, menace: S.menace, prestige: S.prestige, terres: S.domains, evenement: S.event && S.event.id, fin: !!S.over,
    feuille: ($('modal').innerText || '').slice(0, 600), journal: S.log.slice(-15).map(l => l.y + ' ' + l.t), sauvegarde: JSON.stringify(S).slice(0, 180000) }) });
// sauvegarde en ligne (s'active seule si la page déclare la base de données) : partie partagée entre téléphone et ordinateur
const CLOUD = (() => { let busy = false, pend = null, last = '';
  const ok = () => window.claude && window.claude.use;
  const ref = async () => { if (!ok()) return null; const [db, u] = await Promise.all([window.claude.use('db'), window.claude.use('user')]); if (!db || !u) return null; const id = await u.id(); return id ? db.collection('data/users/' + id).doc('partie') : null; };
  const pump = async () => { if (busy || !pend) return; busy = true; const x = pend; pend = null; try { const r = await ref(); if (r) { await r.set(x); last = x.s; } } catch (e) {} busy = false; if (pend) pump(); };
  return { save(str) { if (str === last) return; pend = { s: str, t: Date.now() }; clearTimeout(this.tm); this.tm = setTimeout(pump, 1500); },
    async load() { try { const r = await Promise.race([ref(), new Promise(res => setTimeout(() => res(null), 10000))]); if (!r) return null; const d = await r.get(); return d && d.exists && d.data() && typeof d.data().s === 'string' ? d.data() : null; } catch (e) { return null; } } };
})();
function save() { if (TEST) return; try { S.savedAt = Date.now(); const str = JSON.stringify(S); localStorage.setItem(SAVE, str); CLOUD.save(str); } catch (e) {} }
function load() {
  try {
    const x = localStorage.getItem(SAVE) || localStorage.getItem('cl_save3');
    if (!x) return null;
    const s = JSON.parse(x);
    if (!s || !s.people || !s.rulers || !s.rulers.length) return null;
    // mise à niveau des anciennes sauvegardes
    s.P = Object.assign({}, D.DEFAULT_P);
    s.pol = s.pol || { fisc: 1, cour: 1, ost: 1 };
    s.fat = s.fat || {}; s.evLast = s.evLast || {}; s.done = s.done || {}; s.flashes = [];
    s.stats = Object.assign({ wars: 0, warsWon: 0, invasions: 0, invRepelled: 0, births: 0, events: 0, marriages: 0, ambitions: 0 }, s.stats || {});
    if (s.era == null) s.era = D.eraOf(s);
    if (!s.rival) s.rival = 'de Châtillon';
    if (s.event && !s.event.choices) s.event = null;
    s.ai = s.ai || { story: [], pendingFacts: [], suggestions: [] };
    if (!s.rivalLord && !s.rivalDown) s.rivalLord = D.newRivalLord(s, false);
    s.hist = s.hist || [];
    if (!s.regions) { const want = s.domains; D.initRegions(s); const g = D.mapGeom(s.seed); let guard = 0; while (s.domains < want && guard++ < 20) { const t = D.borderTargets(s).filter(r => r.owner !== 'rival')[0]; if (!t) break; t.owner = 'me'; D.syncDomains(s); } while (s.domains > Math.max(1, want) && guard++ < 40) { const m = D.myRegions(s).filter(r => !r.cap).pop(); if (!m) break; m.owner = 'de Vergy'; D.syncDomains(s); } }
    return s;
  } catch (e) { return null; }
}
function newGame() { view = null; S = D.createGame((Date.now() ^ (Math.random() * 1e9)) >>> 0); S.ai = { story: [], pendingFacts: [], suggestions: [] }; news = S.log.slice(); deltas = []; queue = []; tab = 'plateau'; S.flashes = []; aiErr = null; showClassic = false; save(); render(); scrollTo(0, 0); titleScreen(); }

function fx(desc) {
  return String(desc).split(/,\s*|\s;\s|\s:\s/).filter(Boolean).map(p => {
    let c = /^\+/.test(p) ? 'pos' : /^[−-]/.test(p) ? 'neg' : 'neu';
    if (/menace/.test(p) && c !== 'neu') c = c === 'pos' ? 'neg' : 'pos';
    return `<span class="${c}">${esc(p)}</span>`;
  }).join('');
}
function robeOf(p) {
  if (p.inDyn || p.leftAt) return A.arms(S.house).robe;
  if (p.from && p.from !== 'vassal' && p.from !== 'marchand') return A.arms(p.from).robe;
  return null;
}
function portrait(p, size) {
  const a = A.arms(S.house), h = D.heir(S), alive = p.alive !== false;
  return A.portraitSVG({ id: p.face != null ? p.face : p.id, sex: p.sex, age: S.year - p.born - (alive || !p.died ? 0 : S.year - p.died), traits: p.traits, era: D.eraOf({ year: p.born + 25 }), ruler: p.id === S.rulerId || (!alive && S.rulers.includes(p.id)), heir: h && h.id === p.id, dead: !alive, robe: robeOf(p), accent: a.accent }, size, S.house);
}
const LOY = l => l >= 75 ? ['Dévoué', 'pos'] : l >= 50 ? ['Fidèle', 'pos'] : l >= 30 ? ['Incertain', 'neu'] : ['Rancunier', 'neg'];
const mini = (p, n) => `<span class="mini">${portrait(p, n)}</span>`;
function traitList(p) { return `<div class="traits">${p.traits.map(t => { const T = D.TRAITS[t]; return `<button class="t${T.g}" onclick="event.stopPropagation();traitInfo('${t}')">${T.n}</button>`; }).join('') || '<span class="t0">Sans trait marquant</span>'}</div>`; }
function pills(ds) { return ds.length ? `<div class="deltas">${ds.map(d => `<span class="pill ${d.v > 0 ? 'pos' : 'neg'}">${d.v > 0 ? '+' : '−'}${Math.abs(d.v)} ${d.n}</span>`).join('')}</div>` : ''; }

// ---------- En-tête et ressources ----------
function header() {
  const P = S.P, span = P.endYear - P.startYear, E = D.ERAS[D.eraOf(S)];
  const segs = S.rulers.map((id, i) => { const p = S.people[id]; const end = p.alive ? S.year : p.died; return `<i title="${esc(FN(p))}" style="width:${(end - p.ruledFrom) / span * 100}%;background:${i % 2 ? '#7b8fb8' : '#1c2f5e'}"></i>`; }).join('');
  const marks = [1250, 1300].map(y => `<b style="left:${(y - P.startYear) / span * 100}%"></b>`).join('');
  return `<header class="head">${A.shieldSVG(S.house, 58)}<div><h1 class="house frak">Maison ${esc(S.house)}</h1>
   <div class="annum">L'an de grâce <b>${ROMAN(S.year)}</b> (${S.year})<br><i>${E.name}</i></div></div></header>
   <div class="reigns" aria-label="Règnes depuis ${P.startYear}"><div class="track">${segs}</div><div class="marks">${marks}</div><div class="ends"><span>${P.startYear}</span><span>${S.rulers.length} règne${S.rulers.length > 1 ? 's' : ''}, ${Math.max(0, P.endYear - S.year)} ans à tenir</span><span>${P.endYear}</span></div></div>`;
}
const stabC = () => S.stab < 25 ? '#ef7a62' : S.stab < 50 ? '#e8bd5c' : '#74d1a2';
const menC = () => S.menace > 70 ? '#ef7a62' : S.menace > 40 ? '#e8bd5c' : '#a9bbe6';
function resources() {
  const inc = S.lastIncome != null ? S.lastIncome : 0;
  return `<div class="res">
   <div class="${S.gold < 0 ? 'neg' : ''}">${A.icon('or', 24)}<b>${S.gold}</b><span>or, ${inc >= 0 ? '+' : ''}${inc}/tour</span></div>
   <div>${A.icon('armee', 24)}<b>${S.army}</b><span>soldats</span></div>
   <div>${A.icon('prestige', 24)}<b>${S.prestige}</b><span>prestige</span></div>
   <div>${A.icon('domaine', 24)}<b>${S.domains}</b><span>domaines</span></div></div>
   <div class="gauges">
    <div class="gauge"><div class="lb"><span>Stabilité</span><em style="color:${stabC()}">${Math.max(0, S.stab)}</em></div><div class="bar"><i style="width:${Math.max(0, S.stab)}%;background:${stabC()}"></i></div><small>${S.stab < 25 ? 'Les barons complotent' : S.stab < 50 ? 'Le royaume murmure' : 'Le royaume est calme'}</small></div>
    <div class="gauge"><div class="lb"><span>Menace</span><em style="color:${menC()}">${S.menace}</em></div><div class="bar"><i style="width:${Math.min(100, S.menace)}%;background:${menC()}"></i></div><small>${S.menace > 70 ? 'Invasion imminente' : S.menace > 40 ? `La maison ${esc(S.rival)} s'arme` : 'Frontières sûres'}${S.alliances ? `, ${S.alliances} allié${S.alliances > 1 ? 's' : ''}` : ''}</small></div>
   </div>`;
}
function miniBar() {
  return `<span>${A.icon('or', 18)}<b class="${S.gold < 0 ? 'neg' : ''}">${S.gold}</b></span><span>${A.icon('armee', 18)}<b>${S.army}</b></span><span>Stab. <b style="color:${S.stab < 25 ? '#ff9a86' : S.stab < 50 ? '#f0cf72' : '#9fd8b8'}">${Math.max(0, S.stab)}</b></span><span>Menace <b style="color:${S.menace > 70 ? '#ff9a86' : S.menace > 40 ? '#f0cf72' : '#b9c8ec'}">${S.menace}</b></span><span class="yr">${S.year}</span>`;
}

// ---------- Cour ----------
function dl(name) { const d = deltas.find(x => x.n === name); return d ? `<em class="${d.v > 0 ? 'pos' : 'neg'}">${d.v > 0 ? '+' : '−'}${Math.abs(d.v)}</em>` : ''; }
let seenIds = null;
function statusBar() {
  const P = S.P, span = P.endYear - P.startYear, E = D.ERAS[D.eraOf(S)];
  const segs = S.rulers.map((id, i) => { const p = S.people[id]; const end = p.alive ? S.year : p.died; return `<i style="width:${(end - p.ruledFrom) / span * 100}%;background:${i % 2 ? '#7b8fb8' : '#1c2f5e'}"></i>`; }).join('');
  return `<section class="folio status">
   <div class="st-top">${A.shieldSVG(S.house, 40)}<div class="st-name"><h1 class="frak">Maison ${esc(S.house)}</h1><span>${E.name}</span></div><div class="st-year"><b class="frak">${ROMAN(S.year)}</b><span>${S.year}, fin en ${P.endYear}</span></div></div>
   <div class="track thin">${segs}</div>
   <div class="st-res">
    <div>${A.icon('or', 20)}<b data-k="gold" class="${S.gold < 0 ? 'neg' : ''}">${S.gold}</b>${dl('or')}<span>or</span></div>
    <div>${A.icon('armee', 20)}<b data-k="army">${S.army}</b>${dl('soldats')}<span>soldats</span></div>
    <div>${A.icon('prestige', 20)}<b data-k="prestige">${S.prestige}</b>${dl('prestige')}<span>prestige</span></div>
    <div>${A.icon('domaine', 20)}<b data-k="domains">${S.domains}</b>${dl('domaines')}<span>domaines</span></div>
   </div>
   <div class="gauges">
    <div class="gauge"><div class="lb"><span>Stabilité ${dl('stabilité')}</span><em data-k="stab" style="color:${stabC()}">${Math.max(0, S.stab)}</em></div><div class="bar"><i data-g="stab" style="width:${Math.max(0, S.stab)}%;background:${stabC()}"></i></div></div>
    <div class="gauge"><div class="lb"><span>Menace</span><em data-k="menace" style="color:${menC()}">${S.menace}</em></div><div class="bar"><i data-g="menace" style="width:${Math.min(100, S.menace)}%;background:${menC()}"></i></div></div>
   </div></section>`;
}
function rulerCard() {
  const r = D.ruler(S), sp = D.person(S, r.spouse), h = D.heir(S), a = S.amb;
  let amb = '';
  if (a) {
    const A_ = D.AMBITIONS[a.k], prog = Math.max(0, Math.min(A_.need, D.ambitionProgress(S)));
    amb = a.done ? `<div class="amb-l done">Ambition accomplie : <b>${esc(r.epithet || '')}</b></div>` : `<div class="amb-l"><span>${esc(A_.goal)} → <b>${A_.ep[r.sex === 'M' ? 0 : 1]}</b></span><div class="bar"><i style="width:${prog / A_.need * 100}%"></i></div></div>`;
  } else amb = `<div class="amb-l">Régence${S.regency && S.regency.by ? ` : ${S.regency.by === 'mere' ? 'la mère gouverne' : S.regency.by === 'oncle' ? `l'oncle ${esc((S.people[S.regency.id] || {}).name || '')} gouverne` : 'le conseil gouverne'}` : ''} jusqu'aux 16 ans du souverain.</div>`;
  const court = D.livingDyn(S).filter(p => p.id !== r.id);
  if (sp && sp.alive) court.unshift(sp);
  court.sort((x, y) => (x.id === (sp && sp.id) ? -2 : 0) + (h && x.id === h.id ? -1 : 0) - ((y.id === (sp && sp.id) ? -2 : 0) + (h && y.id === h.id ? -1 : 0)));
  const fresh = seenIds ? court.filter(p => !seenIds.has(p.id)).map(p => p.id) : [];
  seenIds = new Set(D.livingDyn(S).map(p => p.id).concat(sp ? [sp.id] : []));
  const fam = court.slice(0, 14).map(p => { const role = sp && p.id === sp.id ? (p.sex === 'F' ? 'Épouse' : 'Époux') : h && p.id === h.id ? (p.sex === 'F' ? 'Héritière' : 'Héritier') : `${ANS(D.age(S, p))}`; const L = p.loyal != null && D.age(S, p) >= 14 ? LOY(p.loyal) : null; return `<button class="${fresh.includes(p.id) ? 'born' : ''}" onclick="who(${p.id})">${mini(p, 44)}<b>${esc(p.name)}</b><span>${role}</span>${L ? `<i class="ld ${L[1]}" title="${L[0]}"></i>` : ''}</button>`; }).join('');
  return `<section class="folio rc"><button class="rc-p" onclick="who(${r.id})" aria-label="Fiche de ${esc(FN(r))}"><span class="niche">${portrait(r, 74)}</span></button>
   <div class="rc-b"><h2 class="frak">${esc(r.title)}${r.epithet ? ` <span class="epi">${esc(r.epithet)}</span>` : ''}</h2><div class="meta">${ANS(D.age(S, r))}, règne depuis ${S.year - r.ruledFrom} ans${sp && sp.from && sp.from !== S.house ? ` <span class="impm" title="Armes de l'alliance">${A.impaledSVG(S.house, sp.from, 20)}</span>` : ''}</div>${traitList(r)}${amb}</div>
   ${fam ? `<div class="rc-fam"><div class="cl">La cour</div><div class="court">${fam}</div></div>` : ''}</section>`;
}
function alerts() {
  const r = D.ruler(S), acts = Object.fromEntries(D.getActions(S).map(x => [x.id, x])), out = [];
  const actBtn = (id, label) => S.aiMode && AI ? '' : acts[id] && acts[id].ok ? `<button class="qa" onclick="act('${id}', true)">${label}</button>` : '';
  const polBtn = (k, v, label) => S.pol[k] !== v ? `<button class="qa alt" onclick="setPol('${k}',${v})">${label}</button>` : '';
  if (!D.heir(S)) out.push(['La lignée est en péril', 'Sans héritier, la mort du souverain met fin à la maison.', actBtn('marier', 'Arranger un mariage') + actBtn('adopter', 'Adopter un pupille')]);
  else if (!r.spouse && D.age(S, r) >= 16) out.push(['Le trône est sans consort', 'Pas de mariage, pas d\'enfants.', actBtn('marier', 'Arranger un mariage')]);
  if (S.stab < 30) out.push([`Les barons grondent`, `Stabilité ${Math.max(0, S.stab)} : à zéro, ils vous déposent.`, polBtn('fisc', 0, 'Impôts légers') + actBtn('festin', 'Grand festin')]);
  if (S.menace > 55 && S.army < 60) out.push([`La maison ${esc(S.rival)} prépare l'invasion`, `Menace ${S.menace}, et seulement ${S.army} soldats.`, polBtn('ost', 2, 'Lever l\'ost') + actBtn('ambassade', 'Ambassade') + actBtn('intrigue', 'Intriguer')]);
  if (S.gold < 0) out.push(['Le trésor est à sec', 'Les dettes rongent la stabilité à chaque tour.', polBtn('cour', 0, 'Cour frugale') + polBtn('fisc', 2, 'Impôts lourds')]);
  return out.map(([t, d, b]) => `<div class="alert"><b>${t}</b><p>${d}</p>${b ? `<div class="qas">${b}</div>` : ''}</div>`).join('');
}
const GROUPS = [['gouv', 'Gouverner'], ['guerre', 'Guerre et diplomatie'], ['famille', 'Famille']];
function actTile(a) {
  const dis = !a.ok || S.over;
  const tired = a.eff != null && a.eff < 0.95 ? `<span class="tired">Usée : ${Math.round(a.eff * 100)} % d'effet</span>` : '';
  const isNew = a.era && a.era === D.eraOf(S) ? '<span class="new">Nouveau</span>' : '';
  return `<button class="act" aria-disabled="${dis}" onclick="act('${a.id}', ${!dis}, this)"><span class="roundel">${A.icon(a.id === 'intrigue' ? 'complot' : a.id, 24)}</span><span class="nm">${a.label}${isNew}</span><span class="fx">${fx(a.desc)}</span>${tired}</button>`;
}
function fxLine(f) {
  const parts = [];
  if (f.gold) parts.push(`${f.gold > 0 ? '+' : '−'}${Math.abs(f.gold)} or`);
  if (f.stab) parts.push(`${f.stab > 0 ? '+' : '−'}${Math.abs(f.stab)} stabilité`);
  if (f.prestige) parts.push(`+${f.prestige} prestige`);
  if (f.army) parts.push(`${f.army > 0 ? '+' : '−'}${Math.abs(f.army)} soldats`);
  return parts.length ? fx(parts.join(', ')) : '<span class="neu">aucun effet</span>';
}
const POLNOTE = { ost: ['défense −20 %', '', 'défense +30 %'] };
function seatFxText(seat, k) {
  if (seat === 'chancelier') { const g = k >= 0 ? Math.ceil(k * 0.7) : k; return g ? `${g > 0 ? '+' : '−'}${Math.abs(g)} or/tour` : 'aucun gain'; }
  if (seat === 'marechal') { const v = Math.round(k / 30 * 100); return v ? `${v > 0 ? '+' : '−'}${Math.abs(v)} % de force à l'ost` : 'ost inchangé'; }
  const st = k >= 2 ? 1 : k < 0 ? -1 : 0, pr = k >= 3 ? 1 : 0, o = [];
  if (st) o.push(`${st > 0 ? '+' : '−'}1 stabilité/tour`); if (pr) o.push('+1 prestige/tour');
  return o.join(', ') || 'sans effet';
}
const HN = h => h.replace(/^d(e |')/, '');
function houseBox(h, compact) {
  const H = D.houseOf(S, h), M = D.MOODS[H.mood], can = S.giftTurn !== S.turn && S.gold >= D.giftCost(S) && !S.over;
  const lands = S.regions.filter(r => r.owner === h).length, cls = H.rel >= 25 ? 'pos' : H.rel <= -25 ? 'neg' : 'neu';
  return `<div class="hbox">${compact ? `<div class="hh">${A.shieldSVG(h, 34)}<div><b>Maison ${esc(HN(h))}</b><small>${lands} terre${lands > 1 ? 's' : ''}</small></div></div>` : ''}
   <div class="hm"><span class="sc">${M.n}</span> — <i>${esc(M.d)}</i></div>
   <div class="hr"><span>Relation : <b class="${cls}">${D.relLabel(H.rel)}</b></span><i class="rbar"><em style="left:${(H.rel + 100) / 2}%"></em></i></div>
   <button class="btn sm ${can ? '' : 'alt'}" ${can ? '' : 'disabled'} onclick="giftGo('${h.replace(/'/g, "\\'")}')">${S.giftTurn === S.turn ? 'Présents déjà envoyés ce tour' : `Envoyer des présents (−${D.giftCost(S)} or)`}</button></div>`;
}
function giftGo(h) { const g = D.sendGift(S, h); if (!g) return; SND.play('coin'); save(); closeM(); render(); }
// ---------- Troupes dessinées à la main ----------
function troopSVG(k, sz, robe) {
  const c = robe || ROBE(), I = '#2a1d10', st = `stroke="${I}" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round"`;
  const body = {
    chevaliers: `<path d="M8 40 q2 -12 12 -14 l14 -1 q6 0 9 -6 l3 -3 l2 4 l-3 5 q2 6 -3 9 l-2 9 M14 40 v-6 M38 40 v-7 M30 26 l1 14" fill="#c9b7a0" ${st}/><path d="M31 13 l-6 -3 l1 -2 l7 2" fill="none" ${st}/>
      <path d="M17 26 q-1 -9 6 -11 l3 -1 q6 1 6 8 l-1 5 Z" fill="${c}" ${st}/><rect x="20" y="4" width="8" height="9" rx="3" fill="#b9c2c9" ${st}/><path d="M21 9 h6" stroke="${I}" stroke-width="1.6"/><path d="M28 6 q5 -4 7 0" fill="none" stroke="#c43d2a" stroke-width="2"/>
      <path d="M10 20 L46 3" stroke="#7a5a30" stroke-width="2"/><path d="M44 2 l5 -1 l-3 4 Z" fill="#b9c2c9" ${st}/><path d="M38 6 l-1 6 l5 -4 Z" fill="${c}"/>`,
    archers: `<circle cx="24" cy="9" r="5" fill="#e8c9a6" ${st}/><path d="M18 8 q6 -9 12 0" fill="#5d6b3a" ${st}/><path d="M17 40 l3 -14 q-2 -9 4 -11 q6 2 4 11 l3 14" fill="${c}" ${st}/><path d="M20 40 v4 M28 40 v4" ${st}/>
      <path d="M35 6 q10 16 0 32" fill="none" stroke="#7a5a30" stroke-width="2"/><path d="M35 6 L35 38" stroke="${I}" stroke-width=".7"/><path d="M14 22 L36 22" stroke="#7a5a30" stroke-width="1.4"/><path d="M12 20 l3 2 l-3 2 M36 22 l-3 -2 M36 22 l-3 2" fill="none" ${st}/><path d="M28 16 l8 6" stroke="#e8c9a6" stroke-width="2.4"/>`,
    pietons: `<circle cx="22" cy="10" r="5" fill="#e8c9a6" ${st}/><path d="M17 9 q5 -7 10 0 v1 h-10 Z" fill="#9aa3aa" ${st}/><path d="M16 40 l3 -15 q-1 -8 3 -9 q5 1 4 9 l3 15" fill="#8a7a5a" ${st}/><path d="M19 40 v4 M27 40 v4" ${st}/>
      <path d="M33 2 L33 44" stroke="#7a5a30" stroke-width="2"/><path d="M31 6 l2 -5 l2 5 Z" fill="#b9c2c9" ${st}/><path d="M8 20 q0 -4 6 -4 q6 0 6 4 v8 q0 6 -6 9 q-6 -3 -6 -9 Z" fill="${c}" ${st}/><path d="M14 18 v17 M9 25 h10" stroke="#f0dca8" stroke-width="1.4"/>`,
  }[k];
  return `<svg viewBox="0 0 50 46" width="${sz}" height="${sz * 46 / 50}" aria-hidden="true">${body}</svg>`;
}
function armyPanel() {
  const t = D.troopCounts(S), T = D.TROOPS, a = D.getActions(S).find(x => x.id === 'recruter');
  return `<section class="folio armyp"><h3 class="h">L'ost</h3><div class="troops">${['chevaliers', 'archers', 'pietons'].map(k => `<div class="tr">${troopSVG(k, 46)}<b>${t[k]}</b><span>${T[k].n}</span></div>`).join('')}</div>
   <div class="mixbar">${['chevaliers', 'archers', 'pietons'].map((k, i) => `<i class="m${i}" style="width:${S.army ? t[k] / S.army * 100 : 0}%"></i>`).join('')}</div>
   <p class="note" style="margin:6px 0 0">Les chevaliers brillent à l'assaut et en rase campagne, les archers au siège et sur les murs ; la piétaille fait le nombre. ${a && a.ok && !S.over ? `<button class="linkb" onclick="recruitMenu()">Recruter…</button>` : ''}</p></section>`;
}
function recruitMenu() {
  const a = D.getActions(S).find(x => x.id === 'recruter'); if (!a) return; SND.play('tap');
  const e = a.eff != null ? a.eff : 1, mx = D.mixOf(S);
  sheet(`<h2 class="frak">Recruter</h2><p class="center story" style="margin:2px 0 8px">Votre ost : ${S.army} hommes, dont ${Math.round(mx.ch * 100)} % de chevaliers et ${Math.round(mx.ar * 100)} % d'archers.</p>
   <div class="rec">${Object.entries(D.TROOPS).map(([k, T]) => `<button class="act" aria-disabled="${S.gold < T.cost}" onclick="${S.gold >= T.cost ? `closeM();recruitGo('${k}')` : ''}">${troopSVG(k, 54)}<span class="nm">${T.n}</span><span class="fx"><span class="neg">−${T.cost} or</span> <span class="pos">+${Math.round(T.gain * e)} hommes</span><span class="neu bdesc">${esc(T.d)}</span></span></button>`).join('')}</div>
   <p class="center" style="margin:12px 0 0"><button class="btn alt" onclick="closeM()">Fermer</button></p>`, true);
}
function recruitGo(k) {
  if (S.over || S.event || queue.length || busyTurn) return;
  busyTurn = true; SND.play('seal'); seal(null, () => { busyTurn = false; turn('recruter', null, k); });
}
function neighbors() {
  if (S.over) return ''; const hs = D.neighborHouses(S); if (!hs.length) return '';
  return `<section class="folio nbs"><h3 class="h">Les maisons voisines</h3><p class="note" style="margin:0 0 8px">Une maison amie accepte plus volontiers l'hommage et vous prête ses lances ; une maison hostile pille vos frontières. Touchez une maison pour lui envoyer des présents (un envoi par tour).</p>
   <div class="nrows">${hs.map(h => { const H = D.houseOf(S, h), cls = H.rel >= 25 ? 'pos' : H.rel <= -25 ? 'neg' : 'neu', n = S.regions.filter(r => r.owner === h).length;
     return `<button class="nrow" onclick="houseSheet('${h.replace(/'/g, "\\'")}')">${A.shieldSVG(h, 30)}<span class="nn"><b>${esc(HN(h))}</b><small>${D.MOODS[H.mood].n} · ${n} terre${n > 1 ? 's' : ''}</small></span><span class="nr"><b class="${cls}">${D.relLabel(H.rel)}</b><i class="rbar"><em style="left:${(H.rel + 100) / 2}%"></em></i></span></button>`; }).join('')}</div></section>`;
}
function houseSheet(h) {
  SND.play('tap');
  sheet(`<div class="rhead">${A.shieldSVG(h, 46)}<div><h2 class="frak" style="text-align:left;margin:0">Maison ${esc(HN(h))}</h2><div class="note" style="margin:0">${S.regions.filter(r => r.owner === h).map(r => esc(r.name)).join(', ')}</div></div></div>${houseBox(h)}
   <p class="center" style="margin:12px 0 0"><button class="btn alt" onclick="closeM()">Fermer</button></p>`, true);
}
function council() {
  if (S.over) return '';
  const c = D.councilOf(S);
  return `<section class="folio council"><h3 class="h">Le conseil</h3><p class="note" style="margin:0 0 8px">Nommez des proches aux trois charges. Leurs traits font leur talent ; un conseiller rancunier devient dangereux.</p>
   <div class="seats">${Object.entries(D.COUNCIL).map(([k, C]) => { const p = c[k] != null ? S.people[c[k]] : null, sk = p ? D.seatSkill(S, k, p) : 0, L = p ? LOY(p.loyal) : null;
     return `<button class="seat ${p ? '' : 'vac'}" onclick="councilSheet('${k}')"><span class="sic">${A.icon(C.ic, 18)}</span><span class="sn sc">${C.n}</span>${p ? `${mini(p, 44)}<b>${esc(p.name)}</b><small class="${sk > 0 ? 'pos' : sk < 0 ? 'neg' : 'neu'}">${seatFxText(k, sk)}</small><i class="lb"><em style="width:${p.loyal}%" class="${L[1]}"></em></i>` : `<span class="vacant">+</span><b>Vacant</b><small class="neu">Touchez pour nommer</small>`}</button>`; }).join('')}</div></section>`;
}
function councilSheet(seat) {
  SND.play('tap');
  const C = D.COUNCIL[seat], cur = D.councilOf(S)[seat], list = D.councilCandidates(S, seat);
  const good = Object.entries(C.t).filter(([t, v]) => v > 0).map(([t]) => D.TRAITS[t].n.toLowerCase()).join(', ');
  sheet(`<h2 class="frak">${C.n}</h2><p class="center story" style="margin:2px 0 10px">Le ${C.n.toLowerCase()} ${C.role}. Talents recherchés : ${good}. L'âge mûr aide ; un conseiller rancunier sert mal.</p>
   ${list.length ? `<div class="cands">${list.map(x => { const q = S.people[x.id], L = LOY(q.loyal), here = x.id === cur;
     return `<div class="cand3 ${here ? 'here' : ''}">${mini(q, 46)}<div class="ci"><b>${esc(q.name)}</b> <span class="neu">${D.age(S, q)} ans</span><div class="tl">${q.traits.map(t => D.TRAITS[t].n).join(', ') || 'sans trait marqué'}</div><div><span class="${x.skill > 0 ? 'pos' : x.skill < 0 ? 'neg' : 'neu'}">${seatFxText(seat, x.skill)}</span> · <span class="${L[1]}">${L[0]}</span>${x.busy ? ' · <span class="neu">siège déjà</span>' : ''}</div></div>
       ${here ? `<button class="btn sm alt" onclick="appointGo('${seat}',null)">Renvoyer</button>` : `<button class="btn sm" onclick="appointGo('${seat}',${x.id})">Nommer</button>`}</div>`; }).join('')}</div>` : '<p class="center neu">Aucun adulte de la famille ne peut siéger pour l\'instant.</p>'}
   ${cur != null ? '<p class="center note" style="margin:10px 0 0">Renvoyer un conseiller le blesse (−15 loyauté) et inquiète la cour (−1 stabilité).</p>' : ''}
   <p class="center" style="margin:12px 0 0"><button class="btn alt" onclick="closeM()">Fermer</button></p>`, true);
}
function appointGo(seat, id) { D.appoint(S, seat, id); SND.play(id == null ? 'tap' : 'seal'); save(); closeM(); render(); }
function policies() {
  return `<section class="folio pol"><h3 class="h">Politiques du royaume</h3><p class="note" style="margin:0 0 6px">Elles s'appliquent d'elles-mêmes à chaque tour. Changez-les quand la situation l'exige.</p>
   ${Object.entries(D.POLICIES).map(([k, P]) => `<div class="prow"><div class="plab">${P.n}</div><div class="seg" role="radiogroup" aria-label="${P.n}">${P.opts.map((o, v) => `<button role="radio" aria-checked="${S.pol[k] === v}" onclick="setPol('${k}',${v})">${o}</button>`).join('')}</div>
     <div class="pfx">${fxLine(D.policyFx(S, k, S.pol[k]))}${POLNOTE[k] && POLNOTE[k][S.pol[k]] ? ` <span class="neu">${POLNOTE[k][S.pol[k]]}</span>` : ''}</div></div>`).join('')}</section>`;
}
function setPol(k, v) { if (S.over) return; D.setPolicy(S, k, v); save(); render(); }
function viewCour() {
  const acts = D.getActions(S), wait = acts.find(a => a.id === 'attendre');
  const nw = news.length ? `<section class="folio news2"><h3 class="h">Ces trois dernières années</h3>${news.map(l => `<p class="k-${l.k}">${esc(l.t)}</p>`).join('')}</section>` : '';
  const aiOn = S.aiMode && AI && !S.over;
  const classic = `<div class="decide"><h3>${aiOn ? 'Décisions classiques' : `Votre décision pour ${S.year}–${S.year + S.P.ypt}`}</h3><p>Une seule entreprise par période de trois ans.</p></div>
  ${GROUPS.map(([g, t]) => `<div class="glab">${t}</div><div class="acts">${acts.filter(a => a.g === g).map(actTile).join('')}</div>`).join('')}
  <button class="wait" ${S.over ? 'disabled' : ''} onclick="act('attendre', ${!S.over}, this)"><b>${wait.label}</b><span>${wait.desc}</span></button>`;
  const modeLink = !S.aiMode && AI && !S.over ? `<button class="linkb light" onclick="S.aiMode=true;S.ai=S.ai||{story:[],pendingFacts:[],suggestions:[]};S.ai.ready=null;save();render()">Passer en chronique libre : écrire vos ordres à l'IA</button>` : '';
  return `${statusBar()}${rulerCard()}${alerts()}${aiOn ? aiFolio() : ''}${aiOn && showClassic ? classic : ''}${modeLink}

  ${armyPanel()}${council()}${neighbors()}${policies()}${nw}${royaumeInfo()}
  ${S.over ? `<p style="text-align:center"><button class="btn" onclick="newGame()">Fonder une nouvelle maison</button></p>` : ''}`;
}
// ---------- Mode chronique libre (IA) ----------
let AI = null, aiBusy = null, aiErr = null, showClassic = false;
function initAI() {
  try {
    if (window.claude && window.claude.use) window.claude.use('sample').then(x => { AI = x; render(); }).catch(() => {});
  } catch (e) {}
}
const POLNAMES = k => D.POLICIES[k].opts[S.pol[k]].toLowerCase();
function personLine(p) {
  const role = p.id === S.rulerId ? 'souverain' : (D.heir(S) && D.heir(S).id === p.id ? 'héritier' : (p.inDyn ? 'famille' : 'conjoint'));
  const T = D.TEMPERS[p.temper];
  return `- [id ${p.id}] ${FN(p)}, ${p.sex === 'M' ? 'homme' : 'femme'}, ${ANS(D.age(S, p))}, ${role}${p.spouse ? ', marié à ' + D.person(S, p.spouse).name : ''}${p.traits.length ? ', traits : ' + p.traits.map(t => D.TRAITS[t].n.toLowerCase()).join(', ') : ''}${T ? ', tempérament ' + T.n.toLowerCase() : ''}${p.passion ? ', passion : ' + p.passion : ''}${p.mark ? ', ' + p.mark : ''}${p.loyal != null && p.id !== S.rulerId ? ', loyauté ' + p.loyal + '/100' : ''}`;
}
function brief() {
  const r = D.ruler(S), E = D.ERAS[D.eraOf(S)], a = S.amb ? D.AMBITIONS[S.amb.k] : null;
  const fam = D.livingDyn(S).slice(0, 12);
  const sp = D.person(S, r.spouse);
  if (sp && sp.alive && !fam.includes(sp)) fam.push(sp);
  const works = [S.cathedral ? 'cathédrale achevée' : S.chantier ? 'cathédrale en chantier' : '', S.univ ? 'université' : '', S.mine && !S.mineSold ? 'mine d\'argent' : '', S.trade ? 'route marchande' : ''].filter(Boolean).join(', ');
  return `MAISON ${S.house.toUpperCase()}, rivale : maison ${S.rival}. An ${S.year} (${E.name}). La partie se termine en ${S.P.endYear}.
RESSOURCES : or ${S.gold}, soldats ${S.army}, prestige ${S.prestige}, domaines ${S.domains}, stabilité ${S.stab}/100 (à 0 les barons déposent le souverain), menace ${S.menace} (au-delà de 40, risque d'invasion par la maison ${S.rival}), alliances ${S.alliances}.
POLITIQUES : impôts ${POLNAMES('fisc')}, cour ${POLNAMES('cour')}, ost ${POLNAMES('ost')}.${works ? '\nOUVRAGES : ' + works + '.' : ''}
SEIGNEUR RIVAL : ${S.rivalLord && !S.rivalDown ? `${S.rivalLord.name} ${S.rival}, ${S.year - S.rivalLord.born} ans, ${S.rivalLord.traits.map(t => D.TRAITS[t].n.toLowerCase()).join(', ')}, tempérament ${D.TEMPERS[S.rivalLord.temper].n.toLowerCase()}` : 'aucun (maison anéantie)'}.
MANDEMENT EN COURS : ${S.mission ? `${D.ISSUERS[D.MISSIONS[S.mission.k].issuer].n} exige : ${D.MISSIONS[S.mission.k].goal(S.mission.target)} (où en est-on : ${S.mission.prog}/${S.mission.target}), échéance an ${S.year + (S.mission.deadline - S.turn) * S.P.ypt}` : 'aucun'}.
AMBITION DU SOUVERAIN : ${a ? (S.amb.done ? 'accomplie' : a.goal) : 'aucune (régence)'}.
FAMILLE VIVANTE :
${fam.map(personLine).join('\n')}
TERRES VOISINES : ${D.borderTargets(S).slice(0, 6).map(r => `${r.name} (${r.owner === 'rival' ? 'maison rivale' : 'maison ' + r.owner.replace(/^d(e |')/, '')}, chances de conquête ${Math.round(D.campaignOdds(S, r.i) * 100)} %)`).join(', ')}.
ORDRE DE SUCCESSION : ${D.successionLine(S).slice(0, 4).map(id => S.people[id].name).join(', ') || 'personne (la maison s\'éteindra à la mort du souverain)'}.`;
}
function storyMem() {
  const st = (S.ai.story || []).slice(-8);
  return st.length ? 'HISTOIRE RÉCENTE (du plus ancien au plus récent) :\n' + st.map(x => `- ${x.y} : ${x.t}`).join('\n') : 'HISTOIRE RÉCENTE : la maison vient d\'être fondée.';
}
const ACTION_LIST = 'campagne (guerre de conquête, issue tirée au sort selon l\'armée), construire (édifice, coûte de l\'or), festin, ambassade (baisse la menace), intrigue (contre la maison rivale), recruter, mercenaires (seulement après 1300), pelerinage (seulement après 1250), eduquer (l\'héritier), marier (cible = id d\'un célibataire de la famille, type alliance ou local), adopter (seulement sans héritier), attendre';

function openingPrompt(facts, hist) {
  return `Tu es le chroniqueur d'un jeu de simulation dynastique médiévale en français. Ton style : sobre, concret, littéraire, au passé simple, comme une chronique du XIIIe siècle écrite pour un lecteur moderne. Pas d'emphase, pas de clichés, des détails précis (noms de lieux plausibles, saisons, gestes).

${brief()}

${storyMem()}

FAITS DES TROIS DERNIÈRES ANNÉES (calculés par le jeu, tous doivent apparaître dans ta chronique, sans en inventer de contradictoires) :
${facts.length ? facts.map(f => '- ' + f).join('\n') : '- Rien de notable : la vie suivit son cours.'}
${hist ? `\nÉVÉNEMENT HISTORIQUE À METTRE EN SCÈNE DANS LA SITUATION : ${hist}` : ''}

Écris :
1. "chronique" : 2 à 4 phrases qui racontent ces trois années en intégrant les faits.
2. "situation" : 2 ou 3 phrases qui posent UN problème ou UNE opportunité concrète qui appelle une décision du souverain maintenant. Elle doit découler de l'histoire récente ou de l'état du royaume (famille, rivaux, vassaux, Église, marchands, peuple…), être différente des situations déjà vécues, et laisser plusieurs réponses possibles. Ne propose pas de choix dans ce texte.
3. "suggestions" : 3 ordres courts (moins de 12 mots chacun), à la première personne, très différents les uns des autres, dont au moins un audacieux.

Réponds uniquement avec un objet JSON : {"chronique": "...", "situation": "...", "suggestions": ["...", "...", "..."]}`;
}
function orderPrompt(order) {
  const acts = D.getActions(S).filter(a => a.ok).map(a => a.id).join(', ');
  return `Tu es le maître du jeu d'une simulation dynastique médiévale en français. Le joueur incarne le souverain et vient d'écrire librement son ordre. Tu décides de ses conséquences, de façon juste, plausible et parfois surprenante.

${brief()}

${storyMem()}

SITUATION EN COURS : ${S.ai.situation}

ORDRE DU SOUVERAIN : « ${order.slice(0, 500)} »

Règles :
- Respecte l'intention du joueur, mais le monde réagit : un ordre a un prix, il peut échouer en partie, et plus il est audacieux, plus le risque et la récompense sont grands. Pas de succès automatique ni d'échec gratuit.
- Si l'ordre correspond à l'une de ces actions du jeu, indique-la dans "action" : ${ACTION_LIST}. Actions possibles en ce moment : ${acts}. Le jeu appliquera lui-même son coût et son issue (par exemple l'issue d'une bataille) : ne les ajoute pas dans "effets", et pour une campagne raconte le départ, pas l'issue. Sinon mets "attendre".
- "effets" sont les conséquences immédiates en plus de l'action, modestes et cohérentes : or entre -40 et 40, stabilite entre -12 et 12, prestige entre -12 et 12, soldats entre -20 et 20, menace entre -25 et 25. Un ordre qui coûte doit coûter de l'or.
- "mort" : seulement si l'ordre l'implique directement (exécution, duel, expédition périlleuse…) ou expose gravement quelqu'un. Utilise un id de la liste. Sinon null.
- "traits" : au plus 2 changements, seulement s'ils découlent de l'ordre. Traits possibles : brave, couard, sage, cruel, pieux, avare, prodigue, charismatique, robuste, maladif, genie, simplet.
- N'invente pas de nouveaux membres de la famille. N'utilise que les id fournis.

Réponds uniquement avec un objet JSON :
{"titre": "3 à 6 mots", "recit": "3 à 5 phrases au passé simple qui racontent l'exécution de l'ordre et ses conséquences", "action": "...", "cible": null, "type_mariage": null, "effets": {"or": 0, "stabilite": 0, "prestige": 0, "soldats": 0, "menace": 0}, "mort": null, "traits": [], "resume": "une phrase qui résume ce qui s'est passé, pour la mémoire de la chronique"}`;
}
function parseJSON(x) {
  if (x && typeof x === 'object') return x;
  const t = String(x || ''); const i = t.indexOf('{'), j = t.lastIndexOf('}');
  return JSON.parse(t.slice(i, j + 1));
}
async function askAI(prompt, tier) {
  const call = AI.json ? AI.json : AI;
  const res = await call(prompt, { modelTier: tier, cache: false });
  return parseJSON(res && res.text != null ? res.text : res);
}
function aiErrorText(e) {
  const c = e && e.code;
  return c === 'not_granted' ? 'L\'accès à l\'IA n\'a pas été autorisé pour ce jeu.' : c === 'rate_limited' ? 'Le chroniqueur est débordé (limite d\'utilisation atteinte). Réessayez dans un moment, ou jouez ce tour en mode classique.' : 'Le chroniqueur n\'a pas pu répondre. Réessayez, ou jouez ce tour en mode classique.';
}

// Début de tour : chronique des années passées + nouvelle situation
async function aiOpening() {
  if (!AI || !S.aiMode || S.over || aiBusy) return;
  const facts = (S.ai.pendingFacts || []).slice(-12);
  const h = D.histDueEvent(S);
  const hist = h ? h.text(S) : null;
  aiBusy = 'opening'; aiErr = null; render();
  try {
    const r = await askAI(openingPrompt(facts, hist), 'default');
    if (!r.situation) throw new Error('réponse incomplète');
    if (h) D.markHistDone(S, h.id);
    S.ai.chronique = String(r.chronique || '').slice(0, 1200);
    S.ai.situation = String(r.situation).slice(0, 800);
    S.ai.suggestions = (Array.isArray(r.suggestions) ? r.suggestions : []).slice(0, 3).map(x => String(x).slice(0, 90));
    S.ai.pendingFacts = []; S.ai.ready = S.year;
    save();
  } catch (e) { aiErr = aiErrorText(e); if (e && e.code === 'not_granted') { AI = null; } }
  aiBusy = null; render();
}
// L'ordre du joueur
async function ordonner() {
  const ta = $('ordre'); const order = (ta && ta.value || '').trim();
  if (!order || aiBusy || S.over) return;
  S.ai.draft = order;
  aiBusy = 'order'; aiErr = null; render();
  let r;
  try { r = await askAI(orderPrompt(order), 'default'); }
  catch (e) { aiErr = aiErrorText(e); aiBusy = null; render(); return; }
  aiBusy = null;
  // validation
  const acts = Object.fromEntries(D.getActions(S).map(a => [a.id, a]));
  let action = acts[r.action] && acts[r.action].ok ? r.action : 'attendre';
  let cible = null, type = null;
  if (action === 'marier') {
    const ok = D.unmarriedAdults(S).find(p => p.id === +r.cible);
    if (ok) { cible = ok.id; const mk = D.marriageMarket(S, ok); const want = r.type_mariage === 'alliance' ? ['prince', 'noble', 'vassal'] : ['vassal', 'noble', 'marchand']; let idx = -1; for (const rk of want) { idx = mk.findIndex(c => c.rank === rk && D.candidateFx(S, ok, c).ok); if (idx >= 0) break; } if (idx >= 0) type = idx; else action = 'attendre'; } else action = 'attendre';
  }
  const before = S.log[S.log.length - 1], snap = snapshot(), y0 = S.year, from = raw();
  const extra = D.applyAI(S, r);
  S.ai.story = (S.ai.story || []).concat({ y: S.year, t: `Ordre : « ${order.slice(0, 140)} ». ${String(r.resume || '').slice(0, 220)}` }).slice(-12);
  if (!S.over) D.playTurn(S, action, cible, type);
  const newLog = S.log.slice(S.log.indexOf(before) + 1);
  S.ai.pendingFacts = newLog.filter(l => l.k !== 'ev').map(l => l.t);
  S.ai.ready = null; S.ai.draft = '';
  news = newLog; deltas = diff(snap, snapshot());
  queue = [{ type: 'aiResult', r, extra, facts: newLog.filter(l => l.k !== 'ev' && (l.k === 'good' || l.k === 'bad' || l.k === 'big')).map(l => l.t).slice(0, 6), d: deltas.slice() }, ...takeFlashes()];
  if (S.over) queue.push({ type: 'end' });
  save(); render(); scrollTo(0, 0);
  if (S.year !== y0) yearsPass(y0, S.year);
  animateStatus(from, 1150);
  setTimeout(nextQ, reduced ? 0 : 1300);
}
function showAiResult(q) {
  SND.play('page');
  sheet(`${scn('cour', 'plume', false, 96)}<h2 class="frak">${esc(q.r.titre || 'Ainsi fut fait')}</h2>
   <p class="story">${esc(q.r.recit || '')}</p>
   ${q.extra.length ? `<p class="center k-good">${q.extra.map(esc).join(' ')}</p>` : ''}
   ${q.facts.length ? `<div class="aifacts"><span class="sc">Dans les années qui suivirent</span>${q.facts.map(t => `<p>${esc(t)}</p>`).join('')}</div>` : ''}
   <div class="center">${pills(q.d) || '<span class="note">Aucun effet immédiat.</span>'}</div>
   <p class="center" style="margin:16px 0 0"><button class="btn" onclick="nextQ()">Continuer</button></p>`);
}
function useSuggestion(i) { const ta = $('ordre'); if (ta) { ta.value = S.ai.suggestions[i]; ta.focus(); } }
function aiFolio() {
  const r = D.ruler(S);
  if (aiBusy === 'opening') return `<section class="folio aif"><div class="quill"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div><p class="center note">Le chroniqueur consigne les trois dernières années…</p></section>`;
  if (!S.ai.ready && !aiErr) { setTimeout(aiOpening, 50); return `<section class="folio aif"><p class="center note">Le chroniqueur prépare son registre…</p></section>`; }
  if (!S.ai.ready && aiErr) return `<section class="folio aif"><p class="k-bad">${esc(aiErr)}</p><p class="center"><button class="btn" onclick="aiOpening()">Réessayer</button> <button class="btn alt" onclick="showClassic=true;render()">Jouer en classique</button></p></section>`;
  const busy = aiBusy === 'order';
  return `<section class="folio aif"><div class="sc" style="color:var(--verm)">L'an ${ROMAN(S.year)}</div>
   ${S.ai.chronique ? `<p class="dc">${esc(S.ai.chronique)}</p>` : ''}
   <div class="situ"><b>Ce qui se présente</b><p>${esc(S.ai.situation)}</p></div>
   <label for="ordre" class="olab">Que décide ${esc(r.title)} ?</label>
   <textarea id="ordre" rows="3" maxlength="500" placeholder="Écrivez l'ordre du souverain, avec vos mots." ${busy ? 'disabled' : ''}>${esc(S.ai.draft || '')}</textarea>
   ${S.ai.suggestions && S.ai.suggestions.length ? `<div class="sugg">${S.ai.suggestions.map((t, i) => `<button onclick="useSuggestion(${i})" ${busy ? 'disabled' : ''}>${esc(t)}</button>`).join('')}</div>` : ''}
   ${aiErr ? `<p class="k-bad" style="font-size:15px">${esc(aiErr)}</p>` : ''}
   <button class="btn wide" onclick="ordonner()" ${busy ? 'disabled' : ''}>${busy ? 'Le conseil délibère…' : 'Ordonner'}</button>
   <button class="linkb" onclick="showClassic=!showClassic;render()">${showClassic ? 'Masquer les décisions classiques' : 'Ou choisir une décision classique'}</button></section>`;
}
function startMode(ai) {
  closeM(); S.aiMode = !!ai; S.ai = { story: [], pendingFacts: [], suggestions: [] };
  if (ai) { S.ai.pendingFacts = S.log.map(l => l.t); tab = 'cour'; }
  save(); render();
  if (!ai) setTimeout(() => guide(0), 500);
}
function titleScreen() {
  const ai = !!AI;
  $('modal').innerHTML = `<div class="title" role="dialog" aria-modal="true">
    <div class="tsc">${SCENE.svg('chateau', { flag: ROBE(), seed: S.seed % 999, h: 300, big: true })}</div>
    <div class="tin">
     <div class="tlogo"><span class="frak">Couronnes</span><i>&amp;</i><span class="frak">Lignées</span></div>
     <p class="tsub">Cent cinquante ans pour bâtir une dynastie</p>
     <div class="thouse">${A.shieldSVG(S.house, 60)}<div><b class="frak">Maison ${esc(S.house)}</b><span>${esc(D.ruler(S).title)}, ${D.age(S, D.ruler(S))} ans · rivale : maison ${esc(S.rival)}</span></div></div>
     ${ai ? `<button class="tbtn" onclick="SND.unlock();startMode(true)"><b>Chronique libre</b><span>L'IA raconte, vous ordonnez avec vos mots</span></button>` : ''}
     <button class="tbtn ${ai ? 'alt' : ''}" onclick="SND.unlock();startMode(false)"><b>${ai ? 'Mode classique' : 'Fonder la maison'}</b><span>Décisions et événements préparés</span></button>
     <button class="treroll" onclick="newGame()">Tirer une autre maison</button>
     <button class="treroll" style="opacity:.5;font-size:12px" onclick="startTest()">🧪 Mode test (mesures, partie à part)</button>
    </div></div>`;
}
function modeChooser() {
  if (!AI) return;
  sheet(`<div class="center">${A.shieldSVG(S.house, 64)}</div><h2 class="frak" style="font-size:30px">Maison ${esc(S.house)}</h2>
   <p class="story center">Comment voulez-vous régner ?</p>
   <button class="choice" onclick="startMode(true)"><span class="nm">Chronique libre</span><span class="fx"><span class="neu">À chaque tour, l'IA raconte ce qui s'est passé. Vous écrivez vos ordres avec vos mots, et elle en tire des conséquences toujours différentes.</span></span></button>
   <button class="choice" onclick="startMode(false)"><span class="nm">Mode classique</span><span class="fx"><span class="neu">Des décisions et des événements préparés, joués d'un geste.</span></span></button>`);
}

// ---------- Sons (synthétisés dans la page) ----------
const SND = (() => {
  let ctx = null, master = null, musicGain = null, musicTimer = null;
  let sfxOn = true, musicOn = true;
  try { const p = JSON.parse(localStorage.getItem('cl_sound') || '{}'); if (p.sfx === false) sfxOn = false; if (p.music === false) musicOn = false; } catch (e) {}
  const savePref = () => { try { localStorage.setItem('cl_sound', JSON.stringify({ sfx: sfxOn, music: musicOn })); } catch (e) {} };
  function ac() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = 0.7; master.connect(ctx.destination); musicGain = ctx.createGain(); musicGain.gain.value = 0.0; musicGain.connect(master); } catch (e) { return null; } }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }
  function env(g, t, a, peak, d) { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  function noiseBuf() { const b = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; }
  let NB = null;
  function pluck(f, t, vol = 0.25, dur = 1.1, dest) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    o.type = 'triangle'; o2.type = 'square'; o.frequency.value = f; o2.frequency.value = f * 1.002;
    const g2 = ctx.createGain(); g2.gain.value = 0.18;
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(f * 8, t); lp.frequency.exponentialRampToValueAtTime(f * 1.5, t + dur * 0.6);
    o.connect(lp); o2.connect(g2).connect(lp); lp.connect(g).connect(dest || master);
    env(g, t, 0.004, vol, dur); o.start(t); o2.start(t); o.stop(t + dur + 0.1); o2.stop(t + dur + 0.1);
  }
  function noise(t, dur, vol, type, freq, q) {
    NB = NB || noiseBuf(); const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = NB; f.type = type; f.frequency.value = freq; f.Q.value = q || 0.8; s.connect(f).connect(g).connect(master); env(g, t, 0.003, vol, dur); s.start(t); s.stop(t + dur + 0.05);
  }
  function drum(t, vol = 0.6) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.25);
    o.connect(g).connect(master); env(g, t, 0.005, vol, 0.35); o.start(t); o.stop(t + 0.45); noise(t, 0.12, vol * 0.25, 'lowpass', 900);
  }
  function bell(f, t, vol = 0.18, dur = 2.6) {
    [[1, 1], [2.0, 0.5], [2.76, 0.35], [5.4, 0.15], [0.5, 0.25]].forEach(([m, a]) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f * m; o.connect(g).connect(master); env(g, t, 0.005, vol * a, dur / Math.sqrt(m)); o.start(t); o.stop(t + dur + 0.1); });
  }
  function brass(f, t, dur, vol = 0.12) {
    const o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.value = f;
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(600, t); lp.frequency.linearRampToValueAtTime(2200, t + 0.06); lp.frequency.linearRampToValueAtTime(1200, t + dur);
    o.connect(lp).connect(g).connect(master); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.04); g.gain.setValueAtTime(vol, t + dur - 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.15);
    o.start(t); o.stop(t + dur + 0.2);
  }
  const N = n => 440 * Math.pow(2, (n - 69) / 12);
  const fx = {
    tap() { pluck(N(74), ctx.currentTime, 0.12, 0.5); },
    seal() { const t = ctx.currentTime; noise(t, 0.16, 0.5, 'lowpass', 500); const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.15); o.connect(g).connect(master); env(g, t, 0.004, 0.5, 0.2); o.start(t); o.stop(t + 0.3); },
    year(i) { const t = ctx.currentTime; bell(N([69, 72, 76, 81][i % 4]), t, 0.06, 1.2); },
    coin() { const t = ctx.currentTime; [0, 0.07, 0.15].forEach((d, i) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = [2600, 3300, 2950][i]; o.connect(g).connect(master); env(g, t + d, 0.002, 0.07, 0.18); o.start(t + d); o.stop(t + d + 0.25); }); },
    loss() { const t = ctx.currentTime; pluck(N(50), t, 0.15, 0.6); pluck(N(49), t + 0.12, 0.12, 0.7); },
    page() { const t = ctx.currentTime; noise(t, 0.25, 0.12, 'bandpass', 2400, 0.6); },
    event() { const t = ctx.currentTime; this.page(); [62, 69, 74, 77].forEach((n, i) => pluck(N(n), t + 0.12 + i * 0.09, 0.16, 1.4)); },
    hist() { const t = ctx.currentTime; this.page(); bell(N(57), t + 0.05, 0.14, 3); [62, 69, 74].forEach((n, i) => pluck(N(n), t + 0.3 + i * 0.12, 0.16, 1.6)); },
    march() { const t = ctx.currentTime; for (let i = 0; i < 5; i++) drum(t + i * 0.17, i % 2 ? 0.35 : 0.55); },
    battle(won) {
      const t = ctx.currentTime; [0, 0.18, 0.36, 0.5].forEach(d => drum(t + d, 0.6));
      noise(t + 0.62, 0.35, 0.5, 'highpass', 2500); [1250, 1870, 2630].forEach(f => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = f; o.connect(g).connect(master); env(g, t + 0.62, 0.002, 0.06, 0.6); o.start(t + 0.62); o.stop(t + 1.3); });
      if (won) [[67, 0], [72, 0.14], [76, 0.28], [79, 0.42]].forEach(([n, d], i) => brass(N(n), t + 1.25 + d, i === 3 ? 0.7 : 0.13));
      else [[62, 0], [61, 0.3], [57, 0.6]].forEach(([n, d]) => brass(N(n - 12), t + 1.25 + d, 0.4, 0.09));
    },
    toll() { const t = ctx.currentTime; bell(N(45), t, 0.22, 3.4); bell(N(45), t + 1.4, 0.18, 3.4); },
    crown() { const t = ctx.currentTime + 1.0; [[69, 0], [74, 0.16], [78, 0.32], [81, 0.48]].forEach(([n, d], i) => brass(N(n), t + d, i === 3 ? 0.8 : 0.15, 0.1)); },
    glory() { const t = ctx.currentTime; [74, 78, 81, 86, 90].forEach((n, i) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = N(n); o.connect(g).connect(master); env(g, t + i * 0.07, 0.005, 0.07, 1.4); o.start(t + i * 0.07); o.stop(t + 1.6 + i * 0.07); }); },
    era() { const t = ctx.currentTime; bell(N(50), t, 0.12, 3); [[62, 0.3], [66, 0.5], [69, 0.7], [74, 0.9]].forEach(([n, d], i) => brass(N(n), t + d, i === 3 ? 1.0 : 0.18, 0.09)); },
    end(won) { const t = ctx.currentTime; if (won) this.crown(); else { bell(N(40), t, 0.22, 4); bell(N(43), t + 1.2, 0.16, 4); } },
  };
  // musique : luth modal discret sur un bourdon
  const SCALE = [62, 64, 65, 67, 69, 71, 72, 74, 76, 77];
  let step = 0, pos = 4;
  function musicTick() {
    if (!ctx || !musicOn || document.hidden) return;
    const t = ctx.currentTime + 0.05;
    if (step % 16 === 0) { [38, 45].forEach(n => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = N(n); o.connect(g).connect(musicGain); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 1.2); g.gain.exponentialRampToValueAtTime(0.0001, t + 7.5); o.start(t); o.stop(t + 7.8); }); }
    if (Math.random() < (step % 4 === 0 ? 0.9 : 0.45)) { pos = Math.max(0, Math.min(SCALE.length - 1, pos + [-2, -1, -1, 1, 1, 2, 0][Math.floor(Math.random() * 7)])); pluck(N(SCALE[pos]), t, 0.18, 1.6, musicGain); if (step % 8 === 0) pluck(N(SCALE[pos] - 12), t, 0.12, 1.8, musicGain); }
    step++;
  }
  function startMusic() { if (!ac() || musicTimer) return; musicGain.gain.setTargetAtTime(musicOn ? 0.55 : 0, ctx.currentTime, 0.8); musicTimer = setInterval(musicTick, 420); }
  document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend().catch(() => {}); else ctx.resume().catch(() => {}); });
  return {
    play(name, ...a) { if (!sfxOn || reduced && name === 'music') return; if (!ac()) return; try { fx[name] && fx[name](...a); } catch (e) {} },
    unlock() { if (!ac()) return; if (musicOn) startMusic(); },
    get sfx() { return sfxOn; }, get music() { return musicOn; },
    toggleSfx() { sfxOn = !sfxOn; savePref(); if (sfxOn) { ac(); fx.tap(); } },
    toggleMusic() { musicOn = !musicOn; savePref(); if (musicOn) { startMusic(); musicGain && musicGain.gain.setTargetAtTime(0.55, ctx.currentTime, 0.8); } else if (musicGain) musicGain.gain.setTargetAtTime(0, ctx.currentTime, 0.3); },
  };
})();
document.addEventListener('pointerdown', () => SND.unlock(), { once: true });

// ---------- Carte illustrée ----------
const MAP2 = (() => {
  const hs = str => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const F = n => n.toFixed(1);
  // segment tracé à la main, identique vu des deux cellules voisines
  function wob(p, q) {
    const k1 = F(p[0]) + ',' + F(p[1]), k2 = F(q[0]) + ',' + F(q[1]);
    const fwd = k1 < k2, a = fwd ? p : q, b = fwd ? q : p;
    const r = rng(hs(k1 < k2 ? k1 + '|' + k2 : k2 + '|' + k1));
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
    const n = Math.max(1, Math.floor(L / 7)), nx = -dy / (L || 1), ny = dx / (L || 1), amp = Math.min(3.2, L * 0.09);
    const pts = []; for (let i = 1; i < n; i++) { const t = i / n, o = (r() - 0.5) * 2 * amp * Math.sin(Math.PI * t); pts.push([a[0] + dx * t + nx * o, a[1] + dy * t + ny * o]); }
    if (!fwd) pts.reverse();
    return pts;
  }
  function wpath(poly) {
    let d = 'M' + F(poly[0][0]) + ' ' + F(poly[0][1]);
    for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length]; for (const m of wob(p, q)) d += ' L' + F(m[0]) + ' ' + F(m[1]); d += ' L' + F(q[0]) + ' ' + F(q[1]); }
    return d + ' Z';
  }
  function inPoly(poly, x, y) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) c = !c; } return c; }
  function distToEdge(poly, x, y) { let m = 1e9; for (let i = 0; i < poly.length; i++) { const [ax, ay] = poly[i], [bx, by] = poly[(i + 1) % poly.length]; const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1))); m = Math.min(m, Math.hypot(x - ax - t * dx, y - ay - t * dy)); } return m; }
  // ---------- décor statique (dépend seulement de la carte) ----------
  const cache = {};
  function decor(seed, regions) {
    const key = seed + ':' + regions.map(r => r.terrain[0]).join('');
    if (cache[key]) return cache[key];
    const g = D.mapGeom(seed), r = rng(hs('decor' + seed));
    let under = '', over = '';
    // rivières : du cœur des terres vers la mer
    const rivers = [];
    for (let k = 0; k < 2; k++) {
      let x = g.W * (0.35 + r() * 0.3), y = g.H * (0.3 + r() * 0.4);
      const ang0 = r() * Math.PI * 2; let ang = ang0; const pts = [[x, y]];
      for (let i = 0; i < 60; i++) { ang += (r() - 0.5) * 0.7; x += Math.cos(ang) * 7; y += Math.sin(ang) * 7; ang = ang * 0.85 + ang0 * 0.15; pts.push([x, y]); if (!inPoly(g.coast, x, y)) break; }
      if (pts.length > 6) rivers.push(pts);
    }
    for (const pts of rivers) {
      const d = 'M' + pts.map(p => F(p[0]) + ' ' + F(p[1])).join(' L');
      under += `<path d="${d}" fill="none" stroke="#5f7f8e" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity=".55"/><path d="${d}" fill="none" stroke="#9fc0c8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    // reliefs, forêts, marais, champs par terre
    g.cells.forEach((c, i) => {
      const t = regions[i].terrain, rr = rng(hs('cell' + seed + ':' + i));
      const spots = []; let tries = 0;
      const want = t === 'forêt' ? 16 : t === 'collines' ? 6 : t === 'marais' ? 6 : 5;
      while (spots.length < want && tries++ < 300) {
        const x = c.c[0] + (rr() - 0.5) * 90, y = c.c[1] + (rr() - 0.5) * 90;
        if (!inPoly(c.poly, x, y) || distToEdge(c.poly, x, y) < 7) continue;
        if (Math.hypot(x - c.c[0], y - c.c[1]) < 22) continue; // place pour le château et le nom
        if (rivers.some(pts => pts.some(p => Math.hypot(p[0] - x, p[1] - y) < 6))) continue;
        spots.push([x, y, rr()]);
      }
      spots.sort((a, b) => a[1] - b[1]);
      for (const [x, y, k] of spots) {
        if (t === 'forêt' || (t === 'plaine' && k < 0.35)) {
          const s = 0.8 + k * 0.5;
          over += `<g transform="translate(${F(x)} ${F(y)}) scale(${F(s)})"><rect x="-.7" y="2" width="1.4" height="3" fill="#5a4024"/><circle r="4.2" cy="-.5" fill="#55703f"/><circle r="3.1" cx="-1.2" cy="-1.5" fill="#6f8c4f"/><circle r="1.4" cx="-1.8" cy="-2.4" fill="#93ad68"/></g>`;
        } else if (t === 'collines') {
          const w = 9 + k * 7;
          over += `<g transform="translate(${F(x)} ${F(y)})"><path d="M${-w} 4 Q${-w * 0.3} ${-w * 0.9} 0 ${-w * 0.75} Q${w * 0.4} ${-w * 0.7} ${w} 4 Z" fill="#cdb98a"/><path d="M0 ${-w * 0.75} Q${w * 0.4} ${-w * 0.7} ${w} 4 L${w * 0.15} 4 Q${w * 0.2} ${-w * 0.2} 0 ${-w * 0.75} Z" fill="#9c8358" opacity=".8"/><path d="M${-w} 4 Q${-w * 0.3} ${-w * 0.9} 0 ${-w * 0.75} Q${w * 0.4} ${-w * 0.7} ${w} 4" fill="none" stroke="#6b5230" stroke-width=".9"/></g>`;
        } else if (t === 'marais') {
          over += `<g transform="translate(${F(x)} ${F(y)})"><ellipse rx="6" ry="2.2" fill="#8fb0a6" opacity=".7"/><path d="M-3 0 v-5 M-1 0 v-6.5 M1.5 0 v-4.5 M3.5 0 v-5.5" stroke="#5d7a50" stroke-width=".8"/></g>`;
        } else {
          // champs labourés
          const w = 10 + k * 6, h = 6 + k * 3, rot = (k - 0.5) * 50;
          over += `<g transform="translate(${F(x)} ${F(y)}) rotate(${F(rot)})"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="${k < 0.5 ? '#d8c27c' : '#a9b56e'}" opacity=".75"/><path d="M${-w / 2} ${-h / 6} h${w} M${-w / 2} ${h / 6} h${w}" stroke="#8a7440" stroke-width=".5" opacity=".7"/></g>`;
        }
      }
    });
    return (cache[key] = { under, over, rivers });
  }
  // châteaux et villages
  function castle(x, y, color, big) {
    const s = big ? 1.25 : 0.9;
    return `<g transform="translate(${F(x)} ${F(y)}) scale(${s})" pointer-events="none">
      <ellipse cx="0" cy="9" rx="15" ry="3.5" fill="#000" opacity=".18"/>
      ${big ? `<rect x="-13" y="-4" width="26" height="13" fill="#e9dcc0" stroke="#3b2a18" stroke-width=".9"/><path d="M-13 -4 h3 v-2 h3 v2 h3 v-2 h3 v2 h3 v-2 h3 v2 h3 v-2 h2 v2" fill="#e9dcc0" stroke="#3b2a18" stroke-width=".9"/>` : ''}
      <rect x="-6" y="-14" width="12" height="23" fill="#f1e6cc" stroke="#3b2a18" stroke-width=".9"/>
      <path d="M-7 -14 L0 -22 L7 -14 Z" fill="#8c3a2c" stroke="#3b2a18" stroke-width=".8"/>
      ${big ? `<rect x="-16" y="-9" width="6" height="18" fill="#f1e6cc" stroke="#3b2a18" stroke-width=".9"/><path d="M-17 -9 L-13 -15 L-9 -9 Z" fill="#8c3a2c" stroke="#3b2a18" stroke-width=".8"/><rect x="10" y="-9" width="6" height="18" fill="#f1e6cc" stroke="#3b2a18" stroke-width=".9"/><path d="M9 -9 L13 -15 L17 -9 Z" fill="#8c3a2c" stroke="#3b2a18" stroke-width=".8"/>` : ''}
      <path d="M-2 9 v-5 q2 -3 4 0 v5" fill="#3b2a18"/><rect x="-1.2" y="-9" width="2.4" height="3.5" fill="#3b2a18"/>
      <path d="M0 -22 v-9" stroke="#3b2a18" stroke-width=".9"/><path class="flag" d="M0 -31 q4 1.5 8 0 q-2 2.4 0 4.8 q-4 1.5 -8 0 Z" fill="${color}" stroke="#3b2a18" stroke-width=".5"/>
    </g>`;
  }
  function tower(x, y, color) {
    return `<g transform="translate(${F(x)} ${F(y)})" pointer-events="none"><ellipse cy="7" rx="8" ry="2.4" fill="#000" opacity=".16"/><rect x="-4.5" y="-8" width="9" height="15" fill="#f1e6cc" stroke="#3b2a18" stroke-width=".8"/><path d="M-5.5 -8 h2 v-2 h2 v2 h3 v-2 h2 v2 h2" fill="#f1e6cc" stroke="#3b2a18" stroke-width=".8"/><path d="M-1.5 7 v-3 q1.5 -2 3 0 v3" fill="#3b2a18"/><path d="M0 -10 v-7" stroke="#3b2a18" stroke-width=".8"/><path class="flag" d="M0 -17 q3 1 6 0 q-1.5 1.8 0 3.6 q-3 1 -6 0 Z" fill="${color}" stroke="#3b2a18" stroke-width=".4"/></g>`;
  }
  function hamlet(x, y, n) {
    let s = ''; for (let k = 0; k < n; k++) { const dx = (k - (n - 1) / 2) * 6, dy = (k % 2) * 3; s += `<g transform="translate(${F(x + dx)} ${F(y + dy)})"><rect x="-2.4" y="-2" width="4.8" height="4" fill="#efe2c6" stroke="#5a4024" stroke-width=".5"/><path d="M-3.2 -2 L0 -5 L3.2 -2 Z" fill="#a8743c" stroke="#5a4024" stroke-width=".5"/></g>`; }
    return `<g pointer-events="none">${s}</g>`;
  }
  // édifices dessinés à la main (un par chantier, à côté du château)
  const INK = '#3b2a18', WALL = '#f1e6cc', ROOF = '#8c3a2c';
  function edifice(k, x, y) {
    const o = `<g transform="translate(${F(x)} ${F(y)}) scale(1.15)" pointer-events="none"><ellipse cy="5.5" rx="8" ry="2" fill="#000" opacity=".15"/>`;
    switch (k) {
      case 'moulin': return o + `<path d="M-3.5 5 L-2.4 -6 L2.4 -6 L3.5 5 Z" fill="${WALL}" stroke="${INK}" stroke-width=".6"/><path d="M-2.8 -6 L0 -9 L2.8 -6 Z" fill="${ROOF}" stroke="${INK}" stroke-width=".5"/><path d="M-.8 5 v-2.4 q.8 -1.2 1.6 0 v2.4" fill="${INK}"/>
        <g class="mill" style="transform-origin:0px -6px"><path d="M0 -6 L-7 -12 M0 -6 L6 -13 M0 -6 L7 0 M0 -6 L-6 1" stroke="${INK}" stroke-width=".7"/><path d="M-7 -12 l1.6 -1.4 l3.4 4 l-1.6 1.4 Z M6 -13 l1.4 1.6 l-4 3.4 l-1.4 -1.6 Z M7 0 l-1.6 1.4 l-3.4 -4 l1.6 -1.4 Z M-6 1 l-1.4 -1.6 l4 -3.4 l1.4 1.6 Z" fill="#efe6cf" stroke="${INK}" stroke-width=".4"/></g><circle cy="-6" r=".9" fill="${INK}"/></g>`;
      case 'marche': return o + `<rect x="-8" y="-1" width="16" height="6" fill="#d9c08a" stroke="${INK}" stroke-width=".5"/><path d="M-9.5 -1 L-6 -6 L6 -6 L9.5 -1 Z" fill="#9c5a2e" stroke="${INK}" stroke-width=".6"/><path d="M-6 5 v-6 M-2 5 v-6 M2 5 v-6 M6 5 v-6" stroke="${INK}" stroke-width=".6"/><path d="M-8 -1 h16 l-1 2 h-2.3 l-1-2 l-1 2 h-2.4 l-1 -2 l-1 2 h-2.4 l-1 -2 l-1 2 h-2.3 Z" fill="#c43d2a" opacity=".85"/><circle cx="-4" cy="3.6" r="1.2" fill="#b98a2e"/><rect x="2.5" y="2.3" width="2.4" height="2.4" fill="#7a5a30"/></g>`;
      case 'abbaye': return o + `<rect x="-7" y="-3" width="10" height="8" fill="${WALL}" stroke="${INK}" stroke-width=".6"/><path d="M-8 -3 L-2 -7 L4 -3 Z" fill="#6f6a7e" stroke="${INK}" stroke-width=".5"/><rect x="3" y="-9" width="4.5" height="14" fill="${WALL}" stroke="${INK}" stroke-width=".6"/><path d="M2.4 -9 L5.25 -13.5 L8.1 -9 Z" fill="#6f6a7e" stroke="${INK}" stroke-width=".5"/><path d="M5.25 -13.5 v-3 M4 -15.3 h2.5" stroke="${INK}" stroke-width=".6"/><path d="M-5 5 v-3 q1 -1.6 2 0 v3 M4.5 -5 q.75 -1 1.5 0 v1.5 h-1.5 Z" fill="${INK}"/><circle cx="-2" cy="-.6" r="1.1" fill="#2c4f8a" stroke="${INK}" stroke-width=".3"/></g>`;
      case 'donjon': return o + `<rect x="-4.5" y="-10" width="9" height="15" fill="#d9ccb0" stroke="${INK}" stroke-width=".7"/><path d="M-5.5 -10 v-2.5 h2 v1.4 h2 v-1.4 h2 v1.4 h2 v-1.4 h2 v2.5 Z" fill="#d9ccb0" stroke="${INK}" stroke-width=".6"/><path d="M-4.5 -4 h9 M-4.5 1 h9 M-1.5 -10 v6 M1.8 -4 v5" stroke="#9c8a68" stroke-width=".35"/><rect x="-.8" y="-8.2" width="1.6" height="2.6" fill="${INK}"/><path d="M-1.5 5 v-2.8 q1.5 -2 3 0 v2.8" fill="${INK}"/></g>`;
      case 'lices': return o + `<path d="M-9 4 h18 M-9 1.5 h18" stroke="#7a5a30" stroke-width=".8"/><path d="M-9 5 v-5 M-4.5 5 v-5 M0 5 v-5 M4.5 5 v-5 M9 5 v-5" stroke="#5a4024" stroke-width=".7"/><path d="M-6 0 v-10 M6 0 v-10" stroke="${INK}" stroke-width=".6"/><path d="M-6 -10 l4 1.4 l-4 1.4 Z" fill="#c43d2a"/><path d="M6 -10 l-4 1.4 l4 1.4 Z" fill="#2c4f8a"/><path d="M-2 -1 l4 -3" stroke="#6b5230" stroke-width=".7"/></g>`;
      case 'universite': return o + `<rect x="-8" y="-4" width="16" height="9" fill="${WALL}" stroke="${INK}" stroke-width=".6"/><path d="M-9 -4 L0 -8.5 L9 -4 Z" fill="#3c5a7a" stroke="${INK}" stroke-width=".5"/><path d="M-5.5 1 v-3 q.9 -1.4 1.8 0 v3 Z M-1 1 v-3 q.9 -1.4 1.8 0 v3 Z M3.5 1 v-3 q.9 -1.4 1.8 0 v3 Z" fill="#2c3f5e"/><path d="M-8 5 h16" stroke="${INK}" stroke-width=".6"/><path d="M0 -8.5 v-2.6" stroke="${INK}" stroke-width=".5"/><path d="M0 -11 l2.4 .8 l-2.4 .8 Z" fill="#b98a2e"/></g>`;
      case 'hopital': return o + `<rect x="-8" y="-3" width="16" height="8" fill="${WALL}" stroke="${INK}" stroke-width=".6"/><path d="M-9 -3 L-5 -7.5 L5 -7.5 L9 -3 Z" fill="#7a6a58" stroke="${INK}" stroke-width=".5"/><rect x="-1.8" y="-1.6" width="3.6" height="3.6" fill="#fff" stroke="${INK}" stroke-width=".3"/><path d="M0 -1.1 v2.6 M-1.3 .2 h2.6" stroke="#c4302a" stroke-width=".9"/><path d="M-6 5 v-2.5 q.8 -1.2 1.6 0 v2.5 M4.4 5 v-2.5 q.8 -1.2 1.6 0 v2.5" fill="${INK}"/></g>`;
    }
    return '';
  }
  function cathedral(x, y, done) {
    return `<g transform="translate(${F(x)} ${F(y)})" pointer-events="none"><ellipse cy="6" rx="14" ry="2.6" fill="#000" opacity=".16"/>
      <rect x="-10" y="-6" width="20" height="12" fill="#efe4c8" stroke="${INK}" stroke-width=".7"/><path d="M-11 -6 L0 -12 L11 -6 Z" fill="#5d6577" stroke="${INK}" stroke-width=".6"/>
      ${done ? `<rect x="-10" y="-20" width="5" height="26" fill="#efe4c8" stroke="${INK}" stroke-width=".7"/><rect x="5" y="-20" width="5" height="26" fill="#efe4c8" stroke="${INK}" stroke-width=".7"/><path d="M-10.6 -20 L-7.5 -29 L-4.4 -20 Z M4.4 -20 L7.5 -29 L10.6 -20 Z" fill="#5d6577" stroke="${INK}" stroke-width=".6"/><path d="M-7.5 -29 v-3 M7.5 -29 v-3" stroke="${INK}" stroke-width=".6"/>`
        : `<rect x="-10" y="-14" width="5" height="20" fill="#efe4c8" stroke="${INK}" stroke-width=".7"/><path d="M-12 -18 v22 M-3 -18 v22 M-12 -16 h9 M-12 -10 h9 M-12 -4 h9 M-12 -16 l9 6 M-3 -10 l-9 6" stroke="#8a6a40" stroke-width=".5"/><path d="M6 -6 v-14 l5 2" stroke="${INK}" stroke-width=".6" fill="none"/><path d="M11 -18 v5" stroke="${INK}" stroke-width=".4"/>`}
      <circle cy="-1" r="2.6" fill="#2c4f8a" stroke="${INK}" stroke-width=".4"/><path d="M0 -3.6 v5.2 M-2.6 -1 h5.2" stroke="#e8c15a" stroke-width=".4"/><path d="M-2 6 v-3.5 q2 -2.5 4 0 v3.5" fill="${INK}"/></g>`;
  }
  // mer, navire, rose des vents
  function sea(g) {
    let s = '';
    const r = rng(hs('sea' + g.W));
    for (let i = 0; i < 26; i++) { const x = r() * g.W, y = r() * g.H; if (inPoly(g.coast, x, y)) continue; s += `<path class="wave" style="animation-delay:${F(-r() * 9)}s" d="M${F(x)} ${F(y)} q4 -3 8 0 q4 3 8 0" fill="none" stroke="#e8f0e8" stroke-width=".9" opacity=".55"/>`; }
    return s;
  }
  function ship(x, y, color) {
    return `<g class="ship" transform="translate(${x} ${y})" pointer-events="none"><path d="M-12 0 Q0 7 12 0 L9 -1 L-9 -1 Z" fill="#6b4a2a" stroke="#3b2a18" stroke-width=".7"/><path d="M0 -1 V-20" stroke="#3b2a18" stroke-width=".9"/><path d="M-7 -18 Q0 -21 7 -18 L7 -5 Q0 -7 -7 -5 Z" fill="#efe6cf" stroke="#3b2a18" stroke-width=".6"/><path d="M-2 -15 h4 v4 h-4 Z M-.6 -16.5 v7 M-2.8 -12.5 h5.6" stroke="${color}" stroke-width="1.2"/><path d="M0 -20 l5 1.5 l-5 1.5" fill="${color}"/></g>`;
  }
  function serpent(x, y) {
    return `<g transform="translate(${x} ${y})" pointer-events="none" opacity=".85"><path d="M-18 2 q4 -10 8 0 q4 10 8 0 q4 -10 8 0" fill="none" stroke="#3f6b5c" stroke-width="3.2" stroke-linecap="round"/><path d="M6 2 q5 -9 11 -6 q3 2 0 4 q-3 1 -6 0" fill="#3f6b5c"/><circle cx="13" cy="-3.6" r=".8" fill="#f3e6c6"/><path d="M-18 2 l-4 -2 l2 4 Z" fill="#3f6b5c"/></g>`;
  }
  function compass(x, y) {
    return `<g transform="translate(${x} ${y})" pointer-events="none"><circle r="17" fill="#efe3c4" opacity=".85" stroke="#6b5230" stroke-width=".8"/><circle r="13" fill="none" stroke="#6b5230" stroke-width=".5"/>
      <path d="M0 -22 L3.5 0 L0 22 L-3.5 0 Z" fill="#8c3a2c"/><path d="M0 -22 L3.5 0 L0 0 Z" fill="#5a1d14"/><path d="M-22 0 L0 3.5 L22 0 L0 -3.5 Z" fill="#1c2f5e"/><path d="M-22 0 L0 -3.5 L0 0 Z" fill="#0e1a38"/>
      <path d="M-11 -11 L2 -2 L11 11 L-2 2 Z" fill="#b98a2e" opacity=".8"/><path d="M11 -11 L2 2 L-11 11 L-2 -2 Z" fill="#b98a2e" opacity=".8"/><circle r="2.2" fill="#f0cf72" stroke="#6b5230" stroke-width=".5"/>
      <text y="-25" text-anchor="middle" font-family="UnifrakturMaguntia" font-size="10" fill="#5a1d14">N</text></g>`;
  }
  return { wpath, decor, castle, tower, hamlet, edifice, cathedral, sea, ship, serpent, compass, inPoly, rng, hs };
})();

// ---------- Scènes peintes (en-têtes d'événements, écran-titre) ----------
const SCENE = (() => {
  const rng = s => { let a = s >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const SKY = {
    dawn: ['#f3c48a', '#e9a170', '#9a6b7e', '#4b4f7a'],
    day: ['#cfe2e6', '#a9c9d4', '#7fa7bd', '#5d86a3'],
    dusk: ['#f6b26b', '#d9735a', '#7d4a6d', '#2e2f5a'],
    night: ['#2b3a6b', '#1c2750', '#141c3c', '#0b1029'],
    grey: ['#cfcbc0', '#aaa79e', '#86857f', '#5f625f'],
    gold: ['#f8dc94', '#e8b25c', '#b87a3c', '#6a3f2a'],
    inside: ['#3a2416', '#2a1a10', '#1e130b', '#140c07'],
  };
  let uid = 0;
  function ridge(r, W, H, base, amp, freq) {
    const ph = r() * 9, ph2 = r() * 9; let d = `M0 ${H}`;
    for (let x = 0; x <= W; x += 6) { const y = base + Math.sin(x * freq + ph) * amp + Math.sin(x * freq * 2.7 + ph2) * amp * 0.35; d += ` L${x} ${y.toFixed(1)}`; }
    return d + ` L${W} ${H} Z`;
  }
  function castleSil(x, y, s, col, lit, flag) {
    let w = '';
    if (lit) [[-14, -16], [6, -20], [-2, -34], [16, -12]].forEach(([dx, dy]) => w += `<rect x="${dx}" y="${dy}" width="2.4" height="3.6" fill="#ffd27a"/>`);
    return `<g transform="translate(${x} ${y}) scale(${s})" fill="${col}">
      <path d="M-34 0 V-18 h4 v-4 h4 v4 h4 v-4 h4 v4 h4 V-26 h4 v-4 h4 v4 h4 v-4 h4 v4 h2 V-18 h4 v-4 h4 v4 h4 v-4 h4 v4 h4 V0 Z"/>
      <path d="M-8 -26 V-46 h-3 v-5 h4 v3 h3 v-3 h4 v3 h3 v-3 h4 v5 h-3 V-26 Z"/><path d="M-2 -51 L2 -62 L6 -51 Z"/>
      <rect x="-38" y="-30" width="9" height="30"/><path d="M-40 -30 L-33.5 -40 L-27 -30 Z"/><rect x="26" y="-28" width="9" height="28"/><path d="M24 -28 L30.5 -38 L37 -28 Z"/>
      <path d="M2 -62 v-10" stroke="${col}" stroke-width="1.2"/><path class="flag" d="M2 -72 q6 2 12 0 q-3 3 0 6 q-6 2 -12 0 Z" fill="${flag || '#a8321f'}"/>${w}</g>`;
  }
  function cathedral(x, y, s, col, lit) {
    return `<g transform="translate(${x} ${y}) scale(${s})" fill="${col}">
      <path d="M-40 0 V-30 L-30 -40 L-20 -30 V0 Z M20 0 V-30 L30 -40 L40 -30 V0 Z"/>
      <path d="M-30 -40 V-70 L-26 -88 L-22 -70 V-40 Z M22 -40 V-70 L26 -88 L30 -70 V-40 Z"/>
      <path d="M-20 0 V-44 L0 -60 L20 -44 V0 Z"/><path d="M-3 -60 V-78 L0 -96 L3 -78 V-60 Z"/>
      ${lit ? `<circle cx="0" cy="-36" r="7" fill="#ffcf6e" opacity=".95"/><circle cx="0" cy="-36" r="7" fill="none" stroke="${col}" stroke-width="1.4"/><path d="M0 -43 V-29 M-7 -36 H7 M-5 -41 L5 -31 M5 -41 L-5 -31" stroke="${col}" stroke-width=".9"/><path d="M-6 0 V-14 Q0 -22 6 -14 V0 Z" fill="#ffcf6e" opacity=".8"/>` : ''}</g>`;
  }
  function house(x, y, s, col, roof) { return `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-8" y="-9" width="16" height="9" fill="${col}"/><path d="M-10 -9 L0 -17 L10 -9 Z" fill="${roof}"/><rect x="-2" y="-6" width="3" height="3" fill="#ffd27a" opacity=".8"/></g>`; }
  function tree(x, y, s, col) { return `<g transform="translate(${x} ${y}) scale(${s})" fill="${col}"><rect x="-1" y="-4" width="2" height="5"/><circle cy="-9" r="6"/><circle cx="-4" cy="-6" r="4"/><circle cx="4" cy="-6" r="4"/></g>`; }
  function tent(x, y, s, col, stripe) { return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-14 0 L0 -18 L14 0 Z" fill="${col}"/><path d="M-5 0 L0 -18 L5 0 Z" fill="${stripe}"/><path d="M0 -18 v-6" stroke="#2b1e12"/><path d="M0 -24 l6 2 l-6 2" fill="${stripe}"/></g>`; }
  function banner(x, y, s, col, col2) { return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0 V-40" stroke="#2b1e12" stroke-width="1.6"/><path class="flag" d="M0 -40 h12 v14 l-6 -4 l-6 4 Z" fill="${col}"/><path d="M3 -36 h6 M6 -39 v8" stroke="${col2}" stroke-width="1.6"/></g>`; }
  function shipSil(x, y, s, col, sail, cross) { return `<g class="shipb" transform="translate(${x} ${y}) scale(${s})"><path d="M-26 0 Q0 12 26 0 L20 -3 L-20 -3 Z" fill="${col}"/><path d="M0 -3 V-46" stroke="${col}" stroke-width="2"/><path d="M-15 -42 Q0 -47 15 -42 L15 -12 Q0 -16 -15 -12 Z" fill="${sail}"/><path d="M-4 -34 h8 v8 h-8 Z M-1 -36 v12 M-5 -30 h10" stroke="${cross}" stroke-width="2.2"/></g>`; }
  function crow(x, y, s) { return `<path transform="translate(${x} ${y}) scale(${s})" d="M-8 0 Q-4 -4 0 0 Q4 -4 8 0 Q4 -2 0 1 Q-4 -2 -8 0 Z" fill="#2a2a2a"/>`; }
  function arch(x, w, H, col) { return `<path d="M${x} ${H} V60 Q${x} 18 ${x + w / 2} 12 Q${x + w} 18 ${x + w} 60 V${H} Z" fill="${col}"/>`; }
  function candle(x, y) { return `<g transform="translate(${x} ${y})"><rect x="-1.6" y="0" width="3.2" height="14" fill="#efe0c0"/><path class="fl" d="M0 -8 Q3 -3 0 0 Q-3 -3 0 -8 Z" fill="#ffcf6e"/><circle cy="-3" r="10" fill="#ffcf6e" opacity=".12"/></g>`; }

  // kind : chateau, eglise, village, bataille, cour, mer, nuit, peste ; opts : {flag, foe, seed, title}
  function svg(kind, opts) {
    opts = opts || {};
    const W = 360, H = opts.h || 150, id = 'sc' + (++uid), r = rng(opts.seed || kind.length * 97 + 13);
    const skyKey = { chateau: 'dusk', eglise: 'dawn', village: 'day', bataille: 'gold', cour: 'inside', mer: 'day', nuit: 'night', peste: 'grey' }[kind] || 'dusk';
    const sk = SKY[skyKey];
    let s = `<defs><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sk[3]}"/><stop offset=".55" stop-color="${sk[2]}"/><stop offset=".85" stop-color="${sk[1]}"/><stop offset="1" stop-color="${sk[0]}"/></linearGradient>
      <radialGradient id="${id}g" cx=".72" cy=".62" r=".5"><stop offset="0" stop-color="#fff2c4" stop-opacity=".85"/><stop offset="1" stop-color="#fff2c4" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient></defs>`;
    s += `<rect width="${W}" height="${H}" fill="url(#${id}s)"/>`;
    if (kind === 'cour') {
      s += `<rect width="${W}" height="${H}" fill="#2a1a10"/>`;
      s += `<rect x="0" y="${H - 34}" width="${W}" height="34" fill="#3b2617"/>`;
      for (let x = -20; x < W; x += 30) s += `<path d="M${x} ${H - 34} L${x + 30} ${H}" stroke="#4a3220" stroke-width="1"/>`;
      [[10, 70], [100, 70], [190, 70], [280, 70]].forEach(([x, w]) => s += arch(x, w, H - 34, '#4a2e1c'));
      [[22, 46], [112, 46], [202, 46], [292, 46]].forEach(([x, w]) => s += `<path d="M${x} ${H - 34} V66 Q${x} 34 ${x + w / 2} 30 Q${x + w} 34 ${x + w} 66 V${H - 34} Z" fill="#1a2c55"/><path d="M${x + w / 2} 30 V${H - 34} M${x} 70 H${x + w}" stroke="#4a2e1c" stroke-width="2"/>`);
      s += `<path d="M150 ${H - 34} v-60 q30 -16 60 0 v60 Z" fill="#6b1e14"/><path d="M160 ${H - 34} v-40 h40 v40 Z" fill="#8c2a1c"/><path d="M168 ${H - 74} l12 -10 l12 10" fill="#d6a62e"/>`;
      s += `<path d="M170 ${H - 96} h20 v-60 h-20 Z" fill="${opts.flag || '#1d4b97'}" opacity=".9"/><path d="M175 ${H - 140} h10 M180 ${H - 145} v12" stroke="#d6a62e" stroke-width="2"/>`;
      [60, 132, 228, 300].forEach(x => s += candle(x, H - 52));
      s += `<rect width="${W}" height="${H}" fill="url(#${id}f)"/>`;
    } else {
      // soleil / lune / étoiles
      if (kind === 'nuit') {
        for (let i = 0; i < 50; i++) s += `<circle cx="${(r() * W).toFixed(1)}" cy="${(r() * H * 0.6).toFixed(1)}" r="${(r() * 0.9 + 0.3).toFixed(2)}" fill="#fff" opacity="${(0.4 + r() * 0.6).toFixed(2)}"/>`;
        s += `<circle cx="285" cy="34" r="15" fill="#f6ecc8"/><circle cx="291" cy="30" r="13" fill="${sk[3]}"/>`;
        s += `<path d="M60 26 L120 52" stroke="#fff6d8" stroke-width="2.2" opacity=".75" stroke-linecap="round"/><path d="M60 26 L130 40" stroke="#fff6d8" stroke-width="1" opacity=".4"/><circle cx="60" cy="26" r="3" fill="#fffbe8"/>`;
      } else if (kind !== 'peste') s += `<rect width="${W}" height="${H}" fill="url(#${id}g)"/><circle cx="${W * 0.72}" cy="${H * 0.6}" r="${kind === 'bataille' ? 30 : 18}" fill="#fff2c4" opacity=".75"/>`;
      if (kind === 'peste') for (let i = 0; i < 7; i++) s += `<ellipse cx="${(r() * W).toFixed(0)}" cy="${(10 + r() * 50).toFixed(0)}" rx="${(40 + r() * 50).toFixed(0)}" ry="${(6 + r() * 6).toFixed(0)}" fill="#e9e6de" opacity=".35"/>`;
      // reliefs lointains
      const far = kind === 'nuit' ? ['#2a3866', '#1f2a52', '#141c3c'] : kind === 'peste' ? ['#9a978d', '#7e7b72', '#5c5a54'] : kind === 'bataille' ? ['#c99a5a', '#9a6f3c', '#6b4a2a'] : kind === 'mer' ? ['#8fb2c4', '#6f93a8', '#4f7186'] : ['#a99bb0', '#7e7590', '#56506b'];
      s += `<path d="${ridge(r, W, H, H * 0.55, 10, 0.03)}" fill="${far[0]}"/>`;
      if (kind === 'mer') {
        s += `<rect y="${H * 0.62}" width="${W}" height="${H * 0.38}" fill="#3f6a80"/>`;
        for (let i = 0; i < 18; i++) { const x = r() * W, y = H * 0.66 + r() * H * 0.3; s += `<path class="wave" d="M${x.toFixed(0)} ${y.toFixed(0)} q5 -3 10 0 q5 3 10 0" stroke="#cfe3ea" stroke-width="1" fill="none" opacity=".6"/>`; }
        s += shipSil(150, H * 0.8, 1.15, '#2b1e12', '#efe6cf', opts.flag || '#a8321f') + shipSil(286, H * 0.7, 0.55, '#2b3a48', '#c8c4b4', '#7a1e12');
        s += `<path d="M60 40 q5 -4 10 0 q5 -4 10 0" stroke="#2b1e12" fill="none" stroke-width="1.2"/><path d="M95 30 q4 -3 8 0 q4 -3 8 0" stroke="#2b1e12" fill="none" stroke-width="1"/>`;
      } else {
        s += `<path d="${ridge(r, W, H, H * 0.68, 8, 0.045)}" fill="${far[1]}"/>`;
        if (kind === 'chateau') s += opts.big ? castleSil(196, H * 0.74, 2.3, far[2], true, opts.flag) : castleSil(118, H * 0.72, 1.15, far[2], true, opts.flag);
        if (kind === 'eglise') s += cathedral(180, H * 0.86, 1.05, '#3b3048', true);
        if (kind === 'nuit') s += castleSil(70, H * 0.8, 0.8, '#0e1430', true, '#7a1e12') + `<path d="M250 ${H} V${H * 0.42} h14 V${H} Z" fill="#0b1029"/><path d="M246 ${H * 0.42} L257 ${H * 0.3} L268 ${H * 0.42} Z" fill="#0b1029"/><rect x="254" y="${H * 0.5}" width="4" height="6" fill="#ffd27a"/>`;
        s += `<path d="${ridge(r, W, H, H * 0.82, 6, 0.06)}" fill="${far[2]}"/>`;
        if (kind === 'village' || kind === 'peste') {
          const grey = kind === 'peste';
          for (let i = 0; i < 5; i++) s += `<path d="M${i * 80 - 20} ${H} L${i * 80 + 40} ${H * 0.84} L${i * 80 + 90} ${H * 0.86} L${i * 80 + 40} ${H} Z" fill="${grey ? '#8d8a7c' : i % 2 ? '#d8b860' : '#9db063'}" opacity=".85"/>`;
          [[70, .95], [104, 1.1], [136, .9], [250, 1], [282, .8]].forEach(([x, sc]) => s += house(x, H * 0.86, sc, grey ? '#b7b2a4' : '#efe2c6', grey ? '#6d665c' : '#a8743c'));
          s += cathedral(196, H * 0.86, 0.42, grey ? '#5c5a54' : '#6b5a4a', false);
          [30, 170, 330].forEach(x => s += tree(x, H * 0.88, 1.1, grey ? '#4f5248' : '#4f6a3a'));
          if (!grey) s += `<path d="M104 ${H * 0.72} q4 -8 0 -16 q-4 -8 2 -16" stroke="#e8e4da" stroke-width="3" fill="none" opacity=".5"/>`;
          if (grey) for (let i = 0; i < 6; i++) s += crow(40 + r() * 280, 20 + r() * 40, 0.8 + r() * 0.5);
        }
        if (kind === 'bataille') {
          s += tent(40, H * 0.86, 1, '#e8dcc0', opts.flag || '#1d4b97') + tent(84, H * 0.88, 0.8, '#e8dcc0', opts.flag || '#1d4b97');
          s += tent(286, H * 0.86, 1, '#e8dcc0', opts.foe || '#7a1e12') + tent(326, H * 0.89, 0.8, '#e8dcc0', opts.foe || '#7a1e12');
          for (let i = 0; i < 9; i++) s += `<path d="M${120 + i * 14} ${H} L${126 + i * 14 + (r() - 0.5) * 10} ${H * 0.5}" stroke="#2b1e12" stroke-width="1.2"/>`;
          s += banner(132, H * 0.92, 1, opts.flag || '#1d4b97', '#f2ede2') + banner(232, H * 0.92, 1, opts.foe || '#7a1e12', '#f2ede2');
          s += `<ellipse cx="180" cy="${H * 0.9}" rx="70" ry="10" fill="#e8c88a" opacity=".45" style="filter:blur(2px)"/>`;
        }
        if (kind === 'chateau') { [24, 46, 300, 330].forEach(x => s += tree(x, H * 0.92, 1.2, '#2e3a2a')); }
        if (kind === 'eglise') { [40, 70, 300].forEach(x => s += tree(x, H * 0.95, 1.1, '#2e2a3a')); }
      }
      s += `<rect width="${W}" height="${H}" fill="url(#${id}f)"/>`;
    }
    return `<svg viewBox="0 0 ${W} ${H}" class="scene" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${s}</svg>`;
  }
  const OF = { peste: 'peste', peste_noire: 'peste', famine: 'peste', recolte: 'village', revolte: 'village', jacquerie: 'village', brigands: 'village', mine: 'village', marchand: 'mer', foires: 'mer', croisade: 'mer', condottiere: 'bataille', bouvines: 'bataille', albigeois: 'bataille', centans: 'bataille', tournoi: 'bataille', duel: 'bataille', insulte: 'bataille', heritier_ost: 'bataille', eveque: 'eglise', heresie: 'eglise', relique: 'eglise', cathedrale: 'eglise', templiers: 'eglise', universite: 'eglise', complot: 'nuit', complot_familial: 'nuit', astrologue: 'nuit', comete: 'nuit', maladie: 'nuit' };
  const of = id => OF[id] || 'cour';
  return { svg, of };
})();

// ---------- Plateau ----------
let selRegion = null, targetMode = false, holdOwner = {}, pendingNews = null;
const P2 = p => p[0].toFixed(1) + ' ' + p[1].toFixed(1);
const pathPoly = poly => 'M' + poly.map(P2).join(' L') + ' Z';
function ownerArms(o) { return o === 'me' ? S.house : o === 'rival' ? S.rival : o; }
function nestedShield(house, x, y, w) { return A.shieldSVG(house, w).replace('<svg ', `<svg x="${x - w / 2}" y="${y - w * 0.6}" `); }
function boardSVG() {
  const g = D.mapGeom(S.seed), me = A.arms(S.house);
  const targets = new Set(D.borderTargets(S).map(r => r.i));
  const camOK = (D.getActions(S).find(a => a.id === 'campagne') || {}).ok;
  const dec = MAP2.decor(S.seed, S.regions);
  const coastD = MAP2.wpath(g.coast);
  const own = i => holdOwner[i] != null ? holdOwner[i] : S.regions[i].owner;
  let s = `<defs>
   <radialGradient id="seaG" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#9fb8b0"/><stop offset="1" stop-color="#5f7f86"/></radialGradient>
   <radialGradient id="landG" cx=".45" cy=".4" r=".75"><stop offset="0" stop-color="#f1e4c0"/><stop offset=".8" stop-color="#e2cf9f"/><stop offset="1" stop-color="#cdb582"/></radialGradient>
   <pattern id="rh" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><rect width="6" height="6" fill="#7a1e12" fill-opacity=".14"/><path d="M0 0 V6" stroke="#7a1e12" stroke-width="1.6" opacity=".5"/></pattern>
   <filter id="paper" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3" result="n"/><feColorMatrix in="n" values="0 0 0 0 .35 0 0 0 0 .25 0 0 0 0 .1 0 0 0 .18 0"/><feComposite in2="SourceGraphic" operator="in"/><feBlend in="SourceGraphic" mode="multiply"/></filter>
   <filter id="soft"><feGaussianBlur stdDeviation="2.2"/></filter>
   <clipPath id="landClip"><path d="${coastD}"/></clipPath>
   <radialGradient id="vig" cx=".5" cy=".5" r=".72"><stop offset=".62" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#1f150a" stop-opacity=".42"/></radialGradient></defs>`;
  s += `<rect x="-900" y="-900" width="${g.W + 1800}" height="${g.H + 1800}" fill="#86a5a5"/>` + MAP2.sea(g);
  // côtes hachurées (lignes concentriques)
  [14, 9, 5].forEach((w, k) => { s += `<path d="${coastD}" fill="none" stroke="#e9f1ea" stroke-width="${w}" opacity="${0.12 + k * 0.1}" stroke-linejoin="round"/>`; });
  s += `<path d="${coastD}" fill="url(#landG)"/>`;
  // terres : couleurs des propriétaires
  s += `<g clip-path="url(#landClip)">`;
  g.cells.forEach((c, i) => {
    const o = own(i), d = MAP2.wpath(c.poly);
    const fill = o === 'me' ? me.robe : o === 'rival' ? 'url(#rh)' : A.arms(o).robe;
    const op = o === 'me' ? 0.42 : o === 'rival' ? 1 : 0.1;
    const R = S.regions[i];
    const isT = targetMode && targets.has(i) && (targetMode !== 'vassal' || o !== 'rival');
    const cls = ['rg', o === 'me' ? 'own' : o === 'rival' ? 'riv' : 'neu', selRegion === i ? 'sel' : '', isT ? (targetMode === 'vassal' ? 'tgt vas' : 'tgt') : '', R.flip === S.year && holdOwner[i] == null ? 'flipped' : '', R.won && S.year - R.won <= 3 && holdOwner[i] == null ? 'fresh' : '', R.lost && S.year - R.lost <= 3 && holdOwner[i] == null ? 'lostr' : ''].join(' ');
    s += `<path class="${cls}" data-i="${i}" d="${d}" fill="${fill}" fill-opacity="${op}" stroke="none" onclick="tapRegion(${i})"/>`;
  });
  s += `</g><g filter="url(#paper)" pointer-events="none"><path d="${coastD}" fill="#fff" fill-opacity=".01"/></g>`;
  s += `<g pointer-events="none">${dec.under}</g>`;
  // frontières : fines entre seigneurs, épaisses autour du royaume
  g.cells.forEach((c, i) => { s += `<path d="${MAP2.wpath(c.poly)}" fill="none" stroke="#6b5230" stroke-width=".9" stroke-dasharray="${own(i) === 'me' ? '' : '2.5 2'}" opacity=".75" pointer-events="none"/>`; });
  g.cells.forEach((c, i) => { if (own(i) === 'me') s += `<path d="${MAP2.wpath(c.poly)}" fill="none" stroke="${me.robe}" stroke-width="3" opacity=".55" pointer-events="none" clip-path="url(#landClip)"/>`; });
  // routes entre vos châteaux
  g.cells.forEach((c, i) => { if (own(i) !== 'me') return; for (const j of g.adj[i]) if (j > i && own(j) === 'me') { const a = c.c, b = g.cells[j].c, mx = (a[0] + b[0]) / 2 + (a[1] - b[1]) * 0.12, my = (a[1] + b[1]) / 2 + (b[0] - a[0]) * 0.12; s += `<path d="M${a[0]} ${a[1] + 6} Q${mx} ${my} ${b[0]} ${b[1] + 6}" fill="none" stroke="#8a6a3c" stroke-width="1.3" stroke-dasharray="3 2.2" opacity=".8" pointer-events="none"/>`; } });
  s += `<g pointer-events="none">${dec.over}</g>`;
  s += `<path d="${coastD}" fill="none" stroke="#4a3620" stroke-width="2.4" pointer-events="none"/>`;
  // châteaux, villages, blasons, noms
  g.cells.forEach((c, i) => {
    const R = S.regions[i], o = own(i), [x, y] = c.c;
    if (o === 'me') {
      s += R.cap ? MAP2.castle(x, y - 6, me.robe, true) : MAP2.castle(x, y - 4, me.robe, false);
      { const bl = (R.bl || []).slice(-3), spots = R.cap ? [[-21, 13], [-48, 13], [-62, -4]] : [[-20, 6], [20, 6], [-33, 2]];
        bl.forEach((k, j) => { s += MAP2.edifice(k, x + spots[j][0], y + spots[j][1]); });
        const rest = Math.min(3 - bl.length, (R.builds || 0) - (R.bl || []).length); if (rest > 0) s += MAP2.hamlet(x + spots[bl.length][0], y + spots[bl.length][1] - 2, rest); }
      if (R.cap && (S.cathedral || S.chantier)) s += MAP2.cathedral(x - 36, y - 8, !!S.cathedral);
    } else {
      s += MAP2.tower(x, y - 4, o === 'rival' ? '#7a1e12' : A.arms(o).robe);
      s += `<g pointer-events="none">${nestedShield(ownerArms(o), x + 13, y - 8, o === 'rival' ? 16 : 12)}</g>`;
    }
    if (R.wealth >= 4 && o !== 'me') s += MAP2.hamlet(x - 16, y + 6, 2);
    const nm = R.cap ? R.name : R.name.replace(/^(Comté|Baronnie|Vicomté|Seigneurie|Châtellenie|Marche) de /, '');
    const lx = Math.max(36, Math.min(g.W - 36, x));
    s += `<text x="${lx}" y="${y + 19}" class="rname ${o === 'me' ? 'm' : o === 'rival' ? 'r' : ''}" text-anchor="middle" pointer-events="none">${esc(nm)}</text>`;
    if (targetMode === 'vassal' && targets.has(i) && o !== 'rival') { const od = Math.round(D.vassalOdds(S, i) * 100), c = D.vassalCost(S, i); s += `<g pointer-events="none" transform="translate(${x} ${y - 34})" class="oddb"><rect x="-27" y="-9.5" width="54" height="18" rx="9" fill="${S.gold >= c ? '#8a5f17' : '#6b6255'}" stroke="#f3e6c6" stroke-width="1.2"/><text y="4" text-anchor="middle" class="odds">${od}% · ${c}●</text></g>`; }
    else if (targetMode && targetMode !== 'vassal' && targets.has(i) && camOK) { const od = Math.round(D.campaignOdds(S, i) * 100); s += `<g pointer-events="none" transform="translate(${x} ${y - 34})" class="oddb"><rect x="-18" y="-9.5" width="36" height="18" rx="9" fill="${od >= 60 ? '#2f6b55' : od >= 40 ? '#b98a2e' : '#a8321f'}" stroke="#f3e6c6" stroke-width="1.2"/><text y="4" text-anchor="middle" class="odds">${od}%</text></g>`; }
  });
  s += MAP2.ship(g.W * 0.08, g.H * 0.6, me.robe) + MAP2.serpent(g.W * 0.86, g.H * 0.04) + MAP2.compass(30, g.H - 26);
  // pions
  const cap = g.cells[S.capital].c;
  s += `<g class="token me" id="tokMe" transform="translate(${cap[0] + 28} ${cap[1] - 16})" pointer-events="none"><circle r="13.5" fill="url(#tokG)" stroke="#e8c15a" stroke-width="2"/><g transform="translate(-9 -10) scale(.38)" stroke="#f3dc96" stroke-width="3.2" fill="none">${A_IC('armee')}</g><rect x="-13" y="12" width="26" height="12" rx="6" fill="#f3e6c6" stroke="#1c2f5e"/><text y="21.5" text-anchor="middle" class="tokn">${S.army}</text></g>`;
  s = s.replace('</defs>', '<radialGradient id="tokG" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#3a58a0"/><stop offset="1" stop-color="#132246"/></radialGradient><radialGradient id="tokR" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#c0402a"/><stop offset="1" stop-color="#5a1208"/></radialGradient></defs>');
  if (!S.rivalDown) {
    const front = S.regions.filter(r => own(r.i) === 'rival').map(r => [r, Math.min(...D.myRegions(S).map(m => Math.hypot(g.cells[m.i].c[0] - g.cells[r.i].c[0], g.cells[m.i].c[1] - g.cells[r.i].c[1])))]).sort((a, b) => a[1] - b[1])[0];
    if (front) { const [x, y] = g.cells[front[0].i].c; s += `<g class="token foe ${S.menace > 60 ? 'hot' : ''}" id="tokFoe" transform="translate(${x - 24} ${y - 18})" onclick="rivalSheet()" style="cursor:pointer"><circle r="12.5" fill="url(#tokR)" stroke="#f0a33a" stroke-width="2"/><g transform="translate(-8 -9) scale(.34)" stroke="#ffd9b0" stroke-width="3.4" fill="none">${A_IC('epees')}</g><rect x="-13" y="11" width="26" height="12" rx="6" fill="#f6e3d6" stroke="#7a1e12"/><text y="20.5" text-anchor="middle" class="tokn r">${S.menace}</text></g>`; }
  }
  return `<svg viewBox="0 0 ${g.W} ${g.H}" class="board" id="board" role="img" aria-label="Carte du royaume">${s}</svg>`;
}
function inPoly(poly, x, y) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) c = !c; } return c; }
function A_IC(n) { return A.icon(n, 48).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, ''); }
function hud() {
  const r = D.ruler(S);
  return `<div class="hud">
   <div class="hud1"><button class="hudp" onclick="setTab('cour')" aria-label="La cour">${mini(r, 38)}</button>
    <div class="hudn"><b class="frak">Maison ${esc(S.house)}</b><span>${esc(r.title)}${r.epithet ? ' ' + esc(r.epithet) : ''}</span></div>
    <div class="hudy"><b class="frak">${ROMAN(S.year)}</b><span>${S.year}</span></div>
    <button class="snd" onclick="SND.toggleSfx();render()" aria-label="Effets sonores">${SND.sfx ? '🔊' : '🔇'}</button><button class="snd" onclick="SND.toggleMusic();render()" aria-label="Musique">${SND.music ? '🎵' : '<s>🎵</s>'}</button></div>
   <div class="hud2">
    <div>${A.icon('or', 18)}<b data-k="gold" class="${S.gold < 0 ? 'neg' : ''}">${S.gold}</b></div>
    <div>${A.icon('armee', 18)}<b data-k="army">${S.army}</b></div>
    <div>${A.icon('prestige', 18)}<b data-k="prestige">${S.prestige}</b></div>
    <div>${A.icon('domaine', 18)}<b data-k="domains">${S.domains}</b></div>
   </div>
   <div class="hud3"><div class="hg"><span>Stabilité <b data-k="stab">${Math.max(0, S.stab)}</b></span><div class="bar"><i data-g="stab" style="width:${Math.max(0, S.stab)}%;background:${S.stab < 25 ? '#d9573f' : S.stab < 50 ? '#e0b04a' : '#4fae86'}"></i></div></div>
    <div class="hg"><span>Menace <b data-k="menace">${S.menace}</b></span><div class="bar"><i data-g="menace" style="width:${Math.min(100, S.menace)}%;background:${S.menace > 70 ? '#d9573f' : S.menace > 40 ? '#e0b04a' : '#7b8fb8'}"></i></div></div></div>
  </div>`;
}
function alertChips() {
  const html = alerts(); if (!html) return '';
  const n = (html.match(/class="alert"/g) || []).length;
  const first = (html.match(/<b>([^<]+)<\/b>/) || [])[1] || '';
  return `<button class="achip" onclick="sheet(alerts() + '<p class=&quot;center&quot; style=&quot;margin:12px 0 0&quot;><button class=&quot;btn alt&quot; onclick=&quot;closeM()&quot;>Fermer</button></p>', true)"><span>!</span>${esc(first)}${n > 1 ? ` <i>+${n - 1}</i>` : ''}</button>`;
}
function viewPlateau() {
  const aiOn = S.aiMode && AI && !S.over, r = D.ruler(S);
  const alertsHtml = alerts(), n = (alertsHtml.match(/class="alert"/g) || []).length, firstA = (alertsHtml.match(/<b>([^<]+)<\/b>/) || [])[1] || '';
  return `<div class="imm">
   <div class="mapv" id="mapv">${boardSVG()}</div>
   <div class="ovl top">
    <button class="me" onclick="setTab('cour')" aria-label="La cour">${mini(r, 44)}<span><b class="frak">Maison ${esc(S.house)}</b><i>${esc(r.title)}${r.epithet ? ' ' + esc(r.epithet) : ''}, an ${ROMAN(S.year)}</i></span></button>
    <div class="res">
     <div class="chip">${A.icon('or', 18)}<b data-k="gold" class="${S.gold < 0 ? 'neg' : ''}">${S.gold}</b></div>
     <div class="chip">${A.icon('armee', 18)}<b data-k="army">${S.army}</b></div>
     <div class="chip">${A.icon('prestige', 18)}<b data-k="prestige">${S.prestige}</b></div>
     <div class="chip">${A.icon('domaine', 18)}<b data-k="domains">${S.domains}</b></div>
    </div>
   </div>
   <div class="ovl gauges2">
    <div><span>Stabilité <b data-k="stab">${Math.max(0, S.stab)}</b></span><div class="bar"><i data-g="stab" style="width:${Math.max(0, S.stab)}%;background:${S.stab < 25 ? '#e0563c' : S.stab < 50 ? '#e8b64e' : '#4fbf8f'}"></i></div></div>
    <div><span>Menace <b data-k="menace">${S.menace}</b></span><div class="bar"><i data-g="menace" style="width:${Math.min(100, S.menace)}%;background:${S.menace > 70 ? '#e0563c' : S.menace > 40 ? '#e8b64e' : '#8fa6d6'}"></i></div></div>
   </div>
   ${S.mission ? missionCard() : ''}
   ${targetMode ? `<div class="ovl tbanner2 ${targetMode === 'vassal' ? 'vas' : ''}">${targetMode === 'vassal' ? 'Touchez un seigneur à vassaliser' : 'Touchez une terre à attaquer'}<button onclick="targetMode=false;render()">Annuler</button></div>` : n ? `<button class="ovl achip2" onclick="sheet(alerts() + '<p class=&quot;center&quot; style=&quot;margin:12px 0 0&quot;><button class=&quot;btn alt&quot; onclick=&quot;closeM()&quot;>Fermer</button></p>', true)"><span>!</span>${esc(firstA)}${n > 1 ? ` <i>+${n - 1}</i>` : ''}</button>` : ''}
   <div class="ovl side"><button onclick="zoomBy(.8)" aria-label="Zoomer">+</button><button onclick="zoomBy(1.25)" aria-label="Dézoomer">−</button><button onclick="view=null;render()" aria-label="Vue d'ensemble">${A.icon('domaine', 18)}</button><button onclick="menuSheet()" aria-label="Menu">☰</button></div>
   <div class="ovl bar5">
    <button onclick="catSheet('gouv')"><span class="rb">${A.icon('construire', 26)}</span>Gouverner</button>
    <button onclick="catSheet('guerre')" class="${targetMode ? 'on' : ''}"><span class="rb">${A.icon('campagne', 26)}</span>Guerre</button>
    <button class="mid" ${S.over ? 'disabled' : ''} onclick="${S.over ? 'newGame()' : `act('attendre', true, this)`}"><span class="rb big">${A.icon(S.over ? 'construire' : 'astres', 32)}</span>${S.over ? 'Nouvelle' : '3 ans'}</button>
    <button onclick="catSheet('famille')"><span class="rb">${A.icon('marier', 26)}</span>Famille</button>
    <button onclick="setTab('cour')"><span class="rb">${A.icon(aiOn ? 'plume' : 'eglise', 26)}</span>${aiOn ? 'Ordonner' : 'Cour'}</button>
   </div>
  </div>`;
}
const ISS_SCENE = { roi: 'chateau', pape: 'eglise', peuple: 'village' };
function missionCard() {
  const m = S.mission, M = D.MISSIONS[m.k], I = D.ISSUERS[M.issuer];
  const prog = Math.max(0, m.prog != null ? m.prog : 0), pct = Math.min(100, prog / m.target * 100), left = m.deadline - S.turn;
  return `<button class="ovl mcard ${left <= 1 ? 'urgent' : ''}" onclick="missionSheet()"><span class="seal2">${A.icon(M.issuer === 'pape' ? 'eglise' : M.issuer === 'peuple' ? 'recolte' : 'construire', 16)}</span><span class="mt"><b>${esc(M.goal(m.target))}</b><i>${prog} / ${m.target} · ${left <= 0 ? 'dernier tour' : `encore ${left * S.P.ypt} ans`}</i><em style="width:${pct}%"></em></span></button>`;
}
function missionSheet(isNew) {
  const m = S.mission; if (!m) return;
  const M = D.MISSIONS[m.k], I = D.ISSUERS[M.issuer];
  SND.play(isNew ? 'hist' : 'tap');
  sheet(`${scn(ISS_SCENE[M.issuer], 'plume', true, 120)}<div class="histlab sc">Mandement</div><h2 class="frak">${esc(M.n)}</h2>
   <p class="story center">${esc(I.n)} vous ordonne : <b>${esc(M.goal(m.target).toLowerCase())}</b> avant l'an ${S.year + (m.deadline - S.turn) * S.P.ypt}.</p>
   <div class="mrew"><div class="ok"><b>Si vous réussissez</b>${esc(I.win)}</div><div class="ko"><b>Si vous échouez</b>${esc(I.lose)}</div></div>
   <p class="center" style="margin:14px 0 0"><button class="btn" onclick="${isNew ? 'nextQ()' : 'closeM()'}">${isNew ? 'Le sceau est brisé' : 'Fermer'}</button></p>`, !isNew);
}
function showMissionNew() { missionSheet(true); }
function showMission(q) {
  const M = D.MISSIONS[q.k], I = D.ISSUERS[M.issuer];
  SND.play(q.won ? 'glory' : 'loss');
  sheet(`${scn(ISS_SCENE[M.issuer], q.won ? 'prestige' : 'peste', q.won, 110)}<div class="histlab sc">Mandement ${q.won ? 'accompli' : 'échoué'}</div><h2 class="frak" style="color:${q.won ? 'var(--verd)' : 'var(--verm)'}">${esc(M.n)}</h2>
   <p class="story center">${esc(q.won ? I.win : I.lose)}</p>
   <p class="center" style="margin:14px 0 0"><button class="btn" onclick="nextQ()">Continuer</button></p>`);
}
function rivalLordPortrait(size) { const L = S.rivalLord; return L ? A.portraitSVG({ id: L.face, sex: 'M', age: S.year - L.born, traits: L.traits, ruler: true, robe: A.arms(S.rival).robe, accent: '#c9a14a' }, size, S.rival) : ''; }
function rivalSheet() {
  if (dragMoved) return;
  SND.play('tap');
  const L = S.rivalLord;
  if (!L || S.rivalDown) return sheet(`<h2 class="frak">Maison ${esc(S.rival)}</h2><p class="story center">Anéantie.</p><p class="center"><button class="btn alt" onclick="closeM()">Fermer</button></p>`, true);
  const T = D.TEMPERS[L.temper], ag = D.rivalAggro(S);
  sheet(`<div class="fiche-h"><span class="niche red">${rivalLordPortrait(92)}</span><div><div class="sc" style="color:var(--verm)">Votre rival</div><h2 class="frak" style="text-align:left;color:var(--ink);font-size:25px;margin:0">${esc(L.name)} ${esc(S.rival)}</h2>
    <div class="note" style="margin:2px 0 0">${S.year - L.born} ans, ${L.n > 1 ? `${L.n}e seigneur de la maison depuis le début de votre règne` : 'chef de la maison'}</div></div></div>
   <dl class="ident">${T ? `<dt>Tempérament</dt><dd><b>${T.n}</b> : ${T.desc}</dd>` : ''}<dt>Traits</dt><dd>${L.traits.map(t => `<b class="t${D.TRAITS[t].g}">${D.TRAITS[t].n}</b>`).join(', ') || 'aucun trait marquant'}</dd><dt>Passion</dt><dd>${esc(L.passion)}</dd><dt>Signe</dt><dd>${esc(L.mark)}</dd></dl>
   <div class="aggro"><span>Appétit de conquête</span><div class="bar"><i style="width:${Math.min(100, ag / 1.7 * 100)}%"></i></div><small>${ag >= 1.3 ? 'Un loup : il dévorera les seigneurs voisins.' : ag <= 0.8 ? 'Prudent : il préfère consolider.' : 'Ambitieux, sans folie.'}</small></div>
   <div class="facts"><div><span>Terres</span><b>${D.rivalCount(S)}</b></div><div><span>Menace</span><b>${S.menace}</b></div></div>
   <div class="qas" style="justify-content:center">${['intrigue', 'ambassade'].map(id => { const x = D.getActions(S).find(y => y.id === id); return x && x.ok ? `<button class="qa alt" onclick="closeM();act('${id}', true)">${x.label}</button>` : ''; }).join('')}</div>
   <p class="center" style="margin:12px 0 0"><button class="btn alt" onclick="closeM()">Fermer</button></p>`, true);
}
function chartSVG(h, w, ht) {
  if (!h || h.length < 2) return '<p class="note">Les courbes apparaîtront après quelques tours.</p>';
  w = w || 340; ht = ht || 150;
  const series = [['d', 'Terres', '#e8c15a', 17], ['p', 'Prestige', '#a9c0f5', null], ['a', 'Soldats', '#ff8f78', null], ['st', 'Stabilité', '#79d4a6', 100]];
  const x = i => 6 + i / (h.length - 1) * (w - 12);
  let s = `<rect width="${w}" height="${ht}" rx="6" fill="#0b1430"/>`;
  for (let k = 1; k < 4; k++) s += `<line x1="6" x2="${w - 6}" y1="${ht * k / 4}" y2="${ht * k / 4}" stroke="#ffffff14"/>`;
  for (const [key, , col, max0] of series) {
    const max = max0 || Math.max(10, ...h.map(p => p[key])); const min = key === 'p' ? Math.min(0, ...h.map(p => p[key])) : 0;
    const pts = h.map((p, i) => `${x(i).toFixed(1)},${(ht - 8 - (p[key] - min) / (max - min || 1) * (ht - 16)).toFixed(1)}`).join(' ');
    s += `<polyline points="${pts}" fill="none" stroke="${col}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
  }
  [1250, 1300].forEach(y => { const i = h.findIndex(p => p.y >= y); if (i > 0) s += `<line x1="${x(i)}" x2="${x(i)}" y1="4" y2="${ht - 4}" stroke="#e8c15a55" stroke-dasharray="3 3"/>`; });
  return `<svg viewBox="0 0 ${w} ${ht}" class="chart" role="img" aria-label="Courbes du règne">${s}</svg><div class="legend">${series.map(([, n, c]) => `<span style="--c:${c}">${n}</span>`).join('')}</div><div class="cax"><span>${h[0].y}</span><span>${h[h.length - 1].y}</span></div>`;
}
const GUIDE = [
  ['.ovl .me', 'Voici votre souverain. Touchez-le pour ouvrir la cour : famille, conseil, maisons voisines, politiques, trésor.'],
  ['.ovl .res', 'Vos ressources : or, soldats, prestige et nombre de terres.'],
  ['.gauges2', 'Surveillez la stabilité (à zéro, les barons vous déposent) et la menace de votre rivale.'],
  ['#board', 'Votre royaume est à vos couleurs. Touchez une terre voisine : vos éclaireurs y repèrent la posture de l\'ennemi, à vous de choisir l\'assaut, le siège ou la ruse — ou d\'obtenir l\'hommage par des présents. Glissez pour vous déplacer, pincez pour zoomer.'],
  ['.bar5', 'Une entreprise par période de trois ans : bâtir (sept édifices), guerroyer, marier, éduquer l\'héritier… ou laisser passer le temps avec le bouton bleu.'],
];
function guide(step) {
  step = step || 0;
  try { if (step === 0 && localStorage.getItem('cl_guide')) return; } catch (e) {}
  document.querySelectorAll('.coach').forEach(e => e.remove());
  if (step >= GUIDE.length || tab !== 'plateau') { try { localStorage.setItem('cl_guide', '1'); } catch (e) {} return; }
  const [sel, txt] = GUIDE[step], el = document.querySelector(sel); if (!el) return guide(step + 1);
  const r = el.getBoundingClientRect(), big = r.height > innerHeight * 0.5;
  const hole = big ? { x: 12, y: innerHeight * 0.3, w: innerWidth - 24, h: innerHeight * 0.32 } : { x: r.left - 6, y: r.top - 6, w: r.width + 12, h: r.height + 12 };
  const below = hole.y + hole.h + 150 < innerHeight;
  const d = document.createElement('div'); d.className = 'coach';
  d.innerHTML = `<div class="hole" style="left:${hole.x}px;top:${hole.y}px;width:${hole.w}px;height:${hole.h}px"></div>
   <div class="bubble" style="${below ? `top:${hole.y + hole.h + 12}px` : `bottom:${innerHeight - hole.y + 12}px`}"><p>${txt}</p><div><span>${step + 1} / ${GUIDE.length}</span><button onclick="guide(99)">Passer</button><button class="nx" onclick="guide(${step + 1})">${step === GUIDE.length - 1 ? 'À vous de jouer' : 'Suivant'}</button></div></div>`;
  document.body.appendChild(d);
}
function menuSheet() {
  SND.play('tap');
  sheet(`<h2 class="frak">Menu</h2><div class="menu2">
   <button onclick="closeM();setTab('cour')">${A.icon('eglise', 24)}<span>La cour<small>Souverain, famille, politiques, trésor</small></span></button>
   <button onclick="closeM();setTab('lignee')">${A.icon('marier', 24)}<span>La lignée<small>Arbre et succession</small></span></button>
   <button onclick="closeM();setTab('chronique')">${A.icon('plume', 24)}<span>La chronique<small>Tout ce qui s'est passé</small></span></button>
   <button onclick="reportBug(this)"><span class="em">🐞</span><span>Signaler un problème<small>Envoie à Claude l'écran et l'état de la partie</small></span></button>
   <button onclick="titlesSheet()">${A.icon('prestige', 24)}<span>Titres de gloire<small>${Object.keys(titlesGot()).length} sur ${TITLES.length} débloqués</small></span></button>
   <button onclick="closeM();setTab('labo')">${A.icon('fiole', 24)}<span>Le laboratoire<small>Simulations et équilibrage</small></span></button>
   <button onclick="SND.toggleSfx();menuSheet()"><span class="em">${SND.sfx ? '🔊' : '🔇'}</span><span>Effets sonores<small>${SND.sfx ? 'activés' : 'coupés'}</small></span></button>
   <button onclick="SND.toggleMusic();menuSheet()"><span class="em">🎵</span><span>Musique<small>${SND.music ? 'activée' : 'coupée'}</small></span></button>
   <button onclick="closeM();try{localStorage.removeItem('cl_guide')}catch(e){};guide()"><span class="em">？</span><span>Revoir le guide<small>Les bases en cinq étapes</small></span></button>
   <button onclick="closeM();newGame()">${A.icon('construire', 24)}<span>Nouvelle maison<small>Abandonner cette partie</small></span></button>
  </div><p class="center" style="margin:12px 0 0"><button class="btn alt" onclick="closeM()">Fermer</button></p>`, true);
}
// ---- caméra de la carte : glisser, pincer, zoomer
let view = null;
function fitView() {
  const g = D.mapGeom(S.seed), W = innerWidth, H = innerHeight, top = 150, bot = 130;
  const s = Math.min(W / (g.W * 1.02), (H - top - bot) / (g.H * 1.02));
  const w = W / s, h = H / s;
  return { x: g.W / 2 - w / 2, y: g.H / 2 - h / 2 - ((top - bot) / 2) / s, w, h };
}
function clampView() {
  const g = D.mapGeom(S.seed), f = fitView();
  const ratio = innerHeight / innerWidth;
  view.w = Math.max(g.W * 0.32, Math.min(f.w * 1.15, view.w)); view.h = view.w * ratio;
  const cx = view.x + view.w / 2, cy = view.y + view.h / 2;
  const ncx = Math.max(0, Math.min(g.W, cx)), ncy = Math.max(-40, Math.min(g.H + 40, cy));
  view.x = ncx - view.w / 2; view.y = ncy - view.h / 2;
}
let vBase = null, vTimer = 0;
// live = pendant un geste : on déplace l'image déjà dessinée (transform, accéléré par la puce graphique) et on ne redessine la carte qu'à la fin
function applyView(live) {
  const b = document.getElementById('board'); if (!b) return; if (!view) view = fitView();
  if (live && vBase && b._vb === vBase) {
    const k = vBase.w / view.w, tx = (vBase.x - view.x) / view.w * innerWidth, ty = (vBase.y - view.y) / view.h * innerHeight;
    b.style.transformOrigin = '0 0'; b.style.transform = `translate3d(${tx.toFixed(1)}px,${ty.toFixed(1)}px,0) scale(${k.toFixed(4)})`;
    clearTimeout(vTimer); vTimer = setTimeout(() => applyView(), 160); return;
  }
  clearTimeout(vTimer); b.style.transform = '';
  b.setAttribute('viewBox', `${view.x.toFixed(1)} ${view.y.toFixed(1)} ${view.w.toFixed(1)} ${view.h.toFixed(1)}`); b.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  vBase = { x: view.x, y: view.y, w: view.w, h: view.h }; b._vb = vBase;
}
function zoomAt(f, px, py) {
  if (!view) view = fitView();
  const mx = view.x + view.w * (px / innerWidth), my = view.y + view.h * (py / innerHeight);
  view.w *= f; view.h *= f; clampView();
  view.x = mx - view.w * (px / innerWidth); view.y = my - view.h * (py / innerHeight); clampView(); applyView(true);
}
function zoomBy(f) { SND.play('tap'); zoomAt(f, innerWidth / 2, innerHeight / 2); }
let dragMoved = false;
function wireMap() {
  const b = document.getElementById('board'); if (!b) return;
  applyView();
  const pts = new Map(); let last = null, pinch = null;
  b.addEventListener('pointerdown', e => { pts.set(e.pointerId, [e.clientX, e.clientY]); dragMoved = false; if (pts.size === 1) last = [e.clientX, e.clientY]; if (pts.size === 2) { const [p, q] = [...pts.values()]; pinch = { d: Math.hypot(p[0] - q[0], p[1] - q[1]), m: [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2] }; } });
  b.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 1 && last) { const dx = e.clientX - last[0], dy = e.clientY - last[1]; if (Math.abs(dx) + Math.abs(dy) > 2) { if (!dragMoved && Math.hypot(e.clientX - last[0], e.clientY - last[1]) < 6) return; dragMoved = true; view.x -= dx * view.w / innerWidth; view.y -= dy * view.h / innerHeight; clampView(); applyView(true); last = [e.clientX, e.clientY]; } }
    else if (pts.size === 2 && pinch) { const [p, q] = [...pts.values()]; const d = Math.hypot(p[0] - q[0], p[1] - q[1]); if (Math.abs(d - pinch.d) > 2) { dragMoved = true; zoomAt(pinch.d / d, pinch.m[0], pinch.m[1]); pinch.d = d; } }
  });
  const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (pts.size === 1) last = [...pts.values()][0]; if (!pts.size) { last = null; applyView(); } };
  b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up);
  b.addEventListener('click', e => { if (dragMoved) { e.stopPropagation(); e.preventDefault(); dragMoved = false; } }, true);
  b.addEventListener('wheel', e => { e.preventDefault(); zoomAt(e.deltaY > 0 ? 1.12 : 0.89, e.clientX, e.clientY); }, { passive: false });
  b.addEventListener('dblclick', e => zoomAt(0.6, e.clientX, e.clientY));
}
addEventListener('resize', () => { if (tab === 'plateau') { view = null; applyView(); } });
function eduMenu() {
  const h = D.heir(S), a = D.getActions(S).find(x => x.id === 'eduquer'); if (!h || !a) return;
  SND.play('tap');
  sheet(`<div class="center">${mini(h, 64)}</div><h2 class="frak">L'éducation de ${esc(h.name)}</h2><p class="center story" style="margin:2px 0 8px">${D.age(S, h)} ans · ${h.traits.map(t => D.TRAITS[t].n).join(', ') || 'sans trait marqué'}. Chaque voie coûte ${S.P.eduCost} or et peut corriger un défaut.</p>
   <div class="acts sh bld">${Object.entries(D.EDU_PATHS).map(([k, E]) => { const tid = E.tutor && S.council ? S.council[E.tutor] : null, tut = tid != null ? S.people[tid] : null, ch = Math.round(D.eduChance(S, k) * 100), fx = h.traits.includes(E.fix);
     return `<button class="act" aria-disabled="${!a.ok}" onclick="${a.ok ? `closeM();eduGo('${k}')` : ''}"><span class="roundel">${A.icon(E.ic, 24)}</span><span class="nm">${E.n}</span><span class="fx"><span class="up">${E.good.map(t => D.TRAITS[t].n).join(' ou ')} · ${ch} %</span>${fx ? `<span class="up">corrige : ${D.TRAITS[E.fix].n.toLowerCase()}</span>` : ''}<span class="neu bdesc">${E.d}${E.tutor ? (tut ? ` — précepteur : ${esc(tut.name)}` : ` — sans ${D.COUNCIL[E.tutor].n.toLowerCase()}, pas de précepteur`) : ''}</span></span></button>`; }).join('')}</div>
   ${a.ok ? '' : `<p class="center" style="color:var(--verm);margin:8px 0 0">Il faut ${S.P.eduCost} pièces d'or.</p>`}
   <p class="center note" style="margin:8px 0 0">Un bon conseiller dans la charge correspondante fait un meilleur précepteur.</p>
   <p class="center" style="margin:10px 0 0"><button class="btn alt" onclick="closeM()">Fermer</button></p>`, true);
}
function eduGo(k) {
  if (S.over || S.event || queue.length || busyTurn) return;
  busyTurn = true; SND.play('seal');
  seal(null, () => { busyTurn = false; turn('eduquer', k); });
}
function buildMenu(reg) {
  const b = D.getActions(S).find(a => a.id === 'construire'); if (!b) return;
  SND.play('tap');
  const cost = (b.desc.match(/\d+/) || ['?'])[0];
  const where = reg != null && S.regions[reg] ? ` à ${esc(S.regions[reg].name)}` : '';
  const types = D.buildTypes(S);
  sheet(`<h2 class="frak">Bâtir${where}</h2><p class="center story" style="margin:2px 0 8px">Chaque édifice coûte <b>${cost} or</b> (le prix monte à chaque chantier) et rapporte +${S.P.incPerBuild} or par tour, plus son effet propre.</p>
   <div class="acts sh bld">${types.map(k => { const B = D.BUILDINGS[k], n = D.edif(S, k);
     return `<button class="act" aria-disabled="${!b.ok}" onclick="${b.ok ? `closeM();buildGo(${reg == null ? 'null' : reg},'${k}')` : ''}"><span class="roundel">${A.icon(B.ic, 24)}</span><span class="nm">${esc(B.n)}${n ? ` <small class="cnt">×${n}</small>` : ''}</span><span class="fx"><span class="up">${esc(B.fx)}</span><span class="neu bdesc">${esc(B.desc)}</span></span></button>`; }).join('')}</div>
   ${b.ok ? '' : `<p class="center" style="margin:10px 0 0;color:var(--verm)">Il vous faut ${cost} pièces d'or.</p>`}
   <p class="center" style="margin:12px 0 0"><button class="btn alt" onclick="closeM()">Fermer</button></p>`, true);
}
function warGo(reg, k) {
  if (S.over || S.event || queue.length || busyTurn) return;
  busyTurn = true; targetMode = false; selRegion = null; SND.play('seal');
  seal(null, () => { busyTurn = false; turn('campagne', reg, k); });
}
function buildGo(reg, k) {
  if (S.over || S.event || queue.length || busyTurn) return;
  busyTurn = true; targetMode = false; selRegion = null; SND.play('seal');
  seal(null, () => { busyTurn = false; turn('construire', reg, k); });
}
function catSheet(g) {
  SND.play('tap');
  const T = { gouv: 'Gouverner', guerre: 'Guerre et diplomatie', famille: 'Famille' }[g];
  const acts = D.getActions(S).filter(a => a.g === g);
  sheet(`<h2 class="frak">${T}</h2><div class="acts sh">${acts.map(a => a.id === 'vassaliser' ? `<button class="act" aria-disabled="${!a.ok}" onclick="${a.ok ? 'closeM();targetMode=&quot;vassal&quot;;setTab(&quot;plateau&quot;)' : ''}"><span class="roundel">${A.icon('banniere', 24)}</span><span class="nm">Vassaliser</span><span class="fx"><span class="neu">${esc(a.desc)}</span></span></button>` : a.id === 'campagne' ? `<button class="act" aria-disabled="${!a.ok}" onclick="${a.ok ? 'closeM();targetMode=&quot;war&quot;;setTab(&quot;plateau&quot;)' : ''}"><span class="roundel">${A.icon('campagne', 24)}</span><span class="nm">Partir en campagne</span><span class="fx"><span class="neu">${a.ok ? 'Choisissez la cible sur la carte' : (S.army < S.P.campMin ? `Il faut ${S.P.campMin} soldats` : 'Impossible pour l\'instant')}</span></span></button>` : actTile(a).replace("onclick=\"act(", "onclick=\"closeM();act(")).join('')}</div>
   <p class="center" style="margin:12px 0 0"><button class="btn alt" onclick="closeM()">Fermer</button></p>`, true);
}
function tapRegion(i) {
  SND.play('tap');
  selRegion = i; const R = S.regions[i], g = D.mapGeom(S.seed);
  const isT = D.borderTargets(S).some(r => r.i === i), camp = D.getActions(S).find(a => a.id === 'campagne');
  const owner = R.owner === 'me' ? 'Votre domaine' : R.owner === 'rival' ? `Maison ${esc(S.rival)}, votre rivale` : `Maison ${esc(R.owner.replace(/^d(e |')/, ''))}`;
  const odds = isT ? Math.round(D.campaignOdds(S, i) * 100) : null;
  const neigh = g.adj[i].map(j => S.regions[j]);
  let actions = '';
  if (R.owner === 'me') {
    const b = D.getActions(S).find(a => a.id === 'construire');
    actions = `<button class="btn wide" ${b.ok && !S.over ? '' : 'disabled'} onclick="closeM();act('construire', true, null, ${i})">Bâtir ici <small>(${b.desc.split(',')[0]})</small></button>`;
  } else if (isT) {
    actions = `<div class="oddsbar"><i style="width:${odds}%"></i></div><p class="center note" style="margin:4px 0 8px">Vos chances : <b>${odds} %</b>. Votre ost : ${S.army} soldats. Défense estimée : ${Math.round(D.regionEnemy(S, R))}.</p>
     ${camp.ok && !S.over ? (() => { const sc = D.scoutReport(S, R), STn = D.STANCES[sc];
       return `<div class="scout">${A.icon('astres', 16)} <span>Vos éclaireurs : l'ennemi <b>${STn.n}</b>.</span></div><div class="tacs">${Object.entries(D.TACTICS).map(([k, T]) => { const o = Math.round(D.campaignOdds(S, i, k, sc) * 100), m = D.tacticMult(S, k, sc);
         return `<button class="tac ${m > 1.05 ? 'good' : m < 0.95 ? 'bad' : ''}" ${k === 'siege' && S.gold < 10 ? 'disabled' : ''} onclick="closeM();warGo(${i},'${k}')"><b>${T.n}</b><span class="to">${o} %</span><small>${esc(T.d)}</small></button>`; }).join('')}</div>
       <p class="center note" style="margin:6px 0 0">Les éclaireurs se trompent parfois${S.council && S.council.marechal != null ? ' (moins avec un bon maréchal)' : ''}.</p>`; })() : `<p class="center note" style="margin:0">Pour attaquer, il faut au moins ${S.P.campMin} soldats et un souverain majeur.</p>`}`;
  } else actions = `<p class="center note">Trop loin : aucune frontière commune avec vos terres.</p>`;
  if (isT && R.owner !== 'rival') { const vo = Math.round(D.vassalOdds(S, i) * 100), vc = D.vassalCost(S, i), va = D.getActions(S).find(x => x.id === 'vassaliser'); actions += `<div class="vasbox"><b>Ou sans combat :</b> envoyer des présents pour obtenir l'hommage du seigneur. Coût ${vc} or, chances ${vo} % (selon votre prestige).<button class="btn wide gold" ${S.gold >= vc && !S.over ? '' : 'disabled'} onclick="closeM();targetMode=false;act('vassaliser', true, null, ${i})">${S.gold >= vc ? 'Proposer la vassalité' : 'Pas assez d\'or'}</button></div>`; }
  if (R.owner !== 'me' && R.owner !== 'rival') actions += houseBox(R.owner);
  if (R.owner === 'rival' && S.rivalLord) actions += `<button class="plink" style="display:flex;margin:10px auto 0" onclick="closeM();rivalSheet()"><span class="mini">${rivalLordPortrait(30)}</span><span>Seigneur : ${esc(S.rivalLord.name)} ${esc(S.rival)}</span></button>`;
  if (R.owner === 'rival') actions += `<div class="qas" style="justify-content:center">${['intrigue', 'ambassade'].map(id => { const a = D.getActions(S).find(x => x.id === id); return a && a.ok ? `<button class="qa alt" onclick="closeM();act('${id}', true)">${a.label}</button>` : ''; }).join('')}</div>`;
  sheet(`<div class="rhead">${A.shieldSVG(ownerArms(R.owner), 46)}<div><h2 class="frak" style="text-align:left;margin:0">${esc(R.name)}</h2><div class="note" style="margin:0">${owner}${R.cap ? ', capitale' : ''}</div></div></div>
   <div class="rstats"><div><span>Richesse</span><b>${'●'.repeat(R.wealth)}<i>${'●'.repeat(4 - R.wealth)}</i></b><small>+${R.wealth} or par tour</small></div><div><span>Terrain</span><b>${R.terrain}</b><small>${R.terrain === 'collines' ? 'défense accrue' : R.terrain === 'marais' ? 'difficile d\'accès' : '&nbsp;'}</small></div><div><span>${R.owner === 'me' ? 'Édifices' : 'Défense'}</span><b>${R.owner === 'me' ? R.builds : Math.round(D.regionEnemy(S, R))}</b><small>&nbsp;</small></div></div>
   ${actions}
   <p class="note center" style="margin:10px 0 0">Voisins : ${neigh.map(n => esc(n.name.replace(/^(Comté|Baronnie|Vicomté|Seigneurie|Châtellenie|Marche) de /, ''))).join(', ')}</p>
   <p class="center" style="margin:10px 0 0"><button class="btn alt" onclick="selRegion=null;closeM();render()">Fermer</button></p>`, true);
  const b = document.getElementById('board'); if (b) b.querySelectorAll('.rg').forEach(p => p.classList.toggle('sel', +p.dataset.i === i));
}
// déplacement animé d'un pion avant la bataille
function moveToken(q, then) {
  const b = document.getElementById('board');
  if (reduced || tab !== 'plateau' || !b || q.region == null && q.to == null) return then();
  const g = D.mapGeom(S.seed);
  const inv = q.kind === 'invasion';
  const from = inv ? g.cells[q.from != null ? q.from : 0].c : g.cells[S.capital].c, to = g.cells[inv ? (q.region != null ? q.region : q.to) : q.region].c;
  if (!from || !to) return then();
  const tok = document.getElementById(inv ? 'tokFoe' : 'tokMe');
  const el = tok ? tok.cloneNode(true) : null; if (!el) return then();
  el.removeAttribute('id'); el.classList.add('moving'); b.appendChild(el);
  SND.play('march');
  const t0 = performance.now(), D_ = 850;
  (function step(t) { const x = Math.min(1, (t - t0) / D_), e = x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; const X = from[0] + (to[0] - from[0]) * e, Y = from[1] + (to[1] - from[1]) * e - Math.sin(Math.PI * x) * 18; el.setAttribute('transform', `translate(${X} ${Y})`); if (x < 1) requestAnimationFrame(step); else setTimeout(() => { el.remove(); then(); }, 120); })(t0);
}

function royaumeInfo() {
  const P = S.P, r = D.ruler(S);
  const tr = r.traits.reduce((a, t) => a + (D.TRAITS[t].inc || 0), 0);
  const land = D.myRegions(S).reduce((x, y) => x + y.wealth, 0);
  const rows = [['Terres (' + S.domains + ')', land], ['Édifices', S.builds * P.incPerBuild + D.edif(S, 'marche') * 3 + D.edif(S, 'moulin')], ['Mine d\'argent', S.mine && !S.mineSold ? 4 : 0], ['Commerce et pèlerins', S.trade || 0], ['Talents du souverain', tr], ['Corvées abolies', -(S.corvee || 0)], ['Chantier de la cathédrale', S.chantier ? -5 : 0], ['Solde de l\'armée', -Math.round(S.army * P.upkeep * (1 + 0.9 * (D.mixOf(S).ch - 0.15) + 0.25 * (D.mixOf(S).ar - 0.15)))]].filter(x => x[1]);
  for (const k of ['fisc', 'cour', 'ost']) { const f = D.policyFx(S, k, S.pol[k]); if (f.gold) rows.push([D.POLICIES[k].n + ' (' + D.POLICIES[k].opts[S.pol[k]].toLowerCase() + ')', f.gold]); }
  const tot = rows.reduce((x, y) => x + y[1], 0);
  const goals = `<section class="folio"><h3 class="h">Chemins vers la gloire</h3><div class="goals"><div><b>Tenir jusqu'en ${P.endYear}</b><span>${Math.max(0, P.endYear - S.year)} ans encore</span></div><div><b>Unifier le royaume</b><span>${S.domains} terres sur ${P.unifyAt} : victoire immédiate et grand bonus</span><i style="--p:${Math.min(100, S.domains / P.unifyAt * 100)}%"></i></div><div><b>Anéantir la maison ${esc(S.rival)}</b><span>${S.rivalDown ? 'Accompli !' : D.rivalCount(S) + ' terres encore à prendre'}</span></div></div></section>`;
  const curves = `<section class="folio"><h3 class="h">Courbes du règne</h3>${chartSVG(S.hist)}</section>`;
  return goals + curves + `<section class="folio rival" onclick="rivalSheet()" style="cursor:pointer">${S.rivalLord && !S.rivalDown ? `<span class="mini">${rivalLordPortrait(54)}</span>` : A.shieldSVG(S.rival, 54)}<div><h3 class="rub frak" style="margin:0">Maison ${esc(S.rival)}</h3><p>${S.rivalDown ? 'Anéantie. Ses terres sont à vous.' : `${S.rivalLord ? esc(S.rivalLord.name) + ', ' + (S.year - S.rivalLord.born) + ' ans, la mène. ' : ''}${S.regions.filter(x => x.owner === 'rival').length} terres, menace ${S.menace}. Touchez pour en savoir plus.`}</p></div></section>
   <section class="folio"><h3 class="h">Le trésor</h3><div class="ledger">${rows.map(([n, v]) => `<div><span>${n}</span><span class="${v < 0 ? 'neg' : ''}">${v > 0 ? '+' : '−'}${Math.abs(v)}</span></div>`).join('')}<div class="tot"><span>Revenu par tour</span><span>${tot >= 0 ? '+' : '−'}${Math.abs(tot)}</span></div></div></section>`;
}
// ---------- Royaume ----------
function viewRoyaume() {
  const P = S.P, r = D.ruler(S);
  const tr = r.traits.reduce((a, t) => a + (D.TRAITS[t].inc || 0), 0);
  const rows = [['Domaines', S.domains * P.incPerDomain], ['Édifices', S.builds * P.incPerBuild + D.edif(S, 'marche') * 3 + D.edif(S, 'moulin')], ['Mine d\'argent', S.mine && !S.mineSold ? 4 : 0], ['Commerce et pèlerins', S.trade || 0], ['Talents du souverain', tr], ['Corvées abolies', -(S.corvee || 0)], ['Chantier de la cathédrale', S.chantier ? -5 : 0], ['Solde de l\'armée', -Math.round(S.army * P.upkeep * (1 + 0.9 * (D.mixOf(S).ch - 0.15) + 0.25 * (D.mixOf(S).ar - 0.15)))]].filter(x => x[1]);
  const tot = rows.reduce((a, x) => a + x[1], 0);
  const proj = [
    S.chantier ? ['eglise', 'Cathédrale en chantier', `Encore ${S.chantier} tour${S.chantier > 1 ? 's' : ''} avant l'achèvement`] : null,
    S.cathedral ? ['eglise', 'Cathédrale achevée', '+1 prestige par tour'] : null,
    S.univ ? ['eduquer', 'Université', 'L\'éducation réussit plus souvent'] : null,
    S.trade ? ['marchand', 'Commerce', `+${S.trade} or par tour`] : null,
    S.mine && !S.mineSold ? ['mine', 'Mine d\'argent', '+4 or par tour'] : null,
    S.relic ? ['croisade', 'Reliquaire', 'Il attire les pèlerins… ou les moqueries'] : null,
  ].filter(Boolean);
  return `<section class="folio">${header()}</section>
  <section class="folio"><h3 class="rub frak">Le royaume</h3>${A.mapSVG(S.seed, S.house, S.domains, S.builds, S.menace, S.alliances, { fresh: S.lastConquest && S.year - S.lastConquest <= 3 ? S.domains - 1 : -1, lost: S.lastLoss && S.year - S.lastLoss <= 3 ? S.domains : -1 })}
   <div class="facts"><div><span>Domaines</span><b>${S.domains}</b></div><div><span>Édifices</span><b>${S.builds}</b></div><div><span>Alliances</span><b>${S.alliances}</b></div><div><span>Menace</span><b>${S.menace}</b></div>
   <div><span>Guerres gagnées</span><b>${S.stats.warsWon}/${S.stats.wars}</b></div><div><span>Invasions repoussées</span><b>${S.stats.invRepelled}/${S.stats.invasions}</b></div></div>
   <p class="note">Les flammes marquent les terres d'où viendra la prochaine invasion.</p></section>
  <section class="folio rival">${A.shieldSVG(S.rival, 54)}<div><h3 class="rub frak" style="margin:0">Maison ${esc(S.rival)}</h3><p>Votre rivale de toujours. Plus de la moitié des invasions viennent d'elle. Les ambassades, les présents et les mercenaires tiennent sa menace en respect.</p></div></section>
  ${proj.length ? `<section class="folio"><h3 class="rub frak">Grands ouvrages</h3>${proj.map(([i, n, d]) => `<div class="proj"><span class="roundel">${A.icon(i, 24)}</span><div><b>${n}</b><br><span class="note">${d}</span></div></div>`).join('')}</section>` : ''}
  <section class="folio"><h3 class="rub frak">Le trésor</h3><div class="ledger">${rows.map(([n, v]) => `<div><span>${n}</span><span class="${v < 0 ? 'neg' : ''}">${v > 0 ? '+' : '−'}${Math.abs(v)}</span></div>`).join('')}<div class="tot"><span>Revenu par tour</span><span>${tot >= 0 ? '+' : '−'}${Math.abs(tot)}</span></div></div></section>`;
}

// ---------- Lignée ----------
function persRow(p) {
  const st = !p.alive ? `${p.cause}, en ${p.died}` : !p.inDyn ? 'mariée dans une autre maison' : `${ANS(D.age(S, p))}${p.spouse ? `, uni${p.sex === 'F' ? 'e' : ''} à ${esc(D.person(S, p.spouse).name)}` : ''}`;
  const spx = p.spouse ? D.person(S, p.spouse) : (p.widow ? D.person(S, p.widow) : null), imp = spx && spx.from && spx.from !== S.house && p.inDyn ? `<span class="impm" title="Armes de l'alliance avec la maison ${esc(spx.from)}">${A.impaledSVG(S.house, spx.from, 18)}</span>` : '';
  const tag = p.id === S.rulerId ? 'Règne' : p.adopted ? 'Adopté' : p.bastard ? 'Bâtard' : p.disinherited ? 'Déshérité' : '';
  return `<button class="pers ${!p.alive || !p.inDyn ? 'gone' : ''}" onclick="who(${p.id})">${mini(p, 38)}<span><span class="nm">${esc(FN(p))}</span>${imp}${tag ? ` <span class="pill neu" style="font-size:12px">${tag}</span>` : ''}<br><span class="sub">${st}</span></span></button>`;
}
function tree(id, depth) {
  const p = S.people[id];
  const kids = Object.values(S.people).filter(k => k.parent === id).sort((a, b) => a.born - b.born);
  let h = persRow(p);
  if (p.inDyn && kids.length && depth < 8) h += `<div class="gen">${kids.map(k => tree(k.id, depth + 1)).join('')}</div>`;
  return h;
}
function viewLignee() {
  const line = D.successionLine(S).slice(0, 5);
  return `<section class="folio">${header()}</section>
  <section class="folio"><h3 class="rub frak">Ordre de succession</h3>${line.length ? `<ol class="line">${line.map(id => { const p = S.people[id]; return `<li><span><b>${esc(p.name)}</b>, ${ANS(D.age(S, p))}</span></li>`; }).join('')}</ol>` : '<p class="k-bad">Personne. La maison s\'éteindra avec son souverain.</p>'}</section>
  <section class="folio"><h3 class="rub frak">Les souverains</h3><div class="kings">${S.rulers.map(id => { const p = S.people[id]; return `<button onclick="who(${id})">${mini(p, 52)}<b>${esc(p.title)}</b><span>${esc(p.epithet || '')}</span><small>${p.ruledFrom}–${p.alive ? '' : p.died}</small></button>`; }).join('')}</div></section>
  <section class="folio"><h3 class="rub frak">Arbre de la maison</h3>${tree(S.rulers[0], 0)}</section>`;
}

// ---------- Chronique par règne ----------
function viewChronique() {
  const parts = S.rulers.slice().reverse().map(id => {
    const p = S.people[id], from = p.ruledFrom, to = p.alive ? 1e4 : p.died;
    const items = S.log.filter(l => l.r != null ? l.r === id : (l.y >= from && l.y < to)).reverse();
    return `<div class="reign">${mini(p, 44)}<div><h4 class="frak">${esc(FN(p))}</h4><small>${from} – ${p.alive ? 'règne encore' : p.died}</small></div></div>
     <div class="chron">${items.map(l => `<p class="k-${l.k}"><span class="y">${l.y}</span>${esc(l.t)}</p>`).join('') || '<p class="note">Rien de notable.</p>'}</div>`;
  }).join('');
  return `<section class="folio">${header()}</section><section class="folio"><h3 class="rub frak">Chronique</h3>${parts}</section>`;
}

// ---------- Labo ----------
const JOURNAL = [
  ['Prototype', '8 %', '46 %', 'Extinction dans 53 % des parties bien jouées : un souverain veuf passé 50 ans ne pouvait plus se remarier.'],
  ['Remariage, épouses plus jeunes', '16 %', '70 %', 'Deux failles : tout construire doublait le score ; « recruter, guerroyer » gagnait 54 % du temps.'],
  ['Édifices plus chers, lassitude de la guerre', '15 %', '76 %', 'Le bâtisseur tombe à 10 %.'],
  ['Adoption d\'un pupille', '20 %', '90 %', 'Trop facile : les invasions ne menacent plus personne.'],
  ['Réglage automatique (12 000 parties)', '14 %', '61 %', 'Équilibre atteint… mais trois actions font 62 % des tours, et 1200 se joue comme 1340.'],
  ['Contre la répétition', '7 %', '58 %', 'Usure des actions, trois âges, 7 événements historiques, 14 nouveaux événements, ambitions et épithètes, maison rivale. Événements différents par partie : 13 → 24. Tours sans événement : 35 % → 22 %. Le bot stratège a révélé une dernière faille, corrigée : se marier rapportait de la stabilité gratuite.'],
  ['Politiques au lieu de l\'entretien', '1 %', '58 %', 'Impôts, train de la cour et posture de l\'ost deviennent des réglages permanents ; un événement à 93 % des tours ; l\'action la plus fréquente ne fait plus que 22 % des tours. Les simulations ont montré que les premiers réglages avaient une réponse évidente (impôts légers, ost jamais levé) : rééquilibrés, adapter ses politiques rapporte maintenant 11 points de victoire.'],
  ['Marché matrimonial et identités', '1 %', '66 %', 'Chaque personnage a un tempérament, une passion, un signe distinctif, un lieu de naissance, une loyauté et une biographie. Mariages : 5 types de partis. Les simulations ont montré que les petits seigneurs n\'étaient presque jamais choisis (4 %) et que la loyauté ne déclenchait jamais rien : rééquilibrés, le bot qui simule ses choix répartit maintenant ses mariages entre les 5 types (11 à 26 % chacun).'],
  ['Le royaume devient un plateau', '0 %', '74 %', '17 terres nommées, chacune avec un seigneur, une richesse et une défense ; on attaque une terre précise en connaissant ses chances. Les simulations ont montré une carte figée (1,6 conquête par partie contre 4 terres perdues) et une guerre perdante en points : invasions qui pillent une fois sur deux au lieu de prendre une terre, conquêtes mieux récompensées. Un conquérant finit avec 6 terres (60 % de victoires), un bâtisseur avec 4 (74 %).'],
  ['Une carte vivante', '0 %', '74 %', 'La maison rivale avance seule sur les seigneurs voisins, les seigneurs se font la guerre entre eux (6 changements de carte par partie), on peut vassaliser un seigneur sans combat, et unifier le royaume (12 terres) donne une victoire immédiate. Premier essai : la rivale passait de 4 à 10 terres et le conquérant subissait trop de révoltes ; ralentie et rééquilibrée, le bâtisseur gagne 74 % de ses parties, le conquérant 65 %.'],
  ['Mandements, seigneur rival, courbes', '0 %', '76 %', 'Le roi, le pape ou le peuple confient des missions à échéance (récompense ou sanction). La maison rivale a désormais un seigneur, avec ses traits : un seigneur brave ou cruel conquiert plus vite, un sage ou un pieux moins. Un joueur attentif réussit environ deux mandements sur trois (3,7 réussis, 1,8 échoués par partie) ; les récompenses rendant le jeu un peu facile, les invasions ont été renforcées.'],
  ['Équilibrage : intrigue, mandements, choix', '0,5 %', '69 %', 'Les intrigues réussies affaiblissent désormais toutes les garnisons rivales et retournent parfois une terre frontalière. Les mandements de conquête ne demandent plus qu\'une terre de plus (réussite 31 % → 55 %), ceux d\'armée et de prestige sont plus exigeants. Neuf événements dont un choix l\'emportait à plus de 95 % ont été rééquilibrés (brigands, comète, mine, mésalliance, jacquerie, chroniqueur devenu précepteur…). Le joueur attentif gagne un peu moins souvent : 69 % au lieu de 75 %.'],
  ['Seigneur rival, âges, mandements', '1 %', '77 %', 'Le seigneur rival entre en scène : défis en combat singulier, mariage proposé pour une trêve, châtelain traître, mort au combat et guerre de succession, trêve de Dieu. Chaque âge a ses propres événements (baron félon, croisé de retour, guilde, pont de pierre, Grandes Compagnies, flagellants). Deux ambitions (Suzerain, Fléau des rivaux) et trois mandements (châtier la maison rivale, bâtir pour Dieu, un enfant pour la maison). Les trêves rendant le jeu plus doux, la menace monte un peu plus vite.'],
  ['Revue visuelle sur téléphone', '1 %', '75 %', 'Revue écran par écran en 390×844, en mouvement normal et réduit. Le vaincu d\'une bataille reste lisible (son blason se ternit, son nom est barré, au lieu de basculer sur les tentes) ; les deux forces sont nommées. En mouvement réduit, la barre des forces s\'affichait vide : corrigé. Les chiffres de stabilité et de menace, illisibles sur fond sombre, sont éclaircis. Deux enfants vivants ne portent plus le même prénom. Les mandements « une terre de plus », « un édifice », « un hommage », « une naissance » affichent désormais 0 / 1 au lieu d\'un total trompeur.'],
  ['Sept édifices, récits à suivre', '1 %', '77 %', 'Bâtir ouvre désormais un choix entre sept édifices aux effets distincts : moulin banal (stabilité), halle marchande (or), abbaye (prestige), donjon (défense), lices (soldats), puis collège de maîtres à l\'âge des cathédrales et hôtel-Dieu à l\'âge des fléaux. Trois récits se déroulent en deux temps : la guérisseuse accusée de sorcellerie, la carte du trésor templier, le bâtard prétendant ; votre premier choix décide de la suite, quelques années plus tard. Pour compenser, le revenu de base d\'un édifice passe de 3 à 2 or et la menace monte un peu plus vite.'],
  ['Le conseil, la cour et ses récits', '1 %', '78 %', 'Trois charges à pourvoir parmi vos proches : chancelier (or), maréchal (force de l\'ost) et chapelain (stabilité, prestige). Leur talent dépend de leurs traits et de leur âge ; leur loyauté monte quand le royaume va bien et baisse sous un seigneur colérique ou une cour frugale. Un conseiller rancunier détourne le trésor ou complote : il faut le destituer, l\'acheter ou l\'arrêter. Nouveaux récits : querelle de préséance, vœu de croisade à honorer (ou à trahir), amours secrètes qui finissent en mariage clandestin. Un bon conseil vaut environ 8 points de victoire : la menace monte un peu plus vite pour compenser.'],
  ['Maisons voisines, hauts faits, titres', '0 %', '78 %', 'Chaque maison voisine a un caractère (belliqueuse, marchande, pieuse, rusée) et une relation avec vous : les présents la font monter, les guerres la font chuter. Une maison amie accepte plus volontiers l\'hommage, vous invite à ses noces et vous prête ses lances ; une maison hostile pille vos frontières ; on vous demande d\'arbitrer leurs querelles. L\'écran de fin raconte les hauts faits de la maison, et douze titres de gloire se gagnent d\'une partie à l\'autre.'],
  ['Tactiques de bataille', '0 %', '78 %', 'Avant chaque campagne, les éclaireurs rapportent la posture de l\'ennemi : retranché derrière ses murs, prêt à une sortie, ou caché en embuscade (selon le terrain, le caractère de la maison et celui du seigneur rival). À vous de choisir l\'assaut (fort contre une sortie, pertes lourdes), le siège (fort contre les murs, −10 or, pertes légères) ou la ruse (forte contre les embuscades, selon l\'esprit du souverain). Les éclaireurs se trompent une fois sur quatre, moins avec un bon maréchal. Un joueur qui lit bien le terrain gagne quelques points de chances à chaque campagne.'],
  ['Héritiers et transmission', '1 %', '78 %', 'L\'éducation suit une voie : les armes (brave, robuste), les lettres (sage, parfois génie), la foi (pieux, sage) ou la cour (charismatique) ; chacune peut corriger un défaut, et le conseiller de la charge correspondante sert de précepteur. Quand un enfant hérite, il faut choisir son régent : la mère (stabilité), l\'oncle (soldats, mais il peut tenter d\'usurper le trône) ou un conseil (or, au prix de la stabilité). Les frères se jalousent, et le souverain vieillissant dicte son testament : tout à l\'aîné, des apanages pour les cadets, ou un legs à l\'Église.'],
  ['Revue d\'ensemble', '1 %', '77 %', 'Revue des nouveaux écrans sur téléphone et en mouvement réduit. Le bot qui simule les choix tient désormais compte de la loyauté des proches, des relations avec les voisins, des chantiers et des récits en cours : il voit enfin la valeur des choix à effet différé. Neuf choix trop tranchés rééquilibrés (guérisseuse, pont, enfant prodige, vœu de croisade, amours secrètes, trésor templier). Accords des textes au féminin, guide d\'introduction mis à jour (conseil, tactiques, édifices, éducation).'],
  ['Atelier partagé : mode test et testeurs', '0 %', '75 %', 'Le jeu rejoint l\'atelier commun de vos jeux (dépôt gameclaude) et reprend ses outils. Sur l\'écran titre, 🧪 Mode test lance une partie à part, sans toucher à votre sauvegarde, avec un compteur d\'images par seconde et un banc de mesure. Dans le menu ☰, 🐞 Signaler un problème envoie l\'écran ouvert et l\'état de la partie. Côté fabrication, chaque version passe désormais par un testeur au doigt (600 touches au hasard en 4 minutes, aucune erreur), par 15 captures fixes comparées aux précédentes et par 1 000 parties simulées.'],
  ['Carte plus fluide', '0 %', '75 %', 'Pendant un glissé ou un zoom, la carte n\'est plus redessinée à chaque image : la puce graphique déplace l\'image déjà dessinée, et le dessin précis n\'est refait qu\'à la fin du geste. Sur un téléphone simulé (processeur ralenti 4 fois), le glissé passe de 25 à 54 images par seconde ; ouvrir une fiche de terre prend 12 ms au lieu de 22.'],
  ['L\'âge des fléaux raconté', '0 %', '78 %', 'Un fil historique traverse le XIVe siècle : la croisade des pastoureaux (1320), la bataille de Cassel (1328), puis la guerre de Cent Ans dont le camp choisi décide de la suite quelques années plus tard (la chevalerie fauchée par les archers, une chevauchée anglaise, ou les pillards des deux camps), et le manque de bras après les épidémies. La Peste noire, qui ne pouvait jamais survenir (elle tombait entre deux tours), arrive enfin en 1347. Chaque fin de partie raconte désormais ce que l\'histoire retiendra de votre maison (conquérants, bâtisseurs, diplomates, saints, dynastes ou marchands) et ce qu\'elle devint après 1350.'],
  ['Vos édifices sur la carte', '0 %', '76 %', 'Chaque chantier apparaît désormais sur la carte, dessiné à la main à côté du château de la terre où il a été bâti : moulin aux ailes qui tournent, halle marchande à l\'auvent rayé, abbaye et son clocher, donjon de pierre, lices aux fanions, collège de maîtres, hôtel-Dieu à la croix rouge. La cathédrale se dresse près de la capitale, d\'abord dans ses échafaudages, puis avec ses deux flèches.'],
  ['Chevaliers, archers et piétaille', '0 %', '75 %', 'L\'ost a désormais une composition. Recruter propose trois troupes : la piétaille (bon marché, nombreuse), les archers (forts au siège et sur les murs contre les invasions) et les chevaliers (puissants à l\'assaut et en rase campagne, chers à entretenir). Les tactiques en tiennent compte : un siège avec beaucoup d\'archers ou un assaut mené par des chevaliers gagne plusieurs points de chances. Les lices forment des chevaliers, les mercenaires amènent archers et piétons. Sur 1 000 parties, une ost bien composée gagne 75 % des parties contre 74 % pour une ost de piétons seuls.'],
  ['Portraits et blasons', '0 %', '75 %', 'Les portraits vieillissent davantage (plis, poches sous les yeux, taches de l\'âge) et s\'habillent selon l\'époque de leur jeunesse : maille pour les braves de l\'âge des barons, surcot à bordure à l\'âge des cathédrales, col montant à l\'âge des fléaux. Les traits se voient : croix pectorale et tonsure du pieux, regard cerné du cruel, sourcils inquiets du couard, sourire du charismatique, bouche bée du simplet. Après un mariage d\'alliance, les armes du couple sont parties : moitié de votre blason, moitié de celui de l\'épouse ou de l\'époux, dans la Cour et l\'arbre.'],
];
function viewLabo() {
  const C = { victoire: '#2f6b55', extinction: '#6b3a78', revolte: '#a8321f', conquete: '#b98a2e', timeout: '#888' };
  const N = { victoire: 'Victoire', extinction: 'Extinction', revolte: 'Déposition', conquete: 'Conquête', timeout: '—' };
  let res = '';
  if (labRes) {
    const d = Math.max(1, labRes.done);
    res = `<section class="folio"><div class="sc" style="color:var(--ink2)">${labRes.done < labRes.n ? `Simulation : ${labRes.done} sur ${labRes.n}` : `${labRes.n} parties, bot ${labRes.botName}`}</div>
     <div class="frak" style="font-size:40px;color:var(--lapis);line-height:1.1;margin:4px 0 8px">${(labRes.wins / d * 100).toFixed(1)} % de victoires</div>
     <div class="hb">${Object.entries(labRes.causes).map(([k, v]) => `<i style="width:${v / d * 100}%;background:${C[k]}"></i>`).join('')}</div>
     <div class="legend">${Object.entries(labRes.causes).map(([k, v]) => `<span style="--c:${C[k]}">${N[k]} ${(v / d * 100).toFixed(0)} %</span>`).join('')}</div>
     <p class="note">${(labRes.turns / d * S.P.ypt).toFixed(0)} ans de règne et ${(labRes.rulers / d).toFixed(1)} souverains en moyenne par partie.</p></section>`;
  }
  return `<section class="folio"><h3 class="rub frak">Le laboratoire</h3><p style="margin:0 0 8px">Le jeu a été équilibré en faisant jouer des bots plus de 110 000 parties, version après version.</p>
   <table><tr><th>Version</th><th style="text-align:right">Hasard</th><th style="text-align:right">Avisé</th></tr>${JOURNAL.map((j, i) => `<tr><td><b>${i + 1}. ${esc(j[0])}</b><div class="note">${esc(j[3])}</div></td><td class="n">${j[1]}</td><td class="n">${j[2]}</td></tr>`).join('')}</table>
   <p class="note">Hasard : décisions tirées au sort. Avisé : règles de bon sens, et chaque choix d'événement simulé plusieurs fois avant de trancher.</p></section>
  <section class="folio"><h3 class="rub frak">Rejouer les simulations</h3><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
   <select id="bot" aria-label="Bot"><option value="heur">Bot avisé</option><option value="random">Bot hasard</option></select>
   <select id="nb" aria-label="Nombre de parties"><option>100</option><option selected>1000</option></select>
   <button class="btn" onclick="runLab()">Lancer les parties</button></div></section>${res}`;
}
function runLab() {
  const bot = $('bot').value, n = +$('nb').value;
  labRes = { n, done: 0, wins: 0, causes: {}, turns: 0, rulers: 0, botName: bot === 'heur' ? 'avisé' : 'hasard' };
  const base = (Math.random() * 1e6) | 0;
  (function chunk() {
    const end = Math.min(n, labRes.done + 20);
    for (; labRes.done < end; labRes.done++) { const s = Sim.playOne(base + labRes.done * 7919, bot); const c = s.result ? s.result.cause : 'timeout'; labRes.causes[c] = (labRes.causes[c] || 0) + 1; if (c === 'victoire') labRes.wins++; labRes.turns += s.turn; labRes.rulers += s.rulers.length; }
    if (tab === 'labo') render();
    if (labRes.done < n) setTimeout(chunk, 0);
  })();
}

// ---------- Déroulé d'un tour ----------
function snapshot() { return { or: S.gold, soldats: S.army, prestige: S.prestige, stabilité: S.stab, domaines: S.domains }; }
function raw() { return { gold: S.gold, army: S.army, prestige: S.prestige, domains: S.domains, stab: Math.max(0, S.stab), menace: S.menace }; }
function animateStatus(from, delay) {
  if (reduced || !from || (tab !== 'cour' && tab !== 'plateau')) return;
  if (from.gold < S.gold) setTimeout(() => SND.play('coin'), (delay || 0) + 100);
  const to = raw();
  const els = [...document.querySelectorAll('[data-k]')], gs = [...document.querySelectorAll('[data-g]')];
  els.forEach(el => { const k = el.dataset.k; if (from[k] !== to[k]) el.textContent = from[k]; });
  gs.forEach(el => { const k = el.dataset.g; if (from[k] !== to[k]) { el.style.transition = 'none'; el.style.width = Math.min(100, Math.max(0, from[k])) + '%'; } });
  setTimeout(() => {
    gs.forEach(el => { el.style.transition = 'width .9s cubic-bezier(.2,.8,.2,1)'; el.style.width = Math.min(100, Math.max(0, to[el.dataset.g])) + '%'; });
    els.forEach(el => {
      const k = el.dataset.k, a = from[k], b = to[k]; if (a === b) return;
      const t0 = performance.now(), D_ = 900;
      (function step(t) { const x = Math.min(1, (t - t0) / D_), e = 1 - Math.pow(1 - x, 3); el.textContent = Math.round(a + (b - a) * e); if (x < 1) requestAnimationFrame(step); })(t0);
      const f = document.createElement('span'); f.className = 'floatd ' + ((b - a > 0) !== (k === 'menace') ? 'pos' : 'neg'); f.textContent = (b > a ? '+' : '−') + Math.abs(b - a);
      el.parentElement.style.position = 'relative'; el.parentElement.appendChild(f); setTimeout(() => f.remove(), 1600);
      el.classList.add('bump'); setTimeout(() => el.classList.remove('bump'), 700);
    });
  }, delay || 0);
}
function seal(el, then) {
  if (reduced || !el) return then();
  const s = document.createElement('span'); s.className = 'seal'; s.innerHTML = A.icon('prestige', 22);
  el.appendChild(s); el.classList.add('chosen');
  setTimeout(then, 420);
}
function diff(a, b) { return Object.keys(a).map(k => ({ n: k, v: b[k] - a[k] })).filter(d => d.v); }
function act(id, ok, el, arg) {
  if (!ok || S.over || S.event || queue.length || busyTurn) return;
  if (id === 'construire') { closeM(); return setTimeout(() => buildMenu(arg), 60); }
  if (id === 'eduquer' && arg == null) { closeM(); return setTimeout(() => eduMenu(), 60); }
  if (id === 'recruter' && arg == null) { closeM(); return setTimeout(() => recruitMenu(), 60); }
  if (id === 'marier') return marryMenu();
  busyTurn = true; targetMode = false; selRegion = null;
  SND.play('seal');
  seal(el, () => { busyTurn = false; turn(id, arg); });
}
let busyTurn = false;
function takeFlashes() { const f = S.flashes || []; S.flashes = []; return f; }
function turn(id, a, b) {
  const before = S.log[S.log.length - 1], y0 = S.year, snap = snapshot(), from = raw();
  D.playTurn(S, id, a, b);
  news = S.log.slice(S.log.indexOf(before) + 1);
  if (S.aiMode && S.ai) { S.ai.pendingFacts = news.map(l => l.t); S.ai.ready = null; S.ai.story = (S.ai.story || []).concat({ y: y0, t: `Décision : ${id}.` }).slice(-12); }
  deltas = diff(snap, snapshot());
  pendingNews = (S.mapNews || []).slice(); S.mapNews = [];
  queue = takeFlashes();
  holdOwner = {}; for (const q of queue) if (q.type === 'battle' && q.region != null) holdOwner[q.region] = q.kind === 'invasion' ? 'me' : q.owner;
  if (S.event) queue.push({ type: 'event' });
  if (S.over) queue.push({ type: 'end' });
  save(); render(); scrollTo(0, 0);
  if (S.year !== y0) yearsPass(y0, S.year);
  animateStatus(from, S.year !== y0 ? 1150 : 0);
  setTimeout(nextQ, reduced || S.year === y0 ? 0 : 1300);
}
function nextQ() {
  closeM();
  if (Object.keys(holdOwner).length && !queue.some(q => q.type === 'battle')) { holdOwner = {}; }
  const q = queue.shift();
  if (!q) { render(); if (pendingNews) { mapToasts(pendingNews); pendingNews = null; } return; }
  if (q.type === 'battle' && !q.moved) { q.moved = true; return moveToken(q, () => showBattle(q)); }
  ({ event: showEvent, end: showEnd, era: showEra, succession: showSucc, ambition: showAmb, outcome: showOutcome, aiResult: showAiResult, battle: showBattle, vassal: showVassal, rivalDown: showRivalDown, mission: showMission, missionNew: showMissionNew })[q.type](q);
}
function yearsPass(a, b) {
  if (reduced) return;
  $('fx').innerHTML = `<div class="years"><div class="sand"><i></i></div><div class="r frak goldtext" id="yrR">${ROMAN(a)}</div><div class="a" id="yrA">${a}</div></div>`;
  let y = a; const iv = setInterval(() => { y++; SND.play('year', y - a); const R = $('yrR'), Aa = $('yrA'); if (!R) return clearInterval(iv); R.textContent = ROMAN(y); Aa.textContent = y === b ? `${b - a} années ont passé` : y; R.classList.remove('tick'); void R.offsetWidth; R.classList.add('tick'); if (y >= b) clearInterval(iv); }, 260);
  setTimeout(() => $('fx').innerHTML = '', 1350);
}
const ROBE = () => A.arms(S.house).robe;
function scn(kind, icon, hist, h, extra) { return `<div class="scn" style="--h:${h || 150}px">${SCENE.svg(kind, Object.assign({ flag: ROBE(), seed: S.year * 7 + kind.length, h: h || 150 }, extra || {}))}${icon ? `<div class="medal ${hist ? 'hist' : ''}">${A.icon(icon, 40)}</div>` : ''}</div>`; }
function sheet(html, dismiss, cls) {
  $('modal').innerHTML = `<div class="veil" ${dismiss ? 'onclick="if(event.target===this)closeM()"' : ''}><div class="sheet folio ${cls || ''}" role="dialog" aria-modal="true">${dismiss ? '<button class="sx" aria-label="Fermer" onclick="closeM()">✕</button>' : ''}${html}</div></div>`;
  const f = $('modal').querySelector('.choice,.btn'); if (f) f.focus({ preventScroll: true });
}
function closeM() { $('modal').innerHTML = ''; document.querySelectorAll('.coach').forEach(e => e.remove()); }
let marrySel = null;
const RANKLAB = (c) => {
  const F = c.sex === 'F';
  if (c.rank === 'prince') return `${F ? 'Princesse' : 'Prince'} de la maison ${esc(c.from.replace(/^d(e |')/, ''))}`;
  if (c.rank === 'rival') return `${F ? 'Princesse' : 'Prince'} de la maison rivale`;
  if (c.rank === 'noble') return `${F ? 'Dame' : 'Seigneur'} de la maison ${esc(c.from.replace(/^d(e |')/, ''))}`;
  if (c.rank === 'vassal') return `${F ? 'Fille' : 'Fils'} d'un vassal de ${esc(c.place)}`;
  return `${F ? 'Fille' : 'Fils'} d'un riche ${esc(c.trade || 'marchand')} de ${esc(c.place)}`;
};
function candFxLine(f) {
  const parts = [];
  if (f.gold) parts.push(`${f.gold > 0 ? '+' : '−'}${Math.abs(f.gold)} or`);
  if (f.prest) parts.push(`${f.prest > 0 ? '+' : '−'}${Math.abs(f.prest)} prestige`);
  if (f.stab) parts.push(`${f.stab > 0 ? '+' : '−'}${Math.abs(f.stab)} stabilité`);
  if (f.alliance) parts.push('+1 alliance');
  if (f.menace) parts.push(`${f.menace > 0 ? '+' : '−'}${Math.abs(f.menace)} menace`);
  return fx(parts.join(', '));
}
function marryMenu(pid) {
  const list = D.unmarriedAdults(S);
  if (!list.length) return;
  const p = list.find(x => x.id === pid) || list.find(x => x.id === marrySel) || list.find(x => x.id === S.rulerId) || list[0];
  marrySel = p.id;
  const market = D.marriageMarket(S, p);
  save();
  const head = list.length > 1 ? `<div class="whom">${list.map(q => `<button aria-pressed="${q.id === p.id}" onclick="marryMenu(${q.id})">${mini(q, 34)}<span>${esc(q.name)}<br><small>${ANS(D.age(S, q))}</small></span></button>`).join('')}</div>` : '';
  sheet(`<h2 class="frak">Marier ${esc(p.title || p.name)}</h2><p class="center note" style="margin:2px 0 10px">${ANS(D.age(S, p))}. Voici les partis libres en ${S.year}. Ils changent à chaque période.</p>${head}
   ${market.map((c, i) => {
     const f = D.candidateFx(S, p, c), cp = Object.assign({ id: 'cand' }, c, { alive: true, inDyn: false });
     const ag = S.year - c.born, T = D.TEMPERS[c.temper];
     const warn = S.prestige < c.req ? `Exige ${c.req} de prestige (vous : ${S.prestige}).` : (S.gold + Math.min(0, D.RANKS[c.rank].gold) < 0 ? 'Le trésor ne peut payer les noces.' : '');
     return `<div class="cand2 ${f.ok ? '' : 'off'}"><div class="ch">${portrait(cp, 64)}${['prince', 'noble', 'rival'].includes(c.rank) ? `<span class="hs">${A.shieldSVG(c.from, 20)}</span>` : ''}</div>
      <div class="cb"><b>${esc(c.name)}</b>, ${ANS(ag)}<div class="rk">${RANKLAB(c)}</div>
       <div class="traits">${c.traits.map(t => `<button class="t${D.TRAITS[t].g}" onclick="event.stopPropagation();traitInfo('${t}')">${D.TRAITS[t].n}</button>`).join('') || '<span class="t0">Sans trait marquant</span>'}</div>
       <div class="id">${T ? T.n : ''}, aime ${esc(c.passion)} ; ${esc(c.mark)}.</div>
       <div class="fx">${candFxLine(f)}</div>${f.leaves ? `<div class="note" style="margin:2px 0 0">${p.sex === 'F' ? 'Elle' : 'Il'} quittera la cour pour ${esc(c.place)}.</div>` : ''}
       ${warn ? `<div class="k-bad" style="font-size:14px">${warn}</div>` : `<button class="btn sm" onclick="closeM();turn('marier',${p.id},${i})">Demander sa main</button>`}</div></div>`;
   }).join('')}
   <p class="center" style="margin:14px 0 0"><button class="btn alt" onclick="closeM()">Annuler</button></p>`, true);
}
function showEvent() {
  const e = S.event; SND.play(e.hist ? 'hist' : 'event');
  sheet(`${scn(SCENE.of(e.id), A.EVENT_ICON[e.id] || 'plume', e.hist)}${e.hist ? '<div class="histlab sc">Événement historique</div>' : e.chain ? `<div class="histlab sc">${e.id === 'choix_regent' || e.id === 'usurpation' ? 'Régence' : 'La suite du récit'}</div>` : ''}<h2 class="frak">L'an ${ROMAN(S.year)}</h2>
  <p class="story">${esc(e.text)}</p>${e.choices.map((c, i) => `<button class="choice stag" style="--i:${i}" onclick="choose(${i})"><span class="nm">${esc(c.l)}</span><span class="fx">${fx(c.d)}</span></button>`).join('')}`);
}
function choose(i) {
  const before = S.log[S.log.length - 1], snap = snapshot(), id = S.event.id, hist = S.event.hist, from = raw();
  D.resolveEvent(S, i);
  const nw = S.log.slice(S.log.indexOf(before) + 1);
  news = news.concat(nw);
  const d2 = diff(snap, snapshot());
  for (const d of d2) { const x = deltas.find(y => y.n === d.n); if (x) x.v += d.v; else deltas.push({ ...d }); }
  deltas = deltas.filter(d => d.v);
  const fl = takeFlashes();
  const extra = nw.filter(l => !/→/.test(l.t)).map(l => l.t);
  queue = [{ type: 'outcome', id, hist, d: d2, extra }, ...fl, ...queue];
  if (S.over && !queue.some(q => q.type === 'end')) queue.push({ type: 'end' });
  save(); render(); animateStatus(from, 200); nextQ();
}
function showOutcome(q) {
  SND.play('page');
  const o = S.lastOutcome || { choice: '', text: '' };
  sheet(`${scn(SCENE.of(q.id), A.EVENT_ICON[q.id] || 'plume', q.hist, 96)}<h2 class="frak">${esc(o.choice)}</h2>
   <p class="story center">${esc(o.text)}</p>${q.extra.map(t => `<p class="center k-bad">${esc(t)}</p>`).join('')}<div class="center">${pills(q.d) || '<span class="note">Aucun effet immédiat.</span>'}</div>
   <p class="center" style="margin:16px 0 0"><button class="btn" onclick="nextQ()">Continuer</button></p>`);
}
function showBattle(q) {
  SND.play('battle', q.won);
  const inv = q.kind === 'invasion', tot = Math.max(1, q.ours + q.enemy);
  const cap = x => x.charAt(0).toUpperCase() + x.slice(1);
  const foeName = q.rival ? 'Maison ' + S.rival : cap(inv ? q.tgt : q.tgt.replace(/^(le|la|les|une|un) /, ''));
  const foeArms = q.rival ? S.rival : q.tgt;
  const verdict = q.won ? (inv ? 'Invasion repoussée' : 'Victoire') : (inv ? 'Le pays est ravagé' : 'Défaite');
  const res = [q.loss ? { n: 'soldats', v: -q.loss } : null, !inv && q.won ? { n: 'domaine', v: 1 } : null, inv && !q.won ? { n: 'domaine', v: -1 } : null].filter(Boolean);
  const foeRobe = q.rival ? A.arms(S.rival).robe : A.arms(q.tgt).robe;
  sheet(`<div class="scn bscn" style="--h:170px">${SCENE.svg('bataille', { flag: ROBE(), foe: foeRobe, seed: S.year, h: 170 })}<div class="sc btitle">${inv ? 'Invasion' : 'Campagne'} de l'an ${ROMAN(S.year)}</div>
   <div class="battle ${q.won ? 'won' : 'lost'}">
    <div class="side us">${A.shieldSVG(S.house, 66)}<b>Votre ost</b></div>
    <div class="clash"><span class="burst"></span>${A.icon('epees', 46)}</div>
    <div class="side them">${A.shieldSVG(foeArms, 66)}<b>${esc(foeName)}</b></div>
   </div></div>
   ${q.kind === 'campagne' || q.kind === 'invasion' ? `<div class="btroops">${(() => { const t = D.troopCounts(S); return ['chevaliers', 'archers', 'pietons'].map(k => `<span>${troopSVG(k, 30)}<b>${t[k]}</b></span>`).join(''); })()}</div>` : ''}
   <div class="forces"><i class="fu" style="--w:${q.ours / tot * 100}%"></i><i class="ft" style="--w:${q.enemy / tot * 100}%"></i></div>
   <div class="forces-l"><span>Votre force ${q.ours}</span><span>Adversaire ${q.enemy}</span></div>
   ${q.tactic && D.TACTICS[q.tactic] ? `<p class="center tacl">${D.TACTICS[q.tactic].n} contre une garnison qui ${D.STANCES[q.stance].n} : ${D.tacticMult(S, q.tactic, q.stance) > 1.05 ? 'le bon choix' : D.tacticMult(S, q.tactic, q.stance) < 0.95 ? 'un mauvais choix' : 'un choix sans surprise'}.</p>` : ''}
   <h2 class="frak verdict ${q.won ? 'vw' : 'vl'}">${verdict}</h2>
   <p class="center story" style="margin:4px 0 8px">${inv ? (q.won ? `${esc(q.tgt)} se brise sur vos murailles.` : `${esc(q.tgt)} s'empare d'un domaine.`) : (q.won ? `Vos bannières flottent sur ${esc(q.tgt)}.` : `L'ost recule devant ${esc(q.tgt)}.`)}</p>
   <div class="center vres">${pills(res)}</div>
   <p class="center vres" style="margin:14px 0 0"><button class="btn" onclick="nextQ()">Continuer</button></p>`, false, 'bsheet');
}
function showVassal(q) {
  SND.play(q.won ? 'glory' : 'loss');
  const R = S.regions[q.region];
  sheet(`${scn('cour', null, false, 110)}<div class="center" style="margin-top:-52px;position:relative">${A.shieldSVG(q.lord, 60)}</div>
   <h2 class="frak" style="font-size:28px;color:${q.won ? 'var(--verd)' : 'var(--verm)'}">${q.won ? 'Hommage prêté' : 'Hommage refusé'}</h2>
   <p class="story center">${q.won ? `Le seigneur de la maison ${esc(q.lord.replace(/^d(e |')/, ''))} met ses mains dans celles de votre souverain. ${esc(R.name)} rejoint votre maison.` : `Le seigneur de la maison ${esc(q.lord.replace(/^d(e |')/, ''))} garde vos présents et ferme ses portes.`}</p>
   <div class="center">${pills([{ n: 'or', v: -q.cost }].concat(q.won ? [{ n: 'domaine', v: 1 }, { n: 'prestige', v: 4 }] : [{ n: 'prestige', v: -3 }]))}</div>
   <p class="center" style="margin:14px 0 0"><button class="btn" onclick="nextQ()">Continuer</button></p>`);
}
function showRivalDown() {
  SND.play('crown');
  sheet(`${scn('bataille', null, false, 120, { foe: A.arms(S.rival).robe })}<div class="center" style="margin-top:-52px;position:relative">${A.shieldSVG(S.rival, 66)}</div>
   <h2 class="frak" style="font-size:30px">La maison ${esc(S.rival)} est anéantie</h2>
   <p class="story center">Sa dernière terre est tombée. Votre rivale de toujours n'est plus qu'un nom dans les chroniques, et ses ennemis d'hier viennent vous saluer.</p>
   <div class="center">${pills([{ n: 'prestige', v: 30 }])}</div>
   <p class="center" style="margin:14px 0 0"><button class="btn" onclick="nextQ()">Continuer</button></p>`);
}
function mapToasts(list) {
  if (!list || !list.length || tab !== 'plateau') return;
  const box = document.createElement('div'); box.className = 'toasts';
  box.innerHTML = list.map((n, k) => `<div class="toast ${n.k}" style="animation-delay:${k * 0.25}s">${esc(n.t)}</div>`).join('');
  document.body.appendChild(box); setTimeout(() => box.remove(), 6500 + list.length * 400);
}
function showEra(q) {
  SND.play('era');
  const E = D.ERAS[q.era], unlock = q.era === 1 ? 'Nouvelle décision : le pèlerinage.' : q.era === 2 ? 'Nouvelle décision : engager des mercenaires.' : '';
  sheet(`${scn(['chateau', 'eglise', 'peste'][q.era], null, false, 130)}<div class="eraorn" style="margin-top:-34px;position:relative">${A.shieldSVG(S.house, 50)}</div><div class="sc center" style="color:var(--ink2)">${ROMAN(E.from)} – ${ROMAN(E.from + 50)}</div>
   <h2 class="frak" style="font-size:36px;color:var(--lapis)">${E.name}</h2><p class="story">${esc(E.desc)}</p>${unlock ? `<p class="center"><b>${unlock}</b></p>` : ''}
   <p class="center" style="margin:14px 0 0"><button class="btn" onclick="nextQ()">Entrer dans cet âge</button></p>`, false, 'era');
}
function showSucc(q) {
  SND.play('toll'); SND.play('crown');
  const old = S.people[q.old], nu = S.people[q.nu], a = S.amb && S.rulerId === nu.id ? D.AMBITIONS[S.amb.k] : null;
  sheet(`${scn('chateau', null, false, 90, { seed: 3 })}<h2 class="frak" style="font-size:30px">${old.sex === 'M' ? 'Le roi est mort' : 'La reine est morte'}…</h2>
   <div class="succ"><div class="old"><span class="niche">${portrait(old, 92)}</span><b>${esc(FN(old))}</b><small>${old.ruledFrom} – ${old.died}<br>${esc(old.cause)}</small></div>
   <div class="arrow frak">⁂</div>
   <div class="new"><span class="halo"></span><span class="niche">${portrait(nu, 92)}</span><b>${esc(nu.title)}</b><small>${ANS(D.age(S, nu))}</small></div></div>
   <h2 class="frak" style="font-size:26px;margin-top:8px">…${nu.sex === 'M' ? 'vive le roi' : 'vive la reine'} !</h2>
   ${q.crisis ? '<p class="center k-bad">Succession contestée : la couronne passe à une branche cadette.</p>' : ''}${q.regency ? '<p class="center k-bad">Le souverain est mineur : une régence gouverne.</p>' : ''}
   ${a ? `<p class="center">Son ambition : <b>${esc(a.goal.toLowerCase())}</b>.</p>` : ''}
   <p class="center" style="margin:14px 0 0"><button class="btn" onclick="nextQ()">Que son règne soit long</button></p>`);
}
function showAmb(q) {
  SND.play('glory');
  const p = S.people[q.id], A_ = D.AMBITIONS[q.k];
  sheet(`<div class="rayw"><div class="rays"></div><div class="medal hist">${A.icon('prestige', 46)}</div>${[0,1,2,3,4,5,6,7].map(i => `<i class="spark" style="--a:${i * 45}deg"></i>`).join('')}</div><div class="histlab sc">Ambition accomplie</div>
   <div class="center" style="margin:10px 0"><span class="niche">${portrait(p, 84)}</span></div>
   <h2 class="frak" style="font-size:30px;color:var(--lapis)">${esc(p.title)} ${esc(p.epithet || '')}</h2>
   <p class="story center">${esc(A_.goal)} : c'est fait. Les chroniqueurs l'appelleront désormais ${esc(p.epithet || '')}.</p>
   <div class="center">${pills([{ n: 'prestige', v: 12 }, { n: 'stabilité', v: 6 }])}</div>
   <p class="center" style="margin:14px 0 0"><button class="btn" onclick="nextQ()">Continuer</button></p>`);
}
function who(id) {
  const p = S.people[id]; if (!p) return;
  const sp = p.spouse ? D.person(S, p.spouse) : null, par = p.parent != null ? S.people[p.parent] : null, oth = p.other != null ? S.people[p.other] : null;
  const kids = Object.values(S.people).filter(k => k.parent === id || k.other === id).sort((x, y) => x.born - y.born);
  const T = D.TEMPERS[p.temper];
  const alive = p.alive !== false, ag = alive ? D.age(S, p) : p.died - p.born;
  const status = p.id === S.rulerId ? 'Souverain' + (p.sex === 'F' ? 'e' : '') : !alive ? 'Défunt' + (p.sex === 'F' ? 'e' : '') : p.leftAt ? `Mariée chez ${esc(p.husband || 'une autre maison')}` : p.inDyn ? 'De la maison ' + esc(S.house) : p.from === 'vassal' ? 'Issu' + (p.sex === 'F' ? 'e' : '') + ' d\'un vassal' : p.from === 'marchand' ? 'Issu' + (p.sex === 'F' ? 'e' : '') + ' d\'une famille marchande' : 'De la maison ' + esc(p.from || '');
  const L = alive && p.loyal != null && p.id !== S.rulerId && ag >= 14 ? LOY(p.loyal) : null;
  const link = q => q ? `<button class="plink" onclick="who(${q.id})">${mini(q, 30)}<span>${esc(FN(q))}${q.alive === false ? ' ✝' : ''}</span></button>` : '';
  sheet(`<div class="fiche-h"><span class="niche">${portrait(p, 96)}</span><div><h2 class="frak">${esc(FN(p))}</h2><div class="st">${status}</div>
     <div class="st">${alive ? `${ANS(ag)}, né${p.sex === 'F' ? 'e' : ''} à ${esc(p.place || '?')}` : `${p.born} – ${p.died}, ${esc(p.cause || '')}`}</div></div></div>
   ${L ? `<div class="loy"><span>Loyauté envers la couronne : <b class="${L[1]}">${L[0]}</b></span><div class="bar"><i style="width:${p.loyal}%"></i></div></div>` : ''}
   <dl class="ident">
    ${T ? `<dt>Tempérament</dt><dd><b>${T.n}</b> : ${T.desc}</dd>` : ''}
    ${p.passion ? `<dt>Passion</dt><dd>${esc(p.passion)}</dd>` : ''}
    ${p.mark ? `<dt>Signe distinctif</dt><dd>${esc(p.mark)}</dd>` : ''}
    <dt>Traits</dt><dd>${p.traits.map(t => `<span class="t${D.TRAITS[t].g}"><b>${D.TRAITS[t].n}</b></span> : ${esc(D.TRAITS[t].desc)}`).join('<br>') || 'aucun trait marquant'}</dd>
   </dl>
   ${(par || oth || sp || kids.length) ? `<div class="links">${par || oth ? `<div><span class="sc">Parents</span>${link(par)}${link(oth)}</div>` : ''}${sp ? `<div><span class="sc">Conjoint</span>${link(sp)}</div>` : ''}${kids.length ? `<div><span class="sc">Enfants</span>${kids.map(link).join('')}</div>` : ''}</div>` : ''}
   ${p.bio && p.bio.length ? `<div class="bio"><span class="sc">Sa vie</span>${p.bio.map(b => `<p><span>${b.y}</span>${esc(b.t)}</p>`).join('')}</div>` : ''}
   <p class="center" style="margin:14px 0 0"><button class="btn alt" onclick="closeM()">Fermer</button></p>`, true);
}
function traitInfo(t) { const T = D.TRAITS[t]; sheet(`<h2 class="frak">${T.n}</h2><p class="story center">${esc(T.desc)}</p><p class="center"><button class="btn alt" onclick="closeM()">Fermer</button></p>`, true); }
const TITLES = [
  ['unifie', 'Le Rassembleur', 'Unifier le royaume', s => s.unified],
  ['rival', 'Le Fléau', 'Anéantir la maison rivale', s => s.rivalDown],
  ['empire', 'Empire légendaire', 'Finir avec 850 points ou plus', s => s.result && s.result.won && s.result.score >= 850],
  ['tenir', 'Jusqu\'au bout', 'Tenir jusqu\'en 1350', s => s.result && s.result.cause === 'victoire'],
  ['dynastie', 'Les Cinq Couronnes', 'Voir régner 5 souverains', s => s.rulers.length >= 5],
  ['ambitions', 'Les Épithètes', 'Accomplir 3 ambitions', s => (s.stats.ambitions || 0) >= 3],
  ['batisseur', 'Maître d\'œuvre', 'Posséder 6 édifices', s => s.builds >= 6],
  ['cathedrale', 'La Flèche de pierre', 'Achever une cathédrale', s => s.cathedral],
  ['suzerain', 'Le Suzerain', 'Recevoir 4 hommages', s => (s.stats.vassals || 0) >= 4],
  ['bouclier', 'Le Rempart', 'Repousser 4 invasions', s => (s.stats.invRepelled || 0) >= 4],
  ['conseil', 'Le Bon Conseil', 'Finir avec les trois charges pourvues', s => Object.keys(s.council || {}).length >= 3],
  ['amis', 'L\'Ami des princes', 'Être en amitié fidèle avec une maison voisine', s => Object.values(s.houses || {}).some(h => h.rel >= 60)],
];
async function reportBug(b) { const sm = b && b.querySelector('small'); if (sm) sm.textContent = 'Envoi…'; const ok = await TK.signaler(); if (sm) sm.textContent = ok ? 'Merci : signalement envoyé à Claude.' : 'Enregistré sur cet appareil (envoi en ligne indisponible).'; }
// ---------- Mode test : partie à part (graine fixe, aucune sauvegarde), compteur d'images, banc de mesure ----------
function startTest() {
  TEST = true; view = null; S = D.createGame(1234); S.ai = { story: [], pendingFacts: [], suggestions: [] }; news = []; deltas = []; queue = []; tab = 'plateau'; S.flashes = [];
  try { localStorage.setItem('cl_guide', '1'); } catch (e) {}
  closeM(); render(); TK.modeTest();
  if (TK.ov && !TK.ov.querySelector('button')) { TK.ov.style.pointerEvents = 'auto'; TK.ov.insertAdjacentHTML('beforeend', ' <button id="tkb" style="font:12px sans-serif">▶ Banc</button> <button id="tkr" style="font:12px sans-serif">🐞</button>'); $('tkb').onclick = runBench; $('tkr').onclick = () => TK.signaler(); }
}
async function runBench() {
  const wait = ms => new Promise(r => setTimeout(r, ms)), b = $('tkb'); if (b) b.textContent = '…';
  const res = await TK.banc([
    { nom: 'carte', preparer: async () => { closeM(); setTab('plateau'); fitView && fitView(); } },
    { nom: 'carte-zoom', preparer: async () => { setTab('plateau'); let k = 0; clearInterval(window._bz); window._bz = setInterval(() => { zoomAt(k++ % 20 < 10 ? 1.06 : 1 / 1.06, innerWidth / 2, innerHeight / 2); }, 60); } },
    { nom: 'bataille', preparer: async () => { clearInterval(window._bz); const i = D.borderTargets(S)[0].i; S.army = 80; showBattle({ won: true, kind: 'campagne', tgt: S.regions[i].name, region: i, ours: 90, enemy: 40, loss: 8, tactic: 'siege', stance: 'retranche' }); } },
    { nom: 'cour', preparer: async () => { closeM(); setTab('cour'); let y = 0; clearInterval(window._bz); window._bz = setInterval(() => scrollTo(0, (y += 40) % 3000), 50); } },
  ], 4000);
  clearInterval(window._bz);
  // temps de calcul + affichage d'un tour complet
  const t0 = performance.now(); let n = 0; setTab('plateau');
  while (n < 20 && !S.over) { D.playTurn(S, 'attendre'); if (S.event) D.resolveEvent(S, 0); render(); n++; }
  res.tour_ms = +((performance.now() - t0) / Math.max(1, n)).toFixed(1);
  if (b) b.textContent = '▶ Banc';
  sheet(`<h2 class="frak">Banc de mesure</h2><div class="deeds">${res.res.map(r => `<p><em>${esc(r.scene)}</em>${r.fps || '–'} img/s · pire ${r.pire || '–'} ms</p>`).join('')}<p><em>tour</em>${res.tour_ms} ms par tour (calcul + affichage)</p></div><p class="center note">${res.enregistre ? 'Résultats envoyés à Claude.' : 'Résultats gardés sur cet appareil.'}</p><p class="center"><button class="btn alt" onclick="closeM()">Fermer</button></p>`, true);
  if (res.enregistre === false) TK.envoyer('mesures_' + Date.now(), res);
}
function titlesGot() { try { return JSON.parse(localStorage.getItem('cl_titles') || '{}'); } catch (e) { return {}; } }
function unlockTitles() {
  if (S._titlesDone) return S._titlesDone;
  const got = titlesGot(), nu = [];
  for (const [k, n, d, f] of TITLES) { let ok = false; try { ok = !!f(S); } catch (e) {} if (ok && !got[k]) { got[k] = { y: S.year, h: S.house }; nu.push(k); } }
  try { localStorage.setItem('cl_titles', JSON.stringify(got)); } catch (e) {}
  S._titlesDone = nu; save(); return nu;
}
function titlesSheet() {
  SND.play('tap'); const got = titlesGot(), n = Object.keys(got).length;
  sheet(`<h2 class="frak">Titres de gloire</h2><p class="center story" style="margin:2px 0 10px">${n} sur ${TITLES.length}. Ils se gagnent d'une partie à l'autre et restent acquis.</p>
   <div class="titles">${TITLES.map(([k, nm, d]) => `<div class="ttl ${got[k] ? 'got' : ''}"><span class="tm">${A.icon(got[k] ? 'prestige' : 'astres', 22)}</span><div><b>${got[k] ? nm : '???'}</b><small>${d}${got[k] ? ` · maison ${esc(HN(got[k].h))}, ${got[k].y}` : ''}</small></div></div>`).join('')}</div>
   <p class="center" style="margin:12px 0 0"><button class="btn alt" onclick="closeM()">Fermer</button></p>`, true);
}
function deeds() {
  const keep = S.log.filter(l => l.k === 'big' || (l.k === 'good' && /Victoire|hommage|unifié|accompli|cathédrale|repouss/i.test(l.t))).filter(l => !/mandement :|commence\.|maison rivale|Au-delà des marches/.test(l.t));
  const pick = []; const step = Math.max(1, Math.floor(keep.length / 7)); for (let i = 0; i < keep.length && pick.length < 7; i += step) pick.push(keep[i]);
  return pick.length ? `<div class="deeds"><h3 class="sc">Hauts faits de la maison</h3>${pick.map(l => `<p><em>${ROMAN(l.y || S.year)}</em>${esc(l.t)}</p>`).join('')}</div>` : '';
}
function showEnd() {
  const r = S.result, st = S.stats; SND.play('end', r.won);
  const T = { victoire: 'Victoire', unification: 'Royaume unifié', extinction: 'Extinction', revolte: 'Déposition', conquete: 'Conquête' };
  sheet(`${scn(r.won ? 'chateau' : 'peste', null, false, 120)}<div class="center" style="margin-top:-46px;position:relative">${A.shieldSVG(S.house, 74)}</div><h2 class="frak" style="font-size:34px">${T[r.cause]}</h2>
  <p class="story">${esc(r.msg)}</p>
  ${r.epi ? `<div class="epi"><div class="sc">${esc(r.epi.t)}</div><p>${esc(r.epi.d)}</p><p class="apres">${esc(r.epi.apres)}</p></div>` : ''}
  <div class="center"><div class="frak" style="font-size:52px;color:var(--lapis);line-height:1">${r.score}</div><div class="sc" style="color:var(--ink2)">${r.won ? D.rank(r.score) : 'Une lignée oubliée'}</div></div>
  <div class="kings" style="margin-top:12px">${S.rulers.map(id => { const p = S.people[id]; return `<div>${mini(p, 44)}<b>${esc(p.title)}</b><span>${esc(p.epithet || '')}</span></div>`; }).join('')}</div>
  <div class="facts"><div><span>Années</span><b>${S.year - S.P.startYear}</b></div><div><span>Domaines</span><b>${S.domains}</b></div><div><span>Ambitions</span><b>${st.ambitions || 0}</b></div><div><span>Naissances</span><b>${st.births}</b></div><div><span>Guerres gagnées</span><b>${st.warsWon}/${st.wars}</b></div><div><span>Invasions repoussées</span><b>${st.invRepelled}/${st.invasions}</b></div></div>
  ${(() => { const nu = unlockTitles(); return nu.length ? `<div class="newt"><div class="sc">Titre${nu.length > 1 ? 's' : ''} de gloire débloqué${nu.length > 1 ? 's' : ''}</div>${nu.map(k => { const T = TITLES.find(t => t[0] === k); return `<button onclick="titlesSheet()">${A.icon('prestige', 18)} <b>${T[1]}</b> <small>${T[2]}</small></button>`; }).join('')}</div>` : ''; })()}
  ${deeds()}
  <div style="margin-top:12px">${chartSVG(S.hist)}</div>
  <p class="note">Pour comparer : le bot avisé gagne environ 78 % de ses parties, avec 700 à 800 points. <button class="linkb" onclick="titlesSheet()">Voir les titres de gloire</button></p>
  <p style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:6px 0 0"><button class="btn" onclick="closeM();newGame()">Fonder une nouvelle maison</button><button class="btn alt" onclick="closeM();setTab('chronique')">Lire la chronique</button></p>`);
}
function setTab(t) { document.querySelectorAll('.toasts').forEach(e => e.remove()); if (document.querySelector('.coach')) { document.querySelectorAll('.coach').forEach(e => e.remove()); try { localStorage.setItem('cl_guide', '1'); } catch (e) {} } tab = t; render(); scrollTo(0, 0); }
const TABS = [['plateau', 'domaine', 'Royaume'], ['cour', 'construire', 'Cour'], ['lignee', 'marier', 'Lignée'], ['chronique', 'plume', 'Chronique'], ['labo', 'fiole', 'Labo']];
function pageNav() {
  const items = [['cour', 'La cour'], ['lignee', 'Lignée'], ['chronique', 'Chronique'], ['labo', 'Labo']];
  return `<nav class="pnav"><button class="back" onclick="setTab('plateau')">${A.icon('domaine', 20)}<span>Royaume</span></button><div class="pseg">${items.map(([k, l]) => `<button ${tab === k ? 'aria-current="page"' : ''} onclick="setTab('${k}')">${l}</button>`).join('')}</div></nav>`;
}
function render() {
  if (tab === 'royaume') tab = 'plateau';
  document.body.classList.toggle('onboard', tab === 'plateau');
  document.body.classList.toggle('immersive', tab === 'plateau');
  document.body.classList.toggle('darkpages', tab !== 'plateau');
  $('app').innerHTML = (tab === 'plateau' ? '' : pageNav()) + { plateau: viewPlateau, cour: viewCour, lignee: viewLignee, chronique: viewChronique, labo: viewLabo }[tab]();
  const ti = TABS.findIndex(t => t[0] === tab);
  if (!$('tabs').querySelector('.tabbar')) $('tabs').innerHTML = `<span class="tabbar"></span>` + TABS.map(([k, i, l]) => `<button data-t="${k}" onclick="setTab('${k}')">${A.icon(i, 24)}${l}</button>`).join('');
  $('tabs').querySelectorAll('button').forEach(b => b.toggleAttribute('aria-current', b.dataset.t === tab));
  $('tabs').querySelectorAll('button[aria-current]').forEach(b => b.setAttribute('aria-current', 'page'));
  $('tabs').querySelector('.tabbar').style.transform = `translateX(${ti * 100}%)`;
  $('minibar').innerHTML = miniBar(); onScroll();
  if (tab === 'plateau') wireMap();
}
function onScroll() { $('minibar').classList.toggle('on', tab === 'cour' && scrollY > 240); }
let tabInit = false;
addEventListener('scroll', onScroll, { passive: true });
async function cloudResume() {
  const d = await CLOUD.load(); if (!d) return;
  let c; try { c = JSON.parse(d.s); } catch (e) { return; }
  if (!c || !c.rulers || (S && (S.savedAt || 0) >= (c.savedAt || 0)) || TEST) return;
  sheet(`<h2 class="frak">Partie en ligne</h2><p class="story center">Une partie plus récente de la maison ${esc(c.house)} (an ${c.year}) a été jouée sur un autre appareil.</p><p class="center"><button class="btn" onclick="resumeCloud()">La reprendre</button> <button class="btn alt" onclick="closeM()">Garder celle-ci</button></p>`, true);
  window._cloudS = d.s;
}
function resumeCloud() { try { localStorage.setItem(SAVE, window._cloudS); } catch (e) {} location.reload(); }
function boot() {
  initAI();
  S = load();
  setTimeout(cloudResume, 300);
  try {
    if (!S) newGame(); else { tab = S.aiMode ? 'cour' : 'plateau'; news = []; render(); if (S.event) { queue = [{ type: 'event' }]; nextQ(); } else if (S.over) showEnd(); }
  } catch (e) {
    // sauvegarde illisible : on repart proprement plutôt que d'afficher une page vide
    try { localStorage.removeItem(SAVE); localStorage.removeItem('cl_save3'); } catch (_) {}
    newGame();
    sheet(`<h2 class="frak">Nouvelle maison</h2><p class="story center">L'ancienne partie venait d'une version précédente du jeu et n'a pas pu être reprise. Une nouvelle maison est fondée.</p><p class="center"><button class="btn" onclick="closeM()">Commencer</button></p>`, true);
  }
}
boot();
