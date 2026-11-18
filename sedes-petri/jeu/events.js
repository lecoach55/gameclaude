'use strict';
/* =========================================================
   SEDES PETRI — chroniques et événements
   ========================================================= */
function pickR(f) { const c = catholics(f); return c.length ? pick(c) : null; }
function pickA(f) { const c = activeRealms(f); return c.length ? pick(c) : null; }
const B = s => `<b>${s}</b>`;
const que_ = s => /^[aeiouéèêîâôh]/i.test(String(s).replace(/<[^>]+>/g, '')) ? 'qu’' + s : 'que ' + s;
const EVENTS = [];
const E = o => EVENTS.push(o);

E({ id: 'ermite', w: 3, art: 'people', cool: 10, make() {
 const r = pickR(x => RL(x).fervor < 70); if (!r) return null;
 return { realm: r, title: `L’ermite ${de_(cityOf(r))}`, text: `Un ermite vêtu de toile de sac, monté sur un âne, parcourt les routes ${B(deR(r))}. Des foules le suivent pieds nus ; il réconcilie les ennemis, rachète les filles perdues, et accuse les évêques de s’engraisser du bien des pauvres. Les prélats réclament son arrestation.`,
  opts: [{ t: 'Le bénir publiquement', d: 'Ferveur +8 · risque d’hérésie si la corruption est forte', fx() { modF(r, 8); modA(1); if (S.corruption > 50) { modH(r, 5); return 'Ses disciples, enhardis, attaquent de plus en plus le clergé…'; } return 'L’ermite baise l’anneau du pape et repart prêcher la croix.'; } },
   { t: 'Le faire examiner par un légat', d: 'Autorité +2 · ferveur +3', fx() { modA(2); modF(r, 3); return 'Le légat le déclare orthodoxe mais lui interdit de prêcher contre les évêques.'; } },
   { t: 'Lui imposer le silence', d: 'Ferveur −3 · hérésie +6', fx() { modF(r, -3); modH(r, 6); return 'Ses fidèles se dispersent dans les bois… et commencent à se réunir en secret.'; } }] };
}});

E({ id: 'relique', w: 2, art: 'cross', cool: 14, make() {
 const rel = pick(['un fragment de la Vraie Croix', 'le bras droit de saint André', 'un clou de la Passion', 'le chef de saint Jean-Baptiste', 'une épine de la Sainte Couronne', 'le voile de sainte Véronique']);
 return { title: 'Un marchand de reliques', text: `Un marchand amalfitain, débarqué de Constantinople, demande audience. Dans un coffret d’argent ciselé repose, assure-t-il, ${B(rel)}. Il en demande quatre-vingts marcs « pour le salut de son âme ». Les pèlerins accourraient de toute la Chrétienté pour la vénérer.`,
  opts: [{ t: 'Acheter la relique (80 marcs)', d: 'Pèlerinages +2/saison · ferveur +2', req: () => S.treasury >= 80 ? null : 'Trésor insuffisant', fx() { modT(-80); S.relics++; modF('etats', 4); modF('all', 1); return 'La relique est portée en procession jusqu’au Latran.'; } },
   { t: 'La faire authentifier d’abord (20 marcs)', d: 'Une chance sur deux : relique acquise, ou fraude démasquée (autorité +2)', req: () => S.treasury >= 20 ? null : 'Trésor insuffisant', fx() { modT(-20); if (chance(0.5)) { S.relics++; modT(-50); return 'Les experts sont formels : la relique est authentique. Le marchand consent un rabais (50 marcs).'; } modA(2); return 'Le prétendu ossement est celui d’une chèvre. Le marchand est fouetté sur le Champ de Flore.'; } },
   { t: 'Éconduire le marchand', d: 'Aucun effet', fx() { return 'Le marchand repart vers Venise, où l’on est moins regardant.'; } }] };
}});

E({ id: 'simonie', w: 3, art: 'coins', cool: 10, make() {
 const r = pickR(x => RL(x).ruler && !RL(x).ruler.c && RL(x).invest < 70); if (!r) return null;
 const sum = ri(3, 8) * 100;
 return { realm: r, title: `Un évêché vendu ${enR(r)}`, text: pick([`On rapporte que le nouvel évêque ${B(de_(cityOf(r)))} a versé ${sum} marcs d’argent ${auRuler(r)} pour obtenir la crosse et l’anneau. Il ne sait pas lire le latin, entretient une meute de chiens et deux concubines. Les chanoines en appellent au pape.`, `Le neveu ${B(duRuler(r))}, à peine âgé de quinze ans, vient d’être fait évêque ${B(de_(cityOf(r)))} : sa famille a remis ${sum} marcs ${auRuler(r)} le jour même de l’élection. Il n’a reçu ni la prêtrise ni l’ordre de diacre. Le chapitre en appelle au pape.`, `Un archidiacre ${B(de_(cityOf(r)))} dénonce un marché scandaleux : la crosse de son église a été adjugée, comme un fief, au plus offrant — ${sum} marcs versés ${auRuler(r)}. L’heureux élu revend déjà les cures du diocèse pour rentrer dans ses frais.`]),
  opts: [{ t: 'Déposer l’évêque simoniaque', d: 'Investitures +8 · corruption −2 · autorité +3 · relation −10', fx() { modInv(r, 8); modC(-2); modA(3); modRel(r, -10); RL(r).offense++; return 'Le légat arrache le pallium devant tout le chapitre.'; } },
   { t: 'Le confirmer contre une amende', d: 'Trésor +40 · corruption +3', fx() { modT(40); modC(3); return 'L’amende est payée. On ne parle plus de rien.'; } },
   { t: 'Fermer les yeux', d: 'Relation +3 · corruption +2', fx() { modRel(r, 3); modC(2); } }] };
}});

E({ id: 'annulation', w: 2, art: 'wedding', cool: 16, make() {
 const r = pickR(x => RL(x).ruler && !RL(x).ruler.c && !RL(x).ruler.f && RL(x).ruler.a > 18 && RL(x).ruler.a < 60); if (!r) return null;
 return { realm: r, title: `${rulerLbl(r)} veut répudier sa reine`, text: `${B(capFirst(leRuler(r)))} demande l’annulation de son mariage, invoquant une parenté au septième degré que nul n’avait remarquée le jour des noces. Chacun sait qu’il convoite une héritière plus richement dotée. La reine, réfugiée dans un couvent, en appelle au Saint-Siège.`,
  opts: [{ t: 'Accorder l’annulation', d: 'Relation +20 · autorité −6 · corruption +3', fx() { modRel(r, 20); modA(-6); modC(3); return 'La sentence est rendue. La reine délaissée maudit Rome.'; } },
   { t: 'Défendre le sacrement du mariage', d: 'Relation −20 · autorité +5', fx() { modRel(r, -20); modA(5); RL(r).offense++; return 'Le pape ordonne au roi de reprendre son épouse légitime.'; } },
   { t: 'Ordonner une longue enquête', d: 'Relation −4 · autorité +1', fx() { modRel(r, -4); modA(1); } }] };
}});

E({ id: 'dispense', w: 2, art: 'wedding', cool: 10, make() {
 const c = catholics(x => RL(x).ruler && !RL(x).ruler.c); if (c.length < 2) return null; const a = pick(c); const b = pick(c.filter(x => x !== a));
 return { title: 'Une dispense matrimoniale', text: pick([`Les cours ${B(deShort(a))} et ${B(deShort(b))} veulent unir leurs héritiers pour sceller la paix. Hélas, les fiancés sont cousins au quatrième degré : sans dispense pontificale, l’union serait incestueuse.`, `Pour mettre fin à une guerre de frontière, ${B(deShort(a))} et ${B(deShort(b))} ont arrangé le mariage de leurs enfants. Mais les généalogistes de la Curie ont retrouvé une aïeule commune : les fiancés sont parents au quatrième degré. Les ambassadeurs attendent la dispense.`, `Deux ambassades arrivent ensemble au Latran, les bras chargés de présents : les cours ${B(deShort(a))} et ${B(deShort(b))} veulent unir leurs maisons, malgré une parenté que le droit canon interdit. Sans dispense, l’alliance tombe.`]),
  opts: [{ t: 'Accorder la dispense contre une taxe', d: 'Trésor +30 · relations +6', fx() { modT(30); modRel(a, 6); modRel(b, 6); modC(1); } },
   { t: 'Accorder la dispense gratuitement', d: 'Relations +10 · autorité +1', fx() { modRel(a, 10); modRel(b, 10); modA(1); } },
   { t: 'Refuser : le droit canon est formel', d: 'Autorité +2 · relations −8', fx() { modA(2); modRel(a, -8); modRel(b, -8); } }] };
}});

E({ id: 'miracle', w: 2, art: 'miracle', cool: 10, make() {
 const r = pickR(); if (!r) return null; const what = pick(['une statue de la Vierge pleure des larmes de sang', 'un aveugle-né a recouvré la vue sur le tombeau d’un saint ermite', 'une hostie consacrée a saigné sur le corporal', 'des lumières dansent chaque nuit au-dessus d’une source']);
 return { realm: r, title: pick([`Prodige à ${cityOf(r)}`, `Un miracle à ${cityOf(r)} ?`]), text: pick([`À ${B(cityOf(r))}, ${what}. Les pèlerins affluent, les marchands de cierges font fortune, et l’évêque demande au pape de reconnaître le miracle.`, `On écrit ${B(deR(r))} ${que_(what)}. L’évêque ${B(de_(cityOf(r)))} a fait dresser un autel provisoire ; les offrandes affluent déjà, et les chanoines demandent au pape de reconnaître le prodige.`, `Depuis la Saint-Jean, à ${B(cityOf(r))}, ${what}. Les uns crient au miracle, les autres à la sorcellerie. L’évêque, prudent, s’en remet au jugement du Saint-Siège.`]),
  opts: [{ t: 'Reconnaître le miracle', d: 'Ferveur +10 · trésor +15', fx() { modF(r, 10); modT(15); } },
   { t: 'Ouvrir une enquête canonique', d: 'Autorité +3 · ferveur +3', fx() { modA(3); modF(r, 3); } },
   { t: 'Dénoncer une supercherie', d: 'Autorité +1 · ferveur −4', fx() { modA(1); modF(r, -4); } }] };
}});

E({ id: 'famine', w: 2, art: 'harvest', cool: 8, make() {
 const r = pickR(); if (!r) return null;
 return { realm: r, title: pick([`Famine ${enR(r)}`, `La faim ${enR(r)}`, `Les greniers vides ${deR(r)}`]), text: pick([`Les pluies d’été ont pourri les blés sur pied. ${capFirst(enR(r))}, on mange l’écorce et l’herbe ; des bandes de mendiants assiègent les monastères. Certains prêcheurs disent que Dieu punit les péchés du clergé.`, `Un hiver interminable a gelé les semailles. ${capFirst(enR(r))}, les paysans vendent leurs bœufs, puis leurs outils, puis leurs enfants comme serfs. On a vu des loups entrer dans les villages. L’évêque demande des secours au Saint-Siège.`, `Trois récoltes manquées de suite : ${enR(r)}, le setier de froment vaut dix fois son prix. Des files de paysans affamés marchent vers les villes, où les portes se ferment devant eux. Les monastères distribuent leur dernière avoine.`]),
  opts: [{ t: 'Envoyer des aumônes (40 marcs)', d: 'Ferveur +8 · relation +8', req: () => S.treasury >= 40 ? null : 'Trésor insuffisant', fx() { modT(-40); modF(r, 8); modRel(r, 8); } },
   { t: 'Ordonner des processions et des jeûnes', d: 'Ferveur +3', fx() { modF(r, 3); } },
   { t: 'Ne rien faire', d: 'Ferveur −5 · hérésie +4', fx() { modF(r, -5); modH(r, 4); } }] };
}});

E({ id: 'comete', w: 1, art: 'star', cool: 40, make() {
 return { title: pick(['Une comète dans le ciel d’Occident', 'L’étoile chevelue']), text: pick(['Une étoile chevelue traverse le ciel pendant quarante nuits, sa queue tournée vers l’Orient. Les astrologues de la Curie se disputent : présage de mort d’un roi, de peste, de guerre — ou appel de Dieu ?', 'Un astre flamboyant se lève chaque soir à l’ouest, plus brillant que Vénus. À Paris, on y voit l’annonce de la fin des temps ; à Rome, les astrologues de la Curie proposent d’en tirer l’horoscope de l’Église.', 'Depuis l’Épiphanie, une comète traîne sa queue rougeâtre au-dessus des Alpes. Les moines notent le prodige dans leurs annales ; des prophètes errants annoncent la chute d’un grand prince.']),
  opts: [{ t: 'Y voir un appel à la croisade', d: 'Ardeur de croisade (recrutement accru) · autorité +2', fx() { S.flags.zeal = 1; modA(2); } },
   { t: 'Y voir un appel à la pénitence', d: 'Ferveur +4 partout', fx() { modF('all', 4); } },
   { t: 'Laisser les savants en disputer', d: 'Cardinaux : compétence +1 pour deux d’entre eux', fx() { shuffle(S.cardinals.slice()).slice(0, 2).forEach(c => c.comp = clamp(c.comp + 1, 1, 10)); } }] };
}});

E({ id: 'theologien', w: 2, art: 'book', cool: 24, make() {
 if (S.year < 1100) return null; const r = pick(['france', 'angleterre', 'lombardie', 'empire'].filter(active)); if (!r) return null;
 const who = pick(['Pierre de Clairmont', 'Gilbert de Chartres', 'Jean de Brescia', 'Robert d’Oxford', 'Amaury de Bène', 'Siger de Gand']);
 return { realm: r, title: `L’affaire de maître ${who}`, text: `Maître ${B(who)} enseigne à des milliers d’étudiants que « par le doute nous parvenons à la recherche, et par la recherche à la vérité ». Ses gloses sur la Trinité scandalisent les moines. Un abbé très écouté exige sa condamnation par un synode.`,
  opts: [{ t: 'Condamner ses thèses', d: 'Autorité +4 · hérésie −3', fx() { modA(4); modH(r, -3); } },
   { t: 'Le protéger', d: 'Cardinaux plus savants · hérésie +4 · autorité −1', fx() { S.cardinals.forEach(c => { if (chance(0.3)) c.comp = clamp(c.comp + 1, 1, 10); }); modH(r, 4); modA(-1); } },
   { t: 'Organiser une dispute publique (20 marcs)', d: 'Ferveur +2 · autorité +2', req: () => S.treasury >= 20 ? null : 'Trésor insuffisant', fx() { modT(-20); modF(r, 2); modA(2); } }] };
}});

