#!/usr/bin/env python3
"""Vérification commune avant publication : UNE commande par jeu, UN rapport (construction, tests du jeu, robots, captures, banc, poids).

usage :
  python3 outils-communs/verif.py <jeu>/outils/verif.json                 vérification rapide (étapes sans "complet": true)
  python3 outils-communs/verif.py <jeu>/outils/verif.json --complet       toutes les étapes
options : --sortie dossier (défaut /tmp/verif-<jeu>) · --etapes mot1,mot2 (seulement les étapes dont le nom contient un de ces mots)
          · --sauter mot1,mot2 · --avant REV (révision des étapes captures/banc qui comparent à une révision ; défaut : celle des
          réglages) · --sans-construire · --liste (affiche les étapes et s'arrête) · --sans-chrono (ne note pas les durées dans
          bureau/retours-outils/chronos.jsonl) · --continuer (ne s'arrête pas après une étape "bloquante" ratée)
Code de sortie : 0 tout est bon (réserves comprises) · 1 une étape a échoué · 2 réglages illisibles.
Sortie (hors du dépôt ; effacée à chaque vérification, seulement si elle porte le repère .verif-sortie) : <sortie>/rapport.html (une ligne par étape, chiffres, planches avant/après, détails des échecs), resume.txt, verif.json,
         et le dossier de chaque étape (captures, singe.json, banc.json, journal.txt de chaque commande).

Réglages (JSON ; chemins relatifs à la racine du dépôt ; les commandes sont lancées depuis la racine) :
  "jeu": "couronnes-et-lignees",
  "construire": "cd couronnes-et-lignees/jeu && python3 build.py"     lancé une fois au début (étape bloquante)
  "budget_min": 10                    au-delà, le rapport le dit et donne les étapes les plus longues
  "etapes": [ … ]  une étape = un des types suivants + des clés communes :
    {"nom": "Partie + anciennes sauvegardes", "commande": "cd x/outils/tests && python3 pass1test.py"}   commande du jeu
          réussie si code 0 (ou "codes_ok": [0, 3]) ; "ok_si": "regex" doit apparaître dans la sortie, "echec_si": "regex" ne
          doit pas y apparaître ; "chiffres": "regex" (groupes) = valeurs reprises dans le rapport ; "images": ["/tmp/x/planche.png"]
          = images jointes au rapport. Les outils propres aux jeux rendent souvent 0 même en cas d'erreur : mettre "ok_si".
    {"nom": "Captures 2D", "captures": "x/outils/vues.json", "comparer": "x/references"}   (ou "avant": "HEAD") studio commun
    {"nom": "Singe", "singe": "x/outils/singe.json", "args": ["--secondes", "45", "--couvrir"]}             singe commun
    {"nom": "Banc", "banc": "x/outils/banc.json", "avant": "HEAD"}                                        banc commun
    {"nom": "Poids de la page", "poids": "x/build/index.html", "max_mo": 16}       page publiée (réserve au-delà de 97 %)
  clés communes : "complet": true (seulement avec --complet) · "delai_s": 600 · "env": {"V3D": "0"} · "params": "v3d=0" (ajouté à
          l'adresse des pages ouvertes par atelier.page() : robots propres au jeu, parcours.py, monkey.py…) · "args": [...] (options
          en plus pour l'outil commun) · "reserve": true (un échec devient une RÉSERVE : signalé, sans faire échouer la vérification ;
          un délai dépassé reste un échec) · "bloquant": true (si l'étape échoue, les suivantes ne sont pas lancées)
Verrou machine (verrou.py) : chaque commande du jeu passe avec les autres robots mais jamais pendant un banc ("verrou": "banc" pour
une commande qui mesure, comme un perf.py propre au jeu ; "verrou": false pour aucun ; "attente_max_s": 1800).
Les étapes captures/singe/banc sont lancées avec --strict (alerte, erreur JS, blocage, ralentissement = échec) et leur rapport JSON
est relu pour les chiffres. Un seul jeu 3D à la fois : les étapes s'enchaînent, jamais en parallèle.
"""
import datetime, html, json, os, re, shlex, shutil, signal, subprocess, sys, time

