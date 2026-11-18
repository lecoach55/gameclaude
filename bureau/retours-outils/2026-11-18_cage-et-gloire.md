# Retours outils du 2026-11-18 — cage-et-gloire

- 2026-11-18 10:12 · banc.py : avec banc.json à chemin absolu (/home/claude/banc/cg.html), --avant HEAD sans --construire s'arrête « page APRÈS introuvable » ; ajouter --construire d'office quand la page n'existe pas, ou le dire dans le message
- 2026-11-18 10:18 · captures.py --avant HEAD~1 --construire avec "fichier": "/home/claude/cg.html" : met de côté tout /home/claude (dossier parent de la page) puis plante en le remettant (shutil.Error, liens déjà présents) — dossier de travail intact mais risque réel ; refuser un dossier parent qui n'est pas propre à la page