E({ id: 'eveque_roi', w: 3, art: 'bishop', cool: 10, make() {
 const r = pickR(x => RL(x).ruler && !RL(x).ruler.c && RL(x).invest > 20); if (!r) return null; const v = ri(0, 2);
 return { realm: r, title: [`Le chancelier ${duRuler(r)}`, `Un courtisan crossé ${enR(r)}`, `Le confesseur ${duRuler(r)}`][v], text: ([`${B(capFirst(leRuler(r)))} entend faire élire son chancelier, un clerc de cour habile aux comptes mais ignorant des choses de Dieu, à l’archevêché ${B(de_(cityOf(r)))}. Le chapitre cathédral, menacé, a cédé. Le roi attend la confirmation du pape.`, `À la mort de l’archevêque ${B(de_(cityOf(r)))}, ${B(leRuler(r))} a fait porter la crosse à un jeune cousin de sa propre maison, à peine sous-diacre, qui chasse le faucon mieux qu’il ne lit le bréviaire. Les chanoines ont signé sous la menace des sergents. Le roi attend la confirmation du pape.`, `Le siège ${B(de_(cityOf(r)))} est vacant. Plutôt que d’attendre l’élection canonique, ${B(leRuler(r))} y a nommé son confesseur, un homme pieux mais qui doit tout au roi et ne contredira jamais la couronne. Les moines de la cathédrale protestent par lettre ; le roi attend la confirmation du pape.`])[v],
  opts: [{ t: 'Confirmer le candidat royal', d: 'Investitures −12 · relation +10', fx() { modInv(r, -12); modRel(r, 10); } },
   { t: 'Casser l’élection', d: 'Investitures +4 · relation −12 · autorité +2', fx() { modInv(r, 4); modRel(r, -12); modA(2); RL(r).offense++; } },
   { t: 'Proposer un candidat de compromis', d: 'Investitures −4 · relation +3 · autorité +1', fx() { modInv(r, -4); modRel(r, 3); modA(1); } }] };
}});

E({ id: 'pogrom', w: 2, art: 'fire', cool: 16, make() {
 const r = ['empire', 'france', 'angleterre', 'castille', 'aragon'].filter(active).find(() => chance(0.4)); if (!r) return null;
 if (!S.crusade && chance(0.6)) return null;
 return { realm: r, title: `Violences contre les juifs ${de_(cityOf(r))}`, text: `Échauffées par des prêcheurs exaltés, des bandes armées menacent les communautés juives ${B(de_(cityOf(r)))} et des villes voisines, les sommant de choisir entre le baptême et la mort. L’évêque a ouvert son palais aux réfugiés, mais la foule gronde à ses portes.`,
  opts: [{ t: 'Rappeler la bulle Sicut Judaeis et condamner les violences', d: 'Autorité +3 · ferveur −1 localement', fx() { modA(3); modF(r, -1); return 'La bulle interdit de baptiser de force, de tuer ou de dépouiller les juifs. Les évêques la font lire en chaire.'; } },
   { t: 'Ordonner aux évêques de les protéger (20 marcs)', d: 'Autorité +4', req: () => S.treasury >= 20 ? null : 'Trésor insuffisant', fx() { modT(-20); modA(4); return 'Les palais épiscopaux deviennent des refuges. Beaucoup de vies sont sauvées.'; } },
   { t: 'Garder le silence', d: 'Autorité −6 · corruption +2', fx() { modA(-6); modC(2); return 'Le silence de Rome est remarqué. Des chroniqueurs le consigneront.'; } }] };
}});

E({ id: 'pelerins', w: 2, art: 'cross', cool: 14, make() {
 const j = RL(S.own.jerusalem); if (j.relig === 'catholique') return null;
 return { title: 'Pèlerins massacrés', text: `Une caravane de sept mille pèlerins allemands, conduite par l’évêque de Bamberg, a été attaquée sur la route de ${B('Jérusalem')}. Les rescapés, nus et blessés, racontent leur calvaire dans toutes les églises d’Occident.`,
  opts: [{ t: 'Prêcher la vengeance du Christ', d: 'Ardeur de croisade · ferveur +3', fx() { S.flags.zeal = 1; modF('all', 3); } },
   { t: 'Négocier un sauf-conduit avec le sultan (20 marcs)', d: `Relation ${rname(S.own.jerusalem)} +10 · autorité +1`, req: () => S.treasury >= 20 ? null : 'Trésor insuffisant', fx() { modT(-20); modRel(S.own.jerusalem, 10); modA(1); } },
   { t: 'Prier pour les martyrs', d: 'Ferveur +1', fx() { modF('all', 1); } }] };
}});

E({ id: 'petition', w: 4, art: 'church', cool: 4, make() {
 const k = Object.keys(ORDERS).find(o => !S.orders.includes(o) && !S.flags['ord_' + o] && S.year >= ORDERS[o].min); if (!k) return null;
 const O = ORDERS[k];
 return { title: `Supplique : ${O.n}`, text: `${B(O.who)} se présente au consistoire, en habit rapiécé, et demande au pape d’approuver la règle d’une nouvelle communauté : ${B(O.n)}. ${O.d} Certains cardinaux s’inquiètent de ces nouveautés ; d’autres y voient le souffle de l’Esprit.`,
  opts: [{ t: 'Approuver la règle', d: O.d, fx() { S.orders.push(k); S.flags['ord_' + k] = 1; modA(2); log(`Approbation de l’${O.n}.`, 'good'); if (S.orders.length >= 6) ach('ordres'); if (k === 'teutoniques' && RL('teutons').dormant === false) RL('teutons').base += 2; } },
   { t: 'Approuver avec une règle plus stricte', d: 'L’ordre est approuvé sous étroite surveillance · autorité +3 · corruption −1', fx() { S.orders.push(k); S.flags['ord_' + k] = 1; modA(3); modC(-1); log(`Approbation encadrée de l’${O.n}.`, 'good'); } },
   { t: 'Rejeter la supplique', d: 'Ferveur −2 · hérésie +3 partout', fx() { S.flags['ord_' + k] = 1; modF('all', -2); modH('all', 3); return 'Les disciples déçus prêchent désormais sans l’aveu de Rome…'; } }] };
}});

E({ id: 'seigneur', hist: false, art: 'castle', make(p) {
 p = p || pick(PATRI.filter(x => S.own[x] === 'etats')); if (!p) return null;
 const lord = pick(['Rainone di Tuscolo', 'Odone di Poli', 'Gualtiero di Ceccano', 'Giordano di Montefiascone', 'Benedetto di Narni', 'Corrado di Urslingen']);
 return { title: `Le seigneur ${de_(pick(['Tusculum', 'Poli', 'Ceccano', 'Narni', 'Spolète', 'Orvieto']))} se rebelle`, text: `${B(lord)}, vassal de l’Église en ${PROV[p].n}, refuse l’hommage, rançonne les pèlerins de la via Francigena et a pendu le collecteur pontifical aux créneaux de son château.`,
  opts: [{ t: 'Envoyer la milice', d: 'Exige 200 hommes · contrôle +20 en cas de succès', req: () => S.army >= 200 ? null : '200 hommes requis', fx() { if (chance(0.45 + S.army / 2000)) { S.ctrl[p] = clamp(S.ctrl[p] + 20, 0, 100); modA(1); return 'Le château est pris d’assaut ; le félon finit ses jours dans un cachot.'; } S.army -= 100; S.ctrl[p] = clamp(S.ctrl[p] - 8, 0, 100); return 'La milice s’enlise dans un siège interminable puis se retire.'; } },
   { t: 'Acheter sa soumission (40 marcs)', d: 'Contrôle +12', req: () => S.treasury >= 40 ? null : 'Trésor insuffisant', fx() { modT(-40); S.ctrl[p] = clamp(S.ctrl[p] + 12, 0, 100); } },
   { t: 'L’excommunier', d: 'Contrôle +5 · autorité +1', fx() { S.ctrl[p] = clamp(S.ctrl[p] + 5, 0, 100); modA(1); } }] };
}});

E({ id: 'tibre', w: 1, art: 'rome', cool: 20, make() {
 if (S.curia !== 'rome') return null;
 return { title: pick(['Le Tibre en crue', 'Rome sous les eaux']), text: pick(['Après trois semaines de pluies, le Tibre a envahi le Champ de Mars jusqu’au Panthéon. Des barques circulent devant Sainte-Marie-in-Aracoeli ; les greniers sont noyés, et la fièvre guette.', 'Le fleuve a rompu ses rives en pleine nuit. Au matin, l’eau couvre le Trastevere jusqu’aux genoux des statues ; les moulins flottants ont été emportés vers Ostie, et l’on manque déjà de farine.', 'Des pluies diluviennes sont tombées sur l’Apennin : le Tibre monte d’une coudée par jour. Les pèlerins logés près du pont Saint-Ange ont fui vers le Vatican, et les égouts antiques refoulent dans les ruelles.']),
  opts: [{ t: 'Financer les secours (40 marcs)', d: 'Peuple +12 · stabilité +4', req: () => S.treasury >= 40 ? null : 'Trésor insuffisant', fx() { modT(-40); modPeople(12); modStab(4); } },
   { t: 'Laisser les barons s’en charger', d: 'Stabilité −6 · peuple −8', fx() { modStab(-6); modPeople(-8); } }] };
}});

E({ id: 'fievres', w: 2, art: 'plague', cool: 8, make() {
 if (S.season !== 1 || S.curia !== 'rome') return null;
 return { title: pick(['Les fièvres de l’été romain', 'La malaria']), text: pick(['La malaria monte des marais pontins. Deux camériers sont morts cette semaine ; les cardinaux âgés tremblent dans leurs palais. Les papes ont coutume de fuir l’été romain vers les hauteurs d’Anagni ou de Viterbe.', 'La chaleur d’août est écrasante ; les marais d’Ostie exhalent la fièvre. Trois cardinaux sont alités, et les médecins pressent le pape de quitter le Latran pour les collines.', 'Le « mauvais air » de l’été décime la Curie : les scribes de la Chancellerie meurent à leur pupitre, et les audiences sont suspendues. Les cardinaux supplient le pape de partir pour Rieti ou Viterbe.']),
  opts: [{ t: 'Fuir à Anagni pour l’été (20 marcs)', d: 'Santé −2 · stabilité −3', req: () => S.treasury >= 20 ? null : 'Trésor insuffisant', fx() { modT(-20); modHealth(-2); modStab(-3); } },
   { t: 'Rester à Rome avec le peuple', d: 'Santé −10 · autorité +2 · peuple +6 · un cardinal âgé peut mourir', fx() { modHealth(-10); modA(2); modPeople(6); const old = S.cardinals.filter(c => c.age > 65); if (old.length && chance(0.6)) { const c = pick(old); log(`Le cardinal ${cname(c)} succombe aux fièvres.`, 'info'); removeCardinal(c); } } }] };
}});

E({ id: 'banquiers', w: 2, art: 'city', cool: 10, make() {
 if (S.treasury > 120 || !lender()) return null;
 return { title: 'Les banquiers sont à la porte', text: `Les ${B(lender())} apprennent que les coffres de la Chambre apostolique sonnent creux. Ils proposent une avance de 250 marcs, remboursable sur les dîmes futures, à un intérêt que les théologiens qualifieraient d’usuraire s’il ne s’agissait du pape.`,
  opts: [{ t: 'Accepter l’avance', d: 'Trésor +250 · dette +300', fx() { modT(250); S.debt += 300; } },
   { t: 'Refuser', d: 'Aucun effet', fx() { } }] };
}});

E({ id: 'commerce', w: 1, art: 'city', cool: 20, make() {
 if (S.year < 1150) return null; const r = pick(['venise', 'genes'].filter(active)); if (!r) return null;
 return { realm: r, title: `Les galères ${deShort(r)} à Alexandrie`, text: pick([`Malgré les interdits, les marchands ${B(deShort(r))} vendent du bois, du fer et des esclaves aux Sarrasins d’Alexandrie, en échange de poivre et de soie. Les ordres militaires d’Outremer protestent : ce fer reviendra en flèches.`, `Une galère ${B(deShort(r))} a été arraisonnée par les Hospitaliers au large de Chypre : ses cales étaient pleines de lames de Lombardie et de bois de construction destinés au sultan d’Égypte. Les armateurs protestent de leur bonne foi.`, `Les comptoirs ${B(deShort(r))} d’Alexandrie et de Beyrouth prospèrent : épices, soieries et sucre contre fer, armes et bois. Le légat d’Outremer supplie le pape de frapper ce commerce d’excommunication.`]),
  opts: [{ t: 'Excommunier les marchands', d: 'Relation −20 · autorité +3', fx() { modRel(r, -20); modA(3); } },
   { t: 'Vendre des licences de commerce', d: 'Trésor +45 · corruption +3 · autorité −2', fx() { modT(45); modC(3); modA(-2); } },
   { t: 'Ignorer', d: 'Aucun effet', fx() { } }] };
}});

E({ id: 'couronne', w: 2, art: 'crown', cool: 14, make() {
 const r = pickR(x => ['portugal', 'aragon', 'hongrie', 'pologne', 'navarre', 'ecosse', 'danemark', 'suede', 'norvege', 'irlande', 'sicile'].includes(x) && RL(x).rel >= 25 && !RL(x).vassal && RL(x).ruler && !RL(x).ruler.c); if (!r) return null;
 return { realm: r, title: `${rulerLbl(r)} demande sa couronne à Rome`, text: `${B(capFirst(leRuler(r)))} veut que sa royauté soit consacrée par le successeur de Pierre, au-dessus de toute prétention impériale. Il offre de tenir son royaume en fief du Saint-Siège et de verser un cens annuel.`,
  opts: [{ t: 'Recevoir le royaume en vassalité', d: 'Royaume vassal (cens +4/saison) · relation +15 · autorité +4', fx() { RL(r).vassal = true; modRel(r, 15); modA(4); if (r === 'sicile' || r === 'hongrie' || r === 'pologne') modRel('empire', -10); } },
   { t: 'Couronner sans vassalité', d: 'Relation +10 · autorité +1', fx() { modRel(r, 10); modA(1); } },
   { t: 'Refuser', d: 'Relation −10', fx() { modRel(r, -10); } }] };
}});

E({ id: 'mystique', w: 1, art: 'miracle', cool: 20, make() {
 const r = pickR(); if (!r) return null; const who = pick(['l’abbesse Hildegarde', 'la recluse Julienne', 'sœur Mechtilde', 'la béguine Marguerite', 'la tertiaire Angèle', 'la veuve Dorothée']);
 return { realm: r, title: 'Les visions d’une moniale', text: `${capFirst(enR(r))}, ${B(who)} décrit des visions d’une beauté et d’une précision troublantes : la Jérusalem céleste, les chœurs des anges, et les péchés des prélats romains. Ses écrits circulent de couvent en couvent.`,
  opts: [{ t: 'Approuver ses écrits', d: 'Ferveur +6 · autorité +2', fx() { modF(r, 6); modA(2); } },
   { t: 'Les soumettre aux théologiens', d: 'Autorité +1', fx() { modA(1); } },
   { t: 'Les condamner', d: 'Ferveur −3 · hérésie +4', fx() { modF(r, -3); modH(r, 4); } }] };
}});

