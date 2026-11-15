# Outils communs à tous les jeux

À réutiliser dans chaque jeu de Victor (Valdragon, Hameau, Président de Club, etc.).

- **`testkit.js`** — à intégrer dans le jeu : bouton 🐞 « signaler un problème » (capture, état, erreurs), compteur d'images par seconde, banc de mesure scripté. Pour un jeu en scripts classiques (sans `import`), charger `<script type="module" src="testkit.js">` : la trousse est aussi exposée sur `window.Testkit` (exemple : `sedes-petri`). Pour un jeu 2D, le GPU est lu sur un canvas WebGL temporaire. Les résultats vont dans la base de l'artefact : Claude les lit avec `db_list` sur la collection `data/users/<id>` (documents `mesures_*` et `signalement_*`).
- **`atelier.py`** — fonctions Python communes : serveur local, page neuve (localStorage préparé, temps accéléré), mesure des images, captures.
- **`sauvegarde-en-ligne.js`** — sauvegarde dans la base de l'artefact pour les grosses parties (gzip + découpage en morceaux), avec reprise proposée quand un autre appareil a une partie plus récente. Utilisée par Wall Street.
- **`compare.py`** — comparaison d'images référence / nouvelle version, tolérante aux petits décalages de caméra. Signale les changements visuels involontaires. `python3 compare.py refs/ nouvelles/ planche.png`

## Règle d'or
1. Rendre le jeu **reproductible** : une graine fixe (`Math.random` remplacé) et une fonction pour se placer dans une scène donnée.
2. Mesurer avant/après (banc), capturer et comparer aux références, tester avec un parcours automatique, puis publier.
3. Le mode test ne touche jamais à la vraie sauvegarde du joueur.

Exemple complet : `valdragon/outils` et le mode test de Valdragon (bouton 🧪 sur l'écran titre).


Adaptation pour un jeu sans canvas (DOM/SVG) : voir `couronnes-et-lignees/jeu/app.js` (Testkit intégré sans `export`, `etat()` qui envoie l'écran ouvert et la sauvegarde). Testeur au doigt générique pour ce genre de jeu : `couronnes-et-lignees/outils/tests/explore.py`.

## Pièges déjà rencontrés
- **`window.claude` peut arriver après le chargement** : une sauvegarde en ligne qui teste `window.claude` au démarrage et mémorise l'échec ne sauvegarde plus jamais (Sedes Petri : aucune partie ni mesure reçue). Attendre jusqu'à 10 s, ne mémoriser que le succès, afficher l'état (« ☁ Sauvegarde en ligne : active / refusée… ») dans le menu. `testkit.js` le fait désormais (raison dans `TK.base`, renvoyée avec le banc).
- Préférer une copie de `testkit.js` sans les mots `export` chargée en `<script src>` classique : plus sûr qu'un `<script type="module">` dans le cadre isolé de l'artefact.
- Sur téléphone, vérifier que le menu reste accessible : un sélecteur CSS mal orthographié (`.icon-btn` au lieu de `.iconbtn`) cachait le menu de Wall Street depuis le début.
- Le banc ne doit jamais toucher la vraie partie : copier l'état, couper la sauvegarde (locale ET en ligne), mesurer, puis tout remettre.

## Utilisé par
- Valdragon (`valdragon/`) — exemple complet.
- Hameau 3D (`hameau/`) — testkit intégré par `build.py` (remplace `/*TESTKIT*/`), références visuelles dans `hameau/references`.
