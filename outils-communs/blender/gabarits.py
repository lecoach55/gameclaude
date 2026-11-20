"""Gabarits de creature.py : une recette courte (« gabarit » + quelques proportions) devient une recette complète
(squelette, rayons, pièces, ailes, 4 animations Idle / Attack / Hit / Death). Python pur, sans Blender : testable seul.

  "gabarit": {"type": "quadrupede", "garrot": 1.0, "longueur": 0.9, "pied": "sabot", "attaque": "cabrer", …}

Type « quadrupede » (cheval, loup, lion, griffon, pégase, centaure) — repère de creature.py (X = avant, Z = haut, sol z = 0).
Toutes les clés sont facultatives (valeurs par défaut = un cheval de 1 u au garrot) :
  garrot       hauteur au garrot (1.0)              longueur   distance épaule-hanche (0.9)
  torse/ventre/croupe  rayons du tronc (0.27/0.25/0.26)        aplati  section du tronc (1 = ronde)
  ecart        demi-écart des pattes en y (0.13)     pattes     {"r": [haut, bas], "r_ar": [..], "pied": r du pied}
  pied         "sabot" | "patte" (coussinet + griffes) | "serre" (avant en serres d'aigle, arrière en pattes : griffon)
  cou          {"longueur": .55, "angle": 55, "r": [.21, .11]}   angle en degrés au-dessus de l'horizontale
  tete         {"longueur": .5, "angle": -55, "r": [.12, .07], "machoire": false, "bec": false}
  oreilles     longueur (0.12 ; 0 = sans)            yeux      {"r": .028, "couleur": "#120c08"}
  queue        {"longueur": .55, "angle": -55, "r": [.06, .025], "segments": 3, "meches": 0, "couleur": None}
  criniere     {"meches": 9, "longueur": .16, "couleur": "#…"} (absent = sans)
  ailes        {"envergure": 1.1, "largeur": .5, "plumes": 9, "couleur": "#…", "pennes": "#…", "ouverture": 0.35}
               ailes de plumes (griffon, pégase) : maillage plat lié à 3 os aile1-3.L/.R hors de la peau
  buste        {"hauteur": .62, "r": .17, "tete": .13, "peau": "#c89a78", "bras": true} : torse humain à la place
               du cou (centaure) ; « cou » et « tete » deviennent buste / poitrine_h / tete_h, bras_h / avbras_h
  attaque      "cabrer" (sabots), "morsure" (élan + mâchoire), "griffes" (dressé, serres en avant, ailes levées),
               "frappe" (buste : bras qui frappent)
  couleurs     {"sabot": "#…", "pattes": "#…", "nez": "#…", "griffes": "#…", "bec": "#…"}

Ensuite la recette complète l'emporte : un os de "os" qui porte le nom d'un os du gabarit en remplace les champs
(ex. {"nom": "cou", "r": [.2, .12]}), un nouveau nom s'ajoute ; "pieces" s'ajoutent ; une animation de "animations"
remplace celle du gabarit du même nom. Limite : déplacer un os du gabarit ne déplace pas les pièces posées en coordonnées
absolues (yeux, oreilles, crinière) : les retoucher aussi, ou changer plutôt les proportions du gabarit. creature.py --recette-complete sortie.json écrit le résultat pour le retoucher.
"""
import copy
import json
import math

DEFAUT_QUAD = {
    'garrot': 1.0, 'longueur': 0.9, 'torse': 0.27, 'ventre': 0.25, 'croupe': 0.26, 'ecart': 0.13,
    'pied': 'sabot', 'attaque': None, 'oreilles': 0.12,
}


class GabaritInvalide(ValueError):
    pass


def _v(a, b, t=1.0):
    return [a[i] + (b[i] - a[i]) * t for i in range(3)]


def _r(p, n=3):
    return [round(float(c), n) for c in p]


def _dir(angle_deg, l):
    a = math.radians(angle_deg)
    return [math.cos(a) * l, 0.0, math.sin(a) * l]


def _plus(a, d):
    return [a[0] + d[0], a[1] + d[1], a[2] + d[2]]