E({ id: 'universite', w: 1, art: 'book', cool: 30, make() {
 if (S.year < 1150) return null; const c = pick([['france', 'Paris'], ['lombardie', 'Bologne'], ['angleterre', 'Oxford'], ['castille', 'Salamanque']].filter(x => active(x[0])));
 if (!c) return null; const [r, city] = c;
 return { realm: r, title: `Les maîtres ${de_(city)}`, text: `Après une rixe de taverne, les sergents ${duRuler(r)} ont tué des étudiants ${B(de_(city))}. Les maîtres font grève, menacent de quitter la ville et demandent au pape de les placer sous sa seule juridiction.`,
  opts: [{ t: 'Accorder des privilèges pontificaux', d: 'Autorité +4 · relation −5 · cardinaux mieux formés', fx() { modA(4); modRel(r, -5); S.flags.univ = (S.flags.univ || 0) + 1; S.cardinals.forEach(c => { if (chance(0.2)) c.comp = clamp(c.comp + 1, 1, 10); }); } },
   { t: 'Laisser le souverain juger', d: 'Relation +5', fx() { modRel(r, 5); } }] };
}});

E({ id: 'abbaye', w: 2, art: 'monastery', cool: 8, make() {
 const r = pickR(); if (!r) return null; const ab = pick(['Saint-Gall', 'Fulda', 'Saint-Denis', 'Montecassino', 'Cluny', 'Westminster', 'Sahagún', 'Corvey', 'Farfa', 'Saint-Bertin']);
 return { realm: r, title: `Le scandale ${de_(ab)}`, text: pick([`Les moines ${B(de_(ab))} vivent en princes : chasses, festins, servantes. L’abbé a hypothéqué les reliquaires pour payer ses dettes de jeu. Les paysans des domaines abbatiaux murmurent.`, `L’abbaye ${B(de_(ab))} n’a plus d’abbé depuis deux ans : les moines, divisés en deux factions, ont élu chacun le leur et se disputent les clefs du trésor à coups de bâton. Le comte du lieu, ravi, a saisi trois villages de l’abbaye.`, `Un visiteur rapporte que l’abbé ${B(de_(ab))} a installé sa famille dans le cloître, marié sa nièce avec la dot du monastère et vend les charges de prieur au plus offrant. La règle de saint Benoît n’est plus lue au chapitre.`]),
  opts: [{ t: 'Envoyer des réformateurs (15 marcs)', d: 'Corruption −3 · ferveur +2', req: () => S.treasury >= 15 ? null : 'Trésor insuffisant', fx() { modT(-15); modC(-3); modF(r, 2); } },
   { t: 'Placer l’abbaye en commende et en percevoir les revenus', d: 'Trésor +50 · corruption +3', fx() { modT(50); modC(3); } },
   { t: 'Ignorer', d: 'Corruption +2', fx() { modC(2); } }] };
}});

E({ id: 'taxe_clerge', w: 2, art: 'coins', cool: 12, make() {
 const r = pickR(x => (hasT(x, 'ambitieux') || hasT(x, 'avide') || hasT(x, 'guerrier')) && RL(x).ruler && !RL(x).ruler.c); if (!r) return null;
 return { realm: r, title: `${rulerLbl(r)} veut taxer son clergé`, text: pick([`Pour financer sa guerre, ${B(leRuler(r))} exige des églises de son royaume un décime sur tous leurs revenus. Les évêques demandent au pape s’ils doivent obéir à César ou à Dieu.`, `${capFirst(leRuler(r))} a fait saisir les revenus des abbayes vacantes et réclame aux évêques un « don gracieux » pour ses campagnes. Ceux qui refusent voient leurs terres occupées par les sergents royaux. Le clergé ${B(deR(r))} en appelle au pape.`, `Les collecteurs ${B(duRuler(r))} sont entrés dans les sacristies pour inventorier les calices et les reliquaires : le roi entend « emprunter » l’argenterie des églises pour payer ses troupes. Les évêques attendent la parole de Rome.`]),
  opts: [{ t: 'Interdire toute taxe sans l’aveu du pape', d: 'Relation −18 · autorité +4', fx() { modRel(r, -18); modA(4); RL(r).offense++; } },
   { t: 'Autoriser contre une part du produit', d: 'Trésor +40 · relation +5 · investitures −5', fx() { modT(40); modRel(r, 5); modInv(r, -5); } },
   { t: 'Autoriser sans condition', d: 'Relation +12 · investitures −8 · autorité −2', fx() { modRel(r, 12); modInv(r, -8); modA(-2); } }] };
}});

E({ id: 'captifs', w: 1, art: 'castle', cool: 16, make() {
 const m = pickA(x => RL(x).relig === 'musulman'); if (!m) return null;
 return { realm: m, title: 'Chrétiens dans les geôles', text: `Des chevaliers et des marins chrétiens croupissent depuis des années dans les prisons ${B(deR(m))}. Leurs familles ont vendu leurs terres pour réunir des rançons qui n’arrivent jamais.`,
  opts: [{ t: 'Payer la rançon (60 marcs)', d: 'Autorité +3 · ferveur +3', req: () => S.treasury >= 60 ? null : 'Trésor insuffisant', fx() { modT(-60); modA(3); modF('all', 3); } },
   { t: 'Charger les Trinitaires de la négociation (25 marcs)', d: 'Exige l’ordre des Trinitaires · autorité +3', req: () => !S.orders.includes('trinitaires') ? 'Ordre non approuvé' : S.treasury < 25 ? 'Trésor insuffisant' : null, fx() { modT(-25); modA(3); modRel(m, 5); } },
   { t: 'Ne rien faire', d: 'Ferveur −2', fx() { modF('all', -2); } }] };
}});

E({ id: 'guerre_privee', w: 2, art: 'castle', cool: 8, make() {
 const r = pickR(); if (!r) return null;
 return { realm: r, title: pick([`Guerres privées ${enR(r)}`, `Les barons ${deR(r)} en armes`]), text: pick([`Les barons ${B(deR(r))} se livrent des guerres privées sans fin : moissons brûlées, églises pillées, marchands rançonnés. Les paysans se réfugient dans les cimetières, seuls lieux d’asile.`, `${capFirst(enR(r))}, deux seigneurs se disputent un moulin depuis une génération : la querelle a gagné tout le pays. Châteaux assiégés, villages incendiés, prêtres rançonnés. Le roi est trop faible pour imposer la paix.`, `Un vicomte ${B(deR(r))} a enlevé l’héritière de son voisin ; vingt barons ont pris parti. Les routes sont coupées, les foires désertées, et les paysans n’osent plus semer. Les évêques supplient le pape d’imposer la trêve de Dieu.`]),
  opts: [{ t: 'Proclamer la Trêve de Dieu', d: 'Ferveur +3 · autorité +2', fx() { modF(r, S.decrees.includes('treve') ? 6 : 3); modA(2); } },
   { t: 'Laisser le roi rétablir l’ordre', d: 'Relation +4 · investitures −3', fx() { modRel(r, 4); modInv(r, -3); } },
   { t: 'Excommunier les fauteurs de guerre', d: 'Autorité +1 · relation −3', fx() { modA(1); modRel(r, -3); modF(r, 1); } }] };
}});

E({ id: 'byzance_aide', w: 2, art: 'ship', cool: 16, make() {
 if (!active('byzance') || !S.wars.some(w => (w.a === 'byzance' || w.b === 'byzance') && RL(w.a === 'byzance' ? w.b : w.a).relig === 'musulman') || RL('byzance').rel < -50 || S.flags.sac) return null;
 return { realm: 'byzance', title: 'L’empereur grec implore l’Occident', text: `Les ambassadeurs ${B(duRuler('byzance'))} se jettent aux pieds du pape : les Turcs ravagent l’Asie, les églises d’Anatolie sont changées en écuries. Ils demandent des chevaliers latins et laissent entendre que l’empereur pourrait reconnaître la primauté romaine.`,
  opts: [{ t: 'Promettre une croisade', d: 'Relation +15 · union +8 · ardeur de croisade', fx() { modRel('byzance', 15); RL('byzance').union = clamp(RL('byzance').union + 8, 0, 100); S.flags.zeal = 1; } },
   { t: 'Exiger d’abord l’union des Églises', d: 'Union +12 · relation −5', fx() { RL('byzance').union = clamp(RL('byzance').union + 12, 0, 100); modRel('byzance', -5); } },
   { t: 'Refuser : les schismatiques récoltent ce qu’ils ont semé', d: 'Relation −15', fx() { modRel('byzance', -15); } }] };
}});

E({ id: 'martyr', w: 1, art: 'tomb', cool: 30, make() {
 const r = pickR(x => RL(x).rel < 10 && RL(x).ruler && !RL(x).ruler.c && (hasT(x, 'colerique') || hasT(x, 'ambitieux') || hasT(x, 'anticlerical'))); if (!r) return null;
 return { realm: r, title: `Meurtre dans la cathédrale ${de_(cityOf(r))}`, text: `Quatre chevaliers de la maison ${B(duRuler(r))}, ayant entendu leur maître s’écrier « Qui me délivrera de ce prêtre turbulent ? », ont massacré l’archevêque ${de_(cityOf(r))} au pied de l’autel, pendant les vêpres. Son sang est recueilli par les fidèles comme une relique.`,
  opts: [{ t: 'Canoniser le martyr et exiger une pénitence publique', d: 'Ferveur +12 · autorité +6 · relation −15 · le roi peut se soumettre', fx() { modF(r, 12); modA(6); modRel(r, -15); if (chance(0.45)) { modInv(r, 12); modRel(r, 12); return 'Le roi vient pieds nus au tombeau et se fait flageller par les moines. Il restitue les libertés de l’Église.'; } RL(r).offense++; return 'Le roi refuse toute pénitence. Le tombeau du martyr devient un lieu de pèlerinage.'; } },
   { t: 'Excommunier le roi', d: 'Excommunication · autorité +4', fx() { RL(r).excom = true; RL(r).excomT = 0; modRel(r, -35); modA(4); } },
   { t: 'Accepter les excuses royales', d: 'Relation +5 · autorité −5', fx() { modRel(r, 5); modA(-5); } }] };
}});

E({ id: 'canonisation', w: 2, art: 'tomb', cool: 10, make() {
 const r = pickR(); if (!r) return null; const s = pick(SAINTS);
 return { realm: r, title: `La cause ${de_(s)}`, text: pick([`Le clergé et le peuple ${B(deR(r))} réclament la canonisation ${B(de_(s))}, dont le tombeau accomplit, dit-on, des guérisons chaque semaine. Le dossier compte trois cents témoignages.`, `Une procession de mille personnes est venue ${deR(r)} jusqu’à Rome : elle réclame ${que_(B(s))} soit inscrit au catalogue des saints. Des aveugles, des paralytiques et une femme possédée témoignent avoir été guéris sur son tombeau.`, `Les évêques ${B(deR(r))} envoient au pape une lettre commune et un coffre de témoignages : la vie ${B(de_(s))} fut exemplaire, son corps est resté intact après vingt ans dans la terre. La cour royale soutient la cause.`]),
  opts: [{ t: 'Canoniser solennellement', d: 'Ferveur +6 · relation +6 · trésor +20 (frais)', fx() { modF(r, 6); modRel(r, 6); modT(20); } },
   { t: 'Exiger un procès en bonne forme', d: 'Autorité +2', fx() { modA(2); } },
   { t: 'Rejeter la cause', d: 'Ferveur −3 · relation −4', fx() { modF(r, -3); modRel(r, -4); } }] };
}});

E({ id: 'enfants', w: 1, once: 1, art: 'people', make() {
 if (S.year < 1200 || S.year > 1320 || avgFervor() < 50) return null;
 return { title: 'La croisade des enfants', text: 'Un jeune berger de Cloyes assure avoir reçu une lettre du Christ. Des milliers d’enfants et de pauvres le suivent vers la mer, persuadés qu’elle s’ouvrira devant eux jusqu’à Jérusalem. Les évêques n’osent les arrêter.',
  opts: [{ t: 'Les bénir', d: 'Ferveur +4 · puis autorité −4 quand on apprend leur sort', fx() { modF('all', 4); modA(-4); return 'À Marseille, des armateurs leur offrent le passage… et les vendent comme esclaves à Alexandrie.'; } },
   { t: 'Ordonner qu’on les renvoie chez eux', d: 'Autorité +2 · ferveur −1', fx() { modA(2); modF('all', -1); } }] };
}});

E({ id: 'mongols', art: 'horse', make(force) {
 if (!force) return null;
 return { title: 'Les cavaliers venus du bout du monde', text: 'Des cavaliers aux yeux bridés, que l’on nomme Tatars — « sortis du Tartare » —, ont anéanti les princes russes, incendié Kiev, et l’on dit qu’ils menacent la Pologne et la Hongrie. Leur khan exige la soumission de tous les rois de la Terre, pape compris.',
  opts: [{ t: 'Envoyer des frères auprès du Grand Khan (30 marcs)', d: 'Autorité +2 · alliance possible contre les Mamelouks', req: () => S.treasury >= 30 ? null : 'Trésor insuffisant', fx() { modT(-30); modA(2); S.flags.mongolAlliance = 1; return 'Jean de Plan Carpin part vers Karakorum avec des lettres du pape.'; } },
   { t: 'Prêcher la croisade contre les Tatars', d: 'Ferveur +3 · autorité +1', fx() { modF('all', 3); modA(1); } },
   { t: 'Ordonner jeûnes et prières', d: 'Ferveur +2', fx() { modF('all', 2); } }] };
}});

E({ id: 'peste', art: 'plague', make(force) {
 if (!force) return null; S.plague = 10; S.flags.plagueSeen = 1;
 catholics().forEach(r => modF(r, -10)); modHealth(-12);
 S.cardinals.filter(c => chance(0.25)).forEach(c => { log(`Le cardinal ${cname(c)} meurt de la peste.`, 'bad'); removeCardinal(c); });
 return { title: 'La Grande Mortalité', text: 'Venue de Caffa par les galères génoises, la peste a gagné Messine, Gênes, Marseille, puis tout l’Occident. On meurt en trois jours, le corps couvert de bubons noirs. Un tiers de la Chrétienté périt. Les prêtres meurent au chevet des mourants ; les paroisses restent sans pasteur. Certains accusent les juifs d’empoisonner les puits.',
  opts: [{ t: 'Rester au milieu des malades et accorder l’indulgence plénière aux mourants', d: 'Autorité +6 · ferveur +5 · santé −10', fx() { modA(6); modF('all', 5); modHealth(-10); } },
   { t: 'S’enfermer entre deux grands feux, comme le conseillent les médecins', d: 'Santé préservée · autorité −3', fx() { modA(-3); modHealth(8); } },
   { t: 'Publier une bulle défendant les juifs accusés', d: 'Autorité +4 · ferveur −2', fx() { modA(4); modF('all', -2); return 'Le pape rappelle que les juifs meurent de la peste comme les chrétiens, et menace d’excommunication les persécuteurs.'; } }] };
}});

E({ id: 'flagellants', hist: 1, art: 'people', cool: 12, once: 1, make() {
 if (S.plague <= 0) return null;
 return { title: 'Les Flagellants', text: 'Des processions de pénitents, torse nu, parcourent l’Europe en se flagellant au sang avec des fouets à pointes de fer. Ils chantent des hymnes, entrent dans les villes, absolvent eux-mêmes les péchés, et méprisent les prêtres.',
  opts: [{ t: 'Condamner le mouvement', d: 'Autorité +3 · hérésie −3 partout', fx() { modA(3); modH('all', -3); } },
   { t: 'Les tolérer', d: 'Ferveur +4 · hérésie +5 partout', fx() { modF('all', 4); modH('all', 5); } }] };
}});

