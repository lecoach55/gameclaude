# Feuille de route de l'équipe Outils

But : que chaque conversation fabrique, teste et mesure un jeu **plus vite, plus sûrement et avec moins de code recopié**. L'équipe Outils passe toutes les 4 heures (tâche programmée « Studio — atelier Outils »). Elle prend en haut de cette liste, plus les retours du terrain (`bureau/retours-outils/`), et coche ce qui est fait avec la date et le gain mesuré.

## Comment on mesure un outil
- **Temps** : `bureau.py chrono <jeu> "<étape>" -- <commande>` écrit dans `bureau/retours-outils/chronos.jsonl`. On cherche les étapes les plus longues et les plus fréquentes.
- **Fiabilité** : un outil qui échoue sans raison, ou qui sonne une fausse alerte, coûte plus cher qu'un outil lent. On compte les retours qui le concernent.
- **Réemploi** : le nombre de jeux qui utilisent la version commune plutôt qu'une copie (`bureau.py` → « À mutualiser »).
- **Non-régression** : `python3 outils-communs/tests/verifier_outils.py` doit rester au vert. Tout nouvel outil commun y ajoute son contrôle.

## À faire (priorité décroissante)
1. [ ] **Banc commun de fluidité** `outils-communs/banc.py` : en cours par le service Fluidité le 16/11 à 16 h, ne pas le doubler. Ensuite, le brancher à `verif` (point 4).
2. [ ] **`atelier.mesurer` complet** : 1 % le plus lent, filtre des pauses > 1 s, même format que `testkit.js`, pour que les bancs locaux et les mesures réelles se comparent directement.
3. [ ] **Robots communs** `outils-communs/robots/` : `singe.py` (clics et tapotements au hasard, téléphone et ordinateur, graine ; à partir de `bannieres/outils/monkey.py`) et `explorateur.py` (jeux DOM/SVG ; à partir de `couronnes-et-lignees/outils/tests/explore.py`). Chaque jeu ne garde qu'un petit fichier de réglages.
4. [ ] **`verif` commun** (modèle : `valdragon/outils/mesure/verif.py`) : une commande par jeu qui construit, lance les robots, fait les captures et la comparaison, passe le banc et le test de sauvegarde, puis écrit un rapport HTML. Le réglage de chaque jeu tient dans `<jeu>/outils/verif.json` (étapes, scènes, vues). Cible : vérifier un jeu complet en moins de 10 minutes, en une commande.
5. [ ] **Studio de captures commun** : une liste de vues en JSON (état à charger, écran, taille), capturées avec `horloge.js` (figé). ~~`compare.py` gagne une sortie JSON et un code de retour 1 en cas d'alerte~~ (fait le 16/11 : `--json`, `--strict`).
6. [ ] **`testkit.js` versionné** : un numéro de version dans le fichier. `bureau.py` détecte les copies périmées par version plutôt que par empreinte, et un script de mise à jour remplace la copie d'un jeu sans toucher au reste.
7. [ ] **Ressources partagées** : `outils-communs/vendor/three.r160.js` lu par les builds (fin des copies), cache local des textures Poly Haven / ambientCG partagé entre jeux.
8. [ ] **Rapport des chronos** : `bureau.py chronos` liste les étapes les plus lentes et les plus fréquentes de la semaine.
9. [ ] **Préparation d'un poste de travail** : `outils-communs/preparer.sh` installe en une fois Playwright, Chromium, Node et les dépendances communes, et met les ressources en cache. Gain : chaque conversation démarre plus vite.

## Fait
- 16/11 (après-midi) — `horloge.js` + `atelier.page(figer=…)`/`avancer()` : captures reproductibles. Cage & Gloire, 5 poses capturées deux fois : écart brut 18-51 % des pixels et 1 alerte `compare.py` sur 5 → 0-4 % et 0 alerte, en 20,5 s au lieu de 24 s (16 images de 162 ms). `compare.py --json/--strict`. Contrôles 6 → 8, 9 s.
- 16/11 — `bureau.py` : canal de retours (`outil`), chronométrage (`chrono`), plus de plantage quand sa sortie est coupée.
- 16/11 — `outils-communs/tests/verifier_outils.py` : 6 contrôles (testkit, sauvegarde en ligne, compare, atelier, mesure réelle dans Chromium, bureau), 5 s en tout.
- 16/11 — `testkit.js` : filtre des pauses repris de Cage & Gloire.
