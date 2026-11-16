# Une vie parmi 8 milliards

Simulateur de vie (inspiré de « 1 sur 8 milliards ») avec scène 3D façon maison de poupée (Three.js r128, intégré).
Artefact publié : slug `b04fac4d-6c5d-4942-aea6-f931c43137b7` (capacités `db` + `user` pour la trousse de test).

## Fabriquer
- Source : `jeu/index_src.html` (moteur de jeu + module 3D `W3` + trousse de test), moteur 3D dans `jeu/vendor/three.min.js`.
- `python3 jeu/build.py` → `build/index.html` (fichier unique, ~0,8 Mo) à publier (`publish_files` as index.html).

## Outils (`outils/`)
- `sh outils/sim.sh 2000 random|smart|f:Équilibre` : non-régression du moteur de jeu (harness.js). Référence au 15/11 : âge moyen ~65, score ~56.
- `python3 outils/studio.py dossier [scènes]` : captures à graine fixe (rural0, ville1, appart2, maison3, villa4, nuit, hiver, automne, canicule, deluge, froid, arbre, bilan).
- `python3 ../outils-communs/compare.py references dossier planche.png` : comparaison avec `references/`.
- `python3 outils/perf.py mesures/x.json hd|sd` : banc reproductible (img/s relatives en rendu logiciel, appels, triangles).
- `qa.py` (3 vies complètes), `mob.py` (iPhone émulé), `heir.py` (dynastie), `banc_test.py` (mode 🧪 + 🐞).

## Règles
- Ne pas changer l'équilibre du jeu sans le demander à Victor ; vérifier avec `sim.sh`.
- Mode test 🧪 (accueil) : banc SD/HD → document `mesures_*` ; 🐞 → `signalement_*` (collection `data/users/<id>`, lire avec `db_list`). Le mode test ne sauvegarde pas les vies.
- Sur téléphone : qualité SD par défaut.

## Fluidité (v16, d'après le banc 🧪 du MacBook de Victor)
- Mesure réelle (Iris Plus, 15/11/2026) : ~50 img/s en SD comme en HD, mais des à-coups (pire image 40-117 ms).
- `outils/appels.py [sd|hd] scenes` : appels de dessin par groupe (décor, personnages, effets).
- `outils/saccades.py [sd|hd] scene secondes` : images longues et ce qui change au même moment (shaders, textures).
- `outils/profil.py [sd|hd] scene secondes` : profil CPU par fonction.
- Le décor et les personnages fusionnent les matériaux unis en couleurs par sommet (`plainM`, `VCM`) : un matériau dont la couleur change en cours de partie doit être ajouté à `LIVE` (ou avoir une teinte émissive), sinon il serait figé.
- Pluie, neige, feuilles : un seul maillage instancié par nuée (`nuee`, `stepNuee`).
- Pas de `backdrop-filter` au-dessus de la 3D (très coûteux sur puce Intel et téléphone).
- Qualité automatique : si la HD tourne sous ~33 img/s et que le joueur n'a rien choisi, passage en SD une fois.

## v17 (15/11/2026 soir)
- Le 2e banc du MacBook était vide : fenêtre masquée pendant la mesure (le navigateur suspend l'affichage). Trousse de test reprise de `outils-communs/testkit.js` : attend que la page soit visible, recommence une fois, marque ⏸️ `masquee`.
- **Reprise de la vie en cours** : point de reprise à chaque choix de priorité (`checkpoint`, clé locale `vie8m_cur`, effacée à la mort) ; en ligne via `sauvegarde-en-ligne.js` (document `partie` : `{ck, save}`, méta `ckt/nom/age` ou `fin/seed`). Accueil : « ▶ Reprendre » (local) ou « ☁️ Reprendre » (autre appareil, si plus récent). Une vie finie ailleurs efface la reprise locale et ajoute la vie à l'historique. Ne jamais modifier le document `partie` à la main.
- Tests : `outils/reprise.py` (jouer, recharger, reprendre, finir), `outils/nuage_test.py` (deux appareils, base simulée), `outils/fuites.py` (mémoire sur une vie entière).
- Ombres douces sous les personnages et animaux en SD ; shaders des bulles précompilés ; plus d'allocations à chaque image (caméra, bulles, couleur d'humeur).
- Événements nationaux : au moins 12 ans entre deux occurrences du même événement, et « De nouveau. » quand il revient (âge moyen 65,0, score 55,8 sur 3 000 vies : inchangé).
- Messages (toasts) en haut de l'écran pour ne plus cacher les choix.

## v18 (16/11/2026)
- Scène : ombres de contact sous le mobilier (une seule maille fusionnée, texture `soft`, rien sous les objets < 0,15 m²), chapeau des murs foncé (lecture façon Sims), rebond de lumière chaud (`hemiL.groundColor`), lampe intérieure faible le jour, dalles chaudes dans la villa, herbe moins saturée (−15 %), torse arrondi (`TORSO`, LatheGeometry). Boutons de la scène 40 px. Un enfant ne reçoit plus le prénom du joueur, du partenaire ou d'un frère/sœur.
- Coût (A/B entrelacé, rendu logiciel) : −2,5 % d'img/s en SD, +1 à +6 appels, aucun shader nouveau. Si le banc réel du MacBook passe sous ~45 img/s en HD, regarder d'abord la maille d'ombres (`cshad`).
- Outils : `outils/gros_plan.py dossier scenes zoom` (caméra rapprochée via `W3._cam`) ; `VIES=f.json CH=1 sh outils/sim.sh 4000 random > s.txt` puis `python3 outils/rapport_vies.py f.json s.txt` : rapport « vies trop semblables / déséquilibrées » (ressemblance, profils, événements systématiques, écarts par pays/richesse/traits, jauges saturées, choix à fort écart). Rapport du jour : `mesures/rapport_vies_20261116.md`.
- Questions à Victor (équilibre, non modifié) : mariage arrangé (accepter +4,9 pts / refuser −4,8) ; priorité « Viser une promotion » parmi les moins payantes (58,6 contre 62,5 pour « Équilibre »).
