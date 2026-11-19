# Étude : la prochaine ligne du portefeuille

Demandée par Victor le 19/11/2026 : préparer la décision pour qu'elle soit prête quand les quatre conditions d'admission (`outils/cibles.json`) seront réunies — ce qui, au rythme actuel, arrivera vers fin 2027.

La conclusion tient en une phrase : **la prochaine ligne n'est pas une action, c'est un ETF marchés émergents.** Le raisonnement qui y conduit est ci-dessous, parce que c'est lui qui compte le jour où la question se posera autrement.

---

## 1. Ce qui manque réellement

La condition 3 impose de combler un manque que l'ETF monde ne donne pas déjà. Appliquée sérieusement, elle élimine presque tout.

| Manque supposé | Verdict | Pourquoi |
|---|---|---|
| **Marchés émergents** | **vrai manque** | Le MSCI World ne contient aucun pays émergent, par construction. Environ 10 à 12 % de la capitalisation mondiale est absente du portefeuille. Seul manque structurel incontestable. |
| **Petites capitalisations** | vrai manque, mal servi | Le MSCI World s'arrête aux grandes et moyennes capitalisations. Manque réel mais plus petit, et les véhicules PEA disponibles sont chers ou trop jeunes (voir §3). |
| Banques | faux manque | Déjà dans le MSCI World, et AXA couvre déjà le secteur financier en direct. |
| Utilities, immobilier coté, industrie hors défense | faux manque | Déjà dans le MSCI World. |
| **Luxe européen** | **faux manque** | LVMH, Hermès et Kering sont dans le MSCI World. Le socle indiciel est la façon dont ce portefeuille achète le luxe. La surveillance reste ouverte par intérêt, pas comme candidature. |
| Une action « pas chère » | faux manque | Un cours bas n'est pas une exposition absente. Figure dans la liste des faux motifs de `cibles.json`. |

**Conséquence sur la liste courte d'actions :** elle est vide. Aucune action ne passe la condition 3, parce qu'un ETF monde contient déjà toutes les actions qu'on pourrait vouloir ajouter. Ajouter une ligne en direct pour une exposition déjà détenue, ce n'est pas diversifier : c'est doubler un pari existant en payant 30 % de flat tax au CTO au lieu de 17,2 % au PEA.

## 2. La redondance qui existe déjà, et qui compte davantage

Avant d'ajouter quoi que ce soit, il y a une anomalie dans le portefeuille actuel : **l'ETF S&P 500 du CTO recouvre largement l'ETF monde du PEA**, le MSCI World étant composé d'environ 70 % d'actions américaines. Le portefeuille détient donc deux fois l'exposition américaine, dont une partie dans l'enveloppe la plus taxée.

À traiter avant la question de la dixième ligne, et par les versements, pas par une vente. Un ETF S&P 500 éligible PEA existe par ailleurs à 0,12 % (Amundi PEA S&P 500, `FR0011871128`), contre une détention au CTO aujourd'hui.

## 3. Les véhicules disponibles sur le PEA Trade Republic

Chiffres relevés le 19/11/2026, ISIN vérifiés sur au moins deux sources indépendantes (justETF, extraETF, documents Amundi, Bourse Direct).

### Marchés émergents

| | PAEEM | PAASI |
|---|---|---|
| Nom | Amundi PEA Emergent (MSCI Emerging) ESG Transition | Amundi PEA Asie Emergente Screened |
| ISIN | `FR0013412020` | `FR0013412012` |
| Frais | 0,30 % | 0,30 % |
| Encours | 893 M € | — |
| Lancement | avril 2019 | — |
| Réplication | synthétique (swap non financé) | synthétique |
| Prix de la part | ≈ 34,42 € | — |

PAEEM est le candidat principal : établi depuis 2019, près de 900 M € d'encours. **Réserve à connaître :** l'indice suivi applique un filtre environnemental et social qui exclut des sociétés — ce n'est pas le MSCI Emerging brut.

### Monde + émergents en une seule ligne

| | GPEA |
|---|---|
| Nom | Amundi PEA Global (MSCI ACWI) |
| ISIN | `FR0014017NX3` |
| Frais | 0,30 % |
| Encours | 86 M € |
| Lancement | juillet 2026 |
| Réplication | synthétique (swap non financé) |
| Prix de la part | ≈ 5,09 € |
| Composition | ≈ 64 % États-Unis, ≈ 12 % émergents |

