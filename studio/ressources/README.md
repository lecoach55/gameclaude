# Ressources communes du studio (direction artistique)

Préparées par la revue artistique du 16/11/2026 (rapport : `studio/rapports/2026-11-16_art.md`).
Aperçu de tout : `studio/rapports/2026-11-16_art_ressources.png` (page `specimen.html`, à ouvrir via un serveur local).
Règle : une page publiée doit marcher **hors ligne** — on intègre polices et icônes dans la page, jamais de Google Fonts ni de CDN.

## Polices (`polices/`, SIL OFL 1.1, texte de licence dans chaque dossier)
Woff2, sous-ensemble latin (français complet, œ « » compris), issues de `@fontsource` (npm).
| Jeu de polices | Titres | Texte | Pour |
|---|---|---|---|
| `medieval` | Cinzel 500/700 | Alegreya 400/400i/700 + Alegreya SC | Sedes Petri, Couronnes & Lignées, Couronnes & Complots, Valdragon, Bannières, Hameau |
| `medieval-sombre` | Grenze Gotisch 500/700 | Alegreya Sans 400/700/800 | Trône de Braise (déjà), Valdragon (interface) |
| `moderne` | Barlow Condensed 600/700 | Inter 400/600/700 + JetBrains Mono (chiffres) | Président de Club, Cage & Gloire, Wall Street, Une vie |
Aussi disponible : EB Garamond 400/400i/600 (texte long, Sedes Petri).

`python3 studio/ressources/polices/polices.py medieval > polices.css` → @font-face en base64 à coller dans la page (≈ 140 à 215 Ko selon le jeu).
Un jeu peut garder sa police d'identité (Bebas Neue de Cage & Gloire, Fraunces d'Une vie, UnifrakturMaguntia de Couronnes & Lignées…) mais **doit l'intégrer** de la même façon. Crédit : « Polices : … (SIL OFL) ».

## Icônes (`icones/studio.svg`, Lucide, licence ISC)
48 symboles au trait (menu, réglages, son, 🐞 bug, 🧪 test, lecture/pause/avance, sauvegarde, carte, épées, bouclier, couronne, château, parchemin, pièces, trophée, graphique, hausse/baisse, maison, marteau, blé, église, crâne, gemme, sac, drapeau, appareil photo, jauge, loupes, poignée de main, institution, œil, sablier…).
Usage : coller `studio.svg` (12 Ko) une fois dans la page, puis `<svg class="ico"><use href="#i-crown"/></svg>` ;
`.ico{width:1.2em;height:1.2em;stroke:currentColor;fill:none;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}`.
Médiéval : couleur `--or`, trait 1.4 ; moderne : couleur du texte, trait 1.8. Ajouter des icônes : `npm i lucide-static` puis `python3 studio/ressources/icones/icones.py node_modules/lucide-static/icons nom1,nom2`.
Crédit obligatoire (ISC) : « Icônes Lucide (ISC) ». Pas de game-icons.net (CC BY : crédit par auteur). Les icônes CC0 de Kenney sont préférables si un jour kenney.nl est accessible (bloqué dans le bac à sable le 17/11).
**Remplacer les emoji** des boutons (🐞 🧪 ☰ 🔊 💎 ✨…) : ils changent de dessin selon l'appareil et font « enfantin ».

## Palettes (`palettes.css`)
Quatre familles : `.pal-medieval-sombre`, `.pal-medieval-clair`, `.pal-moderne-nuit`, `.pal-moderne-papier` (variables `--fond`, `--panneau`, `--texte`, `--or`/`--accent`, `--bon`, `--mauvais`…). Elles reprennent les couleurs déjà en place dans les jeux (relevé de la revue), harmonisées : aucun jeu n'a à changer de couleurs, mais un nouvel écran ou un nouveau jeu part de là.
Règles : vert et rouge réservés à bon/mauvais ; une seule couleur d'accent par écran ; saturation des grandes surfaces (herbe, eau, aplats de carte) ≤ 0,45 ; texte ≥ 4,5:1.

## Lumière et ciels (Poly Haven, CC0 — à télécharger avec `outils-communs/phget.py`, pas stockés ici)
| Ambiance | HDRI | Pour |
|---|---|---|
| Jour voilé, doux | `kloofendal_48d_partly_cloudy_puresky` | Hameau, Bannières (carte, villes), Couronnes & Lignées (titre) |
| Heure dorée | `belfast_sunset_puresky` | Hameau (crépuscule), Bannières (Bastion), titres |
| Ciel dramatique | `kloppenheim_06_puresky` | Bannières (Nécropole/Horde) |
| Nuit | `satara_night_no_lamps`, `dikhololo_night` | Hameau (nuit), Valdragon (prologue) |
Règle Mac Intel : HDRI en 1k, utilisé **une seule fois** au chargement (PMREM) pour l'éclairage d'ambiance ; jamais d'HDRI en arène de nuit (Cage & Gloire) — dégradé peint dans le sol + émissif faible.
Étalonnage commun : ACES + sortie sRGB ; une légère LUT chaude (le jaune-vert de l'herbe tiré vers l'ocre).

## Déjà dans le dépôt, à réutiliser plutôt que refaire
| Besoin | Où | Licence |
|---|---|---|
| Arbres, arbustes, rochers en imposteurs (sprites pré-rendus) | `bannieres/jeu/imp/` (+ `bannieres/outils/studio3d/imposteur.py`) | Poly Haven CC0 |
| Personnages et portraits pré-rendus en 3D (chevalier, moine, archer, clerc…) | `bannieres/outils/studio/portraits.py` + `pack_portraits.py` | Mixamo (crédit) |
| Textures de matières (ardoise, chaume, enduit, poutre, pavé, roche, sable, neige) | `bannieres/jeu/tex3d/` ; biomes de donjon `valdragon/jeu/tex/` | Poly Haven / ambientCG CC0 |
| Textures en page unique (recadrage qui garde le relief) | `cage-et-gloire/outils/prep_tex.py` | — |
| Ombre de contact bon marché | `une-vie/jeu/index_src.html` (`cshad`) | — |
| Bruitages | `valdragon/jeu/snd` (28), `bannieres/jeu/snd` (21) | Kenney CC0 |
| Musique générative | `bannieres/jeu/sons.js` | — |
| Meubles héraldiques (blasons) | `couronnes-et-lignees/jeu/art.js` (`CHARGES`) | — |

## Planche du studio
`python3 studio/ressources/planche_studio.py <dossier_revue> sortie.jpg [motif=vitrine.png] [colonnes]` : une vignette par jeu, les 6 couleurs dominantes, luminance et saturation moyennes (fichier `.json` à côté).
