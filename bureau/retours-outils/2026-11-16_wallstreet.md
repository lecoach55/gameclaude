# Retours outils du 2026-11-16 — wallstreet

- 2026-11-16 12:03 · explore.py : BLOCAGE signalé au début sur ordinateur alors que le robot ne fait que toucher les lignes du tableau (séance et opérations inchangées) — fausse alerte, aussi sur l'ancienne version
- 2026-11-16 15:31 · explore.py : le contrôle de débordement ne regarde que la largeur de la page ; il ne voit pas un contenu coupé dans un bloc qui défile seul (#aside, tableau .tw) — la fiche coupée de 26 px à 360 px est passée inaperçue
