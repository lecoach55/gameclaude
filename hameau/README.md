# Hameau 3D — city builder organique

On peint des zones (habitat, champs, forêt, carrière, marché, atelier, pêche, chapelle) ; les villageois construisent et vivent seuls. Three.js r160, une seule page, jouable sur téléphone.

- **Artefact publié** : slug `c5adfecd-00f3-46b2-bf27-710271ef3626` (capacités `db` + `user`). Identifiant de Victor dans la base : `u_RHYp_3LmqE_4DeHduCOMVg`.
- **Construire** : `python3 hameau/jeu/build.py /tmp/hameau.html` (intègre sim.js, models.json, `outils-communs/testkit.js` et la partie de test), puis publier ce fichier en `index.html`.
- **Sauvegarde** : localStorage (`hameau3d_save_v3`) + copie en ligne toutes les 30 s dans le document `partie` de `data/users/<id>` (reprise auto sur l'autre appareil si plus récente). Ne jamais modifier ce document.
- **Mesures réelles** : écran titre → 🧪 Mode test (partie à part, jamais sauvegardée) → banc de 7 scènes + « village jour » en Moyenne et en Éco (depuis le 16/11 ; le document porte aussi `etat` : qualité du banc, densité de pixels `pr`, nombre de programmes). Menu pause → 🐞 Signaler. Lire avec `db_list` sur `data/users/<id>` : documents `mesures_*`, `signalement_*`.
- **Qualités** : Ultra, Haute, Moyenne (16/11 : sans halo lumineux ni reflets, ombres 1024, résolution 1×, herbe 2 touffes/case), Éco (sans post-traitement). Réglage automatique continu : tant que le joueur n'a pas cliqué sur une qualité (`hameau_q_choix`), le jeu descend d'un cran s'il reste sous ~22 img/s pendant 6 s. Les robots (navigator.webdriver) gardent la qualité demandée.

## Mécaniques (sim.js, réglages dans DEFAULTS)
Zones peintes (habitat, champs, forêt, carrière, marché, atelier, pêche, chapelle, pâturage) ; saisons (rien ne pousse en hiver, chauffage ×2) ; bonheur → immigration ; maisons bois → pierre (marché + outils) → maître (chapelle + repas variés) ; fête des moissons.
Depuis le 15/11 (soir) : générations (`gens`, âges, naissances, enfants, anciens, décès), élevage (`pasture`, moutons, laine, vêtements à l'atelier, « bien vêtus »), marchand ambulant (`merchant`, échanges au marché), fertilité et jachère (`fert`). Chaque mécanique se coupe par son réglage (utile pour les comparaisons).
Depuis le 16/11 (décision de Victor) : **deux variantes d'arrivées, tirées à la graine de la carte** (`arrivees:'graine'`, une partie sur deux environ ; forçables par `arrivees:'etale'|'vague'`). « Étalée » : les familles arrivent avec des âges variés (16-50 ans) et 15 % d'enfants, les fondateurs ont 18-48 ans → pas de vague de décès. « Vague » : arrivées comme avant (jeunes adultes) ; quand les décès de l'année dépassent nettement les naissances (`S.vague`), un jalon puis le conseil l'annoncent (« les anciens s'éteignent… il faut du renouveau », même code de conseil donc même action proposée). La variante est enregistrée (`arr`) ; une ancienne sauvegarde sans ce champ reste en « vague » et évolue exactement comme avant (`outils/simulation/variantes_test.js`).

## Jeu (`jeu/`)
`game.html` (rendu + interface), `sim.js` (simulation sans DOM, utilisable sous Node), `bot.js`, `models.json` (modèles cuits par l'Atelier), `test_save.json` (village de 134 habitants pour les tests), `build.py`.

## Outils (`outils/`)
- `simulation/` : `nuit.js --batch=N --minutes=M` (parties automatiques, 5 profils de joueurs : expert, novice, passif, gourmand, chaotique ; batch 1 = 50 j, 2 = 100 j, 7 = comparaison), `nuit_day.js --variant=X --seeds=… --days=… --prof=…` (variantes de réglages sur graines appariées, table `VAR`), `analyse.js` (rapport), `perf.js` (ms par jour de simulation). Résultats dans `mesures/` (ou `SORTIE=`).
- `atelier/` : modeleur procédural (`kit.mjs`, `models.mjs`) → `node bake.mjs` régénère `jeu/models.json`.
- `captures/` : `t14.py '[[nom,x,z,dist,temps,outil],…]'` (vues fixes ; `JEU=`, `CAPT=`), `references.sh dossier` (6 vues de référence), `terr.py` (erreurs console), `perfweb2.py` (triangles, coûts), `studio.py` (bâtiments isolés), `shotv.py` (villageois), `banc.py` (lance le mode test), `tuto2.py`, `ui3.py`, `title.py`.
- `simulation/nuit.js --batch=8 --days=160` : parties longues, 5 profils tour à tour. `nuit_day.js` affiche aussi `pic` et `creux` (population mini après le jour 60).
- `mesure/saccades.py` (programmes compilés et pire image par scène du banc, enchaînées comme sur l'appareil) et `mesure/profil_scene.py scène` (profil JS du passage à une scène) — en rendu logiciel, seuls les comptes (programmes, appels) sont fiables, pas les img/s.
- `simulation/nuit_day.js --variant='{"arrivees":"etale"}'` accepte aussi des réglages en JSON ; la sortie donne décès, naissances, arrivées, `maxDeaths10` (pire 10 jours), `vagueDays` ; `--serie` ajoute la courbe par 10 jours.
- `simulation/apparie.sh ancien/ nouveau/ [jours] [graines]` : simulations appariées (mêmes graines, 5 profils) entre deux versions de `sim.js` + `bot.js` → tableau population / famine / froid / départs / bonheur. À lancer avant toute publication qui touche la simulation.
- `captures/nouveautes.py [temps]` : vues du troupeau, de la roulotte du marchand, des fiches (marché avec échanges, enfant, ancien, champ). `SEUL=chariot,marchand` pour n'en prendre que certaines.
- Comparaison visuelle : `python3 outils-communs/compare.py hameau/references /tmp/cap planche.png` (la vue « large » varie un peu à cause des ombres de nuages).

## Règles propres au jeu
- N'intégrer un changement de mécanique que s'il améliore les simulations appariées (mêmes graines avant/après) ; garder l'équilibre actuel sauf demande de Victor.
- Victor veut : beaucoup de progrès graphiques à chaque passe, un monde « moins carré », un jeu fluide sur téléphone (≈0,83 M triangles en Haute au 13/11/2026), un rendu professionnel.
- Historique détaillé des passes : `journal.md` ; pistes de recherche : `recherche.md`.
