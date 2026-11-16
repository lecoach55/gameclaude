# Président de Club

Jeu de gestion d'un club de football français, du Régional 2 à la Ligue 1. Une seule page HTML/JS, sans dépendance.
Artefact : slug `e26f972e-fb7b-400e-846b-68da3d529144` (https://claude.ai/artifact/UxkiPA4AZZZUoYeCYtbYbM). Dernière version : v35 (1794800149-10ad), apps 2.9.0.

## Organisation
- `jeu/index.html` : le jeu complet (c'est le fichier publié en `index.html`, publish_files mode patch).
- `jeu/modules/` : copies des modules ajoutés au fil des versions (déjà intégrés dans index.html ; utiles pour relire) : territoire, vrais clubs (L1/L2/L3/N1 2026-27), aptitudes et rôles, missions du recruteur, sponsors, championnat persistant, formation, bilan, événements.
- `outils/patchs/` : scripts python qui ont inséré chaque module (remplacements exacts `rep()`).
- `outils/app-bureau/` : fabrication des apps Mac (Intel x64, `pack2.mjs`, installation par `Installer.command`) et Windows (`packwin.mjs` + `seticon.mjs`) avec Electron 33.2.1. Copier `jeu/index.html` dans `app/`, `npm i`, lancer les scripts.
- `mesures/JOURNAL.md` : journal de toutes les passes (versions, constats, chiffres de simulation).
- `references/` : captures de référence (bureau `_d`, mobile `_m`).

## Tests (copier `jeu/index.html` en `/home/claude/president/index.html`, ou adapter le chemin en argument)
- `node outils/run3.js <html> 3 8 <stratégie>` : parties automatiques (bot.js ; stratégies prudent, depensier, formation, equilibre). Repère : 1 à 4 fins de partie sur 12, 0 erreur. Lancer les 4 stratégies en parallèle.
- `outils/realsim2.js` : vrais clubs (Caen, Nîmes, GOAL FC, Lens) sur 5 saisons.
- `outils/abmatch.js` : A/B de 3000 matchs entre deux versions (ne pas changer les résultats sans le vouloir).
- `outils/evtest.js` : tous les événements dans 4 divisions (presse_conf en erreur = artefact connu du test).
- Tests ciblés : mistest (recruteur), sptest/spdrift (sponsors), lgtest (championnat persistant), reptest (notes), ytest (formation), bilantest, n1test, formtest (systèmes).
- Captures : `sweep.py` (11 onglets bureau + mobile, débordements), `shots*.py` (Playwright + /usr/bin/google-chrome).

## Règles
- Toujours laisser l'accès au profil d'un joueur en cliquant sur son nom (`plk(id,nom)`, `plAI(club,nom)`), et un bouton « Voir le profil » dans toute proposition qui concerne un joueur.
- Nouvelle mécanique = conseil du staff (`staffAdvice`) + délégation possible (`DELEG`).
- Victor aime les petits événements aléatoires : en ajouter régulièrement (`EVENTS`, avec `cond`, `make`, `text`, `ch`).
- Ne pas changer l'équilibre sans lots de contrôle avant/après.
- Fluidité : éviter backdrop-filter, fonds fixes, grandes ombres (Mac Intel) ; mode « Affichage allégé » actif par défaut dans les apps.
