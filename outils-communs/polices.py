#!/usr/bin/env python3
"""Polices Google intégrées dans la page : elle s'affiche avec SES polices sans réseau (app de bureau, lien bloqué, bac à sable).

usage :
  python3 outils-communs/polices.py page.html                 remplace dans la page (sur place) les <link> / @import Google Fonts
                                                              par des @font-face en base64 (woff2, sous-ensemble latin : français complet)
  python3 outils-communs/polices.py page.html -o sortie.html  écrit ailleurs (la page d'origine n'est pas touchée)
  python3 outils-communs/polices.py page.html --liste         dit ce qu'il ferait (familles, fichiers, poids ajouté), sans rien écrire
  python3 outils-communs/polices.py page.html --verifier      code 1 si la page charge encore des polices en ligne (pour verif / build)
options : --latin-ext (ajoute le sous-ensemble latin étendu : ő ł ș…, +30 à 60 % de poids) · --hors-ligne (cache seulement, aucun npm)

À brancher À LA FIN de la construction, sur la page construite (le source garde son <link>, plus simple à lire) :
  python3 build.py && python3 ../../outils-communs/polices.py ../build/index.html
Une page publiée telle quelle (sans construction) : lancer une fois sur le source, puis commiter.

D'où viennent les fichiers (licence SIL OFL ; une ligne « Polices : … (SIL OFL) » dans les crédits suffit) :
  1. studio/ressources/polices/<famille>/ (copies du studio, sans réseau) pour les graisses fixes ;
  2. sinon le paquet npm Fontsource (@fontsource/<famille>, ou @fontsource-variable/<famille> quand l'adresse demande un axe
     variable : « 400..800 », opsz, wdth), téléchargé UNE fois dans ~/.cache/gameclaude/polices (npm pack, ≈ 1 s par famille).
     fonts.googleapis.com est bloqué dans le bac à sable : c'est pour ça que les captures se faisaient en police de repli.
Code de sortie : 0 fait (ou rien à faire) · 1 --verifier : polices en ligne restantes · 3 une famille introuvable (page NON modifiée).
"""
import base64, glob, json, os, re, shutil, subprocess, sys, tarfile, tempfile, urllib.parse

ICI = os.path.dirname(os.path.abspath(__file__))
RAC = os.path.dirname(ICI)
STUDIO = os.path.join(RAC, 'studio', 'ressources', 'polices')
CACHE = os.path.join(os.path.expanduser('~'), '.cache', 'gameclaude', 'polices')
LATIN = ('U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,'
         'U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD')
MARQUE = 'data-polices="outils-communs/polices.py"'
# <link ... href="https://fonts.googleapis.com/css...">  et les préconnexions à fonts.googleapis.com / fonts.gstatic.com
RE_LINK = re.compile(r'<link\b[^>]*href\s*=\s*["\'](https?:)?//fonts\.googleapis\.com/(css2?)\?([^"\']+)["\'][^>]*>\s*', re.I)
RE_PRECO = re.compile(r'<link\b[^>]*rel\s*=\s*["\'](?:preconnect|dns-prefetch)["\'][^>]*fonts\.(?:googleapis|gstatic)\.com[^>]*>\s*'
                      r'|<link\b[^>]*fonts\.(?:googleapis|gstatic)\.com[^>]*rel\s*=\s*["\'](?:preconnect|dns-prefetch)["\'][^>]*>\s*', re.I)
RE_IMPORT = re.compile(r'@import\s+(?:url\()?\s*["\']?(https?:)?//fonts\.googleapis\.com/(css2?)\?([^"\')\s]+)["\']?\)?\s*;?', re.I)
RE_RESTE = re.compile(r'fonts\.(?:googleapis|gstatic)\.com', re.I)


def slug(nom):
    return re.sub(r'[^a-z0-9]+', '-', nom.lower()).strip('-')


