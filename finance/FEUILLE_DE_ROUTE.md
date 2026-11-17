# Feuille de route des outils du bureau d'analyse

Règle demandée par Victor : **à chaque analyse, repartir avec un outil de plus, ou un outil plus fin.** Une analyse qui n'ajoute rien ici n'a fait que se répéter.

Procédure en fin de séance, dans cet ordre :
1. mettre à jour `outils/theses.json` (champ `maj`, `suivre`, statut des surveillances) ;
2. enregistrer les faits marquants : `veille.py alerte …` ;
3. construire ou affiner **un** outil de la liste ci-dessous, en commençant par le haut ;
4. ajouter le contrôle correspondant dans `outils/tests/verifier_finance.py` et le passer au vert ;
5. cocher la ligne avec la date et ce que l'outil apporte ;
6. `git pull --rebase` puis commit/push.

Un outil n'entre ici que s'il répond à une question qui est revenue au moins deux fois.

## Fait

- [x] **17/11/2026** — `portefeuille.py` : poids, écarts, répartition d'un versement à l'euro juste, parts entières du PEA. Supprime le risque d'erreur d'arithmétique dans le plan mensuel. Validé contre le plan du 15/11 (1 € d'écart).
- [x] **17/11/2026** — `veille.py` + `theses.json` : checklist de veille par ligne avec critères de rupture, et journal des faits pour ne pas resignaler deux fois la même chose.
- [x] **17/11/2026** — `tests/verifier_finance.py` : 19 contrôles.
- [x] **17/11/2026** — `cibles.json` + `portefeuille.py socle` + seuil de 2 points, après l'audit qui a suivi le portefeuille à +0 (voir `CORRECTIONS.md`). Source unique de vérité pour les règles d'allocation : plus aucun chiffre recopié dans le texte des tâches programmées. `socle` donne le seul indicateur qui dit si la correction avance (23 % au 17/11, objectif 50 %).

## À faire, dans cet ordre

- [ ] **Étalon de mesure** (`outils/etalon.py` + `journal/etalon.jsonl`) — relever à chaque point du dimanche la performance du portefeuille et celle du MSCI World en euros, en indice base 100, et sortir l'écart. Priorité haute : c'est la correction n° 4 de `CORRECTIONS.md`, et elle n'est pour l'instant qu'une consigne, pas un outil. Aucun montant dans le journal, seulement des indices.
- [ ] **Calendrier des dividendes** (`outils/dividendes.py`) — dates de détachement et de versement par ligne, montant par action, rendement sur prix de revient. Répond à « quels sont les prochains dividendes que je vais toucher ? », question posée au moins quatre fois.
- [ ] **Projection avec réinvestissement** (`outils/projection.py`) — un seul moteur paramétré (versement mensuel, horizon, croissance du cours, rendement du dividende et sa croissance, DRIP) remplaçant les scripts de simulation jetables réécrits à chaque fois. Doit sortir un tableau par année et vérifier que la trajectoire est cohérente d'un horizon à l'autre.
- [ ] **Relevé depuis une capture d'écran** (`outils/releve.py`) — transformer la liste des lignes et valorisations lues sur la capture en fichier d'entrée valide, avec contrôle que la somme correspond bien au total affiché. Supprime l'étape de recopie à la main, là où les erreurs se sont produites.
- [ ] **Historique du portefeuille** (`journal/valorisations.md`, anonymisé en indice base 100) — suivre la progression sans écrire de montants, pour répondre à « quand est-ce que je passe tel palier ? » autrement qu'à l'estime.
- [ ] **Fiscalité PEA / CTO** (`outils/fiscalite.py`) — comparer le net après impôt d'un même versement selon l'enveloppe (PEA : 17,2 % de prélèvements sociaux après 5 ans ; CTO : flat tax 30 %), et chiffrer le coût d'un arbitrage avec vente.
- [ ] **Suivi des surveillances** (dans `veille.py`) — pour le luxe européen, enregistrer à chaque passage l'état des révisions d'objectifs des analystes, afin de détecter le retournement sur la série et non sur une impression.
- [ ] **Contrôle de cohérence des thèses** — un contrôle qui signale toute ligne dont `theses.json` n'a pas été mis à jour depuis plus de trois mois.
