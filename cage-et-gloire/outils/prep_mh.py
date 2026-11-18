#!/usr/bin/env python3
"""Combattant CC0 à partir de MakeHuman 1.x (demande dec1118-cage) : maillage « body » + cibles de corps,
squelette réduit aux noms mixamorig utilisés par les poses d'arene.js, poids MakeHuman regroupés.
Ressources (CC0 1.0) téléchargées par outils/mh_dl.py.
Usage : python3 -I outils/mh_dl.py /tmp/mh && python3 -I outils/prep_mh.py /tmp/mh /tmp/mh_brut.glb [homme|femme] [muscle 0-1]
        puis node outils/prep_perso.mjs /tmp/mh_brut.glb 11000 jeu/perso_mh.glb  (simplification + meshopt)
"""
import sys, os, json, struct, math
import numpy as np

src, out = sys.argv[1], sys.argv[2]
sexe = sys.argv[3] if len(sys.argv) > 3 else 'homme'
muscle = float(sys.argv[4]) if len(sys.argv) > 4 else .75
P = lambda f: os.path.join(src, f)

# ---- maillage de base
V = []; faces = []; grp = None
for l in open(P('base.obj')):
    if l.startswith('v '):
        V.append([float(x) for x in l.split()[1:4]])
    elif l.startswith('g '):
        grp = l.split()[1]
    elif l.startswith('f ') and grp == 'body':
        faces.append([int(t.split('/')[0]) - 1 for t in l.split()[1:]])
V = np.array(V, dtype=np.float64)

# ---- cibles (forme du corps)
def cible(nom, w):
    if w == 0 or not os.path.exists(P(nom)):
        return
    for l in open(P(nom)):
        if l[:1].isdigit():
            a = l.split(); V[int(a[0])] += w * np.array([float(a[1]), float(a[2]), float(a[3])])
g = 'male' if sexe == 'homme' else 'female'
for eth in ('caucasian', 'african', 'asian'):
    cible(f'{eth}-{g}-young.target', 1 / 3)
# muscle : 0,5 = moyen, 1 = maximum (cible maxmuscle pondérée par (m-0,5)/0,5)
cible(f'universal-{g}-young-maxmuscle-averageweight.target', max(0, (muscle - .5) / .5))

# ---- squelette MakeHuman
sk = json.load(open(P('default.mhskel')))
J = sk['joints']
def jp(nom):
    return V[J[nom]].mean(axis=0)
MHB = sk['bones']

# os mixamo : tête (articulation MakeHuman) et parent
OS = [
    ('Hips', None, 'root____head'),
    ('Spine', 'Hips', 'spine05____head'), ('Spine1', 'Spine', 'spine03____head'), ('Spine2', 'Spine1', 'spine01____head'),
    ('Neck', 'Spine2', 'neck01____head'), ('Head', 'Neck', 'head____head'), ('HeadTop_End', 'Head', 'head____tail'),
]
for c, s in (('Left', 'L'), ('Right', 'R')):
    OS += [(c + 'Shoulder', 'Spine2', f'clavicle.{s}____head'), (c + 'Arm', c + 'Shoulder', f'upperarm01.{s}____head'),
           (c + 'ForeArm', c + 'Arm', f'lowerarm01.{s}____head'), (c + 'Hand', c + 'ForeArm', f'wrist.{s}____head'),
           (c + 'HandEnd', c + 'Hand', f'finger3-3.{s}____tail'),
           (c + 'UpLeg', 'Hips', f'upperleg01.{s}____head'), (c + 'Leg', c + 'UpLeg', f'lowerleg01.{s}____head'),
           (c + 'Foot', c + 'Leg', f'foot.{s}____head'), (c + 'ToeBase', c + 'Foot', f'foot.{s}____tail'),
           (c + 'ToeEnd', c + 'ToeBase', f'toe3-3.{s}____tail')]
NOMS = [o[0] for o in OS]; IDX = {n: i for i, n in enumerate(NOMS)}

# os MakeHuman → os mixamo (le premier ancêtre listé ici)
DIRECT = {'root': 'Hips', 'pelvis': 'Hips', 'spine05': 'Spine', 'spine04': 'Spine', 'spine03': 'Spine1', 'spine02': 'Spine1',
          'spine01': 'Spine2', 'breast': 'Spine2', 'neck01': 'Neck', 'neck02': 'Neck', 'neck03': 'Neck', 'head': 'Head',
          'clavicle': 'Shoulder', 'shoulder01': 'Shoulder', 'upperarm01': 'Arm', 'upperarm02': 'Arm', 'lowerarm01': 'ForeArm',
          'lowerarm02': 'ForeArm', 'wrist': 'Hand', 'upperleg01': 'UpLeg', 'upperleg02': 'UpLeg', 'lowerleg01': 'Leg',
          'lowerleg02': 'Leg', 'foot': 'Foot'}
