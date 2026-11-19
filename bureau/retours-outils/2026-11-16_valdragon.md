# Retours outils du 2026-11-16 — valdragon

- 2026-11-16 14:57 · preparer.sh : lance 'playwright install chromium' alors que Chromium est préinstallé (risque de version incompatible) ; compileAsync three r160 plante (isReady), remplacé par compA → corrigé le 19/11 (midi) côté communs : `outils-communs/preparer.py` prépare le poste sans jamais lancer « playwright install » (Chromium préinstallé lancé pour vérifier) ; preparer.sh du jeu à aligner (demande posée)
