# Outils communs à tous les jeux

À réutiliser dans chaque jeu de Victor (Valdragon, Hameau, Président de Club, etc.).

- **`testkit.js`** — à intégrer dans le jeu : bouton 🐞 « signaler un problème » (capture, état, erreurs), compteur d'images par seconde, banc de mesure scripté. Les résultats vont dans la base de l'artefact : Claude les lit avec `db_list` sur la collection `data/users/<id>` (documents `mesures_*` et `signalement_*`).
- **`atelier.py`** — fonctions Python communes : serveur local, page neuve (localStorage préparé, temps accéléré), mesure des images, captures.
- **`compare.py`** — comparaison d'images référence / nouvelle version, tolérante aux petits décalages de caméra. Signale les changements visuels involontaires. `python3 compare.py refs/ nouvelles/ planche.png`

## Règle d'or
1. Rendre le jeu **reproductible** : une graine fixe (`Math.random` remplacé) et une fonction pour se placer dans une scène donnée.
2. Mesurer avant/après (banc), capturer et comparer aux références, tester avec un parcours automatique, puis publier.
3. Le mode test ne touche jamais à la vraie sauvegarde du joueur.

Exemple complet : `valdragon/outils` et le mode test de Valdragon (bouton 🧪 sur l'écran titre).
