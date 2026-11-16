# Journal des cycles d'amélioration — Couronnes & Complots

Outils : test/ab/ab.cjs (A/B rapide, rendu désactivé ; `RULES='{...}' node ab.cjs N G lvlA lvlB snap.html out.json`), test/r5/stats.cjs (statistiques détaillées, lent).
Niveaux d'IA : facile, normal (= logique « classique »), ruse (cotes exactes + renforts BSR + seuil adapté au nombre de joueurs), tXX (seuil fixe, tests).

## Cycle 1 (8 nov., 22h)
- Recherche : heuristiques IA de Risk (Hahn 2010 : renforts selon la menace, n'attaquer qu'avec de bonnes chances), catch-up et coalition (Twilight Imperium, positional balance).
- Cotes de combat exactes (programmation dynamique) pour l'IA et l'interface.
- Découverte : à 4 joueurs la prudence gagne (t85 bat t55 à 63 %), en duel l'agressivité gagne (t55 bat t85 à 67 %). Les variantes de règles testées (influence par territoire, sacre conditionné à la moyenne de territoires, butin par conquête) ne changent pas cette dynamique → non retenues.
- IA rusée adaptative : bat la normale 64 % (4J), 53 % (2J). Facile : 47 % (4J), 28 % (2J) contre la normale.
- Sélecteur de difficulté par Maison dans l'écran de configuration.

## Cycle 2 (8 nov., 23h30) — parties bloquées et Conseil
Outil ajouté : test/ab/fs.cjs (stats détaillées rapides) + anH.cjs (analyse).
- Mesure (480 parties) : parties > 40 manches = 0 % en IA normale, mais 19 % avec 5 IA rusées (trop prudentes, une Maison plafonne à 17-18 territoires). Pactes : 3 à 13 par partie, 0,6 à 2,4 trahisons. Édits adoptés entre 14 % (Censure) et 91 % (Levée) : tous jouent un rôle, aucun « sans effet ».
- Correctif : fin de règne à la manche 30, victoire au score (territoires + bonus de régions + 3 si capitale tenue + influence ÷ 3), score affiché dans « Voie de la Couronne », compteur « Manche x/30 ».
- IA rusée : plus agressive quand la domination est à portée, en fin de règne, ou quand elle mène.
- Vérif : 0 partie > 40 manches (5 rusées : 35 % finissent au score ; 4 normales : 1 %). Rusée vs normale : 68 % (4J), 69 % (5J).
- Version publiée : 1794177449-1ea8.