E({ id: 'etats', hist: 1, art: 'scroll', cool: 40, make() {
 if (S.year < 1290 || !active('france') || RL('france').rel > -40 || !(hasT('france', 'ambitieux') || hasT('france', 'anticlerical'))) return null;
 return { realm: 'france', title: 'Le roi de France convoque ses États', text: `Dans Notre-Dame de Paris, les légistes ${B(duRuler('france'))} accusent publiquement le pape d’hérésie, de simonie et de sodomie, et réclament un concile pour le juger. Les barons, les bourgeois et une partie du clergé français applaudissent.`,
  opts: [{ t: 'Proclamer la suprématie pontificale', d: 'Autorité +6 · France −20 · danger d’attentat', fx() { modA(6); modRel('france', -20); S.flags.anagni = 1; } },
   { t: 'Négocier avec les envoyés du roi', d: 'France +12 · autorité −4', fx() { modRel('france', 12); modA(-4); } },
   { t: 'Excommunier le roi de France', d: 'Excommunication · autorité +3', fx() { RL('france').excom = true; RL('france').excomT = 0; modRel('france', -30); modA(3); S.flags.anagni = 1; } }] };
}});

E({ id: 'anagni', hist: 1, art: 'tower', cool: 20, once: 1, make() {
 if (!S.flags.anagni || S.curia !== 'rome' || !active('france') || !chance(0.3)) return null;
 const f = fam('Colonna') ? 'Colonna' : pick(S.rome.fam.map(x => x.n));
 return { title: 'L’attentat d’Anagni', text: `Au point du jour, une troupe de mercenaires menée par un légiste du roi de France et par les ${B(f)} force les portes du palais d’Anagni. Le pape les attend assis sur son trône, revêtu de ses ornements pontificaux, la tiare sur la tête. On dit qu’un des assaillants l’a giflé de son gantelet.`,
  opts: [{ t: '« Voici mon cou, voici ma tête ! »', d: 'Autorité +4 · santé −20', fx() { modA(4); modHealth(-20); const F = fam(f); if (F) F.loyal = 0; return 'Au bout de trois jours, les habitants d’Anagni se soulèvent et délivrent le pape. Il ne s’en remettra jamais tout à fait.'; } },
   { t: 'Négocier sa liberté', d: 'France +20 · autorité −8 · santé −8', fx() { modRel('france', 20); modA(-8); modHealth(-8); } }] };
}});

E({ id: 'avignon', hist: 1, art: 'tower', cool: 30, make() {
 if (S.year < 1305 || S.curia !== 'rome' || !active('france') || RL('france').rel < 30 || (S.rome.stab > 50 && S.pope.nat !== 'francais')) return null;
 return { realm: 'france', title: 'L’appel de la Provence', text: `${B(capFirst(leRuler('france')))} fait valoir que Rome, livrée aux factions, n’est plus digne du successeur de Pierre. Le Comtat Venaissin appartient au pape ; Avignon, sur le Rhône, est sûre, prospère, au carrefour des routes. Les cardinaux français pressent le pontife.`,
  opts: [{ t: 'S’établir en Avignon', d: 'Sécurité · revenus +15 % · France +20 · autorité −0,4/saison', fx() { S.curia = 'avignon'; modRel('france', 20); log('La papauté s’installe en Avignon.', 'bad'); } },
   { t: 'Rester à Rome', d: 'France −10', fx() { modRel('france', -10); } }] };
}});

E({ id: 'conciliarisme', hist: 1, art: 'book', cool: 40, make() {
 if (S.year < 1395 || !(S.schism || S.authority < 45)) return null;
 return { title: 'Le concile au-dessus du pape ?', text: 'Les docteurs de l’Université de Paris soutiennent que l’Église universelle, réunie en concile, tient son pouvoir directement du Christ, et que le pape lui-même doit lui obéir. Des cardinaux en sont convaincus.',
  opts: [{ t: 'Condamner ces thèses', d: 'Autorité +3 · loyauté des cardinaux −5', fx() { modA(3); modLoy(-5); } },
   { t: 'Accepter de convoquer un concile', d: 'Un concile s’ouvre gratuitement · autorité −3', fx() { modA(-3); if (!S.council) { S.flags.nConstance = (S.flags.nConstance || 0) + 1; S.council = { t: 3, place: 'Constance', num: S.flags.nConstance }; } } }] };
}});

E({ id: 'docteur', hist: 1, art: 'book', cool: 60, make() {
 let who, r, h;
 if (S.year >= 1375 && !S.flags.wyclif && active('angleterre')) { who = 'John Wyclif'; r = 'angleterre'; h = 'Lollards'; S.flags.wyclif = 1; }
 else if (S.year >= 1410 && !S.flags.hus && active('empire')) { who = 'Jan Hus'; r = 'empire'; h = 'Hussites'; S.flags.hus = 1; }
 else return null;
 modH(r, 18); RL(r).hname = h;
 return { realm: r, title: `Maître ${who}`, text: `Le théologien ${B(who)} enseigne que l’Écriture seule fait autorité, que les prêtres indignes n’ont aucun pouvoir, et que l’Église doit renoncer à ses biens. Il traduit la Bible en langue vulgaire. Ses disciples, les ${B(h)}, se multiplient.`,
  opts: [{ t: 'Le citer à comparaître et le condamner', d: 'Autorité +3 · hérésie −6 · risque de martyr', fx() { modA(3); modH(r, -6); if (chance(0.5)) { modH(r, 10); return 'Il est brûlé malgré son sauf-conduit. Ses partisans prennent les armes.'; } } },
   { t: 'Ouvrir un débat théologique', d: 'Hérésie −3 · autorité −2', fx() { modH(r, -3); modA(-2); } },
   { t: 'Réformer les abus qu’il dénonce', d: 'Corruption −6 · hérésie −8 · trésor −40', fx() { modC(-6); modH(r, -8); modT(-40); } }] };
}});

E({ id: 'imprimerie', art: 'book', make(force) {
 if (!force) return null;
 return { title: 'Les caractères mobiles de Mayence', text: 'À Mayence, un orfèvre nommé Gutenberg imprime des Bibles entières avec des lettres de plomb : cent exemplaires dans le temps qu’un scribe en copie un seul. Les lettres d’indulgence peuvent désormais se tirer par milliers… comme les pamphlets.',
  opts: [{ t: 'Faire imprimer des indulgences', d: 'Indulgences +60 % de revenus · hérésie accrue', fx() { modA(1); } },
   { t: 'Faire imprimer les Écritures et les décrétales', d: 'Autorité +3 · ferveur +2', fx() { modA(3); modF('all', 2); } }] };
}});

E({ id: 'seisme', w: 1, art: 'ruins', cool: 30, make() {
 return { title: pick(['La terre a tremblé', 'Le séisme']), text: pick(['Un tremblement de terre a frappé l’Italie centrale. Le campanile de Saint-Paul-hors-les-Murs s’est effondré, des églises de l’Ombrie sont en ruine. Les prédicateurs y voient la colère de Dieu.', 'En pleine messe, le sol s’est soulevé : à Rome, des colonnes antiques sont tombées, et des villages des Abruzzes ont disparu dans la montagne. Des flagellants parcourent déjà les routes.', 'Une secousse terrible a lézardé les murs du Latran et abattu une tour du Capitole. Dans les Marches, une ville entière n’est plus qu’un champ de pierres. Les fidèles demandent des processions de pénitence.']),
  opts: [{ t: 'Financer la reconstruction (50 marcs)', d: 'Ferveur +3 · peuple +6', req: () => S.treasury >= 50 ? null : 'Trésor insuffisant', fx() { modT(-50); modF('etats', 5); modPeople(6); } },
   { t: 'Appeler à la pénitence', d: 'Ferveur +2 · stabilité −4', fx() { modF('all', 2); modStab(-4); } }] };
}});

E({ id: 'pretre_jean', w: 1, once: 1, art: 'scroll', make() {
 if (S.year < 1145 || S.year > 1260) return null;
 return { title: 'Une lettre du Prêtre Jean', text: 'Une lettre extraordinaire circule dans les cours d’Europe : le Prêtre Jean, roi-prêtre chrétien des trois Indes, dont le royaume compte soixante-douze rois vassaux, des fourmis chercheuses d’or et la fontaine de Jouvence, propose son alliance contre les Sarrasins.',
  opts: [{ t: 'Envoyer un émissaire (30 marcs)', d: 'Aventure incertaine', req: () => S.treasury >= 30 ? null : 'Trésor insuffisant', fx() { modT(-30); if (chance(0.2)) { S.flags.mongolAlliance = 1; modA(3); return 'Le médecin Philippe revient des années plus tard : il a trouvé non le Prêtre Jean, mais des chrétiens nestoriens prêts à combattre les Sarrasins.'; } return 'On n’entendit plus jamais parler de l’émissaire.'; } },
   { t: 'Faire lire la lettre en consistoire', d: 'Ferveur +3', fx() { modF('all', 3); } }] };
}});

E({ id: 'templiers', hist: 1, once: 1, art: 'fire', make() {
 if (S.year < 1305 || !S.orders.includes('templiers') || S.flags.templeDissolved || !active('france') || !(hasT('france', 'ambitieux') || hasT('france', 'avide') || RL('france').rel < 0)) return null;
 return { realm: 'france', title: 'Le procès du Temple', text: `À l’aube d’un vendredi 13, tous les Templiers du royaume de France ont été arrêtés par les sergents ${B(duRuler('france'))}. Sous la torture, ils avouent avoir renié le Christ et craché sur la croix. Le roi exige que le pape dissolve l’Ordre — et lui en abandonne les biens.`,
  opts: [{ t: 'Supprimer l’Ordre du Temple', d: 'France +20 · trésor +80 · autorité −4 · la banque du Temple disparaît', fx() { S.flags.templeDissolved = 1; modRel('france', 20); modT(80); modA(-4); return 'Le grand maître Jacques de Molay est brûlé dans l’île aux Juifs. Il cite le pape et le roi au tribunal de Dieu.'; } },
   { t: 'Défendre l’Ordre', d: 'France −25 · autorité +2', fx() { modRel('france', -25); modA(2); } },
   { t: 'Ouvrir une enquête pontificale', d: 'France −5 · autorité +1', fx() { modRel('france', -5); modA(1); } }] };
}});

E({ id: 'feud', w: 2, art: 'castle', cool: 8, make() {
 if (S.curia !== 'rome') return null; const f = S.rome.fam.slice().sort((a, b) => b.power - a.power); if (f.length < 2) return null;
 const [a, b] = f;
 return { title: `Les ${a.n} contre les ${b.n}`, text: pick([`Une querelle de préséance lors des funérailles d’un cardinal a dégénéré : les ${B(a.n)} et les ${B(b.n)} se battent depuis trois jours dans les ruelles du Campo de’ Fiori. Leurs tours, plantées sur les ruines antiques, se mitraillent de carreaux d’arbalète.`, `Un mariage manqué entre les deux maisons a viré au sang : les ${B(a.n)} ont enlevé la fiancée promise aux ${B(b.n)}. Depuis, chaque nuit, les deux clans s’affrontent sur le pont Saint-Ange, et les pèlerins n’osent plus traverser le Tibre.`, `Les ${B(a.n)} ont fortifié le mausolée d’Auguste, les ${B(b.n)} le théâtre de Marcellus : entre les deux, le quartier brûle. Un chanoine de Saint-Pierre a été tué d’un carreau perdu, et le peuple accuse le pape de laisser faire.`]),
  opts: [{ t: `Soutenir les ${a.n}`, d: `${a.n} +15 · ${b.n} −15`, fx() { a.loyal = clamp(a.loyal + 15, 0, 100); b.loyal = clamp(b.loyal - 15, 0, 100); } },
   { t: `Soutenir les ${b.n}`, d: `${b.n} +15 · ${a.n} −15`, fx() { b.loyal = clamp(b.loyal + 15, 0, 100); a.loyal = clamp(a.loyal - 15, 0, 100); } },
   { t: 'Imposer la paix avec la milice', d: 'Exige 200 hommes · stabilité +8', req: () => S.army >= 200 ? null : '200 hommes requis', fx() { modStab(8); a.power -= 3; b.power -= 3; } }] };
}});

E({ id: 'jubile', art: 'procession', make(force) {
 if (!force) return null;
 return { title: `L’Année sainte ${S.year}`, text: `Depuis Noël, des foules immenses convergent vers Rome, persuadées que l’année centenaire apporte une indulgence plénière. Un vieillard de cent sept ans affirme se souvenir du précédent jubilé. Les pèlerins sont si nombreux que l’on doit instaurer un sens de circulation sur le pont Saint-Ange.`,
  opts: [{ t: 'Proclamer solennellement l’Année sainte', d: 'Pèlerinages ×3 pendant un an · ferveur +8 · autorité +8', req: () => S.curia === 'avignon' ? 'Le pape doit être à Rome… ou y envoyer un légat' : null, fx() { S.jubilee = 4; modF('all', 8); modA(8); ach('jubile'); log(`Jubilé de l’an ${S.year}.`, 'gold'); return 'Deux clercs ramassent l’argent des offrandes avec des râteaux devant l’autel de Saint-Paul.'; } },
   { t: 'Proclamer le Jubilé par un légat', d: 'Pèlerinages ×3 · ferveur +5 · autorité +4', fx() { S.jubilee = 4; modF('all', 5); modA(4); ach('jubile'); } },
   { t: 'Ne rien proclamer', d: 'Ferveur −3', fx() { modF('all', -3); } }] };
}});

E({ id: 'ingeburge', hist: 1, once: 1, art: 'wedding', make() {
 if (!S.flags.ingeburge || S.turn < 1 || !active('france')) return null; S.flags.ingeburge = 0;
 return { realm: 'france', title: 'Philippe Auguste et Ingeburge', text: `Au lendemain de ses noces avec ${B('Ingeburge de Danemark')}, ${B(leRuler('france'))} l’a répudiée sans explication, a fait casser le mariage par des évêques complaisants et a épousé Agnès de Méranie. Ingeburge, enfermée dans des couvents, en appelle au pape depuis des années.`,
  opts: [{ t: 'Jeter l’interdit sur le royaume de France', d: 'Interdit · autorité +6 · France −30 · Danemark +15', fx() { RL('france').excom = true; RL('france').interdict = true; RL('france').excomT = 0; modA(6); modRel('france', -30); modRel('danemark', 15); return 'Pendant neuf mois, les églises de France se taisent. Le roi finit par promettre de reprendre la reine.'; } },
   { t: 'Exiger qu’il reprenne sa femme légitime', d: 'France −15 · autorité +3 · Danemark +10', fx() { modRel('france', -15); modA(3); modRel('danemark', 10); RL('france').offense++; } },
   { t: 'Valider le nouveau mariage', d: 'France +20 · autorité −6 · Danemark −20', fx() { modRel('france', 20); modA(-6); modRel('danemark', -20); } }] };
}});

