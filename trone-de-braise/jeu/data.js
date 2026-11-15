'use strict';
/* =========================================================
   LE TRÔNE DE BRAISE — données (maisons, provinces, objets, monstres, compétences)
   ========================================================= */
const R = () => Math.random();
const rnd = (a, b) => a + R() * (b - a);
const ri = (a, b) => Math.floor(a + R() * (b - a + 1));
const pick = a => a[Math.floor(R() * a.length)];
const chance = p => R() < p;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function seeded(s) { let a = s >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const SAISONS = ['Printemps', 'Été', 'Automne', 'Hiver'];

/* ---------- Maisons ---------- */
const MAISONS = {
 joueur:   { nom: 'Aubrac', devise: 'Nous tenons', c1: '#c8632a', c2: '#f2d7a0', embleme: 'tour', trait: 'equilibre' },
 draknor:  { nom: 'Draknor', devise: 'Le feu ne s’incline pas', c1: '#8e1b1b', c2: '#e8b04a', embleme: 'dragon', trait: 'royal', roi: true },
 corbelin: { nom: 'Corbelin', devise: 'Les ombres se souviennent', c1: '#2c2c3a', c2: '#b9bccb', embleme: 'corbeau', trait: 'intrigant' },
 hautemarche: { nom: 'Hautemarche', devise: 'L’or bâtit les murs', c1: '#2f6b3a', c2: '#e3d27a', embleme: 'cerf', trait: 'marchand' },
 morvaux:  { nom: 'Morvaux', devise: 'Le loup ne dort pas', c1: '#5b6470', c2: '#dfe4ea', embleme: 'loup', trait: 'guerrier' },
 solenne:  { nom: 'Solenne', devise: 'Par l’aube et par la foi', c1: '#c9a227', c2: '#fff4cf', embleme: 'soleil', trait: 'pieux' },
 brisemer: { nom: 'Brisemer', devise: 'La mer reprend tout', c1: '#1f4f7a', c2: '#cfe6f5', embleme: 'vague', trait: 'marin' },
 rebelles: { nom: 'Terres libres', devise: 'Ni roi ni maître', c1: '#6e5a45', c2: '#cbb89a', embleme: 'epee', trait: 'rebelle', neutre: true },
};
const IA_MAISONS = ['draknor', 'corbelin', 'hautemarche', 'morvaux', 'solenne', 'brisemer'];

/* ---------- Provinces (carte 1000 × 680) ----------
   x,y : centre ; d : niveau de donjon ; donjon : type ; o : propriétaire initial ; t : troupes ; c : château */
const PROVINCES = [
 { id: 'braise', nom: 'Haute-Braise', x: 520, y: 330, o: 'draknor', t: 16, c: 3, d: 12, donjon: 'catacombes', capitale: true, p: 4 },
 { id: 'cendremont', nom: 'Cendremont', x: 610, y: 250, o: 'draknor', t: 7, c: 2, d: 9, donjon: 'mine', p: 3 },
 { id: 'dorvalle', nom: 'Dorvalle', x: 430, y: 400, o: 'draknor', t: 7, c: 1, d: 8, donjon: 'crypte', p: 3 },
 { id: 'valsombre', nom: 'Val-Sombre', x: 165, y: 360, o: 'joueur', t: 6, c: 2, d: 1, donjon: 'crypte', p: 2 },
 { id: 'lisiere', nom: 'Lisière', x: 250, y: 455, o: 'joueur', t: 4, c: 1, d: 2, donjon: 'foret', p: 2 },
 { id: 'saulaies', nom: 'Les Saulaies', x: 300, y: 330, o: 'rebelles', t: 3, c: 0, d: 3, donjon: 'foret', p: 1 },
 { id: 'fortcorbeau', nom: 'Fort-Corbeau', x: 230, y: 170, o: 'corbelin', t: 7, c: 2, d: 5, donjon: 'crypte', p: 2 },
 { id: 'ombrelande', nom: 'Ombrelande', x: 360, y: 210, o: 'corbelin', t: 5, c: 1, d: 4, donjon: 'marais', p: 2 },
 { id: 'givrefaille', nom: 'Givrefaille', x: 420, y: 90, o: 'morvaux', t: 6, c: 1, d: 7, donjon: 'glace', p: 1 },
 { id: 'rocheloup', nom: 'Roche-Loup', x: 560, y: 120, o: 'morvaux', t: 9, c: 2, d: 6, donjon: 'mine', p: 2 },
 { id: 'hautecombe', nom: 'Hautecombe', x: 700, y: 140, o: 'morvaux', t: 6, c: 1, d: 8, donjon: 'glace', p: 2 },
 { id: 'clairmont', nom: 'Clairmont', x: 790, y: 270, o: 'hautemarche', t: 7, c: 2, d: 7, donjon: 'mine', p: 4 },
 { id: 'portambre', nom: 'Port-Ambre', x: 860, y: 390, o: 'hautemarche', t: 5, c: 1, d: 6, donjon: 'egouts', p: 4 },
 { id: 'pierrefonds', nom: 'Pierrefonds', x: 700, y: 360, o: 'hautemarche', t: 5, c: 1, d: 7, donjon: 'crypte', p: 3 },
 { id: 'sainteaube', nom: 'Sainte-Aube', x: 600, y: 470, o: 'solenne', t: 6, c: 2, d: 6, donjon: 'catacombes', p: 3 },
 { id: 'ventarde', nom: 'Ventarde', x: 500, y: 560, o: 'solenne', t: 5, c: 1, d: 5, donjon: 'foret', p: 2 },
 { id: 'tourbieres', nom: 'Les Tourbières', x: 360, y: 530, o: 'rebelles', t: 4, c: 0, d: 4, donjon: 'marais', p: 1 },
 { id: 'mornecote', nom: 'Mornecôte', x: 720, y: 560, o: 'brisemer', t: 5, c: 1, d: 6, donjon: 'egouts', p: 2 },
 { id: 'brisemer', nom: 'Brisemer', x: 870, y: 560, o: 'brisemer', t: 7, c: 2, d: 8, donjon: 'egouts', p: 3 },
 { id: 'marchesgrises', nom: 'Les Marches Grises', x: 120, y: 540, o: 'rebelles', t: 3, c: 0, d: 3, donjon: 'marais', p: 1 },
];
// liaisons maritimes ajoutées aux frontières terrestres calculées
const LIENS_MER = [['portambre', 'brisemer'], ['marchesgrises', 'tourbieres']];

const DONJONS = {
 crypte:     { nom: 'Crypte', sol: ['#4a4440', '#3d3733'], mur: '#1d1a19', face: '#2c2724', lum: '#ffb35c', mobs: ['squelette', 'archer', 'goule', 'spectre'], boss: 'liche' },
 catacombes: { nom: 'Catacombes', sol: ['#47423c', '#3a352f'], mur: '#1a1716', face: '#2a2521', lum: '#ffa94a', mobs: ['squelette', 'archer', 'cultiste', 'brute', 'spectre'], boss: 'liche' },
 mine:       { nom: 'Mine abandonnée', sol: ['#4b3d31', '#3e3228'], mur: '#1c1610', face: '#2d2219', lum: '#ffc070', mobs: ['goule', 'brute', 'araignee', 'golem', 'chaman'], boss: 'ogre' },
 foret:      { nom: 'Bois maudit', sol: ['#33402c', '#2b3626'], mur: '#0f150c', face: '#1a2414', lum: '#d7ff9a', mobs: ['araignee', 'goule', 'loup', 'chaman'], boss: 'reine' },
 marais:     { nom: 'Marais noyé', sol: ['#323b34', '#2a322c'], mur: '#0e1410', face: '#18211b', lum: '#9fffd0', mobs: ['goule', 'araignee', 'spectre', 'chaman'], boss: 'liche' },
 glace:      { nom: 'Faille gelée', sol: ['#4c5864', '#414c57'], mur: '#141b22', face: '#26323d', lum: '#bfe4ff', mobs: ['squelette', 'loup', 'golem', 'spectre'], boss: 'wyverne' },
 egouts:     { nom: 'Égouts anciens', sol: ['#3b3e3a', '#323531'], mur: '#121412', face: '#1f221f', lum: '#ffd27a', mobs: ['rat', 'goule', 'cultiste', 'brute'], boss: 'reine' },
 antre:      { nom: 'Antre du dragon', sol: ['#4a2f24', '#3d271e'], mur: '#1a0d08', face: '#2e170e', lum: '#ff7a3a', mobs: ['brute', 'cultiste', 'golem', 'archer'], boss: 'wyverne' },
 arene:      { nom: 'Champ de bataille', sol: ['#4a4733', '#3f3c2b'], mur: '#1b1a10', face: '#2b2a1b', lum: '#ffd890', mobs: ['soldat', 'soldat', 'arbaletrier'], boss: 'champion' },
};

/* ---------- Monstres ---------- */
// pv, dg, vit (cases/s), portee, cad (s entre attaques), xp, type: 'cac' | 'tir' | 'soin'
const MONSTRES = {
 squelette: { nom: 'Squelette', pv: 34, dg: 5.2, vit: 2.4, portee: 1.1, cad: 1.3, xp: 12, type: 'cac', r: .34, coul: '#ddd6c4' },
 archer:    { nom: 'Archer squelette', pv: 24, dg: 4.5, vit: 2.2, portee: 7, cad: 1.9, xp: 14, type: 'tir', r: .32, coul: '#cfc6b0', proj: 'fleche' },
 goule:     { nom: 'Goule', pv: 30, dg: 4.5, vit: 3.6, portee: 1.0, cad: .9, xp: 13, type: 'cac', r: .32, coul: '#7f9a62' },
 brute:     { nom: 'Brute', pv: 110, dg: 12, vit: 1.7, portee: 1.4, cad: 2.0, xp: 34, type: 'cac', r: .55, coul: '#8a6a52', charge: true },
 chaman:    { nom: 'Chaman', pv: 32, dg: 6.8, vit: 2.0, portee: 6.5, cad: 2.4, xp: 22, type: 'soin', r: .33, coul: '#9b5fb8', proj: 'feu' },
 araignee:  { nom: 'Araignée', pv: 18, dg: 3, vit: 4.2, portee: .9, cad: .7, xp: 8, type: 'cac', r: .28, coul: '#3c3436', groupe: 2 },
 spectre:   { nom: 'Spectre', pv: 40, dg: 6.8, vit: 2.8, portee: 1.1, cad: 1.4, xp: 20, type: 'cac', r: .34, coul: '#9fd3ff', spectre: true },
 loup:      { nom: 'Loup gris', pv: 30, dg: 5.2, vit: 4.4, portee: 1.0, cad: 1.0, xp: 14, type: 'cac', r: .36, coul: '#8c8f96', groupe: 1 },
 arbaletrier: { nom: 'Arbalétrier', pv: 30, dg: 5.5, vit: 2.4, portee: 7, cad: 2.1, xp: 14, type: 'tir', r: .33, coul: '#a0a6ad', proj: 'fleche' },
 soldat:    { nom: 'Soldat', pv: 40, dg: 6, vit: 2.6, portee: 1.1, cad: 1.2, xp: 14, type: 'cac', r: .34, coul: '#a0a6ad' },
 rat:       { nom: 'Rat des cloaques', pv: 12, dg: 2.5, vit: 4.6, portee: .8, cad: .7, xp: 5, type: 'cac', r: .24, coul: '#6a5a4a', groupe: 3 },
 golem:     { nom: 'Golem de pierre', pv: 150, dg: 13, vit: 1.4, portee: 1.5, cad: 2.4, xp: 42, type: 'cac', r: .58, coul: '#8a8478', frappe: true },
 cultiste:  { nom: 'Cultiste des cendres', pv: 34, dg: 5, vit: 2.2, portee: 6, cad: 2.6, xp: 22, type: 'tir', r: .33, coul: '#7a2a2a', proj: 'feu', rafale: 3 },
 // boss
 reine:     { nom: 'Reine des Toiles', pv: 600, dg: 13, vit: 2.4, portee: 5, cad: 1.5, xp: 330, type: 'boss', r: .75, coul: '#3c3436', boss: true },
 liche:     { nom: 'Roi-Liche', pv: 520, dg: 12, vit: 1.9, portee: 7, cad: 1.6, xp: 300, type: 'boss', r: .62, coul: '#b6f0ff', boss: true },
 ogre:      { nom: 'Seigneur Ogre', pv: 680, dg: 18, vit: 2.1, portee: 1.7, cad: 1.8, xp: 320, type: 'boss', r: .8, coul: '#7d8c4f', boss: true },
 wyverne:   { nom: 'Wyverne de Cendre', pv: 640, dg: 15, vit: 2.6, portee: 6, cad: 1.4, xp: 360, type: 'boss', r: .78, coul: '#c2462a', boss: true },
 champion:  { nom: 'Champion ennemi', pv: 320, dg: 11.2, vit: 2.7, portee: 1.3, cad: 1.2, xp: 160, type: 'boss', r: .5, coul: '#d9dde2', boss: true },
};
const AFFIXES_ELITE = [
 { id: 'rapide', nom: 'Rapide', f: m => { m.vit *= 1.45; m.cad *= .75; } },
 { id: 'enrage', nom: 'Enragé', f: m => { m.dg *= 1.4; } },
 { id: 'colosse', nom: 'Colosse', f: m => { m.pvmax *= 1.8; m.pv = m.pvmax; m.r *= 1.2; } },
 { id: 'vampire', nom: 'Vampirique', f: m => { m.vampire = true; } },
 { id: 'ardent', nom: 'Ardent', f: m => { m.ardent = true; } },
 { id: 'givre', nom: 'Givrant', f: m => { m.givre = true; } },
];

/* ---------- Classes et compétences ---------- */
const CLASSES = {
 chevalier: { nom: 'Chevalier', desc: 'Au corps à corps, solide et implacable.', pv: 140, pvn: 17, mana: 40, manan: 3, arm: 8, armes: ['epee', 'hache', 'masse'], attaque: 'cac',
  comp: [
   { id: 'tourbillon', nom: 'Tourbillon', cout: 14, cd: 3, desc: 'Frappe tout autour de vous (150 % des dégâts).', ic: '🌀' },
   { id: 'charge', nom: 'Charge', cout: 12, cd: 6, desc: 'Fonce vers le curseur, renverse et étourdit.', ic: '💨' },
   { id: 'cri', nom: 'Cri de guerre', cout: 18, cd: 16, desc: '+35 % de dégâts et +50 % d’armure pendant 8 s.', ic: '📯' },
   { id: 'seisme', nom: 'Frappe sismique', cout: 24, cd: 7, desc: 'Une onde de choc fend le sol devant vous (260 %).', ic: '⚡' } ] },
 arcaniste: { nom: 'Arcaniste', desc: 'Sorts de feu et de givre, fragile mais dévastateur.', pv: 95, pvn: 12, mana: 70, manan: 6, arm: 3, armes: ['baton', 'sceptre'], attaque: 'sort',
  comp: [
   { id: 'nova', nom: 'Nova de givre', cout: 16, cd: 4, desc: 'Gèle et ralentit les ennemis proches (120 %).', ic: '❄️' },
   { id: 'boule', nom: 'Boule de feu', cout: 14, cd: 1.2, desc: 'Explose à l’impact (190 % en zone).', ic: '🔥' },
   { id: 'blink', nom: 'Pas de l’ombre', cout: 10, cd: 5, desc: 'Se téléporte vers le curseur.', ic: '✨' },
   { id: 'meteore', nom: 'Météore', cout: 34, cd: 9, desc: 'Un astre s’écrase au curseur (420 %).', ic: '☄️' } ] },
 rodeur: { nom: 'Rôdeur', desc: 'Arc et pièges, rapide et précis.', pv: 112, pvn: 14, mana: 50, manan: 4, arm: 5, armes: ['arc', 'arbalete'], attaque: 'tir',
  comp: [
   { id: 'volee', nom: 'Volée', cout: 12, cd: 2.5, desc: 'Cinq flèches en éventail (90 % chacune).', ic: '🏹' },
   { id: 'roulade', nom: 'Roulade', cout: 8, cd: 4, desc: 'Bond rapide dans la direction du mouvement.', ic: '🤸' },
   { id: 'piege', nom: 'Piège explosif', cout: 16, cd: 6, desc: 'Pose un piège qui explose au contact (300 %).', ic: '💣' },
   { id: 'pluie', nom: 'Pluie de flèches', cout: 28, cd: 10, desc: 'Arrose une zone pendant 3 s (60 % × 10).', ic: '🌧️' } ] },
};

/* ---------- Objets ---------- */
const EMPLACEMENTS = ['arme', 'casque', 'armure', 'gants', 'bottes', 'amulette', 'anneau'];
const NOMS_EMPL = { arme: 'Arme', casque: 'Casque', armure: 'Armure', gants: 'Gants', bottes: 'Bottes', amulette: 'Amulette', anneau: 'Anneau' };
const ARMES = {
 epee:    { nom: 'Épée', vit: 1.5, k: 1.0, ic: '🗡️' },
 hache:   { nom: 'Hache', vit: 1.2, k: 1.25, ic: '🪓' },
 masse:   { nom: 'Masse', vit: 1.05, k: 1.45, ic: '🔨' },
 baton:   { nom: 'Bâton', vit: 1.15, k: 1.2, ic: '🪄' },
 sceptre: { nom: 'Sceptre', vit: 1.45, k: .95, ic: '🔱' },
 arc:     { nom: 'Arc', vit: 1.55, k: .95, ic: '🏹' },
 arbalete:{ nom: 'Arbalète', vit: 1.0, k: 1.45, ic: '🎯' },
};
const BASES = {
 casque: [{ n: 'Heaume', arm: 1 }, { n: 'Capuche', arm: .6 }, { n: 'Couronne de fer', arm: .8 }],
 armure: [{ n: 'Cotte de mailles', arm: 2.4 }, { n: 'Brigandine', arm: 2 }, { n: 'Robe brodée', arm: 1.2 }, { n: 'Plastron', arm: 2.8 }],
 gants: [{ n: 'Gantelets', arm: .8 }, { n: 'Gants de cuir', arm: .5 }],
 bottes: [{ n: 'Solerets', arm: .8 }, { n: 'Bottes de voyage', arm: .5 }],
 amulette: [{ n: 'Amulette', arm: 0 }, { n: 'Médaillon', arm: 0 }, { n: 'Talisman', arm: 0 }],
 anneau: [{ n: 'Anneau', arm: 0 }, { n: 'Chevalière', arm: 0 }, { n: 'Bague', arm: 0 }],
};
const ICONES = { casque: '⛑️', armure: '🛡️', gants: '🧤', bottes: '🥾', amulette: '📿', anneau: '💍' };
// statistiques d'objets (s : valeur par niveau d'objet)
const STATS = {
 pdmg:  { nom: '% de dégâts', s: 2.2, min: 4, fmt: v => `+${v} % de dégâts` },
 pv:    { nom: 'vie', s: 4, min: 8, fmt: v => `+${v} points de vie` },
 arm:   { nom: 'armure', s: 1.6, min: 3, fmt: v => `+${v} armure` },
 vit:   { nom: 'vitesse d’attaque', s: .6, min: 4, max: 25, fmt: v => `+${v} % de vitesse d’attaque` },
 crit:  { nom: 'critique', s: .35, min: 2, max: 18, fmt: v => `+${v} % de chances de critique` },
 critd: { nom: 'dégâts critiques', s: 2.5, min: 10, fmt: v => `+${v} % de dégâts critiques` },
 vol:   { nom: 'vol de vie', s: .18, min: 1, max: 8, fmt: v => `${v} % des dégâts rendus en vie` },
 mana:  { nom: 'mana', s: 2, min: 6, fmt: v => `+${v} mana` },
 regen: { nom: 'régénération', s: .35, min: 1, fmt: v => `+${v} vie par seconde` },
 vmov:  { nom: 'vitesse', s: .4, min: 4, max: 20, fmt: v => `+${v} % de vitesse de déplacement` },
 feu:   { nom: 'dégâts de feu', s: 1.1, min: 2, fmt: v => `+${v} dégâts de feu par coup` },
 res:   { nom: 'résistance', s: .35, min: 2, max: 20, fmt: v => `−${v} % de dégâts subis` },
 or:    { nom: 'or trouvé', s: 1.5, min: 5, max: 60, fmt: v => `+${v} % d’or trouvé` },
 recup: { nom: 'récupération', s: .4, min: 4, max: 25, fmt: v => `−${v} % de temps de recharge` },
};
const STATS_EMPL = {
 arme: ['pdmg', 'vit', 'crit', 'critd', 'vol', 'feu', 'mana', 'recup'],
 casque: ['pv', 'arm', 'crit', 'mana', 'regen', 'res', 'recup'],
 armure: ['pv', 'arm', 'regen', 'res', 'vol'],
 gants: ['vit', 'crit', 'critd', 'arm', 'feu', 'or'],
 bottes: ['vmov', 'pv', 'arm', 'res', 'regen'],
 amulette: ['pdmg', 'crit', 'critd', 'pv', 'mana', 'or', 'recup', 'feu'],
 anneau: ['pdmg', 'crit', 'vol', 'mana', 'regen', 'or', 'feu', 'vit'],
};
const RARETES = [
 { id: 'normal', nom: 'Ordinaire', coul: '#d8d2c4', n: 0 },
 { id: 'magique', nom: 'Magique', coul: '#6fa8ff', n: 2 },
 { id: 'rare', nom: 'Rare', coul: '#ffd84a', n: 4 },
 { id: 'legendaire', nom: 'Légendaire', coul: '#ff8a2a', n: 4 },
];
const PREFIXES = ['Sanglant', 'Ancien', 'Brisé', 'Royal', 'Maudit', 'Noble', 'Cruel', 'Sombre', 'Ardent', 'Glacé', 'Fidèle', 'Funeste'];
const NOMS_RARES = ['Murmure', 'Fléau', 'Serment', 'Ombre', 'Chant', 'Rempart', 'Morsure', 'Veille', 'Écho', 'Cendre', 'Croc', 'Larme', 'Colère', 'Souffle', 'Garde', 'Présage'];
const SUFFIXES = ['du Corbeau', 'de l’Aube', 'des Marches', 'du Puits', 'de la Veuve', 'du Loup', 'des Cendres', 'du Serment', 'de l’Exil', 'des Rois', 'de la Brume', 'du Pendu'];
// légendaires : effets uniques en donjon ET dans le royaume
const LEGENDAIRES = [
 { id: 'lamebraise', nom: 'Lame de Braise', empl: 'arme', arme: 'epee', effet: 'brulure', txt: 'Vos coups enflamment les ennemis (40 % des dégâts sur 3 s).' },
 { id: 'colere', nom: 'Colère du Vieux Roi', empl: 'arme', arme: 'masse', effet: 'onde', txt: 'Un coup sur quatre libère une onde de choc.' },
 { id: 'murmure', nom: 'Murmure-de-Givre', empl: 'arme', arme: 'baton', effet: 'givrecoup', txt: 'Vos projectiles ralentissent fortement.' },
 { id: 'etoilenoire', nom: 'Étoile Noire', empl: 'arme', arme: 'sceptre', effet: 'rebond', txt: 'Vos projectiles rebondissent sur un second ennemi.' },
 { id: 'veuve', nom: 'L’Arc de la Veuve', empl: 'arme', arme: 'arc', effet: 'percant', txt: 'Vos flèches transpercent tous les ennemis.' },
 { id: 'tonnerre', nom: 'Tonnerre-de-Morvaux', empl: 'arme', arme: 'arbalete', effet: 'explosif', txt: 'Vos carreaux explosent à l’impact.' },
 { id: 'hachelignee', nom: 'Hache de la Lignée', empl: 'arme', arme: 'hache', effet: 'heritage', txt: 'Gagne +3 % de dégâts par génération de votre dynastie.' },
 { id: 'couronnepale', nom: 'Couronne du Roi Pâle', empl: 'casque', effet: 'ordre', txt: 'Royaume : +1 ordre chaque saison.' },
 { id: 'sceau', nom: 'Sceau de l’Intendant', empl: 'anneau', effet: 'impots', txt: 'Royaume : +25 % d’impôts.' },
 { id: 'banniere', nom: 'Cape-Bannière d’Aubrac', empl: 'armure', effet: 'de', txt: 'Royaume : vos armées lancent un dé de plus en attaque.' },
 { id: 'oeilcorbeau', nom: 'Œil du Corbeau', empl: 'amulette', effet: 'intrigue', txt: 'Royaume : +2 influence par saison, complots plus sûrs.' },
 { id: 'pasfantome', nom: 'Pas du Fantôme', empl: 'bottes', effet: 'fantome', txt: 'Vous traversez les ennemis ; +15 % de vitesse.' },
 { id: 'mainsang', nom: 'Main du Bourreau', empl: 'gants', effet: 'execution', txt: 'Achève instantanément les ennemis sous 12 % de vie.' },
 { id: 'cotteserment', nom: 'Cotte du Serment', empl: 'armure', effet: 'epines', txt: 'Renvoie 50 % des dégâts de mêlée subis.' },
 { id: 'coeurdragon', nom: 'Cœur de Dragon', empl: 'amulette', effet: 'phenix', txt: 'Une fois par expédition, vous relève avec la moitié de votre vie.' },
 { id: 'anneauvide', nom: 'Anneau du Vide', empl: 'anneau', effet: 'vide', txt: 'Vos compétences ne coûtent pas de mana une fois sur trois.' },
];

/* ---------- Noms ---------- */
const PRENOMS_H = ['Aldric', 'Baudouin', 'Cédric', 'Doran', 'Émeric', 'Gaël', 'Hugues', 'Isembart', 'Jehan', 'Lothaire', 'Mathis', 'Néry', 'Odon', 'Perceval', 'Raoul', 'Séverin', 'Thibault', 'Ulric', 'Valéran', 'Yvain', 'Arnaud', 'Bertrand', 'Corentin', 'Galeran', 'Enguerrand'];
const PRENOMS_F = ['Aénor', 'Béatrix', 'Clémence', 'Douce', 'Ermengarde', 'Flore', 'Guenièvre', 'Héloïse', 'Isaure', 'Jehanne', 'Lysandre', 'Mahaut', 'Nivelle', 'Oriane', 'Pernelle', 'Rosalinde', 'Sibylle', 'Tiphaine', 'Ysolde', 'Alix', 'Blanche', 'Catheline', 'Esclarmonde', 'Mélisende'];
const SURNOMS = ['le Hardi', 'la Juste', 'le Sombre', 'l’Ancien', 'le Bâtisseur', 'la Rouge', 'le Pieux', 'le Cruel', 'l’Exilé', 'la Sage', 'le Jeune', 'le Loup', 'la Brave', 'le Patient'];

if (typeof module !== 'undefined') module.exports = { R, rnd, ri, pick, chance, clamp, shuffle, seeded, SAISONS, MAISONS, IA_MAISONS, PROVINCES, LIENS_MER, DONJONS, MONSTRES, AFFIXES_ELITE, CLASSES, EMPLACEMENTS, NOMS_EMPL, ARMES, BASES, ICONES, STATS, STATS_EMPL, RARETES, PREFIXES, SUFFIXES, LEGENDAIRES, PRENOMS_H, PRENOMS_F, SURNOMS };

/* ---------- Talents (passifs, 3 rangs, à partir du niveau 3) ---------- */
const TALENTS = {
 chevalier: [
  { id: 'fer', nom: 'Peau de fer', ic: '🛡️', txt: r => `+${8 * r} % d’armure` },
  { id: 'vigueur', nom: 'Vigueur', ic: '❤️', txt: r => `+${6 * r} % de vie` },
  { id: 'riposte', nom: 'Riposte', ic: '💫', txt: r => `${5 * r} % de chances d’étourdir à chaque coup` },
  { id: 'sangchaud', nom: 'Sang chaud', ic: '🩸', txt: r => `+${r} % de vol de vie` },
  { id: 'maitre', nom: 'Maître d’armes', ic: '⚔️', txt: r => `+${6 * r} % de dégâts` },
  { id: 'inebranlable', nom: 'Inébranlable', ic: '🗿', txt: r => `−${5 * r} % de dégâts subis` } ],
 arcaniste: [
  { id: 'erudition', nom: 'Érudition', ic: '📘', txt: r => `+${12 * r} % de mana` },
  { id: 'flux', nom: 'Flux arcanique', ic: '🌊', txt: r => `+${20 * r} % de régénération de mana` },
  { id: 'pyro', nom: 'Pyromancie', ic: '🔥', txt: r => `+${7 * r} % de dégâts` },
  { id: 'cristal', nom: 'Esprit cristallin', ic: '💎', txt: r => `+${4 * r} % de critique` },
  { id: 'bouclier', nom: 'Bouclier de mana', ic: '🔮', txt: r => `${10 * r} % des dégâts subis sont pris sur le mana` },
  { id: 'concentration', nom: 'Concentration', ic: '⏳', txt: r => `−${6 * r} % de temps de recharge` } ],
 rodeur: [
  { id: 'faucon', nom: 'Œil de faucon', ic: '🦅', txt: r => `+${4 * r} % de critique` },
  { id: 'piedleger', nom: 'Pied léger', ic: '🍃', txt: r => `+${6 * r} % de vitesse de déplacement` },
  { id: 'barbele', nom: 'Flèches barbelées', ic: '🎯', txt: r => `+${15 * r} % de dégâts critiques` },
  { id: 'instinct', nom: 'Instinct', ic: '🌀', txt: r => `${5 * r} % de chances d’esquiver un coup` },
  { id: 'chasseur', nom: 'Chasseur', ic: '🏹', txt: r => `+${6 * r} % de dégâts` },
  { id: 'survie', nom: 'Survie', ic: '🌿', txt: r => `+${1.2 * r} vie par seconde` } ],
};
/* ---------- Compagnons ---------- */
const COMPAGNONS = {
 ecuyer: { nom: 'Écuyer', desc: 'Combat au corps à corps et attire les coups.', ic: '🛡️', pv: 90, pvn: 20, dg: 6, dgn: 2.3, portee: 1.2, cad: 1.1, type: 'cac', coul: '#8a9097', prix: 120 },
 arbaletriere: { nom: 'Arbalétrière', desc: 'Tire de loin, fragile mais précise.', ic: '🎯', pv: 60, pvn: 13, dg: 7, dgn: 2.6, portee: 7, cad: 1.6, type: 'tir', coul: '#6a7a4a', prix: 120 },
 pretresse: { nom: 'Prêtresse', desc: 'Soigne vos blessures et frappe de lumière.', ic: '✨', pv: 70, pvn: 15, dg: 4, dgn: 1.5, portee: 6, cad: 1.8, type: 'soin', coul: '#e8dcc0', prix: 150 },
};
/* ---------- Autels (bonus temporaires en donjon) ---------- */
const AUTELS = {
 fureur: { nom: 'Autel de fureur', txt: '+50 % de dégâts', coul: '#ff5a3a', d: 25 },
 celerite: { nom: 'Autel de célérité', txt: '+30 % de vitesse', coul: '#7ad0ff', d: 25 },
 protection: { nom: 'Autel de protection', txt: '−40 % de dégâts subis', coul: '#ffe08a', d: 25 },
 fortune: { nom: 'Autel de fortune', txt: 'Pluie d’or, or doublé', coul: '#ffc030', d: 45 },
 savoir: { nom: 'Autel du savoir', txt: '+50 % d’expérience', coul: '#c9a0ff', d: 60 },
};
MONSTRES.gobelin = { nom: 'Gobelin voleur', pv: 160, dg: 0, vit: 3.4, portee: 0, cad: 9, xp: 60, type: 'fuite', r: .34, coul: '#7a9a3a' };