def lire_adresse(version, requete):
    """→ [{'nom', 'italiques': {0,1}, 'poids': [400,…] ou None, 'plage': (a,b) ou None, 'axes': {'opsz',…}}]"""
    q = urllib.parse.parse_qs(requete.replace('&amp;', '&'), keep_blank_values=True)
    fams = []
    for f in q.get('family', []):
        if version == 'css':  # ancienne API : family=Roboto:400,700italic|Open+Sans
            for morceau in f.split('|'):
                nom, _, spec = morceau.partition(':')
                couples = []
                for v in filter(None, spec.split(',')):
                    m = re.match(r'(\d+)?(i|italic)?$', v.strip())
                    if m and (1 if m.group(2) else 0, int(m.group(1) or 400)) not in couples:
                        couples.append((1 if m.group(2) else 0, int(m.group(1) or 400)))
                couples = couples or [(0, 400)]
                fams.append({'nom': nom.strip(), 'italiques': {c[0] for c in couples}, 'poids': sorted({c[1] for c in couples}),
                             'couples': couples, 'plage': None, 'axes': set()})
            continue
        nom, _, spec = f.partition(':')
        d = {'nom': nom.strip(), 'italiques': {0}, 'poids': [400], 'couples': [(0, 400)], 'plage': None, 'axes': set()}
        if spec:
            axes, _, vals = spec.partition('@')
            axes = [a.strip() for a in axes.split(',')]
            d['axes'] = {a for a in axes if a not in ('ital', 'wght')}
            ital, poids, couples = set(), set(), []
            for tup in vals.split(';'):
                v = dict(zip(axes, tup.split(',')))
                it = int(v.get('ital', 0) or 0)
                ital.add(it)
                w = v.get('wght')
                if w and '..' in w:
                    a, b = w.split('..'); d['plage'] = (int(float(a)), int(float(b)))
                else:
                    w = int(float(w)) if w else 400
                    poids.add(w)
                    if (it, w) not in couples:
                        couples.append((it, w))
                if any('..' in v.get(a, '') for a in d['axes']):
                    d['axes'].add('_plage')
            d['italiques'] = ital or {0}
            d['poids'] = sorted(poids) if poids else ([] if d['plage'] else [400])
            d['couples'] = couples or [(0, 400)]
        fams.append(d)
    return fams


def _npm(paquet, hors_ligne):
    """Dossier extrait du paquet npm (cache partagé), ou None."""
    os.makedirs(CACHE, exist_ok=True)
    d = os.path.join(CACHE, paquet.replace('/', '__'))
    if os.path.exists(os.path.join(d, 'package', 'package.json')):
        return os.path.join(d, 'package')
    if hors_ligne or not shutil.which('npm'):
        return None
    with tempfile.TemporaryDirectory() as t:
        try:
            r = subprocess.run(['npm', 'pack', paquet, '--silent', '--pack-destination', t], capture_output=True, text=True, timeout=120)
        except (subprocess.TimeoutExpired, OSError):
            return None
        tgz = glob.glob(os.path.join(t, '*.tgz'))
        if r.returncode or not tgz:
            return None
        tmp = tempfile.mkdtemp(dir=CACHE, prefix='.part-')  # unique : deux lancements en même temps ne se gênent pas
        try:
            with tarfile.open(tgz[0]) as tf:
                membres = [m for m in tf.getmembers() if m.isfile() and not m.name.startswith('/') and '..' not in m.name
                           and (m.name.endswith(('.woff2', '.json', '.css')) or 'LICENSE' in m.name)]
                try:
                    tf.extractall(tmp, members=membres, filter='data')
                except TypeError:  # Python < 3.12
                    tf.extractall(tmp, members=membres)
        except (tarfile.TarError, OSError):  # paquet abîmé : rien dans le cache, famille introuvable (code 3)
            shutil.rmtree(tmp, ignore_errors=True)
            return None
        try:
            os.rename(tmp, d)
        except OSError:  # un autre lancement l'a extrait entre-temps : on garde le sien
            shutil.rmtree(tmp, ignore_errors=True)
    return os.path.join(d, 'package') if os.path.exists(os.path.join(d, 'package', 'package.json')) else None


def _faces_css(css, sous_ensembles):
    """@font-face d'un CSS Fontsource, gardés pour les sous-ensembles voulus : [(dict des propriétés, fichier relatif)]."""
    out = []
    for m in re.finditer(r'/\*\s*([^*]+?)\s*\*/\s*@font-face\s*\{([^}]*)\}', css):
        etiquette, corps = m.group(1), m.group(2)
        props = dict((k.strip(), v.strip()) for k, v in (p.split(':', 1) for p in corps.split(';') if ':' in p))
        if not any(re.search(rf'-{s}-', etiquette + '-') for s in sous_ensembles):
            continue
        if 'latin-ext' not in sous_ensembles and '-latin-ext-' in etiquette + '-':
            continue
        f = re.search(r"url\(\s*['\"]?([^'\")]+\.woff2)", props.get('src', ''))
        if f:
            out.append((props, f.group(1)))
    return out