**À vérifier avant toute décision :** la disponibilité sur le PEA Trade Republic. Deux sources du même auteur se contredisent — un relevé de catalogue de fin septembre 2026 l'y fait figurer, un article antérieur dit l'inverse. Victor a déjà rencontré ce cas avec DCAM, absent de son PEA. **Vérifier dans l'application avant de bâtir un plan dessus**, en cherchant par intitulé : la recherche par ISIN ne fonctionne pas chez Trade Republic.

### Petites capitalisations

| Zone | ISIN | Frais | Réserve |
|---|---|---|---|
| États-Unis (Russell 2000) | `LU1681038672` | 0,35 % | le plus cher des trois |
| Zone euro | `LU1598689153` | 0,40 % | filtre ESG, frais élevés |
| Europe développée (Vanguard) | `IE00069H3LK0` | 0,19 % | lancé en mai 2026, ≈ 73 M €, non coté à Paris, éligibilité PEA à confirmer |

Dossier plus faible : le manque est réel mais secondaire, et aucun véhicule ne combine frais bas, taille et ancienneté. À plafonner à 10 % de la poche actions si retenu un jour. Ce n'est pas le premier choix.

## 4. Les deux routes, et comment les départager

**Route A — ajouter PAEEM à côté de WPEA**, dosé à 10-12 % de la poche indicielle.
- Coût combiné : environ **0,21 % par an** (90 % à 0,20 % + 10 % à 0,30 %).
- La pondération émergents reste pilotable.
- Friction : à 34 € la part et sans fractions, une allocation de 10 % sur 400 € ne permet pas un achat chaque mois. En pratique une part tous les deux mois environ.

**Route B — router les versements vers GPEA**, sans rien vendre, en laissant WPEA en place.
- Coût : **0,30 % par an**, soit 0,09 point de plus que la route A.
- Pondération émergents figée à ≈ 12 %, entretenue automatiquement, aucun rééquilibrage à faire.
- Part à 5 €, idéale pour la contrainte des parts entières.
- Réserves : quatre mois d'historique, 86 M € d'encours, écart de suivi encore non mesurable, disponibilité Trade Republic à confirmer.

**Le critère de départage, à appliquer le jour du choix :** la route A est meilleure sur le coût et le contrôle, la route B sur la simplicité et la contrainte des parts entières. L'information qui manque aujourd'hui — l'écart de suivi réel de GPEA et la croissance de son encours — **existera précisément au moment où la porte s'ouvrira**, GPEA ayant alors 15 à 18 mois d'historique. Décider maintenant serait décider sans cette information.

Règle retenue : si à l'ouverture de la porte GPEA dépasse 300 M € d'encours avec un écart de suivi inférieur à 0,15 point par an, route B. Sinon route A.

## 5. Conséquence sur le remplacement de NVIDIA

Cette étude répond à la question laissée ouverte. Si Victor vend NVIDIA, **il n'y a pas de remplaçant à chercher** : le produit de la vente va au socle indiciel. ASML et SAP, envisagés plus tôt, échouent tous deux à la condition 3 — ils sont déjà dans le MSCI World. Et l'exposition aux semi-conducteurs que NVIDIA apportait se retrouve dans WPEA, dans l'ETF S&P 500, et dans le bloc émergents de PAEEM ou GPEA, dominé par Taïwan et la Corée du Sud.

Reste à clarifier avec Victor le motif de la vente : volatilité, valorisation, ou volonté de tout basculer au PEA. Le motif ne change plus le remplaçant, mais il change le calendrier.

## 6. À surveiller d'ici l'ouverture de la porte

Suivi inscrit dans `outils/theses.json`, section `surveillance` :
- l'encours et l'écart de suivi de GPEA, ainsi que sa présence au catalogue PEA de Trade Republic ;
- l'encours du Vanguard small caps européen, si le dossier small caps devait se renforcer ;
- la part du socle indiciel (`portefeuille.py socle`), qui est la condition déclenchante.

## Sources

- [Meilleurs ETF PEA zone par zone — Épargnant 3.0](https://www.epargnant30.fr/etf-pea/)
- [Liste des ETF PEA disponibles chez Trade Republic](https://quentinarioli.fr/liste-etf-pea-chez-trade-republic/)
- [MSCI ACWI ETF PEA : faut-il y basculer ?](https://quentinarioli.fr/msci-acwi-etf-pea-enfin-disponible/)
- [Amundi PEA Global (MSCI ACWI) — extraETF](https://extraetf.com/fr/etf-profile/FR0014017NX3)
- [Amundi PEA Emergent ESG Transition — extraETF](https://extraetf.com/fr/etf-profile/FR0013412020)
