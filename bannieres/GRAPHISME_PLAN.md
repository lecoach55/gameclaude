# Bannières & Sortilèges — plan graphique

Décision de Victor (19/11/2026) : pendant plusieurs jours, toute l'équipe travaille seulement sur Bannières pour des avancées graphiques **visibles au premier coup d'œil**. Chaque passe dure 4 h au plus et se termine par une publication.
Cible : le Mac Intel de Victor (Iris Plus) en qualité Haute, avec la baisse automatique. Au téléphone, on vérifie seulement que le jeu démarre et reste jouable. Règles, équilibre et sauvegardes ne changent pas.

## Axes, dans l'ordre
1. **Lumière et ambiance** (choisi en premier par Victor) : ciel et éclairage d'ambiance par HDRI Poly Haven, ombres douces bien réglées, brume atmosphérique et perspective aérienne, eau, heure du jour (aube ou soir doré), occlusion ambiante, étalonnage. Sur la carte, en combat et en ville.
2. **Vraies créatures et vrais bâtiments** : modèles CC0 retravaillés dans Blender (chaîne `outils-communs/blender`), pré-rendus façon Heroes III ou GLB avec occlusion cuite.
3. **Champ de bataille et effets de sorts.**
4. **Écrans de ville.**

## Fait
### Passe 1 — axe 1, lumière et ambiance (19/11/2026, soir)
- **Ciel HDRI** Poly Haven « Kloppenheim 06 (Pure Sky) », CC0 (`outils/ressources/ciel_hdri.py` → `jeu/tex3d/ciel.jpg`, 1024×512, 37 Kio). Le soleil est écrêté et tourné du côté de la lumière du jeu. Sous l'horizon, un sol brun-vert donne un rebond chaud. Il sert d'éclairage d'ambiance et de reflets (PMREM, un par moteur de rendu, gardé en mémoire) sur la carte, en combat et en ville. Il remplace le ciel dégradé, qui comptait une boule de soleil.
- **Lumière de fin d'après-midi** (`AMB` dans `rendu3d.js`) : soleil doré à environ 38° de haut, venant du même côté sur la carte, en combat et en ville. Ses ombres sont longues. Le ciel froid fait contrepoids (hémisphère bleuté). L'exposition est relevée pour garder la lisibilité.
- **Perspective aérienne** dans le shader commun `brume()` : les lointains se voilent de la couleur du ciel. Sur la carte, l'effet suit le zoom (16 % de près, jusqu'à 26 % dézoomé). Il ne touche que les zones explorées, pour que le brouillard de guerre reste noir.
- **Combat** (rendu une seule fois par combat, donc sans coût par image) : soleil bas, ombre en 4096 quand l'appareil le permet, brume des lointains, étalonnage (contraste, chaleur côté soleil, froid à l'opposé, vignette). Les obstacles détourés reçoivent le même étalonnage, sans perdre leur transparence. La carte d'ombre est libérée après le rendu (avant, elle restait en mémoire à chaque combat).
- **Villes** (Bastion, Sylve, Horde) : ciel photographié derrière les montagnes peintes. La Horde garde un ciel de poussière orangée, la Sylve un ciel un peu plus vert. Brume accordée à l'horizon, soleil doré et étalonnage. Le premier plan reste placé à l'identique. La Nécropole (nuit) est inchangée, ce qui sera un chantier à part.
- **Carte** : vignette du soir en calque CSS fixe (`#vig3d`), sans coût de rendu. L'eau reflète moins le ciel (le bleu nuit de l'eau ressort).
- Réglages finaux après la revue du graphiste : exposition carte 1,26, ciel 0,70, brume 8 → 14 %, soleil 0xffe2c0 ; combat sans teinte olive (exposition 1,24) ; ciel des villes bleu pâle.
- Chiffres (captures 1280×800, graine 7) : ombres longues partout ; luminance carte 77 → 70, combat 84 → 78, Bastion 106 → 97 (ambiance de fin de journée, voulue) ; Nécropole identique au pixel.
- Fluidité (banc en rendu logiciel, `mesures/banc_19nov_lumiere.txt`) : carte au format Mac +0,4 %, dézoom −10 %, ordinateur +9,6 % (bruit 7 %). L'entrée en combat est 10 à 23 % plus rapide (le ciel n'est plus recalculé à chaque combat), et une fuite d'environ 32 Mo de mémoire graphique par combat ou ville est corrigée. En Économie, la brume coûte environ +9 % en rendu logiciel ; on pourra la couper là si besoin.
- Studio : relecteur ORANGE (ombre 4096 au téléphone, remise en état en cas d'erreur) corrigé ; graphiste ORANGE (trop sombre et olive) corrigé ; technicien fluidité VERT ; testeur ORANGE (monkey 0 erreur, téléphone et Mac OK, ancienne sauvegarde OK ; mer plus terne, pour la prochaine passe).
- Planche avant/après : `mesures/planche_19nov_lumiere.jpg`.

## Passe suivante
Axe 1, suite : **eau** (reflet du ciel HDRI réglé par profondeur, scintillement doré côté soleil), **occlusion ambiante** (pied des forêts et des bâtiments assombri, creux du relief cuits dans le sol), **nuit de la Nécropole** (ciel nocturne HDRI, lune comme lumière). Ensuite, l'axe 2 commence avec les bâtiments KayKit et l'occlusion cuite.