ICI = os.path.dirname(os.path.abspath(__file__))
RAC = os.path.dirname(ICI)
sys.path.insert(0, ICI)
import verrou  # noqa: E402
OUTILS = {'captures': os.path.join(ICI, 'captures.py'), 'singe': os.path.join(ICI, 'robots', 'singe.py'), 'banc': os.path.join(ICI, 'banc.py')}
MARQUE = '.verif-sortie'  # posé dans chaque sortie : seul un dossier qui le porte peut être effacé
TYPES = ('commande', 'captures', 'singe', 'banc', 'poids')


def lire_args(argv):
    o = {'pos': [], 'complet': False, 'sortie': None, 'etapes': None, 'sauter': None, 'avant': None, 'sans_construire': False,
         'liste': False, 'sans_chrono': False, 'continuer': False}
    i = 0
    while i < len(argv):
        a = argv[i]
        if a in ('--complet', '--sans-construire', '--liste', '--sans-chrono', '--continuer'):
            o[a[2:].replace('-', '_')] = True
        elif a == '--rapide':
            o['complet'] = False
        elif a.startswith('--'):
            k = a[2:].replace('-', '_')
            if k not in o or i + 1 >= len(argv):
                sys.exit(f'verif.py : option inconnue ou sans valeur : {a}')
            o[k] = argv[i + 1]; i += 1
        else:
            o['pos'].append(a)
        i += 1
    return o


def type_etape(e):
    t = [k for k in TYPES if k in e]
    if len(t) != 1:
        raise ValueError(f"étape {e.get('nom', '?')!r} : il faut exactement une des clés {', '.join(TYPES)}")
    return t[0]


def slug(s):
    s = s.lower()
    for a, b in (('éèêë', 'e'), ('àâä', 'a'), ('îï', 'i'), ('ôö', 'o'), ('ùûü', 'u'), ('ç', 'c')):
        for c in a:
            s = s.replace(c, b)
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')[:40] or 'etape'


def choisir(etapes, o):
    """Étapes retenues (avec la raison de celles qu'on saute)."""
    gardees = []
    mots = [m.strip().lower() for m in o['etapes'].split(',')] if o['etapes'] else None
    sauts = [m.strip().lower() for m in o['sauter'].split(',')] if o['sauter'] else []
    for e in etapes:
        n = e['nom'].lower()
        if e.get('_construction'):  # toujours lancée (sinon --etapes testerait l'ancienne page) ; --sans-construire pour la sauter
            gardees.append((e, None)); continue
        if mots and not any(m in n for m in mots):
            continue
        if any(m and m in n for m in sauts):
            gardees.append((e, 'sautée (--sauter)')); continue
        if e.get('complet') and not o['complet']:
            gardees.append((e, 'sautée (complet seulement)')); continue
        gardees.append((e, None))
    return gardees


