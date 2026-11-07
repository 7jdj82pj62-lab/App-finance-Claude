# Budget — appli finance simple pour iPhone

Une seule question : **combien me reste-t-il ce mois-ci ?**

- Un gros chiffre : ce qu'il reste (entrées − sorties)
- « Où va l'argent » : répartition des dépenses par catégorie
- La liste des mouvements (touchez une ligne pour la modifier ou la supprimer)
- Un seul bouton **+** pour ajouter une dépense ou un revenu

Aucune inscription, aucun serveur : les données restent sur le téléphone (stockage local du navigateur). Fonctionne hors connexion et suit le mode sombre de l'iPhone.

## Installer sur l'iPhone

1. Héberger le dossier (ex. GitHub Pages : Settings → Pages → branche `main`, dossier racine).
2. Ouvrir l'adresse dans **Safari**.
3. Bouton **Partager** → **Sur l'écran d'accueil**.

L'appli s'ouvre alors en plein écran, comme une app native.

> Les données sont liées à Safari sur cet appareil : effacer les données de navigation les supprime.

## Fichiers

- `index.html` — toute l'appli (HTML, CSS, JS)
- `manifest.webmanifest`, `icon*.png`, `icon.svg` — installation sur l'écran d'accueil
- `sw.js` — fonctionnement hors connexion