def faces(fam, latin_ext=False, hors_ligne=False, avert=None):
    """@font-face (texte) d'une famille demandée, et la liste des fichiers utilisés. Lève LookupError si introuvable."""
    s = slug(fam['nom'])
    sous = ['latin', 'latin-ext'] if latin_ext else ['latin']
    variable = bool(fam['plage'] or fam['axes'])
    res, fichiers = [], []
    avert = [] if avert is None else avert

    def face(props, chemin, poids, style, famille=fam['nom']):
        b = base64.b64encode(open(chemin, 'rb').read()).decode()
        lignes = [f"font-family:'{famille}'", f'font-style:{style}', f'font-weight:{poids}', 'font-display:swap']
        if props.get('font-stretch'):
            lignes.append(f"font-stretch:{props['font-stretch']}")
        ur = props.get('unicode-range') or LATIN
        fmt = "woff2-variations" if variable else 'woff2'
        res.append('@font-face{' + ';'.join(lignes) + f";src:url(data:font/woff2;base64,{b}) format('{fmt}');unicode-range:{ur}}}")
        fichiers.append(chemin)

    if not variable:
        manque = []
        couples = fam.get('couples') or [(i, w) for w in fam['poids'] for i in sorted(fam['italiques'])]
        for it, w in sorted(couples, key=lambda c: (c[1], c[0])):
            style = 'italic' if it else 'normal'
            loc = os.path.join(STUDIO, s, f'{s}-latin-{w}-{style}.woff2')
            if os.path.exists(loc) and not latin_ext:
                face({}, loc, w, style)
                continue
            manque.append((w, style))
        if manque:
            pk = _npm(f'@fontsource/{s}', hors_ligne)
            if not pk:
                raise LookupError(f"{fam['nom']} : paquet @fontsource/{s} introuvable (réseau npm ?)")
            for w, style in manque:
                css_f = os.path.join(pk, f'{w}{"-italic" if style == "italic" else ""}.css')
                trouves = _faces_css(open(css_f, encoding='utf-8').read(), sous) if os.path.exists(css_f) else []
                if not trouves:
                    raise LookupError(f"{fam['nom']} : graisse {w} {style} absente de @fontsource/{s}")
                for props, rel in trouves:
                    face(props, os.path.join(pk, rel), w, style)
        return res, fichiers
    pk = _npm(f'@fontsource-variable/{s}', hors_ligne)
    if not pk:
        raise LookupError(f"{fam['nom']} : paquet @fontsource-variable/{s} introuvable (réseau npm ?)")
    axes = fam['axes'] - {'_plage'}
    # Fontsource : wght.css = graisse seule ; <axe>.css = graisse + cet axe ; full.css = tous les axes ; standard.css = axes courants
    choix = ['wght'] if not axes else ([next(iter(axes)).lower()] if len(axes) == 1 else []) + ['full', 'standard']
    for it in sorted(fam['italiques']):
        suf = '-italic' if it else ''
        nom_css = next((a for a in choix if os.path.exists(os.path.join(pk, f'{a}{suf}.css'))), None)
        if not nom_css:
            raise LookupError(f"{fam['nom']} : aucun fichier d'axes ({', '.join(a + suf for a in choix)}) dans @fontsource-variable/{s}")
        if axes and nom_css == 'standard':
            avert.append(f"{fam['nom']} : axes {', '.join(sorted(axes))} demandés, fichier « standard » (axes courants seulement) : vérifier le rendu")
        avant = len(res)
        for props, rel in _faces_css(open(os.path.join(pk, f'{nom_css}{suf}.css'), encoding='utf-8').read(), sous):
            style = props.get('font-style', 'normal')
            if (1 if style == 'italic' else 0) != it:
                continue
            face(props, os.path.join(pk, rel), props.get('font-weight', '100 900'), style)
        if len(res) == avant:
            raise LookupError(f"{fam['nom']} : rien de latin {'italique ' if it else ''}dans {nom_css}{suf}.css de @fontsource-variable/{s}")
    return res, fichiers


RE_MASQUE = re.compile(r'<script\b.*?</script\s*>|<!--.*?-->', re.I | re.S)
RE_STYLE = re.compile(r'(<style\b[^>]*>)(.*?)(</style\s*>)', re.I | re.S)


def _hors_masques(html, f):
    """Applique f(texte) seulement hors des <script> et des commentaires HTML (un lien dans une chaîne JS n'est pas touché)."""
    out, i = [], 0
    for m in RE_MASQUE.finditer(html):
        out += [f(html[i:m.start()]), m.group(0)]; i = m.end()
    return ''.join(out + [f(html[i:])])


def _imports(css, sub):
    """@import Google remplacés hors des commentaires CSS."""
    morceaux = re.split(r'(/\*.*?\*/)', css, flags=re.S)
    return ''.join(x if x.startswith('/*') else RE_IMPORT.sub(sub, x) for x in morceaux)


def compter(html):
    """Liens et @import Google ACTIFS (hors scripts et commentaires), et ceux qui sont dans un script (non remplaçables)."""
    n = [0]
    def f(t):
        n[0] += len(RE_LINK.findall(t))
        for m in RE_STYLE.finditer(t):
            n[0] += sum(len(RE_IMPORT.findall(x)) for x in re.split(r'/\*.*?\*/', m.group(2), flags=re.S))
        return t
    _hors_masques(html, f)
    dans_js = sum(len(RE_LINK.findall(m.group(0))) + len(RE_IMPORT.findall(m.group(0))) for m in RE_MASQUE.finditer(html) if m.group(0)[:7].lower() == '<script')
    return n[0], dans_js


