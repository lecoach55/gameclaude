// Moteur de "Couronnes & Lignées" — simulation dynastique
// Utilisable dans Node (module.exports) et dans le navigateur (window.Dyn)
(function (root) {
  'use strict';

  const DEFAULT_P = {
    ypt: 3, startYear: 1200, endYear: 1350,
    startGold: 50, startArmy: 30, startStab: 60, startPrestige: 10, startDomains: 5,
    incPerDomain: 3, incPerBuild: 3, upkeep: 0.2,
    taxGain: 18, taxStab: 9,
    feastCost: 15, feastStab: 9, feastPrest: 3,
    recruitCost: 20, recruitArmy: 15,
    buildCost: 35, buildStep: 16, buildPrest: 4,
    eduCost: 10, envoyCost: 10, envoyMenace: 18,
    campMin: 20, campDomain: 3, campStab: 4, campBase: 22, campGrowth: 0.12, campDeath: 0.07,
    menaceMin: 4, menaceMax: 13, invadeBase: 20, invadeGrowth: 2.3,
    birthRate: 0.55, eventChance: 0.92,
    stabDrift: 1, debtStab: 6, succStab: 6, crisisStab: 12, regencyStab: 8,
    allianceDef: 8, adoptCost: 30,
    fiscRate: [0.4, 1.5, 3], fiscStab: [2, 0, -4], courCost: [0, 4, 10], courStab: [-1, 1, 3], courPrest: [0, 0, 1], levy: 10, intrigueCost: 15, baron: 3,
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
    bouclier: { n: 'Bouclier', ep: ['le Bouclier', 'la Gardienne'], goal: 'Repousser une invasion', need: 1, t: ['robuste', 'brave'] },
  };
  function assignAmbition(s, p) {
    const list = Object.keys(AMBITIONS).map(k => [k, 1 + (AMBITIONS[k].t.some(t => p.traits.includes(t)) ? 3 : 0)]);
    const k = weighted(s, list);
    s.amb = { k, p0: s.prestige, w0: s.stats.warsWon, b0: s.builds, m0: s.stats.marriages || 0, i0: s.stats.invRepelled, done: false, prog: 0 };
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
    if (!p.name) p.name = pick(s, p.sex === 'M' ? NAMES_M : NAMES_F);
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

  // ---------- Actions ----------
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
    a.push({ id: 'campagne', g: 'guerre', label: 'Partir en campagne', desc: `Conquérir un domaine, armée ≥ ${P.campMin}`, ok: s.army >= P.campMin && rAge >= 16 });
    a.push({ id: 'ambassade', g: 'guerre', label: 'Ambassade', desc: `−${P.envoyCost} or, −${Math.round(P.envoyMenace * eff(s, 'ambassade'))} menace${s.alliances < P.maxAlliances ? ', chance d\'alliance' : ''}`, ok: s.gold >= P.envoyCost, eff: eff(s, 'ambassade') });
    a.push({ id: 'intrigue', g: 'guerre', label: 'Intriguer', desc: `−${P.intrigueCost} or ; 55 % : −25 menace ; 20 % : scandale`, ok: s.gold >= P.intrigueCost, eff: eff(s, 'intrigue') });
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
        const B = ['une abbaye', 'un marché couvert', 'un pont de pierre', 'un donjon', 'une cathédrale', 'un moulin', 'des remparts', 'une université'];
        log(s, `${fullName(s, r)} fait bâtir ${pick(s, B)}.`); break;
      }
      case 'ambassade': {
        s.gold -= P.envoyCost; s.menace = Math.max(0, s.menace - Math.round(P.envoyMenace * e));
        if (s.alliances < P.maxAlliances && rand(s) < 0.25 * e) { s.alliances++; log(s, `Vos émissaires reviennent avec un traité d'alliance de la maison ${pick(s, HOUSES.filter(h => h !== s.house && h !== s.rival))}.`, 'good'); }
        else log(s, `Des émissaires apaisent la maison ${s.rival}.`); break;
      }
      case 'eduquer': {
        s.gold -= P.eduCost; const h = heir(s);
        const fix = h.traits.find(t => EDU_FIX.includes(t));
        if (fix && rand(s) < 0.5) { h.traits = h.traits.filter(t => t !== fix); log(s, `Les précepteurs corrigent le défaut de ${h.name} (${TRAITS[fix].n}).`, 'good'); }
        else if (rand(s) < (s.univ ? 0.8 : 0.55)) {
          const opts = EDU_GOOD.filter(t => canHave(h, t));
          if (opts.length && h.traits.length < 4) { const t = pick(s, opts); addTrait(h, t); loyalty(s, h, 5); bio(s, h, `Ses maîtres le rendent ${TRAITS[t].n.toLowerCase()}.`); log(s, `${h.name} devient ${TRAITS[t].n.toLowerCase()} grâce à ses maîtres.`, 'good'); }
          else log(s, `${h.name} n'a plus rien à apprendre.`);
        } else log(s, `L'éducation de ${h.name} ne porte pas ses fruits.`);
        break;
      }
      case 'campagne': campaign(s); break;
      case 'attendre': break;
      case 'intrigue': {
        s.gold -= P.intrigueCost; const x = rand(s);
        if (x < 0.55 * (0.5 + e / 2)) { s.menace = Math.max(0, s.menace - 25); s.prestige += 3; log(s, `Vos agents retournent le sénéchal de la maison ${s.rival}. Ses plans d'invasion s'effondrent.`, 'good'); }
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

  function milPower(s) {
    const r = ruler(s);
    const m = age(s, r) < 16 ? -1 : tsum(r, 'mil');
    return 1 + m / 10;
  }
  function campaign(s) {
    const P = s.P, r = ruler(s);
    s.stats.wars++;
    s.stab -= P.campStab;
    const enemy = (P.campBase + (s.year - P.startYear) * P.campGrowth + s.domains * P.campDomain) * (0.7 + rand(s) * 0.6);
    const ours = s.army * milPower(s) * (0.7 + rand(s) * 0.6) * (s.omen ? 1.3 : 1) + s.alliances * 3; s.omen = false;
    const tgt = pick(s, ['le comté voisin', 'une baronnie rebelle', 'les marches de l\'Est', 'une seigneurie ecclésiastique', `un fief de la maison ${s.rival}`]);
    const a0 = s.army, won = ours > enemy;
    if (won) {
      s.stats.warsWon++; s.domains++; s.prestige += 10; s.gold += 12; s.army = Math.round(s.army * 0.82);
      log(s, `Victoire ! ${fullName(s, r)} s'empare de ${tgt}.`, 'good');
    } else {
      s.army = Math.round(s.army * 0.6); s.stab -= 10; s.prestige -= 4;
      log(s, `Défaite devant ${tgt}. L'ost rentre décimé.`, 'bad');
    }
    (s.flashes = s.flashes || []).push({ type: 'battle', kind: 'campagne', won, tgt, rival: /maison/.test(tgt), loss: a0 - s.army, ours: Math.round(ours), enemy: Math.round(enemy) });
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
    if (age(s, h) < 16) { s.stab -= P.regencyStab; msg += ' Une régence est instaurée.'; }
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
        { l: 'Prendre part à la croisade', d: '60 % : +1 domaine, +8 prestige ; sinon l\'ost est saigné', f: s => { s.stab -= 4; if (s.army >= 20 && rand(s) < 0.6) { s.domains++; s.prestige += 8; s.army = Math.round(s.army * 0.8); return 'Un fief languedocien vous revient.'; } s.army = Math.round(s.army * 0.65); return 'Les sièges s\'éternisent devant Carcassonne et l\'ost rentre décimé.'; } },
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
        { l: 'Écraser dans le sang', d: 'Il faut 40 soldats : −10 soldats, +6 stabilité, −5 prestige', f: s => { s.prestige -= 5; if (s.army >= 40) { s.army -= 10; s.stab += 6; return 'Les meneurs pendent aux arbres des routes.'; } s.army -= 12; s.stab -= 15; return 'Vos hommes sont balayés ; le feu gagne.'; } },
        { l: 'Abolir des corvées', d: '+12 stabilité, −2 or par tour pour toujours', f: s => { s.stab += 12; s.corvee = (s.corvee || 0) + 2; return 'Les serfs rentrent chez eux, plus libres.'; } },
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
        { l: 'Vendre la concession', d: '+15 or', f: s => { s.gold += 15; s.mine = true; s.mineSold = true; return 'Un banquier lombard achète le filon.'; } },
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
        { l: 'Les enrôler', d: '+10 soldats, −5 stabilité', f: s => { s.army += 10; s.stab -= 5; return 'Les coupe-jarrets portent vos couleurs. Les villageois s\'inquiètent.'; } },
        { l: 'Payer les chefs', d: '−10 or', f: s => { s.gold -= 10; return 'Les brigands partent… ailleurs.'; } },
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
        { l: 'Refuser', d: 'Rien', f: () => 'Le moine retourne à son scriptorium.' },
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
        { l: 'Accepter', d: '+15 or, +1 alliance', f: s => { const p = s.people[s._ctx]; s.gold += 35; marry(s, p, 'alliance', s._cand); return 'Les noces sont célébrées.'; } },
        { l: 'Refuser', d: '−2 prestige', f: s => { s.prestige -= 2; return 'L\'offense est notée.'; } },
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
        { l: 'Vendre des terres', d: '−1 domaine, +40 or', f: s => { if (s.domains > 1) { s.domains--; s.gold += 40; return 'Un domaine est cédé.'; } s.stab -= 10; return 'Il n\'y a plus rien à vendre…'; } },
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
        { l: 'Lui offrir les meilleurs maîtres', d: '−20 or, 50 % génie, sinon sage', f: s => { const k = s.people[s._ctx]; s.gold -= 20; const t = rand(s) < 0.5 ? 'genie' : 'sage'; if (addTrait(k, t)) return `${k.name} devient ${TRAITS[t].n.toLowerCase()}.`; return 'L\'enfant progresse.'; } },
        { l: 'L\'envoyer au monastère', d: '+5 prestige, l\'enfant devient pieux', f: s => { const k = s.people[s._ctx]; s.prestige += 5; addTrait(k, 'pieux'); return `${k.name} apprend la règle de saint Benoît.`; } },
      ] },
    { id: 'conseil_conjoint', w: 3, cond: s => { const sp = person(s, ruler(s).spouse); return sp && sp.alive && age(s, ruler(s)) >= 18; },
      text: s => { const sp = person(s, ruler(s).spouse); return `${sp.name} demande à siéger au conseil. ${sp.sex === 'F' ? 'Elle' : 'Il'} a l'oreille des marchands et des ambassadeurs.`; },
      choices: [
        { l: 'Lui confier le trésor', d: '+25 or, −3 stabilité', f: s => { s.gold += 25; s.stab -= 3; return 'Les comptes n\'ont jamais été si bien tenus. Les barons jasent.'; } },
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
        { l: 'Lancer le chantier', d: '−20 or, puis −5 or par tour pendant 6 tours ; à la fin +25 prestige et +1 prestige par tour', f: s => { s.gold -= 20; s.chantier = 6; return 'Les maîtres d\'œuvre tracent le plan au sol.'; } },
        { l: 'Une simple église suffira', d: '−5 or, +2 prestige', f: s => { s.gold -= 5; s.prestige += 2; return 'Une belle église romane s\'élève.'; } },
      ] },
    { id: 'condottiere', w: 4, ew: [0.3, 0.6, 1.8], cond: ALL,
      text: s => `Un capitaine de grande compagnie offre ses lances. Il propose aussi de ravager les terres de la maison ${s.rival}.`,
      choices: [
        { l: 'L\'engager', d: '−30 or, +30 soldats', f: s => { s.gold -= 30; s.army += 30; return 'Ses routiers campent sous vos murs.'; } },
        { l: 'Le payer pour frapper le rival', d: '−25 or, −30 menace', f: s => { s.gold -= 25; s.menace = Math.max(0, s.menace - 30); return `Les terres de la maison ${s.rival} brûlent.`; } },
        { l: 'Le chasser', d: '−5 soldats, +10 menace', f: s => { s.army -= 5; s.menace += 10; return 'Il part… chez votre rival.'; } },
      ] },
    { id: 'comete', w: 2, cond: ALL,
      text: () => 'Une comète traverse le ciel nocturne. Les prêcheurs y voient un présage.',
      choices: [
        { l: 'Ordonner des processions', d: '−8 or, +4 stabilité', f: s => { s.gold -= 8; s.stab += 4; return 'Les cloches sonnent dans tout le pays.'; } },
        { l: 'Y voir un signe de victoire', d: '−2 stabilité, la prochaine campagne est plus forte', f: s => { s.stab -= 2; s.omen = true; return 'Les chevaliers fourbissent leurs armes.'; } },
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
        { l: 'Accepter', d: '+40 or, mais peu d\'enfants à espérer', f: s => { const p = s.people[s._ctx]; s.gold += 40; marry(s, p, 'local', { sex: 'F', name: pick(s, NAMES_F), from: 'vassal', born: s.year - ri(s, 38, 44), traits: [] }); return 'La dot est considérable.'; } },
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
        { l: 'Reconnaître l\'union', d: '−6 prestige, +3 stabilité', f: s => { const p = s.people[s._ctx]; s.prestige -= 6; s.stab += 3; s.stats.marriages = (s.stats.marriages || 0) - 1; marry(s, p, 'local', { sex: p.sex === 'M' ? 'F' : 'M', name: pick(s, p.sex === 'M' ? NAMES_F : NAMES_M), from: 'vassal', born: s.year - clamp(age(s, p) + ri(s, -3, 3), 16, 45), traits: [] }); return 'Le peuple adore cette histoire.'; } },
        { l: 'Faire annuler le mariage', d: '−15 or, −2 stabilité', f: s => { s.gold -= 15; s.stab -= 2; return 'Le pape accorde l\'annulation, moyennant finance.'; } },
      ] },
    { id: 'heritier_ost', w: 3, cond: s => { const h = heir(s); return h && age(s, h) >= 17 && age(s, h) <= 35 && s.army >= 20; },
      text: s => `${heir(s).name} réclame le commandement de l'ost pour faire ses preuves.`,
      choices: [
        { l: 'Lui confier l\'ost', d: '60 % : devient brave, +6 prestige ; 12 % : y laisse la vie', f: s => { const h = heir(s); if (rand(s) < 0.12) { kill(s, h, 'tombé à sa première bataille'); return 'Le jeune prince ne reviendra pas.'; } if (rand(s) < 0.68) { addTrait(h, 'brave'); s.prestige += 6; return `${h.name} revient couvert de gloire.`; } s.army -= 6; return 'Une escarmouche sans gloire.'; } },
        { l: 'Le garder à la cour', d: '−2 stabilité', f: s => { s.stab -= 2; return 'L\'héritier boude.'; } },
      ] },
  ];

  function famRisk(s, p, cause) { for (const x of livingDyn(s)) if (rand(s) < p * tmul(x, 'death')) kill(s, x, cause); const r = ruler(s); if (r.spouse) { const sp = s.people[r.spouse]; if (sp && rand(s) < p) kill(s, sp, cause); } }
  function fertileWoman(s, w) { return w && w.alive && age(s, w) >= 16 && age(s, w) <= 40; }

  function drawEvent(s) {
    const era = eraOf(s);
    const hist = EVENTS.find(e => e.year && !s.done[e.id] && s.year >= e.year && s.year < e.year + 9);
    let e = hist;
    if (!e) {
      const av = EVENTS.filter(x => !x.year && x.cond(s) && (s.turn - (s.evLast[x.id] ?? -99)) >= s.P.evCooldown && (x.ew ? x.ew[era] : 1) > 0);
      if (!av.length) return null;
      const id = weighted(s, av.map(x => [x.id, x.w * (x.ew ? x.ew[era] : 1)]));
      e = EVENTS.find(x => x.id === id);
    }
    s.done[e.id] = true; s.evLast[e.id] = s.turn;
    s.stats.events++;
    return { id: e.id, hist: !!e.year, text: e.text(s), choices: e.choices.map(c => ({ l: c.l, d: c.d })) };
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
    const inc = s.domains * P.incPerDomain + s.builds * P.incPerBuild + (s.mine && !s.mineSold ? 4 : 0) + (s.trade || 0) - (s.corvee || 0) - (s.chantier ? 5 : 0) + tsum(r, 'inc') - Math.round(s.army * P.upkeep);
    s.gold += inc; s.lastIncome = inc + polGold;
    if (s.gold < 0) { s.stab -= P.debtStab; s.prestige -= 1; if (s.gold < -30) { s.army = Math.round(s.army * 0.85); log(s, 'Les soldats impayés désertent.', 'bad'); } }
    // dérive
    s.stab += tsum(r, 'stab') + (s.stab < 50 ? P.stabDrift : 0) - P.baron - Math.floor(s.domains / 5);
    s.prestige += tsum(r, 'prest') + (s.builds >= 4 ? 1 : 0) + (s.cathedral ? 1 : 0);
    if (s.chantier) { s.chantier--; if (!s.chantier) { s.cathedral = true; s.prestige += 25; log(s, 'Les flèches de la cathédrale s\'élèvent enfin vers le ciel. Toute la chrétienté en parle.', 'big'); } }
    for (const k in s.fat) { s.fat[k] *= P.fatigueDecay; if (s.fat[k] < 0.1) delete s.fat[k]; }
    const rl = (r.traits.includes('cruel') ? -2 : 0) + (r.traits.includes('charismatique') ? 2 : 0) + (s.pol.cour === 2 ? 1 : s.pol.cour === 0 ? -1 : 0);
    for (const q of livingDyn(s)) if (q.id !== s.rulerId && q.loyal != null) { q.loyal = clamp(q.loyal + (rand(s) < 0.5 ? Math.sign(50 - q.loyal) : 0) + rl + (q.temper === 'colerique' ? ri(s, -3, 1) : 0), 0, 100); }
    // menace extérieure
    s.menace += ri(s, P.menaceMin, P.menaceMax) + (eraOf(s) === 2 ? 2 : 0) - Math.floor(s.alliances / 2);
    if (s.menace > 40 && rand(s) < (s.menace - 40) / 80) invasion(s);
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
    if (!s.over) { const rr = ruler(s); if (!s.amb && age(s, rr) >= 14) assignAmbition(s, rr); checkAmbition(s); }
  }

  function invasion(s) {
    const P = s.P;
    s.stats.invasions++;
    const enemy = (P.invadeBase + s.menace * 0.35 + (s.year - P.startYear) * P.invadeGrowth) * (0.7 + rand(s) * 0.6);
    const def = s.army * milPower(s) * 1.15 * [0.8, 1, 1.3][s.pol.ost] + s.alliances * P.allianceDef + s.builds * 1.5;
    const isRival = rand(s) < 0.55;
    const foe = isRival ? `L'ost de la maison ${s.rival}` : pick(s, ['Les Anglais', 'Le comte de Flandre', 'Les Impériaux', 'Une grande compagnie de routiers', 'Les Aragonais']);
    const a0 = s.army;
    (s.flashes = s.flashes || []).push({ type: 'battle', kind: 'invasion', won: def > enemy, tgt: foe, rival: isRival, ours: Math.round(def), enemy: Math.round(enemy), loss: 0 });
    const fl = s.flashes[s.flashes.length - 1];
    if (def > enemy) {
      s.stats.invRepelled++; s.prestige += 6; s.army = Math.round(s.army * 0.88); s.menace = 15;
      fl.loss = a0 - s.army;
      log(s, `${foe} envahit vos terres… et se fait repousser !`, 'good');
    } else {
      s.domains--; s.stab -= 12; s.army = Math.round(s.army * 0.7); s.menace = 25; s.prestige -= 5;
      fl.loss = a0 - s.army; s.lastLoss = s.year;
      log(s, `${foe} ravage le pays et s'empare d'un domaine.`, 'bad');
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
    return Math.max(0, Math.round(s.prestige + s.domains * 15 + s.builds * 5 + (s.year - s.P.startYear) * 1 + s.rulers.length * 5 + (s.stats.ambitions || 0) * 15));
  }

  // Tour complet : action, puis passage du temps, puis tirage d'un événement
  function playTurn(s, actionId, arg, arg2) {
    if (s.over || s.event) return;
    doAction(s, actionId, arg, arg2);
    afterChanges(s);
    if (s.over) return;
    worldTurn(s);
    if (s.over) return;
    if (s.year >= s.P.endYear) { endGame(s, true, 'victoire', `L'an ${s.year} : la maison ${s.house} règne depuis ${s.year - s.P.startYear} ans. Sa légende est assurée !`); return; }
    const histDue = EVENTS.some(e => e.year && !s.done[e.id] && s.year >= e.year && s.year < e.year + 9);
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
    return sc >= 720 ? 'Empire légendaire' : sc >= 630 ? 'Grande dynastie' : sc >= 540 ? 'Royaume prospère' : sc >= 450 ? 'Maison respectée' : 'Lignée modeste';
  }

  const api = { TEMPERS, RANKS, marriageMarket, candidateFx, willLeave, applyAI, histDueEvent, markHistDone, AI_BOUNDS, POLICIES, policyFx, setPolicy, ERAS, eraOf, AMBITIONS, ambitionProgress, eff, DEFAULT_P, TRAITS, EVENTS, createGame, getActions, marriageOptions, playTurn, resolveEvent, ruler, heir, successionLine, livingDyn, unmarriedAdults, age, person, fullName, score, rank, rand, childrenOf };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Dyn = api;
})(typeof window !== 'undefined' ? window : this);
