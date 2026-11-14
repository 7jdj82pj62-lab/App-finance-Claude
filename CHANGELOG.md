# Journal des modifications

## Version 20 : plus de repères visuels
De petits graphiques simples dans chaque écran, avec une palette de 8 couleurs vérifiée par calcul pour le daltonisme, en clair comme en sombre (`--s1` à `--s8`). Une couleur suit toujours la même chose (une famille de placements, une catégorie de dépenses, un compte), et chaque graphique a sa légende avec les valeurs. Toucher une barre ou une part affiche une bulle avec le détail.
- **Accueil** : courbe de la boule avec repères de temps ; nouvelles tuiles « L'essentiel » (répartition, ce qu'il reste chaque mois, anneau des projets, anneau du plan de l'année) ; barre d'avancement de « Ce mois-ci » ; « Pourquoi ça a bougé » en barres de part et d'autre de zéro.
- **Mon argent** : barre « à qui reviennent vos biens » (à vous / crédits / impôts) ; anneau de répartition avec montants ; part de chaque compte en mini-barre ; barre de remboursement de chaque crédit. Page Compte : anneau de composition. Page Crédit : courbe du capital restant dû avec « aujourd'hui » et barre du coût total (emprunté, intérêts, assurance, frais).
- **Mes coûts** : barre « où vont vos revenus » ; une couleur par catégorie ; grosses dépenses en 12 colonnes ; coût du patrimoine en barres. Page Catégorie : anneau des postes.
- **Mes projets** : un anneau par projet ; barre « ce que vos projets prennent sur votre épargne possible ». Page Projet : anneau, barre de financement par compte, courbe de trajectoire jusqu'à l'objectif.
- **Mon plan** : anneau de l'année (fait / prévu). Page Mois : barre achats, mises de côté, grosses dépenses et marge ; le « ça passe » compte maintenant les grosses dépenses du mois.

Tests : `node tests/appli.e2e.js` : **69/69**.

## Version 19 : refonte de l'appli après le questionnaire (14/11/2026)
On garde les données, les calculs et le questionnaire de départ ; tout ce qui vient après est reconstruit sur une seule interface. Règles : 5 onglets, deux niveaux au plus (l'onglet, puis la page d'un élément), un chiffre à un seul endroit, on modifie là où on voit. Il n'y a plus de « Tout le détail », de fenêtres « En savoir plus » ni d'ancienne interface cachée.

