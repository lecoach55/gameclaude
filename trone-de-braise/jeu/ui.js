'use strict';
/* =========================================================
   Interface : écrans, carte, panneaux, fenêtres, donjon (entrées + HUD), sauvegarde
   ========================================================= */
const $ = s => document.querySelector(s);
const CLE = 'tdb-v1';
let G = null, MODE = 'accueil', A = null, XP = null, TK = null, TEST = false;
const UI = { sel: null, cibles: null, amis: null, survol: null, fleches: [], mode: null, de: null, auto: false };
const nf = n => Math.round(n).toLocaleString('fr-FR');
const esc = s => String(s).replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
function montrer(id) { if (id !== MODE) { const f = $('#fondu'); f.style.transition = 'none'; f.classList.add('on'); void f.offsetWidth; f.style.transition = ''; requestAnimationFrame(() => f.classList.remove('on')); } document.querySelectorAll('.ecran').forEach(e => e.classList.toggle('on', e.id === id)); MODE = id; if (id === 'royaume') { redim(); AUDIO.musiqueDe('royaume'); } if (id === 'donjon') { redim(); AUDIO.musiqueDe('donjon'); } if (id === 'accueil') AUDIO.musiqueDe(null); }
function toast(s, d = 2600) { const t = $('#toast'); t.innerHTML = s; t.style.opacity = 1; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => { t.style.opacity = 0; t.classList.remove('on'); }, d); }
document.addEventListener('pointerdown', () => AUDIO.init(), { once: true });
document.addEventListener('keydown', () => AUDIO.init(), { once: true });
if ('ontouchstart' in window || navigator.maxTouchPoints > 1) document.body.classList.add('tact');

/* ---------- sauvegarde ---------- */
function sauver() {
 if (!G) return;
 if (MODE !== 'donjon') { const ob = verifierObjectif(G); if (ob) { SON('victoire'); toast(`🎯 Objectif accompli !<br><small>${esc(ob.t.replace(/ \(.*\)$/, ''))}</small><br>Récompense : <b>${esc(ob.r)}</b>`, 5000); majBarre(); } majObjectif(); }
 if (TEST) return; G.sauveT = Date.now();
 try { const s = JSON.stringify(G); localStorage.setItem(CLE, s); NUAGE.sauver(s, { an: G.an, s: G.saison, nom: G.joueur.heros.nom }); } catch (e) { console.warn(e); }
}
function restaurer(s) { const g = completer(JSON.parse(s)); let mx = 0; const scan = o => { if (o && typeof o === 'object') { if (o.ilvl && o.id > mx) mx = o.id; for (const k in o) scan(o[k]); } }; scan(g); UID_OBJ = mx + 1; return g; }
function lireLocal() { try { const s = localStorage.getItem(CLE); return s ? { s, t: JSON.parse(s).sauveT || 0 } : null; } catch (e) { return null; } }

/* ---------- accueil ---------- */
const braises = { p: [] };
function animBraises(dt) {
 const c = $('#braises'), g = c.getContext('2d'); if (c.width !== innerWidth) { c.width = innerWidth; c.height = innerHeight; }
 g.clearRect(0, 0, c.width, c.height);
 if (braises.p.length < 140) braises.p.push({ x: Math.random() * c.width, y: c.height + 10, v: 20 + Math.random() * 60, s: 1 + Math.random() * 2.5, f: Math.random() * 6, a: 1 });
 for (const p of braises.p) { p.y -= p.v * dt; p.x += Math.sin(p.f += dt * 2) * 12 * dt; p.a -= dt * .12; g.fillStyle = `rgba(255,${120 + p.s * 40 | 0},40,${Math.max(0, p.a)})`; g.beginPath(); g.arc(p.x, p.y, p.s, 0, 6.28); g.fill(); }
 braises.p = braises.p.filter(p => p.a > 0 && p.y > -10);
}
function initAccueil() {
 TEST = false; // une vraie partie reprise après le mode test doit de nouveau se sauvegarder
 const l = lireLocal();
 $('#bContinuer').style.display = l ? '' : 'none';
 NUAGE.charger().then(d => { if (d && (!l || d.t > l.t + 5000)) { $('#bContinuer').style.display = ''; $('#bContinuer').dataset.nuage = '1'; $('#bContinuer').textContent = `▶ Continuer (${d.d && d.d.nom || 'partie'} — sauvegarde en ligne)`; braises.nuage = d.s; } }).catch(() => { });
 $('#bContinuer').onclick = () => { const s = braises.nuage && $('#bContinuer').dataset.nuage ? braises.nuage : lireLocal().s; G = restaurer(s); entrerRoyaume(); };
 $('#bNouvelle').onclick = () => { initCreation(); montrer('creation'); };
 $('#bAide').onclick = aide;
 $('#bTest').onclick = () => { TEST = true; if (TK) TK.modeTest(); G = nouvellePartie({ classe: 'chevalier', nom: 'Testeur' }); G.evts = []; entrerRoyaume(); toast('🧪 Mode test : rien n’est sauvegardé. ☰ → ▶ Banc de mesure.'); };
}
function aide() {
 fenetre('Comment jouer', `<p><b>Le royaume</b> — Chaque saison, vous disposez de <b>3 ordres</b> (points dorés en haut). Touchez une province pour la gérer : recruter, bâtir, attaquer une province voisine (bataille aux dés, façon Risk), lancer une expédition dans son donjon. Déplacer des troupes entre vos provinces est gratuit (une fois par saison). Puis « Fin de la saison » : les maisons rivales jouent, l’or rentre, des événements surviennent.</p>
 <p><b>Le but</b> — Tenir <b>Haute-Braise</b> (♛) et au moins <b>10 provinces</b> pour être couronné. Mariez-vous, ayez des héritiers : quand votre souverain meurt, son enfant reprend le flambeau avec l’armurerie familiale.</p>
 <p><b>Les donjons</b> — Combat en temps réel. <b>Clic gauche</b> : se déplacer / attaquer la cible (maintenir). <b>ZQSD / WASD / flèches</b> : se déplacer (le clic attaque alors vers le curseur). <b>Maj + clic</b> : attaquer sur place. <b>1 2 3 4</b> ou <b>clic droit</b> (compétence 1) : compétences. <b>Espace</b> : potion. <b>E</b> : descendre. <b>I</b> : sac, <b>K</b> : compétences, <b>Échap</b> : pause. Les cercles rouges au sol annoncent une attaque : sortez-en !</p>
 <p><b>Le butin compte</b> — Objets magiques (bleus), rares (jaunes), légendaires (orange) : certains légendaires agissent aussi sur le royaume (+1 ordre, +25 % d’impôts, un dé de plus en attaque…). Revendez le reste à l’armurerie pour payer vos armées.</p>
 <p><b>Le mal revient</b> — Un donjon nettoyé rend sa province prospère, mais ses créatures reviennent quelques saisons plus tard, plus fortes.</p>`, [{ t: 'Compris', f: fermer }]);
}

