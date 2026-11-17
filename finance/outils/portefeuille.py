#!/usr/bin/env python3
"""Outils du bureau d'analyse — poids, écarts et répartition d'un versement.

Aucune donnée personnelle ici : le portefeuille est fourni à l'exécution,
dans un fichier JSON qui n'est PAS versionné (le dépôt est public).

Les règles d'allocation (poids cibles, montants mensuels, seuil de
rééquilibrage) viennent de `cibles.json`, à côté de ce script : c'est la source
unique de vérité, pour qu'elles ne dérivent pas d'une séance à l'autre.

Format du fichier d'entrée (voir exemple-portefeuille.json) :

    {
      "cto":      {"NVIDIA": 203.5, "S&P 500": 286.1, ...}, # valorisation en €
      "pea":      {"WPEA": 100.0},
      "prix_part": {"WPEA": 6.12}                            # pour le PEA sans fractions
    }

La clé "cibles" est optionnelle : sans elle, ce sont celles de cibles.json.

Usage :
    python3 portefeuille.py poids      portefeuille.json
    python3 portefeuille.py repartir   portefeuille.json            # montants de cibles.json
    python3 portefeuille.py repartir   portefeuille.json --cto 250 --pea 400
    python3 portefeuille.py saveback   portefeuille.json
    python3 portefeuille.py socle      portefeuille.json
"""

import argparse
import json
import os
import sys

ICI = os.path.dirname(os.path.abspath(__file__))
CIBLES = os.path.join(ICI, "cibles.json")


def charger_regles():
    with open(CIBLES, encoding="utf-8") as f:
        return json.load(f)


# ---------------------------------------------------------------- chargement

def charger(chemin, regles=None):
    regles = regles or charger_regles()
    with open(chemin, encoding="utf-8") as f:
        d = json.load(f)
    if "cto" not in d:
        raise SystemExit("Fichier invalide : clé « cto » manquante.")
    if "cibles" not in d:  # source unique de vérité
        d["cibles"] = {k: float(v) for k, v in regles["cibles_cto"].items()
                       if not k.startswith("_")}
    somme = sum(d["cibles"].values())
    if abs(somme - 100.0) > 0.51:
        raise SystemExit(
            f"Les poids cibles font {somme:.2f} % au lieu de 100 %. Corrige le fichier."
        )
    inconnues = set(d["cto"]) - set(d["cibles"])
    if inconnues:
        raise SystemExit(f"Lignes sans poids cible : {', '.join(sorted(inconnues))}")
    return d


# ------------------------------------------------------------------- calculs

def poids(cto):
    total = sum(cto.values())
    if total <= 0:
        raise SystemExit("Portefeuille vide : impossible de calculer des poids.")
    return {k: v / total * 100.0 for k, v in cto.items()}, total


def ecarts(cto, cibles):
    p, total = poids(cto)
    lignes = []
    for nom in cibles:
        actuel = p.get(nom, 0.0)
        cible = cibles[nom]
        lignes.append(
            {
                "nom": nom,
                "valeur": cto.get(nom, 0.0),
                "poids": actuel,
                "cible": cible,
                "ecart": actuel - cible,
            }
        )
    lignes.sort(key=lambda x: x["ecart"])  # les plus sous-pondérées d'abord
    return lignes, total


