# Le Studio — organisation de l'entreprise de jeux de Victor

Victor est le client et décide. La conversation « Le Bureau » joue le rôle de **producteur** : elle fixe le programme, répartit les demandes, relance, et rend compte à Victor. Elle lui pose aussi les décisions à trancher.

## Organigramme
| Qui | Rôle | Touche au code des jeux ? |
|---|---|---|
| **Équipes de jeu** (une conversation ou tâche par jeu) | développent, publient, poussent | oui, uniquement leur jeu |
| **Testeur** (`roles/testeur.md`) | vérifie indépendamment avant publication ; campagnes de test sur tous les jeux | non : il rapporte des bugs |
| **Graphiste / directeur artistique** (`roles/graphiste.md`) | critique visuelle, cohérence, ressources CC0 à réutiliser | non : il produit des demandes et des ressources communes |
| **Technicien fluidité** (`roles/technicien-fluidite.md`) | mesure tous les jeux sur la même échelle, repère les scènes lentes | non : il rapporte (et améliore les outils communs de mesure) |
| **Game designer** (`roles/game-designer.md`) | joue comme un joueur, juge l'intérêt, la clarté, la prise en main | non : il propose, et pose à Victor les questions d'équilibre |
| **Ingénieur outils** (`roles/outilleur.md`) | améliore en continu les outils de fabrication (passage toutes les 4 h) | non : uniquement `outils-communs/` et des réglages d'outils |
| **Relecteur de code** (`roles/relecteur.md`) | relit le diff avant publication : régressions, sauvegardes, anciennes parties | non : il donne un feu vert ou rouge |

## Le circuit d'une amélioration
1. **Demande** au tableau d'affichage (`demandes/<id>` : `texte`, `pour`, `type` = `bug` | `art` | `perf` | `design` | `tache`, `priorite` = 1 haute … 3 basse, `de`).
2. **Équipe de jeu** : elle fait le travail avec la méthode du dépôt (mesure avant/après, captures, tests).
3. **Revue indépendante avant publication** (obligatoire pour un changement visible) :
   - le **relecteur** lit le diff ;
   - le **testeur** joue la version construite sur téléphone (390 × 844) et ordinateur, avec les robots du jeu et la sauvegarde ;
   - le **graphiste** fait la revue si le visuel change, et le **technicien fluidité** si la 3D ou le rendu change.

   Ils sont lancés comme **sous-agents** : outil Agent, `subagent_type` = le nom du rôle s'il est listé, sinon `general-purpose` avec le contenu de `studio/roles/<rôle>.md` en tête de consigne. Ils ne voient pas le travail en cours, seulement la version construite et le diff : c'est ce qui les rend utiles.
4. **Publication** seulement après un feu vert, ou avec les réserves écrites dans le bilan.
5. **Bilan** au bureau (message `type: bilan`) ; les questions de Victor vont en `type: question`.

## Les services transversaux (passages programmés par le producteur)
- **Campagne de test** : tous les jeux publiés du jour, téléphone et ordinateur. Les bugs sont classés par gravité et deviennent des demandes `type: bug`.
- **Revue artistique** : planche de captures de tous les jeux, critique au regard des goûts de Victor (réaliste, beau, pas « carré », pas enfantin), demandes `type: art` et ressources communes à préparer.
- **Banc commun de fluidité** : même machine et même méthode pour tous les jeux, classement, demandes `type: perf`.
- **Revue game design** : une vraie partie par jeu jouée par un agent. Il note ce qui ennuie, ce qui est obscur et ce qui manque, en fait des demandes `type: design`, et pose à Victor les questions d'équilibre.

Les rapports des services vont dans `studio/rapports/AAAA-MM-JJ_<service>.md` (dépôt public : rien de privé) et sont résumés au bureau.

## Règles communes
- Un service ne modifie jamais un jeu : il écrit des demandes. Seule l'équipe du jeu change son code, ce qui évite les conflits.
- Pas de changement d'équilibre, de difficulté ni de sauvegarde sans l'accord de Victor.
- Chaque critique est concrète et vérifiable : capture, chiffre, étapes pour reproduire, et ce qu'il faudrait obtenir.