E({ id: 'double', hist: 1, once: 1, art: 'crown', make() {
 if (!S.flags.doubleElection || S.turn < 2 || !active('empire')) return null; S.flags.doubleElection = 0;
 return { realm: 'empire', title: 'Deux rois pour un Empire', text: `Les princes allemands ont élu deux rois : ${B(RL('empire').ruler.n)}, frère du défunt empereur, et ${B(RL('empire').claimant || 'Otton de Brunswick')}, champion des Welf. Chacun réclame la couronne impériale des mains du pape. Votre décision pèsera sur l’Italie pour un siècle.`,
  opts: [{ t: `Soutenir ${RL('empire').claimant || 'Otton de Brunswick'}`, d: 'Le Welf l’emporte : Empire +30 · Investitures +10', fx() { const R = RL('empire'); R.ruler = { n: R.claimant || 'Otton IV', a: 23, p: 6, t: ['guerrier'], d: 'Welf' }; R.claimant = null; modRel('empire', 30); modInv('empire', 10); modA(3); log('Otton de Brunswick est reconnu roi des Romains.', 'info'); return 'Le Welf jure de respecter les possessions de l’Église en Italie… Tiendra-t-il parole ?'; } },
   { t: `Soutenir ${RL('empire').ruler.n}`, d: 'Empire +15 · autorité −2', fx() { RL('empire').claimant = null; modRel('empire', 15); modA(-2); } },
   { t: 'Laisser les armes décider', d: 'Guerre civile en Allemagne : Empire affaibli', fx() { RL('empire').base -= 4; modF('empire', -6); RL('empire').claimant = null; } }] };
}});

E({ id: 'colonna', hist: 1, once: 1, art: 'castle', make() {
 if (!S.flags.colonna || S.turn < 1) return null; S.flags.colonna = 0; const f = fam('Colonna'); if (!f) return null;
 return { title: 'La révolte des Colonna', text: `Les cardinaux ${B('Giacomo et Pietro Colonna')} affichent sur les portes des églises un manifeste niant la validité de l’abdication de Célestin V — et donc votre élection. Leur famille a détourné le trésor pontifical en route vers Rome et tient Palestrina, Zagarolo et Colonna.`,
  opts: [{ t: 'Déposer les deux cardinaux et prêcher la croisade contre Palestrina', d: 'Exige 300 hommes · Colonna anéantis si succès · autorité +4', req: () => S.army >= 300 ? null : '300 hommes requis', fx() { const ok = chance(0.6); S.cardinals.filter(c => c.ln === 'Colonna').forEach(removeCardinal); if (ok) { f.power = 12; f.loyal = 10; modA(4); modStab(6); return 'Palestrina est rasée ; on y sème du sel. Les Colonna fuient en France, où le roi les accueille.'; } S.army -= 200; modA(-3); return 'Les murailles de Palestrina résistent. Les Colonna narguent le pape depuis leurs tours.'; } },
   { t: 'Négocier avec les Colonna', d: 'Colonna +25 · autorité −4', fx() { f.loyal = clamp(f.loyal + 25, 0, 100); modA(-4); } },
   { t: 'Les excommunier', d: 'Colonna −20 · autorité +2 · France −5', fx() { f.loyal = clamp(f.loyal - 20, 0, 100); modA(2); modRel('france', -5); } }] };
}});

E({ id: 'neveu', w: 1, art: 'keys', cool: 16, make() {
 if (!popeHas('nepotiste') && !chance(0.3)) return null;
 const fn = pick(CARD_NAMES.italien.f);
 return { title: 'La famille du pape', text: `${B(fn + ' ' + S.pope.fam)}, neveu du pape, sollicite pour lui-même le comté de Campagne et, pour ses frères, des châteaux du Patrimoine. La famille rappelle qu’elle a beaucoup dépensé lors du conclave.`,
  opts: [{ t: 'Combler la famille', d: 'Corruption +4 · loyauté de la famille +20 · contrôle du Latium +6', fx() { modC(4); const f = fam(S.pope.fam); if (f) f.loyal = clamp(f.loyal + 20, 0, 100); S.ctrl.latium = clamp(S.ctrl.latium + 6, 0, 100); } },
   { t: 'Un modeste bénéfice suffira', d: 'Corruption +1', fx() { modC(1); } },
   { t: 'Refuser publiquement', d: 'Autorité +3 · corruption −2', fx() { modA(3); modC(-2); } }] };
}});

E({ id: 'aristote', w: 1, art: 'book', once: 1, make() {
 if (S.year < 1200 || S.year > 1290) return null;
 return { title: 'Les livres d’Aristote', text: 'Traduits de l’arabe à Tolède, les livres d’Aristote sur la nature et l’âme, avec les commentaires d’Averroès, enflamment les écoles. Certains maîtres en tirent que le monde est éternel. Un jeune dominicain napolitain, Thomas, prétend concilier le Philosophe et la foi.',
  opts: [{ t: 'Interdire la lecture d’Aristote', d: 'Autorité +2 · hérésie −2 partout', fx() { modA(2); modH('all', -2); } },
   { t: 'Encourager la synthèse thomiste', d: 'Autorité +4 · cardinaux plus savants', fx() { modA(4); S.cardinals.forEach(c => { if (chance(0.3)) c.comp = clamp(c.comp + 1, 1, 10); }); } }] };
}});

E({ id: 'nicolaites', w: 2, art: 'monastery', cool: 10, make() {
 if (S.year > 1180 || S.decrees.includes('celibat')) return null; const r = pickR(); if (!r) return null;
 return { realm: r, title: 'Les prêtres mariés', text: `${capFirst(enR(r))}, la plupart des curés vivent avec une épouse et des enfants à qui ils lèguent leur église comme un bien de famille. Des laïcs réformateurs boycottent leurs messes et les chassent parfois à coups de pierres.`,
  opts: [{ t: 'Soutenir les réformateurs laïcs', d: 'Ferveur +5 · hérésie +3 · autorité +2', fx() { modF(r, 5); modH(r, 3); modA(2); } },
   { t: 'Ordonner aux évêques de sévir', d: 'Corruption −2 · relation −4', fx() { modC(-2); modRel(r, -4); } },
   { t: 'Tolérer la coutume', d: 'Corruption +2', fx() { modC(2); } }] };
}});

E({ id: 'treve_sultan', w: 1, art: 'scroll', cool: 30, make() {
 const o = S.own.jerusalem; if (RL(o).relig !== 'musulman' || RL(o).rel < -15) return null;
 return { realm: o, title: 'L’offre du sultan', text: `${B(capFirst(leRuler(o)))} propose une trêve de dix ans : Jérusalem resterait sous son autorité, mais les pèlerins chrétiens pourraient visiter librement le Saint-Sépulcre, et les Latins garderaient leurs églises.`,
  opts: [{ t: 'Accepter la trêve', d: `Relation +15 · ferveur −2 · autorité −2`, fx() { modRel(o, 15); modF('all', -2); modA(-2); } },
   { t: 'Refuser : Jérusalem doit être chrétienne', d: 'Autorité +2 · ardeur de croisade', fx() { modA(2); S.flags.zeal = 1; } }] };
}});

