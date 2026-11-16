#!/bin/sh
# Prépare un dossier de travail : le jeu + tous les outils au même endroit (les outils s'attendent à tourner à côté du jeu)
# usage : sh valdragon/outils/preparer.sh /home/claude/t3d
set -e
D=${1:-/home/claude/t3d}; R=$(cd "$(dirname "$0")/.." && pwd)
mkdir -p "$D"; cp -r "$R/jeu/." "$D/"; for s in mesure tests ressources; do cp "$R/outils/$s/"* "$D/"; done; mkdir -p /home/claude/outils && cp "$R/../outils-communs/"*.py "$R/../outils-communs/"*.html /home/claude/outils/ 2>/dev/null || true
cd "$D" && npm install --silent && pip install --break-system-packages -q playwright pillow numpy scipy >/dev/null 2>&1 || true
python3 -m playwright install chromium >/dev/null 2>&1 || true
python3 build.py local && echo "Prêt : $D (serveur : sh srv.sh, puis http://localhost:8765/index_local.html)"
