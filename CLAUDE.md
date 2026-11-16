# gameclaude — consignes pour Claude

Dépôt de Victor (lecoach55) : ses jeux créés avec Claude et les outils de fabrication, partagés entre conversations.
Réponds à Victor en français. Il joue surtout sur téléphone et sur un MacBook Pro Intel (puce graphique modeste).

## Le Bureau (`bureau/`) — à lire en premier
Espace commun à toutes les conversations : chantiers en cours, journal, catalogue des outils (`bureau/ressources.md`), mises en commun à faire (`bureau/a-mutualiser.md`). Mode d'emploi complet : `bureau/README.md`.
- **En arrivant** : `python3 bureau/outils/bureau.py` (état), lire les demandes de Victor et les messages (`db_list` sur le slug de `bureau/ARTEFACT.txt`, collections `demandes` et `messages`), puis `bureau.py arrivee <dossier> "objet"` + commit/push.
- **Avant d'écrire un outil** : chercher dans `bureau/ressources.md`, il existe souvent dans un autre jeu.
- **En repartant** : reporter dans `outils-communs/` tout outil amélioré utile ailleurs, `bureau.py depart <dossier> "bilan chiffré"`, `bureau.py page` puis republier `bureau/build/index.html` (publish_files, mode patch, slug de `bureau/ARTEFACT.txt`), marquer les demandes traitées (`db_write` : `etat: "fait"`, `reponse`), commit/push.
- Toujours `git pull --rebase` avant de pousser : plusieurs conversations travaillent en parallèle.

