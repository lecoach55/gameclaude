'use strict';
/* =========================================================
   SEDES PETRI — interface
   ========================================================= */
const UI = { tab: 'pontife', sel: null, sound: true, busy: false, curiaSort: 'loyal' };
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmt = n => Math.round(n).toLocaleString('fr-FR');
const sgn = n => (n >= 0 ? '+' : '−') + Math.abs(Math.round(n));
const bar = (v, cls, max) => `<div class="bar ${cls || ''}"><i style="width:${clamp(v / (max || 100) * 100, 0, 100)}%"></i></div>`;
const NAT_FLAG = n => `<span class="nat" style="background:${NAT_COLOR[n]}">${NAT_LABEL[n]}</span>`;

/* ---------- Son ---------- */
let AC = null;
function audio() { if (!UI.sound) return null; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); return AC; } catch (e) { return null; } }
function sfx(k) {
 const a = audio(); if (!a) return; const t = a.currentTime;
 const tone = (f, d, v, type, at) => { const o = a.createOscillator(), g = a.createGain(); o.type = type || 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, t + (at || 0)); g.gain.linearRampToValueAtTime(v, t + (at || 0) + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + (at || 0) + d); o.connect(g); g.connect(a.destination); o.start(t + (at || 0)); o.stop(t + (at || 0) + d + 0.05); };
 if (k === 'bell') { [[196, 3.2, .16], [392, 2.4, .08], [466, 1.8, .05], [587, 1.4, .04], [784, 1, .02]].forEach(([f, d, v]) => tone(f, d, v)); }
 if (k === 'chord') { [[220, 2.2, .05, 'triangle'], [277, 2.2, .04, 'triangle'], [330, 2.2, .04, 'triangle'], [440, 2.4, .03, 'sine']].forEach(([f, d, v, ty]) => tone(f, d, v, ty)); }
 if (k === 'click') tone(880, 0.08, 0.04, 'triangle');
 if (k === 'seal') { tone(140, 0.25, 0.12, 'sine'); tone(90, 0.3, 0.08, 'sine', 0.02); }
 if (k === 'gold') { [523, 659, 784, 1046].forEach((f, i) => tone(f, 1.2, .05, 'triangle', i * 0.12)); }
 if (k === 'bad') { tone(110, 1.4, .08, 'sawtooth'); tone(116, 1.4, .05, 'sawtooth'); }
}

/* ---------- Musique : plain-chant généré ---------- */
let MUS = null;
function startMusic() {
 const a = audio(); if (!a || MUS) return;
 const g = a.createGain(); g.gain.value = 0.055; const dl = a.createDelay(); dl.delayTime.value = 0.42; const fb = a.createGain(); fb.gain.value = 0.38; g.connect(a.destination); g.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(a.destination);
 const dr = [110, 165].map(f => { const o = a.createOscillator(); o.type = 'sine'; o.frequency.value = f; const og = a.createGain(); og.gain.value = 0.22; o.connect(og); og.connect(g); o.start(); return o; });
 const scale = [146.8, 164.8, 174.6, 196, 220, 246.9, 261.6, 293.7, 329.6];
 let idx = 4; MUS = { g, dr, timer: null };
 const tick = () => {
  if (!MUS) return; const t = a.currentTime; idx = clamp(idx + pick([-2, -1, -1, 0, 1, 1, 2, -1, 1]), 0, scale.length - 1); if (chance(0.15)) idx = 4;
  const dur = pick([0.8, 0.8, 1.2, 1.6, 2.4]);
  [[scale[idx], 0.5], [scale[idx] * 2 / 3, 0.22]].forEach(([f, v]) => { const o = a.createOscillator(); o.type = 'triangle'; o.frequency.value = f; const og = a.createGain(); const fl = a.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 1100; og.gain.setValueAtTime(0, t); og.gain.linearRampToValueAtTime(v, t + 0.22); og.gain.setValueAtTime(v, t + dur * 0.7); og.gain.linearRampToValueAtTime(0.0001, t + dur); o.connect(fl); fl.connect(og); og.connect(g); o.start(t); o.stop(t + dur + 0.05); });
  MUS.timer = setTimeout(tick, dur * 1000 + (chance(0.12) ? 1600 : 0));
 };
 tick();
}
function stopMusic() { if (!MUS) return; clearTimeout(MUS.timer); MUS.dr.forEach(o => { try { o.stop(); } catch (e) { } }); try { MUS.g.disconnect(); } catch (e) { } MUS = null; }

/* ---------- Palmarès ---------- */
function hof() { try { return JSON.parse(localStorage.getItem('sp_hof') || '[]'); } catch (e) { return []; } }
function hofAdd() { try { const h = hof(); h.push({ s: S.scen, g: glory(), p: S.popes.length + 1, y: S.year, a: Object.keys(S.ach).length, r: S.over.reason, f: popeName() }); h.sort((a, b) => b.g - a.g); localStorage.setItem('sp_hof', JSON.stringify(h.slice(0, 10))); } catch (e) { } }