/* ===================== Événements supplémentaires ===================== */
E({ id: 'bernard', w: 3, once: 1, art: 'monastery', make() {
 if (S.year < 1115 || S.year > 1153) return null;
 return { title: 'L’abbé de Clairvaux', text: `Un moine émacié, ${B('Bernard de Clairvaux')}, remplit l’Europe de sa voix. Il fait trembler les rois, confond les théologiens, fonde des abbayes par dizaines. Il demande à être entendu du pape : « Je ne suis rien, mais le Christ parle par ma bouche. »`,
  opts: [{ t: 'Le charger de prêcher pour l’Église', d: 'Ferveur +6 · ardeur de croisade · autorité +3', fx() { modF('all', 6); S.flags.zeal = 1; modA(3); return 'À Vézelay, la foule est si nombreuse qu’on dresse une estrade dans les champs.'; } },
   { t: 'L’écouter, mais tempérer son zèle', d: 'Autorité +2 · ferveur +2', fx() { modA(2); modF('all', 2); } }] };
}});
E({ id: 'stigmates', w: 4, once: 1, art: 'miracle', make() {
 if (!S.orders.includes('franciscains') || S.year < 1224) return null;
 return { title: 'Le Poverello', text: `Sur le mont de l’Alverne, ${B('François d’Assise')} a reçu dans sa chair les plaies du Crucifié. Il est mort peu après, couché nu sur la terre, en chantant le Cantique des créatures. Ses frères demandent sa canonisation.`,
  opts: [{ t: 'Le canoniser sans attendre', d: 'Ferveur +7 · autorité +3', fx() { modF('all', 7); modA(3); return 'Deux ans à peine après sa mort, François est inscrit au catalogue des saints.'; } },
   { t: 'Exiger un procès en bonne et due forme', d: 'Autorité +2 · ferveur +3', fx() { modA(2); modF('all', 3); } }] };
}});
E({ id: 'arnaud', w: 3, once: 1, art: 'people', make() {
 if (S.year < 1140 || S.year > 1160 || S.curia !== 'rome') return null;
 return { title: 'Arnaud de Brescia', text: `Un chanoine lombard, ${B('Arnaud de Brescia')}, harangue les Romains au Capitole : le clergé doit renoncer à tout bien et à tout pouvoir, le pape n’a pas à gouverner la Ville. Le Sénat l’acclame.`,
  opts: [{ t: 'L’excommunier et le chasser de Rome', d: 'Stabilité −6 · autorité +3', fx() { modStab(-6); modA(3); } },
   { t: 'Le livrer au bras séculier de l’empereur', d: 'Empire +10 · peuple −10 · autorité +2', fx() { modRel('empire', 10); modPeople(-10); modA(2); return 'Arnaud est pendu, son corps brûlé, ses cendres jetées dans le Tibre.'; } },
   { t: 'Négocier avec la Commune', d: 'Stabilité +8 · autorité −4', fx() { modStab(8); modA(-4); } }] };
}});
E({ id: 'joachim', w: 1, cool: 40, art: 'monastery', make() {
 if (S.year < 1250 || S.year > 1350) return null;
 return { title: 'L’Évangile éternel', text: 'Des frères « spirituels » répandent les prophéties de l’abbé Joachim de Flore : l’âge du Père et celui du Fils s’achèvent, l’âge de l’Esprit commence en l’an 1260, et l’Église charnelle de Rome sera balayée.',
  opts: [{ t: 'Condamner ces prophéties', d: 'Autorité +2 · hérésie +3 en Toscane', fx() { modA(2); if (active('toscane')) modH('toscane', 3); } },
   { t: 'Laisser les théologiens réfuter', d: 'Ferveur +2 · hérésie +4 partout', fx() { modF('all', 2); modH('all', 4); } }] };
}});
E({ id: 'dolcino', w: 4, once: 1, art: 'forest', make() {
 if (S.year < 1300 || S.year > 1310 || !active('lombardie')) return null;
 return { realm: 'lombardie', title: 'Fra Dolcino dans les montagnes', text: `Les Apostoliques de ${B('Fra Dolcino')}, quelques milliers d’hommes et de femmes, se sont retranchés dans les Alpes piémontaises. Ils annoncent la fin de l’Église romaine et pillent les vallées pour survivre.`,
  opts: [{ t: 'Prêcher une croisade locale', d: 'Hérésie −15 en Lombardie · ferveur −3', fx() { modH('lombardie', -15); modF('lombardie', -3); return 'Affamés, les derniers Apostoliques sont pris sur le mont Rubello ; Dolcino est supplicié à Verceil.'; } },
   { t: 'Envoyer des frères pour les ramener', d: 'Hérésie −6 · 20 marcs', req: () => S.treasury >= 20 ? null : 'Trésor insuffisant', fx() { modT(-20); modH('lombardie', -6); } }] };
}});
E({ id: 'jeanne', w: 5, once: 1, art: 'fire', make() {
 if (S.year < 1429 || S.year > 1440 || !active('france') || !active('angleterre')) return null;
 return { realm: 'france', title: 'La Pucelle d’Orléans', text: `Une jeune paysanne lorraine, ${B('Jeanne')}, qui dit entendre les voix de saint Michel et de sainte Catherine, a délivré Orléans et fait sacrer son roi à Reims. Capturée, elle est jugée à Rouen pour hérésie par un tribunal acquis aux Anglais. Elle en appelle au pape.`,
  opts: [{ t: 'Évoquer la cause à Rome', d: 'France +15 · Angleterre −15 · ferveur +3', fx() { modRel('france', 15); modRel('angleterre', -15); modF('all', 3); return 'Le procès est suspendu ; la Pucelle est transférée sous la garde d’un légat.'; } },
   { t: 'Laisser juger l’évêque de Beauvais', d: 'Angleterre +8 · autorité −3', fx() { modRel('angleterre', 8); modA(-3); return 'Elle est brûlée vive sur la place du Vieux-Marché. Un soldat anglais murmure : « Nous avons brûlé une sainte. »'; } }] };
}});
E({ id: 'savonarole', w: 5, once: 1, art: 'fire', make() {
 if (S.year < 1490 || S.year > 1500 || !active('toscane')) return null;
 return { realm: 'toscane', title: 'Le prieur de San Marco', text: `À Florence, le dominicain ${B('Jérôme Savonarole')} tonne contre la corruption de Rome et fait brûler sur la place de la Seigneurie les miroirs, les cartes, les livres profanes et les tableaux. La ville lui obéit.`,
  opts: [{ t: 'L’excommunier', d: 'Autorité +2 · hérésie +5 en Toscane', fx() { modA(2); modH('toscane', 5); } },
   { t: 'Lui offrir le chapeau de cardinal', d: 'Corruption +2 · peut-être le faire taire', fx() { modC(2); if (chance(0.3)) { modA(2); return 'Il refuse : « Je ne veux d’autre chapeau qu’un chapeau rouge de mon sang. »'; } modA(-2); return '« Je ne veux d’autre chapeau rouge que celui du martyre. » Le refus fait le tour de l’Italie.'; } },
   { t: 'Réformer la Curie comme il l’exige', d: 'Corruption −8 · loyauté des cardinaux −6', fx() { modC(-8); modLoy(-6); } }] };
}});
E({ id: 'grand_schisme', hist: 1, once: 1, art: 'conclave', make() {
 if (S.year < 1376 || S.year > 1395 || S.schism || (!S.flags.schisme1378 && !chance(0.25)) || (S.flags.schisme1378 && S.turn < 2)) return null; S.flags.schisme1378 = 0;
 const fr = S.cardinals.filter(c => c.nat === 'francais').length; if (fr < S.cardinals.length * 0.3) return null;
 return { title: 'La révolte des cardinaux français', text: `Les cardinaux français, qui forment ${fr} des ${S.cardinals.length} voix du collège, se retirent à Fondi. Ils prétendent que l’élection du pape s’est faite sous la menace de la foule romaine et préparent l’élection d’un autre pontife, qui siégerait en Avignon avec l’appui du roi de France.`,
  opts: [{ t: 'Les acheter (200 marcs)', d: 'Corruption +8 · le schisme est évité', req: () => S.treasury >= 200 ? null : 'Trésor insuffisant', fx() { modT(-200); modC(8); modLoy(10, c => c.nat === 'francais'); return 'Bénéfices, abbayes et pensions apaisent les consciences.'; } },
   { t: 'Promettre de rétablir la Curie en Avignon', d: 'Curie en Avignon · France +20 · autorité −5', fx() { S.curia = 'avignon'; modRel('france', 20); modA(-5); } },
   { t: 'Les défier : le pape légitime, c’est moi', d: 'Grand Schisme : un antipape soutenu par la France', fx() { const fc = S.cardinals.filter(c => c.nat === 'francais'); fc.forEach(removeCardinal); createSchism(active('france') ? 'france' : null, 'conclave'); return `${fc.length} cardinaux passent à l’antipape. La Chrétienté se déchire entre deux obédiences.`; } }] };
}});
E({ id: 'disette', w: 2, cool: 12, art: 'harvest', make() {
 if (S.curia !== 'rome') return null;
 return { title: pick(['Disette à Rome', 'Le pain manque à Rome']), text: pick(['Les nefs de grain siciliennes n’arrivent plus : la guerre ferme la mer. Le pain a triplé de prix ; les femmes du Trastevere assiègent les greniers du Latran.', 'Un orage de grêle a couché les blés de la Campagne romaine. Les boulangers du Campo de’ Fiori réduisent le poids des pains ; on a pendu l’un d’eux, accusé d’y mêler de la sciure.', 'Les barons de la Campagne retiennent leur blé pour faire monter les prix. Au Capitole, les orateurs accusent la Curie de s’engraisser pendant que le peuple a faim.', 'La récolte a été maigre et le blé des Pouilles a été vendu aux Vénitiens. Aux portes du Latran, la foule des affamés réclame les distributions de pain que faisaient les anciens papes.', 'Les moulins du Tibre sont arrêtés par la sécheresse : plus d’eau, plus de farine. Le prix du pain s’envole, et des boulangeries sont pillées dans le quartier de la Regola.']),
  opts: [{ t: 'Acheter du grain à prix d’or (50 marcs)', d: 'Peuple +12', req: () => S.treasury >= 50 ? null : 'Trésor insuffisant', fx() { modT(-50); modPeople(12); } },
   { t: 'Ouvrir les greniers ecclésiastiques', d: 'Peuple +6 · corruption −1', fx() { modPeople(6); modC(-1); } },
   { t: 'Laisser faire les marchands', d: 'Peuple −12 · stabilité −5', fx() { modPeople(-12); modStab(-5); } }] };
}});
E({ id: 'incendie', w: 1, cool: 40, art: 'fire', make() {
 if (S.curia !== 'rome') return null; const done = Object.keys(S.build).filter(k => S.build[k] === true && !BUILDINGS[k].avignon);
 const k = done.length ? pick(done) : null;
 return { title: k ? `Incendie : ${BUILDINGS[k].n}` : 'Rome en flammes', text: k ? `Une nuit de vent, le feu a pris dans les charpentes. Au matin, ${B(BUILDINGS[k].n)} n’est plus qu’un squelette noirci. Les Romains y voient un mauvais présage.` : 'Un incendie parti d’une boulangerie a ravagé le quartier du Borgo jusqu’aux portes de Saint-Pierre.',
  opts: [{ t: 'Reconstruire aussitôt (70 marcs)', d: 'Le bâtiment est sauvé · peuple +4', req: () => S.treasury >= 70 ? null : 'Trésor insuffisant', fx() { modT(-70); modPeople(4); } },
   { t: 'Reconstruire plus tard', d: k ? 'Le chantier repart pour 2 saisons' : 'Stabilité −5', fx() { if (k) S.build[k] = 2; else modStab(-5); } }] };
}});
E({ id: 'brigands', w: 2, cool: 10, art: 'forest', make() {
 return { title: pick(['Brigands sur la via Francigena', 'Les routiers de la Campagne', 'Le chemin des pèlerins coupé']), text: pick(['Des routiers licenciés rançonnent les pèlerins entre Viterbe et Rome. Les offrandes s’effondrent, et l’on raconte en Flandre que le chemin de Rome mène au martyre.', 'Une compagnie de soudards sans solde tient le passage du mont Cimino. Ils dépouillent les pèlerins jusqu’à la chemise et pendent ceux qui résistent aux chênes du bord de la route. Les pèlerinages se raréfient.', 'Le seigneur d’un castrum de la Sabine a fait de sa tour un repaire : ses hommes rançonnent les marchands de Rome et les convois de la Chambre apostolique. On dit qu’il n’a pas entendu la messe depuis dix ans.', 'Des bandes de mercenaires bretons, licenciés après la dernière guerre, campent aux portes de Viterbe. Ils exigent une « rançon de paix » des villes et des abbayes, et dépouillent les pèlerins attardés.', 'Un pèlerin anglais est arrivé à Rome nu et ensanglanté : sa compagnie a été massacrée sur les bords du lac de Bolsena. Dans toutes les auberges de la via Francigena, on ne parle que de ce crime.']),
  opts: [{ t: 'Envoyer la milice nettoyer les routes', d: 'Exige 200 hommes · autorité +2', req: () => S.army >= 200 ? null : '200 hommes requis', fx() { if (chance(0.7)) { modA(2); S.ctrl.latium = clamp(S.ctrl.latium + 5, 0, 100); return 'Une vingtaine de pendus sur les chemins rassurent les pèlerins.'; } S.army -= 100; return 'Les brigands se dispersent dans la Maremme.'; } },
   { t: 'Les prendre à votre solde', d: 'Milice +100 · 30 marcs · corruption +2', req: () => S.treasury >= 30 ? null : 'Trésor insuffisant', fx() { modT(-30); S.army += 100; modC(2); } },
   { t: 'Ne rien faire', d: 'Trésor −20 · ferveur −1', fx() { modT(-20); modF('all', -1); } }] };
}});
E({ id: 'tournoi', w: 2, cool: 16, art: 'swords', make() {
 if (S.decrees.includes('tournois') || S.year < 1100) return null; const r = pickR(); if (!r) return null;
 return { realm: r, title: `Tournoi sanglant ${enR(r)}`, text: `Lors d’un grand tournoi, soixante chevaliers ont péri dans la mêlée, dont un comte et deux fils de barons. Les évêques demandent que l’on interdise ces « détestables foires où l’on joue sa vie et son âme ».`,
  opts: [{ t: 'Refuser la sépulture chrétienne aux morts', d: 'Autorité +2 · relation −6', fx() { modA(2); modRel(r, -6); } },
   { t: 'Rester silencieux', d: 'Aucun effet', fx() { } }] };
}});
E({ id: 'bardi', hist: 1, once: 1, art: 'city', make() {
 if (S.year < 1340 || S.debt < 100) return null;
 return { title: 'La faillite des Bardi', text: 'Les grandes compagnies florentines des Bardi et des Peruzzi s’effondrent : le roi d’Angleterre refuse de rembourser ses emprunts de guerre. Leurs créances sur la Chambre apostolique sont dispersées entre mille créanciers.',
  opts: [{ t: 'Profiter du chaos pour ne rembourser qu’une partie', d: 'Dette −60 % · autorité −2 · Florence −15', fx() { S.debt = Math.round(S.debt * 0.4); modA(-2); if (active('toscane')) modRel('toscane', -15); } },
   { t: 'Honorer scrupuleusement la dette', d: 'Autorité +2', fx() { modA(2); } }] };
}});
E({ id: 'ethiopiens', w: 4, once: 1, art: 'procession', make() {
 if (S.year < 1400 || S.year > 1460) return null;
 return { title: 'Les moines d’Éthiopie', text: 'Des moines venus du royaume du Prêtre Jean — l’Éthiopie chrétienne — arrivent à Rome par Jérusalem. Ils portent des croix de fer ouvragé et des livres en langue ge’ez. Leur négus propose l’union avec l’Église romaine.',
  opts: [{ t: 'Les recevoir en consistoire solennel', d: 'Autorité +4 · ferveur +2', fx() { modA(4); modF('all', 2); return 'On leur offre l’église de Santo Stefano, derrière Saint-Pierre.'; } },
   { t: 'Les confier aux théologiens', d: 'Autorité +1', fx() { modA(1); } }] };
}});
E({ id: 'mondes', hist: 1, once: 1, art: 'ship', make() {
 if (S.year < 1492 || !active('castille') || !active('portugal')) return null;
 return { title: 'Des terres au-delà de l’Océan', text: `Un Génois au service ${deR('castille')} affirme avoir atteint les Indes par l’ouest. Le roi de Portugal réclame ces terres en vertu de bulles anciennes. Les deux couronnes demandent au pape de partager le monde.`,
  opts: [{ t: 'Tracer une ligne d’un pôle à l’autre', d: 'Castille +12 · Portugal +8 · autorité +4', fx() { modRel('castille', 12); modRel('portugal', 8); modA(4); return 'La bulle Inter caetera partage l’Océan à cent lieues des Açores.'; } },
   { t: 'Favoriser la Castille', d: 'Castille +20 · Portugal −15', fx() { modRel('castille', 20); modRel('portugal', -15); } }] };
}});
E({ id: 'humanistes', w: 2, cool: 20, art: 'book', make() {
 if (S.year < 1400) return null;
 return { title: 'Les humanistes à la Curie', text: pick(['Des lettrés florentins, qui écrivent un latin cicéronien et collectionnent les manuscrits grecs, proposent leurs services comme secrétaires apostoliques. Des peintres offrent de couvrir de fresques les palais du pape.', 'Un érudit venu de Constantinople propose d’enseigner le grec à la Curie et de traduire Platon pour la bibliothèque pontificale. Des orfèvres et des sculpteurs florentins font antichambre au Vatican.', 'Des secrétaires lettrés, nourris de Cicéron et de Tite-Live, offrent de réformer le style des bulles pontificales. Ils réclament aussi des pensions, des bénéfices… et le droit de fouiller les ruines pour y chercher des statues.']),
  opts: [{ t: 'Engager peintres et lettrés (60 marcs)', d: 'Autorité +4 · chantier de la chapelle accéléré', req: () => S.treasury >= 60 ? null : 'Trésor insuffisant', fx() { modT(-60); modA(4); if (typeof S.build.chapelle === 'number') S.build.chapelle = Math.max(1, S.build.chapelle - 2); } },
   { t: 'Se méfier de ces païens', d: 'Aucun effet', fx() { } }] };
}});
E({ id: 'cardinal_scandale', w: 2, cool: 10, art: 'tower', make() {
 const c = S.cardinals.find(c => !POPE_TRAITS[c.trait].v && chance(0.5)); if (!c) return null;
 return { title: 'Scandale au Sacré Collège', portrait: c.id, text: `On a surpris le cardinal ${B(cname(c))} quittant au petit matin la maison d’une courtisane du Campo Marzio, une cassette de ducats sous le bras. Les pamphlets circulent jusqu’à Paris.`,
  opts: [{ t: 'Le déposer', d: 'Il perd la pourpre · corruption −3 · autorité +2', fx() { removeCardinal(c); modC(-3); modA(2); } },
   { t: 'L’envoyer en pénitence dans un monastère', d: 'Loyauté −20 · corruption −1', fx() { c.loyal = clamp(c.loyal - 20, 0, 100); modC(-1); } },
   { t: 'Étouffer l’affaire', d: 'Corruption +3 · sa loyauté +10', fx() { modC(3); c.loyal = clamp(c.loyal + 10, 0, 100); } }] };
}});
E({ id: 'cardinal_saint', w: 1, cool: 20, art: 'tomb', make() {
 const c = S.cardinals.find(c => c.piety >= 8 && c.age > 60); if (!c) return null;
 return { title: 'Mort en odeur de sainteté', portrait: c.id, text: `Le cardinal ${B(cname(c))} s’est éteint en priant, après avoir distribué tous ses biens aux pauvres. On dit que son corps exhale un parfum de roses et que des malades guérissent en touchant son linceul.`,
  opts: [{ t: 'Ouvrir son procès de canonisation', d: 'Ferveur +4 · autorité +2', fx() { removeCardinal(c); modF('all', 4); modA(2); } },
   { t: 'Lui offrir des funérailles solennelles', d: 'Peuple +6 · ferveur +1', fx() { removeCardinal(c); modPeople(6); modF('all', 1); } }] };
}});
E({ id: 'mariage_niece', w: 2, cool: 16, art: 'wedding', make() {
 if (S.curia !== 'rome') return null; const f = pick(S.rome.fam.filter(x => x.n !== S.pope.fam)); if (!f) return null;
 return { title: `Les ${f.n} demandent une alliance`, text: pick([`Le chef de la maison ${B(f.n)} demande la main d’une nièce du pape pour son fils aîné. La dot serait payée en châteaux du Latium ; l’alliance apaiserait la Ville… et enrichirait la famille du pontife.`, `Les ${B(f.n)} envoient au Latran un cortège de cinquante cavaliers : ils demandent pour leur héritier la main d’une nièce du pape. En dot, ils offrent la paix dans leurs quartiers… et trois forteresses de la Campagne.`, `Une marieuse de la maison ${B(f.n)} s’est présentée chez la sœur du pape : un fils de la famille épouserait volontiers une nièce du pontife. Les cardinaux rivaux grincent déjà des dents à l’idée de ce népotisme.`]),
  opts: [{ t: 'Accepter le mariage', d: `${f.n} +25 · corruption +2 · contrôle du Latium +5`, fx() { f.loyal = clamp(f.loyal + 25, 0, 100); modC(2); S.ctrl.latium = clamp(S.ctrl.latium + 5, 0, 100); } },
   { t: 'Refuser poliment', d: `${f.n} −10`, fx() { f.loyal = clamp(f.loyal - 10, 0, 100); } }] };
}});
E({ id: 'testaccio', w: 2, cool: 8, art: 'people', make() {
 if (S.curia !== 'rome' || S.season !== 0) return null;
 return { title: pick(['Les jeux du Testaccio', 'Le carnaval romain']), text: pick(['Pour le carnaval, les Romains réclament les jeux traditionnels du mont Testaccio : courses, combats de taureaux, chariots chargés de porcs lâchés sur la pente. Le Sénat demande au pape de les financer.', 'Le carnaval approche : les rioni de Rome préparent les joutes de la place Navone et les courses de chevaux barbes sur le Corso. Les conservateurs du Capitole demandent au pape de payer les prix et les décors.', 'Les jeunes gens des treize quartiers de Rome réclament leurs fêtes de carnaval : tauromachies sur le mont Testaccio, chars allégoriques, banquets publics. Sans subside pontifical, la fête n’aura pas lieu.']),
  opts: [{ t: 'Financer les jeux (30 marcs)', d: 'Peuple +10 · stabilité +3', req: () => S.treasury >= 30 ? null : 'Trésor insuffisant', fx() { modT(-30); modPeople(10); modStab(3); } },
   { t: 'Les interdire comme païens', d: 'Peuple −8 · autorité +1', fx() { modPeople(-8); modA(1); } }] };
}});
E({ id: 'pelerin_roi', w: 1, cool: 24, art: 'procession', make() {
 const r = pickR(x => RL(x).rel > 30 && RL(x).ruler && !RL(x).ruler.c); if (!r || S.curia !== 'rome') return null;
 return { realm: r, title: `${rulerLbl(r)} en pèlerinage à Rome`, text: `${capFirst(leRuler(r))} vient à Rome en pèlerin, avec une suite de trois cents cavaliers. Il veut prier au tombeau des Apôtres et recevoir la bénédiction du pape.`,
  opts: [{ t: 'Le recevoir avec tous les honneurs', d: 'Relation +12 · trésor −20 · peuple +4', fx() { modRel(r, 12); modT(-20); modPeople(4); } },
   { t: 'Lui demander une offrande pour Saint-Pierre', d: 'Trésor +40 · relation +4', fx() { modT(40); modRel(r, 4); } }] };
}});
E({ id: 'peste_retour', w: 1, cool: 40, art: 'plague', make() {
 if (!S.flags.plagueDone || S.plague > 0) return null; S.plague = 4; catholics().forEach(r => modF(r, -4)); modHealth(-5);
 return { title: 'La peste revient', text: 'La mortalité reparaît, frappant cette fois surtout les enfants nés depuis la grande peste. Les villes ferment leurs portes, les processions se multiplient.',
  opts: [{ t: 'Ordonner prières et processions', d: 'Ferveur +3', fx() { modF('all', 3); } },
   { t: 'Recommander la quarantaine des navires', d: 'Autorité +2 · ferveur −1', fx() { modA(2); modF('all', -1); } }] };
}});
E({ id: 'bulle_espagne', w: 2, cool: 20, art: 'swords', make() {
 if (!active('castille') || !IBERIA.some(p => RL(S.own[p]).relig === 'musulman')) return null;
 return { realm: 'castille', title: 'La bulle de croisade d’Espagne', text: `${capFirst(leRuler('castille'))} demande que ceux qui combattent les Maures en Espagne reçoivent les mêmes indulgences que les croisés de Jérusalem, et que l’Église lui cède la tierce des dîmes.`,
  opts: [{ t: 'Accorder la bulle et les tierces', d: 'Castille +15 · trésor −25 · la Castille guerroie', fx() { modRel('castille', 15); modT(-25); RL('castille').base += 2; } },
   { t: 'Accorder la bulle seule', d: 'Castille +8', fx() { modRel('castille', 8); } },
   { t: 'Refuser', d: 'Castille −10', fx() { modRel('castille', -10); } }] };
}});
E({ id: 'couronnement', w: 3, cool: 12, art: 'crown', make() {
 const R = RL('empire'); if (!active('empire') || !R.ruler || R.ruler.c || R.crowned === R.ruler.n || R.rel < -5 || R.excom || S.curia !== 'rome') return null;
 return { realm: 'empire', title: 'Le couronnement impérial', text: `${capFirst(leRuler('empire'))} franchit les Alpes avec son armée : il veut recevoir à Saint-Pierre la couronne impériale des mains du pape. Ses chevaliers campent déjà sur le Monte Mario.`,
  opts: [{ t: 'Le couronner solennellement', d: 'Empire +22 · autorité +3', fx() { R.crowned = R.ruler.n; modRel('empire', 22); modA(3); return 'L’empereur tient l’étrier du pape et lui baise les pieds avant d’être oint.'; } },
   { t: 'Exiger d’abord la liberté des élections épiscopales', d: 'Investitures +15 · Empire +8 · risque de colère', fx() { R.crowned = R.ruler.n; modInv('empire', 15); if (chance(0.6)) { modRel('empire', 8); modA(4); return 'Il cède, la rage au cœur, et signe le privilège.'; } modRel('empire', -20); modStab(-8); return 'Il refuse, et ses soldats se battent avec les Romains dans le Borgo.'; } },
   { t: 'Refuser la couronne', d: 'Empire −25 · autorité +2', fx() { R.crowned = R.ruler.n; modRel('empire', -25); modA(2); R.offense++; } }] };
}});
E({ id: 'cens_impaye', w: 2, cool: 12, art: 'coins', make() {
 const r = pickR(x => RL(x).vassal && RL(x).rel < 20); if (!r) return null;
 return { realm: r, title: `${rulerLbl(r)} refuse le cens`, text: pick([`${capFirst(leRuler(r))} déclare que son royaume ne doit rien à Rome et cesse de payer le cens annuel. Ses conseillers parlent de « l’humiliation » de ses prédécesseurs.`, `Le légat chargé de percevoir le cens est revenu les mains vides : ${B(leRuler(r))} l’a fait attendre trois mois dans une auberge, puis lui a fait dire que « son trésor ne paie pas de tribut ».`, `${capFirst(leRuler(r))} a réuni ses barons et leur a lu une charte affirmant que son royaume ne relève que de Dieu. Le cens dû au Saint-Siège depuis son aïeul ne sera plus payé.`]),
  opts: [{ t: 'Rappeler le serment de vassalité', d: 'Relation −8 · autorité +2', fx() { modRel(r, -8); modA(2); RL(r).offense++; } },
   { t: 'Délier le royaume de sa vassalité', d: 'Plus de cens · relation +10 · autorité −3', fx() { RL(r).vassal = false; modRel(r, 10); modA(-3); } }] };
}});
E({ id: 'eveque_rebelle', w: 2, cool: 10, art: 'bishop', make() {
 const r = pickR(x => RL(x).invest < 50); if (!r) return null; const who = pick(['l’archevêque de Cologne', 'l’archevêque de Cantorbéry', 'l’archevêque de Tolède', 'l’archevêque de Reims', 'l’archevêque de Mayence', 'l’archevêque de Gniezno', 'l’archevêque d’Esztergom', 'l’archevêque d’Uppsala']);
 return { realm: r, title: 'Un primat insoumis', text: pick([`${capFirst(who)} refuse de recevoir le légat pontifical et interdit à ses suffragants d’en appeler à Rome. « Mon église a ses coutumes, que le pape respecte », écrit-il.`, `${capFirst(who)} a fait jeter à la porte de sa cathédrale les lettres pontificales sans les ouvrir. Il nomme lui-même aux abbayes de sa province et a fait arrêter un chanoine qui voulait en appeler à Rome.`, `On rapporte que ${who} a déclaré devant son synode que « l’évêque de Rome est un évêque comme les autres ». Il a cessé de verser le denier de saint Pierre et protège un clerc excommunié par le pape.`]),
  opts: [{ t: 'Le suspendre de ses fonctions', d: 'Investitures +6 · relation −6 · autorité +2', fx() { modInv(r, 6); modRel(r, -6); modA(2); } },
   { t: 'Lui confirmer ses privilèges', d: 'Investitures −4 · autorité −2 · relation +4', fx() { modInv(r, -4); modA(-2); modRel(r, 4); } }] };
}});
E({ id: 'hiver', w: 2, cool: 12, art: 'snow', make() {
 if (S.season !== 3) return null;
 return { title: pick(['Le grand hiver', 'L’hiver terrible']), text: pick(['Le Tibre a gelé, comme le Rhin et la lagune de Venise. Les loups entrent dans les villages, le vin gèle dans les tonneaux. Les pauvres meurent de froid aux portes des églises.', 'La neige couvre Rome jusqu’aux genoux, chose que nul vivant n’avait vue. Les oliviers de la Sabine éclatent sous le gel, les moulins sont pris dans la glace et le pain vient à manquer.', 'Un froid cruel s’est abattu sur la Chrétienté : la mer a gelé entre le Danemark et la Suède, les vignes de Bourgogne sont mortes. Dans les villes, les confréries ramassent chaque matin les corps des mendiants.']),
  opts: [{ t: 'Faire distribuer bois et couvertures (35 marcs)', d: 'Peuple +8 · ferveur +2', req: () => S.treasury >= 35 ? null : 'Trésor insuffisant', fx() { modT(-35); modPeople(8); modF('all', 2); } },
   { t: 'Ordonner aux monastères d’ouvrir leurs portes', d: 'Ferveur +2 · corruption −1', fx() { modF('all', 2); modC(-1); } },
   { t: 'Prier pour le dégel', d: 'Peuple −6', fx() { modPeople(-6); } }] };
}});
E({ id: 'legat_insulte', w: 2, cool: 10, art: 'bishop', make() {
 const r = pickR(x => RL(x).legate && RL(x).rel < 0); if (!r) return null; const c = card(RL(r).legate); if (!c) return null;
 return { realm: r, title: 'Le légat outragé', portrait: c.id, text: `À la cour ${deR(r)}, le cardinal-légat ${B(cname(c))} a été chassé du palais sous les quolibets ; des pages ont coupé la queue de sa mule. Il demande réparation.`,
  opts: [{ t: 'Exiger des excuses publiques', d: 'Relation −8 · autorité +3', fx() { modRel(r, -8); modA(3); RL(r).offense++; } },
   { t: 'Rappeler le légat', d: 'Légation close · autorité −2', fx() { c.legate = null; RL(r).legate = null; modA(-2); } },
   { t: 'Passer l’affront sous silence', d: 'Autorité −3 · relation +3', fx() { modA(-3); modRel(r, 3); } }] };
}});
E({ id: 'pogrom_puits', hist: 1, once: 1, art: 'fire', make() {
 if (S.plague <= 0 || !active('empire')) return null;
 return { realm: 'empire', title: 'Les puits empoisonnés', text: 'À Strasbourg, Bâle, Mayence, des foules accusent les juifs d’avoir empoisonné les puits et provoqué la peste. Des centaines sont brûlés vifs. Le conseil de Strasbourg a vainement tenté de s’y opposer.',
  opts: [{ t: 'Condamner solennellement ces massacres', d: 'Autorité +4 · Empire −4', fx() { modA(4); modRel('empire', -4); return 'La bulle rappelle que les juifs meurent de la peste comme les autres, là même où il n’y a pas de juifs.'; } },
   { t: 'Ne rien dire', d: 'Autorité −6', fx() { modA(-6); } }] };
}});
E({ id: 'inquisiteur_abus', w: 3, cool: 12, art: 'fire', make() {
 const r = pickR(x => RL(x).fear > 0); if (!r) return null; const who = pick(['frère Robert le Bougre', 'frère Bernard Gui', 'maître Conrad de Marbourg', 'frère Nicolas Eymerich', 'frère Pierre de Vérone']);
 return { realm: r, title: 'Les excès de l’inquisiteur', text: `${capFirst(enR(r))}, ${B(who)} fait brûler des dizaines de suspects sur de simples dénonciations ; des innocents avouent sous la torture, des héritages sont confisqués. Les évêques eux-mêmes protestent.`,
  opts: [{ t: 'Rappeler l’inquisiteur', d: 'Ferveur +4 · hérésie +4 · relation +4', fx() { RL(r).fear = 0; modF(r, 4); modH(r, 4); modRel(r, 4); } },
   { t: 'Le soutenir : la foi d’abord', d: 'Hérésie −5 · ferveur −4 · autorité −2', fx() { modH(r, -5); modF(r, -4); modA(-2); } },
   { t: 'Ordonner une enquête sur ses méthodes', d: 'Autorité +2', fx() { modA(2); RL(r).fear = Math.min(RL(r).fear, 2); } }] };
}});
E({ id: 'antipape_excom', hist: 1, cool: 14, art: 'scroll', make() {
 if (!S.schism || S.schism.t < 2) return null; const s = S.schism;
 return { title: `L’antipape ${s.anti} vous excommunie`, text: `Depuis sa cour, l’antipape ${B(s.anti)} a fait afficher aux portes des églises une bulle qui vous déclare usurpateur, hérétique et schismatique. Ses légats sillonnent les royaumes de son obédience.`,
  opts: [{ t: 'Répondre par une bulle d’anathème', d: 'Autorité +2' + (s.backer ? ' · protecteur −10' : ''), fx() { modA(2); if (s.backer) modRel(s.backer, -10); } },
   { t: 'Proposer une rencontre à mi-chemin (40 marcs)', d: 'Une chance sur quatre de mettre fin au schisme', req: () => S.treasury >= 40 ? null : 'Trésor insuffisant', fx() { modT(-40); if (chance(0.25)) { endSchism('abdication'); return 'À Savone, l’antipape accepte de se démettre contre une pension et le chapeau de cardinal-évêque.'; } return 'L’antipape ne vient pas au rendez-vous.'; } },
   { t: 'Mépriser ces gesticulations', d: 'Autorité −2', fx() { modA(-2); } }] };
}});
E({ id: 'pise', hist: 1, once: 1, art: 'mitres', make() {
 if (!S.schism || S.year < 1400 || S.schism.t < 8) return null;
 return { title: 'Le concile des deux obédiences', text: 'Lassés du schisme, des cardinaux des deux camps se réunissent en concile. Ils somment les deux papes rivaux d’abdiquer, faute de quoi ils les déposeront ensemble et éliront un troisième pontife.',
  opts: [{ t: 'Abdiquer pour l’unité de l’Église', d: 'Fin du schisme · votre pontificat s’achève · conclave', fx() { endSchism('concile'); S.popes.push(popeRecord('abdication')); S.pendingConclave = { reason: 'abdication' }; log(`${popeName()} abdique pour mettre fin au schisme.`, 'gold'); return 'Le geste est salué dans toute la Chrétienté.'; } },
   { t: 'Prendre la tête du concile', d: 'Un concile s’ouvre · autorité −3', fx() { modA(-3); if (!S.council) { S.flags.nPise = (S.flags.nPise || 0) + 1; S.council = { t: 2, place: 'Pise', num: S.flags.nPise }; } } },
   { t: 'Refuser : un pape ne se juge pas', d: 'Autorité −6 · loyauté des cardinaux −10', fx() { modA(-6); modLoy(-10); } }] };
}});

