#!/usr/bin/env python3
"""Vies appariées : même graine, seul un choix change.
usage : python3 outils/choix_apparies.py 4000 arrange "Accepter le mariage" "Refuser" [graine]
Joue N vies (politique au hasard) deux fois avec les mêmes graines, en imposant
l'option A puis l'option B à l'événement donné ; compare le score final des vies
où l'événement est survenu (écart apparié = effet propre du choix, sans biais de sélection).
Lancer d'abord `python3 jeu/build.py` (lit build/index.html)."""
import json, os, shutil, subprocess, sys, statistics as st, tempfile
D = os.path.dirname(os.path.abspath(__file__))
N, ev, A, B = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
seed = sys.argv[5] if len(sys.argv) > 5 else "1"
s = open(os.path.join(D, "..", "build", "index.html")).read()
i, j = s.rfind("<script>"), s.rfind("</script>")
tmp = tempfile.mkdtemp()
g = os.path.join(tmp, "jeu.js"); open(g, "w").write(s[i + 8:j])
def run(lab):
    out = os.path.join(tmp, "sc.json")
    env = dict(os.environ, SEED=seed, FORCE=f"{ev}={lab}", SCORES=out)
    env.pop("CH", None); env.pop("VIES", None)
    subprocess.run(["node", os.path.join(D, "harness.js"), g, N, "random"], env=env, check=True, stdout=subprocess.DEVNULL)
    return json.load(open(out))
ra, rb = run(A), run(B)
sel = [(a, b) for a, b in zip(ra, rb) if a[2] == 1 and b[2] == 1]
pairs = [(a[0], b[0], a[1], b[1]) for a, b in sel]
shutil.rmtree(tmp, ignore_errors=True)
d = [x[0] - x[1] for x in pairs]
if len(d) < 2:
    sys.exit(f"événement {ev} : seulement {len(d)} vie(s) concernée(s) sur {N} — augmenter N")
m = st.mean(d); se = st.stdev(d) / len(d) ** .5
print(f"événement {ev} : {len(pairs)} vies sur {N} (graine {seed})")
print(f"  score moyen  {A} : {st.mean(x[0] for x in pairs):.1f}   {B} : {st.mean(x[1] for x in pairs):.1f}")
print(f"  âge moyen    {A} : {st.mean(x[2] for x in pairs):.1f}   {B} : {st.mean(x[3] for x in pairs):.1f}")
print(f"  écart apparié {A} − {B} : {m:+.2f} pts (± {1.96*se:.2f} à 95 %)")
if sel and len(sel[0][0]) > 3:
    noms = ["Longévité", "Bonheur", "Liens", "Réussite", "Héritage"]
    print("  par composante (A − B) : " + ", ".join(f"{n} {st.mean(a[3][k] - b[3][k] for a, b in sel):+.2f}" for k, n in enumerate(noms)))
    print(f"  enfants {st.mean(a[4] for a, b in sel):.2f} / {st.mean(b[4] for a, b in sel):.2f} ; a eu un partenaire {100*st.mean(a[5] for a, b in sel):.0f} % / {100*st.mean(b[5] for a, b in sel):.0f} %")
print(f"  ensemble des {N} vies : score {st.mean(x[0] for x in ra):.2f} / {st.mean(x[0] for x in rb):.2f}")
print(json.dumps({"n": len(pairs), "ecart": round(m, 2), "ic95": round(1.96 * se, 2)}))