def quadrupede(g):
    """Paramètres du gabarit → (os, pièces, animations)."""
    G = dict(DEFAUT_QUAD); G.update({k: v for k, v in g.items() if k != 'type'})
    H, L, e = float(G['garrot']), float(G['longueur']), float(G['ecart'])
    if not (0.1 <= H <= 20 and 0.1 <= L <= 40 and 0 < e < H):
        raise GabaritInvalide(f'proportions impossibles : garrot {H}, longueur {L}, ecart {e}')
    pied = G['pied']
    if pied not in ('sabot', 'patte', 'serre'):
        raise GabaritInvalide(f'pied « {pied} » inconnu (sabot, patte, serre)')
    buste = G.get('buste')
    if buste is True or isinstance(buste, dict):   # « "buste": {} » ou true = buste par défaut
        buste = dict({'hauteur': 0.62, 'r': 0.17, 'tete': 0.13, 'peau': '#c89a78', 'bras': True}, **(buste if isinstance(buste, dict) else {}))
    elif buste not in (None, False):
        raise GabaritInvalide('« buste » doit être un objet ({} = buste par défaut) ou false')
    else:
        buste = None
    bras = bool(buste and buste['bras'])
    attaque = G['attaque'] or ('frappe' if bras else {'sabot': 'cabrer', 'patte': 'morsure', 'serre': 'griffes'}[pied])
    if attaque not in ('cabrer', 'morsure', 'griffes', 'frappe'):
        raise GabaritInvalide(f'attaque « {attaque} » inconnue (cabrer, morsure, griffes, frappe)')
    if attaque == 'frappe' and not bras:
        raise GabaritInvalide('attaque « frappe » sans « buste » à bras (bras humains)')
    coul = G.get('couleurs') or {}
    tr, ve, cr = float(G['torse']), float(G['ventre']), float(G['croupe'])
    ap = float(G.get('aplati', 1.0))
    pa = dict({'r': [0.1, 0.05], 'r_ar': None, 'pied': None}, **(G.get('pattes') or {}))
    r_av = [float(x) for x in pa['r']]
    r_ar = [float(x) for x in (pa['r_ar'] or [r_av[0] * 1.45, r_av[1]])]
    r_pied = float(pa['pied'] or (r_av[1] * (1.2 if pied == 'sabot' else 1.0)))

    zs = H * 0.93                       # ligne du dos
    xa, xr = L / 2, -L / 2              # épaules, hanches
    os_ = []

    def ajoute(nom, parent, queue, r, tete=None, **k):
        o = {'nom': nom, 'queue': _r(queue), 'r': [round(r[0], 3), round(r[1], 3)]}
        if parent:
            o['parent'] = parent
        if tete is not None:
            o['tete'] = _r(tete)
        o.update(k)
        os_.append(o)
        return o

    croupe = [xr - 0.06 * L, 0, zs]
    ajoute('bassin', None, [0, 0, zs - 0.01 * H], [cr, ve], tete=croupe, aplati=ap)
    garrot = [xa + 0.02 * L, 0, zs + 0.04 * H]
    ajoute('dos', 'bassin', garrot, [ve, tr], aplati=ap)

    # ---- pattes (côté .L, recopiées en .R par creature.py) ----
    def patte(pre, parent, x0, z0, avant):
        r0, r1 = (r_av if avant else r_ar)
        hx = 1 if avant else -1
        haut = [x0, e, z0]
        if avant:
            p1 = [x0 + 0.03 * H, e, 0.55 * H]; p2 = [x0 + 0.03 * H, e, 0.29 * H]
        else:
            p1 = [x0 + 0.12 * H, e, 0.56 * H]; p2 = [x0 - 0.07 * H, e, 0.31 * H]
        if pied == 'sabot':
            p3 = [p2[0] + 0.01 * H, e, 0.07 * H]; p4 = [p3[0] + 0.07 * H, e, 0.0]
        else:   # digitigrade : canon court, pied posé vers l'avant
            p3 = [p2[0] + 0.015 * H * hx, e, 0.08 * H]; p4 = [p3[0] + 0.11 * H, e, 0.012 * H]
        rm = (r0 + r1) / 2
        ajoute(f'{pre}_haut.L', parent, p1, [r0, rm], tete=haut)
        ajoute(f'{pre}_bas.L', f'{pre}_haut.L', p2, [rm, r1])
        ajoute(f'{pre}_canon.L', f'{pre}_bas.L', p3, [r1, r1 * 0.9])
        teinte = coul.get('sabot' if pied == 'sabot' else 'pattes')
        o = ajoute(f'{pre}_pied.L', f'{pre}_canon.L', p4, [r_pied, r_pied * (1.05 if pied == 'sabot' else 0.8)])
        if teinte:
            o['couleur'] = teinte; o['melange'] = 0.9
        return p4

    pied_av = patte('av', 'dos', xa - 0.04 * L, zs - 0.16 * H, True)
    pied_ar = patte('ar', 'bassin', xr + 0.04 * L, zs - 0.1 * H, False)

    pieces = []
    if pied in ('patte', 'serre'):    # griffes au bout des pieds (serres plus longues à l'avant du griffon)
        gc = coul.get('griffes', '#1a1612')
        for pre, p4, serre in (('av', pied_av, pied == 'serre'), ('ar', pied_ar, False)):
            lg = (0.09 if serre else 0.045) * H
            for dy in (-0.035, 0.0, 0.035):
                de = [p4[0] - 0.01 * H, e + dy * H, 0.02 * H]
                pieces.append({'forme': 'cone', 'os': f'{pre}_pied.L', 'de': _r(de),
                               'a': _r([de[0] + lg, de[1] + dy * 0.6 * H, 0.0]), 'r': round(0.016 * H * (1.4 if serre else 1), 3),
                               'courbure': 0.3 if serre else 0.15, 'couleur': gc, 'rugosite': 0.4})

    # ---- cou et tête, ou buste humain (centaure) ----
    anim_os = {}
    if buste is not None:
        B = buste
        hb, rb, rt = float(B['hauteur']) * H, float(B['r']) * H, float(B['tete']) * H
        base = [xa + 0.06 * L, 0, zs + 0.05 * H]
        ajoute('buste', 'dos', [base[0] + 0.05 * H, 0, base[2] + hb * 0.5], [tr * 0.8, rb], tete=base,
               couleur=B['peau'], melange=0.85)
        ajoute('poitrine_h', 'buste', [base[0] + 0.07 * H, 0, base[2] + hb], [rb * 1.1, rb * 0.6], couleur=B['peau'], melange=1)
        cou_h = [base[0] + 0.08 * H, 0, base[2] + hb + 0.07 * H]
        ajoute('cou_h', 'poitrine_h', cou_h, [rb * 0.4, rb * 0.38], couleur=B['peau'], melange=1)
        ajoute('tete_h', 'cou_h', [cou_h[0] + 0.03 * H, 0, cou_h[2] + rt * 2.1], [rt, rt * 0.8], couleur=B['peau'], melange=1)
        tete_bout = [cou_h[0] + 0.03 * H, 0, cou_h[2] + rt * 2.1]
        if B['bras']:
            ep = [base[0] + 0.06 * H, rb * 1.45, base[2] + hb * 0.9]
            ajoute('bras_h.L', 'poitrine_h', [ep[0] - 0.02 * H, ep[1] + 0.07 * H, ep[2] - 0.32 * H], [rb * 0.5, rb * 0.36],
                   tete=ep, couleur=B['peau'], melange=1)
            ajoute('avbras_h.L', 'bras_h.L', [ep[0] + 0.24 * H, ep[1] + 0.06 * H, ep[2] - 0.42 * H], [rb * 0.36, rb * 0.27],
                   couleur=B['peau'], melange=1)
        yc = (G.get('yeux') or {}).get('couleur', '#120c08')
        oy = [tete_bout[0] + rt * 0.85, rt * 0.4, cou_h[2] + rt * 1.15]
        pieces.append({'forme': 'sphere', 'os': 'tete_h', 'de': _r(oy), 'r': round(rt * 0.16, 3), 'couleur': yc, 'rugosite': 0.2})
        if B.get('cheveux'):
            pieces.append({'forme': 'sphere', 'os': 'tete_h', 'de': _r([tete_bout[0] - rt * 0.15, 0, cou_h[2] + rt * 1.35]),
                           'a': _r([tete_bout[0] - rt * 0.35, 0, cou_h[2] + rt * 0.6]), 'r': round(rt * 1.02, 3),
                           'couleur': B['cheveux'], 'rugosite': 0.9, 'symetrie': False})
        anim_os['tete'] = 'tete_h'; anim_os['cou'] = 'buste'
    else:
        C = dict({'longueur': 0.55, 'angle': 55, 'r': [0.21, 0.11]}, **(G.get('cou') or {}))
        T = dict({'longueur': 0.5, 'angle': -55, 'r': [0.12, 0.07], 'machoire': False, 'bec': False}, **(G.get('tete') or {}))
        base = [xa + 0.04 * L, 0, zs + 0.02 * H]
        bout_cou = _plus(base, _dir(float(C['angle']), float(C['longueur']) * H))
        rc = [float(x) * H for x in C['r']]
        ajoute('cou', 'dos', bout_cou, rc, tete=base)
        lt = float(T['longueur']) * H; rt = [float(x) * H for x in T['r']]
        bout = _plus(bout_cou, _dir(float(T['angle']), lt))
        ajoute('tete', 'cou', bout, rt)
        dt = [(bout[i] - bout_cou[i]) / lt for i in range(3)]
        haut = [-dt[2], 0, dt[0]]          # perpendiculaire « au-dessus » de la tête, dans le plan x-z
        if T['machoire']:
            m0 = _plus(bout_cou, [dt[i] * lt * 0.35 - haut[i] * rt[0] * 0.45 for i in range(3)])
            m1 = _plus(bout, [-haut[i] * rt[1] * 0.6 for i in range(3)])
            om = ajoute('machoire', 'tete', m1, [rt[0] * 0.55, rt[1] * 0.6], tete=m0)
            if coul.get('nez'):
                om['couleur'] = coul['nez']; om['melange'] = 0.5
        if T['bec']:
            bc = coul.get('bec', '#d8a838')
            pieces.append({'forme': 'cone', 'os': 'tete', 'de': _r(_v(bout_cou, bout, 0.8)),
                           'a': _r(_plus(bout, [dt[i] * rt[1] * 1.6 - haut[i] * rt[1] * 0.9 for i in range(3)])),
                           'r': round(rt[1] * 1.15, 3), 'courbure': -0.35, 'couleur': bc, 'rugosite': 0.35, 'symetrie': False})
        elif coul.get('nez') and not T['machoire']:
            pieces.append({'forme': 'sphere', 'os': 'tete', 'de': _r(_v(bout_cou, bout, 0.97)), 'r': round(rt[1] * 1.05, 3),
                           'couleur': coul['nez'], 'rugosite': 0.5, 'symetrie': False})
        # yeux, oreilles
        Y = dict({'r': 0.028, 'couleur': '#120c08'}, **(G.get('yeux') or {}))
        oe = _plus(_v(bout_cou, bout, 0.3), [haut[i] * rt[0] * 0.45 for i in range(3)])
        oe[1] = rt[0] * 0.78
        pieces.append({'forme': 'sphere', 'os': 'tete', 'de': _r(oe), 'r': round(float(Y['r']) * H, 3), 'couleur': Y['couleur'], 'rugosite': 0.15})
        lo = float(G['oreilles']) * H
        if lo > 0:
            o0 = _plus(_v(bout_cou, bout, 0.06), [haut[i] * rt[0] * 0.75 for i in range(3)]); o0[1] = rt[0] * 0.5
            o1 = [o0[0] - 0.25 * lo, o0[1] + 0.3 * lo, o0[2] + lo]
            po = {'forme': 'cone', 'os': 'tete', 'de': _r(o0), 'a': _r(o1), 'r': round(max(0.02 * H, lo * 0.28), 3), 'rugosite': 0.8}
            if coul.get('oreilles'):
                po['couleur'] = coul['oreilles']
            pieces.append(po)
        # crinière : mèches le long du dessus du cou
        Cr = G.get('criniere')
        if Cr:
            n, lm = int(Cr.get('meches', 9)), float(Cr.get('longueur', 0.16)) * H
            dc = [(bout_cou[i] - base[i]) for i in range(3)]; lcn = math.sqrt(sum(x * x for x in dc)) or 1
            hc = [-dc[2] / lcn, 0, dc[0] / lcn]
            for i in range(n):
                t = 0.05 + 0.95 * i / max(1, n - 1)
                rr = rc[0] * (1 - t) + rc[1] * t
                p = _plus(_v(base, bout_cou, t), [hc[k] * rr * 0.8 for k in range(3)])
                cote = 1 if i % 2 else -1
                p[1] = 0.02 * H * cote
                dcn = [x / lcn for x in dc]   # mèche couchée : vers l'arrière le long du cou, retombant sur le côté
                q = [p[k] - dcn[k] * lm * 0.55 + hc[k] * lm * 0.15 for k in range(3)]
                q[1] = p[1] + cote * lm * 0.55; q[2] -= lm * 0.35
                pieces.append({'forme': 'cone', 'os': 'cou', 'de': _r(p), 'a': _r(q), 'r': round(lm * 0.38, 3), 'courbure': 0.3,
                               'couleur': Cr.get('couleur', '#2a1c12'), 'rugosite': 0.9, 'symetrie': False})

    # ---- queue ----
    Q = dict({'longueur': 0.55, 'angle': -55, 'r': [0.06, 0.025], 'segments': 3, 'meches': 0, 'couleur': None}, **(G.get('queue') or {}))
    nq = max(1, int(Q['segments'])); lq = float(Q['longueur']) * H / nq
    p = [croupe[0] + 0.02 * H, 0, croupe[2] + 0.02 * H]; parent = 'bassin'
    rq = [float(x) * H for x in Q['r']]
    for i in range(nq):
        ang = float(Q['angle']) - 12 * i * (1 if Q['angle'] > -80 else 0)
        q = _plus(p, [-math.cos(math.radians(ang)) * lq, 0, math.sin(math.radians(ang)) * lq])
        t0, t1 = i / nq, (i + 1) / nq
        o = ajoute(f'queue{i + 1}', parent, q, [rq[0] * (1 - t0) + rq[1] * t0, rq[0] * (1 - t1) + rq[1] * t1],
                   tete=p if i == 0 else None)
        if Q['couleur']:
            o['couleur'] = Q['couleur']; o['melange'] = 0.3 + 0.7 * t1
        parent, p = f'queue{i + 1}', q
    nm = int(Q['meches'])
    for i in range(nm):   # crins / touffe au bout de la queue
        os_q = f'queue{nq}'
        de = list(p)   # bout de la queue
        a = [de[0] - 0.05 * H + 0.02 * H * (i % 3), (i - nm / 2) * 0.012 * H, de[2] - 0.12 * H - 0.03 * H * (i % 2)]
        pieces.append({'forme': 'cone', 'os': os_q, 'de': _r(_plus(de, [0.04 * H, 0, 0.03 * H])), 'a': _r(a),
                       'r': round(rq[1] * 1.6, 3), 'couleur': Q['couleur'] or '#2a1c12', 'rugosite': 0.9, 'symetrie': False})

    # ---- ailes (os hors de la peau + pièce « aile ») ----
    A = G.get('ailes')
    if A:
        E = float(A.get('envergure', 1.1)) * H
        o0 = [xa - 0.12 * L, 0.1 * H, zs + 0.1 * H]
        p1 = [o0[0] - 0.08 * E, o0[1] + 0.38 * E, o0[2] + 0.32 * E]
        p2 = [p1[0] - 0.18 * E, p1[1] + 0.34 * E, p1[2] + 0.22 * E]
        p3 = [p2[0] - 0.36 * E, p2[1] + 0.2 * E, p2[2] + 0.06 * E]
        ajoute('aile1.L', 'dos', p1, [0.04 * H, 0.035 * H], tete=o0, peau=False)
        ajoute('aile2.L', 'aile1.L', p2, [0.035 * H, 0.03 * H], peau=False)
        ajoute('aile3.L', 'aile2.L', p3, [0.03 * H, 0.02 * H], peau=False)
        lw = float(A.get('largeur', 0.5)) * H
        pieces.append({'forme': 'aile', 'os': ['aile1.L', 'aile2.L', 'aile3.L'], 'largeur': [round(lw * 0.55, 3), round(lw * 0.85, 3),
                       round(lw, 3), round(lw * 0.5, 3)], 'plumes': int(A.get('plumes', 9)),
                       'couleur': A.get('couleur', '#9a6e3e'), 'pennes': A.get('pennes', '#3a2616'), 'rugosite': 0.75})

    anims = animations_quad(attaque, H, tr, zs, bool(A), bras, nq,
                            bool((G.get('tete') or {}).get('machoire')) if buste is None else False, anim_os)
    return os_, pieces, anims


