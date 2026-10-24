# Gestion de stock

Application web de gestion de stock pour petite entreprise, utilisable sur téléphone :

- fiches produits (code-barres EAN-13 généré automatiquement, photo, prix HT/TTC, TVA, seuil d'alerte) ;
- entrées (achat fournisseur, retour, inventaire) et sorties (vente, don, inventaire) ;
- scan de codes-barres avec la caméra ;
- étiquettes image à partager vers l'appli de n'importe quelle imprimante (Phomemo, Tiny Print…) ;
- totaux du stock et des mouvements, exports CSV ;
- données enregistrées sur l'appareil et synchronisées dans Google Drive.

Hébergée sur GitHub Pages : la page est un fichier statique, **aucune donnée n'est envoyée à GitHub**.
Les données restent sur l'appareil et dans le fichier `gestion-stock-donnees.json` de votre Google Drive.

## Installation sur le téléphone

Ouvrez l'adresse GitHub Pages dans Chrome, puis menu ⋮ → **Installer l'application** (ou « Ajouter à l'écran d'accueil »).

## Google Drive

Dans Google Cloud Console, l'origine JavaScript autorisée de l'ID client OAuth doit être l'adresse GitHub Pages
**sans le chemin**, par exemple `https://votrecompte.github.io`.