def lancer(cmd, delai, env=None, journal=None, shell=False):
    """Lance une commande depuis la racine du dépôt, la tue (avec ses enfants) au-delà du délai. → (code, sortie, durée)."""
    t0 = time.time()
    envf = dict(os.environ, **{k: str(v) for k, v in (env or {}).items()})
    envf['PYTHONUNBUFFERED'] = '1'
    envf['VERIF_ETAPE'] = marque = f'{os.getpid()}-{time.time_ns()}'  # hérité par les navigateurs de l'étape : on ne tue qu'eux
    f = open(journal, 'w', encoding='utf-8') if journal else None
    try:
        p = subprocess.Popen(cmd, cwd=RAC, shell=shell, env=envf, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                             text=True, errors='replace', start_new_session=True)
        morceaux = []
        import threading
        def lire():
            for ligne in p.stdout:
                morceaux.append(ligne)
                if f and not f.closed:
                    f.write(ligne); f.flush()
        th = threading.Thread(target=lire, daemon=True); th.start()
        try:
            code = p.wait(timeout=delai)
        except subprocess.TimeoutExpired:
            for sig in (signal.SIGTERM, signal.SIGKILL):  # grâce de 5 s, puis SIGKILL au groupe dans tous les cas (enfant qui ignore SIGTERM)
                try:
                    os.killpg(p.pid, sig)
                except Exception:
                    pass
                try:
                    p.wait(5)
                except subprocess.TimeoutExpired:
                    pass
                if sig == signal.SIGTERM:
                    time.sleep(0.2)
            # Chromium lancé par Playwright vit dans sa propre session : on tue ceux de CETTE étape (repère VERIF_ETAPE dans leur
            # environnement), jamais ceux d'une autre mesure qui tourne en même temps
            for pid in pids_chrome(marque):
                try:
                    os.kill(pid, signal.SIGKILL)
                except Exception:
                    pass
            code = None
        th.join(10)
        return code, ''.join(morceaux), time.time() - t0
    finally:
        if f:
            try:
                f.close()
            except Exception:
                pass


def pids_chrome(marque):
    """pid des navigateurs (chrome, chromium, headless_shell) lancés par l'étape qui porte ce repère."""
    r = set()
    for d in os.listdir('/proc') if os.path.isdir('/proc') else []:
        if d.isdigit():
            try:
                c = open(f'/proc/{d}/comm').read().strip().lower()
            except Exception:
                continue
            if 'chrom' in c or 'headless_shell' in c:
                try:
                    if f'VERIF_ETAPE={marque}'.encode() in open(f'/proc/{d}/environ', 'rb').read().split(b'\0'):
                        r.add(int(d))
                except Exception:
                    pass
    return r


def lire_json(p):
    try:
        return json.load(open(p, encoding='utf-8'))
    except Exception:
        return None


def chiffres_captures(d):
    c = lire_json(os.path.join(d, 'captures.json')) or {}
    ap = c.get('apres') or {}
    vues = ap.get('vues') or {}
    echecs = [f for f, r in vues.items() if 'echec' in r]
    cmp_ = c.get('comparaison') or {}
    morceaux = [f"{len(vues)} vue(s)"]
    if cmp_:
        morceaux.append(f"{cmp_.get('alertes', '?')} alerte(s) sur {cmp_.get('total', '?')}" + (f", {len(cmp_.get('manquantes') or [])} manquante(s)" if cmp_.get('manquantes') else ''))
    if echecs:
        morceaux.append(f"{len(echecs)} vue(s) en échec")
    st = c.get('stabilite')
    if st:
        morceaux.append(f"{sum(1 for p in st.values() if p <= 0.1)}/{len(st)} stables")
    detail = []
    cj = lire_json(os.path.join(d, 'comparaison.json'))
    if isinstance(cj, dict):
        for v in cj.get('scenes') or []:
            if isinstance(v, dict) and v.get('alerte'):
                detail.append(f"alerte {v.get('nom')} : {v.get('change_pct', '?')} % changé")
        for m in cj.get('manquantes') or []:
            detail.append(f'image absente : {m}')
    for f in echecs[:6]:
        detail.append(f"{f} : {vues[f]['echec'][:160]}")
    planches = [os.path.join(d, 'planche.png')] if os.path.exists(os.path.join(d, 'planche.png')) else []
    return ' · '.join(morceaux), detail, planches


