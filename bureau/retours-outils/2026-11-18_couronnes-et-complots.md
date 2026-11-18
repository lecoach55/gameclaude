# Retours outils du 2026-11-18 — couronnes-et-complots

- 2026-11-18 14:14 · banc.py : couronnes-et-complots/outils/banc.json ne mesure rien (scènes sans requestAnimationFrame → 0,00 ms/img partout, seul render_ms compte) ; banc.py -h plante (FileNotFoundError '-h')
- 2026-11-18 15:28 · perf.py : le scénario zoom ne mesure que la transformation CSS du geste, jamais le redessin à l'engagement du viewBox (ajouter un scénario « engage » applyVB(true)) ; fullgame.py inutilisable au téléphone (robot tactile du testeur à reprendre : scratchpad testeur/robot.py)
