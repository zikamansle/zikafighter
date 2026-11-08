# Zika Fighter

Jeu de combat 2D du **Festival ZikaMansle**, inspiré de l'esthétique arcade 16 bits.

## Objectif
- 20 combattants humains et **Zika en personnage bonus**.
- 21 arènes thématiques fondées sur de véritables lieux et partenaires.
- Mouvements, coups, combos et attaques spéciales **différents pour chaque personnage**.
- Reproduction fidèle des photos et logos fournis, dans un style pixel art 16 bits.
- Version jouable navigateur (ordinateur et mobile), puis intégration possible à ZikaGames.


## Référence obligatoire pour toute reprise du projet

**[Checklist SNES des 58 tâches](docs/CHECKLIST_SNES_58_TACHES.md)** — Document de suivi permanent : le jeu est à reproduire exclusivement selon **Street Fighter II Turbo: Hyper Fighting sur Super Nintendo (1993)**. Chaque écran, animation, menu, transition, commande, musique et bruitage doit être vérifié sur la version SNES avant de cocher la tâche. Ne pas confondre avec d'autres versions. Conserver inchangés les visages, portraits, logos et autres éléments validés.

## État de réalisation — 8 novembre 2026
Le jeu reste **en développement**. Les écrans d'introduction, de menu, d'options, de sélection et un prototype de combat existent, mais **ne sont pas déclarés validés visuellement**.

- **PLAYER SELECT** : 20 portraits humains, grille 7–7–6 alignée à gauche, Zika verrouillé, affichage 4:3. Les portraits approuvés sont préservés.
- **Arènes** : bandeau horizontal inférieur avec les illustrations originales des 20 arènes accessibles ; la 21e (Royaume de Zika) est liée au bonus. Les images des arènes sont servies depuis leurs URL Wix référencées dans `stage-audio.js` ; elles ne sont pas des fichiers locaux du dépôt. Les 21 annonces audio sont présentes dans `assets/audio/`.
- **Combat prototype** : canvas et interface de scène 4:3 ; les fonds sont recadrés sans déformation. Les sprites animés définitifs, les six attaques indépendantes, les coups spéciaux propres à chaque combattant, l'IA définitive, les stages bonus et la campagne complète **restent à construire**. Ne pas confondre ce prototype et une partie conforme à SFII Turbo SNES.
- **Contrôles de non-régression** : `node tests/smoke-static.mjs`, exécuté automatiquement via GitHub Actions. Ils contrôlent la syntaxe, les fichiers, les dimensions et les références graphiques, mais ne remplacent pas les tests de rendu ni de son.

Pour l'ordre de travail exact et les 58 tâches ouvertes : consulter `docs/CHECKLIST_SNES_58_TACHES.md`.

## Dossiers
- `data/fighters.json` : combattants
- `data/stages.json` : arènes, réalisées en visuels ou prévues
- `docs/CAHIER_DES_CHARGES.md` : règles du développement

Le projet est indépendant de ZikaRun, ZikaQuest et du programme interactif.

## Publication et nettoyage des anciennes versions

Pour **chaque** modification visuelle ou audio publiée :

1. Modifier le numéro `BUILD` dans le petit script de tête de `index.html`.
2. Mettre ce même numéro dans les paramètres `?v=` des ressources JS/CSS/portraits qui ont changé. Les portraits intégrés dans les fichiers `data/approved-portrait-*.js` sont aussi concernés.
3. Le script de démarrage élimine les anciens caches applicatifs identifiés Zika Fighter et tente de désactiver un ancien service worker dédié au chemin du jeu ; il ne supprime pas les options de l'utilisateur et n'efface pas les caches des autres applications.
4. Ouvrir la version réellement publiée et vérifier en navigateur (y compris en fenêtre privée) que les noms, visages, arènes et curseurs affichés correspondent aux fichiers actuels. Une modification GitHub ne constitue pas une validation visuelle.

Les URL des images originales et les identifiants techniques `fabienne-1` et `fabienne-2` restent distincts ; les **noms publics** des deux combattantes sont simplement « Fabienne ».
