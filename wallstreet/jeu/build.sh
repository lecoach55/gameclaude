#!/bin/sh
# Assemble la page unique publiée : wallstreet/jeu/build.sh [sortie.html]  (défaut : /home/claude/bourse6.html)
D=$(cd "$(dirname "$0")" && pwd); OUT=${1:-/home/claude/bourse6.html}
python3 - "$D" "$OUT" <<'P'
import sys;d,o=sys.argv[1],sys.argv[2];r=lambda f:open(d+'/'+f,encoding='utf8').read()
u=r('ui3.html').replace('/*BASECSS*/',r('base.css')).replace('/*DATA*/',r('simdata.json')).replace('/*ENGINE*/',r('engine.js')).replace('/*GAME*/',r('game.js'))
open(o,'w',encoding='utf8').write(u);print('ok',o,len(u)//1024,'Kio')
P
