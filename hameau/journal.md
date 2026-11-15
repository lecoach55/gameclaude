# Consigne de Victor (8 nov. 22h) : à CHAQUE vague, pousser beaucoup les graphismes.
Chaque vague de nuit : en plus des simulations, un chantier graphique vérifié (captures t11.py/studio.py, aucune erreur) puis republication de l'artifact c5adfecd-00f3-46b2-bf27-710271ef3626 (base_version via get_artifact).
Pistes graphiques par ordre : 1) villageois modélisés à l'Atelier (silhouettes, vêtements, outils) 2) arbres/rochers de l'Atelier plus variés (bouleaux, chênes, buissons, souches) 3) moulin à vent / pont / puits décoratifs, charrettes, linge étendu 4) eau : écume de rive, reflets, cascades 5) lumière : brume matinale, lucioles, ciel étoilé, lune 6) ombres de nuages visibles + oiseaux 7) relief plus marqué + falaises 8) variantes de maisons supplémentaires.
Fait : grille irrégulière façon Townscaper (déformation douce WA=0.42) publiée à 22h15.

## Vague 1 — échecs de chemins (enquête)
- 100 % des échecs sont « inaccessible » (ni limite A*, ni cible sur l'eau).
- Cause : `edgeSpawn` fait apparaître des immigrants sur des cases de bord **isolées par l'eau** (îlots). Ils restent coincés à vie et échouent toutes leurs tâches.
  Graines testées (novice, 30 j) : 1002 → 1/128 coincé, 248 échecs ; 1007 → 1/138, 593 échecs ; 1017 → 14/104 coincés (168 cases isolées), 10 616 échecs ; 1012 → 0.
- Correction candidate : calculer la composante connexe du hall (BFS 8-voisins sans couper les coins d'eau) et ne faire apparaître que dans celle-ci ; secours : rapatrier un villageois après N échecs consécutifs.
- Vague 1 graphisme : villageois modélisés à l'Atelier (tunique, ceinture, col, visage, cheveux, 5 chapeaux par métier) — publié.
- Vague 1 parties longues (100 j) : l'économie s'effondre au-delà de ~60 j. Expert : 47–54 j de famine sur 100 (pop 360–420) ; novice : ~15 j de famine + 11–14 j de froid (pop ~275). Piste : besoins hivernaux qui croissent plus vite que la production (hiver ×2 chauffage, croissance sans plafond, champs/forêt non agrandis à l'échelle). À creuser vague 3 : saturation de l'espace ? marche trop longue ? plafond d'immigration lié aux réserves ?

## Vague 2 — chantiers « bloqués » (enquête)
- Les cas « matériaux pleins » sont surtout des faux positifs : le détecteur compte les jours depuis la création du chantier, pas l'absence de progrès. Le chantier a attendu ses matériaux plusieurs jours (souvent 🔧 outils ou 🪨 pierre : 19 cas « pierre stock vide »), puis il est livré et se construit normalement (reproduit graine 1002 : terminé peu après).
- Vrai sujet : l'attente des amélioration (2 🪵, 3 🪨, 1 🔧) quand la pierre manque → conseil carrière plus tôt / priorité des carriers quand des chantiers attendent de la pierre.
- Détecteur à corriger : mesurer l'absence de progrès (prog et have inchangés depuis N jours).
- Vague 2 graphisme : bouleaux (écorce blanche tachetée, couronne élancée), buissons saisonniers (fleuris au printemps), souches de coupe dans les forêts exploitées — publié.

## Vague 3 — joueur « paresseux » (agit 1×/min)
- Population = capacité en permanence : la croissance est limitée par le LOGEMENT (zones Habitat peintes trop rarement, 3×3 par action).
- Jamais de marché ni de pêche → bonheur figé à 57, aucune maison en pierre.
- Hivers : bonheur 9–18 (famine), d'où ~15 départs ; parfois effondrement dès le jour 3 (6→4 hab., réserve de départ trop juste).
- Pistes : (a) l'habitat s'étend tout seul d'une rangée autour des maisons existantes quand il est plein et que le village est heureux (façon Foundation) ; (b) réserve de départ 40→60 🍞 ; (c) conseil d'hiver dès l'été pour les petits villages ; (d) conseils groupés (une action peut répondre à 2 besoins).
- Vague 3 graphisme : moulins à vent décoratifs (1 par ~28 cases de champs, ailes qui tournent), charrettes de foin près des entrepôts et marchés, linge étendu (maisons en bois var. 0), meules de foin sur les champs récoltés en automne/hiver — publié.

## Vague 4 — profilage (expert, 45 j, 344 hab.)
- assignJob 29 % + vdist 9 % + findFieldTask 8 % ≈ 46 % : chaque affectation balaie les 3 136 cases (3–4 fois : champs, forêt, carrière, pêche) et recompte les métiers de TOUS les villageois (O(pop²)).
- findPath 17 % (A* 8-voisins, coût tcost 1,5 %), stepVillager 14 %, GC 3 %.
- Pistes : (1) listes de tâches par type tenues à jour 1×/s (cases candidates) au lieu d'un balayage complet ; (2) comptage des métiers mis en cache par pas de temps ; (3) cache de chemins vers les entrepôts (champ de distances Dijkstra par entrepôt, recalculé quand le trafic change) → trajets « retour au dépôt » en O(longueur).
- Vague 4 graphisme : écume des rives (bande calculée depuis le relief, maillage déformé), ciel étoilé tournant, lune avec halo, brume du matin (brouillard rapproché et blanchi à l'aube) — publié.
- Vague 5 graphisme : relief marqué (collines + carrières surélevées), vols d'oiseaux, papillons près de la caméra. Publié 1794191322-75c3.

## Vague 6 — correctifs testés sur copie (sim_fix.js, nuit_fix.js, mêmes graines 7001+ que la vague 7)
Correctifs : (1) apparition des immigrants uniquement dans la zone reliée à la mairie (BFS) ; (2) secours : villageois coincé ramené à la mairie après 6 échecs ; (3) réserve de départ 40→60 🍞 ; (4) habitat qui s'étend tout seul d'une rangée (8 cases) quand il est plein et le village heureux.
Effet mesuré (moyenne par graine appariée, avant → après) :
- échecs de chemin : 5–14 % → 0 % (sauf expert/actuels 14 → 10 %) ✅
- paresseux : pop 62 → 131 (×2,1) mais famine 2,3 → 10,5 j et froid 0,1 → 7,8 j ⚠️
- novice : pop 179 → 262, famine 1,3 → 6,1 j, froid 0,6 → 3,4 j ⚠️ ; avec meilleurs paramètres pop 201 → 303, famine 0,1 → 1,8 j
- expert : inchangé (282 → 281 ; 326 → 330 avec meilleurs paramètres)
Conclusion : (1)(2)(3) validés. (4) fait grandir plus vite que la nourriture/bois → ajout d'un garde-fou (pas de famine/froid, printemps-été seulement, 🍞 ≥ 6×pop, 🪵 ≥ 0,5×pop) dans sim_fix.js ; version sans garde-fou gardée dans sim_fix_v6a.js. À valider en vague 7.
- Vague 6 graphisme (copie gfx/game.html, non publiée) : falaises en roche stratifiée sur les pentes fortes, crêtes plus sèches, creux assombris ; puits en pierre avec toit près de la mairie et des marchés. À intégrer et vérifier de jour au récapitulatif du matin.

## Vague 7 — validation finale (sim_fix.js avec garde-fou, graines appariées, avant → après)
- 45 j paresseux : pop 61 → 101 (meilleurs param. 65 → 119), famine 2,5 → 4,9 j (2,3 → 2,6), froid 0,1 → 1,3 j.
- 45 j novice : pop 179 → 207 (200 → 251), famine 1,3 → 2,4 j (0,1 → 0,7). Expert : inchangé, 0 % d'échec avec meilleurs param.
- Échecs de chemin : ~0 % partout sauf expert/actuels (14 → 10 %).
- 100 j : pop identique, mais départs novice 31 → 49 (l'habitat agrandi se vide en hiver). La famine des parties longues (expert 47 j) n'est PAS réglée par ces correctifs.
Décision pour le matin : intégrer (1) apparition reliée, (2) secours, (3) 60 🍞 au départ, (4) habitat auto avec garde-fou + meilleurs paramètres (harvestYield 7, mealInterval 12, storeDist 12…) qui compensent la famine. Chantier suivant : économie des parties longues.

## Matin (9 nov., demande de Victor « passer un cap graphiquement ») — publié 1794204989-082e
- Intégré dans src : correctifs vagues 6-7 (apparition reliée, secours, 60 🍞, habitat auto avec garde-fou) + meilleurs paramètres (récolte 7, repas 12, entrepôts 12, plantation 3, pêche 6). Sauvegardes : src/sim_v14.js, src/game_v15.html.
- Cap graphique : éclairage par le ciel (IBL PMREM recalculé selon heure/saison, reflets réels sur toits, eau, pierres), eau avec profondeur (hauts-fonds turquoise transparents → fond bleu sombre, caustiques animées), micro-relief du sol (normal map), herbe 2-3× plus dense (4 touffes/case en Haute, 6 en Ultra), falaises stratifiées, puits.
- Reste : économie des parties longues (famine ~47 j sur 100 chez l'expert), rochers un peu bleutés sous l'IBL.

# Journée du 9 nov. — Victor : « continue toute la journée dans tous les domaines » (vagues programmées 9h, 10h30, 12h, 13h30, 15h, 16h30, 18h bilan)
Feuille de route graphique restante : variantes de maisons, gros plan du blé (épis), ponts sur les chemins qui traversent l'eau, cascades, fumée/feux de camp, lucioles plus visibles, nuages volumétriques, saisons plus contrastées (automne doré), éclairage nocturne (halos de lanternes au sol).
Pistes mécaniques : froid du novice en partie longue (~10 j/100, bois de chauffage), expert 10 % d'échecs de chemin restants, performance (assignJob O(pop²)), conseils groupés.

## Jour v1 (07h40) — publié 1794206428-3279
- Mécanique : l'immigration exige 🍞 ≥ 3×pop et une tendance de nourriture ≥ 0 (sinon 🍞 ≥ 4×pop). 100 j, graines appariées : expert famine 27,5 → 7,5 j, bonheur 38 → 80, pop 489 → 373 ; novice famine 16,7 → 9,1 j, pop 367 → 312. 45 j : paresseux inchangé (131 → 135), novice pop −6 %. Variantes testées : immigTrend seul, 1,5×, 3× (retenue). Sauvegarde src/sim_v15.js.
- Interface : nouveau conseil « 🧳 Des familles attendent d'avoir assez à manger (🍞 x/y) » pour expliquer l'arrêt des arrivées.
- Graphisme : rochers irréguliers (icosaèdre déformé) avec mousse sur le dessus et faces d'ombre plus sombres ; vraies fleurs (tige + 5 pétales + cœur) qui ondulent au vent, en massifs de prairie bicolores (bruit basse fréquence). Sauvegarde src/game_v16.html.

## Jour v2 (09h25) — publié 1794212643-dd8c
- Diagnostic froid (novice 100 j, graine 2002) : la forêt de 300-500 cases ne porte que 3-20 arbres mûrs — les souches ne repoussent qu'avec peu de passage et les pousses sont piétinées dès le seuil « chemin ». Le froid tombe au début du printemps, après l'hiver.
- Testé : objectif de bois d'hiver relevé (×2,4) et conseil de bois chiffré → sans effet (froid 6,0 → 5,5 / 5,2 j).
- Retenu : les bûcherons REPLANTENT (pousse à la place de l'arbre coupé) + les pousses ne sont piétinées que sur les routes pavées. Novice 100 j (6 graines) : froid 6,0 → 1,6 j, départs 10,2 → 2,2, pop 317 → 328, famine 8,7 → 8,2 j. Expert 2001 : inchangé. Sauvegarde src/sim_v16.js.
- Interface : bulles d'humeur au-dessus des villageois proches (🍞 famine, 🥶 froid, 🔧 outils, 🏠 surpeuplement, 💤 sans travail, 😊🎵❤️ heureux, 😟 malheureux), renouvelées toutes les 3 s.
- Graphisme : blé en volume (tige, feuille, épi à grains en relief, barbes) ; halos chauds des lanternes au sol la nuit (additif). Sauvegarde src/game_v17.html.

## Jour v3 (10h45) — publié 1794217580-1d1c
- Diagnostic des 10 % d'échecs restants chez l'expert : 2 cartes seulement (7053 : 94 %, 7101 : 80 %). Cause : la pêche visait des rivages situés sur une rive non reliée à la mairie (ou des champs/arbres isolés) → des milliers d'A* inutiles.
- Retenu : les tâches (arbres, carrière, champs, pêche via le rivage) ignorent les cases hors de la zone reliée (reachFilter). Expert 7053 : pop 58 → 300, famine 15,5 → 0 j ; 7101 : 236 → 285 ; autres cartes, novice et chaotique : identiques. Sauvegarde src/sim_v17.js.
- Interface : outils dévoilés au fil de la croissance (Marché 6 hab., Démolir 8, Atelier 10, Pêche 12, Chapelle 20 — ou déjà utilisés), bouton qui pulse + toast « 🔓 Nouvel outil ».
- Graphisme : potagers à côté des maisons (terre, rangées de choux colorés, clôture) et poules qui picorent (rousses et blanches), enneigés en hiver. Sauvegarde src/game_v18.html.

## Jour v4 (12h10) — publié 1794222707-8205 — passe performance
- Profil (expert 7002, 35 j, 252 hab.) : assignJob 23 %, findPath 12 %, stepVillager 11 %, prédicats de recherche 11 %, nearest+vdist 9 %.
- Retenu : listes de cases par zone (reconstruites 1×/s) au lieu de balayer les 3 136 cases à chaque recherche ; distance au carré ; comptage des métiers mis en cache par pas de temps. ms/jour (5 derniers jours) : 167 → 103 (−38 %). Résultats appariés identiques (expert 300 → 304 hab., novice 45 j 254 → 251, novice 100 j 322 → 325). Sauvegarde src/sim_v18.js.
- Rendu : herbe reconstruite seulement si zones/saison/qualité changent (ou toutes les 6 s) ; mise à jour de la nature toutes les 0,9 s au lieu de 0,4 s ; résolution dynamique en Haute/Ultra (baisse la netteté jusqu'à 60 % si l'image dépasse 24 ms, remonte sous 14 ms) avant la baisse automatique de qualité ; Haute plafonnée à 1,75× la densité de pixels.
- Interface : panneau population → « 😄 Bonheur actuel → cible » avec ✔/✘ (repas, chauffage, outils, logements) et couverture marché / chapelle / variété.
- Graphisme (Atelier) : 2 nouvelles maisons en bois — chaumière blanchie à porche de chaume et tonneau, maison à soubassement de pierre et bardage avec appentis à bûches (5 variantes au lieu de 3). Sauvegardes models_v1.json, models_v1.mjs, game_v19.html.

## Jour v5 (13h40) — publié 1794228168-2d9f
- Bilan de la version actuelle (75 parties, 50 j, batch 1) comparé à la nuit : expert pop 303 → 320, famine 9,7 → 1,0 j ; novice 179 → 255, famine 2,2 → 1,6 j ; paresseux 64 → 152 hab., famine 4 → 1,5 j, départs 11,6 → 2,3 ; gourmand 256 → 301 ; chaotique 209 → 252, famine 5,1 → 2,1 j. Oisifs encore ~66 % du temps (piste : tâches d'appoint pour les oisifs). Anomalie « blocage inexpliqué » : arrivées bloquées par la tendance de nourriture sans conseil.
- Retenu : conseil « 📉 Les réserves baissent : les familles attendent qu'elles remontent » quand l'immigration est bloquée par la tendance. Novice 45 j (8 graines) : pop 251 → 254, famine 0,94 → 0,78 j, froid 0,47 → 0,26 j. Sauvegarde src/sim_v19.js.
- Interface : flèches de tendance ▲▼ sur le pain et le bois.
- Graphisme : outils modélisés pendant le travail (hache, pioche, houe, marteau, maillet) avec mouvement de frappe, éclats de bois / de pierre à l'impact ; charges modélisées (fagot de bûches sur l'épaule, sac de grain dans le dos, bloc de pierre, panier de poissons, caisse d'outils). Sauvegarde src/game_v20.html.

## Jour v6 (15h10) — publié 1794233428-84a5
- Mécanique : cueillette — un villageois sans métier a 1 chance sur 2 d'aller cueillir sur un arbre sauvage proche (hors zones, relié à la mairie, pas en hiver) : +2 🍞, l'arbre repousse ses baies en 150 s. Graines appariées : novice 45 j pop 254 → 264, famine 0,78 → 0,47 j ; paresseux 144 → 163 hab. (famine 1,0 → 1,2 j, froid 0,7 → 0,9 j) ; expert 320 → 332 ; novice 100 j (1 graine) 306 → 334 hab. mais famine 6,5 → 8,8 j (plus de bouches). Variante plus forte (0,8 / 3 🍞) testée : plus de population, plus de froid → non retenue. Sauvegarde src/sim_v20.js.
- Interface : bulle 🫐 au-dessus des cueilleurs ; le panneau compte les cueilleurs parmi les sans-métier.
- Graphisme : feu de camp sur la place près de la mairie (cercle de pierres, bûches, braises, 3 flammes additives qui vacillent, étincelles, bancs en rondins) qui s'allume la nuit et éclaire réellement les alentours (lumière ponctuelle en Haute/Ultra). Correctif : terre des potagers trop sombre. Sauvegarde src/game_v21.html.

## Jour v7 (16h35) — publié 1794238652-5c91
- Mécanique : en automne, les familles n'arrivent que si les réserves couvrent l'hiver des habitants actuels + 1 (×1,2). Graines appariées : novice 100 j (3) famine 8,7 → 7,3 j, froid 3,3 → 2,4 j, départs 7 → 3,7, pop 347 → 346 ; paresseux 45 j famine 1,1 → 0,6 j, départs 3 → 0,8 ; novice 45 j famine 0,46 → 0,08 j, pop 265 → 251 (−5 %) ; expert 100 j 404 → 381 hab., famine 7 → 6 j. Variante ×0,8 plus faible. Sauvegarde src/sim_v21.js.
- Interface : toucher une ressource affiche sa tendance par minute + le besoin d'hiver (pain) ou la consommation de chauffage (bois).
- Graphisme : tapis de feuilles mortes rousses sous les arbres en automne, pétales roses sous les arbres en fleurs et pétales qui volent au printemps, eau d'hiver givrée (vagues aplaties, teinte glace). Sauvegarde src/game_v22.html.

## Poussée graphique demandée par Victor (16h45 : « fais beaucoup évoluer les graphismes »)
- Sol naturel : les teintes de zones (traits roses/violets/verts) n'apparaissent plus qu'avec un outil de peinture ; en mode Déplacer le paysage est propre.
- Ombres de contact peintes au sol autour des bâtiments et sous les arbres (assombrissement doux) → les objets « posent » au sol.
- Arbres : couronnes à 7 lobes bosselés avec dégradé d'ombre interne (bas sombre, haut clair) et liseré lumineux en contre-jour ; sapins à 4 étages aux bords dentelés.
- Étalonnage : virage couleur (ombres légèrement bleutées, lumières chaudes) + courbe en S douce.
- Sauvegarde src/game_v23.html.

## Soir 1 (19h40) — publié 1794249564-3983
- Atelier : marché refait en vraie place pavée à bordure de pierre, deux étals (rayures rouges et rayures bleues/vertes) avec paniers de fruits, caisses empilées, sacs, tonneaux cerclés, panier au sol, banc ; entrepôt avec poutre de grenier, corde et sac suspendu, caisses empilées. Sauvegardes models_v2.mjs / models_v2.json, game_v25.html.
- Eau : vraies barques (coque, bancs, rames) qui dérivent et tanguent sur les zones de pêche, et remplacent les anciennes barques-boîtes des pontons.
- Interface : bouton 📷 « mode photo » (masque l'interface, un toucher la fait revenir).

## Soir 2 (21h10)
- Atelier : chapelle avec petit cimetière clos (muret, piliers, croix et stèles fleuries) et massifs de fleurs de part et d'autre du porche.
- Villageois : veillée — la nuit, les sans-métier proches du feu de camp s'assoient face aux flammes (jambes repliées, corps abaissé).
- Atelier (bâtiment) : gerbes d'étincelles de forge quand des artisans y travaillent.
- Sauvegarde src/game_v26.html.

# Nuit 2 (9→10 nov.) — Victor : « refais de nouvelles passes cette nuit … afin de passer un cap »
## Passe 1 (22h)
- Audit : (1) vue large — les chemins formaient un QUADRILLAGE gris (arêtes tracées entre toutes les cases voisines fréquentées), très carré ; (2) gros plan — sol flou et pâteux (16 px par case, flou 7 px).
- Chemins organiques : aires de terre aux contours doux (couches lissées + bordure d'herbe piétinée), routes et places pavées par-dessus (pavés fins dédiés au sol, joints sombres, reflets), cailloux et traces. Résultat : sentiers sinueux et vraie place pavée au cœur du village, plus aucun quadrillage.
- Sol 1,5× plus fin (24 px par case au lieu de 16).
- Sauvegarde src/game_v27.html.
## Passe 2 (23h30)
- Audit gros plan : le blé était trop haut (épis à la taille des villageois) et ses épis ressemblaient à du papier froissé.
- Blé : épis 40 % plus fins et plus longs, tiges plus fines, éclairage adouci, hauteur à maturité −20 %.
- Nuit : halo chaud au sol devant chaque maison, la mairie et la chapelle (lumière des fenêtres), en plus des lanternes — le village nocturne est maintenant ponctué de flaques de lumière dorée.
- Sauvegarde src/game_v28.html.
## Passe 3 (01h) — performance mobile
- Mesure (Haute, vue village) : 1,32 M triangles instanciés par image. Fleurs 622 k (4 575 × 136), couronnes 305 k (544 × 560), blé 121 k, rochers 52 k.
- Niveaux de détail selon la qualité : en Haute, fleurs simplifiées (tige en croix + corolle plate, 15 triangles) et couronnes allégées (lobes secondaires moins subdivisés) ; Ultra garde les versions complètes. Total Haute : 1,32 M → 0,64 M triangles (−52 %), sans différence visible à distance de jeu. updateNature ~11 ms (moyenne) sur le banc logiciel.
- Graphisme : sol des carrières en gravier (galets clairs et sombres, fissures).
- Sauvegarde src/game_v29.html.
## Passe 4 (02h30)
- Mécanique (famine résiduelle des parties de 100 j) — 3 variantes testées sur graines appariées : croissance hivernale 0,45 (moins de famine mais −8 % de pop), seuil d'automne ×1,6 (faible effet), PRIORITÉ AUX CHAMPS EN AUTOMNE (objectif de réserve ×1,4 et poids ×1,3 en automne) → retenue. Novice 100 j : famine 7,3 → 2,6 j, froid 2,4 → 1,7 j, départs 3,7 → 0,3, pop 346 → 350 ; expert 100 j : famine 6 → 3 j, pop 381 → 394 ; novice 45 j : famine 0,13 → 0, pop 248 → 246. Sauvegarde src/sim_v22.js.
- Graphisme saisonnier : citrouilles orange dans les potagers en automne ; bonshommes de neige (chapeau, écharpe rouge, nez carotte, bras en branches) devant ~30 % des maisons en hiver (9 dans la partie test) ; place pavée enneigée l'hiver.
- Sauvegarde src/game_v30.html.
## Passe 5 (04h)
- Audit vue maximale : le monde était un PLATEAU CARRÉ flottant au-dessus d'un vide vert uni (bords droits et coin visibles).
- Paysage au-delà de la carte : anneau de terrain de 110 cases qui prolonge le relief des bords (les lacs du bord se poursuivent puis remontent en rive), puis s'élève en collines ondulées ; prairie texturée aux couleurs de saison (vert, roux en automne, neige en hiver) ; ~2 600 arbres (sapins et feuillus) en massifs irréguliers, plus grands au loin. La caméra peut s'avancer jusqu'à 12 cases au-delà du bord.
- Sauvegarde src/game_v31.html.
## Passe 6 (05h30) — finition + validation
- Finition : fond du sol dessiné net sous la couche floue (bords plus francs).
- Validation (223 parties, version src) — comparée au 9 nov. soir : expert 100 j famine 8,1 → 4,4 j ; novice 100 j famine 7,4 → 3,0 j, départs 3,1 → 0,7 ; novice 50 j famine 0,5 → 0 ; chaotique 50 j famine 1,4 → 0,7, pop 254 → 261 ; autres profils stables ; 0 % d'échecs de chemin ; ms/jour −5 à −10 %. Détail : nuit/val_nuit2.txt.
- Captures jour, nuit, hiver, automne et vue des bords sans erreur. Défaut restant : fin trait à l'angle de la carte où un lac touche le bord (jonction carte / paysage extérieur).

# Journée du 10 nov. — Victor : « continue d'aller dans le sens d'être moins carré ; crée un générateur graphique si besoin »
## Passe 1 (09h30) — générateur organique
- Nouveau générateur de déformation (shader de sommets appliqué à tous les modèles de l'Atelier + leurs ombres) : chaque bâtiment épouse la courbure de la grille irrégulière (même champ que le sol, amplifié ×1,7), les murs penchent légèrement selon la hauteur, les faîtages ondulent ; tout est déterministe par position. Les ombres suivent (matériau de profondeur déformé). L'affaissement de faîtage a été désactivé (enfonçait les lucarnes).
- Orientation des bâtiments plus libre (±12° au lieu de ±6°, décalage ±0,11 case).
- Sauvegarde src/game_v33.html.
## Passe 2 (11h) — champs
- Nouveau générateur de contours organiques (marching squares sur un champ flouté, chaînage des segments, lissage de Chaikin) : il transforme n'importe quelle zone peinte en courbes douces.
- Champs : les clôtures droites (segments par case) sont remplacées par des murets de pierres sèches et des haies sinueuses qui suivent ces courbes (haie ou muret choisi par portion, ouverture sur les routes, couleurs de saison).
- Sillons courbes qui ondulent à travers les champs (plus de rayures horizontales) ; épis décalés pour casser les rangées en grille.
- Sauvegarde src/game_v34.html.
## Passe 3 (13h) — plans des bâtiments
- Atelier : maisons en pierre (2 variantes sur 3) avec une aile en retour d'équerre (plan en L, porte et fenêtre, toiture propre) ; chaumière à appentis arrière avec bûches ; marché posé sur une place ronde irrégulière bordée de pierres (plus de dalle carrée). Sauvegardes models_v3.mjs / models_v3.json.
## Passe 4 (15h) — bords et pinceau
- Jonction carte / paysage extérieur : le paysage extérieur suit la position déformée du sol (unwarp), le bord du sol est abaissé sous le paysage extérieur et l'intérieur n'est plus creusé à −3 → plus de marche ni d'arête visible sur la terre ; il subsiste un très léger trait dans l'eau d'angle (atténué).
- Pinceau carré → carré aux coins arrondis (le pinceau rond reste pour les tailles 5 et 7).
- Sauvegarde src/game_v35.html.
## Passe 5 (17h) — validation
- 152 parties (batch 1, 50 j) sur la version du jour : résultats identiques à la veille (expert 318 hab., famine 0,1 j ; novice 263, 0,1 j ; 0 % d'échecs) — les changements graphiques n'ont rien cassé. Captures jour/nuit/automne/vue large sans erreur.

# Journée du 11 nov. — Victor : « relance des passes toute la journée afin d'améliorer graphisme et mécanique »
## Passe 1 (08h)
- Point faible (validation du 10 nov.) : joueur passif froid 1,2 j, famine 1,1 j ; oisifs ~66 %.
- Mécanique : BOIS MORT — en automne/hiver (ou quand le bois manque), un sans-métier sur sept-dixièmes va ramasser du bois mort sous un arbre sauvage (+2 🪵, repousse 150 s). Graines appariées : passif 45 j pop 151 → 181, froid 0,9 → 0 j, famine 0,7 → 0,25 j, départs 0,8 → 0 ; novice 45 j pop 254 → 271, froid 0,35 → 0 ; novice 100 j pop 351 → 357, froid 1,25 → 0,6 j. Variante plus faible (0,5 / 1 🪵) moins efficace. Sauvegarde src/sim_v23.js.
- Interface : bulle 🪵 sur les ramasseurs ; panneau population détaille cueilleurs et ramasseurs.
- Graphisme : neige sur les toits selon la pente et des congères irrégulières (les tuiles apparaissent par plaques, plus d'aplats blancs uniformes). Correctif : clé de cache des shaders par matériau (les variantes neige/organique ne se mélangent plus). Sauvegarde src/game_v36.html.
## Passe 2 (09h50)
- Audit mécanique (65 parties, 50 j) : pierre quasi épuisée en fin de partie (1–40) alors que bois et pain s'entassent (800–1 600) → améliorations de maisons en attente de pierre (« chantier bloqué »).
- Retenu : les carriers tiennent compte de la pierre attendue par les chantiers et visent une réserve plus haute (×4 par maison, poids 3,2). Graines appariées : chaotique bonheur 83 → 88, pop 274 → 277 ; expert bonheur 86 → 88 ; novice 100 j famine 2,25 → 1,5 j, froid 1,25 → 0,8 j, pop 334 → 345 ; novice 45 j pop 271 → 268 (−1 %). Sauvegarde src/sim_v24.js.
- Graphisme : MÉTÉO — jours de pluie (28 % au printemps et en automne, 12 % en été, jamais en hiver) : rideau de pluie et éclaboussures au sol, ciel gris, lumière baissée, brouillard rapproché, pavés et sol mouillés qui brillent (rugosité ↓, reflets ↑).
- Interface : icône 🌧️ dans la pastille de saison quand il pleut.
- Sauvegarde src/game_v37.html.
## Passe 3 (11h35) — performance + flaques
- Mesure : les ajouts récents (paysage extérieur, murets/haies) avaient fait remonter la Haute à 1,39 M triangles et updateNature à 24 ms. Correctifs : arbres lointains en géométrie simplifiée (sapins 2 étages, feuillus 3 lobes non subdivisés) ; contours des champs mis en cache (recalculés seulement si les champs changent). Résultat : 0,82 M triangles (−41 %), updateNature 12 ms (−50 %). Simulation : 89 ms/jour (expert, 245 hab.).
- Graphisme : après la pluie, flaques sombres et brillantes dans les creux du sol (elles apparaissent pendant l'averse et sèchent lentement), sol légèrement assombri quand il est mouillé.
- Sauvegarde src/game_v38.html.
## Passe 4 (13h20) — fête des moissons
- Constat : en fin de partie pain et bois s'entassent (800–1 600) sans usage.
- Mécanique : FÊTE DES MOISSONS — au passage été → automne, si les réserves dépassent 1,8× le besoin d'hiver, le village consomme 2 🍞 et 0,5 🪵 par habitant et fait la fête : +10 de bonheur pendant un quart de saison, puis +4 pendant une saison et demie. Sinon, un message explique qu'il manque des réserves. Effet mesuré (graines appariées) : globalement neutre sur la survie (novice 45 j pop 268 → 272, bonheur 79 → 81 ; expert bonheur 86 → 88 ; paresseux identique ; novice 100 j famine 2,1 → 3,0 j sur 2 graines, d'où le seuil relevé de 1,6 à 1,8). Intérêt surtout : donner un but aux surplus et un évènement visible. Sauvegarde src/sim_v25.js.
- Graphisme : pendant la fête, mât fleuri sur la place (couronne qui tourne), guirlandes de fanions colorés tendues vers les toits des maisons voisines, pluie de confettis ; bulles 🎉🎵🍻💃 au-dessus des villageois.
- Sauvegarde src/game_v39.html.
## Passe 5 (15h05)
- Mécanique : DÉSHERBAGE — un sans-métier (6 fois sur 10, hors hiver) va entretenir un champ en croissance proche : +20 % de pousse, une fois par demi-cycle par case. Graines appariées : paresseux 183 → 202 hab. (famine 0,3 → 0) ; novice 45 j 272 → 280 ; expert 314 → 317 ; novice 100 j 338 → 370 hab., famine 2,5 → 3,1 j (plus d'habitants à nourrir), froid 0,8 → 0,2 j. Bonheur ±3. Sauvegarde src/sim_v26.js.
- Interface : bulle 🌱 sur les villageois qui désherbent.
- Graphisme : variété des villageois — ~45 % portent une robe longue colorée (7 teintes), la plupart avec un tablier clair, et un fichu coloré quand ils n'ont pas de chapeau de métier.
- Sauvegarde src/game_v40.html.
## Passe 6 (17h) — finition + validation
- Finition : neige des toits en plaques douces et irrégulières (le motif à taches régulières disparaît).
- Validation (62 parties ; moins qu'hier car les villages plus grands simulent plus lentement) vs 10 nov. : expert 50 j 318 → 337 hab. ; novice 263 → 297 ; paresseux 158 → 195 hab., famine 1,1 → 0,3 j, froid 1,2 → 0,1 j, départs 1,3 → 0,2 ; gourmand 303 → 330 ; chaotique 260 → 289, famine 0,7 → 0,2 ; 100 j : expert 361 → 403 hab., famine 4,4 → 3,9 j ; novice 344 → 359 hab., famine 3,0 → 3,5 j, froid 1,1 → 0,4, départs 0,7 → 0. Le taux « oisifs » monte (0,66 → 0,72) car cueillette, bois mort et désherbage sont comptés comme temps sans métier. Détail : nuit/val11.txt.

# 12 nov. — Victor : « enlève le côté pixélisé » + « le jeu est un peu lent, ça rame »
## Passe netteté + fluidité (11h45) — sauvegarde src/game_v41.html
- Netteté : textures procédurales (tuiles, murs, chaume, pavés, plâtre) dessinées en double résolution + filtrage anisotrope maximal ; anticrénelage SMAA en fin de chaîne ; ombres 30 % plus fines (cadrage serré autour de la caméra) ; flou de bascule supprimé en Haute (gardé en Ultra) — c'était une source de flou.
- Fluidité (causes de saccades trouvées) : (1) le sol 1344×1344 était redessiné et renvoyé au GPU toutes les 1,2 s → maintenant seulement s'il change (1 fois en 30 s au lieu de 25) ; (2) l'éclairage du ciel (PMREM) était recalculé ~toutes les 2 s → 6 fois par jour de jeu ; (3) la lumière du feu de camp forçait la recompilation de tous les shaders à chaque allumage → supprimée (halo au sol conservé) ; (4) MSAA ×4 seulement en Ultra (SMAA en Haute) ; (5) Haute plafonnée à 1,5× la densité de pixels, adaptative jusqu'à 75 % ; (6) herbe 3 touffes/case en Haute.
## Visuel 1/3 (13h30) — reflets — sauvegarde src/game_v42.html
- Reflets dans l'eau : rendu miroir à 1/4 de résolution (1/2 en Ultra), mis à jour 1 image sur 3 (1 sur 2 en Ultra), seulement quand de l'eau est proche de la caméra et hors hiver (eau gelée) ; l'herbe, les fleurs, le blé, les haies, les particules et les halos sont exclus du reflet ; plan de coupe à la surface ; léger flou + ondulation. Les pontons, arbres, maisons riveraines, le ciel et les étoiles se reflètent.
- Correctif : l'eau restait bleu vif la nuit → sa couleur et ses reflets d'environnement suivent maintenant la lumière du jour (eau sombre étoilée la nuit).
- Coût : triangles instanciés inchangés ; une passe supplémentaire à 1/16 des pixels une image sur trois.
## Visuel 2/3 (15h40) — maisons vivantes — sauvegarde src/game_v43.html
- Autour des maisons, en instances partagées placées dans le repère de chaque maison : bancs devant la façade (~1 sur 2), tas de bûches abrités sur le côté (~1 sur 2), tonneaux cerclés (1 ou 2, ~6 sur 10), LIERRE sur le mur arrière, plus fourni sur les maisons anciennes et en pierre (roux en automne, absent en hiver). Variété déterministe par maison. Aucun nouveau matériau par maison.
## Visuel 3/3 (17h40) — villageois expressifs — sauvegarde src/game_v44.html
- Démarche : buste penché en avant et balancement latéral en marchant, bras plus amples ; enfants (~15 % des sans-métier) à l'échelle 0,68 qui sautillent ; les sans-métier immobiles proches se tournent l'un vers l'autre et discutent (gestes de la main, léger balancement) — rare en pratique car les sans-métier sont souvent occupés (cueillette, bois mort, désherbage).
- Validation : 0,83 M triangles en Haute (contre 1,39 M avant les optimisations du 11 nov., 0,82 M après) ; simulations 64 parties identiques à la veille (expert 338 hab., paresseux 193, 0 % d'échecs) ; captures jour/nuit/hiver sans erreur.

# 13 nov. — Victor : « continue de travailler sur le jeu et de le rendre plus professionnel »
## Passe 1 (11h30) — habillage professionnel de l'interface — sauvegarde src/game_v45.html
- Jeu d'icônes vectorielles maison (34 symboles SVG cohérents) à la place des emojis : ressources, saisons, météo, vitesse, menu, 12 outils, rotation, photo, conseils. Les emojis restants dans les conseils et notifications sont convertis en icônes colorées.
- Barre de ressources unifiée en verre dépoli (séparateurs, chiffres tabulaires), 2e rangée bonheur / saison / vitesse / menu ; conseil en carte crème avec ampoule et « voir » ; dock d'outils en verre, outil actif doré ; boutons ronds en verre ; notifications animées ; palette de zones adoucie.
- Écran titre : logo, titre en serif, « Comment jouer » repliable, bouton principal en relief, bouton de qualité sélectionné lisible.
## Passe 2 (14h45) — finition des écrans — sauvegarde src/game_v46.html
- Panneau population refait : grand indicateur de bonheur (actuel → cible), pastilles ✓/✕ des besoins, jauges colorées (marché, chapelle, variété), répartition des métiers en barres avec icônes, graphique d'évolution avec légende.
- Fiche de bâtiment en carte crème : pastille d'icône, titre en serif, ✓/✕ colorés, icônes à la place des emojis, barre de chantier en dégradé, bouton Démolir soigné.
- Vrai menu pause (fond flouté) : statistiques du village, Reprendre, qualité graphique, son (activé/coupé + volume, mémorisés — l'audio arrive en passe 3), aide repliable, Nouvelle carte avec confirmation.
## Passe 3 (16h50) — son et ressenti — sauvegardes src/game_v47.html, sim_v27.js
- Ambiance 100 % synthétisée (Web Audio, aucun fichier) démarrée au premier toucher : vent (plus fort en vue large et en hiver), pluie selon la météo, clapotis près de l'eau, chants d'oiseaux le jour, grillons la nuit.
- Sons d'interface : clic d'outil, petits coups de pinceau, carillon de bâtiment terminé (accord montant), amélioration de maison, arpège « nouvel outil », fanfare de la fête, notification. Volume et coupure du menu pause appliqués en direct.
- Retours visuels : anneau coloré qui s'étend à chaque coup de pinceau ; gerbe d'étincelles dorées qui monte quand un bâtiment se termine (nouvel évènement « built » dans la simulation).
## Passe 4 (18h15) — première partie + validation — sauvegarde src/game_v48.html
- Tutoriel non bloquant en 4 étapes (Habitat → Champs → Forêt → accélérer le temps) : carte crème avec titre, compteur 1/4, halo doré pulsant sur le bon outil, passage automatique quand l'étape est réussie, « Passer le tutoriel » ; conseil et aide masqués pendant le tutoriel pour éviter les consignes contradictoires ; ne s'affiche qu'une fois (mémorisé).
- Indicateur discret « Sauvegardé » qui apparaît à chaque sauvegarde automatique (toutes les 15 s).
- Validation : aucune erreur ; 0,83 M triangles (inchangé) ; 69 parties identiques aux jours précédents (expert 339 hab., paresseux 196, 0 % d'échecs) ; captures jour/nuit/hiver/titre OK.
## 15 nov. 2026 (soir) — « La vie du hameau » : jeu plus riche et plus profond — sauvegardes src/game_v50.html, sim_v29.js (avant)
- **Générations** : chaque villageois a un prénom (liste médiévale), un sexe et un âge (1 an par saison). Les familles heureuses (bonheur ≥ 55, logement libre, réserves) ont des enfants ; les enfants jouent près des maisons, mangent ½ ration et deviennent travailleurs à 14 ans ; dès 58 ans, travaux légers seulement (pas de forêt, carrière ni chantier) ; retraite à 66 ans ; décès paisibles après 62 ans (deuil : −4 de bonheur pendant 40 s). Rendu : taille selon l'âge, anciens voûtés et fichus/bérets gris, robes selon le sexe.
- **Élevage** : nouvelle zone Pâturage (outil débloqué à 14 habitants). Un couple de moutons arrive, le troupeau s'agrandit (1 mouton pour 4 cases), la laine repousse hors hiver, les bergers tondent (3 🧶) et abattent l'excédent (6 🍞). L'atelier tisse 2 🧶 → 1 🧥. Village bien vêtu (≥ 0,12 🧥/hab.) : +6 de bonheur et chauffage d'hiver ×1,5 au lieu de ×2 ; foin des moutons en hiver. Rendu : moutons laineux/tondus/agneaux qui broutent, clôture de piquets et lisses suivant le contour organique de la zone, trèfle, abreuvoirs.
- **Marchand ambulant** : au printemps et à l'automne s'il y a un marché, une roulotte bâchée s'installe 2/3 de saison ; 3 échanges tirés au hasard parmi 12 (stock 3 chacun) ; fenêtre d'échanges dans la fiche du marché ; conseil « le marchand est au marché ».
- **Fertilité et jachère** : chaque récolte use la terre (−0,12), qui se repose quand la case n'est pas semée et surtout en hiver ; rendement × (0,62 + 0,42 × fertilité) ; une case trop usée (< 0,3) reste en jachère jusqu'à 0,7 (trèfle visible) ; épis plus pâles sur terre fatiguée ; fertilité affichée dans la fiche du champ.
- **Fiches** : toucher un villageois (prénom, métier accordé, âge, activité, humeur, bouton « Suivre » qui fait suivre la caméra) ou un mouton (laine, troupeau) ; panneau population : bergers, enfants, anciens, naissances/décès, « bien vêtus ».
- Optimisation : la recherche d'un atelier libre était en O(villageois × ateliers) à chaque attribution de tâche ; calculée une seule fois → simulation au même coût qu'avant malgré les nouveautés (215 ms/jour contre 216, village de 280 hab.).
- Validation : simulations appariées 5 profils × 6 graines × 60 jours (outil `outils/simulation/apparie.sh`) — population +3 à +9 %, famine identique (expert 0,46 j, novice 0,75 j), froid supprimé (novice 0,49 → 0 j), départs 0 ; triangles +0,6 %, mise à jour de la nature ~7 ms ; aucune erreur ; captures `outils/captures/nouveautes.py`.
