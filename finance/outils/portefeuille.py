#!/usr/bin/env python3
"""Outils du bureau d'analyse — poids, écarts et répartition d'un versement.

Aucune donnée personnelle ici : le portefeuille est fourni à l'exécution,
dans un fichier JSON qui n'est PAS versionné (le dépôt est public).

Format du fichier d'entrée (voir exemple-portefeuille.json) :

    {
      "cibles":   {"NVIDIA": 13.5, "S&P 500": 15.0, ...},   # en %
      "cto":      {"NVIDIA": 203.5, "S&P 500": 286.1, ...}, # valorisation en €
      "pea":      {"WPEA": 100.0},
      "prix_part": {"WPEA": 6.12}                            # pour le PEA sans fractions
    }

Usage :
    python3 portefeuille.py poids      portefeuille.json
    python3 portefeuille.py repartir   portefeuille.json --cto 500 --pea 150
    python3 portefeuille.py saveback   portefeuille.json --montant 15
"""

import argparse
import json
import sys


# ---------------------------------------------------------------- chargement

def charger(chemin):
    with open(chemin, encoding="utf-8") as f:
        d = json.load(f)
    for clef in ("cibles", "cto"):
        if clef not in d:
            raise SystemExit(f"Fichier invalide : clé « {clef} » manquante.")
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


def repartir(cto, cibles, montant):
    """Rééquilibrage par les achats : on comble les manques, on n'allège rien.

    Pour chaque ligne, besoin = poids cible du total APRÈS versement - valeur
    actuelle. Les besoins négatifs (lignes déjà sur-pondérées) sont mis à zéro :
    on ne vend jamais. Le montant est réparti au prorata des besoins, puis
    arrondi à l'euro par la méthode des plus grands restes, pour que la somme
    tombe juste.
    """
    if montant <= 0:
        return {}
    total_apres = sum(cto.values()) + montant
    besoins = {}
    for nom, cible in cibles.items():
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
    b.add_argument("--cto", type=float, default=0.0)
    b.add_argument("--pea", type=float, default=0.0)
    b.add_argument("--etf-pea", default=None, help="nom de la ligne ETF du PEA")

    c = sub.add_parser("saveback", help="sur quelle ligne placer le saveback")
    c.add_argument("fichier")
    c.add_argument("--montant", type=float, required=True)

    args = p.parse_args(argv)
    d = charger(args.fichier)
    cto, cibles = d["cto"], d["cibles"]

    if args.cmd == "poids":
        lignes, total = ecarts(cto, cibles)
        print(tableau(lignes, total))
        return 0

    if args.cmd == "saveback":
        nom, m = saveback(cto, cibles, args.montant)
        print(f"Saveback de {m:.0f} € → {nom} (ligne la plus sous-pondérée)")
        return 0

    # repartir
    lignes, total = ecarts(cto, cibles)
    print(tableau(lignes, total))
    if args.cto > 0:
        plan = repartir(cto, cibles, args.cto)
        print(f"\nCTO — {args.cto:.0f} €")
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
