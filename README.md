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

Chaque utilisateur connecte **son propre** Google Drive depuis Paramètres → « Connecter Google Drive ».
L'appli utilise l'autorisation `drive.file` : elle n'accède qu'au fichier qu'elle a créé.
Voir la [politique de confidentialité](confidentialite.html).

Pour l'éditeur : le Client ID OAuth intégré se trouve dans `index.html` (`BUILTIN_CLIENT_ID`).
Dans Google Cloud Console, son origine JavaScript autorisée est `https://rkroman-86.github.io`.

## APK Android

Le dossier `android/` contient une **Trusted Web Activity** : une petite appli Android qui ouvre
`https://rkroman-86.github.io/stock/` en plein écran via Chrome (caméra, Google Drive et mises à jour fonctionnent comme sur le web).

- Compilée automatiquement par GitHub Actions à chaque modification de `android/` (ou via *Actions → APK Android → Run workflow*).
- Téléchargement : <https://github.com/rkroman-86/stock/releases/latest/download/gestion-stock.apk>
- Signature : `android/release.p12` (chiffré) ; mot de passe dans le secret GitHub `KEYSTORE_PASSWORD`.
- Plein écran sans barre d'adresse : le fichier `android/assetlinks.json` doit être publié à
  `https://rkroman-86.github.io/.well-known/assetlinks.json` (dépôt `rkroman-86.github.io`).
