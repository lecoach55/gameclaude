# Catalogue des ressources du bureau

Avant d'écrire un outil, chercher ici. « Référence » = la version la plus aboutie, à copier et adapter.
Le relevé automatique de tous les outils, jeu par jeu, est dans `python3 bureau/outils/bureau.py json` (et sur la page « Le Bureau »).

## Socle commun (`outils-communs/`) — à intégrer dans tout nouveau jeu
| Outil | Rôle |
|---|---|
| `testkit.js` | 🐞 signalement, compteur img/s, banc, envoi en base (`mesures_*`, `signalement_*`). Copie sans `export` en `<script src>` classique. Ignore désormais les pauses > 1 s (onglet en arrière-plan) — repris de Cage & Gloire. Nouveau (16/11, Président de Club) : `domCapture(el)` = capture des jeux HTML/DOM (canvas inclus) ; option `secours:true` + `TK.rapport(obj,titre)` = rapport à copier / enregistrer quand la base est absente (capacité db non déclarée, hors ligne, app Electron). Intégration en bloc remplaçable : `president-de-club/outils/maj_testkit.py`. 16/11 (Hameau) : le banc joint aussi `etat` (option `etat` du jeu : qualité, densité de pixels…) au document `mesures_*`. |
| `maj_testkit.py` | Version de la trousse de chaque jeu (v1 → v6) et ce qui lui manque ; `python3 outils-communs/maj_testkit.py <jeu> --appliquer` met la copie à jour (fichier `testkit.js` ou bloc `/*TESTKIT-DEBUT*/…/*TESTKIT-FIN*/`), refuse s'il y a des retouches locales. `testkit.js` v6 : `TK.version`, champ `tk` dans les mesures et signalements. v7 (17/11 après-midi) : appareil le plus lent mesuré (images > 1 s gardées, `lent:true`) au lieu d'un banc vide. (17/11, équipe Outils) |
| `banc.py` | **banc commun de fluidité** (17/11) : réglages `<jeu>/outils/banc.json`, `--avant HEAD` = avant/après entrelacés dans la même minute avec le bruit mesuré, `--strict` (code 1 si ralentissement), temps figé = coût réel d'une image GPU compris, reproductible (bruit Trône de Braise ±30 % → ±5 %). Un seul banc à la fois par machine (verrou), mesures écrites au fil des scènes (`<sortie>.partiel.json`) avec le temps restant. Prêt : trone-de-braise, bannieres, hameau (sans sed depuis le 17/11) et les réglages du service fluidité. 17/11 soir : `--avant HEAD` = dépôt complet (dépendances hors du jeu) et pages à chemin absolu protégées ; `--avant-dossier <racine de worktree>` ; page absente = arrêt immédiat ; **gels** au changement de qualité/étage/combat (`"gels"`, `--gels tous` : pire image en jeu + programmes WebGL compilés en jeu, tout moteur ; exemple `bannieres/outils/banc.json`). |
| `profil3d.py` | **profil 3D commun** (18/11) : `python3 outils-communs/profil3d.py <jeu>/outils/banc.json --scenes x` = coût de chaque groupe d'objets, des ombres, de l'environnement, des lumières, du brouillard et de la résolution, pour tout jeu Three.js sans réglage (crochet `__THREE_DEVTOOLS__`), bruit mesuré, tout remis en place. Remplace `bannieres/outils/prof3d.py`, `valdragon/outils/mesure/bprof.py`. |
| `verrou.py` | **verrou machine** (18/11) : bancs seuls, robots ensemble mais jamais pendant un banc, file d'attente ; pris par `banc.py`, `captures.py`, `robots/singe.py`, les commandes de `verif.py` ; pour un outil propre à un jeu : `python3 outils-communs/verrou.py robot -- <commande>` (`banc -- …` pour un banc à soi) ; `verrou.py etat`. Singe pendant un banc : bruit 20-28 % → 10-14 % (attend la fin du banc). |
| `routes.py` | **CDN servi en local** (17/11) : Three.js r160 chargé sur jsDelivr/unpkg (bloqués dans le bac à sable) servi depuis une copie locale (`$THREE`, /home/claude/t3d, sinon `npm pack` une fois, ≈ 1 s) ; branché par défaut dans `atelier.page()`, `banc.py`, `robots/singe.py` (clé `"routes"` pour d'autres adresses). Script Playwright à soi : `from routes import brancher_sync; brancher_sync(pg)` (remplace les 13 `route()` recopiés de Hameau et leur chemin /home/claude/deps). |
| `atelier.py` | serveur local, page neuve (localStorage préparé, temps accéléré, **`tactile=True`** = vrai téléphone has_touch/is_mobile, **`figer=graine`** : horloge virtuelle + hasard à graine, puis `avancer(pg, n)`), mesure d'images, captures. `serveur()` vérifie le dossier servi (17/11 : plus de mesure avant/après faite deux fois sur la même copie) — utiliser l'adresse renvoyée, pas le port en dur. Base des bancs et robots récents (Trône de Braise, Bannières, Cage & Gloire). |
| `sauvegarde-en-ligne.js` | grosses sauvegardes gzip découpées + reprise sur un autre appareil (Wall Street). |
| `captures.py` | **studio de captures commun** (18/11) : vues en JSON (`<jeu>/outils/vues.json`, mêmes clés de chargement que `banc.json`), temps figé, attente de `occupe` (plus de délais fixes), `--avant HEAD` (avant/après sans références stockées), `--comparer refs`, références légères `--format jpg --echelle 0.5`, `--stabilite`, `--strict`. C&L : 16 vues 2D 17,6 s → 11,8 s comparaison comprise ; 3D 45 s → 12,5 s ; références 3D 15 Mo → 0,9 Mo. |
| `compare.py` | comparaison d'images référence / nouvelle version, tolérante aux petits décalages ; colonne informative « détail fin » (taille réelle, ±1 px) qui voit les changements de texte/pictogrammes que la vue réduite ignore (16/11) ; `--json fichier` et `--strict` (code 1 si alerte ou image manquante) pour l'automatisation (16/11). |
| `horloge.js` | temps virtuel + `Math.random` à graine injectés avant le jeu : captures reproductibles au pixel (caméras qui oscillent, particules au hasard). Une ligne dans un script Playwright : `await pg.add_init_script(path='outils-communs/horloge.js')` puis `pg.evaluate('__horloge.avancer(16,162)')` avant la capture. Cage & Gloire : écart entre deux séries 18-51 % → 0-4 % des pixels (16/11). |
| `sonde.py` + `sonde.js` | robots : **`cliquer(pg,'texte')`** attend un bouton visible, actif, non recouvert (erreur qui liste les boutons visibles) ; **`debordements(pg)`** trouve les contenus coupés dans les blocs qui défilent, `overflow:hidden` et bords d'écran, pas seulement la largeur de page. Sync et async. **`cliquer(…, effet='G.jour')`** (ou `effet=True`) lève `ClicSansEffet` si le clic n'a rien changé. |
| `phget.py` | textures et modèles Poly Haven (CC0), avec l'en-tête nécessaire. |
| `verif.py` | **vérification commune avant publication** (18/11) : `python3 outils-communs/verif.py <jeu>/outils/verif.json [--complet]` = construction + tests du jeu (commandes avec `ok_si`/`echec_si`) + captures, singe, banc communs (`--strict`) + poids, en série, rapport HTML (planches, chiffres, détails des échecs), code 1 si échec ; réserves (`"reserve": true`) ; budget 10 min ; durées notées dans chronos.jsonl. Prêts : couronnes-et-lignees (rapide 3,8 min, complet 4,6 min), bannieres (rapide 1,8 min). |
| `atelier.py` · `ATELIER_PARAMS` | (18/11) `ATELIER_PARAMS=v3d=0 python3 <jeu>/outils/<robot>.py` : paramètres ajoutés à l'adresse de toute page ouverte par `atelier.page()` sans toucher au robot (Bannières `parcours.py` en 2D : 3 jours en 13 s contre ≈ 110 s PAR jour en 3D logiciel). Clé `"params"` d'une étape de `verif.json`. |
| `tests/verifier_outils.py` | contrôle de non-régression des outils communs |
| `planche_modeles.py` + `.html` | planche-contact de modèles 3D (taille, triangles). |

## Par besoin
| Besoin | Référence | Autres versions utiles |
|---|---|---|
| **Tout vérifier avant de publier (une commande)** | **`outils-communs/verif.py <jeu>/outils/verif.json [--complet]`** (18/11 ; rapport `/tmp/verif-<jeu>/rapport.html`) | réglages prêts : couronnes-et-lignees, bannieres ; modèle d'origine `valdragon/outils/mesure/verif.py` |
| **Fluidité (tout jeu) : avant/après** | **`outils-communs/banc.py <jeu>/outils/banc.json --avant HEAD`** (même minute, entrelacé, bruit mesuré, code 1 avec `--strict`) | réglages prêts : trone-de-braise, bannieres ; **gel au changement de qualité** : `--gels tous` |
| **Fluidité 3D** (ms/image, appels, triangles, shaders) | **`outils-communs/profil3d.py <jeu>/outils/banc.json`** (ce qui coûte : groupes d'objets, ombres, environnement, lumières, résolution ; tout jeu Three.js) ; `valdragon/outils/mesure/perf.py` + `bprof.py` (coût par catégorie d'objets) + `appels.py` (décompose les appels de dessin : ombres, objets groupés par nom/géométrie — repère vite les objets à instancier) + `banc_jeu.py` (rejoue le banc 🧪 du jeu en entier, relève erreurs et boucle morte) | `cage-et-gloire/outils/perf.py`, `bannieres/outils/perf.py` |
| **Fluidité 2D / Canvas** | `trone-de-braise/outils/perf.py` (bâti sur `atelier.py`, CPU ×4, `FIGE=0`) | `sedes-petri`, `couronnes-et-complots` (SVG) |
| **Captures de vues fixes** | **`outils-communs/captures.py` + `<jeu>/outils/vues.json`** (18/11) ; avant : `valdragon/outils/mesure/studio.py` + `captures.py` (avec `lisibilite.json`) | `couronnes-et-lignees/outils/mesure/captures.py` (jeu DOM/SVG), `bannieres/outils/capt.py` |
| **Robot qui joue au doigt (3D)** | `valdragon/outils/tests/explore.py` + `agent2.js` (vrai joystick, toutes les cases) | `trone-de-braise/outils/parcours.py` |
| **Robot qui joue au doigt (DOM/SVG)** | `couronnes-et-lignees/outils/tests/explore.py` (générique, relève blocages et couverture) ; clics et débordements : `outils-communs/sonde.py` | `bannieres/outils/parcours.py`, `cage-et-gloire/outils/parcours.py` |
| **Clics au hasard** | **`outils-communs/robots/singe.py <jeu>/outils/singe.json`** (téléphone + ordinateur en une commande : erreurs JS avec les 5 dernières actions et capture, blocages, invariants, contenus coupés par écran, boutons sans effet, progression ; code 1 si erreur). Réglages déjà prêts : sedes-petri, wallstreet, president-de-club, hameau (3D : mode économe `"images": 1`, 4 → 39 actions en 2×45 s). `--ordinateur 1280x800` | anciens : `bannieres/outils/monkey.py`, `cage-et-gloire`, `sedes-petri` |
| **Explorer tous les écrans (DOM/SVG)** | **`outils-communs/robots/singe.py <jeu>/outils/singe.json --couvrir`** : boutons jamais touchés d'abord, débordements à chaque nouvel écran, couverture (jamais touchés) dans le rapport ; réglages prêts : couronnes-et-lignees, sedes-petri, wallstreet, president-de-club | `couronnes-et-lignees/outils/tests/explore.py` (55 boutons/min contre 103) |
| **Redondance du contenu** (événements, illustrations, textes et chronique qui reviennent trop souvent) | `sedes-petri/outils/redondance.js` (parties complètes par robots ; fréquence par événement, écart moyen, part de l'illustration la plus vue, textes revus mot pour mot en moins de 20 ans, lignes de chronique répétées) | à adapter à tout jeu à événements textuels (Couronnes & Lignées, Une vie, Président de Club) |
| **Parties automatiques dans Chrome** | `wallstreet/outils/gsim.py` | |
| **Rythme d'une partie (semaines « plates »)** | `wallstreet/outils/rythme.py` | instrumente la page construite (accroches sur toast/info/flash) et compte les semaines sans rien de marquant ; adaptable à tout jeu « séance par séance » |
| **Avantage d'un joueur qui suit les annonces** | `wallstreet/outils/feuil_edge.py` | vérifie qu'un événement annoncé à l'avance ne laisse pas de gain gratuit (cours = espérance) |
| **Ancienne sauvegarde → nouvelle version** | `wallstreet/outils/compat_test.py` | joue avec la version publiée, recharge la partie dans la nouvelle, rejoue 250 séances |
| **Équilibre par A/B appariés** | `couronnes-et-complots/outils/ab.cjs` (+ `hv.cjs`, `fs.cjs`) | `president-de-club/outils/abmatch.js`, `bannieres/outils/duel_factions.js` |
| **Invariants sur longues parties** | `cage-et-gloire/outils/audit.js` | `sedes-petri/outils/fuzz.js` |
| **Trousse de test dans un cadre (iframe 3D qui ne doit pas écrire)** | `trone-de-braise/donjon3d/src/cloud.js` (relais `postMessage` tk3d → la page hôte envoie avec sa trousse) + `jeu/ui.js` (`banc3d` : banc 🧪 qui pilote la page 3D) ; test `trone-de-braise/outils/trousse3d.py` (base simulée : qui écrit quoi) | |
| **Sauvegarde, reprise, hors ligne** | `valdragon/outils/tests/sauvegarde.py` + `hors_ligne.py` | `une-vie/outils/reprise.py` + `nuage_test.py`, `bannieres/outils/hors_ligne.py` |
| **Variété des parties simulées** (parties trop semblables, écarts par origine, choix dominants) | `une-vie/outils/rapport_vies.py` (lit l'export par partie `VIES=` de `harness.js`) | |
| **Ombres de contact bon marché** (meubles posés au sol, 1 appel) | `une-vie/jeu/index_src.html` : `cshad` + texture `soft` dans `buildHome` | |
| **Apps Mac / Windows** | `president-de-club/outils/app-bureau/` (Electron) | |
| **Textures réalistes** | `valdragon/outils/ressources/ph_tex2.py` (couleur + relief, rugosité dans le bleu de `_n`) | `bannieres/outils/ressources/tex3d.py` ; page unique sans réseau : `cage-et-gloire/outils/prep_tex.py` (recadre au lieu de réduire pour garder le relief) + intégration base64 dans `jeu/build.py` / `texImg()` d'arene.js |
| **Décors 3D légers** | `valdragon/outils/ressources/pack_phprops.mjs`, `simp_kit.mjs` | imposteurs `bannieres/outils/studio3d/imposteur.py` |
| **Portraits / sprites pré-rendus en 3D** | `bannieres/outils/studio/portraits.py` + `pack_portraits.py` (`jeu/sprites3d.js`) | |
| **Personnages animés Mixamo** | `valdragon/outils/ressources/fbx61.py` (FBX 6.1) | `cage-et-gloire/outils/prep_xbot.mjs` (mannequin Xbot) |
| **Polices intégrées (hors ligne), icônes au trait, palettes du studio** | `studio/ressources/` (README) : `polices/polices.py medieval|medieval-sombre|moderne` (CSS base64, OFL), `icones/studio.svg` (48 icônes Lucide, ISC, pour remplacer les emoji), `palettes.css` (4 familles) | revue artistique du 16/11 |
| **Planche de tous les jeux** (couleurs dominantes, luminance, saturation) | `studio/ressources/planche_studio.py` | |
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

| `hameau/outils/mesure/saccades.py`, `profil_scene.py` | Saccades par scène d'un banc (programmes compilés, pire image) et profil JS (CDP) du passage à une scène ; adaptables à tout jeu Three.js. En rendu logiciel, seuls les comptes sont fiables. |

- **Piège three r160 `compileAsync`** : plante dans une minuterie (`reading 'isReady'`) si un matériau est jeté pendant la compilation, la promesse ne se résout jamais. Version sûre : `compA()` dans `valdragon/jeu/g3d.js` (à recopier dans tout jeu Three.js qui attend compileAsync).
- **Qualité auto qui ne baisse pas pour rien** (écran bridé à 30 img/s par l'économie d'énergie) : `perfTick` de `valdragon/jeu/ui3.js` (annule une baisse qui ne gagne pas 12 %).
