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