def chiffres_singe(d):
    s = lire_json(os.path.join(d, 'singe.json')) or {}
    morceaux, detail = [], []
    for r in s.get('appareils') or []:
        cv = r.get('couverture') or {}
        morceaux.append(f"{r.get('appareil')} : {r.get('actions')} actions, {r.get('boutons_distincts')} boutons, état {r.get('etat_debut')} → {r.get('etat_fin')}, "
                        f"{len(r.get('erreurs') or [])} erreur(s), {len(r.get('blocages') or [])} blocage(s), couverture {cv.get('pct', '?')} %")
        for e in (r.get('erreurs') or [])[:3]:
            detail.append(f"{r.get('appareil')} erreur ×{e.get('fois')} : {str(e.get('erreur'))[:160]}")
        for b in (r.get('blocages') or [])[:2]:
            detail.append(f"{r.get('appareil')} blocage : {b.get('quoi')} sur « {b.get('ecran')} »")
        for k, v in list((r.get('invariants') or {}).items())[:2]:
            detail.append(f"{r.get('appareil')} invariant ×{v} : {k}")
        for k, v in list((r.get('debordements') or {}).items())[:3]:
            detail.append(f"{r.get('appareil')} coupé sur « {k} » : {v}")
    caps = sorted(os.path.join(d, f) for f in os.listdir(d) if f.endswith('_fin.png')) if os.path.isdir(d) else []
    return ' · '.join(morceaux), detail, caps


def chiffres_banc(fj):
    b = lire_json(fj) or {}
    detail = []
    if b.get('ecarts') is not None:
        L = b['ecarts']
        lents = [e for e in L if e.get('verdict') in ('plus lent', 'erreur après')]
        morceaux = [f"{len(L)} mesure(s) avant/après ({b.get('avant_rev')}), {len(lents)} plus lente(s)"]
        for e in L:
            detail.append(f"{e['appareil']}/{e['scene']} : {e['avant_ms']:.2f} → {e['apres_ms']:.2f} ms ({e['ecart_pct']:+.1f} %) {e['verdict']}")
        return morceaux[0], detail, []
    sc = []
    for an, v in (b.get('appareils') or {}).items():
        for s, m in (v.get('scenes') or {}).items():
            sc.append(f"{an}/{s} {m.get('ms', '?')} ms" if 'ms' in m else f"{an}/{s} erreur")
    return ('mesure : ' + ', '.join(sc[:6])) if sc else 'aucune mesure lue', detail, []