def repartir(cto, cibles, montant, seuil=0.0):
    """Rééquilibrage par les achats : on comble les manques, on n'allège rien.

    Pour chaque ligne, besoin = poids cible du total APRÈS versement - valeur
    actuelle. Les besoins négatifs (lignes déjà sur-pondérées) sont mis à zéro :
    on ne vend jamais. Le montant est réparti au prorata des besoins, puis
    arrondi à l'euro par la méthode des plus grands restes, pour que la somme
    tombe juste.

    `seuil` (en points de pourcentage) écarte les lignes dont l'écart à la cible
    est du bruit : viser 0,3 point sur quelques centaines d'euros crée un rituel
    mensuel sans effet. Si aucune ligne ne dépasse le seuil, on répartit au
    prorata des cibles.
    """
    if montant <= 0:
        return {}
    total_apres = sum(cto.values()) + montant
    p, _ = poids(cto) if sum(cto.values()) > 0 else ({}, 0)
    besoins = {}
    for nom, cible in cibles.items():
        if seuil > 0 and p and (cible - p.get(nom, 0.0)) < seuil:
            besoins[nom] = 0.0
            continue
        besoin = total_apres * cible / 100.0 - cto.get(nom, 0.0)
        besoins[nom] = max(besoin, 0.0)

    somme = sum(besoins.values())
    if somme <= 0:  # portefeuille parfaitement équilibré : au prorata des cibles
        besoins = dict(cibles)
        somme = sum(besoins.values())

    brut = {nom: montant * b / somme for nom, b in besoins.items()}
    return _arrondir_a_la_somme(brut, montant)


def _arrondir_a_la_somme(brut, total_cible):
    """Arrondit à l'euro en garantissant que la somme vaut exactement total_cible."""
    total_cible = int(round(total_cible))
    plancher = {k: int(v) for k, v in brut.items()}
    reste = total_cible - sum(plancher.values())
    ordre = sorted(brut, key=lambda k: (brut[k] - plancher[k], brut[k]), reverse=True)
    for i in range(reste):
        plancher[ordre[i % len(ordre)]] += 1
    return {k: v for k, v in plancher.items() if v > 0}


