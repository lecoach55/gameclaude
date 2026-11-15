'use strict';
/* =========================================================
   Événements : chaque saison apporte son lot d'intrigues, de malheurs et d'occasions.
   Un choix renvoie un texte, ou { msg, combat:{...} } pour lancer un combat (l'interface
   rappelle ensuite EVTS[id].apres(G, e, X)).
   ========================================================= */
const pv = (G, id) => prov(G, id);
const mN = (G, m) => G.maisons[m].nom;
const mesProv = G => provincesDe(G, 'joueur');
const uneProv = G => pick(mesProv(G));
const maisonVoisine = G => { const s = new Set(); for (const p of mesProv(G)) for (const id of voisinsDe(p.id)) { const q = pv(G, id); if (q.o !== 'joueur' && q.o !== 'rebelles') s.add(q.o); } return s.size ? pick([...s]) : pick(IA_MAISONS.filter(m => !G.maisons[m].elim)) || 'rebelles'; };
const gainOr = (G, n) => { G.maisons.joueur.or += n; return n >= 0 ? `+${n} or` : `${n} or`; };
const gainPrest = (G, n) => { G.maisons.joueur.prestige = Math.max(0, G.maisons.joueur.prestige + n); return n >= 0 ? `+${n} prestige` : `${n} prestige`; };
const gainInf = (G, n) => { G.maisons.joueur.influence += n; return `+${n} influence`; };
const heros = G => G.joueur.heros;
const peutCombattre = G => !G.joueur.blesse && !G.joueur.regence;