def cote(n):
    return 'Left' if n.endswith('.L') else 'Right' if n.endswith('.R') else ''
def vers(n):
    b = n
    while b:
        base = b.split('.')[0]
        if base in DIRECT:
            d = DIRECT[base]
            if d in ('Shoulder', 'Arm', 'ForeArm', 'Hand', 'UpLeg', 'Leg', 'Foot'):
                d = cote(b) + d
            return d
        if base.startswith('toe'):
            return cote(b) + 'ToeBase'
        b = MHB[b]['parent']
    return 'Hips'

W = json.load(open(P('default_weights.mhw')))['weights']
nv = len(V)
acc = [dict() for _ in range(nv)]
for b, L in W.items():
    m = IDX[vers(b)]
    for vi, w in L:
        if vi < nv:
            acc[vi][m] = acc[vi].get(m, 0) + w

# ---- sommets utilisés par le corps, triangulation
used = sorted({i for f in faces for i in f}); remap = {o: n for n, o in enumerate(used)}
tris = []
for f in faces:
    f = [remap[i] for i in f]
    for k in range(1, len(f) - 1):
        tris.append((f[0], f[k], f[k + 1]))
tris = np.array(tris, dtype=np.uint32)

# échelle : 1,80 m (homme) / 1,70 m (femme), pieds à y = 0, regard vers +Z
pos = V[used].copy()
H = pos[:, 1].max() - pos[:, 1].min(); ymin = pos[:, 1].min()
k = (1.80 if sexe == 'homme' else 1.70) / H
pos[:, 1] -= ymin; pos *= k
def tw(p):
    p = np.array(p, dtype=np.float64).copy(); p[1] -= ymin; return p * k
if pos[:, 2].mean() < -10:  # sécurité
    pass

# normales
nrm = np.zeros_like(pos)
a, b, c = pos[tris[:, 0]], pos[tris[:, 1]], pos[tris[:, 2]]
fn = np.cross(b - a, c - a)
for i in range(3):
    np.add.at(nrm, tris[:, i], fn)
nrm /= np.maximum(np.linalg.norm(nrm, axis=1, keepdims=True), 1e-9)

# poids : 4 influences, normalisés
jn = np.zeros((len(used), 4), np.uint16); wt = np.zeros((len(used), 4), np.float32)
sans = 0
for n, o in enumerate(used):
    it = sorted(acc[o].items(), key=lambda x: -x[1])[:4]
    s = sum(w for _, w in it)
    if s <= 0:
        sans += 1; it = [(IDX['Hips'], 1.0)]; s = 1
    for j, (bi, w) in enumerate(it):
        jn[n, j] = bi; wt[n, j] = w / s

# os : positions monde
HW = {}
for nom, par, art in OS:
    try:
        HW[nom] = tw(jp(art))
    except KeyError:
        print('articulation absente', art); raise
def rot(a, b):
    a = a / np.linalg.norm(a); b = b / np.linalg.norm(b); v = np.cross(a, b); c = float(np.dot(a, b))
    if np.linalg.norm(v) < 1e-9: return np.eye(3)
    vx = np.array([[0, -v[2], v[1]], [v[2], 0, -v[0]], [-v[1], v[0], 0]])
    return np.eye(3) + vx + vx @ vx * (1 / (1 + c))
def autour(R, p):
    M = np.eye(4); M[:3, :3] = R; M[:3, 3] = p - R @ p; return M
# pose en T comme le mannequin Xbot (bras horizontaux, paumes vers le bas) : les détails peints (gants, bandages)
# et les seuils de regions() sont calculés sur la position de repos. Peau déformée par les poids MakeHuman.
MB = {n: np.eye(4) for n in NOMS}
ap = lambda M, p: (M @ np.append(p, 1))[:3]
for c, sx in (('Left', 1), ('Right', -1)):
    ch = [c + 'Arm', c + 'ForeArm', c + 'Hand', c + 'HandEnd']
    for k in range(3):
        a, b = ch[k], ch[k + 1]
        Ma = MB[a]; pa = ap(Ma, HW[a]); pb = ap(Ma, HW[b])
        M = autour(rot(pb - pa, np.array([sx, 0, 0])), pa) @ Ma
        for n in ch[k:]: MB[n] = M
    for n in ch: pass
pos4 = np.c_[pos, np.ones(len(pos))]
newp = np.zeros_like(pos)
for j in range(4):
    for bi in np.unique(jn[:, j]):
        m = jn[:, j] == bi
        newp[m] += wt[m, j:j + 1] * (pos4[m] @ MB[NOMS[bi]].T)[:, :3]