/* ---------- création ---------- */
const CREA = { sexe: 'h', classe: 'chevalier', dif: 'normale', mort: '0' };
function initCreation() {
 const box = $('#cClasses'); box.innerHTML = '';
 for (const id in CLASSES) {
  const C = CLASSES[id], d = document.createElement('div'); d.className = 'carte-classe' + (id === CREA.classe ? ' sel' : ''); d.dataset.c = id;
  d.innerHTML = `<canvas width="240" height="240"></canvas><h3>${C.nom}</h3><p>${C.desc}</p><div class="comp">${C.comp.map(c => c.ic + ' ' + c.nom).join(' · ')}</div>`;
  d.onclick = () => { CREA.classe = id; box.querySelectorAll('.carte-classe').forEach(x => x.classList.toggle('sel', x === d)); SON('clic'); };
  box.appendChild(d); apercuHeros(d.querySelector('canvas'), id, CREA.sexe);
 }
 const choix = (sel, k, cb) => $(sel).querySelectorAll('button').forEach(b => b.onclick = () => { CREA[k] = b.dataset.v; $(sel).querySelectorAll('button').forEach(x => x.classList.toggle('sel', x === b)); SON('clic'); cb && cb(); });
 choix('#cSexe', 'sexe', () => { $('#cNom').value = CREA.sexe === 'f' ? 'Aénor' : 'Émeric'; initCreation(); });
 choix('#cDif', 'dif'); choix('#cMort', 'mort');
 $('#cRetour').onclick = () => montrer('accueil');
 $('#cGo').onclick = () => {
  G = nouvellePartie({ classe: CREA.classe, sexe: CREA.sexe, nom: $('#cNom').value.trim() || 'Émeric', maison: $('#cMaison').value.trim() || 'Aubrac', difficulte: CREA.dif, mortReelle: CREA.mort === '1' });
  sauver(); entrerRoyaume();
 };
}
function apercuHeros(cv, classe, sexe) {
 const g = cv.getContext('2d'); const h = nouveauHeros(classe, '', sexe); h.equip.arme = { arme: CLASSES[classe].armes[0], rar: 'normal' };
 const fauxA = { X: { o: { heros: h, couleurs: ['#c8632a', '#f2d7a0'] } }, t: 0 };
 const P = { x: 0, y: 0, ang: .6, pas: 0, inv: 0, anim: 0, animT: 1, buff: 0 };
 let t0 = performance.now();
 const f = () => { if (!cv.isConnected) return; const t = (performance.now() - t0) / 1000; fauxA.t = t; P.ang = .5 + Math.sin(t * .8) * .9; P.anim = (t % 1.6) < .25 ? .25 - (t % 1.6) : 0; P.animT = .25; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 240, 240); const gr = g.createRadialGradient(120, 150, 10, 120, 150, 120); gr.addColorStop(0, 'rgba(255,170,80,.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 240, 240); g.setTransform(130, 0, 0, 130, 120, 175); dessinerHeros(g, P, fauxA); requestAnimationFrame(f); };
 f();
}

/* ---------- royaume ---------- */
const cvC = $('#carte'), ctxC = cvC.getContext('2d');
const cvJ = $('#jeu'), ctxJ = cvJ.getContext('2d');
const lum = document.createElement('canvas'), lctx = lum.getContext('2d');
const ADAPT = { e: 1, ft: [], t: 0, bon: 0 }; // résolution du donjon ajustée selon la fluidité réelle
function redim() {
 const q = Math.min(devicePixelRatio || 1, RENDU.haute ? 2 : 1.25), qj = Math.min(devicePixelRatio || 1, RENDU.haute ? 2 : 1) * ADAPT.e;
 for (const [cv, k] of [[cvC, q], [cvJ, qj]]) { const w = Math.round(innerWidth * k), h = Math.round(innerHeight * k); if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; } cv.q = k; }
 RENDU.q = qj; lum.width = Math.ceil(cvJ.width / 4); lum.height = Math.ceil(cvJ.height / 4);
 if (G) CARTE.ajuster(cvC.width, cvC.height);
}
addEventListener('resize', () => { redim(); });
function entrerRoyaume() { CARTE.V.init = false; CARTE.V.tz = undefined; montrer('royaume'); cadrerDepart(); majBarre(); panneau(); majObjectif(); traiterFile(); }
function majBarre() {
 const J = G.maisons.joueur, rev = revenus(G, 'joueur') - entretien(G, 'joueur');
 $('#barre').innerHTML = `<span class="maison">${blason('joueur', 28)}${esc(J.nom)}</span>
  <span class="res" title="Or (revenu net par saison)"><span class="ico">🪙</span><b>${nf(J.or)}</b><small style="color:${rev >= 0 ? '#8fd08f' : '#f08a7a'}">${rev >= 0 ? '+' : ''}${rev}</small></span>
  <span class="res" title="Troupes"><span class="ico">⚔️</span><b>${troupesDe(G, 'joueur')}</b></span>
  <span class="res" title="Prestige"><span class="ico">✨</span><b>${J.prestige}</b></span>
  <span class="res" title="Influence (pour les complots)"><span class="ico">🕯️</span><b>${J.influence}</b></span>
  <span class="res" title="Provinces tenues (10 et Haute-Braise pour la couronne)"><span class="ico">🏰</span><b>${provincesDe(G, 'joueur').length}</b>/10</span>
  <span class="esp"></span>
  <span class="saison">${SAISONS[G.saison]} de l’an ${G.an}</span>
  <span class="ordres" title="Ordres restants cette saison">${[...Array(ordresMax(G))].map((_, i) => `<i class="${i < G.ordres ? '' : 'vide'}"></i>`).join('')}</span>`;
 $('#finSaison').classList.toggle('pret', G.ordres === 0);
 const pts = G.joueur.heros.points; $('#bArm').innerHTML = '🛡️' + (pts ? `<span class="pastille">${pts}</span>` : '');
}
function relTxt(v) { return v >= 60 ? 'amicale' : v >= 25 ? 'cordiale' : v > -25 ? 'neutre' : v > -60 ? 'hostile' : 'haineuse'; }
function etatMaison(m) { if (m === 'joueur' || m === 'rebelles') return ''; const J = G.maisons.joueur; return enGuerre(G, 'joueur', m) ? '<span class="etiq g">guerre</span>' : J.alliance[m] ? '<span class="etiq a">alliance</span>' : '<span class="etiq p">paix</span>'; }
let dernierSel = undefined;
function panneau() {
 const el = $('#panneau'); majBarre(); $('#royaume').classList.toggle('avecsel', !!UI.sel);
 if (dernierSel !== UI.sel) { el.classList.remove('anim'); void el.offsetWidth; el.classList.add('anim'); dernierSel = UI.sel; }
 if (!UI.sel) { el.innerHTML = `<div class="pvide"><b>${esc(G.maisons.joueur.nom)}</b>Touchez une province de la carte pour la gérer : recruter, bâtir, attaquer ou partir en expédition dans son donjon.<div class="legende"><span>☠ donjon et son niveau</span><span>🛡 bannière : troupes</span><span>♛ capitale</span></div></div>`; return; }
 const p = prov(G, UI.sel), M = G.maisons[p.o], mien = p.o === 'joueur';
 const voisinsMiens = voisinsDe(p.id).map(id => prov(G, id)).filter(q => q.o === 'joueur');
 const proche = mien || voisinsMiens.length > 0;
 const D = DONJONS[p.donjon];
 const bat = Object.keys(p.bat).filter(k => p.bat[k]).map(k => ({ marche: 'marché', caserne: 'caserne', temple: 'temple' }[k]));
 let h = `<div class="ptete" style="--c1:${M.c1}"><h3>${blason(p.o, 34)}<span>${esc(p.nom)}${p.capitale ? ' ♛' : ''}</span></h3>
  <div class="qui">${p.o === 'rebelles' ? 'Terres libres : brigands et insoumis' : `Maison ${esc(M.nom)} ${etatMaison(p.o)}${!mien ? `<br>Relation ${relTxt(M.rel.joueur)} (${Math.round(M.rel.joueur)})` : ''}`}</div></div>
  <div class="pcorps"><div class="grille-info">
   <div class="gi"><small>Troupes</small><b>⚔️ ${p.t}</b></div>
   <div class="gi"><small>Château</small><b>${p.c ? '🏰 niveau ' + p.c : '—'}</b></div>
   <div class="gi"><small>Prospérité</small><span class="etoiles">${'★'.repeat(p.p)}${'☆'.repeat(5 - p.p)}</span></div>
   <div class="gi"><small>Revenu</small><b>🪙 ${Math.round(revenuProv(G, p))}</b></div></div>
   <div class="loyaute"><span>Loyauté</span><span>${Math.round(p.loy)} %</span></div><div class="jauge"><i style="width:${clamp(p.loy, 0, 100)}%"></i></div>
   ${bat.length ? `<div class="batis">🏛️ ${bat.join(', ')}</div>` : ''}
   <div class="donjon-l ${p.nettoye ? 'purge' : ''}"><span class="crane">${p.nettoye ? '🕯️' : '☠'}</span><div><b>${D.nom}</b><small>${p.nettoye ? `Purgé — le mal reviendra dans ~${p.nettoye} saison${p.nettoye > 1 ? 's' : ''}` : `Niveau ${p.dniv} · trois étages et un maître`}</small></div></div>
  </div><div class="acts">`;
 const o = G.ordres > 0, J = G.maisons.joueur, combat = !G.joueur.blesse && !G.joueur.regence;
 const b = (ic, lb, sous, ct, act, ok = true, cls = '') => `<button class="act ${cls}" data-a="${act}" ${ok ? '' : 'disabled'}><span class="ic">${ic}</span><span class="lb">${lb}${sous ? `<small>${sous}</small>` : ''}</span><span class="ct">${ct || ''}</span></button>`;
 if (proche && !p.nettoye) h += b('☠', 'Expédition', `${D.nom}, niveau ${p.dniv}`, '1 ordre', 'expedition', o && combat, 'dore');
 if (mien) {
  h += b('➕', `Recruter ${4 + (p.bat.caserne ? 2 : 0) + (p.capitale ? 2 : 0)} hommes`, 'Lever des troupes ici', '30 🪙', 'recruter', o && J.or >= 30);
  h += b('⚔️', 'Attaquer une voisine', 'Choisir la cible sur la carte', '1 ordre', 'attaquerDepuis', o && p.t > 1 && voisinsDe(p.id).some(id => prov(G, id).o !== 'joueur'), 'chaud');
  h += b('🚶', 'Déplacer des troupes', G.dejaBouge[p.id] ? 'Déjà en marche cette saison' : 'Vers une de vos provinces', 'gratuit', 'deplacer', p.t > 1 && !G.dejaBouge[p.id] && voisinsMiens.length > 0);
  h += b('🔨', 'Bâtir', 'Marché, caserne, temple, murailles', '', 'batir', o);
 } else if (proche) {
  h += b('⚔️', 'Attaquer', `Depuis ${voisinsMiens.filter(q => q.t > 1).map(q => q.nom).join(', ') || '—'}`, '1 ordre', 'attaquer', o && voisinsMiens.some(q => q.t > 1), 'chaud');
  if (p.o !== 'rebelles') h += b('🕯️', 'Fomenter une révolte', 'Complot : réduit la garnison', '3 🕯️', 'revolte', o && J.influence >= 3);
 }
 if (!mien && p.o !== 'rebelles') h += b('🤝', 'Diplomatie', `Maison ${M.nom}`, '', 'diplo');
 if (p.capitale && mien && failleOuverte(G)) h += b('🔥', `Faille de Braise`, `Palier ${G.faille.palier} · record ${G.faille.record}`, '1 ordre', 'faille', o && combat, 'chaud');
 h += '</div>';
 if (!combat && proche && !p.nettoye) h += `<div class="pinfo" style="padding:0 18px 14px;color:#f0a8a0">${G.joueur.regence ? 'Votre héritier est trop jeune pour combattre.' : `Vous êtes blessé(e) : encore ${G.joueur.blesse} saison(s) de repos.`}</div>`;
 if (!proche) h += `<div class="pinfo" style="padding:0 18px 16px">Trop loin de vos terres pour agir. Étendez-vous jusqu’à sa frontière.</div>`;
 el.innerHTML = h;
 el.querySelectorAll('button[data-a]').forEach(bt => bt.onclick = () => { SON('clic'); actionProv(p, bt.dataset.a); });
}
function actionProv(p, a) {
 if (a === 'recruter') { const r = act(G, 'recruter', { prov: p.id }); toast(r.msg); SON('tambour'); apres(); }
 else if (a === 'deplacer') { UI.mode = 'deplacer'; UI.de = p.id; UI.amis = voisinsDe(p.id).filter(id => prov(G, id).o === 'joueur'); UI.cibles = null; toast('Choisissez la province de destination (Échap pour annuler)'); }
 else if (a === 'attaquerDepuis') { UI.mode = 'attaque'; UI.de = p.id; UI.cibles = voisinsDe(p.id).filter(id => prov(G, id).o !== 'joueur'); UI.amis = null; toast('Choisissez la province à attaquer'); }
 else if (a === 'attaquer') { const src = voisinsDe(p.id).map(id => prov(G, id)).filter(q => q.o === 'joueur' && q.t > 1).sort((x, y) => y.t - x.t); fenetreAttaque(src, p); }
 else if (a === 'batir') fenetreBatir(p);
 else if (a === 'revolte') { confirmer(`Fomenter une révolte à ${p.nom} ? (3 influence, un ordre). Si le complot est découvert, la maison ${G.maisons[p.o].nom} vous en voudra.`, () => { const r = act(G, 'complot', { type: 'revolte', prov: p.id, maison: p.o }); fenetre('Complot', `<p>${r.msg}</p>`, [{ t: 'Continuer', f: fermer }]); apres(); }); }
 else if (a === 'expedition') { const r = act(G, 'expedition', {}); if (!r.ok) return toast(r.msg); apres(); lancerExpedition({ type: p.donjon, niveau: p.dniv, etages: 3, nom: `${DONJONS[p.donjon].nom} de ${p.nom}`, proprio: p.o }, X => { const res = finExpedition(G, p.id, X); resumeExpedition(X, res.lignes); }); }
 else if (a === 'diplo') fenetreMaisons(p.o);
 else if (a === 'faille') { const r = act(G, 'expedition', {}); if (!r.ok) return toast(r.msg); apres(); lancerExpedition(configFaille(G), X => { const res = finExpedition(G, null, X, true); resumeExpedition(X, res.lignes, finFaille(G, X)); }); }
}
function apres() { sauver(); panneau(); }
function fenetreBatir(p) {
 const J = G.maisons.joueur, opts = [['marche', 'Marché', COUTS.marche, '+6 or par saison'], ['caserne', 'Caserne', COUTS.caserne, '+2 recrues par levée'], ['temple', 'Temple', COUTS.temple, '+loyauté, +influence'], ['fortifier', `Fortifier (niveau ${p.c + 1})`, COUTS.fortifier * (p.c + 1), p.c >= 1 ? 'un dé de défense de plus (niv. 2), +1 au meilleur dé (niv. 3)' : 'défense accrue']];
 fenetre(`Bâtir à ${p.nom}`, `<p>Or disponible : <b>${nf(J.or)}</b></p>`, opts.map(([k, n, c, d]) => ({ t: `${n} — ${c} or <small style="color:#a98">(${d})</small>`, ok: J.or >= c && (k === 'fortifier' ? p.c < 3 : !p.bat[k]), f: () => { const r = act(G, 'batir', { prov: p.id, bat: k }); fermer(); toast(r.msg); SON('tambour'); apres(); } })).concat([{ t: 'Annuler', f: fermer }]));
}
function chancesAttaque(n, def, o) { let w = 0; for (let i = 0; i < 300; i++) if (bataille(G, n, def, o).gagne) w++; return w / 300; }
function fenetreAttaque(sources, cible) {
 if (!sources.length) return toast('Aucune de vos provinces voisines n’a assez de troupes.');
 let src = sources[0], n = src.t - 1, prudent = false;
 const combat = !G.joueur.blesse && !G.joueur.regence;
 const rendre = () => {
  const o = { chateau: cible.c, prudent }; const e = effetsRoyaume(G.joueur.heros); if (e.de) o.deAtt = 1;
  const ch = chancesAttaque(n, cible.t, o), chC = chancesAttaque(n, Math.max(1, cible.t - Math.ceil(cible.t * .3)), Object.assign({ bonusAtt: 1 }, o));
  const paix = cible.o !== 'rebelles' && !enGuerre(G, 'joueur', cible.o);
  $('#fen').innerHTML = `<button class="fermer" onclick="fermer()">×</button><div class="tete"><h2>Assaut sur ${esc(cible.nom)}</h2></div><div class="corps">
   ${sources.length > 1 ? `<p>Depuis : ${sources.map((s, i) => `<button class="btn petit ${s === src ? 'or' : ''}" data-s="${i}">${esc(s.nom)} (${s.t})</button>`).join(' ')}</p>` : `<p>Depuis <b>${esc(src.nom)}</b></p>`}
   <div class="armees"><div>Vos troupes<b>${n}</b></div><div style="align-self:center;font-size:26px">⚔️</div><div>Défenseurs<b>${cible.t}</b>${cible.c ? `<small>château niv. ${cible.c}</small>` : ''}</div></div>
   <input type="range" min="1" max="${src.t - 1}" value="${n}" id="aN" style="width:100%">
   <p><label><input type="checkbox" id="aP" ${prudent ? 'checked' : ''}> Prudent : sonner la retraite à 50 % de pertes</label></p>
   <p>Chances estimées : <b style="color:${ch > .6 ? '#9d9' : ch > .35 ? '#ed9' : '#e99'}">${Math.round(ch * 100)} %</b>${combat ? ` · si vous terrassez leur champion : <b>${Math.round(chC * 100)} %</b>` : ''}</p>
   ${paix ? `<p style="color:#eaa">⚠ Vous êtes en paix avec ${esc(G.maisons[cible.o].nom)} : attaquer sans déclaration coûte du prestige et la confiance des autres maisons.</p>` : ''}
   </div><div class="pied">
   <button class="btn rouge" id="aGo">🎲 Lancer l’assaut</button>
   ${combat ? `<button class="btn or" id="aCh">⚔ Mener la charge en personne (combat contre leur champion)</button>` : ''}
   <button class="btn" onclick="fermer()">Annuler</button></div>`;
  $('#voile').classList.add('on');
  $('#aN').oninput = e => { n = +e.target.value; rendre(); };
  $('#aP').onchange = e => { prudent = e.target.checked; rendre(); };
  $('#fen').querySelectorAll('[data-s]').forEach(b => b.onclick = () => { src = sources[+b.dataset.s]; n = src.t - 1; rendre(); });
  $('#aGo').onclick = () => { fermer(); lancerAttaque(src, cible, n, prudent, null); };
  if ($('#aCh')) $('#aCh').onclick = () => {
   fermer(); const rr = act(G, 'expedition', {}); if (!rr.ok) return toast(rr.msg); G.ordres++; // l'ordre est consommé par l'attaque
   lancerExpedition({ arene: { n: Math.min(12, cible.t), maison: cible.o }, niveau: Math.max(1, cible.dniv * .45 + G.joueur.heros.niveau * .55), etages: 1, nom: `Assaut sur ${cible.nom}` }, X => {
    finExpedition(G, null, X, true);
    const champ = X.resultat === 'victoire' ? 'victoire' : X.resultat === 'mort' ? 'mort' : null;
    if (X.resultat === 'mort' && G.options.mortReelle) { /* le souverain est déjà mort */ }
    lancerAttaque(src, cible, Math.min(n, src.t - 1), prudent, champ);
   });
  };
 };
 rendre();
}
function lancerAttaque(src, cible, n, prudent, champion) {
 if (src.t < 2) return toast('Plus assez de troupes');
 const avant = cible.o;
 const r = act(G, 'attaquer', { prov: src.id, vers: cible.id, n, prudent, champion });
 if (!r.ok) return toast(r.msg);
 UI.fleches.push({ de: src.id, vers: cible.id, coul: '#d8402a', t: 3 });
 UI.mode = null; UI.cibles = null; UI.sel = cible.id;
 afficherBataille(r.bataille, avant, () => { apres(); traiterFile(); });
}
function afficherBataille(b, avant, ok) {
 const M = G.maisons[b.md === 'joueur' ? b.ma : avant] || G.maisons.rebelles;
 $('#fen').innerHTML = `<div class="tete"><h2>Bataille de ${esc(b.prov)}</h2></div><div class="corps"><div class="armees"><div>${esc(G.maisons.joueur.nom)}<b id="bA">${b.n}</b></div><div style="align-self:center">contre</div><div>${esc(M.nom)}<b id="bD">${b.def0 || '?'}</b></div></div><div id="bM"></div><div id="bR"></div></div><div class="pied"><button class="btn" id="bPasser">Passer</button></div>`;
 $('#voile').classList.add('on');
 let i = 0, a = b.n, d = b.manches.reduce((s, m) => s + m.pd, 0) + b.def; $('#bD').textContent = d;
 const fini = () => { clearInterval(h); $('#bA').textContent = b.att; $('#bD').textContent = b.def; $('#bR').innerHTML = `<div class="resultat" style="font-size:18px;text-align:center">${b.gagne ? `🏆 Victoire ! ${esc(b.prov)} est à vous.` : `🛡️ L’assaut est repoussé.`}<br><small>Pertes : ${b.pertesA} contre ${b.pertesD}</small></div>`; SON(b.gagne ? 'victoire' : 'defaite'); const p = $('#bPasser'); p.textContent = 'Continuer'; p.className = 'btn or'; p.onclick = () => { fermer(); ok && ok(); }; };
 const h = setInterval(() => {
  if (i >= b.manches.length || i > 14) return fini();
  const m = b.manches[i++]; a -= m.pa; d -= m.pd; SON('des');
  const k = Math.min(m.a.length, m.d.length);
  const dA = m.a.map((v, j) => `<span class="de a ${j < k && v <= m.d[j] ? 'perdu' : ''}">${v}</span>`).join(''), dD = m.d.map((v, j) => `<span class="de d ${j < k && v < m.a[j] ? '' : j < k ? '' : ''} ${j < k && m.a[j] > v ? 'perdu' : ''}">${v}</span>`).join('');
  const el = document.createElement('div'); el.className = 'manche'; el.innerHTML = `<div class="des" style="justify-content:flex-end">${dA}</div><div style="font-size:12px;color:#a98">−${m.pa} / −${m.pd}</div><div class="des" style="justify-content:flex-start">${dD}</div>`;
  $('#bM').prepend(el); if ($('#bM').children.length > 6) $('#bM').lastChild.remove();
  $('#bA').textContent = a; $('#bD').textContent = d;
 }, 330);
 $('#bPasser').onclick = fini;
}
/* entrées sur la carte : glisser pour déplacer, molette/pincer pour zoomer, toucher pour choisir */
(() => {
 const pts = new Map(); let glisse = false, dep = null, dist0 = 0, z0 = 1;
 const pos = e => [e.offsetX * (cvC.q || 1), e.offsetY * (cvC.q || 1)];
 cvC.addEventListener('pointerdown', e => { cvC.setPointerCapture(e.pointerId); pts.set(e.pointerId, pos(e)); glisse = false; dep = pos(e); if (pts.size === 2) { const [a, b] = [...pts.values()]; dist0 = Math.hypot(a[0] - b[0], a[1] - b[1]); z0 = CARTE.V.z; } });
 cvC.addEventListener('pointermove', e => {
  const p = pos(e);
  if (pts.has(e.pointerId)) {
   const avant = pts.get(e.pointerId); pts.set(e.pointerId, p);
   if (pts.size === 2) { const [a, b] = [...pts.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); zoomer(z0 * d / dist0 / CARTE.V.z, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); glisse = true; return; }
   if (Math.hypot(p[0] - dep[0], p[1] - dep[1]) > 8 * (cvC.q || 1)) glisse = true;
   if (glisse) { const V = cam(); V.tx += p[0] - avant[0]; V.ty += p[1] - avant[1]; borner(); V.x = V.tx; V.y = V.ty; }
  } else { const [mx, my] = CARTE.versCarte(p[0], p[1]); const q = CARTE.provinceA(G, mx, my); UI.survol = q && q.id; infoProv(q, e.offsetX, e.offsetY); }
 });
 const fin = e => { const avait = pts.has(e.pointerId); pts.delete(e.pointerId); if (avait && !glisse && pts.size === 0 && e.type === 'pointerup') clicCarte(pos(e)); };
 cvC.addEventListener('pointerup', fin); cvC.addEventListener('pointercancel', fin);
 cvC.addEventListener('wheel', e => { e.preventDefault(); const p = pos(e); zoomer(e.deltaY < 0 ? 1.12 : 1 / 1.12, p[0], p[1]); }, { passive: false });
})();
function cam() { const V = CARTE.V; if (V.tz === undefined) { V.tz = V.z; V.tx = V.x; V.ty = V.y; } return V; }
function zoomer(k, cx, cy) { const V = cam(), nz = clamp(V.tz * k, V.base * .9, V.base * 3.2); k = nz / V.tz; V.tx = cx - (cx - V.tx) * k; V.ty = cy - (cy - V.ty) * k; V.tz = nz; borner(); }
function borner() { const V = cam(), w = cvC.width, h = cvC.height; V.tx = clamp(V.tx, w - 1000 * V.tz - w * .3, w * .3); V.ty = clamp(V.ty, h - 680 * V.tz - h * .3, h * .3); }
function centrerSur(p) { const V = cam(), q = cvC.q || 1, large = innerWidth > 820, w = cvC.width - (large ? 380 * q : 0), h = large ? cvC.height : cvC.height * .5; const x = V.x + p.x * V.z, y = V.y + p.y * V.z; if (x > 40 * q && x < w - 40 * q && y > 90 * q && y < h - 40 * q) return; V.tx = w / 2 - p.x * V.tz; V.ty = (large ? h / 2 : h * .55) - p.y * V.tz; borner(); }
function animerCamera(dt) { const V = cam(), k = Math.min(1, dt * 9); if (Math.abs(V.tx - V.x) + Math.abs(V.ty - V.y) + Math.abs(V.tz - V.z) * 400 < .3) { V.x = V.tx; V.y = V.ty; V.z = V.tz; return; } V.x += (V.tx - V.x) * k; V.y += (V.ty - V.y) * k; V.z += (V.tz - V.z) * k; }
function clicCarte([sx, sy]) {
 const [mx, my] = CARTE.versCarte(sx, sy); const p = CARTE.provinceA(G, mx, my);
 if (UI.mode === 'attaque') { if (p && UI.cibles.includes(p.id)) { const src = prov(G, UI.de); UI.mode = null; UI.cibles = null; fenetreAttaque([src], p); return; } UI.mode = null; UI.cibles = null; }
 if (UI.mode === 'deplacer') { if (p && UI.amis.includes(p.id)) { const src = prov(G, UI.de); UI.mode = null; UI.amis = null; fenetreDeplacer(src, p); return; } UI.mode = null; UI.amis = null; }
 UI.sel = p ? p.id : null; SON('clic'); panneau(); if (p) centrerSur(p);
}
function fenetreDeplacer(src, dst) {
 let n = src.t - 1;
 const rendre = () => { fenetre(`Marcher vers ${dst.nom}`, `<p>De ${esc(src.nom)} (${src.t}) vers ${esc(dst.nom)} (${dst.t}) :</p><div class="armees"><div>Envoyer<b>${n}</b></div></div><input type="range" min="1" max="${src.t - 1}" value="${n}" id="dN" style="width:100%"><p><small>Gratuit, mais ces troupes ne pourront plus bouger cette saison.</small></p>`, [{ t: 'Marcher', f: () => { const r = act(G, 'deplacer', { prov: src.id, vers: dst.id, n }); fermer(); toast(r.msg); UI.sel = dst.id; apres(); } }, { t: 'Annuler', f: fermer }]); $('#dN').oninput = e => { n = +e.target.value; $('#fen .armees b').textContent = n; }; };
 rendre();
}
$('#finSaison').onclick = () => {
 if (G.fin) return verifierFin();
 SON('cloche');
 const avant = { or: G.maisons.joueur.or, prov: provincesDe(G, 'joueur').length };
 finSaison(G); UI.sel = UI.sel; UI.fleches = UI.fleches.filter(f => (f.t -= 1) > 0);
 for (const e of G.evts) if (e.id === 'attaque_subie') { const q = prov(G, e.prov); const src = voisinsDe(e.prov).map(id => prov(G, id)).find(x => x.o === e.maison) || q; UI.fleches.push({ de: src.id, vers: e.prov, coul: G.maisons[e.maison].c1, t: 2 }); }
 toast(`${SAISONS[G.saison]} de l’an ${G.an} · ${G.maisons.joueur.or - avant.or >= 0 ? '+' : ''}${G.maisons.joueur.or - avant.or} or`);
 afficherNouvelles();
 sauver(); panneau(); traiterFile();
};
function traiterFile() {
 majBarre();
 if (G.succession) return fenetreSuccession();
 if (G.fin) return verifierFin();
 const e = G.evts[0]; if (!e) { sauver(); return; }
 const o = ouvrirEvt(G, e);
 const icones = { intro: '🏰', mort_roi: '👑', couronnement: '👑', naissance: '👶', declaration: '⚔️', offre_paix: '🕊️', offre_alliance: '🤝', attaque_subie: '🔥', retour_mal: '☠', tournoi: '🏇', bandits: '🗡️', duel: '⚔️', crypte_decouverte: '⚰️', dragon: '🐉', marchand: '💰', famine: '🌾', peste: '☣', prophete: '🔥', espion: '🕵️', vassal_rebelle: '😠', mariage_offre: '💍', enfant_malade: '🤒', mine_or: '⛏️', comete: '☄️', deserteurs: '🛡️', heretique: '🔮', chevalier_errant: '🐎', grande_foire: '🎪', trahison_alliee: '✉️', relique: '✝', recrue_heros: '🤺', corbeaux: '🐦‍⬛', inondation: '🌊', heritier_fugue: '🐎', tresor_royal: '💎', loups: '🐺', pelerins: '🚶', banquier: '🏦', statue: '🗿', raid_champion: '🪖', ecole: '📚', oracle: '👁️', faille_gronde: '🔥', cache_compagnon: '🍺' };
 SON('page');
 fenetre(o.titre, `<div class="illus" style="background:${teinteEvt(e.id)}"><span>${icones[e.id] || '📜'}</span></div><p>${o.texte}</p>`, o.choix.map(c => ({ t: c.t, ok: c.ok, f: () => {
  const r = choisirEvt(G, e, c.i);
  if (r.combat) {
   fermer(); const cb = r.combat;
   lancerExpedition({ type: cb.type || 'arene', arene: cb.arene, niveau: cb.niveau, etages: cb.etages || 1, nom: cb.nom, boss: cb.boss }, X => {
    const res = finExpedition(G, null, X, true); const m = apresCombatEvt(G, e, X); resumeExpedition(X, res.lignes, m);
   });
   return;
  }
  fenetre(o.titre, `<p>${r.msg || 'Ainsi soit-il.'}</p>`, [{ t: 'Continuer', f: () => { fermer(); panneau(); traiterFile(); } }]);
 } })), true);
}
function fenetreSuccession() {
 const S = G.succession, e = S.heritier;
 fenetre('Le souverain est mort', `<p>${esc(S.ancien.nom)} n’est plus. ${esc(e.nom)}, ${e.age} ans, hérite du siège d’${esc(G.maisons.joueur.nom)}${e.age < 16 ? ' (sous régence jusqu’à ses seize ans)' : ''}.</p><p>L’armurerie familiale lui revient. Quelle voie suivra ${e.sexe === 'f' ? 'la nouvelle dame' : 'le nouveau seigneur'} ?</p>`,
  Object.keys(CLASSES).sort((a, b) => (b === e.classe) - (a === e.classe)).map(c => ({ t: `${CLASSES[c].nom}${c === e.classe ? ` — <b>formé·e, niveau ${Math.max(1, e.formation || 0)}</b>` : ` — ${CLASSES[c].desc}`}`, cls: c === e.classe ? 'or' : '', f: () => { succession(G, c); fermer(); sauver(); toast(`Longue vie à ${e.nom} !`); traiterFile(); } })), true);
}
function verifierFin() {
 if (!G.fin) return;
 SON('defaite');
 fenetre(G.fin.type === 'defaite' ? 'Défaite' : 'La lignée s’éteint', `<p>${G.fin.txt}</p><p>Votre maison a tenu ${G.tour} saisons, sur ${G.joueur.generation} génération(s). Donjons purgés : ${G.stats.donjons} · batailles : ${G.stats.batailles} · créatures abattues : ${nf(G.stats.tues)}.</p>`, [{ t: '📜 Lire la chronique', f: fenetreChronique }, { t: '⚔ Nouvelle partie', f: () => { fermer(); localStorage.removeItem(CLE); initCreation(); montrer('creation'); } }], true);
}