const EVTS = {
 intro: { titre: 'L’héritage d’Aubrac', img: 'chateau',
  texte: G => `Le vent d’automne a emporté votre père. Vous voici à la tête d’une maison mineure : deux provinces, Val-Sombre et Lisière, quelques centaines d’hommes et des dettes. À Haute-Braise, le vieux roi Aldric s’éteint lentement, et son fils n’a que quatorze ans. Les grandes maisons affûtent déjà leurs lames.\n\nOn dit que sous la chapelle de Val-Sombre s’ouvre une crypte où rôdent les morts. Le peuple attend de voir de quel bois vous êtes fait${heros(G).sexe === 'f' ? 'e' : ''}.`,
  choix: G => [
   { t: 'Jurer de purger la crypte de Val-Sombre (conseillé pour commencer)', f: G => { G.maisons.joueur.prestige += 2; return 'Le peuple murmure votre nom. Sélectionnez Val-Sombre sur la carte puis « Expédition ».'; } },
   { t: 'Rassembler d’abord les bannières (+4 troupes à Val-Sombre)', f: G => { pv(G, 'valsombre').t += 4; return 'Les vassaux répondent à l’appel.'; } },
   { t: 'Écrire au vieux roi pour lui jurer fidélité', f: G => { changeRel(G, 'joueur', 'draknor', 20); return `La maison Draknor apprécie votre loyauté (relation ${G.maisons.draknor.rel.joueur}).`; } },
  ] },
 mort_roi: { titre: 'Le roi est mort', img: 'couronne', unique: true,
  texte: G => `Les cloches de Haute-Braise sonnent le glas : Aldric le Vieux s’est éteint. Son fils ${G.maisons.draknor.chef && G.maisons.draknor.heritier ? G.maisons.draknor.heritier.nom : 'Valéran'}, encore enfant, est proclamé roi, mais déjà les grandes maisons contestent sa légitimité. La guerre de succession commence.`,
  pre: G => { G.roiMort = true; const D = G.maisons.draknor; if (D.chef && D.chef.roi) { successionIA(G, 'draknor'); D.chef.roi = false; } for (const m of IA_MAISONS) if (m !== 'draknor' && G.maisons[m].rel.draknor < 10 && chance(.6)) declarerGuerre(G, m, 'draknor'); for (const q of provincesDe(G, 'draknor')) q.loy -= 15; },
  choix: G => [
   { t: 'Soutenir le jeune roi (alliance avec Draknor, +10 prestige)', f: G => { changeRel(G, 'joueur', 'draknor', 30); G.maisons.joueur.alliance.draknor = G.maisons.draknor.alliance.joueur = true; return `Vous voici protecteur${heros(G).sexe === 'f' ? 'trice' : ''} de la couronne. ${gainPrest(G, 10)}.`; } },
   { t: 'Revendiquer le Trône de Braise (guerre contre Draknor, +15 prestige)', f: G => { declarerGuerre(G, 'joueur', 'draknor', 'revendication du trône'); for (const m of IA_MAISONS) changeRel(G, 'joueur', m, -8); return `Votre bannière flotte face au dragon. ${gainPrest(G, 15)}. Les autres maisons vous regardent avec méfiance.`; } },
   { t: 'Attendre que les loups s’entre-dévorent (+3 influence)', f: G => `Patience est mère de couronnes. ${gainInf(G, 3)}.` },
  ] },
 couronnement: { titre: 'Le Trône de Braise', img: 'couronne',
  texte: G => `Haute-Braise vous ouvre ses portes. Sur le trône de pierre noire, encore tiède du règne des Draknor, ${heros(G).nom} d’${G.maisons.joueur.nom} reçoit la couronne de fer et de braise. Dix provinces et plus vous prêtent serment.\n\nVous avez gagné la partie. Le royaume continue : défendez votre couronne, étendez votre lignée, ou partez à la chasse aux légendes.`,
  choix: G => [{ t: 'Longue vie au souverain !', f: G => 'Les chroniqueurs gravent votre nom.' }] },
 naissance: { titre: 'Un enfant est né',
  texte: (G, e) => `${e.sexe === 'f' ? 'Une fille' : 'Un fils'} vous est né${e.sexe === 'f' ? 'e' : ''} : ${e.nom}. La lignée d’${G.maisons.joueur.nom} se prolonge.`,
  choix: G => [{ t: 'Faire sonner les cloches (+3 prestige)', f: G => gainPrest(G, 3) }, { t: 'Distribuer du pain au peuple (−20 or, +loyauté)', f: G => { G.maisons.joueur.or -= 20; for (const p of mesProv(G)) p.loy += 8; return 'Le peuple bénit l’enfant.'; } }] },
 declaration: { titre: 'Déclaration de guerre',
  texte: (G, e) => `Un héraut aux couleurs de la maison ${mN(G, e.maison)} jette un gantelet aux pieds de votre trône. « ${G.maisons[e.maison].devise} ! » La guerre est déclarée.`,
  choix: (G, e) => [{ t: 'Préparer les défenses', f: G => 'Aux armes !' }, { t: 'Envoyer de l’or pour calmer leur colère (−60 or)', f: (G, e) => { if (G.maisons.joueur.or < 60) return 'Vos coffres sont vides : la guerre continue.'; G.maisons.joueur.or -= 60; if (chance(.55)) { faireLaPaix(G, 'joueur', e.maison); return 'Leur colère s’apaise : la paix est rétablie.'; } return 'Ils prennent l’or… et gardent leurs épées.'; } }] },
 offre_paix: { titre: 'Une offre de paix',
  texte: (G, e) => `La maison ${mN(G, e.maison)}, éprouvée par la guerre, vous propose la paix et 40 pièces d’or en gage de bonne foi.`,
  choix: (G, e) => [{ t: 'Accepter la paix (+40 or)', f: (G, e) => { faireLaPaix(G, 'joueur', e.maison); changeRel(G, 'joueur', e.maison, 20); return gainOr(G, 40); } }, { t: 'Refuser : écraser l’ennemi (+3 prestige)', f: G => gainPrest(G, 3) }] },
 offre_alliance: { titre: 'Une main tendue',
  texte: (G, e) => `La maison ${mN(G, e.maison)} vous propose une alliance en bonne et due forme.`,
  choix: (G, e) => [{ t: 'Accepter', f: (G, e) => { G.maisons[e.maison].alliance.joueur = G.maisons.joueur.alliance[e.maison] = true; noter(G, `Alliance avec ${mN(G, e.maison)}.`, 'paix'); return 'Alliance conclue.'; } }, { t: 'Décliner poliment', f: (G, e) => { changeRel(G, 'joueur', e.maison, -5); return 'Ils repartent déçus.'; } }] },
 attaque_subie: { titre: 'Bataille !',
  texte: (G, e) => `La maison ${mN(G, e.maison)} a attaqué ${pv(G, e.prov).nom}. ${e.gagne ? `La province est tombée (vos pertes : ${e.pd}, les leurs : ${e.pa}).` : `Vos défenseurs ont tenu bon (pertes : ${e.pd} contre ${e.pa}).`}`,
  choix: (G, e) => [{ t: e.gagne ? 'Nous la reprendrons' : 'Gloire aux défenseurs !', f: (G, e) => e.gagne ? '' : gainPrest(G, 2) }] },
 retour_mal: { titre: 'Le mal revient',
  texte: (G, e) => `Des paysans de ${pv(G, e.prov).nom} racontent que les ${DONJONS[pv(G, e.prov).donjon].nom.toLowerCase()} grouillent à nouveau de créatures, plus fortes qu’avant (niveau ${pv(G, e.prov).dniv}).`,
  choix: (G, e) => [{ t: 'Il faudra y retourner', f: () => 'La province a perdu un peu de sa confiance.' }] },

 /* ----- événements aléatoires ----- */
 tournoi: { titre: 'Le tournoi de Haute-Braise', poids: 3, cond: G => peutCombattre(G),
  texte: G => 'On donne un grand tournoi pour la fête de la Moisson. Les champions de toutes les maisons s’y affrontent. Une bourse de 120 pièces et une gloire éternelle attendent le vainqueur.',
  choix: G => [
   { t: 'Descendre dans la lice (combat)', f: G => ({ msg: 'Vous enfilez votre heaume…', combat: { arene: { n: 4, maison: maisonVoisine(G) }, niveau: Math.max(1, heros(G).niveau), nom: 'Lice du tournoi' } }) },
   { t: 'Parier sur un champion (−20 or)', f: G => { G.maisons.joueur.or -= 20; return chance(.45) ? `Votre champion l’emporte ! ${gainOr(G, 70)}.` : 'Votre champion mord la poussière.'; } },
   { t: 'Ne pas y assister', f: G => '' },
  ],
  apres: (G, e, X) => X.resultat === 'victoire' ? `Vous remportez le tournoi ! ${gainOr(G, 120)}, ${gainPrest(G, 12)}.` : `Désarçonné${heros(G).sexe === 'f' ? 'e' : ''} devant toute la cour… ${gainPrest(G, -4)}.` },
 bandits: { titre: 'Des brigands sur la route', poids: 4, cond: G => peutCombattre(G) && mesProv(G).length > 0,
  ctx: G => ({ prov: uneProv(G).id }),
  texte: (G, e) => `Une bande de déserteurs rançonne les marchands près de ${pv(G, e.prov).nom}. Les villageois implorent votre aide.`,
  choix: (G, e) => [
   { t: 'Les traquer vous-même (combat)', f: (G, e) => ({ msg: '', combat: { arene: { n: 6, maison: 'rebelles' }, niveau: Math.max(1, pv(G, e.prov).dniv * .6 + heros(G).niveau * .4), nom: 'Embuscade' } }) },
   { t: 'Envoyer la garnison (−2 troupes)', f: (G, e) => { const p = pv(G, e.prov); p.t = Math.max(1, p.t - 2); p.loy += 6; return 'Les brigands sont pendus aux arbres.'; } },
   { t: 'Les ignorer', f: (G, e) => { pv(G, e.prov).loy -= 12; return 'Le peuple se sent abandonné.'; } },
  ],
  apres: (G, e, X) => { if (X.resultat === 'victoire') { pv(G, e.prov).loy += 15; return `Les routes sont sûres. ${gainPrest(G, 4)}, loyauté +15.`; } pv(G, e.prov).loy -= 5; return 'Les brigands vous ont échappé.'; } },
 duel: { titre: 'Un duel d’honneur', poids: 2, cond: G => peutCombattre(G),
  ctx: G => ({ maison: maisonVoisine(G) }),
  texte: (G, e) => `Le champion de la maison ${mN(G, e.maison)} vous accuse publiquement de lâcheté et vous défie en combat singulier.`,
  choix: (G, e) => [
   { t: 'Relever le défi (combat)', f: (G, e) => ({ msg: '', combat: { arene: { n: 0, maison: e.maison }, niveau: heros(G).niveau + 1, nom: 'Combat singulier' } }) },
   { t: 'Désigner un champion (−40 or)', f: (G, e) => { G.maisons.joueur.or -= 40; return chance(.5) ? `Votre champion triomphe. ${gainPrest(G, 4)}.` : `Votre champion est tué. ${gainPrest(G, -3)}.`; } },
   { t: 'Refuser avec mépris', f: (G, e) => { changeRel(G, 'joueur', e.maison, -10); return gainPrest(G, -6); } },
  ],
  apres: (G, e, X) => { if (X.resultat === 'victoire') { changeRel(G, 'joueur', e.maison, -10); return `Le provocateur gît dans la poussière. ${gainPrest(G, 10)}.`; } return `Vous survivez de justesse à l’humiliation. ${gainPrest(G, -5)}.`; } },
 crypte_decouverte: { titre: 'Une crypte oubliée', poids: 2, cond: G => peutCombattre(G),
  ctx: G => ({ prov: uneProv(G).id }),
  texte: (G, e) => `En creusant les fondations d’un moulin à ${pv(G, e.prov).nom}, des ouvriers ont percé une voûte. Un escalier descend dans le noir, et une odeur de tombe en monte.`,
  choix: (G, e) => [
   { t: 'Descendre (donjon de deux étages)', f: (G, e) => ({ msg: '', combat: { type: pick(['crypte', 'catacombes']), niveau: Math.max(1, heros(G).niveau), etages: 2, nom: 'Crypte oubliée' } }) },
   { t: 'Murer l’entrée', f: G => 'Certaines portes doivent rester closes.' },
  ],
  apres: (G, e, X) => X.resultat === 'victoire' ? `Vous remontez chargé${heros(G).sexe === 'f' ? 'e' : ''} de trésors. ${gainPrest(G, 4)}.` : 'Vous remontez bredouille.' },
 dragon: { titre: 'Une ombre dans le ciel', poids: 1, cond: G => G.tour > 8 && peutCombattre(G) && !G.vus.dragon_tue,
  texte: G => 'Des bergers de Givrefaille jurent avoir vu une wyverne de cendre, grande comme une église, se poser dans une faille de la montagne. Les troupeaux disparaissent. On dit que son antre déborde d’or ancien.',
  choix: G => [
   { t: 'Partir chasser la bête (antre, 3 étages, butin légendaire)', f: G => ({ msg: '', combat: { type: 'antre', niveau: Math.max(heros(G).niveau + 1, 8), etages: 3, nom: 'Antre de la Wyverne', boss: 'wyverne' } }) },
   { t: 'Offrir une prime aux chasseurs (−50 or)', f: G => { G.maisons.joueur.or -= 50; return chance(.3) ? `Un chasseur rapporte la tête de la bête ! ${gainPrest(G, 6)}.` : 'Les chasseurs ne reviennent pas.'; } },
   { t: 'Ce ne sont que des contes', f: G => '' },
  ],
  apres: (G, e, X) => { if (X.resultat === 'victoire') { G.vus.dragon_tue = true; noter(G, `${heros(G).nom} a tué la Wyverne de Cendre.`, 'exploit'); return `La bête est morte ! On vous surnomme « Tueur de dragon ». ${gainPrest(G, 25)}, ${gainOr(G, 150)}.`; } return 'Les flammes vous ont repoussé.'; } },
 marchand: { titre: 'Un marchand venu d’outre-mer', poids: 3,
  ctx: G => ({ obj: genObjet(heros(G).niveau + 2, heros(G).classe, { min: chance(.25) ? 'legendaire' : 'rare' }) }),
  texte: (G, e) => `Un marchand au teint hâlé déballe ses merveilles dans votre grand-salle. L’une d’elles attire votre regard : <b style="color:${RARETES.find(r => r.id === e.obj.rar).coul}">${e.obj.nom}</b> (${lignesObjet(e.obj).join(' · ')}).`,
  choix: (G, e) => [
   { t: `L’acheter (${Math.round(e.obj.prix * .9)} or)`, cond: G => G.maisons.joueur.or >= Math.round(e.obj.prix * .9), f: (G, e) => { G.maisons.joueur.or -= Math.round(e.obj.prix * .9); G.joueur.inventaire.push(e.obj); return `${e.obj.nom} rejoint votre armurerie.`; } },
   { t: 'Lui vendre tout le bric-à-brac de l’armurerie', cond: G => G.joueur.inventaire.length > 0, f: G => { let s = 0; const garde = G.joueur.inventaire.filter(o => o.rar === 'legendaire' || o.rar === 'rare'); for (const o of G.joueur.inventaire) if (!garde.includes(o)) s += Math.round(o.prix / 2.5); G.joueur.inventaire = garde; return `Il vous en donne un bon prix : ${gainOr(G, s)} (les objets rares et légendaires sont gardés).`; } },
   { t: 'Le congédier', f: G => '' },
  ] },
 famine: { titre: 'L’hiver de la faim', poids: 2, cond: G => G.saison === 3 || G.saison === 0,
  ctx: G => ({ prov: uneProv(G).id }),
  texte: (G, e) => `Les greniers de ${pv(G, e.prov).nom} sont vides. On mange l’écorce des arbres, et des pillards rôdent autour des granges seigneuriales.`,
  choix: (G, e) => [
   { t: 'Ouvrir vos réserves (−50 or)', f: (G, e) => { G.maisons.joueur.or -= 50; pv(G, e.prov).loy += 20; return `Le peuple vous bénit. ${gainPrest(G, 3)}.`; } },
   { t: 'Réquisitionner les monastères (+influence, colère du clergé)', f: (G, e) => { pv(G, e.prov).loy += 5; changeRel(G, 'joueur', 'solenne', -15); return 'Les moines maudissent votre nom, mais le peuple mange. La maison Solenne s’en offusque.'; } },
   { t: 'Laisser faire', f: (G, e) => { const p = pv(G, e.prov); p.loy -= 20; p.p = Math.max(1, p.p - 1); return 'La famine fauche les plus faibles. Prospérité −1.'; } },
  ] },
 peste: { titre: 'La fièvre noire', poids: 1, cond: G => G.tour > 5,
  ctx: G => ({ prov: uneProv(G).id }),
  texte: (G, e) => `Une fièvre noire se répand à ${pv(G, e.prov).nom}. Les corps s’empilent aux portes de la ville.`,
  choix: (G, e) => [
   { t: 'Mettre la ville en quarantaine (−troupes, maladie contenue)', f: (G, e) => { const p = pv(G, e.prov); p.t = Math.max(1, Math.round(p.t * .7)); return 'La maladie est contenue, mais la garnison est décimée.'; } },
   { t: 'Faire venir des guérisseurs (−60 or)', f: (G, e) => { G.maisons.joueur.or -= 60; return chance(.7) ? 'Les guérisseurs font des miracles.' : (pv(G, e.prov).p = Math.max(1, pv(G, e.prov).p - 1), 'Rien n’y fait. Prospérité −1.'); } },
   { t: 'Prier', f: (G, e) => { const p = pv(G, e.prov); if (chance(.5)) { p.p = Math.max(1, p.p - 1); p.t = Math.max(1, p.t - 2); return 'Les prières restent sans réponse.'; } return `La fièvre s’éteint d’elle-même. ${gainPrest(G, 2)}.`; } },
  ] },
 prophete: { titre: 'Le prophète des cendres', poids: 2,
  ctx: G => ({ prov: uneProv(G).id }),
  texte: (G, e) => `Un ermite couvert de cendres prêche sur la place de ${pv(G, e.prov).nom} : « La lignée d’${G.maisons.joueur.nom} portera la couronne, ou périra dans les flammes ! » Les foules grossissent.`,
  choix: (G, e) => [
   { t: 'L’accueillir à la cour (+prestige)', f: G => `Ses prophéties vous attirent la faveur du petit peuple. ${gainPrest(G, 6)}.` },
   { t: 'Le faire taire', f: (G, e) => { pv(G, e.prov).loy -= 10; return 'Le prophète disparaît. Le peuple chuchote.'; } },
   { t: 'L’envoyer prêcher chez vos ennemis (+2 influence)', f: G => gainInf(G, 2) },
  ] },
 espion: { titre: 'Un espion démasqué', poids: 2,
  ctx: G => ({ maison: maisonVoisine(G) }),
  texte: (G, e) => `Votre maître des chiens a surpris un valet en train de recopier vos lettres. Sous la torture, il avoue servir la maison ${mN(G, e.maison)}.`,
  choix: (G, e) => [
   { t: 'Le retourner contre ses maîtres (+3 influence)', f: G => gainInf(G, 3) },
   { t: 'Le pendre et renvoyer sa tête', f: (G, e) => { changeRel(G, 'joueur', e.maison, -15); return gainPrest(G, 4); } },
   { t: 'Le relâcher en signe de bonne volonté', f: (G, e) => { changeRel(G, 'joueur', e.maison, 12); return 'Un geste qui sera remarqué.'; } },
  ] },
 vassal_rebelle: { titre: 'Un vassal insolent', poids: 2, cond: G => mesProv(G).length >= 3,
  ctx: G => ({ prov: uneProv(G).id }),
  texte: (G, e) => `Le seigneur de ${pv(G, e.prov).nom} refuse de payer l’écu et parle de « libertés anciennes ».`,
  choix: (G, e) => [
   { t: 'Le convoquer et l’humilier (−loyauté, +or)', f: (G, e) => { pv(G, e.prov).loy -= 10; return gainOr(G, 50); } },
   { t: 'Lui accorder une charte (−impôts, +loyauté)', f: (G, e) => { pv(G, e.prov).loy += 20; return 'Il vous jure une fidélité nouvelle.'; } },
   { t: 'Le défier à l’épée (combat)', cond: G => peutCombattre(G), f: (G, e) => ({ msg: '', combat: { arene: { n: 3, maison: 'rebelles' }, niveau: heros(G).niveau, nom: 'Le vassal rebelle' } }) },
  ],
  apres: (G, e, X) => X.resultat === 'victoire' ? (pv(G, e.prov).loy += 15, `Le vassal implore votre pardon. ${gainPrest(G, 5)}.`) : (pv(G, e.prov).loy -= 15, 'Le vassal se moque de vous.') },
 mariage_offre: { titre: 'Une offre de mariage', poids: 3, cond: G => !G.joueur.conjoint && IA_MAISONS.some(m => !G.maisons[m].elim),
  ctx: G => ({ maison: pick(IA_MAISONS.filter(m => !G.maisons[m].elim)) || 'draknor' }),
  texte: (G, e) => `La maison ${mN(G, e.maison)} vous propose la main d’un${heros(G).sexe === 'f' ? '' : 'e'} des siens, avec une dot de 80 pièces d’or.`,
  choix: (G, e) => [
   { t: 'Accepter (alliance + dot)', f: (G, e) => { const Jo = G.joueur, s = heros(G).sexe === 'f' ? 'h' : 'f'; Jo.conjoint = { nom: nomAuHasard(s), sexe: s, age: clamp(Jo.age + ri(-5, 2), 16, 60), maison: e.maison }; G.maisons[e.maison].alliance.joueur = G.maisons.joueur.alliance[e.maison] = true; changeRel(G, 'joueur', e.maison, 25); noter(G, `Noces de ${heros(G).nom} et de ${Jo.conjoint.nom} ${mN(G, e.maison)}.`, 'famille'); return `Vous épousez ${Jo.conjoint.nom}. ${gainOr(G, 80)}.`; } },
   { t: 'Refuser', f: (G, e) => { changeRel(G, 'joueur', e.maison, -8); return 'L’affront est noté.'; } },
  ] },
 enfant_malade: { titre: 'La fièvre au berceau', poids: 1, cond: G => G.joueur.enfants.some(x => x.age < 6),
  ctx: G => ({ enfant: pick(G.joueur.enfants.filter(x => x.age < 6)).nom }),
  texte: (G, e) => `${e.enfant} brûle de fièvre. Les médecins secouent la tête.`,
  choix: (G, e) => [
   { t: 'Faire venir les meilleurs médecins (−50 or)', f: (G, e) => { G.maisons.joueur.or -= 50; return chance(.85) ? `${e.enfant} guérit.` : (G.joueur.enfants = G.joueur.enfants.filter(x => x.nom !== e.enfant), noter(G, `${e.enfant} est mort(e) en bas âge.`, 'mort'), `${e.enfant} n’a pas survécu.`); } },
   { t: 'Prier au chevet', f: (G, e) => chance(.6) ? `${e.enfant} guérit, par miracle.` : (G.joueur.enfants = G.joueur.enfants.filter(x => x.nom !== e.enfant), noter(G, `${e.enfant} est mort(e) en bas âge.`, 'mort'), `${e.enfant} s’est éteint(e) dans la nuit.`) },
  ] },
 mine_or: { titre: 'Un filon d’argent', poids: 2,
  ctx: G => ({ prov: uneProv(G).id }),
  texte: (G, e) => `Des mineurs de ${pv(G, e.prov).nom} ont trouvé un filon d’argent. Mais la galerie s’enfonce vers d’anciennes salles naines, et quelque chose y gratte dans l’ombre.`,
  choix: (G, e) => [
   { t: 'Exploiter le filon prudemment (+60 or)', f: G => gainOr(G, 60) },
   { t: 'Nettoyer les galeries d’abord (donjon, 2 étages, +prospérité)', cond: G => peutCombattre(G), f: (G, e) => ({ msg: '', combat: { type: 'mine', niveau: Math.max(1, heros(G).niveau), etages: 2, nom: 'Galeries profondes' } }) },
  ],
  apres: (G, e, X) => { if (X.resultat === 'victoire') { const p = pv(G, e.prov); p.p = Math.min(5, p.p + 1); return `Les galeries sont sûres. ${gainOr(G, 100)}, prospérité +1.`; } return gainOr(G, 20); } },
 comete: { titre: 'La comète rouge', poids: 1, unique: true,
  texte: G => 'Une comète rouge traverse le ciel trois nuits durant. Les prêtres y voient un présage : la fin d’une dynastie, la naissance d’une autre.',
  choix: G => [
   { t: 'Proclamer que c’est le signe de votre destinée (+8 prestige)', f: G => gainPrest(G, 8) },
   { t: 'Faire dire des messes (−20 or, +loyauté)', f: G => { G.maisons.joueur.or -= 20; for (const p of mesProv(G)) p.loy += 8; return 'Le peuple est rassuré.'; } },
  ] },
 deserteurs: { titre: 'Des mercenaires à vendre', poids: 3,
  texte: G => 'La Compagnie du Corbeau Blanc, une troupe de mercenaires aguerris, cherche un employeur. Leur capitaine demande 70 pièces d’or.',
  choix: G => [
   { t: 'Les engager (−70 or, +7 troupes)', cond: G => G.maisons.joueur.or >= 70, f: G => { G.maisons.joueur.or -= 70; const p = mesProv(G).sort((a, b) => b.t - a.t)[0]; p.t += 7; return `Ils rejoignent ${p.nom}.`; } },
   { t: 'Les envoyer chez un rival (+2 influence)', f: G => gainInf(G, 2) },
   { t: 'Refuser', f: G => '' },
  ] },
 heretique: { titre: 'Un sorcier capturé', poids: 2,
  texte: G => 'Vos gardes ont capturé un vieillard qui pratiquait des rites interdits dans les bois. Il propose de vous enseigner un savoir oublié en échange de sa vie.',
  choix: G => [
   { t: 'Accepter son savoir (+1 point de compétence)', f: G => { heros(G).points++; changeRel(G, 'joueur', 'solenne', -8); return 'Vous gagnez un point de compétence. Les Solenne froncent les sourcils.'; } },
   { t: 'Le livrer au bûcher (+prestige auprès des pieux)', f: G => { changeRel(G, 'joueur', 'solenne', 12); return gainPrest(G, 3); } },
  ] },
 chevalier_errant: { titre: 'Un chevalier errant', poids: 2,
  texte: G => 'Un chevalier sans bannière, couvert de cicatrices, demande à servir votre maison. Il porte une armure noire d’une facture étrange.',
  choix: G => [
   { t: 'L’accepter à votre service (+3 troupes, +2 prestige)', f: G => { mesProv(G)[0].t += 3; return gainPrest(G, 2); } },
   { t: 'Lui racheter son armure', cond: G => G.maisons.joueur.or >= 80, f: G => { G.maisons.joueur.or -= 80; const o = genObjet(heros(G).niveau + 1, heros(G).classe, { empl: 'armure', min: 'rare' }); G.joueur.inventaire.push(o); return `${o.nom} rejoint votre armurerie (−80 or).`; } },
   { t: 'Le chasser', f: G => '' },
  ] },
 grande_foire: { titre: 'La grande foire', poids: 2, cond: G => G.saison === 1,
  texte: G => 'Les marchands de tout le royaume demandent la permission de tenir une grande foire sur vos terres.',
  choix: G => [
   { t: 'Accepter et prélever une taxe (+70 or)', f: G => gainOr(G, 70) },
   { t: 'Accepter sans taxe (+loyauté, +4 prestige)', f: G => { for (const p of mesProv(G)) p.loy += 6; return gainPrest(G, 4); } },
  ] },
 trahison_alliee: { titre: 'Murmures de trahison', poids: 1, cond: G => IA_MAISONS.some(m => G.maisons.joueur.alliance[m]),
  ctx: G => ({ maison: pick(IA_MAISONS.filter(m => G.maisons.joueur.alliance[m])) }),
  texte: (G, e) => `Une lettre interceptée laisse entendre que la maison ${mN(G, e.maison)}, votre alliée, négocie en secret avec vos ennemis.`,
  choix: (G, e) => [
   { t: 'Exiger des explications', f: (G, e) => chance(.6) ? (changeRel(G, 'joueur', e.maison, 5), 'Ils jurent sur leurs dieux qu’il s’agit d’un faux.') : (G.maisons.joueur.alliance[e.maison] = G.maisons[e.maison].alliance.joueur = false, changeRel(G, 'joueur', e.maison, -20), 'Ils ne prennent même pas la peine de nier : l’alliance est rompue.') },
   { t: 'Feindre l’ignorance (+2 influence)', f: G => gainInf(G, 2) },
  ] },
 relique: { titre: 'La relique de sainte Aube', poids: 1, unique: true, cond: G => peutCombattre(G),
  texte: G => 'Un moine mourant vous révèle que la relique de sainte Aube, volée il y a un siècle, repose dans des catacombes hantées. La rendre au monastère vous vaudrait la gratitude éternelle de la maison Solenne.',
  choix: G => [
   { t: 'Partir à sa recherche (donjon, 3 étages)', f: G => ({ msg: '', combat: { type: 'catacombes', niveau: Math.max(2, heros(G).niveau + 1), etages: 3, nom: 'Catacombes de sainte Aube' } }) },
   { t: 'Laisser les morts en paix', f: G => '' },
  ],
  apres: (G, e, X) => X.resultat === 'victoire' ? (changeRel(G, 'joueur', 'solenne', 40), `La relique est rendue. Les Solenne vous vénèrent. ${gainPrest(G, 12)}.`) : 'La relique reste perdue.' },
 recrue_heros: { titre: 'Un maître d’armes', poids: 2,
  texte: G => 'Un vieux maître d’armes, ancien champion du roi, propose de vous entraîner.',
  choix: G => [
   { t: 'Suivre son enseignement (−60 or, +1 point de compétence)', cond: G => G.maisons.joueur.or >= 60, f: G => { G.maisons.joueur.or -= 60; heros(G).points++; return 'Vous gagnez un point de compétence.'; } },
   { t: 'Le confier à vos soldats (+2 troupes)', f: G => { mesProv(G)[0].t += 2; return 'Vos hommes progressent.'; } },
  ] },
 corbeaux: { titre: 'Une lettre noire', poids: 2, cond: G => !G.maisons.corbelin.elim,
  texte: G => 'Un corbeau dépose une lettre sans sceau : « Nous savons ce que vous voulez. Nous pouvons vous l’offrir. Pour un prix. » Elle est signée d’une plume noire — la marque des Corbelin.',
  choix: G => [
   { t: 'Payer leur prix (−50 or, +5 influence)', cond: G => G.maisons.joueur.or >= 50, f: G => { G.maisons.joueur.or -= 50; changeRel(G, 'joueur', 'corbelin', 15); return gainInf(G, 5); } },
   { t: 'Brûler la lettre', f: G => { changeRel(G, 'joueur', 'corbelin', -5); return 'Les cendres retombent sur la table.'; } },
  ] },
 inondation: { titre: 'La crue', poids: 1, cond: G => G.saison === 0,
  ctx: G => ({ prov: uneProv(G).id }),
  texte: (G, e) => `Le fleuve a débordé à ${pv(G, e.prov).nom}, emportant moulins et récoltes.`,
  choix: (G, e) => [
   { t: 'Reconstruire (−40 or)', f: (G, e) => { G.maisons.joueur.or -= 40; pv(G, e.prov).loy += 10; return 'Les digues sont relevées.'; } },
   { t: 'Exempter d’impôts une saison (−revenus)', f: (G, e) => { G.maisons.joueur.or -= Math.round(revenuProv(G, pv(G, e.prov))); pv(G, e.prov).loy += 15; return 'Le peuple vous est reconnaissant.'; } },
  ] },
 heritier_fugue: { titre: 'Le jeune lion', poids: 1, cond: G => G.joueur.enfants.some(x => x.age >= 14 && x.age < 20),
  ctx: G => ({ enfant: pick(G.joueur.enfants.filter(x => x.age >= 14 && x.age < 20)).nom }),
  texte: (G, e) => `${e.enfant} a fugué pour rejoindre un tournoi de jeunes écuyers, sans votre permission.`,
  choix: (G, e) => [
   { t: 'Le laisser faire (+prestige si victoire)', f: (G, e) => chance(.5) ? `${e.enfant} remporte la joute ! ${gainPrest(G, 6)}.` : `${e.enfant} rentre avec un bras cassé et beaucoup d’orgueil en moins.` },
   { t: 'Le faire ramener de force', f: G => 'L’héritier boude, mais il est en sécurité.' },
  ] },
 tresor_royal: { titre: 'Le trésor du roi', poids: 1, cond: G => G.roiMort && !G.maisons.draknor.elim,
  texte: G => 'Un intendant des Draknor, qui craint pour sa vie, propose de vous livrer une partie du trésor royal en échange de votre protection.',
  choix: G => [
   { t: 'Accepter (+100 or, les Draknor vous haïssent)', f: G => { changeRel(G, 'joueur', 'draknor', -30); return gainOr(G, 100); } },
   { t: 'Le livrer au jeune roi', f: G => { changeRel(G, 'joueur', 'draknor', 25); return gainPrest(G, 3); } },
  ] },
 loups: { titre: 'L’hiver des loups', poids: 2, cond: G => G.saison === 3 && peutCombattre(G),
  ctx: G => ({ prov: uneProv(G).id }),
  texte: (G, e) => `Des meutes affamées descendent des montagnes et attaquent les fermes de ${pv(G, e.prov).nom}.`,
  choix: (G, e) => [
   { t: 'Mener la chasse (combat)', f: (G, e) => ({ msg: '', combat: { type: 'foret', niveau: Math.max(1, heros(G).niveau), etages: 1, nom: 'Chasse aux loups' } }) },
   { t: 'Offrir une prime par tête (−25 or)', f: (G, e) => { G.maisons.joueur.or -= 25; pv(G, e.prov).loy += 5; return 'Les paysans s’en chargent.'; } },
  ],
  apres: (G, e, X) => X.resultat === 'victoire' ? (pv(G, e.prov).loy += 12, `Les meutes sont décimées. ${gainPrest(G, 3)}.`) : 'Les loups continuent leurs ravages.' },
};

