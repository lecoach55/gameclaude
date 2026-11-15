#!/bin/bash
# Installe Président de Club dans Applications et l'autorise à s'ouvrir.
cd "$(dirname "$0")"
APP="President de Club.app"
echo "Installation de Président de Club…"
rm -rf "/Applications/$APP" "/Applications/Président de Club.app"
cp -R "$APP" /Applications/ || { echo "Impossible de copier dans Applications."; read -n1; exit 1; }
xattr -cr "/Applications/$APP"
codesign --force --deep -s - "/Applications/$APP" >/dev/null 2>&1
echo "C'est prêt ! Ouverture du jeu…"
open "/Applications/$APP"
