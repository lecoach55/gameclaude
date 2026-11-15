# Procédure d'un cycle de nuit : jeu « Wall Street, séance par séance »

Pour Victor, en français. Cycle autonome : personne ne surveille. Ne jamais publier une version qui n'a pas passé les contrôles.

## Où sont les choses
- Dossier de travail : /home/claude
- Jeu publié : artefact slug `fa79cd7f-9305-4e08-96f4-06dc8c1ae005` (page unique). Toujours lire la version en ligne avec get_artifact avant de republier (base_version).
- Journal publié : artefact slug `8cfffc45-0a04-44ad-89ae-2727a46e3f5e`, fichier local /home/claude/journal.html. Les nouvelles entrées s'insèrent juste après le commentaire `<!--NOUVELLES-ENTREES-->` (la plus récente en haut).
- Sources : engine.js (moteur de marché), game.js (couche jeu et interface), ui3.html (gabarit avec /*BASECSS*/ /*DATA*/ /*ENGINE*/ /*GAME*/), base.css, simdata.json. ./build.sh assemble tout dans bourse6.html.
- Outils de mesure :
  - `node sim_lev.js ./engine.js` : effet de levier, corrélations par jours de baisse et de hausse, asymétrie, volatilité, rendement.
  - `node bots.js ./engine.js 24 8` : 16 stratégies robots sur 24 marchés de 8 ans.
  - `node simstats.js ./engine.js 8` : statistiques longues (krachs, marchés baissiers, PER, taux, durées de cycles).
  - `python3 gsim.py passif,actif,yolo 1 504` : parties complètes dans Chrome sans tête (après ./build.sh).
  - `python3 memtest.py` : mémoire et taille de sauvegarde sur 10 ans.
  - `python3 shots7.py` : parcours et captures (k0 à k5.png), à regarder avec Read.
- Si des fichiers manquent (conteneur réinitialisé) : relire le jeu publié avec read_artifact, extraire les blocs <script> (DATA, ENGINE, GAME) et le <style>, puis reconstruire les fichiers. Si c'est impossible, ne rien publier et l'écrire dans le journal.

## Étapes
1. Lire la section « Pistes » de la dernière entrée de journal.html et la liste « Backlog » ci-dessous.
2. Premier lot de mesures : sim_lev, bots (24 × 8), gsim (3 profils, 2 ans). Noter les chiffres.
3. Choisir 1 à 3 améliorations, les plus utiles d'abord. Sauvegarder les fichiers modifiés en *_avant_cycleN avant de toucher.
4. Implémenter, puis second lot de mesures identique. Si une mesure se dégrade nettement, revenir en arrière.
5. Contrôles avant publication : `./build.sh`, vérification de syntaxe des scripts (node, new Function), gsim sans erreur JavaScript, shots7.py sans erreur, une capture regardée (clair) et une en largeur 390 px.
6. Publier le jeu (publish_files, slug ci-dessus, mode patch, base_version issue de get_artifact). Ne jamais changer la clé de sauvegarde 'wallst-sim-v3' : les anciennes parties doivent se charger (ajouter les champs manquants dans ensureGame).
7. Ajouter une entrée au journal : titre, heure, ce qui a été mesuré (tableau avant/après), ce qui a changé, ce qui reste. Republier le journal.
8. Envoyer à Victor un message court via SendUserMessage (3 à 5 lignes : ce qui a changé, lien vers le journal).

## Cibles de réalisme et d'équilibre
- Effet de levier (corrélation rendement du jour / valeur absolue du lendemain) : entre −0,08 et −0,16.
- Corrélation moyenne entre actions : jours de forte baisse ≤ 0,35, jours de forte hausse ≤ 0,25, la baisse restant au-dessus de la hausse.
- Marché : volatilité annuelle 14 à 18 %, hausse de prix 6 à 10 % par an hors dividendes, 1 à 2,5 marchés baissiers par décennie.
- Stratégies gratuites : aucune au-delà de +5 % par an face au marché ni au-dessus de 85 % de parties gagnées. Hasard entre −1 et −3 %. Day trading très perdant.
- Jeu : au plus une fenêtre bloquante tous les 3 clics sur « +1 semaine ». Sur 3 parties, pas toujours le même vainqueur parmi les rivaux. Mémoire stable, sauvegarde < 2 Mo.

## Backlog (par priorité)
1. Corrélations entre actions trop élevées (0,46 / 0,38 contre 0,24 / 0,10 dans les vrais cours) : réduire la part du facteur marché sans casser la volatilité de l'indice (augmenter un peu la volatilité propre des actions, ou baisser le poids du facteur sectoriel).
2. « PER le plus bas » trop fiable (≈ 88 % des parties) : rendre les cycles croissance/valeur plus marqués ou réduire la vitesse de retour vers la juste valeur.
3. Rivaux très concentrés qui s'envolent sur 10 ans : plafonner la concentration (Kevin 3 à 4 lignes) ou ajouter un risque de ruine proportionné.
4. Missions qui expirent souvent pour certains styles : vérifier les taux de réussite par type dans gsim (stats.md / stats.mf) et ajuster.
5. Interface sur téléphone (390 px) et en mode sombre : vérifier lisibilité du panneau d'ordre, de la carte du marché et de la cérémonie.
6. Idées de contenu (une par cycle au plus, seulement si 1 à 5 vont bien) : introductions en Bourse de nouvelles sociétés, saison des résultats avec calendrier visuel, événements sectoriels plus variés.

## Garde-fous
- Ne toucher à rien d'autre que ces deux artefacts et le dossier de travail.
- Pas de dépendance externe nouvelle dans la page (bibliothèques, polices non Google).
- Si quelque chose casse et qu'on ne sait pas réparer dans le cycle : ne rien publier, le dire dans le journal et dans le message.
