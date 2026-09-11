# Refonte de la consultation des documents

## Objectif
Remplacer l’ouverture dans un nouvel onglet par une visionneuse intégrée, fiable et adaptée au téléphone, tout en conservant un téléchargement direct du fichier original.

## Ce qui sera construit
- Ajouter une visionneuse plein écran, ouverte depuis « Consulter », avec le titre du document, un bouton fermer/retour et un bouton télécharger toujours accessibles.
- Afficher les PDF avec un lecteur PDF intégré : chargement et erreurs visibles, navigation page précédente/suivante, compteur de pages, zoom avant/arrière et ajustement automatique à la largeur disponible.
- Afficher les images sans espace blanc superflu, centrées et limitées à la largeur de l’écran ; proposer un zoom au toucher et des commandes de zoom/réinitialisation.
- Prévoir un état clair pour les formats non prévisualisables (DOC/DOCX), avec téléchargement direct disponible.
- Remplacer le téléchargement via URL temporaire par le téléchargement du fichier privé sous forme de fichier, en conservant une extension et un nom propres.

## Optimisation mobile
- Utiliser toute la hauteur et la largeur disponibles sur téléphone, sans marge latérale ni débordement horizontal.
- Garder la barre d’actions compacte et fixe pendant le défilement du document.
- Calculer la largeur de rendu PDF depuis la zone visible afin que chaque page tienne dans l’écran.
- Autoriser le défilement vertical naturel dans la visionneuse et empêcher les contrôles ou contenus de modifier sa largeur.

## Détails techniques
- Ajouter `react-pdf`/PDF.js et configurer son worker côté navigateur pour éviter les pages PDF blanches.
- Créer un composant dédié `DocumentViewerDialog`, puis connecter les boutons « Consulter » et « Télécharger » du tableau de bord.
- Déduire le type de fichier depuis son chemin et sécuriser la création/révocation des URL locales utilisées pour les images et téléchargements.
- Conserver le stockage privé et les règles d’accès existantes ; aucune modification des comptes ou de la base de données.

## Vérification
- Vérifier la compilation et les erreurs d’exécution.
- Tester l’ouverture, la navigation, le zoom, la fermeture et le téléchargement avec un PDF et une image.
- Contrôler la mise en page sur téléphone et ordinateur, notamment l’absence de défilement horizontal et d’espace blanc excessif.
