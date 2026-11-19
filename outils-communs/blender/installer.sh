#!/bin/sh
# Installe Blender 5 (module Python « bpy », rendu Cycles sur processeur) dans la session cloud.
# Usage : sh outils-communs/blender/installer.sh   → crée /home/claude/bpyenv (≈ 1 min, 374 Mo)
# Puis : /home/claude/bpyenv/bin/python mon_script.py   (import bpy)
set -e
ENV=${1:-/home/claude/bpyenv}
if [ -x "$ENV/bin/python" ] && "$ENV/bin/python" -c "import bpy" 2>/dev/null; then echo "bpy déjà prêt : $ENV"; exit 0; fi
command -v uv >/dev/null || pip install -q uv --break-system-packages
uv venv -q -p 3.11 "$ENV"
uv pip install -q -p "$ENV/bin/python" bpy
"$ENV/bin/python" -c "import bpy;print('Blender',bpy.app.version_string,'prêt :',sys.executable)" 2>/dev/null || "$ENV/bin/python" -c "import bpy,sys;print('Blender',bpy.app.version_string,'prêt :',sys.executable)"
