#!/usr/bin/env python3
"""Contrôles des outils du bureau d'analyse. Tout doit être au vert avant de pousser.

    python3 finance/outils/tests/verifier_finance.py
"""

import json
import os
import sys

ICI = os.path.dirname(os.path.abspath(__file__))
OUTILS = os.path.dirname(ICI)
sys.path.insert(0, OUTILS)

import portefeuille as pf  # noqa: E402
import veille as vl  # noqa: E402

CIBLES = {
    "NVIDIA": 13.5, "S&P 500": 15.0, "Sanofi": 12.8, "Thales": 12.8,
    "Safran": 10.5, "AXA": 10.0, "Orange": 9.0, "TotalEnergies": 9.0,
    "Heineken": 7.5,
}

resultats = []


def controle(nom):
    def deco(fn):
        try:
            fn()
            resultats.append((True, nom, ""))
        except AssertionError as e:
            resultats.append((False, nom, str(e) or "assertion"))
        except Exception as e:  # noqa: BLE001
            resultats.append((False, nom, f"{type(e).__name__}: {e}"))
        return fn
    return deco


@controle("les poids font 100 %")
def _():
    cto = {k: 100.0 for k in CIBLES}
    p, total = pf.poids(cto)
    assert abs(sum(p.values()) - 100.0) < 1e-9, sum(p.values())
    assert abs(total - 900.0) < 1e-9, total


@controle("la répartition tombe juste à l'euro")
def _():
    cto = {"NVIDIA": 203, "S&P 500": 286, "Sanofi": 267, "Thales": 234,
           "Safran": 221, "AXA": 211, "Orange": 182, "TotalEnergies": 163,
           "Heineken": 152}
    for montant in (50, 120, 150, 250, 500, 501, 3000):
        plan = pf.repartir(cto, CIBLES, montant)
        assert sum(plan.values()) == montant, (montant, sum(plan.values()))


@controle("on n'alimente pas une ligne sur-pondérée quand d'autres manquent")
def _():
    # NVIDIA très au-dessus de sa cible, les autres en dessous
    cto = {"NVIDIA": 900, "S&P 500": 100, "Sanofi": 100, "Thales": 100,
           "Safran": 100, "AXA": 100, "Orange": 100, "TotalEnergies": 100,
           "Heineken": 100}
    plan = pf.repartir(cto, CIBLES, 500)
    assert plan.get("NVIDIA", 0) == 0, plan


@controle("un portefeuille vide se répartit au prorata des cibles")
def _():
    plan = pf.repartir({k: 0.0 for k in CIBLES}, CIBLES, 1000)
    assert sum(plan.values()) == 1000, sum(plan.values())
    assert plan["S&P 500"] > plan["Heineken"], plan


@controle("un versement nul ne produit aucun achat")
def _():
    assert pf.repartir({k: 100.0 for k in CIBLES}, CIBLES, 0) == {}


@controle("le PEA n'achète que des parts entières")
def _():
    parts, investi, reliquat = pf.enveloppe_pea(150, 6.12)
    assert parts == 24, parts
    assert abs(investi - 146.88) < 0.01, investi
    assert abs(reliquat - 3.12) < 0.01, reliquat
    # un montant inférieur au prix d'une part n'achète rien
    assert pf.enveloppe_pea(5, 6.12)[0] == 0


@controle("le saveback va sur la ligne la plus sous-pondérée")
def _():
    cto = {"NVIDIA": 100, "S&P 500": 400, "Sanofi": 300, "Thales": 300,
           "Safran": 250, "AXA": 240, "Orange": 215, "TotalEnergies": 215,
           "Heineken": 180}
    nom, _m = pf.saveback(cto, CIBLES, 15)
    assert nom == "NVIDIA", nom


@controle("un fichier aux cibles fausses est refusé")
def _():
    import tempfile
    mauvais = {"cibles": {"A": 50.0, "B": 30.0}, "cto": {"A": 1.0}}
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False,
                                     encoding="utf-8") as f:
        json.dump(mauvais, f)
        chemin = f.name
    try:
        try:
            pf.charger(chemin)
        except SystemExit:
            return
        raise AssertionError("un total de cibles de 80 % aurait dû être refusé")
    finally:
        os.unlink(chemin)


@controle("une ligne du portefeuille sans cible est refusée")
def _():
    import tempfile
    mauvais = {"cibles": dict(CIBLES), "cto": {"NVIDIA": 10.0, "Inconnue": 5.0}}
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False,
                                     encoding="utf-8") as f:
        json.dump(mauvais, f)
        chemin = f.name
    try:
        try:
            pf.charger(chemin)
        except SystemExit:
            return
        raise AssertionError("une ligne sans poids cible aurait dû être refusée")
    finally:
        os.unlink(chemin)


@controle("l'exemple de portefeuille fourni est valide")
def _():
    exemple = os.path.join(OUTILS, "exemple-portefeuille.json")
    d = pf.charger(exemple)
    lignes, total = pf.ecarts(d["cto"], d["cibles"])
    assert total > 0 and len(lignes) == len(d["cibles"])


@controle("theses.json est lisible et complet")
def _():
    t = vl.charger_theses()
    for nom, d in t["lignes"].items():
        for clef in ("secteur", "these", "rupture", "suivre", "maj"):
            assert clef in d, f"{nom} : clé {clef} manquante"
        assert d["rupture"], f"{nom} : aucun critère de rupture"
    for nom in CIBLES:
        assert nom in t["lignes"], f"{nom} absent de theses.json"


@controle("la checklist de veille se génère")
def _():
    texte = vl.checklist()
    assert "VEILLE DU JOUR" in texte
    for nom in CIBLES:
        assert nom in texte, nom
    assert "Sanofi" in vl.checklist("Sanofi")


@controle("le journal se relit sans planter même vide")
def _():
    assert isinstance(vl.journal(7), str)


def main():
    print("Contrôles des outils du bureau d'analyse\n")
    for ok, nom, detail in resultats:
        marque = "  OK  " if ok else " ÉCHEC"
        print(f"[{marque}] {nom}" + (f"  → {detail}" if detail else ""))
    echecs = sum(1 for ok, _, _ in resultats if not ok)
    print(f"\n{len(resultats) - echecs}/{len(resultats)} au vert")
    return 1 if echecs else 0


if __name__ == "__main__":
    sys.exit(main())
