# Retours outils du 2026-11-18 — bannieres

- 2026-11-18 20:41 · parcours.py et monkey.py : délais fixes de 60 s qui échouent quand d'autres agents chargent la machine (testeur : passé à 600 s dans sa copie)
- 2026-11-18 20:41 · verrou.py : annonce « machine libre » pendant que d'autres Chromium tournent (technicien fluidité) → corrigé le 18/11 (soir) par l'équipe Outils : `verrou.py etat` liste les navigateurs hors verrou (lanceur, % cpu, actif/calme/orphelin) ; un banc attend la fin des actifs (`--attente-navigateurs 600`) et note ceux qui restent dans sa sortie