/* ---------- fenêtres génériques ---------- */
function fenetre(titre, corps, boutons = [], sansFermer, large) {
 const f = $('#fen'); f.className = 'fenetre' + (large ? ' large' : '');
 f.innerHTML = `${sansFermer ? '' : '<button class="fermer">×</button>'}<div class="tete"><h2>${titre}</h2></div><div class="corps">${corps}</div><div class="pied"></div>`;
 const pied = f.querySelector('.pied');
 for (const b of boutons) { const e = document.createElement('button'); e.className = 'btn' + (b.cls ? ' ' + b.cls : ''); e.innerHTML = b.t; if (b.ok === false) e.disabled = true; e.onclick = () => { SON('clic'); b.f(); }; pied.appendChild(e); }
 if (!boutons.length) pied.remove();
 if (!sansFermer) f.querySelector('.fermer').onclick = fermer;
 $('#voile').classList.add('on'); if (A) A.pause = true;
 f.scrollTop = 0;
}
function fermer() { $('#voile').classList.remove('on'); if (A && MODE === 'donjon') A.pause = false; }
function confirmer(txt, f) { fenetre('Confirmer', `<p>${txt}</p>`, [{ t: 'Oui', f: () => { fermer(); f(); } }, { t: 'Non', f: fermer }]); }

