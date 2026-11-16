# Le Bureau — espace commun à toutes les conversations

Le bureau sert à coordonner les conversations qui travaillent pour Victor : qui fait quoi en ce moment, quels outils existent déjà (et lesquels sont les meilleurs), ce qui a été fait récemment, et ce qu'il faudrait mettre en commun. Chaque conversation y passe en arrivant et en repartant.

Il a deux parties :

| | Où | Pour quoi |
|---|---|---|
| **Le bureau de code** | ce dossier `bureau/` du dépôt (public) | chantiers en cours, journal, catalogue des outils, mises en commun à faire |
| **Le tableau d'affichage** | page privée « Le Bureau » (slug dans `ARTEFACT.txt`) | vue d'ensemble pour Victor sur téléphone + ses **demandes** et les **messages entre conversations**, y compris pour les projets hors jeux (romans, sagas, photos…) qui n'ont rien à faire dans un dépôt public |

## En arrivant (toute conversation sur un jeu)
1. `python3 bureau/outils/bureau.py` — état du bureau en une seconde : chantiers ouverts, derniers passages, alertes de mise en commun.
2. Lire les **demandes de Victor** et les **messages** du tableau d'affichage : `db_list` sur le slug de `ARTEFACT.txt`, collections `demandes` et `messages` (traiter celles qui concernent ton jeu ou les outils communs).
3. Ouvrir son chantier : `python3 bureau/outils/bureau.py arrivee <dossier> "ce que je viens faire"`, puis commit + push tout de suite (c'est ce qui prévient les autres conversations).
   Si un chantier est déjà ouvert sur le même jeu, une autre conversation y travaille : faire de petits commits, `git pull --rebase` avant chaque push, ne pas réécrire ses fichiers.
4. Avant d'écrire un outil, regarder `ressources.md` : il existe peut-être déjà (souvent dans un autre jeu).

## En repartant
1. Si un outil a été amélioré et sert ailleurs, le reporter dans `outils-communs/` (et dans `ressources.md`).
2. `python3 bureau/outils/bureau.py depart <dossier> "bilan chiffré en une ligne" [--outil "outil amélioré"]` — ferme le chantier et écrit le journal.
3. Régénérer et republier la page : `python3 bureau/outils/bureau.py page` puis publier `bureau/build/index.html` en `index.html` sur le slug de `ARTEFACT.txt` (publish_files, mode patch). Marquer les demandes traitées (`db_write`, champ `etat: "fait"`, `reponse`).
4. Commit + push sur `main` (message en français).

## Rendre compte à Victor
Dans la collection `messages` du tableau d'affichage (`db_write`, un document par message, id unique comme `<dossier>-<AAAAMMJJ-HHMM>`) :
`{de, pour: "victor", type, texte, quand}` avec `type` = `bilan` (fait, chiffres avant/après, reste à faire), `question` (une décision qu'il doit trancher : question fermée, options, recommandation) ou `blocage` (ce qui empêche d'avancer et ce qu'il faut de lui). La conversation de coordination les relaie à Victor.

## Conversations hors jeux
Elles n'ont pas besoin du dépôt. Elles passent par le tableau d'affichage : lire `demandes` et `messages` (`db_list`), y laisser un message si une autre conversation doit savoir quelque chose (`messages/<id>` : `{de, pour, texte, quand}`). Rien de privé (finances, textes des romans) ne va dans le dépôt : il est public.

## Règles du bureau
- Le bureau ne change jamais un jeu tout seul : il signale. Les règles de chaque jeu (équilibre, sauvegardes) dans `CLAUDE.md` restent prioritaires.
- Un fichier par chantier (`chantiers/<dossier>.md`) et un journal par jour (`journal/AAAA-MM-JJ.md`) : plusieurs conversations peuvent écrire en même temps sans conflit.
- `bureau/build/` n'est pas versionné : la page se refabrique à partir du dépôt.

## Fichiers
- `outils/bureau.py` — état, arrivée, départ, fabrication de la page.
- `ressources.md` — catalogue : quel outil pour quoi, la meilleure version, où elle est ; ressources artistiques et crédits.
- `a-mutualiser.md` — mises en commun repérées, par ordre d'intérêt.
- `chantiers/` — chantiers ouverts (un fichier = une conversation au travail).
- `journal/` — main courante (un fichier par jour et par jeu).
- `page/modele.html` — modèle de la page « Le Bureau ».