def une_etape(e, o, sortie):
    t = type_etape(e)
    d = os.path.join(sortie, slug(e['nom']))
    os.makedirs(d, exist_ok=True)
    journal = os.path.join(d, 'journal.txt')
    env = dict(e.get('env') or {})
    if e.get('params'):
        env['ATELIER_PARAMS'] = e['params']
    delai = float(e.get('delai_s', 600))
    res = {'nom': e['nom'], 'type': t, 'dossier': os.path.relpath(d, sortie), 'chiffres': '', 'detail': [], 'images': []}
    extra = [str(x) for x in e.get('args') or []]
    if t == 'poids':
        f = os.path.join(RAC, e['poids'])
        mx = float(e.get('max_mo', 16))
        if not os.path.exists(f):
            res.update(statut='echec', secondes=0, chiffres=f"page absente : {e['poids']}")
            return res
        mo = os.path.getsize(f) / 1048576
        res.update(secondes=0, chiffres=f"{mo:.2f} Mio sur {mx:g}",
                   statut='echec' if mo > mx else 'reserve' if mo > 0.97 * mx else 'ok')
        if res['statut'] == 'reserve':
            res['detail'].append(f'moins de 3 % de marge sous la limite de {mx:g} Mio')
        return res
    if t == 'commande':
        cmd = e['commande']; shell = True
        if extra:
            cmd += ' ' + ' '.join(shlex.quote(x) for x in extra)
        affiche = cmd
    else:
        cmd = [sys.executable, OUTILS[t], e[t]]
        if t == 'captures':
            cmd += [d, '--strict']
            avant = o['avant'] if (o['avant'] and e.get('avant')) else e.get('avant')
            if avant:
                cmd += ['--avant', avant]
            elif e.get('comparer'):
                cmd += ['--comparer', e['comparer']]
        elif t == 'singe':
            cmd += ['--sortie', d]
        elif t == 'banc':
            cmd += [os.path.join(d, 'banc.json'), '--strict']
            avant = o['avant'] if (o['avant'] and e.get('avant')) else e.get('avant')
            if avant:
                cmd += ['--avant', avant]
            elif e.get('reference'):
                cmd += ['--reference', e['reference']]
        cmd += extra; shell = False
        affiche = ' '.join(shlex.quote(os.path.relpath(x, RAC) if x.startswith(RAC + os.sep) else x) for x in cmd[1:])
        affiche = 'python3 ' + affiche
    res['commande'] = (' '.join(f'{k}={shlex.quote(str(v))}' for k, v in env.items()) + ' ' if env else '') + affiche
    # verrou machine (verrou.py, 18/11) : une commande du jeu (robot, test, construction) passe avec les autres robots mais jamais
    # pendant un banc ; "verrou": "banc" pour une commande qui MESURE (perf.py propre au jeu) ; "verrou": false pour aucun.
    # Les outils communs (captures, singe, banc) prennent eux-mêmes le leur. Le délai de l'étape ne compte pas l'attente.
    mode_v = e.get('verrou', 'robot') if t == 'commande' else None
    if mode_v and re.search(r'outils-communs/(banc|profil3d)\.py', cmd if isinstance(cmd, str) else ' '.join(cmd)):
        mode_v = None  # le banc commun lancé en commande prend lui-même le verrou exclusif
    try:
        jeton, attendu = verrou.prendre(mode_v, f"verif {e['nom']}", True, float(e.get('attente_max_s', 1800)),
                                        '"verrou": false dans verif.json') if mode_v in ('robot', 'banc') else (None, 0)
    except SystemExit:  # machine tenue au-delà de l'attente maximale : étape en échec, la vérification continue (rapport écrit)
        res.update(statut='echec', secondes=0, code=None, pourquoi=f'machine tenue par un banc ({verrou._resume()}) au-delà de attente_max_s',
                   chiffres='machine tenue (verrou)')
        return res
    if jeton:
        env['VERROU_TENU'] = mode_v  # les outils communs lancés par la commande ne reprennent pas le verrou (pas d'attente sur soi-même)
    try:
        code, out, s = lancer(cmd, delai, env, journal, shell)
    finally:
        if jeton:
            jeton.close()
    if attendu > 1:
        res['attente_verrou_s'] = round(attendu)
    res['secondes'] = round(s, 1); res['code'] = code
    ok = code is not None and code in (e.get('codes_ok') or [0])
    pourquoi = '' if code is not None else f'délai dépassé ({delai:.0f} s)'
    if code is not None and not ok:
        pourquoi = f'code {code}'
    if ok and e.get('ok_si') and not re.search(e['ok_si'], out):
        ok = False; pourquoi = f"« {e['ok_si']} » absent de la sortie"
    if ok and e.get('echec_si'):
        m = re.search(e['echec_si'], out)
        if m:
            ok = False; pourquoi = f"« {m.group(0)[:80]} » dans la sortie"
    if t == 'captures':
        res['chiffres'], res['detail'], res['images'] = chiffres_captures(d)
    elif t == 'singe':
        res['chiffres'], res['detail'], res['images'] = chiffres_singe(d)
    elif t == 'banc':
        res['chiffres'], res['detail'], res['images'] = chiffres_banc(os.path.join(d, 'banc.json'))
    if e.get('chiffres'):
        vals = re.findall(e['chiffres'], out)
        if vals:
            v = vals[-1]
            res['chiffres'] = ' · '.join(x for x in ((res['chiffres'],) + ((v,) if isinstance(v, str) else tuple(v))) if x)
    if t == 'commande' and e.get('images'):  # images produites par la commande (planche de compare.py…) jointes au rapport
        res['images'] = [os.path.join(RAC, x) for x in e['images'] if os.path.exists(os.path.join(RAC, x))]
    if t == 'commande' and not res['chiffres']:
        lignes = [l for l in out.strip().split('\n') if l.strip()]
        res['chiffres'] = lignes[-1][:200] if lignes else ''
    res['statut'] = 'ok' if ok else 'delai' if code is None else 'reserve' if e.get('reserve') else 'echec'  # un délai dépassé n'est jamais une simple réserve
    res['pourquoi'] = pourquoi
    if not ok:
        res['fin_sortie'] = out[-3000:]
    return res