def animations_quad(attaque, H, tr, zs, ailes, bras, nq, machoire, alias):
    cou, tete = alias.get('cou', 'cou'), alias.get('tete', 'tete')
    q = {f'queue{i + 1}': {'lacet': 10 + 3 * i} for i in range(nq)}
    q2 = {f'queue{i + 1}': {'lacet': -8 - 2 * i} for i in range(nq)}

    def k(t, os_=None, dep=None):
        c = {'t': t}
        if os_:
            c['os'] = os_
        if dep:
            c['deplacement'] = [round(x, 3) for x in dep]
        return c

    def ail(r1, r2=None, r3=None):
        if not ailes:
            return {}
        d = {'aile1.*': {'roulis': r1}}
        if r2 is not None:
            d['aile2.*'] = {'roulis': r2}
        if r3 is not None:
            d['aile3.*'] = {'lacet': r3}
        return d

    idle = {'duree': 2.0, 'cles': [k(0), k(1.0, dict({cou: {'tangage': -3}, tete: {'tangage': 5}, 'dos': {'tangage': -1}},
                                                       **q, **ail(-6, -4)), [0, 0, 0.012 * H]), k(2.0)]}
    if bras:
        idle['cles'][1]['os'].update({'bras_h.*': {'roulis': -4}, 'avbras_h.*': {'tangage': -6}})
    # attaque
    if attaque == 'cabrer':
        att = {'duree': 1.2, 'cles': [k(0),
               k(0.45, dict({'bassin': {'tangage': -32}, 'ar_haut.*': {'tangage': 26}, 'ar_bas.*': {'tangage': 6},
                             'av_haut.*': {'tangage': -70}, 'av_bas.*': {'tangage': 95}, 'av_canon.*': {'tangage': 20},
                             cou: {'tangage': 18}, tete: {'tangage': 12}}, **q, **ail(25, 12)), [-0.06 * H, 0, 0.06 * H]),
               k(0.75, dict({'bassin': {'tangage': -6}, 'ar_haut.*': {'tangage': 6}, 'av_haut.*': {'tangage': -28},
                             'av_bas.*': {'tangage': 25}, cou: {'tangage': 24}, tete: {'tangage': 18}}, **q2, **ail(-25, -12)),
                 [0.14 * H, 0, 0]),
               k(1.2)]}
    elif attaque == 'morsure':
        mo = {'machoire': {'tangage': 32}} if machoire else {}
        att = {'duree': 1.0, 'cles': [k(0),
               k(0.3, dict({'av_haut.*': {'tangage': 14}, 'av_bas.*': {'tangage': -10}, 'ar_haut.*': {'tangage': -14},
                            'ar_bas.*': {'tangage': 12}, cou: {'tangage': 12}, tete: {'tangage': -6}}, **q2), [-0.07 * H, 0, -0.06 * H]),
               k(0.55, dict({'av_haut.*': {'tangage': -38}, 'av_bas.*': {'tangage': 32}, 'ar_haut.*': {'tangage': 30},
                             'ar_bas.*': {'tangage': -6}, 'bassin': {'tangage': -6}, cou: {'tangage': 8}, tete: {'tangage': 14}},
                            **mo, **q), [0.26 * H, 0, 0.04 * H]),
               k(1.0)]}
    elif attaque == 'griffes':
        att = {'duree': 1.1, 'cles': [k(0),
               k(0.4, dict({'bassin': {'tangage': -38}, 'ar_haut.*': {'tangage': 30}, 'av_haut.*': {'tangage': -85},
                            'av_bas.*': {'tangage': 40}, cou: {'tangage': 26}, tete: {'tangage': 10}}, **ail(28, 15, 10)),
                 [-0.04 * H, 0, 0.08 * H]),
               k(0.7, dict({'bassin': {'tangage': -14}, 'ar_haut.*': {'tangage': 12}, 'av_haut.*': {'tangage': -40},
                            'av_bas.*': {'tangage': -10}, cou: {'tangage': 30}, tete: {'tangage': 22}}, **ail(-30, -15, -6)),
                 [0.16 * H, 0, 0.01 * H]),
               k(1.1)]}
    else:   # frappe : le buste se redresse, bras levés puis abattus
        att = {'duree': 1.0, 'cles': [k(0),
               k(0.4, {'buste': {'tangage': -12}, 'poitrine_h': {'tangage': -8}, 'bras_h.*': {'tangage': -140, 'roulis': -10},
                       'avbras_h.*': {'tangage': -30}, 'av_haut.*': {'tangage': -20}, 'av_bas.*': {'tangage': 30}}, [-0.04 * H, 0, 0.02 * H]),
               k(0.6, {'buste': {'tangage': 14}, 'poitrine_h': {'tangage': 10}, 'bras_h.*': {'tangage': -40},
                       'avbras_h.*': {'tangage': -5}, tete: {'tangage': 8}}, [0.12 * H, 0, 0]),
               k(1.0)]}
    hit = {'duree': 0.6, 'cles': [k(0), k(0.18, dict({'bassin': {'tangage': 4}, cou: {'tangage': -18}, tete: {'tangage': -14},
                                                      'av_haut.*': {'tangage': 10}, 'queue1': {'tangage': -15}}, **ail(20, 15)),
                                         [-0.09 * H, 0, 0]), k(0.6)]}
    sol = -(zs - tr * 0.95)    # l'os racine (à la croupe) descend jusqu'à poser le flanc
    # couché sur le flanc GAUCHE (roulis −) : les pattes vont vers −y, donc vers la caméra du studio (placée en −y) ; tête
    # rabattue vers le sol (lacet + dans le repère du corps couché)
    mort_fin = dict({'bassin': {'roulis': -86}, cou: {'lacet': 22, 'tangage': 10}, tete: {'lacet': 15},
                     'av_haut.*': {'tangage': -18}, 'av_bas.*': {'tangage': 22}, 'ar_haut.*': {'tangage': 14},
                     'ar_bas.*': {'tangage': -12}}, **ail(35, 30))
    if bras:
        mort_fin.update({'bras_h.*': {'roulis': -30, 'tangage': -20}})
    death = {'duree': 1.4, 'cles': [k(0),
             k(0.5, {'av_haut.*': {'tangage': 30}, 'av_bas.*': {'tangage': -55}, 'bassin': {'tangage': 8, 'roulis': -10},
                     cou: {'tangage': 20}}, [0, 0, -0.14 * H]),
             k(1.4, mort_fin, [0, 0, sol])]}
    return {'Idle': idle, 'Attack': att, 'Hit': hit, 'Death': death}