/* ---------- dynastie, maisons, chronique ---------- */
$('#bDyn').onclick = () => {
 const Jo = G.joueur, h = Jo.heros, C = CLASSES[h.classe];
 const av = s => s === 'f' ? '👸' : '🤴';
 let html = `<div class="arbre"><div class="perso"><span class="av">${av(h.sexe)}</span><div><b style="color:var(--or2);font-size:18px">${esc(h.nom)}</b> d’${esc(G.maisons.joueur.nom)}<br>${C.nom}, niveau ${h.niveau} · ${Jo.age} ans · génération ${Jo.generation}${Jo.blesse ? ' · <span style="color:#e99">blessé(e)</span>' : ''}${Jo.regence ? ' · <span style="color:#e99">régence</span>' : ''}</div></div>`;
 html += Jo.conjoint ? `<div class="perso"><span class="av">💍</span><div>Époux·se : <b>${esc(Jo.conjoint.nom)}</b> ${esc(G.maisons[Jo.conjoint.maison].nom)}, ${Jo.conjoint.age} ans</div></div>` : `<div class="perso"><span class="av">💍</span><div>Pas encore marié(e). Une union scelle une alliance et donne des héritiers : passez par 🤝 Maisons → Mariage.</div></div>`;
 html += `<h4 style="margin-top:8px;color:var(--or2);font-weight:400">Enfants</h4>` + (Jo.enfants.length ? Jo.enfants.slice().sort((a, b) => b.age - a.age).map((e, i) => `<div class="perso"><span class="av">${e.age < 12 ? '👶' : av(e.sexe)}</span><div style="flex:1"><b>${esc(e.nom)}</b>, ${e.age} ans${i === 0 ? ' — <i>héritier·e</i>' : ''}<br>${e.classe ? `<small>Formé·e comme ${CLASSES[e.classe].nom.toLowerCase()} : niveau ${e.formation || 0}${(e.formation || 0) >= 10 ? ' (formation achevée)' : ' (+1 par an, 8 or par saison)'}</small>` : e.age >= 6 ? `<small>Choisir un maître d’armes :</small> ${Object.keys(CLASSES).map(c => `<button class="btn petit" data-edu="${esc(e.nom)}" data-c="${c}">${CLASSES[c].nom}</button>`).join(' ')}` : '<small>Trop jeune pour être formé·e (6 ans)</small>'}</div></div>`).join('') : '<p style="color:#a98">Aucun enfant. Sans héritier, la mort du souverain signerait la fin de la maison.</p>');
 if (Jo.lignee.length) html += `<h4 style="margin-top:8px;color:var(--or2);font-weight:400">Les ancêtres</h4>` + Jo.lignee.map(l => `<div class="perso"><span class="av">🕯️</span><div>${esc(l.nom)} (${CLASSES[l.classe].nom}, niveau ${l.niveau}) — mort(e) en ${l.fin} à ${l.age} ans, ${esc(l.cause)}</div></div>`).join('');
 html += '</div>';
 fenetre('La dynastie', html, [{ t: 'Fermer', f: fermer }]);
 $('#fen').querySelectorAll('[data-edu]').forEach(b => b.onclick = () => { const e = G.joueur.enfants.find(x => x.nom === b.dataset.edu); e.classe = b.dataset.c; e.formation = 0; SON('clic'); toast(`${e.nom} sera ${CLASSES[e.classe].nom.toLowerCase()}. Chaque année de formation lui donnera un niveau.`); sauver(); majBarre(); $('#bDyn').onclick(); });
};
$('#bMais').onclick = () => fenetreMaisons();
function fenetreMaisons(focus) {
 const J = G.maisons.joueur, o = G.ordres > 0;
 let html = `<p style="font-size:13.5px;color:#bba">Chaque action diplomatique coûte un ordre (${G.ordres} restant${G.ordres > 1 ? 's' : ''}). Influence : ${J.influence} 🕯️</p><div class="maisons">`;
 for (const m of IA_MAISONS) {
  const M = G.maisons[m]; if (M.elim) continue;
  const g = enGuerre(G, 'joueur', m), al = J.alliance[m];
  const b = (t, a, ok) => `<button class="btn petit" data-m="${m}" data-a="${a}" ${ok ? '' : 'disabled'}>${t}</button>`;
  html += `<div class="mais" ${focus === m ? 'style="border-color:var(--or)"' : ''}>${blason(m, 40)}<div><span class="nomm">${esc(M.nom)}</span> ${etatMaison(m)}<br><span class="rel">« ${esc(M.devise)} » · ${M.chef ? esc(M.chef.nom + ' ' + (M.chef.surnom || '')) + ', ' + M.chef.age + ' ans' : ''}${M.chef && M.chef.roi ? ' — roi' : ''}<br>${provincesDe(G, m).length} provinces · ${troupesDe(G, m)} troupes · relation <b>${relTxt(M.rel.joueur)}</b> (${Math.round(M.rel.joueur)})</span></div>
   <div class="acts">${b('🎁 Présents 50🪙', 'presents', o && J.or >= 50)}${!g && !al ? b('🤝 Alliance', 'alliance', o) : ''}${!G.joueur.conjoint && !g ? b('💍 Mariage', 'mariage', o) : ''}${g ? b('🕊️ Paix', 'paix', o) : b('⚔️ Guerre', 'guerre', o)}${b('🪙 Voler (2🕯️)', 'vol', o && J.influence >= 2)}${b('🗡️ Assassiner (6🕯️)', 'assassinat', o && J.influence >= 6)}</div></div>`;
 }
 html += '</div>';
 fenetre('Les grandes maisons', html, [{ t: 'Fermer', f: fermer }], false, true);
 $('#fen').querySelectorAll('[data-m]').forEach(bt => bt.onclick = () => {
  const m = bt.dataset.m, a = bt.dataset.a; SON('clic');
  const go = () => { const r = ['vol', 'assassinat'].includes(a) ? act(G, 'complot', { type: a, maison: m }) : act(G, a, { maison: m }); toast(r.msg, 4000); sauver(); majBarre(); fenetreMaisons(m); };
  if (a === 'guerre' || a === 'assassinat') confirmer(a === 'guerre' ? `Déclarer la guerre à la maison ${G.maisons[m].nom} ?` : `Faire assassiner ${G.maisons[m].chef.nom} ? (38 % de réussite, risque d’être découvert)`, go); else go();
 });
}
$('#bChron').onclick = fenetreChronique;
function fenetreChronique() { fenetre('La chronique', `<div class="chron">${G.chronique.map(c => `<div class="t-${c.type}"><span class="d">${SAISONS[c.s]} ${c.an}</span>${esc(c.txt)}</div>`).join('')}</div>`, [{ t: 'Fermer', f: () => { fermer(); if (G.fin) verifierFin(); } }]); }
$('#bMenu').onclick = () => fenetre('Menu', `<p>${TEST ? '🧪 Mode test : rien n’est sauvegardé.' : 'La partie est sauvegardée automatiquement (sur cet appareil et en ligne).'}</p>`, [
 { t: AUDIO.actif() ? '🔇 Couper le son' : '🔊 Activer le son', f: () => { AUDIO.regler(!AUDIO.actif()); if (AUDIO.actif()) AUDIO.musiqueDe(MODE === 'donjon' ? 'donjon' : 'royaume'); fermer(); } },
 { t: G.options.d3 === false ? '🗡️ Donjons : 2D en temps réel (passer en 3D au tour par tour)' : '🐉 Donjons : 3D au tour par tour (passer en 2D en temps réel)', f: () => { G.options.d3 = G.options.d3 === false; sauver(); fermer(); toast(G.options.d3 ? 'Les prochains donjons seront en 3D, au tour par tour.' : 'Les prochains donjons seront en 2D, en temps réel.'); } },
 { t: RENDU.haute ? '🖥️ Qualité : haute (passer en normale)' : '🖥️ Qualité : normale (passer en haute)', f: () => { RENDU.haute = !RENDU.haute; try { localStorage.setItem('tdb-qualite', RENDU.haute ? '1' : '0'); } catch (e) { } redim(); fermer(); } },
 { t: '📖 Comment jouer', f: aide },
 { t: '🐞 Signaler un problème à Claude', f: async () => { fermer(); if (!TK) return toast('Trousse de test indisponible'); const ok = await TK.signaler(); toast(ok ? 'Signalement envoyé ✓' : 'Signalement enregistré sur cet appareil'); } },
 ...(TEST ? [{ t: '▶ Banc de mesure (fluidité)', f: () => { fermer(); banc(); } }] : []),
 { t: '📋 Copier la sauvegarde', f: copierSauvegarde },
 { t: '🏠 Retour à l’écran titre', f: () => { fermer(); sauver(); initAccueil(); montrer('accueil'); } },
]);
// Code de sauvegarde à copier (remplace l'ancien lien de téléchargement, inopérant dans le visualiseur d'artefact ; aucune capacité « downloads ») — lecture seule : ne touche ni à tdb-v1 ni à « partie »
function copierSauvegarde() {
 const code = JSON.stringify(G);
 fenetre('Sauvegarde', `<p>${TEST ? '🧪 Mode test : ce code est celui de la partie de test. ' : ''}Copiez ce code et gardez-le (ou collez-le dans la conversation avec Claude) : c’est votre partie entière, ${Math.round(code.length / 1024)} Ko.</p><textarea id="codeSauv" readonly style="width:100%;height:9em;font:12px ui-monospace,monospace;background:#0b0f1a;color:#e8dcc0;border:1px solid #5a4a2a;border-radius:6px;padding:6px;box-sizing:border-box"></textarea>`, [
  { t: '📋 Copier', cls: 'or', f: async () => { const ta = $('#codeSauv'); let ok = false; try { await navigator.clipboard.writeText(code); ok = true; } catch (e) { try { ta.focus(); ta.select(); ta.setSelectionRange(0, code.length); ok = document.execCommand('copy'); } catch (_) { } } toast(ok ? 'Code copié ✓' : 'Code sélectionné : copiez-le à la main'); } },
  { t: 'Fermer', f: fermer }]);
 const ta = $('#codeSauv'); ta.value = code; try { ta.select(); ta.setSelectionRange(0, code.length); } catch (e) { }
}
addEventListener('keydown', e => { if (MODE === 'royaume' && e.code === 'Escape') { if ($('#voile').classList.contains('on')) return; UI.mode = null; UI.cibles = null; UI.amis = null; } });