/* ---------- v17 : nouveaux événements courants (décision de Victor du 16/11 : moins de redite) ---------- */
E({ id: 'appel_rome', w: 2, cool: 10, art: 'scroll', make() {
 const r = pickR(); if (!r) return null; const c = cityOf(r);
 const abb = pick(['Saint-Martin', 'Sainte-Marie', 'Saint-Pierre', 'Saint-Michel', 'Saint-Étienne', 'Saint-Nicolas', 'Saint-Jean', 'Sainte-Croix']);
 const rome = S.curia === 'rome', avi = S.curia === 'avignon';
 return { realm: r, title: pick([rome ? `Un procès en cour de Rome` : `Un procès en Curie`, `L’appel de l’abbé de ${abb}`, `Plaideurs ${deR(r)} ${rome ? 'au Latran' : avi ? 'à Avignon' : 'auprès de la Curie'}`]), text: pick([`L’abbé de ${B(abb)} et l’évêque ${B(de_(c))} se disputent depuis vingt ans les dîmes de quatre paroisses. Les deux parties ont envoyé ${rome ? 'à Rome' : avi ? 'en Avignon' : 'auprès de la Curie'} leurs procureurs, chargés de chartes scellées — dont une, au moins, est sans doute fausse. L’auditeur de la Curie attend la sentence du pape.`, `Les moines de ${B(abb)} se disent exempts de la juridiction de l’évêque ${B(de_(c))} par un privilège « du temps du pape Grégoire ». L’évêque prétend que le parchemin sent encore l’encre fraîche. L’affaire est montée jusqu’au Saint-Siège et encombre la Chancellerie.`, `Un chanoine ${B(de_(c))} a fait appel au Saint-Siège contre son évêque, qui l’a dépouillé de sa prébende. Les avocats des deux camps logent ${rome ? 'au Trastevere' : avi ? 'en Avignon' : 'près de la Curie'} aux frais de leurs églises et multiplient les mémoires ; la cause pourrait durer des années.`]),
  opts: [{ t: 'Juger vite, sur le fond', d: 'Autorité +3 · corruption −1 · relation −3', fx() { modA(3); modC(-1); modRel(r, -3); return 'La sentence est rendue en une audience. Le perdant parle de « justice expéditive », mais on admire la fermeté de Rome.'; } },
   { t: 'Laisser la procédure suivre son cours', d: 'Trésor +25 · corruption +2', fx() { modT(25); modC(2); return 'Les taxes de chancellerie, les épices des auditeurs et les cadeaux aux portiers remplissent les coffres. Le procès n’est pas près de finir.'; } },
   { t: 'Renvoyer l’affaire à des juges délégués sur place', d: 'Relation +3 · investitures +2 · autorité −1', fx() { modRel(r, 3); modInv(r, 2); modA(-1); return 'Trois abbés du pays jugeront au nom du pape. L’usage s’en répand.'; } }] };
}});