PARIS = datetime.timezone(datetime.timedelta(hours=1))  # même heure que bureau.py


def noter_chrono(jeu, etape, commande, s, code):
    p = os.path.join(RAC, 'bureau', 'retours-outils', 'chronos.jsonl')
    if not os.path.isdir(os.path.dirname(p)):
        return
    try:
        with open(p, 'a', encoding='utf-8') as f:
            f.write(json.dumps({'quand': datetime.datetime.now(PARIS).strftime('%Y-%m-%d %H:%M'), 'jeu': jeu, 'etape': 'verif · ' + etape,
                                'commande': commande[:200], 'secondes': s, 'code': code}, ensure_ascii=False) + '\n')
    except OSError:
        pass


SIGNE = {'ok': '✔', 'echec': '✘', 'delai': '⌛', 'reserve': '⚠', 'saute': '·'}


def vignette(src, dst, largeur=1400):
    """Planche réduite en JPEG pour le rapport (une planche PNG pleine taille pèse plusieurs Mo)."""
    try:
        from PIL import Image
        im = Image.open(src); im.thumbnail((largeur, largeur * 3)); im.convert('RGB').save(dst, quality=82)
        return True
    except Exception:
        try:
            shutil.copy(src, dst); return True
        except Exception:
            return False


def rapport(sortie, cfg, R, duree, mode, budget):
    ok_all = not any(r['statut'] in ('echec', 'delai') for r in R)
    reserves = [r for r in R if r['statut'] == 'reserve']
    lignes = []
    for r in R:
        cl = {'ok': 'ok', 'reserve': 'res', 'saute': 'saute'}.get(r['statut'], 'ko')
        lignes.append(f"<tr><td class={cl}>{SIGNE[r['statut']]}</td><td>{html.escape(r['nom'])}</td><td>{'' if r['statut'] == 'saute' else str(round(r.get('secondes', 0))) + ' s'}</td>"
                      f"<td>{html.escape(r.get('chiffres') or r.get('raison') or '')}{(' — <b>' + html.escape(r['pourquoi']) + '</b>') if r.get('pourquoi') else ''}</td></tr>")
    blocs = []
    for i, r in enumerate(R):
        if r['statut'] == 'saute':
            continue
        imgs = []
        for j, im in enumerate(r.get('images') or []):
            dst = f"img_{i}_{j}.jpg"
            if vignette(im, os.path.join(sortie, dst)):
                imgs.append(f'<img src="{dst}" alt="">')
        det = r.get('detail') or []
        if not (imgs or det or r.get('fin_sortie')):
            continue
        b = f"<h3>{SIGNE[r['statut']]} {html.escape(r['nom'])}</h3>"
        if r.get('commande'):
            b += f"<p class=cmd>{html.escape(r['commande'])}</p>"
        if det:
            b += '<ul>' + ''.join(f'<li>{html.escape(x)}</li>' for x in det[:30]) + '</ul>'
        b += ''.join(imgs)
        if r.get('fin_sortie'):
            b += f"<details{' open' if r['statut'] != 'reserve' else ''}><summary>fin de la sortie</summary><pre>{html.escape(r['fin_sortie'])}</pre></details>"
        blocs.append(b)
    lent = sorted([r for r in R if r['statut'] != 'saute'], key=lambda r: -r.get('secondes', 0))[:3]
    trop = duree / 60 > budget
    titre = '✔ tout est bon' if ok_all and not reserves else '⚠ bon, avec réserves' if ok_all else '✘ problème à regarder'
    H = f"""<!DOCTYPE html><html lang=fr><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>Vérification {html.escape(cfg['jeu'])}</title>
<style>body{{font:14px system-ui,sans-serif;background:#16120e;color:#eadfc8;margin:16px;max-width:1500px}}table{{border-collapse:collapse;width:100%}}td{{border-bottom:1px solid #3a3026;padding:4px 8px;vertical-align:top}}
.ok{{color:#8fd08f}}.ko{{color:#ff8a70}}.res{{color:#f0c060}}.saute{{color:#777}}img{{max-width:100%;margin:6px 0;border:1px solid #3a3026}}pre{{white-space:pre-wrap;font-size:11px;color:#bbb;background:#0e0b08;padding:8px}}
.cmd{{font:12px monospace;color:#a99}}h3{{margin-top:28px}}</style>
<h2>Vérification {html.escape(cfg['jeu'])} : {titre}</h2>
<p>{datetime.datetime.now().strftime('%d/%m/%Y %H:%M')} · mode {mode} · {duree/60:.1f} min{f' (au-delà du budget de {budget:g} min ; les plus longues : ' + ', '.join(html.escape(r['nom']) + f" {r.get('secondes', 0):.0f} s" for r in lent) + ')' if trop else ''}</p>
<table>{''.join(lignes)}</table>
{''.join(blocs)}
<p class=saute>✔ réussi · ⚠ réserve (signalée, n'empêche pas de publier) · ✘ échec · ⌛ délai dépassé · · sautée. Rendu logiciel : comparer les écarts du banc, pas les valeurs.</p></html>"""
    open(os.path.join(sortie, 'rapport.html'), 'w', encoding='utf-8').write(H)
    return ok_all, reserves, trop, lent


