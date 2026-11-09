# Pascal — première fiche d'animation

## État actuel
Le moteur `pascal-animation.js` est intégré au combat. Il sélectionne une pose et une image selon l'état réel de Pascal (marche, saut, frappe, etc.), mais **les dessins des poses ne sont pas encore produits**.

Pascal conserve son illustration originale lorsqu'aucune vraie frame n'est installée. Aucun effet d'ondulation, inclinaison, déformation ou reconstruction artificielle de son visage ne doit remplacer les sprites.

## Pose / nombre de vraies images
| Pose | Images | Lecture |
|---|---:|---|
| idle (attente) | 4 | 8 images/s, boucle |
| walk (marche) | 6 | 12 images/s, boucle |
| jump (saut) | 4 | 10 images/s, une fois |
| crouch (accroupi) | 2 | 8 images/s, boucle |
| guard (garde) | 2 | 8 images/s, boucle |
| punch (poing) | 4 | 14 images/s, une fois |
| kick (pied) | 5 | 12 images/s, une fois |
| special (spécial) | 6 | 12 images/s, une fois |
| hit (dégâts) | 3 | 10 images/s, une fois |
| ko (K.O.) | 5 | 8 images/s, une fois |
| victory (victoire) | 5 | 8 images/s, une fois |

Chaque pose utilise des images séparées `assets/fighters/pascal/<pose>/01.png`, `02.png`, etc. Le moteur accepte les frames uniquement quand le nombre exact attendu est chargé et valide.

## Validation artistique obligatoire
- Garder le visage, les vêtements, les couleurs et les proportions approuvés de Pascal.
- Fond transparent, ancrage au sol identique d'une image à l'autre.
- Aucun texte, logo ou décor dans les sprites.
- Rendu pixel art SNES cohérent, sans interpolation.
- Les poses doivent être dessinées **séparément**, pas obtenues en faisant pivoter ou onduler le même portrait.
- Conserver les images originales du personnage en l'état.

## Prochaines étapes
1. Préparer les vraies frames à partir du personnage source validé de Pascal.
2. Installer les groupes de frames via `ZikaPascalAnimation.install(pose,images)`.
3. Tester la lisibilité et l'alignement au sol pendant chaque mouvement.
4. Régler ensuite les timings et hitboxes des coups avec les animations réelles.
5. Après validation de Pascal, réutiliser le système pour les autres combattants.

**Ne pas marquer Pascal `spriteReady: true` avant l'intégration des dessins et les tests de jeu.**
