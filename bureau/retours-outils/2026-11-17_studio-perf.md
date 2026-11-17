# Retours outils du 2026-11-17 — studio-perf

- 2026-11-17 15:54 · banc.py : n'écrit le JSON qu'à la fin (20-33 min par jeu 3D à CPU ×4, sans temps restant ni résultat partiel) ; écrire au fil des scènes
- 2026-11-17 15:54 · banc.py : pas de redirection du CDN (Hameau charge Three.js sur jsDelivr, bloqué) : réglage contourné par sed + lien vers /home/claude/t3d ; ajouter une clé routes
- 2026-11-17 15:54 · banc.py : en temps figé le gel de compilation après un changement de qualité est absorbé par la préparation réelle ; il manque une mesure « 1re image après changement » (script gel.py à part)
- 2026-11-17 15:54 · banc.py : machine à 2 cœurs, deux bancs en parallèle faussent les ms (charge 5-12) ; un verrou ou un avertissement de charge éviterait ça