pos = newp
for n in NOMS: HW[n] = ap(MB[n], HW[n])
# cou et tête : mêmes directions de repos que Xbot (les poses visent Spine2→Neck→Head)
def dirx(v): v = np.array(v, float); return v / np.linalg.norm(v)
Lh = np.linalg.norm(HW['Head'] - HW['Neck'])
HW['Neck'] = HW['Head'] - dirx([0, 9.62, 1.69]) * Lh
nrm = np.zeros_like(pos)
a, b, c = pos[tris[:, 0]], pos[tris[:, 1]], pos[tris[:, 2]]
fn = np.cross(b - a, c - a)
for i in range(3):
    np.add.at(nrm, tris[:, i], fn)
nrm /= np.maximum(np.linalg.norm(nrm, axis=1, keepdims=True), 1e-9)
for x, y in (('Spine2', 'Neck'), ('Neck', 'Head'), ('LeftArm', 'LeftForeArm'), ('LeftForeArm', 'LeftHand'), ('LeftUpLeg', 'LeftLeg'), ('LeftLeg', 'LeftFoot'), ('LeftFoot', 'LeftToeBase')):
    print(x, '→', y, np.round(dirx(HW[y] - HW[x]), 2))
print('os', len(NOMS), 'sommets', len(used), 'triangles', len(tris), 'sans poids', sans, 'hauteur', round(pos[:, 1].max(), 3),
      'Z moyen', round(pos[:, 2].mean(), 3), 'tête', np.round(HW['Head'], 3), 'main G', np.round(HW['LeftHand'], 3))

# centrage : bassin en x = z = 0 (comme xbot)
c0 = HW['Hips'].copy(); c0[1] = 0
pos -= c0
for n in HW: HW[n] = HW[n] - c0

# ---- GLB
buf = bytearray(); views = []; accs = []
def add(arr, target=None, comp=5126, typ='VEC3', mn=False):
    global buf
    while len(buf) % 4: buf += b'\0'
    off = len(buf); by = arr.tobytes(); buf += by
    v = {'buffer': 0, 'byteOffset': off, 'byteLength': len(by)}
    if target: v['target'] = target
    views.append(v)
    a = {'bufferView': len(views) - 1, 'componentType': comp, 'count': int(arr.shape[0]), 'type': typ}
    if mn: a['min'] = arr.min(axis=0).tolist(); a['max'] = arr.max(axis=0).tolist()
    accs.append(a); return len(accs) - 1
iP = add(pos.astype(np.float32), 34962, mn=True); iN = add(nrm.astype(np.float32), 34962)
iJ = add(jn, 34962, 5123, 'VEC4'); iW = add(wt, 34962, 5126, 'VEC4')
iI = add(tris.reshape(-1).astype(np.uint32), 34963, 5125, 'SCALAR')
ibm = np.zeros((len(NOMS), 16), np.float32)
for i, n in enumerate(NOMS):
    m = np.eye(4); m[:3, 3] = -HW[n]; ibm[i] = m.T.reshape(-1)
iB = add(ibm, None, 5126, 'MAT4')
nodes = []
for i, (nom, par, _) in enumerate(OS):
    t = HW[nom] - (HW[par] if par else 0)
    nd = {'name': 'mixamorig:' + nom, 'translation': [float(x) for x in t]}
    nodes.append(nd)
for i, (nom, par, _) in enumerate(OS):
    if par:
        nodes[IDX[par]].setdefault('children', []).append(i)
nodes.append({'name': 'Corps', 'mesh': 0, 'skin': 0})
nodes.append({'name': 'Armature', 'children': [len(nodes) - 1, 0]})
gl = {'asset': {'version': '2.0', 'generator': 'prep_mh.py (MakeHuman CC0)'}, 'scene': 0,
      'scenes': [{'nodes': [len(nodes) - 1]}], 'nodes': nodes,
      'meshes': [{'name': 'Corps', 'primitives': [{'attributes': {'POSITION': iP, 'NORMAL': iN, 'JOINTS_0': iJ, 'WEIGHTS_0': iW}, 'indices': iI}]}],
      'skins': [{'joints': list(range(len(NOMS))), 'inverseBindMatrices': iB, 'skeleton': 0}],
      'accessors': accs, 'bufferViews': views, 'buffers': [{'byteLength': 0}]}
while len(buf) % 4: buf += b'\0'
gl['buffers'][0]['byteLength'] = len(buf)
js = json.dumps(gl).encode()
while len(js) % 4: js += b' '
with open(out, 'wb') as f:
    f.write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(buf)))
    f.write(struct.pack('<II', len(js), 0x4E4F534A)); f.write(js)
    f.write(struct.pack('<II', len(buf), 0x004E4942)); f.write(buf)
print(out, len(buf) // 1024, 'Kio')
