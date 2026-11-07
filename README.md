# Budget — mes finances, simplement, sur iPhone

Une appli web épurée en 4 onglets :

- **Patrimoine** : le total de ce que vous possédez moins ce que vous devez, la répartition (épargne, bourse, crypto, immobilier) et vos comptes. Livrets, assurance vie et immobilier se saisissent à la main ; PEA, compte-titres et cryptos contiennent des lignes (action, ETF, crypto) dont le cours s'actualise tout seul grâce au relais Google.
- **Budget** : ce qu'il reste ce mois-ci, où va l'argent, la liste des mouvements, et les charges annuelles (taxe foncière…) divisées par 12 pour savoir combien mettre de côté.
- **Objectifs** : un montant, une date, et combien épargner par mois. Un objectif peut suivre un compte (ex. Livret A).
- **Outils** : vos crédits (mensualité, reste à rembourser, déduit du patrimoine) et trois simulateurs : intérêts composés, louer ou acheter, mensualité de crédit.

Aucune inscription : les données restent sur le téléphone. Réglages → Exporter pour faire une sauvegarde.

## Cours en direct (facultatif)

Le fichier `relais-google.gs` est un petit script Google gratuit qui récupère les cours (Yahoo Finance) et permet de chercher un titre par ISIN ou par nom. Le mode d'emploi est dans l'appli : Patrimoine → ⚙︎ Réglages.

## Installer sur l'iPhone

1. Publier le dossier (GitHub Pages : Settings → Pages).
2. Ouvrir l'adresse dans **Safari**.
3. **Partager** → **Sur l'écran d'accueil**.

## Fichiers

- `index.html` — toute l'appli
- `relais-google.gs` — script du relais de cotations (à coller dans Google Apps Script)
- `sw.js` — fonctionnement hors connexion
- `manifest.webmanifest`, `icon*` — installation sur l'écran d'accueil