/* ---------- armurerie ---------- */
$('#bArm').onclick = () => armurerie('equip');
let ARM = { onglet: 'equip', sel: null };
function sacCourant() { return MODE === 'donjon' && XP ? XP.butin : G.joueur.inventaire; }
function armurerie(onglet) {
 ARM.onglet = onglet || ARM.onglet;
 const h = G.joueur.heros, enDonjon = MODE === 'donjon';
 const tabs = `<div class="choix" style="margin-bottom:10px">${[['equip', '🛡️ Équipement'], ['comp', `✦ Compétences${h.points ? ' (' + h.points + ')' : ''}`], ...(enDonjon ? [] : [['compagnon', '🤝 Compagnon'], ['forge', '🔥 Forge']])].map(([k, t]) => `<button data-o="${k}" class="${ARM.onglet === k ? 'sel' : ''}">${t}</button>`).join('')}</div>`;
 let html = tabs;
 if (ARM.onglet === 'equip') html += ongletEquip(h, enDonjon);
 else if (ARM.onglet === 'comp') html += ongletComp(h);
 else if (ARM.onglet === 'compagnon') html += ongletCompagnon(h);
 else html += ongletForge(h);
 fenetre(enDonjon ? 'Votre sac' : 'L’armurerie', html, [], false, true);
 $('#fen').querySelectorAll('[data-o]').forEach(b => b.onclick = () => { ARM.sel = null; armurerie(b.dataset.o); });
 brancherArm(h, enDonjon);
}
function caseObj(o, extra = '') { if (!o) return ''; return `<div class="case r-${o.rar} ${ARM.sel === o.id ? 'sel' : ''}" data-id="${o.id}" ${extra} title="${esc(o.nom)}">${o.ic}<span class="nv">${o.ilvl}</span></div>`; }
function ongletEquip(h, enDonjon) {
 const S = statsHeros(h, G.joueur.generation), E = h.equip;
 const empl = k => E[k] ? caseObj(E[k], `data-eq="${k}"`) : `<div class="case" data-vide="${k}" style="opacity:.5">${k === 'arme' ? '🗡️' : ICONES[k]}<small>${NOMS_EMPL[k]}</small></div>`;
 const sac = sacCourant();
 let html = `<div class="arm"><div><div class="poupee"><div></div>${empl('casque')}${empl('amulette')}${empl('arme')}${empl('armure')}${empl('anneau')}${empl('gants')}${empl('bottes')}<div></div></div>
  <div class="stats">❤️ Vie ${Math.round(S.pvmax)}<br>💧 Mana ${Math.round(S.manamax)}<br>⚔️ Dégâts ${Math.round(S.dmin * (1 + S.pdmg / 100))}–${Math.round(S.dmax * (1 + S.pdmg / 100))}<br>⏱️ ${S.cadence.toFixed(2)} coups/s<br>🛡️ Armure ${Math.round(S.arm)}<br>🎯 Critique ${S.crit} % (+${S.critd} %)<br>${S.vol ? `🩸 Vol de vie ${S.vol} %<br>` : ''}${S.feu ? `🔥 Feu +${S.feu}<br>` : ''}${S.res ? `🧱 Résistance ${S.res} %<br>` : ''}💨 Vitesse +${S.vmov} %<br>📈 Puissance ≈ <b>${Math.round(S.dps)}</b>/s</div></div>
  <div><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><span>${enDonjon ? 'Sac' : 'Coffres de la maison'} (${sac.length})</span>${!enDonjon ? `<button class="btn petit" id="aVendreTout">Vendre les ordinaires et magiques</button>` : ''}</div>
  <div class="sac">${sac.slice().sort((a, b) => ['legendaire', 'rare', 'magique', 'normal'].indexOf(a.rar) - ['legendaire', 'rare', 'magique', 'normal'].indexOf(b.rar) || b.ilvl - a.ilvl).map(o => caseObj(o)).join('') || '<p style="color:#987;font-size:13px;grid-column:1/-1">Rien pour l’instant. Les donjons regorgent de trésors.</p>'}</div>
  <div id="aFiche"></div></div></div>`;
 return html;
}
function ficheObjet(o, h, equipe) {
 const R = RARETES.find(r => r.id === o.rar); const actuel = h.equip[o.empl];
 const sc = scoreObjet(o, h.classe), sa = scoreObjet(actuel, h.classe);
 const inutil = o.empl === 'arme' && !CLASSES[h.classe].armes.includes(o.arme);
 return `<div class="fiche"><h4 style="color:${R.coul}">${esc(o.nom)}</h4><div style="font-size:12px;color:#a98">${R.nom} · ${o.base} · niveau ${o.ilvl}</div>${lignesObjet(o).join('<br>')}
  ${!equipe && !inutil ? `<div style="margin-top:6px">${actuel ? `Comparé à ${esc(actuel.nom)} : <b class="${sc >= sa ? 'mieux' : 'pire'}">${sc >= sa ? '▲ meilleur' : '▼ moins bon'}</b>` : '<b class="mieux">Emplacement libre</b>'}</div>` : ''}
  ${inutil ? `<div class="pire">Arme inutilisable par un ${CLASSES[h.classe].nom.toLowerCase()}</div>` : ''}
  <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">${equipe ? `<button class="btn petit" id="aRetirer">Retirer</button>` : `${!inutil ? `<button class="btn petit or" id="aEquiper">Équiper</button>` : ''}${MODE === 'donjon' ? `<button class="btn petit" id="aJeter">Jeter</button>` : `<button class="btn petit" id="aVendre">Vendre ${Math.round(o.prix / 3)} 🪙</button>`}`}</div></div>`;
}
function brancherArm(h, enDonjon) {
 const f = $('#fen'), sac = sacCourant();
 f.querySelectorAll('.case[data-id]').forEach(c => c.onclick = () => {
  const id = +c.dataset.id; ARM.sel = id; const eq = c.dataset.eq; const o = eq ? h.equip[eq] : sac.find(x => x.id === id);
  f.querySelectorAll('.case').forEach(x => x.classList.toggle('sel', x === c));
  $('#aFiche').innerHTML = ficheObjet(o, h, !!eq); SON('clic');
  const maj = () => { if (A) { const pv = A.p.pv / A.p.S.pvmax; A.p.S = statsHeros(h, G.joueur.generation); A.p.pv = A.p.S.pvmax * pv; } sauver(); ARM.sel = null; armurerie('equip'); };
  if ($('#aEquiper')) $('#aEquiper').onclick = () => { const anc = h.equip[o.empl]; h.equip[o.empl] = o; sac.splice(sac.indexOf(o), 1); if (anc) sac.push(anc); SON('objet'); maj(); };
  if ($('#aRetirer')) $('#aRetirer').onclick = () => { if (eq === 'arme') return toast('Gardez au moins une arme !'); delete h.equip[eq]; sac.push(o); maj(); };
  if ($('#aVendre')) $('#aVendre').onclick = () => { G.maisons.joueur.or += Math.round(o.prix / 3); sac.splice(sac.indexOf(o), 1); SON('or'); majBarre(); maj(); };
  if ($('#aJeter')) $('#aJeter').onclick = () => { sac.splice(sac.indexOf(o), 1); maj(); };
 });
 if ($('#aVendreTout')) $('#aVendreTout').onclick = () => { let s = 0; for (const o of sac.slice()) if (o.rar === 'normal' || o.rar === 'magique') { s += Math.round(o.prix / 3); sac.splice(sac.indexOf(o), 1); } G.maisons.joueur.or += s; SON('or'); toast(`+${s} or`); majBarre(); sauver(); armurerie('equip'); };
 f.querySelectorAll('[data-up]').forEach(b => b.onclick = () => { const id = b.dataset.up; if (h.points <= 0) return; h.comp[id] = (h.comp[id] || 0) + 1; h.points--; SON('niveau'); sauver(); armurerie('comp'); });
 f.querySelectorAll('[data-tal]').forEach(b => b.onclick = () => { const id = b.dataset.tal; if (h.points <= 0) return; h.talents[id] = (h.talents[id] || 0) + 1; h.points--; SON('niveau'); if (A) { const k = A.p.pv / A.p.S.pvmax; A.p.S = statsHeros(h, G.joueur.generation); A.p.pv = A.p.S.pvmax * k; } sauver(); armurerie('comp'); });
 f.querySelectorAll('[data-comp]').forEach(b => b.onclick = () => { const k = b.dataset.comp, K = COMPAGNONS[k]; if (G.maisons.joueur.or < K.prix) return toast('Pas assez d’or'); G.maisons.joueur.or -= K.prix; const noms = { ecuyer: ['Bertrand', 'Galeran', 'Odon'], arbaletriere: ['Isaure', 'Mahaut', 'Flore'], pretresse: ['Sœur Alix', 'Sœur Blanche', 'Sœur Oriane'] }[k]; G.joueur.compagnon = { type: k, nom: pick(noms) }; SON('victoire'); toast(`${G.joueur.compagnon.nom} vous jure fidélité.`); majBarre(); sauver(); armurerie('compagnon'); });
 if ($('#cRenvoi')) $('#cRenvoi').onclick = () => { G.joueur.compagnon = null; sauver(); majBarre(); armurerie('compagnon'); };
 f.querySelectorAll('[data-forge]').forEach(b => b.onclick = () => { const k = b.dataset.forge, cout = prixForge(h); if (G.maisons.joueur.or < cout) return toast('Pas assez d’or'); G.maisons.joueur.or -= cout; const o = genObjet(h.niveau + 1, h.classe, { empl: k === 'hasard' ? null : k, min: 'magique', bonus: k === 'hasard' ? .12 : .05 }); G.joueur.inventaire.push(o); SON(o.rar === 'legendaire' ? 'legendaire' : 'objet_rare'); majBarre(); sauver(); ARM.sel = o.id; armurerie('equip'); setTimeout(() => { const c = $(`.case[data-id="${o.id}"]`); if (c) c.click(); }, 30); });
}
const SEUILS_COMP = [1, 2, 4, 6];
function ongletComp(h) {
 const C = CLASSES[h.classe], T = TALENTS[h.classe];
 const talents = `<h4 style="margin:14px 0 6px;color:var(--or2);font-weight:400">Talents ${h.niveau < 3 ? '<small style="color:#e99">(à partir du niveau 3)</small>' : ''}</h4><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:6px">${T.map(t => { const r = h.talents[t.id] || 0, ok = h.points > 0 && h.niveau >= 3 && r < 3; return `<div class="compl"><div class="ic" style="font-size:20px">${t.ic}</div><div class="tx"><b>${t.nom}</b> ${'●'.repeat(r)}${'○'.repeat(3 - r)}<br><small>${r ? t.txt(r) : t.txt(1) + ' par rang'}</small></div><button class="btn petit ${ok ? 'or' : ''}" data-tal="${t.id}" ${ok ? '' : 'disabled'}>+</button></div>`; }).join('')}</div>`;
 return talents.replace(/^/, '') && `<p>Points à répartir : <b style="color:var(--or2)">${h.points}</b> <small style="color:#a98">(un par niveau)</small></p><div class="comps">${C.comp.map((c, i) => { const r = h.comp[c.id] || 0, ok = h.points > 0 && h.niveau >= SEUILS_COMP[i] && r < 10; return `<div class="compl"><div class="ic">${c.ic}</div><div class="tx"><b>${c.nom}</b> — rang ${r}${r ? ` (+${Math.round((r - 1) * 22)} % de puissance)` : ''} · touche ${i + 1}${i === 0 ? ' ou clic droit' : ''}<br>${c.desc}<br><small style="color:#8ab8ff">${c.cout} mana · recharge ${c.cd} s</small>${h.niveau < SEUILS_COMP[i] ? `<br><small style="color:#e99">Disponible au niveau ${SEUILS_COMP[i]}</small>` : ''}</div><button class="btn petit ${ok ? 'or' : ''}" data-up="${c.id}" ${ok ? '' : 'disabled'}>+</button></div>`; }).join('')}</div>` + talents;
}
const prixForge = h => 40 + 16 * h.niveau;
function ongletForge(h) {
 const c = prixForge(h);
 return `<p>Le maître forgeron de la maison peut vous forger une pièce (au moins magique, niveau ${h.niveau + 1}) pour <b>${c} or</b>. Vous avez ${nf(G.maisons.joueur.or)} or.</p><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">${[...EMPLACEMENTS.map(k => [k, (k === 'arme' ? '🗡️' : ICONES[k]) + ' ' + NOMS_EMPL[k]]), ['hasard', '🎲 Au hasard (meilleures chances)']].map(([k, t]) => `<button class="btn petit" data-forge="${k}" ${G.maisons.joueur.or >= c ? '' : 'disabled'}>${t}</button>`).join('')}</div>`;
}