/* ---------- Démarrage ---------- */
function boot() {
 $('#ldArms').innerHTML = papalArms(110);
 setTimeout(() => {
  const t0 = performance.now();
  try { MAP.gen = buildMapGen(); MAP.gen.next(); } catch (e) { console.error(e); MAP.gen = null; computeFallbackAdj(); } // terre + vagues
  $('#loading').classList.add('gone'); setTimeout(() => $('#loading').hidden = true, 600);
  startScreen();
  // le reste de la carte se construit pendant que le joueur lit l'accueil
  setTimeout(() => mapEnFond(() => { window.__tCarte = (window.__tCarteCpu || 0) + (window.__tCarteFin || 0); window.__tCartePrete = performance.now() - t0; }), 30);
 }, 60);
 document.addEventListener('click', onClick);
 document.addEventListener('change', onChange);
 initMapInput();
}
const START = { scen: '1073', name: null, fam: null, nat: 'italien', voc: null, flaw: true, diff: 1 };
function startScreen() {
 $('#game').hidden = true; $('#start').hidden = false; setTimeout(cloudOffer, 0);
 const sc = SCEN[START.scen]; if (!START.name) { START.name = sc.pope.name; START.fam = sc.pope.fam; START.voc = sc.pope.voc; }
 const num = (sc.pn[START.name] || 0) + 1;
 $('#start').innerHTML = `<div class="st-wrap">
 <div class="st-head">${papalArms(96)}<div><h1>Sedes Petri</h1><div class="st-sub">Le Trône de Pierre · de la Querelle des Investitures à la Réforme</div></div></div>
 <p class="st-intro">Vous êtes le successeur de Pierre, évêque de Rome, vicaire du Christ. Des rois vous défient, des hérésies naissent, Jérusalem attend, et Rome elle-même se soulève. Chaque saison, scellez vos bulles, déjouez les conjurations du Sacré Collège, convoquez les conciles, prêchez la croix — et quand viendra votre mort, le conclave choisira l’homme qui portera votre héritage.</p>
 <h2>Choisissez votre époque</h2>
 <div class="st-scens">${Object.keys(SCEN).map(k => { const s = SCEN[k]; return `<button class="st-scen ${START.scen === k ? 'on' : ''}" data-scen="${k}"><div class="ss-art">${sceneSVG({ '1073': 'snow', '1198': 'crown', '1294': 'tower', '1378': 'conclave' }[k])}</div><div class="ss-tag">${s.tag}</div><div class="ss-t">${s.title}</div><div class="ss-d">${s.desc}</div></button>`; }).join('')}</div>
 <div class="st-grid">
  <div class="st-box"><div class="st-ph"><h3>Le pontife</h3><div class="st-port">${portraitSVG({ seed: hashStr(START.name + START.fam), kind: 'pope', age: sc.pope.age, w: 120, bg: '#6b1414' })}</div></div>
   <label>Nom de règne <select id="stName">${PNAMES_LIST.map(n => `<option ${n === START.name ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
   <div class="st-num">Vous régnerez sous le nom de <b>${START.name} ${roman(num)}</b></div>
   <label>Famille <input id="stFam" value="${esc(START.fam)}" maxlength="28"></label>
   <label>Origine <select id="stNat">${Object.keys(NAT_LABEL).map(n => `<option value="${n}" ${n === START.nat ? 'selected' : ''}>${{ italien: 'Italien', francais: 'Français', allemand: 'Allemand', espagnol: 'Ibérique', anglais: 'Anglais' }[n]}</option>`).join('')}</select></label>
   <label class="chk"><input type="checkbox" id="stFlaw" ${START.flaw ? 'checked' : ''}> Un défaut tiré au sort <small>(recommandé)</small></label>
   <div class="st-diff">${['Pèlerin', 'Prélat', 'Pontife'].map((d, i) => `<button class="${START.diff === i ? 'on' : ''}" data-diff="${i}">${d}</button>`).join('')}</div>
  </div>
  <div class="st-box"><h3>Vocation</h3><div class="st-vocs">${Object.keys(POPE_TRAITS).filter(t => POPE_TRAITS[t].v).map(t => `<button class="st-voc ${START.voc === t ? 'on' : ''}" data-voc="${t}"><b>${POPE_TRAITS[t].n}</b><span>${POPE_TRAITS[t].d}</span></button>`).join('')}</div></div>
 </div>
 ${hof().length ? `<div class="st-hof"><h2>Les plus glorieuses lignées</h2>${hof().slice(0, 5).map((h, i) => `<div><b>${i + 1}.</b> ${fmt(h.g)} points · ${SCEN[h.s] ? SCEN[h.s].tag : h.s} → ${h.y} · ${h.p} papes · ${h.a} hauts faits${h.r === 'ruine' ? ' · <i>effondrement</i>' : ''}</div>`).join('')}</div>` : ''}
 <div class="st-go"><button class="big" id="stStart">Coiffer la tiare</button>${hasSave() ? '<button class="big ghost" id="stLoad">Reprendre la partie</button>' : ''}<span id="stCloud"></span><button class="ghost" id="stImport">Importer un code</button><button class="ghost" data-guide="1">Comment jouer</button><button class="ghost" id="stTest" title="Partie séparée : mesure la fluidité sur cet appareil, sans toucher à vos sauvegardes">🧪 Mode test</button></div>
 </div>`;
}
function cloudOffer() {
 if (typeof NUAGE === 'undefined') return;
 NUAGE.charger().then(d => {
  UI.cloud = d; const el = document.getElementById('stCloud'); if (!d || !el || $('#start').hidden) return;
  if (d.t > localSaveTime() + 5000) el.innerHTML = `<button class="big ghost" id="stCloudLoad" title="Sauvegardée sur un autre appareil ou plus récente">☁ Reprendre en ligne · ${esc(d.d || '')}</button>`;
 });
}
/* ---------- Trousse de test (outils-communs/testkit.js) ---------- */
let TKI = null;
function tk() { if (!TKI && window.Testkit) TKI = window.Testkit({ jeu: 'sedes-petri', canvas: () => document.getElementById('map'), etat: () => S ? { scen: S.scen, date: dateStr(), pape: popeName(), autorite: Math.round(S.authority), tresor: S.treasury, onglet: UI.tab, royaume: UI.sel, mode: MAP.mode, test: !!S.test, annales: S.log.slice(-8).map(l => l.y + ' ' + l.t) } : { ecran: 'accueil' } }); return TKI; }
async function signaler() { const T = tk(); if (!T) { toast('Outil de signalement indisponible.'); return; } toast('Envoi du signalement…'); const ok = await T.signaler(); toast(ok ? '🐞 Signalement envoyé à Claude : capture, état du jeu et erreurs.' : 'Signalement enregistré sur cet appareil seulement.', ok ? 'gold' : ''); }
let STRESS = null;
function stopStress() { if (STRESS) { STRESS(); STRESS = null; } }
async function modeTest() {
 const T = tk(); if (!T) { toast('Trousse de test non chargée.'); return; }
 let a = 77; Math.random = function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
 newGame({ scen: '1198', name: 'Innocent', fam: 'Conti di Segni', nat: 'italien', voc: 'juriste', flaw: false, diff: 1 }); S.test = true;
 enterGame(); T.modeTest(); await sleep(800);
 const every = (ms, fn) => { const id = setInterval(fn, ms); STRESS = () => clearInterval(id); };
 const scenes = [
  { nom: 'carte immobile', preparer: async () => { stopStress(); mapReset(); } },
  { nom: 'déplacement de la carte', preparer: async () => { stopStress(); let on = true, t0 = performance.now(); const f = t => { if (!on) return; const k = MAP.fit * (1.4 + Math.sin((t - t0) / 900) * 0.6); MAP.view.k = k; MAP.view.x = -200 * k + Math.sin((t - t0) / 1300) * 120; MAP.view.y = -150 * k + Math.cos((t - t0) / 1100) * 80; applyView(); requestAnimationFrame(f); }; requestAnimationFrame(f); STRESS = () => { on = false; }; } },
  { nom: 'changements de mode', preparer: async () => { stopStress(); let i = 0; every(300, () => { MAP.mode = MODES[i++ % MODES.length][0]; renderMap(); }); } },
  { nom: 'onglets', preparer: async () => { stopStress(); let i = 0; every(300, () => { UI.tab = TABS[i++ % TABS.length][0]; renderPanel(); }); } },
  { nom: 'saisons', preparer: async () => { stopStress(); every(600, () => { endSeason(); S.events = []; if (S.pendingConclave) { const cv = conclaveSetup(); while (!cv.done) conclaveRound(cv); electPope(cv, 'Pie'); } renderAll(); }); } }
 ];
 toast('🧪 Banc en cours (environ 35 s)…');
 const r = await T.banc(scenes, 5000); stopStress();
 modal(`<div class="rep"><h2>🧪 Mesures de cet appareil</h2><p class="mut">${esc(r.gpu)} · écran ${r.ecran}</p>${r.res.map(x => `<div class="brow"><span>${x.scene}</span><b>${x.fps || '—'} img/s</b><b>pire ${x.pire || '—'} ms</b></div>`).join('')}<p class="mut">${r.enregistre ? 'Résultats envoyés : Claude pourra les lire.' : 'Résultats gardés sur cet appareil (envoi impossible ici).'}</p><button class="big" data-new="1">Retour à l’accueil</button></div>`, 'repm');
}
function enterGame(fresh) {
 mapPret();
 $('#start').hidden = true; $('#game').hidden = false; UI.sel = null; UI.tab = 'pontife';
 requestAnimationFrame(() => { mapReset(); renderAll(); if (fresh) showWelcome(); });
}
function showWelcome() {
 let skip = false; try { skip = localStorage.getItem('sp_welcome') === '1'; } catch (e) { }
 if (skip) return;
 const sc = SCEN[S.scen];
 modal(`<div class="rep welcome"><div class="eyebrow">${sc.tag}</div><h2>${popeName()}, servus servorum Dei</h2><p class="ev-t">${sc.desc}</p>
 <div class="wg"><div><b>① Les sceaux</b><p>Chaque saison, vous disposez de quelques sceaux (en bas à droite). Chaque bulle en consomme : prêcher, exiger les investitures, excommunier, bâtir, convoquer un concile…</p></div>
 <div><b>② La carte</b><p>Touchez un royaume pour ouvrir sa fiche : son souverain, sa ferveur, ses hérésies et toutes les bulles que vous pouvez lui adresser. Les modes en haut révèlent relations, ferveur ou hérésies.</p></div>
 <div><b>③ Les affaires pressantes</b><p>L’onglet Pontife liste ce qui menace votre règne. Le chiffre rouge sur l’onglet signale les urgences.</p></div>
 <div><b>④ Clore la saison</b><p>Le monde vit : rois, guerres, hérésies, complots. Des événements vous demanderont de trancher. À votre mort, le conclave élit votre successeur et la partie continue.</p></div></div>
 <label class="tog"><input type="checkbox" id="noWel"><span><b>Ne plus afficher</b></span></label><button class="big" data-close="1" id="welGo">Gouverner l’Église</button></div>`, 'repm');
}
function renderAll() { renderTop(); renderMap(); renderPanel(); renderEnd(); achWatch(); }
function achWatch() {
 const ks = Object.keys(S.ach); if (UI.achN == null || UI.achScen !== S) { UI.achN = ks.length; UI.achScen = S; return; }
 if (ks.length > UI.achN) { ks.slice(UI.achN).forEach(k => { toast(`✦ Haut fait : <b>${ACH[k].n}</b> — ${ACH[k].d}`, 'gold'); }); sfx('gold'); }
 UI.achN = ks.length;
}

/* ---------- Bandeau ---------- */
function chip(ic, label, val, sub, tab, cls, tip) { return `<button class="chip ${cls || ''}" data-tab="${tab}" title="${esc(tip || label)}"><span class="ci">${ICON[ic]}</span><span class="cv"><b>${val}</b><small>${label}${sub ? ' · ' + sub : ''}</small></span></button>`; }
function renderTop() {
 const b = budget(); const af = avgFervor();
 const cur = { t: S.treasury, a: Math.round(S.authority), f: Math.round(af), c: Math.round(avgLoyal()), k: Math.round(S.corruption), r: Math.round(S.rome.stab) }; const prev = UI.prevTop || cur; UI.prevTop = cur;
 const fl = (k, inv) => cur[k] === prev[k] ? '' : ((cur[k] > prev[k]) !== !!inv ? ' flup' : ' fldn');
 const lvl = (v, inv) => { const x = inv ? 100 - v : v; return x < 25 ? 'crit' : x < 45 ? 'warn' : x > 75 ? 'good' : ''; };
 $('#top').innerHTML = `<div class="tb-l"><div class="tb-arms">${papalArms(40)}</div><div class="tb-date"><b>${S.year}</b><span>${SEASONS[S.season]}</span></div></div>
 <div class="tb-s">${chip('coin', 'Trésor', fmt(S.treasury), (b.total >= 0 ? '+' : '') + Math.round(b.total) + '/saison', 'tresor', (S.treasury < 50 ? 'crit' : '') + fl('t'), 'Marcs d’argent dans les coffres de la Chambre apostolique')}
 ${chip('auth', 'Autorité', Math.round(S.authority), '', 'pontife', lvl(S.authority) + fl('a'), 'Autorité pontificale : le poids de la parole du pape. À zéro durablement, la papauté s’effondre.')}
 ${chip('fervor', 'Ferveur', Math.round(af), '', 'eglise', lvl(af) + fl('f'), 'Ferveur moyenne de la Chrétienté latine')}
 ${chip('curia', 'Curie', Math.round(avgLoyal()), S.cardinals.length + ' card.', 'curie', lvl(avgLoyal()) + fl('c'), 'Loyauté moyenne du Sacré Collège')}
 ${chip('corr', 'Corruption', Math.round(S.corruption), '', 'tresor', lvl(S.corruption, 1) + fl('k', 1), 'Simonie, népotisme et vénalité : ronge les revenus, l’autorité et nourrit l’hérésie')}
 ${chip('rome', 'Rome', Math.round(S.rome.stab), S.curia === 'rome' ? '' : (S.curia === 'avignon' ? 'Avignon' : 'Exil'), 'rome', lvl(S.rome.stab) + fl('r'), 'Stabilité de la Ville')}
 ${chip('army', 'Milice', fmt(S.army), '', 'rome', '', 'Troupes du pape')}</div>
 <div class="tb-r"><button class="ib ${MUS ? 'on' : ''}" data-music="1" title="Musique">♪</button><button class="ib" data-sound="1" title="Son">${UI.sound ? '🔔' : '🔕'}</button><button class="ib" data-bug="1" title="Signaler un problème à Claude (capture et état du jeu)">🐞</button><button class="ib" data-guide="1" title="Guide">?</button><button class="ib" data-menu="1" title="Menu">☰</button></div>`;
}
function renderEnd() {
 const dots = [...Array(sealsMax())].map((_, i) => `<i class="${i < S.seals ? 'on' : ''}">${i < S.seals ? ICON.seal : ICON.sealE}</i>`).join('');
 $('#endTurn').innerHTML = `<span class="et-seals">${dots}</span><span class="et-t">Clore ${SEASONS[S.season] === 'Été' ? 'l’été' : SEASONS[S.season] === 'Automne' ? 'l’automne' : SEASONS[S.season] === 'Hiver' ? 'l’hiver' : 'le printemps'}</span>`;
 $('#endTurn').disabled = !!S.over || UI.busy;
 $('#endTurn').classList.toggle('ready', S.seals === 0 && !UI.busy);
 $('#mapWrap').className = $('#mapWrap').className.replace(/ ?season-\d/g, '') + ' season-' + S.season;
 const mm = $('#mapModes'); mm.innerHTML = MODES.map(([k, n]) => `<button class="${MAP.mode === k ? 'on' : ''}" data-mode="${k}">${n}</button>`).join('');
}

/* ---------- Panneau ---------- */
const TABS = [['pontife', 'Pontife', 'auth'], ['royaume', 'Royaumes', 'crown'], ['rome', 'Rome', 'rome'], ['curie', 'Curie', 'curia'], ['eglise', 'Église', 'fervor'], ['croisade', 'Croisade', 'army'], ['tresor', 'Trésor', 'coin'], ['chronique', 'Chronique', 'seal', 'Annales']];
function renderPanel() {
 const agn = agenda().filter(x => x.l !== 'info').length;
 $('#tabs').innerHTML = TABS.map(([k, n, ic, sh]) => `<button class="${UI.tab === k ? 'on' : ''}" data-tab="${k}"><span>${ICON[ic]}</span>${sh ? `<i class="tl">${n}</i><i class="ts">${sh}</i>` : n}${k === 'pontife' && agn ? `<em class="num">${agn}</em>` : ''}${k === 'croisade' && S.crusade ? '<em>●</em>' : ''}${k === 'eglise' && S.council ? '<em>●</em>' : ''}</button>`).join('');
 const f = { pontife: tabPontife, royaume: tabRoyaume, rome: tabRome, curie: tabCurie, eglise: tabEglise, croisade: tabCroisade, tresor: tabTresor, chronique: tabChronique }[UI.tab];
 const body = $('#tabBody'); const sc = body.scrollTop; body.innerHTML = f(); if (UI.keepScroll) body.scrollTop = sc; UI.keepScroll = false;
}
function sealCost(n) { return n ? `<span class="sc">${[...Array(n)].map(() => ICON.seal).join('')}</span>` : ''; }
function actBtn(id, a, label, extraCls) {
 const why = canAct(id, a), A = ACT[id], cost = actCost(id, a);
 return `<button class="act ${why ? 'dis' : ''} ${extraCls || ''}" data-act="${id}" data-a="${esc(JSON.stringify(a || {}))}" ${why ? 'aria-disabled="true"' : ''}><span class="at"><b>${label || A.n}</b><span class="ac">${sealCost(A.s)}${cost ? `<span class="mc">${ICON.coin}${cost}</span>` : ''}</span></span><span class="ad">${why ? '⛔ ' + esc(why) : esc(A.d)}</span></button>`;
}
function sec(t, inner, cls) { return `<section class="sec ${cls || ''}"><h3><span>${t}</span></h3>${inner}</section>`; }
function stat(label, v, cls, max, txt) { return `<div class="stat"><span>${label}</span>${bar(v, cls, max)}<b>${txt != null ? txt : Math.round(v)}</b></div>`; }

function tabPontife() {
 const p = S.pope; const reign = S.year - p.start;
 const achs = Object.keys(ACH).map(k => `<div class="ach ${S.ach[k] ? 'on' : ''}" title="${esc(ACH[k].d)}${S.ach[k] ? ' — ' + S.ach[k].y + ', ' + S.ach[k].p : ''}"><span>✦</span><b>${ACH[k].n}</b></div>`).join('');
 const lin = S.popes.slice(-12).reverse().map(x => `<div class="lin"><div>${portraitSVG({ seed: x.seed, kind: 'pope', age: 65, w: 38, bg: '#4a1010' })}</div><div><b>${x.name}${x.sum ? ' ' + x.sum.ep : ''}</b><small>${x.from}–${x.to} · ${x.how === 'abdication' ? 'abdiqua' : 'mort'} · autorité ${x.auth}${x.sum && x.sum.ach.length ? ' · ' + x.sum.ach.join(', ') : ''}</small></div></div>`).join('') || '<p class="mut">Vous êtes le premier pontife de cette lignée.</p>';
 const ag = agenda();
 const agH = ag.length ? ag.map(x => `<button class="agi ${x.l}" ${x.go.realm ? `data-realm="${x.go.realm}"` : `data-tab="${x.go.tab}"`}><i>${x.l === 'crit' ? '‼' : x.l === 'warn' ? '!' : '•'}</i><span>${x.t}</span></button>`).join('') : '<p class="mut">Aucune affaire pressante : la barque de Pierre vogue en eaux calmes.</p>';
 return `${sec('Affaires pressantes', `<div class="agenda">${agH}</div>`)}<div class="hero"><div class="hero-p">${popePortrait(p, 132)}</div><div class="hero-i"><div class="eyebrow">Servus servorum Dei</div><h2>${popeName()}</h2><div class="mut">${p.fn ? p.fn + ' ' : ''}${p.fam} · ${NAT_LABEL[p.nat] ? { italien: 'Romain', francais: 'Français', allemand: 'Allemand', espagnol: 'Ibérique', anglais: 'Anglais' }[p.nat] : ''}</div>
 <div class="mut">${p.age} ans · pontife depuis ${reign ? reign + ' an' + (reign > 1 ? 's' : '') : 'cette année'}</div>
 ${stat('Santé', p.health, p.health < 35 ? 'red' : 'green')}${stat('Autorité', S.authority, 'gold')}
 <div class="traits">${p.traits.map(t => `<span class="tr ${POPE_TRAITS[t].v ? '' : 'bad'}" title="${esc(POPE_TRAITS[t].d)}">${POPE_TRAITS[t].n}</span>`).join('')}</div></div></div>
 ${sec('Ce que vous inspirez', `<div class="tdesc">${p.traits.map(t => `<p><b>${POPE_TRAITS[t].n}.</b> ${POPE_TRAITS[t].d}</p>`).join('')}</div>`)}
 ${sec('Gouverner l’Église', `<p class="mut">Chaque saison, vous disposez de <b>${sealsMax()} sceaux</b> pour expédier vos bulles. Les sceaux non utilisés sont perdus.</p><div class="acts">${actBtn('repos')}${actBtn('bulle')}${actBtn('abdiquer')}</div>`)}
 ${sec('Gloire de la lignée', `<div class="glory"><b>${fmt(glory())}</b><span>points de gloire</span></div><div class="achs">${achs}</div>`)}
 ${sec('Les prédécesseurs', lin)}`;
}
function relWord(v) { return v > 60 ? 'Dévoué' : v > 25 ? 'Amical' : v > -10 ? 'Réservé' : v > -45 ? 'Méfiant' : 'Hostile'; }
function tabRoyaume() {
 if (!UI.sel || !active(UI.sel)) {
  const list = activeRealms().sort((a, b) => (isCath(b) - isCath(a)) || power(b) - power(a));
  const row = r => { const R = RL(r); return `<button class="rrow" data-realm="${r}">${shieldSVG(r, 30)}<span class="rr-n"><b>${rname(r)}</b><small>${rulerLbl(r)}</small></span><span class="rr-s">${R.excom ? '<i class="tagx">Excommunié</i>' : ''}${R.vassal ? '<i class="tagk">Vassal</i>' : ''}${R.heresy >= 30 ? `<i class="tagh">${Math.round(R.heresy)}</i>` : ''}<span class="relv ${R.rel < -10 ? 'neg' : R.rel > 25 ? 'pos' : ''}">${sgn(R.rel)}</span></span></button>`; };
  return `<p class="mut">Touchez un royaume sur la carte ou dans la liste.</p>${sec('Chrétienté latine', list.filter(isCath).map(row).join(''))}${sec('Orient chrétien', list.filter(r => RL(r).relig === 'orthodoxe').map(row).join(''))}${sec('Islam et païens', list.filter(r => ['musulman', 'paien'].includes(RL(r).relig)).map(row).join(''))}`;
 }
 const r = UI.sel, R = RL(r), ru = R.ruler, cath = isCath(r);
 const traits = ru && !ru.c ? ru.t.map(t => `<span class="tr" title="">${RULER_TRAITS[t] || t}</span>`).join('') : '';
 const wars = warsOf(r).map(w => { const o = w.a === r ? w.b : w.a; const sc = w.a === r ? w.score : -w.score; return `<div class="warrow"><button class="mini" data-realm="${o}">⚔ ${mapName(o)}</button><div class="warbar"><i style="left:${clamp(50 + sc, 2, 98)}%"></i></div><small>${sc > 12 ? 'avantage' : sc < -12 ? 'en difficulté' : 'indécis'}</small></div><div class="acts two">${actBtn('soutenir', { r, e: o }, 'Soutenir ' + mapName(r))}${actBtn('soutenir', { r: o, e: r }, 'Soutenir ' + mapName(o))}</div>`; }).join('');
 const leg = R.legate ? card(R.legate) : null;
 const freeCards = S.cardinals.filter(c => !c.legate && !c.office);
 const statuses = [R.excom ? `<span class="badge black">Excommunié depuis ${R.excomT} saison${R.excomT > 1 ? 's' : ''}</span>` : '', R.interdict ? '<span class="badge black">Interdit</span>' : '', R.vassal ? '<span class="badge gold">Vassal du Saint-Siège</span>' : '', R.ward ? '<span class="badge gold">Sous tutelle pontificale</span>' : '', S.crusade && S.crusade.members.includes(r) ? '<span class="badge red">A pris la croix</span>' : '', S.schism && R.obed === 'anti' ? `<span class="badge black">Obédience de l’antipape</span>` : '', R.offense > 0 ? '<span class="badge red">A offensé l’Église</span>' : ''].join('');
 let acts = '';
 if (cath) acts = `<div class="acts">${actBtn('predication', { r })}${actBtn('investir', { r })}${actBtn('conceder', { r })}${actBtn('rose', { r })}${actBtn('subside', { r })}${actBtn('vassal', { r })}${actBtn('mediation', { r })}${S.crusade ? actBtn('exhorter', { r }) : ''}${actBtn('inquisition', { r })}</div>
  <h4>Armes spirituelles</h4><div class="acts">${R.excom ? actBtn('absoudre', { r }) : actBtn('excom', { r })}${R.interdict ? actBtn('lever_interdit', { r }) : actBtn('interdit', { r })}</div>`;
 else if (R.relig === 'paien') acts = `<div class="acts">${actBtn('mission', { r })}</div>${stat('Mission', R.mission, 'gold')}`;
 else acts = `<div class="acts">${actBtn('ambassade', { r })}${R.relig === 'musulman' ? actBtn('rachat', { r }) : ''}${actBtn('mediation', { r })}</div>${r === 'byzance' ? stat('Union des Églises', R.union, 'purple') : ''}`;
 return `<button class="back" data-realm="">← Tous les royaumes</button>
 <div class="rhead" style="--rc:${REALMS[r].c}">${shieldSVG(r, 64)}<div><h2>${rname(r)}</h2><div class="mut">${{ catholique: 'Catholique', orthodoxe: 'Orthodoxe', musulman: 'Musulman', paien: 'Païen' }[R.relig]} · ${nProv(r)} province${nProv(r) > 1 ? 's' : ''} · capitale ${cityOf(r)}</div><div class="badges">${statuses}</div></div></div>
 <div class="ruler">${rulerPortrait(r, 96)}<div><div class="eyebrow">${ru && !ru.c ? rtitle(r) : 'Gouvernement'}</div><h3>${ru ? ru.n : '—'}</h3>${ru && !ru.c ? `<div class="mut">${ru.a} ans${ru.d ? ' · maison ' + ru.d : ''} · piété ${ru.p}/10</div>` : '<div class="mut">Gouvernement collégial</div>'}<div class="traits">${traits}</div>${R.claimant ? `<div class="mut">Prétendant : ${R.claimant}</div>` : ''}</div></div>
 ${stat('Relation', R.rel + 100, R.rel < 0 ? 'red' : 'green', 200, `${sgn(R.rel)} · ${relWord(R.rel)}`)}
 ${stat('Puissance', power(r), 'steel', 60)}
 ${cath ? stat('Ferveur', R.fervor, 'blue') + stat('Hérésie', R.heresy, 'fire', 100, `${Math.round(R.heresy)}${R.hname ? ' · ' + R.hname : ''}`) + stat('Investitures', R.invest, 'gold', 100, `${Math.round(R.invest)} · ${R.invest > 60 ? 'le pape' : R.invest > 35 ? 'disputées' : 'le roi'}`) : ''}
 ${wars ? sec('Guerres', wars) : ''}
 ${R.anti ? `<div class="schism">Guerre civile : l’anti-roi <b>${R.anti.n}</b>, reconnu par le pape, dispute la couronne depuis ${R.anti.t} saison(s).</div>` : ''}
 ${sec('Légation', leg ? `<div class="crow">${cardinalPortrait(leg, 44)}<div><b>${cname(leg)}</b><small>Légat a latere · compétence ${leg.comp}</small></div>${actBtn('rappel', { r }, 'Rappeler')}</div>` : (freeCards.length ? `<div class="legsel"><select id="legSel">${freeCards.map(c => `<option value="${c.id}">${cname(c)} — comp. ${c.comp}, piété ${c.piety}${c.trait === 'diplomate' ? ', diplomate' : ''}</option>`).join('')}</select>${actBtn('legat', { r, c: freeCards[0].id }, 'Envoyer')}</div>` : '<p class="mut">Aucun cardinal disponible (ni légat, ni officier).</p>'))}
 ${sec('Bulles et ambassades', acts)}
 ${sec('Provinces', `<div class="provs">${provsOf(r).map(p => `<span title="${esc(PROV[p].n)}">${PROV[p].city}<small>${PROV[p].n}</small></span>`).join('')}</div>`)}
 ${R.past && R.past.length ? sec('Souverains précédents', R.past.slice().reverse().map(x => `<div class="past"><b>${x.n}</b><small>mort en ${x.y}</small></div>`).join('')) : ''}`;
}
function tabRome() {
 const R = S.rome;
 const fams = R.fam.map(f => `<div class="fam"><div class="fam-h"><b>${f.n}</b>${f.n === S.pope.fam ? '<span class="badge gold">famille du pape</span>' : ''}</div>${stat('Puissance', f.power, 'steel', 80)}${stat('Loyauté', f.loyal, f.loyal < 30 ? 'red' : 'green')}<div class="acts two">${actBtn('favoriser', { f: f.n })}${actBtn('chatier', { f: f.n })}</div></div>`).join('');
 const patr = PATRI.map(p => `<div class="patr"><div class="fam-h"><b>${PROV[p].n}</b><small>${PROV[p].city}</small></div>${S.own[p] === 'etats' ? stat('Contrôle', S.ctrl[p], S.ctrl[p] < 35 ? 'red' : 'gold') + `<div class="acts two">${actBtn('recteur', { p })}${actBtn('campagne', { p })}</div>` : `<p class="mut">Occupée par ${rname(S.own[p])}</p>`}</div>`).join('');
 const builds = Object.keys(BUILDINGS).filter(k => !BUILDINGS[k].avignon || S.curia === 'avignon' || S.build[k] !== undefined).map(k => { const B = BUILDINGS[k], st = S.build[k]; return `<div class="bld ${st === true ? 'done' : typeof st === 'number' ? 'wip' : ''}"><div class="fam-h"><b>${B.n}</b><small>${st === true ? 'Achevé' : typeof st === 'number' ? `Chantier : encore ${st} saison${st > 1 ? 's' : ''}` : `${B.t} saisons`}</small></div><p>${B.d}</p>${st === undefined ? actBtn('build', { b: k }, 'Lancer le chantier') : ''}</div>`; }).join('');
 return `<div class="pan">${romePanorama()}</div>
 ${stat('Peuple romain', R.people, R.people < 35 ? 'red' : 'green')}${stat('Stabilité', R.stab, R.stab < 30 ? 'red' : 'gold')}
 <div class="acts two">${actBtn('pain')}${actBtn('procession')}</div>
 ${sec('Siège de la Curie', `<p class="mut">${S.curia === 'rome' ? 'Le pape réside au Latran.' : S.curia === 'avignon' ? 'La Curie siège en Avignon : la Ville éternelle dépérit, l’Italie gronde, mais la France est satisfaite et la fiscalité plus efficace.' : 'La Curie est en exil à Viterbe : autorité et sceaux diminués.'}</p><div class="acts two">${S.curia === 'exil' ? actBtn('retour') : actBtn('transfert', {}, S.curia === 'rome' ? 'S’établir en Avignon' : 'Rentrer à Rome')}</div>`)}
 ${sec('Les grandes familles', `<div class="fams">${fams}</div>`)}
 ${sec('Milice pontificale', `<div class="army"><span>${ICON.army}</span><b>${fmt(S.army)}</b> hommes d’armes · solde ${Math.round(S.army / 50)} marcs/saison</div><div class="acts two">${actBtn('recruter')}${actBtn('licencier')}</div>`)}
 ${sec('Patrimoine de saint Pierre', `<div class="fams">${patr}</div>`)}
 ${sec('Chantiers de Rome', `<div class="blds">${builds}</div>`)}`;
}
function tabCurie() {
 const offs = [['camerlingue', 'Camerlingue', 'Gère la Chambre apostolique : revenus selon sa compétence.'], ['chancelier', 'Vice-chancelier', 'Compétence 7+ : un sceau de plus chaque saison.'], ['penitencier', 'Grand pénitencier', 'Sa piété élève la ferveur de la Chrétienté.'], ['inquisiteur', 'Inquisiteur général', 'Renforce les inquisitions (exige le décret).']];
 const avail = S.cardinals.filter(c => !c.legate);
 const offH = offs.map(([k, n, d]) => { const c = S.offices[k] && card(S.offices[k]); return `<div class="off"><div class="off-p">${c ? cardinalPortrait(c, 46) : '<div class="empty">—</div>'}</div><div class="off-i"><b>${n}</b><small>${d}</small><select data-office="${k}"><option value="">— vacant —</option>${avail.map(x => `<option value="${x.id}" ${c && c.id === x.id ? 'selected' : ''}>${cname(x)} (comp. ${x.comp}, piété ${x.piety})</option>`).join('')}</select></div></div>`; }).join('');
 const nats = {}; S.cardinals.forEach(c => nats[c.nat] = (nats[c.nat] || 0) + 1);
 let acc = 0; const tot = S.cardinals.length || 1;
 const donut = `<svg viewBox="0 0 42 42" width="96" height="96" class="donut">${Object.keys(nats).map(n => { const v = nats[n] / tot * 100; const s = `<circle cx="21" cy="21" r="15.9" fill="none" stroke="${NAT_COLOR[n]}" stroke-width="6" stroke-dasharray="${v} ${100 - v}" stroke-dashoffset="${25 - acc}"/>`; acc += v; return s; }).join('')}<text x="21" y="23.5" text-anchor="middle" font-size="8" font-family="Cinzel,serif" fill="#3a2410">${S.cardinals.length}</text></svg>`;
 const legend = Object.keys(nats).map(n => `<span><i style="background:${NAT_COLOR[n]}"></i>${NAT_LABEL[n]} : ${nats[n]}</span>`).join('');
 if (!S.cands) genCandidates();
 const cands = S.cands.map(c => `<div class="cand">${cardinalPortrait(c, 52)}<div><b>${cname(c)}</b>${c.nephew ? '<span class="badge gold">Neveu du pape</span>' : ''}<small>${NAT_FLAG(c.nat)} ${c.age} ans · ${POPE_TRAITS[c.trait].n}</small><small>Compétence ${c.comp} · piété ${c.piety} · ambition ${c.amb}</small></div>${actBtn('creer', { c: c.id }, 'Créer')}</div>`).join('');
 const sorted = S.cardinals.slice().sort((a, b) => UI.curiaSort === 'loyal' ? a.loyal - b.loyal : b.comp - a.comp);
 const list = sorted.map(c => `<div class="card ${c.loyal < 30 ? 'warn' : ''}"><div class="card-p">${cardinalPortrait(c, 54)}</div><div class="card-i"><b>${cname(c)}</b><div class="card-m">${NAT_FLAG(c.nat)}<span>${c.age} ans</span><span class="tr ${POPE_TRAITS[c.trait].v ? '' : 'bad'}" title="${esc(POPE_TRAITS[c.trait].d)}">${POPE_TRAITS[c.trait].n}</span>${c.nephew ? '<span class="badge gold">neveu</span>' : ''}${c.office ? `<span class="badge">${{ camerlingue: 'Camerlingue', chancelier: 'Vice-chancelier', penitencier: 'Pénitencier', inquisiteur: 'Inquisiteur' }[c.office]}</span>` : ''}${c.legate ? `<span class="badge red">Légat · ${mapName(c.legate)}</span>` : ''}</div>
  <div class="card-s"><span>Comp. <b>${c.comp}</b></span><span>Piété <b>${c.piety}</b></span><span>Ambition <b>${c.amb}</b></span></div>${stat('Loyauté', c.loyal, c.loyal < 30 ? 'red' : 'green')}
  <div class="acts two">${actBtn('faveur', { c: c.id }, 'Gratifier')}${actBtn('disgrace', { c: c.id }, 'Disgracier')}</div><button class="dau ${S.dauphin === c.id ? 'on' : ''}" data-dauphin="${c.id}">${S.dauphin === c.id ? '♛ Dauphin désigné' : 'Désigner comme dauphin'}</button></div></div>`).join('');
 return `${sec('Les grands offices', `<div class="offs">${offH}</div>`)}
 ${sec('Le Sacré Collège', `<div class="coll">${donut}<div class="lg-sw">${legend}</div></div><p class="mut">Au conclave, chaque cardinal votera selon sa nation, sa loyauté envers vous et les mérites des candidats. Les deux tiers des voix sont nécessaires.</p><div class="acts two">${actBtn('consistoire')}</div>`)}
 ${sec('Les papabili', `<p class="mut">Si le conclave s’ouvrait demain, ces cardinaux seraient favoris. Vous pouvez désigner un <b>dauphin</b> : il sera toujours candidat, et vos fidèles le porteront.</p><div class="paps">${papabili().map(c => `<div class="pap ${S.dauphin === c.id ? 'on' : ''}">${cardinalPortrait(c, 56)}<b>${cname(c)}</b><small>${NAT_FLAG(c.nat)} ${c.age} ans · ${POPE_TRAITS[c.trait].n}</small><button data-dauphin="${c.id}">${S.dauphin === c.id ? 'Dauphin désigné' : 'Désigner'}</button></div>`).join('')}</div>${S.dauphin && card(S.dauphin) && !papabili().some(c => c.id === S.dauphin) ? `<p>Votre dauphin : <b>${cname(card(S.dauphin))}</b></p>` : ''}`)}
 ${sec(`Consistoire secret · créations ${S.created}/2 cette année`, `<div class="cands">${cands}</div>`)}
 ${sec('Les cardinaux', `<div class="sortb"><button class="${UI.curiaSort === 'loyal' ? 'on' : ''}" data-csort="loyal">Moins loyaux d’abord</button><button class="${UI.curiaSort === 'comp' ? 'on' : ''}" data-csort="comp">Plus compétents d’abord</button></div><div class="cards">${list}</div>`)}`;
}
function tabEglise() {
 const c = S.council;
 const concH = c ? `<div class="council"><div class="cc-art">${sceneSVG('mitres')}</div><p><b>${councilName()}</b> siège. Les pères conciliaires débattront encore <b>${c.t} saison${c.t > 1 ? 's' : ''}</b>. Vous pourrez alors faire adopter <b>${councilSlots()}</b> décrets (selon votre autorité).</p></div>` : `<p class="mut">Un concile œcuménique réunit les évêques de la Chrétienté et vous permet d’adopter des décrets durables. Dernier concile : ${S.councils ? S.lastCouncil : 'aucun sous votre lignée'}.</p><div class="acts">${actBtn('concile')}</div>`;
 const decs = S.decrees.length ? S.decrees.map(k => `<div class="dec on"><b>${DECREES[k].n}</b><small>${DECREES[k].d}</small></div>`).join('') : '<p class="mut">Aucun décret en vigueur.</p>';
 const ords = Object.keys(ORDERS).map(k => { const O = ORDERS[k]; const st = S.orders.includes(k) ? 'on' : S.flags['ord_' + k] ? 'rej' : S.year >= O.min ? 'wait' : 'fut'; return `<div class="ord ${st}"><b>${O.n}</b><small>${st === 'on' ? 'Approuvé' : st === 'rej' ? 'Supplique rejetée' : st === 'wait' ? 'Une supplique peut venir…' : `Après ${O.min}`}</small><p>${O.d}</p></div>`; }).join('');
 const her = catholics(r => RL(r).heresy >= 10).sort((a, b) => RL(b).heresy - RL(a).heresy).map(r => `<button class="rrow" data-realm="${r}">${shieldSVG(r, 26)}<span class="rr-n"><b>${RL(r).hname || 'Dissidences'}</b><small>${rname(r)}</small></span><span class="rr-s">${bar(RL(r).heresy, 'fire')}<b>${Math.round(RL(r).heresy)}</b></span></button>`).join('') || '<p class="mut">La Chrétienté latine est en paix avec la foi.</p>';
 const byz = active('byzance') ? `${stat('Union avec les Grecs', RL('byzance').union, 'purple')}<p class="mut">${S.flags.unionDone ? 'L’union est proclamée.' : S.flags.sac ? 'Depuis le sac de Constantinople, les Grecs ne veulent plus entendre parler des Latins.' : 'À 60, un concile pourra proclamer l’union.'}</p><div class="acts">${actBtn('ambassade', { r: 'byzance' })}</div>` : '<p class="mut">L’Empire byzantin a disparu.</p>';
 const pag = activeRealms(r => RL(r).relig === 'paien').map(r => `${stat(rname(r), RL(r).mission, 'gold')}<div class="acts">${actBtn('mission', { r })}</div>`).join('') || '<p class="mut">Plus aucun peuple païen en Europe.</p>';
 const sch = S.schism ? `<div class="schism"><b>Schisme !</b> L’antipape <b>${S.schism.anti}</b> ${S.schism.backer ? `est soutenu par ${rulerLbl(S.schism.backer)}` : 'est soutenu par des cardinaux dissidents'}. ${catholics(r => RL(r).obed === 'anti').length} royaume(s) suivent son obédience. Réconciliez son protecteur, attendez sa mort, ou faites-le déposer par un concile.</div>` : '';
 return `${sch}${sec('Concile œcuménique', concH)}${sec('Hérésies', her)}${sec('Décrets en vigueur', `<div class="decs">${decs}</div>`)}${sec('Ordres religieux', `<div class="ords">${ords}</div>`)}${sec('L’Orient chrétien', byz)}${sec('Missions chez les païens', pag)}`;
}
function tabCroisade() {
 const c = S.crusade;
 const hist = S.crusades.slice().reverse().map(x => `<div class="crh ${x.ok ? 'ok' : 'ko'}"><b>${x.name}</b><small>${x.y} · ${x.ok ? 'victoire' : 'échec'}</small></div>`).join('') || '<p class="mut">Aucune croisade sous votre lignée.</p>';
 if (c) {
  const phases = ['predication', 'route', 'campagne'];
  const pi = phases.indexOf(c.phase);
  const strA = crusadeStrength(), strD = crusadeDefense();
  return `<div class="crhead">${sceneSVG(c.k === 'terre_sainte' ? 'cross' : c.k === 'heretiques' ? 'fire' : 'swords')}<div class="crt"><div class="eyebrow">Deus lo vult</div><h2>${c.name}</h2><div>Objectif : <b>${PROV[c.p].city}</b> (${PROV[c.p].n}) — ${c.k === 'heretiques' ? 'les ' + (RL(c.r).hname || 'hérétiques') : rname(c.enemy)}</div></div></div>
  <div class="phases">${['Prédication', 'En route', 'Campagne', 'Issue'].map((n, i) => `<div class="ph ${i < pi ? 'done' : i === pi ? 'on' : ''}">${n}</div>`).join('')}</div>
  ${c.phase === 'campagne' ? stat('Progrès', c.progress, 'gold', 100, Math.round(c.progress) + ' %') + `<p class="mut">Revers : ${c.defeats}/2 — au deuxième, l’ost se débande.</p>` : ''}
  <div class="vs"><div><small>Force croisée</small>${bar(strA, 'red', Math.max(strA, strD) * 1.1)}<b>${Math.round(strA)}</b></div><div><small>Défense</small>${bar(strD, 'steel', Math.max(strA, strD) * 1.1)}<b>${Math.round(strD)}</b></div></div>
  ${sec('Les princes croisés', c.members.length ? `<div class="members">${c.members.map(m => `<button class="mem" data-realm="${m}">${shieldSVG(m, 34)}<small>${mapName(m)}</small></button>`).join('')}</div>` : '<p class="mut">Personne n’a encore pris la croix. Exhortez les rois depuis leur fiche.</p>')}
  ${c.papal ? `<p>La bannière aux clefs mène <b>${c.papal}</b> hommes du pape.</p>` : ''}
  <div class="acts two">${actBtn('dime')}${actBtn('troupes')}</div>
  ${c.battles.length ? sec('Faits d’armes', c.battles.map(b => `<div class="bat ${b.ok ? 'ok' : 'ko'}">${b.ok ? '⚔' : '✕'} ${b.t}</div>`).join('')) : ''}
  ${sec('Croisades passées', hist)}`;
 }
 const tg = crusadeTargets();
 const cards = tg.map(t => `<div class="target">${sceneSVG(t.k === 'terre_sainte' ? 'cross' : t.k === 'heretiques' ? 'fire' : t.k === 'baltique' ? 'snow' : 'swords')}<div class="tg-i"><b>${t.n}</b><p>${t.d}</p><small>Autorité requise : ${t.min}</small>${actBtn('croisade', { key: t.key }, 'Prêcher la croix')}</div></div>`).join('') || '<p class="mut">Aucune cible ne se présente.</p>';
 return `<p class="mut">La croisade se prêche deux saisons ; les rois pieux, amis du pape, en paix et non excommuniés prennent la croix. Puis l’ost marche, combat, et revient chargé de gloire — ou de honte. ${S.weary > 0.05 ? `<b>La Chrétienté est lasse des croisades</b> (recrutement −${Math.round(S.weary * 100)} %).` : ''}</p>
 ${sec('Prêcher la croix', `<div class="targets">${cards}</div>`)}${sec('Croisades passées', hist)}`;
}
function spark(key, color, h) {
 const H = S.hist.slice(-160); if (H.length < 2) return '';
 const vals = H.map(x => x[key] == null ? 0 : x[key]); let mn = Math.min(...vals), mx = Math.max(...vals); if (key !== 't') { mn = 0; mx = 100; } if (mx === mn) mx = mn + 1;
 const pts = vals.map((v, i) => `${(i / (vals.length - 1) * 300).toFixed(1)},${(h - (v - mn) / (mx - mn) * (h - 6) - 3).toFixed(1)}`).join(' ');
 return `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>`;
}
function tabTresor() {
 const b = budget(); const mx = Math.max(...b.inc.map(x => x[1]), ...b.exp.map(x => x[1]), 1);
 const row = (x, cls) => `<div class="brow"><span>${x[0]}</span><div class="bar ${cls}"><i style="width:${x[1] / mx * 100}%"></i></div><b>${cls === 'red' ? '−' : '+'}${x[1].toFixed(1)}</b></div>`;
 const fl = [['Modérée', 'Dîmes −25 %, corruption en recul'], ['Ordinaire', 'Le juste équilibre'], ['Lourde', 'Dîmes +30 %, corruption, Rome mécontente'], ['Rapace', 'Dîmes +60 %, corruption galopante']];
 return `<div class="treas"><span>${ICON.coin}</span><b>${fmt(S.treasury)}</b><small>marcs d’argent</small><div class="net ${b.total < 0 ? 'neg' : ''}">${b.total >= 0 ? '+' : ''}${b.total.toFixed(1)} par saison</div></div>
 <svg viewBox="0 0 300 60" class="chart">${spark('t', '#b8892d', 60)}</svg>
 ${sec('Recettes', b.inc.map(x => row(x, 'gold')).join(''))}
 ${sec('Dépenses', b.exp.map(x => row(x, 'red')).join(''))}
 ${sec('Fiscalité de la Curie', `<div class="seg">${fl.map((f, i) => `<button class="${S.fisc === i ? 'on' : ''}" data-fisc="${i}"><b>${f[0]}</b><small>${f[1]}</small></button>`).join('')}</div>
  <label class="tog"><input type="checkbox" data-indulg="1" ${S.indulg ? 'checked' : ''} ${S.year < 1095 ? 'disabled' : ''}><span><b>Vendre des indulgences</b><small>${S.year < 1095 ? 'Pas avant les croisades (1095)' : 'Revenus importants, mais corruption +1,2/saison et l’hérésie se nourrit du scandale.'}</small></span></label>`)}
 ${sec('Dette', `<p>Dette : <b>${fmt(S.debt)}</b> marcs · intérêts ${(S.debt * 0.03).toFixed(1)}/saison · au-delà de 1 200, banqueroute${lender() ? ` · prêteurs : ${lender()}` : ''}</p><div class="acts two">${actBtn('emprunt')}${actBtn('rembourser')}</div>`)}`;
}
function tabChronique() {
 const L = S.log.slice(-160).reverse(); let last = ''; let h = '';
 for (const e of L) { const k = e.y + ' ' + e.s; if (k !== last) { h += `<div class="lgh">${SEASONS[e.s]} ${e.y}</div>`; last = k; } h += `<div class="lg ${e.k}">${e.t}</div>`; }
 return `${sec('Courbes du pontificat', `<svg viewBox="0 0 300 90" class="chart">${spark('a', '#b8892d', 90)}${spark('f', '#2b4f9c', 90)}${spark('c', '#7a3a1a', 90)}${spark('h', '#e2702a', 90)}</svg><div class="lg-sw"><span><i style="background:#b8892d"></i>Autorité</span><span><i style="background:#2b4f9c"></i>Ferveur</span><span><i style="background:#7a3a1a"></i>Corruption</span><span><i style="background:#e2702a"></i>Hérésie moyenne</span></div>`)}
 ${sec('Annales', `<div class="annals">${h}</div>`)}
 ${sec('Archives', `<div class="acts two"><button class="act" data-save="1"><span class="at"><b>Sauvegarder</b></span><span class="ad">Dans ce navigateur (aussi automatique à chaque saison)</span></button><button class="act" data-export="1"><span class="at"><b>Copier un code de partie</b></span><span class="ad">Pour reprendre sur un autre appareil</span></button><button class="act" data-new="1"><span class="at"><b>Nouvelle partie</b></span><span class="ad">Retour à l’écran d’accueil</span></button></div>`)}`;
}

/* ---------- Modales ---------- */
function modal(html, cls) { const m = $('#modal'); $('#modalBox').className = cls || ''; $('#modalBox').innerHTML = html; m.hidden = false; $('#modalBox').scrollTop = 0; }
function closeModal() { $('#modal').hidden = true; $('#modalBox').innerHTML = ''; }
function toast(t, k) { const box = $('#toast'); while (box.children.length >= 2) box.firstChild.remove(); const d = document.createElement('div'); d.className = 'toast ' + (k || ''); d.innerHTML = t; $('#toast').appendChild(d); setTimeout(() => d.classList.add('out'), 3800); setTimeout(() => d.remove(), 4500); }
function waitClick(sel) { return new Promise(res => { const h = e => { const b = e.target.closest(sel); if (!b) return; document.removeEventListener('click', h, true); res(b); }; document.addEventListener('click', h, true); }); }
function dropcap(t) { const m = t.match(/^(<b>)?([^<\s])/); if (!m) return t; return (m[1] || '') + `<span class="dc">${m[2]}</span>` + t.slice(m[0].length); }
async function showEvent(e) {
 if (e.special === 'council') return showCouncil();
 sfx('chord');
 const port = e.portrait ? cardinalPortrait(card(e.portrait) || { seed: 1, age: 50, nat: 'italien' }, 90) : e.realm && active(e.realm) ? rulerPortrait(e.realm, 90) : '';
 const opts = e.opts.map((o, i) => { const why = o.req ? o.req() : null; return `<button class="opt ${why ? 'dis' : ''}" data-opt="${i}" ${why ? 'disabled' : ''}><b>${o.t}</b><small>${why ? '⛔ ' + why : o.d}</small></button>`; }).join('');
 modal(`<div class="ev"><div class="ev-art">${sceneSVG(e.art || 'church')}${e.realm && S.realms[e.realm] ? `<div class="ev-sh">${shieldSVG(e.realm, 46)}</div>` : ''}</div><div class="ev-b"><div class="eyebrow">${dateStr()}</div><h2>${e.title}</h2><div class="ev-row">${port ? `<div class="ev-port">${port}</div>` : ''}<p class="ev-t">${dropcap(e.text)}</p></div><div class="ev-opts">${opts}</div></div></div>`, 'evm');
 const b = await waitClick('[data-opt]:not([disabled])'); const o = e.opts[+b.dataset.opt];
 sfx('seal'); const before = { a: S.authority, t: S.treasury };
 const out = o.fx ? o.fx() : null; renderAll();
 const da = S.authority - before.a, dt = S.treasury - before.t;
 if (out || Math.abs(da) >= 1 || dt) {
  $('.ev-opts').innerHTML = `<div class="ev-out">${out ? `<p>${out}</p>` : ''}<div class="deltas">${Math.abs(da) >= 1 ? `<span class="${da > 0 ? 'pos' : 'neg'}">Autorité ${sgn(da)}</span>` : ''}${dt ? `<span class="${dt > 0 ? 'pos' : 'neg'}">Trésor ${sgn(dt)}</span>` : ''}</div><button class="big" data-cont="1">Continuer</button></div>`;
  await waitClick('[data-cont]');
 }
 closeModal();
}
async function showCouncil() {
 sfx('gold'); const av = availableDecrees(); const n = councilSlots(); const chosen = new Set();
 const draw = () => modal(`<div class="ev"><div class="ev-art">${sceneSVG('mitres')}</div><div class="ev-b"><div class="eyebrow">${dateStr()}</div><h2>${councilName()}</h2><p class="ev-t">${dropcap(`Quatre cents évêques, huit cents abbés et les procureurs des rois emplissent la basilique. Choisissez jusqu’à <b>${n}</b> canons que le concile adoptera sous votre présidence.`)}</p>
 <div class="decpick">${av.map(k => `<button class="dp ${chosen.has(k) ? 'on' : ''}" data-dec="${k}"><b>${DECREES[k].n}</b><small>${DECREES[k].d}</small></button>`).join('')}</div><button class="big" data-cdone="1">Promulguer ${chosen.size ? `(${chosen.size}/${n})` : ''}</button></div></div>`, 'evm');
 draw();
 while (true) {
  const b = await waitClick('[data-dec],[data-cdone]');
  if (b.dataset.cdone) break;
  const k = b.dataset.dec; if (chosen.has(k)) chosen.delete(k); else if (chosen.size < n) chosen.add(k); sfx('click'); draw();
 }
 closeModal(); closeCouncil([...chosen]); renderAll(); toast(`Le concile a promulgué ${chosen.size} décret${chosen.size > 1 ? 's' : ''}.`, 'gold');
}
async function runEvents() { let g = 0; while (S.events.length && g++ < 40) { const e = S.events.shift(); try { await showEvent(e); } catch (err) { console.error(err); closeModal(); } } }
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function runConclave() {
 sfx('bell'); const reason = S.pendingConclave.reason;
 const last = S.popes[S.popes.length - 1];
 if (last && last.sum) { const m = last.sum; const it = (v, n, inv) => v ? `<span class="${(inv ? -v : v) > 0 ? 'pos' : 'neg'}">${n} ${sgn(v)}</span>` : '';
  modal(`<div class="rep bilan"><div class="bl-h"><div>${portraitSVG({ seed: last.seed, kind: 'pope', age: last.age || 70, w: 110, bg: '#2a0a0a' })}</div><div><div class="eyebrow">${reason === 'abdication' ? 'Renonciation' : 'Requiescat in pace'}</div><h2>${last.name} ${m.ep}</h2><p class="mut">${last.from}–${last.to} · ${m.yrs ? m.yrs + ' an' + (m.yrs > 1 ? 's' : '') + ' de pontificat' : 'moins d’un an de pontificat'}${last.age ? ' · mort à ' + last.age + ' ans' : ''}</p></div></div>
  <div class="deltas">${it(Math.round(m.a), 'Autorité')}${it(Math.round(m.f), 'Ferveur')}${it(Math.round(m.c), 'Corruption', 1)}${it(Math.round(m.t), 'Trésor')}${it(m.prov, 'Provinces catholiques')}</div>
  <ul class="bl-l">${m.cw ? `<li>${m.cw} croisade${m.cw > 1 ? 's' : ''} victorieuse${m.cw > 1 ? 's' : ''}</li>` : ''}${m.cf ? `<li>${m.cf} croisade${m.cf > 1 ? 's' : ''} manquée${m.cf > 1 ? 's' : ''}</li>` : ''}${m.dec ? `<li>${m.dec} décret${m.dec > 1 ? 's' : ''} conciliaire${m.dec > 1 ? 's' : ''}</li>` : ''}${m.b ? `<li>${m.b} chantier${m.b > 1 ? 's' : ''} achevé${m.b > 1 ? 's' : ''} à Rome</li>` : ''}${m.ord ? `<li>${m.ord} ordre${m.ord > 1 ? 's' : ''} approuvé${m.ord > 1 ? 's' : ''}</li>` : ''}${m.ach.map(a => `<li class="g">Haut fait : ${a}</li>`).join('')}</ul>
  <p class="ev-t">${m.yrs < 2 ? 'Un règne trop bref pour marquer l’histoire.' : m.a > 10 ? 'Il laisse une Église plus forte qu’il ne l’avait trouvée.' : m.a < -10 ? 'Il laisse à son successeur une tiare alourdie de périls.' : 'Il a tenu la barque de Pierre à flot.'}</p><button class="big" data-cont="1">Ouvrir le conclave</button></div>`, 'repm');
  await waitClick('[data-cont]'); }
 const cv = conclaveSetup();
 const candH = () => cv.cands.map(id => { const c = card(id); return `<div class="cc ${cv.backed === id ? 'on' : ''}">${cardinalPortrait(c, 74)}<b>${cname(c)}</b><small>${NAT_FLAG(c.nat)} ${c.age} ans</small><small><span class="tr ${POPE_TRAITS[c.trait].v ? '' : 'bad'}">${POPE_TRAITS[c.trait].n}</span></small><small>Comp. ${c.comp} · piété ${c.piety} · ambition ${c.amb}</small><button class="${cv.backed === id ? 'on' : ''}" data-back="${id}">${cv.backed === id ? 'Votre candidat' : 'Soutenir'}</button></div>`; }).join('');
 const draw = () => modal(`<div class="ev-art conc-art">${sceneSVG('conclave')}</div><div class="conc"><div class="chimney"><div class="smoke"></div></div><div class="eyebrow">Sede vacante · ${dateStr()}</div><h2>Le conclave</h2><p class="ev-t">${reason === 'abdication' ? `${last.name} a renoncé à la tiare.` : `${last.name} est mort.`} Les ${S.cardinals.length} cardinaux sont enfermés au palais${S.decrees.includes('ubi') ? ', au pain et à l’eau selon la constitution Ubi periculum' : ''}. Il faut ${Math.ceil(S.cardinals.length * 2 / 3)} voix. Le défunt pontife avait ses préférés : vos fidèles suivront votre candidat.</p>
 <div class="ccs">${candH()}</div><label class="tog"><input type="checkbox" id="bribe" ${cv.bribe ? 'checked' : ''} ${S.treasury < 60 ? 'disabled' : ''}><span><b>Distribuer des présents (60 marcs)</b><small>Simonie : les cardinaux avides suivront votre candidat · corruption +6</small></span></label>
 <div id="votes"></div><button class="big" data-scrut="1" ${cv.backed ? '' : 'disabled'}>Ouvrir le scrutin</button></div>`, 'evm conm');
 draw();
 while (true) { const b = await waitClick('[data-back],[data-scrut]'); if (b.dataset.back) { cv.backed = +b.dataset.back; cv.bribe = $('#bribe') && $('#bribe').checked; draw(); continue; } cv.bribe = $('#bribe') && $('#bribe').checked; break; }
 if (cv.bribe) { modT(-60); modC(6); }
 $('[data-scrut]').remove(); document.querySelectorAll('[data-back]').forEach(x => x.disabled = true);
 while (!cv.done) {
  const { votes, need } = conclaveRound(cv);
  const tot = S.cardinals.length;
  $('#votes').innerHTML = `<div class="round">Scrutin n° ${cv.round}</div>` + cv.cands.map(id => `<div class="vrow"><span>${cname(card(id))}</span><div class="bar ${id === cv.backed ? 'gold' : 'steel'}"><i style="width:${votes[id] / tot * 100}%"></i><em style="left:${need / tot * 100}%"></em></div><b>${votes[id]}</b></div>`).join('');
  const sm = $('.smoke'); sm.className = 'smoke ' + (cv.done ? 'white' : 'black'); void sm.offsetWidth; sm.classList.add('go');
  sfx(cv.done ? 'bell' : 'click');
  await sleep(cv.done ? 900 : 1300);
 }
 const el = card(cv.done.id);
 const names = PNAMES_LIST.map(n => `<button class="pn" data-pname="${n}">${n} ${roman((S.pnames[n] || 0) + 1)}</button>`).join('');
 $('#votes').insertAdjacentHTML('beforeend', `<div class="habemus"><div class="hp">${cardinalPortrait(el, 110)}</div><div><div class="eyebrow">Fumée blanche</div><h2>Habemus papam !</h2><p>${cname(el)}${cv.done.id === cv.backed ? ', votre candidat,' : ''} est élu${cv.round > 1 ? ` au ${cv.round}e tour` : ' dès le premier tour'}. ${cv.done.split ? 'L’élection a été disputée…' : ''} Quel nom prendra-t-il ?</p><div class="pns">${names}</div></div></div>`);
 $('.habemus').scrollIntoView({ behavior: 'smooth', block: 'start' });
 const nb = await waitClick('[data-pname]');
 electPope(cv, nb.dataset.pname); sfx('gold'); closeModal(); renderAll();
 await runEvents();
}
function showReport(rep) {
 const d = rep.d; const ln = rep.lines.filter(l => l.k !== 'info' || rep.lines.length < 14).slice(-18);
 const pill = (n, v, inv) => `<span class="${(inv ? -v : v) >= 0 ? 'pos' : 'neg'}">${n} ${sgn(v)}</span>`;
 if (S.over) return showGameOver();
 if (!ln.length && Math.abs(d.a) < 1) { toast(`${SEASONS[S.season]} ${S.year} : la saison s’ouvre calmement.`); return; }
 modal(`<div class="rep"><div class="eyebrow">Rapport de la Chambre apostolique</div><h2>${SEASONS[S.season]} ${S.year}</h2><div class="deltas">${pill('Trésor', d.t)}${pill('Autorité', d.a)}${pill('Ferveur', d.f)}${pill('Corruption', d.c, 1)}</div><div class="rep-l">${ln.map(l => `<div class="lg ${l.k}">${l.t}</div>`).join('') || '<p class="mut">Rien de notable.</p>'}</div>${agenda().filter(x => x.l === 'crit').map(x => `<div class="agi crit"><i>‼</i><span>${x.t}</span></div>`).join('')}<button class="big" data-close="1">Gouverner</button></div>`, 'repm');
}
function showGameOver() {
 sfx(S.over.reason === 'fin' ? 'gold' : 'bad'); localStorageSafeRemove(); if (!S.hofDone) { S.hofDone = 1; hofAdd(); }
 const lineage = S.popes.map(x => `<div class="lin"><div>${portraitSVG({ seed: x.seed, kind: 'pope', age: 65, w: 34, bg: '#4a1010' })}</div><div><b>${x.name}${x.sum ? ' ' + x.sum.ep : ''}</b><small>${x.from}–${x.to}</small></div></div>`).join('');
 const achs = Object.keys(S.ach).map(k => `<span class="tr">${ACH[k].n}</span>`).join('') || '<span class="mut">Aucun</span>';
 modal(`<div class="rep go"><div class="ev-art">${sceneSVG(S.over.reason === 'fin' ? 'book' : 'fire')}</div><h2>${S.over.t}</h2><p class="ev-t">${S.over.d}</p><div class="glory"><b>${fmt(glory())}</b><span>points de gloire</span></div><p><b>${S.popes.length + 1}</b> papes ont régné sous votre conduite, de ${SCEN[S.scen].year} à ${S.year}.</p><div class="traits">${achs}</div><h3 class="go-h">La lignée</h3><div class="go-lin">${lineage}</div><button class="big" data-new="1">Nouvelle partie</button></div>`, 'repm');
}
function localStorageSafeRemove() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } }
function showGuide() {
 modal(`<div class="rep guide"><h2>Comment gouverner l’Église</h2>
 <p><b>Le tour.</b> Chaque tour est une saison. Vous disposez de <b>sceaux</b> (3 à 6) pour vos bulles : prêcher, exiger les investitures, excommunier, envoyer des légats, lancer des chantiers, convoquer des conciles, appeler à la croisade. Les actions sans sceau (aumônes, recrutement, offices) sont libres. Touchez ensuite <b>Clore la saison</b> : le monde vit, des événements surviennent, vous tranchez.</p>
 <p><b>Autorité.</b> Votre ressource maîtresse. Elle croît par les victoires de l’Église (pénitences royales, conciles, croisades réussies, Jubilés) et s’use naturellement. La corruption, les schismes, l’exil et les hérésies la rongent. Si elle reste à zéro un an, la papauté s’effondre.</p>
 <p><b>Les royaumes.</b> Chaque souverain a son caractère. Exiger les investitures enrichit l’Église mais irrite les rois ; les concéder les apaise. Un roi qui offense l’Église peut être excommunié — sanction <i>justifiée</i> qui grandit le pape, ou abusive qui le discrédite. L’interdit accroît la pression ; tôt ou tard, le pénitent viendra à Canossa… ou marchera sur Rome, ou fera élire un antipape.</p>
 <p><b>La foi.</b> La ferveur nourrit dîmes et autorité ; la corruption et la tiédeur font naître des hérésies qui se propagent de royaume en royaume. Prédicateurs, légats, ordres mendiants, Inquisition (efficace mais redoutée) et croisades contre les hérétiques sont vos armes.</p>
 <p><b>Rome.</b> Le peuple et les grandes familles font et défont la paix de la Ville. Sous 22 de stabilité, Rome peut se soulever et chasser le pape. Les chantiers embellissent la Ville et vous servent durablement.</p>
 <p><b>La Curie.</b> Nommez camerlingue, vice-chancelier, pénitencier, inquisiteur ; créez des cardinaux (deux par an), surveillez les ambitieux déloyaux. À votre mort, le conclave élit votre successeur parmi eux — vous continuez la partie avec le nouveau pape.</p>
 <p><b>Succession.</b> Dans la Curie, la section <i>Papabili</i> montre les favoris du prochain conclave ; désignez un dauphin pour qu’il soit toujours candidat et que vos fidèles le portent. Chaque pape reçoit à sa mort un bilan et un surnom.</p>
 <p><b>Guerres et rois.</b> Arbitrez la paix entre chrétiens, ou soutenez l’un des belligérants (subsides et bénédiction). Un roi excommunié peut voir ses princes élire un anti-roi : reconnaissez-le, et s’il triomphe, le royaume vous devra tout. Les conquêtes trop vastes se révoltent, et les unions dynastiques (Kalmar, Krewo, Rois catholiques) redessinent la carte.</p>
 <p><b>Croisades.</b> Deux saisons de prédication, puis la marche et la campagne. Seuls les rois en paix, amis du pape et non excommuniés prennent la croix. Les ordres militaires et votre vocation renforcent l’ost.</p>
 <p><b>La carte.</b> Glissez pour vous déplacer, pincez ou molette pour zoomer, touchez un royaume pour l’ouvrir. Les modes (relations, ferveur, hérésie, investitures, religions) révèlent l’état de la Chrétienté.</p>
 <p><b>Fin.</b> La partie s’achève en 1517 : votre gloire mesure l’œuvre de toute la lignée.</p>
 <button class="big" data-close="1">Fermer</button></div>`, 'repm');
}
function showMenu() {
 modal(`<div class="rep"><h2>Menu</h2><div class="acts"><button class="act" data-save="1"><span class="at"><b>Sauvegarder</b></span></button><button class="act" data-export="1"><span class="at"><b>Copier un code de partie</b></span></button><button class="act" data-guide="1"><span class="at"><b>Guide du pontife</b></span></button><button class="act" data-music="1"><span class="at"><b>${MUS ? 'Couper la musique' : 'Musique (plain-chant)'}</b></span></button><button class="act" data-sound="1"><span class="at"><b>${UI.sound ? 'Couper les sons' : 'Activer les sons'}</b></span></button><button class="act" data-bug="1"><span class="at"><b>🐞 Signaler un problème à Claude</b></span><span class="ad">Envoie une capture et l’état du jeu</span></button><button class="act" data-new="1"><span class="at"><b>Nouvelle partie</b></span></button></div><button class="big" data-close="1">Reprendre</button></div>`, 'repm');
}

/* ---------- Événements DOM ---------- */
function selectRealm(r, fromMap) { if (r === 'etats') { UI.sel = null; UI.tab = 'rome'; sfx('click'); renderAll(); return; } UI.sel = r || null; UI.tab = 'royaume'; sfx('click'); renderAll(); if (r && !fromMap) focusRealm(r); if (window.innerWidth < 900 && fromMap) $('#panel').scrollIntoView({ behavior: 'smooth' }); }
const SEASON_ART = ['Ver', 'Aestas', 'Autumnus', 'Hiems'];
function seasonCard() {
 return new Promise(res => {
  const d = document.createElement('div'); d.id = 'scard'; d.className = 'sc' + S.season;
  d.innerHTML = `<div class="sc-in"><div class="sc-l">${SEASON_ART[S.season]}</div><div class="sc-t">${SEASONS[S.season]}</div><div class="sc-y">Anno Domini ${S.year}</div><div class="sc-p">${popeName()} · ${Math.round(S.authority)} d’autorité</div></div>`;
  document.body.appendChild(d); let done = false; const end = () => { if (done) return; done = true; d.classList.add('out'); setTimeout(() => { d.remove(); res(); }, 450); };
  d.addEventListener('click', end); setTimeout(end, 1400);
 });
}
async function endTurn() {
 if (UI.busy || S.over) return; UI.busy = true; renderEnd();
 try {
  if (S.seals > 0 && !UI.warned) { UI.warned = true; toast(`Il vous reste ${S.seals} sceau${S.seals > 1 ? 'x' : ''} inutilisé${S.seals > 1 ? 's' : ''}. Touchez de nouveau pour clore la saison.`); UI.busy = false; renderEnd(); return; }
  UI.warned = false; sfx('bell');
  const rep = endSeason(); renderAll();
  await seasonCard();
  await runEvents();
  if (S.pendingConclave) await runConclave();
  saveGame(); renderAll(); showReport(rep);
 } catch (e) { console.error(e); toast('Erreur : ' + e.message, 'bad'); }
 UI.busy = false; renderEnd();
}
function onChange(e) {
 const t = e.target;
 if (t.id === 'stName') { START.name = t.value; startScreen(); }
 if (t.id === 'stFam') START.fam = t.value;
 if (t.id === 'stNat') START.nat = t.value;
 if (t.id === 'stFlaw') START.flaw = t.checked;
 if (t.dataset.office) { const k = t.dataset.office; const old = S.offices[k] && card(S.offices[k]); if (old) old.office = null; const c = t.value ? card(+t.value) : null; if (c) { for (const kk in S.offices) if (S.offices[kk] === c.id) S.offices[kk] = null; c.office = k; } S.offices[k] = c ? c.id : null; S.seals = Math.min(S.seals, sealsMax()); UI.keepScroll = true; renderAll(); }
 if (t.dataset.indulg) { S.indulg = t.checked; UI.keepScroll = true; renderAll(); }
 if (t.id === 'legSel') { const b = t.parentElement.querySelector('[data-act="legat"]'); if (b) { const a = JSON.parse(b.dataset.a); a.c = +t.value; b.dataset.a = JSON.stringify(a); } }
}
function onClick(e) {
 const t = e.target.closest('button,[data-realm]'); if (!t) return;
 if (t.closest('#modal') && !['close', 'new', 'save', 'export', 'guide', 'imp', 'copy', 'act', 'music', 'sound', 'bug'].some(k => t.dataset[k] !== undefined)) return;
 const d = t.dataset;
 if (d.scen) { START.scen = d.scen; START.name = null; startScreen(); return; }
 if (d.voc) { START.voc = d.voc; startScreen(); return; }
 if (d.diff) { START.diff = +d.diff; startScreen(); return; }
 if (['stStart', 'stLoad', 'stCloudLoad', 'stTest'].includes(t.id) || d.imp) mapPret();
 if (t.id === 'stStart') { START.fam = ($('#stFam').value || 'de Rome').trim(); newGame(START); audio(); sfx('gold'); enterGame(true); setTimeout(() => toast(`${popeName()} coiffe la tiare. Que votre règne commence !`, 'gold'), 300); return; }
 if (t.id === 'stLoad') { if (loadGame()) enterGame(); return; }
 if (t.id === 'stCloudLoad') { if (UI.cloud && loadFromString(UI.cloud.s)) { saveGame(); enterGame(); toast('Partie reprise depuis votre sauvegarde en ligne.'); } else toast('Sauvegarde en ligne illisible.', 'bad'); return; }
 if (t.id === 'stTest') { modeTest(); return; }
 if (d.bug) { if (t.closest('#modal')) closeModal(); signaler(); return; }
 if (t.id === 'stImport') { modal(`<div class="rep"><h2>Importer une partie</h2><textarea id="impCode" rows="6" placeholder="Collez ici votre code"></textarea><button class="big" data-imp="1">Charger</button><button class="ghost" data-close="1">Annuler</button></div>`, 'repm'); return; }
 if (d.imp) { if (importCode($('#impCode').value)) { closeModal(); enterGame(); } else toast('Code illisible.', 'bad'); return; }
 if (d.close) { if ($('#noWel') && $('#noWel').checked) { try { localStorage.setItem('sp_welcome', '1'); } catch (er) { } } closeModal(); return; }
 if (d.guide) { showGuide(); return; }
 if (d.menu) { showMenu(); return; }
 if (d.sound) { UI.sound = !UI.sound; renderTop(); return; }
 if (d.music) { if (MUS) stopMusic(); else { const was = UI.sound; UI.sound = true; startMusic(); UI.sound = was; } renderTop(); return; }
 if (d.save) { toast(saveGame() ? 'Partie sauvegardée.' : 'Sauvegarde impossible dans ce navigateur.'); return; }
 if (d.export) { const code = exportCode(); modal(`<div class="rep"><h2>Code de partie</h2><p class="mut">Copiez ce texte et collez-le dans « Importer un code » sur un autre appareil.</p><textarea rows="7" readonly onclick="this.select()">${code}</textarea><button class="big" data-copy="1">Copier</button><button class="ghost" data-close="1">Fermer</button></div>`, 'repm'); return; }
 if (d.copy) { const ta = $('#modalBox textarea'); try { navigator.clipboard.writeText(ta.value).then(() => toast('Code copié.'), () => { ta.select(); toast('Sélectionnez puis copiez le texte.'); }); } catch (er) { ta.select(); } return; }
 if (d.new) { if (S && S.test) { location.reload(); return; } closeModal(); START.name = null; startScreen(); return; }
 if (d.tab) { UI.tab = d.tab; if (d.tab !== 'royaume') { } sfx('click'); renderPanel(); return; }
 if (d.realm !== undefined && !t.closest('#modal')) { selectRealm(d.realm); return; }
 if (d.mode) { MAP.mode = d.mode; renderMap(); renderEnd(); return; }
 if (d.z) { const w = $('#mapWrap'); if (d.z === '0') mapReset(); else zoomAt(d.z === '1' ? 1.35 : 1 / 1.35, w.clientWidth / 2, w.clientHeight / 2); return; }
 if (d.fisc) { S.fisc = +d.fisc; UI.keepScroll = true; renderAll(); return; }
 if (d.dauphin) { const id = +d.dauphin; S.dauphin = S.dauphin === id ? null : id; if (S.dauphin) { const c = card(id); modLoy(-3, x => x !== c && x.amb >= 7); toast(`${cname(c)} est désigné comme votre successeur pressenti. Les ambitieux grincent des dents.`); } UI.keepScroll = true; renderPanel(); return; }
 if (d.csort) { UI.curiaSort = d.csort; UI.keepScroll = true; renderPanel(); return; }
 if (t.id === 'endTurn') { endTurn(); return; }
 if (d.act) {
  if (S.over) return; const a = JSON.parse(d.a || '{}'); const id = d.act;
  if (id === 'abdiquer' && !t.dataset.sure) { t.dataset.sure = 1; t.querySelector('.ad').textContent = 'Touchez encore pour confirmer : le conclave s’ouvrira aussitôt.'; return; }
  if (id === 'disgrace' && !t.dataset.sure) { t.dataset.sure = 1; t.querySelector('.ad').textContent = 'Touchez encore pour confirmer.'; return; }
  const r = doAct(id, a);
  if (!r.ok) { toast(r.msg, 'bad'); sfx('click'); return; }
  sfx(ACT[id].s ? 'seal' : 'click');
  UI.keepScroll = true; renderAll();
  if (r.msg === 'conclave') { (async () => { UI.busy = true; renderEnd(); await runConclave(); saveGame(); UI.busy = false; renderAll(); })(); return; }
  if (r.msg) toast(r.msg);
  if (id === 'croisade' || id === 'concile') sfx('gold');
  return;
 }
}
window.addEventListener('DOMContentLoaded', boot);
