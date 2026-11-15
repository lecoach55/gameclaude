#!/bin/sh
# Simulations appariées : mêmes graines, 5 profils de joueurs, ancienne version contre nouvelle.
# Usage : sh apparie.sh <dossier_jeu_ancien> <dossier_jeu_nouveau> [jours=60] [graines=1,2,3,4,5,6]
# Chaque dossier doit contenir sim.js et bot.js (ex. : un ancien commit extrait avec git worktree, et hameau/jeu).
set -e
ICI=$(cd "$(dirname "$0")" && pwd)
A=$(cd "$1" && pwd); B=$(cd "$2" && pwd); J=${3:-60}; G=${4:-1,2,3,4,5,6}
T=$(mktemp -d)
for v in ancien nouveau; do
  src=$A; [ $v = nouveau ] && src=$B
  mkdir -p $T/$v && cp $ICI/nuit_day.js $T/$v/ && cp $src/sim.js $T/$v/sim.js
  sed "s#require('./sim.js')#require(process.env.SIMP)#" $src/bot.js > $T/$v/bot_fix.js
  for p in expert novice lazy greedy chaotic; do
    SIMP=$T/$v/sim.js node $T/$v/nuit_day.js --variant=base --prof=$p --days=$J --seeds=$G > $T/${v}_$p.txt &
  done
done
wait
python3 - "$T" <<'EOF'
import json,sys
T=sys.argv[1]
print(f"{'profil':9}| {'version':8}| pop | famine (j) | froid (j) | départs | bonheur")
for p in ['expert','novice','lazy','greedy','chaotic']:
  for v in ['ancien','nouveau']:
    R=[json.loads(l) for l in open(f'{T}/{v}_{p}.txt')];n=len(R) or 1
    m=lambda k:sum(r[k] for r in R)/n
    print(f"{p:9}| {v:8}| {m('pop'):3.0f} | {m('famine'):10.2f} | {m('froid'):9.2f} | {m('dep'):7.1f} | {m('happy'):3.0f}")
EOF
rm -rf $T
