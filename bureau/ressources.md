# Catalogue des ressources du bureau

Avant d'écrire un outil, chercher ici. « Référence » = la version la plus aboutie, à copier et adapter.
Le relevé automatique de tous les outils, jeu par jeu, est dans `python3 bureau/outils/bureau.py json` (et sur la page « Le Bureau »).

## Socle commun (`outils-communs/`) — à intégrer dans tout nouveau jeu
| Outil | Rôle |
|---|---|
| `testkit.js` | 🐞 signalement, compteur img/s, banc, envoi en base (`mesures_*`, `signalement_*`). Copie sans `export` en `<script src>` classique. Ignore désormais les pauses > 1 s (onglet en arrière-plan) — repris de Cage & Gloire. Nouveau (16/11, Président de Club) : `domCapture(el)` = capture des jeux HTML/DOM (canvas inclus) ; option `secours:true` + `TK.rapport(obj,titre)` = rapport à copier / enregistrer quand la base est absente (capacité db non déclarée, hors ligne, app Electron). Intégration en bloc remplaçable : `president-de-club/outils/maj_testkit.py`. |
| `atelier.py` | serveur local, page neuve (localStorage préparé, temps accéléré), mesure d'images, captures. Base des bancs et robots récents (Trône de Braise, Bannières, Cage & Gloire). |
| `sauvegarde-en-ligne.js` | grosses sauvegardes gzip découpées + reprise sur un autre appareil (Wall Street). |
| `compare.py` | comparaison d'images référence / nouvelle version, tolérante aux petits décalages ; colonne informative « détail fin » (taille réelle, ±1 px) qui voit les changements de texte/pictogrammes que la vue réduite ignore (16/11). |
| `phget.py` | textures et modèles Poly Haven (CC0), avec l'en-tête nécessaire. |
| `tests/verifier_outils.py` | contrôle de non-régression des outils communs |
| `planche_modeles.py` + `.html` | planche-contact de modèles 3D (taille, triangles). |

## Par besoin
| Besoin | Référence | Autres versions utiles |
|---|---|---|
| **Fluidité 3D** (ms/image, appels, triangles, shaders) | `valdragon/outils/mesure/perf.py` + `bprof.py` (coût par catégorie d'objets) | `cage-et-gloire/outils/perf.py`, `bannieres/outils/perf.py` |
| **Fluidité 2D / Canvas** | `trone-de-braise/outils/perf.py` (bâti sur `atelier.py`, CPU ×4, `FIGE=0`) | `sedes-petri`, `couronnes-et-complots` (SVG) |
| **Captures de vues fixes** | `valdragon/outils/mesure/studio.py` + `captures.py` (avec `lisibilite.json`) | `couronnes-et-lignees/outils/mesure/captures.py` (jeu DOM/SVG), `bannieres/outils/capt.py` |
| **Robot qui joue au doigt (3D)** | `valdragon/outils/tests/explore.py` + `agent2.js` (vrai joystick, toutes les cases) | `trone-de-braise/outils/parcours.py` |
| **Robot qui joue au doigt (DOM/SVG)** | `couronnes-et-lignees/outils/tests/explore.py` (générique, relève blocages et couverture) | `bannieres/outils/parcours.py`, `cage-et-gloire/outils/parcours.py` |
| **Clics au hasard** | `bannieres/outils/monkey.py` (ordinateur + téléphone, graine) | `cage-et-gloire`, `sedes-petri` |
| **Parties automatiques dans Chrome** | `wallstreet/outils/gsim.py` | |
| **Rythme d'une partie (semaines « plates »)** | `wallstreet/outils/rythme.py` | instrumente la page construite (accroches sur toast/info/flash) et compte les semaines sans rien de marquant ; adaptable à tout jeu « séance par séance » |
| **Avantage d'un joueur qui suit les annonces** | `wallstreet/outils/feuil_edge.py` | vérifie qu'un événement annoncé à l'avance ne laisse pas de gain gratuit (cours = espérance) |
| **Ancienne sauvegarde → nouvelle version** | `wallstreet/outils/compat_test.py` | joue avec la version publiée, recharge la partie dans la nouvelle, rejoue 250 séances |
| **Équilibre par A/B appariés** | `couronnes-et-complots/outils/ab.cjs` (+ `hv.cjs`, `fs.cjs`) | `president-de-club/outils/abmatch.js`, `bannieres/outils/duel_factions.js` |
| **Invariants sur longues parties** | `cage-et-gloire/outils/audit.js` | `sedes-petri/outils/fuzz.js` |
| **Sauvegarde, reprise, hors ligne** | `valdragon/outils/tests/sauvegarde.py` + `hors_ligne.py` | `une-vie/outils/reprise.py` + `nuage_test.py`, `bannieres/outils/hors_ligne.py` |
| **Variété des parties simulées** (parties trop semblables, écarts par origine, choix dominants) | `une-vie/outils/rapport_vies.py` (lit l'export par partie `VIES=` de `harness.js`) | |
| **Ombres de contact bon marché** (meubles posés au sol, 1 appel) | `une-vie/jeu/index_src.html` : `cshad` + texture `soft` dans `buildHome` | |
| **Apps Mac / Windows** | `president-de-club/outils/app-bureau/` (Electron) | |
| **Textures réalistes** | `valdragon/outils/ressources/ph_tex2.py` (couleur + relief, rugosité dans le bleu de `_n`) | `bannieres/outils/ressources/tex3d.py` ; page unique sans réseau : `cage-et-gloire/outils/prep_tex.py` (recadre au lieu de réduire pour garder le relief) + intégration base64 dans `jeu/build.py` / `texImg()` d'arene.js |
| **Décors 3D légers** | `valdragon/outils/ressources/pack_phprops.mjs`, `simp_kit.mjs` | imposteurs `bannieres/outils/studio3d/imposteur.py` |
| **Portraits / sprites pré-rendus en 3D** | `bannieres/outils/studio/portraits.py` + `pack_portraits.py` (`jeu/sprites3d.js`) | |
| **Personnages animés Mixamo** | `valdragon/outils/ressources/fbx61.py` (FBX 6.1) | `cage-et-gloire/outils/prep_xbot.mjs` (mannequin Xbot) |
| **Musique générative** | `bannieres/jeu/sons.js` (venue de Valdragon) | |

## Ressources artistiques déjà dans le dépôt
| Ressource | Où | Licence / crédit |
|---|---|---|
| Three.js r160 | `bannieres/jeu/lib/three.js` (= `couronnes-et-lignees/jeu/three.js`), node_modules de Valdragon | MIT |
| Three.js r128 | `une-vie/jeu/vendor/three.min.js` | MIT |
| Bruitages Kenney | `valdragon/jeu/snd` (28), `bannieres/jeu/snd` (21) | CC0, crédité |
| Textures et modèles Poly Haven | via `phget.py` | CC0, crédité |
| Dragon « Drago » | Valdragon | Oscar Creativo, **CC BY 4.0 : crédit obligatoire** |
| Animations Mixamo | Valdragon, Bannières, Cage & Gloire | crédit Mixamo |
| KayKit, Quaternius | Valdragon | CC0, crédités |

## Ajouter une ressource
Une ligne ici (besoin, référence, où), et si l'outil sert à plusieurs jeux, le copier dans `outils-communs/` avec une ligne dans son README.
