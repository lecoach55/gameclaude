# Retours outils du 2026-11-17 — president-de-club

- 2026-11-17 16:36 · singe.json : invariant isFinite(S.cash) non protégé quand S est null (fausse ÉCHEC ordinateur) ; run3.js exige jsdom absent et écrit outils/results.json dans le dépôt → corrigé le 17/11 (équipe Outils : invariant protégé ; run3.js/jsdom reste à l'équipe)
- 2026-11-17 17:45 · run3.js : jsdom absent du dossier du jeu (emprunté à couronnes-et-complots via NODE_PATH) et des centaines de lignes getContext not implemented noient le résumé