def enveloppe_pea(montant, prix_part):
    """Le PEA Trade Republic n'accepte pas les fractions d'action.

    Renvoie (nombre de parts, montant investi, reliquat non investi).
    """
    if prix_part <= 0:
        raise SystemExit("Prix de la part invalide.")
    parts = int(montant // prix_part)
    investi = round(parts * prix_part, 2)
    return parts, investi, round(montant - investi, 2)


def saveback(cto, cibles, montant):
    """Une seule ligne : la plus sous-pondérée (le saveback n'est pas divisible)."""
    lignes, _ = ecarts(cto, cibles)
    return lignes[0]["nom"], montant


def socle(donnees, regles):
    """Part du socle indiciel (ETF) sur l'ensemble PEA + CTO, et écart à l'objectif.

    C'est le seul chiffre qui dit si la correction du 17/11/2026 avance : tant
    que le socle reste minoritaire, le portefeuille est un ETF fait à la main.
    """
    obj = regles["objectif_socle"]
    composantes = set(obj["composantes"])
    cto = donnees["cto"]
    pea = donnees.get("pea", {})
    total = sum(cto.values()) + sum(pea.values())
    if total <= 0:
        raise SystemExit("Portefeuille vide.")
    indiciel = sum(v for k, v in cto.items() if k in composantes)
    indiciel += sum(v for k, v in pea.items() if k in composantes)
    part = indiciel / total * 100.0
    return {
        "part": part,
        "visee": float(obj["part_visee"]),
        "ecart": part - float(obj["part_visee"]),
        "total": total,
    }


# ------------------------------------------------------------------ affichage

def tableau(lignes, total):
    larg = max(len(l["nom"]) for l in lignes)
    out = [f"Portefeuille : {total:,.2f} €".replace(",", " ")]
    out.append(f"{'Ligne'.ljust(larg)}  {'Valeur':>10}  {'Poids':>7}  {'Cible':>7}  {'Écart':>7}")
    out.append("-" * (larg + 38))
    for l in lignes:
        marque = "  " if abs(l["ecart"]) < 0.5 else (" <" if l["ecart"] < 0 else " >")
        out.append(
            f"{l['nom'].ljust(larg)}  {l['valeur']:>10.2f}  {l['poids']:>6.2f}%  "
            f"{l['cible']:>6.2f}%  {l['ecart']:>+6.2f}%{marque}"
        )
    return "\n".join(out)


def main(argv=None):
    p = argparse.ArgumentParser(description="Bureau d'analyse — outils de portefeuille")
    sub = p.add_subparsers(dest="cmd", required=True)

    a = sub.add_parser("poids", help="poids actuels, cibles et écarts")
    a.add_argument("fichier")

    b = sub.add_parser("repartir", help="répartir le versement du mois")
    b.add_argument("fichier")
    b.add_argument("--cto", type=float, default=None, help="défaut : cibles.json")
    b.add_argument("--pea", type=float, default=None, help="défaut : cibles.json")
    b.add_argument("--etf-pea", default=None, help="nom de la ligne ETF du PEA")
    b.add_argument("--seuil", type=float, default=None,
                   help="points d'écart en dessous desquels une ligne n'est pas "
                        "alimentée (défaut : cibles.json)")

    c = sub.add_parser("saveback", help="sur quelle ligne placer le saveback")
    c.add_argument("fichier")
    c.add_argument("--montant", type=float, default=None, help="défaut : cibles.json")

    e = sub.add_parser("socle", help="part du socle indiciel et écart à l'objectif")
    e.add_argument("fichier")

    args = p.parse_args(argv)
    regles = charger_regles()
    d = charger(args.fichier, regles)
    cto, cibles = d["cto"], d["cibles"]

    if args.cmd == "poids":
        lignes, total = ecarts(cto, cibles)
        print(tableau(lignes, total))
        return 0

    if args.cmd == "socle":
        s = socle(d, regles)
        print(f"Portefeuille total : {s['total']:,.2f} €".replace(",", " "))
        print(f"Socle indiciel     : {s['part']:.1f} %  (objectif "
              f"{s['visee']:.0f} %, écart {s['ecart']:+.1f} pts)")
        if s["ecart"] < -5:
            print("  → l'argent neuf doit continuer à aller d'abord au socle du PEA.")
        else:
            print("  → objectif atteint ou proche : le partage mensuel peut être revu.")
        return 0

    if args.cmd == "saveback":
        montant = args.montant if args.montant is not None else \
            float(regles["saveback"]["montant_habituel"])
        nom, m = saveback(cto, cibles, montant)
        print(f"Saveback de {m:.0f} € → {nom} (ligne la plus sous-pondérée)")
        return 0

    # repartir
    m_cto = args.cto if args.cto is not None else float(regles["versement_mensuel"]["cto"])
    m_pea = args.pea if args.pea is not None else float(regles["versement_mensuel"]["pea"])
    seuil = args.seuil if args.seuil is not None else \
        float(regles["seuil_rebalancement"]["points"])
    args.cto, args.pea = m_cto, m_pea

    lignes, total = ecarts(cto, cibles)
    print(tableau(lignes, total))
    s = socle(d, regles)
    print(f"\nSocle indiciel : {s['part']:.1f} % (objectif {s['visee']:.0f} %)")
    if args.cto > 0:
        plan = repartir(cto, cibles, args.cto, seuil)
        print(f"\nCTO — {args.cto:.0f} €  (seuil {seuil:.0f} pt, les lignes à moins de "
              f"{seuil:.0f} pt de leur cible ne reçoivent rien)")
        for nom, euros in sorted(plan.items(), key=lambda x: -x[1]):
            print(f"  {nom:<14} {euros:>5} €")
        verif = sum(plan.values())
        print(f"  {'TOTAL':<14} {verif:>5} €  {'OK' if verif == int(round(args.cto)) else 'ÉCART !'}")
    if args.pea > 0:
        etf = args.etf_pea or next(iter(d.get("pea", {"WPEA": 0})))
        prix = d.get("prix_part", {}).get(etf)
        print(f"\nPEA — {args.pea:.0f} € sur {etf}")
        if prix:
            parts, investi, reliquat = enveloppe_pea(args.pea, prix)
            print(f"  {parts} parts à {prix:.2f} € = {investi:.2f} € investis, "
                  f"{reliquat:.2f} € non investis (pas de fractions sur le PEA)")
        else:
            print("  prix de la part inconnu : ajoute « prix_part » au fichier "
                  "pour calculer le nombre entier de parts")
    return 0


if __name__ == "__main__":
    sys.exit(main())