/* ---------- expéditions (donjon) ---------- */
let surFin = null, entree = { haut: 0, bas: 0, gauche: 0, droite: 0, clic: false, shift: false, mx: 0, my: 0, sx: 0, sy: 0, comp: [0, 0, 0, 0], potion: false, action: false };
/* ---------- Donjons 3D au tour par tour (moteur de Valdragon, page donjon3d.html dans un cadre) ---------- */
const D3 = { cadre: null, pret: false, err: null, att: null, fin: null, cfg: null, X: null, minuteur: 0 };
function d3Dispo() { if (G.options.d3 === false || UI.auto) return false; try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } }
function d3Cadre() {
 if (D3.cadre) return D3.cadre;
 const f = document.createElement('iframe'); f.id = 'cadre3d'; f.title = 'Donjon en 3D'; f.allow = 'autoplay; fullscreen';
 f.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:0;z-index:60;background:#000;display:none';
 const blob = document.getElementById('donjon3d-b64');
 if (blob) { const bin = atob(blob.textContent.trim()), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); f.src = URL.createObjectURL(new Blob([u8], { type: 'text/html' })); }
 else f.src = 'donjon3d.html';
 document.body.appendChild(f); D3.cadre = f; return f;
}
addEventListener('message', ev => {
 const m = ev.data; if (!m || typeof m !== 'object' || !D3.cadre || ev.source !== D3.cadre.contentWindow) return;
 if (m.t === 'pret3d') { D3.pret = true; D3.err = m.err; if (D3.att) { const a = D3.att; D3.att = null; a(); } }
 if (m.t === 'fin3d') { if (D3.banc) return; finD3(m.b); } // pendant le banc, ⛺ / fin ne touchent pas la partie
 // 🧪 / 🐞 du donjon 3D : la page 3D n'écrit jamais ; elle confie ses mesures et signalements à la trousse du royaume
 if (m.t === 'tk3d') {
  const ok = typeof m.id === 'string' && /^(mesures|signalement)_\d+$/.test(m.id) && m.doc && typeof m.doc === 'object';
  const rep = r => { try { D3.cadre.contentWindow.postMessage({ t: 'tk3d-ok', n: m.n, ok: r }, '*'); } catch (e) { } };
  if (!ok || !TK) return rep(false);
  let etat = null; try { etat = { test: TEST, tour: G && G.tour, an: G && G.an, heros: G && { classe: G.joueur.heros.classe, niveau: G.joueur.heros.niveau } }; } catch (e) { }
  TK.envoyer(m.id, Object.assign({}, m.doc, { royaume: etat })).then(rep, () => rep(false));
 }
 if (m.t === 'banc3d-fin' && D3.banc) { const f = D3.banc; D3.banc = null; f(m.out); }
});
function blasonDe(id) { const M = id && G.maisons[id]; return M && !M.neutre ? { c1: M.c1, c2: M.c2, emb: M.embleme, nom: M.nom } : null; }
function lancerD3(cfg, fin) {
 const h = G.joueur.heros; h.potions = Math.max(h.potions || 0, 3);
 const c = PONT3D.configExpedition({ heros: h, compagnon: G.joueur.compagnon, type: cfg.arene ? 'arene' : cfg.type, niveau: cfg.niveau, etages: cfg.etages || 3, arene: cfg.arene, nom: cfg.nom, maison: blasonDe('joueur'), adverse: blasonDe(cfg.arene ? cfg.arene.maison : cfg.proprio) });
 c.muet = !AUDIO.actif(); c.test = TEST; D3.cfg = c; D3.fin = fin; D3.h = h;
 const f = d3Cadre(); fermer(); AUDIO.musiqueDe(null);
 $('#chargement3d').classList.add('on'); MODE = 'donjon3d';
 const go = () => { clearTimeout(D3.minuteur); $('#chargement3d').classList.remove('on'); f.style.display = 'block'; f.focus(); f.contentWindow.postMessage({ t: 'expe3d', cfg: c }, '*'); };
 if (D3.pret) go();
 else { D3.att = go; clearTimeout(D3.minuteur); D3.minuteur = setTimeout(() => { if (D3.pret) return; D3.att = null; $('#chargement3d').classList.remove('on'); MODE = 'royaume'; toast('Le donjon 3D n’a pas pu se charger : expédition en 2D.', 4000); lancer2D(cfg, fin); }, 90000); }
}
function finD3(b) {
 const h = D3.h, c = D3.cfg, X = PONT3D.versTdB(b, h, c, genObjet); const fin = D3.fin; D3.fin = null;
 const avant = h.niveau, up = PONT3D.appliquerXp(h, X.xpGagne); h.potions = Math.max(0, b.pot | 0);
 D3.cadre.style.display = 'none'; montrer('royaume');
 if (up) setTimeout(() => toast(`${esc(h.nom)} passe au niveau ${h.niveau} ! (+${h.niveau - avant} point${up > 1 ? 's' : ''} de compétence)`, 3500), 900);
 fin && fin(X);
}
function lancerExpedition(cfg, fin) { if (d3Dispo()) return lancerD3(cfg, fin); return lancer2D(cfg, fin); }
function lancer2D(cfg, fin) {
 const h = G.joueur.heros; h.potions = Math.max(h.potions || 0, 3);
 XP = creerExpedition({ type: cfg.arene ? 'arene' : cfg.type, niveau: cfg.niveau, etages: cfg.etages || 3, heros: h, generation: G.joueur.generation, arene: cfg.arene, boss: cfg.boss, nomLieu: cfg.nom, couleurs: [G.maisons.joueur.c1, G.maisons.joueur.c2], inventaire: G.joueur.inventaire, dif: G.options.difficulte, compagnon: G.joueur.compagnon, chanceOr: G.chanceOr });
 G.chanceOr = false;
 surFin = fin; fermer(); montrer('donjon'); nouvelEtage();
}
function nouvelEtage() {
 A = creerEtage(XP); A.sol = null;
 $('#hLieu').innerHTML = `${esc(XP.o.nomLieu || DONJONS[A.type].nom)}<small>${XP.o.arene ? 'Combat' : `Étage ${XP.etage + 1} / ${XP.etages}`} · niveau ${Math.round(A.niveau)}</small>`;
 construireBarre();
 message(A, XP.o.arene ? 'Abattez leur champion !' : XP.etage === XP.etages - 1 ? 'Le maître des lieux vous attend…' : `${DONJONS[A.type].nom} — étage ${XP.etage + 1}`, 2.5);
}
function construireBarre() {
 const h = G.joueur.heros, C = CLASSES[h.classe];
 $('#hComp').innerHTML = C.comp.map((c, i) => `<div class="cp ${h.comp[c.id] ? '' : 'verr'}" data-c="${i}" title="${c.nom}"><span class="k">${i + 1}</span>${c.ic}<div class="cd"></div><span class="m">${c.cout}</span></div>`).join('') + `<div class="cp pot" data-p="1" title="Potion (Espace)"><span class="k">␣</span>🧪<span class="n"></span></div>`;
 $('#hComp').querySelectorAll('[data-c]').forEach(e => e.onpointerdown = ev => { ev.stopPropagation(); entree.comp[+e.dataset.c] = 1; viserAuto(); });
 $('#hComp').querySelector('[data-p]').onpointerdown = ev => { ev.stopPropagation(); entree.potion = true; };
}
function viserAuto() { if (!document.body.classList.contains('tact') || !A) return; let c = null, bd = 9; for (const m of A.mobs) { if (m.mort || m.objet) continue; const d = Math.hypot(m.x - A.p.x, m.y - A.p.y); if (d < bd) { bd = d; c = m; } } if (c) { entree.mx = c.x; entree.my = c.y; } else { entree.mx = A.p.x + Math.cos(A.p.ang) * 3; entree.my = A.p.y + Math.sin(A.p.ang) * 3; } entree.touche = true; }
function finEtage() {
 const r = XP.resultat;
 if (r === 'etage') { XP.etage++; XP.resultat = null; nouvelEtage(); return; }
 const X = XP; const a = A;
 setTimeout(() => { A = null; XP = null; montrer('royaume'); const f = surFin; surFin = null; f && f(X); }, r === 'mort' ? 1600 : 700);
 a.pause = true;
}
function resumeExpedition(X, lignes, extra) {
 const titre = X.resultat === 'victoire' ? '🏆 Victoire' : X.resultat === 'mort' ? '💀 Défaite' : '↩ Retraite';
 const obj = X.butin.length ? `<div class="sac" style="margin-top:8px">${X.butin.map(o => caseObj(o)).join('')}</div>` : '';
 fenetre(titre, `${extra ? `<div class="resultat">${extra}</div>` : ''}<p>${lignes.map(esc).join('<br>')}</p><p>Créatures abattues : ${X.tues} · expérience : +${nf(X.xpGagne)}</p>${obj}`, [{ t: X.butin.length ? '🛡️ Voir l’armurerie' : 'Continuer', f: () => { fermer(); sauver(); panneau(); if (G.succession || G.fin) return traiterFile(); if (X.butin.length) armurerie('equip'); else traiterFile(); } }, ...(X.butin.length ? [{ t: 'Continuer', f: () => { fermer(); sauver(); panneau(); traiterFile(); } }] : [])], true);
 sauver();
}
// clavier
const TOUCHES = { KeyW: 'haut', ArrowUp: 'haut', KeyS: 'bas', ArrowDown: 'bas', KeyA: 'gauche', ArrowLeft: 'gauche', KeyD: 'droite', ArrowRight: 'droite' };
addEventListener('keydown', e => {
 if (MODE !== 'donjon' || !A) return;
 if (TOUCHES[e.code]) { entree[TOUCHES[e.code]] = 1; e.preventDefault(); }
 if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') entree.shift = true;
 if (e.repeat) return;
 const ouvert = $('#voile').classList.contains('on');
 if (e.code === 'Escape') { if (ouvert) fermer(); else pauseDonjon(); return; }
 if (ouvert) { if (e.code === 'KeyI' || e.code === 'KeyK') fermer(); return; }
 if (/^Digit[1-4]$/.test(e.code)) entree.comp[+e.code.slice(5) - 1] = 1;
 if (e.code === 'Space') { entree.potion = true; e.preventDefault(); }
 if (e.code === 'KeyE') entree.action = true;
 if (e.code === 'KeyI') armurerie('equip');
 if (e.code === 'KeyK') armurerie('comp');
});
addEventListener('keyup', e => { if (TOUCHES[e.code]) entree[TOUCHES[e.code]] = 0; if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') entree.shift = false; });
addEventListener('blur', () => { for (const k of ['haut', 'bas', 'gauche', 'droite']) entree[k] = 0; entree.clic = false; });
// souris
cvJ.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') return; entree.sx = e.offsetX; entree.sy = e.offsetY; if (e.button === 0) entree.clic = true; if (e.button === 2) entree.comp[0] = 1; });
addEventListener('pointerup', e => { if (e.pointerType !== 'touch' && e.button === 0) entree.clic = false; });
cvJ.addEventListener('pointermove', e => { if (e.pointerType === 'touch') return; entree.sx = e.offsetX; entree.sy = e.offsetY; });
cvJ.addEventListener('contextmenu', e => e.preventDefault());
// tactile : joystick + bouton d'attaque
(() => {
 const j = $('#joy'), k = j.querySelector('i'); let id = null, c0 = null;
 j.addEventListener('pointerdown', e => { id = e.pointerId; j.setPointerCapture(id); const r = j.getBoundingClientRect(); c0 = [r.left + r.width / 2, r.top + r.height / 2]; mv(e); });
 const mv = e => { if (e.pointerId !== id) return; let dx = e.clientX - c0[0], dy = e.clientY - c0[1]; const d = Math.hypot(dx, dy), m = 50; if (d > m) { dx *= m / d; dy *= m / d; } k.style.transform = `translate(${dx}px,${dy}px)`; entree.jx = dx / m; entree.jy = dy / m; };
 j.addEventListener('pointermove', mv);
 const fin = e => { if (e.pointerId !== id) return; id = null; k.style.transform = ''; entree.jx = entree.jy = 0; };
 j.addEventListener('pointerup', fin); j.addEventListener('pointercancel', fin);
 const at = $('#attq');
 at.addEventListener('pointerdown', e => { e.preventDefault(); entree.tattq = true; });
 at.addEventListener('pointerup', () => entree.tattq = false); at.addEventListener('pointercancel', () => entree.tattq = false);
 cvJ.addEventListener('pointerdown', e => { if (e.pointerType !== 'touch' || !A) return; const q = cvJ.q || 1; const wx = (e.offsetX * q - A.ox) / A.TS, wy = (e.offsetY * q - A.oy) / A.TS; if (A.surEscalier) entree.action = true; entree.mx = wx; entree.my = wy; });
})();
function lireEntree() {
 if (UI.auto) return botEntree(A);
 const q = cvJ.q || 1, inp = { haut: entree.haut, bas: entree.bas, gauche: entree.gauche, droite: entree.droite, shift: entree.shift, comp: entree.comp.slice(), potion: entree.potion, action: entree.action };
 if (entree.touche || entree.tattq || document.body.classList.contains('tact')) {
  if (entree.jx || entree.jy) { inp.droite = entree.jx > .3 ? 1 : 0; inp.gauche = entree.jx < -.3 ? 1 : 0; inp.bas = entree.jy > .3 ? 1 : 0; inp.haut = entree.jy < -.3 ? 1 : 0; }
  if (entree.tattq) { viserAuto(); inp.clic = true; inp.shift = true; }
  inp.mx = entree.mx; inp.my = entree.my;
  if (!entree.tattq && !inp.comp.some(x => x)) { inp.mx = A.p.x + Math.cos(A.p.ang); inp.my = A.p.y + Math.sin(A.p.ang); }
  entree.touche = false;
 } else { inp.clic = entree.clic; inp.mx = (entree.sx * q - A.ox) / A.TS; inp.my = (entree.sy * q - A.oy) / A.TS; }
 entree.comp = [0, 0, 0, 0]; entree.potion = false; entree.action = false;
 return inp;
}
$('#bDescendre').onclick = () => entree.action = true;
$('#bPause').onclick = () => pauseDonjon();
$('#bInvD').onclick = () => armurerie('equip');
$('#bCompD').onclick = () => armurerie('comp');
function pauseDonjon() {
 fenetre('Pause', `<p>${esc(XP.o.nomLieu || '')} — ${XP.o.arene ? 'combat' : `étage ${XP.etage + 1}/${XP.etages}`}. Or ramassé : ${XP.sacOr} · objets : ${XP.butin.length}</p>`, [
  { t: '▶ Reprendre', f: fermer, cls: 'or' }, { t: '🎒 Sac et équipement (I)', f: () => armurerie('equip') }, { t: '✦ Compétences (K)', f: () => armurerie('comp') },
  { t: AUDIO.actif() ? '🔇 Couper le son' : '🔊 Activer le son', f: () => { AUDIO.regler(!AUDIO.actif()); if (AUDIO.actif()) AUDIO.musiqueDe('donjon'); fermer(); } },
  { t: '🐞 Signaler un problème à Claude', f: async () => { fermer(); if (TK) { const ok = await TK.signaler(); toast(ok ? 'Signalement envoyé ✓' : 'Signalement enregistré'); } } },
  { t: '🏳️ Battre en retraite (garder l’or et le butin)', f: () => { fermer(); XP.resultat = 'fuite'; A.fini = true; finEtage(); } },
 ]);
}
let hudT = 0, miniT = 0;
function hud(dt) {
 hudT -= dt; if (hudT > 0) return; hudT = .08;
 const P = A.p, S = P.S, h = G.joueur.heros, C = CLASSES[h.classe];
 majStyle('#hVie', 'height', Math.round(clamp(P.pv / S.pvmax * 100, 0, 100)) + '%'); majTexte('#hVieT', Math.ceil(P.pv));
 majStyle('#hMana', 'height', Math.round(clamp(P.mana / S.manamax * 100, 0, 100)) + '%'); majTexte('#hManaT', Math.floor(P.mana));
 $('#hXp').style.width = clamp(h.xp / xpPour(h.niveau) * 100, 0, 100) + '%'; majTexte('#hNiv', `${h.nom} · niveau ${h.niveau}${h.points ? ` · ${h.points} point${h.points > 1 ? 's' : ''} à dépenser (K)` : ''}`);
 $('#hComp').querySelectorAll('[data-c]').forEach((e, i) => { const c = C.comp[i], cd = P.cds[c.id] || 0; e.querySelector('.cd').style.height = cd > 0 ? (cd / (c.cd * (1 - S.recup / 100)) * 100) + '%' : '0'; e.classList.toggle('verr', !h.comp[c.id]); e.style.borderColor = h.comp[c.id] && P.mana < c.cout ? '#3a4a8a' : ''; });
 $('#hComp').querySelector('.pot .n').textContent = P.potions;
 const b = A.boss; const bb = $('#hBoss');
 if (b && !b.mort && b.etat === 'chasse') { bb.classList.add('on'); bb.querySelector('.nm').textContent = b.M.nom + (b.phase === 2 ? ' — fureur' : ''); bb.querySelector('i').style.width = clamp(b.pv / b.pvmax * 100, 0, 100) + '%'; } else bb.classList.remove('on');
 const bo = Object.entries(P.bonus).filter(([k, v]) => v > 0).map(([k, v]) => `<span style="border-color:${AUTELS[k].coul}">${{ fureur: '🔥', celerite: '💨', protection: '🛡️', fortune: '🪙', savoir: '📖' }[k]} ${Math.ceil(v)}</span>`);
 if (P.buff > 0) bo.push(`<span style="border-color:#ff6a3a">📯 ${Math.ceil(P.buff)}</span>`);
 if (A.allie) bo.push(`<span style="border-color:#5ac85a">${COMPAGNONS[A.allie.k].ic} ${A.allie.ko > 0 ? 'à terre' : Math.round(A.allie.pv / A.allie.pvmax * 100) + ' %'}</span>`);
 majTexte('#hBonus', bo.join(''), true);
 infobulleSol();
 const m = $('#hMsg'); m.textContent = A.msg || ''; m.style.opacity = A.msgT > 0 ? 1 : 0;
 $('#hAction').classList.toggle('on', !!A.surEscalier);
 miniT -= .08; if (miniT <= 0) { miniT = .16; minicarte(); }
}
function minicarte() {
 const c = $('#minicarte'); if (c.width !== 160) { c.width = 160; c.height = 160; } const g = c.getContext('2d'), k = 2.8, P = A.p, cx = 80 - P.x * k, cy = 80 - P.y * k;
 g.clearRect(0, 0, 160, 160);
 const x0 = Math.max(0, (P.x - 30) | 0), x1 = Math.min(A.W, (P.x + 30) | 0), y0 = Math.max(0, (P.y - 30) | 0), y1 = Math.min(A.H, (P.y + 30) | 0);
 g.fillStyle = 'rgba(200,180,140,.5)';
 for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const i = y * A.W + x; if (!A.vu[i] || A.carte.t[i] === MUR) continue; g.fillRect(cx + x * k, cy + y * k, k + .3, k + .3); }
 for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const i = y * A.W + x; if (A.vu[i] && A.carte.t[i] === ESC) { g.fillStyle = '#ffd84a'; g.fillRect(cx + x * k - 1, cy + y * k - 1, k + 2, k + 2); } }
 for (const a of A.autels || []) if (!a.pris && A.vu[(a.y | 0) * A.W + (a.x | 0)]) { g.fillStyle = AUTELS[a.k].coul; g.beginPath(); g.arc(cx + a.x * k, cy + a.y * k, 3, 0, 6.28); g.fill(); }
 for (const m of A.mobs) if (!m.mort && !m.objet && A.vu[(m.y | 0) * A.W + (m.x | 0)] && Math.hypot(m.x - P.x, m.y - P.y) < 11) { g.fillStyle = m.boss ? '#ff4020' : m.elite ? '#ffa030' : m.k === 'gobelin' ? '#9cff5a' : '#d03030'; g.beginPath(); g.arc(cx + m.x * k, cy + m.y * k, m.boss ? 4 : 2, 0, 6.28); g.fill(); }
 if (A.portail) { g.fillStyle = '#8ab8ff'; g.beginPath(); g.arc(cx + A.portail.x * k, cy + A.portail.y * k, 4, 0, 6.28); g.fill(); }
 if (A.allie) { g.fillStyle = '#5ac85a'; g.beginPath(); g.arc(cx + A.allie.x * k, cy + A.allie.y * k, 2.5, 0, 6.28); g.fill(); }
 g.save(); g.translate(80, 80); g.rotate(P.ang); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(6, 0); g.lineTo(-4, -4); g.lineTo(-2, 0); g.lineTo(-4, 4); g.closePath(); g.fill(); g.restore();
}

