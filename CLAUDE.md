# gameclaude — consignes pour Claude

Dépôt de Victor (lecoach55) : ses jeux créés avec Claude et les outils de fabrication, partagés entre conversations.
Réponds à Victor en français. Il joue surtout sur téléphone et sur un MacBook Pro Intel (puce graphique modeste).

## Outils communs (`outils-communs/`)
`testkit.js` (🐞 signalement, compteur d'img/s, banc, envoi en base), `atelier.py` (serveur, pages, mesures, captures), `compare.py`. À intégrer dans chaque nouveau jeu.

## Couronnes & Lignées (`couronnes-et-lignees/`)
Simulation dynastique médiévale en une page HTML (SVG, sans dépendance). Artefact : slug `c14b9bc8-e782-45aa-b06c-06126bd542d0`.
- Construire : `cd couronnes-et-lignees/jeu && python3 build.py`, publier `index.html`.
- Équilibre : bot attentif 72-80 % (`node -e "require('./sim.js').run('heur',1000)"`), aucun choix > 95 % (`outils/tests/analyze.js`). Ne pas changer la difficulté sans accord.
- Avant publication : `outils/tests/pass1test.py` (partie + anciennes sauvegardes), `mock.py` (IA), `explore.py` (au doigt), `mesure/captures.py` + `outils-communs/compare.py` contre `references/`.
- Voir `couronnes-et-lignees/README.md`.

## Valdragon — Les Héritiers du Puits (`valdragon/`)
RPG 3D au tour par tour (Three.js r160). Artefact publié : slug `6899e11c-5894-4f5e-8850-c3f0adb308f6`.
- Ne JAMAIS changer la difficulté des combats ni le système de respawn (Victor les aime). Vérifier avec `sim.js` + `analyze.js`.
- La sauvegarde est dans le cloud de l'artefact (cloud.js, capacités db + user) : ne pas casser ce chemin.
- Page publiée < 16 Mio. Construire avec `python3 build.py inline` (moteur intégré, aucune dépendance réseau) puis publier `valdragon3d.html`.
- Crédits obligatoires : dragon « Drago » d'Oscar Creativo (CC BY 4.0), Mixamo, Poly Haven (CC0), KayKit et Quaternius (CC0).

### Démarrer
`sh valdragon/outils/preparer.sh /home/claude/t3d` puis `cd /home/claude/t3d && sh srv.sh`.

### Outils (dans `valdragon/outils/`)
- `mesure/studio.py <vues>` : captures de vues fixes (explo0-3, battle0-3, boss0-3, title, portraits, audit…).
- `mesure/perf.py sortie.json 1,2 [filtre]` : banc reproductible (graine fixe) : ms/image, appels, triangles, shaders. `SHALL=1` = ombres à chaque image.
- `mesure/bprof.py` : coût de chaque catégorie d'objets en combat.
- `mesure/captures.py dossier [niveau]` + `mesure/compare.py references/normale dossier planche.png` : comparaison d'images avec les références (`valdragon/references/normale`). À lancer après chaque modification visuelle ; une alerte = changement visuel à vérifier ou à assumer (puis mettre à jour les références).
- `mesure/pieds_capture.py` + `pieds_analyse.py` : glissement et contact au sol des pieds.
- `tests/explore.py minutes 1,5,9,13` + `agent2.js` : testeur exhaustif (vrai joystick, toutes les cases, objets, marchand, menus, compétences, boss).
- `tests/scen.py`, `tests/sauvegarde.py`, `tests/hors_ligne.py`, `tests/bot.py`, `tests/sim.js` + `analyze.js`.
- `ressources/` : simplification de modèles (simp_kit.mjs), textures Poly Haven (ph_tex.py, rockfix.py), conversion FBX 6.1 Mixamo (fbx61.py).
- `../mesures/` : résultats du banc (référence 13/11/2026 : perf_base.json).

### Mesures réelles sur les appareils de Victor
Dans le jeu : bouton 🧪 « Mode test » (écran titre, partie séparée) → ▶ Banc ; bouton 🐞 (partie normale) pour les signalements.
Lire avec `db_list` (slug du jeu, collection `data/users/<id>`, id donné par `db_whoami`) : documents `mesures_*` (img/s par scène et qualité, GPU) et `signalement_*` (capture, état, erreurs). Ne jamais modifier le document `partie` (sa sauvegarde).

### Méthode qui marche
Mesurer avant/après chaque changement (perf.py), vérifier visuellement (captures), tester (explore + scen + sauvegarde + hors ligne), puis publier et envoyer un bilan chiffré en français.

## Sedes Petri — Le Trône de Pierre (`sedes-petri/`)
Jeu de gestion (on incarne le pape, 1073-1517). Artefact : slug `e403381b-4eb6-4956-af79-666fc1dc0712`, publié tel quel depuis `sedes-petri/jeu` (publish_files, mode patch, pas de construction).
- Sauvegarde en ligne : document `partie` (nuage.js, capacités db + user) ; ne pas casser ce chemin. Le mode test (S.test) n'écrit jamais.
- Équilibrage vérifié avec `outils/sim2.js` (ne pas le changer sans demander à Victor) ; robustesse avec `outils/fuzz.js`.
- Avant publication : `perf.py`, `captures.py` + compare, `monkey.py` (ordinateur et mobile), `sauvegarde.py`. Voir `sedes-petri/README.md`.
