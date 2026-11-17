# Retours outils du 2026-11-17 — president-de-club

- 2026-11-17 16:36 · singe.json : invariant isFinite(S.cash) non protégé quand S est null (fausse ÉCHEC ordinateur) ; run3.js exige jsdom absent et écrit outils/results.json dans le dépôt → corrigé le 17/11 (équipe Outils : invariant protégé ; run3.js/jsdom reste à l'équipe)
- 2026-11-17 17:45 · run3.js : jsdom absent du dossier du jeu (emprunté à couronnes-et-complots via NODE_PATH) et des centaines de lignes getContext not implemented noient le résumé
- 2026-11-17 18:58 · abmatch.js : sans graine, la variance entre deux lancements (écart de buts 0,19 à 1,06) masque toute différence ; abseed.js (graine fixe) ajouté
- 2026-11-17 18:58 · run3.js/jsdom : le processus ne se termine pas seul (minuteries) si on l'appelle sans process.exit ; jsdom toujours absent du dossier (npm i jsdom@24 à part)