## Cycle 3 (9 nov., 1h) — IA politique et diplomatique
Variantes testables : niveau « ruse+X » (eco, vote, watch, nopact, pacts, crown, merc, h2). Règles testables via RULES (mercCost, mercArmies, mercStab, crownInf, crownHold, crownCost).
- A/B (150 parties chacun, 4J) contre la rusée : thésauriser pour le Sacre (crown) gagnait 73 % ; économe 63 % ; mercenaires systématiques 65-81 % ; voter plus fort 33 % ; surveiller les thésauriseurs 45 % ; sans pacte 45 % ; pactes fréquents 54 %.
- Problème 1 : le Sacre d'un thésauriseur passait trop facilement car les IA restaient prudentes pendant la manche de Sacre. Correctif IA : contre un prétendant, seuil d'attaque abaissé à 40 %, plus de limite de conquêtes. Résultat : crown 55 % (4J) au lieu de 73 %. Variantes de règles (sacre conditionné, 15 d'influence, seuil 7) testées, effet faible → écartées.
- Problème 2 : les mercenaires (2 ⚜ → 3 armées) dominaient (mercenaires vs Sacre : 66 %). Testé : coût 3, 2 armées, −1 stabilité, combinaisons. Retenu : coût 3 ⚜ et −1 stabilité → mercenaires vs Sacre 53 % (4J) et 53 % (2J), équilibré.
- IA rusée : achète des mercenaires dès que sa stabilité ≥ 5 (variante prudente h2 testée : nettement plus faible, écartée). Seuil d'attaque 4-5 joueurs abaissé de 82 % à 75 %.
- Résultat : rusée vs normale 73-82 % ; normale vs facile inchangé. Usage des actions par tour de joueur : mercenaires 0,22-0,30, propagande 0,21-0,25, soudoyer 0,11-0,12, révolte 0,04-0,06 → aucune dominante ni inutile.
- Remarque : tables 100 % rusées très souvent tranchées à la manche 30 (guerre d'usure entre égales) ; acceptable grâce à la fin de règne.
- Version publiée : 1794184648-9fc3.

## Cycle 4 (9 nov., 2h30) — graphisme et lisibilité
Captures (test/audit5.py) : 1440×860, 1180×720, 390×844, deutéranopie ; début, milieu chargé, Sacre, fin.
Défauts relevés → corrigés :
- Fil des actions de l'IA vide après 150 entrées de journal (index décalé) → entrées numérotées.
- Rouge (Vermeil) et vert (Sinople) indiscernables en deutéranopie → Sinople passe au vert-bleu, et hachures héraldiques sur les terres (système de Petra Sancta : gueules verticales, azur horizontales, sinople diagonales, or pointillé, pourpre diagonales inverses).
- Bouton « Provinces » qui chevauchait le plateau de dés sur mobile → masqué sous 900 px.
- Pertes de combat peu lisibles → « −1 » rouges flottant au-dessus des blasons concernés.
Ajouts : hachures côtières façon XVIIIe (traits perpendiculaires au trait de côte) ; « Chronique du règne » dans la fenêtre de victoire (territoires par Maison au fil des manches, tirets différents par Maison).
Non-régression : 60 parties sans erreur. Version publiée : 1794188095-01df.

## Cycle 5 (9 nov., 4h) — expérience du joueur humain
Outil : test/ab/hv.cjs (un « héros » à siège tournant contre N−1 IA). Profil « naif » = humain débutant simulé (seuil 60 %, placements approximatifs, oublis politiques).
- Constat : l'ancienne IA facile n'était pas facile. Un débutant gagnait 68 % en duel mais seulement 16 % à 4 joueurs (en dessous des 25 % d'une partie équitable), car l'IA facile, téméraire, s'en prenait aussi au joueur. Deux autres versions « plus bêtes » (prudente f2, très distraite f3) donnaient le même résultat, de 13 à 19 % à 4-5 joueurs.
- Retenu : Facile = logique de la normale, mais 30 % de renforts en moins. Un débutant gagne alors 76 % (2J), 66 % (3J), 60 % (4J) et 60 % (5J).
- Débutant contre normale : 50 %, 31 %, 29 %, 27 % (proche de l'équitable). Débutant contre rusée : 27 %, 22 %, 15 %, 7 %. Un expert (rusée) contre des normales : 71 %, 50 %, 37 %, 35 %. La courbe de difficulté est cohérente.
- Durée médiane pour un humain : 8 à 14 manches contre facile ou normale, jusqu'à 30 (fin de règne) contre 4 rusées.
- Frictions corrigées : aperçu des renforts dès la phase politique ; bouton « Annuler » les placements ; pas de 3 armées par clic par défaut au-delà de 8 renforts ; le panneau revient en haut à chaque changement de phase ; niveaux d'IA expliqués dans les règles.
- Version publiée : 1794194347-f85f.

## Cycle 6 (9 nov., 5h30) — consolidation
- Non-régression : 560 parties (2 à 5 joueurs, niveaux mélangés) → 0 erreur JS, 0 partie non terminée. Durée médiane 7-21 manches selon la table (8-12 pour des tables de même niveau à 2-4 joueurs). Part politique 18-40 % selon les niveaux (plus basse quand une rusée est à table, car elle gagne surtout militairement).
- Sièges : 3J (65/70/65) et 4J (57/48/47/48) équilibrés sur 200 parties ; en duel, le premier joueur gagnait 58 % (231/400). Compensation du second joueur passée de +2 à +4 armées → 49,5 % / 50,5 % sur 400 parties (+6 testé : 41/59, trop).
- Règles affichées relues et alignées sur le code (la stabilité mentionne désormais mercenaires, révoltes et Impôt de guerre).
- Partie humaine complète jouée par de vrais clics dans Chrome (3 Maisons, 15 manches, victoire militaire adverse) : aucun blocage d'interface.
- Observation : le joueur simulé a fini avec 28 influence inutilisée → piste : signaler à un humain qu'il thésaurise sans pouvoir proclamer (stabilité trop basse).
- Version publiée : 1794199170-2fcc.

## Cycle 7 (12 nov., midi) — influence dormante et voie politique
Réponses par défaut aux questions du bilan (Victor n'a pas tranché) : garder la fin de règne à 30 ; ajouter un usage à l'influence ; rendre la voie du Sacre plus présente sans affaiblir l'IA.
- Nouvelle action « Ordre du jour » (3 ⚜, une fois par manche pour toute la table) : choisir parmi 3 l'édit de la prochaine manche. Le vote reste ouvert à tous, et l'auteur est affiché sur la carte de l'édit. L'IA l'utilise (≈ 0,03 par tour de joueur), surtout pour l'Embargo contre la Maison en tête.
- Conseil à l'écran quand un humain a ≥ 9 ⚜ inutilisés : stabilité manquante pour proclamer, capitale à reprendre, ou usages possibles.
- IA rusée : vise le Sacre quand sa capitale est sûre (garnison ≥ menace voisine) avec 6+ de stabilité et 6+ d'influence. A/B contre l'ancienne : 51/49 (4J), 47/53 (2J), donc même force, mais 12 fois plus de victoires politiques (25 au lieu de 2 contre la normale). Rusée contre normale : 71,5 %. Débutant contre facile : 56 % (4J).
- Version publiée : voir l'historique de l'artefact.

## Cycle 8 (12 nov., 13h45) — diplomatie vivante
- Mesure : les pactes ont une vraie valeur. Une rusée qui pacte souvent bat une rusée qui ne pacte jamais à 56,5 % (200 parties, 4J). Trahisons : environ 1 par partie (tables normales).
- Acceptation par l'IA d'un pacte humain : 60 % sans frontière commune ; avec frontière, toujours si l'humain est au moins à 85 % de sa force, sinon 30 %.
- Ajouts :
  - Réputation : une Maison qui trahit devient « parjure » 6 manches (✗ dans le bandeau) ; l'IA refuse alors 80 % de ses propositions et ne lui en fait plus. Effet sur l'équilibre : neutre (pactes/partie 6,3 → 5,5, trahisons 1,04 → 0,99).
  - Les propositions de l'IA au joueur sont motivées (« Votre puissance nous inquiète… » chiffres à l'appui, ou frontière commune), avec un avertissement si elle est parjure.
  - Le menu de diplomatie indique pour chaque IA « acceptera / hésitera / refusera sans doute ».
  - IA rusée plus diplomate (45 % de chances de proposer à une IA, 25 % à un humain pour ne pas l'inonder de fenêtres) : force inchangée (48,5 % contre l'ancienne, 71 % contre la normale).
- Écarté : alliance offensive (pas de besoin mesuré, risque de kingmaking).
- Difficulté vérifiée : débutant vs facile 64 % (4J), vs rusée 13 %.

## Cycle 9 (12 nov., 15h15) — graphisme et sensations
- Conquête : une bannière aux couleurs du vainqueur se plante près du blason et s'efface (1,7 s), en plus du fondu de couleur du territoire.
- Cartouche « Valdorre · les six provinces » à cheval sur le cadre de la carte.
- Icône de capitale agrandie de 15 % avec un halo clair ; noms de territoires passés de 12 à 13 px.
- Écran d'accueil : couronne gravée, sous-titre « Chronique des guerres de Valdorre », fond plus flou et sépia.
- Sons synthétisés en Web Audio, désactivés par défaut (bouton « Son : non/oui », choix mémorisé) : dés, conquête, Conseil, proclamation, intrigue. Aucun fichier externe.
- Animations neutralisées par prefers-reduced-motion (règle globale existante).
- Corrigé pendant la passe : le texte du cartouche débordait, les boutons d'en-tête passaient à la ligne sur mobile.
- Non-régression : 60 parties, 0 erreur ; rusée contre normale 77 %.

## Cycle 10 (12 nov., 16h45) — consolidation
- Non-régression : 480 parties (2 à 5 joueurs) → 0 erreur, 0 partie non terminée. Durées médianes : 7 (2J), 9 (3J), 13 (4J), 19 (5J mixte).
- Sièges : 2J 61/59 ; 4J 34/26/32/28 ; 3J 50/30/40 (siège 2 à 25 %, limite du bruit statistique, à surveiller).
- Courbe de difficulté (débutant simulé) : contre facile 72 % (3J) et 63 % (4J) ; contre rusée 21 % (3J) et 34 % (2J, un peu au-dessus de la cible de 30 %).
- Règles affichées relues : conformes (ordre du jour, réputation, niveaux d'IA, mercenaires, Sacre, fin de règne).
- Partie humaine complète par clics réels : 14 tours, aucun blocage.
- Aucun changement de code → pas de republication.

## Pistes pour les cycles suivants
- Stabilité des parties > 40 manches (« none ») à surveiller (≈5 %).
- Parts de victoire politique selon niveau ; réaction de l'IA à une Maison qui thésaurise.
- Graphisme : lisibilité des étiquettes à petite taille, animations de combat, chronique de fin de partie.

## Cycle 11 (15 nov.) — outils partagés du dépôt gameclaude
Le jeu, ses outils et ses mesures sont désormais dans lecoach55/gameclaude (dossier couronnes-et-complots/).
- Banc de performance reproductible (outils/perf.py, basé sur outils-communs/atelier.py, graine fixe), rendu logiciel → valeurs relatives :
  | scène | avant tél. 390×780 | après | avant 1440×900 | après |
  | zoom + déplacement | 4,6 img/s | 54 | 2,1 | 5-8 (logiciel ; composé par la carte graphique sur un vrai appareil) |
  | tour d'IA | 31 | 59 | 12 | 42 |
  Causes trouvées (outils/coupables.py, couches.py) : ombre portée en filtre CSS sur toute la carte (recalculée à chaque changement), ~2000 cellules par territoire, textures feTurbulence, zoom qui redessinait tout.
  Correctifs : géométrie compacte (segments enchaînés en anneaux, page 340 → 200 Ko), zoom par transformation CSS puis engagement du viewBox 140 ms après le geste, textures calculées une seule fois en image, ombre sur un calque séparé.
- Références visuelles (outils/refs.py → references/normale, 6 vues) + outils-communs/compare.py : 0,0 % de pixels changés après les optimisations.
- Bug trouvé par le test en clics réels : un double appui sur « Assaut total » lançait deux assauts simultanés → corrigé.
- Trousse de test commune intégrée : bouton 🐞 (capture de la carte + état de la partie) et « 🧪 Mode test » dans l'écran d'accueil (banc 5 s : tour d'IA, zoom, repos). Résultats dans la base de l'artefact (capacités db + user). outils-communs/testkit.js étendu aux jeux en SVG (option capture, fonction svgCapture).
- Non-régression : rusée vs normale 75 %, débutant vs facile 72 % (3J), 0 erreur.

## Cycle 12 (15 nov., 17h) — d'après la première mesure réelle
Mesure de Victor (MacBook Pro Intel, Iris Plus, application Claude, volet de 483×755 @2) : tour de l'IA 58,3 img/s (1 % les plus lents : 26,7). Zoom et repos : aucune image enregistrée → le navigateur avait suspendu l'affichage (volet masqué ou fenêtre en arrière-plan).
- Trousse commune (outils-communs/testkit.js) : la mesure attend que la page soit visible ; si l'affichage est suspendu (< 3 img/s enregistrées), elle recommence une fois puis marque la scène `masquee: true`. Le jeu affiche ⚠ et un conseil.
- Volet étroit / téléphone : la carte n'était plus lisible (largeur minimale de 840 px, défilement horizontal). Désormais ajustée à la largeur, départ zoomé ×1,8 sur la capitale du joueur, pincement à deux doigts, double appui (zoom / dézoom), en-tête compacté (son en icône).
- Banc perf.py étendu à 483×755 : zoom 55,6 → 58,3 img/s, IA ≈ 57, sans erreur. Références téléphone mises à jour (changement voulu) ; vues ordinateur : 0,0 % de pixels changés.
- Tests : pincement 584 → 329 unités de largeur, double appui OK (émulation tactile), partie complète en clics réels OK, A/B rusée vs normale 77 %, 0 erreur.

## Cycle 13 (16 nov.) — parties sans fin, lisibilité, combats, chronique
- Diagnostic « parties > 40 manches » : 480 parties (5 rusées, 4 normales, 2 rusées, 3 normales, tables mêlées 4J et 5J) → 0 partie non terminée, 0 erreur. Les ≈5 % datent d'avant la fin de règne (cycle 2) : la piste est close. Constat restant : à 5 rusées, 78 % des parties vont jusqu'à la manche 30 et se tranchent au Conseil (médiane 30) ; 4 normales : 1 % ; tables mêlées 4J/5J : 8-9 %.
- Noms de territoires : taille à l'écran d'au moins ~11,5 px (variable --lk recalculée à chaque fin de geste et au redimensionnement, plafond ×1,6). Téléphone au départ : ~8 → ~11,5 px. Ordinateur inchangé (0,0 % de pixels).
- Combat : trait d'attaque courbe aux couleurs de l'assaillant, pointe, choc (croix) sur la cible, secousse du blason qui résiste ; « −1 » plus clairs et plus grands.
- Chronique de fin : repères sur le graphique et liste des moments clés (capitales prises, trahisons, proclamations, éliminations, changements de tête ; 7 au plus, capitale reprise plusieurs fois racontée une fois). Fenêtre de fin ouverte en haut (le focus faisait défiler sur téléphone).
- Équilibre intact : 15/15 parties à graine fixe identiques avant/après ; rusée vs normale 78 % (120 parties, 4J) ; débutant vs facile 4J 51 % / 59 % avant (80 parties chacun, même code de jeu : bruit).
- Fluidité (perf_v7.json vs version d'avant, même minute) : téléphone zoom 59 → 58,7 img/s, IA 59,5 → 59,5 ; 1440×900 IA 40 → 43,9 ; render 7,4 → 5,2 ms. Partie complète en clics réels : OK, 0 erreur. Référence téléphone mise à jour (changement voulu).
- outils-communs/compare.py : colonne informative « détail fin » (taille réelle, tolérance ±1 px) — la vue réduite ne voyait pas l'agrandissement des noms (0,0 %).