/* ---------- boucle principale ---------- */
let dernier = 0, carteT = 0;
function boucle(t) {
 requestAnimationFrame(boucle);
 const dt = Math.min(.05, (t - dernier) / 1000 || .016); dernier = t;
 if (MODE === 'donjon' && A) {
  if (!A.pause && !A.fini) { majDonjon(A, dt, lireEntree()); if (A.fini) finEtage(); }
  rendreDonjon(A, cvJ, ctxJ, lum, lctx); hud(dt);
  adapter(t);
 } else if (MODE === 'royaume' && G) {
  animerCamera(dt); carteT -= dt;
  if (carteT <= 0 || CARTE.V.x !== CARTE.V.tx) {
   carteT = 1 / 30; const V = CARTE.V;
   const cle = [V.x, V.y, V.z, cvC.width, UI.sel, UI.survol, UI.mode, G.tour, G.ordres, UI.fleches.length, G.provinces.map(p => p.o + p.t + p.c + p.nettoye + p.dniv).join('')].join('|');
   if (cle !== UI.cleCarte || UI.cibles || UI.amis) { UI.cleCarte = cle; CARTE.dessiner(G, cvC, ctxC, UI); }
  }
 }
 else if (MODE === 'accueil') animBraises(dt);
}
requestAnimationFrame(boucle);