def integrer(html, latin_ext=False, hors_ligne=False):
    """→ (nouvelle page, rapport). Lève LookupError si une famille manque (rien n'est remplacé)."""
    rap = {'familles': [], 'fichiers': 0, 'ajout_ko': 0, 'remplaces': 0, 'avertissements': []}
    vus = {}

    def css_de(version, requete):
        blocs = []
        for fam in lire_adresse(version, requete):
            cle = (fam['nom'], tuple(fam['poids']), tuple(sorted(fam['italiques'])), fam['plage'], tuple(sorted(fam['axes'])))
            if cle in vus:
                continue
            fs, fichiers = faces(fam, latin_ext, hors_ligne, rap['avertissements'])
            vus[cle] = 1
            blocs += fs
            ko = sum(len(f) for f in fs) / 1024
            rap['familles'].append({'nom': fam['nom'], 'faces': len(fs), 'ko': round(ko),
                                    'source': 'studio' if all(f.startswith(STUDIO) for f in fichiers) else 'fontsource',
                                    'variable': bool(fam['plage'] or fam['axes'])})
            rap['fichiers'] += len(fichiers); rap['ajout_ko'] += ko
        return '\n'.join(blocs)

    def sub_link(m):
        rap['remplaces'] += 1
        return f'<style {MARQUE}>\n{css_de(m.group(2), m.group(3))}\n</style>\n'

    def sub_import(m):
        rap['remplaces'] += 1
        return css_de(m.group(2), m.group(3))

    def actif(t):
        t = RE_LINK.sub(sub_link, t)
        t = RE_STYLE.sub(lambda m: m.group(1) + _imports(m.group(2), sub_import) + m.group(3), t)
        return t
    out = _hors_masques(html, actif)
    n0 = len(out)
    out = _hors_masques(out, lambda t: RE_PRECO.sub('', t))
    rap['dans_script'] = compter(out)[1]
    rap['preconnexions_retirees'] = 1 if len(out) != n0 else 0
    rap['ajout_ko'] = round(len(out.encode()) / 1024 - len(html.encode()) / 1024)
    return out, rap


def main(argv):
    if not argv or argv[0] in ('-h', '--help'):
        print(__doc__); return 0
    pos, sortie, i = [], None, 0
    while i < len(argv):
        if argv[i] == '-o':
            if i + 1 >= len(argv):
                print('polices.py : -o sans fichier de sortie', file=sys.stderr); return 2
            sortie = argv[i + 1]; i += 2; continue
        if not argv[i].startswith('-'):
            pos.append(argv[i])
        i += 1
    if not pos:
        print('polices.py : page à traiter manquante', file=sys.stderr); return 2
    page = pos[0]; sortie = sortie or page
    if not os.path.exists(page):
        print(f'polices.py : page introuvable : {page}', file=sys.stderr); return 2
    html = open(page, encoding='utf-8').read()
    if '--verifier' in argv:
        n, js = compter(html)
        print((f'polices en ligne : {n} lien(s) / @import Google Fonts' if n else 'polices : aucune police en ligne')
              + (f' ; {js} dans un <script> (à intégrer à la main)' if js else ''))
        return 1 if n or js else 0
    try:
        out, rap = integrer(html, '--latin-ext' in argv, '--hors-ligne' in argv)
    except LookupError as e:
        print(f'polices.py : {e} — page non modifiée', file=sys.stderr); return 3
    if not rap['remplaces']:
        print('polices : rien à intégrer (aucun lien Google Fonts actif)' + (f" ; {rap['dans_script']} dans un <script> (non touchés)" if rap['dans_script'] else ''))
        return 0
    for a in rap['avertissements']:
        print('  ATTENTION ' + a)
    if rap['dans_script']:
        print(f"  ATTENTION {rap['dans_script']} lien(s) Google Fonts dans un <script> : non touchés (le JS les ajoute ; à intégrer à la main)")
    for f in rap['familles']:
        print(f"  {f['nom']:<24} {f['faces']} face(s) {'variable ' if f['variable'] else ''}{f['ko']:>4} Kio  ({f['source']})")
    print(f"polices : {rap['remplaces']} lien(s) remplacé(s), {len(rap['familles'])} familles, +{rap['ajout_ko']} Kio")
    if '--liste' in argv:
        return 0
    if '--json' in argv:
        print(json.dumps(rap, ensure_ascii=False))
    with open(sortie, 'w', encoding='utf-8') as fo:
        fo.write(out)
    print(f'écrit : {sortie}')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
