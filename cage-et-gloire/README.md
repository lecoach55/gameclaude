# Cage & Gloire

Jeu de management de combattants de MMA. On dirige une écurie, on entraîne ses combattants, on accepte des combats et on les fait monter de ligue. Les combats se regardent en 3D (ou en résultat immédiat), avec des consignes entre les rounds.
Une seule page, jouable hors ligne : `build/` (non versionné) ← `python3 jeu/build.py sortie.html`.
Artefact : slug `a54aba6d-7add-42e6-8212-9468f69ceee4` (capacités db + user). Publier la page construite en `index.html` (publish_files).

## Le jeu
- 5 organisations fictives, de la plus modeste à la plus prestigieuse : CFR (régional) → HEX (France) → ECC (Europe) → GLADIUS (monde, n°2) → APEX (sommet). 8 catégories (6 hommes, 2 femmes), environ 450 combattants actifs, champions et classements (Elo).
- Montées : offres de contrat quand un combattant est champion, dans le top 3 avec une série, ou trop fort pour sa ligue. Descentes : libéré après trop de défaites. Les combattants de l'IA montent, descendent, progressent, vieillissent et prennent leur retraite.
- Économie : 25 % de commission sur les bourses, cotisations des adhérents (la réputation les attire), loyer, staff (5 postes, 3 niveaux), 5 niveaux de salle, recrutement d'agents libres.
- Entraînement : programme (6 choix) et intensité ; fatigue, forme, moral, blessures.
- Événements aléatoires (`EVENTS` dans moteur.js) : sponsors, combat au pied levé dans la ligue du dessus, jeune talent, conférence de presse, rachat, documentaire…
- Combat : moteur par tranches de 15 s (debout, clinch, sol), 5 plans de combat, cartes des juges, stats. Chances estimées sur 140 combats simulés.

## Code (`jeu/`)
`data.js` (organisations, catégories, styles, noms par pays — noms de vrais combattants retirés) · `combat.js` (moteur de combat, déterministe avec graine) · `moteur.js` (monde, calendrier, classements, mercato mensuel, économie, événements) — ces 3 fichiers tournent sous Node.
`arene.js` (Three.js r160 : octogone, grillage, foule instanciée, portique, flashs ; combattants = mannequin Xbot recoloré par régions peau/short/gants/cheveux via les poids des os ; poses par directions d'os, adaptées de `valdragon/jeu/mxanim.js`) · `portraits.js` (portraits SVG générés) · `ui.js` · `style.css` · `testkit.js` · `nuage.js`.
`xbot.glb` : Xbot (exemple Mixamo de three.js), animations retirées, compressé meshopt (`outils/prep_xbot.mjs`).
Construction : `npm i` à la racine du dossier (three 0.160, esbuild, @fontsource bebas-neue + inter), puis `python3 jeu/build.py sortie.html` (polices et modèle intégrés en base64, ≈ 1,9 Mio).

## Outils (`outils/`)
- `calib_combat.js` : taux d'issues et avantage du favori. Repère 15/11/2026 (3 rounds) : ≈ 52 % décisions, 20-25 % KO/TKO, 21 % soumissions ; favori à 5 points d'écart ≈ 75 %. Identique quel que soit le niveau.
- `sim_monde.js N ans [bon|passif]` : parties automatiques. Repère : 0 erreur, organisations pleines, APEX atteint en 4 à 6 ans, 2 à 6 ceintures en 6 ans.
- `parcours.py page dossier [l h]` : partie au doigt (accueil, onglets, offre, combat 3D jusqu'au bout avec le coin, résultat, fiche). Lent sous swiftshader (≈ 4 min).
- `studio.py page dossier [poses]` : une capture par pose de l'arène. `bureau.py` : captures 1280×800.
- Références : `references/`.

## Règles
- Ne pas changer l'équilibre (combat, progression, économie) sans relancer `calib_combat.js` et `sim_monde.js` et sans l'accord de Victor.
- Sauvegarde locale `cage-gloire-v1` + document en ligne `partie` : ne jamais les modifier. Tout nouveau champ doit être complété dans `completer()` (ui.js) pour les anciennes parties.
- Mesures réelles : ☰ → 🧪 Mesurer la fluidité → `mesures_*` ; ☰ → 🐞 → `signalement_*` (`db_whoami` + `db_list` sur `data/users/<id>`).
- Qualité 3D allégée (sans ombres ni antialiasing) dans ☰ pour les machines faibles.
