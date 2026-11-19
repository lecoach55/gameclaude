# Bêtes de Bannières rendues dans Blender (essai du 19/11/2026)
- `export_glb.py ids dossier` : fige une créature de `outils/studio/quad.js` (pose idle) en GLB (lancer depuis /home/claude/t3d préparé par valdragon/outils/preparer.sh).
- Les GLB sont allégés (textures 1024 JPEG, Draco) avec `npx gltf-transform resize/jpeg/weld/draco` puis rangés dans `sources/`.
- Blender (Mac de Victor, pont MCP for Blender) les télécharge depuis GitHub, ajoute pelage et lumière Cycles, et rend les images.
