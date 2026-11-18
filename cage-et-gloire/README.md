# Cage & Gloire

Jeu de management de combattants de MMA. On dirige une écurie, on entraîne ses combattants, on accepte des combats et on les fait monter de ligue. Les combats se regardent en 3D (ou en résultat immédiat), avec des consignes entre les rounds.
Une seule page, jouable hors ligne : `build/` (non versionné) ← `python3 jeu/build.py sortie.html`.
Artefact : slug `a54aba6d-7add-42e6-8212-9468f69ceee4` (capacités db + user). Publier la page construite en `index.html` (publish_files).

## Le jeu
- 5 organisations fictives, de la plus modeste à la plus prestigieuse : CFR (régional) → HEX (France) → ECC (Europe) → GLADIUS (monde, n°2) → APEX (sommet). 8 catégories (6 hommes, 2 femmes), environ 450 combattants actifs, champions et classements (Elo).
- Montées : offres de contrat quand un combattant est champion, dans le top 3 avec une série, ou trop fort pour sa ligue. Descentes : libéré après trop de défaites. Les combattants de l'IA montent, descendent, progressent, vieillissent et prennent leur retraite.
- Économie : 25 % de commission sur les bourses, cotisations des adhérents (la réputation les attire), loyer, staff (5 postes, 3 niveaux), 5 niveaux de salle, recrutement d'agents libres.
- Entraînement : programme (6 choix) et intensité ; fatigue, forme, moral, blessures.
- Événements aléatoires (`EVENTS` dans moteur.js) : sponsors, combat au pied levé dans la ligue du dessus, jeune talent, conférence de presse, rachat, documentaire…
- Combat : moteur par tranches de 15 s (debout, clinch, sol), 5 plans de combat, cartes des juges, stats. Chances estimées sur 140 combats simulés.

