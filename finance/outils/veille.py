#!/usr/bin/env python3
"""Outils du bureau d'analyse — veille et mémoire d'une analyse à l'autre.

Trois commandes :
  checklist   ce qu'il faut vérifier aujourd'hui, ligne par ligne (à chercher sur le web)
  alerte      enregistre un fait dans le journal (une alerte émise, un résultat publié)
  journal     relit les derniers faits enregistrés, pour ne pas répéter une alerte

Le journal est versionné (finance/journal/faits.jsonl) : il ne contient que des
faits publics sur les sociétés, jamais de montant ni de valorisation. Le dépôt
est public.

Usage :
    python3 veille.py checklist
    python3 veille.py checklist --ligne Safran
    python3 veille.py alerte Safran "guidance 2027 relevée" --source https://...
    python3 veille.py alerte --surveillance luxe-europeen "Kering : objectifs stabilisés"
    python3 veille.py journal --jours 14
"""

import argparse
import json
import os
import sys
from datetime import datetime, timedelta, timezone

ICI = os.path.dirname(os.path.abspath(__file__))
THESES = os.path.join(ICI, "theses.json")
JOURNAL = os.path.join(os.path.dirname(ICI), "journal", "faits.jsonl")

# Ce qui justifie une alerte. Le niveau du cours n'en fait pas partie.
MOTIFS = [
    "dividende coupé, suspendu ou gelé",
    "avertissement sur résultats ou guidance abaissée",
    "mouvement de cours supérieur à 7 % sur la séance, avec son explication",
    "publication de résultats (ou date dans les 3 jours)",
    "opération capitalistique : fusion, cession, augmentation de capital",
    "changement de direction générale ou scandale",
    "critère de rupture de thèse atteint (voir theses.json)",
]


def charger_theses():
    with open(THESES, encoding="utf-8") as f:
        return json.load(f)


def checklist(ligne=None):
    t = charger_theses()
    out = ["VEILLE DU JOUR — à vérifier par recherche web, puis se taire s'il n'y a rien.", ""]
    out.append("Motifs d'alerte (aucun autre) :")
    for m in MOTIFS:
        out.append(f"  · {m}")
    out.append("")
    lignes = t["lignes"]
    noms = [ligne] if ligne else list(lignes)
    for nom in noms:
        if nom not in lignes:
            raise SystemExit(f"Ligne inconnue : {nom}. Connues : {', '.join(lignes)}")
        d = lignes[nom]
        out.append(f"{nom} ({d['secteur']})")
        out.append(f"  thèse   : {d['these']}")
        out.append(f"  suivre  : {', '.join(d['suivre'])}")
        out.append(f"  rupture : {' | '.join(d['rupture'])}")
        out.append("")
    if not ligne:
        out.append("Surveillances ouvertes :")
        for clef, d in t.get("surveillance", {}).items():
            out.append(f"  {clef} — {d['statut']}")
            if "declencheur" in d:
                out.append(f"    déclencheur : {d['declencheur']}")
    return "\n".join(out)


def alerte(sujet, texte, source=None, surveillance=False):
    t = charger_theses()
    espace = "surveillance" if surveillance else "lignes"
    if sujet not in t.get(espace, {}):
        raise SystemExit(f"Sujet inconnu dans {espace} : {sujet}")
    os.makedirs(os.path.dirname(JOURNAL), exist_ok=True)
    fait = {
        "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "espace": espace,
        "sujet": sujet,
        "fait": texte,
        "source": source or "",
    }
    with open(JOURNAL, "a", encoding="utf-8") as f:
        f.write(json.dumps(fait, ensure_ascii=False) + "\n")
    return fait


def journal(jours=30, sujet=None):
    if not os.path.exists(JOURNAL):
        return "Journal vide : aucune alerte enregistrée pour l'instant."
    limite = (datetime.now(timezone.utc) - timedelta(days=jours)).strftime("%Y-%m-%d")
    faits = []
    with open(JOURNAL, encoding="utf-8") as f:
        for ligne in f:
            ligne = ligne.strip()
            if not ligne:
                continue
            try:
                d = json.loads(ligne)
            except json.JSONDecodeError:
                continue
            if d.get("date", "") >= limite and (not sujet or d.get("sujet") == sujet):
                faits.append(d)
    if not faits:
        return f"Aucun fait enregistré sur les {jours} derniers jours."
    faits.sort(key=lambda d: d["date"], reverse=True)
    out = [f"{len(faits)} fait(s) sur les {jours} derniers jours :", ""]
    for d in faits:
        src = f"  ({d['source']})" if d.get("source") else ""
        out.append(f"  {d['date']}  {d['sujet']:<14} {d['fait']}{src}")
    return "\n".join(out)


def main(argv=None):
    p = argparse.ArgumentParser(description="Bureau d'analyse — veille")
    sub = p.add_subparsers(dest="cmd", required=True)

    a = sub.add_parser("checklist", help="ce qu'il faut vérifier aujourd'hui")
    a.add_argument("--ligne", default=None)

    b = sub.add_parser("alerte", help="enregistrer un fait dans le journal")
    b.add_argument("sujet")
    b.add_argument("texte")
    b.add_argument("--source", default=None)
    b.add_argument("--surveillance", action="store_true",
                   help="le sujet est une surveillance (luxe-europeen…), pas une ligne")

    c = sub.add_parser("journal", help="relire les faits récents")
    c.add_argument("--jours", type=int, default=30)
    c.add_argument("--sujet", default=None)

    args = p.parse_args(argv)
    if args.cmd == "checklist":
        print(checklist(args.ligne))
    elif args.cmd == "alerte":
        f = alerte(args.sujet, args.texte, args.source, args.surveillance)
        print(f"Enregistré : {f['date']} {f['sujet']} — {f['fait']}")
    else:
        print(journal(args.jours, args.sujet))
    return 0


if __name__ == "__main__":
    sys.exit(main())