TYPES = {'quadrupede': quadrupede}


def etendre(rec):
    """Recette avec « gabarit » → recette complète (copie). Sans gabarit : inchangée."""
    g = rec.get('gabarit')
    if not g:
        return rec
    if not isinstance(g, dict):
        raise GabaritInvalide(f'« gabarit » doit être un objet {{"type": "{next(iter(TYPES))}", …}} (reçu {json.dumps(g)})')
    if g.get('type') not in TYPES:
        raise GabaritInvalide(f'gabarit « {g.get("type")} » inconnu ({", ".join(TYPES)})')
    try:
        os_, pieces, anims = TYPES[g['type']](g)
    except GabaritInvalide:
        raise
    except (ValueError, TypeError, KeyError, AttributeError, IndexError) as e:   # "garrot": "grand", "tete": null…
        raise GabaritInvalide(f'gabarit {g["type"]} : valeur illisible ({type(e).__name__} : {e})')
    out = copy.deepcopy({k: v for k, v in rec.items() if k != 'gabarit'})
    noms = {o['nom']: o for o in os_}
    for o in rec.get('os', []):
        if 'nom' not in o:
            raise GabaritInvalide('os sans « nom » dans la recette')
        if o['nom'] in noms:
            noms[o['nom']].update(copy.deepcopy(o))
        else:
            os_.append(copy.deepcopy(o))
    out['os'] = os_
    out['pieces'] = pieces + copy.deepcopy(rec.get('pieces', []))
    a = dict(anims); a.update(copy.deepcopy(rec.get('animations', {})))
    out['animations'] = a
    teinte = (rec.get('peau') or {}).get('couleur')
    for pc in pieces:   # oreilles, etc. sans couleur : celle de la robe (pas le gris par défaut de creature.py)
        if teinte and 'couleur' not in pc:
            pc['couleur'] = teinte
    out['gabarit_source'] = g
    return out