- **Accueil** (« Où j'en suis ? ») : la boule de neige (net, 30 jours, 12 mois, courbe), Ce mois-ci (seulement le mois en cours ; les mois passés tiennent sur une ligne), Pourquoi ça a bougé, et au plus une alerte « À regarder » (compte incomplet, budget manquant ou vrai point rouge).
- **Mon argent** : ce que vous avez − crédits − impôts = net ; répartition actuelle et visée dans un seul bloc ; comptes ; crédits (immobiliers et autres, auparavant cachés). Nouvelles pages **Compte** (`#/e/…`), **Ligne** (`#/l/…`) et **Crédit** (`#/k/…`, coût total).
- **Mes coûts** : épargne possible en grand, revenus et catégories en barres ; page **Catégorie** (`#/n/c/…`) où chaque montant se modifie sur place ; grosses dépenses de l'année (ajout, modification, suppression) ; ce que coûte le patrimoine sur 20 ans, compte par compte.
- **Mes projets** : prochain objectif, liste, « Est-ce que ça passe ? » ; page **Projet** (`#/g/…`) avec l'effort mensuel, les comptes qui financent, modifier et supprimer. Calcul toujours net d'impôts.
- **Mon plan** : 2026 / 2027, l'année en colonnes ; page **Mois** (`#/s/m/année/mois`) avec Fait / Pas fait / Retirer ; mois passés regroupés (« Tous faits » / « Aucun ») ; « Arrêter » une série. Programmer un achat ou une mise de côté ouvre les écrans du questionnaire (recherche du titre, cours du jour). Une mise de côté « Pas faite » (`S.st[année].px`) n'est plus comptée comme épargnée.
- **Bouton +** : une liste par rubrique (compte, ligne, crédit, grosse dépense, projet, achat, mise de côté).
- **Réglages** : apparence en premier, puis questionnaire, inflation, données, cours en direct. Conseil du jour et médailles supprimés.
- **Supprimés** : anciens écrans Patrimoine, Frais, Budget, Objectifs, Stratégie, Santé, Classe, Louer ou acheter, simulateurs de frais et d'intérêts composés, calculateur Livret A, questionnaire express, diagramme de flux. 75 fonctions et 3 100 lignes retirées (9 319 → 6 224 lignes).
- **Saisie stricte** des montants dans les nouvelles pages : « 12abc » est refusé avec un message, l'ancienne valeur est gardée.
- **Données** : aucune migration. Seul ajout : `px` (mises de côté non faites) dans `S.st[année]`, facultatif.

Tests : `node tests/appli.e2e.js` : **69/69** (questionnaire complet écran par écran, reprise, tous les écrans à 320 px, saisies, calculs, bouton +, persistance, thème sombre, aucune erreur JS). Il remplace `tests/parcours-accueil.e2e.js`, qui datait de la version 1. Captures : `node tests/capture.js <dossier> '#/a' …` avec les données de `tests/demo-data.js`.

Non testé : cours en direct réels (le relais Google n'est pas joignable depuis l'environnement de test), Safari / iPhone réel, lecteur d'écran.

## Point de départ de la refonte (14/11/2026)
`index.html` est remplacé par la version la plus récente de l'appli (« Claude_code_20 », versions 2 à 18 du journal tenu hors dépôt).

---

# Parcours d'accueil guidé — journal des modifications

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | Application modifiée (fichier unique, à ouvrir dans le navigateur). |
| `original/test_3010.html` | Copie **inchangée** du fichier d'origine (retour arrière : le rouvrir à la place de `index.html`). |
| `original/diagnostic.txt` | Diagnostic fourni. |
| `tests/parcours-accueil.e2e.js` | Test navigateur (Playwright) du parcours complet + non-régression des vues. |

Les 122 fonctions de premier niveau d'origine sont toutes conservées ; 16 fonctions sont ajoutées (`wz*`, `openWizard`, `closeWizard`). Le « Questionnaire express » d'origine reste accessible depuis le bouton **Ajouter**.

## Le parcours

Fenêtres plein écran successives, une question à la fois, avec barre de progression en 4 chapitres, retour arrière, « passer » et « continuer plus tard ».

1. **Bienvenue** : présentation de l'application.
2. **Pourquoi cette application ?** : la logique en 6 temps (ce que j'ai → ce que ça coûte → ce que je dépense → capacité d'épargne → objectifs → plan d'achat).
3. **Comment ça se passe** : les 4 chapitres, durée, données locales, estimations indicatives.
4. **Chapitre 1 · Mon patrimoine**
   - choix des types d'enveloppes (tuiles) ;
   - cotations en direct (relais Google, facultatif ; même test de connexion qu'avant) ;
   - **une fenêtre par enveloppe** : nom, puis ses actifs (solde et taux pour un livret ; titres via la fenêtre « Ajouter un actif » existante pour PEA/CTO/crypto ; saisie manuelle intégrée pour assurance vie, épargne salariale, immobilier, crowdfunding, autres ; crédit immobilier rattaché au bien ; « j'ai un autre PEA » ; retrait) ;
   - crédits auto, conso, perso (éditeur de crédit existant) ;
   - bilan : brut, crédits, net, répartition, **avertissement si des lignes ne sont pas valorisées**.
5. **Chapitre 2 · Mes coûts & dépenses**
   - **une fenêtre par enveloppe** : fiscalité sur la plus-value, frais de l'enveloppe, frais de chaque ETF/fonds, avec estimation en direct ;
   - revenus nets mensuels ;
   - **une fenêtre par catégorie de dépenses** (catégories du budget existant, ajout de postes) ; rappel des mensualités de crédit dans « Logement » ;
   - dépenses annuelles ;
   - bilan : **capacité d'épargne** (même formule que l'onglet Budget : revenus − dépenses − provisions), diagramme de flux, frais des placements, impôts latents, courtage.
6. **Chapitre 3 · Mes objectifs** : création d'objectifs financés par les enveloppes (même modèle et même répartition sans double comptage que l'onglet Objectifs). L'écran affiche aussi la part déjà financée, l'effort mensuel restant et une alerte si le total dépasse la capacité d'épargne.
7. **Chapitre 4 · Ma stratégie** : achats mensuels (titre détenu, ETF du catalogue ou saisie libre avec type d'instrument), plan de l'année en cours ou de la suivante, provisions vers un livret, **calendrier sur 12 mois** comparé à revenus − dépenses, avec une alerte en cas de dépassement.
8. **Fin** : synthèse et rôle de chaque onglet → tableau de bord.

Le parcours s'ouvre seul pour un nouvel utilisateur. Il reprend à la même étape après fermeture ou rechargement. Une carte « Reprendre » apparaît sur l'accueil. On peut le relancer depuis **Ajouter** ou **Réglages**. Avec des données existantes, il ne s'ouvre pas tout seul et reprend les données sans rien effacer.

## Changements dans le code existant

| Zone | Changement | Raison |
|---|---|---|
| `ls.set()` / `save()` | Renvoient `true`/`false`. Un seul avertissement en cas d'échec d'écriture. | Diagnostic 5.7 : ne pas masquer un échec de sauvegarde. |
| `applyBuy()` | `kind: b.kind \|\| 'ETF'` | Diagnostic 5.3 : le type choisi lors de la planification est conservé. Les anciens ordres sans type gardent le comportement d'avant. |
| `vHome()` | Ouvre le nouveau parcours au lieu du questionnaire express pour un nouvel utilisateur ; carte « Reprendre ». | Accueil. |
| `render()` | Ne redessine pas la vue tant que le parcours est ouvert. | Évite les notifications et confettis de succès en rafale derrière le parcours (regroupés en un message à la fermeture). |
| `openAddMenu()`, `openSettingsModal()` | Bouton « Parcours guidé complet » / « Relancer le parcours ». | Accès au parcours. |
| `getIcon()` | Icônes `wallet`, `flag`, `clock`. | Écrans d'accueil. |
| Touche Échap | Ferme la fenêtre ouverte, sinon le parcours (progression enregistrée). | Accessibilité (diagnostic, tableau 8). |

## Schéma de données

- **Ajout** : `S.wz = { v: 1, at, open, done, hide, mk }` (progression du parcours). Champ facultatif : les anciennes sauvegardes et les anciens exports JSON restent compatibles, aucune migration n'est nécessaire.
- **Ajout** : champ facultatif `kind` sur les achats programmés (`S.st[année].b[i].kind`). Les ordres sans ce champ fonctionnent comme avant.
- Le parcours n'utilise que les structures existantes : `S.envs[].lines[]`, `e.tax`, `e.fee`, `l.fee`, `e.rate`, `e.avRate`, `l.loan`, `S.loans`, `S.bud`, `S.goals`, `S.st`.

## Tests réellement exécutés

- `node --check` sur le JavaScript extrait : OK.
- `node tests/parcours-accueil.e2e.js` (Chromium, Playwright) : **75/75 vérifications réussies**, aucune erreur JavaScript. Le test couvre :
  - le parcours complet sur mobile (390 px) : 3 enveloppes, ETF du catalogue et ligne manuelle via la fenêtre existante, bien avec crédit, livret, frais, budget, dépense annuelle, objectif, achats de l'année en cours et de la suivante, provision ;
  - la capacité d'épargne (3 500 − 400 − 100 − 870 = 2 130 €) ;
  - la saisie : « 10 000 » et « 10000,50 » acceptés, « 12abc » refusé sans écraser la valeur ;
  - le total partiel quand une ligne n'est pas valorisée ;
  - l'alerte de dépassement de capacité ;
  - la propagation du type `Action` par `applyBuy` ;
  - la persistance après rechargement, la non-réouverture une fois terminé, la reprise après rechargement, la carte « Reprendre » ;
  - un utilisateur existant (pas d'ouverture automatique, données intactes) ;
  - l'échec simulé du stockage local (badge et message) ;
  - l'absence de débordement horizontal à 320 px ;
  - le rendu de tous les onglets (Frais, Stratégie, Objectifs, Budget, Simulateur, enveloppe, objectif, accueil) après le parcours ;
  - des captures en mode sombre sur ordinateur.

Lancer : `node tests/parcours-accueil.e2e.js` (captures facultatives : `SHOTS=/chemin/ node …`).

## Non testé / limites restantes

- **Relais Google, Yahoo Finance, Eurostat** : pas de connexion réelle testée (recherche ISIN, cours en direct, test de connexion du relais).
- Pas de test sur Safari/iOS réel ni avec un lecteur d'écran.
- Diagnostic, **non traité** dans cette livraison : validation stricte de `pf()` dans toute l'application (seul le parcours valide strictement), import JSON avec validation, sauvegarde préalable et retour arrière (§6), pouvoir d'achat réel (§5.5), séparation dividendes réalisés / intérêts estimés dans `passiveCard()` (§5.4), taux du livret daté et paramétrable globalement (§5.8 ; le parcours indique seulement s'il s'agit de la valeur par défaut), zoom bloqué par la balise viewport et les gestes, frais de courtage dans les agrégats du tableau de bord (§5.2 ; le parcours les affiche à part), allocation partielle d'une enveloppe entre objectifs.
- Taux de fiscalité et de frais proposés (17,2 %, 30 %, 0,5 %…) : ce sont les **repères déjà présents dans l'application**, signalés comme indicatifs. Ils ne valent pas conseil fiscal.
