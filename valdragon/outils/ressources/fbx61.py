# Convertit un FBX binaire 6.1 (Mixamo ancien format) en JSON simple pour reconstruction three.js.
# usage: python3 -I fbx61.py in.fbx outdir
import sys, os, json, struct
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fbxdump import load

def child(n, name):
    for c in n[2]:
        if c[0] == name: return c
    return None
def arr(n):
    p = n[1]
    return p[0] if p and isinstance(p[0], list) else p
def children(n, name): return [c for c in n[2] if c[0] == name]
def prop60(n, key):
    p = child(n, 'Properties60')
    if not p: return None
    for c in p[2]:
        if c[1] and c[1][0] == key: return c[1][3:]
    return None

def main(src, outdir):
    os.makedirs(outdir, exist_ok=True)
    ver, top = load(src)
    T = {n[0]: n for n in top}
    objs = T['Objects'][2]
    models = {}; clusters = {}; skins = {}; textures = {}; videos = {}; materials = {}; poses = []
    for o in objs:
        kind, props = o[0], o[1]
        name = props[0] if props else ''
        if kind == 'Model': models[name] = o
        elif kind == 'Deformer' and props[1] == 'Cluster': clusters[name] = o
        elif kind == 'Deformer' and props[1] == 'Skin': skins[name] = o
        elif kind == 'Texture': textures[name] = o
        elif kind == 'Video': videos[name] = o
        elif kind == 'Material': materials[name] = o
        elif kind == 'Pose': poses.append(o)
    conns = [c[1] for c in T['Connections'][2] if c[0] == 'Connect']
    parent = {}; links = []
    for c in conns:
        if c[0] == 'OO': links.append((c[1], c[2]))
        elif c[0] == 'OP': links.append((c[1], c[2]))
    for a, b in links:
        if a in models and (b in models or b == 'Model::Scene'): parent[a] = b
    # pose de liaison (matrices globales)
    bind = {}
    for p in poses:
        for pn in children(p, 'PoseNode'):
            nm = child(pn, 'Node')[1][0]; mt = arr(child(pn, 'Matrix'))
            bind.setdefault(nm, mt)
    bones = [n for n, m in models.items() if m[1][1] in ('LimbNode', 'Limb', 'Null') and n != 'Model::Scene']
    # textures : nom de fichier -> contenu embarqué
    vid_by_file = {}
    for vn, v in videos.items():
        fn = child(v, 'RelativeFilename') or child(v, 'Filename')
        ct = child(v, 'Content')
        if fn and ct and ct[1] and isinstance(ct[1][0], (bytes, bytearray)) and len(ct[1][0]) > 100:
            vid_by_file[os.path.basename(fn[1][0].replace('\\', '/'))] = ct[1][0]
    tex_files = {}
    for tn, t in textures.items():
        fn = child(t, 'RelativeFilename') or child(t, 'FileName')
        tex_files[tn] = os.path.basename(fn[1][0].replace('\\', '/')) if fn else ''
    saved = {}
    for fn, data in vid_by_file.items():
        out = os.path.join(outdir, fn); open(out, 'wb').write(data); saved[fn] = out
    # textures reliées à chaque modèle
    mesh_tex = {}
    mat_tex = {}
    for a, b in links:
        if a in textures and b in materials: mat_tex.setdefault(b, []).append(tex_files[a])
    for a, b in links:
        if a in textures and b in models: mesh_tex.setdefault(b, []).append(tex_files[a])
        if a in materials and b in models: mesh_tex.setdefault(b, []).extend(mat_tex.get(a, []))
    # clusters -> os, skin -> mesh
    clus_bone = {}; clus_skin = {}; skin_mesh = {}
    for a, b in links:
        if a in models and b in clusters: clus_bone[b] = a
        if a in clusters and b in skins: clus_skin[a] = b
        if a in skins and b in models: skin_mesh[a] = b
    meshes = []
    for mn, m in models.items():
        if m[1][1] != 'Mesh': continue
        V = arr(child(m, 'Vertices')); PI = arr(child(m, 'PolygonVertexIndex'))
        ln = child(m, 'LayerElementNormal'); lu = child(m, 'LayerElementUV')
        nrm = arr(child(ln, 'Normals')) if ln else None
        nmap = child(ln, 'MappingInformationType')[1][0] if ln else ''
        nref = child(ln, 'ReferenceInformationType')[1][0] if ln else ''
        uv = arr(child(lu, 'UV')) if lu else None
        uvi = arr(child(lu, 'UVIndex')) if lu and child(lu, 'UVIndex') else None
        umap = child(lu, 'MappingInformationType')[1][0] if lu else ''
        # poids par point de contrôle
        nv = len(V) // 3; W = [[] for _ in range(nv)]
        bone_list = []
        for cn, sk in clus_skin.items():
            if skin_mesh.get(sk) != mn or cn not in clus_bone: continue
            c = clusters[cn]; ix = child(c, 'Indexes'); wt = child(c, 'Weights')
            if not ix: continue
            bn = clus_bone[cn]
            tl = arr(child(c, 'TransformLink')); tr = arr(child(c, 'Transform'))
            bind.setdefault(bn, tl)
            bi = len(bone_list); bone_list.append(bn)
            for i, w in zip(arr(ix), arr(wt)): W[i].append((w, bn))
            meshT = tr
        pos = []; nor = []; uvs = []; sk_i = []; sk_w = []
        poly = []; pv = 0
        def corner(k, cp):
            pos.extend(V[cp*3:cp*3+3])
            if nrm is not None:
                j = k if nmap == 'ByPolygonVertex' else cp
                nor.extend(nrm[j*3:j*3+3])
            if uv is not None:
                j = (uvi[k] if uvi is not None and nref != '' and umap == 'ByPolygonVertex' and uvi is not None else (k if umap == 'ByPolygonVertex' else cp))
                if uvi is not None and umap == 'ByPolygonVertex': j = uvi[k]
                uvs.extend(uv[j*2:j*2+2])
            ws = sorted(W[cp], reverse=True)[:4]; s = sum(w for w, _ in ws) or 1
            sk_i.append([b for _, b in ws] + [None] * (4 - len(ws))); sk_w.extend([w / s for w, _ in ws] + [0] * (4 - len(ws)))
        k0 = 0; cur = []
        for k, v in enumerate(PI):
            end = v < 0; cp = ~v if end else v; cur.append((k, cp))
            if end:
                for t in range(1, len(cur) - 1):
                    for (kk, cc) in (cur[0], cur[t], cur[t + 1]): corner(kk, cc)
                cur = []
        meshes.append({'name': mn.split('::')[-1], 'pos': pos, 'nor': nor, 'uv': uvs, 'skin': sk_i, 'w': sk_w, 'tex': mesh_tex.get(mn, []),
                       'lcl': [prop60(m, 'Lcl Translation'), prop60(m, 'Lcl Rotation'), prop60(m, 'Lcl Scaling')], 'bindT': bind.get(mn)})
    bl = [{'name': b.split('::')[-1], 'parent': (parent.get(b, '').split('::')[-1] if parent.get(b) in bones else None), 'bind': bind.get(b),
           'lcl': [prop60(models[b], 'Lcl Translation'), prop60(models[b], 'Lcl Rotation'), prop60(models[b], 'PreRotation')]} for b in bones]
    for m in meshes:
        m['skin'] = [[(x.split('::')[-1] if x else None) for x in s] for s in m['skin']]
    json.dump({'bones': bl, 'meshes': meshes, 'textures': list(saved.keys())}, open(os.path.join(outdir, 'model.json'), 'w'))
    print('bones', len(bl), 'meshes', [(m['name'], len(m['pos']) // 3, m['tex']) for m in meshes], 'tex', list(saved.keys()))

main(sys.argv[1], sys.argv[2])
