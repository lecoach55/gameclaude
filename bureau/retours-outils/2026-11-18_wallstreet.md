# Retours outils du 2026-11-18 — wallstreet

- 2026-11-18 14:11 · banc.py --avant HEAD --construire : échoue (FileNotFoundError) si le dossier de la page (/home/claude/banc) n'existe pas ; créer le dossier d'office
- 2026-11-18 15:25 · gsim.py : impossible d'apparier avant/après à graine égale — le marché (engine rnd) et les animations (confettis, feux d'artifice du ciel) tirent tous dans Math.random, donc chaque image change la suite des cours ; profils avec actions (yolo, hasard) : bruit ±10-15 % sur 10 parties. Prévoir un générateur à graine propre au marché
- 2026-11-18 15:25 · compat_test.py : lit /home/claude/bourse_old.html sans le dire ni le construire (FileNotFoundError) ; prévoir --avant HEAD comme banc.py
