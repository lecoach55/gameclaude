# Couronnes & Lignées

Simulation dynastique médiévale (1200-1350) jouable sur téléphone : une page HTML autonome, sans dépendance réseau.
Artefact publié : slug `c14b9bc8-e782-45aa-b06c-06126bd542d0` (https://claude.ai/artifact/QsQ6KxtVqUT37NrhE9pfqZ).

## Code (`jeu/`)
- `engine.js` : moteur déterministe (graine dans l'état), événements, carte, conseil, maisons voisines, tactiques, régence…
- `sim.js` : bots (hasard, attentif « heur », stratège) et simulateur.
- `app.js` : interface (plateau, cour, lignée, chronique, labo), sons, IA « chronique libre », trousse de test (testkit), sauvegarde en ligne.
- `art.js` : blasons, portraits, icônes en SVG procédural. `ui2.html` : gabarit + CSS. `fonts.css` : polices intégrées.
- Construire : `cd jeu && python3 build.py` → `index.html` (≈ 560 Ko), à publier tel quel.

## Outils (`outils/`)
- `tests/analyze.js N heur` : répétition des actions, événements, **choix dominants** (> 95 %). `JEU=jeu node outils/tests/analyze.js 300 heur`
- `tests/misstype.js N` : réussite des mandements par type.
- `tests/pass1test.py index.html` : partie complète dans le navigateur + anciennes sauvegardes (`tests/anciennes/engine_v10/13/14.js`).
- `tests/mock.py index.html` : mode « chronique libre » avec une IA simulée.
- `tests/explore.py index.html minutes graine` : testeur au doigt (vrais boutons au hasard) : erreurs, blocages, couverture.
- `mesure/captures.py index.html dossier` : 15 vues fixes (graine 1234, mouvement réduit), puis
  `python3 ../outils-communs/compare.py references dossier planche.png` pour repérer tout changement visuel.
- `mesure/review.py index.html [rm]` : revue écran par écran + temps de rendu.

## Mesures (`mesures/`)
Référence 15/11/2026 : bot attentif 74,5 % de victoires sur 1000 parties, hasard 0,3 % ; banc navigateur et explorateur sans erreur.

## Règles
- Équilibre visé : bot attentif 72-80 %, hasard < 2 %. Vérifier avec `sim.js` avant de publier ; ne pas changer la difficulté sans l'accord de Victor.
- Le mode test (🧪 sur l'écran titre) joue une partie à part (graine 1234) et n'écrit jamais dans la sauvegarde `cl_save4`.
- Anciennes sauvegardes : `load()` dans app.js les migre ; toujours tester avec `pass1test.py`.
- Mesures et signalements réels : boutons 🧪 ▶ Banc et ☰ → 🐞. Ils vont dans la base de l'artefact (`data/users/<id>`, documents `mesures_*`, `signalement_*`) une fois la capacité `db` déclarée ; sinon dans le stockage local de l'appareil.
