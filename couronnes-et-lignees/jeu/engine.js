// Moteur de "Couronnes & Lignées" — simulation dynastique
// Utilisable dans Node (module.exports) et dans le navigateur (window.Dyn)
(function (root) {
  'use strict';

  const DEFAULT_P = {
    ypt: 3, startYear: 1200, endYear: 1350,
    startGold: 50, startArmy: 30, startStab: 60, startPrestige: 10, startDomains: 5,
    incPerDomain: 3, incPerBuild: 2, upkeep: 0.2,
    taxGain: 18, taxStab: 9,
    feastCost: 15, feastStab: 9, feastPrest: 3,
    recruitCost: 20, recruitArmy: 15,
    buildCost: 35, buildStep: 24, buildPrest: 4,
    eduCost: 10, envoyCost: 10, envoyMenace: 18,
    campMin: 20, campDomain: 4, campStab: 2, campBase: 22, campGrowth: 0.12, campDeath: 0.07,
    menaceMin: 4, menaceMax: 20, invadeBase: 20, invadeGrowth: 3.8,
    birthRate: 0.55, eventChance: 0.92,
    stabDrift: 1, debtStab: 6, succStab: 6, crisisStab: 12, regencyStab: 8,
    allianceDef: 8, adoptCost: 30,
    fiscRate: [0.4, 1.3, 2.6], fiscStab: [2, 0, -4], courCost: [0, 4, 10], courStab: [-1, 1, 3], courPrest: [0, 0, 1], levy: 10, intrigueCost: 15, baron: 4, rivalDef: 16, neutralDef: 10, invadeTake: 0.5, rivalExpand: 0.08, lordWar: 0.12, missionChance: 0.5, missionTurns: 5, unifyAt: 12, vassBase: 20, buildDef: 0.8,
    fatigue: 0.45, fatigueDecay: 0.5, evCooldown: 7, justiceStab: 4, pilgCost: 10, mercCost: 40, mercArmy: 35, ambReward: 12, maxAlliances: 4,
  };

  // ---------- RNG déterministe stocké dans l'état ----------
  function rand(s) {
    s.r = (s.r + 0x6D2B79F5) | 0;
    let t = s.r;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  const ri = (s, a, b) => a + Math.floor(rand(s) * (b - a + 1));
  const pick = (s, arr) => arr[Math.floor(rand(s) * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const NAMES_M = ['Aymeric', 'Baudouin', 'Enguerrand', 'Gauthier', 'Thibaut', 'Raoul', 'Godefroy', 'Hugues', 'Amaury', 'Foulques', 'Guillaume', 'Louis', 'Philippe', 'Robert', 'Arnaud', 'Bertrand', 'Geoffroy', 'Mathieu', 'Renaud', 'Tristan', 'Évrard', 'Odon', 'Lothaire', 'Clovis'];
  const NAMES_F = ['Aliénor', 'Blanche', 'Isabeau', 'Mahaut', 'Ermengarde', 'Yolande', 'Béatrix', 'Jeanne', 'Marguerite', 'Agnès', 'Adèle', 'Constance', 'Sibylle', 'Héloïse', 'Clémence', 'Mélisende', 'Bertrade', 'Ide', 'Pétronille', 'Gisèle'];
  const SEATS = { 'de Montfort': "Montfort-l'Amaury", 'de Lusignan': 'Lusignan', 'de Coucy': 'Coucy', 'de Brienne': 'Brienne', 'de Joinville': 'Joinville', "d'Ibelin": 'Ibelin, en Outremer', 'de Châtillon': 'Châtillon-sur-Marne', 'de Dreux': 'Dreux', 'de Craon': 'Craon', 'de Beaujeu': 'Beaujeu', 'de Rohan': 'Rohan', 'de Vergy': 'Vergy' };
  const TOWNS = ['Provins', 'Troyes', 'Chartres', 'Laon', 'Senlis', 'Beauvais', 'Amiens', 'Reims', 'Soissons', 'Melun', 'Étampes', 'Poitiers', 'Angers', 'Tours', 'Bourges', 'Nevers', 'Auxerre', 'Sens', 'Arras', 'Bar-sur-Aube'];
  const TEMPERS = {
    sanguin: { n: 'Sanguin', desc: 'jovial, généreux, aime la compagnie', loy: 8 },
    colerique: { n: 'Colérique', desc: 'prompt, ambitieux, rancunier', loy: -12 },
    melancolique: { n: 'Mélancolique', desc: 'rêveur, savant, secret', loy: 0 },
    flegmatique: { n: 'Flegmatique', desc: 'calme, patient, difficile à émouvoir', loy: 4 },
  };
  const PASSIONS = ['la fauconnerie', 'la chasse au cerf', 'les échecs', 'la harpe', 'l\'enluminure', 'les chansons de geste', 'l\'astronomie', 'les chevaux d\'Espagne', 'les reliques', 'la théologie', 'les jardins de simples', 'les tournois', 'les épices d\'Orient', 'les portulans', 'la poésie courtoise', 'les chiens de meute', 'les bestiaires', 'la danse', 'l\'architecture gothique', 'les dés'];
  const MARKS = ['une voix grave qui porte loin', 'des yeux vairons', 'une cicatrice au menton', 'un rire tonitruant', 'une démarche raide', 'une mémoire prodigieuse des visages', 'une pâleur de parchemin', 'une chevelure qu\'on dit de feu', 'un goût pour le noir', 'un léger bégaiement', 'des mains d\'artisan', 'un regard qui ne cille jamais', 'un anneau d\'or venu d\'Orient', 'une haute taille', 'une petite taille et un grand orgueil', 'une écriture superbe', 'le sommeil léger', 'une main gauche plus habile que la droite'];
  const HOUSES = ['de Montfort', 'de Lusignan', 'de Coucy', 'de Brienne', 'de Joinville', "d'Ibelin", 'de Châtillon', 'de Dreux', 'de Craon', 'de Beaujeu', 'de Rohan', 'de Vergy'];

  // mil: force militaire, stab: stabilité/tour, inc: revenu/tour, prest: prestige/tour,
  // death: multiplicateur de mortalité, fert: multiplicateur de fertilité
  const TRAITS = {
    brave: { n: 'Brave', g: 1, mil: 3, desc: '+force en guerre, mais s\'expose' },
    couard: { n: 'Couard', g: -1, mil: -3, desc: '−force en guerre' },
    sage: { n: 'Sage', g: 1, stab: 2, desc: '+2 stabilité/tour' },
    cruel: { n: 'Cruel', g: -1, stab: -1, tax: 6, desc: '+impôts, −1 stabilité/tour' },
    pieux: { n: 'Pieux', g: 1, stab: 1, prest: 1, desc: '+1 stabilité et prestige/tour' },
    avare: { n: 'Avare', g: 0, inc: 3, feast: -4, desc: '+3 or/tour, festins moins efficaces' },
    prodigue: { n: 'Prodigue', g: 0, inc: -3, prest: 1, desc: '−3 or/tour, +1 prestige/tour' },
    charismatique: { n: 'Charismatique', g: 1, feast: 4, prest: 1, desc: 'festins et alliances renforcés' },
    maladif: { n: 'Maladif', g: -1, death: 2.2, fert: 0.6, desc: 'santé fragile' },
    robuste: { n: 'Robuste', g: 1, death: 0.55, desc: 'vit plus longtemps' },
    fertile: { n: 'Fécond', g: 1, fert: 1.6, desc: 'beaucoup d\'enfants' },
    sterile: { n: 'Stérile', g: -1, fert: 0.15, desc: 'presque aucun enfant' },
    genie: { n: 'Génie', g: 1, mil: 2, stab: 1, inc: 2, prest: 1, desc: 'excelle en tout' },
    simplet: { n: 'Simplet', g: -1, stab: -1, inc: -2, desc: 'gouverne mal' },
  };
  const BIRTH_TRAITS = [['brave', 8], ['couard', 6], ['sage', 6], ['cruel', 5], ['pieux', 7], ['avare', 5], ['prodigue', 5], ['charismatique', 5], ['maladif', 6], ['robuste', 6], ['fertile', 5], ['sterile', 3], ['genie', 1.5], ['simplet', 4]];
  const OPPOSED = { brave: 'couard', couard: 'brave', maladif: 'robuste', robuste: 'maladif', fertile: 'sterile', sterile: 'fertile', avare: 'prodigue', prodigue: 'avare', genie: 'simplet', simplet: 'genie' };
  const EDU_GOOD = ['sage', 'brave', 'pieux', 'charismatique'];
  const EDU_FIX = ['simplet', 'couard', 'cruel'];
  const EDU_PATHS = {
    armes: { n: 'Les armes', d: 'Joutes, chasse et art de la guerre', good: ['brave', 'robuste'], fix: 'couard', tutor: 'marechal', ic: 'campagne' },
    lettres: { n: 'Les lettres', d: 'Latin, droit et calcul', good: ['sage', 'genie'], fix: 'simplet', tutor: 'chancelier', ic: 'plume', gw: { genie: 0.25 } },
    foi: { n: 'La foi', d: 'Psaumes, aumônes et retraites', good: ['pieux', 'sage'], fix: 'cruel', tutor: 'chapelain', ic: 'eglise' },
    cour: { n: 'La cour', d: 'Danse, éloquence et diplomatie', good: ['charismatique'], fix: 'avare', tutor: null, ic: 'marier' },
  };
  function eduChance(s, path) { const E = EDU_PATHS[path]; let c = (s.univ || edif(s, 'universite') ? 0.75 : 0.55); if (E && E.tutor) c += Math.max(-1, seatSkillAt(s, E.tutor)) * 0.06; if (E && !E.tutor) c += (tsum(ruler(s), 'feast') > 0 ? 0.1 : 0); return clamp(c, 0.2, 0.92); }

  const ERAS = [
    { from: 1200, name: "L'âge des barons", desc: 'Les grands vassaux pèsent sur la couronne. Querelles féodales et croisades lointaines.' },
    { from: 1250, name: "L'âge des cathédrales", desc: 'Le commerce et la foi bâtissent. Les édifices coûtent moins cher et le pèlerinage devient possible.' },
    { from: 1300, name: "L'âge des fléaux", desc: 'Famines, guerre et peste. Les voisins s\'arment plus vite ; les compagnies de mercenaires se vendent.' },
  ];
  const POLICIES = {
    fisc: { n: 'Impôts', opts: ['Légers', 'Ordinaires', 'Lourds'] },
    cour: { n: 'Train de la cour', opts: ['Frugal', 'Courtois', 'Fastueux'] },
    ost: { n: 'Ost', opts: ['Réduit', 'Ordinaire', 'Levé'] },
  };
  // Effets par tour d'une politique (pour l'affichage et le calcul)
  function policyFx(s, key, v) {
    const P = s.P, r = ruler(s);
    if (key === 'fisc') return { gold: Math.round(s.domains * P.fiscRate[v] + (v === 2 ? tsum(r, 'tax') / 2 : 0)), stab: P.fiscStab[v] };
    if (key === 'cour') return { gold: -P.courCost[v], stab: P.courStab[v] + (v === 2 ? Math.round(tsum(r, 'feast') / 2) : 0), prestige: P.courPrest[v] };
    if (key === 'ost') return v === 0 ? { army: -Math.round(s.army * 0.12), stab: 1 } : v === 2 ? { army: P.levy, stab: -1 } : {};
    return {};
  }
  function setPolicy(s, key, v) { s.pol[key] = v; }
  function eraOf(s) { return s.year >= 1300 ? 2 : s.year >= 1250 ? 1 : 0; }
  const AMBITIONS = {
    conquerant: { n: 'Conquérant', ep: ['le Conquérant', 'la Conquérante'], goal: 'Remporter 2 campagnes', need: 2, t: ['brave', 'cruel'] },
    batisseur: { n: 'Bâtisseur', ep: ['le Bâtisseur', 'la Bâtisseuse'], goal: 'Bâtir 2 édifices', need: 2, t: ['genie', 'prodigue'] },
    tresorier: { n: 'Trésorier', ep: ['le Riche', 'la Riche'], goal: 'Amasser 150 pièces d\'or', need: 150, t: ['avare'] },
    pacificateur: { n: 'Pacificateur', ep: ['le Juste', 'la Juste'], goal: 'Porter la stabilité à 75', need: 75, t: ['sage'] },
    dynaste: { n: 'Dynaste', ep: ['le Patriarche', 'la Matriarche'], goal: 'Marier 2 membres de la famille', need: 2, t: ['fertile', 'charismatique'] },
    devot: { n: 'Dévot', ep: ['le Pieux', 'la Pieuse'], goal: 'Gagner 30 points de prestige', need: 30, t: ['pieux'] },
    suzerain: { n: 'Suzerain', ep: ['le Suzerain', 'la Suzeraine'], goal: 'Recevoir l\'hommage de 2 seigneurs', need: 2, t: ['charismatique', 'sage'] },
    fleau: { n: 'Fléau des rivaux', ep: ['le Terrible', 'la Terrible'], goal: 'Arracher une terre à la maison rivale', need: 1, t: ['cruel', 'brave'] },
    bouclier: { n: 'Bouclier', ep: ['le Bouclier', 'la Gardienne'], goal: 'Repousser une invasion', need: 1, t: ['robuste', 'brave'] },
  };
  function assignAmbition(s, p) {
    const list = Object.keys(AMBITIONS).filter(k => !(k === 'fleau' && (s.rivalDown || !s.regions.some(r => r.owner === 'rival')))).map(k => [k, 1 + (AMBITIONS[k].t.some(t => p.traits.includes(t)) ? 3 : 0)]);
    const k = weighted(s, list);
    s.amb = { k, p0: s.prestige, w0: s.stats.warsWon, b0: s.builds, m0: s.stats.marriages || 0, i0: s.stats.invRepelled, v0: s.stats.vassals || 0, r0: s.stats.rivalTaken || 0, done: false, prog: 0 };
  }
  function ambitionProgress(s) {
    const a = s.amb; if (!a) return 0;
    switch (a.k) {
      case 'conquerant': return s.stats.warsWon - a.w0;
      case 'batisseur': return s.builds - a.b0;
      case 'tresorier': return Math.max(0, s.gold);
      case 'pacificateur': return Math.max(0, s.stab);
      case 'dynaste': return (s.stats.marriages || 0) - a.m0;
      case 'devot': return s.prestige - a.p0;
      case 'bouclier': return s.stats.invRepelled - a.i0;
      case 'suzerain': return (s.stats.vassals || 0) - (a.v0 || 0);
      case 'fleau': return (s.stats.rivalTaken || 0) - (a.r0 || 0);
    }
    return 0;
  }
  function checkAmbition(s) {
    const a = s.amb; if (!a || a.done) return;
    a.prog = ambitionProgress(s);
    if (a.prog >= AMBITIONS[a.k].need) {
      a.done = true; const r = ruler(s), A = AMBITIONS[a.k];
      r.epithet = A.ep[r.sex === 'M' ? 0 : 1]; bio(s, r, `Accomplit son ambition : on l'appelle ${r.epithet}.`);
      s.prestige += s.P.ambReward; s.stab += 6; s.stats.ambitions = (s.stats.ambitions || 0) + 1;
      log(s, `★ ${r.title} accomplit son ambition (${A.goal.toLowerCase()}). La postérité l'appellera ${r.epithet}.`, 'big');
      (s.flashes = s.flashes || []).push({ type: 'ambition', k: a.k, id: r.id });
    }
  }
  function deathEpithet(s, p) {
    if (p.epithet) return;
    const reign = s.year - p.ruledFrom, F = p.sex === 'F';
    if (reign < 6) p.epithet = F ? 'la Brève' : 'le Bref';
    else if (p.cause === 'assassiné') p.epithet = F ? 'la Trahie' : 'le Trahi';
    else if (p.traits.includes('cruel')) p.epithet = F ? 'la Cruelle' : 'le Cruel';
    else if (p.traits.includes('simplet')) p.epithet = F ? 'la Simple' : 'le Simple';
    else if (reign >= 35) p.epithet = F ? 'la Vieille' : 'le Vieux';
    else if (p.traits.includes('sage')) p.epithet = F ? 'la Sage' : 'le Sage';
    else if (p.traits.includes('brave')) p.epithet = F ? 'la Hardie' : 'le Hardi';
  }

  function weighted(s, list) {
    const tot = list.reduce((a, x) => a + x[1], 0);
    let r = rand(s) * tot;
    for (const [k, w] of list) { if ((r -= w) < 0) return k; }
    return list[list.length - 1][0];
  }
  function canHave(p, t) { return !p.traits.includes(t) && !p.traits.includes(OPPOSED[t]); }
  function addTrait(p, t) { if (canHave(p, t) && p.traits.length < 4) { p.traits.push(t); return true; } return false; }
  function tsum(p, key, def = 0) { return p ? p.traits.reduce((a, t) => a + (TRAITS[t][key] || 0), def) : def; }
  function tmul(p, key) { return p ? p.traits.reduce((a, t) => a * (TRAITS[t][key] || 1), 1) : 1; }

  function randomTraits(s, p, n) {
    let tries = 0;
    while (p.traits.length < n && tries++ < 10) addTrait(p, weighted(s, BIRTH_TRAITS));
  }

  // ---------- Personnes ----------
  function newPerson(s, o) {
    const p = Object.assign({ id: s.nextId++, traits: [], alive: true, inDyn: true, spouse: null, parent: null, other: null, died: null, ruledFrom: null, title: '' }, o);
    if (!p.name) { const pool = p.sex === 'M' ? NAMES_M : NAMES_F, used = new Set(Object.values(s.people || {}).filter(x => x.alive && x.inDyn !== false).map(x => x.name)), free = pool.filter(n => !used.has(n)); p.name = pick(s, free.length ? free : pool); }
    if (p.face == null) p.face = p.id;
    if (!p.temper) p.temper = pick(s, Object.keys(TEMPERS));
    if (!p.passion) p.passion = pick(s, PASSIONS);
    if (!p.mark) p.mark = pick(s, MARKS);
    if (!p.place) p.place = p.inDyn && s.seat ? s.seat : (p.from && SEATS[p.from]) || pick(s, TOWNS);
    if (p.loyal == null) p.loyal = clamp(52 + ri(s, -25, 25) + TEMPERS[p.temper].loy, 5, 95);
    p.bio = p.bio || [];
    s.people[p.id] = p;
    return p;
  }
  function bio(s, p, t) { if (p) { p.bio = p.bio || []; p.bio.push({ y: s.year, t }); if (p.bio.length > 14) p.bio.splice(1, 1); } }
  function loyalty(s, p, d) { if (p && p.alive && p.loyal != null) p.loyal = clamp(Math.round(p.loyal + d), 0, 100); }
  const age = (s, p) => s.year - p.born;
  const P_ = id => id;
  function person(s, id) { return id == null ? null : s.people[id]; }
  function ruler(s) { return s.people[s.rulerId]; }
  function childrenOf(s, id) {
    return Object.values(s.people).filter(p => p.parent === id && p.inDyn)
      .sort((a, b) => (a.sex === b.sex ? a.born - b.born : (a.sex === 'M' ? -1 : 1)));
  }
  function lineage(s, id, out) {
    for (const c of childrenOf(s, id)) { if (c.alive && !c.disinherited) out.push(c.id); lineage(s, c.id, out); }
    return out;
  }
  function successionLine(s) {
    const out = [];
    const seen = new Set();
    let cur = s.rulerId;
    while (cur != null) {
      for (const id of lineage(s, cur, [])) if (!seen.has(id) && id !== s.rulerId) { seen.add(id); out.push(id); }
      cur = s.people[cur].parent;
    }
    return out;
  }
  function heir(s) { const l = successionLine(s); return l.length ? s.people[l[0]] : null; }
  function livingDyn(s) { return Object.values(s.people).filter(p => p.inDyn && p.alive); }

  function log(s, txt, kind = '') { s.log.push({ y: s.year, t: txt, k: kind, r: s.rulerId }); if (s.log.length > 300) s.log.shift(); }

  // ---------- Création ----------
  function createGame(seed, params) {
    const s = { P: Object.assign({}, DEFAULT_P, params || {}), r: (seed >>> 0) || 1, seed, nextId: 1, people: {}, log: [], turn: 0 };
    const P = s.P;
    s.year = P.startYear;
    s.house = pick(s, HOUSES);
    s.gold = P.startGold; s.army = P.startArmy; s.stab = P.startStab; s.prestige = P.startPrestige;
    s.domains = P.startDomains; s.builds = 0; s.alliances = 0; s.menace = 20;
    s.rulers = []; s.pol = { fisc: 1, cour: 1, ost: 1 }; s.fat = {}; s.evLast = {}; s.done = {}; s.era = 0; s.over = false; s.result = null; s.event = null; s.stats = { wars: 0, warsWon: 0, invasions: 0, invRepelled: 0, births: 0, events: 0 };
    s.rival = pick(s, HOUSES.filter(h => h !== s.house));
    s.seat = SEATS[s.house];
    initRegions(s);
    s.rivalLord = newRivalLord(s, false);
    const founder = newPerson(s, { sex: 'M', born: s.year - ri(s, 24, 32) });
    randomTraits(s, founder, 2);
    const wife = newPerson(s, { sex: 'F', born: s.year - ri(s, 18, 24), inDyn: false, from: pick(s, HOUSES) });
    randomTraits(s, wife, 1);
    founder.spouse = wife.id; wife.spouse = founder.id;
    bio(s, founder, `Naît à ${founder.place}.`); bio(s, wife, `Naît à ${wife.place}, dans la maison ${wife.from}.`); bio(s, founder, `Épouse ${wife.name} ${wife.from}.`); bio(s, wife, `Épouse ${founder.name}.`);
    const kid = newPerson(s, { sex: pick(s, ['M', 'F']), born: s.year - ri(s, 0, 3), parent: founder.id, other: wife.id });
    randomTraits(s, kid, 1);
    bio(s, kid, `Naît à ${kid.place}.`);
    becomeRuler(s, founder, true);
    log(s, `La maison ${s.house} prend possession de ses terres. ${founder.name} Ier est couronné. Au-delà des marches, la maison ${s.rival} guette.`, 'big');
    return s;
  }

  function ordinal(s, p) {
    const n = s.rulers.filter(id => s.people[id].name === p.name).length;
    const R = ['', 'Ier', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    return p.sex === 'F' && n === 1 ? 'Ière' : (R[n] || n);
  }
  function becomeRuler(s, p, first) {
    s.rulerId = p.id; p.ruledFrom = s.year; s.rulers.push(p.id);
    p.title = `${p.name} ${ordinal(s, p)}`;
    bio(s, p, first ? `Fonde la lignée et prend la couronne.` : `Monte sur le trône à ${age(s, p)} ans.`);
    if (age(s, p) >= 14) assignAmbition(s, p); else s.amb = null;
  }
  function fullName(s, p) { return (p.title || p.name) + (p.epithet ? ' ' + p.epithet : ''); }


  // ---------- Géométrie du plateau (partagée moteur / interface) ----------
  function hashStr(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function prngOf(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function clipPoly(poly, a, b, c) {
    const out = []; for (let i = 0; i < poly.length; i++) {
      const P = poly[i], Q = poly[(i + 1) % poly.length];
      const pin = a * P[0] + b * P[1] <= c, qin = a * Q[0] + b * Q[1] <= c;
      if (pin) out.push(P);
      if (pin !== qin) { const t = (c - a * P[0] - b * P[1]) / (a * (Q[0] - P[0]) + b * (Q[1] - P[1])); out.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]); }
    } return out;
  }
  const GEO = {};
  function mapGeom(seed) {
    if (GEO[seed]) return GEO[seed];
    for (let salt = 0; salt < 20; salt++) { const g = buildGeom(seed, salt); if (g) return (GEO[seed] = g); }
    return (GEO[seed] = buildGeom(seed, 99, true));
  }
  function buildGeom(seed, salt, force) {
    const r = prngOf(hashStr('board' + seed + ':' + salt));
    const W = 360, H = 460, n = 17;
    const coast = [], K = 110, ph = [r() * 6, r() * 6, r() * 6];
    for (let i = 0; i < K; i++) { const a = i / K * Math.PI * 2; const rad = 1 + 0.08 * Math.sin(a * 3 + ph[0]) + 0.05 * Math.sin(a * 5 + ph[1]) + 0.03 * Math.sin(a * 11 + ph[2]); coast.push([W / 2 + Math.cos(a) * W * 0.45 * rad, H / 2 + Math.sin(a) * H * 0.44 * rad]); }
    const sites = []; let tries = 0;
    while (sites.length < n && tries++ < 4000) {
      const p = [W * 0.08 + r() * W * 0.84, H * 0.06 + r() * H * 0.88];
      const ex = (p[0] - W / 2) / (W * 0.39), ey = (p[1] - H / 2) / (H * 0.38);
      if (ex * ex + ey * ey > 1) continue;
      if (sites.every(q => Math.hypot(p[0] - q[0], p[1] - q[1]) > 62)) sites.push(p);
    }
    const cells = sites.map((st, i) => {
      let poly = coast.slice();
      sites.forEach((o, j) => { if (j === i) return; const a = o[0] - st[0], b = o[1] - st[1], c = (o[0] * o[0] + o[1] * o[1] - st[0] * st[0] - st[1] * st[1]) / 2; poly = clipPoly(poly, a, b, c); });
      let cx = 0, cy = 0; poly.forEach(p => { cx += p[0]; cy += p[1]; }); cx /= poly.length || 1; cy /= poly.length || 1;
      return { site: st, c: [cx, cy], poly };
    });
    // voisinage : deux cellules partagent un segment de frontière
    const adj = cells.map(() => []);
    for (let i = 0; i < cells.length; i++) for (let j = i + 1; j < cells.length; j++) {
      let shared = 0;
      for (const p of cells[i].poly) for (const q of cells[j].poly) if (Math.abs(p[0] - q[0]) < 0.6 && Math.abs(p[1] - q[1]) < 0.6) shared++;
      if (shared >= 2) { adj[i].push(j); adj[j].push(i); }
    }
    if (!force) {
      if (cells.length < 15 || cells.some(c => c.poly.length < 3) || adj.some(a => !a.length)) return null;
      const seen = new Set([0]); let fr = [0]; while (fr.length) { const nx = []; for (const i of fr) for (const j of adj[i]) if (!seen.has(j)) { seen.add(j); nx.push(j); } fr = nx; }
      if (seen.size !== cells.length) return null;
    }
    const trees = []; for (let i = 0; i < 90; i++) trees.push([r() * W, r() * H, r()]);
    return { W, H, coast, cells, adj, trees };
  }
  const PLACES = ['Valmont', 'Hautrive', 'Beaurepaire', 'Sombreval', 'Clairefont', 'Rocheblanche', 'Aigremont', 'Ferrières', 'Pierrefonds', 'Montbrun', 'Vaucouleurs', 'Grandpré', 'Belleforêt', 'Saint-Aubin', 'Malestroit', 'Châteaufort', 'Corbény', 'Lormont', 'Brunehaut', 'Morteau', 'Vieilleville', 'Hautecombe', 'Froidmont', 'Mirebeau', 'Gerberoy'];
  const TITLES = ['Comté', 'Baronnie', 'Vicomté', 'Seigneurie', 'Châtellenie', 'Marche'];
  function initRegions(s) {
    const g = mapGeom(s.seed), n = g.cells.length;
    const cx = g.W / 2, cy = g.H / 2;
    let cap = 0, best = 1e9; g.cells.forEach((c, i) => { const d = Math.hypot(c.c[0] - cx, c.c[1] - cy * 1.15); if (d < best) { best = d; cap = i; } });
    const bfs = (start, k, taken) => { const out = [start], seen = new Set([start, ...taken]); let fr = [start]; while (out.length < k && fr.length) { const nx = []; for (const i of fr) for (const j of g.adj[i]) if (!seen.has(j) && out.length < k) { seen.add(j); out.push(j); nx.push(j); } fr = nx; } return out; };
    const mine = bfs(cap, s.P.startDomains, []);
    const fars = g.cells.map((c, i) => [i, Math.hypot(c.c[0] - g.cells[cap].c[0], c.c[1] - g.cells[cap].c[1])]).filter(x => !mine.includes(x[0])).sort((a, b) => b[1] - a[1]);
    let riv = [];
    for (const [f] of fars) { const t = bfs(f, 4, mine); if (t.length > riv.length) riv = t; if (riv.length >= 4) break; }
    const names = PLACES.slice(); for (let i = names.length - 1; i > 0; i--) { const j = Math.floor(rand(s) * (i + 1)); [names[i], names[j]] = [names[j], names[i]]; }
    const lords = HOUSES.filter(h => h !== s.house && h !== s.rival);
    s.regions = g.cells.map((c, i) => {
      const owner = mine.includes(i) ? 'me' : riv.includes(i) ? 'rival' : pick(s, lords);
      const wealth = i === cap ? 4 : ri(s, 2, 4);
      const terrain = pick(s, ['plaine', 'plaine', 'forêt', 'collines', 'marais']);
      const base = owner === 'rival' ? s.P.rivalDef : s.P.neutralDef;
      return { i, name: i === cap ? (s.seat || names[i]) : `${pick(s, TITLES)} de ${names[i % names.length]}`, owner, wealth, terrain, def: base + wealth * 4 + (terrain === 'collines' ? 8 : terrain === 'marais' ? 5 : 0) + ri(s, -4, 6), builds: 0, cap: i === cap };
    });
    s.capital = cap;
    syncDomains(s);
  }
  function syncDomains(s) { s.domains = s.regions.filter(r => r.owner === 'me').length; }
  function myRegions(s) { return s.regions.filter(r => r.owner === 'me'); }
  function borderTargets(s) { const g = mapGeom(s.seed); const set = new Set(); for (const r of myRegions(s)) for (const j of g.adj[r.i]) if (s.regions[j].owner !== 'me') set.add(j); return [...set].map(j => s.regions[j]); }
  function regionEnemy(s, reg) { const P = s.P; return reg.def * (1 + (s.year - P.startYear) * P.campGrowth / 30) + s.domains * P.campDomain; }
  // ---------- Tactiques de bataille ----------
  const STANCES = {
    retranche: { n: 'se retranche derrière ses murs', s: 'Retranchée' },
    sortie: { n: 'prépare une sortie en rase campagne', s: 'Sortie' },
    embuscade: { n: 'tend des embuscades dans les bois et les gués', s: 'Embuscades' },
  };
  const TACTICS = {
    assaut: { n: 'Assaut', d: 'Brise une sortie ; se heurte aux murs. Pertes lourdes.', m: { retranche: 0.8, sortie: 1.2, embuscade: 1 }, loss: 1.35 },
    siege: { n: 'Siège', d: 'Affame les murs ; vulnérable aux sorties. −10 or, pertes légères.', m: { retranche: 1.25, sortie: 0.85, embuscade: 1 }, loss: 0.6 },
    ruse: { n: 'Ruse', d: 'Déjoue les embuscades ; vaut ce que vaut l\'esprit du chef.', m: { retranche: 1, sortie: 0.95, embuscade: 1.25 }, loss: 1 },
  };
  function stanceOf(s, reg) {
    const w = { retranche: 3, sortie: 2, embuscade: 2 };
    if (reg.terrain === 'collines') w.retranche += 3; if (reg.terrain === 'forêt' || reg.terrain === 'marais') w.embuscade += 3; if (reg.terrain === 'plaine') w.sortie += 2;
    if (reg.owner === 'rival' && s.rivalLord) { const T = s.rivalLord.traits; if (T.includes('brave') || T.includes('cruel')) w.sortie += 3; if (T.includes('sage') || T.includes('genie')) w.embuscade += 3; if (T.includes('couard')) w.retranche += 4; }
    else if (reg.owner !== 'me' && reg.owner !== 'rival') { const m = houseOf(s, reg.owner).mood; if (m === 'belliqueuse') w.sortie += 3; else if (m === 'rusee') w.embuscade += 3; else w.retranche += 2; }
    const tot = w.retranche + w.sortie + w.embuscade; let x = (hashStr(s.seed + ':' + reg.i + ':' + s.turn) % 1000) / 1000 * tot;
    for (const k of ['retranche', 'sortie', 'embuscade']) { if (x < w[k]) return k; x -= w[k]; }
    return 'retranche';
  }
  function scoutReport(s, reg) {
    const st = stanceOf(s, reg), sure = (hashStr('sc' + s.seed + reg.i + s.turn) % 100) < 75 + seatSkillAt(s, 'marechal') * 4;
    if (sure) return st;
    const o = ['retranche', 'sortie', 'embuscade'].filter(k => k !== st); return o[hashStr('w' + s.seed + reg.i + s.turn) % 2];
  }
  function seatSkillAt(s, seat) { const id = s.council && s.council[seat]; const p = id != null && s.people[id]; return p && p.alive ? seatSkill(s, seat, p) : 0; }
  function ruseBonus(s) { const r = ruler(s), T = r.traits; let b = 0; if (T.includes('genie')) b += 0.2; if (T.includes('sage')) b += 0.12; if (T.includes('simplet')) b -= 0.2; if (T.includes('cruel')) b += 0.04; return b + Math.max(0, seatSkillAt(s, 'marechal')) * 0.02; }
  function tacticMult(s, tactic, stance) { const T = TACTICS[tactic]; if (!T) return 1; return T.m[stance] * (tactic === 'ruse' ? 1 + ruseBonus(s) : 1); }
  function campaignOdds(s, idx, tactic, stance) {
    const reg = s.regions[idx]; if (!reg) return 0;
    const ours = (s.army * milPower(s) + s.alliances * 3) * (tactic ? tacticMult(s, tactic, stance || scoutReport(s, reg)) : 1), en = regionEnemy(s, reg);
    let w = 0, N = 0; for (let a = 0; a < 12; a++) for (let b = 0; b < 12; b++) { N++; if (ours * (0.7 + (a + 0.5) / 12 * 0.6) * (s.omen ? 1.3 : 1) > en * (0.7 + (b + 0.5) / 12 * 0.6)) w++; }
    return w / N;
  }
  // ---------- Maisons voisines ----------
  const MOODS = {
    belliqueuse: { n: 'Belliqueuse', d: 'Prompte à tirer l\'épée, elle oublie vite les présents.', gift: 0.7, drift: -1 },
    marchande: { n: 'Marchande', d: 'Elle aime l\'or plus que la gloire : les présents la touchent.', gift: 1.5, drift: 0 },
    pieuse: { n: 'Pieuse', d: 'Elle respecte les princes de grand prestige.', gift: 1, drift: 0 },
    rusee: { n: 'Rusée', d: 'Imprévisible : amie un jour, ennemie le lendemain.', gift: 1, drift: 0 },
  };
  function houseOf(s, h) {
    s.houses = s.houses || {};
    if (!s.houses[h]) { const k = Object.keys(MOODS)[hashStr(s.seed + h) % 4]; s.houses[h] = { mood: k, rel: (hashStr(h + s.seed + 'r') % 31) - 10 }; }
    return s.houses[h];
  }
  function neighborHouses(s) { return [...new Set(s.regions.map(r => r.owner).filter(o => o !== 'me' && o !== 'rival'))]; }
  function relation(s, h, d) { const H = houseOf(s, h); H.rel = clamp(Math.round(H.rel + d), -100, 100); return H.rel; }
  function relLabel(v) { return v >= 60 ? 'Amie fidèle' : v >= 25 ? 'Bienveillante' : v > -25 ? 'Neutre' : v > -60 ? 'Méfiante' : 'Hostile'; }
  function giftCost(s) { return 12; }
  function sendGift(s, h) {
    if (s.giftTurn === s.turn || s.gold < giftCost(s)) return false;
    const H = houseOf(s, h); s.gold -= giftCost(s); s.giftTurn = s.turn;
    const gain = Math.round(18 * MOODS[H.mood].gift + (H.mood === 'pieuse' ? s.prestige / 20 : 0) + (H.mood === 'rusee' ? ri(s, -8, 8) : 0));
    relation(s, h, gain);
    log(s, `Vos présents parviennent à la maison ${h.replace(/^d(e |')/, '')} : ${gain > 20 ? 'on vous remercie chaleureusement' : 'on les accepte poliment'}.`);
    return gain;
  }
  function housesTick(s) {
    const g = mapGeom(s.seed), mine = new Set(myRegions(s).map(r => r.i));
    for (const h of neighborHouses(s)) {
      const H = houseOf(s, h), border = s.regions.some(r => r.owner === h && g.adj[r.i].some(j => mine.has(j)));
      H.rel += H.rel > 0 ? -1 : H.rel < 0 ? 1 : 0;
      if (border) H.rel += MOODS[H.mood].drift;
      if (H.mood === 'rusee' && rand(s) < 0.1) H.rel += ri(s, -15, 15);
      H.rel = clamp(H.rel, -100, 100);
    }
  }
  function vassalCost(s, i) { const r = s.regions[i]; return Math.round(s.P.vassBase + r.def * 0.8 + r.wealth * 4); }
  function vassalOdds(s, i) { const r = s.regions[i]; if (!r || r.owner === 'me' || r.owner === 'rival') return 0; return clamp(0.2 + (s.prestige - r.def) / 90 + houseOf(s, r.owner).rel / 250 + s.alliances * 0.05 + tsum(ruler(s), 'feast') * 0.02, 0.05, 0.85) * eff(s, 'vassaliser'); }
  function rivalCount(s) { return s.regions.filter(r => r.owner === 'rival').length; }
  function gainRegion(s, idx) {
    const t = idx != null ? s.regions[idx] : borderTargets(s).filter(r => r.owner !== 'rival').sort((a, b) => a.def - b.def)[0] || borderTargets(s)[0];
    if (!t) { s.domains++; return null; }
    const wasRival = t.owner === 'rival'; t.prev = t.owner; t.owner = 'me'; t.won = s.year; syncDomains(s);
    if (wasRival) { s.stats.rivalTaken = (s.stats.rivalTaken || 0) + 1; s.menace = Math.max(0, s.menace - 15); if (!s.regions.some(r => r.owner === 'rival')) { s.rivalDown = true; s.prestige += 30; s.menace = Math.max(0, s.menace - 30); log(s, `La maison ${s.rival} a perdu sa dernière terre. Elle n'est plus qu'un nom dans les chroniques.`, 'big'); (s.flashes = s.flashes || []).push({ type: 'rivalDown' }); } }
    return t;
  }
  function loseRegion(s, toWhom) {
    const g = mapGeom(s.seed), mine = myRegions(s);
    if (mine.length <= 1) { s.domains = 0; return mine[0] || null; }
    const exposed = mine.filter(r => !r.cap && g.adj[r.i].some(j => s.regions[j].owner === (toWhom || 'rival')));
    const pool = exposed.length ? exposed : mine.filter(r => !r.cap);
    const t = pool.sort((a, b) => a.wealth - b.wealth)[0];
    t.prev = 'me'; t.owner = toWhom || (s.rivalDown ? pick(s, HOUSES.filter(h => h !== s.house)) : 'rival'); t.lost = s.year; syncDomains(s);
    return t;
  }

  // ---------- Actions ----------
  const BUILDINGS = {
    moulin: { n: 'Moulin banal', ic: 'recolte', fx: '+1 or/tour en plus, +3 stabilité', desc: 'Le grain moulu au seigneur : des revenus sûrs et des paysans contents.' },
    marche: { n: 'Halle marchande', ic: 'marchand', fx: '+3 or/tour en plus', desc: 'Foires et péages enrichissent le trésor.' },
    abbaye: { n: 'Abbaye', ic: 'eglise', fx: '+1 prestige/tour, +3 prestige', desc: 'Les moines prient pour votre lignée et écrivent son histoire.' },
    donjon: { n: 'Donjon de pierre', ic: 'construire', fx: 'Défense +6 contre les invasions, +12 garnison', desc: 'Une tour imprenable au cœur du domaine.' },
    lices: { n: 'Lices et écuries', ic: 'tournoi', fx: '+2 soldats/tour', desc: 'Chevaliers et sergents s\'y entraînent sans relâche.' },
    universite: { n: 'Collège de maîtres', ic: 'eduquer', era: 1, fx: '+1 prestige/tour, l\'héritier peut devenir sage', desc: 'Les clercs y enseignent le droit et les arts.' },
    hopital: { n: 'Hôtel-Dieu', ic: 'fiole', era: 2, fx: '+1 stabilité/tour, épidémies moins meurtrières', desc: 'Les sœurs y soignent les pauvres et les pestiférés.' },
  };
  function buildTypes(s) { return Object.keys(BUILDINGS).filter(k => !BUILDINGS[k].era || eraOf(s) >= BUILDINGS[k].era); }
  function edif(s, k) { return (s.edif && s.edif[k]) || 0; }
  function bcost(s) { return Math.round((s.P.buildCost + s.builds * s.P.buildStep) * (eraOf(s) === 1 ? 0.8 : 1)); }
  function unmarriedAdults(s) {
    return livingDyn(s).filter(p => !p.spouse && age(s, p) >= 16 && age(s, p) <= 60);
  }
  function eff(s, id) { return 1 / (1 + (s.fat[id] || 0) * s.P.fatigue); }
  function getActions(s) {
    const P = s.P, r = ruler(s), h = heir(s), rAge = age(s, r), era = eraOf(s);
    const a = [];
    const fst = Math.round((P.feastStab + tsum(r, 'feast')) * eff(s, 'festin'));
    a.push({ id: 'festin', g: 'gouv', label: 'Grand festin', desc: `−${P.feastCost} or, +${fst} stabilité, +${Math.round(P.feastPrest * eff(s, 'festin'))} prestige`, ok: s.gold >= P.feastCost, eff: eff(s, 'festin') });
    a.push({ id: 'construire', g: 'gouv', label: 'Bâtir', desc: `−${bcost(s)} or, +${P.incPerBuild} or/tour, +prestige`, ok: s.gold >= bcost(s) });
    if (era >= 1) a.push({ id: 'pelerinage', g: 'gouv', label: 'Pèlerinage', desc: `−${P.pilgCost} or, +${Math.round(8 * eff(s, 'pelerinage'))} prestige, +3 stabilité, 5 % de risque`, ok: s.gold >= P.pilgCost && rAge >= 16, eff: eff(s, 'pelerinage'), era: 1 });
    a.push({ id: 'recruter', g: 'guerre', label: 'Recruter', desc: `−${P.recruitCost} or, +${Math.round(P.recruitArmy * eff(s, 'recruter'))} soldats`, ok: s.gold >= P.recruitCost, eff: eff(s, 'recruter') });
    a.push({ id: 'campagne', g: 'guerre', label: 'Partir en campagne', desc: `Touchez une terre voisine sur la carte, armée ≥ ${P.campMin}`, ok: s.army >= P.campMin && rAge >= 16 && borderTargets(s).length > 0 });
    a.push({ id: 'ambassade', g: 'guerre', label: 'Ambassade', desc: `−${P.envoyCost} or, −${Math.round(P.envoyMenace * eff(s, 'ambassade'))} menace${s.alliances < P.maxAlliances ? ', chance d\'alliance' : ''}`, ok: s.gold >= P.envoyCost, eff: eff(s, 'ambassade') });
    a.push({ id: 'intrigue', g: 'guerre', label: 'Intriguer', desc: `−${P.intrigueCost} or ; 55 % : −25 menace, garnisons rivales affaiblies, parfois une terre retournée ; 20 % : scandale`, ok: s.gold >= P.intrigueCost, eff: eff(s, 'intrigue') });
    { const vt = borderTargets(s).filter(r => r.owner !== 'rival'); const cheapest = vt.length ? Math.min(...vt.map(r => vassalCost(s, r.i))) : 0;
      a.push({ id: 'vassaliser', g: 'guerre', label: 'Vassaliser un seigneur', desc: vt.length ? `Sans combat : touchez une terre voisine, dès ${cheapest} or` : 'Aucun seigneur voisin', ok: vt.length > 0 && s.gold >= cheapest, eff: eff(s, 'vassaliser') }); }
    if (era >= 2) a.push({ id: 'mercenaires', g: 'guerre', label: 'Engager des mercenaires', desc: `−${P.mercCost} or, +${P.mercArmy} soldats, −3 stabilité`, ok: s.gold >= P.mercCost, era: 2 });
    a.push({ id: 'marier', g: 'famille', label: 'Arranger un mariage', desc: unmarriedAdults(s).length ? `${unmarriedAdults(s).length} célibataire${unmarriedAdults(s).length > 1 ? 's' : ''} à marier` : 'Personne à marier', ok: unmarriedAdults(s).length > 0 });
    a.push({ id: 'eduquer', g: 'famille', label: 'Éduquer l\'héritier', desc: h ? `−${P.eduCost} or, une qualité pour ${h.name}` : 'Aucun héritier', ok: !!h && s.gold >= P.eduCost });
    const noLine = successionLine(s).length === 0;
    a.push({ id: 'adopter', g: 'famille', label: 'Adopter un pupille', desc: noLine ? `−${P.adoptCost} or, −10 prestige, un héritier de secours` : 'Réservé aux lignées sans héritier', ok: noLine && s.gold >= P.adoptCost });
    a.push({ id: 'attendre', g: 'temps', label: 'Laisser passer trois années', desc: 'Gouverner selon vos politiques, sans entreprise particulière', ok: true });
    return a;
  }
  // ---------- Marché matrimonial ----------
  const RANKS = {
    prince: { n: 'Prince', nf: 'Princesse', gold: -15, prest: 8, stab: 0, alliance: 1, menace: -10, loy: 10, leaves: true, traits: 2 },
    noble: { n: 'Seigneur', nf: 'Dame', gold: -5, prest: 4, stab: 3, alliance: 0, menace: -6, loy: 6, leaves: true, traits: 1 },
    vassal: { n: 'Fils de vassal', nf: 'Fille de vassal', gold: 0, prest: 0, stab: 5, alliance: 0, menace: 0, loy: -3, leaves: false, traits: 1 },
    marchand: { n: 'Fils de marchand', nf: 'Fille de marchand', gold: 40, prest: -6, stab: -2, alliance: 0, menace: 0, loy: -10, leaves: false, traits: 1 },
    rival: { n: 'Prince', nf: 'Princesse', gold: -10, prest: 2, stab: -4, alliance: 0, menace: -35, loy: -5, leaves: true, traits: 1 },
  };
  function candAge(s, p) { return p.sex === 'M' ? clamp(age(s, p) - ri(s, 0, 10), 16, 30) : clamp(age(s, p) + ri(s, -5, 8), 16, 55); }
  function makeCandidate(s, p, rank, house) {
    const R = RANKS[rank], sex = p.sex === 'M' ? 'F' : 'M';
    const c = { sex, name: pick(s, sex === 'M' ? NAMES_M : NAMES_F), born: s.year - candAge(s, p), rank, traits: [], face: 'c' + s.nextId + '-' + ri(s, 0, 1e6),
      temper: pick(s, Object.keys(TEMPERS)), passion: pick(s, PASSIONS), mark: pick(s, MARKS) };
    if (rank === 'vassal') { c.from = 'vassal'; c.place = pick(s, TOWNS); }
    else if (rank === 'marchand') { c.from = 'marchand'; c.place = pick(s, TOWNS); c.trade = pick(s, ['drapier', 'changeur', 'marchand de sel', 'armateur', 'orfèvre', 'marchand d\'épices']); }
    else { c.from = house; c.place = SEATS[house]; }
    let n = 0; while (c.traits.length < R.traits && n++ < 10) { const t = weighted(s, BIRTH_TRAITS); if (!c.traits.includes(t) && !c.traits.includes(OPPOSED[t])) c.traits.push(t); }
    c.req = rank === 'prince' ? ri(s, 3, 6) * 10 : rank === 'rival' ? 20 : rank === 'noble' ? 10 : 0;
    return c;
  }
  function marriageMarket(s, p) {
    s.market = s.market || {};
    const m = s.market[p.id];
    if (m && m.y === s.year) return m.list;
    const others = HOUSES.filter(h => h !== s.house && h !== s.rival);
    const list = [];
    const used = new Set();
    const ph = () => { let h; let n = 0; do { h = pick(s, others); } while (used.has(h) && n++ < 10); used.add(h); return h; };
    list.push(makeCandidate(s, p, 'prince', ph()), makeCandidate(s, p, 'prince', ph()));
    list.push(makeCandidate(s, p, 'noble', ph()), makeCandidate(s, p, 'noble', ph()));
    list.push(makeCandidate(s, p, 'vassal'), makeCandidate(s, p, 'vassal'));
    list.push(makeCandidate(s, p, 'marchand'));
    if (s.menace >= 30 || rand(s) < 0.4) list.push(makeCandidate(s, p, 'rival', s.rival));
    s.market[p.id] = { y: s.year, list };
    return list;
  }
  function willLeave(s, p, c) { const h = heir(s); return RANKS[c.rank].leaves && p.sex === 'F' && p.id !== s.rulerId && !(h && h.id === p.id); }
  function candidateFx(s, p, c) {
    const R = RANKS[c.rank], e = c.rank === 'vassal' ? eff(s, 'marier') : 1;
    return { gold: R.gold, prest: R.prest, stab: Math.round(R.stab * e), alliance: R.alliance && s.alliances < s.P.maxAlliances ? 1 : 0, menace: R.menace, ok: s.prestige >= c.req && s.gold + Math.min(0, R.gold) >= 0, leaves: willLeave(s, p, c) };
  }
  function marryCandidate(s, p, idx) {
    const list = marriageMarket(s, p), c = list[idx];
    if (!c) return;
    const f = candidateFx(s, p, c);
    if (!f.ok) { log(s, `La famille de ${c.name} refuse : votre maison n'a pas assez de prestige.`, 'bad'); return; }
    s.gold += f.gold; s.prestige += f.prest + (c.rank === 'prince' && tsum(ruler(s), 'feast') > 0 ? 3 : 0); s.stab += f.stab; s.alliances += f.alliance; s.menace = Math.max(0, s.menace + f.menace);
    loyalty(s, p, RANKS[c.rank].loy);
    s.stats.marriages = (s.stats.marriages || 0) + 1;
    s.stats['m_' + c.rank] = (s.stats['m_' + c.rank] || 0) + 1;
    const who = c.rank === 'marchand' ? `${c.name}, ${c.sex === 'F' ? 'fille' : 'fils'} d'un riche ${c.trade} de ${c.place}` : c.rank === 'vassal' ? `${c.name}, ${c.sex === 'F' ? 'fille' : 'fils'} d'un vassal de ${c.place}` : `${c.name} ${c.from}`;
    if (f.leaves) {
      p.inDyn = false; p.leftAt = s.year; p.husband = `${c.name} ${c.from}`;
      bio(s, p, `Épouse ${c.name} ${c.from} et quitte la cour pour ${c.place}.`);
      log(s, `${p.name} épouse ${who} et part pour ${c.place}.${c.rank === 'rival' ? ` La paix est scellée avec la maison ${s.rival}.` : ''}`, 'good');
    } else {
      const sp = newPerson(s, Object.assign({ inDyn: false }, c, { traits: c.traits.slice() }));
      p.spouse = sp.id; sp.spouse = p.id;
      bio(s, sp, `Naît à ${sp.place}.`); bio(s, sp, `Épouse ${p.title || p.name}.`); bio(s, p, `Épouse ${who}.`);
      log(s, `${p.name} épouse ${who}.${c.rank === 'rival' ? ` La paix est scellée avec la maison ${s.rival}.` : c.rank === 'marchand' ? ' Les barons ricanent, le trésor sourit.' : ''}`, 'good');
    }
    s.market[p.id] = null;
  }

  // Options de mariage pour une personne
  function marriageOptions(s, p) {
    const P = s.P, isRuler = p.id === s.rulerId;
    const leaves = p.sex === 'F' && !isRuler && heir(s) && heir(s).id !== p.id;
    return [
      { id: 'alliance', label: 'Alliance princière', desc: `−20 or, +prestige, +1 alliance${leaves ? ' (elle quitte la maison)' : ''}`, ok: s.gold >= 20 },
      { id: 'local', label: 'Mariage avec un vassal', desc: `−5 or, +${Math.round(4 * eff(s, 'marier'))} stabilité, le conjoint rejoint la cour`, ok: s.gold >= 5 },
    ];
  }

  function doAction(s, id, arg, arg2) {
    const P = s.P, r = ruler(s);
    s.lastAction = id;
    const e = eff(s, id);
    s.fat[id] = (s.fat[id] || 0) + 1;
    switch (id) {
      case 'impots': {
        const g = Math.round((P.taxGain + tsum(r, 'tax')) * e);
        s.gold += g; s.stab -= Math.round(P.taxStab * (2 - e)); log(s, e < 0.9 ? `Les collecteurs repassent : ${g} pièces d'or seulement, et le peuple gronde.` : `Les collecteurs ramènent ${g} pièces d'or. Le peuple grogne.`); break;
      }
      case 'festin': {
        s.gold -= P.feastCost; const st = Math.round((P.feastStab + tsum(r, 'feast')) * e); s.stab += st; s.prestige += Math.round(P.feastPrest * e);
        for (const q of livingDyn(s)) loyalty(s, q, 3);
        log(s, e < 0.9 ? `Encore un festin… les vassaux s'en lassent (+${st} stabilité).` : `Un festin somptueux réunit les vassaux (+${st} stabilité).`); break;
      }
      case 'recruter': { const n = Math.round(P.recruitArmy * e); s.gold -= P.recruitCost; s.army += n; log(s, `${n} hommes d'armes rejoignent l'ost.`); break; }
      case 'mercenaires': s.gold -= P.mercCost; s.army += P.mercArmy; s.stab -= 3; log(s, `Une grande compagnie de ${P.mercArmy * 10} lances passe à votre solde. Les campagnes tremblent.`); break;
      case 'pelerinage': {
        s.gold -= P.pilgCost; s.prestige += Math.round(8 * e); s.stab += 3;
        log(s, `${fullName(s, r)} part en pèlerinage vers ${pick(s, ['Saint-Jacques-de-Compostelle', 'Rome', 'Vézelay', 'Rocamadour', 'Cantorbéry'])}.`);
        if (rand(s) < 0.05) kill(s, r, 'mort sur les chemins'); break;
      }
      case 'construire': {
        s.gold -= bcost(s); s.builds++; s.prestige += P.buildPrest;
        { const mine = myRegions(s); const rg = arg != null && s.regions[arg] && s.regions[arg].owner === 'me' ? s.regions[arg] : mine.slice().sort((a, b) => a.builds - b.builds)[0]; if (rg) rg.builds++; }
        const types = buildTypes(s), k = types.includes(arg2) ? arg2 : pick(s, types), Bt = BUILDINGS[k];
        s.edif = s.edif || {}; s.edif[k] = (s.edif[k] || 0) + 1;
        if (k === 'moulin') s.stab += 3;
        if (k === 'abbaye') s.prestige += 3;
        if (k === 'donjon') { const rg = arg != null && s.regions[arg] ? s.regions[arg] : myRegions(s).find(x => x.cap) || myRegions(s)[0]; if (rg) rg.def = (rg.def || 0) + 12; }
        if (k === 'universite') { const h = heir(s); if (h && rand(s) < 0.5 && addTrait(h, 'sage')) log(s, `${h.name} suit les leçons des maîtres et devient sage.`, 'good'); }
        log(s, `${fullName(s, r)} fait bâtir ${({ moulin: 'un moulin banal', marche: 'une halle marchande', abbaye: 'une abbaye', donjon: 'un donjon de pierre', lices: 'des lices et des écuries', universite: 'un collège de maîtres', hopital: 'un hôtel-Dieu' })[k]}.`); break;
      }
      case 'ambassade': {
        s.gold -= P.envoyCost; s.menace = Math.max(0, s.menace - Math.round(P.envoyMenace * e));
        if (s.alliances < P.maxAlliances && rand(s) < 0.25 * e) { s.alliances++; log(s, `Vos émissaires reviennent avec un traité d'alliance de la maison ${pick(s, HOUSES.filter(h => h !== s.house && h !== s.rival))}.`, 'good'); }
        else log(s, `Des émissaires apaisent la maison ${s.rival}.`); break;
      }
      case 'eduquer': {
        s.gold -= P.eduCost; const h = heir(s);
        const E = EDU_PATHS[arg];
        if (E) {
          const tut = E.tutor && s.council && s.council[E.tutor] != null ? s.people[s.council[E.tutor]] : null;
          if (h.traits.includes(E.fix) && rand(s) < 0.6) { h.traits = h.traits.filter(t => t !== E.fix); log(s, `${E.n} corrigent ${h.name} : ${h.sex === 'F' ? 'elle' : 'il'} n'est plus ${TRAITS[E.fix].n.toLowerCase()}.`, 'good'); }
          else if (rand(s) < eduChance(s, arg)) {
            const opts = E.good.filter(t => canHave(h, t) && !h.traits.includes(t));
            if (opts.length && h.traits.length < 4) { const t = opts.length > 1 && E.gw && rand(s) < (E.gw[opts[1]] || 0) ? opts[1] : opts[0]; addTrait(h, t); loyalty(s, h, 5); if (tut) loyalty(s, tut, 3); bio(s, h, `${tut ? tut.name + ' lui enseigne ' + E.n.toLowerCase() : 'Étudie ' + E.n.toLowerCase()} : devient ${TRAITS[t].n.toLowerCase()}.`); log(s, `${h.name} devient ${TRAITS[t].n.toLowerCase()} grâce à ${tut ? 'son précepteur ' + tut.name : 'ses maîtres'}.`, 'good'); }
            else log(s, `${h.name} a déjà tout appris de ${E.n.toLowerCase()}.`);
          } else log(s, `${E.n} n'inspirent guère ${h.name}.`);
          break;
        }
        const fix = h.traits.find(t => EDU_FIX.includes(t));
        if (fix && rand(s) < 0.5) { h.traits = h.traits.filter(t => t !== fix); log(s, `Les précepteurs corrigent le défaut de ${h.name} (${TRAITS[fix].n}).`, 'good'); }
        else if (rand(s) < (s.univ ? 0.8 : 0.55)) {
          const opts = EDU_GOOD.filter(t => canHave(h, t));
          if (opts.length && h.traits.length < 4) { const t = pick(s, opts); addTrait(h, t); loyalty(s, h, 5); bio(s, h, `Ses maîtres le rendent ${TRAITS[t].n.toLowerCase()}.`); log(s, `${h.name} devient ${TRAITS[t].n.toLowerCase()} grâce à ses maîtres.`, 'good'); }
          else log(s, `${h.name} n'a plus rien à apprendre.`);
        } else log(s, `L'éducation de ${h.name} ne porte pas ses fruits.`);
        break;
      }
      case 'campagne': campaign(s, arg, arg2); break;
      case 'attendre': break;
      case 'vassaliser': {
        const t = arg != null && s.regions[arg] && s.regions[arg].owner !== 'me' && s.regions[arg].owner !== 'rival' && borderTargets(s).includes(s.regions[arg]) ? s.regions[arg] : borderTargets(s).filter(r => r.owner !== 'rival').sort((a, b) => vassalCost(s, a.i) - vassalCost(s, b.i))[0];
        if (!t) break;
        s.fat.vassaliser -= 1; const odds = vassalOdds(s, t.i); s.fat.vassaliser += 1;
        const cost = vassalCost(s, t.i), lord = t.owner; s.gold -= cost;
        if (rand(s) < odds) { gainRegion(s, t.i); relation(s, lord, 10); s.prestige += 4; s.stats.vassals = (s.stats.vassals || 0) + 1; log(s, `Le seigneur ${lord.replace(/^d(e |')/, '')} prête hommage : ${t.name} rejoint votre maison sans qu'une goutte de sang soit versée.`, 'good'); (s.flashes = s.flashes || []).push({ type: 'vassal', won: true, region: t.i, lord, cost }); }
        else { s.prestige -= 3; t.def += 3; log(s, `Le seigneur ${lord.replace(/^d(e |')/, '')} empoche vos présents et refuse l'hommage.`, 'bad'); (s.flashes = s.flashes || []).push({ type: 'vassal', won: false, region: t.i, lord, cost }); }
        break;
      }
      case 'intrigue': {
        s.gold -= P.intrigueCost; const x = rand(s);
        if (x < 0.55 * (0.5 + e / 2)) {
          s.menace = Math.max(0, s.menace - 25); s.prestige += 3;
          for (const rg of s.regions) if (rg.owner === 'rival') rg.def = Math.max(6, rg.def - 6);
          const g = mapGeom(s.seed), turnable = s.regions.filter(rg => rg.owner === 'rival' && g.adj[rg.i].some(j => s.regions[j].owner === 'me'));
          if (turnable.length && rand(s) < 0.22) { const t = pick(s, turnable); gainRegion(s, t.i); log(s, `Vos agents soulèvent ${t.name} : la garnison ouvre ses portes et la terre passe à votre maison !`, 'good'); }
          else log(s, `Vos agents sèment la discorde chez les ${s.rival} : garnisons affaiblies, plans d'invasion ruinés.`, 'good');
        }
        else if (x > 0.8) { s.prestige -= 8; s.menace += 15; log(s, `Vos espions sont pris chez les ${s.rival}. Le scandale fait le tour des cours.`, 'bad'); }
        else log(s, `Vos agents rentrent bredouilles de chez les ${s.rival}.`);
        break;
      }
      case 'adopter': {
        s.gold -= P.adoptCost; s.prestige -= 10;
        const k = newPerson(s, { sex: rand(s) < 0.6 ? 'M' : 'F', born: s.year - ri(s, 8, 15), parent: r.id, adopted: true });
        randomTraits(s, k, 1);
        log(s, `${fullName(s, r)} adopte ${k.name}, jeune pupille de la cour, et en fait son héritier.`, 'good'); break;
      }
      case 'marier': s.fat.marier -= 1; if (typeof arg2 === 'number') marryCandidate(s, s.people[arg], arg2); else marry(s, s.people[arg], arg2 || 'local'); s.fat.marier = (s.fat.marier || 0) + 1; break;
      default: { const st = Math.round(P.justiceStab * e); s.stab += st; s.prestige += 1; log(s, `${fullName(s, r)} tient ses assises et rend la justice (+${st} stabilité).`); }
    }
  }

  // ---------- Le conseil du souverain ----------
  const COUNCIL = {
    chancelier: { n: 'Chancelier', ic: 'dette', role: 'tient le trésor', t: { sage: 2, genie: 3, avare: 2, prodigue: -2, simplet: -2, charismatique: 1 } },
    marechal: { n: 'Maréchal', ic: 'campagne', role: 'commande l\'ost', t: { brave: 2, robuste: 1, cruel: 1, couard: -3, genie: 1, sage: 1, simplet: -1, maladif: -1 } },
    chapelain: { n: 'Chapelain', ic: 'eglise', role: 'veille sur les âmes', t: { pieux: 3, sage: 1, charismatique: 1, cruel: -2, simplet: -1 } },
  };
  function councilOf(s) { s.council = s.council || {}; for (const k in s.council) { const p = s.people[s.council[k]]; if (!p || !p.alive || p.id === s.rulerId) delete s.council[k]; } return s.council; }
  function seatSkill(s, seat, p) {
    if (!p) return 0; const T = COUNCIL[seat].t; let k = 0;
    for (const t of p.traits) k += T[t] || 0;
    if (age(s, p) >= 50) k += 1;
    if (p.loyal != null && p.loyal < 30) k -= 2;
    return clamp(k, -3, 5);
  }
  function councilCandidates(s, seat) {
    const sitting = Object.values(councilOf(s));
    const r = ruler(s), out = [];
    for (const p of Object.values(s.people)) {
      if (!p.alive || p.id === s.rulerId || age(s, p) < 16) continue;
      const kin = p.inDyn || (r.spouse === p.id) || livingDyn(s).some(q => q.spouse === p.id);
      if (!kin) continue;
      out.push({ id: p.id, skill: seatSkill(s, seat, p), busy: sitting.includes(p.id) && s.council[seat] !== p.id });
    }
    return out.sort((a, b) => b.skill - a.skill);
  }
  function appoint(s, seat, id) {
    const c = councilOf(s), old = c[seat];
    if (old === id) return;
    if (old != null) { loyalty(s, s.people[old], -15); s.stab -= 1; }
    for (const k in c) if (c[k] === id) delete c[k];
    if (id == null) { delete c[seat]; return; }
    c[seat] = id; const p = s.people[id]; loyalty(s, p, 8); bio(s, p, `Devient ${COUNCIL[seat].n.toLowerCase()} du royaume.`);
  }
  function councilFx(s, seat) {
    const id = councilOf(s)[seat]; if (id == null) return null;
    const k = seatSkill(s, seat, s.people[id]);
    if (seat === 'chancelier') return { gold: k >= 0 ? Math.ceil(k * 0.7) : k };
    if (seat === 'marechal') return { mil: k };
    if (seat === 'chapelain') return { stab: k >= 2 ? 1 : k < 0 ? -1 : 0, prestige: k >= 3 ? 1 : 0 };
    return null;
  }
  function regencyTick(s) {
    const R = s.regency; if (!R) return;
    const r = ruler(s);
    if (age(s, r) >= 16 || !r) { s.regency = null; log(s, `${r.name} atteint sa majorité et gouverne seul${r.sex === 'F' ? 'e' : ''}. Fin de la régence.`, 'big'); return; }
    if (R.by === 'mere') { s.stab += 1; s.army = Math.round(s.army * 0.98); }
    else if (R.by === 'conseil') { s.gold += 3; s.stab -= 1; }
    else if (R.by === 'oncle') { s.army += 2; const u = s.people[R.id]; if (u && u.alive && rand(s) < (u.loyal < 40 ? 0.09 : 0.03) && !(s.chains || []).some(c => c.id === 'usurpation')) (s.chains = s.chains || []).push({ id: 'usurpation', at: s.turn }); }
  }
  function councilTick(s) {
    const c = councilOf(s);
    const f1 = councilFx(s, 'chancelier'), f3 = councilFx(s, 'chapelain');
    if (f1) s.gold += f1.gold;
    if (f3) { s.stab += f3.stab; s.prestige += f3.prestige; }
    for (const k in c) { const p = s.people[c[k]]; loyalty(s, p, (s.stab >= 45 ? 1 : -2) + (p.temper === 'colerique' ? -2 : 0) + (p.traits.includes('cruel') ? -1 : 0) + (s.pol.cour === 2 ? 2 : s.pol.cour === 0 ? -1 : 0)); }
  }
  function autoCouncil(s) {
    const used = new Set();
    for (const seat of Object.keys(COUNCIL)) {
      const cur = councilOf(s)[seat], best = councilCandidates(s, seat).filter(x => !used.has(x.id) && (x.id === cur || !Object.values(s.council).includes(x.id)))[0];
      const curSkill = cur != null ? seatSkill(s, seat, s.people[cur]) : -99;
      if (best && best.skill >= 0 && best.skill > curSkill + 1) appoint(s, seat, best.id);
      const now = s.council[seat]; if (now != null) used.add(now);
    }
  }
  function milPower(s) {
    const r = ruler(s);
    const m = age(s, r) < 16 ? -1 : tsum(r, 'mil');
    const ms = s.council && s.council.marechal != null && s.people[s.council.marechal] && s.people[s.council.marechal].alive ? seatSkill(s, 'marechal', s.people[s.council.marechal]) : 0;
    return 1 + m / 10 + ms / 30;
  }
  function campaign(s, idx, tactic) {
    const P = s.P, r = ruler(s);
    s.stats.wars++;
    s.stab -= P.campStab;
    const targets = borderTargets(s);
    let reg = idx != null && s.regions[idx] && s.regions[idx].owner !== 'me' && targets.includes(s.regions[idx]) ? s.regions[idx] : null;
    if (!reg) reg = targets.slice().sort((a, b) => campaignOdds(s, b.i) - campaignOdds(s, a.i))[0];
    const stance = stanceOf(s, reg), Tt = TACTICS[tactic] ? tactic : null;
    if (Tt === 'siege') { s.gold -= 10; s.stab -= 1; }
    const tm = Tt ? tacticMult(s, Tt, stance) : 1;
    const enemy = regionEnemy(s, reg) * (0.7 + rand(s) * 0.6);
    const ours = (s.army * milPower(s) * (0.7 + rand(s) * 0.6) * (s.omen ? 1.3 : 1) + s.alliances * 3) * tm; s.omen = false;
    const tgt = reg.owner === 'rival' ? `${reg.name}, terre de la maison ${s.rival}` : `${reg.name}`;
    const a0 = s.army, won = ours > enemy;
    if (reg.owner !== 'rival' && reg.owner !== 'me') { relation(s, reg.owner, -40); for (const h of neighborHouses(s)) if (h !== reg.owner && houseOf(s, h).mood !== 'belliqueuse') relation(s, h, -4); }
    if (won) {
      s.stats.warsWon++; gainRegion(s, reg.i); s.prestige += 14; s.gold += 22; s.army = Math.round(s.army * (1 - 0.14 * (Tt ? TACTICS[Tt].loss : 1)));
      log(s, `Victoire ! ${fullName(s, r)} s'empare de ${tgt}.`, 'good');
    } else {
      s.army = Math.round(s.army * (1 - 0.3 * (Tt ? Math.sqrt(TACTICS[Tt].loss) : 1))); s.stab -= 6; s.prestige -= 4; reg.def += 4;
      log(s, `Défaite devant ${tgt}. L'ost rentre décimé.`, 'bad');
    }
    (s.flashes = s.flashes || []).push({ type: 'battle', kind: 'campagne', won, tgt, region: reg.i, from: s.capital, owner: reg.prev || reg.owner, rival: (reg.prev || reg.owner) === 'rival', loss: a0 - s.army, ours: Math.round(ours), enemy: Math.round(enemy), tactic: Tt, stance });
    if (won) s.lastConquest = s.year;
    const dr = P.campDeath * (r.traits.includes('brave') ? 2 : 1) * (r.traits.includes('couard') ? 0.3 : 1);
    if (rand(s) < dr) kill(s, r, 'tombé au combat');
  }

  function marry(s, p, type, cand) {
    const P = s.P, r = ruler(s);
    const isRuler = p.id === s.rulerId;
    const h = heir(s);
    if (type === 'alliance') {
      s.gold -= 20; s.prestige += 6 + (tsum(r, 'feast') > 0 ? 3 : 0);
      if (s.alliances < P.maxAlliances) s.alliances++;
      s.menace = Math.max(0, s.menace - 10);
      if (p.sex === 'F' && !isRuler && !(h && h.id === p.id)) {
        p.inDyn = false; p.leftAt = s.year; p.alive = true; s.stats.marriages = (s.stats.marriages || 0) + 1;
        log(s, `${p.name} épouse un prince ${pick(s, HOUSES)} et quitte la cour. L'alliance est scellée.`, 'good');
        return;
      }
    } else if (!cand) { s.gold -= 5; s.stab += Math.round(4 * eff(s, 'marier')); }
    s.stats.marriages = (s.stats.marriages || 0) + 1;
    const sp = cand ? newPerson(s, Object.assign({ inDyn: false }, cand, { traits: cand.traits.slice() })) : newPerson(s, { sex: p.sex === 'M' ? 'F' : 'M', born: s.year - (p.sex === 'M' ? clamp(age(s, p) - ri(s, 0, 10), 16, 30) : clamp(age(s, p) + ri(s, -5, 8), 16, 55)), inDyn: false, from: type === 'alliance' ? pick(s, HOUSES) : 'vassal' });
    if (!cand) randomTraits(s, sp, type === 'alliance' ? 2 : 1);
    if (!cand && type === 'alliance' && sp.traits.includes('sterile') && rand(s) < 0.5) sp.traits = sp.traits.filter(t => t !== 'sterile');
    p.spouse = sp.id; sp.spouse = p.id;
    bio(s, p, `Épouse ${sp.name}.`); bio(s, sp, `Épouse ${p.title || p.name}.`);
    log(s, `${p.name} épouse ${sp.name}${type === 'alliance' ? ' ' + sp.from : ', fille d\'un vassal'.replace('fille', sp.sex === 'M' ? 'fils' : 'fille')}.`, 'good');
  }

  // ---------- Mort & succession ----------
  function baseMort(a) {
    const y = a < 5 ? 0.035 : a < 16 ? 0.008 : a < 40 ? 0.012 : a < 55 ? 0.025 : a < 65 ? 0.05 : a < 75 ? 0.1 : 0.2;
    return y;
  }
  function kill(s, p, cause) {
    if (!p.alive) return;
    p.alive = false; p.died = s.year; p.cause = cause; bio(s, p, `Meurt à ${age(s, p)} ans (${cause}).`);
    if (p.spouse) { const sp = s.people[p.spouse]; if (sp) sp.spouse = null; p.widow = p.spouse; }
    if (p.inDyn || p.id === s.rulerId) log(s, `✝ ${fullName(s, p)} meurt à ${age(s, p)} ans (${cause}).`, p.id === s.rulerId ? 'big' : 'bad');
    if (p.id === s.rulerId) { s.pendingSuccession = true; deathEpithet(s, p); }
  }
  function succession(s) {
    s.pendingSuccession = false;
    const P = s.P, old = ruler(s);
    const line = successionLine(s);
    if (!line.length) { endGame(s, false, 'extinction', `Plus aucun héritier : la maison ${s.house} s'éteint avec ${fullName(s, old)}.`); return; }
    const h = s.people[line[0]];
    const direct = h.parent === old.id;
    becomeRuler(s, h);
    for (const q of livingDyn(s)) if (q.id !== h.id && q.parent === h.parent && age(s, q) >= 14) loyalty(s, q, -10);
    (s.flashes = s.flashes || []).push({ type: 'succession', old: old.id, nu: h.id, crisis: h.parent !== old.id, regency: age(s, h) < 16 });
    s.stab -= P.succStab;
    let msg = `👑 ${h.title} monte sur le trône à ${age(s, h)} ans.`;
    if (!direct) { s.stab -= P.crisisStab; s.prestige -= 5; msg += ' Succession contestée : les vassaux murmurent.'; }
    if (age(s, h) < 16) { s.stab -= P.regencyStab; msg += ' Une régence est instaurée.'; s.regency = { by: null, start: s.turn }; (s.chains = s.chains || []).unshift({ id: 'choix_regent', at: s.turn }); }
    log(s, msg, 'big');
  }

  // ---------- Événements ----------
  // Chaque événement : id, w (poids), ew (multiplicateurs par ère), cond(s), text(s), choices[{l, d, f(s)}]
  // year : événement historique, déclenché une fois à partir de cette année
  const ALL = () => true;
  const adultRuler = s => age(s, ruler(s)) >= 16;
  const EVENTS = [
    // ----- Événements historiques -----
    { id: 'albigeois', year: 1209, text: () => 'Le pape prêche la croisade contre les Albigeois. Les terres du Midi sont promises aux barons du Nord qui prendront les armes.',
      choices: [
        { l: 'Prendre part à la croisade', d: '60 % : +1 domaine, +8 prestige ; sinon l\'ost est saigné', f: s => { s.stab -= 4; if (s.army >= 20 && rand(s) < 0.6) { gainRegion(s); s.prestige += 8; s.army = Math.round(s.army * 0.8); return 'Un fief languedocien vous revient.'; } s.army = Math.round(s.army * 0.65); return 'Les sièges s\'éternisent devant Carcassonne et l\'ost rentre décimé.'; } },
        { l: 'Protéger les gens du Midi', d: '−10 prestige, +1 alliance, +4 stabilité', f: s => { s.prestige -= 10; s.alliances = Math.min(s.P.maxAlliances, s.alliances + 1); s.stab += 4; return 'Le comte de Toulouse vous en sera reconnaissant.'; } },
        { l: 'Rester à l\'écart', d: '−3 prestige', f: s => { s.prestige -= 3; return 'Vous laissez d\'autres se partager le Midi.'; } },
      ] },
    { id: 'bouvines', year: 1214, text: () => 'Le roi affronte l\'empereur et ses alliés près de Bouvines. Il convoque ses vassaux à l\'ost.',
      choices: [
        { l: 'Envoyer l\'ost', d: '−30 % d\'armée ; 55 % : +12 prestige et butin', f: s => { s.army = Math.round(s.army * 0.7); if (rand(s) < 0.55) { s.prestige += 12; s.gold += 20; return 'Vos chevaliers chargent au premier rang. Victoire !'; } s.prestige -= 6; return 'Vos bannières ont plié au mauvais moment.'; } },
        { l: 'Payer l\'écuage', d: '−15 or, +4 prestige', f: s => { s.gold -= 15; s.prestige += 4; return 'L\'or remplace les lances.'; } },
        { l: 'Faire défaut', d: '−8 prestige, +20 menace', f: s => { s.prestige -= 8; s.menace += 20; return 'Le roi n\'oubliera pas.'; } },
      ] },
    { id: 'foires', year: 1255, text: () => 'Les foires de Champagne attirent les marchands de Flandre, d\'Italie et d\'Orient. Une route pourrait passer par vos terres.',
      choices: [
        { l: 'Ouvrir une route marchande', d: '−30 or, +3 or par tour pour toujours', f: s => { s.gold -= 30; s.trade = (s.trade || 0) + 3; return 'Les convois de draps passent désormais par vos péages.'; } },
        { l: 'Taxer les marchands de passage', d: '+30 or, −3 prestige', f: s => { s.gold += 30; s.prestige -= 3; return 'Les marchands paient, mais changent d\'itinéraire.'; } },
      ] },
    { id: 'templiers', year: 1307, text: () => 'Le roi fait arrêter les Templiers dans tout le royaume. Leur commanderie sur vos terres est sans maître, ses coffres pleins.',
      choices: [
        { l: 'Saisir leurs biens', d: '+50 or, −8 prestige, −3 stabilité', f: s => { s.gold += 50; s.prestige -= 8; s.stab -= 3; return 'Les coffres de l\'Ordre rejoignent les vôtres.'; } },
        { l: 'Remettre la commanderie aux Hospitaliers', d: '+8 prestige', f: s => { s.prestige += 8; return 'L\'Église loue votre droiture.'; } },
        { l: 'Cacher les frères', d: '+12 prestige, +15 menace', f: s => { s.prestige += 12; s.menace += 15; return 'Le roi soupçonne votre maison.'; } },
      ] },
    { id: 'famine', year: 1315, text: () => 'La Grande Famine : trois étés de pluie ont pourri les récoltes. On mange l\'écorce dans les villages.',
      choices: [
        { l: 'Vider le trésor pour nourrir le peuple', d: '−40 or, +6 stabilité', f: s => { s.gold -= 40; s.stab += 6; return 'Les greniers seigneuriaux sont ouverts à tous.'; } },
        { l: 'Réquisitionner les greniers de l\'Église', d: '−8 prestige, −4 stabilité', f: s => { s.prestige -= 8; s.stab -= 4; return 'Les abbés crient au sacrilège.'; } },
        { l: 'Laisser faire', d: '−18 stabilité, la famille souffre', f: s => { s.stab -= 18; famRisk(s, 0.05, 'famine'); return 'Les campagnes se vident.'; } },
      ] },
    { id: 'centans', year: 1337, text: () => 'Le roi d\'Angleterre revendique la couronne de France. Une guerre commence, que l\'on dira de Cent Ans.',
      choices: [
        { l: 'Soutenir le roi de France', d: '+10 prestige, +1 alliance, +25 menace', f: s => { s.prestige += 10; s.alliances = Math.min(s.P.maxAlliances, s.alliances + 1); s.menace += 25; return 'Vos bannières rejoignent l\'oriflamme.'; } },
        { l: 'Rallier l\'Angleterre', d: '+40 or, −10 prestige, −6 stabilité, −20 menace', f: s => { s.gold += 40; s.prestige -= 10; s.stab -= 6; s.menace = Math.max(0, s.menace - 20); return 'L\'or anglais coule, la honte aussi.'; } },
        { l: 'Rester neutre', d: '+10 menace', f: s => { s.menace += 10; return 'Les deux camps vous méprisent.'; } },
      ] },
    { id: 'peste_noire', year: 1348, text: () => 'La Peste noire débarque dans les ports. Elle emportera un tiers de l\'Europe. Elle sera chez vous avant l\'été.',
      choices: [
        { l: 'Fuir dans un château isolé', d: 'La famille risque moins ; −12 stabilité, −30 % d\'armée', f: s => { famRisk(s, 0.1, 'peste noire'); s.stab -= 12; s.army = Math.round(s.army * 0.7); return 'Les portes sont murées. Dehors, on meurt.'; } },
        { l: 'Rester et organiser les secours', d: 'La famille risque gros ; +10 stabilité, +15 prestige', f: s => { famRisk(s, 0.28, 'peste noire'); s.stab += 10; s.prestige += 15; s.army = Math.round(s.army * 0.7); return 'Le peuple n\'oubliera jamais votre présence.'; } },
      ] },

    // ----- Événements courants -----
    { id: 'peste', w: 3, ew: [1, 1, 1.6], cond: s => s.year - (s.lastPlague || 0) > 20 && s.year < 1345,
      text: () => 'Une épidémie frappe les villages. Les médecins conseillent de fermer les portes du château.',
      choices: [
        { l: 'Fermer le château', d: '−15 or, la famille est protégée', f: s => { s.gold -= 15; s.lastPlague = s.year; s.stab -= 3; famRisk(s, 0.05, 'épidémie'); return 'Le château vit reclus pendant des mois.'; } },
        { l: 'Rester parmi le peuple', d: '+6 stabilité, +3 prestige, risque mortel', f: s => { s.lastPlague = s.year; s.stab += 6; s.prestige += 3; famRisk(s, 0.2, 'épidémie'); return 'La famille reste aux côtés de ses sujets.'; } },
      ] },
    { id: 'recolte', w: 5, ew: [1, 0.8, 1.4], cond: ALL,
      text: () => 'Une mauvaise récolte menace de famine le pays.',
      choices: [
        { l: 'Ouvrir les greniers', d: '−25 or, +3 stabilité', f: s => { s.gold -= 25; s.stab += 3; return 'Le peuple bénit son seigneur.'; } },
        { l: 'Vendre le grain aux villes', d: '+25 or, −8 stabilité', f: s => { s.gold += 25; s.stab -= 8; return 'Les marchands paient bien ; les paysans ont faim.'; } },
        { l: 'Laisser faire', d: '−6 stabilité', f: s => { s.stab -= 6; return 'Les campagnes souffrent en silence.'; } },
      ] },
    { id: 'revolte', w: 5, ew: [1, 1, 0.5], cond: s => s.stab < 45,
      text: () => 'Des paysans en armes marchent sur le château, fourches à la main.',
      choices: [
        { l: 'Écraser la révolte', d: 'Il faut 25 soldats ou plus', f: s => { if (s.army >= 25) { s.army -= 6; s.stab += 6; return 'La révolte est matée.'; } s.army -= 8; s.stab -= 10; return 'Les soldats, trop peu nombreux, sont débordés !'; } },
        { l: 'Négocier', d: '−20 or, +8 stabilité', f: s => { s.gold -= 20; s.stab += 8; return 'Des chartes de franchise sont accordées.'; } },
      ] },
    { id: 'jacquerie', w: 6, ew: [0, 0, 1], cond: s => s.stab < 55,
      text: () => 'La jacquerie embrase les campagnes : des châteaux brûlent, des seigneurs sont massacrés.',
      choices: [
        { l: 'Écraser dans le sang', d: 'Il faut 40 soldats : −8 soldats, +9 stabilité, −4 prestige', f: s => { s.prestige -= 4; if (s.army >= 40) { s.army -= 8; s.stab += 9; return 'Les meneurs pendent aux arbres des routes.'; } s.army -= 12; s.stab -= 15; return 'Vos hommes sont balayés ; le feu gagne.'; } },
        { l: 'Abolir des corvées', d: '+10 stabilité, −3 or par tour pour toujours', f: s => { s.stab += 10; s.corvee = (s.corvee || 0) + 3; return 'Les serfs rentrent chez eux, plus libres.'; } },
      ] },
    { id: 'marchand', w: 4, ew: [0.7, 1.4, 1], cond: s => s.gold >= 25,
      text: () => 'Un marchand vénitien propose d\'investir dans une expédition vers l\'Orient.',
      choices: [
        { l: 'Investir 25 or', d: '60 % de chances de gagner 55 or', f: s => { s.gold -= 25; if (rand(s) < 0.6) { s.gold += 55; return 'Les navires reviennent chargés d\'épices : +55 or !'; } return 'Les navires ont sombré. L\'or est perdu.'; } },
        { l: 'Refuser', d: 'Rien ne se passe', f: () => 'Le marchand repart, dépité.' },
      ] },
    { id: 'batard', w: 2, cond: s => { const r = ruler(s); return r.sex === 'M' && age(s, r) >= 20 && age(s, r) < 55; },
      text: s => `Une servante affirme que l'enfant qu'elle porte dans ses bras est de ${fullName(s, ruler(s))}.`,
      choices: [
        { l: 'Le reconnaître', d: '−5 stabilité, un héritier de plus', f: s => { const r = ruler(s); const k = newPerson(s, { sex: 'M', born: s.year - ri(s, 0, 2), parent: r.id, bastard: true }); randomTraits(s, k, 1); s.stab -= 5; return `${k.name} le Bâtard entre dans la famille.`; } },
        { l: 'Nier', d: '−3 prestige', f: s => { s.prestige -= 3; return 'Les rumeurs courent dans les tavernes.'; } },
      ] },
    { id: 'complot', w: 4, cond: s => s.stab < 65,
      text: () => 'Votre maître-espion parle d\'un complot visant la vie du souverain. Le favori de la cour serait mêlé à l\'affaire.',
      choices: [
        { l: 'Enquêter discrètement', d: '−12 or, +3 stabilité', f: s => { s.gold -= 12; s.stab += 3; return 'Les conjurés sont démasqués et bannis.'; } },
        { l: 'Arrêter le favori sans preuve', d: '70 % : +5 stabilité ; 30 % : −10 stabilité', f: s => { if (rand(s) < 0.7) { s.stab += 5; return 'Le favori avoue tout sous la question.'; } s.stab -= 10; return 'Il était innocent. La cour gronde.'; } },
        { l: 'Ignorer', d: '20 % de risque d\'assassinat', f: s => { if (rand(s) < 0.2) { kill(s, ruler(s), 'assassiné'); return 'Une dague dans la nuit…'; } return 'Rien ne se produit… cette fois.'; } },
      ] },
    { id: 'eveque', w: 4, ew: [1, 1.3, 1], cond: ALL,
      text: () => 'L\'évêque réclame une généreuse dîme pour sa cathédrale.',
      choices: [
        { l: 'Payer', d: '−15 or, +4 prestige, +2 stabilité', f: s => { s.gold -= 15; s.prestige += 4; s.stab += 2; return 'L\'Église chante vos louanges.'; } },
        { l: 'Taxer le clergé à la place', d: '+20 or, −3 prestige, −5 stabilité', f: s => { s.gold += 20; s.prestige -= 3; s.stab -= 5; return 'L\'évêque menace d\'excommunication.'; } },
      ] },
    { id: 'tournoi', w: 3, cond: s => age(s, ruler(s)) >= 18 && age(s, ruler(s)) < 50,
      text: s => `Un grand tournoi se tient à la cour voisine. ${fullName(s, ruler(s))} est invité à jouter.`,
      choices: [
        { l: 'Jouter', d: '+8 prestige, 8 % de risque mortel', f: s => { s.prestige += 8; if (rand(s) < 0.08 * (ruler(s).traits.includes('brave') ? 0.6 : 1)) kill(s, ruler(s), 'tué en joute'); return 'Les trompettes résonnent.'; } },
        { l: 'Envoyer un champion', d: '−10 or, +3 prestige', f: s => { s.gold -= 10; s.prestige += 3; return 'Votre champion fait bonne figure.'; } },
        { l: 'Décliner', d: '−2 prestige', f: s => { s.prestige -= 2; return 'On murmure que le souverain a peur.'; } },
      ] },
    { id: 'croisade', w: 2, ew: [1.3, 1.5, 0.3], cond: s => age(s, ruler(s)) >= 18 && age(s, ruler(s)) < 55,
      text: () => 'Le pape appelle à la croisade. Les princes de la chrétienté prennent la croix.',
      choices: [
        { l: 'Prendre la croix', d: '+25 prestige, +1 alliance, −30 % d\'armée, 15 % de risque mortel', f: s => { s.army = Math.round(s.army * 0.7); s.gold -= 15; s.prestige += 25; s.alliances = Math.min(s.P.maxAlliances, s.alliances + 1); s.stab -= 3; if (rand(s) < 0.15) kill(s, ruler(s), 'mort en Terre sainte'); return 'L\'ost s\'embarque pour l\'Outremer.'; } },
        { l: 'Financer', d: '−25 or, +8 prestige', f: s => { s.gold -= 25; s.prestige += 8; return 'Vos coffres soutiennent la cause.'; } },
        { l: 'Refuser', d: '−5 prestige', f: s => { s.prestige -= 5; return 'Le pape fronce les sourcils.'; } },
      ] },
    { id: 'mine', w: 2, cond: s => !s.mine,
      text: () => 'Des paysans ont trouvé un filon d\'argent dans les collines.',
      choices: [
        { l: 'Exploiter', d: '−20 or, +4 or par tour pour toujours', f: s => { s.gold -= 20; s.mine = true; return 'La mine d\'argent ouvre.'; } },
        { l: 'Vendre la concession', d: '+35 or', f: s => { s.gold += 35; s.mine = true; s.mineSold = true; return 'Un banquier lombard achète le filon.'; } },
      ] },
    { id: 'heritier_rebelle', w: 4, cond: s => { const h = heir(s); return h && h.parent === s.rulerId && age(s, h) >= 18 && (age(s, ruler(s)) >= 45 || h.loyal < 35); },
      text: s => `${heir(s).name}, impatient de régner, rassemble des partisans.`,
      choices: [
        { l: 'L\'apaiser par des terres', d: '−20 or', f: s => { s.gold -= 20; return 'L\'héritier se calme.'; } },
        { l: 'Le déshériter', d: 'Il est écarté de la succession, −4 stabilité', f: s => { const h = heir(s); h.disinherited = true; s.stab -= 4; loyalty(s, h, -50); bio(s, h, 'Est déshérité par son père.'); return `${h.name} est banni de la ligne de succession.`; } },
        { l: 'Le menacer', d: '50 % : −10 stabilité', f: s => { if (rand(s) < 0.5) { s.stab -= 10; return 'Une brève guerre civile éclate.'; } return 'L\'héritier plie le genou.'; } },
      ] },
    { id: 'brigands', w: 4, ew: [1, 0.8, 1.4], cond: ALL,
      text: () => 'Des brigands rançonnent les routes du domaine.',
      choices: [
        { l: 'Les chasser', d: '−8 soldats, +3 stabilité', f: s => { s.army -= 8; s.stab += 3; return 'Les routes sont sûres à nouveau.'; } },
        { l: 'Les enrôler', d: '+12 soldats, −4 stabilité', f: s => { s.army += 12; s.stab -= 4; return 'Les coupe-jarrets portent vos couleurs. Les villageois s\'inquiètent.'; } },
        { l: 'Payer les chefs', d: '−12 or, +2 stabilité', f: s => { s.gold -= 12; s.stab += 2; return 'Les brigands partent… ailleurs.'; } },
      ] },
    { id: 'astrologue', w: 2, cond: s => !!heir(s),
      text: s => `Un astrologue lit l'avenir de ${heir(s).name} dans les étoiles.`,
      choices: [
        { l: 'Suivre ses conseils', d: 'Un trait au hasard pour l\'héritier', f: s => { const h = heir(s); const t = weighted(s, BIRTH_TRAITS); if (addTrait(h, t)) return `${h.name} devient ${TRAITS[t].n.toLowerCase()}.`; return 'Les astres restent muets.'; } },
        { l: 'Le chasser', d: '+1 prestige', f: s => { s.prestige += 1; return 'Charlatan !'; } },
      ] },
    { id: 'heresie', w: 3, ew: [1.3, 1, 0.7], cond: ALL,
      text: () => 'Des prêcheurs hérétiques gagnent les villes du sud.',
      choices: [
        { l: 'Tolérer', d: '+2 stabilité, −6 prestige', f: s => { s.prestige -= 6; s.stab += 2; return 'Les villes restent calmes.'; } },
        { l: 'Envoyer des prédicateurs', d: '−12 or, +3 prestige, +1 stabilité', f: s => { s.gold -= 12; s.prestige += 3; s.stab += 1; return 'Les dominicains disputent en place publique.'; } },
        { l: 'Réprimer', d: '−6 soldats, +8 prestige, −2 stabilité', f: s => { s.army -= 6; s.prestige += 8; s.stab -= 2; return 'L\'Église est satisfaite.'; } },
      ] },
    { id: 'vassal', w: 5, ew: [1.8, 1, 0.8], cond: ALL,
      text: () => 'Un puissant vassal exige plus de terres pour prix de sa loyauté.',
      choices: [
        { l: 'Le récompenser', d: '−18 or, +5 stabilité', f: s => { s.gold -= 18; s.stab += 5; return 'Le vassal jure fidélité.'; } },
        { l: 'L\'humilier', d: '+4 prestige, 40 % de rébellion', f: s => { s.prestige += 4; if (rand(s) < 0.4) { s.stab -= 12; s.army -= 6; return 'Le vassal se rebelle !'; } return 'Le vassal ravale sa fierté.'; } },
      ] },
    { id: 'chroniqueur', w: 2, cond: ALL,
      text: () => 'Un moine érudit propose d\'écrire la chronique de votre lignée.',
      choices: [
        { l: 'Commander la chronique', d: '−10 or, +9 prestige', f: s => { s.gold -= 10; s.prestige += 9; return 'La gloire de la maison est consignée.'; } },
        { l: 'En faire le précepteur de l\'héritier', d: '−5 or, 60 % : l\'héritier devient sage', f: s => { s.gold -= 5; const h = heir(s); if (h && rand(s) < 0.6 && addTrait(h, 'sage')) return `${h.name} apprend la patience des moines.`; return 'L\'élève est distrait.'; } },
      ] },
    { id: 'maladie', w: 4, cond: s => age(s, ruler(s)) >= 40,
      text: s => `${fullName(s, ruler(s))} est pris d'une fièvre tenace.`,
      choices: [
        { l: 'Faire venir un médecin de Montpellier', d: '−15 or, 75 % de guérison', f: s => { s.gold -= 15; if (rand(s) < 0.75) return 'Le souverain se rétablit.'; if (!addTrait(ruler(s), 'maladif') && rand(s) < 0.4) kill(s, ruler(s), 'fièvre'); return 'La guérison est incomplète.'; } },
        { l: 'Prier', d: 'Gratuit, 50 % de guérison', f: s => { if (rand(s) < 0.5) return 'Un miracle !'; if (!addTrait(ruler(s), 'maladif') && rand(s) < 0.5) kill(s, ruler(s), 'fièvre'); return 'La fièvre laisse des séquelles.'; } },
      ] },
    { id: 'proposition', w: 4, cond: s => unmarriedAdults(s).length > 0,
      text: s => {
        const p = unmarriedAdults(s)[0];
        const c = { sex: p.sex === 'M' ? 'F' : 'M', name: pick(s, p.sex === 'M' ? NAMES_F : NAMES_M), from: pick(s, HOUSES.filter(h => h !== s.house)), born: s.year - (p.sex === 'M' ? clamp(age(s, p) - ri(s, 0, 10), 16, 30) : clamp(age(s, p) + ri(s, -5, 8), 16, 55)), traits: [] };
        let n = 0; while (c.traits.length < 2 && n++ < 10) { const t = weighted(s, BIRTH_TRAITS); if (!c.traits.includes(t) && !c.traits.includes(OPPOSED[t])) c.traits.push(t); }
        s._ctx = p.id; s._cand = c;
        return `La maison ${c.from} propose ${c.name}, ${s.year - c.born} ans, en mariage à ${p.name}, avec une belle dot. On dit ${c.sex === 'F' ? 'la promise' : 'le promis'} ${c.traits.map(t => TRAITS[t].n.toLowerCase()).join(' et ')}.`;
      },
      choices: [
        { l: 'Accepter', d: '+20 or, +1 alliance', f: s => { const p = s.people[s._ctx]; s.gold += 20; marry(s, p, 'alliance', s._cand); return 'Les noces sont célébrées.'; } },
        { l: 'Refuser poliment', d: '+3 stabilité (la cour vous garde ce parti)', f: s => { s.stab += 3; return 'Le refus est enrobé de compliments.'; } },
      ] },
    { id: 'jumeaux', w: 2, cond: s => { const r = ruler(s); const sp = person(s, r.spouse); return sp && sp.alive && fertileWoman(s, r.sex === 'F' ? r : sp); },
      text: () => 'Les sages-femmes annoncent une grossesse difficile, peut-être des jumeaux.',
      choices: [
        { l: 'Appeler les meilleures sages-femmes', d: '−12 or', f: s => { s.gold -= 12; birth(s, ruler(s), 0.01); birth(s, ruler(s), 0); return 'Deux enfants voient le jour !'; } },
        { l: 'S\'en remettre à Dieu', d: 'Risqué pour la mère', f: s => { birth(s, ruler(s), 0.12); if (rand(s) < 0.5) birth(s, ruler(s), 0); return 'L\'accouchement est long et pénible.'; } },
      ] },
    { id: 'dette', w: 4, cond: s => s.gold < 0,
      text: () => 'Les banquiers lombards réclament le remboursement de vos dettes.',
      choices: [
        { l: 'Vendre des terres', d: '−1 domaine, +40 or', f: s => { if (s.domains > 1) { const t = loseRegion(s, pick(s, HOUSES.filter(h => h !== s.house && h !== s.rival))); s.gold += 40; return `${t ? t.name : 'Un domaine'} est cédé.`; } s.stab -= 10; return 'Il n\'y a plus rien à vendre…'; } },
        { l: 'Expulser les banquiers', d: 'Dette effacée, −15 prestige, −5 stabilité', f: s => { s.gold = 0; s.prestige -= 15; s.stab -= 5; return 'Les Lombards sont chassés.'; } },
      ] },
    // ----- Loyauté -----
    { id: 'complot_familial', w: 6, cond: s => livingDyn(s).some(p => p.id !== s.rulerId && age(s, p) >= 16 && p.loyal < 30 && !p.disinherited),
      text: s => { const p = livingDyn(s).find(p => p.id !== s.rulerId && age(s, p) >= 16 && p.loyal < 30 && !p.disinherited); s._ctx = p.id; return `${p.name}, ${TEMPERS[p.temper].n.toLowerCase()} et rancunier, a été vu chez les ${s.rival}. On dit qu'${p.sex === 'F' ? 'elle' : 'il'} leur promet vos secrets contre une couronne.`; },
      choices: [
        { l: 'Le faire arrêter', d: '+4 stabilité, la famille s\'inquiète', f: s => { const p = s.people[s._ctx]; s.stab += 4; for (const q of livingDyn(s)) loyalty(s, q, -6); p.disinherited = true; bio(s, p, 'Est arrêté pour trahison et écarté de la succession.'); return `${p.name} est enfermé dans la tour.`; } },
        { l: 'Acheter sa fidélité', d: '−30 or, sa loyauté remonte', f: s => { const p = s.people[s._ctx]; s.gold -= 30; loyalty(s, p, 40); bio(s, p, 'Reçoit des terres pour prix de sa fidélité.'); return `${p.name} accepte un fief et jure fidélité.`; } },
        { l: 'Laisser faire', d: '+15 menace', f: s => { s.menace += 15; return 'Vos plans sont désormais connus de vos ennemis.'; } },
      ] },
    { id: 'conseil_fidele', w: 4, cond: s => livingDyn(s).some(p => p.id !== s.rulerId && age(s, p) >= 18 && p.loyal >= 75),
      text: s => { const p = livingDyn(s).find(p => p.id !== s.rulerId && age(s, p) >= 18 && p.loyal >= 75); s._ctx = p.id; return `${p.name}, dévoué${p.sex === 'F' ? 'e' : ''} corps et âme, propose de servir la couronne. On connaît sa passion pour ${p.passion}.`; },
      choices: [
        { l: 'Lui confier une ambassade', d: '−20 menace', f: s => { const p = s.people[s._ctx]; s.menace = Math.max(0, s.menace - 20); bio(s, p, `Mène une ambassade chez les ${s.rival}.`); return `${p.name} revient avec des promesses de paix.`; } },
        { l: 'Lui confier l\'intendance', d: '+25 or', f: s => { const p = s.people[s._ctx]; s.gold += 25; bio(s, p, 'Tient l\'intendance du domaine.'); return 'Les comptes sont tenus au denier près.'; } },
        { l: 'Le garder près de vous', d: '+4 stabilité', f: s => { const p = s.people[s._ctx]; s.stab += 4; return `La présence de ${p.name} rassure la cour.`; } },
      ] },
    // ----- Nouveaux événements -----
    { id: 'prodige', w: 3, cond: s => livingDyn(s).some(p => age(s, p) >= 6 && age(s, p) <= 14 && p.traits.length < 3),
      text: s => { const k = livingDyn(s).find(p => age(s, p) >= 6 && age(s, p) <= 14 && p.traits.length < 3); s._ctx = k.id; return `${k.name}, à ${age(s, k)} ans, récite Virgile et confond les précepteurs.`; },
      choices: [
        { l: 'Lui offrir les meilleurs maîtres', d: '−8 or, 50 % génie, sinon sage', f: s => { const k = s.people[s._ctx]; s.gold -= 8; const t = rand(s) < 0.5 ? 'genie' : 'sage'; if (addTrait(k, t)) return `${k.name} devient ${TRAITS[t].n.toLowerCase()}.`; return 'L\'enfant progresse.'; } },
        { l: 'L\'envoyer au monastère', d: '+2 prestige, l\'enfant devient pieux', f: s => { const k = s.people[s._ctx]; s.prestige += 2; addTrait(k, 'pieux'); return `${k.name} apprend la règle de saint Benoît.`; } },
      ] },
    { id: 'conseil_conjoint', w: 3, cond: s => { const sp = person(s, ruler(s).spouse); return sp && sp.alive && age(s, ruler(s)) >= 18; },
      text: s => { const sp = person(s, ruler(s).spouse); return `${sp.name} demande à siéger au conseil. ${sp.sex === 'F' ? 'Elle' : 'Il'} a l'oreille des marchands et des ambassadeurs.`; },
      choices: [
        { l: 'Lui confier le trésor', d: '+28 or, −3 stabilité', f: s => { s.gold += 28; s.stab -= 3; return 'Les comptes n\'ont jamais été si bien tenus. Les barons jasent.'; } },
        { l: 'Lui confier la diplomatie', d: '−15 menace, +3 prestige', f: s => { s.menace = Math.max(0, s.menace - 15); s.prestige += 3; return `Les envoyés de la maison ${s.rival} sont charmés.`; } },
        { l: 'Refuser', d: '−2 stabilité', f: s => { s.stab -= 2; return 'Le froid s\'installe au lit conjugal.'; } },
      ] },
    { id: 'universite', w: 3, ew: [0, 1.5, 0.8], cond: s => !s.univ,
      text: () => 'Des maîtres venus de Paris veulent fonder une université sur vos terres.',
      choices: [
        { l: 'Fonder l\'université', d: '−35 or, +6 prestige, l\'éducation réussit plus souvent', f: s => { s.gold -= 35; s.prestige += 6; s.univ = true; return 'Les écoliers affluent, et les rixes avec eux.'; } },
        { l: 'Décliner', d: 'Rien', f: () => 'Les maîtres partent pour Orléans.' },
      ] },
    { id: 'cathedrale', w: 3, ew: [0.3, 2, 0.5], cond: s => !s.chantier && !s.cathedral,
      text: () => 'Le chapitre propose d\'élever une cathédrale gothique, œuvre de deux générations.',
      choices: [
        { l: 'Lancer le chantier', d: '−12 or, puis −4 or par tour pendant 6 tours ; à la fin +35 prestige et +1 prestige par tour', f: s => { s.gold -= 12; s.chantier = 6; return 'Les maîtres d\'œuvre tracent le plan au sol.'; } },
        { l: 'Une simple église suffira', d: '−8 or, +2 prestige', f: s => { s.gold -= 8; s.prestige += 2; return 'Une belle église romane s\'élève.'; } },
      ] },
    { id: 'condottiere', w: 4, ew: [0.3, 0.6, 1.8], cond: ALL,
      text: s => `Un capitaine de grande compagnie offre ses lances. Il propose aussi de ravager les terres de la maison ${s.rival}.`,
      choices: [
        { l: 'L\'engager', d: '−30 or, +30 soldats', f: s => { s.gold -= 30; s.army += 30; return 'Ses routiers campent sous vos murs.'; } },
        { l: 'Le payer pour frapper le rival', d: '−25 or, −30 menace', f: s => { s.gold -= 25; s.menace = Math.max(0, s.menace - 30); return `Les terres de la maison ${s.rival} brûlent.`; } },
        { l: 'Le chasser', d: '−5 soldats, +10 menace', f: s => { s.army -= 5; s.menace += 10; return 'Il part… chez votre rival.'; } },
      ] },
    // ---------- Le seigneur rival ----------
    { id: 'rival_defi', w: 3, cond: s => s.rivalLord && !s.rivalDown && age(s, ruler(s)) >= 16 && age(s, ruler(s)) <= 55,
      text: s => `${s.rivalLord.name} ${s.rival} vous défie en combat singulier devant les barons assemblés. ${s.rivalLord.traits.includes('brave') ? 'On le dit redoutable à la lance.' : 'On le dit plus fort en paroles qu\'en armes.'}`,
      choices: [
        { l: 'Relever le défi en personne', d: 'Selon vos qualités : +12 prestige, −12 menace ; sinon −8 prestige, −3 stabilité', f: s => { const r = ruler(s), L = s.rivalLord; let p = 0.5 + (r.traits.includes('brave') ? 0.15 : 0) + (r.traits.includes('robuste') ? 0.1 : 0) - (L.traits.includes('brave') ? 0.15 : 0) - (r.traits.includes('couard') ? 0.2 : 0) - (age(s, r) > 45 ? 0.1 : 0); if (rand(s) < p) { s.prestige += 12; s.menace = Math.max(0, s.menace - 12); if (rand(s) < 0.25) { const old = L; s.rivalLord = newRivalLord(s, true); s.menace = Math.max(0, s.menace - 10); return `${r.name} désarçonne ${old.name}, qui meurt de ses blessures. ${s.rivalLord.name} hérite d'une maison humiliée.`; } return `${r.name} désarçonne ${L.name} sous les vivats.`; } s.prestige -= 8; s.stab -= 3; if (rand(s) < 0.15) addTrait(r, 'maladif'); return `${r.name} mord la poussière. Les barons ricanent.`; } },
        { l: 'Envoyer un champion', d: '−12 or, 55 % : +6 prestige ; sinon −3 prestige', f: s => { s.gold -= 12; if (rand(s) < 0.55) { s.prestige += 6; return 'Votre champion l\'emporte.'; } s.prestige -= 3; return 'Votre champion est vaincu.'; } },
        { l: 'Décliner avec mépris', d: '−4 prestige, +2 stabilité', f: s => { s.prestige -= 4; s.stab += 2; return 'Les sages approuvent ; les jeunes chevaliers murmurent.'; } },
      ] },
    { id: 'rival_noces', w: 3, cond: s => s.rivalLord && !s.rivalDown && unmarriedAdults(s).length > 0 && s.menace > 20,
      text: s => {
        const p = unmarriedAdults(s)[0];
        const c = { sex: p.sex === 'M' ? 'F' : 'M', name: pick(s, p.sex === 'M' ? NAMES_F : NAMES_M), from: s.rival, born: s.year - clamp(age(s, p) + ri(s, -6, 4), 16, 40), traits: [] };
        let n = 0; while (c.traits.length < 2 && n++ < 10) { const t = weighted(s, BIRTH_TRAITS); if (!c.traits.includes(t) && !c.traits.includes(OPPOSED[t])) c.traits.push(t); }
        s._ctx = p.id; s._cand = c;
        return `${s.rivalLord.name} ${s.rival} propose d'unir les deux maisons : ${c.name}, de son sang, épouserait ${p.name}. Une trêve suivrait les noces.`;
      },
      choices: [
        { l: 'Sceller la paix par le mariage', d: '−15 menace, trêve de 3 tours, −8 prestige', f: s => { const p = s.people[s._ctx]; s.gold += 20; marry(s, p, 'alliance', s._cand); s.menace = Math.max(0, s.menace - 15); s.prestige -= 8; s.truce = s.turn + 3; return 'Les deux bannières flottent côte à côte pendant les noces.'; } },
        { l: 'Refuser : notre sang ne se mêle pas', d: '+7 prestige, +5 menace', f: s => { s.prestige += 7; s.menace += 5; return 'L\'ambassadeur repart, blême de colère.'; } },
      ] },
    { id: 'rival_trahison', w: 3, cond: s => s.rivalLord && !s.rivalDown && borderTargets(s).some(r => r.owner === 'rival'),
      text: s => { const t = pick(s, borderTargets(s).filter(r => r.owner === 'rival')); s._reg = t.i; return `Le châtelain de ${t.name}, mécontent de ${s.rivalLord.name} ${s.rival}, offre de vous ouvrir ses portes… contre 30 pièces d'or.`; },
      choices: [
        { l: 'Payer le traître', d: '−30 or ; 60 % : la terre est à vous, sinon c\'est un piège (−5 prestige)', f: s => { s.gold -= 30; const t = s.regions[s._reg]; if (t && t.owner === 'rival' && rand(s) < 0.6) { gainRegion(s, t.i); return `Les portes s'ouvrent à l'aube : ${t.name} est à vous.`; } s.prestige -= 5; return 'Le châtelain empoche l\'or et ferme ses portes en riant.'; } },
        { l: 'Dénoncer la trahison au seigneur rival', d: '+3 prestige, −8 menace', f: s => { s.prestige += 3; s.menace = Math.max(0, s.menace - 8); return `${s.rivalLord.name} fait pendre le félon et vous en sait gré.`; } },
        { l: 'Garder la lettre pour plus tard', d: 'Garnison de cette terre −8', f: s => { const t = s.regions[s._reg]; if (t) t.def = Math.max(6, t.def - 8); return 'Le traître attendra votre signal.'; } },
      ] },
    { id: 'rival_chute', w: 2, cond: s => s.rivalLord && !s.rivalDown && s.year - s.rivalLord.born >= 30,
      text: s => `${s.rivalLord.name} ${s.rival} est tombé dans une escarmouche contre une maison voisine. Ses fils se disputent déjà l'héritage.`,
      choices: [
        { l: 'Soutenir le cadet en secret', d: '−15 or ; garnisons rivales −8, 35 % : une terre se rallie à vous', f: s => { s.gold -= 15; s.rivalLord = newRivalLord(s, true); for (const rg of s.regions) if (rg.owner === 'rival') rg.def = Math.max(6, rg.def - 8); const tb = borderTargets(s).filter(r => r.owner === 'rival'); if (tb.length && rand(s) < 0.35) { const t = pick(s, tb); gainRegion(s, t.i); return `La guerre des frères profite à votre maison : ${t.name} se rallie à vous.`; } return `${s.rivalLord.name} l'emporte, mais sa maison sort affaiblie.`; } },
        { l: 'Offrir la paix au nouveau seigneur', d: '−10 menace, +2 stabilité, trêve de 2 tours', f: s => { s.rivalLord = newRivalLord(s, true); s.menace = Math.max(0, s.menace - 10); s.stab += 2; s.truce = s.turn + 2; return `${s.rivalLord.name} accepte votre main tendue.`; } },
        { l: 'Rassembler l\'ost', d: '+12 soldats, prochaine campagne plus forte, +5 menace', f: s => { s.rivalLord = newRivalLord(s, true); s.army += 12; s.omen = true; s.menace += 5; return 'Les vassaux affluent : l\'heure est venue.'; } },
      ] },
    { id: 'rival_treve', w: 2, cond: s => s.rivalLord && !s.rivalDown && (s.rivalLord.traits.includes('pieux') || s.rivalLord.traits.includes('sage')) && !(s.truce > s.turn),
      text: s => `${s.rivalLord.name} ${s.rival}, ${s.rivalLord.traits.includes('pieux') ? 'homme de foi' : 'homme de raison'}, propose une trêve de Dieu sous l'arbitrage de l'évêque.`,
      choices: [
        { l: 'Jurer la trêve', d: '−15 or, +3 prestige, −10 menace, trêve de 3 tours', f: s => { s.gold -= 15; s.prestige += 3; s.menace = Math.max(0, s.menace - 10); s.truce = s.turn + 3; return 'On jure sur les reliques de la cathédrale.'; } },
        { l: 'Feindre d\'accepter', d: 'Garnisons rivales −5, mais 30 % : parjure découvert (−10 prestige)', f: s => { for (const rg of s.regions) if (rg.owner === 'rival') rg.def = Math.max(6, rg.def - 5); if (rand(s) < 0.3) { s.prestige -= 10; s.menace += 10; return 'Le parjure est découvert. L\'évêque vous excommunie un temps.'; } return 'Ses garnisons baissent la garde.'; } },
        { l: 'Refuser', d: '+4 menace', f: s => { s.menace += 4; return 'L\'évêque repart sans traité.'; } },
      ] },
    // ---------- Événements propres aux âges ----------
    { id: 'baron_felon', w: 4, ew: [2, 0.6, 0.3], cond: ALL,
      text: () => 'Un baron refuse de vous prêter hommage et fortifie son château.',
      choices: [
        { l: 'Assiéger le félon', d: 'Il faut 35 soldats : −6 soldats, +5 stabilité, +3 prestige', f: s => { if (s.army >= 35) { s.army -= 6; s.stab += 5; s.prestige += 3; return 'Le château tombe ; le baron baise votre étrier.'; } s.army -= 6; s.stab -= 5; return 'Le siège échoue piteusement.'; } },
        { l: 'Négocier', d: '−20 or, +1 stabilité', f: s => { s.gold -= 20; s.stab += 1; return 'Un fief de plus achète sa loyauté.'; } },
        { l: 'Le laisser faire', d: '−5 stabilité, +4 or', f: s => { s.stab -= 5; s.gold += 4; return 'Les autres barons prennent note.'; } },
      ] },
    { id: 'croise_retour', w: 3, ew: [2, 0.8, 0], cond: ALL,
      text: () => 'Un chevalier revenu d\'outremer, couvert de gloire et de dettes, se présente à votre cour.',
      choices: [
        { l: 'Le prendre à votre service', d: '−15 or, +10 soldats, +1 prestige', f: s => { s.gold -= 15; s.army += 10; s.prestige += 1; return 'Ses récits enflamment la jeunesse.'; } },
        { l: 'Le faire précepteur d\'armes', d: '−6 or, 70 % : l\'héritier devient brave', f: s => { s.gold -= 6; const h = heir(s); if (h && rand(s) < 0.7 && addTrait(h, 'brave')) return `${h.name} apprend l\'escrime de Terre sainte.`; return 'L\'élève préfère les livres.'; } },
        { l: 'Le congédier', d: 'Rien', f: s => { return 'Il part chercher fortune ailleurs.'; } },
      ] },
    { id: 'guilde', w: 4, ew: [0.3, 2, 0.6], cond: s => s.builds >= 1 || s.domains >= 3,
      text: () => 'Les maîtres drapiers demandent une charte de franchise pour leur guilde.',
      choices: [
        { l: 'Accorder la charte', d: '−4 stabilité, +2 or par tour', f: s => { s.stab -= 4; s.trade = (s.trade || 0) + 2; return 'Les métiers battent dans les faubourgs.'; } },
        { l: 'Vendre la charte', d: '+35 or, −1 stabilité', f: s => { s.gold += 35; s.stab -= 1; return 'Les drapiers paient, en maugréant.'; } },
        { l: 'Refuser', d: '+2 stabilité chez les barons', f: s => { s.stab += 2; return 'Les vieux lignages applaudissent.'; } },
      ] },
    { id: 'pont_pierre', w: 3, ew: [0.4, 2, 0.5], cond: s => s.gold >= 20,
      text: () => 'Les frères pontifes proposent de jeter un pont de pierre sur le fleuve.',
      choices: [
        { l: 'Financer le pont', d: '−15 or, +1 or par tour, +3 prestige', f: s => { s.gold -= 15; s.trade = (s.trade || 0) + 1; s.prestige += 3; return 'Les marchands affluent par le nouveau pont.'; } },
        { l: 'Y mettre un péage', d: '−12 or, +2 or par tour, −2 stabilité', f: s => { s.gold -= 12; s.trade = (s.trade || 0) + 2; s.stab -= 2; return 'Le péage rapporte… et fâche.'; } },
        { l: 'Refuser', d: 'Rien', f: () => 'Le bac continuera de passer.' },
      ] },
    { id: 'grandes_compagnies', w: 4, ew: [0, 0.4, 2], cond: ALL,
      text: () => 'Une Grande Compagnie de routiers sans emploi ravage vos campagnes.',
      choices: [
        { l: 'Payer leur départ', d: '−22 or', f: s => { s.gold -= 22; return 'Ils partent ravager le voisin.'; } },
        { l: 'Les combattre', d: 'Il faut 50 soldats : −10 soldats, +8 prestige ; sinon −15 soldats, −6 stabilité', f: s => { if (s.army >= 50) { s.army -= 10; s.prestige += 8; return 'La Compagnie est taillée en pièces.'; } s.army -= 15; s.stab -= 6; return 'Vos hommes sont débordés.'; } },
        { l: 'Les engager', d: '+15 soldats, −8 stabilité, −15 or', f: s => { s.army += 15; s.stab -= 8; s.gold -= 15; return 'Les routiers portent désormais vos couleurs.'; } },
      ] },
    { id: 'flagellants', w: 3, ew: [0, 0.3, 2], cond: ALL,
      text: () => 'Une procession de flagellants traverse vos terres en annonçant la fin des temps.',
      choices: [
        { l: 'Les accueillir', d: '+4 prestige, −4 stabilité', f: s => { s.prestige += 4; s.stab -= 4; return 'Les foules pleurent et se repentent.'; } },
        { l: 'Les chasser', d: '+3 stabilité, −3 prestige', f: s => { s.stab += 3; s.prestige -= 3; return 'Les sergents les reconduisent aux frontières.'; } },
        { l: 'Prêcher la mesure', d: '−8 or, +2 stabilité, +1 prestige', f: s => { s.gold -= 8; s.stab += 2; s.prestige += 1; return 'Les frères prêcheurs calment les esprits.'; } },
      ] },
    // ---------- Récits en plusieurs étapes ----------
    { id: 'guerisseuse', w: 3, cond: s => !(s.chains || []).length,
      text: () => 'Les villageois traînent devant vous une guérisseuse qu\'ils accusent de sorcellerie : le bétail meurt depuis qu\'elle vit au bois.',
      choices: [
        { l: 'La livrer au bûcher', d: '+2 stabilité, −7 prestige', f: s => { s.stab += 2; s.prestige -= 7; return 'Les flammes montent ; le bétail continue de mourir.'; } },
        { l: 'La prendre sous votre protection', d: '−2 stabilité… on verra bien', f: s => { s.stab -= 2; (s.chains = s.chains || []).push({ id: 'guerisseuse_2', at: s.turn + 2 }); return 'Elle s\'installe près du château, sous les regards noirs.'; } },
        { l: 'La bannir', d: '+1 stabilité', f: s => { s.stab += 1; return 'Elle disparaît dans la forêt.'; } },
      ] },
    { id: 'guerisseuse_2', chain: true, w: 0, cond: ALL,
      text: s => { const h = heir(s) || ruler(s); s._ctx = h.id; return `La fièvre frappe ${h.name}. Les médecins désespèrent… La guérisseuse que vous avez protégée demande à voir ${h.sex === 'F' ? 'la malade' : 'le malade'}.`; },
      choices: [
        { l: 'Lui confier l\'enfant', d: '80 % : guérison et l\'héritier devient robuste ; on jase à la cour', f: s => { const h = s.people[s._ctx]; s.stab -= 2; if (rand(s) < 0.8) { if (h) addTrait(h, 'robuste'); s.prestige += 4; return `${h.name} se relève, plus fort qu'avant. On parle de miracle.`; } if (h) addTrait(h, 'maladif'); return 'Ses herbes n\'y peuvent rien ; la fièvre laisse des séquelles.'; } },
        { l: 'S\'en remettre aux médecins', d: '−10 or, 50 % : séquelles', f: s => { const h = s.people[s._ctx]; s.gold -= 10; if (rand(s) < 0.5 && h) { addTrait(h, 'maladif'); return 'La saignée affaiblit le malade pour longtemps.'; } return 'La fièvre tombe d\'elle-même.'; } },
      ] },
    { id: 'carte_templier', w: 3, ew: [0.5, 1.5, 1], cond: s => !(s.chains || []).length,
      text: () => 'Un vieux chevalier mourant vous confie une carte : un trésor serait caché dans une commanderie abandonnée, au-delà des marches.',
      choices: [
        { l: 'Financer une expédition', d: '−20 or ; résultat dans quelques années', f: s => { s.gold -= 20; (s.chains = s.chains || []).push({ id: 'carte_templier_2', at: s.turn + 2 }); return 'Six hommes partent à l\'aube avec pelles et torches.'; } },
        { l: 'Vendre la carte à un marchand', d: '+15 or', f: s => { s.gold += 15; return 'Le marchand paie sans discuter… un peu trop vite.'; } },
        { l: 'Brûler ce grimoire', d: '+2 prestige', f: s => { s.prestige += 2; return 'Le chapelain approuve votre sagesse.'; } },
      ] },
    { id: 'carte_templier_2', chain: true, w: 0, cond: ALL,
      text: () => 'Vos chercheurs de trésor sont de retour, couverts de boue. Ils ont trouvé la crypte… et quelque chose d\'autre : des hommes en armes la gardent.',
      choices: [
        { l: 'Envoyer une escorte forcer la crypte', d: '−8 soldats ; 55 % : +80 or et une relique (+8 prestige)', f: s => { s.army -= 8; if (rand(s) < 0.55) { s.gold += 80; s.prestige += 8; return 'Des coffres d\'or et un reliquaire d\'argent ! Vos coffres débordent.'; } s.prestige -= 3; return 'La crypte était vide ; les gardes ont tout emporté.'; } },
        { l: 'Négocier avec les gardiens', d: '+20 or, +1 alliance possible', f: s => { s.gold += 20; if (s.alliances < s.P.maxAlliances && rand(s) < 0.35) { s.alliances++; return 'Les gardiens sont des chevaliers d\'un ordre discret : ils partagent et deviennent vos alliés.'; } return 'On partage le butin en bons termes.'; } },
      ] },
    { id: 'pretendant', w: 3, cond: s => s.rulers.length >= 2 && !(s.chains || []).length,
      text: () => 'Un jeune homme se présente à la cour : il affirme être le fils naturel de votre prédécesseur. Il en a les yeux, dit-on.',
      choices: [
        { l: 'Le reconnaître et l\'armer chevalier', d: '−10 or ; il pourrait servir… ou trahir', f: s => { s.gold -= 10; (s.chains = s.chains || []).push({ id: 'pretendant_2', at: s.turn + 3 }); return 'Il jure fidélité devant les barons.'; } },
        { l: 'L\'envoyer au monastère', d: '+2 prestige, −2 stabilité', f: s => { s.prestige += 2; s.stab -= 2; return 'Il prend l\'habit en serrant les dents.'; } },
        { l: 'Le chasser comme imposteur', d: '+1 stabilité', f: s => { s.stab += 1; return 'Il quitte le pays en jurant de revenir.'; } },
      ] },
    { id: 'pretendant_2', chain: true, w: 0, cond: ALL,
      text: s => { const loyal = rand(s) < 0.6; s._ctx = loyal ? 1 : 0; return loyal ? 'Le chevalier bâtard que vous avez reconnu revient de la frontière couvert de gloire : il a battu un parti ennemi et réclame un fief.' : 'Le chevalier bâtard que vous avez reconnu complote avec des barons mécontents : des lettres interceptées le prouvent.'; },
      choices: [
        { l: 'Agir selon son mérite', d: 'Fidèle : un fief et 15 soldats ; traître : le juger (+4 stabilité)', f: s => { if (s._ctx) { s.army += 15; s.prestige += 4; s.stab -= 2; return 'Il reçoit un fief et vous amène ses hommes.'; } s.stab += 4; s.prestige -= 2; return 'Il est jugé et banni ; les barons rentrent dans le rang.'; } },
        { l: 'Le marier dans une maison voisine', d: '−10 or, −15 menace', f: s => { s.gold -= 10; s.menace = Math.max(0, s.menace - 15); return 'Le voilà gendre d\'un voisin, et lié par serment à votre maison.'; } },
      ] },
    // ---------- La cour et le conseil ----------
    { id: 'conseiller_felon', w: 6, cond: s => Object.values(s.council || {}).some(id => s.people[id] && s.people[id].alive && s.people[id].loyal < 28),
      text: s => { const e = Object.entries(s.council).find(([k, id]) => s.people[id] && s.people[id].alive && s.people[id].loyal < 28); const p = s.people[e[1]]; s._ctx = p.id; s._seat = e[0];
        return e[0] === 'chancelier' ? `Votre chancelier ${p.name} puise dans le trésor : des livres de comptes truqués circulent à la cour.` : e[0] === 'marechal' ? `Votre maréchal ${p.name} réunit des capitaines en secret. On murmure qu'il prépare un coup de force.` : `Votre chapelain ${p.name} prêche contre vous en chaire et se répand en insinuations.`; },
      choices: [
        { l: 'Le destituer', d: 'La charge est vacante, −1 stabilité', f: s => { const p = s.people[s._ctx]; delete s.council[s._seat]; loyalty(s, p, -20); s.stab -= 1; bio(s, p, 'Est chassé du conseil.'); return `${p.name} rend son sceau, la rage au cœur.`; } },
        { l: 'Acheter sa fidélité', d: '−20 or, sa loyauté remonte', f: s => { const p = s.people[s._ctx]; s.gold -= 20; loyalty(s, p, 40); return `${p.name} accepte vos largesses… pour cette fois.`; } },
        { l: 'Le faire arrêter', d: '+2 stabilité, −7 prestige, la charge est vacante', f: s => { const p = s.people[s._ctx]; delete s.council[s._seat]; loyalty(s, p, -40); s.stab += 2; s.prestige -= 7; bio(s, p, 'Est jeté au cachot pour trahison.'); return `${p.name} croupit dans la tour. Les barons ont compris.`; } },
      ] },
    { id: 'conseil_preseance', w: 3, cond: s => Object.values(s.council || {}).filter(id => s.people[id] && s.people[id].alive).length >= 2,
      text: s => { const ids = Object.entries(s.council).filter(([k, id]) => s.people[id] && s.people[id].alive); const [a, b] = [ids[0], ids[1]]; s._a = a[1]; s._b = b[1];
        return `Querelle de préséance au conseil : ${s.people[a[1]].name} (${COUNCIL[a[0]].n.toLowerCase()}) et ${s.people[b[1]].name} (${COUNCIL[b[0]].n.toLowerCase()}) exigent chacun de siéger à votre droite.`; },
      choices: [
        { l: 'Donner raison au premier', d: 'Le premier +15 loyauté, le second −20', f: s => { loyalty(s, s.people[s._a], 15); loyalty(s, s.people[s._b], -20); return `${s.people[s._a].name} triomphe ; ${s.people[s._b].name} rumine sa honte.`; } },
        { l: 'Donner raison au second', d: 'Le second +15 loyauté, le premier −20', f: s => { loyalty(s, s.people[s._b], 15); loyalty(s, s.people[s._a], -20); return `${s.people[s._b].name} triomphe ; ${s.people[s._a].name} rumine sa honte.`; } },
        { l: 'Une table ronde', d: '−6 or, +8 loyauté pour les deux', f: s => { s.gold -= 6; loyalty(s, s.people[s._a], 8); loyalty(s, s.people[s._b], 8); return 'Le menuisier livre une table sans bout.'; } },
      ] },
    { id: 'voeu_croisade', w: 2, ew: [1.5, 1, 0.4], cond: s => age(s, ruler(s)) >= 18 && age(s, ruler(s)) <= 50 && !(s.chains || []).length,
      text: s => `Au sortir d'une fièvre, ${ruler(s).name} fait vœu de prendre la croix. Le légat du pape exulte ; les barons s'inquiètent.`,
      choices: [
        { l: 'Confirmer le vœu', d: '+3 prestige ; il faudra partir dans quelques années', f: s => { s.prestige += 3; (s.chains = s.chains || []).push({ id: 'voeu_croisade_2', at: s.turn + 3 }); return 'Une croix de drap rouge est cousue sur votre manteau.'; } },
        { l: 'Racheter le vœu', d: '−10 or, +2 stabilité', f: s => { s.gold -= 10; s.stab += 2; return 'L\'Église accepte votre aumône à la place du voyage.'; } },
      ] },
    { id: 'voeu_croisade_2', chain: true, w: 0, cond: ALL,
      text: s => `Le temps est venu d'honorer le vœu de croisade. Les navires attendent à Aigues-Mortes.`,
      choices: [
        { l: 'Partir en Terre sainte', d: '−30 % d\'armée, régence ; 60 % : +20 prestige et butin, sinon pertes', f: s => { s.army = Math.round(s.army * 0.7); const r = ruler(s); if (rand(s) < 0.6) { s.prestige += 20; s.gold += 40; bio(s, r, 'Revient de croisade couvert de gloire.'); return `${r.name} revient d'outremer couvert de gloire et chargé de soieries.`; } s.stab -= 6; if (rand(s) < 0.25) { kill(s, r, 'la dysenterie, en croisade'); return 'Le souverain meurt de dysenterie devant Damiette.'; } return 'L\'expédition tourne au désastre ; les survivants rentrent hagards.'; } },
        { l: 'Trahir son vœu', d: '−15 prestige, −4 stabilité', f: s => { s.prestige -= 15; s.stab -= 4; return 'Le pape fulmine ; les prêcheurs vous traitent de parjure.'; } },
      ] },
    { id: 'amour_secret', w: 2, cond: s => livingDyn(s).some(p => p.id !== s.rulerId && !p.spouse && age(s, p) >= 16 && age(s, p) <= 30) && !(s.chains || []).length,
      text: s => { const p = livingDyn(s).find(p => p.id !== s.rulerId && !p.spouse && age(s, p) >= 16 && age(s, p) <= 30); s._ctx = p.id; return `On surprend ${p.name} au verger, au bras d'${p.sex === 'M' ? 'une suivante' : 'un jeune écuyer'} sans fortune. ${p.sex === 'M' ? 'Il' : 'Elle'} jure que c'est l'amour de sa vie.`; },
      choices: [
        { l: 'Fermer les yeux', d: '+10 loyauté, +1 prestige (on aime les romances) ; la suite dira…', f: s => { const p = s.people[s._ctx]; loyalty(s, p, 10); s.prestige += 1; (s.chains = s.chains || []).push({ id: 'amour_secret_2', at: s.turn + 2, ctx: p.id }); return 'Le verger garde son secret.'; } },
        { l: 'Séparer les amants', d: '−10 loyauté, +3 stabilité', f: s => { const p = s.people[s._ctx]; loyalty(s, p, -10); s.stab += 3; return 'L\'amant est envoyé servir aux frontières.'; } },
      ] },
    { id: 'amour_secret_2', chain: true, w: 0, cond: s => { const p = s.people[s._chainCtx]; return p && p.alive && !p.spouse; },
      text: s => { const p = s.people[s._chainCtx]; s._ctx = p.id; return `${p.name} s'est marié${p.sex === 'F' ? 'e' : ''} en secret devant un prêtre de campagne. La cour est en émoi.`; },
      choices: [
        { l: 'Bénir l\'union', d: '−6 prestige, +20 loyauté, de beaux enfants', f: s => { const p = s.people[s._ctx]; s.prestige -= 6; loyalty(s, p, 20); marry(s, p, 'love'); return 'On célèbre enfin des noces au grand jour.'; } },
        { l: 'Faire casser le mariage', d: '−8 or, −20 loyauté, +3 prestige', f: s => { const p = s.people[s._ctx]; s.gold -= 8; s.prestige += 3; loyalty(s, p, -20); return 'L\'évêque annule l\'union ; le cœur brisé ne pardonnera pas.'; } },
      ] },
    // ---------- Les maisons voisines ----------
    { id: 'voisin_raid', w: 5, cond: s => neighborHouses(s).some(h => houseOf(s, h).rel <= -35),
      text: s => { const h = pick(s, neighborHouses(s).filter(h => houseOf(s, h).rel <= -35)); s._h = h; return `Les cavaliers de la maison ${h.replace(/^d(e |')/, '')}, qui vous haïssent, pillent vos villages frontaliers.`; },
      choices: [
        { l: 'Riposter', d: 'Il faut 30 soldats : −5 soldats, +4 prestige, relation −10', f: s => { relation(s, s._h, -10); if (s.army >= 30) { s.army -= 5; s.prestige += 4; return 'Vos chevaliers brûlent leurs granges en retour.'; } s.army -= 5; s.stab -= 4; return 'Votre riposte échoue ; la frontière brûle.'; } },
        { l: 'Payer pour la paix', d: '−15 or, relation +25', f: s => { s.gold -= 15; relation(s, s._h, 25); return 'Une bourse change de mains ; les pillards rentrent chez eux.'; } },
        { l: 'Endurer', d: '−10 or, −3 stabilité', f: s => { s.gold -= 10; s.stab -= 3; return 'Les paysans reconstruisent, maudissant leur seigneur.'; } },
      ] },
    { id: 'voisin_secours', w: 4, cond: s => s.menace >= 40 && neighborHouses(s).some(h => houseOf(s, h).rel >= 40),
      text: s => { const h = pick(s, neighborHouses(s).filter(h => houseOf(s, h).rel >= 40)); s._h = h; return `La maison ${h.replace(/^d(e |')/, '')}, votre amie, apprend que l'ennemi s'arme et vous offre ses lances.`; },
      choices: [
        { l: 'Accepter avec gratitude', d: '+15 soldats, relation −15 (une dette d\'honneur)', f: s => { s.army += 15; relation(s, s._h, -15); return 'Leurs bannières rejoignent les vôtres.'; } },
        { l: 'Proposer une alliance en règle', d: '−10 or, +1 alliance, relation −25', f: s => { s.gold -= 10; relation(s, s._h, -25); if (s.alliances < s.P.maxAlliances) { s.alliances++; return 'Un traité est scellé sur l\'Évangile.'; } s.prestige += 3; return 'Vos alliances sont déjà nombreuses ; on se jure amitié.'; } },
        { l: 'Décliner fièrement', d: '+3 prestige, relation +5', f: s => { s.prestige += 3; relation(s, s._h, 5); return 'Votre fierté est saluée.'; } },
      ] },
    { id: 'voisin_arbitrage', w: 3, cond: s => neighborHouses(s).length >= 2,
      text: s => { const hs = neighborHouses(s); const a = pick(s, hs), b = pick(s, hs.filter(x => x !== a)); s._a = a; s._b = b; return `Les maisons ${a.replace(/^d(e |')/, '')} et ${b.replace(/^d(e |')/, '')} se disputent un moulin et vous demandent d'arbitrer.`; },
      choices: [
        { l: 'Donner raison à la première', d: 'Relations : +25 / −25', f: s => { relation(s, s._a, 25); relation(s, s._b, -25); return `La maison ${s._a.replace(/^d(e |')/, '')} vous bénit ; l'autre jure vengeance.`; } },
        { l: 'Donner raison à la seconde', d: 'Relations : −25 / +25', f: s => { relation(s, s._a, -25); relation(s, s._b, 25); return `La maison ${s._b.replace(/^d(e |')/, '')} vous bénit ; l'autre jure vengeance.`; } },
        { l: 'Partager le moulin', d: '−8 or, +2 prestige, relations +5 / +5', f: s => { s.gold -= 8; s.prestige += 2; relation(s, s._a, 5); relation(s, s._b, 5); return 'Un jugement de Salomon, dit-on.'; } },
      ] },
    { id: 'voisin_noces', w: 3, cond: s => neighborHouses(s).some(h => houseOf(s, h).rel >= 25),
      text: s => { const h = pick(s, neighborHouses(s).filter(h => houseOf(s, h).rel >= 25)); s._h = h; return `La maison ${h.replace(/^d(e |')/, '')} vous invite aux noces de son héritier : trois jours de festin et de joutes.`; },
      choices: [
        { l: 'Y aller en grand équipage', d: '−15 or, +4 prestige, relation +15', f: s => { s.gold -= 15; s.prestige += 4; relation(s, s._h, 15); return 'Vos chevaliers brillent aux joutes.'; } },
        { l: 'Envoyer un cadeau', d: '−6 or, relation +6', f: s => { s.gold -= 6; relation(s, s._h, 6); return 'Un hanap d\'argent fait bonne impression.'; } },
        { l: 'Décliner', d: 'Relation −8', f: s => { relation(s, s._h, -8); return 'On remarque votre absence.'; } },
      ] },
    // ---------- Héritiers et transmission ----------
    { id: 'choix_regent', chain: true, w: 0, cond: s => !!s.regency,
      text: s => { const r = ruler(s), u = livingDyn(s).filter(p => p.id !== s.rulerId && p.sex === 'M' && age(s, p) >= 20).sort((a, b) => b.loyal - a.loyal)[0]; const m = person(s, r.other) || person(s, (person(s, r.parent) || {}).spouse); s._u = u ? u.id : null; s._m = m && m.alive ? m.id : null;
        return `${r.name} n'a que ${age(s, r)} ans. Qui gouvernera en son nom jusqu'à sa majorité ?${u ? ` Son oncle ${u.name} se dit prêt à porter ce fardeau.` : ''}`; },
      choices: [
        { l: 'La mère de l\'enfant', d: '+2 stabilité, puis +1/tour ; l\'ost s\'effrite un peu', f: s => { s.stab += 2; s.regency.by = 'mere'; s.regency.id = s._m; return s._m ? `${s.people[s._m].name} prend le sceau de régence d'une main ferme.` : 'Une parente prend le sceau de régence.'; } },
        { l: 'L\'oncle, homme d\'armes', d: '+6 soldats, puis +2/tour ; mais il pourrait convoiter le trône', f: s => { s.army += 6; if (s._u == null) { s.regency.by = 'conseil'; return 'Aucun oncle n\'est en âge : le conseil gouvernera.'; } s.regency.by = 'oncle'; s.regency.id = s._u; loyalty(s, s.people[s._u], 10); return `${s.people[s._u].name} gouverne au nom de ${ruler(s).sex === "F" ? "sa nièce" : "son neveu"}.`; } },
        { l: 'Un conseil de régence', d: '+8 or, puis +3 or/tour et −1 stabilité/tour', f: s => { s.gold += 8; s.regency.by = 'conseil'; return 'Le chancelier et les évêques se partagent le pouvoir.'; } },
      ] },
    { id: 'usurpation', chain: true, w: 0, cond: s => s.regency && s.regency.by === 'oncle' && s.people[s.regency.id] && s.people[s.regency.id].alive,
      text: s => { const u = s.people[s.regency.id]; s._u = u.id; return `Le régent ${u.name} réunit les barons : « Un enfant ne peut tenir ce royaume. » Il réclame la couronne pour lui-même.`; },
      choices: [
        { l: 'Le faire arrêter', d: 'Il faut 40 soldats fidèles : +5 prestige ; sinon −10 stabilité', f: s => { const u = s.people[s._u]; s.regency.by = 'conseil'; s.regency.id = null; if (s.army >= 40) { loyalty(s, u, -60); s.prestige += 5; bio(s, u, 'Est arrêté pour avoir convoité la couronne.'); return `${u.name} est jeté dans la tour. Le jeune souverain règne sous la garde du conseil.`; } s.stab -= 10; loyalty(s, u, -40); return `${u.name} s'enfuit avec ses fidèles ; le pays se déchire.`; } },
        { l: 'Acheter sa fidélité', d: '−35 or, sa loyauté remonte', f: s => { const u = s.people[s._u]; s.gold -= 35; loyalty(s, u, 35); return `${u.name} accepte terres et rentes, et jure à nouveau sur les Évangiles.`; } },
        { l: 'Lui céder la couronne', d: 'Il devient souverain (adulte), −8 prestige', f: s => { const u = s.people[s._u]; const kid = ruler(s); s.prestige -= 8; s.regency = null; becomeRuler(s, u); bio(s, kid, `Est écarté du trône par son oncle ${u.name}.`); loyalty(s, kid, -40); return `${u.name} est couronné. L'enfant écarté grandira dans l'ombre.`; } },
      ] },
    { id: 'freres_rivaux', w: 4, cond: s => { const h = heir(s); return h && age(s, h) >= 15 && livingDyn(s).some(p => p.id !== h.id && p.id !== s.rulerId && p.parent === h.parent && age(s, p) >= 14 && !p.spouse); },
      text: s => { const h = heir(s), b = livingDyn(s).find(p => p.id !== h.id && p.id !== s.rulerId && p.parent === h.parent && age(s, p) >= 14 && !p.spouse); s._ctx = h.id; s._b = b.id; return `${h.name} et ${b.name} en viennent aux mains dans la grande salle. ${b.name} ne supporte plus de n'être que ${b.sex === 'M' ? 'le cadet' : 'la cadette'}.`; },
      choices: [
        { l: 'Donner raison à l\'héritier', d: 'Le cadet −25 loyauté, +1 stabilité', f: s => { loyalty(s, s.people[s._b], -25); s.stab += 1; return 'La hiérarchie est rappelée ; le cadet ronge son frein.'; } },
        { l: 'Doter le cadet d\'un apanage', d: '−30 or, le cadet +30 loyauté', f: s => { s.gold -= 30; loyalty(s, s.people[s._b], 30); bio(s, s.people[s._b], 'Reçoit un apanage et des rentes.'); return 'Un château et des rentes apaisent le cadet.'; } },
        { l: 'L\'envoyer guerroyer au loin', d: '+4 prestige ; il peut ne jamais revenir', f: s => { const b = s.people[s._b]; s.prestige += 4; if (rand(s) < 0.3) { kill(s, b, 'tombé au loin, en Espagne'); return `${b.name} tombe face aux Maures. On le pleure en héros.`; } addTrait(b, 'brave'); return `${b.name} revient endurci et couvert de gloire.`; } },
      ] },
    { id: 'testament', w: 3, cond: s => age(s, ruler(s)) >= 50 && !s.testament && livingDyn(s).filter(p => p.id !== s.rulerId && p.parent === s.rulerId && age(s, p) >= 14).length >= 2,
      text: s => `${ruler(s).name} vieillit et dicte son testament. Faut-il tout laisser à l'aîné, ou prévoir pour chacun de ses enfants ?`,
      choices: [
        { l: 'Tout à l\'aîné', d: '+3 stabilité, les cadets −15 loyauté', f: s => { s.testament = 'aine'; s.stab += 3; for (const p of livingDyn(s)) if (p.parent === s.rulerId && heir(s) && p.id !== heir(s).id) loyalty(s, p, -15); return 'Le royaume restera d\'un seul tenant.'; } },
        { l: 'Des apanages pour les cadets', d: '−25 or, les cadets +25 loyauté, −2 stabilité', f: s => { s.testament = 'apanages'; s.gold -= 25; s.stab -= 2; for (const p of livingDyn(s)) if (p.parent === s.rulerId && heir(s) && p.id !== heir(s).id) loyalty(s, p, 25); return 'Chaque enfant aura son château ; les barons grincent.'; } },
        { l: 'Un legs à l\'Église', d: '−20 or, +8 prestige', f: s => { s.testament = 'eglise'; s.gold -= 20; s.prestige += 8; return 'Une abbaye priera à jamais pour votre âme.'; } },
      ] },
    { id: 'comete', w: 2, cond: ALL,
      text: () => 'Une comète traverse le ciel nocturne. Les prêcheurs y voient un présage.',
      choices: [
        { l: 'Ordonner des processions', d: '−10 or, +3 stabilité', f: s => { s.gold -= 10; s.stab += 3; return 'Les cloches sonnent dans tout le pays.'; } },
        { l: 'Y voir un signe de victoire', d: '+6 prestige, −1 stabilité, la prochaine campagne est plus forte', f: s => { s.stab -= 1; s.prestige += 6; s.omen = true; return 'Les chevaliers fourbissent leurs armes.'; } },
      ] },
    { id: 'duel', w: 3, cond: ALL,
      text: () => 'Un chevalier accuse votre sénéchal de trahison et réclame le duel judiciaire.',
      choices: [
        { l: 'Autoriser le duel', d: '50 % : +6 prestige ; sinon −4 prestige et −2 stabilité', f: s => { if (rand(s) < 0.5) { s.prestige += 6; return 'Le sénéchal l\'emporte : Dieu a parlé.'; } s.prestige -= 4; s.stab -= 2; return 'Le sénéchal tombe. Était-il donc traître ?'; } },
        { l: 'Juger en cour', d: '−15 or, +2 stabilité', f: s => { s.gold -= 15; s.stab += 2; return 'Les légistes rendent un jugement prudent.'; } },
      ] },
    { id: 'insulte', w: 4, cond: ALL,
      text: s => `La maison ${s.rival} moque publiquement votre lignage dans toutes les cours.`,
      choices: [
        { l: 'Exiger réparation', d: '+8 prestige, +12 menace', f: s => { s.prestige += 8; s.menace += 12; return 'Le gant est jeté.'; } },
        { l: 'Envoyer un présent', d: '−20 or, −15 menace', f: s => { s.gold -= 20; s.menace = Math.max(0, s.menace - 15); return 'Un faucon blanc apaise les esprits.'; } },
        { l: 'Mépriser l\'insulte', d: '−3 prestige', f: s => { s.prestige -= 3; return 'Les ménestrels en font une chanson.'; } },
      ] },
    { id: 'veuve', w: 3, cond: s => unmarriedAdults(s).some(p => p.sex === 'M'),
      text: s => { const p = unmarriedAdults(s).find(p => p.sex === 'M'); s._ctx = p.id; return `Une riche veuve de ${pick(s, ['Bourges', 'Troyes', 'Arras', 'Poitiers'])}, la quarantaine, cherche un époux. ${p.name} lui plaît.`; },
      choices: [
        { l: 'Accepter', d: '+40 or, −4 prestige, peu d\'enfants à espérer', f: s => { const p = s.people[s._ctx]; s.gold += 40; s.prestige -= 4; marry(s, p, 'local', { sex: 'F', name: pick(s, NAMES_F), from: 'vassal', born: s.year - ri(s, 38, 44), traits: [] }); return 'La dot est considérable.'; } },
        { l: 'Refuser', d: 'Rien', f: () => 'La veuve se console ailleurs.' },
      ] },
    { id: 'relique', w: 3, ew: [0.6, 1.5, 1], cond: s => !s.relic,
      text: () => 'Un moine itinérant propose un fragment de la Vraie Croix, scellé dans un reliquaire d\'or.',
      choices: [
        { l: 'Acheter la relique', d: '−25 or ; vraie ou fausse ?', f: s => { s.gold -= 25; s.relic = true; if (rand(s) < 0.5) { s.prestige += 15; s.trade = (s.trade || 0) + 2; return 'Les pèlerins affluent : la relique est vénérée.'; } s.prestige -= 5; return 'Un légat révèle la supercherie.'; } },
        { l: 'Refuser', d: 'Rien', f: () => 'Le moine repart vers une autre cour.' },
      ] },
    { id: 'mesalliance', w: 2, cond: s => livingDyn(s).some(p => p.id !== s.rulerId && !p.spouse && age(s, p) >= 16 && age(s, p) <= 40),
      text: s => { const p = livingDyn(s).find(p => p.id !== s.rulerId && !p.spouse && age(s, p) >= 16 && age(s, p) <= 40); s._ctx = p.id; return `${p.name} s'est marié${p.sex === 'F' ? 'e' : ''} en secret avec ${p.sex === 'F' ? 'un roturier' : 'une roturière'} !`; },
      choices: [
        { l: 'Reconnaître l\'union', d: '−6 prestige, +1 stabilité', f: s => { const p = s.people[s._ctx]; s.prestige -= 6; s.stab += 1; s.stats.marriages = (s.stats.marriages || 0) - 1; marry(s, p, 'local', { sex: p.sex === 'M' ? 'F' : 'M', name: pick(s, p.sex === 'M' ? NAMES_F : NAMES_M), from: 'vassal', born: s.year - clamp(age(s, p) + ri(s, -3, 3), 16, 45), traits: [] }); return 'Le peuple adore cette histoire.'; } },
        { l: 'Faire annuler le mariage', d: '−8 or, +2 prestige', f: s => { s.gold -= 8; s.prestige += 2; return 'Le pape accorde l\'annulation, moyennant finance.'; } },
      ] },
    { id: 'heritier_ost', w: 3, cond: s => { const h = heir(s); return h && age(s, h) >= 17 && age(s, h) <= 35 && s.army >= 20; },
      text: s => `${heir(s).name} réclame le commandement de l'ost pour faire ses preuves.`,
      choices: [
        { l: 'Lui confier l\'ost', d: '60 % : devient brave, +6 prestige ; 12 % : y laisse la vie', f: s => { const h = heir(s); if (rand(s) < 0.12) { kill(s, h, 'tombé à sa première bataille'); return 'Le jeune prince ne reviendra pas.'; } if (rand(s) < 0.68) { addTrait(h, 'brave'); s.prestige += 6; return `${h.name} revient couvert de gloire.`; } s.army -= 6; return 'Une escarmouche sans gloire.'; } },
        { l: 'Le garder à la cour', d: '−2 stabilité', f: s => { s.stab -= 2; return 'L\'héritier boude.'; } },
      ] },
  ];

  function famRisk(s, p, cause) { p *= Math.pow(0.6, edif(s, 'hopital')); for (const x of livingDyn(s)) if (rand(s) < p * tmul(x, 'death')) kill(s, x, cause); const r = ruler(s); if (r.spouse) { const sp = s.people[r.spouse]; if (sp && rand(s) < p) kill(s, sp, cause); } }
  function fertileWoman(s, w) { return w && w.alive && age(s, w) >= 16 && age(s, w) <= 40; }

  function drawEvent(s) {
    const era = eraOf(s);
    const hist = EVENTS.find(e => e.year && !s.done[e.id] && s.year >= e.year && s.year < e.year + 9);
    let e = null;
    if (s.chains && s.chains.length) { const c = s.chains.find(c => s.turn >= c.at); if (c) { s.chains = s.chains.filter(x => x !== c); s._chainCtx = c.ctx; const ce = EVENTS.find(x => x.id === c.id); if (ce && (!ce.cond || ce.cond(s))) e = ce; } }
    if (!e) e = hist;
    if (!e) {
      const av = EVENTS.filter(x => !x.year && !x.chain && x.cond(s) && (s.turn - (s.evLast[x.id] ?? -99)) >= s.P.evCooldown && (x.ew ? x.ew[era] : 1) > 0);
      if (!av.length) return null;
      const id = weighted(s, av.map(x => [x.id, x.w * (x.ew ? x.ew[era] : 1)]));
      e = EVENTS.find(x => x.id === id);
    }
    s.done[e.id] = true; s.evLast[e.id] = s.turn;
    s.stats.events++;
    return { id: e.id, hist: !!e.year, chain: !!e.chain, text: e.text(s), choices: e.choices.map(c => ({ l: c.l, d: c.d })) };
  }
  function resolveEvent(s, i) {
    if (!s.event) return;
    const e = EVENTS.find(x => x.id === s.event.id);
    const c = e.choices[i] || e.choices[0];
    const res = c.f(s);
    log(s, `${s.event.text.split('.')[0]}. → ${c.l} : ${res}`, 'ev');
    s.lastOutcome = { choice: c.l, text: res, id: s.event.id };
    s.event = null;
    afterChanges(s);
  }

  // ---------- Naissances ----------
  function birth(s, parent, motherRisk) {
    const sp = person(s, parent.spouse);
    const mother = parent.sex === 'F' ? parent : sp;
    const k = newPerson(s, { sex: rand(s) < 0.51 ? 'M' : 'F', born: s.year, parent: parent.id, other: sp ? sp.id : null });
    for (const t of [...parent.traits, ...(sp ? sp.traits : [])]) if (rand(s) < 0.25) addTrait(k, t);
    if (rand(s) < 0.4) randomTraits(s, k, k.traits.length + 1);
    s.stats.births++;
    bio(s, k, `Naît à ${k.place}.`); bio(s, parent, `Naissance de ${k.name}.`); if (sp) bio(s, sp, `Naissance de ${k.name}.`);
    if (parent.inDyn) log(s, `Naissance de ${k.name}, ${k.sex === 'M' ? 'fils' : 'fille'} de ${parent.title || parent.name}.`, 'good');
    if (mother && rand(s) < motherRisk) kill(s, mother, 'en couches');
    return k;
  }

  // ---------- Passage du temps ----------
  function worldTurn(s) {
    const P = s.P, r = ruler(s);
    // politiques
    s.polFx = {};
    for (const k of ['fisc', 'cour', 'ost']) { const f = policyFx(s, k, s.pol[k]); s.polFx[k] = f; s.gold += f.gold || 0; s.stab += f.stab || 0; s.prestige += f.prestige || 0; s.army += f.army || 0; }
    const polGold = Object.values(s.polFx).reduce((a, f) => a + (f.gold || 0), 0);
    // économie
    const inc = myRegions(s).reduce((a, r) => a + r.wealth, 0) + s.builds * P.incPerBuild + (s.mine && !s.mineSold ? 4 : 0) + (s.trade || 0) + edif(s, 'marche') * 3 + edif(s, 'moulin') - (s.corvee || 0) - (s.chantier ? 4 : 0) + tsum(r, 'inc') - Math.round(s.army * P.upkeep);
    s.gold += inc; s.lastIncome = inc + polGold;
    if (s.gold < 0) { s.stab -= P.debtStab; s.prestige -= 1; if (s.gold < -30) { s.army = Math.round(s.army * 0.85); log(s, 'Les soldats impayés désertent.', 'bad'); } }
    // dérive
    s.stab += tsum(r, 'stab') + (s.stab < 50 ? P.stabDrift : 0) - P.baron - Math.floor(s.domains / 7);
    s.prestige += tsum(r, 'prest') + (s.builds >= 4 ? 1 : 0) + (s.cathedral ? 1 : 0) + edif(s, 'abbaye') + edif(s, 'universite');
    s.army += edif(s, 'lices') * 2; s.stab += edif(s, 'hopital');
    councilTick(s); housesTick(s); regencyTick(s);
    if (s.chantier) { s.chantier--; if (!s.chantier) { s.cathedral = true; s.prestige += 35; log(s, 'Les flèches de la cathédrale s\'élèvent enfin vers le ciel. Toute la chrétienté en parle.', 'big'); } }
    for (const k in s.fat) { s.fat[k] *= P.fatigueDecay; if (s.fat[k] < 0.1) delete s.fat[k]; }
    const rl = (r.traits.includes('cruel') ? -2 : 0) + (r.traits.includes('charismatique') ? 2 : 0) + (s.pol.cour === 2 ? 1 : s.pol.cour === 0 ? -1 : 0);
    for (const q of livingDyn(s)) if (q.id !== s.rulerId && q.loyal != null) { q.loyal = clamp(q.loyal + (rand(s) < 0.5 ? Math.sign(50 - q.loyal) : 0) + rl + (q.temper === 'colerique' ? ri(s, -3, 1) : 0), 0, 100); }
    // menace extérieure
    s.menace += Math.round((ri(s, P.menaceMin, P.menaceMax) + (eraOf(s) === 2 ? 2 : 0)) * (s.rivalDown ? 0.5 : s.truce > s.turn ? 0.6 : 1)) - Math.floor(s.alliances / 2);
    if (s.menace > 40 && rand(s) < (s.menace - 40) / 80) invasion(s);
    mapLife(s);
    // naissances
    for (const p of livingDyn(s)) {
      const sp = person(s, p.spouse);
      if (!sp || !sp.alive) continue;
      const w = p.sex === 'F' ? p : sp;
      if (!fertileWoman(s, w)) continue;
      const f = P.birthRate * tmul(p, 'fert') * tmul(sp, 'fert') * (age(s, w) > 34 ? 0.6 : 1);
      if (rand(s) < f) birth(s, p, 0.03);
    }
    // mortalité
    s.year += P.ypt; s.turn++;
    const era = eraOf(s);
    if (era !== s.era) { s.era = era; (s.flashes = s.flashes || []).push({ type: 'era', era }); log(s, `${ERAS[era].name} commence. ${ERAS[era].desc}`, 'big'); }
    const all = Object.values(s.people).filter(p => p.alive && (p.inDyn || (p.spouse && s.people[p.spouse] && s.people[p.spouse].inDyn)));
    for (const p of all) {
      const y = baseMort(age(s, p)) * tmul(p, 'death');
      const q = 1 - Math.pow(1 - y, P.ypt);
      if (rand(s) < q) kill(s, p, age(s, p) < 5 ? 'maladie infantile' : age(s, p) > 60 ? 'grand âge' : pick(s, ['fièvre', 'chute de cheval', 'mal mystérieux', 'dysenterie', 'blessure infectée']));
    }
    afterChanges(s);
    if (!s.over) { const rr = ruler(s); if (!s.amb && age(s, rr) >= 14) assignAmbition(s, rr); checkAmbition(s); missionTick(s); afterChanges(s); }
    if (!s.over) (s.hist = s.hist || []).push({ y: s.year, d: s.domains, p: s.prestige, g: s.gold, a: s.army, st: Math.max(0, s.stab), r: rivalCount(s) });
  }

  const MISSIONS = {
    conquer: { issuer: 'roi', n: 'Étendre le royaume', make: s => s.domains + 1, goal: t => `Posséder ${t} terres`, prog: s => s.domains },
    treasure: { issuer: 'roi', n: 'L\'aide féodale', make: s => Math.max(80, Math.round((s.gold + 70) / 10) * 10), goal: t => `Réunir ${t} pièces d'or`, prog: s => s.gold },
    army: { issuer: 'roi', n: 'Le service d\'ost', make: s => Math.max(60, Math.round((s.army + 38) / 5) * 5), goal: t => `Entretenir ${t} soldats`, prog: s => s.army },
    prestige: { issuer: 'pape', n: 'La gloire de Dieu', make: s => s.prestige + 26, goal: t => `Atteindre ${t} de prestige`, prog: s => s.prestige },
    peace: { issuer: 'peuple', n: 'La paix des campagnes', make: s => 70, goal: t => `Porter la stabilité à ${t}`, prog: s => s.stab },
    alliance: { issuer: 'roi', n: 'Les grandes alliances', make: s => s.alliances + 1, goal: t => `Conclure ${t} alliance${t > 1 ? 's' : ''}`, prog: s => s.alliances },
    rivalLand: { issuer: 'roi', n: 'Châtier la maison rivale', base: s => s.stats.rivalTaken || 0, make: s => 1, goal: t => 'Prendre une terre à la maison rivale', prog: s => (s.stats.rivalTaken || 0) - ((s.mission && s.mission.base) || 0) },
    build: { issuer: 'pape', n: 'Bâtir pour Dieu', base: s => s.builds, make: s => 1, goal: t => 'Élever un nouvel édifice', prog: s => s.builds - ((s.mission && s.mission.base) || 0) },
    heir: { issuer: 'peuple', n: 'Un enfant pour la maison', base: s => s.stats.births || 0, make: s => 1, goal: t => 'Voir naître un enfant dans la famille', prog: s => (s.stats.births || 0) - ((s.mission && s.mission.base) || 0) },
    vassal: { issuer: 'roi', n: 'L\'hommage des seigneurs', base: s => s.stats.vassals || 0, make: s => 1, goal: t => `Recevoir l'hommage d'un seigneur`, prog: s => (s.stats.vassals || 0) - ((s.mission && s.mission.base) || 0) },
  };
  const ISSUERS = { roi: { n: 'Le roi de France', win: 'Le roi vous accorde sa faveur : +1 alliance, −15 menace, +8 prestige.', lose: 'Le roi vous tient pour un vassal négligent : −8 prestige, +10 menace.' }, pape: { n: 'Le pape', win: 'Le pape vous bénit : +15 prestige, +4 stabilité.', lose: 'Rome se détourne de vous : −8 prestige, −4 stabilité.' }, peuple: { n: 'Les états du pays', win: 'Le peuple acclame son seigneur : +8 stabilité, +25 or de dons.', lose: 'Le peuple se sent trahi : −8 stabilité.' } };
  function missionTick(s) {
    const P = s.P, m = s.mission;
    if (m) {
      const M = MISSIONS[m.k], prog = M.prog(s);
      m.prog = prog;
      const won = prog >= m.target;
      if (won || s.turn >= m.deadline) {
        const I = ISSUERS[M.issuer];
        if (won) { if (M.issuer === 'roi') { s.alliances = Math.min(P.maxAlliances, s.alliances + 1); s.menace = Math.max(0, s.menace - 15); s.prestige += 8; } else if (M.issuer === 'pape') { s.prestige += 15; s.stab += 4; } else { s.stab += 8; s.gold += 25; } s.stats.missionsWon = (s.stats.missionsWon || 0) + 1; }
        else { if (M.issuer === 'roi') { s.prestige -= 8; s.menace += 10; } else if (M.issuer === 'pape') { s.prestige -= 8; s.stab -= 4; } else s.stab -= 8; s.stats.missionsLost = (s.stats.missionsLost || 0) + 1; }
        log(s, `${I.n} : « ${M.n} » ${won ? 'accompli' : 'échoué'}. ${won ? I.win : I.lose}`, won ? 'good' : 'bad');
        (s.flashes = s.flashes || []).push({ type: 'mission', won, k: m.k, target: m.target });
        s.mission = null; s.lastMission = s.turn;
      }
      return;
    }
    if (s.turn - (s.lastMission ?? -3) >= 3 && rand(s) < P.missionChance) {
      const keys = Object.keys(MISSIONS).filter(k => !(k === 'peace' && s.stab >= 65) && !(k === 'alliance' && s.alliances >= P.maxAlliances) && !(k === 'vassal' && !borderTargets(s).some(r => r.owner !== 'rival')) && !(k === 'rivalLand' && (s.rivalDown || !borderTargets(s).some(r => r.owner === 'rival'))) && !(k === 'build' && !getActions(s).some(a => a.id === 'construire')) && !(k === 'heir' && !livingDyn(s).some(p => p.spouse && age(s, p) >= 16 && age(s, p) <= 40 && s.people[p.spouse] && s.people[p.spouse].alive)) && k !== s.lastMissionK);
      const k = pick(s, keys), M = MISSIONS[k];
      s.mission = { k, base: M.base ? M.base(s) : 0, target: M.make(s), start: s.turn, deadline: s.turn + P.missionTurns, issuer: M.issuer, prog: 0 }; s.mission.prog = M.prog(s);
      s.lastMissionK = k;
      log(s, `${ISSUERS[M.issuer].n} vous adresse un mandement : « ${M.n} ». ${M.goal(s.mission.target)} avant l'an ${s.year + P.missionTurns * P.ypt}.`, 'big');
      (s.flashes = s.flashes || []).push({ type: 'missionNew', k });
    }
  }
  function newRivalLord(s, heirOf) {
    const L = { name: pick(s, NAMES_M), sex: 'M', born: s.year - (heirOf ? ri(s, 18, 34) : ri(s, 30, 46)), traits: [], temper: pick(s, Object.keys(TEMPERS)), passion: pick(s, PASSIONS), mark: pick(s, MARKS), face: 'rl' + s.nextId++ + ri(s, 0, 999) };
    let n = 0; while (L.traits.length < 2 && n++ < 10) { const t = weighted(s, BIRTH_TRAITS); if (canHave(L, t)) L.traits.push(t); }
    L.n = (s.rivalLords || 0) + 1; s.rivalLords = L.n;
    return L;
  }
  function rivalAggro(s) { const L = s.rivalLord; if (!L) return 1; let f = 1; if (L.traits.includes('brave') || L.traits.includes('cruel')) f *= 1.4; if (L.traits.includes('sage') || L.traits.includes('pieux')) f *= 0.75; if (L.traits.includes('couard')) f *= 0.6; if (L.temper === 'colerique') f *= 1.2; if (L.temper === 'flegmatique') f *= 0.85; return f; }
  function rivalLordTick(s) {
    const L = s.rivalLord; if (!L || s.rivalDown) return;
    const a = s.year - L.born, y = baseMort(a) * tmul(L, 'death');
    if (rand(s) < 1 - Math.pow(1 - y, s.P.ypt)) {
      const old = L; s.rivalLord = newRivalLord(s, true);
      s.menace = Math.max(0, s.menace - 10);
      log(s, `${old.name} ${s.rival} meurt à ${a} ans. Son fils ${s.rivalLord.name} prend la tête de la maison rivale.`, 'big');
      (s.mapNews = s.mapNews || []).push({ t: `Le seigneur ${old.name} ${s.rival} est mort. ${s.rivalLord.name}, ${s.rivalLord.traits.map(t => TRAITS[t].n.toLowerCase()).join(' et ') || 'inconnu'}, lui succède.`, k: 'rival' });
    }
  }
  function mapLife(s) {
    const P = s.P, g = mapGeom(s.seed), era = eraOf(s);
    s.mapNews = [];
    rivalLordTick(s);
    if (!s.rivalDown && !(s.truce > s.turn) && rand(s) < (P.rivalExpand + era * 0.04) * rivalAggro(s)) {
      const cands = s.regions.filter(r => r.owner !== 'me' && r.owner !== 'rival' && g.adj[r.i].some(j => s.regions[j].owner === 'rival')).sort((a, b) => a.def - b.def);
      const t = cands[0];
      if (t) { const old = t.owner; t.owner = 'rival'; t.def += 4; t.flip = s.year; s.menace += 4; s.mapNews.push({ i: t.i, t: `La maison ${s.rival} s'empare de ${t.name}, arrachée à la maison ${old.replace(/^d(e |')/, '')}.`, k: 'rival' }); log(s, s.mapNews[s.mapNews.length - 1].t, 'bad'); }
    }
    if (rand(s) < P.lordWar) {
      const pairs = []; s.regions.forEach(r => { if (r.owner === 'me' || r.owner === 'rival') return; for (const j of g.adj[r.i]) { const o = s.regions[j]; if (o.owner !== 'me' && o.owner !== 'rival' && o.owner !== r.owner) pairs.push([r, o]); } });
      if (pairs.length) { const wp = pairs.flatMap(pr => houseOf(s, pr[0].owner).mood === 'belliqueuse' ? [pr, pr, pr] : [pr]); const [a, b] = pick(s, wp); const old = b.owner; b.owner = a.owner; b.flip = s.year; s.mapNews.push({ i: b.i, t: `Guerre entre seigneurs : la maison ${a.owner.replace(/^d(e |')/, '')} prend ${b.name} à la maison ${old.replace(/^d(e |')/, '')}.`, k: 'lords' }); log(s, s.mapNews[s.mapNews.length - 1].t); }
    }
  }
  function invasion(s) {
    const P = s.P;
    s.stats.invasions++;
    const enemy = (P.invadeBase + s.menace * 0.35 + (s.year - P.startYear) * P.invadeGrowth) * (0.7 + rand(s) * 0.6) * (s.rivalDown ? 0.8 : 1 + (rivalCount(s) - 4) * 0.06);
    const def = s.army * milPower(s) * 1.15 * [0.8, 1, 1.3][s.pol.ost] + s.alliances * P.allianceDef + s.builds * P.buildDef + edif(s, 'donjon') * 6 + s.domains * 1.5;
    const isRival = !s.rivalDown && rand(s) < 0.55;
    const foe = isRival ? `L'ost de la maison ${s.rival}` : pick(s, ['L\'ost anglais', 'Le comte de Flandre', 'L\'armée impériale', 'Une grande compagnie de routiers', 'L\'ost aragonais']);
    const a0 = s.army;
    (s.flashes = s.flashes || []).push({ type: 'battle', kind: 'invasion', won: def > enemy, tgt: foe, rival: isRival, ours: Math.round(def), enemy: Math.round(enemy), loss: 0 });
    const fl = s.flashes[s.flashes.length - 1];
    { const g = mapGeom(s.seed); const src = s.regions.find(r => r.owner !== 'me' && (isRival ? r.owner === 'rival' : r.owner !== 'rival') && g.adj[r.i].some(j => s.regions[j].owner === 'me')) || s.regions.find(r => r.owner !== 'me'); fl.from = src ? src.i : null; fl.to = (myRegions(s).find(r => g.adj[r.i].includes(fl.from)) || myRegions(s)[0] || {}).i; }
    if (def > enemy) {
      s.stats.invRepelled++; s.prestige += 6; s.army = Math.round(s.army * 0.88); s.menace = 15;
      fl.loss = a0 - s.army;
      log(s, `${foe} envahit vos terres… et se fait repousser !`, 'good');
    } else {
      const take = rand(s) < s.P.invadeTake || s.domains <= 1;
      const lostR = take ? loseRegion(s, isRival ? 'rival' : pick(s, HOUSES.filter(h => h !== s.house && h !== s.rival))) : null; fl.region = lostR ? lostR.i : null; fl.pillage = !take;
      if (!take) { s.gold -= 20; }
      s.stab -= take ? 12 : 8; s.army = Math.round(s.army * 0.7); s.menace = 25; s.prestige -= 5;
      fl.loss = a0 - s.army; s.lastLoss = s.year;
      log(s, take ? `${foe} ravage le pays et s'empare de ${lostR ? lostR.name : 'un domaine'}.` : `${foe} pille vos terres puis se retire, chargé de butin.`, 'bad');
      if (s.domains <= 0) endGame(s, false, 'conquete', `Le dernier domaine tombe. La maison ${s.house} est dépossédée.`);
    }
  }

  function afterChanges(s) {
    s.stab = clamp(Math.round(s.stab), -50, 100);
    s.army = Math.max(0, Math.round(s.army));
    s.gold = Math.round(s.gold);
    s.prestige = Math.round(s.prestige);
    if (s.over) return;
    if (s.pendingSuccession) succession(s);
    if (s.over) return;
    if (s.stab <= 0) {
      endGame(s, false, 'revolte', `Les barons se soulèvent et déposent ${fullName(s, ruler(s))}. La maison ${s.house} perd la couronne.`);
    }
  }

  function endGame(s, won, cause, msg) {
    s.over = true; s.result = { won, cause, msg, score: score(s) };
    log(s, msg, won ? 'good' : 'bad');
  }
  function score(s) {
    return Math.max(0, Math.round(s.prestige + s.domains * 20 + s.builds * 5 + (s.year - s.P.startYear) * 1 + s.rulers.length * 5 + (s.stats.ambitions || 0) * 15 + (s.unified ? 150 + (s.P.endYear - s.year) * 2 : 0) + (s.rivalDown ? 60 : 0) + (s.stats.missionsWon || 0) * 10));
  }

  // Tour complet : action, puis passage du temps, puis tirage d'un événement
  function playTurn(s, actionId, arg, arg2) {
    if (s.over || s.event) return;
    doAction(s, actionId, arg, arg2);
    afterChanges(s);
    if (s.over) return;
    worldTurn(s);
    if (s.over) return;
    if (s.domains >= s.P.unifyAt) { s.unified = true; endGame(s, true, 'unification', `L'an ${s.year} : ${s.domains} terres sur ${s.regions.length} obéissent à la maison ${s.house}. Le royaume est unifié sous une seule bannière !`); return; }
    if (s.year >= s.P.endYear) { endGame(s, true, 'victoire', `L'an ${s.year} : la maison ${s.house} règne depuis ${s.year - s.P.startYear} ans. Sa légende est assurée !`); return; }
    const chainDue = (s.chains || []).some(c => s.turn >= c.at);
    const histDue = chainDue || EVENTS.some(e => e.year && !s.done[e.id] && s.year >= e.year && s.year < e.year + 9);
    if (!s.aiMode && (histDue || rand(s) < s.P.eventChance)) s.event = drawEvent(s);
  }

  // ---------- Mode chronique libre : conséquences proposées par l'IA ----------
  const AI_BOUNDS = { or: 40, stabilite: 12, prestige: 12, soldats: 20, menace: 25 };
  function histDueEvent(s) { return EVENTS.find(e => e.year && !s.done[e.id] && s.year >= e.year && s.year < e.year + 9) || null; }
  function markHistDone(s, id) { s.done[id] = true; }
  function applyAI(s, r) {
    const out = [];
    const e = r.effets || {};
    const cl = (k) => clamp(Math.round(+e[k] || 0), -AI_BOUNDS[k], AI_BOUNDS[k]);
    s.gold += cl('or'); s.stab += cl('stabilite'); s.prestige += cl('prestige'); s.army = Math.max(0, s.army + cl('soldats')); s.menace = Math.max(0, s.menace + cl('menace'));
    if (Array.isArray(r.traits)) for (const t of r.traits.slice(0, 2)) {
      const p = s.people[t && t.id]; if (!p || !p.alive) continue;
      if (t.ajout && TRAITS[t.ajout] && addTrait(p, t.ajout)) out.push(`${p.name} devient ${TRAITS[t.ajout].n.toLowerCase()}.`);
      if (t.retrait && p.traits.includes(t.retrait)) { p.traits = p.traits.filter(x => x !== t.retrait); out.push(`${p.name} n'est plus ${TRAITS[t.retrait].n.toLowerCase()}.`); }
    }
    if (r.mort && s.people[r.mort.id]) {
      const p = s.people[r.mort.id];
      if (p.alive && (p.inDyn || p.spouse)) kill(s, p, String(r.mort.cause || 'mort mystérieuse').slice(0, 60));
    }
    log(s, `${r.titre ? r.titre + ' : ' : ''}${r.resume || ''}`, 'ev');
    afterChanges(s);
    return out;
  }

  function rank(sc) {
    return sc >= 850 ? 'Empire légendaire' : sc >= 750 ? 'Grande dynastie' : sc >= 650 ? 'Royaume prospère' : sc >= 550 ? 'Maison respectée' : 'Lignée modeste';
  }

  const api = { EDU_PATHS, eduChance, STANCES, TACTICS, stanceOf, scoutReport, tacticMult, ruseBonus, MOODS, houseOf, neighborHouses, relation, relLabel, giftCost, sendGift, COUNCIL, councilOf, seatSkill, councilCandidates, appoint, councilFx, autoCouncil, BUILDINGS, buildTypes, edif, MISSIONS, ISSUERS, rivalAggro, newRivalLord, vassalCost, vassalOdds, rivalCount, mapGeom, borderTargets, campaignOdds, regionEnemy, myRegions, initRegions, syncDomains, TEMPERS, RANKS, marriageMarket, candidateFx, willLeave, applyAI, histDueEvent, markHistDone, AI_BOUNDS, POLICIES, policyFx, setPolicy, ERAS, eraOf, AMBITIONS, ambitionProgress, eff, DEFAULT_P, TRAITS, EVENTS, createGame, getActions, marriageOptions, playTurn, resolveEvent, ruler, heir, successionLine, livingDyn, unmarriedAdults, age, person, fullName, score, rank, rand, childrenOf };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Dyn = api;
})(typeof window !== 'undefined' ? window : this);
