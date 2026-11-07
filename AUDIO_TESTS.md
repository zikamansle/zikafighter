# Tests audio Zika Fighter (58 fichiers)

Les écrans OPTION MODE restent ceux validés. Les morceaux du pack sont utilisés uniquement si le dossier `assets/audio/` se trouve à côté des autres ressources du jeu.

## Installation locale

1. Télécharger le fichier `ZikaFighter_Pack_Audio_58_fichiers.zip` depuis la conversation.
2. Extraire le dossier `assets/audio/` directement à la racine de ce dépôt, au même niveau que `index.html`.
3. Lancer le jeu avec `Lancer-ZikaFighter-avec-son.bat` ou un serveur HTTP local.
4. Dans OPTION MODE : flèches haut/bas pour choisir, gauche/droite pour modifier, Entrée pour écouter, Échap pour revenir.

## Numérotation

- MUSIC TEST : 00 = arrêt ; 01 à 24 = vingt-quatre pistes musicales.
- S.E. TEST : 00 à 32 = trente-trois bruitages et voix.
- L'extrait long de sélection de personnages est fourni en supplément et n'ajoute pas de nouvelle ligne au menu.
- Le jeu utilise aussi les sons `round.mp3`, `fight.mp3`, `you-win-street-fighter.mp3`, `you-lose.mp3` et `perfect.mp3` quand le pack est installé.

Le fichier `assets/audio/manifest.json`, compris dans le ZIP, donne l'association exacte de chaque numéro à son MP3. Ces associations sont pratiques pour Zika Fighter : **elles ne certifient pas l'ordre historique des pistes sur la cartouche SNES**.

Les MP3 fournis ne sont pas publiés dans ce dépôt GitHub public ; ils sont à installer localement pour les tests. Sans ces fichiers, le menu continue de fonctionner mais les pistes absentes ne peuvent pas être jouées. Les boutons de volume supplémentaires restent absents de l'écran, comme demandé.