## Systèmes ajoutés (nuit du 15 au 16/11/2026)
- **Traits** (18, `TRAITS` dans data.js) : 13 agissent en combat (menton de fer, cardio de machine, diesel, explosif, gaucher, contreur, finisseur…), 5 hors combat (showman, bosseur, fragile, leader, tête brûlée). Effet mesuré par `outils/traits.js` : 46 à 58 % de victoires contre un jumeau sans trait.
- **Camp d'entraînement** (`CAMP`) : étude vidéo, sparrings, stage à l'étranger (+1,2 à +2 à toutes les qualités le jour du combat).
- **Négociation** des bourses et des contrats (+15 % / +35 %, chance affichée, l'offre peut être retirée).
- **Contrats de management** (`f.mg`) : commission par combattant, renégociée à l'échéance (le combattant peut partir).
- **Rivalités et revanches** (bourse ×1,3), **changement de catégorie**, **blessures nommées** et choix d'opérer.
- **Grand Prix** annuel à huit (ECC/GLADIUS, semaine 8), **Top 15 toutes catégories**, **prix de fin d'année**, **temple de la renommée**, **lignée des champions**, **20 succès**, **objectifs de saison** avec primes, **bilan annuel**.
- **Sponsors** sous contrat, **recruteur** (précision du potentiel), **attaché de presse**, **gala organisé par l'écurie**, agents libres venus des grandes ligues, entraînement confié au staff (🤖), difficulté (3 niveaux), 21 événements aléatoires + 4 spéciaux.
- **Combat** : avis du staff (5 plans simulés), rapport sur l'adversaire, sous-carte, présentation des combattants sous projecteur, coins et soigneurs entre les rounds, marques de coups et sueur, ralenti des KO, foule animée, sons synthétisés (son.js), frappes par round.
- Sauvegarde locale compressée (gzip, clé `cage-gloire-v1z` ; l'ancienne `cage-gloire-v1` est encore lue).

## Code (`jeu/`)
`data.js` (organisations, catégories, styles, noms par pays — noms de vrais combattants retirés) · `combat.js` (moteur de combat, déterministe avec graine) · `moteur.js` (monde, calendrier, classements, mercato mensuel, économie, événements) — ces 3 fichiers tournent sous Node.
`arene.js` (Three.js r160 : octogone, grillage, foule instanciée, portique, flashs ; combattants = mannequin Xbot recoloré par régions peau/short/gants/cheveux via les poids des os ; poses par directions d'os, adaptées de `valdragon/jeu/mxanim.js`) · `portraits.js` (portraits SVG générés) · `ui.js` · `style.css` · `testkit.js` · `nuage.js`.
`xbot.glb` : Xbot (exemple Mixamo de three.js), animations retirées, compressé meshopt et simplifié à 45 % (11 294 sommets) : `node outils/prep_xbot.mjs 0.45 jeu/xbot.glb`.
Construction : `npm i` à la racine du dossier (three 0.160, esbuild, @fontsource bebas-neue + inter), puis `python3 jeu/build.py sortie.html` (polices et modèle intégrés en base64, ≈ 1,9 Mio).

## Outils (`outils/`)
- `calib_combat.js` : taux d'issues et avantage du favori. Repère 15/11/2026 (3 rounds) : ≈ 52 % décisions, 20-25 % KO/TKO, 21 % soumissions ; favori à 5 points d'écart ≈ 75 %. Identique quel que soit le niveau.
- `sim_monde.js N ans [bon|passif]` : parties automatiques. Repère : 0 erreur, organisations pleines, APEX atteint en 4 à 6 ans, 2 à 6 ceintures en 6 ans.
- `parcours.py page dossier [l h]` : partie au doigt (accueil, onglets, offre, combat 3D jusqu'au bout avec le coin, résultat, fiche). Lent sous swiftshader (≈ 4 min).
- `studio.py page dossier [poses]` : une capture par pose de l'arène. `bureau.py` : captures 1280×800.
- Poses de l'arène sur le studio commun : `python3 outils-communs/captures.py cage-et-gloire/outils/vues.json /tmp/cg --avant HEAD --construire` (21 poses, ≈ 4 min ; les anciennes références de studio.py ont un autre cadrage).
- `traits.js` (effet des traits), `evtest.js` (chaque événement et chaque choix), `vues.py page dossier semaines` (tous les écrans après N semaines de robot), `combat3d.py` (présentation, coin, ralenti d'un KO, résultat), `sauvegarde.py` (sauvegarde compressée → rechargement identique).
- Références : `references/`.

## Règles
- Ne pas changer l'équilibre (combat, progression, économie) sans relancer `calib_combat.js` et `sim_monde.js` et sans l'accord de Victor.
- Sauvegarde locale `cage-gloire-v1` + document en ligne `partie` : ne jamais les modifier. Tout nouveau champ doit être complété dans `completer()` (ui.js) pour les anciennes parties.
- Mesures réelles : ☰ → 🧪 Mesurer la fluidité → `mesures_*` ; ☰ → 🐞 → `signalement_*` (`db_whoami` + `db_list` sur `data/users/<id>`).
- Qualité 3D allégée (sans ombres ni antialiasing) dans ☰ pour les machines faibles.

## Fluidité (v8)
- Trois qualités (☰ → ⚙️ Qualité 3D, clé `cg-qual`) : Basse (pas d'antialiasing, résolution 0,75), Moyenne par défaut (résolution 1, ombres « taches »), Haute (ombres réelles, cônes de lumière, résolution 1,5).
- Résolution adaptative (clé `cg-rs`) en Basse/Moyenne : baisse si l'image dépasse ~40 ms, remonte sinon (plancher 0,5).
- Décor fusionné par matériau (cage, gradins, lampes), public en un seul InstancedMesh animé par shader, étincelles en un seul Points : ~22-24 appels de dessin au lieu de 83-99.
- Banc : `PX=1 python3 outils/perf.py build/index.html mesures/perf_v8.json 1` (771x755@2, scènes large/échanges/sol, résolution figée par `A.fixer`).
- « ⚡ Temps forts » pendant les combats : saute les échanges sans touche.

## Complexe, académie et records (v9)
- Quand la salle est au niveau 5, l'onglet Salle propose quatre bâtiments (`CPX` dans moteur.js, `G.cpx`) : centre de récupération (−3 fatigue/sem.), studio média (popularité, sponsors +15 %), académie des jeunes (2 espoirs 18-20 ans tous les 6 mois, `f.academie`), arène de l'écurie (galas +50 %, réputation). Prix 0,9 à 4 M€, entretien hebdomadaire. Succès « Bâtisseur » et « Made in académie ».
- Ligues → Records : bilan de l'écurie et records (série, KO et soumission les plus rapides, ceintures…) sur les combattants actuels et anciens (`f.anc`).
- Précompilation des shaders en fin de `Arene.preparer` (évite un gel au premier coup sur Mac). Le banc 🧪 écarte les pauses > 1 s (fenêtre cachée) et les signale (`pauses`, `pauseMax`).

## Arène réaliste (v10)
- Textures Poly Haven (CC0) dans `jeu/tex/` (préparées par `outils/prep_tex.py`), intégrées en base64 par `build.py` (`<script type="text/plain" id="tex-NOM">`, lues par `texImg()` dans arene.js). Ne pas oublier de les versionner.
- Pas de carte d'environnement (PMREM) : trop chère sur Mac Intel/téléphone. Relief du tapis seulement en Haute.

## Combattants crédibles (v11)
- Le mannequin Xbot reste le squelette, mais sa matière est entièrement refaite dans le shader (`matPerso`, `GLSL_COULEUR` dans arene.js) à partir d'une position de repos commune aux deux maillages (attribut `bp` : x gauche, y hauteur 0-1, z avant, calculé dans `regions()`), plus deux bruits précalculés par sommet (`nzv`).
- Short MMA (plis, ceinture sombre à liseré, bande latérale, ourlet ; couleur d'accent `uAcc` claire ou foncée selon le short), gants ouverts (bandages blancs au poignet, sangle à scratch, coussin des phalanges, doigts nus), coupes de cheveux selon `app.chev` (0 rasé, 1 tondeuse, 3 crête, autres courts), barbe en poils courts, visage (arcades, sourcils, nez, bouche), musculature en relief (abdominaux, pectoraux, dos ; hommes torse nu seulement). Le « ballon » du bassin du mannequin est aplati au chargement.
- **Trois variantes de shader selon la distance à la caméra** (`proches()`, chaque image) : gros plan < 2,9 m (+ visage), proche < 4,3 m (relief, muscles, détails des matières), loin (couleurs seules, même coût qu'avant). Les trois sont précompilées dans `Arene.preparer`. Basse : jamais de détail.
- Coins : seau, bouteille, serviette et poche de glace (un seul objet). Flashs du public et étincelles : sprites ronds (plus de carrés), cadence en nombre par seconde (≈ 3/s au calme, ≈ 45/s après un gros coup) indépendante des img/s.
- `outils/studio.py` : horloge figée (`outils-communs/horloge.js`), poses `portrait0`, `portrait1`, `coin` en plus.

## Nouvelles mécaniques (v12, 18/11/2026, demande de Victor : « complexifier »)
- **Le moral compte le soir du combat** (combattants du joueur seulement) : `bonusMoral` de −2 (moral ≤ 30) à +2 (100), neutre à 70. `bonusJour(c)` = camp + moral + semaine du combat, `bonusAdv(c)` = adversaire piqué ; appliqués dans `preparerSim` et `cote()` (try/finally). calib_combat inchangé (favori 75 %).
- **Semaine du combat** (`SPECIAUX.semaine`, `c.sdc`) : une fenêtre par semaine, pour le plus gros combat de la semaine suivante. Faire le show (popularité +5, fixe +10 %, adversaire +0,3) / Rester concentré (moral +8, relation +3) / Couper le poids (+0,9 ; 25 % de rater : −0,8, amende 20 %, moral −10, relation −8). Écarts mesurés (opt.js du studio, 181 combats) : show −0,9 pt, concentré +1,7, couper +1,3 en espérance.
- **Effet affiché sous chaque choix** (champ `e` des choix d'EVENTS/SPECIAUX, rendu dans `popup()`).
- **Coûts** : `prixN` (×1 → ×3 avec la salle), camp `prixC` (×1 → ×2), allocations selon l'organisation (`ALLOC_T` : 60 € CFR → 840 € APEX par semaine). Choix sans argent : fatigue, risque de blessure, **relation avec l'organisation** (`G.orgs[o].rel`, sous 60 : bourses jusqu'à −20 %, `relF`), moral d'un coéquipier.
- **Écurie rivale** `G.rival` (créée dans `nouvellePartie`, ou par `completer()` pour les anciennes parties) : `majRival` toutes les 4 semaines place un de ses combattants dans chaque organisation/catégorie où vous êtes ; 40 % des offres contre elle quand c'est possible (pas le même adversaire dans les 26 semaines, pas de prime ×1,3) ; `bilanRival`, événement `rival_espoir`, rachat signé ; carte sur l'écran Écurie, badges.
- **Orientation du camp** (`ORI`, `c.ori`, `f.bonusAt` lu par `eff()` de combat.js) : Frappe / Lutte et sol / Cardio / Récupération, gratuit, un seul choix.
- Outils : `outils/anciennes.py ancienne.html nouvelle.html` (ancienne sauvegarde reprise par la nouvelle page), `CAMP=10 node outils/sim_monde.js` (robot qui achète le camp), audit vérifie écurie rivale et relations.

## Outils de chasse aux bugs
- `node outils/audit.js 4 12` : 4 parties de 12 ans avec un joueur au hasard ; vérifie NaN, bornes, combats en double, ceintures vacantes, champions partis, offres orphelines, taille de la sauvegarde.
- `python3 outils/monkey.py build/index.html dossier 900 390 844 1` : robot qui clique au hasard (vrais clics) ; rapporte erreurs JS, écrans bloquants, boutons les plus cliqués.
- **Tout vérifier en une commande** : `python3 outils-communs/verif.py cage-et-gloire/outils/verif.json` (calib, evtest, audit, sauvegarde, combat 3D, singe, poids ; `--complet` ajoute parcours + banc avant/après) → `/tmp/verif-cage-et-gloire/rapport.html`.

## Nouveau personnage (décision de Victor du 17/11, en cours)
- But : remplacer Xbot par un personnage Mixamo à peau continue (même squelette mixamorig, mêmes poses), short et tête séparés, +1 à 2 Mo, crédit Mixamo.
- `node outils/prep_perso.mjs source.glb [sommets=12000] [sortie=jeu/perso.glb]` : retire animations, textures et UV, vérifie les 20 os utilisés par les poses, simplifie, compresse (meshopt). Un FBX Mixamo se convertit d'abord en GLB avec `valdragon/outils/ressources/mxbuild.py`.
- Le site Mixamo (compte Adobe) n'est pas joignable depuis les conversations : le fichier source doit être fourni (dossier `cage-et-gloire/dl/`).
- Ensuite : `regions()` d'arene.js à refaire pour ce maillage (pas de « Joints », positions de repos `bp` recalculées), puis captures + banc.

## Lumière, foule et cadrage (18/11/2026 soir, demandes art-cage-et-gloire-1 et -2)
- Tapis : dégradé peint dans la texture (centre ≈ 85 % de luminance à l'écran, pied du grillage ≈ 60 %) + traînées d'usure au pied de la cage ; tablier hors de la cage en vinyle presque noir à peine teinté par l'organisation (plus de bande verte saturée) ; logo à 55 % dans le grain de la toile ; rembourrages des poteaux en vinyle noir à un seul liseré ; bord de la plateforme moins lumineux. Projecteur principal 33° → 30° (aucune lumière en plus).
- Foule : émissif faible (0,3 × texture × couleur de chaque spectateur, dans le shader) : les premiers rangs se lisent en silhouettes au lieu d'un mur noir.
- Cadrage : champ 44° → 32° à l'ordinateur, 62° → 50° au téléphone, caméras plus loin (`cfg` de `majCam`, jamais au-delà de 7,9 m du centre = jamais dans les gradins) ; présentation en plan poitrine ; arbitre placé derrière les combattants par rapport à l'axe visé par la caméra (`arbitreSuit`, ±0,6 rad) ; shorts affichés à −30 % de saturation (les données ne changent pas).
- Mesure : `python3 outils-communs/captures.py cage-et-gloire/outils/vues_arene.json /tmp/cga --avant HEAD --construire` (ordinateur 1280×800 + téléphone, vues enchaînées dans la même page ; `infos` = `Arene.cadre()` : hauteur de chaque combattant et de l'arbitre en % de l'image).

## Combattant CC0 MakeHuman (à l'essai, 18/11 soir, décision dec1118-cage)
- Ressource : MakeHuman 1.x, assets **CC0 1.0** (LICENSE.md section C du dépôt makehumancommunity/makehuman, en-tête CC0 de chaque cible). Lisible depuis l'atelier par raw.githubusercontent.com.
- `python3 -I outils/mh_dl.py /tmp/mh` (base.obj, default.mhskel, default_weights.mhw, cibles homme/femme/muscle) puis `python3 -I outils/prep_mh.py /tmp/mh /tmp/mh_brut.glb homme 1.0` et `node outils/prep_perso.mjs /tmp/mh_brut.glb 11000 jeu/perso_mh.glb` (158 Kio, 11 000 sommets, 27 os mixamorig, pose en T, cou/tête alignés sur Xbot, bassin à x = z = 0, 1,80 m).
- `build.py` l'intègre s'il existe (+212 Kio de page) ; il ne remplace Xbot qu'avec `?perso=mh` ou `localStorage cg-perso=mh`. Pour ce corps (`PERSO_MH`, define `CG_MH`), visage et muscles ne sont plus peints (sculptés dans le maillage) ; le « ballon » du bassin n'est pas aplati.