function tirerEvenements(G) {
 if (!mesProv(G).length) return;
 const n = chance(.35) ? 2 : 1;
 const dispo = Object.keys(EVTS).filter(id => { const E = EVTS[id]; if (!E.poids) return false; if (E.unique && G.vus[id]) return false; if (E.cond && !E.cond(G)) return false; if (G.vus['t_' + id] && G.tour - G.vus['t_' + id] < 6) return false; return true; });
 for (let i = 0; i < n && dispo.length; i++) {
  const tot = dispo.reduce((s, id) => s + EVTS[id].poids, 0); let r = R() * tot, id = dispo[0];
  for (const k of dispo) { r -= EVTS[k].poids; if (r <= 0) { id = k; break; } }
  dispo.splice(dispo.indexOf(id), 1);
  const e = Object.assign({ id }, EVTS[id].ctx ? EVTS[id].ctx(G) : {});
  G.evts.push(e); G.vus['t_' + id] = G.tour + 1;
 }
}
function ouvrirEvt(G, e) { const E = EVTS[e.id]; if (!e.ouvert) { e.ouvert = true; if (E.unique) G.vus[e.id] = true; if (E.pre) E.pre(G, e); } return { titre: E.titre, texte: E.texte(G, e), choix: E.choix(G, e).map((c, i) => ({ t: c.t, i, ok: !c.cond || c.cond(G, e) })) }; }
function choisirEvt(G, e, i) { const E = EVTS[e.id]; const c = E.choix(G, e)[i]; const r = c.f(G, e); G.evts.splice(G.evts.indexOf(e), 1); if (r && typeof r === 'object') return r; return { msg: r || '' }; }
function apresCombatEvt(G, e, X) { const E = EVTS[e.id]; return E.apres ? E.apres(G, e, X) : ''; }