E({ id: 'commerce_infideles', w: 2, cool: 12, art: 'ship', make() {
 const c4 = ['venise', 'genes', 'aragon', 'sicile'].filter(x => active(x) && isCath(x)); if (!c4.length) return null; const r = pick(c4);
 const ville = { venise: 'Venise', genes: 'Gênes', aragon: 'Barcelone', sicile: 'Messine' }[r], dv = de_(ville), y = S.year;
 const port = pick(['Alexandrie', 'Damiette', 'Tunis'].concat(y < 1104 || (y >= 1187 && y < 1191) || y > 1291 ? ['Acre', 'Beyrouth'] : []));
 const maitres = y >= 1250 && y < 1517 ? 'Mamelouks' : 'Sarrasins';
 return { realm: r, title: pick(['Du fer pour les Sarrasins', `Les galères ${dv}`, `Contrebande vers ${port}`]), text: pick([`Des marchands ${B(dv)} ont livré à ${B(port)} du bois de construction, du fer et de la poix — tout ce qu’il faut pour armer une flotte contre les chrétiens. Le droit canon frappe d’excommunication ce commerce ; les armateurs répondent que, sans lui, leur ville mourrait de faim.`, `Un pèlerin revenu d’Outremer jure avoir vu, dans le port ${B(de_(port))}, des galères ${B(dv)} décharger des esclaves chrétiens vendus aux ${port === 'Tunis' ? 'Sarrasins' : maitres}. Le scandale est immense ; la cité dément tout et rappelle ses services rendus aux croisés.`, `Les consuls ${B(dv)} demandent une licence pour commercer librement à ${B(port)} : épices, coton et alun contre draps et métaux. Ils offrent une part des bénéfices à la Chambre apostolique.`]),
  opts: [{ t: 'Excommunier les marchands', d: 'Autorité +3 · relation −10', fx() { modA(3); modRel(r, -10); RL(r).offense++; return 'Les noms des armateurs sont lus en chaire, cierges renversés. Le port gronde.'; } },
   { t: 'Vendre une licence de commerce', d: 'Trésor +45 · corruption +3 · autorité −1', fx() { modT(45); modC(3); modA(-1); return 'La licence est scellée. On murmure que Rome vend aux infidèles le droit de s’armer.'; } },
   { t: 'Avertir sans sévir', d: 'Relation +2', fx() { modRel(r, 2); return 'La lettre du pape est lue au conseil, poliment, puis rangée.'; } }] };
}});

E({ id: 'double_election', w: 2, cool: 10, art: 'mitres', make() {
 const r = pickR(x => RL(x).ruler && !RL(x).ruler.c); if (!r) return null; const c = cityOf(r); if (c === '—') return null;
 return { realm: r, title: pick([`Deux évêques pour ${c}`, `Élection disputée à ${c}`, `Le chapitre ${de_(c)} divisé`]), text: pick([`Le chapitre ${B(de_(c))} s’est déchiré : la « plus saine partie » des chanoines a élu son doyen, la plus nombreuse un neveu ${B(duRuler(r))}. Chacun se dit évêque, chacun a sa crosse, et les deux camps en sont venus aux mains dans le chœur. Les deux élus sont en route pour Rome.`, `À ${B(c)}, l’élection a duré trois jours portes closes. Au matin, deux procès-verbaux contradictoires sont sortis du chapitre. ${capFirst(leRuler(r))} soutient l’un, le métropolitain l’autre. Il appartient au pape de trancher.`, `Le siège ${B(de_(c))} reste vacant depuis un an : deux candidats se le disputent, l’un savant mais pauvre, l’autre de haute naissance et appuyé par ${B(leRuler(r))}. Les revenus de l’évêché sont mis sous séquestre.`]),
  opts: [{ t: 'Confirmer le plus digne', d: 'Autorité +2 · investitures +5 · corruption −1 · relation −6', fx() { modA(2); modInv(r, 5); modC(-1); modRel(r, -6); return 'Le pape consacre lui-même l’élu du chapitre. Le candidat du prince repart furieux.'; } },
   { t: 'Casser les deux élections et pourvoir le siège', d: 'Investitures +5 · relation −10 · trésor +15', fx() { modInv(r, 5); modRel(r, -10); modT(15); RL(r).offense++; return `Par provision apostolique, le pape nomme un troisième homme — qui verse ${S.year >= 1300 ? 'les annates' : 'une lourde taxe'} à la Chambre.`; } },
   { t: 'Céder au candidat du prince', d: 'Relation +8 · investitures −6', fx() { modRel(r, 8); modInv(r, -6); return 'Le neveu du prince reçoit le pallium. Le doyen se retire dans une abbaye.'; } }] };
}});

E({ id: 'ordre_militaire', w: 2, cool: 12, art: 'horse', make() {
 if (S.year < 1120) return null; const r = pickR(); if (!r) return null;
 const ord = S.year < 1190 ? pick(['Hospitaliers de Saint-Jean', 'chevaliers du Temple']) : S.year >= 1312 ? pick(['Hospitaliers de Saint-Jean', 'chevaliers Teutoniques', 'chevaliers de Calatrava']) : pick(['Hospitaliers de Saint-Jean', 'chevaliers du Temple', 'chevaliers Teutoniques']);
 return { realm: r, title: pick([`Les ${ord} et l’évêque`, `Plainte contre les ${ord}`, `Les privilèges des ${ord}`]), text: pick([`Les évêques ${B(deR(r))} se plaignent des ${B(ord)} : exempts de dîme, ils ouvrent leurs chapelles aux excommuniés et font sonner leurs cloches dans les villes frappées d’interdit, pour une obole. Le Maître de l’ordre rappelle qu’ils versent leur sang pour la Croix.`, `Une commanderie des ${B(ord)} ${enR(r)} a reçu tant de terres en aumône que le diocèse n’y lève plus rien. L’évêque réclame sa part ; les frères chevaliers montrent leurs bulles d’exemption et leurs cicatrices.`, `Le Maître des ${B(ord)} demande au pape de confirmer de nouveaux privilèges : quête dans toutes les églises ${deR(r)}, sépulture libre dans leurs cimetières, exemption des taxes du légat. En échange, l’ordre offre des chevaliers pour la prochaine croisade.`]),
  opts: [{ t: 'Confirmer les privilèges de l’ordre', d: 'Armée +60 · investitures −3 · corruption +1', fx() { S.army = Math.min(2000, S.army + 60); modInv(r, -3); modC(1); return 'Les bulles sont renouvelées. Soixante sergents de l’ordre prennent garnison au service du pape.'; } },
   { t: 'Soutenir les évêques', d: 'Investitures +3 · ferveur +2', fx() { modInv(r, 3); modF(r, 2); return 'Les frères devront payer la dîme de leurs nouvelles terres. Ils obéissent en maugréant.'; } },
   { t: 'Envoyer un visiteur apostolique', d: 'Corruption −3 · trésor −15', req: () => S.treasury >= 15 ? null : 'Trésor insuffisant', fx() { modC(-3); modT(-15); return 'Le visiteur inspecte les commanderies, chasse deux précepteurs indignes et rétablit la règle.'; } }] };
}});

E({ id: 'mendiants', w: 2, cool: 12, art: 'church', make() {
 if (S.year < 1225) return null; const r = pickR(); if (!r) return null; const c = cityOf(r);
 return { realm: r, title: pick(['Les curés contre les frères', `Querelle des mendiants à ${c}`, 'Qui confessera les fidèles ?']), text: pick([`Les curés ${B(de_(c))} sont en colère : les frères mendiants confessent leurs paroissiens, enterrent les riches dans leurs couvents et emportent les legs. « Ils moissonnent où ils n’ont pas semé », écrit l’évêque. Les frères répondent qu’ils prêchent là où le clergé se tait.`, `Aux écoles ${B(de_(c))}, les maîtres séculiers ont fermé leurs chaires aux frères prêcheurs et mineurs. Un libelle les traite de « faux prophètes des derniers jours ». Les frères en appellent au pape, leur protecteur.`, `Le jour de Pâques, à ${B(c)}, le curé a refusé la communion à ceux qui s’étaient confessés aux frères. L’affaire a tourné à la rixe sur le parvis. Les deux partis supplient Rome de fixer les règles.`]),
  opts: [{ t: 'Protéger les frères', d: 'Ferveur +5 · investitures −2', fx() { modF(r, 5); modInv(r, -2); return 'Une bulle confirme le droit des frères de prêcher et de confesser partout.'; } },
   { t: 'Donner raison au clergé séculier', d: 'Investitures +3 · ferveur −2 · autorité +1', fx() { modInv(r, 3); modF(r, -2); modA(1); return 'Les frères ne confesseront plus sans la licence de l’évêque.'; } },
   { t: 'Partager : un quart des legs aux paroisses', d: 'Autorité +2 · ferveur −2', fx() { modA(2); modF(r, -2); return 'La « portion canonique » apaise les curés ; les frères gardent leurs chaires.'; } }] };
}});

E({ id: 'confrerie', w: 2, cool: 10, art: 'procession', make() {
 if (S.year < 1260 || S.curia !== 'rome') return null;
 const nom = pick(['du Gonfalon', 'du Saint-Sauveur', 'de Sainte-Lucie'].concat(S.year >= 1460 ? ['de l’Annonciade'] : []));
 const sujet = pick((S.year >= 1460 ? ['jouer la Passion au Colisée le Vendredi saint'] : []).concat(['porter l’image du Sauveur du Latran à Sainte-Marie-Majeure la nuit de l’Assomption', 'fonder un hospice pour les pèlerins pauvres près de Saint-Pierre', 'racheter les captifs romains détenus par les pirates']));
 return { title: pick(['Une confrérie romaine', `Les confrères ${nom}`, 'Les pénitents de Rome']), text: pick([`Les confrères ${B(nom)}, artisans et marchands vêtus de sacs blancs, demandent la permission de ${sujet}. Ils promettent des aumônes et des prières pour le pape — et réclament une contribution de la Chambre.`, `Une foule de pénitents encapuchonnés s’est présentée aux portes du Latran : ils veulent ${sujet}. Les barons romains s’inquiètent de voir le petit peuple s’organiser en compagnies armées de cierges.`, `Les recteurs d’une confrérie du Trastevere supplient le pape de les autoriser à ${sujet}, et de leur accorder des indulgences pour attirer les dons. Tout le quartier attend la réponse.`]),
  opts: [{ t: 'Approuver et financer (25 marcs)', d: 'Peuple +7 · ferveur (États de l’Église) +3', req: () => S.treasury >= 25 ? null : 'Trésor insuffisant', fx() { modT(-25); modPeople(7); modF('etats', 3); return 'Toute la ville se presse ; les cierges brûlent jusqu’à l’aube.'; } },
   { t: 'Approuver sans un denier', d: 'Peuple +3', fx() { modPeople(3); return 'Les confrères feront la quête eux-mêmes.'; } },
   { t: 'Interdire : les foules sont dangereuses', d: 'Stabilité de Rome +3 · peuple −4', fx() { modStab(3); modPeople(-4); return 'Les sbires du sénateur dispersent les pénitents. Les barons sont rassurés.'; } }] };
}});

E({ id: 'faussaires', w: 2, cool: 12, art: 'keys', make() {
 const r = pickR(); if (!r) return null;
 return { realm: r, title: pick(['Des bulles contrefaites', 'Les faussaires de la Chancellerie', 'Le sceau de plomb volé']), text: pick([`On a saisi ${enR(r)} des lettres « pontificales » accordant dispenses et bénéfices à prix d’or : le parchemin est bon, l’écriture habile, mais la bulle de plomb a été décollée d’une vraie lettre et recousue. Le réseau remonte jusqu’aux scribes de la Curie.`, `Un clerc ${deR(r)} se présente avec une bulle qui le fait évêque. Le pape ne l’a jamais signée. L’enquête révèle un atelier, ${S.curia === 'rome' ? 'près du Panthéon' : S.curia === 'avignon' ? 'au pied du palais des Papes' : 'dans une auberge où loge la Curie'}, où l’on contrefait la chancellerie romaine et vend des grâces à toute la Chrétienté.`, `Un portier ${S.curia === 'rome' ? 'du Latran' : 'du palais pontifical'} a vendu un moule du sceau pontifical à des marchands venus ${deR(r)}. Depuis, des absolutions et des privilèges circulent par dizaines. Les évêques ne savent plus quelles lettres croire.`]),
  opts: [{ t: 'Châtier les coupables et réformer la Chancellerie (20 marcs)', d: 'Corruption −3 · autorité +2', req: () => S.treasury >= 20 ? null : 'Trésor insuffisant', fx() { modT(-20); modC(-3); modA(2); return 'Les faussaires sont livrés au bras séculier ; les scribes doivent désormais signer chaque lettre.'; } },
   { t: 'Étouffer l’affaire', d: 'Corruption +2 · loyauté des cardinaux +6', fx() { modC(2); modLoy(6); return 'Les cardinaux, dont plus d’un familier était compromis, vous en savent gré. On fait disparaître les preuves. Les fausses bulles continuent de circuler.'; } },
   { t: 'Confirmer les grâces déjà vendues contre une taxe', d: 'Trésor +30 · corruption +3', fx() { modT(30); modC(3); return 'Les acquéreurs paient une seconde fois. Rome y gagne ; sa réputation, moins.'; } }] };
}});
