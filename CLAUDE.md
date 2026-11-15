# gameclaude — consignes pour Claude

Dépôt de Victor (lecoach55) : ses jeux créés avec Claude et les outils de fabrication, partagés entre conversations.
Réponds à Victor en français. Il joue surtout sur téléphone et sur un MacBook Pro Intel (puce graphique modeste).

## Outils communs (`outils-communs/`)
`testkit.js` (🐞 signalement, compteur d'img/s, banc, envoi en base ; jeux SVG : option `capture` + `svgCapture`), `sauvegarde-en-ligne.js` (grosses sauvegardes compressées et découpées, reprise sur un autre appareil), `atelier.py` (serveur, pages, mesures, captures), `compare.py`. À intégrer dans chaque nouveau jeu.

## Couronnes & Lignées (`couronnes-et-lignees/`)
Simulation dynastique médiévale en une page HTML (SVG, sans dépendance). Artefact : slug `c14b9bc8-e782-45aa-b06c-06126bd542d0`.
- Construire : `cd couronnes-et-lignees/jeu && python3 build.py`, publier `index.html`.
- Équilibre : bot attentif 72-80 % (`node -e "require('./sim.js').run('heur',1000)"`), aucun choix > 95 % (`outils/tests/analyze.js`). Ne pas changer la difficulté sans accord.
- Avant publication : `outils/tests/pass1test.py` (partie + anciennes sauvegardes), `mock.py` (IA), `explore.py` (au doigt), `mesure/captures.py` + `outils-communs/compare.py` contre `references/`.
- Voir `couronnes-et-lignees/README.md`.

## Hameau 3D (`hameau/`)
City builder à zones peintes (Three.js r160). Artefact : slug `c5adfecd-00f3-46b2-bf27-710271ef3626`. Tout est décrit dans `hameau/README.md` (construction, mode test, sauvegarde en ligne, simulateur de parties, captures de référence). Ne pas modifier l'équilibre sans simulations appariées.

## Couronnes & Complots (`couronnes-et-complots/`)
Jeu de plateau façon Risk + politique (SVG). Artefact : slug `bb426884-b0bb-4943-a930-164fb4e5f790` (capacités db + user).
- Construire : `cd couronnes-et-complots/jeu && npm i && node build.mjs`, publier `couronnes-et-complots.html`.
- Équilibre et IA : ne rien changer sans A/B (`outils/ab.cjs`, `hv.cjs`, `fs.cjs`) ; historique et chiffres dans `jeu/JOURNAL.md`.
- Fluidité : `outils/perf.py` (référence `mesures/perf_v5.json`) ; visuel : `outils/refs.py` + `outils-communs/compare.py` (références `references/normale`).
- Mesures réelles : bouton 🐞 et « 🧪 Mode test » (écran d'accueil) → `db_list` sur le slug, collection `data/users/<id>`.

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

## Wall Street, séance par séance (`wallstreet/`)
Simulation boursière jour par jour (HTML/JS sans dépendance, une seule page). Artefact publié : slug `fa79cd7f-9305-4e08-96f4-06dc8c1ae005` (capacités db + user). Journal des simulations : slug `8cfffc45-0a04-44ad-89ae-2727a46e3f5e`.
- Construire : `sh wallstreet/jeu/build.sh /home/claude/bourse6.html` puis publier ce fichier en `index.html`.
- Sauvegarde locale `wallst-sim-v3` (ne jamais changer la clé ; `ensureGame` complète les anciennes parties) + sauvegarde en ligne (`partie`, `partie_1`…, gzip). Ne jamais modifier ces documents.
- Menu ☰ : 🐞 « Signaler un problème » → documents `signalement_*` ; 🧪 « Mesurer la fluidité » → `mesures_*` (la partie est copiée puis remise à l'identique). Lire avec `db_whoami` + `db_list` sur `data/users/<id>`.
- Équilibre : ne pas toucher aux réglages du marché sans mesurer. Outils dans `wallstreet/outils` (copier jeu/ et outils/ dans un même dossier de travail) : `bots.js` (stratégies 44 marchés × 8 ans), `sim_lev.js`/`simstats.js` (faits stylisés : effet de levier, corrélations, volatilité), `rivalsim.js` (équilibre des rivaux), `proprobe.js`/`peprobe.js` (avantage des signaux), `gsim.py` (parties automatiques dans Chrome : `python3 gsim.py passif,actif 1 504`), `shots7.py` (captures), `memtest.py`, `kittest.py` (banc + signalement).
- Cibles et méthode : `wallstreet/mesures/NUIT_WALLST.md`. Aucune stratégie gratuite > +5 %/an, hasard −1 à −3 %/an, au plus une fenêtre bloquante pour trois clics « +1 semaine ».

## Une vie parmi 8 milliards (`une-vie/`)
Simulateur de vie avec scène 3D. Artefact : slug `b04fac4d-6c5d-4942-aea6-f931c43137b7`. Construire avec `python3 une-vie/jeu/build.py`, publier `une-vie/build/index.html`. Outils et règles : `une-vie/README.md` (sim.sh, studio.py + compare.py, perf.py, qa.py).
- Reprise de la vie en cours : locale (`vie8m_cur`) et en ligne (document `partie`, capacités db + user) ; ne jamais modifier ces données. Tester avec `outils/reprise.py` et `outils/nuage_test.py`.
- Mesures réelles : 🧪 sur l'accueil → `mesures_*` ; 🐞 → `signalement_*` (`db_list` sur `data/users/<id>`).