def main(argv):
    if any(a in ('-h', '--help', '-?', '--aide') for a in argv):  # 18/11 : « -h » était lu comme un fichier de réglages
        print(__doc__); return 0
    o = lire_args(argv)
    if not o['pos']:
        print(__doc__); return 2
    reg = os.path.abspath(o['pos'][0])
    try:
        cfg = json.load(open(reg, encoding='utf-8'))
        cfg.setdefault('jeu', os.path.basename(os.path.dirname(os.path.dirname(reg))))
        etapes = list(cfg.get('etapes') or [])
        for e in etapes:
            e.setdefault('nom', e.get('commande') or e.get('captures') or e.get('singe') or e.get('banc') or e.get('poids') or '?')
            type_etape(e)
            for k in ('ok_si', 'echec_si', 'chiffres'):
                if k in e:
                    try:
                        re.compile(e[k])
                    except re.error as ex:
                        raise ValueError(f"étape {e['nom']!r} : expression « {k} » invalide ({ex})")
        noms = [slug(e['nom']) for e in etapes]
        if len(set(noms)) != len(noms):
            raise ValueError('deux étapes ont le même nom')
    except (OSError, ValueError) as ex:
        print(f'verif.py : réglages illisibles ({reg}) : {ex}'); return 2
    if cfg.get('construire') and not o['sans_construire']:
        etapes = [{'nom': 'Construction', 'commande': cfg['construire'], 'bloquant': True, '_construction': True, 'delai_s': cfg.get('construire_delai_s', 600)}] + etapes
    choix = choisir(etapes, o)
    mode = 'complet' if o['complet'] else 'rapide'
    if o['liste']:
        if not any(r is None and not e.get('_construction') for e, r in choix):
            print('aucune étape du jeu à lancer' + (f" (rien ne correspond à {o['etapes']})" if o['etapes'] else ''))
        for e, raison in choix:
            print(f"{'·' if raison else '▸'} {e['nom']} [{type_etape(e)}]" + (f' — {raison}' if raison else ''))
        return 0
    if not any(r is None and not e.get('_construction') for e, r in choix):
        print('verif.py : aucune étape à lancer' + (f" ne correspond à {o['etapes']}" if o['etapes'] else '')); return 2
    sortie = os.path.realpath(o['sortie'] or os.path.join('/tmp', 'verif-' + cfg['jeu']))
    rac = os.path.realpath(RAC)
    # la sortie est effacée à chaque vérification : jamais dans le dépôt (ni un de ses parents), jamais un dossier étranger
    if sortie == rac or sortie.startswith(rac + os.sep) or rac.startswith(sortie + os.sep) or os.path.dirname(reg).startswith(sortie + os.sep):
        print(f'verif.py : la sortie {sortie} est dans le dépôt ou le contient : choisir un dossier hors du dépôt (défaut /tmp/verif-<jeu>)'); return 2
    if os.path.exists(sortie) and not os.path.isdir(sortie):
        print(f'verif.py : {sortie} est un fichier'); return 2
    if os.path.isdir(sortie) and os.listdir(sortie) and not os.path.exists(os.path.join(sortie, MARQUE)):
        print(f'verif.py : {sortie} existe et ne vient pas de verif.py : choisir un autre dossier (--sortie)'); return 2
    if os.path.isdir(sortie):
        shutil.rmtree(sortie)
    os.makedirs(sortie)
    open(os.path.join(sortie, MARQUE), 'w').write('dossier de sortie de outils-communs/verif.py : effacé à chaque vérification\n')
    budget = float(cfg.get('budget_min', 10))
    print(f"Vérification {cfg['jeu']} ({mode}) · {sum(1 for _, r in choix if r is None)} étape(s) · rapport : {os.path.join(sortie, 'rapport.html')}", flush=True)
    t0 = time.time(); R = []; arret = None
    for e, raison in choix:
        if raison or arret:
            R.append({'nom': e['nom'], 'type': type_etape(e), 'statut': 'saute', 'raison': raison or f'non lancée : « {arret} » a échoué'})
            print(f"  · {e['nom']} — {R[-1]['raison']}", flush=True)
            continue
        print(f"  ▸ {e['nom']} …", flush=True)
        try:
            r = une_etape(e, o, sortie)
        except Exception as ex:  # une étape qui plante (outil, réglage) ne coupe pas la vérification
            r = {'nom': e['nom'], 'type': type_etape(e), 'statut': 'echec', 'secondes': 0, 'chiffres': '', 'pourquoi': f'verif.py : {type(ex).__name__} : {ex}'[:300]}
        R.append(r)
        print(f"  {SIGNE[r['statut']]} {e['nom']} ({r.get('secondes', 0):.0f} s) {r.get('chiffres', '')}" + (f" — {r['pourquoi']}" if r.get('pourquoi') else ''), flush=True)
        for x in (r.get('detail') or [])[:4] if r['statut'] != 'ok' else []:
            print(f'      {x}')
        if not o['sans_chrono'] and r['type'] != 'poids':
            noter_chrono(cfg['jeu'], e['nom'], r.get('commande', ''), r.get('secondes', 0), r.get('code'))
        if r['statut'] in ('echec', 'delai') and e.get('bloquant') and not o['continuer']:
            arret = e['nom']
    duree = time.time() - t0
    ok_all, reserves, trop, lent = rapport(sortie, cfg, R, duree, mode, budget)
    json.dump({'jeu': cfg['jeu'], 'mode': mode, 'date': datetime.datetime.now().isoformat(timespec='seconds'), 'duree_s': round(duree),
               'ok': ok_all, 'etapes': [{k: v for k, v in r.items() if k != 'fin_sortie'} for r in R]},
              open(os.path.join(sortie, 'verif.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    res = [f"{SIGNE[r['statut']]} {r['nom']} : {r.get('chiffres') or r.get('raison') or ''}" + (f" ({r['pourquoi']})" if r.get('pourquoi') else '') for r in R]
    res.append(f"{'TOUT EST BON' if ok_all and not reserves else 'BON AVEC RÉSERVES' if ok_all else 'ÉCHEC'} · {duree/60:.1f} min"
               + (f" (budget {budget:g} min dépassé ; plus longues : " + ', '.join(f"{r['nom']} {r.get('secondes', 0):.0f} s" for r in lent) + ')' if trop else ''))
    open(os.path.join(sortie, 'resume.txt'), 'w', encoding='utf-8').write('\n'.join(res) + '\n')
    print('\n' + '\n'.join(res))
    print('rapport :', os.path.join(sortie, 'rapport.html'))
    return 0 if ok_all else 1


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