/* ---------- trousse de test ---------- */
// Banc du donjon 3D : lance une vraie expédition (catacombes niveau 5, 2 étages) dans le cadre 3D,
// lui fait jouer exploration / combat / gardien à chaque qualité, puis referme le cadre sans rien appliquer à la partie.
function banc3d() {
 return new Promise(fin => {
  let d3ok = false; try { const c = document.createElement('canvas'); d3ok = !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { }
  if (!d3ok) return fin([{ erreur: 'WebGL indisponible' }]);
  const fini = r => { clearTimeout(D3.mbanc); clearTimeout(D3.minuteur); D3.att = null; D3.banc = null; D3.fin = null; try { D3.cadre.contentWindow.postMessage({ t: 'stop3d' }, '*'); } catch (e) { } if (D3.cadre) D3.cadre.style.display = 'none'; MODE = 'royaume'; montrer('royaume'); fin(r); };
  const LV = window.__banc3dLv || [0, 1, 2]; // qualités Économie, Normale, Haute
  toast('Banc du donjon 3D (≈ 1 min 30)…', 90000);
  lancerD3({ type: 'catacombes', niveau: 5, etages: 2, nom: 'Banc 3D' }, () => { });
  D3.fin = null; // l'expédition de banc ne rend jamais de résultat à la partie
  const go = () => { D3.banc = out => fini(out ? out.res.map(r => Object.assign({ page: '3d' }, r)).concat(out.env ? [{ env3d: out.env, depart: out.depart }] : []) : [{ erreur: 'banc 3D refusé' }]);
   const F0 = D3.cfg.F0, F1 = F0 + (D3.cfg.etages || 1) - 1;
   D3.cadre.contentWindow.postMessage({ t: 'banc3d', sc: [['explo', F0], ['combat', F0], ['boss', F1]], lv: LV }, '*'); };
  const att = (n = 0) => { if (D3.cadre && D3.cadre.style.display === 'block') return setTimeout(go, 2500); if (n > 900) return fini([{ erreur: 'donjon 3D non chargé' }]); setTimeout(() => att(n + 1), 100); };
  att(); D3.mbanc = setTimeout(() => fini([{ erreur: 'banc 3D trop long' }]), 120000 + 120000 * LV.length);
 });
}
async function banc() {
 if (!TK) return toast('Trousse indisponible');
 toast('Banc en cours (≈ 2 min)…', 30000); ADAPT.e = 1; ADAPT.ft.length = 0; redim();
 const res = await TK.banc([
  { nom: 'carte du royaume', preparer: async () => { A = null; montrer('royaume'); } },
  { nom: 'donjon niveau 5 (combat automatique)', preparer: async () => { UI.auto = true; lancerExpedition({ type: 'catacombes', niveau: 5, etages: 2, nom: 'Banc' }, () => { }); } },
  { nom: 'boss (combat automatique)', preparer: async () => { UI.auto = true; XP = creerExpedition({ type: 'crypte', niveau: 3, etages: 1, heros: G.joueur.heros, generation: 1 }); montrer('donjon'); nouvelEtage(); A.p.x = A.boss.x - 4; A.p.y = A.boss.y; A.p.S.pvmax *= 50; A.p.pv = A.p.S.pvmax; } },
 ], 5000);
 UI.auto = false; A = null; XP = null; montrer('royaume');
 res.res3d = await banc3d();
 res.enregistre3d = await TK.envoyer('mesures_' + Date.now() + '_3d', { jeu: 'trone-de-braise', page: 'donjon3d', date: new Date().toISOString(), gpu: res.gpu, ua: navigator.userAgent, ecran: innerWidth + 'x' + innerHeight + ' @' + devicePixelRatio, res: res.res3d });
 res.echelle = ADAPT.e; TK.envoyer('mesures_' + Date.now() + '_echelle', { echelle: ADAPT.e, date: new Date().toISOString() });
 fenetre('Banc de mesure', `<p>${res.res.map(r => `${r.scene} : <b>${r.fps || '?'}</b> img/s (pire ${r.pire} ms)`).join('<br>')}</p><p><b>Donjon 3D</b><br>${(res.res3d || []).filter(r => r.scene || r.erreur).map(r => r.erreur ? esc(r.erreur) : `${r.niveau} · ${r.scene} : <b>${r.fps || '?'}</b> img/s (pire ${r.pire} ms)`).join('<br>')}</p><p>Résolution du donjon ajustée à ${Math.round(res.echelle * 100)} %.</p><p><small>${esc(res.gpu)}</small><br>${res.enregistre ? 'Résultats envoyés à Claude ✓' : 'Résultats enregistrés sur cet appareil.'}</p>`, [{ t: 'Fermer', f: fermer }]);
}
(function attendreTK(n = 0) {
 if (window.Testkit) {
  TK = window.Testkit({ jeu: 'trone-de-braise', secours: true, canvas: () => MODE === 'donjon' ? cvJ : cvC, rendu: () => { if (MODE === 'donjon' && A) rendreDonjon(A, cvJ, ctxJ, lum, lctx); else if (G) CARTE.dessiner(G, cvC, ctxC, UI); }, etat: () => ({ mode: MODE, test: TEST, tour: G && G.tour, an: G && G.an, provinces: G && provincesDe(G, 'joueur').length, heros: G && { classe: G.joueur.heros.classe, niveau: G.joueur.heros.niveau }, donjon: A && { type: A.type, etage: XP && XP.etage, mobs: A.mobs.filter(m => !m.mort).length, pv: Math.round(A.p.pv) }, fenetre: $('#voile').classList.contains('on') ? $('#fen .tete h2').textContent : null }) });
  if (TEST) TK.modeTest();
 } else if (n < 100) setTimeout(() => attendreTK(n + 1), 100);
})();
try { RENDU.haute = localStorage.getItem('tdb-qualite') === '1'; } catch (e) { }
try { Promise.all([document.fonts.load("700 20px 'Grenze Gotisch'"), document.fonts.load("500 20px 'Grenze Gotisch'"), document.fonts.load("800 12px 'Alegreya Sans'")]).then(() => { CARTE.raz(); UI.cleCarte = null; }); } catch (e) { }
initAccueil();
window.JEU = { get G() { return G; }, get A() { return A; }, get XP() { return XP; }, UI, lancerExpedition, entrerRoyaume, act, finSaison, montrer };

/* ---------- objectif courant, nouvelles ---------- */
function majObjectif() {
 let el = $('#objectif'); if (!el) { el = document.createElement('div'); el.id = 'objectif'; $('#royaume').appendChild(el); el.onclick = () => el.classList.toggle('replie'); }
 const o = G && objectifActuel(G);
 el.style.display = o && MODE === 'royaume' ? '' : 'none';
 if (o) el.innerHTML = `<b>🎯 Objectif ${G.objectifs.n + 1}/${OBJECTIFS.length}</b><span>${esc(o.t)}</span>`;
}
function afficherNouvelles() {
 const N = G.nouvelles || []; if (!N.length) return;
 for (const n of N) UI.fleches.push({ de: n.de, vers: n.vers, coul: G.maisons[n.m].c1, t: 1.5 });
 const prises = N.filter(n => n.gagne).map(n => `${esc(G.maisons[n.m].nom)} prend ${esc(prov(G, n.vers).nom)}${n.avant === 'joueur' ? ' <b style="color:#f88">(à vous)</b>' : ''}`);
 let el = $('#nouvelles'); if (!el) { el = document.createElement('div'); el.id = 'nouvelles'; $('#royaume').appendChild(el); }
 el.innerHTML = `<b>📯 Nouvelles du royaume</b><br>${N.length} bataille${N.length > 1 ? 's' : ''} cette saison.${prises.length ? '<br>' + prises.join('<br>') : ''}`;
 el.style.opacity = 1; clearTimeout(el._h); el._h = setTimeout(() => el.style.opacity = 0, 9000);
}

function ongletCompagnon(h) {
 const c = G.joueur.compagnon, J = G.maisons.joueur;
 if (c) { const K = COMPAGNONS[c.type]; return `<div class="perso"><span class="av">${K.ic}</span><div><b style="color:var(--or2);font-size:18px">${esc(c.nom)}</b>, ${K.nom.toLowerCase()} de la maison<br>${K.desc}<br><small>Niveau ${h.niveau} (suit le vôtre) · ${Math.round(K.pv + K.pvn * (h.niveau - 1))} vie · solde 6 or par saison</small></div></div><p style="font-size:13.5px;color:#bba">Votre compagnon vous suit dans les donjons et les combats. S’il tombe, il se relève au bout de quelques secondes.</p><button class="btn petit" id="cRenvoi">Le renvoyer</button>`; }
 return `<p>Un compagnon d’armes vous accompagne dans les donjons, combat à vos côtés et détourne les coups. Solde : 6 or par saison. Vous avez ${nf(J.or)} or.</p><div style="display:grid;gap:8px">${Object.entries(COMPAGNONS).map(([k, K]) => `<div class="compl"><div class="ic">${K.ic}</div><div class="tx"><b>${K.nom}</b><br>${K.desc}</div><button class="btn petit ${J.or >= K.prix ? 'or' : ''}" data-comp="${k}" ${J.or >= K.prix ? '' : 'disabled'}>Engager ${K.prix} 🪙</button></div>`).join('')}</div>`;
}

function infobulleSol() {
 const tip = $('#hTip'); if (!A || document.body.classList.contains('tact')) { tip.style.display = 'none'; return; }
 const q = cvJ.q || 1, mx = (entree.sx * q - A.ox) / A.TS, my = (entree.sy * q - A.oy) / A.TS;
 let l = null, bd = .7; for (const o of A.loot) if (o.obj) { const d = Math.hypot(o.x - mx, o.y - my); if (d < bd) { bd = d; l = o; } }
 if (!l) { tip.style.display = 'none'; return; }
 const h = G.joueur.heros, o = l.obj, R0 = RARETES.find(r => r.id === o.rar), act = h.equip[o.empl], sc = scoreObjet(o, h.classe), sa = scoreObjet(act, h.classe);
 tip.innerHTML = `<b style="color:${R0.coul}">${esc(o.nom)}</b><br><small>${R0.nom} · ${o.base} · niv. ${o.ilvl}</small><br>${lignesObjet(o).join('<br>')}<br>${sc < 0 ? '<span class="pire">Inutilisable pour votre classe</span>' : act ? `<span class="${sc >= sa ? 'mieux' : 'pire'}">${sc >= sa ? '▲ meilleur' : '▼ moins bon'} que ${esc(act.nom)}</span>` : '<span class="mieux">Emplacement libre</span>'}`;
 tip.style.display = 'block'; tip.style.left = Math.min(innerWidth - 270, entree.sx + 18) + 'px'; tip.style.top = Math.max(8, entree.sy - 40) + 'px';
}

function infoProv(p, x, y) {
 let el = $('#infoProv'); if (!el) { el = document.createElement('div'); el.id = 'infoProv'; $('#royaume').appendChild(el); cvC.addEventListener('pointerleave', () => el.style.display = 'none'); }
 if (!p || document.body.classList.contains('tact')) { el.style.display = 'none'; return; }
 const M = G.maisons[p.o];
 el.innerHTML = `<b style="color:${p.o === 'joueur' ? '#f2d7a0' : '#e8d6a8'}">${esc(p.nom)}</b> — ${esc(M.nom)} ${p.o !== 'joueur' ? etatMaison(p.o) : ''}<br>⚔️ ${p.t} troupes · 🏰 ${p.c ? 'château ' + p.c : 'sans château'}<br>☠ ${DONJONS[p.donjon].nom} ${p.nettoye ? '(purgé)' : 'niv. ' + p.dniv}`;
 el.style.display = 'block'; el.style.left = Math.min(innerWidth - 250, x + 16) + 'px'; el.style.top = (y + 16) + 'px';
}

function teinteEvt(id) {
 const T = { guerre: ['#6a1a10', '#1a0806'], famille: ['#5a2a4a', '#160a14'], mystere: ['#3a2a6a', '#0c0a1a'], or: ['#6a4a14', '#1a1006'], nature: ['#2a4a2a', '#0a140a'], couronne: ['#7a5a1a', '#1a1206'] };
 const c = { declaration: 'guerre', attaque_subie: 'guerre', bandits: 'guerre', duel: 'guerre', raid_champion: 'guerre', tournoi: 'guerre', naissance: 'famille', mariage_offre: 'famille', enfant_malade: 'famille', heritier_fugue: 'famille', prophete: 'mystere', comete: 'mystere', heretique: 'mystere', oracle: 'mystere', faille_gronde: 'mystere', dragon: 'mystere', crypte_decouverte: 'mystere', retour_mal: 'mystere', relique: 'mystere', marchand: 'or', mine_or: 'or', banquier: 'or', grande_foire: 'or', tresor_royal: 'or', deserteurs: 'or', famine: 'nature', inondation: 'nature', loups: 'nature', peste: 'nature', pelerins: 'nature', mort_roi: 'couronne', couronnement: 'couronne', intro: 'couronne' }[id];
 const [a, b] = T[c] || ['#2b4a7d', '#0e131b'];
 return `radial-gradient(70% 90% at 50% 70%,${a},${b})`;
}

function cadrerDepart() {
 const V = cam(); if (cvC.height <= cvC.width) return;
 const mes = provincesDe(G, 'joueur'); if (!mes.length) return;
 const mx = mes.reduce((s, p) => s + p.x, 0) / mes.length, my = mes.reduce((s, p) => s + p.y, 0) / mes.length;
 V.z = V.tz = clamp(cvC.width / 520, V.base, V.base * 3.2); V.x = V.tx = cvC.width / 2 - mx * V.z; V.y = V.ty = cvC.height * .3 - my * V.z; borner(); V.x = V.tx; V.y = V.ty;
}

function adapter(t) {
 if (ADAPT.fige || document.hidden) return;
 const d = t - (ADAPT.der || t); ADAPT.der = t; if (d <= 0 || d > 250) return;
 ADAPT.ft.push(d); if (ADAPT.ft.length < 90) return;
 const moy = ADAPT.ft.reduce((a, b) => a + b, 0) / ADAPT.ft.length; ADAPT.ft.length = 0;
 if (moy > 18.5 && ADAPT.e > .55) { ADAPT.e = Math.round((ADAPT.e - .12) * 100) / 100; ADAPT.bon = 0; redim(); }
 else if (moy < 15.5 && ADAPT.e < 1) { if (++ADAPT.bon >= 3) { ADAPT.e = Math.min(1, Math.round((ADAPT.e + .08) * 100) / 100); ADAPT.bon = 0; redim(); } }
 else ADAPT.bon = 0;
}

const DERNIER = new Map();
function majTexte(sel, v, html) { v = String(v); if (DERNIER.get(sel) === v) return; DERNIER.set(sel, v); const e = $(sel); if (html) e.innerHTML = v; else e.textContent = v; }
function majStyle(sel, p, v) { const k = sel + p; if (DERNIER.get(k) === v) return; DERNIER.set(k, v); $(sel).style[p] = v; }
