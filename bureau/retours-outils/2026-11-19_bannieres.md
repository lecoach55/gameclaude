# Retours outils du 2026-11-19 — bannieres

- 2026-11-19 19:52 · monkey.py : presque inutilisable à 1280×800 en 3D sur 2 cœurs (23-29 actions en 5 min) et teste jeu/index.html, pas la version construite → corrigé le 19/11 (soir) : bannieres/outils/singe.json (singe commun, version construite, --pas 250) : 13 → 60-126 actions en 120 s à 1280×800, 448 avec --requete "?q3d=0"
- 2026-11-19 19:52 · banc.py : robots hors verrou (monkey, essais des sous-agents) ont faussé un banc de gels (+113 % au lieu de −6 %) ; verdict des gels corrigé (temps prime sur nb de programmes) → corrigé le 19/11 (soir) : veille dans banc.py (verrou.Veille), passe ou gel refait si un robot hors verrou tourne pendant la mesure, sinon écart DOUTEUX