## Outils communs (`outils-communs/`)
`testkit.js` (🐞 signalement, compteur d'img/s, banc, envoi en base ; jeux SVG : option `capture` + `svgCapture`), `sauvegarde-en-ligne.js` (grosses sauvegardes compressées et découpées, reprise sur un autre appareil), `atelier.py` (serveur, pages, mesures, captures), `compare.py`. À intégrer dans chaque nouveau jeu.

## Couronnes & Lignées (`couronnes-et-lignees/`)
Simulation dynastique médiévale en une page HTML (SVG, sans dépendance). Artefact : slug `c14b9bc8-e782-45aa-b06c-06126bd542d0`.
- Construire : `cd couronnes-et-lignees/jeu && python3 build.py`, publier `index.html`.
- Équilibre : bot attentif 72-80 % (`node -e "require('./sim.js').run('heur',1000)"`), aucun choix > 95 % (`outils/tests/analyze.js`). Ne pas changer la difficulté sans accord.
- Avant publication : `outils/tests/pass1test.py` (partie + anciennes sauvegardes), `mock.py` (IA), `explore.py` (au doigt), `mesure/captures.py` + `outils-communs/compare.py` contre `references/`.
- Carte 3D en cours (`PLAN_3D.md`, `jeu/rendu3d.js`) : tester aussi avec `V3D=1` (captures, explore, geste), références `references/3d/`.
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
- `mesure/captures.py` écrit aussi `lisibilite.json` (luminance des personnages vs leur entourage, contraste de silhouette « bord ») ; `mesure/vue_haute.py` : vue d'ensemble d'étages entiers révélés (architecture, habillage).
- `ressources/ph_tex2.py` : textures de biome Poly Haven (couleur + relief, **rugosité dans le canal bleu de `_n`**) ; `ressources/pack_phprops.mjs` : décors photoréalistes Poly Haven → `mq/phprops.glb` (nœuds nommés comme les pièces KayKit qu'ils remplacent). Sources via `outils-communs/phget.py`.
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

## Le Trône de Braise (`trone-de-braise/`)
Action-RPG façon Diablo + royaume (dés, diplomatie, dynastie). Canvas 2D, une seule page hors ligne. Artefact : slug `ad95fb12-6952-4fbd-8b8b-ff66978db6c6` (capacités db + user).
- Construire : `python3 trone-de-braise/jeu/build.py`, publier `trone-de-braise/build/trone-de-braise.html` en `index.html` (publish_files).
- Équilibre : `outils/sim_donjon.js` et `outils/sim_royaume.js` (repères dans le README) ; ne pas changer la difficulté sans accord.
- Avant publication : `outils/parcours.py`, `outils/fumee.py`, `outils/perf.py` (référence `mesures/perf_v4_cpu4.json` à CPU ×4 ; `FIGE=0` pour mesurer avec la résolution adaptative). Voir `trone-de-braise/README.md`.
- Sauvegardes : locale `tdb-v1` + en ligne `partie` (ne jamais les modifier) ; tout nouveau champ doit être ajouté dans `completer(G)` (royaume.js) pour les anciennes parties.
- Donjons 3D au tour par tour (moteur Valdragon, `donjon3d/`) : `python3 donjon3d/build.py` avant `jeu/build.py`, publier aussi `build/donjon3d.html` ; équilibre `outils/sim_expe3d.js`, test `outils/expe3d.py`. La page 3D ne doit jamais sauvegarder (cloud.js neutralisé). Crédits Valdragon obligatoires.

## Président de Club (`president-de-club/`)
Gestion d'un club de foot français du Régional 2 à la Ligue 1 (une page HTML/JS). Artefact : slug `e26f972e-fb7b-400e-846b-68da3d529144`, publier `president-de-club/jeu/index.html` en `index.html` (publish_files, mode patch).
- Équilibre : `outils/run3.js` (4 stratégies × 3 parties × 8 saisons, repère 1-4 fins sur 12, 0 erreur) et `outils/abmatch.js` ; ne pas changer la difficulté sans accord.
- Apps Mac/Windows : `outils/app-bureau/` (Electron). Journal : `mesures/JOURNAL.md`. Voir `president-de-club/README.md`.

## Bannières & Sortilèges (`bannieres/`)
Stratégie au tour par tour façon Heroes of Might and Magic avec cartes générées au hasard (une page hors ligne ; carte, combats et villes en 3D Three.js r160 via `jeu/rendu3d.js`, ancien rendu Canvas 2D gardé en repli : `?v3d=0`). Artefact : slug `c14c3c85-7570-4c24-845c-42239cee0f6a` (capacités db + user).
- Construire : `python3 bannieres/jeu/build.py`, publier `bannieres/build/bannieres.html` en `index.html` (publish_files).
- Logique testable sous Node (`outils/charger.js`, `sim_partie.js`, `sim_factions.js` pour l'équilibre des 4 factions) ; avant publication : `parcours.py` (robot à travers l'interface + sauvegarde), `scen.py` (siège, Graal, victoire), `monkey.py` (clics au hasard), `perf.py`, `capt.py` + compare (références dans `references/`), `hors_ligne.py`. Voir `bannieres/README.md`.
- Ressources reprises de Valdragon : portraits 3D (`outils/studio/portraits.py` + `pack_portraits.py`, dossier préparé `/home/claude/t3d`), bruitages Kenney (`jeu/snd`), bois et pierre (`jeu/tex`), musique générative (sons.js). Réalisme : textures, arbres et rochers Poly Haven (CC0, `outils/ressources/ph_dl.py`, `tex3d.py`, imposteurs `outils/studio3d/imposteur.py`) ; humanoïdes et dragons pré-rendus en 3D (`outils/studio` → `jeu/sprites3d.js`), quadrupèdes encore dessinés. Crédits sur l'accueil (Poly Haven, Mixamo, Drago CC BY 4.0, Kenney).

## Cage & Gloire (`cage-et-gloire/`)
Management de combattants de MMA : 5 organisations (CFR → HEX → ECC → GLADIUS → APEX), montées/descentes selon les résultats, combats regardés dans une arène Three.js. Artefact : slug `a54aba6d-7add-42e6-8212-9468f69ceee4` (capacités db + user).
- Construire : `cd cage-et-gloire && npm i && python3 jeu/build.py /home/claude/cg.html`, publier ce fichier en `index.html` (publish_files).
- Équilibre : `outils/calib_combat.js`, `outils/sim_monde.js` (repères dans le README) ; ne pas changer sans accord.
- Avant publication : `outils/evtest.js`, `outils/parcours.py`, `outils/vues.py`, `outils/combat3d.py`, `outils/sauvegarde.py`, `outils/studio.py` (poses), `outils/perf.py` (fluidité, référence `mesures/perf_v9.json`), `outils/audit.js` (invariants sur longues parties), `outils/monkey.py` (clics au hasard). Sauvegardes `cage-gloire-v1z` (gzip) / `cage-gloire-v1` + `partie` : ne jamais les modifier ; tout nouveau champ se complète dans `completer()` (ui.js).
- Le mannequin Xbot regarde +Z ; les régions (short, gants, cheveux, barbe, visage) sont calculées en coordonnées communes à ses deux maillages (`regions()` dans arene.js).
