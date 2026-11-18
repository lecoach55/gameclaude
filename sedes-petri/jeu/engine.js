'use strict';
/* =========================================================
   SEDES PETRI — moteur de simulation
   ========================================================= */
let S = null;
const SAVE_KEY = 'sedes_petri_save_v1';
let PADJ = null;

const rnd = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const chance = p => Math.random() < p;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
function roman(n) { if (n <= 0) return ''; const m = [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']]; let s = ''; for (const [v, r] of m) while (n >= v) { s += r; n -= v; } return s; }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function ordFem(n) { return ['Première','Deuxième','Troisième','Quatrième','Cinquième','Sixième','Septième','Huitième','Neuvième','Dixième','Onzième','Douzième'][n - 1] || (n + 'e'); }
function ordMasc(n) { return n === 1 ? 'Ier' : roman(n) + 'e'; }

/* ---------- Adjacence ---------- */
function computeFallbackAdj() {
 const adj = {}; PROVS.forEach(p => adj[p.id] = new Set());
 for (let i = 0; i < PROVS.length; i++) for (let j = i + 1; j < PROVS.length; j++) {
  let d = 1e9; for (const a of PROVS[i].xy) for (const b of PROVS[j].xy) d = Math.min(d, Math.hypot(a[0] - b[0], a[1] - b[1]));
  if (d < 92) { adj[PROVS[i].id].add(PROVS[j].id); adj[PROVS[j].id].add(PROVS[i].id); }
 }
 setAdjacency(adj);
}
function setAdjacency(adj) {
 SEA_LINKS.forEach(([a, b]) => { adj[a].add(b); adj[b].add(a); });
 PADJ = {}; for (const k in adj) PADJ[k] = [...adj[k]];
}

const SEA_SET = new Set(SEA_LINKS.flatMap(([a, b]) => [a + '|' + b, b + '|' + a]));
const AFRICA = ['maroc', 'fes', 'tlemcen', 'algerois', 'ifriq', 'tripolitaine', 'cyrenaique', 'egyptep'];
/* ---------- Accès ---------- */
const RL = r => S.realms[r];
function active(r) { const x = S.realms[r]; return !!x && !x.dormant; }
function provsOf(r) { const o = []; for (const p of PROVS) if (S.own[p.id] === r) o.push(p.id); return o; }
function nProv(r) { let n = 0; for (const p of PROVS) if (S.own[p.id] === r) n++; return n; }
function isCath(r) { return S.realms[r] && S.realms[r].relig === 'catholique'; }
function isChristian(r) { return S.realms[r] && (S.realms[r].relig === 'catholique' || S.realms[r].relig === 'orthodoxe'); }
function realmIds() { return Object.keys(S.realms); }
function catholics(f) { return realmIds().filter(r => r !== 'etats' && active(r) && isCath(r) && (!f || f(r))); }
function activeRealms(f) { return realmIds().filter(r => r !== 'etats' && active(r) && (!f || f(r))); }
function capOf(r) { for (const c of (REALMS[r].caps || [])) if (S.own[c] === r) return c; const ps = provsOf(r); return ps[0] || null; }
function cityOf(r) { const c = capOf(r); return c ? (PROV[c].city || PROV[c].n) : '—'; }
function rname(r) { return S.realms[r].name; }
function hasT(r, t) { const x = S.realms[r]; return !!(x && x.ruler && x.ruler.t.includes(t)); }
function femTitle(t) { return ({Roi:'Reine',Comte:'Comtesse',Duc:'Duchesse',Empereur:'Impératrice','Grand-prince':'Grande-princesse',Basileus:'Basilissa','Haut-roi':'Haute-reine',Seigneur:'Dame'})[t] || t; }
function rtitle(r) { const x = S.realms[r]; if (!x.ruler) return x.title; return x.ruler.f ? femTitle(x.title) : x.title; }
function rulerLbl(r) { const x = S.realms[r]; if (!x || !x.ruler) return rname(r); if (x.ruler.c) return x.ruler.n; return `${rtitle(r)} ${x.ruler.n}`; }
function power(r) {
 const x = S.realms[r]; if (!x || x.dormant) return 0;
 const np = nProv(r); let p = x.base + 5 * Math.sqrt(np) + np * 0.8;
 if (hasT(r, 'guerrier')) p += 5; if (hasT(r, 'faible')) p -= 4; if (hasT(r, 'enfant')) p -= 5;
 if (x.heresy > 60) p -= 4;
 if (r === 'outremer') { if (S.orders.includes('templiers') && !S.flags.templeDissolved) p += 6; if (S.orders.includes('hospitaliers')) p += 5; }
 if (r === 'teutons' && S.orders.includes('teutoniques')) p += 6;
 return Math.max(3, Math.round(p));
}
function realmNeighbors(r) {
 const set = new Set();
 for (const p of PROVS) if (S.own[p.id] === r) for (const q of (PADJ[p.id] || [])) { const o = S.own[q]; if (o !== r) set.add(o); }
 return [...set].filter(x => active(x) || x === 'etats');
}
function atWar(r) { return S.wars.some(w => w.a === r || w.b === r); }
function warsOf(r) { return S.wars.filter(w => w.a === r || w.b === r); }
function popeHas(t) { return S.pope.traits.includes(t); }
function card(id) { return S.cardinals.find(c => c.id === id); }
function cname(c) { return c ? `${c.fn} ${c.ln}` : '—'; }
function popeName() { return `${S.pope.name} ${roman(S.pope.num)}`; }
function dateStr() { return `${SEASONS[S.season]} ${S.year}`; }
function avgFervor() { const c = catholics(); if (!c.length) return 50; return c.reduce((a, r) => a + S.realms[r].fervor, 0) / c.length; }
function avgLoyal() { if (!S.cardinals.length) return 50; return S.cardinals.reduce((a, c) => a + c.loyal, 0) / S.cardinals.length; }
function catholicProvCount() { let n = 0; for (const p of PROVS) if (isCath(S.own[p.id]) || S.own[p.id] === 'etats') n++; return n; }


/* ---------- Grammaire ---------- */
const LOWER_FIRST = ['Royaume','Royaumes','Couronne','République','Commune','Comté','Duché','Duchés','Marche','Seigneurie','Sultanat','Califat','Émirat','Grand-duché','Principautés','Ligue','Rois'];
function artName(r) {
 const n = rname(r); const w = n.split(' ')[0]; const nm = LOWER_FIRST.includes(w) ? n.charAt(0).toLowerCase() + n.slice(1) : n;
 let art;
 if (/^(Royaumes|Principautés|Païens|Taïfas|Normands|Coumans|Grands|Duchés|Beyliks|Rois|Almoravides|Zirides|Almohades|Mérinides)/.test(n)) art = 'les ';
 else if (/^(Couronne|République|Commune|Marche|Ligue|Seigneurie|Horde)/.test(n)) art = 'la ';
 else if (/^Banu/.test(n)) art = '';
 else if (/^[AEIOUÉÈÂH]/i.test(nm)) art = 'l’'; else art = 'le ';
 return { art, nm };
}
function deR(r) { const { art, nm } = artName(r); return art === 'le ' ? 'du ' + nm : art === 'les ' ? 'des ' + nm : 'de ' + art + nm; }
function enR(r) { const { art, nm } = artName(r); return (art === 'les ' && /^(Païens|Coumans|Normands)/.test(rname(r)) ? 'chez ' : 'dans ') + art + nm; }
function de_(s) { return /^[AEIOUÉÈÎÂH]/i.test(s) ? 'd’' + s : 'de ' + s; }
function leR(r) { const { art, nm } = artName(r); return art + nm; }
function auR(r) { const { art, nm } = artName(r); return art === 'le ' ? 'au ' + nm : art === 'les ' ? 'aux ' + nm : 'à ' + art + nm; }
function leRuler(r) { const x = S.realms[r]; if (!x || !x.ruler) return rname(r); if (x.ruler.c) return x.ruler.n.charAt(0).toLowerCase() + x.ruler.n.slice(1); const t = rtitle(r).toLowerCase(); const fem = x.ruler.f || /^(la |reine|comtesse|duchesse|impératrice)/.test(t); return (/^[aeiouéè]/.test(t) ? 'l’' : fem ? 'la ' : 'le ') + t + ' ' + x.ruler.n; }
function auRuler(r) { const s = leRuler(r); return s.startsWith('le ') ? 'au ' + s.slice(3) : s.startsWith('les ') ? 'aux ' + s.slice(4) : 'à ' + s; }
function duRuler(r) { const s = leRuler(r); return s.startsWith('le ') ? 'du ' + s.slice(3) : s.startsWith('les ') ? 'des ' + s.slice(4) : 'de ' + s; }
function capFirst(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function deShort(r) { return r === 'empire' ? 'du Saint-Empire' : de_(mapNameE(r)); }
function mapNameE(r) { if (r === 'empire') return 'Saint-Empire'; if (r === 'byzance') return 'Byzance'; if (r === 'rus') return 'Russie'; if (r === 'balkans') return 'Serbie'; return rname(r).replace(/^(Royaumes?|Couronne|République|Commune|Comté|Duchés?|Marche|Sultanat|Califat|Émirat|Grand-duché|Principautés|Seigneurie)\s+(de la |de l’|des |de |d’|du )?/, ''); }

/* ---------- Modificateurs ---------- */
function log(t, k) { S.log.push({ y: S.year, s: S.season, t, k: k || 'info' }); if (S.log.length > 600) S.log.shift(); if (S.rep) S.rep.push({ t, k: k || 'info' }); }
function modA(n) { if (n > 0 && popeHas('vaniteux')) n *= 1.2; const dk = [[1.15, 0.8], [1, 1], [0.85, 1.25]][S.difficulty == null ? 1 : S.difficulty]; n *= n > 0 ? dk[0] : dk[1]; if (n > 0 && S.authority > 50) n *= Math.max(0.08, (100 - S.authority) / 50); S.authority = clamp(S.authority + n, 0, 100); }
function modT(n) { S.treasury = Math.round(S.treasury + n); }
function modC(n) { S.corruption = clamp(S.corruption + n, 0, 100); }
function modRel(r, n) {
 if (r === 'all') { catholics().forEach(x => modRel(x, n)); return; }
 const x = S.realms[r]; if (!x) return;
 if (n < 0 && popeHas('irascible')) n *= 1.4; if (n > 0 && popeHas('diplomate')) n *= 1.3; if (hasT(r, 'ruse')) n *= 0.8; if (n < 0 && hasT(r, 'colerique')) n *= 1.25;
 x.rel = clamp(x.rel + n, -100, 100);
}
function modF(r, n) { if (r === 'all') { catholics().forEach(x => modF(x, n)); modF('etats', n); return; } const x = S.realms[r]; if (x) x.fervor = clamp(x.fervor + n, 0, 100); }
function modH(r, n) {
 if (r === 'all') { catholics().forEach(x => modH(x, n)); return; }
 const x = S.realms[r]; if (!x) return; x.heresy = clamp(x.heresy + n, 0, 100);
 if (x.heresy >= 20 && !x.hname) x.hname = heresyNameFor(r, S.year);
 x.hmax = Math.max(x.hmax || 0, x.heresy);
}
function modInv(r, n) { if (r === 'all') { catholics().forEach(x => modInv(x, n)); return; } const x = S.realms[r]; if (x) x.invest = clamp(x.invest + n, 0, 100); }
function modStab(n) { S.rome.stab = clamp(S.rome.stab + n, 0, 100); }
function modPeople(n) { S.rome.people = clamp(S.rome.people + n, 0, 100); }
function modHealth(n) { S.pope.health = clamp(S.pope.health + n, 0, 100); }
function modLoy(n, f) { S.cardinals.forEach(c => { if (!f || f(c)) c.loyal = clamp(c.loyal + n, 0, 100); }); }
function fam(n) { return S.rome.fam.find(f => f.n === n); }
function pushEvent(e) { if (e) S.events.push(e); }
function ach(id) { if (!S.ach[id]) { S.ach[id] = { y: S.year, p: popeName() }; log(`Haut fait accompli : « ${ACH[id].n} »`, 'gold'); } }

/* ---------- Souverains ---------- */
const FEMALE = ['Mathilde','Jeanne','Isabelle','Blanche','Marie','Constance','Urraca','Bérengère','Marguerite','Élisabeth','Béatrice'];
const NUMBERED = ['empire','france','angleterre','castille','aragon','portugal','sicile','hongrie','byzance','ecosse','navarre','danemark','suede','norvege','pologne','georgie','armenie','outremer','balkans'];
function randTraits() {
 const all = ['pieux','zele','guerrier','ambitieux','ruse','colerique','faible','anticlerical','erudit','batisseur','tolerant','avide','paresseux'];
 const t = []; const n = chance(0.35) ? 2 : 1;
 while (t.length < n) { const x = pick(all); if (t.includes(x)) continue; if ((x === 'pieux' && t.includes('anticlerical')) || (x === 'anticlerical' && (t.includes('pieux') || t.includes('zele')))) continue; t.push(x); }
 return t;
}
function genRuler(r, o) {
 o = o || {}; const rd = REALMS[r], x = S.realms[r];
 if (rd.doge) {
  const fn = pick(['Pietro','Giovanni','Marco','Andrea','Francesco','Jacopo','Lorenzo','Ranieri','Tommaso','Bartolomeo','Simone','Antonio']);
  return { n: `${fn} ${pick(rd.doge)}`, a: ri(52, 76), p: ri(3, 8), t: chance(0.5) ? ['marchand'] : randTraits(), d: '', elected: 1 };
 }
 if (!rd.names) return { n: x.ruler ? x.ruler.n : 'Les magistrats', a: 0, p: 5, t: [], d: '', c: 1 };
 const female = chance(0.06) && !['teutons','egypte','turcs','maghreb','ifriqiya','andalus','horde','baltes','byzance','empire'].includes(r);
 const base = female ? pick(FEMALE) : pick(rd.names);
 x.nc[base] = (x.nc[base] || 0) + 1;
 let name = base;
 if (r === 'teutons') name = `${base} ${pick(rd.gm)}`;
 else if (NUMBERED.includes(r) && (x.nc[base] >= 2 || (S.scenNums && S.scenNums[r]))) name = `${base} ${x.nc[base] === 1 ? (female ? 'Ire' : 'Ier') : roman(x.nc[base])}`;
 const age = o.age != null ? o.age : ri(16, 45);
 const t = randTraits(); if (age < 16) t.unshift('enfant');
 let p = ri(2, 8); if (t.includes('pieux') || t.includes('zele')) p += 2; if (t.includes('anticlerical')) p -= 3;
 return { n: name, a: age, p: clamp(p, 0, 10), t, d: o.d || (x.ruler && x.ruler.d) || (rd.dyns ? pick(rd.dyns) : ''), f: female ? 1 : 0 };
}
function targetRel(r) {
 const x = S.realms[r]; if (r === 'etats') return 100;
 const ru = x.ruler; let t = 0;
 if (x.relig === 'catholique') {
  t = ru && !ru.c ? (ru.p - 5) * 6 : 5;
  if (hasT(r, 'pieux')) t += 12; if (hasT(r, 'zele')) t += 8; if (hasT(r, 'anticlerical')) t -= 25; if (hasT(r, 'ambitieux')) t -= 6; if (hasT(r, 'avide')) t -= 4;
  t -= (x.invest - 45) / 3;
  if (S.year > 1300) t -= 8; if (S.year > 1400) t -= 7;
  if (x.vassal) t += 12; if (x.excom) t -= 30; if (x.interdict) t -= 12;
  if (S.schism && S.schism.backer === r) t -= 25;
  if (S.curia === 'avignon') t += (r === 'france' ? 20 : -5);
  if (S.decrees.includes('embargo') && (r === 'venise' || r === 'genes')) t -= 10;
 } else if (x.relig === 'orthodoxe') {
  t = -12 + (r === 'byzance' ? x.union / 3 : 5); if (S.flags.sac && r === 'byzance') t -= 40; if (S.flags.unionDone && r === 'byzance') t += 25;
 } else if (x.relig === 'musulman') { t = -25 + (S.orders.includes('trinitaires') ? 8 : 0); }
 else t = -20 + x.mission / 4;
 return clamp(t, -90, 90);
}

/* ---------- Cardinaux ---------- */
function genCardinal(nat, o) {
 o = o || {}; const pool = CARD_NAMES[nat];
 const tk = Object.keys(POPE_TRAITS);
 const trait = o.trait || (chance(0.72) ? pick(tk.filter(t => POPE_TRAITS[t].v)) : pick(tk.filter(t => !POPE_TRAITS[t].v)));
 let comp = ri(2, 9); if (S.build && S.build.studium === true) comp += 1; if (S.decrees && S.decrees.includes('universites')) comp += 1;
 return { id: S.nextId++, fn: o.fn || pick(pool.f), ln: o.ln || pick(pool.l), nat, age: o.age || ri(40, 66), loyal: o.loyal != null ? o.loyal : ri(35, 70),
  comp: clamp(comp, 1, 10), piety: ri(2, 9), amb: ri(1, 9), trait, office: null, legate: null, nephew: !!o.nephew, seed: Math.floor(Math.random() * 1e9) };
}
function removeCardinal(c) {
 if (S.dauphin === c.id) S.dauphin = null;
 for (const k in S.offices) if (S.offices[k] === c.id) S.offices[k] = null;
 if (c.legate && S.realms[c.legate]) S.realms[c.legate].legate = null;
 S.cardinals = S.cardinals.filter(x => x !== c);
}
function genCandidates() {
 const nats = ['italien', 'italien', 'italien'];
 if (S.realms.france.rel > 20 || S.curia === 'avignon') nats.push('francais', 'francais');
 if (S.realms.empire.rel > 20) nats.push('allemand'); if (S.realms.castille.rel > 20 || S.realms.aragon.rel > 20) nats.push('espagnol');
 if (S.realms.angleterre.rel > 20) nats.push('anglais'); nats.push('francais');
 const out = []; for (let i = 0; i < 3; i++) out.push(genCardinal(pick(nats)));
 const pfn = pick(CARD_NAMES[S.pope.nat] ? CARD_NAMES[S.pope.nat].f : CARD_NAMES.italien.f);
 out.push(genCardinal(S.pope.nat in CARD_NAMES ? S.pope.nat : 'italien', { fn: pfn, ln: S.pope.fam, nephew: true, age: ri(24, 38), loyal: popeHas('nepotiste') ? 95 : 82 }));
 S.cands = out;
}

/* ---------- Nouvelle partie ---------- */
function newGame(o) {
 const sc = SCEN[o.scen];
 S = { v: 1, scen: o.scen, year: sc.year, season: 0, turn: 0, treasury: sc.treasury, authority: sc.authority, corruption: sc.corruption,
  fisc: 1, indulg: false, debt: 0, curia: 'rome', seals: 0, nextId: 1, own: {}, ctrl: {}, realms: {}, cardinals: [],
  offices: { camerlingue: null, chancelier: null, penitencier: null, inquisiteur: null },
  rome: { fam: sc.fam.map(([n, p, l]) => ({ n, power: p, loyal: l })), people: 50, stab: 56 },
  army: sc.army, build: {}, decrees: [], orders: [], crusade: null, crusades: [], tsNo: { '1073': 0, '1198': 3, '1294': 9, '1378': 9 }[o.scen] || 0, wars: [], schism: null, council: null, lastCouncil: sc.year - 6,
  relics: 0, jubilee: 0, plague: 0, flags: Object.assign({}, sc.flags || {}), used: {}, log: [], hist: [], ach: {}, popes: [], pnames: Object.assign({}, sc.pn),
  mediations: 0, crusadeWins: 0, created: 0, cands: null, events: [], pendingConclave: null, over: null, evc: {}, evDone: {}, zeroA: 0, rep: null,
  scenNums: sc.nums || {}, councils: 0, lastBulle: -9, difficulty: o.diff == null ? 1 : o.diff };
 PROVS.forEach(p => S.own[p.id] = sc.owners[p.id] || p.o);
 S.home = Object.assign({}, S.own);
 PATRI.forEach(p => S.ctrl[p] = sc.ctrl[p]);
 for (const id in REALMS) {
  const rd = REALMS[id];
  const R = { id, relig: rd.rel, name: (sc.names && sc.names[id]) || rd.n, title: (sc.titles && sc.titles[id]) || rd.title,
   rel: 0, fervor: ri(44, 60), heresy: 0, hname: null, hmax: 0, invest: clamp(sc.invest + ri(-10, 10), 5, 95), excom: false, excomT: 0, interdict: false,
   vassal: false, legate: null, penit: false, mission: id === 'baltes' ? sc.mission : 0, union: id === 'byzance' ? sc.union : 0,
   nc: Object.assign({}, (sc.nums && sc.nums[id]) || {}), ruler: null, dormant: false, base: rd.base, lastRose: -99, lastSub: -99, lastRachat: -99, fear: 0, exhort: false, obed: 'pape', offense: 0 };
  S.realms[id] = R;
 }
 if (o.scen === '1294') { S.realms.baltes.name = 'Grand-duché de Lituanie'; }
 for (const id in REALMS) {
  const R = S.realms[id], spec = sc.rulers[id];
  if (id === 'etats') continue;
  if (nProv(id) === 0) { R.dormant = true; continue; }
  if (spec) { R.ruler = { n: spec.n, a: spec.a, p: spec.p, t: spec.t.slice(), d: spec.d, f: spec.f ? 1 : 0, c: spec.c ? 1 : 0 }; if (spec.ward) R.ward = true; if (spec.claim) R.claimant = spec.claim; if (spec.excom) { R.excom = true; R.excomT = 4; } }
  else R.ruler = genRuler(id);
  if (R.ruler.t.includes('enfant')) R.ruler.t = R.ruler.t.filter(t => t !== 'enfant').concat(R.ruler.a < 16 ? ['enfant'] : []);
 }
 for (const id in S.realms) { if (id === 'etats') continue; const R = S.realms[id]; if (R.dormant) continue; R.rel = clamp(targetRel(id) + (sc.rel[id] || 0) + ri(-6, 6), -100, 100); }
 S.realms.etats.fervor = 62;
 for (const r in (sc.heresy || {})) { const [v, n] = sc.heresy[r]; S.realms[r].heresy = v; S.realms[r].hname = n || (v >= 20 ? heresyNameFor(r, S.year) : null); S.realms[r].hmax = v; }
 (sc.wars || []).forEach(([a, b]) => S.wars.push({ a, b, score: ri(-8, 8), t: ri(0, 3), max: ri(6, 12) }));
 for (const nat in sc.cards) for (let i = 0; i < sc.cards[nat]; i++) S.cardinals.push(genCardinal(nat));
 const byComp = S.cardinals.slice().sort((a, b) => b.comp - a.comp);
 S.offices.camerlingue = byComp[0].id; byComp[0].office = 'camerlingue';
 S.offices.chancelier = byComp[1].id; byComp[1].office = 'chancelier';
 const traits = [o.voc]; if (o.flaw) traits.push(pick(Object.keys(POPE_TRAITS).filter(t => !POPE_TRAITS[t].v)));
 S.pnames[o.name] = (S.pnames[o.name] || 0) + 1;
 S.pope = { name: o.name, num: S.pnames[o.name], fam: o.fam || 'de Rome', fn: '', nat: o.nat || 'italien', age: sc.pope.age, health: 82, traits, start: S.year, startS: 0, seed: Math.floor(Math.random() * 1e9) };
 S.pope.s = reignSnap();
 const pf = fam(S.pope.fam); if (pf) pf.loyal = Math.max(pf.loyal, 80);
 if (o.diff === 0) { S.treasury += 120; S.authority += 6; }
 if (o.diff === 2) { S.treasury -= 60; S.authority -= 6; S.corruption += 6; }
 S.seals = sealsMax();
 log(`${popeName()} est élu évêque de Rome et coiffe la tiare.`, 'gold');
 if (o.scen === '1073') log('Les prêtres concubinaires et la vente des évêchés scandalisent les réformateurs. L’empereur Henri IV tient à ses investitures.', 'info');
 if (o.scen === '1198') log('Deux rois se disputent la couronne d’Allemagne : Philippe de Souabe et Otton de Brunswick. Le pape est tuteur du jeune Frédéric de Sicile.', 'info');
 if (o.scen === '1378') log('Le peuple romain a envahi le conclave en criant « Romano lo volemo ! ». Les cardinaux français ne l’oublieront pas.', 'info');
 if (o.scen === '1294') log('Les Colonna contestent la légitimité de l’abdication de Célestin V. Philippe le Bel lève des taxes sur son clergé.', 'info');
 if (!PADJ) computeFallbackAdj();
 snapshot();
 return S;
}

/* ---------- Sceaux ---------- */
function sealsMax() {
 let n = 3; if (popeHas('juriste')) n++; if (S.build.chancellerie === true) n++;
 const ch = S.offices.chancelier && card(S.offices.chancelier); if (ch && ch.comp >= 7) n++;
 if (S.pope.age >= 78 || S.pope.health < 25) n--; if (S.curia === 'exil') n--;
 return Math.max(1, n);
}

/* ---------- Budget ---------- */
function budget() {
 const inc = [], exp = [];
 let patr = 0; for (const p of PATRI) if (S.own[p] === 'etats') patr += PATRI_VAL[p] * S.ctrl[p] / 100;
 if (S.orders.includes('cisterciens')) patr *= 1.1;
 inc.push(['Patrimoine de saint Pierre', patr]);
 let tithe = 0, cens = 0, denier = 0;
 for (const r of catholics()) {
  const x = S.realms[r]; if (x.obed !== 'pape') continue;
  let f = nProv(r) * 0.62 * (0.4 + x.invest / 100 * 0.8) * (0.6 + x.fervor / 125);
  f *= x.rel < -50 ? 0.25 : x.rel < 0 ? 0.65 : 1; if (x.interdict) f *= 0.3; else if (x.excom) f *= 0.6; if (x.heresy > 60) f *= 0.6;
  tithe += f; if (x.vassal) cens += 3; if (DENIER.includes(r) && x.rel >= 0) denier += 1.5;
 }
 tithe *= [0.75, 1, 1.3, 1.6][S.fisc]; if (S.curia === 'avignon') tithe *= 1.15; if (S.plague > 0) tithe *= 0.7;
 if (S.decrees.includes('simonie')) tithe *= 0.95; if (S.decrees.includes('clericis')) tithe *= 1.1;
 inc.push(['Dîmes et taxes ecclésiastiques', tithe]);
 if (cens) inc.push(['Cens des royaumes vassaux', cens]);
 if (denier) inc.push(['Denier de saint Pierre', denier]);
 let pil = 0;
 if (S.curia === 'rome') { pil = 6 + (S.build.basilique === true ? 5 : 0) + Math.sqrt(S.relics) * 3; if (S.rome.stab < 40) pil *= 0.6; }
 else if (S.curia === 'avignon') pil = 3 + (S.build.palais_avignon === true ? 4 : 0) + Math.sqrt(S.relics) * 1.5;
 if (S.jubilee > 0) pil *= 3; if (S.plague > 0) pil *= 0.5;
 inc.push(['Pèlerinages et offrandes', pil]);
 if (S.indulg) inc.push(['Indulgences', (4 + 0.12 * catholicProvCount()) * (S.flags.print ? 1.6 : 1)]);
 if (S.orders.includes('templiers') && !S.flags.templeDissolved) inc.push(['Banque du Temple', 3]);
 if (S.build.ostie === true) inc.push(['Port d’Ostie', 3]);
 if (S.build.aqueduc === true) inc.push(['Moulins de l’aqueduc', 2]);
 if (S.build.palais_avignon === true && S.curia === 'avignon') inc.push(['Chambre apostolique d’Avignon', 4]);
 const gross = inc.reduce((a, b) => a + b[1], 0);
 const cam = S.offices.camerlingue && card(S.offices.camerlingue);
 if (cam) { const bo = gross * (cam.comp - 5) * 0.02; if (bo > 0) inc.push(['Habileté du camerlingue', bo]); else if (bo < 0) exp.push(['Maladresse du camerlingue', -bo]); }
 else exp.push(['Camerlingue vacant', gross * 0.08]);
 if (popeHas('avide')) inc.push(['Avidité du pontife', gross * 0.12]);
 const loss = gross * S.corruption / 200; if (loss > 0.5) exp.push(['Détournements (corruption)', loss]);
 exp.push(['Entretien de la Curie', (5 + S.cardinals.length * 0.7) * (popeHas('ascete') ? 0.85 : 1)]);
 if (S.treasury > 500) exp.push(['Train de vie de la cour pontificale', (S.treasury - 500) * 0.06]);
 if (S.army > 0) exp.push(['Solde des troupes', S.army / 100 * 2]);
 const leg = S.cardinals.filter(c => c.legate).length; if (leg) exp.push(['Légations', leg * 2]);
 if (S.debt > 0) exp.push(['Intérêts des emprunts', S.debt * 0.03]);
 const ti = inc.reduce((a, b) => a + b[1], 0), te = exp.reduce((a, b) => a + b[1], 0);
 return { inc, exp, ti, te, total: ti - te };
}

/* ---------- Actions ---------- */
function used(k) { return !!S.used[k]; }
function markUsed(k) { S.used[k] = 1; }
const ACT = {
 legat: { n:'Envoyer un légat', s:1, d:'Un cardinal part représenter le pape : relations, investitures, lutte contre l’hérésie, négociations.',
  can: a => { const R = RL(a.r); if (R.legate) return 'Un légat y réside déjà'; if (S.cardinals.filter(c => c.legate).length >= 3 + (S.build.bibliotheque === true ? 1 : 0)) return 'Trop de légations ouvertes'; if (!S.cardinals.some(c => !c.legate && !c.office)) return 'Aucun cardinal disponible'; return null; },
  run: a => { const c = card(a.c); if (c.legate && c.legate !== a.r && S.realms[c.legate]) S.realms[c.legate].legate = null; c.legate = a.r; RL(a.r).legate = c.id; return `Le cardinal ${cname(c)} part en légation auprès de ${rulerLbl(a.r)}.`; } },
 rappel: { n:'Rappeler le légat', s:0, d:'Le cardinal revient à la Curie.', can: a => RL(a.r).legate ? null : 'Pas de légat',
  run: a => { const c = card(RL(a.r).legate); if (c) c.legate = null; RL(a.r).legate = null; return 'Le légat regagne Rome.'; } },
 investir: { n:'Exiger les investitures', s:1, d:'Le pape seul investit les évêques. Investitures ↑, mais le souverain s’irrite.',
  can: a => { const R = RL(a.r); if (!isCath(a.r)) return 'Royaume non catholique'; if (R.invest >= 95) return 'Déjà acquises'; if (S.authority < 25) return 'Autorité insuffisante (25)'; return null; },
  run: a => { const R = RL(a.r); const g = popeHas('reformateur') ? 16 : 11; modInv(a.r, g); const loss = 6 + (hasT(a.r, 'ambitieux') ? 6 : 0) + (hasT(a.r, 'anticlerical') ? 7 : 0) - (hasT(a.r, 'pieux') ? 4 : 0); modRel(a.r, -loss); if (R.rel < -40) R.offense++; return `La bulle est portée ${/^[AÀ]/.test(cityOf(a.r)) ? 'à ' : 'à '}${cityOf(a.r)}. Investitures +${g}, relation −${loss}.`; } },
 conceder: { n:'Concéder les investitures', s:1, d:'Laisser le souverain choisir ses évêques : il vous en saura gré.',
  can: a => !isCath(a.r) ? 'Royaume non catholique' : RL(a.r).invest <= 5 ? 'Plus rien à concéder' : null,
  run: a => { modInv(a.r, -15); modRel(a.r, 14); modA(-3); modC(1); return 'Le souverain nommera ses évêques. Relation +14, autorité −3.'; } },
 excom: { n:'Excommunier le souverain', s:1, d:'Arme suprême : délie les vassaux de leur serment. Injustifiée, elle discrédite le Saint-Siège.',
  can: a => { const R = RL(a.r); if (!isCath(a.r)) return 'Hors de la communion romaine'; if (R.excom) return 'Déjà excommunié'; if (!R.ruler || R.ruler.c) return 'Pas de souverain personnel'; if (S.authority < 30) return 'Autorité insuffisante (30)'; return null; },
  run: a => { const R = RL(a.r); const just = R.offense > 0 || R.rel < -30 || R.heresy > 50; R.excom = true; R.excomT = 0; R.penit = false; modRel(a.r, -35); modA(just ? 4 : -5); R.offense = 0; log(`${popeName()} excommunie ${leRuler(a.r)}.`, 'bad'); return just ? 'La sentence tonne dans toutes les églises. La Chrétienté approuve.' : 'La sentence semble excessive : on murmure contre l’orgueil de Rome (autorité −5).'; } },
 absoudre: { n:'Lever l’excommunication', s:1, d:'Réconcilier le souverain avec l’Église.',
  can: a => RL(a.r).excom ? null : 'Non excommunié',
  run: a => { const R = RL(a.r); const p = R.penit; R.excom = false; R.interdict = false; R.penit = false; R.excomT = 0; modRel(a.r, p ? 20 : 12); modA(p ? 5 : -3); if (S.schism && S.schism.backer === a.r && chance(0.6)) endSchism('reconciliation'); return p ? 'Le pénitent est absous : la miséricorde grandit le pontife.' : 'Absolution sans pénitence : on y voit de la faiblesse.'; } },
 interdit: { n:'Jeter l’interdit', s:1, d:'Plus aucun sacrement dans le royaume : pression énorme sur le roi, mais le peuple souffre.',
  can: a => { const R = RL(a.r); if (!R.excom) return 'Il faut d’abord excommunier'; if (R.interdict) return 'Déjà sous interdit'; return null; },
  run: a => { RL(a.r).interdict = true; modA(1); modF(a.r, -6); log(`Interdit ${enR(a.r)} : les cloches se taisent.`, 'bad'); return 'Les églises ferment leurs portes. Les morts attendent leur sépulture.'; } },
soutenir: { n:'Soutenir dans sa guerre', s:1, c:40, d:'Subsides et bénédiction pour l’un des belligérants.',
  can: a => S.wars.some(w => (w.a === a.r && w.b === a.e) || (w.b === a.r && w.a === a.e)) ? null : 'Pas de guerre',
  run: a => { const w = S.wars.find(w => (w.a === a.r && w.b === a.e) || (w.b === a.r && w.a === a.e)); w.score += w.a === a.r ? 16 : -16; modRel(a.r, 10); modRel(a.e, -12); if (!isChristian(a.e)) modA(2); return `L’or pontifical soutient ${leR(a.r)} contre ${leR(a.e)}.`; } },
 lever_interdit: { n:'Lever l’interdit', s:1, d:'Rouvrir les églises.', can: a => RL(a.r).interdict ? null : 'Pas d’interdit',
  run: a => { RL(a.r).interdict = false; modRel(a.r, 6); modF(a.r, 4); return 'Les cloches sonnent de nouveau.'; } },
 rose: { n:'Offrir la Rose d’or', s:1, c:25, d:'Bijou béni au dimanche de Laetare : un honneur insigne pour un souverain.',
  can: a => { if (!isCath(a.r)) return 'Réservée aux princes catholiques'; if (S.year - RL(a.r).lastRose < 5) return 'Déjà honoré récemment'; return null; },
  run: a => { RL(a.r).lastRose = S.year; modRel(a.r, 12); return `La Rose d’or est portée à ${cityOf(a.r)}. Relation +12.`; } },
 predication: { n:'Envoyer des prédicateurs', s:1, c:20, d:'Sermons, controverses publiques, conversions : l’hérésie recule, la ferveur monte.',
  can: a => !isCath(a.r) ? 'Royaume non catholique' : null,
  run: a => { let m = 1; if (S.orders.includes('dominicains')) m *= 1.6; if (popeHas('theologien')) m *= 1.5; if (S.build.studium === true) m *= 1.2; const h = Math.round(6 * m); modH(a.r, -h); modF(a.r, 4 + (S.orders.includes('franciscains') ? 2 : 0)); return `Les prêcheurs parcourent les terres ${deR(a.r)}. Hérésie −${h}.`; } },
 inquisition: { n:'Ouvrir une inquisition', s:1, c:30, d:'Tribunaux d’exception contre l’hérésie : radical, mais la peur et les abus dressent les fidèles contre Rome.',
  can: a => { if (!S.decrees.includes('inquisition')) return 'Exige le décret de l’Inquisition'; if (!isCath(a.r)) return 'Royaume non catholique'; if (RL(a.r).heresy < 10) return 'Hérésie trop faible'; return null; },
  run: a => { const inq = S.offices.inquisiteur && card(S.offices.inquisiteur); let h = 25 * (1 + (inq ? inq.comp / 10 : 0)) * (S.orders.includes('dominicains') ? 1.2 : 1); h = Math.round(h); modH(a.r, -h); modF(a.r, -5); modRel(a.r, -8); modC(2); RL(a.r).fear = 8; return `Les inquisiteurs siègent à ${cityOf(a.r)}. Hérésie −${h}, mais la crainte s’installe (ferveur −5).`; } },
 vassal: { n:'Recevoir la vassalité', s:1, d:'Le royaume devient fief du Saint-Siège et paie un cens annuel.',
  can: a => { const R = RL(a.r); if (!isCath(a.r)) return 'Royaume non catholique'; if (a.r === 'empire') return 'L’Empereur ne peut être vassal'; if (R.vassal) return 'Déjà vassal'; if (R.rel < 60) return 'Relation insuffisante (60)'; return null; },
  run: a => { RL(a.r).vassal = true; modRel(a.r, 5); modA(2); log(`${capFirst(leRuler(a.r))} se reconnaît vassal du Saint-Siège.`, 'gold'); return 'Hommage est prêté entre les mains du pape.'; } },
 subside: { n:'Demander un subside', s:1, d:'Réclamer une contribution exceptionnelle au trésor pontifical.',
  can: a => { if (!isCath(a.r)) return 'Royaume non catholique'; if (RL(a.r).rel < 0) return 'Relation trop mauvaise'; if (S.year - RL(a.r).lastSub < 3) return 'Déjà sollicité'; return null; },
  run: a => { const g = Math.round(power(a.r) * 2.2); modT(g); modRel(a.r, -12); modC(1); RL(a.r).lastSub = S.year; return `${rulerLbl(a.r)} verse ${g} marcs, sans enthousiasme.`; } },
 mediation: { n:'Arbitrer la paix', s:1, d:'Proposer la médiation pontificale entre belligérants chrétiens.',
  can: a => warsOf(a.r).some(w => isChristian(w.a) && isChristian(w.b)) ? null : 'Pas en guerre contre des chrétiens',
  run: a => { const w = warsOf(a.r).find(w => isChristian(w.a) && isChristian(w.b)); const p = clamp(0.3 + (S.authority - 50) / 150 + (RL(w.a).rel + RL(w.b).rel) / 400 + (popeHas('diplomate') ? 0.15 : 0) + (S.decrees.includes('treve') ? 0.1 : 0), 0.05, 0.92);
   if (chance(p)) { S.wars = S.wars.filter(x => x !== w); modA(3); modRel(w.a, 5); modRel(w.b, 5); S.mediations++; log(`Paix de ${S.year} entre ${leR(w.a)} et ${leR(w.b)}, sous l’arbitrage du pape.`, 'good'); return 'Les deux partis s’embrassent devant le légat. La paix est signée.'; }
   modA(-2); modRel(w.a, -3); modRel(w.b, -3); return 'Les plénipotentiaires se séparent sans accord.'; } },
 exhorter: { n:'Exhorter à prendre la croix', s:1, d:'Lettre personnelle du pape : chance accrue de rejoindre la croisade.',
  can: a => { const c = S.crusade; if (!c || c.phase !== 'predication') return 'Pas de croisade en prédication'; if (c.members.includes(a.r)) return 'Déjà croisé'; if (!isCath(a.r)) return 'Royaume non catholique'; return null; },
  run: a => { RL(a.r).exhort = true; return 'Le légat remet la lettre au souverain.'; } },
 ambassade: { n:'Envoyer une ambassade', s:1, c:15, d:'Dialogue, présents et théologiens.',
  can: a => (RL(a.r).relig === 'orthodoxe' || RL(a.r).relig === 'musulman') ? null : 'Inutile ici',
  run: a => { modRel(a.r, 10); if (a.r === 'byzance' && !S.flags.unionDone && !S.flags.sac) { const g = 8 + (popeHas('diplomate') ? 4 : 0) + (popeHas('theologien') ? 3 : 0); RL('byzance').union = clamp(RL('byzance').union + g, 0, 100); return `Les théologiens grecs et latins dissertent sur le Filioque. Union +${g}.`; } return 'Les présents sont acceptés. Relation +10.'; } },
 mission: { n:'Envoyer des missionnaires', s:1, c:25, d:'Prêcher l’Évangile aux païens.',
  can: a => RL(a.r).relig === 'paien' ? null : 'Peuple déjà chrétien ou musulman',
  run: a => { const R = RL(a.r); if (chance(0.72)) { const g = 10 + (S.orders.includes('franciscains') ? 4 : 0) + (S.orders.includes('dominicains') ? 3 : 0) + (S.orders.includes('carmes') ? 3 : 0); R.mission = clamp(R.mission + g, 0, 100); if (R.mission >= 100) convertRealm(a.r); return `Des baptêmes sont célébrés au bord des rivières. Mission +${g}.`; } R.mission += 4; modF('all', 1); return 'Les missionnaires ont été martyrisés. Leur sang est une semence (mission +4, ferveur +1).'; } },
 rachat: { n:'Racheter des captifs', s:1, d:'Négocier la libération de chrétiens captifs.', c: () => S.orders.includes('trinitaires') ? 25 : 40,
  can: a => RL(a.r).relig !== 'musulman' ? 'Seulement auprès des princes musulmans' : (S.year - RL(a.r).lastRachat < 2 ? 'Négociation récente' : null),
  run: a => { RL(a.r).lastRachat = S.year; modA(4); modF('all', 1); modRel(a.r, 6); return 'Des centaines de captifs rentrent chez eux, chaînes au cou en action de grâces.'; } },
 // Rome
 pain: { n:'Distribuer du pain', s:0, c:25, d:'Le peuple de Rome bénit le pape qui le nourrit.', can: () => used('pain') ? 'Déjà fait cette saison' : null,
  run: () => { markUsed('pain'); modPeople(12); return 'Les greniers du Latran s’ouvrent. Peuple +12.'; } },
 procession: { n:'Grande procession', s:1, d:'Reliques et bannières à travers la ville.', can: () => S.curia !== 'rome' ? 'Le pape n’est pas à Rome' : used('proc') ? 'Déjà faite' : null,
  run: () => { markUsed('proc'); modPeople(6); modF('etats', 5); modA(1); return 'La Véronique est portée de Saint-Pierre au Latran sous les hymnes.'; } },
 favoriser: { n:'Favoriser', s:1, d:'Charges, fiefs et mariages pour cette famille ; les autres s’en offusquent.', can: a => used('fav') ? 'Déjà fait cette saison' : null,
  run: a => { markUsed('fav'); S.rome.fam.forEach(f => f.loyal = clamp(f.loyal + (f.n === a.f ? 20 : -8), 0, 100)); return `Les ${a.f} reçoivent des châteaux du Latium. Les autres grondent.`; } },
 chatier: { n:'Châtier', s:1, d:'Raser leurs tours urbaines avec la milice pontificale.', can: a => S.army < 200 ? '200 hommes requis' : null,
  run: a => { const f = fam(a.f); const ok = S.army / 100 * 4 + 5 + rnd(0, 10) > f.power * rnd(0.5, 1.1); if (ok) { f.power = clamp(f.power - 14, 8, 80); f.loyal = clamp(f.loyal + 8, 0, 100); modStab(5); modA(2); return `Les tours des ${a.f} s’effondrent. La noblesse romaine tremble.`; } S.army = Math.max(0, S.army - 100); modStab(-8); modA(-3); return `La milice est repoussée par les arbalétriers des ${a.f}. Cent hommes perdus.`; } },
 recruter: { n:'Recruter 100 hommes', s:0, c:25, d:'Mercenaires et sergents. Solde : 2 marcs/saison par centaine.', can: () => S.army >= 2000 ? 'Armée au maximum' : null,
  run: () => { S.army += 100; return 'Une compagnie de routiers passe au service de saint Pierre.'; } },
 licencier: { n:'Licencier 100 hommes', s:0, d:'Réduire la solde.', can: () => S.army < 100 ? 'Aucune troupe' : null, run: () => { S.army -= 100; return 'Cent hommes sont congédiés.'; } },
 campagne: { n:'Campagne militaire', s:1, d:'Soumettre les seigneurs rebelles de la province.', can: a => S.army < 200 ? '200 hommes requis' : S.ctrl[a.p] >= 95 ? 'Province déjà soumise' : null,
  run: a => { if (chance(clamp(0.45 + S.army / 2000, 0.3, 0.92))) { S.ctrl[a.p] = clamp(S.ctrl[a.p] + ri(20, 32), 0, 100); modA(1); return `Les châteaux rebelles de ${PROV[a.p].n} ouvrent leurs portes.`; } S.army = Math.max(0, S.army - 100); S.ctrl[a.p] = clamp(S.ctrl[a.p] - 5, 0, 100); return 'Embuscade dans les collines : la colonne pontificale reflue.'; } },
 recteur: { n:'Nommer un recteur', s:0, c:15, d:'Un administrateur ecclésiastique énergique.', can: a => used('rect' + a.p) ? 'Déjà fait cette saison' : null,
  run: a => { markUsed('rect' + a.p); S.ctrl[a.p] = clamp(S.ctrl[a.p] + 8, 0, 100); return 'Le recteur fait prêter serment aux communes.'; } },
 build: { n:'Lancer le chantier', s:1, d:'', c: a => Math.round(BUILDINGS[a.b].c * (popeHas('batisseur') ? 0.75 : 1)),
  can: a => { const b = BUILDINGS[a.b]; if (S.build[a.b] !== undefined) return 'Déjà entrepris'; if (b.avignon && S.curia !== 'avignon') return 'Seulement en Avignon'; if (b.min && S.year < b.min) return `Pas avant ${b.min}`; if (!b.avignon && S.curia !== 'rome') return 'Le pape doit résider à Rome'; return null; },
  run: a => { S.build[a.b] = Math.max(1, BUILDINGS[a.b].t - (popeHas('batisseur') ? 1 : 0)); return `Les maîtres d’œuvre commencent : ${BUILDINGS[a.b].n}.`; } },
 transfert: { n:'', s:2, c:80, d:'Déplacer la Curie entre Rome et Avignon.',
  can: () => { if (S.curia === 'exil') return 'La Curie est en exil'; if (S.curia === 'rome' && S.year < 1274) return 'Le Comtat n’appartient pas encore au pape (1274)'; return null; },
  run: () => { if (S.curia === 'rome') { S.curia = 'avignon'; modRel('france', 15); modA(-4); log('La Curie s’établit en Avignon, au bord du Rhône.', 'bad'); return 'Les mules chargées d’archives prennent la route de Provence.'; } S.curia = 'rome'; modRel('france', -12); modA(6); modStab(10); log('Le pape rentre à Rome sous les acclamations.', 'gold'); return 'Rome retrouve son pasteur.'; } },
 retour: { n:'Rentrer à Rome', s:1, d:'Quitter l’exil et regagner le Latran.', can: () => S.curia !== 'exil' ? 'Pas en exil' : S.rome.stab < 35 ? 'Rome est trop agitée (stabilité 35)' : null,
  run: () => { S.curia = 'rome'; modA(4); log('Le pape quitte l’exil et rentre au Latran.', 'good'); return 'La foule jonche les rues de rameaux.'; } },
 // Curie
 creer: { n:'Créer cardinal', s:1, c:15, d:'Consistoire secret : un nouveau prince de l’Église.',
  can: a => S.created >= 2 ? 'Deux créations par an au plus' : S.cardinals.length >= 30 ? 'Collège complet (30)' : null,
  run: a => { const c = S.cands.find(x => x.id === a.c); S.cardinals.push(c); S.cands = S.cands.filter(x => x !== c); S.created++; if (c.nephew) { modC(3); S.rome.fam.forEach(f => { if (f.n === S.pope.fam) f.loyal = clamp(f.loyal + 5, 0, 100); }); } return `${cname(c)} reçoit le chapeau rouge.`; } },
 faveur: { n:'Gratifier', s:0, c:20, d:'Bénéfices et prébendes : fidélité accrue.', can: a => !card(a.c) ? 'Cardinal introuvable' : used('fav' + a.c) ? 'Déjà gratifié' : null,
  run: a => { markUsed('fav' + a.c); const c = card(a.c); c.loyal = clamp(c.loyal + 15, 0, 100); modC(1); return `${cname(c)} remercie avec effusion.`; } },
 disgrace: { n:'Disgracier', s:1, d:'Retirer le chapeau : les autres cardinaux s’inquiètent.', can: a => card(a.c) ? null : 'Cardinal introuvable',
  run: a => { const c = card(a.c); const was = c.loyal; removeCardinal(c); modLoy(-4); modLoy(-6, x => x.nat === c.nat); if (was < 30) modA(2); log(`Le cardinal ${cname(c)} est déposé.`, 'bad'); return 'Le chapeau rouge est arraché en plein consistoire.'; } },
 consistoire: { n:'Tenir consistoire', s:1, d:'Écouter le collège : loyauté générale +5.', can: () => used('cons') ? 'Déjà tenu' : null,
  run: () => { markUsed('cons'); modLoy(5); return 'Les cardinaux débattent sous la présidence du pape.'; } },
 // Église
 concile: { n:'Convoquer un concile œcuménique', s:2, c:150, d:'Les évêques de toute la Chrétienté se réunissent ; dans trois saisons, vous ferez adopter des décrets.',
  can: () => { if (S.council) return 'Un concile siège déjà'; if (S.authority < 40) return 'Autorité insuffisante (40)'; if (S.year - S.lastCouncil < 8) return `Trop tôt (${S.lastCouncil + 8})`; return null; },
  run: () => { const place = S.curia === 'avignon' ? pick(['Vienne', 'Lyon']) : S.curia === 'exil' ? 'Lyon' : 'Latran'; S.flags['n' + place] = (S.flags['n' + place] || 0) + 1; S.council = { t: 3, place, num: S.flags['n' + place] }; log(`Convocation du ${ordMasc(S.council.num)} concile ${place === 'Latran' ? 'du Latran' : 'de ' + place}.`, 'gold'); return 'Les courriers partent vers tous les diocèses.'; } },
 bulle: { n:'Bulle pastorale', s:2, d:'Une lettre à toute la Chrétienté : ferveur +3 partout, autorité +1.', can: () => S.year - S.lastBulle < 1 ? 'Une par an' : null,
  run: () => { S.lastBulle = S.year; modF('all', 3); modA(1); return 'La bulle est lue en chaire dans toutes les paroisses.'; } },
 // Croisade
 croisade: { n:'Appeler à la croisade', s:2, c:60, d:'Prêcher la croix : deux saisons de recrutement, puis l’expédition.',
  can: a => { if (S.crusade) return 'Une croisade est en cours'; if (S.year < (S.lastCrusade || 0) + 3) return `La Chrétienté est lasse (${(S.lastCrusade || 0) + 3})`; const t = crusadeTargets().find(x => x.key === a.key); if (!t) return 'Cible indisponible'; if (S.authority < t.min) return `Autorité insuffisante (${t.min})`; return null; },
  run: a => { const t = crusadeTargets().find(x => x.key === a.key); startCrusade(t); return 'Deus lo vult ! La foule déchire ses manteaux pour y coudre des croix.'; } },
 dime: { n:'Lever la dîme de croisade', s:1, d:'Un dixième des revenus du clergé pour la croisade.', can: () => !S.crusade ? 'Aucune croisade' : S.crusade.dime ? 'Déjà levée' : null,
  run: () => { const n = catholics().length; const g = Math.round(n * 7 * (S.fisc >= 2 ? 1.2 : 1)); modT(g); S.crusade.dime = true; modRel('all', -4); modC(1); return `La dîme rapporte ${g} marcs. Les clercs maugréent.`; } },
 troupes: { n:'Envoyer 100 hommes', s:0, d:'Les soldats du pape rejoignent l’ost croisé.', can: () => !S.crusade ? 'Aucune croisade' : S.army < 100 ? 'Pas de troupes' : null,
  run: () => { S.army -= 100; S.crusade.papal += 100; return 'Cent hommes sous la bannière aux clefs rejoignent les croisés.'; } },
 // Trésor
 emprunt: { n:'Emprunter 200 marcs', s:0, d:'Intérêts : 3 % par saison.', can: () => S.debt >= 800 ? 'Crédit épuisé' : !lender() ? 'Aucun prêteur' : null,
  run: () => { modT(200); S.debt += 200; return `Les ${lender()} avancent 200 marcs.`; } },
 rembourser: { n:'Rembourser 100 marcs', s:0, c:100, d:'Alléger la dette.', can: () => S.debt <= 0 ? 'Aucune dette' : null, run: () => { S.debt = Math.max(0, S.debt - 100); return 'Une créance est soldée.'; } },
 // Pontife
 repos: { n:'Retraite spirituelle', s:1, d:'Jeûne, prière et repos : santé +7.', can: () => used('repos') ? 'Déjà fait' : null, run: () => { markUsed('repos'); modHealth(7); return 'Le pape se retire quelques semaines dans une abbaye.'; } },
 abdiquer: { n:'Abdiquer', s:0, d:'Renoncer à la tiare : un conclave s’ouvre aussitôt.', can: () => null, run: () => { S.popes.push(popeRecord('abdication')); S.pendingConclave = { reason: 'abdication' }; log(`${popeName()} renonce au souverain pontificat.`, 'bad'); return 'conclave'; } }
};
function lender() { if (S.year >= 1300) return 'Bardi et Peruzzi de Florence'; if (S.year >= 1200) return 'banquiers lombards'; if (S.orders.includes('templiers')) return 'Templiers'; if (S.year >= 1100) return 'marchands de Pise'; return null; }
function actCost(id, a) { const A = ACT[id]; if (!A.c) return 0; return typeof A.c === 'function' ? A.c(a || {}) : A.c; }
function canAct(id, a) {
 const A = ACT[id]; a = a || {};
 if (S.over) return 'Partie terminée';
 if (A.s > S.seals) return `Il faut ${A.s} sceau${A.s > 1 ? 'x' : ''}`;
 const c = actCost(id, a); if (c > S.treasury) return `Il faut ${c} marcs`;
 if (a.r && !['legat','rappel'].includes(id) && used(id + a.r)) return 'Déjà fait cette saison';
 return A.can ? A.can(a) : null;
}
function doAct(id, a) {
 a = a || {}; const why = canAct(id, a); if (why) return { ok: false, msg: why };
 const A = ACT[id]; S.seals -= A.s; modT(-actCost(id, a)); if (a.r) markUsed(id + a.r);
 const msg = A.run(a); return { ok: true, msg };
}

/* ---------- Affaires pressantes ---------- */
function agenda() {
 const A = [], add = (l, t, go) => A.push({ l, t, go });
 if (S.schism) add('crit', `Schisme : l’antipape ${S.schism.anti} divise la Chrétienté.`, { tab: 'eglise' });
 if (S.authority < 25) add('crit', `Votre autorité vacille (${Math.round(S.authority)}). À zéro, la papauté s’effondre.`, { tab: 'pontife' });
 const b = budget(); if (b.total < 0 && S.treasury < -b.total * 4) add('crit', `Le trésor sera vide dans ${Math.max(0, Math.floor(S.treasury / -b.total))} saison(s).`, { tab: 'tresor' });
 else if (S.treasury < 60) add('warn', `Coffres presque vides : ${Math.max(0, Math.round(S.treasury))} marcs. Leviers : fiscalité, indulgences ou emprunt (onglet Trésor).`, { tab: 'tresor' });
 if (S.debt > 700) add('warn', `Dette de ${Math.round(S.debt)} marcs : la banqueroute guette au-delà de 1 200.`, { tab: 'tresor' });
 if (S.curia === 'rome' && S.rome.stab < 30) add(S.rome.stab < 22 ? 'crit' : 'warn', `Rome gronde (stabilité ${Math.round(S.rome.stab)}) : risque de soulèvement.`, { tab: 'rome' });
 if (S.curia === 'exil' && S.rome.stab >= 35) add('info', 'Rome s’est apaisée : vous pouvez quitter l’exil.', { tab: 'rome' });
 if (S.pope.health < 35) add('warn', `La santé du pape décline (${Math.round(S.pope.health)}).`, { tab: 'pontife' });
 for (const k of ['camerlingue', 'chancelier']) if (!S.offices[k] || !card(S.offices[k])) add('warn', `L’office de ${k === 'camerlingue' ? 'camerlingue' : 'vice-chancelier'} est vacant.`, { tab: 'curie' });
 if (S.cardinals.length < 9) add('warn', `Le Sacré Collège ne compte que ${S.cardinals.length} cardinaux.`, { tab: 'curie' });
 S.cardinals.filter(c => c.loyal < 25 && c.amb >= 6).slice(0, 2).forEach(c => add('warn', `Le cardinal ${cname(c)} est déloyal et ambitieux.`, { tab: 'curie' }));
 catholics(r => RL(r).heresy >= 40).sort((a, b) => RL(b).heresy - RL(a).heresy).slice(0, 3).forEach(r => add(RL(r).heresy >= 65 ? 'crit' : 'warn', `Les ${RL(r).hname || 'hérétiques'} progressent ${enR(r)} (${Math.round(RL(r).heresy)}).`, { realm: r }));
 PATRI.filter(p => S.own[p] === 'etats' && S.ctrl[p] < 30).forEach(p => add('warn', `${PROV[p].n} échappe à votre contrôle (${Math.round(S.ctrl[p])} %).`, { tab: 'rome' }));
 catholics(r => RL(r).anti).forEach(r => add('info', `Guerre civile ${enR(r)} : l’anti-roi ${RL(r).anti.n} combat pour vous.`, { realm: r }));
 S.wars.filter(w => isCath(w.a) && isCath(w.b)).slice(0, 2).forEach(w => add('info', `${capFirst(leR(w.a))} et ${leR(w.b)} s’entre-déchirent : un arbitrage est possible.`, { realm: w.a }));
 if (S.crusade && S.crusade.phase === 'predication') add('info', `La ${S.crusade.name} se prêche : exhortez les rois à prendre la croix.`, { tab: 'croisade' });
 if (S.events.length === 0 && !S.council && !canAct('concile')) add('info', 'Un concile œcuménique peut être convoqué.', { tab: 'eglise' });
 if (active('byzance') && RL('byzance').union >= 60 && !S.flags.unionDone) add('info', 'Les Grecs sont prêts pour l’union : convoquez un concile.', { tab: 'eglise' });
 if (!S.crusade && crusadeTargets().some(t => !canAct('croisade', { key: t.key }))) add('info', 'Une croisade peut être prêchée.', { tab: 'croisade' });
 if (S.created < 2 && S.cardinals.length < 20) add('info', `Vous pouvez encore créer ${2 - S.created} cardinal(aux) cette année.`, { tab: 'curie' });
 return A;
}
/* ---------- Croisades ---------- */
function crusadeTargets() {
 const out = [];
 TARGETS.terre_sainte.filter(p => RL(S.own[p]).relig === 'musulman').slice(0, 3).forEach((p, i) => out.push({ key: 'ts_' + p, k: 'terre_sainte', p, depth: i, n: `Croisade pour ${PROV[p].city}`, min: 45 + i * 3, d: `Délivrer ${PROV[p].city} (${PROV[p].n}) du joug ${deR(S.own[p])}.${i ? ' Objectif lointain : défense renforcée.' : ''}` }));
 TARGETS.iberie.filter(p => RL(S.own[p]).relig === 'musulman').slice(0, 2).forEach((p, i) => out.push({ key: 'ib_' + p, k: 'iberie', p, depth: i, n: `Croisade d’Espagne : ${PROV[p].city}`, min: 35 + i * 3, d: `Aider la Reconquista : prendre ${PROV[p].city}.` }));
 const bl = TARGETS.baltique.find(p => RL(S.own[p]).relig === 'paien');
 if (bl) out.push({ key: 'baltique', k: 'baltique', p: bl, depth: 0, n: 'Croisade du Nord', min: 35, d: `Soumettre ${PROV[bl].n} païenne.` });
 catholics(r => RL(r).heresy >= 55).forEach(r => out.push({ key: 'her_' + r, k: 'heretiques', r, p: capOf(r), depth: 0, n: `Croisade contre les ${RL(r).hname || 'hérétiques'}`, min: 40, d: `Extirper l’hérésie ${deR(r)} par le fer.` }));
 return out;
}
function startCrusade(t) {
 let name = t.n;
 if (t.k === 'terre_sainte') { S.tsNo++; name = S.tsNo <= 9 ? `${ordFem(S.tsNo)} croisade` : `Croisade de ${S.year}`; }
 S.crusade = { k: t.k, key: t.key, p: t.p, depth: t.depth || 0, r: t.r || null, enemy: t.k === 'heretiques' ? t.r : S.own[t.p], phase: 'predication', t: 0, members: [], str: 1, progress: 0, defeats: 0, papal: 0, dime: false, name, battles: [] };
 modA(popeHas('croise') ? 5 : 2);
 log(`${popeName()} appelle à la ${name.toLowerCase().startsWith('croisade') ? '' : ''}${name}.`, 'gold');
}
function crusadeStrength() {
 const c = S.crusade; let s = c.members.reduce((a, m) => a + (active(m) ? power(m) * 0.42 : 0), 0) * c.str + c.papal / 100 * 3;
 let m = 1; if (S.orders.includes('templiers') && !S.flags.templeDissolved && c.k !== 'heretiques') m += 0.15; if (S.orders.includes('hospitaliers') && c.k === 'terre_sainte') m += 0.1;
 if (S.orders.includes('teutoniques') && c.k === 'baltique') m += 0.25; if (popeHas('croise')) m += 0.2; if (S.decrees.includes('tournois')) m += 0.1; if (S.decrees.includes('embargo') && c.k === 'terre_sainte') m += 0.1;
 if (S.flags.mongolAlliance && c.k === 'terre_sainte') m += 0.15;
 return s * m;
}
function crusadeDefense() {
 const c = S.crusade;
 if (c.k === 'heretiques') { const R = RL(c.r); return 8 + R.heresy / 3 + (c.members.includes(c.r) ? 0 : power(c.r) * 0.35); }
 return power(c.enemy) + 15 + (c.k === 'terre_sainte' ? 10 : 0) + (c.depth || 0) * 6;
}
function crusadeJoinChance(r) {
 const c = S.crusade, R = RL(r), ru = R.ruler || { p: 5, t: [] };
 let p = (ru.p * 3.5 + Math.max(0, R.rel) / 3 + R.fervor / 4 + (S.decrees.includes('indulgence') ? 10 : 0) + (S.flags.zeal ? 12 : 0) + (R.exhort ? 20 : 0)) / 100;
 const reg = { iberie: { castille: .3, aragon: .3, portugal: .3, navarre: .25, france: .05, toulouse: .05 }, baltique: { empire: .3, danemark: .3, suede: .3, pologne: .3, teutons: .5 }, heretiques: { france: .25 } };
 if (c.k === 'iberie' || c.k === 'baltique') p += (reg[c.k][r] != null ? reg[c.k][r] : -0.25);
 if (c.k === 'heretiques') { if (r === c.r) p = -1; else p += (reg.heretiques[r] || 0) + (realmNeighbors(c.r).includes(r) ? 0.1 : -0.1); }
 if (c.k === 'terre_sainte' && r === 'outremer') p += 0.4;
 if (atWar(r)) p -= warsOf(r).some(w => w.a === c.enemy || w.b === c.enemy) ? -0.3 : 0.5;
 if (R.excom) p = 0; if (hasT(r, 'enfant')) p *= 0.3; if (ru.c) p *= (c.k === 'terre_sainte' && (r === 'venise' || r === 'genes')) ? 0.6 : 0.4;
 if (S.schism && R.obed !== 'pape') p = 0;
 p -= (S.weary || 0);
 return clamp(p * 0.45, 0, 0.85);
}
function updateCrusade() {
 const c = S.crusade; if (!c) return; c.t++;
 if (c.phase === 'predication') {
  for (const r of catholics()) { if (c.members.includes(r)) continue; if (chance(crusadeJoinChance(r))) { c.members.push(r); { const qui = capFirst(leRuler(r)), pl = /^les /i.test(leRuler(r)); log(qui + ' ' + pick(pl ? ['prennent la croix.', 'cousent la croix rouge sur leur manteau.', 'font vœu de croisade.', 'rejoignent l’ost des croisés.'] : ['prend la croix.', 'coud la croix rouge sur son manteau.', 'fait vœu de croisade.', 'rejoint l’ost des croisés.']), 'good'); } } RL(r).exhort = false; }
  if (c.t >= 2) {
   if (!c.members.length && c.papal < 300) { endCrusade(false, 'Personne ne prend la croix : la prédication est un échec.'); return; }
   c.phase = 'route'; c.t = 0; log(`L’ost de la ${c.name} se met en marche (${c.members.length} princes).`, 'info');
  }
 } else if (c.phase === 'route') {
  c.str *= 0.95;
  if (c.k === 'terre_sainte' && !S.flags.diversion && (c.members.includes('venise') || chance(0.25)) && S.year >= 1150) { S.flags.diversion = 1; pushEvent(evDiversion()); }
  if (c.t >= (c.k === 'terre_sainte' ? 2 : 1)) { c.phase = 'campagne'; c.t = 0; log(`Les croisés arrivent devant ${PROV[c.p].city}.`, 'info'); }
 } else if (c.phase === 'campagne') {
  const A = crusadeStrength() * rnd(0.6, 1.4), D = crusadeDefense() * rnd(0.6, 1.4);
  const place = pick([PROV[c.p].city, PROV[c.p].n, 'les gués', 'la plaine', 'les remparts']);
  if (A > D) { const g = clamp(22 + (A - D) / D * 25, 18, 45); c.progress += g; c.battles.push({ ok: 1, t: `Victoire devant ${place}` }); log(`Victoire des croisés devant ${place}.`, 'good'); }
  else { c.defeats++; c.str *= 0.85; c.progress = Math.max(0, c.progress - 10); c.battles.push({ ok: 0, t: `Revers devant ${place}` }); log(`Les croisés sont repoussés devant ${place}.`, 'bad'); }
  c.str *= 0.96;
  if (c.progress >= 100) endCrusade(true); else if (c.defeats >= 2 || c.t >= 7) endCrusade(false, 'L’armée croisée, décimée par la faim et les fièvres, rembarque.');
 }
}
function endCrusade(ok, why) {
 const c = S.crusade; S.crusade = null; S.lastCrusade = S.year; S.weary = Math.min(0.45, (S.weary || 0) + 0.18);
 S.crusades.push({ name: c.name, y: S.year, ok, k: c.k });
 if (!ok) { modA(-9); modF('all', -3); log(`Échec de la ${c.name}. ${why || ''}`, 'bad'); pushEvent({ id: 'crfail', art: 'swords', title: `L’échec de la ${c.name}`, text: `${why || ''} Les chroniqueurs cherchent des coupables : les péchés de la Chrétienté, la cupidité des barons, ou l’orgueil de Rome ?`, opts: [{ t: 'Accuser les péchés des chrétiens', d: 'Ferveur +2', fx() { modF('all', 2); } }, { t: 'Accuser les princes qui n’ont pas tenu leur vœu', d: 'Autorité +2 · relations −3', fx() { modA(2); modRel('all', -3); } }] }); return; }
 S.crusadeWins++; modA(8); modF('all', 6); c.members.forEach(m => modRel(m, 10));
 const taken = [c.p];
 if (c.k !== 'heretiques' && c.progress >= 140) { const more = (TARGETS[c.k] || []).find(p => p !== c.p && S.own[p] === c.enemy && (PADJ[p] || []).includes(c.p)); if (more) taken.push(more); }
 if (c.k === 'heretiques') {
  const R = RL(c.r); modH(c.r, -50); modF(c.r, -10); if (!c.members.includes(c.r)) modRel(c.r, -15);
  if (c.r === 'toulouse' && c.members.includes('france') && chance(0.6)) { provsOf('toulouse').forEach(p => transferProv(p, 'france')); log('Le Languedoc passe sous la couronne de France.', 'info'); }
  log(`La ${c.name} triomphe : les ${R.hname || 'hérétiques'} sont écrasés. Les bûchers fument.`, 'gold');
 } else {
  let to;
  if (c.k === 'terre_sainte') to = 'outremer';
  else if (c.k === 'iberie') { const ib = ['castille', 'aragon', 'portugal', 'navarre'].filter(r => active(r)); to = ib.filter(r => c.members.includes(r)).sort((a, b) => power(b) - power(a))[0] || ib[0] || c.members[0]; }
  else { to = S.orders.includes('teutoniques') ? 'teutons' : (c.members.filter(r => ['empire', 'pologne', 'danemark', 'suede'].includes(r)).sort((a, b) => power(b) - power(a))[0] || c.members[0]); }
  taken.forEach(p => transferProv(p, to, c));
  log(`La ${c.name} est victorieuse : ${taken.map(p => PROV[p].city).join(' et ')} ${taken.length > 1 ? 'tombent' : 'tombe'} aux mains ${deR(to)}.`, 'gold');
  if (taken.includes('jerusalem')) { ach('jerusalem'); modA(8); }
 }
 if (S.crusadeWins >= 3) ach('croisades');
}
function evDiversion() {
 return { id: 'diversion', art: 'ship', title: 'Les nefs de Venise', text: `Les croisés rassemblés au Lido ne peuvent payer les nefs promises par la République. Le doge propose un arrangement : que l’armée l’aide à reprendre Zara, ville chrétienne… et l’on murmure qu’un prétendant byzantin promet monts et merveilles si l’on rétablit son père sur le trône de Constantinople.`,
  opts: [
   { t: 'Payer la dette des croisés (150 marcs)', d: 'Trésor −150 · la croisade poursuit sa route', req: () => S.treasury >= 150 ? null : 'Trésor insuffisant', fx() { modT(-150); return 'Les nefs appareillent vers l’Orient.'; } },
   { t: 'Tolérer la prise de Zara', d: 'Autorité −4 · Hongrie −25 · force +5 %', fx() { modA(-4); modRel('hongrie', -25); if (S.crusade) S.crusade.str *= 1.05; return 'Zara est mise à sac. Le pape excommunie les Vénitiens… pour la forme.'; } },
   { t: 'Laisser l’armée détourner sa route vers Constantinople', d: 'Sac de Constantinople : butin, reliques, mais l’Orient grec vous maudira', fx() { S.flags.sac = 1; RL('byzance').base = Math.max(8, RL('byzance').base - 8); RL('byzance').union = 0; modRel('byzance', -60); modT(140); S.relics += 2; modA(-8); if (S.crusade) S.crusade.str *= 0.8; log('Constantinople est mise à sac par les croisés latins.', 'bad'); return 'Trois jours de pillage. Les chevaux des Latins piétinent Sainte-Sophie. Des reliques sans nombre affluent vers l’Occident.'; } },
   { t: 'Dissoudre la croisade', d: 'La croisade est abandonnée · autorité −5', fx() { const c = S.crusade; if (c) { S.crusade = null; S.lastCrusade = S.year; S.crusades.push({ name: c.name, y: S.year, ok: false, k: c.k }); modA(-5); } return 'Les croisés se dispersent, honteux.'; } }
  ] };
}

/* ---------- Territoires ---------- */
const CRUSADER_LORDS = ['Godefroy de Bouillon','Baudouin de Boulogne','Raymond de Saint-Gilles','Bohémond de Tarente','Thibaut de Champagne','Jean de Brienne','Henri de Champagne','Conrad de Montferrat','Hugues de Vermandois','Gautier de Brienne'];
function transferProv(p, to, c) {
 const from = S.own[p]; S.own[p] = to;
 if (RL(to).dormant) reviveRealm(to, c);
 if (from && from !== 'etats' && nProv(from) === 0) {
  const F = RL(from); F.dormant = true; F.legate && (card(F.legate) ? card(F.legate).legate = null : 0); F.legate = null; S.wars = S.wars.filter(w => w.a !== from && w.b !== from);
  log(`${capFirst(leR(from))} cesse d’exister.`, 'info');
 }
}
function reviveRealm(r, c) {
 const R = RL(r); R.dormant = false; R.excom = false; R.interdict = false;
 if (r === 'outremer') { R.name = 'Royaume de Jérusalem'; R.title = 'Roi'; R.ruler = { n: pick(CRUSADER_LORDS), a: ri(30, 50), p: ri(6, 9), t: ['zele'], d: 'Croisés' }; }
 else if (r === 'teutons') { R.ruler = genRuler(r, { age: ri(40, 60) }); }
 else R.ruler = genRuler(r, { age: ri(20, 45) });
 R.rel = targetRel(r);
 log(`${capFirst(leR(r))} renaît sous ${leRuler(r)}.`, 'info');
}
function convertRealm(r) {
 const R = RL(r); R.relig = 'catholique'; R.mission = 100; R.rel = clamp(R.rel + 30, -100, 100); R.invest = 30; R.fervor = 38;
 if (r === 'baltes') { R.name = 'Grand-duché de Lituanie'; R.title = 'Grand-duc'; ach('lituanie'); }
 if (r === 'horde') { R.relig = 'catholique'; }
 log(`${capFirst(leRuler(r))} reçoit le baptême : ${leR(r)} entre dans la communion romaine !`, 'gold'); modA(8);
}

function forced(id, arg) { const ev = EVENTS.find(e => e.id === id); const inst = ev && ev.make(arg === undefined ? true : arg); if (inst) { inst.id = id; if (!inst.art) inst.art = ev.art; } return inst; }
/* Sécessions : les provinces conquises peuvent retourner à leur maître d’origine */
function secessions() {
 if (!S.home) S.home = Object.assign({}, S.own);
 const relOf = r => S.realms[r].relig;
 for (const p of PROVS) {
  const o = S.own[p.id], h = S.home[p.id]; if (o === h || h === 'etats' || o === 'etats') continue;
  const ro = relOf(o), rh = relOf(h);
  if (isChristian(o) && !isChristian(h) && o !== 'outremer' && o !== 'byzance') continue;
  const n = nProv(o); if (n <= 1) continue;
  let pr = 0.008 + Math.max(0, n - 10) * 0.004; if (atWar(o)) pr *= 1.6; if (o === 'outremer') pr *= 0.5;
  if (chance(pr)) { transferProv(p.id, h); log(`Révolte en ${p.n} : ${p.city} secoue le joug ${deR(o)} et revient ${h === 'etats' ? 'au pape' : auR(h)}.`, 'war'); }
 }
}
/* Noms d’époque */
const ERA_NAMES = [['sicile', 1130, 'Royaume de Sicile', 'Roi'], ['toscane', 1115, 'Commune de Florence', 'Commune'], ['lombardie', 1167, 'Ligue lombarde', 'Recteurs'], ['lombardie', 1277, 'Seigneurie de Milan', 'Seigneur'], ['lombardie', 1395, 'Duché de Milan', 'Duc'],
 ['turcs', 1077, 'Sultanat de Roum', 'Sultan'], ['turcs', 1300, 'Beyliks turcs', 'Bey'], ['turcs', 1326, 'Sultanat ottoman', 'Sultan'], ['egypte', 1171, 'Sultanat ayyoubide', 'Sultan'], ['egypte', 1250, 'Sultanat mamelouk', 'Sultan'],
 ['maghreb', 1147, 'Califat almohade', 'Calife'], ['maghreb', 1269, 'Sultanat mérinide', 'Sultan'], ['ifriqiya', 1229, 'Sultanat hafside', 'Sultan'], ['pologne', 1320, 'Royaume de Pologne', 'Roi'], ['andalus', 1238, 'Émirat de Grenade', 'Sultan'], ['sicile', 1282, 'Royaume de Naples', 'Roi']];
function eraNames() {
 for (const [r, y, n, t] of ERA_NAMES) {
  const k = 'era_' + r + y; if (S.flags[k] || S.year < y || S.scen >= String(y)) continue; S.flags[k] = 1;
  if (!active(r) || S.realms[r].name === n) continue; if (S.realms[r].name === 'Couronne de Pologne-Lituanie') continue;
  if (r === 'andalus' && S.own.grenade !== 'andalus') continue; if (r === 'sicile' && y === 1282 && S.own.sicile_p === 'sicile') continue;
  S.realms[r].name = n; if (S.realms[r].ruler && !S.realms[r].ruler.c) S.realms[r].title = t;
 }
}
/* Unions dynastiques */
const UNIONS = [
 { id: 'krewo', y: 1386, a: 'pologne', b: ['baltes'], cond: () => isCath('baltes'), name: 'Couronne de Pologne-Lituanie', t: 'L’Union de Krewo', d: 'Le grand-duc de Lituanie, baptisé, épouse la jeune reine de Pologne et réunit les deux États sous une même couronne.' },
 { id: 'kalmar', y: 1397, a: 'danemark', b: ['suede', 'norvege'], name: 'Union de Kalmar', t: 'L’Union de Kalmar', d: 'À Kalmar, les trois royaumes du Nord jurent de n’avoir plus qu’un seul roi.' },
 { id: 'espagne', y: 1469, a: 'castille', b: ['aragon'], name: 'Royaume d’Espagne', t: 'Les Rois catholiques', d: 'Le mariage d’Isabelle de Castille et de Ferdinand d’Aragon unit les deux grandes couronnes ibériques.' },
 { id: 'bretagne', y: 1491, a: 'france', b: [], prov: ['bretagne'], name: null, t: 'Le mariage breton', d: 'Anne de Bretagne épouse le roi de France : le duché entre dans le domaine royal.' }
];
function unions() {
 for (const u of UNIONS) {
  if (S.flags['u_' + u.id] || S.year < u.y || !active(u.a) || !isCath(u.a)) continue;
  const bs = u.b.filter(r => active(r) && isCath(r)); const ps = (u.prov || []).filter(p => S.own[p] !== u.a);
  if (!bs.length && !ps.length) continue; if (u.cond && !u.cond()) continue; if (!chance(0.25)) continue;
  S.flags['u_' + u.id] = 1;
  bs.forEach(r => provsOf(r).forEach(p => transferProv(p, u.a))); ps.forEach(p => transferProv(p, u.a));
  if (u.name) RL(u.a).name = u.name;
  log(`${u.t} : ${u.d}`, 'gold');
  pushEvent({ id: 'union_' + u.id, art: 'crown', realm: u.a, title: u.t, text: `${u.d} ${capFirst(leR(u.a))} devient l’une des grandes puissances de la Chrétienté et attend la bénédiction du Saint-Siège.`,
   opts: [{ t: 'Bénir l’union', d: 'Relation +15 · autorité +2', fx() { modRel(u.a, 15); modA(2); } }, { t: 'Rappeler que les couronnes relèvent de Dieu seul', d: 'Relation −8 · autorité +1', fx() { modRel(u.a, -8); modA(1); } }] });
 }
}
/* ---------- Schisme ---------- */
function createSchism(backer, reason) {
 const nm = pick(['Clément', 'Victor', 'Pascal', 'Calixte', 'Grégoire', 'Benoît', 'Félix', 'Nicolas', 'Innocent']);
 S.schism = { anti: `${nm} ${roman((S.pnames[nm] || 0) + 1)}`, backer, t: 0, reason: reason || 'synode' };
 modA(-8); log(`Schisme ! ${backer ? rulerLbl(backer) + ' fait élire' : 'Les cardinaux dissidents élisent'} l’antipape ${S.schism.anti}.`, 'bad');
 updateObedience();
}
function updateObedience() {
 for (const r of catholics()) { const R = RL(r); R.obed = (S.schism && (r === S.schism.backer || R.rel < -35 || (R.excom && R.rel < -20))) ? 'anti' : 'pape'; }
}
function endSchism(how) {
 if (!S.schism) return; const a = S.schism.anti; S.schism = null; catholics().forEach(r => RL(r).obed = 'pape'); modA(8); ach('schisme');
 log(`Fin du schisme : l’antipape ${a} ${how === 'mort' ? 'meurt, abandonné de tous' : how === 'concile' ? 'est déposé par le concile' : how === 'abdication' ? 'abdique' : 'est abandonné par son protecteur'}.`, 'gold');
}
function updateSchism() {
 const s = S.schism; if (!s) return; s.t++; updateObedience();
 const n = catholics().filter(r => RL(r).obed === 'anti').length; modA(-Math.min(3, 0.45 * n));
 if (chance(0.04)) { if (s.backer && active(s.backer) && RL(s.backer).rel < -20 && chance(0.5)) { const nm = s.anti.split(' ')[0]; s.anti = `${pick(['Clément', 'Victor', 'Benoît', 'Félix'])} ${roman(ri(2, 4))}`; log(`L’antipape ${nm} meurt ; ses partisans élisent ${s.anti}.`, 'bad'); } else endSchism('mort'); return; }
 if (s.backer && active(s.backer) && RL(s.backer).rel >= 0 && !RL(s.backer).excom && chance(0.3)) endSchism('reconciliation');
 if (!s.backer && n === 0 && chance(0.25)) endSchism('mort');
}

/* ---------- Guerres ---------- */
function updateWars() {
 for (const w of S.wars.slice()) {
  if (!active(w.a) || !active(w.b)) { S.wars = S.wars.filter(x => x !== w); continue; }
  const pa = power(w.a) * rnd(0.6, 1.4), pb = power(w.b) * rnd(0.6, 1.4);
  w.score += (pa - pb) / (pa + pb) * 28; w.t++;
  const chr = isChristian(w.a) && isChristian(w.b);
  if (chr) { modF(w.a, -0.4); modF(w.b, -0.4); }
  const maxT = chr && S.decrees.includes('treve') ? Math.min(5, w.max) : w.max;
  if (Math.abs(w.score) >= 45 || w.t >= maxT) endWar(w);
 }
 if (S.wars.length < 6 && chance(0.6)) {
  for (const r of shuffle(activeRealms(x => !atWar(x))).slice(0, 4)) {
   const nb = realmNeighbors(r).filter(n => n !== 'etats' && active(n) && !atWar(n)); if (!nb.length) continue;
   const n = pick(nb);
   if (S.crusade && S.crusade.members.includes(r) && S.crusade.members.includes(n)) continue;
   const Rr = RL(r), Rn = RL(n);
   let agg = 1 + (hasT(r, 'guerrier') ? 0.8 : 0) + (hasT(r, 'ambitieux') ? 0.6 : 0) - (hasT(r, 'faible') ? 0.5 : 0) - (hasT(r, 'enfant') ? 0.5 : 0);
   if (Rr.relig !== Rn.relig) agg += 1;
   if ((r === 'turcs' && n === 'byzance') || (r === 'egypte' && n === 'outremer') || (['castille', 'aragon', 'portugal'].includes(r) && ['andalus', 'maghreb'].includes(n))) agg += 1.5;
   if (isCath(r) && isCath(n) && S.decrees.includes('treve')) agg *= 0.7;
   if (chance(0.05 * agg)) { S.wars.push({ a: r, b: n, score: 0, t: 0, max: ri(4, 11) }); log(`Guerre : ${leR(r)} ${/^les /i.test(leR(r)) ? 'attaquent' : 'attaque'} ${leR(n)}.`, 'war'); break; }
  }
 }
}
function endWar(w) {
 S.wars = S.wars.filter(x => x !== w);
 const win = w.score > 0 ? w.a : w.b, lose = w.score > 0 ? w.b : w.a;
 if (Math.abs(w.score) >= 30) {
  const winP = new Set(provsOf(win));
  const seaOnly = p => !(PADJ[p] || []).some(q => winP.has(q) && !SEA_SET.has(p + '|' + q));
  const cand = provsOf(lose).filter(p => (PADJ[p] || []).some(q => winP.has(q)) && !PATRI.includes(p) && !(isChristian(win) && AFRICA.includes(p)) && (!seaOnly(p) || Math.abs(w.score) >= 42));
  if (cand.length && (nProv(lose) > 1 || chance(0.35))) {
   const p = pick(cand); transferProv(p, win);
   log(`Paix : ${PROV[p].city} (${PROV[p].n}) passe ${deR(lose)} ${auR(win)}.`, 'war');
   if (p === 'jerusalem' && RL(win).relig !== 'catholique') { modA(-6); modF('all', -4); log('Jérusalem est perdue pour les Latins. La Chrétienté prend le deuil.', 'bad'); }
   if (p === 'jerusalem' && RL(win).relig === 'catholique') ach('jerusalem');
   if (p === 'thrace' && RL(win).relig === 'musulman') { S.flags.constFell = 1; pushEvent(evConstantinople()); }
   return;
  }
 }
 log(`Paix blanche entre ${leR(w.a)} et ${leR(w.b)}.`, 'info');
}
function evConstantinople() {
 return { id: 'constfell', art: 'fire', title: 'Constantinople est tombée', text: `La Nouvelle Rome, mille ans durant rempart de la Chrétienté, a succombé à ${rulerLbl(S.own.thrace)}. Sainte-Sophie retentit d’autres prières. Des réfugiés grecs débarquent à Venise et à Ancône, des manuscrits plein leurs coffres.`,
  opts: [{ t: 'Appeler l’Occident à la reconquête', d: 'Ferveur +4 · ardeur de croisade', fx() { modF('all', 4); S.flags.zeal = 1; } }, { t: 'Accueillir les savants grecs à la Curie', d: 'Autorité +3 · cardinaux plus compétents', fx() { modA(3); S.cardinals.forEach(c => c.comp = clamp(c.comp + 1, 1, 10)); } }] };
}

/* ---------- Mise à jour saisonnière ---------- */
function updateRome() {
 const R = S.rome;
 let pt = 46 + (S.build.hopital === true ? 8 : 0) + (S.build.aqueduc === true ? 4 : 0) - (S.plague > 0 ? 14 : 0) - (S.fisc >= 2 ? 4 : 0) + (S.jubilee > 0 ? 10 : 0) - (S.curia !== 'rome' ? 8 : 0);
 R.people = clamp(R.people + (pt - R.people) * 0.12 + rnd(-2, 2), 0, 100);
 let tw = 0, tl = 0;
 for (const f of R.fam) { const tgt = 45 + (f.n === S.pope.fam ? 35 : 0) - (S.curia !== 'rome' ? 5 : 0); f.loyal = clamp(f.loyal + (tgt - f.loyal) * 0.05 + rnd(-2, 2), 0, 100); f.power = clamp(f.power + rnd(-0.6, 0.8), 8, 80); tw += f.power; tl += f.power * f.loyal; }
 const famL = tl / tw;
 const st = R.people * 0.4 + famL * 0.45 + 8 + (S.build.saintange === true ? 6 : 0) + Math.min(10, S.army / 100 * 1.5) + (S.build.aqueduc === true ? 3 : 0) - (S.curia === 'avignon' ? 12 : 0);
 R.stab = clamp(R.stab + (st - R.stab) * 0.3, 0, 100);
 if (S.curia === 'rome' && R.stab < 22 && chance(0.35) && !S.events.some(e => e.id === 'revolte')) pushEvent(evRevolt());
}
function evRevolt() {
 return { id: 'revolte', art: 'fire', title: 'Rome se soulève', text: `Au son du tocsin du Capitole, le peuple romain proclame la Commune et restaure le Sénat « comme au temps des Anciens ». Les tours des barons se hérissent d’arbalètes ; des émeutiers marchent sur le Latran en exigeant que le pape abandonne le gouvernement temporel de la Ville.`,
  opts: [
   { t: 'Écraser la révolte avec la milice', d: 'Exige 300 hommes · succès incertain', req: () => S.army >= 300 ? null : '300 hommes requis', fx() { if (chance(0.35 + S.army / 2000)) { modStab(20); modA(2); modPeople(-8); return 'La milice nettoie le Capitole. Les meneurs sont pendus aux créneaux.'; } S.army = Math.max(0, S.army - 200); S.curia = 'exil'; modA(-6); log('Le pape fuit Rome et s’établit en exil à Viterbe.', 'bad'); return 'La milice est taillée en pièces. Le pape s’enfuit par une poterne et gagne Viterbe.'; } },
   { t: 'Négocier avec le Sénat (80 marcs)', d: 'Stabilité +18 · autorité −3', req: () => S.treasury >= 80 ? null : 'Trésor insuffisant', fx() { modT(-80); modStab(18); modPeople(10); modA(-3); return 'Les sénateurs prêtent serment au pape en échange de privilèges et d’or.'; } },
   { t: 'Quitter Rome pour l’exil', d: 'La Curie s’établit à Viterbe · autorité −5', fx() { S.curia = 'exil'; modA(-5); log('Le pape quitte Rome révoltée.', 'bad'); return 'La Curie se replie sur Viterbe. Rome se gouverne elle-même… pour un temps.'; } }
  ] };
}
function updateRealms() {
 const ordF = (S.orders.includes('cisterciens') ? 2 : 0) + (S.orders.includes('franciscains') ? 3 : 0) + (S.orders.includes('clarisses') ? 1 : 0) + (S.orders.includes('carmes') ? 1 : 0) + (S.orders.includes('dominicains') ? 1 : 0);
 const decF = (S.decrees.includes('confession') ? 3 : 0) + (S.decrees.includes('celibat') ? 2 : 0) + (S.decrees.includes('treve') ? 1 : 0) + (S.decrees.includes('residence') ? 2 : 0);
 const pen = S.offices.penitencier && card(S.offices.penitencier);
 for (const r of realmIds()) {
  const R = RL(r); if (r === 'etats' || R.dormant) continue;
  R.rel = clamp(R.rel + (targetRel(r) - R.rel) * 0.06 + rnd(-1, 1), -100, 100);
  if (R.legate) {
   const c = card(R.legate);
   if (!c) R.legate = null; else {
    let k = 1 + c.comp / 5; if (c.trait === 'diplomate') k *= 1.5; if (S.build.bibliotheque === true) k *= 1.25;
    R.rel = clamp(R.rel + k, -100, 100);
    if (isCath(r)) { R.heresy = Math.max(0, R.heresy - (0.4 + c.piety / 10) * (c.trait === 'theologien' ? 1.5 : 1)); R.invest = clamp(R.invest + 0.4, 0, 100); }
    if (r === 'byzance' && !S.flags.unionDone && !S.flags.sac) R.union = clamp(R.union + 0.7, 0, 100);
    if (R.relig === 'paien') { R.mission = clamp(R.mission + 0.8, 0, 100); if (R.mission >= 100) convertRealm(r); }
   }
  }
  if (r === 'byzance' && !S.flags.unionDone) R.union = clamp(R.union - 0.15, 0, 100);
  if (isCath(r)) {
   let tgt = 46 + ordF + decF - S.corruption / 4 + (S.authority - 50) / 10 + (S.jubilee > 0 ? 8 : 0);
   if (R.interdict) tgt -= 15; if (S.plague > 0) tgt -= 12; if (atWar(r)) tgt -= 4; if (popeHas('ascete')) tgt += 4; if (popeHas('vaniteux')) tgt -= 3;
   if (pen) tgt += (pen.piety - 5) * 0.6; if (hasT(r, 'pieux') || hasT(r, 'batisseur')) tgt += 3;
   R.fervor = clamp(R.fervor + (tgt - R.fervor) * 0.08 + rnd(-1.2, 1.2), 0, 100);
   if (R.interdict) R.fervor = clamp(R.fervor - 2, 0, 100);
   let g = 0.2 + S.corruption / 65 + (50 - R.fervor) / 45 + (hasT(r, 'tolerant') ? 0.8 : 0) + (S.year > 1350 ? 0.3 : 0) + (S.year > 1400 ? 0.4 : 0) + (S.indulg ? 0.3 : 0) + (R.interdict ? 0.6 : 0) + (S.flags.print ? 0.3 : 0) + (S.plague > 0 ? 0.4 : 0);
   let nh = 0; for (const n of realmNeighbors(r)) if (S.realms[n]) nh = Math.max(nh, S.realms[n].heresy || 0); if (nh > 40) g += 0.4;
   if (S.orders.includes('franciscains')) g *= 0.7; if (S.decrees.includes('confession')) g *= 0.75;
   if (R.fear > 0) { g -= 0.6; R.fear--; }
   if (R.heresy < 3) { if (g > 0 && chance(0.009 * g)) { modH(r, 6); } else if (g < 0) R.heresy = Math.max(0, R.heresy + g * 0.5); }
   else modH(r, g * 0.6);
   if (R.heresy >= 20 && !R.hname) { R.hname = heresyNameFor(r, S.year); }
   if (R.heresy >= 25 && !R.hwarn) { R.hwarn = 1; log(`Le mouvement des ${R.hname} se répand ${enR(r)}.`, 'bad'); }
   if (R.heresy < 8) { R.hwarn = 0; if (R.heresy < 4) R.hname = null; }
   if (R.hmax >= 60 && R.heresy < 15) ach('marteau');
   if (R.heresy >= 70 && (R.hrevT || 0) <= S.turn && chance(0.12) && !S.events.some(e => e.id === 'hrevolte')) { R.hrevT = S.turn + 10; pushEvent(evHeresyRevolt(r)); }
   let d = -0.25 - (S.year > 1300 ? 0.15 : 0) - (hasT(r, 'ambitieux') ? 0.3 : 0) - (hasT(r, 'anticlerical') ? 0.3 : 0) + (S.decrees.includes('investitures') ? 0.25 : 0) + (R.vassal ? 0.3 : 0) + (hasT(r, 'enfant') ? 0.2 : 0) + (popeHas('reformateur') ? 0.1 : 0);
   R.invest = clamp(R.invest + d, 0, 100);
   if (R.excom) {
    R.excomT++;
    const ru = R.ruler || { p: 5 };
    let p = 0.04 + ru.p * 0.012 + (S.authority - 50) / 400 + (R.interdict ? 0.08 : 0) + (R.excomT > 8 ? 0.03 : 0) + (atWar(r) ? 0.04 : 0) - (hasT(r, 'anticlerical') ? 0.05 : 0) - (power(r) > 40 ? 0.03 : 0);
    if (!R.penit && chance(clamp(p, 0.01, 0.35))) { R.penit = true; pushEvent(evPenitence(r)); }
    else if (!R.penit && R.excomT >= 2) {
     if (!S.schism && power(r) >= 28 && (hasT(r, 'ambitieux') || hasT(r, 'anticlerical') || hasT(r, 'colerique')) && chance(0.05)) createSchism(r);
     else if (canInvade(r) && chance(0.045 + (hasT(r, 'colerique') ? 0.03 : 0)) && !S.events.some(e => e.id === 'invasion')) pushEvent(evInvasion(r));
     else if (!R.anti && R.excomT >= 3 && power(r) >= 16 && chance(0.05) && !S.events.some(e => e.id === 'antiroi')) pushEvent(evAntiroi(r));
    }
   }
  }
  if (R.anti) {
   R.anti.t++; modF(r, -0.6);
   if (R.anti.t >= 2 && chance(0.3)) {
    const p = clamp(0.35 + (S.authority - 50) / 200 + (R.interdict ? 0.15 : 0) + (R.anti.sub ? 0.1 : 0) - (hasT(r, 'guerrier') ? 0.1 : 0), 0.1, 0.85);
    if (chance(p)) { const old = rulerLbl(r); R.past = (R.past || []).concat([{ n: old, y: S.year }]).slice(-8); R.ruler = { n: R.anti.n, a: R.anti.a, p: 8, t: ['zele'], d: R.anti.d }; R.excom = false; R.interdict = false; R.penit = false; R.rel = clamp(R.rel + 55, -100, 100); modA(6); log(`L’anti-roi ${R.anti.n} triomphe : ${old} est déposé. ${capFirst(leRuler(r))} doit tout au pape.`, 'gold'); }
    else { modRel(r, -15); modA(-5); log(`L’anti-roi ${R.anti.n} est vaincu et tué au combat. ${capFirst(leRuler(r))} triomphe du pape.`, 'bad'); }
    R.anti = null;
   }
  }
  if (R.ruler && !R.ruler.c && R.ruler.a > 0) {
   const a = R.ruler.a; const p = a < 40 ? 0.004 : 0.004 + Math.pow((a - 40) / 35, 2) * 0.06;
   if (chance(p)) succession(r);
  }
 }
}
function canInvade(r) { return S.curia === 'rome' && power(r) >= 14 && (['empire', 'sicile', 'lombardie', 'toscane'].includes(r) || realmNeighbors(r).includes('etats')); }
function succession(r) {
 const R = RL(r), old = rulerLbl(r), oldDu = duRuler(r);
 const heir = genRuler(r, { age: ri(4, 40) });
 R.past = (R.past || []).concat([{ n: old, y: S.year }]).slice(-8);
 const wasExcom = R.excom; R.ruler = heir; R.anti = null; R.excom = false; R.interdict = false; R.penit = false; R.excomT = 0; R.claimant = null; R.ward = false;
 R.rel = clamp(R.rel * 0.4 + targetRel(r) * 0.6, -100, 100);
 log(`Mort ${oldDu}. ${capFirst(leRuler(r))} lui succède${heir.a < 16 ? ` à ${heir.a} ans` : ''}.`, 'info');
 if (wasExcom) log(`L’excommunication s’éteint avec ${old}.`, 'info');
 if (r === 'byzance' && S.flags.unionDone && chance(0.35)) { S.flags.unionDone = 0; R.union = 30; log('Le nouveau basileus répudie l’union des Églises sous la pression des moines.', 'bad'); }
 if (S.schism && S.schism.backer === r && chance(0.5)) endSchism('reconciliation');
 if (isCath(r) && REALMS[r].names && !REALMS[r].doge) {
  if (heir.a < 16 && R.rel > 15 && chance(0.6)) pushEvent(evRegence(r));
  else if (chance(0.12)) pushEvent(evSuccession(r));
 }
}
function evRegence(r) {
 return { id: 'regence', art: 'crown', title: `Un enfant sur le trône ${deR(r)}`, text: `Le nouveau souverain, ${RL(r).ruler.n}, n’a que ${RL(r).ruler.a} ans. Les barons se disputent la régence. La reine mère supplie le pape de prendre l’enfant sous la protection de saint Pierre.`,
  opts: [{ t: 'Accepter la tutelle du royaume', d: 'Relation +20 · investitures +10 · autorité +3 · 20 marcs', req: () => S.treasury >= 20 ? null : 'Trésor insuffisant', fx() { modT(-20); modRel(r, 20); modInv(r, 10); modA(3); RL(r).ward = true; return 'Un légat siège désormais au conseil de régence.'; } },
   { t: 'Laisser les barons s’arranger', d: 'Aucun effet', fx() { } }] };
}
function evSuccession(r) {
 const R = RL(r); const claim = genRuler(r, { age: ri(18, 40) }); R.nc[claim.n.split(' ')[0]] = (R.nc[claim.n.split(' ')[0]] || 1) - 1;
 return { id: 'succession', art: 'crown', title: `Succession disputée ${enR(r)}`, text: `${claim.n}, cousin du défunt, conteste les droits ${de_(R.ruler.n)} et lève des troupes. Les deux partis envoient des ambassades à Rome : le pape seul peut dire qui est l’héritier légitime.`,
  opts: [{ t: `Reconnaître ${R.ruler.n}`, d: 'Relation +15', fx() { modRel(r, 15); return 'L’héritier légitime est confirmé.'; } },
   { t: `Soutenir ${claim.n}`, d: 'Le prétendant l’emporte : relation +35, mais guerre civile (ferveur −8)', fx() { R.ruler = claim; R.rel = clamp(R.rel + 35, -100, 100); modF(r, -8); log(`${claim.n} s’empare du trône ${deR(r)} avec l’appui du pape.`, 'info'); return 'Le prétendant est couronné. Il vous doit tout.'; } },
   { t: 'Rester neutre', d: 'Autorité −1', fx() { modA(-1); } }] };
}
function evPenitence(r) {
 const R = RL(r), big = ['empire', 'france', 'angleterre'].includes(r);
 return { id: 'penitence', art: 'snow', realm: r, title: `${rulerLbl(r)} implore le pardon`, text: `Ses vassaux l’abandonnent, ses évêques se taisent. ${capFirst(leRuler(r))} se présente devant le château où réside le pape, ${big ? 'pieds nus dans la neige, en robe de bure, ' : ''}et demande à être relevé de l’excommunication. Les cardinaux sont partagés : la miséricorde ou la fermeté ?`,
  opts: [{ t: 'Accorder l’absolution', d: 'Relation +20 · autorité +6', fx() { R.excom = false; R.interdict = false; R.penit = false; modRel(r, 20); modA(6); if (big) ach('canossa'); if (S.schism && S.schism.backer === r) endSchism('reconciliation'); return 'Le pape relève le pénitent et l’embrasse. On parlera longtemps de ce jour.'; } },
   { t: 'Le faire attendre trois jours dans la neige', d: 'Autorité +12 · relation −8 · il s’en souviendra', fx() { R.excom = false; R.interdict = false; R.penit = false; modA(12); modRel(r, -8); R.offense = 0; R.grudge = 1; if (big) ach('canossa'); return 'Au troisième jour, le pape ouvre enfin les portes. L’humiliation est totale.'; } },
   { t: 'Refuser l’absolution', d: 'Autorité +2 · relation −20', fx() { R.penit = false; modA(2); modRel(r, -20); return 'Le pénitent repart, la rage au cœur.'; } }] };
}
function evAntiroi(r) {
 const R = RL(r); const cand = genRuler(r, { age: ri(28, 50) }); R.nc[cand.n.split(' ')[0]] = Math.max(0, (R.nc[cand.n.split(' ')[0]] || 1) - 1);
 const nm = cand.n.replace(/ [IVXL]+$|Ier$/, '').trim() + ' ' + pick(['de Souabe', 'de Rheinfelden', 'de Lorraine', 'de Thuringe', 'de Bourgogne', 'de Blois', 'de Gloucester', 'de Lancastre', 'de Haro', 'de Lara']);
 return { id: 'antiroi', art: 'crown', realm: r, title: `Un anti-roi ${enR(r)}`, text: `Profitant de l’excommunication, une assemblée de princes et d’évêques réunie à Forchheim déclare ${leRuler(r)} déchu et élit à sa place <b>${nm}</b>, qui jure obéissance au Saint-Siège. La guerre civile commence ; tout dépendra du soutien de Rome.`,
  opts: [{ t: `Reconnaître ${nm} et lui envoyer une bannière bénite`, d: 'Guerre civile : s’il l’emporte, le royaume vous devra tout ; s’il échoue, humiliation', fx() { R.anti = { n: nm, a: ri(28, 50), d: cand.d || '', t: 0 }; modRel(r, -20); return `${nm} est oint par l’archevêque. Les deux rois lèvent leurs bannières.`; } },
   { t: 'Reconnaître l’anti-roi et le subventionner (60 marcs)', d: 'Meilleures chances de victoire', req: () => S.treasury >= 60 ? null : 'Trésor insuffisant', fx() { modT(-60); R.anti = { n: nm, a: ri(28, 50), d: cand.d || '', t: 0, sub: 1 }; modRel(r, -25); } },
   { t: 'Désavouer les rebelles et appeler le roi à la pénitence', d: 'Relation +8 · le roi pourrait se soumettre', fx() { modRel(r, 8); if (chance(0.35)) { R.penit = true; pushEvent(evPenitence(r)); } } }] };
}
function evInvasion(r) {
 const R = RL(r);
 return { id: 'invasion', art: 'horse', realm: r, title: `${rulerLbl(r)} marche sur Rome`, text: `Excommunié et furieux, ${rulerLbl(r)} a franchi les frontières du Patrimoine à la tête de ${Math.round(power(r) * 300)} hommes. Ses cavaliers incendient les vignes de la Campagne ; il entend se faire couronner — ou installer un pape à sa main.`,
  opts: [
   { t: 'Défendre la Ville', d: `Milice ${S.army} hommes · alliés à proximité`, fx() { const allies = realmNeighbors('etats').filter(x => x !== r && active(x) && isCath(x) && RL(x).rel >= 50).reduce((a, x) => a + power(x) * 0.3, 0); const d = (S.army / 100 * 4 + (S.build.saintange === true ? 10 : 0) + 6 + allies) * rnd(0.7, 1.3), at = power(r) * 0.8 * rnd(0.7, 1.3); if (d >= at) { modA(6); S.army = Math.max(0, S.army - 100); return `Les assaillants se brisent sur les murs d’Aurélien${allies ? ', pris à revers par les alliés du pape' : ''}.`; } modT(-Math.round(S.treasury * 0.3)); modStab(-25); modA(-10); S.curia = 'exil'; S.army = Math.max(0, S.army - 200); log(`Rome est prise et pillée par ${rname(r)}.`, 'bad'); return 'Rome est prise. Le pape s’échappe de justesse ; le trésor est pillé.'; } },
   { t: 'Lever l’excommunication pour sauver Rome', d: 'Relation +20 · autorité −8', fx() { R.excom = false; R.interdict = false; modRel(r, 20); modA(-8); return 'Le souverain entre dans Rome en pénitent… et en vainqueur.'; } },
   { t: 'Payer un tribut (30 % du trésor)', d: 'Autorité −4', fx() { modT(-Math.round(S.treasury * 0.3)); modA(-4); modRel(r, 6); return 'L’or pontifical repart vers le nord dans des chariots.'; } },
   { t: 'Fuir et gouverner depuis l’exil', d: 'Autorité −4 · la Curie part en exil', fx() { S.curia = 'exil'; modA(-4); return 'Le pape se réfugie dans une forteresse amie.'; } }
  ] };
}
function evHeresyRevolt(r) {
 const R = RL(r);
 return { id: 'hrevolte', art: 'fire', realm: r, title: `Les ${R.hname} tiennent ${R.name}`, text: `${capFirst(enR(r))}, les ${R.hname} ont désormais leurs propres évêques, leurs propres sacrements. Les curés catholiques sont chassés de leurs paroisses ; la noblesse locale protège les « parfaits ». Le légat pontifical écrit : « Si rien n’est fait, cette terre est perdue pour l’Église. »`,
  opts: [{ t: 'Envoyer une grande mission de prédicateurs (40 marcs)', d: 'Hérésie −12 · ferveur +4', req: () => S.treasury >= 40 ? null : 'Trésor insuffisant', fx() { modT(-40); modH(r, -12); modF(r, 4); } },
   { t: 'Négocier avec les chefs du mouvement', d: 'Hérésie −6 · autorité −5', fx() { modH(r, -6); modA(-5); } },
   { t: 'Exiger du souverain qu’il sévisse', d: 'Hérésie −10 · relation −10', fx() { modH(r, -10); modRel(r, -10); } }] };
}

/* ---------- Concile ---------- */
function updateCouncil() {
 if (!S.council) return; S.council.t--;
 if (S.council.t <= 0) pushEvent({ id: 'concile', special: 'council', art: 'church', title: councilName(), text: '' });
}
function councilName() { const c = S.council; return `${ordMasc(c.num)} concile ${c.place === 'Latran' ? 'du Latran' : 'de ' + c.place}`; }
function councilSlots() { return 2 + (S.authority >= 60 ? 1 : 0) + (S.authority >= 80 ? 1 : 0); }
function availableDecrees() {
 return Object.keys(DECREES).filter(k => { const d = DECREES[k]; if (S.decrees.includes(k) && k !== 'finschisme') return false; if (S.year < d.min) return false; if (d.req === 'union') return !S.flags.unionDone && !S.flags.sac && active('byzance') && RL('byzance').union >= 60; if (d.req === 'schism') return !!S.schism; return true; });
}
function closeCouncil(chosen) {
 const name = councilName(); S.council = null; S.lastCouncil = S.year; S.councils++;
 chosen.forEach(k => adoptDecree(k));
 modA(5); modF('all', 3);
 log(`Clôture du ${name} : ${chosen.length ? chosen.map(k => DECREES[k].n).join(', ') : 'aucun canon adopté'}.`, 'gold');
 if (S.decrees.length >= 6) ach('legislateur');
}
function adoptDecree(k) {
 if (k !== 'finschisme') S.decrees.push(k);
 switch (k) {
  case 'celibat': modA(3); modF('all', 3); break;
  case 'investitures': modInv('all', 10); modRel('all', -8); modA(5); break;
  case 'tournois': modRel('all', -3); break;
  case 'embargo': modRel('venise', -15); modRel('genes', -15); break;
  case 'universites': modA(2); break;
  case 'transsub': modA(4); modH('all', -5); break;
  case 'residence': modInv('all', 4); break;
  case 'clericis': modRel('france', -12); modRel('angleterre', -12); break;
  case 'unam': modA(8); catholics(r => hasT(r, 'ambitieux')).forEach(r => modRel(r, -10)); break;
  case 'union': S.flags.unionDone = 1; RL('byzance').union = 100; modRel('byzance', 30); modA(10); ach('union'); log('Union des Églises ! Grecs et Latins chantent ensemble le Credo.', 'gold'); break;
  case 'finschisme': endSchism('concile'); break;
  case 'reforme': modC(-15); modLoy(-8); break;
 }
}

/* ---------- Cardinaux & pape ---------- */
function updateCardinals() {
 for (const c of S.cardinals) {
  const tgt = 50 + (c.nat === S.pope.nat ? 10 : 0) + (c.office ? 10 : 0) + (c.nephew ? 40 : 0) - (c.amb > 7 && !c.office ? 10 : 0) - (S.curia === 'avignon' && c.nat === 'italien' ? 8 : 0) + (S.curia === 'avignon' && c.nat === 'francais' ? 8 : 0);
  c.loyal = clamp(c.loyal + (tgt - c.loyal) * 0.05 + rnd(-1.5, 1.5), 0, 100);
 }
 const plotter = S.cardinals.find(c => c.loyal < 25 && c.amb >= 6);
 if (plotter && chance(0.08) && !S.events.some(e => e.id === 'complot')) pushEvent(evComplot(plotter));
}
function evComplot(c) {
 return { id: 'complot', art: 'tower', title: 'Conjuration au Sacré Collège', text: `Les espions du camerlingue rapportent que le cardinal <b>${cname(c)}</b> réunit de nuit, dans son palais du Trastevere, des prélats mécontents et des envoyés de princes étrangers. On y parlerait de l’âge du pape, de ses erreurs… et du prochain conclave.`, portrait: c.id,
  opts: [{ t: 'L’enfermer au château Saint-Ange', d: 'Il perd la pourpre · loyauté générale −6 · autorité +2', fx() { removeCardinal(c); modLoy(-6); modA(2); return 'Les gardes l’arrêtent à l’aube.'; } },
   { t: 'Acheter sa fidélité (50 marcs)', d: 'Loyauté → 60 · corruption +3', req: () => S.treasury >= 50 ? null : 'Trésor insuffisant', fx() { modT(-50); c.loyal = 60; modC(3); return 'Une abbaye grasse en commende apaise ses ambitions.'; } },
   { t: 'Le confondre en plein consistoire', d: 'Sa loyauté −20 · les autres +4', fx() { c.loyal = clamp(c.loyal - 20, 0, 100); modLoy(4, x => x !== c); return 'Le cardinal pâlit sous les regards de ses pairs.'; } },
   { t: 'L’éloigner par une légation lointaine', d: 'Il part pour l’Orient · loyauté +10', fx() { c.loyal += 10; const far = ['byzance', 'rus', 'armenie', 'georgie', 'hongrie', 'pologne', 'suede'].find(r => active(r) && !RL(r).legate); if (far) { if (c.legate && S.realms[c.legate]) S.realms[c.legate].legate = null; if (c.office) { S.offices[c.office] = null; c.office = null; } c.legate = far; RL(far).legate = c.id; } return 'Le voilà envoyé chez les Grecs et les Ruthènes.'; } }] };
}
function updatePope() {
 const p = S.pope;
 modHealth(-((Math.max(0, p.age - 45) / 45) * (popeHas('fragile') ? 2 : 1) * rnd(0.4, 1.6)) - (S.plague > 0 ? 3 : 0));
 const base = Math.pow(Math.max(0, p.age - 48), 2) / 10000 + (p.health < 30 ? 0.04 : 0) + (p.health < 10 ? 0.15 : 0);
 if (p.health < 40 && chance(0.12) && !S.events.some(e => e.id === 'sante')) pushEvent(evSante());
 if (chance(base) || p.health <= 0) {
  S.popes.push(popeRecord('mort'));
  log(`${popeName()} meurt à ${p.age} ans, après ${S.year - p.start ? (S.year - p.start) + ' an' + (S.year - p.start > 1 ? 's' : '') : 'quelques mois'} de pontificat. Les cloches de Rome sonnent le glas.`, 'bad');
  S.pendingConclave = { reason: 'mort' };
 }
}
function evSante() {
 return { id: 'sante', art: 'book', title: 'Le pape est malade', text: `Fièvres tierces, gravelle et insomnies : les médecins de la Curie se pressent au chevet du pontife. Les cardinaux comptent déjà les voix.`,
  opts: [{ t: 'Faire venir les maîtres de Salerne (30 marcs)', d: 'Santé +14', req: () => S.treasury >= 30 ? null : 'Trésor insuffisant', fx() { modT(-30); modHealth(14); } },
   { t: 'S’en remettre à Dieu et prier', d: 'Santé +4 · ferveur +1', fx() { modHealth(4); modF('all', 1); } },
   { t: 'Gouverner malgré la souffrance', d: 'Autorité +2 · santé −3', fx() { modA(2); modHealth(-3); } }] };
}
function reignSnap() { return { a: S.authority, f: avgFervor(), cw: S.crusadeWins, cl: S.crusades.length, dec: S.decrees.length, b: Object.values(S.build).filter(v => v === true).length, prov: catholicProvCount(), ach: Object.keys(S.ach).length, t: S.treasury, c: S.corruption, ord: S.orders.length }; }
function reignSummary() {
 const s = S.pope.s || reignSnap(), n = reignSnap(); const yrs = S.year - S.pope.start;
 const d = { a: n.a - s.a, f: n.f - s.f, cw: n.cw - s.cw, cf: (n.cl - s.cl) - (n.cw - s.cw), dec: n.dec - s.dec, b: n.b - s.b, prov: n.prov - s.prov, ach: Object.keys(S.ach).filter(k => S.ach[k].p === popeName()).map(k => ACH[k].n), t: n.t - s.t, c: n.c - s.c, ord: n.ord - s.ord, yrs };
 let ep;
 if (yrs < 2) ep = 'le Bref'; else if (d.cw >= 2) ep = 'le Croisé'; else if (d.dec >= 3) ep = 'le Législateur'; else if (d.b >= 3) ep = 'le Bâtisseur'; else if (d.a >= 15) ep = 'le Grand';
 else if (d.c <= -12) ep = 'le Réformateur'; else if (d.ord >= 2) ep = 'le Père des moines'; else if (d.prov >= 4) ep = 'le Conquérant'; else if (d.a <= -15) ep = 'l’Infortuné'; else if (d.c >= 12) ep = 'le Simoniaque'; else if (d.f >= 8) ep = 'le Pieux'; else if (yrs >= 20) ep = 'le Patriarche'; else ep = pick(['le Sage', 'le Prudent', 'le Juste', 'le Pasteur', 'l’Humble']);
 d.ep = ep; return d;
}
function popeRecord(how) { return { name: popeName(), from: S.pope.start, to: S.year, fam: S.pope.fam, how, seed: S.pope.seed, nat: S.pope.nat, auth: Math.round(S.authority), traits: S.pope.traits.slice(), age: S.pope.age, sum: reignSummary(), amb: typeof ambRecord === 'function' ? ambRecord() : undefined }; }

/* ---------- Conclave ---------- */
function conclaveSetup() {
 while (S.cardinals.length < 5) S.cardinals.push(genCardinal(pick(['italien', 'italien', 'francais'])));
 const scored = S.cardinals.map(c => ({ c, s: papScore(c) + rnd(0, 8) })).sort((a, b) => b.s - a.s);
 const cands = scored.slice(0, 3).map(x => x.c.id); const dau = S.dauphin && card(S.dauphin);
 if (dau && !cands.includes(dau.id)) cands[2] = dau.id;
 return { cands, round: 0, backed: dau ? dau.id : null, bribe: false, history: [], done: null };
}
function papScore(c) { return c.comp * 2 + c.piety * 1.5 + c.amb * 1.5 - (c.age > 75 ? 8 : 0) + (S.dauphin === c.id ? 8 : 0); }
function papabili() { return S.cardinals.slice().sort((a, b) => papScore(b) - papScore(a)).slice(0, 3); }
function conclaveRound(cv) {
 cv.round++;
 const prev = cv.history[cv.history.length - 1]; const tot = S.cardinals.length;
 const votes = {}; cv.cands.forEach(id => votes[id] = 0);
 for (const e of S.cardinals) {
  let best = null, bs = -1e9;
  for (const id of cv.cands) {
   const c = card(id); let s = c.piety * 2 + c.comp * 1.5 + rnd(0, 14);
   if (e.nat === c.nat) s += 25; if (e.id === c.id) s += 40; if (c.nephew) s -= 8;
   if (cv.backed === id) s += e.loyal / 2.5; if (S.dauphin === id && cv.backed === id) s += 6; if (cv.bribe && cv.backed === id && (e.trait === 'avide' || e.amb > 6)) s += 18;
   if (S.curia === 'avignon' && c.nat === 'francais') s += 12;
   if (S.build.chapelle === true && cv.backed === id) s += 5;
   if (prev) s += (prev[id] / tot) * 30 * Math.min(1.5, cv.round / 3);
   if (s > bs) { bs = s; best = id; }
  }
  votes[best]++;
 }
 cv.history.push(votes);
 const sorted = cv.cands.slice().sort((a, b) => votes[b] - votes[a]);
 const need = Math.ceil(tot * 2 / 3);
 if (votes[sorted[0]] >= need) cv.done = { id: sorted[0], split: false };
 else if (cv.round >= 7) cv.done = { id: sorted[0], split: votes[sorted[1]] >= tot / 3 };
 return { votes, need };
}
function electPope(cv, name) {
 const c = card(cv.done.id);
 const vac = S.decrees.includes('ubi') ? 0 : Math.floor(cv.round / 3);
 if (vac > 0) { modA(-2 * vac); modStab(-3 * vac); log(`La vacance du Siège apostolique a duré ${vac} saison${vac > 1 ? 's' : ''}.`, 'bad'); }
 removeCardinal(c);
 const traits = [c.trait]; if (POPE_TRAITS[c.trait].v && chance(0.35)) traits.push(pick(Object.keys(POPE_TRAITS).filter(t => !POPE_TRAITS[t].v)));
 S.pnames[name] = (S.pnames[name] || 0) + 1;
 S.pope = { name, num: S.pnames[name], fam: c.ln, fn: c.fn, nat: c.nat, age: c.age, health: ri(62, 90), traits, start: S.year, startS: S.season, seed: c.seed };
 S.pope.s = reignSnap();
 const f = fam(c.ln); if (f) f.loyal = clamp(f.loyal + 30, 0, 100);
 S.pendingConclave = null; modA(3); S.seals = sealsMax(); S.cands = null;
 log(`Habemus papam ! ${cname(c)} est élu et prend le nom de ${popeName()}.`, 'gold');
 if (cv.done.split && chance(S.decrees.includes('conclave') ? 0.15 : 0.35) && !S.schism) {
  const loser = cv.cands.find(id => id !== cv.done.id); const l = card(loser);
  if (l) { const backer = l.nat === 'francais' ? 'france' : l.nat === 'allemand' ? 'empire' : l.nat === 'espagnol' ? 'castille' : null; removeCardinal(l); createSchism(backer && active(backer) ? backer : null, 'conclave'); S.schism.anti = `${pick(['Clément', 'Benoît', 'Félix', 'Victor'])} ${roman(ri(2, 7))}`; log(`Les cardinaux minoritaires, menés par ${cname(l)}, refusent l’élection et proclament l’antipape ${S.schism.anti}.`, 'bad'); }
 }
 if (S.popes.length >= 4) ach('lignee');
 if (S.curia === 'avignon' && c.nat === 'italien' && chance(0.4)) pushEvent(evRetourRome());
}
function evRetourRome() {
 return { id: 'retour', art: 'rome', title: 'Rome appelle son pasteur', text: `Une mystique siennoise, dont les lettres enflammées circulent dans toute l’Italie, adjure le pape : « Revenez, Père très saint, à votre épouse l’Église romaine qui languit, veuve et désolée. » Les Romains promettent obéissance ; les cardinaux français pâlissent.`,
  opts: [{ t: 'Rentrer à Rome', d: 'Curie à Rome · autorité +6 · France −15', fx() { S.curia = 'rome'; modA(6); modRel('france', -15); modStab(8); log('Retour de la papauté à Rome.', 'gold'); } }, { t: 'Rester en Avignon', d: 'Autorité −3', fx() { modA(-3); } }] };
}

/* ---------- Passage de la saison ---------- */
function passive() {
 let dc = 0.5 + [-0.3, 0, 0.8, 1.8][S.fisc] + (S.indulg ? 1.2 : 0) + (popeHas('nepotiste') ? 0.5 : 0) + (popeHas('avide') ? 0.6 : 0) + (popeHas('vaniteux') ? 0.3 : 0)
  + S.cardinals.filter(c => c.nephew).length * 0.25 + (S.decrees.includes('indulgence') ? 0.2 : 0)
  - (popeHas('reformateur') ? 0.9 : 0) - (S.decrees.includes('celibat') ? 0.3 : 0) - (S.decrees.includes('simonie') ? 0.5 : 0) - (S.orders.includes('cisterciens') ? 0.2 : 0) - (S.orders.includes('franciscains') ? 0.2 : 0);
 const cam = S.offices.camerlingue && card(S.offices.camerlingue); if (cam && cam.trait === 'avide') dc += 0.4;
 if (S.corruption < 22) dc += (22 - S.corruption) * 0.05;
 modC(dc + rnd(-0.3, 0.3));
 let da = -(S.authority - 45) * 0.04 - (S.authority > 70 ? (S.authority - 70) * 0.06 : 0) + (avgFervor() - 50) / 60 - (S.corruption > 50 ? (S.corruption - 50) / 35 : 0) - (S.curia === 'avignon' ? 0.4 : 0) - (S.curia === 'exil' ? 0.8 : 0) + (S.build.bibliotheque === true ? 0.2 : 0) + (S.orders.includes('chartreux') ? 0.15 : 0);
 da -= catholics(r => RL(r).heresy > 70).length * 0.3;
 da -= catholics(r => RL(r).excom && RL(r).excomT > 12).length * 0.2;
 S.authority = clamp(S.authority + da, 0, 100);
}
function yearly() {
 for (const r of realmIds()) { const R = RL(r); if (R.ruler && !R.ruler.c && R.ruler.a > 0) { R.ruler.a++; if (R.ruler.a >= 16 && R.ruler.t.includes('enfant')) { R.ruler.t = R.ruler.t.filter(t => t !== 'enfant'); if (!R.ruler.t.length) R.ruler.t = randTraits(); log(`${capFirst(leRuler(r))} atteint sa majorité et gouverne seul.`, 'info'); } } }
 S.pope.age++; S.created = 0; S.cands = null;
 for (const c of S.cardinals.slice()) { c.age++; const p = c.age < 55 ? 0.01 : Math.pow((c.age - 55) / 25, 2) * 0.25 + 0.01; if (chance(p + (S.plague > 0 ? 0.15 : 0))) { log(pick([`Mort du cardinal ${cname(c)}, à ${c.age} ans.`, `Le cardinal ${cname(c)} s’éteint à ${c.age} ans.`, `Le Sacré Collège perd le cardinal ${cname(c)}, mort à ${c.age} ans.`, `Le cardinal ${cname(c)} a rendu son âme à Dieu (${c.age} ans).`]), 'info'); removeCardinal(c); } }
 for (const r of activeRealms()) { const R = RL(r), home = PROVS.filter(p => S.home && S.home[p.id] === r).length; if (home && nProv(r) < home / 2 && R.base < REALMS[r].base * 1.5) R.base += 0.3; }
 if (S.year > 1180 && active('byzance') && !S.flags.unionDone) RL('byzance').base = Math.max(10, RL('byzance').base - 0.12);
 if (S.year > 1300 && active('turcs')) { RL('turcs').base = Math.min(46, RL('turcs').base + 0.5); if (active('byzance')) RL('byzance').base = Math.max(8, RL('byzance').base - 0.25); }
 if (S.year >= 1236 && !S.flags.mongols && active('horde')) { S.flags.mongols = 1; const H = RL('horde'); H.name = 'Horde d’Or'; H.base = 32; H.ruler = { n: 'Batu', a: 31, p: 2, t: ['guerrier', 'ambitieux'], d: 'Djötchides' }; H.title = 'Khan'; pushEvent(forced('mongols')); }
 if (S.year >= 1347 && !S.flags.plagueDone) { S.flags.plagueDone = 1; pushEvent(forced('peste')); }
 if (S.year >= 1452 && !S.flags.print) { S.flags.print = 1; pushEvent(forced('imprimerie')); }
 if (S.year % 50 === 0 && S.year >= 1300 && !S.flags['jub' + S.year]) { S.flags['jub' + S.year] = 1; pushEvent(forced('jubile')); }
 secessions();
 unions();
 eraNames();
}
function snapshot() { S.hist.push({ y: S.year + S.season / 4, a: Math.round(S.authority), f: Math.round(avgFervor()), t: S.treasury, c: Math.round(S.corruption), h: Math.round(catholics().reduce((s, r) => s + RL(r).heresy, 0) / Math.max(1, catholics().length)) }); if (S.hist.length > 900) S.hist.shift(); }
function endSeason() {
 S.rep = []; S.used = {}; const before = { t: S.treasury, a: S.authority, c: S.corruption, f: avgFervor() };
 const b = budget(); S.lastBudget = b; modT(b.total);
 if (S.treasury < 0) { S.debt += -S.treasury; S.treasury = 0; modA(-2); log('Le trésor est vide : la Chambre apostolique emprunte à des taux usuraires.', 'bad'); }
 if (S.debt > 1200) { S.debt = Math.round(S.debt * 0.25); modA(-15); modC(8); S.rome.fam.forEach(f => f.loyal = clamp(f.loyal - 10, 0, 100)); log('Banqueroute du Saint-Siège ! Les banquiers saisissent les revenus de la Chambre apostolique ; les trois quarts des créances sont annulés dans le scandale.', 'bad'); }
 for (const k in S.build) if (typeof S.build[k] === 'number') { S.build[k]--; if (S.build[k] <= 0) { S.build[k] = true; onBuilt(k); } }
 updateRome();
 for (const p of PATRI) if (S.own[p] === 'etats') { const d = -0.6 + (S.build.rocca === true ? 1.2 : 0); S.ctrl[p] = clamp(S.ctrl[p] + d + rnd(-0.6, 0.6), 0, 100); if (S.ctrl[p] < 25 && (S.evc.seigneur || 0) <= S.turn && chance(0.08)) { S.evc.seigneur = S.turn + 6; pushEvent(forced('seigneur', p)); } }
 updateRealms(); updateWars(); updateCrusade(); updateCouncil(); updateSchism(); updateCardinals(); updatePope(); passive();
 S.season++; S.turn++;
 if (S.season > 3) { S.season = 0; S.year++; yearly(); }
 S.jubilee = Math.max(0, S.jubilee - 1); S.plague = Math.max(0, S.plague - 1); S.weary = Math.max(0, (S.weary || 0) - 0.015);
 genEvents();
 S.seals = sealsMax();
 snapshot(); checkAch(); if (typeof ambTick === 'function' && !S.pendingConclave) ambTick(); checkEnd();
 const rep = { lines: S.rep, budget: b, d: { t: S.treasury - before.t, a: S.authority - before.a, c: S.corruption - before.c, f: avgFervor() - before.f } };
 S.rep = null; return rep;
}
function onBuilt(k) {
 log(`Achèvement : ${BUILDINGS[k].n}.`, 'gold');
 if (k === 'saintange') modStab(5); if (k === 'chapelle') modA(4); if (k === 'hopital') modF('etats', 3);
 if (Object.values(S.build).filter(v => v === true).length >= 6) ach('rome');
}
function genEvents() {
 for (const e of EVENTS) if (e.hist && !S.evDone[e.id] && (S.evc[e.id] || -99) <= S.turn) { const inst = e.make(); if (inst) { inst.id = e.id; if (!inst.art) inst.art = e.art; S.events.push(inst); S.evc[e.id] = S.turn + (e.cool || 12); if (e.once) S.evDone[e.id] = 1; } }
 let n = (chance(0.7) ? 1 : 0) + (chance(0.35) ? 1 : 0);
 const pool = EVENTS.filter(e => !e.hist && e.w && (S.evc[e.id] || -99) <= S.turn && !(e.once && S.evDone[e.id]));
 let guard = 0;
 while (n > 0 && guard++ < 12 && pool.length) {
  const tot = pool.reduce((a, e) => a + e.w, 0); let x = Math.random() * tot, ch = pool[0];
  for (const e of pool) { x -= e.w; if (x <= 0) { ch = e; break; } }
  pool.splice(pool.indexOf(ch), 1);
  const inst = ch.make(); if (!inst) continue;
  inst.id = ch.id; if (!inst.art) inst.art = ch.art; S.events.push(inst); S.evc[ch.id] = S.turn + (ch.cool || 8); if (ch.once) S.evDone[ch.id] = 1; n--;
 }
}

/* ---------- Hauts faits & gloire ---------- */
const ACH = {
 canossa:{n:'Canossa',d:'Un grand monarque implore son pardon à genoux.'},
 jerusalem:{n:'Jérusalem délivrée',d:'La Ville sainte revient aux chrétiens.'},
 reconquista:{n:'Fin de la Reconquista',d:'Plus aucune terre ibérique sous domination musulmane.'},
 union:{n:'Union des Églises',d:'Grecs et Latins réconciliés.'},
 lituanie:{n:'Baptême du Nord',d:'Le dernier peuple païen d’Europe se convertit.'},
 legislateur:{n:'Législateur de l’Église',d:'Six décrets conciliaires en vigueur.'},
 rome:{n:'Rome resplendissante',d:'Six grands chantiers achevés.'},
 tresor:{n:'Trésor de Salomon',d:'1 500 marcs dans les coffres.'},
 lignee:{n:'Successeurs de Pierre',d:'Cinq papes ont régné sous votre conduite.'},
 schisme:{n:'Unité retrouvée',d:'Un schisme a été résorbé.'},
 jubile:{n:'Année sainte',d:'Un Jubilé a été proclamé.'},
 ordres:{n:'Père des ordres',d:'Six ordres religieux approuvés.'},
 peste:{n:'Pasteur dans la tourmente',d:'La Peste noire est traversée sans que la ferveur ne s’effondre.'},
 marteau:{n:'Marteau des hérétiques',d:'Une hérésie majeure a été extirpée d’un royaume.'},
 vassaux:{n:'Suzerain des rois',d:'Quatre royaumes vassaux du Saint-Siège.'},
 croisades:{n:'Trois fois Deus lo vult',d:'Trois croisades victorieuses.'},
 paix:{n:'Pacificateur',d:'Trois paix arbitrées par le pape.'},
 reforme:{n:'Église réformée',d:'La corruption descend sous 10.'},
 plenitude:{n:'Plenitudo potestatis',d:'L’autorité atteint 95.'}
};
function checkAch() {
 if (!IBERIA.some(p => RL(S.own[p]).relig === 'musulman')) ach('reconquista');
 if (S.treasury >= 1500) ach('tresor');
 if (S.orders.length >= 6) ach('ordres');
 if (catholics(r => RL(r).vassal).length >= 4) ach('vassaux');
 if (S.mediations >= 3) ach('paix');
 if (S.corruption < 10) ach('reforme');
 if (S.authority >= 95) ach('plenitude');
 if (S.flags.plagueDone && S.plague === 0 && S.flags.plagueSeen && !S.ach.peste && avgFervor() >= 40) ach('peste');
}
function glory() {
 const builds = Object.values(S.build).filter(v => v === true).length;
 return Math.round(S.authority * 3 + avgFervor() * 2 + catholicProvCount() * 2 + builds * 15 + Object.keys(S.ach).length * 60 + S.decrees.length * 10 + S.orders.length * 8 - S.corruption * 2 + S.treasury / 20 - S.debt / 10 + S.crusadeWins * 25 + (S.ambGlory || 0));
}
function checkEnd() {
 if (S.authority <= 0) S.zeroA++; else S.zeroA = 0;
 if (S.zeroA >= 4) S.over = { reason: 'ruine', t: 'La papauté s’effondre', d: 'Privé de toute autorité, le pontife n’est plus qu’un évêque parmi d’autres, jouet des princes. L’universalité romaine a vécu.' };
 else if (S.year >= 1517) S.over = { reason: 'fin', t: 'Anno Domini 1517', d: 'Un moine augustin de Wittenberg vient d’afficher quatre-vingt-quinze thèses sur les indulgences. Une autre époque commence : le Moyen Âge de la papauté s’achève ici.' };
}

/* ---------- Sauvegarde ---------- */
function saveGame() {
 if (!S || S.test) return false; // le mode test ne touche jamais aux sauvegardes
 const js = JSON.stringify(S); let ok = false;
 try { localStorage.setItem(SAVE_KEY, js); localStorage.setItem(SAVE_KEY + '_t', String(Date.now())); ok = true; } catch (e) { }
 if (typeof NUAGE !== 'undefined') { NUAGE.sauver(js, `${SEASONS[S.season]} ${S.year} · ${popeName()}`); ok = true; }
 return ok;
}
function loadFromString(js) { try { const s = JSON.parse(js); if (!s.realms || !s.pope) return false; S = s; S.events = []; if (!PADJ) computeFallbackAdj(); return true; } catch (e) { return false; } }
function localSaveTime() { try { return +(localStorage.getItem(SAVE_KEY + '_t') || 0); } catch (e) { return 0; } }
function loadGame() { try { const s = localStorage.getItem(SAVE_KEY); if (!s) return null; S = JSON.parse(s); S.events = S.events || []; if (!PADJ) computeFallbackAdj(); return S; } catch (e) { return null; } }
function hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }
function exportCode() { return btoa(unescape(encodeURIComponent(JSON.stringify(S)))); }
function importCode(code) { try { const s = JSON.parse(decodeURIComponent(escape(atob(code.trim())))); if (!s.realms || !s.pope) return false; S = s; S.events = []; return true; } catch (e) { return false; } }

if (typeof module !== 'undefined') module.exports = { get S() { return S; } };
