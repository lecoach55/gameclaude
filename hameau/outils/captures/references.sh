#!/bin/sh
# Captures de vues fixes du village de test (graine/sauvegarde fixes) pour comparaison avec compare.py
# usage : sh references.sh dossier_sortie [jeu.html]
OUT=${1:-/tmp/captures}; JEU=${2:-/tmp/hameau.html}; D=$(dirname "$0")
mkdir -p "$OUT"; JEU=$JEU CAPT=$OUT python3 "$D/t14.py" '[["jour",30,29,22,874,"pan"],["nuit",30,29,22,893,"pan"],["hiver",30,29,22,300,"pan"],["automne",30,29,22,972,"pan"],["large",28,28,60,874,"pan"],["gros_plan",33,26,8,874,"pan"]]'
for f in "$OUT"/m_*.png; do mv "$f" "$OUT/$(basename "$f" | sed 's/^m_//')"; done
